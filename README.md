[![make.fun · the-poster-for-a-place-that-i-2-20261121-0539](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539.svg)](https://make.fun/bounty/the-poster-for-a-place-that-i-2-20261121-0539?utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539)
[![rank](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539/krida268/the-poster-for-a-place-that-i-2-20261121-0539/rank.svg)](https://make.fun/bounty/the-poster-for-a-place-that-i-2-20261121-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539)
[![reward](https://make.fun/badge/the-poster-for-a-place-that-i-2-20261121-0539/krida268/the-poster-for-a-place-that-i-2-20261121-0539/reward.svg)](https://make.fun/bounty/the-poster-for-a-place-that-i-2-20261121-0539?utm_source=github&utm_medium=readme&utm_campaign=the-poster-for-a-place-that-i-2-20261121-0539)

# The Poster for a Place That Isn't There

A single procedurally drawn travel poster for **Velmora**, an invented
sky city floating above a sea of clouds in a high mountain valley.
Velmora's terraces sit above 4,000 metres, where the morning never
touches the ground: domed towers and a great spire rise from a floating
island, rope bridges reach two lookout islets, airships drift past at
dawn, and waterfalls spill from the island's edge down into the clouds.
Visitors arrive by cloud ferry from the valley floor and stay above
the weather all year. No real place, logo, or emblem is used anywhere
— every name, landmark, and mark on the poster is invented.

Tagline: *"Where morning never touches the ground."*

## Run

```sh
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` runs on Node 22 with the standard library only. It writes a
deterministic 1024×1024 PNG to `$MAKEFUN_OUTPUT_DIR/entry.png`
(default `/output/entry.png`), byte-identical across runs: a hand-rolled
PNG encoder, a 5×7 bitmap font drawn by the program itself, and vector
scenery painted pixel by pixel. No network, no clock, no randomness.

Referral code: `enzt809f`
