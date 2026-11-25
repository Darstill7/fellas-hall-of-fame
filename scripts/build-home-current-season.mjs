// Build a small season-specific projection from the canonical ledger. No service or credentials required.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {recordWatchScoreInput} from '../assets/weekly-record-watch.mjs';
import {buildWinningStreakWatch,buildCareerWinsMilestones} from '../assets/conditional-record-watch-v51.mjs';
import {buildHomeDashboard} from '../assets/home-app-v3.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const guide=read('data/season_guide.json'),ledger=read('data/unified_record_book_2016_2026.json');
const full=buildHomeDashboard(guide,ledger);
const compact={schemaVersion:1,year:2026,throughWeek:full.week,games:ledger.games.filter(g=>g.year===2026&&g.stage==='regular')};
assert.deepEqual(buildHomeDashboard(guide,compact),full,'Compact projection must reproduce canonical dashboard exactly');
const path='data/home-current-season-v1.json',body=JSON.stringify(compact)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),body,'Regenerate compact data after canonical sync');
else fs.writeFileSync(path,body);
console.log('Verified compact projection through Week '+full.week+' ('+Buffer.byteLength(body)+' bytes)');

const watchPath='data/conditional-record-watch-v51.json',watchBody=JSON.stringify({schemaVersion:1,year:2026,throughWeek:full.week,
 seasonScoreHash:createHash('sha256').update(recordWatchScoreInput(ledger.games,2026)).digest('hex'),
 items:buildWinningStreakWatch(ledger,full),careerWins:buildCareerWinsMilestones(ledger,full)})+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(watchPath,'utf8'),watchBody,'Regenerate conditional Record Watch after canonical sync');else fs.writeFileSync(watchPath,watchBody);
