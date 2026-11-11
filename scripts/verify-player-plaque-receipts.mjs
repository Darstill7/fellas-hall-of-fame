import fs from 'node:fs';
import assert from 'node:assert/strict';
const page=fs.readFileSync('hall/players.html','utf8');
const stories=JSON.parse(fs.readFileSync('data/championship_season_stories_2016_2025_v1.json','utf8'));
const byYear=new Map(stories.seasons.map(x=>[x.year,x.sections.map(s=>s.text).join(' ')]));
const checks=[
 {player:'CeeDee Lamb',year:2021,receipt:'8.40',source:['CeeDee Lamb','8.40'],link:'championship-stories.html?year=2021'},
 {player:'Derrick Henry',year:2023,receipt:'October 2023',source:['Derrick Henry','Cooper Kupp'],link:'championship-stories.html?year=2023'},
 {player:'Jonathan Taylor',year:2021,receipt:'292.40',source:['Jonathan Taylor','292.40','24.00'],link:'championship-stories.html?year=2021'},
 {player:'Mike Evans',year:2023,receipt:'October 26, 2023',source:['Mike Evans','Cooper Kupp'],link:'championship-stories.html?year=2023'},
];
for(const item of checks){
 assert(page.includes('<h2>'+item.player+'</h2>'),item.player+' plaque absent');
 assert(page.includes(item.receipt),item.player+' receipt text missing');
 assert(page.includes('href="'+item.link+'"'),item.player+' championship evidence link missing');
 const evidence=byYear.get(item.year);
 for(const fragment of item.source)assert(evidence.includes(fragment),item.player+' source receipt '+fragment+' missing in '+item.year+' championship article');
}
const scores=[...page.matchAll(/class="hof-score">(\d+)<\/div>/g)].map(m=>Number(m[1]));
assert.deepEqual(scores,[96,92,90,88,85,83,82,81,78,77,75,74],'Preserve existing editorial legacy scores');
assert(page.includes('These are editorial legacy scores'),'Editorial score interpretation must be visible before rankings');
const css=fs.readFileSync('assets/museum-editorial-editions.css','utf8');
assert(css.includes('.plaque-receipt')&&css.includes('.plaque-scoring-note'),'Plaque evidence styles absent');
console.log('PASS: four championship-backed player plaque additions, twelve unchanged editorial ranks, and transparent score methodology');
