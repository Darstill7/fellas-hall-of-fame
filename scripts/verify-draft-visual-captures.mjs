// Verify that the browser suite captured the complete manager drafting audit,
// rather than treating one example screenshot as a complete visual sign-off.
import fs from 'node:fs';
import path from 'node:path';
const managers=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const screens=[['chromium',390],['chromium',1280],['webkit',390]];
const errors=[],results=[];
for(const [engine,width] of screens){
 for(const manager of managers){
  for(const view of ['topics','focused']){
   const file=path.join('data-integrity','visual-audit',engine,String(width),
    'drafting-trading-'+manager+'-'+view+'.png');
   if(!fs.existsSync(file)){errors.push('Missing screenshot '+file);continue;}
   const png=fs.readFileSync(file);
   const signature='89504e470d0a1a0a';
   if(png.length<500||png.subarray(0,8).toString('hex')!==signature||
      png.subarray(12,16).toString('ascii')!=='IHDR'){
    errors.push('Invalid PNG '+file);continue;
   }
   const actualWidth=png.readUInt32BE(16),actualHeight=png.readUInt32BE(20);
   if(actualWidth!==width||actualHeight<300||actualHeight>3000){
    errors.push('Invalid screenshot viewport '+file+': '+actualWidth+'x'+actualHeight);
    continue;
   }
   results.push({engine,width,manager,view,file,bytes:png.length});
  }
 }
}
const expected=screens.length*managers.length*2;
const report={status:errors.length?'failed':'captures_complete_pending_human_inspection',
 expected,captured:results.length,errors,results};
fs.writeFileSync('data-integrity/draft-visual-capture-manifest.json',JSON.stringify(report,null,2)+'\n');
if(errors.length||results.length!==expected){
 console.error('Draft visual capture audit FAIL: '+errors.join('; '));process.exitCode=1;
}else console.log('Draft visual capture audit PASS: '+results.length+
 ' valid PNGs across 10 managers and 3 viewports. Visual inspection still required.');
