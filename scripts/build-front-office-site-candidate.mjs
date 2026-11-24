// Generate lightweight browser-facing Front Office summaries, preserving receipt provenance.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gradeDraftReturns} from './lib/draft-return-grades.mjs';
import {draftSlotAlternatives} from './lib/draft-slot-alternatives.mjs';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const acq=read('combined-career-acquisition-preview'),trade=read('combined-trade-front-office-preview');
assert.deepEqual(acq.completedThrough,trade.completedThrough);
const supported=read('combined-evidence-supported-career-preview');
assert.deepEqual(supported.completedThrough,acq.completedThrough);
assert.equal(supported.coverage.strict_starts,acq.coverage.regular_starts);
assert.equal(supported.coverage.strict_pf_cents,acq.coverage.regular_pf_cents);
const supportedRankings=acq.ledger.map(a=>{const key=[a.year,Number(a.roster),String(a.player_id),String(a.id)].join(':');return {...compactSupported(a),...(supported.acquisitions[key]||{strict_starts:0,strict_pf_cents:0,supported_starts:0,supported_pf_cents:0,additional_starts:0,additional_pf_cents:0})};}).filter(a=>a.supported_starts>0).sort((a,b)=>b.supported_pf_cents-a.supported_pf_cents||b.supported_starts-a.supported_starts||a.year-b.year||String(a.id).localeCompare(String(b.id)));
function compactSupported(a){return {year:a.year,manager:a.manager,player_id:a.player_id,name:a.name,category:a.category,id:a.id,cost:a.cost};}
// Pairwise surplus uses eligible two-manager player exchanges only; no invented split of multi-team assets.
const pairwiseSupported=new Map(),managerSurplus={};
for(const t of trade.transaction_ledger){
 if(t.kind!=='TWO_TEAM_PLAYER_EXCHANGE')continue;
 const [a,b]=t.sides.slice().sort((a,b)=>a.manager.localeCompare(b.manager));
 const key=JSON.stringify([a.manager,b.manager]);
 const p=pairwiseSupported.get(key)??{a:a.manager,b:b.manager,trades:0,a_strict_cents:0,b_strict_cents:0,a_supported_cents:0,b_supported_cents:0,a_wins:0,b_wins:0,ties:0,receipts:[]};
 const get=s=>supported.trades[JSON.stringify([t.year,t.id,s.manager])];
 const av=get(a),bv=get(b),as=Math.round(a.regular*100),bs=Math.round(b.regular*100);
 // A trade-side with zero starts may be absent; nonzero strict production must reconcile.
 assert.equal(av?.strict_pf_cents??0,as,'Trade side strict mismatch '+t.id);
 assert.equal(bv?.strict_pf_cents??0,bs,'Trade side strict mismatch '+t.id);
 const ap=av?.supported_pf_cents??0,bp=bv?.supported_pf_cents??0;
 p.trades++;p.a_strict_cents+=as;p.b_strict_cents+=bs;p.a_supported_cents+=ap;p.b_supported_cents+=bp;
 p.a_wins+=Number(ap>bp);p.b_wins+=Number(bp>ap);p.ties+=Number(ap===bp);
 p.receipts.push({year:t.year,id:t.id,a_supported_cents:ap,b_supported_cents:bp,a_strict_cents:as,b_strict_cents:bs});
 pairwiseSupported.set(key,p);
 managerSurplus[a.manager]=(managerSurplus[a.manager]??0)+ap-bp;
 managerSurplus[b.manager]=(managerSurplus[b.manager]??0)+bp-ap;
}
assert.equal(Object.values(managerSurplus).reduce((n,v)=>n+v,0),0);
const pairwiseRankings=[...pairwiseSupported.values()].map(p=>({...p,a_minus_b_supported_cents:p.a_supported_cents-p.b_supported_cents,a_minus_b_strict_cents:p.a_strict_cents-p.b_strict_cents})).sort((a,b)=>Math.abs(b.a_minus_b_supported_cents)-Math.abs(a.a_minus_b_supported_cents));
const draftGrades=gradeDraftReturns(acq.ledger,supported.acquisitions);
const slotAlternatives=draftSlotAlternatives(acq.ledger,supported.acquisitions);
const evidenceMeta={historicalPackage:supported.historicalPackage,coverage:supported.coverage,limitations:supported.limitations};
const output=root+'front-office-site-candidate';fs.mkdirSync(output,{recursive:true});
const common={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:acq.completedThrough,historicalScope:[2020,2025],method:'Strict received regular-season starter production; not causal value or trade grades.'};
const rank=rows=>rows.slice().sort((a,b)=>b.regular_pf_cents-a.regular_pf_cents||b.regular_starts-a.regular_starts);
const draft=acq.ledger.filter(a=>['DRAFT','ARCHIVED_KEEPER','DRAFT_KEEPER_UNKNOWN'].includes(a.category));
const compact=a=>({year:a.year,manager:a.manager,player_id:a.player_id,name:a.name,category:a.category,id:a.id,cost:a.cost,regular_pf_cents:a.regular_pf_cents,regular_starts:a.regular_starts});
const datasets={
 'overview.json':{...common,coverage:acq.coverage,tradeCoverage:trade.coverage,tradeDeadline:trade.trade_deadline,departments:['trading','draft','acquisitions','players','managers','keepers']},
 'trading.json':{...common,deadline:trade.trade_deadline,coverage:trade.coverage,transactions:trade.transaction_ledger,managers:trade.manager_summary,pairwise:trade.pairwise,limitations:trade.limitations},
 'draft.json':{...common,rounds:acq.draft_rounds,picks:rank(draft).map(compact),limitations:['Historical keeper designations remain archive-derived; unknown live keeper flags separate. Round production is not a draft grade.']},
 'acquisitions.json':{...common,categories:acq.categories,rankings:acq.rankings,limitations:acq.limitations},
 'players.json':{...common,players:acq.players,limitations:acq.limitations},
 'managers.json':{...common,managers:acq.managers,limitations:acq.limitations},
 'keepers.json':{...common,keepers:rank(draft.filter(a=>a.category==='ARCHIVED_KEEPER')).map(compact),unknown:rank(draft.filter(a=>a.category==='DRAFT_KEEPER_UNKNOWN')).map(compact),limitations:['Historical archive keeper designations are provisional; unknown flags are not non-keepers. No verified opportunity cost or keeper eligibility calculation.']}
};
// Explicit parallel evidence tier: never silently replace the existing strict fields.
Object.assign(datasets['overview.json'],{supportedEvidence:evidenceMeta});
Object.assign(datasets['trading.json'],{supportedEvidence:{...evidenceMeta,tradeSides:supported.trades,pairwise:pairwiseRankings,managerSurplus}});
Object.assign(datasets['draft.json'],{supportedEvidence:{...evidenceMeta,rounds:supported.rounds,grades:draftGrades,slotAlternatives,picks:supportedRankings.filter(a=>['DRAFT','ARCHIVED_KEEPER','DRAFT_KEEPER_UNKNOWN'].includes(a.category))}});
Object.assign(datasets['acquisitions.json'],{supportedEvidence:{...evidenceMeta,categories:supported.categories,rankings:supportedRankings}});
Object.assign(datasets['players.json'],{supportedEvidence:{...evidenceMeta,players:supported.players,playerReceipts:supported.playerReceipts}});
Object.assign(datasets['managers.json'],{supportedEvidence:{...evidenceMeta,managers:supported.managers}});
Object.assign(datasets['keepers.json'],{supportedEvidence:{...evidenceMeta,keeperSlotComparisons:slotAlternatives.results.filter(r=>r.category==='ARCHIVED_KEEPER'),keeperSlotMethod:slotAlternatives.method,archiveKeeperTotals:supported.categories.ARCHIVED_KEEPER??null,unknownKeeperTotals:supported.categories.DRAFT_KEEPER_UNKNOWN??null}});
const files=[];
for(const [name,d] of Object.entries(datasets)){assert.deepEqual(d.completedThrough,common.completedThrough);const raw=JSON.stringify(d,null,2)+'\n';fs.writeFileSync(output+'/'+name,raw);files.push({name,sha256:createHash('sha256').update(raw).digest('hex'),bytes:Buffer.byteLength(raw)});}
fs.writeFileSync(output+'/manifest.json',JSON.stringify({...common,files,limitations:acq.limitations},null,2)+'\n');
console.log('FRONT OFFICE SITE PACKAGE PASS '+JSON.stringify({files:files.length,completedThrough:common.completedThrough,acquisitions:acq.ledger.length}));
