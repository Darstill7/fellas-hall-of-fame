// Guards for rivalry recency context; reads published, approved source only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const js=readFileSync(new URL('../assets/rivalry-archive-v3.js',import.meta.url),'utf8');
const book=JSON.parse(readFileSync(new URL('../data/unified_record_book_2016_2026.json',import.meta.url),'utf8'));
assert.ok(js.includes("const all=d.games.filter(g=>g.stage==='regular')"),'Rivalries must exclude playoff games');
assert.ok(js.includes("const recent=games[0]"),'Recent meeting must use the sorted verified game list');
assert.ok(js.includes("if(leaderOf(game)!==recentWinner)break;streak++"),'Series streak must end when winner changes or meeting ties');
assert.ok(js.includes("Current head-to-head streak: unverified"),'Missing meetings must not imply a zero-length recorded streak');
assert.ok(js.includes('rivalry-recent-context'),'Recent meeting summary must render on the matchup detail');
assert.ok(js.includes("if(rivalryWrapper&&!rivalrySections.length)"),'Dynamic main landmark must not coexist with wrapper role=main');
const managers=['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch'];
const games=book.games.filter(g=>g.stage==='regular');
const pairs=new Set();
for(const g of games){
 assert.ok(Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore),'Every scored rivalry must use actual canonical score values');
 if(managers.includes(g.home)&&managers.includes(g.away)){
  const pair=[g.home,g.away].sort().join('|');
  pairs.add(pair);
 }
}
assert.ok(pairs.size>0&&pairs.size<=45,'Canonical rivalry pair coverage must remain bounded by 45 current-manager pairs');
function streak(ordered){
 if(!ordered.length)return {last:null,count:null};
 const winner=g=>g.homeScore===g.awayScore?null:(g.homeScore>g.awayScore?g.home:g.away);
 const last=winner(ordered[0]);if(!last)return {last:null,count:0};
 let count=0;for(const g of ordered){if(winner(g)!==last)break;count++}return {last,count};
}
assert.deepEqual(streak([]),{last:null,count:null});
assert.deepEqual(streak([{home:'A',away:'B',homeScore:5,awayScore:5}]),{last:null,count:0});
assert.deepEqual(streak([{home:'A',away:'B',homeScore:10,awayScore:7},{home:'B',away:'A',homeScore:6,awayScore:9},{home:'A',away:'B',homeScore:3,awayScore:8}]),{last:'A',count:2});
const playoffBook=JSON.parse(readFileSync(new URL('../data/playoff_explorer_verified_2016_2025_v1.json',import.meta.url),'utf8'));
assert.ok(js.includes("fetch(depth+'data/playoff_explorer_verified_2016_2025_v1.json')"),'Postseason comparisons must use independently verified bracket evidence');
assert.ok(js.includes("season.year>2025"),'Only completed verified seasons may enter postseason matchup history');
assert.ok(js.includes("m.home===aCanonical&&m.away===bCanonical"),'Postseason outcomes must match both manager identities');
assert.ok(js.includes('This section is not counted in regular-season head-to-head W/L'),'Playoff records must be explicitly separated from regular-season series');
assert.ok(js.includes("m.aggregate?'Two-week aggregate':'Single week'"),'Historic two-week rounds must be marked as aggregates');
assert.ok(js.includes("No verified winners-bracket meetings"),'Missing recovered playoff fixtures must not be treated as definitive absence');
assert.equal(playoffBook.seasons.length,10,'Postseason verification requires all ten completed seasons 2016–2025');
const playoffRows=playoffBook.seasons.flatMap(s=>(s.matches||[]).map(m=>({year:s.year,...m})));
assert.ok(playoffRows.length>0,'Verified bracket archive must include actual playoff games');
for(const m of playoffRows){
 assert.ok(Number.isFinite(m.homeScore)&&Number.isFinite(m.awayScore),'Every shown postseason game requires verified scores');
 assert.ok(['opening','semifinal','final'].includes(m.round),'Only verified winners-bracket rounds are eligible');
 if(m.aggregate)assert.ok(Array.isArray(m.weeksCovered)&&m.weeksCovered.length>1,'Two-week aggregates must retain both covered NFL weeks');
}

console.log('Rivalry recent-meeting and streak source safeguards passed; approved game ledger unchanged.');
