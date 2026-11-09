// The championship anthology must be complete, readable, and tied to verified results.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stories=read('data/championship_season_stories_2016_2025_v1.json');
const guide=read('data/season_guide.json');
const games=read('data/season_weekly_matchups_2016_2026_v1.json');
const epsn=read('data/verified_espn_playoff_brackets_2016_2019.json');
const sleeper=read('data/verified_sleeper_playoff_brackets_2020_2025.json');
const playoffs=[...epsn.seasons,...sleeper.seasons];
const years=stories.seasons.map(s=>s.year);
if(stories.version!==1||JSON.stringify([...years].sort((a,b)=>a-b))!==JSON.stringify(Array.from({length:10},(_,i)=>2016+i)))
 throw Error('Championship anthology must cover every title season 2016–2025 exactly once.');
for(const story of stories.seasons){
 const y=story.year;
 const champ=guide[y]?.champion,bracket=playoffs.find(x=>x.year===y);
 if(!champ||bracket?.champion!==champ)throw Error('Champion source disagreement '+y);
 if(!story.title||story.title.length<15||!story.dek||story.dek.length<40||story.sections.length!==4)
  throw Error('Championship story missing complete four-act feature structure '+y);
 if(!story.insideTheRun||!story.insideTheRun.heading||!Array.isArray(story.insideTheRun.paragraphs)||story.insideTheRun.paragraphs.length!==2)throw Error('Missing championship deep-dive chapter '+y);
 const deepDive=story.insideTheRun.paragraphs.join(' ');
 if(deepDive.split(/\s+/).length<95||/\b(?:undefined|NaN|tbd)\b|lorem ipsum|coming soon/i.test(deepDive))throw Error('Championship deep-dive incomplete '+y);
 if(y<=2019&&!/(?:ESPN|starter)/i.test(deepDive))throw Error('Historical ESPN limitations omitted '+y);
 const labels=(story.editorialVerdicts||[]).map(v=>v.label);
 if(story.editorialVerdicts?.length!==4||new Set(labels).size!==4)throw Error('Four distinct editorial verdicts required '+y);
 if(story.editorialVerdicts.some(v=>!v.text||v.text.trim().split(/\s+/).length<12))throw Error('Editorial verdict missing evidence '+y);
 if(y<=2019&&!story.editorialVerdicts.some(v=>/unavailable|not verif|no verified|does not verif/i.test(v.text)))throw Error('Legacy player limitations absent from editorial verdicts '+y);
 const text=story.sections.map(s=>s.text).join(' ');
 const words=text.split(/\s+/).length;
 if(words<220||words>650)throw Error('Championship story too thin or too dense '+y+' '+words);
 if(story.sections.some(s=>!s.heading||s.text.split(/\s+/).length<40))
  throw Error('Incomplete championship narrative chapter '+y);
 if(/\b(?:undefined|NaN|tbd)\b|lorem ipsum|coming soon/i.test(text))throw Error('Placeholder in championship feature '+y);
 const all=games.bySeason[String(y)]?.games;
 if(!all)throw Error('Missing season schedule '+y);
 const reg=all.filter(g=>g.stage==='regular'&&(g.home===champ||g.away===champ));
 if(!reg.length)throw Error('Champion has no recovered regular games '+y);
 const final=all.filter(g=>g.stage!=='regular'&&(g.home===champ||g.away===champ)).at(-1);
 const opponent=bracket.runnerUp||bracket.finalists.find(n=>n!==champ);
 if(!final||![final.home,final.away].includes(opponent))throw Error('Final opponent differs from source '+y);
 if(final.winner!==(final.home===champ?'HOME':'AWAY'))throw Error('Published champion did not win canonical final '+y);
 const ours=final.home===champ?final.homeScore:final.awayScore;
 const theirs=final.home===champ?final.awayScore:final.homeScore;
 const hasNumber=(n)=>[String(n),Number(n).toFixed(2)].some(x=>text.includes(x));
 if(!hasNumber(ours)||!hasNumber(theirs))throw Error('Final championship score not narrated '+y);
 if(y<=2017&&!final.twoWeekAggregate)throw Error('Legacy two-week final not represented '+y);
 if(y>=2018&&final.twoWeekAggregate)throw Error('Single-week final incorrectly presented as aggregate '+y);
}
const page=fs.readFileSync('hall/championship-stories.html','utf8');
const hall=fs.readFileSync('hall/index.html','utf8');
const editorialCss=fs.readFileSync('assets/championship-editorial.css','utf8');
for(const selector of ['.reading-nav','.cover-edition','.story-section:first-child p:first-letter','.skip-link','.archive{display:flex','.feature[data-chapter="2023"]','@media(prefers-reduced-motion:reduce)']){
 if(!editorialCss.includes(selector))throw Error('Editorial visual/accessibility requirement missing: '+selector);
}
for(const htmlToken of ['championship-editorial.css','class="reading-nav"','class="cover-edition"','class="cover-actions"','id="road-to-ring"','id="championship-story"','id="editors-notebook"','id="final-stars"','id="player-profiles"','id="rivalry-rewind"']){
 if(!page.includes(htmlToken))throw Error('Championship reading experience missing '+htmlToken);
}

