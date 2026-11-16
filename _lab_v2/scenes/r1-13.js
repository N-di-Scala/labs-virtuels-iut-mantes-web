/* =====================================================================
   R1-13 Fonctions des composants des bâtiments - métrologie d'essai
   (mission Pierreclaire) - scènes 3D, formules identiques à la v1.
   ===================================================================== */
const R113 = {
  /* éprouvette cylindrique de béton */
  specimen(K, r = 0.5, h = 1.2) {
    const { P } = K;
    const m = K.cyl(r, r, h, SC.texMat(K, "concrete"), 40);
    m.position.y = h / 2;
    return m;
  },
  /* presse de compression (portique + plateaux) */
  press(K) {
    const { P } = K;
    const g = K.group();
    const frameM = K.mat(P.acc, { metal: 0.4, rough: 0.35 });
    const base = K.box(2.4, 0.4, 1.4, frameM, 0.06);
    base.position.y = 0.2;
    const top = K.box(2.4, 0.4, 1.4, frameM, 0.06);
    top.position.y = 3.4;
    [-0.95, 0.95].forEach((x) => { const c = K.cyl(0.1, 0.1, 3.0, K.mat(P.steel, { metal: 0.9, rough: 0.2 }), 20); c.position.set(x, 1.8, 0); g.add(c); });
    const plateB = K.cyl(0.65, 0.65, 0.1, K.mat(P.steel, { metal: 0.9, rough: 0.25 }), 40);
    plateB.position.y = 0.45;
    const ram = K.cyl(0.35, 0.35, 0.9, K.mat(P.steel, { metal: 0.9, rough: 0.2 }), 32);
    const plateT = K.cyl(0.65, 0.65, 0.1, K.mat(P.steel, { metal: 0.9, rough: 0.25 }), 40);
    g.add(base, top, plateB, ram, plateT);
    g.userData = { ram, plateT };
    return g;
  },
  /* règle graduée 3D sur l'axe x */
  rule(K, x0, x1, step, y = 0.02, z = 0) {
    const { P } = K;
    const g = K.group();
    const bar = K.box(x1 - x0, 0.04, 0.5, K.mat(P.dark ? "#2a3243" : "#e9e4d8", { rough: 0.6 }), 0.02);
    bar.position.set((x0 + x1) / 2, y, z);
    g.add(bar);
    const n = Math.round((x1 - x0) / step);
    for (let i = 0; i <= n; i++) {
      const t = K.box(0.012, 0.02, i % 5 ? 0.12 : 0.24, K.mat(P.mute));
      t.position.set(x0 + i * step, y + 0.03, z - 0.12);
      t.castShadow = false;
      g.add(t);
    }
    return g;
  },
  clear(g) { g.children.slice().forEach((c) => { g.remove(c); c.traverse((o) => o.geometry && o.geometry.dispose()); }); },
};

/* ---------- accueil : le banc d'essai du laboratoire ---------- */
defineScene("home", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  root.add(K.slab(15, 9, 0.6, P.dark ? "#2d3340" : "#e2dfd8", P.slab, 0.35));
  const labFloor = K.box(14.6, 0.04, 8.6, SC.texMat(K, "tile", { rep: [10, 6] }), 0.03);
  labFloor.position.y = 0.06; labFloor.userData.noFit = true;
  root.add(labFloor);
  [[0.4, 2.6, 0.6], [-5.2, 2.4, 2.4]].forEach(([x, z, r], i) => { const pp = SC.person(K, i ? P.acc2 : "#f2f2f2", 0.85); pp.position.set(x, 0.08, z); pp.rotation.y = r; root.add(pp); });
  const press = R113.press(K);
  press.position.set(-3.2, 0, -0.6);
  root.add(press);
  const spec = R113.specimen(K, 0.45, 1.3);
  spec.position.set(-3.2, 0.5, -0.6);
  root.add(spec);
  K.tip(press, "<b>Presse de compression</b><br>F mesurée ± u(F) : la contrainte hérite de cette incertitude.");
  // cloche de Gauss faite de billes empilées (mesures répétées)
  const bins = 17, per = [];
  const beadM = K.mat(P.acc, { rough: 0.35, emissive: P.acc, ei: 0.25 });
  const beads = K.dots(260, 0.1, beadM);
  root.add(beads);
  for (let i = 0; i < bins; i++) per.push(Math.round(16 * Math.exp(-((i - 8) ** 2) / 10)));
  const m4 = new THREE.Matrix4();
  const pos = [];
  per.forEach((n, i) => { for (let j = 0; j < n; j++) pos.push([0.4 + i * 0.22, 0.12 + j * 0.2]); });
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 41 }, (_, i) => { const x = i / 40 * 16; return new THREE.Vector3(0.4 + x * 0.22, 0.25 + 16 * Math.exp(-((x - 8) ** 2) / 10) * 0.2, 0); }));
  root.add(K.tube(curve, 0.025, K.glow(P.acc2, 1.6), 80, 8));
  K.tag("Mesures répétées", () => new THREE.Vector3(2.2, 3.6, 0), { value: "dispersion → uA", color: P.acc });
  K.tag("Éprouvette", () => new THREE.Vector3(-3.2, 2.2, 0.3), { value: "σ = F/A" });
  let shown = 0;
  root.position.y = -0.6;
  return {
    root,
    shadowBox: 10,
    cam: { pos: [7, 6, 12], target: [0, 1.4, 0], shiftX: 0.2, pad: 0.82 },
    tick(dt, t) {
      shown = Math.min(pos.length, shown + dt * 60);
      if (K.motion === 0) shown = pos.length;
      for (let i = 0; i < 260; i++) {
        const p = pos[i];
        if (!p || i >= shown) { m4.makeScale(0, 0, 0); beads.setMatrixAt(i, m4); continue; }
        m4.makeTranslation(p[0], p[1], 0);
        beads.setMatrixAt(i, m4);
      }
      beads.instanceMatrix.needsUpdate = true;
      if (shown >= pos.length && Math.sin(t * 0.3) > 0.995) shown = 0;
      press.userData.ram.position.y = 2.75 + Math.sin(t * 0.8) * 0.03;
      press.userData.plateT.position.y = 2.3 + Math.sin(t * 0.8) * 0.03;
    },
  };
});

