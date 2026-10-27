// Verify one-to-one model side provenance against the audited 101-row transaction manifest.
// This validates identity/coverage, NOT original transaction completeness or player valuation.
import fs from 'node:fs';
const sides=JSON.parse(fs.readFileSync('data/v9_trade_engine.json','utf8')).sides;
const csv=fs.readFileSync('data/trade_source_manifest_101.csv','utf8').trim().split(/\r?\n/);
const head=csv.shift().split(',');
const col=name=>head.indexOf(name);
const fields=['year','trade_id','manager','week','date'];
for(const field of fields)if(col(field)<0)throw Error('Missing manifest column '+field);
const manifest=csv.map(row=>{const cells=row.split(',');return Object.fromEntries(fields.map(k=>[k,cells[col(k)]]))});
const key=x=>[x.year,x.trade_id,x.manager].join('|');
const keys=new Set(manifest.map(key));
const issues=[];
if(manifest.length!==sides.length)issues.push('Trade side count differs: manifest '+manifest.length+' vs engine '+sides.length);
if(keys.size!==manifest.length)issues.push('Duplicate manager/trade/year records in manifest');
const modeled=new Set(sides.map(key));
if(modeled.size!==sides.length)issues.push('Duplicate manager/trade/year model sides');
for(const side of sides){
 const m=manifest.find(x=>key(x)===key(side));
 if(!m){issues.push('Model side lacks manifest source '+key(side));continue}
 if(+m.week!==side.week||m.date!==side.date)issues.push('Date/week mismatch for '+key(side));
}
for(const row of manifest)if(!modeled.has(key(row)))issues.push('Source manifest side absent from model: '+key(row));
if(issues.length){console.error('Trade source-manifest parity FAILED:\n'+issues.join('\n'));process.exit(1)}
console.log('Trade source-manifest parity PASS: '+sides.length+' model sides matched 1:1 with archived manifest by season, transaction, manager, date and week.');
