import fs from 'node:fs';
import assert from 'node:assert/strict';
// Score documented post-trade starts on the receiving roster; never infer trade winners.
const league='1340027406009761792',through=10;
const path=process.env.FELLAS_TRADE_SOURCE;
if(!path)throw Error('Pinned source file required');
const raw=JSON.parse(fs.readFileSync(path,'utf8'));
assert.equal(raw.schema,'fellas-sleeper-raw-trade-review-v1');
assert.equal(raw.league,league);
assert.equal(raw.status,'REVIEW_REQUIRED');
const museum=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
assert.equal(museum.length,51);
const current=museum.filter(t=>t.year===2026);
assert.equal(current.length,7);
const byId=new Map(raw.trades.map(t=>[String(t.transaction_id),t]));
const managers=new Map([[1,'Stilly'],[2,'JMid'],[3,'Tom'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const weekly=new Map();
for(let week=1;week<=through;week++){
 const res=await fetch('https://api.sleeper.app/v1/league/'+league+'/matchups/'+week,{signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('Week '+week+' HTTP '+res.status);
 const rows=await res.json();
 assert.equal(rows.length,10,'Week '+week+' incomplete');
 const roster=new Map();
 for(const r of rows){
  const id=Number(r.roster_id),players=r.starters,points=r.starters_points;
  assert(managers.has(id)&&!roster.has(id),'Invalid roster Week '+week);
  assert(Array.isArray(players)&&Array.isArray(points)&&players.length===points.length&&players.length>=8,'Incomplete starters Week '+week);
  assert(points.every(p=>Number.isFinite(p)),'Nonfinal starter scoring Week '+week);
  assert(Math.abs(points.reduce((a,b)=>a+b,0)-r.points)<0.12,'Starter total mismatch Week '+week);
  roster.set(id,{players,points});
 }
 weekly.set(week,roster);
}
const next=structuredClone(museum),audits=[];
for(const t of next.filter(t=>t.year===2026)){
 const receipt=byId.get(String(t.id));
 assert(receipt&&receipt.week===t.week,'Unmatched 2026 archived transaction '+t.id);
 const rosters=receipt.roster_ids.map(Number);
 assert.equal(rosters.length,t.sides.length);
 assert.equal((receipt.waiver_budget||[]).length,0,'Archived trade FAAB requires separate audit');
 const details=[];
 for(const side of t.sides){
  const roster=rosters.find(id=>managers.get(id)===side.manager);
  assert(roster,'Manager missing from transaction '+t.id);
  const assets=Object.entries(receipt.adds||{}).filter(([,receiver])=>Number(receiver)===roster).map(([id])=>id);
  assert.equal(assets.length,side.assets.split(' + ').length,'Asset count differs '+t.id);
  const starts=[];
  for(let week=t.week+1;week<=through;week++){
   const line=weekly.get(week).get(roster);
   for(const id of assets){
    const index=line.players.indexOf(id);
    if(index>=0)starts.push({week,player_id:id,points:line.points[index]});
   }
  }
  const old={points:side.raw_starter_points,starts:side.started_games};
  side.raw_starter_points=Math.round(starts.reduce((s,v)=>s+v.points,0)*100)/100;
  side.started_games=starts.length;
  details.push({manager:side.manager,received_ids:assets,prior:old,current:{points:side.raw_starter_points,starts:starts.length},starts});
 }
 t.scoring_through_week=through;
 t.evidence='Verified original Sleeper receiving-roster starters through finalized Week '+through+'; post-trade weeks only. Not a lineup-, keeper-, FAAB- or replacement-adjusted verdict.';
 audits.push({id:t.id,week:t.week,sides:details});
}
assert.deepEqual(next.filter(t=>t.year!==2026),museum.filter(t=>t.year!==2026));
const htmlPath='analytics/trade-museum.html',before=fs.readFileSync(htmlPath,'utf8');
const pattern=/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/;
const match=before.match(pattern);
assert(match);
assert.deepEqual(JSON.parse(match[1]),museum);
let html=before.replace(pattern,'<script id="archive-data" type="application/json">'+JSON.stringify(next).replace(/</g,'\\u003c')+'</script>');
const marker='const fullyAudited=t=>';
assert(html.includes(marker));html=html.replace(marker,"const scoringLabel=t=>t.scoring_through_week?'starter pts verified through W'+t.scoring_through_week:'historical snapshot starter pts';\n"+marker);
const card="Number(s.raw_starter_points).toFixed(1)+' snapshot starter pts'";
assert(html.includes(card));html=html.replace(card,"Number(s.raw_starter_points).toFixed(1)+' '+scoringLabel(t)");
const modal="'audit-snapshot starter points · '+Number(s.started_games||0)+' recorded starts'";
assert(html.includes(modal));
html=html.replace(modal,"scoringLabel(t)+' · '+Number(s.started_games||0)+' recorded starts'");
const report={schema:'fellas-2026-trade-starter-point-refresh-v1',status:'RESEARCH_RECALCULATED_REQUIRES_REVIEW',
 league,scoring_through_week:through,scope:'7 already archived 2026 trades only; 6 unapproved recovered trades excluded',
 source:'Sleeper original completed transaction adds and weekly starting lineup scores, Weeks 1-10',
 methodology:'Only received player IDs who actually started for the receiving roster in weeks after the transaction week. Never count bench points.',
 limitations:['Week 11 remains provider in_progress, thus excluded','No winner, fair value or lineup-adjusted grade','44 prior-season records must stay unchanged'],audits};
if(!process.argv.includes('--dry-run')){
 fs.writeFileSync('data/trade_museum_stage66.json',JSON.stringify(next,null,2)+'\n');
 fs.writeFileSync(htmlPath,html);
 fs.mkdirSync('data-integrity/trade-point-recalculations',{recursive:true});
 fs.writeFileSync('data-integrity/trade-point-recalculations/2026-through-week10.json',JSON.stringify(report,null,2)+'\n');
}
console.log('AUDITED THROUGH WEEK 10: '+audits.length+' prior 2026 trades; '+audits.reduce((s,t)=>s+t.sides.reduce((a,b)=>a+b.current.starts,0),0)+' documented post-trade starts; 44 historical entries unchanged.');
console.log(JSON.stringify(audits.map(x=>({id:x.id,sides:x.sides.map(s=>({manager:s.manager,old:s.prior.points,new:s.current.points,starts:s.current.starts}))}))));
