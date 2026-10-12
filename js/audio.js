/* Gidi Rush - original Afrobeats-inspired procedural music + sound effects (Web Audio API, no samples) */
(function () {
  'use strict';
  var GR = window.GR;

  var A = {
    ctx: null, master: null, music: null, sfx: null, noise: null,
    musicOn: true, sfxOn: true, playing: false, step: 0, nextTime: 0, timer: null,
    bpm: 108, intensity: 0, bar: 0
  };

  A.init = function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var ctx = this.ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master = ctx.createGain(); this.master.gain.value = 0.8;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = this.musicOn ? 0.55 : 0; this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxOn ? 0.9 : 0; this.sfx.connect(this.master);
    var len = ctx.sampleRate;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  };

  A.setMusic = function (on) { this.musicOn = on; if (this.music) this.music.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05); };
  A.setSfx = function (on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05); };

  /* ---------- instruments ---------- */
  function env(g, t, a, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }
  A.osc = function (type, freq, t, dur, vol, dest, freqEnd) {
    var o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(dest || this.music);
    o.start(t); o.stop(t + dur + 0.05);
  };
  A.noiseHit = function (t, dur, vol, filterType, freq, dest, q) {
    var s = this.ctx.createBufferSource(); s.buffer = this.noise;
    var f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    var g = this.ctx.createGain(); env(g, t, 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest || this.music);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  };
  A.kick = function (t) { this.osc('sine', 150, t, 0.32, 0.9, null, 42); };
  A.clap = function (t) { this.noiseHit(t, 0.16, 0.35, 'bandpass', 1500, null, 0.8); this.noiseHit(t + 0.012, 0.1, 0.25, 'bandpass', 2200); };
  A.shaker = function (t, v) { this.noiseHit(t, 0.05, v, 'highpass', 7000); };
  A.rim = function (t) { this.osc('triangle', 1650, t, 0.05, 0.18); this.noiseHit(t, 0.03, 0.12, 'bandpass', 3000, null, 3); };
  A.logDrum = function (t, f) { this.osc('sine', f * 1.6, t, 0.38, 0.55, null, f); this.osc('triangle', f, t, 0.25, 0.18); };
  A.pluck = function (t, f, v) { this.osc('triangle', f, t, 0.22, v || 0.13); this.osc('sine', f * 2, t, 0.12, (v || 0.13) * 0.4); };
  A.pad = function (t, freqs, dur) {
    var self = this;
    freqs.forEach(function (f) {
      var o = self.ctx.createOscillator(), g = self.ctx.createGain(), fl = self.ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 12;
      fl.type = 'lowpass'; fl.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.028, t + 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(self.music); o.start(t); o.stop(t + dur + 0.1);
    });
  };

  /* A minor: Am - F - C - G (original progression, highlife-style picking) */
  var midi = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  var CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  var BASS = [45, 41, 36, 43];
  var KICK = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0];
  var CLAP = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  var RIM = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];   // 3-2 clave feel
  var LOG = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0];
  var PICK = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1];
  var LEAD = [76, 0, 74, 72, 0, 69, 0, 72, 74, 0, 76, 0, 79, 76, 74, 0, 72, 0, 69, 0, 67, 69, 0, 72, 69, 0, 0, 0, 64, 0, 67, 0];

  A.scheduleStep = function (step, t) {
    var s = step % 16, bar = Math.floor(step / 16), chord = CHORDS[bar % 4];
    var inten = this.intensity;
    if (KICK[s]) this.kick(t);
    if (CLAP[s]) this.clap(t);
    this.shaker(t, s % 2 ? 0.07 : 0.035);
    if (RIM[s]) this.rim(t);
    if (LOG[s]) this.logDrum(t, midi(BASS[bar % 4] + (s === 11 || s === 14 ? 7 : 0)));
    if (s === 0) this.pad(t, chord.map(function (n) { return midi(n); }), (60 / this.bpm) * 4);
    if (inten > 0.15) this.pluck(t, midi(chord[PICK[s]] + 12), s % 4 === 0 ? 0.12 : 0.07);
    if (inten > 0.5 && bar % 8 >= 4) { var n = LEAD[(bar % 2) * 16 + s]; if (n) this.pluck(t, midi(n), 0.1); }
  };

  A.startMusic = function () {
    if (!this.ctx || this.playing) return;
    this.playing = true; this.step = 0; this.nextTime = this.ctx.currentTime + 0.08;
    var self = this;
    this.timer = setInterval(function () {
      var spb = 60 / self.bpm / 4;
      while (self.nextTime < self.ctx.currentTime + 0.12) {
        self.scheduleStep(self.step, self.nextTime);
        self.nextTime += spb * (self.step % 2 ? 0.94 : 1.06); // a little swing
        self.step++;
      }
    }, 25);
  };
  A.stopMusic = function () { this.playing = false; clearInterval(this.timer); };
  A.setIntensity = function (v) { this.intensity = v; this.bpm = 106 + v * 10; };

  /* ---------- sound effects ---------- */
  A.play = function (name) {
    if (!this.ctx || !this.sfxOn) return;
    var t = this.ctx.currentTime, d = this.sfx, self = this;
    switch (name) {
      case 'coin': this.osc('square', 1320, t, 0.06, 0.08, d); this.osc('square', 1980, t + 0.05, 0.12, 0.07, d); break;
      case 'jump': this.osc('sine', 300, t, 0.2, 0.25, d, 720); break;
      case 'slide': this.noiseHit(t, 0.3, 0.25, 'bandpass', 900, d); break;
      case 'lane': this.noiseHit(t, 0.08, 0.1, 'highpass', 3000, d); break;
      case 'turn': this.noiseHit(t, 0.25, 0.3, 'bandpass', 1400, d, 2); this.osc('sine', 500, t, 0.15, 0.12, d, 900); break;
      case 'stumble': this.osc('sine', 120, t, 0.25, 0.7, d, 60); this.noiseHit(t, 0.15, 0.3, 'lowpass', 800, d); break;
      case 'crash':
        this.osc('sawtooth', 160, t, 0.5, 0.5, d, 40); this.noiseHit(t, 0.6, 0.6, 'lowpass', 1200, d);
        this.osc('sine', 80, t, 0.6, 0.9, d, 30); break;
      case 'power': [0, 4, 7, 12].forEach(function (n, i) { self.osc('triangle', midi(72 + n), t + i * 0.06, 0.18, 0.18, d); }); break;
      case 'shield': this.osc('sine', 600, t, 0.4, 0.25, d, 200); this.noiseHit(t, 0.3, 0.3, 'highpass', 4000, d); break;
      case 'horn': this.osc('square', 420, t, 0.12, 0.12, d); this.osc('square', 420, t + 0.18, 0.18, 0.12, d); break;
      case 'whistle': this.osc('sine', 2600, t, 0.12, 0.15, d, 2400); this.osc('sine', 2600, t + 0.16, 0.25, 0.15, d, 2300); break;
      case 'click': this.osc('triangle', 900, t, 0.05, 0.12, d); break;
      case 'over': [7, 4, 0, -5].forEach(function (n, i) { self.osc('triangle', midi(67 + n), t + i * 0.16, 0.3, 0.2, d); }); break;
      case 'best': [0, 4, 7, 12, 16].forEach(function (n, i) { self.osc('triangle', midi(67 + n), t + i * 0.1, 0.3, 0.2, d); }); break;
    }
  };

  GR.Audio = A;
})();
