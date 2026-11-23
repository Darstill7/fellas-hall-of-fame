// Compare automatically staged Sleeper transactions against the audited Trade Museum.
// No player-name decoding, receipt certification, score calculations, or site publication.
import fs from 'node:fs';
const args=process.argv.slice(2);
const candidatePath=args.find(x=>x.startsWith('--candidate='))?.slice('--candidate='.length);
const reportPath=args.find(x=>x.startsWith('--output='))?.slice('--output='.length);
if(!candidatePath||!/^data-integrity\/sleeper-sync-candidates\/2026-trades-through-week\d+\.json$/.test(candidatePath))
 throw Error('Provide --candidate=data-integrity/sleeper-sync-candidates/2026-trades-through-weekN.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const staged=read(candidatePath);
if(staged.schema!=='fellas-sleeper-raw-trade-review-v1'||staged.status!=='REVIEW_REQUIRED'||staged.year!==2026||
 staged.league!=='1340027406009761792'||!Number.isInteger(staged.through_week)||staged.through_week<1||staged.through_week>14||
 !Array.isArray(staged.trades))throw Error('Unrecognized raw trade review candidate');
const listed=read('data/trade_museum_stage66.json');
if(!Array.isArray(listed))throw Error('Audited museum must be an array');
const ids=new Set(listed.map(x=>String(x.id)));
const listedById=new Map(listed.map(x=>[String(x.id),x]));
// 2026 roster IDs are league-specific. Compare participant identity even for
// already-listed trades so a reused ID cannot silently mask source drift.
const rosterOwner=new Map([[1,'Stilly'],[2,'JMid'],[3,'Tom'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const seen=new Set(),missing=[],alreadyListed=[],participantConflicts=[];
for(const t of staged.trades){
 const id=String(t.transaction_id||'');
 if(!/^\d+$/.test(id)||seen.has(id))throw Error('Invalid/duplicate Sleeper trade '+id);
 seen.add(id);
 if(!Number.isInteger(t.week)||t.week<0||t.week>staged.through_week||!Array.isArray(t.roster_ids)||
 t.roster_ids.length<2||new Set(t.roster_ids).size!==t.roster_ids.length)
  throw Error('Incomplete multi-party trade identity for '+id);
 const raw={transaction_id:id,week:t.week,roster_ids:t.roster_ids,
  player_ids_in_adds:Object.keys(t.adds||{}).sort(),
  player_ids_in_drops:Object.keys(t.drops||{}).sort(),
  raw_faab_entries:Array.isArray(t.waiver_budget)?t.waiver_budget.length:0,
  raw_draft_entries:Array.isArray(t.draft_picks)?t.draft_picks.length:0,
  issues:[]};
 if(raw.player_ids_in_adds.length===0&&raw.player_ids_in_drops.length===0)
  raw.issues.push('No observed player movement; classify potential FAAB-only/test receipt before entering player-trade museum');
 if(raw.raw_faab_entries>0)raw.issues.push('FAAB transfer present — validate manager, amount and eligibility');
 if(raw.raw_draft_entries>0)raw.issues.push('Draft-pick fields present — reconcile against league prohibition; do not assert a valid draft-pick trade');
 if(raw.player_ids_in_adds.length!==raw.player_ids_in_drops.length)
  raw.issues.push('Incoming/outgoing ID counts differ — inspect provider ownership mapping');
 if(ids.has(id)){
  alreadyListed.push(raw);
  const previous=listedById.get(id);
  const expectedOwners=t.roster_ids.map(r=>rosterOwner.get(Number(r)));
  const certifiedOwners=previous?.sides?.map(s=>s.manager)||[];
  if(previous?.year!==2026||expectedOwners.some(name=>!name)||
     expectedOwners.length!==certifiedOwners.length||
     new Set(expectedOwners).size!==new Set(certifiedOwners).size||
     expectedOwners.some(name=>!certifiedOwners.includes(name))){
   raw.issues.push('Existing museum participant sides differ from current 2026 provider roster IDs');
   participantConflicts.push(raw);
  }
 }else missing.push(raw);
}
missing.sort((a,b)=>a.week-b.week||a.transaction_id.localeCompare(b.transaction_id));
const result={
 schema:'fellas-trade-museum-review-diff-v1',status:'REVIEW_REQUIRED',through_week:staged.through_week,
 source:candidatePath, museum_source:'data/trade_museum_stage66.json',
 staged_completed_trades:staged.trades.length, museum_current_receipts:listed.length,
 matched_museum_ids:alreadyListed.length, new_provider_ids_awaiting_review:missing.length,
 existing_ids_with_participant_conflicts:participantConflicts.length,
 participant_conflicts:participantConflicts,
 review_queue:missing,
 disclaimers:[
  'A new provider ID is NOT automatically a publishable trade or proof of asset direction.',
  'Raw Sleeper roster IDs and player IDs must be mapped against the season-specific team/players archive.',
  'FAAB, pick fields and three-team transactions need transaction-specific review.',
  'Historic starter points and trade grades are not recalculated by this staging diff.'
 ]
};
const summary=[
 '## Trade Museum — new transactions requiring source review',
 'Sleeper completed trade receipts through Week '+staged.through_week+': **'+staged.trades.length+'**',
 'Already listed by transaction ID: **'+alreadyListed.length+'**',
 'Not yet listed by transaction ID: **'+missing.length+'**',
 'Previously listed IDs with roster-identity conflicts: **'+participantConflicts.length+'**',
 ...participantConflicts.map(t=>'- CONFLICT Week '+t.week+' · trade `'+t.transaction_id+'` · museum participants disagree with 2026 roster identity map; independently re-review before relying on receipt'),
 '',
 ...missing.map(t=>'- Week '+t.week+' · trade `'+t.transaction_id+'` · '+t.roster_ids.length+' roster participants · '+t.player_ids_in_adds.length+' raw additions · '+t.raw_faab_entries+' FAAB entries · '+t.raw_draft_entries+' pick entries'+(t.issues.length?' · review: '+t.issues.join('; '):'')),
 '',
 '**None of these raw transactions are approved for publication or trade-value grading.**'
].join('\n');
if(reportPath){
 if(!/^data-integrity\/sleeper-sync-candidates\/2026-trade-review-through-week\d+\.json$/.test(reportPath))
  throw Error('Report output must be in the weekly review staging directory');
 fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n');
}
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
console.log(summary);
