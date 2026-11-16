/* =====================================================================
   Page d'accueil : « le quartier des labs », scène 3D interactive.
   Intégrée en ligne dans index.html par _build_site.py (fonctionne aussi en file://).

   Rendu : éclairage d'environnement, ombres douces, halo lumineux (bloom),
   ciel et lumière qui suivent l'heure (jour, crépuscule, nuit étoilée).
   Interaction : glisser pour tourner, cliquer un bâtiment ou son étiquette pour
   un gros plan et la présentation du lab, curseur d'heure avec valeurs physiques.

   Une station par lab :
     R1-10 réseaux    : château d'eau, fouille ouverte, conduites, pompe, vanne, eau qui circule
     R2-9  parois     : maison en coupe (plâtre / isolant / béton), dégradé de température, chaleur
     R3-10 énergétique: pompe à chaleur, étiquette DPE
     R4-8  été, air, son : soleil, brise-soleil, photovoltaïque, ventilation, ondes sonores
     R1-13 métrologie : presse d'essai, éprouvettes, cadran
     R1-1  tableur    : bungalow de chantier, écran de suivi (tableur animé), grue
   Repli : l'illustration SVG reste affichée si WebGL est absent.
   ===================================================================== */
const host = document.querySelector("[data-hero3d]");
if (host) boot();

async function boot() {
  let THREE;
  try { THREE = await import("three"); } catch (_) { return; }
  const X = {};
  try {
    const A = "three/addons/";
    const m = await Promise.all([
      import(A + "controls/OrbitControls.js"), import(A + "postprocessing/EffectComposer.js"), import(A + "postprocessing/RenderPass.js"),
      import(A + "postprocessing/UnrealBloomPass.js"), import(A + "postprocessing/OutputPass.js"), import(A + "environments/RoomEnvironment.js"),
      import(A + "geometries/RoundedBoxGeometry.js"),
    ]);
    m.forEach((x) => Object.assign(X, x));
  } catch (_) { /* sans les compléments : rendu simple */ }
  try { start(THREE, X); } catch (e) { console.warn("hero3d", e); host.classList.remove("has3d"); }
}

