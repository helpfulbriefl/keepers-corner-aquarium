/* =====================================================================
   6b. DRIFTWOOD ARCH, RUINS, TREASURE CHEST, BOTTLE, SMALL DETAILS
   ===================================================================== */
/* Tapered tube along a curve with uv.x along the length (for wood grain, cords, hoses). */
function taperTube(cv, segs, radial, r0, r1, wobble = 0, seed = 1) {
  const frames = cv.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs; cv.getPointAt(t, P); const r = lerp(r0, r1, t) * (1 + wobble * Math.sin(t * 23 + seed) * Math.sin(t * 7 + seed * 2));
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a);
      N.set(0, 0, 0).addScaledVector(frames.normals[i], c).addScaledVector(frames.binormals[i], s).normalize();
      pos.push(P.x + N.x * r, P.y + N.y * r, P.z + N.z * r); nor.push(N.x, N.y, N.z); uv.push(t * cv.getLength() * 1.5, j / radial);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return track(g);
}
const woodTex = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#4a3322'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${ri(20, 40)},${ri(12, 24)},${ri(8, 14)},${rr(0.25, 0.6)})`; g.lineWidth = rr(0.5, 2.2); const y = rr(0, h); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 2.5); g.stroke(); } noiseDots(g, w, h, 140, '#7a5a3d', 0.5, 1.5, 0.35); }, { repeat: [1, 1] });
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
const driftMat = enhance(std(0xffffff, 0.92, 0, { map: woodTex }), { underwater: true, caus: 0.9 });
/* ---- 1. twisted driftwood arch (legs buried in the sand), with a cave underneath ---- */
const ARCH = { x0: 0.85, x1: 2.35, z: -0.22 };
const drift = new THREE.Group(); reef.add(drift);
{
  const yA = sandHeight(ARCH.x0, ARCH.z + 0.1), yB = sandHeight(ARCH.x1, ARCH.z - 0.2);
  const main = curve([[ARCH.x0 - 0.12, yA - 0.25, ARCH.z + 0.12], [ARCH.x0 + 0.05, yA + 0.5, ARCH.z + 0.05], [1.45, yA + 1.12, ARCH.z - 0.05], [1.95, yB + 1.05, ARCH.z - 0.12], [ARCH.x1 - 0.02, yB + 0.45, ARCH.z - 0.2], [ARCH.x1 + 0.15, yB - 0.25, ARCH.z - 0.3]]);
  drift.add(mesh(taperTube(main, 60, 10, 0.13, 0.1, 0.18, 1), driftMat));
  const b1 = curve([[1.55, yA + 1.1, ARCH.z - 0.06], [1.8, yA + 1.45, ARCH.z - 0.45], [2.05, yA + 1.62, ARCH.z - 0.72]]);
  drift.add(mesh(taperTube(b1, 20, 7, 0.06, 0.018, 0.2, 3), driftMat));
  const b2 = curve([[ARCH.x0 + 0.03, yA + 0.42, ARCH.z + 0.05], [ARCH.x0 - 0.3, yA + 0.85, ARCH.z + 0.2], [ARCH.x0 - 0.42, yA + 1.2, ARCH.z + 0.05]]);
  drift.add(mesh(taperTube(b2, 16, 7, 0.05, 0.014, 0.2, 5), driftMat));
  const b3 = curve([[2.1, yB + 0.95, ARCH.z - 0.14], [2.45, yB + 1.05, ARCH.z + 0.2], [2.62, yB + 1.2, ARCH.z + 0.35]]);
  drift.add(mesh(taperTube(b3, 16, 7, 0.045, 0.012, 0.2, 7), driftMat));
  const root = curve([[ARCH.x1 - 0.05, yB + 0.2, ARCH.z - 0.25], [ARCH.x1 + 0.35, yB + 0.05, ARCH.z - 0.55], [ARCH.x1 + 0.55, yB - 0.1, ARCH.z - 0.75]]);
  drift.add(mesh(taperTube(root, 14, 6, 0.06, 0.03, 0.2, 9), driftMat));
  for (const t of [0.06, 0.2, 0.8, 0.94]) { const p = main.getPointAt(t); addObst(p.x, p.y, p.z, 0.24, 'drift-leg'); }
  for (const t of [0.4, 0.5, 0.6]) { const p = main.getPointAt(t); addObst(p.x, p.y + 0.08, p.z, 0.22, 'drift-top'); }
  ARCH.top = main.getPointAt(0.5).y; ARCH.pass = V3((ARCH.x0 + ARCH.x1) / 2, (yA + ARCH.top) / 2 - 0.05, ARCH.z);
  drift.userData.main = main;
}
/* ---- 2. miniature sunken temple ruins (back-left corner) ---- */
const stoneTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#7b847e'; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 900, '#5b645e', 0.5, 2.2, 0.5); noiseDots(g, w, h, 400, '#9aa39a', 0.5, 1.6, 0.4); });
const ruinMat = enhance(std(0xffffff, 0.93, 0, { map: stoneTex, vertexColors: true }), { underwater: true, caus: 1.0 });
function stoneize(g, amt = 0.02, seed = 1) {
  if (g.index) g = g.toNonIndexed(); const p = g.attributes.position, c = new Float32Array(p.count * 3); const A = col(pick([0x6e7772, 0x818b82, 0x59645d])), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = Math.sin(x * 9 + seed) * Math.sin(y * 7 - seed) * Math.sin(z * 8 + seed * 2); p.setXYZ(i, x + n * amt, y + n * amt * 0.5, z - n * amt); t.copy(A).lerp(col(0x3e4640), clamp(0.3 + n * 0.6, 0, 1) * 0.5); c.set([t.r, t.g, t.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return track(g);
}
const ruins = new THREE.Group(); reef.add(ruins);
const mossSpots = [];
function flutedColumn(h, r, broken) {
  const g = new THREE.CylinderGeometry(r, r * 1.05, h, 24, 10, false); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); const a = Math.atan2(z, x); const k = 1 - 0.07 * Math.max(0, Math.cos(a * 12)) ** 2; let yy = y; if (broken && y > h / 2 - 0.01) yy = y - rr(0, 0.16) - 0.08 * Math.sin(a * 3); p.setXYZ(i, x * k, yy, z * k); }
  return stoneize(g, 0.012, r * 10);
}
{
  const ax = -2.38, az = -1.28, ay = sandHeight(ax, az);
  // arch gate: two pillars + voussoirs, one missing, with a crack
  const gate = new THREE.Group(); gate.position.set(ax, ay - 0.12, az); gate.rotation.y = 0.18; ruins.add(gate);
  for (const sx of [-1, 1]) { const pl = mesh(stoneize(new THREE.BoxGeometry(0.26, 0.95, 0.3, 2, 4, 2), 0.02, sx + 3), ruinMat); pl.position.set(sx * 0.42, 0.47, 0); gate.add(pl); }
  for (let i = 0; i <= 8; i++) { if (i === 6) continue; const a = Math.PI * (i / 8); const v = mesh(stoneize(new THREE.BoxGeometry(0.2, 0.16, 0.28), 0.015, i), ruinMat); v.position.set(Math.cos(a) * 0.46, 0.95 + Math.sin(a) * 0.44, 0); v.rotation.z = a - Math.PI / 2 + (i === 7 ? 0.35 : 0); if (i === 7) v.position.y -= 0.06; gate.add(v); if (i % 3 === 1) mossSpots.push(v); }
  const lintelBit = mesh(stoneize(new THREE.BoxGeometry(0.22, 0.15, 0.27), 0.02, 9), ruinMat); lintelBit.position.set(0.72, 0.08, 0.32); lintelBit.rotation.set(0.3, 0.4, 1.1); gate.add(lintelBit);
  addObst(ax, ay + 0.6, az, 0.72, 'ruin-gate');
  // broken fluted column + fallen drum
  const cx = -3.05, cz = -0.72, cy = sandHeight(cx, cz);
  const colA = mesh(flutedColumn(1.1, 0.17, true), ruinMat); colA.position.set(cx, cy + 0.5, cz); colA.rotation.set(0.05, 0, -0.06); ruins.add(colA); mossSpots.push(colA);
  const base = mesh(stoneize(new THREE.BoxGeometry(0.46, 0.14, 0.46), 0.02, 4), ruinMat); base.position.set(cx, cy - 0.02, cz); ruins.add(base);
  addObst(cx, cy + 0.5, cz, 0.4, 'column');
  const drum = mesh(flutedColumn(0.36, 0.16, false), ruinMat); drum.rotation.set(Math.PI / 2, 0.6, 0); drum.position.set(-2.62, 0, -0.35); restOn(drum, sandHeight(-2.62, -0.35), 0.06); ruins.add(drum);
  // tilted slab
  const slab = mesh(stoneize(new THREE.BoxGeometry(0.62, 0.08, 0.42, 3, 1, 3), 0.02, 12), ruinMat); slab.position.set(-1.92, 0, -0.86); slab.rotation.set(0.25, 0.4, 0.32); restOn(slab, sandHeight(-1.92, -0.86), 0.1); ruins.add(slab); mossSpots.push(slab);
  addObst(-1.92, sandHeight(-1.92, -0.86) + 0.15, -0.86, 0.38, 'slab');
  // small staircase leading to the gate
  for (let i = 0; i < 3; i++) { const st = mesh(stoneize(new THREE.BoxGeometry(0.62 - i * 0.08, 0.1, 0.18), 0.012, 20 + i), ruinMat); st.position.set(ax + 0.08, 0, az + 0.52 - i * 0.16); st.rotation.y = 0.18; restOn(st, sandHeight(ax + 0.08, az + 0.52 - i * 0.16) + i * 0.08, 0.05); ruins.add(st); }
  // statue head fragment, half buried, looking up
  const head = new THREE.Group(); const hs = mesh(stoneize(new THREE.SphereGeometry(0.2, 16, 12), 0.015, 31), ruinMat); hs.scale.set(0.9, 1.15, 1); head.add(hs);
  const nose = mesh(stoneize(new THREE.BoxGeometry(0.05, 0.1, 0.07), 0.005, 2), ruinMat); nose.position.set(0, 0.0, 0.2); nose.rotation.x = -0.2; head.add(nose);
  const brow = mesh(stoneize(new THREE.BoxGeometry(0.2, 0.035, 0.06), 0.004, 3), ruinMat); brow.position.set(0, 0.07, 0.17); head.add(brow);
  for (const sx of [-1, 1]) { const eye = mesh(new THREE.SphereGeometry(0.024, 8, 6), std(0x2c332f, 1)); eye.position.set(sx * 0.06, 0.035, 0.175); head.add(eye); }
  head.position.set(-3.12, 0, -0.08); head.rotation.set(-0.7, 0.5, 0.3); restOn(head, sandHeight(-3.12, -0.08), 0.12); ruins.add(head); mossSpots.push(hs);
}
/* ---- moss clumps on wood and ruins (instanced soft blobs) ---- */
{
  const g = track(new THREE.IcosahedronGeometry(1, 1)); const n = 150; const im = new THREE.InstancedMesh(g, enhance(std(0x3f7a33, 0.95, 0), { underwater: true, caus: 0.7 }), n); const o = new THREE.Object3D(); let k = 0;
  const mossCol = [0x3d7a33, 0x2f6a2c, 0x5b8f3c, 0x4a8a3a].map(col);
  const addBlob = (p, s) => { if (k >= n) return; o.position.copy(p); o.rotation.set(rr(0, 3), rr(0, 3), rr(0, 3)); o.scale.set(s, s * 0.55, s); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k++, pick(mossCol)); };
  const mc = drift.userData.main; for (let i = 0; i < 46; i++) { const t = rr(0.25, 0.75); const p = mc.getPointAt(t); p.y += 0.1; p.x += rr(-0.06, 0.06); p.z += rr(-0.06, 0.06); addBlob(p, rr(0.03, 0.06)); }
  for (const m of mossSpots) { const b = boundsOf(m); for (let i = 0; i < 16; i++) addBlob(V3(rr(b.min.x, b.max.x), b.max.y - 0.01, rr(b.min.z, b.max.z)), rr(0.025, 0.05)); }
  im.count = k; reef.add(im);
}
/* ---- 3. treasure chest (lid pivots at its rear hinge) ---- */
const CHEST = { x: 2.08, z: 0.52, open: 0, target: 0, next: 9, phase: 'closed', t: 0 };
const chest = new THREE.Group(); reef.add(chest);
{
  const plank = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#4b2e1c'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = `rgba(0,0,0,${rr(0.15, 0.35)})`; g.fillRect(0, y, w, 2); } noiseDots(g, w, h, 200, '#6d472d', 0.5, 1.6, 0.4); });
  const wood = enhance(std(0xffffff, 0.85, 0, { map: plank }), { underwater: true, caus: 0.9 });
  const metal = enhance(std(0x9a7a3a, 0.45, 0.75), { underwater: true, caus: 0.6 });
  const W = 0.58, H = 0.3, D = 0.38;
  const bodyG = new THREE.Group(); chest.add(bodyG);
  const walls = [[W, 0.03, D, 0, 0.015, 0], [W, H, 0.03, 0, H / 2, D / 2 - 0.015], [W, H, 0.03, 0, H / 2, -D / 2 + 0.015], [0.03, H, D, W / 2 - 0.015, H / 2, 0], [0.03, H, D, -W / 2 + 0.015, H / 2, 0]];
  for (const [w, h, d, x, y, z] of walls) { const m = mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); bodyG.add(m); }
  for (const x of [-0.2, 0.2]) { const band = mesh(new THREE.BoxGeometry(0.045, H + 0.01, D + 0.012), metal); band.position.set(x, H / 2, 0); bodyG.add(band); }
  const lock = mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), metal); lock.position.set(0, H - 0.04, D / 2 + 0.012); bodyG.add(lock);
  // treasure inside
  const gold = std(0xe2b34a, 0.3, 0.9, { emissive: 0x3a2400, envMap: envTex, envMapIntensity: 1.2 });
  const coinG = track(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 12));
  for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(coinG, gold); c.position.set(rr(-0.23, 0.23), H - 0.06 + rr(0, 0.04), rr(-0.14, 0.14)); c.rotation.set(rr(-0.5, 0.5), rr(0, 3), rr(-0.5, 0.5)); bodyG.add(c); }
  const fill = mesh(new THREE.BoxGeometry(W - 0.06, 0.02, D - 0.06), gold, false, false); fill.position.y = H - 0.07; bodyG.add(fill);
  const pearlMat = std(0xfff6ea, 0.2, 0.1, { emissive: 0xfff0d8, emissiveIntensity: 0.4 });
  for (let i = 0; i < 5; i++) { const p = mesh(new THREE.SphereGeometry(0.026, 12, 8), pearlMat, false, false); p.position.set(rr(-0.18, 0.18), H - 0.03, rr(-0.1, 0.1)); bodyG.add(p); }
  // lid: half cylinder, pivot group placed at the back top edge
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, H, -D / 2); chest.add(lidPivot);
  const lidG = new THREE.CylinderGeometry(D / 2, D / 2, W, 16, 1, false, 0, Math.PI); lidG.rotateZ(Math.PI / 2); lidG.translate(0, 0, D / 2);
  const lid = mesh(lidG, wood); lidPivot.add(lid);
  for (const x of [-0.2, 0.2]) { const g = new THREE.CylinderGeometry(D / 2 + 0.008, D / 2 + 0.008, 0.045, 16, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.translate(x, 0, D / 2); lidPivot.add(mesh(g, std(0x9a7a3a, 0.45, 0.75, { side: THREE.DoubleSide }))); }
  const glow = new THREE.PointLight(0xffb347, 0, 2.2, 1.6); glow.position.set(0, H + 0.05, 0); chest.add(glow);
  chest.userData = { lidPivot, glow, W, H, D };
  chest.position.set(CHEST.x, 0, CHEST.z); chest.rotation.set(0.06, -0.45, -0.05); restOn(chest, sandHeight(CHEST.x, CHEST.z), 0.09);
  pickable(chest, 'chest', 'Treasure chest');
  addObst(CHEST.x, sandHeight(CHEST.x, CHEST.z) + 0.2, CHEST.z, 0.46, 'chest');
  const pearlsOut = [[2.45, 0.2], [2.52, 0.28], [1.72, 0.78]];
  for (const [x, z] of pearlsOut) { const p = mesh(new THREE.SphereGeometry(0.03, 12, 8), pearlMat); p.position.set(x, sandHeight(x, z) + 0.015, z); reef.add(p); }
}
/* ---- 4. sunken bottle with a rolled message, half buried near the front-left ---- */
{
  const prof = [[0.001, -0.28], [0.11, -0.28], [0.125, -0.25], [0.125, 0.07], [0.105, 0.13], [0.05, 0.2], [0.042, 0.3], [0.05, 0.31], [0.05, 0.33], [0.035, 0.335]].map(([r, y]) => new THREE.Vector2(r, y));
  const bottle = new THREE.Group();
  const glass = mesh(new THREE.LatheGeometry(prof, 24), phys({ color: 0x9fd6b0, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.32, envMap: envTex, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide }), false, false);
  glass.renderOrder = 3; bottle.add(glass);
  const cork = mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.07, 10), std(0x8a6a44, 0.9)); cork.position.y = 0.345; bottle.add(cork);
  const paper = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#e9dcbc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(80,60,40,0.45)'; g.fillRect(10, 8 + i * 9, rr(60, 100), 2); } });
  const scroll = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 14, 1), enhance(std(0xffffff, 0.9, 0, { map: paper }), { underwater: true, caus: 0.3 })); scroll.position.y = -0.06; bottle.add(scroll);
  const ribbon = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.025, 14, 1, true), std(0xb3342c, 0.7, 0, { side: THREE.DoubleSide })); ribbon.position.y = -0.06; bottle.add(ribbon);
  bottle.position.set(-2.72, 0, 1.18); bottle.rotation.set(0.15, 0.9, 1.25); restOn(bottle, sandHeight(-2.72, 1.18), 0.07); reef.add(bottle);
  addObst(-2.72, sandHeight(-2.72, 1.18) + 0.1, 1.18, 0.38, 'bottle');
}
/* ---- small handcrafted details ---- */
const detailMat = (c, r = 0.7, m = 0) => enhance(std(c, r, m), { underwater: true, caus: 0.8 });
let duck;
{
  // starfish on the sand and one stuck to the inside of the left glass
  const star = (r) => { const s = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rad = i % 2 === 0 ? r : r * 0.42; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; i === 0 ? s.moveTo(x, y) : s.lineTo(x, y); } return new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.03, bevelSegments: 2, curveSegments: 2 }); };
  const sf = mesh(star(0.16), detailMat(0xd9582f, 0.8)); sf.rotation.set(-Math.PI / 2, 0, 0.6); sf.position.set(-0.55, 0, 1.25); restOn(sf, sandHeight(-0.55, 1.25), 0.01); reef.add(sf);
  const sf2 = mesh(star(0.12), detailMat(0xe6a04a, 0.8)); sf2.rotation.set(0, Math.PI / 2, 0.4); sf2.position.set(IN.x0 + 0.03, -0.35, -0.75); reef.add(sf2);
  // shells: scallops and a small conch
  for (const [x, z, rot] of [[0.45, 1.45, 0.4], [1.25, 1.55, 2.2], [-0.95, 0.9, 4.1]]) {
    const g = new THREE.CircleGeometry(0.09, 14, 0, Math.PI); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)); p.setZ(i, 0.012 * Math.sin(a * 14) + 0.03 * Math.hypot(p.getX(i), p.getY(i)) * 3); }
    g.computeVertexNormals(); const m = mesh(g, enhance(std(0xf2dcc4, 0.6, 0, { side: THREE.DoubleSide }), { underwater: true, caus: 0.8 })); m.rotation.set(-Math.PI / 2 + 0.25, 0, rot); m.position.set(x, sandHeight(x, z) + 0.02, z); reef.add(m);
  }
  const conch = mesh(new THREE.ConeGeometry(0.06, 0.2, 10, 4), detailMat(0xe8c9a8, 0.6)); conch.rotation.set(Math.PI / 2 - 0.2, 0, 1.1); conch.position.set(1.9, 0, 1.2); restOn(conch, sandHeight(1.9, 1.2), 0.02); reef.add(conch);
  // tiny ceramic diver helmet
  const helmet = new THREE.Group(); const brass = detailMat(0xb58a4a, 0.35, 0.7);
  const dome = mesh(new THREE.SphereGeometry(0.16, 18, 14), brass); dome.position.y = 0.16; helmet.add(dome);
  const collar = mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.08, 18), brass); collar.position.y = 0.03; helmet.add(collar);
  for (const [a, y] of [[0, 0.17], [1.35, 0.15], [-1.35, 0.15]]) { const port = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 14), detailMat(0x1e3a44, 0.15, 0.3)); port.rotation.x = Math.PI / 2; port.position.set(Math.sin(a) * 0.15, y, Math.cos(a) * 0.15); port.lookAt(helmet.position.clone().setY(y)); port.rotateX(Math.PI / 2); helmet.add(port); }
  helmet.position.set(-2.12, 0, 1.4); helmet.rotation.set(0.1, 0.5, 0.18); restOn(helmet, sandHeight(-2.12, 1.4), 0.06); reef.add(helmet); addObst(-2.12, sandHeight(-2.12, 1.4) + 0.15, 1.4, 0.3, 'helmet');
  // broken anchor, half buried
  const anchor = new THREE.Group(); const iron = detailMat(0x3b3f42, 0.8, 0.5);
  const shank = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.55, 8), iron); shank.position.y = 0.27; anchor.add(shank);
  const arm = mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 16, Math.PI * 0.8), iron); arm.rotation.z = Math.PI * 1.1; anchor.add(arm);
  const ring = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12), iron); ring.position.y = 0.58; anchor.add(ring);
  anchor.position.set(1.62, 0, 1.36); anchor.rotation.set(0.2, -0.6, 1.2); restOn(anchor, sandHeight(1.62, 1.36), 0.08); reef.add(anchor);
  // stylised skull-shaped rock hidden beside the cave
  const skull = new THREE.Group(); const bone = detailMat(0xcfc6b0, 0.9);
  const cran = mesh(new THREE.SphereGeometry(0.13, 16, 12), bone); cran.scale.set(1, 0.9, 1.1); skull.add(cran);
  const jaw = mesh(new THREE.BoxGeometry(0.12, 0.05, 0.1), bone); jaw.position.set(0, -0.1, 0.05); skull.add(jaw);
  for (const sx of [-1, 1]) { const eye = mesh(new THREE.SphereGeometry(0.032, 8, 6), detailMat(0x1b1a18, 1)); eye.position.set(sx * 0.048, 0.0, 0.118); skull.add(eye); }
  skull.position.set(3.2, 0, -0.42); skull.rotation.set(0.1, -0.9, 0.12); restOn(skull, sandHeight(3.2, -0.42), 0.03); reef.add(skull);
  // "No Fishing" sign
  const sign = new THREE.Group(); const signTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#e9dfc6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a3b2a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#7a2a1e'; g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.fillText('NO', w / 2, 56); g.font = 'bold 36px Georgia, serif'; g.fillText('FISHING', w / 2, 100); noiseDots(g, w, h, 120, '#6b8a5a', 1, 4, 0.25); });
  const post = mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.55, 6), detailMat(0x5a4130, 0.9)); post.position.y = 0.27; sign.add(post);
  const board = mesh(new THREE.BoxGeometry(0.34, 0.17, 0.02), [detailMat(0x8a6a4a), detailMat(0x8a6a4a), detailMat(0x8a6a4a), detailMat(0x8a6a4a), enhance(std(0xffffff, 0.85, 0, { map: signTex }), { underwater: true, caus: 0.5 }), detailMat(0x8a6a4a)]);
  board.position.set(0, 0.5, 0.02); board.rotation.z = -0.08; sign.add(board);
  sign.position.set(-1.55, sandHeight(-1.55, 1.28) - 0.08, 1.28); sign.rotation.set(-0.05, 0.25, 0.06); reef.add(sign);
  // pebble balancing tower
  let py = sandHeight(0.2, 0.62) - 0.01; for (let i = 0; i < 5; i++) { const r = 0.085 - i * 0.012; const pb = mesh(new THREE.SphereGeometry(1, 12, 8), detailMat(pick([0x8f8577, 0x6f6a62, 0xa89c88]), 0.8)); pb.scale.set(r, r * 0.55, r * 1.1); pb.position.set(0.2 + rr(-0.01, 0.01), py + r * 0.5, 0.62); pb.rotation.y = rr(0, 3); reef.add(pb); py += r * 1.02; }
  // crab burrow entrance
  const burrow = mesh(new THREE.CircleGeometry(0.075, 16), detailMat(0x1d140e, 1), false, true); burrow.rotation.x = -Math.PI / 2 + 0.2; burrow.position.set(0.1, sandHeight(0.1, 0.98) + 0.012, 0.98); reef.add(burrow);
  const burrowRim = mesh(new THREE.TorusGeometry(0.085, 0.022, 6, 16), detailMat(0xb89a70, 0.95)); burrowRim.rotation.x = -Math.PI / 2 + 0.2; burrowRim.position.copy(burrow.position); reef.add(burrowRim);
  // hidden rubber duck behind the ribbon grass (humorous side-angle discovery)
  duck = new THREE.Group(); const yellow = detailMat(0xf3c623, 0.45);
  const db = mesh(new THREE.SphereGeometry(0.13, 16, 12), yellow); db.scale.set(1.25, 0.85, 1); duck.add(db);
  const dh = mesh(new THREE.SphereGeometry(0.08, 14, 10), yellow); dh.position.set(0.1, 0.13, 0); duck.add(dh);
  const beak = mesh(new THREE.ConeGeometry(0.03, 0.07, 8), detailMat(0xe8742a, 0.5)); beak.rotation.z = -Math.PI / 2; beak.position.set(0.19, 0.12, 0); duck.add(beak);
  for (const sz of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.012, 6, 5), detailMat(0x111111, 0.3)); e.position.set(0.15, 0.16, sz * 0.045); duck.add(e); }
  const tailD = mesh(new THREE.ConeGeometry(0.05, 0.08, 8), yellow); tailD.rotation.z = Math.PI / 2 + 0.5; tailD.position.set(-0.17, 0.05, 0); duck.add(tailD);
  duck.position.set(-3.2, 0, -1.48); duck.rotation.y = 0.9; restOn(duck, sandHeight(-3.2, -1.48), 0.03); reef.add(duck);
  duck.userData.rest = duck.position.clone(); duck.userData.anim = -1;
  pickable(duck, 'duck', 'Rubber duck?');
  // air stone hidden behind the rock at the back
  const airStone = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), detailMat(0x6b8fa6, 0.95)); airStone.rotation.z = Math.PI / 2; airStone.position.set(0.32, sandHeight(0.32, -1.55) + 0.03, -1.55); reef.add(airStone);
}
