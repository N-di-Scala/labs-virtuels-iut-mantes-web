/* =====================================================================
   R3-10 Physique et énergétique du bâtiment 1 (mission Pavillon des Aulnes)
   Scènes 3D - formules identiques à la v1.
   ===================================================================== */
const R310 = {
  DPE: [
    { l: "A", max: 70, c: "#319b4a" }, { l: "B", max: 110, c: "#51b364" }, { l: "C", max: 180, c: "#c5d645" },
    { l: "D", max: 250, c: "#f0c419" }, { l: "E", max: 330, c: "#f09a1a" }, { l: "F", max: 420, c: "#e85d2a" },
    { l: "G", max: Infinity, c: "#c41e1e" },
  ],
  letter(ind) { for (const r of R310.DPE) if (ind <= r.max) return r.l; return "G"; },
  /* pavillon à étage : enduit, soubassement, tuiles, menuiseries encadrées, volets, gouttière */
  pavilion(K, o = {}) {
    const { THREE, P } = K;
    const g = K.group();
    const w = o.w ?? 4, d = o.d ?? 3, h = o.h ?? 2.6;
    const wallM = o.wallM || SC.texMat(K, "plaster", { rep: [2, 1.4] });
    if (o.wallM && !wallM.map) { wallM.map = SC.tex(K, "plaster"); wallM.bumpMap = wallM.map; wallM.bumpScale = 1; wallM.needsUpdate = true; }
    const body = K.box(w, h, d, wallM, 0.04);
    body.position.y = h / 2;
    const plinth = K.box(w + 0.03, 0.3, d + 0.03, SC.texMat(K, "concrete", { rep: [2, 0.2] }), 0.02);
    plinth.position.y = 0.15;
    const band = K.box(w + 0.04, 0.08, d + 0.04, K.mat(P.dark ? "#d8d2c8" : "#ffffff", { rough: 0.6, grain: false }), 0.02);
    band.position.y = h * 0.52;
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2 - 0.2, 0); sh.lineTo(0, 1.3); sh.lineTo(w / 2 + 0.2, 0); sh.lineTo(-w / 2 - 0.2, 0);
    const rg = new THREE.ExtrudeGeometry(sh, { depth: d + 0.3, bevelEnabled: false });
    rg.translate(0, 0, -(d + 0.3) / 2);
    const pa = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getZ(i) + d) * 0.7, (Math.abs(pa.getX(i)) + pa.getY(i)) * 0.9);
    const roof = new THREE.Mesh(rg, o.roofM || SC.texMat(K, "roof"));
    roof.position.y = h;
    roof.castShadow = true; roof.receiveShadow = true;
    const fascia = K.box(w + 0.42, 0.08, d + 0.34, K.mat(P.dark ? "#e8e4dc" : "#ffffff", { rough: 0.5, grain: false }), 0.02);
    fascia.position.y = h + 0.02;
    const gut = K.cyl(0.05, 0.05, w + 0.4, K.mat(P.steel, { metal: 0.7, rough: 0.35, grain: false }), 12);
    gut.rotation.z = Math.PI / 2; gut.position.set(0, h - 0.02, d / 2 + 0.2);
    const down = K.cyl(0.035, 0.035, h, K.mat(P.steel, { metal: 0.7, rough: 0.35, grain: false }), 10);
    down.position.set(w / 2 + 0.12, h / 2, d / 2 + 0.2);
    g.add(body, plinth, band, roof, fascia, gut, down);
    const winM = o.winM || K.glow(P.gold, P.dark ? 1 : 0.35);
    const frameM = K.mat(P.dark ? "#e8e4dc" : "#ffffff", { rough: 0.45, grain: false });
    const shutM = K.mat(o.shutter || (P.dark ? "#3f6f8f" : "#4f86a8"), { rough: 0.6 });
    const wins = [];
    [[-w * 0.28, h * 0.3], [w * 0.28, h * 0.3], [-w * 0.28, h * 0.72], [w * 0.28, h * 0.72]].forEach(([x, y]) => {
      const fr = K.box(0.66, 0.72, 0.05, frameM, 0.02);
      fr.position.set(x, y, d / 2 + 0.01);
      const m = K.box(0.55, 0.6, 0.04, winM, 0.02);
      m.position.set(x, y, d / 2 + 0.03);
      const mul = K.box(0.03, 0.6, 0.03, frameM);
      mul.position.set(x, y, d / 2 + 0.055);
      const sill = K.box(0.74, 0.05, 0.12, frameM, 0.01);
      sill.position.set(x, y - 0.38, d / 2 + 0.05);
      const s1 = K.box(0.3, 0.68, 0.03, shutM, 0.01), s2 = s1.clone();
      s1.position.set(x - 0.5, y, d / 2 + 0.02); s2.position.set(x + 0.5, y, d / 2 + 0.02);
      g.add(fr, m, mul, sill, s1, s2); wins.push(m);
    });
    const dfr = K.box(0.62, 1.05, 0.05, frameM, 0.02);
    dfr.position.set(0, 0.55, d / 2 + 0.01);
    const door = K.box(0.5, 0.95, 0.05, SC.texMat(K, "wood"), 0.02);
    door.position.set(0, 0.5, d / 2 + 0.03);
    const step = K.box(0.9, 0.12, 0.4, SC.texMat(K, "concrete"), 0.02);
    step.position.set(0, 0.06, d / 2 + 0.2);
    g.add(dfr, door, step);
    const chim = K.box(0.35, 0.9, 0.35, SC.texMat(K, "brick", { rep: [1, 2] }), 0.03);
    chim.position.set(w * 0.25, h + 0.9, -d * 0.15);
    const cap = K.box(0.42, 0.06, 0.42, K.mat(P.dark1, { rough: 0.6 }), 0.01);
    cap.position.set(w * 0.25, h + 1.37, -d * 0.15);
    g.add(chim, cap);
    g.userData = { body, roof, wins, w, d, h };
    return g;
  },
  /* groupe extérieur de pompe à chaleur avec ventilateur */
  pac(K) {
    const { P } = K;
    const g = K.group();
    const box = K.box(1.1, 0.8, 0.45, K.mat(P.dark ? "#d9dde4" : "#f4f5f7", { rough: 0.35, metal: 0.15, grain: false }), 0.06);
    box.position.y = 0.5;
    const grille = K.cyl(0.3, 0.3, 0.02, K.mat(P.dark1), 32);
    grille.rotation.x = Math.PI / 2;
    grille.position.set(-0.15, 0.5, 0.235);
    for (let r = 0.1; r <= 0.3; r += 0.07) { const ring = K.torus(r, 0.008, K.mat(P.steel, { metal: 0.7, rough: 0.3, grain: false })); ring.position.set(-0.15, 0.5, 0.262); g.add(ring); }
    for (let i = 0; i < 6; i++) { const fin = K.box(0.22, 0.012, 0.02, K.mat(P.steel, { metal: 0.6, rough: 0.4, grain: false })); fin.position.set(0.32, 0.25 + i * 0.1, 0.23); g.add(fin); }
    [-0.45, 0.45].forEach((x) => { const f = K.box(0.1, 0.1, 0.5, K.mat(P.dark1, { rough: 0.6 }), 0.02); f.position.set(x, 0.05, 0); g.add(f); });
    const logo = K.box(0.16, 0.05, 0.01, K.glow(P.acc, 1.2));
    logo.position.set(0.32, 0.8, 0.23);
    g.add(logo);
    const fan = K.group();
    for (let i = 0; i < 3; i++) { const b = K.box(0.26, 0.07, 0.01, K.mat(P.steel, { metal: 0.6 })); b.geometry.translate(0.13, 0, 0); b.rotation.z = (i / 3) * Math.PI * 2; fan.add(b); }
    fan.position.set(-0.15, 0.5, 0.25);
    g.add(box, grille, fan);
    g.userData.fan = fan;
    return g;
  },
  coins(K, n, mat, x, z) {
    const g = K.group();
    for (let i = 0; i < n; i++) {
      const c = K.cyl(0.32, 0.32, 0.09, mat, 28);
      c.position.set(x + Math.sin(i * 2.3) * 0.03, 0.09 + i * 0.1, z + Math.cos(i * 1.7) * 0.03);
      const rim = K.torus(0.31, 0.012, mat);
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.045;
      c.add(rim);
      g.add(c);
    }
    return g;
  },
};

