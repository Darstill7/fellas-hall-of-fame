import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='data-integrity/sleeper-sync-candidates';
if(!fs.existsSync(dir)){console.log('STAGED WEEKLY CANDIDATE CHECK: none');process.exit(0)}
const files=fs.readdirSync(dir).filter(p=>/^2026-week\\d+\\.json$/.test(p)).sort();
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const managers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const names=new Set(managers);
const prior=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const last=Math.max(...prior.map(g=>g.week));
for(const file of files){
 const c=JSON.parse(fs.readFileSync(dir+'/'+file,'utf8'));
 assert.equal(c.status,'REVIEW_REQUIRED');
 assert.equal(c.league,'1340027406009761792');
 assert.equal(c.year,2026);
 assert.equal(c.week,last+1,'Only the next week may be staged before canonical import');
 assert.equal(file,'2026-week'+c.week+'.json');
 assert.equal(c.matchupCount,5);
 assert.equal(c.games.length,5);
 const participants=new Set();
 for(const g of c.games){
  assert.equal(g.year,c.year);assert.equal(g.week,c.week);assert.equal(g.stage,'regular');
  assert.equal(g.era,'Sleeper');
  assert.ok(names.has(g.home)&&names.has(g.away)&&g.home!==g.away);
  assert.ok(!participants.has(g.home)&&!participants.has(g.away));
  participants.add(g.home);participants.add(g.away);
  assert.ok(Number.isFinite(g.homeScore)&&g.homeScore>=0);
  assert.ok(Number.isFinite(g.awayScore)&&g.awayScore>=0);
  assert.equal(g.winner,g.homeScore>g.awayScore?'HOME':g.awayScore>g.homeScore?'AWAY':'TIE');
  assert.equal(round(g.margin),round(Math.abs(g.homeScore-g.awayScore)));
 }
 assert.equal(participants.size,10);
 const games=[...prior,...c.games];const record=new Map(managers.map(m=>[m,{manager:m,wins:0,losses:0,pointsFor:0,pointsAgainst:0}]));
 const weeks=new Map();
 for(const g of games){
  for(const [m,p,a] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
   const r=record.get(m);assert.ok(r,'Unknown canonical manager '+m);
   r.wins+=Number(p>a);r.losses+=Number(p<a);
   r.pointsFor+=p;r.pointsAgainst+=a;
   const teamWeek=weeks.get(g.week)||new Set();
   assert.ok(!teamWeek.has(m),'Duplicate manager in week '+g.week+': '+m);
   teamWeek.add(m);weeks.set(g.week,teamWeek);
  }
 }
 for(let w=1;w<=c.week;w++)assert.equal(weeks.get(w)?.size,10,'Incomplete week '+w);
 const snapshot=c.providerStandingsSnapshot;
 assert.equal(snapshot.seasonThroughWeek,c.week);
 assert.equal(snapshot.teams.length,10);
 const seen=new Set();
 for(const team of snapshot.teams){
  assert.ok(!seen.has(team.manager));seen.add(team.manager);
  const computed=record.get(team.manager);assert.ok(computed,'Unknown provider manager');
  assert.equal(computed.wins,team.wins,team.manager+' wins');
  assert.equal(computed.losses,team.losses,team.manager+' losses');
  assert.equal(round(computed.pointsFor),team.pointsFor,team.manager+' PF');
  assert.equal(round(computed.pointsAgainst),team.pointsAgainst,team.manager+' PA');
 }
 assert.equal(seen.size,10);
 console.log('STAGED WEEKLY CANDIDATE PASS: '+file+'; 5 matchups, 10 managers, '+games.length+' games, provider standings reconciled; no canonical changes');
}
