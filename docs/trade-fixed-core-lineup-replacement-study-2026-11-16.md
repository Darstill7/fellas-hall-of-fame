# Trade Museum — Fixed-Core Lineup Replacement Study (2021 and 2023)

**Checkpoint:** November 16, 2026. **Status:** reproducible research, NOT a causal proof of standings, winning percentages, playoff qualification, or net trade value.

## Why this is different from earlier hindsight research

The earlier comparison reoptimized **all nine** starter positions and could significantly overstate the trade's immediate effect. This pass instead **fixes all actual non-acquired starters in their reported slots**, removes only acquired players who were actually started, and fills only those vacancies with eligible players from the historical bench plus (for the stylized no-trade branch) the originally surrendered assets from the recipient's counterpart roster. The vacancies observe QB/RB/RB/WR/WR/TE/FLEX/FLEX/DEF, with FLEX eligible for RB/WR/TE. The replacement selection still uses **actual after-game points**, making it a hindsight *best available* substitute within the constrained roster, NOT a manager's likely pregame decision.

Only a side with **all** original surrendered assets still visible on the other manager's same-week recorded roster receives a numeric sensitivity. This is stricter than filling missing players with zero, but cannot establish they would have been legally available if the trade had never occurred. Later roster moves and dependencies are held fixed unrealistically.

**Samples:** Weeks 7–10 of 2023 Stew–Birch, Weeks 2–5 of 2021 Birch–Thommy. 16 team-week observations: **11 with numeric fixed-core sensitivity, 3 blocked missing original assets, 2 with no acquired starting player**. Non-starting players can still matter through option value, future transactions, and keeper rights.

## 2023 Lamb/Pollard/JSN exchange

**Completed transaction:** 2023-10-12 (Week 6), ID `1018289561511682048`. Birch received Lamb/Gainwell; Stew received Pollard/JSN.

### Week 8: the strongest conditional result

- Birch actually started **CeeDee Lamb for 35.00**, and the best available eligible **WR bench replacement found was Diontae Johnson, 12.50**. With all other starters held fixed, this is a **+22.50** *illustrative* starting-slot advantage, not incremental trade benefit.
- Birch actually **beat Mitch 138.16–119.32**, margin **18.84**. Under the single-slot hindsight substitution, Birch would score **115.66**, a hypothetical loss. That is a **conditional matchup flip only**. The real no-trade branch includes Pollard and JSN and potentially different roster decisions, so the actual historical result cannot be reversed as a factual claim.
- Stew actually started **Tony Pollard for 6.00** in a FLEX slot. Replacing that one slot with **CeeDee Lamb's actual 35.00** yields **+29.00 for the trade-reversed roster**. Stew actually **lost 99.16–105.76** to roster 8; keeping every other score unchanged gives **128.16–105.76**, a hypothetical win. That is another **conditional flip only**, not proof the original trade cost Stew a win.
- These two flips point in **opposite managers' directions**, showing why the best scoring **acquired-player points** alone cannot establish a simple winner. Both teams could have been different under a coherent no-trade universe; the model intentionally **does not** invent what managers would have decided.

### Week 9

- Birch started Lamb **22.60**; best eligible WR bench alternative Diontae **18.50**. Conditional fixed-core slot advantage **+4.10**.
- Birch actually **lost 95.66–108.08** to roster 2. Hypothetical 91.56 would still be a loss. 2023 roster 2 is known to have commissioner-era ownership mapping ambiguity; keep the opponent as roster ID until verified.
- Stew side **withheld** from causal or numerical fixed-core claim because original outgoing **Kenny Gainwell** was not recorded on Birch's Week 9 roster.

### Week 10

- Birch's original outgoing **Tony Pollard** was not recorded on Stew's Week 10 roster; **withhold** all numeric rollback comparisons, even though Lamb scored **34.00**.
- Stew lacked original outgoing Kenny Gainwell on Birch's Week 10 roster; withhold too.
- Week 7, both managers started **zero** newly acquired players. There is no direct starter-slot effect in this narrow model, even though their roster optionality changed.

