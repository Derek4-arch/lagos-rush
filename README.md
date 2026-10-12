# Gidi Rush: a Lagos endless runner

Run through the streets of Lagos. Dodge yellow danfos, kekes and okadas, jump open gutters and potholes, slide under owambe banners, take the corners in time, and collect your naira before the agbero catches you.

It's a 3D endless runner in the style of Temple Run. It runs in the browser and works offline, with no installs, accounts or internet connection needed.

## How to run

**Option 1 (simplest):** double-click `index.html`. The game runs straight from the folder.

**Option 2:** double-click `start.bat`. It starts a small local server with Node.js (`C:\Program Files\nodejs\node.exe`) at http://localhost:8080 and opens your browser. If Node.js isn't installed, it opens `index.html` instead.
Manual start: `node server.js 8080 --open`. If port 8080 is busy, it picks the next free port.

Works in up-to-date Chrome, Edge, Firefox and Safari on desktop and mobile. For phones, serve the folder on your Wi-Fi or host it as a static site, then swipe to play.

## Controls

| Action | Keyboard | Touch / mouse |
|---|---|---|
| Change lane | Left / Right arrows (or A / D) | Swipe left / right |
| Turn at a junction | Left / Right arrows (when you reach the corner) | Swipe left / right |
| Jump | Up arrow, W or Space | Swipe up |
| Slide | Down arrow or S (also slams you down mid-air) | Swipe down |
| Pause | P or Esc | Pause button |
| Mute | M | Speaker button / Settings |
| Start / restart | Enter | Tap the button |

## How to play

- You run forward automatically, and you speed up the further you go.
- **Junctions:** the road ends at a T-junction or a corner, marked by yellow chevron signs, a Lekki toll gate, the Balogun Market front, or a "Road closed" barrier on the bridge. Swipe in the direction of the arrows before you reach the wall. If you don't turn, the run is over.
- **Jump over:** potholes, open gutters, generators ("I better pass my neighbour") and roadworks barriers.
- **Slide under:** owambe and birthday banners, and low bridges ("Mind your head").
- **Dodge by changing lanes:** danfo buses, kekes, okadas and market stalls. Clipping the side of one makes you stumble.
- **Cones:** hitting them makes you stumble.
- **The agbero:** he starts right behind you. Each stumble lets him close in. Stumble again before you recover (about 7 seconds) and he catches you.
- **Naira coins:** each coin adds 10 points (20 with Double Kudi) to your score and goes into your naira bank.

### Power-ups

| Power-up | Effect |
|---|---|
| Magnet | Nearby naira flies to you for 10 s |
| Shield | Absorbs one crash or a missed turn (12 s) |
| Double Kudi | Doubles your score for 10 s |
| Okada Boost | Ride an okada for 5 s: much faster, smashes obstacles, auto-turns and pulls in coins |

### Runners

- **Tunde, the Student:** school uniform and backpack, always late for assembly.
- **Amaka, the Market Queen:** an Ankara outfit and gele, straight from Balogun.
- **Chidi, the Footballer:** a green-and-white kit with the number 10 on his back.

### The city

Areas rotate every few roads, and each one has its own sky and lighting:
1. **Lagos Island Market:** busy stalls, umbrellas, suya spots, painted shop signs and water tanks on the roofs.
2. **Lekki:** glass towers, palm trees, billboards and the toll gate.
3. **Third Mainland Bridge:** sunset over the lagoon, canoes and the skyline.

Your best score, total naira banked, number of runs, chosen runner and settings are saved on your device (in the browser's localStorage).

## Project structure

```
lagos-rush/
├── index.html          # main entry (open this)
├── start.bat           # optional: start the local server and open the browser
├── server.js           # optional zero-dependency Node static server
├── css/
│   ├── base.css        # colour tokens, base layout
│   ├── ui.css          # menus, modals, buttons, character select
│   └── hud.css         # in-game HUD, toasts, effects
└── js/
    ├── vendor/three.min.js   # Three.js r158 (MIT), bundled locally for offline play
    ├── utils.js        # helpers, seeded random, storage
    ├── config.js       # tuning, runners, themes, Pidgin flavour text
    ├── textures.js     # procedural canvas textures (Ankara prints, signs, danfo livery, road)
    ├── models.js       # low-poly models built in code (runners, agbero, vehicles, stalls...)
    ├── world.js        # street decoration per road segment and geometry batching
    ├── obstacles.js    # obstacle patterns, coin trails, power-ups
    ├── track.js        # procedural roads, corners and T-junctions
    ├── player.js       # runner movement and animation, the agbero chaser
    ├── renderer.js     # Three.js scene, camera, sky, theme colour blending
    ├── audio.js        # original procedural Afrobeats-style music and sound effects (Web Audio)
    ├── input.js        # keyboard, swipe and mouse-drag input
    ├── ui.js           # screens, HUD, settings
    ├── game.js         # game engine: running, turning, collisions, scoring, camera
    └── main.js         # boot and frame loop
```

All art is generated in code, including the models, Ankara patterns, signs and danfo livery. The music and sound effects are synthesised live with the Web Audio API. There are no images, audio files or hotlinked assets, and nothing is copyrighted apart from the MIT-licensed Three.js library (licence in `js/vendor/THREE-LICENSE.txt`).

## Tips

- Settings → Graphics: choose **Low** on older laptops or phones, or **High** for sharp, high-DPI screens. Turn on "Show FPS" to check performance.
- Add `?seed=123` to the URL to replay the same city layout.
