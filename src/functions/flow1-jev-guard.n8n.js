const original=$('FLOW1 — extrair dados').item.json;
const ans=$json.answers?.product_interest??{},choice=ans.choice??null,confidence=Number(ans.confidence??0);
const map={cabine_fotos:['cabine_fotos'],totem_fotos:['totem_fotos'],plataforma_360:['plataforma_360'],set_fotografico:['set_fotografico'],fotografo:['fotografo'],combo_cabine_plataforma:['cabine_fotos','plataforma_360'],combo_todos:['cabine_fotos','totem_fotos','plataforma_360']};
const fact={...original.extracted},proof={...original.evidence};
if(!fact.services?.length&&confidence>=0.8&&map[choice]&&!original.service_needs_choice){fact.services=map[choice];proof.services='jev_semantic_choice_'+confidence;}
return {json:{...original,extracted:fact,evidence:proof,jev:{choice,confidence,accepted:!!fact.services?.length,
  model:$json.model??'typesafe/jev-1.13'},effects:{database_write:false,whatsapp_reply:false}}};