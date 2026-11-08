import fs from 'node:fs';const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const week=7,year=2026;const src=read('data/sleeper_roster_snapshots_2026_week7.json').rosters.find(x=>x.owner==='Sheffla');const expected=105.22;if(src.points!==expected)throw Error('Scott raw Sleeper roster no longer matches certified provider result');const provider=read('data-integrity/2026-week7-scott-provider-verification.json');if(provider.providerReportedScore!==expected)throw Error('Archived provider evidence changed');const ledger=read('data/unified_record_book_2016_2026.json').games.find(x=>x.year===year&&x.week===week&&x.home==='Stew'&&x.away==='Scott');const archive=read('data/season_weekly_matchups_2016_2026_v1.json').bySeason['2026'];const game=archive.games.find(x=>x.week===week&&x.home==='Stew'&&x.away==='Scott');for(const [label,g] of [['ledger',ledger],['season matchups',game]])if(!g||g.awayScore!==expected||g.homeScore!==110.14||g.margin!==4.92||g.winner!=='HOME')throw Error(label+' inconsistent with provider');const guide=read('data/season_guide.json')['2026'].standings;for(const [label,s] of [['2026 weekly standings',archive.standings],['season guide',guide]]){const find=n=>s.find(x=>(x.manager??x.name)===n);if(find('Scott')?.pf!==791.04||find('Stew')?.pa!==863.34)throw Error(label+' has incorrect Week 8 PF/PA totals')}console.log('SCOTT 2026 W7 CANONICAL PARITY PASS: provider 105.22, ledger/weekly/guide agree; Stew PA 863.34, Scott PF 791.04');
// Prevent stale published recap snapshots from contradicting the provider-certified final.
const recap=read('data/weekly-recaps/2026-week-7.json');
const recapGame=recap.matchups.find(x=>x.winner==='Stew'&&x.loser==='Scott');
if(!recapGame||recapGame.winner_points!==110.14||recapGame.loser_points!==expected||recapGame.margin!==4.92)throw Error('Week 7 JSON recap disagrees with certified Scott final');
const recapText=fs.readFileSync('data/weekly-recaps/2026-week-07.md','utf8');
if(!recapText.includes('Stew 110.14 def. Scott 105.22')||!recapText.includes('gives 112.62'))throw Error('Week 7 markdown recap disagrees with certified Scott final or hindsight arithmetic');


// Reconstruct historical Week 7 cumulative totals directly from the canonical games.
const week7Games=archive.games.filter(g=>g.week<=7&&g.stage==='regular');
for(const [manager,kind,expectedTotal,expectedLine] of [
  ['Scott','pf',678.48,'Scott 3-4, PF 678.48, PA 747.10'],
  ['Stew','pa',784.24,'Stew 4-3, PF 868.82, PA 784.24']
]){
  const total=week7Games.reduce((sum,g)=>sum+(g.home===manager?(kind==='pf'?g.homeScore:g.awayScore):g.away===manager?(kind==='pf'?g.awayScore:g.homeScore):0),0);
  const rounded=Math.round((total+Number.EPSILON)*100)/100;
  if(!recapText.includes(expectedLine)||rounded!==expectedTotal)throw Error('Week 7 recap cumulative '+manager+' '+kind+' disagrees with canonical Week 1-7 ledger');
}
