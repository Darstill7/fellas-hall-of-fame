// Independent postseason bracket-derived record candidates; research only.
// node scripts/build-postseason-phase3-candidates.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source='data/postseason_records_verified_v1.json';
const placementsPath='data/fellas_final_placements_2016_2025_verified.json';
const brackets=JSON.parse(fs.readFileSync(source,'utf8')).brackets;
const placements=JSON.parse(fs.readFileSync(placementsPath,'utf8')).seasons;
const norm=name=>name==='Tom'?'Thommy':name;
const years=brackets.map(b=>b.year);
assert.deepEqual(years,Array.from({length:10},(_,i)=>2016+i));
const membership=new Map();
for(const season of placements){
 for(const f of season.finishes){
  const name=norm(f.manager);
  if(!membership.has(name))membership.set(name,[]);
  membership.get(name).push(season.year);
 }
}
const types={
 final:s=>s.finalists,
 semifinal:s=>s.semifinalists,
 bye:s=>s.byes,
 playoff:s=>s.participants,
 champion:s=>[s.champion]
};
for(const s of brackets){
 assert.equal(s.finalists.length,2);
 assert.equal(new Set(s.finalists.map(norm)).size,2);
 assert(s.finalists.map(norm).includes(norm(s.champion)));
 for(const kind of ['final','semifinal','bye']){
  for(const name of types[kind](s).map(norm))
   assert(s.participants.map(norm).includes(name),'Invalid '+kind+' '+s.year+' '+name);
 }
}
const made=(s,name,kind)=>types[kind](s).map(norm).includes(name);
function streaks(name,kind,minimumYear=2016){
 let count=0,start=null,prev=null,best=0,receipt=null;
 for(const s of brackets.filter(s=>s.year>=minimumYear)){
  if(!membership.get(name)?.includes(s.year)){count=0;start=null;prev=null;continue}
  if(made(s,name,kind)){
   if(prev!==s.year-1){count=0;start=s.year}
   count++;prev=s.year;
   if(count>best){best=count;receipt={from:start,through:s.year,seasons:Array.from({length:count},(_,i)=>start+i)}}
  }else{count=0;start=null;prev=null}
 }
 return {value:best,evidence:receipt};
}
const categories=[
 {id:'postseason-consecutive-finals',label:'Most consecutive championship final appearances',unit:'seasons',scope:'2016–2025 completed seasons',kind:'streak',event:'final',firstYear:2016},
 {id:'postseason-consecutive-semifinals',label:'Most consecutive winners-bracket semifinal appearances',unit:'seasons',scope:'2016–2025 completed seasons',kind:'streak',event:'semifinal',firstYear:2016},
 {id:'postseason-consecutive-byes',label:'Most consecutive first-round byes',unit:'seasons',scope:'2018–2025 six-team playoff format',kind:'streak',event:'bye',firstYear:2018},
 {id:'postseason-semis-no-final',label:'Most semifinal appearances without reaching that year’s final',unit:'seasons',scope:'Verified 2016–2025 winners brackets',kind:'count'},
 {id:'postseason-byes-no-final',label:'Most first-round byes without reaching that year’s final',unit:'seasons',scope:'2018–2025 bye-eligible seasons',kind:'count'},
 {id:'postseason-finals-without-bye',label:'Most championship final appearances without a first-round bye',unit:'seasons',scope:'2018–2025 bye-eligible seasons',kind:'count'},
 {id:'postseason-final-conversion',label:'Highest championship-final qualification rate across playoff berths',unit:'percentage',scope:'At least five recovered playoff berths, 2016–2025',kind:'ratio',numerator:'final'},
 {id:'postseason-title-conversion',label:'Highest championship rate across playoff berths',unit:'percentage',scope:'At least five recovered playoff berths, 2016–2025',kind:'ratio',numerator:'champion'}
];
for(const c of categories){
 const entries=[];
 for(const [manager,played] of membership){
  let value=0,evidence=null,denominator=null;
  if(c.kind==='streak'){({value,evidence}=streaks(manager,c.event,c.firstYear))}
  else if(c.kind==='ratio'){
   const ps=brackets.filter(s=>made(s,manager,'playoff')).map(s=>s.year);
   if(ps.length<5)continue;
   const events=brackets.filter(s=>made(s,manager,c.numerator)).map(s=>s.year);
   value=Math.round(events.length/ps.length*100000)/1000;denominator=ps.length;
   evidence={playoffSeasons:ps,eventSeasons:events,eventCount:events.length};
  }else{
   const eligible=brackets.filter(s=>played.includes(s.year)&&(c.id==='postseason-byes-no-final'||c.id==='postseason-finals-without-bye'?s.year>=2018:true));
   const filtered=eligible.filter(s=>
    c.id==='postseason-semis-no-final'?made(s,manager,'semifinal')&&!made(s,manager,'final'):
    c.id==='postseason-byes-no-final'?made(s,manager,'bye')&&!made(s,manager,'final'):
    made(s,manager,'final')&&!made(s,manager,'bye'));
   value=filtered.length;evidence={seasons:filtered.map(s=>s.year)};
  }
  if(value>0)entries.push({manager,value,evidence,...(denominator===null?{}:{denominator})});
 }
 entries.sort((a,b)=>b.value-a.value||a.manager.localeCompare(b.manager));
 let rank=0,last=null;
 for(const [i,entry] of entries.entries()){
  if(entry.value!==last){rank=i+1;last=entry.value}
  entry.rank=rank;
 }
 c.entries=entries.length;c.holders=entries.filter(e=>e.rank===1);
 c.leaders=entries.filter(e=>e.rank<=5);
 delete c.kind;delete c.event;delete c.firstYear;delete c.numerator;
}
const output={schema:'fellas-postseason-phase3-candidates-v1',status:'provisional-not-published',
 sourcePaths:[source,placementsPath],seasonYears:years,categoryCount:categories.length,
 methodology:[
  '2016–2017 bracket contains four teams and no recorded first-round byes; bye-dependent records begin in 2018.',
  'Current Thommy uses provider display alias Tom; unrelated Schermerhorn is a distinct historical owner.',
  'A manager must appear in that season’s verified final placements to be eligible; missing participation never counts as a miss.',
  'Postseason-only championship bracket events; consolation, unclassified score events and Shitter bracket excluded.',
  'Conversion percentages are descriptive, use a minimum five verified playoff berths and are not predictions.',
  'Tied record holders share rank 1 and all are preserved; data remain provisional until independent source audit.'
 ],categories};
assert.equal(categories.length,8);
console.log(JSON.stringify(output,null,2));
