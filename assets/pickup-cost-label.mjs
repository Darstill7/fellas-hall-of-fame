// Display-only classification for a provider-verified completed acquisition.
// The caller must first verify transaction identity, status and added player.
export function pickupCostLabel(receipt){
 if(!receipt||receipt.status!=='complete')return 'Cost: N/A (receipt not completed)';
 if(receipt.type==='add'&&receipt.faabBid===null)
  return 'Cost: $0 · Free agent (after waivers)';
 if(receipt.type==='waiver'&&Number.isSafeInteger(receipt.faabBid)&&receipt.faabBid>=0)
  return 'Cost: $'+receipt.faabBid+' FAAB · Waiver claim';
 return 'Cost: N/A (incomplete bid evidence)';
}
