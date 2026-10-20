export const LAB_BOARD='6ad446503b529e753ac4b878';
export const LAB_LISTS=[{name:'ORÇAMENTO',id:'6ad446552feeb154f01a96a0'},{name:'RESPOSTA',id:'6ad675af00e712f1799d7693'}];

// Reconcile a complete board read BEFORE every create, including expired leases.
// This recovers an accepted Trello request whose response was lost.
export function reconcileLabProjection(claim,cards,planner) {
  const blocked=reason=>({status:'blocked',reason,write:false});
  if(claim?.lab_scope!==true||claim.board_id!==LAB_BOARD||!claim.claim_token||!claim.customer_event_id)return blocked('NOT_AUTHORIZED_LAB_CLAIM');
  if(!Array.isArray(cards)||cards.length>=1000||cards.some(c=>c.error||c.idBoard!==LAB_BOARD))return blocked('BOARD_READ_INCOMPLETE');
  const id=claim.customer_event_id;
  if(!/^[0-9a-f-]{36}$/i.test(id))return blocked('INVALID_EVENT_ID');
  const marker=new RegExp('(?:EVENT_ID=|Customer event ID:\\s*|customer_event_id[=:\\s]+)'+id+'(?:\\s|$)','i');
  const matches=cards.filter(c=>marker.test(c.desc??''));
  if(matches.length>1)return blocked('DUPLICATE_EVENT_CARDS_REQUIRE_REVIEW');
  const mapped=claim.existing_projection?.card_id;
  const existing=mapped?cards.find(c=>c.id===mapped):matches[0];
  if(mapped&&(!existing||!marker.test(existing.desc??'')))return blocked('MAPPING_CARD_DRIFT_REQUIRES_REVIEW');
  if(existing?.closed)return blocked('ARCHIVED_CARD_REQUIRES_REVIEW');
  const existing_projection=existing?{...(claim.existing_projection??{}),card_id:existing.id,list_id:existing.idList,list_name:LAB_LISTS.find(l=>l.id===existing.idList)?.name}:null;
  const planned=planner({...claim,list_directory:LAB_LISTS,existing_projection}).json;
  if(!planned.projection)return blocked(planned.blockers?.join('|')??'NO_PROJECTION');
  const projection={...planned.projection,quote_id:claim.quote.id};
  // Record both the versioned plan and actual receipt. No-op can repair mapping.
  const unchanged=existing&&existing.name===projection.title&&existing.desc===projection.description&&existing.idList===projection.target_list_id;
  return {...claim,status:unchanged?'in_sync':'planned',write:!unchanged,create:!existing,
    card_id:existing?.id,existing_card:existing,projection,
    request:{p_customer_event_id:id,p_claim_token:claim.claim_token,p_projection:projection}};
}
