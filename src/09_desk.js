/* =====================================================================
   12. KEEPER'S CORNER PROPS on and around the counter
   ===================================================================== */
const CT = COUNTER_Y;                                       // countertop surface
const decalMat = (tex, opacity = 1) => std(0xffffff, 0.9, 0, { map: tex, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
function decal(tex, w, h, x, z, rot = 0, opacity = 1, y = CT + 0.002) { const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), decalMat(tex, opacity)); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, y, z); m.receiveShadow = true; m.renderOrder = 1; room.add(m); return m; }
const blotTex = canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const x = 64 + rr(-26, 26), y = 64 + rr(-26, 26), r = rr(8, 26); const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(30,18,10,0.35)'); rg.addColorStop(1, 'rgba(30,18,10,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); } });

/* ---- 1. adjustable desk lamp (click toggles Day/Night) + warm spot + tangled cord to the wall socket ---- */
const deskLamp = new THREE.Group(); deskLamp.name = 'desk-lamp'; room.add(deskLamp);
const LAMP = { base: V3(-5.35, CT, 0.75), elbow: V3(-5.15, CT + 1.25, 0.85), head: V3(-4.62, CT + 1.62, 1.28), aim: V3(-4.15, CT, 2.05) };
{
  const shadeGreen = std(0x2f6b5a, 0.45, 0.25), brass = brassMat;
  const base = mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.1, 32), std(0x23443b, 0.4, 0.4)); base.position.copy(LAMP.base).y += 0.05; deskLamp.add(base);
  const cap = mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.08, 20), brass); cap.position.copy(LAMP.base).y += 0.14; deskLamp.add(cap);
  const rod = (a, b, r) => { const d = _v1.subVectors(b, a); const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), brass); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.clone().normalize()); deskLamp.add(m); return m; };
  const p0 = LAMP.base.clone().setY(CT + 0.17);
  rod(p0, LAMP.elbow, 0.028); rod(p0.clone().add(V3(0.06, 0, 0.04)), LAMP.elbow.clone().add(V3(0.06, 0, 0.04)), 0.012);    // twin arm + spring rod
  rod(LAMP.elbow, LAMP.head, 0.026); rod(LAMP.elbow.clone().add(V3(0.05, -0.02, 0.04)), LAMP.head.clone().add(V3(0.05, -0.02, 0.04)), 0.011);
  for (const p of [p0, LAMP.elbow, LAMP.head]) { const j = mesh(new THREE.SphereGeometry(0.055, 14, 10), brass); j.position.copy(p); deskLamp.add(j); const k = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), std(0x1c1c1c, 0.5, 0.4)); k.rotation.z = Math.PI / 2; k.position.copy(p); deskLamp.add(k); }
  const shade = new THREE.Group(); shade.position.copy(LAMP.head); deskLamp.add(shade);
  const dir = _v1.subVectors(LAMP.aim, LAMP.head).normalize(); shade.quaternion.setFromUnitVectors(V3(0, -1, 0), dir);
  const outer = mesh(new THREE.CylinderGeometry(0.1, 0.36, 0.42, 32, 1, true), shadeGreen); outer.position.y = -0.22; shade.add(outer);
  const inner = mesh(new THREE.CylinderGeometry(0.098, 0.355, 0.415, 32, 1, true), std(0xf1e6cf, 0.6, 0, { side: THREE.BackSide, emissive: 0x6b4a20, emissiveIntensity: 0.4 }), false, false); inner.position.y = -0.22; shade.add(inner);
  const top = mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.08, 16), shadeGreen); top.position.y = 0.02; shade.add(top);
  const rim = mesh(new THREE.TorusGeometry(0.36, 0.014, 6, 40), brass); rim.rotation.x = Math.PI / 2; rim.position.y = -0.43; shade.add(rim);
  const bulbMat = std(0xfff4dd, 0.3, 0, { emissive: 0xffd9a0, emissiveIntensity: 2.2 });
  const bulb = mesh(new THREE.SphereGeometry(0.085, 16, 12), bulbMat, false, false); bulb.position.y = -0.25; shade.add(bulb);
  const spot = new THREE.SpotLight(0xffc98a, 22, 0, 0.78, 0.75, 2); spot.position.copy(LAMP.head).addScaledVector(dir, 0.25); spot.target.position.copy(LAMP.aim);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0008; spot.shadow.camera.near = 0.2; spot.shadow.camera.far = 8;
  room.add(spot, spot.target);
  const glow = new THREE.PointLight(0xffc98a, 0.9, 2.2, 2); glow.position.copy(spot.position); room.add(glow);
  deskLamp.userData = { spot, glow, bulbMat, inner: inner.material };
  pickable(deskLamp, 'lamp', 'Desk lamp — day / night');
  const cord = curve([[-5.2, CT + 0.03, 0.55], [-5.7, CT + 0.03, 0.62], [-5.95, CT + 0.03, 0.3], [-5.72, CT + 0.03, 0.12], [-6.05, CT + 0.03, -0.08], [-6.62, CT - 0.02, -0.2], [-6.72, CT - 0.6, -0.35], [-6.78, -4.3, -0.62], [-6.9, FLOOR_Y + 0.03, -1.15], [-7.05, FLOOR_Y + 0.03, -1.9], [-7.2, FLOOR_Y + 0.25, -2.7], [-7.25, FLOOR_Y + 0.6, -2.84]]);
  room.add(mesh(taperTube(cord, 160, 6, 0.018, 0.018), std(0x1b1b1b, 0.6)));
  const plug = mesh(new THREE.BoxGeometry(0.12, 0.1, 0.07), std(0x222222, 0.5)); plug.position.set(-7.25, FLOOR_Y + 0.62, WALL_Z + 0.06); room.add(plug);
}
/* ---- 2. chipped mug with tea, bounded steam, cup ring ---- */
const mug = new THREE.Group(); mug.name = 'mug'; room.add(mug);
const STEAM = { n: 14, pts: null, age: new Float32Array(14), seed: new Float32Array(14) };
{
  const H = 0.46, R = 0.2;
  const prof = [[0.001, 0], [R - 0.02, 0], [R, 0.02], [R + 0.005, H * 0.5], [R, H - 0.005], [R - 0.012, H], [R - 0.028, H - 0.01], [R - 0.03, 0.05], [0.001, 0.045]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 40); const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); let cc = col(0x3f6f8f); if (p.getY(i) > H - 0.03 && Math.abs(a - 0.7) < 0.12) { p.setY(i, p.getY(i) - 0.025 * (1 - Math.abs(a - 0.7) / 0.12)); cc = col(0xe8e2d4); } if (p.getY(i) < 0.03) cc = col(0xd9d2c2); c.set([cc.r, cc.g, cc.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  mug.add(mesh(g, std(0xffffff, 0.35, 0, { vertexColors: true, side: THREE.DoubleSide, envMap: envTex, envMapIntensity: 0.4 })));
  const handle = mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 20, Math.PI * 1.15), std(0x3f6f8f, 0.35)); handle.position.set(-R - 0.02, H * 0.5, 0); handle.rotation.z = Math.PI * 0.43; mug.add(handle);
  const tea = mesh(new THREE.CircleGeometry(R - 0.03, 32), std(0x3a1e0e, 0.15, 0, { envMap: envTex, envMapIntensity: 0.6 }), false, true); tea.rotation.x = -Math.PI / 2; tea.position.y = H - 0.09; mug.add(tea);
  mug.position.set(-4.35, CT, 2.15); mug.rotation.y = 2.4;
  const ringTex = canvasTex(128, 128, (g2, w, h) => { g2.clearRect(0, 0, w, h); g2.strokeStyle = 'rgba(60,32,14,0.45)'; g2.lineWidth = 5; g2.beginPath(); g2.arc(64, 64, 50, 0.4, 5.3); g2.stroke(); g2.lineWidth = 2; g2.beginPath(); g2.arc(64, 64, 46, 1.2, 3.9); g2.stroke(); });
  decal(ringTex, 0.5, 0.5, -3.78, 2.45, 0.8, 0.8); decal(blotTex, 0.18, 0.18, -3.95, 2.72, 0.3, 0.7); decal(blotTex, 0.1, 0.1, -4.05, 2.6, 1.3, 0.6);
  const pos = new Float32Array(STEAM.n * 3), sz = new Float32Array(STEAM.n), al = new Float32Array(STEAM.n);
  for (let i = 0; i < STEAM.n; i++) { STEAM.age[i] = i / STEAM.n; STEAM.seed[i] = rr(0, 6); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); sg.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
  const sm = track(new THREE.ShaderMaterial({ uniforms: { uScale: pointScale, uNight: U.night },
    vertexShader: 'uniform float uScale; attribute float aSize; attribute float aAlpha; varying float vA; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / max(-mv.z, 0.1); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uNight; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; gl_FragColor = vec4(vec3(0.93, 0.93, 0.9) * mix(1.0, 0.6, uNight), (1.0 - smoothstep(0.1, 1.0, d)) * vA * 0.22); }',
    transparent: true, depthWrite: false }));
  STEAM.pts = new THREE.Points(track(sg), sm); STEAM.pts.frustumCulled = false; STEAM.pts.renderOrder = 8; room.add(STEAM.pts); STEAM.top = V3(-4.35, CT + H - 0.05, 2.15);
}
function updateSteam(dt, t) {
  const g = STEAM.pts.geometry, P = g.attributes.position.array, Sz = g.attributes.aSize.array, A = g.attributes.aAlpha.array;
  for (let i = 0; i < STEAM.n; i++) { let a = STEAM.age[i] + dt / 4.2; if (a > 1) { a -= 1; STEAM.seed[i] = rr(0, 6); } STEAM.age[i] = a; const s = STEAM.seed[i];
    P[i * 3] = STEAM.top.x + Math.sin(a * 5 + s + t * 0.6) * 0.07 * a + a * 0.12; P[i * 3 + 1] = STEAM.top.y + a * 0.95; P[i * 3 + 2] = STEAM.top.z + Math.cos(a * 4 + s) * 0.06 * a;
    Sz[i] = 0.12 + a * 0.32; A[i] = smooth01(0, 0.2, a) * (1 - smooth01(0.55, 1, a)); }
  g.attributes.position.needsUpdate = true; g.attributes.aSize.needsUpdate = true; g.attributes.aAlpha.needsUpdate = true;
}
/* ---- 3. food jar on the front ledge (click → shake + feed through the shared food system) ---- */
const jar = new THREE.Group(); jar.name = 'food-jar'; room.add(jar);
const JAR = { t: -1, fed: false };
{
  const label = canvasTex(512, 200, (g, w, h) => { g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c0452c'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
    g.fillStyle = '#21404a'; g.textAlign = 'center'; g.font = '800 58px Georgia, serif'; g.fillText('REEF', w / 4, 82); g.font = '700 30px system-ui, sans-serif'; g.fillText('DAILY FLAKES', w / 4, 124); g.font = 'italic 26px Georgia, serif'; g.fillText('A tiny pinch.', w / 4, 164);
    g.fillText('REEF', w * 0.75, 100); });
  const body = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.46, 32, 1, false), [std(0xffffff, 0.45, 0, { map: label }), std(0xe6dccb, 0.5), std(0xe6dccb, 0.5)]); body.position.y = 0.23; jar.add(body);
  const neck = mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.04, 32), std(0xe6dccb, 0.5)); neck.position.y = 0.48; jar.add(neck);
  const lidG = new THREE.CylinderGeometry(0.19, 0.19, 0.11, 48, 1); { const p = lidG.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const r = Math.hypot(p.getX(i), p.getZ(i)); if (r > 0.15) { const k = 1 + 0.035 * (Math.cos(a * 24) > 0 ? 1 : 0); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } } lidG.computeVertexNormals(); }
  const lid = mesh(lidG, std(0xb8452e, 0.4, 0.1)); lid.position.y = 0.555; jar.add(lid); jar.userData.lid = lid;
  jar.position.set(0.95, CT, 2.45); jar.rotation.y = -0.35;
  const flakeM = std(0xc8743a, 0.8); for (let i = 0; i < 9; i++) { const f = mesh(new THREE.CircleGeometry(rr(0.012, 0.022), 5), flakeM, false, true); f.rotation.set(-Math.PI / 2, 0, rr(0, 6)); f.position.set(0.95 + rr(-0.45, 0.45), CT + 0.003, 2.45 + rr(-0.3, 0.35)); if (Math.hypot(f.position.x - 0.95, f.position.z - 2.45) > 0.23) room.add(f); }
  pickable(jar, 'jar', 'Food jar — feed the fish');
}
function updateJar(dt) {
  if (JAR.t < 0) return; JAR.t += dt; const k = JAR.t;
  jar.rotation.z = Math.sin(k * 28) * 0.12 * Math.max(0, 1 - k / 0.7); jar.userData.lid.position.y = 0.555 + Math.abs(Math.sin(k * 28)) * 0.02 * Math.max(0, 1 - k / 0.7);
  jar.userData.lid.rotation.y = Math.sin(k * 20) * 0.2 * Math.max(0, 1 - k / 0.7);
  if (!JAR.fed && k > 0.45) { JAR.fed = true; feedAt(0.95, 0.75 + rr(-0.15, 0.15), true); }
  if (k > 0.8) { JAR.t = -1; jar.rotation.z = 0; }
}
/* ---- 4. open field notebook with a real turning page, pencil and bookmark ---- */
const notebook = new THREE.Group(); notebook.name = 'notebook'; room.add(notebook);
const NB = { t: 1, from: 0, to: 0, ang: 0, W: 0.46, L: 0.64, geo: null, base: null };
{
  const pageTex = (draw) => canvasTex(360, 500, (g, w, h) => { g.fillStyle = '#f3ead2'; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 300, '#d8caa6', 0.4, 1.2, 0.3); g.strokeStyle = 'rgba(90,120,160,0.28)'; g.lineWidth = 1.5; for (let y = 70; y < h - 20; y += 30) { g.beginPath(); g.moveTo(18, y); g.lineTo(w - 14, y); g.stroke(); } draw(g, w, h); });
  const left = pageTex((g) => { handText(g, 'DAY 042', 26, 58, 36, '#243448', -0.02, undefined, 'bold italic '); handText(g, '03 fish / 01 cat', 26, 124, 28, '#243448', -0.01); handText(g, 'pH 8.2 · 25.5 °C', 26, 184, 24, '#34506a', 0); handText(g, 'Algae: tomorrow.', 26, 244, 28, '#243448', 0.01); handText(g, 'Milo: suspicious.', 26, 304, 28, '#8a2d22', -0.015); handText(g, 'Big one guards the', 26, 364, 22, '#34506a', 0); handText(g, 'anemone again.', 26, 394, 22, '#34506a', 0); });
  const right = pageTex((g) => { g.save(); g.translate(180, 170); g.strokeStyle = '#3a3a3a'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 110, 52, 0, 0, 6.283); g.stroke();
      for (const x of [-55, 5, 70]) { g.beginPath(); g.moveTo(x, -50); g.quadraticCurveTo(x + (x === 5 ? -14 : 4), 0, x, 50); g.stroke(); }
      g.beginPath(); g.moveTo(106, 0); g.lineTo(160, -38); g.lineTo(150, 0); g.lineTo(160, 38); g.closePath(); g.stroke(); g.beginPath(); g.arc(-80, -10, 7, 0, 6.28); g.fill(); g.restore();
      handText(g, 'three bars — middle', 26, 300, 22, '#34506a', 0); handText(g, 'one bulges forward', 26, 330, 22, '#34506a', 0); handText(g, 'eats: flakes, a lot', 26, 392, 24, '#243448', 0.01); });
  const turnA = pageTex((g) => { handText(g, 'Shrimp moved', 26, 124, 26, '#243448', 0); handText(g, 'to the left rock.', 26, 154, 26, '#243448', 0); handText(g, 'Snail: 4 cm/day?', 26, 244, 26, '#243448', 0); });
  const turnB = pageTex((g) => { handText(g, 'TODO', 26, 124, 30, '#8a2d22', 0, undefined, 'bold italic '); handText(g, '- clean glass', 26, 184, 26, '#243448', 0); handText(g, '- hide the flakes', 26, 244, 26, '#243448', 0); handText(g, '  from Milo', 26, 274, 26, '#243448', 0); });
  turnB.wrapS = THREE.RepeatWrapping; turnB.repeat.x = -1; turnB.offset.x = 1;
  const W = NB.W, L = NB.L;
  const cover = mesh(new THREE.BoxGeometry(W * 2 + 0.06, 0.02, L + 0.05), std(0x5a3a26, 0.7)); cover.position.y = 0.01; notebook.add(cover);
  const block = (x, tex) => { const g = new THREE.BoxGeometry(W, 0.035, L, 8, 1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + 0.012 * Math.sin(Math.abs(p.getX(i) + (x < 0 ? W / 2 : -W / 2)) / W * Math.PI)); g.computeVertexNormals();
    const pm = std(0xf1e8d0, 0.9); const m = mesh(g, [pm, pm, std(0xffffff, 0.9, 0, { map: tex }), pm, pm, pm]); m.position.set(x, 0.037, 0); notebook.add(m); return m; };
  const texRot = (t) => { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; return t; };
  block(-W / 2 - 0.004, texRot(left)); block(W / 2 + 0.004, texRot(right));
  const spineM = mesh(new THREE.CylinderGeometry(0.02, 0.02, L + 0.05, 8), std(0x4a2e1e, 0.7)); spineM.rotation.x = Math.PI / 2; spineM.position.y = 0.03; notebook.add(spineM);
  // turning page: shared deformable geometry, front + back materials; hinge = spine (local z axis)
  const pg = new THREE.PlaneGeometry(W, L, 14, 1); pg.rotateX(-Math.PI / 2); pg.translate(W / 2, 0, 0); NB.geo = track(pg); NB.base = Float32Array.from(pg.attributes.position.array);
  const pageF = new THREE.Mesh(pg, std(0xffffff, 0.9, 0, { map: texRot(turnA), side: THREE.FrontSide })); const pageB = new THREE.Mesh(pg, std(0xffffff, 0.9, 0, { map: texRot(turnB), side: THREE.BackSide }));
  pageF.castShadow = true; const page = new THREE.Group(); page.position.set(0.004, 0.068, 0); page.add(pageF, pageB); notebook.add(page); NB.page = page;
  const ribbon = mesh(new THREE.PlaneGeometry(0.035, 0.36, 1, 6), std(0x9a2a2a, 0.8, 0, { side: THREE.DoubleSide })); ribbon.rotation.x = -Math.PI / 2; ribbon.position.set(0.02, 0.072, L / 2 + 0.1); ribbon.rotation.z = 0.15; notebook.add(ribbon);
  notebook.position.set(-2.75, CT, 2.38); notebook.rotation.y = 0.12;
  const pencil = new THREE.Group(); const hex = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), std(0xe8b92a, 0.5)); pencil.add(hex);
  const cone = mesh(new THREE.ConeGeometry(0.018, 0.06, 6), std(0xe0c090, 0.8)); cone.position.y = 0.28; pencil.add(cone);
  const lead = mesh(new THREE.ConeGeometry(0.006, 0.02, 6), std(0x2a2a2a, 0.4, 0.3)); lead.position.y = 0.315; pencil.add(lead);
  const fer = mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.04, 8), std(0xb8b8b0, 0.3, 0.8)); fer.position.y = -0.27; pencil.add(fer);
  const er = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.035, 8), std(0xe28a8a, 0.8)); er.position.y = -0.305; pencil.add(er);
  pencil.rotation.set(Math.PI / 2, 0, 1.2); pencil.position.set(-2.0, CT + 0.018, 2.62); room.add(pencil);
  pickable(notebook, 'notebook', 'Field notebook');
}
function updateNotebook(dt) {
  if (NB.t >= 1) return; NB.t = Math.min(1, NB.t + dt / 1.6);
  const k = NB.t < 1 ? 1 - Math.pow(1 - NB.t, 2.2) : 1, a = lerp(NB.from, NB.to, k); NB.ang = a;
  const P = NB.geo.attributes.position.array, B = NB.base, lift = Math.sin(a) * 0.06;
  for (let i = 0; i < P.length; i += 3) { const x = B[i], r = x / NB.W, bend = a * (1 - 0.18 * Math.sin(Math.PI * k) * r);   // tip lags → curl
    P[i] = Math.cos(bend) * x; P[i + 1] = Math.sin(bend) * x + lift * r * (1 - r) * 2; P[i + 2] = B[i + 2]; }
  NB.geo.attributes.position.needsUpdate = true; NB.geo.computeVertexNormals(); NB.geo.computeBoundingSphere();
}
/* ---- 5. folded cloth, damp marks and dried splashes ---- */
{
  const g = new THREE.PlaneGeometry(0.95, 0.72, 30, 24); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); let y = 0.02 + 0.03 * Math.max(0, Math.sin(x * 9 + 1)) + 0.02 * Math.max(0, Math.sin(z * 11 - x * 3)) + 0.012 * Math.sin(x * 23) * Math.sin(z * 19);
    if (x > 0.2) y += 0.05 * smooth01(0.2, 0.47, x); p.setXYZ(i, x + Math.sin(z * 17) * 0.012, y, z + Math.sin(x * 13) * 0.012); }
  g.computeVertexNormals();
  const tex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#6f8fa3'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { c.fillStyle = 'rgba(40,60,80,0.18)'; c.fillRect(0, y, w, 1); } noiseDots(c, w, h, 300, '#93b1c2', 0.5, 1.2, 0.3); }, { repeat: [4, 3] });
  const cloth = mesh(g, std(0xffffff, 1, 0, { map: tex, side: THREE.DoubleSide })); cloth.position.set(2.6, CT, 2.38); cloth.rotation.y = 0.35; room.add(cloth);
  const fold = mesh(new THREE.PlaneGeometry(0.42, 0.66, 10, 10).rotateX(-Math.PI / 2), std(0xffffff, 1, 0, { map: tex, side: THREE.DoubleSide })); fold.position.set(2.72, CT + 0.085, 2.4); fold.rotation.set(0, 0.35, 0.08); room.add(fold);
  decal(blotTex, 0.5, 0.4, 2.0, 2.2, 0.4, 0.7); decal(blotTex, 0.3, 0.25, -0.2, 2.05, 1.1, 0.5); decal(blotTex, 0.22, 0.2, 3.25, 2.05, 2.1, 0.55);
}
/* ---- 6. filter canister, hoses routed OVER the back rim (outside → over → inside), intake + spray bar, thermometer ---- */
{
  const x = 4.35, z = -2.05; const can = new THREE.Group(); can.position.set(x, CT, z); room.add(can);
  const lab = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#2b3035'; g.fillRect(0, 0, w, h); g.fillStyle = '#9fd3c7'; g.font = '700 34px system-ui, sans-serif'; g.fillText('FLOW 400', 18, 58); g.font = '20px system-ui, sans-serif'; g.fillStyle = '#c9d2d6'; g.fillText('canister filter', 18, 92); });
  const bodyM = std(0x3a4046, 0.45, 0.2);
  { const cb = mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.95, 32), [std(0xffffff, 0.45, 0.1, { map: lab }), bodyM, bodyM]); cb.position.y = 0.5; cb.rotation.y = 2.2; can.add(cb); }
  const capM = mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.14, 32), std(0x1e2226, 0.4, 0.3)); capM.position.y = 1.04; can.add(capM);
  const foot = mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.05, 32), std(0x1e2226, 0.6)); foot.position.y = 0.025; can.add(foot);
  for (const dx of [-0.13, 0.13]) { const c = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), std(0x16191c, 0.5)); c.position.set(dx, 1.16, 0.02); can.add(c); }
  const hoseM = std(0x223a36, 0.35, 0, { transparent: true, opacity: 0.92, envMap: envTex, envMapIntensity: 0.4 });
  const pipeM = enhance(std(0x3f5a55, 0.4, 0.1, { transparent: true, opacity: 0.9 }), { underwater: true, caus: 0.3 });
  // waypoints: every point is either outside the glass (x > 3.5 or z < −1.75) or above the rim (y > 2.25) or inside (z > −1.705)
  const intake = curve([[x - 0.13, CT + 1.2, z + 0.02], [x - 0.2, 0.2, -2.02], [3.62, 1.7, -1.96], [3.15, 2.38, -1.86], [3.0, 2.44, -1.73], [2.95, 2.36, -1.62], [2.95, 2.1, -1.6]]);
  const ret = curve([[x + 0.13, CT + 1.2, z + 0.02], [x + 0.05, 0.0, -2.2], [3.9, 1.5, -2.1], [2.85, 2.34, -1.92], [2.55, 2.44, -1.73], [2.5, 2.36, -1.62], [2.5, 2.1, -1.6]]);
  room.add(mesh(taperTube(intake, 90, 10, 0.042, 0.042), hoseM)); room.add(mesh(taperTube(ret, 90, 10, 0.042, 0.042), hoseM));
  const iPipe = mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 12), pipeM); iPipe.position.set(2.95, 2.1 - 1.5, -1.6); tank.add(iPipe);
  const strainer = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 14, 4), enhance(std(0x2c3b38, 0.6, 0.1, { wireframe: false }), { underwater: true, caus: 0.3 })); strainer.position.set(2.95, 2.1 - 3.0 - 0.1, -1.6); tank.add(strainer);
  const rPipe = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12), pipeM); rPipe.position.set(2.5, 1.9, -1.6); tank.add(rPipe);
  const bar = mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.1, 12), pipeM); bar.rotation.z = Math.PI / 2; bar.position.set(1.96, 1.68, -1.6); tank.add(bar);
  const cupM = enhance(std(0xdfe8e6, 0.3, 0, { transparent: true, opacity: 0.7 }), { underwater: true, caus: 0 });
  for (const [cx, cy] of [[2.95, 1.2], [2.95, -0.2], [1.6, 1.68]]) { const c = mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.05, 12), cupM, false, false); c.rotation.x = Math.PI / 2; c.position.set(cx, cy, -1.675); tank.add(c); }
  addObst(2.95, 0.4, -1.6, 0.2, 'pipe'); addObst(2.95, -0.8, -1.6, 0.2, 'pipe');
  // thermometer on the inside of the front glass
  const th = new THREE.Group(); const tickTex = canvasTex(64, 400, (g, w, h) => { g.fillStyle = '#f4f7f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a3a44'; for (let i = 0; i <= 20; i++) { const y = 30 + i * 17; g.fillRect(8, y, i % 5 ? 12 : 22, 2); } g.font = '700 16px system-ui'; g.fillText('°C', 30, 26); g.fillStyle = '#c33'; g.fillRect(38, 200, 10, 180); g.beginPath(); g.arc(43, 384, 10, 0, 6.28); g.fill(); g.fillStyle = '#2a3a44'; g.fillText('26', 34, 196); });
  const back2 = mesh(new THREE.PlaneGeometry(0.13, 0.82), enhance(std(0xffffff, 0.6, 0, { map: tickTex }), { underwater: true, caus: 0.2 }), false, false); th.add(back2);
  const tube = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.74, 10), std(0xe8f4f4, 0.1, 0, { transparent: true, opacity: 0.35, depthWrite: false }), false, false); tube.position.set(0.02, 0, 0.018); th.add(tube);
  th.position.set(3.02, 0.35, IN.z1 - 0.012); th.rotation.y = Math.PI; th.rotation.z = 0.03; tank.add(th);
  const sc = mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.02, 10), cupM, false, false); sc.rotation.x = Math.PI / 2; sc.position.set(3.02, 0.7, IN.z1 - 0.006); tank.add(sc);
}
/* ---- 7. mesh net leaning on the counter edge (merged line geometry for the netting) ---- */
{
  const net = new THREE.Group(); net.name = 'net'; room.add(net);
  const F = V3(6.98, FLOOR_Y + 0.02, 2.35), A = V3(6.72, CT + 0.12, 1.75), d = _v1.subVectors(A, F);
  const handle = mesh(new THREE.CylinderGeometry(0.03, 0.035, d.length(), 10), std(0x2b4f73, 0.45, 0.2)); handle.position.copy(F).addScaledVector(d, 0.5); handle.quaternion.setFromUnitVectors(UP, d.clone().normalize()); net.add(handle);
  const grip = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.5, 10), std(0x151515, 0.8)); grip.position.copy(F).addScaledVector(d, 0.12); grip.quaternion.copy(handle.quaternion); net.add(grip);
  const hoop = new THREE.Group(); hoop.position.copy(A).addScaledVector(d.clone().normalize(), 0.34); hoop.quaternion.setFromUnitVectors(UP, d.clone().normalize()); net.add(hoop);
  const a = 0.36, b = 0.27; const ring = curve(Array.from({ length: 24 }, (_, i) => { const t = i / 24 * Math.PI * 2; return [Math.sin(t) * b * 0.02, Math.cos(t) * a, Math.sin(t) * b]; }).concat([[0, a, 0]]));
  hoop.add(mesh(taperTube(ring, 80, 6, 0.012, 0.012), std(0x9aa3a8, 0.35, 0.8)));
  const segs = []; const bag = (t, s) => { const x = 0.33 * s + 0.1 * s * s, sh = Math.sqrt(Math.max(0, 1 - s * s * 0.85)); return [x, Math.cos(t) * a * sh - 0.12 * s * s, Math.sin(t) * b * sh]; };
  for (let m = 0; m < 16; m++) { const t = m / 16 * Math.PI * 2; for (let k = 0; k < 8; k++) segs.push(...bag(t, k / 8), ...bag(t, (k + 1) / 8)); }
  for (let k = 1; k <= 8; k++) for (let m = 0; m < 16; m++) segs.push(...bag(m / 16 * Math.PI * 2, k / 8), ...bag((m + 1) / 16 * Math.PI * 2, k / 8));
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
  hoop.add(new THREE.LineSegments(track(ng), basic({ color: 0xdfe6e8, transparent: true, opacity: 0.8 })));
}
/* ---- 8. stool, yarn ball with wraps and a loose thread that ends on the floor ---- */
{
  const st = new THREE.Group(); st.name = 'stool'; room.add(st); const wood = std(0x8a5a36, 0.6, 0, { map: walnutTex });
  const seat = mesh(new THREE.CylinderGeometry(0.46, 0.44, 0.09, 32), wood); seat.position.y = 1.55; st.add(seat);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, top = V3(Math.cos(a) * 0.3, 1.5, Math.sin(a) * 0.3), bot = V3(Math.cos(a) * 0.44, 0, Math.sin(a) * 0.44); const d = bot.clone().sub(top);
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.03, d.length(), 10), wood); leg.position.copy(top).addScaledVector(d, 0.5); leg.quaternion.setFromUnitVectors(UP, d.normalize()); st.add(leg); }
  const brace = mesh(new THREE.TorusGeometry(0.39, 0.018, 6, 32), wood); brace.rotation.x = Math.PI / 2; brace.position.y = 0.5; st.add(brace);
  st.position.set(-5.05, FLOOR_Y, 3.45);
  const yarnM = std(0xb8475a, 0.95), R = 0.21, yarn = new THREE.Group(); yarn.position.set(-3.55, FLOOR_Y + R, 3.75); room.add(yarn);
  yarn.add(mesh(new THREE.SphereGeometry(R * 0.96, 24, 16), yarnM));
  for (let i = 0; i < 9; i++) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rr(0, 3), rr(0, 3), rr(0, 3))); const pts = Array.from({ length: 33 }, (_, k) => { const t = k / 32 * Math.PI * 2; return V3(Math.cos(t) * R, Math.sin(t) * R, 0).applyQuaternion(q); });
    yarn.add(mesh(taperTube(new THREE.CatmullRomCurve3(pts, true), 64, 5, 0.012, 0.012), yarnM)); }
  const thread = curve([[-3.55 + 0.1, FLOOR_Y + 0.05, 3.75 + 0.19], [-3.3, FLOOR_Y + 0.012, 4.1], [-2.9, FLOOR_Y + 0.012, 4.05], [-2.6, FLOOR_Y + 0.012, 4.35], [-2.2, FLOOR_Y + 0.012, 4.3], [-2.0, FLOOR_Y + 0.012, 4.5]]);
  room.add(mesh(taperTube(thread, 80, 5, 0.01, 0.006), yarnM));
}
/* ---- 9. houseplant in a chipped terracotta pot, heart leaves with veins, trailing vine ---- */
const plantLeafMat = enhance(std(0xffffff, 0.6, 0, { vertexColors: true, side: THREE.DoubleSide }), { sway: { amp: 0.012, speed: 0.6 } });
{
  const pot = new THREE.Group(); pot.position.set(-5.75, CT, -1.95); room.add(pot);
  const prof = [[0.001, 0], [0.3, 0], [0.4, 0.62], [0.45, 0.64], [0.45, 0.74], [0.41, 0.75], [0.38, 0.66], [0.28, 0.06], [0.001, 0.06]].map(([r, y]) => new THREE.Vector2(r, y));
  const pg = new THREE.LatheGeometry(prof, 36); const p = pg.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); let cc = col(0xb8643e).lerp(col(0x9a4f2e), 0.5 + 0.5 * Math.sin(a * 3 + p.getY(i) * 5)); if (p.getY(i) > 0.7 && Math.abs(a - 1.9) < 0.18) { p.setY(i, p.getY(i) - 0.05); cc = col(0xd9a37e); } c.set([cc.r, cc.g, cc.b], i * 3); }
  pg.setAttribute('color', new THREE.BufferAttribute(c, 3)); pg.computeVertexNormals(); pot.add(mesh(pg, std(0xffffff, 0.85, 0, { vertexColors: true, side: THREE.DoubleSide })));
  const soil = mesh(new THREE.CircleGeometry(0.39, 28), std(0x2e2118, 1), false, true); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.66; pot.add(soil);
  const heart = (s) => { const h = new THREE.Shape(); h.moveTo(0, 0); h.bezierCurveTo(0.35 * s, 0.12 * s, 0.55 * s, 0.55 * s, 0, s); h.bezierCurveTo(-0.55 * s, 0.55 * s, -0.35 * s, 0.12 * s, 0, 0); return h; };
  const leaves = [], stems = [];
  const addLeaf = (base, dir, s, roll, phase) => {
    const g = new THREE.ShapeGeometry(heart(s), 10); const q = g.attributes.position, cc = new Float32Array(q.count * 3);
    for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i); q.setZ(i, -Math.abs(x) * 0.35 + (y / s) ** 2 * 0.08 * s); const vein = Math.abs(x) < 0.012 * (1 + s) ? 1 : 0; const k = col(0x2f6b2e).lerp(col(0x5c9a3c), y / s); if (vein) k.lerp(col(0xb9d98a), 0.6); cc.set([k.r, k.g, k.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.computeVertexNormals();
    const m = new THREE.Object3D(); m.position.copy(base); m.lookAt(_v1.copy(base).add(dir)); m.rotateX(Math.PI / 2); m.rotateY(roll); m.updateMatrix(); g.applyMatrix4(m.matrix);
    const bb = new THREE.Box3().setFromBufferAttribute(g.attributes.position); addSway(g, bb.min.y - 0.3, bb.max.y, phase); leaves.push(g);
  };
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + rr(-0.2, 0.2), hgt = rr(0.45, 1.05), out = rr(0.18, 0.5);
    const c0 = V3(Math.cos(a) * 0.06, 0.66, Math.sin(a) * 0.06), c1 = V3(Math.cos(a) * out * 0.5, 0.66 + hgt * 0.7, Math.sin(a) * out * 0.5), c2 = V3(Math.cos(a) * out, 0.66 + hgt, Math.sin(a) * out);
    const cv = new THREE.CatmullRomCurve3([c0, c1, c2]); const sg = taperTube(cv, 16, 5, 0.014, 0.008); addSway(sg, 0.66, 0.66 + hgt, i); stems.push(sg);
    addLeaf(c2, V3(Math.cos(a) * 0.6, 0.35, Math.sin(a) * 0.6), rr(0.2, 0.32), rr(-0.4, 0.4), i);
  }
  const vine = curve([[-0.38, 0.72, 0.12], [-0.62, 0.02, 0.2], [-0.87, 0.0, 0.28], [-0.95, -0.45, 0.35], [-0.98, -0.95, 0.42]]);
  const vg = taperTube(vine, 40, 5, 0.012, 0.007); addSway(vg, 0.7, -1.0, 3); stems.push(vg);
  for (let k = 1; k < 9; k++) { const pt = vine.getPointAt(k / 9); addLeaf(pt, V3(rr(-0.5, 0.2), 0.4, rr(0.4, 1)), rr(0.09, 0.14), rr(-0.5, 0.5), k); }
  pot.add(mesh(mergeSafe(stems), enhance(std(0x3c6a2c, 0.7), { sway: { amp: 0.012, speed: 0.6 } })));
  pot.add(mesh(mergeSafe(leaves), plantLeafMat));
}
function updateDesk(dt, t) { updateSteam(dt, t); updateJar(dt); updateNotebook(dt); }
