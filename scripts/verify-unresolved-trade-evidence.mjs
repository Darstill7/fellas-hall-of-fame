// Keep unresolved trade evidence out of published player-trade rankings.
import fs from 'node:fs';
const engine=JSON.parse(fs.readFileSync('data/v9_trade_engine.json','utf8'));
const status=JSON.parse(fs.readFileSync('data/v9_1_trade_status.json','utf8'));
const fail=[];
const incomplete=engine.incomplete||[];
const noAssets=incomplete.filter(x=>x.classification==='excluded_no_documented_player_assets');
const statusExcluded=status.excluded||[];
if(noAssets.length!==3)fail.push('Expected 3 archived 2020 no-player-asset events; inspect classification changes');
for(const tx of noAssets){
 const match=statusExcluded.find(x=>String(x.id)===String(tx.id));
 if(!match)fail.push('No matching source-status exclusion: '+tx.id);
 if(tx.include_in_player_trade_rankings!==false||match?.include_in_player_trade_rankings!==false)fail.push('Unresolved playerless event incorrectly included: '+tx.id);
 if(tx.faab_only!=='possible_unconfirmed'||match?.faab_only!=='possible_unconfirmed')fail.push('Unsupported FAAB-only certainty assigned to '+tx.id);
 if(engine.sides.some(x=>String(x.trade_id)===String(tx.id)))fail.push('Unresolved event present in scored trade sides: '+tx.id);
}
const three=status.three_way_2023;
const threeIncomplete=incomplete.find(x=>String(x.id)===String(three?.trade_id));
if(!threeIncomplete||three?.status!=='asset_direction_reconciled_scoring_pending')fail.push('2023 three-way pending score classification changed');
if(threeIncomplete?.include_in_player_trade_rankings!==false)fail.push('Unscored 2023 three-way in rankings');
if(engine.sides.some(x=>String(x.trade_id)===String(three?.trade_id)))fail.push('Unscored three-way has a graded side');
if(fail.length){console.error('Unresolved trade evidence gate FAILED:\n'+fail.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Unresolved trade evidence gate PASS: three playerless 2020 records preserved as uncertain and excluded; 2023 three-way grading pending and excluded.');
