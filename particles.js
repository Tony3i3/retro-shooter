// ─── Particle System ──────────────────────────────────────────────────────────

class Particle {
    constructor(x, y, color, speed, size, life) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.4 + Math.random() * 0.6);
        this.vx = Math.cos(angle) * spd;
        this.vy = Math.sin(angle) * spd;
        this.color = color;
        this.life = life || (0.4 + Math.random() * 0.4);
        this.maxLife = this.life;
        this.size = size || (2 + Math.random() * 3);
        this.dead = false;
        this.friction = 0.88;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const t = this.life / this.maxLife;
        ctx.globalAlpha = t;
        ctx.fillStyle = this.color;
        const s = this.size * t;
        ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
        ctx.globalAlpha = 1;
    }
}

function spawnDeathParticles(x, y, type, particles) {
    const palettes = {
        grunt:  ['#44ee55', '#22cc33', '#88ff99', '#ffffff', '#aaffbb'],
        runner: ['#ffdd00', '#ffaa00', '#ffff88', '#ffffff', '#ffcc44'],
        tank:   ['#ff4444', '#cc2222', '#ff8888', '#ffffff', '#ffaa88'],
    };
    const colors = palettes[type] || ['#ffffff'];
    const count = type === 'tank' ? 24 : 14;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 8,
            y + (Math.random() - 0.5) * 8,
            colors[Math.floor(Math.random() * colors.length)],
            type === 'tank' ? 220 : 160,
            type === 'tank' ? 4 + Math.random() * 4 : 2 + Math.random() * 3
        ));
    }
}

function spawnHitParticles(x, y, color, particles) {
    for (let i = 0; i < 5; i++) {
        const p = new Particle(x, y, color || '#ffff88', 80, 2, 0.25);
        particles.push(p);
    }
}

function spawnMuzzleParticles(x, y, angle, particles) {
    for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * 0.6;
        const a = angle + spread;
        const p = new Particle(x, y, '#ffff88', 120, 2, 0.12);
        p.vx = Math.cos(a) * 120;
        p.vy = Math.sin(a) * 120;
        particles.push(p);
    }
}
