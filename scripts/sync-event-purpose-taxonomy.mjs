/**
 * Keep the taxonomy and classifier as single sources of truth. This compiles them
 * into the existing Flow 1 Code node and its inactive candidate graph.
 * Run: node scripts/sync-event-purpose-taxonomy.mjs
 * DO NOT import/publish the candidate without human release approval.
 */
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,c)=>fs.writeFileSync(p,c);
const taxonomy=JSON.parse(read('src/taxonomy/event-purpose-v1.json'));
const engine=read('src/functions/classify-event-purpose-v1.js').replace(/if \(typeof module !== 'undefined'\)[^\n]*\n?$/,'');
const file='src/functions/flow1-intake.n8n.js', old=read(file);
const begin='// Data and logic compiled from the single versioned source; generated for the n8n Code node.\n';
const end='const purposeDecision=classifyPurposeV1({text,context:st},TAXONOMY_PURPOSE);\n';
const start=old.indexOf(begin),stop=old.indexOf(end);
if(start<0||stop<=start)throw Error('missing generated segment: verify existing Flow 1 before building');
const generated=begin+'const TAXONOMY_PURPOSE='+JSON.stringify(taxonomy)+';\n'+engine+'\n'+end;
const next=old.slice(0,start)+generated+old.slice(stop+end.length);
const sdkPath='n8n/quote-flow1-orchestrator.workflow-sdk.js';
const sdk=read(sdkPath);
const oldString=JSON.stringify(old.trim()),newString=JSON.stringify(next.trim());
if(!sdk.includes(oldString))throw Error('SDK drift: refuses to overwrite unrecognized node');
const nextSdk=sdk.replace(oldString,newString);
const draftPath='n8n/quote-flow1-taxonomy-v1.draft.n8n.json';
const graph=JSON.parse(read(draftPath)),classifier=graph.nodes.find(n=>n.name==='FLOW1 — extrair dados');
const guard=graph.nodes.find(n=>n.name==='Validar resposta JEV');
if(!classifier||!guard||graph.active!==false)throw Error('unsafe or unrecognized lab graph');
classifier.parameters.jsCode=next;
guard.parameters.jsCode=read('src/functions/flow1-jev-guard.n8n.js');
write(file,next);write(sdkPath,nextSdk);write(draftPath,JSON.stringify(graph,null,2)+'\n');
console.log('Taxonomy '+taxonomy.version+' synced; no live n8n, Supabase or Meta changes.');
