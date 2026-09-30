/* =====================================================================
   6. TERRAIN, LAYERED SUBSTRATE, ROCKS (+ avoidance proxies)
   ===================================================================== */
const OBST = []; // fish avoidance proxies: { c: Vector3, r: number, name }
function addObst(x, y, z, r, name) { OBST.push({ c: V3(x, y, z), r, name }); }
const reef = new THREE.Group(); reef.name = 'reef'; tank.add(reef);

const sandTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d8c6a2'; g.fillRect(0, 0, w, h);
  noiseDots(g, w, h, 2600, '#a08660', 0.4, 1.3, 0.5); noiseDots(g, w, h, 1400, '#f3e7cf', 0.4, 1.1, 0.6); noiseDots(g, w, h, 160, '#6f675c', 0.6, 1.8, 0.45);
}, { repeat: [7, 3.5] });
const sandMat = enhance(std(0xffffff, 0.96, 0, { map: sandTex, vertexColors: true }), { underwater: true, caus: 1.15 });
{
  const W = IN.x1 - IN.x0 - 0.004, D = IN.z1 - IN.z0 - 0.004;
  const geo = new THREE.PlaneGeometry(W, D, 150, 76); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  const sand = col(0xc9ad7c), dark = col(0x9c8360), pale = col(0xe0cc9f), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); p.setY(i, sandHeight(x, z));
    const n = 0.5 + 0.5 * Math.sin(x * 2.1 + Math.sin(z * 3.3)) * Math.cos(z * 1.7 - x * 0.6);
    tmp.copy(sand).lerp(n > 0.5 ? pale : dark, Math.abs(n - 0.5) * 0.9);
    if (z < -1.0) tmp.lerp(dark, 0.25);
    c[i * 3] = tmp.r; c[i * 3 + 1] = tmp.g; c[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); geo.computeVertexNormals();
  const terrain = mesh(geo, sandMat, false, true); terrain.name = 'sand'; reef.add(terrain);
}
/* strata skirt visible through the glass: dark soil → pebble band → pale sand */
const pebbleGeo = track(new THREE.DodecahedronGeometry(1, 0));
const stoneMat = enhance(std(0xffffff, 0.85, 0), { underwater: true, caus: 0.8 });
{
  const soil = col(0x33251e), peb = col(0x7d705f), sand = col(0xc9ad7c);
  const rows = [[0, soil], [0.3, soil], [0.36, peb], [0.6, peb], [0.66, sand], [1, sand]];
  const sides = [
    { n: V3(0, 0, 1), pt: (t) => [lerp(IN.x0, IN.x1, t), IN.z1 - 0.003], cols: 120 },
    { n: V3(-1, 0, 0), pt: (t) => [IN.x0 + 0.003, lerp(IN.z1, IN.z0, t)], cols: 60 },
    { n: V3(1, 0, 0), pt: (t) => [IN.x1 - 0.003, lerp(IN.z0, IN.z1, t)], cols: 60 },
  ];
  const geos = [];
  for (const sd of sides) {
    const pos = [], clr = [], idx = [];
    for (let i = 0; i <= sd.cols; i++) {
      const [x, z] = sd.pt(i / sd.cols); const top = Math.max(sandHeight(x, z), IN.y0 + 0.25); const wob = Math.sin(i * 0.9) * 0.025 + Math.sin(i * 2.7) * 0.015;
      rows.forEach(([t, c], r) => { const tt = r === 0 || r === rows.length - 1 ? t : clamp(t + wob, 0.02, 0.98); pos.push(x, IN.y0 + 0.002 + tt * (top - IN.y0 - 0.002), z); clr.push(c.r, c.g, c.b); });
    }
    const R = rows.length;
    for (let i = 0; i < sd.cols; i++) for (let r = 0; r < R - 1; r++) { const a = i * R + r, b = (i + 1) * R + r; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(clr, 3)); g.setIndex(idx);
    const nn = new Float32Array(pos.length); for (let k = 0; k < nn.length; k += 3) { nn[k] = sd.n.x; nn[k + 1] = sd.n.y; nn[k + 2] = sd.n.z; } g.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
    geos.push(g);
  }
  const skirt = mesh(mergeGeometries(geos), enhance(std(0xffffff, 0.95, 0, { vertexColors: true, side: THREE.DoubleSide }), { underwater: true, caus: 0 }), false, true);
  reef.add(skirt);
  // pebbles pressed against the glass inside the pebble band + gravel scattered on the sand
  const N1 = 260, N2 = 460, peb2 = new THREE.InstancedMesh(pebbleGeo, stoneMat, N1 + N2);
  const o = new THREE.Object3D(), pal = [0xa68b68, 0x77736c, 0x47423c, 0xb59a74, 0x8a7e6c].map(col);
  let k = 0;
  for (let i = 0; i < N1; i++) {
    const side = i < 150 ? 0 : i < 205 ? 1 : 2; const t = rand(); let x, z;
    if (side === 0) { x = lerp(IN.x0 + 0.05, IN.x1 - 0.05, t); z = IN.z1 - 0.045; } else { x = side === 1 ? IN.x0 + 0.045 : IN.x1 - 0.045; z = lerp(IN.z0 + 0.05, IN.z1 - 0.05, t); }
    const top = Math.max(sandHeight(x, z), IN.y0 + 0.25); const y = IN.y0 + (top - IN.y0) * rr(0.38, 0.6);
    const r = rr(0.028, 0.055); o.position.set(x, y, z); o.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6)); o.scale.set(r, r * rr(0.6, 0.9), r); o.updateMatrix();
    peb2.setMatrixAt(k, o.matrix); peb2.setColorAt(k++, pal[ri(0, 4)]);
  }
  for (let i = 0; i < N2; i++) {
    const x = rr(IN.x0 + 0.08, IN.x1 - 0.08), z = rr(IN.z0 + 0.08, IN.z1 - 0.08); const r = rr(0.025, 0.07) * (z > 0.6 && Math.abs(x) < 1.8 ? 0.7 : 1);
    o.position.set(x, sandHeight(x, z) - r * 0.25, z); o.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6)); o.scale.set(r, r * rr(0.55, 0.85), r * rr(0.8, 1.1)); o.updateMatrix();
    peb2.setMatrixAt(k, o.matrix); peb2.setColorAt(k++, pal[ri(0, 4)]);
  }
  peb2.receiveShadow = true; reef.add(peb2);
}
/* ---- rocks: medium stones (instanced), feature rocks, cave/overhang ---- */
const rockMat = enhance(std(0xffffff, 0.9, 0, { vertexColors: true }), { underwater: true, caus: 1.0 });
function rockGeo(r, seed, detail = 2, flat = 0.75) {
  let g = new THREE.IcosahedronGeometry(r, detail); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); lumpy(g, 0.16, 2.4 / r, seed); g.scale(1, flat, 1 + rr(-0.15, 0.2));
  const p = g.attributes.position, c = new Float32Array(p.count * 3); const a = col(pick([0x6f6a62, 0x5c5850, 0x77736c, 0x807766])), b = col(0x3d3935), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const n = 0.5 + 0.5 * Math.sin(p.getX(i) * 7 + seed) * Math.sin(p.getZ(i) * 6 - seed); t.copy(a).lerp(b, n * 0.45 + (p.getY(i) < 0 ? 0.2 : 0)); c.set([t.r, t.g, t.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return track(g);
}
function pick(a) { return a[Math.floor(rand() * a.length)]; }
function placeRock(r, x, z, seed, flat = 0.75, sinkK = 0.3, rotY = rr(0, 6)) {
  const m = mesh(rockGeo(r, seed, 2, flat), rockMat); m.rotation.y = rotY; m.position.set(x, 0, z); restOn(m, sandHeight(x, z), r * flat * sinkK); reef.add(m);
  const b = boundsOf(m); addObst(x, (b.min.y + b.max.y) / 2, z, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.5 + 0.12, 'rock'); return m;
}
// feature rocks (the cave: two supports + a bridging slab at the back-right)
placeRock(0.62, 2.35, -1.2, 3.1, 0.9); placeRock(0.55, 3.08, -0.85, 5.3, 0.95);
const caveSlab = mesh(rockGeo(0.75, 8.8, 2, 0.35), rockMat); caveSlab.position.set(2.72, sandHeight(2.72, -1.05) + 0.72, -1.05); caveSlab.rotation.set(0.1, 0.5, -0.12); reef.add(caveSlab);
addObst(2.72, caveSlab.position.y, -1.05, 0.72, 'cave-roof');
placeRock(0.5, -1.95, 0.75, 11.7, 0.7); placeRock(0.42, 0.95, 1.05, 2.2, 0.62); placeRock(0.36, -3.12, 0.45, 7.4, 0.8);
const airStoneRock = placeRock(0.4, 0.25, -1.28, 9.9, 0.85);
{ // medium stones: two instanced shapes
  for (let v = 0; v < 2; v++) {
    const n = 14, g = rockGeo(1, 20 + v * 7, 1, 0.7), im = new THREE.InstancedMesh(g, rockMat, n), o = new THREE.Object3D();
    let placed = 0, guard = 0;
    while (placed < n && guard++ < 400) {
      const x = rr(IN.x0 + 0.25, IN.x1 - 0.25), z = rr(IN.z0 + 0.2, IN.z1 - 0.25);
      if (z > 0.45 && Math.abs(x) < 1.7) continue;                              // keep the front sand path open
      if (OBST.some(ob => Math.hypot(ob.c.x - x, ob.c.z - z) < ob.r * 0.7)) continue;
      const r = rr(0.1, 0.24); o.position.set(x, sandHeight(x, z) + r * 0.25, z); o.rotation.set(rr(-0.3, 0.3), rr(0, 6), rr(-0.3, 0.3)); o.scale.set(r, r * rr(0.7, 1.0), r * rr(0.8, 1.2)); o.updateMatrix();
      im.setMatrixAt(placed++, o.matrix);
    }
    im.count = placed; im.castShadow = true; im.receiveShadow = true; reef.add(im);
  }
}
