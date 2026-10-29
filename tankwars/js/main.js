// Game elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const OWNER = { NEUTRAL: 0, PLAYER: 1, ENEMY: 2 };
const BASE_TYPE = { MIXED: 0, TANK: 1, HELICOPTER: 2 };
const COLORS = {
    [OWNER.NEUTRAL]: '#94a3b8',
    [OWNER.PLAYER]: '#2563eb', // bold military blue
    [OWNER.ENEMY]: '#dc2626'   // bold military red
};
const GLOW_COLORS = {
    [OWNER.NEUTRAL]: 'rgba(148, 163, 184, 0.4)',
    [OWNER.PLAYER]: 'rgba(37, 99, 235, 0.6)',
    [OWNER.ENEMY]: 'rgba(220, 38, 38, 0.6)'
};
const OWNER_NAMES = ['Neutral Outpost', 'Allied Force', 'Hostile Force'];
const TYPE_NAMES = ['Mixed Garrison', 'Heavy Tank Depot', 'Tactical Heliport'];

// Game state
let gameState = {
    bases: [],
    roads: [],
    units: [],
    particles: [],
    foliage: [], // programmatically scattered trees, bushes, tents
    selectedBase: null,
    selectedUnits: 0,
    selectingFull: false,
    dispatchMode: 'move', // 'move' or 'frontline'
    currentLevel: 1,
    gameSpeed: 1,
    gameTime: 0,
    wave: 1,
    isRunning: false,
    isPaused: false,
    gameOver: false
};

// Animation state
let flowOffset = 0;
let ringRotation = 0;
let screenShake = 0;

// Seeded random number generator for static foliage placement
let seed = 1;
function randomSeeded() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Fortification specifications
const MAX_FORTIFICATION_LEVEL = 5;
const MIN_FORTIFY_UNITS = 10;

function canFortify(base) {
    if (!base || base.owner !== OWNER.PLAYER) return false;
    const lvl = base.reinforceLevel || 0;
    return lvl < MAX_FORTIFICATION_LEVEL && base.units >= MIN_FORTIFY_UNITS;
}

function canEnemyFortify(base) {
    if (!base || base.owner !== OWNER.ENEMY) return false;
    const lvl = base.reinforceLevel || 0;
    return lvl < MAX_FORTIFICATION_LEVEL && base.units >= MIN_FORTIFY_UNITS;
}

function getFortifyCost(base) {
    return Math.floor(base.units / 2);
}

function fortifyBase(base) {
    if (!canFortify(base)) return false;
    
    const cost = getFortifyCost(base);
    base.units -= cost;
    base.reinforceLevel = (base.reinforceLevel || 0) + 1;
    
    spawnUpgradeParticles(base.x, base.y);
    playUpgradeSound();
    triggerScreenShake(6);
    return true;
}

function fortifyEnemyBase(base) {
    if (!canEnemyFortify(base)) return false;
    
    const cost = getFortifyCost(base);
    base.units -= cost;
    base.reinforceLevel = (base.reinforceLevel || 0) + 1;
    
    spawnUpgradeParticles(base.x, base.y);
    return true;
}

// Backward-compatibility wrapper for any remaining references
function getUpgradeCost(base) {
    if (!base) return 0;
    return getFortifyCost(base);
}

// Web Audio API Synthesizer Sound Engine
let audioCtx = null;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn("Web Audio API not supported", e);
    }
}

function unlockAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Hook audio unlocking to player interaction
window.addEventListener('click', unlockAudio);
window.addEventListener('contextmenu', unlockAudio);

function playSelectSound() {
    if (!audioCtx) return;
    unlockAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch blip
    
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
}

function playAttackSound() {
    if (!audioCtx) return;
    unlockAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle'; // laser sweep
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playUpgradeSound() {
    if (!audioCtx) return;
    unlockAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(700, audioCtx.currentTime + 0.22); // rising synth chord
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
}

function playCombatSound() {
    if (!audioCtx) return;
    unlockAudio();
    
    // Synthesize a noise impact buffer
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.1);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noiseNode.start();
    noiseNode.stop(audioCtx.currentTime + 0.1);
}

function playDenySound() {
    if (!audioCtx) return;
    unlockAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.setValueAtTime(100, audioCtx.currentTime + 0.09);
    
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
}

// Level definitions (x and y as percentage of canvas dimensions)
const LEVELS = {
    1: {
        name: 'Tutorial Valley',
        bases: [
            { x: 0.15, y: 0.5, captureCost: 5, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 5 },
            { x: 0.35, y: 0.3, captureCost: 8, unitCap: 12, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 4 },
            { x: 0.35, y: 0.7, captureCost: 6, unitCap: 8, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 3 },
            { x: 0.55, y: 0.5, captureCost: 10, unitCap: 15, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 5 },
            { x: 0.75, y: 0.3, captureCost: 8, unitCap: 12, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 4 },
            { x: 0.85, y: 0.5, captureCost: 5, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 5 }
        ],
        roads: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]],
        river: [
            { x: 0.46, y: 0.0 },
            { x: 0.44, y: 0.35 },
            { x: 0.47, y: 0.65 },
            { x: 0.45, y: 1.0 }
        ]
    },
    2: {
        name: 'Iron Ridge',
        bases: [
            { x: 0.1, y: 0.5, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 5 },
            { x: 0.25, y: 0.25, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.PLAYER, units: 4 },
            { x: 0.25, y: 0.75, captureCost: 10, unitCap: 15, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.45, y: 0.5, captureCost: 12, unitCap: 18, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 8 },
            { x: 0.55, y: 0.3, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 4 }, 
            { x: 0.55, y: 0.7, captureCost: 8, unitCap: 12, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 5 },
            { x: 0.75, y: 0.5, captureCost: 10, unitCap: 15, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.ENEMY, units: 6 },
            { x: 0.9, y: 0.5, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 5 }
        ],
        roads: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [6, 7]],
        river: [
            { x: 0.66, y: 0.0 },
            { x: 0.64, y: 0.3 },
            { x: 0.68, y: 0.7 },
            { x: 0.65, y: 1.0 }
        ]
    },
    3: {
        name: "Eagle's Nest",
        bases: [
            { x: 0.1, y: 0.5, captureCost: 5, unitCap: 8, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 4 },
            { x: 0.2, y: 0.3, captureCost: 8, unitCap: 12, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 5 },
            { x: 0.2, y: 0.7, captureCost: 8, unitCap: 12, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 5 },
            { x: 0.35, y: 0.15, captureCost: 15, unitCap: 20, type: BASE_TYPE.TANK, armored: true, owner: OWNER.NEUTRAL, units: 10 }, 
            { x: 0.35, y: 0.5, captureCost: 12, unitCap: 18, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 8 },
            { x: 0.35, y: 0.85, captureCost: 15, unitCap: 20, type: BASE_TYPE.TANK, armored: true, owner: OWNER.NEUTRAL, units: 12 },
            { x: 0.55, y: 0.3, captureCost: 10, unitCap: 15, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.55, y: 0.7, captureCost: 10, unitCap: 15, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.7, y: 0.5, captureCost: 12, unitCap: 18, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.ENEMY, units: 8 },
            { x: 0.85, y: 0.25, captureCost: 8, unitCap: 12, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 5 },
            { x: 0.9, y: 0.6, captureCost: 5, unitCap: 8, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 4 }
        ],
        roads: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8], [8, 9], [8, 10], [9, 10]],
        river: [
            { x: 0.46, y: 0.0 },
            { x: 0.44, y: 0.3 },
            { x: 0.48, y: 0.7 },
            { x: 0.45, y: 1.0 }
        ]
    },
    4: {
        name: 'River Delta Chokepoint',
        bases: [
            { x: 0.12, y: 0.3, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 5 },
            { x: 0.12, y: 0.7, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.PLAYER, units: 5 },
            { x: 0.3, y: 0.15, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 4 },
            { x: 0.3, y: 0.85, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 4 },
            { x: 0.5, y: 0.5, captureCost: 15, unitCap: 20, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.NEUTRAL, units: 8 },
            { x: 0.5, y: 0.15, captureCost: 10, unitCap: 15, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.7, y: 0.3, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 4 },
            { x: 0.7, y: 0.7, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 4 },
            { x: 0.88, y: 0.3, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 5 },
            { x: 0.88, y: 0.7, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 5 }
        ],
        roads: [[0, 2], [1, 3], [2, 4], [3, 4], [2, 5], [5, 6], [4, 6], [4, 7], [6, 8], [7, 9], [8, 9]],
        river: [
            { x: 0.4, y: 0.0 },
            { x: 0.38, y: 0.3 },
            { x: 0.42, y: 0.7 },
            { x: 0.4, y: 1.0 }
        ]
    },
    5: {
        name: 'Air Assault',
        bases: [
            { x: 0.15, y: 0.5, captureCost: 6, unitCap: 10, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.PLAYER, units: 6 },
            { x: 0.25, y: 0.2, captureCost: 8, unitCap: 12, type: BASE_TYPE.TANK, armored: false, owner: OWNER.PLAYER, units: 4 },
            { x: 0.4, y: 0.5, captureCost: 10, unitCap: 15, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.NEUTRAL, units: 5 },
            { x: 0.5, y: 0.15, captureCost: 12, unitCap: 15, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.NEUTRAL, units: 4 },
            { x: 0.5, y: 0.85, captureCost: 12, unitCap: 15, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 5 },
            { x: 0.75, y: 0.8, captureCost: 8, unitCap: 12, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.ENEMY, units: 4 },
            { x: 0.85, y: 0.5, captureCost: 6, unitCap: 10, type: BASE_TYPE.MIXED, armored: false, owner: OWNER.ENEMY, units: 5 }
        ],
        roads: [[0, 1], [1, 2], [0, 2], [2, 3], [2, 4], [3, 6], [4, 6], [5, 6]],
        river: [
            { x: 0.35, y: 0.0 },
            { x: 0.32, y: 0.4 },
            { x: 0.37, y: 0.75 },
            { x: 0.35, y: 1.0 }
        ]
    },
    6: {
        name: 'Global Escalation',
        bases: [
            { x: 0.1, y: 0.3, captureCost: 5, unitCap: 10, type: BASE_TYPE.TANK, armored: false, owner: OWNER.PLAYER, units: 6 },
            { x: 0.1, y: 0.7, captureCost: 5, unitCap: 10, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.PLAYER, units: 6 },
            { x: 0.25, y: 0.5, captureCost: 10, unitCap: 12, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.PLAYER, units: 5 },
            { x: 0.4, y: 0.2, captureCost: 12, unitCap: 15, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.4, y: 0.8, captureCost: 12, unitCap: 15, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.55, y: 0.5, captureCost: 18, unitCap: 20, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.NEUTRAL, units: 10 },
            { x: 0.7, y: 0.2, captureCost: 12, unitCap: 15, type: BASE_TYPE.TANK, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.7, y: 0.8, captureCost: 12, unitCap: 15, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.NEUTRAL, units: 6 },
            { x: 0.85, y: 0.5, captureCost: 10, unitCap: 12, type: BASE_TYPE.MIXED, armored: true, owner: OWNER.ENEMY, units: 5 },
            { x: 0.9, y: 0.3, captureCost: 5, unitCap: 10, type: BASE_TYPE.HELICOPTER, armored: false, owner: OWNER.ENEMY, units: 6 },
            { x: 0.9, y: 0.7, captureCost: 5, unitCap: 10, type: BASE_TYPE.TANK, armored: false, owner: OWNER.ENEMY, units: 6 }
        ],
        roads: [[0, 2], [1, 2], [0, 3], [1, 4], [2, 5], [3, 5], [4, 5], [5, 6], [5, 7], [6, 8], [7, 8], [8, 9], [8, 10]],
        river: [
            { x: 0.48, y: 0.0 },
            { x: 0.46, y: 0.35 },
            { x: 0.52, y: 0.65 },
            { x: 0.5, y: 1.0 }
        ]
    }
};

