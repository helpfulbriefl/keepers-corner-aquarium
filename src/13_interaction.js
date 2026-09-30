/* =====================================================================
   16. INTERACTION — picking, click vs drag vs double-click, hover tips, keyboard, dock buttons
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const UI = { feed: $('b-feed'), night: $('b-night'), pause: $('b-pause'), view: $('b-view'), reset: $('b-reset'), hide: $('b-hide'),
  show: $('showui'), hint: $('hint'), tip: $('tip'), toast: $('toast'), dock: $('dock'), canvas: renderer.domElement };
let toastTimer = 0;
function toast(msg, ms = 2000) {
  UI.toast.textContent = msg; UI.toast.classList.add('on'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => UI.toast.classList.remove('on'), ms);
}
function layout() {                                   // keep hint + toast just above the dock (dock height varies with wrapping)
  const h = window.innerHeight, above = S.uiHidden ? 16 : Math.round(h - UI.dock.getBoundingClientRect().top + 10);
  UI.hint.style.bottom = above + 'px'; UI.toast.style.bottom = (above + (UI.hint.classList.contains('gone') ? 0 : 46)) + 'px';
}
if (window.matchMedia && matchMedia('(pointer: coarse)').matches) UI.hint.textContent = 'Drag to explore • Pinch to zoom • Double-tap the water to feed • Tap the cat and the room objects';
setTimeout(() => { UI.hint.classList.add('gone'); layout(); }, 7000);

/* ---------- picking ---------- */
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
raycaster.params.Line.threshold = 0.004; raycaster.params.Points.threshold = 0.01;   // whiskers / netting must not swallow clicks
const PICK_LIST = [...pickables, ...blockers];
const UNDERWATER = new Set(['chest', 'duck']);          // the glass lets clicks through to these
const DELAYED = new Set(['glass', 'water', 'chest', 'duck']);   // wait for a possible double-click (= feed)
const INBOX = new THREE.Box3(V3(IN.x0, IN.y0, IN.z0), V3(IN.x1, TANK.waterY, IN.z1));
function setRay(cx, cy) {
  const r = UI.canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
}
function pickAt(cx, cy) {
  setRay(cx, cy);
  const hits = raycaster.intersectObjects(PICK_LIST, true); let glass = null;
  for (const h of hits) {
    const a = h.object.userData.action;
    if (!a && !h.object.isMesh) continue;              // lines/points without an action never block
    if (a === 'glass') { if (!glass) glass = h; continue; }
    if (a === 'water') return { action: glass ? 'glass' : 'water', hit: glass || h };
    if (a && UNDERWATER.has(a)) return { action: a, hit: h, label: h.object.userData.label };
    if (a && !glass) return { action: a, hit: h, label: h.object.userData.label };
    break;                                             // an opaque blocker (or a room object seen through the glass)
  }
  return glass ? { action: 'glass', hit: glass } : null;
}
const _tpA = V3(), _tpB = V3(), _tpOut = V3(), _tpRay = new THREE.Ray();
function tankPoint(out) {                              // middle of the ray segment inside the water volume (for feeding)
  const r = raycaster.ray, a = r.intersectBox(INBOX, _tpA); if (!a) return null;
  _tpRay.origin.copy(r.origin).addScaledVector(r.direction, 200); _tpRay.direction.copy(r.direction).negate();
  const b = _tpRay.intersectBox(INBOX, _tpB); if (!b) return out.copy(a);
  return out.copy(a).add(b).multiplyScalar(0.5);
}
const LABELS = { glass: 'Tap the glass · double-click to feed', water: 'Click the water to feed' };

