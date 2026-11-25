import fs from 'node:fs';
import {captureRecordOwnership,compareRecordOwnership,ownershipWatchPath,verifyOwnershipWatch} from './weekly-record-ownership.mjs';

const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const [mode,path] = process.argv.slice(2);
if((mode==='--snapshot'||mode==='--previous')&&!path||!['--snapshot','--previous','--check'].includes(mode))
  throw Error('Use --snapshot FILE before approval, --previous FILE after refresh, or --check to verify the report');

const current = captureRecordOwnership(read);
const write = (file,value) => fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
if(mode==='--snapshot'){
  write(path,current);
  console.log('Captured established ownership through approved Week '+current.week);
}else if(mode==='--previous'){
  const report = compareRecordOwnership(read(path),current);
  write(ownershipWatchPath,report);
  console.log('Week '+report.week+' ownership watch: '+report.changes.length+' changes');
}else{
  const changes = verifyOwnershipWatch(read(ownershipWatchPath),current);
  console.log('Week '+current.week+' ownership watch verified: '+changes.length+' changes');
}
