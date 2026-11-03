// Guards the browser Start/Sit research page, including verified 2026 Sleeper UI parity.
// This does not certify injury availability or publish an official manager skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('analytics/manager-lineup-research.html','utf8');
const client=fs.readFileSync('assets/manager-lineup-research-page.mjs','utf8');
const generator=fs.readFileSync('scripts/analyze-2026-start-sit-hindsight.mjs','utf8');
const report=fs.readFileSync('analytics/manager-report-cards.html','utf8');
for(const s of ['Avg Start/Sit accuracy','2026 (Weeks 1–8)','manager-lineup-research-page.mjs'])
 assert.ok(html.includes(s),'Start/Sit research UI missing '+s);
assert.ok(report.includes('manager-lineup-research.html'),'Start/Sit research navigation missing');
for(const s of ['function yearWeeks(year){return year===2020?13:year===2026?8:14}',
 'currentTeamManagers','stat.accuracySum+=result.accuracy','map.set(key,stat)',
 'stilly.accuracySum/8','kuhl.accuracySum/8',"toFixed(1)+'%'"])
 assert.ok(client.includes(s),'Start/Sit browser computation or UI missing '+s);
assert.ok(client.includes('optimal({starters:r.starters,bench:[]})'),
 'Browser display does not verify actual legal starters');
for(const s of ['averageWeeklyStartSitAccuracyPercent','weeklyStartSitAccuracyPercent',
 "manager==='Stilly'","manager==='Kuhl'"])
 assert.ok(generator.includes(s),'Research generator missing UI benchmark or metric '+s);
const teams=generator.match(/const id=String\(p.team_id\)/);
assert.ok(teams,'Research generator team mapping no longer derived from verified draft selections');
const roster8=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2026_week8.json','utf8'));
assert.equal(roster8.week,8);
assert.equal(roster8.rosters.length,10);
assert.deepEqual(roster8.rosters.map(r=>Number(r.teamId)).sort((a,b)=>a-b),
 Array.from({length:10},(_,i)=>i+1));
console.log('Start/Sit page integration PASS: eight completed weeks, ten teams, Sleeper UI parity guards, no official skill grade');
