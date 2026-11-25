import assert from 'node:assert/strict';
import {normalizeManager} from './legacy-record-definitions-v57.mjs';

const heldBack = [
  ['shared-matchup-event', 'Review whether the opposing role warrants a second ownership credit for the same matchup.',
    ['core:biggest-defeat','core:narrowest-defeat','core:giant-slayer-win']],
  ['recovered-games', 'Offer as a recovered regular-season mark. Missing paired games and raw cross-era scoring limit an unqualified league-wide claim.',
    ['core:lowest-score','core:highest-score-loss','core:lowest-score-win','core:most-games','core:career-points',
     'core:points-against','core:high-score-losses','core:rival-games','legacy:career-ppg','legacy:hundred-club',
     'legacy:one-twenty-club','legacy:one-forty-club','legacy:one-sixty-club','legacy:wins-vs-130',
     'legacy:wins-below-100','legacy:nailbiters','legacy:one-score-drama','legacy:thirty-plus-wins',
     'legacy:rival-percentage','legacy:rival-margin','legacy:rival-scoring']],
  ['observed-appearance-streak', 'Consecutive recorded appearances can span unobserved games and seasons. Display with the appearance-based definition.',
    ['legacy:winning-streak','legacy:scoring-streak-100','legacy:scoring-streak-120']],
  ['season-sample', 'A 12-game eligibility minimum can admit partial team-seasons. The scoring floor exhibit separately requires every scheduled score.',
    ['legacy:season-average','legacy:season-win-rate','legacy:season-point-diff','legacy:season-140-club']],
  ['complete-score-sample', 'Retain the complete-team-season qualification and show the threshold used for each scoring exhibit.',
    ['historical:highest-season-floor','historical:season-weeks-over100','historical:season-weeks-atleast105']],
  ['sleeper-placement-exhibit', 'Keep with the completed Sleeper standings. The league history includes ESPN, and Sleeper last place uses a specific losers-bracket format.',
    ['historical:sleeper-most_runner_up','historical:sleeper-most_bottom_three','historical:sleeper-most_shitter']],
  ['single-week-postseason-sample', 'Includes consolation and unclassified matchups while excluding cumulative and multiweek scoring. Keep its postseason scope explicit.',
    ['historical:postseason-highest-single-week','historical:postseason-lowest-single-week',
     'historical:postseason-biggest-win','historical:postseason-closest-win']]
];
const deferred = new Map(heldBack.flatMap(([disposition,reason,ids]) =>
  ids.map(id => [id,{disposition,reason}])
));
assert.equal(deferred.size,heldBack.reduce((sum,[,,ids])=>sum+ids.length,0));

function byManager(receipts) {
  const groups = new Map();
  for (const row of receipts) {
    const manager = normalizeManager(row.manager);
    const rows = groups.get(manager) ?? [];
    rows.push(row);
    groups.set(manager, rows);
  }
  return groups;
}