// Resize canvas container
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
}

// Distance from point to line segment (helper for foliage positioning)
function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.sqrt((p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return Math.sqrt((p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY));
}

// Calculate intersection between two lines (helper for bridge positioning)
function getLineIntersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    const s1_x = p1_x - p0_x;
    const s1_y = p1_y - p0_y;
    const s2_x = p3_x - p2_x;
    const s2_y = p3_y - p2_y;
    
    const d = -s2_x * s1_y + s1_x * s2_y;
    if (Math.abs(d) < 0.0001) return null; // Parallel lines
    
    const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / d;
    const t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / d;
    
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        return {
            x: p0_x + (t * s1_x),
            y: p0_y + (t * s1_y)
        };
    }
    return null;
}

// Initialize dynamic decoration foliage and structures
function initFoliageAndStructures() {
    seed = gameState.currentLevel * 250; // Set base seed for deterministic output
    gameState.foliage = [];
    
    const foliageCount = 65;
    let attempts = 0;
    
    while (gameState.foliage.length < foliageCount && attempts < 800) {
        attempts++;
        const fx = randomSeeded() * canvas.width;
        const fy = randomSeeded() * canvas.height;
        
        // Border padding to avoid edges
        if (fx < 30 || fx > canvas.width - 30 || fy < 30 || fy > canvas.height - 30) continue;
        
        // Ensure it doesn't overlap any bases
        let tooCloseToBase = false;
        for (const base of gameState.bases) {
            const radius = base.radius + (base.reinforceLevel || 0) * 4;
            const dx = fx - base.x;
            const dy = fy - base.y;
            if (Math.sqrt(dx * dx + dy * dy) < radius + 40) {
                tooCloseToBase = true;
                break;
            }
        }
        if (tooCloseToBase) continue;
        
        // Ensure it doesn't overlap any roads
        let tooCloseToRoad = false;
        for (const road of gameState.roads) {
            const from = gameState.bases[road.from];
            const to = gameState.bases[road.to];
            const dist = distToSegment({ x: fx, y: fy }, from, to);
            if (dist < 32) {
                tooCloseToRoad = true;
                break;
            }
        }
        if (tooCloseToRoad) continue;
        
        // Ensure it doesn't overlap the river
        const level = LEVELS[gameState.currentLevel];
        let tooCloseToRiver = false;
        if (level.river) {
            for (let i = 0; i < level.river.length - 1; i++) {
                const r0 = { x: level.river[i].x * canvas.width, y: level.river[i].y * canvas.height };
                const r1 = { x: level.river[i+1].x * canvas.width, y: level.river[i+1].y * canvas.height };
                const dist = distToSegment({ x: fx, y: fy }, r0, r1);
                if (dist < 28) {
                    tooCloseToRiver = true;
                    break;
                }
            }
        }
        if (tooCloseToRiver) continue;
        
        // Determine what element to place
        const r = randomSeeded();
        let type, size, color;
        if (r < 0.65) {
            type = 'tree'; // Palm tree/tropical tree
            size = randomSeeded() * 8 + 12;
            color = randomSeeded() < 0.5 ? '#1b4318' : '#2b5e28'; // Jungle green tones
        } else if (r < 0.88) {
            type = 'bush';
            size = randomSeeded() * 3 + 5;
            color = '#386f34';
        } else {
            type = 'structure'; // Canvas barracks tent
            size = randomSeeded() * 3 + 8;
        }
        
        gameState.foliage.push({
            x: fx,
            y: fy,
            type: type,
            size: size,
            color: color,
            rotation: randomSeeded() * Math.PI * 2
        });
    }
}

// Particle System
function spawnCombatParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3.5 + 1.2,
            color: color,
            alpha: 1.0,
            decay: Math.random() * 0.04 + 0.02
        });
    }
}

// Golden reinforcement upgrade particles
function spawnUpgradeParticles(x, y) {
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.2;
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 4 + 1.5,
            color: '#fbbf24', // golden yellow glow
            alpha: 1.0,
            decay: Math.random() * 0.035 + 0.015
        });
    }
}

function updateParticles(dt) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx * gameState.gameSpeed * dt * 60;
        p.y += p.vy * gameState.gameSpeed * dt * 60;
        p.alpha -= p.decay * gameState.gameSpeed;
        if (p.alpha <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    gameState.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function triggerScreenShake(amount) {
    screenShake = amount;
}

// Initialize level
function initLevel(levelNum) {
    const level = LEVELS[levelNum];
    
    // Scale temporary sizes to fit window
    gameState.bases = level.bases.map((b, i) => ({
        id: i,
        x: b.x * canvas.width,
        y: b.y * canvas.height,
        captureCost: b.captureCost,
        unitCap: Infinity,
        type: b.type,
        armored: b.armored,
        owner: b.owner,
        units: b.units,
        radius: 34,
        reinforceLevel: 0, // Initialized to 0
        frontlineTarget: null, // ID of base to continuously auto-send troops to
        frontlineTimer: 0,
        generatingUnits: false,
        genTimer: 0
    }));
    
    gameState.roads = level.roads.map(([a, b]) => ({
        from: a,
        to: b
    }));
    
    // Procedural terrain layout positioning
    initFoliageAndStructures();
    
    gameState.units = [];
    gameState.particles = [];
    gameState.selectedBase = null;
    gameState.selectedUnits = 0;
    gameState.selectingFull = false;
    gameState.dispatchMode = 'move';
    gameState.gameTime = 0;
    gameState.wave = 1;
    gameState.isRunning = false;
    gameState.gameOver = false;
    gameState.currentLevel = levelNum;
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.textContent = 'START WAVE';
        startBtn.classList.remove('active');
    }
    
    const moveBtn = document.getElementById('modeMoveBtn');
    const frontlineBtn = document.getElementById('modeFrontlineBtn');
    if (moveBtn) moveBtn.classList.add('active');
    if (frontlineBtn) frontlineBtn.classList.remove('active');
    
    updateUI();
}

// Find shortest path between bases using BFS (intermediate bases must be owned by sender)
function findPath(fromId, toId, senderOwner) {
    if (fromId === toId) return [fromId];
    
    const visited = new Set();
    const queue = [[fromId]];
    visited.add(fromId);
    
    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];
        
        for (const road of gameState.roads) {
            let neighbor = null;
            if (road.from === current) neighbor = road.to;
            else if (road.to === current) neighbor = road.from;
            
            if (neighbor !== null && !visited.has(neighbor)) {
                const newPath = [...path, neighbor];
                if (neighbor === toId) {
                    return newPath;
                }
                
                const intermediateBase = gameState.bases[neighbor];
                if (intermediateBase && intermediateBase.owner === senderOwner) {
                    visited.add(neighbor);
                    queue.push(newPath);
                }
            }
        }
    }
    
    return null;
}

// Get all bases currently reachable from fromBase (helicopter direct or tanks through owned road chains)
function getReachableBases(fromBase) {
    if (!fromBase) return new Set();
    const reachable = new Set();
    const isHeli = fromBase.type === BASE_TYPE.HELICOPTER;
    
    gameState.bases.forEach(base => {
        if (base.id === fromBase.id) return;
        if (isHeli || (fromBase.type === BASE_TYPE.MIXED && base.type === BASE_TYPE.HELICOPTER)) {
            reachable.add(base.id);
        } else if (findPath(fromBase.id, base.id, fromBase.owner) !== null) {
            reachable.add(base.id);
        }
    });
    return reachable;
}

// Calculate attack multiplier based on spec & upgrades
function getAttackMultiplier(attackerType, defenderBase) {
    let mult = 1;
    
    if (defenderBase.armored) mult *= 2;
    if (attackerType === BASE_TYPE.HELICOPTER && defenderBase.type === BASE_TYPE.TANK) mult *= 2;
    
    return mult;
}

// Combat resolution formula
function resolveCombat(attackers, defenders, multiplier) {
    // If defenders is 0, default base defense is 0.5 (takes at least 1 unit to capture at multiplier = 1, more if upgraded)
    const baseDef = defenders === 0 ? 0.5 : defenders;
    const effectiveDefenders = baseDef * multiplier;
    
    if (attackers > effectiveDefenders) {
        // Attackers win and capture the base
        return { victory: true, remaining: Math.max(Math.floor(attackers - effectiveDefenders), 1) };
    }
    // Attackers lose. Scale the remaining defenders back down.
    const remainingDefenders = Math.ceil((effectiveDefenders - attackers) / multiplier);
    return { victory: false, remaining: remainingDefenders };
}

