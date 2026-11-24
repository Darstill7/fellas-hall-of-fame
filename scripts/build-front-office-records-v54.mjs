// Scoped front-office research; never treat observed production as decision quality.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const norm=n=>({Tom:'Thommy',EvansBrandon:'Evans'}[n]||n);
const cents=n=>Math.round(n*100);
const draft=read('v9_draft_engine.json');
const trade=read('v9_trade_engine.json');
const records=[],excluded=[];
function peak(id,label,rows,field,direction,unit,scope,qualification,source){
 assert.ok(rows.length,id);
 assert.ok(rows.every(r=>Number.isFinite(r[field])),id);
 const value=Math[direction](...rows.map(r=>r[field])),evidence=rows.filter(r=>r[field]===value);
 records.push({id,label,value:unit==='pts'?value/100:value,unit,scope,qualification,source,holders:[...new Set(evidence.map(r=>r.manager))].sort().map(manager=>({manager,evidence:evidence.filter(r=>r.manager===manager)}))});
}
const draftSource='data/v9_draft_engine.json';
const ds='Archived observed Sleeper draft-engine production, completed 2020–2025 seasons; not certified comprehensive original-team attribution';
const seen=new Set();
const picks=draft.filter(r=>r.year>=2020&&r.year<=2025).map(r=>{
 const key=r.year+':'+r.overall;assert.ok(!seen.has(key));seen.add(key);
 assert.ok(r.manager&&r.player&&Number.isInteger(r.round)&&Number.isFinite(r.reg_starter_points)&&Number.isInteger(r.reg_starts));
 return {...r,manager:norm(r.manager),points:cents(r.reg_starter_points),starts:r.reg_starts};
});
assert.equal(picks.length,900);
for(let y=2020;y<=2025;y++){
 const a=picks.filter(r=>r.year===y);assert.equal(a.length,150);
 assert.equal(new Set(a.map(r=>r.manager)).size,10);
}
const nonkeepers=picks.filter(r=>!r.keeper&&r.status!=='KEEPER');
const pq='Nonkeeper draft picks; observed regular-season starter points recorded by archived engine, no projected or bench points';
peak('draft-pick-points-high','Most observed starter points from one draft pick',nonkeepers,'points','max','pts',ds,pq,draftSource);
peak('draft-pick-starts-high','Most observed starts from one draft pick',nonkeepers,'starts','max','starts',ds,pq,draftSource);
peak('draft-late-pick-points-high','Most observed starter points from a late-round pick',nonkeepers.filter(r=>r.round>=10),'points','max','pts',ds,pq+'; rounds 10–15',draftSource);
for(let round=1;round<=15;round++)peak('draft-round-'+round+'-points-high','Most observed starter points from a round '+round+' pick',nonkeepers.filter(r=>r.round===round),'points','max','pts',ds,pq,draftSource);
for(const position of ['QB','RB','WR','TE','DEF']){
 const a=nonkeepers.filter(r=>r.position===position);if(!a.length)continue;
 peak('draft-position-'+position.toLowerCase()+'-points-high','Most observed starter points from a drafted '+position,a,'points','max','pts',ds,pq,draftSource);
}
const grouped=new Map();
for(const r of nonkeepers){const k=r.year+':'+r.manager;if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(r);}
const classes=[...grouped.values()].map(a=>({manager:a[0].manager,year:a[0].year,picks:a.length,points:a.reduce((s,r)=>s+r.points,0),starts:a.reduce((s,r)=>s+r.starts,0),zeroStartPicks:a.filter(r=>r.starts===0).length}));
for(const dir of ['max','min']){
 peak('draft-class-points-'+dir,(dir==='max'?'Most':'Fewest')+' observed nonkeeper draft-class starter points',classes,'points',dir,'pts',ds,'Raw totals; draft classes and schedule lengths differ; not a skill ranking',draftSource);
 peak('draft-class-starts-'+dir,(dir==='max'?'Most':'Fewest')+' observed nonkeeper draft-class starts',classes,'starts',dir,'starts',ds,'Raw totals; draft classes differ in size',draftSource);
}
peak('draft-class-zero-starts','Most nonkeeper draft picks recording zero starts',classes,'zeroStartPicks','max','picks',ds,'Zero observed starts in archived engine; not proof of zero NFL production',draftSource);
const ts='Archived completed-season verified two-sided player trades, 2020–2025; observed direct starter-point edge only';
const tradeSource='data/v9_trade_engine.json';
const transactions=new Map();
for(const r of trade.sides){
 if(r.year<2020||r.year>2025)continue;
 const k=r.year+':'+r.trade_id;if(!transactions.has(k))transactions.set(k,[]);transactions.get(k).push(r);
}
const eligible=[];
for(const [key,a] of transactions){
 const valid=a.length===2&&new Set(a.map(r=>norm(r.manager))).size===2&&a.every(r=>!r.provisional&&/^verified(?:-|$)/.test(r.confidence)&&Array.isArray(r.assets)&&r.assets.length>0&&Number.isFinite(r.starter_points)&&Number.isFinite(r.direct_edge)&&Number.isInteger(r.starts))&&cents(a[0].direct_edge)===-cents(a[1].direct_edge)&&cents(a[0].starter_points)-cents(a[1].starter_points)===cents(a[0].direct_edge);
 if(!valid){excluded.push({key,reason:'Incomplete, nonverified, multi-sided or unreconciled direct edge'});continue;}
 eligible.push(...a.map(r=>({...r,manager:norm(r.manager),event:key,points:cents(r.starter_points),edge:cents(r.direct_edge),assetCount:r.assets.length,opponent:norm(a.find(x=>x!==r).manager)})));
}
const tq='Both transaction sides verified and direct edge reconciles to recorded started points; no provisional seasons, incomplete trades or multi-team edges';
for(const dir of ['max','min'])peak('trade-direct-edge-'+dir,(dir==='max'?'Largest positive':'Largest negative')+' observed direct trade edge',eligible,'edge',dir,'pts',ts,tq,tradeSource);
peak('trade-acquired-started-points-high','Most observed starter points acquired in one trade',eligible,'points','max','pts',ts,tq,tradeSource);
peak('trade-acquired-starts-high','Most observed starts acquired in one trade',eligible,'starts','max','starts',ts,tq,tradeSource);
peak('trade-assets-high','Most listed player assets received in one verified two-sided trade',eligible,'assetCount','max','assets',ts,tq,tradeSource);
const aggregate=(keyFn)=>{const groups=new Map();for(const r of eligible){const k=keyFn(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}return [...groups.values()].map(a=>({manager:a[0].manager,year:keyFn(a[0]).includes(':')?a[0].year:undefined,events:new Set(a.map(r=>r.event)).size,edge:a.reduce((s,r)=>s+r.edge,0),points:a.reduce((s,r)=>s+r.points,0),eventIds:a.map(r=>r.event)}));};
const career=aggregate(r=>r.manager),season=aggregate(r=>r.manager+':'+r.year);
peak('trade-observed-career-events-high','Most represented verified two-sided trade events',career,'events','max','trades',ts,tq+'; counts are not comprehensive transaction totals',tradeSource);
peak('trade-observed-season-events-high','Most represented verified two-sided trade events in one season',season,'events','max','trades',ts,tq+'; counts are not comprehensive transaction totals',tradeSource);
for(const dir of ['max','min'])peak('trade-observed-career-edge-'+dir,(dir==='max'?'Highest':'Lowest')+' cumulative observed direct trade edge',career,'edge',dir,'pts',ts,tq+'; descriptive arithmetic, not profit or decision quality',tradeSource);
assert.equal(new Set(records.map(r=>r.id)).size,records.length);
fs.writeFileSync('data-integrity/front-office-records-v54.json',JSON.stringify({schemaVersion:1,status:'research-only-attribution-and-coverage-review-required',draftPicks:picks.length,eligibleTradeEvents:eligible.length/2,excludedTradeEvents:excluded,categoryCount:records.length,records},null,2)+'\n');
console.log('Front office records: '+records.length+' candidates; '+picks.length+' archived draft picks, '+eligible.length/2+' reconciled completed two-sided trades, '+excluded.length+' excluded trades.');
