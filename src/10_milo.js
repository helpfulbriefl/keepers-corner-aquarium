/* =====================================================================
   13. GLASS HIGHLIGHT RINGS + MILO THE TABBY
   Milo's local axes: +Z = forward (his nose), +Y = up, +X = his left. The group is yawed −90°,
   so local +Z → world −X (toward the tank's right panel) and local +X → world +Z (toward the viewer).
   ===================================================================== */
const RINGS = [];
{
  const g = track(new THREE.RingGeometry(0.055, 0.085, 40));
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(g, basic({ color: 0xdff8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.visible = false; m.renderOrder = 14; m.userData.t = 9; scene.add(m); RINGS.push(m); }
}
let ringIdx = 0;
function glassRing(point, normal) { const r = RINGS[ringIdx]; ringIdx = (ringIdx + 1) % RINGS.length; r.position.copy(point).addScaledVector(normal, 0.004); r.lookAt(_v1.copy(r.position).add(normal)); r.userData.t = 0; r.visible = true; }
function updateRings(dt) { for (const r of RINGS) { if (!r.visible) continue; r.userData.t += dt; const k = r.userData.t / 0.9; if (k >= 1) { r.visible = false; continue; } r.scale.setScalar(1 + k * 1.6); r.material.opacity = (1 - k) * 0.9; } }

const milo = new THREE.Group(); milo.name = 'milo'; room.add(milo);
milo.position.set(4.42, CT, 1.02); milo.rotation.y = -Math.PI / 2 + 0.32;      // 3/4 toward the viewer, still facing the right glass
const MILO = { state: 'idle', t: 0, next: 24, blinkIn: 2.5, blinkT: -1, yaw: 0, pitch: 0, glanceIn: 9, glanceT: -1, contact: V3(), head: null, legs: [], tail: [], eyes: [], torso: null, flick: -1, flickIn: 6 };
{
  const tabby = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#8c7b66'; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 2400, '#a8977f', 0.4, 1.3, 0.35); noiseDots(g, w, h, 1600, '#6b5a47', 0.4, 1.2, 0.35);
    for (let i = 0; i < 22; i++) { const x0 = i * w / 22 + rr(-4, 4), wd = rr(5, 11);          // broken mackerel stripes, not rings
      for (let y = 0; y < h; y += 22) { if (rand() < 0.22) continue; const y1 = Math.min(h, y + rr(14, 26)), sx = (yy) => x0 + Math.sin(yy * 0.05 + i) * 7;
        g.fillStyle = `rgba(58,44,32,${rr(0.32, 0.55)})`; g.beginPath(); g.moveTo(sx(y), y); g.lineTo(sx(y1), y1); g.lineTo(sx(y1) + wd * rr(0.6, 1), y1); g.lineTo(sx(y) + wd, y); g.closePath(); g.fill(); } } });
  const headTex = canvasTex(512, 256, (g, w, h) => { g.drawImage(tabby.image, 0, 0); const cx = w * 0.25; g.strokeStyle = 'rgba(45,33,24,0.9)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx - 34, 92); g.lineTo(cx - 20, 58); g.lineTo(cx, 84); g.lineTo(cx + 20, 58); g.lineTo(cx + 34, 92); g.stroke(); g.lineWidth = 4; for (const dx of [-12, 0, 12]) { g.beginPath(); g.moveTo(cx + dx, 50); g.lineTo(cx + dx * 1.4, 18); g.stroke(); } });
  const fur = std(0xffffff, 0.92, 0, { map: tabby }), furHead = std(0xffffff, 0.9, 0, { map: headTex }), cream = std(0xe9dcc8, 0.92), pink = std(0xd98e8a, 0.7), dark = std(0x1a1512, 0.5);
  const sph = track(new THREE.SphereGeometry(1, 32, 20));
  const ell = (parent, sx, sy, sz, x, y, z, m, rx = 0, ry = 0, rz = 0) => { const e = shade(new THREE.Mesh(sph, m)); e.scale.set(sx, sy, sz); e.position.set(x, y, z); e.rotation.set(rx, ry, rz); parent.add(e); return e; };
  MILO.torso = ell(milo, 0.31, 0.56, 0.33, 0, 0.8, 0.02, fur, 0.35);
  ell(milo, 0.42, 0.4, 0.5, 0, 0.42, -0.25, fur);
  for (const sx of [-1, 1]) { ell(milo, 0.2, 0.28, 0.36, sx * 0.26, 0.3, -0.12, fur); ell(milo, 0.085, 0.05, 0.15, sx * 0.24, 0.05, 0.14, cream); }
  ell(milo, 0.2, 0.38, 0.16, 0, 0.92, 0.22, cream, 0.3);
  ell(milo, 0.22, 0.2, 0.22, 0, 1.28, 0.17, fur);
  const head = new THREE.Group(); head.position.set(0, 1.48, 0.26); head.rotation.order = 'YXZ'; milo.add(head); MILO.head = head;
  ell(head, 0.29, 0.26, 0.27, 0, 0, 0, furHead);
  for (const sx of [-1, 1]) { ell(head, 0.14, 0.11, 0.13, sx * 0.12, -0.07, 0.1, fur); ell(head, 0.07, 0.055, 0.06, sx * 0.045, -0.1, 0.225, cream); }
  ell(head, 0.06, 0.04, 0.05, 0, -0.155, 0.18, cream);
  const nose = shade(new THREE.Mesh(track(new THREE.ConeGeometry(0.03, 0.03, 3)), pink)); nose.rotation.set(Math.PI, 0, 0); nose.position.set(0, -0.052, 0.272); head.add(nose);
  const mouth = shade(new THREE.Mesh(track(new THREE.BoxGeometry(0.006, 0.03, 0.004)), dark)); mouth.position.set(0, -0.085, 0.279); head.add(mouth);
  const eyeMat = std(0xc6d24a, 0.15, 0, { emissive: 0x2c3008, envMap: envTex, envMapIntensity: 0.8 });
  for (const sx of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sx * 0.105, 0.028, 0.2); eg.rotation.y = sx * 0.22; head.add(eg); MILO.eyes.push(eg);
    const eb = new THREE.Mesh(sph, eyeMat); eb.scale.setScalar(0.054); eg.add(eb);
    const pu = new THREE.Mesh(sph, dark); pu.scale.set(0.012, 0.04, 0.012); pu.position.z = 0.047; eg.add(pu);
    const gl = new THREE.Mesh(sph, basic({ color: 0xffffff })); gl.scale.setScalar(0.009); gl.position.set(0.014, 0.016, 0.05); eg.add(gl);
    const earG = track(new THREE.ConeGeometry(0.1, 0.21, 12)); const ear = shade(new THREE.Mesh(earG, fur)); ear.scale.z = 0.45; ear.position.set(sx * 0.15, 0.21, -0.03); ear.rotation.set(-0.12, 0, -sx * 0.32); head.add(ear);
    const inner = new THREE.Mesh(earG, pink); inner.scale.set(0.68, 0.72, 0.3); inner.position.set(sx * 0.148, 0.195, 0.0); inner.rotation.copy(ear.rotation); head.add(inner);
  }
  const wp = []; for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) wp.push(sx * 0.07, -0.095, 0.25, sx * 0.4, -0.07 + k * 0.035, 0.29 - Math.abs(k) * 0.03);
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); head.add(new THREE.LineSegments(track(wg), basic({ color: 0xf2f0ea, transparent: true, opacity: 0.8 })));
  const A = 0.52, B = 0.5;
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.14, 1.02, 0.2); milo.add(sh);
    const ug = new THREE.CylinderGeometry(0.075, 0.062, A, 14); ug.translate(0, -A / 2, 0); sh.add(shade(new THREE.Mesh(track(ug), fur)));
    const el = new THREE.Group(); el.position.y = -A; sh.add(el); ell(el, 0.068, 0.07, 0.07, 0, 0, 0, fur);
    const lg = new THREE.CylinderGeometry(0.062, 0.054, B, 14); lg.translate(0, -B / 2, 0); el.add(shade(new THREE.Mesh(track(lg), fur)));
    const wr = new THREE.Group(); wr.position.y = -B; el.add(wr); const paw = ell(wr, 0.078, 0.05, 0.1, 0, -0.005, 0.045, cream);
    MILO.legs.push({ sx, sh, el, wr, A, B, rest: V3(sx * 0.14, 0.055, 0.36), cur: V3(sx * 0.14, 0.055, 0.36) });
  }
  let parent = new THREE.Group(); parent.position.set(0, 0.075, -0.47); milo.add(parent);
  for (let i = 0; i < 13; i++) { const seg = new THREE.Group(); seg.position.z = i ? -0.085 : 0; parent.add(seg); const r = lerp(0.062, 0.034, i / 12); ell(seg, r, r, 0.07, 0, 0, -0.04, fur); MILO.tail.push(seg); parent = seg; }
  milo.updateMatrixWorld(true);
  pickable(milo, 'milo', 'Milo');
}
function legIK(L, target, pitch) {                           // 2-bone IK in Milo's sagittal (z, y) plane
  const S0 = L.sh.position, dz = target.z - S0.z, dy = target.y - S0.y;
  const d = clamp(Math.hypot(dz, dy), Math.abs(L.A - L.B) + 0.01, L.A + L.B - 0.005), phi = Math.atan2(dy, dz);
  const alpha = Math.acos(clamp((L.A * L.A + d * d - L.B * L.B) / (2 * L.A * d), -1, 1)), beta = Math.acos(clamp((L.A * L.A + L.B * L.B - d * d) / (2 * L.A * L.B), -1, 1));
  const th1 = phi - alpha;                                     // elbow behind the line shoulder→paw
  const r1 = -Math.PI / 2 - th1, r2 = beta - Math.PI;
  L.sh.rotation.x = r1; L.el.rotation.x = r2; L.wr.rotation.x = pitch - r1 - r2;
}
function startPaw(fromClick) {
  if (MILO.state !== 'idle') return false;
  const L = MILO.legs[1]; _v1.copy(L.sh.position); milo.localToWorld(_v1);
  const fw = _v2.set(0, 0, 1).applyQuaternion(milo.quaternion), k = (TANK.x1 + 0.082 - _v1.x) / Math.min(-0.2, fw.x);   // along his forward axis
  MILO.contact.set(TANK.x1 + 0.082, CT + 1.28, clamp(_v1.z + fw.z * k, TANK.z0 + 0.2, TANK.z1 - 0.2)); MILO.state = fromClick ? 'glance' : 'reach'; MILO.t = 0; return true;
}
function nearestFishTo(p) { let b = FISH[0], bd = 1e9; for (const f of FISH) { const d = f.pos.distanceToSquared(p); if (d < bd) { bd = d; b = f; } } return b; }
function updateMilo(dt, t) {
  const M = MILO; M.t += dt; let look = null, reach = 0;
  const hw = _v4.copy(M.head.position); milo.localToWorld(hw);
  switch (M.state) {
    case 'idle': look = nearestFishTo(hw).pos; M.next -= dt;
      if (M.next <= 0) { if (S.real >= S.tapCooldownUntil) startPaw(false); else M.next = 3; } break;
    case 'glance': look = camera.position; if (M.t > 0.75) { M.state = 'reach'; M.t = 0; } break;
    case 'reach': look = M.contact; reach = smooth01(0, 0.85, M.t); if (M.t > 0.85) { M.state = 'touch'; M.t = 0;
      glassRing(_v3.set(TANK.x1 + 0.001, M.contact.y, M.contact.z), _v2.set(1, 0, 0)); scareFish(_v3.set(IN.x1, M.contact.y, M.contact.z), _v2.set(1, 0, 0)); S.tapCooldownUntil = S.real + 2.5; } break;
    case 'touch': look = M.contact; reach = 1; if (M.t > 0.45) { M.state = 'lower'; M.t = 0; } break;
    case 'lower': look = nearestFishTo(hw).pos; reach = 1 - smooth01(0, 0.8, M.t); if (M.t > 0.8) { M.state = 'idle'; M.t = 0; M.next = rr(20, 45); } break;
  }
  if (M.state === 'idle') { M.glanceIn -= dt; if (M.glanceIn < 0 && M.glanceT < 0) { M.glanceT = 0; M.glanceIn = rr(9, 16); } if (M.glanceT >= 0) { M.glanceT += dt; look = camera.position; if (M.glanceT > 1.6) M.glanceT = -1; } }
  _v1.copy(look); milo.worldToLocal(_v1); _v1.sub(M.head.position);
  const yawT = clamp(Math.atan2(_v1.x, _v1.z), -0.8, 0.8), pitchT = clamp(-Math.atan2(_v1.y, Math.hypot(_v1.x, _v1.z)), -0.5, 0.42);
  M.yaw = damp(M.yaw, yawT, 4.5, dt); M.pitch = damp(M.pitch, pitchT, 4.5, dt); M.head.rotation.set(M.pitch, M.yaw, -M.yaw * 0.12);
  M.blinkIn -= dt; if (M.blinkIn < 0) { M.blinkT = 0; M.blinkIn = rr(2.5, 6.5); }
  let ey = 1; if (M.blinkT >= 0) { M.blinkT += dt; ey = 1 - 0.92 * Math.sin(Math.PI * clamp(M.blinkT / 0.16, 0, 1)); if (M.blinkT > 0.16) M.blinkT = -1; }
  for (const e of M.eyes) e.scale.y = ey;
  const br = Math.sin(t * 1.7); M.torso.scale.set(0.31 * (1 + 0.014 * br), 0.56 * (1 + 0.006 * br), 0.33 * (1 + 0.016 * br));
  for (const L of M.legs) {
    let pitch = 0; L.cur.copy(L.rest);
    if (L.sx > 0 && reach > 0) { _v2.copy(M.contact); milo.worldToLocal(_v2); _v2.x = L.rest.x; L.cur.lerpVectors(L.rest, _v2, reach); L.cur.y += Math.sin(Math.PI * reach) * 0.22 * (M.state === 'lower' ? 0.6 : 1); L.cur.z -= Math.sin(Math.PI * reach) * 0.06; pitch = -1.35 * reach; }
    legIK(L, L.cur, pitch);
  }
  M.flickIn -= dt; if (M.flickIn < 0 && M.flick < 0) { M.flick = 0; M.flickIn = rr(5, 11); } if (M.flick >= 0) { M.flick += dt; if (M.flick > 0.7) M.flick = -1; }
  const fk = M.flick >= 0 ? Math.sin(M.flick / 0.7 * Math.PI) : 0;
  M.tail.forEach((s, i) => { const k = i / 12; s.rotation.y = (i === 0 ? 0.1 : -0.27) + Math.sin(t * 0.9 - i * 0.45) * 0.05 * k + fk * 0.35 * k * k * Math.sin(M.flick * 20); s.rotation.x = i > 9 ? -0.18 - fk * 0.2 : 0; });
}
