// Evidence-first scouting archetypes. Labels are earned by documented results.
export function managerArchetype(r,report){
 const titles=r.titleYears.length,berths=r.qualifiedYears.length,finished=r.tenure;
 const scores=report?.scores||{},coverage=report?.coverage||{};
 if(titles>=3)return {name:'Dynasty Builder',reason:titles+' verified championships across '+finished+' completed seasons',category:'championships'};
 if(titles>=1&&berths>=4)return {name:'Proven Champion',reason:titles+' championship'+(titles===1?'':'s')+' and '+berths+' verified playoff appearances',category:'championships'};
 if(berths>=5&&finished>=7)return {name:'Perennial Contender',reason:berths+' verified playoff appearances over '+finished+' completed seasons',category:'playoffs'};
 if(Number.isFinite(scores.trading)&&coverage.verifiedTradeSides>=8&&scores.trading>=75)return {name:'Trade Specialist',reason:coverage.verifiedTradeSides+' verified trade sides; provisional trading grade '+scores.trading.toFixed(1),category:'trading',provisional:true};
 if(Number.isFinite(scores.drafting)&&coverage.draftPicks>=20&&scores.drafting>=75)return {name:'Draft Architect',reason:coverage.draftPicks+' documented non-keeper picks; provisional drafting grade '+scores.drafting.toFixed(1),category:'drafting',provisional:true};
 if(finished>=5&&berths>=3)return {name:'Playoff Regular',reason:berths+' verified championship-bracket appearances',category:'playoffs'};
 if(finished>=8)return {name:'League Veteran',reason:finished+' completed seasons in the recorded league history',category:'longevity'};
 return {name:'Building the Résumé',reason:finished+' completed season'+(finished===1?'':'s')+' and '+berths+' verified playoff appearance'+(berths===1?'':'s'),category:'career'};
}
