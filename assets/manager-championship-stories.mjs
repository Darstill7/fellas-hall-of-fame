// Each manager's verified championship stories, surfaced where their career is read.
// This module does not infer a championship from a team name or unverified transaction.
export async function mountManagerChampionshipStories(){
 const main=document.querySelector('main'),heading=main?.querySelector('.hero h1'),resume=main?.querySelector('#profile-playoff-resume');
 if(!heading||!resume||main.querySelector('#manager-championship-stories'))return;
 const selected=heading.textContent.trim(),canonical=selected==='Tom'?'Thommy':selected;
 try{
  const [collectionResponse,guideResponse]=await Promise.all([
   fetch('../../data/championship_season_stories_2016_2025_v1.json',{cache:'no-store'}),
   fetch('../../data/season_guide.json',{cache:'no-store'})
  ]);
  if(!collectionResponse.ok||!guideResponse.ok)throw Error('Championship sources unavailable');
  const [archive,guide]=await Promise.all([collectionResponse.json(),guideResponse.json()]);
  if(!Array.isArray(archive.seasons)||archive.seasons.length!==10)throw Error('Championship archive incomplete');
  const titles=archive.seasons.filter(story=>guide[story.year]?.champion===canonical).sort((a,b)=>b.year-a.year);
  if(!titles.length)return;
  const section=document.createElement('section');
  section.id='manager-championship-stories';
  section.className='manager-championship-stories';
  section.setAttribute('aria-label',selected+' championship season stories');
  const eyebrow=document.createElement('span');eyebrow.className='championship-story-eyebrow';
  eyebrow.textContent='🏆 THE CHAMPIONSHIP FILE';
  const h=document.createElement('h2');h.textContent=titles.length===1?'The season that won it all':'Every championship has its own story';
  const intro=document.createElement('p');intro.className='championship-story-intro';
  intro.textContent=titles.length+' verified '+(titles.length===1?'championship':'championships')+' · Read how the season unfolded, the defining opponents and the title-clinching game.';
  const list=document.createElement('div');list.className='manager-championship-story-list';
  for(const story of titles){
   const link=document.createElement('a');link.className='manager-championship-story-card';
   link.href='../../hall/championship-stories.html?year='+story.year;
   const badge=document.createElement('span');badge.className='championship-story-year';badge.textContent='🏆 '+story.year;
   const title=document.createElement('strong');title.textContent=story.title;
   const summary=document.createElement('small');summary.textContent=story.dek;
   const cta=document.createElement('span');cta.className='championship-story-cta';cta.textContent='Read the season story →';
   link.append(badge,title,summary,cta);
   list.append(link);
  }
  section.append(eyebrow,h,intro,list);
  resume.after(section);
  const css=document.createElement('style');css.id='manager-championship-story-style';
  css.textContent=`.manager-championship-stories{margin:18px auto 26px;max-width:990px;padding:21px;border:1px solid #bb9452;border-radius:15px;background:linear-gradient(135deg,#2c3033,#102735 75%)}.championship-story-eyebrow{display:block;color:#f1c779;font-size:11px;font-weight:850;letter-spacing:.12em}.manager-championship-stories h2{margin:7px 0 5px!important;font-size:clamp(22px,3vw,29px)!important;color:#ffe1a3;line-height:1.25}.championship-story-intro{font-size:13px;color:#c6d4dc;line-height:1.6;margin:0 0 14px}.manager-championship-story-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.manager-championship-story-card{display:flex;flex-direction:column;gap:8px;min-width:0;padding:15px;border:1px solid #947a49;border-radius:11px;background:#182e3b;text-decoration:none;color:#edf1f5;min-height:168px}.manager-championship-story-card:hover{background:#254052;border-color:#f4cf80}.manager-championship-story-card:focus-visible{outline:3px solid #ffe1a3;outline-offset:3px}.championship-story-year{color:#f6d48c;font-size:13px;font-weight:900}.manager-championship-story-card strong{font-size:18px;line-height:1.25;color:#fff}.manager-championship-story-card small{font-size:12px;color:#c7d7e0;line-height:1.55}.championship-story-cta{margin-top:auto;font-size:12px;font-weight:850;color:#f0ce8e}@media(max-width:650px){.manager-championship-stories{padding:14px;margin:15px 0 21px}.manager-championship-story-list{grid-template-columns:1fr}.manager-championship-story-card{min-height:0;padding:14px}.manager-championship-story-card strong{font-size:17px}}`;
  if(!document.getElementById(css.id))document.head.append(css);
 }catch(error){console.warn('Championship story links unavailable; existing verified resume unaffected',error)}
}
