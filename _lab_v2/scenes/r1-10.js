/* =====================================================================
   R1-10 Réseaux secs et humides - scènes 3D (mission Valdeau)
   Les grandeurs sont recalculées avec les formules exactes de la v1.
   ===================================================================== */

/* ---------- accueil : diorama du réseau d'adduction ---------- */
defineScene("home", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  const island = K.slab(15, 9, 0.7, P.grass, P.soil, 0.35);
  root.add(island);
  const lawn10 = K.box(14.6, 0.04, 8.6, SC.texMat(K, "grass", { rep: [7, 4] }), 0.03);
  lawn10.position.y = 0.06; lawn10.userData.noFit = true;
  root.add(lawn10);
  // colline du réservoir
  const hillG = new THREE.SphereGeometry(3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const hill = new THREE.Mesh(hillG, SC.texMat(K, "grass", { rep: [5, 3] }));
  hill.scale.set(1.25, 0.62, 1.05);
  hill.position.set(-4.6, 0, -0.6);
  hill.receiveShadow = true;
  root.add(hill);
  // château d'eau
  const tower = K.group();
  const shaft = K.cyl(0.32, 0.42, 2.4, SC.texMat(K, "concrete"), 32);
  shaft.position.y = 1.2;
  const bowl = K.cyl(1.05, 0.45, 0.75, SC.texMat(K, "concrete"), 48);
  bowl.position.y = 2.75;
  const tank = K.cyl(1.05, 1.05, 0.55, SC.texMat(K, "concrete"), 48);
  tank.position.y = 3.4;
  const cap = K.cyl(0.25, 1.1, 0.35, K.mat(P.dark1, { rough: 0.6 }), 48);
  cap.position.y = 3.85;
  const band = K.cyl(1.07, 1.07, 0.09, K.glow(P.acc, 1.4), 48);
  band.position.y = 3.25;
  tower.add(shaft, bowl, tank, cap, band);
  tower.position.set(-4.7, 1.82, -0.7);
  root.add(tower);
  K.tip(tower, "<b>Château d’eau</b><br>La hauteur d’eau stockée donne la charge de départ du réseau.");
  // conduite principale
  const pts = [[-4.7, 1.9, -0.7], [-4.7, 0.25, 1.6], [-1.5, 0.25, 1.6], [-1.5, 0.25, 2.6], [5.6, 0.25, 2.6]];
  const curve = K.path(pts, 0.5);
  const pipeM = K.glass(P.glassC, 0.28);
  root.add(K.tube(curve, 0.13, pipeM, 220, 20));
  const flow = SC.flow(K, curve, 70, 0.055, K.glow(P.acc, 2.2), { speed: 1.4 });
  root.add(flow.mesh);
  // branchements et maisons
  const houses = [];
  const branches = [];
  [[0.6, -1], [2.4, 1], [4.1, -1], [5.4, 1]].forEach(([x, s], i) => {
    const h = K.house({ w: 1.15, d: 0.95, h: 0.75 + (i % 2) * 0.2, windows: 2 });
    h.position.set(x, 0, 2.6 + s * 1.35);
    h.rotation.y = s > 0 ? Math.PI : 0;
    root.add(h);
    houses.push(h);
    const bc = K.path([[x, 0.25, 2.6], [x, 0.25, 2.6 + s * 0.85]], 0.1);
    root.add(K.tube(bc, 0.06, pipeM, 20, 12));
    const bf = SC.flow(K, bc, 6, 0.035, K.glow(P.acc, 2), { speed: 0.55 });
    root.add(bf.mesh);
    branches.push(bf);
  });
  // station de pompage + arbres
  const pumpHouse = K.box(0.9, 0.6, 0.8, SC.texMat(K, "brick"), 0.05);
  pumpHouse.position.set(-1.5, 0.3, 0.9);
  root.add(pumpHouse);
  K.tip(pumpHouse, "<b>Surpresseur</b><br>Ajoute de l’énergie (HMT) quand la charge ne suffit plus.");
  [[-6.6, 2.8], [-2.4, -2.9], [-0.6, -3.2], [1.6, -2.6], [3.8, -3.4], [6.3, -1.2], [-6.4, -3.3], [6.2, 3.6]].forEach(([x, z], i) => {
    const t = SC.tree(K, 0.9 + (i % 3) * 0.25);
    t.position.set(x, 0, z);
    root.add(t);
  });
  root.position.y = -0.6;
  K.tag("Réservoir", () => tower.localToWorld(new THREE.Vector3(0, 2.4, 0)), { value: "charge de départ" });
  K.tag("Conduite", () => new THREE.Vector3(-1.5, 0.1, 1.9), { value: "pertes de charge" });
  K.tag("Abonnés", () => new THREE.Vector3(3.3, 1.7, 2.6), { value: "pression de service" });
  const water = band;
  return {
    root,
    cam: { pos: [7.5, 6.8, 11.5], target: [0.3, 0.6, 0.6], shiftX: 0.2, pad: 0.82 },
    tick(dt, t) {
      flow.step(dt);
      branches.forEach((b) => b.step(dt));
      water.material.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.3;
      houses.forEach((h, i) => h.userData.wins.forEach((w) => { w.material.emissiveIntensity = (P.dark ? 1.1 : 0.35) + 0.25 * Math.sin(t * 0.7 + i * 2.1); }));
    },
  };
});