/* ---------- accueil : le Pavillon des Aulnes ---------- */
defineScene("home", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  root.add(K.slab(15, 10, 0.6, P.grass, P.soil, 0.35));
  const lawn = K.box(14.6, 0.04, 9.6, SC.texMat(K, "grass", { rep: [7, 5] }), 0.03);
  lawn.position.y = 0.06; lawn.userData.noFit = true;
  const drive = K.box(1.6, 0.05, 4.2, SC.texMat(K, "gravel", { rep: [1, 2.5] }), 0.02);
  drive.position.set(-1, 0.07, 3.3);
  root.add(lawn, drive);
  const fenceM = SC.texMat(K, "wood");
  for (let x = -7; x <= 7; x += 0.5) { if (Math.abs(x + 1) < 0.9) continue; const pk = K.box(0.08, 0.5, 0.05, fenceM, 0.01); pk.position.set(x, 0.32, 4.7); root.add(pk); }
  [-1, 1].forEach((sgn) => { const rail = K.box(6.2, 0.06, 0.04, fenceM, 0.01); rail.position.set(sgn < 0 ? -4.1 : 3.9, 0.42, 4.68); rail.scale.x = sgn < 0 ? 0.95 : 1.0; root.add(rail); });
  const thermo = K.mat(P.wall, { rough: 0.8 });
  const house = R310.pavilion(K, { w: 4.4, d: 3.4, h: 2.8, wallM: thermo });
  house.position.set(-1, 0, -0.4);
  root.add(house);
  K.tip(house, "<b>Pavillon des Aulnes</b><br>Murs, toiture, vitrages, renouvellement d’air : autant de chemins pour la chaleur.");
  const pac = R310.pac(K);
  pac.position.set(2.2, 0, 0.6);
  root.add(pac);
  K.tip(pac, "<b>Pompe à chaleur</b><br>1 kWh électrique → COP kWh de chaleur.");
  // panneau DPE planté dans le jardin
  const board = K.group();
  const panel = K.box(1.75, 1.95, 0.05, K.mat(P.dark ? "#e8eaee" : "#ffffff", { rough: 0.5, grain: false }), 0.04);
  panel.position.set(0.82, 1.2, -0.05);
  board.add(panel);
  R310.DPE.forEach((r, i) => {
    const b = K.box(0.5 + i * 0.16, 0.2, 0.06, K.mat(r.c, { rough: 0.5, emissive: r.c, ei: 0.15 }), 0.02);
    b.position.set(0.08 + (0.5 + i * 0.16) / 2, 1.95 - i * 0.24, 0);
    board.add(b);
  });
  const post = K.box(0.08, 2, 0.08, K.mat(P.wood));
  post.position.set(-0.05, 1, -0.05);
  board.add(post);
  board.position.set(4.3, 0, 1.6);
  board.rotation.y = -0.5;
  root.add(board);
  // air chaud qui s'échappe par la toiture
  const leak = SC.stream(K, 60, [3.3, 6, -0.9, 0.9, -0.9, 0.9], 0.05, K.glow(P.hot, 2, 0.8));
  leak.mesh.rotation.z = Math.PI / 2;
  leak.mesh.position.set(-1, 0, -0.4);
  root.add(leak.mesh);
  leak.speed = 0.18;
  [[-6, 3.5], [-6.3, -3.4], [5.8, -3.2], [-3.8, 3.8], [6, 3.7], [-6.4, 0.2], [3.9, -3.9]].forEach(([a, b], i) => { const t = SC.tree(K, 1.3 + (i % 3) * 0.3); t.position.set(a, 0.08, b); root.add(t); });
  const owner = SC.person(K, P.acc2, 0.9); owner.position.set(-0.4, 0.1, 2.6); owner.rotation.y = 0.3;
  root.add(owner);
  root.position.y = -0.6;
  K.tag("Déperditions", () => house.localToWorld(new THREE.Vector3(0, 4.4, 0)), { color: P.hot });
  K.tag("PAC", () => pac.localToWorld(new THREE.Vector3(0, 1.1, 0)), { value: "COP" });
  K.tag("DPE", () => board.localToWorld(new THREE.Vector3(0.6, 2.3, 0)), { value: "A → G" });
  return {
    root,
    shadowBox: 10,
    cam: { pos: [8, 6.5, 12], target: [0, 1.2, 0], shiftX: 0.2, pad: 0.82 },
    tick(dt, t) {
      leak.step(dt);
      pac.userData.fan.rotation.z -= dt * 9;
      thermo.color.copy(P.wall).lerp(SC.tcol(K, 8 + Math.sin(t * 0.8) * 6, -10, 25), 0.35);
    },
  };
});

