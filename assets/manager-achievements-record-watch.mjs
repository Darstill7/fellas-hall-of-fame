import {buildPersonalRecords} from './manager-personal-records-v45.mjs';
const norm=n=>n==='Tom'?'Thommy':n;
export function buildAchievements(core,ledger,guide,endings,brackets,name){
 name=norm(name);const d=buildPersonalRecords(core,ledger,name),games=d.receipts;
 const earned=[],add=(id,label,requirement,evidence,available=true)=>earned.push({id,label,requirement,status:evidence?'earned':available?'locked':'unavailable',evidence:evidence??null});
 const seasonRows=endings?.managers?.[name],complete=Array.isArray(seasonRows)&&new Set(seasonRows.map(r=>r.year)).size===seasonRows.length&&Object.keys(core.managers[name].annual).filter(y=>Number(y)<2026).every(y=>seasonRows.some(r=>r.year===Number(y)&&Number.isInteger(r.finalRank)));
 const titles=complete?seasonRows.filter(r=>r.year<2026&&r.finalRank===1&&norm(guide[r.year]?.champion)===name).sort((a,b)=>a.year-b.year):[];
 const titleEvidence=r=>r?{year:r.year,source:r.source}:null;
 add('champion','The Champion','Win a league title',titleEvidence(titles[0]),complete);
 add('dynasty','Dynasty','Win three league titles',titleEvidence(titles[2]),complete);
 let run=0;const streak=games.find(g=>{run=g.result==='W'?run+1:0;return run===8});
 add('unstoppable','Unstoppable','Win eight consecutive archived regular-season games',streak);
 add('century','Century Club','Win 100 regular-season games',d.achievements.find(x=>x.label==='100 career wins')?.game);
 add('machine','Scoring Machine','Score 200 PF in a regular-season game',games.find(g=>g.pf>=20000));
 add('ironman','Ironman','Play 150 regular-season games',games[149]);
 add('heartbroken','Heartbroken','Lose a regular-season matchup by 0.10 PF or less',games.find(g=>g.margin<0&&g.margin>=-10));
 const bracketSeasons=brackets?.flatMap(b=>b?.seasons??[])??[];
 const bracketComplete=bracketSeasons.length===10&&new Set(bracketSeasons.map(b=>b.year)).size===10&&bracketSeasons.every(b=>b.year>=2016&&b.year<=2025&&Array.isArray(b.participants??b.seeds));
 let comeback=null;
 if(bracketComplete)for(const b of bracketSeasons.slice().sort((a,b)=>a.year-b.year)){const first=games.filter(g=>g.year===b.year).slice(0,4);if(first.length===4&&first.every((g,i)=>g.week===i+1&&g.result==='L')&&(b.participants??b.seeds).map(norm).includes(name)){comeback={year:b.year,source:'Verified championship bracket and first four regular-season matchup receipts'};break}}
 add('comeback','The Comeback','Qualify for the championship bracket after starting 0–4',comeback,bracketComplete);
 const shame=complete?seasonRows.filter(r=>r.year<2026&&r.awards?.includes('Shitter of the Year')).sort((a,b)=>a.year-b.year)[0]:null;
 add('rock-bottom','Rock Bottom','Earn verified Shitter of the Year',titleEvidence(shame),complete);
 return earned;
}
export function buildWeeklyRecordWatch(core,ledger,guide,endings,brackets,names){
 const week=core.completedThrough?.week??Number(String(guide['2026']?.summary??'').match(/Week\s+(\d+)/)?.[1]);
 if(!Number.isInteger(week)||week<1||week>14||core.completedThrough&&core.completedThrough.year!==2026)throw Error('Invalid weekly cutoff');
 const current=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
 if(current.length!==week*5)throw Error('Mixed weekly ledger cutoff');
 const latest=current.filter(g=>g.week===week);
 if(latest.length!==5||new Set(latest.flatMap(g=>[norm(g.home),norm(g.away)])).size!==10)throw Error('Incomplete weekly fixtures');
 const before=ledger.games.filter(g=>g.stage==='regular'&&(g.year<2026||g.year===2026&&g.week<week));
 if(!before.length)throw Error('Missing historical baseline');
 const priorHigh=Math.max(...before.flatMap(g=>[Math.round(g.homeScore*100),Math.round(g.awayScore*100)]));
 const high=Math.max(...latest.flatMap(g=>[Math.round(g.homeScore*100),Math.round(g.awayScore*100)]));
 const events=[],near=[];
 for(const name of names){
 const d=buildPersonalRecords(core,ledger,name),g=d.receipts.at(-1);
 if(g.year!==2026||g.week!==week)throw Error('Manager cutoff mismatch');
 for(const r of d.alerts)events.push({type:'personal_record',manager:name,label:r.label,value:r.value/100,evidence:r.game});
 for(const a of d.achievements.filter(a=>a.game===g))events.push({type:'milestone',manager:name,label:a.label,evidence:g});
 for(const a of buildAchievements(core,ledger,guide,endings,brackets,name))if(a.status==='earned'&&a.evidence.year===2026&&a.evidence.week===week)events.push({type:'badge',manager:name,label:a.label,evidence:a.evidence});
 if(g.pf===high&&high>=priorHigh)events.push({type:high>priorHigh?'league_record':'league_record_tied',manager:name,label:'All-time regular-season weekly scoring high',value:high/100,evidence:g});
 for(const m of d.milestones)if(m.unit==='wins'&&m.remaining<=3||m.unit==='games'&&m.remaining<=3||m.unit==='PF'&&m.remaining<=30000)near.push({manager:name,label:m.label,target:m.target/(m.unit==='PF'?100:1),remaining:m.remaining/(m.unit==='PF'?100:1),unit:m.unit});
 }
 return {year:2026,week,events,near,scope:'Archived regular season; raw scoring across eras'};
}

