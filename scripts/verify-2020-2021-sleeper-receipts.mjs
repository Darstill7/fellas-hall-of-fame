// Research-only direct raw-Sleeper-receipt cross-check for 2020 and 2021.
// Produces no production record edits. Run: node scripts/verify-2020-2021-sleeper-receipts.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const load = path=>JSON.parse(fs.readFileSync(path,'utf8'));
const canonical=load('data/unified_record_book_2016_2026.json');
const handles=Object.freeze({
  Darstill:'Stilly', Evansbrandonm:'Evans', thommy:'Thommy',
  Dsylvester9:'Stew', Koble2323:'Koble', ckuhl5:'Kuhl',
  tsteg:'Tony', birchhh:'Birch', huppdawg80:'Mitch',
  yogurtslinger15:'Stover'
});
const pairKey=(a,b)=>[a,b].sort().join('|');
const receipt={source:'stored raw Sleeper matchup exports',sourceScope:'2020 and 2021 regular season',years:[],notes:[
  'The exports are local raw-source copies; they do not independently confirm the remote API today.',
  'Four matchup pairs in Week 14 are not a missing result: two teams had recorded byes.',
  'A bye has no scored matchup in these exports. Do not invent scores or count it as a win/loss.'
]};
for(const year of [2020,2021]){
  const raw=load(`data/sleeper_matchups_${year}.json`);
  const canon=canonical.games.filter(g=>g.year===year&&g.stage==='regular');
  const byes=canonical.confirmedByes.find(b=>b.year===year&&b.week===14);
  assert(byes&&byes.managers.length===2,`Missing recorded byes for ${year} Week 14`);
  assert.equal(raw.length,14,`Expected 14 regular weeks in ${year} raw export`);
  let verified=0;
  const results=[];
  for(const w of raw){
    assert.equal(w.year,year);
    const weekCanonical=canon.filter(g=>g.week===w.week);
    assert.equal(w.games.length,weekCanonical.length,`Missing canonical pairing ${year} Week ${w.week}`);
    const lookup=new Map(weekCanonical.map(g=>[pairKey(g.home,g.away),g]));
    const seen=new Set();
    const teamScores=[];
    for(const game of w.games){
      const home=handles[game.home[0]],away=handles[game.away[0]];
      assert(home&&away&&home!==away,`Unmapped historical manager ${year} Week ${w.week}`);
      const key=pairKey(home,away);
      assert(!seen.has(key),`Duplicate pairing ${year} Week ${w.week}`);
      seen.add(key);
      const match=lookup.get(key);
      assert(match,`Missing original pairing ${year} Week ${w.week}: ${key}`);
      const scores=Object.fromEntries([[match.home,match.homeScore],[match.away,match.awayScore]]);
      assert.equal(scores[home],game.home[2],`Home score differs ${year} Week ${w.week}: ${home}`);
      assert.equal(scores[away],game.away[2],`Away score differs ${year} Week ${w.week}: ${away}`);
      teamScores.push({manager:home,score:game.home[2]},{manager:away,score:game.away[2]});
      verified++;
    }
    assert.equal(new Set(teamScores.map(t=>t.manager)).size,teamScores.length);
    if(w.week===14){
      assert.equal(teamScores.length,8);
      assert.deepEqual([...byes.managers].sort(),Object.values(handles).filter(n=>!teamScores.some(s=>s.manager===n)).sort());
    } else assert.equal(teamScores.length,10);
    const max=Math.max(...teamScores.map(x=>x.score));
    const min=Math.min(...teamScores.map(x=>x.score));
    results.push({week:w.week,pairedGames:w.games.length,scoredManagers:teamScores.length,
      highScorers:teamScores.filter(x=>x.score===max),lowScorers:teamScores.filter(x=>x.score===min),
      byes:w.week===14?[...byes.managers]:[]});
  }
  assert.equal(verified,69);
  receipt.years.push({year,matchedPairings:verified,weeks:results});
}
assert.equal(receipt.years.reduce((x,y)=>x+y.matchedPairings,0),138);
console.log(JSON.stringify(receipt,null,2));
