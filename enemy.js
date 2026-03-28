// ─── Enemy ────────────────────────────────────────────────────────────────────

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;
        this.angle = 0;

        this.animFrame = 0;
        this.animTimer = 0;
        this.hitFlash = 0;

        // Zigzag state for runner
        this.zigzagTimer = Math.random() * Math.PI * 2;

        switch (type) {
            case 'grunt':
                this.speed = 82;
                this.hp = 1; this.maxHp = 1;
                this.radius = 10;
                this.scoreValue = 10;
                this.animSpeed = 0.14;
                break;
            case 'runner':
                this.speed = 158;
                this.hp = 1; this.maxHp = 1;
                this.radius = 9;
                this.scoreValue = 15;
                this.animSpeed = 0.08;
                break;
            case 'tank':
                this.speed = 46;
                this.hp = 4; this.maxHp = 4;
                this.radius = 15;
                this.scoreValue = 30;
                this.animSpeed = 0.22;
                break;
        }
    }

    update(dt, target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        this.angle = Math.atan2(dy, dx);

        let moveX = (dx / dist) * this.speed * dt;
        let moveY = (dy / dist) * this.speed * dt;

        // Runner: perpendicular zigzag to dodge
        if (this.type === 'runner') {
            this.zigzagTimer += dt * 4.5;
            const zigAmp = 55;
            const perpX = -(dy / dist);
            const perpY = (dx / dist);
            moveX += perpX * Math.sin(this.zigzagTimer) * zigAmp * dt;
            moveY += perpY * Math.sin(this.zigzagTimer) * zigAmp * dt;
        }

        this.x += moveX;
        this.y += moveY;

        // Clamp to canvas
        this.x = Math.max(-30, Math.min(830, this.x));
        this.y = Math.max(-30, Math.min(630, this.y));

        if (this.hitFlash > 0) this.hitFlash -= dt;

        // Animation
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
    }

    takeDamage(amount) {
        this.hp -= (amount || 1);
        this.hitFlash = 0.1;
        if (this.hp <= 0) {
            this.dead = true;
            return true;
        }
        sfxHitEnemy();
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Hit flash: white tint
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(300%)';
        }

        let frames, palette, scale;
        switch (this.type) {
            case 'grunt':  frames = SPRITES.GRUNT_FRAMES;  palette = SPRITES.GRUNT_PALETTE;  scale = PIXEL; break;
            case 'runner': frames = SPRITES.RUNNER_FRAMES; palette = SPRITES.RUNNER_PALETTE; scale = PIXEL; break;
            case 'tank':   frames = SPRITES.TANK_FRAMES;   palette = SPRITES.TANK_PALETTE;   scale = PIXEL; break;
        }

        drawSprite(ctx, frames[this.animFrame % frames.length], palette, scale);

        ctx.filter = 'none';

        // HP bar for tank (drawn in world space, unrotated)
        if (this.type === 'tank' && this.hp < this.maxHp) {
            ctx.rotate(-this.angle); // undo rotation so bar is flat
            const bw = 28, bh = 4;
            const pct = this.hp / this.maxHp;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#330000';
            ctx.fillRect(-bw / 2, -20, bw, bh);
            ctx.fillStyle = pct > 0.5 ? '#ff4444' : '#ff8800';
            ctx.fillRect(-bw / 2, -20, bw * pct, bh);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }
}

// ─── Enemy Spawning ───────────────────────────────────────────────────────────

function spawnEnemy(types) {
    const edge = Math.floor(Math.random() * 4);
    const margin = 35;
    let x, y;
    switch (edge) {
        case 0: x = Math.random() * 800;     y = -margin;       break; // top
        case 1: x = Math.random() * 800;     y = 600 + margin;  break; // bottom
        case 2: x = -margin;                 y = Math.random() * 600; break; // left
        case 3: x = 800 + margin;            y = Math.random() * 600; break; // right
    }
    const type = types[Math.floor(Math.random() * types.length)];
    return new Enemy(x, y, type);
}
