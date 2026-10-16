const original=$('FLOW1 — extrair dados').item.json;
const target=original.semantic_target;
const ans=target==='purpose'?$json.answers?.event_purpose??{}:$json.answers?.product_interest??{};
const choice=ans.choice??null,confidence=Number(ans.confidence??0);
const serviceMap={cabine_fotos:['cabine_fotos'],totem_fotos:['totem_fotos'],plataforma_360:['plataforma_360'],set_fotografico:['set_fotografico'],fotografo:['fotografo'],combo_cabine_plataforma:['cabine_fotos','plataforma_360'],combo_todos:['cabine_fotos','totem_fotos','plataforma_360']};
const purposes=['casamento','aniversario','debutante','empresarial','formatura'];
const fact={...original.extracted},proof={...original.evidence};
if(target==='service'&&!fact.services?.length&&confidence>=0.8&&serviceMap[choice]&&!original.service_needs_choice){
 fact.services=serviceMap[choice];proof.services='jev_semantic_choice_'+confidence;
}
if(target==='purpose'&&!fact.purpose&&confidence>=0.8&&purposes.includes(choice)){
 fact.purpose=choice;proof.purpose='jev_semantic_choice_'+confidence;
}
return {json:{...original,extracted:fact,evidence:proof,
 jev:{target,choice,confidence,accepted:(target==='purpose'?!!fact.purpose:!!fact.services?.length),model:$json.model??'typesafe/jev-1.13'},
 effects:{database_write:false,whatsapp_reply:false}}};