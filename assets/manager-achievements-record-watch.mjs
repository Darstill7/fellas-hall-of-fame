import {selectRecordWatch,renderRecordWatchFeed} from './certified-record-watch-feed.mjs';
import {sharedProfileJson} from './manager-mobile-v47.mjs';
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
 const firstWin=games.find(g=>g.result==='W');
 add('first-win','First Blood','Win a regular-season matchup',firstWin);
 for(const n of [25,50,75])add('wins-'+n,n+' Win Club','Win '+n+' regular-season games',games.filter(g=>g.result==='W')[n-1]);
 for(const n of [25,50,100])add('games-'+n,n+' Game Club','Play '+n+' regular-season games',games[n-1]);
 for(const n of [150,175])add('score-'+n,n+' Point Club','Score '+n+' PF in one regular-season matchup',games.find(g=>g.pf>=n*100));
 for(const n of [50,75,100])add('margin-'+n,'Victory by '+n,'Win a regular-season matchup by at least '+n+' PF',games.find(g=>g.margin>=n*100));
 for(const n of [3,5]){let run=0;add('streak-'+n,n+' in a Row','Win '+n+' consecutive archived regular-season games',games.find(g=>{run=g.result==='W'?run+1:0;return run===n}))}
 for(const n of [5,10]){let run=0;add('scoring-streak-'+n,'Century Streak '+n,'Score at least 100 PF in '+n+' consecutive archived regular-season games',games.find(g=>{run=g.pf>=10000?run+1:0;return run===n}))}
 for(const n of [5000,10000,15000,20000]){let total=0;add('career-pf-'+n,n.toLocaleString('en-US')+' PF Club','Score '+n.toLocaleString('en-US')+' career regular-season PF',games.find(g=>(total+=g.pf)>=n*100))}
 add('runner-up','So Close','Finish runner-up in a verified championship',titleEvidence(complete?seasonRows.filter(r=>r.year<2026&&r.finalRank===2).sort((a,b)=>a.year-b.year)[0]:null),complete);
 for(const n of [1,3]){const seasons=bracketComplete?bracketSeasons.filter(b=>(b.participants??b.seeds).map(norm).includes(name)).sort((a,b)=>a.year-b.year):[];add('playoffs-'+n,n===1?'Playoff Debut':'Playoff Regular','Qualify for '+n+' championship brackets',seasons[n-1]?{year:seasons[n-1].year,source:'Verified championship bracket'}:null,bracketComplete)}
 add('one-point-loss','Cruel Finish','Lose by one PF or less',games.find(g=>g.margin<0&&g.margin>=-100));
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
 return Promise.all(files.map(p=>sharedProfileJson(root+'data/'+p)));
}
export async function mountAchievementCabinet({name,host,root='../../'}){
 if(!host||host.querySelector('#gm452-achievements'))return;
 const p=el('section',null,'gm45-records');p.id='gm452-achievements';p.append(el('h2','Franchise trophy cabinet'));
 const status=el('p','Checking historical achievement evidence…','gm45-status');status.setAttribute('role','status');p.append(status);host.append(p);
 try{
 const [core,ledger,guide,endings,espn,sleeper]=await load(root),rows=buildAchievements(core,ledger,guide,endings,[espn,sleeper],name);
 status.textContent=rows.filter(r=>r.status==='earned').length+' of '+rows.length+' achievements earned · regular-season and verified final placement evidence';
 const watchHost=el('section');watchHost.hidden=true;p.append(watchHost);
 const week=core.completedThrough?.week;
 if(Number.isInteger(week))void sharedProfileJson(root+'data/certified-record-watch-feed-v1.json').then(feed=>renderRecordWatchFeed(watchHost,selectRecordWatch(feed,{year:2026,week,surface:'manager',manager:name}),{href:root+'analytics/records.html'})).catch(()=>renderRecordWatchFeed(watchHost,[]));
 const list=el('details');list.append(el('summary','Explore achievements'));
 const grid=el('div',null,'gm45-grid');
 for(const r of rows){const card=el('div',null,'gm45-card');card.dataset.achievement=r.status;card.append(el('small',r.status==='earned'?'✓ Earned':r.status==='locked'?'Locked':'Evidence unavailable'),el('strong',r.label),el('p',r.requirement));if(r.evidence)card.append(el('p',receipt(r.evidence)));grid.append(card)}list.append(grid);p.append(list);
 }catch(e){status.textContent='Achievement evidence unavailable.';console.warn('Achievement cabinet:',e.message)}
}
export async function mountWeeklyRecordWatch({host,root='./'}){
 if(!host||host.querySelector('#gm452-watch'))return;
 const p=el('section',null,'gm45-records');p.id='gm452-watch';p.hidden=true;host.append(p);
 try{
 const [core,feed]=await Promise.all(['career_core_generated.json','certified-record-watch-feed-v1.json'].map(f=>sharedProfileJson(root+'data/'+f)));
 const week=core.completedThrough?.week;
 renderRecordWatchFeed(p,selectRecordWatch(feed,{year:2026,week,surface:'recordBook'}),{href:root+'analytics/records.html'});
 }catch(e){renderRecordWatchFeed(p,[]);console.warn('Certified Record Watch unavailable:',e.message)}
}
