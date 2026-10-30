import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const existence=p=>fs.existsSync(p);
const years=[2020,2021,2022,2023,2024,2025];
const status={schema:'fellas-evidence-coverage-v1',policy:'Inventory derived from stored repository evidence; availability is not accuracy and no provider refresh is implied.',years:[],totals:{teamWeeks:0,weeklyRosterFiles:0,starterRows:0,benchRows:0},blockers:[]};
for(const year of years){
 const expected=year===2020?13:14;
 const season={year,leagueMatchupSource:'data/sleeper_matchups_'+year+'.json',regularWeeksExpected:expected,regularWeeksFound:0,teamWeeks:0,rosterSources:[],acquisitionsSource:'data/acquisitions_'+year+'.json',playerStartsSource:'data/player_starts_'+year+'.json',rosterValidation:'score-validation-in-CI',tradeDecisionEligibility:'not certified',waiverDecisionEligibility:'not certified'};
 for(let week=1;week<=expected;week++){
  const legacy=year===2025&&(week===1||week===7);
  const source=legacy?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  if(!existence(source))throw Error('Missing roster source '+source);
  const payload=read(source),rows=Array.isArray(payload)?payload:payload.rosters;
  if(!Array.isArray(rows)||rows.length!==10)throw Error('Unexpected roster quantity '+source);
  for(const x of rows){if(!Array.isArray(x.starters)||!Array.isArray(x.bench))throw Error('Missing player arrays '+source);status.totals.starterRows+=x.starters.length;status.totals.benchRows+=x.bench.length;}
  season.rosterSources.push({week,source,teams:rows.length,kind:legacy?'legacy-week-snapshot':'recovered-provider-historical-snapshot'});
  season.regularWeeksFound++;season.teamWeeks+=rows.length;status.totals.weeklyRosterFiles++;
 }
 for(const source of [season.leagueMatchupSource,season.acquisitionsSource,season.playerStartsSource])if(!existence(source))throw Error('Missing companion source '+source);
 status.totals.teamWeeks+=season.teamWeeks;status.years.push(season);
}
for(const year of [2016,2017,2018,2019]){for(const file of ['data/espn_'+year+'_draft_recovered_v1.json','data/espn_'+year+'_roster_snapshot_v1.json'])if(!existence(file))throw Error('Missing ESPN source '+file);}
for(const file of ['data/v9_trade_engine.json','data/v9_draft_engine.json','data/manager_identity_map_v1.json','data/verified_espn_playoff_brackets_2016_2019.json','data/verified_sleeper_playoff_brackets_2020_2025.json','data/season_weekly_matchups_2016_2026_v1.json'])if(!existence(file))throw Error('Missing archive '+file);
const oldGate=read('data/war_2025_coverage_gates.json');if(oldGate.summary.benchCoveredWeeks!==2)throw Error('Historical gate changed; preserve provenance');
status.blockers.push('2025 legacy WAR gate is a historical acquisition-time document: its 2/14 bench count is superseded by roster-file inventory, not by verified waiver availability.');
status.blockers.push('Historical projection snapshots, pre-lock eligibility and comprehensive free-agent availability are not certified.');
status.blockers.push('Transaction completions are not a full set of FAAB bids or failed waiver claims.');
status.blockers.push('ESPN player-level weekly box scores 2016–2019 remain less complete than Sleeper-era rosters.');
if(status.totals.teamWeeks!==830||status.totals.weeklyRosterFiles!==83)throw Error('Six-season roster coverage incomplete');
fs.mkdirSync('data-integrity',{recursive:true});
fs.writeFileSync('data-integrity/recovered-source-coverage-2020-2025.json',JSON.stringify(status,null,2)+'\n');
console.log('RECONCILED EVIDENCE INVENTORY',JSON.stringify({years:status.years.map(y=>({year:y.year,weeks:y.regularWeeksFound,teamWeeks:y.teamWeeks})),totals:status.totals,blockers:status.blockers},null,2));
