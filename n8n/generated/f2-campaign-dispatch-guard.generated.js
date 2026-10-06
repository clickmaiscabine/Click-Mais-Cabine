// GENERATED ADAPTER FOR n8n CODE NODE.
// Canonical base: src/functions/f2/response-guard.mjs
// Campaign layer: approval snapshot + suppression/human_lock + Meta window/template.
// LAB policy: SEND_ENABLED=false and CAMPAIGN_SEND_ENABLED=false are hard-forced.

const INTERNAL_TIER_PATTERN = /\bT\d{3,5}\b/i;
const MONEY_PATTERN = /R\$\s*\d/i;

function pricesMatch(claimedPrices, customerVisible) {
  if (!claimedPrices || !customerVisible) return false;
  const normalize = (value) => Math.round(Number(value) * 100);
  if (!Number.isFinite(Number(claimedPrices.pix)) || !Number.isFinite(Number(claimedPrices.card))) return false;
  return normalize(claimedPrices.pix) === normalize(customerVisible.pix) &&
    normalize(claimedPrices.card) === normalize(customerVisible.card);
}
function extractLinks(text) {
  return String(text ?? "").match(/https?:\/\/[^\s<>()]+/g) ?? [];
}
function isAllowedLink(link, allowedLinks) {
  return allowedLinks.some((allowed) => allowed.endsWith("*")
    ? link.startsWith(allowed.slice(0,-1))
    : link === allowed);
}
function evaluateResponseGuard({
  humanLock=false, actionAuthorized=false, candidateText="", claimedPrices=null,
  quoteResult=null, availabilityClaim="none", reservationConfirmed=false,
  askedFactKeys=[], currentFacts={}, containsPii=false, containsSecret=false,
  allowedLinks=[], whatsappWindowOpen=false, isCampaign=false,
  campaignApproved=false, sendEnabled=false
}) {
  const blockers=[];
  if(humanLock) blockers.push("HUMAN_LOCK_ACTIVE");
  if(!actionAuthorized) blockers.push("ACTION_NOT_AUTHORIZED");
  if(INTERNAL_TIER_PATTERN.test(candidateText)) blockers.push("INTERNAL_TIER_EXPOSED");
  if(quoteResult){
    if(MONEY_PATTERN.test(candidateText) && !claimedPrices) blockers.push("UNSTRUCTURED_PRICE_CLAIM");
    else if(claimedPrices && !pricesMatch(claimedPrices, quoteResult.customerVisible ?? quoteResult.customer_visible)) blockers.push("PRICE_MISMATCH");
  }
  if(availabilityClaim==="definitive" && !reservationConfirmed) blockers.push("DEFINITIVE_AVAILABILITY_NOT_ALLOWED");
  for(const key of askedFactKeys){
    const value=currentFacts?.[key];
    if(value!==null && value!==undefined && value!=="") blockers.push("REPEATED_KNOWN_FACT:"+key);
  }
  if(containsPii) blockers.push("PII_EXPOSURE");
  if(containsSecret) blockers.push("SECRET_EXPOSURE");
  for(const link of extractLinks(candidateText)){
    if(!isAllowedLink(link,allowedLinks)) blockers.push("LINK_NOT_ALLOWED:"+link);
  }
  if(!whatsappWindowOpen) blockers.push("WHATSAPP_WINDOW_CLOSED");
  if(isCampaign && !campaignApproved) blockers.push("CAMPAIGN_NOT_APPROVED");
  if(blockers.length>0){
    return {
      decision:blockers.includes("HUMAN_LOCK_ACTIVE")?"human":"deny",
      dispatchAllowed:false,blockers,shadow:!sendEnabled
    };
  }
  if(!sendEnabled){
    return {
      decision:"shadow",dispatchAllowed:false,blockers:["SEND_DISABLED"],
      shadow:true,eventType:"shadow_candidate_generated"
    };
  }
  return {decision:"allow",dispatchAllowed:true,blockers:[],shadow:false};
}

const input=$json;
const blockers=[];
const campaign=input.campaign ?? {};
const member=input.member ?? {};
const policy=input.current_policy ?? {};
const now=input.now ? new Date(input.now).getTime() : Date.now();
const starts=campaign.starts_at ? new Date(campaign.starts_at).getTime() : null;
const ends=campaign.ends_at ? new Date(campaign.ends_at).getTime() : null;

if(!["approved","running"].includes(String(campaign.status ?? ""))) blockers.push("CAMPAIGN_NOT_APPROVED");
if(!campaign.approved_by) blockers.push("CAMPAIGN_APPROVER_MISSING");
if(!campaign.approval_snapshot_hash || campaign.approval_snapshot_hash!==input.current_snapshot_hash) blockers.push("CAMPAIGN_APPROVAL_SNAPSHOT_MISMATCH");
if(String(member.eligibility_status ?? "")!=="approved") blockers.push("CAMPAIGN_MEMBER_NOT_APPROVED");
if(policy.opt_out===true) blockers.push("CAMPAIGN_OPT_OUT");
if(policy.suppressed===true) blockers.push("CAMPAIGN_SUPPRESSED");
if(policy.human_lock===true) blockers.push("HUMAN_LOCK_ACTIVE");
if(policy.contactable===false) blockers.push("CAMPAIGN_CONTACT_NOT_ELIGIBLE");
if(starts!==null && Number.isFinite(starts) && now<starts) blockers.push("CAMPAIGN_NOT_STARTED");
if(ends!==null && Number.isFinite(ends) && now>ends) blockers.push("CAMPAIGN_ENDED");

const windowOpen=Boolean(input.whatsapp_window_open);
const templateApproved=Boolean(input.template_approved && input.approved_template_name);
let deliveryMode="blocked";
let effectiveWindowOpen=false;
if(windowOpen){
  deliveryMode="freeform";
  effectiveWindowOpen=true;
}else if(templateApproved){
  deliveryMode="template";
  effectiveWindowOpen=true;
}else{
  blockers.push("META_TEMPLATE_REQUIRED_OUTSIDE_WINDOW");
}

if(blockers.length>0){
  return {json:{
    decision:blockers.includes("HUMAN_LOCK_ACTIVE")?"human":"deny",
    dispatchAllowed:false,
    campaignDispatchAllowed:false,
    delivery_mode:deliveryMode,
    blockers:[...new Set(blockers)],
    shadow:true
  }};
}

const responseGuard=evaluateResponseGuard({
  humanLock:false,
  actionAuthorized:true,
  candidateText:input.candidate_text ?? "",
  claimedPrices:input.claimed_prices ?? null,
  quoteResult:input.quote_result ?? null,
  availabilityClaim:input.availability_claim ?? "none",
  reservationConfirmed:Boolean(input.reservation_confirmed),
  askedFactKeys:input.asked_fact_keys ?? [],
  currentFacts:input.current_facts ?? {},
  containsPii:Boolean(input.contains_pii),
  containsSecret:Boolean(input.contains_secret),
  allowedLinks:input.allowed_links ?? [],
  whatsappWindowOpen:effectiveWindowOpen,
  isCampaign:true,
  campaignApproved:true,
  sendEnabled:false
});

const merged=[...new Set([...(responseGuard.blockers ?? []),"CAMPAIGN_SEND_DISABLED"])];
return {json:{
  decision:responseGuard.decision,
  dispatchAllowed:false,
  campaignDispatchAllowed:false,
  delivery_mode:deliveryMode,
  approved_template_name:deliveryMode==="template"?input.approved_template_name:null,
  blockers:merged,
  shadow:true,
  eventType:responseGuard.eventType ?? "campaign_shadow_candidate"
}};
