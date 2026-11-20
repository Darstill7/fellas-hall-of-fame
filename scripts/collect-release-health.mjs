// Read-only GitHub collector for a single Tuesday release health snapshot.
// Uses the workflow's scoped GITHUB_TOKEN. Never mutates GitHub.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const repo=process.env.GITHUB_REPOSITORY||'Darstill7/fellas-hall-of-fame';
const token=process.env.GITHUB_TOKEN;
if(!token)throw Error('GITHUB_TOKEN required for release health collection');
const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
const api=async p=>{
 const res=await fetch('https://api.github.com/repos/'+repo+p,{headers,signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('GitHub read failed: '+p+' HTTP '+res.status);
 return res.json();
};
const numbers=[268,271,272,273];
const main=await api('/git/ref/heads/main');
const mainSha=main.object?.sha;
if(!/^[0-9a-f]{40}$/.test(mainSha||''))throw Error('No exact main SHA');
const mainLedgerFile=await api('/contents/data/unified_record_book_2016_2026.json?ref='+mainSha);
if(mainLedgerFile.encoding!=='base64'||!mainLedgerFile.content)throw Error('Cannot read approved main ledger');
const mainLedger=JSON.parse(Buffer.from(mainLedgerFile.content.replace(/\\s/g,''),'base64').toString('utf8'));
const approvedGames=(mainLedger.games||[]).filter(g=>g.year===2026&&g.stage==='regular');
const mainCanonicalWeek=Math.max(0,...approvedGames.map(g=>g.week));
if(mainCanonicalWeek<1||mainCanonicalWeek>14)throw Error('Invalid production canonical week');
for(let w=1;w<=mainCanonicalWeek;w++){
 const pair=approvedGames.filter(g=>g.week===w);
 if(pair.length!==5||new Set(pair.flatMap(g=>[g.home,g.away])).size!==10)
  throw Error('Production canonical Week '+w+' has incomplete source coverage');
}
const mainRuns=(await api('/actions/runs?branch=main&per_page=100')).workflow_runs.map(x=>({
 name:x.name,status:x.status,conclusion:x.conclusion,head_sha:x.head_sha,created_at:x.created_at,html_url:x.html_url,id:x.id
}));
// Resolve PR head status from runs specifically belonging to its exact SHA.
const prs=[];
for(const number of numbers){
 const p=await api('/pulls/'+number);
 const sha=p.head?.sha;
 if(!/^[0-9a-f]{40}$/.test(sha||''))throw Error('Missing exact PR head for #'+number);
 const recent=(await api('/actions/runs?head_sha='+sha+'&per_page=100')).workflow_runs;
 prs.push({number,title:p.title,state:p.state,draft:p.draft,merged:p.merged,base:p.base?.ref,head_sha:sha,url:p.html_url,
  runs:recent.filter(x=>x.head_sha===sha).map(x=>({
    name:x.name,status:x.status,conclusion:x.conclusion,created_at:x.created_at,html_url:x.html_url,id:x.id
  }))});
}
let staging={candidateWeek:null,status:'UNKNOWN'};
try{
 const list=await api('/contents/data-integrity/sleeper-sync-candidates?ref=automation%2Fsleeper-weekly-stage');
 const candidates=(Array.isArray(list)?list:[]).filter(x=>/^2026-week\d+\.json$/.test(x.name)).sort((a,b)=>Number(b.name.match(/\d+(?=\.json)/)[0])-Number(a.name.match(/\d+(?=\.json)/)[0]));
 for(const row of candidates){
  const json=await api('/contents/data-integrity/sleeper-sync-candidates/'+row.name+'?ref=automation%2Fsleeper-weekly-stage');
  if(json.encoding!=='base64'||!json.content)continue;
  const candidate=JSON.parse(Buffer.from(json.content.replace(/\s/g,''),'base64').toString('utf8'));
  if(candidate.status==='REVIEW_REQUIRED'&&candidate.year===2026&&candidate.league==='1340027406009761792'&&candidate.matchupCount===5&&candidate.games?.length===5){
   staging={candidateWeek:candidate.week,status:'REVIEW_CANDIDATE',source:'automation/sleeper-weekly-stage',file:row.name};break;
  }
 }
 if(staging.status==='UNKNOWN')staging.status='NO_REVIEW_CANDIDATE';
}catch(e){staging={candidateWeek:null,status:'SOURCE_UNAVAILABLE',error:String(e.message||e).slice(0,150)}}
const freshness=JSON.parse(execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--json'],{encoding:'utf8'}));
const input={schema:'fellas-release-health-input-v1',observedAt:new Date().toISOString(),mainSha,mainCanonicalWeek,staging,freshness,mainRuns,prs};
const out=process.argv[2]||'/tmp/fellas-release-health-input.json';
fs.writeFileSync(out,JSON.stringify(input,null,2)+'\n');
console.log('Collected main '+mainSha.slice(0,12)+' verified through Week '+mainCanonicalWeek+', branch Week '+freshness.canonicalVerifiedThroughWeek+', '+prs.length+' PR heads, staging '+staging.status+' Week '+staging.candidateWeek);
