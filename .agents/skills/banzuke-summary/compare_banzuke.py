#!/usr/bin/env python3
"""Compare two Makuuchi banzuke JSON snapshots by association ID."""

import json
import re
import sys
from pathlib import Path


RANKS = {
    "Yokozuna": 0,
    "Ozeki": 10,
    "Sekiwake": 20,
    "Komusubi": 30,
}


def load(path):
    data = json.loads(Path(path).read_text())
    return data, {r["sumoAssociationId"]: r for r in data["rikishi"]}


def rank_value(rank):
    side = 0 if rank.endswith("East") else 1
    for title, value in RANKS.items():
        if rank.startswith(title):
            return value + side
    match = re.search(r"#(\d+)", rank)
    if match is None:
        raise ValueError(f"Unsupported rank: {rank}")
    number = int(match.group(1))
    return 40 + number * 2 + side


def print_group(title, records):
    print(title)
    for record in records:
        print(f"- {record['shikonaEn']} | {record['currentRank']}")


def main():
    if len(sys.argv) != 3:
        raise SystemExit(f"usage: {Path(sys.argv[0]).name} OLD.json NEW.json")

    old_data, old = load(sys.argv[1])
    new_data, new = load(sys.argv[2])
    added = [new[key] for key in new.keys() - old.keys()]
    removed = [old[key] for key in old.keys() - new.keys()]
    changes = []

    for key in old.keys() & new.keys():
        before = old[key]["currentRank"]
        after = new[key]["currentRank"]
        if before != after:
            changes.append(
                {
                    "name": new[key]["shikonaEn"],
                    "before": before,
                    "after": after,
                    "delta": rank_value(before) - rank_value(after),
                }
            )

    changes.sort(key=lambda change: change["delta"], reverse=True)
    print(f"Dates: {old_data.get('fetchedAt', 'unknown')} -> {new_data.get('fetchedAt', 'unknown')}")
    print(f"Roster: {len(old)} -> {len(new)}")
    print_group("New", sorted(added, key=lambda record: rank_value(record["currentRank"])))
    print_group("Out", sorted(removed, key=lambda record: rank_value(record["currentRank"])))
    print(f"Rank changes: {len(changes)}")
    for change in changes:
        before_base = change["before"].rsplit(" ", 1)[0]
        after_base = change["after"].rsplit(" ", 1)[0]
        if before_base == after_base:
            movement = "SIDE"
        elif change["delta"] > 0:
            movement = "UP"
        elif change["delta"] < 0:
            movement = "DOWN"
        else:
            movement = "SIDE"
        print(f"- {movement} | {change['name']} | {change['before']} -> {change['after']}")


if __name__ == "__main__":
    main()
