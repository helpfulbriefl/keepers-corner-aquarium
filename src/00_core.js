import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/* =====================================================================
   1. RENDERER, SCENE, SHARED STATE
   World convention: +X right, +Y up, +Z toward the viewer (tank front).
   1 world unit ≈ 12 cm. Tank: x −3.5…3.5, y −2.2…2.25, z −1.75…1.75.
   ===================================================================== */
const appEl = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.id = 'scene-canvas';
renderer.domElement.setAttribute('aria-label', 'Interactive 3D aquarium scene');
appEl.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 240);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.screenSpacePanning = true;
controls.minDistance = 2.5;
controls.maxDistance = 70;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI * 0.54;
controls.zoomSpeed = 0.8;

const clock = new THREE.Clock();
const S = {
  paused: false, sim: 0, real: 0,
  night: 0, nightTarget: 0,
  view: 'room', uiHidden: false,
  lastInteract: 0, dragging: false,
  reduceMotion: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches,
  feedCooldownUntil: 0, tapCooldownUntil: 0,
};
// Shared uniforms (one object per uniform, referenced by every patched material)
const U = {
  time: { value: 0 }, night: { value: 0 }, caus: { value: 1 },
  waterCol: { value: new THREE.Color(0x1d6a86) }, fogDen: { value: 0.13 },
  tankMin: { value: new THREE.Vector3() }, tankMax: { value: new THREE.Vector3() },
};
const disposables = [];
const track = (x) => { disposables.push(x); return x; };

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
track(envTex);

/* ---------- small math helpers (seeded, allocation-free in the loop) ---------- */
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(20260930);
const rr = (a, b) => a + (b - a) * rand();
const ri = (a, b) => Math.floor(rr(a, b + 1));
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const smooth01 = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const col = (hex) => new THREE.Color(hex);
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m1 = new THREE.Matrix4(), _e1 = new THREE.Euler();
const _box = new THREE.Box3();
const UP = new THREE.Vector3(0, 1, 0), ZERO = new THREE.Vector3();
function curve(points) { return new THREE.CatmullRomCurve3(points.map(p => Array.isArray(p) ? V3(p[0], p[1], p[2]) : p)); }

/* ---------- procedural canvas textures ---------- */
function canvasTex(w, h, draw, opt = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (opt.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (opt.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
  return track(t);
}
function noiseDots(g, w, h, n, color, rmin, rmax, alpha) {
  for (let i = 0; i < n; i++) { g.globalAlpha = alpha * rr(0.4, 1); g.fillStyle = color; g.beginPath(); g.arc(rr(0, w), rr(0, h), rr(rmin, rmax), 0, 6.283); g.fill(); }
  g.globalAlpha = 1;
}
function handText(g, text, x, y, size, color = '#2c3a4a', rot = 0, font = 'Georgia, "Times New Roman", serif', style = 'italic ') {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = color; g.font = `${style}${size}px ${font}`; g.fillText(text, 0, 0); g.restore();
}

/* ---------- materials ---------- */
function std(color, rough = 0.7, metal = 0, extra = {}) { return track(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra })); }
function phys(extra) { return track(new THREE.MeshPhysicalMaterial(extra)); }
function basic(extra) { return track(new THREE.MeshBasicMaterial(extra)); }
function shade(mesh, cast = true, receive = true) { mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh; }
function mesh(geo, mat, cast = true, receive = true) { track(geo); return shade(new THREE.Mesh(geo, mat), cast, receive); }

/* GLSL shared by every underwater material: moving Voronoi caustics confined to the
   water box + Beer–Lambert style absorption along the underwater part of the view ray. */
