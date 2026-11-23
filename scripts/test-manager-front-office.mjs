// Source-scope and identity checks for Front Office 3.0; no fabricated grades.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {frontOfficeEvidence,renderFrontOffice,frontOfficeTimeline} from '../assets/manager-front-office.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const draft=read('data/manager_draft_trade_profile_evidence_v1.json');
const waivers=read('data/manager_acquisition_by_season_v1.json');
const trades=read('data/trade_museum_stage66.json');
const profiles={birch:'Birch',jmid:'JMid',kuhl:'Kuhl',mitch:'Mitch',scott:'Scott',stew:'Stew',stilly:'Stilly',stover:'Stover',tom:'Thommy',tony:'Tony'};
assert.equal(Object.keys(profiles).length,10);
for(const [slug,manager] of Object.entries(profiles)){
 const html=readFileSync(new URL('../managers/'+slug+'/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('manager-career-snapshot.mjs'),'Existing profile must load Front Office via shared JS');
 const result=frontOfficeEvidence(draft,waivers,trades,manager);
 assert.equal(result.selectedDraftYears,draft.rows.filter(r=>r.manager===manager).length);
 assert.equal(result.distinctAcquisitions,waivers.rows.filter(r=>r.manager===manager).reduce((s,r)=>s+r.distinctPlayerAdds,0));
 assert.equal(result.acquisitionsWithLaterStarts,waivers.rows.filter(r=>r.manager===manager).reduce((s,r)=>s+r.withLaterRecordedStarts,0));
 const tradeName=manager==='Thommy'?'Tom':manager;
 const raw=trades.filter(t=>t.sides.some(s=>s.manager===manager||s.manager===tradeName));
 assert.equal(result.documentedTrades,raw.length,'Cannot infer missing trade transactions '+manager);
 assert.ok(result.acquisitionsWithLaterStarts<=result.distinctAcquisitions,'Observed later-start count cannot exceed distinct adds '+manager);
 assert.ok(result.draftYears.every((r,i,a)=>i===0||a[i-1].year>=r.year));
 assert.ok(result.waiverYears.every((r,i,a)=>i===0||a[i-1].year>=r.year));
 const yearbook=frontOfficeTimeline(result);
 assert.ok(yearbook.length>0,'Every current manager should have at least one documented front-office year');
 assert.ok(yearbook.every((y,i,all)=>i===0||all[i-1].year>y.year),'Timeline must sort most recent first');
 assert.equal(yearbook.reduce((s,y)=>s+y.tradeReceiptCount,0),result.documentedTrades,'No five-trade preview cap may leak into annual archive counts '+manager);
 assert.equal(yearbook.reduce((s,y)=>s+(y.distinctAdds??0),0),result.distinctAcquisitions,'Waiver seasons must reconcile '+manager);
 assert.equal(yearbook.filter(y=>y.draftPicks!==null).length,result.selectedDraftYears,'Draft yearbook coverage must reconcile '+manager);
 assert.ok(yearbook.every(y=>y.year<2020||y.distinctAdds!==null||!waivers.rows.some(x=>x.year===y.year&&x.manager===manager)),'Available pickup data must not be hidden');
 if(yearbook.some(y=>y.year<2020)){
  assert.ok(yearbook.filter(y=>y.year<2020).every(y=>y.distinctAdds===null),'ESPN-era pickup history must not be fabricated');
 }
 const markup=renderFrontOffice(result);
 assert.match(markup,/Front Office 3\.0/);
 assert.ok(markup.includes('Front-office yearbook'),'Yearbook must be accessible');
 if(yearbook.some(y=>y.distinctAdds===null))assert.ok(markup.includes('Not covered'),'Missing waiver source must be presented as unknown rather than zero');
 assert.equal((markup.match(/Draft: /g)||[]).length,yearbook.length,'Each season needs a draft coverage label');

 assert.match(markup,/research inventory, not a grade/i);
 assert.ok(markup.includes('2026 partial'),'2026 waiver coverage must be marked partial');
 assert.ok(markup.includes('through '+draft.seasonCutoff.year+' Week '+draft.seasonCutoff.throughWeek),'Old draft cutoff must never be masked by approved score week');
 assert.ok(markup.includes(result.latestTradeDate),'Actual latest trade receipt cutoff must be displayed');
 assert.ok(!markup.includes('trade winner'),'Do not claim trade winners or skill rankings');
 assert.equal((markup.match(/View receipt<\/a>/g)||[]).length,result.relevantTrades.length);
 if(manager==='JMid')assert.ok(!result.waiverYears.some(r=>r.year===2023),'The 2023 JMid roster slot belongs to Evans');
 if(manager==='Thommy'&&result.documentedTrades)assert.ok(raw.some(t=>t.sides.some(s=>s.manager==='Tom')),'Tom alias must resolve only Trade Museum sides');
}
assert.throws(()=>frontOfficeEvidence({...draft,status:'graded'},waivers,trades,'Stilly'),/provenance/);
assert.throws(()=>frontOfficeEvidence(draft,{...waivers,status:'skill_ratings'},trades,'Stilly'),/provenance/);
assert.throws(()=>frontOfficeEvidence(draft,waivers,[{id:'broken',year:2026}], 'Stilly'),/invalid/);
assert.throws(()=>frontOfficeEvidence(draft,waivers,trades,'NoSuchManager'),/No documented/);
const unchanged=frontOfficeEvidence(draft,waivers,trades,'Stilly');
assert.equal(renderFrontOffice(unchanged),renderFrontOffice(unchanged),'Rendering must be deterministic');
console.log('FRONT OFFICE 3.0 PASS: all ten profiles, draft coverage, trade aliases, waiver tallies and evidence guards.');
