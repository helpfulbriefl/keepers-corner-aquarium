/* =====================================================================
   11. ROOM: floor, one-sided back wall (practical cutaway), window + blinds + sky,
       wall clock, crooked fish diagram, walnut countertop, painted cabinet + hinged door, books
   ===================================================================== */
const room = new THREE.Group(); room.name = 'room'; scene.add(room);
const blockers = [];                                      // opaque room meshes that stop click-through
const block = (m) => { blockers.push(m); return m; };
const walnutTex = canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = '#5b3a24'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const y = rr(0, h), a = rr(0.05, 0.22); g.strokeStyle = `rgba(${ri(25, 45)},${ri(14, 26)},${ri(8, 14)},${a})`; g.lineWidth = rr(0.6, 3); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.006 + i) * 6 + Math.sin(x * 0.021 + i * 3) * 2); g.stroke(); }
  for (let i = 0; i < 8; i++) { const x = rr(0, w), y = rr(0, h); const r = g.createRadialGradient(x, y, 2, x, y, rr(14, 30)); r.addColorStop(0, 'rgba(30,16,8,0.5)'); r.addColorStop(1, 'rgba(30,16,8,0)'); g.fillStyle = r; g.fillRect(x - 40, y - 40, 80, 80); }
  g.strokeStyle = 'rgba(210,180,150,0.16)'; g.lineWidth = 1; for (let i = 0; i < 26; i++) { const x = rr(0, w), y = rr(0, h), a = rr(-0.3, 0.3), l = rr(20, 90); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
});
const walnut = std(0xffffff, 0.55, 0, { map: walnutTex });
const paintTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4f7f7a'; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 900, '#6d9c95', 0.5, 1.6, 0.25); noiseDots(g, w, h, 500, '#355a56', 0.5, 1.4, 0.25); for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(210,200,170,0.35)'; g.fillRect(rr(0, w), rr(0, h), rr(2, 8), rr(1, 3)); } });
const paint = std(0xffffff, 0.72, 0, { map: paintTex });
const trimMat = std(0x3f6663, 0.6), brassMat = std(0xc49a4c, 0.3, 0.85, { envMap: envTex, envMapIntensity: 0.8 }), darkInside = std(0x1b1f1f, 0.95);
const WIN = { x: -5.25, y: 1.85, w: 2.5, h: 1.9 };
/* floor planks */
{
  const tex = canvasTex(1024, 1024, (g, w, h) => {
    const rows = 8; for (let r = 0; r < rows; r++) { let x = -rr(0, 300); const y = r * h / rows;
      while (x < w) { const L = rr(260, 520); g.fillStyle = `hsl(${rr(24, 32)}, ${rr(30, 42)}%, ${rr(22, 30)}%)`; g.fillRect(x, y, L, h / rows);
        for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(20,10,5,${rr(0.08, 0.2)})`; g.lineWidth = rr(0.5, 2); const yy = y + rr(4, h / rows - 4); g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + L * 0.3, yy + rr(-4, 4), x + L * 0.7, yy + rr(-4, 4), x + L, yy); g.stroke(); }
        g.fillStyle = 'rgba(10,5,2,0.6)'; g.fillRect(x, y, 3, h / rows); x += L; }
      g.fillStyle = 'rgba(10,5,2,0.7)'; g.fillRect(0, y, w, 3); }
  }, { repeat: [3, 2] });
  const floor = mesh(new THREE.PlaneGeometry(30, 14), std(0xffffff, 0.8, 0, { map: tex }), false, true);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR_Y, WALL_Z + 7); room.add(block(floor));
}
/* back wall: FrontSide only, so orbiting behind the scene sees straight through it */
{
  const tex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#7f766b'; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 3000, '#8d8478', 0.6, 2.2, 0.3); noiseDots(g, w, h, 1500, '#6c645a', 0.5, 1.8, 0.25); }, { repeat: [4, 2] });
  const sh = new THREE.Shape(); sh.moveTo(-15, 0); sh.lineTo(15, 0); sh.lineTo(15, 14); sh.lineTo(-15, 14); sh.lineTo(-15, 0);
  const hole = new THREE.Path(), hx = WIN.x, hy = WIN.y - FLOOR_Y; hole.moveTo(hx - WIN.w / 2 - 0.1, hy - WIN.h / 2 - 0.1); hole.lineTo(hx - WIN.w / 2 - 0.1, hy + WIN.h / 2 + 0.1); hole.lineTo(hx + WIN.w / 2 + 0.1, hy + WIN.h / 2 + 0.1); hole.lineTo(hx + WIN.w / 2 + 0.1, hy - WIN.h / 2 - 0.1); sh.holes.push(hole);
  const wg = new THREE.ShapeGeometry(sh); { const p = wg.attributes.position, uv = wg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 15) / 30, p.getY(i) / 14); }
  const wall = mesh(wg, std(0xffffff, 0.92, 0, { map: tex }), false, true); wall.position.set(0, FLOOR_Y, WALL_Z); room.add(block(wall));
  const skirt = mesh(new THREE.BoxGeometry(30, 0.32, 0.06), std(0xd9d0bf, 0.6)); skirt.position.set(0, FLOOR_Y + 0.16, WALL_Z + 0.03); room.add(skirt);
  const socket = new THREE.Group(); const plate = mesh(new THREE.BoxGeometry(0.34, 0.26, 0.03), std(0xe8e2d4, 0.5)); socket.add(plate);
  for (const sx of [-1, 1]) { const hole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), std(0x222222, 0.8)); hole.rotation.x = Math.PI / 2; hole.position.set(sx * 0.05, 0, 0.016); socket.add(hole); }
  socket.position.set(-7.25, FLOOR_Y + 0.62, WALL_Z + 0.02); room.add(socket); room.userData.socket = socket;
}
/* window with depth, sill, procedural sky (day gradient → night + moon), uneven blinds and cords */
const skyMat = track(new THREE.ShaderMaterial({ uniforms: { uNight: U.night, uTime: U.time },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`uniform float uNight; uniform float uTime; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    void main(){
      vec3 day = mix(vec3(0.93, 0.87, 0.78), vec3(0.55, 0.72, 0.86), smoothstep(0.1, 0.95, vUv.y));
      vec3 nig = mix(vec3(0.1, 0.14, 0.26), vec3(0.02, 0.04, 0.1), smoothstep(0.1, 0.95, vUv.y));
      vec3 c = mix(day, nig, uNight);
      float cl = n(vUv * vec2(4.0, 2.0) + vec2(uTime * 0.004, 0.0)) * n(vUv * vec2(9.0, 4.0) - vec2(uTime * 0.006, 0.0));
      c = mix(c, mix(vec3(1.0), vec3(0.2, 0.25, 0.36), uNight), smoothstep(0.25, 0.6, cl) * 0.5 * smoothstep(0.35, 0.8, vUv.y));
      vec2 m = vUv - vec2(0.7, 0.72); float md = length(m * vec2(1.3, 1.0));
      c += vec3(0.95, 0.93, 0.85) * (1.0 - smoothstep(0.05, 0.058, md)) * uNight * (0.8 - 0.25 * n(vUv * 40.0));
      c += vec3(0.5, 0.55, 0.7) * exp(-md * 9.0) * 0.35 * uNight;
      float roof = step(vUv.y, 0.16 + 0.05 * step(0.5, fract(vUv.x * 5.0)) + 0.03 * step(0.7, fract(vUv.x * 11.0)));
      c = mix(c, mix(vec3(0.35, 0.36, 0.38), vec3(0.03, 0.04, 0.07), uNight), roof * 0.9);
      float win = roof * step(0.6, h(floor(vUv * vec2(40.0, 30.0)))) * step(vUv.y, 0.13);
      c += vec3(1.0, 0.8, 0.45) * win * uNight * 0.6;
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` }));
const blinds = new THREE.Group();
{
  const g = new THREE.Group(); g.position.set(WIN.x, WIN.y, WALL_Z); room.add(g);
  const sky = new THREE.Mesh(track(new THREE.PlaneGeometry(WIN.w, WIN.h)), skyMat); sky.position.z = -0.2; g.add(sky);
  const frameM = std(0xe6dfd0, 0.55), t = 0.1, d = 0.24;
  const add = (w, h, dd, x, y, z, m = frameM) => { const b = mesh(new THREE.BoxGeometry(w, h, dd), m); b.position.set(x, y, z); g.add(b); return b; };
  add(WIN.w + 2 * t, t, d, 0, WIN.h / 2 + t / 2, -0.05); add(WIN.w + 2 * t, t, d, 0, -WIN.h / 2 - t / 2, -0.05);
  add(t, WIN.h, d, -WIN.w / 2 - t / 2, 0, -0.05); add(t, WIN.h, d, WIN.w / 2 + t / 2, 0, -0.05);
  add(0.05, WIN.h, 0.06, 0, 0, -0.12); add(WIN.w, 0.05, 0.06, 0, -0.1, -0.12);
  add(WIN.w + 0.5, 0.07, 0.36, 0, -WIN.h / 2 - t - 0.02, 0.12, std(0xefe9dc, 0.5));        // sill
  const rail = add(WIN.w + 0.1, 0.07, 0.1, 0, WIN.h / 2 - 0.02, 0.06, std(0xf2eee6, 0.5));
  blinds.position.set(0, 0, 0.06); g.add(blinds);
  const slatM = std(0xf4f0e6, 0.5, 0, { side: THREE.DoubleSide }); const slatG = track(new THREE.BoxGeometry(WIN.w - 0.04, 0.012, 0.11));
  for (let i = 0; i < 13; i++) { const s = new THREE.Mesh(slatG, slatM); s.castShadow = true; s.position.set(0, WIN.h / 2 - 0.09 - i * 0.085 - (i > 9 ? 0.02 * (i - 9) : 0), 0); s.rotation.x = 0.5 + rr(-0.12, 0.12) + (i === 7 ? 0.35 : 0); s.rotation.z = i === 11 ? 0.03 : rr(-0.008, 0.008); blinds.add(s); }
  const bottom = mesh(new THREE.BoxGeometry(WIN.w - 0.02, 0.025, 0.12), slatM); bottom.position.set(0.02, WIN.h / 2 - 0.1 - 13 * 0.085 - 0.1, 0); bottom.rotation.z = 0.035; blinds.add(bottom);
  const cordM = std(0xdcd4c4, 0.8);
  for (const x of [-0.8, 0.8]) { const c = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.3, 4), cordM, false, false); c.position.set(x, WIN.h / 2 - 0.66, 0.065); blinds.add(c); }
  const pull = mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.5, 4), cordM, false, false); pull.position.set(WIN.w / 2 - 0.12, WIN.h / 2 - 0.8, 0.1); blinds.add(pull);
  const tassel = mesh(new THREE.ConeGeometry(0.025, 0.08, 8), cordM); tassel.position.set(WIN.w / 2 - 0.12, WIN.h / 2 - 1.58, 0.1); blinds.add(tassel);
  room.userData.window = g;
}
/* analog wall clock: hands driven by the simulation clock (freeze on pause) */
const wallClock = new THREE.Group();
{
  const face = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f3ecdc'; g.beginPath(); g.arc(128, 128, 126, 0, 6.283); g.fill(); g.strokeStyle = '#2a2a2a'; g.fillStyle = '#2a2a2a';
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, r0 = i % 5 ? 112 : 100; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0); g.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118); g.stroke(); }
    g.font = '600 20px Georgia, serif'; g.textAlign = 'center'; g.fillText('KEEPER & CO.', 128, 175); });
  const disc = mesh(new THREE.CircleGeometry(0.5, 48), std(0xffffff, 0.6, 0, { map: face }), false, true); disc.position.z = 0.04; wallClock.add(disc);
  const rim = mesh(new THREE.TorusGeometry(0.52, 0.045, 10, 48), std(0x3a2a1e, 0.45, 0.2)); rim.position.z = 0.05; wallClock.add(rim);
  const back = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 40), std(0x2f2219, 0.6)); back.rotation.x = Math.PI / 2; back.position.z = 0.01; wallClock.add(back);
  const hand = (len, wid, z, color) => { const p = new THREE.Group(); p.position.z = z; const m = mesh(new THREE.BoxGeometry(wid, len, 0.012), std(color, 0.4, 0.2), false, false); m.position.y = len / 2 - 0.05; p.add(m); wallClock.add(p); return p; };
  wallClock.userData.h = hand(0.28, 0.035, 0.07, 0x1b1b1b); wallClock.userData.m = hand(0.4, 0.025, 0.08, 0x1b1b1b); wallClock.userData.s = hand(0.44, 0.01, 0.09, 0xb3261e);
  const cap = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12), brassMat); cap.rotation.x = Math.PI / 2; cap.position.z = 0.1; wallClock.add(cap);
  wallClock.position.set(5.05, 1.75, WALL_Z + 0.02); room.add(wallClock);
  const now = new Date(); wallClock.userData.base = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}
function updateClock() {
  const s = wallClock.userData.base + S.sim, sec = Math.floor(s), tick = sec + smooth01(0, 0.12, s - sec);
  wallClock.userData.s.rotation.z = -tick / 60 * Math.PI * 2; wallClock.userData.m.rotation.z = -(s / 3600) * Math.PI * 2; wallClock.userData.h.rotation.z = -(s / 43200) * Math.PI * 2;
}
/* crooked framed naturalist plate */
{
  const tex = canvasTex(768, 540, (g, w, h) => {
    g.fillStyle = '#eee4cc'; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 900, '#c9b995', 0.5, 1.5, 0.25);
    g.strokeStyle = '#7b6a4c'; g.lineWidth = 3; g.strokeRect(22, 22, w - 44, h - 44);
    g.fillStyle = '#3b3326'; g.font = '700 38px Georgia, serif'; g.fillText('FIELD NOTES', 48, 78);
    g.font = 'italic 30px Georgia, serif'; g.fillText('Amphiprion ocellaris', 48, 118);
    g.font = '22px Georgia, serif'; g.fillText('Plate 03 / The reef', 48, h - 48);
    g.save(); g.translate(400, 300); g.scale(1.25, 1.25);
    const body = new Path2D(); body.ellipse(0, 0, 150, 72, 0, 0, 6.283);
    g.fillStyle = '#e86f2a'; g.fill(body); g.save(); g.clip(body);
    for (const [x, wd, bul] of [[-78, 24, 8], [8, 26, -20], [104, 16, 0]]) { g.fillStyle = '#1d1a17'; g.beginPath(); g.moveTo(x - wd / 2 - 6, -90); g.quadraticCurveTo(x + bul - wd / 2 - 6, 0, x - wd / 2 - 6, 90); g.lineTo(x + wd / 2 + 6, 90); g.quadraticCurveTo(x + bul + wd / 2 + 6, 0, x + wd / 2 + 6, -90); g.fill();
      g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(x - wd / 2, -90); g.quadraticCurveTo(x + bul - wd / 2, 0, x - wd / 2, 90); g.lineTo(x + wd / 2, 90); g.quadraticCurveTo(x + bul + wd / 2, 0, x + wd / 2, -90); g.fill(); }
    g.restore(); g.strokeStyle = '#2a211a'; g.lineWidth = 3; g.stroke(body);
    g.fillStyle = '#e86f2a'; g.beginPath(); g.moveTo(140, 0); g.quadraticCurveTo(200, -80, 225, -60); g.quadraticCurveTo(205, 0, 225, 60); g.quadraticCurveTo(200, 80, 140, 0); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-40, -66); g.quadraticCurveTo(40, -120, 120, -40); g.stroke();
    g.fillStyle = '#1d1a17'; g.beginPath(); g.arc(-112, -14, 9, 0, 6.283); g.fill();
    g.restore();
    g.fillStyle = '#5a4c36'; g.font = 'italic 18px Georgia, serif'; g.fillText('three white bars, black-edged', 470, 96); g.fillText('middle bar bulges forward', 470, 122);
  });
  const fr = new THREE.Group();
  const paper = mesh(new THREE.PlaneGeometry(1.5, 1.05), std(0xffffff, 0.85, 0, { map: tex }), false, true); paper.position.z = 0.03; fr.add(paper);
  const fm = std(0x2e241c, 0.5, 0.1);
  for (const [w, h, x, y] of [[1.7, 0.1, 0, 0.575], [1.7, 0.1, 0, -0.575], [0.1, 1.25, -0.8, 0], [0.1, 1.25, 0.8, 0]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.07), fm); b.position.set(x, y, 0.035); fr.add(b); }
  fr.position.set(1.45, 3.2, WALL_Z + 0.01); fr.rotation.z = -0.045; fr.scale.setScalar(0.85); fr.name = 'framed-plate'; room.add(fr);
}
/* countertop: thick walnut slab with chipped front edge */
const counterTop = mesh(new THREE.BoxGeometry(13.2, 0.25, 5.8), walnut); counterTop.position.set(0, COUNTER_Y - 0.125, 0.05); room.add(block(counterTop));
{
  const chipM = std(0x3a2416, 0.8);
  for (const x of [-4.6, -1.1, 2.4, 5.2]) { const c = mesh(new THREE.BoxGeometry(rr(0.06, 0.14), 0.05, 0.05), chipM, false, false); c.position.set(x, COUNTER_Y - 0.02, 2.93); c.rotation.set(rr(0, 1), rr(0, 1), rr(0, 1)); room.add(c); }
}
/* cabinet: hollow carcass, open book shelf, hinged door compartment with contents, drawers, static door */
const CAB = { x0: -6.3, x1: 6.3, z0: -2.8, z1: 2.72, y0: FLOOR_Y + 0.14, y1: COUNTER_Y - 0.25 };
const cabinet = new THREE.Group(); cabinet.name = 'cabinet'; room.add(cabinet);
const cabDoor = new THREE.Group(); const DOOR = { open: 0, target: 0, x0: -3.3, x1: -0.4 };
{
  const H = CAB.y1 - CAB.y0, cy = (CAB.y0 + CAB.y1) / 2, D = CAB.z1 - CAB.z0, cz = (CAB.z0 + CAB.z1) / 2, T = 0.08;
  const add = (w, h, d, x, y, z, m = paint, parent = cabinet) => { const b = mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  block(add(T, H, D, CAB.x0 + T / 2, cy, cz)); block(add(T, H, D, CAB.x1 - T / 2, cy, cz));
  add(CAB.x1 - CAB.x0, T, D, 0, CAB.y0 + T / 2, cz); add(CAB.x1 - CAB.x0, T, D, 0, CAB.y1 - T / 2, cz); add(CAB.x1 - CAB.x0, H, T, 0, cy, CAB.z0 + T / 2, darkInside);
  for (const x of [-3.42, -0.3, 2.92]) add(0.1, H, D - 0.02, x, cy, cz);                           // dividers
  const rail = (y) => add(CAB.x1 - CAB.x0 + 0.04, 0.09, 0.06, 0, y, CAB.z1 + 0.02, trimMat);
  rail(CAB.y1 - 0.04); rail(CAB.y0 + 0.04);
  const kick = add(CAB.x1 - CAB.x0 - 0.2, 0.14, 0.08, 0, FLOOR_Y + 0.07, CAB.z1 - 0.12, std(0x263a38, 0.8));
  for (const [x, z] of [[CAB.x0 + 0.2, CAB.z1 - 0.2], [CAB.x1 - 0.2, CAB.z1 - 0.2], [CAB.x0 + 0.2, CAB.z0 + 0.2], [CAB.x1 - 0.2, CAB.z0 + 0.2]]) { const f = mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.16, 12), std(0x2a2a26, 0.6, 0.3)); f.position.set(x, FLOOR_Y + 0.08, z); cabinet.add(f); }
  // open shelf (left): inner dark back + middle shelf; books placed below
  const shelfY = cy - 0.1; add(2.75, 0.06, D - 0.1, -4.845, shelfY, cz + 0.02, paint);
  cabinet.userData.shelfY = shelfY;
  // drawers (centre right)
  for (let i = 0; i < 2; i++) { const y = CAB.y1 - 0.62 - i * 1.12; const dr = add(3.05, 1.02, 0.07, 1.31, y, CAB.z1 + 0.03); block(dr); const hd = mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), brassMat); hd.position.set(1.31, y + 0.25, CAB.z1 + 0.1); cabinet.add(hd); }
  // static right door
  const rd = add(3.2, H - 0.2, 0.07, 4.6, cy, CAB.z1 + 0.03); block(rd); const rk = mesh(new THREE.SphereGeometry(0.06, 12, 8), brassMat); rk.position.set(3.25, cy + 0.2, CAB.z1 + 0.1); cabinet.add(rk);
  const seam = std(0x243836, 0.8); for (const x of [-3.42, -0.3, 2.92]) add(0.03, H - 0.1, 0.02, x, cy, CAB.z1 + 0.075, seam);
  // compartment interior behind the hinged door
  const inner = add(2.8, 0.05, D - 0.2, (DOOR.x0 + DOOR.x1) / 2 - 0.05, cy - 0.15, cz, darkInside);
  const towelCols = [0xd9cdb5, 0x7fa8b8, 0xc9826a];
  towelCols.forEach((c, i) => { const tw = mesh(new THREE.BoxGeometry(0.9, 0.16, 0.7, 4, 2, 4), std(c, 0.95)); lumpy(tw.geometry, 0.03, 4, i); tw.position.set(-2.55, cy - 0.04 + i * 0.165, 1.6 - i * 0.02); tw.rotation.y = rr(-0.08, 0.08); cabinet.add(tw); });
  const bucket = new THREE.Group(); const bprof = [[0.001, 0], [0.26, 0], [0.3, 0.42], [0.31, 0.44], [0.285, 0.44], [0.25, 0.03], [0.001, 0.03]].map(([r, y]) => new THREE.Vector2(r, y));
  bucket.add(mesh(new THREE.LatheGeometry(bprof, 24), std(0x3f79a8, 0.55, 0, { side: THREE.DoubleSide })));
  const handle = mesh(new THREE.TorusGeometry(0.29, 0.008, 5, 24, Math.PI), std(0x8a8f94, 0.4, 0.8)); handle.position.y = 0.44; handle.rotation.x = -0.5; bucket.add(handle);
  bucket.position.set(-1.5, CAB.y0 + 0.08, 1.4); cabinet.add(bucket);
  const jarLabel = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#f2ead6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c4a52'; g.font = '700 30px system-ui, sans-serif'; g.fillText('REFILL', 20, 44); g.font = '20px system-ui, sans-serif'; g.fillText('carbon media', 20, 76); });
  for (let i = 0; i < 2; i++) { const j = new THREE.Group(); const b = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 20), [std(0xffffff, 0.5, 0, { map: jarLabel }), std(0xe8e0cc, 0.5), std(0xe8e0cc, 0.5)]); b.position.y = 0.21; j.add(b);
    const lid = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20), std(0x2f5d62, 0.5)); lid.position.y = 0.46; j.add(lid); j.position.set(-1.35 + i * 0.4, cy - 0.125, 1.3 - i * 0.25); j.rotation.y = -0.4 + i * 0.3; cabinet.add(j); }
  const sponge = mesh(new THREE.BoxGeometry(0.55, 0.28, 0.4, 3, 2, 3), std(0x2b3d4f, 1)); lumpy(sponge.geometry, 0.02, 6, 3); sponge.position.set(-2.4, CAB.y0 + 0.22, 1.2); cabinet.add(sponge);
  const net2 = mesh(new THREE.BoxGeometry(0.5, 0.06, 0.34), std(0xe9e9e9, 0.9)); net2.position.set(-2.6, CAB.y0 + 0.41, 1.25); net2.rotation.y = 0.2; cabinet.add(net2);
  // hinged door: separate group, pivot on the real hinge line; handle + sticky note ride on the door
  cabDoor.position.set(DOOR.x0 - 0.03, cy, CAB.z1 + 0.035); cabinet.add(cabDoor);
  const dw = DOOR.x1 - DOOR.x0 + 0.08, door = mesh(new THREE.BoxGeometry(dw, H - 0.2, 0.07), paint); door.position.x = dw / 2; cabDoor.add(door);
  const inset = mesh(new THREE.BoxGeometry(dw - 0.4, H - 0.62, 0.02), std(0x5a8c86, 0.7)); inset.position.set(dw / 2, 0, 0.045); cabDoor.add(inset);
  for (const y of [0.75, -0.75]) { const hinge = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), brassMat); hinge.position.set(-0.01, y, 0.0); cabDoor.add(hinge); }
  const knob = mesh(new THREE.BoxGeometry(0.08, 0.5, 0.06), brassMat); knob.position.set(dw - 0.22, 0.05, 0.08); cabDoor.add(knob);
  const noteTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f6e27a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 0, w, 26);
    handText(g, 'Milo is', 22, 96, 40, '#2a3550', -0.03); handText(g, 'NOT', 22, 146, 46, '#b0302a', -0.03, undefined, 'bold italic '); handText(g, 'in charge of', 22, 192, 34, '#2a3550', -0.03); handText(g, 'feeding.', 22, 234, 36, '#2a3550', -0.03); });
  const note = mesh(new THREE.PlaneGeometry(0.62, 0.62, 4, 4), std(0xffffff, 0.9, 0, { map: noteTex, side: THREE.DoubleSide }), false, true);
  { const p = note.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.2) p.setZ(i, 0.02 * (-(p.getY(i)) - 0.2) * 3); note.geometry.computeVertexNormals(); }
  note.position.set(dw / 2 - 0.25, 0.3, 0.062); note.rotation.z = 0.07; cabDoor.add(note);
  pickable(cabDoor, 'door', 'Cabinet door');
  // books on the open shelf (spines face the viewer), a leaning pair and a small stack
  const titles = ['REEF ATLAS', 'SMALL WORLDS', 'THE SLOW LIFE', '', 'TIDES', '', 'SALT & GLASS'];
  const covers = [0x7a2e2a, 0x2d4b6b, 0x5a6b3a, 0x8a6a3a, 0x3d3552, 0x9a8a6a, 0x2f5750];
  let x = CAB.x0 + 0.2;
  const spine = (t, c) => canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#' + col(c).getHexString(); g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,230,180,0.75)'; g.fillRect(0, 30, w, 5); g.fillRect(0, h - 40, w, 5); if (t) { g.save(); g.translate(40, h / 2); g.rotate(Math.PI / 2); g.font = '700 30px Georgia, serif'; g.textAlign = 'center'; g.fillText(t, 0, 0); g.restore(); } });
  const pages = std(0xefe6d0, 0.9);
  const book = (t, c, w, h, d) => { const cm = std(c, 0.7), sm = std(0xffffff, 0.7, 0, { map: spine(t, c) }); const b = new THREE.Group();
    const cover = mesh(new THREE.BoxGeometry(w, h, d), [cm, cm, cm, cm, sm, cm]); b.add(cover); const pb = mesh(new THREE.BoxGeometry(w - 0.03, h - 0.05, d - 0.02), pages); pb.position.z = -0.02; b.add(pb); return b; };
  for (let i = 0; i < 7; i++) {
    const w = rr(0.13, 0.24), h = rr(0.7, 0.9), d = 0.62; const b = book(titles[i], covers[i], w, h, d);
    const lean = i === 6 ? -0.28 : rr(-0.02, 0.02); b.rotation.z = lean; b.position.set(x + w / 2 + (i === 6 ? 0.18 : 0), CAB.y0 + 0.08 + h / 2 * Math.cos(lean) + (i === 6 ? 0.02 : 0), CAB.z1 - 0.45 + rr(-0.04, 0.04)); cabinet.add(b); x += w + 0.015;
  }
  const spineH = (t, c) => canvasTex(512, 72, (g, w, h) => { g.fillStyle = '#' + col(c).getHexString(); g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,230,180,0.75)'; g.fillRect(24, 0, 5, h); g.fillRect(w - 30, 0, 5, h); if (t) { g.font = '700 34px Georgia, serif'; g.textAlign = 'center'; g.fillText(t, w / 2, 48); } });
  for (let i = 0; i < 3; i++) { const c = [0x6b3a2a, 0x2a4a3a, 0x7a6a4a][i], w = 1.0 - i * 0.08, cm = std(c, 0.7); const b = new THREE.Group();
    b.add(mesh(new THREE.BoxGeometry(w, 0.14, 0.7 - i * 0.05), [cm, cm, cm, cm, std(0xffffff, 0.7, 0, { map: spineH(i === 1 ? 'LOGBOOK' : 'NOTES ' + (i + 1), c) }), cm]));
    b.rotation.y = rr(-0.1, 0.1); b.position.set(-4.75 + rr(-0.05, 0.05), shelfY + 0.1 + i * 0.145, 1.9); cabinet.add(b); }
}
/* escaped gravel on the floor */
{ const m = std(0x9a8a70, 0.9); for (let i = 0; i < 9; i++) { const r = rr(0.03, 0.055); const p = mesh(new THREE.DodecahedronGeometry(r, 0), m); p.position.set(rr(-1.6, 1.8), FLOOR_Y + r * 0.6, rr(3.0, 3.7)); p.rotation.set(rr(0, 3), rr(0, 3), 0); room.add(p); } }
function updateRoom(dt) {
  DOOR.open = damp(DOOR.open, DOOR.target, 4.5, dt); cabDoor.rotation.y = -DOOR.open * 1.15;
}