## 2021 Birch–Thommy: QB, RB and TE packages

**Completed transaction:** 2021-08-31 (Week 1), ID `738428315181928448`. Birch acquired Lamar Jackson, Mark Andrews, Josh Jacobs; Thommy acquired Dak Prescott, Noah Fant, Antonio Gibson. Upstream, Thommy got Jacobs in the Tony transaction the preceding day, which the current single-trade rollback does not causally replay.

### Week 2

- Birch actually started **Lamar (32.26)** and **Andrews (8.20)**. Optimized replacements while fixing all other starters: **Joe Burrow (10.28)** and **Noah Fant (11.30)**. Fixed-core *actual vs rollback* difference **+18.88**.
- Birch actually **defeated Kuhl 147.76–137.60**, a **10.16** margin. A fully conditional 128.88 for Birch would become a hypothetical loss. It does **not** prove the original trade created the win.
- Thommy's actual Dak (6.48), Gibson (8.30), Fant (11.30) compared with hypothetical Lamar (32.26), best RB bench Singletary (16.10), Andrews (8.20) gives **−30.48** sensitivity for Thommy; his observed **85.88–142.52 Week 2 loss** remains a loss under this single-week substitution.

### Week 5

- Birch starts Lamar (41.88), Jacobs (14.70), Andrews (36.20). Holding all other starters fixed, candidates Dak (20.68), best eligible RB Gaskin (26.90), Fant (3.50) yield **+41.70** fixed-core sensitivity. Birch actually **won 167.28–85.58 over Stilly**, and a hypothetical 125.58 would *still* be a win.
- Thommy's actual acquired Dak (20.68), Gibson (20.20), Fant (3.50) compared with hypothetical Lamar (41.88), Jacobs (14.70), Andrews (36.20) yields **−48.40** sensitivity. His observed **105.28–178.82 loss** remains a loss under fixed-other-scores substitution.

**Observation:** Birch received a series of high-scoring starts from Lamar, Andrews and later Jacobs, but the size of the credited package return (including 2021 playoffs) must not be construed as a season-long causal win tally. Thommy's trade history has multiple immediately dependent exchanges.

## What the model can and cannot claim

**Supports:** historically accurate starting players and points, observed bench alternatives, who was on the recorded counterparty roster, simple slot eligibility, and conditional one-week outcome sensitivity with other lineup scores frozen.

**Does NOT support:** what an owner was likely to choose before games; continuous no-trade roster membership through a whole season; actual historical result reversal; cumulative standings or playoff bracket rewrites; manager trading skill; cross-deal profitability ranking; numerical 0–100 rating.

## Files and provenance

- [fixed-core starter replacement full audit](../data-integrity/trade-fixed-core-lineup-replacements-v1.json)
- [conditional matchup sensitivity](../data-integrity/trade-fixed-core-conditional-matchups-v1.json)
- [original 44-trade receipt ledger](../data-integrity/trade-benefit-evidence-ledger-2026-11-16.json)
- Connected Sleeper roster snapshots from 2021 W2–5 and 2023 W7–10, plus matching contemporaneous fantasy matchups and prior 2021/2023 trade receipts; player IDs and completed trade events independently checked in earlier audit.

## Additional gates before official award/rating

1. Verify on-date pregame starter eligibility and replacement options across each historical matchup.
2. Handle every dependent trade, waiver and keeper decision on separate legal branches. Avoid copying downstream moves that need assets no longer possessed.
3. Show a counterfactual **range** under plausible pregame lineup choices, not just a hindsight ceiling.
4. Confirm relevant league owner mappings, especially 2023 roster slot 2 and ownership tenures.
5. Calibrate incremental expected wins and opportunity costs across packages and seasons before assigning manager-specific 0–100 ratings.

**Release:** Draft PR #234 research only. No public site, record-book or manager rating mutation.
