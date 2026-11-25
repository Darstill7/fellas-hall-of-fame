import {matchesRecordWatchScores} from './weekly-record-watch.mjs';

const get=async name=>{
  const response=await fetch(new URL('../data/'+name+'.json',import.meta.url));
  if(!response.ok)throw Error('Source report unavailable');
  return response.json();
};
const status=document.getElementById('collection-freshness-status');
try{
  const [report,compact]=await Promise.all([get('site-freshness-v58'),get('home-current-season-v1')]);
  if(report.schemaVersion!==1||report.year!==compact.year||report.approvedWeek!==compact.throughWeek||
    !Array.isArray(report.surfaces)||!await matchesRecordWatchScores(compact,report.year,report.seasonScoreHash))
    throw Error('Source report no longer matches approved scores');
  const labels={CURRENT:'Current',ARCHIVED:'Archive',LAGGING:'Evidence pending',
    UNVERIFIED:'Unverified',AHEAD_OF_APPROVAL:'Ahead of approval',VERIFIED_EVENT:'Verified completed event'};
  const items=report.surfaces.map(row=>{
    const li=document.createElement('li');
    const heading=document.createElement('strong');
    heading.textContent=row.label+' · '+(labels[row.status]??'Unverified')+
      (Number.isInteger(row.throughWeek)?' · Week '+row.throughWeek:'');
    li.append(heading,document.createTextNode(' · '+row.detail));
    return li;
  });
  document.getElementById('collection-freshness').replaceChildren(...items);
  status.textContent='Compared with approved Week '+report.approvedWeek+' matchups.';
}catch{
  status.textContent='Collection freshness is unverified. Check the source receipts before using newer statistics.';
}
