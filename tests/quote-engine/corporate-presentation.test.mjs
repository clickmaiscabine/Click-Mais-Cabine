import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessAvailability,prepareCorporatePresentation,composeCorporateResponse} from '../../src/functions/corporate-presentation.mjs';

const dates=['2026-11-01','2026-11-02','2026-11-03'],list='synthetic-list',clock='2026-10-19T02:26:17Z';
const card=(id,date)=>({id,idList:list,closed:false,name:date+' synthetic'});
const unrelated=Array.from({length:5},(_,i)=>card('unrelated-'+i,'2027-01-01'));
const row=(id,date,status='ativa')=>({trello_card_id:id,data_evento:date,status});
const assess=(rows=[],cards=unrelated)=>assessAvailability(dates,rows,cards,clock,list);
test('all dates are consulted even with zero reservations',()=>{
 const a=assess();assert.equal(a.status,'preliminary_available');assert.deepEqual(a.dates.map(d=>d.date),dates);
 assert.equal(a.freshness_evidence,'live_trello_read_matches_supabase_for_all_event_dates');
});
test('one active reservation remains preliminary; inactive rows do not count',()=>{
 const a=assess([row('one',dates[1]),row('inactive',dates[2],'cancelada')],[...unrelated,card('one',dates[1])]);
 assert.equal(a.status,'preliminary_available');assert.deepEqual(a.dates.map(d=>d.active_reservations),[0,1,0]);
});
test('a busy middle date blocks the entire period',()=>{
 const a=assess([row('a',dates[1]),row('b',dates[1])],[...unrelated,card('a',dates[1]),card('b',dates[1])]);
 assert.equal(a.status,'fully_booked');assert.equal(a.reservation_prompt_authorized,false);assert.equal(a.claim_authorized,false);
});
test('no updates to reservations are needed to prove a successful fresh read',()=>assert.equal(assess().checked_at,clock));
for(const [name,cards]of [['failure',[{error:'network'}]],['empty',[]],['incomplete',[...unrelated,{...card('bad',dates[0]),closed:true}]],['invalid date',[...unrelated,card('bad','2026-02-30')]]])test('agenda '+name+' gives unknown without inventing availability',()=>{
 const a=assess([],cards);assert.equal(a.status,'unknown');assert.equal(a.claim_authorized,false);
});
test('successful source read with out-of-sync mirror gives unknown',()=>assert.equal(assess([row('missing',dates[0])]).reason,'AGENDA_MIRROR_OUT_OF_SYNC'));
const generated=path=>fs.readFileSync(new URL('../../n8n/generated/'+path,import.meta.url),'utf8');
const engine=generated('quote-engine.generated.js');
const source=JSON.parse(engine.split('\n')[1].slice('const OFFICIAL_PRICING_SOURCE = '.length,-1));
function quote(){
 const result=new Function('$json',engine)({facts:{event_type:'empresarial',service_interest:['cabine_fotos'],locality:'suzano',dias_evento:3,periodos_por_dia:2,event_dates:dates,data_inicio:dates[0],data_fim:dates[2]},reference_date:'2026-10-19',services:[{code:'cabine_fotos',category:'main',quantity:1,quoteableAutomatically:true}],localities:source.localities,locality_aliases:source.aliases,pricing_tiers:source.tiers.map(t=>({...t,id:t.code})),pricing_source:{file_id:source.file_id,revision_id:source.revision_id}}).json;
 assert.equal(result.status,'ready');return result;
}
const presentationCode=generated('corporate-presentation.generated.js'),composerCode=generated('corporate-composer.generated.js');
const compose=(input,availability=assess())=>new Function('$json',composerCode)(new Function('$json',presentationCode)({...input,availability}).json).json;
test('end-to-end pure presentation uses BR-002 amounts and real line breaks',()=>{
 const r=compose(quote()),s=r.candidate_text.replaceAll('\u00a0',' ');
 assert.equal(r.status,'ready');assert.match(s,/6\.255,00/);assert.match(s,/5\.129,10/);assert.match(s,/2\.564,55/);
 assert.match(s,/3 dia\(s\).*2 período\(s\).*8h/);for(const d of dates)assert.ok(s.includes(d.split('-').reverse().join('/')));
 assert.ok(s.endsWith('Gostaria de seguir com a tentativa de reserva para essa data?'));assert.ok(s.includes('\n'));assert.ok(!s.includes('\\n'));
 assert.ok(!/álbum|brinde|18%|500 pessoas|5 estrelas/i.test(s));assert.match(s,/avaliações no Google/);
});
for(const status of ['fully_booked','unknown'])test('normal quote without invitation under '+status,()=>{
 const r=compose(quote(),{status,reservation_prompt_authorized:false,claim_authorized:false});
 assert.equal(r.status,'ready');assert.ok(!r.candidate_text.includes('Gostaria de seguir'));assert.equal(r.claimed_prices.card,6255);
});
test('human lock blocks commercial text even with a ready quote',()=>assert.equal(compose({...quote(),human_lock:true}).candidate_text,null));
test('engine human-required result preserves routing and handoff request through both wrappers',()=>{
 const r=compose({status:'human_required',facts:{event_type:'empresarial'},_routing:{session_id:'synthetic'},quote_result:null,requested_actions:[{action:'CREATE_HUMAN_TASK',reason_codes:['LOCALITY_NOT_FOUND']}],blockers:['LOCALITY_NOT_FOUND']});
 assert.equal(r.status,'human_required');assert.equal(r._routing.session_id,'synthetic');assert.equal(r.candidate_text,null);assert.equal(r.requested_actions[0].action,'CREATE_HUMAN_TASK');
});
test('oversized or literal newline commercial content is blocked',()=>{
 const base=compose(quote());
 for(const item of ['x'.repeat(5000),'bad\\nformat'])assert.equal(composeCorporateResponse({...base,presentation:{...base.presentation,includes:[item]}}).status,'blocked');
});
for(const stage of ['presentation','composer'])test('social '+stage+' fallback preserved exactly',()=>{
 const original=fs.readFileSync(new URL('../../src/functions/'+(stage==='presentation'?'quote-presentation-legacy.n8n.js':'response-composer-legacy.n8n.js'),import.meta.url),'utf8');
 const wrapper=stage==='presentation'?presentationCode:composerCode;
 for(const input of [{},{status:'blocked'},{status:'ready',human_lock:true}])assert.deepEqual(new Function('$json',wrapper)(input),new Function('$json',original)(input));
});
