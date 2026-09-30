/* =====================================================================
   5. AQUARIUM: constants, sand height function, glass, frame, lamp, water
   ===================================================================== */
const TANK = { x0: -3.5, x1: 3.5, z0: -1.75, z1: 1.75, y0: -2.2, rim: 2.25, waterY: 2.03, g: 0.045 };
const IN = { x0: TANK.x0 + TANK.g, x1: TANK.x1 - TANK.g, z0: TANK.z0 + TANK.g, z1: TANK.z1 - TANK.g, y0: TANK.y0 + TANK.g };
const COUNTER_Y = -2.55, FLOOR_Y = -5.3, WALL_Z = -2.9;
U.tankMin.value.set(IN.x0, IN.y0, IN.z0);
U.tankMax.value.set(IN.x1, TANK.waterY, IN.z1);

/* sandHeight(x, z) is the single source of truth for the substrate surface.
   It builds the terrain mesh AND places every prop, plant, rock and creature. */
const MOUNDS = [ // x, z, radius, height
  [-2.55, -1.2, 1.45, 0.42], [2.75, -1.25, 0.95, 0.2], [1.75, -0.45, 1.0, 0.1], [-1.05, 0.05, 0.85, 0.16],
  [3.1, 0.65, 0.7, 0.1], [-3.0, 1.1, 0.7, 0.12], [0.35, -1.35, 0.8, 0.12],
];
function sandHeight(x, z) {
  const zt = (z - IN.z0) / (IN.z1 - IN.z0);                // 0 back … 1 front
  let y = -1.62 - 0.2 * zt;                                 // slope toward the viewer
  for (const [mx, mz, r, h] of MOUNDS) { const d2 = ((x - mx) ** 2 + (z - mz) ** 2) / (r * r); y += h * Math.exp(-d2 * 1.6); }
  y -= 0.085 * Math.exp(-(((x - 0.2) / 0.95) ** 2)) * (0.35 + 0.65 * zt);   // shallow valley through the centre
  // fine ripple ridges in the open front sand
  const m = smooth01(0.35, 0.75, zt) * Math.exp(-(((x - 0.1) / 2.0) ** 2));
  y += 0.011 * m * Math.sin(x * 21 + z * 6 + Math.sin(z * 3.1) * 2.2);
  y += 0.012 * Math.sin(x * 3.3 + 1.7) * Math.sin(z * 4.1 + 0.3);
  return y;
}
function inTank(x, z, margin = 0.1) { return x > IN.x0 + margin && x < IN.x1 - margin && z > IN.z0 + margin && z < IN.z1 - margin; }

const tank = new THREE.Group(); tank.name = 'tank'; scene.add(tank);

