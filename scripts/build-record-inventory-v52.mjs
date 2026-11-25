// Inventory only: never interpret archival leaders as current ownership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const rows=[];
const add=(source,id,label,scope,status,qualification=null,overlap=null)=>{
 assert.ok(id&&label&&scope&&status); rows.push({source,id,label,scope,status,qualification,overlap});
};
const expanded='expanded_records_verified_v1.json',e=read(expanded);
assert.equal(e.categories.length,e.categoryCount);
const aliases={'highest-score':'personal:highest-week','biggest-win':'personal:largest-win','narrowest-win':'personal:closest-win','most-wins':'personal:career-wins','season-wins':'personal:season-wins','season-points':'personal:season-points','rival-wins':'personal:rival-wins','top-three-finishes':'personal:all-era-top-three','average-finish':'personal:normalized-finish'};
for(const c of e.categories)add(expanded,c.key,c.label,c.group==='Final standings'||c.group==='Season'?'Completed seasons 2016–2025':e.scope,c.group==='Final standings'||c.group==='Season'?'completed-scope-review':'refresh-required',c.qualifier,aliases[c.key]||null);
const legendary='legendary_records_2016_2025_v1.json',l=read(legendary);
for(const c of l.categories)add(legendary,c.id,c.label,l.scope,'completed-scope-review',c.rule,c.id==='highest-score-in-loss'?'expanded:highest-score-loss':null);
const post='postseason_records_verified_v1.json',p=read(post);
const postLabels={playoffBerths:'Most championship-bracket playoff appearances',finals:'Most championship-game appearances',semifinals:'Most semifinal appearances',byes:'Most playoff byes',topSeeds:'Most top seeds',championships:'Most championships',berthStreak:'Longest playoff berth streak',highestSingleWeek:'Highest recorded postseason single-week score',lowestSingleWeek:'Lowest recorded postseason single-week score',biggestWins:'Largest recorded postseason single-week victory',closestGames:'Closest recorded postseason single-week game'};
for(const k of Object.keys(p.leaders))add(post,k,postLabels[k],p.scope,'completed-scope-review',null,({playoffBerths:'personal:playoff-berths',finals:'personal:finals',championships:'personal:championships'})[k]||null);
for(const k of Object.keys(p.records))add(post,k,postLabels[k],p.scope+' All recorded eligible postseason stages, not winners bracket alone.','completed-scope-review');
const floor='scoring_floor_research_2016_2025_v1.json',f=read(floor);
for(const [k,label] of Object.entries({highestSeasonFloor:'Highest complete-season scoring floor',mostWeeksStrictlyOver100:'Most weeks strictly over 100 in a completed season',mostWeeksAtLeast105:'Most weeks at least 105 in a completed season'})){assert.ok(f.leaderboards[k]);add(floor,k,label,f.seasonRange,'completed-scope-review',f.method);}
const streak='scoring_streak_research_2016_2026w8_v1.json',st=read(streak);
for(const [k,label] of Object.entries({topOver100:'Longest within-season streak strictly over 100',topAtLeast105:'Longest within-season streak at least 105'})){assert.ok(st[k]);add(streak,k,label,st.scope,'refresh-required');}
for(const source of ['highest_scoring_matchups_2016_2026w9_v1.json','lowest_scoring_matchups_2016_2026w9_v1.json']){const d=read(source);add(source,d.id,d.title,d.coverage,'refresh-required',d.rule);}
const rivalry='regular_season_rivalry_receipts_2016_2026w8_v1.json',rv=read(rivalry);
add(rivalry,'mostMeetings','Most regular-season meetings between current managers',rv.scope,'refresh-required',null,'expanded:rival-games (different population)');
add(rivalry,'longestConsecutiveHeadToHeadWins','Longest consecutive wins against one current rival',rv.scope,'refresh-required');
const luck='luck_performance_profiles_2016_2026_v1.json',lu=read(luck);
for(const [id,label] of [['career-schedule-luck-high','Most favorable completed-season career schedule luck'],['career-schedule-luck-low','Least favorable completed-season career schedule luck'],['season-schedule-luck-high','Most favorable completed-season draw'],['season-schedule-luck-low','Least favorable completed-season draw']])add(luck,id,label,'Completed seasons through '+lu.completedThrough,'definition-review');
assert.equal(new Set(rows.map(r=>r.source+':'+r.id)).size,rows.length);
const out={schemaVersion:1,purpose:'Source inventory only; overlaps are candidates, not confirmed equivalence. No ownership totals authorized.',sourceEntries:rows.length,countsByStatus:Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])),rows};
const file='data-integrity/record-inventory-v52.json',body=JSON.stringify(out,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),body);else fs.writeFileSync(file,body);
console.log('Record inventory: '+rows.length+' source entries; ownership not yet certified.');
