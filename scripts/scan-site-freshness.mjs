// Single machine-readable freshness contract. Data coverage is not inferred from git modification time.
// node scripts/scan-site-freshness.mjs --write | --check | --json | --markdown
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const config=JSON.parse(fs.readFileSync('data/site_freshness_config_v1.json','utf8'));
if(config.schema!=='fellas-site-freshness-config-v1'||config.season!==2026||!Array.isArray(config.sections))throw Error('Invalid freshness registry config');
const snapshotPath='data/site_freshness_report_v1.json';
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const season=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const week=Math.max(0,...season.map(g=>g.week));
if(!Number.isInteger(week)||week<1||week>14)throw Error('Unsupported 2026 canonical week');
for(let w=1;w<=week;w++){
 const games=season.filter(x=>x.week===w);
 if(games.length!==5||new Set(games.flatMap(x=>[x.home,x.away])).size!==10)
  throw Error('Incomplete canonical 2026 Week '+w);
}
const hex=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const details=config.sections.map(meta=>{
 if(!/^data\/[a-zA-Z0-9_]+\.json$/.test(meta.path)||!fs.existsSync(meta.path))throw Error('Missing/unsafe freshness source '+meta.path);
 const v=JSON.parse(fs.readFileSync(meta.path,'utf8'));
 let verifiedThroughWeek=null,latestEventDate=null,details='',status='';
 switch(meta.scope){
  case 'approved-2026-games': verifiedThroughWeek=week;details=season.length+' final matchups';break;
  case 'season-guide-2026':verifiedThroughWeek=Number(v['2026']?.games)/5;details=v['2026']?.games+' team pairings';break;
  case 'verified_through_week':verifiedThroughWeek=v.verified_through_week;break;
  case 'currentThroughWeek':verifiedThroughWeek=v.currentThroughWeek;break;
  case 'verified2026ThroughWeek':verifiedThroughWeek=v.verified2026ThroughWeek;break;
  case 'latest-reviewed-event': {
   if(!Array.isArray(v))throw Error('Trade archive is not a receipt array');
   const latest=v.filter(t=>t.year===2026&&/^2026-\d\d-\d\d$/.test(t.date)).sort((a,b)=>b.date.localeCompare(a.date))[0];
   verifiedThroughWeek=latest?.week??null;latestEventDate=latest?.date??null;details=v.length+' documented receipts; later trades are not proven absent';break;
  }
  case 'archived-as-of':latestEventDate=v.asOf||null;details='Historical snapshot, not a weekly refresh guarantee';break;
  default:throw Error('Unknown freshness scope '+meta.scope);
 }
 if(meta.cadence==='weekly-final'){
  if(!Number.isInteger(verifiedThroughWeek)||verifiedThroughWeek<1||verifiedThroughWeek>14)
   status='ERROR';
  else status=verifiedThroughWeek===week?'CURRENT':verifiedThroughWeek<week?'STALE':'ERROR';
 }else if(meta.cadence==='event-reviewed'){
  status=verifiedThroughWeek===null?'REVIEW_REQUIRED':verifiedThroughWeek<week?'REVIEW_REQUIRED':'EVENT_AUDITED';
 }else if(meta.cadence==='archival')status='ARCHIVED';
 else throw Error('Unknown update cadence '+meta.cadence);
 return {
  id:meta.id,title:meta.title,source:meta.path,consumer:meta.page,cadence:meta.cadence,severity:meta.severity,
  status,verifiedThroughWeek,latestEventDate,details,sha256:hex(meta.path)
 };
});
const errors=details.filter(d=>d.severity==='block'&&(d.status==='STALE'||d.status==='ERROR'));
const reviews=details.filter(d=>d.status==='REVIEW_REQUIRED');
const report={
 schema:'fellas-site-freshness-report-v1',season:2026,canonicalVerifiedThroughWeek:week,
 note:'Coverage weeks represent reviewed league data. Git commits represent file changes, not league verification. Trade event dates do not establish complete transaction ingestion.',
 summary:{blockingStale:errors.length,needsReview:reviews.length,archived:details.filter(x=>x.status==='ARCHIVED').length},
 sections:details
};
const output=JSON.stringify(report,null,2)+'\n';
const mode=process.argv.slice(2);
if(mode.includes('--write')){
 fs.writeFileSync(snapshotPath,output);console.log('Wrote '+snapshotPath+'; '+details.length+' monitored sections, '+errors.length+' blocking stale');
}else if(mode.includes('--check')){
 if(!fs.existsSync(snapshotPath)||fs.readFileSync(snapshotPath,'utf8')!==output)
  throw Error('Site freshness registry stale relative to canonical source files; run --write after reviewed import');
 if(errors.length)throw Error('Blocking data freshness mismatch: '+errors.map(x=>x.id+' Week '+x.verifiedThroughWeek+' vs '+week).join(', '));
 console.log('SITE FRESHNESS PARITY PASS: '+details.length+' sections at canonical Week '+week+'; '+reviews.length+' source-review flags');
}else if(mode.includes('--json'))console.log(output);
else {
 const scanGit=p=>{
  try{
   const row=execFileSync('git',['log','-1','--format=%cI|%h','--',p],{encoding:'utf8'}).trim();
   const [at,commit]=row.split('|');return {at:at||'unknown',commit:commit||'unknown'};
  }catch{return {at:'unavailable',commit:'unavailable'}}
 };
 const lines=['## The Fellas — Website freshness scan','Canonical verified week: **'+week+'**','Critical stale: **'+errors.length+'** · Event review required: **'+reviews.length+'**','',
  '| Section | Verified coverage | Last Git file change | Status |','| --- | --- | --- | --- |'];
 for(const r of details){
  const git=scanGit(r.source),coverage=r.cadence==='archival'?'Archived as of '+(r.latestEventDate||'undated'):r.cadence==='event-reviewed'?'Last trade '+(r.latestEventDate||'unverified')+' / Week '+(r.verifiedThroughWeek??'?'):'Week '+r.verifiedThroughWeek;
  lines.push('| '+r.title+' | '+coverage+' | '+git.at+' ('+git.commit+') | '+r.status+' |');
 }
 lines.push('','**Interpretation:** Old Git timestamps do not automatically mean stale game data. A Trade Museum receipt from an earlier week does not prove there were no newer trades.','');
 const text=lines.join('\n');
 console.log(text);
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text+'\n');
 if(mode.includes('--strict')&&errors.length)process.exitCode=1;
}
