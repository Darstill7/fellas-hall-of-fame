// Bounded transient provider retry; no stale-data substitution.
export async function fetchProviderJSON(url,{fetcher=fetch,attempts=3,timeoutMs=30000,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 if(!Number.isInteger(attempts)||attempts<1||attempts>5)throw Error('Invalid retry count');
 let last;
 for(let i=0;i<attempts;i++){
  try{
   const r=await fetcher(url,{signal:AbortSignal.timeout(timeoutMs)});
   if(r.ok)return await r.json();
   const e=Error('Provider HTTP '+r.status+' at '+url);
   if(![408,429,500,502,503,504].includes(r.status)){e.permanent=true;throw e;}
   last=e;
  }catch(e){if(e.permanent||e instanceof SyntaxError)throw e;last=e;}
  if(i+1<attempts)await sleep(Math.min(2000,250*2**i));
 }
 throw Error('Provider unavailable; retain previous verified release: '+url,{cause:last});
}
