// Trade Museum 2.0 fixture and source-safety checks. No network access or dataset mutation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const html=readFileSync(new URL('../analytics/trade-museum.html',import.meta.url),'utf8');
const embedded=html.match(/<script\s+id="archive-data"\s+type="application\/json">([\s\S]*?)<\/script>/i);
assert.ok(embedded,'Embedded archival trade dataset must exist');
const trades=JSON.parse(embedded[1]);
assert.ok(Array.isArray(trades)&&trades.length>0,'Archived trades must remain available');
const ids=trades.map(t=>String(t.id));
assert.equal(new Set(ids).size,ids.length,'Trade IDs must remain unique');
for (const trade of trades){
 assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(trade.date),'All trades need a sortable source date');
 assert.ok(Array.isArray(trade.sides)&&trade.sides.length>0,'Every trade needs at least one documented participant');
 for(const side of trade.sides){
  assert.ok(side.manager&&typeof side.manager==='string','Every receipt side needs a manager');
  assert.ok(side.raw_starter_points===null||Number.isFinite(side.raw_starter_points),'Unverified points must stay null, not zero');
 }
}
const complete=t=>t.sides.length>=2&&new Set(t.sides.map(s=>s.manager)).size===t.sides.length&&t.sides.every(s=>s.source_status==='VERIFIED_SOURCE'&&typeof s.assets==='string'&&s.assets.trim().length>0);
const curated=trades.filter(complete),research=trades.filter(t=>!complete(t));
assert.equal(curated.length+research.length,trades.length,'Incomplete receipts must remain distinct');
const multi=curated.filter(t=>t.sides.length>=3);
assert.ok(multi.length>0,'Three-team gallery must have source-backed exhibits');
for (const id of ['trade-museum-title','trade-filters','results','featured-trade','manager','format','scope','year','sort','q','clearFilters','tm-gallery-items','detail','detailBody','loadMore']){
 assert.match(html,new RegExp('id="'+id+'"'),'Missing museum control/landmark: '+id);
}
for(const val of ['value="all"','value="two"','value="multi"']){
 assert.ok(html.includes(val),'Missing format filter '+val);
}
for(const phrase of ['Not live · review newer transactions','Point totals are audit snapshots','Incomplete research receipts','Direct receipt URL','id="copyTradeLink"']){
 assert.ok(html.includes(phrase),'Missing evidence/share disclosure: '+phrase);
}
const editorial=readFileSync(new URL('../analytics/greatest-worst-trades.html',import.meta.url),'utf8');
const sourceLinks=[...editorial.matchAll(/href="trade-museum\.html\?trade=(\d+)"/g)].map(match=>match[1]);
assert.ok(sourceLinks.length>=3,'Featured greatest/worst editorial needs direct source receipts');
for(const id of sourceLinks)assert.ok(ids.includes(id),'Editorial source link must resolve to a documented museum receipt: '+id);
assert.ok(editorial.includes('Browse the source-backed Trade Museum receipts'),'Editorial page must link to Trade Museum');
const portfolio=readFileSync(new URL('../analytics/trade-portfolios.html',import.meta.url),'utf8');
assert.ok(html.includes('href="trade-portfolios.html" id="manager-entry"'),'Franchise entrance must lead to manager portfolios');
assert.ok(portfolio.includes("fetch('trade-museum.html'"),'Portfolios must read existing museum receipts rather than copied trade data');
assert.ok(portfolio.includes("querySelector('#archive-data')"),'Portfolio must use the museum archive source');
assert.ok(!portfolio.includes('id="archive-data"'),'Portfolio must not duplicate a potentially stale museum dataset');
for(const phrase of ['Research receipt · incomplete evidence','Latest dated receipt','?manager=','trade-museum.html?trade=']){
 assert.ok(portfolio.includes(phrase),'Missing portfolio source scope or deep link: '+phrase);
}
const championship=JSON.parse(readFileSync(new URL('../data/championship_trade_impact_receipts_2020_2025_v1.json',import.meta.url),'utf8'));
assert.equal(championship.schema,'fellas-championship-trade-impact-receipts-v1','Unexpected research provenance');
assert.ok(Array.isArray(championship.qualifiedPlayoffReceipts),'Missing verified champion playoff evidence');
for(const evidence of championship.qualifiedPlayoffReceipts){
 const receipt=trades.find(t=>String(t.id)===String(evidence.tradeId));
 assert.ok(receipt,'Championship research references a missing trade: '+evidence.tradeId);
 assert.ok(complete(receipt),'Championship showcase must never be backed by research-only trade '+evidence.tradeId);
 const champion=String(evidence.champion).toLowerCase()==='thommy'?'tom':String(evidence.champion).toLowerCase();
 assert.ok(receipt.sides.some(side=>String(side.manager).toLowerCase()===champion),'Championship credit belongs to a recorded receiving manager for '+evidence.tradeId);
 assert.ok([2020,2021,2022,2023,2024,2025].includes(evidence.year),'Never attribute unfinished-season playoff impact');
 assert.ok(['semifinal','championship'].includes(evidence.round),'Unexpected postseason stage');
 assert.ok(evidence.players.length>0&&evidence.players.every(p=>Number.isFinite(p.points)),'All shown contribution points must be verified');
 assert.ok(Math.abs(evidence.players.reduce((n,p)=>n+p.points,0)-evidence.totalAcquiredStarterPoints)<0.011,'Starter points must sum to the certified total');
}
assert.ok(portfolio.includes('qualifiedPlayoffReceipts'),'Portfolio must reference independently verified game-level playoff evidence');
assert.ok(portfolio.includes('No qualifying acquired-player championship playoff starter matches'),'Missing evidence must not imply a manager has zero impact');
assert.ok(portfolio.includes('replacement lineups were not established'),'No trade-result counterfactual claims');
assert.ok(portfolio.includes("canonical(name)==='stilly'"),'Keeper feature must be restricted to verified named manager');
assert.ok(html.includes('Amon-Ra as a 2026 keeper'),'Keeper note must be grounded in published museum narrative');
assert.ok(portfolio.includes('id="tradePartner"'),'Rivalry comparison selector must exist');
assert.ok(portfolio.includes('id="rivalryLedger"'),'Rivalry transaction ledger must exist');
assert.ok(portfolio.includes("url.searchParams.set('partner',partner)"),'Pair selection must preserve deep links');
assert.ok(portfolio.includes("partnerTrades.filter(complete)"),'Verified rivalry counts must use complete receipts');
assert.ok(portfolio.includes("t.sides.length>=3"),'Three-team deals must be identified');
assert.ok(portfolio.includes("This is not a win/loss record"),'Rivalry volume must not imply winners');
const pairIds=new Set();
for(const trade of curated){
 const managers=trade.sides.map(side=>side.manager);
 for(let i=0;i<managers.length;i++)for(let j=i+1;j<managers.length;j++){
  const pair=[managers[i],managers[j]].sort().join('|');
  const unique=pair+'|'+trade.id;
  assert.ok(!pairIds.has(unique),'A trade must be counted once per manager pair: '+unique);
  pairIds.add(unique);
 }
}
const plusMinus=readFileSync(new URL('../analytics/trade-plus-minus.html',import.meta.url),'utf8');
const parData=JSON.parse(readFileSync(new URL('../data/trade_par_preview.json',import.meta.url),'utf8'));
const parEligible=parData.records.filter(t=>t.year>=2020&&t.year<=2025&&t.complete===true&&t.sides.length===2&&t.sides.every(side=>side.fullyMatched===true&&Number.isFinite(side.postTradePAR)));
assert.equal(parEligible.length,18,'Research-based PAR eligibility expected from reviewed 2020–2025 sample; investigate any changed source');
const parManagerNet=new Map();
for(const t of parEligible){
 const [a,b]=t.sides;
 assert.ok(ids.includes(String(t.id)),'PAR winner claims must trace to museum trade receipt: '+t.id);
 const gap=a.postTradePAR-b.postTradePAR;
 const left=a.manager==='Thommy'?'Tom':a.manager,right=b.manager==='Thommy'?'Tom':b.manager;
 parManagerNet.set(left,(parManagerNet.get(left)||0)+gap);
 parManagerNet.set(right,(parManagerNet.get(right)||0)-gap);
}
assert.ok(Math.abs([...parManagerNet.values()].reduce((sum,n)=>sum+n,0))<0.001,'Pairwise +/- must be zero sum');
assert.ok(plusMinus.includes('id="pairRows"')&&plusMinus.includes('id="managerRows"')&&plusMinus.includes('id="tradeRows"'),'Trade +/- view must include pair, manager and source evidence views');
assert.ok(plusMinus.includes('id="matrixHeader"')&&plusMinus.includes('id="matrixBody"'),'Trade +/- must include directional head-to-head matrix');
assert.ok(plusMinus.includes('id="includeRecovery"')&&plusMinus.includes("const activeTrades=()=>$('includeRecovery').checked"),'Expanded six-case comparison must be explicitly opt-in');
assert.ok(plusMinus.includes("sourceRecoveredPreview:true")&&plusMinus.includes("RESEARCH PREVIEW · NOT CERTIFIED"),'Source-recovered comparisons must remain visibly research-only');
assert.ok(plusMinus.includes('loadRecoveredPreview(data.records)')&&plusMinus.includes('Expanded research preview unavailable'),'Missing proof data must fail closed');
const proofFiles=['trade_par_recovery_2025_ertz_source_v1.json','trade_par_recovery_2024_mostert_source_v1.json','trade_par_recovery_2024_aiyuk_source_v1.json','trade_par_recovery_2025_tuten_source_v1.json','trade_par_recovery_2024_dowdle_source_v1.json','trade_par_recovery_2024_ridley_source_v1.json'];
const recoveredIds=new Set();
for(const file of proofFiles){
 const proof=JSON.parse(readFileSync(new URL('../data/'+file,import.meta.url),'utf8'));
 assert.equal(proof.status,'source_checked_pending_integration');
 assert.equal(proof.evidence.verifiedPostTradeStarts,0);
 const trade=parData.records.find(t=>String(t.id)===proof.tradeId);
 assert.ok(trade&&!parEligible.includes(trade),'Preview proof cannot already be a certified sample trade');
 const unresolved=trade.sides.flatMap(side=>(side.unresolved||[]).map(asset=>({asset,manager:side.manager})));
 assert.deepEqual(unresolved,[{asset:proof.player.name,manager:proof.manager}]);
 assert.ok(!recoveredIds.has(String(trade.id)),'No duplicate preview trades');
 recoveredIds.add(String(trade.id));
}
assert.equal(parEligible.length+recoveredIds.size,24,'Expanded research-only comparison count must stay independently audited');