/* ---------- 01 : transmission U·A·ΔT ---------- */
defineScene("trans", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(12, 6, 0.25, P.slabTop, P.slab, 0.15));
  const wallG = K.group();
  root.add(wallG);
  const sup = K.box(1, 1, 1, SC.texMat(K, "concrete"), 0.02);
  const iso = K.box(1, 1, 1, SC.texMat(K, "wool"), 0.02);
  const inn = SC.indoor(K, 0, 2.2, 3.2);
  wallG.add(sup, iso);
  root.add(inn);
  K.tip(iso, () => `<b>Isolant</b> · R<sub>iso</sub> = e/λ = ${K.fmt((K.v("eiso1") / 100) / K.v("liso1"), 2)} m²·K/W`);
  K.tip(sup, () => `<b>Support</b> · R<sub>sup</sub> = ${K.fmt((K.v("esup") / 100) / K.v("lsup"), 3)} m²·K/W`);
  const lnc = K.box(2.4, 2.2, 2.6, K.mat(P.cold, { opacity: 0.18 }), 0.06);
  lnc.castShadow = false;
  root.add(lnc);
  K.tip(lnc, "<b>Local non chauffé</b> (garage, combles…)<br>b<sub>LNC</sub> &lt; 1 : il est moins froid que le dehors.");
  const escape = SC.stream(K, 85, [0.4, 3.2, 0.25, 2.2, -1.2, 1.2], 0.042, K.glow(P.hot, 1.8));
  root.add(escape.mesh);
  window.LABV4H && window.LABV4H(K, iso, "eiso1", "trans", "La couche d’isolant", "glisser vers la droite ou la gauche pour changer l’épaisseur d’isolant e", 4.5, "x");
  window.LABV4H && window.LABV4H(K, lnc, "bLNC", "trans", "Le volume voisin (local non chauffé)", "glisser vers le bas ou le haut pour régler le facteur b_LNC", -3.5, "y");
  const NA = 9;
  const arrows = Array.from({ length: NA }, () => { const a = K.arrow(P.hot, { r: 0.045, glow: 1.3 }); root.add(a); return a; });
  const tU = K.tag("U", () => new THREE.Vector3(0, dims.h + 0.45, 0), { big: true });
  const tPhi = K.tag("Φ", () => new THREE.Vector3(-dims.t - 1.2, dims.h * 0.6, 0), { color: P.hot });
  const tA = K.tag("A", () => new THREE.Vector3(0, 0.2, dims.w / 2 + 0.1));
  const tB = K.tag("bLNC", () => lnc.position.clone().add(new THREE.Vector3(0, 1.3, 0)), { color: P.cold });
  const dims = { w: 3, h: 2.4, t: 0.5 };
  return {
    root,
    shadowBox: 9,
    cam: { pos: [6.5, 4, 7.5], target: [0, 1.2, 0], pad: 0.9 },
    views: SC.views(() => new THREE.Vector3(0, dims.h / 2, dims.w / 2), { label: "Paroi", title: "Zoom sur la coupe isolant / support", dist: 3 }),
    update() {
      const eI = K.v("eiso1") / 100, lI = K.v("liso1"), eS = K.v("esup") / 100, lS = K.v("lsup");
      const A = K.v("A1"), dT = K.v("dT1"), b = K.v("bLNC");
      const Riso = eI / lI, Rsup = eS / lS;
      const U = 1 / (0.13 + Riso + Rsup + 0.04);
      const Phi = b * U * A * dT;
      const side = Math.sqrt(A) * 0.42;
      dims.w = Math.min(5.2, side * 1.2); dims.h = Math.min(3.2, side * 0.8);
      const tI = eI * 100 * 0.05, tS = eS * 100 * 0.05;
      dims.t = tI + tS;
      // paroi vue en coupe : intérieur à gauche (isolant), extérieur à droite (support)
      iso.scale.set(tI, dims.h, dims.w);
      iso.position.set(-dims.t / 2 + tI / 2, dims.h / 2, 0);
      sup.scale.set(tS, dims.h, dims.w);
      sup.position.set(-dims.t / 2 + tI + tS / 2, dims.h / 2, 0);
      lnc.position.set(dims.t / 2 + 1.4, 1.1, 0);
      inn.position.x = -dims.t / 2 - 1.25;
      lnc.material.opacity = b < 0.999 ? 0.08 + (1 - b) * 0.35 : 0.04;
      lnc.visible = true;
      escape.box = [dims.t / 2 + 0.05, dims.t / 2 + 2.4, 0.2, dims.h - 0.2, -dims.w / 2 + 0.2, dims.w / 2 - 0.2];
      escape.count = Math.round(12 + Math.min(Phi, 2200) / 2200 * 70);
      escape.speed = 0.08 + Math.min(Phi, 2200) / 2200 * 0.38;
      const L = 0.3 + Math.min(Phi, 2500) / 2500 * 2;
      arrows.forEach((a, i) => {
        const y = 0.35 + (i % 3) * (dims.h - 0.7) / 2;
        const z = -dims.w / 3 + Math.floor(i / 3) * dims.w / 3;
        a.set(new THREE.Vector3(-dims.t / 2 - 1.2, y, z), new THREE.Vector3(1, 0, 0), dims.t + 1.2 + L * 0.5);
      });
      tU.set("U = 1/Rth", K.fmt(U, 3) + " W/(m²·K)");
      tPhi.set("Φ = b·U·A·ΔT", K.fmt(Phi, 0) + " W");
      tA.set("A", A + " m² · ΔT " + dT + " K");
      tB.set("bLNC", K.fmt(b, 2)).show(b < 0.999);
    },
    tick(dt) { escape.step(dt); },
  };
});

