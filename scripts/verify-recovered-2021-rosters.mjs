import fs from 'node:fs';
const matches=JSON.parse(fs.readFileSync('data/sleeper_matchups_2021.json','utf8'));let count=0;
for(let week=1;week<=14;week++){
 const doc=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2021_week'+week+'.json','utf8'));
 if(doc.year!==2021||doc.week!==week||doc.rosters?.length!==10)throw Error('2021 invalid roster week '+week);
 const m=matches.find(x=>x.week===week);if(!m)throw Error('2021 missing matchup '+week);
 const scores=new Map(m.games.flatMap(g=>[g.home,g.away].map(s=>[s[0],s[2]])));
 if(scores.size<8||scores.size>10)throw Error('2021 unexpected matchup coverage week '+week+' teams '+scores.size);
 const owners=new Set(),ids=new Set();
 for(const r of doc.rosters){
  if(!r.success||!r.owner||r.starters?.length!==9||!Array.isArray(r.bench)||owners.has(r.owner)||ids.has(r.teamId))throw Error('2021 ownership or shape mismatch '+week+' '+r.teamId);
  owners.add(r.owner);ids.add(r.teamId);
  if(scores.has(r.owner)&&(!Number.isFinite(scores.get(r.owner))||Math.abs(scores.get(r.owner)-r.points)>.02))throw Error('2021 matchup score mismatch '+week+' '+r.owner);
  if(Math.abs(r.starters.reduce((sum,p)=>sum+Number(p.points||0),0)-r.points)>.07)throw Error('2021 starter points mismatch '+week+' '+r.owner);
  count++;
 }
}
if(count!==140)throw Error('Missing historical 2021 team-week rosters');
console.log('2021 recovered weekly roster reconciliation PASS: '+count+' team-weeks (unpaired teams are checked by starter sum, not invented matchups)');
