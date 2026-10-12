/* Gidi Rush - core game engine: state machine, running, turning, collisions, power-ups, chaser, camera */
(function () {
  'use strict';
  var GR = window.GR, U = GR.U, CFG = GR.CFG;
  var Y_AXIS = new THREE.Vector3(0, 1, 0);

  function Game(renderer, audio, ui) {
    this.R = renderer; this.audio = audio; this.ui = ui;
    this.scene = renderer.scene; this.camera = renderer.camera;
    this.track = new GR.Track(this.scene);
    this.player = new GR.Player(this.scene);
    this.chaser = new GR.Chaser(this.scene);
    this.pw = new THREE.Vector3(); this.tmp = new THREE.Vector3(); this.camPos = new THREE.Vector3(0, 5, 10);
    this.look = new THREE.Vector3(); this.off = new THREE.Vector3();
    this.camYaw = 0; this.orbit = 0; this.shake = 0; this.menuZoom = 0;
    this.flying = [];
    this.history = [];
    this.god = false;
    this.state = 'boot';
    var q = (location.search || '').match(/seed=(\d+)/);
    this.fixedSeed = q ? parseInt(q[1], 10) : null;
    var chars = GR.CHARACTERS;
    var saved = U.store.get('character', 'tunde');
    this.setCharacter(chars.some(function (c) { return c.id === saved; }) ? saved : 'tunde');
  }

  Game.prototype.setCharacter = function (id) {
    var def = GR.CHARACTERS.filter(function (c) { return c.id === id; })[0] || GR.CHARACTERS[0];
    this.character = def;
    this.player.setCharacter(def);
    U.store.set('character', def.id);
  };

  Game.prototype.newSeed = function () { return this.fixedSeed !== null ? this.fixedSeed : Math.floor(Math.random() * 1e9); };

  /* Attract mode behind the menus */
  Game.prototype.enterMenu = function () {
    this.state = 'menu';
    this.seg = this.track.reset(this.newSeed(), { empty: true });
    this.s = 9; this.speed = 0;
    this.player.reset(); this.player.mode = 'idle';
    this.player.shield.visible = false;
    this.chaser.root.visible = false; this.chaser.blob.visible = false;
    this.theme = this.seg.theme; this.R.setTheme(this.theme, true);
    this.camYaw = 0; this.orbit = 0.6;
    this.placePlayer(0);
    this.camPos.set(this.pw.x + 4, 2.5, this.pw.z + 5);
    this.ui.setHud(false);
    this.ui.danger(false);
  };

  Game.prototype.start = function () {
    this.audio.init();
    this.seed = this.newSeed();
    this.seg = this.track.reset(this.seed);
    this.prevSeg = null;
    this.s = 0; this.distance = 0; this.score = 0; this.coins = 0; this.time = 0; this.turns = 0;
    this.speed = CFG.START_SPEED; this.powers = {}; this.stumbleT = 0; this.slowT = 0; this.introT = 2.6;
    this.pendingTurn = null; this.chaseGap = 1.6; this.nextMilestone = 500; this.junctionsSeen = 0;
    this.history = []; this.flying = []; this.deathT = 0;
    this.player.reset(); this.player.mode = 'run'; this.player.shield.visible = false;
    this.player.root.rotation.set(0, 0, 0);
    this.chaser.root.visible = true; this.chaser.blob.visible = true; this.chaser.mode = 'run';
    this.theme = this.seg.theme; this.R.setTheme(this.theme, true);
    this.camYaw = U.yaw(this.seg.dir); this.orbit = 0;
    this.placePlayer(0);
    this.off.set(0, 3.5, 6.6).applyAxisAngle(Y_AXIS, this.camYaw);
    this.camPos.copy(this.pw).add(this.off);
    this.state = 'running';
    this.ui.setHud(true); this.ui.danger(false);
    this.ui.toast(U.pick(GR.TEXT.start), 'big');
    this.audio.setIntensity(0); this.audio.startMusic();
    this.audio.play('whistle');
  };

  Game.prototype.pause = function () {
    if (this.state !== 'running') return;
    this.state = 'paused'; this.ui.showPause(true);
  };
  Game.prototype.resume = function () {
    if (this.state !== 'paused') return;
    this.state = 'running'; this.ui.showPause(false);
  };

  Game.prototype.turnWindow = function () { return Math.max(11, this.speed * 0.85); };

  Game.prototype.action = function (a) {
    if (this.state !== 'running') return;
    var P = this.player, seg = this.seg;
    if (a === 'left' || a === 'right') {
      var side = a === 'left' ? 'L' : 'R';
      if (this.s > seg.L - this.turnWindow() && seg.next[side]) {
        if (!this.pendingTurn) { this.pendingTurn = side; this.audio.play('turn'); }
        return;
      }
      if (P.setLane(P.lane + (a === 'left' ? -1 : 1))) this.audio.play('lane');
    } else if (a === 'up') {
      if (P.jump()) this.audio.play('jump');
    } else if (a === 'down') {
      P.slide(); this.audio.play('slide');
    }
  };

  Game.prototype.mult = function () { return this.powers && this.powers.double ? 2 : 1; };

  Game.prototype.placePlayer = function (dt) {
    var P = this.player;
    GR.Track.toWorld(this.seg, this.s, P.lat, P.y + (P.riding ? 0 : 0), this.pw);
    P.root.position.copy(this.pw);
    var yaw = U.yaw(this.seg.dir);
    P.root.rotation.y = dt ? U.angleDamp(P.root.rotation.y, yaw, 16, dt) : yaw;
    P.blob.position.set(this.pw.x, 0.03 + (this.onSidewalk ? 0.18 : 0), this.pw.z);
    var sc = Math.max(0.4, 1 - P.y * 0.25);
    P.blob.scale.set(sc, sc, sc);
  };

  /* ---------------- main update ---------------- */
  Game.prototype.update = function (dt) {
    switch (this.state) {
      case 'menu':
        this.player.animate(dt, 0);
        this.placePlayer(dt);
        this.updateCamera(dt);
        break;
      case 'running':
        this.updateRunning(dt);
        if (this.state === 'running' || this.state === 'dying') this.updateCamera(dt);
        break;
      case 'dying':
      case 'over':
        this.updateDying(dt);
        this.updateCamera(dt);
        break;
      case 'paused':
        break;
    }
    this.updateFlying(dt);
  };

  Game.prototype.updateRunning = function (dt) {
    var P = this.player;
    this.time += dt;
    if (this.introT > 0) this.introT -= dt;

    // power-up timers
    for (var k in this.powers) {
      this.powers[k] -= dt;
      if (this.powers[k] <= 0) {
        delete this.powers[k];
        if (k === 'shield') P.shield.visible = false;
        if (k === 'boost') { P.riding = false; this.powers.grace = 1.2; }
      }
    }
    var boost = !!this.powers.boost;
    var base = Math.min(CFG.MAX_SPEED, CFG.START_SPEED + this.distance * CFG.SPEED_RAMP);
    if (this.slowT > 0) this.slowT -= dt;
    var target = base * (boost ? CFG.BOOST_MULT : 1) * (this.slowT > 0 ? 0.72 : 1);
    this.speed = U.damp(this.speed, target, 3, dt);
    this.track.speedHint = base;
    this.audio.setIntensity(U.clamp((base - CFG.START_SPEED) / 10, 0, 1));

    var ds = this.speed * dt;
    this.s += ds; this.distance += ds;
    this.score += ds * this.mult();
    P.update(dt);

    // ---- junctions ----
    var seg = this.seg, L = seg.L;
    if (this.pendingTurn && this.s >= L) {
      this.turn(this.pendingTurn);
    } else if (!this.pendingTurn && this.s >= L - 0.3 && (boost || this.god)) {
      this.turn(this.autoSide(seg));
    } else if (this.s > L + 3.0) {
      if (this.powers.shield || this.powers.grace) {
        this.consumeShield();
        this.turn(this.autoSide(seg));
      } else { return this.die('wall'); }
    }
    seg = this.seg;
    if (this.prevSeg && this.s > 16) { this.track.prune(seg); this.prevSeg = null; }
    var nearJ = this.s > seg.L - this.turnWindow() - 10 && this.s < seg.L + 2;
    this.ui.turnHint(nearJ && !this.pendingTurn && this.junctionsSeen < 2, seg.junction);

    // ---- collisions, coins, power-ups ----
    this.collide(seg);
    if (this.state !== 'running') return;
    this.collect(seg, dt);

    // ---- stumble / chaser ----
    if (this.stumbleT > 0) {
      this.stumbleT -= dt;
      if (this.stumbleT <= 0) this.ui.danger(false);
    }
    var gapTarget = this.stumbleT > 0 ? CFG.CHASE_NEAR : this.introT > 0 ? 2.0 : CFG.CHASE_FAR;
    this.chaseGap = U.damp(this.chaseGap, gapTarget, this.stumbleT > 0 ? 3 : 0.45, dt);

    // milestones
    if (this.distance >= this.nextMilestone) {
      this.ui.toast(this.nextMilestone + 'm! ' + U.pick(GR.TEXT.milestone), 'mid');
      this.nextMilestone += 500;
    }

    this.placePlayer(dt);
    this.recordHistory();
    this.placeChaser(dt);
    P.animate(dt, this.speed);
    P.shield.rotation.y += dt * 1.5;
    this.ui.hud({ score: this.score, coins: this.coins, dist: this.distance, mult: this.mult(), powers: this.powers });
  };

  Game.prototype.autoSide = function (seg) {
    if (seg.next.L && seg.next.R) return Math.random() < 0.5 ? 'L' : 'R';
    return seg.next.L ? 'L' : 'R';
  };

  Game.prototype.turn = function (side) {
    var seg = this.seg, next = seg.next[side], P = this.player;
    if (!next) return;
    var d = this.s - seg.L, lat = P.lat;
    if (side === 'L') { this.s = -lat; P.lat = d; }
    else { this.s = lat; P.lat = -d; }
    this.track.choose(seg, side);
    this.prevSeg = seg; this.seg = next; this.pendingTurn = null;
    this.turns++; this.junctionsSeen++;
    this.score += 25 * this.mult();
    if (next.theme !== this.theme) {
      this.theme = next.theme; this.R.setTheme(next.theme);
      this.ui.toast(GR.THEMES[next.theme].name, 'theme');
    }
  };

  Game.prototype.consumeShield = function () {
    if (this.powers.shield) { delete this.powers.shield; this.player.shield.visible = false; this.ui.toast(GR.TEXT.shieldBreak, 'mid'); }
    this.powers.grace = Math.max(this.powers.grace || 0, 1.0);
    this.audio.play('shield');
  };

  Game.prototype.collide = function (seg) {
    var P = this.player, s = this.s;
    var invuln = this.powers.boost || this.powers.grace;
    for (var i = 0; i < seg.obstacles.length; i++) {
      var o = seg.obstacles[i];
      if (o.hit || o.s1 < s - 0.35 || o.s0 > s + 0.35) continue;
      var overlap = o.full;
      if (!overlap) for (var j = 0; j < o.lanes.length; j++) if (Math.abs(P.lat - o.lanes[j] * CFG.LANE_W) < 1.15) overlap = true;
      if (!overlap) continue;
      if ((o.kind === 'jump' || o.kind === 'minor') && P.y >= o.h) continue;
      if (o.kind === 'slide' && P.sliding) continue;
      if (invuln) { this.smash(o); continue; }
      if (this.god) { o.hit = true; continue; }
      if (o.kind === 'minor') { o.hit = true; this.stumble(); continue; }
      if (o.kind === 'block' && s - o.s0 > 0.8 && P.laneChanging()) { // clipped the side of a vehicle
        P.setLane(P.prevLane); this.stumble(); o.hit = true; continue;
      }
      if (this.powers.shield) { this.consumeShield(); this.smash(o); continue; }
      return this.die(o.type === 'gutter' || o.type === 'pothole' ? 'gutter' : 'crash');
    }
  };

  Game.prototype.smash = function (o) {
    o.hit = true;
    var self = this;
    o.meshes.forEach(function (m) {
      self.flying.push({ m: m, t: 0, vx: (Math.random() - 0.5) * 14, vy: 8 + Math.random() * 4, vz: -(6 + Math.random() * 6), spin: (Math.random() - 0.5) * 10 });
    });
    this.shake = Math.max(this.shake, 0.25);
    this.audio.play('crash');
  };

  Game.prototype.updateFlying = function (dt) {
    for (var i = this.flying.length - 1; i >= 0; i--) {
      var f = this.flying[i]; f.t += dt;
      f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt; f.vy -= 30 * dt;
      f.m.rotation.x += f.spin * dt; f.m.rotation.z += f.spin * 0.7 * dt;
      if (f.t > 1.4) { f.m.visible = false; this.flying.splice(i, 1); }
    }
  };

  Game.prototype.stumble = function () {
    this.shake = Math.max(this.shake, 0.3);
    if (this.stumbleT > 0) return this.die('caught');
    this.stumbleT = CFG.STUMBLE_RECOVER; this.slowT = 0.6;
    this.audio.play('stumble');
    this.ui.toast(U.pick(GR.TEXT.stumble), 'warn');
    this.ui.danger(true);
    var self = this;
    setTimeout(function () { if (self.state === 'running') self.audio.play('whistle'); }, 250);
  };

  Game.prototype.collect = function (seg, dt) {
    var P = this.player;
    var magnet = this.powers.magnet || this.powers.boost;
    var py = P.y + (P.sliding ? 0.5 : 1.0);
    var spin = this.time * 4;
    for (var i = 0; i < seg.coins.length; i++) {
      var c = seg.coins[i];
      if (c.taken) continue;
      var dz = c.s - this.s;
      if (dz > 95) break;
      c.mesh.visible = true;
      c.mesh.rotation.y = spin + c.s;
      if (dz > 60) continue;
      if (dz < -3 && !c.mag) continue;
      if (magnet && dz < 15 && dz > -2) c.mag = true;
      if (c.mag) {
        var m = c.mesh.position, k = 1 - Math.exp(-14 * dt);
        m.x += (P.lat - m.x) * k; m.y += (py - m.y) * k; m.z += (-this.s - m.z) * k;
        if (Math.abs(m.x - P.lat) + Math.abs(m.y - py) + Math.abs(m.z + this.s) < 1.2) this.takeCoin(c);
      } else if (Math.abs(dz) < 0.9 && Math.abs(c.lat - P.lat) < 1.0 && Math.abs(c.y - py) < 1.25) {
        this.takeCoin(c);
      }
    }
    // reveal coins of the road(s) after the junction as they come into view
    var toJ = seg.L - this.s;
    if (toJ < 95) ['L', 'R'].forEach(function (side) {
      var n = seg.next[side]; if (!n) return;
      for (var q = 0; q < n.coins.length; q++) {
        var nc = n.coins[q];
        if (nc.s + toJ > 95) break;
        if (!nc.taken) { nc.mesh.visible = true; nc.mesh.rotation.y = spin + nc.s; }
      }
    });
    for (var j = 0; j < seg.powerups.length; j++) {
      var p = seg.powerups[j];
      if (p.taken) continue;
      p.mesh.position.y = p.y + Math.sin(this.time * 3 + p.s) * 0.15;
      if (p.mesh.userData.ring) p.mesh.userData.ring.rotation.y += dt * 3;
      if (Math.abs(p.s - this.s) < 1.0 && Math.abs(p.lat - P.lat) < 1.1 && Math.abs(p.y - py) < 1.5) {
        p.taken = true; p.mesh.visible = false; this.applyPower(p.type);
      }
    }
  };

  Game.prototype.takeCoin = function (c) {
    c.taken = true; c.mesh.visible = false;
    this.coins += 1; this.score += 10 * this.mult();
    this.audio.play('coin');
    this.ui.coinPulse();
  };

  Game.prototype.applyPower = function (type) {
    this.powers[type] = CFG.POWER[type];
    if (type === 'shield') this.player.shield.visible = true;
    if (type === 'boost') { this.player.riding = true; this.player.sliding = false; this.audio.play('horn'); }
    this.audio.play('power');
    this.ui.toast(GR.TEXT.power[type], 'power');
  };

  Game.prototype.recordHistory = function () {
    var h = this.history, last = h[h.length - 1];
    if (!last || this.distance - last.d > 0.25) {
      h.push({ d: this.distance, x: this.pw.x, z: this.pw.z, yaw: U.yaw(this.seg.dir) });
      if (h.length > 260) h.shift();
    }
  };

  Game.prototype.placeChaser = function (dt) {
    var C = this.chaser, gap = this.chaseGap;
    var show = gap < 15;
    C.root.visible = show; C.blob.visible = show;
    if (!show) return;
    var dTarget = this.distance - gap, h = this.history, pos = null, yaw = 0;
    for (var i = h.length - 1; i > 0; i--) {
      if (h[i - 1].d <= dTarget) {
        var a = h[i - 1], b = h[i], t = (dTarget - a.d) / Math.max(0.0001, b.d - a.d);
        pos = { x: U.lerp(a.x, b.x, t), z: U.lerp(a.z, b.z, t) }; yaw = b.yaw;
        break;
      }
    }
    if (!pos) { // before history starts: extrapolate backwards
      var f = h[0] || { d: this.distance, x: this.pw.x, z: this.pw.z, yaw: U.yaw(this.seg.dir) };
      var back = f.d - dTarget, D = U.DIRS[this.seg.dir];
      pos = { x: f.x - D.x * back, z: f.z - D.z * back }; yaw = f.yaw;
    }
    // run slightly off to the side so the runner stays visible
    var side = this.state === 'running' ? 1.25 : 0.6;
    pos.x += Math.cos(yaw) * side; pos.z += -Math.sin(yaw) * side;
    C.root.position.set(pos.x, 0, pos.z);
    C.root.rotation.y = U.angleDamp(C.root.rotation.y, yaw, 10, dt);
    C.blob.position.set(pos.x, 0.03, pos.z);
    C.animate(dt, this.speed || 14);
  };

  Game.prototype.die = function (reason) {
    if (this.state !== 'running') return;
    this.state = 'dying'; this.deathT = 0; this.deathReason = reason;
    var P = this.player;
    P.mode = 'dead'; P.deadT = 0; P.riding = false; P.sliding = false; P.shield.visible = false;
    this.shake = 0.6;
    this.audio.play('crash');
    this.ui.turnHint(false); this.ui.danger(false);
    this.chaser.mode = 'run';
    if (this.chaseGap > 12) this.chaseGap = 12;
  };

  Game.prototype.updateDying = function (dt) {
    var P = this.player;
    this.deathT += dt;
    P.update(dt);
    if (P.y > 0) { P.vy -= CFG.GRAVITY * dt; P.y = Math.max(0, P.y + P.vy * dt); }
    P.animate(dt, 0);
    this.placePlayer(dt);
    var C = this.chaser;
    this.chaseGap = U.damp(this.chaseGap, 1.5, 2.2, dt);
    if (this.chaseGap < 1.9) C.mode = 'cheer';
    this.placeChaser(dt);
    if (this.state === 'dying' && this.deathT > 1.7) this.finish();
  };

  Game.prototype.finish = function () {
    this.state = 'over';
    this.audio.stopMusic();
    var best = U.store.get('best', 0), score = Math.floor(this.score);
    var isBest = score > best;
    if (isBest) U.store.set('best', score);
    U.store.set('bank', U.store.get('bank', 0) + this.coins);
    U.store.set('runs', U.store.get('runs', 0) + 1);
    U.store.set('bestDist', Math.max(U.store.get('bestDist', 0), Math.floor(this.distance)));
    this.audio.play(isBest ? 'best' : 'over');
    var key = this.deathReason === 'caught' ? 'caught' : this.deathReason === 'gutter' ? 'gutter' : this.deathReason === 'wall' ? 'wall' : 'crash';
    this.ui.setHud(false);
    this.ui.showGameOver({
      score: score, coins: this.coins, distance: Math.floor(this.distance), best: Math.max(best, score), isBest: isBest,
      headline: isBest ? U.pick(GR.TEXT.best) : U.pick(GR.TEXT[key]),
      reason: { caught: 'The agbero caught you.', gutter: 'You fell into a gutter.', wall: 'You missed the turn.', crash: 'You crashed into traffic.' }[key]
    });
  };

  /* ---------------- camera ---------------- */
  Game.prototype.updateCamera = function (dt) {
    var cam = this.camera, P = this.player;
    if (this.state === 'menu') {
      this.orbit += dt * 0.18;
      var portrait = window.innerWidth < window.innerHeight;
      var r = (portrait ? 7.4 : 5.2) - this.menuZoom * 1.4;
      var ang = this.orbit;
      this.tmp.set(this.pw.x + Math.sin(ang) * r, (portrait ? 2.6 : 1.9) + this.menuZoom * 0.1, this.pw.z + Math.cos(ang) * r);
      this.camPos.lerp(this.tmp, 1 - Math.exp(-3 * dt));
      cam.position.copy(this.camPos);
      this.look.set(this.pw.x, portrait ? -0.9 : 1.15, this.pw.z);
      cam.lookAt(this.look);
      if (window.innerWidth > window.innerHeight) { // keep the runner to the right of the menu panel
        cam.translateX(-1.4 + this.menuZoom * 0.4);
      }
      return;
    }
    var targetYaw = U.yaw(this.seg.dir);
    this.camYaw = U.angleDamp(this.camYaw, targetYaw, 6, dt);
    var dead = this.state === 'dying' || this.state === 'over';
    if (dead) this.orbit = U.damp(this.orbit, 0.9, 0.8, dt);
    var portraitCam = window.innerWidth < window.innerHeight;
    var back = dead ? 7.5 : portraitCam ? 6.3 : 6.9, up = dead ? 3.6 : 3.8 + P.y * 0.3 - (P.sliding ? 0.3 : 0);
    this.off.set(0, up, back).applyAxisAngle(Y_AXIS, this.camYaw + this.orbit);
    GR.Track.toWorld(this.seg, this.s, P.lat * 0.72, 0, this.tmp);
    this.tmp.add(this.off);
    this.camPos.x = U.damp(this.camPos.x, this.tmp.x, 14, dt);
    this.camPos.z = U.damp(this.camPos.z, this.tmp.z, 14, dt);
    this.camPos.y = U.damp(this.camPos.y, this.tmp.y, 8, dt);
    cam.position.copy(this.camPos);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      cam.position.x += (Math.random() - 0.5) * this.shake; cam.position.y += (Math.random() - 0.5) * this.shake;
    }
    var fwd = 9;
    this.look.set(-Math.sin(this.camYaw) * fwd, 0, -Math.cos(this.camYaw) * fwd);
    GR.Track.toWorld(this.seg, this.s, P.lat * 0.72, 1.2 + P.y * 0.4, this.tmp);
    if (dead) { this.look.set(0, 0, 0); this.tmp.y = 1.0; }
    this.look.add(this.tmp);
    cam.lookAt(this.look);
    var fov = this.R.baseFov + (this.powers && this.powers.boost ? 8 : 0) + U.clamp((this.speed - CFG.START_SPEED) * 0.25, 0, 5);
    cam.fov = U.damp(cam.fov, fov, 3, dt); cam.updateProjectionMatrix();
  };

  /* Test / debug helpers (used by automated tests) */
  Game.prototype.debug = function () {
    var seg = this.seg || {}, P = this.player;
    var next = null;
    if (seg.obstacles) for (var i = 0; i < seg.obstacles.length; i++) { var o = seg.obstacles[i]; if (o.s1 > this.s && !o.hit) { next = { type: o.type, kind: o.kind, lanes: o.lanes, full: o.full, ahead: o.s0 - this.s }; break; } }
    return {
      state: this.state, s: this.s, L: seg.L, junction: seg.junction, segId: seg.id, dir: seg.dir, theme: seg.theme,
      lane: P.lane, lat: P.lat, y: P.y, sliding: P.sliding, score: Math.floor(this.score || 0), coins: this.coins || 0,
      distance: this.distance || 0, speed: this.speed || 0, turns: this.turns || 0, pendingTurn: this.pendingTurn,
      stumbleT: this.stumbleT || 0, powers: Object.assign({}, this.powers || {}), next: next, character: this.character.id,
      segments: this.track.segments.length
    };
  };

  GR.Game = Game;
})();
