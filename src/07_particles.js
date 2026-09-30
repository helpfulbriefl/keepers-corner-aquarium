/* =====================================================================
   10. FOOD, BUBBLES, PLANKTON, GOD RAYS (fixed-size pools, no allocation per frame)
   ===================================================================== */
const FOOD_MAX = 48, FOODS = [];
const foodMesh = new THREE.InstancedMesh(track(new THREE.DodecahedronGeometry(1, 0)), enhance(std(0xffffff, 0.8, 0), { underwater: true, caus: 0.3 }), FOOD_MAX);
{
  const pal = [0xc8743a, 0x9e3b22, 0xd9a55a, 0x6f8f3a].map(col); const o = new THREE.Object3D(); o.scale.setScalar(0);
  for (let i = 0; i < FOOD_MAX; i++) { FOODS.push({ i, pos: V3(), vel: V3(), alive: false, t: 0, landed: 0, float: 0, spin: rr(0, 6), s: rr(0.018, 0.028) }); o.updateMatrix(); foodMesh.setMatrixAt(i, o.matrix); foodMesh.setColorAt(i, pal[i % 4]); }
  foodMesh.frustumCulled = false; foodMesh.castShadow = false; tank.add(foodMesh);
}
function feedAt(x, z) {
  if (S.real < S.feedCooldownUntil) return false;
  S.feedCooldownUntil = S.real + 2.5;
  x = clamp(x, IN.x0 + 0.55, IN.x1 - 0.55); z = clamp(z, IN.z0 + 0.45, IN.z1 - 0.45);
  const n = ri(8, 15);
  for (let k = 0; k < n; k++) {
    let f = FOODS.find(q => !q.alive); if (!f) f = FOODS.reduce((a, b) => (a.t > b.t ? a : b));
    f.alive = true; f.t = 0; f.landed = 0; f.float = rr(0.2, 1.4);
    f.pos.set(x + rr(-0.28, 0.28), TANK.waterY - 0.015, z + rr(-0.22, 0.22)); f.vel.set(rr(-0.04, 0.04), 0, rr(-0.04, 0.04));
  }
  addRipple(x, z, 0.035); addRipple(x + 0.15, z - 0.1, 0.02);
  return true;
}
function nearestFood(p, r) {
  let best = null, bd = r;
  for (const f of FOODS) { if (!f.alive || f.landed > 6) continue; const d = f.pos.distanceTo(p) + (f.landed ? 0.8 : 0); if (d < bd) { bd = d; best = f; } }
  return best;
}
function eatFood(f) { f.alive = false; }
function updateFood(dt, t) {
  const o = _v3; let dirty = false;
  for (const f of FOODS) {
    if (!f.alive && !f.drawn) continue;
    dirty = true;
    if (f.alive) {
      f.t += dt;
      if (f.float > 0) { f.float -= dt; f.pos.x += Math.sin(t * 0.8 + f.i) * 0.01 * dt; }
      else if (!f.landed) {
        f.vel.y = damp(f.vel.y, -0.11, 1.5, dt); f.vel.x = damp(f.vel.x, Math.sin(t * 0.7 + f.i * 1.7) * 0.05, 1, dt); f.vel.z = damp(f.vel.z, Math.cos(t * 0.6 + f.i) * 0.04, 1, dt);
        f.pos.addScaledVector(f.vel, dt); f.pos.x = clamp(f.pos.x, IN.x0 + 0.1, IN.x1 - 0.1); f.pos.z = clamp(f.pos.z, IN.z0 + 0.1, IN.z1 - 0.1);
        const sy = sandHeight(f.pos.x, f.pos.z) + 0.012; if (f.pos.y <= sy) { f.pos.y = sy; f.landed = 0.001; }
      } else f.landed += dt;
      if (f.t > 32 || f.landed > 14) f.alive = false;
    }
    const sc = f.alive ? f.s * (f.landed > 11 ? clamp((14 - f.landed) / 3, 0, 1) : 1) : 0; f.drawn = f.alive;
    _m1.compose(f.pos, _q1.setFromEuler(_e1.set(f.spin + t * (f.landed ? 0 : 0.8), f.spin * 2, 0.3)), o.set(sc, sc * 0.35, sc * 1.2)); foodMesh.setMatrixAt(f.i, _m1);
  }
  if (dirty) foodMesh.instanceMatrix.needsUpdate = true;
}
/* ---- point-sprite material shared by bubbles / plankton / dust ---- */
const pointScale = { value: 800 };
function spriteMat(kind, extra = {}) {
  return track(new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uNight: U.night, uScale: pointScale, uColor: { value: col(extra.color ?? 0xffffff) }, uMin: { value: extra.min || V3() }, uMax: { value: extra.max || V3(1, 1, 1) }, uWaterCol: U.waterCol, uFogDen: U.fogDen, uOpacity: { value: extra.opacity ?? 1 } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uScale; uniform vec3 uMin; uniform vec3 uMax; attribute float aSize; attribute vec4 aSeed; varying float vA; varying float vDist;
      void main(){
        vec3 p = position;
        #if ${kind === 'drift' ? 1 : 0}
          vec3 span = uMax - uMin;
          p += vec3(sin(uTime * aSeed.x + aSeed.w), sin(uTime * aSeed.y + aSeed.w * 1.7) * 0.6 + uTime * aSeed.z, cos(uTime * aSeed.x * 0.8 + aSeed.w * 2.3)) * 0.18;
          p = uMin + mod(p - uMin, span);
          vA = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.x) + aSeed.w * 5.0);
        #else
          vA = 1.0;
        #endif
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z;
        gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uNight; uniform float uOpacity; varying float vA; varying float vDist;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0; if (d > 1.0) discard;
        #if ${kind === 'bubble' ? 1 : 0}
          float rim = smoothstep(0.62, 0.96, d) * (1.0 - smoothstep(0.96, 1.0, d));
          float hi = 1.0 - smoothstep(0.0, 0.22, length(c - vec2(-0.16, 0.16)));
          float a = (0.08 + rim * 0.75 + hi * 0.9) * uOpacity;
          vec3 rgb = mix(uColor, vec3(1.0), hi) * mix(1.0, 0.55, uNight);
        #else
          float a = (1.0 - smoothstep(0.0, 1.0, d)) * vA * uOpacity * (0.55 + 0.9 * uNight);
          vec3 rgb = uColor * (1.0 + uNight * 0.6);
        #endif
        gl_FragColor = vec4(rgb, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: kind === 'bubble' ? THREE.NormalBlending : THREE.AdditiveBlending,
  }));
}
/* ---- bubbles: aerator stream, chest burst, micro bubbles; they pop at the surface with a ripple ---- */
const BUB_MAX = 240, BUB = { pos: new Float32Array(BUB_MAX * 3), size: new Float32Array(BUB_MAX), vy: new Float32Array(BUB_MAX), ph: new Float32Array(BUB_MAX), alive: new Uint8Array(BUB_MAX), acc: 0, micro: 0, lastRipple: 0, next: 0 };
const bubGeo = new THREE.BufferGeometry();
bubGeo.setAttribute('position', new THREE.BufferAttribute(BUB.pos, 3)); bubGeo.setAttribute('aSize', new THREE.BufferAttribute(BUB.size, 1)); bubGeo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(BUB_MAX * 4), 4));
const bubbles = new THREE.Points(track(bubGeo), spriteMat('bubble', { color: 0xd8f6ff, opacity: 0.95 })); bubbles.frustumCulled = false; bubbles.renderOrder = 5; tank.add(bubbles);
const AERATOR = V3(0.32, sandHeight(0.32, -1.55) + 0.07, -1.55);
function spawnBubble(x, y, z, size, vy) {
  for (let k = 0; k < BUB_MAX; k++) { const i = (BUB.next + k) % BUB_MAX; if (BUB.alive[i]) continue;
    BUB.alive[i] = 1; BUB.pos.set([x, y, z], i * 3); BUB.size[i] = size; BUB.vy[i] = vy; BUB.ph[i] = rr(0, 6.28); BUB.next = (i + 1) % BUB_MAX; return true; }
  return false;
}
function bubbleBurst(p, n = 36) { for (let k = 0; k < n; k++) spawnBubble(p.x + rr(-0.12, 0.12), p.y + rr(0, 0.08), p.z + rr(-0.08, 0.08), rr(0.02, 0.055), rr(0.45, 0.95)); }
function updateBubbles(dt, t) {
  BUB.acc += dt * 13; while (BUB.acc > 1) { BUB.acc -= 1; spawnBubble(AERATOR.x + rr(-0.03, 0.03), AERATOR.y, AERATOR.z + rr(-0.03, 0.03), rr(0.018, 0.045), rr(0.55, 0.85)); }
  BUB.micro += dt; if (BUB.micro > 1.3) { BUB.micro = 0; const src = pick([[-3.05, -1.42], [1.55, -1.45], [-0.55, -1.45], [-2.35, 0.28]]); spawnBubble(src[0] + rr(-0.2, 0.2), sandHeight(src[0], src[1]) + rr(0.6, 1.6), src[1] + rr(-0.15, 0.15), 0.012, 0.3); }
  const P = BUB.pos;
  for (let i = 0; i < BUB_MAX; i++) {
    if (!BUB.alive[i]) { BUB.size[i] = 0; continue; }
    const j = i * 3; BUB.ph[i] += dt * 7;
    P[j] += Math.sin(BUB.ph[i]) * 0.05 * dt; P[j + 2] += Math.cos(BUB.ph[i] * 0.8) * 0.04 * dt; P[j + 1] += BUB.vy[i] * dt; BUB.size[i] *= 1 + dt * 0.05;
    P[j] = clamp(P[j], IN.x0 + 0.05, IN.x1 - 0.05); P[j + 2] = clamp(P[j + 2], IN.z0 + 0.05, IN.z1 - 0.05);
    if (P[j + 1] > TANK.waterY - 0.012) { BUB.alive[i] = 0; BUB.size[i] = 0; if (t - BUB.lastRipple > 0.45) { BUB.lastRipple = t; addRipple(P[j], P[j + 2], 0.008); } }
  }
  bubGeo.attributes.position.needsUpdate = true; bubGeo.attributes.aSize.needsUpdate = true;
}
/* ---- plankton & suspended particles (animated entirely in the vertex shader from sim time) ---- */
function driftPoints(n, min, max, color, size, opacity, parent, z = 0.35) {
  const pos = new Float32Array(n * 3), sz = new Float32Array(n), sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { pos.set([rr(min.x, max.x), rr(min.y, max.y), rr(min.z, max.z)], i * 3); sz[i] = size * rr(0.5, 1.4); sd.set([rr(0.05, 0.22), rr(0.05, 0.2), rr(-0.004, 0.006) * z, rr(0, 6.28)], i * 4); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
  const pts = new THREE.Points(track(g), spriteMat('drift', { color, min, max, opacity })); pts.frustumCulled = false; pts.renderOrder = 6; parent.add(pts); return pts;
}
const plankton = driftPoints(420, V3(IN.x0 + 0.05, IN.y0 + 0.4, IN.z0 + 0.05), V3(IN.x1 - 0.05, TANK.waterY - 0.05, IN.z1 - 0.05), 0xbfeedd, 0.02, 0.5, tank);
/* ---- god rays: soft additive light shafts under the lamp, drifting slowly ---- */
const rayTex = canvasTex(64, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in';
  const hz = g.createLinearGradient(0, 0, w, 0); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.5, 'rgba(0,0,0,1)'); hz.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = hz; g.fillRect(0, 0, w, h);
});
const godRays = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(track(new THREE.PlaneGeometry(rr(0.35, 0.8), 3.4)), basic({ map: rayTex, color: 0xcff4ff, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.position.set(-2.6 + i * 1.05 + rr(-0.2, 0.2), TANK.waterY - 1.7, rr(-0.9, 0.7)); m.rotation.set(0, rr(-0.35, 0.35), rr(-0.16, 0.16)); m.renderOrder = 3;
  m.userData.base = m.position.x; m.userData.ph = rr(0, 6); godRays.push(m); tank.add(m);
}
function updateRays(t) { for (const m of godRays) { m.position.x = m.userData.base + Math.sin(t * 0.07 + m.userData.ph) * 0.25; m.material.opacity = (0.055 + 0.03 * Math.sin(t * 0.23 + m.userData.ph)) * (1 - 0.8 * S.night); } }
function updateParticles(dt, t) { updateFood(dt, t); updateBubbles(dt, t); updateRays(t); }
