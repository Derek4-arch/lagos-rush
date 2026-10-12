/* Gidi Rush - procedural canvas textures (Ankara prints, signs, danfo livery, road...) */
(function () {
  'use strict';
  var GR = window.GR;
  var cache = {};

  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function toTex(c, repeat) {
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    return t;
  }
  function cached(key, fn) { if (!cache[key]) cache[key] = fn(); return cache[key]; }

  var PALETTES = [
    ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#ffd166'],
    ['#ff7b00', '#3a0ca3', '#ffd60a', '#06d6a0', '#ef476f'],
    ['#0b8a3e', '#ffd23f', '#ee4266', '#540d6e', '#ffffff'],
    ['#d00000', '#ffba08', '#3f88c5', '#032b43', '#136f63'],
    ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#8338ec'],
    ['#6a040f', '#f48c06', '#ffba08', '#370617', '#faa307']
  ];

  /* Bold, original Ankara-style wax print motifs */
  function ankaraCanvas(seed, size) {
    size = size || 256;
    var pal = PALETTES[seed % PALETTES.length];
    var c = canvas(size, size), g = c.getContext('2d');
    g.fillStyle = pal[0]; g.fillRect(0, 0, size, size);
    var cells = 4, cs = size / cells, motif = Math.floor(seed / PALETTES.length) % 4;
    for (var i = 0; i < cells; i++) {
      for (var j = 0; j < cells; j++) {
        var x = i * cs + cs / 2, y = j * cs + cs / 2, alt = (i + j) % 2, k;
        if (motif === 0) {
          for (k = 4; k > 0; k--) { g.fillStyle = pal[(k + alt) % pal.length]; g.beginPath(); g.arc(x, y, cs * 0.115 * k, 0, 7); g.fill(); }
        } else if (motif === 1) {
          for (k = 3; k > 0; k--) {
            g.fillStyle = pal[(k + alt + 1) % pal.length]; var d = cs * 0.165 * k;
            g.beginPath(); g.moveTo(x, y - d); g.lineTo(x + d, y); g.lineTo(x, y + d); g.lineTo(x - d, y); g.closePath(); g.fill();
          }
        } else if (motif === 2) {
          g.save(); g.translate(x, y);
          for (var p = 0; p < 6; p++) {
            g.rotate(Math.PI / 3); g.fillStyle = pal[p % 2 ? 2 : (3 + alt) % pal.length];
            g.beginPath(); g.ellipse(0, cs * 0.2, cs * 0.09, cs * 0.2, 0, 0, 7); g.fill();
          }
          g.fillStyle = pal[4]; g.beginPath(); g.arc(0, 0, cs * 0.1, 0, 7); g.fill(); g.restore();
        } else {
          g.fillStyle = pal[1 + alt]; g.fillRect(i * cs, j * cs + cs * 0.35, cs, cs * 0.3);
          g.fillStyle = pal[3];
          for (k = 0; k < 3; k++) {
            g.beginPath(); g.arc(i * cs + cs * (0.2 + k * 0.3), j * cs + cs * 0.17, cs * 0.07, 0, 7); g.fill();
            g.beginPath(); g.arc(i * cs + cs * (0.2 + k * 0.3), j * cs + cs * 0.83, cs * 0.07, 0, 7); g.fill();
          }
          g.fillStyle = pal[4]; g.fillRect(i * cs, j * cs + cs * 0.48, cs, cs * 0.04);
        }
      }
    }
    return c;
  }

  function fitText(g, text, maxW, size, weight, font) {
    var s = size;
    do { g.font = (weight || '900') + ' ' + s + 'px ' + (font || '"Arial Black", "Segoe UI", Arial, sans-serif'); s -= 2; }
    while (g.measureText(text).width > maxW && s > 8);
  }

  var T = {
    ankaraCanvas: ankaraCanvas,
    ankaraDataURL: function (seed, size) { return ankaraCanvas(seed, size || 160).toDataURL(); },

    ankara: function (seed) {
      return cached('ank' + seed, function () { return toTex(ankaraCanvas(seed, 256), true); });
    },

    sign: function (text, bg, fg, w, h) {
      w = w || 512; h = h || 128;
      return cached('sign' + text + bg + fg + w + h, function () {
        var c = canvas(w, h), g = c.getContext('2d');
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = h * 0.06; g.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08);
        g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
        fitText(g, text, w * 0.9, Math.floor(h * 0.5));
        g.fillText(text, w / 2, h / 2 + 2);
        return toTex(c);
      });
    },

    banner: function (text, seed) {
      return cached('ban' + text + seed, function () {
        var w = 1024, h = 128, c = canvas(w, h), g = c.getContext('2d');
        var pat = g.createPattern(ankaraCanvas(seed, 64), 'repeat');
        g.fillStyle = pat; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fffaf0'; g.fillRect(0, h * 0.17, w, h * 0.66);
        g.fillStyle = '#0b8a3e'; g.textAlign = 'center'; g.textBaseline = 'middle';
        fitText(g, text, w * 0.9, 64);
        g.fillText(text, w / 2, h / 2 + 3);
        return toTex(c);
      });
    },

    windows: function (wall, glass, kind) {
      return cached('win' + wall + glass + kind, function () {
        var c = canvas(128, 128), g = c.getContext('2d');
        g.fillStyle = wall; g.fillRect(0, 0, 128, 128);
        if (kind === 'glass') {
          g.fillStyle = glass; g.fillRect(0, 0, 128, 128);
          g.fillStyle = 'rgba(255,255,255,0.18)';
          for (var i = 0; i < 4; i++) g.fillRect(0, i * 32 + 28, 128, 3);
          g.fillStyle = 'rgba(255,255,255,0.08)';
          for (var k = 0; k < 4; k++) g.fillRect(k * 32 + 30, 0, 2, 128);
          var gr = g.createLinearGradient(0, 0, 128, 128);
          gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.1)');
          g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        } else {
          for (var x = 0; x < 2; x++) for (var y = 0; y < 2; y++) {
            g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x * 64 + 14, y * 64 + 14, 38, 40);
            g.fillStyle = glass; g.fillRect(x * 64 + 16, y * 64 + 16, 34, 36);
            g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x * 64 + 16, y * 64 + 16, 34, 6);
            g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x * 64 + 32, y * 64 + 16, 2, 36);
          }
        }
        return toTex(c, true);
      });
    },

    road: function () {
      return cached('road', function () {
        var c = canvas(256, 256), g = c.getContext('2d');
        g.fillStyle = '#4a4a4f'; g.fillRect(0, 0, 256, 256);
        for (var i = 0; i < 900; i++) { // asphalt grain
          var v = 60 + Math.floor(Math.random() * 40);
          g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 4) + ',0.5)';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        var cfg = GR.CFG, half = cfg.ROAD_HALF;
        function px(lat) { return (lat + half) / (half * 2) * 256; }
        g.fillStyle = '#f5f5f5';
        [-cfg.LANE_W / 2, cfg.LANE_W / 2].forEach(function (lat) { g.fillRect(px(lat) - 3, 20, 6, 110); });
        g.fillStyle = '#f2c230';
        g.fillRect(px(-half + 0.25) - 3, 0, 5, 256); g.fillRect(px(half - 0.25) - 2, 0, 5, 256);
        g.fillStyle = 'rgba(0,0,0,0.15)';
        g.fillRect(px(-cfg.LANE_W) - 18, 0, 36, 256); g.fillRect(px(cfg.LANE_W) - 18, 0, 36, 256); g.fillRect(px(0) - 18, 0, 36, 256);
        return toTex(c, true);
      });
    },

    crossing: function () {
      return cached('cross', function () {
        var c = canvas(256, 256), g = c.getContext('2d');
        g.fillStyle = '#48484d'; g.fillRect(0, 0, 256, 256);
        g.fillStyle = '#eeeeee';
        for (var i = 0; i < 8; i++) { g.fillRect(16 + i * 30, 6, 16, 34); g.fillRect(16 + i * 30, 216, 16, 34); }
        g.fillStyle = '#f2c230'; g.beginPath(); g.arc(128, 128, 40, 0, 7); g.lineWidth = 6; g.strokeStyle = '#f2c230'; g.stroke();
        return toTex(c);
      });
    },

    sidewalk: function (base, line) {
      return cached('sw' + base + line, function () {
        var c = canvas(64, 64), g = c.getContext('2d');
        g.fillStyle = base; g.fillRect(0, 0, 64, 64);
        g.strokeStyle = line; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62); g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 64); g.stroke();
        return toTex(c, true);
      });
    },

    danfoSide: function () {
      return cached('danfoSide', function () {
        var c = canvas(512, 200), g = c.getContext('2d');
        g.fillStyle = '#f7c21b'; g.fillRect(0, 0, 512, 200);
        g.fillStyle = '#1c2633';
        for (var i = 0; i < 5; i++) g.fillRect(28 + i * 92, 22, 80, 62);
        g.fillStyle = 'rgba(255,255,255,0.2)';
        for (var j = 0; j < 5; j++) g.fillRect(28 + j * 92, 22, 80, 10);
        g.fillStyle = '#111'; g.fillRect(0, 100, 512, 9); g.fillRect(0, 116, 512, 9);
        g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
        fitText(g, 'NO FOOD FOR LAZY MAN', 440, 34);
        g.fillText('NO FOOD FOR LAZY MAN', 256, 156);
        g.fillStyle = '#0b8a3e'; g.fillRect(0, 186, 512, 14);
        return toTex(c);
      });
    },
    danfoFront: function () {
      return cached('danfoFront', function () {
        var c = canvas(256, 256), g = c.getContext('2d');
        g.fillStyle = '#f7c21b'; g.fillRect(0, 0, 256, 256);
        g.fillStyle = '#1c2633'; g.fillRect(18, 22, 220, 96);
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(30, 110); g.lineTo(90, 26); g.lineTo(120, 26); g.lineTo(60, 110); g.fill();
        g.fillStyle = '#111'; g.fillRect(0, 138, 256, 8);
        g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(44, 180, 20, 0, 7); g.arc(212, 180, 20, 0, 7); g.fill();
        g.fillStyle = '#333'; g.fillRect(80, 160, 96, 40);
        g.fillStyle = '#fff'; g.fillRect(84, 210, 88, 30);
        g.fillStyle = '#0b8a3e'; g.font = '900 13px Arial'; g.textAlign = 'center'; g.fillText('LAGOS', 128, 222);
        g.fillStyle = '#111'; g.font = '900 13px Arial'; g.fillText('KJA 234 XY', 128, 236);
        return toTex(c);
      });
    },
    danfoBack: function () {
      return cached('danfoBack', function () {
        var c = canvas(256, 256), g = c.getContext('2d');
        g.fillStyle = '#f7c21b'; g.fillRect(0, 0, 256, 256);
        g.fillStyle = '#1c2633'; g.fillRect(30, 26, 196, 80);
        g.fillStyle = '#111'; g.fillRect(0, 138, 256, 8);
        g.fillStyle = '#c1272d'; g.fillRect(14, 170, 34, 22); g.fillRect(208, 170, 34, 22);
        g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
        fitText(g, "GOD'S TIME IS THE BEST", 210, 22); g.fillText("GOD'S TIME IS THE BEST", 128, 124);
        return toTex(c);
      });
    },

    generator: function () {
      return cached('gen', function () {
        var c = canvas(256, 192), g = c.getContext('2d');
        g.fillStyle = '#d62828'; g.fillRect(0, 0, 256, 192);
        g.fillStyle = '#ffba08'; g.fillRect(0, 0, 256, 36); g.fillRect(0, 156, 256, 36);
        g.fillStyle = '#222'; for (var i = 0; i < 6; i++) g.fillRect(150 + i * 15, 58, 8, 70);
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.font = '900 22px Arial'; g.fillText('I BETTER', 14, 70); g.fillText('PASS MY', 14, 98); g.fillText('NEIGHBOUR', 14, 126);
        g.fillStyle = '#222'; g.font = '900 18px Arial'; g.fillText('2.5 KVA', 14, 174);
        return toTex(c);
      });
    },

    stripes: function (a, b) {
      return cached('str' + a + b, function () {
        var c = canvas(128, 32), g = c.getContext('2d');
        g.fillStyle = a; g.fillRect(0, 0, 128, 32);
        g.fillStyle = b; for (var i = -2; i < 8; i++) { g.beginPath(); g.moveTo(i * 24, 32); g.lineTo(i * 24 + 12, 32); g.lineTo(i * 24 + 28, 0); g.lineTo(i * 24 + 16, 0); g.fill(); }
        return toTex(c, true);
      });
    },

    coinFace: function () {
      return cached('coin', function () {
        var c = canvas(128, 128), g = c.getContext('2d');
        var gr = g.createRadialGradient(50, 45, 10, 64, 64, 64);
        gr.addColorStop(0, '#fff3a6'); gr.addColorStop(0.6, '#f5c400'); gr.addColorStop(1, '#c78a00');
        g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill();
        g.strokeStyle = '#a86f00'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke();
        g.fillStyle = '#8a5a00'; g.font = '900 70px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('\u20A6', 64, 68);
        var t = toTex(c); t.center.set(0.5, 0.5); t.rotation = -Math.PI / 2;
        return t;
      });
    },

    powerIcon: function (type) {
      return cached('pow' + type, function () {
        var c = canvas(128, 128), g = c.getContext('2d');
        var col = { magnet: '#e63946', shield: '#0b8a3e', double: '#f5b700', boost: '#3a86ff' }[type];
        g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
        g.fillStyle = col; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'butt';
        if (type === 'magnet') {
          g.beginPath(); g.arc(64, 60, 24, Math.PI, 0, true); g.stroke();
          g.fillStyle = '#ddd'; g.fillRect(33, 52, 14, 18); g.fillRect(81, 52, 14, 18);
          g.fillStyle = '#fff'; g.fillRect(33, 40, 14, 12); g.fillRect(81, 40, 14, 12);
        } else if (type === 'shield') {
          g.beginPath(); g.moveTo(64, 26); g.lineTo(94, 38); g.lineTo(90, 72); g.lineTo(64, 100); g.lineTo(38, 72); g.lineTo(34, 38); g.closePath(); g.fill();
          g.fillStyle = '#0b8a3e'; g.fillRect(52, 40, 24, 48);
        } else if (type === 'double') {
          g.font = '900 52px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('x2', 64, 68);
        } else {
          g.beginPath(); g.moveTo(72, 22); g.lineTo(40, 70); g.lineTo(62, 70); g.lineTo(54, 106); g.lineTo(88, 56); g.lineTo(66, 56); g.closePath(); g.fill();
        }
        return toTex(c);
      });
    },

    jerseyBack: function () {
      return cached('jersey', function () {
        var c = canvas(128, 128), g = c.getContext('2d');
        g.fillStyle = '#0b8a3e'; g.fillRect(0, 0, 128, 128);
        g.fillStyle = '#fff'; g.font = '900 20px Arial'; g.textAlign = 'center'; g.fillText('CHIDI', 64, 26);
        g.font = '900 72px Arial'; g.fillText('10', 64, 100);
        return toTex(c);
      });
    },

    chevron: function (junction) {
      return cached('chev' + junction, function () {
        var c = canvas(512, 128), g = c.getContext('2d');
        g.fillStyle = '#111'; g.fillRect(0, 0, 512, 128);
        g.fillStyle = '#ffd23f';
        function chev(x, dir) {
          g.beginPath();
          g.moveTo(x + dir * 30, 14); g.lineTo(x - dir * 18, 64); g.lineTo(x + dir * 30, 114);
          g.lineTo(x + dir * 58, 114); g.lineTo(x + dir * 10, 64); g.lineTo(x + dir * 58, 14); g.closePath(); g.fill();
        }
        var i;
        if (junction === 'L') for (i = 0; i < 6; i++) chev(40 + i * 80, -1 * -1);
        else if (junction === 'R') for (i = 0; i < 6; i++) chev(470 - i * 80, -1);
        else { for (i = 0; i < 3; i++) { chev(40 + i * 72, 1); chev(470 - i * 72, -1); } }
        return toTex(c);
      });
    },

    blob: function () {
      return cached('blob', function () {
        var c = canvas(64, 64), g = c.getContext('2d');
        var gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        return toTex(c);
      });
    },

    glow: function (color) {
      return cached('glow' + color, function () {
        var c = canvas(64, 64), g = c.getContext('2d');
        var gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
        gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        return toTex(c);
      });
    }
  };

  GR.Tex = T;
})();
