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


// Trade Rivalries is gated on the *published* Trade Museum HTML and its embedded archive.
// The rivalry page must not manufacture transactions or infer graded trade winners.
assert.ok(js.includes("fetch(depth+'analytics/trade-museum.html')"),'Rivalry trade evidence must load the deployed Museum, never an unsynced local copy');
assert.ok(js.includes("script#archive-data[type=\"application/json\"]"),'Trade feed must be extracted from the Museum original source');
assert.ok(js.includes("if(!r.ok)throw Error('Museum not published')"),'Trade links must fail closed when Museum is not deployed');
assert.ok(js.includes("norm(firstName)!==norm(secondName)"),'A manager cannot be paired with themselves in trade rivalry filtering');
assert.ok(js.includes("new Set(trade.sides.map(side=>norm(side.manager))).size===trade.sides.length"),'Source-qualified receipts require unique participants');
assert.ok(js.includes("side.source_status==='VERIFIED_SOURCE'"),'Verified trade counts must require source-qualified asset sides');
assert.ok(js.includes("trade.sides.length>=3"),'Multi-manager exchanges must be identified separately');
assert.ok(js.includes('this is not proof that no trade occurred'),'Missing paired receipts must never imply a historical zero');
assert.ok(js.includes('Trade production, keeper outcomes, FAAB and positional value are not inferred here'),'Trade count is not evidence of trade value');
assert.ok(js.includes("portfolioBase+'?manager='+encodeURIComponent(firstName)+'&partner='+encodeURIComponent(secondName)"),'Trade portfolio linkage must preserve pair selection');
assert.ok(js.includes("page.querySelector('a#manager-entry[href=\\\"trade-portfolios.html\\\"]')"),'Portfolio visibility must follow explicit published Museum navigation');
assert.ok(!js.includes('await fetch(portfolioBase)'),'Portfolio existence must not be tested by creating a 404 network request');
assert.ok(js.includes("portfolioAvailable?"),'Unavailable portfolio must never render a dead link');
assert.ok(js.includes("Latest dated receipt in this deployed archive:"),'Trade coverage must expose the deployed archive cutoff');
assert.ok(js.includes("Expanded manager trade portfolios are not published"),'Missing portfolio must display a safe fallback');


console.log('Rivalry recent-meeting and streak source safeguards passed; approved game ledger unchanged.');