export function reviewPublicationCandidates(records, established, managers, postseason) {
  const candidates = new Map(records.map(record => [record.id,record]));
  const {espn,sleeper,allEra} = postseason;
  const brackets = [...espn.seasons,...sleeper.seasons].sort((a,b)=>a.year-b.year);
  assert.deepEqual(brackets.map(season=>season.year),allEra.seasons.map(season=>season.year),
    'Bracket and final placement coverage disagree');
  const finishes = byManager(allEra.seasons.flatMap(({year,teams,finishes}) =>
    finishes.map(({manager,rank})=>({manager,year,teams,rank}))
  ));
  const proposals = new Map();
  function add(id, observations, source) {
    assert.ok(observations.length && observations.every(row=>Number.isFinite(row.value)),id);
    const record = candidates.get(id);
    assert.equal(record?.ownerType,'manager',id);
    const value = Math.max(...observations.map(row=>row.value));
    const winners = byManager(observations.filter(row=>row.value===value));
    const holders = [...winners.keys()].sort();
    assert.equal(record.value,value,id+' official receipt mark');
    assert.deepEqual(record.holders.map(holder=>holder.ownerId).sort(),holders,id+' official receipt holders');
    proposals.set(id,{id,label:record.label,value,unit:record.unit,scope:record.scope,
      qualification:record.qualification,sources:source,holders:holders.map(manager=>({
        manager,evidence:winners.get(manager).flatMap(row=>row.evidence)
      }))});
  }
  function count(id, groups, source) {
    add(id,[...groups].map(([manager,evidence])=>({manager,value:evidence.length,evidence})),source);
  }

  const placementSource = ['data/fellas_final_placements_2016_2025_verified.json'];
  const bracketSources = ['data/verified_espn_playoff_brackets_2016_2019.json',
    'data/verified_sleeper_playoff_brackets_2020_2025.json'];
  count('historical:seasons-played',finishes,placementSource);
  count('historical:top-half-finishes',new Map([...finishes].map(([manager,rows])=>[
    manager,rows.filter(row=>row.rank<=Math.floor(row.teams/2))
  ])),placementSource);
  const percentile = row=>(row.teams-row.rank)/(row.teams-1);
  add('legacy:bounceback',[...finishes].flatMap(([manager,rows])=>rows.slice(1).flatMap((to,index)=>{
    const from=rows[index];
    if(to.year!==from.year+1)return [];
    return [{manager,value:Number((100*(percentile(to)-percentile(from))).toFixed(2)),evidence:[{from,to}]}];
  })),placementSource);

  for (const [id,names] of [
    ['historical:semifinals',season=>season.semifinalists],
    ['historical:playoff-byes',season=>season.byes],
    ['historical:top-seeds',season=>Object.keys(season.seedByManager).filter(manager=>season.seedByManager[manager]===1)]
  ]) count(id,byManager(brackets.flatMap(season=>names(season).map(manager=>({manager,year:season.year})))),bracketSources);

  const history = byManager(brackets.flatMap(season=>(season.participants??season.seeds)
    .map(manager=>({manager,year:season.year}))));
  const runs = [...history].flatMap(([manager,rows])=>rows.map(({year},index)=>{
    const evidence = rows.slice(index);
    const gap = evidence.findIndex((row,offset)=>row.year!==year+offset);
    const consecutive = gap<0?evidence:evidence.slice(0,gap);
    return {manager,value:consecutive.length,evidence:consecutive};
  }));
  add('historical:playoff-berth-streak',runs,bracketSources);

  const decisions = records.map(record=>{
    if(proposals.has(record.id))return {id:record.id,disposition:'proposed-addition',
      reason:'Marks and all tied holders independently reconcile against official placements or verified brackets.'};
    const decision = deferred.get(record.id);
    if(decision)return {id:record.id,...decision};
    assert.ok(record.id.startsWith('historical:legendary-'),'Missing publication decision '+record.id);
    return {id:record.id,disposition:'legendary-exhibit',
      reason:'Keep in the Legendary Records collection with its champion, finalist, bracket-round or scoring-format qualification.'};
  });

  const establishedIds = new Set(established.map(row=>row.canonicalId));
  assert.ok([...proposals.keys()].every(id=>!establishedIds.has(id)));
  for (const id of [...deferred.keys(),...proposals.keys()])assert.ok(candidates.has(id),id);
  const recordsForPreview = [...proposals.values()];
  const portfolios = managers.map(ownerId=>{
    const current = established.filter(record=>record.holders.includes(ownerId));
    const additions = recordsForPreview.filter(record=>record.holders.some(holder=>holder.manager===ownerId));
    const sole = current.filter(record=>record.holders.length===1).length +
      additions.filter(record=>record.holders.length===1).length;
    const total = current.length+additions.length;
    return {ownerId,current:current.length,addedRecordIds:additions.map(record=>record.id),total,sole,shared:total-sole};
  });
  assert.equal(portfolios.reduce((sum,row)=>sum+row.addedRecordIds.length,0),
    recordsForPreview.reduce((sum,record)=>sum+record.holders.length,0));
  return {status:'review-preview',currentCategoryCount:established.length,
    previewCategoryCount:established.length+recordsForPreview.length,
    decisions,proposedRecords:recordsForPreview,portfolios};
}