/* ---- glass: custom premultiplied shader, NO transmission (transmission hides transparent objects behind it) ---- */
function glassMaterial(w, h) {
  return track(new THREE.ShaderMaterial({
    uniforms: { uTint: { value: col(0xbfeff0) }, uNight: U.night, uSize: { value: new THREE.Vector2(w, h) }, uFlash: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vN; varying vec3 vW; varying vec2 vUv;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform vec3 uTint; uniform float uNight; uniform vec2 uSize; varying vec3 vN; varying vec3 vW; varying vec2 vUv;
      void main(){
        vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN); if (dot(N, V) < 0.0) N = -N;
        float ndv = clamp(dot(N, V), 0.0, 1.0); float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
        vec3 R = reflect(-V, N);
        vec3 env = mix(vec3(0.015, 0.025, 0.04), vec3(0.16, 0.23, 0.3), smoothstep(-0.3, 0.9, R.y));
        env += vec3(1.0, 0.8, 0.55) * pow(max(dot(R, normalize(vec3(-0.75, 0.35, 0.55))), 0.0), 60.0) * 1.3;
        env += vec3(0.55, 0.75, 1.0) * pow(max(dot(R, normalize(vec3(-0.9, 0.25, -0.35))), 0.0), 24.0) * 0.5;
        env += vec3(1.0, 0.97, 0.9) * pow(max(dot(R, normalize(vec3(0.1, 1.0, 0.25))), 0.0), 90.0) * 0.8;
        env *= mix(1.0, 0.35, uNight);
        vec2 e = min(vUv, 1.0 - vUv) * uSize; float edge = 1.0 - smoothstep(0.0, 0.045, min(e.x, e.y));
        float a = 0.035 + 0.22 * fres + 0.3 * edge;
        vec3 rgb = uTint * 0.014 * (1.0 - 0.8 * uNight) + env * (0.18 + fres * 1.3) + vec3(0.5, 0.85, 0.8) * edge * mix(0.28, 0.12, uNight);   // tiny constant term: no milky veil at night
        gl_FragColor = vec4(rgb, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.FrontSide,
  }));
}
const glassPanels = [];
function glassPanel(name, w, h, d, x, y, z, normal, order = 10) {
  const geo = track(new THREE.BoxGeometry(w, h, d));
  const size = [w, h, d].sort((a, b) => b - a);
  const m = new THREE.Mesh(geo, glassMaterial(size[0], size[1]));
  m.position.set(x, y, z); m.renderOrder = order; m.name = name;
  m.userData.action = 'glass'; m.userData.normal = normal; m.userData.label = 'Tap the glass';
  tank.add(m); glassPanels.push(m); return m;
}
{
  const H = TANK.rim - TANK.y0, cy = (TANK.rim + TANK.y0) / 2, g = TANK.g;
  glassPanel('glass-front', 7, H, g, 0, cy, TANK.z1 - g / 2, V3(0, 0, 1));
  glassPanel('glass-back', 7, H, g, 0, cy, TANK.z0 + g / 2, V3(0, 0, -1), -2);
  glassPanel('glass-left', g, H, 3.5 - 2 * g, TANK.x0 + g / 2, cy, 0, V3(-1, 0, 0));
  glassPanel('glass-right', g, H, 3.5 - 2 * g, TANK.x1 - g / 2, cy, 0, V3(1, 0, 0));
  glassPanel('glass-bottom', 7, g, 3.5, 0, TANK.y0 + g / 2, 0, V3(0, -1, 0), -3);
  pickables.push(...glassPanels.filter(p => p.name !== 'glass-bottom' && p.name !== 'glass-back'));
}
/* ---- frame, corner rods, plinth ---- */
const frameMat = std(0x0b0d0f, 0.55, 0.2);
{
  const t = 0.075;
  const add = (w, h, d, x, y, z) => { const m = mesh(new THREE.BoxGeometry(w, h, d), frameMat); m.position.set(x, y, z); tank.add(m); return m; };
  add(7.08, t, t, 0, TANK.rim - t / 2, TANK.z1 - 0.005); add(7.08, t, t, 0, TANK.rim - t / 2, TANK.z0 + 0.005);
  add(t, t, 3.58, TANK.x0 + 0.005, TANK.rim - t / 2, 0); add(t, t, 3.58, TANK.x1 - 0.005, TANK.rim - t / 2, 0);
  add(7.1, 0.13, t, 0, TANK.y0 + 0.06, TANK.z1 - 0.005); add(7.1, 0.13, t, 0, TANK.y0 + 0.06, TANK.z0 + 0.005);
  add(t, 0.13, 3.6, TANK.x0 + 0.005, TANK.y0 + 0.06, 0); add(t, 0.13, 3.6, TANK.x1 - 0.005, TANK.y0 + 0.06, 0);
  const rodMat = std(0x9fc9c6, 0.25, 0.1, { transparent: true, opacity: 0.55, depthWrite: false });
  for (const [x, z] of [[TANK.x0, TANK.z0], [TANK.x1, TANK.z0], [TANK.x0, TANK.z1], [TANK.x1, TANK.z1]]) {
    const r = mesh(new THREE.BoxGeometry(0.035, TANK.rim - TANK.y0 - 0.14, 0.035), rodMat, false, false);
    r.position.set(x - Math.sign(x) * 0.012, (TANK.rim + TANK.y0) / 2, z - Math.sign(z) * 0.012); r.renderOrder = 11; tank.add(r);
  }
  const plinth = mesh(new THREE.BoxGeometry(7.16, TANK.y0 - COUNTER_Y, 3.64), std(0x15181b, 0.8, 0.05));
  plinth.position.set(0, (TANK.y0 + COUNTER_Y) / 2, 0); tank.add(plinth);
}
/* ---- background film on the outside of the back glass ---- */
{
  const tex = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d5a78'); gr.addColorStop(0.55, '#0d3149'); gr.addColorStop(1, '#061522');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const x = rr(0, w), r = rr(30, 90); const rg = g.createRadialGradient(x, rr(0, h * 0.5), 0, x, rr(0, h), r); rg.addColorStop(0, 'rgba(90,170,200,0.10)'); rg.addColorStop(1, 'rgba(90,170,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
  });
  const film = mesh(new THREE.PlaneGeometry(6.96, TANK.rim - TANK.y0 - 0.1), std(0xffffff, 0.95, 0, { map: tex }), false, true);
  film.position.set(0, (TANK.rim + TANK.y0) / 2, TANK.z0 - 0.012); tank.add(film);
}
/* ---- lamp housing resting on the rim via two brackets ---- */
const tankLamp = new THREE.Group(); tank.add(tankLamp);
{
  const housing = mesh(new THREE.BoxGeometry(6.2, 0.14, 0.95), std(0x0c0e10, 0.45, 0.35));
  housing.position.set(0, 2.62, 0.1); tankLamp.add(housing);
  const bevel = mesh(new THREE.BoxGeometry(6.26, 0.03, 1.0), std(0x1c2126, 0.35, 0.6)); bevel.position.set(0, 2.69, 0.1); tankLamp.add(bevel);
  const stripMat = basic({ color: 0xfff2d8 }); stripMat.userData.dayNight = true;
  const strip = new THREE.Mesh(track(new THREE.PlaneGeometry(5.9, 0.26)), stripMat); strip.rotation.x = Math.PI / 2; strip.position.set(0, 2.545, 0.12); tankLamp.add(strip);
  const blue = new THREE.Mesh(track(new THREE.PlaneGeometry(5.9, 0.07)), basic({ color: 0x7fc8ff })); blue.rotation.x = Math.PI / 2; blue.position.set(0, 2.546, -0.2); tankLamp.add(blue);
  for (const sx of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.06, 0.35, 0.8), frameMat); leg.position.set(sx * 3.12, 2.43, 0.1); tankLamp.add(leg);
    const foot = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), frameMat); foot.position.set(sx * 3.3, TANK.rim + 0.02, 0.1); tankLamp.add(foot);
    const arm = mesh(new THREE.BoxGeometry(0.4, 0.05, 0.12), frameMat); arm.position.set(sx * 3.3, 2.28, 0.1); tankLamp.add(arm);
  }
  tankLamp.userData.strip = strip; tankLamp.userData.blue = blue;
}
/* ---- water: faint volume + animated surface with feed/bubble ripples ---- */
const waterVol = new THREE.Mesh(track(new THREE.BoxGeometry(IN.x1 - IN.x0 - 0.01, TANK.waterY - IN.y0, IN.z1 - IN.z0 - 0.01)),
  basic({ color: 0x3fa9c9, transparent: true, opacity: 0.05, depthWrite: false }));
