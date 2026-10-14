import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

test('snapshots usados no n8n respeitam schemas canônicos v1.2.1',async()=>{
 const ajv=new Ajv2020({allErrors:true});addFormats(ajv);
 const validators={};
 for(const name of ['session','customer-event','event-fact'])validators[name]=ajv.compile(JSON.parse(await readFile(`schemas/${name}.schema.json`,'utf8')));
 const cases=JSON.parse(await readFile('n8n/fixtures/intake/cases.json','utf8'));
 let records=0;
 for(const fixture of cases){
  for(const [key,schema] of [['session','session'],['customer_event','customer-event']])if(fixture.snapshot[key]){
   assert.equal(validators[schema](fixture.snapshot[key]),true,`${fixture.id}: ${JSON.stringify(validators[schema].errors)}`);records++;
  }
  for(const fact of fixture.snapshot.facts??[]){assert.equal(validators['event-fact'](fact),true,JSON.stringify(validators['event-fact'].errors));records++;}
 }
 assert.ok(records>0);
});
