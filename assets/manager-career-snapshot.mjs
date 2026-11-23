// Manager profile quick-read: regular-season matchups from the delivered canonical ledger.
// No preseason projections, archival starter-points or estimated trade value are mixed in.
export function careerSnapshot(ledger,manager){
 if(!ledger||!Array.isArray(ledger.games))throw Error('Missing canonical game ledger');
 if(typeof manager!=='string'||!manager)throw Error('Missing manager');
 const matches=ledger.games.filter(g=>g.stage==='regular'&&(g.home===manager||g.away===manager)&&
  Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore)&&Number.isInteger(g.year)&&Number.isInteger(g.week));
 if(!matches.length)throw Error('No documented regular-season matchups for '+manager);
 const opponents=new Map();
 const years=new Set();let wins=0,losses=0,ties=0,pf=0,pa=0;
 for(const g of matches){
  years.add(g.year);
  const home=g.home===manager;
  const pts=home?g.homeScore:g.awayScore,against=home?g.awayScore:g.homeScore;
  const other=home?g.away:g.home;
  pf+=pts;pa+=against;
  if(pts>against)wins++;else if(pts<against)losses++;else ties++;
  const o=opponents.get(other)||{name:other,games:0,w:0,l:0,t:0,pf:0,pa:0};
  o.games++;o.pf+=pts;o.pa+=against;
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
  week,sourceUpdated:typeof ledger.updated==='string'?ledger.updated:'Unverified'};
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
  '<p class="manager-pulse-source">Source: canonical ESPN/Sleeper recovered regular-season scoreboards; 2026 through Week '+data.week+
  '. No postseason games or estimated trade outcomes included. Earlier-era coverage has documented limitations. Ledger updated '+esc(data.sourceUpdated)+
  '. <a href="../../data-integrity/source-status.html">Review source status</a>.</p>';
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
 }catch(_){
  root.innerHTML='<h2 id="manager-pulse-heading">Career snapshot unavailable</h2><p class="manager-pulse-source">Verified matchup data could not be loaded. No numbers have been estimated. <a href="../../data-integrity/source-status.html">See source status</a>.</p>';
 }
}
if(typeof document!=='undefined')start();
