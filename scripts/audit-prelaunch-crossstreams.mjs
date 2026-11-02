// Prelaunch audit across keeper evidence, OVR, manager pages, mobile navigation
// and editorial naming. Research-only: never author missing results or scores.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeRatings} from '../assets/fellas-rating-model.mjs';
import {maddenOvr} from '../assets/manager-madden-scale.mjs';
import {makeReportCards,WEIGHTS} from '../assets/manager-report-card.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p+'.json','utf8'));
const managers={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
const guide=read('season_guide'),careers=read('career_core_generated'),luck=read('all_time_luck_ratings_v1'),endings=read('manager_verified_season_endings_v1');
const espn=read('verified_espn_playoff_brackets_2016_2019'),sleeper=read('verified_sleeper_playoff_brackets_2020_2025');
const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets:[...espn.seasons,...sleeper.seasons]});
const reports=makeReportCards({drafts:read('v9_draft_engine'),trades:read('v9_trade_engine'),careers,luck,waivers:read('waiver_award_candidates'),endings,brackets:sleeper,guide,espn});
assert.equal(Object.values(WEIGHTS).reduce((n,x)=>n+x,0),100);
assert.equal(WEIGHTS.keepers,5);
const issues=[],rows=[];
for(const [manager,slug] of Object.entries(managers)){
 const rating=ratings.find(x=>x.name===manager);
 const card=reports.find(x=>x.name===manager);
 assert.ok(rating&&card,'Missing current manager from both rating pipelines: '+manager);
 const path='managers/'+slug+'/index.html';
 if(!fs.existsSync(path)){issues.push({manager,type:'missing_profile',path});continue;}
 const html=fs.readFileSync(path,'utf8');
 const nav=html.includes('manager-profile-tabs.mjs');
 const ovr=maddenOvr(rating.score);
 if(!Number.isFinite(ovr)||ovr<65||ovr>99)issues.push({manager,type:'invalid_legacy_ovr'});
 if(!nav)issues.push({manager,type:'profile_navigation_script_missing',path});
 if(card.scores.keepers!==null||card.scores.waivers!==null||card.scores.lineups!==null)issues.push({manager,type:'uncertified_grade_exposed'});
 if(!html.includes('<main'))issues.push({manager,type:'missing_main_landmark',path});
 rows.push({manager,slug,legacyOvr:ovr,reportCardPreview:card.provisional,gradedWeight:card.availableWeight,
  keeperGradeStatus:'not_certified',hasProfileNavigation:nav,hasMainLandmark:html.includes('<main')});
}
const home=fs.readFileSync('assets/home-manager-cards.mjs','utf8');
if(!home.includes("r.name+' '+identity"))issues.push({type:'mobile_search_missing_nickname'});
if(!home.includes('mobile-manager-ovr')||!home.includes('LEGACY OVR'))issues.push({type:'mobile_rating_context_missing'});
const nav=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
for(const phrase of ['profile-tab-row','profile-quick-grid','profile-deep-disclosure','prefers-reduced-motion'])
 if(!nav.includes(phrase))issues.push({type:'profile_navigation_guard_missing',phrase});
const keeper=JSON.parse(fs.readFileSync('data-integrity/sleeper-season-rule-matrix-2020-2026.json','utf8'));
for(const season of keeper.seasons)if(season.keepersEnabled!==(season.year>=2025))
 issues.push({type:'keeper_era_mismatch',year:season.year});
const records=read('v9_draft_engine');
for(const entry of records)if(entry.year<2025&&entry.keeper===true)
 issues.push({type:'keeper_before_2025',year:entry.year});
const report={schema:'fellas-prelaunch-crossstream-audit-v1',status:issues.length?'requires_review':'structural_checks_passed',
 limitations:['Structural checks cannot prove visual quality on actual devices.','OVR and report-card preview are separate measures and must not be silently equated.','Keeper value and waiver skill are not scored until evidence certification.'],
 coverage:{currentManagerProfiles:rows.length,keeperEraFirstYear:2025,verifiedKeeperSelections:records.filter(x=>x.keeper).length,issues:issues.length},
 rows,issues};
const dest='data-integrity/prelaunch-crossstream-audit-v1.json';
fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
if(issues.length)throw Error('Prelaunch crossstream audit raised '+issues.length+' issues: '+JSON.stringify(issues.slice(0,10)));
console.log('PASS prelaunch crossstream: 10 profiles, Madden OVR, keeper era, rating caveats and mobile labels');
