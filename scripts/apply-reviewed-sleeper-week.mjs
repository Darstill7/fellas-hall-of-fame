// Apply one human-reviewed Sleeper candidate to the canonical ledger and core projections.
// Usage: node scripts/apply-reviewed-sleeper-week.mjs data-integrity/sleeper-sync-candidates/2026-week8.json
// This does NOT merge or publish. Full release CI must pass before an operator merges.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const candidatePath=process.argv[2];
if(!candidatePath||!/^data-integrity\/sleeper-sync-candidates\/2026-week\d+\.json$/.test(candidatePath))throw Error('Provide a reviewed candidate path under data-integrity/sleeper-sync-candidates');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const path='data/unified_record_book_2016_2026.json',mirrorPath='data/season_weekly_matchups_2016_2026_v1.json',luckPath='data/all_time_luck_ratings_v1.json';
const candidate=read(candidatePath),ledger=read(path),mirror=read(mirrorPath),luck=read(luckPath);
if(candidate.status!=='REVIEW_REQUIRED'||candidate.year!==2026||candidate.matchupCount!==5||candidate.games?.length!==5||candidate.league!=='1340027406009761792')throw Error('Unverified candidate format');
const prior=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const last=Math.max(0,...prior.map(g=>g.week));
if(candidate.week!==last+1||candidate.week>14)throw Error('Noncontiguous or postseason week');
const participants=new Set();
for(const g of candidate.games){
 if(g.year!==2026||g.week!==candidate.week||g.stage!=='regular'||g.era!=='Sleeper'||g.home===g.away)throw Error('Invalid staged game');
 for(const name of [g.home,g.away]){if(participants.has(name))throw Error('Duplicate staged owner '+name);participants.add(name)}
 if(!Number.isFinite(g.homeScore)||!Number.isFinite(g.awayScore)||g.homeScore<0||g.awayScore<0||g.winner!==(g.homeScore>g.awayScore?'HOME':g.homeScore<g.awayScore?'AWAY':'TIE')||Math.abs(g.margin-Math.abs(g.homeScore-g.awayScore))>0.001)throw Error('Staged score or result mismatch');
}
const expectedOwners=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
if(participants.size!==10||[...participants].some(name=>!expectedOwners.has(name)))throw Error('Expected the 10 current verified managers');
// Refuse to rewrite any records until the candidate has passed structural checks.
const updated=[...ledger.games,...candidate.games];
ledger.games=updated;ledger.updated=new Date().toISOString().slice(0,10);
ledger.counts['2026'].regular+=5;
ledger.coverage=ledger.coverage.replace(/2026 Weeks 1–\d+ regular/, '2026 Weeks 1–'+candidate.week+' regular');
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
const rows=new Map();
const season=updated.filter(g=>g.year===2026&&g.stage==='regular');
for(const g of season)for(const [name,pts,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
 const r=rows.get(name)||{manager:name,w:0,l:0,t:0,pf:0,pa:0,games:0};
 r.games++;r.pf+=pts;r.pa+=against;if(pts>against)r.w++;else if(pts<against)r.l++;else r.t++;
 rows.set(name,r);
}
const standings=[...rows.values()].map(r=>({...r,pf:round(r.pf),pa:round(r.pa)})).sort((a,b)=>(b.w+b.t/2)/b.games-(a.w+a.t/2)/a.games||b.pf-a.pf);
mirror.bySeason['2026'].regularGames=season.length;
mirror.bySeason['2026'].games.push(...candidate.games.map(g=>({week:g.week,stage:g.stage,home:g.home,away:g.away,homeScore:g.homeScore,awayScore:g.awayScore,winner:g.winner,margin:g.margin,era:g.era,weeksCovered:null,twoWeekAggregate:false})));
mirror.bySeason['2026'].standings=standings;
for(const r of standings){
 const annual=mirror.managerAnnual[r.manager].find(x=>x.year===2026);
 if(!annual)throw Error('Missing annual mirror '+r.manager);
 Object.assign(annual,r);
}
mirror.scope=mirror.scope.replace(/2026 Week\d+/, '2026 Week'+candidate.week);
const byWeek=new Map();
for(const g of season){const a=byWeek.get(g.week)||[];a.push([g.home,g.homeScore],[g.away,g.awayScore]);byWeek.set(g.week,a)}
for(const [w,entries] of byWeek)if(entries.length!==10||new Set(entries.map(x=>x[0])).size!==10)throw Error('Incomplete season all-play round '+w);
for(const r of standings){
 let expected=0;
 for(const entries of byWeek.values()){
  const own=entries.find(x=>x[0]===r.manager)[1];
  expected+=entries.reduce((s,[name,score])=>s+(name===r.manager?0:own>score?1:own===score?.5:0),0)/9;
 }
 const l=luck.ranked.find(x=>x.manager===r.manager);if(!l?.bySeason?.['2026'])throw Error('Missing luck history '+r.manager);
 const previous=l.bySeason['2026'];l.games+=r.games-previous.games;l.actualWins+=r.w-previous.actualWins;l.expectedWins+=expected-previous.expectedWins;
 l.bySeason['2026']={games:r.games,actualWins:r.w,expectedWins:expected};
 l.luckWins=round(l.actualWins-l.expectedWins);
 l.luckPer14=round((l.actualWins-l.expectedWins)*14/l.games);
}
luck.scope=luck.scope.replace(/2026 Week\d+/, '2026 Week'+candidate.week);
// Inputs are validated before the core datasets are modified. Review the resulting diff before merge.
write(path,ledger);write(mirrorPath,mirror);write(luckPath,luck);
execFileSync(process.execPath,['scripts/generate-career-core.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/generate-season-guide.mjs'],{stdio:'inherit'});
for(const script of ['verify-weekly-ledger-parity.mjs','verify-manager-madden-cards.mjs','verify-fellas-rating.mjs'])
 execFileSync(process.execPath,['scripts/'+script],{stdio:'inherit'});
console.log('Review regenerated files and full CI before merging. Other legacy projections may need regeneration.');
