/* =====================================================================
   R4-8 Physique et énergétique du bâtiment 2
   (mission Maison de santé de Lironde) - scènes 3D, formules de la v1.
   ===================================================================== */
const R48 = {
  /* silhouette de personne (occupant) */
  person(K, c) { return SC.person(K, c, 0.52); },
  /* bâtiment tertiaire : enduit, soubassement, acrotère, baies encadrées */
  block(K, w, h, d, o = {}) {
    const { P } = K;
    const g = K.group();
    const body = K.box(w, h, d, o.wallM || SC.texMat(K, "plaster", { rep: [w / 2.5, h / 2] }), 0.06);
    body.position.y = h / 2;
    const plinth = K.box(w + 0.04, 0.3, d + 0.04, SC.texMat(K, "concrete", { rep: [w / 2, 0.2] }), 0.03);
    plinth.position.y = 0.15;
    const roof = K.box(w + 0.3, 0.18, d + 0.3, K.mat(P.dark1, { rough: 0.45, metal: 0.25 }), 0.04);
    roof.position.y = h + 0.09;
    const acro = K.box(w + 0.36, 0.1, d + 0.36, K.mat(P.acc2, { rough: 0.4, grain: false }), 0.02);
    acro.position.y = h - 0.02;
    g.add(body, plinth, roof, acro);
    g.userData = { body, roof };
    return g;
  },
  /* panneau photovoltaïque incliné */
  pv(K) {
    const { P } = K;
    const g = K.group();
    const pm = SC.texMat(K, "pv");
    pm.emissive = new K.THREE.Color("#203a7a"); pm.emissiveIntensity = P.dark ? 0.35 : 0.1;
    const p = K.box(0.9, 0.04, 0.55, pm, 0.02);
    const f = K.box(0.94, 0.03, 0.59, K.mat(P.steel, { metal: 0.8, rough: 0.3 }), 0.01);
    f.position.y = -0.02;
    g.add(f, p);
    g.rotation.x = -0.45;
    return g;
  },
  speaker(K) {
    const { P } = K;
    const g = K.group();
    const b = K.box(0.55, 0.8, 0.45, K.mat(P.dark1, { rough: 0.5 }), 0.06);
    b.position.y = 0.4;
    const cone = K.cyl(0.16, 0.16, 0.04, K.mat(P.steel, { metal: 0.7, rough: 0.3 }), 24);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, 0.5, 0.23);
    const tw = K.cyl(0.07, 0.07, 0.04, K.mat(P.steel, { metal: 0.7, rough: 0.3 }), 20);
    tw.rotation.x = Math.PI / 2;
    tw.position.set(0, 0.7, 0.23);
    const rim = K.torus(0.17, 0.018, K.mat("#111", { rough: 0.5 }));
    rim.position.set(0, 0.5, 0.245);
    const led = K.sphere(0.02, K.glow(P.ok, 2), 10);
    led.position.set(0.18, 0.12, 0.23);
    g.add(b, cone, tw, rim, led);
    return g;
  },
};

/* ---------- accueil : la maison de santé ---------- */
defineScene("home", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  root.add(K.slab(16, 10, 0.6, P.grass, P.soil, 0.35));
  const lawn = K.box(15.6, 0.04, 9.6, SC.texMat(K, "grass", { rep: [8, 5] }), 0.03);
  lawn.position.y = 0.06; lawn.userData.noFit = true;
  const park = K.box(4.6, 0.05, 2.6, SC.texMat(K, "asphalt", { rep: [2, 1] }), 0.02);
  park.position.set(4.8, 0.07, 2.9);
  root.add(lawn, park);
  for (let i = 0; i < 4; i++) { const ln = K.box(0.04, 0.01, 1.1, K.mat("#ffffff", { grain: false })); ln.position.set(3.0 + i * 1.2, 0.1, 3.2); root.add(ln); }
  const b = K.group();
  const blk = R48.block(K, 7, 2.4, 3.8);
  const body = blk.userData.body;
  b.add(blk);
  // brise-soleil horizontaux devant les baies
  for (let i = 0; i < 5; i++) {
    const w = K.box(1, 1.3, 0.04, K.mat(P.glassC, { rough: 0.1, metal: 0.2, emissive: P.acc, ei: 0.1, grain: false }), 0.02);
    w.position.set(-2.8 + i * 1.4, 1.25, 1.92);
    const fr = K.box(1.1, 1.4, 0.04, K.mat(P.dark ? "#2b3446" : "#3d4452", { rough: 0.4, metal: 0.5, grain: false }), 0.02);
    fr.position.set(-2.8 + i * 1.4, 1.25, 1.9);
    b.add(fr, w);
    for (let j = 0; j < 4; j++) {
      const l = K.box(1.1, 0.04, 0.3, K.mat(P.wood, { rough: 0.6 }), 0.01);
      l.position.set(-2.8 + i * 1.4, 0.75 + j * 0.35, 2.1);
      b.add(l);
    }
  }
  const panels = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const p = R48.pv(K);
    p.position.set(-2.6 + i * 1.05, 2.78, -0.9 + j * 0.8);
    b.add(p); panels.push(p);
  }
  b.position.set(-0.8, 0, -0.4);
  root.add(b);
  K.tip(body, "<b>Maison de santé de Lironde</b><br>Confort d’été, systèmes, air et bruit : un bâtiment, plusieurs physiques.");
  const sun = SC.sun(K, 0.45);
  sun.userData.noFit = true;
  sun.add(new THREE.PointLight(0xffd28a, 10, 20, 1.2));
  root.add(sun);
  [[-7, 3.6], [-7.2, -3.7], [6.8, -3.8], [6.5, 1.0], [-5.2, 4.2], [-7, 0]].forEach(([a, c], i) => { const t = SC.tree(K, 1.3 + (i % 3) * 0.3); t.position.set(a, 0.08, c); root.add(t); });
  [[-1.5, 2.8, 0.4], [-0.9, 3.1, 2.8], [1.4, 3.4, -0.6]].forEach(([x, z, r], i) => { const pp = SC.person(K, [P.acc2, P.acc, P.gold][i], 0.85); pp.position.set(x, 0.08, z); pp.rotation.y = r; root.add(pp); });
  root.position.y = -0.6;
  K.tag("Apports solaires", () => sun.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.7, 0)), { color: P.gold });
  K.tag("Photovoltaïque", () => b.localToWorld(new THREE.Vector3(0, 3.4, -0.5)), { value: "BEPOS" });
  K.tag("Brise-soleil", () => b.localToWorld(new THREE.Vector3(2.6, 2.1, 2.2)), { color: P.wood });
  return {
    root,
    shadowBox: 10,
    cam: { pos: [8, 6.5, 12], target: [0, 1.2, 0], shiftX: 0.2, pad: 0.8 },
    tick(dt, t) {
      const a = 0.6 + Math.sin(t * 0.15) * 0.5;
      sun.position.set(Math.cos(a) * 7, 4.5 + Math.sin(a) * 2, 4 + Math.sin(a) * 1.5);
    },
  };
});

