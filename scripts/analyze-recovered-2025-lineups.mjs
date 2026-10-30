import fs from 'node:fs';
const weeks=[2,3,4,5,6,8,9,10,11,12,13,14];
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const eligible=(player,slot)=>slot==='FLEX'?['RB','WR','TE'].includes(player.position):player.position===slot;
function bestLineup(starters,bench){
 const players=[...starters,...bench].filter(p=>Number.isFinite(p.points));
 let dp=new Map([[0,{score:0,chosen:[]}]]);
 for(const p of players){
  const next=new Map(dp);
  for(const [mask,state] of dp)for(let slot=0;slot<slots.length;slot++){
   if((mask&(1<<slot))||!eligible(p,slots[slot]))continue;
   const candidate={score:state.score+p.points,chosen:[...state.chosen,{slot:slots[slot],player:p.name,points:p.points}]};
   const newMask=mask|(1<<slot);if(!next.has(newMask)||next.get(newMask).score<candidate.score)next.set(newMask,candidate);
  }
  dp=next;
 }
 return dp.get((1<<slots.length)-1)||null;
}
const report={version:'2025-recovered-roster-hindsight-v1',method:'Conservative hindsight optimal lineup from recorded starters+bench, using QB/RB/RB/WR/WR/TE/FLEX/FLEX/DEF; FLEX only RB/WR/TE. No DB FLEX permitted. Not a decision quality grade, validated waiver replacement, or true WAR.',weeks,teams:[]};
for(const week of weeks){
 const doc=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2025_week'+week+'.json','utf8'));
 for(const roster of doc.rosters){
  const best=bestLineup(roster.starters,roster.bench);
  const actual=roster.points;
  if(!best||!Number.isFinite(actual)){report.teams.push({week,teamId:roster.teamId,owner:roster.owner,status:'not_comparable_roster_eligibility'});continue;}
  const gap=Math.round(100*(best.score-actual))/100;
  if(gap<-.07){report.teams.push({week,teamId:roster.teamId,owner:roster.owner,status:'not_comparable_possible_DB_FLEX_or_scoring_rule',actualPoints:actual,conservativeOptimal:Math.round(best.score*100)/100});continue;}
  report.teams.push({week,teamId:roster.teamId,owner:roster.owner,actualPoints:actual,optimalPoints:Math.round(best.score*100)/100,hindsightGap:gap,optimalLineup:best.chosen,status:'research_only_comparable'});
 }
}
if(report.teams.length!==120)throw Error('Expected 120 complete recovered roster observations');
fs.writeFileSync('data-integrity/2025-recovered-lineup-pilot.json',JSON.stringify(report,null,2)+'\n');
console.log('RESEARCH ONLY 2025 LINEUP PILOT: '+report.teams.length+' team-weeks across '+weeks.length+' newly recovered weeks. Not a certified skill grade.');
