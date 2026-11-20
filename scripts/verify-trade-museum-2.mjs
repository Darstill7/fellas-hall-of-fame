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
assert.ok(plusMinus.includes('id="coverageRows"')&&plusMinus.includes('renderCoverage()'),'Trade +/- must report yearly source coverage');
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