/* ---------- 01 : bilan thermique d'été ---------- */
defineScene("ete", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(K.slab(12, 8, 0.3, P.slabTop, P.slab, 0.2));
  // pièce en coupe : sol, mur arrière opaque, façade vitrée exposée
  const W = 6, D = 4, H = 2.8;
  const floor = K.box(W, 0.12, D, SC.texMat(K, "wood", { rep: [4, 3] }), 0.02);
  floor.position.y = 0.06;
  const back = K.box(W, H, 0.3, SC.texMat(K, "plaster", { rep: [3, 1.4] }), 0.02);
  back.position.set(0, H / 2, -D / 2);
  const side = K.box(0.3, H, D, SC.texMat(K, "plaster", { rep: [2, 1.4] }), 0.02);
  side.position.set(-W / 2, H / 2, 0);
  root.add(floor, back, side);
  const glass = K.box(1, 1, 0.05, K.mat(P.glassC, { rough: 0.05, opacity: 0.35, emissive: P.acc, ei: 0.1 }), 0.01);
  const opaque = K.box(1, 1, 0.3, SC.texMat(K, "plaster"), 0.02);
  const terrace = K.box(W + 1.2, 0.06, 2.2, SC.texMat(K, "grass", { rep: [4, 1.5] }), 0.02);
  terrace.position.set(0, 0.07, D / 2 + 1.25); terrace.userData.noFit = true;
  root.add(terrace);
  root.add(glass, opaque);
  K.tip(back, () => `<b>Parois opaques</b> · Φ<sub>T</sub> = U·S·(T<sub>ext</sub> − T<sub>int</sub>)`);
  K.tip(glass, () => `<b>Vitrage</b> · Φ<sub>S</sub> = S<sub>vit</sub>·E·g·F<sub>s</sub>`);
  // brise-soleil : lames qui se ferment quand Fs diminue
  const louverG = K.group();
  root.add(louverG);
  const louvers = [];
  for (let i = 0; i < 7; i++) { const l = K.box(1, 0.03, 0.4, K.mat(P.wood, { rough: 0.6 }), 0.01); louverG.add(l); louvers.push(l); }
  // tache solaire au sol : se rétracte et s'atténue quand le brise-soleil ou le contrôle solaire agit
  const sunPatch = K.box(1, 0.015, 1, K.glow(P.gold, 1.3, 0.36), 0.02);
  sunPatch.castShadow = false;
  root.add(sunPatch);
  window.LABV4H && window.LABV4H(K, glass, "Svit", "ete", "La baie vitrée", "glisser vers la droite ou la gauche pour agrandir ou réduire la surface vitrée S_vit", 4.5, "x");
  window.LABV4H && window.LABV4H(K, louverG, "Fs", "ete", "Les lames du brise-soleil", "glisser vers le bas pour fermer les lames (réduire F_s), vers le haut pour les ouvrir", 3.5, "y");
  // occupants et équipements
  const people = K.group();
  root.add(people);
  const equip = K.group();
  root.add(equip);
  const sun = SC.sun(K, 0.4);
  sun.userData.noFit = true;
  root.add(sun);
  const NR = 10;
  const rays = Array.from({ length: NR }, () => { const a = K.arrow(P.gold, { r: 0.035, glow: 1.8 }); root.add(a); return a; });
  const tw = K.arrow(P.hot, { r: 0.06, glow: 1.3 });
  root.add(tw);
  const tT = K.tag("ΦT", () => new THREE.Vector3(-W / 2 - 0.4, H + 0.3, 0), { color: P.hot });
  const tS = K.tag("ΦS", () => new THREE.Vector3(W / 4, H + 0.35, D / 2), { color: P.gold });
  const tI = K.tag("ΦI", () => new THREE.Vector3(-0.5, 1.4, -0.6), { color: P.acc2 });
  const tTot = K.tag("Total", () => new THREE.Vector3(0, H + 1.2, -D / 2), { big: true });
  const tH = K.tag("h", () => sun.position.clone().add(new THREE.Vector3(0, 0.6, 0)), { color: P.gold });
  let key = "";
  return {
    root,
    shadowBox: 10,
    cam: { pos: [5.5, 5.5, 9], target: [0, 1.3, 0], pad: 0.88 },
    views: SC.views(() => glass.position.clone(), { label: "Brise-soleil", title: "Zoom sur le vitrage et ses lames", dist: 3.2, dir: [0.4, 0.35, 1] }),
    update() {
      const U = K.v("Uete"), S = K.v("Sete"), Text = K.v("Text"), Tint = K.v("Tint");
      const Svit = K.v("Svit"), E = K.v("Esol"), g = K.v("gsol"), Fs = K.v("Fs");
      const nOcc = K.v("nOcc"), Peq = K.v("Peq"), Lat = K.v("Lat"), delta = K.v("delta");
      const PhiT = U * S * (Text - Tint), PhiS = Svit * E * g * Fs, PhiI = nOcc * 70 + Peq * 1000;
      const hSol = 90 - Lat + delta;
      // façade : vitrage (largeur ∝ part vitrée) + allège opaque
      const gw = Math.min(W - 0.6, 0.6 + Svit / 40 * (W - 1.2));
      glass.scale.set(gw, H * 0.62, 1);
      glass.position.set(W / 2 - 0.3 - gw / 2, H * 0.55, D / 2);
      opaque.scale.set(W - gw, H, 1);
      opaque.position.set(-W / 2 + (W - gw) / 2, H / 2, D / 2);
      opaque.visible = W - gw > 0.05;
      // lames : ouverture ∝ Fs (Fs = 1 : pas d'occultation)
      louvers.forEach((l, i) => {
        l.scale.x = gw + 0.2;
        l.position.set(glass.position.x, H * 0.27 + i * (H * 0.62) / 6, D / 2 + 0.3);
        l.rotation.x = (1 - Fs) * 1.3;
      });
      const patchD = 0.35 + 2.3 * Fs * g;
      sunPatch.scale.set(gw * 0.94, 1, patchD);
      sunPatch.position.set(glass.position.x, 0.13, D / 2 - 0.18 - patchD / 2);
      sunPatch.material.opacity = 0.05 + 0.42 * Fs * g;
      // soleil à la hauteur h, rayons à travers le vitrage
      const hr = THREE.MathUtils.degToRad(Math.max(5, hSol));
      const dir = new THREE.Vector3(0, -Math.sin(hr), -Math.cos(hr)).normalize();
      sun.position.set(glass.position.x, H * 0.55 - dir.y * 6, D / 2 - dir.z * 6);
      const Lr = 0.6 + Math.min(PhiS, 4000) / 4000 * 2.4;
      rays.forEach((a, i) => {
        const x = glass.position.x - gw / 2 + gw * ((i % 5) + 0.5) / 5;
        const y = H * 0.4 + Math.floor(i / 5) * 0.6;
        const from = new THREE.Vector3(x, y, D / 2).addScaledVector(dir, -Lr);
        a.set(from, dir, Lr + 0.5 * Fs);
      });
      tw.set(PhiT >= 0 ? new THREE.Vector3(-W / 2 - 1.6, H * 0.5, 0) : new THREE.Vector3(-W / 2 + 0.2, H * 0.5, 0), new THREE.Vector3(PhiT >= 0 ? 1 : -1, 0, 0), 0.4 + Math.min(Math.abs(PhiT), 1500) / 1500 * 1.3);
      tw.visible = Math.abs(PhiT) > 1;
      const k2 = nOcc + "|" + Math.round(Peq * 2);
      if (k2 !== key) {
        key = k2;
        [people, equip].forEach((gr) => gr.children.slice().forEach((c) => { gr.remove(c); c.traverse((o) => o.geometry && o.geometry.dispose()); }));
        for (let i = 0; i < nOcc; i++) { const p = R48.person(K, i % 2 ? P.acc2 : P.acc); p.position.set(-2.2 + (i % 4) * 1.1, 0.12, -1.2 + Math.floor(i / 4) * 0.9); people.add(p); }
        const ne = Math.max(1, Math.round(Peq / 0.8));
        for (let i = 0; i < ne; i++) {
          // poste de travail : plateau, écran allumé (source de chaleur interne)
          const e = K.group();
          const top = K.box(0.5, 0.04, 0.34, SC.texMat(K, "wood"), 0.01); top.position.y = 0.42;
          const leg = K.box(0.04, 0.4, 0.3, K.mat(P.steel, { metal: 0.7, rough: 0.35 })); leg.position.y = 0.21;
          const scr = K.box(0.34, 0.22, 0.03, K.mat(P.dark1, { rough: 0.4 }), 0.01); scr.position.set(0, 0.6, -0.08);
          const glow = K.box(0.3, 0.18, 0.01, K.glow(P.hot, 1.1)); glow.position.set(0, 0.6, -0.063);
          e.add(top, leg, scr, glow);
          e.position.set(-2.4 + (i % 5) * 0.55, 0.12, -D / 2 + 0.4 + Math.floor(i / 5) * 0.45);
          equip.add(e);
        }
      }
      tT.set("ΦT parois", K.fmt(PhiT, 0) + " W");
      tS.set("ΦS solaire", K.fmt(PhiS, 0) + " W");
      tI.set("ΦI internes", K.fmt(PhiI, 0) + " W");
      tTot.set("ΦT + ΦS + ΦI", K.fmt(PhiT + PhiS + PhiI, 0) + " W");
      tH.set("h max (midi solaire)", K.fmt(hSol, 0) + "° · plus bas l’après-midi");
    },
  };
});

