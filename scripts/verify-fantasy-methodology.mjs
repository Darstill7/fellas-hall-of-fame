// Fantasy-football methodology contract: prevent apparently precise ratings
// from silently violating league rules, weighting, or evidence coverage.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {WEIGHTS,makeReportCards} from '../assets/manager-report-card.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
assert.deepEqual(WEIGHTS,{drafting:15,trading:15,regular:10,allPlay:10,championships:20,finals:8,playoffs:12,waivers:5,lineups:5});
const total=Object.values(WEIGHTS).reduce((a,b)=>a+b,0);
assert.equal(total,100);
assert.equal(WEIGHTS.championships+WEIGHTS.finals+WEIGHTS.playoffs,40,'Postseason success must have biggest share');
const input={drafts:read('data/v9_draft_engine.json'),trades:read('data/v9_trade_engine.json'),careers:read('data/career_core_generated.json'),luck:read('data/all_time_luck_ratings_v1.json'),waivers:read('data/waiver_award_candidates.json'),endings:read('data/manager_verified_season_endings_v1.json'),brackets:read('data/verified_sleeper_playoff_brackets_2020_2025.json'),guide:read('data/season_guide.json'),espn:read('data/verified_espn_playoff_brackets_2016_2019.json')};
const cards=makeReportCards(input);
assert.equal(cards.length,10);
for(const r of cards){
 assert.equal(r.scores.waivers,null,'Research-only FAAB must never become a skill grade');
 assert.equal(r.scores.lineups,null,'Hindsight lineup scores must never become a decision grade');
 assert.ok(r.ungraded.includes('waivers')&&r.ungraded.includes('lineups'),'Missing visible unrated categories');
 const supported=Object.entries(r.scores).filter(([,v])=>v!==null);
 const active=supported.reduce((s,[k])=>s+WEIGHTS[k],0);
 assert.equal(r.availableWeight,active,'Incorrect certified-weight denominator');
 assert.ok(active<=90,'Uncertified categories included in score');
 const computed=Math.round(10*supported.reduce((s,[k,v])=>s+WEIGHTS[k]*v,0)/active)/10;
 assert.ok(Math.abs(computed-r.provisional)<.051,'Provisional rating denominator wrong');
 assert.ok(r.coverage.verifiedChampionships<=r.coverage.minimumPlayoffs,'Championship without verified qualification');
}
const methodology=fs.readFileSync('data-integrity/FAAB_RATING_EVIDENCE_GATE_2026-10-30.md','utf8');
for(const concept of ['replacement','postseason','zero-dollar','N/A'])assert.ok(methodology.toLowerCase().includes(concept.toLowerCase()),'Missing methodological guard '+concept);
const fairness=fs.readFileSync('data-integrity/FANTASY_FOOTBALL_FAIRNESS_CONTRACT_2026-10-30.md','utf8');
for(const term of ['half-PPR','two FLEX','keeper','replacement value','2026','Schermerhorn','Chromium','WebKit']){
 assert.ok(fairness.toLowerCase().includes(term.toLowerCase()),'League-specific fairness rule absent: '+term);
}
console.log('Fantasy methodology contract PASS: 10 managers; postseason 40%; missing waiver/lineup evidence withheld.');
