import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildPersonalRecords,validateRecordArchive,buildRecordChase} from '../assets/manager-personal-records-v45.mjs';
import {buildAchievements,buildWeeklyRecordWatch} from '../assets/manager-achievements-record-watch.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const core=read('career_core_generated.json'),ledger=read('unified_record_book_2016_2026.json'),guide=read('season_guide.json'),endings=read('manager_verified_season_endings_v1.json'),archive=read('manager_record_books_2016_2026.json');
const brackets=[read('verified_espn_playoff_brackets_2016_2019.json'),read('verified_sleeper_playoff_brackets_2020_2025.json')];
const post={espn:brackets[0],sleeper:brackets[1],placements:read('fellas_final_placements_2020_2025.json'),placementReceipts:read('sleeper_postseason_placement_receipts_2020_2025.json'),allEra:read('fellas_final_placements_2016_2025_verified.json')};
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
let checks=0;const check=(condition,msg)=>{assert(condition,msg);checks++};
const results=[],failures=[];
check(validateRecordArchive(core,archive),'archive reconciliation');
for(const name of names){try{
 const d=buildPersonalRecords(core,ledger,name),m=core.managers[name],a=archive.managers.find(x=>x.manager===name);
 check(d.games===m.games,'career games');check(d.totalPF===d.receipts.reduce((n,g)=>n+g.pf,0),'career PF');
 check(d.marks[0][1].pf===Math.round(a.bestWeek.points*100),'weekly high');check(d.marks[1][1].pf===Math.round(a.worstWeek.points*100),'weekly low');
 for(const y of d.annual){const g=d.receipts.filter(g=>g.year===y.year);check(y.best.pf===Math.max(...g.map(x=>x.pf)),'annual high');check(y.worst.pf===Math.min(...g.map(x=>x.pf)),'annual low')}
 for(const milestone of d.milestones)check(milestone.target>milestone.value&&milestone.remaining===milestone.target-milestone.value,'milestone target');
 const ranks=buildRecordChase(archive,guide,post,name);for(const r of ranks)check(r.rank>=1&&r.gap>=0&&r.owned===(r.rank===1),'record chase rank');
 const badges=buildAchievements(core,ledger,guide,endings,brackets,name);
 check(badges.length===33,'badge count');check(new Set(badges.map(b=>b.id)).size===33,'unique badge IDs');
 for(const b of badges){
 check(['earned','locked','unavailable'].includes(b.status),'badge status');
 check((b.status==='earned')===!!b.evidence,'badge evidence gating');
 if(b.evidence?.week)check(d.receipts.some(g=>g.year===b.evidence.year&&g.week===b.evidence.week&&g.pf===b.evidence.pf&&g.pa===b.evidence.pa),'matchup evidence');
 }
 const lookup=id=>badges.find(b=>b.id===id);
 check((lookup('century').status==='earned')===(m.w>=100),'century club');
 check((lookup('ironman').status==='earned')===(m.games>=150),'ironman');
 check((lookup('machine').status==='earned')===d.receipts.some(g=>g.pf>=20000),'scoring machine');
 check((lookup('unstoppable').status==='earned')===(d.longestWin>=8),'eight-win streak');
 check((lookup('heartbroken').status==='earned')===d.receipts.some(g=>g.margin<0&&g.margin>=-10),'heartbreak');
 results.push({name,earned:badges.filter(b=>b.status==='earned').length,locked:badges.filter(b=>b.status==='locked').length,unavailable:badges.filter(b=>b.status==='unavailable').length});
 }catch(e){failures.push({name,error:e.message})}}
 const watch=buildWeeklyRecordWatch(core,ledger,guide,endings,brackets,names);
 for(const e of watch.events)check(e.evidence.year===2026&&e.evidence.week===watch.week,'weekly event cutoff');
 const duplicate=structuredClone(ledger);duplicate.games.push(duplicate.games.find(g=>g.year===2026&&g.stage==='regular'));assert.throws(()=>buildWeeklyRecordWatch(core,duplicate,guide,endings,brackets,names));checks++;
 const stale={...core,completedThrough:{year:2026,week:watch.week+1}};assert.throws(()=>buildWeeklyRecordWatch(stale,ledger,guide,endings,brackets,names));checks++;
 console.log('GM45 ACTUAL ARCHIVE '+JSON.stringify({checks,results,failures,watch:{week:watch.week,events:watch.events.length,near:watch.near.length}}));assert.equal(failures.length,0,JSON.stringify(failures));
