/* =====================================================================
   R2-9 Transferts thermiques et hydriques dans les parois
   (mission Halle de Valvert) - scènes 3D, formules identiques à la v1.
   ===================================================================== */
const R29 = {
  Tint: 20,
  Psat(T) { return T >= 0 ? 610.5 * Math.exp((17.269 * T) / (237.3 + T)) : 610.5 * Math.exp((21.875 * T) / (265.5 + T)); },
  /* ambiance : halo chaud côté intérieur, froid côté extérieur */
  airs(K, xIn, xOut, h = 3) {
    const { THREE, P } = K;
    const g = K.group();
    const mk = (c, x) => {
      const m = SC.air(K, c, 3.2, h + 0.6);
      m.position.set(x, h / 2, -1.2);
      return m;
    };
    g.add(mk(P.hot, xIn), mk(P.cold, xOut));
    const li = new THREE.PointLight(0xff8a50, P.dark ? 6 : 3, 7, 1.6);
    li.position.set(xIn, h * 0.6, 1.2);
    const lo = new THREE.PointLight(0x5aa8ff, P.dark ? 5 : 2, 7, 1.6);
    lo.position.set(xOut, h * 0.6, 1.2);
    g.add(li, lo);
    return g;
  },
  sides(K, D = 2.6) { return SC.sides(K, D); },
  /* liseré de matière posé sur le dessus d'une couche (on lit le matériau réel au-dessus des couleurs thermiques) */
  cap(K, kind, D) {
    const c = K.box(1, 0.05, D, SC.texMat(K, kind), 0.01);
    c.castShadow = false;
    return c;
  },
};

/* ---------- accueil : la halle et sa paroi éclatée ---------- */
defineScene("home", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  root.add(K.slab(16, 10, 0.6, P.dark ? "#2b3d36" : "#cfd9c4", P.soil, 0.35));
  // halle : volume long à toiture à faible pente
  const hall = K.group();
  const body = K.box(7, 2.6, 4.2, SC.texMat(K, "plaster", { rep: [3, 1.2] }), 0.05);
  body.position.y = 1.3;
  const plinth = K.box(7.06, 0.35, 4.26, SC.texMat(K, "concrete", { rep: [4, 0.3] }), 0.03);
  plinth.position.y = 0.17;
  const roof = K.box(7.5, 0.22, 4.7, K.mat(P.dark1, { rough: 0.45, metal: 0.3 }), 0.04);
  roof.position.y = 2.72;
  const acro = K.box(7.6, 0.08, 4.8, K.mat(P.acc2, { rough: 0.4, metal: 0.3, grain: false }), 0.02);
  acro.position.y = 2.6;
  hall.add(body, plinth, acro, roof);
  const frameM = K.mat(P.dark ? "#2b3446" : "#3d4452", { rough: 0.4, metal: 0.5, grain: false });
  for (let i = 0; i < 5; i++) {
    const fr = K.box(1.02, 1.12, 0.06, frameM, 0.02);
    fr.position.set(-2.8 + i * 1.4, 1.45, 2.11);
    const w = K.box(0.9, 1, 0.04, K.glow(P.gold, P.dark ? 1.4 : 0.45));
    w.position.set(-2.8 + i * 1.4, 1.45, 2.14);
    const mul = K.box(0.03, 1, 0.03, frameM);
    mul.position.set(-2.8 + i * 1.4, 1.45, 2.16);
    hall.add(fr, w, mul);
  }
  // panneaux solaires et édicule technique sur le toit
  for (let i = 0; i < 4; i++) {
    const pv = K.box(1.2, 0.05, 0.8, K.mat("#1d2b4a", { rough: 0.25, metal: 0.6, emissive: "#16306a", ei: P.dark ? 0.4 : 0.1, grain: false }), 0.02);
    pv.position.set(-2.4 + i * 1.5, 2.95, -1);
    pv.rotation.x = -0.35;
    hall.add(pv);
  }
  hall.position.set(-2.2, 0, -0.4);
  root.add(hall);
  K.tip(hall, "<b>Halle de Valvert</b><br>Chaque paroi est un empilement de résistances thermiques.");
  // paroi éclatée (enduit, béton, isolant, plâtre) qui flotte devant la halle
  const layers = [
    { n: "Enduit", e: 0.18, k: "plaster", tint: "#efe4d4" },
    { n: "Béton", e: 0.9, k: "concrete" },
    { n: "Isolant", e: 0.8, k: "wool" },
    { n: "Plaque de plâtre", e: 0.14, k: "plaster" },
  ];
  const exp = K.group();
  const tags = [];
  let x = 0;
  layers.forEach((L, i) => {
    const b = K.box(L.e, 2.4, 2.4, SC.texMat(K, L.k, { tint: L.tint }), 0.03);
    b.position.set(x + L.e / 2, 1.5, 0);
    b.userData.base = x + L.e / 2;
    b.userData.i = i;
    exp.add(b);
    tags.push(K.tag(L.n, b, { offset: new THREE.Vector3(0, 1.4, 0) }));
    x += L.e;
  });
  exp.position.set(3.2, 0, 1.4);
  exp.rotation.y = -0.5;
  root.add(exp);
  const heat = SC.stream(K, 70, [x + 0.8, -0.6, 0.5, 2.5, -1, 1], 0.045, K.glow(P.hot, 2)); // de l'intérieur vers l'extérieur
  exp.add(heat.mesh);
  heat.speed = 0.25;
  [[-7, 3.8], [-7.2, -3.6], [6.8, -3.9], [7, 4], [0.5, -4.4], [-4.8, 4.2], [-6.2, 0.2]].forEach(([a, b], i) => { const t = SC.tree(K, 1.1 + (i % 3) * 0.25); t.position.set(a, 0, b); root.add(t); });
  // parvis : allée minérale, gazon, deux usagers pour l'échelle
  const lawn = K.box(15.6, 0.04, 3, SC.texMat(K, "grass", { rep: [8, 1.5] }), 0.02);
  lawn.position.set(0, 0.06, 3.4);
  const path = K.box(2, 0.05, 3, SC.texMat(K, "gravel", { rep: [1, 1.5] }), 0.02);
  path.position.set(-2.4, 0.07, 3.4);
  root.add(lawn, path);
  const p1 = SC.person(K, P.acc2, 0.9); p1.position.set(-2.1, 0.09, 2.9);
  const p2 = SC.person(K, P.acc, 0.85); p2.position.set(-2.8, 0.09, 3.6); p2.rotation.y = 2.4;
  root.add(p1, p2);
  root.position.y = -0.6;
  K.tag("Intérieur 20 °C", () => exp.localToWorld(new THREE.Vector3(x + 0.9, 2.6, 0)), { color: P.hot });
  K.tag("Extérieur froid", () => exp.localToWorld(new THREE.Vector3(-0.9, 2.6, 0)), { color: P.cold });
  return {
    root,
    shadowBox: 10,
    cam: { pos: [8, 6.5, 12], target: [0, 1, 0], shiftX: 0.2, pad: 0.8 },
    tick(dt, t) {
      const k = (Math.sin(t * 0.6) * 0.5 + 0.5);
      exp.children.forEach((b) => { if (b.userData.base != null) b.position.x = b.userData.base + (b.userData.i - 1.5) * 0.45 * k; });
      heat.step(dt);
    },
  };
});

