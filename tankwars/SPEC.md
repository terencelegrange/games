# Tank Wars - Game Specification

## Project Overview
- **Project Name**: Tank Wars
- **Type**: Real-time Strategy / Base Conquest Game
- **Core Functionality**: Capture enemy bases using tanks and helicopters while managing resources
- **Target Users**: PC strategy game enthusiasts

## Visual Specification

### Art Style
- Military/tactical aesthetic with clean, readable UI
- Color palette:
  - Player bases: `#2196F3` (blue)
  - Enemy bases: `#F44336` (red)
  - Neutral bases: `#9E9E9E` (gray)
  - Roads: `#3D3D3D` with dashed center line
  - Background: Dark terrain `#2D2D2D` with subtle grid pattern
  - UI panels: Semi-transparent dark `rgba(20, 20, 20, 0.9)`

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [TANK WARS]                 Wave: 1    Time: 00:00         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                    GAME MAP AREA                        ││
│  │         (Bases connected by roads/air routes)          ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ TANKS: 5 │  │ HELIS: 3 │  │ SELECTED │                  │
│  │  [icon]  │  │  [icon]  │  │   12     │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│  [START WAVE]  [RESTART]           Speed: [1x] [2x] [PAUSE]│
└─────────────────────────────────────────────────────────────┘
```

### Base Visual Design
- Hexagonal or circular base markers
- Unit count displayed above base
- Ownership color as fill
- Armored bases have a shield icon overlay
- Tank bases have tank icon, helicopter bases have heli icon
- Capture number shown inside base

### Animations
- Units traveling along roads (tanks) or directly (helicopters)
- Combat flash effect on battle
- Pulse effect on selected base
- Smooth unit count transitions

## Game Mechanics Specification

### Base Types
| Property | Description |
|----------|-------------|
| Owner | Blue (player), Red (enemy), Gray (neutral) |
| Unit Count | Current units stationed at base |
| Capture Cost | Units required to capture (displayed) |
| Unit Cap | Maximum units this base can hold |
| Base Type | Tank, Helicopter, or Mixed |
| Armored | Boolean - requires 2x attackers if true |

### Unit Generation
- Each owned base generates 1 unit per 2 seconds
- Units accumulate until unit cap is reached
- Unit caps vary by base (5-20 units)

### Combat Rules
1. **Attacker Selection**: Tap base once = 50% of units, tap twice = 100%
2. **Attack Execution**: Tap target base to send selected units
3. **Tank Movement**: Can only travel along roads
4. **Helicopter Movement**: Can fly directly to any base
5. **Capture Calculation**:
   - Standard: `attackers > defenders` = capture
   - Armored bases: `attackers > defenders * 2`
   - Helicopters vs Tank bases: `attackers > defenders * 2`
   - Helicopters vs Mixed/Helicopter bases: normal rules
6. **Post-Battle**: Remaining attackers defend the base

### Win/Lose Conditions
- **Victory**: All enemy bases captured
- **Defeat**: All player bases captured

### Map Topology
- 8-12 bases per level
- Roads connect specific bases (visible lines)
- Helicopters can bypass roads entirely
- Strategic chokepoints via road connections

## Enemy AI Specification

### Behavior Phases
1. **Early Game**: Target nearest neutral bases
2. **Mid Game**: Attack weak player bases, reinforce threatened positions
3. **Late Game**: Concentrate forces for decisive strikes

### AI Decision Making
- Evaluates all possible attacks
- Prioritizes high-value targets (low capture cost, resource generation)
- Avoids suicidal assaults
- Uses helicopters for flanking attacks

## Level Design

### Level 1: Tutorial Valley
- 6 bases: 2 player, 2 neutral, 2 enemy
- Simple linear road layout
- No armored bases
- All mixed-type bases

### Level 2: Iron Ridge
- 8 bases with branching roads
- 1 armored base (neutral)
- 1 tank-only base
- Strategic chokepoint

### Level 3: Eagle's Nest
- 10 bases in clustered formation
- 2 armored bases
- Helicopter advantage paths
- Defensive strongpoint

## Interaction Specification

### Mouse Controls
| Action | Result |
|--------|--------|
| Click base (once) | Select 50% of units |
| Click base (twice) | Select 100% of units |
| Click owned base (third) | Deselect |
| Click target base | Send selected units to attack |
| Right-click | Cancel selection |

### UI Controls
- Start Wave: Begin enemy turn / auto-play
- Restart: Reset level
- Speed: 1x, 2x, Pause game speed

## Audio (Optional Enhancement)
- Ambient military atmosphere
- Unit movement sound
- Combat explosions
- Victory/defeat fanfares

## Technical Implementation
- Platform: HTML5 Canvas + JavaScript
- No external dependencies (vanilla JS)
- Responsive canvas scaling
- 60 FPS target
- State machine for game phases

## Acceptance Criteria
1. ✓ Player can select units from owned bases (50% / 100% toggle)
2. ✓ Units travel along roads (tanks) or directly (helicopters)
3. ✓ Combat resolves correctly per rules
4. ✓ Enemy AI attacks and makes reasonable decisions
5. ✓ Victory/defeat conditions trigger correctly
6. ✓ All three levels playable with distinct topologies
7. ✓ Game runs at stable framerate
8. ✓ UI displays all relevant game state information