/* ---------- 01 : débit, section, vitesse, Reynolds ---------- */
defineScene("debit", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ y: -1.75, fade: 14 }));
  const LEN = 9;
  const shellM = K.mat(P.steel, { metal: 0.75, rough: 0.35, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, LEN, 64, 1, true, Math.PI, Math.PI), shellM);
  back.rotation.z = Math.PI / 2;
  back.receiveShadow = true;
  const front = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, LEN, 64, 1, true, 0, Math.PI), K.glass(P.glassC, 0.12));
  front.rotation.z = Math.PI / 2;
  const ringM = K.mat(P.steel, { metal: 0.8, rough: 0.3 });
  const ringL = K.torus(1, 0.05, ringM);
  ringL.rotation.y = Math.PI / 2;
  ringL.position.x = -LEN / 2;
  const ringR = ringL.clone();
  ringR.position.x = LEN / 2;
  const secRing = K.torus(1, 0.03, K.glow(P.acc, 1.8));
  secRing.rotation.y = Math.PI / 2;
  secRing.position.x = -2.8;
  const secDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), K.glow(P.acc, 0.5, 0.16));
  secDisc.rotation.y = Math.PI / 2;
  secDisc.position.x = -2.8;
  const pipe = K.group(back, front, ringL, ringR, secRing, secDisc);
  root.add(pipe);
  K.tip(secDisc, () => `<b>Section S = πD²/4</b><br>${K.txt("v-D")} → ${(Math.PI * (K.v("D") / 1000) ** 2 / 4 * 1e4).toFixed(1).replace(".", ",")} cm²`);
  // supports
  [-3.2, 3.2].forEach((x) => {
    const s = K.box(0.35, 1, 1.2, K.mat(P.dark1), 0.05);
    s.position.set(x, -1.25, 0);
    root.add(s);
  });
  // particules
  const N = 420;
  const im = K.dots(N, 0.035, K.glow(P.acc, 2));
  root.add(im);
  const pr = Array.from({ length: N }, () => ({ x: Math.random() * LEN - LEN / 2, r: Math.sqrt(Math.random()), a: Math.random() * Math.PI * 2, j: Math.random() * 10 }));
  // profil des vitesses
  const NA = 11;
  const arrows = Array.from({ length: NA }, () => { const a = K.arrow(P.acc2, { r: 0.022, glow: 1.1 }); root.add(a); return a; });
  const profPts = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 41 }, () => new THREE.Vector3()));
  const profLine = new THREE.Line(profPts, new THREE.LineBasicMaterial({ color: P.acc2 }));
  root.add(profLine);
  const XP = 2.6;
  const m4 = new THREE.Matrix4();
  const tR = K.tag("Re", new THREE.Vector3(0, 1.55, 0), { big: true });
  const tV = K.tag("v", new THREE.Vector3(XP + 0.6, 1.3, 0));
  const tD = K.tag("D", () => new THREE.Vector3(-2.8, R + 0.2, 0));
  let R = 1, v = 0.03, reg = "Laminaire", vis = 0.5, Re = 0;
  const regCol = () => (reg === "Laminaire" ? P.ok : reg === "Transition" ? P.warn : P.danger);
  function prof(r) {
    // profil normalisé u/umax
    const lam = 1 - r * r;
    const tur = Math.pow(Math.max(1 - r, 0), 1 / 7);
    if (Re < 2000) return lam;
    if (Re < 4000) { const k = (Re - 2000) / 2000; return lam * (1 - k) + tur * k; }
    return tur;
  }
  return {
    root,
    cam: { pos: [2.8, 3.4, 10.8], target: [0.3, -0.1, 0], min: 3, max: 20 },
    views: SC.views(() => new THREE.Vector3(2.6, 0, 0), { label: "Profil", title: "Zoom sur le profil des vitesses dans la section", dist: 3.2, dir: [0.15, 0.25, 1] }),
    update() {
      const Q = K.v("Q") / 1000, D = K.v("D") / 1000, nu = K.v("nu") * 1e-6;
      const S = Math.PI * D * D / 4;
      v = Q / S;
      Re = v * D / nu;
      reg = Re < 2000 ? "Laminaire" : Re < 4000 ? "Transition" : "Turbulent";
      // rayon affiché proportionnel au diamètre réel (la section varie bien en D²)
      R = (K.v("D") / 1000) * 5.6;
      back.scale.set(R, 1, R);
      front.scale.set(R, 1, R);
      [ringL, ringR, secRing].forEach((o) => o.scale.set(R, R, R));
      secDisc.scale.set(R, R, 1);
      vis = 2.6 * Math.sqrt(Math.max(v, 0));
      tR.set("Re = " + K.fmt(Re, 0), reg).color(regCol());
      tR.offset.set(0, R - 1, 0);
      tV.set("v moyenne", K.fmt(v, 3) + " m/s");
      tV.offset.set(0, R - 1, 0);
      tD.set("D", K.txt("v-D"));
      // flèches du profil
      const pmax = Math.min(2.2, 0.35 + vis * 0.45);
      const ys = [];
      for (let i = 0; i < NA; i++) {
        const y = -R + (2 * R * (i + 0.5)) / NA;
        const rr = Math.abs(y) / R;
        const L = prof(rr) * pmax;
        arrows[i].set(new THREE.Vector3(XP, y, 0), new THREE.Vector3(1, 0, 0), L);
        ys.push(y);
      }
      const pos = profPts.attributes.position;
      for (let i = 0; i <= 40; i++) {
        const y = -R + (2 * R * i) / 40;
        pos.setXYZ(i, XP + prof(Math.abs(y) / R) * pmax, y, 0);
      }
      pos.needsUpdate = true;
      im.material.emissive.copy(regCol());
      im.material.color.copy(regCol());
    },
    tick(dt, t) {
      const turb = Re < 2000 ? 0 : Re < 4000 ? (Re - 2000) / 2000 : 1;
      for (let i = 0; i < N; i++) {
        const q = pr[i];
        const u = prof(q.r) * vis * (Re < 2000 ? 2 : 1.22);
        q.x += u * dt;
        if (q.x > LEN / 2) q.x -= LEN;
        let rr = q.r * R * 0.94, a = q.a;
        if (turb > 0) {
          rr += Math.sin(t * 3.1 + q.j + q.x * 2.3) * 0.12 * turb * R;
          a += Math.sin(t * 2.3 + q.j * 1.7 + q.x) * 0.5 * turb;
        }
        rr = Math.min(Math.abs(rr), R * 0.95);
        m4.makeTranslation(q.x, Math.cos(a) * rr, Math.sin(a) * rr);
        im.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
});

/* ---------- 02 : fluides (masse volumique, viscosité) ---------- */
defineScene("fluide", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 12 }));
  const bench = K.slab(11, 5, 0.35, P.slabTop, P.slab, 0.15);
  root.add(bench);
  // bécher
  const BH = 3, BR = 1.05;
  const beaker = K.cyl(BR, BR, BH, K.glass(P.glassC, 0.16), 64, true);
  beaker.position.set(-2.6, BH / 2, 0);
  const bottom = K.cyl(BR, BR, 0.05, K.glass(P.glassC, 0.3), 64);
  bottom.position.set(-2.6, 0.03, 0);
  const lvl = 2.4;
  const liquid = K.cyl(BR * 0.96, BR * 0.96, lvl, K.mat(P.acc, { opacity: 0.45, rough: 0.15 }), 64);
  liquid.position.set(-2.6, lvl / 2 + 0.05, 0);
  liquid.castShadow = false;
  const surf = K.cyl(BR * 0.965, BR * 0.965, 0.01, K.glow(P.acc, 0.8, 0.7), 64);
  surf.position.set(-2.6, lvl + 0.05, 0);
  root.add(beaker, bottom, liquid, surf);
  for (let y = 0.4; y < BH; y += 0.4) {
    const t = K.box(0.2, 0.012, 0.01, K.mat(P.mute));
    t.position.set(-2.6, y, BR + 0.005);
    t.castShadow = false;
    root.add(t);
  }
  // cube témoin de masse volumique « eau » (999 kg/m³)
  const CS = 0.6;
  const cube = K.box(CS, CS, CS, K.mat(P.acc2, { rough: 0.35 }), 0.06);
  cube.position.set(-2.6, 1, 0);
  root.add(cube);
  K.tip(cube, "<b>Cube témoin : ρ = 999 kg/m³</b><br>Il flotte si le fluide est plus dense que l’eau, il coule sinon.");
  // cellule de cisaillement (plaques)
  const X0 = 2.3, W = 3.6, H = 2.2, D = 1.4;
  const plateB = K.box(W + 0.3, 0.12, D + 0.2, K.mat(P.steel, { metal: 0.8, rough: 0.3 }), 0.03);
  plateB.position.set(X0, 0.06, 0);
  const plateT = K.box(W + 0.3, 0.12, D + 0.2, K.mat(P.acc2, { metal: 0.3, rough: 0.35 }), 0.03);
  plateT.position.set(X0, H + 0.18, 0);
  const film = K.box(W, H, D, K.mat(P.acc, { opacity: 0.18, rough: 0.1 }), 0.02);
  film.position.set(X0, H / 2 + 0.12, 0);
  film.castShadow = false;
  root.add(plateB, plateT, film);
  K.tip(plateT, "<b>Plaque mobile</b><br>Vitesse imposée : la force nécessaire est proportionnelle à μ.");
  window.LABV4H && window.LABV4H(K, cube, "rho", "fluide", "Le cube témoin (999 kg/m³)", "glisser vers le haut ou le bas pour modifier la masse volumique ρ du liquide", 3.5, "y");
  window.LABV4H && window.LABV4H(K, plateT, "mu", "fluide", "La plaque mobile de cisaillement", "glisser vers la droite ou la gauche pour régler la viscosité dynamique μ", 4, "x");
  const NL = 7;
  const layerArrows = Array.from({ length: NL }, () => { const a = K.arrow(P.acc, { r: 0.02, glow: 1.2 }); root.add(a); return a; });
  const NP = 140;
  const im = K.dots(NP, 0.04, K.glow(P.acc, 1.8));
  root.add(im);
  const pp = Array.from({ length: NP }, () => ({ x: Math.random() * W, y: Math.random(), z: (Math.random() - 0.5) * D * 0.9 }));
  const force = K.arrow(P.danger, { r: 0.05, glow: 1.3 });
  root.add(force);
  const m4 = new THREE.Matrix4();
  const tD = K.tag("Densité d", () => cube.position.clone().add(new THREE.Vector3(0, CS * 0.6, 0)));
  const tMu = K.tag("Viscosité", new THREE.Vector3(X0, H + 0.55, 0), { big: true });
  const tNu = K.tag("ν = μ/ρ", new THREE.Vector3(-2.6, BH + 0.25, 0));
  let target = 1, cubeY = 1, tauRel = 0.05, mu = 1;
  return {
    root,
    shadowBox: 8,
    cam: { pos: [0.4, 4.2, 9.8], target: [0, 1.4, 0], min: 4, max: 20 },
    views: SC.views(() => cube.position.clone(), { label: "Cube témoin", title: "Zoom sur le cube de masse volumique 999 kg/m³", dist: 2.6 }),
    update() {
      const rho = K.v("rho");
      mu = K.v("mu");
      const d = rho / 999;
      const nu = (mu * 1e-3) / rho;
      // flottaison : fraction immergée = 1/d (sinon le cube coule)
      if (d > 1.0) {
        const frac = Math.min(1, 1 / d);
        target = lvl + 0.05 - CS * frac + CS / 2;
      } else target = 0.05 + CS / 2 + 0.01;
      tauRel = Math.min(1, (mu - 0.3) / 19.7);
      const densRel = Math.min(1, Math.max(0, (rho - 700) / 700));
      const c = P.acc.clone().lerp(P.acc2, densRel * 0.55);
      liquid.material.color.copy(c);
      liquid.material.opacity = 0.3 + tauRel * 0.5;
      film.material.color.copy(c);
      film.material.opacity = 0.12 + tauRel * 0.45;
      tD.set("d = ρ/ρeau", K.fmt(d, 3) + (d > 1.01 ? " · flotte" : d < 0.99 ? " · coule" : " · ≈ eau"));
      tMu.set("μ", K.fmt(mu, 2) + " mPa·s");
      tNu.set("ν = μ/ρ", nu.toExponential(2).replace(".", ",") + " m²/s");
      const fl = 0.35 + Math.log10(1 + mu) * 1.15;
      force.set(new THREE.Vector3(X0 + W / 2 + 0.25, H + 0.18, 0), new THREE.Vector3(1, 0, 0), fl);
      for (let i = 0; i < NL; i++) {
        const yy = (i + 0.5) / NL;
        layerArrows[i].set(new THREE.Vector3(X0 - W / 2 + 0.15, 0.12 + yy * H, D / 2 + 0.05), new THREE.Vector3(1, 0, 0), yy * 1.6);
      }
    },
    tick(dt, t) {
      cubeY = K.damp(cubeY, target, 3, dt || 0.016);
      cube.position.y = cubeY + Math.sin(t * 1.6) * 0.015 * (target > 1 ? 1 : 0);
      cube.rotation.z = Math.sin(t * 1.1) * 0.03 * (target > 1 ? 1 : 0);
      const sp = 1.4;
      for (let i = 0; i < NP; i++) {
        const q = pp[i];
        q.x = (q.x + q.y * sp * dt) % W;
        m4.makeTranslation(X0 - W / 2 + q.x, 0.12 + q.y * H, q.z);
        im.setMatrixAt(i, m4);
      }
      im.instanceMatrix.needsUpdate = true;
      plateT.position.x = X0 + Math.sin(t * 1.2) * 0.04;
    },
  };
});