/* ---------- 01 : conduction et résistances en série ---------- */
defineScene("cond", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 12 }));
  root.add(K.slab(9, 4.4, 0.25, P.slabTop, P.slab, 0.15));
  const s = 0.075; // 1 cm = 0,075 unité
  const H = 2.6, D = 2.4;
  const w1 = SC.gradBox(K, 1, H, D, 20, 0, "wool"), w2 = SC.gradBox(K, 1, H, D, 20, 0, "concrete");
  w1.material.bumpScale = 2.2;
  const cap1 = R29.cap(K, "wool", D), cap2 = R29.cap(K, "concrete", D);
  const sides = R29.sides(K, D);
  root.add(w1, w2, cap1, cap2, sides.inn, sides.out);
  const prof = SC.ribbon(K, 3, P.acc, 0.03);
  root.add(prof);
  const air = R29.airs(K, 0, 0, H);
  root.add(air);
  const heat = SC.stream(K, 120, [0, 1, 0.2, H - 0.2, -D / 2 + 0.2, D / 2 - 0.2], 0.04, K.glow(P.hot, 2));
  root.add(heat.mesh);
  const tR1 = K.tag("R1 isolant", () => new THREE.Vector3(xs[0], H + 0.25, D / 2));
  const tR2 = K.tag("R2 béton", () => new THREE.Vector3(xs[1], H + 0.7, D / 2));
  const tTi = K.tag("Interface", () => new THREE.Vector3(xs[2], yT(T12) + 0.18, D / 2 + 0.05), { color: P.acc, big: true });
  // flux φ : flèche au-dessus de la paroi, d'autant plus épaisse que le flux est fort
  const fArrow = SC.flux(K, P.hot, "Flux φ", { big: true, labelOffset: new THREE.Vector3(0, 0.38, 0) });
  root.add(fArrow);
  const tPhi = fArrow.userData.tag;
  // axes du profil de température : T vers le haut, x de l'intérieur vers l'extérieur
  const axT = SC.axis(K, "T (°C)"), axX = SC.axis(K, "x : intérieur → extérieur", { labelOffset: new THREE.Vector3(0.1, -0.22, 0) });
  root.add(axT, axX);
  const tIn = K.tag("Intérieur", () => new THREE.Vector3(xs[4] - 0.9, H * 0.55, 0), { color: P.hot });
  const tOut = K.tag("Extérieur", () => new THREE.Vector3(xs[3] + 0.9, H * 0.55, 0), { color: P.cold });
  K.tip(w1, () => `<b>Isolant</b> · R₁ = e₁/λ₁<br>Grande résistance : la température y chute fortement.`);
  K.tip(w2, () => `<b>Béton</b> · R₂ = e₂/λ₂<br>Conduit bien : faible chute de température.`);
  const xs = [0, 0, 0, 0, 0];
  let T12 = 10, Text = 0, phi = 10;
  const yT = (T) => 0.15 + (T + 12) / 34 * (H - 0.3);
  // poignée : attraper l'interface pour changer l'épaisseur d'isolant e1 (le curseur suit)
  const grip = K.box(0.07, H + 0.3, D + 0.12, K.glow(P.gold, 1.4, 0.75), 0.02);
  root.add(grip);
  let g0 = null;
  K.drag(grip, {
    cursor: "ew-resize",
    tip: "<b>Glisser l’interface</b><br>pour changer l’épaisseur d’isolant e<sub>1</sub>",
    onStart(pt) { g0 = { x: pt.x, e1: K.v("e1") }; },
    onMove(pt) {
      const inp = document.getElementById("e1");
      // la paroi reste centrée : l'interface ne se déplace que de la moitié de la variation d'épaisseur
      const e = Math.round(K.clamp(g0.e1 - (2 * (pt.x - g0.x)) / s, +inp.min, +inp.max) * 2) / 2;
      if (+inp.value !== e) { inp.value = e; inp.dispatchEvent(new Event("input", { bubbles: true })); }
    },
  });
  return {
    root,
    shadowBox: 7,
    cam: { pos: [3.5, 3.2, 8.5], target: [0, 1.3, 0], pad: 0.9 },
    views: SC.views(() => new THREE.Vector3(xs[2], H / 2, D / 2), { label: "Interface", title: "Zoom sur l’interface isolant / béton", dist: 2.8 }),
    update() {
      const e1 = K.v("e1") / 100, l1 = K.v("l1"), e2 = K.v("e2") / 100, l2 = K.v("l2");
      Text = K.v("Text");
      const R1 = e1 / l1, R2 = e2 / l2, Rm = R1 + R2;
      phi = (R29.Tint - Text) / Rm;
      T12 = R29.Tint - phi * R1;
      // intérieur à gauche (isolant), extérieur à droite (béton), largeurs ∝ épaisseurs
      const W1 = e1 * 100 * s, W2 = e2 * 100 * s;
      const x0 = -(W1 + W2) / 2;
      w1.scale.x = W1; w1.position.set(x0 + W1 / 2, H / 2, 0);
      w2.scale.x = W2; w2.position.set(x0 + W1 + W2 / 2, H / 2, 0);
      cap1.scale.x = W1; cap1.position.set(x0 + W1 / 2, H + 0.025, 0);
      cap2.scale.x = W2; cap2.position.set(x0 + W1 + W2 / 2, H + 0.025, 0);
      sides.place(x0 - 1.25, x0 + W1 + W2 + 1.25, Text);
      xs[0] = x0 + W1 / 2; xs[1] = x0 + W1 + W2 / 2; xs[2] = x0 + W1; xs[3] = x0 + W1 + W2; xs[4] = x0;
      w1.userData.paint((u, c) => SC.tcol(K, R29.Tint + (T12 - R29.Tint) * u, -10, 22, c));
      w2.userData.paint((u, c) => SC.tcol(K, T12 + (Text - T12) * u, -10, 22, c));
      prof.userData.set([[xs[4] - 1.2, yT(R29.Tint), D / 2 + 0.05], [xs[4], yT(R29.Tint), D / 2 + 0.05], [xs[2], yT(T12), D / 2 + 0.05], [xs[3], yT(Text), D / 2 + 0.05], [xs[3] + 1.2, yT(Text), D / 2 + 0.05]]);
      air.children[0].position.x = xs[4] - 1.7;
      air.children[1].position.x = xs[3] + 1.7;
      air.children[2].position.x = xs[4] - 1.5;
      air.children[3].position.x = xs[3] + 1.5;
      heat.box = [xs[4] - 1.4, xs[3] + 1.4, 0.2, H - 0.2, -D / 2 + 0.2, D / 2 - 0.2];
      heat.speed = 0.06 + Math.min(phi, 60) * 0.012;
      heat.count = Math.round(20 + Math.min(phi, 60) * 1.6);
      grip.position.set(xs[2], H / 2, 0);
      tR1.set("R₁ isolant", K.fmt(R1, 2) + " m²·K/W");
      tR2.set("R₂ béton", K.fmt(R2, 2) + " m²·K/W");
      tTi.set("T interface", K.fmt(T12, 1) + " °C");
      fArrow.userData.setFlux(new THREE.Vector3(xs[4] - 1.1, H + 0.55, 0), new THREE.Vector3(1, 0, 0), phi, 40, 0.6, xs[3] - xs[4] + 2.2, K.fmt(phi, 1) + " W/m²");
      const zA = D / 2 + 0.05, xA = xs[4] - 1.35;
      axT.userData.set([xA, yT(-12), zA], [xA, yT(25), zA], [{ p: [xA - 0.05, yT(20), zA], t: "20 °C" }, { p: [xA - 0.05, yT(0), zA], t: "0 °C" }]);
      axX.userData.set([xA, yT(-12), zA], [xs[3] + 1.4, yT(-12), zA]);
      tIn.set("Intérieur", R29.Tint + " °C");
      tOut.set("Extérieur", Text + " °C");
    },
    tick(dt, t) { heat.step(dt); sides.step(dt, t); },
  };
});

