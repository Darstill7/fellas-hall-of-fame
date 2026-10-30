import fs from 'node:fs';
const archive=JSON.parse(fs.readFileSync('data/sleeper_matchups_2024.json','utf8'));
const owners=['Darstill','JMidd','thommy','Dsylvester9','Sheffla','huppdawg80','tsteg','yogurtslinger15','ckuhl5','birchhh'];
let checks=0;
for(const week of Array.from({length:14},(_,i)=>i+1)){
 const doc=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2024_week'+week+'.json','utf8'));
 if(doc.year!==2024||doc.week!==week||doc.rosters?.length!==10)throw Error('2024 roster snapshot structure failed week '+week);
 const matchup=archive.find(x=>x.week===week);
 if(!matchup)throw Error('2024 canonical week missing '+week);
 const scored=new Map(matchup.games.flatMap(g=>[g.home,g.away].map(y=>[y[0],y[2]])));
 for(const row of doc.rosters){
  if(!row.success||row.owner!==owners[row.teamId-1]||row.starters?.length!==9||!Array.isArray(row.bench))throw Error('2024 owner/roster coverage mismatch week '+week+' roster '+row.teamId);
  if(!Number.isFinite(scored.get(row.owner))||Math.abs(scored.get(row.owner)-row.points)>.02)throw Error('2024 matchup total mismatch week '+week+' '+row.owner);
  const startTotal=row.starters.reduce((n,p)=>n+Number(p.points||0),0);
  if(Math.abs(startTotal-row.points)>.07)throw Error('2024 lineup starter point mismatch week '+week+' '+row.owner);
  checks++;
 }
}
console.log('2024 HISTORICAL ROSTER RECONCILIATION PASS: '+checks+' roster-weeks, Weeks 1-14');
