import {buildFranchiseLegends} from './manager-franchise-legends-v46.mjs';
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
export function buildLegendsLibrary(core,ledger,guide,endings){
 const franchises=names.map(name=>buildFranchiseLegends(core,ledger,guide,endings,name));
 const stories=[];
 for(const f of franchises){
 const a=f.anthology;
 stories.push({category:'Franchise features',manager:f.name,title:a.headline,copy:a.opening+' '+a.commentary,evidence:a.evidence});
 for(const m of f.moments.filter(m=>['glory','shame','finals'].includes(m.kind)&&m.evidence.finish!=null))stories.push({category:m.kind==='shame'?'Hall of Shame':'Championship history',manager:f.name,title:m.headline,copy:m.story,evidence:[m.evidence]});
 if(a.turning){const t=a.turning;stories.push({category:'Turning points',manager:f.name,title:t.from.year+'–'+t.to.year+' · '+(t.delta>0?'The rebound':'The reversal'),copy:'Regular-season winning percentage changed by '+(t.delta*100).toFixed(1)+' percentage points.',evidence:[{year:t.from.year},{year:t.to.year}]})}
 }
 const seen=new Set();
 for(const f of franchises)for(const g of f.classics){
 const key=[g.year,g.week,...[f.name,g.opponent].sort()].join(':');if(seen.has(key))continue;seen.add(key);
 stories.push({category:'Forgotten classics',manager:f.name,title:f.name+' vs '+g.opponent,copy:g.year+' Week '+g.week+' · '+(g.pf/100).toFixed(2)+'–'+(g.pa/100).toFixed(2)+' · Margin '+(Math.abs(g.margin)/100).toFixed(2)+' PF',evidence:[g]})
 }
 return stories;
}
const el=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e};
export async function mountLegendsLibrary(host,root='../'){
 if(!host)return;
 const status=el('p','Checking historical archives…');status.setAttribute('role','status');host.append(status);
 try{
 const get=async p=>{const r=await fetch(root+'data/'+p);if(!r.ok)throw Error('Unavailable '+p);return r.json()};
 const stories=buildLegendsLibrary(...await Promise.all(['career_core_generated.json','unified_record_book_2016_2026.json','season_guide.json','manager_verified_season_endings_v1.json'].map(get)));
 const filters=el('div'),category=el('select'),manager=el('select'),search=el('input'),results=el('div');
 search.type='search';search.placeholder='Search stories';search.setAttribute('aria-label','Search legends');
 for(const [select,label,options] of [[category,'Story category',['All',...new Set(stories.map(s=>s.category))]],[manager,'Manager',['All',...names]]]){
 select.setAttribute('aria-label',label);for(const value of options){const o=el('option',value);o.value=value;select.append(o)}
 }
 filters.className='gm46-library-filters';filters.append(category,manager,search);host.append(filters,results);
 function render(){const q=search.value.trim().toLowerCase(),rows=stories.filter(s=>(category.value==='All'||s.category===category.value)&&(manager.value==='All'||s.manager===manager.value)&&(!q||[s.manager,s.title,s.copy].join(' ').toLowerCase().includes(q)));status.textContent=rows.length+' archived stories · editorial summaries with historical evidence';results.replaceChildren();
 for(const s of rows){const card=el('article');card.className='gm46-story';card.append(el('small',s.category+' / '+s.manager),el('h3',s.title),el('p',s.copy));const details=el('details');details.append(el('summary','Historical evidence'));for(const e of s.evidence)details.append(el('p',String(e.year)+(e.week?' W'+e.week:'')+(e.source?' · '+e.source:'')));card.append(details);const link=el('a','Explore '+s.manager+'’s franchise →');link.href=root+'managers/'+(s.manager==='Thommy'?'tom':s.manager.toLowerCase())+'/#gm46-legends';card.append(link);results.append(card)}
 }
 for(const node of [category,manager,search])node.addEventListener(node===search?'input':'change',render);render();
 }catch(e){status.textContent='Reconciled legends archive unavailable.';console.warn('Legends library:',e.message)}
}
