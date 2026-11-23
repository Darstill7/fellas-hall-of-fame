// Front Office 3.1 editorial examples anchored to researched receipts.
// These are examples of documented decisions, NOT ratings of GM skill or trade winners.
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const format=n=>new Intl.NumberFormat('en-US',{minimumFractionDigits:1,maximumFractionDigits:2}).format(n);
const nameForTrade=n=>n==='Thommy'?'Tom':n;
export function decisionEvidence(enrichment,stories,trades,manager){
 if(!enrichment||!enrichment.managers||typeof enrichment.coverage?.waiver!=='string')throw Error('Verified enrichment source missing');
 if(!stories||stories.schema!=='fellas-featured-trade-storylines-v1'||!Array.isArray(stories.stories))throw Error('Editorial provenance missing');
 if(!Array.isArray(trades))throw Error('Missing trade receipts');
 const profile=enrichment.managers[manager]||enrichment.managers[nameForTrade(manager)];
 if(!profile)throw Error('Missing franchise enrichment for '+manager);
 let waiver=null;
 const w=profile.bestWaiverCandidate;
 if(w&&w.confidence==='verified-acquisition-and-subsequent-starts'&&Number.isInteger(w.creditedStarts)&&Number.isFinite(w.starterPoints)&&w.creditedStarts>0&&w.year<=2026){
  waiver={player:w.player,year:w.year,week:w.acquisitionWeek,kind:w.acquisitionType,starts:w.creditedStarts,points:w.starterPoints,transactionId:w.transactionId};
 }
 const available=trades.filter(t=>Array.isArray(t.sides)&&t.sides.some(s=>(s.manager===manager||s.manager===nameForTrade(manager))&&s.source_status==='VERIFIED_SOURCE'));
 // The research candidate is not a universal winner; display only when its
 // ID matches a recorded participant-side receipt and the year is complete.
 const candidate=profile.bestTradeCandidate;
 const featuredReceipt=candidate&&candidate.year<2026&&candidate.confidence?.startsWith('verified')
  ?available.find(t=>t.id===candidate.tradeId&&t.year===candidate.year):null;
 const recentComplete=available.filter(t=>t.year<2026).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
 const trade=featuredReceipt||recentComplete;
 const tradeSide=trade?.sides.find(s=>s.manager===manager||s.manager===nameForTrade(manager));
 const selectedStory=stories.stories.find(s=>s.manager===manager);
 const milestones=selectedStory?.milestones||[];
 const verifiedMilestones=milestones.filter(m=>m.tradeId&&available.some(t=>t.id===m.tradeId));
 return {manager,waiver,trade:trade&&tradeSide?{
  id:trade.id,year:trade.year,date:trade.date,assets:tradeSide.assets,
  participants:trade.sides.map(s=>s.manager),sourceStatus:tradeSide.source_status,
  isFeaturedResearchCandidate:!!featuredReceipt&&trade.id===featuredReceipt.id
 }:null,
  story:selectedStory&&verifiedMilestones.length===milestones.filter(m=>m.tradeId).length?{
   title:selectedStory.title,importance:selectedStory.importance,
   milestones:verifiedMilestones.map(m=>({id:m.tradeId,date:m.date,year:m.year,type:m.type}))
  }:null,
  coverage:enrichment.coverage,tradeArchiveLastDate:trades.reduce((max,t)=>t.date>max?t.date:max,'')};
}
export function renderDecisionHighlights(r){
 const waiver=r.waiver?'<article class="fo-move"><p class="fo-move-type">Recorded waiver/add · '+r.waiver.year+'</p>'+
  '<h4>'+escapeHTML(r.waiver.player)+'</h4>'+
  '<p>Acquired in Week '+r.waiver.week+'. Credited with <strong>'+r.waiver.starts+' subsequent starts</strong> and <strong>'+format(r.waiver.points)+' starter points</strong> in recovered regular-season lineup evidence.</p>'+
  '<p class="fo-move-limits">Observed usage after a recorded pickup; not proof this was the manager’s best pickup or caused any particular win.</p></article>':
  '<article class="fo-move"><h4>Pickup example unavailable</h4><p>The verified acquisition-and-start source does not provide a supported individual example.</p></article>';
 const trade=r.trade?'<article class="fo-move"><p class="fo-move-type">Archived completed-season trade · '+r.trade.year+'</p>'+
  '<h4>'+escapeHTML(r.trade.assets||'Assets unresolved')+'</h4>'+
  '<p>'+escapeHTML(r.trade.date)+' · Recorded receiving side for '+escapeHTML(r.manager)+'. Participants: '+escapeHTML(r.trade.participants.join(', '))+'.</p>'+
  '<a href="../../analytics/trade-museum.html?trade='+encodeURIComponent(r.trade.id)+'">Inspect documented trade receipt →</a>'+
  '<p class="fo-move-limits">Example drawn from archived receipts, not a trade-winner or decision-quality grade. Asset/FAAB completeness is not certified.</p></article>':
  '<article class="fo-move"><h4>Trade example unavailable</h4><p>No completed-season receipt can support a featured transaction yet.</p></article>';
 const story=r.story?'<article class="fo-move fo-move-story"><p class="fo-move-type">Commissioner-confirmed franchise storyline</p>'+
  '<h4>'+escapeHTML(r.story.title)+'</h4><p>'+escapeHTML(r.story.importance)+'</p>'+
  '<div class="fo-move-story-links">'+r.story.milestones.map(m=>'<a href="../../analytics/trade-museum.html?trade='+encodeURIComponent(m.id)+'">'+escapeHTML(m.date||m.year)+' receipt →</a>').join('')+'</div>'+
  '<p class="fo-move-limits">Strategic significance is documented, but keeper or trade outcomes in an ongoing season are not final grades.</p></article>':'';
 return '<details class="fo-decisions"><summary>Defining moves <span>Documented decision examples</span></summary>'+
  '<div class="fo-decisions-content"><p>Selected evidence-backed episodes, not an all-time ranking of general managers. Historical records have different source coverage.</p>'+
  '<div class="fo-move-grid">'+story+waiver+trade+'</div>'+
  '<p class="fo-move-limits">Player-level acquisition/starts coverage: '+escapeHTML(r.coverage.waiver)+'. Trade Museum receipts currently end '+
    escapeHTML(r.tradeArchiveLastDate||'unverified')+'. Check the full Front Office yearbook for coverage by season.</p></div></details>';
}
