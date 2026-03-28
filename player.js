// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 165;
        this.angle = 0;
        this.radius = 10;

        this.hp = 3;
        this.maxHp = 3;

        this.fireCooldown = 0;
        this.fireRate = 0.18; // seconds between shots

        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 1.0;

        this.animFrame = 0;
        this.animTimer = 0;
        this.animState = 'idle';
        this.moving = false;

        this.shootFlash = 0;
        this.alive = true;
    }

    update(dt, keys, mouse, projectiles, particles) {
        if (!this.alive) return;

        // ── Movement ────────────────────────────────────────────────────────
        let dx = 0, dy = 0;
        if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
        if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += 1;

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
        this.moving = dx !== 0 || dy !== 0;

        this.x = Math.max(this.radius, Math.min(800 - this.radius, this.x + dx * this.speed * dt));
        this.y = Math.max(this.radius, Math.min(600 - this.radius, this.y + dy * this.speed * dt));

        // ── Aim toward mouse ─────────────────────────────────────────────────
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // ── Fire ─────────────────────────────────────────────────────────────
        this.fireCooldown -= dt;
        if (mouse.down && this.fireCooldown <= 0) {
            this._fire(projectiles, particles);
        }

        // ── Invincibility ────────────────────────────────────────────────────
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // ── Shoot flash ──────────────────────────────────────────────────────
        if (this.shootFlash > 0) this.shootFlash -= dt;

        // ── Animation ────────────────────────────────────────────────────────
        this.animTimer += dt;
        if (this.moving) {
            this.animState = 'walk';
            if (this.animTimer >= 0.11) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        } else {
            this.animState = 'idle';
            if (this.animTimer >= 0.55) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }
        }
    }

    _fire(projectiles, particles) {
        this.fireCooldown = this.fireRate;
        this.shootFlash = 0.07;
        const speed = 520;
        const tip = 14;
        const bx = this.x + Math.cos(this.angle) * tip;
        const by = this.y + Math.sin(this.angle) * tip;
        projectiles.push(new Projectile(bx, by, Math.cos(this.angle) * speed, Math.sin(this.angle) * speed));
        spawnMuzzleParticles(bx, by, this.angle, particles);
        sfxShoot();
    }

    takeDamage() {
        if (this.invincible || !this.alive) return false;
        this.hp--;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        sfxHurt();
        triggerScreenShake(8, 0.3);
        if (this.hp <= 0) this.alive = false;
        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Blink when invincible
        if (this.invincible && Math.floor(Date.now() / 80) % 2 === 0) {
            ctx.globalAlpha = 0.25;
        }

        const frames = this.animState === 'walk' ? SPRITES.PLAYER_WALK : SPRITES.PLAYER_IDLE;
        drawSprite(ctx, frames[this.animFrame % frames.length], SPRITES.PLAYER_PALETTE);

        // Muzzle flash
        if (this.shootFlash > 0) {
            ctx.fillStyle = '#ffff88';
            ctx.globalAlpha = this.shootFlash / 0.07;
            ctx.fillRect(12, -3, 6, 6);
            ctx.globalAlpha = 1;
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}
