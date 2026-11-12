// Fail closed when the published franchise timeline drifts from the canonical current-season ledger.
// Run: node scripts/verify-franchise-timeline-freshness.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const canonical=JSON.parse(read('data/season_weekly_matchups_2016_2026_v1.json'));
const archive=JSON.parse(read('data/franchise_timelines_v1.json'));
const html=read('analytics/franchise-timeline.html');
const open='<script id="timeline-data" type="application/json">';
const start=html.indexOf(open),end=html.indexOf('</script>',start);
assert(start>=0&&end>start,'Missing embedded timeline JSON');
const embedded=JSON.parse(html.slice(start+open.length,end));
assert.deepEqual(embedded,archive,'Embedded timeline must equal standalone source archive');
const games=canonical.bySeason['2026'].games.filter(g=>g.stage==='regular');
const week=Math.max(...games.map(g=>g.week));
assert.equal(games.length,week*5,'Every current week must contain five ten-team matchups');
assert.equal(archive.managers.length,10);
assert(archive.coverage.includes('Weeks 1–'+week),'Timeline coverage label is stale');
assert(html.includes('Current season · through Week '+week),'Visible season label is stale');
assert(html.includes('verified through Week '+week),'Visible source caveat is stale');
const standings=new Map(canonical.bySeason['2026'].standings.map(row=>[row.manager,row]));
for(const m of archive.managers){
 const id=m.name==='Tom'?'Thommy':m.name;
 const row=standings.get(id);
 const season=m.seasons.find(s=>s.year===2026);
 assert(row&&season,'Missing manager or 2026 season '+id);
 const matches=games.filter(g=>g.home===id||g.away===id).sort((a,b)=>a.week-b.week);
 assert.equal(matches.length,week,'Incomplete regular-season timeline for '+id);
 assert.equal(season.moments.length,week,'Stale timeline event count for '+id);
 assert.equal(season.season_record,row.w+'–'+row.l+(row.t?'–'+row.t:''),'Stale record for '+id);
 assert(season.record_note.includes('Week '+week),'Stale record note '+id);
 for(let i=0;i<week;i++){
  const match=matches[i],moment=season.moments[i],isHome=match.home===id;
  const score=isHome?match.homeScore:match.awayScore;
  const opp=isHome?match.awayScore:match.homeScore;
  const other=isHome?match.away:match.home;
  assert.equal(moment.week,match.week,'Week mismatch for '+id);
  assert.equal(moment.headline,id+' '+Number(score).toFixed(2)+' – '+other+' '+Number(opp).toFixed(2),'Incorrect sourced score for '+id);
  assert.equal(moment.detail,(score>opp?'Win':score<opp?'Loss':'Tie')+' · margin '+Math.abs(score-opp).toFixed(2),'Incorrect sourced result for '+id);
 }
}
console.log('PASS: Franchise Timeline embedded archive and all 10 records / '+games.length+' game receipts agree through Week '+week);