/* ---------- 03 : hydrostatique ---------- */
defineScene("hydro", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  const s = 0.075; // 1 m réel = 0,075 unité
  const XA = -3.6, XB = 3.6, X0 = -5.2, X1 = 5.2, DZ = 2.4;
  let yB = 0.6, yTop = 4, flowing = false, hLossIll = 0;
  // relief déformé sur place (aucune géométrie recréée quand h bouge)
  const yGround = (x) => {
    const t = K.clamp((x - (XA + 0.6)) / ((XB - 0.6) - (XA + 0.6)), 0, 1);
    return 0.25 + t * t * (3 - 2 * t) * (yB - 0.35);
  };
  const terM = K.mat(P.dark ? "#2b4a3c" : "#a9c9a0", { rough: 0.95, side: THREE.DoubleSide });
  const topG = new THREE.PlaneGeometry(X1 - X0, DZ, 80, 1);
  topG.rotateX(-Math.PI / 2);
  const top = new THREE.Mesh(topG, terM);
  top.receiveShadow = true;
  const sideG = [new THREE.PlaneGeometry(X1 - X0, 1, 80, 1), new THREE.PlaneGeometry(X1 - X0, 1, 80, 1)];
  const sides = sideG.map((g, i) => { const m = new THREE.Mesh(g, terM); m.position.z = i ? -DZ / 2 : DZ / 2; m.receiveShadow = true; return m; });
  const endR = K.box(0.02, 1, DZ, terM);
  root.add(top, ...sides, endR);
  function shapeTerrain() {
    const pt = topG.attributes.position;
    for (let i = 0; i < pt.count; i++) pt.setY(i, yGround(pt.getX(i)));
    pt.needsUpdate = true;
    topG.computeVertexNormals();
    topG.computeBoundingBox(); topG.computeBoundingSphere();
    sideG.forEach((g) => {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) > 0 ? yGround(p.getX(i)) : 0);
      p.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingBox(); g.computeBoundingSphere();
    });
    const yr = yGround(X1);
    endR.scale.y = yr; endR.position.set(X1, yr / 2, 0);
  }
  // initialisation des sommets : rangée haute à y = 0,5, rangée basse à y = -0,5 dans le plan d'origine
  sideG.forEach((g) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) > 0 ? 1 : -1); });
  // conduite : polyligne de tiges réutilisées qui épouse le terrain
  const pipeM = K.mat(P.steel, { metal: 0.7, rough: 0.35 });
  const NSEG = 28;
  // tracé initial non nul (le flux de particules a besoin d'une longueur dès sa création)
  const pipePts = Array.from({ length: NSEG + 1 }, (_, i) => new THREE.Vector3(XA + (XB - XA) * (i / NSEG), 0.35, 0.6));
  const pipeRods = Array.from({ length: NSEG }, () => { const r = K.rod(pipeM, 0.12); root.add(r); return r; });
  const pipeJoints = Array.from({ length: NSEG + 1 }, () => { const j = K.sphere(0.12, pipeM, 16); root.add(j); return j; });
  const pipeCurve = new THREE.CatmullRomCurve3(pipePts);
  const flow = SC.flow(K, pipeCurve, 40, 0.05, K.glow(P.acc, 2.2), { speed: 0.6 });
  root.add(flow.mesh);
  const pzA = SC.piezo(K, 7.2);
  const pzB = SC.piezo(K, 7.2);
  root.add(pzA, pzB);
  const gA = SC.gauge(K, 0.34), gB = SC.gauge(K, 0.34);
  root.add(gA, gB);
  // ligne piézométrique : plan horizontal au repos, ligne inclinée en écoulement
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 1.6), K.glow(P.acc, 0.6, 0.12));
  plane.rotation.x = -Math.PI / 2;
  root.add(plane);
  const pzLine = K.rod(K.glow(P.acc, 2), 0.02);
  root.add(pzLine);
  const dim = K.box(0.03, 1, 0.03, K.glow(P.acc2, 1.6));
  root.add(dim);
  const tA = K.tag("A", () => new THREE.Vector3(XA + 0.55, 0.45, 0.9));
  const tB = K.tag("B", () => new THREE.Vector3(XB - 0.55, yB + 0.1, 0.9));
  const tH = K.tag("h", () => new THREE.Vector3(XB + 1.1, yB / 2, 0));
  const tPl = K.tag("Ligne piézométrique", () => new THREE.Vector3(0, yTop - hLossIll / 2 + 0.15, -0.5), { color: P.acc });
  const tipFn = () => `<b>Piézomètre</b><br>La colonne monte jusqu’à P/(ρg). Au repos, toutes les colonnes affleurent le même plan ; en écoulement, elles baissent dans le sens du courant.`;
  K.tip(pzA, tipFn); K.tip(pzB, tipFn);
  K.tip(top, "<b>Relief</b><br>B est plus haut que A de h.");
  return {
    root,
    shadowBox: 9,
    cam: { pos: [2.5, 4.8, 12.5], target: [0, 2.2, 0], min: 5, max: 26 },
    views: SC.views(() => new THREE.Vector3(XB, yTop - hLossIll, 0.6), { label: "Ménisque B", title: "Zoom sur le haut de la colonne d’eau en B", dist: 2.2 }),
    actions: [{
      label: "En écoulement", toggle: true,
      title: "Ouvrir le robinet en B : l’eau monte de A vers B tant que la charge en A dépasse celle en B (pertes de 2 m, valeur illustrative)",
      run(on) { flowing = on; },
    }],
    update() {
      const PA = K.v("PA"), h = K.v("h"), rho = K.v("rho2");
      const dPbar = rho * SC.g * h / 1e5;
      const PB = PA - dPbar;
      yB = 0.35 + h * s;
      const yA = 0.35;
      shapeTerrain();
      for (let i = 0; i <= NSEG; i++) {
        const x = XA + (XB - XA) * (i / NSEG);
        pipePts[i].set(x, yGround(x) + 0.1, 0.6);
        pipeJoints[i].position.copy(pipePts[i]);
      }
      pipeRods.forEach((r, i) => r.set(pipePts[i], pipePts[i + 1]));
      pipeCurve.updateArcLengths();
      const hA = (PA * 1e5) / (rho * SC.g);
      hLossIll = flowing ? 2 * s : 0; // pertes illustratives de 2 m entre A et B
      const hB = (PB * 1e5) / (rho * SC.g) - (flowing ? 2 : 0);
      pzA.position.set(XA, yA, 0.6);
      pzB.position.set(XB, yB, 0.6);
      pzA.userData.set(hA * s);
      pzB.userData.set(hB * s);
      pzB.children[pzB.children.length - 2].material.emissive.copy(hB < 0 ? P.danger : P.acc);
      gA.position.set(XA - 0.7, yA + 0.6, 0.6);
      gB.position.set(XB + 0.7, yB + 0.6, 0.6);
      gA.userData.set(PA / 8);
      gB.userData.set(Math.max(0, PB - (flowing ? 2 * rho * SC.g / 1e5 : 0)) / 8);
      yTop = yA + hA * s;
      plane.visible = !flowing;
      plane.position.set(0, yTop, 0.6);
      pzLine.set(new THREE.Vector3(XA - 0.9, yTop, 0.6), new THREE.Vector3(XB + 0.9, yTop - hLossIll, 0.6));
      dim.scale.y = Math.max(0.01, yB - yA);
      dim.position.set(XB + 1.1, (yA + yB) / 2, 0.6);
      flow.mesh.visible = flowing;
      tA.set("A", K.fmt(PA, 2) + " bar");
      const PBs = PB - (flowing ? 2 * rho * SC.g / 1e5 : 0);
      tB.set("B", K.fmt(PBs, 2) + " bar").color(PBs < 2.2 ? P.warn : P.ok);
      tH.set("h", K.fmt(h, 1) + " m · ΔP = " + K.fmt(dPbar, 2) + " bar");
      tPl.set("Ligne piézométrique", flowing
        ? "H_A > H_B : l’eau monte de A vers B alors que z_B > z_A"
        : "au repos : P/(ρg) + z = constante");
    },
    tick(dt) { if (flowing) flow.step(dt); },
  };
});

