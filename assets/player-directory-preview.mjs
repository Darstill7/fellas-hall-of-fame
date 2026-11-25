const $=id=>document.getElementById(id),root='../data-integrity/player-directory-preview/';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
const fmt=n=>Number(n/100).toLocaleString('en-US',{maximumFractionDigits:2});
let players=[],limit=30,request=0;
const status=t=>$('status').textContent=t;
async function json(path){const r=await fetch(root+path);if(!r.ok)throw Error('Archive unavailable');return r.json()}
function render(){
 const q=$('search').value.trim().toLowerCase(),pos=$('position').value,sort=$('sort').value;
 const filtered=players.filter(p=>(!pos||p.position===pos)&&[p.name,...p.aliases].some(n=>n.toLowerCase().includes(q))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='starts'?b.starts-a.starts:b.pointsCents-a.pointsCents);
 $('count').textContent=filtered.length+' players found';$('results').replaceChildren();
 for(const p of filtered.slice(0,limit)){const b=node('button');b.className='item';b.append(node('strong',p.name+' · '+p.position),node('br'),node('small',fmt(p.pointsCents)+' pts · '+p.starts+' starts'));b.onclick=()=>{location.hash=encodeURIComponent(p.id)};$('results').append(b)}
 $('more').hidden=filtered.length<=limit;
}
function stat(label,value){const d=node('div');d.className='stat';d.append(node('strong',value),node('small',label));return d}
function section(label,items){const d=node('details');d.append(node('summary',label+' · '+items.length));for(const text of items)d.append(node('p',text));return d}
async function route(){
 const token=++request;let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{id='invalid'}
 if(!id){$('directory').hidden=false;$('profile').hidden=true;status('');return}
 const known=players.find(p=>p.id===id);
 if(!known){status('Player not found.');$('directory').hidden=false;$('profile').hidden=true;return}
 status('Loading player history…');
 try{const p=await json(encodeURIComponent(id)+'.json');if(token!==request)return;
 const el=$('profile');el.replaceChildren();
 const back=node('button','← All players');back.onclick=()=>{location.hash=''};el.append(back,node('h2',p.name+' · '+p.position));
 const stats=node('div');stats.className='stats';stats.append(stat('Starter points',fmt(p.pointsCents)),stat('Starts',p.starts),stat('Points per start',fmt(p.averageCents)),stat('Managers represented',p.managerCount));el.append(stats);
 el.append(section('Candidate records',p.records.map(r=>r.label+' — '+r.value+' '+r.unit+(r.shared?' · shared':'')+' · '+r.scope+' · '+r.qualification)),section('Manager history',p.managers.map(m=>m.manager+' · '+fmt(m.pointsCents)+' pts · '+m.starts+' starts')),section('Season history',p.seasons.map(s=>s.year+' · '+fmt(s.pointsCents)+' pts · '+s.starts+' starts')),section('Draft history',p.draft.map(d=>d.year+' · '+d.manager+' · Round '+d.round+' · Pick '+d.overall+(d.keeper?' · Keeper':'')+' · '+(d.identityEvidence==='provider_player_id'?'Provider ID':'Name/position match'))),section('Transaction history',p.transactions.map(t=>t.year+' W'+t.week+' · '+t.type+' · '+t.participants.join(', ')+(t.type==='trade'?' · recipient not established':'')+(t.faabBid!==null?' · $'+t.faabBid:''))),section('Weekly starter performances',p.performances.map(w=>w.year+' W'+w.week+' · '+w.manager+' · '+fmt(w.cents)+' pts')));
 $('directory').hidden=true;el.hidden=false;status('');back.focus();
 }catch(e){if(token===request)status('Player history unavailable.')}
}
for(const id of ['search','position','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>{limit=30;render()});
$('more').onclick=()=>{limit+=30;render()};
window.addEventListener('hashchange',route);
try{const d=await json('index.json');players=d.players;render();await route()}catch(e){status('Research preview data unavailable. Generate the player directory first.')}
