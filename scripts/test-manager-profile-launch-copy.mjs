import {findOwnedRecords,recordCategoryLabels,nextRecordChallenger} from '../assets/manager-record-ownership.mjs';
import fs from 'node:fs';
import {buildPlayoffResume} from '../assets/manager-playoff-resume.mjs';
import {auditPlacementStatistics} from '../assets/placement-statistics.mjs';
import {auditAllEraFinishes} from '../assets/all-era-final-placements.mjs';
const managers=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
const obsolete=/The Fellas OS v5|static-first pre-publish build|Franchise encyclopedia · v9\.15|Players, Waivers & Trade Receipts/;
for(const slug of managers){
 const path='managers/'+slug+'.html';
 const html=fs.readFileSync(path,'utf8');
 if(obsolete.test(html))throw Error('Outdated public build label remains on '+path);
 if(!html.includes('Career records and player histories are drawn from documented league results. Coverage varies by season.'))throw Error('Manager history disclaimer missing on '+path);
 if(!html.includes('href="../managers/index.html"'))throw Error('Manager directory return link missing on '+path);
}
const playoffEspn=JSON.parse(fs.readFileSync('data/verified_espn_playoff_brackets_2016_2019.json','utf8'));
const playoffSleeper=JSON.parse(fs.readFileSync('data/verified_sleeper_playoff_brackets_2020_2025.json','utf8'));
const expectedPlayoffs={
 Stilly:[5,2,1],Stew:[4,2,0],Thommy:[7,5,4],
 Stover:[5,1,1],Birch:[7,2,1],Tony:[6,1,1],
 Mitch:[6,2,0],Kuhl:[4,0,0],JMid:[2,0,0],Scott:[1,1,1]
};
for(const [manager,expected] of Object.entries(expectedPlayoffs)){
 const resume=buildPlayoffResume(playoffEspn,playoffSleeper,manager);
 const actual=[resume.appearances,resume.championshipGames,resume.championships];
 if(actual.join(',')!==expected.join(','))
  throw Error('Verified playoff résumé mismatch for '+manager+': '+actual.join(','));
 if(resume.timeline.length!==10||resume.timeline.some(row=>row.year>=2026))
  throw Error('Playoff résumé includes an incomplete season or missing year for '+manager);
}
const tabsSource=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
if(!tabsSource.includes('careerSnapshot.before(primaryProfileActions)')||
   !tabsSource.includes('profileHero.after(profileTopicMenu)')||
   !tabsSource.includes('profileTopicMenu.after(profilePlayoffSection)'))
 throw Error('Manager first-screen hierarchy must remain consistent');
if(!tabsSource.includes('mountManagerPlayoffResume();')||
 !tabsSource.includes('items:[0,1,11,12]')||
 !tabsSource.includes("href:'#profile-playoff-resume'"))
 throw Error('Playoff résumé is missing from the shared manager profile navigation');
// Every public manager landing page leads with Records and Report Card.
for(const label of ['Records','Report Card']){
 if(!tabsSource.includes("'"+label+"'"))throw Error('First-screen profile route missing: '+label);
}
if(tabsSource.includes("['Start/Sit accuracy','Weekly lineup decisions'")||
   !tabsSource.includes("['Records','Personal bests")||
   !tabsSource.includes("['Report Card','Overall ratings")||
   !tabsSource.includes("{label:'Start/Sit accuracy'"))
 throw Error('Profile lead must prioritize Records and Report Card while keeping Start/Sit in research');
if(!tabsSource.includes("shell.append(featured,menu)")||
 !tabsSource.includes("profile-featured-links")||
 !tabsSource.includes("encodeURIComponent(name)+'#cards'"))
 throw Error('Manager starting routes must stay visible, styled and manager-specific');
