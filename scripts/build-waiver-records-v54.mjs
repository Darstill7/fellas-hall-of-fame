// Separate provider-confirmed spending from observed postclaim production.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const script of ['verify-faab-provider-receipts.mjs','verify-faab-aggregates.mjs','analyze-faab-acquisition-value.mjs','attribute-faab-managers.mjs'])execFileSync(process.execPath,['scripts/'+script],{stdio:'inherit'});
const norm=(n,y)=>y===2023&&n==='JMid'?'Evans':n==='Tom'?'Thommy':n;
const spend=read('data-integrity/faab-manager-spend-research-v1.json');
const seasons=spend.managerSeasons.filter(r=>r.year<2026);
assert.equal(seasons.length,60);
const records=[];
const add=(id,label,rows,field,dir,unit,scope,qualification,source)=>{
 assert.ok(rows.length,id);assert.ok(rows.every(r=>Number.isFinite(r[field])),id);
 const value=Math[dir](...rows.map(r=>r[field])),evidence=rows.filter(r=>r[field]===value);
 records.push({id,label,value:unit==='pts'?value/100:value,unit,scope,qualification,source,holders:[...new Set(evidence.map(r=>r.manager))].sort().map(manager=>({manager,evidence:evidence.filter(r=>r.manager===manager)}))});
};
const src='data-integrity/faab-manager-spend-research-v1.json',scope='Provider-observed Sleeper waiver claims, numbered weeks 1–18 of completed 2020–2025 seasons';
const metrics=[['completedClaims','successful waiver claims','claims'],['paidWins','paid waiver claims','claims'],['zeroDollarWins','zero-dollar waiver claims','claims'],['failedClaims','failed waiver claims','claims'],['completedBidSpend','winning FAAB expenditure','FAAB dollars']];
const groups=new Map();
for(const r of seasons){if(!groups.has(r.manager))groups.set(r.manager,[]);groups.get(r.manager).push(r);}
const careers=[...groups].map(([manager,a])=>({manager,seasons:a.length,...Object.fromEntries(metrics.map(([k])=>[k,a.reduce((s,r)=>s+r[k],0)]))}));
for(const [field,label,unit] of metrics){
 for(const direction of ['max','min'])add('faab-season-'+field+'-'+direction,(direction==='max'?'Most':'Fewest')+' '+label+' in one completed season',seasons,field,direction,unit,scope,'Provider receipt counts; failed bids never count as spending; not budget utilization or skill',src);
 add('faab-career-'+field+'-max','Most career observed '+label,careers,field,'max',unit,scope,'Observed completed-season totals; unequal career lengths',src);
}
// Reconstruct largest bid across every receipt, not a truncated list.
// Attribution comes from the archived season-local roster owner evidence in player starts.
const ownerMap={darstill:'Stilly',birchhh:'Birch',evansbrandonm:'Evans',yogurtslinger15:'Stover',dillionpanthers15:'Stover',thommy:'Thommy',ckuhl5:'Kuhl',dsylvester9:'Stew',huppdawg80:'Mitch',koble2323:'Koble',tsteg:'Tony',jmidd:'JMid',sheffla:'Scott'};
const bids=[];
for(let year=2020;year<=2025;year++){
 const provider=read('data-integrity/faab-provider-receipts-'+year+'.json'),starts=read('data/player_starts_'+year+'.json');
 const ids=new Map();
 for(const w of starts.weeks)for(const t of w.teams){
  const manager=norm(ownerMap[String(t.owner).toLowerCase()],year);assert.ok(manager);
  const key=String(t.roster);if(ids.has(key))assert.equal(ids.get(key),manager);else ids.set(key,manager);
 }
 for(const x of provider.receipts.filter(x=>x.status==='complete'&&x.rosterIds.length===1)){
  const manager=ids.get(String(x.rosterIds[0]));assert.ok(manager,'Missing receipt owner '+year+' '+x.id);
  bids.push({manager,year,week:x.week,transactionId:x.id,bid:x.bid,playerIds:x.playerIds});
 }
}
assert.equal(bids.length,seasons.reduce((s,r)=>s+r.completedClaims,0),'Every successful completed-season bid must be attributed');
for(const r of seasons){const a=bids.filter(b=>b.manager===r.manager&&b.year===r.year);assert.equal(a.length,r.completedClaims);assert.equal(a.reduce((s,b)=>s+b.bid,0),r.completedBidSpend);}
add('faab-largest-winning-bid','Largest successful FAAB bid',bids,'bid','max','FAAB dollars',scope,'All provider-confirmed winning receipts with reconciled manager identity',src);
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json'),identity=read('data-integrity/faab-identity-attribution-v1.json');
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const idMap=new Map(identity.observations.map(x=>[key(x),x]));
const used=new Set(),production=[];
for(const x of outcomes.observations){
 if(x.year>=2026||!x.startedWeeks)continue;
 const i=idMap.get(key(x));assert.ok(i);if(!i.manager)continue;
 const manager=norm(i.manager,x.year);
 // Require the known source transaction's winning manager, not just a later roster handle.
 const receipt=bids.find(b=>b.year===x.year&&b.transactionId===x.transactionId);
 if(!receipt||receipt.manager!==manager)continue;
 for(const w of x.weeks.filter(w=>w.started)){const k=[x.year,manager,x.playerId,w.week].join('|');assert.ok(!used.has(k),'Duplicate starter credit '+k);used.add(k);}
 production.push({...x,manager,points:Math.round(x.startedPoints*100),starts:x.startedWeeks});
}
const ps='Observed postclaim starter production from recovered completed-season Sleeper roster snapshots, 2020–2025';
const pq='Only matched waiver receipts with verified owner and observed starts; exclude known ownership changes and acquisition-week points; incomplete coverage';
const psrc='data-integrity/faab-observed-acquisition-outcomes-v1.json + data-integrity/faab-identity-attribution-v1.json';
add('waiver-observed-points-high','Most observed starter points after one waiver acquisition',production,'points','max','pts',ps,pq,psrc);
add('waiver-observed-starts-high','Most observed starts after one waiver acquisition',production,'starts','max','starts',ps,pq,psrc);
add('waiver-zero-dollar-points-high','Most observed starter points after a zero-dollar waiver acquisition',production.filter(x=>x.bid===0),'points','max','pts',ps,pq,psrc);
const bySeason=new Map();
for(const r of production){const k=r.year+':'+r.manager;if(!bySeason.has(k))bySeason.set(k,[]);bySeason.get(k).push(r);}
const seasonProduction=[...bySeason.values()].map(a=>({manager:a[0].manager,year:a[0].year,points:a.reduce((s,r)=>s+r.points,0),starts:a.reduce((s,r)=>s+r.starts,0),transactions:[...new Set(a.map(r=>r.transactionId))]}));
add('waiver-observed-season-points-high','Most observed postclaim waiver starter points in a season',seasonProduction,'points','max','pts',ps,pq,psrc);
add('waiver-observed-season-starts-high','Most observed postclaim waiver starts in a season',seasonProduction,'starts','max','starts',ps,pq,psrc);
assert.equal(new Set(records.map(r=>r.id)).size,records.length);
fs.writeFileSync('data-integrity/waiver-records-v54.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates-not-full-ownership',categoryCount:records.length,verifiedWinningBids:bids.length,observedProductionClaims:production.length,records},null,2)+'\n');
console.log('Waiver records: '+records.length+' candidates; '+bids.length+' winning receipts; '+production.length+' matched player-claim observations.');
