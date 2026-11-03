// Distinguish championship-bracket keeper starters from consolation/nonchampionship
// weeks using user-verified 2025 playoff bracket membership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const brackets=read('data/verified_sleeper_playoff_brackets_2020_2025.json');
const bracket=brackets.seasons.find(x=>x.year===2025);
const receipts=read('data-integrity/keeper-2025-playoff-started-receipts-v1.json');
const verified=read('data-integrity/keeper-2025-postseason-verification-v1.json');
assert.ok(bracket);
assert.equal(bracket.seeds.length,6);
assert.equal(bracket.semifinalists.length,4);
assert.equal(bracket.finalists.length,2);
assert.equal(bracket.byes.length,2);
assert.equal(new Set(bracket.seeds).size,6);
assert.ok(bracket.byes.every(x=>bracket.seeds.includes(x)));
assert.ok(bracket.semifinalists.every(x=>bracket.seeds.includes(x)));
assert.ok(bracket.finalists.every(x=>bracket.semifinalists.includes(x)));
const participantsByWeek=new Map([
 [15,bracket.seeds.filter(x=>!bracket.byes.includes(x))],
 [16,bracket.semifinalists],
 [17,bracket.finalists]
].map(([week,names])=>[week,new Set(names)]));
assert.equal(participantsByWeek.get(15).size,4);
assert.equal(participantsByWeek.get(16).size,4);
assert.equal(participantsByWeek.get(17).size,2);
const round=n=>Math.round(n*100)/100;
const managers=[...new Set(receipts.rows.map(x=>x.manager))].sort();
assert.equal(managers.length,10);
const rows=managers.map(manager=>{
 const players=receipts.rows.filter(x=>x.manager===manager);
 assert.equal(players.length,2);
 const observations=players.flatMap(p=>p.starts.map(s=>({
  player:p.player,providerPlayerId:p.playerId,week:s.week,points:s.points,
  isChampionshipBracketStart:participantsByWeek.get(s.week)?.has(manager)??false,
  classification:participantsByWeek.get(s.week)?.has(manager)?'championship_bracket':'other_week_15_to_17',
 }))).sort((a,b)=>a.week-b.week||a.player.localeCompare(b.player));
 const all=round(observations.reduce((n,x)=>n+x.points,0));
 const championship=round(observations.filter(x=>x.isChampionshipBracketStart).reduce((n,x)=>n+x.points,0));
 const other=round(observations.filter(x=>!x.isChampionshipBracketStart).reduce((n,x)=>n+x.points,0));
 assert.ok(Math.abs(all-round(championship+other))<.011);
 const verifiedPlayerSum=round(verified.rows.filter(x=>x.manager===manager).reduce((n,x)=>n+x.verifiedPoints,0));
 assert.ok(Math.abs(all-verifiedPlayerSum)<.011,'Archive mismatch '+manager);
 return {manager,qualifiedFor2025ChampionshipBracket:bracket.seeds.includes(manager),
  firstRoundBye:bracket.byes.includes(manager),semifinalist:bracket.semifinalists.includes(manager),
  finalist:bracket.finalists.includes(manager),champion:bracket.champion===manager,
  verifiedWeek15To17KeeperStartedPoints:all,
  verifiedChampionshipBracketKeeperStartedPoints:championship,
  otherWeek15To17KeeperStartedPoints:other,
  championshipKeeperStarts:observations.filter(x=>x.isChampionshipBracketStart).length,
  otherKeeperStarts:observations.filter(x=>!x.isChampionshipBracketStart).length,
  observations};
});
assert.equal(rows.length,10);
assert.ok(rows.filter(x=>x.qualifiedFor2025ChampionshipBracket).length===6);
assert.ok(rows.filter(x=>x.champion).length===1);
const sum=k=>round(rows.reduce((n,x)=>n+x[k],0));
assert.ok(Math.abs(sum('verifiedWeek15To17KeeperStartedPoints')-round(sum('verifiedChampionshipBracketKeeperStartedPoints')+sum('otherWeek15To17KeeperStartedPoints')))<.011);
const output={schema:'fellas-2025-keeper-championship-bracket-contribution-v1',
 status:'championship_match_membership_verified_from_user_bracket',
 bracketSource:brackets.source,
 bracketWeekMembership:Object.fromEntries([...participantsByWeek].map(([week,set])=>[week,[...set]])),
 coverage:{managers:10,championshipEntrants:6,keeperSelections:receipts.rows.length,
  allWeek15To17KeeperStarterPoints:sum('verifiedWeek15To17KeeperStartedPoints'),
  championshipKeeperStarterPoints:sum('verifiedChampionshipBracketKeeperStartedPoints'),
  otherWeek15To17KeeperStarterPoints:sum('otherWeek15To17KeeperStartedPoints')},
 caveats:['Only starter points in the six-team championship bracket count as championship playoff contributions.',
 'Week 15 byes are not championship starts; byes confer playoff advancement, not fictional keeper points.',
 'Eliminated or nonqualifying teams can still have starting points in consolation/placement games; preserve those separately.',
 'These are observed starting points, not incremental victories attributable to any keeper.',
 'No keeper decision grade or OVR is authorized by this classification.'],
 rows,keeperDecisionGrade:null,publicManagerOvrChangeAuthorized:false};
const path='data-integrity/keeper-2025-championship-bracket-contribution-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),output);
else fs.writeFileSync(path,JSON.stringify(output,null,2)+'\n');
console.log('2025 keeper championship bracket PASS: 6 qualifiers, '+output.coverage.championshipKeeperStarterPoints+' bracket starter points, '+output.coverage.otherWeek15To17KeeperStarterPoints+' other');
