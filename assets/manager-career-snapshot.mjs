// Manager profile quick-read: regular-season matchups from the delivered canonical ledger.
// No preseason projections, archival starter-points or estimated trade value are mixed in.
export function careerSnapshot(ledger,manager){
 if(!ledger||!Array.isArray(ledger.games))throw Error('Missing canonical game ledger');
 if(typeof manager!=='string'||!manager)throw Error('Missing manager');
 const matches=ledger.games.filter(g=>g.stage==='regular'&&(g.home===manager||g.away===manager)&&
  Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore)&&Number.isInteger(g.year)&&Number.isInteger(g.week));
 if(!matches.length)throw Error('No documented regular-season matchups for '+manager);
 const opponents=new Map(),seasons=new Map();
 const years=new Set();let wins=0,losses=0,ties=0,pf=0,pa=0;
 for(const g of matches){
  years.add(g.year);
  const home=g.home===manager;
  const pts=home?g.homeScore:g.awayScore,against=home?g.awayScore:g.homeScore;
  const other=home?g.away:g.home;
  pf+=pts;pa+=against;
  const season=seasons.get(g.year)||{year:g.year,games:0,w:0,l:0,t:0,pf:0,pa:0};
  season.games++;season.pf+=pts;season.pa+=against;
  if(pts>against){wins++;season.w++}else if(pts<against){losses++;season.l++}else{ties++;season.t++}
  seasons.set(g.year,season);
  const o=opponents.get(other)||{name:other,games:0,w:0,l:0,t:0,pf:0,pa:0,meetings:[]};
  o.games++;o.pf+=pts;o.pa+=against;
  o.meetings.push({year:g.year,week:g.week,for:pts,against,margin:pts-against});
  if(pts>against)o.w++;else if(pts<against)o.l++;else o.t++;
  opponents.set(other,o);
 }
 const peers=[...opponents.values()].sort((a,b)=>b.games-a.games||a.name.localeCompare(b.name));
 const approvedSeason=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
 const week=Math.max(0,...approvedSeason.map(g=>g.week));
 if(week<1||week>14||!Number.isInteger(week))throw Error('Invalid canonical 2026 cutoff');
 // A through-week label is only safe if every week has five unique matchup pairs.
 for(let w=1;w<=week;w++){
  const round=approvedSeason.filter(g=>g.week===w);
  const managers=round.flatMap(g=>[g.home,g.away]);
  if(round.length!==5||new Set(managers).size!==10||round.some(g=>!Number.isFinite(g.homeScore)||!Number.isFinite(g.awayScore)))
   throw Error('Incomplete canonical Week '+w);
 }
 return {manager,games:matches.length,years:[...years].sort((a,b)=>a-b),wins,losses,ties,pf,pa,
  avgFor:pf/matches.length,avgAgainst:pa/matches.length,opponents:peers,
  seasons:[...seasons.values()].sort((a,b)=>a.year-b.year),week,sourceUpdated:typeof ledger.updated==='string'?ledger.updated:'Unverified'};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const int=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
