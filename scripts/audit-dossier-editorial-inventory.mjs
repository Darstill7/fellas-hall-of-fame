// Editorial parity inventory: differences in heading labels are review candidates, not proof of missing copy.
import fs from 'node:fs';
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const decode=x=>x.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const headings=html=>[...html.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>decode(m[2].replace(/<[^>]*>/g,''))).filter(Boolean);
const editorial=/story|dossier|timeline|rushmore|trade|waiver|signature|roster|player|acquisition|draft|receipt|identity|rival|franchise/i;
const entries=slugs.map(slug=>{
 const modern=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const archive=fs.readFileSync('managers/'+slug+'.html','utf8');
 const modernHeadings=headings(modern);
 const oldHeadings=headings(archive);
 const unmatched=[...new Set(oldHeadings.filter(h=>!modernHeadings.some(n=>n.toLowerCase()===h.toLowerCase())))];
 return {manager:slug,modernHeadings:modernHeadings.length,dossierHeadings:oldHeadings.length,
  unmatchedHeadingLabels:unmatched,
  editorialReviewCandidates:unmatched.filter(h=>editorial.test(h)),
  retainedLink:modern.includes('href="../'+slug+'.html"')};
});
const failures=entries.filter(e=>!e.retainedLink||!e.editorialReviewCandidates.length);
if(failures.length){console.error('Dossier inventory audit FAILED: '+failures.map(x=>x.manager).join(', '));process.exit(1)}
console.log(JSON.stringify({disclaimer:'Heading comparisons only; manual source and claim verification still required.',managers:entries},null,2));
