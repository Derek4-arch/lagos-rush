/* Gidi Rush - menus, HUD, toasts and settings */
(function () {
  'use strict';
  var GR = window.GR, U = GR.U;
  function $(id) { return document.getElementById(id); }

  var UI = {
    current: 'loading', stack: [], charIdx: 0, lastHud: {}, toastQ: [],

    init: function (game, audio) {
      this.game = game; this.audio = audio;
      var self = this;
      // Ankara pattern for UI bands, drawn with the same generator as the 3D fabrics
      document.documentElement.style.setProperty('--ankara', 'url(' + GR.Tex.ankaraDataURL(8, 80) + ')');

      function click(id, fn) { $(id).addEventListener('click', function (e) { e.stopPropagation(); audio.init(); audio.play('click'); fn(); }); }
      click('btn-play', function () { self.play(); });
      click('btn-runners', function () { self.show('select'); });
      click('btn-how', function () { self.push('how'); });
      click('btn-settings', function () { self.push('settings'); });
      click('btn-select-play', function () { self.play(); });
      click('char-prev', function () { self.cycleChar(-1); });
      click('char-next', function () { self.cycleChar(1); });
      click('btn-pause', function () { game.pause(); });
      click('btn-resume', function () { game.resume(); });
      click('btn-restart', function () { self.hideAll(); game.start(); });
      click('btn-pause-settings', function () { self.push('settings'); });
      click('btn-quit', function () { audio.stopMusic(); self.toMenu(); });
      click('btn-again', function () { self.play(); });
      click('btn-over-runners', function () { self.toMenu('select'); });
      click('btn-over-menu', function () { self.toMenu(); });
      click('btn-mute', function () { self.toggleMute(); });
      click('btn-reset', function () {
        U.store.set('best', 0); U.store.set('bank', 0); U.store.set('runs', 0); U.store.set('bestDist', 0);
        self.refreshTitle(); self.toast('Records cleared', 'mid');
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-back]'), function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); audio.play('click'); self.back(); });
      });

      // settings
      var st = U.store.get('settings', { music: true, sfx: true, fps: false, quality: 'auto' });
      this.settings = st;
      $('set-music').checked = st.music; $('set-sfx').checked = st.sfx; $('set-fps').checked = st.fps;
      audio.setMusic(st.music); audio.setSfx(st.sfx);
      $('set-music').addEventListener('change', function () { st.music = this.checked; audio.setMusic(st.music); self.saveSettings(); });
      $('set-sfx').addEventListener('change', function () { st.sfx = this.checked; audio.setSfx(st.sfx); self.saveSettings(); });
      $('set-fps').addEventListener('change', function () { st.fps = this.checked; self.saveSettings(); });
      Array.prototype.forEach.call(document.querySelectorAll('#set-quality button'), function (b) {
        b.addEventListener('click', function () { st.quality = b.getAttribute('data-q'); game.R.setQuality(st.quality); self.saveSettings(); });
      });
      game.R.setQuality(st.quality);
      this.saveSettings();

      var ids = GR.CHARACTERS.map(function (c) { return c.id; });
      this.charIdx = Math.max(0, ids.indexOf(game.character.id));
      $('char-dots').innerHTML = GR.CHARACTERS.map(function () { return '<i></i>'; }).join('');
      this.renderChar();
      this.refreshTitle();
    },

    saveSettings: function () {
      var st = this.settings;
      U.store.set('settings', st);
      $('fps').classList.toggle('hidden', !st.fps);
      Array.prototype.forEach.call(document.querySelectorAll('#set-quality button'), function (b) { b.classList.toggle('on', b.getAttribute('data-q') === st.quality); });
      this.muteIcon();
    },
    muteIcon: function () { $('mute-ico').innerHTML = (this.settings.music || this.settings.sfx) ? '&#128266;' : '&#128263;'; },
    toggleMute: function () {
      var on = !(this.settings.music || this.settings.sfx);
      this.settings.music = on; this.settings.sfx = on;
      $('set-music').checked = on; $('set-sfx').checked = on;
      this.audio.setMusic(on); this.audio.setSfx(on);
      this.saveSettings();
      this.toast(on ? 'Sound on' : 'Sound off', 'mid');
    },

    /* ---- screens ---- */
    hideAll: function () {
      Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('show'); });
      this.stack = [];
    },
    show: function (name) {
      this.hideAll();
      $('screen-' + name).classList.add('show');
      this.current = name;
      this.game.menuZoom = name === 'select' ? 1 : 0;
      if (name === 'title') this.refreshTitle();
      if (name === 'select') this.renderChar();
    },
    push: function (name) { this.stack.push(this.current); $('screen-' + name).classList.add('show'); this.current = name; },
    back: function () {
      $('screen-' + this.current).classList.remove('show');
      if (this.stack.length) { this.current = this.stack.pop(); if (!$('screen-' + this.current).classList.contains('show')) this.show(this.current); }
      else this.show('title');
    },
    toMenu: function (screen) { this.hideAll(); this.game.enterMenu(); this.show(screen || 'title'); },
    play: function () { this.hideAll(); this.current = 'game'; this.game.start(); },
    showPause: function (on) {
      if (on) { this.stack = []; $('screen-pause').classList.add('show'); this.current = 'pause'; }
      else { this.hideAll(); this.current = 'game'; }
    },

    refreshTitle: function () {
      $('t-best').textContent = U.fmt(U.store.get('best', 0));
      $('t-bank').innerHTML = '&#8358;' + U.fmt(U.store.get('bank', 0));
      $('t-runs').textContent = U.fmt(U.store.get('runs', 0));
      $('t-runner').textContent = this.game.character.name;
    },

    cycleChar: function (d) {
      var n = GR.CHARACTERS.length;
      this.charIdx = (this.charIdx + d + n) % n;
      this.game.setCharacter(GR.CHARACTERS[this.charIdx].id);
      this.renderChar();
    },
    renderChar: function () {
      var c = GR.CHARACTERS[this.charIdx];
      $('char-name').textContent = c.name; $('char-title').textContent = c.title; $('char-desc').textContent = c.desc;
      $('sel-name').textContent = c.name;
      $('char-stats').innerHTML = ['speed', 'style', 'wahala'].map(function (k) {
        return '<div class="char-stat"><span>' + k + '</span><div class="bar"><i style="width:' + (c.stat[k] * 20) + '%"></i></div></div>';
      }).join('');
      Array.prototype.forEach.call($('char-dots').children, function (d, i) { d.classList.toggle('on', i === this.charIdx); }, this);
      $('t-runner').textContent = c.name;
    },

    /* ---- HUD ---- */
    setHud: function (on) { $('hud').classList.toggle('hidden', !on); document.body.classList.toggle('in-game', !!on); if (!on) $('turn-hint').classList.add('hidden'); },
    hud: function (d) {
      var L = this.lastHud;
      var sc = Math.floor(d.score), co = d.coins, di = Math.floor(d.dist);
      if (L.score !== sc) { $('hud-score').textContent = U.fmt(sc); L.score = sc; }
      if (L.coins !== co) { $('hud-coins').textContent = U.fmt(co); L.coins = co; }
      if (L.dist !== di) { $('hud-dist').textContent = U.fmt(di) + ' m'; L.dist = di; }
      if (L.mult !== d.mult) { $('hud-mult').classList.toggle('hidden', d.mult < 2); L.mult = d.mult; }
      var keys = ['magnet', 'shield', 'double', 'boost'].filter(function (k) { return d.powers[k] > 0; });
      var sig = keys.join(',');
      var box = $('hud-powers');
      if (L.pw !== sig) {
        var labels = { magnet: ['&#9881;', 'Magnet'], shield: ['&#9711;', 'Shield'], double: ['x2', 'Double'], boost: ['&#9889;', 'Okada'] };
        box.innerHTML = keys.map(function (k) { return '<div class="pw ' + k + '" data-k="' + k + '"><span class="ico">' + labels[k][0] + '</span>' + labels[k][1] + '<span class="bar"><i></i></span></div>'; }).join('');
        L.pw = sig;
      }
      Array.prototype.forEach.call(box.children, function (el) {
        var k = el.getAttribute('data-k');
        el.querySelector('i').style.width = Math.max(0, d.powers[k] / GR.CFG.POWER[k] * 100) + '%';
      });
    },
    coinPulse: function () {
      var el = document.querySelector('.coin-card');
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    },
    toast: function (text, kind) {
      var box = $('toasts');
      var el = document.createElement('div');
      el.className = 'toast ' + (kind || '');
      el.textContent = text;
      box.appendChild(el);
      while (box.children.length > 3) box.removeChild(box.firstChild);
      setTimeout(function () { el.classList.add('out'); }, kind === 'big' ? 1100 : 1500);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, kind === 'big' ? 1550 : 1950);
    },
    turnHint: function (show, junction) {
      var el = $('turn-hint');
      if (!show) { el.classList.add('hidden'); return; }
      el.className = 'turn-hint ' + junction;
    },
    danger: function (on) { $('danger').classList.toggle('on', !!on); },

    showGameOver: function (r) {
      var m = document.querySelector('#screen-over .modal');
      m.classList.toggle('best', r.isBest);
      $('over-title').textContent = r.headline;
      $('over-reason').textContent = r.reason;
      $('over-coins').innerHTML = '&#8358;' + U.fmt(r.coins);
      $('over-dist').textContent = U.fmt(r.distance) + ' m';
      $('over-best').textContent = U.fmt(r.best);
      var el = $('over-score'), start = performance.now();
      (function tick(now) { // count up
        var t = Math.min(1, (now - start) / 700);
        el.textContent = U.fmt(r.score * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      })(start);
      var self = this;
      setTimeout(function () { self.hideAll(); $('screen-over').classList.add('show'); self.current = 'over'; }, 50);
    },

    fps: function (v) { if (this.settings && this.settings.fps) $('fps').textContent = v + ' fps'; }
  };

  GR.UI = UI;
})();