/* ---------- 04 : Bernoulli ---------- */
defineScene("bernoulli", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  const s = 0.075;
  const datum = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), K.mat(P.slabTop, { opacity: 0.85 }));
  datum.rotation.x = -Math.PI / 2;
  datum.position.y = 0.01;
  datum.receiveShadow = true;
  root.add(datum);
  const LEN = 6.4, R0 = 0.32, XT = -0.6;
  // rayon le long de la conduite : constant, ou Venturi (section du col divisée par 3, vitesse × 3)
  let venturi = false;
  const rAt = (x) => {
    if (!venturi) return R0;
    const u = Math.abs(x - XT) / 1.0;
    if (u >= 1) return R0;
    const c = 0.5 - 0.5 * Math.cos(Math.PI * u);
    return R0 / Math.sqrt(3) + (R0 - R0 / Math.sqrt(3)) * c;
  };
  const pipeG = K.group();
  const glassM = K.glass(P.glassC, 0.2);
  const coreM = K.mat(P.acc, { opacity: 0.35 });
  const prof = (rr) => Array.from({ length: 65 }, (_, i) => { const x = -LEN / 2 + (LEN * i) / 64; return new THREE.Vector2(rr(x), x); });
  let pipe = null, core = null;
  function buildPipe() {
    [pipe, core].forEach((m) => { if (m) { pipeG.remove(m); m.geometry.dispose(); } });
    pipe = new THREE.Mesh(new THREE.LatheGeometry(prof(rAt), 48), glassM);
    pipe.rotation.z = -Math.PI / 2;
    core = new THREE.Mesh(new THREE.LatheGeometry(prof((x) => rAt(x) * 0.82), 32), coreM);
    core.rotation.z = -Math.PI / 2;
    core.castShadow = false;
    pipeG.add(pipe, core);
  }
  buildPipe();
  // particules : vitesse locale ∝ 1/section (conservation du débit)
  const NP = 110;
  const pm = K.dots(NP, 0.035, K.glow(P.acc, 2.2));
  pipeG.add(pm);
  const pp = Array.from({ length: NP }, () => ({ x: Math.random() * LEN - LEN / 2, a: Math.random() * Math.PI * 2, r: Math.sqrt(Math.random()) * 0.72 }));
  const m4 = new THREE.Matrix4();
  pipeG.position.x = -0.9;
  root.add(pipeG);
  const legs = [];
  [-3.4, 1.6].forEach((x) => { const l = K.box(0.18, 1, 0.18, K.mat(P.dark1), 0.03); l.position.x = x; legs.push(l); root.add(l); });
  // piézomètre (amont), piézomètre au col du Venturi, tube de Pitot
  const pz = SC.piezo(K, 6.2, 0.07);
  const pzT = SC.piezo(K, 6.2, 0.06);
  const pt = SC.piezo(K, 6.2, 0.07);
  pz.position.x = -2.2; pzT.position.x = XT; pt.position.x = 1.4;
  pipeG.add(pz, pzT, pt);
  const ptTip = K.cyl(0.05, 0.05, 0.5, K.mat(P.steel, { metal: 0.8, rough: 0.3 }), 12);
  ptTip.rotation.z = Math.PI / 2;
  ptTip.position.set(1.15, 0, 0);
  pipeG.add(ptTip);
  // colonne de budget énergie (z / pression / vitesse)
  const X = 3.6;
  const colZ = K.box(0.9, 1, 0.9, SC.texMat(K, "concrete"), 0.04);
  const colP = K.box(0.9, 1, 0.9, K.mat(P.acc, { rough: 0.35, emissive: P.acc, ei: 0.25 }), 0.04);
  const colV = K.box(0.9, 1, 0.9, K.mat(P.acc2, { rough: 0.35, emissive: P.acc2, ei: 0.45 }), 0.04);
  root.add(colZ, colP, colV);
  const Hline = K.box(9.2, 0.03, 0.03, K.glow(P.gold, 2));
  root.add(Hline);
  const Hplane = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 2.6), K.glow(P.gold, 0.4, 0.08));
  Hplane.rotation.x = -Math.PI / 2;
  root.add(Hplane);
  // ligne piézométrique P/(ρg) + z : horizontale sans Venturi, elle plonge au col avec
  const pzl = SC.ribbon(K, 5, P.acc, 0.02);
  // échelle verticale : les hauteurs de la scène sont des hauteurs de charge, en mètres
  const bAx = SC.axis(K, "hauteur de charge (m)");
  root.add(bAx);
  root.add(pzl);
  // loupe : écart Pitot / piézomètre grossi pour être lisible
  const loupe = K.group();
  const ring = K.torus(0.62, 0.025, K.mat(P.steel, { metal: 0.8, rough: 0.3 }));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.6, 48), K.glass(P.glassC, 0.12));
  const lvP = K.box(0.9, 0.025, 0.03, K.glow(P.acc, 2));
  const lvT = K.box(0.9, 0.025, 0.03, K.glow(P.acc2, 2));
  const gap = K.box(0.02, 1, 0.02, K.glow(P.gold, 1.6));
  loupe.add(ring, lens, lvP, lvT, gap);
  root.add(loupe);
  const handle = K.cyl(0.04, 0.04, 0.6, K.mat(P.dark1), 12);
  handle.rotation.z = -Math.PI / 4;
  handle.position.set(0.6, -0.6, 0);
  loupe.add(handle);
  const tz = K.tag("z", () => colZ.position.clone().add(new THREE.Vector3(0.55, 0, 0)), { color: P.concrete });
  const tp = K.tag("P/(ρg)", () => colP.position.clone().add(new THREE.Vector3(0.55, 0, 0)), { color: P.acc });
  const tv = K.tag("v²/(2g)", () => colV.position.clone().add(new THREE.Vector3(0.55, 0.12, 0)), { color: P.acc2 });
  const tH = K.tag("H", () => new THREE.Vector3(-4.2, Hline.position.y + 0.15, 0), { big: true, color: P.gold });
  const tL = K.tag("Loupe", () => loupe.position.clone().add(new THREE.Vector3(0, 0.78, 0)), { color: P.acc2 });
  const tT = K.tag("Col", () => pzT.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, yThroat + 0.2, 0)), { color: P.acc });
  K.tip(pz, "<b>Piézomètre</b><br>Hauteur d’eau = P/(ρg) au-dessus de l’axe.");
  K.tip(pt, "<b>Tube de Pitot</b><br>Face à l’écoulement : il ajoute la charge de vitesse v²/(2g).");
  K.tip(colV, "<b>Charge de vitesse</b><br>Souvent minuscule devant la pression et l’altitude : voir la loupe.");
  K.tip(loupe, "<b>Loupe</b><br>L’écart entre le Pitot et le piézomètre vaut v²/(2g) ; il est grossi pour devenir visible.");
  let v = 1, vis = 1, yThroat = 1;
  return {
    root,
    shadowBox: 9,
    cam: { pos: [1.5, 4.2, 12.5], target: [0.2, 2.3, 0], min: 5, max: 26 },
    views: SC.views(() => pt.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, pt.userData.level || 1, 0)), { label: "Ménisques", title: "Zoom sur le haut du piézomètre et du Pitot", dist: 2.4 }),
    actions: [{
      label: "Venturi", toggle: true,
      title: "Étrangler la conduite : au col la vitesse triple, la pression chute, la charge totale H ne bouge pas",
      run(on) { venturi = on; buildPipe(); },
    }],
    update() {
      const Pb = K.v("Pbern"); v = K.v("vbern"); const z = K.v("zbern");
      const hp = (Pb * 1e5) / (999 * SC.g);
      const hv = (v * v) / (2 * SC.g);
      const H = hp + hv + z;
      const yz = Math.max(0.35, z * s + 0.35);
      pipeG.position.y = yz;
      legs.forEach((l) => { l.scale.y = yz; l.position.y = yz / 2; });
      pz.userData.set(hp * s);
      pt.userData.set((hp + hv) * s);
      pt.userData.level = (hp + hv) * s;
      // au col (section / 3) : v_col = 3v, donc P_col/(ρg) = P/(ρg) + v²/2g - 9 v²/2g = P/(ρg) - 8 v²/2g
      const hpT = hp - 8 * hv;
      pzT.visible = venturi;
      pzT.userData.set(Math.max(hpT, 0) * s);
      yThroat = Math.max(hpT, 0) * s;
      const hz = z * s, hP = hp * s, hV = Math.max(hv * s, 0.004);
      colZ.scale.y = Math.max(hz, 0.004); colZ.position.set(X, hz / 2, 0); colZ.visible = hz > 0.004;
      colP.scale.y = hP; colP.position.set(X, hz + hP / 2, 0);
      colV.scale.y = hV; colV.position.set(X, hz + hP + hV / 2, 0);
      const yH = H * s;
      bAx.userData.set([-4.75, 0, 0.45], [-4.75, Math.max(yH + 0.5, 1.2), 0.45], [{ p: [-4.8, 0.02, 0.45], t: "0 m" }, { p: [-4.8, yH, 0.45], t: K.fmt(H, 1) + " m" }]);
      Hline.position.set(0, yH, 0);
      Hplane.position.set(0, yH, 0);
      const x0 = -0.9 - LEN / 2, x1 = -0.9 + LEN / 2, xt = -0.9 + XT;
      const yP = yz + hp * s, yPt = yz + hpT * s;
      pzl.userData.set(venturi
        ? [[x0, yP, 0.45], [xt - 1, yP, 0.45], [xt, yPt, 0.45], [xt + 1, yP, 0.45], [x1, yP, 0.45]]
        : [[x0, yP, 0.45], [x1, yP, 0.45]]);
      // loupe : facteur adapté pour que l'écart reste lisible
      const zooms = [20, 50, 100, 200, 500];
      const zoom = zooms.find((f) => hv * s * f >= 0.18) || zooms[zooms.length - 1];
      const d = Math.min(0.9, hv * s * zoom);
      loupe.position.set(-0.9 + 1.4 + 1.35, yz + (hp + hv) * s, 0.2);
      lvP.position.set(0, -d / 2, 0.02);
      lvT.position.set(0, d / 2, 0.02);
      gap.scale.y = Math.max(0.01, d); gap.position.set(0.2, 0, 0.03);
      tz.set("z", K.fmt(z, 2) + " m");
      tp.set("P/(ρg)", K.fmt(hp, 2) + " m");
      tv.set("v²/(2g)", K.fmt(hv, 3) + " m");
      tH.set("Charge totale H", K.fmt(H, 2) + " m" + (venturi ? " · inchangée au col" : ""));
      tL.set("Loupe ×" + zoom, "Pitot - piézomètre = v²/(2g) = " + K.fmt(hv, 3) + " m");
      tT.set("Col du Venturi", hpT < 0 ? "dépression : risque de cavitation" : "P/(ρg) = " + K.fmt(hpT, 2) + " m · v = " + K.fmt(3 * v, 2) + " m/s").show(venturi).color(hpT < 0 ? P.danger : P.acc);
      vis = 0.25 + v * 0.9;
    },
    tick(dt) {
      for (let i = 0; i < NP; i++) {
        const q = pp[i];
        const r = rAt(q.x);
        q.x += vis * (R0 / r) * (R0 / r) * dt;
        if (q.x > LEN / 2) q.x -= LEN;
        const rr = q.r * r;
        m4.makeTranslation(q.x, Math.cos(q.a) * rr, Math.sin(q.a) * rr);
        pm.setMatrixAt(i, m4);
      }
      pm.instanceMatrix.needsUpdate = true;
    },
  };
});

