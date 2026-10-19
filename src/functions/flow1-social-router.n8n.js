const x=$json,flow=x.next_flow??'ROUTE_HUMAN';
const state=x.context?.facts??{};
let response=null;
if(flow==='FLOW_1_SERVICE')response='Olá! Sou a Click, assistente virtual da Click Mais Cabine. 😊 Qual serviço deseja orçar?\n1. Cabine de Fotos\n2. Totem de Fotos\n3. Plataforma 360\n4. Set Fotográfico\n5. Fotógrafo';
if(flow==='FLOW_2_PURPOSE')response='Para qual ocasião será o serviço?\n1. Casamento\n2. Aniversário\n3. Debutante (15 anos)\n4. Evento empresarial';
if(flow==='FLOW_3_DATE')response='Qual a data completa da festa (dia, mês e ano)?';
if(flow==='FLOW_4_LOCALITY')response=state.city==='sao paulo'?'Em qual bairro ou região de São Paulo será a festa?':'Em qual cidade será a festa?';
if(flow==='FLOW_5_READY')response='Perfeito! Já tenho as informações necessárias para verificar o orçamento. Um instante, por favor.';
if(flow==='CLARIFY_CONFLICT')response='Encontrei informações diferentes sobre o evento. Poderia confirmar a informação correta?';
return {json:{...x,flow1_handoff:{next_flow:flow,draft_response:response,
  route_executable:true,draft_only:true,auto_send:false,
  ready_for_price:flow==='FLOW_5_READY'},effects:{whatsapp_reply:false,quote_calculation:false}}};