const activeNames=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
const receipt=e=>e.week?e.year+' W'+e.week+(e.opponent?' vs '+e.opponent:'')+' · '+(e.pf/100).toFixed(2)+'–'+(e.pa/100).toFixed(2):String(e.year)+' · '+(e.source??'Verified season evidence');
async function load(root){
 const files=['career_core_generated.json','unified_record_book_2016_2026.json','season_guide.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json'];
 return Promise.all(files.map(async p=>{const r=await fetch(root+'data/'+p);if(!r.ok)throw Error('Unavailable '+p);return r.json()}));
}
export async function mountAchievementCabinet({name,host,root='../../'}){
 if(!host||host.querySelector('#gm452-achievements'))return;
 const p=el('section',null,'gm45-records');p.id='gm452-achievements';p.append(el('h2','Franchise trophy cabinet'));
 const status=el('p','Checking historical achievement evidence…','gm45-status');status.setAttribute('role','status');p.append(status);host.append(p);
 try{
 const [core,ledger,guide,endings,espn,sleeper]=await load(root),rows=buildAchievements(core,ledger,guide,endings,[espn,sleeper],name);
 status.textContent=rows.filter(r=>r.status==='earned').length+' of '+rows.length+' achievements earned · regular-season and verified final placement evidence';
 const list=el('details');list.append(el('summary','Explore achievements'));
 const grid=el('div',null,'gm45-grid');
 for(const r of rows){const card=el('div',null,'gm45-card');card.dataset.achievement=r.status;card.append(el('small',r.status==='earned'?'✓ Earned':r.status==='locked'?'Locked':'Evidence unavailable'),el('strong',r.label),el('p',r.requirement));if(r.evidence)card.append(el('p',receipt(r.evidence)));grid.append(card)}list.append(grid);p.append(list);
 }catch(e){status.textContent='Achievement evidence unavailable.';console.warn('Achievement cabinet:',e.message)}
}
export async function mountWeeklyRecordWatch({host,root='./'}){
 if(!host||host.querySelector('#gm452-watch'))return;
 const p=el('section',null,'gm45-records');p.id='gm452-watch';p.append(el('h2','The Fellas Record Watch'));
 const status=el('p','Checking latest completed-week evidence…','gm45-status');status.setAttribute('role','status');p.append(status);host.append(p);
 try{
 const [core,ledger,guide,endings,espn,sleeper]=await load(root),watch=buildWeeklyRecordWatch(core,ledger,guide,endings,[espn,sleeper],activeNames);
 status.textContent='2026 · Archived completed Week '+watch.week+' · '+watch.scope;
 if(!watch.events.length)p.append(el('p','No qualifying new records or milestones in this completed week.'));
 for(const e of watch.events){const card=el('div',null,'gm45-card');card.append(el('small',e.type.replaceAll('_',' ')),el('strong',e.manager+' · '+e.label),el('p',receipt(e.evidence)));p.append(card)}
 const near=el('details');near.append(el('summary','Milestones within reach ('+watch.near.length+')'));for(const r of watch.near)near.append(el('p',r.manager+' · '+r.remaining+' '+r.unit+' away from '+r.target+' '+r.unit));p.append(near);
 }catch(e){status.textContent='Synchronized weekly record evidence unavailable.';console.warn('Record Watch:',e.message)}
}