/* ---------- 05 : pertes de charge linéaires ---------- */
defineScene("lineaire", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  const H0 = 3.6;
  const NS = 6;
  const pipeM = K.mat(P.steel, { metal: 0.6, rough: 0.4, side: THREE.DoubleSide });
  // conduite de longueur unité étirée selon L : seule la rugosité ou le diamètre la reconstruit
  const pipeG = K.group();
  pipeG.position.y = 0.45;
  root.add(pipeG);
  let pipeBack = null, pipeFront = null, inner = null;
  const flowCurve = new THREE.LineCurve3(new THREE.Vector3(-4, 0.45, 0), new THREE.Vector3(4, 0.45, 0));
  const flow = SC.flow(K, flowCurve, 120, 0.03, K.glow(P.acc, 2.2), { spread: 0.18, speed: 1 });
  root.add(flow.mesh);
  const tubes = Array.from({ length: NS }, () => { const p = SC.piezo(K, 4.2, 0.07); root.add(p); return p; });
  const eLine = K.box(1, 0.035, 0.035, K.glow(P.acc2, 2));
  root.add(eLine);
  const h0Line = K.box(1, 0.02, 0.02, K.mat(P.mute, { opacity: 0.6 }));
  root.add(h0Line);
  const drop = K.box(0.03, 1, 0.03, K.glow(P.danger, 1.5));
  root.add(drop);
  const tHf = K.tag("hf", () => drop.position.clone().add(new THREE.Vector3(0.2, 0, 0)), { big: true, color: P.danger });
  const tL = K.tag("L", () => new THREE.Vector3(0, -0.05, 0.9));
  const tLam = K.tag("λ", () => new THREE.Vector3(-lenV / 2 + 0.3, H0 + 0.3, 0), { color: P.acc2 });
  let lenV = 8, R = 0.25;
  function rebuild(epsMm, Dmm) {
    [pipeBack, pipeFront, inner].forEach((o) => { if (o) { pipeG.remove(o); o.geometry.dispose(); } });
    R = 0.12 + (Dmm / 200) * 0.22;
    pipeBack = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 48, 1, true, Math.PI, Math.PI), pipeM);
    pipeBack.rotation.z = Math.PI / 2;
    pipeBack.receiveShadow = true;
    pipeFront = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 48, 1, true, 0, Math.PI), K.glass(P.glassC, 0.14));
    pipeFront.rotation.z = Math.PI / 2;
    // paroi intérieure : rugosité visible (amplifiée) selon le matériau
    const amp = epsMm >= 0.9 ? 0.05 : epsMm >= 0.2 ? 0.025 : 0.0;
    const ig = new THREE.CylinderGeometry(R * 0.985, R * 0.985, 1, 64, 110, true, Math.PI, Math.PI);
    if (amp > 0) {
      const p = ig.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), y = p.getY(i) * 8;
        const n = (Math.sin(y * 37.1 + x * 11.3) * Math.cos(z * 29.7 + y * 7.9) + Math.sin(y * 91.7 + z * 53.1) * 0.6) * 0.5 + 0.5;
        const k = 1 - amp * n / R;
        p.setX(i, x * k); p.setZ(i, z * k);
      }
      ig.computeVertexNormals();
    }
    inner = new THREE.Mesh(ig, K.mat(epsMm >= 0.9 ? P.concrete : epsMm >= 0.2 ? P.dark1 : "#dfe6ee", { rough: 0.9, side: THREE.DoubleSide, flat: amp > 0 }));
    inner.rotation.z = Math.PI / 2;
    pipeG.add(pipeBack, pipeFront, inner);
  }
  // λ de Darcy selon le régime : même formule que la v1 (64/Re, raccord cubique, Swamee-Jain)
  function lambdaDarcy(Re, epsRel) {
    if (Re < 2000) return { lam: 64 / Math.max(Re, 1), regime: "laminaire" };
    const sj = (Rr) => { const d = Math.log10(epsRel / 3.7 + 5.74 / Math.pow(Rr, 0.9)); return 0.25 / (d * d); };
    if (Re < 4000) { const t = (Re - 2000) / 2000, sm = t * t * (3 - 2 * t); return { lam: (64 / 2000) * (1 - sm) + sj(4000) * sm, regime: "transition" }; }
    const lam = sj(Re);
    const kp = Re * epsRel * Math.sqrt(lam / 8);
    return { lam, regime: kp < 5 ? "turbulent lisse" : kp < 70 ? "turbulent de transition" : "turbulent rugueux" };
  }
  let key = "";
  return {
    root,
    shadowBox: 10,
    cam: { pos: [2.2, 4.4, 12.5], target: [0, 1.8, 0], min: 5, max: 28 },
    views: SC.views(() => new THREE.Vector3(lenV / 2, 0.45, 0), { label: "Paroi", title: "Zoom sur la paroi intérieure et sa rugosité", dist: 1.8, dir: [0.4, 0.5, 1] }),
    update() {
      const L = K.v("L"), Dmm = K.v("Dlin"), D = Dmm / 1000;
      const S = Math.PI * D * D / 4;
      const modeQ = K.s("linMode") === "Q";
      const Q = modeQ ? K.v("Qlin") / 1000 : K.v("vlin") * S;
      const v = modeQ ? Q / S : K.v("vlin");
      const epsMm = +K.s("eps");
      const Re = v * D / 1e-6;
      const res = lambdaDarcy(Re, (epsMm / 1000) / D);
      const lam = res.lam;
      const hf = lam * (L / D) * (v * v) / (2 * SC.g);
      lenV = 3 + (L / 800) * 8;
      const k2 = epsMm + "|" + Dmm;
      if (k2 !== key) { key = k2; rebuild(epsMm, Dmm); }
      [pipeBack, pipeFront, inner].forEach((m) => { m.scale.y = lenV; });
      flowCurve.v1.set(-lenV / 2, 0.45, 0);
      flowCurve.v2.set(lenV / 2, 0.45, 0);
      flowCurve.updateArcLengths();
      flow.speed = 0.3 + Math.min(v, 6) * 1.1;
      // chute de charge : échelle verticale compressée (affichée)
      const dropV = 3.0 * (1 - Math.exp(-hf / 5));
      const x0 = -lenV / 2, x1 = lenV / 2;
      tubes.forEach((t, i) => {
        const f = i / (NS - 1);
        t.position.set(x0 + f * (x1 - x0), 0.45 + R, 0);
        t.userData.set(H0 - f * dropV - R);
      });
      const yA = 0.45 + H0, yB = 0.45 + H0 - dropV;
      const len = Math.hypot(x1 - x0, yA - yB);
      eLine.scale.x = len;
      eLine.position.set(0, (yA + yB) / 2, 0);
      eLine.rotation.z = -Math.atan2(yA - yB, x1 - x0);
      h0Line.scale.x = lenV;
      h0Line.position.set(0, yA, 0);
      drop.scale.y = Math.max(dropV, 0.01);
      drop.position.set(x1 + 0.45, (yA + yB) / 2, 0);
      tHf.set("hf", K.fmt(hf, 2) + " mCE · échelle verticale compressée");
      tL.set("L", K.fmt(L, 0) + " m · D " + Dmm + " mm" + (modeQ ? " · Q " + K.fmt(Q * 1000, 1) + " L/s imposé · v " + K.fmt(v, 2) + " m/s" : ""));
      tLam.set("λ (" + res.regime + ")", K.fmt(lam, 4) + " · Re " + K.fmt(Re, 0));
    },
    tick(dt) { flow.step(dt); },
  };
});

