// ─── RETRO SHOOTER — Main Game ────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── Audio (Web Audio API retro beeps) ────────────────────────────────────────
let _audioCtx = null;
function getAudio() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
}
function playTone(freq, dur, type, vol, delay) {
    try {
        const ac  = getAudio();
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.connect(g);
        g.connect(ac.destination);
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, ac.currentTime + (delay || 0));
        g.gain.setValueAtTime(vol || 0.08, ac.currentTime + (delay || 0));
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (delay || 0) + dur);
        osc.start(ac.currentTime + (delay || 0));
        osc.stop(ac.currentTime + (delay || 0) + dur);
    } catch (e) {}
}
function sfxShoot()   { playTone(1200, 0.04, 'square',   0.06); }
function sfxHitEnemy(){ playTone(380,  0.07, 'square',   0.09); }
function sfxHurt()    { playTone(120,  0.35, 'sawtooth', 0.14); }
function sfxLevelComplete() {
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.18, 'square', 0.10, i * 0.11));
}
function sfxGameOver() {
    [523, 440, 330, 220, 147].forEach((f, i) => playTone(f, 0.25, 'sawtooth', 0.12, i * 0.13));
}
function sfxLevelStart() {
    [440, 523, 659].forEach((f, i) => playTone(f, 0.12, 'square', 0.08, i * 0.09));
}

// ─── Screen Shake ─────────────────────────────────────────────────────────────
const shake = { intensity: 0, timer: 0 };
function triggerScreenShake(intensity, duration) {
    shake.intensity = intensity;
    shake.timer = duration;
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys  = {};
const mouse = { x: 400, y: 300, down: false };

document.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Prevent arrow key scrolling
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();

    if (e.key === 'Enter') {
        if (G.state === 'menu')      startGame();
        if (G.state === 'game_over') startGame();
    }
    if ((e.key === 'p' || e.key === 'P') && G.state === 'playing') G.state = 'paused';
    else if ((e.key === 'p' || e.key === 'P') && G.state === 'paused') G.state = 'playing';
    if ((e.key === 'r' || e.key === 'R') && G.state === 'game_over') startGame();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    mouse.down = true;
    if (G.state === 'menu')      startGame();
    if (G.state === 'game_over') startGame();
});
canvas.addEventListener('mouseup',  e => { if (e.button === 0) mouse.down = false; });
// Prevent right-click menu
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ─── Game State ───────────────────────────────────────────────────────────────
const G = {
    state: 'menu',   // menu | playing | paused | level_complete | game_over
    score: 0,
    highScore: parseInt(localStorage.getItem('retroshooter_hs') || '0'),
    level: 1,

    player: null,
    enemies: [],
    projectiles: [],
    particles: [],

    // Level management
    levelData: null,
    enemiesSpawned: 0,
    enemiesKilled: 0,
    spawnTimer: 0,

    // Level-complete timer
    levelCompleteTimer: 0,
    levelCompleteDuration: 2.8,

    // UI tick (for blinking)
    tick: 0,

    // Background particles (menu)
    bgParticles: [],
};

// ─── Init / Start ─────────────────────────────────────────────────────────────
function startGame() {
    G.score          = 0;
    G.level          = 1;
    G.enemies        = [];
    G.projectiles    = [];
    G.particles      = [];
    G.player         = new Player(400, 300);
    loadLevel(1);
    G.state          = 'playing';
    sfxLevelStart();
}

function loadLevel(num) {
    G.level          = num;
    G.levelData      = getLevelData(num);
    G.enemiesSpawned = 0;
    G.enemiesKilled  = 0;
    G.spawnTimer     = 0;
    G.enemies        = [];
    G.projectiles    = [];
}

// ─── Background drawing ───────────────────────────────────────────────────────
function drawBackground() {
    const ld = G.levelData || { bgColor: '#0a0a0a', gridColor: '#0f1a0f' };
    ctx.fillStyle = ld.bgColor;
    ctx.fillRect(0, 0, 800, 600);

    // Grid
    ctx.strokeStyle = ld.gridColor;
    ctx.lineWidth   = 1;
    const gs = 40;
    for (let x = 0; x <= 800; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
    }
    for (let y = 0; y <= 600; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // Corner dots at grid intersections (retro feel)
    ctx.fillStyle = ld.gridColor;
    for (let x = 0; x <= 800; x += gs) {
        for (let y = 0; y <= 600; y += gs) {
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
    }
}

// ─── Animated menu background ─────────────────────────────────────────────────
function initMenuBg() {
    G.bgParticles = [];
    for (let i = 0; i < 60; i++) {
        G.bgParticles.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            r: 1 + Math.random() * 2,
            c: Math.random() < 0.5 ? '#00ff44' : '#004422',
            alpha: 0.2 + Math.random() * 0.5,
        });
    }
}
function updateMenuBg(dt) {
    for (const p of G.bgParticles) {
        p.x = (p.x + p.vx * dt + 800) % 800;
        p.y = (p.y + p.vy * dt + 600) % 600;
    }
}
function drawMenuBg() {
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, 800, 600);
    // grid
    ctx.strokeStyle = '#0a1a0a';
    ctx.lineWidth = 1;
    const gs = 40;
    for (let x = 0; x <= 800; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke(); }
    for (let y = 0; y <= 600; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke(); }
    // floating dots
    for (const p of G.bgParticles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
}

// ─── Collision: circle vs circle ──────────────────────────────────────────────
function circlesOverlap(ax, ay, ar, bx, by, br) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy < (ar + br) * (ar + br);
}

