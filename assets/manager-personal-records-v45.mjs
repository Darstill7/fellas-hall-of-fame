import {sharedProfileJson} from './manager-mobile-v47.mjs';
import {buildRecordCategories,findOwnedRecords,recordCategoryLabels,nextRecordChallenger} from './manager-record-ownership.mjs';
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
export function buildPersonalRecords(core,ledger,name){
 name=norm(name);const m=core.managers?.[name];if(!m||!Array.isArray(ledger?.games))throw Error('Personal record source unavailable');
 const games=[],seen=new Set();
 for(const g of ledger.games){if(g.stage!=='regular')continue;const h=norm(g.home),a=norm(g.away);if(h!==name&&a!==name)continue;
 if(h===a||!Number.isInteger(g.year)||!Number.isInteger(g.week)||![g.homeScore,g.awayScore].every(Number.isFinite))throw Error('Invalid matchup');
 const key=g.year+':'+g.week;if(seen.has(key))throw Error('Duplicate regular-season matchup');seen.add(key);
 const pf=cents(h===name?g.homeScore:g.awayScore),pa=cents(h===name?g.awayScore:g.homeScore);games.push({year:g.year,week:g.week,opponent:h===name?a:h,pf,pa,margin:pf-pa,result:pf>pa?'W':pf<pa?'L':'T',era:g.era,source:g.source});
 }
 games.sort((a,b)=>a.year-b.year||a.week-b.week);
 const wins=games.filter(g=>g.result==='W'),losses=games.filter(g=>g.result==='L'),ties=games.length-wins.length-losses.length;
 if(!games.length||games.length!==m.games||wins.length!==m.w||losses.length!==m.l||ties!==(m.t??0))throw Error('Career totals disagree');
 for(const [year,r] of Object.entries(m.annual)){const season=games.filter(g=>g.year===Number(year));if(season.length!==r.games||season.filter(g=>g.result==='W').length!==r.w||season.filter(g=>g.result==='L').length!==r.l||season.filter(g=>g.result==='T').length!==(r.t??0))throw Error('Annual totals disagree')}
 const pick=(rows,score,dir)=>rows.slice().sort((a,b)=>dir*(score(a)-score(b)))[0]??null;
 const marks=[['Highest weekly score',pick(games,g=>g.pf,-1),'pf'],['Lowest weekly score',pick(games,g=>g.pf,1),'pf'],['Largest victory',pick(wins,g=>g.margin,-1),'margin'],['Largest defeat',pick(losses,g=>g.margin,1),'margin'],['Closest victory',pick(wins,g=>g.margin,1),'margin'],['Closest defeat',pick(losses,g=>g.margin,-1),'margin']];
 let winRun=0,lossRun=0,longestWin=0,longestLoss=0,scoringRun=0,longest100=0;
 for(const g of games){winRun=g.result==='W'?winRun+1:0;lossRun=g.result==='L'?lossRun+1:0;scoringRun=g.pf>=10000?scoringRun+1:0;longestWin=Math.max(longestWin,winRun);longestLoss=Math.max(longestLoss,lossRun);longest100=Math.max(longest100,scoringRun)}
 const totalPF=games.reduce((n,g)=>n+g.pf,0);
 const next=(value,step,label,unit)=>{const target=(Math.floor(value/step)+1)*step;return {label,value,target,remaining:target-value,unit}};
 const annual=new Map(),history=[],achievements=[];
 let runningWins=0,runningPF=0,high=-Infinity,largest=0;
 for(const [i,g] of games.entries()){
  const y=annual.get(g.year)??{year:g.year,best:g,worst:g,biggestWin:null};
  if(g.pf>y.best.pf)y.best=g;if(g.pf<y.worst.pf)y.worst=g;
  if(g.margin>0&&(!y.biggestWin||g.margin>y.biggestWin.margin))y.biggestWin=g;annual.set(g.year,y);
  if(g.pf>high){high=g.pf;history.push({label:'New personal scoring high',value:high,game:g})}
  if(g.margin>largest){largest=g.margin;history.push({label:'New largest victory',value:largest,game:g})}
  if(g.result==='W'){runningWins++;if(runningWins%10===0)achievements.push({label:runningWins+' career wins',game:g})}
  if((i+1)%25===0)achievements.push({label:(i+1)+' career games',game:g});
  const previous=runningPF;runningPF+=g.pf;
  for(let threshold=(Math.floor(previous/100000)+1)*100000;threshold<=runningPF;threshold+=100000)achievements.push({label:fmt(threshold/100)+' career PF',game:g});
 }
 const latest=games.at(-1),alerts=history.filter(h=>h.game===latest);
 return {receipts:games,annual:[...annual.values()].reverse(),history:history.reverse(),achievements:achievements.reverse(),alerts,name,marks,longestWin,longestLoss,longest100,totalPF,games:games.length,milestones:[next(m.w,10,'Career wins','wins'),next(m.games,25,'Career games','games'),next(totalPF,100000,'Career scoring','PF')]};
}
export function validateRecordArchive(core,archive){
 if(!Array.isArray(archive?.managers)||new Set(archive.managers.map(m=>norm(m.manager))).size!==archive.managers.length)throw Error('Invalid record archive');
 if(core.completedThrough&&(archive.completedThrough?.year!==core.completedThrough.year||archive.completedThrough?.week!==core.completedThrough.week))throw Error('Mixed record cutoffs');
 for(const [name,m] of Object.entries(core.managers)){const r=archive.managers.find(x=>norm(x.manager)===norm(name));if(!r||['games','w','l','t'].some(k=>(r.regular?.[k]??0)!==(m[k]??0)))throw Error('Record archive disagrees: '+name)}
 return true;
}
// Compare against distinct managers; never convert unlike units into a single gap ranking.
export function buildRecordChase(archive,guide,post,name){
 name=norm(name);
 return buildRecordCategories(archive,guide,post).flatMap(c=>{
  const rows=c.rows.filter(r=>Number.isFinite(r.value));if(!rows.length)return [];
  const best=Math[c.direction](...rows.map(r=>r.value)),mine=rows.filter(r=>norm(r.manager)===name);
  if(!mine.length||best<=0)return [];
  const value=Math[c.direction](...mine.map(r=>r.value)),leaders=[...new Set(rows.filter(r=>r.value===best).map(r=>r.manager))];
  const better=new Set(rows.filter(r=>c.direction==='min'?r.value<value:r.value>value).map(r=>r.manager));
  return [{label:c.label,value,best,leaders,rank:better.size+1,gap:Math.abs(best-value),unit:c.unit,owned:value===best}];
 });
}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
export async function mountPersonalRecordIntelligence({name,host,root='../../'}){
 if(!host||host.querySelector('#gm45-records'))return;
 const panel=el('section',null,'gm45-records');panel.id='gm45-records';const h=el('h2','Personal record book');h.id='gm45-heading';panel.setAttribute('aria-labelledby',h.id);
 const status=el('p','Reconciling career records…','gm45-status');status.setAttribute('role','status');panel.append(el('p','FRANCHISE HEADQUARTERS / RECORDS','gm45-kicker'),h,status);host.append(panel);
 const get=file=>sharedProfileJson(root+'data/'+file);
 try{
 const [core,ledger]=await Promise.all([get('career_core_generated.json'),get('unified_record_book_2016_2026.json')]);
 const d=buildPersonalRecords(core,ledger,name);status.textContent='Reconciled regular-season archive · '+d.games+' games · raw scoring across eras.';
 const marks=el('details');marks.append(el('summary','Personal bests and worsts'));const grid=el('div',null,'gm45-grid');
 for(const [label,g,key] of d.marks){if(!g)continue;const card=el('div',null,'gm45-card');card.append(el('small',label),el('strong',fmt(Math.abs(g[key])/100)+' PF'),el('p',g.year+' W'+g.week+' vs '+g.opponent),el('p',fmt(g.pf/100)+'–'+fmt(g.pa/100)+' · '+g.era));grid.append(card)}marks.append(grid);panel.append(marks);
 const streak=el('details');streak.append(el('summary','Career streak records'),el('p','Longest winning streak: '+d.longestWin),el('p','Longest losing streak: '+d.longestLoss),el('p','Longest 100+ PF streak: '+d.longest100),el('p','Consecutive archived regular-season games, including across seasons. Bye weeks and postseason excluded.','gm45-status'));panel.append(streak);
 const milestone=el('details');milestone.append(el('summary','Career milestone tracker'));
 for(const m of d.milestones){const scale=m.unit==='PF'?100:1,row=el('div',null,'gm45-milestone'),meter=el('meter');meter.min=0;meter.max=m.target;meter.value=m.value;meter.setAttribute('aria-label',m.label+' progress');row.append(el('strong',m.label+' · '+fmt(m.target/scale)),meter,el('p',fmt(m.remaining/scale)+' '+m.unit+' remaining'));milestone.append(row)}panel.append(milestone);
 const receipt=g=>g.year+' W'+g.week+' vs '+g.opponent+' · '+fmt(g.pf/100)+'–'+fmt(g.pa/100);
 const annual=el('details');annual.append(el('summary','Annual personal bests'));for(const y of d.annual){annual.append(el('h3',String(y.year)),el('p','Highest score: '+receipt(y.best)),el('p','Lowest score: '+receipt(y.worst)));if(y.biggestWin)annual.append(el('p','Largest victory: '+receipt(y.biggestWin)))}panel.append(annual);
 const history=el('details');history.append(el('summary','Personal record progression'));for(const r of d.history)history.append(el('p',r.label+' · '+fmt(r.value/100)+' PF · '+receipt(r.game)));panel.append(history);
 const milestones=el('details');milestones.append(el('summary','Milestone history'));for(const r of d.achievements)milestones.append(el('p',r.label+' · '+receipt(r.game)));panel.append(milestones);
 if(d.alerts.length){const alerts=el('div',null,'gm45-card');alerts.append(el('small','Latest archived matchup · new personal records'));for(const r of d.alerts)alerts.append(el('p',r.label+' · '+fmt(r.value/100)+' PF · '+receipt(r.game)));panel.prepend(alerts)}
 const ownership=el('details');ownership.append(el('summary','League record holdings'));panel.append(ownership);
 try{const [archive,guide,espn,sleeper,placements,placementReceipts,allEra]=await Promise.all(['manager_record_books_2016_2026.json','season_guide.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','fellas_final_placements_2020_2025.json','sleeper_postseason_placement_receipts_2020_2025.json','fellas_final_placements_2016_2025_verified.json'].map(get));
 validateRecordArchive(core,archive);const post={espn,sleeper,placements,placementReceipts,allEra};
 const owned=findOwnedRecords(archive,guide,d.name,post);ownership.append(el('p',owned.length+' of '+recordCategoryLabels.length+' supported ownership categories · includes former managers.'));
 for(const r of owned){const card=el('div',null,'gm45-card');card.append(el('small',r.label),el('strong',fmt(r.value)+' '+r.unit),el('p',r.shared?'Shared league record':'League record'),el('p',r.context));const next=nextRecordChallenger(archive,guide,r.label,post);if(next)card.append(el('p','Nearest different-manager challenger: '+next.manager+' · Gap '+fmt(next.gap)+' '+next.unit));ownership.append(card)}
 const chase=el('details');chase.append(el('summary','Record chase and league rankings'));
 const ranks=buildRecordChase(archive,guide,post,d.name);
 for(const r of ranks){const card=el('div',null,'gm45-card');card.append(el('small',r.label),el('strong','#'+r.rank+' · '+fmt(r.value)+' '+r.unit),el('p',r.owned?'Record holder':'Gap to tie: '+fmt(r.gap)+' '+r.unit+' · Leader: '+r.leaders.join(', ')));chase.append(card)}
 chase.append(el('p','Historical gaps are descriptive, not forecasts. Completed-season records require a completed season; minimum eligibility rules remain in effect.','gm45-status'));panel.append(chase);
 if(!owned.length)ownership.append(el('p','No league-leading record in this supported category set. Personal bests are available above.'));
 }catch{ownership.append(el('p','Synchronized league record ownership unavailable.'))}
 const link=el('a','Open complete record book →');link.href=root+'managers/record-books.html?manager='+encodeURIComponent(d.name)+'#owned-records';panel.append(link);
 }catch(e){status.textContent='Reconciled personal record book unavailable. Existing archive remains accessible.';console.warn('Manager 4.5:',e.message)}
}
