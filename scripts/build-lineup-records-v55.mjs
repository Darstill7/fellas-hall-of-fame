// Hindsight only: no pre-lock eligibility or decision grade is implied.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const ledger=read('data/unified_record_book_2016_2026.json');
const games=new Map();
for(const g of ledger.games.filter(g=>g.stage==='regular'&&g.year>=2020&&g.year<=2025)){
 for(const [m,p,o,q] of [[g.home,g.homeScore,g.away,g.awayScore],[g.away,g.awayScore,g.home,g.homeScore]]){
  const k=[g.year,g.week,norm(m)].join(':');assert.ok(!games.has(k));games.set(k,{actual:cents(p),against:cents(q),opponent:norm(o)});
 }
}
const accepted=[],excluded=[],seen=new Set();
for(let year=2020;year<=2025;year++){
 const d=read('data-integrity/lineup-audit-staging-'+year+'.json');assert.equal(d.year,year);
 for(const x of d.rows){
  const manager=year===2023&&x.manager==='JMid'?'Evans':norm(x.manager),key=[year,x.week,manager].join(':');assert.ok(!seen.has(key));seen.add(key);
  const g=games.get(key);
  if(!g||![x.actual,x.optimal,x.gap,x.accuracy].every(Number.isFinite)||cents(x.actual)!==g.actual||cents(x.optimal)-cents(x.actual)!==cents(x.gap)||x.optimal<=0||x.gap<0){excluded.push({year,week:x.week,manager,reason:x.reason||(!g?'No paired canonical regular-season score':'Missing or unreconciled lineup result')});continue;}
  assert.ok(Math.abs(100*x.actual/x.optimal-x.accuracy)<.001);
  accepted.push({year,week:x.week,manager,actual:g.actual,optimal:cents(x.optimal),gap:cents(x.gap),accuracyBasisPoints:Math.round(x.actual/x.optimal*10000),against:g.against,opponent:g.opponent,optimalLineup:cents(x.gap)===0?1:0,correctableLoss:g.actual<g.against&&cents(x.optimal)>g.against?1:0});
 }
}
assert.equal(seen.size,830);
const records=[],scope='Reconciled paired Sleeper regular-season lineup observations 2020–2025; nine-slot recorded-roster hindsight optimum';
const qualification='Ex-post observed roster only; not certified pre-lock eligibility, causal loss attribution or decision skill';
const source='data-integrity/lineup-audit-staging-{year}.json + data/unified_record_book_2016_2026.json';
const add=(id,label,rows,key,dir,unit,extra='')=>{
 assert.ok(rows.length,id);assert.ok(rows.every(x=>Number.isFinite(x[key])));
 const mark=Math[dir](...rows.map(x=>x[key])),evidence=rows.filter(x=>x[key]===mark);
 records.push({id,label,value:['pts','%'].includes(unit)?mark/100:mark,unit,scope,qualification:qualification+'; '+extra,source,holders:[...new Set(evidence.map(x=>x.manager))].sort().map(manager=>({manager,evidence:evidence.filter(x=>x.manager===manager)}))});
};
add('lineup-week-gap-max','Largest single-week observed lineup optimization gap',accepted,'gap','max','pts');
add('lineup-week-efficiency-min','Lowest single-week observed lineup efficiency',accepted,'accuracyBasisPoints','min','%');
add('lineup-week-optimum-max','Highest single-week hypothetical roster lineup score',accepted,'optimal','max','pts');
add('lineup-loss-gap-max','Largest observed lineup optimization gap in a loss',accepted.filter(x=>x.actual<x.against),'gap','max','pts');
const grouped=(key)=>{const map=new Map();for(const r of accepted){const k=key(r);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map.values()].map(a=>({manager:a[0].manager,year:key(a[0]).includes(':')?a[0].year:undefined,weeks:a.length,gap:a.reduce((s,x)=>s+x.gap,0),meanGap:Math.round(a.reduce((s,x)=>s+x.gap,0)/a.length),meanEfficiency:Math.round(a.reduce((s,x)=>s+x.accuracyBasisPoints,0)/a.length),optimalLineups:a.reduce((s,x)=>s+x.optimalLineup,0),correctableLosses:a.reduce((s,x)=>s+x.correctableLoss,0)}));};
const seasons=grouped(r=>r.year+':'+r.manager).filter(r=>r.weeks>=12);
const careers=grouped(r=>r.manager).filter(r=>r.weeks>=50);
for(const [scopeKey,rows,min] of [['season',seasons,12],['career',careers,50]]){
 for(const dir of ['max','min']){
  const word=dir==='max'?'Highest':'Lowest';
  add('lineup-'+scopeKey+'-mean-gap-'+dir,word+' observed '+scopeKey+' average lineup optimization gap',rows,'meanGap',dir,'pts','Minimum '+min+' reconciled weeks');
  add('lineup-'+scopeKey+'-efficiency-'+dir,word+' observed '+scopeKey+' average lineup efficiency',rows,'meanEfficiency',dir,'%','Minimum '+min+' reconciled weeks');
 }
 add('lineup-'+scopeKey+'-optimal-count-max','Most observed optimal lineups in '+scopeKey,rows,'optimalLineups','max','weeks','Minimum '+min+' reconciled weeks; exposure varies');
 add('lineup-'+scopeKey+'-correctable-loss-count-max','Most losses with recorded-roster optimum exceeding actual opponent score in '+scopeKey,rows,'correctableLosses','max','losses','Minimum '+min+' reconciled weeks; opponent held constant');
}
assert.equal(records.length,16);
fs.writeFileSync('data-integrity/lineup-records-v55.json',JSON.stringify({schemaVersion:1,status:'research-only-hindsight',scope,categoryCount:records.length,accepted:accepted.length,excluded,records},null,2)+'\n');
console.log('Lineup records: '+records.length+' candidates; '+accepted.length+' score-reconciled observations; '+excluded.length+' excluded.');
