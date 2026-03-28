# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser — no build step, no server required. All scripts are loaded via plain `<script src="...">` tags, so the game works from the local filesystem.

## Architecture

All game state lives in the `G` object in `game.js`. The main loop calls `update(dt)` then `draw()` on every `requestAnimationFrame` tick.

**Script load order is load-order-dependent** (defined in `index.html`):
```
sprites.js → particles.js → projectile.js → player.js → enemy.js → levels.js → ui.js → game.js
```
`game.js` is last intentionally: it defines globals (`canvas`, `ctx`, `sfx*`, `triggerScreenShake`) that are called at runtime by the earlier files. Do not reorder these tags.

### Key globals (all defined in `game.js`)

| Symbol | Purpose |
|---|---|
| `G` | Entire mutable game state (state machine, entity arrays, score, level) |
| `keys` / `mouse` | Raw input — polled each frame by `Player.update()` |
| `shake` | Screen shake state, mutated by `triggerScreenShake()` |
| `sfxShoot/sfxHurt/sfxHitEnemy/sfxLevelComplete/sfxGameOver` | Web Audio beeps, called from `player.js` and `enemy.js` |
| `triggerScreenShake(intensity, duration)` | Called from `player.js` and `game.js` collision code |

### State machine (`G.state`)
`menu` → `playing` → `level_complete` → `playing` → … → `game_over`

Transitions happen inside `update()`. The `draw()` function branches on `G.state` to decide what to render.

### Sprite system (`sprites.js`)

Sprites are 2-D arrays of palette indices (`0` = transparent). `drawSprite(ctx, pixels, palette, scale)` draws centered at the canvas origin — callers must `ctx.save() / ctx.translate(x, y) / ctx.rotate(angle)` before calling it. All sprites default to `PIXEL = 3` (each sprite pixel = 3×3 canvas pixels) and are designed **facing right** (angle 0); rotation is applied by the caller.

### Adding a new enemy type
1. Add sprite frames + palette to `SPRITES` in `sprites.js`.
2. Add a `case` in `Enemy` constructor and `Enemy.draw()` in `enemy.js`.
3. Reference the type string in the `types` array of the relevant level in `levels.js`.

### Adding a new level
Add an entry to `LEVEL_DATA` in `levels.js`. Fields: `total` (enemy count), `spawnRate` (seconds between spawns), `types` (weighted array of type strings), `bgColor` / `gridColor` (hex), `name` (display string).

### Audio
All sound is synthesized via Web Audio API in `game.js`. `playTone(freq, dur, type, vol, delay)` is the primitive; `sfx*` helpers wrap it. Audio context is lazily created on first user gesture (browser autoplay policy).

## Git / GitHub

- Remote: `https://github.com/Tony3i3/retro-shooter`
- Branch: `master`
- Commit and push after every meaningful change. Use descriptive commit messages scoped to what changed (e.g. `feat(enemy): add Exploder type`, `fix(player): clamp position to canvas bounds`).
