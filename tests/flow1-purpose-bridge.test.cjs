const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const taxonomy=require('../src/taxonomy/event-purpose-v1.json');
const corpus=require('./event-purpose-v1.cases.json');
const code=fs.readFileSync('src/functions/flow1-intake.n8n.js','utf8');
const intake=new Function('$json',code);
test('n8n Code node compiles',()=>assert.equal(typeof intake,'function'));
test('the generated bundle contains the versioned taxonomy',()=>{
  assert.ok(code.includes('const TAXONOMY_PURPOSE='+JSON.stringify(taxonomy)+';'));
});
for(const c of corpus){
  test('n8n integration '+c.id,()=>{
    const state={facts:{services:['cabine_fotos']},pending_question:c.context.pending_question};
    const out=intake({sender_id:'11999990000',message_id:'integration_'+c.id,text:c.text,state}).json;
    assert.equal(out.extracted.purpose??null,c.expected.operational);
    if(c.context.pending_question==='purpose')assert.equal(out.requires_jev,c.expected.requires_jev);
    assert.equal(out.evidence.purpose_taxonomy.version,taxonomy.version);
    assert.equal(out.effects.whatsapp_reply,false);
    assert.equal(out.effects.database_write,false);
    if(c.expected.operational)assert.equal(out.evidence.purpose.version,taxonomy.version);
  });
}
test('duplicate message is a no-op and never uses JEV',()=>{
  const out=intake({sender_id:'11999990000',message_id:'dup-0001',text:'Casamento',
    state:{facts:{services:['cabine_fotos']},processed_message_ids:['dup-0001'],pending_question:'purpose'}}).json;
  assert.equal(out.duplicate,true);assert.equal(out.requires_jev,false);
  assert.equal(out.next_flow,'DUPLICATE_NOOP');assert.deepStrictEqual(out.extracted,{});
});
test('correction creates pending conflict rather than silently replacing purpose',()=>{
  const out=intake({sender_id:'11999990000',message_id:'corr-0001',text:'Na verdade é casamento',
    state:{facts:{services:['cabine_fotos'],purpose:'aniversario'},pending_question:'purpose'}}).json;
  assert.equal(out.conflicts.purpose.incoming,'casamento');
  assert.equal(out.next_flow,'CLARIFY_CONFLICT');assert.equal(out.requires_jev,false);
});
test('draft graph stays inactive with no webhook or sending node',()=>{
  const graph=require('../n8n/quote-flow1-taxonomy-v1.draft.n8n.json');
  assert.equal(graph.active,false);
  assert.equal(graph.nodes.find(n=>n.name==='FLOW1 — extrair dados').parameters.jsCode,code);
  assert.ok(!graph.nodes.some(n=>/webhook|whatsapptrigger/i.test(n.type)));
  assert.ok(!graph.nodes.some(n=>/send.*whatsapp|whatsapp.*send/i.test(n.name)));
});
