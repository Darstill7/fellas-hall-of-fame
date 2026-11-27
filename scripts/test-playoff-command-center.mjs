import assert from 'node:assert/strict';import fs from 'node:fs';import {prepare,analyze,remainingSOS} from '../assets/playoff-command-center.mjs';
const data=JSON.parse(fs.readFileSync('data/playoff_race_v1.json','utf8')),m=prepare(data),r=analyze(m);
assert.equal(r.outcomes,2**m.games.length);assert.equal(r.rows.length,10);
for(const x of r.rows){assert.ok(x.best<=x.worst);assert.ok(x.playoffCertain<=x.playoffPossible);assert.ok(x.byeCertain<=x.byePossible);assert.ok(x.byePossible<=x.playoffPossible);assert.ok(x.minWins<=x.maxWins);}
if(m.week===11){assert.equal(r.outcomes,32768);assert.equal(r.rows.find(x=>x.name==='Kuhl').playoff,'Impossible');for(const n of ['Stew','Mitch','Tony'])assert.equal(r.rows.find(x=>x.name===n).playoff,'Guaranteed');}
if(m.games.length){const g=m.games[0];assert.equal(analyze(m,{0:g.a}).outcomes,r.outcomes/2);assert.throws(()=>analyze(m,{0:99}));}
const fixed=Object.fromEntries(m.games.map((g,i)=>[i,g.a])),one=analyze(m,fixed);assert.equal(one.outcomes,1);assert.equal(one.rows.reduce((s,x)=>s+x.minWins,0),m.wins.reduce((s,x)=>s+x,0)+m.games.length);
const broken=structuredClone(data);if(m.games.length){delete broken.fixtures[m.week+1];assert.throws(()=>prepare(broken));}
console.log('Playoff command center: '+r.outcomes+' decisive-game outcomes verified; conservative tie bounds passed');

const sos=remainingSOS(data);assert.equal(sos.length,10);const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));for(const n of m.names){const name=n==='Tom'?'Thommy':n;const scores=ledger.games.filter(g=>g.year===2026&&g.stage==='regular'&&g.week<=m.week&&g.week>=Math.max(1,m.week-2)).flatMap(g=>g.home===name?[g.homeScore]:g.away===name?[g.awayScore]:[]);assert.equal(scores.length,Math.min(3,m.week));assert.equal(data.teams[n].recent_mean,+(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2));}for(const row of sos){assert.equal(row.opponents.length,m.end-m.week);if(row.opponents.length){assert.ok(Math.abs(row.score-(.7*row.season+.3*row.recent))<1e-8);assert.ok(row.record>=0&&row.record<=1);assert.ok(row.allPlay>=0&&row.allPlay<=1);}}for(let i=1;i<sos.length;i++)assert.ok((sos[i-1].score??0)>=(sos[i].score??0));console.log('Remaining SOS: canonical recent scoring and all ten opponent schedules verified');

import {rootingGuide} from '../assets/playoff-command-center.mjs';
for(const n of m.names){
 const guide=rootingGuide(m,n);
 assert.equal(guide.length,m.games.length?5:0);
 for(const g of guide){
  assert.equal(g.choices.reduce((s,c)=>s+c.outcomes,0),r.outcomes);
  for(const [i,c] of g.choices.entries()){
   const a=analyze(m,{[g.i]:i===0?g.a:g.b}),row=a.rows.find(x=>x.name===n);
   assert.equal(c.outcomes,a.outcomes);
   for(const k of ['playoffCertain','playoffPossible','byeCertain','byePossible'])assert.equal(c[k],row[k]);
  }
 }
}
if(m.games.length){const g=m.games[0];const fixedGuide=rootingGuide(m,m.names[0],{0:g.a});assert.equal(fixedGuide[0].choices[1].outcomes,0);}
assert.throws(()=>rootingGuide(m,'not a manager'));
console.log('Rooting guide: conditional outcome counts independently cross-checked against exact solver');

import {bracketPaths} from '../assets/playoff-command-center.mjs';
const brackets=Object.fromEntries(m.names.map(n=>[n,bracketPaths(m,n)]));
for(const n of m.names){
 const b=brackets[n],a=r.rows.find(x=>x.name===n);
 assert.equal(b.outcomes,r.outcomes);assert.equal(b.byePossible,a.byePossible);
 assert.equal(b.seedCounts.findIndex(x=>x>0)+1,a.best);
 assert.equal(b.seedCounts.map((x,i)=>x?i+1:0).reduce((a,b)=>Math.max(a,b)),a.worst);
 assert.ok(b.pairs.every(p=>p.opponent!==n&&p.seed+p.opponentSeed===9&&p.seed>=3&&p.seed<=6&&p.outcomes>0&&p.outcomes<=b.seedCounts[p.seed-1]));
 for(const p of b.pairs){const reciprocal=brackets[p.opponent].pairs.find(q=>q.opponent===n&&q.seed===p.opponentSeed);assert.equal(reciprocal?.outcomes,p.outcomes);}
}
const unique={names:['a','b','c','d','e','f','g','h','i','j'],wins:[10,9,8,7,6,5,4,3,2,1],games:[]};
assert.deepEqual(bracketPaths(unique,'c').pairs,[{seed:3,opponentSeed:6,opponent:'f',outcomes:1}]);
assert.equal(bracketPaths(unique,'a').pairs.length,0);
const tied={...unique,wins:Array(10).fill(7)};
assert.equal(bracketPaths(tied,'a').pairs.length,36);
assert.throws(()=>bracketPaths(m,'unknown'));
if(m.games.length)assert.equal(bracketPaths(m,m.names[0],{0:m.games[0].a}).outcomes,r.outcomes/2);
console.log('Bracket paths: reciprocal pair counts, distinct-seed feasibility, fixed picks and tie fixtures verified');

import {championshipForecast} from '../assets/playoff-command-center.mjs';
const forecast=championshipForecast(data,2500);
assert.deepEqual(forecast,championshipForecast(data,2500));
for(const [k,n] of Object.entries({playoffs:6,bye:2,semifinal:4,final:2,champion:1}))assert.equal(forecast.rows.reduce((s,x)=>s+x[k],0),n*forecast.iterations);
for(const x of forecast.rows){assert.ok(x.champion<=x.final&&x.final<=x.semifinal&&x.semifinal<=x.playoffs&&x.bye<=x.semifinal);}
assert.throws(()=>championshipForecast(data,0));
console.log('Championship forecast: reproducibility and stage conservation verified');
