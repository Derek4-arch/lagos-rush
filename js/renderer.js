/* Gidi Rush - Three.js scene, camera, lighting, sky dome and theme colour blending */
(function () {
  'use strict';
  var GR = window.GR, U = GR.U;

  function Renderer(canvas) {
    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.r = r;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
    this.scene.fog = new THREE.Fog('#f1d9b0', 45, 165);

    this.hemi = new THREE.HemisphereLight('#fff3dc', '#7a5a3a', 0.95);
    this.sun = new THREE.DirectionalLight('#fff0cf', 1.15);
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.skyU = {
      top: { value: new THREE.Color('#4f9fe0') }, bottom: { value: new THREE.Color('#fbe3bb') },
      sunCol: { value: new THREE.Color('#fff0cf') }, sunDir: { value: new THREE.Vector3(-0.5, 0.55, -1).normalize() }
    };
    var sky = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), new THREE.ShaderMaterial({
      uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 top; uniform vec3 bottom; uniform vec3 sunCol; uniform vec3 sunDir; varying vec3 vP;',
        'void main(){ float h = clamp(vP.y * 1.6 + 0.12, 0.0, 1.0); vec3 c = mix(bottom, top, pow(h, 0.75));',
        ' float s = max(dot(normalize(vP), normalize(sunDir)), 0.0); c += sunCol * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.25);',
        ' gl_FragColor = vec4(c, 1.0);',
        ' #include <colorspace_fragment>',
        '}'
      ].join('\n')
    }));
    sky.renderOrder = -1;
    this.sky = sky; this.scene.add(sky);

    this.water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshLambertMaterial({ color: '#3d6f7d' }));
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = -1.5;
    this.scene.add(this.water);

    this.cur = null; this.target = null;
    this.quality = 'auto';
    this.resize();
    var self = this;
    window.addEventListener('resize', function () { self.resize(); });
  }

  Renderer.prototype.setQuality = function (q) {
    this.quality = q;
    this.resize();
  };

  Renderer.prototype.resize = function () {
    var w = window.innerWidth, h = window.innerHeight;
    var dpr = window.devicePixelRatio || 1;
    var ratio = this.quality === 'high' ? Math.min(dpr, 2) : this.quality === 'low' ? Math.min(dpr, 1) * 0.75 : Math.min(dpr, 1.5);
    this.r.setPixelRatio(ratio);
    this.r.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 72 : 62;
    this.baseFov = this.camera.fov;
    this.camera.updateProjectionMatrix();
  };

  function themeState(t) {
    return {
      skyTop: new THREE.Color(t.skyTop), skyBottom: new THREE.Color(t.skyBottom), fog: new THREE.Color(t.fog),
      water: new THREE.Color(t.water), hemiSky: new THREE.Color(t.hemiSky), hemiGround: new THREE.Color(t.hemiGround),
      sun: new THREE.Color(t.sun), sunI: t.sunI, hemiI: t.hemiI, fogNear: t.fogNear, fogFar: t.fogFar,
      sunDir: new THREE.Vector3(t.sunDir[0], t.sunDir[1], t.sunDir[2]).normalize()
    };
  }

  Renderer.prototype.setTheme = function (name, instant) {
    this.target = themeState(GR.THEMES[name]);
    if (instant || !this.cur) this.cur = themeState(GR.THEMES[name]);
    this.apply();
  };

  Renderer.prototype.apply = function () {
    var c = this.cur;
    this.skyU.top.value.copy(c.skyTop); this.skyU.bottom.value.copy(c.skyBottom);
    this.skyU.sunCol.value.copy(c.sun); this.skyU.sunDir.value.copy(c.sunDir);
    this.scene.fog.color.copy(c.fog); this.scene.fog.near = c.fogNear; this.scene.fog.far = c.fogFar;
    this.water.material.color.copy(c.water);
    this.hemi.color.copy(c.hemiSky); this.hemi.groundColor.copy(c.hemiGround); this.hemi.intensity = c.hemiI;
    this.sun.color.copy(c.sun); this.sun.intensity = c.sunI;
  };

  Renderer.prototype.update = function (dt, focus) {
    if (this.cur && this.target) {
      var k = 1 - Math.exp(-1.6 * dt), c = this.cur, t = this.target;
      ['skyTop', 'skyBottom', 'fog', 'water', 'hemiSky', 'hemiGround', 'sun'].forEach(function (key) { c[key].lerp(t[key], k); });
      c.sunDir.lerp(t.sunDir, k).normalize();
      c.sunI = U.lerp(c.sunI, t.sunI, k); c.hemiI = U.lerp(c.hemiI, t.hemiI, k);
      c.fogNear = U.lerp(c.fogNear, t.fogNear, k); c.fogFar = U.lerp(c.fogFar, t.fogFar, k);
      this.apply();
    }
    this.sky.position.copy(this.camera.position);
    if (focus) {
      this.water.position.x = focus.x; this.water.position.z = focus.z;
      this.sun.position.set(focus.x + this.cur.sunDir.x * 50, 60, focus.z + this.cur.sunDir.z * 50);
      this.sun.target.position.set(focus.x, 0, focus.z);
    }
  };

  Renderer.prototype.render = function () { this.r.render(this.scene, this.camera); };

  GR.Renderer = Renderer;
})();
