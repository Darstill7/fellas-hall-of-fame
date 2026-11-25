// Commissioner diagnostic report. Generated as a CI artifact, not a public page.
import fs from 'node:fs';
import {buildHomeDashboard} from '../assets/home-app-v3.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const checks=[];
function check(name,fn){try{checks.push({name,...fn()})}catch(e){checks.push({name,status:'ERROR',detail:String(e.message)})}}
const guide=read('data/season_guide.json'),ledger=read('data/unified_record_book_2016_2026.json');
const year=2026,week=Math.max(0,...ledger.games.filter(g=>g.year===year&&g.stage==='regular').map(g=>g.week));
const parity=(actual,detail)=>({status:actual?'VERIFIED':'STALE_OR_INCONSISTENT',detail});
check('Standings',()=>parity(buildHomeDashboard(guide,ledger).week===week,'Canonical Week '+week));
check('Compact homepage',()=>{const compact=read('data/home-current-season-v1.json');return parity(compact.throughWeek===week&&JSON.stringify(buildHomeDashboard(guide,compact))===JSON.stringify(buildHomeDashboard(guide,ledger)),'Compact dashboard parity through Week '+week)});
check('Playoff race',()=>{const race=read('data/playoff_race_v1.json');return parity(race.verified_through_week===week&&guide[year].standings.every(r=>{const t=race.teams[r.name]??race.teams[r.name==='Thommy'?'Tom':r.name];return t&&t.w===r.w&&t.l===r.l&&Math.round(t.pf*100)===Math.round(r.pf*100)}),'Modeled probabilities; cutoff '+race.verified_through_week)});
check('Trade Museum',()=>{const trades=read('data/trade_museum_stage66.json').filter(t=>t.year===year);return parity(trades.length>0&&trades.every(t=>t.scoring_through_week===week),trades.length+' current-season receipts; scoring cutoff checked')});
check('Record books',()=>{const a=read('data/manager_record_books_2016_2026.json');return parity(Number(String(a.scope).match(/2026 Week (\d+)/)?.[1])===week&&guide[year].standings.every(r=>{const m=a.managers.find(x=>x.manager===r.name);const v=m?.annual?.find(x=>x.year===year);return v&&v.w===r.w&&v.l===r.l&&(v.t??0)===(r.t??0)}),'Archive cutoff and ten manager records')});
check('Front Office',()=>{const a=read('data/front-office/managers.json');return {status:a.status==='NOT_PUBLISHED'?'AWAITING_APPROVAL':'REVIEW_REQUIRED',detail:'Front Office release status: '+a.status}});
const report={schema:1,generatedAt:new Date().toISOString(),revision:process.env.GITHUB_SHA??null,year,canonicalWeek:week,checks,ciStatus:'Not assessed by this report',deploymentStatus:'Not assessed by this report',waiverPublicationStatus:'Not assessed by this report'};
const out=process.env.RUNNER_TEMP?process.env.RUNNER_TEMP+'/fellas-health':'/tmp/fellas-health';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');
const md=['## Commissioner data health','Canonical coverage: Week '+week,'','| Source | Status | Details |','|---|---|---|',...checks.map(c=>'| '+[c.name,c.status,c.detail].map(v=>String(v).replaceAll('|','/').replaceAll('\n',' ')).join(' | ')+' |'),'','CI, deployment and waiver readiness require independent evidence.'].join('\n')+'\n';
fs.writeFileSync(out+'/summary.md',md);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);console.log(md);
if(checks.some(c=>['ERROR','STALE_OR_INCONSISTENT'].includes(c.status)))process.exitCode=1;