/* ---------- 01 : types A et B ---------- */
defineScene("ab", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.bench(K, 11, 6));
  const ruleG = K.group();
  root.add(ruleG);
  const N = 20;
  const pts = Array.from({ length: N }, () => { const m = K.sphere(0.09, K.glow(P.acc, 1.4), 16); root.add(m); return m; });
  // tirages déterministes ; ils sont recentrés et réduits sur les n points affichés (moyenne 0, écart-type 1)
  const raw0 = Array.from({ length: N }, (_, i) => { let u = 0; for (let k = 0; k < 6; k++) { const x = Math.sin((i + 1) * (k + 3.7) * 12.9898) * 43758.5453; u += x - Math.floor(x) - 0.5; } return u; });
  function seedsFor(n) {
    const a = raw0.slice(0, n);
    const m = a.reduce((x, y) => x + y, 0) / n;
    const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / Math.max(n - 1, 1)) || 1;
    return a.map((x) => (x - m) / sd);
  }
  const meanBar = K.box(0.03, 0.9, 0.6, K.glow(P.gold, 2));
  root.add(meanBar);
  const band = K.box(1, 0.02, 0.9, K.glow(P.acc, 0.7, 0.25));
  root.add(band);
  // deux accolades : ±s (dispersion des mesures, ne rétrécit pas avec n) et ±uA = ±s/√n (incertitude sur la moyenne)
  function brace(color, r) {
    const g = K.group();
    const m = K.glow(color, 1.8);
    const bar = K.rod(m, r), l = K.rod(m, r), rr = K.rod(m, r);
    g.add(bar, l, rr);
    g.userData.set = (x0, x1, y, z) => {
      bar.set(new THREE.Vector3(x0, y, z), new THREE.Vector3(x1, y, z));
      l.set(new THREE.Vector3(x0, y - 0.18, z), new THREE.Vector3(x0, y, z));
      rr.set(new THREE.Vector3(x1, y - 0.18, z), new THREE.Vector3(x1, y, z));
    };
    return g;
  }
  const brS = brace(P.acc, 0.025), brU = brace(P.gold, 0.035);
  root.add(brS, brU);
  const tS = K.tag("± s", () => new THREE.Vector3(xS1 + 0.15, 1.25, 1.1), { color: P.acc });
  const tU = K.tag("± uA", () => new THREE.Vector3(xMean, 1.62, 1.1), { color: P.gold });
  let xS1 = 1, xMean = 0, resKey = "";
  // triangle de Pythagore : uA et uB en côtés, uc en hypoténuse
  const tri = K.group();
  root.add(tri);
  const legA = K.box(1, 0.08, 0.08, K.glow(P.acc, 1.4)), legB = K.box(0.08, 1, 0.08, K.glow(P.acc2, 1.4)), hyp = K.box(1, 0.1, 0.1, K.glow(P.gold, 1.8));
  tri.add(legA, legB, hyp);
  tri.position.set(-1.5, 0.1, -1.8);
  window.LABV4H && window.LABV4H(K, band, "s", "ab", "Le ruban de dispersion ± s", "glisser vers la droite ou la gauche pour élargir ou resserrer l’écart-type s", 4, "x");
  window.LABV4H && window.LABV4H(K, tri, "n", "ab", "Le triangle des incertitudes", "glisser vers le haut ou le bas pour changer le nombre de répétitions n", 3.5, "y");
  const tA = K.tag("uA", () => tri.localToWorld(new THREE.Vector3(la / 2, -0.15, 0.2)), { color: P.acc });
  const tB = K.tag("uB", () => tri.localToWorld(new THREE.Vector3(la + 0.35, lb / 2, 0)), { color: P.acc2 });
  const tC = K.tag("uc", () => tri.localToWorld(new THREE.Vector3(la / 2, lb / 2 + 0.35, 0)), { big: true, color: P.gold });
  const tM = K.tag("Mesures", () => new THREE.Vector3(0, 1.2, 1.1));
  let la = 1, lb = 1;
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1.5, 6, 8], target: [0, 0.6, -0.2], pad: 0.88 },
    views: SC.views(() => new THREE.Vector3(xMean, 0.7, 1.1), { label: "Mesures", title: "Zoom sur les mesures, ± s et ± uA", dist: 4, dir: [0.1, 0.45, 1] }),
    update() {
      const n = K.v("n"), s = K.v("s"), res = K.v("res");
      const uA = s / Math.sqrt(n), uB = (res / 2) / Math.sqrt(3), uc = Math.hypot(uA, uB);
      const cA = (uA * uA) / (uc * uc) * 100;
      const sc = 2.2; // 1 mm = 2,2 unités
      // la règle n'est reconstruite que si la résolution change
      if (String(res) !== resKey) { resKey = String(res); R113.clear(ruleG); ruleG.add(R113.rule(K, -4.5, 4.5, Math.max(0.06, res * sc), 0.02, 1.1)); }
      const seeds = seedsFor(n);
      const reads = seeds.map((z) => Math.round((z * s) / res) * res); // valeur lue = arrondie à la résolution
      const mean = reads.reduce((x, y) => x + y, 0) / n;
      pts.forEach((p, i) => {
        p.visible = i < n;
        if (i < n) p.position.set(reads[i] * sc, 0.2 + (i % 4) * 0.2, 1.1);
      });
      xMean = mean * sc;
      band.scale.x = Math.max(0.02, 2 * s * sc);
      band.position.set(xMean, 0.06, 1.1);
      meanBar.position.set(xMean, 0.5, 1.1);
      xS1 = xMean + s * sc;
      brS.userData.set(xMean - s * sc, xMean + s * sc, 1.12, 1.1);
      brU.userData.set(xMean - uA * sc, xMean + uA * sc, 1.45, 1.1);
      tS.set("± s (dispersion)", K.fmt(s, 2) + " mm : ne diminue pas avec n");
      tU.set("± uA = ± s/√n", K.fmt(uA, 3) + " mm : se resserre en 1/√n");
      const k = 2.2 / Math.max(uA, uB, 0.02);
      la = uA * k; lb = uB * k;
      legA.scale.x = la; legA.position.set(la / 2, 0, 0);
      legB.scale.y = lb; legB.position.set(la, lb / 2, 0);
      const L = Math.hypot(la, lb);
      hyp.scale.x = L; hyp.position.set(la / 2, lb / 2, 0); hyp.rotation.z = Math.atan2(lb, la);
      tA.set("uA = s/√n", K.fmt(uA, 3) + " mm");
      tB.set("uB résolution", K.fmt(uB, 3) + " mm");
      tC.set("uc = √(uA² + uB²)", K.fmt(uc, 3) + " mm · A " + K.fmt(cA, 0) + " %");
      tM.set(n + " mesures", "écart-type " + K.fmt(s, 2) + " mm · résolution " + K.fmt(res, 2) + " mm");
    },
  };
});