assert.ok(plusMinus.includes('id="coverageRows"')&&plusMinus.includes('renderCoverage()'),'Trade +/- must report yearly source coverage');
assert.ok(plusMinus.includes('id="recoveryRows"')&&plusMinus.includes('renderRecovery()'),'Unmatched trade research queue must remain discoverable');
assert.ok(plusMinus.includes('Never substitute zeros or partial PAR'),'Unmatched received players must not be scored as zero');
assert.ok(plusMinus.includes("side.fullyMatched===true"),'Recovery queue must classify receiving-side evidence');
const incompleteTwo=parData.records.filter(t=>t.year>=2020&&t.year<=2025&&t.sides.length===2&&!parEligible.some(q=>String(q.id)===String(t.id)));
assert.equal(incompleteTwo.length,23,'Audit queue coverage changed; verify reconciliation to eligible PAR source');
const historical=JSON.parse(readFileSync(new URL('../data/v9_trade_engine.json',import.meta.url),'utf8'));
const historicalKeys=new Set(historical.sides.map(s=>String(s.trade_id)+'|'+s.manager));
assert.equal(historicalKeys.size,historical.sides.length,'Historical trade receiving sides must be unique');
for(const t of incompleteTwo)for(const side of t.sides.filter(s=>!s.fullyMatched)){
 assert.ok(historicalKeys.has(String(t.id)+'|'+side.manager),'Missing source side in historical crosswalk');
}
const ertzProof=JSON.parse(readFileSync(new URL('../data/trade_par_recovery_2025_ertz_source_v1.json',import.meta.url),'utf8'));
assert.equal(ertzProof.status,'source_checked_pending_integration');
assert.equal(ertzProof.tradeId,'1294724519813988352');
assert.equal(ertzProof.player.sleeperPlayerId,'1339');
assert.equal(ertzProof.evidence.verifiedPostTradeStarts,0);
const proofWeeks=ertzProof.evidence.weeklyRosterObservations.filter(w=>w.week>ertzProof.tradeWeek);
assert.deepEqual(proofWeeks.map(w=>w.week),[12,13,14],'No missing weeks in Ertz qualifying window');
assert.ok(proofWeeks.every(w=>w.slot==='bench'),'No starter production may be inferred from bench weeks');
const proofTrade=parData.records.find(t=>String(t.id)===ertzProof.tradeId);
assert.ok(proofTrade&&!parEligible.includes(proofTrade),'This is staged recovery evidence, not yet a leaderboard promotion');
assert.ok(proofTrade.sides.some(s=>s.manager==='Kuhl'&&s.unresolved.includes(ertzProof.player.name)),'Evidence must match unresolved asset and recorded receiving side');
const evansException=JSON.parse(readFileSync(new URL('../data/trade_par_exception_2025_evans_zero_point_start_v1.json',import.meta.url),'utf8'));
assert.equal(evansException.status,'source_checked_requires_scoring_baseline');
assert.equal(evansException.player.sleeperPlayerId,'2216');
assert.equal(evansException.tradeId,'1276326233327570944');
const evansSourceTrade=parData.records.find(t=>String(t.id)===evansException.tradeId);
assert.ok(evansSourceTrade&&!parEligible.includes(evansSourceTrade),'Unreconciled Evans start cannot be promoted as completed trade PAR');
assert.ok(evansSourceTrade.sides.some(s=>s.manager==='Stover'&&s.unresolved.includes(evansException.player.name)),'Exception must match ungraded incoming asset');
const evansWeeks=evansException.evidence.weeklyRosterObservations;
assert.deepEqual(evansWeeks.map(w=>w.week),[4,5,6,7,8,9,10,11,12,13,14]);
assert.equal(evansWeeks.filter(w=>w.slot==='starter').length,1,'Zero-point start must not be confused with zero starts');
assert.equal(evansWeeks.find(w=>w.slot==='starter').points,0,'Zero fantasy points, but not a zero-start record');
assert.ok(evansException.requiredReview.includes('replacement baseline'),'Zero-point starter requires position-relative baseline');
const mostertProof=JSON.parse(readFileSync(new URL('../data/trade_par_recovery_2024_mostert_source_v1.json',import.meta.url),'utf8'));
assert.equal(mostertProof.status,'source_checked_pending_integration');
assert.equal(mostertProof.tradeId,'1159892809005076480');
assert.equal(mostertProof.player.sleeperPlayerId,'2749');
assert.equal(mostertProof.evidence.verifiedPostTradeStarts,0);
const mostertWeeks=mostertProof.evidence.weeklyRosterObservations.filter(w=>w.week>mostertProof.tradeWeek);
assert.deepEqual(mostertWeeks.map(w=>w.week),[11,12,13,14],'No missing 2024 Mostert review weeks');
assert.deepEqual(mostertWeeks.map(w=>w.slot),['bench','bench','absent_from_roster_snapshot','absent_from_roster_snapshot'],'Never label absence as a bench appearance');
const mostertTrade=parData.records.find(t=>String(t.id)===mostertProof.tradeId);
assert.ok(mostertTrade&&!parEligible.includes(mostertTrade),'Mostert evidence remains an ungraded candidate');
assert.ok(mostertTrade.sides.some(s=>s.manager==='Mitch'&&s.unresolved.includes(mostertProof.player.name)),'Mostert original receiving side and historical proof must match');

