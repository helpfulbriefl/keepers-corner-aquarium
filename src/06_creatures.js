/* =====================================================================
   9. SMALL CREATURES: snail on the inner left glass, cleaner shrimp on a rock, burrowing crab
   ===================================================================== */
const _ray = new THREE.Raycaster();
function reefSurfaceY(x, z) {                              // highest reef surface under (x, z), for placing things ON rocks
  reef.updateMatrixWorld(true); _ray.set(_v1.set(x, 3, z), _v2.set(0, -1, 0)); _ray.far = 6;
  const hits = _ray.intersectObjects(reef.children, true).filter(h => h.object.isMesh && !h.object.isInstancedMesh);
  return hits.length ? hits[0].point.y : sandHeight(x, z);
}
/* ---- snail: spiral shell swept along a conical helix, soft foot, two antennae ---- */
const snail = new THREE.Group(); snail.name = 'snail'; tank.add(snail);
const snailTrail = { pts: new Float32Array(160 * 3), n: 0, last: -99 };
{
  const shellMat = enhance(std(0xffffff, 0.45, 0.05, { vertexColors: true }), { underwater: true, caus: 0.5 });
  const pts = []; for (let i = 0; i <= 60; i++) { const th = i / 60 * Math.PI * 5.2, r = 0.012 * Math.exp(0.17 * th); pts.push(V3(Math.cos(th) * r, 0.09 - th * 0.0055, Math.sin(th) * r)); }
  const g = taperTube(new THREE.CatmullRomCurve3(pts), 120, 12, 0.004, 0.052, 0, 1); const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = i / p.count; const cc = col(0x6b4a2e).lerp(col(0xd9b98a), 0.5 + 0.5 * Math.sin(k * 60)); c.set([cc.r, cc.g, cc.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const shell = mesh(g, shellMat); shell.position.set(0, 0.05, -0.02); shell.rotation.set(0.25, 0, 0.15); snail.add(shell);
  const bodyMat = enhance(std(0x7d6a58, 0.7, 0, { transparent: false }), { underwater: true, caus: 0.4 });
  const foot = mesh(new THREE.SphereGeometry(1, 16, 10), bodyMat); foot.scale.set(0.045, 0.018, 0.1); foot.position.set(0, 0.012, 0.02); snail.add(foot);
  const head = mesh(new THREE.SphereGeometry(1, 12, 8), bodyMat); head.scale.set(0.03, 0.022, 0.03); head.position.set(0, 0.022, 0.1); snail.add(head);
  for (const sx of [-1, 1]) { const a = mesh(new THREE.ConeGeometry(0.005, 0.07, 6), bodyMat); a.position.set(sx * 0.018, 0.045, 0.125); a.rotation.set(0.9, 0, -sx * 0.4); snail.add(a); snail.userData['ant' + sx] = a; }
  snail.scale.setScalar(1.25);
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(snailTrail.pts, 3)); trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(track(trailGeo), basic({ color: 0xc8e8e0, transparent: true, opacity: 0.22, depthWrite: false })); trail.renderOrder = 7; tank.add(trail); snailTrail.line = trail;
}
function snailPos(t, out) { return out.set(IN.x0 + 0.004, -0.72 + 0.3 * Math.sin(t * 0.021 + 1.0), 0.55 + 0.42 * Math.sin(t * 0.013)); }
function updateSnail(t) {
  snailPos(t, _v1); snailPos(t + 1, _v2); const dir = _v2.sub(_v1).normalize(); const n = _v3.set(1, 0, 0), x = _v4.crossVectors(n, dir).normalize();
  _m1.makeBasis(x, n, dir); snail.quaternion.setFromRotationMatrix(_m1); snail.position.copy(_v1);
  for (const sx of [-1, 1]) snail.userData['ant' + sx].rotation.z = -sx * (0.4 + 0.12 * Math.sin(t * 1.3 + sx));
  if (t - snailTrail.last > 2.5) {                           // bounded trail ring buffer (160 points)
    snailTrail.last = t; const a = snailTrail.pts; if (snailTrail.n >= 160) { a.copyWithin(0, 3); snailTrail.n = 159; }
    a.set([_v1.x + 0.002, _v1.y, _v1.z], snailTrail.n * 3); snailTrail.n++;
    snailTrail.line.geometry.attributes.position.needsUpdate = true; snailTrail.line.geometry.setDrawRange(0, snailTrail.n);
    snailTrail.line.geometry.computeBoundingSphere();
  }
}
/* ---- cleaner shrimp: segmented translucent body, red dorsal stripe, long white antennae ---- */
const shrimp = new THREE.Group(); shrimp.name = 'shrimp'; reef.add(shrimp);
const SHRIMP = { spots: [], cur: 0, from: V3(), to: V3(), t: 1, wait: 6, legs: null, ants: null };
{
  const mat = enhance(phys({ color: 0xffffff, roughness: 0.35, vertexColors: true, clearcoat: 0.6, transparent: true, opacity: 0.93 }), { underwater: true, caus: 0.4 });
  const segs = [[0.0, 0.05, 0.045, 0.085], [-0.07, 0.042, 0.038, 0.05], [-0.115, 0.036, 0.032, 0.045], [-0.155, 0.03, 0.027, 0.04], [-0.19, 0.024, 0.021, 0.036], [-0.22, 0.018, 0.016, 0.032]];
  const body = new THREE.Group(); shrimp.add(body); let bend = 0;
  segs.forEach(([z, w, h, l], i) => {
    const g = new THREE.SphereGeometry(1, 14, 10); const p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); const cc = y > 0.35 ? (Math.abs(x) < 0.18 ? col(0xffffff) : col(0xd8261c)) : col(0xf2c46a).lerp(col(0xffe9b0), 0.5 - y * 0.5); c.set([cc.r, cc.g, cc.b], k * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const m = mesh(g, mat); m.scale.set(w, h, l); bend += i * 0.07; m.position.set(0, h * 0.8 - bend * 0.12, z); m.rotation.x = -bend * 0.4; body.add(m);
  });
  for (const sx of [-1, 1]) { const fan = mesh(new THREE.CircleGeometry(0.03, 8, 0, Math.PI), enhance(std(0xd8261c, 0.5, 0, { side: THREE.DoubleSide }), { underwater: true })); fan.position.set(sx * 0.012, -0.005, -0.26); fan.rotation.set(-Math.PI / 2 + 0.5, sx * 0.4, Math.PI); body.add(fan); }
  const eyeM = enhance(std(0x111111, 0.2), { underwater: true });
  for (const sx of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.009, 8, 6), eyeM); e.position.set(sx * 0.022, 0.06, 0.07); body.add(e); }
  const lineMat = basic({ color: 0xf8f4ea, transparent: true, opacity: 0.85 });
  const antGeo = new THREE.BufferGeometry(); antGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 12 * 3), 3));
  const idx = []; for (let a = 0; a < 4; a++) for (let i = 0; i < 11; i++) idx.push(a * 12 + i, a * 12 + i + 1); antGeo.setIndex(idx);
  SHRIMP.ants = new THREE.LineSegments(track(antGeo), lineMat); SHRIMP.ants.frustumCulled = false; shrimp.add(SHRIMP.ants);
  const legGeo = new THREE.BufferGeometry(); legGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(10 * 3 * 3), 3));
  const li = []; for (let l = 0; l < 10; l++) li.push(l * 3, l * 3 + 1, l * 3 + 1, l * 3 + 2); legGeo.setIndex(li);
  SHRIMP.legs = new THREE.LineSegments(track(legGeo), basic({ color: 0xf0d9a0 })); SHRIMP.legs.frustumCulled = false; shrimp.add(SHRIMP.legs);
  for (const [x, z] of [[-1.98, 0.68], [-1.8, 0.86], [-2.1, 0.9]]) SHRIMP.spots.push(V3(x, reefSurfaceY(x, z) + 0.005, z));
  shrimp.position.copy(SHRIMP.spots[0]); SHRIMP.from.copy(SHRIMP.spots[0]); SHRIMP.to.copy(SHRIMP.spots[0]); shrimp.rotation.y = 0.6; shrimp.scale.setScalar(1.3);
}
function updateShrimp(dt, t) {
  const S2 = SHRIMP; S2.wait -= dt;
  const near = FISH.some(f => f.pos.distanceTo(shrimp.position) < 0.55);
  if (S2.t >= 1 && (S2.wait <= 0 || (near && S2.wait < 4))) { S2.cur = (S2.cur + 1 + ri(0, 1)) % S2.spots.length; S2.from.copy(shrimp.position); S2.to.copy(S2.spots[S2.cur]); S2.t = 0; S2.wait = rr(6, 14); }
  if (S2.t < 1) { S2.t = Math.min(1, S2.t + dt / 1.4); const k = smooth01(0, 1, S2.t); shrimp.position.lerpVectors(S2.from, S2.to, k); shrimp.position.y += Math.sin(k * Math.PI) * 0.05;
    const dx = S2.to.x - S2.from.x, dz = S2.to.z - S2.from.z; if (Math.hypot(dx, dz) > 0.01) shrimp.rotation.y = damp(shrimp.rotation.y, Math.atan2(dx, dz), 5, dt); }
  const a = S2.ants.geometry.attributes.position.array; const walking = S2.t < 1;
  for (let k = 0; k < 4; k++) { const sx = k % 2 ? 1 : -1, long = k < 2, L = long ? 0.42 : 0.13; let x = sx * 0.012, y = 0.06, z = 0.1, ang = sx * (long ? 0.35 : 0.8), up = long ? 0.55 : 0.25;
    for (let i = 0; i < 12; i++) { const s = i / 11; a[(k * 12 + i) * 3] = x; a[(k * 12 + i) * 3 + 1] = y; a[(k * 12 + i) * 3 + 2] = z;
      const w = Math.sin(t * (long ? 1.7 : 3.1) + k + s * 3) * 0.35 * s; x += Math.sin(ang + w) * L / 11; z += Math.cos(ang + w) * L / 11; y += (up - s * 0.9) * L / 11 * 0.8; } }
  S2.ants.geometry.attributes.position.needsUpdate = true;
  const lp = S2.legs.geometry.attributes.position.array;
  for (let l = 0; l < 10; l++) { const sx = l % 2 ? 1 : -1, zz = 0.04 - Math.floor(l / 2) * 0.035, ph = t * (walking ? 14 : 2) + l * 1.3, sw = (walking ? 0.02 : 0.006) * Math.sin(ph);
    lp.set([sx * 0.02, 0.03, zz, sx * 0.05, 0.03, zz + sw, sx * 0.065, 0.0, zz + sw * 1.5], l * 9); }
  S2.legs.geometry.attributes.position.needsUpdate = true;
  shrimp.children[0].rotation.x = Math.sin(t * 1.2) * 0.03;
}
/* ---- crab: occasionally emerges from its burrow, sidesteps, hides again ---- */
const crab = new THREE.Group(); crab.name = 'crab'; reef.add(crab);
const CRAB = { home: V3(0.1, 0, 0.98), phase: 'hidden', t: 0, next: 14, walk: V3(), legs: [] };
{
  CRAB.home.y = sandHeight(0.1, 0.98);
  const shellM = enhance(std(0xc2542d, 0.55, 0.05), { underwater: true, caus: 0.6 }), dark = enhance(std(0x5a1f12, 0.6), { underwater: true });
  const body = mesh(new THREE.SphereGeometry(1, 16, 10), shellM); body.scale.set(0.12, 0.05, 0.09); body.position.y = 0.06; crab.add(body);
  for (const sx of [-1, 1]) {
    const stalk = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5), dark); stalk.position.set(sx * 0.03, 0.12, 0.06); crab.add(stalk);
    const eye = mesh(new THREE.SphereGeometry(0.012, 8, 6), enhance(std(0x0a0a0a, 0.2), { underwater: true })); eye.position.set(sx * 0.03, 0.15, 0.06); crab.add(eye);
    const arm = new THREE.Group(); arm.position.set(sx * 0.09, 0.06, 0.07); crab.add(arm);
    const up = mesh(new THREE.SphereGeometry(1, 10, 8), shellM); up.scale.set(0.025, 0.02, 0.05); up.position.set(sx * 0.02, 0, 0.035); arm.add(up);
    const claw = mesh(new THREE.SphereGeometry(1, 12, 8), shellM); claw.scale.set(0.035, 0.028, 0.05); claw.position.set(sx * 0.035, 0.005, 0.085); arm.add(claw);
    const tip = mesh(new THREE.ConeGeometry(0.012, 0.04, 6), dark); tip.rotation.x = Math.PI / 2; tip.position.set(sx * 0.035, 0.0, 0.135); arm.add(tip);
    crab.userData['arm' + sx] = arm;
    for (let k = 0; k < 4; k++) {
      const leg = new THREE.Group(); leg.position.set(sx * 0.1, 0.05, 0.04 - k * 0.035); leg.rotation.y = sx * (0.2 - k * 0.25); crab.add(leg);
      const a = mesh(new THREE.CylinderGeometry(0.007, 0.006, 0.08, 5), shellM); a.rotation.z = sx * 1.1; a.position.set(sx * 0.035, 0.02, 0); leg.add(a);
      const b = mesh(new THREE.CylinderGeometry(0.006, 0.003, 0.08, 5), dark); b.rotation.z = -sx * 0.35; b.position.set(sx * 0.085, -0.02, 0); leg.add(b);
      CRAB.legs.push({ leg, sx, k });
    }
  }
  crab.scale.setScalar(1.1); crab.position.copy(CRAB.home); crab.position.y -= 0.25; crab.visible = false;
}
function updateCrab(dt, t) {
  const C = CRAB; C.t += dt; const H = C.home; let walking = false;
  switch (C.phase) {
    case 'hidden': if (C.t > C.next) { C.phase = 'rise'; C.t = 0; crab.visible = true; crab.rotation.y = rr(-0.6, 0.6); } break;
    case 'rise': crab.position.set(H.x, H.y - 0.22 + 0.22 * smooth01(0, 1.2, C.t), H.z); if (C.t > 1.2) { C.phase = 'look'; C.t = 0; } break;
    case 'look': if (C.t > 1.6) { C.phase = 'out'; C.t = 0; const a = crab.rotation.y + Math.PI / 2 * (rand() < 0.5 ? 1 : -1); C.walk.set(H.x + Math.sin(a) * 0.38, 0, H.z + Math.cos(a) * 0.3); C.walk.x = clamp(C.walk.x, -0.6, 0.8); C.walk.z = clamp(C.walk.z, 0.6, 1.3); } break;
    case 'out': case 'back': {
      const k = smooth01(0, 2.2, C.t), from = C.phase === 'out' ? H : C.walk, to = C.phase === 'out' ? C.walk : H;
      const x = lerp(from.x, to.x, k), z = lerp(from.z, to.z, k); crab.position.set(x, sandHeight(x, z) - 0.005, z); walking = k < 1;
      if (C.t > 2.4) { C.t = 0; C.phase = C.phase === 'out' ? 'pause' : 'sink'; } break; }
    case 'pause': if (C.t > 2.2) { C.phase = 'back'; C.t = 0; } break;
    case 'sink': crab.position.set(H.x, H.y - 0.22 * smooth01(0, 1.0, C.t), H.z); if (C.t > 1.1) { C.phase = 'hidden'; C.t = 0; C.next = rr(18, 34); crab.visible = false; } break;
  }
  for (const L of C.legs) L.leg.rotation.x = walking ? Math.sin(t * 16 + L.k * 1.7 + (L.sx > 0 ? 0 : Math.PI)) * 0.35 : 0;
  for (const sx of [-1, 1]) crab.userData['arm' + sx].rotation.y = sx * (0.15 + 0.12 * Math.sin(t * 2 + sx));
}
function updateCreatures(dt, t) { updateSnail(t); updateShrimp(dt, t); updateCrab(dt, t); }