waterVol.position.set(0, (TANK.waterY + IN.y0) / 2, 0); waterVol.renderOrder = 1; tank.add(waterVol);

const RIPPLES = Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -100, 0));
let rippleIdx = 0;
function addRipple(x, z, amp = 0.03) { RIPPLES[rippleIdx].set(x, z, S.sim, amp); rippleIdx = (rippleIdx + 1) % RIPPLES.length; }
const waterSurfMat = track(new THREE.ShaderMaterial({
  uniforms: { uTime: U.time, uNight: U.night, uRip: { value: RIPPLES }, uLamp: { value: V3(0, 2.6, 0.1) } },
  vertexShader: /* glsl */`uniform float uTime; uniform vec4 uRip[8]; varying vec3 vW; varying vec3 vN;
    float rip(vec2 p){ float h = 0.0; for (int i = 0; i < 8; i++){ vec4 r = uRip[i]; float age = uTime - r.z; if (age < 0.0 || age > 5.0) continue;
      float d = distance(p, r.xy); float fr = age * 1.25; float env = exp(-age * 0.9) * smoothstep(fr + 0.45, fr, d);
      h += r.w * env * sin((d - fr) * 15.0); } return h; }
    float wav(vec2 p){ return sin(p.x * 1.7 + uTime * 1.1) * 0.011 + sin(p.y * 2.3 - uTime * 0.9) * 0.009 + sin((p.x + p.y) * 3.3 + uTime * 1.7) * 0.005 + sin((p.x * 0.6 - p.y) * 5.1 - uTime * 2.3) * 0.003 + rip(p); }
    void main(){ vec4 w = modelMatrix * vec4(position, 1.0); float e = 0.04;
      float h = wav(w.xz); float hx = wav(w.xz + vec2(e, 0.0)) - wav(w.xz - vec2(e, 0.0)); float hz = wav(w.xz + vec2(0.0, e)) - wav(w.xz - vec2(0.0, e));
      w.y += h; vW = w.xyz; vN = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
      gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */`uniform float uNight; uniform vec3 uLamp; varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN); bool below = cameraPosition.y < vW.y; if (below) N = -N;
      float ndv = clamp(dot(N, V), 0.0, 1.0); float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
      vec3 L = normalize(uLamp - vW); vec3 H = normalize(L + V); float spec = pow(max(dot(N, H), 0.0), 180.0);
      vec3 deep = mix(vec3(0.03, 0.2, 0.26), vec3(0.01, 0.05, 0.09), uNight);
      vec3 sky = mix(vec3(0.24, 0.34, 0.4), vec3(0.04, 0.06, 0.1), uNight);
      vec3 c = mix(deep, sky, fres) + vec3(1.0, 0.95, 0.85) * spec * mix(1.6, 0.9, uNight);
      float a = 0.22 + 0.5 * fres + spec;
      if (below) { float tir = smoothstep(0.62, 0.78, 1.0 - ndv); c = mix(vec3(0.16, 0.42, 0.5), vec3(0.45, 0.7, 0.75), tir) * mix(1.0, 0.35, uNight) + spec * 0.5; a = 0.28 + 0.5 * tir; }
      gl_FragColor = vec4(c, clamp(a, 0.0, 0.92));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
}));
const waterSurf = new THREE.Mesh(track(new THREE.PlaneGeometry(IN.x1 - IN.x0 - 0.004, IN.z1 - IN.z0 - 0.004, 96, 48)), waterSurfMat);
waterSurf.rotation.x = -Math.PI / 2; waterSurf.position.y = TANK.waterY; waterSurf.renderOrder = 4; waterSurf.name = 'water-surface';
waterSurf.userData.action = 'water'; waterSurf.userData.label = 'Click the water to feed';
tank.add(waterSurf); pickables.push(waterSurf);
/* faint bright waterline + irregular mineral line on the inside of the glass */
{
  const lineMat = basic({ color: 0xcff6ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const minTex = canvasTex(1024, 32, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const x = rr(0, w), y = h * 0.5 + Math.sin(x * 0.02) * 4 + rr(-6, 6); g.fillStyle = `rgba(235,238,226,${rr(0.05, 0.35)})`; g.fillRect(x, y, rr(1, 5), rr(1, 3)); } });
  const minMat = std(0xffffff, 0.9, 0, { map: minTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const sides = [[7 - 0.1, 0, TANK.z1 - TANK.g - 0.003, 0], [7 - 0.1, 0, TANK.z0 + TANK.g + 0.003, Math.PI], [3.4, TANK.x0 + TANK.g + 0.003, 0, Math.PI / 2], [3.4, TANK.x1 - TANK.g - 0.003, 0, -Math.PI / 2]];
  for (const [w, x, z, ry] of sides) {
    const wl = new THREE.Mesh(track(new THREE.PlaneGeometry(w, 0.012)), lineMat); wl.position.set(x, TANK.waterY + 0.004, z); wl.rotation.y = ry; wl.renderOrder = 6; tank.add(wl);
    const ml = new THREE.Mesh(track(new THREE.PlaneGeometry(w, 0.09)), minMat); ml.position.set(x, TANK.waterY + 0.07, z); ml.rotation.y = ry; ml.renderOrder = 6; tank.add(ml);
    if (ry === Math.PI) { wl.rotation.y = 0; ml.rotation.y = 0; }
  }
}
/* algae patches (localised to lower edges/corners) and droplets outside the front glass */
{
  const algTex = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = rr(0, w), y = rr(h * 0.35, h), r = rr(8, 40); const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${ri(60, 90)},${ri(110, 140)},${ri(50, 70)},${rr(0.12, 0.3)})`); rg.addColorStop(1, 'rgba(70,120,60,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
    const fade = g.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.5, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
  });
  const algMat = std(0x9fd08a, 0.95, 0, { map: algTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const put = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), algMat); m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 6; tank.add(m); };
  put(1.5, 0.9, -2.7, -1.35, TANK.z1 - TANK.g - 0.004, Math.PI);
  put(1.1, 0.7, 2.9, -1.45, TANK.z1 - TANK.g - 0.004, Math.PI);
  put(1.4, 1.0, TANK.x1 - TANK.g - 0.004, -1.2, -0.9, -Math.PI / 2);
  put(1.2, 0.9, TANK.x0 + TANK.g + 0.004, -1.2, 0.5, Math.PI / 2);
  const dropGeo = track(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)); dropGeo.rotateX(Math.PI / 2);
  const drops = new THREE.InstancedMesh(dropGeo, phys({ color: 0xe8fbff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.5, envMap: envTex, envMapIntensity: 1.6, depthWrite: false }), 34);
  const dm = new THREE.Object3D();
  for (let i = 0; i < 34; i++) {
    const r = rr(0.012, 0.035), front = i < 24;
    if (front) dm.position.set(rr(-3.3, 3.3), rr(0.7, 2.15), TANK.z1 + 0.001); else dm.position.set(TANK.x1 + 0.001, rr(0.6, 2.1), rr(-1.5, 1.5));
    dm.rotation.set(0, front ? 0 : Math.PI / 2, 0); dm.scale.set(r, r * rr(1, 1.5), r * 0.45); dm.updateMatrix(); drops.setMatrixAt(i, dm.matrix);
  }
  drops.renderOrder = 12; tank.add(drops);
}