function start(THREE, X) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const NB = JSON.parse(host.dataset.labs || "{}");
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const fr = (x, n = 1) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });

  /* ---------- rendu ---------- */
  const canvas = el("canvas", "hero3d");
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.92;
  r.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(canvas);
  host.classList.add("has3d");
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  if (X.RoomEnvironment) { const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(new X.RoomEnvironment(), 0.04).texture; }
  let composer = null;
  if (X.EffectComposer && X.UnrealBloomPass && X.OutputPass) {
    composer = new X.EffectComposer(r, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new X.RenderPass(sc, cam));
    composer.addPass(new X.UnrealBloomPass(new THREE.Vector2(256, 256), 0.34, 0.6, 1.0));
    composer.addPass(new X.OutputPass());
  }

  /* ---------- matériaux et formes ---------- */
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.72, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.op != null, opacity: o.op ?? 1, depthWrite: o.dw ?? true, envMapIntensity: o.env ?? 0.6 });
  const sh = (m, cast = true) => { m.traverse((x) => { if (x.isMesh) { x.castShadow = cast; x.receiveShadow = true; } }); return m; };
  const box = (w, h, d, mat, rad = 0) => sh(new THREE.Mesh(rad > 0 && X.RoundedBoxGeometry ? new X.RoundedBoxGeometry(w, h, d, 3, Math.min(rad, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), mat));
  const cyl = (rt, rb, h, mat, seg = 24) => sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat));
  const ball = (rad, mat, seg = 20) => sh(new THREE.Mesh(new THREE.SphereGeometry(rad, seg, seg), mat));
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const W = new THREE.Group();
  sc.add(W);
  const C = { r110: "#41c7e4", r29: "#ff8a4c", r310: "#ff5d8f", r48: "#f0c674", r113: "#b38cff", r11: "#3ecf8e" };
  const HREF = { r110: "r1-10", r29: "r2-9", r310: "r3-10", r48: "r4-8", r113: "r1-13", r11: "r1-1" };

  /* ---------- ciel, astres, lumières ---------- */
  const skyU = { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 bot; varying vec3 vP;\nvoid main(){ float y = normalize(vP).y; gl_FragColor = vec4(mix(bot, top, smoothstep(-0.62, 0.02, y)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
  })));
  const hemi = new THREE.HemisphereLight(0xdcefff, 0x4a5a3a, 1);
  sc.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 90 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  sc.add(sun);
  const fill = new THREE.DirectionalLight(0x9fc4ff, 0.35);
  fill.position.set(-10, 8, 14);
  sc.add(fill);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.6, 1.4) }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.9, 3.6) }));
  sc.add(sunBall, moon);
  const starG = new THREE.BufferGeometry();
  starG.setAttribute("position", new THREE.Float32BufferAttribute(Array.from({ length: 420 * 3 }, (_, i) => (i % 3 === 0 ? (Math.random() - 0.5) * 190 : i % 3 === 1 ? -18 + Math.random() * 62 : -60 - Math.random() * 30)), 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false }));
  sc.add(stars);

  /* ---------- le terrain : île-maquette avec une fouille ouverte à l'avant ---------- */
  const GX = 25, ZB = -7.6, ZC = 4.3, ZF = 7.9, DZ = ZC - ZB, ZM = (ZC + ZB) / 2;
  W.add(at(box(GX, 0.45, DZ, M(0x74b96c, { r: 0.95 }), 0.12), 0, -0.225, ZM));
  W.add(at(box(GX - 0.06, 2.1, DZ - 0.06, M(0x8d6747, { r: 1 })), 0, -1.45, ZM));
  W.add(at(box(GX - 0.06, 1.0, ZF - ZC, M(0x7d5a3e, { r: 1 })), 0, -2.0, (ZF + ZC) / 2));
  W.add(at(box(GX - 0.06, 0.07, ZF - ZC - 0.1, M(0xd0b183, { r: 1 })), 0, -1.47, (ZF + ZC) / 2));        // lit de sable
  W.add(at(box(GX - 0.04, 0.2, 0.05, M(0x55402f, { r: 1 })), 0, -0.55, ZC));                              // terre végétale
  W.add(at(box(GX - 0.04, 0.16, 0.05, M(0xb09a7c, { r: 1 })), 0, -0.9, ZC));                              // grave
  // rue, trottoirs, marquage, allée
  W.add(at(box(GX, 0.05, 2.0, M(0x3f4756, { r: 0.9 })), 0, 0.02, 2.5));
  W.add(at(box(GX, 0.09, 0.45, M(0xc4bdb0, { r: 0.9 })), 0, 0.04, 1.28));
  W.add(at(box(GX, 0.09, 0.45, M(0xc4bdb0, { r: 0.9 })), 0, 0.04, 3.72));
  for (let i = -11; i <= 11; i += 2) W.add(at(box(0.9, 0.012, 0.1, M(0xf2ead6, { r: 0.8 })), i, 0.052, 2.5));
  W.add(at(box(1.0, 0.03, 1.6, M(0xcfc6b6, { r: 0.9 })), -0.6, 0.02, 0.3));
  // barrières de chantier le long de la fouille, cônes
  for (let i = 0; i < 12; i++) {
    const x = -11 + i * 2;
    W.add(at(box(0.07, 0.6, 0.07, M(0x5b6472)), x - 0.8, 0.3, 4.12), at(box(0.07, 0.6, 0.07, M(0x5b6472)), x + 0.8, 0.3, 4.12));
    for (let k = 0; k < 4; k++) W.add(at(box(0.4, 0.16, 0.04, M(k % 2 ? 0xf4f1ea : 0xf2701c, { e: k % 2 ? 0x000000 : 0xf2701c, ei: 0.25 })), x - 0.6 + k * 0.4, 0.45, 4.12));
  }
  [[-11.3, 0.9], [11.9, 0.9], [6.3, 0.95]].forEach(([x, z]) => W.add(at(sh(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), M(0xf2701c))), x, 0.21, z)));

  /* ---------- stations ---------- */
  const ST = {};
  const station = (id, code, name, tagAt, c, view, groups) => { ST[id] = { id, code, name, color: C[id], tagAt, c, view, groups }; };

  /* ===== maison passive en coupe : R2-9 (paroi) et R4-8 (soleil, air, son) ===== */
  const HX = -2.3, HZ = -2.7, hw = 6.2, hh = 3.0, hd = 4.3, y0 = 0.18;
  const H = grp(W, HX, 0, HZ);
  const wallM = M(0xf1ece2, { r: 0.85 });
  H.add(at(box(hw + 0.5, y0, hd + 0.5, M(0xb9b4aa, { r: 0.9 })), 0, y0 / 2, 0));
  H.add(at(box(hw, hh, 0.28, wallM), 0, y0 + hh / 2, -hd / 2 + 0.14));
  H.add(at(box(0.28, hh, hd, wallM), hw / 2 - 0.14, y0 + hh / 2, 0));
  H.add(at(box(hw / 2, hh, 0.28, wallM), hw / 4, y0 + hh / 2, hd / 2 - 0.14));
  H.add(at(box(hw - 0.3, 0.06, hd - 0.3, M(0xc79a63, { r: 0.6 })), 0, y0 + 0.03, 0));               // parquet
  H.add(at(box(1.8, 0.02, 1.2, M(0x8f3f4a, { r: 1 })), -0.6, y0 + 0.07, 0.3));                         // tapis
  H.add(at(box(1.5, 0.5, 0.65, M(0x4f7fa8, { r: 0.9 }), 0.1), -0.5, y0 + 0.31, -1.2));                 // canapé
  H.add(at(box(1.5, 0.45, 0.2, M(0x466f94, { r: 0.9 }), 0.08), -0.5, y0 + 0.7, -1.5));
  const radM = M(0xf5f5f5, { r: 0.4, e: 0xff5a2c, ei: 0.6 });
  H.add(at(box(1.1, 0.55, 0.12, radM), 1.5, y0 + 0.5, -hd / 2 + 0.36));                                 // radiateur
  const lampM2 = M(0xfff0c8, { e: 0xffc878, ei: 0.2 });
  H.add(at(ball(0.16, lampM2, 16), -1.6, y0 + 1.5, -1.3), at(cyl(0.02, 0.02, 1.4, M(0x444444), 6), -1.6, y0 + 0.75, -1.3));
  const inside = new THREE.PointLight(0xffb469, 0, 11, 1.7); H.add(at(inside, -0.4, 1.9, 0.2));
  // paroi gauche en coupe : plâtre | isolant | béton (épaisseurs exagérées) + dégradé de température sur la tranche
  const LAY = [{ t: 0.1, c: 0xf6f3ec }, { t: 0.42, c: 0xf4c245 }, { t: 0.36, c: 0x9da6b0 }], LT = 0.88;
  let lx = -hw / 2 + LT;
  LAY.forEach((L) => { lx -= L.t / 2; H.add(at(box(L.t, hh, hd, M(L.c, { r: 0.9 })), lx, y0 + hh / 2, 0)); lx -= L.t / 2; });
  const sg = new THREE.PlaneGeometry(LT, hh, 40, 1), sc0 = [], cHot = new THREE.Color(0xff4a2a), cMid = new THREE.Color(0xffd45a), cCold = new THREE.Color(0x2f9bff), tc = new THREE.Color();
  for (let i = 0; i < sg.attributes.position.count; i++) {
    const u = (sg.attributes.position.getX(i) + LT / 2) / LT, k = Math.pow(u, 0.6);
    tc.copy(cCold).lerp(cMid, Math.min(1, k * 1.7)).lerp(cHot, Math.max(0, k * 1.7 - 0.7)); sc0.push(tc.r * 1.25, tc.g * 1.25, tc.b * 1.25);
  }
  sg.setAttribute("color", new THREE.Float32BufferAttribute(sc0, 3));
  H.add(at(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true })), -hw / 2 + LT / 2, y0 + hh / 2, hd / 2 + 0.008));
  // pignons et toit
  const pitch = 0.44, span = hw + 0.9, rise = Math.tan(pitch) * hw / 2;
  const gab = new THREE.Shape(); gab.moveTo(-hw / 2, 0); gab.lineTo(hw / 2, 0); gab.lineTo(0, rise); gab.closePath();
  [-hd / 2, hd / 2 - 0.28].forEach((z) => H.add(at(sh(new THREE.Mesh(new THREE.ExtrudeGeometry(gab, { depth: 0.28, bevelEnabled: false }), wallM)), 0, y0 + hh, z)));
  const roofM = M(0x4d5868, { r: 0.55, m: 0.1 }), pvM = M(0x17306e, { r: 0.18, m: 0.6, e: 0x1c4fd0, ei: 0.2, env: 1.2 });
  [-1, 1].forEach((s) => {
    const p = at(box(span / 2 / Math.cos(pitch), 0.14, hd + 0.9, roofM, 0.04), s * span / 4, y0 + hh + Math.tan(pitch) * span / 4 + 0.04, 0);
    p.rotation.z = -s * pitch; H.add(p);
    if (s > 0) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p.add(at(box(0.86, 0.05, 1.5, pvM), (i - 1) * 0.94 - 0.1, 0.1, (j - 0.5) * 1.65));
    else p.add(at(box(0.34, 0.6, 0.34, M(0x9aa5b4, { m: 0.5, r: 0.4 })), 0.3, 0.3, -0.9));                // bouche de ventilation
  });
  // baies : vitrage sud avec brise-soleil, fenêtre est, porte
  const glass = M(0xa9dcff, { r: 0.05, m: 0.2, op: 0.55, e: 0xffb561, ei: 0, env: 1.5 });
  H.add(at(box(1.6, 1.25, 0.06, glass), 1.75, y0 + 1.75, hd / 2 + 0.01));
  H.add(at(box(1.75, 0.08, 0.1, M(0x5b6472)), 1.75, y0 + 1.08, hd / 2 + 0.03), at(box(1.75, 0.08, 0.1, M(0x5b6472)), 1.75, y0 + 2.42, hd / 2 + 0.03));
  for (let i = 0; i < 5; i++) { const l = at(box(1.85, 0.04, 0.34, M(0xd5dbe2, { m: 0.6, r: 0.3, env: 1.2 })), 1.75, y0 + 2.5 - i * 0.2, hd / 2 + 0.42); l.rotation.x = 0.55; H.add(l); }
  H.add(at(box(0.06, 1.2, 1.5, glass), hw / 2 + 0.01, y0 + 1.7, -0.2));
  H.add(at(box(0.85, 1.9, 0.07, M(0x7a4e2f, { r: 0.7 })), 0.25, y0 + 0.95, hd / 2 + 0.01));
  station("r29", "R2-9", "Parois et isolation", V(HX - hw / 2 + 0.2, 4.1, HZ + hd / 2), V(HX - hw / 2 + 0.6, 1.6, HZ + hd / 2), { dir: [-0.45, 0.32, 1], dist: 12.5 }, [H]);
  station("r48", "R4-8", "Confort d’été, air, son", V(HX + 1.9, 5.6, HZ + 0.2), V(HX + 1.2, 2.6, HZ + 0.8), { dir: [0.55, 0.5, 1], dist: 15 }, [H]);

  /* ===== R3-10 : pompe à chaleur + étiquette DPE ===== */
  const E = grp(W, 2.0, 0, -1.3);
  const pac = grp(E, 0, 0, 0);
  pac.add(at(box(1.25, 0.9, 0.55, M(0xf4f4f4, { r: 0.4 }), 0.06), 0, 0.55, 0), at(box(1.35, 0.1, 0.65, M(0x8d95a1)), 0, 0.05, 0));
  pac.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 36), M(0x3d4654, { m: 0.6 }))), 0.12, 0.55, 0.29));
  const fan = grp(pac, 0.12, 0.55, 0.29);
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI / 2; g.add(at(box(0.1, 0.27, 0.02, M(0x596273, { m: 0.5 })), 0, 0.15, 0)); fan.add(g); }
  pac.add(at(cyl(0.035, 0.035, 0.8, M(0xb87333, { m: 0.8, r: 0.3 }), 8), -0.5, 1.1, -0.2));
  const dpe = grp(E, 1.9, 0, 1.3);
  dpe.rotation.y = -0.25;
  dpe.add(at(box(0.08, 2.5, 0.08, M(0x5b6472, { m: 0.4 })), -0.1, 1.25, -0.06), at(box(1.75, 1.7, 0.06, M(0xffffff, { r: 0.6 }), 0.04), 0.65, 1.65, -0.05));
  const dCols = [0x00a06d, 0x52b153, 0xa5cc74, 0xf4e70f, 0xf0b40f, 0xeb8235, 0xd7221f];
  dCols.forEach((c, i) => dpe.add(at(box(0.5 + i * 0.13, 0.17, 0.05, M(c, { e: c, ei: 0.35, r: 0.5 })), 0.12 + (0.5 + i * 0.13) / 2, 2.32 - i * 0.215, 0)));
  const dArrow = sh(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 3), M(0x1c2330))); dArrow.rotation.z = Math.PI / 2; dpe.add(at(dArrow, 1.38, 2.32, 0.02));
  station("r310", "R3-10", "Énergétique, DPE, PAC", V(3.9, 3.3, 0.0), V(3.1, 1.2, -0.4), { dir: [0.5, 0.35, 1], dist: 10.5 }, [E]);

  /* ===== R1-10 : château d'eau, fouille, conduites, pompe, vanne ===== */
  const TX = -9.4, TZ = -4.7;
  const T = grp(W, TX, 0, TZ);
  [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) => { const l = at(cyl(0.07, 0.1, 3.7, M(0x93a0b3, { m: 0.6, r: 0.35 }), 8), x * 1.15, 1.85, z * 1.15); l.rotation.z = -x * 0.1; l.rotation.x = z * 0.1; T.add(l); });
  const brace = at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 6, 24), M(0x93a0b3, { m: 0.6 }))), 0, 1.6, 0); brace.rotation.x = Math.PI / 2; T.add(brace);
  const tank = at(cyl(1.05, 0.8, 1.5, M(0xbfe6f5, { r: 0.08, m: 0.1, op: 0.32, dw: false, env: 1.6 }), 36), 0, 4.45, 0); T.add(tank);
  const level = at(cyl(0.97, 0.76, 1, M(0x2fb4e6, { r: 0.1, e: 0x0a84c8, ei: 0.55, op: 0.85 }), 36), 0, 4.2, 0); level.castShadow = false; T.add(level);
  T.add(at(sh(new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.6, 36), M(0x3f6f93, { r: 0.5 }))), 0, 5.5, 0), at(cyl(0.12, 0.12, 3.7, M(0x2f8fd0, { r: 0.3, m: 0.3 }), 12), 0, 1.85, 0));
  station("r110", "R1-10", "Réseaux d’eau", V(TX, 6.5, TZ), V(-6.2, -0.1, 3.4), { dir: [-0.25, 0.42, 1], dist: 16 }, [T]);
  // conduites dans la fouille : tubes translucides (on voit l'eau circuler), brides, supports
  const N = grp(W, 0, 0, 0);
  const up = V(0, 1, 0);
  const pipe = (pts, rad, color, glassy) => {
    const mat = M(color, { r: 0.15, m: 0.2, op: glassy, dw: false, env: 1.4 }), fl = M(color, { r: 0.35, m: 0.5 });
    const path = new THREE.CurvePath();
    pts.forEach((p, i) => {
      N.add(at(ball(rad * 1.12, fl, 12), p.x, p.y, p.z));
      if (!i) return;
      const a = pts[i - 1], d = p.clone().sub(a), L = d.length();
      const c = cyl(rad, rad, L, mat, 14); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(up, d.clone().normalize()); N.add(c);
      for (let s = 1.5; s < L - 0.5; s += 2.5) {
        const f = cyl(rad * 1.35, rad * 1.35, 0.1, fl, 14); f.position.copy(a).addScaledVector(d, s / L); f.quaternion.copy(c.quaternion); N.add(f);
        if (Math.abs(d.y) < 0.01) { const hgt = a.y - rad + 1.44; N.add(at(box(0.3, hgt, 0.3, M(0xa9a39a, { r: 1 })), f.position.x, -1.44 + hgt / 2, f.position.z)); }
      }
      path.add(new THREE.LineCurve3(a, p));
    });
    return path;
  };
  const yW = -0.85, yU = -1.02;
  const cMain = pipe([V(TX, yW, ZC), V(TX, yW, 5.3), V(11.6, yW, 5.3)], 0.17, 0x55c8ff, 0.38);
  const cBranch = pipe([V(-1.0, yW, 5.3), V(-1.0, yW, ZC)], 0.13, 0x55c8ff, 0.38);
  const cWaste = pipe([V(-3.4, yU, ZC), V(-3.4, yU, 6.7), V(10.6, yU - 0.12, 6.7)], 0.22, 0xb98352, 0.5);
  N.add(at(cyl(0.5, 0.5, 1.3, M(0x8d95a1, { r: 0.9 }), 24), 10.9, -0.82, 6.7));                           // regard
  // pompe (roue qui tourne) et vanne (volant rouge)
  const pump = grp(N, -6.3, yW, 5.3);
  pump.add(at(box(0.9, 0.75, 0.75, M(0x4b6fae, { m: 0.4, r: 0.4 }), 0.08), 0, 0.02, 0), at(box(1.1, 0.12, 0.95, M(0x8d95a1)), 0, -0.52, 0));
  const motor = cyl(0.26, 0.26, 0.8, M(0x35507f, { m: 0.5, r: 0.4 }), 20); motor.rotation.x = Math.PI / 2; pump.add(at(motor, 0, 0.05, 0.72));
  const imp = grp(pump, 0, 0.05, 1.14);
  imp.add(sh(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 24), M(0xffc21a, { m: 0.5, e: 0xffa200, ei: 0.5 }))));
  for (let i = 0; i < 3; i++) { const b = box(0.06, 0.36, 0.04, M(0xffc21a, { e: 0xffa200, ei: 0.5 })); b.rotation.z = i * Math.PI / 3; imp.add(b); }
  const valve = grp(N, -3.6, yW, 5.3);
  valve.add(at(cyl(0.06, 0.06, 0.55, M(0xc8281e, { m: 0.4 }), 10), 0, 0.42, 0));
  const wheel = at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24), M(0xe23a2a, { m: 0.3, e: 0xc8281e, ei: 0.3 }))), 0, 0.7, 0); wheel.rotation.x = Math.PI / 2; valve.add(wheel);
  ST.r110.groups.push(N);

  /* ===== R1-13 : aire d'essais, presse et éprouvettes ===== */
  const P = grp(W, 9.0, 0, -0.9);
  P.rotation.y = -0.3;
  P.add(at(box(3.6, 0.12, 2.4, M(0xc9c4ba, { r: 0.9 }), 0.05), 0, 0.06, 0));
  const steel = M(0x39424f, { m: 0.6, r: 0.35 }), chrome = M(0xcfd6de, { m: 0.95, r: 0.15, env: 1.6 });
  P.add(at(box(1.7, 0.3, 1.2, steel, 0.05), -0.4, 0.27, 0), at(box(1.7, 0.34, 1.2, steel, 0.05), -0.4, 3.0, 0));
  [[-0.65, -0.4], [0.65, -0.4], [-0.65, 0.4], [0.65, 0.4]].forEach(([x, z]) => P.add(at(cyl(0.075, 0.075, 2.5, chrome, 14), -0.4 + x, 1.65, z)));
  const ram = at(box(0.95, 0.24, 0.95, chrome, 0.04), -0.4, 2.0, 0); P.add(ram);
  const ramRod = at(cyl(0.16, 0.16, 1, chrome, 16), -0.4, 2.5, 0); P.add(ramRod);
  const sampleM = M(0xb9bec4, { r: 0.95, e: 0xff3b1f, ei: 0 });
  const sample = at(cyl(0.3, 0.3, 1.0, sampleM, 28), -0.4, 0.92, 0); P.add(sample);
  const gauge = at(cyl(0.34, 0.34, 0.08, M(0xfafafa, { r: 0.4 }), 36), 0.62, 2.2, 0.64); gauge.rotation.x = Math.PI / 2; P.add(gauge);
  P.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 36), steel)), 0.62, 2.2, 0.68));
  const needle = grp(P, 0.62, 2.2, 0.7); needle.add(at(box(0.03, 0.26, 0.02, M(0xd7221f, { e: 0xd7221f, ei: 0.6 })), 0, 0.11, 0));
  for (let i = 0; i < 4; i++) P.add(at(cyl(0.2, 0.2, 0.66, M(i === 3 ? 0x8f969e : 0xb9bec4, { r: 0.95 }), 20), 0.85 + (i % 2) * 0.5, 0.45, -0.7 + Math.floor(i / 2) * 0.5));
  station("r113", "R1-13", "Mesures et incertitudes", V(8.8, 4.0, -0.9), V(8.8, 1.5, -0.9), { dir: [0.5, 0.42, 1], dist: 12.5 }, [P]);

  /* ===== R1-1 : bungalow de chantier, écran de suivi (tableur), grue ===== */
  const O = grp(W, 4.6, 0, -5.6);
  O.add(at(box(3.0, 1.3, 1.5, M(0xf4f4f4, { r: 0.6 }), 0.06), -0.4, 0.75, 0), at(box(3.1, 0.12, 1.6, M(0x3ecf8e, { r: 0.5 })), -0.4, 1.46, 0), at(box(3.0, 0.1, 1.5, M(0x6b7280)), -0.4, 0.05, 0));
  const oWin = M(0xa9dcff, { r: 0.05, op: 0.6, e: 0xffb561, ei: 0 });
  O.add(at(box(0.9, 0.55, 0.05, oWin), -0.9, 0.9, 0.76), at(box(0.6, 1.0, 0.05, M(0x5f6b7a)), 0.5, 0.62, 0.76));
  const scv = document.createElement("canvas"); scv.width = 384; scv.height = 240;
  const sx = scv.getContext("2d"), sTex = new THREE.CanvasTexture(scv); sTex.colorSpace = THREE.SRGBColorSpace;
  const screen = at(new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.88), new THREE.MeshBasicMaterial({ map: sTex, color: new THREE.Color(1.15, 1.15, 1.15) })), 2.9, 3.0, 0.3);
  O.add(screen, at(box(3.16, 2.04, 0.1, M(0x1c2330, { r: 0.4 }), 0.05), 2.9, 3.0, 0.24), at(box(0.1, 2.05, 0.1, M(0x5b6472)), 2.1, 1.02, 0.22), at(box(0.1, 2.05, 0.1, M(0x5b6472)), 3.7, 1.02, 0.22));
  const cells = Array.from({ length: 24 }, () => 0.25 + Math.random() * 0.6);
  function drawScreen(t) {
    sx.fillStyle = "#0e1a28"; sx.fillRect(0, 0, 384, 240);
    sx.fillStyle = "#3ecf8e"; sx.fillRect(0, 0, 384, 26);
    sx.fillStyle = "#06281a"; sx.font = "bold 15px monospace"; sx.fillText("Suivi de chantier.xlsx", 10, 18);
    const sel = Math.floor(t * 1.3) % 24;
    for (let i = 0; i < 24; i++) {
      const cx = 8 + (i % 4) * 46, cy = 34 + Math.floor(i / 4) * 33;
      sx.fillStyle = Math.floor(i / 4) === 0 ? "#1d3550" : "#14263a"; sx.fillRect(cx, cy, 43, 30);
      sx.fillStyle = i % 4 === 3 ? "#f0c674" : "#8fb0c8"; sx.fillRect(cx + 5, cy + 12, 33 * cells[i], 6);
      if (i === sel) { sx.strokeStyle = "#3ecf8e"; sx.lineWidth = 3; sx.strokeRect(cx + 1, cy + 1, 41, 28); }
    }
    for (let i = 0; i < 5; i++) {
      const hgt = 40 + 120 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.4));
      sx.fillStyle = ["#3ecf8e", "#41c7e4", "#f0c674", "#ff8a4c", "#b38cff"][i]; sx.fillRect(204 + i * 34, 222 - hgt, 24, hgt);
    }
    sx.strokeStyle = "#5f7890"; sx.lineWidth = 2; sx.beginPath(); sx.moveTo(198, 36); sx.lineTo(198, 223); sx.lineTo(378, 223); sx.stroke();
    sTex.needsUpdate = true;
  }
  drawScreen(0);
  // grue à tour
  const crane = grp(O, 6.3, 0, -0.9);
  const yel = M(0xffc21a, { r: 0.5, m: 0.2 });
  crane.add(at(box(1.3, 0.3, 1.3, M(0x8d95a1, { r: 0.9 })), 0, 0.15, 0), at(box(0.34, 6.6, 0.34, yel), 0, 3.5, 0));
  for (let i = 0; i < 7; i++) { const b = box(0.5, 0.05, 0.05, yel); b.rotation.z = i % 2 ? 0.7 : -0.7; crane.add(at(b, 0, 0.9 + i * 0.9, 0.18)); }
  const slew = grp(crane, 0, 6.9, 0);
  slew.add(at(box(7.4, 0.22, 0.26, yel), 2.6, 0.1, 0), at(box(0.5, 0.5, 0.5, M(0x5f6b7a)), -1.7, -0.1, 0), at(box(0.55, 0.55, 0.5, M(0xf4f4f4, { r: 0.5 }), 0.05), 0.35, -0.3, 0.3), at(box(0.2, 1.1, 0.2, yel), 0, 0.7, 0));
  const stay = (x) => { const a = V(0, 1.25, 0), b = V(x, 0.2, 0), d = b.clone().sub(a), c = cyl(0.018, 0.018, d.length(), M(0x3d4654), 6); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(up, d.normalize()); slew.add(c); };
  stay(4.6); stay(-1.6);
  const trolley = grp(slew, 4.4, -0.05, 0);
  const cable = cyl(0.015, 0.015, 1, M(0x2b313b), 6); trolley.add(cable);
  const load = at(box(0.7, 0.45, 0.7, M(0xc9c4ba, { r: 0.9 }), 0.03), 0, -3, 0); trolley.add(load);
  const beaconM = M(0xff3b30, { e: 0xff3b30, ei: 2 });
  slew.add(at(ball(0.09, beaconM, 10), 0, 1.3, 0));
  station("r11", "R1-1", "Tableur et données", V(7.5, 4.7, -5.3), V(6.6, 2.3, -5.2), { dir: [-0.6, 0.34, 1], dist: 13.5 }, [O]);

  /* ---------- décor vivant : arbres, lampadaires, voiture, nuages ---------- */
  const trees = [];
  const tree = (x, z, s = 1, pine = false) => {
    const t = grp(W, x, 0, z);
    t.add(at(cyl(0.07 * s, 0.11 * s, 0.7 * s, M(0x7a5236, { r: 0.9 }), 8), 0, 0.35 * s, 0));
    if (pine) for (let i = 0; i < 3; i++) t.add(at(sh(new THREE.Mesh(new THREE.ConeGeometry((0.62 - i * 0.15) * s, 0.75 * s, 9), M(0x3f8f5d, { r: 0.9 }))), 0, (0.85 + i * 0.45) * s, 0));
    else t.add(at(sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * s, 1), M(0x5aad62, { r: 0.9 }))), 0, 1.15 * s, 0), at(sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 1), M(0x6dbd6e, { r: 0.9 }))), 0.3 * s, 1.5 * s, 0.1 * s));
    trees.push(t);
  };
  [[-11.4, -6.4, 1.3, 1], [-6.6, -6.3, 1.1, 0], [-4.6, -6.6, 0.9, 1], [1.6, -6.4, 1.2, 0], [3.6, -6.5, 1.0, 1], [11.6, -1.6, 1.1, 0], [-11.5, -1.0, 1.0, 0], [-7.0, -0.4, 0.9, 1], [11.7, -3.4, 0.9, 1], [-11.0, -3.2, 0.8, 1]].forEach(([x, z, s, p]) => tree(x, z, s, !!p));
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const lampM = M(0xfff2cf, { e: 0xffc66a, ei: 0 }), pools = [];
  [-8.5, -0.2, 6.6].forEach((x) => {
    W.add(at(cyl(0.045, 0.06, 2.7, M(0x3d4654, { m: 0.5 }), 8), x, 1.35, 1.28), at(box(0.08, 0.05, 0.6, M(0x3d4654, { m: 0.5 })), x, 2.7, 1.55), at(box(0.3, 0.07, 0.16, lampM), x, 2.66, 1.85));
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc66a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; W.add(at(pool, x, 0.08, 2.2)); pools.push(pool);
  });
  const car = grp(W, -14, 0.05, 2.05);
  car.add(at(box(1.5, 0.42, 0.72, M(0xe0483a, { r: 0.35, m: 0.3, env: 1.2 }), 0.12), 0, 0.38, 0), at(box(0.8, 0.34, 0.64, M(0x1c2a3a, { r: 0.1, m: 0.4, env: 1.6 }), 0.1), -0.1, 0.72, 0));
  [[-0.48, 0.34], [0.48, 0.34], [-0.48, -0.34], [0.48, -0.34]].forEach(([x, z]) => { const w = cyl(0.17, 0.17, 0.12, M(0x15181d, { r: 0.9 }), 14); w.rotation.x = Math.PI / 2; car.add(at(w, x, 0.17, z)); });
  const headM = M(0xffffff, { e: 0xfff2c0, ei: 0 }); car.add(at(ball(0.07, headM, 8), 0.75, 0.4, 0.22), at(ball(0.07, headM, 8), 0.75, 0.4, -0.22));
  const clouds = [[-9, 7.4, -7, 1.0], [1, 8.2, -9, 1.2], [10, 7.6, -6, 0.9]].map(([x, y, z, s]) => {
    const c = grp(W, x, y, z), cm = M(0xffffff, { r: 1, op: 0.92, env: 0.3 });
    [[0, 0, 0, 1], [0.9, 0.1, 0.2, 0.75], [-0.9, 0.05, -0.1, 0.7], [0.3, 0.4, -0.2, 0.7]].forEach(([a, b, d, q]) => c.add(at(ball(q * s, cm, 12), a * s, b * s, d * s)));
    return c;
  });

  /* ---------- particules : chaleur, eau, eaux usées, air ---------- */
  const dots = (n, color, size) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.frustumCulled = false; W.add(p);
    return { p, n, s: Array.from({ length: n }, () => Math.random()), pos: g.attributes.position };
  };
  const heat = dots(220, new THREE.Color(2.4, 0.9, 0.3), 0.34), water = dots(110, new THREE.Color(0.7, 2.0, 2.8), 0.3), branch = dots(16, new THREE.Color(0.7, 2.0, 2.8), 0.26), waste = dots(60, new THREE.Color(1.8, 1.2, 0.7), 0.3), air = dots(70, new THREE.Color(1.6, 2.0, 2.3), 0.22);
  const hy = heat.s.map(() => y0 + 0.25 + Math.random() * (hh - 0.5)), hz = heat.s.map(() => (Math.random() - 0.5) * (hd - 0.5)), ar = air.s.map(() => Math.random() * 6.28);
  const rings = Array.from({ length: 3 }, (_, i) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.9, 0.9), transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(2.1, 0.07, -1.0); m.userData.o = i / 3; W.add(m); return m; });
  // socle lumineux et zone cliquable de chaque station (anneaux distincts pour R2-9 paroi gauche et R4-8 aile sud)
  const HITS = { r110: [[3.4, 7, 3.4], [TX, 3.2, TZ]], r29: [[2.6, 4.2, 4.6], [HX - hw / 2 + 0.6, 2.1, HZ]], r48: [[3.8, 5.2, 4.6], [HX + 1.3, 2.6, HZ]], r11: [[7.4, 5.4, 3], [6.2, 2.7, -5.6]], r113: [[3.6, 4, 2.8], [8.9, 2, -0.9]], r310: [[3.6, 3.6, 3.4], [3.0, 1.8, -0.5]] };
  const RING = { r110: [TX, TZ, 1.9], r29: [HX - hw / 2 + 0.65, HZ, 2.25], r48: [HX + 1.35, HZ + 0.25, 2.45], r11: [7.4, -5.4, 2.3], r113: [9.0, -0.9, 2.2], r310: [3.0, -0.5, 2.0] };
  const SHORT = { r110: "Eau", r29: "Parois", r310: "DPE", r48: "Été/Son", r113: "Essais", r11: "Tableur" };
  const ORDER = ["r110", "r29", "r48", "r310", "r113", "r11"];
  const labProg = (id) => {
    try {
      const snap = window.IUT_PROGRESS && window.IUT_PROGRESS.readAll ? window.IUT_PROGRESS.readAll() : null;
      return snap && snap.byLab ? snap.byLab[HREF[id]] : null;
    } catch (_) { return null; }
  };
  const hits = [];
  const hitBox = (id, dim, pos) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...dim), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); m.position.set(...pos); m.userData.id = id; W.add(m); hits.push(m); };
  Object.values(ST).forEach((s) => {
    const [rx, rz, rr] = RING[s.id];
    const m = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.16, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(s.color).multiplyScalar(2.2), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(rx, 0.085, rz); W.add(m); s.ring = m; s.hot = 0;
    hitBox(s.id, ...HITS[s.id]);
  });
  hitBox("r110", [GX, 1.6, ZF - ZC], [0, -0.7, (ZF + ZC) / 2]);

  /* ---------- interface : étiquettes, fiche du lab, barre d'heure ---------- */
  const INFO = {
    r110: ["Du château d’eau au robinet", "Pression, pertes de charge, pompe : vous réglez les diamètres et les débits, et l’eau du réseau réagit sous vos yeux.", ["Bernoulli", "pertes de charge", "pompe"]],
    r29: ["Ce qui traverse une paroi", "Chaleur et vapeur d’eau : vous changez les couches du mur et vous voyez le flux, les températures et le risque de condensation.", ["résistance thermique", "point de rosée", "ITI / ITE"]],
    r310: ["Le besoin d’énergie d’un logement", "Déperditions, DJU, DPE, pompe à chaleur : vous chiffrez un bâtiment, puis vous testez une rénovation.", ["déperditions", "DPE", "temps de retour"]],
    r48: ["Rester au frais, au calme", "Soleil, inertie, ventilation, acoustique : vous protégez un bâtiment de la surchauffe et du bruit.", ["apports solaires", "déphasage", "décibels"]],
    r113: ["Peut-on se fier à une mesure ?", "Une presse, des éprouvettes, des mesures qui se dispersent : vous décidez si un béton est conforme.", ["incertitudes", "type A / B", "conformité"]],
    r11: ["Un tableur sans pièges", "Formules, références, graphiques honnêtes : vous montez le suivi d’un chantier comme en bureau d’études.", ["références", "SI", "graphiques"]],
  };
  const ui = el("div", "h3-ui");
  host.append(ui);
  let hour = 10, playing = !reduce, hover = null, focused = null, cHover = null;
  const tags = Object.values(ST).map((s) => {
    const pr = labProg(s.id);
    const pTxt = pr && pr.started ? (pr.done === pr.total ? "✓" : `${pr.done}/${pr.total}`) : "";
    const b = el("button", "h3-tag off" + (pr && pr.done === pr.total ? " done" : ""), `<i></i><b>${s.code}</b><em class="h3-short">${SHORT[s.id] || ""}</em><span>${s.name}</span>${pTxt ? `<u class="h3-pbadge">${pTxt}</u>` : ""}`);
    b.type = "button"; b.style.setProperty("--c", s.color);
    b.setAttribute("aria-label", `${s.code}, ${s.name} : voir la présentation`);
    b.addEventListener("click", () => focus(s.id));
    b.addEventListener("pointerenter", () => { hover = s.id; }); b.addEventListener("pointerleave", () => { hover = null; });
    ui.append(b);
    return { s, b, v: V(0, 0, 0), x: 0, y: 0, oy: 0, w: 120, h: 30 };
  });
  const hint = el("div", "h3-hint", coarse ? "Touchez une étiquette ou utilisez ‹ › pour parcourir les stations" : "Glissez pour tourner · cliquez un bâtiment pour le découvrir"); ui.append(hint);
  const panel = el("div", "h3-panel"); panel.hidden = true; ui.append(panel);
  const mobNav = el("div", "h3-mobnav", `<button type="button" data-step="-1" aria-label="Station précédente">‹</button><span>Visiter les stations</span><button type="button" data-step="1" aria-label="Station suivante">›</button>`);
  mobNav.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => stepStation(+btn.dataset.step)));
  ui.append(mobNav);
  const bar = el("div", "h3-bar", `<button type="button" class="h3-play"></button>
    <label class="h3-time"><input type="range" min="0" max="24" step="0.05" value="10" aria-label="Heure de la journée"><output>10 h 00</output></label>
    <div class="h3-vals"><span title="Température extérieure (valeur illustrative)"><i style="--c:#7fd3ff"></i><em data-v="t"></em></span><span title="Flux de chaleur perdu par la paroi isolée (valeur illustrative)"><i style="--c:#ff8a4c"></i><em data-v="q"></em></span><span title="Puissance des panneaux photovoltaïques (valeur illustrative)"><i style="--c:#ffd166"></i><em data-v="pv"></em></span></div>`);
  ui.append(bar);
  const slider = bar.querySelector("input"), out = bar.querySelector("output"), playB = bar.querySelector(".h3-play");
  const vT = bar.querySelector('[data-v="t"]'), vQ = bar.querySelector('[data-v="q"]'), vPV = bar.querySelector('[data-v="pv"]');
  const setPlay = (p) => { playing = p; playB.classList.toggle("paused", !p); playB.setAttribute("aria-label", p ? "Mettre le temps en pause" : "Relancer le temps"); playB.title = p ? "Pause" : "Lecture"; };
  setPlay(playing);
  playB.addEventListener("click", () => setPlay(!playing));
  slider.addEventListener("input", () => { hour = +slider.value; setPlay(false); });

  /* ---------- caméra, contrôles, gros plans ---------- */
  const HOME = { az: -0.3, dist: 42, y: 13.5, target: V(0.3, 0.5, 1.0) };
  const homePos = () => V(HOME.target.x + Math.sin(HOME.az) * HOME.dist, HOME.y, HOME.target.z + Math.cos(HOME.az) * HOME.dist);
  cam.position.copy(homePos()).multiplyScalar(1.5);
  let controls = null;
  const target = HOME.target.clone();
  if (X.OrbitControls) {
    controls = new X.OrbitControls(cam, canvas);
    Object.assign(controls, { enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.07, rotateSpeed: 0.55, minPolarAngle: 0.85, maxPolarAngle: 1.42, autoRotate: !reduce, autoRotateSpeed: 0.28 });
    controls.target.copy(target);
    if (coarse) { controls.enableRotate = false; canvas.style.touchAction = "pan-y"; }
    let idle = 0;
    controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idle); hint.classList.add("off"); });
    controls.addEventListener("end", () => { clearTimeout(idle); idle = setTimeout(() => { if (!focused && !reduce) controls.autoRotate = true; }, 5000); });
  }
  const tgt = () => (controls ? controls.target : target);
  let fly = { t: 0, d: 2.6, p0: cam.position.clone(), p1: homePos(), t0: target.clone(), t1: HOME.target.clone() };   // entrée : la caméra plonge sur le quartier
  const flyTo = (p1, t1, d = 1.25) => { fly = { t: 0, d, p0: cam.position.clone(), p1, t0: tgt().clone(), t1 }; };
  function stepStation(dir) {
    const idx = focused ? ORDER.indexOf(focused) : -1;
    const next = ORDER[(idx + dir + ORDER.length) % ORDER.length];
    focus(next);
  }
  function focus(id) {
    const s = ST[id];
    if (!s) return;
    focused = id; hint.classList.add("off"); host.parentElement.classList.add("is-focus");
    if (controls) controls.autoRotate = false;
    const t1 = s.c.clone();
    flyTo(t1.clone().addScaledVector(V(...s.view.dir).normalize(), s.view.dist), t1);
    const [ttl, txt, chips] = INFO[id];
    const pr = labProg(id);
    const href = pr && pr.started && pr.done < pr.total && pr.nextWs
      ? `labs/${HREF[id]}/index.html#atelier=${pr.nextWs.id}`
      : `labs/${HREF[id]}/index.html`;
    const ctaLbl = pr && pr.started && pr.done < pr.total
      ? `Reprendre (${pr.done}/${pr.total}) →`
      : "Ouvrir le laboratoire →";
    const progHtml = pr && pr.started
      ? `<p class="h3-prog">${pr.done === pr.total ? "✓ Parcours terminé" : `◐ Progression : ${pr.done}/${pr.total} ateliers`}${pr.stars ? ` · ★ ${pr.stars}` : ""}</p>`
      : "";
    panel.style.setProperty("--c", s.color);
    panel.innerHTML = `<div class="h3-topbtns"><button type="button" class="h3-step" data-step="-1" aria-label="Station précédente">‹</button><button type="button" class="h3-step" data-step="1" aria-label="Station suivante">›</button><button type="button" class="h3-x" aria-label="Revenir à la vue d’ensemble">×</button></div>
      <p class="h3-k">${s.code}${NB[HREF[id]] ? ` · ${NB[HREF[id]]} ateliers` : ""}</p><h3>${ttl}</h3><p>${txt}</p>${progHtml}
      <div class="h3-chips">${chips.map((c) => `<span>${c}</span>`).join("")}</div>
      <div class="h3-act"><a class="btn primary" href="${href}">${ctaLbl}</a><button type="button" class="btn ghost h3-back">Vue d’ensemble</button></div>`;
    panel.hidden = false;
    panel.querySelector(".h3-x").addEventListener("click", unfocus);
    panel.querySelector(".h3-back").addEventListener("click", unfocus);
    panel.querySelectorAll(".h3-step").forEach((b) => b.addEventListener("click", () => stepStation(+b.dataset.step)));
    tags.forEach((g) => g.b.classList.toggle("on", g.s.id === id));
  }
  function unfocus() {
    if (!focused) return;
    focused = null; panel.hidden = true; host.parentElement.classList.remove("is-focus");
    tags.forEach((g) => g.b.classList.remove("on"));
    flyTo(homePos(), HOME.target.clone());
    if (controls && !reduce) setTimeout(() => { if (!focused) controls.autoRotate = true; }, 2500);
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") unfocus(); });
  // survol et clic sur les bâtiments
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (e) => { const b = canvas.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(hits, false)[0]; return h ? h.object.userData.id : null; };
  let down = null;
  canvas.addEventListener("pointermove", (e) => { cHover = pick(e); canvas.style.cursor = cHover ? "pointer" : ""; });
  canvas.addEventListener("pointerleave", () => { cHover = null; });
  canvas.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", (e) => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return; const id = pick(e); if (id) focus(id); });

  /* ---------- dimensions ---------- */
  const size = { w: 1, h: 1 };
  const resize = () => {
    const b = host.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) return;
    size.w = b.width; size.h = b.height;
    r.setSize(b.width, b.height, false);
    if (composer) { composer.setPixelRatio(r.getPixelRatio()); composer.setSize(b.width, b.height); }
    cam.aspect = b.width / b.height;
    // sur grand écran, le titre occupe la gauche : la scène est décalée vers la droite
    const wide = b.width >= 900;
    size.wide = wide;
    cam.fov = wide ? 30 : 46;
    if (!wide) cam.clearViewOffset();
    cam.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();
  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(host);

  /* ---------- boucle ---------- */
  const SKY = { dayT: new THREE.Color(0x8fcaff), dayB: new THREE.Color(0x3f7fd0), duskT: new THREE.Color(0xffb27a), duskB: new THREE.Color(0x4b3f8f), nightT: new THREE.Color(0x1c2c62), nightB: new THREE.Color(0x050916) };
  const sunWarm = new THREE.Color(0xff9a55), sunWhite = new THREE.Color(0xfff3e0), moonCol = new THREE.Color(0x8fb2ff), c1 = new THREE.Color(), c2 = new THREE.Color(), v3 = V(0, 0, 0);
  const back = (x) => { x = clamp(x); return 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2); };
  const groups = [...new Set(Object.values(ST).flatMap((s) => s.groups))];
  groups.forEach((g) => g.scale.setScalar(0.001));
  const clock = new THREE.Clock();
  let t = 0, uiT = 0, scrT = 0, offK = 0.14;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; }
    tick(Math.min(clock.getDelta(), 0.05));
  }
  function tick(dt) {
    t += dt;
    if (playing) { hour = (hour + dt * 0.3) % 24; slider.value = hour; }
    // entrée : les stations surgissent l'une après l'autre
    if (t < 4.5) groups.forEach((g, i) => g.scale.setScalar(Math.max(0.001, back((t - 0.5 - i * 0.16) / 0.8))));
    /* heure, ciel, lumière */
    const a = (hour - 6) / 12 * Math.PI, e = Math.sin(a), day = smooth((e + 0.2) / 0.45), night = smooth((0.1 - e) / 0.35), deep = smooth((-e - 0.12) / 0.3);
    if (e >= 0) { c1.copy(SKY.duskT).lerp(SKY.dayT, smooth(e / 0.4)); c2.copy(SKY.duskB).lerp(SKY.dayB, smooth(e / 0.4)); }
    else { c1.copy(SKY.duskT).lerp(SKY.nightT, smooth(-e / 0.32)); c2.copy(SKY.duskB).lerp(SKY.nightB, smooth(-e / 0.32)); }
    skyU.top.value.copy(c1); skyU.bot.value.copy(c2);
    if (e > -0.2) { sun.position.set(Math.cos(a) * 26, 3 + Math.max(e, 0.04) * 26, 11); sun.color.copy(sunWarm).lerp(sunWhite, smooth(e / 0.45)); sun.intensity = 2.3 * smooth((e + 0.2) / 0.42); }
    else { sun.position.set(-Math.cos(a) * 20, 16, 12); sun.color.copy(moonCol); sun.intensity = 0.6 * smooth((-e - 0.2) / 0.2); }
    hemi.intensity = 0.16 + 0.42 * day; hemi.color.copy(c1);
    fill.intensity = 0.08 + 0.16 * day;
    sc.environmentIntensity = 0.1 + 0.22 * day;
    sunBall.position.set(Math.cos(a) * 36, -5 + e * 12.5, -30); sunBall.visible = e > -0.3;
    moon.position.set(-Math.cos(a) * 34, -5 - e * 12, -32); moon.visible = e < -0.08;
    stars.material.opacity = deep * 0.95;
    glass.emissiveIntensity = 2.2 * night; oWin.emissiveIntensity = 2.0 * night; lampM2.emissiveIntensity = 0.2 + 3.5 * night; inside.intensity = 1 + 9 * night;
    lampM.emissiveIntensity = 3.5 * night; headM.emissiveIntensity = 4 * night; pools.forEach((p) => { p.material.opacity = 0.42 * night; });
    pvM.emissiveIntensity = 0.1 + 0.9 * Math.max(0, e);
    /* grandeurs physiques illustratives */
    const Text = 8 + 7 * Math.sin((hour - 9) / 24 * 2 * Math.PI), q = 0.3 * (20 - Text), pv = 3 * Math.max(0, e) ** 1.2, kq = clamp((20 - Text) / 19);
    uiT -= dt;
    if (uiT < 0) {
      uiT = 0.2;
      const h0 = Math.floor(hour), mm = Math.floor((hour - h0) * 60 / 5) * 5;
      out.textContent = `${h0} h ${String(mm).padStart(2, "0")}`;
      vT.textContent = `dehors ${fr(Text, 0)} °C`; vQ.textContent = `pertes ${fr(q)} W/m²`; vPV.textContent = `solaire ${fr(pv)} kW`;
      slider.style.setProperty("--p", (hour / 24 * 100).toFixed(1) + "%");
    }
    /* R2-9 : la chaleur traverse la paroi, d'autant plus qu'il fait froid dehors */
    const nH = Math.round(heat.n * (0.18 + 0.82 * kq));
    for (let i = 0; i < heat.n; i++) {
      heat.s[i] = (heat.s[i] + dt * (0.07 + 0.16 * kq)) % 1;
      const u = heat.s[i];
      if (i < nH) heat.pos.setXYZ(i, HX - hw / 2 + 2.1 - u * 5.4, hy[i] + u * u * 1.5 + Math.sin(u * 11 + i) * 0.05, HZ + hz[i]); else heat.pos.setXYZ(i, 0, -50, 0);
    }
    heat.pos.needsUpdate = true; heat.p.material.opacity = 0.5 + 0.5 * kq;
    radM.emissiveIntensity = 0.3 + 1.6 * kq;
    /* R1-10 : l'eau circule ; le niveau du château d'eau respire ; la pompe tourne */
    const flow = (d, c, sp) => { for (let i = 0; i < d.n; i++) { d.s[i] = (d.s[i] + dt * sp) % 1; c.getPointAt(d.s[i], v3); d.pos.setXYZ(i, v3.x, v3.y, v3.z); } d.pos.needsUpdate = true; };
    flow(water, cMain, 0.07); flow(branch, cBranch, 0.5); flow(waste, cWaste, 0.05);
    const lv = 0.62 + 0.3 * Math.sin(t * 0.35); level.scale.y = lv; level.position.y = 3.72 + lv / 2;
    imp.rotation.z += dt * 7; wheel.rotation.z = Math.sin(t * 0.5) * 1.2;
    /* R4-8 : air extrait, ondes sonores ; R3-10 : ventilateur, classe DPE */
    for (let i = 0; i < air.n; i++) { air.s[i] = (air.s[i] + dt * 0.2) % 1; const u = air.s[i]; air.pos.setXYZ(i, HX - 1.65 + Math.cos(ar[i] + u * 5) * 0.34 * u, y0 + hh + 1.5 + u * 3, HZ - 0.9 + Math.sin(ar[i] + u * 5) * 0.34 * u); }
    air.pos.needsUpdate = true;
    fan.rotation.z -= dt * (4 + 12 * kq);
    rings.forEach((m) => { const u = (t * 0.4 + m.userData.o) % 1; m.scale.setScalar(1 + u * 5.5); m.material.opacity = 0.5 * (1 - u) * (0.4 + 0.6 * kq); });
    dArrow.position.y = 2.32 - 0.215 * Math.min(6, Math.floor((1 + Math.sin(t * 0.22)) * 3.2));
    /* R1-13 : la presse écrase l'éprouvette, l'aiguille monte, l'éprouvette rougit à la rupture */
    const cyc = (t * 0.22) % 1, f = cyc < 0.72 ? smooth(cyc / 0.72) : 1 - smooth((cyc - 0.72) / 0.28);
    ram.position.y = 2.0 - f * 0.46; ramRod.scale.y = 0.76 + f * 0.46; ramRod.position.y = 2.12 - f * 0.46 + ramRod.scale.y / 2;
    sample.scale.set(1 + f * 0.06, 1 - f * 0.045, 1 + f * 0.06); sampleM.emissiveIntensity = Math.max(0, f - 0.9) * 9;
    needle.rotation.z = 2.2 - f * 4.4;
    /* R1-1 : tableur, grue */
    scrT -= dt; if (scrT < 0) { scrT = 0.12; drawScreen(t); }
    slew.rotation.y = 0.5 + Math.sin(t * 0.13) * 0.75; trolley.position.x = 4.2 + Math.sin(t * 0.21) * 2;
    const cl = 2.4 + Math.sin(t * 0.3) * 1.2; cable.scale.y = cl; cable.position.y = -cl / 2; load.position.y = -cl - 0.2;
    beaconM.emissiveIntensity = (Math.sin(t * 4) > 0.6 ? 6 : 0.4) * (0.3 + night);
    /* décor */
    car.position.x = ((t * 1.7 + 14) % 30) - 15; car.scale.setScalar(Math.max(0.001, smooth((12.6 - Math.abs(car.position.x)) / 1.2)));
    trees.forEach((tr, i) => { tr.rotation.z = Math.sin(t * 0.9 + i * 1.7) * 0.025; tr.rotation.x = Math.cos(t * 0.7 + i) * 0.02; });
    clouds.forEach((c, i) => { c.position.x += dt * (0.22 + i * 0.06); if (c.position.x > 17) c.position.x = -17; });
    /* socles lumineux : survol, gros plan */
    const hov = hover || cHover;
    Object.values(ST).forEach((s) => { const on = s.id === focused ? 1 : s.id === hov ? 0.75 : 0; s.hot += (on - s.hot) * Math.min(1, dt * 8); s.ring.material.opacity = s.hot * (0.75 + 0.2 * Math.sin(t * 4)); s.ring.scale.setScalar(1 + 0.05 * s.hot); });
    /* caméra : sur grand écran, la scène est décalée à droite du titre, ou à gauche de la fiche en gros plan */
    offK += ((focused ? -0.13 : 0.14) - offK) * Math.min(1, dt * 3.5);
    if (size.wide) cam.setViewOffset(size.w, size.h, -size.w * offK, 0, size.w, size.h);
    if (fly) {
      fly.t += dt / fly.d;
      const k = smooth(fly.t);
      cam.position.lerpVectors(fly.p0, fly.p1, k); tgt().lerpVectors(fly.t0, fly.t1, k);
      if (fly.t >= 1) fly = null;
    }
    if (controls) { controls.enabled = !fly; controls.autoRotateSpeed = 0.3 * Math.cos(t * 0.11); controls.update(); } else cam.lookAt(target);
    if (composer) composer.render(dt); else r.render(sc, cam);
    /* étiquettes : projetées, puis écartées si elles se chevauchent */
    tags.forEach((g) => { g.v.copy(g.s.tagAt).project(cam); g.x = (g.v.x * 0.5 + 0.5) * size.w; g.y = (-g.v.y * 0.5 + 0.5) * size.h; g.w = g.b.offsetWidth || 120; g.h = g.b.offsetHeight || 30; g.oy = 0; });
    for (let n = 0; n < 4; n++) for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
      const A = tags[i], B = tags[j], ox = (A.w + B.w) / 2 + 6 - Math.abs(A.x - B.x), oy = (A.h + B.h) / 2 + 5 - Math.abs((A.y + A.oy) - (B.y + B.oy));
      if (ox > 0 && oy > 0) { const hi = (A.y + A.oy) <= (B.y + B.oy) ? A : B, lo = hi === A ? B : A; hi.oy -= oy * 0.6; lo.oy += oy * 0.4; }
    }
    tags.forEach((g) => {
      const inView = g.v.z < 1 && g.x > 10 && g.x < size.w - 10 && g.y + g.oy > 30 && g.y < size.h - 70;
      g.b.style.transform = `translate(${g.x.toFixed(1)}px, ${(g.y + g.oy).toFixed(1)}px) translate(-50%, -100%)`;
      g.b.classList.toggle("off", t < 1.8 || !inView || (!!focused && focused !== g.s.id));
      g.b.classList.toggle("hot", hov === g.s.id);
    });
  }
  frame();
  window.__hero3d = { tick, focus, unfocus, hour: (h) => { hour = h; slider.value = h; setPlay(false); } };   // pour les tests
}