for(const slug of managers){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!page.includes('assets/manager-profile-tabs.mjs'))
  throw Error('Manager profile is not using the shared starting routes: '+slug);
}
// Prevent the weighted Legacy OVR explainer from disappearing or drifting
// away from its canonical formula inputs.
const ratingCard=fs.readFileSync('assets/manager-profile-madden.mjs','utf8');
const ratingModel=fs.readFileSync('assets/fellas-rating-model.mjs','utf8');
if(!ratingCard.includes("import {makeRatings,WEIGHTS}")||
 !ratingCard.includes("manager.breakdown[key]")||
 !ratingCard.includes("const factorPanel=")||
 !ratingCard.includes("'+factorPanel+'")||
 !ratingCard.includes("profile-rating-factor-grid"))
 throw Error('Manager rating factor explanation must use the canonical breakdown');
for(const factor of ['titles','finals','playoffs','regular','allPlay','recent','peak','tenure']){
 if(!ratingCard.includes("['"+factor+"'")||
  !ratingModel.includes(factor+':'))
  throw Error('Legacy OVR factor missing from card or formula: '+factor);
}
if(!ratingCard.includes("manager.breakdown[key]/WEIGHTS[key]")||
 !ratingCard.includes("const summaryPanel=")||
 !ratingCard.includes("'+summaryPanel+'")||
 !ratingCard.includes("Lowest relative factor")||
 !ratingCard.includes("not league-wide category ranks"))
 throw Error('Career rating strength summaries must be normalized and properly qualified');
// A compact cross-era career résumé must remain data-backed and linked to the
// detailed record book, rather than inventing unsourced achievement totals.
const careerResumeUi=fs.readFileSync('assets/manager-playoff-resume.mjs','utf8');
const careerResumeCss=fs.readFileSync('assets/manager-profile-readability.css','utf8');
for(const required of ["'Career résumé'","resume.allEraSummary.topThree","Most recent completed season: ","Best finish: #","encodeURIComponent(resume.manager)"]){
 if(!careerResumeUi.includes(required))throw Error('Career résumé evidence or record-book navigation missing: '+required);
}
if(!careerResumeCss.includes('.profile-career-finish-summary')||
 !careerResumeCss.includes('.profile-career-record-link'))
 throw Error('Responsive career résumé styling is missing');
// Original verified stat values must remain in the DOM and reachable,
// without duplicating the first-screen rating and career summary.
const profileStyles=fs.readFileSync('assets/manager-profile-readability.css','utf8');
if(!tabsSource.includes("profile-career-highlights")||
   !tabsSource.includes("new MutationObserver(syncValue)")||
   !profileStyles.includes("main .hero .profile-career-highlights"))
 throw Error('Source-bound championship and regular-season headline facts missing');

for(const required of [
 "profile-snapshot-receipts","profile-snapshot-condensed",
 "evidence.append(summary,originalStats)","if(source)evidence.append(source)",
 "if(records)records.after(evidence)"
]){
 if(!tabsSource.includes(required)&&!profileStyles.includes(required))
  throw Error('Manager profile source-preserving cleanup is missing: '+required);
}
for(const slug of managers){
 const html=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!html.includes('profile-career-snapshot')&&!html.includes('class="stats"'))
  throw Error('Manager career record source is missing: '+slug);
}
// The career record markup relies on its scoped class. Without it, mobile
// stat labels and values collapse into unformatted adjacent text.
const historicalRecordsSource=fs.readFileSync('assets/manager-historical-records.js','utf8');
const profileTabSource=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
for(const assertion of [
 "root.classList.add('fr-historical')",
 ".fr-historical .fr-grid{grid-template-columns:repeat(2,minmax(0,1fr))",
 ".fr-historical .fr-stat{display:flex;flex-direction:column",
 "Sleeper 2020–2026 Week 8;"
]){
 if(!historicalRecordsSource.includes(assertion))
  throw Error('Mobile career record-book spacing or evidence cutoff missing: '+assertion);
}
if(!profileTabSource.includes('.profile-section-switcher .profile-tab-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'))
 throw Error('Condensed mobile archive navigation not installed');
