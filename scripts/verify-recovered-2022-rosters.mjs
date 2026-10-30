import fs from 'node:fs';
const matchups=JSON.parse(fs.readFileSync('data/sleeper_matchups_2022.json','utf8'));
let total=0;
for(let week=1;week<=14;week++){
 const d=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2022_week'+week+'.json','utf8'));
 if(d.year!==2022||d.week!==week||d.rosters.length!==10)throw Error('2022 snapshot structure week '+week);
 const m=matchups.find(x=>x.week===week);if(!m)throw Error('2022 matchup archive missing week '+week);
 const scored=new Map(m.games.flatMap(g=>[g.home,g.away].map(side=>[side[0],side[2]])));
 if(scored.size!==10)throw Error('2022 matchup ownership incomplete week '+week);
 const owners=new Set(),ids=new Set();
 for(const r of d.rosters){
  if(!r.success||!r.owner||r.starters?.length!==9||!Array.isArray(r.bench))throw Error('2022 roster shape week '+week+' team '+r.teamId);
  if(owners.has(r.owner)||ids.has(r.teamId))throw Error('2022 duplicate owner/id week '+week);
  owners.add(r.owner);ids.add(r.teamId);
  if(!Number.isFinite(scored.get(r.owner))||Math.abs(scored.get(r.owner)-r.points)>.02)throw Error('2022 matchup point mismatch week '+week+' owner '+r.owner);
  if(Math.abs(r.starters.reduce((s,p)=>s+Number(p.points||0),0)-r.points)>.07)throw Error('2022 starter sum mismatch week '+week+' owner '+r.owner);
  total++;
 }
}
console.log('2022 historical roster reconciliation PASS: '+total+' team-week snapshots');
