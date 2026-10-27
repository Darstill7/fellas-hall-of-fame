// Identify editorial content likely duplicated under different headings, without silently treating it as migrated.
import fs from 'node:fs';
const managers=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const normalize=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const headings=html=>[...html.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>normalize(m[2]));
const topics=[
 ['career-history',/career|record book|season.by.season|year.by.year|annual records/i],
 ['championships',/championship|finals|playoff|trophy/i],
 ['identity-and-story',/story|franchise profile|dossier|identity|biograph|timeline/i],
 ['players-and-rosters',/rushmore|roster|player|signature acquisition/i],
 ['trades-and-waivers',/trade|draft|waiver|acquisition|receipt/i],
 ['rivalries',/rival|head.to.head/i]
];
const output=managers.map(slug=>{
 const legacy=headings(fs.readFileSync('managers/'+slug+'.html','utf8'));
 const current=headings(fs.readFileSync('managers/'+slug+'/index.html','utf8'));
 const review=topics.map(([topic,re])=>({
  topic,
  legacyLabels:legacy.filter(x=>re.test(x)),
  currentLabels:current.filter(x=>re.test(x)),
  status:legacy.some(x=>re.test(x))&&current.some(x=>re.test(x))?'topic-present-in-both-review-copy':'legacy-topic-requires-review'
 }));
 return {manager:slug,topics:review};
});
console.log(JSON.stringify({method:'Heading-topic overlap only. No content migration or historical fact verification is claimed.',managers:output},null,2));
