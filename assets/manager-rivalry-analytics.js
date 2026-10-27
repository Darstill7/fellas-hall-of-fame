(()=>{'use strict';
const root=document.querySelector('[data-rivalry-analytics]');if(!root)return;
const name=root.dataset.rivalryAnalytics==='Tom'?'Thommy':root.dataset.rivalryAnalytics;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=s=>s==='Thommy'?'Tom':s;
fetch('../../data/unified_record_book_2016_2026.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(data=>{
 const games=data.games.filter(g=>g.stage==='regular'&&(g.home===name||g.away===name));
 const opponent=g=>g.home===name?g.away:g.home;
 const scored=g=>g.home===name?g.homeScore:g.awayScore;
 const allowed=g=>g.home===name?g.awayScore:g.homeScore;
 const margin=g=>scored(g)-allowed(g);
 const byOpponent=new Map(),byYear=new Map();
 for(const g of games){
  const o=opponent(g),r=byOpponent.get(o)||{name:o,meetings:0,wins:0,losses:0,ties:0};
  r.meetings++;r[margin(g)>0?'wins':margin(g)<0?'losses':'ties']++;byOpponent.set(o,r);
  const y=byYear.get(g.year)||{year:g.year,games:0,wins:0,losses:0,ties:0,for:0,against:0};
  y.games++;y[margin(g)>0?'wins':margin(g)<0?'losses':'ties']++;y.for+=scored(g);y.against+=allowed(g);byYear.set(g.year,y);
 }
 const tough=[...byOpponent.values()].filter(x=>x.meetings>=3).sort((a,b)=>a.wins/a.meetings-b.wins/b.meetings||b.meetings-a.meetings||a.name.localeCompare(b.name))[0];
 // Retrospective series leader is the opponent that won more than half of the documented head-to-head games.
 const leaderWins=games.filter(g=>margin(g)>0&&(byOpponent.get(opponent(g)).losses>byOpponent.get(opponent(g)).wins)).sort((a,b)=>margin(b)-margin(a))[0];
 const trends=[...byYear.values()].sort((a,b)=>a.year-b.year);
 root.innerHTML='<div class="grid"><div class="tile"><h3>Toughest opponent</h3><p><strong>'+esc(label(tough?.name||'—'))+'</strong> · '+(tough?.wins??0)+'–'+(tough?.losses??0)+' in '+(tough?.meetings??0)+' meetings</p></div><div class="tile"><h3>Biggest win against a series leader</h3><p>'+(leaderWins?'<strong>+'+margin(leaderWins).toFixed(2)+'</strong> vs '+esc(label(opponent(leaderWins)))+' · '+leaderWins.year+' W'+leaderWins.week:'None documented')+'</p></div><div class="tile"><h3>Scoring history</h3><p>Regular-season average points per matchup by season</p></div></div><div class="legends-table"><table><thead><tr><th>Season</th><th>Games</th><th>Record</th><th>Avg scored</th><th>Avg allowed</th></tr></thead><tbody>'+trends.map(x=>'<tr><td>'+x.year+(x.year===2026?'*':'')+'</td><td>'+x.games+'</td><td>'+x.wins+'–'+x.losses+(x.ties?'–'+x.ties:'')+'</td><td>'+(x.for/x.games).toFixed(2)+'</td><td>'+(x.against/x.games).toFixed(2)+'</td></tr>').join('')+'</tbody></table></div><p class="muted" style="font-size:12px;margin-top:10px">Toughest opponent: lowest win percentage with at least three games (ties count as non-wins). Series leader is determined retrospectively from the entire archived regular-season head-to-head record, not odds. *2026 data through Week 7; partial season. Historical ESPN and Sleeper scoring may differ across eras. Postseason excluded.</p>';
}).catch(()=>{root.innerHTML='<p class="muted">Rivalry analytics unavailable.</p>'})})();