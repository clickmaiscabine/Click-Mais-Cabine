(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ClickMaisMachine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='1.0.0', TZ='America/Sao_Paulo';
const CATALOG=[
 ['ads.impressions','Impressões Ads','google_ads','count','sum'],['ads.clicks','Cliques no anúncio','google_ads','count','sum'],['ads.cost_brl','Investimento Ads','google_ads','BRL','sum'],['ads.conversions','Conversões configuradas Ads','google_ads','count','sum'],
 ['wix.sessions','Sessões no site','wix','count','sum'],['wix.unique_visitors','Visitantes únicos Wix','wix','count','non_additive'],['wix.contact_clicks','Cliques de contato no site','wix','count','sum'],['wix.forms_submitted','Formulários enviados','wix','count','sum'],
 ['gbp.profile_views','Visualizações do Perfil','google_business_profile','count','non_additive'],['gbp.website_clicks','Cliques do Perfil para o site','google_business_profile','count','sum'],['gbp.chat_clicks','Cliques no chat do Perfil','google_business_profile','count','sum'],['gbp.call_clicks','Cliques para ligar no Perfil','google_business_profile','count','sum'],
 ['crm.contacts','Novas oportunidades no WhatsApp','commercial_source','count','sum'],['crm.quotes_sent','Oportunidades com orçamento enviado','commercial_source','count','sum'],['crm.sales_confirmed','Vendas confirmadas na semana','commercial_source','count','sum'],['crm.contracts_signed','Contratos assinados na semana','commercial_source','count','sum'],
 ['finance.contracted_brl','Valor contratado na semana','finance','BRL','sum'],['finance.received_brl','Recebimentos conciliados da semana','finance','BRL','sum'],['billing.balance_brl','Saldo de faturamento no retrato','google_ads_billing','BRL','snapshot'],['reviews.new_reviews','Novas avaliações','google_business_profile','count','sum']
].map(([key,label,source,unit,aggregation])=>({key,label,source,unit,aggregation,definition_version:VERSION}));
const BY_KEY=Object.fromEntries(CATALOG.map(x=>[x.key,x]));
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>JSON.stringify(sortObject(x));
function sortObject(x){if(Array.isArray(x))return x.map(sortObject);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,sortObject(x[k])]));return x;}
function fail(message){throw new Error(message);}
function obj(v,n){if(!v||typeof v!=='object'||Array.isArray(v))fail(n+': objeto esperado.');}
function keys(v,allowed,n){for(const k of Object.keys(v))if(!allowed.includes(k))fail(n+': campo desconhecido '+k);}
function isoDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v;}
function isoTime(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&isoDate(v.slice(0,10))&&Number.isFinite(Date.parse(v));}
function addDays(v,n){const d=new Date(v+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function checkPeriod(p){obj(p,'period');keys(p,['start','end_exclusive','timezone'],'period');if(!isoDate(p.start)||!isoDate(p.end_exclusive)||p.timezone!==TZ)fail('Período ou fuso inválido.');if(new Date(p.start+'T00:00:00Z').getUTCDay()!==1||addDays(p.start,7)!==p.end_exclusive)fail('O molde cobre uma semana completa: segunda até segunda exclusiva.');}
function blank(start,producer='cm-marketing',mode='real'){
 const p={start,end_exclusive:addDays(start,7),timezone:TZ};checkPeriod(p);
 return {schema_version:VERSION,kind:'clickmais.weekly_snapshot',snapshot_id:'marketing|clickmais|'+start,revision:1,mode,period:p,collected_at:new Date().toISOString(),producer,metrics:Object.fromEntries(CATALOG.map(m=>[m.key,{value:null,status:'unknown',coverage:'unknown',source:m.source,definition_version:VERSION,evidence_refs:[]} ])),alerts:[],alert_coverage:'unknown',interventions:[],notes:''};
}
function validate(s){
 obj(s,'Ficha');keys(s,['schema_version','kind','snapshot_id','revision','mode','period','collected_at','producer','metrics','alerts','alert_coverage','interventions','notes'],'Ficha');
 if(s.schema_version!==VERSION||s.kind!=='clickmais.weekly_snapshot')fail('Formato de ficha não suportado.');checkPeriod(s.period);
 if(s.snapshot_id!=='marketing|clickmais|'+s.period.start)fail('snapshot_id não corresponde à semana.');
 if(!Number.isInteger(s.revision)||s.revision<1||!['real','demo'].includes(s.mode))fail('Revisão ou modo inválido.');
 if(!isoTime(s.collected_at)||typeof s.producer!=='string'||!s.producer.trim())fail('Informe coletado_em com fuso e produtor.');
 if(Date.parse(s.collected_at)<Date.parse(s.period.end_exclusive+'T00:00:00-03:00'))fail('O molde semanal só fecha depois do fim da semana em São Paulo.');
 if(typeof s.notes!=='string'||s.notes.length>10000)fail('Notas inválidas.');obj(s.metrics,'metrics');keys(s.metrics,CATALOG.map(m=>m.key),'metrics');
 for(const m of CATALOG){const a=s.metrics[m.key];obj(a,m.label);keys(a,['value','status','coverage','source','definition_version','evidence_refs'],m.key);
  if(a.source!==m.source||a.definition_version!==VERSION)fail(m.label+': fonte ou definição incompatível.');
  if(!['observed','unknown','blocked','not_applicable'].includes(a.status)||!['complete','partial','unknown'].includes(a.coverage))fail(m.label+': estado/cobertura inválido.');
  if(!Array.isArray(a.evidence_refs)||!a.evidence_refs.every(r=>typeof r==='string'&&r.trim()&&r.length<=2000))fail(m.label+': evidências inválidas.');
  if(a.status==='observed'){if(typeof a.value!=='number'||!Number.isFinite(a.value)||a.value<0)fail(m.label+': valor observado deve ser número não negativo.');if(m.unit==='count'&&m.key!=='ads.conversions'&&!Number.isInteger(a.value))fail(m.label+': contagem inteira esperada.');if(a.coverage==='unknown'||!a.evidence_refs.length)fail(m.label+': observação exige evidência e cobertura.');}
  else if(a.value!==null||a.coverage!=='unknown')fail(m.label+': dado ausente é null, com cobertura unknown.');
 }
 if(!['complete','partial','unknown'].includes(s.alert_coverage)||!Array.isArray(s.alerts)||!Array.isArray(s.interventions))fail('Alertas/intervenções inválidos.');
 const ids=new Set();for(const a of s.alerts){obj(a,'alerta');keys(a,['id','title','severity','state','owner','source_ref','emitted_at','due_at'],'alerta');if(typeof a.id!=='string'||!a.id.trim()||ids.has(a.id))fail('ID de alerta vazio ou repetido.');ids.add(a.id);if(!['high','normal'].includes(a.severity)||!['open','resolved'].includes(a.state))fail('Estado de alerta inválido.');for(const k of ['title','owner','source_ref'])if(typeof a[k]!=='string'||!a[k].trim())fail('Alerta exige '+k);if(!isoTime(a.emitted_at)||(a.due_at!==null&&!isoTime(a.due_at)))fail('Data de alerta inválida.');}
 const changes=new Set();for(const v of s.interventions){obj(v,'intervenção');keys(v,['id','date','description','owner','source_ref'],'intervenção');if(!isoDate(v.date)||v.date<s.period.start||v.date>=s.period.end_exclusive)fail('Intervenção deve pertencer à semana.');for(const k of ['id','description','owner','source_ref'])if(typeof v[k]!=='string'||!v[k].trim())fail('Intervenção exige '+k);if(changes.has(v.id))fail('Intervenção repetida.');changes.add(v.id);}
 return s;
}
function emptyArchive(){return {format:'clickmais.snapshot_archive',schema_version:VERSION,snapshots:[]};}
function unpack(input){if(Array.isArray(input))return input;if(input?.format==='clickmais.snapshot_archive'){obj(input,'arquivo');keys(input,['format','schema_version','snapshots'],'arquivo');if(input.schema_version!==VERSION||!Array.isArray(input.snapshots))fail('Arquivo histórico incompatível.');return input.snapshots;}return [input];}
function ingest(archive,input){
 const old=unpack(archive);const incoming=unpack(input);if(incoming.length>1000||old.length+incoming.length>10000)fail('Lote excede o limite do protótipo.');
 const result=emptyArchive(),index=new Map();let inserted=0,ignored=0;
 for(const s of old.concat(incoming)){validate(s);const k=s.mode+'|'+s.snapshot_id+'|'+s.revision;const prior=index.get(k);if(prior){if(canonical(prior)!==canonical(s))fail('Conflito: mesma semana/revisão com conteúdo diferente. Crie outra revisão.');}else{index.set(k,s);result.snapshots.push(clone(s));}}
 const counted=new Set(old.map(s=>s.mode+'|'+s.snapshot_id+'|'+s.revision));for(const s of incoming){const key=s.mode+'|'+s.snapshot_id+'|'+s.revision;if(counted.has(key))ignored++;else{inserted++;counted.add(key);}}
 result.snapshots.sort((a,b)=>a.mode.localeCompare(b.mode)||a.period.start.localeCompare(b.period.start)||a.revision-b.revision);
 return {archive:result,inserted,ignored};
}
function latest(archive,mode='real'){
 const map=new Map();for(const s of unpack(archive)){validate(s);if(s.mode!==mode)continue;const old=map.get(s.snapshot_id);if(!old||old.revision<s.revision)map.set(s.snapshot_id,s);}
 return [...map.values()].sort((a,b)=>a.period.start.localeCompare(b.period.start));
}
function value(s,key,complete=false){const m=s?.metrics[key];return m?.status==='observed'&&(!complete||m.coverage==='complete')?m.value:null;}
function ratio(s,numerator,denominator,multiplier=1){const n=value(s,numerator,true),d=value(s,denominator,true);return n===null||d===null||d===0?null:n/d*multiplier;}
function series(archive,key,options={}){
 if(!BY_KEY[key])fail('Métrica desconhecida.');const rows=latest(archive,options.mode||'real').filter(s=>(!options.from||s.period.start>=options.from)&&(!options.to||s.period.start<=options.to));if(!rows.length)return [];
 const start=rows[0].period.start,end=rows.at(-1).period.start;const map=new Map(rows.map(s=>[s.period.start,s]));const points=[];
 for(let d=start;d<=end;d=addDays(d,7)){const s=map.get(d),m=s?.metrics[key];points.push({date:d,end_exclusive:addDays(d,7),value:s?value(s,key):null,coverage:m?.coverage||'unknown',revision:s?.revision??null,definition_version:m?.definition_version??null});}
 if(options.normalized){const base=points[0]?.value;return points.map(p=>({...p,value:base===null||base===0?null:(p.value===null?null:p.value/base*100),base:base??null}));}return points;
}
function aggregate(archive,key,options={}){
 const m=BY_KEY[key];if(!m)fail('Métrica desconhecida.');if(m.aggregation!=='sum')return {value:null,reason:m.aggregation==='snapshot'?'Saldo é retrato; não somar.':'Únicos exigem consulta no período; não somar semanas.'};
 const rows=latest(archive,options.mode||'real').filter(s=>(!options.from||s.period.start>=options.from)&&(!options.to||s.period.start<=options.to));if(!rows.length)return {value:null,reason:'Sem medições.'};
 if(rows.some((s,i)=>value(s,key,true)===null||(i>0&&s.period.start!==addDays(rows[i-1].period.start,7))))return {value:null,reason:'Cobertura incompleta ou semana ausente.'};return {value:rows.reduce((sum,s)=>sum+value(s,key,true),0),reason:'Soma de semanas completas selecionadas, não um total de mês civil.'};
}
function activeAlerts(archive,mode='real'){
 const map=new Map();let coverage='unknown';for(const s of latest(archive,mode)){coverage=s.alert_coverage;for(const a of s.alerts)map.set(a.id,a);}return {alerts:[...map.values()].filter(a=>a.state==='open'),coverage};
}
function assemble(period,contributions,meta={}){
 checkPeriod(period);if(!Array.isArray(contributions)||!contributions.length)fail('Nenhuma contribuição fornecida.');let s=blank(period.start,meta.producer||'cm-marketing',meta.mode||'real');s.revision=meta.revision||1;s.collected_at=meta.collected_at||s.collected_at;
 const seen=new Map();for(const c of contributions){obj(c,'contribuição');keys(c,['source','period','collected_at','metrics'],'contribuição');checkPeriod(c.period);if(canonical(c.period)!==canonical(period)||!isoTime(c.collected_at)||Date.parse(c.collected_at)>Date.parse(s.collected_at))fail('Contribuição fora do período ou posterior à coleta.');obj(c.metrics,'contribuição.metrics');for(const [k,v]of Object.entries(c.metrics)){if(!BY_KEY[k]||BY_KEY[k].source!==c.source||v.source!==c.source)fail('Fonte não autorizada para '+k);if(seen.has(k)&&canonical(seen.get(k))!==canonical(v))fail('Contribuições conflitantes para '+k);seen.set(k,v);s.metrics[k]=clone(v);}}
 return validate(s);
}
return {VERSION,TZ,CATALOG,BY_KEY,canonical,isoDate,isoTime,addDays,blank,validate,emptyArchive,unpack,ingest,latest,value,ratio,series,aggregate,activeAlerts,assemble};
});