const guide=JSON.parse(fs.readFileSync('data/season_guide.json','utf8'));
const names={stilly:'Stilly',jmid:'JMid',tom:'Thommy',stew:'Stew',scott:'Scott',mitch:'Mitch',tony:'Tony',stover:'Stover',kuhl:'Kuhl',birch:'Birch'};
for(const slug of managers){
 const page='managers/'+slug+'/index.html';
 const html=fs.readFileSync(page,'utf8');
 const years=Object.entries(guide).filter(([year,season])=>Number(year)<=2025&&season.champion===names[slug]).map(([year])=>Number(year)).sort((a,b)=>a-b);
 if(!html.includes('data-verified-championships="'+(years.join(',')||'none')+'"'))throw Error('Profile championship summary disagrees with season guide: '+slug);
 if(!html.includes('href="../../analytics/power-ratings.html"'))throw Error('Profile does not link to current all-time rankings: '+slug);
 if(html.includes('legacy.html?manager='))throw Error('Profile still links to superseded Legacy prototype: '+slug);
 if(/Source-backed highlight|Source-backed historical evidence loads|Franchise encyclopedia · source-backed/.test(html))throw Error('Developer-facing research placeholders still visible: '+slug);
 if(!html.includes('data-encyclopedia-waiver')||!html.includes('data-encyclopedia-trade'))throw Error('Profile evidence cards disconnected: '+slug);
 const headline=html.match(/<div class="stat"><strong>(\d+)<\/strong><small>Verified championships?<\/small><\/div>/);
 if(!headline||Number(headline[1])!==years.length)throw Error('Profile championship headline disagrees with season guide: '+slug);
}
// The shared feature menu links each profile to its own filterable record book.
const featureMenu=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
if(!featureMenu.includes("import {findOwnedRecords,recordCategoryLabels} from './manager-record-ownership.mjs'")||
   !featureMenu.includes("snapshot.append(link)")||
   !featureMenu.includes("link.href='../record-books.html?manager='")||
   !featureMenu.includes("No category leads yet · Explore personal bests"))
 throw Error('Every manager must expose a source-backed record ownership preview and honest zero state');

const recordBook=fs.readFileSync('managers/record-books.html','utf8');
if(!featureMenu.includes("label:'Records you own'")||!featureMenu.includes("href:'../record-books.html?manager='+encodeURIComponent(manager)+'#owned-records'"))
 throw Error('Manager feature menu lost its personal record book deep link');
if(!featureMenu.includes("items:[0,1,11,12]"))
 throw Error('Record books are no longer in the Career & Results feature group');
if(!recordBook.includes("new URLSearchParams(location.search).get('manager')"))
 throw Error('Record book does not restore manager selection from its URL');
if(!recordBook.includes('id="owned-records"')||!recordBook.includes('manager-record-ownership.mjs'))
 throw Error('Record book has no live league ownership panel');
if(!recordBook.includes("history.replaceState(null,'',u)"))
 throw Error('Record book selection is not shareable');
const book=JSON.parse(fs.readFileSync('data/manager_record_books_2016_2026.json','utf8'));
const postseason={
 espn:JSON.parse(fs.readFileSync('data/verified_espn_playoff_brackets_2016_2019.json','utf8')),
 sleeper:JSON.parse(fs.readFileSync('data/verified_sleeper_playoff_brackets_2020_2025.json','utf8'))
};
const placementMaster=JSON.parse(fs.readFileSync('data/fellas_final_placements_2020_2025.json','utf8'));
const placementReceipts=JSON.parse(fs.readFileSync('data/sleeper_postseason_placement_receipts_2020_2025.json','utf8'));
const placementAudit=auditPlacementStatistics(placementMaster,placementReceipts);
if(placementAudit.verifiedPlaces!==60||placementAudit.completedSeasons!==6||
   placementAudit.managerCount!==12||placementAudit.sixSeasonEligible!==8)
 throw Error('Final-placement coverage or eligibility changed');
const placementStats=new Map(placementAudit.stats.map(m=>[m.manager,m]));
if(placementStats.get('Mitch')?.averageFinish!==4.167||
   placementStats.get('Mitch')?.topThree!==3||
   placementStats.get('Mitch')?.topFive!==5||
   placementStats.get('Scott')?.seasonsPlayed!==2||
   placementStats.get('Stew')?.bottomThree!==4)
 throw Error('Season-finishing historical stats changed');
