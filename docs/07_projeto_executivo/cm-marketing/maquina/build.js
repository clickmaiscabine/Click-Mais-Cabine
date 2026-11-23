'use strict';
const fs=require('node:fs'),path=require('node:path'),M=require('./core.js');
function build(archive=M.emptyArchive()){
 const validated=M.ingest(M.emptyArchive(),archive).archive;
 let html=fs.readFileSync(path.join(__dirname,'dashboard.html'),'utf8');
 const safe=x=>x.replace(/<\/script/gi,'<\\/script');
 html=html.replace('/*__BOOTSTRAP__*/','window.__MACHINE_ARCHIVE__='+JSON.stringify(validated).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026')+';');
 for(const name of ['core.js','demo.js','ui.js'])html=html.replace('<script src="'+name+'"></script>','<script>'+safe(fs.readFileSync(path.join(__dirname,name),'utf8'))+'</script>');
 return html;
}
if(require.main===module){const args=process.argv.slice(2);let output=path.join(__dirname,'dashboard-standalone.html'),seed=M.emptyArchive();for(let i=0;i<args.length;i++){if(args[i]==='--out')output=args[++i];else if(args[i]==='--seed')seed=JSON.parse(fs.readFileSync(args[++i],'utf8'));else throw new Error('Use node build.js [--seed archive.json] [--out dashboard.html]');}fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,build(seed));process.stdout.write(JSON.stringify({output:path.resolve(output),snapshots:seed.snapshots?.length??0})+'\n');}
module.exports={build};