/* ---------- 02 : ventilation et ponts thermiques ---------- */
defineScene("vent", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(12, 8, 0.3, P.grass, P.soil, 0.2));
  const lawnV = K.box(11.6, 0.04, 7.6, SC.texMat(K, "grass", { rep: [6, 4] }), 0.03);
  lawnV.position.y = 0.06; lawnV.userData.noFit = true;
  root.add(lawnV);
  [[-4.6, -2.8], [4.7, -2.6], [-4.8, 2.8]].forEach(([x, z], i) => { const t = SC.tree(K, 1.3 + i * 0.2); t.position.set(x, 0.08, z); root.add(t); });
  const wallM = K.mat(P.wall, { rough: 0.85 });
  const house = R310.pavilion(K, { w: 4.4, d: 3.4, h: 2.6, wallM, winM: K.mat(P.glassC, { rough: 0.1, emissive: P.acc, ei: 0.15 }) });
  root.add(house);
  const { w, d, h } = house.userData;
  // ponts thermiques : liaisons dalle, angles, planchers
  const bridges = K.group();
  root.add(bridges);
  const bM = K.glow(P.hot, 1.4);
  const edges = [[[-w / 2, 0.05, d / 2 + 0.03], [w / 2, 0.05, d / 2 + 0.03]], [[-w / 2, h * 0.52, d / 2 + 0.03], [w / 2, h * 0.52, d / 2 + 0.03]], [[-w / 2 - 0.03, 0.05, -d / 2], [-w / 2 - 0.03, 0.05, d / 2]], [[w / 2 + 0.03, 0.05, -d / 2], [w / 2 + 0.03, 0.05, d / 2]], [[-w / 2 - 0.03, h * 0.52, -d / 2], [-w / 2 - 0.03, h * 0.52, d / 2]], [[w / 2 + 0.03, h * 0.52, -d / 2], [w / 2 + 0.03, h * 0.52, d / 2]], [[-w / 2, 0, d / 2 + 0.03], [-w / 2, h, d / 2 + 0.03]], [[w / 2, 0, d / 2 + 0.03], [w / 2, h, d / 2 + 0.03]]];
  const btubes = edges.map(([a, b]) => {
    const t = K.rod(bM, 0.04);
    t.userData.a = new THREE.Vector3(...a);
    t.userData.b = new THREE.Vector3(...b);
    t.set(t.userData.a, t.userData.b);
    bridges.add(t);
    K.tip(t, () => `<b>Pont thermique</b> · H<sub>pt</sub> = Ψ·L = ${K.fmt(K.v("Psi") * K.v("Lpt"), 1)} W/K`);
    return t;
  });
  // air renouvelé : entrées sur la façade, extraction en toiture
  window.LABV4H && window.LABV4H(K, house, "Qv", "vent", "Le pavillon ventilé", "glisser vers le haut ou le bas pour régler le débit d’air neuf Q_v", 4, "y");
  window.LABV4H && window.LABV4H(K, bridges, "Psi", "vent", "Les ponts thermiques linéiques", "glisser vers la droite ou la gauche pour modifier le coefficient linéique Ψ", 4, "x");
  const airIn = SC.stream(K, 120, [0, 1, 0, 1, 0, 1], 0.04, K.glow(P.cold, 1.6, 0.85));
  const airOut = SC.stream(K, 120, [0, 1, 0, 1, 0, 1], 0.04, K.glow(P.hot, 1.6, 0.85));
  root.add(airIn.mesh, airOut.mesh);
  airIn.box = [d / 2 + 2.6, d / 2 + 0.1, h * 0.65, h * 0.85, -w / 2 + 0.4, w / 2 - 0.4];
  airIn.mesh.rotation.y = -Math.PI / 2;
  airOut.box = [h + 0.3, h + 3.2, -0.25, 0.25, -0.25, 0.25];
  airOut.mesh.rotation.z = Math.PI / 2;
  airOut.mesh.position.set(w * 0.25, 0, -d * 0.15);
  airOut.yfn = null;
  const NA = 6;
  const arrows = Array.from({ length: NA }, () => { const a = K.arrow(P.hot, { r: 0.05, glow: 1.2 }); root.add(a); return a; });
  const tTr = K.tag("Φ transmission", () => new THREE.Vector3(-w / 2 - 1.2, h * 0.7, 0), { color: P.hot });
  const tV = K.tag("Φ ventilation", () => new THREE.Vector3(w * 0.25, h + 2.6, -d * 0.15), { color: P.acc });
  const tPt = K.tag("Φ ponts", () => new THREE.Vector3(w / 2, 0.15, d / 2 + 0.2), { color: P.danger });
  const tH = K.tag("Hbat", () => new THREE.Vector3(0, h + 1.7, 0), { big: true });
  return {
    root,
    shadowBox: 9,
    cam: { pos: [6.5, 5, 8.5], target: [0, 1.6, 0], pad: 0.85 },
    views: SC.views(() => new THREE.Vector3(w / 2, 0.4, d / 2), { label: "Ponts", title: "Zoom sur l’angle : liaisons plancher et refend", dist: 3.2 }),
    update() {
      const Htr = K.v("Htr"), Qv = K.v("Qv"), Psi = K.v("Psi"), L = K.v("Lpt"), dT = K.v("dT2");
      const Hv = 0.34 * Qv, Hpt = Psi * L, Hbat = Htr + Hv + Hpt;
      const r = 0.015 + Psi * 0.06;
      btubes.forEach((t, i) => { t.set(t.userData.a, t.userData.b, r); t.visible = i < Math.max(1, Math.round((L / 120) * edges.length)); });
      airIn.count = Math.round(15 + Qv / 400 * 105); airOut.count = airIn.count;
      airIn.speed = airOut.speed = 0.15 + Qv / 400 * 0.35;
      const Lw = 0.3 + Math.min(Htr, 250) / 250 * 1.5;
      const pos = [[-w / 2, h * 0.3, -d / 4, -1, 0, 0], [-w / 2, h * 0.7, d / 4, -1, 0, 0], [w / 2, h * 0.3, d / 4, 1, 0, 0], [w / 2, h * 0.7, -d / 4, 1, 0, 0], [-w / 4, h * 0.4, -d / 2, 0, 0, -1], [w / 4, h * 0.7, -d / 2, 0, 0, -1]];
      arrows.forEach((a, i) => { const p = pos[i]; a.set(new THREE.Vector3(p[0] + p[3] * 0.06, p[1], p[2] + p[5] * 0.06), new THREE.Vector3(p[3], p[4], p[5]), Lw); });
      wallM.color.copy(P.wall).lerp(SC.tcol(K, -6 + Htr / 250 * 26, -10, 22), 0.6);
      tTr.set("Φ transmission", K.fmt(Htr * dT, 0) + " W");
      tV.set("Φ ventilation", K.fmt(Hv * dT, 0) + " W · Hv " + K.fmt(Hv, 1) + " W/K");
      tPt.set("Φ ponts", K.fmt(Hpt * dT, 0) + " W · Ψ·L " + K.fmt(Hpt, 1) + " W/K");
      tH.set("Hbat = Htr + Hv + Hpt", K.fmt(Hbat, 1) + " W/K");
    },
    tick(dt) { airIn.step(dt); airOut.step(dt); },
  };
});

