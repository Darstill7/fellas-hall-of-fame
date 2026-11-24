// Compatibility projection for existing career-core consumers; research only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stats=read(root+'full-era-career-statistics.json');
const prior=read('data/career_core_generated.json');
const fields=r=>({games:r.games,w:r.w,l:r.l,t:r.t});
const managers={};
for(const name of Object.keys(stats.career).sort()){
 const r=stats.career[name];
 const annual=Object.fromEntries(stats.seasons.filter(s=>Object.hasOwn(s.managers,name)).map(s=>[s.year,fields(s.managers[name])]));
 const h2h=Object.fromEntries(Object.entries(stats.rivalries[name]||{}).sort(([a],[b])=>a.localeCompare(b)).map(([opponent,r])=>[opponent,fields(r)]));
 for(const group of [annual,h2h])for(const k of ['games','w','l','t'])assert.equal(Object.values(group).reduce((n,v)=>n+v[k],0),r[k],name+' '+k);
 managers[name]={...fields(r),annual,h2h};
}
const regularSeasonGames=Object.values(managers).reduce((n,r)=>n+r.games,0)/2;
assert.equal(regularSeasonGames,652+5*stats.live_watermark.completed_regular_week);
const output={schemaVersion:1,source:'Certified full-era regular-season statistics engine',regularSeasonGames,managers,completedThrough:{year:stats.live_watermark.year,week:stats.live_watermark.completed_regular_week},provenance:{espn_blob:stats.espn_source_blob,sleeper_blob:stats.source_blob},status:'RESEARCH_ONLY'};
const changed=Object.keys(managers).filter(n=>JSON.stringify(fields(managers[n]))!==JSON.stringify(fields(prior.managers[n]||{})));
fs.writeFileSync(root+'career-core-preview.json',JSON.stringify(output,null,2)+'\n');
console.log('CAREER CORE PROJECTION PASS '+JSON.stringify({managers:Object.keys(managers).length,regularSeasonGames,changed,completedThrough:output.completedThrough}));