/* ---------- 02 : composition quadratique ---------- */
defineScene("compose", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.bench(K, 10, 6));
  const mk = (c, r) => K.cyl(r, r, 1, K.glow(c, 1.4), 16);
  const a = mk(P.acc, 0.09), b = mk(P.acc2, 0.09), c = mk(P.gold, 0.11);
  const sA = mk(P.acc, 0.07), sB = mk(P.acc2, 0.07);
  [a, b, c, sA, sB].forEach((m) => root.add(m));
  const sq = [K.box(1, 0.05, 1, K.mat(P.acc, { opacity: 0.25 })), K.box(1, 0.05, 1, K.mat(P.acc2, { opacity: 0.25 })), K.box(1, 0.05, 1, K.mat(P.gold, { opacity: 0.22 }))];
  sq.forEach((m) => { m.castShadow = false; root.add(m); });
  window.LABV4H && window.LABV4H(K, sq[0], "uA", "compose", "Le carré de variance u_A²", "glisser vers la droite ou la gauche pour modifier l’incertitude de type A (u_A)", 4, "x");
  window.LABV4H && window.LABV4H(K, sq[1], "uB", "compose", "Le carré de variance u_B²", "glisser vers le haut ou le bas pour modifier l’incertitude de type B (u_B)", 4, "y");
  const tC = K.tag("uc", () => c.position.clone().add(new THREE.Vector3(0, 0.4, 0)), { big: true, color: P.gold });
  const tqA = K.tag("uA²", () => sq[0].position.clone().add(new THREE.Vector3(0, 0.15, 0)), { color: P.acc });
  const tqB = K.tag("uB²", () => sq[1].position.clone().add(new THREE.Vector3(0, 0.15, 0)), { color: P.acc2 });
  const tqC = K.tag("uc²", () => sq[2].position.clone().add(new THREE.Vector3(0, 0.15, 0)), { color: P.gold });
  const tS = K.tag("Somme", () => new THREE.Vector3(1.5 + sumL / 2, 0.45, 1.6), { color: P.danger });
  let sumL = 1;
  const seg = (m, p, q) => { const d = q.clone().sub(p); m.scale.set(1, d.length(), 1); m.position.copy(p).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
  return {
    root,
    shadowBox: 8,
    cam: { pos: [0.5, 7.5, 6.5], target: [0, 0, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(-2.2, 0, 0.4), { label: "Pythagore", title: "Vue de dessus : les trois carrés", dist: 7, dir: [0, 1, 0.08] }),
    update() {
      const uA = K.v("uA"), uB = K.v("uB"), uc = Math.hypot(uA, uB);
      const k = 3 / Math.max(uA + uB, 0.05);
      const A = uA * k, B = uB * k;
      const o = new THREE.Vector3(-3.5, 0.15, 1.2);
      const pA = o.clone().add(new THREE.Vector3(A, 0, 0));
      const pB = pA.clone().add(new THREE.Vector3(0, 0, -B));
      seg(a, o, pA); seg(b, pA, pB); seg(c, o, pB);
      // carrés construits sur les côtés : aire = carré de l'incertitude
      sq[0].scale.set(A, 1, A); sq[0].position.set(o.x + A / 2, 0.05, o.z + A / 2);
      sq[1].scale.set(B, 1, B); sq[1].position.set(pA.x + B / 2, 0.05, pA.z - B / 2);
      // carré de l'hypoténuse, construit à l'extérieur du triangle : son aire égale la somme des deux autres
      const C = Math.hypot(A, B);
      const d = pB.clone().sub(o).normalize();
      let nrm = new THREE.Vector3(-d.z, 0, d.x);
      const mid = o.clone().lerp(pB, 0.5);
      if (nrm.dot(pA.clone().sub(mid)) > 0) nrm.negate();
      sq[2].scale.set(C, 1, C);
      sq[2].position.copy(mid).addScaledVector(nrm, C / 2).setY(0.04);
      sq[2].rotation.y = -Math.atan2(d.z, d.x);
      sq[2].visible = C > 1e-3;
      tqA.set("uA²", K.fmt(uA * uA, 5) + " mm²");
      tqB.set("uB²", K.fmt(uB * uB, 5) + " mm²");
      tqC.set("uc² = uA² + uB²", K.fmt(uc * uc, 5) + " mm²");
      sumL = (uA + uB) * k;
      seg(sA, new THREE.Vector3(1.5, 0.15, 1.6), new THREE.Vector3(1.5 + A, 0.15, 1.6));
      seg(sB, new THREE.Vector3(1.5 + A, 0.15, 1.6), new THREE.Vector3(1.5 + A + B, 0.15, 1.6));
      tC.set("uc = √(uA² + uB²)", K.fmt(uc, 3) + " mm");
      tS.set("uA + uB (faux)", K.fmt(uA + uB, 3) + " mm · surestime de " + K.fmt(uA + uB - uc, 3));
    },
  };
});