/* ---------- 03 : DJU et besoin annuel ---------- */
defineScene("dju", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(K.slab(13, 13, 0.3, P.slabTop, P.slab, 0.3));
  const heatM = K.glow(P.hot, 0.6);
  const house = R310.pavilion(K, { w: 2.8, d: 2.2, h: 1.8 });
  root.add(house);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), K.glow(P.hot, 1, 0.12));
  halo.position.y = 1.2;
  root.add(halo);
  // couronne de 30 jours : hauteur = degrés-jours du jour (consigne - T ext)
  const N = 30;
  const cols = [];
  for (let i = 0; i < N; i++) {
    const c = K.box(0.32, 1, 0.32, K.mat(P.acc, { rough: 0.3, metal: 0.1, emissive: P.acc, ei: 0.25, grain: false }), 0.06);
    const a = (i / N) * Math.PI * 2;
    c.position.set(Math.cos(a) * 4.6, 0.5, Math.sin(a) * 4.6);
    c.userData.a = a;
    root.add(c);
    cols.push(c);
    K.tip(c, () => `<b>Jour ${i + 1}</b><br>DJU du jour = max(0, consigne − T<sub>ext</sub>)`);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.15, 5.05, 120), SC.texMat(K, "gravel", { rep: [12, 1] }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  ring.receiveShadow = true;
  root.add(ring);
  const lawnD = new THREE.Mesh(new THREE.CircleGeometry(4.1, 80), SC.texMat(K, "grass", { rep: [4, 4] }));
  lawnD.rotation.x = -Math.PI / 2; lawnD.position.y = 0.05; lawnD.receiveShadow = true;
  root.add(lawnD);
  const tB = K.tag("Besoin saison", () => new THREE.Vector3(0, 3.6, 0), { big: true, color: P.hot });
  // analogie : la puissance Φ = Hbat·ΔT est un compteur de vitesse, l'énergie de la saison un compteur kilométrique
  const speedo = SC.gauge(K, 0.55);
  speedo.position.set(2.2, 1.35, 2.4);
  speedo.rotation.y = 0.35;
  root.add(speedo);
  K.tip(speedo, "<b>Compteur de vitesse</b><br>Φ = H<sub>bat</sub>·ΔT, en W : la vitesse de perte à cet instant.");
  window.LABV4H && window.LABV4H(K, speedo, "Tcons", "dju", "Le compteur de puissance (consigne)", "glisser vers le haut ou le bas pour régler la température de consigne", 3.5, "y");
  window.LABV4H && window.LABV4H(K, ring, "DJU", "dju", "La couronne climatique annuelle", "glisser vers la droite ou la gauche pour changer la rigueur climatique (DJU)", 5, "x");
  const tSp = K.tag("Puissance", () => speedo.localToWorld(new THREE.Vector3(0, 0.75, 0)), { color: P.acc });
  const tOdo = K.tag("Énergie cumulée", () => speedo.localToWorld(new THREE.Vector3(0, -0.75, 0)), { color: P.hot });
  let odo = 0, Bsaison = 1, PhiW = 0;
  const tD = K.tag("DJU du jour", () => cols[0].position.clone().add(new THREE.Vector3(0, cols[0].scale.y + 0.25, 0)), { color: P.acc });
  const tS = K.tag("Saison", () => new THREE.Vector3(0, 0.2, 5.4));
  return {
    root,
    shadowBox: 9,
    cam: { pos: [6, 7, 9], target: [0, 1, 0], pad: 0.85 },
    views: SC.views(() => new THREE.Vector3(1.4, 1.2, 1.6), { label: "Compteurs", title: "Zoom sur le pavillon et le compteur de vitesse", dist: 4.2 }),
    update() {
      const Hbat = K.v("Hbat3"), Tc = K.v("Tcons"), Te = K.v("Text3"), DJU = K.v("DJU");
      const djuJ = Math.max(0, Tc - Te);
      const B = Hbat * DJU * 24 / 1000;
      cols.forEach((c, i) => {
        const Td = Te + 4 * Math.sin(i * 0.9) + 2 * Math.cos(i * 0.37);
        const dj = Math.max(0, Tc - Td);
        const hgt = Math.max(0.02, dj * 0.12);
        c.scale.y = hgt;
        c.position.y = 0.06 + hgt / 2;
        c.userData.dj = dj;
        // couleur du jour : plus il fait froid, plus la colonne vire au bleu glacé
        SC.tcol(K, 20 - dj, -8, 20, c.material.color);
        c.material.emissive.copy(c.material.color);
      });
      halo.scale.setScalar(1.2 + Math.min(B, 25000) / 25000 * 2.4);
      tB.set("B = Hbat × DJU × 24 / 1000", K.fmt(B, 0) + " kWh/an");
      PhiW = Hbat * djuJ;
      Bsaison = B;
      speedo.userData.set(PhiW / 10500);
      tSp.set("Compteur de vitesse", "Φ = Hbat·ΔT = " + K.fmt(PhiW / 1000, 2) + " kW");
      tD.set("DJU du jour", K.fmt(djuJ, 0) + " K·j");
      tS.set("DJU de la saison", K.fmt(DJU, 0) + " K·j");
    },
    tick(dt, t, rdt) {
      halo.material.opacity = 0.08 + 0.05 * Math.sin(t * 2);
      // le compteur kilométrique additionne la saison en 8 s, puis repart
      odo = K.motion ? (odo + (rdt || 0.016) / 8) % 1.15 : 1;
      tOdo.set("Compteur kilométrique", "énergie cumulée " + K.fmt(Math.min(odo, 1) * Bsaison, 0) + " kWh");
    },
  };
});

