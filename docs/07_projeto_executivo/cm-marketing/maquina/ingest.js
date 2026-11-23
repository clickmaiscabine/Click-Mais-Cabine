'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),M=require('./core.js'),{build}=require('./build.js');
function atomic(file,text){const tmp=file+'.tmp-'+process.pid;try{fs.writeFileSync(tmp,text,{flag:'wx'});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
function main(args){
 const opt={};for(let i=0;i<args.length;i++){if(!['--store','--inbox','--out'].includes(args[i])||!args[i+1])throw new Error('Use node ingest.js --store DIRETORIO_PRIVADO --inbox DIRETORIO_DE_ENTRADA --out DIRETORIO_DE_SAIDA');opt[args[i].slice(2)]=path.resolve(args[++i]);}
 if(!opt.store||!opt.inbox||!opt.out)throw new Error('Informe store, inbox e out.');
 if(opt.store===opt.inbox||opt.out===opt.inbox||opt.store===opt.out)throw new Error('Entrada, arquivo e saída devem ser diretórios separados.');
 fs.mkdirSync(opt.store,{recursive:true});fs.mkdirSync(opt.out,{recursive:true});const lock=path.join(opt.store,'.ingest.lock');let held=false;
 try{try{fs.mkdirSync(lock);held=true;}catch(e){throw new Error('Outra ingestão usa este arquivo ou deixou lock pendente. Nenhuma ficha foi alterada.');}
  const storeFile=path.join(opt.store,'history.json'),before=fs.existsSync(storeFile)?JSON.parse(fs.readFileSync(storeFile,'utf8')):M.emptyArchive();let items=[],files=[];
  for(const name of fs.readdirSync(opt.inbox).filter(n=>n.endsWith('.json')).sort()){const file=path.join(opt.inbox,name);const st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>2000000)throw new Error('Entrada inválida ou maior que 2 MB: '+name);const text=fs.readFileSync(file,'utf8'),p=JSON.parse(text);
   if(p?.kind==='clickmais.weekly_contributions'){const allowed=['kind','schema_version','period','collected_at','producer','mode','revision','contributions'];if(Object.keys(p).some(k=>!allowed.includes(k))||p.schema_version!==M.VERSION)throw new Error('Contribuições incompatíveis: '+name);items.push(M.assemble(p.period,p.contributions,p));}
   else if(p?.format==='clickmais.snapshot_archive'){M.ingest(M.emptyArchive(),p);items.push(...p.snapshots);}
   else items.push(...(Array.isArray(p)?p:[p]));files.push({name,sha256:crypto.createHash('sha256').update(text).digest('hex')});
  }
  const result=M.ingest(before,items);if(result.archive.snapshots.some(s=>s.mode==='demo'))throw new Error('O importador do gerente aceita somente dados reais; demonstração é exclusiva da interface.');
  const archiveText=JSON.stringify(result.archive,null,2)+'\n',view={...M.emptyArchive(),snapshots:M.latest(result.archive,'real')};
  atomic(storeFile,archiveText);atomic(path.join(opt.out,'latest.json'),JSON.stringify(view,null,2)+'\n');atomic(path.join(opt.out,'dashboard.html'),build(result.archive));
  const receipt={state:'accepted_by_machine',hermes_delivery_state:'delivery_pending',ack_ref:null,processed_at:new Date().toISOString(),inserted:result.inserted,ignored:result.ignored,active_weeks:view.snapshots.length,history_sha256:crypto.createHash('sha256').update(archiveText).digest('hex'),source_files:files};atomic(path.join(opt.out,'ingestion-receipt.json'),JSON.stringify(receipt,null,2)+'\n');process.stdout.write(JSON.stringify(receipt)+'\n');return receipt;
 }finally{if(held)fs.rmdirSync(lock);}
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}}
module.exports={main};
