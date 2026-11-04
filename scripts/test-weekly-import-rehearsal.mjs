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
 for(const p of [...sourceFiles,'scripts/verify-staged-weekly-candidates.mjs']){
  fs.mkdirSync(path.join(temp,path.dirname(p)),{recursive:true});
  fs.copyFileSync(p,path.join(temp,p));
 }
 const fixturePath=path.join(temp,candidate);
 fs.mkdirSync(path.dirname(fixturePath),{recursive:true});
 // Build a self-consistent synthetic provider snapshot for lifecycle verification.
 const simulated=[...season,...fixture.games];
 const simulatedStandings=new Map();
 for(const g of simulated)for(const manager of [g.home,g.away])
  if(!simulatedStandings.has(manager))simulatedStandings.set(manager,{manager,wins:0,losses:0,pointsFor:0,pointsAgainst:0});
 for(const g of simulated)for(const [manager,points,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
  const row=simulatedStandings.get(manager);
  row.wins+=Number(points>against);row.losses+=Number(points<against);
  row.pointsFor+=points;row.pointsAgainst+=against;
 }
 fixture.providerStandingsSnapshot={seasonThroughWeek:nextWeek,teams:[...simulatedStandings.values()].map(x=>({...x,pointsFor:Math.round(x.pointsFor*100)/100,pointsAgainst:Math.round(x.pointsAgainst*100)/100}))};
 fs.writeFileSync(fixturePath,JSON.stringify(fixture));
 const importer=path.resolve('scripts/apply-reviewed-sleeper-week.mjs');
 const run=(approve,dryRun=true)=>spawnSync(process.execPath,[importer,candidate,...(dryRun?['--dry-run']:[])],{cwd:temp,encoding:'utf8',env:{...process.env,FELLAS_APPROVE_WEEKLY_IMPORT:approve}});
 const rejected=run('NO');
 if(rejected.status===0||!rejected.stderr.includes('Human approval required'))throw Error('Approval safeguard failed: '+rejected.stderr);
 const approved=run('YES');
 if(approved.status!==0||!approved.stdout.includes('DRY RUN PASS'))throw Error('Synthetic dry-run failed: '+approved.stderr+' '+approved.stdout);
 const verifier=path.resolve('scripts/verify-staged-weekly-candidates.mjs');
 const verify=()=>spawnSync(process.execPath,[verifier],{cwd:temp,encoding:'utf8'});
 let verified=verify();
 if(verified.status!==0||!verified.stdout.includes('WEEKLY CANDIDATE PASS'))throw Error('Pending synthetic candidate rejected: '+verified.stderr);
 // Intentionally omit generator scripts from the isolated workspace.
 // A real import will fail after beginning writes; the importer must roll back.
 const rolledBack=run('YES',false);
 if(rolledBack.status===0||!rolledBack.stderr.includes('WEEKLY IMPORT ROLLED BACK'))
  throw Error('Synthetic failed import did not report rollback: '+rolledBack.stderr);
 const restored=sourceFiles.map(p=>createHash('sha256').update(fs.readFileSync(path.join(temp,p))).digest('hex'));
 if(restored.some((h,i)=>h!==before[i]))throw Error('Failed import left modified canonical or generated files');
 if(JSON.parse(fs.readFileSync(fixturePath,'utf8')).status!=='REVIEW_REQUIRED')throw Error('Failed import incorrectly advanced candidate status');
 const tempLedger=JSON.parse(fs.readFileSync(path.join(temp,ledgerPath),'utf8'));
 tempLedger.games.push(...fixture.games);
 fs.writeFileSync(path.join(temp,ledgerPath),JSON.stringify(tempLedger));
 fixture.status='IMPORTED';
 fs.writeFileSync(fixturePath,JSON.stringify(fixture));
 verified=verify();
 if(verified.status!==0||!verified.stdout.includes('WEEKLY CANDIDATE PASS'))throw Error('Imported synthetic candidate rejected: '+verified.stderr);
 const importedGame=tempLedger.games.find(g=>g.year===2026&&g.week===nextWeek);
 importedGame.homeScore+=1;
 fs.writeFileSync(path.join(temp,ledgerPath),JSON.stringify(tempLedger));
 const tampered=verify();
 if(tampered.status===0)throw Error('Imported matchup score drift was not rejected');
 const after=sourceFiles.map(hash);
 if(after.some((h,i)=>h!==before[i]))throw Error('Dry-run mutated canonical source files');
 if(!fs.existsSync(fixturePath))throw Error('Synthetic fixture unexpectedly missing');
 console.log('WEEKLY IMPORT REHEARSAL PASS: isolated synthetic Week '+nextWeek+', approved dry-run validated; real candidate and canonical files unchanged');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