/* ---------- 02 : surfaces, facteur fRsi et rosée ---------- */
defineScene("surf", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 12 }));
  root.add(K.slab(9, 4.4, 0.25, P.slabTop, P.slab, 0.15));
  const H = 2.6, D = 2.4;
  const wall = SC.gradBox(K, 1.4, H, D, 24, 0, "concrete");
  wall.position.y = H / 2;
  const sides = R29.sides(K, D);
  sides.place(-2.45, 2.45, 0);
  root.add(wall, sides.inn, sides.out);
  const filmIn = K.box(1, H, D, K.mat(P.hot, { opacity: 0.16 }));
  const filmOut = K.box(1, H, D, K.mat(P.cold, { opacity: 0.16 }));
  filmIn.castShadow = filmOut.castShadow = false;
  root.add(filmIn, filmOut, R29.airs(K, -3, 3, H));
  // bandeau pathologique en pied d'angle quand fRsi < 0,90 (risque de moisissures avant même la buée franche)
  const mould = K.box(0.05, 0.42, D - 0.08, K.mat(P.dark ? "#2c3d28" : "#44543c", { opacity: 0, rough: 0.95, emissive: P.warn, ei: 0.18 }), 0.01);
  mould.position.set(-0.71, 0.22, 0);
  mould.castShadow = false;
  root.add(mould);
  K.tip(mould, "<b>Risque fongique en angle</b><br>Dès que f<sub>Rsi</sub> passe sous 0,90, les spores trouvent assez d’humidité dans les angles froids.");
  window.LABV4H && window.LABV4H(K, wall, "Rmat", "surf", "Le mur (résistance R_mat)", "glisser vers la droite ou la gauche pour régler la résistance thermique du mur", 4, "x");
  window.LABV4H && window.LABV4H(K, filmIn, "Td", "surf", "La lame d’air intérieure", "glisser vers le haut ou le bas pour modifier la température de rosée", 3.5, "y");
  // gouttelettes de condensation sur la face intérieure
  const ND = 90;
  const drops = K.dots(ND, 0.045, K.mat(P.glassC, { rough: 0.05, metal: 0, opacity: 0.9, emissive: P.acc, ei: 0.4 }));
  root.add(drops);
  const dp = Array.from({ length: ND }, () => ({ y: 0.15 + Math.random() * (H - 0.3), z: (Math.random() - 0.5) * (D - 0.2), s: 0.5 + Math.random() * 0.8 }));
  const m4 = new THREE.Matrix4();
  const tSi = K.tag("T surface int.", () => new THREE.Vector3(-0.7 - fin, H * 0.72, D / 2 + 0.05), { big: true });
  const tTd = K.tag("T rosée", () => new THREE.Vector3(-0.7 - fin, H * 0.45, D / 2 + 0.05), { color: P.acc });
  const tF = K.tag("fRsi", () => new THREE.Vector3(0, H + 0.3, 0));
  K.tip(filmIn, "<b>Lame d’air intérieure</b> · R<sub>si</sub><br>Résistance superficielle : l’air près du mur est plus froid que l’ambiance.");
  K.tip(filmOut, "<b>Lame d’air extérieure</b> · R<sub>se</sub>");
  let cond = false, grow = 0, fin = 0.3;
  const sProf = SC.ribbon(K, 6, P.acc, 0.028);
  root.add(sProf);
  const sFlux = SC.flux(K, P.hot, "Flux φ", { labelOffset: new THREE.Vector3(0, 0.36, 0) });
  root.add(sFlux);
  const sAx = SC.axis(K, "T (°C)");
  root.add(sAx);
  const tAir = K.tag("Air intérieur", () => new THREE.Vector3(-2.6, yS(20) + 0.12, D / 2 + 0.05), { color: P.hot });
  const yS = (T) => H + 0.35 + (T + 12) / 34 * 1.2;
  return {
    root,
    shadowBox: 7,
    cam: { pos: [-4.2, 3, 7.8], target: [-0.3, 1.3, 0], pad: 0.95 },
    views: SC.views(() => new THREE.Vector3(-0.75, H * 0.55, D / 2), { label: "Surface int.", title: "Zoom sur la face intérieure (rosée)", dist: 2.4, dir: [-0.5, 0.3, 1] }),
    update() {
      const Rmat = K.v("Rmat"), Rsi = K.v("Rsi"), Rse = K.v("Rse"), Text = K.v("Text2"), Td = K.v("Td");
      const Rtot = Rsi + Rmat + Rse;
      const phi = (R29.Tint - Text) / Rtot;
      const Tsi = R29.Tint - phi * Rsi;
      const Tse = Text + phi * Rse;
      const f = (Tsi - Text) / (R29.Tint - Text);
      cond = Tsi < Td;
      sides.place(-0.7 - fin - 1.6, 0.7 + Rse * 6 + 1.6, Text);
      fin = Rsi * 6;
      const fout = Rse * 6;
      filmIn.scale.x = fin; filmIn.position.set(-0.7 - fin / 2, H / 2, 0);
      filmOut.scale.x = fout; filmOut.position.set(0.7 + fout / 2, H / 2, 0);
      wall.userData.paint((u, c) => SC.tcol(K, Tsi + (Tse - Tsi) * u, -10, 22, c));
      tSi.set("T surface int. Tsi", K.fmt(Tsi, 1) + " °C").color(cond ? P.danger : P.ok);
      tTd.set("T rosée", K.fmt(Td, 1) + " °C");
      // profil : l'air de la pièce à 20 °C, puis la chute dans la lame d'air (Rsi) jusqu'à Tsi
      const zz = D / 2 + 0.05;
      sProf.userData.set([[-2.9, yS(R29.Tint), zz], [-0.7 - fin, yS(R29.Tint), zz], [-0.7, yS(Tsi), zz], [0.7, yS(Tse), zz], [0.7 + fout, yS(Text), zz], [2.9, yS(Text), zz]]);
      tAir.set("Air intérieur", R29.Tint + " °C");
      sAx.userData.set([-3.2, yS(-12), zz], [-3.2, yS(24), zz], [{ p: [-3.25, yS(20), zz], t: "20 °C" }, { p: [-3.25, yS(0), zz], t: "0 °C" }]);
      sFlux.userData.setFlux(new THREE.Vector3(-2.6, 0.45, D / 2 + 0.35), new THREE.Vector3(1, 0, 0), phi, 60, 0.8, 5.2, K.fmt(phi, 1) + " W/m²");
      mould.visible = f < 0.9;
      mould.material.opacity = f < 0.9 ? Math.min(0.82, 0.24 + (0.9 - f) * 2.4) : 0;
      tF.set("fRsi", K.fmt(f, 3) + (f >= 0.9 ? " · OK" : " · sous 0,90")).color(f >= 0.9 ? P.ok : P.warn);
    },
    tick(dt, t, rdt) {
      sides.step(dt, t);
      grow = K.clamp(grow + (cond ? 1 : -1.5) * (rdt || 0.016) * 0.6, 0, 1);
      for (let i = 0; i < ND; i++) {
        const q = dp[i];
        const sc = grow * q.s;
        const y = q.y - ((t * 0.05 * q.s) % 0.4) * grow * (q.s > 1.1 ? 1 : 0);
        m4.makeScale(sc, sc * 1.2, sc).setPosition(-0.72, y, q.z);
        drops.setMatrixAt(i, m4);
      }
      drops.instanceMatrix.needsUpdate = true;
      drops.visible = grow > 0.01;
    },
  };
});

