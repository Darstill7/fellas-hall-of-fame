// Raw production comparison only. Relative dominance cannot establish trade quality.
import {normalizeTradeManager} from './trade-report-card-v1.mjs';
const round=x=>Math.round(x*100)/100;
export function buildProductionPreview(museum){
 const seen=new Set(),trades=[],managers=Object.create(null),rivalries=Object.create(null);
 for(const t of museum){
  if(typeof t.id!=='string'||seen.has(t.id))throw Error('Duplicate or invalid transaction');seen.add(t.id);
  const names=t.sides.map(s=>normalizeTradeManager(s.manager));
  if(new Set(names).size!==names.length)throw Error('Duplicate manager '+t.id);
  const eligible=t.sides.length>=2&&t.sides.every(s=>s.source_status==='VERIFIED_SOURCE'&&typeof s.assets==='string'&&s.assets.trim()&&Number.isFinite(s.raw_starter_points));
  const sides=t.sides.map((s,i)=>({manager:names[i],assets:s.assets,points:s.raw_starter_points??null,starts:s.started_games??null,rating:null,grade:null}));
  const nonzero=eligible&&sides.some(s=>s.points!==0);
  trades.push({id:t.id,year:t.year,week:t.week,date:t.date,scoringThroughWeek:t.scoring_through_week??null,status:nonzero?'raw-production-comparison':eligible?'no-production-yet':'incomplete',sides});
  for(const a of sides){
   const m=managers[a.manager]??={trades:[],graded:0,rating:null,grade:null};
   m.trades.push({id:t.id,rating:null,grade:null});
   for(const b of sides){if(a===b)continue;
    const group=rivalries[a.manager]??=Object.create(null);
    const r=group[b.manager]??={trades:[],graded:0,rating:null,grade:null,opponentRating:null,opponentGrade:null,wins:0,losses:0,draws:0,rawCompared:0,rawEdge:0};
    r.trades.push({id:t.id,grade:null,opponentGrade:null,rating:null,opponentRating:null});
    if(nonzero){r.rawCompared++;r.rawEdge+=a.points-b.points;r[a.points>b.points?'wins':a.points<b.points?'losses':'draws']++}
   }
  }
 }
 for(const m of Object.values(managers))m.ungraded=m.trades.length;
 for(const g of Object.values(rivalries))for(const r of Object.values(g)){r.ungraded=r.trades.length;r.rawEdge=round(r.rawEdge)}
 return {status:'raw-production-only-grades-withdrawn',method:'Recorded starter points only; wins/losses/draws are raw comparisons, not trade verdicts; historical windows may differ. Letter grades withheld pending absolute impact and asset evidence.',trades,managers,rivalries};
}
