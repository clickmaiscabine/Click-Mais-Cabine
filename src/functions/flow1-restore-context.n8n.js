const source=$('Normalizar WhatsApp').item.json;
const payload=$json??{};
const state=payload.state&&typeof payload.state==='object'&&!Array.isArray(payload.state)?payload.state:{};
return {json:{...source,state,human_lock:payload.human_lock===true,
  persistence_ref:{session_id:payload.session_id??null,customer_event_id:payload.customer_event_id??null,loaded:!!payload.found}}};