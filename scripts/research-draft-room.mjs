// Research-only draft room: original pick IDs joined to verified observed peer returns.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const ledger=read('acquisition-hall-of-fame-research');
const career=read('career-draft-return-research');
const seasons=[];
for(const year of [2020,2021,2022,2023,2024,2025]){
 const draft=read(year+'-sleeper-draft-id-review'),peer=read(year+'-draft-peer-return-research');
 assert.equal(draft.status,'RESEARCH_ONLY_PLAYER_ID_VERIFIED_NO_FINAL_GRADES');
 assert.equal(peer.status,'RESEARCH_ONLY_OBSERVED_RETURN_TIERS_NOT_OFFICIAL');
 assert.equal(draft.season,year);assert.equal(peer.season,year);
 const evidence=new Map(peer.selection_evidence.map(p=>[p.pick,p]));
 const owned=new Map(ledger.ledger.filter(a=>a.year===year&&['DRAFT','ARCHIVED_KEEPER'].includes(a.category)).map(a=>[a.id,a]));
 const picks=draft.verified_picks.map(p=>{
 const a=owned.get('draft:'+draft.draft_id+':'+p.pick),e=evidence.get(p.pick);
 assert(a&&a.player_id===p.player_id&&a.manager===p.manager);
 assert.equal(Boolean(e),!p.is_keeper_archived);
 if(e){assert(e.grade_eligible&&e.player_id===p.player_id&&e.manager===p.manager);assert.equal(e.source_leaguewide_started_points,p.source_leaguewide_started_points);}
 return {year,pick:p.pick,round:p.round,manager:p.manager,player_id:p.player_id,name:p.archive_player_name,position:p.position,archived_keeper:p.is_keeper_archived,leaguewide_pf:p.source_leaguewide_started_points,original_roster_pf:p.source_original_roster_points,strict_initial_ownership_pf:a.strict_pf,strict_initial_ownership_starts:a.starts,traded:p.traded_same_season,peer:e?{median:e.peer_median_points,surplus:e.realized_selection_surplus,count:e.peer_count,round_window:e.window_rounds}:null};
 });
 assert.equal(picks.length,150);assert.equal(new Set(picks.map(p=>p.pick)).size,150);
 seasons.push({year,regular_weeks:draft.regular_season_completed_weeks,picks,experimental_rankings:peer.experimental_season_ranking});
}
const picks=seasons.flatMap(s=>s.picks),eligible=picks.filter(p=>p.peer);
assert.equal(picks.length,900);assert.equal(eligible.length,880);
const rank=(a,sign=1)=>[...a].sort((x,y)=>sign*(y.peer.surplus-x.peer.surplus)||x.year-y.year||x.pick-y.pick);
const roundBoards=Array.from({length:15},(_,i)=>({round:i+1,best:rank(eligible.filter(p=>p.round===i+1)).slice(0,10),lowest:rank(eligible.filter(p=>p.round===i+1),-1).slice(0,10)}));
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:'2020–2025 completed Sleeper regular seasons',coverage:{seasons:seasons.length,picks:picks.length,peer_eligible:eligible.length,archived_keepers:picks.length-eligible.length},seasons,career_rankings:career.rankings,records:{greatest_observed_steals:rank(eligible).slice(0,50),lowest_observed_returns:rank(eligible,-1).slice(0,50),by_round:roundBoards},limitations:['Observed selection value uses leaguewide starter PF, not only drafting manager points','Strict initial ownership ends at first completed exit, excludes boundary weeks','Original roster PF can include later reacquisition; never equate with strict initial ownership','Peer median of at least four other same-position nonkeeper selections near draft round; retrospective only','Experimental tiers are within-season rank bands, not official GM grades','Keeper classification is archive-derived and provisional']};
fs.writeFileSync(dir+'/draft-room-research.json',JSON.stringify(output,null,2)+'\n');
console.log('DRAFT ROOM COVERAGE '+JSON.stringify(output.coverage));
console.log('DRAFT ROOM STEALS '+JSON.stringify(output.records.greatest_observed_steals.slice(0,5)));
console.log('DRAFT ROOM LOWEST RETURNS '+JSON.stringify(output.records.lowest_observed_returns.slice(0,5)));