/* ---------- 03 : propagation σ = F/A ---------- */
defineScene("prop", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.bench(K, 9, 6));
  const press = R113.press(K);
  root.add(press);
  // éprouvette finement maillée pour pouvoir la déformer en tonneau pendant l'essai
  const specG = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 40, 16);
  const spec0 = specG.attributes.position.array.slice();
  const spec = new THREE.Mesh(specG, SC.texMat(K, "concrete"));
  spec.castShadow = true; spec.receiveShadow = true;
  root.add(spec);
  window.LABV4H && window.LABV4H(K, spec, "D", "prop", "L’éprouvette cylindrique en béton", "glisser vers la droite ou la gauche pour modifier son diamètre D", 4, "x");
  window.LABV4H && window.LABV4H(K, press.userData.plateT, "F", "prop", "Le plateau supérieur de la presse", "glisser vers le bas ou le haut pour régler la force de rupture F", -3.5, "y");
  // fissures coniques (forme en sablier typique de la rupture en compression)
  const cracks = K.group();
  const crackM = K.mat(P.dark ? "#1b1f27" : "#3a3e4a", { rough: 1 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    [1, -1].forEach((sg) => {
      const r1 = K.rod(crackM, 0.012);
      r1.set(new THREE.Vector3(Math.cos(a) * 0.505, sg * 0.8, Math.sin(a) * 0.505), new THREE.Vector3(Math.cos(a + 0.35) * 0.53, sg * 0.05, Math.sin(a + 0.35) * 0.53));
      cracks.add(r1);
    });
  }
  cracks.visible = false;
  spec.add(cracks);
  let crush = null;
  // vignette : couronne d'incertitude sur la section et carré étiré de +r % en x et en y
  const inset = K.group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), SC.texMat(K, "concrete"));
  const crown = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.65, 64), K.glow(P.acc2, 1.1, 0.85));
  const sqr = K.box(0.9, 0.9, 0.02, SC.texMat(K, "concrete"));
  const stripX = K.box(1, 0.9, 0.025, K.glow(P.acc2, 1.2, 0.9)), stripY = K.box(0.9, 1, 0.025, K.glow(P.acc2, 1.2, 0.9));
  inset.add(disc, crown, sqr, stripX, stripY);
  disc.position.set(0, 0.85, 0); crown.position.set(0, 0.85, 0.005);
  sqr.position.set(0, -0.45, 0);
  inset.position.set(-2.5, 1.9, 0.6);
  inset.rotation.y = 0.35;
  root.add(inset);
  const tI = K.tag("Couronne ΔA", () => inset.localToWorld(new THREE.Vector3(0, 1.62, 0)), { color: P.acc2 });
  const tQ = K.tag("Carré étiré", () => inset.localToWorld(new THREE.Vector3(0, -1.08, 0)), { color: P.acc2 });
  const tX = K.tag("Essai", () => new THREE.Vector3(0, 3.0, 0.9), { big: true, color: P.danger });
  tX.show(false);
  const ring = K.torus(0.5, 0.02, K.glow(P.acc2, 1.6));
  ring.rotation.x = Math.PI / 2;
  root.add(ring);
  const ringU = K.torus(0.5, 0.05, K.glow(P.acc2, 0.6, 0.35));
  ringU.rotation.x = Math.PI / 2;
  root.add(ringU);
  const F = K.arrow(P.danger, { r: 0.08, glow: 1.4 });
  root.add(F);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 32, 1, true), K.glow(P.danger, 0.6, 0.18));
  cone.material.side = THREE.DoubleSide;
  root.add(cone);
  const bars = [K.box(0.4, 1, 0.4, K.mat(P.danger, { emissive: P.danger, ei: 0.3 }), 0.04), K.box(0.4, 1, 0.4, K.mat(P.acc2, { emissive: P.acc2, ei: 0.3 }), 0.04)];
  bars.forEach((b) => root.add(b));
  K.tip(spec, () => `<b>Section A = πD²/4</b><br>u(A)/A = 2·u(D)/D : le diamètre compte double.`);
  const tS = K.tag("σ", () => new THREE.Vector3(0, 2.6, 0.8), { big: true });
  const tF = K.tag("F", () => new THREE.Vector3(0.9, 3.7, 0), { color: P.danger });
  const tD = K.tag("D", () => new THREE.Vector3(R + 0.35, 1.0, 0), { color: P.acc2 });
  const tB = K.tag("Contributions", () => new THREE.Vector3(2.6, 2.2, 0));
  let R = 0.5, sq = 0;
  return {
    root,
    shadowBox: 7,
    cam: { pos: [4, 3.5, 7.5], target: [0.6, 1.6, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(0, 1.4, 0), { label: "Éprouvette", title: "Zoom sur l’éprouvette entre les plateaux", dist: 3 }),
    actions: [{
      label: "Lancer l’essai d’écrasement",
      title: "La presse charge l’éprouvette jusqu’à F : léger bombement (effet Poisson), puis rupture en cônes",
      run() { crush = { t: 0, boom: false }; cracks.visible = false; tX.show(true); },
    }],
    update() {
      const D = K.v("D"), uD = K.v("uD"), Fk = K.v("F"), uF = K.v("uF");
      const A = Math.PI * D * D / 4;
      const uArel = 2 * (uD / D);
      const sigma = (Fk * 1000) / A;
      const uRel = Math.hypot(uF / Fk, uArel);
      const cF = Math.pow(uF / Fk, 2) / (uRel * uRel) * 100;
      R = D / 1000 * 4.2;
      spec.scale.set(R / 0.5, 1, R / 0.5);
      spec.position.y = 0.5 + 0.8;
      ring.scale.setScalar(R / 0.5); ring.position.y = 1.3;
      ringU.scale.set(R / 0.5, R / 0.5, 1 + uD * 6); ringU.position.y = 1.3;
      press.userData.plateT.position.y = 2.15;
      press.userData.ram.position.y = 2.65;
      F.set(new THREE.Vector3(0, 4.6, 0), new THREE.Vector3(0, -1, 0), 0.5 + Fk / 800 * 0.9);
      cone.scale.set(0.05 + uF / 15 * 0.6, 0.9, 0.05 + uF / 15 * 0.6);
      cone.position.set(0, 4.15, 0);
      cone.rotation.x = Math.PI;
      const hF = 0.1 + cF / 100 * 2, hA = 0.1 + (100 - cF) / 100 * 2;
      bars[0].scale.y = hF; bars[0].position.set(2.3, hF / 2, 0);
      bars[1].scale.y = hA; bars[1].position.set(2.9, hA / 2, 0);
      spec.material.emissive = SC.tcol(K, sigma, 15, 60);
      spec.material.emissiveIntensity = 0.35;
      // couronne : ΔA ≈ (π/2)·D·ΔD, soit ΔA/A = 2·ΔD/D (grossie pour être visible)
      const rel = uD / D;
      const ex = [10, 20, 50, 100, 200, 500].find((f) => rel * f >= 0.06) || 500;
      const dr = 0.55 * rel * ex;
      crown.geometry.dispose();
      crown.geometry = new THREE.RingGeometry(0.55, 0.55 + dr, 64);
      stripX.scale.x = 0.9 * rel * ex; stripX.position.set(0.45 + (0.9 * rel * ex) / 2, -0.45, 0.005);
      stripY.scale.y = 0.9 * rel * ex; stripY.position.set(0, 0.9 * rel * ex / 2, 0.005);
      tI.set("Couronne ΔA (×" + ex + ")", "ΔA/A = 2·ΔD/D = " + K.fmt(2 * rel * 100, 2) + " %");
      tQ.set("+" + K.fmt(rel * 100, 2) + " % en x et en y", "deux bandes : +" + K.fmt(2 * rel * 100, 2) + " % d’aire");
      tX.set("Essai", "rupture à F = " + K.fmt(Fk, 0) + " kN · σ = " + K.fmt(sigma, 1) + " MPa");
      tS.set("σ = F/A", K.fmt(sigma, 2) + " ± " + K.fmt(sigma * uRel, 3) + " MPa");
      tF.set("F", K.fmt(Fk, 0) + " ± " + K.fmt(uF, 1) + " kN");
      tD.set("D", K.fmt(D, 0) + " ± " + K.fmt(uD, 2) + " mm");
      tB.set("Part de F / de A", K.fmt(cF, 0) + " % / " + K.fmt(100 - cF, 0) + " %");
    },
    tick(dt, t, rdt) {
      if (!crush) return;
      crush.t += K.motion ? rdt || 0.016 : 2;
      const T = 1.8;
      const k = Math.min(1, crush.t / T);
      // descente du plateau, tassement et bombement en tonneau (effet Poisson)
      const squash = 0.04 * k, bulge = 0.07 * k * k;
      press.userData.plateT.position.y = 2.15 - squash * 1.6;
      press.userData.ram.position.y = 2.65 - squash * 1.6;
      const pa = specG.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const x = spec0[3 * i], y = spec0[3 * i + 1], z = spec0[3 * i + 2];
        const f = 1 + bulge * Math.cos((y / 0.8) * Math.PI / 2);
        pa.setXYZ(i, x * f, y * (1 - squash), z * f);
      }
      pa.needsUpdate = true;
      specG.computeVertexNormals();
      if (k >= 1 && !crush.boom) {
        crush.boom = true;
        cracks.visible = true;
        if (window.LABV2 && window.LABV2.audio) window.LABV2.audio.thud();
      }
      if (crush.t > T + 2.6) {
        pa.array.set(spec0); pa.needsUpdate = true; specG.computeVertexNormals();
        cracks.visible = false;
        tX.show(false);
        crush = null;
        press.userData.plateT.position.y = 2.15;
        press.userData.ram.position.y = 2.65;
      }
    },
  };
});

