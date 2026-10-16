const x=$json,p=x.body??x.payload??x,v=p.entry?.[0]?.changes?.[0]?.value??p.changes?.[0]?.value??p.value??p;
const m=v.messages?.[0]??x.message??null,contact=v.contacts?.[0]??{},meta=v.metadata??{};
const sid=x.sender_id??m?.from??contact.wa_id??null,id=x.message_id??m?.id??null;
const text=x.text??(m?.type==='text'?m?.text?.body:null);
const accepted=!!sid&&!!id&&typeof text==='string'&&text.length>0&&/^[0-9]{8,20}$/.test(String(sid));
return {json:{accepted,sender_id:sid,message_id:id,text:text??'',message:m,
  phone_number_id:meta.phone_number_id??null,message_type:m?.type??'text',
  occurred_at:m?.timestamp?new Date(Number(m.timestamp)*1000).toISOString():null,
  cta:{verified:false},contact_category:'unknown',
  validation_error:accepted?null:'invalid_missing_sender_message_or_nontext',
  effects:{whatsapp_reply:false}}};