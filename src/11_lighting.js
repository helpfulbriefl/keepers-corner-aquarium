/* =====================================================================
   14. LIGHTING (r155+ physical units: point/spot intensities in candela, decay = 2) + DAY/NIGHT
   ===================================================================== */
const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x3b2a1e, 0.9); scene.add(hemi);
const amb = new THREE.AmbientLight(0x8090a0, 0.22); scene.add(amb);
const key = new THREE.DirectionalLight(0xfff0dc, 1.5); key.position.set(-8, 10, 8); key.target.position.set(0, -2.5, 0);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -11, right: 11, top: 9, bottom: -8, near: 1, far: 40 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const tankSpot = new THREE.SpotLight(0xfff3df, 72, 0, 0.95, 0.6, 2); tankSpot.position.set(0, 2.5, 0.1); tankSpot.target.position.set(0, -2, 0.1);
tankSpot.castShadow = true; tankSpot.shadow.mapSize.set(1024, 1024); tankSpot.shadow.camera.near = 0.3; tankSpot.shadow.camera.far = 7; tankSpot.shadow.bias = -0.0006;
scene.add(tankSpot, tankSpot.target);
const frontFill = new THREE.PointLight(0xdfeeff, 7, 0, 2); frontFill.position.set(-1.5, 1.2, 5.5); scene.add(frontFill);
const cyanAcc = new THREE.PointLight(0x5fd8ff, 1.6, 4.5, 2); cyanAcc.position.set(-2.8, 0.6, -1.2); scene.add(cyanAcc);
const violetAcc = new THREE.PointLight(0xb46cff, 0, 2.6, 2); violetAcc.position.set(-1.05, -0.7, 0.6); scene.add(violetAcc);
const roomWarm = new THREE.PointLight(0xffd2a0, 3, 0, 2); roomWarm.position.set(5.5, 1.5, 4.5); scene.add(roomWarm);
scene.background = new THREE.Color(0x191b1f);
const DN = {   // [day, night]
  hemi: [0.9, 0.22], amb: [0.22, 0.08], key: [1.5, 0.55], tank: [72, 13], fill: [7, 0.7], cyan: [1.6, 0.55], violet: [0, 2.6], warm: [3, 0.45], desk: [22, 30], glow: [0.9, 1.4],
  exposure: [1.08, 1.0], fog: [0.12, 0.27], caus: [1, 0.3],
  hemiSky: [col(0xcfe0ff), col(0x5a6f9a)], hemiGround: [col(0x3b2a1e), col(0x17120e)], keyCol: [col(0xfff0dc), col(0x9fb6ff)], tankCol: [col(0xfff3df), col(0x6f98ff)],
  water: [col(0x1d6a86), col(0x061d38)], bg: [col(0x191b1f), col(0x05070c)], strip: [col(0xfff2d8), col(0x6f9dff)],
};
function applyDayNight() {
  const n = S.night, L = (k) => lerp(DN[k][0], DN[k][1], n), C = (k, target) => target.copy(DN[k][0]).lerp(DN[k][1], n);
  hemi.intensity = L('hemi'); amb.intensity = L('amb'); key.intensity = L('key'); tankSpot.intensity = L('tank'); frontFill.intensity = L('fill');
  cyanAcc.intensity = L('cyan'); violetAcc.intensity = L('violet'); roomWarm.intensity = L('warm');
  deskLamp.userData.spot.intensity = L('desk'); deskLamp.userData.glow.intensity = L('glow');
  renderer.toneMappingExposure = L('exposure'); U.fogDen.value = L('fog'); U.caus.value = L('caus'); U.night.value = n;
  C('hemiSky', hemi.color); C('hemiGround', hemi.groundColor); C('keyCol', key.color); C('tankCol', tankSpot.color); C('water', U.waterCol.value); C('bg', scene.background);
  C('strip', tankLamp.userData.strip.material.color);
  key.position.set(lerp(-8, -9, n), lerp(10, 8, n), lerp(8, 3, n));      // moonlight comes more from the window side
}
function updateDayNight(dt) { const prev = S.night; S.night = damp(S.night, S.nightTarget, 2.2, dt); if (Math.abs(S.night - S.nightTarget) < 0.001) S.night = S.nightTarget; if (S.night !== prev || !applyDayNight.done) { applyDayNight(); applyDayNight.done = true; } }
