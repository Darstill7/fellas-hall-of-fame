// Independent provider bracket and roster identity audit; no canonical writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' HTTP '+r.status);return r.json()};
const archive=JSON.parse(fs.readFileSync('data/playoff_explorer_verified_2016_2025_v1.json','utf8'));
const normalize=n=>({Thommy:'Tom',Evans:'EvansBrandon'}[n]||n);
const reports=[];
for(const year of [2020,2021,2022,2023,2024,2025]){
 const own=JSON.parse(fs.readFileSync(dir+'/'+year+'-ownership-review.json','utf8'));
 const id=own.league_id;
 const [league,rosters,users,bracket]=await Promise.all(['','/rosters','/users','/winners_bracket'].map(s=>get('league/'+id+s)));
 assert.equal(String(league.season),String(year));assert.equal(rosters.length,10);
 const usernames=new Map(users.map(u=>[String(u.user_id),u.username]));
 const labels=new Map([[1,'Stilly'],[2,year<=2023?'EvansBrandon':'JMid'],[3,'Tom'],[4,'Stew'],[5,year<=2023?'Koble':'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
 const identities=rosters.map(r=>({roster:r.roster_id,owner_id:r.owner_id,username:usernames.get(String(r.owner_id))||null,research_manager:labels.get(r.roster_id)}));
 const games=bracket.filter(g=>g.t1&&g.t2&&g.w&&g.l&&(g.p==null||g.p===1));
 const final=games.find(g=>g.p===1)||games.find(g=>g.r===Math.max(...games.map(x=>x.r)));
 assert(final,'Provider title fixture absent');
 const archived=archive.seasons.find(s=>s.year===year);
 const fixtures=[];
 for(const g of games){
  const week=Number(league.settings.playoff_week_start)+g.r-1;
  const matchups=await get('league/'+id+'/matchups/'+week);
  const a=matchups.find(x=>x.roster_id===g.t1),b=matchups.find(x=>x.roster_id===g.t2);
  const saved=archived.matches.find(m=>m.week===week&&[normalize(m.home),normalize(m.away)].includes(labels.get(g.t1))&&[normalize(m.home),normalize(m.away)].includes(labels.get(g.t2)));
  fixtures.push({week,provider:g,participants:[labels.get(g.t1),labels.get(g.t2)],winner:labels.get(g.w),source_scores:[a?.points??null,b?.points??null],same_provider_matchup:a?.matchup_id!=null&&a.matchup_id===b?.matchup_id,archive_match:saved||null,archive_winner_matches:!!saved&&normalize(saved.winner)===labels.get(g.w)});
 }
 const result={year,league_id:id,identities,provider_champion:labels.get(final.w),provider_champion_username:identities.find(x=>x.roster===final.w)?.username,archive_champion:normalize(archived.champion),champion_matches:labels.get(final.w)===normalize(archived.champion),fixtures};
 reports.push(result);
 console.log('PROVIDER BRACKET IDENTITY '+JSON.stringify(result));
}
fs.writeFileSync(dir+'/provider-bracket-identity-research.json',JSON.stringify({status:'RESEARCH_ONLY_PROVIDER_IDENTITY_REVIEW',reports},null,2)+'\n');