if(placementAudit.findings.length!==2||placementAudit.findings.some(f=>f.year!==2020))
 throw Error('Score reconciliation issues require re-review');
const mitchResume=buildPlayoffResume(playoffEspn,playoffSleeper,'Mitch',placementReceipts);
const scottResume=buildPlayoffResume(playoffEspn,playoffSleeper,'Scott',placementReceipts);
if(mitchResume.finalPlaceSummary?.seasons!==6||
   mitchResume.finalPlaceSummary?.averageFinish!==4.17||
   mitchResume.finalPlaceSummary?.topThree!==3||
   scottResume.finalPlaceSummary?.seasons!==2||
   scottResume.finalPlaceSummary?.averageFinish!==4)
 throw Error('Manager profile finishing summaries do not match six-season placement audit');
postseason.placements=placementMaster;
postseason.placementReceipts=placementReceipts;
const allEra=JSON.parse(fs.readFileSync('data/fellas_final_placements_2016_2025_verified.json','utf8'));
const careerAudit=auditAllEraFinishes(allEra);
const certifiedEspn=JSON.parse(fs.readFileSync('data/espn_final_placements_2016_2019_verified.json','utf8'));
for(const year of allEra.seasons){
 if(year.year<=2019){
  const s=certifiedEspn.seasons.find(x=>x.year===year.year);
  if(!s||s.teamCount!==year.teams||
     year.finishes.some((p,i)=>p.manager!==s.finalStandings[i].manager||p.rank!==s.finalStandings[i].place))
   throw Error('2016–2019 official ESPN ranks cannot be overridden by old spreadsheet');
 }else{
  const s=placementMaster.seasons.find(x=>x.year===year.year);
  if(!s||year.finishes.some((p,i)=>p.manager!==s.finishers[i].manager||p.rank!==s.finishers[i].rank))
   throw Error('Verified Sleeper results must overwrite conflicting legacy spreadsheet data '+year.year);
 }
}
const historicalLosers=Object.fromEntries(allEra.seasons.map(x=>[x.year,x.lastPlace]));
if(historicalLosers[2016]!=='Schermerhorn'||historicalLosers[2017]!=='Birch'||
   historicalLosers[2018]!=='Stilly'||historicalLosers[2019]!=='Evans'||
   historicalLosers[2020]!=='Tony'||historicalLosers[2021]!=='Stilly')
 throw Error('Last place sources or Sleeper overwrite rule violated');
const eraResume=buildPlayoffResume(playoffEspn,playoffSleeper,'Stilly',placementReceipts,allEra);
const early=eraResume.timeline.find(x=>x.year===2016);
if(early?.finalPlace!==6||!early.finish.includes('6th of 8')||
   eraResume.allEraSummary?.seasons!==10)
 throw Error('ESPN eight-team season not shown correctly in manager profile');
const mitchCareer=buildPlayoffResume(playoffEspn,playoffSleeper,'Mitch',placementReceipts,allEra);
if(mitchCareer.timeline.find(x=>x.year===2016)?.finish!=='Not in league')
 throw Error('Nonparticipating managers should not be labeled as playoff failures');

if(careerAudit.totalPlaces!==98||careerAudit.managerCount!==14||careerAudit.eligibleCount!==10||
   careerAudit.leaders.normalizedCareerAverage.value!==66.67||
   careerAudit.leaders.normalizedCareerAverage.holders.join(',')!=='Thommy'||
   careerAudit.leaders.topThreeCareer.value!==5||
   careerAudit.leaders.topThreeCareer.holders.join(',')!=='Thommy')
 throw Error('All-era rank and normalization audit requires review');
