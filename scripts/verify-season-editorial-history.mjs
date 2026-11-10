import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../seasons/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/season-editorial-history-v1.css',import.meta.url),'utf8');
const match=html.match(/<script type="application\/json" id="seasons-data">([\s\S]*?)<\/script>/);
assert(match,'Historical season JSON is required');
const seasons=JSON.parse(match[1]);
const years=Array.from({length:11},(_,i)=>String(i+2016));
assert.deepEqual(Object.keys(seasons).sort(),years,'Every season 2016–2026 must be present');
for(const year of years){
 const entry=seasons[year];
 assert.equal(Number(entry.year),Number(year),'Year label mismatch '+year);
 assert(Array.isArray(entry.standings)&&entry.standings.length>=8,'Missing reconstructed standings '+year);
 assert(entry.coverage&&entry.summary,'Missing historical source notes '+year);
 if(Number(year)<2026)assert(entry.champion,'Completed season lacks champion '+year);
}
assert.equal(seasons['2026'].champion,null,'2026 cannot have a finalized champion');
assert(seasons['2026'].coverage.includes('Week 9'),'Current embedded snapshot is through Week 9');
assert(!html.includes('archived through completed Week 7'),'Outdated reader-facing season coverage');
for(const id of ['season','season-buttons','headline','story','coverage','standings','highlights','seasonarchive','edition-primary','edition-secondary'])
 assert(html.includes('id="'+id+'"'),'Season selector control missing '+id);
for(const route of ['2026.html','../analytics/sportscenter.html','../analytics/playoff-race.html','../hall/championship-stories.html','../analytics/record-holders.html'])
 assert(html.includes('href="'+route+'"'),'Required history route missing '+route);
assert(html.includes("url.searchParams.set('year'"),'Every selected edition must be shareable');
assert(html.includes("const initialYear=new URLSearchParams(location.search).get('year')"),'Year deep links must restore selection');
assert(html.includes("x.year+'.html'"),'Completed Sleeper seasons must link to their dedicated archive');
assert(html.includes("'../hall/championship-stories.html?year='+x.year"),'ESPN championship years must reach anthology');
assert(html.includes('activeManagerSlugs={Stilly:'),'Current manager cross-links must exist');
assert(html.includes('managerLink(r.name)'),'Archived standings must link active manager franchise profiles');
assert(html.includes('season-editorial-history-v1.css'),'Shared editorial styles not linked');
assert(css.includes('@media(max-width:450px)')&&css.includes('prefers-reduced-motion'),'Responsive accessible layout missing');
console.log('PASS: all eleven seasons, preserved source data, dynamic 2026 caveat, deep links and editorial navigation');
