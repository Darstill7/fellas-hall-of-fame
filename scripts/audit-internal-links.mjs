// Audit local links; advisory by default, --strict is available after triage.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),pages=[],issues=[],seen=new Set();
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 if(['.git','node_modules','dist'].includes(entry.name))continue;
 const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.html'))pages.push(p);
}}
walk(root);
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 for(const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)){
  const target=match[1].trim();
  if(!target||target.startsWith('#')||/^(https?:|data:|mailto:|tel:|javascript:|\/\/)/i.test(target))continue;
  const raw=target.split(/[?#]/)[0];if(!raw||raw.includes('{{')||raw.includes('${'))continue;
  let decoded;try{decoded=decodeURIComponent(raw)}catch{continue}
  const absolute=decoded.startsWith('/')?path.resolve(root,'.'+decoded):path.resolve(path.dirname(file),decoded);
  if(!(absolute===root||absolute.startsWith(root+path.sep)))continue;
  if([absolute,path.join(absolute,'index.html'),absolute+'.html'].some(p=>fs.existsSync(p)))continue;
  const page=path.relative(root,file),key=page+'|'+raw;
  if(!seen.has(key)){seen.add(key);issues.push({page,link:raw})}
 }
}
const report={pagesScanned:pages.length,unresolvedLocalLinks:issues.length,examples:issues.slice(0,100)};
fs.mkdirSync('data-integrity',{recursive:true});
fs.writeFileSync('data-integrity/internal-link-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('Scanned '+pages.length+' HTML files; '+issues.length+' unresolved local links.');
for(const issue of issues.slice(0,35))console.log(issue.page+' -> '+issue.link);
if(process.argv.includes('--strict')&&issues.length)process.exitCode=1;
