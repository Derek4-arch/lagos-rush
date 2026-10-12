/* Gidi Rush - obstacle patterns, naira coin trails and power-ups for a segment */
(function () {
  'use strict';
  var GR = window.GR, Mo = GR.Models, CFG = GR.CFG;
  var LW = CFG.LANE_W;

  /* kind: jump (clear by jumping), slide (clear by sliding), block (dodge lanes), minor (stumble if hit) */
  var TYPES = {
    pothole:   { kind: 'jump',  h: 0.35, len: 1.5, make: function () { return Mo.makePothole(); } },
    gutter:    { kind: 'jump',  h: 0.35, len: 1.7, full: true, make: function () { return Mo.makeGutter(8.2); } },
    cones:     { kind: 'minor', h: 0.75, len: 0.9, make: function () { return Mo.makeCones(); } },
    generator: { kind: 'jump',  h: 0.95, len: 0.9, make: function () { return Mo.makeGenerator(); } },
    barrier:   { kind: 'jump',  h: 1.0,  len: 0.5, make: function () { return Mo.makeBarrier(); } },
    banner:    { kind: 'slide', len: 0.5, full: true, make: function (rng) { return Mo.makeBanner(rng.pick(GR.BANNERS), rng.int(0, 23)); } },
    lowbridge: { kind: 'slide', len: 1.8, full: true, make: function () { return Mo.makeLowBridge(); } },
    danfo:     { kind: 'block', len: 4.8, make: function () { return Mo.makeDanfo(); } },
    keke:      { kind: 'block', len: 2.6, make: function () { return Mo.makeKeke(); } },
    okada:     { kind: 'block', len: 1.9, make: function () { return Mo.makeOkada(true); } },
    stall:     { kind: 'block', len: 1.4, make: function (rng) { return Mo.makeStall(rng.int(0, 40)); } }
  };

  var VARIANTS = { okada: 4, stall: 6, banner: 8 };
  function build(type, rng) {
    var t = TYPES[type];
    var v = VARIANTS[type] ? rng.int(0, VARIANTS[type] - 1) : 0;
    var r2 = GR.U.rng(v * 977 + type.length * 31);
    return GR.World.bakedModel('obs-' + type + '-' + v, function () { return t.make(r2); });
  }

  function addObstacle(seg, rng, type, s, lanes) {
    var t = { kind: TYPES[type].kind, h: TYPES[type].h, len: TYPES[type].len, full: TYPES[type].full, make: function (r) { return build(type, r); } };
    var o = { type: type, kind: t.kind, h: t.h || 0, s0: s - t.len / 2, s1: s + t.len / 2, lanes: lanes, full: !!t.full, hit: false };
    if (t.full) {
      var m = t.make(rng); GR.World.place(seg, m, 0, s, 0); o.meshes = [m];
    } else {
      o.meshes = lanes.map(function (ln) { var m = t.make(rng); GR.World.place(seg, m, ln * LW, s, 0); return m; });
    }
    seg.obstacles.push(o);
    return o;
  }

  function shuffleLanes(rng) { var a = [-1, 0, 1]; for (var i = 2; i > 0; i--) { var j = rng.int(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function placePattern(seg, rng, s, diff, bridge) {
    var lanes = shuffleLanes(rng);
    var w = {
      single: 3, vehicle: 3.2, twoVehicles: 1.4 + diff * 2, gutter: bridge ? 0.8 : 1.6, banner: 1.4,
      lowbridge: 0.7, mixed: 0.8 + diff * 2.2, barrierRow: 0.6 + diff, cones: 1.1
    };
    var p = rng.weighted(w);
    var len = 3;
    var vehicles = bridge ? ['danfo', 'danfo', 'keke', 'okada'] : ['danfo', 'keke', 'okada', 'danfo'];
    switch (p) {
      case 'single':
        addObstacle(seg, rng, rng.pick(bridge ? ['pothole', 'generator', 'barrier'] : ['pothole', 'generator', 'barrier', 'stall', 'pothole']), s, [lanes[0]]);
        break;
      case 'vehicle':
        var v = rng.pick(vehicles); addObstacle(seg, rng, v, s, [lanes[0]]); len = TYPES[v].len; break;
      case 'twoVehicles':
        addObstacle(seg, rng, 'danfo', s, [lanes[0]]);
        addObstacle(seg, rng, rng.pick(vehicles), s + rng.range(-1, 1), [lanes[1]]);
        len = 5; break;
      case 'gutter': addObstacle(seg, rng, 'gutter', s, [-1, 0, 1]); break;
      case 'banner': addObstacle(seg, rng, 'banner', s, [-1, 0, 1]); break;
      case 'lowbridge': addObstacle(seg, rng, 'lowbridge', s, [-1, 0, 1]); len = 2; break;
      case 'mixed':
        addObstacle(seg, rng, 'danfo', s, [lanes[0]]);
        addObstacle(seg, rng, rng.pick(['pothole', 'generator', 'barrier']), s, [lanes[1]]);
        len = 5; break;
      case 'barrierRow':
        addObstacle(seg, rng, 'barrier', s, [lanes[0], lanes[1]]);
        addObstacle(seg, rng, 'cones', s, [lanes[2]]);
        break;
      case 'cones':
        addObstacle(seg, rng, 'cones', s, [lanes[0]]);
        if (rng.chance(0.5)) addObstacle(seg, rng, 'cones', s, [lanes[1]]);
        break;
    }
    return len;
  }

  function laneBlockedAt(seg, lane, s, pad) {
    var res = null;
    for (var i = 0; i < seg.obstacles.length; i++) {
      var o = seg.obstacles[i];
      if (o.s1 + pad < s || o.s0 - pad > s) continue;
      if (o.full || o.lanes.indexOf(lane) >= 0) {
        if (o.kind === 'block') return o;
        res = o;
      }
    }
    return res;
  }

  function populate(seg, rng, speed, opts) {
    opts = opts || {};
    var diff = GR.U.clamp((speed - CFG.START_SPEED) / (CFG.MAX_SPEED - CFG.START_SPEED), 0, 1);
    var bridge = seg.theme === 'bridge';
    var s = seg.first ? 55 : rng.range(22, 30);
    var end = seg.L - Math.max(20, speed * 0.9 + 6); // keep the turn window clear
    if (!opts.empty) {
      while (s < end) {
        var used = placePattern(seg, rng, s, diff, bridge);
        var gap = Math.max(15, speed * (1.05 - diff * 0.25) + rng.range(2, 10));
        s += used + gap;
      }
    }

    // Naira coin trails
    var cs = seg.first ? 20 : 12, lane = rng.int(-1, 1);
    while (cs < seg.L - 14) {
      var n = rng.int(6, 13);
      for (var k = 0; k < n && cs < seg.L - 14; k++, cs += 2.1) {
        var ob = laneBlockedAt(seg, lane, cs, 1.4);
        var y = 1.0;
        if (ob) {
          if (ob.kind === 'block') { lane = lane === 0 ? (rng.chance(0.5) ? -1 : 1) : 0; continue; }
          if (ob.kind === 'jump' || ob.kind === 'minor') {
            var mid = (ob.s0 + ob.s1) / 2; var dd = Math.abs(cs - mid);
            y = (ob.h || 0.5) + 1.5 - dd * 0.25;
          }
          if (ob.kind === 'slide') y = 0.55;
        }
        var c = Mo.makeCoin();
        c.visible = cs < 95; // far coins are revealed as the runner approaches
        GR.World.place(seg, c, lane * LW, cs, y);
        seg.coins.push({ s: cs, lat: lane * LW, y: y, mesh: c, taken: false, mag: false });
      }
      cs += rng.range(6, 16);
      if (rng.chance(0.6)) lane = GR.U.clamp(lane + (rng.chance(0.5) ? 1 : -1), -1, 1);
    }

    // One power-up now and then
    if (!opts.empty && !seg.first && rng.chance(0.6)) {
      for (var tries = 0; tries < 8; tries++) {
        var ps = rng.range(30, seg.L - 30), pl = rng.int(-1, 1);
        if (laneBlockedAt(seg, pl, ps, 4)) continue;
        var type = rng.weighted({ magnet: 3, shield: 2.5, double: 2.5, boost: 2 });
        var m = Mo.makePowerup(type);
        GR.World.place(seg, m, pl * LW, ps, 1.3);
        seg.powerups.push({ s: ps, lat: pl * LW, y: 1.3, type: type, mesh: m, taken: false });
        // drop coins that would overlap the power-up
        seg.coins.forEach(function (c) { if (!c.taken && Math.abs(c.s - ps) < 1.6 && Math.abs(c.lat - pl * LW) < 0.5) { c.taken = true; c.mesh.visible = false; } });
        break;
      }
    }
  }

  GR.Obstacles = { TYPES: TYPES, populate: populate };
})();
