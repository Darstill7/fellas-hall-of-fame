import fs from 'node:fs';
const missing=[2,3,4,5,6,8,9,10,11,12,13,14];
const owner=['Darstill','JMidd','thommy','Dsylvester9','Sheffla','huppdawg80','tsteg','yogurtslinger15','ckuhl5','birchhh'];
const archive=JSON.parse(fs.readFileSync('data/sleeper_matchups_2025.json','utf8'));
const byWeek=new Map(archive.map(x=>[x.week,x]));
let verified=0;const issues=[];
for(const week of missing){
 const path='data/sleeper_roster_snapshots_2025_week'+week+'.json';
 const raw=JSON.parse(fs.readFileSync(path,'utf8'));
 if(raw.year!==2025||raw.week!==week||raw.rosters.length!==10)throw Error('Invalid historical weekly roster structure '+week);
 const match=byWeek.get(week);if(!match)throw Error('Missing canonical matchup '+week);
 const scored=new Map(match.games.flatMap(x=>[x.home,x.away].map(y=>[y[0],y[2]])));
 if(scored.size!==10)throw Error('Mismatch in matched owner count week '+week);
 for(const row of raw.rosters){
  if(!row.success||row.owner!==owner[row.teamId-1]||!Array.isArray(row.starters)||!Array.isArray(row.bench)||row.starters.length!==9||row.bench.length<1)issues.push({week,teamId:row.teamId,problem:'Roster identity or shape'});
  const expected=scored.get(row.owner);
  if(!Number.isFinite(expected)||Math.abs(expected-row.points)>0.02)issues.push({week,teamId:row.teamId,problem:'Matchup score discrepancy',expected,actual:row.points});
  const sum=row.starters.reduce((s,p)=>s+Number(p.points||0),0);
  if(Math.abs(sum-row.points)>0.07)issues.push({week,teamId:row.teamId,problem:'Starter point sum discrepancy',sum,actual:row.points});
  const starters=new Set(row.starters.map(x=>String(x.id)));
  if(row.bench.some(x=>starters.has(String(x.id))))issues.push({week,teamId:row.teamId,problem:'Player on starter and bench'});
  verified++;
 }
}
if(issues.length){console.error(JSON.stringify(issues.slice(0,25),null,2));throw Error(issues.length+' roster reconciliation failures')}
console.log('RECOVERED ROSTER RECONCILIATION PASS: '+verified+' ten-team-week snapshots, '+missing.length+' newly recovered 2025 weeks; lineup optimization still requires eligibility validation.');
