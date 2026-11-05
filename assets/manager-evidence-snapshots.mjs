// Descriptive historical evidence. These values NEVER become implicit manager skill ratings.
export const ACTIVE_MANAGERS=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
export function buildEvidenceSnapshots({placements,acquisitions,pickupSeasons=null,keeperResearch,keeper2026=null,startSit,draftTrade,faab=null}){
 const map=new Map();
 const unique=(rows,label)=>{const d=new Map();for(const row of rows){if(d.has(row.manager))throw Error('Duplicate '+label+' manager '+row.manager);d.set(row.manager,row)}return d};
 const finish=unique(placements.managers,'finishing');
 const pickups=unique(acquisitions.byManager,'pickup');
 const keepers=unique(keeperResearch.rows,'keeper');
 const currentKeepers=keeper2026?unique(keeper2026.rows,'2026 keeper'):new Map();
 const accuracy=unique(startSit.data,'start/sit');
 const faabMap=faab?unique(faab.managerTotals,'FAAB'):new Map();
 const pickupSeasonMap=new Map();
 if(pickupSeasons)for(const item of pickupSeasons.rows){
  if(!pickupSeasonMap.has(item.manager))pickupSeasonMap.set(item.manager,[]);
  pickupSeasonMap.get(item.manager).push(item);
 }
 const faabSeasonMap=new Map();
 if(faab)for(const season of faab.managerSeasons){
  if(!faabSeasonMap.has(season.manager))faabSeasonMap.set(season.manager,[]);
  faabSeasonMap.get(season.manager).push(season);
 }
 if(faab&&faab.status!=='provider_observed_no_skill_grade')throw Error('FAAB source is not provider-observed research');
 if(keeperResearch.season!==2025||(keeper2026&&(keeper2026.season!==2026||keeper2026.throughWeek!==8))||startSit.season!==2026||startSit.throughWeek!==8)
  throw Error('Descriptive keeper and lineup source periods changed');
 for(const name of ACTIVE_MANAGERS){
  const f=finish.get(name),a=pickups.get(name),k=keepers.get(name),current=currentKeepers.get(name),h=accuracy.get(name),bid=faabMap.get(name);
  if(!f||!a||!k||!h||(faab&&!bid)||(keeper2026&&!current))throw Error('Missing manager evidence for '+name);
  if(!Number.isInteger(f.seasonsPlayed)||f.seasonsPlayed<1||
     !Number.isFinite(f.meanFinishScore)||!Number.isInteger(f.topThree)||
     !Number.isInteger(a.distinctSeasonPlayerAcquisitions)||
     !Number.isInteger(a.withRecordedLaterStart)||
     a.withRecordedLaterStart>a.distinctSeasonPlayerAcquisitions||
     !Number.isFinite(k.regularStartedPoints)||k.officialKeeperDecisionGrade!==null||
     !Number.isFinite(h.accuracyPercent)||h.accuracyPercent<0||h.accuracyPercent>100)
   throw Error('Invalid evidence values for '+name);
  if(bid&&(!Number.isInteger(bid.completedClaims)||!Number.isInteger(bid.failedClaims)||
   !Number.isInteger(bid.paidWins)||!Number.isInteger(bid.zeroDollarWins)||
   !Number.isInteger(bid.completedBidSpend)||bid.completedBidSpend<0||
   bid.completedClaims!==bid.paidWins+bid.zeroDollarWins))
   throw Error('Provider FAAB claim totals do not reconcile for '+name);
  if(current&&(!Number.isFinite(current.regularStartedPoints)||
   !Number.isInteger(current.verifiedOriginalManagerStarts)||current.verifiedOriginalManagerStarts<0||
   current.officialKeeperDecisionGrade!==null))
   throw Error('Unrated partial-season keeper evidence must remain source-backed for '+name);
  const perYear=(pickupSeasonMap.get(name)||[]).slice().sort((x,y)=>x.year-y.year);
  if(pickupSeasons&&(
   perYear.reduce((t,x)=>t+x.distinctPlayerAdds,0)!==a.distinctSeasonPlayerAcquisitions||
   perYear.reduce((t,x)=>t+x.withLaterRecordedStarts,0)!==a.withRecordedLaterStart||
   perYear.reduce((t,x)=>t+x.repeatedEventRows,0)!==a.reacquisitions||
   perYear.some(x=>x.distinctPlayerAdds<x.withLaterRecordedStarts||x.distinctPlayerAdds<0)))
   throw Error('Acquisition per-year sums mismatch canonical manager totals '+name);
  if(current){
   const keeperStarts=current.keepers.reduce((n,p)=>n+p.starts,0);
   const keeperPoints=current.keepers.reduce((n,p)=>n+p.startedPoints,0);
   if(keeperStarts!==current.verifiedOriginalManagerStarts||
      Math.abs(keeperPoints-current.regularStartedPoints)>.015||
      current.keepers.some(p=>p.starts<0||p.startedPoints<0||typeof p.transferredDuringSeason!=='boolean'))
    throw Error('2026 keeper source player contributions mismatch manager summary '+name);
  }
  const draftYears=[...new Set(draftTrade.rows.filter(r=>r.manager===name&&r.recordedSelections>0).map(r=>r.year))].sort((x,y)=>x-y);
  const row={
   manager:name,
   finishing:{seasons:f.seasonsPlayed,score:f.meanFinishScore,topThree:f.topThree,
     lastPlace:f.lastPlaceFinishes.length,years:f.years},
   pickups:{distinct:a.distinctSeasonPlayerAcquisitions,started:a.withRecordedLaterStart,
     percent:Number((100*a.withRecordedLaterStart/a.distinctSeasonPlayerAcquisitions).toFixed(1)),
     reacquisitions:a.reacquisitions,period:'2020–2026, 2026 partial',
     years:pickupSeasons?perYear.map(x=>({year:x.year,distinct:x.distinctPlayerAdds,
       laterStarted:x.withLaterRecordedStarts,repeats:x.repeatedEventRows})):[]},
   faab:bid?{completedClaims:bid.completedClaims,paidWins:bid.paidWins,zeroDollarWins:bid.zeroDollarWins,
     failedClaims:bid.failedClaims,winningSpend:bid.completedBidSpend,sourceOnlyClaims:bid.completedNotInOldArchive,
     years:(faabSeasonMap.get(name)||[]).sort((a,b)=>a.year-b.year).map(x=>({year:x.year,
       completedClaims:x.completedClaims,paidWins:x.paidWins,zeroDollarWins:x.zeroDollarWins,
       failedClaims:x.failedClaims,winningSpend:x.completedBidSpend})),
     period:faab.scope,gradeStatus:'not-rated'}:null,
   keepers:{season:2025,recorded:k.keepers.length,startedPoints:k.regularStartedPoints,
     names:k.keepers.map(p=>({name:p.name,round:p.round,position:p.position})),
     current:current?{season:2026,throughWeek:keeper2026.throughWeek,
       recorded:current.keepers.length,startedPoints:current.regularStartedPoints,
       starts:current.verifiedOriginalManagerStarts,
       players:current.keepers.map(p=>({name:p.name,round:p.round,position:p.position,
        starts:p.starts,startedPoints:p.startedPoints,transferredDuringSeason:p.transferredDuringSeason})),
       gradeStatus:'not-rated'}:null,
     gradeStatus:'not-rated'},
   startSit:{season:2026,throughWeek:8,accuracyPercent:h.accuracyPercent,
     gradeStatus:'not-rated',basis:'Sleeper UI screenshot'},
   drafts:{documentedSeasonCount:draftYears.length,years:draftYears,
     gradeStatus:'provisional-only'},
   warnings:['A measured result is not a verified decision-skill grade',
     'Draft histories include historical coverage differences; no fictional missing selections']
  };
  map.set(name,row);
 }
 return [...map.values()];
}