const dec=n=>new Intl.NumberFormat('en-US',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
const record=r=>r.w+'–'+r.l+(r.t?'–'+r.t:'');
export function renderSnapshot(data){
 const top=data.opponents.slice(0,3);
 return '<div class="manager-pulse-header"><div><p class="manager-pulse-eyebrow">From the verified matchup ledger</p>'+
  '<h2 id="manager-pulse-heading">The career, at a glance</h2>'+
  '<p class="manager-pulse-intro">Documented regular-season results only · '+esc(data.years[0])+'–'+esc(data.years.at(-1))+' · 2026 approved through Week '+data.week+'</p></div>'+
  '<a class="manager-pulse-more" href="../../managers/record-books.html?manager='+encodeURIComponent(data.manager)+'#career-first">Full career records →</a></div>'+
  '<div class="manager-pulse-grid" role="list">'+
  [['Career win rate',dec(100*(data.wins+data.ties/2)/data.games)+'%','Ties count half a win'],
   ['Games',int(data.games),'Documented'],
   ['Points for',int(data.pf),'Regular season'],
   ['Points per game',dec(data.avgFor),'Scored'],
   ['Points against / game',dec(data.avgAgainst),'Allowed']].map(([label,value,note])=>
     '<div class="manager-pulse-tile" role="listitem"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></div>').join('')+'</div>'+
  '<div class="manager-pulse-rivals"><div><h3>Most-played opponents</h3><p>Historical meetings, not an opponent-strength ranking.</p></div>'+
  '<ol>'+top.map(o=>'<li><div><strong>'+esc(o.name)+'</strong><small>'+o.games+' meetings</small></div><span>'+record(o)+' <small>W–L'+(o.t?'–T':'')+'</small></span></li>').join('')+'</ol>'+
  '<a class="manager-pulse-rival-link" href="#head-to-head">Explore every rivalry →</a></div>'+
  renderSeasonTrajectory(data)+
  renderRivalrySpotlight(data)+
  '<p class="manager-pulse-source">Source: canonical ESPN/Sleeper recovered regular-season scoreboards; 2026 through Week '+data.week+
  '. No postseason games or estimated trade outcomes included. Earlier-era coverage has documented limitations. Ledger updated '+esc(data.sourceUpdated)+
  '. <a href="../../data-integrity/source-status.html">Review source status</a>.</p>';
}
// Season trend bars use each manager's documented W-L-T only. Partial and
// reconstructed seasons are never mislabeled as verified final standings.
export function renderSeasonTrajectory(data){
 const rows=data.seasons||[];
 if(!rows.length)return '';
 const peak=[...rows].sort((a,b)=>(b.w+b.t/2)/b.games-(a.w+a.t/2)/a.games||b.games-a.games||a.year-b.year)[0];
 return '<details class="manager-pulse-trajectory"><summary>Career trajectory by season <span>('+rows.length+' documented seasons)</span></summary>'+
  '<div class="manager-pulse-trajectory-content">'+
  '<p>Documented regular-season win percentage, not final league rank. Earlier ESPN/Sleeper coverage varies, and 2026 is still in progress.</p>'+
  '<ol>'+rows.map(s=>{
   const pct=100*(s.w+s.t/2)/s.games;
   const description=s.year===2026?'In progress · through Week '+data.week:'Documented results';
   return '<li><span class="manager-pulse-season-year">'+s.year+'</span>'+
    '<div class="manager-pulse-season-bar" role="img" aria-label="'+esc(s.year+': '+dec(pct)+' percent wins from '+s.games+' documented games')+'"><span style="width:'+pct.toFixed(2)+'%"></span></div>'+
    '<strong>'+dec(pct)+'%</strong><small>'+record(s)+' · '+s.games+' games · '+esc(description)+'</small></li>';
  }).join('')+'</ol>'+
  '<p class="manager-pulse-peak">Highest documented season win rate: '+peak.year+' · '+dec(100*(peak.w+peak.t/2)/peak.games)+'% ('+peak.games+' games). This is not a verified season finish or league rank.</p>'+
  '<a class="manager-pulse-rival-link" href="#season-history">Explore full season history →</a>'+
  '</div></details>';
}
// Rivalries 3.0: exact canonical regular-season receipts, with no postseason
// or speculative trade attribution mixed into the results.
export function rivalryBreakdown(data,opponent){
 const row=data.opponents.find(o=>o.name===opponent);
 if(!row)throw Error('Opponent not found in canonical results: '+opponent);
 const meetings=[...row.meetings].sort((a,b)=>a.year-b.year||a.week-b.week);
 const years=new Map();
 for(const g of meetings){
  const y=years.get(g.year)||{year:g.year,games:0,w:0,l:0,t:0,pf:0,pa:0};
  y.games++;y.pf+=g.for;y.pa+=g.against;
  if(g.margin>0)y.w++;else if(g.margin<0)y.l++;else y.t++;
  years.set(g.year,y);
 }
 const decisive=meetings.filter(g=>g.margin!==0);
 const closest=decisive.length
  ?[...decisive].sort((a,b)=>Math.abs(a.margin)-Math.abs(b.margin)||a.year-b.year||a.week-b.week)[0]
  :null;
 const biggestWin=meetings.filter(g=>g.margin>0).sort((a,b)=>b.margin-a.margin||a.year-b.year||a.week-b.week)[0]||null;
 const biggestLoss=meetings.filter(g=>g.margin<0).sort((a,b)=>a.margin-b.margin||a.year-b.year||a.week-b.week)[0]||null;
 return {manager:data.manager,opponent:row.name,games:row.games,w:row.w,l:row.l,t:row.t,pf:row.pf,pa:row.pa,
  margin:row.pf-row.pa,averageMargin:(row.pf-row.pa)/row.games,meetings,
  seasons:[...years.values()],closest,biggestWin,biggestLoss};
}
const marginText=n=>(n>0?'+':'')+dec(n);
const meetingLabel=g=>'Season '+g.year+' · Week '+g.week+' · '+dec(g.for)+'–'+dec(g.against);
export function renderRivalryComparison(r){
 const notable=[
  ['Closest decided matchup',r.closest],
  ['Largest win',r.biggestWin],
  ['Largest loss',r.biggestLoss]
 ].filter(x=>x[1]);
 return '<div class="manager-rivalry-score"><div><small>Head-to-head</small><strong>'+record(r)+'</strong></div>'+
  '<div><small>Combined scoring margin</small><strong>'+marginText(r.margin)+'</strong></div>'+
  '<div><small>Average margin / meeting</small><strong>'+marginText(r.averageMargin)+'</strong></div></div>'+
  '<div class="manager-rivalry-seasons"><h4>How this rivalry has changed</h4><ol>'+
  r.seasons.map(s=>'<li><strong>'+s.year+'</strong><span>'+record(s)+' <small>W–L'+(s.t?'–T':'')+'</small></span>'+
  '<span class="manager-rivalry-margin">'+marginText(s.pf-s.pa)+' pts</span><small>'+s.games+' documented '+(s.games===1?'meeting':'meetings')+'</small></li>').join('')+
  '</ol></div>'+
  (notable.length?'<div class="manager-rivalry-notables"><h4>Notable matchups</h4><ul>'+
   notable.map(([label,g])=>'<li><span>'+esc(label)+'</span><strong>'+esc(meetingLabel(g))+'</strong><small>Margin '+marginText(g.margin)+'</small></li>').join('')+
   '</ul></div>':'<p>No decided games in the recovered rivalry receipts.</p>')+
  '<details class="manager-rivalry-receipts"><summary>All '+r.games+' documented score receipts</summary><ol>'+
   [...r.meetings].reverse().map(g=>'<li><div><strong>'+g.year+' Week '+g.week+'</strong><small>'+dec(g.for)+'–'+dec(g.against)+'</small></div>'+
    '<span class="manager-rivalry-receipt-outcome">'+(g.margin>0?'Win':g.margin<0?'Loss':'Tie')+'</span><span>'+marginText(g.margin)+' pts</span></li>').join('')+
   '</ol></details>'+
  '<a class="manager-pulse-rival-link" href="../../analytics/rivalry-war-room.html?a='+encodeURIComponent(r.manager)+'&amp;b='+encodeURIComponent(r.opponent)+'">Compare in Rivalry War Room →</a>';
}
export function renderRivalrySpotlight(data){
 if(!data.opponents.length)return '';
 const first=data.opponents[0];
 return '<details class="manager-rivalry-spotlight"><summary>Rivalry deep dive <span>('+data.opponents.length+' documented opponents)</span></summary>'+
  '<div class="manager-rivalry-inner">'+
  '<p>Choose an opponent to compare documented regular-season meetings, scoring margins and annual results. No playoff games or projected results included.</p>'+
  '<label for="manager-rivalry-opponent">Compare against</label>'+
  '<select id="manager-rivalry-opponent" data-rivalry-select>'+
  data.opponents.map(o=>'<option value="'+esc(o.name)+'"'+(o.name===first.name?' selected':'')+'>'+esc(o.name)+' · '+o.games+' '+(o.games===1?'meeting':'meetings')+'</option>').join('')+
  '</select><div data-rivalry-comparison aria-live="polite">'+renderRivalryComparison(rivalryBreakdown(data,first.name))+'</div>'+
  '<p class="manager-pulse-source">Rivalry scores and margins are from documented regular-season matchups, not a judgment of which manager won a trade. Historical coverage and scoring rules vary. '+
  '<a href="#head-to-head">Open full matchup explorer</a>.</p></div></details>';
}
export function attachRivalrySelector(root,data){
 const select=root.querySelector('[data-rivalry-select]');
 const output=root.querySelector('[data-rivalry-comparison]');
 if(!select||!output)return;
 select.addEventListener('change',()=>{
  if(!data.opponents.some(o=>o.name===select.value))return;
  output.innerHTML=renderRivalryComparison(rivalryBreakdown(data,select.value));
 });
}

async function start(){
 const root=document.querySelector('[data-career-snapshot]');
 if(!root)return;
 const manager=root.dataset.careerSnapshot;
 try{
  const response=await fetch('../../data/unified_record_book_2016_2026.json',{cache:'no-store'});
  if(!response.ok)throw Error('Canonical source unavailable');
  const snapshot=careerSnapshot(await response.json(),manager);
  root.innerHTML=renderSnapshot(snapshot);
  attachRivalrySelector(root,snapshot);
 }catch(_){
  root.innerHTML='<h2 id="manager-pulse-heading">Career snapshot unavailable</h2><p class="manager-pulse-source">Verified matchup data could not be loaded. No numbers have been estimated. <a href="../../data-integrity/source-status.html">See source status</a>.</p>';
 }
}
if(typeof document!=='undefined')start();
