import {fellasLeague} from './league-config.mjs';
const leagueId='1340027406009761792';
export function validateRosterSnapshot(data){
 if(data?.schemaVersion!==1||data.leagueId!==leagueId||data.season!==fellasLeague.season||data.collectionType!=='manual-current-roster'||!Number.isFinite(Date.parse(data.collectedAt)))throw Error('Invalid roster evidence');
 if(!Array.isArray(data.slots)||data.slots.join(',')!=='QB,RB,RB,WR,WR,TE,FLEX,FLEX,DEF'||!Array.isArray(data.teams)||data.teams.length!==10)throw Error('Incomplete roster evidence');
 const identity=['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch'];
 for(const [i,name] of identity.entries()){
  const t=data.teams.find(x=>x.manager===name);
  if(!t||t.rosterId!==i+1||typeof t.teamName!=='string'||!t.teamName.trim()||!Number.isInteger(t.startersWeek)||t.startersWeek<1||t.startersWeek>18||!['starters','bench','reserve','taxi'].every(k=>Array.isArray(t[k]))||t.starters.length!==data.slots.length)throw Error('Invalid franchise roster: '+name);
  const players=[...t.starters,...t.bench,...t.reserve,...t.taxi];const ids=new Set();
  for(const p of players){if(!p||typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.name||ids.has(p.id))throw Error('Invalid or duplicate player: '+name);ids.add(p.id)}
 }
 return data;
}
let request;
const load=()=>request??=(fetch(new URL('../data/current-rosters-v1.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Roster unavailable');return r.json()}).then(validateRosterSnapshot).catch(e=>{request=undefined;throw e}));
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!=null)n.textContent=value;if(cls)n.className=cls;return n};
export function mountRoster(host,name){
 const panel=el('details',null,'personal-roster');panel.dataset.manager=name;const summary=el('summary','My roster · optional snapshot');panel.append(summary);const body=el('div',null,'roster-body');panel.append(body);host.append(panel);
 let loaded=false;panel.addEventListener('toggle',async()=>{if(!panel.open||loaded)return;loaded=true;body.replaceChildren(el('p','Loading roster snapshot…','source-note'));try{
 const data=await load();if(!panel.isConnected)return;const team=data.teams.find(t=>t.manager===name);const time=new Date(data.collectedAt);const age=Date.now()-time.getTime();const old=age>24*3600000||age<0;
 body.replaceChildren(el('strong',team.teamName),el('p','Week '+team.startersWeek+' assigned starters · '+(old?'Older snapshot; verify in Sleeper':'Snapshot')+' · '+time.toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})+' local time','source-note'),el('p','Read-only snapshot, not live. Changes after collection may not appear.','source-note'));
 for(const [label,players] of [['Starters',team.starters],['Bench',team.bench],['IR / reserve',team.reserve],['Taxi',team.taxi]]){
  const section=el('section',null,'roster-group');section.append(el('h4',label+' · '+players.length));
  if(!players.length){section.append(el('p','None in snapshot','source-note'));body.append(section);continue}
  for(const [i,p] of players.entries()){const row=el('div',null,'roster-row');row.append(el('span',label==='Starters'?data.slots[i]:(p.position||'—'),'roster-slot'),el('strong',p.name),el('small',[p.team,p.status].filter(Boolean).join(' · ')));section.append(row)}body.append(section)
 }
 }catch{if(panel.isConnected){loaded=false;body.replaceChildren(el('p','Roster snapshot unavailable. Close and reopen to retry.','source-note'))}}});
 return panel;
}
