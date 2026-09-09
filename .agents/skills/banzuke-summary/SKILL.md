---
name: banzuke-summary
description: Summarize Makuuchi banzuke changes from a Git diff or commit, including new and removed rikishi, rank promotions and demotions, sanyaku changes, and biggest movers. Use when asked for banzuke notes, Makuuchi changes, rikishi promotions, or a summary of data/rikishi/makuuchi-current.json.
---

# Banzuke Summary

Analyze changes between two versions of `data/rikishi/makuuchi-current.json` and write concise, reader-friendly banzuke notes.

## Workflow

1. Identify comparison points.
   - For a commit, compare `COMMIT^` against `COMMIT`.
   - For a working-tree diff, compare `HEAD` against the working tree.
   - Confirm file path and comparison direction before interpreting movement.

2. Load both JSON documents.
   - Use `git show REF:path` for committed versions.
   - Parse `rikishi` arrays.
   - Key records by `sumoAssociationId`, not array position or name.
   - For repeatable comparison, save snapshots to temporary JSON files and run:
     `python3 .agents/skills/banzuke-summary/compare_banzuke.py OLD.json NEW.json`
   - Treat script output as verification data; prose still follows rules below.

3. Compute membership changes.
   - New IDs = added to banzuke.
   - Missing IDs = removed from banzuke.
   - Report names and ranks for both groups.
   - Treat equal old/new roster counts as a reshuffle, not roster growth.

4. Compute rank changes for shared IDs.
   - Compare `currentRank` values.
   - Use rank order: Yokozuna, Ozeki, Sekiwake, Komusubi, Maegashira.
   - Within Maegashira, lower number ranks higher; East precedes West at same number.
   - For titled ranks, East precedes West.
   - Rank movement direction must follow this order: lower numeric rank value means promotion.

5. Highlight notable movement.
   - Always mention entries into or exits from sanyaku.
   - Surface biggest upward and downward moves.
   - Include dramatic rank changes even when they remain within Maegashira.
   - Distinguish an intra-rank side switch, such as Ozeki East to Ozeki West, from a meaningful promotion or demotion.

6. Write output.
   - Lead with roster size and comparison date when available.
   - Group notes under `Banzuke notes`, using short bullets.
   - Include `New faces` and `Out` sections or bullets.
   - Use readable shorthand such as `M2E`, `M7W`, and full titled-rank names when ambiguity matters.
   - Do not list every unchanged or minor move unless requested.
   - Do not infer Juryo promotion, retirement, injury, or cause of movement from this file alone. Say only that a rikishi is new to or out of this banzuke.

## Rank parsing

Accept these source forms:

- `Yokozuna East`
- `Ozeki West`
- `Sekiwake East`
- `Komusubi West`
- `Maegashira #12 East`

Normalize Maegashira shorthand only in prose. Preserve source rank text when precision is important.

## Suggested output

```text
**Banzuke notes**

- Makuuchi size: [old] -> [new].
- Sanyaku shakeup: [notable moves].
- Biggest climb: [name] [old] -> [new].
- Other strong risers: [names and moves].
- Biggest fall: [name] [old] -> [new].
- Other notable drops: [names and moves].
- New faces: [names].
- Out: [names].
```

## Verification

Before answering, verify:

- Every reported entrant is absent from old IDs and present in new IDs.
- Every reported exit is present in old IDs and absent from new IDs.
- Every rank move uses the same `sumoAssociationId` across versions.
- Promotion and demotion labels agree with rank ordering.
- Counts and names match the parsed data.
