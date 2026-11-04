// Verified Sleeper postseason placements, sourced from user screenshots and source match receipts.
// Championship results and Toilet Bowl outcomes are different competitions.
// "Shitter of the Year" = lower FINAL score in the King (Last Place) game.
const source='../data/sleeper_postseason_placement_receipts_2020_2025.json';
const make=(type,text,className)=>{
 const el=document.createElement(type);
 if(text!==undefined&&text!==null)el.textContent=text;
 if(className)el.className=className;
 return el;
};
const fmt=x=>Number(x).toFixed(2);
function matchLabel(x){
 return x.winner+' '+fmt(x.winnerScore)+' – '+fmt(x.loserScore)+' '+x.loser;
}
function renderSeason(root,s){
 const heading=make('h2','Verified playoff & placement results');
 const intro=make('p','Sleeper bracket screenshots · These are final game scores, not live projections.','placement-intro');
 root.append(heading,intro);
 const main=make('div',null,'placement-grid');
 const championship=s.placementGames.find(x=>x.label==='Championship');
 if(championship){
  const card=make('article',null,'placement-card');
  card.append(make('small','🏆 Championship'),make('strong',championship.winner),make('span',matchLabel(championship)),make('small','Week '+championship.week+' · '+s.year));
  main.append(card);
 }
 const toilet=make('article',null,'placement-card placement-toilet');
 toilet.append(make('small','💩 Shitter of the Year'));
 if(s.toiletBowl){
  toilet.append(make('strong',s.toiletBowl.manager),make('span',s.toiletBowl.manager+' '+fmt(s.toiletBowl.points)+' – '+fmt(s.toiletBowl.opponentPoints)+' '+s.toiletBowl.opponent));
  toilet.append(make('small','Week '+s.toiletBowl.week+' · Lower scorer in the final Toilet Bowl'));
 }else{
  toilet.append(make('strong','Not yet verified'),make('span','The final Toilet Bowl screenshot for '+s.year+' has not been supplied.'));
 }
 main.append(toilet);
 root.append(main);
 const others=s.placementGames.filter(x=>x.label!=='Championship'&&x.label!=='King (Last Place)');
 if(others.length){
  const details=make('details',null,'placement-more');
  const summary=make('summary','View verified placement games');
  const list=make('ul',null,'placement-list');
  for(const game of others){
   const item=make('li');
   item.append(make('strong',game.label),make('span',matchLabel(game)+' · Week '+game.week));
   list.append(item);
  }
  details.append(summary,list);root.append(details);
 }
 if(s.reviewNeeded?.length)root.append(make('p','A third-place result from '+s.year+' has a small screenshot-versus-archive scoring discrepancy and is awaiting verification.','placement-note'));
 if(s.finalPlacements?.length){
  const ranks=make('details',null,'placement-more placement-final-ranks');
  ranks.append(make('summary',s.placementsComplete?'View all 10 final finishing positions':'View verified final finishing positions'));
  const ordered=make('ol',null,'placement-list placement-rank-list');
  for(const entry of s.finalPlacements){
   const li=make('li');
   li.append(make('strong','#'+entry.place+' '+entry.manager),
    make('span',entry.scoreVerified?'Bracket placement verified':'Finishing position verified · exact score under review'));
   ordered.append(li);
  }
  ranks.append(ordered);
  if(!s.placementsComplete)ranks.append(make('p','Some finishing positions remain unverified because those placement games were not shown in the supplied screenshots.','placement-note'));
  root.append(ranks);
 }
 root.append(make('p','These are final postseason placements, not regular-season standings. The 8th-place game does not decide Shitter of the Year. The 2026 season is still underway.','placement-note'));
}
function renderHistory(root,data){
 const heading=make('h2','Hall of Shame · Shitter of the Year');
 const intro=make('p','The manager with the lower final score in the season-ending Toilet Bowl. These results are not counted as positive league records.','placement-intro');
 root.append(heading,intro);
 const list=make('div',null,'placement-shame-list');
 for(const s of [...data.seasons].sort((a,b)=>b.year-a.year)){
  const link=make('a',null,'placement-shame-row');
  link.href='../seasons/'+s.year+'.html#verified-placements';
  const left=make('span',String(s.year),'placement-year');
  const center=make('strong',s.toiletBowl?.manager||'Not yet verified');
  const right=make('span',s.toiletBowl?fmt(s.toiletBowl.points)+' vs '+fmt(s.toiletBowl.opponentPoints)+' ('+s.toiletBowl.opponent+')':'Final screenshot needed','placement-score');
  link.append(left,center,right);list.append(link);
 }
 root.append(list);
 root.append(make('p','All six seasons, 2020–2025, are verified from the labeled final Toilet Bowl screenshots. Six different managers have finished last; no repeat winner so far.','placement-note'));
}
function addCSS(){
 if(document.getElementById('fellas-placement-style'))return;
 const style=make('style');
 style.id='fellas-placement-style';
 style.textContent='.placement-results{max-width:1060px;margin:22px auto;padding:20px;border:1px solid #50687a;border-radius:15px;background:#122b3a;color:#f6f2e9;line-height:1.6;scroll-margin-top:84px}.placement-results h2{font-size:clamp(21px,3.4vw,30px);line-height:1.3;margin:0 0 8px;letter-spacing:-.025em}.placement-intro,.placement-note{color:#c7d5de;font-size:13px;line-height:1.65;margin:0 0 15px}.placement-note{margin:14px 0 0}.placement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.placement-card{padding:16px;background:#0c2231;border:1px solid #4b6577;border-radius:11px;display:flex;flex-direction:column;gap:6px;min-width:0}.placement-card small{font-size:12px;color:#e8c47d;line-height:1.5}.placement-card strong{font-size:clamp(22px,4vw,30px);color:#fff;line-height:1.3}.placement-card span{font-size:13px;color:#d4e1e9;overflow-wrap:anywhere}.placement-toilet{border-color:#6b7488}.placement-more{border:1px solid #4b6577;border-radius:10px;margin-top:13px;padding:0 13px;background:#102432}.placement-more summary{min-height:46px;cursor:pointer;color:#efd397;font-weight:800;font-size:13px;display:flex;align-items:center}.placement-more summary:focus-visible,.placement-shame-row:focus-visible{outline:3px solid #e8c47d;outline-offset:2px}.placement-list{list-style:none;padding:0 0 10px;margin:0}.placement-list li{display:flex;justify-content:space-between;gap:14px;border-top:1px solid #435b6c;padding:11px 2px;font-size:13px;flex-wrap:wrap}.placement-list li span{text-align:right;overflow-wrap:anywhere}.placement-shame-list{display:grid;gap:9px}.placement-shame-row{display:grid;grid-template-columns:60px minmax(100px,1fr) minmax(0,1.5fr);gap:9px;align-items:center;padding:13px 14px;min-height:53px;border:1px solid #4b6577;border-radius:10px;background:#0d2433;text-decoration:none;color:#f6f2e9}.placement-shame-row:hover{border-color:#e8c47d;background:#183649}.placement-year{color:#e8c47d;font-weight:800;font-variant-numeric:tabular-nums}.placement-score{color:#bdceda;font-size:12px;text-align:right;overflow-wrap:anywhere}@media(max-width:650px){.placement-results{padding:15px;margin:16px auto}.placement-grid{grid-template-columns:1fr;gap:9px}.placement-shame-row{grid-template-columns:47px 1fr;gap:3px 10px}.placement-score{grid-column:2;text-align:left}.placement-list li span{text-align:left}}';
style.textContent += '.placement-rank-list li{align-items:center}.placement-rank-list li strong{font-variant-numeric:tabular-nums}.placement-final-ranks{margin-top:10px}.placement-final-ranks .placement-note{margin:0 0 12px}';
 document.head.append(style);
}
async function mount(){
 const seasonYear=document.querySelector('body.season-page header.top h1')?.textContent?.trim();
 const seasonRoot=document.getElementById('verified-placements');
 const historyRoot=document.getElementById('shitter-year-history');
 if(!seasonRoot&&!historyRoot)return;
 addCSS();
 try{
  const response=await fetch(source);
  if(!response.ok)throw Error('Postseason source is unavailable');
  const data=await response.json();
  if(!Array.isArray(data.seasons))throw Error('Invalid placement source');
  if(seasonRoot){
   const s=data.seasons.find(x=>String(x.year)===seasonYear);
   seasonRoot.replaceChildren();
   if(s)renderSeason(seasonRoot,s);
   else seasonRoot.append(make('p','No verified screenshot placement data is available for this season.'));
  }
  if(historyRoot){historyRoot.replaceChildren();renderHistory(historyRoot,data);}
 }catch(error){
  for(const root of [seasonRoot,historyRoot])if(root){root.replaceChildren(make('p','Placement records are temporarily unavailable.'));root.setAttribute('data-placement-error','true');}
  console.error('Verified placement evidence unavailable',error);
 }
}
if(typeof document!=='undefined')mount();
