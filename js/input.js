/* Gidi Rush - keyboard, touch swipe and mouse drag input */
(function () {
  'use strict';
  var GR = window.GR;

  function Input(target, onAction) {
    this.onAction = onAction;
    var self = this;
    var KEYS = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'up', KeyW: 'up', Space: 'up', ArrowDown: 'down', KeyS: 'down',
      KeyP: 'pause', Escape: 'pause', KeyM: 'mute', Enter: 'enter'
    };
    window.addEventListener('keydown', function (e) {
      var a = KEYS[e.code];
      if (!a) return;
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (a !== 'enter' || !e.repeat) {
        if (['left', 'right', 'up', 'down'].indexOf(a) >= 0) e.preventDefault();
        if (e.repeat && a !== 'pause') return;
        self.onAction(a, 'key');
      }
    });

    // Swipes (touch) and drags (mouse) share pointer events
    var start = null, fired = false;
    var TH = 28;
    target.addEventListener('pointerdown', function (e) {
      start = { x: e.clientX, y: e.clientY, t: performance.now() }; fired = false;
    });
    target.addEventListener('pointermove', function (e) {
      if (!start || fired) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      var th = e.pointerType === 'mouse' ? 40 : TH;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      var a = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      self.onAction(a, 'swipe');
      fired = true; // one move per swipe
    });
    var end = function (e) {
      if (start && !fired && performance.now() - start.t < 250) self.onAction('tap', e.pointerType);
      start = null;
    };
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', function () { start = null; });
    target.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  }

  GR.Input = Input;
})();
