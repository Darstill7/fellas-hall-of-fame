// Share verified record facts, not screenshots of an unverified claim.
export function recordSharePayload(manager,record,base){
 const url=new URL('record-books.html',base);url.searchParams.set('manager',manager);url.hash='owned-records';
 const value=String(record.value)+(record.unit==='%'?'%':' '+record.unit);
 return {title:'The Fellas · '+manager+' · Record Book',text:[manager+' — '+record.label,value+(record.shared?' (shared league record)':' (league record)'),record.context,record.scope].join('\n'),url:url.href};
}
export function mountRecordShare(card,manager,record){
 const button=document.createElement('button');button.type='button';button.className='record-share-button';button.textContent='Share record';button.setAttribute('aria-label','Share '+record.label+' for '+manager);
 const status=document.createElement('p');status.className='record-share-status';status.setAttribute('role','status');status.hidden=true;
 const payload=recordSharePayload(manager,record,location.href);
 button.addEventListener('click',async()=>{
  status.hidden=false;status.textContent='';
  try{if(typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare(payload))){try{await navigator.share(payload);status.textContent='Shared.';return}catch(e){if(e.name==='AbortError'){status.hidden=true;return}}}
   const text=payload.title+'\n'+payload.text+'\n'+payload.url;
   if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);status.textContent='Copied record and link.';return}catch{}}
   status.textContent='Copy the record below:';const field=document.createElement('textarea');field.readOnly=true;field.value=text;field.setAttribute('aria-label','Record text to copy');status.append(field);field.focus();field.select();
  }catch{status.textContent='Sharing unavailable. You can still copy this record from the page.'}
 });card.append(button,status);
}
