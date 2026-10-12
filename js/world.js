/* Gidi Rush - street decoration for each track segment (roads, sidewalks, buildings, landmarks) */
(function () {
  'use strict';
  var GR = window.GR, Mo = GR.Models, Tex = GR.Tex, CFG = GR.CFG;
  var RH = CFG.ROAD_HALF, SW = CFG.SIDEWALK;

  var WALLS = ['#e9c46a', '#f4a261', '#e76f51', '#a8dadc', '#f1faee', '#c9ada7', '#90be6d', '#ffd6a5', '#bde0fe', '#f7ede2'];
  var GLASS = ['#2a6f97', '#468faf', '#014f86', '#61a5c2', '#3d5a80'];
  var SIGN_COLORS = [['#0b8a3e', '#ffffff'], ['#ffd23f', '#111111'], ['#c1272d', '#ffffff'], ['#1d3557', '#ffd23f'], ['#ffffff', '#c1272d'], ['#3a0ca3', '#ffffff']];

  /* Planes/boxes whose size depends on segment length get their own geometry and are disposed with it */
  function ownBox(seg, w, h, d, mat, x, y, z) {
    var g = new THREE.BoxGeometry(w, h, d);
    seg.disposables.push(g);
    var m = new THREE.Mesh(g, mat); m.position.set(x, y, z); seg.group.add(m);
    return m;
  }
  function ownPlane(seg, w, len, mat, x, y, sMid, uvLen) {
    var g = new THREE.PlaneGeometry(w, len);
    if (uvLen) {
      var uv = g.attributes.uv;
      for (var i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (len / uvLen));
      uv.needsUpdate = true;
    }
    seg.disposables.push(g);
    var m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, -sMid); seg.group.add(m);
    return m;
  }
  function place(seg, obj, lat, s, y, rotY) {
    obj.position.set(lat, y || 0, -s);
    if (rotY) obj.rotation.y = rotY;
    seg.group.add(obj);
    return obj;
  }

  var roadMat, crossMat;
  function mats() {
    if (!roadMat) {
      roadMat = new THREE.MeshLambertMaterial({ map: Tex.road() });
      crossMat = new THREE.MeshLambertMaterial({ map: Tex.crossing() });
    }
  }

  function decorate(seg, rng) {
    mats();
    var L = seg.L, th = seg.theme;
    var open = { '-1': seg.junction === 'L' || seg.junction === 'T', '1': seg.junction === 'R' || seg.junction === 'T' };
    var s0 = seg.first ? -45 : RH;              // road starts after the previous junction square
    var walk0 = seg.first ? -45 : RH + SW;      // sidewalks / buildings start after the corner
    var isBridge = th === 'bridge';
    var yOff = (seg.depth % 3) * 0.004;

    // Road strip and junction square
    ownPlane(seg, RH * 2, (L - RH) - s0, roadMat, 0, 0.01 + yOff, (s0 + L - RH) / 2, RH * 2);
    ownPlane(seg, RH * 2, RH * 2, crossMat, 0, 0.012 + yOff, L, 0);

    var swMat = th === 'lekki' ? Mo.MT('swl', Tex.sidewalk('#d9d4c7', '#b5ae9e')) : th === 'market' ? Mo.MT('swm', Tex.sidewalk('#b9a58a', '#8f7c62')) : Mo.MT('swb', Tex.sidewalk('#a7a49e', '#86837e'));
    var kerb = Mo.MT('kerb', Tex.stripes('#0b8a3e', '#ffffff'));

    if (!isBridge) {
      // ground under the whole block (lagoon water shows beyond)
      var gcol = th === 'lekki' ? '#7d9a62' : '#a08260';
      ownPlane(seg, 100, (L + 40) - (s0 - 10), Mo.M(gcol), 0, -0.03 - yOff, ((s0 - 10) + L + 40) / 2, 0);
    } else {
      ownBox(seg, RH * 2 + SW * 2, 1.2, (L + RH) - s0, Mo.M('#8f8a82'), 0, -0.6, -((s0 + L + RH) / 2));
      ownBox(seg, RH * 2 + SW * 2, 1.2, SW, Mo.M('#8f8a82'), 0, -0.6, -(L + RH + SW / 2));
      for (var ps = Math.ceil(Math.max(s0, 0) / 22) * 22; ps < L; ps += 22) {
        place(seg, new THREE.Mesh(Mo.box(1.6, 7, 1.6), Mo.M('#9c968c')), -2.5, ps, -4.6);
        place(seg, new THREE.Mesh(Mo.box(1.6, 7, 1.6), Mo.M('#9c968c')), 2.5, ps, -4.6);
      }
    }

    [-1, 1].forEach(function (side) {
      var isOpen = open[side];
      var runEnd = isOpen ? L - RH : L + RH + SW;
      var lat = side * (RH + SW / 2);
      ownBox(seg, SW, 0.18, runEnd - walk0, swMat, lat, 0.09, -((walk0 + runEnd) / 2));
      ownBox(seg, 0.18, 0.2, runEnd - walk0, kerb, side * (RH + 0.09), 0.1, -((walk0 + runEnd) / 2));
      if (isOpen) ownBox(seg, SW, 0.18, SW, swMat, lat, 0.09, -(L + RH + SW / 2));
      var bEnd = isOpen ? L - RH - SW - 0.5 : L + RH + SW + 6;
      if (isBridge) bridgeSide(seg, rng, side, walk0, runEnd, isOpen);
      else citySide(seg, rng, side, walk0 + 0.3, bEnd, th);
    });
    // front sidewalk & dead-end landmark
    ownBox(seg, RH * 2, 0.18, SW, swMat, 0, 0.09, -(L + RH + SW / 2));
    frontLandmark(seg, rng, th);

    if (seg.themeStart) place(seg, Mo.makeArch(GR.THEMES[th].welcome), 0, seg.first ? 10 : 14, 0);
  }

  function citySide(seg, rng, side, from, to, th) {
    var face = side * (RH + SW + 0.4);  // building facade line
    var s = from, rot = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    var lekki = th === 'lekki';
    while (s < to - 3) {
      var w = Math.min(lekki ? rng.int(7, 11) : rng.int(5, 8), Math.floor(to - s));
      if (w < 3) break;
      var h = lekki ? rng.int(12, 30) : rng.int(4, 10);
      var d = lekki ? rng.int(8, 12) : rng.int(6, 9);
      var b = Mo.makeBuilding({
        w: w, h: h, d: d, kind: lekki ? 'glass' : 'house',
        wall: lekki ? '#cfd8dc' : rng.pick(WALLS), glass: lekki ? rng.pick(GLASS) : rng.pick(['#2b4a5a', '#3b5568', '#4a3f35']),
        trim: rng.pick(['#ffffff', '#0b8a3e', '#c1272d', '#7a5a3a']), roof: '#8d8d8d', tank: !lekki && rng.chance(0.45)
      });
      // building is w along s, d deep: rotate so its local x runs along the street
      b.rotation.y = rot;
      place(seg, b, face + side * d / 2, s + w / 2, 0, rot);
      if (!lekki && rng.chance(0.85)) {
        var sc = rng.pick(SIGN_COLORS);
        var sign = Mo.makeSignboard(rng.pick(GR.SHOP_NAMES), sc[0], sc[1], Math.min(w - 0.6, 4.6));
        place(seg, sign, face - side * 0.06, s + w / 2, Math.min(h - 0.8, 3.4), rot);
      }
      s += w + (lekki ? rng.range(1, 4) : rng.range(0, 1.2));
    }
    // street furniture on the sidewalk
    var swLat = side * (RH + SW * 0.55);
    for (var p = from + 3; p < to - 3; p += lekki ? 11 : 7.5) {
      var r = rng();
      if (lekki) {
        if (r < 0.65) place(seg, Mo.makePalm(rng.int(0, 9)), swLat, p, 0.18);
        else if (r < 0.8) place(seg, Mo.makeLamp(side), side * (RH + 0.5), p, 0.18);
        else if (r < 0.9) place(seg, Mo.makeBystander(rng), swLat, p, 0.18, rng.range(0, 6));
      } else {
        if (r < 0.32) place(seg, Mo.makeStall(rng.int(0, 40)), swLat, p, 0.18, side > 0 ? -Math.PI / 2 : Math.PI / 2);
        else if (r < 0.52) place(seg, Mo.makeBystander(rng), swLat + side * 0.2, p, 0.18, rng.range(0, 6));
        else if (r < 0.6) place(seg, Mo.makeSuya(), swLat, p, 0.18, side > 0 ? -Math.PI / 2 : Math.PI / 2);
        else if (r < 0.68) place(seg, Mo.makeGenerator(), swLat, p, 0.18, rng.range(0, 6));
        else if (r < 0.78) place(seg, Mo.makeLamp(side), side * (RH + 0.5), p, 0.18);
        else if (r < 0.84) { var k = Mo.makeKeke(); k.scale.setScalar(0.9); place(seg, k, swLat, p, 0.18, rng.chance(0.5) ? 0 : Math.PI); }
      }
    }
    if (lekki && rng.chance(0.7)) {
      var bs = rng.range(from + 20, Math.max(from + 21, to - 20));
      place(seg, Mo.makeBillboard(rng.pick(GR.BILLBOARDS), rng.int(0, 7)), side * (RH + SW + 2.5), bs, 0);
    }
  }

  function bridgeSide(seg, rng, side, from, to, isOpen) {
    var rail = Mo.M('#d8d2c6');
    var lat = side * (RH + SW - 0.15);
    var len = to - from;
    var g = new THREE.BoxGeometry(0.3, 0.9, len); seg.disposables.push(g);
    var m = new THREE.Mesh(g, rail); m.position.set(lat, 0.6, -(from + to) / 2); seg.group.add(m);
    var g2 = new THREE.BoxGeometry(0.36, 0.12, len); seg.disposables.push(g2);
    var m2 = new THREE.Mesh(g2, Mo.M('#0b8a3e')); m2.position.set(lat, 1.1, -(from + to) / 2); seg.group.add(m2);
    for (var p = from + 4; p < to - 2; p += 18) place(seg, Mo.makeLamp(side), lat, p, 0.15);
    for (var c = from + 10; c < to; c += rng.range(25, 45)) {
      place(seg, Mo.makeCanoe(rng), side * rng.range(14, 40), c, -1.3, rng.range(-0.5, 0.5));
    }
    if (seg.L > 60 && rng.chance(0.8)) {
      var sk = Mo.makeSkyline(rng, side > 0 ? '#5a3a5e' : '#4a3355');
      place(seg, sk, side * rng.range(70, 95), seg.L * 0.6, -1.4, Math.PI / 2);
    }
  }

  function chevronSign(seg, s, y) {
    var g = new THREE.Group();
    var board = new THREE.Mesh(Mo.box(7.2, 1.3, 0.12), [Mo.M('#222'), Mo.M('#222'), Mo.M('#222'), Mo.M('#222'), Mo.MT('chev' + seg.junction, Tex.chevron(seg.junction)), Mo.M('#222')]);
    board.position.y = y; g.add(board);
    [-3.2, 3.2].forEach(function (x) { var p = new THREE.Mesh(Mo.box(0.14, y, 0.14), Mo.M('#555')); p.position.set(x, y / 2, -0.1); g.add(p); });
    place(seg, g, 0, s, 0);
  }

  function frontLandmark(seg, rng, th) {
    var s = seg.L + RH + SW + 0.6;
    chevronSign(seg, th === 'bridge' ? seg.L + RH + 0.2 : seg.L + RH + SW - 0.3, th === 'bridge' ? 3.4 : 1.9);
    if (th === 'bridge') {
      place(seg, Mo.makeBridgeBarricade(), 0, seg.L + RH + 0.8, 0);
      return;
    }
    if (th === 'lekki') {
      place(seg, Mo.makeTollGate(), 0, s + 2.5, 0);
      var back = Mo.makeBuilding({ w: 30, h: 22, d: 10, kind: 'glass', wall: '#cfd8dc', glass: rng.pick(GLASS) });
      place(seg, back, 0, s + 12, 0);
    } else {
      place(seg, Mo.makeMarketFront(rng), 0, s + 4, 0);
    }
    // side fill buildings so the dead end reads as a wall
    [-1, 1].forEach(function (side) {
      var b = Mo.makeBuilding({ w: 10, h: th === 'lekki' ? 18 : 8, d: 10, kind: th === 'lekki' ? 'glass' : 'house', wall: rng.pick(WALLS), glass: rng.pick(GLASS), trim: '#ffffff' });
      place(seg, b, side * 19, s + 5, 0);
    });
  }

  /* Merge every static decor mesh of a segment into one mesh per material (thousands of draw calls -> ~100) */
  var nonIndexed = {};
  var _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _n = new THREE.Matrix3(), _v = new THREE.Vector3();
  function mergeGroup(group) {
    group.updateMatrixWorld(true);
    _inv.copy(group.matrixWorld).invert();
    var buckets = {}, order = [];
    group.traverse(function (o) {
      if (!o.isMesh || !o.visible) return;
      var src = o.geometry;
      var g = src.index ? (nonIndexed[src.uuid] || (nonIndexed[src.uuid] = src.toNonIndexed())) : src;
      if (!src.userData.shared && src.index) delete nonIndexed[src.uuid];
      _m.multiplyMatrices(_inv, o.matrixWorld);
      _n.getNormalMatrix(_m);
      var pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
      var groups = Array.isArray(o.material) ? g.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
      groups.forEach(function (gr) {
        var mat = Array.isArray(o.material) ? o.material[gr.materialIndex] : o.material;
        if (!mat) return;
        var b = buckets[mat.uuid];
        if (!b) { b = buckets[mat.uuid] = { mat: mat, p: [], n: [], u: [] }; order.push(b); }
        var end = Math.min(gr.start + gr.count, pos.count);
        for (var i = gr.start; i < end; i++) {
          _v.fromBufferAttribute(pos, i).applyMatrix4(_m); b.p.push(_v.x, _v.y, _v.z);
          if (nor) { _v.fromBufferAttribute(nor, i).applyMatrix3(_n).normalize(); b.n.push(_v.x, _v.y, _v.z); } else b.n.push(0, 1, 0);
          if (uv) b.u.push(uv.getX(i), uv.getY(i)); else b.u.push(0, 0);
        }
      });
    });
    return order.map(function (b) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
      geo.computeBoundingSphere();
      return { geo: geo, mat: b.mat };
    });
  }

  function mergeStatic(seg) {
    var group = seg.group;
    var parts = mergeGroup(group);
    group.children.slice().forEach(function (c) { group.remove(c); });
    seg.disposables.forEach(function (g) { g.dispose(); });
    seg.disposables = [];
    parts.forEach(function (pt) {
      seg.disposables.push(pt.geo);
      var m = new THREE.Mesh(pt.geo, pt.mat);
      m.matrixAutoUpdate = false;
      group.add(m);
    });
  }

  /* Bake a model (built once per key) into shared per-material meshes; returns a fresh light-weight group */
  var baked = {};
  function bakedModel(key, make) {
    if (!baked[key]) {
      var src = make();
      src.position.set(0, 0, 0); src.rotation.set(0, 0, 0); src.scale.set(1, 1, 1);
      baked[key] = mergeGroup(src);
      baked[key].forEach(function (pt) { pt.geo.userData.shared = true; });
    }
    var g = new THREE.Group();
    baked[key].forEach(function (pt) { g.add(new THREE.Mesh(pt.geo, pt.mat)); });
    return g;
  }

  GR.World = { decorate: decorate, place: place, mergeStatic: mergeStatic, bakedModel: bakedModel };
})();
