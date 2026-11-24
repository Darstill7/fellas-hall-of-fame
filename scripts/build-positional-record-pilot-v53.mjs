// Positional research only: validate each starter sum against the canonical paired score.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const norm=n=>n==='Tom'?'Thommy':n;
const owners={darstill:'Stilly',birchhh:'Birch',evansbrandonm:'Evans',yogurtslinger15:'Stover',dillionpanthers15:'Stover',thommy:'Thommy',ckuhl5:'Kuhl',dsylvester9:'Stew',huppdawg80:'Mitch',koble2323:'Koble',tsteg:'Tony',jmidd:'JMid',sheffla:'Scott'};
const positions=['QB','RB','WR','TE','DEF'];
const cents=n=>Math.round(n*100);
const ledger=read('unified_record_book_2016_2026.json');
const paired=new Map();
for(const g of ledger.games.filter(g=>g.stage==='regular'&&g.year>=2020)){
 for(const [name,score] of [[g.home,g.homeScore],[g.away,g.awayScore]]){
  const key=[g.year,g.week,norm(name)].join(':');assert.ok(!paired.has(key),key);paired.set(key,cents(score));
 }
}
const accepted=[],excluded=[],seen=new Set(),coverage=[];
for(let year=2020;year<=2026;year++){
 const data=read('player_starts_'+year+'.json');assert.equal(data.year,year);
 for(const w of data.weeks)for(const t of w.teams){
  const owner=String(t.owner).toLowerCase();
  const manager=year===2023&&owner==='jmidd'?'Evans':owners[owner];
  const key=[year,w.week,manager].join(':');
  assert.ok(manager,'Unknown owner '+t.owner);assert.ok(!seen.has(key),'Duplicate '+key);seen.add(key);
  const reason=!paired.has(key)?'No paired regular-season score':t.players.length!==9?'Incomplete starter list':new Set(t.players.map(p=>p[0])).size!==9?'Duplicate starter ID':t.players.some(p=>!p[0]||!positions.includes(p[2])||!Number.isFinite(p[3]))?'Unknown position or score':t.players.reduce((s,p)=>s+cents(p[3]),0)!==paired.get(key)?'Starter sum differs from canonical score':null;
  if(reason){excluded.push({year,week:w.week,manager,reason});continue;}
  const counts=Object.fromEntries(positions.map(p=>[p,t.players.filter(x=>x[2]===p).length]));
  if(counts.QB!==1||counts.DEF!==1||counts.RB<2||counts.WR<2||counts.TE<1){excluded.push({year,week:w.week,manager,reason:'Starter positions do not meet known lineup structure'});continue;}
  accepted.push({year,week:w.week,manager,players:t.players.map(([id,name,position,points])=>({id,name,position,cents:cents(points)}))});
 }
 coverage.push({year,sourceWeeks:data.weeks.map(w=>w.week),pairedTeamWeeks:[...paired.keys()].filter(k=>k.startsWith(year+':')).length,accepted:accepted.filter(x=>x.year===year).length});
}
const records=[];
for(const pos of positions){
 const starts=accepted.flatMap(t=>t.players.filter(p=>p.position===pos).map(p=>({...p,manager:t.manager,year:t.year,week:t.week})));
 const groups=accepted.map(t=>({manager:t.manager,year:t.year,week:t.week,cents:t.players.filter(p=>p.position===pos).reduce((s,p)=>s+p.cents,0)}));
 for(const [kind,rows] of [['individual-starter',starts],['position-group',groups]])for(const dir of ['max','min']){
  assert.ok(rows.length);const value=Math[dir](...rows.map(r=>r.cents));const evidence=rows.filter(r=>r.cents===value);
  records.push({id:pos.toLowerCase()+'-'+kind+'-'+dir,position:pos,kind,direction:dir,value:value/100,unit:'pts',holders:[...new Set(evidence.map(r=>r.manager))].sort(),evidence});
 }
}
// Compare season totals only when every scheduled paired team-week is reconciled.
// Compare career averages at a stated minimum sample; raw career totals are observed only.
const seasonGroups=new Map(),careerGroups=new Map(),weekGroups=new Map();
for(const t of accepted){
 const sk=[t.year,t.manager].join(':');
 for(const [map,key] of [[seasonGroups,sk],[careerGroups,t.manager],[weekGroups,t.year+':'+t.week]]){
  if(!map.has(key))map.set(key,[]);map.get(key).push(t);
 }
}
const expectedSeason=new Map(),expectedWeek=new Map();
for(const key of paired.keys()){
 const [year,week,manager]=key.split(':');
 for(const [map,k] of [[expectedSeason,year+':'+manager],[expectedWeek,year+':'+week]])map.set(k,(map.get(k)||0)+1);
}
const completeSeasons=[...seasonGroups].filter(([key,a])=>a[0].year<2026&&a.length===expectedSeason.get(key)&&a.length>=13);
const completeWeeks=[...weekGroups].filter(([key,a])=>a.length===10&&a.length===expectedWeek.get(key));
const expanded=[];
for(const pos of positions){
 const total=a=>a.reduce((s,t)=>s+t.players.filter(p=>p.position===pos).reduce((q,p)=>q+p.cents,0),0);
 const season=completeSeasons.map(([,a])=>({manager:a[0].manager,year:a[0].year,weeks:a.length,totalCents:total(a),averageCents:Math.round(total(a)/a.length)}));
 const career=[...careerGroups].map(([manager,a])=>({manager,weeks:a.length,totalCents:total(a),averageCents:Math.round(total(a)/a.length)}));
 const titleCounts=new Map(career.map(r=>[r.manager,{manager:r.manager,titles:0,weeks:0}]));
 for(const [,a] of completeWeeks){
  const best=Math.max(...a.map(t=>total([t])));
  for(const t of a){const row=titleCounts.get(t.manager);row.weeks++;if(total([t])===best)row.titles++;}
 }
 const add=(kind,rows,field,dir,unit,qualification)=>{
  if(!rows.length)return;
  const value=Math[dir](...rows.map(r=>r[field]));
  const evidence=rows.filter(r=>r[field]===value);
  expanded.push({id:pos.toLowerCase()+'-'+kind+'-'+dir,position:pos,kind,direction:dir,value:unit==='pts'?value/100:value,unit,qualification,holders:[...new Set(evidence.map(r=>r.manager))].sort(),evidence});
 };
 for(const dir of ['max','min']){
  add('completed-season-total',season,'totalCents',dir,'pts','Completed season with every paired regular-season lineup reconciled; minimum 13 paired weeks; raw totals differ by schedule length');
  add('completed-season-average',season,'averageCents',dir,'pts','Same complete paired-season eligibility; rounded to nearest cent per week');
  add('observed-career-average',career.filter(r=>r.weeks>=50),'averageCents',dir,'pts','At least 50 reconciled paired weeks; observed sample only');
 }
 add('observed-career-total',career,'totalCents','max','pts','Observed reconciled paired weeks only; not a complete career total');
 add('weekly-scoring-titles',[...titleCounts.values()],'titles','max','titles','Only fully reconciled ten-team weeks; ties credited to every co-leader');
}
// Dominance comparisons require both opponents; weekly titles require the entire field.
const indexed=new Map(accepted.map(t=>[[t.year,t.week,t.manager].join(':'),t]));
const pairs=[];
for(const g of ledger.games.filter(g=>g.stage==='regular'&&g.year>=2020)){
 const a=indexed.get([g.year,g.week,norm(g.home)].join(':')),b=indexed.get([g.year,g.week,norm(g.away)].join(':'));
 if(a&&b)pairs.push([a,b],[b,a]);
}
const sum=(t,pos)=>t.players.filter(p=>!pos||p.position===pos).reduce((s,p)=>s+p.cents,0);
for(const pos of positions){
 const titleWeeks=new Map();
 for(const [,a] of completeWeeks){
  const best=Math.max(...a.map(t=>sum(t,pos)));
  for(const t of a){const key=t.year+':'+t.manager;if(!titleWeeks.has(key))titleWeeks.set(key,[]);if(sum(t,pos)===best)titleWeeks.get(key).push(t.week);}
 }
 const titles=[...titleWeeks].map(([key,weeks])=>{const [year,manager]=key.split(':');let run=0,best=0,prev=-1;for(const w of weeks.sort((a,b)=>a-b)){run=w===prev+1?run+1:1;best=Math.max(best,run);prev=w;}return {manager,year:Number(year),weeks,titles:weeks.length,longest:best};});
 const completeTitleSeasons=titles.filter(t=>t.year<2026&&[...expectedWeek].filter(([k])=>k.startsWith(t.year+':')).every(([k,n])=>n===10&&weekGroups.get(k)?.length===10));
 const comparisons=pairs.map(([t,o])=>({manager:t.manager,opponent:o.manager,year:t.year,week:t.week,points:sum(t,pos),opponentPoints:sum(o,pos),edge:sum(t,pos)-sum(o,pos),teamScore:sum(t),opponentScore:sum(o)}));
 const shares=accepted.filter(t=>sum(t)>0).map(t=>({manager:t.manager,year:t.year,week:t.week,positionCents:sum(t,pos),teamCents:sum(t),shareBasisPoints:Math.round(sum(t,pos)/sum(t)*10000)}));
 const add=(kind,rows,field,unit,qualification)=>{
  if(!rows.length)return;
  const value=Math.max(...rows.map(x=>x[field]));
  const evidence=rows.filter(x=>x[field]===value);
  expanded.push({id:pos.toLowerCase()+'-'+kind+'-max',position:pos,kind,direction:'max',value:['pts','%'].includes(unit)?value/100:value,unit,qualification,holders:[...new Set(evidence.map(r=>r.manager))].sort(),evidence});
 };
 add('consecutive-weekly-titles',titles,'longest','weeks','Within one season; incomplete or absent weeks break streak; all ten lineups reconciled; co-leaders count');
 add('season-weekly-titles',completeTitleSeasons,'titles','titles','Completed seasons with all ten paired lineups reconciled for every recorded regular-season week; co-leaders count');
 add('largest-team-scoring-share',shares,'shareBasisPoints','%','Positive total team score; actual NFL position including FLEX; negative other-position points can produce shares above 100%');
 add('highest-position-score-in-loss',comparisons.filter(t=>t.teamScore<t.opponentScore),'points','pts','Both opponents reconciled; actual matchup loss');
 add('largest-head-to-head-position-edge',comparisons,'edge','pts','Both opponents reconciled; actual NFL positions including FLEX');
}
assert.equal(new Set([...records,...expanded].map(r=>r.id)).size,records.length+expanded.length);
records.push(...expanded);
const missing=[...paired.keys()].filter(k=>!seen.has(k));
const output={schemaVersion:1,status:'research-only-incomplete-coverage',scope:'Recovered and score-reconciled Sleeper regular-season starters; position groups include actual NFL positions started in FLEX; no kicker slot; exclude missing, incomplete or mismatched team-weeks',coverage,completePairedManagerSeasons:completeSeasons.length,completeTenTeamWeeks:completeWeeks.length,acceptedTeamWeeks:accepted.length,excludedTeamWeeks:excluded.length,missingPairedTeamWeeks:missing,excluded,categoryCount:records.length,records};
fs.writeFileSync('data-integrity/positional-record-pilot-v53.json',JSON.stringify(output,null,2)+'\n');
console.log('Positional research: '+records.length+' candidates; '+accepted.length+' accepted team-weeks, '+excluded.length+' excluded, '+missing.length+' missing paired team-weeks. Not certified all-era records.');
