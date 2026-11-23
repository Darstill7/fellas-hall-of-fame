// Independent provider matchup audit, all completed Sleeper seasons.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/season_weekly_matchups_2016_2026_v1.json');
const identities=read('data-integrity/historical-manager-confirmation-20261123.json');
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);return r.json()};
const norm=m=>m==='Tom'?'Thommy':m==='EvansBrandon'?'Evans':m;
const round=n=>Math.round(n*100)/100;
let id='1181421235163095040';const reports=[];
for(let year=2025;year>=2020;year--){
 const league=await get('league/'+id);assert.equal(Number(league.season),year);
 const cutoff=Number(league.settings.playoff_week_start)-1;
 assert.equal(cutoff,year<=2021?13:14);
 const names=identities.rows.find(r=>r.year===year).rosters;
 const name=r=>norm(names[r]);
 const source=[],differences=[],seen=new Set();
 const archived=archive.bySeason[year].games.filter(g=>g.stage==='regular'&&g.week<=cutoff);
 for(let week=1;week<=cutoff;week++){
  const rows=await get('league/'+id+'/matchups/'+week);
  assert.equal(rows.length,10);assert.equal(new Set(rows.map(r=>r.roster_id)).size,10);
  const groups=new Map();
  for(const r of rows){assert(name(r.roster_id));assert(Number.isFinite(r.points));assert(r.matchup_id!=null);if(!groups.has(r.matchup_id))groups.set(r.matchup_id,[]);groups.get(r.matchup_id).push(r);}
  assert.equal(groups.size,5);
  for(const [matchup,rs] of groups){assert.equal(rs.length,2);
   const [a,b]=rs;const home=name(a.roster_id),away=name(b.roster_id);
   const g={week,matchup,home,away,homeScore:a.points,awayScore:b.points};
   source.push(g);
   const candidates=archived.filter(x=>x.week===week&&[norm(x.home),norm(x.away)].includes(home)&&[norm(x.home),norm(x.away)].includes(away));
   if(candidates.length!==1){differences.push({type:'MISSING_OR_DUPLICATE_ARCHIVE_FIXTURE',source:g,candidates});continue;}
   const saved=candidates[0];seen.add(saved);
   const ap=norm(saved.home)===home?saved.homeScore:saved.awayScore,bp=norm(saved.home)===away?saved.homeScore:saved.awayScore;
   if(Math.abs(ap-a.points)>.011||Math.abs(bp-b.points)>.011)differences.push({type:'TEAM_SCORE_MISMATCH',source:g,archive:saved});
  }
 }
 for(const g of archived)if(!seen.has(g))differences.push({type:'UNMATCHED_ARCHIVE_FIXTURE',archive:g});
 const standings={};for(const g of source)for(const [m,pf,pa] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){const r=standings[m]??(standings[m]={games:0,w:0,l:0,t:0,pf:0,pa:0});r.games++;r[pf>pa?'w':pf<pa?'l':'t']++;r.pf+=pf;r.pa+=pa;}
 for(const r of Object.values(standings)){assert.equal(r.games,cutoff);r.pf=round(r.pf);r.pa=round(r.pa);}
 assert.equal(source.length,cutoff*5);assert.equal(Object.keys(standings).length,10);
 assert.equal(round(Object.values(standings).reduce((n,r)=>n+r.pf-r.pa,0)),0);
 const misclassified=archive.bySeason[year].games.filter(g=>g.stage==='regular'&&g.week>cutoff);
 reports.push({year,league_id:id,cutoff,source_games:source,archived_regular_games:archived.length,misclassified,differences,standings});
 console.log('REGULAR SEASON SOURCE '+JSON.stringify({year,cutoff,fixtures:source.length,differences:differences.length,misclassified:misclassified.length,standings}));
 id=String(league.previous_league_id);
}
const coverage={seasons:reports.length,fixtures:reports.reduce((n,r)=>n+r.source_games.length,0),team_scores:reports.reduce((n,r)=>n+2*r.source_games.length,0),differences:reports.reduce((n,r)=>n+r.differences.length,0),misclassified:reports.reduce((n,r)=>n+r.misclassified.length,0)};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/regular-season-source-reconciliation.json',JSON.stringify({status:'RESEARCH_ONLY_NO_CANONICAL_WRITES',coverage,reports},null,2)+'\n');
console.log('REGULAR SEASON SOURCE COVERAGE '+JSON.stringify(coverage));
