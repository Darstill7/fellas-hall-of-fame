(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const M=['Stilly','JMid','Tom','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch'];
const canonical=n=>n==='Tom'?'Thommy':n;
const display=n=>n==='Thommy'?'Tom':n;
const path=location.pathname;
const depth=path.includes('/rivalries/')?(path.endsWith('/')||path.endsWith('/index.html')?'../../':'../'):'../';
const fmt=n=>Number(n).toFixed(2);
fetch(depth+'data/unified_record_book_2016_2026.json').then(r=>{if(!r.ok)throw Error('Historical matchups unavailable');return r.json()}).then(d=>{
 const all=d.games.filter(g=>g.stage==='regular');
 const get=(a,b)=>all.filter(g=>(g.home===canonical(a)&&g.away===canonical(b))||(g.away===canonical(a)&&g.home===canonical(b))).sort((x,y)=>y.year-x.year||y.week-x.week);
 const win=(g,n)=>g.homeScore===g.awayScore?false:(g.homeScore>g.awayScore?g.home:g.away)===canonical(n);
 const margin=g=>Math.abs(g.homeScore-g.awayScore);
 const big=(games,n)=>games.filter(g=>win(g,n)).sort((x,y)=>margin(y)-margin(x))[0];
 const desc=g=>g?g.year+' Week '+g.week+' · '+fmt(margin(g))+' pts ('+fmt(g.homeScore)+'–'+fmt(g.awayScore)+')':'—';
 if(document.body.dataset.rivalryPair){
  const [a,b]=document.body.dataset.rivalryPair.split('|').map(n=>n.toLowerCase()==='jmid'?'JMid':n);
  const games=get(a,b),w=games.filter(g=>win(g,a)).length,l=games.filter(g=>win(g,b)).length,t=games.length-w-l;
  const hero=document.querySelector('.rival-hero');
  if(hero)hero.innerHTML='<div><div class="label">'+E(a)+'</div><div class="metric">'+w+'</div></div><div class="vs">'+w+'–'+l+(t?'–'+t:'')+'</div><div style="text-align:right"><div class="label">'+E(b)+'</div><div class="metric">'+l+'</div></div>';
  const section=document.createElement('section');section.className='section';section.dataset.canonicalRivalry='true';
  section.innerHTML='<h2>Regular-season matchup history</h2><p class="muted rivalry-key-facts">'+games.length+' documented meetings · '+w+' '+E(a)+' wins · '+l+' '+E(b)+' wins'+(t?' · '+t+' ties':'')+'</p><details class="rivalry-game-history"><summary>View all '+games.length+' games and biggest wins</summary><div class="rivalry-game-content"><p class="muted">Largest '+E(a)+' victory: '+E(desc(big(games,a)))+'</p><p class="muted">Largest '+E(b)+' victory: '+E(desc(big(games,b)))+'</p><div class="table-wrap"><table><thead><tr><th>Season</th><th>Week</th><th>'+E(a)+'</th><th>'+E(b)+'</th><th>Winner</th><th>Margin</th></tr></thead><tbody>'+games.map(g=>{const pa=g.home===canonical(a)?g.homeScore:g.awayScore,pb=g.home===canonical(b)?g.homeScore:g.awayScore,winner=g.homeScore===g.awayScore?'Tie':display(g.homeScore>g.awayScore?g.home:g.away);return '<tr><td>'+g.year+'</td><td>'+g.week+'</td><td>'+fmt(pa)+'</td><td>'+fmt(pb)+'</td><td>'+E(winner)+'</td><td>'+fmt(margin(g))+'</td></tr>'}).join('')+'</tbody></table></div><p class="muted">ESPN 2016–2019 and Sleeper 2020 onward, through the latest archived week. Regular season only; postseason excluded. Former owners remain separate.</p></div></details>';

  hero?.closest('section')?.insertAdjacentElement('afterend',section);
  for(const s of document.querySelectorAll('section.section'))if(s!==section&&(s.textContent||'').includes('Series leader')&&(s.textContent||'').includes('Meetings'))s.remove();
 }
 if(document.body.dataset.rivalryMatrix){
  const root=document.getElementById('verified-rivalry-matrix');
  if(root){const cards=[];for(let i=0;i<M.length;i++)for(let j=i+1;j<M.length;j++){
   const a=M[i],b=M[j],games=get(a,b);if(!games.length)continue;
   const w=games.filter(g=>win(g,a)).length,l=games.filter(g=>win(g,b)).length,t=games.length-w-l;
   cards.push('<a class="card c4 manager-card" href="../rivalries/'+a.toLowerCase()+'-vs-'+b.toLowerCase()+'.html"><div class="label">'+games.length+' archived regular-season matchups</div><h2>'+E(a)+' vs '+E(b)+'</h2><div class="metric">'+w+'–'+l+(t?'–'+t:'')+'</div><p class="muted">Biggest '+E(a)+' win: '+(big(games,a)?fmt(margin(big(games,a))):'—')+' · '+E(b)+': '+(big(games,b)?fmt(margin(big(games,b))):'—')+'</p></a>');
  }root.innerHTML=cards.join('');const picker=document.getElementById('rivalry-picker');
  if(picker){
   const first=picker.querySelector('#rivalry-first'),second=picker.querySelector('#rivalry-second');
   const go=picker.querySelector('#rivalry-go'),status=picker.querySelector('#rivalry-picker-status');
   for(const choice of [first,second])for(const name of M){
    const option=document.createElement('option');option.value=name;option.textContent=name;choice.append(option);
   }
   first.value='Stilly';second.value='Tom';
   const update=()=>{
    const valid=first.value!==second.value;
    go.disabled=!valid;
    status.textContent=valid?'Choose two managers to open their matchup history.':'Choose two different managers.';
   };
   first.addEventListener('change',update);
   second.addEventListener('change',update);
   go.addEventListener('click',()=>{
    if(first.value===second.value)return;
    const i=M.indexOf(first.value),j=M.indexOf(second.value);
    const names=i<j?[first.value,second.value]:[second.value,first.value];
    location.href='../rivalries/'+names[0].toLowerCase()+'-vs-'+names[1].toLowerCase()+'.html';
   });
   update();
  }
  }
 }
}).catch(()=>{const root=document.getElementById('verified-rivalry-matrix');if(root)root.textContent='Could not load unified matchup ledger.'});
})();
