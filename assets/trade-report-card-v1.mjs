// One trade ID, one grading receipt, all participant views. Research only until approved.
export const MODEL_VERSION='trade-report-card-v1';
export const normalizeTradeManager=n=>({Tom:'Thommy',EvansBrandon:'Evans'})[n]??n;
export const letterGrade=n=>n===null?null:n>=97?'A+':n>=93?'A':n>=90?'A-':n>=87?'B+':n>=83?'B':n>=80?'B-':n>=77?'C+':n>=73?'C':n>=70?'C-':n>=67?'D+':n>=63?'D':n>=60?'D-':'F';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const round=n=>Math.round(n*100)/100;
// Proposed policy; weights must not be redistributed when evidence is missing.
export const weights=Object.freeze({positionAdjustedProduction:.6,lineupImpact:.3,keeperValue:.05,otherAssets:.05});
const components=Object.keys(weights);
export function buildTradeReport(museum,approved=[]){
 const approvals=new Map();
 for(const a of approved){if(typeof a.id!=='string'||approvals.has(a.id))throw Error('Invalid or duplicate approval ID');approvals.set(a.id,a)}
 const seen=new Set(),trades=[];
 for(const t of museum){
  if(typeof t.id!=='string'||seen.has(t.id))throw Error('Invalid or duplicate trade ID');seen.add(t.id);
  const names=t.sides.map(s=>normalizeTradeManager(s.manager));
  if(new Set(names).size!==names.length)throw Error('Duplicate participant '+t.id);
  const complete=t.sides.length>=2&&t.sides.every(s=>s.source_status==='VERIFIED_SOURCE'&&typeof s.assets==='string'&&s.assets.trim()&&finite(s.raw_starter_points));
  const receipt=approvals.get(t.id);
  if(receipt&&(!complete||receipt.modelVersion!==MODEL_VERSION||receipt.year!==t.year||receipt.week!==t.week||receipt.scoringThroughWeek!==(t.scoring_through_week??null)||!receipt.evidenceRef||receipt.status!=='approved'||!Array.isArray(receipt.sides)||receipt.sides.length!==names.length||new Set(receipt.sides.map(s=>normalizeTradeManager(s.manager))).size!==names.length))throw Error('Invalid grade approval '+t.id);
  const sides=t.sides.map(s=>{
   const manager=normalizeTradeManager(s.manager),a=receipt?.sides.find(x=>normalizeTradeManager(x.manager)===manager);
   if(receipt&&(!a||a.assets!==s.assets||a.rawStarterPoints!==s.raw_starter_points||!components.every(k=>finite(a.components?.[k])&&a.components[k]>=0&&a.components[k]<=100)))throw Error('Missing or stale side evidence '+t.id+' '+manager);
   const score=a?round(components.reduce((sum,k)=>sum+weights[k]*a.components[k],0)):null;
   return {manager,assets:s.assets,rawStarterPoints:s.raw_starter_points??null,score,grade:letterGrade(score),components:a?.components??null,outcome:null};
  });
  // A close/equal score is a draw for a two-side transaction; multi-side outcomes
  // use tied top and bottom bands, with the middle explicitly neutral.
  if(receipt){
   const high=Math.max(...sides.map(s=>s.score)),low=Math.min(...sides.map(s=>s.score));
   for(const s of sides)s.outcome=high-low<=2?'draw':s.score===high?'win':s.score===low?'loss':'middle';
  }
  const top=complete?Math.max(...sides.map(s=>s.rawStarterPoints)):null;
  trades.push({id:t.id,year:t.year,week:t.week,date:t.date,scoringThroughWeek:t.scoring_through_week??null,status:receipt?'graded':complete?'awaiting-grade-evidence':'incomplete-receipt',evidenceRef:receipt?.evidenceRef??null,starterPointsLeaders:complete?sides.filter(s=>s.rawStarterPoints===top).map(s=>s.manager):[],sides});
 }
 for(const id of approvals.keys())if(!seen.has(id))throw Error('Approval missing transaction '+id);
 const managers=Object.create(null);
 for(const t of trades)for(const s of t.sides){
  const m=managers[s.manager]??={manager:s.manager,trades:[],graded:0,wins:0,losses:0,draws:0,middle:0,scoreTotal:0};
  m.trades.push({id:t.id,year:t.year,week:t.week,grade:s.grade,score:s.score,outcome:s.outcome,status:t.status,opponents:t.sides.filter(o=>o.manager!==s.manager).map(o=>({manager:o.manager,grade:o.grade,score:o.score,outcome:o.outcome}))});
  if(s.score!==null){m.graded++;m.scoreTotal+=s.score;m[({win:'wins',loss:'losses',draw:'draws',middle:'middle'})[s.outcome]]++}
 }
 for(const m of Object.values(managers)){m.rating=m.graded?round(m.scoreTotal/m.graded):null;m.grade=letterGrade(m.rating);m.ungraded=m.trades.length-m.graded;delete m.scoreTotal}

 // Pairwise views reuse the original side grades, never regrade a transaction.
 const rivalries=Object.create(null);
 for(const t of trades)for(const a of t.sides)for(const b of t.sides){
  if(a.manager===b.manager)continue;
  const group=rivalries[a.manager]??=Object.create(null);
  const r=group[b.manager]??={manager:a.manager,opponent:b.manager,trades:[],graded:0,wins:0,losses:0,draws:0,scoreTotal:0,opponentScoreTotal:0,rawCompared:0,rawPoints:0,opponentRawPoints:0};
  const graded=a.score!==null&&b.score!==null;
  const outcome=graded?Math.abs(a.score-b.score)<=2?'draw':a.score>b.score?'win':'loss':null;
  r.trades.push({id:t.id,year:t.year,week:t.week,grade:a.grade,opponentGrade:b.grade,score:a.score,opponentScore:b.score,outcome,status:t.status,participantCount:t.sides.length});
  if(graded){r.graded++;r.scoreTotal+=a.score;r.opponentScoreTotal+=b.score;r[({win:'wins',loss:'losses',draw:'draws'})[outcome]]++}
  if(t.status!=='incomplete-receipt'&&finite(a.rawStarterPoints)&&finite(b.rawStarterPoints)){r.rawCompared++;r.rawPoints+=a.rawStarterPoints;r.opponentRawPoints+=b.rawStarterPoints}
 }
 for(const group of Object.values(rivalries))for(const r of Object.values(group)){
  r.rating=r.graded?round(r.scoreTotal/r.graded):null;
  r.opponentRating=r.graded?round(r.opponentScoreTotal/r.graded):null;
  r.grade=letterGrade(r.rating);r.opponentGrade=letterGrade(r.opponentRating);
  r.ungraded=r.trades.length-r.graded;r.rawPoints=round(r.rawPoints);r.opponentRawPoints=round(r.opponentRawPoints);r.rawEdge=round(r.rawPoints-r.opponentRawPoints);
  delete r.scoreTotal;delete r.opponentScoreTotal;
 }
 return {modelVersion:MODEL_VERSION,trades,managers,rivalries};
}
