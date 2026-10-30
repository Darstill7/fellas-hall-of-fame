import {managerCardTier} from '../assets/manager-card-tiers.mjs';
import {managerArchetype,earnedArchetypes} from '../assets/manager-madden-archetypes.mjs';
import {seasonResume} from '../assets/manager-season-resume.mjs';
import {weeklyOvrHistory} from '../assets/manager-weekly-ovr.mjs';
import fs from 'node:fs';import {makeRatings} from '../assets/fellas-rating-model.mjs';import {makeReportCards} from '../assets/manager-report-card.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p+'.json','utf8'));
const guide=read('season_guide'),careers=read('career_core_generated'),luck=read('all_time_luck_ratings_v1'),endings=read('manager_verified_season_endings_v1'),brackets=read('verified_sleeper_playoff_brackets_2020_2025'),espn=read('verified_espn_playoff_brackets_2016_2019');
const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets:[...espn.seasons,...brackets.seasons]});
const report=makeReportCards({drafts:read('v9_draft_engine'),trades:read('v9_trade_engine'),careers,luck,waivers:read('waiver_award_candidates'),endings,brackets,guide,espn});
const weekly=weeklyOvrHistory({ledger:read('unified_record_book_2016_2026'),guide,careers,luck,endings,playoffBrackets:[...espn.seasons,...brackets.seasons]});
if(weekly.length!==Math.max(...read('unified_record_book_2016_2026').games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week))||weekly.some(w=>w.rows.length!==10))throw Error('Madden weekly roster coverage incomplete');
for(const week of weekly)for(const r of week.rows){if(!Number.isFinite(r.ovr)||r.ovr<0||r.ovr>100)throw Error('Invalid weekly OVR '+week.week+' '+r.name);if(!r.breakdown||Object.keys(r.breakdown).length!==8||Object.values(r.breakdown).some(v=>!Number.isFinite(v)))throw Error('Weekly rating explanation evidence missing '+week.week+' '+r.name);}
if(!fs.readFileSync('assets/manager-madden-cards.mjs','utf8').includes('OVR movement:'))throw Error('Madden OVR driver explanation missing');
if(ratings.length!==14||report.length!==10)throw Error('Incorrect manager population');
for(const r of report){const o=ratings.find(x=>x.name===r.name);if(!o||!Number.isFinite(o.score)||!o.qualifiedYears)throw Error('Madden OVR source missing '+r.name);if(r.scores.waivers!==null||r.scores.lineups!==null)throw Error('Decision skills must remain ungraded');}
const page=fs.readFileSync('analytics/manager-madden-cards.html','utf8'),ui=fs.readFileSync('assets/manager-madden-cards.mjs','utf8'),hub=fs.readFileSync('analytics/power-ratings.html','utf8');
if(!page.includes('manager-madden-cards.mjs')||!hub.includes('manager-madden-cards.html')||!ui.includes('makeRatings({guide,careers,luck,endings,playoffBrackets})')||!ui.includes("makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn})"))throw Error('Madden card source/links disconnected');
if(!ui.includes('const trajectory=historical?weekly.filter')||!ui.includes('Biggest rise:')||!ui.includes('<polyline')||!ui.includes('2026 peak through W'))throw Error('OVR trend visualization or summary missing');
if(!ui.includes('weeklyOvrHistory')||!page.includes('id="week"'))throw Error('Madden weekly OVR selector missing');
if(!ui.includes("'N/A'")||!page.includes('not an average'))throw Error('Madden card provenance qualification missing');
console.log('MADDEN MANAGER CARDS PASS: '+ratings.length+' all-time OVR, '+report.length+' active evidence-backed reports');
for(const r of ratings){const history=seasonResume(r.name,careers,[...espn.seasons,...brackets.seasons],guide);if(!history.length||history.some(x=>!/^\d+-\d+/.test(x.record)))throw Error('Invalid season résumé '+r.name);if(history.filter(x=>x.badge==='CHAMPION').length!==r.titleYears.length)throw Error('Title résumé mismatch '+r.name)}
const maddenJS=fs.readFileSync('assets/manager-madden-cards.mjs','utf8');if(!maddenJS.includes('seasonsHtml')||!maddenJS.includes('Season-by-season résumé'))throw Error('Madden résumé not connected to cards');
console.log('MADDEN HISTORICAL RESUMES PASS');

