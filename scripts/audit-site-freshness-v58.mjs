import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildHomeDashboard} from '../assets/home-app-v3.mjs';
import {recordWatchScoreInput} from '../assets/weekly-record-watch.mjs';
import {fellasLeague} from '../assets/league-config.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const data=name=>read('data/'+name+'.json');
const path='data/site-freshness-v58.json';
const year=fellasLeague.season;
const ledger=data('unified_record_book_2016_2026');
const guide=data('season_guide');
const dashboard=buildHomeDashboard(guide,ledger);
const week=dashboard.week;
const fingerprint=createHash('sha256').update(recordWatchScoreInput(ledger.games,year)).digest('hex');
const categorized=new Map();
const surfaces=[];
function surface(id,label,dataset,cutoff,policy,detail,verified=true){
  const status=!verified||!Number.isInteger(cutoff)?'UNVERIFIED'
    :cutoff>week?'AHEAD_OF_APPROVAL':policy==='archive'?'ARCHIVED'
    :cutoff===week?'CURRENT':'LAGGING';
  const row={id,label,dataset,throughWeek:Number.isInteger(cutoff)?cutoff:null,policy,status,detail};
  surfaces.push(row);
  categorized.set(dataset,row);
}
const scopeWeek=scope=>Number(String(scope??'').match(new RegExp(year+'\\s+Week\\s*(\\d+)', 'i'))?.[1]);
const weekList=rows=>Array.isArray(rows)&&rows.length&&rows.every((row,i)=>row.week===i+1)?rows.length:null;
const compact=data('home-current-season-v1');
const archive=data('manager_record_books_2016_2026');
const watch=data('weekly-record-ownership-v57');
const milestones=data('conditional-record-watch-v51');
const leaders=data('expanded-record-current-leaders-v58');
const expanded=data('expanded_records_verified_v1');
const race=data('playoff_race_v1');
const museum=data('trade_museum_stage66').filter(row=>row.year===year);
const players=data('player_starts_2026');
const acquisitions=data('acquisitions_2026');
const faab=read('data-integrity/faab-provider-receipts-2026.json');
const draft=data('fellas_2026_sleeper_draft_board_verified_v1');
const mirror=data('season_weekly_matchups_2016_2026_v1');
const mirrorGames=mirror.bySeason[year].games.filter(game=>game.stage==='regular').map(game=>({...game,year}));
const scoresMatch=doc=>recordWatchScoreInput(doc.games,year)===recordWatchScoreInput(ledger.games,year);

surface('canonical','Approved matchups','data/unified_record_book_2016_2026.json',week,'required','Five complete pairings per approved week.');
surface('standings','Season guide standings','data/season_guide.json',guide[year].standings[0].games,'required','Reconciled to approved matchup scores.');
surface('weekly-mirror','Weekly matchup mirror','data/season_weekly_matchups_2016_2026_v1.json',scopeWeek(mirror.scope),'required',
  'All current-season regular-season rows must agree with the approved ledger.',scoresMatch({games:mirrorGames}));
surface('home','Homepage scores','data/home-current-season-v1.json',compact.throughWeek,'required','Compact view must match the canonical scores.',scoresMatch(compact));
surface('ownership','Manager record books','data/manager_record_books_2016_2026.json',scopeWeek(archive.scope),'required',
  'Established ownership uses approved matchup and separately verified historical sources.',archive.asOf===ledger.updated);
surface('record-watch','Weekly ownership report','data/weekly-record-ownership-v57.json',watch.week,'required',
  'Verified ownership changes only.',watch.current?.seasonScoreHash===fingerprint);
surface('milestones','Attainable milestones','data/conditional-record-watch-v51.json',milestones.throughWeek,'required',
  'A chase targets a stated mark.',milestones.seasonScoreHash===fingerprint);
surface('expanded-leaders','Expanded first-place marks','data/expanded-record-current-leaders-v58.json',leaders.throughWeek,'required',
  'The same 44 definitions, recomputed from approved sources.',leaders.seasonScoreHash===fingerprint);
surface('expanded-archive','Expanded ranked archive','data/expanded_records_verified_v1.json',scopeWeek(expanded.scope),'archive',
  'Original ranked results, context and personal marks retain their historical cutoff.');
