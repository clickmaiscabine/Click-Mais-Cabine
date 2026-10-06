import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const snapshot=JSON.parse(fs.readFileSync(
  new URL("../../n8n/workflows/f4/CM-WF-031.lab.json",import.meta.url),
  "utf8"
));
const codeNode=snapshot.nodes.find((node)=>node.name==="Prepare Quote Presentation");
assert.ok(codeNode,"CM-WF-031 code node must exist");
const execute=new Function("$json",codeNode.parameters.jsCode);

test("031: ready quote exposes customer values and delays state transition until dispatch success",()=>{
  const out=execute({
    customer_event_id:"event-1",
    commercial_stage:"PRE_QUOTE",
    human_lock:false,
    quote_result:{
      status:"ready",
      comboApplied:true,
      promotionApplied:true,
      pricingRuleVersion:"internal-v1",
      customerVisible:{pix:1500,card:1770},
      items:[
        {lineType:"main",serviceCode:"cabine_fotos",finalPix:1000},
        {lineType:"main",serviceCode:"plataforma_360",finalPix:500}
      ]
    },
    date_policy:{window:"SHORT_TERM_PROMO",gift:{eligible:false}}
  }).json;

  assert.equal(out.status,"ready");
  assert.deepEqual(out.presentation.customer_visible_prices,{pix:1500,card:1770});
  assert.equal(out.presentation.availability_claim,"preliminary");
  assert.equal(out.action_request.apply_state_transition_on,"dispatch_success");
  assert.deepEqual(out.action_request.proposed_transition,{from:"PRE_QUOTE",to:"ORCAMENTO"});
  assert.equal(out.action_request.success_event_type,"quote_sent");
  assert.equal(JSON.stringify(out).includes("T1190"),false);
  assert.equal(JSON.stringify(out).includes("pricingRuleVersion"),false);
});

test("031: human lock blocks presentation",()=>{
  const out=execute({
    customer_event_id:"event-2",
    commercial_stage:"NEGOCIACAO",
    human_lock:true,
    quote_result:{status:"ready",customerVisible:{pix:1190,card:1410},items:[]}
  }).json;
  assert.equal(out.status,"human_required");
  assert.equal(out.presentation,null);
  assert.equal(out.action_request.action,"CREATE_HUMAN_TASK");
});

test("031: non-ready quote never reaches composer",()=>{
  const out=execute({
    customer_event_id:"event-3",
    commercial_stage:"PRE_QUOTE",
    human_lock:false,
    quote_result:{status:"blocked",customerVisible:null,items:[]}
  }).json;
  assert.equal(out.status,"blocked");
  assert.equal(out.presentation,null);
  assert.equal(out.action_request,null);
});
