/* =====================================================================
   8. CLOWNFISH — ONE continuous body mesh + flat fin sheets, pattern in the shader.
   Local axes: +Z = forward (nose), +Y = up, X = lateral, so Matrix4.lookAt(vel, 0, UP) aims the nose.
   Deliberately NO tube / torus / capsule / cylinder parts: the white bars, their black
   edging and the black fin margins are shader colour driven by vertex attributes.
   The swimming wave is a vertex-shader displacement masked to the rear of the fish,
   so body, fins and tail bend together and nothing separates.
   ===================================================================== */
const FZ0 = 0.42, FSL = 0.8, FISH_SCALE = 0.66;         // body: z = +0.42 (nose) … −0.38 (peduncle)
function fishProfile(u) {                                 // u: 0 nose → 1 caudal peduncle
  const e = (a, x) => Math.sqrt(Math.max(0, 1 - ((a - x) / a) ** 2));
  const top = 0.205 * (u < 0.4 ? e(0.4, u) : 1 - 0.68 * smooth01(0.4, 1.0, u));
  const bot = 0.168 * (u < 0.42 ? e(0.42, u) : 1 - 0.69 * smooth01(0.42, 1.0, u));
  const w = 0.103 * (u < 0.32 ? e(0.32, u) : 1 - 0.79 * smooth01(0.32, 1.0, u));
  const c = -0.014 * (1 - smooth01(0, 0.3, u)) + 0.008 * smooth01(0.1, 0.5, u) * (1 - smooth01(0.6, 1.0, u));
  return { top, bot, w, c };
}
function hermite(xs, ys, x) {                             // C1 spline through table points (x-space tangents)
  const n = xs.length; let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i], t = clamp((x - xs[i]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
  const m = (k) => k <= 0 ? (ys[1] - ys[0]) / (xs[1] - xs[0]) : k >= n - 1 ? (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]) : (ys[k + 1] - ys[k - 1]) / (xs[k + 1] - xs[k - 1]);
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m(i + 1);
}
function fishSurface(u, ct, st) {                         // one source of truth for body + eye placement
  const P = fishProfile(u); const h = lerp(P.bot, P.top, smooth01(-0.35, 0.35, ct));
  const bump = 0.011 * Math.exp(-(((u - 0.13) / 0.045) ** 2) - (((ct - 0.3) / 0.32) ** 2));
  return V3(P.w * st + Math.sign(st) * bump, P.c + h * ct, FZ0 - u * FSL);
}
function sheetGeo(NU, NV, fn, part) {                     // flat fin sheet with pattern attributes
  const pos = [], yn = [], edge = [], ray = [], idx = [];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const r = fn(i / (NU - 1), j / (NV - 1)); pos.push(r.p[0], r.p[1], r.p[2]); yn.push(r.yn); edge.push(r.edge); ray.push(r.ray || 0); }
  for (let i = 0; i < NU - 1; i++) for (let j = 0; j < NV - 1; j++) { const a = i * NV + j, b = (i + 1) * NV + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aYn', new THREE.Float32BufferAttribute(yn, 1));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1)); g.setAttribute('aRay', new THREE.Float32BufferAttribute(ray, 1));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(part), 1));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
const DORSAL = { u: [0.2, 0.24, 0.3, 0.38, 0.46, 0.5, 0.54, 0.6, 0.68, 0.76, 0.83, 0.88, 0.9], h: [0.0, 0.05, 0.075, 0.085, 0.082, 0.068, 0.085, 0.13, 0.15, 0.14, 0.1, 0.04, 0.0] };
const ANAL = { u: [0.55, 0.6, 0.66, 0.72, 0.78, 0.83, 0.87], h: [0.0, 0.07, 0.11, 0.115, 0.09, 0.04, 0.0] };
function buildFishGeometry(fin = 1) {
  const NR = 46, NJ = 28, pos = [], yn = [], idx = [];
  const p0 = fishProfile(0); pos.push(0, p0.c, FZ0); yn.push(0);                       // nose tip vertex
  for (let i = 1; i < NR; i++) {
    const u = (1 - Math.cos(Math.PI * i / (NR - 1))) / 2;                               // rings denser at nose + tail
    for (let j = 0; j < NJ; j++) { const th = (j / NJ) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th); const p = fishSurface(u, ct, st); pos.push(p.x, p.y, p.z); yn.push(ct); }
  }
  for (let j = 0; j < NJ; j++) idx.push(0, 1 + (j + 1) % NJ, 1 + j);                       // nose fan (outward winding)
  for (let i = 0; i < NR - 2; i++) for (let j = 0; j < NJ; j++) {                             // no seam: ring index wraps
    const a = 1 + i * NJ + j, b = 1 + i * NJ + (j + 1) % NJ; idx.push(a, b, a + NJ, b, b + NJ, a + NJ);
  }
  const last = 1 + (NR - 2) * NJ, cap = pos.length / 3, pe = fishProfile(1); pos.push(0, pe.c, FZ0 - FSL - 0.004); yn.push(0);
  for (let j = 0; j < NJ; j++) idx.push(cap, last + j, last + (j + 1) % NJ);
  const body = new THREE.BufferGeometry(); const n = pos.length / 3;
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute('aYn', new THREE.Float32BufferAttribute(yn, 1));
  body.setAttribute('aEdge', new THREE.Float32BufferAttribute(new Float32Array(n), 1)); body.setAttribute('aRay', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  body.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(n), 1)); body.setIndex(idx); body.computeVertexNormals();
  // median fins: bases sunk 0.014 into the body so there is never a gap
  const dorsal = sheetGeo(44, 6, (s, t) => { const u = lerp(0.2, 0.9, s), P = fishProfile(u), h = fin * Math.max(0, hermite(DORSAL.u, DORSAL.h, u));
    return { p: [0.003 * Math.sin(u * 50) * t, P.c + P.top - 0.014 + t * (h + 0.014), FZ0 - u * FSL - t * (0.03 + 0.035 * u) * fin], yn: 1 + t, edge: t }; }, 1);
  const anal = sheetGeo(22, 5, (s, t) => { const u = lerp(0.55, 0.87, s), P = fishProfile(u), h = fin * Math.max(0, hermite(ANAL.u, ANAL.h, u));
    return { p: [0.003 * Math.sin(u * 50) * t, P.c - P.bot + 0.014 - t * (h + 0.014), FZ0 - u * FSL - t * 0.05 * fin], yn: -1 - t, edge: t }; }, 2);
  const zb = FZ0 - 0.975 * FSL;
  const caudal = sheetGeo(17, 8, (s, t) => { const sv = s * 2 - 1, L = 0.27 * fin * Math.sqrt(1 - 0.5 * sv * sv), h0 = 0.056, h1 = 0.18 * fin;
    return { p: [0.004 * Math.sin(sv * 9) * t, pe.c + sv * (h0 + (h1 - h0) * Math.pow(t, 0.8)), zb - t * L], yn: 0, edge: t, ray: sv }; }, 3);
  const pelv = [-1, 1].map(sx => sheetGeo(6, 5, (s, t) => { const u = lerp(0.25, 0.33, s), P = fishProfile(u); const d = V3(sx * 0.45, -0.8, -0.55).normalize(); const len = 0.13 * fin * (0.6 + 0.4 * s);
    return { p: [sx * 0.03 + d.x * t * len, P.c - P.bot * 0.9 + d.y * t * len, FZ0 - u * FSL + d.z * t * len], yn: -1, edge: t }; }, 4));
  const g = mergeGeometries([body, dorsal, anal, caudal, ...pelv], false);
  if (!g) throw new Error('fish geometry merge failed');
  [body, dorsal, anal, caudal, ...pelv].forEach(x => x.dispose());
  g.computeBoundingSphere(); g.boundingSphere.radius += 0.12;                             // room for the tail wave
  return track(g);
}
/* ---- fish shader chunks ---- */
const FISH_VHEAD = /* glsl */`
attribute float aYn; attribute float aPart; attribute float aEdge; attribute float aRay;
uniform float uPhase; uniform float uAmp; uniform float uMouth; uniform float uBend;
varying float vU; varying float vYn; varying float vPart; varying float vEdge; varying float vRay;
`;
const FISH_NORMAL = /* glsl */`
float fu = (${FZ0.toFixed(3)} - position.z) / ${FSL.toFixed(3)};
float fs = clamp((fu - 0.18) / 1.12, 0.0, 1.0); float fsm = fs * fs * (3.0 - 2.0 * fs);
float fm = fsm * fsm; float fmd = 2.0 * fsm * (6.0 * fs * (1.0 - fs) / 1.12);
float fph = uPhase - fu * 5.0;
float fdu = uAmp * (fmd * sin(fph) - fm * 5.0 * cos(fph)) + uBend * 2.0 * fs;
objectNormal.z -= (-fdu / ${FSL.toFixed(3)}) * objectNormal.x;
`;
const FISH_BEND = /* glsl */`
transformed.x += uAmp * fm * sin(fph) + uBend * fs * fs;
if (aPart < 0.5 && fu < 0.09 && aYn < -0.05) transformed.y -= uMouth * 0.022 * (1.0 - fu / 0.09) * smoothstep(-0.05, -0.7, aYn);
vU = fu; vYn = aYn; vPart = aPart; vEdge = aEdge; vRay = aRay;
`;
const FISH_FHEAD = /* glsl */`
varying float vU; varying float vYn; varying float vPart; varying float vEdge; varying float vRay;
uniform float uMouth; uniform float uVar; uniform float uHue;
float fBand(float u, float c, float hw, float aa){ return smoothstep(c - hw - aa, c - hw + aa, u) - smoothstep(c + hw - aa, c + hw + aa, u); }
`;
const FISH_COLOR = /* glsl */`
{
  float u = vU, yn = clamp(vYn, -1.0, 1.0);
  float aa = fwidth(u) * 1.1 + 0.0012;
  // linear-space colours: vivid ocellaris orange (sRGB ≈ #ff7a1c), deeper on the back, paler belly, darker snout
  vec3 orange = mix(vec3(1.0, 0.2 + uHue * 0.6, 0.014), vec3(0.86, 0.12 + uHue * 0.4, 0.006), smoothstep(-0.1, 0.95, vYn));
  orange = mix(orange, vec3(1.0, 0.34, 0.09), smoothstep(-0.2, -0.95, vYn) * 0.5 * step(vPart, 0.5));
  orange = mix(orange, vec3(0.72, 0.1, 0.008), (1.0 - smoothstep(0.0, 0.1, u)) * 0.45);
  vec3 white = vec3(0.97, 0.96, 0.93), black = vec3(0.022, 0.018, 0.018);
  vec3 c = orange;
  if (vPart < 1.5) {                                   // body and dorsal fin carry the three bars
    float yb = vPart < 0.5 ? yn : 1.0; float sw = 1.0 + uVar * 0.12;
    float c1 = 0.232 + 0.032 * (1.0 - yb * yb);                       // head bar follows the gill cover
    float h1 = 0.036 * sw * mix(0.72, 1.0, smoothstep(-1.0, 0.1, yb));
    float c2 = 0.53 - 0.07 * exp(-pow((yb - 0.1) / 0.4, 2.0));          // middle bar bulges toward the head
    float h2 = 0.038 * sw;
    float c3 = 0.9, h3 = 0.021 * sw;                                    // tail bar on the peduncle
    float bw = 0.0135;
    float ww = max(max(fBand(u, c1, h1, aa), fBand(u, c2, h2, aa)), fBand(u, c3, h3, aa));
    float kk = max(max(fBand(u, c1, h1 + bw, aa), fBand(u, c2, h2 + bw, aa)), fBand(u, c3, h3 + bw, aa));
    c = mix(c, black, kk); c = mix(c, white, ww);
  }
  if (vPart > 0.5) {                                   // fins: faint rays + light sub-margin + black margin
    float ea = fwidth(vEdge) * 1.2 + 0.002;
    float e0 = vPart > 3.5 ? 0.66 : (vPart > 2.5 ? 0.85 : 0.78);
    float rays = 0.5 + 0.5 * cos((vPart > 2.5 && vPart < 3.5 ? vRay * 9.0 : u * 62.0) * 3.14159);
    c = mix(c, c * 0.8, rays * 0.3 * smoothstep(0.1, 0.5, vEdge));
    c = mix(c, vec3(1.0, 0.66, 0.36), smoothstep(e0 - 0.2, e0 - 0.03, vEdge) * 0.3);
    c = mix(c, black, smoothstep(e0 - ea, e0 + ea, vEdge));
  } else {
    float sc = sin(u * 150.0 + yn * 22.0) * sin(u * 150.0 - yn * 22.0);   // faint scale lattice
    c *= 1.0 + 0.035 * sc;
    float mouth = (1.0 - smoothstep(0.012, 0.03 + 0.015 * uMouth, u)) * (1.0 - smoothstep(0.05, 0.14 + 0.1 * uMouth, abs(yn + 0.28)));
    c = mix(c, vec3(0.16, 0.03, 0.02), mouth * 0.85);
  }
  diffuseColor.rgb = c;
}
`;
function fishMaterial(i) {
  const m = phys({ color: 0xffffff, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.3, envMap: envTex, envMapIntensity: 0.3, side: THREE.DoubleSide });
  const own = { uPhase: { value: 0 }, uAmp: { value: 0.06 }, uMouth: { value: 0 }, uBend: { value: 0 }, uVar: { value: [-1, 0, 1][i] }, uHue: { value: [0.03, 0, -0.035][i] }, uCausK: { value: 0.55 } };
  m.userData.fish = own;
  m.customProgramCacheKey = () => 'aq-fish-1';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: U.time, uNight: U.night, uCaus: U.caus, uWaterCol: U.waterCol, uFogDen: U.fogDen, uTankMin: U.tankMin, uTankMax: U.tankMax, ...own });
    sh.vertexShader = GLSL_HEAD + FISH_VHEAD + sh.vertexShader
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + FISH_NORMAL)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FISH_BEND)
      .replace('#include <project_vertex>', GLSL_WORLDPOS + '#include <project_vertex>');
    sh.fragmentShader = GLSL_HEAD + GLSL_FRAG_FN + FISH_FHEAD + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + FISH_COLOR)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.6, step(0.5, vPart));\n')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.5, 0.25) * 0.045;\n')
      .replace('#include <opaque_fragment>', GLSL_UNDERWATER + '#include <opaque_fragment>');
  };
  return m;
}
/* pectoral fin: rounded paddle in the local YZ plane, pivot at its base (hinged, not bent) */
const pectoralGeo = (() => {
  const pos = [], clr = [], idx = [], NS = 11, T = [0, 0.45, 0.8, 0.93, 1];
  const o = col(0xff6a12), l = col(0xff9442), e = col(0xd9530c), k = col(0x6a2a08), cc = [o, l, l, e, k];   // orange paddle, only a faint dark rim
  for (let i = 0; i < NS; i++) { const ph = (i / (NS - 1)) * 2 - 1, R = 0.13 * (1 - 0.22 * ph * ph);
    T.forEach((t, j) => { const r = t * R; pos.push(0.006 * Math.sin(ph * 5) * t, Math.sin(ph * 0.95) * r * 0.78, -Math.cos(ph * 0.95) * r); clr.push(cc[j].r, cc[j].g, cc[j].b); }); }
  for (let i = 0; i < NS - 1; i++) for (let j = 0; j < T.length - 1; j++) { const a = i * T.length + j, b = (i + 1) * T.length + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(clr, 3)); g.setIndex(idx); g.computeVertexNormals();
  return track(g);
})();
const pectoralMat = enhance(std(0xffffff, 0.55, 0, { vertexColors: true, side: THREE.DoubleSide }), { underwater: true, caus: 0.4 });
const eyeGeo = track(new THREE.SphereGeometry(1, 20, 14));
const irisMat = enhance(std(0xb8691c, 0.3, 0.05), { underwater: true, caus: 0.15 });
const pupilMat = enhance(phys({ color: 0x030303, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, envMap: envTex, envMapIntensity: 0.9 }), { underwater: true, caus: 0 });
const glintMat = enhance(std(0x000000, 0.2, 0, { emissive: 0xffffff, emissiveIntensity: 1.4 }), { underwater: true, caus: 0 });
const blobTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(10,20,25,0.55)'); r.addColorStop(0.55, 'rgba(10,20,25,0.22)'); r.addColorStop(1, 'rgba(10,20,25,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const blobGeo = track(new THREE.PlaneGeometry(1, 1)); blobGeo.rotateX(-Math.PI / 2);

/* ---- behaviour ---- */
const FB = { x0: IN.x0 + 0.5, x1: IN.x1 - 0.5, z0: IN.z0 + 0.42, z1: IN.z1 - 0.42, y1: TANK.waterY - 0.34 };
const floorAt = (x, z) => sandHeight(x, z) + 0.36;
function freeSpot(p, pad = 0.2) { return !OBST.some(o => o.c.distanceTo(p) < o.r + pad); }
function randomSwimPoint(out, zone) {
  for (let k = 0; k < 40; k++) {
    let x = rr(FB.x0 + 0.2, FB.x1 - 0.2), z = rr(FB.z0 + 0.1, FB.z1 - 0.1);
    if (zone === 'front' && rand() < 0.65) z = rr(0.35, FB.z1 - 0.05);
    if (zone === 'shy' && rand() < 0.7) { x = rr(-2.6, -0.2); z = rr(-0.9, 0.9); }
    const y = rr(floorAt(x, z) + 0.12, FB.y1 - 0.2); out.set(x, y, z);
    if (freeSpot(out)) return out;
  }
  return out.set(rr(-1, 1), 0.3, rr(-0.2, 0.7));
}
const FISH = [];
const PERSONA = [
  { size: 0.88, fin: 0.94, cruise: 0.42, zone: 'front', arch: 0.1, anem: 0.18, label: 'curious' },
  { size: 1.0, fin: 1.0, cruise: 0.34, zone: 'shy', arch: 0.05, anem: 0.4, label: 'shy' },
  { size: 1.12, fin: 1.08, cruise: 0.4, zone: 'all', arch: 0.34, anem: 0.12, label: 'explorer' },
];
class Fish {
  constructor(i) {
    const P = PERSONA[i]; this.i = i; this.P = P; this.size = P.size;
    this.root = new THREE.Group(); this.root.name = 'clownfish-' + P.label;
    this.mat = fishMaterial(i); this.u = this.mat.userData.fish;
    const body = new THREE.Mesh(buildFishGeometry(P.fin), this.mat); body.castShadow = true; body.receiveShadow = true; body.name = 'fish-body'; this.root.add(body);
    for (const sx of [-1, 1]) {                                           // eyes embedded in the head surface
      const s = fishSurface(0.13, 0.3, sx * Math.sqrt(1 - 0.09)), n = V3(sx * 0.93, 0.26, 0.27).normalize();
      const iris = new THREE.Mesh(eyeGeo, irisMat); iris.scale.setScalar(0.047); iris.position.copy(s).addScaledVector(n, -0.016); this.root.add(iris);
      const pupil = new THREE.Mesh(eyeGeo, pupilMat); pupil.scale.setScalar(0.03); pupil.position.copy(iris.position).addScaledVector(n, 0.03); this.root.add(pupil);
      const gl = new THREE.Mesh(eyeGeo, glintMat); gl.scale.setScalar(0.0075); gl.position.copy(pupil.position).addScaledVector(n, 0.026).add(V3(0, 0.011, 0.008)); this.root.add(gl);
    }
    this.pecs = [-1, 1].map(sx => { const piv = new THREE.Group(); const a = fishSurface(0.245, -0.28, sx * 0.96); piv.position.set(a.x + sx * 0.004, a.y, a.z); piv.userData.sx = sx;
      const f = new THREE.Mesh(pectoralGeo, pectoralMat); f.castShadow = false; piv.add(f); this.root.add(piv); return piv; });
    this.root.scale.setScalar(FISH_SCALE * this.size);
    tank.add(this.root);
    this.pos = this.root.position; randomSwimPoint(this.pos, P.zone);
    this.vel = V3(rr(-1, 1), 0, rr(-0.5, 0.5)).setLength(0.25); this.dir = this.vel.clone().normalize();
    this.target = randomSwimPoint(V3(), P.zone); this.state = 'roam'; this.t = 0; this.dur = rr(4, 7);
    this.phase = rr(0, 6); this.amp = 0.05; this.roll = 0; this.bend = 0; this.mouth = 0; this.nibble = 0;
    this.fleeT = 0; this.fleeDir = V3(); this.slow = 0; this.way = []; this.wi = 0; this.ang = 0; this.food = null;
    this.q = new THREE.Quaternion(); _m1.lookAt(this.dir, ZERO, UP); this.root.quaternion.setFromRotationMatrix(_m1);
    this.shadow = new THREE.Mesh(blobGeo, basic({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -4 }));
    this.shadow.renderOrder = 2; reef.add(this.shadow);
  }
  choose() {                                                               // day-time state machine
    const r = rand(), P = this.P; this.t = 0;
    if (r < P.anem) { this.state = 'anemone'; this.dur = rr(7, 11); this.ang = Math.atan2(this.pos.z - ANEM.z, this.pos.x - ANEM.x); }
    else if (r < P.anem + P.arch) {
      this.state = 'arch'; this.wi = 0; const fwd = rand() < 0.5, A = ARCH.pass;
      const pts = [V3(A.x + 0.05, A.y + 0.55, A.z + 1.1), V3(A.x, A.y + 0.12, A.z + 0.45), V3(A.x, A.y, A.z), V3(A.x - 0.05, A.y + 0.08, A.z - 0.55), V3(A.x - 0.3, A.y + 0.45, A.z - 0.85)];
      this.way = fwd ? pts : pts.reverse(); this.dur = 16;
    } else if (r < P.anem + P.arch + 0.22) { this.state = 'hover'; this.dur = rr(1.6, 3.8); this.target.copy(this.pos); }
    else if (r < P.anem + P.arch + 0.32) { this.state = 'follow'; this.dur = rr(3.5, 6); this.lead = FISH[(this.i + 1 + ri(0, 1)) % FISH.length]; }
    else { this.state = 'roam'; this.dur = rr(4, 8); randomSwimPoint(this.target, P.zone); }
  }
  update(dt, t) {
    const p = this.pos, v = this.vel, acc = _v1.set(0, 0, 0);
    this.t += dt; let speed = this.P.cruise, arrive = 0.6, goal = this.target, avoidScale = 1;
    const food = nearestFood(p, 4.2);
    if (this.fleeT > 0) { this.fleeT -= dt; this.state = this.state === 'sleep' ? 'sleep' : this.state; }
    if (this.fleeT > 0) { acc.addScaledVector(this.fleeDir, 4.0); speed = 1.2; goal = null; }
    else if (food && S.night < 0.85) { this.state = 'food'; goal = food.pos; speed = 0.78; arrive = 0.3; this.food = food; }
    else if (S.night > 0.62) {
      if (this.state !== 'sleep') { this.state = 'sleep'; this.t = 0; }
      const a = this.i * 2.1 + Math.sin(t * 0.07 + this.i) * 0.4;
      goal = _v3.set(ANEM.x + Math.cos(a) * 0.3, ANEM.y + 0.66 + 0.04 * Math.sin(t * 0.4 + this.i), ANEM.z + Math.sin(a) * 0.3); speed = 0.1; arrive = 0.5;
    } else {
      if (this.state === 'food' || this.state === 'sleep') { this.choose(); }
      if (this.t > this.dur) this.choose();
      switch (this.state) {
        case 'roam': if (p.distanceTo(this.target) < 0.35) this.choose(); break;
        case 'hover': speed = 0.06; arrive = 0.3; this.target.y += Math.sin(t * 0.9 + this.i) * 0.02 * dt; break;
        case 'anemone': {                                              // approach, circle once, hover among tentacles
          const k = this.t / this.dur; this.ang += dt * (k < 0.75 ? 0.95 : 0.15);
          const rad = k < 0.75 ? 0.55 : 0.3, hh = k < 0.75 ? 0.75 : 0.62;
          goal = _v3.set(ANEM.x + Math.cos(this.ang) * rad, ANEM.y + hh, ANEM.z + Math.sin(this.ang) * rad); speed = k < 0.75 ? 0.26 : 0.1; arrive = 0.4; break; }
        case 'arch': { const w = this.way[this.wi]; goal = w; speed = 0.38; arrive = 0.25; avoidScale = 0.35;
          if (p.distanceTo(w) < 0.22) { this.wi++; if (this.wi >= this.way.length) this.choose(); } break; }
        case 'follow': { const L = this.lead; goal = _v3.copy(L.pos).addScaledVector(L.dir, -0.55); speed = 0.45; arrive = 0.4; if (L.state === 'arch') this.choose(); break; }
      }
    }
    if (goal) {                                                            // seek with arrival
      const to = _v2.subVectors(goal, p), d = to.length(); to.multiplyScalar(d > 1e-5 ? speed * Math.min(1, d / arrive) / d : 0);
      acc.addScaledVector(to.sub(v), 1.8);
    }
    let nx = 0, ny = 0, nz = 0, nc = 0;
    for (const o of FISH) if (o !== this) {                              // separation + mild alignment
      const d = p.distanceTo(o.pos);
      if (d < 0.6 && d > 1e-4) acc.addScaledVector(_v2.subVectors(p, o.pos).normalize(), (0.6 - d) * 2.4);
      if (d < 1.2) { nx += o.vel.x; ny += o.vel.y; nz += o.vel.z; nc++; }
    }
    if (nc && this.state === 'roam') acc.add(_v2.set(nx / nc - v.x, ny / nc - v.y, nz / nc - v.z).multiplyScalar(0.25));
    const look = _v4.copy(v).multiplyScalar(0.55).add(p);                    // obstacle proxies (look-ahead)
    for (const ob of OBST) {
      if ((this.state === 'anemone' || this.state === 'sleep') && ob.name === 'anemone') continue;
      if (this.state === 'arch' && ob.name.startsWith('drift')) continue;
      if (this.state === 'food' && this.food && ob.c.distanceTo(this.food.pos) < ob.r) continue;
      const R = ob.r + 0.14 * this.size, d = look.distanceTo(ob.c);
      if (d < R && d > 1e-4) acc.addScaledVector(_v2.subVectors(look, ob.c).divideScalar(d), (R - d) / R * 3.2 * avoidScale);
    }
    // soft boundaries toward the interior; near a corner add a pull to the centre so forces never cancel
    const m = 0.55; let edge = 0;
    const ex = p.x < FB.x0 + m ? (FB.x0 + m - p.x) : p.x > FB.x1 - m ? (FB.x1 - m - p.x) : 0;
    const ez = p.z < FB.z0 + m ? (FB.z0 + m - p.z) : p.z > FB.z1 - m ? (FB.z1 - m - p.z) : 0;
    acc.x += ex * 3.5; acc.z += ez * 3.5; edge = Math.abs(ex) + Math.abs(ez);
    if (Math.abs(ex) > 0 && Math.abs(ez) > 0) acc.add(_v2.set(-p.x, 0, 0.2 - p.z).normalize().multiplyScalar(0.8));
    const fl = floorAt(p.x, p.z); if (p.y < fl + 0.1) acc.y += (fl + 0.1 - p.y) * 6;
    if (p.y > FB.y1) acc.y -= (p.y - FB.y1) * 6;
    acc.y += Math.sin(t * 1.1 + this.i * 2) * 0.03;                       // gentle bob
    v.addScaledVector(acc, dt);
    const hz = Math.hypot(v.x, v.z), vyMax = Math.max(0.04, hz * 0.45); v.y = clamp(v.y, -vyMax, vyMax);   // pitch clamp
    const vmax = this.fleeT > 0 ? 1.35 : 0.9, sp = v.length(); if (sp > vmax) v.multiplyScalar(vmax / sp);
    p.addScaledVector(v, dt);
    // hard containment (last line of defence; steering should keep us far from it)
    p.x = clamp(p.x, IN.x0 + 0.32, IN.x1 - 0.32); p.z = clamp(p.z, IN.z0 + 0.3, IN.z1 - 0.3);
    p.y = clamp(p.y, sandHeight(p.x, p.z) + 0.2, TANK.waterY - 0.18);
    if (!Number.isFinite(p.x + p.y + p.z + v.x + v.y + v.z)) { randomSwimPoint(p); v.set(0.2, 0, 0); }
    // eat
    this.nibble = Math.max(0, this.nibble - dt);
    if (this.state === 'food' && this.food && this.food.alive) {
      const mouth = _v2.copy(this.dir).multiplyScalar(0.3 * FISH_SCALE * this.size).add(p);
      if (mouth.distanceTo(this.food.pos) < 0.12 * this.size) { eatFood(this.food); this.nibble = 0.45; this.mouth = 1; v.multiplyScalar(0.4); }
    }
    // orientation: face velocity (pitch-limited), bank into turns, frame-rate independent slerp
    const s2 = v.length();
    if (s2 > 0.015) { _v2.copy(v).divideScalar(s2); _v2.y = clamp(_v2.y, -0.42, 0.42); _v2.normalize(); this.dir.lerp(_v2, 1 - Math.exp(-5 * dt)).normalize(); }
    const yawRate = (Math.atan2(this.dir.x, this.dir.z) - (this.prevYaw ?? Math.atan2(this.dir.x, this.dir.z)));
    const yr = Math.atan2(Math.sin(yawRate), Math.cos(yawRate)) / Math.max(dt, 1e-3); this.prevYaw = Math.atan2(this.dir.x, this.dir.z);
    this.roll = damp(this.roll, clamp(-yr * 0.16, -0.38, 0.38), 4, dt);
    this.bend = damp(this.bend, clamp(-yr * 0.035, -0.06, 0.06), 6, dt);
    _m1.lookAt(this.dir, ZERO, UP); _q1.setFromRotationMatrix(_m1); _q2.setFromAxisAngle(_v3.set(0, 0, 1), this.roll); _q1.multiply(_q2);
    this.root.quaternion.slerp(_q1, 1 - Math.exp(-7 * dt));
    // tail beat, pectorals, mouth (respiration + feeding)
    const sn = clamp(s2 / 0.9, 0, 1), hover = this.state === 'hover' || this.state === 'sleep' || s2 < 0.12;
    this.phase += dt * (6.5 + sn * 15);
    this.amp = damp(this.amp, (hover ? 0.028 : 0.045 + sn * 0.07) + Math.abs(this.bend) * 0.4, 3, dt);
    const u = this.u; u.uPhase.value = this.phase; u.uAmp.value = this.amp; u.uBend.value = this.bend;
    this.mouth = damp(this.mouth, (food && p.distanceTo(food.pos) < 0.7) || this.nibble > 0 ? 1 : 0, 8, dt);
    u.uMouth.value = clamp(this.mouth + 0.18 + 0.14 * Math.sin(t * 3.1 + this.i), 0, 1);
    const pf = hover ? 13 : 7, pa = hover ? 0.42 : 0.22 + sn * 0.1;
    for (const pc of this.pecs) pc.rotation.set(0.15 * Math.sin(t * pf + 1.3), -pc.userData.sx * (0.35 + pa * (0.5 + 0.5 * Math.sin(t * pf + this.i + (pc.userData.sx > 0 ? 0 : 0.6)))), 0);
    // soft blob shadow on the sand (complements real shadow maps)
    const sy = sandHeight(p.x, p.z), hgt = p.y - sy, sh = this.shadow;
    sh.position.set(p.x, sy + 0.012, p.z); const k = clamp(1 - hgt / 3.2, 0, 1);
    sh.scale.set(0.34 * this.size * (1.5 - k * 0.5), 1, 0.62 * this.size * (1.5 - k * 0.5)); sh.rotation.y = Math.atan2(this.dir.x, this.dir.z);
    sh.material.opacity = 0.42 * k * k * (1 - 0.55 * S.night);
  }
}
for (let i = 0; i < 3; i++) FISH.push(new Fish(i));
/* Glass tap / Milo tap reaction: nearby fish dart away from the tapped panel, then resume. */
function scareFish(point, normal, radius = 2.6) {
  let n = 0;
  for (const f of FISH) {
    const d = f.pos.distanceTo(point); if (d > radius) continue;
    f.fleeDir.subVectors(f.pos, point); const along = f.fleeDir.dot(normal); if (along > 0) f.fleeDir.addScaledVector(normal, -along * 1.6);
    f.fleeDir.addScaledVector(normal, -0.9).normalize(); f.fleeT = rr(0.8, 1.25) * (1 - d / radius * 0.4); n++;
  }
  return n;
}