const GLSL_HEAD = /* glsl */`
uniform float uTime; uniform float uNight; uniform float uCaus; uniform float uCausK;
uniform vec3 uWaterCol; uniform float uFogDen; uniform vec3 uTankMin; uniform vec3 uTankMax;
varying vec3 vCW;
`;
const GLSL_FRAG_FN = /* glsl */`
vec2 aqHash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float aqVoro(vec2 x, float t){
  vec2 n = floor(x), f = fract(x); float m1 = 8.0, m2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = aqHash2(n + g); o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    vec2 r = g + o - f; float d = dot(r, r);
    if (d < m1) { m2 = m1; m1 = d; } else if (d < m2) { m2 = d; }
  }
  return sqrt(m2) - sqrt(m1);
}
float aqCaustic(vec2 p, float t){
  float a = aqVoro(p * 1.2 + vec2(t * 0.045, -t * 0.02), t * 0.55);
  float b = aqVoro(p * 1.85 + vec2(-t * 0.03, t * 0.05) + 7.3, t * 0.47 + 1.7);
  return (1.0 - smoothstep(0.0, 0.15, a)) * 0.62 + (1.0 - smoothstep(0.0, 0.1, b)) * 0.42;
}
vec2 aqBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
  vec3 lo = min(t0, t1), hi = max(t0, t1);
  return vec2(max(max(lo.x, lo.y), lo.z), min(min(hi.x, hi.y), hi.z));
}
`;
const GLSL_UNDERWATER = /* glsl */`
{
  vec3 aqN = normalize(inverseTransformDirection(normal, viewMatrix));
  float aqIn = step(uTankMin.x, vCW.x) * step(vCW.x, uTankMax.x) * step(uTankMin.z, vCW.z) * step(vCW.z, uTankMax.z) * step(vCW.y, uTankMax.y + 0.03);
  float aqDepth = clamp(uTankMax.y - vCW.y, 0.0, 6.0);
  float aqC = aqCaustic(vCW.xz * 0.95, uTime * 0.9);
  float aqLamp = exp(-pow(vCW.x * 0.27, 2.0) - pow(vCW.z * 0.42, 2.0));
  float aqUp = clamp(aqN.y * 0.7 + 0.3, 0.0, 1.0);
  outgoingLight += diffuseColor.rgb * vec3(0.55, 0.86, 1.0) * aqC * uCaus * uCausK * (0.3 + 0.7 * aqLamp) * aqUp * aqIn * (0.6 + 0.4 * exp(-aqDepth * 0.25));
  vec3 aqRd = vCW - cameraPosition; float aqL = length(aqRd); aqRd /= aqL;
  vec2 aqT = aqBox(cameraPosition, aqRd, uTankMin, uTankMax);
  float aqPath = clamp(aqL - max(aqT.x, 0.0), 0.0, 14.0) * aqIn;
  outgoingLight = mix(outgoingLight, uWaterCol, 1.0 - exp(-uFogDen * aqPath));
}
`;
const GLSL_WORLDPOS = /* glsl */`
{ vec4 aqW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  aqW = instanceMatrix * aqW;
  #endif
  vCW = (modelMatrix * aqW).xyz; }
`;
/* enhance(material, opts)
   opts.underwater: caustics + absorption (only for objects inside the water box)
   opts.caus: caustic strength multiplier
   opts.sway: { amp, speed } vertex sway driven by per-vertex aSway (0 root → 1 tip) and aPhase
   opts.tipGlow: THREE.Color — emissive tips (uses aSway), brighter at night
   The program cache key is built from feature flags only; values live in uniforms. */
