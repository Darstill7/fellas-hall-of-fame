// Research-only validation. Run: node scripts/verify-postseason-record-research.mjs
// This script does not publish records; it checks every derived receipt against canonical data.
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const source=read('data/season_weekly_matchups_2016_2026_v1.json');
const brackets=[...read('data/verified_espn_playoff_brackets_2016_2019.json').seasons,
 ...read('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons];
const research=read('data/postseason_winners_bracket_record_receipts_2016_2025_v1.json');
if(research.recoveredGames!==41||research.completeFinals!==10||research.receipts.length!==41)
 throw Error('Historical recovered winner-bracket count changed; re-audit before revising source receipts.');
const key=r=>[r.year,r.week,r.round,r.winner,r.loser].join('|');
if(new Set(research.receipts.map(key)).size!==41)throw Error('Duplicate postseason receipt');
const official=(b,g)=>{
 const year=b.year,pair=[g.home,g.away],finalWeek=year>=2022?17:year>=2018?16:null,
  semifinalWeek=year>=2022?16:year>=2018?15:null,
  openingWeek=year>=2022?15:year>=2018?14:null;
 if(year<=2017){
  if(pair.every(x=>b.finalists.includes(x)))return 'final';
  if(pair.every(x=>b.semifinalists.includes(x)))return 'semifinal';
  return null;
 }
 if(g.week===finalWeek&&pair.every(x=>b.finalists.includes(x)))return 'final';
 if(g.week===semifinalWeek&&pair.every(x=>b.semifinalists.includes(x)))return 'semifinal';
 if(g.week===openingWeek&&pair.every(x=>(b.seeds||b.participants).includes(x))&&
    !pair.some(x=>(b.byes||[]).includes(x)))return 'opening';
 return null;
};
for(const r of research.receipts){
 const bracket=brackets.find(x=>x.year===r.year);
 if(!bracket)throw Error('No verified bracket '+r.year);
 const games=source.bySeason[String(r.year)]?.games||[];
 const candidates=games.filter(g=>g.week===r.week&&
  ((g.home===r.winner&&g.away===r.loser)||(g.home===r.loser&&g.away===r.winner))&&
  g.stage!=='regular'&&g.stage!=='consolation'&&official(bracket,g)===r.round);
 if(candidates.length!==1)throw Error('Ambiguous or missing winner-bracket source '+key(r));
 const game=candidates[0],winner=game.winner==='HOME'?game.home:game.away,
  winnerPoints=winner===game.home?game.homeScore:game.awayScore,
  loserPoints=winner===game.home?game.awayScore:game.homeScore;
 if(winner!==r.winner||Math.abs(winnerPoints-r.winnerPoints)>0.005||
    Math.abs(loserPoints-r.loserPoints)>0.005||Math.abs(game.margin-r.margin)>0.005||
    !!game.twoWeekAggregate!==r.twoWeekAggregate)
  throw Error('Playoff result or scoring scope drift '+key(r));
 if((r.year<=2017)!==r.twoWeekAggregate)throw Error('ESPN scoring-era attribution invalid '+key(r));
}
const finals=research.receipts.filter(r=>r.round==='final');
for(const b of brackets){
 const rows=finals.filter(x=>x.year===b.year);
 if(rows.length!==1||rows[0].winner!==b.champion)
  throw Error('Wrong final, champion or count '+b.year);
}
const single=research.receipts.filter(r=>!r.twoWeekAggregate);
const nearest=single.slice().sort((a,b)=>a.margin-b.margin)[0];
if(nearest.year!==2025||nearest.winner!=='Birch'||nearest.loser!=='Tony'||nearest.margin!==0.72)
 throw Error('Closest championship-bracket result changed without audit');
if(research.receipts.some(r=>r.year===2025&&[r.winner,r.loser].includes('Stilly')&&
 [r.winner,r.loser].includes('Kuhl')))throw Error('Consolation game misclassified as a title-bracket result');
if(research.managerHighlights.length!==10||
 research.managerHighlights.some(row=>row.recoveredBracketGames!==
 research.receipts.filter(r=>r.winner===row.manager||r.loser===row.manager).length))
 throw Error('Manager recovered playoff counts out of sync');
console.log('POSTSEASON RECORD RESEARCH VERIFIED: 41 recoverable title-bracket scores, ten title finals, no consolation contamination.');
