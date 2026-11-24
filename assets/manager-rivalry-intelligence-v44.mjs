// Rivalry Intelligence 4.4. Regular records reconcile to canonical career;
 // archived postseason games are separate, not assumed complete bracket series.
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
export function buildRivalryIntelligence(core,ledger,name){
 name=norm(name);const manager=core.managers?.[name];if(!manager||!Array.isArray(ledger?.games))throw Error('Rivalry sources unavailable');
 const seen=new Set(),groups=new Map();
 for(const g of ledger.games){
  const home=norm(g.home),away=norm(g.away);
  if(home!==name&&away!==name)continue;
  if(home===away||!Number.isInteger(g.year)||!Number.isInteger(g.week)||![g.homeScore,g.awayScore].every(Number.isFinite))throw Error('Invalid rivalry fixture');
  const opponent=home===name?away:home, key=[g.year,g.week,g.stage,...[home,away].sort()].join(':');
  if(seen.has(key))throw Error('Duplicate rivalry fixture');seen.add(key);
  const pf=cents(home===name?g.homeScore:g.awayScore),pa=cents(home===name?g.awayScore:g.homeScore);
  const row={year:g.year,week:g.week,stage:g.stage,era:g.era,opponent,pf,pa,margin:pf-pa,result:pf>pa?'W':pf<pa?'L':'T'};
  const group=groups.get(opponent)||{opponent,regular:[],postseason:[]};
  if(g.stage==='regular')group.regular.push(row);
  else if(['championship_bracket','consolation','postseason_unclassified'].includes(g.stage))group.postseason.push(row);
  else throw Error('Unknown game stage');groups.set(opponent,group);
 }
 const summarize=games=>{
  const ordered=games.slice().sort((a,b)=>b.year-a.year||b.week-a.week);
  const w=games.filter(g=>g.result==='W').length,l=games.filter(g=>g.result==='L').length,t=games.length-w-l;
  const pf=games.reduce((n,g)=>n+g.pf,0),pa=games.reduce((n,g)=>n+g.pa,0);
  let streak=0;for(const g of ordered){if(g.result!==ordered[0].result)break;streak++}
  const chronological=ordered.slice().reverse(),annual=new Map();
  let longestWin=0,longestLoss=0,run=0,last=null;
  for(const g of chronological){
   run=g.result===last?run+1:1;last=g.result;
   if(last==='W')longestWin=Math.max(longestWin,run);
   if(last==='L')longestLoss=Math.max(longestLoss,run);
   const y=annual.get(g.year)??{year:g.year,w:0,l:0,t:0,pf:0,pa:0};
   y[g.result.toLowerCase()]++;y.pf+=g.pf;y.pa+=g.pa;annual.set(g.year,y);
  }
  const heartbreak=Object.fromEntries([1,3,5,10].map(n=>[n,games.filter(g=>g.margin<0&&g.margin>=-100*n).length]));
  return {longestWin,longestLoss,heartbreak,annual:[...annual.values()],games:games.length,w,l,t,pf,pa,net:pf-pa,winPct:games.length?(w+t/2)/games.length:null,streak:streak?ordered[0].result+streak:null,closeGames:games.filter(g=>Math.abs(g.margin)<=500).length,latest:ordered[0]??null,biggestWin:games.filter(g=>g.margin>0).sort((a,b)=>b.margin-a.margin)[0]??null,biggestLoss:games.filter(g=>g.margin<0).sort((a,b)=>a.margin-b.margin)[0]??null,closest:games.slice().sort((a,b)=>Math.abs(a.margin)-Math.abs(b.margin))[0]??null,receipts:ordered};
 };
 const series=[...groups.values()].map(g=>({opponent:g.opponent,regular:summarize(g.regular),postseason:summarize(g.postseason)}));
 for(const r of series){const h=manager.h2h?.[r.opponent],s=r.regular;if(s.games&&(!h||['games','w','l','t'].some(k=>(h[k]??0)!==s[k])))throw Error('Canonical head-to-head mismatch: '+r.opponent)}
 for(const [op,h] of Object.entries(manager.h2h||{}))if(h.games&&!series.some(r=>r.opponent===norm(op)&&r.regular.games===h.games))throw Error('Missing canonical opponent: '+op);
 for(const k of ['games','w','l','t'])if(series.reduce((n,r)=>n+r.regular[k],0)!==(manager[k]??0))throw Error('Career rivalry totals mismatch: '+k);
 const eligible=series.filter(r=>r.regular.games>=3);
 const byRate=(a,b)=>b.regular.winPct-a.regular.winPct||b.regular.games-a.regular.games||a.opponent.localeCompare(b.opponent);
 const longest=series.filter(r=>r.regular.games).sort((a,b)=>b.regular.games-a.regular.games||a.opponent.localeCompare(b.opponent))[0]??null;
 return {name,series:series.sort((a,b)=>b.regular.games-a.regular.games||a.opponent.localeCompare(b.opponent)),longest,best:eligible.slice().sort(byRate)[0]??null,toughest:eligible.slice().sort((a,b)=>a.regular.winPct-b.regular.winPct||b.regular.games-a.regular.games||a.opponent.localeCompare(b.opponent))[0]??null,closest:eligible.slice().sort((a,b)=>Math.abs(a.regular.winPct-.5)-Math.abs(b.regular.winPct-.5)||b.regular.games-a.regular.games||a.opponent.localeCompare(b.opponent))[0]??null};
}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const record=s=>s.w+'–'+s.l+(s.t?'–'+s.t:'');
const points=n=>(n/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const signed=n=>(n>0?'+':'')+points(n);
export async function mountRivalryIntelligence({name,host,root='../../'}){
 if(!host||host.querySelector('#gm44-rivalries'))return;
 const panel=el('section',null,'gm44-rivalries');panel.id='gm44-rivalries';const heading=el('h2','Rivalry intelligence');heading.id='gm44-heading';panel.setAttribute('aria-labelledby',heading.id);
 const status=el('p','Checking career matchup evidence…','gm44-status');status.setAttribute('role','status');panel.append(el('p','FRANCHISE HEADQUARTERS / RIVALRIES','gm44-kicker'),heading,status);host.prepend(panel);
 try{
  const get=async p=>{const r=await fetch(root+'data/'+p);if(!r.ok)throw Error('Unavailable '+p);return r.json()};
  const [core,ledger]=await Promise.all([get('career_core_generated.json'),get('unified_record_book_2016_2026.json')]);
  const d=buildRivalryIntelligence(core,ledger,name);
  status.textContent='Regular-season series reconcile to career totals. Archived postseason games shown separately; raw points across scoring eras are not normalized.';
  const cards=el('div',null,'gm44-cards'),control=el('label','Choose an opponent'),select=el('select'),detail=el('div');detail.setAttribute('aria-live','polite');
  control.append(select);
  for(const r of d.series){const option=el('option',r.opponent+' · '+record(r.regular));option.value=r.opponent;select.append(option)}
  for(const [label,r] of [['Longest rivalry',d.longest],['Best record',d.best],['Toughest opponent',d.toughest],['Most balanced series',d.closest]]){
   if(!r)continue;const b=el('button',null,'gm44-card');b.type='button';b.append(el('small',label),el('strong',r.opponent),el('span',record(r.regular)+' · '+r.regular.games+' games'));b.addEventListener('click',()=>{select.value=r.opponent;render();select.focus()});cards.append(b)
  }
  function render(){
   const r=d.series.find(x=>x.opponent===select.value);detail.replaceChildren();if(!r)return;
   const s=r.regular;detail.append(el('h3',d.name+' vs '+r.opponent));
   const metrics=el('div',null,'gm44-cards');
   for(const [label,value] of [['Regular record',record(s)],['Net scoring margin',signed(s.net)],['Average margin',s.games?signed(s.net/s.games):'—'],['Current series streak',s.streak??'—'],['Games within 5 PF',String(s.closeGames)],['Archived postseason record',r.postseason.games?record(r.postseason):'No games archived']]){const item=el('div',null,'gm44-card');item.append(el('small',label),el('strong',value));metrics.append(item)}detail.append(metrics);
   const evolution=el('details');evolution.append(el('summary','Rivalry evolution by season'));
   let wins=0,losses=0,ties=0;
   for(const y of s.annual){wins+=y.w;losses+=y.l;ties+=y.t;evolution.append(el('p',y.year+' · '+record(y)+' · Series to date '+record({w:wins,l:losses,t:ties})+' · Net PF '+signed(y.pf-y.pa)))}
   detail.append(evolution);
   const heartbreak=el('details');heartbreak.append(el('summary','Heartbreak and dominance'),el('p','Longest winning streak: '+s.longestWin+' · Longest losing streak: '+s.longestLoss));
   for(const n of [1,3,5,10])heartbreak.append(el('p','Losses by '+n+' PF or less: '+s.heartbreak[n]));
   heartbreak.append(el('p','Thresholds are cumulative; a one-point loss counts in every applicable threshold.','gm44-status'));detail.append(heartbreak);
   if(s.games)detail.append(el('p',d.name+' has '+(s.w>s.l?'the winning edge':s.w<s.l?'a losing record':'an even win–loss record')+' against '+r.opponent+' over '+s.games+' regular-season meetings. '+(s.latest?'The most recent result was a '+({W:'win',L:'loss',T:'tie'})[s.latest.result]+' in '+s.latest.year+' Week '+s.latest.week+'.':'')));
   for(const [label,g] of [['Biggest win',s.biggestWin],['Biggest loss',s.biggestLoss],['Closest meeting',s.closest]])if(g)detail.append(el('p',label+': '+g.year+' W'+g.week+' · '+points(g.pf)+'–'+points(g.pa)));
   for(const [label,summary] of [['Regular-season game log',s],['Archived postseason game log',r.postseason]]){const log=el('details');log.append(el('summary',label+' ('+summary.games+')'));for(const g of summary.receipts)log.append(el('p',g.year+' W'+g.week+' · '+g.result+' · '+points(g.pf)+'–'+points(g.pa)+' · '+g.stage.replaceAll('_',' ')));detail.append(log)}
  }
  select.addEventListener('change',render);panel.append(cards,el('p','Best, toughest and most balanced series require at least three regular-season meetings. Ties count as half a win.','gm44-status'),control,detail);if(d.longest)select.value=d.longest.opponent;render();
 }catch(e){status.textContent='Reconciled rivalry intelligence unavailable. Existing head-to-head research remains accessible.';console.warn('Manager 4.4:',e.message)}
}