const crosswalkScript=readFileSync(new URL('audit-trade-par-historical-crosswalk.mjs',import.meta.url),'utf8');
assert.ok(crosswalkScript.includes('No incomplete trade may enter +/-'),'Historical snapshot evidence cannot automatically promote a trade');
assert.ok(crosswalkScript.includes('singleRows.length,14'),'Crosswalk single-asset source coverage must be verified');

assert.equal(incompleteTwo.filter(t=>t.sides.reduce((n,s)=>n+(s.unresolved||[]).length,0)===1).length,14,'Single-asset prioritization count changed');
assert.ok(plusMinus.includes('value="single"'),'Research queue must permit single unresolved asset prioritization');
const triageScript=readFileSync(new URL('audit-trade-par-recovery.mjs',import.meta.url),'utf8');
assert.ok(triageScript.includes("assert.equal(eligible.length+queue.length"),'Source-review audit must reconcile complete-era counts');
assert.ok(triageScript.includes("others=(evidence.get(t.year"),'Same-year player-name hints must be labeled as review leads');
assert.ok(triageScript.includes('not proof')&&triageScript.includes('Never substitute a zero'),'Research queue cannot fabricate PAR');
new Script(triageScript.replace(/^import .*;$/gm,''),{filename:'audit-trade-par-recovery.mjs'});

