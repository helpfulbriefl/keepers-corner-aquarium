/* =====================================================================
   7. ANEMONE, PLANTS, CORAL
   ===================================================================== */
const ANEM = { x: -1.05, z: 0.05 }; ANEM.y = sandHeight(ANEM.x, ANEM.z);
const anemone = new THREE.Group(); anemone.position.set(ANEM.x, ANEM.y - 0.04, ANEM.z); reef.add(anemone);
{
  const prof = [[0.001, -0.08], [0.43, -0.08], [0.46, 0.02], [0.38, 0.14], [0.35, 0.27], [0.42, 0.37], [0.5, 0.42], [0.47, 0.455], [0.2, 0.44], [0.05, 0.42], [0.001, 0.41]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 36); const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)); const t = clamp(y / 0.45, 0, 1); const cc = col(0x5a1f3d).lerp(col(0x9a3d62), t + 0.1 * Math.sin(a * 9)); if (y > 0.43 && Math.hypot(p.getX(i), p.getZ(i)) < 0.08) cc.set(0x2a0f1d); c.set([cc.r, cc.g, cc.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  anemone.add(mesh(g, enhance(std(0xffffff, 0.55, 0, { vertexColors: true }), { underwater: true, caus: 0.7 })));
  // tentacle: tapered lathe with a bulb tip, local length 1 along +Y
  const tp = [[0.05, 0], [0.047, 0.1], [0.04, 0.3], [0.034, 0.55], [0.036, 0.72], [0.045, 0.84], [0.042, 0.93], [0.025, 0.985], [0.001, 1.0]].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(tp, 7); const tpp = tg.attributes.position, tc = new Float32Array(tpp.count * 3);
  for (let i = 0; i < tpp.count; i++) { const y = tpp.getY(i); const cc = col(0x6b2a4a).lerp(col(0xffffff), smooth01(0.25, 0.95, y)); tc.set([cc.r, cc.g, cc.b], i * 3); }
  tg.setAttribute('color', new THREE.BufferAttribute(tc, 3)); addSway(tg, 0, 1, 0);
  const N = 96; const phase = new Float32Array(tpp.count); tg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const tmat = enhance(std(0xffffff, 0.45, 0, { vertexColors: true }), { underwater: true, caus: 0.5, sway: { amp: 0.16, speed: 1.05 }, tipGlow: col(0xff7fb0), glow: 0.35 });
  const inst = new THREE.InstancedMesh(track(tg), tmat, N); const o = new THREE.Object3D();
  const tips = [0xffa0c8, 0xffc49a, 0xf6e7c8, 0xb8f08c, 0xff9fb8].map(col);
  const iPhase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const ring = Math.sqrt((i + 0.5) / N), ang = i * 2.39996 + rr(-0.2, 0.2), rad = 0.06 + ring * 0.4;
    o.position.set(Math.cos(ang) * rad, 0.43 - ring * 0.02, Math.sin(ang) * rad);
    const tilt = 0.15 + ring * 1.05 + rr(-0.12, 0.12); o.rotation.set(0, 0, 0); o.quaternion.setFromEuler(_e1.set(0, 0, 0));
    _q1.setFromAxisAngle(V3(-Math.sin(ang), 0, Math.cos(ang)), -tilt); o.quaternion.copy(_q1);
    const len = rr(0.42, 0.66) * (1.05 - ring * 0.25), thick = rr(0.85, 1.25); o.scale.set(thick, len, thick); o.updateMatrix();
    inst.setMatrixAt(i, o.matrix); inst.setColorAt(i, pick(tips)); iPhase[i] = rr(0, 6.28);
  }
  // per-instance phase: instanced attribute overrides the per-vertex aPhase
  tg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(iPhase, 1));
  inst.castShadow = true; inst.receiveShadow = true; anemone.add(inst); anemone.userData.tentacles = inst;
  addObst(ANEM.x, ANEM.y + 0.18, ANEM.z, 0.52, 'anemone');
}
/* ---- plants ---- */
const plantMat = enhance(std(0xffffff, 0.62, 0, { vertexColors: true, side: THREE.DoubleSide }), { underwater: true, caus: 0.55, sway: { amp: 0.09, speed: 1.0 } });
const leafMat = enhance(std(0xffffff, 0.55, 0, { vertexColors: true, side: THREE.DoubleSide }), { underwater: true, caus: 0.55, sway: { amp: 0.035, speed: 0.65 } });
function ribbonCluster(cx, cz, n, hMin, hMax, spread) {
  const geos = [], dark = col(0x1c4526), tip = col(0x8fd16a);
  for (let i = 0; i < n; i++) {
    const x = cx + rr(-spread, spread), z = cz + rr(-spread * 0.5, spread * 0.5); if (!inTank(x, z, 0.12)) continue;
    const base = sandHeight(x, z) - 0.05; const h = Math.min(rr(hMin, hMax), TANK.waterY - 0.3 - base); const w = rr(0.045, 0.075);
    const g = new THREE.PlaneGeometry(w, h, 1, 12); g.translate(0, h / 2, 0);
    const p = g.attributes.position, c = new Float32Array(p.count * 3), bend = rr(0.15, 0.5), tw = rr(-0.6, 0.6);
    for (let k = 0; k < p.count; k++) { const t = p.getY(k) / h; const xx = p.getX(k); p.setXYZ(k, xx * Math.cos(tw * t), p.getY(k), bend * t * t + xx * Math.sin(tw * t)); const cc = dark.clone().lerp(tip, Math.pow(t, 1.3)); c.set([cc.r, cc.g, cc.b], k * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.rotateY(rr(0, 6.28)); addSway(g, 0, h, rr(0, 6.28)); g.translate(x, base, z); g.computeVertexNormals(); geos.push(g);
  }
  const m = mesh(mergeSafe(geos), plantMat, true, true); reef.add(m); addObst(cx, sandHeight(cx, cz) + 0.5, cz, spread + 0.15, 'grass'); return m;
}
function leafShape(len, wid) { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(wid, len * 0.25, wid * 0.9, len * 0.75, 0, len); s.bezierCurveTo(-wid * 0.9, len * 0.75, -wid, len * 0.25, 0, 0); return s; }
function broadCluster(cx, cz, n, colA, colB) {
  const geos = [], A = col(colA), B = col(colB);
  for (let i = 0; i < n; i++) {
    const len = rr(0.45, 0.8), wid = rr(0.13, 0.2), stem = rr(0.08, 0.2);
    const g = new THREE.ShapeGeometry(leafShape(len, wid), 8); const p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, -0.25 * (x * x) / (wid * wid) * wid + 0.08 * Math.sin(y * 5)); const vein = Math.exp(-(x * x) / (0.00035)); const cc = A.clone().lerp(B, y / len * 0.8).lerp(col(0xd9f0a0), vein * 0.5); c.set([cc.r, cc.g, cc.b], k * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.translate(0, stem, 0);
    const lean = rr(0.35, 0.95), yaw = (i / n) * 6.28 + rr(-0.3, 0.3);
    g.rotateX(-lean); g.rotateY(yaw); addSway(g, 0, len + stem, rr(0, 6.28)); g.translate(cx, sandHeight(cx, cz) - 0.03, cz); g.computeVertexNormals(); geos.push(g);
    const sg = new THREE.CylinderGeometry(0.012, 0.016, stem + 0.04, 5); sg.translate(0, stem / 2, 0); colorize(sg, A.clone().multiplyScalar(0.7)); sg.rotateX(-lean * 0.4); sg.rotateY(yaw); addSway(sg, 0, len + stem, 0); sg.translate(cx, sandHeight(cx, cz) - 0.03, cz); geos.push(sg);
  }
  const m = mesh(mergeSafe(geos), leafMat, true, true); reef.add(m); addObst(cx, sandHeight(cx, cz) + 0.3, cz, 0.55, 'leafy'); return m;
}
function stemCluster(cx, cz, n, colA, colB) {
  const geos = [], A = col(colA), B = col(colB);
  for (let i = 0; i < n; i++) {
    const x = cx + rr(-0.16, 0.16), z = cz + rr(-0.12, 0.12), base = sandHeight(x, z) - 0.04, h = rr(0.7, 1.35), lean = rr(-0.18, 0.18), ph = rr(0, 6.28);
    const st = new THREE.CylinderGeometry(0.012, 0.016, h, 5, 6); st.translate(0, h / 2, 0); colorize(st, A.clone().multiplyScalar(0.6)); st.rotateZ(lean); addSway(st, 0, h, ph); st.translate(x, base, z); geos.push(st);
    for (let k = 1; k < 9; k++) {
      const t = k / 9, y = h * t;
      for (const sd of [-1, 1]) {
        const lg = new THREE.ShapeGeometry(leafShape(0.14 * (1.1 - t * 0.4), 0.05), 3); colorize(lg, A.clone().lerp(B, t));
        lg.rotateX(-0.9); lg.rotateY(sd > 0 ? 0 : Math.PI); lg.rotateY(k * 1.3); lg.translate(0, y, 0); lg.rotateZ(lean); addSway(lg, 0, h, ph); lg.translate(x, base, z); geos.push(lg);
      }
    }
  }
  const m = mesh(mergeSafe(geos), plantMat, true, true); reef.add(m); addObst(cx, sandHeight(cx, cz) + 0.5, cz, 0.35, 'stems'); return m;
}
ribbonCluster(-3.05, -1.42, 22, 1.6, 3.1, 0.34);
ribbonCluster(-0.55, -1.45, 16, 1.2, 2.5, 0.38);
ribbonCluster(1.55, -1.45, 18, 1.4, 2.9, 0.4);
broadCluster(-2.35, 0.28, 8, 0x1f5a2e, 0x4f9a45);
broadCluster(1.2, 0.5, 7, 0x245e2c, 0x5aa24c);
stemCluster(-0.12, -1.2, 7, 0x6d1b1b, 0xe0582a);
stemCluster(3.2, 0.02, 5, 0x5a1430, 0xc9423a);
/* ---- coral ---- */
const coralMat = enhance(std(0xffffff, 0.75, 0, { vertexColors: true }), { underwater: true, caus: 0.9 });
function branchingCoral(cx, cz, colA, colB, scale = 1) {
  const geos = [], A = col(colA), B = col(colB);
  const grow = (p, dir, len, rad, depth) => {
    const g = new THREE.CylinderGeometry(rad * 0.72, rad, len, 7, 1); g.translate(0, len / 2, 0);
    const c = A.clone().lerp(B, clamp(depth / 3, 0, 1)); colorize(g, c);
    _q1.setFromUnitVectors(UP, dir); g.applyQuaternion(_q1); g.translate(p.x, p.y, p.z); geos.push(g);
    const tip = p.clone().addScaledVector(dir, len);
    if (depth >= 3) { const bud = new THREE.SphereGeometry(rad * 0.75, 7, 5); colorize(bud, B.clone().lerp(col(0xfff1dc), 0.35)); bud.translate(tip.x, tip.y, tip.z); geos.push(bud); return; }
    const kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) { const nd = dir.clone().applyAxisAngle(UP, (k / kids) * 6.28 + rr(-0.5, 0.5)); nd.add(V3(rr(-0.5, 0.5), 0, rr(-0.5, 0.5))).normalize(); nd.lerp(UP, 0.45).normalize(); grow(tip, nd, len * rr(0.62, 0.8), rad * 0.72, depth + 1); }
  };
  grow(V3(0, 0, 0), V3(0, 1, 0), 0.32, 0.055, 0);
  const g = mergeSafe(geos); g.scale(scale, scale, scale); g.computeVertexNormals();
  const m = mesh(g, coralMat); m.position.set(cx, sandHeight(cx, cz) - 0.04, cz); m.rotation.y = rr(0, 6); reef.add(m);
  addObst(cx, m.position.y + 0.4 * scale, cz, 0.5 * scale, 'coral'); return m;
}
function brainCoral(cx, cz, r) {
  let g = new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.62); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
  const p = g.attributes.position, c = new Float32Array(p.count * 3), v = new THREE.Vector3(), A = col(0xe8d7b4), B = col(0x9b7c9c);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const ridge = Math.sin(v.x * 26 + Math.sin(v.z * 11) * 2.4) * Math.sin(v.z * 24 + Math.sin(v.y * 9) * 2.1); const k = 1 + 0.035 * ridge; p.setXYZ(i, v.x * r * k, v.y * r * k * 0.7, v.z * r * k); const cc = A.clone().lerp(B, clamp(0.5 - ridge * 0.6, 0, 1)); c.set([cc.r, cc.g, cc.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  const m = mesh(g, coralMat); m.position.set(cx, sandHeight(cx, cz) - r * 0.25, cz); reef.add(m); addObst(cx, m.position.y + r * 0.35, cz, r + 0.12, 'brain'); return m;
}
function tubeCoral(cx, cz, n) {
  const geos = [], A = col(0xd98a5f), inner = col(0x5b2a22);
  for (let i = 0; i < n; i++) {
    const r = rr(0.035, 0.06), h = rr(0.18, 0.46), x = rr(-0.18, 0.18), z = rr(-0.16, 0.16);
    const g = new THREE.CylinderGeometry(r, r * 1.15, h, 10, 1, true); g.translate(0, h / 2, 0); colorize(g, A.clone().lerp(col(0xf0c49a), rr(0, 0.6)));
    const lip = new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.02, 10, 1, true); lip.translate(0, h - 0.012, 0); colorize(lip, inner);
    const bottom = new THREE.CircleGeometry(r * 0.85, 10); bottom.rotateX(-Math.PI / 2); bottom.translate(0, h - 0.06, 0); colorize(bottom, inner);
    for (const q of [g, lip, bottom]) { q.rotateZ(rr(-0.25, 0.25)); q.translate(x, 0, z); geos.push(q); }
  }
  const m = mesh(mergeSafe(geos), enhance(std(0xffffff, 0.7, 0, { vertexColors: true, side: THREE.DoubleSide }), { underwater: true, caus: 0.8 }));
  m.position.set(cx, sandHeight(cx, cz) - 0.03, cz); reef.add(m); addObst(cx, m.position.y + 0.25, cz, 0.35, 'tube'); return m;
}
function softCoral(cx, cz) {
  const geos = []; const A = col(0xb69ad6), B = col(0xf3e3ff);
  for (let i = 0; i < 9; i++) {
    const h = rr(0.35, 0.62), c = curve([[0, 0, 0], [rr(-0.1, 0.1), h * 0.4, rr(-0.1, 0.1)], [rr(-0.22, 0.22), h, rr(-0.22, 0.22)]]);
    const g = new THREE.TubeGeometry(c, 10, 0.03, 6, false); const p = g.attributes.position, cc = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) { const t = clamp(p.getY(k) / h, 0, 1); const q = A.clone().lerp(B, t); cc.set([q.r, q.g, q.b], k * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); addSway(g, 0, h, rr(0, 6)); geos.push(g);
    const tip = c.getPoint(1); const bud = new THREE.SphereGeometry(0.045, 8, 6); colorize(bud, B); bud.translate(tip.x, tip.y, tip.z); addSway(bud, 0, h, 0); geos.push(bud);
  }
  const g = mergeSafe(geos); g.computeVertexNormals();
  const m = mesh(g, enhance(std(0xffffff, 0.6, 0, { vertexColors: true }), { underwater: true, caus: 0.7, sway: { amp: 0.06, speed: 0.9 } }));
  m.position.set(cx, sandHeight(cx, cz) - 0.03, cz); reef.add(m); addObst(cx, m.position.y + 0.3, cz, 0.38, 'soft'); return m;
}
function mushroomCoral(cx, cz) {
  const g = new THREE.CylinderGeometry(0.2, 0.17, 0.05, 28, 1); const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), rad = Math.hypot(p.getX(i), p.getZ(i)); if (p.getY(i) > 0) p.setY(i, 0.025 + 0.012 * Math.sin(a * 22) * (rad / 0.2) - 0.03 * (rad / 0.2) ** 2); const q = col(0xc46f7e).lerp(col(0xf4c8b6), 0.5 + 0.5 * Math.sin(a * 22)); c.set([q.r, q.g, q.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  const m = mesh(g, coralMat); m.position.set(cx, sandHeight(cx, cz) + 0.01, cz); m.rotation.set(0.08, 0, -0.06); reef.add(m); return m;
}
branchingCoral(-1.6, -1.25, 0xd9744e, 0xf2a276, 1.0);
branchingCoral(2.62, 1.22, 0xc9607a, 0xf0a2b2, 0.8);
brainCoral(-0.15, -0.58, 0.34);
tubeCoral(3.05, 0.6, 7);
softCoral(0.9, -1.15);
mushroomCoral(0.42, 0.34);
