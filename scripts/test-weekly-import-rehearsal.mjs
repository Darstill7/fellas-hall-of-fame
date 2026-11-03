import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ledgerPath='data/unified_record_book_2016_2026.json';
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const season=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const lastWeek=Math.max(0,...season.map(g=>g.week));
const seed=season.filter(g=>g.week===lastWeek);
if(seed.length!==5||lastWeek>=14)throw Error('Fixture requires a complete regular season and an upcoming week');
const nextWeek=lastWeek+1;
const candidate='data-integrity/sleeper-sync-candidates/2026-week'+nextWeek+'.json';
const sourceFiles=[ledgerPath,'data/season_weekly_matchups_2016_2026_v1.json','data/all_time_luck_ratings_v1.json','data/career_core_generated.json','data/season_guide.json'];
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=sourceFiles.map(hash);
const fixture={status:'REVIEW_REQUIRED',league:'1340027406009761792',year:2026,week:nextWeek,matchupCount:5,games:seed.map(g=>({...g,week:nextWeek,source:'SYNTHETIC_TEST_ONLY'}))};
// Exercise the real approval and dry-run checks in an isolated workspace. Never
// overwrite or delete a staged real Week 8 candidate from the repository.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-weekly-import-'));
try{
 for(const p of [ledgerPath,'data/season_weekly_matchups_2016_2026_v1.json','data/all_time_luck_ratings_v1.json']){
  fs.mkdirSync(path.join(temp,path.dirname(p)),{recursive:true});
  fs.copyFileSync(p,path.join(temp,p));
 }
 const fixturePath=path.join(temp,candidate);
 fs.mkdirSync(path.dirname(fixturePath),{recursive:true});
 fs.writeFileSync(fixturePath,JSON.stringify(fixture));
 const importer=path.resolve('scripts/apply-reviewed-sleeper-week.mjs');
 const run=approve=>spawnSync(process.execPath,[importer,candidate,'--dry-run'],{cwd:temp,encoding:'utf8',env:{...process.env,FELLAS_APPROVE_WEEKLY_IMPORT:approve}});
 const rejected=run('NO');
 if(rejected.status===0||!rejected.stderr.includes('Human approval required'))throw Error('Approval safeguard failed: '+rejected.stderr);
 const approved=run('YES');
 if(approved.status!==0||!approved.stdout.includes('DRY RUN PASS'))throw Error('Synthetic dry-run failed: '+approved.stderr+' '+approved.stdout);
 const after=sourceFiles.map(hash);
 if(after.some((h,i)=>h!==before[i]))throw Error('Dry-run mutated canonical source files');
 if(!fs.existsSync(fixturePath))throw Error('Synthetic fixture unexpectedly missing');
 console.log('WEEKLY IMPORT REHEARSAL PASS: isolated synthetic Week '+nextWeek+', approved dry-run validated; real candidate and canonical files unchanged');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
