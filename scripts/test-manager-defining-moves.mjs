import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decisionEvidence,renderDecisionHighlights} from '../assets/manager-defining-moves.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf8'));
const enrichment=read('manager_franchise_enrichment_v1.json');
const storylines=read('featured_trade_storylines_v1.json');
const receipts=read('trade_museum_stage66.json');
const managers=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
for(const manager of managers){
 const evidence=decisionEvidence(enrichment,storylines,receipts,manager);
 const profile=enrichment.managers[manager]||enrichment.managers[manager==='Thommy'?'Tom':manager];
 assert.equal(evidence.manager,manager);
 assert.ok(evidence.waiver,'All ten current managers have recovered pickup-to-start examples: '+manager);
 assert.equal(evidence.waiver.transactionId,profile.bestWaiverCandidate.transactionId);
 assert.ok(evidence.waiver.starts>0&&evidence.waiver.points>=0);
 const markup=renderDecisionHighlights(evidence);
 assert.match(markup,/Defining moves/);
 assert.match(markup,/not an all-time ranking/);
 assert.match(markup,/not proof this was the manager/);
 assert.match(markup,/different source coverage/);
 assert.ok(markup.includes(evidence.waiver.player),'Waiver player must remain source backed '+manager);
 assert.ok(markup.includes(evidence.tradeArchiveLastDate),'Trade receipt cutoff should remain visible '+manager);
 assert.ok(!/trade winner|winning trade|official GM grade/i.test(markup),'Never infer a trade winner or manager rating');
 if(evidence.trade){
  const original=receipts.find(t=>t.id===evidence.trade.id);
  assert.ok(original&&original.year<2026,'Featured transaction needs completed-season archived evidence '+manager);
  assert.ok(original.sides.some(s=>s.manager===manager||manager==='Thommy'&&s.manager==='Tom'),'Trade side must belong to manager '+manager);
  assert.ok(markup.includes('trade='+encodeURIComponent(original.id)),'Linked receipt must be the same archived transaction '+manager);
 }
 if(manager==='Stilly'){
  assert.ok(evidence.story,'Stilly commissioner-confirmed three-team story should be shown');
  assert.equal(evidence.story.milestones.length,2,'Only two documented trade receipts, excluding keeper selection');
  for(const milestone of evidence.story.milestones){
   assert.ok(receipts.some(t=>t.id===milestone.id),'Every story link requires source receipt');
   assert.ok(markup.includes('trade='+encodeURIComponent(milestone.id)));
  }
 }else assert.equal(evidence.story,null,'Only verified featured storylines are featured');
}
assert.throws(()=>decisionEvidence({},storylines,receipts,'Stilly'),/enrichment source/);
assert.throws(()=>decisionEvidence(enrichment,{},receipts,'Stilly'),/Editorial provenance/);
assert.throws(()=>decisionEvidence(enrichment,storylines,null,'Stilly'),/Missing trade/);
assert.throws(()=>decisionEvidence(enrichment,storylines,receipts,'Unknown'),/Missing franchise enrichment/);
const altered=structuredClone(receipts);
for(const t of altered)for(const side of t.sides)if(side.manager==='Stilly')side.source_status='UNVERIFIED';
const unavailable=decisionEvidence(enrichment,storylines,altered,'Stilly');
assert.equal(unavailable.trade,null,'Unverified receiving side must never be featured');
assert.equal(unavailable.story,null,'Story cannot link unsupported manager-side trade receipts');
const noTrade=decisionEvidence(enrichment,storylines,[],'Tony');
assert.equal(noTrade.trade,null,'Missing archive must never invent a trade');
assert.match(renderDecisionHighlights(noTrade),/Trade example unavailable/);
const noStory=decisionEvidence(enrichment,{...storylines,stories:[]},receipts,'Stilly');
assert.equal(noStory.story,null,'No hardcoded storyline fallback');
const unreliable=structuredClone(enrichment);
unreliable.managers.Stilly.bestWaiverCandidate.confidence='unverified';
assert.equal(decisionEvidence(unreliable,storylines,receipts,'Stilly').waiver,null,'Do not show unverified acquisition as observed fact');
console.log('FRONT OFFICE 3.1 PASS: ten manager documentary cases, provenance fail-closed, aliases and receipt-linked stories');
