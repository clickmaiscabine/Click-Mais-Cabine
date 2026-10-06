import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root=JSON.parse(fs.readFileSync("MANIFEST.json","utf8"));
const wfManifest=JSON.parse(fs.readFileSync("n8n/WORKFLOW-MANIFEST.json","utf8"));

const canonical=[
  "CM-WF-000","CM-WF-010","CM-WF-015","CM-WF-020","CM-WF-030","CM-WF-031",
  "CM-WF-040","CM-WF-050","CM-WF-060","CM-WF-061","CM-WF-070","CM-WF-071",
  "CM-WF-080","CM-WF-090","CM-WF-100","CM-WF-110","CM-WF-120","CM-WF-130",
  "CM-WF-140","CM-WF-150","CM-WF-160","CM-WF-170","CM-WF-180","CM-WF-900","CM-WF-910"
];

function sorted(values){ return [...values].sort(); }

test("phase1 integration: exactly 25 canonical workflow IDs in both manifests",()=>{
  const rootIds=root.registries.workflows.map(x=>x.id);
  const wfIds=wfManifest.workflows.map(x=>x.id);
  assert.equal(new Set(rootIds).size,25);
  assert.equal(new Set(wfIds).size,25);
  assert.deepEqual(sorted(rootIds),sorted(canonical));
  assert.deepEqual(sorted(wfIds),sorted(canonical));
});

test("phase1 integration: every workflow is a disabled LAB draft with matching snapshot",()=>{
  const rootMap=new Map(root.registries.workflows.map(x=>[x.id,x]));
  for(const item of wfManifest.workflows){
    assert.equal(item.implementation,"lab_draft",item.id+" implementation");
    assert.equal(item.runtime_enabled,false,item.id+" runtime");
    assert.equal(item.status,"review",item.id+" status");
    assert.ok(item.lab_workflow_id,item.id+" lab id missing");
    assert.equal(item.lab_folder,"Click Mais OS - LAB");

    const reg=rootMap.get(item.id);
    assert.ok(reg,item.id+" missing root registry");
    assert.equal(reg.status,"review");

    const snapshot=JSON.parse(fs.readFileSync(reg.path,"utf8"));
    assert.equal(snapshot.canonical_id,item.id,item.id+" snapshot canonical id");
    assert.equal(snapshot.lab_workflow_id,item.lab_workflow_id,item.id+" LAB id drift");
    assert.equal(snapshot.active,false,item.id+" snapshot must be inactive");
    assert.equal(snapshot.isArchived,false,item.id+" snapshot must not be archived");
  }
});

test("phase1 integration: no workflow is marked runtime enabled",()=>{
  assert.equal(wfManifest.workflows.some(x=>x.runtime_enabled===true),false);
});

test("phase1 integration: F3 ingress artifacts are present in integrated registry",()=>{
  for(const id of ["CM-WF-000","CM-WF-010","CM-WF-015","CM-WF-020"]){
    const entry=root.registries.workflows.find(x=>x.id===id);
    assert.ok(entry,id+" missing");
    assert.match(entry.path,/n8n\/workflows\/f3\//);
  }
  assert.ok(root.registries.governance_docs.some(x=>x.id==="f3-runtime-ingress-v1.2.1"));
});

test("phase1 integration: no canonical workflow snapshot is duplicated by path",()=>{
  const paths=root.registries.workflows.map(x=>x.path);
  assert.equal(new Set(paths).size,paths.length);
});
