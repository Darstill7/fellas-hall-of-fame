# Fellas 2026 keeper rights in actual trade chains — five verified selections

**Checkpoint:** November 16, 2026. **Status:** draft research and UI evidence; not a 2027 keeper cost forecast.

## Scope and accounting

The original 2026 keeper record contains 20 selections, two for each of ten teams, with keeper rounds and original-manager started points through Week 8. Cross-referencing the nine completed 2026 Sleeper trades through Week 10 finds **five** keeper selections involved in **four distinct completed transactions**, producing **seven asset transfers** because two keepers traded twice.

| Original 2026 keeper | Original manager | 2026 cost | Confirmed transfer path |
|---|---|---:|---|
| Emeka Egbuka | Stew | Round 6 | Stew → Scott, Sept 1, W1 |
| Ladd McConkey | Scott | Round 8 | Scott → Stew, Sept 1, W1; Stew → Kuhl, Sept 30, W4 |
| Ja'Marr Chase | JMid | Round 1 | JMid → Stilly, Oct 7, W5 |
| Nico Collins | Kuhl | Round 3 | Kuhl → Stew, Nov 15, W10 |
| Drake Maye | Kuhl | Round 14 | Kuhl → Stew, Sept 30, W4; Stew → Kuhl, Nov 15, W10 |

**Maye's round trip** makes the relationship between actual draft cost and subsequent trade/keeper rights tangible: Kuhl paid a Round 14 keeper selection to retain Maye in 2026, Stew acquired Maye through the September deal, and Kuhl reacquired Maye in November while sending Collins to Stew. This is NOT a 2027 Round 14 valuation, and Maye's later injury or weekly point changes are not credited to Kuhl retroactively.

Nico Collins is an important source-cutoff exception: the original keeper scoring report stopped at Week 8 and showed `transferredDuringSeason:false`; it is now superseded for transaction ownership by the completed Week 10 trade. Do not treat the Week 8 snapshot as proof Collins stayed with Kuhl after November 15.

### Keeper accounting principles

1. **Selection is an acquisition cost, not a future price:** The keeper round is the verified 2026 original manager's cost, not the owner's 2027 eligibility or price.
2. **Asset ownership follows transaction order:** A transfer changes which manager can receive future starts or keeper rights, but does not transfer the historical 2026 round expense to the recipient in retrospect.
3. **No double counting:** Each player's credited points belong to their actual team and starter week. Prior owners cannot claim later owners' points without a strictly labeled value-of-traded-away-asset comparison.
4. **Pending Week 10:** Nov 15 completed trade is valid as a receipt; as of Monday Nov 16, Week 10 fantasy performance is not final and remains unknown.
5. **Keeper rights and 2027 opportunity cost:** The league's verbal keeper-right transfer rule is separate from an independently validated round-eligibility calculation. No specific 2027 keeper round is published here.

## Files

- [Keeper movement dossier](../data-integrity/trade-2026-traded-keeper-dossier-v1.json)
- [Original 2026 keeper picks and Week 1–8 evidence](../data/keeper_2026_website_research_v1.json)
- [2026 Sleeper completed trade receipts and strictly-later scoring](../data-integrity/trade-2026-current-receipts-week9-final-v1.json)
- [Interactive trade case files](../managers/trade-explorer.html)

## UI and validation

The Trade Explorer shows a dedicated keeper asset trail for the four completed trades containing these five original keeper selections, including verified original 2026 round, movement direction and recorded starter points through Week 8; this does not create a 2027 round or trade skill grade. Browser regression checks cover the Nico Collins / Drake Maye Week 10 exchange and Maye's return; **12/12 source-level checks** passed, not necessarily browser QA.

Do not merge until canonical/browser workflows pass and latest rendered screenshots are inspected.