/* ---------- 04 : étiquette DPE ---------- */
defineScene("dpe", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  const label = K.group();
  root.add(label);
  const bars = R310.DPE.map((r, i) => {
    const len = 1.6 + i * 0.55;
    const b = K.box(len, 0.5, 0.5, K.mat(r.c, { rough: 0.45, emissive: r.c, ei: 0.12 }), 0.08);
    b.position.set(len / 2, 4.2 - i * 0.62, 0);
    b.userData = { len, base: r.c };
    label.add(b);
    const tx = K.textPlane(r.l, { color: "#ffffff", h: 0.42, px: 120, weight: 800 });
    tx.position.set(0.3, 4.2 - i * 0.62, 0.26);
    label.add(tx);
    const rng = K.textPlane(r.max === Infinity ? "> 420" : "≤ " + r.max, { color: P.dark ? "#c7cee0" : "#3a3e4a", h: 0.22, px: 80, weight: 500, font: "'DM Mono', monospace" });
    rng.position.set(len + 0.55, 4.2 - i * 0.62, 0.01);
    label.add(rng);
    return b;
  });
  const board = K.box(5.9, 4.7, 0.12, K.mat(P.dark ? "#1d2536" : "#ffffff", { rough: 0.45, grain: false }), 0.12);
  board.position.set(2.75, 2.35, -0.32);
  const frameB = K.box(6.05, 4.85, 0.06, K.mat(P.acc2, { rough: 0.4, grain: false }), 0.14);
  frameB.position.set(2.75, 2.35, -0.4);
  const legs = [0.6, 4.9].map((x) => { const l = K.box(0.12, 0.6, 0.12, K.mat(P.steel, { metal: 0.7, rough: 0.35 }), 0.02); l.position.set(x, -0.25, -0.35); return l; });
  label.add(board, frameB, ...legs);
  label.position.set(-3, 0.35, 0);
  const marker = K.group();
  const mk = K.box(1.3, 0.62, 0.62, K.mat(P.ink, { rough: 0.3 }), 0.1);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.5, 4), K.mat(P.ink, { rough: 0.3 }));
  tip.rotation.z = Math.PI / 2;
  tip.rotation.x = Math.PI / 4;
  tip.position.x = -0.85;
  marker.add(mk, tip);
  root.add(marker);
  const house = R310.pavilion(K, { w: 2.2, d: 1.8, h: 1.5 });
  house.position.set(-5.2, 0, 0.5);
  root.add(house);
  window.LABV4H && window.LABV4H(K, marker, "Cef", "dpe", "La flèche de classement DPE", "glisser vers le bas ou le haut pour faire varier la consommation finale C_ef", -4, "y");
  window.LABV4H && window.LABV4H(K, house, "Shab", "dpe", "La maquette du logement", "glisser vers la droite ou la gauche pour ajuster la surface habitable S_hab", 4.5, "x");
  const tInd = K.tag("Indicateur", () => marker.position.clone().add(new THREE.Vector3(0.2, 0.55, 0)), { big: true });
  const tC = K.tag("Cep = fp × Cef", () => house.position.clone().add(new THREE.Vector3(0, 3.2, 0)));
  const tG = K.tag("Climat", () => house.position.clone().add(new THREE.Vector3(0, 1.9, 0.9)), { color: "#8e6bd6" });
  let y = 2, ty = 2, tx = 2, x = 2;
  return {
    root,
    shadowBox: 9,
    cam: { pos: [1.5, 3.8, 10], target: [0, 2.2, 0], pad: 0.92 },
    views: SC.views(() => marker.position.clone(), { label: "Classe", title: "Zoom sur la classe obtenue", dist: 3.6, dir: [0.2, 0.25, 1] }),
    update() {
      const Cef = K.v("Cef"), S = K.v("Shab"), fp = K.v("fp");
      const Cep = fp * Cef, ind = Cep / S;
      const L = R310.letter(ind);
      const i = R310.DPE.findIndex((r) => r.l === L);
      bars.forEach((b, j) => {
        b.material.emissiveIntensity = j === i ? 0.75 : 0.05;
        b.scale.z = j === i ? 1.35 : 1;
        b.material.opacity = 1;
      });
      ty = 4.2 - i * 0.62;
      tx = -3 + bars[i].userData.len + 2.1;
      const sc = Math.sqrt(S / 100);
      house.scale.setScalar(sc);
      tInd.set("Classe " + L, K.fmt(ind, 0) + " kWh_ep/(m²·an)").color(R310.DPE[i].c);
      // double seuil DPE 2021 : la plus mauvaise des classes énergie et climat est retenue
      const gesS = (+K.s("energDpe") || 0.079) * Cef / S;
      const GL = [["A", 6], ["B", 11], ["C", 30], ["D", 50], ["E", 70], ["F", 100], ["G", Infinity]].find((r) => gesS <= r[1])[0];
      tG.set("Climat " + GL, K.fmt(gesS, 1) + " kgCO₂e/(m²·an) · étiquette retenue " + (GL > L ? GL : L));
      tC.set("Cep = fp × Cef", K.fmt(Cep, 0) + " kWh_ep/an · " + S + " m²");
    },
    tick(dt, t, rdt) {
      const d = rdt || 0.016;
      y = K.damp(y, ty, 6, d); x = K.damp(x, tx, 6, d);
      marker.position.set(x + Math.sin(t * 3) * 0.05 * K.motion, y, 0);
    },
  };
});

