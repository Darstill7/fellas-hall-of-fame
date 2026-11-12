// Guard the 2020–2021 regular-season / playoff stage boundary.
// Do not auto-reclassify these games until standings and all-play downstream consumers are audited.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const get=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const raw=get('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const recovered=get('data/recovered_winners_bracket_2020_2021_v1.json').records;
const audit=get('data/week14_2020_2021_stage_classification_audit_v1.json');
const explorer=get('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
assert.equal(audit.schema,'fellas-2020-2021-week14-stage-classification-audit-v1');
assert.equal(audit.impact.gamesPotentiallyMisclassified,8);
assert.equal(audit.impact.independentlyVerifiedChampionshipOpeningGames,4);
for(const year of [2020,2021]){
 const source=raw[year],study=audit.years.find(s=>s.year===year);
 const rawRegular=source.games.filter(g=>g.stage==='regular');
 const week14=rawRegular.filter(g=>g.week===14);
 assert.equal(rawRegular.length,69,'Historical regular-labelled count unexpectedly changed '+year);
 assert.equal(rawRegular.filter(g=>g.week<=13).length,65);
 assert.equal(week14.length,4);
 assert.equal(study.regularLabeledWeek14,week14.length);
 for(const g of week14){
  const candidate=study.week14Games.find(t=>t.home===g.home&&t.away===g.away);
  assert(candidate,'Week 14 event lost from source audit');
  assert.equal(candidate.homeScore,g.homeScore);
  assert.equal(candidate.awayScore,g.awayScore);
 }
 const qualified=recovered.filter(x=>x.year===year&&x.round==='opening');
 assert.equal(qualified.length,2);
 for(const x of qualified){
  assert(week14.some(g=>g.week===x.week&&
   ((g.home===x.winner&&g.away===x.loser)||(g.home===x.loser&&g.away===x.winner))));
  assert(explorer.find(s=>s.year===year).matches.some(m=>m.round==='opening'&&m.winner===x.winner&&m.loser===x.loser));
 }
 assert.equal(study.standingsPotentiallyContaminated.length,8);
}
assert.equal(audit.status,'source_anomaly_verified_mutation_deferred');
console.log('PASS Week 14 stage audit: eight 2020–2021 records remain regular-labelled; four independently proven winners-bracket opening games; canonical playoff explorer corrected without silently altering standings.');
