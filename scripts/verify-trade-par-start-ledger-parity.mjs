// Independently reconcile every previously matched trade-asset starter against
// the archived Sleeper starter ledger. Validates points/owner/weeks, NOT the
// position-relative PAR replacement baseline, future/keeper value or causation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const archive=read('data/trade_par_preview.json');
const v9=read('data/v9_trade_engine.json');
assert.ok(Array.isArray(archive.records)&&Array.isArray(v9.sides));
const norm=value=>String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const sides=new Map();
for(const row of v9.sides){
 const key=String(row.trade_id)+'|'+String(row.manager);
 assert.ok(!sides.has(key),'Duplicate historical transaction side '+key);
 sides.set(key,row);
}
const byYear=new Map();
for(let year=2020;year<=2025;year++){
 const source=read('data/player_starts_'+year+'.json');
 assert.equal(source.year,year);
 const weeks=new Map();
 for(const block of source.weeks){
  assert.ok(!weeks.has(block.week),'Duplicate starter ledger week '+year+' '+block.week);
  const teams=new Map();
  for(const team of block.teams){
   const key=String(team.roster);
   assert.ok(!teams.has(key),'Duplicate manager roster on a ledger week');
   teams.set(key,team);
  }
  weeks.set(block.week,teams);
 }
 byYear.set(year,weeks);
}
const seen=new Map(),perYear=new Map();
let playerGroups=0,starts=0,zeroPointStarts=0;
for(const trade of archive.records.filter(t=>t.year>=2020&&t.year<=2025)){
 for(const side of trade.sides){
  const source=sides.get(String(trade.id)+'|'+String(side.manager));
  assert.ok(source,'Missing original trade-side ownership record '+trade.id+' '+side.manager);
  assert.equal(source.year,trade.year,'Wrong original trade season');
  for(const p of side.matched||[]){
   assert.ok(Array.isArray(p.sourceWeeks)&&p.sourceWeeks.length>0,'Matched player must show at least one source start');
   assert.equal(new Set(p.sourceWeeks).size,p.sourceWeeks.length,'Duplicate source week in matched asset');
   assert.equal(p.starts,p.sourceWeeks.length,'Claimed start count differs from source weeks');
   let points=0;
   for(const week of p.sourceWeeks){
    assert.ok(week>trade.week&&week<=14,'Out-of-scope trade PAR starter week');
    const team=byYear.get(trade.year).get(week)?.get(String(source.team_id));
    assert.ok(team,'Missing season/week roster lineup '+trade.year+'/'+week+'/'+source.team_id);
    const matched=team.players.filter(item=>norm(item[1])===norm(p.asset));
    assert.equal(matched.length,1,'Exact/normalized player identity not uniquely resolved on lineup: '+trade.id+' '+p.asset+' '+week);
    const [id,name,pos,score]=matched[0];
    assert.ok(String(id).trim()&&typeof pos==='string'&&Number.isFinite(score),'Malformed provider scorer row');
    const key=[trade.year,week,source.team_id,id].join('|');
    assert.ok(!seen.has(key),'Same player start attributed to more than one trade: '+key);
    seen.set(key,{tradeId:String(trade.id),manager:side.manager,asset:p.asset,week,score,pos});
    points+=score;starts++;if(score===0)zeroPointStarts++;
    const row=perYear.get(trade.year)||{starts:0,groups:0};
    row.starts++;perYear.set(trade.year,row);
   }
   assert.ok(Math.abs(points-p.points)<.031,'Asset aggregated points differ from underlying scored starts: '+trade.id+' '+p.asset+' expected '+p.points+' got '+points);
   playerGroups++;
   perYear.get(trade.year).groups++;
  }
 }
}
assert.equal(playerGroups,110,'Matched trade asset research scope changed; investigate source ledger changes');
assert.equal(starts,611,'Original trade PAR starter attribution scope changed; investigate source ledger changes');
assert.equal(seen.size,starts,'Duplicate source start impossible');
const report=[
 '# Trade PAR starter-source parity audit','',
 '> This audit verifies archived *starter fantasy points* for matched trade assets, not the replacement-level denominator used to calculate PAR. It cannot by itself certify the 18-trade leaderboard or any four/six-trade expansion.','',
 '| Season | Matched player groups | Exact starter weeks reconciled |',
 '|---|---:|---:|',
 ...[2020,2021,2022,2023,2024,2025].map(y=>'| '+y+' | '+(perYear.get(y)?.groups||0)+' | '+(perYear.get(y)?.starts||0)+' |'),
 '| **Total** | **'+playerGroups+'** | **'+starts+'** |','',
 '- All matched asset points equal the sum of their original owner/roster's lineup scoring on qualifying later weeks.',
 '- Every record has a unique player identity on its lineup and no start is counted by two trades.',
 '- '+zeroPointStarts+' included starter observations had zero fantasy points; zero-point starters are NOT zero starts and could have negative position-relative PAR.',
 '- The position/slot-eligible weekly replacement benchmark is not supplied by this source audit and remains independently unverified.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
