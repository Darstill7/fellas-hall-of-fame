// Front Office 3.0: source-backed historical coverage, NOT skill grades.
// ESPN draft rows can contain unresolved names; Sleeper add coverage is observational;
// completed Trade Museum receipts may lag the latest canonical matchup week.
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const number=n=>new Intl.NumberFormat('en-US').format(n);
const alias=name=>name==='Thommy'?'Tom':name;
export function frontOfficeEvidence(draft,acquisitions,trades,manager){
 if(!draft||draft.schema!=='fellas-manager-draft-and-trade-evidence-v1'||draft.status!=='research_only_no_draft_or_trade_skill_grades'||!Array.isArray(draft.rows))throw Error('Draft evidence provenance unavailable');
 if(!acquisitions||acquisitions.status!=='observational_not_skill_rating'||!Array.isArray(acquisitions.rows))throw Error('Waiver acquisition evidence provenance unavailable');
 if(!Array.isArray(trades)||!trades.every(t=>Array.isArray(t.sides)&&Number.isInteger(t.year)&&typeof t.id==='string'))throw Error('Trade Museum evidence invalid');
 const draftYears=draft.rows.filter(r=>r.manager===manager).sort((a,b)=>b.year-a.year);
 const waiverYears=acquisitions.rows.filter(r=>r.manager===manager).sort((a,b)=>b.year-a.year);
 const participating=trades.filter(t=>t.sides.some(s=>s.manager===manager||s.manager===alias(manager)));
 const latestTradeDate=trades.reduce((max,t)=>t.date>max?t.date:max,'');
 if(!draftYears.length&&!waiverYears.length&&!participating.length)throw Error('No documented front-office coverage for '+manager);
 const documentedTradeYears=[...new Set(participating.map(t=>t.year))].sort((a,b)=>b-a);
 const relevantTrades=[...participating].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,5);
 return {manager,draftYears,waiverYears,relevantTrades,documentedTradeYears,documentedTrades:participating.length,allTrades:participating,
  selectedDraftYears:draftYears.length,distinctAcquisitions:waiverYears.reduce((sum,r)=>sum+r.distinctPlayerAdds,0),
  acquisitionsWithLaterStarts:waiverYears.reduce((sum,r)=>sum+r.withLaterRecordedStarts,0),
  latestTradeDate,tradeScopeYear:Math.max(...trades.map(t=>t.year)),
  waiverPartialYear:acquisitions.incompleteYear??2026,
  draftCutoff:draft.seasonCutoff,
  notes:{draft:draft.status,acquisition:acquisitions.status}};
}
// A missing source is "not documented", not proof no transaction occurred.
export function frontOfficeTimeline(r){
 const years=new Set([...r.draftYears.map(y=>y.year),...r.waiverYears.map(y=>y.year),...r.documentedTradeYears]);
 return [...years].sort((a,b)=>b-a).map(year=>{
  const draft=r.draftYears.find(d=>d.year===year);
  const waiver=r.waiverYears.find(w=>w.year===year);
  const trades=r.relevantTrades.filter(t=>t.year===year).length;
  // recent trade preview intentionally has a five-event cap: count full archive separately.
  return {year,draftPicks:draft?.recordedSelections??null,keeperPicks:draft?.recordedKeeperSelections??null,
   distinctAdds:waiver?.distinctPlayerAdds??null,
   laterStarts:waiver?.withLaterRecordedStarts??null,
   tradeReceiptCount:r.allTrades.filter(t=>t.year===year).length,
   tradeCoverage:'documented_receipts_only',partial:year===2026};
 });
}
export function renderFrontOffice(r){
 const picks=r.draftYears.find(row=>row.year===2026)||r.draftYears[0];
 const pickPreview=picks?.earlySelections?.map(p=>'<li><strong>R'+p.round+' · #'+p.overall+'</strong><span>'+esc(p.player||'Name unresolved')+'</span></li>').join('')||'<li>Selection names not recovered</li>';
 const trades=r.relevantTrades.map(t=>{
  const side=t.sides.find(s=>s.manager===r.manager||s.manager===alias(r.manager));
  const other=t.sides.filter(s=>s!==side).map(s=>s.manager).join(', ');
  return '<li><div><strong>'+esc(t.date)+'</strong><small>With '+esc(other)+' · '+t.sides.length+' managers</small></div>'+
   '<span>'+esc(side?.assets||'Assets unresolved')+'</span>'+
   '<a href="../../analytics/trade-museum.html?trade='+encodeURIComponent(t.id)+'">View receipt</a></li>';
 }).join('');
 return '<details class="manager-front-office"><summary>Front Office 3.0 <span>Drafts · Trades · Waivers</span></summary>'+
 '<div class="manager-front-office-content"><p>Research inventory, not a grade or ranking of management decisions. Coverage is historical and incomplete.</p>'+
 '<details class="manager-front-office-timeline"><summary>Front-office yearbook <span>Drafts, trades and pickups by season</span></summary>'+
 '<p>Documented counts only. “Not covered” means the available sources cannot confirm activity, not that none occurred. Trade totals refer only to archived receipts.</p>'+
 '<ol>'+frontOfficeTimeline(r).map(y=>'<li><strong>'+y.year+(y.partial?' · partial':'')+'</strong>'+
  '<span>Draft: '+(y.draftPicks===null?'Not covered':y.draftPicks+' recorded selections')+'</span>'+
  '<span>Trades: '+y.tradeReceiptCount+' archived '+(y.tradeReceiptCount===1?'receipt':'receipts')+'</span>'+
  '<span>Pickups: '+(y.distinctAdds===null?'Not covered':y.distinctAdds+' distinct recorded adds')+'</span></li>').join('')+'</ol>'+
 '</details>'+
 '<div class="manager-front-office-metrics">'+
 '<div><small>Draft seasons documented</small><strong>'+number(r.selectedDraftYears)+'</strong></div>'+
 '<div><small>Archived trade receipts</small><strong>'+number(r.documentedTrades)+'</strong></div>'+
 '<div><small>Distinct recorded player pickups</small><strong>'+number(r.distinctAcquisitions)+'</strong></div>'+
 '<div><small>Pickups with later recorded starts</small><strong>'+number(r.acquisitionsWithLaterStarts)+'</strong></div></div>'+
 '<section><h3>Draft room</h3><p>First recorded non-keeper selections for '+picks?.year+'. Unresolved archived player identities remain marked rather than guessed.</p>'+
 '<ul class="manager-front-office-picks">'+pickPreview+'</ul>'+
 '<details><summary>Recorded draft-year coverage</summary><ol>'+
 r.draftYears.map(y=>'<li><strong>'+y.year+'</strong><span>'+number(y.recordedSelections)+' selections · '+number(y.recordedKeeperSelections)+' keepers · '+number(y.unresolvedNames)+' unresolved names</span></li>').join('')+
 '</ol></details><a href="../../analytics/manager-draft-report-cards.html?manager='+encodeURIComponent(r.manager)+'">Explore draft research →</a></section>'+
 '<section><h3>Trade desk</h3><p>Documented museum receipts only. Later trades may be missing; a receipt does not establish a complete trade or a winning side.</p>'+
 (trades?'<ul class="manager-front-office-trades">'+trades+'</ul>':'<p>No certified trade receipts in this archive for this manager.</p>')+
 '<a href="../../analytics/trade-museum.html?manager='+encodeURIComponent(r.manager)+'#trade-filters">Browse all documented trades →</a></section>'+
 '<section><h3>Waiver wire</h3><p>Distinct recorded manager/year/player pickups, not total roster moves. A subsequent start is observed usage, not credit for causing a win.</p>'+
 '<ol class="manager-front-office-waivers">'+r.waiverYears.map(y=>'<li><strong>'+y.year+(y.year===r.waiverPartialYear?' · partial':'')+'</strong><span>'+y.distinctPlayerAdds+' distinct pickups</span><small>'+y.withLaterRecordedStarts+' with later recorded starts</small></li>').join('')+'</ol></section>'+
 '<p class="manager-front-office-footnote">Source scope: draft research through '+esc(r.draftCutoff.year+' Week '+r.draftCutoff.throughWeek)+
 '; acquisition data 2020–2026 (2026 partial, no 2016–2019 ESPN pickups); trade receipts currently end '+esc(r.latestTradeDate||'unknown')+
 '. The 2026 trade and draft research cutoff may differ from the approved score week. Do not infer missing transactions, draft grades or full-season outcomes.</p></div></details>';
}
export async function mountFrontOffice(root,manager){
 const target=root.querySelector('[data-front-office-pulse]');
 if(!target)return;
 try{
  const paths=['manager_draft_trade_profile_evidence_v1.json','manager_acquisition_by_season_v1.json','trade_museum_stage66.json'];
  const replies=await Promise.all(paths.map(p=>fetch('../../data/'+p,{cache:'no-store'})));
  if(replies.some(r=>!r.ok))throw Error('Required research file unavailable');
  const payload=await Promise.all(replies.map(r=>r.json()));
  const evidence=frontOfficeEvidence(...payload,manager);
  target.innerHTML=renderFrontOffice(evidence);
 }catch{
  target.innerHTML='<p class="manager-front-office-unavailable">Front-office research is unavailable. No transactions or grades have been estimated. <a href="../../analytics/trade-museum.html">View archived trade evidence</a>.</p>';
 }
}
