// Read-only manager-season source coverage inventory. Never infer manager skill from file availability.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const file=p=>path.join(root,p);
const exists=p=>fs.existsSync(file(p));
const read=p=>JSON.parse(fs.readFileSync(file(p),'utf8'));
const careers=read('data/career_core_generated.json').managers;
const statuses={verified:'verified',observed:'observed_not_skill',partial:'partial',missing:'missing',notApplicable:'not_applicable'};
const entries=[];
for(const [manager,career] of Object.entries(careers).sort(([a],[b])=>a.localeCompare(b))){
 for(const year of Object.keys(career.annual||{}).map(Number).sort((a,b)=>a-b)){
  const legacy=year<=2019,ongoing=year===2026;
  const rosterPath=legacy?'data/espn_'+year+'_roster_snapshot_v1.json':null;
  const draftPath=legacy?'data/espn_'+year+'_draft_recovered_v1.json':'data/v9_draft_engine.json';
  const acquisitionPath=legacy?null:'data/acquisitions_'+year+'.json';
  const startsPath=legacy?null:'data/player_starts_'+year+'.json';
  const matchupPath=legacy?'data/espn_history_2016_2019.json':'data/sleeper_matchups_'+year+'.json';
  const rosterWeeks=!legacy&&year<=2025?Array.from({length:year===2020?13:14},(_,i)=>i+1).map(w=>({week:w,path:year===2025&&(w===1||w===7)?'data/war_rosters_2025_week'+w+'.json':'data/sleeper_roster_snapshots_'+year+'_week'+w+'.json'})): [];
  const availableWeeks=rosterWeeks.filter(x=>exists(x.path));
  entries.push({
   manager,year,seasonComplete:!ongoing,regularSeason:{status:statuses.verified,source:'data/career_core_generated.json',record:career.annual[year]},
   matchups:{status:exists(matchupPath)?statuses.observed:statuses.missing,source:matchupPath},
   drafting:{status:exists(draftPath)?statuses.partial:statuses.missing,source:draftPath,note:'File exists; manager-year attribution and decision context not certified by this inventory'},
   transactions:legacy?{status:statuses.missing,note:'ESPN-era complete action history not recovered'}:{status:exists(acquisitionPath)?statuses.partial:statuses.missing,source:acquisitionPath,note:'Observed acquisitions; FAAB receipts and complete decision denominator unverified'},
   playerStarts:legacy?{status:statuses.missing,note:'No equivalent ESPN-era player starts history'}:{status:exists(startsPath)?statuses.observed:statuses.missing,source:startsPath,note:'Hindsight participation only, not start/sit skill'},
   lineupAlternatives:{status:legacy?statuses.missing:availableWeeks.length===rosterWeeks.length&&rosterWeeks.length?statuses.partial:statuses.missing,weeklyRosterFiles:availableWeeks.length,expectedWeeklyRosterFiles:rosterWeeks.length,note:'Roster snapshots are not verified pre-lock eligible alternatives'},
   tradeSkill:{status:statuses.missing,note:'Not certified by source presence'},
   waiverSkill:{status:statuses.missing,note:'Not certified without complete alternatives and transaction context'},
   startSitSkill:{status:statuses.missing,note:'Not certified without lock-time eligibility and availability'},
   faabEfficiency:{status:statuses.missing,note:'Original bids and bidding alternatives not fully verified'}
  });
 }
}
const output={schema:'fellas-manager-season-evidence-matrix-v1',generatedAt:new Date().toISOString(),policy:'Source inventory only; no certified skill grades, no invented zeros, no provider refresh. A shared file does not establish complete manager-year coverage.',managerSeasons:entries};
const target=process.argv[2];
if(target){fs.mkdirSync(path.dirname(file(target)),{recursive:true});fs.writeFileSync(file(target),JSON.stringify(output,null,2)+'\n');}
else process.stdout.write(JSON.stringify(output,null,2)+'\n');
