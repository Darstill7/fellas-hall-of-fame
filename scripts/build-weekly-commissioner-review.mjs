// Generate a fact-only, commissioner-readable release summary. No source changes.
// node scripts/build-weekly-commissioner-review.mjs --candidate=... --before=/tmp/prior-week --output=/tmp/review.md
import fs from 'node:fs';
import path from 'node:path';
const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)];}));
if(!args.candidate||!args.before||!args.output||!args['staging-commit'])
 throw Error('Require --candidate=... --before=... --output=... --staging-commit=<40-character SHA>');
if(!/^[0-9a-f]{40}$/.test(args['staging-commit']))throw Error('Invalid staging source commit');
const read=x=>JSON.parse(fs.readFileSync(x,'utf8'));
const old=name=>read(path.join(args.before,name));
const now=name=>read(path.join('data',name));
const candidate=read(args.candidate);
const ledger=now('unified_record_book_2016_2026.json');
const prev=old('unified_record_book_2016_2026.json');
const race=now('playoff_race_v1.json'),priorRace=old('playoff_race_v1.json');
const current=now('current_2026_records_v1.json'),previous=old('current_2026_records_v1.json');
const alltime=now('alltime_game_records_live_v1.json'),priorAlltime=old('alltime_game_records_live_v1.json');
const career=now('alltime_career_records_live_v1.json'),priorCareer=old('alltime_career_records_live_v1.json');
const milestones=now('ledger_milestones_live_v1.json'),priorMilestones=old('ledger_milestones_live_v1.json');
const week=candidate.week,oldWeek=week-1;
if(candidate.status!=='REVIEW_REQUIRED'||candidate.year!==2026||candidate.matchupCount!==5||
 candidate.games?.length!==5||!Number.isInteger(week)||week<2||week>14)
 throw Error('Not a complete review candidate');
const canonical=ledger.games.filter(x=>x.year===2026&&x.stage==='regular');
const was=prev.games.filter(x=>x.year===2026&&x.stage==='regular');
if(was.length!==oldWeek*5||canonical.length!==week*5||race.verified_through_week!==week||current.verified_through_week!==week)
 throw Error('Missing or stale canonical matchup, playoff, or 2026 record source');
if(alltime.verified2026ThroughWeek!==week||career.verified2026ThroughWeek!==week||milestones.verified2026ThroughWeek!==week)
 throw Error('Historical record feeds have inconsistent week coverage');
const added=canonical.filter(x=>x.week===week);
const id=g=>[g.home,g.away,g.homeScore,g.awayScore].join('|');
const l=x=>x.slice().map(id).sort();
if(JSON.stringify(l(added))!==JSON.stringify(l(candidate.games)))
 throw Error('Approved ledger game scores differ from the reviewed candidate');
const fmt=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:2});
const escape=s=>String(s??'').replace(/[|\n\r]/g,' ');
const alias=x=>x==='Tom'?'Thommy':x;
const match=added.map(g=>'| '+escape(alias(g.home))+' | '+fmt(g.homeScore)+' | '+escape(alias(g.away))+' | '+fmt(g.awayScore)+' |');
const teams=Object.entries(race.teams).map(([manager,row])=>{
 const old=priorRace.teams[manager];
 if(!old)throw Error('Prior playoff team missing '+manager);
 return {manager:alias(manager),w:row.w,l:row.l,dw:row.w-old.w,dl:row.l-old.l,pf:row.pf,dp:Math.round((row.pf-old.pf)*100)/100};
}).sort((a,b)=>b.w-a.w||b.pf-a.pf);
const recordDiff=(a,b)=>a.records.filter(r=>{const old=b.records.find(x=>x.key===r.key);return !old||old.value!==r.value||JSON.stringify(old.holders.map(h=>h.manager))!==JSON.stringify(r.holders.map(h=>h.manager));});
const changed=[...recordDiff(alltime,priorAlltime),...recordDiff(career,priorCareer),...recordDiff(milestones,priorMilestones)];
const compareCurrent=Object.entries(current.records).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(previous.records[key]));
const evidence=['[ ] Confirm all five final score pairs against Sleeper','[ ] Review the standings and playoff changes','[ ] Confirm record changes and evidence','[ ] Confirm new trade receipts separately (Trade Museum does not auto-update)','[ ] Require green canonical, browser/mobile and release checks','[ ] Merge only after commissioner approval; then confirm deployed Pages byte parity'];
const lines=[
 '# The Fellas — Week '+week+' commissioner release review','',
 '**Status:** Generated from approved-score candidate; this document is a review aid, not a publication authorization.',
 '**Staging source commit:** `'+args['staging-commit']+'`',
 '**Candidate status:** `'+candidate.status+'` · **Verified canonical games:** '+canonical.length+' · **Previous:** '+was.length,'',
 '## Five completed matchups',
 '| Home | Points | Away | Points |','| --- | ---: | --- | ---: |',...match,'',
 '## Updated standings (wins/losses and weekly changes)',
 '| Manager | W–L | ΔW | ΔL | Points for | Δ Points |',
 '| --- | ---: | ---: | ---: | ---: | ---: |',
 ...teams.map(t=>'| '+escape(t.manager)+' | '+t.w+'–'+t.l+' | +'+t.dw+' | +'+t.dl+' | '+fmt(t.pf)+' | +'+fmt(t.dp)+' |'),'',
 '## Record changes',
 ...(changed.length?changed.map(r=>'- **'+escape(r.title)+'**: '+fmt(r.value)+' — '+r.holders.map(h=>escape(alias(h.manager))+(h.year?' ('+h.year+')':'')).join(', ')):['No changed ledger-derived all-time record leaders.']),
 '**Current-season scoring highlights changed:** '+compareCurrent.map(([k])=>k.replaceAll('_',' ')).join(', ').replace(/^$/,'None'), '',
 '## Trade Museum',
 'Not automatically updated from matchups. New completed trades require transaction receipt review, asset verification and separate approval. Do not interpret existing audited starter-point snapshots as current.','',
 '## Commissioner approval checklist',...evidence,'',
 '_Generated automatically. Do not merge this release merely because the numbers appear here._',''
];
fs.writeFileSync(args.output,lines.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n'));
console.log('Review report generated: Week '+week+'; '+added.length+' games; '+changed.length+' historical category changes.');
