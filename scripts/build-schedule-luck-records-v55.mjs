// Exact all-play win credits using a common denominator of 126 (2*7*9).
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const norm=n=>n==='Tom'?'Thommy':n;
const ledger=read('unified_record_book_2016_2026.json');
const brackets=read('verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const weeks=new Map(),seen=new Set();
for(const g of ledger.games.filter(g=>g.stage==='regular')){
 const k=g.year+':'+g.week;if(!weeks.has(k))weeks.set(k,[]);
 for(const [manager,points,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
  assert.ok(Number.isFinite(points)&&Number.isFinite(against));
  const m=norm(manager),id=k+':'+m;assert.ok(!seen.has(id));seen.add(id);
  weeks.get(k).push({manager:m,year:g.year,week:g.week,points:Math.round(points*100),against:Math.round(against*100)});
 }
}
const rows=[],excluded=[];
for(const [key,a] of weeks){
 const n=a[0].year===2016?8:10;if(a.length!==n){excluded.push({key,observed:a.length,required:n});continue;}
 let totalActual=0,totalExpected=0;
 for(const r of a){
  const beaten=a.filter(x=>x.points<r.points).length,tied=a.filter(x=>x.manager!==r.manager&&x.points===r.points).length;
  const actual=r.points>r.against?126:r.points===r.against?63:0;
  const expected=(2*beaten+tied)*63/(n-1);assert.ok(Number.isInteger(expected));
  totalActual+=actual;totalExpected+=expected;
  rows.push({...r,actual,expected,luck:actual-expected,opponentStrength:(2*a.filter(x=>x.points<r.against).length+a.filter(x=>x.points===r.against).length-1)*63/(n-1),opponentPoints:r.against});
 }
 assert.equal(totalActual,n*63);assert.equal(totalExpected,n*63);
}
const group=(data,key)=>{const m=new Map();for(const r of data){const k=key(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return [...m.values()].map(a=>{
 const sum=k=>a.reduce((s,r)=>s+r[k],0),n=a.length;
 return {manager:a[0].manager,year:a.every(r=>r.year===a[0].year)?a[0].year:null,weeks:n,actual:sum('actual'),expected:sum('expected'),luck:sum('luck'),luckRate:Math.round(sum('luck')/126/n*10000),opponentStrength:Math.round(sum('opponentStrength')/126/n*10000),opponentPoints:Math.round(sum('opponentPoints')/n),scoringStrength:Math.round(sum('expected')/126/n*10000)};
});};
const completed=rows.filter(r=>r.year<=2025),seasons=group(completed,r=>r.year+':'+r.manager),career=group(rows,r=>r.manager).filter(r=>r.weeks>=50),finishedCareer=group(completed,r=>r.manager).filter(r=>r.weeks>=50);
const records=[];
const scope='Full-field paired regular-season weeks, ESPN and Sleeper 2016–2026; 2026 included in live career records only; incomplete 2020/2021 Week 14 excluded';
const add=(id,label,a,field,dir,unit,q)=>{
 assert.ok(a.length,id);assert.ok(a.every(r=>Number.isFinite(r[field])),id);
 const mark=Math[dir](...a.map(r=>r[field])),evidence=a.filter(r=>r[field]===mark);
 records.push({id,label,value:unit==='wins'?Number((mark/126).toFixed(3)):mark/100,unit,scope,qualification:q,source:'data/unified_record_book_2016_2026.json',holders:[...new Set(evidence.map(x=>x.manager))].sort().map(manager=>({manager,evidence:evidence.filter(x=>x.manager===manager)}))});
};
for(const [key,a,q] of [['career',career,'At least 50 full-field weeks; includes current season'],['completed-career',finishedCareer,'At least 50 full-field weeks; completed seasons only'],['season',seasons,'Completed seasons only; raw wins differ with season length']]){
 for(const dir of ['max','min']){
  const word=dir==='max'?'Highest':'Lowest';
  add('schedule-luck-'+key+'-'+dir,word+' '+key+' actual minus expected win credits',a,'luck',dir,'wins',q);
  add('schedule-luck-rate-'+key+'-'+dir,word+' '+key+' actual minus all-play win percentage',a,'luckRate',dir,'%',q+'; percentage-point difference');
  add('schedule-strength-'+key+'-'+dir,(dir==='max'?'Hardest':'Easiest')+' '+key+' schedule by opponent scoring percentile',a,'opponentStrength',dir,'%',q+'; normalized weekly opponent all-play strength');
 }
}
const champs=seasons.filter(r=>brackets.some(b=>b.year===r.year&&norm(b.champion)===r.manager));
for(const dir of ['max','min'])add('champion-schedule-luck-'+dir,(dir==='max'?'Highest':'Lowest')+' schedule luck in a Sleeper championship season',champs,'luck',dir,'wins','Completed Sleeper champions 2020–2025 only; regular season');
const missed=seasons.filter(r=>brackets.some(b=>b.year===r.year&&Array.isArray(b.playoffTeams)&&!b.playoffTeams.map(norm).includes(r.manager)));
if(missed.length)add('missed-playoffs-schedule-luck-min','Lowest schedule luck in a verified missed-playoff Sleeper season',missed,'luck','min','wins','Completed Sleeper seasons only; verified playoff field');
assert.equal(new Set(records.map(x=>x.id)).size,records.length);
fs.writeFileSync('data-integrity/schedule-luck-records-v55.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates',scope,categoryCount:records.length,fullWeeks:weeks.size-excluded.length,excluded,records},null,2)+'\n');
console.log('Schedule luck records: '+records.length+' candidates across '+(weeks.size-excluded.length)+' full-field weeks; '+excluded.length+' partial weeks excluded.');
