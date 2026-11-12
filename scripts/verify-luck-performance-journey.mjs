// Release smoke test for the interactive manager Luck vs Performance journey.
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const data=json('data/luck_performance_profiles_2016_2026_v1.json');
const schedule=json('data/schedule_luck_current_v1.json');
const html=read('analytics/luck-vs-performance.html');
const page=read('assets/luck-performance-chart.mjs');
const profiles=read('assets/manager-profile-tabs.mjs');
const component=read('assets/manager-luck-performance.mjs');
const holders=read('analytics/record-holders.html');
const records=read('analytics/records.html');
const required=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
if(data.schema!=='fellas-luck-performance-profiles-v1'||data.managers.length!==14)throw Error('Unexpected Luck vs Performance dataset');
for(const manager of required){
 const row=data.managers.find(x=>x.manager===manager);
 if(!row||!row.currentSeason||row.currentSeason.pairedWeeks!==schedule.includedCurrentWeeks.length)
  throw Error('Missing manager or current-year data for '+manager);
 if(row.seasonHistory.some(x=>x.year===2026&&x.seasonStatus!=='provisional'))
  throw Error('2026 is not marked provisional: '+manager);
 const canonical=schedule.careerCompleted.find(x=>x.manager===manager);
 if(!canonical||Math.abs(row.completedScheduleLuckWins-canonical.scheduleLuckWins)>.002)
  throw Error('Career Schedule Luck conflict for '+manager);
}
if(data.currentThroughWeek!==schedule.currentThroughWeek||data.currentThroughWeek===null)
 throw Error('Current-year Schedule Luck and scoring datasets disagree');
if(!['id="luck-plot"','id="luck-table"','id="scope"','id="include-short"','luck-performance-chart.mjs'].every(x=>html.includes(x)))
 throw Error('Chart is missing core accessible controls or script');
if(!page.includes('role:\'button\'')||!page.includes('aria-label')||!page.includes("addEventListener('keydown'"))
 throw Error('Interactive chart is not keyboard selectable');
if(!profiles.includes('mountManagerLuckPerformance(profileName,profileHero)')||!component.includes('luck-vs-performance.html?manager='))
 throw Error('Manager profile navigation is disconnected');
if(!holders.includes('luck-vs-performance.html')||!records.includes('luck-vs-performance.html'))
 throw Error('Record Book entry points missing');
console.log('LUCK vs PERFORMANCE JOURNEY VERIFIED: 14 managers, 10 current profiles, complete-season records, current Week '+data.currentThroughWeek+' provisional, chart controls and navigation.');
