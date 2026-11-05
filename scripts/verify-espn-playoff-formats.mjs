// Verify original ESPN playoff screenshots against source snapshots and the
// published ledger. Two-week brackets and three-week running ladders are
// different scoring formats: NEVER count 2019 cumulative ladder values as a
// single-week or standalone postseason matchup scoring record.
import fs from 'node:fs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=load('data/espn_history_2016_2019.json');
const ledger=load('data/unified_record_book_2016_2026.json');
const book=load('data/manager_record_books_2016_2026.json');
const endings=load('data/manager_verified_season_endings_v1.json');
const evidence=load('data-integrity/ESPN_PLAYOFF_FORMAT_EVIDENCE_2016_2019.json');
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
 console.log('ESPN bracket format audit PASS: 2016–2019 two-week rounds, 2019 cumulative ladder, final placements, canonical identity and postseason scoring records.');
}
