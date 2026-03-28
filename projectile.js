// ─── Projectile ───────────────────────────────────────────────────────────────

class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.dead = false;
        this.trail = [];
    }

    update(dt) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < -20 || this.x > 820 || this.y < -20 || this.y > 620) {
            this.dead = true;
        }
    }

    draw(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = (i + 1) / this.trail.length;
            ctx.globalAlpha = t * 0.5;
            ctx.fillStyle = '#ff8800';
            const s = 2 + t * 3;
            ctx.fillRect(this.trail[i].x - s / 2, this.trail[i].y - s / 2, s, s);
        }
        ctx.globalAlpha = 1;

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
        ctx.fillStyle = '#ffff44';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}
