// Verify every Week 9 rivalry receipt from canonical regular-season matchups.
// Run: node scripts/verify-rivalry-week9-v2.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const canonical=read('data/unified_record_book_2016_2026.json');
const actual=read('data/regular_season_rivalry_receipts_2016_2026w9_v2.json');
const old=read('data/regular_season_rivalry_receipts_2016_2026w8_v1.json');
const names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const key=(a,b)=>[a,b].sort().join('|');
const cents=x=>Math.round(x*100);
const round=x=>Math.round(x*100)/100;
assert.equal(actual.schema,'fellas-current-manager-regular-season-rivalry-receipts-v2');
assert.deepEqual(actual.verifiedThroughWeek,{season:2026,week:9,providerState:'final',providerChecked:'2026-11-11'});
assert.equal(actual.currentManagerPairs,45);
assert.equal(actual.rivalries.length,45);
assert.equal(new Set(actual.rivalries.map(r=>key(...r.managers))).size,45);
const regular=canonical.games.filter(g=>g.stage==='regular');
let checked=0,changed=0;
for(const rival of actual.rivalries){
  const [a,b]=rival.managers;
  assert(names.includes(a)&&names.includes(b)&&a!==b);
  const games=regular.filter(g=>key(g.home,g.away)===key(a,b))
    .sort((x,y)=>x.year-y.year||x.week-y.week)
    .map(g=>({year:g.year,week:g.week,
      scoreA:g.home===a?g.homeScore:g.awayScore,
      scoreB:g.home===a?g.awayScore:g.homeScore,
      winner:g.homeScore===g.awayScore?null:g.homeScore>g.awayScore?g.home:g.away,
      margin:round(Math.abs(g.homeScore-g.awayScore))}));
  assert.deepEqual(rival.games,games,'Pair scores or order mismatch '+a+'/'+b);
  assert.equal(rival.played,games.length);
  assert.equal(rival.record[a],games.filter(g=>g.winner===a).length);
  assert.equal(rival.record[b],games.filter(g=>g.winner===b).length);
  assert.equal(rival.record.ties,games.filter(g=>!g.winner).length);
  assert.equal(cents(rival.totalPoints[a]),games.reduce((s,g)=>s+cents(g.scoreA),0));
  assert.equal(cents(rival.totalPoints[b]),games.reduce((s,g)=>s+cents(g.scoreB),0));
  const closest=[...games].sort((x,y)=>cents(x.margin)-cents(y.margin)||x.year-y.year||x.week-y.week)[0];
  assert.deepEqual(rival.closestMeeting,{year:closest.year,week:closest.week,margin:closest.margin,winner:closest.winner});
  const latest=games.at(-1);
  assert.deepEqual(rival.latestMeeting,{year:latest.year,week:latest.week,scoreA:latest.scoreA,scoreB:latest.scoreB,winner:latest.winner,margin:latest.margin});
  let best=null,win=null,len=0,start=null;
  for(const game of games){
    if(!game.winner){win=null;len=0;start=null;continue}
    if(win!==game.winner){win=game.winner;len=0;start={year:game.year,week:game.week}}
    ++len;
    if(!best||len>best.length)best={manager:win,length:len,start,end:{year:game.year,week:game.week}};
  }
  assert.deepEqual(rival.longestConsecutiveHeadToHeadWins,best);
  const previous=old.rivalries.find(r=>key(...r.managers)===key(a,b));
  assert(previous);
  assert.deepEqual(rival.games.slice(0,previous.played),previous.games,'Historical game changed '+a+'/'+b);
  if(rival.played!==previous.played){
    assert.equal(rival.played,previous.played+1,'Unexpected added rivalry meetings');
    assert.equal(latest.year,2026);assert.equal(latest.week,9);changed++;
  }
  checked+=games.length;
}
assert.equal(changed,5,'Expected exactly 5 Week 9 rivalries');
assert.equal(checked,469,'Unexpected current-manager regular-season meetings count');
const max=Math.max(...actual.rivalries.map(r=>r.played));
assert.equal(actual.mostMeetings,max);
assert.equal(max,20);
const most=actual.rivalries.filter(r=>r.played===max);
assert.deepEqual(actual.longestRivalry,most[0].managers);
assert.equal(most[0].record.Stew,10);
assert.equal(most[0].record.Stilly,10);
const tied=actual.rivalries.filter(r=>r.played>=10&&r.record[r.managers[0]]===r.record[r.managers[1]])
  .map(r=>({managers:r.managers,played:r.played,record:r.record}));
assert.deepEqual(actual.evenWithAtLeastTenGames,tied);
console.log('PASS: 45 rivalry pairs, 469 canonical meetings, 5 Week 9 additions, all original Week 8 receipts preserved.');
