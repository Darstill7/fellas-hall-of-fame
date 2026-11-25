import assert from 'node:assert/strict';
import {reviewPublicationCandidates} from './record-publication-review-v57.mjs';
import {findOwnedRecords, establishedRecordSources, recordCategoryLabels} from '../assets/manager-record-ownership.mjs';

const researchFamilies = {
  position:'Reconciled Sleeper lineup samples with missing or excluded team-weeks.',
  'champion-position':'Champion-side semifinal and final lineup samples only.',
  'team-scoring':'Full-field weekly ranks, consecutive NFL weeks or fixed scoring windows. Eligibility differs from career appearances.',
  'draft-trade':'Archived draft outcomes and reconciled direct two-sided trades. Incomplete and multi-team trades are excluded from edge comparisons.',
  waiver:'Observed FAAB receipts and attributed starter observations with uneven coverage.',
  keeper:'Observed keeper cohorts and selected draft peers. The eligible populations differ from the draft archive.',
  transaction:'Completed provider transactions in numbered Sleeper windows. Counts include qualifying multi-team participation.',
  'champion-acquisition':'Champion-side starters attributed to documented incoming trades. Unmatched years have no observed result.',
  lineup:'Reconciled roster observations measured against a hindsight lineup optimum.',
  luck:'Modeled all-play comparisons over full-field weeks only.',
  player:'Player-ID records for observed Sleeper starter production.',
  'player-champion':'Player-ID records for unambiguously linked champion-side starts.',
  'player-transaction':'Player-ID records for recovered transactions. Trade appearances do not assign receiving sides.'
};

// Distinct even when the same performance or transaction provides evidence.
const scopeComparisons = [
  ['draft-trade:trade-observed-season-events-high', 'transaction:transaction-season-trades-max',
    'The archived verified two-sided sample excludes multi-team events. The provider count counts each completed trade once per participating manager.'],
  ['draft-trade:trade-observed-career-events-high', 'transaction:transaction-career-trades-max',
    'Career totals inherit different trade eligibility and coverage.'],
  ['draft-trade:trade-acquired-started-points-high', 'champion-acquisition:championship-run-trade-points',
    'The latter counts only starts in the title winner’s semifinal and final.'],
  ['waiver:faab-season-completedClaims-max', 'transaction:transaction-season-adds-max',
    'Successful waiver claim events and individual nontrade additions use different event units and populations.'],
  ['keeper:draft-peer-return-max', 'draft-trade:draft-pick-points-high',
    'Keeper-peer comparison measures return against a cohort benchmark, while the draft record measures raw starter points.'],
  ['position:qb-individual-starter-max', 'champion-position:champion-championship-qb-individual-starter-max',
    'The championship category requires a starter from the title-winning side in the final.'],
  ['champion-position:champion-championship-qb-individual-starter-max', 'player-champion:player-champion-championship-qb-max',
    'The same performance can credit the starting manager and the identifiable player. Each belongs to its own ownership type.'],
  ['champion-acquisition:champion-championship-trade-player-points', 'player-champion:player-champion-championship-score-max',
    'The acquisition record credits the receiving manager and requires a documented trade. The player score record credits the player.'],
  ['core:points-against', 'luck:schedule-strength-career-max',
    'Raw opponent points over paired games and mean opponent percentile over full-field weeks use different units and coverage.'],
  ['core:highest-score', 'lineup:lineup-week-optimum-max',
    'Points scored by starters and hypothetical optimal points from the roster measure different outcomes.'],
  ['legacy:season-average', 'position:qb-completed-season-average-max',
    'Team points per recorded game and reconciled quarterback starter production per eligible week use different events.']
];

export function reviewOwnershipScope(records, establishedPanel, archive, guide, postseason) {
  const byId = new Map(records.map(record => [record.id, record]));
  const panelById = new Map(establishedPanel.map(row => [row.canonicalId, row]));
  assert.equal(panelById.size, establishedPanel.length, 'Duplicate established ownership category');
  const holdings = archive.managers.flatMap(({manager}) =>
    findOwnedRecords(archive, guide, manager, postseason).map(record => ({...record, manager}))
  );
  const established = establishedPanel.map(row => {
    const record = byId.get(row.canonicalId);
    const publicHolders = holdings.filter(holding => holding.label === row.label);
    assert.ok(publicHolders.length, 'Missing established ownership evidence for ' + row.label);
    const holders = publicHolders.map(holding => holding.manager).sort();
    const value = publicHolders[0].value;
    assert.ok(publicHolders.every(holding => holding.value === value && holding.shared === (holders.length > 1)));
    if (row.decision === 'alias') {
      assert.equal(value, record.value, row.canonicalId);
      assert.deepEqual(holders, record.holders.map(holder => holder.ownerId).sort(), row.canonicalId);
    }
    const anchor = publicHolders[0].anchor;
    assert.ok(anchor && establishedRecordSources(row.label).length, row.label);
    return {...row, anchor, value, holders};
  });

  assert.equal(new Set(established.map(row => row.anchor)).size, established.length);
  const candidateDecisions = records.map(record => {
    const panel = panelById.get(record.id);
    if (panel) {
      assert.equal(record.ownerType, 'manager', record.id);
      return {id:record.id, disposition:panel.decision === 'alias' ? 'established-equivalent' : 'different-published-scope',
        reason:panel.rationale};
    }
    const reason = researchFamilies[record.family];
    if (reason) return {id:record.id, disposition:'scoped-research', reason};
    assert.ok(['core','historical','legacy'].includes(record.family), 'Missing review for ' + record.family);
    return {id:record.id, disposition:'publication-reviewed',
      reason:'Part of the wider recovered-game or official-placement registry, outside the established ownership collection.'};
  });

  const comparisons = scopeComparisons.map(([leftId,rightId,reason]) => {
    assert.ok(byId.has(leftId) && byId.has(rightId), 'Unresolvable review comparison ' + leftId + ' / ' + rightId);
    return {leftId, rightId, decision:'distinct-scope', reason};
  });
  const publicationCandidates = candidateDecisions.filter(row=>row.disposition==='publication-reviewed')
    .map(row=>byId.get(row.id));
  const publicationReview = reviewPublicationCandidates(publicationCandidates,established,
    archive.managers.map(row=>row.manager),postseason);
  const additions = publicationReview.proposedRecords.map(record=>{
    const published = holdings.filter(holding=>holding.label===record.label);
    assert.deepEqual(published.map(row=>row.manager).sort(),record.holders.map(holder=>holder.manager).sort(),record.id);
    assert.ok(published.every(row=>row.value===record.value && row.unit===record.unit &&
      row.shared===(record.holders.length>1) && row.anchor && establishedRecordSources(row.label).length),record.id);
    return {canonicalId:record.id,label:record.label,anchor:published[0].anchor};
  });
  const siteCollection = [...established,...additions];
  assert.deepEqual(siteCollection.map(row=>row.label),recordCategoryLabels);
  assert.equal(new Set(siteCollection.map(row=>row.anchor)).size,siteCollection.length);
  for(const {ownerId,total,sole,shared} of publicationReview.portfolios){
    const records = holdings.filter(holding=>holding.manager===ownerId);
    assert.equal(records.length,total,ownerId);
    assert.equal(records.filter(holding=>holding.shared).length,shared,ownerId);
    assert.equal(records.filter(holding=>!holding.shared).length,sole,ownerId);
  }
  return {established, candidateDecisions, comparisons, publicationReview, siteCollection};
}
