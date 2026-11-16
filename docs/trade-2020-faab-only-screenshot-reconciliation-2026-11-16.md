# Screenshot confirmation — three historical 2020 $1 FAAB-only trades

**Evidence received:** November 16, 2026. The Fellas Sleeper transaction source confirms three previously asset-unexplained completed 2020 trade events. Three user-provided original Sleeper “Trade Offer” screenshots now show these were **FAAB-only** transfers, not missing player swaps.

| Date | Provider transaction ID(s) | Participants | Exchange confirmed |
|---|---|---|---|
| Sept 23, 2020 | `614536176472264704` | Stilly (Darstill) and Tony (tsteg) | **Tony → Stilly: $1 FAAB** (screenshot `IMG_4372.png`) |
| Oct 25, 2020 | `625902992721264640`, `625903284296683520` | Stilly (Darstill) and Stew (Dsylvester9) | **Two distinct accepted $1 FAAB-only trades:** one Stew → Stilly (`IMG_4370.png`), one Stilly → Stew (`IMG_4371.png`) |

Both Oct 25 transactions were timestamped about 4.1 seconds apart in the provider's recorded completed trade events. Their two screenshot images show opposite directions but **do not show transaction IDs or transaction date**. Both directions are confirmed *across the event pair*, but it is **unproven which screenshot belongs to which exact ID**. Avoid recording an arbitrary direction against either individual ID.

**Screenshot semantics:** The “SENT OFFER” / “ACCEPTED” labels confirm offer direction, not which manager acquired FAAB. The **RECEIVES / SENDS** columns establish that Darstill received $1 in `IMG_4370.png`, sent $1 in `IMG_4371.png`, and received $1 from tsteg in `IMG_4372.png`. These are waiver-auction budget units, not cash payments.

## Revised historical receipt census

2020–25 Sleeper league-chain provider Week 1–17 audits established **48 completed trade event IDs**. All are now represented by the versioned [48-event receipt ledger](../data-integrity/trade-receipts-2020-2025-48-events-v2.json):

- **41** two-manager player-for-player swaps;
- **2** player-for-$5 FAAB trades (2020 George Kittle, 2021 AJ Dillon), based on earlier user screenshots;
- **2** three-manager player exchanges (2023 nine-player trade and 2025 five-player trade);
- **3** $1 FAAB-only exchanges (confirmed by the new screenshots).

That is **45 player-bearing events plus three FAAB-only events**. There are **98 manager-event involvement sides** across the 48 transactions, including all three sides of each multiteam trade.

**Prior research corrections:** Old references to “44 complete historical trades,” “three unknown 2020 transactions,” or 89 full-era manager involvements are superseded. The first 44 transactions and their raw started production remain a 44-event analytical subset, not an exhaustive source. Recompute all trades by manager and annual counts from the 48-event ledger before awards or site publication. Do not fabricate a 0–100 trade rating or rank FAAB-only bookkeeping events with player-performance outcomes.

## Evidence handling

Three screenshots remain in the ChatGPT conversation as user-submitted evidence, recorded in source names but **not committed as binary image files**. To make this independently auditable later, store an authorized durable screenshot receipt or transaction-native metadata that records each trade direction and timestamp.

**No new scores or net trade benefit claims** are justified by these FAAB-only transactions. They should appear as verified historical transactions, possibly distinguished from the player Trade Museum.