// ─── Main Update ──────────────────────────────────────────────────────────────
function update(dt) {
    G.tick++;

    if (G.state === 'menu') {
        updateMenuBg(dt);
        return;
    }

    if (G.state === 'paused' || G.state === 'game_over') return;

    // ── Level complete countdown ─────────────────────────────────────────────
    if (G.state === 'level_complete') {
        G.levelCompleteTimer -= dt;
        // Still update/fade particles
        G.particles = G.particles.filter(p => { p.update(dt); return !p.dead; });
        if (G.levelCompleteTimer <= 0) {
            loadLevel(G.level + 1);
            G.state = 'playing';
            sfxLevelStart();
        }
        return;
    }

    // ── Playing ──────────────────────────────────────────────────────────────

    // Spawn enemies
    const ld = G.levelData;
    const remaining = ld.total - G.enemiesSpawned;
    if (remaining > 0) {
        G.spawnTimer -= dt;
        if (G.spawnTimer <= 0) {
            G.enemies.push(spawnEnemy(ld.types));
            G.enemiesSpawned++;
            G.spawnTimer = ld.spawnRate;
            // Slightly vary spawn rate
            G.spawnTimer *= 0.8 + Math.random() * 0.4;
        }
    }

    // Player update
    G.player.update(dt, keys, mouse, G.projectiles, G.particles);

    // Enemies update
    for (const e of G.enemies) e.update(dt, G.player);

    // Projectiles update
    for (const p of G.projectiles) p.update(dt);

    // Particles update
    for (const p of G.particles) p.update(dt);

    // ── Collision: bullet vs enemy ────────────────────────────────────────────
    for (const bullet of G.projectiles) {
        if (bullet.dead) continue;
        for (const enemy of G.enemies) {
            if (enemy.dead) continue;
            if (circlesOverlap(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
                bullet.dead = true;
                spawnHitParticles(bullet.x, bullet.y, '#ffff88', G.particles);
                const killed = enemy.takeDamage(1);
                if (killed) {
                    G.score += enemy.scoreValue * G.level;
                    G.enemiesKilled++;
                    spawnDeathParticles(enemy.x, enemy.y, enemy.type, G.particles);
                    triggerScreenShake(3, 0.12);
                    sfxHitEnemy();
                }
                break;
            }
        }
    }

    // ── Collision: enemy vs player ────────────────────────────────────────────
    if (G.player.alive) {
        for (const enemy of G.enemies) {
            if (enemy.dead) continue;
            if (circlesOverlap(G.player.x, G.player.y, G.player.radius, enemy.x, enemy.y, enemy.radius)) {
                const hit = G.player.takeDamage();
                if (hit) {
                    spawnHitParticles(G.player.x, G.player.y, '#ff4444', G.particles);
                }
            }
        }
    }

    // ── Prune dead entities ───────────────────────────────────────────────────
    G.enemies     = G.enemies.filter(e => !e.dead);
    G.projectiles = G.projectiles.filter(p => !p.dead);
    G.particles   = G.particles.filter(p => !p.dead);

    // ── Screen shake decay ────────────────────────────────────────────────────
    if (shake.timer > 0) shake.timer -= dt;

    // ── Win / Lose conditions ─────────────────────────────────────────────────
    if (!G.player.alive) {
        if (G.score > G.highScore) {
            G.highScore = G.score;
            localStorage.setItem('retroshooter_hs', G.highScore);
        }
        G.state = 'game_over';
        sfxGameOver();
        return;
    }

    const allSpawned = G.enemiesSpawned >= ld.total;
    if (allSpawned && G.enemies.length === 0) {
        G.state = 'level_complete';
        G.levelCompleteTimer = G.levelCompleteDuration;
        sfxLevelComplete();
    }
}

// ─── Main Draw ────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, 800, 600);

    // ── Menu ─────────────────────────────────────────────────────────────────
    if (G.state === 'menu') {
        drawMenuBg();
        drawMenu(ctx, G.highScore, G.tick);
        return;
    }

    // ── Apply screen shake ────────────────────────────────────────────────────
    ctx.save();
    if (shake.timer > 0) {
        const s = shake.intensity * (shake.timer / 0.3);
        ctx.translate(
            (Math.random() - 0.5) * s,
            (Math.random() - 0.5) * s
        );
    }

    // ── Background ────────────────────────────────────────────────────────────
    drawBackground();

    if (G.state === 'playing' || G.state === 'level_complete' || G.state === 'paused') {
        // Draw particles (behind entities)
        for (const p of G.particles) p.draw(ctx);

        // Draw projectiles
        for (const p of G.projectiles) p.draw(ctx);

        // Draw enemies
        for (const e of G.enemies) e.draw(ctx);

        // Draw player
        if (G.player) G.player.draw(ctx);

        // HUD
        const enemiesLeft = (G.levelData.total - G.enemiesKilled);
        drawHUD(ctx, G.player, G.score, G.level, enemiesLeft, G.levelData.total);
    }

    ctx.restore();

    // ── Overlays (not shaken) ─────────────────────────────────────────────────
    if (G.state === 'level_complete') {
        drawLevelComplete(ctx, G.level, G.score, G.levelCompleteTimer, G.levelCompleteDuration);
    }
    if (G.state === 'paused') {
        drawPaused(ctx);
    }
    if (G.state === 'game_over') {
        drawBackground();
        drawGameOver(ctx, G.score, G.highScore, G.tick);
    }
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
let lastTime = 0;
function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
initMenuBg();
requestAnimationFrame(loop);
