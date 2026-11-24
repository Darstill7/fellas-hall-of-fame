import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildHomeDashboard,buildPersonalDashboard,buildActivityFeed,readPreference,savePreference} from '../assets/home-app-v3.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const guide=read('data/season_guide.json'),ledger=read('data/unified_record_book_2016_2026.json');
const d=buildHomeDashboard(guide,ledger);
assert.equal(d.standings.length,10);assert.equal(d.latest.length,5);
assert.equal(d.week,guide['2026'].standings[0].games);
if(d.week===11){assert.equal(d.standings.find(r=>r.name==='Stew').streak,'W7');assert.equal(d.leaders[0].name,'Tony');assert.equal(d.leaders[0].latest,142.3);}
const bad=structuredClone(guide);bad['2026'].standings[0].pf+=1;assert.throws(()=>buildHomeDashboard(bad,ledger),/Standings mismatch/);
assert.throws(()=>buildHomeDashboard(guide,{games:ledger.games.slice(0,0)}),/cutoff/);
console.log('App dashboard reconciled through Week '+d.week);

const race=read('data/playoff_race_v1.json');for(const t of d.standings){const p=buildPersonalDashboard(d,race,t.name);assert.equal(p.team.name,t.name);assert.ok(p.rank>=1&&p.rank<=10);if(d.week===11){assert.ok(p.opponent);assert.ok(p.odds)}}if(d.week===11){const p=buildPersonalDashboard(d,race,'Stew');assert.equal(p.opponent.name,'Birch');assert.equal(p.odds.bye,77.7)}assert.equal(buildPersonalDashboard(d,{...race,verified_through_week:0},'Stew').odds,null);assert.equal(buildPersonalDashboard(d,race,'unknown'),null);const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};savePreference(storage,'Stilly');assert.equal(readPreference(storage),'Stilly');savePreference(storage,'');assert.equal(readPreference(storage),'');assert.equal(readPreference(undefined),'');

for(const t of d.standings){const feed=buildActivityFeed(d,race,t.name);assert.ok(feed.length>=1&&feed.length<=3);assert.equal(new Set(feed.map(x=>x.id)).size,feed.length);assert.ok(feed.every((x,i)=>x.week===d.week&&x.id.includes(':'+t.name+':')&&(i===0||feed[i-1].priority>=x.priority)));}if(d.week===11){assert.match(buildActivityFeed(d,race,'Stew')[0].title,/7 consecutive wins/);assert.match(buildActivityFeed(d,race,'Kuhl')[0].title,/11 consecutive losses/);assert.match(buildActivityFeed(d,race,'Tony')[0].title,/Weekly scoring leader/);assert.ok(buildActivityFeed(d,race,'Stover').some(x=>x.title.includes('40.7%')))}assert.deepEqual(buildActivityFeed(d,race,'unknown'),[]);assert.ok(!buildActivityFeed(d,{...race,verified_through_week:0},'Stover').some(x=>/playoff|awaits/i.test(x.title)));
