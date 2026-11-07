// One evidence-backed title exhibit per championship-winning Fellas manager.
// All champion identities and seasons are resolved against the canonical season guide.
export async function mountManagerChampionshipStories(){
 const main=document.querySelector('main'),hero=main?.querySelector(':scope > .hero'),resume=main?.querySelector('#profile-playoff-resume');
 const heading=hero?.querySelector('h1');
 if(!heading||!resume||main.querySelector('#manager-championship-stories'))return;
 const selected=heading.textContent.trim(),canonical=selected==='Tom'?'Thommy':selected;
 try{
  const paths=[
   'championship_season_stories_2016_2025_v1.json','season_guide.json',
   'season_weekly_matchups_2016_2026_v1.json',
   'verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json'
  ];
  const responses=await Promise.all(paths.map(file=>fetch('../../data/'+file,{cache:'no-store'})));
  if(responses.some(response=>!response.ok))throw Error('Canonical championship evidence unavailable');
  const [archive,guide,ledger,espn,sleeper]=await Promise.all(responses.map(response=>response.json()));
  const brackets=[...espn.seasons,...sleeper.seasons];
  if(!Array.isArray(archive.seasons)||archive.seasons.length!==10)throw Error('Championship archive incomplete');
  const titles=archive.seasons.filter(story=>guide[story.year]?.champion===canonical).sort((a,b)=>b.year-a.year);
  if(!titles.length)return; // No gold trophy decoration for managers who have not won.
  const make=(tag,className,text)=>{
   const el=document.createElement(tag);
   if(className)el.className=className;
   if(text!==undefined)el.textContent=String(text);
   return el;
  };
  const section=make('section','manager-championship-stories');
  section.id='manager-championship-stories';
  section.dataset.championshipCount=String(titles.length);
  section.setAttribute('aria-label',selected+' verified championship trophy case');
  const masthead=make('div','championship-masthead');
  const emblem=make('span','championship-masthead-trophy','🏆');emblem.setAttribute('aria-hidden','true');
  const identity=make('div','championship-masthead-copy');
  const eyebrow=make('span','championship-story-eyebrow','THE FELLAS · CHAMPIONSHIP TROPHY CASE');
  const title=make('h2',null,titles.length===1?'A championship written into history':'A dynasty of championship seasons');
  const kicker=make('p','championship-story-intro',
   titles.length===1?'One title. One season that changed the franchise’s place in Fellas history.':
   titles.length+' verified championships. Each one has its own season, opponents, and title-clinching story.');
  identity.append(eyebrow,title,kicker);
  const tally=make('div','championship-tally');
  const tallyValue=make('strong',null,titles.length);
  const tallyLabel=make('span',null,titles.length===1?'LEAGUE TITLE':'LEAGUE TITLES');
  tally.append(tallyValue,tallyLabel);
  masthead.append(emblem,identity,tally);
  const years=make('div','championship-ring-row');
  years.setAttribute('aria-label','Verified championship seasons');
  for(const story of [...titles].sort((a,b)=>a.year-b.year)){
   const ring=make('a','championship-ring','🏆 '+story.year);
   ring.href='../../hall/championship-stories.html?year='+story.year;
   ring.setAttribute('aria-label','Read '+story.year+' championship season story');
   years.append(ring);
  }
  const featureLabel=make('p','championship-feature-label',titles.length>1?'MOST RECENT TITLE · THE FEATURE STORY':'THE TITLE SEASON · THE FEATURE STORY');
  const list=make('div','manager-championship-story-list');
  for(const [index,story] of titles.entries()){
   const link=make('a','manager-championship-story-card'+(index===0?' championship-story-featured':''));
   link.href='../../hall/championship-stories.html?year='+story.year;
   link.setAttribute('aria-label','Read '+story.year+' title story: '+story.title);
   const badge=make('span','championship-story-year','🏆 '+story.year+' FELLAS CHAMPION');
   const storyTitle=make('strong',null,story.title);
   const summary=make('small',null,story.dek);
   const bracket=brackets.find(b=>b.year===story.year);
   const games=ledger.bySeason?.[String(story.year)]?.games||[];
   const runner=bracket?.runnerUp||bracket?.finalists?.find(name=>name!==canonical);
   const final=games.filter(game=>game.stage!=='regular'&&(game.home===canonical||game.away===canonical)).at(-1);
   if(!bracket||bracket.champion!==canonical||!final||
      ![final.home,final.away].includes(runner)||
      final.winner!==(final.home===canonical?'HOME':'AWAY'))
    throw Error('Championship score evidence disagreement for '+story.year);
   const mine=final.home===canonical?final.homeScore:final.awayScore;
   const theirs=final.home===canonical?final.awayScore:final.homeScore;
   const format=n=>Number(n).toFixed(2);
   const outcome=make('div','championship-title-final');
   const opponentName=runner==='Thommy'?'Tom':runner;
   outcome.append(
    make('span','championship-title-final-label','TITLE GAME · VS '+opponentName),
    make('strong','championship-title-final-score',format(mine)+' – '+format(theirs)),
    make('span','championship-title-final-format',final.twoWeekAggregate?'Two-week aggregate':'Championship final')
   );
   const cta=make('span','championship-story-cta','Read the championship story →');
   link.append(badge,storyTitle,summary,outcome,cta);list.append(link);
  }
  section.append(masthead,years,featureLabel,list);
  // Lead with the title exhibit, not after dozens of research sections.
  // Historical playoff data and the archive directory remain untouched.
  if(hero)hero.after(section);else resume.after(section);
  // The gallery loads asynchronously above the archive navigation. In Safari,
  // inserting it after initial hash scrolling can push #seasons/#rivalries
  // below the visible screen. Re-anchor those intentional deep links only.
  const selectedChapter=location.hash.slice(1).toLowerCase();
  if(['overview','seasons','rivalries','advanced'].includes(selectedChapter)){
   const navigation=document.querySelector('[data-manager-profile-tabs]');
   if(navigation)requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(location.hash.slice(1).toLowerCase()===selectedChapter)
     navigation.scrollIntoView({block:'start',behavior:'instant'});
   }));
  }
  if(!document.getElementById('manager-championship-story-style')){
   const style=make('style');style.id='manager-championship-story-style';
   style.textContent=`
.manager-championship-stories{box-sizing:border-box;position:relative;isolation:isolate;overflow:hidden;width:min(100%,990px);margin:17px auto 26px;padding:clamp(20px,3.4vw,34px);border:1px solid #b99150;border-radius:19px;background:radial-gradient(circle at 92% -22%,#71512c77,transparent 46%),linear-gradient(135deg,#302e27 0%,#142a34 54%,#0d1c28 100%);box-shadow:0 24px 55px #0006}
.manager-championship-stories:before{content:"";pointer-events:none;position:absolute;inset:0;opacity:.33;background:repeating-linear-gradient(105deg,transparent 0 64px,#e3c9940b 65px,transparent 66px);z-index:-1}
.championship-masthead{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:18px}
.championship-masthead-trophy{width:84px;height:84px;display:grid;place-items:center;flex:none;border-radius:21px;border:1px solid #dbb66b;background:linear-gradient(135deg,#6e5029,#302b25);box-shadow:inset 0 0 24px #f6d69a1d;font-size:43px}
.championship-story-eyebrow{display:block;color:#f5d18e;font-size:11px;font-weight:900;letter-spacing:.12em;line-height:1.5}
.manager-championship-stories h2{margin:6px 0 8px!important;font-size:clamp(24px,3.4vw,38px)!important;color:#fff0ce;line-height:1.18;letter-spacing:-.034em;text-wrap:balance}
.championship-story-intro{font-size:14px;color:#d8e2e5;line-height:1.65;margin:0;max-width:62ch}
.championship-tally{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:92px;min-height:99px;padding:12px;border-radius:13px;border:1px solid #b79553;background:#181c20a8}
.championship-tally strong{font-size:clamp(35px,5vw,54px);line-height:1;color:#ffe2a2;font-variant-numeric:tabular-nums}
.championship-tally span{font-size:10px;color:#e7d4ad;font-weight:850;letter-spacing:.08em;text-align:center;margin-top:7px}
.championship-ring-row{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 20px;padding:0}
.championship-ring{display:inline-flex;align-items:center;min-height:45px;padding:10px 14px;border:1px solid #a78550;border-radius:999px;background:#3b3226;color:#ffe3a6;font-size:13px;font-weight:850;letter-spacing:.015em;text-decoration:none;white-space:nowrap}
.championship-ring:hover,.championship-ring:focus-visible{background:#554028;border-color:#ffe4a5;color:white}
.championship-ring:focus-visible,.manager-championship-story-card:focus-visible{outline:3px solid #ffe0a0;outline-offset:3px}
.championship-feature-label{font-size:10px;font-weight:900;letter-spacing:.13em;color:#edcd8e;margin:0 0 10px}
.manager-championship-story-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.manager-championship-story-list:has(>.manager-championship-story-card:only-child){grid-template-columns:1fr}
.manager-championship-story-card{display:flex;flex-direction:column;gap:7px;min-width:0;padding:17px;border:1px solid #746646;border-radius:13px;background:#122835;color:#f3f3ef;text-decoration:none;min-height:158px}
.manager-championship-story-card.championship-story-featured{grid-column:1/-1;background:linear-gradient(120deg,#493725,#253038 62%,#142936);border-color:#c7a35c;min-height:170px}
.manager-championship-story-card:hover{border-color:#ffe1a3;background:#294352;color:#fff}
.championship-story-year{color:#f2d18e;font-size:11px;font-weight:900;letter-spacing:.075em}
.manager-championship-story-card strong{font-size:clamp(17px,2.3vw,24px);line-height:1.28;color:#fff7e7;letter-spacing:-.025em}
.manager-championship-story-card small{font-size:13px;line-height:1.6;color:#d3e0e5}
.championship-title-final{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;padding:10px 0 9px;margin-top:4px;border-top:1px solid #a58c5e77}.championship-title-final-label{font-size:10px;letter-spacing:.075em;font-weight:850;color:#e4c993}.championship-title-final-score{font-size:clamp(17px,2.6vw,22px)!important;line-height:1.25!important;color:#ffe6b0;font-variant-numeric:tabular-nums}.championship-title-final-format{font-size:11px;color:#c3d3dd}.championship-story-cta{margin-top:auto;font-size:13px;font-weight:850;color:#f5d18e}
@media(max-width:700px){.manager-championship-stories{padding:19px 16px;margin:13px auto 20px;border-radius:14px}.championship-masthead{grid-template-columns:auto minmax(0,1fr);align-items:start;gap:12px}.championship-masthead-trophy{width:59px;height:59px;font-size:32px;border-radius:13px}.championship-masthead-copy{min-width:0}.manager-championship-stories h2{font-size:clamp(23px,6.2vw,30px)!important}.championship-story-intro{font-size:13px}.championship-tally{grid-column:1/-1;min-width:0;min-height:0;flex-direction:row;justify-content:flex-start;gap:11px;padding:10px 13px}.championship-tally strong{font-size:32px}.championship-tally span{margin:0}.championship-ring-row{gap:7px;margin:14px 0 17px}.championship-ring{min-height:44px;padding:9px 11px;font-size:12px}.manager-championship-story-list{grid-template-columns:1fr}.manager-championship-story-card.championship-story-featured{grid-column:auto}.manager-championship-story-card{padding:15px;min-height:0}.manager-championship-story-card strong{font-size:19px}}
@media(prefers-reduced-motion:reduce){.manager-championship-story-card,.championship-ring{transition:none}}
`;
   document.head.append(style);
  }
 }catch(error){console.warn('Verified title stories unavailable; existing playoff résumé unaffected',error)}
}
