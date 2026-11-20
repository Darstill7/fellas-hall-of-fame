// Current-season-only records, projected from the same approved games as standings.
const host=document.getElementById('current-season-records');
if(host){
 const clean=x=>String(x??'');
 const txt=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=clean(value)};
 const number=x=>Number(x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 fetch('../data/current_2026_records_v1.json',{cache:'no-store'})
  .then(async response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json()})
  .then(data=>{
   if(data.schema!=='fellas-current-season-records-v1'||data.year!==2026||
      !Number.isInteger(data.verified_through_week)||!data.records)
      throw Error('Unsupported current-season records source');
   const r=data.records;
   txt('current-records-week','Verified through Week '+data.verified_through_week+' · '+data.number_of_games+' games');
   txt('current-record-high',number(r.highest_team_score.points));
   txt('current-record-high-note',r.highest_team_score.manager+' vs '+r.highest_team_score.opponent+' · W'+r.highest_team_score.week);
   txt('current-record-low',number(r.lowest_team_score.points));
   txt('current-record-low-note',r.lowest_team_score.manager+' vs '+r.lowest_team_score.opponent+' · W'+r.lowest_team_score.week);
   txt('current-record-total',number(r.highest_matchup_total.total));
   txt('current-record-total-note',r.highest_matchup_total.home+' / '+r.highest_matchup_total.away+' · W'+r.highest_matchup_total.week);
   txt('current-record-close',number(r.closest_matchup.margin));
   txt('current-record-close-note',r.closest_matchup.home+' / '+r.closest_matchup.away+' · W'+r.closest_matchup.week);
   txt('current-record-wide',number(r.widest_margin.margin));
   txt('current-record-wide-note',r.widest_margin.home+' / '+r.widest_margin.away+' · W'+r.widest_margin.week);
   host.dataset.ready='true';
  })
  .catch(()=>{
   txt('current-records-week','Data unavailable · current-season verification required');
   host.dataset.ready='error';
  });
}
