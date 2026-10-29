# 🕹️ Retro Arcade Collection (20 Games)

A master arcade dashboard and complete suite of **20 standalone retro arcade and tactical games** running 100% in the browser. Built using vanilla JavaScript, HTML5 Canvas 2D, and procedural Web Audio API synthesizers (zero external audio or image dependencies).

🎮 **Live Play**: [games.terencelegrange.com](https://games.terencelegrange.com)

![Master Arcade Dashboard](docs/screenshots/dashboard.png)

---

## 🕹️ Featured Games (20 Titles)

| Game | Genre / Year | Description |
|---|---|---|
| **Meteor Strike** | 1979 Vector Arcade | Atari Asteroids tribute with 360° inertia drift, fracturing rocks, and hostile UFOs. |
| **Arkanoid** | 1986 Block Breaker | Taito classic with Vaus paddle, multi-ball, laser blasters, and capsule power-ups. |
| **Bin Chicken** | 2014 Flappy Arcade | Flappy Bird tribute starring the Australian Sacred Ibis navigating wheelie bins. |
| **Bottomer** | 1983 Bar Arcade | Bally Midway Tapper tribute pouring drinks and sliding mugs across 4 bar lanes. |
| **Big Jump** | 1987 Vert Jump | California Games half-pipe BMX & skateboarding tribute with aerial tricks. |
| **Biplane Flyer** | 1917 Flight Combat | Sopwith Camel dogfighting arcade with stall physics, bombing, and zeppelins. |
| **Shongololo** | 1981 Centipede Arcade | Giant African millipede crawling across savanna mushrooms and dodging spiders. |
| **Monkey Jump** | 1981 Platformer | Donkey Kong tribute climbing girders, jumping barrels, and smashing with hammers. |
| **Galactic Shooter** | 1981 Space Shooter | Galaga tribute with Bézier swarm formations, tractor beams, and dual-ship link-ups. |
| **Goodies & Baddies** | 1985 Action Platformer | Ghosts 'n Goblins tribute featuring Sir Arthur, armor stripping, and boss cyclops. |
| **Gorillas** | 1991 Artillery Duel | MS-DOS QBasic ballistic artillery duel lobbing exploding bananas across city skylines. |
| **Space Destroyer II** | 1980 Advanced Shooter | Space Invaders sequel with 5-tier weapon upgrades, force shields, and mega warheads. |
| **Space Destroyer** | 1978 Space Invaders | Classic alien invasion defence with accelerating marching cadence and bunkers. |
| **Sharpshooter** | 1984 Shooting Gallery | Carnival target rifle shooting gallery with moving ducks, cans, and bullseyes. |
| **Fast Car** | 1986 Highway Racer | Sega OutRun pseudo-3D racer weaving through 3-lane traffic against checkpoint clocks. |
| **Safari Run** | 2014 Endless Runner | Serengeti cheetah runner with Baobab trees, vultures, and day-night cycles. |
| **Blockz** | 1984 Tetromino Puzzle | Tetris tribute with Super Rotation System (SRS) kicks, 7-bag shuffle, and hold queue. |
| **Digging** | 1983 CGA Digger | CGA PC tribute excavating tunnels, collecting emeralds, and squashing monsters. |
| **Maze Arcade** | 1980 Pac-Man Tribute | Classic maze dot-eater with 4 distinct ghost AI personalities and energizer pellets. |
| **Tank Wars** | Tactical Strategy | Real-time tactical armor battle conquering enemy production bases with fog of war. |

---

## 🛠️ Technology Stack

- **Vanilla HTML5 & ES Modules**: Every game is 100% self-contained and runs without bundlers or heavy runtimes.
- **Canvas 2D Rendering**: Smooth 60 FPS procedural rendering with CRT scanlines and curved phosphor vignette simulation.
- **Procedural Web Audio Synthesis**: All sound effects (lasers, explosions, chiptunes, engine thrums) are synthesized at runtime in JavaScript using the browser's Web Audio API. Zero external audio downloads.
- **Zero External Runtime Dependencies**: Run locally with any static web server or open files directly.

---

## 🚀 Running Locally

Clone the repository and launch with any static web server:

```bash
git clone https://github.com/terencelegrange/games.git
cd games

# Option 1: Open directly in your browser
open index.html

# Option 2: Use any static server (e.g. npx serve or python)
npx serve .
# or
python3 -m http.server 8000
```

Visit `http://localhost:8000` in your browser to launch the master arcade dashboard.

---

## 📄 License

MIT License. Crafted for retro gaming enthusiasts by Terence Le Grange.
