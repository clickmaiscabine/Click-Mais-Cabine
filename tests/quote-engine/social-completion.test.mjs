import test from 'node:test';
import assert from 'node:assert/strict';
import {completeSocialExtraction,socialQualificationReply,socialDateAvailabilityReply,prepareSocialLabPresentation,composeSocialLabResponse} from '../../src/functions/social-lab.mjs';
import {planTrelloProjection} from '../../src/functions/trello-projection.mjs';
const services={names:{totem_fotos:'Totem de Fotos'},includes:{totem_fotos:['Fotos ilimitadas.']},general:['Designer incluso.'],proof_social:'https://g.page/click-mais-photo-cabine?share'};
const input=status=>({status:'ready',_routing:{},facts:{event_type:'debutante',event_date:'2026-11-05'},locality_result:{locality:{canonicalName:'Guarulhos'}},availability:{status,reservation_prompt_authorized:status==='preliminary_available'},quote_result:{status:'ready',items:[{lineType:'main',serviceCode:'totem_fotos',finalPix:1300}],customerVisible:{pix:1300,card:1540}},date_policy:{gift:{eligible:false}}});
for(const status of ['preliminary_available','fully_booked','unknown'])test('social presentation respects '+status,()=>{
 const r=composeSocialLabResponse(prepareSocialLabPresentation(input(status),services));
 assert.equal(r.status,'ready');assert.match(r.candidate_text,/1\.300,00/);assert.match(r.candidate_text,/1\.540,00/);assert.equal(r.candidate_text.includes('\\n'),false);
 assert.equal(r.candidate_text.includes('Gostaria de seguir com a tentativa de reserva para essa data?'),status==='preliminary_available');
 assert.match(r.candidate_text,/650,00/);assert.match(r.candidate_text,/Fotos ilimitadas/);assert.match(r.candidate_text,/avaliações no Google/);
});
test('human lock suppresses social commercial output',()=>{const x={...input('preliminary_available'),human_lock:true};assert.equal(composeSocialLabResponse(prepareSocialLabPresentation(x,services)).candidate_text,null)});
test('known service is acknowledged, next unknown question only',()=>{
 const r=socialQualificationReply({accepted:true,next_flow:'FLOW_2_PURPOSE',changed_keys:['services'],context:{introduced:true,facts:{services:['totem_fotos']}}});
 assert.equal(r,'Legal!\n\n*Qual é o tipo ou finalidade da festa?*');
});
test('social date uses the official start-date question',()=>{
 const r=socialQualificationReply({accepted:true,next_flow:'FLOW_3_DATE',context:{introduced:true,facts:{}}});
 assert.equal(r,'Legal!\n\nQual a data de início da sua festa?');
});
test('first social reply uses the approved greeting and open service question',()=>{
 const r=socialQualificationReply({accepted:true,next_flow:'FLOW_1_SERVICE',context:{facts:{}}});
 assert.match(r,/Somos a \*Click Mais Photo Cabine\.\*/);assert.match(r,/Para qual serviço você precisa do orçamento\?/);assert.doesNotMatch(r,/1\. Cabine/);
});
test('new social date is confirmed before locality is requested',()=>{
 const r=socialQualificationReply({accepted:true,next_flow:'FLOW_4_LOCALITY',changed_keys:['event_date'],context:{introduced:true,facts:{event_date:'2026-11-05'}}});
 assert.equal(r,'Anotei a data 05/11/2026. Confirma que é essa data para eu seguir com a consulta?');
});
test('social date availability confirmation has working choices and never claims certainty',()=>{
 const r=socialDateAvailabilityReply({eventDate:'2026-11-05',activeReservations:1});
 assert.match(r,/05\/11\/2026/);assert.match(r,/disponibilidade preliminar/);assert.match(r,/1\. 💯/);assert.match(r,/2\. Quero refazer/);assert.doesNotMatch(r,/\\n/);
});
test('a fully booked social date does not offer the continue choice',()=>{
 const r=socialDateAvailabilityReply({eventDate:'2026-11-05',activeReservations:2});
 assert.match(r,/lotada/);assert.match(r,/2\. Quero refazer/);assert.doesNotMatch(r,/1\. 💯/);
});
for(const next_flow of ['POST_QUOTE_RESPONSE','HUMAN_LOCK_NO_REPLY','FLOW_5_READY','DUPLICATE_NOOP'])test('no redundant social reply for '+next_flow,()=>assert.equal(socialQualificationReply({accepted:true,next_flow}),null));
test('conflict proposal reaches SQL and confirmation retains provenance',()=>{
 const r=completeSocialExtraction({sender_id:'5511956390586',text:'confirmo',state:{pending_conflicts:{event_date:{incoming:'2026-11-05',existing:'2026-10-24'}}},transport_origin:'lab_replay'},{category:'commercial',extracted:{},evidence:{}},{localities:[],aliases:[]});
 assert.equal(r.extracted.event_date,'2026-11-05');assert.equal(r.evidence._transport,'lab_replay');
});
test('social human request suppresses semantic extraction',()=>{
 const r=completeSocialExtraction({sender_id:'5511956390586',text:'quero falar com um atendente'}, {category:'commercial',extracted:{},requires_jev:true,evidence:{}},{localities:[],aliases:[]});
 assert.equal(r.requires_jev,false);assert.equal(r.evidence._handoff_reason,'HND-EXPLICIT-HUMAN');
});
test('official alias fills locality outside the old hardcoded city subset',()=>{
 const r=completeSocialExtraction({sender_id:'5511956390586',text:'a festa será em taiaçupeba'},{category:'commercial',extracted:{},evidence:{}},{localities:[{id:'1',canonical_name:'Mogi das Cruzes'}],aliases:[{alias:'taiaçupeba',locality_id:'1'}]});assert.equal(r.extracted.city,'mogi das cruzes');
});
const context=()=>({customer_event_id:'synthetic-event',commercial_stage:'ORCAMENTO',stage_version:2,source_event_type:'quote_sent',qualified_at:'2026-10-19',event_date:'2026-11-01',services:['Cabine de Fotos'],quote:{status:'presented',version:1,pix:5129.10,card:6255},list_directory:[{name:'ORÇAMENTO',id:'lab-list'}]});
test('reused Trello planner preserves cents and prevents pre-quote card',()=>{
 const r=planTrelloProjection(context()).json;assert.equal(r.status,'planned');assert.match(r.projection.description,/5\.129,10/);assert.match(r.projection.description,/EVENT_ID=synthetic-event/);
 assert.equal(planTrelloProjection({...context(),source_event_type:'quote_generated'}).json.status,'no_projection');
});
test('identical Trello projection produces no operations',()=>{
 const c=context(),p=planTrelloProjection(c).json.projection;
 const r=planTrelloProjection({...c,existing_projection:{card_id:'lab-card',list_name:'ORÇAMENTO',list_id:'lab-list',projection_version:p.projection_version,projection_hash:p.projection_hash}}).json;
 assert.equal(r.status,'in_sync');assert.deepEqual(r.operations,[]);
});
test('missing canonical Trello list blocks rather than maps to CONTATO',()=>assert.equal(planTrelloProjection({...context(),list_directory:[{name:'CONTATO',id:'legacy'}]}).json.status,'migration_required'));