/* ---------- 06 : pertes de charge singulières ---------- */
defineScene("singulier", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  const slab = K.slab(12, 8, 0.3, P.slabTop, P.slab, 0.2);
  root.add(slab);
  const dyn = K.group();
  root.add(dyn);
  const pipeM = K.mat(P.steel, { metal: 0.7, rough: 0.35 });
  const fitM = { c: K.mat(P.acc2, { metal: 0.4, rough: 0.35 }), t: K.mat(P.mute, { metal: 0.5, rough: 0.4 }), v: K.mat(P.ok, { metal: 0.3, rough: 0.4 }) };
  const tK = K.tag("ΣK", new THREE.Vector3(0, 3.1, -2.2), { big: true });
  const tHs = K.tag("hs", new THREE.Vector3(5.2, 2.4, 2.6), { color: P.danger });
  let flow = null;
  const col = K.box(0.7, 1, 0.7, K.mat(P.danger, { emissive: P.danger, ei: 0.35, rough: 0.4 }), 0.05);
  root.add(col);
  K.tip(col, () => `<b>Perte singulière h<sub>s</sub></b><br>ΣK × v²/(2g) : chaque pièce est un « péage » d’énergie.`);
  window.LABV4H && window.LABV4H(K, col, "vsing", "singulier", "La colonne rouge des pertes singulières", "glisser vers le haut ou le bas pour faire varier la vitesse v", 3.5, "y");
  window.LABV4H && window.LABV4H(K, dyn, "nc", "singulier", "Le serpentin et ses coudes", "glisser vers la droite ou la gauche pour ajouter ou retirer des coudes à 90°", 5, "x");
  let key = "";
  function build(nc, nt, nv) {
    dyn.children.slice().forEach((c) => { dyn.remove(c); c.traverse((o) => o.geometry && o.geometry.dispose()); });
    // tracé en serpentin avec exactement nc coudes à 90°
    const pts = [];
    const y = 0.4;
    const W = 9, rows = Math.max(1, Math.ceil((nc + 1) / 2));
    const dz = Math.min(1.6, 6 / Math.max(rows, 1));
    let x = -W / 2, z = -((rows - 1) * dz) / 2 - 0.4;
    pts.push(new THREE.Vector3(x, y, z));
    let dir = 1;
    for (let i = 0; i < nc; i++) {
      if (i % 2 === 0) { x = dir > 0 ? W / 2 : -W / 2; pts.push(new THREE.Vector3(x, y, z)); }
      else { z += dz; pts.push(new THREE.Vector3(x, y, z)); dir = -dir; }
    }
    // dernier tronçon droit
    const last = pts[pts.length - 1];
    if (nc % 2 === 0) pts.push(new THREE.Vector3(dir > 0 ? W / 2 : -W / 2, y, last.z));
    else pts.push(new THREE.Vector3(last.x, y, last.z + dz));
    const curve = K.path(pts, 0.32);
    dyn.add(K.tube(curve, 0.11, pipeM, Math.max(100, pts.length * 40), 16));
    // coudes : manchons colorés aux sommets intérieurs
    for (let i = 1; i < pts.length - 1; i++) {
      const s = K.sphere(0.17, fitM.c, 20);
      s.position.copy(pts[i]);
      K.tip(s, "<b>Coude 90°</b><br>K = 0,4");
      dyn.add(s);
    }
    // segments droits pour placer tés et vannes
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (a.distanceTo(b) > 1.2) segs.push([a, b]);
    }
    const slots = [];
    const per = Math.max(1, Math.ceil((nt + nv) / Math.max(1, segs.length)));
    segs.forEach(([a, b]) => { for (let k = 0; k < per; k++) slots.push(a.clone().lerp(b, (k + 1) / (per + 1))); });
    let si = 0;
    for (let i = 0; i < nt && si < slots.length; i++, si++) {
      const p = slots[si];
      const tee = K.group();
      const body = K.cyl(0.15, 0.15, 0.42, fitM.t, 20);
      body.rotation.z = Math.PI / 2;
      const br = K.cyl(0.09, 0.09, 0.55, fitM.t, 16);
      br.position.y = 0.3;
      tee.add(body, br);
      tee.position.copy(p);
      K.tip(tee, "<b>Té</b><br>K = 0,4");
      dyn.add(tee);
    }
    for (let i = 0; i < nv && si < slots.length; i++, si++) {
      const p = slots[si];
      const vg = K.group();
      const body = K.sphere(0.2, fitM.v, 20);
      body.scale.set(1.2, 1, 1);
      const stem = K.cyl(0.03, 0.03, 0.35, K.mat(P.steel, { metal: 0.9, rough: 0.3 }), 10);
      stem.position.y = 0.3;
      const wheel = K.torus(0.17, 0.025, fitM.v);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.y = 0.48;
      vg.add(body, stem, wheel);
      vg.position.copy(p);
      K.tip(vg, "<b>Vanne ouverte</b><br>K = 0,3");
      dyn.add(vg);
    }
    flow = SC.flow(K, curve, Math.round(curve.getLength() * 7), 0.04, K.glow(P.acc, 2.3), { speed: 1 });
    dyn.add(flow.mesh);
  }
  return {
    root,
    shadowBox: 10,
    cam: { pos: [0.5, 8.5, 10.5], target: [0, 0.4, 0.2], min: 5, max: 26, maxPolar: Math.PI * 0.45 },
    views: SC.views(() => new THREE.Vector3(0, 0.4, 0), { label: "Plan", title: "Vue de dessus : l’inventaire des raccords", dist: 9, dir: [0, 1, 0.12] }),
    update() {
      const nc = K.v("nc"), nt = K.v("nt"), nv = K.v("nv"), v = K.v("vsing"), D = K.v("Dsing") / 1000;
      const k2 = nc + "|" + nt + "|" + nv;
      if (k2 !== key) { key = k2; build(nc, nt, nv); }
      const sumK = nc * 0.4 + nt * 0.4 + nv * 0.3;
      const hs = sumK * v * v / (2 * SC.g);
      const Le = sumK * D / 0.02;
      flow.speed = 0.3 + v * 1.2;
      const hV = Math.max(0.02, 2.6 * (1 - Math.exp(-hs / 0.8)));
      col.scale.y = hV;
      col.position.set(5.6, hV / 2, 2.6);
      tK.set("ΣK", K.fmt(sumK, 2) + "  (" + nc + " coudes · " + nt + " tés · " + nv + " vannes)");
      tHs.set("hs", K.fmt(hs, 3) + " m · Le " + K.fmt(Le, 1) + " m");
      tHs.offset.set(0, hV - 2.4 + 0.3, 0);
    },
    tick(dt) { if (flow) flow.step(dt); },
  };
});

