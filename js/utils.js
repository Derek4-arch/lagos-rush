/* Gidi Rush - shared helpers */
(function () {
  'use strict';
  var GR = (window.GR = window.GR || {});

  GR.U = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    damp: function (a, b, rate, dt) { return a + (b - a) * (1 - Math.exp(-rate * dt)); },
    angleDamp: function (a, b, rate, dt) {
      var d = b - a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return a + d * (1 - Math.exp(-rate * dt));
    },
    /* Small seeded random generator (mulberry32) with helpers */
    rng: function (seed) {
      var a = seed >>> 0;
      var f = function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      f.range = function (lo, hi) { return lo + (hi - lo) * f(); };
      f.int = function (lo, hi) { return Math.floor(lo + (hi - lo + 1) * f()); };
      f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
      f.chance = function (p) { return f() < p; };
      f.weighted = function (obj) {
        var total = 0, k;
        for (k in obj) total += obj[k];
        var r = f() * total;
        for (k in obj) { r -= obj[k]; if (r <= 0) return k; }
        return k;
      };
      return f;
    },
    store: {
      get: function (k, d) {
        try { var v = localStorage.getItem('gidirush.' + k); return v === null ? d : JSON.parse(v); }
        catch (e) { return d; }
      },
      set: function (k, v) {
        try { localStorage.setItem('gidirush.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ }
      }
    },
    pick: function (a) { return a[Math.floor(Math.random() * a.length)]; },
    fmt: function (n) { return Math.floor(n).toLocaleString('en-US'); },
    /* Grid directions: 0 = -z (north), 1 = +x, 2 = +z, 3 = -x */
    DIRS: [{ x: 0, z: -1 }, { x: 1, z: 0 }, { x: 0, z: 1 }, { x: -1, z: 0 }],
    yaw: function (d) { return -d * Math.PI / 2; }
  };
})();
