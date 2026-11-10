// Full independent editorial evidence gate: all ten title seasons and current managers.
// This protects the curated audit from drifting away from canonical game, bracket,
// biography and archived player starter receipts as league data is updated.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const src=read('data-integrity/editorial_evidence_2016_2026_week8_v1.json');
const stories=read('data/championship_season_stories_2016_2025_v1.json');
const books=read('data/manager_record_books_2016_2026.json');
const bios=read('data/manager_biographies_awards.json').managers;
const games=read('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const guide=read('data/season_guide.json');
const boxes=read('data/championship_player_boxscores_2020_2025_v1.json').games;
const brackets=[...read('data/verified_espn_playoff_brackets_2016_2019.json').seasons,...read('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons];
const norm=n=>n==='Tom'?'Thommy':n;
const equal=(a,b)=>Math.abs(a-b)<.011;
assert.equal(src.championships.length,10);
assert.equal(src.managers.length,10);
assert.equal(new Set(src.managers.map(x=>x.manager)).size,10);
assert.deepEqual(src.championships.map(s=>s.year),Array.from({length:10},(_,i)=>2016+i));
for(const row of src.championships){
 const {year}=row,champ=norm(guide[year].champion),story=stories.seasons.find(s=>s.year===year),bracket=brackets.find(x=>x.year===year);
 assert.equal(row.champion,champ,'champion holder '+year);
 assert.equal(norm(bracket.champion),champ,'bracket champion '+year);
 assert.equal(row.seed,bracket.seedByManager[champ]??bracket.seedByManager[champ==='Thommy'?'Tom':champ],'seed '+year);
 const runner=bracket.finalists.map(norm).find(n=>n!==champ);
 assert.equal(row.runnerUp,runner,'runner-up '+year);
 assert.equal(row.runnerUpSeed,bracket.seedByManager[runner]??bracket.seedByManager[runner==='Thommy'?'Tom':runner],'runner-up seed '+year);
 const reg=games[year].games.filter(g=>g.stage==='regular'&&[norm(g.home),norm(g.away)].includes(champ)).sort((a,b)=>a.week-b.week);
 let w=0,l=0,t=0,open=0,opening=true,deep=0,lossRun=0,longest=0,week4=null,week6=null;
 for(const g of reg){
  const result=g.winner==='TIE'?'T':norm(g[g.winner==='HOME'?'home':'away'])===champ?'W':'L';
  if(result==='W'){w++;lossRun=0;opening=false}
  else if(result==='L'){l++;lossRun++;if(opening)open++}
  else{t++;lossRun=0;opening=false}
  deep=Math.max(deep,l-w);longest=Math.max(longest,lossRun);
  if(g.week===4)week4={wins:w,losses:l,ties:t};
  if(g.week===6)week6={wins:w,losses:l,ties:t};
 }
 assert.deepEqual(row.regularRecord,{wins:w,losses:l,ties:t},'regular W-L '+year);
 assert.deepEqual(row.start,{openingLosses:open,week4,week6,deepestBelow500:deep,longestLosingStreak:longest},'championship comeback record '+year);
 const post=games[year].games.filter(g=>g.stage!=='regular'&&[norm(g.home),norm(g.away)].includes(champ));
 const final=post.at(-1);assert.ok(final,'missing championship final '+year);
 const championPoints=final.home===champ?final.homeScore:final.awayScore;
 const runnerPoints=final.home===champ?final.awayScore:final.homeScore;
 assert.equal(row.championship.week,final.week,'championship week '+year);
 assert.ok(equal(championPoints,row.championship.championPoints)&&equal(runnerPoints,row.championship.runnerUpPoints),'championship scoreboard '+year);
 assert.ok(equal(row.championship.margin,championPoints-runnerPoints),'title margin '+year);
 assert.equal(row.championship.twoWeekAggregate,!!final.twoWeekAggregate,'ESPN final format '+year);
 assert.equal(row.championship.twoWeekAggregate,year===2016||year===2017,'two-week flag '+year);
 assert.equal(row.story.title,story.title,'story title '+year);
 const full=story.sections.map(x=>x.text).join(' ');
 assert.equal(row.story.wordCount,full.trim().split(/\s+/).length,'editorial word count '+year);
 assert.equal(row.story.chapters,story.sections.length,'story chapters '+year);
 assert.equal(row.story.hasFinalScore,true,'missing final score '+year);
 for(const n of [championPoints,runnerPoints])assert.ok(full.includes(String(n))||full.includes(n.toFixed(2)),'story has canonical scoreboard '+year+' '+n);
 assert.deepEqual(row.story.tradeReceiptIds,(story.verifiedTradeReceipts||[]).map(x=>x.id),'story sourced trade IDs '+year);
 const observed=boxes.filter(x=>x.year===year);
 assert.equal(row.starterEvidence.length,year<2020?0:2,'verified starter coverage '+year);
 for(const game of row.starterEvidence){const box=observed.find(x=>x.round===game.round&&x.week===game.week);
  assert.ok(box,'box evidence '+year+' '+game.round);
  assert.ok(equal(box.score,game.teamPoints)&&equal(box.opponentScore,game.opponentPoints),'playoff box score '+year);
  assert.ok(equal(box.starters.reduce((sum,p)=>sum+p.points,0),game.starterTotal),'starter sum '+year);
  const top=box.starters.slice().sort((a,b)=>b.points-a.points).slice(0,3);
  assert.deepEqual(top.map(x=>({name:x.name,points:x.points})),game.topStarters,'verified MVP shortlist '+year);
 }
}
const allowed=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
for(const row of src.managers){
 const name=row.manager;assert.ok(allowed.has(name),'unknown current manager '+name);
 const canon=books.managers.find(x=>x.manager===name),bio=bios[name==='Thommy'?'Tom':name]?.biography;
 const standing=guide['2026'].standings.find(x=>norm(x.name)===name);
 assert.ok(canon&&standing&&bio,'manager missing source '+name);
 assert.equal(canon.firstSeason,row.firstSeason,'first owned season '+name);
 const all2026=games['2026'].games.filter(g=>g.stage==='regular');
 const week8=all2026.filter(g=>g.week<=8&&(norm(g.home)===name||norm(g.away)===name));
 const snapshotWins=week8.filter(g=>norm(g[g.winner==='HOME'?'home':'away'])===name&&g.winner!=='TIE').length;
 const snapshotTies=week8.filter(g=>g.winner==='TIE').length;
 const snapshotLosses=week8.length-snapshotWins-snapshotTies;
 const snapshotPoints=Math.round(week8.reduce((sum,g)=>sum+(norm(g.home)===name?g.homeScore:g.awayScore),0)*100)/100;
 assert.deepEqual(row.through2026Week8,{wins:snapshotWins,losses:snapshotLosses,ties:snapshotTies,pointsFor:snapshotPoints},'historical Week 8 snapshot '+name);
 const latest2026=all2026.filter(g=>norm(g.home)===name||norm(g.away)===name);
 const added=latest2026.filter(g=>g.week>8);
 const addedWins=added.filter(g=>norm(g[g.winner==='HOME'?'home':'away'])===name&&g.winner!=='TIE').length;
 const addedTies=added.filter(g=>g.winner==='TIE').length;
 assert.deepEqual({wins:row.regularCareer.wins+addedWins,losses:row.regularCareer.losses+added.length-addedWins-addedTies,ties:row.regularCareer.ties+addedTies,games:row.regularCareer.games+added.length},{wins:canon.regular.w,losses:canon.regular.l,ties:canon.regular.t,games:canon.regular.games},'Week 8 career evidence plus newly finalized games '+name);
 assert.equal(row.regularCareer.games,row.regularCareer.wins+row.regularCareer.losses+row.regularCareer.ties,'career WLT totals '+name);
 assert.equal(standing.games,latest2026.length,'2026 current standings coverage '+name);
 assert.equal(row.biography.words,bio.trim().split(/\s+/).length,'biography word count '+name);
 assert.equal(row.biography.paragraphs,bio.split(/\n\s*\n/).length,'bio paragraphs '+name);
 assert.ok(row.biography.words>=160&&row.biography.paragraphs>=3,'full editorial biography '+name);
 assert.deepEqual(row.completedSeasons,canon.annual.filter(y=>y.year<=2025).map(y=>({year:y.year,wins:y.w,losses:y.l,ties:y.t})),'annual ownership '+name);
 const titles=src.championships.filter(x=>x.champion===name).map(x=>x.year);
 assert.deepEqual(row.championshipYears,titles,'titles '+name);
 const finals=src.championships.filter(x=>x.champion===name||x.runnerUp===name).map(x=>({year:x.year,result:x.champion===name?'won':'runner-up'}));
 assert.deepEqual(row.finalAppearances,finals,'championship final appearances '+name);
 if(name==='JMid'){assert.equal(row.firstSeason,2024);assert.ok(bio.includes('2023 franchise slot belonged to Evans'),'Evans 2023 ownership');}
}
const finals=src.championships.map(c=>({year:c.year,champ:c.champion,runnerUp:c.runnerUp,margin:c.championship.margin,seed:c.seed,runnerSeed:c.runnerUpSeed}));
const record=id=>src.recordCandidates.find(x=>x.id===id);
const closest=finals.slice().sort((a,b)=>a.margin-b.margin)[0],largest=finals.slice().sort((a,b)=>b.margin-a.margin)[0];
for(const [id,leader] of [['closest-title-final',closest],['largest-title-final-margin',largest]]){
 const r=record(id);assert.ok(r&&equal(r.value,leader.margin),'record value '+id);
 assert.deepEqual(r.holders,[{manager:leader.champ,year:leader.year}],'record winner '+id);
}
const runs=src.championships.slice().sort((a,b)=>b.start.openingLosses-a.start.openingLosses);
assert.equal(record('lowest-champion-opening-record').value,runs[0].start.openingLosses);
assert.deepEqual(record('lowest-champion-opening-record').holders,[{manager:runs[0].champion,year:runs[0].year}]);
const underdogs=finals.filter(f=>f.runnerSeed===1).sort((a,b)=>b.seed-a.seed);
assert.equal(record('biggest-final-seed-upset').value,underdogs[0].seed);
assert.deepEqual(record('biggest-final-seed-upset').holders,[{manager:underdogs[0].champ,year:underdogs[0].year}]);
const nonChamp=src.managers.filter(m=>m.championshipYears.length===0).map(m=>({manager:m.manager,finals:m.finalAppearances.length}));
const maxFinals=Math.max(...nonChamp.map(m=>m.finals));
assert.deepEqual(record('most-finals-without-title').holders,nonChamp.filter(m=>m.finals===maxFinals).map(m=>({manager:m.manager,finals:m.finals})),'titleless finalist tie');
const story2022=stories.seasons.find(x=>x.year===2022).sections.map(x=>x.text).join(' ');
assert.ok(story2022.includes('Buffalo–Cincinnati NFL Week 17 game was canceled'),'2022 interrupted final caveat absent');
assert.ok(story2022.includes('verified recorded Fellas totals'),'2022 title score is reported as archived result');
assert.equal(src.recordCandidates.length,5);
console.log('FULL FELLAS EDITORIAL EVIDENCE PASS: 10 championships, 10 current managers, 5 fact-recomputed records, 2022 scoring caveat and 12 credited postseason starter lineups.');