surface('playoff-race','Playoff race model','data/playoff_race_v1.json',race.verified_through_week,'required','Model estimates from finalized results and verified schedule.');
surface('schedule-luck','Schedule luck','data/schedule_luck_current_v1.json',data('schedule_luck_current_v1').currentThroughWeek,'required','Approved full-field matchups.');
surface('luck-profiles','Manager luck profiles','data/luck_performance_profiles_2016_2026_v1.json',data('luck_performance_profiles_2016_2026_v1').currentThroughWeek,
  'required','Current-season projection and separate completed-season research.');
surface('museum','Trade Museum starter scoring','data/trade_museum_stage66.json',
  museum.length&&museum.every(r=>Number.isInteger(r.scoring_through_week))?Math.min(...museum.map(r=>r.scoring_through_week)):null,
  'evidence','Receiving-roster starter scoring requires reviewed transactions, lineups and timing.');
surface('draft-production','Draft starter production','data/v9_draft_engine.json',null,'evidence',
  'The projection has no certified current-week lineage. The completed draft board is independently verified.');
surface('acquisitions','Acquisition and waiver archive','data/acquisitions_2026.json',weekList(acquisitions.weeks),'evidence',
  'Recorded acquisitions need independent transaction receipts.');
surface('faab','Certified FAAB bids','data-integrity/faab-provider-receipts-2026.json',weekList(faab.weeks),'evidence',
  'Winning and failed bids require reconciled provider receipts.',faab.issues?.length===0&&faab.weeks?.every(w=>w.ok===true));
surface('player-starters','Player starter history','data/player_starts_2026.json',weekList(players.weeks),'evidence',
  'Team-level scores and traded-player-only lineups cannot certify full starter boxes.');
const transactionWindows=[];
for(let slot=1;slot<=week;slot++){
  const file='data-integrity/provider-recovered-transactions-'+year+'-week'+slot+'.json';
  if(!fs.existsSync(file))break;
  const receipt=read(file);
  if(receipt.year!==year||receipt.week!==slot||!Array.isArray(receipt.transactions)||
    receipt.normalizedRows!==receipt.transactions.length)break;
  transactionWindows.push(file);
}
surface('player-transactions','Player transaction history',
  transactionWindows.at(-1)??'data/player_starts_2026.json',transactionWindows.length||null,'evidence',
  'Observed recovered transaction windows. Unresolved receiving directions remain separate.');
surface('draft-research','Draft research snapshot','data/draft_intelligence_research_2025_2026w8_v1.json',
  scopeWeek(data('draft_intelligence_research_2025_2026w8_v1').scope),'archive',
  'Historical draft and keeper research retains its verified projection cutoff.');
surface('sportscenter-archive','Packaged SportsCenter snapshot','data/sportscenter_v1.json',data('sportscenter_v1').last_completed_week,'archive',
  'Live SportsCenter uses the approved matchup ledger.');
assert.equal(draft.status,'complete');
assert.equal(draft.picks.length,draft.rounds*draft.teams);
const draftBoard={id:'draft-board',label:'Certified draft selections',dataset:'data/fellas_2026_sleeper_draft_board_verified_v1.json',
  throughWeek:null,policy:'season-event',status:'VERIFIED_EVENT',detail:'150 confirmed draft picks. This is a completed event, independent of weekly production.'};
