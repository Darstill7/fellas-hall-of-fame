// Independent read-only verification of the archived Week 14 migration baseline.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const ledger=read('unified_record_book_2016_2026.json');
const projection=read('corrected_2020_2021_regular_standings_projection_v1.json');
const receipts=read('provider_week14_2020_2021_pairing_recovery_v1.json');
const cents=x=>{assert(Number.isFinite(x));return Math.round(x*100)};
const norm=n=>n==='Tom'?'Thommy':n;
let checks=0;
const check=(a,b,label)=>{assert.equal(a,b,label);checks++};
for(const year of [2020,2021]){
 const p=projection.years.find(x=>x.year===year);
 const e=receipts.years.find(x=>x.year===year);
 const regular=ledger.games.filter(g=>g.year===year&&g.week<=13&&g.stage==='regular');
 const week14=ledger.games.filter(g=>g.year===year&&g.week===14);
 check(regular.length,65,year+' regular games');
 check(week14.length,4,year+' week14 paired games');
 check(p.rows.length,10,year+' projected managers');
 check(new Set(p.rows.map(r=>norm(r.manager))).size,10,year+' distinct managers');
 check(e.pairs.length,4,year+' provider pair count');
 const seen=new Set();
 for(const q of e.pairs){
  const matches=week14.filter(g=>norm(g.home)===norm(q.home)&&norm(g.away)===norm(q.away)||norm(g.home)===norm(q.away)&&norm(g.away)===norm(q.home));
  check(matches.length,1,year+' '+q.home+' pairing');
  const g=matches[0],home=norm(g.home)===norm(q.home);
  assert(!seen.has(g),'Duplicate receipt');seen.add(g);
  check(cents(home?g.homeScore:g.awayScore),cents(q.homeScore),q.home+' score');
  check(cents(home?g.awayScore:g.homeScore),cents(q.awayScore),q.away+' score');
 }
 const players=new Set(week14.flatMap(g=>[norm(g.home),norm(g.away)]));
 check(players.size,8,year+' paired participants');
 check(e.byes.length,2,year+' provider byes');
 check(new Set(e.byes.map(b=>norm(b.manager))).size,2,year+' distinct byes');
 for(const b of e.byes)check(players.has(norm(b.manager)),false,year+' bye excluded');
 const actualManagers=new Set(regular.flatMap(g=>[norm(g.home),norm(g.away)]));
 check(actualManagers.size,10,year+' regular manager count');
 for(const row of p.rows){
  const manager=norm(row.manager);
  const s={games:0,w:0,l:0,t:0,pf:0,pa:0},weeks=new Set();
  for(const g of regular){
   if(norm(g.home)!==manager&&norm(g.away)!==manager)continue;
   assert(!weeks.has(g.week),year+' duplicate manager week '+manager);weeks.add(g.week);
   const home=norm(g.home)===manager,a=cents(home?g.homeScore:g.awayScore),b=cents(home?g.awayScore:g.homeScore);
   s.games++;s.w+=Number(a>b);s.l+=Number(a<b);s.t+=Number(a===b);s.pf+=a;s.pa+=b;
  }
  check(weeks.size,13,year+' '+manager+' week coverage');
  for(const k of Object.keys(s))check(s[k],['pf','pa'].includes(k)?cents(row.corrected[k]):row.corrected[k],year+' '+manager+' '+k);
 }
}
console.log('PASS '+checks+' archive comparisons; no provider PF or exact consolation classification certification implied.');