/* ---------- 03 : déperditions H_D + H_L ---------- */
defineScene("bilan", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(11, 8, 0.3, P.slabTop, P.slab, 0.2));
  const lawn = K.box(10.6, 0.04, 7.6, SC.texMat(K, "grass", { rep: [5, 4] }), 0.03);
  lawn.position.y = 0.06;
  lawn.userData.noFit = true;
  root.add(lawn);
  [[-4.2, -2.8], [4.3, -2.6], [-4.4, 2.6], [4.1, 3]].forEach(([x, z], i) => { const t = SC.tree(K, 1.2 + (i % 2) * 0.3); t.position.set(x, 0.08, z); root.add(t); });
  const walker = SC.person(K, P.acc2, 0.75); walker.position.set(2.6, 0.08, 2.6); walker.rotation.y = -0.6;
  root.add(walker);
  const house = K.group();
  root.add(house);
  window.LABV4H && window.LABV4H(K, house, "Um", "bilan", "Les façades du pavillon", "glisser vers la droite ou la gauche pour régler le coefficient thermique U_m des murs", 4.5, "x");
  window.LABV4H && window.LABV4H(K, walker, "HL", "bilan", "L’auditeur thermique (ponts linéiques)", "glisser vers le haut ou le bas pour faire varier les ponts thermiques H_L", 3.5, "y");
  const walls = [];
  const wallM = SC.texMat(K, "plaster", { rep: [2, 1] });
  const winM = K.mat(P.glassC, { rough: 0.1, metal: 0.2, emissive: P.cold, ei: 0.2 });
  const bridgeM = K.glow(P.hot, 1.5);
  const arrowsW = [], arrowsV = [];
  for (let i = 0; i < 8; i++) { const a = K.arrow(P.hot, { r: 0.05, glow: 1.2 }); arrowsW.push(a); root.add(a); }
  for (let i = 0; i < 4; i++) { const a = K.arrow(P.acc, { r: 0.05, glow: 1.4 }); arrowsV.push(a); root.add(a); }
  const tHD = K.tag("HD", () => new THREE.Vector3(0, dims.h + 1.2, 0), { big: true });
  const tHL = K.tag("HL ponts", () => new THREE.Vector3(dims.w / 2, 0.15, dims.d / 2 + 0.1), { color: P.hot });
  const tE = K.tag("E saison", () => new THREE.Vector3(-dims.w / 2, dims.h + 0.5, -dims.d / 2), { color: P.gold });
  const dims = { w: 4, d: 3, h: 2.2 };
  let key = "";
  function build(Am, Av, HLv) {
    house.children.slice().forEach((c) => { house.remove(c); c.traverse((o) => o.geometry && o.geometry.dispose()); });
    const sc = Math.sqrt(Am / 60);
    dims.w = 4.2 * sc; dims.d = 3 * sc; dims.h = 2.2;
    const { w, d, h } = dims;
    const th = 0.18;
    const mk = (W, D, x, z) => { const b = K.box(W, h, D, wallM, 0.02); b.position.set(x, h / 2, z); house.add(b); walls.push(b); return b; };
    walls.length = 0;
    const front = mk(w, th, 0, d / 2), back = mk(w, th, 0, -d / 2);
    mk(th, d, -w / 2, 0); mk(th, d, w / 2, 0);
    const roof = K.box(w + 0.3, 0.16, d + 0.3, K.mat(P.dark1, { rough: 0.45, metal: 0.3 }), 0.03);
    const acro = K.box(w + 0.36, 0.06, d + 0.36, K.mat(P.acc2, { rough: 0.4, grain: false }), 0.02);
    acro.position.y = h + 0.02;
    house.add(acro);
    const plinth = K.box(w + 0.02, 0.22, d + 0.02, SC.texMat(K, "concrete"), 0.02);
    plinth.position.y = 0.11;
    house.add(plinth);
    roof.position.y = h + 0.08;
    house.add(roof);
    // vitrages : surface ∝ Av, répartis sur la façade avant
    const nw = 3;
    const ww = Math.min(w / nw - 0.25, Math.sqrt(Av / 18) * 0.95);
    const wh = Math.min(h - 0.5, ww * 1.15);
    for (let i = 0; i < nw; i++) {
      const g = K.box(ww, wh, 0.05, winM, 0.02);
      g.position.set(-w / 2 + (w / nw) * (i + 0.5), h * 0.55, d / 2 + 0.1);
      const fr = K.box(ww + 0.1, wh + 0.1, 0.04, K.mat(P.dark ? "#2b3446" : "#3d4452", { rough: 0.4, metal: 0.5, grain: false }), 0.02);
      fr.position.set(g.position.x, g.position.y, d / 2 + 0.085);
      house.add(fr);
      K.tip(g, () => `<b>Vitrage</b> · H<sub>D,v</sub> = U<sub>v</sub>·A<sub>v</sub> = ${K.fmt(K.v("Uv") * K.v("Av"), 1)} W/K`);
      house.add(g);
    }
    // ponts thermiques : liaisons murs/plancher et angles (épaisseur ∝ HL)
    const r = 0.02 + Math.min(HLv, 40) * 0.0035;
    const edges = [
      [[-w / 2, 0.02, d / 2], [w / 2, 0.02, d / 2]], [[-w / 2, 0.02, -d / 2], [w / 2, 0.02, -d / 2]],
      [[-w / 2, 0.02, -d / 2], [-w / 2, 0.02, d / 2]], [[w / 2, 0.02, -d / 2], [w / 2, 0.02, d / 2]],
      [[-w / 2, 0, d / 2], [-w / 2, h, d / 2]], [[w / 2, 0, d / 2], [w / 2, h, d / 2]],
      [[-w / 2, h, d / 2], [w / 2, h, d / 2]],
    ];
    edges.forEach(([a, b]) => {
      const c = new THREE.LineCurve3(new THREE.Vector3(...a).add(new THREE.Vector3(0, 0, 0.1 * Math.sign(a[2] || 1))), new THREE.Vector3(...b).add(new THREE.Vector3(0, 0, 0.1 * Math.sign(b[2] || 1))));
      const t = K.tube(c, r, bridgeM, 4, 8);
      t.visible = HLv > 0.2;
      K.tip(t, () => `<b>Pont thermique</b> · H<sub>L</sub> = ${K.fmt(K.v("HL"), 1)} W/K<br>Fuite linéique aux jonctions.`);
      house.add(t);
    });
    walls.forEach((wl) => K.tip(wl, () => `<b>Mur</b> · H<sub>D,m</sub> = U<sub>m</sub>·A<sub>m</sub> = ${K.fmt(K.v("Um") * K.v("Am"), 1)} W/K`));
  }
  return {
    root,
    shadowBox: 9,
    cam: { pos: [6, 5, 8.5], target: [0, 1, 0], pad: 0.85 },
    views: SC.views(() => new THREE.Vector3(dims.w / 2, 0.3, dims.d / 2), { label: "Jonctions", title: "Zoom sur l’angle et la liaison mur / plancher", dist: 3 }),
    update() {
      const Um = K.v("Um"), Am = K.v("Am"), Uv = K.v("Uv"), Av = K.v("Av"), HL = K.v("HL");
      const DJU = K.v("DJU");
      const HDm = Um * Am, HDv = Uv * Av, HD = HDm + HDv, Htot = HD + HL;
      const E = (Htot * 24 * DJU) / 1000;
      const k2 = Am + "|" + Av + "|" + (HL > 0.2) + "|" + Math.round(HL);
      if (k2 !== key) { key = k2; build(Am, Av, HL); }
      // teinte « caméra thermique » des murs selon U (plus U est grand, plus la façade est chaude vue de dehors)
      const cW = SC.tcol(K, -8 + Um * 14, -10, 22);
      wallM.color.set(0xffffff).lerp(cW, 0.7);
      const { w, d, h } = dims;
      const Lw = 0.25 + Math.min(HDm, 220) / 220 * 1.4;
      const Lv = 0.25 + Math.min(HDv, 200) / 200 * 1.6;
      const pos = [[-w / 4, h * 0.3, -d / 2, 0, 0, -1], [w / 4, h * 0.3, -d / 2, 0, 0, -1], [-w / 2, h * 0.5, 0, -1, 0, 0], [w / 2, h * 0.5, 0, 1, 0, 0], [-w / 2, h * 0.3, -d / 4, -1, 0, 0], [w / 2, h * 0.3, d / 4, 1, 0, 0], [0, h + 0.2, 0, 0, 1, 0], [-w / 3, h + 0.2, -d / 4, 0, 1, 0]];
      arrowsW.forEach((a, i) => { const p = pos[i]; a.set(new THREE.Vector3(p[0] + p[3] * 0.12, p[1], p[2] + p[5] * 0.12), new THREE.Vector3(p[3], p[4], p[5]), Lw); });
      arrowsV.forEach((a, i) => { a.set(new THREE.Vector3(-w / 2 + (w / 3) * (i % 3 + 0.5), h * 0.55, d / 2 + 0.15), new THREE.Vector3(0, 0, 1), Lv); a.visible = i < 3; });
      tHD.set("HD = Σ U·A", K.fmt(HD, 1) + " W/K · Htot " + K.fmt(Htot, 1) + " W/K");
      tHL.set("HL ponts", K.fmt(HL, 1) + " W/K · " + K.fmt(Htot > 0 ? (HL / Htot) * 100 : 0, 0) + " %");
      tE.set("E chauffage (saison)", K.fmt(E, 0) + " kWh");
    },
  };
});

