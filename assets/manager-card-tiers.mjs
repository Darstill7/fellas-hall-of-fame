// Presentation tiers are awarded from verified career accomplishments, never from speculative skills.
export function managerCardTier(r){
 const titles=r.titleYears?.length??0,playoffs=r.qualifiedYears?.length??0;
 if(titles>=3)return {id:'dynasty',name:'Dynasty',reason:titles+' verified championships'};
 if(titles>=1)return {id:'champion',name:'Champion',reason:titles+' verified championship'+(titles===1?'':'s')};
 if(playoffs>=5)return {id:'contender',name:'Contender',reason:playoffs+' verified playoff berths'};
 return {id:'standard',name:'League Veteran',reason:playoffs+' verified playoff berths'};
}
