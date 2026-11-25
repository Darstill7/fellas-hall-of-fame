// Stable Sleeper player IDs, observed actual starts only. No ESPN player performance inferred.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=JSON.parse(fs.readFileSync('data-integrity/reconciled-starter-evidence-v53.json','utf8'));
assert.equal(input.schemaVersion,1);
const rows=[],seen=new Set(),byId=new Map();
for(const team of input.accepted){
 for(const p of team.players){
  const id=String(p.id),key=[team.year,team.week,id].join(':');
  assert.ok(!seen.has(key),'Player credited twice in one week '+key);seen.add(key);
  assert.ok(id&&p.name&&Number.isSafeInteger(p.cents));
  const r={id,name:p.name,position:p.position,manager:team.manager,year:team.year,week:team.week,cents:p.cents};
  rows.push(r);
  if(!byId.has(id))byId.set(id,[]);byId.get(id).push(r);
 }
}
assert.equal(rows.length,input.accepted.length*9);
const summarize=a=>({pointsCents:a.reduce((s,r)=>s+r.cents,0),starts:a.length,zeroStarts:a.filter(r=>r.cents===0).length,negativeStarts:a.filter(r=>r.cents<0).length,averageCents:Math.round(a.reduce((s,r)=>s+r.cents,0)/a.length)});
const groups=(a,key)=>{const m=new Map();for(const r of a){const k=key(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return [...m.values()];};
const players=[...byId].map(([id,a])=>{
 const latest=[...a].sort((x,y)=>y.year-x.year||y.week-x.week)[0];
 return {id,name:latest.name,position:latest.position,aliases:[...new Set(a.map(r=>r.name))].sort(),positions:[...new Set(a.map(r=>r.position))].sort(),...summarize(a),managerCount:new Set(a.map(r=>r.manager)).size,seasonCount:new Set(a.map(r=>r.year)).size,first:{year:a[0].year,week:a[0].week},latest:{year:latest.year,week:latest.week},managers:groups(a,r=>r.manager).map(b=>({manager:b[0].manager,...summarize(b)})),seasons:groups(a,r=>r.year).map(b=>({year:b[0].year,...summarize(b)})),performances:a};
}).sort((a,b)=>b.pointsCents-a.pointsCents||a.id.localeCompare(b.id));
const records=[];
const scope='Observed reconciled Sleeper regular-season starters 2020–2026; missing team-weeks and ESPN player history excluded';
const add=(id,label,a,key,dir,unit,qualification,ownerType='player')=>{
 assert.ok(a.length,id);assert.ok(a.every(r=>Number.isFinite(r[key])),id);
 const mark=Math[dir](...a.map(r=>r[key])),evidence=a.filter(r=>r[key]===mark);
 records.push({id,label,ownerType,value:unit==='pts'?mark/100:mark,unit,scope,qualification,holders:[...new Set(evidence.map(r=>r.id))].sort().map(id=>({playerId:id,name:players.find(p=>p.id===id).name,evidence:evidence.filter(r=>r.id===id).map(({performances,...r})=>r)}))});
};
const q='Actual observed started points only; incomplete coverage; no bench or projected production';
for(const dir of ['max','min'])add('player-single-game-'+dir,(dir==='max'?'Highest':'Lowest')+' observed individual player score',rows,'cents',dir,'pts',q);
for(const [key,label,unit] of [['pointsCents','career starter points','pts'],['starts','career starts','starts'],['managerCount','different managers started for','managers'],['seasonCount','seasons with a recorded start','seasons'],['zeroStarts','zero-point starts','starts'],['negativeStarts','negative-point starts','starts']])add('player-career-'+key+'-max','Most observed '+label,players,key,'max',unit,q);
for(const dir of ['max','min'])add('player-career-average-'+dir,(dir==='max'?'Highest':'Lowest')+' observed career points per start',players.filter(p=>p.starts>=30),'averageCents',dir,'pts',q+'; minimum 30 starts');
for(const pos of ['QB','RB','WR','TE','DEF']){
 const eligible=players.filter(p=>p.positions.length===1&&p.position===pos);
 add('player-'+pos.toLowerCase()+'-career-points','Most observed career starter points at '+pos,eligible,'pointsCents','max','pts',q+'; stable recorded position');
 add('player-'+pos.toLowerCase()+'-career-starts','Most observed career starts at '+pos,eligible,'starts','max','starts',q+'; stable recorded position');
}
const franchise=groups(rows,r=>r.id+':'+r.manager).map(a=>({id:a[0].id,name:a[0].name,manager:a[0].manager,...summarize(a)}));
add('player-franchise-points','Most observed points for one fantasy manager',franchise,'pointsCents','max','pts',q);
add('player-franchise-starts','Most observed starts for one fantasy manager',franchise,'starts','max','starts',q);
// Completed-season player records are observed totals, not full-season NFL scoring.
const completed=rows.filter(r=>r.year<=2025);
const playerSeasons=groups(completed,r=>r.id+':'+r.year).map(a=>({id:a[0].id,name:a[0].name,year:a[0].year,...summarize(a),managerCount:new Set(a.map(r=>r.manager)).size}));
const franchiseSeasons=groups(completed,r=>r.id+':'+r.manager+':'+r.year).map(a=>({id:a[0].id,name:a[0].name,manager:a[0].manager,year:a[0].year,...summarize(a)}));
const longevity=groups(rows,r=>r.id+':'+r.manager).map(a=>({id:a[0].id,name:a[0].name,manager:a[0].manager,seasons:new Set(a.map(r=>r.year)).size,...summarize(a)}));
add('player-season-points','Most observed starter points in one completed season',playerSeasons,'pointsCents','max','pts',q+'; completed 2020–2025 only');
add('player-season-starts','Most observed starts in one completed season',playerSeasons,'starts','max','starts',q+'; completed 2020–2025 only');
for(const dir of ['max','min'])add('player-season-average-'+dir,(dir==='max'?'Highest':'Lowest')+' observed points per start in one completed season',playerSeasons.filter(x=>x.starts>=10),'averageCents',dir,'pts',q+'; completed 2020–2025, minimum 10 starts');
add('player-season-manager-count','Most different fantasy managers started for in one completed season',playerSeasons,'managerCount','max','managers',q+'; completed 2020–2025 only');
add('player-franchise-season-points','Most observed starter points for one manager in one completed season',franchiseSeasons,'pointsCents','max','pts',q+'; completed 2020–2025 only');
add('player-franchise-season-starts','Most observed starts for one manager in one completed season',franchiseSeasons,'starts','max','starts',q+'; completed 2020–2025 only');
add('player-franchise-longevity','Most distinct seasons started for one fantasy manager',longevity,'seasons','max','seasons',q+'; not continuous roster tenure');
for(const pos of ['QB','RB','WR','TE','DEF']){
 const eligible=playerSeasons.filter(s=>players.find(p=>p.id===s.id).positions.length===1&&players.find(p=>p.id===s.id).position===pos);
 add('player-'+pos.toLowerCase()+'-season-points','Most observed starter points at '+pos+' in one completed season',eligible,'pointsCents','max','pts',q+'; completed 2020–2025 only; stable recorded position');
}
const streaks=(key,predicate)=>{
 const out=[];
 for(const a of groups(rows,key)){
  let run=[];
  for(const x of [...a].sort((a,b)=>a.week-b.week)){
   if(!predicate(x)){run=[];continue;}
   if(run.length&&x.week!==run.at(-1).week+1)run=[];
   run.push(x);
   out.push({id:x.id,name:x.name,year:x.year,manager:key(x).split(':').length===3?x.manager:undefined,firstWeek:run[0].week,lastWeek:x.week,length:run.length,performances:run.map(r=>({week:r.week,manager:r.manager,cents:r.cents}))});
  }
 }
 return out;
};
add('player-consecutive-starts','Most consecutive observed weekly starts in one season',streaks(r=>r.id+':'+r.year,()=>true),'length','max','weeks',q+'; missing weeks break streak');
add('player-franchise-consecutive-starts','Most consecutive observed weekly starts for one manager in one season',streaks(r=>r.id+':'+r.year+':'+r.manager,()=>true),'length','max','weeks',q+'; missing weeks break streak');
for(const threshold of [1000,2000,3000]){
 add('player-scoring-streak-'+threshold/100,'Most consecutive observed starts scoring at least '+threshold/100+' points',streaks(r=>r.id+':'+r.year,x=>x.cents>=threshold),'length','max','weeks',q+'; within season, missing weeks break streak');
 const counts=players.map(p=>({id:p.id,name:p.name,count:p.performances.filter(x=>x.cents>=threshold).length}));
 add('player-career-threshold-'+threshold/100,'Most observed career starts scoring at least '+threshold/100+' points',counts,'count','max','starts',q);
}
assert.equal(records.length,43);
const output={schemaVersion:1,status:'research-only-incomplete-coverage',scope,coverage:input.coverage,missingPairedTeamWeeks:input.missingPairedTeamWeeks,excludedTeamWeeks:input.excluded.length,playerCount:players.length,starterPerformances:rows.length,categoryCount:records.length,records,players};
fs.writeFileSync('data-integrity/player-hall-of-fame-v56.json',JSON.stringify(output,null,2)+'\n');
console.log('Player Hall of Fame: '+records.length+' player-owned candidates; '+players.length+' distinct Sleeper IDs; '+rows.length+' reconciled starter performances.');
