// Research-only observed acquired starter production in verified championship fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const bracket=JSON.parse(fs.readFileSync('data/playoff_explorer_verified_2016_2025_v1.json','utf8'));
const normalize=n=>({Thommy:'Tom',Evans:'EvansBrandon'}[n]||n);
const round=n=>Math.round(n*100)/100;
const years=[2020,2021,2022,2023,2024,2025],receipts=[],excluded=[],seen=new Set(),games=[];
for(const year of years){
 const b=bracket.seasons.find(s=>s.year===year);
 assert(b&&b.matches.length===5);
 const report=JSON.parse(fs.readFileSync(dir+'/'+year+'-ownership-review.json','utf8'));
 assert.equal(report.season,year);assert.equal(report.regular_lineup_source_differences.length,0);
 const index=new Map();
 for(const m of b.matches){
  assert.equal(m.weeksCovered.length,1);const week=m.weeksCovered[0];
  assert(week>report.regular_season_end);
  const winner=normalize(m.winner),home=normalize(m.home),away=normalize(m.away);
  assert([home,away].includes(winner));
  for(const [manager,opponent,score,opponentScore] of [[home,away,m.homeScore,m.awayScore],[away,home,m.awayScore,m.homeScore]]){
   const key=manager+':'+week;assert(!index.has(key));
   index.set(key,{year,week,round:m.round,manager,opponent,score,opponentScore,won:manager===winner,champion:manager===normalize(b.champion)});
  }
 }
 for(const t of report.trade_results)for(const s of t.sides)for(const p of s.players)for(const r of p.receipts){
  if(r.week<=report.regular_season_end)continue;
  const key=[year,r.week,s.roster,p.player_id].join(':');assert(!seen.has(key));seen.add(key);
  const base={year,week:r.week,manager:s.manager,player_id:p.player_id,player:p.observed_player_name,trade_id:t.id,points:r.points};
  const game=index.get(s.manager+':'+r.week);
  if(!game){excluded.push({...base,classification:'NOT_VERIFIED_WINNERS_BRACKET_FIXTURE'});continue;}
  receipts.push({...base,...game});
 }
 for(const game of index.values()){
  const players=receipts.filter(r=>r.year===year&&r.week===game.week&&r.manager===game.manager);
  const pf=round(players.reduce((n,r)=>n+r.points,0));
  games.push({...game,acquired_starter_pf:pf,acquired_starts:players.length,players});
 }
}
assert.equal(games.length,60);
const champions=years.map(year=>{
 const titleGames=games.filter(g=>g.year===year&&g.champion);
 const final=titleGames.find(g=>g.round==='final');assert(final&&final.won);
 return {year,manager:final.manager,championship_run_pf:round(titleGames.reduce((n,g)=>n+g.acquired_starter_pf,0)),final_pf:final.acquired_starter_pf,final_starters:final.players,rounds:titleGames};
});
const coverage={fixtures:games.length/2,team_games:games.length,credited_bracket_starts:receipts.length,nonbracket_calendar_starts:excluded.length,bracket_pf:round(receipts.reduce((n,r)=>n+r.points,0)),nonbracket_pf:round(excluded.reduce((n,r)=>n+r.points,0))};
const output={status:'RESEARCH_ONLY_OBSERVED_PLAYOFF_PRODUCTION_NOT_CAUSAL_WINS',coverage,champions,games,excluded,limitations:['Only actual verified winners-bracket fixtures','Bye weeks, consolation and unclassified calendar starts excluded','Transaction-boundary starts remain excluded','Observed production does not establish a counterfactual win or replacement value']};
fs.writeFileSync(dir+'/trade-playoff-impact-research.json',JSON.stringify(output,null,2)+'\n');
console.log('TRADE PLAYOFF COVERAGE '+JSON.stringify(coverage));
console.log('CHAMPIONSHIP TRADE RETURNS '+JSON.stringify(champions.map(({rounds,final_starters,...c})=>({...c,final_starters:final_starters.map(p=>({player:p.player,points:p.points,trade_id:p.trade_id}))}))));
