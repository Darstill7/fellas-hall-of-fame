// Independent synthetic regression tests for descriptive draft-return analytics.
import assert from 'node:assert/strict';
import {gradeDraftReturns} from './lib/draft-return-grades.mjs';
import {draftSlotAlternatives} from './lib/draft-slot-alternatives.mjs';
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
const ledger=[],supported={};
function add(year,roster,pick,round,pf,category='DRAFT',position='RB'){
 const a={year,roster,manager:'M'+roster,id:'draft:'+year+':'+pick,player_id:String(pick),name:'P'+pick,position,category,cost:{round,pick},regular_pf_cents:pf};
 ledger.push(a);supported[[year,roster,a.player_id,a.id].join(':')]={strict_pf_cents:pf,supported_pf_cents:pf};return a;
}
for(let r=1;r<=8;r++)for(let i=1;i<=6;i++)add(2025,i,(r-1)*6+i,r,(i-1)*1000);
add(2025,1,49,9,8000,'ARCHIVED_KEEPER');
add(2025,2,50,9,5000,'DRAFT_KEEPER_UNKNOWN');
for(let i=1;i<=6;i++)add(2025,i,50+i,10,i*1000);
const g=gradeDraftReturns(ledger,supported);
eq(g.picks.length,54);eq(g.excluded.length,2);
eq(g.picks.find(x=>x.round===1&&x.manager==='M1').grade,'F');
eq(g.picks.find(x=>x.round===1&&x.manager==='M6').grade,'A+');
eq(g.picks.find(x=>x.round===1&&x.manager==='M1').supported_pf_cents,0);
eq(g.reportCards.length,6);eq(g.records.best[0].manager,'M6');eq(g.records.worst[0].manager,'M1');
eq(g.reportCards.reduce((n,r)=>n+r.total_picks,0),56);
const slots=draftSlotAlternatives(ledger,supported);
const keeper=slots.results.find(r=>r.category==='ARCHIVED_KEEPER');
eq(keeper.ordinary_alternatives.count,6);eq(keeper.ordinary_alternatives.best_later_selection.pick,56);
eq(keeper.ordinary_alternatives.observed_surplus_cents,4500);
eq(slots.excluded.length,1);
eq(slots.results.find(r=>r.pick===56).ordinary_alternatives,null);
const broken=structuredClone(supported);broken[Object.keys(broken)[1]].strict_pf_cents++;
assert.throws(()=>gradeDraftReturns(ledger,broken));checks++;
console.log('DRAFT ANALYTICS REGRESSION PASS '+JSON.stringify({checks}));
