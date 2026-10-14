import { readFile, writeFile, mkdir } from 'node:fs/promises';
const kernel=(await readFile('src/functions/intake/intake.mjs','utf8')).replace(/export /g,'');
const code=(name,tail,all=false)=>({type:'n8n-nodes-base.code',version:2,config:{name,parameters:{mode:all?'runOnceForAllItems':'runOnceForEachItem',language:'javaScript',jsCode:kernel+'\n'+tail}},output:[{json:{route:'ASK_MISSING_FIELD',effects:{whatsapp_reply:false}}}]});
const condition=(name,expression)=>({type:'n8n-nodes-base.if',version:2.2,config:{name,parameters:{conditions:{combinator:'and',options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{leftValue:'EXPR:'+expression,rightValue:true,operator:{type:'boolean',operation:'true'}}]}}},output:[{json:{}}]});
const rpc=(name,fn,body)=>({type:'n8n-nodes-base.httpRequest',version:4.5,config:{name,parameters:{method:'POST',url:'https://tsuuqcodmyuwqxfwevps.supabase.co/rest/v1/rpc/'+fn,authentication:'predefinedCredentialType',nodeCredentialType:'supabaseApi',sendHeaders:true,headerParameters:{parameters:[{name:'Content-Profile',value:'business'},{name:'Accept-Profile',value:'business'}]},sendBody:true,contentType:'json',specifyBody:'json',jsonBody:'EXPR:'+body,options:{timeout:10000,response:{response:{fullResponse:true,neverError:true,responseFormat:'json'}}}},credentials:{supabaseApi:{id:'MDQZJj7pCequa6xj',name:'Supabase account'}}},output:[{json:{body:{status:'committed'},statusCode:200}}]});
const specs={
  start:{type:'n8n-nodes-base.executeWorkflowTrigger',version:1.2,config:{name:'Receive simulated or normalized ingress',parameters:{inputSource:'passthrough'}},output:[{json:{payload:{messages:[]}}}]},
  normalize:code('Normalize Meta envelope',"return $input.all().flatMap((item,index)=>normalizeIngress(item.json).map(normalization=>({json:{normalization},pairedItem:{item:index}})));",true),
  accepted:condition('Accept valid messages','{{ $json.normalization.accepted }}'),
  reject:code('Reject invalid envelope',"return {json:planIntake($json.normalization)};"),
  read:rpc('Read persisted context','get_quote_intake_context','{{ { p_message: $json.normalization.message_context } }}'),
  plan:code('Plan cumulative intake',"const normalization=$('Normalize Meta envelope').item.json.normalization;\nif($json.statusCode!==200) return {json:{normalization,plan:{route:'PERSISTENCE_BLOCKED',ready_for_quote_checks:false},snapshot:{},attempt:$runIndex,persistence_error:$json.body,requires_jev:false}};\nconst snapshot=$json.body;\nconst plan=planIntake(normalization,snapshot);\nconst requestContext=buildJevRequest(normalization.message_context,snapshot);\nreturn {json:{normalization,snapshot,plan,requestContext,attempt:$runIndex,requires_jev:plan.requires_jev && Object.keys(requestContext.request.questions).length>0}};"),
  jevGate:condition('Extract bounded semantic candidates','{{ $json.requires_jev === true }}'),
  jev:{type:'n8n-nodes-base.httpRequest',version:4.5,config:{name:'JEV bounded extraction',parameters:{method:'POST',url:'https://openrouter.ai/api/alpha/decisions',authentication:'predefinedCredentialType',nodeCredentialType:'openRouterApi',sendBody:true,contentType:'json',specifyBody:'json',jsonBody:'EXPR:{{ $json.requestContext.request }}',options:{timeout:15000,response:{response:{fullResponse:true,neverError:true,responseFormat:'json'}}}},credentials:{openRouterApi:{id:'Q2lOvNp2yO1Oh35O',name:'OpenRouter account'}},onError:'continueRegularOutput'},output:[{json:{statusCode:200,body:{answers:{}}}}]},
  map:code('Apply JEV choices',"const context=$('Plan cumulative intake').item.json;\nconst semantic=mapJevResponse($json.body,context.requestContext);\nreturn {json:{...context,plan:planIntake(context.normalization,context.snapshot,semantic),semantic_provider_failed:$json.statusCode!==200}};"),
  prepare:code('Prepare atomic commit',"return {json:$json};"),
  commitGate:condition('Persistence context available','{{ $json.plan.route !== "PERSISTENCE_BLOCKED" }}'),
  commit:rpc('Commit ficha atomically','commit_quote_intake_plan','{{ { p_plan: $json.plan } }}'),
  outcome:code('Guard commit result',"const context=$('Prepare atomic commit').item.json;\nconst stale=$json.body?.code==='40001';\nconst result=$json.body??{};\nreturn {json:{...context,retry_context:stale&&context.attempt<2,route:$json.statusCode===200 ? (result.route??result.status) : stale?'RETRY_EXHAUSTED':'PERSISTENCE_BLOCKED',persistence:result,ready_for_quote_checks:$json.statusCode===200&&result.ready_for_quote_checks===true,proposed_response:$json.statusCode===200?result.proposed_response??null:null,effects:{database_write:$json.statusCode===200&&result.effects?.database_write===true,whatsapp_reply:false,quote_calculation:false}}};"),
  retry:condition('Retry stale context','{{ $json.retry_context === true }}'),
  finish:code('Return next stage without dispatch',"const {requestContext,snapshot,...result}=$json;return {json:result};"),
};
function serialize(value){
  if(typeof value==='string'&&value.startsWith('EXPR:'))return 'expr('+JSON.stringify(value.slice(5))+')';
  if(Array.isArray(value))return '['+value.map(serialize).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.entries(value).map(([k,v])=>JSON.stringify(k)+':'+serialize(v)).join(',')+'}';
  return JSON.stringify(value);
}
specs.normalize.output=[{normalization:{accepted:true,message_context:{text:'Olá',sender_id:'5511000000001'} }}];
specs.plan.output=[{requires_jev:false,plan:{route:'ASK_MISSING_FIELD'},requestContext:{request:{model:'typesafe/jev-1.13',questions:{}}}}];
specs.prepare.output=[{plan:{route:'ASK_MISSING_FIELD'}}];
specs.outcome.output=[{retry_context:false,route:'ASK_MISSING_FIELD'}];
for(const spec of Object.values(specs)) spec.output=spec.output.map(v=>v.json??v);
const declarations=Object.entries(specs).map(([id,spec])=>'const '+id+' = '+(id==='start'?'trigger':id.endsWith('Gate')||['accepted','retry'].includes(id)?'ifElse':'node')+'('+serialize(spec)+');').join('\n');
const sdk=declarations+`\nexport default workflow('cm-wf-000-intake-lab','[LAB][INTAKE] CM-WF-000 — ficha cumulativa e próxima etapa')
 .add(start).to(normalize).to(accepted.onTrue(read).onFalse(reject))
 .add(read.to(plan).to(jevGate.onTrue(jev.to(map).to(prepare)).onFalse(prepare)))
 .add(prepare.to(commitGate.onTrue(commit.to(outcome).to(retry.onTrue(read).onFalse(finish))).onFalse(finish)))
 .group('Entrada',[normalize,accepted],{description:'Normaliza o envelope Meta e aceita somente mensagens válidas.'})
 .group('Ficha e interpretação',[read,plan,jevGate,jev,map,prepare,commitGate],{description:'Consulta o estado, aproveita os dados recebidos e extrai apenas candidatos autorizados.'})
 .group('Gravação e próxima etapa',[commit,outcome],{description:'Confere versões, grava a ficha e retorna a próxima decisão. Sem envio ao WhatsApp.'});\n`;
await mkdir('n8n/generated/intake',{recursive:true});
await writeFile('n8n/generated/intake/CM-WF-000.sdk.js',sdk);
await writeFile('n8n/generated/intake/node-configs.json',JSON.stringify(Object.values(specs).map(n=>({name:n.config.name,type:n.type,typeVersion:n.version,parameters:n.config.parameters})),null,2));
console.log('Generated intake SDK and node configs.');