assert.equal(incompleteTwo.filter(t=>t.sides.filter(s=>s.fullyMatched===true).length===1).length,18,'One-side research bucket changed');
assert.equal(incompleteTwo.filter(t=>t.sides.filter(s=>s.fullyMatched===true).length===0).length,5,'Both-sides research bucket changed');
for(const t of incompleteTwo){
 assert.ok(ids.includes(String(t.id)),'Recovery queue must contain only archived receipts');
 assert.ok(t.sides.some(side=>side.fullyMatched!==true),'An already qualified trade cannot enter recovery queue');
}

assert.ok(plusMinus.includes("id=\"exclusionReasons\"")&&plusMinus.includes('Unclassified PAR coverage gap'),'Research exclusions must be classified and checked for completeness');
assert.ok(plusMinus.includes('documentedPairCount(p.a,p.b,year)'),'Measured pairs must disclose comparison coverage');
assert.ok(plusMinus.includes("t.sides.some(s=>canon(s.manager)===a)"),'Pair coverage must derive from recorded counterparties');

assert.ok(plusMinus.includes("fetch('trade-museum.html'"),'Trade +/- must independently reconcile against the museum source');
assert.ok(plusMinus.includes('original.year!==measured.year'),'Qualified PAR evidence must fail closed on source ID or season mismatch');
const countByYear=new Map();
for(const t of trades.filter(t=>t.year>=2020&&t.year<=2025))countByYear.set(t.year,(countByYear.get(t.year)||0)+1);
for(const year of [2020,2021,2022,2023,2024,2025]){
 const matched=parEligible.filter(t=>t.year===year).length;
 assert.ok(matched<=countByYear.get(year),'Measured results exceed museum receipts for '+year);
}
assert.equal([...countByYear.values()].reduce((a,b)=>a+b,0),44,'Museum coverage scope changed; re-audit release assumptions');

