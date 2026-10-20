const {test}=require('node:test');
const assert=require('node:assert/strict');
const taxonomy=require('../src/taxonomy/event-purpose-v1.json');
const {classifyPurposeV1}=require('../src/functions/classify-event-purpose-v1.js');
const corpus=require('./event-purpose-v1.cases.json');
for(const scenario of corpus) {
  test(scenario.id+': '+scenario.text,()=>{
    const actual=classifyPurposeV1({text:scenario.text,context:scenario.context},taxonomy);
    for(const [field,value] of Object.entries(scenario.expected))
      assert.deepStrictEqual(actual[field],value,field);
    if(actual.route==='deterministic') assert.equal(actual.requires_jev,false);
    assert.equal(actual.version,taxonomy.version);
  });
}
test('same message is idempotent as a pure function',()=>{
  const input={text:'Aniversário da empresa',context:{pending_question:'purpose'}};
  assert.deepStrictEqual(classifyPurposeV1(input,taxonomy),classifyPurposeV1(input,taxonomy));
});
test('a format is not a birthday',()=>{
  const x=classifyPurposeV1({text:'Festa surpresa'},taxonomy);
  assert.equal(x.operational,null);assert.equal(x.requires_jev,false);
});
test('a numeric service selection is never a purpose',()=>{
  const x=classifyPurposeV1({text:'3',context:{pending_question:'service'}},taxonomy);
  assert.equal(x.operational,null);assert.equal(x.requires_jev,false);
});
