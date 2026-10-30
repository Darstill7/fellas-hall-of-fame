import fs from 'node:fs';
const matchups=JSON.parse(fs.readFileSync('data/sleeper_matchups_2023.json','utf8'));
let checked=0;
for(const week of Array.from({length:14},(_,i)=>i+1)){
 const d=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2023_week'+week+'.json','utf8'));
 if(d.year!==2023||d.week!==week||d.rosters.length!==10)throw Error('Missing 2023 roster week '+week);
 const m=matchups.find(x=>x.week===week);if(!m)throw Error('No canonical 2023 matchups week '+week);
 const points=new Map(m.games.flatMap(x=>[x.home,x.away].map(s=>[s[0],s[2]])));
 for(const row of d.rosters){
  if(!row.success||row.starters.length!==9||!Array.isArray(row.bench)||!Number.isFinite(points.get(row.owner))||Math.abs(points.get(row.owner)-row.points)>.02)throw Error('2023 historical owner/score mismatch week '+week+' '+row.owner);
  if(Math.abs(row.starters.reduce((a,x)=>a+Number(x.points||0),0)-row.points)>.07)throw Error('2023 starter points mismatch '+week+' '+row.owner);
  checked++;
 }
}
console.log('2023 recovered roster reconciliation PASS: '+checked+' team-weeks');