/* ---------- 04 : incertitude élargie et conformité ---------- */
defineScene("conform", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.bench(K, 12, 5));
  const x = (v) => -5 + (v - 18) / 22 * 10;
  root.add(R113.rule(K, x(18), x(40), 10 / 22, 0.02, 0));
  const spec = K.box(0.06, 2.2, 2.2, K.mat(P.danger, { opacity: 0.35, emissive: P.danger, ei: 0.4 }));
  spec.castShadow = false;
  const refuseZone = K.box(1, 0.03, 2.2, K.mat(P.danger, { opacity: 0.16, emissive: P.danger, ei: 0.25 }));
  refuseZone.castShadow = false;
  root.add(spec, refuseZone);
  K.tip(spec, () => `<b>Limite de spécification</b> L<sub>spec</sub> = ${K.txt("v-Lspec")}`);
  const bar = K.box(1, 0.25, 0.25, K.mat(P.ok, { emissive: P.ok, ei: 0.5, rough: 0.3 }), 0.06);
  const bead = K.sphere(0.2, K.mat(P.ink, { rough: 0.3 }));
  const capL = K.box(0.05, 0.6, 0.6, K.mat(P.ok, { emissive: P.ok, ei: 0.5 })), capR = capL.clone();
  root.add(bar, bead, capL, capR);
  const tV = K.tag("Verdict", () => new THREE.Vector3(x(sig), 1.3, 0), { big: true });
  const tL = K.tag("Lspec", () => new THREE.Vector3(x(L), 2.5, 0), { color: P.danger });
  const tU = K.tag("U = k·uc", () => new THREE.Vector3(x(sig), 0.25, 0.9));
  let sig = 26, L = 25;
  return {
    root,
    shadowBox: 8,
    cam: { pos: [0.5, 3.5, 8], target: [0, 0.6, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(x(L), 0.6, 0), { label: "Limite", title: "Zoom sur l’intervalle et la limite de spécification", dist: 3.4, dir: [0.2, 0.4, 1] }),
    update() {
      sig = K.v("sig"); L = K.v("Lspec");
      const uc = K.v("uc"), k = +K.s("k");
      const U = k * uc, lo = sig - U, hi = sig + U;
      const verdict = lo >= L ? "Conforme" : hi < L ? "Non conforme" : "Zone de doute";
      const c = lo >= L ? P.ok : hi < L ? P.danger : P.warn;
      [bar, capL, capR].forEach((m) => { m.material.color.copy(c); m.material.emissive.copy(c); });
      const w = x(hi) - x(lo);
      bar.scale.x = Math.max(0.02, w); bar.position.set((x(lo) + x(hi)) / 2, 0.45, 0);
      capL.position.set(x(lo), 0.45, 0); capR.position.set(x(hi), 0.45, 0);
      bead.position.set(x(sig), 0.45, 0);
      spec.position.set(x(L), 1.1, 0);
      const rw = Math.max(0.02, x(L) - x(18));
      refuseZone.scale.x = rw;
      refuseZone.position.set(x(18) + rw / 2, 0.04, 0);
      tV.set(verdict, "[" + K.fmt(lo, 2) + " ; " + K.fmt(hi, 2) + "] MPa").color(c);
      tL.set("Lspec", K.fmt(L, 1) + " MPa");
      tU.set("U = k·uc", "k = " + k + " · " + K.fmt(U, 2) + " MPa");
    },
  };
});

