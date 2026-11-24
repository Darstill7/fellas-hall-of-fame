import fs from 'node:fs';
import assert from 'node:assert/strict';
import {normalizeManager} from '../assets/league-config.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const archived=read('weekly-shitter/issue-01-verified-picks.json');
const current=read('data-integrity/editorial-predictions/2026-week11.json');
const norm=n=>n==='Sheffla'?'Scott':normalizeManager(n);
const cents=n=>Math.round(n*100);
const grade=n=>n>0?'W':n<0?'L':'P';
const old={season:archived.season,week:archived.week,issue:archived.issue,source:archived.originalIssue,status:'PREVIOUSLY_VERIFIED',games:archived.games.map(g=>({teams:Object.keys(g.actual).map(norm),pick:norm(g.favorite),line:g.line,total:g.total,totalPick:null}))};
export function scoreIssue(issue,games){
 const final=games.filter(g=>g.year===issue.season&&g.week===issue.week&&g.stage==='regular');
 assert.equal(final.length,5,'Expected five finalized games');
 const seen=new Set();
 const rows=issue.games.map(p=>{
  const key=p.teams.map(norm).sort().join('|');assert(!seen.has(key),'Duplicate prediction');seen.add(key);
  const matches=final.filter(g=>[norm(g.home),norm(g.away)].sort().join('|')===key);assert.equal(matches.length,1,'Unmatched prediction: '+key);
  const g=matches[0];assert(p.teams.includes(p.pick)&&Number.isFinite(p.line)&&Number.isFinite(p.total));
  const mine=norm(g.home)===p.pick?cents(g.homeScore):cents(g.awayScore),other=norm(g.home)===p.pick?cents(g.awayScore):cents(g.homeScore);
  const total=mine+other-cents(p.total);
  return {...p,actual:{[p.pick]:mine/100,[p.teams.find(t=>t!==p.pick)]:other/100},straightUp:grade(mine-other),againstSpread:grade(mine-other+cents(p.line)),totals:p.totalPick==='over'?grade(total):p.totalPick==='under'?grade(-total):null};
 });assert.equal(rows.length,5);
 const record=Object.fromEntries(['straightUp','againstSpread','totals'].map(k=>[k,Object.fromEntries(['W','L','P'].map(v=>[v,rows.filter(r=>r[k]===v).length]))]));
 return {...issue,games:rows,record};
}
const issues=[old,current].map(i=>scoreIssue(i,ledger.games));
assert.deepEqual(issues[0].record.straightUp,{W:5,L:0,P:0});assert.deepEqual(issues[0].record.againstSpread,{W:4,L:1,P:0});
const cumulative=Object.fromEntries(['straightUp','againstSpread','totals'].map(k=>[k,Object.fromEntries(['W','L','P'].map(v=>[v,issues.reduce((n,i)=>n+i.record[k][v],0)]))]));
const out=(process.env.RUNNER_TEMP||'/tmp')+'/fellas-editorial';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/writer-predictions.json',JSON.stringify({status:'RESEARCH_ONLY_REVIEW_REQUIRED',issues,cumulative},null,2)+'\n');console.log(JSON.stringify({issues:issues.map(i=>({issue:i.issue,record:i.record})),cumulative},null,2));
