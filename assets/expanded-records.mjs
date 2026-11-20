// Source-backed extended records: manager inclusion without invented league titles.
const css=new URL("./expanded-records.css",import.meta.url).href;
if(!document.querySelector('link[data-expanded-record-css]')){
 const l=document.createElement("link");l.rel="stylesheet";l.href=css;l.dataset.expandedRecordCss="";document.head.append(l);
}
const escapeHtml=v=>String(v??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(v,u)=>{const n=Number(v);const display=Number.isFinite(n)?n.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2}):String(v??"—");return u==="%"?display+"%":u==="score / 100"?display+"/100":display+(u?" "+u:"")};
const groups=["Single-game","Career","Season","Rivalries","Final standings"];
const ordinal=v=>{const n=Number(v);if(!Number.isInteger(n))return String(v);const tail=n%100;return n+((tail>=11&&tail<=13)?"th":({1:"st",2:"nd",3:"rd"}[n%10]||"th"))};
const canonical=["Stilly","Stew","Tom","Stover","Birch","Tony","Mitch","Kuhl","JMid","Scott"];
// A list of all observed seasons is not evidence of years achieving an award.
// Finished-place highlights are resolved against the official final-placement ledger.
let verifiedTopThreeYears=new Map();
function verifiedFinishContext(row){
 const raw=verifiedTopThreeYears.get(row.manager||"");
 if(!raw)return "Verified podium years unavailable; see completed-season history";
 return raw.map(r=>r.year+" ("+ordinal(r.rank)+")").join(" · ");
}
const detail=(row)=>{
 const e=row.evidence||{};
 if(row.key==="top-three-finishes")return verifiedFinishContext(row);
 const year=e.year??row.year??row.season;
 const week=e.week??row.week;
 if(e.opponent&&Number.isInteger(Number(week))&&Number.isInteger(Number(year)))
  return year+" · Week "+week+" vs "+e.opponent+(e.outcome?" · "+(e.outcome==="W"?"Win":e.outcome==="L"?"Loss":e.outcome):"");
 if(e.opponent&&Number.isFinite(e.meetings))return e.opponent+" · "+e.meetings+" meetings"+(Number.isFinite(e.wins)?" · "+e.wins+" wins":"");
 if(year&&e.games&&row.group==="Season")return year+" season · "+e.games+" recovered games";
 if(e.fromYear&&e.toYear)return e.fromYear+" to "+e.toYear+" · "+ordinal(e.fromRank)+" to "+ordinal(e.toRank);
 if(e.endingYear)return "Streak ending "+e.endingYear+(e.endingWeek?" · Week "+e.endingWeek:"");
 if(e.years?.length)return e.years.join(", ");
 if(year)return "Season "+year;
 if(e.games)return e.games+" recovered regular-season games";
 return "Verified recovered league history";
};
const tile=(title,value,sub,tag="")=>'<article class="records-lab-tile"><small>'+escapeHtml(title)+'</small><strong>'+escapeHtml(value)+'</strong>'
 +(tag?'<span class="records-lab-tag '+(tag.includes("League")?"records-lab-tag--leader":"")+'">'+escapeHtml(tag)+'</span>':"")
 +'<p>'+escapeHtml(sub)+'</p></article>';
