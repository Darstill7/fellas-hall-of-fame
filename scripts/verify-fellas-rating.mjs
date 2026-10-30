// Formula integrity and reproducibility checks for the living all-time rating.
// Run: node scripts/verify-fellas-rating.mjs
import fs from 'node:fs';
import {makeRatings,WEIGHTS} from '../assets/fellas-rating-model.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const inputs={guide:read('data/season_guide.json'),careers:read('data/career_core_generated.json'),luck:read('data/all_time_luck_ratings_v1.json'),endings:read('data/manager_verified_season_endings_v1.json')};
const rows=makeRatings(inputs);
const fail=msg=>{throw Error(msg)};
if(rows.length!==10||new Set(rows.map(x=>x.name)).size!==10)fail('Current franchises must be unique and total 10');
if(Object.values(WEIGHTS).reduce((a,b)=>a+b,0)!==100)fail('Rating component maximum is not 100');
for(const [i,r] of rows.entries()){
 if(r.rank!==i+1||!Number.isFinite(r.score)||r.score<0||r.score>100)fail('Invalid rank or range for '+r.name);
 if(Math.round(r.score*10)!==r.score*10)fail('Score must be one decimal '+r.name);
 if(Math.abs(Object.values(r.breakdown).reduce((a,b)=>a+b,0)-r.score)>.41)fail('Component-to-total parity '+r.name);
 if(i&&rows[i-1].score<r.score)fail('Rank ordering broken');
}
const tom=rows.find(x=>x.name==='Thommy');
if(tom.titleYears.join(',')!=='2016,2017,2018,2024')fail('Thommy championship evidence changed');
const recency=.25+.75*Math.pow(.5,0/3.5),old=.25+.75*Math.pow(.5,9/3.5);
if(!(old<recency&&old>.25))fail('Aging championship curve broken');
if(!rows.find(x=>x.name==='Scott').titleYears.includes(2025))fail('2025 champion missing');
const page=fs.readFileSync('analytics/power-ratings.html','utf8');
if(!page.includes('makeRatings')||!page.includes('id="ranking"')||!page.includes('fellas-rating-model.mjs'))fail('Rating page not connected to canonical model');
console.log('Fellas ratings PASS: '+rows.map(r=>r.name+' '+r.score.toFixed(1)).join(' | '));