/* ---------- actions ---------- */
function resumeForAction() { if (S.paused) setPaused(false); }
function feedNow(x, z, src) {
  resumeForAction();
  if (feedAt(x, z)) { toast(src === 'jar' ? 'A pinch from the jar…' : 'Food is drifting down'); return true; }
  toast('Still eating — try again in a moment'); return false;
}
function runAction(p, cx, cy) {
  S.lastInteract = S.real;
  switch (p.action) {
    case 'water': feedNow(p.hit.point.x, p.hit.point.z); break;
    case 'glass': {
      if (S.real < S.tapCooldownUntil) return;
      resumeForAction(); S.tapCooldownUntil = S.real + 1.2;
      const n = p.hit.object.userData.normal; glassRing(p.hit.point, n);
      const inner = _v3.copy(p.hit.point).addScaledVector(n, -TANK.g); const k = scareFish(inner, n);
      if (k) toast(k > 1 ? 'Tap! The fish dart away' : 'Tap! A fish darts away', 1300); break;
    }
    case 'chest': resumeForAction(); if (openChest(true)) toast('The lid creaks open…', 1500); break;
    case 'duck': resumeForAction(); if (duck.userData.anim < 0) { duck.userData.anim = 0; toast('Squeak? (a stowaway duck)', 1600); } break;
    case 'door': resumeForAction(); DOOR.target = DOOR.target > 0.5 ? 0 : 1; break;
    case 'notebook': resumeForAction(); if (NB.t >= 1) { NB.from = NB.ang; NB.to = NB.ang > 1.5 ? 0 : Math.PI * 0.94; NB.t = 0; } break;
    case 'lamp': setNight(S.nightTarget < 0.5); break;
    case 'jar':
      resumeForAction();
      if (JAR.t >= 0) break;
      if (S.real < S.feedCooldownUntil) { toast('Still eating — try again in a moment'); break; }
      JAR.t = 0; JAR.fed = false; toast('A pinch from the jar…'); break;
    case 'milo': resumeForAction(); if (!startPaw(true)) toast('Milo is busy', 1200); else toast('Milo has opinions about fish', 1500); break;
  }
}
/* ---------- pointer: 6 px drag threshold, single vs double click ---------- */
const PT = { down: false, id: -1, x: 0, y: 0, moved: false, active: new Set(), pend: null, lastHover: 0 };
UI.canvas.addEventListener('pointerdown', (e) => {
  PT.active.add(e.pointerId);
  if (e.button !== 0 || PT.active.size > 1) { PT.down = false; return; }
  PT.down = true; PT.id = e.pointerId; PT.x = e.clientX; PT.y = e.clientY; PT.moved = false; hideTip();
});
UI.canvas.addEventListener('pointermove', (e) => {
  if (PT.down && e.pointerId === PT.id && !PT.moved && Math.hypot(e.clientX - PT.x, e.clientY - PT.y) > 6) { PT.moved = true; S.userMoved = true; S.lastInteract = S.real; }
  if (!PT.down && e.pointerType === 'mouse') hover(e);
});
const endPointer = (e) => {
  PT.active.delete(e.pointerId);
  if (!PT.down || e.pointerId !== PT.id) return; PT.down = false;
  if (e.type !== 'pointerup' || PT.moved) return;
  onTap(e.clientX, e.clientY);
};
UI.canvas.addEventListener('pointerup', endPointer); UI.canvas.addEventListener('pointercancel', endPointer);
UI.canvas.addEventListener('pointerleave', () => hideTip());
UI.canvas.addEventListener('wheel', () => { S.userMoved = true; S.lastInteract = S.real; }, { passive: true });
function onTap(cx, cy) {
  if (!UI.hint.classList.contains('gone')) { UI.hint.classList.add('gone'); layout(); }
  const now = performance.now(), P = PT.pend;
  if (P && now - P.time < 330 && Math.hypot(cx - P.x, cy - P.y) < 26) {           // double click / double tap
    clearTimeout(P.timer); PT.pend = null; setRay(cx, cy);
    const q = tankPoint(_tpOut); if (q) feedNow(q.x, q.z); else runAction(P.p, cx, cy);
    return;
  }
  const p = pickAt(cx, cy); if (!p) { if (P) { clearTimeout(P.timer); PT.pend = null; } return; }
  if (DELAYED.has(p.action)) {
    if (P) clearTimeout(P.timer);
    PT.pend = { p, x: cx, y: cy, time: now, timer: setTimeout(() => { PT.pend = null; runAction(p, cx, cy); }, 280) };
    return;
  }
  runAction(p, cx, cy);
}
/* ---------- hover tip + cursor (mouse only, throttled) ---------- */
function hideTip() { UI.tip.classList.remove('on'); UI.canvas.style.cursor = ''; }
function hover(e) {
  const now = performance.now(); if (now - PT.lastHover < 60) return; PT.lastHover = now;
  const p = pickAt(e.clientX, e.clientY);
  if (!p) { hideTip(); return; }
  const label = LABELS[p.action] || p.label || ''; UI.canvas.style.cursor = 'pointer';
  if (!label) { UI.tip.classList.remove('on'); return; }
  UI.tip.textContent = label; UI.tip.classList.add('on');
  const w = UI.tip.offsetWidth, x = clamp(e.clientX + 14, 8, window.innerWidth - w - 8), y = clamp(e.clientY + 18, 8, window.innerHeight - 40);
  UI.tip.style.left = x + 'px'; UI.tip.style.top = y + 'px';
}
/* ---------- dock buttons + keyboard ---------- */
function setLabel(btn, text) { btn.firstChild.nodeValue = text; }
function setNight(on) { S.nightTarget = on ? 1 : 0; UI.night.setAttribute('aria-pressed', String(on)); toast(on ? 'Night — the fish settle into the anemone' : 'Morning light', 1600); }
function setPaused(p) { S.paused = p; UI.pause.setAttribute('aria-pressed', String(p)); setLabel(UI.pause, p ? 'Resume' : 'Pause'); }
function setUIHidden(h) {
  S.uiHidden = h; document.body.classList.toggle('ui-hidden', h); hideTip();
  if (h && UI.dock.contains(document.activeElement)) UI.show.focus(); else if (!h && document.activeElement === UI.show) UI.hide.focus();
  layout(); if (!S.userMoved) goView(S.view, true);
}
function updateViewLabel() { setLabel(UI.view, S.view === 'room' ? 'Reef view' : 'Room view'); }
function toggleView() { S.view = S.view === 'room' ? 'reef' : 'room'; S.userMoved = false; updateViewLabel(); goView(S.view, true); }
function resetCamera() { S.view = 'room'; S.userMoved = false; updateViewLabel(); goView('room', true); }
function feedButton() { feedNow(rr(-1.8, 1.8), rr(-0.1, 0.7)); }
UI.feed.addEventListener('click', feedButton);
UI.night.addEventListener('click', () => setNight(S.nightTarget < 0.5));
UI.pause.addEventListener('click', () => setPaused(!S.paused));
UI.view.addEventListener('click', toggleView);
UI.reset.addEventListener('click', resetCamera);
UI.hide.addEventListener('click', () => setUIHidden(true));
UI.show.addEventListener('click', () => setUIHidden(false));
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const onButton = t && t.tagName === 'BUTTON';
  switch (e.key.toLowerCase()) {
    case 'f': feedButton(); break;
    case 'n': setNight(S.nightTarget < 0.5); break;
    case ' ': if (onButton) return; e.preventDefault(); setPaused(!S.paused); break;
    case 'c': toggleView(); break;
    case 'r': resetCamera(); break;
    case 'h': setUIHidden(!S.uiHidden); break;
    default: return;
  }
});
