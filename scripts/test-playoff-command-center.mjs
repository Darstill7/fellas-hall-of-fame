import assert from 'node:assert/strict';import fs from 'node:fs';import {prepare,analyze} from '../assets/playoff-command-center.mjs';
const data=JSON.parse(fs.readFileSync('data/playoff_race_v1.json','utf8')),m=prepare(data),r=analyze(m);
assert.equal(r.outcomes,2**m.games.length);assert.equal(r.rows.length,10);
for(const x of r.rows){assert.ok(x.best<=x.worst);assert.ok(x.playoffCertain<=x.playoffPossible);assert.ok(x.byeCertain<=x.byePossible);assert.ok(x.byePossible<=x.playoffPossible);assert.ok(x.minWins<=x.maxWins);}
if(m.week===11){assert.equal(r.outcomes,32768);assert.equal(r.rows.find(x=>x.name==='Kuhl').playoff,'Impossible');for(const n of ['Stew','Mitch','Tony'])assert.equal(r.rows.find(x=>x.name===n).playoff,'Guaranteed');}
if(m.games.length){const g=m.games[0];assert.equal(analyze(m,{0:g.a}).outcomes,r.outcomes/2);assert.throws(()=>analyze(m,{0:99}));}
const fixed=Object.fromEntries(m.games.map((g,i)=>[i,g.a])),one=analyze(m,fixed);assert.equal(one.outcomes,1);assert.equal(one.rows.reduce((s,x)=>s+x.minWins,0),m.wins.reduce((s,x)=>s+x,0)+m.games.length);
const broken=structuredClone(data);if(m.games.length){delete broken.fixtures[m.week+1];assert.throws(()=>prepare(broken));}
console.log('Playoff command center: '+r.outcomes+' decisive-game outcomes verified; conservative tie bounds passed');