/* ---------- 04 : Glaser (vapeur d'eau) ---------- */
defineScene("glaser", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 12 }));
  root.add(K.slab(10, 4.6, 0.25, P.slabTop, P.slab, 0.15));
  const H = 2.6, D = 2.4;
  const pv = K.box(0.05, H, D, K.mat(P.acc2, { opacity: 0.85, rough: 0.3 }), 0);
  const l1 = K.box(1, H, D, SC.texMat(K, "wool"), 0.02);
  const l2 = K.box(1, H, D, SC.texMat(K, "concrete"), 0.02);
  const condSheet = K.box(0.035, H - 0.14, D - 0.1, K.glow(P.danger, 1.0, 0.32), 0.01);
  condSheet.castShadow = false;
  const sides = R29.sides(K, D);
  root.add(pv, l1, l2, condSheet, R29.airs(K, -3.6, 3.6, H), sides.inn, sides.out);
  K.tip(pv, "<b>Pare-vapeur</b><br>Grand S<sub>d</sub> côté chaud : il freine la vapeur avant qu’elle n’atteigne le froid.");
  K.tip(l1, () => `<b>Isolant</b> · S<sub>d1</sub> = ${K.txt("v-Sd1")}`);
  K.tip(l2, () => `<b>Paroi extérieure</b> · S<sub>d2</sub> = ${K.txt("v-Sd2")}`);
  window.LABV4H && window.LABV4H(K, pv, "SdPV", "glaser", "La membrane pare-vapeur", "glisser vers la droite ou la gauche pour poser ou renforcer le pare-vapeur (S_d,PV)", 4, "x");
  window.LABV4H && window.LABV4H(K, l1, "HRi", "glaser", "L’isolant traversé par la vapeur", "glisser vers le haut ou le bas pour faire varier l’humidité relative intérieure HR_i", 4, "y");
  const vap = SC.stream(K, 220, [0, 1, 0.15, H - 0.15, -D / 2 + 0.15, D / 2 - 0.15], 0.035, K.mat("#e8f4ff", { opacity: 0.85, emissive: P.acc, ei: 0.5 }));
  root.add(vap.mesh);
  const NI = 60;
  const ice = K.dots(NI, 0.06, K.glow(P.danger, 1.2, 0.9));
  root.add(ice);
  const ip = Array.from({ length: NI }, () => ({ y: 0.15 + Math.random() * (H - 0.3), z: D / 2 + 0.02 - Math.random() * 0.12, dx: (Math.random() - 0.5) * 0.12, s: 0.5 + Math.random() * 0.7 }));
  const rPv = SC.ribbon(K, 4, P.acc, 0.03), rPs = SC.ribbon(K, 4, P.danger, 0.022);
  root.add(rPv, rPs);
  const m4 = new THREE.Matrix4();
  const tIf = K.tag("Interface", () => new THREE.Vector3(xIf, H + 0.35, 0), { big: true });
  const tPv = K.tag("Pv", () => new THREE.Vector3(xs.in - 0.4, yP(PvI) + H + 0.1, D / 2), { color: P.acc });
  const tPs = K.tag("Psat", () => new THREE.Vector3(xs.out + 1.1, yP(Ps0) + H - 0.05, D / 2), { color: P.danger });
  let risk = false, grow = 0, xIf = 0, PvI = 1000, Ps0 = 500, jumpY = 3;
  const tJ = K.tag("Saut au pare-vapeur", () => new THREE.Vector3(xs.in - 0.05, jumpY, D / 2 + 0.05), { color: P.acc2 });
  const xs = { in: 0, out: 0 };
  const yP = (p) => 0.2 + p / 2400 * 1.3;
  const gAxP = SC.axis(K, "p (Pa)"), gAxX = SC.axis(K, "intérieur → extérieur", { labelOffset: new THREE.Vector3(0.1, -0.22, 0) });
  root.add(gAxP, gAxX);
  return {
    root,
    shadowBox: 7,
    cam: { pos: [3.5, 4.2, 8.8], target: [0, 1.7, 0], pad: 0.95 },
    views: SC.views(() => new THREE.Vector3(xIf, H / 2, D / 2), { label: "Interface", title: "Zoom sur l’interface froide où la vapeur peut condenser", dist: 2.6 }),
    update() {
      const HRi = K.v("HRi") / 100, Sd1 = K.v("Sd1"), Sd2 = K.v("Sd2"), SdPV = K.v("SdPV");
      const T = [20, 12, 2, -2];
      const Ps = T.map(R29.Psat);
      const PvInt = HRi * Ps[0];
      const PvExt = 0.8 * R29.Psat(-2);
      const SdW = SdPV + Sd1, SdT = SdW + Sd2;
      const PvIf = PvInt - (PvInt - PvExt) * (SdW / SdT);
      risk = PvIf > Ps[2];
      PvI = PvInt; Ps0 = Ps[3];
      // intérieur à gauche : air | pare-vapeur | isolant | paroi extérieure | air extérieur
      const W2 = 0.9, W1 = 1.5;
      const x0 = -(W1 + W2) / 2;
      l1.scale.x = W1; l1.position.set(x0 + W1 / 2, H / 2, 0);
      l2.scale.x = W2; l2.position.set(x0 + W1 + W2 / 2, H / 2, 0);
      pv.position.set(x0 - 0.03, H / 2, 0);
      pv.visible = true;
      pv.material.opacity = SdPV > 0 ? 0.38 + Math.min(SdPV, 50) / 50 * 0.58 : 0.12;
      xIf = x0 + W1; xs.in = x0; xs.out = x0 + W1 + W2;
      condSheet.position.set(xIf, H / 2, 0);
      condSheet.visible = risk;
      sides.place(x0 - 1.3, xs.out + 1.3, -2);
      // courbes Pv (réelle) et Psat(T) au-dessus de la paroi
      const z = D / 2 + 0.05;
      const top = H + 0.05;
      // le pare-vapeur est mince mais très résistant à la vapeur : Pv y chute d'un coup (saut vertical)
      const PvPV = PvInt - (PvInt - PvExt) * (SdPV / SdT);
      rPv.userData.set([[xs.in - 1.2, top + yP(PvInt), z], [xs.in - 0.06, top + yP(PvInt), z], [xs.in, top + yP(PvPV), z], [xIf, top + yP(PvIf), z], [xs.out, top + yP(PvExt), z], [xs.out + 1.2, top + yP(PvExt), z]]);
      jumpY = top + yP((PvInt + PvPV) / 2);
      tJ.set("Saut au pare-vapeur", "ΔPv = " + K.fmt(PvInt - PvPV, 0) + " Pa").show(SdPV > 0);
      rPs.userData.set([[xs.in - 1.2, top + yP(Ps[0]), z], [xs.in, top + yP(Ps[1]), z], [xIf, top + yP(Ps[2]), z], [xs.out, top + yP(Ps[3]), z], [xs.out + 1.2, top + yP(Ps[3]), z]]);
      const xa = xs.in - 1.45;
      gAxP.userData.set([xa, top + yP(0), z], [xa, top + yP(2700), z], [{ p: [xa - 0.05, top + yP(1000), z], t: "1 000 Pa" }, { p: [xa - 0.05, top + yP(2000), z], t: "2 000 Pa" }]);
      gAxX.userData.set([xa, top + yP(0), z], [xs.out + 1.45, top + yP(0), z]);
      vap.box = [xs.in - 1.6, xs.out + 1.4, 0.15, H - 0.15, -D / 2 + 0.15, D / 2 - 0.15];
      vap.speed = 0.05 + 0.18 / (1 + SdT * 0.15);
      vap.count = Math.round(40 + HRi * 180);
      vap.yfn = null;
      tIf.set("Interface isolant / paroi", risk ? "Pv " + K.fmt(PvIf, 0) + " > Psat " + K.fmt(Ps[2], 0) + " Pa · condensation" : "Pv " + K.fmt(PvIf, 0) + " < Psat " + K.fmt(Ps[2], 0) + " Pa").color(risk ? P.danger : P.ok);
      tPv.set("Pv réelle", K.fmt(PvInt, 0) + " Pa");
      tPs.set("Psat(T)", "seuil de saturation");
    },
    tick(dt, t, rdt) {
      vap.step(dt);
      sides.step(dt, t);
      grow = K.clamp(grow + (risk ? 1 : -1.5) * (rdt || 0.016) * 0.5, 0, 1);
      for (let i = 0; i < NI; i++) {
        const q = ip[i];
        const sc = grow * q.s;
        m4.makeScale(sc, sc, sc).setPosition(xIf + q.dx, q.y, q.z);
        ice.setMatrixAt(i, m4);
      }
      ice.instanceMatrix.needsUpdate = true;
      ice.visible = grow > 0.01;
    },
  };
});

