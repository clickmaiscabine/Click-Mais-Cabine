import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {corporateNext,qualificationReply} from '../../src/functions/corporate-intake.mjs';
const code=fs.readFileSync(new URL('../../n8n/generated/corporate-intake.generated.js',import.meta.url),'utf8');
const legacy=fs.readFileSync(new URL('../../src/functions/flow1-social-intake.n8n.js',import.meta.url),'utf8');
const run=(text,state={})=>new Function('$json',code)({text,message_id:'synthetic-case-1',sender_id:'synthetic',state}).json;
test('full corporate phrase: all known facts collected once',()=>{
 const r=run('Quero cabine de fotos para um evento empresarial de 3 dias, 2 períodos por dia, de 01/11/2026 a 03/11/2026, em Suzano.');
 assert.equal(r.extracted.purpose,'empresarial');assert.equal(r.extracted.dias_evento,3);assert.equal(r.extracted.periodos_por_dia,2);
 assert.deepEqual(r.extracted.event_dates,['2026-11-01','2026-11-02','2026-11-03']);assert.equal(r.extracted.city,'suzano');
 assert.equal(corporateNext(r.extracted),'FLOW_5_READY');
});
test('company anniversary uses canonical taxonomy over generic birthday',()=>assert.equal(run('cabine para aniversário da empresa').extracted.purpose,'empresarial'));
test('explicit human request carries the BR-001 reason without JEV',()=>{const r=run('Quero falar com um atendente',{facts:{purpose:'empresarial'}});assert.equal(r.evidence._handoff_reason,'HND-EXPLICIT-HUMAN');assert.equal(r.requires_jev,false);});
test('unknown days and periods are not defaulted',()=>{const r=run('cabine para evento empresarial em Suzano');assert.equal(r.extracted.dias_evento,undefined);assert.equal(corporateNext(r.extracted),'FLOW_CORPORATE_DAYS');});
test('numeric answer belongs only to the persisted corporate question',()=>{
 const r=run('3',{facts:{purpose:'empresarial',services:['cabine_fotos']},pending_question:'corporate_days'});assert.equal(r.extracted.dias_evento,3);assert.equal(r.extracted.periodos_por_dia,undefined);
});
test('periods/hours: 8 hours means two periods, not two machines',()=>{
 const r=run('8 horas por dia',{facts:{purpose:'empresarial',services:['cabine_fotos'],dias_evento:3},pending_question:'corporate_periods'});assert.equal(r.extracted.periodos_por_dia,2);assert.equal(r.extracted.services,undefined);
});
test('partial dates are accumulated without asking the known ones again',()=>{
 const state={facts:{purpose:'empresarial',services:['cabine_fotos'],dias_evento:3,periodos_por_dia:1,event_dates:['2026-11-01']},pending_question:'corporate_dates'};
 assert.deepEqual(run('02/11/2026 e 03/11/2026',state).extracted.event_dates,['2026-11-01','2026-11-02','2026-11-03']);
 assert.match(qualificationReply({accepted:true,next_flow:'CLARIFY_CORPORATE_DATES',context:{facts:state.facts}}),/restantes/);
});
test('dates/day inconsistency blocks readiness',()=>assert.equal(corporateNext({purpose:'empresarial',services:['cabine_fotos'],dias_evento:3,periodos_por_dia:1,event_dates:['2026-11-01'],city:'suzano'}),'CLARIFY_CORPORATE_DATES'));
test('four periods requires human',()=>assert.equal(corporateNext({purpose:'empresarial',services:['cabine_fotos'],dias_evento:1,periodos_por_dia:4}),'ROUTE_HUMAN'));
test('acknowledgment and next question in same message',()=>{
 const text=qualificationReply({accepted:true,next_flow:'FLOW_CORPORATE_PERIODS',changed_keys:['dias_evento'],context:{facts:{dias_evento:3}}});assert.match(text,/3 dia/);assert.match(text,/Quantos períodos/);
});
for(const next_flow of ['HUMAN_LOCK_NO_REPLY','DUPLICATE_NOOP','ROUTE_OPERATIONS'])test('no unsolicited response under '+next_flow,()=>assert.equal(qualificationReply({accepted:true,next_flow}),null));
for(const text of ['Quero cabine para casamento','Totem para aniversário em Suzano','2','Qual é a data?'])test('social extraction preserved: '+text,()=>{
 const input={text,message_id:'synthetic-case-1',sender_id:'synthetic',state:{}};
 assert.deepEqual(new Function('$json',code)(input).json,new Function('$json',legacy)(input).json);
});
