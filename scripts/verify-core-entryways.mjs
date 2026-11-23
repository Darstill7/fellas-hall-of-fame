// Static, read-only entryway integrity gate. Complements interactive Chromium/WebKit audits.
// This protects core browsing routes even when source data and browser engines are unavailable.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const core=[
 'index.html','managers/index.html','analytics/records.html',
 'analytics/playoff-race.html','analytics/trade-museum.html',
 'data-integrity/source-status.html'
];
const errors=[],advisory=[];
const fileExists=target=>fs.existsSync(target)&&fs.statSync(target).isFile();
const resolve=raw=>{
 let value=raw.trim();
 if(!value||value.startsWith('#')||/^(?:[a-z][\w+.-]*:|\/\/)/i.test(value))return null;
 if(value.includes('${')||value.includes('{{'))return null;
 value=value.split(/[?#]/)[0];
 if(!value)return null;
 try{value=decodeURIComponent(value)}catch{return {error:'malformed percent-encoding'}}
 if(value.includes('\\'))return {error:'backslash in a website link'};
 return {value};
};
for(const page of core){
 const absolute=path.join(root,page);
 assert.ok(fileExists(absolute),'Missing core entryway '+page);
 const html=fs.readFileSync(absolute,'utf8');
 const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);
 const duplicates=[...new Set(ids.filter((v,i)=>ids.indexOf(v)!==i))];
 if(duplicates.length)errors.push({page,kind:'duplicate IDs',details:duplicates.slice(0,10)});
 if(!/<main(?:\s|>)/i.test(html))errors.push({page,kind:'missing main landmark'});
 if((html.match(/<h1(?:\s|>)/gi)||[]).length!==1)errors.push({page,kind:'expected exactly one H1'});
 if(!/<title(?:\s|>)/i.test(html))errors.push({page,kind:'missing document title'});
 for(const match of html.matchAll(/<img\b[^>]*>/gi)){
  if(!/\balt\s*=\s*(?:["'][^"']*["'])/i.test(match[0]))errors.push({page,kind:'image missing alt attribute',details:match[0].slice(0,110)});
 }
 const localTargets=[];
 for(const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
  const raw=match[1],parsed=resolve(raw);
  if(!parsed)continue;
  if(parsed.error){errors.push({page,kind:parsed.error,details:raw});continue}
  const target=parsed.value.startsWith('/')?path.resolve(root,'.'+parsed.value):path.resolve(path.dirname(absolute),parsed.value);
  if(!(target===root||target.startsWith(root+path.sep))){errors.push({page,kind:'link escapes project root',details:raw});continue}
  if(!fileExists(target)&&!fileExists(path.join(target,'index.html'))&&!fileExists(target+'.html')){
   localTargets.push(raw);
  }
 }
 if(localTargets.length)errors.push({page,kind:'broken local asset or navigation',details:[...new Set(localTargets)].slice(0,15)});
 // Static audit deliberately doesn't claim keyboard, contrast or runtime behavior.
 if(!html.includes('focus-visible'))advisory.push({page,kind:'review focus treatment in linked stylesheets/browser'});
}
const result={pagesScanned:core.length,issues:errors,advisory};
console.log('ENTRYWAY INTEGRITY: '+core.length+' core pages, '+errors.length+' blocking findings, '+advisory.length+' focus-style follow-ups.');
for(const issue of errors)console.error(issue.page+' :: '+issue.kind+' :: '+JSON.stringify(issue.details??''));
if(errors.length)process.exitCode=1;
