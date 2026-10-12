/* Gidi Rush - low-poly models built in code (runners, agbero, danfo, keke, okada, stalls, buildings...) */
(function () {
  'use strict';
  var GR = window.GR;
  var Tex = GR.Tex;
  var matCache = {}, geoCache = {};

  function M(color, opts) {
    var key = color + (opts ? JSON.stringify(opts) : '');
    if (!matCache[key]) matCache[key] = new THREE.MeshLambertMaterial(Object.assign({ color: color, flatShading: true }, opts || {}));
    return matCache[key];
  }
  function MT(key, tex, opts) {
    if (!matCache['t' + key]) matCache['t' + key] = new THREE.MeshLambertMaterial(Object.assign({ map: tex }, opts || {}));
    return matCache['t' + key];
  }
  function geo(key, make) { if (!geoCache[key]) { geoCache[key] = make(); geoCache[key].userData.shared = true; } return geoCache[key]; }
  function box(w, h, d) { return geo('b' + w + '_' + h + '_' + d, function () { return new THREE.BoxGeometry(w, h, d); }); }
  function cyl(rt, rb, h, s) { return geo('c' + rt + '_' + rb + '_' + h + '_' + s, function () { return new THREE.CylinderGeometry(rt, rb, h, s || 8); }); }
  function sph(r, d) { return geo('s' + r + '_' + d, function () { return new THREE.IcosahedronGeometry(r, d); }); }
  function cone(r, h, s) { return geo('k' + r + '_' + h + '_' + s, function () { return new THREE.ConeGeometry(r, h, s || 8); }); }
  function plane(w, h) { return geo('p' + w + '_' + h, function () { return new THREE.PlaneGeometry(w, h); }); }
  function mesh(g, m, x, y, z, parent) {
    var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(o);
    return o;
  }
  function ankaraMat(seed) { return MT('ank' + seed, Tex.ankara(seed)); }

  /* ---------------- Characters ---------------- */
  function makeHumanoid(c, opts) {
    opts = opts || {};
    var g = new THREE.Group(), body = new THREE.Group();
    body.position.y = 0.92; g.add(body);
    var skin = M(c.skin);
    var shirt = c.shirt === 'ankara' ? ankaraMat(opts.ankara || 2) : M(c.shirt);
    var sleeve = c.sleeve === 'ankara' ? shirt : M(c.sleeve);
    var upper = c.upperLeg === 'ankara' ? shirt : M(c.upperLeg);
    var torso = mesh(box(0.58, 0.68, 0.32), shirt, 0, 0.38, 0, body);
    var headG = new THREE.Group(); headG.position.y = 0.88; body.add(headG);
    mesh(cyl(0.09, 0.1, 0.16, 8), skin, 0, -0.1, 0, headG);
    var head = mesh(sph(0.24, 1), skin, 0, 0.12, 0, headG); head.scale.set(0.95, 1.1, 1);
    var hairGeo = geo('hair', function () { return new THREE.SphereGeometry(0.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.1); });
    var hair = mesh(hairGeo, M(c.hair), 0, 0.15, 0.01, headG); hair.scale.set(0.97, 0.9, 1.02);
    mesh(box(0.07, 0.04, 0.02), M('#111'), -0.08, 0.15, -0.23, headG);
    mesh(box(0.07, 0.04, 0.02), M('#111'), 0.08, 0.15, -0.23, headG);

    function arm(side) {
      var p = new THREE.Group(); p.position.set(side * 0.37, 0.66, 0); body.add(p);
      mesh(box(0.18, 0.3, 0.18), sleeve, 0, -0.12, 0, p);
      mesh(box(0.14, 0.32, 0.14), skin, 0, -0.41, 0, p);
      mesh(sph(0.085, 0), skin, 0, -0.6, 0, p);
      return p;
    }
    function leg(side) {
      var p = new THREE.Group(); p.position.set(side * 0.15, 0.04, 0); body.add(p);
      mesh(box(0.23, 0.46, 0.25), upper, 0, -0.2, 0, p);
      mesh(box(0.19, 0.42, 0.2), M(c.lowerLeg), 0, -0.62, 0, p);
      mesh(box(0.21, 0.12, 0.34), M(c.shoe), 0, -0.86, -0.05, p);
      return p;
    }
    var parts = { group: g, body: body, torso: torso, head: headG, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1) };
    return parts;
  }

  function makeRunner(def) {
    var c = def.colors;
    var p = makeHumanoid(c, { ankara: 14 });
    var b = p.body;
    if (def.id === 'tunde') {
      var bag = mesh(box(0.46, 0.52, 0.2), M(c.accent), 0, 0.42, 0.27, b);
      mesh(box(0.36, 0.16, 0.06), M('#5a1520'), 0, 0.28, 0.39, b);
      mesh(box(0.06, 0.6, 0.04), M('#2a2a2a'), -0.18, 0.42, -0.17, b);
      mesh(box(0.06, 0.6, 0.04), M('#2a2a2a'), 0.18, 0.42, -0.17, b);
      mesh(box(0.1, 0.1, 0.02), M('#203a72'), 0.15, 0.55, -0.17, b); // school badge
      mesh(box(0.6, 0.04, 0.34), M('#203a72'), 0, 0.06, 0, b); // belt
      p.extra = bag;
    } else if (def.id === 'amaka') {
      var wrap = mesh(cyl(0.31, 0.4, 0.62, 10), ankaraMat(14), 0, -0.22, 0, b);
      var gm = ankaraMat(9);
      var g1 = mesh(cyl(0.29, 0.25, 0.2, 10), gm, 0, 0.3, 0.02, p.head); g1.rotation.x = -0.25;
      var g2 = mesh(box(0.62, 0.3, 0.12), gm, 0, 0.42, 0.12, p.head); g2.rotation.x = -0.5;
      var g3 = mesh(box(0.36, 0.36, 0.1), gm, 0.18, 0.46, 0.1, p.head); g3.rotation.set(-0.4, 0, 0.6);
      mesh(sph(0.04, 0), M('#ffd23f', { emissive: '#553300' }), -0.24, 0.05, 0, p.head);
      mesh(sph(0.04, 0), M('#ffd23f', { emissive: '#553300' }), 0.24, 0.05, 0, p.head);
      p.extra = wrap;
    } else {
      var back = mesh(plane(0.5, 0.55), MT('jersey', Tex.jerseyBack()), 0, 0.4, 0.165, b);
      mesh(box(0.6, 0.08, 0.34), M('#ffffff'), 0, 0.72, 0, b); // collar trim
      var band = mesh(cyl(0.255, 0.255, 0.06, 12), M('#ffffff'), 0, 0.2, 0, p.head);
      p.extra = back; p.band = band;
    }
    return p;
  }

  function makeAgbero() {
    var c = { skin: '#4e3220', shirt: '#f2c230', sleeve: '#4e3220', upperLeg: '#2b2b2b', lowerLeg: '#4e3220', shoe: '#c1272d', hair: '#111' };
    var p = makeHumanoid(c);
    var cap = mesh(cyl(0.27, 0.27, 0.12, 12), M('#c1272d'), 0, 0.3, 0, p.head);
    mesh(box(0.34, 0.03, 0.2), M('#c1272d'), 0, 0.26, -0.26, p.head);
    mesh(box(0.6, 0.12, 0.33), M('#111'), 0, 0.68, 0, p.body); // singlet trim
    mesh(cyl(0.035, 0.035, 0.38, 6), M('#ffffff'), 0, -0.68, -0.08, p.armR).rotation.x = 1.3; // ticket roll
    mesh(sph(0.05, 0), M('#c0c0c0'), 0, 0.05, -0.24, p.head); // whistle
    p.group.scale.setScalar(1.04);
    p.cap = cap;
    return p;
  }

  /* ---------------- Vehicles & obstacles (front faces +z, toward the oncoming runner) ---------------- */
  function wheel(parent, x, y, z, r, w) {
    var m = mesh(cyl(r || 0.42, r || 0.42, w || 0.3, 12), M('#151515'), x, y, z, parent);
    m.rotation.z = Math.PI / 2;
    mesh(cyl((r || 0.42) * 0.5, (r || 0.42) * 0.5, (w || 0.3) + 0.02, 8), M('#9a9a9a'), x, y, z, parent).rotation.z = Math.PI / 2;
    return m;
  }

  function makeDanfo() {
    var g = new THREE.Group();
    var side = MT('danfoSide', Tex.danfoSide()), yellow = M('#f7c21b');
    var mats = [side, side, yellow, M('#222'), MT('danfoFront', Tex.danfoFront()), MT('danfoBack', Tex.danfoBack())];
    var body = new THREE.Mesh(box(2.0, 1.85, 4.8), mats); body.position.y = 1.3; g.add(body);
    mesh(box(1.7, 0.12, 3.6), M('#333'), 0, 2.28, 0, g); // roof rack
    mesh(box(2.06, 0.22, 0.2), M('#333'), 0, 0.42, 2.42, g);
    mesh(box(2.06, 0.22, 0.2), M('#333'), 0, 0.42, -2.42, g);
    wheel(g, -0.98, 0.42, 1.55); wheel(g, 0.98, 0.42, 1.55); wheel(g, -0.98, 0.42, -1.55); wheel(g, 0.98, 0.42, -1.55);
    mesh(box(0.12, 0.2, 0.08), M('#111'), -1.08, 1.8, 2.25, g); mesh(box(0.12, 0.2, 0.08), M('#111'), 1.08, 1.8, 2.25, g);
    return g;
  }

  function makeKeke() {
    var g = new THREE.Group();
    var y = M('#f7c21b'), green = M('#0b8a3e'), dark = M('#1b1b1b');
    mesh(box(1.4, 0.75, 1.9), y, 0, 0.75, -0.25, g);
    mesh(box(1.42, 0.14, 1.92), green, 0, 0.62, -0.25, g);
    mesh(box(1.0, 0.8, 0.6), y, 0, 0.7, 0.95, g);
    mesh(box(1.25, 0.06, 0.6), M('#9fd3ff', { transparent: true, opacity: 0.55 }), 0, 1.45, 0.92, g).rotation.x = -0.35;
    mesh(box(1.5, 0.1, 2.5), dark, 0, 2.02, -0.05, g);
    mesh(box(0.08, 0.9, 0.08), dark, -0.68, 1.55, -1.15, g); mesh(box(0.08, 0.9, 0.08), dark, 0.68, 1.55, -1.15, g);
    mesh(box(0.08, 0.6, 0.08), dark, -0.45, 1.7, 1.1, g); mesh(box(0.08, 0.6, 0.08), dark, 0.45, 1.7, 1.1, g);
    mesh(box(1.52, 0.18, 2.52), green, 0, 1.92, -0.05, g);
    wheel(g, 0, 0.32, 1.15, 0.32, 0.2); wheel(g, -0.7, 0.32, -0.8, 0.32, 0.2); wheel(g, 0.7, 0.32, -0.8, 0.32, 0.2);
    mesh(sph(0.1, 0), M('#fffbe0', { emissive: '#777755' }), 0, 0.95, 1.27, g);
    return g;
  }

  function makeOkada(withRider) {
    var g = new THREE.Group();
    var red = M('#c1272d'), dark = M('#1a1a1a'), chrome = M('#bdbdbd');
    var w1 = mesh(cyl(0.36, 0.36, 0.12, 14), dark, 0, 0.36, 0.72, g); w1.rotation.z = Math.PI / 2;
    var w2 = mesh(cyl(0.36, 0.36, 0.14, 14), dark, 0, 0.36, -0.68, g); w2.rotation.z = Math.PI / 2;
    mesh(box(0.28, 0.36, 1.1), red, 0, 0.72, 0, g);
    mesh(box(0.3, 0.16, 0.8), dark, 0, 0.98, -0.25, g);
    mesh(box(0.24, 0.28, 0.32), red, 0, 0.98, 0.45, g);
    mesh(box(0.06, 0.6, 0.06), chrome, 0, 0.75, 0.72, g).rotation.x = -0.3;
    mesh(box(0.78, 0.05, 0.05), chrome, 0, 1.18, 0.62, g);
    mesh(sph(0.09, 0), M('#fffbe0', { emissive: '#666644' }), 0, 1.02, 0.66, g);
    mesh(cyl(0.05, 0.06, 0.6, 6), chrome, 0.2, 0.45, -0.4, g).rotation.x = Math.PI / 2;
    if (withRider) {
      var c = { skin: '#4f3322', shirt: GR.U.pick(['#2a6f97', '#7b2cbf', '#e76f51', '#2b9348']), sleeve: '#4f3322', upperLeg: '#333', lowerLeg: '#333', shoe: '#111', hair: '#111' };
      var r = makeHumanoid(c);
      r.group.position.set(0, 0.2, -0.2); r.group.rotation.y = Math.PI; r.body.rotation.x = -0.2;
      r.legL.rotation.set(1.3, 0, -0.3); r.legR.rotation.set(1.3, 0, 0.3);
      r.armL.rotation.x = 1.2; r.armR.rotation.x = 1.2;
      mesh(sph(0.3, 1), M('#111'), 0, 0.17, 0, r.head).scale.set(1, 0.9, 1.05);
      g.add(r.group);
    }
    return g;
  }

  function makeGenerator() {
    var g = new THREE.Group();
    var t = MT('gen', Tex.generator());
    var red = M('#d62828');
    mesh(box(1.2, 0.04, 0.8), M('#222'), 0, 0.02, 0, g);
    var b = new THREE.Mesh(box(1.1, 0.68, 0.72), [red, red, M('#ffba08'), red, t, t]); b.position.y = 0.42; g.add(b);
    mesh(box(1.2, 0.06, 0.06), M('#222'), 0, 0.8, 0.36, g); mesh(box(1.2, 0.06, 0.06), M('#222'), 0, 0.8, -0.36, g);
    mesh(cyl(0.05, 0.05, 0.3, 6), M('#444'), 0.4, 0.9, 0, g);
    return g;
  }

  function makeCones() {
    var g = new THREE.Group();
    var o = M('#ff6b00'), w = M('#ffffff');
    [-0.6, 0, 0.6].forEach(function (x, i) {
      mesh(box(0.44, 0.05, 0.44), o, x, 0.025, i % 2 ? 0.2 : -0.1, g);
      mesh(cone(0.18, 0.7, 10), o, x, 0.38, i % 2 ? 0.2 : -0.1, g);
      mesh(cyl(0.115, 0.135, 0.1, 10), w, x, 0.42, i % 2 ? 0.2 : -0.1, g);
    });
    return g;
  }

  function makePothole() {
    var g = new THREE.Group();
    var hole = mesh(geo('pot', function () { return new THREE.CircleGeometry(1, 9); }), M('#2b2622'), 0, 0.025, 0, g);
    hole.rotation.x = -Math.PI / 2; hole.scale.set(0.95, 0.8, 1);
    var water = mesh(geo('pot2', function () { return new THREE.CircleGeometry(0.75, 9); }), M('#5b6a5a', { emissive: '#1a221c' }), 0.05, 0.03, 0.05, g);
    water.rotation.x = -Math.PI / 2; water.scale.set(0.9, 0.7, 1);
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2;
      var r = mesh(box(0.35, 0.08, 0.2), M('#5a5650'), Math.cos(a) * 0.95, 0.04, Math.sin(a) * 0.78, g); r.rotation.y = -a;
    }
    return g;
  }

  function makeGutter(width) {
    var g = new THREE.Group();
    var w = width || 8.2;
    var ch = mesh(plane(w, 1.6), M('#20302a', { emissive: '#0c1410' }), 0, 0.02, 0, g); ch.rotation.x = -Math.PI / 2;
    mesh(box(w, 0.14, 0.22), M('#9a958c'), 0, 0.07, 0.85, g);
    mesh(box(w, 0.14, 0.22), M('#9a958c'), 0, 0.07, -0.85, g);
    for (var i = 0; i < 5; i++) { var bit = mesh(box(0.3, 0.06, 0.2), M(i % 2 ? '#6d8f3a' : '#3c5a7a'), -3 + i * 1.5, 0.05, (i % 3 - 1) * 0.3, g); bit.rotation.y = i; }
    return g;
  }

  function makeBanner(text, seed) {
    var g = new THREE.Group();
    var pole = M('#5b4a3a');
    mesh(cyl(0.07, 0.07, 2.4, 6), pole, -4.45, 1.2, 0, g);
    mesh(cyl(0.07, 0.07, 2.4, 6), pole, 4.45, 1.2, 0, g);
    var t = MT('ban' + text + seed, Tex.banner(text, seed), { side: THREE.DoubleSide });
    var b = new THREE.Mesh(box(8.9, 0.95, 0.04), [M('#fff'), M('#fff'), M('#fff'), M('#fff'), t, t]);
    b.position.y = 1.68; g.add(b);
    mesh(box(8.9, 0.03, 0.03), M('#222'), 0, 2.18, 0, g);
    return g;
  }

  function makeLowBridge() {
    var g = new THREE.Group();
    var conc = M('#b8b2a7');
    mesh(box(1.0, 2.2, 1.4), conc, -5.3, 1.1, 0, g); mesh(box(1.0, 2.2, 1.4), conc, 5.3, 1.1, 0, g);
    mesh(box(11.6, 0.8, 1.8), conc, 0, 1.6, 0, g);
    mesh(box(11.6, 0.6, 0.12), M('#0b8a3e'), 0, 2.3, 0.86, g);
    var s = mesh(plane(3.2, 0.5), MT('mindhead', Tex.sign('MIND YOUR HEAD', '#ffd23f', '#111', 512, 80)), 0, 1.6, 0.91, g);
    for (var i = -5; i <= 5; i++) mesh(box(0.06, 0.6, 0.06), M('#555'), i * 1.05, 2.3, -0.8, g);
    return g;
  }

  function makeBarrier() {
    var g = new THREE.Group();
    var t = MT('stripe', Tex.stripes('#ffffff', '#d62828'));
    mesh(box(2.0, 0.32, 0.08), t, 0, 0.78, 0, g);
    mesh(box(2.0, 0.22, 0.08), t, 0, 0.36, 0, g);
    [-0.85, 0.85].forEach(function (x) { mesh(box(0.08, 0.95, 0.5), M('#333'), x, 0.47, 0, g); });
    mesh(sph(0.08, 0), M('#ffb300', { emissive: '#aa6600' }), -0.85, 1.0, 0, g);
    return g;
  }

  function makeStall(seed) {
    var g = new THREE.Group();
    var wood = M('#8b5a2b');
    mesh(box(1.8, 0.85, 1.3), wood, 0, 0.43, 0, g);
    mesh(box(1.9, 0.08, 1.4), M('#6b4220'), 0, 0.88, 0, g);
    var cols = ['#d62828', '#f77f00', '#fcbf49', '#2a9d8f'];
    for (var i = 0; i < 9; i++) mesh(sph(0.13, 0), M(cols[(i + seed) % 4]), -0.6 + (i % 3) * 0.6 + (i % 2) * 0.1, 1.0 + Math.floor(i / 3) * 0.03, -0.35 + Math.floor(i / 3) * 0.35, g);
    mesh(cyl(0.04, 0.04, 2.3, 6), M('#444'), 0, 1.15, 0, g);
    var u = mesh(cone(1.35, 0.6, 8), ankaraMat(seed % 24), 0, 2.45, 0, g);
    return g;
  }

  /* ---------------- Decor ---------------- */
  function makeBuilding(o) {
    var g = new THREE.Group();
    // one shared material per palette; window tiling is baked into the UVs instead of per-building textures
    var mat = MT('bw' + o.wall + o.glass + o.kind, Tex.windows(o.wall, o.glass, o.kind));
    var bg = new THREE.BoxGeometry(o.w, o.h, o.d), uv = bg.attributes.uv;
    var ry = Math.max(1, Math.round(o.h / 3));
    for (var i = 0; i < uv.count; i++) {
      var face = Math.floor(i / 4), rx = Math.max(1, Math.round((face < 2 ? o.d : o.w) / 3));
      uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry);
    }
    var roof = M(o.roof || '#8d8d8d');
    var b = new THREE.Mesh(bg, [mat, mat, roof, roof, mat, mat]);
    b.position.y = o.h / 2; g.add(b);
    if (o.kind !== 'glass') mesh(box(o.w + 0.3, 0.25, o.d + 0.3), M(o.trim || '#ffffff'), 0, o.h + 0.12, 0, g);
    if (o.tank) {
      mesh(cyl(0.6, 0.6, 1.1, 10), M('#1d1d1d'), o.w * 0.2, o.h + 0.8, 0, g);
      mesh(box(0.06, 0.6, 0.06), M('#444'), o.w * 0.2 - 0.4, o.h + 0.3, 0.4, g);
    }
    if (o.kind === 'glass') mesh(box(o.w * 0.6, 1.2, o.d * 0.6), M('#cfd8dc'), 0, o.h + 0.6, 0, g);
    return g;
  }

  function makeSignboard(text, bg, fg, w) {
    w = w || 4;
    return new THREE.Mesh(plane(w, w / 4.2), MT('sg' + text + bg, Tex.sign(text, bg, fg)));
  }

  function makePalm(seed) {
    var g = new THREE.Group();
    var trunk = M('#8a6a4a');
    for (var i = 0; i < 6; i++) {
      var t = mesh(cyl(0.16 - i * 0.012, 0.19 - i * 0.012, 1.0, 6), trunk, Math.sin(i * 0.5) * 0.08 * i, 0.5 + i * 0.95, 0, g);
      t.rotation.z = 0.05 * i * (seed % 2 ? 1 : -1);
    }
    var top = new THREE.Group(); top.position.set(0.25 * (seed % 2 ? 1 : -1), 5.7, 0); g.add(top);
    var leaf = M('#2f8f3a');
    for (var k = 0; k < 7; k++) {
      var l = mesh(box(0.5, 0.06, 2.6), leaf, 0, 0, 0, top);
      l.geometry = box(0.5, 0.06, 2.6);
      var piv = new THREE.Group(); piv.rotation.y = k / 7 * Math.PI * 2; top.add(piv);
      l.position.set(0, -0.35, 1.2); l.rotation.x = 0.45; piv.add(l);
    }
    mesh(sph(0.25, 0), M('#6b4f2a'), 0, -0.1, 0, top);
    return g;
  }

  function makeLamp(side) {
    var g = new THREE.Group();
    var m = M('#3a3f45');
    mesh(cyl(0.07, 0.1, 5.2, 6), m, 0, 2.6, 0, g);
    mesh(box(1.4, 0.08, 0.1), m, -side * 0.65, 5.1, 0, g);
    mesh(box(0.5, 0.12, 0.25), M('#fff7d6', { emissive: '#ffe9a8' }), -side * 1.25, 5.0, 0, g);
    return g;
  }

  function makeBystander(rng) {
    var shirts = ['#e76f51', '#2a9d8f', '#e9c46a', '#8338ec', '#3a86ff', '#ff006e', 'ankara'];
    var c = { skin: rng.pick(['#5c3a21', '#6a4127', '#7a4b2a', '#4e3220']), shirt: rng.pick(shirts), sleeve: 'ankara', upperLeg: rng.pick(['#333', '#1f3b73', '#6b4f2a', 'ankara']), lowerLeg: '#333', shoe: '#222', hair: '#111' };
    c.sleeve = c.shirt; c.lowerLeg = c.skin;
    var p = makeHumanoid(c, { ankara: rng.int(0, 23) });
    p.armL.rotation.x = rng.range(-0.3, 0.3); p.armR.rotation.x = rng.range(-0.8, 0.3);
    if (rng.chance(0.35)) { // head-load tray
      mesh(cyl(0.45, 0.4, 0.1, 10), M('#c9a227'), 0, 0.4, 0, p.head);
      for (var i = 0; i < 4; i++) mesh(sph(0.12, 0), M(rng.pick(['#ffb703', '#d62828', '#8ac926'])), -0.2 + (i % 2) * 0.4, 0.5, -0.15 + Math.floor(i / 2) * 0.3, p.head);
      p.armR.rotation.set(Math.PI, 0, -0.3);
    }
    return p.group;
  }

  function makeSuya() {
    var g = new THREE.Group();
    mesh(box(1.6, 0.9, 0.8), M('#5a3b22'), 0, 0.45, 0, g);
    mesh(box(1.5, 0.1, 0.7), M('#222'), 0, 0.95, 0, g);
    mesh(box(1.3, 0.05, 0.5), M('#ff5a1f', { emissive: '#c43a00' }), 0, 1.0, 0, g);
    for (var i = 0; i < 6; i++) mesh(box(0.06, 0.06, 0.6), M('#7a3b16'), -0.5 + i * 0.2, 1.06, 0, g);
    mesh(cyl(0.04, 0.04, 1.6, 6), M('#555'), -0.75, 1.7, 0, g); mesh(cyl(0.04, 0.04, 1.6, 6), M('#555'), 0.75, 1.7, 0, g);
    var s = makeSignboard('SUYA SPOT', '#7a1f2b', '#ffd23f', 1.7); s.position.set(0, 2.45, 0); g.add(s);
    return g;
  }

  function makeArch(text) {
    var g = new THREE.Group();
    var m = M('#0b8a3e'), w = M('#ffffff');
    mesh(box(0.7, 6.4, 0.7), m, -5.6, 3.2, 0, g); mesh(box(0.7, 6.4, 0.7), m, 5.6, 3.2, 0, g);
    mesh(box(12, 1.3, 0.5), w, 0, 6.2, 0, g);
    mesh(box(12, 0.25, 0.55), m, 0, 5.45, 0, g); mesh(box(12, 0.25, 0.55), m, 0, 6.95, 0, g);
    var s = new THREE.Mesh(plane(10.5, 1.1), MT('arch' + text, Tex.sign(text, '#ffffff', '#0b8a3e', 1024, 110)));
    s.position.set(0, 6.2, 0.27); g.add(s);
    return g;
  }

  function makeBillboard(text, seed) {
    var g = new THREE.Group();
    mesh(box(0.3, 6, 0.3), M('#444'), -2.4, 3, 0, g); mesh(box(0.3, 6, 0.3), M('#444'), 2.4, 3, 0, g);
    var colors = [['#0b8a3e', '#ffffff'], ['#111111', '#ffd23f'], ['#c1272d', '#ffffff'], ['#3a0ca3', '#ffd60a']][seed % 4];
    var b = new THREE.Mesh(box(7, 2.6, 0.2), [M('#333'), M('#333'), M('#333'), M('#333'), MT('bb' + text, Tex.sign(text, colors[0], colors[1], 700, 260)), M('#333')]);
    b.position.y = 6.6; g.add(b);
    return g;
  }

  function makeTollGate() {
    var g = new THREE.Group();
    var w = M('#f4f4f4'), gr = M('#0b8a3e');
    mesh(box(26, 0.9, 6), w, 0, 6.4, 0, g);
    mesh(box(26.2, 0.3, 6.2), gr, 0, 5.85, 0, g);
    var s = new THREE.Mesh(plane(12, 1.4), MT('toll', Tex.sign('LEKKI TOLL GATE', '#0b8a3e', '#ffffff', 1024, 120)));
    s.position.set(0, 7.6, 2.9); g.add(s);
    mesh(box(12.4, 1.6, 0.2), M('#ffffff'), 0, 7.6, 2.8, g);
    for (var i = -3; i <= 3; i++) {
      mesh(box(1.2, 2.6, 2.2), w, i * 3.4, 1.3, 0, g);
      mesh(box(1.25, 0.6, 2.25), gr, i * 3.4, 2.4, 0, g);
      mesh(box(0.15, 4.4, 0.15), M('#999'), i * 3.4 - 0.4, 3.6, -1, g);
      var arm = mesh(box(2.4, 0.12, 0.12), MT('stripe', Tex.stripes('#ffffff', '#d62828')), i * 3.4 + 1.6, 1.15, 1.0, g);
    }
    return g;
  }

  function makeMarketFront(rng) {
    var g = new THREE.Group();
    var b = makeBuilding({ w: 26, h: 9, d: 8, wall: '#e9c46a', glass: '#2b4a5a', trim: '#0b8a3e', kind: 'house', roof: '#a0522d' });
    g.add(b);
    var s = new THREE.Mesh(plane(14, 1.8), MT('balogun', Tex.sign('BALOGUN MARKET', '#0b8a3e', '#ffffff', 1024, 130)));
    s.position.set(0, 6.4, 4.05); g.add(s);
    var arch = mesh(box(6, 4, 0.2), M('#3b2a1a'), 0, 2, 4.02, g);
    for (var i = -2; i <= 2; i++) { if (i === 0) continue; var st = makeStall(rng.int(0, 30)); st.position.set(i * 4.5, 0, 5.4); g.add(st); }
    return g;
  }

  function makeBridgeBarricade() {
    var g = new THREE.Group();
    for (var i = -2; i <= 2; i++) { var b = makeBarrier(); b.scale.set(1.6, 1.4, 1); b.position.x = i * 3.4; g.add(b); }
    var s = new THREE.Mesh(plane(5, 1.2), MT('closed', Tex.sign('ROAD CLOSED', '#d62828', '#ffffff', 512, 120)));
    s.position.set(0, 2.2, 0.06); g.add(s);
    mesh(box(0.1, 2.0, 0.1), M('#333'), -2.3, 1.2, 0, g); mesh(box(0.1, 2.0, 0.1), M('#333'), 2.3, 1.2, 0, g);
    var c = makeCones(); c.position.set(-5, 0, 1.2); g.add(c);
    var c2 = makeCones(); c2.position.set(5, 0, 1.2); g.add(c2);
    return g;
  }

  function makeCanoe(rng) {
    var g = new THREE.Group();
    var h = mesh(box(0.9, 0.35, 4.2), M('#6b3e1f'), 0, 0, 0, g);
    mesh(box(0.7, 0.05, 3.8), M('#3b2412'), 0, 0.17, 0, g);
    if (rng.chance(0.7)) {
      var p = makeHumanoid({ skin: '#4e3220', shirt: rng.pick(['#e76f51', '#3a86ff', '#ffd23f']), sleeve: '#4e3220', upperLeg: '#333', lowerLeg: '#4e3220', shoe: '#4e3220', hair: '#111' });
      p.group.position.set(0, 0.17, 0.8); p.armR.rotation.x = -1; p.group.scale.setScalar(0.9); g.add(p.group);
    }
    return g;
  }

  function makeSkyline(rng, color) {
    var g = new THREE.Group();
    var m = M(color);
    var x = -40;
    while (x < 40) {
      var w = rng.range(3, 8), h = rng.range(6, 30);
      mesh(box(w, h, 5), m, x, h / 2 - 1.5, rng.range(-4, 4), g);
      x += w + rng.range(0.3, 2.5);
    }
    return g;
  }

  /* ---------------- Collectables ---------------- */
  var coinMats = null;
  function makeCoin() {
    if (!coinMats) coinMats = MT('coinface', Tex.coinFace(), { emissive: '#3a2a00' }); // one material = one draw call per coin
    var c = new THREE.Mesh(cyl(0.42, 0.42, 0.1, 16), coinMats);
    c.geometry = cyl(0.42, 0.42, 0.1, 16);
    c.rotation.x = Math.PI / 2;
    var holder = new THREE.Group(); holder.add(c);
    return holder;
  }

  function makePowerup(type) {
    var g = new THREE.Group();
    var col = { magnet: '#ff4d5a', shield: '#22c55e', double: '#ffd23f', boost: '#4c9bff' }[type];
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tex.powerIcon(type), transparent: true, depthWrite: false }));
    sp.scale.set(1.2, 1.2, 1); g.add(sp);
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tex.glow(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(2.8, 2.8, 1); g.add(glow);
    var ring = mesh(geo('pring', function () { return new THREE.TorusGeometry(0.78, 0.06, 6, 24); }), M(col, { emissive: col }), 0, 0, 0, g);
    g.userData.ring = ring;
    return g;
  }

  function makeShieldBubble() {
    var m = new THREE.MeshBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.22, depthWrite: false });
    var s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 2), m);
    var wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.27, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.25 }));
    s.add(wire);
    return s;
  }

  GR.Models = {
    M: M, MT: MT, box: box, cyl: cyl, plane: plane, sph: sph, mesh: mesh, ankaraMat: ankaraMat,
    makeRunner: makeRunner, makeAgbero: makeAgbero, makeHumanoid: makeHumanoid,
    makeDanfo: makeDanfo, makeKeke: makeKeke, makeOkada: makeOkada, makeGenerator: makeGenerator,
    makeCones: makeCones, makePothole: makePothole, makeGutter: makeGutter, makeBanner: makeBanner,
    makeLowBridge: makeLowBridge, makeBarrier: makeBarrier, makeStall: makeStall,
    makeBuilding: makeBuilding, makeSignboard: makeSignboard, makePalm: makePalm, makeLamp: makeLamp,
    makeBystander: makeBystander, makeSuya: makeSuya, makeArch: makeArch, makeBillboard: makeBillboard,
    makeTollGate: makeTollGate, makeMarketFront: makeMarketFront, makeBridgeBarricade: makeBridgeBarricade,
    makeCanoe: makeCanoe, makeSkyline: makeSkyline, makeCoin: makeCoin, makePowerup: makePowerup,
    makeShieldBubble: makeShieldBubble
  };
})();
