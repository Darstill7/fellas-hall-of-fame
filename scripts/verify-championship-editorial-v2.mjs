import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('hall/championship-stories.html');
const css=read('assets/championship-editorial-v2.css');
const archive=JSON.parse(read('data/championship_season_stories_2016_2025_v1.json'));
const guide=JSON.parse(read('data/season_guide.json'));
assert.equal(archive.seasons.length,10,'Ten authored championship stories are required');
const years=archive.seasons.map(x=>x.year);
assert.deepEqual([...years].sort((a,b)=>a-b),Array.from({length:10},(_,i)=>2016+i),'Every season 2016–2025 must be covered');
for(const year of years)assert.equal(typeof guide[year]?.champion,'string','Verified champion required for '+year);
for(const id of ['championship-anthology-title','season-picker','championship-feature','chapter-bottom','chapters'])
 assert(html.includes('id="'+id+'"'),'Missing championship reading control '+id);
for(const phrase of ['year='+"'",'championship-share','story.sections.map','archive.seasons.find'])
 assert(html.includes(phrase),'Missing story/navigation functionality '+phrase);
assert(html.includes('championship-editorial-v2.css'),'Second-edition stylesheet must be loaded');
assert(css.includes('@media(max-width:560px)'),'Phone layout must be defined');
assert(css.includes('prefers-reduced-motion'),'Reduced-motion preference must be respected');
assert(html.includes('aria-label="Main navigation"'),'Primary nav landmark required');
assert(html.includes('../analytics/record-holders.html'),'Records must reach manager-first Record Book');
assert.equal(html.split('<style').length-1,html.split('</style>').length-1,'Inline styles must be balanced');
console.log('PASS: ten championship editions, archive navigation, story features and editorial visual system');
