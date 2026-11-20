import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ledgerPath='data/unified_record_book_2016_2026.json';
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const seasonGames=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const latestWeek=Math.max(0,...seasonGames.map(g=>g.week));
const fixtureWeek=latestWeek+1;
const lastFive=seasonGames.filter(g=>g.week===latestWeek);
if(lastFive.length!==5||fixtureWeek>14)throw Error('Fixture needs five verified current-week games and an eligible next week');
const file='data-integrity/sleeper-sync-candidates/2026-week'+fixtureWeek+'.json';
const usingReviewedCandidate=fs.existsSync(file);
// When a real next-week candidate is staged for review, exercise its dry-run
// without overwriting or deleting it. Otherwise use a disposable synthetic fixture.
const sourceFiles=[ledgerPath,'data/season_weekly_matchups_2016_2026_v1.json','data/all_time_luck_ratings_v1.json','data/career_core_generated.json','data/season_guide.json'];
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before=sourceFiles.map(hash);
fs.mkdirSync('data-integrity/sleeper-sync-candidates',{recursive:true});
const fixture={status:'REVIEW_REQUIRED',league:'1340027406009761792',year:2026,week:fixtureWeek,matchupCount:5,games:lastFive.map(g=>({...g,week:fixtureWeek,source:'SYNTHETIC_TEST_ONLY'}))};
try{
 if(!usingReviewedCandidate)fs.writeFileSync(file,JSON.stringify(fixture));
 const run=(approve)=>spawnSync(process.execPath,['scripts/apply-reviewed-sleeper-week.mjs',file,'--dry-run'],{encoding:'utf8',env:{...process.env,FELLAS_APPROVE_WEEKLY_IMPORT:approve}});
 const rejected=run('NO');
 if(rejected.status===0||!rejected.stderr.includes('Human approval required'))throw Error('Approval safeguard failed: '+rejected.stderr);
 const approved=run('YES');
 if(approved.status!==0||!approved.stdout.includes('DRY RUN PASS'))throw Error('Synthetic dry-run failed: '+approved.stderr+' '+approved.stdout);
 const after=sourceFiles.map(hash);
 if(after.some((h,i)=>h!==before[i]))throw Error('Dry-run mutated canonical files');
 console.log('WEEKLY IMPORT REHEARSAL PASS: '+(usingReviewedCandidate?'review candidate':'synthetic fixture')+' Week '+fixtureWeek+', approved dry-run validated; no canonical file changes');
}finally{if(!usingReviewedCandidate)fs.rmSync(file,{force:true})}