// Send units
function sendUnits(fromBase, toBase, numUnits) {
    if (numUnits <= 0) return;
    fromBase.units -= numUnits;
    
    const isHelicopter = fromBase.type === BASE_TYPE.HELICOPTER || 
                         (fromBase.type === BASE_TYPE.MIXED && toBase.type === BASE_TYPE.HELICOPTER);
    
    const path = isHelicopter ? null : findPath(fromBase.id, toBase.id, fromBase.owner);
    
    // If not a helicopter and no path exists, refund units and abort
    if (!isHelicopter && !path) {
        fromBase.units += numUnits;
        return;
    }
    
    let speed = isHelicopter ? 2.6 : 1.6;
    // Level 1 ease: reduce enemy speed by 50%
    if (fromBase.owner === OWNER.ENEMY && gameState.currentLevel === 1) {
        speed *= 0.5;
    }
    
    const unit = {
        from: fromBase.id,
        to: toBase.id,
        units: numUnits,
        owner: fromBase.owner,
        isHelicopter: isHelicopter,
        path: path,
        pathIndex: 0,
        x: fromBase.x,
        y: fromBase.y,
        targetX: toBase.x,
        targetY: toBase.y,
        speed: speed,
        arrived: false
    };
    
    gameState.units.push(unit);
    playAttackSound(); // Trigger synthesized send/attack sound
}

// Update moving units
function updateUnits(dt) {
    for (let i = gameState.units.length - 1; i >= 0; i--) {
        const unit = gameState.units[i];
        const target = gameState.bases[unit.to];
        
        let targetX, targetY;
        if (unit.isHelicopter) {
            targetX = target.x;
            targetY = target.y;
        } else {
            if (unit.pathIndex < unit.path.length - 1) {
                const nextId = unit.path[unit.pathIndex + 1];
                const next = gameState.bases[nextId];
                targetX = next.x;
                targetY = next.y;
            } else {
                targetX = target.x;
                targetY = target.y;
            }
        }
        
        const dx = targetX - unit.x;
        const dy = targetY - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = unit.speed * gameState.gameSpeed * dt * 60;
        
        if (dist < Math.max(speed, 6)) {
            if (!unit.isHelicopter && unit.pathIndex < unit.path.length - 1) {
                unit.pathIndex++;
                unit.x = gameState.bases[unit.path[unit.pathIndex]].x;
                unit.y = gameState.bases[unit.path[unit.pathIndex]].y;
            } else {
                unit.arrived = true;
                
                // Spawn particles at clashing point
                spawnCombatParticles(target.x, target.y, COLORS[unit.owner]);
                playCombatSound(); // Trigger synthesized base attack sound on clash
                
                if (target.owner === unit.owner) {
                    // Reinforce friendly base (no troop limit)
                    target.units += unit.units;
                } else {
                    // Attack hostile base
                    const multiplier = getAttackMultiplier(
                        unit.isHelicopter ? BASE_TYPE.HELICOPTER : BASE_TYPE.TANK,
                        target
                    ) * (1 + (target.reinforceLevel || 0)); // Reinforcement scales defense
                    
                    const result = resolveCombat(unit.units, target.units, multiplier);
                    
                    if (result.victory) {
                        target.owner = unit.owner;
                        target.units = result.remaining;
                        target.captureCost = Math.ceil(target.captureCost * 0.7);
                        target.reinforceLevel = 0; // Capture resets upgrades!
                        target.frontlineTarget = null; // Capture resets outgoing frontline!
                        // Sever any incoming frontline routes if captured by non-player
                        if (target.owner !== OWNER.PLAYER) {
                            gameState.bases.forEach(b => {
                                if (b.frontlineTarget === target.id) {
                                    b.frontlineTarget = null;
                                }
                            });
                        }
                        triggerScreenShake(12);
                    } else {
                        target.units = result.remaining;
                        triggerScreenShake(4);
                    }
                }
                
                gameState.units.splice(i, 1);
            }
        } else {
            unit.x += (dx / dist) * speed;
            unit.y += (dy / dist) * speed;
        }
    }
}

// Generate units for owned bases (unlimited troop production)
function generateUnits(dt) {
    gameState.bases.forEach(base => {
        if (base.owner !== OWNER.NEUTRAL) {
            base.genTimer += dt * gameState.gameSpeed;
            if (base.genTimer >= 2) {
                base.genTimer = 0;
                base.units++;
            }
        }
    });
}

// Automatically and continuously stream troops along active frontline routes whenever base.units >= 2
function updateFrontlines(dt) {
    gameState.bases.forEach(base => {
        if (base.owner === OWNER.PLAYER && base.frontlineTarget !== null) {
            const target = gameState.bases[base.frontlineTarget];
            if (!target || target.owner !== OWNER.PLAYER) {
                base.frontlineTarget = null;
                return;
            }
            
            // Check reachability
            const isHeli = base.type === BASE_TYPE.HELICOPTER || 
                           (base.type === BASE_TYPE.MIXED && target.type === BASE_TYPE.HELICOPTER);
            const path = isHeli ? null : findPath(base.id, target.id, base.owner);
            
            if (!isHeli && !path) {
                // Route blocked (e.g. intermediate base lost)
                return;
            }
            
            base.frontlineTimer = (base.frontlineTimer || 0) + dt * gameState.gameSpeed;
            
            // Whenever base has at least 2 troops and cadence interval (0.35s) met:
            if (base.units >= 2 && base.frontlineTimer >= 0.35) {
                base.frontlineTimer = 0;
                sendUnits(base, target, 2);
            }
        }
    });
}

// Enemy AI Decision Making & Upgrades
function enemyAI() {
    const enemyBases = gameState.bases.filter(b => b.owner === OWNER.ENEMY && b.units >= 3);
    const targets = gameState.bases.filter(b => b.owner !== OWNER.ENEMY);
    
    if (enemyBases.length === 0 || targets.length === 0) return;
    
    // Enemy Upgrades (Only from Level 2 onwards, strictly limited to 5 upgrades)
    if (gameState.currentLevel > 1) {
        for (const base of enemyBases) {
            if (canEnemyFortify(base) && Math.random() < 0.22) {
                fortifyEnemyBase(base);
                continue; // Skip attack decision for this base this wave
            }
        }
    }
    
    let bestAttack = null;
    let bestScore = -Infinity;
    
    enemyBases.forEach(base => {
        targets.forEach(target => {
            // Decide reasonable forces to send (40% - 80% of units)
            const unitsToSend = Math.floor(base.units * (0.4 + Math.random() * 0.4));
            if (unitsToSend < 2) return;
            
            // Check if attack goes by helicopter or tank
            const isHelicopter = base.type === BASE_TYPE.HELICOPTER || 
                                 (base.type === BASE_TYPE.MIXED && target.type === BASE_TYPE.HELICOPTER);
            
            const attackerType = isHelicopter ? BASE_TYPE.HELICOPTER : BASE_TYPE.TANK;
            const multiplier = getAttackMultiplier(attackerType, target) * (1 + (target.reinforceLevel || 0));
            const effectiveDefenders = target.units * multiplier;
            
            // Avoid suicide attacks
            if (unitsToSend <= effectiveDefenders * 0.8) return;
            
            // Check if target is reachable
            const canReach = () => {
                if (isHelicopter) return true;
                return findPath(base.id, target.id, OWNER.ENEMY) !== null;
            };
            
            if (!canReach()) return;
            
            // Calculate heuristic score for the attack
            const score = (target.captureCost * 2.5) - (unitsToSend * 0.4) - (effectiveDefenders * 0.5) + (target.owner === OWNER.PLAYER ? 5 : 0);
            
            if (score > bestScore) {
                bestScore = score;
                bestAttack = { from: base, to: target, units: unitsToSend };
            }
        });
    });
    
    if (bestAttack && bestScore > -10) {
        sendUnits(bestAttack.from, bestAttack.to, bestAttack.units);
    }
}

let aiTimer = 0;

// Check win/lose conditions
function checkGameOver() {
    const playerBases = gameState.bases.filter(b => b.owner === OWNER.PLAYER);
    const enemyBases = gameState.bases.filter(b => b.owner === OWNER.ENEMY);
    
    if (enemyBases.length === 0) {
        gameState.gameOver = true;
        showMessage('VICTORY', 'All enemy bases captured!', 'victory');
    } else if (playerBases.length === 0) {
        gameState.gameOver = true;
        showMessage('DEFEAT', 'All your bases have been lost!', 'defeat');
    }
}

// Show message overlay
function showMessage(title, text, type) {
    const overlay = document.getElementById('message-overlay');
    if (overlay) {
        document.getElementById('message-title').textContent = title;
        document.getElementById('message-text').textContent = text;
        overlay.className = 'visible ' + type;
    }
}

// Hide message overlay
function hideMessage() {
    const overlay = document.getElementById('message-overlay');
    if (overlay) overlay.className = '';
}

// Winding River Drawing Engine
function drawRiver(riverPoints) {
    if (!riverPoints || riverPoints.length === 0) return;
    
    // Draw river shore border (muddy brown outline)
    ctx.strokeStyle = '#8a5c38';
    ctx.lineWidth = 32;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(riverPoints[0].x * canvas.width, riverPoints[0].y * canvas.height);
    for (let i = 1; i < riverPoints.length; i++) {
        ctx.lineTo(riverPoints[i].x * canvas.width, riverPoints[i].y * canvas.height);
    }
    ctx.stroke();
    
    // Draw water bodies
    ctx.strokeStyle = '#2d7ca3';
    ctx.lineWidth = 24;
    
    ctx.beginPath();
    ctx.moveTo(riverPoints[0].x * canvas.width, riverPoints[0].y * canvas.height);
    for (let i = 1; i < riverPoints.length; i++) {
        ctx.lineTo(riverPoints[i].x * canvas.width, riverPoints[i].y * canvas.height);
    }
    ctx.stroke();
    
    // Draw inner stream highlight
    ctx.strokeStyle = '#41a8d4';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(riverPoints[0].x * canvas.width, riverPoints[0].y * canvas.height);
    for (let i = 1; i < riverPoints.length; i++) {
        ctx.lineTo(riverPoints[i].x * canvas.width, riverPoints[i].y * canvas.height);
    }
    ctx.stroke();
}

