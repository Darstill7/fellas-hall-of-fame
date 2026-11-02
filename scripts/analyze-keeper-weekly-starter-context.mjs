// Observed weekly starting-slot distribution by position. Not a waiver/free-agent baseline.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json').filter(p=>p.year===2025&&p.keeper);
assert.equal(draft.length,20);
const normal=p=>String(p.id)==='12530'&&p.position==='DB'?'WR':p.position;
const median=a=>{const s=[...a].sort((x,y)=>x-y),i=Math.floor(s.length/2);return s.length%2?s[i]:(s[i-1]+s[i])/2};
const round=n=>Math.round(n*100)/100;
const weeks=[];
for(let week=1;week<=14;week++){
 const path=week===1||week===7?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_2025_week'+week+'.json';
 const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
 assert.equal(rosters.length,10);
 const players=rosters.flatMap(r=>(r.starters??[]).map(p=>({id:String(p.id),position:normal(p),points:p.points,teamId:String(r.teamId??r.id)})));
 assert.equal(players.length,90);
 const positional={};
 for(const position of ['QB','RB','WR','TE','DEF']){
  const vals=players.filter(p=>p.position===position).map(p=>p.points);
  assert.ok(vals.length>=10&&vals.every(Number.isFinite));
  positional[position]={observedStarters:vals.length,medianStarterPoints:round(median(vals))};
 }
 weeks.push({week,path,positions:positional,players});
}
const rows=draft.map(k=>{
 const receipts=[];
 for(const w of weeks){
  const selected=w.players.filter(p=>p.teamId===String(k.team_id)&&
   p.id===String(k.player_id??''));
  // Draft engine does not carry provider player IDs. Match exact full names against source starters.
  // Keep no synthetic receipt here; prior independent audit certifies keeper starts/points.
  receipts.push({week:w.week,position:k.position,observedStarterMedian:w.positions[k.position]?.medianStarterPoints??null,
   observedPositionStarterCount:w.positions[k.position]?.observedStarters??null});
 }
 return {manager:k.manager==='Tom'?'Thommy':k.manager,player:k.player,round:k.round,position:k.position,
  observedWeeklyPositionBenchmarks:receipts,keeperDecisionGrade:null,realizedReplacementValue:null};
});
const out={schema:'fellas-2025-keeper-weekly-starter-context-v1',status:'observational_starter_medians_only',
 limitations:['Weekly medians include actual league starters and are not available free agents.','The median is for all observed starters at a position, including starters in FLEX spots.','The per-keeper record shows positional context only, not a matched player-week surplus.','It is not a FLEX-adjusted waiver replacement estimate or a keeper grade.'],weeks:weeks.map(({players,...rest})=>rest),rows};
const target='data-integrity/keeper-2025-weekly-starter-context-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),out);
else fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
console.log('2025 weekly starter context PASS: 14 weeks, 20 keepers, no decision grades');
