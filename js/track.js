/* Gidi Rush - procedural track made of straight segments joined by corners and T-junctions */
(function () {
  'use strict';
  var GR = window.GR, U = GR.U, CFG = GR.CFG;

  function Track(scene) {
    this.scene = scene;
    this.segments = [];
    this.speedHint = CFG.START_SPEED;
    this.nextId = 1;
  }

  Track.prototype.reset = function (seed, opts) {
    var self = this;
    this.segments.slice().forEach(function (s) { self.removeSegment(s); });
    this.segments = [];
    this.seed = seed >>> 0;
    this.rng = U.rng(this.seed);
    this.opts = opts || {};
    this.speedHint = CFG.START_SPEED;
    var first = this.createSegment({ x: 0, z: 0 }, 0, 0, null);
    this.buildSuccessors(first);
    return first;
  };

  Track.prototype.themeFor = function (depth) {
    return GR.THEME_ORDER[Math.floor(depth / 3) % GR.THEME_ORDER.length];
  };

  Track.prototype.createSegment = function (start, dir, depth, parent) {
    var rng = U.rng(this.seed + depth * 7919 + this.nextId * 104729);
    var first = !parent;
    var seg = {
      id: this.nextId++, start: { x: start.x, z: start.z }, dir: dir, depth: depth, parent: parent,
      L: first ? 175 : Math.round(rng.range(CFG.SEG_MIN, CFG.SEG_MAX)),
      junction: first ? rng.pick(['L', 'R']) : rng.weighted({ L: 0.38, R: 0.38, T: 0.24 }),
      theme: this.themeFor(depth), themeStart: depth % 3 === 0, first: first,
      group: new THREE.Group(), obstacles: [], coins: [], powerups: [], disposables: [], next: {}
    };
    if (this.opts.forceJunction) seg.junction = this.opts.forceJunction;
    seg.group.position.set(start.x, 0, start.z);
    seg.group.rotation.y = U.yaw(dir);
    GR.World.decorate(seg, rng);
    GR.World.mergeStatic(seg); // decor never moves: bake it into a few big meshes
    GR.Obstacles.populate(seg, rng, this.speedHint, { empty: this.opts.empty });
    this.scene.add(seg.group);
    this.segments.push(seg);
    return seg;
  };

  /* Junction centre in world space */
  Track.prototype.junctionPoint = function (seg) {
    var D = U.DIRS[seg.dir];
    return { x: seg.start.x + D.x * seg.L, z: seg.start.z + D.z * seg.L };
  };

  Track.prototype.buildSuccessors = function (seg) {
    if (seg.next.L || seg.next.R) return;
    var J = this.junctionPoint(seg);
    if (seg.junction === 'L' || seg.junction === 'T') seg.next.L = this.createSegment(J, (seg.dir + 3) % 4, seg.depth + 1, seg);
    if (seg.junction === 'R' || seg.junction === 'T') seg.next.R = this.createSegment(J, (seg.dir + 1) % 4, seg.depth + 1, seg);
  };

  /* Player committed to a side: build what comes after it */
  Track.prototype.choose = function (seg, side) {
    var next = seg.next[side];
    this.buildSuccessors(next);
    return next;
  };

  /* Drop everything except the current segment and what lies ahead of it */
  Track.prototype.prune = function (current) {
    var keep = [current];
    if (current.next.L) keep.push(current.next.L);
    if (current.next.R) keep.push(current.next.R);
    var self = this;
    this.segments.slice().forEach(function (s) { if (keep.indexOf(s) < 0) self.removeSegment(s); });
    current.parent = null;
  };

  Track.prototype.removeSegment = function (seg) {
    this.scene.remove(seg.group);
    seg.disposables.forEach(function (g) { g.dispose(); });
    seg.group.traverse(function (o) {
      if (o.isSprite && o.material) o.material.dispose();
    });
    var i = this.segments.indexOf(seg);
    if (i >= 0) this.segments.splice(i, 1);
  };

  /* segment-local (s, lat) -> world */
  Track.toWorld = function (seg, s, lat, y, out) {
    var D = U.DIRS[seg.dir], R = U.DIRS[(seg.dir + 1) % 4];
    out.set(seg.start.x + D.x * s + R.x * lat, y, seg.start.z + D.z * s + R.z * lat);
    return out;
  };

  GR.Track = Track;
})();
