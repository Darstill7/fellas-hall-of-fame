import {buildFranchiseTimeline} from './manager-franchise-timeline-v43.mjs';
import {buildPersonalRecords} from './manager-personal-records-v45.mjs';
import {buildRivalryIntelligence} from './manager-rivalry-intelligence-v44.mjs';
import {managerPersonas} from './manager-personas.mjs';
const norm=n=>n==='Tom'?'Thommy':n;
const pf=n=>(n/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const record=r=>r.w+'–'+r.l+(r.t?'–'+r.t:'');
const gameText=g=>g.year+' Week '+g.week+' against '+g.opponent+' ('+pf(g.pf)+'–'+pf(g.pa)+')';
export function buildFranchiseLegends(core,ledger,guide,endings,name){
 name=norm(name);
 const timeline=buildFranchiseTimeline(core,guide,endings,name),personal=buildPersonalRecords(core,ledger,name),rivalries=buildRivalryIntelligence(core,ledger,name);
 const complete=timeline.filter(r=>!r.active),titles=complete.filter(r=>r.finish===1),finals=complete.filter(r=>r.finish===1||r.finish===2),shame=complete.filter(r=>r.award);
 const career=core.managers[name],first=timeline.at(-1),moments=[];
 const add=(kind,headline,story,evidence)=>moments.push({kind,headline,story,evidence});
 for(const r of titles)add('glory',r.year+' · Championship season',name+' finished the regular season '+record(r)+' before winning the league championship.',{year:r.year,source:r.source,finish:r.finish});
 for(const r of finals.filter(r=>r.finish===2))add('finals',r.year+' · One step short',name+' reached the championship game after a '+record(r)+' regular season.',{year:r.year,source:r.source,finish:r.finish});
 for(const r of shame)add('shame',r.year+' · Rock bottom',name+' finished last and earned Shitter of the Year.',{year:r.year,source:r.source,finish:r.finish});
 const high=personal.marks[0][1],low=personal.marks[1][1],big=personal.marks[2][1],close=personal.marks[4][1];
 if(high)add('scoring','The scoring ceiling',name+' set the archived personal scoring high of '+pf(high.pf)+' PF in '+gameText(high)+'.',high);
 if(low)add('shame','The scoring floor',name+' recorded the archived personal scoring low of '+pf(low.pf)+' PF in '+gameText(low)+'.',low);
 if(big)add('glory','The biggest statement',name+' won by '+pf(big.margin)+' PF in '+gameText(big)+'.',big);
 if(close)add('classic','A win by the narrowest margin',name+' prevailed by '+pf(close.margin)+' PF in '+gameText(close)+'.',close);
 const best=complete.slice().sort((a,b)=>b.winPct-a.winPct||a.year-b.year)[0];
 if(best)add('season','The regular-season benchmark',best.year+' produced a '+record(best)+' record and '+(100*best.winPct).toFixed(1)+'% win rate. Final placement: '+(best.finish??'unavailable')+'.',{year:best.year,source:'Reconciled season guide',winPct:best.winPct});
 const chapters=[];
 for(const r of timeline.slice().reverse()){
 const label=r.active?'The unfinished chapter':r.finish===1?'The championship chapter':r.finish===2?'The near miss':r.award?'The bottom of the bracket':r.winPct>.5?'A winning campaign':r.winPct<.5?'A losing campaign':'An even campaign';
 chapters.push({year:r.year,label,story:'Regular season: '+record(r)+'. Scoring rank '+r.scoringRank+' of '+r.leagueSize+'. '+(r.active?'Season remains in progress.':r.finish?'Verified final placement: '+r.finish+'.':'Final placement unavailable.'),source:r.source??'Reconciled season guide'});
 }
 const classics=personal.receipts.slice().sort((a,b)=>Math.abs(a.margin)-Math.abs(b.margin)||b.pf+b.pa-a.pf-a.pa||a.year-b.year||a.week-b.week).slice(0,5);
 const rival=rivalries.longest;
 const biography=name+' first appears in the '+first.year+' archive. Across '+timeline.length+' archived seasons, the franchise has played '+career.games+' regular-season games with a '+record(career)+' record. '+(titles.length?('Verified championship seasons: '+titles.map(r=>r.year).sort().join(', ')+'.'):'No championship appears in the completed-season archive.')+' '+(finals.length?'Championship-game appearances: '+finals.length+'.':'');
 return {name,persona:managerPersonas[name]?.name??name,biography,moments,chapters,classics,rival:rival?{opponent:rival.opponent,games:rival.regular.games,record:record(rival.regular),net:rival.regular.net}:null,milestones:personal.milestones};
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
export async function mountFranchiseLegends({name,host,root='../../'}){
 if(!host||host.querySelector('#gm46-legends'))return;
 const p=el('section',null,'gm46-legends');p.id='gm46-legends';p.append(el('p','THE FELLAS / FRANCHISE LEGENDS','gm46-kicker'),el('h2','The story behind the numbers'));
 const status=el('p','Checking historical evidence…','gm46-status');status.setAttribute('role','status');p.append(status);host.append(p);
 const get=async file=>{const r=await fetch(root+'data/'+file);if(!r.ok)throw Error('Unavailable '+file);return r.json()};
 try{
 const [core,ledger,guide,endings]=await Promise.all(['career_core_generated.json','unified_record_book_2016_2026.json','season_guide.json','manager_verified_season_endings_v1.json'].map(get));
 const d=buildFranchiseLegends(core,ledger,guide,endings,name);status.textContent='Archive-backed editorial summary · nickname is not an official award.';
 p.append(el('h3',d.persona),el('p',d.biography));
 const moments=el('details');moments.append(el('summary','Defining moments · glory and shame'));
 for(const m of d.moments){const card=el('article',null,'gm46-story');card.dataset.kind=m.kind;card.append(el('small',m.kind),el('h4',m.headline),el('p',m.story),el('small','Evidence: '+(m.evidence.source??'Reconciled matchup archive')));moments.append(card)}p.append(moments);
 const chapters=el('details');chapters.append(el('summary','Every franchise chapter'));for(const c of d.chapters)chapters.append(el('h4',c.year+' · '+c.label),el('p',c.story));p.append(chapters);
 if(d.rival){const r=el('details');r.append(el('summary','Signature rivalry · most meetings'),el('p',d.rival.opponent+' · '+d.rival.record+' over '+d.rival.games+' regular-season games.'),el('p','Net scoring margin: '+pf(d.rival.net)+' PF.'));const link=el('a','Explore head-to-head research');link.href='#rivalry-analytics';r.append(link);p.append(r)}
 const classics=el('details');classics.append(el('summary','Forgotten classics · five closest games'));for(const g of d.classics)classics.append(el('p',gameText(g)+' · '+g.result+' · margin '+pf(Math.abs(g.margin))+' PF'));p.append(classics);
 const future=el('details');future.append(el('summary','Unfinished business'));for(const m of d.milestones){const scale=m.unit==='PF'?100:1;future.append(el('p',m.label+': '+m.remaining/scale+' '+m.unit+' to reach '+m.target/scale))}p.append(future);
 }catch(e){status.textContent='Reconciled franchise story unavailable; existing historical articles remain accessible.';console.warn('Manager 4.6:',e.message)}
}
