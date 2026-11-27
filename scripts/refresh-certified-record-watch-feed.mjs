// Refresh the public feed after an approved canonical weekly import.
// Weekly matchup approval is NOT record certification. Never copy candidates.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const path='data/certified-record-watch-feed-v1.json';
const report=JSON.parse(execFileSync(process.execPath,['scripts/build-certified-record-watch.mjs'],{encoding:'utf8',maxBuffer:32*1024*1024}));
const feed=report.publicFeed;
assert.equal(feed.schemaVersion,1);
assert.equal(feed.year,2026);
assert(Number.isInteger(feed.throughWeek)&&feed.throughWeek>=1&&feed.throughWeek<=14);
assert.equal(feed.status,'no-certified-items');
assert.deepEqual(feed.items,[],'No automatic approval of new record claims');
const serialized=JSON.stringify(feed,null,2)+'\n';
if(process.argv.includes('--check')){
 assert.deepEqual(JSON.parse(fs.readFileSync(path,'utf8')),feed,'Certified watch feed differs from reviewed-cutoff generator');
}else{
 assert.equal(process.env.FELLAS_APPROVE_WEEKLY_IMPORT,'YES','Approved weekly release required to refresh public feed');
 fs.writeFileSync(path,serialized);
}
console.log('PASS: certified watch feed through Week '+feed.throughWeek+'; research alerts withheld');
