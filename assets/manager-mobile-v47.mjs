// Cache only successful JSON promises within this page's lifetime. No persistent cache.
const requests=new Map();
export function sharedProfileJson(url,fetcher=fetch){
 const key=new URL(url,typeof document==='undefined'?'https://local.invalid/':document.baseURI).href;
 if(!requests.has(key)){
  const promise=Promise.resolve().then(()=>fetcher(url)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r.json()}).catch(e=>{requests.delete(key);throw e});
  requests.set(key,promise);
 }
 return requests.get(key);
}
export function clearProfileJson(){requests.clear()}
// Native disclosure keeps keyboard support and browser history anchors intact.
export function mountDeferredProfileTopic({host,id,label,description,load}){
 if(!host||document.getElementById(id))return null;
 const shell=document.createElement('details');shell.className='gm47-topic';shell.id=id;
 const summary=document.createElement('summary'),title=document.createElement('strong'),desc=document.createElement('small');
 title.textContent=label;desc.textContent=description;summary.append(title,desc);
 const body=document.createElement('div');body.className='gm47-topic-body';shell.append(summary,body);host.append(shell);
 let started=false;
 const activate=()=>{if(started)return;started=true;Promise.resolve().then(()=>load(body)).catch(()=>{started=false;body.replaceChildren();const retry=document.createElement('button');retry.type='button';retry.textContent='Retry loading '+label;retry.addEventListener('click',()=>{body.replaceChildren();activate()});body.append(retry)})};
 shell.addEventListener('toggle',()=>{if(shell.open)activate()});
 const reveal=()=>{shell.open=true;activate()};
 return {shell,body,reveal};
}
export function revealProfileHash(topics,hash=location.hash){
 const target=hash.slice(1);
 const topic=topics.find(t=>t&&[t.shell.id,...(t.targets??[])].includes(target));
 if(!topic)return false;
 topic.reveal();topic.shell.scrollIntoView({block:'start',behavior:'auto'});return true;
}
