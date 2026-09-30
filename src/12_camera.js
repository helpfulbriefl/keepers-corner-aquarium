/* =====================================================================
   15. CAMERA: fit the view into the free screen area between the credit badge and the dock
   ===================================================================== */
const VIEWS = { room: { dir: V3(-0.34, 0.3, 1).normalize(), pad: 14 }, reef: { dir: V3(-0.2, 0.13, 1).normalize(), pad: 8 } };
const fitCam = new THREE.PerspectiveCamera();
const CAMT = { active: false, t: 0, dur: 1.4, p0: V3(), p1: V3(), t0: V3(), t1: V3() };
function boxCorners(b, out) { for (let i = 0; i < 8; i++) out.push(V3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z)); return out; }
function viewPoints(view) {
  const pts = [];
  if (view === 'reef') { boxCorners(new THREE.Box3(V3(TANK.x0 - 0.05, TANK.y0 - 0.1, TANK.z0), V3(TANK.x1 + 0.05, TANK.rim + 0.05, TANK.z1)), pts); return pts; }
  for (const o of [tank, cabinet, room.userData.window, wallClock, milo, deskLamp, room.getObjectByName('net'), room.getObjectByName('stool'), room.getObjectByName('mug'), room.getObjectByName('framed-plate')]) if (o) boxCorners(boxesCache.get(o) || boxesCache.set(o, boundsOf(o)).get(o), pts);
  boxCorners(new THREE.Box3(V3(-6.6, FLOOR_Y, 2.9), V3(6.6, FLOOR_Y + 0.01, 3.9)), pts);           // front floor edge
  return pts;
}
const boxesCache = new Map();
function safeRect(padPx) {
  const w = window.innerWidth, h = window.innerHeight;
  const badge = document.getElementById('credit-badge').getBoundingClientRect();
  const dock = document.getElementById('dock'); const dockTop = S.uiHidden ? h - 8 : dock.getBoundingClientRect().top;
  const top = badge.bottom + padPx, bottom = dockTop - padPx, left = padPx, right = w - padPx;
  return { l: left / w * 2 - 1, r: right / w * 2 - 1, t: 1 - top / h * 2, b: 1 - bottom / h * 2 };
}
function fitView(view) {
  const V = VIEWS[view], pts = viewPoints(view), sr = safeRect(V.pad);
  fitCam.fov = camera.fov; fitCam.aspect = camera.aspect; fitCam.near = camera.near; fitCam.far = camera.far; fitCam.updateProjectionMatrix();
  const target = V3(); pts.forEach(p => target.add(p)); target.divideScalar(pts.length);
  const proj = (dist) => {
    fitCam.position.copy(target).addScaledVector(V.dir, dist); fitCam.lookAt(target); fitCam.updateMatrixWorld(true);
    let l = 9, r = -9, b = 9, t = -9, behind = false;
    for (const p of pts) { _v1.copy(p).applyMatrix4(fitCam.matrixWorldInverse); if (_v1.z > -0.05) behind = true; _v1.applyMatrix4(fitCam.projectionMatrix); l = Math.min(l, _v1.x); r = Math.max(r, _v1.x); b = Math.min(b, _v1.y); t = Math.max(t, _v1.y); }
    return { l, r, b, t, behind };
  };
  let dist = 20;
  for (let it = 0; it < 5; it++) {
    let lo = 1, hi = 200;
    for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2, q = proj(mid); const fits = !q.behind && (q.r - q.l) <= (sr.r - sr.l) && (q.t - q.b) <= (sr.t - sr.b); if (fits) hi = mid; else lo = mid; }
    dist = hi; const q = proj(dist);
    const dx = (q.l + q.r) / 2 - (sr.l + sr.r) / 2, dy = (q.b + q.t) / 2 - (sr.b + sr.t) / 2;
    const halfH = Math.tan(THREE.MathUtils.degToRad(fitCam.fov / 2)) * dist, halfW = halfH * fitCam.aspect;
    const right = _v2.setFromMatrixColumn(fitCam.matrixWorld, 0), up = _v3.setFromMatrixColumn(fitCam.matrixWorld, 1);
    target.addScaledVector(right, dx * halfW).addScaledVector(up, dy * halfH);
  }
  return { pos: target.clone().addScaledVector(V.dir, dist), target, dist };
}
function goView(view, animate = true) {
  const f = fitView(view); controls.maxDistance = Math.max(70, f.dist * 1.6);
  if (!animate || S.reduceMotion) { camera.position.copy(f.pos); controls.target.copy(f.target); CAMT.active = false; controls.update(); return; }
  CAMT.p0.copy(camera.position); CAMT.t0.copy(controls.target); CAMT.p1.copy(f.pos); CAMT.t1.copy(f.target); CAMT.t = 0; CAMT.active = true; controls.enabled = false;
}
function updateCamera(dt) {
  if (CAMT.active) {
    CAMT.t = Math.min(1, CAMT.t + dt / CAMT.dur); const k = CAMT.t * CAMT.t * (3 - 2 * CAMT.t);
    controls.target.lerpVectors(CAMT.t0, CAMT.t1, k); camera.position.lerpVectors(CAMT.p0, CAMT.p1, k);
    camera.position.y += Math.sin(Math.PI * k) * 0.25;
    if (CAMT.t >= 1) { CAMT.active = false; controls.enabled = true; }
  } else if (!S.paused && !S.reduceMotion && !S.dragging && S.real - S.lastInteract > 8) {
    _v1.subVectors(camera.position, controls.target).applyAxisAngle(UP, Math.sin(S.real * 0.07) * 0.012 * dt); camera.position.copy(controls.target).add(_v1);
  }
}
controls.addEventListener('start', () => { S.dragging = true; S.lastInteract = S.real; });   // S.userMoved is set by real drags / wheel (see interaction)
controls.addEventListener('end', () => { S.dragging = false; S.lastInteract = S.real; });
