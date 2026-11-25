import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWinningStreakWatch,buildCareerWinsMilestones} from '../assets/conditional-record-watch-v51.mjs';
import {buildHomeDashboard} from '../assets/home-app-v3.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json'),guide=read('data/season_guide.json');
const d=buildHomeDashboard(guide,ledger);
const actual=buildWinningStreakWatch(ledger,d);
assert(!actual.some(x=>x.manager==='Stew'&&x.week===11&&x.record===12),'Impossible chase must be excluded');
assert.deepEqual(buildWinningStreakWatch({games:[]},d),[]);
assert.deepEqual(buildWinningStreakWatch(ledger,{...d,week:d.week-1}),[]);
const names=['Stilly','Stew','Thommy','Mitch','JMid','Scott','Stover','Kuhl','Tony','Birch'];
const fixtures=(year,weeks)=>Array.from({length:weeks},(_,i)=>names.slice(0,5).map((n,j)=>({year,week:i+1,stage:'regular',home:n,away:names[j+5],homeScore:j===0||i<2?100:80,awayScore:90}))).flat();
const past=fixtures(2025,5),now=fixtures(2026,4),mock={week:4,standings:names.map((name,j)=>({name,streak:j===0?'W4':j<5?'L2':j===5?'L4':'W2'}))};
const result=buildWinningStreakWatch({games:[...past,...now]},mock);
assert.equal(result.length,1);assert.equal(result[0].manager,'Stilly');assert.equal(result[0].tie,1);assert.equal(result[0].breakGap,2);
assert.deepEqual(buildWinningStreakWatch({games:[...past,...now]}, {...mock,week:14}),[]);
console.log('Conditional Record Watch fixtures passed; actual candidates:',actual.length);


const milestones=buildCareerWinsMilestones(ledger,d);
const ownership=read('data/weekly-record-ownership-v57.json');
const winsMark=ownership.current.marks.find(mark=>mark.id==='established-record-career-wins');
assert.ok(milestones.every(item=>item.record===winsMark.value&&
 item.holders.join(',')===winsMark.holders.join(',')&&item.toMatch<=item.remaining));
if(d.week===11)assert.deepEqual(milestones,[{manager:'Tony',wins:75,record:77,holders:['Stover'],
 toMatch:2,toPass:3,week:11,remaining:3}]);
assert.deepEqual(buildCareerWinsMilestones(ledger,{...d,week:14}),[]);
assert.deepEqual(buildCareerWinsMilestones(ledger,{...d,week:d.week-1}),[]);
const fixed=fixtures(2026,13).map(g=>({...g,homeScore:100}));
const extra=[
 {year:2025,week:1,stage:'regular',home:'Stilly',away:'Scott',homeScore:100,awayScore:90},
 {year:2025,week:1,stage:'regular',home:'Stew',away:'Stover',homeScore:100,awayScore:90},
 {year:2025,week:2,stage:'regular',home:'Stilly',away:'Scott',homeScore:100,awayScore:90}
];
const finalWeek={week:13,standings:names.map((name,i)=>({name,w:i<5?13:0}))};
const remaining=buildCareerWinsMilestones({games:[...extra,...fixed]},finalWeek);
assert.deepEqual(remaining,[{manager:'Stew',wins:14,record:15,holders:['Stilly'],
 toMatch:1,toPass:null,week:13,remaining:1}],'Final-week math must preserve tie-only eligibility');
console.log('Career wins milestones passed attainable, impossible and tie-only cases');