surfaces.push(draftBoard);categorized.set(draftBoard.dataset,draftBoard);
function inventory(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const file=dir+'/'+entry.name;
    if(entry.isDirectory())return inventory(file);
    if(file===path)return [];
    if(entry.name.endsWith('.csv'))return [{dataset:file,declaredThroughWeek:null,status:'UNCLASSIFIED',
      detail:'Tabular export. Verify its matching source before a freshness claim.'}];
    if(!entry.name.endsWith('.json'))return [];
    const audited=categorized.get(file);
    if(audited)return [audited];
    const doc=read(file);
    const years=Array.isArray(doc)?doc.map(row=>row?.year):[doc?.year];
    if(years.length&&years.every(value=>Number.isInteger(value)&&value<year))
      return [{dataset:file,throughSeason:Math.max(...years),status:'HISTORICAL',
        detail:'Contains only earlier seasons. Review completeness in the corresponding archive.'}];
    const scope=doc?.scope??doc?.coverage;
    const direct=doc?.year===year||doc?.currentYear===year||doc?.currentSeason===year||doc?.season===year
      ?doc.throughWeek??doc.currentThroughWeek??doc.verified_through_week:null;
    const declared=Number.isInteger(direct)?direct:scopeWeek(scope);
    const cutoff=Number.isInteger(declared)?declared:null;
    return [{dataset:file,declaredThroughWeek:cutoff,status:cutoff===null?'UNCLASSIFIED':
      cutoff<week?'DECLARED_BEHIND':cutoff>week?'DECLARED_AHEAD':'DECLARED_MATCH',
      detail:'Inventory only. A declared scope is not certification.'}];
  });
}
const inventoryRows=inventory('data');
const assetFiles=['.html','.js','.mjs'];
const integrityReferences=new Set();
const embedded=[];
const skip=new Set(['node_modules','data','scripts']);
function scan(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=dir+'/'+entry.name;
    if(entry.name.startsWith('.')||skip.has(entry.name))continue;
    if(entry.isDirectory()){scan(file);continue;}
    if(!assetFiles.some(ext=>file.endsWith(ext)))continue;
    const source=fs.readFileSync(file,'utf8');
    for(const [match] of source.matchAll(/data-integrity\/[A-Za-z0-9._/-]+\.json\b/g))
      if(fs.existsSync(match)&&!categorized.has(match))integrityReferences.add(match);
    if(file.endsWith('.html')){
      let index=0;
      for(const [tag] of source.matchAll(/<script\b[^>]*type=["']application\/json["'][^>]*>/gi)){
        index++;
        embedded.push({dataset:file.slice(2)+'#'+(tag.match(/\bid=["']([^"']+)["']/i)?.[1]??'json-'+index),
          declaredThroughWeek:null,status:'UNCLASSIFIED',detail:'Embedded payload. Review the owning page and its source.'});
      }
    }
  }
}
scan('.');
inventoryRows.push(...embedded);
inventoryRows.push(...[...categorized.values()].filter(row=>row.dataset.startsWith('data-integrity/')));
for(const dataset of integrityReferences)inventoryRows.push({dataset,declaredThroughWeek:null,status:'UNCLASSIFIED',
  detail:'Referenced audit evidence. Review its source and coverage before a freshness claim.'});
inventoryRows.sort((a,b)=>a.dataset.localeCompare(b.dataset));
const inventoryCounts=Object.fromEntries(Object.entries(Object.groupBy(inventoryRows,row=>row.status)).map(([key,rows])=>[key,rows.length]));
const blockers=surfaces.filter(row=>row.policy==='required'&&row.status!=='CURRENT').map(row=>row.id);
const specialtyGaps=surfaces.filter(row=>row.policy==='evidence'&&row.status!=='CURRENT').map(row=>row.id);
const report={schemaVersion:1,year,approvedWeek:week,asOf:ledger.updated,seasonScoreHash:fingerprint,
  verifiedMatchups:dashboard.standings[0].games*5,surfaces,inventoryCounts,blockers,specialtyGaps};
const output=JSON.stringify(report,null,2)+'\n';
const args=process.argv.slice(2);
const inventoryPath=args.find(arg=>arg.startsWith('--inventory='))?.slice('--inventory='.length);
if(inventoryPath)fs.writeFileSync(inventoryPath,JSON.stringify({year,approvedWeek:week,rows:inventoryRows},null,2)+'\n');
if(args.includes('--write'))fs.writeFileSync(path,output);
else if(args.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),output,'Site freshness report has changed');
else console.log(output);
const required=args.find(arg=>arg.startsWith('--require='))?.slice('--require='.length);
if(required)for(const id of required.split(',')){
  assert.ok(surfaces.some(row=>row.id===id),'Unknown freshness surface '+id);
  if(surfaces.find(row=>row.id===id).status!=='CURRENT')blockers.push(id);
}
if(args.includes('--full'))blockers.push(...specialtyGaps);
if(blockers.length){
  console.error('Publication blocked for requested scope: '+[...new Set(blockers)].join(', '));
  process.exitCode=1;
}
