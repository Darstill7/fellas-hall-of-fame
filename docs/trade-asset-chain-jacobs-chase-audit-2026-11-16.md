# The Fellas — Asset Conversion Audit: Josh Jacobs and Ja'Marr Chase

**Research checkpoint:** November 16, 2026. **Status:** Evidence-backed transaction sequences and observed roster checkpoints; economic attribution **not yet rated**.

## Executive finding

We verified both exact multi-transaction paths from original completed Sleeper trade receipts, checked nearby player ownership against historical weekly Sleeper rosters, and separately matched the prior trade lineage archive. The result confirms that a **single asset may be immediately reused as consideration in another trade**. A career Trade Rating must **not count all downstream proceeds multiple times**.

### 2021: Josh Jacobs was a one-day intermediary asset

- **August 30, 2021 — transaction `737360507476066304`:** Thommy received **Tyreek Hill, Josh Jacobs, Javonte Williams** from Tony. Tony received **Corey Davis, A.J. Brown, Jonathan Taylor**.
- **August 31, 2021 — transaction `738428315181928448`:** Thommy received **Dak Prescott, Noah Fant, Antonio Gibson** from Birch. Birch received **Lamar Jackson, Mark Andrews, Josh Jacobs** from Thommy.
- The second transaction's complete player lists and participants are confirmed by a fresh Week 1 Sleeper trade read; the individual asset directions are consistent with archive sides and Week 1 roster positions.
- **Week 1 actual roster verification:** Birch started Jacobs for **16.50** fantasy points; Thommy started Prescott, Fant and Gibson. This confirms the prior exchange had real roster consequences.
- Josh Jacobs himself produced no regular-season starts for Thommy *between* the two deals (they occurred before Week 1 games). His contribution to Thommy was as a piece of the second package, not as points scored on Thommy's team.
- **Critical valuation caveat:** Josh Jacobs was only **one of three outgoing assets** Thommy sent in the second trade, alongside Lamar Jackson and Mark Andrews. We cannot allocate the entire Prescott/Fant/Gibson package to Jacobs.
- The first exchange gave Thommy an additional *tradeable asset*. Its downstream use must be shown in a linked trade tree; the first-deal and second-deal total returns are not independent profits for the same asset.

### 2025–26: Ja'Marr Chase cycles through three verified transactions

1. **September 23, 2025 — `1276026193660899328`:** Stilly receives **Ja'Marr Chase, Chase Brown** from Stew for **Jahmyr Gibbs, RJ Harvey**.
2. **November 12, 2025 — `1294402688213057536`:** Stilly receives **Amon-Ra St. Brown, Jordan Addison, Jared Goff**; JMid receives **Ja'Marr Chase**; Thommy receives **A.J. Brown**. Earlier Week 10 rosters prove Stilly held Chase and A.J. Brown, JMid held Amon-Ra, Thommy held Goff and Addison.
3. **2026 draft:** JMid kept Chase at **pick 1.04**, and Stilly kept Amon-Ra at **pick 1.08**. Both carry real **first-round draft opportunity cost**.
4. **October 7, 2026 — `1413584172332654592`:** Stilly receives **Ja'Marr Chase, Devaughn Vele**, and JMid receives **Davante Adams, George Kittle, Breece Hall**.

**Roster corroboration:**
- Week 10 of 2025: Chase recorded on Stilly's roster; Amon-Ra on JMid's; Goff and Addison on Thommy's.
- Week 12 of 2025: Amon-Ra, Goff and Addison are all started by Stilly; Chase is present on JMid's bench; A.J. Brown starts for Thommy.
- Week 4 of 2026: Chase starts for JMid, scoring **4.20**.
- Week 6 of 2026: Chase is present on Stilly's bench, confirming post-October-trade possession (not an evaluation of that week's lineup choices).

**Key distinction:** JMid's later receipt of Adams/Kittle/Hall is not pure profit from the original three-party deal. It required relinquishing Chase, Stilly also gave up Vele in the 2026 swap, and all players consumed roster and keeper/draft opportunity cost.

## How to avoid double counting

For each individual player ID across the chain, represent a directed flow:
`event A: acquired -> team starter production -> event B: transferred out -> new owner's starts or keeper -> event C ...`.

Keep distinct columns:
- **Observed asset acquisition**: who received the player, when, and what they surrendered.
- **Observed points**: actual lineup starts credited to a specific manager-week, exactly once.
- **Asset conversion proceeds**: subsequent assets received in later trade, with all other assets paid out documented.
- **Keeper exercise**: selected keeper and draft cost in each year, not a no-cost point bonus.
- **Playoff production**: distinct from regular-season points.
- **Counterfactual benefit**: null until a coherent alternate decision branch can be supported.

Do not simply add (points from 2025 Chase) + (2026 keeper points) + (full 2026 trade proceeds) and call that Stilly's or JMid's gain. Asset conversion creates an attribution problem even when the receipts are perfect.

## Research limitations and next validation work

The transaction receipts independently establish completed trade events, but Sleeper summary responses contain combined added/dropped lists rather than player-by-player directions. The directional legs here rely on the existing historical receipt ledger plus contemporaneous week snapshots. Weekly rosters are end-state observations, not proof of exact minute-by-minute transaction eligibility.

**Not yet validated:** all intervening waiver/drop/FAAB transactions; true alternative preseason lineups; precise marginal value of Jacobs versus Lamar/Andrews within the second trade; market prices and replacement paths; full future 2026 season; attribution of postseason advancement to any individual trade.

The earlier 2021 no-trade rollback should not be cited as an unchanged-transaction causal counterfactual: its entire sampled period occurs after Jacobs was sent to Birch. Similarly, the later 2025 Stilly–Stew samples occur after Chase's November re-trade.

We can publish a **trade chain story** with these facts when the website verification gates are green. We cannot honestly publish final 0–100 manager career grades from these chains alone.

**Machine-readable source:** [2021 Jacobs and 2025–26 Chase verified chain dossier](../data-integrity/trade-asset-chain-jacobs-chase-2026-11-16.json).
