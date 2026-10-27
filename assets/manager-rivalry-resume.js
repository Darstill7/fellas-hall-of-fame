(()=>{'use strict';
const root=document.querySelector('[data-rivalry-resume]');if(!root)return;
const manager=root.dataset.rivalryResume==='Tom'?'Thommy':root.dataset.rivalryResume;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=s=>s==='Thommy'?'Tom':s;
fetch('../../data/unified_record_book_2016_2026.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(data=>{
 const games=data.games.filter(g=>g.stage==='regular'&&(g.home===manager||g.away===manager)).sort((a,b)=>a.year-b.year||a.week-b.week);
 const against=g=>g.home===manager?g.away:g.home;
 const margin=g=>g.home===manager?g.homeScore-g.awayScore:g.awayScore-g.homeScore;
 const wins=games.filter(g=>margin(g)>0),losses=games.filter(g=>margin(g)<0),ties=games.length-wins.length-losses.length;
 let streak=0,longest=0;for(const g of games){streak=margin(g)>0?streak+1:0;longest=Math.max(longest,streak)}
 const rivals=new Map();for(const g of games){const other=against(g),r=rivals.get(other)||{name:other,games:0,w:0,l:0,t:0};r.games++;r[margin(g)>0?'w':margin(g)<0?'l':'t']++;rivals.set(other,r)}
 const biggest=[...rivals.values()].sort((a,b)=>b.games-a.games||a.name.localeCompare(b.name))[0];
 const largest=wins.sort((a,b)=>margin(b)-margin(a))[0],closest=losses.sort((a,b)=>margin(b)-margin(a))[0];
 const game=g=>g?g.year+' Week '+g.week+' · '+Math.abs(margin(g)).toFixed(2)+' points vs '+esc(label(against(g))):'No documented result';
 root.innerHTML='<div class="stats"><div class="stat"><strong>'+games.length+'</strong><small>Archived regular-season games</small></div><div class="stat"><strong>'+wins.length+'–'+losses.length+(ties?'–'+ties:'')+'</strong><small>All-time documented record</small></div><div class="stat"><strong>'+longest+'</strong><small>Longest documented win streak</small></div></div><div class="grid"><div class="tile"><h3>Most-played opponent</h3><p><strong>'+esc(label(biggest?.name||'—'))+'</strong> · '+(biggest?.games||0)+' games ('+(biggest?.w||0)+'–'+(biggest?.l||0)+')</p></div><div class="tile"><h3>Largest victory</h3><p>'+game(largest)+'</p></div><div class="tile"><h3>Closest loss</h3><p>'+game(closest)+'</p></div></div><p class="muted" style="font-size:12px">Based on documented regular-season matchups from 2016 through 2026 Week 7. Playoffs excluded; current season partial. Streak counts consecutive archived games, not calendar weeks. Earlier historical owners remain distinct.</p><a href="../../analytics/rivalry-war-room.html" class="btn secondary">Explore every rivalry →</a>';
}).catch(()=>{root.innerHTML='<p class="muted">Rivalry résumé unavailable.</p>'})})();