import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeIngress, planIntake, buildJevRequest, mapJevResponse } from '../../src/functions/intake/intake.mjs';
import { processPayload,processMessage } from '../../src/adapters/intake/persistence.mjs';
let serial=0;
const payload = (text, sender='5511000000001',id=`sim-${++serial}`) => ({messages:[{id,from:sender,timestamp:'1791957600',type:'text',text:{body:text}}],metadata:{phone_number_id:'100000000001'}});
async function bootstrap(path) {
  const db = new PGlite(path);
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for(const filename of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) {
    await db.exec(await readFile('supabase/migrations/'+filename,'utf8'));
  }
  await db.exec(await readFile('supabase/functions/quote_intake.sql','utf8'));
  return db;
}
const intake = async (db,text,sender) => (await processPayload(db,payload(text,sender)))[0];

test('ficha persistida: sequência, combo, nome opcional, origem desconhecida e reinício',async()=>{
  const path = await mkdtemp(join(tmpdir(),'cmc-intake-'));
  let db=await bootstrap(path);
  try {
    let result=await intake(db,'Olá'); assert.equal(result.next_field,'service_interest');
    assert.equal(result.proposed_response.includes('Click Mais'),true);
    result=await intake(db,'Quero cabine de fotos'); assert.equal(result.next_field,'event_type');
    result=await intake(db,'É um casamento dia 24/01/2027'); assert.equal(result.next_field,'locality');
    const id=result.persistence.customer_event_id;
    await db.close(); db=new PGlite(path);
    result=await intake(db,'Em Suzano'); assert.equal(result.route,'QUOTE_CHECKS');
    assert.equal(result.persistence.customer_event_id,id);
    assert.equal(result.facts.acquisition_source,'unknown'); assert.equal(result.facts.customer_name,undefined);
    assert.equal(result.effects.whatsapp_reply,false);
    assert.equal((await db.query('select count(*)::int n from business.customer_events')).rows[0].n,1);
    assert.equal((await db.query('select commercial_stage,qualified_at from business.customer_events')).rows[0].commercial_stage,'PRE_QUOTE');
    result=await intake(db,'Quero também plataforma 360'); assert.equal(result.combo.rule,'combo_second_main_discount');
    assert.deepEqual(result.facts.service_interest,['cabine_fotos','plataforma_360']);
    result=await intake(db,'Não quero 360, quero só cabine'); assert.deepEqual(result.facts.service_interest,['cabine_fotos']);
    assert.equal((await db.query("select status from business.event_services where service_code='plataforma_360'")).rows[0].status,'cancelled');
  } finally {await db.close();await rm(path,{recursive:true,force:true});}
});
test('vários campos na primeira mensagem e origem sem atribuição pelo CTA',async()=>{
  const db=await bootstrap(); try {
    const r=await intake(db,'Quero um orçamento de cabine e plataforma para casamento em Suzano dia 24/01/2027');
    assert.equal(r.route,'QUOTE_CHECKS');assert.equal(r.proposed_response,null);assert.equal(r.facts.acquisition_source,'unknown');
    assert.equal(r.combo.main_count,2);assert.equal(r.combo.apply_price_here,false);
  }finally{await db.close();}
});
test('negação de produtos em todas as formas e negação após interesse anterior',()=>{
  for(const [text,expected] of [
    ['Não quero totem; quero só cabine.',['cabine_fotos']],
    ['Não quero cabine, quero plataforma',['plataforma_360']],
    ['Não quero 360',[]],['Sem cabine, quero totem',['totem_fotos']],
    ['Não tenho interesse em plataforma, quero cabine',['cabine_fotos']],
    ['Não quero cabine nem plataforma, quero totem',['totem_fotos']],
  ]) assert.deepEqual(planIntake(normalizeIngress(payload(text))[0]).facts.service_interest,expected,text);
});
test('JEV não escolhe entre datas conflitantes mesmo com confiança alta',()=>{
  const m=normalizeIngress(payload('Quero cabine dia 24/01/2027 ou 25/01/2027'))[0];
  const context=buildJevRequest(m.message_context,{});
  const r=planIntake(m,{},mapJevResponse({answers:{event_date:{choice:'c0',confidence:1}}},context));
  assert.equal(r.route,'CLARIFY_CONFLICT');assert.equal(r.facts.event_date,undefined);
});
test('idempotência e supressão de próxima pergunta repetida',async()=>{
  const db=await bootstrap(); try{
    const p=payload('Quero cabine');const first=(await processPayload(db,p))[0];
    const repeated=(await processPayload(db,p))[0];assert.equal(repeated.persistence.status,'duplicate');
    assert.equal((await db.query('select count(*)::int n from core.events')).rows[0].n,1);
    const r=await intake(db,'Olá');assert.equal(r.proposed_response,null);assert.equal(r.duplicate_response_suppressed,true);
    assert.equal(first.next_field,'event_type');
  }finally{await db.close();}
});
test('conflito preservado, confirmação explícita e histórico auditável',async()=>{
  const db=await bootstrap();try{
    await intake(db,'Quero cabine para casamento dia 24/01/2027 em Suzano');
    let r=await intake(db,'Dia 25/01/2027');assert.equal(r.route,'CLARIFY_CONFLICT');assert.equal(r.facts.event_date,'2027-01-24');
    r=await intake(db,'Olá');assert.equal(r.route,'CLARIFY_CONFLICT');assert.equal(r.proposed_response,null);
    r=await intake(db,'Confirmo 25/01/2027');assert.equal(r.route,'QUOTE_CHECKS');assert.equal(r.facts.event_date,'2027-01-25');
    const f=(await db.query("select fact_value,is_current from business.event_facts where fact_key='event_date' order by created_at")).rows;
    assert.equal(f.length,2);assert.equal(f.filter(x=>x.is_current).length,1);
  }finally{await db.close();}
});
test('datas incompletas, inválidas e múltiplas pedem esclarecimento',()=>{
  for(const text of ['Quero cabine dia 23/08','Quero cabine dia 31/02/2027','Quero cabine dia 24/01/2027 ou 25/01/2027']){
    const r=planIntake(normalizeIngress(payload(text))[0]);assert.equal(r.route,'CLARIFY_CONFLICT');assert.equal(r.facts.event_date,undefined);
  }
});
test('origem e nome só com declaração, perfil WhatsApp não comprova nome',async()=>{
  const db=await bootstrap();try{
    const r=await intake(db,'Me chamo Ana. Sou mãe da noiva. Vim pelo Instagram. Quero cabine para casamento dia 24/01/2027 em Suzano');
    assert.equal(r.facts.customer_name,'Ana');assert.equal(r.facts.acquisition_source,'instagram');
    assert.match(r.facts.relationship_to_event,/mãe/);
    const c=(await db.query('select display_name,relationship_type from business.contacts')).rows[0];
    assert.equal(c.display_name,'Ana');assert.equal(c.relationship_type,'unknown');
  }finally{await db.close();}
});
test('concorrência e snapshot obsoleto não perdem campos',async()=>{
  const db=await bootstrap();try{
    await Promise.all([intake(db,'Quero cabine'),intake(db,'É um casamento dia 24/01/2027'),intake(db,'Em Suzano')]);
    const snapshot=(await db.query('select business.get_quote_intake_context($1::jsonb) s',[JSON.stringify(normalizeIngress(payload(''))[0].message_context)])).rows[0].s;
    const r=planIntake(normalizeIngress(payload('Olá'))[0],snapshot);assert.equal(r.route,'QUOTE_CHECKS');
    assert.equal((await db.query('select count(*)::int n from business.customer_events')).rows[0].n,1);
  }finally{await db.close();}
});
test('vários eventos, contato pessoal, human lock e ciclo fora do escopo',async()=>{
  const db=await bootstrap();try{
    const r=await intake(db,'Quero cabine');const id=r.persistence.customer_event_id;
    await db.exec('update core.sessions set active_customer_event_id=null');
    await db.query('insert into business.customer_events(contact_id) select contact_id from business.customer_events where id=$1',[id]);
    let next=await intake(db,'Quero plataforma');assert.equal(next.route,'CLARIFY_EVENT');
    await db.query('update core.sessions set active_customer_event_id=$1',[id]);
    await db.query("insert into business.human_handoffs(customer_event_id,reason_code,source) values($1,'MANUAL_TEST','human')",[id]);
    next=await intake(db,'Quero plataforma');assert.equal(next.route,'HUMAN_LOCK');
    await db.exec("update business.human_handoffs set active=false; update business.customer_events set commercial_stage='GANHO'");
    next=await intake(db,'Quero plataforma');assert.equal(next.route,'EXISTING_LIFECYCLE');
    await db.exec("update business.contacts set contact_category='personal'");
    next=await intake(db,'Quero plataforma');assert.equal(next.route,'NONCOMMERCIAL');
  }finally{await db.close();}
});
test('envelope Meta bruto, normalizado, lotes e status',()=>{
  const p=payload('Olá');const raw={body:{entry:[{changes:[{value:p}]}]}};
  assert.deepEqual(normalizeIngress(raw),normalizeIngress(p));
  const second=payload('Quero cabine');assert.equal(normalizeIngress({entry:[{changes:[{value:p},{value:second}]}]}).length,2);
  assert.deepEqual(normalizeIngress({statuses:[{id:'status-sim'}]}),[]);
  const invalid=payload('Olá');delete invalid.messages[0].id;assert.equal(planIntake(normalizeIngress(invalid)[0]).route,'REJECT');
});
test('JEV fechado: data textual, campos permitidos, confidence e evidência',()=>{
  const m=normalizeIngress(payload('Evento é uma reunião de equipe. Cidade: Recife. Dia 24 de janeiro de 2027'))[0];
  const request=buildJevRequest(m.message_context,{});
  const mapped=mapJevResponse({answers:{event_date:{choice:'c0',confidence:0.99},event_type:{choice:'c0',confidence:0.98},locality:{choice:'c0',confidence:0.99}}},request);
  const r=planIntake(m,{},mapped);assert.equal(r.facts.event_date,'2027-01-24');assert.equal(r.facts.locality,'Recife');
  const bad=planIntake(m,{}, {fact_candidates:[{fact_key:'price',fact_value:100,confidence:1,metadata:{evidence:m.message_context.text}},{fact_key:'event_date',fact_value:'2028-01-24',confidence:1,metadata:{evidence:m.message_context.text}}]});
  assert.equal(bad.ignored.length,2);assert.equal(bad.facts.event_date,undefined);
  assert.equal(mapJevResponse({answers:{event_date:{choice:'c0',confidence:0.1}}},request).fact_candidates.length,0);
});
test('combo com mais de dois serviços aguarda humano, sem valor',()=>{
  const r=planIntake(normalizeIngress(payload('Quero cabine, totem e plataforma para casamento dia 24/01/2027 em Suzano'))[0],{localities:[{canonical_name:'Suzano'}]});
  assert.equal(r.route,'COMBO_REQUIRES_HUMAN');assert.equal(r.effects.quote_calculation,false);
});
test('cidade de residência não preenche localidade da festa',()=>{
  const r=planIntake(normalizeIngress(payload('Moro em Suzano. Quero cabine.'))[0],{localities:[{canonical_name:'Suzano'}]});assert.equal(r.facts.locality,undefined);
});
test('backend restrito: anon não executa funções de intake',async()=>{
  const db=await bootstrap();try{
    const roles=(await db.query("select has_function_privilege('anon','business.commit_quote_intake_plan(jsonb)','EXECUTE') anon,has_function_privilege('service_role','business.commit_quote_intake_plan(jsonb)','EXECUTE') backend")).rows[0];
    assert.equal(roles.anon,false);assert.equal(roles.backend,true);
  }finally{await db.close();}
});
test('backend service_role executa sem SECURITY DEFINER e transação rejeitada faz rollback',async()=>{
 const db=await bootstrap();try{
  await db.exec('set role service_role');
  const r=await intake(db,'Quero cabine');assert.equal(r.persistence.status,'committed');
  await db.exec('reset role');
  const m=normalizeIngress(payload('Quero cabine','5511000000099'))[0];
  const p=planIntake(m);
  p.operations.push({action:'UNAUTHORIZED',fact_key:'price',fact_value:10});
  await assert.rejects(db.query('select business.commit_quote_intake_plan($1::jsonb)',[JSON.stringify(p)]),/unauthorized_operation/);
  assert.equal((await db.query("select count(*)::int n from business.contacts where whatsapp_id='5511000000099'")).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from core.events where idempotency_key=$1',[m.message_context.idempotency_key])).rows[0].n,0);
 }finally{await db.close();}
});
