# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/vickyair1/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/vickyair1/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that guides and tracks all **55 PlayStation 5 trophies** of
Grand Theft Auto VI: **1 platinum, 2 gold, 6 silver, 46 bronze** (28 hidden on
PlayStation until earned). Every trophy shows its official name, description and
grade exactly as PlayStation publishes them, plus an own-words guide, numbered
steps, a missable flag and cited sources.

Bounty: https://make.fun/bounty/gta6-trophy-guide-01

## Features

- **Checklist of all 55 trophies** with official name, description, grade and kind; ticking a trophy saves it in localStorage.
- **Progress bar and per-grade counts** (x/55, % and platinum/gold/silver/bronze counts).
- **Search + filters**: by grade, kind (story, mission, collectible, activity, stunt, combat, exploration, economy, misc), missable only, earned / unearned only.
- **Trophy detail view**: full guide, numbered steps, missable warning, PSN target count where the official list gives one, sources with links, and per-trophy personal notes saved in localStorage.
- **Spoiler mode**: hides the names and descriptions of hidden story trophies until they are earned, with a per-trophy reveal (earn it or turn the mode off).
- **Export / import progress** as JSON (validated on import).
- **Roadmap to the platinum**: six ordered stages — story chapters → named missions → side strands → activities → collectibles & exploration → cleanup & economy — with per-stage earned counts.
- **Missables page**: every flagged trophy and what to do before its story moment passes.
- **Next up planner**: the next 5 unearned trophies in roadmap order.
- **Sunset / night theme toggle** (default dark neon sunset, Vice City look of our own; no Rockstar logo or artwork).
- **Fully offline**: static files under `app/`, no network requests at runtime.

## Honest notes (also shown in the app)

- No trophy is permanently missable if mission replay is available — flags mark trophies tied to a single story moment; replay the mission if you miss it.
- Guides are our own words from the official descriptions; specific locations are best-effort until verified in-game.

## How to run offline

```sh
node serve.ts
# open http://localhost:8080
```

Node 22 or later. No build step, no dependencies.

## Sources

- Exophase — official trophy list (names, descriptions, grades): https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — GTA VI trophy list (PSN progress targets): https://psnprofiles.com/trophies/43531-grand-theft-auto-vi

Each trophy's guide cites its sources in the app and in `app/data/trophies.json`.
Guides are written in our own words; the official names and descriptions are shown
as PlayStation publishes them.

## Hand in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `vendor/makefun-frontend.ts` library.

## Licence

MIT — see `LICENSE`. Copyright (c) 2026 vickyair1.
