// Verify aggregate ESPN postseason rounds against original archived weekly scoring receipts.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const espn=read('data/espn_history_2016_2019.json');
const explorer=read('data/playoff_explorer_verified_2016_2025_v1.json');
const ledger=read('data/unified_record_book_2016_2026.json');
const cents=n=>Math.round(n*100);
let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
const rounds=[];
for(const s of espn.seasons.filter(s=>s.year<=2017)){
 const names=new Map(s.teams.map(t=>[t.id,t.manager]));
 const seen=new Set();
 for(const g of s.games.filter(g=>g.stage!=='NONE')){
  const home=names.get(g.home),away=names.get(g.away);
  const weeks=Object.keys(g.homeWeeks).map(Number).sort((a,b)=>a-b);
  eq(weeks.length,2,'two-week round');eq(Object.keys(g.awayWeeks).map(Number).sort((a,b)=>a-b),weeks,'same weeks');
  eq(g.homeAdjustment,0,'no carryover');eq(g.awayAdjustment,0,'no carryover');
  eq(Object.values(g.homeWeeks).reduce((a,b)=>a+cents(b),0),cents(g.hs),'home sum');
  eq(Object.values(g.awayWeeks).reduce((a,b)=>a+cents(b),0),cents(g.as),'away sum');
  for(const name of [home,away])for(const w of weeks){const key=name+':'+w;eq(seen.has(key),false,'no duplicate weekly scoring');seen.add(key);}
  const matches=ledger.games.filter(r=>r.year===s.year&&r.week===g.period&&r.home===home&&r.away===away);
  eq(matches.length,1,'one recorded round');const r=matches[0];
  eq(r.twoWeekAggregate,true,'aggregate marker');eq(r.weeksCovered,weeks,'calendar weeks');
  eq(cents(r.homeScore),cents(g.hs),'round home score');eq(cents(r.awayScore),cents(g.as),'round away score');
  eq(r.stage,g.stage==='WINNERS_BRACKET'?'championship_bracket':'consolation','stage');
  if(g.stage==='WINNERS_BRACKET'){
   const e=explorer.seasons.find(x=>x.year===s.year).matches.filter(x=>x.home===home&&x.away===away&&x.week===g.period);
   eq(e.length,1,'verified bracket match');eq(e[0].aggregate,true,'bracket aggregate');eq(e[0].weeksCovered,weeks,'bracket calendar weeks');eq(cents(e[0].homeScore),cents(g.hs));eq(cents(e[0].awayScore),cents(g.as));
  }
  rounds.push({year:s.year,matchup_period:g.period,weeks,stage:r.stage,home,away,home_round_cents:cents(g.hs),away_round_cents:cents(g.as),weekly:weeks.map(w=>({week:w,home_cents:cents(g.homeWeeks[w]),away_cents:cents(g.awayWeeks[w])}))});
 }
}
eq(rounds.length,18,'all two-week rounds');eq(rounds.filter(r=>r.stage==='championship_bracket').length,6,'championship rounds');
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/espn-two-week-postseason-receipts.json',JSON.stringify({status:'RESEARCH_ONLY',rounds},null,2)+'\n');
console.log('ESPN TWO WEEK POSTSEASON PASS '+JSON.stringify({checks,rounds:rounds.length,weekly_matchup_segments:rounds.length*2,championship_rounds:6}));
