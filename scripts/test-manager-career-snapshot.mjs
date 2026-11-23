import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {careerSnapshot,renderSnapshot} from '../assets/manager-career-snapshot.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const managers={birch:'Birch',jmid:'JMid',kuhl:'Kuhl',mitch:'Mitch',scott:'Scott',stew:'Stew',stilly:'Stilly',stover:'Stover',tom:'Thommy',tony:'Tony'};
assert.equal(Object.keys(managers).length,10);
const snapshots=[];
for(const [slug,name] of Object.entries(managers)){
 const html=read('managers/'+slug+'/index.html');
 assert.ok(html.includes('data-career-snapshot="'+name+'"'),'Snapshot identity missing for '+slug);
 assert.ok(html.includes('../../assets/manager-career-snapshot.css'),'Missing responsive styles for '+slug);
 assert.ok(html.includes('../../assets/manager-career-snapshot.mjs'),'Missing ledger-powered module for '+slug);
 assert.equal((html.match(/data-career-snapshot=/g)||[]).length,1,'Duplicate snapshot on '+slug);
 assert.ok(html.indexOf('data-career-snapshot=')<html.indexOf('class="profile-chapters"'),'Profile snapshot must precede deep chapter navigation');
 const r=careerSnapshot(ledger,name);
 const games=ledger.games.filter(g=>g.stage==='regular'&&(g.home===name||g.away===name));
 assert.equal(r.games,games.length,'Documented games mismatch '+name);
 assert.equal(r.wins+r.losses+r.ties,r.games,'Career WLT must sum to games '+name);
 assert.equal(r.seasons.reduce((sum,s)=>sum+s.games,0),r.games,'Annual game totals must match career '+name);
 assert.equal(r.seasons.reduce((sum,s)=>sum+s.w,0),r.wins,'Annual wins must match career '+name);
 assert.equal(r.seasons.reduce((sum,s)=>sum+s.l,0),r.losses,'Annual losses must match career '+name);
 assert.equal(r.seasons.reduce((sum,s)=>sum+s.t,0),r.ties,'Annual ties must match career '+name);
 assert.ok(r.seasons.every((s,i,list)=>s.games>0&&(i===0||list[i-1].year<s.year)),'Documented seasons must be ordered '+name);
 assert.equal(r.opponents.reduce((sum,o)=>sum+o.games,0),r.games,'Opponent results must sum to career '+name);
 assert.equal(r.opponents.reduce((sum,o)=>sum+o.w,0),r.wins,'Opponent wins mismatch '+name);
 assert.equal(r.opponents.reduce((sum,o)=>sum+o.l,0),r.losses,'Opponent losses mismatch '+name);
 assert.equal(r.opponents.reduce((sum,o)=>sum+o.t,0),r.ties,'Opponent ties mismatch '+name);
 assert.ok(Math.abs(r.pf-games.reduce((sum,g)=>sum+(g.home===name?g.homeScore:g.awayScore),0))<.001,'Points for mismatch '+name);
 assert.ok(Math.abs(r.pa-games.reduce((sum,g)=>sum+(g.home===name?g.awayScore:g.homeScore),0))<.001,'Points against mismatch '+name);
 assert.ok(r.opponents.every((o,i,a)=>i===0||a[i-1].games>=o.games),'Rivals must be sorted by meetings');
 assert.equal(r.week,Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week)),'Current verified cutoff must derive from the canonical ledger');
 assert.ok(renderSnapshot(r).includes('Most-played opponents'),'Profile must show head-to-head context');
 assert.ok(renderSnapshot(r).includes('Career trajectory by season'),'Every manager needs a scannable seasonal trend');
 assert.ok(renderSnapshot(r).includes('Documented results'),'Historical incomplete coverage must be labeled');
 if(r.seasons.some(s=>s.year===2026))assert.ok(renderSnapshot(r).includes('In progress · through Week '+r.week),'2026 must be labeled in progress');
 assert.equal((renderSnapshot(r).match(/class="manager-pulse-season-year"/g)||[]).length,r.seasons.length,'Every documented season must display once');
 for(const s of r.seasons){
  const own=games.filter(g=>g.year===s.year);
  assert.equal(s.games,own.length,'Season game count mismatch '+name+' '+s.year);
  assert.ok(Math.abs(s.pf-own.reduce((total,g)=>total+(g.home===name?g.homeScore:g.awayScore),0))<.001,'Season PF mismatch '+name+' '+s.year);
 }
 assert.ok(renderSnapshot(r).includes('Career win rate'),'Quick read must add meaningful information beyond existing hero W-L');
 assert.ok(renderSnapshot(r).includes('Ties count half a win'),'Win percentage definition must remain transparent');
 snapshots.push({manager:name,games:r.games,record:r.wins+'-'+r.losses+(r.ties?'-'+r.ties:''),week:r.week});
}
const fixture={games:[
 {year:2026,week:1,stage:'regular',home:'A',away:'B',homeScore:50,awayScore:40},
 {year:2026,week:1,stage:'regular',home:'C',away:'D',homeScore:40,awayScore:50},
 {year:2026,week:1,stage:'regular',home:'E',away:'F',homeScore:70,awayScore:20},
 {year:2026,week:1,stage:'regular',home:'G',away:'H',homeScore:30,awayScore:30},
 {year:2026,week:1,stage:'regular',home:'I',away:'J',homeScore:80,awayScore:90}
 ],updated:'2026-09-01'};
assert.equal(careerSnapshot(fixture,'A').wins,1);
const tide=careerSnapshot(fixture,'G');
assert.equal(tide.seasons[0].t,1,'Season trajectory must count tied matchups');
assert.equal(tide.seasons[0].w,0,'Tie must not count as full win');
assert.ok(renderSnapshot(tide).includes('50.0%'),'Tie must count as half-win in visible percentage');
fixture.games.pop();
assert.throws(()=>careerSnapshot(fixture,'A'),/Incomplete canonical Week 1/,'Never claim an incomplete week');
assert.throws(()=>careerSnapshot(ledger,'Unmapped Former Owner'),/No documented/);
console.log('MANAGER SNAPSHOT PASS: '+snapshots.length+' real profiles; score/WLT/meeting parity and incomplete-week rejection.');
console.log(JSON.stringify(snapshots));
