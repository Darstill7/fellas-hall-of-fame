import {findOwnedRecords,recordCategoryLabels,nextRecordChallenger} from '../assets/manager-record-ownership.mjs';
import fs from 'node:fs';
import {buildPlayoffResume} from '../assets/manager-playoff-resume.mjs';
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
 !tabsSource.includes('items:[0,1,12,13]')||
 !tabsSource.includes("href:'#profile-playoff-resume'"))
 throw Error('Playoff résumé is missing from the shared manager profile navigation');
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
if(!featureMenu.includes("items:[0,1,12,13]"))
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
const holderMap=new Map(book.managers.map(m=>[m.manager,findOwnedRecords(book,guide,m.manager,postseason)]));
const expectedKinds=[
 'Highest regular-season weekly score','Largest regular-season victory',
 'Most career regular-season wins','Most wins in a completed regular season','Most championships',
 'Most points in a completed regular season','Closest regular-season victory',
 'Highest career regular-season winning percentage (50+ games)',
 'Most regular-season wins against a single opponent',
 'Most championship-bracket playoff appearances','Most championship-game appearances'
];
if(expectedKinds.length!==recordCategoryLabels.length||recordCategoryLabels.length!==11)
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
const holdersPage=fs.readFileSync('analytics/record-holders.html','utf8');
if(!holdersPage.includes('id="shitter-year-history"')||!holdersPage.includes('verified-sleeper-placement-ui.mjs'))
 throw Error('All-time Shitter history is not mounted');

console.log('All ten manager profiles have launch-ready copy, consistent championship records, and current rankings links.');
