// Static syntax verification for inline JS embedded in HTML pages.
// Catches parser errors that checking assets/*.js alone cannot detect.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const skip=new Set(['.git','node_modules','.github']);
const failures=[];
let scripts=0,pages=0;
function walk(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  if(skip.has(entry.name))continue;
  const full=path.join(directory,entry.name);
  if(entry.isDirectory()){walk(full);continue}
  if(!entry.name.endsWith('.html'))continue;
  pages++;
  const html=fs.readFileSync(full,'utf8');
  const blocks=html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);
  let index=0;
  for(const [,attrs,body] of blocks){
   index++;
   if(/\bsrc\s*=/i.test(attrs))continue;
   const type=attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()||'text/javascript';
   if(!['text/javascript','application/javascript','module'].includes(type))continue;
   if(!body.trim())continue;
   scripts++;
   try{new vm.Script(body,{filename:full+' script '+index})}
   catch(error){failures.push(full+' script '+index+': '+error.message)}
  }
 }
}
walk('.');
if(failures.length){
 console.error('Inline JavaScript syntax audit FAILED ('+failures.length+'):');
 for(const line of failures)console.error(' - '+line);
 process.exitCode=1;
}else console.log('Inline JavaScript syntax audit PASS: '+scripts+' scripts across '+pages+' HTML pages');
