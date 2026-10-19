import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const sourceText = read('knowledge/sources/localidades-precos.approved.md');
const provenance = JSON.parse(read('knowledge/sources/localidades-precos.provenance.json'));
if (createHash('sha256').update(sourceText).digest('hex') !== provenance.sha256) throw new Error('official_snapshot_digest_mismatch');
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tiers = [...sourceText.matchAll(/^\| (T\d+) \| R\$([\d.]+) \|/gm)].map(m => ({ code:m[1], pix_base:Number(m[2].replaceAll('.', '')) }));
if (tiers.length !== 8 || new Set(tiers.map(t => t.code)).size !== 8) throw new Error('official_tier_parse_failed');
const localities = [], aliases = [];
let tier = null;
for (const line of sourceText.split('\n')) {
  if (/^## /.test(line)) tier = /^## (T\d+)\s*$/.exec(line)?.[1] ?? null;
  if (!tier || !line.startsWith('- ')) continue;
  const [name, aliasText] = line.slice(2).split(' — aliases aceitos: ');
  const normalized = normalize(name);
  localities.push({ id:normalized, canonical_name:name, normalized_name:normalized, pricing_tier_id:tier, status:'active' });
  if (aliasText) for (const alias of aliasText.split('; ')) aliases.push({locality_id:normalized, alias, normalized_alias:normalize(alias)});
}
const humanSection = sourceText.split('## Localidade que exige humano\n')[1]?.split('\n## ')[0];
if (!humanSection) throw new Error('official_human_locality_section_missing');
for (const match of humanSection.matchAll(/^- (.*?) — /gm)) {
  const name = match[1], normalized = normalize(name);
  localities.push({id:normalized,canonical_name:name,normalized_name:normalized,pricing_tier_id:null,status:'human_required'});
}
if (localities.length !== 234 || new Set(localities.map(l=>l.id)).size !== localities.length) throw new Error('official_locality_parse_failed');
const source = {...provenance, sha256:createHash('sha256').update(sourceText).digest('hex'), tiers, localities, aliases};
const inputs = [
  'src/functions/f2/utils.mjs', 'src/functions/f2/locality.mjs',
  'src/functions/f2/date-promotion.mjs', 'src/functions/f2/readiness.mjs',
  'src/functions/f2/pricing.mjs', 'src/functions/corporate-pricing.cjs',
  'src/adapters/quote-social.mjs', 'src/adapters/quote-engine.mjs'
];
function inline(name) {
  let code = read(name);
  code = code.replace(/^import[\s\S]*?;\n/gm, '');
  code = code.replace(/export (?=(function|const|class)\b)/g, '');
  if (name.endsWith('/utils.mjs')) code = code.replace(/function sha256\(value\) \{[\s\S]*?\n\}\n/, '');
  if (name.endsWith('.cjs')) code = code.replace(/^module\.exports = \{ calcularOrcamentoCorporativo \};\n?/m, '');
  if (/\b(import|export)\s|\brequire\s*\(|module\.exports|createHash\(/.test(code)) throw new Error('unbundled_dependency:'+name);
  return '\n// Source: '+name+'\n'+code;
}
const output = '// GENERATED. Run node scripts/build-quote-engine.mjs; do not edit.\n'+
  'const OFFICIAL_PRICING_SOURCE = '+JSON.stringify(source)+';\n'+inputs.map(inline).join('\n')+
  '\nreturn { json: runQuoteEngine($json, OFFICIAL_PRICING_SOURCE) };\n';
const target = path.join(root, 'n8n/generated/quote-engine.generated.js');
const workflowPath = path.join(root, 'n8n/workflows/f4/CM-WF-030.lab.json');
if (process.argv.includes('--check')) {
  if (read('n8n/generated/quote-engine.generated.js') !== output) throw new Error('generated_kernel_out_of_date');
  const workflow = JSON.parse(fs.readFileSync(workflowPath,'utf8'));
  if (workflow.nodes.find(n=>n.name==='Run F2 Quote Kernel')?.parameters.jsCode !== output) throw new Error('workflow_export_out_of_date');
} else {
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, output);
  if (fs.existsSync(workflowPath)) {
    const workflow=JSON.parse(fs.readFileSync(workflowPath,'utf8'));
    workflow.nodes.find(n=>n.name==='Run F2 Quote Kernel').parameters.jsCode=output;
    fs.writeFileSync(workflowPath,JSON.stringify(workflow,null,2)+'\n');
  }
}
console.log(JSON.stringify({source_revision:source.revision_id,localities:localities.length,tiers:tiers.length,bytes:Buffer.byteLength(output)}));
