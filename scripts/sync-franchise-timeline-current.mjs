// Rebuild only the CURRENT SEASON portion of the editorial Franchise Timeline.
// Trade and draft events are archived independently and must not be fabricated.
// Usage: node scripts/sync-franchise-timeline-current.mjs [--check]
import fs from 'node:fs';
const ledgerPath='data/season_weekly_matchups_2016_2026_v1.json';
const dataPath='data/franchise_timelines_v1.json';
const htmlPath='analytics/franchise-timeline.html';
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const games=ledger.bySeason?.['2026']?.games.filter(g=>g.stage==='regular');
if(!Array.isArray(games)||!games.length)throw Error('Missing canonical 2026 regular-season matchups');
const week=Math.max(...games.map(g=>g.week));
if(games.length!==week*5)throw Error('Five final matchups required in every accepted 2026 week');
for(let w=1;w<=week;w++){
 const matches=games.filter(g=>g.week===w);
 if(matches.length!==5||new Set(matches.flatMap(g=>[g.home,g.away])).size!==10)
  throw Error('Noncontiguous 2026 Week '+w+' in source');
}
const original=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const standings=new Map(ledger.bySeason['2026'].standings.map(row=>[row.manager,row]));
const fixed=JSON.parse(JSON.stringify(original));
const norm=n=>n==='Tom'?'Thommy':n;
const number=n=>Number(n).toFixed(2);
for(const manager of fixed.managers){
 const name=norm(manager.name),row=standings.get(name);
 const season=manager.seasons.find(s=>s.year===2026);
 if(!row||!season)throw Error('Manager or current timeline season missing: '+name);
 const matches=games.filter(g=>g.home===name||g.away===name).sort((a,b)=>a.week-b.week);
 if(matches.length!==week)throw Error('Missing source matchups: '+name);
 season.moments=matches.map(g=>{
  const home=g.home===name,points=home?g.homeScore:g.awayScore,opp=home?g.awayScore:g.homeScore;
  return {week:g.week,headline:name+' '+number(points)+' – '+(home?g.away:g.home)+' '+number(opp),
   detail:(points>opp?'Win':points<opp?'Loss':'Tie')+' · margin '+number(Math.abs(points-opp))};
 });
 season.season_record=row.w+'–'+row.l+(row.t?'–'+row.t:'');
 season.record_note='Verified 2026 regular season through Week '+week+' · '+matches.length+
  ' games · '+number(row.pf)+' PF · '+number(row.pa)+' PA.';
}
fixed.coverage=String(fixed.coverage).replace(/verified 2026 Weeks 1–\d+/, 'verified 2026 Weeks 1–'+week);
if(!fixed.coverage.includes('verified 2026 Weeks 1–'+week))throw Error('Coverage sentence not found');
const dataOut=JSON.stringify(fixed,null,2)+'\n';
const html=fs.readFileSync(htmlPath,'utf8');
const marker='<script id="timeline-data" type="application/json">';
const i=html.indexOf(marker),j=html.indexOf('</script>',i);
if(i<0||j<i)throw Error('Missing Franchise Timeline embedded source JSON');
let pre=html.slice(0,i);
let post=html.slice(j);
pre=pre.replace(/through Week \d+/g,'through Week '+week);
post=post.replace(/Current season · through Week \d+/g,'Current season · through Week '+week);
const htmlOut=pre+marker+JSON.stringify(fixed)+post;
if(process.argv.includes('--check')){
 if(fs.readFileSync(dataPath,'utf8')!==dataOut||html!==htmlOut)
  throw Error('Franchise Timeline current season stale relative to verified '+week+'-week ledger');
 console.log('FRANCHISE TIMELINE PARITY PASS: 10 managers through 2026 Week '+week);
}else{
 fs.writeFileSync(dataPath,dataOut);fs.writeFileSync(htmlPath,htmlOut);
 console.log('Regenerated editorial Franchise Timeline: 10 managers through Week '+week+'; historical trade/draft evidence preserved.');
}