if(!page.includes('roadToRing')||!page.includes('regularLog')||!page.includes('road-archive')||!page.includes('data-chapter'))throw Error('Road to Ring timeline, recovered game log or distinct season presentation missing');
if(!page.includes('rivalryRewind')||!page.includes('earlierMeetings')||!page.includes('rivalry-results'))throw Error('Rivalry rewind missing from championship anthology');
if(!page.includes('playoffPlayerProfiles')||!page.includes('postseason-players-grid')||!page.includes('people.set(id,previous)'))throw Error('Verified two-round player profile renderer missing');
if(!page.includes('editorialVerdicts')||!page.includes('editorial-verdict-grid'))throw Error('Editorial notebook not rendered');
if(!page.includes('inside-run')||!page.includes('story.insideTheRun.paragraphs'))throw Error('Deep-dive chapter absent from championship feature renderer');
for(const token of ['championship_season_stories_2016_2025_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','aria-label="Championship story archive"','id="season-picker"','id="championship-feature"'])
 if(!page.includes(token))throw Error('Missing source or navigation feature: '+token);
for(let y=2016;y<=2025;y++)if(!hall.includes('championship-stories.html?year='+y))
 throw Error('Hall trophy case cannot open '+y+' championship story');

const shareChampion={2016:'Tom',2017:'Tom',2018:'Tom',2019:'Birch',2020:'Koble',2021:'Tony',2022:'Stover',2023:'Stilly',2024:'Tom',2025:'Scott'};
if(!page.includes('data-championship-share')||!page.includes('championship-cover-score')||
   !editorialCss.includes('.cover-share-action'))
 throw Error('Share action, verified cover score or accessible share styling missing');
for(const story of stories.seasons){
 const html=fs.readFileSync('hall/share/'+story.year+'.html','utf8');
 for(const required of [story.title,shareChampion[story.year],'og:title','og:description','twitter:title',
  'championship-stories.html?year='+story.year]){
  if(!html.includes(required.replaceAll('’','&#8217;'))&&
     !html.includes(required))throw Error(story.year+' share preview missing '+required);
 }
 if(!html.includes('location.replace('))throw Error(story.year+' share link does not route readers to article');
}

const readingCss=fs.readFileSync('assets/championship-editorial.css','utf8');
if(!page.includes('storyParagraphs(x.text)')||!readingCss.includes('Editorial reading pass'))
 throw Error('Premium chapter reading presentation missing');
for(const story of stories.seasons){
 for(const chapter of story.sections){
  const source=chapter.text;
  const candidates=[...source.matchAll(/[.!?]\s+(?=[A-Z“])/g)].map(m=>m.index+1)
   .filter(i=>i>source.length*.29&&i<source.length*.72);
  if(!candidates.length)throw Error(story.year+' chapter cannot be split at a safe sentence boundary');
  const pivot=candidates.reduce((a,b)=>Math.abs(a-source.length/2)<Math.abs(b-source.length/2)?a:b);
  const parts=[source.slice(0,pivot).trim(),source.slice(pivot).trim()];
  if(parts.some(p=>p.split(/\s+/).length<30)||
     parts.join(' ').replace(/\s+/g,' ')!==source.replace(/\s+/g,' '))
   throw Error(story.year+' championship paragraph splitting lost original text or created a stub');
 }
}
console.log('CHAMPIONSHIP ANTHOLOGY VERIFIED: ten original championship features, all champion identities and finals match canonical records.');
