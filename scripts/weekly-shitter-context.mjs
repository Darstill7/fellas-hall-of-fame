const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const pct=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100;
export function buildEditorialContext(packet,ledger,race,trades){
 const {week,scoring}=packet;
 const historical=ledger.games.filter(g=>g.stage==='regular'&&g.year>=2020&&(g.year<2026||g.year===2026&&g.week<=week));
 const comparisons=scoring.map(s=>{
  const prior=historical.filter(g=>g.year<2026||g.week<week).flatMap(g=>g.home===s.manager?[{year:g.year,week:g.week,pf:cents(g.homeScore),pa:cents(g.awayScore),opponent:g.away}]:g.away===s.manager?[{year:g.year,week:g.week,pf:cents(g.awayScore),pa:cents(g.homeScore),opponent:g.home}]:[]);
  const meetings=prior.filter(g=>g.opponent===s.opponent);
  const best=prior.length?Math.max(...prior.map(g=>g.pf)):null,worst=prior.length?Math.min(...prior.map(g=>g.pf)):null;
  return {manager:s.manager,priorGames:prior.length,priorHigh:best,priorLow:worst,newPersonalHigh:best!==null&&s.pf>best,newPersonalLow:worst!==null&&s.pf<worst,priorOpponentRecord:{w:meetings.filter(g=>g.pf>g.pa).length,l:meetings.filter(g=>g.pf<g.pa).length,t:meetings.filter(g=>g.pf===g.pa).length},priorOpponentMeetings:meetings.length,scope:'Archived Sleeper-era regular season, before current week'};
 });
 let playoffs={status:'UNAVAILABLE_OR_STALE',verifiedThrough:race?.verified_through_week??null};
 if(race?.verified_through_week===week&&race.playoff_format?.teams===6&&race.playoff_format?.first_round_byes===2){
  const rows=Object.entries(race.scenarios?.['6']??{}).map(([name,r])=>({manager:norm(name),playoffPct:r.playoff_pct,byePct:r.top2_pct}));
  const teamRows=Object.entries(race.teams??{});
  if(rows.length===10&&new Set(rows.map(r=>r.manager)).size===10&&teamRows.length===10&&new Set(teamRows.map(([n])=>norm(n))).size===10&&rows.every(r=>scoring.some(s=>s.manager===r.manager)&&pct(r.playoffPct)&&pct(r.byePct)&&r.byePct<=r.playoffPct)&&teamRows.every(([n,t])=>{const s=scoring.find(x=>x.manager===norm(n))?.season;return s&&t.w===s.w&&t.l===s.l&&cents(t.pf)===s.pf&&cents(t.pa)===s.pa})){
   playoffs={status:'SAME_CUTOFF_SIMULATION',verifiedThrough:week,method:race.method,caution:race.caution,rows};
  }
 }
 const receipts=Array.isArray(trades)?trades.filter(t=>t.year===2026&&Number.isInteger(t.week)&&t.week<=week):[];
 const transactionThrough=receipts.length?Math.max(...receipts.map(t=>t.week)):null;
 const scored=receipts.filter(t=>t.scoring_through_week===week);
 return {comparisons,playoffs,tradeArchive:{status:'ARCHIVE_ONLY_NOT_COMPLETE_SOURCE',latestArchivedTransactionWeek:transactionThrough,archivedReceipts:receipts.map(t=>({id:t.id,week:t.week,sides:t.sides?.map(s=>({manager:norm(s.manager),assets:s.assets})),scoringThrough:t.scoring_through_week??null})),sameCutoffScoringReceiptCount:scored.length,caution:'Latest archived transaction week does not certify complete source coverage. Never infer current trade grades or starter returns from stale receipts.'}};
}
