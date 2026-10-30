import fs from 'node:fs';
const matches=JSON.parse(fs.readFileSync('data/sleeper_matchups_2020.json','utf8'));let checked=0;
for(let week=1;week<=13;week++){
 const doc=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2020_week'+week+'.json','utf8'));
 if(doc.year!==2020||doc.week!==week||doc.rosters?.length!==10)throw Error('2020 invalid roster week '+week);
 const match=matches.find(x=>x.week===week);if(!match)throw Error('2020 missing matchup '+week);
 const scores=new Map(match.games.flatMap(g=>[g.home,g.away].map(s=>[s[0],s[2]])));
 if(scores.size!==10)throw Error('2020 incomplete scores '+week);
 const seen=new Set();
 for(const r of doc.rosters){
  if(!r.success||!r.owner||r.starters?.length!==9||!Array.isArray(r.bench)||seen.has(r.owner))throw Error('2020 roster invalid '+week+' '+r.teamId);
  seen.add(r.owner);
  if(!Number.isFinite(scores.get(r.owner))||Math.abs(scores.get(r.owner)-r.points)>.02)throw Error('2020 canonical score mismatch '+week+' '+r.owner);
  if(Math.abs(r.starters.reduce((n,p)=>n+Number(p.points||0),0)-r.points)>.07)throw Error('2020 starter score mismatch '+week+' '+r.owner);
  checked++;
 }
}
console.log('2020 HISTORICAL ROSTERS PASS: '+checked+' ten-team weekly observations');
