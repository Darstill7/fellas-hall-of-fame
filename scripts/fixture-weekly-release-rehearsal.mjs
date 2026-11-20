// Nonpublishing end-to-end rehearsal fixture. Never represents real NFL or fantasy scores.
// Creates five synthetic next-week matchups from the archived future fixtures, for CI only.
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const race=JSON.parse(fs.readFileSync('data/playoff_race_v1.json','utf8'));
const last=Math.max(0,...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
const next=last+1;
if(next>14)throw Error('No remaining regular-season week for rehearsal');
const fixtures=race.fixtures[String(next)];
if(!Array.isArray(fixtures)||fixtures.length!==5)throw Error('No verified next-week fixture schedule for rehearsal Week '+next);
const canonical=n=>n==='Tom'?'Thommy':n;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const games=fixtures.map(([home,away],i)=>{
 const homeScore=round(101.11+i*6.21),awayScore=round(94.78+i*3.32);
 return {year:2026,week:next,home:canonical(home),away:canonical(away),homeScore,awayScore,
  winner:'HOME',margin:round(homeScore-awayScore),stage:'regular',era:'Sleeper',
  source:'SYNTHETIC_CI_TEST_DO_NOT_PUBLISH'};
});
const participantSet=new Set(games.flatMap(g=>[g.home,g.away]));
if(participantSet.size!==10||games.length!==5)throw Error('Rehearsal did not produce all 10 teams');
const out='data-integrity/sleeper-sync-candidates/2026-week'+next+'.json';
fs.mkdirSync('data-integrity/sleeper-sync-candidates',{recursive:true});
if(fs.existsSync(out))throw Error('Refusing to overwrite a real staged candidate '+out);
fs.writeFileSync(out,JSON.stringify({
 status:'REVIEW_REQUIRED',league:'1340027406009761792',year:2026,week:next,
 source:'SYNTHETIC_CI_TEST_DO_NOT_PUBLISH',matchupCount:5,
 reason:'Synthetic rehearsal only, never actual league score evidence',games
},null,2)+'\n');
console.log('SYNTHETIC REHEARSAL ONLY: '+out+' — no real scores, no publication');