/* ---------- 02 : inertie et déphasage ---------- */
defineScene("inertie", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(10, 5, 0.25, P.slabTop, P.slab, 0.15));
  const H = 2.6, D = 2.4;
  const wall = SC.gradBox(K, 1, H, D, 40, 0, "concrete");
  const sides = SC.sides(K, D);
  root.add(wall, sides.inn, sides.out);
  const cs = K.box(0.5, 1, 0.5, K.mat(P.acc, { emissive: P.acc, ei: 0.3, rough: 0.4 }), 0.05);
  root.add(cs);
  K.tip(cs, "<b>Capacité surfacique C<sub>S</sub> = ρ·c<sub>p</sub>·e</b><br>La « batterie » de chaleur de la paroi.");
  window.LABV4H && window.LABV4H(K, wall, "ein", "inertie", "La paroi lourde", "glisser vers la droite ou la gauche pour modifier l’épaisseur e de la paroi", 4.5, "x");
  window.LABV4H && window.LABV4H(K, cs, "rin", "inertie", "La batterie thermique C_S", "glisser vers le haut ou le bas pour régler la masse volumique ρ", 3.5, "y");
  const iProf = SC.ribbon(K, 14, P.hot, 0.026);
  const iAx = SC.axis(K, "T (°C)"), iAxX = SC.axis(K, "x : extérieur → intérieur", { labelOffset: new THREE.Vector3(0.1, -0.22, 0) });
  root.add(iProf, iAx, iAxX);
  const yI = (T) => H + 0.35 + (T - 17) / 19 * 1.3;
  const sun = SC.sun(K, 0.35);
  sun.userData.noFit = true;
  sun.add(new THREE.PointLight(0xffd28a, 8, 14, 1.4));
  root.add(sun);
  const clock = K.tag("Heure", new THREE.Vector3(0, H + 0.8, 0), { big: true });
  const tOut = K.tag("Face ext.", () => new THREE.Vector3(-W / 2 - 0.1, H * 0.85, D / 2), { color: P.hot });
  const tIn = K.tag("Face int.", () => new THREE.Vector3(W / 2 + 0.1, H * 0.85, D / 2), { color: P.acc });
  const tPhi = K.tag("φ", () => new THREE.Vector3(0, 0.25, D / 2 + 0.2));
  const tC = K.tag("CS", () => cs.position.clone().add(new THREE.Vector3(0, cs.scale.y / 2 + 0.2, 0)), { color: P.acc });
  let phi = 8, A = 0.2, W = 1.5, hour = 8;
  const Tm = 27, Ta = 8;
  return {
    root,
    shadowBox: 8,
    cam: { pos: [3.5, 3.6, 9], target: [0, 1.6, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(0, H / 2, D / 2), { label: "Paroi", title: "Zoom sur l’onde amortie dans l’épaisseur", dist: 3 }),
    update() {
      const e = K.v("ein") / 100, lam = K.v("lin"), rho = K.v("rin"), cp = K.v("cpin");
      const a = lam / (rho * cp);
      phi = 1.38 * e * Math.sqrt(1 / Math.max(a * 3600, 1e-12));
      A = Math.exp(-e * Math.sqrt(Math.PI / (a * 86400)));
      const CS = rho * cp * e;
      W = e * 100 * 0.07;
      wall.scale.x = W;
      wall.position.set(0, H / 2, 0);
      const hc = 0.1 + Math.min(CS / 1000, 900) / 900 * 2.4;
      cs.scale.y = hc;
      cs.position.set(W / 2 + 1.6, hc / 2, 0);
      sides.place(W / 2 + 1.3, -W / 2 - 1.3, 27);
      tPhi.set("φ déphasage", K.fmt(phi, 1) + " h · A = " + K.fmt(A, 3)).color(phi > 8 ? P.ok : phi > 4 ? P.warn : P.danger);
      tC.set("CS", K.fmt(CS / 1000, 0) + " kJ/(m²·K)");
    },
    tick(dt, t) {
      sides.step(dt, t);
      hour = (hour + dt * 2.4) % 24;
      const w = (2 * Math.PI) / 24;
      wall.userData.paint((u, c) => SC.tcol(K, Tm + Ta * Math.pow(A, u) * Math.sin(w * (hour - phi * u - 9)), 17, 36, c));
      const sa = ((hour - 6) / 12) * Math.PI;
      sun.visible = hour > 6 && hour < 18;
      sun.position.set(-W / 2 - 2.6, 0.2 + Math.max(-0.5, Math.sin(sa)) * 4, Math.cos(sa) * 4);
      const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
      clock.set("Heure solaire", String(hh).padStart(2, "0") + " h " + String(mm).padStart(2, "0"));
      const zI = D / 2 + 0.05, xa = -W / 2 - 0.5;
      iProf.userData.set(Array.from({ length: 13 }, (_, i) => { const u = i / 12; return [-W / 2 + u * W, yI(Tm + Ta * Math.pow(A, u) * Math.sin(w * (hour - phi * u - 9))), zI]; }));
      iAx.userData.set([xa, yI(17), zI], [xa, yI(37), zI], [{ p: [xa - 0.05, yI(20), zI], t: "20 °C" }, { p: [xa - 0.05, yI(30), zI], t: "30 °C" }]);
      iAxX.userData.set([xa, yI(17), zI], [W / 2 + 0.5, yI(17), zI]);
      tOut.set("Face ext.", K.fmt(Tm + Ta * Math.sin(w * (hour - 9)), 1) + " °C");
      tIn.set("Face int.", K.fmt(Tm + Ta * A * Math.sin(w * (hour - phi - 9)), 1) + " °C");
    },
  };
});