/* ---------- 05 : lot multi-éprouvettes ---------- */
defineScene("lot", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.bench(K, 10, 6));
  const y = (v) => (v - 14) * 0.15;
  const specs = [0, 1, 2].map((i) => { const s = R113.specimen(K, 0.42, 1); s.position.x = -2 + i * 1.5; root.add(s); return s; });
  const caps = specs.map(() => { const c = K.cyl(0.46, 0.46, 0.06, K.glow(P.acc, 1.4), 32); root.add(c); return c; });
  const plane = (c, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.6), K.glow(c, 0.7, op)); m.rotation.x = -Math.PI / 2; m.material.side = THREE.DoubleSide; root.add(m); return m; };
  const pFck = plane(P.gold, 0.16), pInd = plane(P.danger, 0.1);
  const mean = K.box(0.06, 1, 0.06, K.glow(P.ink, 1));
  const band = K.box(0.4, 1, 0.4, K.mat(P.acc2, { opacity: 0.45, emissive: P.acc2, ei: 0.4 }), 0.05);
  root.add(mean, band);
  const tags = specs.map((s, i) => K.tag("σ" + (i + 1), () => caps[i].position.clone().add(new THREE.Vector3(0, 0.3, 0))));
  const tF = K.tag("fck", () => new THREE.Vector3(-3.2, pFck.position.y + 0.1, 0), { color: P.gold });
  const tI = K.tag("fck - 4", () => new THREE.Vector3(-3.2, pInd.position.y + 0.1, 0.8), { color: P.danger });
  const tM = K.tag("Verdict du lot", () => new THREE.Vector3(2.6, band.position.y + band.scale.y / 2 + 0.35, 0), { big: true });
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1, 4.5, 8.5], target: [0, 2, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(0.3, 2, 0), { label: "Lot", title: "Zoom sur les trois éprouvettes et les seuils", dist: 5 }),
    update() {
      const v = [K.v("s1"), K.v("s2"), K.v("s3")], fck = K.v("fck");
      const m = (v[0] + v[1] + v[2]) / 3;
      const s = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / 2);
      const U = 2 * (s / Math.sqrt(3));
      const okInd = Math.min(...v) >= fck - 4, okMean = m >= fck, reserve = m - U < fck && m + U > fck;
      const c = !okInd || !okMean ? P.danger : reserve ? P.warn : P.ok;
      specs.forEach((sp, i) => {
        const h = y(v[i]);
        sp.scale.y = h; sp.position.y = h / 2;
        caps[i].position.set(sp.position.x, h + 0.03, 0);
        caps[i].material.color.copy(v[i] >= fck - 4 ? P.acc : P.danger);
        caps[i].material.emissive.copy(caps[i].material.color);
        tags[i].set("σ" + (i + 1), K.fmt(v[i], 1) + " MPa");
      });
      pFck.position.set(-0.5, y(fck), 0); pInd.position.set(-0.5, y(fck - 4), 0);
      band.scale.y = Math.max(0.02, y(m + U) - y(m - U));
      band.position.set(2.6, (y(m + U) + y(m - U)) / 2, 0);
      band.material.color.copy(c); band.material.emissive.copy(c);
      mean.scale.y = 0.02; mean.position.set(2.6, y(m), 0);
      tF.set("fck", fck + " MPa"); tI.set("fck - 4", (fck - 4) + " MPa");
      tM.set(!okInd || !okMean ? "Non conforme" : reserve ? "OK avec réserve" : "Conforme", "moyenne " + K.fmt(m, 2) + " ± " + K.fmt(U, 2) + " MPa").color(c);
    },
  };
});

