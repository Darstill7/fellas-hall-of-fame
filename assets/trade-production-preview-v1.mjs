// Explicitly provisional raw-production grades. Never pass these into final approvals.
import {normalizeTradeManager,letterGrade} from './trade-report-card-v1.mjs';
const round=x=>Math.round(x*100)/100;
export function buildProductionPreview(museum){
 const seen=new Set(),trades=[],managers=Object.create(null),rivalries=Object.create(null);
 for(const t of museum){
  if(typeof t.id!=='string'||seen.has(t.id))throw Error('Duplicate or invalid transaction');seen.add(t.id);
  const names=t.sides.map(s=>normalizeTradeManager(s.manager));
  if(new Set(names).size!==names.length)throw Error('Duplicate manager '+t.id);
  const eligible=t.sides.length>=2&&t.sides.every(s=>s.source_status==='VERIFIED_SOURCE'&&typeof s.assets==='string'&&s.assets.trim()&&Number.isFinite(s.raw_starter_points));
  const points=t.sides.map(s=>s.raw_starter_points);
  const nonzero=eligible&&points.some(p=>p!==0);
  const sides=t.sides.map((s,i)=>{
   const other=eligible?points.filter((_,j)=>j!==i).reduce((a,b)=>a+b,0)/(points.length-1):null;
   const denominator=eligible?Math.abs(s.raw_starter_points)+Math.abs(other):0;
   const rating=nonzero?round(75+(denominator?25*(s.raw_starter_points-other)/denominator:0)):null;
   return {manager:names[i],assets:s.assets,points:s.raw_starter_points??null,rating,grade:letterGrade(rating)};
  });
  trades.push({id:t.id,year:t.year,week:t.week,date:t.date,scoringThroughWeek:t.scoring_through_week??null,status:nonzero?'raw-production-preview':eligible?'no-production-yet':'incomplete',sides});
  for(const a of sides){
   const m=managers[a.manager]??={trades:[],ratings:[]};
   m.trades.push({id:t.id,rating:a.rating,grade:a.grade});if(a.rating!==null)m.ratings.push(a.rating);
   for(const b of sides){if(a===b)continue;
    const group=rivalries[a.manager]??=Object.create(null);
    const r=group[b.manager]??={trades:[],ratings:[],opponentRatings:[],wins:0,losses:0,draws:0};
    const comparable=a.rating!==null&&b.rating!==null;
    r.trades.push({id:t.id,grade:a.grade,opponentGrade:b.grade,rating:a.rating,opponentRating:b.rating});
    if(comparable){r.ratings.push(a.rating);r.opponentRatings.push(b.rating);r[a.points>b.points?'wins':a.points<b.points?'losses':'draws']++}
   }
  }
 }
 function summarize(r){r.graded=r.ratings.length;r.rating=r.graded?round(r.ratings.reduce((a,b)=>a+b,0)/r.graded):null;r.grade=letterGrade(r.rating);r.ungraded=r.trades.length-r.graded;delete r.ratings;if(r.opponentRatings){r.opponentRating=r.graded?round(r.opponentRatings.reduce((a,b)=>a+b,0)/r.graded):null;r.opponentGrade=letterGrade(r.opponentRating);delete r.opponentRatings}}
 Object.values(managers).forEach(summarize);Object.values(rivalries).forEach(g=>Object.values(g).forEach(summarize));
 return {status:'research-only-not-final-trade-grades',method:'75 + 25 times normalized raw starter point edge versus mean of other sides; equal trade weighting; all-zero and incomplete trades ungraded; historical snapshots have mixed windows; no keeper, lineup counterfactual or positional adjustment',trades,managers,rivalries};
}
