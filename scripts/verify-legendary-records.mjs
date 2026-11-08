import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const weekly=read('data/season_weekly_matchups_2016_2026_v1.json');
const guide=read('data/season_guide.json');
const brackets=[...read('data/verified_espn_playoff_brackets_2016_2019.json').seasons,...read('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons];
const exhibits=read('data/legendary_records_2016_2025_v1.json');
const html=fs.readFileSync('analytics/legendary-records.html','utf8');
const front=fs.readFileSync('analytics/records.html','utf8');
const normalize=name=>name==='Tom'?'Thommy':name;
const all=[];const losingGames=[];
for(let year=2016;year<=2025;year++){
 const season=weekly.bySeason[String(year)],bracket=brackets.find(b=>b.year===year);
 if(!season?.complete||!bracket)throw Error('Missing completed season or verified bracket '+year);
 const champion=normalize(guide[String(year)].champion);
 const games=season.games.filter(g=>g.stage==='regular');
 for(const game of games){
  if(game.winner==='HOME')losingGames.push({year,week:game.week,manager:normalize(game.away),points:game.awayScore});
  else if(game.winner==='AWAY')losingGames.push({year,week:game.week,manager:normalize(game.home),points:game.homeScore});
 }
 const managers=[...new Set(games.flatMap(g=>[normalize(g.home),normalize(g.away)]))];
 for(const manager of managers){
  const rows=games.filter(g=>normalize(g.home)===manager||normalize(g.away)===manager).sort((a,b)=>a.week-b.week);
  let wins=0,losses=0,ties=0,initialLosses=0,unbroken=true,lossRun=0,longestLossRun=0,deepest=0,sixWeek=null;
  for(const game of rows){
   const result=game.winner==='TIE'?'T':normalize(game[game.winner==='HOME'?'home':'away'])===manager?'W':'L';
   if(result==='W'){wins++;lossRun=0;unbroken=false}
   else if(result==='L'){losses++;lossRun++;if(unbroken)initialLosses++}
   else {ties++;lossRun=0;unbroken=false}
   deepest=Math.min(deepest,wins-losses);
   longestLossRun=Math.max(longestLossRun,lossRun);
   if(game.week===6)sixWeek={wins,losses,ties};
  }
  const participants=(bracket.participants||bracket.seeds||[]).map(normalize);
  const finalists=(bracket.finalists||[]).map(normalize);
  all.push({manager,year,wins,losses,ties,initialLosses,deepest,longestLossRun,sixWeek,champion:manager===champion,finalist:finalists.includes(manager),playoffs:participants.includes(manager),seed:bracket.seedByManager?.[manager]??bracket.seedByManager?.[manager==='Thommy'?'Tom':manager]??null,winPct:(wins+ties/2)/(wins+losses+ties)});
 }
}
const champions=all.filter(r=>r.champion),finalists=all.filter(r=>r.finalist),playoffs=all.filter(r=>r.playoffs);
const runnersUp=finalists.filter(r=>!r.champion);
const finalSeedMargins=champions.map(winner=>{const runner=runnersUp.find(r=>r.year===winner.year);if(!runner)throw Error('Missing verified runner-up '+winner.year);return {...winner,seedGap:winner.seed-runner.seed};});
const top=(rows,key,mode='max')=>{const values=rows.map(key);const best=mode==='max'?Math.max(...values):Math.min(...values);return rows.filter(x=>Math.abs(key(x)-best)<1e-9)};
const calc={
 'worst-championship-start':top(champions,x=>x.initialLosses),
 'deepest-champion-hole':top(champions,x=>-x.deepest),
 'lowest-champion-seed':top(champions,x=>x.seed),
 'champion-most-losses':top(champions,x=>x.losses),
 'champion-loss-streak':top(champions,x=>x.longestLossRun),
 'finalist-opening-losses':top(finalists,x=>x.initialLosses),
 'worst-finalist-record':top(finalists,x=>x.winPct,'min'),
 'worst-playoff-record':top(playoffs,x=>x.winPct,'min'),
 'undefeated-six-week-champs':champions.filter(x=>x.sixWeek?.wins===6&&x.sixWeek.losses===0&&x.sixWeek.ties===0),
 'highest-score-in-loss':top(losingGames,x=>x.points),
 'best-record-no-title':top(all.filter(x=>!x.champion),x=>x.winPct),
 'deepest-playoff-qualifier-hole':top(playoffs,x=>-x.deepest),
 'biggest-final-seed-upset':top(finalSeedMargins,x=>x.seedGap),
 'lowest-seed-runner-up':top(runnersUp,x=>x.seed)
};
const signature=rows=>rows.map(r=>r.manager+':'+r.year).sort().join('|');
if(exhibits.categories.length!==Object.keys(calc).length)throw Error('Legendary record count changed without verifier update');
for(const card of exhibits.categories){
 const actual=calc[card.id];
 if(!actual)throw Error('Unknown legendary category '+card.id);
 if(signature(actual)!==signature(card.holder))throw Error('Legendary record holder mismatch '+card.id+' expected '+signature(actual)+' got '+signature(card.holder));
 if(!html.includes('id="'+card.id+'"')||!html.includes(card.title)||!html.includes(card.metric)||!html.includes(card.detail))throw Error('Missing or stale HTML exhibit '+card.id);
 if(!card.rule||!card.source||!card.detail)throw Error('Missing record methodology '+card.id);
 for(const h of card.holder){
  const row=actual.find(x=>x.manager===h.manager&&x.year===h.year);
  if(!row)throw Error('No reconstructed winner '+h.manager+' '+h.year);
 }
}
if(!front.includes('href="legendary-records.html"'))throw Error('Main Record Book lacks Legendary Records link');
if(!html.includes('href="records.html"'))throw Error('Legendary gallery has no Record Book return link');
if(!html.includes('Evans, not JMid, occupied the disputed 2023 roster slot'))throw Error('Historical manager identity caveat absent');
console.log('LEGENDARY RECORDS VERIFIED: '+exhibits.categories.length+' source-checked exhibits, completed 2016–2025 seasons, correct ties, linked gallery.');
