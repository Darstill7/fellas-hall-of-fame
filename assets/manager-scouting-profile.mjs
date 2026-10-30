// Evidence-grounded career scouting narrative. Never infer decision skill from results.
export function scoutingProfile(row){
 const c=row.coverage,s=row.scores;
 const reasons=[];
 if(c.verifiedChampionships>=2)reasons.push(c.verifiedChampionships+' verified championships establish elite title-game results');
 else if(c.verifiedChampionships===1)reasons.push('a verified league championship');
 if(c.playoffEligible>=3&&c.playoffVerified/c.playoffEligible>=.6)reasons.push(c.playoffVerified+' playoff appearances across '+c.playoffEligible+' eligible seasons');
 if(c.careerGames>=50&&s.regular>=55)reasons.push('positive long-run regular-season performance');
 if(s.allPlay>=55)reasons.push('above-neutral opponent-independent all-play performance');
 const flags=[];
 if(!c.verifiedChampionships)flags.push('no recorded championship despite available participation');
 if(c.careerGames<50)flags.push('shorter historical sample');
 if(c.playoffEligible>=3&&c.playoffVerified/c.playoffEligible<.4)flags.push('limited playoff qualification frequency');
 if(s.regular<50&&c.careerGames>=40)flags.push('below-neutral career win-rate component');
 if(s.drafting===null)flags.push('insufficient comparable draft pick sample');
 if(s.trading===null)flags.push('insufficient verified trade-side sample');
 flags.push('comprehensive waiver and legal start/sit evidence unavailable');
 const specialty=['drafting','trading'].filter(k=>s[k]!==null).sort((a,b)=>s[b]-s[a]);
 const descriptive=specialty.length?'Measured '+specialty[0]+' outcome percentile is the stronger of the available decision categories; this is not proof of superior process.':'No decision-level specialty can be certified from the currently eligible source sample.';
 return {headline:c.verifiedChampionships>=2?'Multi-title postseason résumé':c.verifiedChampionships===1?'Proven championship résumé':c.playoffEligible>=3&&c.playoffVerified/c.playoffEligible>=.6?'Consistent postseason contender':'Results-first career under review',strengths:reasons,limitations:flags,decisionRead:descriptive,evidence:'Derived from verified championship outcomes, bracket participation, generated career records and measured outcome coverage. Editorial assessment, not an independent fantasy-expert certification.'};
}
