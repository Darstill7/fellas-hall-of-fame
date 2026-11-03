// Verified manager season evidence, presented without inventing decision-skill grades.
// All figures are read from existing repository research and final-result ledgers.
const root='../../';
const read=async path=>{
 const res=await fetch(root+path);
 if(!res.ok)throw Error('Source unavailable: '+path);
 return res.json();
};
const make=(tag,className,text)=>{
 const element=document.createElement(tag);
 if(className)element.className=className;
 if(text!==undefined)element.textContent=String(text);
 return element;
};
const validCount=n=>Number.isInteger(n)&&n>=0;
export async function mountManagerSeasonEvidence(host,manager){
 const shell=make('details','profile-season-evidence');
 shell.dataset.managerSeasonEvidence=manager;
 const summary=make('summary',null,'Season-by-season evidence · 2016–2026');
 shell.append(summary);
 const status=make('p','muted','Loading season evidence…');
 status.setAttribute('role','status');shell.append(status);
 host.append(shell);
 try{
  const [endings,acquisitions,keeper2025,keeper2026,draftTrade]=await Promise.all([
   read('data/manager_verified_season_endings_v1.json'),
   read('data/manager_acquisition_by_season_v1.json'),
   read('data/keeper_2025_website_research_v1.json'),
   read('data/keeper_2026_website_research_v1.json'),
   read('data/manager_draft_trade_profile_evidence_v1.json')
  ]);
  if(!Array.isArray(endings.managers?.[manager])||
     acquisitions.status!=='observational_not_skill_rating'||
     acquisitions.incompleteYear!==2026||
     draftTrade.status!=='research_only_no_draft_or_trade_skill_grades'||
     draftTrade.seasonCutoff?.throughWeek!==keeper2026.throughWeek||
     !Array.isArray(draftTrade.rows)||
     keeper2025.season!==2025||keeper2026.season!==2026||
     !Number.isInteger(keeper2026.throughWeek)||keeper2026.throughWeek<8||
     keeper2026.throughWeek>14||
     (keeper2026.throughWeek>=9&&Date.now()<Date.parse('2026-11-10T06:00:00Z')))
   throw Error('Incomplete or unsupported season coverage');
  const years=endings.managers[manager];
  const keeperRows=new Map([[2025,keeper2025.rows.find(r=>r.manager===manager)],
   [2026,keeper2026.rows.find(r=>r.manager===manager)]]);
  if(years.length===0||!keeperRows.get(2025)||!keeperRows.get(2026)||
     [2025,2026].some(year=>keeperRows.get(year).officialKeeperDecisionGrade!==null))
   throw Error('Manager keeper evidence absent or unexpectedly scored');
  const byYear=new Map(years.map(row=>[row.year,row]));
  const pickups=new Map(acquisitions.rows.filter(row=>row.manager===manager).map(row=>[row.year,row]));
  const draftAndTrade=new Map(draftTrade.rows.filter(row=>row.manager===manager).map(row=>[row.year,row]));
  if(new Set(years.map(row=>row.year)).size!==years.length||
     draftAndTrade.size!==years.length||years.some(row=>!draftAndTrade.has(row.year)))
   throw Error('Missing or duplicated season draft-trade evidence');
  shell.replaceChildren(summary);
  shell.append(make('p','muted profile-season-evidence-intro',
   'Verified results, source-backed draft selections, qualifying trade records, pickups and keeper production. No invented skill grades or playoff finishes.'));
  const list=make('div','profile-season-evidence-list');
  for(const year of [...byYear.keys()].sort((a,b)=>b-a)){
   const record=byYear.get(year);
   const card=make('article','profile-season-evidence-row');
   const header=make('div','profile-season-evidence-header');
   header.append(make('strong',null,year));
   const ending=record.ending||'Finish not certified';
   // Older 2026 source rows stop at Week 7: do not show a stale W-L as current.
   header.append(make('span',null,year===2026?'Current season · Week '+keeper2026.throughWeek+' research':ending));
   card.append(header);
   const facts=make('p','profile-season-evidence-facts');
   if(year!==2026&&record.regular&&record.regular!=='N/A')
    facts.append(make('span',null,'Regular season '+record.regular));
   if(year===2026)facts.append(make('span',null,'Current W–L not shown; archived record stops before Week 8'));
   const acquired=pickups.get(year);
   if(acquired){
    if(!validCount(acquired.distinctPlayerAdds)||!validCount(acquired.withLaterRecordedStarts)||
       acquired.withLaterRecordedStarts>acquired.distinctPlayerAdds)
     throw Error('Invalid acquisition research for '+year);
    facts.append(make('span',null,acquired.withLaterRecordedStarts+' / '+acquired.distinctPlayerAdds+
     ' recorded pickups later started'+(year===2026?' · partial':'') ));
   }else if(year<2020){
    facts.append(make('span',null,'Pickup receipts unavailable for ESPN era'));
   }
   const keeper=keeperRows.get(year);
   if(keeper){
    if(!Number.isFinite(keeper.regularStartedPoints)||!Array.isArray(keeper.keepers))
     throw Error('Incomplete keeper production for '+year);
    facts.append(make('span',null,keeper.keepers.map(k=>k.name).join(' + ')+
     ' · '+keeper.regularStartedPoints.toFixed(1)+' original-manager starter pts'+
     (year===2026?' · through Week '+keeper2026.throughWeek:'')));
    if(year===2025&&Array.isArray(keeper.verifiedDrops)&&keeper.verifiedDrops.length){
     facts.append(make('span','profile-season-evidence-flag',
      'Verified keeper release: '+keeper.verifiedDrops.map(x=>typeof x==='string'?x:x.player??x.keeper??x.name).filter(Boolean).join(', ')));
    }
   }
   const evidence=draftAndTrade.get(year);
   if(!Number.isInteger(evidence.recordedSelections)||evidence.recordedSelections<1||
      !Array.isArray(evidence.earlySelections)||evidence.earlySelections.length>3||
      !validCount(evidence.recordedKeeperSelections)||!validCount(evidence.unresolvedNames)||
      !validCount(evidence.trades?.representedEvents)||
      !validCount(evidence.trades?.fullyRepresentedEvents)||
      !validCount(evidence.trades?.partialEvents)||
      evidence.trades.fullyRepresentedEvents+evidence.trades.partialEvents!==evidence.trades.representedEvents)
    throw Error('Invalid draft or trade evidence '+year);
   const draft=make('div','profile-season-draft-trade');
   const picked=evidence.earlySelections.map(p=>'R'+p.round+' '+(p.player||'Name unresolved')).join(' · ');
   draft.append(make('p',null,'Draft · '+evidence.recordedSelections+' documented selections'+
      (evidence.recordedKeeperSelections?' ('+evidence.recordedKeeperSelections+' recorded keepers)':'')+
      ' · earliest non-keeper picks: '+(picked||'Not recorded')));
   if(evidence.unresolvedNames)
    draft.append(make('p','muted',evidence.unresolvedNames+' ESPN draft player name(s) unresolved'));
   draft.append(make('p',null,'Trades · '+evidence.trades.representedEvents+
    ' qualifying source-backed event(s)'+
    (evidence.trades.partialEvents?' · '+evidence.trades.partialEvents+' partly represented':'')+
    ' · not trade wins or losses'));
   card.append(facts,draft);
   if(year>=2020){
    const trade=document.createElement('a');
    trade.className='profile-season-trade-link';
    trade.href=root+'analytics/manager-trade-intelligence.html?manager='+
     encodeURIComponent(manager)+'&year='+year;
    trade.textContent='Review '+year+' trade evidence';
    card.append(trade);
   }
   list.append(card);
  }
  shell.append(list);
  const caveat=make('p','muted profile-season-evidence-caveat',
   'Early draft selections are original pick records, not hindsight grades. Unverified trade sides are excluded; qualifying event counts are a lower bound, not total trades or wins. Playoff finishes, pickups and keeper value remain evidence-gated. 2026 is incomplete.');
  shell.append(caveat);
 }catch(error){
  shell.replaceChildren(summary);
  shell.append(make('p','muted','Season evidence unavailable; no estimates substituted.'));
 }
}