const readable=['Regular-season winning','All-play performance','Playoff success','Championships','Championship game appearances','Drafting','Trading','Waiver pickups','Start/sit decisions'];
for(const name of readable){if(!ui.includes(name)||!page.includes(name))throw Error('Missing accessible Madden attribute explanation: '+name)}
if(!page.includes('What do the manager ratings mean?')||!page.includes('N/A — Not Available')||!ui.includes('labelHelp[k]'))throw Error('Accessible Madden rating guide or tooltips missing');
if(ui.includes("const label={regular:'WIN'"))throw Error('Abbreviated attributes returned to Madden cards');
console.log('MADDEN LABEL ACCESSIBILITY PASS: all nine attributes readable with mobile glossary');

for(const id of ['compare-a','compare-b','duel-results'])if(!page.includes('id="'+id+'"'))throw Error('Missing head-to-head UI '+id);
for(const phrase of ['Manager head-to-head','A missing grade never counts as a loss'])if(!page.includes(phrase))throw Error('Manager comparison disclosure missing: '+phrase);
for(const needle of ["const compare=()=>","Number.isFinite(x)&&Number.isFinite(y)","$('compare-a').addEventListener('change',compare)","$('compare-b').addEventListener('change',compare)","compare();"])if(!ui.includes(needle))throw Error('Madden comparison interaction missing '+needle);
console.log('MADDEN HEAD-TO-HEAD PASS: manager picker and evidence-safe grade comparisons');

for(const r of ratings){const a=managerArchetype(r,report.find(x=>x.name===r.name));if(!a.name||!a.reason||!a.category)throw Error('Unsubstantiated archetype '+r.name);if(a.category==='trading'&&(!a.provisional||report.find(x=>x.name===r.name)?.coverage.verifiedTradeSides<8))throw Error('Ungrounded trade specialist '+r.name);}
if(managerArchetype({titleYears:[2016,2017,2018],qualifiedYears:[],tenure:3},null).name!=='Dynasty Builder')throw Error('Championship dynasty priority regressed');
if(managerArchetype({titleYears:[],qualifiedYears:[],tenure:1},{scores:{trading:99},coverage:{verifiedTradeSides:1}}).name==='Trade Specialist')throw Error('Trade label assigned from inadequate evidence');
if(!ui.includes('earnedArchetypes(r,byName.get(r.name))')||!page.includes('primary archetype'))throw Error('Archetype presentation disconnected');
console.log('MADDEN ARCHETYPES PASS: '+ratings.length+' documented manager archetypes');

const multi=earnedArchetypes({titleYears:[2016,2017,2018],qualifiedYears:[2016,2017,2018,2020,2021,2022],tenure:10},{scores:{drafting:80,trading:81},coverage:{draftPicks:25,verifiedTradeSides:10}});
for(const title of ['Dynasty Builder','Perennial Contender','Trade Specialist','Draft Architect','Playoff Regular','League Veteran'])if(!multi.some(a=>a.name===title))throw Error('Independent Madden specialty missing '+title);
if(new Set(multi.map(a=>a.name)).size!==multi.length)throw Error('Duplicate Madden specialties');
if(multi.find(a=>a.name==='Trade Specialist')?.provisional!==true)throw Error('Trade specialty must show provisional qualification');
if(!ui.includes('specialtyHtml')||!page.includes('additional specialties independently'))throw Error('Multiple archetypes not rendered or explained');
console.log('MULTIPLE MADDEN ARCHETYPES PASS: independent evidence-based specialties');

if(!ui.includes("accomplishmentHtml")||!ui.includes("r.titleYears.join(', ')")||!ui.includes("r.qualifiedYears.join(', ')")||!page.includes('.accomplishments'))throw Error('Verified achievement panel missing');
if(ui.includes("+'</div>':'')<div"))throw Error('Madden archetype HTML concatenation broken');
console.log('MADDEN ACHIEVEMENTS PASS: verified titles, playoff seasons, career tenure');

