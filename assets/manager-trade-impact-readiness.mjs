// Gate historical trade impact attribution on independently documented roster/availability evidence.
export function tradeImpactReadiness(event,coverage){
 const year=event.year,week=event.week;
 const weeks=coverage.weeks||[];
 const row=year===2025?weeks.find(x=>x.week===week):null;
 const rosterBeforeVerified=false; // No continuous pre-trade ownership snapshots certified.
 const rosterAfterVerified=Boolean(row?.benchRostersArchived);
 const replacementPoolVerified=Boolean(row?.availableReplacementPoolVerified);
 const availabilityAtLockVerified=Boolean(row?.freeAgentAvailabilityAtLockVerified);
 const weeklyStartersVerified=Boolean(row?.startersVerified);
 const reasons=[];
 if(year!==2025)reasons.push('Coverage gate presently documents only 2025');
 if(!weeklyStartersVerified)reasons.push('No certified weekly starter coverage for this event in the gate');
 if(!rosterBeforeVerified)reasons.push('No verified pre-trade full-roster snapshot and ownership continuity');
 if(!rosterAfterVerified)reasons.push('No complete bench snapshot for this trade week');
 if(!replacementPoolVerified)reasons.push('No verified replacement-player availability');
 if(!availabilityAtLockVerified)reasons.push('No pre-lock availability evidence');
 return {year,week,weeklyStartersVerified,benchSnapshotAvailable:rosterAfterVerified,preTradeRosterVerified:rosterBeforeVerified,replacementPoolVerified,availabilityAtLockVerified,causalTradeWarReady:false,decisionQualityReady:false,observedDirectEdgeAvailable:event.sides?.some(x=>Number.isFinite(x.direct_edge))||false,reasons};
}
export function aggregateTradeImpactReadiness(events,coverage){
 const rows=events.map(event=>tradeImpactReadiness(event,coverage));
 return {eventsReviewed:rows.length,withCertified2025Starters:rows.filter(x=>x.weeklyStartersVerified).length,withBenchWeekSnapshot:rows.filter(x=>x.benchSnapshotAvailable).length,certifiedCausalWar:rows.filter(x=>x.causalTradeWarReady).length,certifiedExAnteDecisionGrades:rows.filter(x=>x.decisionQualityReady).length};
}
