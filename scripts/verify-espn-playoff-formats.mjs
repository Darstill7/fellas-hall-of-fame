// Verify original ESPN playoff screenshots against source snapshots and the
// published ledger. Two-week brackets and three-week running ladders are
// different scoring formats: NEVER count 2019 cumulative ladder values as a
// single-week or standalone postseason matchup scoring record.
import fs from 'node:fs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=load('data/espn_history_2016_2019.json');
const ledger=load('data/unified_record_book_2016_2026.json');
const projected=load('data/season_weekly_matchups_2016_2026_v1.json');
const book=load('data/manager_record_books_2016_2026.json');
const endings=load('data/manager_verified_season_endings_v1.json');
const evidence=load('data-integrity/ESPN_PLAYOFF_FORMAT_EVIDENCE_2016_2019.json');
const punishment=load('data/espn_shitter_of_the_year_2016_2019.json');
const problems=[];
const check=(ok,message)=>{if(!ok)problems.push(message)};
const arraysEqual=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const near=(a,b)=>Math.abs(a-b)<.011;
const teams=year=>source.seasons.find(x=>x.year===year)?.teams||[];
const games=year=>source.seasons.find(x=>x.year===year)?.games||[];
const mapping=(year,id)=>teams(year).find(t=>t.id===id)?.manager;
const rank=(year,name)=>teams(year).find(t=>t.manager===name)?.finalRank;
check(teams(2016).length===8,'2016 must have eight original ESPN managers');
for(const year of [2017,2018,2019])check(teams(year).length===10,year+' must have ten original ESPN managers');
for(const [year,periodWeeks] of [[2016,[[14,[14,15]],[15,[16,17]]]],[2017,[[13,[13,14]],[14,[15,16]]]]]){
 const expected=new Map(periodWeeks);
 for(const game of games(year).filter(g=>g.stage!=='NONE')){
  const weeks=expected.get(game.period);
  check(!!weeks,year+' postseason unexpected ESPN period '+game.period);
  if(!weeks)continue;
  check(arraysEqual(Object.keys(game.homeWeeks).map(Number),weeks)&&
   arraysEqual(Object.keys(game.awayWeeks).map(Number),weeks),
   year+' period '+game.period+' is not exactly a two-NFL-week matchup');
  check(near(Object.values(game.homeWeeks).reduce((a,b)=>a+b,0)+game.homeAdjustment,game.hs)&&
   near(Object.values(game.awayWeeks).reduce((a,b)=>a+b,0)+game.awayAdjustment,game.as),
   year+' period '+game.period+' two-week totals mismatch source components');
 }
}
check(rank(2016,'Thommy')===1&&rank(2016,'Halderman')===2,'2016 champion/runner-up incorrect');
check(rank(2017,'Thommy')===1&&rank(2017,'Schermerhorn')===2,'2017 final must not merge Thommy and Schermerhorn');
const final17=games(2017).find(g=>g.stage==='WINNERS_BRACKET'&&g.period===14&&mapping(2017,g.home)==='Thommy');
check(final17?.hs===241&&final17?.as===212&&
 final17?.homeWeeks?.[15]===126&&final17?.homeWeeks?.[16]===115,
 '2017 Thommy 241 points must be 126 + 115 over NFL Weeks 15–16');
check(rank(2018,'Stilly')===10&&rank(2018,'Koble')===9,'2018 Stilly last-place placement not corroborated');
check(rank(2019,'Birch')===1&&rank(2019,'Stew')===2,'2019 winner bracket championship lost');
check(rank(2019,'Evans')===10&&rank(2019,'Stover')===9&&rank(2019,'Thommy')===8&&rank(2019,'Koble')===7,
 '2019 bottom-four official placement differs from cumulative ladder screenshots');
check(teams(2019).find(t=>t.manager==='Evans')?.name?.replace(/\s+/g,' ').trim()==='I Love Tubing',
 '2019 I Love Tubing owner must be Evans, not Stew');
check(teams(2019).find(t=>t.manager==='Stew')?.name?.replace(/\s+/g,' ').trim()==='Kickers SUCK',
 '2019 Stew must map to the championship runner-up Kickers SUCK');
