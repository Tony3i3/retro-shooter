// ─── Level Definitions ────────────────────────────────────────────────────────

const LEVEL_DATA = [
    // Level 1 – intro, grunts only, slow spawn
    {
        total: 12,
        spawnRate: 2.8,
        types: ['grunt'],
        bgColor: '#0a1a0a',
        gridColor: '#0f2a0f',
        name: 'THE SWARM BEGINS',
    },
    // Level 2 – runners join
    {
        total: 18,
        spawnRate: 2.2,
        types: ['grunt', 'grunt', 'runner'],
        bgColor: '#0a0a1a',
        gridColor: '#0f0f2a',
        name: 'SPEED DEMONS',
    },
    // Level 3 – tanks arrive
    {
        total: 25,
        spawnRate: 1.9,
        types: ['grunt', 'runner', 'tank'],
        bgColor: '#160a1a',
        gridColor: '#220f2a',
        name: 'HEAVY METAL',
    },
    // Level 4 – pressure mounts
    {
        total: 32,
        spawnRate: 1.5,
        types: ['grunt', 'grunt', 'runner', 'runner', 'tank'],
        bgColor: '#1a0a0a',
        gridColor: '#2a0f0f',
        name: 'OVERWHELMED',
    },
    // Level 5 – chaos
    {
        total: 42,
        spawnRate: 1.1,
        types: ['grunt', 'runner', 'runner', 'tank', 'tank'],
        bgColor: '#1a1200',
        gridColor: '#2a1e00',
        name: 'TOTAL CHAOS',
    },
];

function getLevelData(levelNum) {
    if (levelNum <= LEVEL_DATA.length) {
        return LEVEL_DATA[levelNum - 1];
    }
    // Scale infinitely beyond level 5
    const overshoot = levelNum - LEVEL_DATA.length;
    const base = LEVEL_DATA[LEVEL_DATA.length - 1];
    return {
        total: base.total + overshoot * 10,
        spawnRate: Math.max(0.5, base.spawnRate - overshoot * 0.08),
        types: base.types,
        bgColor: '#0a000a',
        gridColor: '#1a001a',
        name: 'ENDLESS HELL',
    };
}
