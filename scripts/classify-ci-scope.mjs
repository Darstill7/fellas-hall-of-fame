import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
export function classify(paths) {
  if (!Array.isArray(paths) || !paths.length) return {scope:'full', reasons:['No reliable changed-file evidence'], paths:[]};
  const levels={targeted:0,integration:1,full:2};
  const entries=paths.map(path=>{
    if(typeof path!=='string'||!path||path.includes('..')||path.includes('\\')) return {path,scope:'full',reason:'Invalid or ambiguous path'};
    if (/^weekly-shitter\/(?:issue-\d+\.html|assets\/issue-\d+-[\w-]+\.(?:svg|jpg|jpeg|png|webp))$/.test(path)) return {path,scope:'targeted',reason:'Isolated magazine issue or cover'};
    if (/^tuesday-hangover\/\d{4}-week-\d+\.html$/.test(path)) return {path,scope:'targeted',reason:'Isolated weekly recap'};
    if (/^(?:index\.html|weekly-shitter\/index\.html|tuesday-hangover\/index\.html|assets\/(?:app-shell-[\w.-]+|home-app-[\w.-]+|manager-[\w.-]+)\.(?:mjs|js|css))$/.test(path)) return {path,scope:'integration',reason:'Shared navigation or manager consumer'};
    return {path,scope:'full',reason:'Data, infrastructure, other or unknown dependency'};
  });
  return {scope:entries.reduce((s,e)=>levels[e.scope]>levels[s]?e.scope:s,'targeted'),reasons:[...new Set(entries.map(e=>e.reason))],paths:entries};
}
export function changedPaths(base,head) {
  if(!/^[0-9a-f]{40}$/i.test(base)||!/^[0-9a-f]{40}$/i.test(head)) throw Error('Exact commit SHAs required');
  const raw=execFileSync('git',['diff','--name-status','-z','--find-renames',base+'...'+head],{encoding:'utf8',maxBuffer:16*1024*1024});
  const fields=raw.split('\0');if(fields.pop()!=='')throw Error('Malformed git diff');
  const paths=[];
  for(let i=0;i<fields.length;){
    const status=fields[i++];
    if(!/^(?:[AMDTUXB]|[RC]\d+)$/.test(status))throw Error('Unknown status '+status);
    const n=/^[RC]/.test(status)?2:1;
    if(i+n>fields.length)throw Error('Truncated git diff');
    paths.push(...fields.slice(i,i+n));i+=n;
    if(!/^[AM]$/.test(status))paths.push('.ci-ambiguous-change');
  }
  return paths;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  let report;
  try{report=classify(changedPaths(process.argv[2]??'',process.argv[3]??''));}
  catch(e){report={scope:'full',reasons:['Diff unavailable: '+e.message],paths:[]};}
  console.log(JSON.stringify(report,null,2));
  if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### CI scope (advisory only)\n\nRecommended: **'+report.scope+'**. Existing release gates remain unchanged.\n\n'+report.reasons.map(x=>'- '+x.replace(/[\r\n]/g,' ')).join('\n')+'\n');
}
