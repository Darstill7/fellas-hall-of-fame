import fs from 'node:fs';
const years=[2020,2021,2022,2023,2024,2025];
const counts={},examples={},bySeason=[],byOwner={},validPositions=new Set(['QB','RB','WR','TE','DEF']);
for(const year of years){
 const season={year,teamWeeks:0,reasonCounts:{},rowsWithAnySourceFlag:0};
 for(let week=1;week<=(year===2020?13:14);week++){
  const path=year===2025&&(week===1||week===7)?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const data=JSON.parse(fs.readFileSync(path,'utf8')),rosters=Array.isArray(data)?data:data.rosters;
  if(rosters.length!==10)throw Error('Expected 10 rosters at '+path);
  for(const r of rosters){
   season.teamWeeks++;const ownerKey=year+'|'+r.owner;const ownerRow=byOwner[ownerKey]??={year,owner:r.owner,teamWeeks:0,flaggedWeeks:0,reasons:{}};ownerRow.teamWeeks++;const pool=[...r.starters,...r.bench],reasons=[];
   if(!Number.isFinite(r.points))reasons.push('missing_team_points');
   if(new Set(pool.map(x=>String(x.id))).size!==pool.length)reasons.push('duplicate_player_ids');
   if(!r.starters.every(p=>validPositions.has(p.position)))reasons.push('nonstandard_starter_position');
   if(r.starters.length!==9)reasons.push('nonstandard_starter_count');
   const sum=r.starters.reduce((s,p)=>s+Number(p.points||0),0);
   if(Number.isFinite(r.points)&&Math.abs(sum-r.points)>=0.07)reasons.push('starter_score_mismatch');
   if(reasons.length){season.rowsWithAnySourceFlag++;ownerRow.flaggedWeeks++}
   for(const reason of reasons){
    counts[reason]=(counts[reason]||0)+1;ownerRow.reasons[reason]=(ownerRow.reasons[reason]||0)+1;
    season.reasonCounts[reason]=(season.reasonCounts[reason]||0)+1;
    if(!examples[reason])examples[reason]=[];
    if(examples[reason].length<6)examples[reason].push({year,week,owner:r.owner});
   }
  }
 }
 bySeason.push(season);
}
const total=bySeason.reduce((s,r)=>s+r.teamWeeks,0);
if(total!==830)throw Error('Incomplete archived team-week coverage '+total);
const output={version:'historical-lineup-source-exclusion-audit-v1',status:'source_integrity_observations_only',totalTeamWeeks:total,counts,examples,bySeason,byOwner:Object.values(byOwner).sort((a,b)=>a.year-b.year||a.owner.localeCompare(b.owner)),limitations:['These source flags do not include mathematical optimizer infeasibility, lock-time eligibility, IR/taxi or historical FLEX rules.','Multiple flags can occur on one team-week. A zero flag count would not certify start/sit skill.']};
fs.writeFileSync('data-integrity/lineup-source-exclusion-audit-2020-2025.json',JSON.stringify(output,null,2)+'\n');
console.log('LINEUP SOURCE EXCLUSION AUDIT',JSON.stringify({totalTeamWeeks:total,counts,bySeason}));
