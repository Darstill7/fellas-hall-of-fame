// Descriptive historical evidence. These values NEVER become implicit manager skill ratings.
export const ACTIVE_MANAGERS=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
export function buildEvidenceSnapshots({placements,acquisitions,keeperResearch,startSit,draftTrade,faab=null}){
 const map=new Map();
 const unique=(rows,label)=>{const d=new Map();for(const row of rows){if(d.has(row.manager))throw Error('Duplicate '+label+' manager '+row.manager);d.set(row.manager,row)}return d};
 const finish=unique(placements.managers,'finishing');
 const pickups=unique(acquisitions.byManager,'pickup');
 const keepers=unique(keeperResearch.rows,'keeper');
 const accuracy=unique(startSit.data,'start/sit');
 const faabMap=faab?unique(faab.managerTotals,'FAAB'):new Map();
 if(faab&&faab.status!=='provider_observed_no_skill_grade')throw Error('FAAB source is not provider-observed research');
 if(keeperResearch.season!==2025||startSit.season!==2026||startSit.throughWeek!==8)
  throw Error('Descriptive keeper and lineup source periods changed');
 for(const name of ACTIVE_MANAGERS){
  const f=finish.get(name),a=pickups.get(name),k=keepers.get(name),h=accuracy.get(name),bid=faabMap.get(name);
  if(!f||!a||!k||!h||(faab&&!bid))throw Error('Missing manager evidence for '+name);
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
  const draftYears=[...new Set(draftTrade.rows.filter(r=>r.manager===name&&r.recordedSelections>0).map(r=>r.year))].sort((x,y)=>x-y);
  const row={
   manager:name,
   finishing:{seasons:f.seasonsPlayed,score:f.meanFinishScore,topThree:f.topThree,
     lastPlace:f.lastPlaceFinishes.length,years:f.years},
   pickups:{distinct:a.distinctSeasonPlayerAcquisitions,started:a.withRecordedLaterStart,
     percent:Number((100*a.withRecordedLaterStart/a.distinctSeasonPlayerAcquisitions).toFixed(1)),
     reacquisitions:a.reacquisitions,period:'2020–2026, 2026 partial'},
   faab:bid?{completedClaims:bid.completedClaims,paidWins:bid.paidWins,zeroDollarWins:bid.zeroDollarWins,
     failedClaims:bid.failedClaims,winningSpend:bid.completedBidSpend,sourceOnlyClaims:bid.completedNotInOldArchive,
     period:faab.scope,gradeStatus:'not-rated'}:null,
   keepers:{season:2025,recorded:k.keepers.length,startedPoints:k.regularStartedPoints,
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
