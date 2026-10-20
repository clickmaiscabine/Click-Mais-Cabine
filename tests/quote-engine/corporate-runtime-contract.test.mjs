import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const f1=JSON.parse(read('n8n/workflows/CM-WF-020_corporate-f1-lab.json'));
const ingress=JSON.parse(read('n8n/workflows/CM-WF-000_meta-test-ingress-lab.json'));
const normalize=new Function('$json',f1.nodes.find(n=>n.name==='Normalizar WhatsApp').parameters.jsCode);
const fixture=()=>({sender_id:'5511956390586',phone_number_id:'1350381714825884',message_id:'synthetic-security-case',text:'synthetic',occurred_at:1792376775});
test('authorized TEST sender accepted and original epoch preserved',()=>{
 const r=normalize(fixture()).json;assert.equal(r.accepted,true);assert.equal(r.occurred_at,'2026-10-19T02:26:15.000Z');assert.equal(r.transport_origin,'lab_replay');
});
for(const overrides of [{sender_id:'5511999999999'},{phone_number_id:'production'},{text:''}])test('normalizer rejects unauthorized or incomplete input '+JSON.stringify(overrides),()=>assert.equal(normalize({...fixture(),...overrides}).json.accepted,false));
test('genuine transport provenance enters only through existing Meta ingress',()=>{
 const code=ingress.nodes.find(n=>n.name==='Encaminhar evento normalizado ao Flow1').parameters.jsCode;
 assert.equal(new Function('$json',code)({message_context:{}}).json.transport_origin,'meta_webhook');
 assert.match(f1.nodes.find(n=>n.name==='LAB — caso sintético sem envio').parameters.jsCode,/transport_origin:'lab_replay'/);
});
test('F1 never sends directly; persistent TEST queue remains the only outbound path',()=>{
 assert.ok(!f1.nodes.some(n=>n.type==='n8n-nodes-base.whatsApp'));
 assert.match(f1.nodes.find(n=>n.name==='Supabase — persistir e enfileirar TEST').parameters.url,/\/rpc\/cmc_test_enqueue_corporate_v1$/);
});
for(const [node,file]of [['FLOW1 — extrair dados','corporate-intake'],['Roteador — preparar próximo flow','corporate-router'],['Disponibilidade — validar todas datas','corporate-availability']])test('deployed F1 export matches generated '+file,()=>assert.equal(f1.nodes.find(n=>n.name===node).parameters.jsCode,read('n8n/generated/'+file+'.generated.js')));
test('exports contain no embedded credential bindings or pinned customer data',()=>{
 for(const file of ['CM-WF-000_meta-test-ingress-lab.json','CM-WF-020_corporate-f1-lab.json','CM-WF-031_corporate-presentation-lab.json','CM-WF-060_corporate-composer-lab.json','CM-WF-070_test-queue-lab.json']){
  const w=JSON.parse(read('n8n/workflows/'+file));assert.equal(w.pinData,undefined);assert.ok(w.nodes.every(n=>!n.credentials));
 }
});