// Automatic bridge builder at road-river intersections
function drawBridges() {
    const level = LEVELS[gameState.currentLevel];
    if (!level.river) return;
    
    gameState.roads.forEach(road => {
        const from = gameState.bases[road.from];
        const to = gameState.bases[road.to];
        
        // Loop through each river segment to find collision intersections
        for (let i = 0; i < level.river.length - 1; i++) {
            const r0_x = level.river[i].x * canvas.width;
            const r0_y = level.river[i].y * canvas.height;
            const r1_x = level.river[i + 1].x * canvas.width;
            const r1_y = level.river[i + 1].y * canvas.height;
            
            const intersection = getLineIntersection(
                from.x, from.y, to.x, to.y,
                r0_x, r0_y, r1_x, r1_y
            );
            
            if (intersection) {
                // Draw bridge at intersection
                ctx.save();
                ctx.translate(intersection.x, intersection.y);
                
                // Rotate bridge to match the road's angle
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                ctx.rotate(angle);
                
                // Draw bridge structure (stone/wood planks)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // shadow
                ctx.fillRect(-22, -18, 44, 36);
                
                ctx.fillStyle = '#5c3a21'; // dark support beam
                ctx.fillRect(-20, -14, 40, 28);
                
                ctx.fillStyle = '#a67246'; // warm wood planks
                ctx.fillRect(-18, -11, 36, 22);
                
                // Plank details
                ctx.strokeStyle = '#4a2c16';
                ctx.lineWidth = 1.5;
                for (let px = -14; px <= 14; px += 7) {
                    ctx.beginPath();
                    ctx.moveTo(px, -11);
                    ctx.lineTo(px, 11);
                    ctx.stroke();
                }
                
                // Concrete/metal handrails
                ctx.fillStyle = '#64748b';
                ctx.fillRect(-20, -14, 40, 3);
                ctx.fillRect(-20, 11, 40, 3);
                
                ctx.restore();
                break; // One bridge per road-river intersection is enough
            }
        }
    });
}

// Procedural Background Renderer
function drawBackground() {
    // Military green terrain
    ctx.fillStyle = '#3f6838'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render static grass blades/speckles for background texture
    ctx.fillStyle = '#365b2f'; 
    const speckleCount = Math.floor((canvas.width * canvas.height) / 1500);
    let speckleSeed = 500;
    
    for (let i = 0; i < speckleCount; i++) {
        const x = (Math.sin(speckleSeed++) * 10000 % 1 + 1) % 1 * canvas.width;
        const y = (Math.sin(speckleSeed++) * 10000 % 1 + 1) % 1 * canvas.height;
        const w = (Math.sin(speckleSeed++) * 10000 % 1 + 1) % 1 * 5 + 2;
        const h = (Math.sin(speckleSeed++) * 10000 % 1 + 1) % 1 * 2 + 1;
        ctx.fillRect(x, y, w, h);
    }
    
    // Winding River segment
    const level = LEVELS[gameState.currentLevel];
    if (level.river) {
        drawRiver(level.river);
    }
}

// Winding Dirt Roads
function drawRoads() {
    // Underlayer rough sand path
    ctx.strokeStyle = '#936a43';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    gameState.roads.forEach(road => {
        const from = gameState.bases[road.from];
        const to = gameState.bases[road.to];
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    });
    
    // Core light sand path
    ctx.strokeStyle = '#baa07e';
    ctx.lineWidth = 6;
    
    gameState.roads.forEach(road => {
        const from = gameState.bases[road.from];
        const to = gameState.bases[road.to];
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    });
    
    // Draw animated tire tracks / logistics flow lines (subtle dashed line)
    ctx.strokeStyle = 'rgba(78, 50, 24, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 10]);
    ctx.lineDashOffset = -flowOffset;
    
    gameState.roads.forEach(road => {
        const from = gameState.bases[road.from];
        const to = gameState.bases[road.to];
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    });
    
    ctx.setLineDash([]);
}

// Foliage & Tent Structures Renderer
function drawFoliage() {
    gameState.foliage.forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        
        if (f.type === 'tree') {
            // Draw Palm Tree
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(3, 4, f.size * 0.65, f.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Curved trunk
            ctx.strokeStyle = '#5a3d28';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(f.size * 0.15, f.size * 0.15, f.size * 0.25, f.size * 0.4);
            ctx.stroke();
            
            // Palms
            ctx.fillStyle = f.color;
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.ellipse(f.size * 0.48, 0, f.size * 0.48, f.size * 0.14, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (f.type === 'bush') {
            // Textured bush cluster
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(0, 0, f.size, 0, Math.PI * 2);
            ctx.arc(f.size * 0.5, f.size * 0.25, f.size * 0.8, 0, Math.PI * 2);
            ctx.arc(-f.size * 0.4, -f.size * 0.15, f.size * 0.75, 0, Math.PI * 2);
            ctx.fill();
        } else if (f.type === 'structure') {
            // Small military barracks tent
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(2, 2, f.size * 1.5, f.size);
            
            // Tent body (Olive green)
            ctx.fillStyle = '#5c644d'; 
            ctx.fillRect(-f.size * 0.75, -f.size * 0.5, f.size * 1.5, f.size);
            
            // Tent roof ridge
            ctx.strokeStyle = '#3d4432';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-f.size * 0.75, 0);
            ctx.lineTo(f.size * 0.75, 0);
            ctx.stroke();
            
            // Front triangular flap
            ctx.fillStyle = '#2c3222';
            ctx.beginPath();
            ctx.moveTo(-f.size * 0.75, -f.size * 0.5);
            ctx.lineTo(-f.size * 0.75, f.size * 0.5);
            ctx.lineTo(-f.size * 0.35, 0);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    });
}

// Vector Waving Flags
function drawFlag(cx, cy, owner) {
    ctx.save();
    ctx.translate(cx, cy);
    
    // Pole
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -26);
    ctx.stroke();
    
    // Flag banner
    const wave = Math.sin((Date.now() / 110)) * 2.8;
    ctx.fillStyle = COLORS[owner];
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(8, -26 + wave, 16, -26);
    ctx.lineTo(16, -16);
    ctx.quadraticCurveTo(8, -16 + wave, 0, -16);
    ctx.closePath();
    ctx.fill();
    
    // Emblem stripe
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, -23 + wave * 0.5);
    ctx.lineTo(4, -19 + wave * 0.5);
    ctx.stroke();
    
    ctx.restore();
}

// Vector Heavy Tank Drawing
function drawTankIcon(cx, cy, color, size) {
    ctx.save();
    ctx.translate(cx, cy);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-size + 2, -size * 0.6 + 2, size * 2, size * 1.2);
    
    // Treads
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-size - 1, -size * 0.65, size * 2 + 2, size * 0.22);
    ctx.fillRect(-size - 1, size * 0.43, size * 2 + 2, size * 0.22);
    
    // Tank body
    ctx.fillStyle = color;
    ctx.fillRect(-size, -size * 0.5, size * 2, size);
    
    // Armor panels outline
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size, -size * 0.5, size * 2, size);
    
    // Turret
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size * 0.1, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Cannon barrel
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, 0);
    ctx.lineTo(size * 1.25, 0);
    ctx.stroke();
    
    // Tip flash
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size * 1.2, -1, 1.5, 2);
    
    ctx.restore();
}

// Vector Helicopter Drawing
function drawHeliIcon(cx, cy, color, size, time) {
    ctx.save();
    ctx.translate(cx, cy);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(3, 9, size * 0.95, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    
    // Main body fuselage
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Cockpit windshield
    ctx.fillStyle = '#06b6d4'; // Cyan
    ctx.beginPath();
    ctx.ellipse(size * 0.5, 0, size * 0.35, size * 0.18, 0, -Math.PI/2, Math.PI/2);
    ctx.fill();
    
    // Tail boom
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0);
    ctx.lineTo(-size * 1.55, -size * 0.25);
    ctx.stroke();
    
    // Tail rotor blade
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-size * 1.55, -size * 0.25, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Main rotor stem
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-1.5, -size * 0.55, 3, size * 0.25);
    
    // Spinning main rotor blades (rotated in real time)
    ctx.translate(0, -size * 0.55);
    ctx.rotate(time * 18);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-size * 1.6, 0);
    ctx.lineTo(size * 1.6, 0);
    ctx.stroke();
    
    ctx.restore();
}

// Tactical Hexagonal Unit Counters
function drawUnitBadge(base) {
    const bx = base.x;
    const by = base.y + base.radius + (base.reinforceLevel || 0) * 4 + 18;
    
    ctx.save();
    
    const w = 48;
    const h = 20;
    
    // Plate shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(bx - w/2 + 2, by - h/2 + 2);
    ctx.lineTo(bx + w/2 - 6 + 2, by - h/2 + 2);
    ctx.lineTo(bx + w/2 + 2, by + 2);
    ctx.lineTo(bx + w/2 - 6 + 2, by + h/2 + 2);
    ctx.lineTo(bx - w/2 + 2, by + h/2 + 2);
    ctx.lineTo(bx - w/2 - 6 + 2, by + 2);
    ctx.closePath();
    ctx.fill();
    
    // Main glassmorphic background plate
    ctx.fillStyle = '#0f172a'; // dark navy slate
    ctx.strokeStyle = COLORS[base.owner];
    ctx.lineWidth = 1.8;
    
    ctx.beginPath();
    ctx.moveTo(bx - w/2, by - h/2);
    ctx.lineTo(bx + w/2 - 6, by - h/2);
    ctx.lineTo(bx + w/2, by);
    ctx.lineTo(bx + w/2 - 6, by + h/2);
    ctx.lineTo(bx - w/2, by + h/2);
    ctx.lineTo(bx - w/2 - 6, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Soft inner glow outline
    ctx.strokeStyle = GLOW_COLORS[base.owner];
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Unit number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.floor(base.units), bx - 2, by);
    
    // Technical detail subtitle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '700 8px Rajdhani';
    if (base.owner === OWNER.PLAYER) {
        ctx.fillText(`ALLIED`, bx - 2, by + 16);
    } else if (base.owner === OWNER.ENEMY) {
        ctx.fillText(`HOSTILE`, bx - 2, by + 16);
    } else {
        ctx.fillText(`COST ${base.captureCost}`, bx - 2, by + 16);
    }
    
    // Active Frontline auto-supply indicator
    if (base.owner === OWNER.PLAYER && base.frontlineTarget !== null) {
        const flText = `FL ➔ B${base.frontlineTarget + 1}`;
        ctx.font = 'bold 8px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const flw = ctx.measureText(flText).width + 8;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.fillRect(bx - flw / 2, by - 22, flw, 12);
        ctx.strokeRect(bx - flw / 2, by - 22, flw, 12);
        
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(flText, bx, by - 16);
    }
    
    // Active selection mode indicator badge
    if (gameState.selectedBase === base.id) {
        let modeText, badgeColor;
        if (gameState.dispatchMode === 'frontline') {
            if (base.frontlineTarget !== null) {
                modeText = 'CLICK / R-CLICK: STOP';
                badgeColor = '#ef4444';
            } else {
                modeText = 'SELECT ALLIED TARGET';
                badgeColor = '#f59e0b';
            }
        } else {
            modeText = gameState.selectingFull ? '100% [ALL]' : '50% [HALF]';
            badgeColor = gameState.selectingFull ? '#f59e0b' : '#38bdf8';
        }
        
        ctx.font = 'bold 8px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(modeText).width + 8;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1;
        ctx.fillRect(bx - tw / 2, by + 26, tw, 13);
        ctx.strokeRect(bx - tw / 2, by + 26, tw, 13);
        
        ctx.fillStyle = badgeColor;
        ctx.fillText(modeText, bx, by + 33);
    }
    
    ctx.restore();
}

