// Exact GitHub Pages byte parity. This checks a successfully deployed commit,
// never an undeployed pull-request checkout.
// Usage: PAGES_DEPLOY_SHA=<Pages deployment SHA> node scripts/verify-pages-release-parity.mjs
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const checkedPaths=[
 'index.html',
 'managers/stilly/index.html',
 'managers/tom/index.html',
 'managers/stover/index.html',
 'analytics/records.html',
 'analytics/record-holders.html',
 'data/career_core_generated.json',
 'data/manager_biographies_awards.json',
 'assets/manager-encyclopedia.js',
 // Approved Tuesday updates must be visible as deployed bytes, not only checked-in data.
 'data/unified_record_book_2016_2026.json',
 'data/season_weekly_matchups_2016_2026_v1.json',
 'data/season_guide.json',
 'data/playoff_race_v1.json',
 'data/current_2026_records_v1.json',
 'data/alltime_game_records_live_v1.json',
 'data/alltime_career_records_live_v1.json',
 'data/ledger_milestones_live_v1.json',
 'data/schedule_luck_current_v1.json',
 'data/trade_museum_stage66.json',
 'analytics/playoff-race.html',
 'analytics/trade-museum.html',
 'assets/current-season-records.mjs',
 'assets/alltime-game-records.mjs',
 'assets/alltime-career-records.mjs',
 'assets/ledger-milestones.mjs'
];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function verifyFiles({root,baseUrl,paths=checkedPaths,fetcher=fetch,nonce='test'}){
 const errors=[];
 const details=[];
 for(const name of paths){
  const local=await readFile(resolve(root,name));
  const url=new URL(name,new URL(baseUrl));
  url.searchParams.set('release_parity',nonce);
  try{
   const response=await fetcher(url,{headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},cache:'no-store',signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const remote=Buffer.from(await response.arrayBuffer());
   const expected=digest(local),published=digest(remote),match=expected===published;
   details.push({name,match,expectedLength:local.length,publishedLength:remote.length,expectedSha256:expected,publishedSha256:published,etag:response.headers.get('etag')||''});
   if(!match)errors.push(name+': expected '+local.length+' bytes / '+expected+', published '+remote.length+' bytes / '+published);
  }catch(error){errors.push(name+': request failed '+String(error.message||error))}
 }
 return {ok:errors.length===0,errors,details};
}

export async function verifyWithRetries({root,baseUrl,paths=checkedPaths,fetcher=fetch,attempts=8,intervalMs=20000,nonce='release'}){
 let last;
 for(let attempt=1;attempt<=attempts;attempt++){
  last=await verifyFiles({root,baseUrl,paths,fetcher,nonce:nonce+'-'+attempt+'-'+Date.now()});
  console.log('Pages parity attempt '+attempt+'/'+attempts+': '+(last.ok?'ALL MATCH':'MISMATCH'));
  for(const item of last.details)console.log((item.match?'MATCH ':'DIFF  ')+item.name+' local '+item.expectedLength+'/'+item.expectedSha256+' remote '+item.publishedLength+'/'+item.publishedSha256+(item.etag?' etag '+item.etag:''));
  if(last.ok)return last;
  console.error(last.errors.join('\n'));
  if(attempt<attempts)await delay(intervalMs);
 }
 throw Error('Published Pages files still differ from the successful deployment SHA after '+attempts+' attempts');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const expected=process.env.PAGES_DEPLOY_SHA||'';
 const actual=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(!/^[a-f0-9]{40}$/i.test(expected)||actual!==expected)
  throw Error('Refusing Pages parity check: checked-out SHA does not match the successful Pages deployment SHA');
 const url=process.env.PAGES_BASE_URL||'https://darstill7.github.io/fellas-hall-of-fame/';
 console.log('Checking deployed Pages at '+url+' against exact SHA '+expected);
 await verifyWithRetries({root:process.cwd(),baseUrl:url,nonce:expected.slice(0,12)});
}
