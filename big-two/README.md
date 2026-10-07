# Big Two Card Club

Open `../big-two.html` directly, or serve the repository with a static web server. No build, packages, API keys, or network requests are required. The main game menu links to Big Two.

One human plays three local computer opponents. Relaxed selects random legal moves; Slim preserves groups and high cards; Expert uses a subset dynamic program to minimize remaining plays. Opponents receive only their own hand and the public table. Hints use the Expert strategy.

House rules are described in the in-game dialog: diamonds < clubs < hearts < spades, 3 low and 2 high, singles/pairs/triples/five-card poker combinations, no 2 or wraparound in straights, rank-first flush comparison, three passes reset the table, and passing permits later re-entry. The first player out wins the round.

Completed rounds award 25 XP, with another 100 XP for a win. Levels advance every 200 XP. Badges reward a first win, three consecutive wins, and an Expert win. Progress uses `localStorage` key `bigTwoProfileV1`; abandoned rounds earn nothing. Storage failure does not prevent playing.

Run engine regression tests and 300 seeded simulation games:

```sh
node --test tests/big-two.test.cjs
```
