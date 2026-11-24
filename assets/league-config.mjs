// Public, non-secret league configuration. Keep provider IDs and branding separate from calculations.
export const fellasLeague=Object.freeze({
 id:'fellas',name:'The Fellas',season:2026,
 managers:Object.freeze(['Stilly','Stew','Thommy','Mitch','JMid','Scott','Stover','Kuhl','Tony','Birch']),
 aliases:Object.freeze({Tom:'Thommy'}),
 slugs:Object.freeze({Thommy:'tom'}),
 regularSeasonWeeks:14,playoffTeams:6,playoffByes:2,
 scoring:'half-ppr',keepers:2,faabBudget:100,
 preferenceKey:'fellas.franchise.v1'
});
export const normalizeManager=(name,league=fellasLeague)=>Object.hasOwn(league.aliases,name)?league.aliases[name]:name;
export const managerSlug=(name,league=fellasLeague)=>Object.hasOwn(league.slugs,name)?league.slugs[name]:name.toLowerCase();