/* ---------- 03 : systèmes, stockage, photovoltaïque ---------- */
defineScene("bepos", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(K.slab(13, 8, 0.3, P.grass, P.soil, 0.2));
  const lawnB = K.box(12.6, 0.04, 7.6, SC.texMat(K, "grass", { rep: [6, 4] }), 0.03);
  lawnB.position.y = 0.06; lawnB.userData.noFit = true;
  root.add(lawnB);
  const blkB = R48.block(K, 5.4, 2.4, 3.4);
  blkB.position.set(-1.2, 0, -0.6);
  const bld = blkB.userData.body;
  root.add(blkB);
  for (let i = 0; i < 4; i++) { const wb = K.box(0.8, 1.1, 0.04, K.mat(P.glassC, { rough: 0.1, metal: 0.2, emissive: P.gold, ei: P.dark ? 0.6 : 0.1, grain: false }), 0.02); wb.position.set(-3.1 + i * 1.25, 1.3, 1.12); root.add(wb); }
  [[-5.4, 2.6], [5.6, -3], [-5.6, -3]].forEach(([x, z], i) => { const t = SC.tree(K, 1.3 + i * 0.2); t.position.set(x, 0.08, z); root.add(t); });
  const pvG = K.group();
  root.add(pvG);
  // ballon de stockage (volume ∝ V)
  const tank = K.cyl(0.5, 0.5, 1, K.mat(P.steel, { metal: 0.6, rough: 0.3 }), 40);
  const tankW = K.cyl(0.46, 0.46, 1, K.glow(P.hot, 0.6, 0.5), 40);
  tank.material.transparent = true; tank.material.opacity = 0.55; tank.material.depthWrite = false;
  root.add(tank, tankW);
  const bands = [0.2, 0.5, 0.8].map(() => { const r = K.torus(0.505, 0.02, K.mat(P.steel, { metal: 0.8, rough: 0.3, grain: false })); r.rotation.x = Math.PI / 2; root.add(r); return r; });
  K.tip(tank, () => `<b>Ballon de stockage</b><br>V = Q·t / (ρ·c<sub>p</sub>·ΔT)`);
  const unit = K.box(1.1, 0.8, 0.45, K.mat(P.dark ? "#d9dde4" : "#f4f5f7", { rough: 0.35, metal: 0.15, grain: false }), 0.06);
  const grl = K.cyl(0.3, 0.3, 0.02, K.mat(P.dark1), 32); grl.rotation.x = Math.PI / 2; grl.position.set(2.45, 0.45, 1.83);
  root.add(grl);
  unit.position.set(2.6, 0.45, 1.6);
  const fan = K.group();
  for (let i = 0; i < 3; i++) { const b = K.box(0.26, 0.07, 0.01, K.mat(P.steel, { metal: 0.6 })); b.geometry.translate(0.13, 0, 0); b.rotation.z = (i / 3) * Math.PI * 2; fan.add(b); }
  fan.position.set(2.45, 0.45, 1.84);
  root.add(unit, fan);
  K.tip(unit, () => `<b>Générateur</b> · E<sub>f</sub> = E<sub>u</sub> / ${K.s("modeSys") === "seer" ? "SEER" : "COP"}`);
  window.LABV4H && window.LABV4H(K, tank, "dTeau", "bepos", "Le ballon tampon de stockage", "glisser vers le bas ou le haut pour régler l’écart de température ΔT du ballon", -3.5, "y");
  window.LABV4H && window.LABV4H(K, unit, "etaSys", "bepos", "Le générateur thermodynamique", "glisser vers le haut ou le bas pour modifier le COP / SEER", 3.5, "y");
  window.LABV4H && window.LABV4H(K, pvG, "Ppv", "bepos", "Le champ photovoltaïque", "glisser vers la droite ou la gauche pour dimensionner la puissance crête P_pv", 5, "x");
  const sun = SC.sun(K, 0.45);
  sun.userData.noFit = true;
  sun.position.set(-4, 7, 4);
  sun.add(new THREE.PointLight(0xffd28a, 8, 20, 1.2));
  root.add(sun);
  const aU = K.arrow(P.hot, { r: 0.08, glow: 1.3 }), aF = K.arrow(P.gold, { r: 0.08, glow: 1.6 });
  root.add(aU, aF);
  const tF = K.tag("Ef", () => unit.position.clone().add(new THREE.Vector3(0, 1.0, 0)), { color: P.gold });
  const tV = K.tag("Ballon", () => tank.position.clone().add(new THREE.Vector3(0, tank.scale.y / 2 + 0.3, 0)), { color: P.hot });
  const tPV = K.tag("PV", () => new THREE.Vector3(-1.2, 3.4, -0.6), { big: true, color: P.gold });
  const tTRI = K.tag("TRI", () => new THREE.Vector3(-1.2, 0.25, 1.3), { color: P.ok });
  let key = "", eta = 3;
  return {
    root,
    shadowBox: 10,
    cam: { pos: [6.5, 6, 9.5], target: [0, 1.5, 0], pad: 0.86 },
    views: SC.views(() => new THREE.Vector3(-1.2, 2.7, -0.6), { label: "Toit PV", title: "Zoom sur la production photovoltaïque", dist: 4.5, dir: [0.2, 0.9, 0.6] }),
    update() {
      const mode = K.s("modeSys");
      const Eu = K.v("Eu"); eta = K.v("etaSys");
      const Q = K.v("Qstock"), ts = K.v("tstock"), dTe = K.v("dTeau");
      const Ppv = K.v("Ppv"), prod = K.v("prod"), prix = K.v("prix"), inv = K.v("inv");
      const Ef = Eu / eta;
      const V = (Q * 1000 * ts * 3600) / (1000 * 4180 * dTe);
      const Epv = Ppv * prod, eco = Epv * prix, TRI = eco > 0 ? inv / eco : Infinity;
      const np = Math.min(40, Math.round(Ppv * 1.4));
      if (String(np) !== key) {
        key = String(np);
        pvG.children.slice().forEach((c) => { pvG.remove(c); c.traverse((o) => o.geometry && o.geometry.dispose()); });
        for (let i = 0; i < np; i++) {
          const p = R48.pv(K);
          const col = i % 5, row = Math.floor(i / 5);
          // 20 panneaux en toiture, le reste en ombrière au sol
          if (row < 4) p.position.set(-3.4 + col * 1.0, 2.66, -1.9 + row * 0.68);
          else p.position.set(2.1 + ((i - 20) % 4) * 1.0, 0.4, -3 + Math.floor((i - 20) / 4) * 0.7);
          pvG.add(p);
        }
      }
      // ballon : hauteur et rayon ∝ racine cubique du volume
      const s = Math.cbrt(Math.max(V, 0.01) / 0.3);
      tank.scale.set(s, s * 1.6, s);
      tank.position.set(2.6, s * 0.8, -1.4);
      tankW.scale.set(s, s * 1.55, s);
      tankW.position.copy(tank.position);
      bands.forEach((r, i) => { r.scale.set(s, s, s); r.position.set(2.6, s * 1.6 * [0.2, 0.5, 0.8][i], -1.4); });
      aU.set(new THREE.Vector3(1.9, 1.2, 1.6), new THREE.Vector3(-1, 0, 0), 0.4 + Math.min(Eu, 25000) / 25000 * 1.6);
      aF.set(new THREE.Vector3(4.6, 0.45, 1.6), new THREE.Vector3(-1, 0, 0), 0.3 + Math.min(Ef, 15000) / 15000 * 1.4);
      tF.set("Ef = Eu / " + (mode === "seer" ? "SEER" : "COP"), K.fmt(Ef, 0) + " kWh/an");
      tV.set("Ballon", K.fmt(V * 1000, 0) + " L");
      tPV.set("Photovoltaïque " + K.fmt(Ppv, 0) + " kWc", K.fmt(Epv, 0) + " kWh/an");
      tTRI.set("TRI simple", Number.isFinite(TRI) ? K.fmt(TRI, 1) + " ans · " + K.fmt(eco, 0) + " €/an" : "-").color(TRI < 8 ? P.ok : TRI < 15 ? P.warn : P.danger);
    },
    tick(dt) { fan.rotation.z -= dt * (3 + eta * 2); },
  };
});