function signatureTiles(data,name,limit=3){
 const sig=data.signatures?.[name];if(!sig)return "";
 return sig.highlights.slice(0,limit).map(highlight=>{
  // A signature must never hide the manager's better, source-verified ranking
  // in the same category (e.g. 11 rival wins instead of 10).
  const category=data.categories.find(c=>c.key===highlight.key);
  const best=category?.leaders.filter(r=>r.manager===name).sort((a,b)=>a.rank-b.rank)[0];
  const corrected=best&&Number.isInteger(highlight.leagueRank)&&best.rank<highlight.leagueRank;
  const row=corrected?{...highlight,...best,key:highlight.key,label:highlight.label,unit:category.unit,leagueRank:best.rank,scope:best.rank<=3?"League top-three":"Personal best"}:highlight;
  const badge=row.scope==="League top-three"?"League top three · #"+row.leagueRank:row.scope==="Personal best"?"Personal mark · #"+row.leagueRank+" league rank":row.scope;
  return tile(row.label,fmt(row.value,row.unit),detail({...row,manager:name}),badge);
 }).join("");
}
function managerLeagueHolders(data,name){
 return data.categories.flatMap(c=>c.leaders.filter(r=>r.manager===name&&r.rank<=3).map(r=>({category:c,record:r})))
  .sort((a,b)=>a.record.rank-b.record.rank||a.category.group.localeCompare(b.category.group)||a.category.label.localeCompare(b.category.label));
}
function renderHub(data){
 const host=document.getElementById("expanded-records-teaser");if(!host)return;
 host.classList.add("records-lab");
 const keys=["season-points","narrowest-win","rival-wins"];
 host.innerHTML='<h2>Beyond the scoreboard · '+data.categoryCount+' more record categories</h2>'
 +'<p class="records-lab-intro">Close-game escapes, best seasons, rivalry dominance, scoring milestones and career accomplishments. All ten current managers have sourced personal records; league-leading marks are labeled separately.</p>'
 +'<div class="records-lab-grid">'+keys.map(key=>{
  const cat=data.categories.find(x=>x.key===key);const winner=cat?.leaders?.[0];
  return winner?tile(cat.label,fmt(winner.value,cat.unit),winner.manager+" · "+detail(winner)):'';}).join('')
 +'</div><a class="records-lab-action" href="expanded-records.html">Explore all '+data.categoryCount+' record categories →</a>';
}
function renderProfile(data){
 const host=document.querySelector("[data-expanded-records-profile]");if(!host)return;
 const name=host.dataset.expandedRecordsProfile;
 const sig=data.signatures?.[name];if(!sig)return;
 const ranked=managerLeagueHolders(data,name);
 const firstPlace=new Set(ranked.filter(x=>x.record.rank===1).map(x=>x.category.key)).size;
 const topThree=new Set(ranked.map(x=>x.category.key)).size;
 const link='../../analytics/expanded-records.html?manager='+encodeURIComponent(name);
 host.classList.add("records-lab-profile","records-lab-profile-direct");
 host.innerHTML='<div class="records-profile-summary"><div><span class="records-profile-eyebrow">VERIFIED RECORD PORTFOLIO</span><h2>'+escapeHtml(name)+' · Records</h2><p class="records-lab-intro">'+firstPlace+' first-place categories · '+topThree+' categories ranked in the top three · '+data.categoryCount+' researched categories. Ties share credit; personal marks are not league records.</p></div>'
 +'<a class="records-lab-action" href="'+link+'">All records and rankings →</a></div>'
 +'<details class="records-profile-preview"><summary>Preview standout records</summary><div class="records-lab-profile-body"><div class="records-lab-grid">'+signatureTiles(data,name,3)+'</div></div></details>';
}
function renderManagerBook(data,complete=null){
 const host=document.getElementById("expanded-manager-records"),picker=document.getElementById("manager");if(!host||!picker)return;
 host.classList.add("records-lab","records-lab-manager");
 const paint=()=>{
  const name=picker.value==="Thommy"?"Tom":picker.value,sig=data.signatures?.[name];
  const personal=complete?.managers?.[name];
  if(personal){
   const sorted=[...personal.categories].sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group)||a.label.localeCompare(b.label));
   host.innerHTML='<h2>Complete record portfolio · '+escapeHtml(personal.displayName)+'</h2>'
    +'<p class="records-lab-intro">'+personal.leagueRecordCategories+' league-leading categories · '
    +personal.topThreeCategories+' top-three categories · '+personal.qualifyingCategories
    +' qualifying of '+sorted.length+' established categories. Individual best marks are not automatically league records.</p>'
    +'<div class="records-lab-table-scroll"><table class="records-lab-table records-lab-full-portfolio">'
    +'<caption>Full personal record standings and historical context</caption>'
    +'<thead><tr><th>Category</th><th>League rank</th><th>Personal best</th><th>Source context</th></tr></thead><tbody>'
    +sorted.map(r=>{
     const link='../analytics/expanded-records.html?group='+encodeURIComponent(r.group)
       +'&category='+encodeURIComponent(r.categoryId)+'&manager='+encodeURIComponent(name);
     const context=r.eligible?detail({key:r.categoryId,group:r.group,year:r.year,week:r.week,evidence:r.evidence,manager:name})
       :'No qualifying historical entry'+(r.qualifier?' · '+r.qualifier:'');
     return '<tr'+(r.leagueRank===1?' class="records-full-holder"':'')+'>'
      +'<td><a href="'+link+'">'+escapeHtml(r.label)+'</a><small class="records-full-group">'+escapeHtml(r.group)+'</small></td>'
      +'<td>'+escapeHtml(r.leagueRank===null?'Not eligible':'#'+r.leagueRank+(r.leagueRank===1?' · League record':''))+'</td>'
      +'<td>'+escapeHtml(r.eligible?fmt(r.value,r.unit):'—')+'</td>'
      +'<td>'+escapeHtml(context)+'</td></tr>';
    }).join('')+'</tbody></table></div>'
    +'<a class="records-lab-action" href="../analytics/expanded-records.html?manager='+encodeURIComponent(name)
    +'">Open the league-wide rankings and manager portfolio →</a>';
   return;
  }
  if(!sig){host.innerHTML='<h2>Signature records</h2><p class="records-lab-intro">This archived manager is not in the current ten-manager signature collection. Historical matchup records remain available above.</p>';return}
  const holders=managerLeagueHolders(data,name);
  host.innerHTML='<h2>Signature records · '+escapeHtml(name)+'</h2>'
   +'<p class="records-lab-intro">'+holders.length+' ranked top-three entries across '+new Set(holders.map(x=>x.category.key)).size+' distinct categories (of '+data.categoryCount+'), plus separately labeled personal milestones.</p>'
   +'<div class="records-lab-grid">'+signatureTiles(data,name,6)+'</div>'
   +'<a class="records-lab-action" href="../analytics/expanded-records.html?manager='+encodeURIComponent(name)+'">See every '+escapeHtml(name)+" record and ranking →</a>";
 };
 picker.addEventListener("change",paint);paint();
}
function renderExplorer(data,complete=null){
 const host=document.getElementById("expanded-records-explorer"),portfolio=document.getElementById("manager-record-portfolio");if(!host||!portfolio)return;
 const url=new URL(location.href);
 let selectedGroup=groups.includes(url.searchParams.get("group"))?url.searchParams.get("group"):"Career";
 let selectedCategory=data.categories.find(c=>c.key===url.searchParams.get("category")&&c.group===selectedGroup)?.key||data.categories.find(c=>c.group===selectedGroup)?.key;
 const requestedManager=url.searchParams.get("manager");
 let selectedManager=canonical.includes(requestedManager)?requestedManager:requestedManager==="Thommy"?"Tom":"Stilly";
 host.classList.add("records-lab");
 host.innerHTML='<div class="records-lab-controls"><label>Record family<select id="expanded-group"></select></label>'
 +'<label>Record category<select id="expanded-category"></select></label></div>'
 +'<h2 id="expanded-title"></h2><p class="records-lab-intro" id="expanded-description"></p>'
 +'<div class="records-lab-table-scroll"><table class="records-lab-table"><thead><tr><th>Rank</th><th>Manager</th><th>Record</th><th>Verified context</th></tr></thead><tbody id="expanded-rows"></tbody></table></div>'
 +'<p class="records-lab-caveat">'+data.rules.map(escapeHtml).join(" ")+'</p>';
 const group=host.querySelector("#expanded-group"),category=host.querySelector("#expanded-category"),manager=portfolio.querySelector("#expanded-manager");
 group.innerHTML=groups.map(g=>'<option value="'+escapeHtml(g)+'">'+escapeHtml(g)+'</option>').join("");
 manager.innerHTML='<option value="">All managers</option>'+canonical.map(m=>'<option value="'+escapeHtml(m)+'">'+escapeHtml(m==="Tom"?"Thommy":m)+'</option>').join("");
 const spotlight=()=>{
  const el=portfolio.querySelector("#expanded-spotlight");
  if(complete?.managers?.[selectedManager]){
   // All 44 category rankings come from the complete, canonical full-ranking engine.
   // Never imply a truncated global top-20 list is a manager's entire portfolio.
   const person=complete.managers[selectedManager];
   const full=person.categories;
   const eligible=full.filter(c=>c.eligible);
   const sorted=[...full].sort((a,b)=>groups.indexOf(a.group)-groups.indexOf(b.group)||
    a.label.localeCompare(b.label));
   const title=escapeHtml(person.displayName);
   el.innerHTML='<h3>'+title+' · Complete record portfolio</h3>'
    +'<p class="records-lab-intro"><strong>'+person.leagueRecordCategories+' league-leading categories</strong> · '
    +person.topThreeCategories+' top-three categories · '+person.qualifyingCategories
    +' qualifying categories of '+full.length+'. Every rank is calculated from the full recovered historical field, not a top-20 excerpt.</p>'
    +'<div class="records-lab-table-scroll"><table class="records-lab-table records-lab-full-portfolio">'
    +'<caption>Every published category · personally ranked or clearly marked ineligible</caption>'
    +'<thead><tr><th>Category</th><th>League rank</th><th>Your best mark</th><th>Verified context</th></tr></thead><tbody>'
    +sorted.map(r=>{
      const url='?group='+encodeURIComponent(r.group)+'&category='+encodeURIComponent(r.categoryId)
       +'&manager='+encodeURIComponent(selectedManager);
      const label=r.leagueRank===1?'#1 · Shared league record':r.leagueRank!==null?'#'+r.leagueRank:'Not eligible';
      const context=r.eligible?detail({key:r.categoryId,group:r.group,year:r.year,week:r.week,
       evidence:r.evidence,manager:selectedManager}):'No qualifying source entry'+(r.qualifier?' · '+r.qualifier:'');
      return '<tr'+(r.leagueRank===1?' class="records-full-holder"':'')+'>'
       +'<td><a href="'+url+'">'+escapeHtml(r.label)+'</a><small class="records-full-group">'+escapeHtml(r.group)+'</small></td>'
       +'<td>'+escapeHtml(label)+'</td><td>'+escapeHtml(r.eligible?fmt(r.value,r.unit):'—')+'</td>'
       +'<td>'+escapeHtml(context)+'</td></tr>';
     }).join('')
    +'</tbody></table></div>'
    +'<p class="records-lab-caveat">League records are marked #1. All other ranked marks are personal bests, not additional league titles. '
    +'A missing qualifying result is never treated as a zero score. Current regular-season data are through 2026 Week 9; '
    +'completed-season awards end in 2025. ESPN and Sleeper scoring rules differed.</p>';
   return;
  }
  if(!selectedManager){el.innerHTML='<h3>Choose a manager</h3><p class="records-lab-intro">Select any manager to view verified personal records. The full category research lab is below.</p>';return}
  const sig=data.signatures[selectedManager],holders=managerLeagueHolders(data,selectedManager);
  const seen=new Set(),unique=holders.filter(({category:c})=>!seen.has(c.key)&&seen.add(c.key));
  el.innerHTML='<h3>'+escapeHtml(selectedManager)+' · Record portfolio</h3>'
   +'<p class="records-lab-intro">'+holders.length+' top-three leaderboard entries across '+unique.length+' distinct categories. Personal bests are shown separately and are not automatically league records.</p>'
   +'<div class="records-lab-grid">'+signatureTiles(data,selectedManager,8)+'</div>'
   +(unique.length?'<h3>Every category with a league top-three mark</h3><div class="records-lab-table-scroll"><table class="records-lab-table"><thead><tr><th>Standing</th><th>Category</th><th>Best verified mark</th><th>Context</th></tr></thead><tbody>'
     +unique.map(({category:c,record:r})=>'<tr><td>#'+r.rank+'</td><td><a href="?group='+encodeURIComponent(c.group)+'&category='+encodeURIComponent(c.key)+'&manager='+encodeURIComponent(selectedManager)+'">'+escapeHtml(c.label)+'</a></td><td>'+escapeHtml(fmt(r.value,c.unit))+'</td><td>'+escapeHtml(detail(r))+'</td></tr>').join('')
     +'</tbody></table></div>':'<p class="records-lab-intro">No top-three leaderboard marks in the current evidence set; the personal milestones above are still verified.</p>');
 };
 const render=()=>{
  group.value=selectedGroup;
  const opts=data.categories.filter(c=>c.group===selectedGroup);
  category.innerHTML=opts.map(c=>'<option value="'+escapeHtml(c.key)+'">'+escapeHtml(c.label)+'</option>').join("");
  if(!opts.some(c=>c.key===selectedCategory))selectedCategory=opts[0].key;
  category.value=selectedCategory;manager.value=selectedManager;
  const c=data.categories.find(c=>c.key===selectedCategory);
  host.querySelector("#expanded-title").textContent=c.label;
  host.querySelector("#expanded-description").textContent=c.description+(c.qualifier?" Qualification: "+c.qualifier+".":"")+" Top "+c.leaders.length+" recovered entries shown.";
  host.querySelector("#expanded-rows").innerHTML=c.leaders.map(r=>'<tr><td>#'+r.rank+'</td><td><a href="?manager='+encodeURIComponent(r.manager)+'">'+escapeHtml(r.manager)+'</a></td><td>'+escapeHtml(fmt(r.value,c.unit))+'</td><td>'+escapeHtml(detail(r))+'</td></tr>').join("")||'<tr><td colspan="4">No eligible verified entries.</td></tr>';
  url.searchParams.set("group",selectedGroup);url.searchParams.set("category",selectedCategory);
  if(selectedManager)url.searchParams.set("manager",selectedManager);else url.searchParams.delete("manager");
  history.replaceState(null,"",url);
  spotlight();
 };
 group.addEventListener("change",()=>{selectedGroup=group.value;selectedCategory=data.categories.find(c=>c.group===selectedGroup)?.key;render()});
 category.addEventListener("change",()=>{selectedCategory=category.value;render()});
 manager.addEventListener("change",()=>{selectedManager=manager.value;render()});
 render();
}
try{
 const res=await fetch(new URL("../data/expanded_records_verified_v1.json",import.meta.url));
 if(!res.ok)throw Error("Expanded records archive: HTTP "+res.status);
 const data=await res.json();
 // Reconstruct every rankable entry for the full 44-category manager portfolio.
 // Preserve legacy source fallback if one of the canonical datasets is inaccessible.
 let complete=null;
 try{
  const [gameRes,finishRes]=await Promise.all([
   fetch(new URL("../data/unified_record_book_2016_2026.json",import.meta.url)),
   fetch(new URL("../data/fellas_final_placements_2016_2025_verified.json",import.meta.url))
  ]);
  if(!gameRes.ok||!finishRes.ok)throw Error("Canonical portfolio sources unavailable");
  const [{buildCompleteManagerPortfolios},games,finishes]=await Promise.all([
   import("./full-manager-record-portfolios.mjs"),gameRes.json(),finishRes.json()
  ]);
  complete=buildCompleteManagerPortfolios(data,games,finishes);
 }catch(error){console.warn("Complete personal rankings unavailable; retaining legacy highlights",error)}
 // Keep the first screen resilient: finishing receipt failure must not block every record.
 try{
  const placement=await fetch(new URL("../data/fellas_final_placements_2016_2025_verified.json",import.meta.url));
  if(placement.ok){
   const official=await placement.json();
   if(Array.isArray(official.seasons)){
    const map=new Map();
    for(const season of official.seasons)for(const finish of season.finishes||[]){
     if(finish.rank>3||!Number.isInteger(finish.rank))continue;
     const who=finish.manager==="Thommy"?"Tom":finish.manager;
     const rows=map.get(who)||[];rows.push({year:season.year,rank:finish.rank});map.set(who,rows);
    }
    verifiedTopThreeYears=map;
   }
  }
 }catch(error){console.warn("Official podium-year evidence unavailable",error)};
 if(data.version!==1||data.categoryCount!==data.categories.length||!canonical.every(n=>data.signatures?.[n]))throw Error("Expanded record data invalid");
 renderHub(data);renderProfile(data);renderManagerBook(data,complete);renderExplorer(data,complete);
}catch(error){
 for(const id of ["manager-record-portfolio","expanded-records-teaser","expanded-manager-records","expanded-records-explorer"]){
  const el=document.getElementById(id);if(el)el.textContent="Expanded records are temporarily unavailable. Existing verified records remain accessible.";
 }
 const profile=document.querySelector("[data-expanded-records-profile]");if(profile)profile.textContent="Additional records temporarily unavailable.";
 console.error("Expanded Fellas records:",error);
}