/* ---------- 05 : inertie, déphasage et amortissement ---------- */
defineScene("dyn", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(10, 5, 0.25, P.slabTop, P.slab, 0.15));
  const H = 2.6, D = 2.4;
  const wall = SC.gradBox(K, 1, H, D, 40, 0, "concrete");
  const sides = R29.sides(K, D);
  const clouds = [SC.cloud(K, 0.8), SC.cloud(K, 0.6)];
  clouds[0].position.set(-3.5, 4.4, -1.2); clouds[1].position.set(-1.2, 5, -1.6);
  const matSample = K.box(0.46, 0.46, 0.46, SC.texMat(K, "wood"), 0.05);
  matSample.position.set(2.9, 0.28, 1.4);
  root.add(wall, matSample, sides.inn, sides.out, ...clouds);
  K.tip(matSample, "<b>Échantillon matériau</b><br>Glisser verticalement pour régler la conductivité thermique λ.");
  window.LABV4H && window.LABV4H(K, wall, "ed", "dyn", "L’épaisseur de la paroi", "glisser vers la droite ou la gauche pour modifier l’épaisseur e de la paroi", 4.5, "x");
  window.LABV4H && window.LABV4H(K, matSample, "ld", "dyn", "L’échantillon de matériau", "glisser vers le haut ou le bas pour régler la conductivité λ", 3.5, "y");
  const sun = SC.sun(K, 0.35);
  sun.userData.noFit = true;
  const sunLight = new THREE.PointLight(0xffd28a, 8, 14, 1.4);
  sun.add(sunLight);
  root.add(sun);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.008, 6, 80, Math.PI), K.mat(P.mute, { opacity: 0.4 }));
  arc.position.set(-1.5, 0.2, 0);
  arc.rotation.y = Math.PI / 2;
  root.add(arc);
  const clock = K.tag("Heure", new THREE.Vector3(0, H + 0.8, 0), { big: true });
  const tOut = K.tag("Face extérieure", () => new THREE.Vector3(x0 - 0.1, H * 0.85, D / 2), { color: P.hot });
  const tIn = K.tag("Face intérieure", () => new THREE.Vector3(x1 + 0.1, H * 0.85, D / 2), { color: P.acc });
  const tDt = K.tag("Déphasage", () => new THREE.Vector3((x0 + x1) / 2, 0.25, D / 2 + 0.2));
  K.tip(wall, () => `<b>Onde de chaleur</b><br>La paroi retarde (Δt) et écrase (A) l’onde journalière du dehors.`);
  let dtH = 8, A = 0.2, x0 = -0.8, x1 = 0.8, hour = 8;
  const Tm = 26, Ta = 9;
  return {
    root,
    shadowBox: 8,
    cam: { pos: [3.5, 3.6, 9], target: [0, 1.6, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(0, H / 2, D / 2), { label: "Paroi", title: "Zoom sur l’onde de chaleur dans l’épaisseur", dist: 3 }),
    update() {
      const e = K.v("ed") / 100, lam = K.v("ld"), rho = K.v("rd"), cp = K.v("cp");
      const a = lam / (rho * cp);
      const T0 = 86400;
      dtH = (e * Math.sqrt(T0 / (4 * Math.PI * a))) / 3600;
      A = Math.exp(-e * Math.sqrt(Math.PI / (a * T0)));
      const W = e * 100 * 0.07;
      wall.scale.x = W;
      x0 = -W / 2; x1 = W / 2;
      wall.position.set(0, H / 2, 0);
      sides.place(x0 - 1.35, x1 + 1.35, 20);
      // extérieur à gauche (côté soleil), intérieur à droite
      sides.inn.position.x = x1 + 1.35; sides.out.position.x = x0 - 1.35;
      const col = P.concrete.clone().lerp(P.wood, Math.max(0, 1 - rho / 2500) * 0.6);
      wall.material.color.set(0xffffff);
      wall.userData.base = col;
      tDt.set("Δt déphasage", K.fmt(dtH, 1) + " h · A = " + K.fmt(A, 3));
    },
    tick(dt, t) {
      hour = (hour + dt * 2.4) % 24; // une journée en 10 s
      sides.step(dt, t);
      clouds.forEach((c, i) => { c.position.x = -4.5 + ((t * (0.12 + i * 0.05) + i * 3) % 6); });
      const w = (2 * Math.PI) / 24;
      const Text = (h) => Tm + Ta * Math.sin(w * (h - 9));
      // température dans l'épaisseur : onde amortie et retardée (profil exponentiel)
      wall.userData.paint((u, c) => {
        const ph = dtH * u, am = Math.pow(A, u);
        SC.tcol(K, Tm + Ta * am * Math.sin(w * (hour - ph - 9)), 15, 36, c);
      });
      const sa = ((hour - 6) / 12) * Math.PI;
      const up = hour > 6 && hour < 18;
      sun.position.set(-1.5 - Math.cos(sa) * 0.2 - 1.2, 0.2 + Math.max(-0.5, Math.sin(sa)) * 4.2, Math.cos(sa) * 4.2);
      sun.visible = up;
      const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
      clock.set("Heure solaire", String(hh).padStart(2, "0") + " h " + String(mm).padStart(2, "0"));
      tOut.set("Face ext.", K.fmt(Text(hour), 1) + " °C");
      tIn.set("Face int.", K.fmt(Tm + Ta * A * Math.sin(w * (hour - dtH - 9)), 1) + " °C");
    },
  };
});