/* ---------- 04 : aéraulique ---------- */
defineScene("aera", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(K.slab(13, 6, 0.25, P.slabTop, P.slab, 0.15));
  const ductM = K.mat(P.steel, { metal: 0.8, rough: 0.28, opacity: 0.5, grain: false });
  const floorA = K.box(12.6, 0.04, 5.6, SC.texMat(K, "concrete", { rep: [6, 3] }), 0.02);
  floorA.position.y = 0.06; floorA.userData.noFit = true;
  const backA = K.box(12.6, 2.6, 0.12, SC.texMat(K, "plaster", { rep: [6, 1.3] }), 0.02);
  backA.position.set(0, 1.35, -2.8); backA.userData.noFit = true;
  root.add(floorA, backA);
  for (let x = -4.5; x <= 4.5; x += 1.5) { const h = K.box(0.03, 1.1, 0.03, K.mat(P.steel, { metal: 0.8, rough: 0.3 })); h.position.set(x, 2.15, 0); root.add(h); }
  let duct = null, flow = null, key = "";
  const fan = K.group();
  const housing = K.cyl(0.75, 0.75, 0.5, K.mat(P.dark1, { metal: 0.4, rough: 0.4 }), 40);
  housing.rotation.z = Math.PI / 2;
  const blades = K.group();
  for (let i = 0; i < 7; i++) { const b = K.box(0.04, 0.6, 0.18, K.mat(P.acc, { metal: 0.4, rough: 0.3 })); b.geometry.translate(0, 0.3, 0); b.rotation.x = (i / 7) * Math.PI * 2; blades.add(b); }
  blades.position.x = 0.27;
  fan.add(housing, blades);
  for (let r = 0.25; r <= 0.72; r += 0.15) { const ring = K.torus(r, 0.012, K.mat(P.steel, { metal: 0.8, rough: 0.3, grain: false })); ring.rotation.y = Math.PI / 2; ring.position.x = 0.28; fan.add(ring); }
  const base = K.box(0.8, 0.55, 1.2, K.mat(P.dark1, { rough: 0.5 }), 0.04); base.position.set(0, -1.0, 0); fan.add(base);
  fan.position.set(-5.4, 1.3, 0);
  root.add(fan);
  K.tip(fan, () => `<b>Ventilateur</b> · P<sub>élec</sub> = Q<sub>v</sub>·ΔP / η`);
  const noise = [];
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.015, 6, 48), K.glow(P.danger, 1.4, 0.8)); r.rotation.y = Math.PI / 2; root.add(r); noise.push(r); }
  const dpBar = K.box(0.4, 1, 0.4, K.mat(P.acc2, { emissive: P.acc2, ei: 0.4, rough: 0.4 }), 0.05);
  root.add(dpBar);
  K.tip(dpBar, "<b>Perte de charge ΔP</b><br>ΔP = L·J + ΔP<sub>singulières</sub>");
  window.LABV4H && window.LABV4H(K, fan, "va", "aera", "Le caisson de ventilation", "glisser vers le haut ou le bas pour régler la vitesse d’air v dans la gaine", 4, "y");
  window.LABV4H && window.LABV4H(K, dpBar, "Psing", "aera", "La colonne de perte de charge ΔP", "glisser vers le haut ou le bas pour ajouter ou réduire les singularités", 3.5, "y");
  const tQ = K.tag("Qv", () => new THREE.Vector3(-2.5, 1.3 + side / 2 + 0.3, 0), { big: true });
  const tDP = K.tag("ΔP", () => dpBar.position.clone().add(new THREE.Vector3(0, dpBar.scale.y / 2 + 0.25, 0)), { color: P.acc2 });
  const tP = K.tag("P élec", () => fan.position.clone().add(new THREE.Vector3(0, 1.1, 0)), { color: P.gold });
  const tV = K.tag("v", () => new THREE.Vector3(1.5, 1.3 - side / 2 - 0.25, side / 2 + 0.1));
  let side = 0.4, v = 4, loud = 0, coupled = true;
  return {
    root,
    shadowBox: 9,
    cam: { pos: [2, 5, 10], target: [0, 1.2, 0], pad: 0.88 },
    views: SC.views(() => fan.position.clone(), { label: "Ventilateur", title: "Zoom sur le caisson de ventilation", dist: 3 }),
    update() {
      const S = K.v("Sa"); v = K.v("va");
      const L = K.v("La"), J = K.v("J"), Ps = K.v("Psing"), eta = K.v("etaA");
      const kv = K.s("couplageA") === "fixe" ? 1 : (v / 4.5) * (v / 4.5);
      const Qv = S * v, dP = (L * J + Ps) * kv, Pu = Qv * dP, Pe = Pu / eta;
      coupled = K.s("couplageA") !== "fixe";
      side = Math.sqrt(S) * 1.6;
      const len = 3 + L / 120 * 6;
      const nb = Math.min(4, Math.round(Ps / 75));
      const k2 = side.toFixed(3) + "|" + len.toFixed(2) + "|" + nb;
      if (k2 !== key) {
        key = k2;
        [duct, flow && flow.mesh].forEach((o) => { if (o) { root.remove(o); o.geometry.dispose(); } });
        const x0 = -5.1, y = 1.3;
        const pts = [[x0, y, 0]];
        // coudes (singularités) répartis le long du réseau
        const seg = len / (nb + 1);
        let x = x0, z = 0;
        for (let i = 0; i < nb; i++) { x += seg; pts.push([x, y, z]); z = z === 0 ? (i % 2 ? -1.2 : 1.2) : 0; pts.push([x, y, z]); }
        pts.push([x0 + len + 0.6, y, z]);
        const c = K.path(pts, Math.min(0.5, side));
        duct = K.tube(c, side / 2, ductM, 160, 4);
        duct.castShadow = true;
        root.add(duct);
        flow = SC.flow(K, c, 140, 0.035, K.glow(P.acc, 2), { spread: side * 0.35, speed: 1 });
        root.add(flow.mesh);
      }
      flow.speed = 0.3 + v * 0.35;
      const hb = 0.1 + Math.min(dP, 600) / 600 * 3;
      dpBar.scale.y = hb;
      dpBar.position.set(5.2, hb / 2, -1.8);
      loud = v > 8 ? 1 : v > 6 ? 0.4 : 0;
      tQ.set("Qv = S·v", K.fmt(Qv * 3600, 0) + " m³/h");
      tDP.set("ΔP", K.fmt(dP, 0) + " Pa");
      tP.set("P élec", K.fmt(Pe, 1) + " W" + (coupled ? " · ∝ v³" : " · ΔP figé (irréaliste)"));
      tV.set("v", K.fmt(v, 1) + " m/s" + (v > 8 ? " · bruyant" : v < 3 ? " · confortable" : "")).color(v > 8 ? P.danger : v < 3 ? P.acc : P.ok);
    },
    tick(dt, t) {
      if (flow) flow.step(dt);
      blades.rotation.x += dt * (2 + v * 1.6);
      noise.forEach((r, i) => {
        const k = ((t * 0.8 + i / 3) % 1);
        r.position.set(-4.6 + k * 2.5, 1.3, 0);
        r.scale.setScalar(0.6 + k * 1.2);
        r.material.opacity = (1 - k) * 0.8 * loud;
        r.visible = loud > 0;
      });
    },
  };
});