postseason.allEra=allEra;
const holderMap=new Map(book.managers.map(m=>[m.manager,findOwnedRecords(book,guide,m.manager,postseason)]));
const expectedKinds=[
 'Highest regular-season weekly score','Largest regular-season victory',
 'Most career regular-season wins','Most wins in a completed regular season','Most championships',
 'Most points in a completed regular season','Closest regular-season victory',
 'Highest career regular-season winning percentage (50+ games)',
 'Most regular-season wins against a single opponent',
 'Most championship-bracket playoff appearances','Most championship-game appearances',
 'Best average final finish (all six Sleeper seasons)',
 'Most top-three final finishes (2020–2025)',
 'Most top-five final finishes (2020–2025)',
 'Best normalized career final finish (6+ seasons, 2016–2025)',
 'Most top-three finishes across 2016–2025'
];
if(expectedKinds.length!==recordCategoryLabels.length||recordCategoryLabels.length!==16)
 throw Error('Record category definitions and regression test disagree');
for(const kind of expectedKinds){
 const holders=[...holderMap].filter(([,records])=>records.some(r=>r.label===kind));
 if(!holders.length)throw Error('No verified record holder for '+kind);
 const scores=holders.flatMap(([,records])=>records.filter(r=>r.label===kind).map(r=>r.value));
 if(new Set(scores).size!==1)throw Error('Record holders disagree on league-leading value: '+kind);
}
const rivalryLeaders=['Mitch','Stilly','Stover'];
for(const name of rivalryLeaders){
 if(holderMap.get(name).find(r=>r.label==='Most regular-season wins against a single opponent')?.value!==11)
  throw Error('Verified rivalry record changed for '+name);
}
for(const manager of ['Thommy','Birch']){
 if(holderMap.get(manager).find(r=>r.label==='Most championship-bracket playoff appearances')?.value!==7)
  throw Error('Verified playoff appearance leader changed: '+manager);
}
if(holderMap.get('Thommy').find(r=>r.label==='Most championship-game appearances')?.value!==5)
 throw Error('Verified championship-game appearance leader changed');
for(const label of [
 'Best average final finish (all six Sleeper seasons)',
 'Most top-three final finishes (2020–2025)',
 'Most top-five final finishes (2020–2025)'
]){
 const holder=holderMap.get('Mitch').find(r=>r.label===label);
 if(!holder)throw Error('Mitch missing verified placement record: '+label);
}
for(const name of ['Best normalized career final finish (6+ seasons, 2016–2025)','Most top-three finishes across 2016–2025']){
 if(!holderMap.get('Thommy').find(r=>r.label===name))
  throw Error('Verified all-era career record ownership missing: '+name);
}
if(holderMap.get('Mitch').find(r=>r.label==='Most points in a completed regular season')?.value!==1894.88)
 throw Error('Completed-season scoring leader changed');
if(holderMap.get('Thommy').find(r=>r.label==='Closest regular-season victory')?.value!==0.16)
 throw Error('Closest victory leader changed');
if(holderMap.get('Mitch').find(r=>r.label==='Highest career regular-season winning percentage (50+ games)')?.value!==60.68)
 throw Error('Qualified career winning percentage leader changed');
if(holderMap.get('Thommy').find(r=>r.label==='Most championships')?.value!==4)
 throw Error('Four verified Thommy titles not recognized as record');
if(holderMap.get('Mitch').find(r=>r.label==='Highest regular-season weekly score')?.value!==180.86)
 throw Error('Verified single-week scoring leader changed; review records before launch');
const leaderboard=fs.readFileSync('analytics/record-holders.html','utf8');
const leaderboardScript=fs.readFileSync('assets/record-holders-page.mjs','utf8');
const bookHtml=fs.readFileSync('managers/record-books.html','utf8');
if(!leaderboard.includes('id="record-leaders"')||!leaderboard.includes('id="record-categories"')||
   !leaderboard.includes('record-holders-page.mjs')||
   !bookHtml.includes('href="../analytics/record-holders.html"'))
 throw Error('League record leaderboard or its personal-record navigation is missing');
if(!leaderboardScript.includes("findOwnedRecords(archive,guide,m.manager,postseason)")||
   !leaderboardScript.includes("encodeURIComponent(name)")||
   !leaderboardScript.includes("b.records.length-a.records.length"))
 throw Error('Record holders must be dynamically ranked and linked to exact personal records');
