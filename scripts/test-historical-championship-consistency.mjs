// Cross-dataset certification of completed season outcomes. No source mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>JSON.parse(fs.readFileSync('data/'+n+'.json','utf8'));
const p=read('fellas_final_placements_2016_2025_verified'),e=read('manager_verified_season_endings_v1'),c=read('manager_profile_career_summary_v2'),t=read('manager_historical_trophy_cases_v1'),l=read('league'),a=read('fellas_awards_by_season'),b=read('playoff_explorer_verified_2016_2025_v1'),g=read('season_guide');
const norm=x=>x==='Tom'?'Thommy':x==='EvansBrandon'?'Evans':x;
const confirmed=JSON.parse(fs.readFileSync('data-integrity/historical-championship-confirmation-20261123.json','utf8'));
let checks=0,finishes=0;
function eq(actual,expected,context){checks++;assert.deepEqual(actual,expected,context)}
for(const s of p.seasons){
 const y=s.year,champ=norm(s.champion),first=s.finishes.find(x=>x.rank===1),second=s.finishes.find(x=>x.rank===2),bracket=b.seasons.find(x=>x.year===y),final=bracket.matches.find(x=>x.round==='final'),awards=a.seasons[y].awards.filter(x=>x.label==='League Champion');
 eq(awards.length,1,y+' unique champion award');
 eq(norm(l.champions.find(x=>x[0]===y)?.[1]),champ,y+' league champion');
 eq([norm(first.manager),norm(final.winner),norm(bracket.champion)],[champ,champ,champ],y+' champion agreement');
 eq([norm(final.loser),norm(bracket.runnerUp),norm(awards[0].runnerUp?.recipient)],Array(3).fill(norm(second.manager)),y+' runner-up agreement');
 eq(norm(awards[0].manager),champ,y+' champion award');
 eq(s.finishes.map(f=>f.rank).sort((x,y)=>x-y),Array.from({length:s.teams},(_,i)=>i+1),y+' placements');
 eq(new Set(s.finishes.map(f=>norm(f.manager))).size,s.teams,y+' participants');
 if(y>=2020)eq(norm(confirmed.rows.find(r=>r.year===y).champion),champ,y+' commissioner evidence');
 for(const [m,x] of Object.entries(c.managers))eq((x.titles||[]).filter(z=>z.year===y).length,norm(m)===champ?1:0,y+' '+m+' career title');
 for(const [m,x] of Object.entries(t.managers))eq((x.championships||[]).filter(z=>z===y).length,norm(m)===champ?1:0,y+' '+m+' trophy');
 for(const f of s.finishes){
  const m=norm(f.manager),rows=e.managers[m]?.filter(x=>x.year===y)||[],r=g[y]?.standings.find(x=>norm(x.name)===m);
  eq(rows.length,1,y+' '+m+' season ending');
  eq(rows[0].finalRank,f.rank,y+' '+m+' final rank');
  if(f.rank===1)eq(rows[0].ending,'Champion',y+' '+m+' championship ending');
  if(f.rank===2)eq(rows[0].ending,'Runner-up',y+' '+m+' runner-up ending');
  assert(r,y+' '+m+' missing archived standings');
  eq(rows[0].regular,[r.w,r.l,...(r.t?[r.t]:[])].join('-'),y+' '+m+' archived regular season');
  finishes++;
 }
}
eq(p.seasons.length,10,'completed seasons');
eq(finishes,98,'completed manager seasons');
console.log('HISTORICAL CHAMPIONSHIP CONSISTENCY PASS '+JSON.stringify({checks,finishes,seasons:p.seasons.length}));
