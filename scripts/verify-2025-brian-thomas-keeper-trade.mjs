// Historical keeper attribution must stop at completed player transfers.
// Brian Thomas Jr. (Sleeper ID 11631), kept by Stover in 2025, traded to Stilly in Week 11.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const tx=read('data-integrity/provider-recovered-transactions-2025-week11.json').transactions;
const trade=tx.filter(t=>t.type==='trade'&&t.status==='complete'&&t.transactionId==='1294424036499025920');
assert.equal(trade.length,1,'Missing exact completed keeper trade receipt');
assert.deepEqual([...trade[0].teamIds].map(String).sort(),['1','8']);
assert.ok(trade[0].added.some(x=>x.id==='11631')&&trade[0].added.some(x=>x.id==='2449'));
const roster=week=>{const d=read('data/sleeper_roster_snapshots_2025_week'+week+'.json');return d.rosters};
const has=(week,team,id)=>{const t=roster(week).find(x=>String(x.teamId)===String(team));
 assert.ok(t,'Missing source team '+team+' week '+week);
 return [...(t.starters??[]),...(t.bench??[])].some(x=>String(x.id)===id);};
assert.equal(has(10,8,'11631'),true,'Stover was not holding Thomas before trade');
assert.equal(has(10,1,'2449'),true,'Stilly was not holding Diggs before trade');
assert.equal(has(11,1,'11631'),true,'Stilly did not receive Thomas');
assert.equal(has(11,8,'2449'),true,'Stover did not receive Diggs');
assert.equal(has(12,1,'11631'),true,'Thomas post-trade receipt missing');
assert.equal(has(12,8,'2449'),true,'Diggs post-trade receipt missing');
const draft=read('data/v9_draft_engine.json');
const keeper=draft.filter(p=>p.year===2025&&p.keeper&&p.team_id==='8'&&p.player==='Brian Thomas');
assert.equal(keeper.length,1);assert.equal(keeper[0].traded_same_season,true);
const proof=read('data-integrity/keeper-2025-verified-starts-v1.json').rows.find(x=>x.manager==='Stover'&&x.player==='Brian Thomas');
assert.ok(proof,'Missing keeper verified-start evidence');
assert.ok(proof.receipts.every(x=>x.week<11),'Stover credited with post-trade Brian Thomas points');
console.log('Keeper trade attribution PASS: Brian Thomas -> Stilly, Diggs -> Stover, Week 11; original keeper credit stops before transfer');
