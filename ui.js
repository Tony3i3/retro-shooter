// ─── UI / HUD Rendering ───────────────────────────────────────────────────────

const FONT_LARGE  = "20px 'Press Start 2P', 'Courier New', monospace";
const FONT_MEDIUM = "13px 'Press Start 2P', 'Courier New', monospace";
const FONT_SMALL  = "9px 'Press Start 2P', 'Courier New', monospace";

// ── HUD drawn during gameplay ─────────────────────────────────────────────────
function drawHUD(ctx, player, score, level, enemiesLeft, totalEnemies) {
    // Health hearts (top-left)
    for (let i = 0; i < player.maxHp; i++) {
        ctx.save();
        ctx.translate(18 + i * 26, 18);
        if (i < player.hp) {
            drawSprite(ctx, SPRITES.HEART, SPRITES.HEART_PALETTE, 3);
        } else {
            drawSprite(ctx, SPRITES.HEART_EMPTY, SPRITES.HEART_EMPTY_PALETTE, 3);
        }
        ctx.restore();
    }

    // Score (top-right)
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#88ff88';
    ctx.fillText('SCORE', 792, 16);
    ctx.font = FONT_MEDIUM;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(score).padStart(6, '0'), 792, 32);

    // Level indicator (top-center)
    ctx.textAlign = 'center';
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#88aaff';
    ctx.fillText('LEVEL ' + level, 400, 16);

    // Wave progress bar (bottom, 400px wide centered)
    const barW = 300;
    const barH = 8;
    const barX = (800 - barW) / 2;
    const barY = 588;
    const killed = totalEnemies - enemiesLeft;
    const pct = totalEnemies > 0 ? killed / totalEnemies : 1;

    ctx.fillStyle = '#111';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(barX, barY, barW * pct, barH);

    ctx.font = FONT_SMALL;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#88ff88';
    ctx.fillText(killed + ' / ' + totalEnemies, 400, barY - 4);

    ctx.textAlign = 'left';
}

// ── Menu Screen ───────────────────────────────────────────────────────────────
function drawMenu(ctx, highScore, tick) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, 800, 600);

    // Scanlines
    for (let y = 0; y < 600; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, y, 800, 2);
    }

    // Title glow
    ctx.shadowColor = '#00ff44';
    ctx.shadowBlur = 24;
    ctx.font = "28px 'Press Start 2P', 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff44';
    ctx.fillText('RETRO SHOOTER', 400, 180);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#448844';
    ctx.fillText('TOP-DOWN PIXEL MAYHEM', 400, 210);

    // Controls info
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('ARROW KEYS / WASD  ─  MOVE', 400, 290);
    ctx.fillText('MOUSE  ─  AIM', 400, 312);
    ctx.fillText('LEFT CLICK (HOLD)  ─  SHOOT', 400, 334);
    ctx.fillText('P  ─  PAUSE', 400, 356);

    // High score
    if (highScore > 0) {
        ctx.font = FONT_SMALL;
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('BEST: ' + String(highScore).padStart(6, '0'), 400, 400);
    }

    // Blinking start prompt
    if (Math.floor(tick / 40) % 2 === 0) {
        ctx.font = FONT_MEDIUM;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS ENTER OR CLICK TO START', 400, 460);
    }

    ctx.textAlign = 'left';
}

// ── Level Complete Banner ─────────────────────────────────────────────────────
function drawLevelComplete(ctx, level, score, timer, duration) {
    const t = 1 - timer / duration; // 0→1 as time passes
    const alpha = Math.min(1, t * 3);

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
    ctx.fillRect(0, 0, 800, 600);

    const y = 260 + (1 - alpha) * -40;

    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.font = FONT_LARGE;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('LEVEL ' + level + ' COMPLETE!', 400, y);
    ctx.shadowBlur = 0;

    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#88ff88';
    ctx.fillText('SCORE: ' + String(score).padStart(6, '0'), 400, y + 34);

    // Progress dots for next level
    const dots = 5;
    const filled = Math.floor((1 - timer / duration) * dots);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('NEXT LEVEL IN...', 400, y + 64);
    for (let i = 0; i < dots; i++) {
        ctx.fillStyle = i < filled ? '#44ff44' : '#333333';
        ctx.fillRect(368 + i * 16, y + 76, 10, 10);
    }

    ctx.textAlign = 'left';
}

// ── Paused Overlay ────────────────────────────────────────────────────────────
function drawPaused(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.font = FONT_LARGE;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED', 400, 300);
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('PRESS P TO CONTINUE', 400, 330);
    ctx.textAlign = 'left';
}

// ── Game Over Screen ──────────────────────────────────────────────────────────
function drawGameOver(ctx, score, highScore, tick) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, 800, 600);

    // Scanlines
    for (let y = 0; y < 600; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, y, 800, 2);
    }

    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 20;
    ctx.font = "28px 'Press Start 2P', 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2222';
    ctx.fillText('GAME OVER', 400, 220);
    ctx.shadowBlur = 0;

    ctx.font = FONT_MEDIUM;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SCORE: ' + String(score).padStart(6, '0'), 400, 290);

    if (score >= highScore) {
        ctx.font = FONT_SMALL;
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.fillText('NEW HIGH SCORE!', 400, 320);
        ctx.shadowBlur = 0;
    } else {
        ctx.font = FONT_SMALL;
        ctx.fillStyle = '#888888';
        ctx.fillText('BEST: ' + String(highScore).padStart(6, '0'), 400, 320);
    }

    if (Math.floor(tick / 40) % 2 === 0) {
        ctx.font = FONT_MEDIUM;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS R OR CLICK TO RETRY', 400, 390);
    }

    ctx.textAlign = 'left';
}
