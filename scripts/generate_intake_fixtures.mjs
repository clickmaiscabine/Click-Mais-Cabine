import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir,writeFile } from 'node:fs/promises';
import { normalizeIngress,planIntake,buildJevRequest } from '../src/functions/intake/intake.mjs';
import { processPayload } from '../src/adapters/intake/persistence.mjs';
const db=new PGlite();
await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
for(const f of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
await db.exec(await readFile('supabase/functions/quote_intake.sql','utf8'));
const cases = [
 ['greeting','Olá','1'],
 ['many-fields','Quero cabine para casamento dia 24/01/2027 em Suzano','2'],
 ['sequence-service','Quero cabine de fotos','3'],
 ['sequence-date-purpose','É um aniversário dia 24/01/2027','3'],
 ['sequence-city','Em Suzano','3'],
 ['combo','Quero cabine e plataforma para casamento dia 24/01/2027 em Suzano','4'],
 ['negation','Não quero totem nem plataforma, quero só cabine','5'],
 ['source-unidentified','Gostaria de solicitar um orçamento de cabine para casamento dia 24/01/2027 em Suzano','6'],
 ['name-absent','Quero totem para casamento dia 24/01/2027 em Suzano','7'],
 ['conflict','Dia 25/01/2027','2'],
 ['conflict-persists','Olá','2'],
 ['conflict-resolved','Confirmo 25/01/2027','2'],
 ['semantic-extraction','Quero cabine. Evento é uma reunião de equipe. Cidade: Recife. Dia 24 de janeiro de 2027','8'],
 ['two-options','Quero cabine ou totem','9'],
 ['address','Quero cabine para casamento dia 24/01/2027 em Suzano. Endereço: Rua Exemplo, 100','10'],
];
const fixtures=[];
for(const [id,text,contact] of cases){
 const payload={messages:[{id:'sim-'+id,from:'55110000000'+contact.padStart(2,'0'),timestamp:'1791957600',type:'text',text:{body:text}}],metadata:{phone_number_id:'100000000001'}};
 const normalization=normalizeIngress(payload)[0];
 const snapshot=(await db.query('select business.get_quote_intake_context($1::jsonb) s',[JSON.stringify(normalization.message_context)])).rows[0].s;
 snapshot.localities=snapshot.localities.filter(l=>['suzano','mogi das cruzes','santa isabel'].includes(l.canonical_name));
 const requestContext=buildJevRequest(normalization.message_context,snapshot);
 const semantic={answers:Object.fromEntries(Object.keys(requestContext.options).map(key=>[key,{choice:'c0',confidence:0.99}]))};
 const [result]=await processPayload(db,payload,async()=>semantic);
 fixtures.push({id,payload,snapshot,semantic,commit_result:result.persistence,expected:{route:result.route,next_field:result.next_field??null,missing_required:result.missing_required??[],facts:result.facts,conflicts:result.conflicts,proposed_response:result.proposed_response,ready_for_quote_checks:result.ready_for_quote_checks}});
}
await writeFile('n8n/fixtures/intake/cases.json',JSON.stringify(fixtures,null,2)+'\n');
await db.close();console.log(`Generated ${fixtures.length} synthetic fixtures from isolated PostgreSQL transactions.`);
