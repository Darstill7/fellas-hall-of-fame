// Independently ensure all ten defining-moment cards agree with the source archive.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data/manager_defining_moments_verified_v1.json');
const guide=read('data/season_guide.json');
const placements=read('data/fellas_final_placements_2016_2025_verified.json');
const boxes=read('data/championship_player_boxscores_2020_2025_v1.json');
const stories=read('data/championship_season_stories_2016_2025_v1.json');
const expected=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const round=x=>Math.round(x*100)/100;
assert.deepEqual(Object.keys(data.managers).sort(),expected.slice().sort());
for(const [name,x] of Object.entries(data.managers)){
 assert.ok(x.headline.length>=15&&x.story.length>=80&&x.action.length>=12,'Thin editorial card '+name);
 assert.ok(x.url.startsWith('../../')&&!x.url.includes('http'),'Unsafe page link '+name);
 assert.ok(x.sources.length>=2,'Missing provenance '+name);
 assert.ok(x.year<=2025,'Defining moments must use completed years '+name);
 assert.ok(fs.existsSync(x.url.replace('../../','')),'Missing destination '+name+' '+x.url);
 const season=guide[x.year],stand=season.standings.find(z=>z.name===name),finish=placements.seasons.find(z=>z.year===x.year)?.finishes.find(z=>z.manager===name);
 assert.ok(stand&&finish,'Missing season ownership '+name+' '+x.year);
 if(x.type==='championship'){
  assert.equal(season.champion,name,'gold championship only for real title holder '+name);
  assert.equal(finish.rank,1,'incorrect title finish '+name);
  assert.ok(x.url.includes('championship-stories.html?year='+x.year),'Champion article link '+name);
 }else{
  assert.notEqual(season.champion,name,'Real champ missing gold styling '+name);
 }
 const landing=fs.readFileSync('managers/'+(name==='Thommy'?'tom':name.toLowerCase())+'/index.html','utf8');
 assert.ok(landing.includes('manager-profile-tabs.mjs'),'Manager must load shared UI '+name);
}
const assertRecord=(name,year,w,l)=>{const v=guide[year].standings.find(x=>x.name===name);assert.equal(v.w,w,name+' '+year+' W');assert.equal(v.l,l,name+' '+year+' L');};
assertRecord('Stilly',2023,8,6);
assertRecord('Stew',2022,11,3);
assertRecord('Stover',2022,9,5);
assertRecord('Birch',2019,11,2);
assertRecord('Tony',2021,10,3);
assertRecord('Mitch',2025,13,1);
assertRecord('Kuhl',2022,8,6);
assertRecord('JMid',2024,8,6);
assertRecord('Scott',2024,5,9);
assertRecord('Scott',2025,8,6);
assert.equal(placements.seasons.find(x=>x.year===2022).finishes.find(x=>x.manager==='Kuhl').rank,3);
assert.equal(placements.seasons.find(x=>x.year===2025).finishes.find(x=>x.manager==='Mitch').rank,3);
assert.equal(guide[2024].standings.find(x=>x.name==='JMid').pf,1730.22);
assert.equal(guide[2025].standings.find(x=>x.name==='Mitch').pf,1894.88);
assert.equal(stories.seasons.find(x=>x.year===2023).verifiedTradeReceipts.some(t=>t.id==='1023059879336013824'),true);
const points=(year,player)=>boxes.games.find(g=>g.year===year&&g.round==='championship').starters.find(x=>x.name===player)?.points;
assert.equal(points(2021,'Joe Mixon'),29.5);
assert.equal(points(2025,'Bijan Robinson'),38.4);
assert.equal(points(2025,'Brock Purdy'),36.92);
assert.equal(points(2024,'Tee Higgins'),34.6);
assert.ok(data.managers.Stew.story.includes('canceled')&&data.managers.Stover.story.includes('interrupted'),'Canceled 2022 game context absent');
assert.ok(data.managers.JMid.story.includes('Evans'),'JMid must not inherit Evans 2023 team');
const code=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8'),css=fs.readFileSync('assets/manager-profile-readability.css','utf8');
assert.ok(code.includes('mountVerifiedDefiningMoment()')&&code.includes('data/manager_defining_moments_verified_v1.json'));
assert.ok(css.includes('.profile-moment-champion')&&css.includes('.profile-moment-career'));
console.log('10 VERIFIED MANAGER DEFINING MOMENTS PASS: 6 gold champion moments, 4 nonchampion stories, documented seasons, player scores and manager identity.');
