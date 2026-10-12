/* Gidi Rush - boot: wires renderer, game, UI, input and the frame loop */
(function () {
  'use strict';
  var GR = window.GR;

  function boot() {
    if (!window.THREE) { document.querySelector('#screen-loading p').textContent = 'Could not load the 3D engine (js/vendor/three.min.js).'; return; }
    var renderer = new GR.Renderer(document.getElementById('c'));
    var audio = GR.Audio, ui = GR.UI;
    var game = new GR.Game(renderer, audio, ui);
    GR.game = game;
    ui.init(game, audio);
    game.enterMenu();

    new GR.Input(document.getElementById('game'), function (a) {
      if (a === 'mute') return ui.toggleMute();
      if (a === 'pause') {
        if (game.state === 'running') game.pause();
        else if (game.state === 'paused' && ui.current === 'pause') game.resume();
        else if (ui.stack.length) ui.back();
        return;
      }
      if (a === 'enter') {
        if (ui.current === 'title' || ui.current === 'select' || ui.current === 'over') ui.play();
        else if (game.state === 'paused' && ui.current === 'pause') game.resume();
        return;
      }
      if (game.state === 'running') { audio.init(); game.action(a); return; }
      if (game.state === 'menu' && ui.current === 'select' && (a === 'left' || a === 'right')) ui.cycleChar(a === 'left' ? -1 : 1);
    });

    document.addEventListener('visibilitychange', function () { if (document.hidden) game.pause(); });
    window.addEventListener('blur', function () { game.pause(); });

    var last = performance.now(), frames = 0, fpsT = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      game.update(dt);
      renderer.update(dt, game.pw);
      renderer.render();
      frames++; fpsT += dt;
      if (fpsT >= 0.5) { ui.fps(Math.round(frames / fpsT)); frames = 0; fpsT = 0; }
    }
    requestAnimationFrame(frame);
    // first frame compiled, reveal the menu
    setTimeout(function () { ui.show('title'); }, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