for(const label of expectedKinds){
 const challenger=nextRecordChallenger(book,guide,label,postseason);
 if(!challenger||!Number.isFinite(challenger.value)||!Number.isFinite(challenger.gap)||challenger.gap<0)
  throw Error('Missing valid runner-up evidence for '+label);
 const leaders=[...holderMap].filter(([,recs])=>recs.some(r=>r.label===label)).map(([name])=>name);
 if(leaders.includes(challenger.manager))
  throw Error('Record challenger must be a different manager for '+label);
}
const closestChallenger=nextRecordChallenger(book,guide,'Closest regular-season victory',postseason);
if(closestChallenger.manager!=='Tony'||closestChallenger.value!==0.24)
 throw Error('Closest victory record challenger requires review');
const categoryPage=fs.readFileSync('assets/record-holders-page.mjs','utf8');
if(!categoryPage.includes('nextRecordChallenger(archive,guide,label,postseason)')||
   !categoryPage.includes('How close is the next manager?'))
 throw Error('Record challenger disclosures not mounted on the public leaderboard');
const countSum=[...holderMap.values()].reduce((sum,recs)=>sum+recs.length,0);
if(countSum<expectedKinds.length)
 throw Error('Insufficient category leaders; expected at least one leader per record category');

const bracketReceipts=JSON.parse(fs.readFileSync('data/sleeper_postseason_placement_receipts_2020_2025.json','utf8'));

for(const item of bracketReceipts.seasons){
 const owner=item.toiletBowl.manager;
 const resume=buildPlayoffResume(playoffEspn,playoffSleeper,owner,bracketReceipts);
 const season=resume.timeline.find(r=>r.year===item.year);
 if(season?.finalPlace!==10||!season.finish.includes('Shitter of the Year'))
  throw Error('Manager postseason résumé fails to record Shitter of the Year '+item.year+' '+owner);
 if(resume.appearances!==expectedPlayoffs[owner][0])
  throw Error('Toilet Bowl result must not change positive playoff qualification counts');
 if(item.year===2022){
  const complete=buildPlayoffResume(playoffEspn,playoffSleeper,'Mitch',bracketReceipts);
  if(complete.timeline.find(y=>y.year===2022).finalPlace!==4)
   throw Error('Verified 2022 fourth-place finish must appear in the manager résumé');
 }
}
const sourceMatchups=JSON.parse(fs.readFileSync('data/playoff_matchups_2020_2025.json','utf8'));
const handles={Stover:'yogurtslinger15',Stew:'Dsylvester9',Stilly:'Darstill',Mitch:'huppdawg80',Thommy:'thommy',Kuhle:'ckuhl5',Kuhl:'ckuhl5',Tony:'tsteg',Birch:'birchhh',JMid:'JMidd',Scott:'Sheffla',Koble:'Koble2323',Evans:'Evansbrandonm'};
const expectedLast={2020:'Tony',2021:'Stilly',2022:'Birch',2023:'Stew',2024:'Kuhl',2025:'Stover'};
if(bracketReceipts.seasons.length!==6)throw Error('Postseason screenshot coverage changed');
for(const yearData of bracketReceipts.seasons){
 const year=yearData.year;
 const verified=postseason.sleeper.seasons.find(s=>s.year===year);
 if(verified?.champion!==yearData.championship.winner||verified?.runnerUp!==yearData.championship.runnerUp)
  throw Error('Championship bracket conflict in '+year);
 if(yearData.toiletBowl?.manager!==expectedLast[year])
  throw Error('Toilet Bowl loser mismatch in '+year);
 if(yearData.reviewNeeded?.length&&year!==2020)throw Error('Unexpected ambiguous third-place evidence in '+year);
 const finished=yearData.finalPlacements||[];
 if(finished.length!==10||yearData.placementsComplete!==true)
  throw Error('Postseason placements must be complete for '+year);
 const uniqueManagers=new Set(finished.map(x=>x.manager)),uniquePlaces=new Set(finished.map(x=>x.place));
 if(uniqueManagers.size!==finished.length||uniquePlaces.size!==finished.length)
  throw Error('Season placement manager duplicated or ranks repeated in '+year);
 if(finished.find(x=>x.place===10)?.manager!==yearData.toiletBowl.manager)
  throw Error('Final 10th-place manager must be Shitter of the Year in '+year);
 if(finished.find(x=>x.place===1)?.manager!==yearData.championship.winner)
  throw Error('Final first-place manager must be season champion '+year);
 if(year===2020&&finished.filter(x=>!x.scoreVerified).map(x=>x.place).join(',')!=='3,4')
  throw Error('Unreconciled 2020 third place score must remain flagged');
 for(const game of yearData.placementGames){
  const matches=sourceMatchups.find(x=>x.year===year&&x.week===game.week)?.games||[];
  const found=matches.some(m=>{
   const points=new Map([m.home,m.away]);
   return points.get(handles[game.winner])===game.winnerScore&&
     points.get(handles[game.loser])===game.loserScore;
  });
  if(!found)throw Error('Unreconciled historical placement score '+year+' '+game.label);
  if(game.label==='King (Last Place)'&&
     (game.loser!==yearData.toiletBowl?.manager||game.loserScore>=game.winnerScore))
   throw Error('Shitter must be lower-scoring finalist in '+year);
 }
 const page=fs.readFileSync('seasons/'+year+'.html','utf8');
 if(!page.includes('id="verified-placements"')||!page.includes('verified-sleeper-placement-ui.mjs'))
  throw Error('Verified placement details are missing from season '+year);
}
const master=JSON.parse(fs.readFileSync('data/fellas_final_placements_2020_2025.json','utf8'));
for(const season of master.seasons){
 const bracket=postseason.sleeper.seasons.find(y=>y.year===season.year);
 const topSix=new Set(season.finishers.filter(x=>x.rank<=6).map(x=>x.manager));
 const entrants=new Set(bracket?.seeds||[]);
 if(topSix.size!==6||entrants.size!==6||
    [...topSix].some(name=>!entrants.has(name))||
    [...entrants].some(name=>!topSix.has(name)))
  throw Error('Postseason final ranks 1–6 do not match championship bracket seeds in '+season.year);
}
const flatMaster=master.seasons.flatMap(s=>s.finishers.map(x=>({...x,year:s.year})));
if(master.seasons.length!==6||flatMaster.length!==60||master.managers.length!==12)
 throw Error('Master placements require six complete ten-manager seasons');
