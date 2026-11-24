// Read-only keeper evidence. Provider flags are not inferred from missing metadata.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);return r.json()};
const reports=[];
for(const year of [2020,2021,2022,2023,2024,2025]){
 const audit=JSON.parse(fs.readFileSync(dir+'/'+year+'-sleeper-draft-id-review.json','utf8'));
 const [league,draft,picks,rosters]=await Promise.all([get('league/'+audit.league_id),get('draft/'+audit.draft_id),get('draft/'+audit.draft_id+'/picks'),get('league/'+audit.league_id+'/rosters')]);
 assert.equal(String(league.season),String(year));assert.equal(picks.length,150);
 const original=new Map(picks.map(p=>[Number(p.pick_no),p]));
 const rows=audit.verified_picks.map(a=>{
 const p=original.get(a.pick);assert.equal(String(p.player_id),a.player_id);assert.equal(Number(p.roster_id),a.original_roster);
 const raw=p.is_keeper;
 const explicit=typeof raw==='boolean'?raw:null;
 return {year,pick:a.pick,round:a.round,manager:a.manager,roster:a.original_roster,player_id:a.player_id,name:a.archive_player_name,position:a.position,archived_keeper:a.is_keeper_archived,provider_is_keeper:explicit,provider_raw_flag:raw??null,provider_flag_type:typeof raw,provider_metadata_keeper:p.metadata?.is_keeper??null,original_roster_pf:a.source_original_roster_points,leaguewide_pf:a.source_leaguewide_started_points,classification:explicit===null?'PROVIDER_FLAG_UNAVAILABLE':explicit===a.is_keeper_archived?'AGREES_WITH_ARCHIVE':'DISAGREES_WITH_ARCHIVE'};
 });
 const count={picks:rows.length,archive_keepers:rows.filter(r=>r.archived_keeper).length,provider_true:rows.filter(r=>r.provider_is_keeper===true).length,provider_false:rows.filter(r=>r.provider_is_keeper===false).length,provider_unknown:rows.filter(r=>r.provider_is_keeper===null).length,disagreement:rows.filter(r=>r.classification==='DISAGREES_WITH_ARCHIVE').length};
 reports.push({year,league_id:audit.league_id,draft_id:audit.draft_id,league_keeper_settings:Object.fromEntries(Object.entries(league.settings||{}).filter(([k])=>/keep/i.test(k))),draft_keeper_settings:Object.fromEntries(Object.entries(draft.settings||{}).filter(([k])=>/keep/i.test(k))),roster_keeper_fields:rosters.map(r=>({roster_id:r.roster_id,keepers:Array.isArray(r.keepers)?r.keepers.map(String):null})),count,rows});
}
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:'2020–2025 Sleeper draft keeper evidence',reports,limitations:['Explicit boolean draft flag recorded separately from archive classification; absent or nonboolean flag is unknown','End-of-season roster keeper arrays may describe a different retention cycle and cannot independently establish draft keeper status','Draft slot is observed cost, not proof of league-specific eligibility or transferred rights','No keeper grade or future eligibility inferred']};
fs.writeFileSync(dir+'/keeper-source-audit-research.json',JSON.stringify(output,null,2)+'\n');
console.log('KEEPER SOURCE COVERAGE '+JSON.stringify(reports.map(({year,count,league_keeper_settings,draft_keeper_settings})=>({year,count,league_keeper_settings,draft_keeper_settings}))));
console.log('KEEPER SOURCE DISAGREEMENTS '+JSON.stringify(reports.flatMap(r=>r.rows.filter(p=>p.classification==='DISAGREES_WITH_ARCHIVE'))));
