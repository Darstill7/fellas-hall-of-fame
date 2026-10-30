// Evidence-first scouting archetypes. Labels are earned by documented results.
export function earnedArchetypes(r,report){
 const titles=r.titleYears.length,berths=r.qualifiedYears.length,finished=r.tenure;
 const scores=report?.scores||{},coverage=report?.coverage||{},earned=[];
 const add=(when,name,reason,category,provisional=false)=>{if(when)earned.push({name,reason,category,provisional})};
 add(titles>=3,'Dynasty Builder',titles+' verified championships across '+finished+' completed seasons','championships');
 add(titles>=1&&berths>=4,'Proven Champion',titles+' championships and '+berths+' verified playoff appearances','championships');
 add(berths>=5&&finished>=7,'Perennial Contender',berths+' playoff appearances across '+finished+' completed seasons','playoffs');
 add(Number.isFinite(scores.trading)&&coverage.verifiedTradeSides>=8&&scores.trading>=75,'Trade Specialist',coverage.verifiedTradeSides+' verified trade sides and provisional grade '+Number(scores.trading).toFixed(1),'trading',true);
 add(Number.isFinite(scores.drafting)&&coverage.draftPicks>=20&&scores.drafting>=75,'Draft Architect',coverage.draftPicks+' documented non-keeper draft picks and provisional grade '+Number(scores.drafting).toFixed(1),'drafting',true);
 add(finished>=5&&berths>=3,'Playoff Regular',berths+' verified championship-bracket appearances','playoffs');
 add(finished>=8,'League Veteran',finished+' completed seasons in the recorded league','longevity');
 if(!earned.length)earned.push({name:'Building the Résumé',reason:finished+' completed seasons and '+berths+' verified playoff appearances',category:'career',provisional:false});
 return earned;
}
export function managerArchetype(r,report){return earnedArchetypes(r,report)[0]}