for(const r of ratings){const tier=managerCardTier(r);if(!['dynasty','champion','contender','standard'].includes(tier.id))throw Error('Unrecognized card tier '+r.name);if(tier.id==='dynasty'&&r.titleYears.length<3||tier.id==='champion'&&r.titleYears.length<1||tier.id==='contender'&&r.qualifiedYears.length<5)throw Error('Unsupported card tier '+r.name)}
if(managerCardTier({titleYears:[2016,2017,2018],qualifiedYears:[]}).id!=='dynasty'||managerCardTier({titleYears:[],qualifiedYears:[2020,2021,2022,2023,2024]}).id!=='contender')throw Error('Madden card tier priority mismatch');
if(!ui.includes('managerCardTier(r)')||!page.includes('.tier-dynasty')||!page.includes('.tier-champion')||!page.includes('.tier-contender')||!page.includes('Card editions:'))throw Error('Madden card tiers missing from page');
console.log('MADDEN CARD EDITIONS PASS: source-backed tiers and responsive visual treatments');

if(!ui.includes("const trajectory=historical?")||!ui.includes('No 2026 weekly rating available')||!ui.includes("trajectory.length?'<svg"))throw Error('Former manager weekly OVR suppression missing');
console.log('MADDEN HISTORICAL WEEKLY COVERAGE PASS: no invented 2026 progression for alumni');

if(!ui.includes("weekly.slice().reverse().map(")||!fs.readFileSync('assets/manager-weekly-ovr.mjs','utf8').includes('latestWeek'))throw Error('Weekly Madden timeline must follow verified ledger weeks');
console.log('MADDEN LIVING TIMELINE PASS: derived week dropdown from canonical ledger');

const homepage=fs.readFileSync('index.html','utf8'),homeModule=fs.readFileSync('assets/home-manager-cards.mjs','utf8');
if(!homepage.includes('id="home-manager-cards"')||!homepage.includes('assets/home-manager-cards.mjs')||!homeModule.includes('makeRatings({guide,careers,luck,endings')||!homeModule.includes('href="managers/')||!ui.includes('profileSlug[r.name]'))throw Error('Homepage Madden manager profile navigation disconnected');
const expectedSlugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];for(const s of expectedSlugs)if(!fs.existsSync('managers/'+s+'/index.html'))throw Error('Homepage manager target missing '+s);
console.log('MADDEN HOMEPAGE PASS: ten verified manager profile targets');

const profileModule=fs.readFileSync('assets/manager-profile-madden.mjs','utf8');
for(const slug of ['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott']){
 const html=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!html.includes('manager-profile-madden.mjs'))throw Error('Missing profile Madden scouting panel: '+slug);
}
for(const needle of ['managerCardTier(manager)','earnedArchetypes(manager)','weeklyOvrHistory({ledger,guide,careers,luck,endings,playoffBrackets})','../../data/','segments.at(-2)'])if(!profileModule.includes(needle))throw Error('Manager profile Madden panel missing '+needle);
console.log('MADDEN PROFILE PANELS PASS: ten canonical manager pages share ratings and profiles');

const lastSnapshot=weekly.at(-1);
if(!lastSnapshot)throw Error('No verified weekly OVR snapshot');
for(const r of ratings.filter(r=>!r.historical)){
 const snapshot=lastSnapshot.rows.find(row=>row.name===r.name);
 if(!snapshot||Math.abs(snapshot.ovr-r.score)>0.11||snapshot.career!==r.career)throw Error('Homepage/profile/current-week rating discrepancy: '+r.name);
}
if(!homeModule.includes("makeRatings({guide,careers,luck,endings,playoffBrackets:")||!profileModule.includes("rankings=makeRatings({guide,careers,luck,endings,playoffBrackets})"))throw Error('Shared rating calculation absent from cards');
console.log('MADDEN SOURCE PARITY PASS: homepage, profiles and latest weekly OVR use identical canonical ratings for ten managers');

