// Commissioner-verified 2023 team ownership: Evans managed the season;
// JMid joined only after 2023 concluded. Never infer historical ownership from
// Sleeper handle JMidd without a season-specific override.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const owner=read('data/manager_identity_map_v1.json');
assert.ok(owner.verifiedSleeperSeasonOwnershipOverrides.some(x=>x.year===2023&&x.providerHandle==='JMidd'&&x.owner==='Evans'&&x.replacementBegan===2024));
const ledger=read('data/unified_record_book_2016_2026.json');
const games=ledger.games.filter(g=>g.year===2023&&g.stage==='regular');
const forName=name=>games.filter(g=>g.home===name||g.away===name);
assert.equal(forName('JMid').length,0,'JMid must not own any 2023 regular-season game');
assert.equal(forName('Evans').length,14,'Evans must own all fourteen 2023 games');
const after=ledger.games.filter(g=>g.year===2023&&g.stage!=='regular');
assert.equal(after.filter(g=>g.home==='JMid'||g.away==='JMid').length,0,'JMid must not own 2023 playoffs');
assert.equal(after.filter(g=>g.home==='Evans'||g.away==='Evans').length,2,'Evans 2023 postseason receipts missing');
const career=read('data/career_core_generated.json').managers;
for(const name of ['JMid','Evans']){
 const own=ledger.games.filter(g=>g.stage==='regular'&&(g.home===name||g.away===name));
 const w=own.filter(g=>(g.home===name&&g.winner==='HOME')||(g.away===name&&g.winner==='AWAY')).length;
 const l=own.filter(g=>(g.home===name&&g.winner==='AWAY')||(g.away===name&&g.winner==='HOME')).length;
 const t=own.length-w-l;
 const r=career[name];assert.deepEqual([r.games,r.w,r.l,r.t],[own.length,w,l,t],name+' career record follows canonical finalized games');
}
assert.equal(career.JMid.annual['2023'],undefined);
assert.deepEqual([career.Evans.annual['2023'].w,career.Evans.annual['2023'].l],[9,5]);
const guide=read('data/season_guide.json');
assert.equal(guide['2023'].standings.some(x=>x.name==='JMid'),false);
assert.equal(guide['2023'].standings.find(x=>x.name==='Evans')?.w,9);
const placement=read('data/fellas_final_placements_2016_2025_verified.json');
assert.equal(placement.seasons.find(x=>x.year===2023).finishes.find(x=>x.rank===6).manager,'Evans');
assert.equal(placement.managers.find(x=>x.manager==='JMid').years.includes(2023),false);
assert.equal(placement.managers.find(x=>x.manager==='Evans').years.includes(2023),true);
const endings=read('data/manager_verified_season_endings_v1.json').managers;
assert.equal(endings.JMid.some(x=>x.year===2023),false);
assert.equal(endings.Evans.some(x=>x.year===2023),true);
const book=read('data/manager_record_books_2016_2026.json').managers;
for(const name of ['JMid','Evans']){
 const actual=book.find(x=>x.manager===name).regular;
 const expected=career[name];
 assert.deepEqual(actual,{games:expected.games,w:expected.w,l:expected.l,t:expected.t},name+' record book must match canonical career');
}
const season=read('data/manager_season_results_v1.json');
assert.equal(season.rows.some(x=>x.manager==='JMid'&&x.year===2023),false);
assert.equal(season.rows.some(x=>x.manager==='Evans'&&x.year===2023),true);
const p=read('data/manager_profile_career_summary_v2.json').managers;
assert.equal(p.JMid.years[0],2024);
assert.equal(p.Evans.years[1],2023);
const acq=read('data/manager_acquisition_by_season_v1.json').rows;
assert.equal(acq.some(x=>x.year===2023&&x.manager==='JMid'),false);
assert.equal(acq.some(x=>x.year===2023&&x.manager==='Evans'),true);
const legends=read('data/franchise_player_legends.json').managers.JMid;
assert.ok(legends.every(x=>!Object.hasOwn(x.seasons,'2023')));
const bio=read('data/manager_biographies_awards.json').managers.JMid.biography;
assert.ok(/joined.*after.*2023/i.test(bio));
assert.ok(!/25–25|2023.*9–5.*JMid/i.test(bio));
const html=fs.readFileSync('managers/jmid/index.html','utf8');
const jmidRecord=career.JMid.w+'–'+career.JMid.l+(career.JMid.t?'–'+career.JMid.t:'');
assert.ok(html.includes('>'+jmidRecord+'</strong>'),'JMid hero record must follow canonical weekly updates');
assert.ok(html.includes('Evans completed the 2023 season'));
const trophies=read('data/manager_historical_trophy_cases_v1.json').managers;
assert.equal(trophies.JMid.teamAwards.some(x=>x.year===2023),false,'JMid must have no 2023 manager trophy');
assert.ok(trophies.Evans.teamAwards.some(x=>x.year===2023&&x.label==='Scoring Champion'),'Evans must receive his 2023 scoring title');
const war=read('data/fellas_war_manager_summary_v1.json');
assert.ok(!war.byYear['2023'].some(x=>x.manager==='JMid'),'2023 player-based manager attribution must exclude JMid');
assert.ok(war.byYear['2023'].some(x=>x.manager==='Evans'),'2023 player-based manager attribution must credit Evans');
assert.equal(war.allTime.find(x=>x.manager==='JMid').starts,306,'JMid starter career research must exclude Evans 2023');
const expanded=read('data/expanded_records_verified_v1.json');
assert.equal(expanded.categoryCount,44);
for(const c of expanded.categories){
 assert.equal(c.leaders.some(x=>x.manager==='JMid'&&x.year===2023),false,'JMid cannot hold a 2023 record '+c.key);
 for(const r of c.leaders)if(r.year===2023)assert.notEqual(r.evidence?.opponent,'JMid','2023 opponents must be attributed to Evans');
}
assert.equal(expanded.signatures.JMid.highlights.some(x=>x.season===2023||x.evidence?.years?.includes(2023)||x.evidence?.fromYear===2023),false,'JMid signature records must start 2024');
const post=read('data/postseason_records_verified_v1.json');
assert.ok(post.brackets.find(x=>x.year===2023).participants.includes('Evans'));
assert.ok(!post.brackets.find(x=>x.year===2023).participants.includes('JMid'));
assert.ok(!post.managers.find(x=>x.manager==='JMid').appearances.includes(2023));
assert.ok(post.managers.find(x=>x.manager==='Evans').appearances.includes(2023));
console.log('PASS: Evans owns 2023; JMid begins 2024. Games, standings, careers, postseason, acquisitions, bios, and franchise legends agree.');