/* ---------- 06 : ITI ou ITE (jonction mur / plancher) ---------- */
defineScene("rehab", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  // même orientation que le schéma 2D : intérieur (plancher) à gauche, extérieur à droite
  const H = 2.8, D = 2.6;
  const wall = K.box(0.9, H * 2 + 0.3, D, SC.texMat(K, "concrete", { rep: [0.5, 2.5] }), 0.02);
  wall.position.set(0, H, 0);
  const floor = K.box(4.2, 0.35, D, SC.texMat(K, "concrete", { rep: [2, 0.3] }), 0.02);
  floor.position.set(-2.1 - 0.45, H, 0);
  const iso = [K.box(1, H - 0.2, D, SC.texMat(K, "wool"), 0.02), K.box(1, H - 0.2, D, SC.texMat(K, "wool"), 0.02)];
  const isoExt = K.box(1, H * 2 + 0.3, D, SC.texMat(K, "wool", { rep: [1, 2] }), 0.02);
  // l'étage habité : parquet, radiateur, occupant ; dehors : gazon au pied de la façade
  const parquet = K.box(3.4, 0.04, D - 0.1, SC.texMat(K, "wood", { rep: [3, 2] }), 0.01);
  parquet.position.set(-3.0, H + 0.195, 0);
  const rad = SC.radiator(K, 7); rad.position.set(-2.6, H + 0.2, -D / 2 + 0.25);
  const occ = SC.person(K, P.acc2, 0.85); occ.position.set(-3.6, H + 0.2, 0.3); occ.rotation.y = 0.8;
  const lawn = K.box(3.2, 0.05, D + 1, SC.texMat(K, "grass", { rep: [2, 2] }), 0.02);
  lawn.position.set(2.4, 0.025, 0); lawn.userData.noFit = true;
  const tr = SC.tree(K, 1.6); tr.position.set(3.2, 0.05, -0.6);
  root.add(parquet, rad, occ, lawn, tr);
  const bridge = K.box(0.95, 0.4, D + 0.02, K.glow(P.hot, 1.2, 0.85));
  root.add(wall, floor, iso[0], iso[1], isoExt, bridge, R29.airs(K, -3, 3, H * 2));
  K.tip(bridge, "<b>Pont thermique de plancher</b><br>En ITI, le plancher traverse l’isolant : fuite de chaleur concentrée.");
  K.tip(wall, "<b>Béton</b><br>En ITE, sa masse reste côté chaud : utile pour le confort d’été.");
  window.LABV4H && window.LABV4H(K, wall, "HLr", "rehab", "Le nez de dalle / voile béton", "glisser vers le haut ou le bas pour régler le pont thermique linéique HL", 3.5, "y");
  const leak = SC.stream(K, 60, [-2.5, 2.2, H - 0.15, H + 0.15, -D / 2 + 0.2, D / 2 - 0.2], 0.045, K.glow(P.hot, 2.2));
  root.add(leak.mesh);
  const tU = K.tag("U mur", new THREE.Vector3(0, H * 2 + 0.6, 0), { big: true });
  const tB = K.tag("Jonction", () => new THREE.Vector3(0.5, H + 0.4, D / 2 + 0.1));
  const tPos = K.tag("Position", () => new THREE.Vector3(ite ? 1.6 : -1.6, H * 1.6, D / 2), { color: P.insul });
  const tIn = K.tag("Intérieur", new THREE.Vector3(-3.2, H * 2 - 0.2, 0), { color: P.hot });
  const tOut = K.tag("Extérieur", new THREE.Vector3(3.2, H * 2 - 0.2, 0), { color: P.cold });
  tIn.set("Intérieur"); tOut.set("Extérieur");
  let ite = false, W = 0.7;
  // poignée : attraper la face libre de l'isolant pour changer son épaisseur (le curseur suit)
  const dragIso = {
    cursor: "ew-resize",
    tip: "<b>Glisser l’isolant</b><br>pour changer son épaisseur",
    onMove(pt) {
      const inp = document.getElementById("eiso");
      const w = ite ? pt.x - 0.45 : -0.45 - pt.x;
      const e = Math.round(K.clamp(w / 0.06, +inp.min, +inp.max));
      if (+inp.value !== e) { inp.value = e; inp.dispatchEvent(new Event("input", { bubbles: true })); }
    },
  };
  [iso[0], iso[1], isoExt].forEach((m) => K.drag(m, dragIso));
  return {
    root,
    shadowBox: 8,
    cam: { pos: [5.5, 5.4, 8.5], target: [-0.6, 2.6, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(0, H, D / 2), { label: "Jonction", title: "Zoom sur la jonction mur / plancher", dist: 3.2 }),
    update() {
      ite = K.s("pos") === "ite";
      const e = K.v("eiso") / 100, lam = K.v("liso"), HL = K.v("HLr");
      const Riso = e / lam;
      const U = 1 / (0.13 + Riso + 0.18 / 1.8 + 0.04);
      W = e * 100 * 0.06;
      // ITI : isolant côté intérieur (gauche), interrompu par le plancher
      iso[0].scale.x = iso[1].scale.x = W;
      iso[0].position.set(-0.45 - W / 2, (H - 0.2) / 2, 0);
      iso[1].position.set(-0.45 - W / 2, H + 0.18 + (H - 0.2) / 2 + 0.02, 0);
      iso.forEach((m) => { m.visible = !ite; });
      // ITE : manteau continu côté extérieur (droite)
      isoExt.scale.x = W;
      isoExt.position.set(0.45 + W / 2, H, 0);
      isoExt.visible = ite;
      bridge.visible = !ite;
      bridge.position.set(0, H, 0);
      bridge.material.emissiveIntensity = 0.4 + Math.min(HL, 30) / 30 * 1.6;
      leak.count = ite ? 0 : Math.round(10 + Math.min(HL, 30) * 1.6);
      leak.speed = 0.25;
      tU.set("U mur courant", K.fmt(U, 3) + " W/(m²·K) · R iso " + K.fmt(Riso, 2));
      tB.set(ite ? "Jonction protégée" : "Pont de plancher", "HL " + K.fmt(HL, 1) + " W/K").color(ite ? P.ok : P.hot);
      tPos.set(ite ? "ITE" : "ITI", ite ? "isolant dehors, béton côté chaud" : "isolant dedans, béton côté froid");
    },
    tick(dt) { leak.step(dt); },
  };
});