/* ---------- 05 : rénovation de l'enveloppe ---------- */
defineScene("reno", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(12, 5, 0.25, P.slabTop, P.slab, 0.15));
  const H = 2.6, D = 2.2;
  const before = K.box(0.9, H, D, SC.texMat(K, "brick", { rep: [1, 3] }), 0.03);
  before.position.set(-2.6, H / 2, 0);
  const after = K.box(0.9, H, D, SC.texMat(K, "brick", { rep: [1, 3] }), 0.03);
  after.position.set(2.0, H / 2, 0);
  const iso = K.box(1, H, D, SC.texMat(K, "wool"), 0.03);
  root.add(before, after, iso);
  const inB = SC.indoor(K, -3.95, 1.8, D), inA = SC.indoor(K, 0.65, 1.8, D);
  root.add(inB, inA);
  K.tip(before, () => `<b>Mur existant</b> · U₀ = ${K.txt("v-U0")}`);
  K.tip(iso, () => `<b>Isolant ajouté</b> · R<sub>iso</sub> = e/λ`);
  window.LABV4H && window.LABV4H(K, iso, "eiso5", "reno", "Le manteau isolant rapporté", "glisser vers la droite ou la gauche pour régler l’épaisseur d’isolant e", 4.5, "x");
  window.LABV4H && window.LABV4H(K, before, "U0", "reno", "Le mur existant avant travaux", "glisser vers le haut ou le bas pour modifier le coefficient initial U_0", 3.5, "y");
  const aB = Array.from({ length: 6 }, () => { const a = K.arrow(P.hot, { r: 0.06, glow: 1.3 }); root.add(a); return a; });
  const aA = Array.from({ length: 6 }, () => { const a = K.arrow(P.hot, { r: 0.06, glow: 1.3 }); root.add(a); return a; });
  const tB = K.tag("Avant", () => new THREE.Vector3(-2.6, H + 0.4, 0));
  const tA = K.tag("Après", () => new THREE.Vector3(2.4, H + 0.4, 0), { big: true });
  const tG = K.tag("Gain", () => new THREE.Vector3(0, 0.3, D / 2 + 0.4), { color: P.ok });
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1.2, 4, 9.5], target: [0, 1.3, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(2.0, 1.3, 1.1), { label: "Après", title: "Zoom sur le mur rénové", dist: 3.4 }),
    update() {
      const strat = K.s("strat");
      const e = K.v("eiso5") / 100, lam = K.v("liso5"), U0 = K.v("U0");
      const U1 = 1 / (1 / U0 + e / lam);
      const gain = ((U0 - U1) / U0) * 100;
      const W = e * 100 * 0.07;
      iso.scale.x = W;
      const thin = strat !== "ite";
      iso.position.set(thin ? 2.0 - 0.45 - W / 2 : 2.0 + 0.45 + W / 2, H / 2, 0);
      before.material.color.set(0xffffff).lerp(SC.tcol(K, 4 + U0 * 7, -10, 25), 0.55);
      after.material.color.set(0xffffff).lerp(SC.tcol(K, 4 + U1 * 7, -10, 25), 0.3);
      inA.position.x = thin ? 2.0 - 0.45 - W - 0.95 : 2.0 - 0.45 - 0.95;
      const LB = 0.4 + U0 / 2.5 * 1.8, LA = 0.4 + U1 / 2.5 * 1.8;
      aB.forEach((a, i) => a.set(new THREE.Vector3(-2.6 + 0.5, 0.45 + (i % 3) * 0.8, -0.6 + Math.floor(i / 3) * 1.2), new THREE.Vector3(1, 0, 0), LB));
      const xOut = thin ? 2.0 + 0.45 + 0.05 : 2.0 + 0.45 + W + 0.05;
      aA.forEach((a, i) => a.set(new THREE.Vector3(xOut, 0.45 + (i % 3) * 0.8, -0.6 + Math.floor(i / 3) * 1.2), new THREE.Vector3(1, 0, 0), LA));
      tB.set("Avant · U₀", K.fmt(U0, 2) + " W/(m²·K)");
      tA.set((strat === "ite" ? "ITE" : "Isolant mince") + " · U₁", K.fmt(U1, 3) + " W/(m²·K)");
      tG.set("Gain sur U", K.fmt(gain, 0) + " %");
    },
  };
});

/* ---------- 06 : VMC double flux et pompe à chaleur ---------- */
defineScene("sys", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(12, 7, 0.3, P.grass, P.soil, 0.2));
  const lawnS = K.box(11.6, 0.04, 6.6, SC.texMat(K, "grass", { rep: [6, 3.5] }), 0.03);
  lawnS.position.y = 0.06; lawnS.userData.noFit = true;
  root.add(lawnS);
  const house = R310.pavilion(K, { w: 3.6, d: 3, h: 2.4 });
  house.position.set(-1.6, 0, 0);
  root.add(house);
  // échangeur double flux (caisson sur le toit)
  const vmc = K.box(1.2, 0.5, 0.8, K.mat(P.steel, { metal: 0.5, rough: 0.35 }), 0.06);
  vmc.position.set(-1.6, 3.9, 0);
  root.add(vmc);
  K.tip(vmc, () => `<b>VMC double flux</b> · η = ${K.fmt(K.v("eta"), 2)}<br>L’air extrait réchauffe l’air neuf.`);
  const cNew = new THREE.CatmullRomCurve3([[2.2, 4.3, 0.25], [0, 4.1, 0.25], [-1.6, 3.9, 0.25], [-1.6, 2.4, 0.25], [-1.6, 1.6, 0.6]].map((p) => new THREE.Vector3(...p)));
  const cOld = new THREE.CatmullRomCurve3([[-1.2, 1.6, -0.6], [-1.6, 2.4, -0.25], [-1.6, 3.9, -0.25], [0, 4.1, -0.25], [2.2, 4.3, -0.25]].map((p) => new THREE.Vector3(...p)));
  const mNew = K.glow(P.cold, 1.8), mOld = K.glow(P.hot, 1.8);
  const fNew = SC.flow(K, cNew, 46, 0.05, mNew, { speed: 1 }), fOld = SC.flow(K, cOld, 46, 0.05, mOld, { speed: 1 });
  root.add(fNew.mesh, fOld.mesh);
  // gaines d'air : on voit l'air circuler dedans
  root.add(K.tube(cNew, 0.11, K.glass(P.glassC, 0.22), 80, 16), K.tube(cOld, 0.11, K.glass(P.glassC, 0.22), 80, 16));
  [-0.45, 0.45].forEach((x) => { const grid = K.box(0.04, 0.36, 0.6, K.mat(P.dark1, { rough: 0.5 })); grid.position.set(-1.6 + x * 1.33, 3.9, 0); root.add(grid); });
  const pac = R310.pac(K);
  pac.position.set(2.2, 0, 1.2);
  pac.rotation.y = -0.4;
  root.add(pac);
  K.tip(pac, () => `<b>PAC</b> · COP = ${K.fmt(K.v("COP"), 1)}`);
  window.LABV4H && window.LABV4H(K, vmc, "eta", "sys", "Le caisson VMC double flux", "glisser vers la droite ou la gauche pour régler le rendement d’échangeur η", 4, "x");
  window.LABV4H && window.LABV4H(K, pac, "COP", "sys", "L’unité extérieure PAC", "glisser vers le haut ou le bas pour modifier le COP saisonnier", 3.5, "y");
  // flux d'énergie : électricité → chaleur (×COP)
  const eIn = K.arrow(P.gold, { r: 0.07, glow: 1.6 }), qOut = K.arrow(P.hot, { r: 0.07, glow: 1.4 });
  root.add(eIn, qOut);
  const tN = K.tag("Besoin net", () => new THREE.Vector3(-1.6, 5.0, 0), { big: true });
  const tE = K.tag("C élec PAC", () => pac.position.clone().add(new THREE.Vector3(0, 1.4, 0)), { color: P.gold });
  let cop = 3;
  return {
    root,
    shadowBox: 9,
    cam: { pos: [6, 5, 9], target: [0, 2, 0], pad: 0.88 },
    views: SC.views(() => pac.position.clone().add(new THREE.Vector3(0, 0.5, 0)), { label: "PAC", title: "Zoom sur la pompe à chaleur", dist: 3 }),
    update() {
      const bes = K.v("bes"), pV = K.v("partV") / 100, eta = K.v("eta");
      cop = K.v("COP");
      const besNet = bes * (1 - pV) + bes * pV * (1 - eta);
      const Cel = besNet / cop;
      // air neuf réchauffé selon η : du bleu vers l'orange
      mNew.color.copy(P.cold).lerp(P.hot, eta * 0.85);
      mNew.emissive.copy(mNew.color);
      fNew.speed = fOld.speed = 0.8;
      const sE = 0.4 + Math.min(Cel, 30000) / 30000 * 2.2;
      const sQ = 0.4 + Math.min(besNet, 30000) / 30000 * 2.2;
      eIn.set(new THREE.Vector3(4.6, 0.6, 1.2), new THREE.Vector3(-1, 0, 0), Math.min(sE, 1.9));
      qOut.set(new THREE.Vector3(1.6, 0.6, 1.0), new THREE.Vector3(-1, 0, -0.2), Math.min(sQ, 1.8));
      tN.set("Besoin net", K.fmt(besNet, 0) + " kWh");
      tE.set("C élec PAC", K.fmt(Cel, 0) + " kWh (÷ " + K.fmt(cop, 1) + ")");
    },
    tick(dt) {
      fNew.step(dt); fOld.step(dt);
      pac.userData.fan.rotation.z -= dt * (4 + cop * 2);
    },
  };
});