function drawHexagon(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const rx = x + Math.cos(angle) * r;
        const ry = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
}

// 2D Isometric Base Drawer with dynamic radius upgrade expansions
function drawBase(base) {
    const isSelected = gameState.selectedBase === base.id;
    const reinforceLvl = base.reinforceLevel || 0;
    const radius = base.radius + reinforceLvl * 3; // Upgrades increase border size
    const pulse = isSelected ? Math.sin(Date.now() / 150) * 0.08 + 0.96 : 1.0;
    const drawRadius = radius * pulse;
    
    ctx.save();
    
    // Selection indicator / glowing range
    if (isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(base.x, base.y, radius + 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.arc(base.x, base.y, radius + 14, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Concentric glowing rings to visually show reinforcement layers
    for (let l = 1; l <= reinforceLvl; l++) {
        ctx.strokeStyle = GLOW_COLORS[base.owner];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(base.x, base.y, base.radius + l * 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Base Shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(base.x + 4, base.y + 4, radius * 0.95, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 5 Fortification Pips Indicator above the base
    if (reinforceLvl > 0) {
        ctx.save();
        const totalPips = MAX_FORTIFICATION_LEVEL;
        const pipSpacing = 8;
        const pipY = base.y - radius - 12;
        const startX = base.x - ((totalPips - 1) * pipSpacing) / 2;
        
        // Tactical dark pod for pips
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.fillRect(startX - 6, pipY - 5, (totalPips - 1) * pipSpacing + 12, 10);
        ctx.strokeRect(startX - 6, pipY - 5, (totalPips - 1) * pipSpacing + 12, 10);
        
        for (let p = 0; p < totalPips; p++) {
            const px = startX + p * pipSpacing;
            ctx.beginPath();
            ctx.arc(px, pipY, 2.5, 0, Math.PI * 2);
            if (p < reinforceLvl) {
                ctx.fillStyle = '#f59e0b'; // Gold filled pip
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(100, 116, 139, 0.4)'; // Slate empty pip
                ctx.fill();
            }
        }
        ctx.restore();
    }
    
    if (base.type === BASE_TYPE.HELICOPTER) {
        // HELIPORT BASE
        // Reinforced blast wall ring if fortified (thickens per level)
        if (reinforceLvl > 0) {
            ctx.strokeStyle = COLORS[base.owner];
            ctx.lineWidth = 2.5 + reinforceLvl * 2.5;
            ctx.beginPath();
            ctx.arc(base.x, base.y, drawRadius + 4 + reinforceLvl * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Concrete platform
        ctx.fillStyle = '#4b5563'; 
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(base.x, base.y, drawRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Yellow warning markings
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(base.x, base.y, drawRadius * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Central letter H
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${16 + reinforceLvl}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', base.x, base.y);
        
        // Perimeter beacons
        const blink = Math.sin(Date.now() / 220) > 0;
        if (blink) {
            ctx.fillStyle = COLORS[base.owner];
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const lx = base.x + Math.cos(angle) * (drawRadius - 3);
                const ly = base.y + Math.sin(angle) * (drawRadius - 3);
                ctx.beginPath();
                ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
    } else {
        // FORTIFIED GARRISON (Mixed or Tank base)
        const size = radius * 0.95;
        
        // Outer heavy reinforced armor ring & corner bastions
        if (reinforceLvl > 0) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3 + reinforceLvl * 2.2;
            drawHexagon(base.x, base.y, size * pulse + 3 + reinforceLvl * 2.5);
            ctx.stroke();
            
            // Bastion corner brackets at the 6 vertices
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const bx = base.x + Math.cos(angle) * (size * pulse + 3 + reinforceLvl * 2.5);
                const by = base.y + Math.sin(angle) * (size * pulse + 3 + reinforceLvl * 2.5) - (6 + reinforceLvl * 1.5);
                ctx.fillStyle = COLORS[base.owner];
                ctx.beginPath();
                ctx.arc(bx, by, 2.5 + reinforceLvl * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        }
        
        ctx.fillStyle = '#374151'; // foundation
        drawHexagon(base.x, base.y, size * pulse);
        ctx.fill();
        
        // 3D wall thickness extrusion (deeper wall drop for higher fortification)
        const wallDrop = 8 + reinforceLvl * 2;
        ctx.fillStyle = '#1f2937'; 
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle1 = (i * Math.PI) / 3;
            const angle2 = ((i + 1) * Math.PI) / 3;
            
            const x1 = base.x + Math.cos(angle1) * size * pulse;
            const y1 = base.y + Math.sin(angle1) * size * pulse;
            const x2 = base.x + Math.cos(angle2) * size * pulse;
            const y2 = base.y + Math.sin(angle2) * size * pulse;
            
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2, y2 - wallDrop);
            ctx.lineTo(x1, y1 - wallDrop);
            ctx.closePath();
        }
        ctx.fill();
        
        // Flat roof top with thick reinforced wall border (progressively thicker walls shown)
        ctx.fillStyle = '#4b5563'; 
        ctx.strokeStyle = COLORS[base.owner];
        ctx.lineWidth = 2.5 + reinforceLvl * 2.8; // Thicker wall per upgrade level!
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const rx = base.x + Math.cos(angle) * size * pulse;
            const ry = base.y + Math.sin(angle) * size * pulse - wallDrop;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Hangar gates and radar structures on roof
        if (base.type === BASE_TYPE.MIXED) {
            // Spinning communications radar dish
            ctx.save();
            ctx.translate(base.x, base.y - wallDrop);
            ctx.rotate(Date.now() / 850);
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 7 + reinforceLvl * 0.5, 0, Math.PI * 1.35); 
            ctx.stroke();
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-1, -1, 2, 8); 
            ctx.restore();
        } else if (base.type === BASE_TYPE.TANK) {
            // Hangar door lines
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(base.x - 11, base.y - 6 - wallDrop, 22, 10);
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 1;
            for (let l = base.x - 8; l <= base.x + 8; l += 4) {
                ctx.beginPath();
                ctx.moveTo(l, base.y - 6 - wallDrop);
                ctx.lineTo(l, base.y + 4 - wallDrop);
                ctx.stroke();
            }
        }
    }
    
    // Amber Energy Shield overlay if armored
    if (base.armored) {
        ctx.save();
        ctx.translate(base.x, base.y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'; 
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.fill();
        ctx.restore();
    }
    
    // Waving ownership flag
    drawFlag(base.x - radius * 0.7, base.y - radius * 0.35, base.owner);
    
    // Base unit counter panel
    drawUnitBadge(base);
    
    ctx.restore();
}

// Glassmorphic Troop Count Badges
function drawTroopTag(cx, cy, number, owner) {
    ctx.save();
    ctx.translate(cx, cy);
    
    ctx.fillStyle = '#0f172a'; // solid dark background for high readability
    ctx.strokeStyle = COLORS[owner];
    ctx.lineWidth = 2.0; // thicker border
    
    const w = 24; // wider badge
    const h = 13; // taller badge
    
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 3);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, 0, 0.5);
    
    ctx.restore();
}

// Active Moving Units Drawing
function drawUnits() {
    gameState.units.forEach(unit => {
        ctx.save();
        ctx.translate(unit.x, unit.y);
        
        const size = Math.min(8 + unit.units * 0.25, 13);
        
        ctx.shadowBlur = 6;
        ctx.shadowColor = COLORS[unit.owner];
        
        if (unit.isHelicopter) {
            // Draw helicopter unit
            drawHeliIcon(0, 0, COLORS[unit.owner], size, Date.now() / 1000 + unit.x * 0.05);
            
            // Draw rotor wind outline on the grass underneath (very subtle)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, size * 0.8, size * 1.25, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Draw tank unit rotated to target direction
            const targetBase = gameState.bases[unit.to];
            let nextTarget = targetBase;
            if (unit.path && unit.pathIndex < unit.path.length - 1) {
                nextTarget = gameState.bases[unit.path[unit.pathIndex + 1]];
            }
            const angle = Math.atan2(nextTarget.y - unit.y, nextTarget.x - unit.x);
            ctx.rotate(angle);
            drawTankIcon(0, 0, COLORS[unit.owner], size * 0.95);
        }
        ctx.shadowBlur = 0;
        
        // Troop size count tag overlay
        drawTroopTag(0, unit.isHelicopter ? 16 : -13, unit.units, unit.owner);
        
        ctx.restore();
    });
}

// Tactical interaction state (Mouse drag, hover, route preview, double click dispatch)
let isDragging = false;
let dragSourceBase = null;
let dragStartPos = { x: 0, y: 0 };
let dragCurrentPos = { x: 0, y: 0 };
let lastDragEndTime = 0;
let lastDispatch = { sourceId: null, targetId: null, time: 0 };
let hoveredBase = null;
let lastClickTime = 0;
let lastClickedBaseId = null;

// Draw subtle indicators around bases reachable from active source base
function drawReachableIndicators(activeSource) {
    if (!activeSource) return;
    const isFrontline = gameState.dispatchMode === 'frontline';
    const reachable = getReachableBases(activeSource);
    
    reachable.forEach(baseId => {
        const base = gameState.bases[baseId];
        if (!base) return;
        // In Frontline mode, only player-owned allied bases can be targets!
        if (isFrontline && base.owner !== OWNER.PLAYER) return;
        
        ctx.save();
        const pulse = Math.sin(Date.now() / 240) * 2 + 6;
        ctx.strokeStyle = isFrontline ? 'rgba(245, 158, 11, 0.55)' : 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -flowOffset;
        ctx.beginPath();
        ctx.arc(base.x, base.y, base.radius + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    });
}

// Draw faint animated supply lines between bases where Frontline is active
function drawActiveFrontlines() {
    gameState.bases.forEach(base => {
        if (base.owner !== OWNER.PLAYER || base.frontlineTarget === null) return;
        const target = gameState.bases[base.frontlineTarget];
        if (!target) {
            base.frontlineTarget = null;
            return;
        }

        const isHeli = base.type === BASE_TYPE.HELICOPTER || 
                       (base.type === BASE_TYPE.MIXED && target.type === BASE_TYPE.HELICOPTER);
        
        ctx.save();
        if (isHeli) {
            // Faint direct flight line
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([7, 7]);
            ctx.lineDashOffset = -flowOffset * 2;
            ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
            ctx.shadowBlur = 4;
            
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Directional traveling chevron at center
            const midX = (base.x + target.x) / 2;
            const midY = (base.y + target.y) / 2;
            const angle = Math.atan2(target.y - base.y, target.x - base.x);
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.75)';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            // Faint ground route along connected roads
            const path = findPath(base.id, target.id, base.owner);
            if (path && path.length > 1) {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
                ctx.lineWidth = 3;
                ctx.setLineDash([7, 7]);
                ctx.lineDashOffset = -flowOffset * 2;
                ctx.shadowColor = 'rgba(245, 158, 11, 0.35)';
                ctx.shadowBlur = 5;
                
                ctx.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const b = gameState.bases[path[i]];
                    if (i === 0) ctx.moveTo(b.x, b.y);
                    else ctx.lineTo(b.x, b.y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
                
                // Draw small directional chevrons along route segments
                for (let i = 0; i < path.length - 1; i++) {
                    const b1 = gameState.bases[path[i]];
                    const b2 = gameState.bases[path[i + 1]];
                    const midX = (b1.x + b2.x) / 2;
                    const midY = (b1.y + b2.y) / 2;
                    const angle = Math.atan2(b2.y - b1.y, b2.x - b1.x);
                    ctx.save();
                    ctx.translate(midX, midY);
                    ctx.rotate(angle);
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
                    ctx.beginPath();
                    ctx.moveTo(6, 0);
                    ctx.lineTo(-4, -4);
                    ctx.lineTo(-1.5, 0);
                    ctx.lineTo(-4, 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            } else {
                // Route currently blocked by enemy/neutral territory
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(base.x, base.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        ctx.restore();
    });
}

// Draw animated route trajectory from active source base to hovered/dragged target
function drawTargetRoutePreview(activeSource, targetBase) {
    if (!activeSource || !targetBase || activeSource.id === targetBase.id) return;
    
    const isFrontline = gameState.dispatchMode === 'frontline';
    
    // Frontline cannot target enemy or neutral bases: show red denial preview
    if (isFrontline && targetBase.owner !== OWNER.PLAYER) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(activeSource.x, activeSource.y);
        ctx.lineTo(targetBase.x, targetBase.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        return;
    }
    
    const mainColor = isFrontline ? '#f59e0b' : '#38bdf8';
    
    const isHeli = activeSource.type === BASE_TYPE.HELICOPTER || 
                   (activeSource.type === BASE_TYPE.MIXED && targetBase.type === BASE_TYPE.HELICOPTER);
                   
    ctx.save();
    if (isHeli) {
        // Direct aerial flight vector
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -flowOffset * 2;
        
        ctx.beginPath();
        ctx.moveTo(activeSource.x, activeSource.y);
        ctx.lineTo(targetBase.x, targetBase.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Directional flight chevron in center
        const midX = (activeSource.x + targetBase.x) / 2;
        const midY = (activeSource.y + targetBase.y) / 2;
        const angle = Math.atan2(targetBase.y - activeSource.y, targetBase.x - activeSource.x);
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    } else {
        // Ground road chain routing through owned bases
        const path = findPath(activeSource.id, targetBase.id, activeSource.owner);
        if (path && path.length > 1) {
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 3.5;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -flowOffset * 2.5;
            ctx.shadowColor = mainColor;
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const b = gameState.bases[path[i]];
                if (i === 0) ctx.moveTo(b.x, b.y);
                else ctx.lineTo(b.x, b.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            
            // Draw directional chevrons along path road segments
            for (let i = 0; i < path.length - 1; i++) {
                const b1 = gameState.bases[path[i]];
                const b2 = gameState.bases[path[i + 1]];
                const midX = (b1.x + b2.x) / 2;
                const midY = (b1.y + b2.y) / 2;
                const angle = Math.atan2(b2.y - b1.y, b2.x - b1.x);
                ctx.save();
                ctx.translate(midX, midY);
                ctx.rotate(angle);
                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.moveTo(7, 0);
                ctx.lineTo(-5, -5);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }
    ctx.restore();
}

// Draw dynamic targeting laser while dragging across screen
function drawDragVector() {
    if (!isDragging || !dragSourceBase) return;
    
    const isFrontline = gameState.dispatchMode === 'frontline';
    ctx.save();
    const targetBase = getBaseAt(dragCurrentPos.x, dragCurrentPos.y);
    const endX = targetBase ? targetBase.x : dragCurrentPos.x;
    const endY = targetBase ? targetBase.y : dragCurrentPos.y;
    
    const isFriendly = targetBase && targetBase.owner === OWNER.PLAYER;
    const isValidTarget = targetBase && targetBase.id !== dragSourceBase.id && (!isFrontline || isFriendly);
    const isSelfTarget = targetBase && targetBase.id === dragSourceBase.id && isFrontline && dragSourceBase.frontlineTarget !== null;
    
    let activeColor, reticleColor;
    if (isFrontline) {
        if (targetBase && targetBase.owner !== OWNER.PLAYER) {
            activeColor = 'rgba(239, 68, 68, 0.75)';
            reticleColor = '#ef4444';
        } else if (isSelfTarget) {
            activeColor = 'rgba(239, 68, 68, 0.8)';
            reticleColor = '#ef4444';
        } else if (isValidTarget) {
            activeColor = '#f59e0b';
            reticleColor = '#fbbf24';
        } else {
            activeColor = 'rgba(245, 158, 11, 0.6)';
            reticleColor = '#f59e0b';
        }
    } else {
        activeColor = isValidTarget ? '#10b981' : 'rgba(56, 189, 248, 0.85)';
        reticleColor = isValidTarget ? '#10b981' : '#38bdf8';
    }
        
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -flowOffset * 2;
    
    ctx.beginPath();
    ctx.moveTo(dragSourceBase.x, dragSourceBase.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Crosshair target circle at cursor
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(endX, endY, targetBase ? targetBase.radius + 6 : 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Crosshair reticle ticks
    ctx.beginPath();
    ctx.moveTo(endX - 14, endY);
    ctx.lineTo(endX + 14, endY);
    ctx.moveTo(endX, endY - 14);
    ctx.lineTo(endX, endY + 14);
    ctx.stroke();
    
    ctx.restore();
}

// Draw Master Loop
function draw() {
    ctx.save();
    
    // Apply screen shake
    if (screenShake > 0.1) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.88;
    }
    
    drawBackground();
    drawRoads();
    drawBridges();
    drawFoliage();
    drawActiveFrontlines();
    
    // Render reachability indicators and multi-hop route preview
    const activeSource = (isDragging && dragSourceBase) 
        ? dragSourceBase 
        : (gameState.selectedBase !== null ? gameState.bases[gameState.selectedBase] : null);
        
    if (activeSource) {
        drawReachableIndicators(activeSource);
        const currentTarget = isDragging 
            ? getBaseAt(dragCurrentPos.x, dragCurrentPos.y) 
            : hoveredBase;
        if (currentTarget && currentTarget.id !== activeSource.id) {
            drawTargetRoutePreview(activeSource, currentTarget);
        }
    }
    
    if (isDragging) {
        drawDragVector();
    }
    
    gameState.bases.forEach(base => drawBase(base));
    drawUnits();
    drawParticles();
    
    ctx.restore();
}

// Get base at specific coordinate
function getBaseAt(x, y) {
    for (const base of gameState.bases) {
        const radius = base.radius + (base.reinforceLevel || 0) * 3 + 8;
        const dx = x - base.x;
        const dy = y - base.y;
        if (dx * dx + dy * dy < radius * radius) {
            return base;
        }
    }
    return null;
}

// Update UI text fields
function updateUI() {
    const timeEl = document.getElementById('time');
    const waveEl = document.getElementById('wave');
    const basesEl = document.getElementById('bases');
    
    if (timeEl) timeEl.textContent = formatTime(gameState.gameTime);
    if (waveEl) waveEl.textContent = gameState.wave;
    
    const playerBases = gameState.bases.filter(b => b.owner === OWNER.PLAYER).length;
    const enemyBases = gameState.bases.filter(b => b.owner === OWNER.ENEMY).length;
    if (basesEl) basesEl.textContent = `${playerBases}/${playerBases + enemyBases}`;
    
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.level) === gameState.currentLevel);
    });
    
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.speed) === gameState.gameSpeed);
    });
    
    // Dynamically refresh tactical intel in sidebar during battles/troop growth
    const activeBase = hoveredBase || (gameState.selectedBase !== null ? gameState.bases[gameState.selectedBase] : null);
    if (activeBase) {
        showBaseInfo(activeBase);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showBaseInfo(base) {
    const info = document.getElementById('base-info');
    const standby = document.getElementById('standby-info');
    if (!info) return;
    
    info.classList.add('visible');
    if (standby) standby.style.display = 'none';
    
    const ownerEl = document.getElementById('info-owner');
    const unitsEl = document.getElementById('info-units');
    const costEl = document.getElementById('info-cost');
    const capEl = document.getElementById('info-cap');
    const typeEl = document.getElementById('info-type');
    const armoredEl = document.getElementById('info-armored');
    const reinforceEl = document.getElementById('info-reinforced');
    const upgradeCostEl = document.getElementById('info-upgrade-cost');
    
    if (ownerEl) {
        ownerEl.textContent = OWNER_NAMES[base.owner];
        ownerEl.style.color = COLORS[base.owner];
    }
    if (unitsEl) unitsEl.textContent = Math.floor(base.units);
    if (costEl) costEl.textContent = base.captureCost;
    if (capEl) {
        capEl.textContent = 'None (Unlimited)';
        capEl.style.color = '#10b981';
    }
    if (typeEl) typeEl.textContent = TYPE_NAMES[base.type];
    if (armoredEl) {
        armoredEl.textContent = base.armored ? 'Yes' : 'No';
        armoredEl.style.color = base.armored ? '#FFD700' : '#888';
    }
    if (reinforceEl) {
        const lvl = base.reinforceLevel || 0;
        reinforceEl.textContent = lvl > 0 ? `Lvl ${lvl}/${MAX_FORTIFICATION_LEVEL} (${1 + lvl}x Def)` : 'Lvl 0 (1x Def)';
        reinforceEl.style.color = lvl > 0 ? '#f59e0b' : '#f1f5f9';
    }
    if (upgradeCostEl) {
        const lvl = base.reinforceLevel || 0;
        if (base.owner === OWNER.ENEMY) {
            if (lvl >= MAX_FORTIFICATION_LEVEL) {
                upgradeCostEl.textContent = 'MAX LEVEL (5/5)';
                upgradeCostEl.style.color = '#ef4444';
            } else {
                upgradeCostEl.textContent = `Enemy Fort (${lvl}/${MAX_FORTIFICATION_LEVEL})`;
                upgradeCostEl.style.color = '#f59e0b';
            }
        } else if (base.owner !== OWNER.PLAYER) {
            upgradeCostEl.textContent = 'N/A';
            upgradeCostEl.style.color = '#888';
        } else {
            if (lvl >= MAX_FORTIFICATION_LEVEL) {
                upgradeCostEl.textContent = 'MAX LEVEL (5/5)';
                upgradeCostEl.style.color = '#10b981';
            } else if (base.units >= MIN_FORTIFY_UNITS) {
                const half = Math.floor(base.units / 2);
                upgradeCostEl.textContent = `Right-Click: -${half} troops`;
                upgradeCostEl.style.color = '#38bdf8';
            } else {
                upgradeCostEl.textContent = `Need 10 troops (${Math.floor(base.units)}/10)`;
                upgradeCostEl.style.color = '#ef4444';
            }
        }
    }
    
    const frontlineEl = document.getElementById('info-frontline');
    const stopFrontlineBtn = document.getElementById('info-stop-frontline-btn');
    if (frontlineEl) {
        if (base.owner !== OWNER.PLAYER) {
            frontlineEl.textContent = 'N/A';
            frontlineEl.style.color = '#888';
            if (stopFrontlineBtn) stopFrontlineBtn.style.display = 'none';
        } else if (base.frontlineTarget !== null) {
            const target = gameState.bases[base.frontlineTarget];
            const targetName = target ? `${OWNER_NAMES[target.owner]} Base ${base.frontlineTarget + 1}` : 'None';
            frontlineEl.textContent = `➔ ${targetName} (Auto 2)`;
            frontlineEl.style.color = '#f59e0b';
            if (stopFrontlineBtn) {
                stopFrontlineBtn.style.display = 'inline-block';
                stopFrontlineBtn.onclick = (e) => {
                    e.stopPropagation();
                    base.frontlineTarget = null;
                    playDenySound();
                    showBaseInfo(base);
                };
            }
        } else {
            frontlineEl.textContent = 'None (Inactive)';
            frontlineEl.style.color = '#94a3b8';
            if (stopFrontlineBtn) stopFrontlineBtn.style.display = 'none';
        }
    }
}

function hideBaseInfo() {
    if (gameState.selectedBase !== null && gameState.bases[gameState.selectedBase]) {
        showBaseInfo(gameState.bases[gameState.selectedBase]);
        return;
    }
    const info = document.getElementById('base-info');
    if (info) info.classList.remove('visible');
    const standby = document.getElementById('standby-info');
    if (standby) standby.style.display = 'flex';
    const stopFrontlineBtn = document.getElementById('info-stop-frontline-btn');
    if (stopFrontlineBtn) stopFrontlineBtn.style.display = 'none';
}

// Mouse Event Handlers: Drag-to-Target & Click/Double-Click Dispatch

canvas.addEventListener('mousedown', (e) => {
    if (gameState.gameOver || e.button !== 0) return; // Left mouse button only
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const base = getBaseAt(x, y);
    if (base && base.owner === OWNER.PLAYER) {
        dragSourceBase = base;
        dragStartPos = { x, y };
        dragCurrentPos = { x, y };
        isDragging = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    hoveredBase = getBaseAt(x, y);
    canvas.style.cursor = hoveredBase ? 'pointer' : (isDragging ? 'crosshair' : 'default');
    
    if (dragSourceBase) {
        const dx = x - dragStartPos.x;
        const dy = y - dragStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
            isDragging = true;
            dragCurrentPos = { x, y };
        }
    }
    
    if (hoveredBase) {
        showBaseInfo(hoveredBase);
    } else if (gameState.selectedBase === null && !isDragging) {
        hideBaseInfo();
    }
});

canvas.addEventListener('mouseleave', () => {
    hoveredBase = null;
    if (gameState.selectedBase !== null && gameState.bases[gameState.selectedBase]) {
        showBaseInfo(gameState.bases[gameState.selectedBase]);
    } else if (!isDragging) {
        hideBaseInfo();
    }
});

window.addEventListener('mouseup', (e) => {
    if (!dragSourceBase) return;
    
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const targetBase = getBaseAt(x, y);
        
        if (targetBase && targetBase.id !== dragSourceBase.id) {
            const isHeli = dragSourceBase.type === BASE_TYPE.HELICOPTER || 
                           (dragSourceBase.type === BASE_TYPE.MIXED && targetBase.type === BASE_TYPE.HELICOPTER);
            const path = isHeli ? null : findPath(dragSourceBase.id, targetBase.id, dragSourceBase.owner);
            
            if (isHeli || path) {
                if (gameState.dispatchMode === 'frontline') {
                    // Frontline can ONLY target player-owned (allied) bases!
                    if (targetBase.owner !== OWNER.PLAYER) {
                        playDenySound();
                        triggerScreenShake(4);
                        gameState.selectedBase = null;
                        gameState.selectedUnits = 0;
                        gameState.selectingFull = false;
                        lastDragEndTime = Date.now();
                        isDragging = false;
                        dragSourceBase = null;
                        return;
                    }
                    
                    // Frontline mode: assign or toggle frontline route
                    if (dragSourceBase.frontlineTarget === targetBase.id) {
                        dragSourceBase.frontlineTarget = null;
                        playDenySound();
                    } else {
                        dragSourceBase.frontlineTarget = targetBase.id;
                        dragSourceBase.frontlineTimer = 0.35;
                        playSelectSound();
                        spawnUpgradeParticles(targetBase.x, targetBase.y);
                    }
                    gameState.selectedBase = null;
                    gameState.selectedUnits = 0;
                    gameState.selectingFull = false;
                } else {
                    const numToSend = (gameState.selectedBase === dragSourceBase.id && gameState.selectingFull)
                        ? dragSourceBase.units
                        : Math.floor(dragSourceBase.units / 2);
                        
                    if (numToSend > 0) {
                        sendUnits(dragSourceBase, targetBase, numToSend);
                        lastDispatch = { sourceId: dragSourceBase.id, targetId: targetBase.id, time: Date.now() };
                        gameState.selectedBase = null;
                        gameState.selectedUnits = 0;
                        gameState.selectingFull = false;
                    }
                }
            } else {
                playDenySound();
            }
        } else if (targetBase && targetBase.id === dragSourceBase.id && gameState.dispatchMode === 'frontline') {
            // Dragged and released on self in Frontline mode: stop frontline!
            if (dragSourceBase.frontlineTarget !== null) {
                dragSourceBase.frontlineTarget = null;
                playDenySound();
            }
            gameState.selectedBase = null;
            gameState.selectedUnits = 0;
            gameState.selectingFull = false;
        }
        lastDragEndTime = Date.now();
    }
    
    isDragging = false;
    dragSourceBase = null;
});

// Click Handling: Single-Click (50%), Quick Double-Click (100% ALL), Frontline Setup
canvas.addEventListener('click', (e) => {
    if (gameState.gameOver) return;
    if (Date.now() - lastDragEndTime < 250) return; // Prevent click immediately after drag release
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedBase = getBaseAt(x, y);
    const now = Date.now();
    const isDoubleClick = (now - lastClickTime < 350) && (clickedBase && clickedBase.id === lastClickedBaseId);
    lastClickTime = now;
    lastClickedBaseId = clickedBase ? clickedBase.id : null;
    
    // Frontline Mode handling
    if (gameState.dispatchMode === 'frontline') {
        if (gameState.selectedBase !== null) {
            const selectedBase = gameState.bases[gameState.selectedBase];
            if (clickedBase && clickedBase.id !== gameState.selectedBase) {
                // Frontline can ONLY target player-owned (allied) bases!
                if (clickedBase.owner !== OWNER.PLAYER) {
                    playDenySound();
                    triggerScreenShake(4);
                    gameState.selectedBase = null;
                    gameState.selectedUnits = 0;
                    gameState.selectingFull = false;
                    showBaseInfo(clickedBase);
                    return;
                }
                
                // Setting or toggling frontline target
                const isHeli = selectedBase.type === BASE_TYPE.HELICOPTER || 
                               (selectedBase.type === BASE_TYPE.MIXED && clickedBase.type === BASE_TYPE.HELICOPTER);
                const path = isHeli ? null : findPath(selectedBase.id, clickedBase.id, selectedBase.owner);
                if (isHeli || path) {
                    if (selectedBase.frontlineTarget === clickedBase.id) {
                        selectedBase.frontlineTarget = null;
                        playDenySound();
                    } else {
                        selectedBase.frontlineTarget = clickedBase.id;
                        selectedBase.frontlineTimer = 0.35;
                        playSelectSound();
                        spawnUpgradeParticles(clickedBase.x, clickedBase.y);
                    }
                } else {
                    playDenySound();
                }
                gameState.selectedBase = null;
                gameState.selectedUnits = 0;
                gameState.selectingFull = false;
            } else if (clickedBase && clickedBase.id === gameState.selectedBase) {
                // Clicked same base: if it has an active frontline, STOP it!
                if (selectedBase.frontlineTarget !== null) {
                    selectedBase.frontlineTarget = null;
                    playDenySound();
                }
                gameState.selectedBase = null;
                gameState.selectedUnits = 0;
                gameState.selectingFull = false;
            } else {
                // Clicked empty space: deselect
                gameState.selectedBase = null;
                gameState.selectedUnits = 0;
                gameState.selectingFull = false;
            }
        } else if (clickedBase && clickedBase.owner === OWNER.PLAYER) {
            gameState.selectedBase = clickedBase.id;
            gameState.selectedUnits = 0;
            gameState.selectingFull = false;
            playSelectSound();
        }
        
        if (clickedBase) {
            showBaseInfo(clickedBase);
        } else {
            hideBaseInfo();
        }
        return;
    }
    
    // Move Mode:
    // 1. Double-click on target base in quick succession: sends ALL remaining troops from source
    if (now - lastDispatch.time < 400 && clickedBase && lastDispatch.targetId === clickedBase.id) {
        const prevSource = gameState.bases[lastDispatch.sourceId];
        if (prevSource && prevSource.owner === OWNER.PLAYER && prevSource.units > 0) {
            sendUnits(prevSource, clickedBase, prevSource.units);
            lastDispatch = { sourceId: null, targetId: null, time: 0 };
            gameState.selectedBase = null;
            gameState.selectedUnits = 0;
            gameState.selectingFull = false;
            if (clickedBase) showBaseInfo(clickedBase);
            return;
        }
    }
    
    // 2. Normal selection & dispatch
    if (gameState.selectedBase !== null) {
        const selectedBase = gameState.bases[gameState.selectedBase];
        
        if (clickedBase && clickedBase.id !== gameState.selectedBase) {
            // Target base clicked: send forces (either 100% or 50%)
            const numToSend = gameState.selectingFull ? selectedBase.units : Math.floor(selectedBase.units / 2);
            if (numToSend > 0) {
                sendUnits(selectedBase, clickedBase, numToSend);
                lastDispatch = { sourceId: selectedBase.id, targetId: clickedBase.id, time: now };
            }
            gameState.selectedBase = null;
            gameState.selectedUnits = 0;
            gameState.selectingFull = false;
        } else if (clickedBase && clickedBase.id === gameState.selectedBase) {
            if (isDoubleClick) {
                // Double click on selected base: upgrade to ALL (100%)
                gameState.selectingFull = true;
                gameState.selectedUnits = selectedBase.units;
                playSelectSound();
            } else {
                // Single click on same base: deselect
                gameState.selectedBase = null;
                gameState.selectedUnits = 0;
                gameState.selectingFull = false;
            }
        } else {
            // Clicked empty map space: deselect
            gameState.selectedBase = null;
            gameState.selectedUnits = 0;
            gameState.selectingFull = false;
        }
    } else if (clickedBase && clickedBase.owner === OWNER.PLAYER) {
        // First click on player base: select it
        gameState.selectedBase = clickedBase.id;
        if (isDoubleClick) {
            gameState.selectingFull = true;
            gameState.selectedUnits = clickedBase.units; // 100% ALL
        } else {
            gameState.selectingFull = false;
            gameState.selectedUnits = Math.floor(clickedBase.units / 2); // 50%
        }
        playSelectSound();
    }
    
    if (clickedBase) {
        showBaseInfo(clickedBase);
    } else {
        hideBaseInfo();
    }
});

// Context Menu (Right-Click: Fortify in Move mode, Stop Frontline in Frontline mode)
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedBase = getBaseAt(x, y);
    if (clickedBase && clickedBase.owner === OWNER.PLAYER) {
        if (gameState.dispatchMode === 'frontline') {
            // Frontline mode: Right-click stops active frontline!
            if (clickedBase.frontlineTarget !== null) {
                clickedBase.frontlineTarget = null;
                playDenySound();
                showBaseInfo(clickedBase);
            } else {
                playDenySound();
            }
            gameState.selectedBase = null;
            gameState.selectedUnits = 0;
            gameState.selectingFull = false;
            return;
        }
        
        // Move Mode: Right-Click to Fortify Base
        if (canFortify(clickedBase)) {
            fortifyBase(clickedBase);
            showBaseInfo(clickedBase);
        } else {
            playDenySound();
            triggerScreenShake(3);
            showBaseInfo(clickedBase);
        }
    } else {
        // Standard context menu clears selections
        gameState.selectedBase = null;
        gameState.selectedUnits = 0;
        gameState.selectingFull = false;
    }
});

// Dispatch Mode Switching (Move [M] vs Frontline [F])
function setDispatchMode(mode) {
    if (mode !== 'move' && mode !== 'frontline') return;
    gameState.dispatchMode = mode;
    
    const moveBtn = document.getElementById('modeMoveBtn');
    const frontlineBtn = document.getElementById('modeFrontlineBtn');
    if (moveBtn) moveBtn.classList.toggle('active', mode === 'move');
    if (frontlineBtn) frontlineBtn.classList.toggle('active', mode === 'frontline');
    
    gameState.selectedBase = null;
    gameState.selectedUnits = 0;
    gameState.selectingFull = false;
    
    playSelectSound();
}

const modeMoveBtn = document.getElementById('modeMoveBtn');
if (modeMoveBtn) {
    modeMoveBtn.addEventListener('click', () => setDispatchMode('move'));
}

const modeFrontlineBtn = document.getElementById('modeFrontlineBtn');
if (modeFrontlineBtn) {
    modeFrontlineBtn.addEventListener('click', () => setDispatchMode('frontline'));
}

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.key === 'f' || e.key === 'F') && e.shiftKey) {
        e.preventDefault();
        toggleFullscreen();
    } else if (e.key === 'm' || e.key === 'M') {
        setDispatchMode('move');
    } else if (e.key === 'f' || e.key === 'F') {
        setDispatchMode('frontline');
    } else if (e.key === 'x' || e.key === 'X') {
        // Stop frontline hotkey
        let stopped = 0;
        if (gameState.selectedBase !== null) {
            const b = gameState.bases[gameState.selectedBase];
            if (b && b.frontlineTarget !== null) {
                b.frontlineTarget = null;
                stopped++;
                showBaseInfo(b);
            }
        }
        if (stopped === 0) {
            gameState.bases.forEach(b => {
                if (b.owner === OWNER.PLAYER && b.frontlineTarget !== null) {
                    b.frontlineTarget = null;
                    stopped++;
                }
            });
            if (hoveredBase) showBaseInfo(hoveredBase);
        }
        if (stopped > 0) {
            playDenySound();
        }
    }
});

// Button Click Event Listeners
const startBtn = document.getElementById('startBtn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (gameState.gameOver) return;
        gameState.isRunning = !gameState.isRunning;
        startBtn.textContent = gameState.isRunning ? 'PAUSE' : 'RESUME';
        startBtn.classList.toggle('active', gameState.isRunning);
    });
}

const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        hideMessage();
        initLevel(gameState.currentLevel);
    });
}

