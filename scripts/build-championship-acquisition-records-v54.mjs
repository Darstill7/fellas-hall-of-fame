// Champion-side acquired player contributions only; not causal wins or comprehensive acquisition ROI.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/verify-championship-trade-impact.mjs'],{stdio:'inherit'});
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const d=read('championship_trade_impact_receipts_2020_2025_v1.json');
const a=read('championship_trade_awards_2020_2025_v1.json');
const boxes=read('championship_player_boxscores_2020_2025_v1.json').games;
const cents=n=>Math.round(n*100);
const records=[],seen=new Set(),rows=[];
for(const r of d.qualifiedPlayoffReceipts){
 const box=boxes.find(b=>b.year===r.year&&b.round===r.round&&b.champion===r.champion);
 assert.ok(box);assert.ok(r.tradeWeek<box.week);
 for(const p of r.players){
  const key=[r.year,r.round,r.champion,p.name].join('|');
  assert.ok(!seen.has(key),'Ambiguous acquisition attribution '+key);seen.add(key);
  assert.ok(box.starters.some(s=>s.name===p.name&&s.position===p.position&&cents(s.points)===cents(p.points)));
  rows.push({manager:r.champion,year:r.year,round:r.round,week:r.week,player:p.name,position:p.position,tradeId:r.tradeId,points:cents(p.points),margin:cents(r.margin)});
 }
}
const group=(source,keys)=>{const m=new Map();for(const x of source){const k=keys.map(y=>x[y]).join('|');if(!m.has(k))m.set(k,[]);m.get(k).push(x);}return [...m.values()].map(v=>({...Object.fromEntries(keys.map(k=>[k,v[0][k]])),points:v.reduce((s,x)=>s+x.points,0),starts:v.length,tradeCount:new Set(v.map(x=>x.tradeId)).size,players:v}));};
const scope='2020–2025 Sleeper champions; semifinal and final starters matched to archived Trade Museum receiving sides only; unmatched years are not zeroes';
const qualification='Documented incoming player started after trade; raw scoreboard contribution, not replacement-adjusted or proof of championship causation';
const source='data/championship_trade_impact_receipts_2020_2025_v1.json + data/championship_trade_awards_2020_2025_v1.json';
const add=(id,label,eligible,key,unit='pts')=>{
 assert.ok(eligible.length,id);assert.ok(eligible.every(x=>Number.isFinite(x[key])));
 const mark=Math.max(...eligible.map(x=>x[key])),evidence=eligible.filter(x=>x[key]===mark);
 records.push({id,label,value:unit==='pts'?mark/100:mark,unit,scope,qualification,source,holders:[...new Set(evidence.map(x=>x.manager))].sort().map(manager=>({manager,evidence:evidence.filter(x=>x.manager===manager)}))});
};
const trades=group(rows,['manager','year','tradeId']);
assert.equal(trades.length,a.coverage.distinctRecipientTrades);
for(const t of trades){const receipt=a.eligibleRanking.find(x=>x.tradeId===t.tradeId&&x.year===t.year&&x.receivingManager===t.manager);assert.ok(receipt);assert.equal(t.points,cents(receipt.totalPlayoffStarterPoints));}
add('championship-run-trade-points','Most championship-run started points from one documented trade',trades,'points');
add('championship-run-trade-starts','Most championship-run starts from one documented trade',trades,'starts','starts');
add('championship-run-player-points','Most championship-run started points from one documented traded-in player',group(rows,['manager','year','player']),'points');
for(const round of ['semifinal','championship']){
 const r=rows.filter(x=>x.round===round);
 add('champion-'+round+'-trade-points','Most acquired starter points from one trade in a champion '+round,group(r,['manager','year','tradeId']),'points');
 add('champion-'+round+'-trade-player-points','Highest traded-in individual starter score in a champion '+round,r,'points');
 const games=group(r,['manager','year','round']);
 add('champion-'+round+'-all-trade-points','Most combined documented traded-in starter points in a champion '+round,games,'points');
 add('champion-'+round+'-trade-starts','Most documented traded-in starters in a champion '+round,games,'starts','starts');
}
add('close-final-traded-player-points','Highest traded-in starter score in a championship victory by five points or fewer',rows.filter(x=>x.round==='championship'&&x.margin<=500),'points');
assert.equal(records.length,12);
fs.writeFileSync('data-integrity/championship-acquisition-records-v54.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates',scope,categoryCount:records.length,matchedTrades:trades.length,matchedPlayerGameRows:rows.length,records},null,2)+'\n');
console.log('Championship acquisition records: '+records.length+' candidates; '+trades.length+' matched recipient trades, '+rows.length+' player-game rows.');
