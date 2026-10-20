const x=$json,flow=x.next_flow??'ROUTE_HUMAN';
const state=x.context?.facts??{};
let response=null;
if(flow==='FLOW_1_SERVICE')response='Olá!!\n\nSomos a *Click Mais Photo Cabine.*\nSeja bem vinda(o)!\n*Meu nome é Click*, sou a assistente virtual daqui da empresa e vou fazer agora mesmo o *seu orçamento!*\n\nPara qual serviço você precisa do orçamento?';
if(flow==='FLOW_2_PURPOSE')response='Legal!\n\n*Qual é o tipo ou finalidade da festa?*';
if(flow==='FLOW_3_DATE')response='Legal!\n\nQual a data de início da sua festa?';
if(flow==='FLOW_4_LOCALITY')response=state.city==='sao paulo'?'Em qual bairro ou região de São Paulo será a festa?':'Em qual cidade será a festa?';
if(flow==='FLOW_5_READY')response='Perfeito! Já tenho as informações necessárias para verificar o orçamento. Um instante, por favor.';
if(flow==='CLARIFY_CONFLICT')response='Encontrei informações diferentes sobre o evento. Poderia confirmar a informação correta?';
return {json:{...x,flow1_handoff:{next_flow:flow,draft_response:response,
  route_executable:true,draft_only:true,auto_send:false,
  ready_for_price:flow==='FLOW_5_READY'},effects:{whatsapp_reply:false,quote_calculation:false}}};