/* ---------- 06 : budget d'incertitudes ---------- */
defineScene("budget", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.bench(K, 9, 7));
  const cols = [P.acc, P.acc2, P.gold];
  const names = ["Étalonnage", "Dérive", "Résolution"];
  const seg = K.group();
  const segG = [K.group(), K.group(), K.group()];
  segG.forEach((g) => seg.add(g));
  root.add(seg);
  window.LABV4H && window.LABV4H(K, segG[0], "Ucal", "budget", "Le secteur Étalonnage de l’anneau", "glisser vers le haut ou le bas pour régler l’incertitude d’étalonnage U_cal", 3.5, "y");
  window.LABV4H && window.LABV4H(K, segG[1], "ader", "budget", "Le secteur Dérive de l’anneau", "glisser vers le haut ou le bas pour régler la dérive annuelle a_der", 3.5, "y");
  window.LABV4H && window.LABV4H(K, segG[2], "rF", "budget", "Le secteur Résolution de l’anneau", "glisser vers le haut ou le bas pour régler la résolution d’affichage r_F", 3.5, "y");
  const tags = names.map((n, i) => K.tag(n, () => mids[i], { color: cols[i] }));
  const tU = K.tag("uc(F)", new THREE.Vector3(0, 2.4, 0), { big: true });
  const mids = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  return {
    root,
    shadowBox: 7,
    cam: { pos: [3, 6, 7], target: [0, 0.5, 0], pad: 0.9 },
    views: SC.views(() => new THREE.Vector3(0, 0.6, 0), { label: "Dessus", title: "Vue de dessus de l’anneau des contributions", dist: 7, dir: [0, 1, 0.1] }),
    update() {
      const ucal = K.v("Ucal") / 2, uder = K.v("ader") / Math.sqrt(3), ures = (K.v("rF") / 2) / Math.sqrt(3);
      const uc = Math.sqrt(ucal ** 2 + uder ** 2 + ures ** 2);
      const u = [ucal, uder, ures];
      const pct = u.map((x) => (x * x) / (uc * uc));
      segG.forEach((gr) => gr.children.slice().forEach((c) => { gr.remove(c); c.geometry.dispose(); }));
      // anneau 3D : angle ∝ contribution (u²), hauteur ∝ contribution
      let a0 = 0;
      const top = pct.indexOf(Math.max(...pct));
      pct.forEach((p, i) => {
        const len = Math.max(0.001, p * Math.PI * 2);
        const h = 0.3 + p * 1.8;
        const g = new THREE.CylinderGeometry(2.2, 2.2, h, 64, 1, false, a0, len);
        const m = new THREE.Mesh(g, K.mat(cols[i], { rough: 0.4, emissive: cols[i], ei: i === top ? 0.45 : 0.12 }));
        m.position.y = h / 2;
        m.castShadow = true; m.receiveShadow = true;
        K.tip(m, `<b>${names[i]}</b> · ${K.fmt(u[i], 2)} kN<br>${K.fmt(p * 100, 0)} % de u<sub>c</sub>²`);
        segG[i].add(m);
        const am = a0 + len / 2;
        mids[i].set(Math.sin(am) * 1.6, h + 0.2, Math.cos(am) * 1.6);
        tags[i].set(names[i], K.fmt(p * 100, 0) + " %");
        a0 += len;
      });
      tU.set("uc(F) = √(Σ u²)", K.fmt(uc, 2) + " kN · priorité : " + names[top]);
    },
  };
});