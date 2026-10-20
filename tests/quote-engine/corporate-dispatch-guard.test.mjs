import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dispatchFailurePatch} from '../../src/functions/corporate-dispatch-guard.mjs';
const row={attempts:1,max_attempts:3},now='2026-10-19T02:47:30.000Z';
for(const [name,error]of [['timeout',{message:'request timeout'}],['connection reset',{message:'ECONNRESET'}],['HTTP 408',{httpCode:408}],['HTTP 500',{httpCode:500}]])test('uncertain '+name+' is never blindly resent',()=>{
 const r=dispatchFailurePatch({error},row,now);assert.equal(r.attempts,3);assert.equal(r.next_attempt_at,null);assert.match(r.last_error,/UNCERTAIN_DISPATCH_REQUIRES_HUMAN/);
});
test('explicit Meta rate rejection retains bounded persistent retry',()=>{
 const r=dispatchFailurePatch({error:{httpCode:429,message:'rate rejected'}},row,now);assert.equal(r.attempts,1);assert.equal(r.next_attempt_at,'2026-10-19T02:48:30.000Z');
});
test('permanent rejection stops repeated invalid sends',()=>assert.equal(dispatchFailurePatch({error:{httpCode:400,message:'invalid recipient'}},row,now).attempts,3));
test('acknowledged message is never retried; deployed error expression matches the tested guard',()=>{
 const input={messages:[{id:'synthetic-ack'}],error:{httpCode:429}};
 assert.match(dispatchFailurePatch(input,row,now).last_error,/UNCERTAIN/);
 const w=JSON.parse(fs.readFileSync(new URL('../../n8n/workflows/CM-WF-070_test-queue-lab.json',import.meta.url),'utf8'));
 const e=w.nodes.find(n=>n.name==='Supabase — reagendar envio falho TEST').parameters.jsonBody;
 const actual=new Function('$json','$','$now','return '+e.slice(3,-2))(input,()=>({item:{json:row}}),{toISO:()=>now});
 assert.deepEqual(actual,dispatchFailurePatch(input,row,now));
});
