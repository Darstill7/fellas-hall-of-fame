// Source-only Trade PAR recovery triage; deliberately never scores missing players.
// Usage: node scripts/audit-trade-par-recovery.mjs [--github-summary]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const research=JSON.parse(fs.readFileSync(path.join(root,'data/trade_par_preview.json'),'utf8'));
const museumHtml=fs.readFileSync(path.join(root,'analytics/trade-museum.html'),'utf8');
const match=museumHtml.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(match,'Museum embedded receipt archive unavailable');
const museum=JSON.parse(match[1]);
assert.ok(Array.isArray(research.records)&&Array.isArray(museum),'Unexpected source shape');
const museumIds=new Map(museum.map(t=>[String(t.id),t]));
assert.equal(museumIds.size,museum.length,'Duplicate museum receipt ID');
const qualified=t=>t.year>=2020&&t.year<=2025&&t.complete===true&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched===true&&Number.isFinite(s.postTradePAR));
const eligible=research.records.filter(qualified);
const queue=research.records.filter(t=>t.year>=2020&&t.year<=2025&&t.sides.length===2&&!qualified(t));
const alias=(v)=>String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('en-US');
const evidence=new Map();
for(const trade of research.records.filter(t=>t.year>=2020&&t.year<=2025)){
 for(const side of trade.sides||[])for(const player of side.matched||[]){
  const key=trade.year+'|'+alias(player.asset);
  const sightings=evidence.get(key)||[];
  sightings.push({tradeId:String(trade.id),manager:side.manager,starts:player.starts||0,sourceWeeks:player.sourceWeeks||[]});
  evidence.set(key,sightings);
 }
}
let countOne=0,countNeither=0,shortWindow=0,leads=0,singleMissing=0;
const output=['# Trade PAR recovery audit','',
'> Research-only. Same-year name appearances are leads, **not proof** of player identity, ownership, subsequent lineup use, or eligibility for PAR scoring. Never substitute a zero for an unresolved asset.','',
'| Year / Week | Receipt | Fully matched sides | Unresolved received assets | Corroboration leads |',
'|---|---|---:|---|---|'];
for(const t of [...queue].sort((a,b)=>b.year-a.year||a.week-b.week||a.date.localeCompare(b.date))){
 const original=museumIds.get(String(t.id));
 assert.ok(original&&original.year===t.year,'Queue trade missing/mismatched in museum: '+t.id);
 const full=t.sides.filter(s=>s.fullyMatched===true).length;
 assert.ok(full===0||full===1,'Queue must contain incomplete 2-side trade');
 if(full===1)countOne++;else countNeither++;
 if(t.week>=14)shortWindow++;
 const missing=[];
 const leadLabels=[];
 for(const side of t.sides){
  for(const name of side.unresolved||[]){
   missing.push(side.manager+': '+name);
   const others=(evidence.get(t.year+'|'+alias(name))||[]).filter(hit=>hit.tradeId!==String(t.id));
   if(others.length){
    leads++;
    leadLabels.push(name+' ('+others.length+' other same-year trade receipt'+(others.length===1?'':'s')+')');
   }
  }
 }
 assert.ok(missing.length,'Unqualified 2-side receipt without unresolved assets: '+t.id);
 if(missing.length===1)singleMissing++;
 const markdownEscape=v=>String(v).replace(/\|/g,'\\|').replace(/\n/g,' ');
 output.push('| '+t.year+' / '+t.week+' | [ '+t.id+' ](../analytics/trade-museum.html?trade='+encodeURIComponent(t.id)+') | '+full+'/2 | '+markdownEscape(missing.join('; '))+' | '+markdownEscape(leadLabels.join('; ')||'No same-year preview match')+' |');
}
assert.equal(countOne+countNeither,queue.length);
assert.equal(singleMissing,queue.filter(t=>t.sides.reduce((n,s)=>n+(s.unresolved||[]).length,0)===1).length);
const total=museum.filter(t=>t.year>=2020&&t.year<=2025).length;
assert.equal(eligible.length+queue.length+research.records.filter(t=>t.year>=2020&&t.year<=2025&&t.sides.length!==2).length,total,
 'Research dataset and museum coverage mismatch');
output.splice(3,0,
 '- **'+eligible.length+' / '+total+'** archived completed-season receipts are currently eligible for observed PAR.',
 '- **'+queue.length+'** two-manager exchanges need recovery: '+countOne+' with one complete receiving side and '+countNeither+' with neither complete.',
 '- **'+singleMissing+'** incomplete two-manager receipts contain one unresolved received asset. These are a smaller investigation scope, not proof the name match is wrong.',
 '- **'+shortWindow+'** unqualified two-manager receipts occurred in Week 14 or later; a short remaining regular-season observation window is a possible limitation, not a proven reason for missing evidence.',
 '- **'+leads+'** unresolved asset occurrences have a same-year name match elsewhere in the PAR preview. These are review leads, not matched player IDs.',
 '',
 'Required before promotion: verify original Sleeper player ID and exact asset text, post-transaction roster ownership, eligible later regular-season starts, fantasy scoring, and the position-relative replacement baseline. Re-run source verification before updating the published +/- leaderboard.',
 '');
const report=output.join('\n')+'\n';
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