for(const season of master.seasons){
 const original=bracketReceipts.seasons.find(y=>y.year===season.year);
 if(!original||season.finishers.length!==10||new Set(season.finishers.map(x=>x.manager)).size!==10||
    season.finishers.some((x,i)=>x.rank!==i+1||x.manager!==original.finalPlacements[i].manager))
  throw Error('Master final standings differ from source bracket for '+season.year);
}
const currentManagers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
for(const manager of currentManagers){
 const row=master.managers.find(x=>x.manager===manager);
 if(!row||row.finishes.length!==row.seasons||!row.finishes.every(x=>x.rank>=1&&x.rank<=10))
  throw Error('Incomplete finishing résumé '+manager);
}
const tabular=fs.readFileSync('data/fellas_final_placements_2020_2025.csv','utf8').trim().split(/\r?\n/);
if(tabular.length!==61)throw Error('CSV must include 60 ranked finishes plus header');
const placementUi=fs.readFileSync('analytics/record-holders.html','utf8');
if(!placementUi.includes('id="espn-last-place-history"')||
   !fs.readFileSync('assets/placement-statistics-ui.mjs','utf8').includes("provider==='ESPN'"))
 throw Error('ESPN 2016–2019 last-place history must remain separate from Sleeper Toilet Bowl');
if(!placementUi.includes('id="placement-stat-results"')||
 !placementUi.includes('placement-statistics-ui.mjs'))
 throw Error('Expandable placement comparison is missing from record holders');
const holdersPage=fs.readFileSync('analytics/record-holders.html','utf8');
if(!holdersPage.includes('id="shitter-year-history"')||!holdersPage.includes('verified-sleeper-placement-ui.mjs'))
 throw Error('All-time Shitter history is not mounted');

console.log('All ten manager profiles have launch-ready copy, consistent championship records, and current rankings links.');
