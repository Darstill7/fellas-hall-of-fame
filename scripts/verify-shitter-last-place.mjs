// Every completed-season Shitter recipient is the LAST losers-bracket
// finisher, not the lowest point total across all final consolation matches.
// Verify independent ESPN, Sleeper and all-era placement source agreement.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fail=[];
const check=(ok,msg)=>{if(!ok)fail.push(msg)};
const espn=read('data/espn_history_2016_2019.json');
const awards=read('data/espn_shitter_of_the_year_2016_2019.json');
const sleeper=read('data/sleeper_postseason_placement_receipts_2020_2025.json');
const final=read('data/fellas_final_placements_2016_2025_verified.json');
const endings=read('data/manager_verified_season_endings_v1.json');
const expected={2016:'Schermerhorn',2017:'Birch',2018:'Stilly',2019:'Evans',
 2020:'Tony',2021:'Stilly',2022:'Birch',2023:'Stew',2024:'Kuhl',2025:'Stover'};
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<0.011;
check(awards.userConfirmedDefinition.includes('last in the losers bracket'),
 'Award definition must use the clarified losers-bracket last-place rule');
check(Object.keys(awards.seasons).length===4,'ESPN award coverage must be 2016–2019 only');
check(final.seasons.length===10&&sleeper.seasons.length===6,'Completed season coverage must be 2016–2025');
for(const [yearText,winner] of Object.entries(expected)){
 const year=Number(yearText);
 const finish=final.seasons.find(s=>s.year===year);
 check(finish?.lastPlace===winner&&finish?.finishes?.at(-1)?.manager===winner,
  year+' all-era last place differs from verified recipient');
 if(year<=2019){
  const season=espn.seasons.find(s=>s.year===year);
  const team=season?.teams.find(t=>t.manager===winner);
  const last=season?.teams.length;
  const round=Math.max(...season.games.filter(g=>g.stage==='LOSERS_CONSOLATION_LADDER').map(g=>g.period));
  const g=season.games.find(g=>g.stage==='LOSERS_CONSOLATION_LADDER'&&g.period===round&&
   [g.home,g.away].includes(team?.id));
  const home=g?.home===team?.id;
  const score=home?g?.hs:g?.as;
  const finalWeek=year===2016?17:16;
  const week=home?g?.homeWeeks?.[finalWeek]:g?.awayWeeks?.[finalWeek];
  const lost=home?g?.winner==='AWAY':g?.winner==='HOME';
  const award=awards.seasons[yearText];
  check(team?.finalRank===last&&lost,
   year+' must be last overall and lose the final bottom-bracket matchup');
  check(award?.awardWinner===winner&&award?.officialFinish===last&&
   near(award?.awardWinningScore,score)&&
   near(award?.measurement?.recipientActualFinalWeekPoints,week)&&
   award?.scoringCriterion==='last-place finish in losers consolation bracket',
   year+' ESPN award does not agree with original last-place fixture');
 }else{
  const season=sleeper.seasons.find(s=>s.year===year);
  const last=season?.finalPlacements?.find(p=>p.place===10);
  check(last?.manager===winner&&season?.toiletBowl?.manager===winner&&
    season?.toiletBowl?.points<season?.toiletBowl?.opponentPoints,
    year+' Sleeper final Toilet Bowl recipient differs from last-place placement');
 }
 const actual=Object.entries(endings.managers).flatMap(([manager,rows])=>
  rows.filter(r=>r.year===year&&r.awards?.includes('Shitter of the Year')).map(()=>manager));
 const expectedVisible=Object.hasOwn(endings.managers,winner)?[winner]:[];
 check(JSON.stringify(actual)===JSON.stringify(expectedVisible),
  year+' active-manager award badges mismatch '+JSON.stringify(actual));
 if(year>=2020){
  const row=endings.managers[winner]?.find(r=>r.year===year);
  check(row?.ending==='10th place (last)'&&row?.finalRank===10&&
    row?.awardNote?.includes('last-place finish'),
    year+' active-manager season history does not show verified last-place ending');
 }
}
check(Object.values(endings.managers).flat().every(x=>x.year!==2026||!x.awards?.includes('Shitter of the Year')),
 '2026 unfinished season must not have Shitter');
for(const path of ['seasons/historical-awards.html','analytics/awards-show.html','seasons/espn-origins.html']){
 const html=fs.readFileSync(path,'utf8');
 check(html.includes('espn_shitter_of_the_year_2016_2019.json')&&
  html.includes('last')&&html.includes('Shitter of the Year'),
  path+' must show source-backed last-place awards');
 check(!html.includes('not necessarily the last-place finisher')&&
  !html.includes('lowest score in the final losers'),
  path+' contains superseded low-score rule');
}
for(const path of ['seasons/historical-awards.html','analytics/awards-show.html']){
 const html=fs.readFileSync(path,'utf8');
 check(html.includes('sleeper_postseason_placement_receipts_2020_2025.json'),
  path+' missing full Sleeper last-place history');
}
if(fail.length){console.error('Shitter last-place verification FAILED:\n'+fail.join('\n'));process.exit(1)}
console.log('PASS: 10 last-place Shitter recipients (2016–2025); ESPN matchup losers, Sleeper Toilet Bowls, official finishing records, profile badges and award displays agree.');