const cumulative=ledger.games.filter(g=>g.year===2019&&g.cumulativeScoring);
check(cumulative.length===6,'2019 cumulative consolation ladder must contain six tracked pairings');
for(const game of cumulative){
 const weeks=Array.from({length:game.week-13},(_,i)=>14+i);
 check(game.stage==='consolation'&&game.scoreAggregation==='running_three_week_consolation_total'&&
  arraysEqual(game.weeksCovered,weeks),
  '2019 cumulative score scope wrong: '+game.home+'/'+game.away+' round '+game.week);
 const original=games(2019).find(g=>g.stage==='LOSERS_CONSOLATION_LADDER'&&g.period===game.week&&
  mapping(2019,g.home)===game.home&&mapping(2019,g.away)===game.away);
 check(!!original&&near(original.hs,game.homeScore)&&near(original.as,game.awayScore),
  '2019 cumulative score does not match original ESPN fixture');
 if(original&&game.week>14)check(original.homeAdjustment>0&&original.awayAdjustment>0,
  '2019 running score must contain earlier-week carry-forward');
}
for(const g of cumulative){
 const match=projected.bySeason['2019']?.games?.find(x=>x.week===g.week&&x.stage===g.stage&&x.home===g.home&&x.away===g.away);
 check(!!match&&match.cumulativeScoring===true&&
  match.scoreAggregation==='running_three_week_consolation_total'&&
  arraysEqual(match.weeksCovered,g.weeksCovered),
  'Published weekly-matchup view loses 2019 cumulative score scope: '+g.home+' vs '+g.away);
}
const finalCumulative=new Map(evidence.seasons['2019'].consolation.finalCumulativeRankings.map(r=>[r.manager,r]));
for(const [name,total] of [['Koble',366.6],['Thommy',358.3],['Stover',328.56],['Evans',264.76]]){
 const row=finalCumulative.get(name);
 check(row?.threeWeekPoints===total&&row.finish===rank(2019,name),
  '2019 three-week cumulative ladder placement/score differs for '+name);
}
for(const [manager,rows] of Object.entries(endings.managers)){
 for(const entry of rows.filter(e=>e.year<=2019)){
  check(entry.finalRank===rank(entry.year,manager),'ESPN final placement absent or wrong for '+manager+' '+entry.year);
  check(entry.ending!=='Finish not certified','Recoverable ESPN finishing position still omitted: '+manager+' '+entry.year);
 }
}
// Punishment was based on the *lowest scoring team* in the final round of
// the losers' consolation ladder, not the original ESPN final finishing rank.
// Do not mix in the winners' consolation side; it is a different ladder.
check(punishment.identity?.year2019I_Love_Tubing==='Evans'&&
 punishment.identity?.year2019StewTeam==='Kickers SUCK'&&
 punishment.identity?.confirmedByUser===true,
 'User-confirmed 2019 Evans / Stew historical team ownership missing');
check(evidence.seasons['2019'].consolation.userConfirmedOwnership===true &&
 evidence.shitterOfYearRule?.userConfirmed==='Lowest scoring team in final consolation round',
 'User-confirmed ownership and Shitter award rule not recorded in bracket audit');
const expectedShitters={2016:['Stilly',165],2017:['Halderman',96],2018:['Stilly',86.76],2019:['Evans',80.46]};
for(const [yearText,[expectedWinner,expectedScore]] of Object.entries(expectedShitters)){
 const year=Number(yearText),yearGames=games(year);
 const loserGames=yearGames.filter(g=>g.stage==='LOSERS_CONSOLATION_LADDER');
 const finalPeriod=Math.max(...loserGames.map(g=>g.period));
 const finals=loserGames.filter(g=>g.period===finalPeriod);
 const candidates=finals.flatMap(g=>[{
  manager:mapping(year,g.home),total:g.hs,actualWeek:g.homeWeeks?.[16],scoreWeeks:g.homeWeeks
 },{
  manager:mapping(year,g.away),total:g.as,actualWeek:g.awayWeeks?.[16],scoreWeeks:g.awayWeeks
 }]);
 const scoringCandidates=candidates.map(c=>({
  ...c,score:year===2019?c.actualWeek:c.total
 })).sort((a,b)=>a.score-b.score);
 const lowest=scoringCandidates[0],award=punishment.seasons[yearText];
 check(!!award&&lowest.manager===expectedWinner&&near(lowest.score,expectedScore),
  year+' last-round low scorer differs from original ESPN fixture');
 check(award?.awardWinner===lowest.manager&&near(award?.awardWinningScore,lowest.score)&&
  award?.officialFinish===rank(year,lowest.manager)&&
  award?.lowScoreEntrants?.length===candidates.length,
  year+' Shitter award differs from final losers-ladder scores, ranks or participants');
 if(year===2019)check(award.measurement.winnerFinalRoundTotal===264.76&&
  award.measurement.winnerActualFinalWeekPoints===80.46&&
  rank(year,'Evans')===10,
  '2019 award must distinguish actual Week 16 low score from three-week cumulative total');
 const current=Object.entries(endings.managers).flatMap(([manager,rows])=>
  rows.filter(row=>row.year===year&&row.awards?.includes('Shitter of the Year'))
   .map(row=>manager));
 check(arraysEqual(current,lowest.manager in endings.managers?[lowest.manager]:[]),
  year+' current-manager Shitter award badges differ from original ESPN loser ladder');
}
check(rank(2016,'Stilly')===6&&rank(2016,'Schermerhorn')===8 &&
 rank(2017,'Halderman')===6&&rank(2017,'Birch')===10,
 'Historical Shitter winners must remain distinct from official last-place standings');
const disallowed=g=>g.cumulativeScoring&&g.weeksCovered?.length>1;
for(const person of book.managers){
 const saved=person.postseason?.bestScoringMatchup;
 const possible=ledger.games.filter(g=>g.stage!=='regular'&&!disallowed(g)&&
  (g.home===person.manager||g.away===person.manager)).map(g=>({
   game:g,points:g.home===person.manager?g.homeScore:g.awayScore
  }));
 const max=Math.max(...possible.map(g=>g.points));
 check(!!saved&&near(saved.points,max)&&!disallowed(saved),
  'Cumulative 2019 ladder score incorrectly listed as '+person.manager+' best postseason matchup');
}
if(problems.length){
 console.error('ESPN bracket format audit FAILED ('+problems.length+')');
 for(const error of problems)console.error(' - '+error);
 process.exitCode=1;
}else{
 console.log('ESPN bracket format audit PASS: historic brackets, user-confirmed 2019 ownership, four lowest-score Shitter awards, final ranks and postseason scoring records.');
}