function enhance(mat, opts = {}) {
  const flags = [opts.underwater ? 'U' : '', opts.sway ? 'S' : '', opts.tipGlow ? 'G' : '', opts.fishy ? 'F' : ''].join('');
  mat.customProgramCacheKey = () => 'aq-' + flags;
  const own = {
    uCausK: { value: opts.caus ?? 1 },
    uSwayAmp: { value: opts.sway ? opts.sway.amp : 0 }, uSwaySpeed: { value: opts.sway ? opts.sway.speed : 1 },
    uTipCol: { value: opts.tipGlow || new THREE.Color(0) }, uGlow: { value: opts.glow ?? 0.6 },
  };
  mat.userData.aq = own;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uTime: U.time, uNight: U.night, uCaus: U.caus, uWaterCol: U.waterCol, uFogDen: U.fogDen,
      uTankMin: U.tankMin, uTankMax: U.tankMax, ...own,
    });
    let vh = GLSL_HEAD, vb = '';
    if (opts.sway || opts.tipGlow) { vh += 'attribute float aSway; attribute float aPhase; uniform float uSwayAmp; uniform float uSwaySpeed; varying float vSway;\n'; vb += 'vSway = aSway;\n'; }
    if (opts.sway) vb += `{ float sw = aSway * aSway; float ph = uTime * uSwaySpeed + aPhase;
      transformed.x += (sin(ph + transformed.y * 1.7) + 0.35 * sin(ph * 2.3 + 1.3)) * uSwayAmp * sw;
      transformed.z += cos(ph * 0.83 + transformed.y * 1.3) * uSwayAmp * 0.7 * sw; }\n`;
    sh.vertexShader = vh + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + vb)
      .replace('#include <project_vertex>', GLSL_WORLDPOS + '#include <project_vertex>');
    let fh = GLSL_HEAD + GLSL_FRAG_FN;
    if (opts.sway || opts.tipGlow) fh += 'varying float vSway; uniform vec3 uTipCol; uniform float uGlow;\n';
    let frag = sh.fragmentShader;
    if (opts.tipGlow) frag = frag.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uTipCol * smoothstep(0.55, 1.0, vSway) * uGlow * (0.55 + 0.9 * uNight);\n');
    if (opts.underwater) frag = frag.replace('#include <opaque_fragment>', GLSL_UNDERWATER + '#include <opaque_fragment>');
    sh.fragmentShader = fh + frag;
  };
  return mat;
}
/* Add per-vertex sway weights to a geometry: aSway = normalised height within [y0, y1]. */
function addSway(geo, y0, y1, phase) {
  const p = geo.attributes.position, n = p.count; const sw = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { sw[i] = clamp((p.getY(i) - y0) / Math.max(1e-4, y1 - y0), 0, 1); ph[i] = phase; }
  geo.setAttribute('aSway', new THREE.BufferAttribute(sw, 1)); geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  return geo;
}
/* Merge helper that makes attribute sets compatible first (non-indexed, same attributes). */
function mergeSafe(geos, keep = ['position', 'normal', 'uv', 'color', 'aSway', 'aPhase']) {
  const list = geos.map(g => (g.index ? g.toNonIndexed() : g));
  const names = keep.filter(k => list.every(g => g.attributes[k]));
  for (const g of list) for (const k of Object.keys(g.attributes)) if (!names.includes(k)) g.deleteAttribute(k);
  const out = mergeGeometries(list, false);
  if (!out) throw new Error('mergeSafe failed');
  return out;
}
function colorize(geo, c) { const n = geo.attributes.position.count, a = new Float32Array(n * 3); const cc = c.isColor ? c : col(c); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
/* Distort a geometry's vertices with smooth pseudo-noise (for rocks, broken stone, wood). */
function lumpy(geo, amt, freq = 2.2, seed = 1) {
  const p = geo.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * freq + seed) * Math.cos(v.y * freq * 1.3 + seed * 2.1) + Math.sin(v.z * freq * 0.9 + seed * 3.7) * 0.6 + Math.sin((v.x + v.y + v.z) * freq * 2.1 + seed) * 0.25;
    v.multiplyScalar(1 + n * amt); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

/* ---------- placement helpers: one source of truth for "resting on" ---------- */
function boundsOf(obj) { obj.updateWorldMatrix(true, true); return new THREE.Box3().setFromObject(obj, true); }
function restOn(obj, surfaceY, sink = 0) { const b = boundsOf(obj); obj.position.y += surfaceY - b.min.y - sink; obj.updateWorldMatrix(true, true); return obj; }
const pickables = [];            // meshes/proxies that can be clicked: userData.action = string
function pickable(obj, action, label) { obj.traverse(o => { if (o.isMesh || o.isLine || o.isPoints) { o.userData.action = action; o.userData.label = label; } }); pickables.push(obj); return obj; }