/* ---------- 07 : TRI et CO₂ ---------- */
defineScene("tri", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(K.slab(12, 6, 0.25, P.slabTop, P.slab, 0.15));
  const goldM = K.mat(P.gold, { metal: 0.85, rough: 0.28 });
  const greyM = K.mat(P.steel, { metal: 0.8, rough: 0.3 });
  const okM = K.mat(P.ok, { metal: 0.6, rough: 0.3 });
  const piles = K.group();
  root.add(piles);
  const smokeM = K.mat(P.dark ? "#7d8698" : "#9aa1ad", { opacity: 0.62, rough: 1, grain: false });
  const co2 = [0, 1].map(() => {
    const c = K.group();
    [[0, 0, 0, 0.62], [0.55, -0.15, 0.1, 0.45], [-0.5, -0.18, 0, 0.42], [0.1, 0.38, -0.05, 0.4], [-0.2, -0.1, 0.4, 0.38]].forEach(([x, y, z, r]) => { const b = K.sphere(r, smokeM, 20); b.position.set(x, y, z); b.castShadow = false; c.add(b); });
    root.add(c);
    return c;
  });
  window.LABV4H && window.LABV4H(K, piles, "cout", "tri", "Les piles d’investissement et d’économies", "glisser vers la droite ou la gauche pour ajuster le coût net des travaux", 5, "x");
  window.LABV4H && window.LABV4H(K, co2[0], "COP7", "tri", "Les nuages d’émissions CO₂", "glisser vers le haut ou le bas pour régler le COP de la pompe à chaleur", 3.5, "y");
  const t1 = K.tag("Facture COP = 1", () => new THREE.Vector3(-3.6, h1 + 0.5, 0));
  const t2 = K.tag("Facture PAC", () => new THREE.Vector3(-1.8, h2 + 0.5, 0));
  const tI = K.tag("Investissement", () => new THREE.Vector3(2.8, hI + 0.5, -0.8), { color: P.gold });
  const tT = K.tag("TRI", () => new THREE.Vector3(2.8, 0.2, 1.3), { big: true, color: P.ok });
  const tC = K.tag("CO₂", () => co2[0].position.clone().add(new THREE.Vector3(0.6, co2[0].scale.y + 0.2, 0)));
  let h1 = 1, h2 = 1, hI = 1, key = "";
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1, 4.5, 10.5], target: [0, 1.6, 0], pad: 0.92 },
    views: SC.views(() => new THREE.Vector3(0, 1.4, 0), { label: "Piles", title: "Zoom sur les piles de factures et l’investissement", dist: 5.5 }),
    update() {
      const bes = K.v("bes7"), prix = K.v("prix"), cop = K.v("COP7"), cout = K.v("cout"), f = K.v("fCO2");
      const c1 = bes * prix, cP = (bes / cop) * prix, gain = c1 - cP;
      const TRI = gain > 0 ? cout / gain : Infinity;
      // 1 pièce = 200 € ; piles plafonnées pour rester lisibles
      const unit = 200;
      const n1 = Math.min(40, Math.round(c1 / unit)), n2 = Math.min(40, Math.round(cP / unit)), nI = Math.min(60, Math.round(cout / unit));
      const nG = Number.isFinite(TRI) ? Math.min(60, Math.round(gain / unit)) : 0;
      const k2 = [n1, n2, nI, nG].join("|");
      if (k2 !== key) {
        key = k2;
        piles.children.slice().forEach((c) => { piles.remove(c); c.traverse((o) => o.geometry && o.geometry.dispose()); });
        piles.add(R310.coins(K, n1, greyM, -3.6, 0), R310.coins(K, n2, goldM, -1.8, 0), R310.coins(K, nI, goldM, 2.8, -0.8));
        // gains cumulés année après année jusqu'au retour sur investissement
        const years = Number.isFinite(TRI) ? Math.min(12, Math.ceil(TRI)) : 0;
        for (let y = 0; y < years; y++) piles.add(R310.coins(K, Math.min(nG * (y + 1), nI), okM, 1.6 + (y % 6) * 0.75 - 1.9, 1.3 + Math.floor(y / 6) * 0.8));
      }
      h1 = n1 * 0.1; h2 = n2 * 0.1; hI = nI * 0.1;
      const r1 = 0.3 + Math.cbrt(f * bes) * 0.06, r2 = 0.3 + Math.cbrt(f * bes / cop) * 0.06;
      co2[0].scale.setScalar(r1); co2[0].position.set(-3.6, h1 + 1.1 + r1, -1.2);
      co2[1].scale.setScalar(r2); co2[1].position.set(-1.8, h2 + 1.1 + r2, -1.2);
      t1.set("Facture COP = 1", K.fmt(c1, 0) + " €/an");
      t2.set("Facture PAC", K.fmt(cP, 0) + " €/an");
      tI.set("Investissement", K.fmt(cout, 0) + " €");
      tT.set("TRI", Number.isFinite(TRI) ? K.fmt(TRI, 1) + " ans · gain " + K.fmt(gain, 0) + " €/an" : "pas de gain").color(gain > 0 ? P.ok : P.warn);
      tC.set("CO₂", K.fmt(f * bes, 0) + " → " + K.fmt(f * bes / cop, 0) + " kg/an");
    },
    tick(dt, t) { co2.forEach((c, i) => { c.position.y += Math.sin(t * 1.2 + i) * 0.002 * K.motion; }); },
  };
});