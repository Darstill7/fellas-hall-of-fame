// Research projection: preserve editorial metadata while deriving career records from certified inputs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stats=read(root+'full-era-career-statistics.json');
const legacy=read('data/manager_profile_career_summary_v2.json');
assert.equal(stats.source_blob,'9d390c084c07874b9a282d21e7965e79f13f6b2d');
assert.equal(stats.espn_source_blob,'52dbf83af8e1b8966ad71fb510f61377d2445835');
assert.deepEqual(Object.keys(stats.career).sort(),Object.keys(legacy.managers).sort());
assert.equal(stats.live_watermark.year,2026);
const output=structuredClone(legacy);
output.source=['Certified unified full-era regular-season statistics engine','Verified championship and ESPN final metadata'];
output.caveats=['Regular-season results only; postseason excluded.','2026 through explicitly approved completed regular week '+stats.live_watermark.completed_regular_week+'.','Research preview; not production data.'];
delete output.asOf; // A date must come from the approved live receipt, never an old snapshot or the build clock.
output.completedThrough={year:stats.live_watermark.year,week:stats.live_watermark.completed_regular_week};
output.provenance={sleeper_blob:stats.source_blob,espn_blob:stats.espn_source_blob};
const differences=[];
for(const [name,r] of Object.entries(stats.career)){
 const prior=legacy.managers[name];
 const years=stats.seasons.filter(s=>Object.hasOwn(s.managers,name)).map(s=>s.year);
 const record={games:r.games,w:r.w,l:r.l,t:r.t};
 assert.equal(r.games,r.w+r.l+r.t);
 const manager=output.managers[name];
 manager.record=record;
 manager.years=[years[0],years.at(-1)];
 manager.regularSeasonMetrics={pf_cents:r.pf_cents,pa_cents:r.pa_cents,all_play_w:r.all_play_w,all_play_l:r.all_play_l,all_play_t:r.all_play_t,weekly_highs:r.weekly_highs,losses_at_or_above:r.losses_at_or_above,schedule_luck:stats.records.schedule_luck[name]};
 manager.seasonRecords=years.map(year=>({year,...stats.seasons.find(s=>s.year===year).managers[name]}));
 assert.deepEqual(manager.titles,prior.titles);assert.deepEqual(manager.espnFinalAppearances,prior.espnFinalAppearances);
 if(JSON.stringify(record)!==JSON.stringify(prior.record))differences.push({manager:name,before:prior.record,after:record});
}
assert.deepEqual(output.verifiedEspnFinals,legacy.verifiedEspnFinals);
fs.writeFileSync(root+'manager-profile-career-preview.json',JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(root+'manager-profile-career-migration-audit.json',JSON.stringify({status:'RESEARCH_ONLY',completedThrough:output.completedThrough,differences},null,2)+'\n');
console.log('MANAGER PROFILE PROJECTION PASS '+JSON.stringify({managers:Object.keys(output.managers).length,changed_records:differences.length,completedThrough:output.completedThrough}));
