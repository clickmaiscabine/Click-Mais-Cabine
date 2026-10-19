import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const engine=read('n8n/generated/quote-engine.generated.js');
const official=JSON.parse(engine.split('\n')[1].slice('const OFFICIAL_PRICING_SOURCE = '.length,-1));
const taxonomy=JSON.parse(read('src/taxonomy/event-purpose-v1.json'));
const classifier=read('src/functions/classify-event-purpose-v1.js').replace(/^if \(typeof module[^\n]*$/m,'');
const pure=read('src/functions/corporate-intake.mjs').replace(/^import[^\n]*\n/gm,'').replace(/export (?=function)/g,'');
const commercial=read('src/functions/corporate-presentation.mjs').replace(/export (?=function)/g,'');
const serviceText=read('knowledge/sources/servicos-inclusos.approved.md');
const bullets=heading=>{const section=serviceText.split('## '+heading+'\n')[1]?.split('\n## ')[0]??'';return [...section.matchAll(/^- (.+)$/gm)].map(m=>m[1]);};
const names={cabine_fotos:'Cabine de Fotos',totem_fotos:'Totem de Fotos',set_fotografico:'Set Fotográfico',plataforma_360:'Plataforma 360',fotografo_evento:'Fotógrafo para evento'};
const general=bullets('Diferenciais gerais'),photo=bullets('Cabine de Fotos, Totem de Fotos e Set Fotográfico');
const services={names,general,includes:{cabine_fotos:photo,totem_fotos:photo,set_fotografico:photo,plataforma_360:bullets('Plataforma 360'),fotografo_evento:general},proof_social:serviceText.match(/Avaliações no Google: (https:\/\/\S+)/)?.[1]};
if(!services.proof_social||!photo.length)throw Error('approved_service_parse_failed');
const outputs={
  'n8n/generated/corporate-intake.generated.js':`const TAXONOMY=${JSON.stringify(taxonomy)};\nconst OFFICIAL=${JSON.stringify(official)};\n${classifier}\n${pure}\nconst legacy=(function($json){\n${read('src/functions/flow1-social-intake.n8n.js')}\n})($json).json;\nreturn {json:qualifyCorporate($json,legacy,TAXONOMY,OFFICIAL)};\n`,
  'n8n/generated/corporate-router.generated.js':`${pure}\nconst x=$json;\nif(x.context?.facts?.purpose!=='empresarial'){\n${read('src/functions/flow1-social-router.n8n.js')}\n}\nreturn {json:{...x,corporate_route:true,draft_response:qualificationReply(x),ready_for_price:x.next_flow==='FLOW_5_READY'}};\n`
};
outputs['n8n/generated/corporate-availability.generated.js']=commercial+'\nconst context=$("Supabase — contexto motor TEST").first().json;\nconst cards=$input.all().map(x=>x.json);\nreturn [{json:{...context,availability:assessAvailability(context.event_dates,context.reservations,cards,$now.toISO(),"5ea1dc2cb85a031b5c5e68f9")}}];\n';
outputs['n8n/generated/corporate-presentation.generated.js']=`const SERVICES=${JSON.stringify(services)};\n${commercial}\nif($json.quote_result?.corporate||($json._routing&&$json.facts?.event_type==='empresarial'))return {json:prepareCorporatePresentation($json,SERVICES)};\nreturn (function($json){${read('src/functions/quote-presentation-legacy.n8n.js')}\n})($json);\n`;
outputs['n8n/generated/corporate-composer.generated.js']=commercial+`\nif($json.presentation?.corporate||($json._routing&&$json.facts?.event_type==='empresarial'))return {json:composeCorporateResponse($json)};\nreturn (function($json){${read('src/functions/response-composer-legacy.n8n.js')}\n})($json);\n`;
for(const [p,c]of Object.entries(outputs)){
 if(process.argv.includes('--check')){if(read(p)!==c)throw Error('generated_out_of_date:'+p);}
 else fs.writeFileSync(new URL(p,root),c);
}
console.log('Corporate intake/router generation verified.');
