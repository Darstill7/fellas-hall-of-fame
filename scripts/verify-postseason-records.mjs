// Keep postseason record summaries bound to provider-verified bracket and score sources.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const d=read('data/postseason_records_verified_v1.json');
const espn=read('data/verified_espn_playoff_brackets_2016_2019.json');
const sleeper=read('data/verified_sleeper_playoff_brackets_2020_2025.json');
const unified=read('data/unified_record_book_2016_2026.json');
const n=v=>v==='Thommy'?'Tom':v;
const source=[...espn.seasons,...sleeper.seasons].sort((a,b)=>a.year-b.year);
assert.equal(d.seasonCount,10);
assert.equal(source.length,10);
assert.deepEqual(source.map(x=>x.year),Array.from({length:10},(_,i)=>2016+i));
assert.deepEqual(d.brackets.map(x=>x.year),source.map(x=>x.year));
assert.equal(new Set(d.managers.map(x=>x.manager)).size,d.managers.length,'Unique manager identity');
for(const name of ['Stilly','Stew','Tom','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'])
 assert(d.managers.some(x=>x.manager===name),'Missing current manager postseason profile '+name);
for(const x of source){
 const verified=d.brackets.find(y=>y.year===x.year);
 assert.deepEqual(verified.participants,(x.participants||x.seeds).map(n));
 assert.deepEqual(verified.semifinalists,x.semifinalists.map(n));
 assert.deepEqual(verified.finalists,x.finalists.map(n));
 assert.deepEqual(verified.byes,x.byes.map(n));
 assert.equal(verified.champion,n(x.champion));
}
const keys=['appearances','semifinals','finals','runnerUps','byes','topSeeds','championships'];
for(const m of d.managers){
 for(const key of keys){
  const expected=source.filter(y=>{
   if(key==='appearances')return (y.participants||y.seeds).map(n).includes(m.manager);
   if(key==='runnerUps')return y.finalists.map(n).includes(m.manager)&&n(y.champion)!==m.manager;
   if(key==='topSeeds')return Object.entries(y.seedByManager).some(([person,seed])=>n(person)===m.manager&&seed===1);
   if(key==='championships')return n(y.champion)===m.manager;
   return y[key].map(n).includes(m.manager);
  }).map(y=>y.year);
  assert.deepEqual(m[key],expected,m.manager+' '+key+' bracket parity');
 }
 assert(m.championships.length<=m.finals.length,'No title without final');
 assert(m.finals.length<=m.appearances.length,'No finals without berth');
 assert(m.byes.length<=m.appearances.length,'No bye without berth');
}
const eligible=unified.games.filter(x=>x.stage!=='regular'&&!x.twoWeekAggregate&&!x.cumulativeScoring&&x.scoreAggregation!=='running_three_week_consolation_total'&&x.home!==x.away&&Number.isFinite(x.homeScore)&&Number.isFinite(x.awayScore));
assert.equal(eligible.length,d.qualifiedPostseasonMatchups);
assert.equal(unified.games.filter(x=>x.stage!=='regular').length-eligible.length,d.excludedMultiweekOrCumulative);
assert.equal(d.qualifiedPostseasonMatchups,80,'Known scoring evidence baseline');
for(const [name,arr] of Object.entries(d.records)){
 assert.equal(arr.length,15,'Top fifteen '+name);
 for(const x of arr){
  assert(x.year>=2018&&x.year<=2025,'No aggregated 2016-17 scores');
  assert(eligible.some(g=>g.year===x.year&&g.week===x.week&&
   (name==='highestSingleWeek'||name==='lowestSingleWeek'?
    (n(g.home)===x.manager&&g.homeScore===x.points||n(g.away)===x.manager&&g.awayScore===x.points):
    n(g.winner==='HOME'?g.home:g.away)===x.winner&&Number(Math.abs(g.homeScore-g.awayScore).toFixed(2))===x.margin)),name+' archival parity');
 }
}
for(const key of ['playoffBerths','finals','semifinals','byes','topSeeds','championships']){
 for(const row of d.leaders[key])assert.equal(row.count,row.years.length,key+' occurrence count');
}
const tom=d.managers.find(x=>x.manager==='Tom');
assert.deepEqual(tom.championships,[2016,2017,2018,2024]);
assert.equal(tom.finals.length,5);
const leaders=d.leaders.playoffBerths.filter(x=>x.count===7).map(x=>x.manager).sort();
assert.deepEqual(leaders,['Birch','Tom']);
console.log('POSTSEASON RECORDS PASS: 10 verified brackets, '+d.managers.length+' historical managers, '+d.qualifiedPostseasonMatchups+' one-week matchups; '+d.excludedMultiweekOrCumulative+' aggregates/cumulative matchups excluded');