const messageBtn = document.getElementById('message-btn');
if (messageBtn) {
    messageBtn.addEventListener('click', () => {
        hideMessage();
        if (gameState.currentLevel < 6) {
            const nextLevel = gameState.currentLevel + 1;
            const nextBtn = document.querySelector(`.level-btn[data-level="${nextLevel}"]`);
            if (nextBtn) {
                nextBtn.click();
            } else {
                initLevel(nextLevel);
            }
        } else {
            initLevel(1);
        }
    });
}

document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        hideMessage();
        initLevel(parseInt(btn.dataset.level));
    });
});

document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        gameState.gameSpeed = parseInt(btn.dataset.speed);
        updateUI();
    });
});

// Game loop
let lastTime = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    // Advance animations
    ringRotation += dt * 1.5;
    flowOffset = (flowOffset + dt * 12 * gameState.gameSpeed) % 15;
    
    if (gameState.isRunning && !gameState.gameOver) {
        gameState.gameTime += dt * gameState.gameSpeed;
        
        updateUnits(dt);
        generateUnits(dt);
        updateFrontlines(dt);
        updateParticles(dt);
        
        aiTimer += dt * gameState.gameSpeed;
        const aiInterval = gameState.currentLevel === 1 ? 8.0 : 5.0;
        
        if (aiTimer >= aiInterval) {
            aiTimer = 0;
            // Level 1 ease: enemy acts passively (35% probability, no upgrades)
            if (gameState.currentLevel !== 1 || Math.random() < 0.35) {
                enemyAI();
            }
            gameState.wave++;
        }
        
        checkGameOver();
    } else {
        // Allow particles to decay slowly while paused
        updateParticles(dt);
    }
    
    updateUI();
    draw();
    requestAnimationFrame(gameLoop);
}

