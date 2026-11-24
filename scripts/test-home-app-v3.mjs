import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildHomeDashboard} from '../assets/home-app-v3.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const guide=read('data/season_guide.json'),ledger=read('data/unified_record_book_2016_2026.json');
const d=buildHomeDashboard(guide,ledger);
assert.equal(d.standings.length,10);assert.equal(d.latest.length,5);
assert.equal(d.week,guide['2026'].standings[0].games);
if(d.week===11){assert.equal(d.standings.find(r=>r.name==='Stew').streak,'W7');assert.equal(d.leaders[0].name,'Tony');assert.equal(d.leaders[0].latest,142.3);}
const bad=structuredClone(guide);bad['2026'].standings[0].pf+=1;assert.throws(()=>buildHomeDashboard(bad,ledger),/Standings mismatch/);
assert.throws(()=>buildHomeDashboard(guide,{games:ledger.games.slice(0,0)}),/cutoff/);
console.log('App dashboard reconciled through Week '+d.week);
