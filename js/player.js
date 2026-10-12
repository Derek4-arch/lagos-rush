/* Gidi Rush - the runner (movement state + procedural animation) and the chasing agbero */
(function () {
  'use strict';
  var GR = window.GR, U = GR.U, CFG = GR.CFG, Mo = GR.Models;

  function Player(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    scene.add(this.root);
    var blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: GR.Tex.blob(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    this.blob = blob; scene.add(blob);
    this.bike = Mo.makeOkada(false); this.bike.rotation.y = Math.PI; this.bike.visible = false; this.root.add(this.bike);
    this.shield = Mo.makeShieldBubble(); this.shield.position.y = 1.0; this.shield.visible = false; this.root.add(this.shield);
    this.model = null;
    this.reset();
  }

  Player.prototype.setCharacter = function (def) {
    if (this.model) this.root.remove(this.model.group);
    this.def = def;
    this.model = Mo.makeRunner(def);
    this.root.add(this.model.group);
  };

  Player.prototype.reset = function () {
    this.lane = 0; this.prevLane = 0; this.lat = 0; this.y = 0; this.vy = 0;
    this.sliding = false; this.slideT = 0; this.phase = 0; this.mode = 'idle';
    this.deadT = 0; this.tilt = 0; this.riding = false;
  };

  Player.prototype.setLane = function (lane) {
    lane = U.clamp(lane, -1, 1);
    if (lane === this.lane) return false;
    this.prevLane = this.lane; this.lane = lane;
    this.tilt = (lane - this.prevLane) * 0.35;
    return true;
  };

  Player.prototype.jump = function () {
    if (this.y > 0.05) return false;
    this.vy = this.riding ? CFG.JUMP_V * 0.9 : CFG.JUMP_V;
    this.sliding = false; this.slideT = 0;
    return true;
  };

  Player.prototype.slide = function () {
    if (this.y > 0.05) this.vy = Math.min(this.vy, -24); // slam down
    this.sliding = true; this.slideT = CFG.SLIDE_TIME;
    return true;
  };

  Player.prototype.update = function (dt) {
    if (this.mode === 'dead') return;
    this.lat = U.damp(this.lat, this.lane * CFG.LANE_W, CFG.LANE_RATE, dt);
    this.tilt = U.damp(this.tilt, 0, 6, dt);
    if (this.y > 0 || this.vy > 0) {
      this.vy -= CFG.GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; this.landed = true; }
    }
    if (this.sliding) {
      if (this.y <= 0) this.slideT -= dt;
      if (this.slideT <= 0) this.sliding = false;
    }
  };

  Player.prototype.laneChanging = function () { return Math.abs(this.lat - this.lane * CFG.LANE_W) > 0.35; };

  /* Procedural animation of the low-poly rig */
  Player.prototype.animate = function (dt, speed) {
    var p = this.model; if (!p) return;
    var b = p.body;
    this.bike.visible = this.riding && this.mode !== 'dead';
    var mode = this.mode;
    if (mode === 'idle') {
      this.phase += dt * 2.2;
      b.position.y = 0.92 + Math.sin(this.phase) * 0.02; b.rotation.set(0, 0, 0);
      p.armL.rotation.set(Math.sin(this.phase) * 0.08, 0, 0.12); p.armR.rotation.set(-Math.sin(this.phase) * 0.08, 0, -0.12);
      p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0, 0, 0); p.head.rotation.set(0, Math.sin(this.phase * 0.4) * 0.3, 0);
      return;
    }
    if (mode === 'dead') {
      this.deadT += dt;
      var t = Math.min(1, this.deadT * 3);
      b.rotation.x = U.lerp(0, 1.45, t); b.position.y = U.lerp(0.92, 0.3, t);
      p.armL.rotation.set(-2.6 * t, 0, 0.4); p.armR.rotation.set(-2.4 * t, 0, -0.4);
      p.legL.rotation.set(-0.4 * t, 0, 0); p.legR.rotation.set(0.3 * t, 0, 0);
      return;
    }
    if (this.riding) {
      b.position.y = 0.92 + 0.42; b.rotation.set(-0.25, 0, 0);
      p.legL.rotation.set(1.3, 0, -0.3); p.legR.rotation.set(1.3, 0, 0.3);
      p.armL.rotation.set(1.2, 0, 0); p.armR.rotation.set(1.2, 0, 0);
      p.head.rotation.set(0.15, 0, 0);
      return;
    }
    this.phase += dt * (6 + speed * 0.38);
    var s = Math.sin(this.phase);
    if (this.y > 0.05) {
      b.position.y = 0.92; b.rotation.set(-0.15, 0, 0);
      p.legL.rotation.set(1.1, 0, 0); p.legR.rotation.set(-0.5, 0, 0);
      p.armL.rotation.set(-2.4, 0, 0.3); p.armR.rotation.set(-2.2, 0, -0.3);
    } else if (this.sliding) {
      b.position.y = 0.5; b.rotation.set(1.05, 0, 0);
      p.legL.rotation.set(0.45, 0, 0.05); p.legR.rotation.set(0.6, 0, -0.05);
      p.armL.rotation.set(-1.6, 0, 0.6); p.armR.rotation.set(-1.6, 0, -0.6);
    } else {
      b.position.y = 0.92 + Math.abs(Math.cos(this.phase)) * 0.09;
      b.rotation.set(-0.18, 0, 0);
      p.legL.rotation.set(s * 0.95, 0, 0); p.legR.rotation.set(-s * 0.95, 0, 0);
      p.armL.rotation.set(-s * 0.85, 0, 0.08); p.armR.rotation.set(s * 0.85, 0, -0.08);
      p.head.rotation.set(0.1, 0, 0);
    }
    b.rotation.z = this.tilt * -0.6;
  };

  /* ---------------- The chaser ---------------- */
  function Chaser(scene) {
    this.parts = Mo.makeAgbero();
    this.root = this.parts.group;
    scene.add(this.root);
    var blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: GR.Tex.blob(), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; this.blob = blob; scene.add(blob);
    this.phase = 0; this.mode = 'run';
  }
  Chaser.prototype.animate = function (dt, speed) {
    var p = this.parts;
    if (this.mode === 'cheer') {
      this.phase += dt * 9;
      p.body.position.y = 0.92 + Math.abs(Math.sin(this.phase)) * 0.12; p.body.rotation.set(0, 0, 0);
      p.armL.rotation.set(Math.PI - 0.3 + Math.sin(this.phase) * 0.3, 0, 0.3); p.armR.rotation.set(Math.PI - 0.3 - Math.sin(this.phase) * 0.3, 0, -0.3);
      p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0, 0, 0);
      return;
    }
    this.phase += dt * (6 + speed * 0.4);
    var s = Math.sin(this.phase);
    p.body.position.y = 0.92 + Math.abs(Math.cos(this.phase)) * 0.1; p.body.rotation.set(-0.22, 0, 0);
    p.legL.rotation.set(s * 1.0, 0, 0); p.legR.rotation.set(-s * 1.0, 0, 0);
    p.armL.rotation.set(-s * 0.7, 0, 0.1);
    p.armR.rotation.set(Math.PI * 0.85 + Math.sin(this.phase * 2) * 0.35, 0, -0.2); // waving the ticket
  };

  GR.Player = Player;
  GR.Chaser = Chaser;
})();
