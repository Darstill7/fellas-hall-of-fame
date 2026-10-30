// Madden-style presentation scale. Never alter the underlying success-first model,
// historical ordering, point weights, or raw component calculations.
// Stable across seasons: no cohort percentile or dynamic leader normalization.
export const MADDEN_SCALE=Object.freeze({floor:65,multiplier:0.5,ceiling:99});
export function maddenOvr(raw){
 if(!Number.isFinite(raw))throw Error('Unverified raw success index');
 return Math.round(Math.max(MADDEN_SCALE.floor,Math.min(MADDEN_SCALE.ceiling,MADDEN_SCALE.floor+raw*MADDEN_SCALE.multiplier))*10)/10;
}
