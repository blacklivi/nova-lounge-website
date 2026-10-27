#!/usr/bin/env node
// Run the unchanged official Hallmark v2.0.0 static linter; browser tier is separate.
import {spawnSync} from 'node:child_process';
const args=['tools/hallmark/sloplint.mjs','public/index.html','public/site.css','public/design-lab.css','--genre','editorial','--scope','page','--json'];
const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024,timeout:45000});
if(r.error){console.error(r.error.message);process.exit(1)}
let data;try{data=JSON.parse(r.stdout)}catch(e){console.error('Hallmark parse failure',e.message,'status',r.status,'stderr',r.stderr?.slice(-1200),'stdout',r.stdout?.slice(-1200));process.exit(1)}
const s=data.summary||{};const findings=Array.isArray(data.findings)?data.findings:[];
const counts={};for(const f of findings){const k=f.grade+' '+f.gate;counts[k]=(counts[k]||0)+1}
console.log('HALLMARK_OFFICIAL_STATIC_SUMMARY '+JSON.stringify({commit:'6033bab2a8051b5454552d2e8e6cb8f27c483a42',mode:'official static / not --render',summary:s,gateCounts:counts}));
const important=findings.filter(f=>['FAIL','REFLEX','WARN'].includes(f.grade));
for(const f of important.slice(0,75)){console.log('HALLMARK_FINDING '+JSON.stringify({gate:f.gate,grade:f.grade,tier:f.tier,file:f.file,line:f.line,evidence:String(f.evidence||'').slice(0,140),fix:String(f.fix||'').slice(0,170)}))}
console.log('HALLMARK_REMAINING '+Math.max(0,important.length-75));
if(r.status!==0&&s.fails===0&&s.reflex===0){console.error('Hallmark unexpected status '+r.status);process.exit(1)}
