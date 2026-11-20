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