for(const path of ['assets/manager-season-resume.mjs','assets/manager-madden-cards.mjs','assets/manager-profile-madden.mjs']){
 const source=fs.readFileSync(path,'utf8');
 if(source.includes("'Finalist'")||source.includes("'FINALIST'"))throw Error('Ambiguous season result label: '+path);
 if(!source.includes('Runner-Up')&&!source.includes('RUNNER-UP'))throw Error('Missing runner-up season result: '+path);
}
console.log('Runner-up results distinguished from champion finishes PASS');

const homePage=fs.readFileSync('index.html','utf8');
const primaryManagerSection=homePage.indexOf('<section class="manager-showcase shell"');
const seasonRecordsSection=homePage.indexOf('<section class="section shell" aria-labelledby="season-records-home"');
if(primaryManagerSection<0||seasonRecordsSection<0||primaryManagerSection>=seasonRecordsSection)throw Error('Manager cards must precede season records on homepage');
if(!homePage.includes('The Fellas Manager Cards')||!homePage.includes('id="home-manager-cards"'))throw Error('Manager-first homepage missing accessible primary cards');
console.log('Homepage manager-first hierarchy PASS');

const stoverProfile=fs.readFileSync('managers/stover/index.html','utf8');
const profileTabs=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
for(const tab of ['overview','seasons','rivalries','advanced'])if(!stoverProfile.includes('data-profile-tab="'+tab+'"')||!profileTabs.includes(tab+':new Set('))throw Error('Stover profile missing navigation tab '+tab);
if(!stoverProfile.includes('manager-profile-tabs.mjs')||!stoverProfile.includes('.section[hidden]{display:none!important}'))throw Error('Stover profile tab presentation incomplete');
if(stoverProfile.includes('verified title season is 2023')||!stoverProfile.includes('verified title season is 2022'))throw Error('Stover title narrative regressed');
for(const anchor of ['franchise-story','season-history','head-to-head','franchise-encyclopedia','verified-history-panel','weekly-game-log'])if(!stoverProfile.includes('id="'+anchor+'"'))throw Error('Stover archival profile section missing '+anchor);
console.log('Stover four-tab profile structure and title historical correction PASS');

const kissStover=fs.readFileSync('managers/stover/index.html','utf8');
if(!kissStover.includes('class="story-facts"')||!kissStover.includes('<summary>Read the full story</summary>'))throw Error('Stover KISS summary/full-story progressive disclosure missing');
if(!kissStover.includes('data-canonical-manager-games="Stover"')||!kissStover.includes('data-canonical-manager-record="Stover"'))throw Error('Stover KISS career facts disconnected from canonical history');
console.log('Stover simplified career story and canonical record bindings PASS');

const scoutingTemplate=fs.readFileSync('assets/manager-profile-madden.mjs','utf8');
if(!scoutingTemplate.includes('Championship Games')||!scoutingTemplate.includes('manager.titleYears.length+manager.runnerYears.length'))throw Error('Profile finals count must include wins and runner-up finishes');
if(!scoutingTemplate.includes('Career W–L')||!scoutingTemplate.includes('Playoff Berths'))throw Error('KISS manager scouting facts missing');
console.log('All manager profiles distinguish title wins and championship-game appearances PASS');

const profileNavigation=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
if(!profileNavigation.includes("duplicateHeadings")||!profileNavigation.includes("section.remove()"))throw Error('Duplicate historical profile teaser cleanup missing');
for(const slug of ['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott']){
 const profile=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!profile.includes('manager-profile-tabs.mjs')||!profile.includes('id="verified-history-panel"')||!profile.includes('id="franchise-encyclopedia"'))throw Error('Profile archive must remain accessible after teaser cleanup: '+slug);
}
console.log('KISS profile cleanup retains all manager history and research sections PASS');

const sharedScouting=fs.readFileSync('assets/manager-profile-madden.mjs','utf8');
for(const token of ['grid-template-columns:repeat(4,minmax(0,1fr))','@media(max-width:700px)','min-height:112px','font-variant-numeric:tabular-nums'])if(!sharedScouting.includes(token))throw Error('Manager scouting card responsive layout regression: '+token);
console.log('Shared scouting card responsive typography and stat grid PASS');
