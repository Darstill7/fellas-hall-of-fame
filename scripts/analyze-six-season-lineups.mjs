import fs from 'node:fs';
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const eligible=(p,s)=>s==='FLEX'?['RB','WR','TE'].includes(p.position):p.position===s;
function maximize(players){
 let states=new Map([[0,0]]);
 for(const p of players.filter(x=>Number.isFinite(x.points))){
  const next=new Map(states);
  for(const [mask,score] of states)for(let i=0;i<slots.length;i++){
   if((mask&(1<<i))||!eligible(p,slots[i]))continue;
   const key=mask|(1<<i),candidate=score+p.points;
   if(!next.has(key)||next.get(key)<candidate)next.set(key,candidate);
  }states=next;
 }return states.get((1<<slots.length)-1)??null;
}
const years=[2020,2021,2022,2023,2024,2025];const rows=[],summary=[];
for(const year of years){
 const limit=year===2020?13:14;
 let comparable=0,ungraded=0;
 for(let week=1;week<=limit;week++){
  const path=year===2025&&(week===1||week===7)?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const raw=JSON.parse(fs.readFileSync(path,'utf8'));const rosters=Array.isArray(raw)?raw:raw.rosters;
  for(const r of rosters){
   const actual=r.points;const pool=[...r.starters,...r.bench];const optimal=maximize(pool);
   const startersValid=r.starters.every(p=>['QB','RB','WR','TE','DEF'].includes(p.position));
   const duplicates=new Set(pool.map(p=>String(p.id))).size!==pool.length;
   const startsTotal=r.starters.reduce((v,p)=>v+Number(p.points||0),0);
   const valid=Number.isFinite(actual)&&Number.isFinite(optimal)&&!duplicates&&startersValid&&Math.abs(actual-startsTotal)<.07&&optimal+0.07>=actual;
   const row={year,week,owner:r.owner,teamId:r.teamId,status:valid?'research_only_comparable':'ungraded_eligibility_or_source_gap'};
   if(valid){row.actualPoints=+actual.toFixed(2);row.optimalPoints=+optimal.toFixed(2);row.hindsightGap=+Math.max(0,optimal-actual).toFixed(2);comparable++}else ungraded++;
   rows.push(row);
  }
 }summary.push({year,comparable,ungraded,teamWeeks:comparable+ungraded});
}
if(rows.length!==830)throw Error('Expected 830 recovered regular-season roster observations, got '+rows.length);
const managerSeasons=[];
for(const year of years){const seasonRows=rows.filter(r=>r.year===year);for(const owner of [...new Set(seasonRows.map(r=>r.owner))]){const group=seasonRows.filter(r=>r.owner===owner),eligible=group.filter(r=>r.status==='research_only_comparable');managerSeasons.push({year,owner,observedWeeks:group.length,comparableWeeks:eligible.length,ungradedWeeks:group.length-eligible.length,meanHindsightGap:eligible.length?+(eligible.reduce((s,r)=>s+r.hindsightGap,0)/eligible.length).toFixed(2):null,totalHindsightGap:eligible.length?+eligible.reduce((s,r)=>s+r.hindsightGap,0).toFixed(2):null});}}
const out={version:'sleeper-six-season-hindsight-lineups-v1',managerSeasons,method:'Ex-post highest-scoring available recorded roster lineup, QB 2RB 2WR TE 2FLEX DEF; FLEX RB/WR/TE only. Excludes observed nonstandard starting positions and insufficient data. Not ex-ante skill, real WAR, or proof of trade causality.',summary,rows};
fs.writeFileSync('data-integrity/sleeper-hindsight-lineups-2020-2025.json',JSON.stringify(out,null,2)+'\n');
console.log('SIX-SEASON HINDSIGHT LINEUP PILOT',JSON.stringify(summary));
console.log('MANAGER-SEASON HINDSIGHT COVERAGE',JSON.stringify(managerSeasons.map(x=>({year:x.year,owner:x.owner,comparableWeeks:x.comparableWeeks,ungradedWeeks:x.ungradedWeeks}))));