/* ---------- 07 : pompe et HMT ---------- */
defineScene("pompe", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(K.slab(13, 6, 0.3, P.slabTop, P.slab, 0.2));
  // réservoir A
  const resA = K.group();
  const tank = K.cyl(0.9, 0.9, 1.1, SC.texMat(K, "concrete"), 40);
  tank.position.y = 0.55;
  const wat = K.cyl(0.84, 0.84, 0.02, K.glow(P.acc, 1.2), 40);
  wat.position.y = 1.05;
  resA.add(tank, wat);
  resA.position.set(-5.2, 0, 0);
  root.add(resA);
  K.tip(resA, () => `<b>Réservoir amont A</b><br>Charge disponible H<sub>A</sub> = ${K.txt("v-HA")}`);
  // pompe centrifuge (moteur + accouplement + volute)
  const pump = K.group();
  const skid = K.box(2.6, 0.18, 1.1, K.mat(P.dark1, { metal: 0.4, rough: 0.5 }), 0.03);
  skid.position.y = 0.09;
  const motor = K.cyl(0.42, 0.42, 1.2, K.mat(P.steel, { metal: 0.6, rough: 0.35 }), 40);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(-0.55, 0.62, 0);
  const fins = K.group();
  for (let i = 0; i < 14; i++) {
    const f = K.box(1.05, 0.04, 0.04, K.mat(P.steel, { metal: 0.6, rough: 0.4 }));
    const a = (i / 14) * Math.PI * 2;
    f.position.set(-0.55, 0.62 + Math.sin(a) * 0.43, Math.cos(a) * 0.43);
    fins.add(f);
  }
  const guard = K.cyl(0.2, 0.2, 0.4, K.mat(P.gold, { rough: 0.45 }), 24);
  guard.rotation.z = Math.PI / 2;
  guard.position.set(0.25, 0.62, 0);
  const volute = K.cyl(0.55, 0.55, 0.42, K.mat(P.acc, { metal: 0.35, rough: 0.35 }), 48);
  volute.rotation.x = Math.PI / 2;
  volute.position.set(0.8, 0.62, 0);
  const impeller = K.group();
  for (let i = 0; i < 6; i++) {
    const b = K.box(0.42, 0.06, 0.03, K.mat(P.ink, { metal: 0.8, rough: 0.3 }));
    b.geometry.translate(0.21, 0, 0);
    b.rotation.z = (i / 6) * Math.PI * 2;
    impeller.add(b);
  }
  impeller.position.set(0.8, 0.62, 0.23);
  const motorGlow = K.box(0.3, 0.2, 0.02, K.glow(P.ok, 1.5));
  motorGlow.position.set(-0.55, 0.85, 0.43);
  pump.add(skid, motor, fins, guard, volute, impeller, motorGlow);
  pump.position.set(-0.6, 0, 0);
  root.add(pump);
  K.tip(volute, () => `<b>Pompe centrifuge</b><br>Ajoute la HMT : ${K.fmt(state.HMT, 2)} m`);
  K.tip(motor, () => `<b>Moteur</b><br>P élec = P hyd / η = ${K.fmt(state.Pel / 1000, 2)} kW`);
  // point B (château / quartier)
  const B = K.house({ w: 1.4, d: 1.2, h: 1.4, windows: 3 });
  B.position.set(5.2, 0, 0);
  root.add(B);
  // conduites
  const pipeM = K.glass(P.glassC, 0.25);
  const c1b = new THREE.LineCurve3(new THREE.Vector3(-4.3, 0.62, 0), new THREE.Vector3(0.3, 0.62, 0));
  const c2 = K.path([[0.2, 1.15, 0], [0.2, 1.6, 0], [4.4, 1.6, 0], [4.4, 0.6, 0]], 0.3);
  root.add(K.tube(c1b, 0.1, pipeM, 40, 16), K.tube(c2, 0.1, pipeM, 80, 16));
  const f1 = SC.flow(K, c1b, 30, 0.04, K.glow(P.acc, 2.2), { speed: 1 });
  const f2 = SC.flow(K, c2, 46, 0.04, K.glow(P.acc, 2.2), { speed: 1 });
  root.add(f1.mesh, f2.mesh);
  // ligne de charge (énergie) : A → pompe (+HMT) → B (après pertes)
  const eM = K.glow(P.dark ? P.gold : P.acc2, 2);
  const seg1 = K.box(1, 0.04, 0.04, eM), jump = K.box(0.04, 1, 0.04, K.glow(P.ok, 2)), seg2 = K.box(1, 0.04, 0.04, eM), need = K.box(1.6, 0.03, 0.03, K.glow(P.mute, 0.8));
  root.add(seg1, jump, seg2, need);
  const ZB = -1.6;
  [seg1, jump, seg2, need].forEach((o) => { o.position.z = ZB; });
  const tA = K.tag("HA", () => new THREE.Vector3(-5.2, yA + 0.15, ZB));
  const tP = K.tag("HMT", () => new THREE.Vector3(0.2, (yA + yP) / 2, ZB), { big: true, color: P.ok });
  const tB = K.tag("Besoin en B", () => new THREE.Vector3(5.2, yN + 0.15, ZB));
  const tE = K.tag("P élec", () => pump.position.clone().add(new THREE.Vector3(-0.55, 1.35, 0)), { color: P.acc2 });
  const state = { HMT: 0, Pel: 0, Q: 3.5 };
  let yA = 1, yP = 1, yN = 1;
  return {
    root,
    shadowBox: 10,
    cam: { pos: [1.2, 5.2, 11.5], target: [0, 1.6, -0.4], min: 5, max: 26 },
    views: SC.views(() => pump.position.clone().add(new THREE.Vector3(0.3, 0.6, 0)), { label: "Pompe", title: "Zoom sur la pompe et son moteur", dist: 3.2 }),
    update() {
      const HA = K.v("HA"), needH = K.v("HBneed"), hp = K.v("hptot"), Q = K.v("Qpompe") / 1000, eta = K.v("eta") / 100;
      const HMT = Math.max(0, needH + hp - HA);
      const Phyd = Q * 999 * SC.g * HMT;
      const Pel = eta > 0 ? Phyd / eta : Infinity;
      state.HMT = HMT; state.Pel = Pel; state.Q = Q * 1000;
      const sc = 3.8 / Math.max(HA, needH + hp, 1);
      yA = 0.4 + HA * sc;
      yP = 0.4 + (HA + HMT) * sc;
      yN = 0.4 + needH * sc;
      const xA = -5.2, xP = 0.2, xB = 5.2;
      seg1.scale.x = xP - xA; seg1.position.set((xA + xP) / 2, yA, ZB);
      jump.scale.y = Math.max(0.01, yP - yA); jump.position.set(xP, (yA + yP) / 2, ZB); jump.visible = HMT > 0.05;
      const yEnd = 0.4 + (HA + HMT - hp) * sc;
      const L2 = Math.hypot(xB - xP, yP - yEnd);
      seg2.scale.x = L2; seg2.position.set((xP + xB) / 2, (yP + yEnd) / 2, ZB);
      seg2.rotation.z = -Math.atan2(yP - yEnd, xB - xP);
      need.position.set(xB, yN, ZB);
      tA.set("HA", K.fmt(HA, 0) + " m");
      tP.set("HMT", HMT <= 0.05 ? "0 m · pompe inutile" : K.fmt(HMT, 2) + " m").color(HMT <= 0.05 ? P.mute : P.ok);
      tB.set("Besoin B + pertes", K.fmt(needH, 0) + " + " + K.fmt(hp, 1) + " m");
      tE.set("P élec", HMT <= 0.05 ? "à l’arrêt" : K.fmt(Pel / 1000, 2) + " kW");
      motorGlow.material.emissive.copy(HMT <= 0.05 ? P.mute : P.ok);
      motorGlow.material.color.copy(HMT <= 0.05 ? P.mute : P.ok);
      f1.speed = f2.speed = 0.4 + state.Q * 0.18;
    },
    tick(dt) {
      const on = state.HMT > 0.05;
      impeller.rotation.z -= dt * (on ? 6 + state.Q * 1.4 : 0);
      f1.step(dt);
      f2.step(dt);
    },
  };
});