assert.ok(plusMinus.includes("if(!pair)return '<td class=\"na\""),'Unmeasured manager pairs must display a dash rather than false zero');
assert.ok(plusMinus.includes("searchParams.get('partner')"),'Matrix pair deep links must retain selected counterpart');
assert.ok(plusMinus.includes("t.sides.length===2")&&plusMinus.includes("s.fullyMatched===true"),'Unqualified trade receipts must not be graded');
assert.ok(plusMinus.includes("2016–2019")&&plusMinus.includes("three-manager receipts"),'Historical coverage omissions must stay visible');
assert.ok(html.includes('href="trade-plus-minus.html"')&&portfolio.includes('href="trade-plus-minus.html"'),'Trade +/- must be discoverable from museum and franchise pages');
const plusModule=[...plusMinus.matchAll(/<script type="module">([\s\S]*?)<\/script>/gi)];
assert.equal(plusModule.length,1,'Trade +/- view must have one module');
new Function('return (async()=>{'+plusModule[0][1]+'})');
const moduleScripts=[...portfolio.matchAll(/<script type="module">([\s\S]*?)<\/script>/gi)];
assert.equal(moduleScripts.length,1,'Manager portfolios require one self-contained browser module');
new Function('return (async()=>{'+moduleScripts[0][1]+'})');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(Boolean);
assert.ok(scripts.length>=1,'Missing browser script');
for(const [i,src] of scripts.entries())new Script(src,{filename:'inline-trade-museum-'+i+'.js'});
const browserScript=scripts.at(-1);
assert.ok(browserScript.indexOf('const esc=')<browserScript.indexOf("document.getElementById('tm-gallery-items').innerHTML"),'Escape helper must be initialized before gallery rendering');
assert.ok(browserScript.includes("matchesManager(t,$('manager').value)"),'Manager filter must apply to results');
assert.ok(browserScript.includes("$('format').value==='two'"),'Trade format filter must apply to results');
assert.ok(browserScript.includes("shareUrl.searchParams.set('trade',String(t.id))"),'Shared links must preserve trade ID');
assert.ok(browserScript.includes("if(t){$('scope').value=completeSides(t)?'main':'research'"),'Receipt deep links must preserve research scope');
console.log('Trade Museum checks passed: '+trades.length+' receipts, '+curated.length+' verified complete, '+research.length+' research-only, '+multi.length+' three-or-more-manager exhibits.');