// Canvas dynamic resizing and coordinate rescaling
function applyCanvasResize() {
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    resizeCanvas();
    
    // Scale base positions
    if (gameState.bases && gameState.bases.length > 0) {
        const level = LEVELS[gameState.currentLevel];
        if (level && level.bases) {
            gameState.bases.forEach((base, i) => {
                if (level.bases[i]) {
                    base.x = level.bases[i].x * canvas.width;
                    base.y = level.bases[i].y * canvas.height;
                }
            });
        }
    }
    
    // Re-initialize dynamic decorations to match new canvas sizes
    initFoliageAndStructures();
    
    // Scale active moving unit positions
    if (prevWidth > 0 && prevHeight > 0) {
        const scaleX = canvas.width / prevWidth;
        const scaleY = canvas.height / prevHeight;
        gameState.units.forEach(unit => {
            unit.x *= scaleX;
            unit.y *= scaleY;
            unit.targetX *= scaleX;
            unit.targetY *= scaleY;
        });
        gameState.particles.forEach(p => {
            p.x *= scaleX;
            p.y *= scaleY;
        });
    }
}

// Window resizing handler
window.addEventListener('resize', applyCanvasResize);

// Fullscreen Management
function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
}

function updateFullscreenUI() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const gameContainer = document.getElementById('game-container');
    if (!fullscreenBtn) return;
    
    if (isFullscreen()) {
        fullscreenBtn.textContent = '🗗 EXIT FULL';
        fullscreenBtn.title = 'Exit Fullscreen (Esc or Shift+F)';
        fullscreenBtn.classList.add('active');
        if (gameContainer) gameContainer.classList.add('is-fullscreen');
    } else {
        fullscreenBtn.textContent = '⛶ FULLSCREEN';
        fullscreenBtn.title = 'Toggle Fullscreen (Shift+F)';
        fullscreenBtn.classList.remove('active');
        if (gameContainer) gameContainer.classList.remove('is-fullscreen');
    }
}

function toggleFullscreen() {
    const gameContainer = document.getElementById('game-container');
    if (!isFullscreen()) {
        const target = gameContainer || document.documentElement;
        if (target.requestFullscreen) {
            target.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
        } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
        } else if (target.mozRequestFullScreen) {
            target.mozRequestFullScreen();
        } else if (target.msRequestFullscreen) {
            target.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function initFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    const handleFsChange = () => {
        updateFullscreenUI();
        setTimeout(applyCanvasResize, 50);
        setTimeout(applyCanvasResize, 200);
    };
    
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    
    updateFullscreenUI();
}

// Initialize first run
resizeCanvas();
initFullscreen();
initLevel(1);
requestAnimationFrame(gameLoop);