/* ---------- 05 : acoustique ---------- */
defineScene("acou", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(K.slab(13, 7, 0.25, P.slabTop, P.slab, 0.15));
  const s1 = R48.speaker(K), s2 = R48.speaker(K);
  s1.position.set(-5, 0.16, -1.2); s2.position.set(-5, 0.16, 1.2);
  s1.rotation.y = s2.rotation.y = Math.PI / 2;
  root.add(s1, s2);
  K.tip(s1, () => `<b>Source 1</b> · L₁ = ${K.txt("v-L1")}`);
  K.tip(s2, () => `<b>Source 2</b> · L₂ = ${K.txt("v-L2")}`);
  const wall = K.box(0.3, 2.6, 5, SC.texMat(K, "concrete", { rep: [0.3, 2] }), 0.03);
  const stage = K.box(3.2, 0.12, 4.4, SC.texMat(K, "wood", { rep: [2, 3] }), 0.02);
  stage.position.set(-4.6, 0.1, 0); stage.userData.noFit = true;
  root.add(stage);
  root.add(wall);
  K.tip(wall, () => `<b>Paroi séparative</b> · R<sub>w</sub> = ${K.txt("v-Rw")}<br>Isolement : le niveau reçu baisse de R<sub>w</sub>.`);
  // local de réception (volume ∝ V, panneaux absorbants ∝ A)
  const room = K.box(1, 1, 1, K.mat(P.acc, { opacity: 0.08, side: THREE.DoubleSide }), 0.05);
  room.castShadow = false;
  root.add(room);
  const absorb = K.group();
  root.add(absorb);
  const ear = R48.person(K, P.acc2);
  const earHalo = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 48), K.glow(P.ok, 1.3, 0.65));
  earHalo.rotation.x = -Math.PI / 2;
  earHalo.position.y = 0.09;
  earHalo.material.side = THREE.DoubleSide;
  root.add(ear, earHalo);
  window.LABV4H && window.LABV4H(K, wall, "Rw", "acou", "La paroi séparative acoustique", "glisser vers la droite ou la gauche pour renforcer l’indice d’affaiblissement R_w", 4.5, "x");
  window.LABV4H && window.LABV4H(K, s1, "L1", "acou", "L’enceinte source n° 1", "glisser vers le haut ou le bas pour régler le niveau sonore L_1", 3.5, "y");
  window.LABV4H && window.LABV4H(K, absorb, "Aac", "acou", "Les panneaux absorbants acoustiques", "glisser vers le haut ou le bas pour ajuster l’aire d’absorption équivalente A", 3.5, "y");
  const NW = 5;
  const waves = [];
  for (let i = 0; i < NW * 2; i++) {
    const r = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI, 0, Math.PI), K.glow(P.acc, 0.8, 0.25));
    r.material.side = THREE.DoubleSide;
    r.rotation.y = Math.PI;
    r.castShadow = false;
    root.add(r);
    waves.push(r);
  }
  const echo = [];
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 40), K.glow(P.acc2, 1.2, 0.6)); r.rotation.x = Math.PI / 2; root.add(r); echo.push(r); }
  const tL = K.tag("L total", () => new THREE.Vector3(-5, 1.7, 0), { big: true });
  const tLp = K.tag("Lp", () => ear.position.clone().add(new THREE.Vector3(0, 1.05, 0)), { color: P.acc2 });
  const tR = K.tag("Rw", () => wall.position.clone().add(new THREE.Vector3(0, 1.6, 0)));
  const tT = K.tag("T Sabine", () => room.position.clone().add(new THREE.Vector3(0, room.scale.y / 2 + 0.35, 0)), { color: P.acc2 });
  let lvl = 0.6, T = 0.8, dx = 2, xr = 2, keyA = "";
  return {
    root,
    shadowBox: 9,
    cam: { pos: [1, 6, 10], target: [0, 1, 0], pad: 0.86 },
    views: SC.views(() => ear.position.clone().add(new THREE.Vector3(0, 0.6, 0)), { label: "Récepteur", title: "Zoom sur l’auditeur dans le local de réception", dist: 3 }),
    update() {
      const L1 = K.v("L1"), L2 = K.v("L2"), Lw = K.v("Lw"), d = K.v("dAc"), Rw = K.v("Rw"), V = K.v("Vac"), A = K.v("Aac");
      const Ltot = 10 * Math.log10(Math.pow(10, L1 / 10) + Math.pow(10, L2 / 10));
      const Lp = Lw - 20 * Math.log10(Math.max(d, 0.1)) - 8;
      const Lrec = Ltot - Rw;
      T = 0.16 * V / A;
      lvl = Math.min(1, Math.max(0.15, (Ltot - 40) / 55));
      wall.scale.x = 0.4 + (Rw - 20) / 40 * 1.6;
      wall.position.set(-1.4, 1.3, 0);
      const side = Math.cbrt(V) * 0.75;
      xr = -1.4 + wall.scale.x * 0.15 + 0.3 + side / 2;
      room.scale.set(side, Math.min(side * 0.7, 3), side);
      room.position.set(xr, room.scale.y / 2, 0);
      dx = Math.min(side / 2 - 0.3, d * 0.18);
      ear.position.set(xr - side / 2 + 0.4 + dx, 0, 0.3);
      earHalo.position.set(ear.position.x, 0.09, ear.position.z);
      const cEar = Lrec <= 35 && T <= 0.8 ? P.ok : Lrec > 48 || T > 1.3 ? P.danger : P.warn;
      earHalo.material.color.copy(cEar);
      earHalo.material.emissive.copy(cEar);
      const na = Math.min(16, Math.round(A / 5));
      const kA = na + "|" + side.toFixed(2) + "|" + xr.toFixed(2);
      if (kA !== keyA) absorb.children.slice().forEach((c) => { absorb.remove(c); c.geometry.dispose(); });
      for (let i = 0; i < (kA !== keyA ? na : 0); i++) {
        const pnl = K.box(0.5, 0.5, 0.06, SC.texMat(K, "foam", { tint: P.acc2.clone().lerp(new THREE.Color("#ffffff"), 0.35) }), 0.02);
        const k = i / Math.max(1, na);
        pnl.position.set(xr - side / 2 + 0.3 + (i % 4) * (side - 0.6) / 3, 0.5 + Math.floor(i / 4) * 0.6, -side / 2 + 0.04);
        absorb.add(pnl);
        pnl.userData.k = k;
      }
      keyA = kA;
      tL.set("L total (L₁ ⊕ L₂)", K.fmt(Ltot, 1) + " dB");
      tLp.set("Lp à " + K.fmt(d, 1) + " m", K.fmt(Lp, 1) + " dB · reçu ≈ " + K.fmt(Lrec, 1) + " dB");
      tR.set("Rw", K.fmt(Rw, 0) + " dB");
      tT.set("T = 0,16 V/A", K.fmt(T, 2) + " s").color(T > 1.2 ? P.warn : T < 0.6 ? P.ok : P.acc);
    },
    tick(dt, t) {
      waves.forEach((w, i) => {
        const src = i < NW ? s1 : s2;
        const k = ((t * 0.5 + (i % NW) / NW) % 1);
        const r = 0.3 + k * 3.2;
        w.position.set(src.position.x + 0.3, 0.5, src.position.z);
        w.scale.setScalar(r);
        w.material.opacity = (1 - k) * 0.14 * lvl;
      });
      // réverbération : les échos s'éteignent d'autant plus lentement que T est grand
      echo.forEach((e, i) => {
        const k = ((t * 0.6 + i / 6) % 1);
        e.position.set(xr, 0.08 + k * 0.02, 0);
        e.scale.setScalar(0.3 + k * room.scale.x * 0.55);
        e.material.opacity = Math.exp(-k * 3 / Math.max(T, 0.2)) * 0.7;
      });
    },
  };
});