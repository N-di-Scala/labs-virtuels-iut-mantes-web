/* =====================================================================
   R1-1 Méthode de travail universitaire et outils informatiques
   (mission Gymnase de Clairmont) - le classeur devient un plateau 3D.
   ===================================================================== */
const R11 = {
  euro: (x) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
  /* tuile de cellule avec texte gravé sur le dessus */
  cell(K, text, o = {}) {
    const { THREE, P } = K;
    const g = K.group();
    const w = o.w ?? 1.5, d = o.d ?? 0.6, h = o.h ?? 0.12;
    const tile = K.box(w, h, d, K.mat(o.color || (P.dark ? "#253047" : "#ffffff"), { rough: 0.55, emissive: o.glow || "#000000", ei: o.glow ? 0.35 : 0 }), 0.04);
    tile.position.y = h / 2;
    g.add(tile);
    g.userData.tile = tile;
    g.userData.h = h;
    if (text) {
      const t = K.textPlane(text, { color: o.ink || (P.dark ? "#eef2fa" : "#15171d"), h: o.th ?? 0.26, px: 90, weight: o.weight ?? 600, font: o.mono ? "'DM Mono', monospace" : undefined });
      t.rotation.x = -Math.PI / 2;
      t.position.y = h + 0.005;
      g.add(t);
      g.userData.text = t;
    }
    return g;
  },
  /* en-têtes de colonnes / lignes façon tableur */
  headers(K, cols, rows, cw, ch, x0, z0) {
    const g = K.group();
    const hc = K.P.dark ? "#1c3a2c" : "#d9efe2";
    cols.forEach((c, i) => { const t = R11.cell(K, c, { w: cw - 0.06, d: 0.42, color: hc, th: 0.22, mono: true }); t.position.set(x0 + i * cw, 0, z0 - 0.55); g.add(t); });
    for (let r = 0; r < rows; r++) { const t = R11.cell(K, String(r + 1), { w: 0.42, d: ch - 0.06, color: hc, th: 0.2, mono: true }); t.position.set(x0 - cw / 2 - 0.3, 0, z0 + r * ch); g.add(t); }
    return g;
  },
  clear(g) { g.children.slice().forEach((c) => { g.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); }); },
  /* arc lumineux entre deux cellules (dépendance de formule) */
  arc(K, a, b, color, r = 0.025) {
    const { THREE } = K;
    const mid = a.clone().lerp(b, 0.5);
    mid.y += 0.4 + a.distanceTo(b) * 0.25;
    const c = new THREE.QuadraticBezierCurve3(a, mid, b);
    return K.tube(c, r, K.glow(color, 1.8), 40, 8);
  },
  lock(K, color) {
    const g = K.group();
    const body = K.box(0.3, 0.24, 0.12, K.mat(color, { metal: 0.6, rough: 0.3 }), 0.03);
    body.position.y = 0.12;
    const sh = K.torus(0.09, 0.025, K.mat(color, { metal: 0.7, rough: 0.3 }), Math.PI);
    sh.position.y = 0.24;
    g.add(body, sh);
    return g;
  },
};

/* ---------- accueil : chantier du gymnase + tableau de bord ---------- */
defineScene("home", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  root.add(K.slab(16, 10, 0.6, P.dark ? "#3b3a33" : "#e2dccd", P.soil, 0.35));
  const site = K.box(15.6, 0.04, 9.6, SC.texMat(K, "gravel", { rep: [8, 5] }), 0.03);
  site.position.y = 0.06; site.userData.noFit = true;
  root.add(site);
  [[-7, 4], [-7, -4], [7, -4]].forEach(([x, z], i) => { const t = SC.tree(K, 1.4 + i * 0.2); t.position.set(x, 0.08, z); root.add(t); });
  [[-0.2, 2.6, 0.5], [0.6, 3.2, -2]].forEach(([x, z, r], i) => { const pp = SC.person(K, i ? P.acc : P.gold, 0.85); pp.position.set(x, 0.08, z); pp.rotation.y = r; root.add(pp); });
  // ossature du gymnase (portiques acier)
  const gym = K.group();
  const steel = K.mat(P.steel, { metal: 0.8, rough: 0.35 });
  for (let i = 0; i < 6; i++) {
    const z = -2 + i * 0.8;
    [-2.4, 2.4].forEach((x) => { const c = K.box(0.14, 2.6, 0.14, steel); c.position.set(x, 1.3, z); gym.add(c); });
    const beam = K.tube(K.path([[-2.4, 2.6, z], [0, 3.3, z], [2.4, 2.6, z]], 0.01), 0.07, steel, 20, 8);
    gym.add(beam);
  }
  const roofDone = K.box(5, 0.1, 2.4, K.mat(P.acc, { opacity: 0.85, rough: 0.4 }), 0.03);
  roofDone.position.set(0, 3.0, -1.2);
  roofDone.rotation.z = 0;
  gym.add(roofDone);
  const floor = K.box(5.2, 0.08, 4.4, SC.texMat(K, "wood", { rep: [3, 3] }), 0.03);
  floor.position.set(0, 0.04, -0.0);
  gym.add(floor);
  gym.position.set(-2.4, 0, -0.6);
  root.add(gym);
  K.tip(gym, "<b>Gymnase de Clairmont</b><br>Un chantier fictif : le suivi se fait dans un classeur propre et vérifiable.");
  // tableau de bord flottant : barres d'avancement par lot
  const dash = K.group();
  const lots = [0.9, 0.6, 0.35, 0.75];
  const bars = lots.map((v, i) => {
    const b = K.box(0.45, 1, 0.45, K.mat([P.acc, P.acc2, P.gold, P.ok][i], { emissive: [P.acc, P.acc2, P.gold, P.ok][i], ei: 0.3, rough: 0.4 }), 0.05);
    b.position.set(i * 0.7, 0.5, 0);
    b.userData.v = v;
    dash.add(b);
    return b;
  });
  const board = K.box(3.2, 0.08, 1.4, K.mat(P.dark ? "#253047" : "#ffffff", { rough: 0.5 }), 0.04);
  board.position.set(1.05, 0, 0);
  dash.add(board);
  dash.position.set(3.2, 0.1, 1.4);
  root.add(dash);
  K.tip(dash, "<b>Tableau de bord</b><br>Graphiques honnêtes, axes à zéro, unités alignées.");
  // tuiles de classeur qui flottent
  const tiles = K.group();
  ["=SOMME.SI", "$B$1", "HT→TTC", "=SI(…)", "#N/A ?"].forEach((t, i) => {
    const c = R11.cell(K, t, { w: 1.6, d: 0.6, mono: true, th: 0.24, color: i === 1 ? P.gold : undefined, ink: i === 1 ? "#1a1204" : undefined });
    c.position.set(2.2 + (i % 3) * 1.8, 2.2 + Math.floor(i / 3) * 0.8, -1.8 + (i % 2) * 0.6);
    c.rotation.x = 0.9;
    c.userData.base = c.position.y;
    tiles.add(c);
  });
  root.add(tiles);
  root.position.y = -0.6;
  K.tag("Chantier", () => gym.localToWorld(new THREE.Vector3(0, 3.6, 0)), { value: "suivi Excel" });
  K.tag("Tableau de bord", () => dash.localToWorld(new THREE.Vector3(1, 1.4, 0)), { color: P.acc });
  return {
    root,
    shadowBox: 10,
    cam: { pos: [8, 6.5, 12], target: [0, 1.2, 0], shiftX: 0.2, pad: 0.82 },
    tick(dt, t) {
      bars.forEach((b, i) => { const h = 0.2 + b.userData.v * 1.8 * (0.85 + 0.15 * Math.sin(t * 0.8 + i)); b.scale.y = h; b.position.y = h / 2; });
      tiles.children.forEach((c, i) => { c.position.y = c.userData.base + Math.sin(t * 1.1 + i * 1.3) * 0.12; });
    },
  };
});

/* ---------- 01 : références relatives / absolues ---------- */
defineScene("refs", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.desk(K, 10, 7));
  const cw = 1.9, ch = 0.75, x0 = -2.9, z0 = -2.3;
  root.add(R11.headers(K, ["A", "B", "C"], 7, cw, ch, x0, z0));
  const dyn = K.group();
  root.add(dyn);
  const anchor = R11.cell(K, "12,40 €", { w: cw - 0.06, d: ch - 0.06, h: 0.32, color: P.gold, ink: "#1a1204", mono: true, weight: 700 });
  anchor.position.set(x0 + cw, 0, z0);
  root.add(anchor);
  const lk = R11.lock(K, P.gold);
  root.add(lk);
  const fillGrip = K.box(0.28, 0.22, 0.28, K.glow(P.ok, 1.5), 0.05);
  root.add(fillGrip);
  const pulseRing = K.torus(0.95, 0.035, K.glow(P.gold, 2.2));
  pulseRing.rotation.x = Math.PI / 2;
  pulseRing.position.set(x0 + cw, 0.36, z0);
  pulseRing.visible = false;
  root.add(pulseRing);
  let pulseT = 0;
  document.addEventListener("labv4:r11cell", (e) => {
    const d = e.detail || {};
    if (d.atelier && d.atelier !== "refs") return;
    if (d.hasB1) pulseT = 1.6;
  });
  window.LABV4H && window.LABV4H(K, lk, "lockAbs", "refs", "Le cadenas de B1", "cliquer pour basculer entre référence relative (B1) et absolue ($B$1)");
  window.LABV4H && window.LABV4H(K, fillGrip, "nCopies", "refs", "La poignée de recopie (carré vert)", "glisser vers le bas pour étirer la formule sur davantage de lignes", -3.2, "y");
  K.tip(anchor, "<b>Cellule ancre B1</b><br>Le prix unitaire : une seule saisie, référencée partout.");
  const tD = K.tag("Diagnostic", new THREE.Vector3(0, 1.6, z0), { big: true });
  let key = "";
  return {
    root,
    shadowBox: 8,
    cam: { pos: [2.5, 7.5, 7.5], target: [0, 0, 0.2], pad: 0.86, maxPolar: Math.PI * 0.42 },
    views: SC.views(() => anchor.position.clone().add(new THREE.Vector3(0, 0.3, 0)), { label: "Ancre B1", title: "Zoom sur la cellule ancre et ses références", dist: 3.6, coupeLabel: "Dessus", coupeTitle: "Vue de dessus quasi orthographique : le classeur à plat", coupeDir: [0, 1, 0.02] }),
    update() {
      const n = K.v("nCopies");
      const abs = K.s("lockAbs") === "abs";
      lk.visible = true;
      lk.traverse((m) => { if (m.isMesh && m.material) { m.material.transparent = !abs; m.material.opacity = abs ? 1 : 0.38; } });
      lk.position.set(x0 + cw + 0.65, 0.32, z0);
      fillGrip.position.set(x0 + 2 * cw + 0.82, 0.14, z0 + Math.max(1, n) * ch + 0.26);
      const k2 = n + "|" + abs + "|" + P.dark;
      if (k2 === key) return;
      key = k2;
      R11.clear(dyn);
      dyn.add((() => { const c = R11.cell(K, "Paramètre", { w: cw - 0.06, d: ch - 0.06 }); c.position.set(x0, 0, z0); return c; })());
      dyn.add((() => { const c = R11.cell(K, abs ? "$B$1" : "B1", { w: cw - 0.06, d: ch - 0.06, mono: true }); c.position.set(x0 + 2 * cw, 0, z0); return c; })());
      const lines = ["Peinture sol", "Bande adhésive", "Plot signal", "Scotch", "Vis inox", "Craie"];
      for (let i = 0; i < 6; i++) {
        const on = i < n;
        const z = z0 + (i + 1) * ch;
        const okC = P.dark ? "#1f4a37" : "#d7f1e2", badC = P.dark ? "#4a2a2a" : "#fbe0dc";
        const a = R11.cell(K, on ? lines[i] : "", { w: cw - 0.06, d: ch - 0.06, color: on ? (abs ? okC : P.dark ? "#4a4128" : "#fbf0d2") : undefined, th: 0.22 });
        a.position.set(x0, 0, z);
        const b = R11.cell(K, on ? (abs ? "12,40" : "vide") : "", { w: cw - 0.06, d: ch - 0.06, color: on && !abs ? badC : undefined, mono: true, ink: on && !abs ? (P.dark ? "#ff9d9d" : "#9b1c1c") : undefined });
        b.position.set(x0 + cw, 0, z);
        const c = R11.cell(K, on ? (abs ? "× $B$1" : "× B" + (i + 2)) : "", { w: cw - 0.06, d: ch - 0.06, h: on ? 0.2 : 0.12, color: on ? (abs ? okC : P.dark ? "#4a4128" : "#fbf0d2") : undefined, mono: true });
        c.position.set(x0 + 2 * cw, 0, z);
        dyn.add(a, b, c);
        if (on) {
          const from = new THREE.Vector3(x0 + 2 * cw, 0.22, z);
          const to = abs ? new THREE.Vector3(x0 + cw, 0.34, z0) : new THREE.Vector3(x0 + cw, 0.14, z);
          dyn.add(R11.arc(K, from, to, abs ? P.ok : P.warn));
          K.tip(c, abs ? "<b>Référence absolue</b><br>La copie vise toujours B1." : `<b>Référence relative</b><br>La copie a glissé vers B${i + 2} : une cellule vide !`);
        }
      }
      tD.set(abs ? "Ancre verrouillée $B$1" : "Dérive relative", abs ? n + " copies → B1" : n + " copies → cellules vides").color(abs ? P.ok : P.warn);
    },
    tick(dt, t) {
      if (pulseT > 0) {
        pulseT = Math.max(0, pulseT - (dt || 0.016));
        pulseRing.visible = true;
        pulseRing.scale.setScalar(1 + 0.16 * Math.sin(t * 10));
      } else pulseRing.visible = false;
    },
  };
});

/* ---------- 02 : unités ---------- */
defineScene("unites", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  root.add(SC.desk(K, 12, 6));
  const s = 1.6; // 1 m = 1,6 unité
  const bandA = K.box(1, 0.12, 0.5, K.mat(P.acc, { rough: 0.5, emissive: P.acc, ei: 0.2 }), 0.03);
  const bandB = K.box(0.8 * s, 0.12, 0.5, K.mat(P.acc2, { rough: 0.5, emissive: P.acc2, ei: 0.2 }), 0.03);
  const sum = K.box(1, 0.12, 0.5, K.mat(P.ok, { rough: 0.5, emissive: P.ok, ei: 0.25 }), 0.03);
  root.add(bandA, bandB, sum);
  K.tip(bandA, () => `<b>Bande A</b> · ${K.fmt(K.v("lenM"), 2)} m = ${K.fmt(K.v("lenM") * 1000, 0)} mm`);
  K.tip(bandB, "<b>Bande B</b> · 0,80 m = 800 mm");
  // règle graduée
  for (let i = 0; i <= 10; i++) {
    const t = K.box(0.02, 0.02, i % 2 ? 0.12 : 0.24, K.mat(P.mute));
    t.position.set(-5 + i * s * 0.5, 0.01, 1.6);
    root.add(t);
  }
  const coins = K.group();
  const coinPad = K.cyl(0.38, 0.42, 0.06, K.mat(P.dark ? "#2c364c" : "#e2ddd0", { rough: 0.5 }), 28);
  coinPad.position.set(3.8, 0.03, -1.6);
  root.add(coinPad, coins);
  window.LABV4H && window.LABV4H(K, bandA, "lenM", "unites", "La bande A (bleue)", "glisser vers la droite ou la gauche pour changer la longueur en mètres", 5, "x");
  window.LABV4H && window.LABV4H(K, sum, "mixTrap", "unites", "La barre de somme", "cliquer pour basculer entre addition convertie (m) et mélange m + mm");
  window.LABV4H && window.LABV4H(K, coins, "euroAmt", "unites", "La pile de pièces", "glisser vers le haut ou le bas pour modifier le montant en €", 3.2, "y");
  const tA = K.tag("Bande A", () => bandA.position.clone().add(new THREE.Vector3(0, 0.3, 0)), { color: P.acc });
  const tB = K.tag("Bande B", () => bandB.position.clone().add(new THREE.Vector3(0, 0.3, 0)), { color: P.acc2 });
  const tS = K.tag("Somme", () => new THREE.Vector3(Math.min(sumEnd, 5.2) - 0.8, 0.45, 0.9), { big: true });
  const tE = K.tag("Montant", () => new THREE.Vector3(3.8, 1.6, -1.6), { color: P.gold });
  let sumEnd = 0, key = "";
  return {
    root,
    shadowBox: 9,
    cam: { pos: [0.5, 6.5, 8.5], target: [0, 0, 0], pad: 0.9 },
    views: SC.views(() => new THREE.Vector3(-3.2, 0.2, 0), { label: "Bandes", title: "Zoom sur les bandes et leur somme", dist: 4, coupeLabel: "Dessus", coupeTitle: "Vue de dessus quasi orthographique : le classeur à plat", coupeDir: [0, 1, 0.02] }),
    update() {
      const L = K.v("lenM"), e = K.v("euroAmt"), mix = K.s("mixTrap") === "mix";
      const x0 = -5;
      bandA.scale.x = L * s; bandA.position.set(x0 + (L * s) / 2, 0.06, -0.9);
      bandB.position.set(x0 + (0.8 * s) / 2, 0.06, -0.2);
      const total = mix ? L + 800 : L + 0.8;
      const len = mix ? 11 : total * s;
      sum.scale.x = len;
      sum.position.set(x0 + len / 2, 0.06, 0.9);
      sum.material.color.copy(mix ? P.danger : P.ok);
      sum.material.emissive.copy(mix ? P.danger : P.ok);
      sumEnd = x0 + len;
      const nc = Math.round(e / 2);
      if (String(nc) !== key) {
        key = String(nc);
        R11.clear(coins);
        for (let i = 0; i < nc; i++) { const c = K.cyl(0.28, 0.28, 0.07, K.mat(P.gold, { metal: 0.85, rough: 0.28 }), 24); c.position.set(3.8, 0.04 + i * 0.075, -1.6); coins.add(c); }
      }
      tA.set("A", K.fmt(L, 2) + " m · " + K.fmt(L * 1000, 0) + " mm");
      tB.set("B", "0,80 m · 800 mm");
      tS.set(mix ? "Piège : m + mm" : "Somme en m", mix ? K.fmt(L + 800, 1) + " (unité absurde)" : K.fmt(L + 0.8, 2) + " m").color(mix ? P.danger : P.ok);
      tE.set("Montant", R11.euro(e) + " = " + K.fmt(e / 1000, 4) + " k€");
    },
  };
});

/* ---------- 03 : logique SI (heures majorées) ---------- */
defineScene("logique", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 16 }));
  root.add(SC.desk(K, 12, 8));
  // aiguillage : un test, deux voies
  const test = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), K.mat(P.acc, { emissive: P.acc, ei: 0.35, rough: 0.35 }));
  test.position.set(0, 0.8, -2.6);
  test.castShadow = true;
  root.add(test);
  K.tip(test, "<b>Test : heures ≤ 40 ?</b><br>=SI(test ; valeur si vrai ; valeur si faux)");
  const yes = K.path([[0, 0.12, -2.0], [-2.6, 0.12, -0.6], [-2.6, 0.12, 0.6]], 0.6);
  const no = K.path([[0, 0.12, -2.0], [2.6, 0.12, -0.6], [2.6, 0.12, 0.6]], 0.6);
  const yM = K.mat(P.ok, { emissive: P.ok, ei: 0.2 }), nM = K.mat(P.warn, { emissive: P.warn, ei: 0.2 });
  root.add(K.tube(yes, 0.08, yM, 40, 10), K.tube(no, 0.08, nM, 40, 10));
  const token = K.sphere(0.2, K.glow(P.gold, 1.6));
  root.add(token);
  // piles d'heures : simples (vert) puis majorées (orange, ×1,25)
  const stack = K.group();
  root.add(stack);
  window.LABV4H && window.LABV4H(K, test, "heures", "logique", "Le losange du test SI", "glisser vers le haut ou le bas pour modifier les heures travaillées", 3.5, "y");
  window.LABV4H && window.LABV4H(K, stack, "tauxH", "logique", "La pile d’heures rémunérées", "glisser vers le haut ou le bas pour ajuster le taux horaire", 3.5, "y");
  const tY = K.tag("OUI", () => new THREE.Vector3(-2.6, 0.5, 1.1), { color: P.ok });
  const tN = K.tag("NON", () => new THREE.Vector3(2.6, 0.5, 1.1), { color: P.warn });
  const tTot = K.tag("Salaire", () => new THREE.Vector3(0, topY + 0.4, 2.2), { big: true });
  let branch = false, u = 0, key = "", topY = 1;
  return {
    root,
    shadowBox: 9,
    cam: { pos: [1, 6.5, 9], target: [0, 0.6, 0], pad: 0.88 },
    views: SC.views(() => test.position.clone(), { label: "Test SI", title: "Zoom sur l’aiguillage du test", dist: 3.4, coupeLabel: "Dessus", coupeTitle: "Vue de dessus quasi orthographique : le classeur à plat", coupeDir: [0, 1, 0.02] }),
    update() {
      const h = K.v("heures"), t = K.v("tauxH");
      const over = Math.max(0, h - 40), base = Math.min(h, 40);
      const total = base * t + over * t * 1.25;
      branch = h > 40;
      const k2 = h + "|" + P.dark;
      if (k2 !== key) {
        key = k2;
        R11.clear(stack);
        // 1 cube = 2 h
        const per = 2, cube = 0.26;
        const nb = Math.ceil(base / per), no2 = Math.ceil(over / per);
        for (let i = 0; i < nb + no2; i++) {
          const maj = i >= nb;
          const c = K.box(cube, maj ? cube * 1.25 : cube, cube, K.mat(maj ? P.acc2 : P.ok, { rough: 0.45, emissive: maj ? P.acc2 : P.ok, ei: 0.15 }), 0.03);
          const col = i % 5, lay = Math.floor(i / 5);
          c.position.set(-0.6 + col * (cube + 0.04), 0.14 + lay * (cube + 0.03) + (maj ? 0.03 : 0), 2.2);
          stack.add(c);
          topY = c.position.y;
        }
      }
      tY.set("OUI · tarif simple", !branch ? R11.euro(base * t) : "-").show(true);
      tN.set("NON · +25 % au-delà de 40 h", branch ? over + " h majorées" : "-");
      tTot.set("Salaire pédagogique", R11.euro(total) + " · " + base + " h + " + over + " h");
    },
    tick(dt, tt, rdt) {
      u = (u + (rdt || 0.016) * 0.35) % 1;
      const c = branch ? no : yes;
      token.position.copy(c.getPointAt(u)).add(new THREE.Vector3(0, 0.2, 0));
      test.rotation.y += (rdt || 0.016) * 0.6;
    },
  };
});

/* ---------- 04 : HT, TVA, TTC ---------- */
defineScene("tva", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.desk(K, 10, 6));
  const rate = K.cyl(0.5, 0.5, 1, K.mat(P.gold, { metal: 0.6, rough: 0.3, emissive: P.gold, ei: 0.2 }), 40);
  root.add(rate);
  K.tip(rate, "<b>Taux en $B$1</b><br>Une seule cellule, partagée par toutes les lignes.");
  const lock = R11.lock(K, P.gold);
  root.add(lock);
  const rows = [0, 1, 2].map((i) => {
    const ht = K.box(0.7, 1, 0.7, K.mat(P.acc, { rough: 0.45 }), 0.04);
    const tv = K.box(0.7, 1, 0.7, K.mat(P.acc2, { rough: 0.45, emissive: P.acc2, ei: 0.2 }), 0.04);
    const frame = K.box(0.82, 1, 0.82, K.glass(P.glassC, 0.12), 0.05);
    root.add(ht, tv, frame);
    return { ht, tv, frame, x: -2.6 + i * 1.6 };
  });
  window.LABV4H && window.LABV4H(K, rate, "tauxTva", "tva", "La colonne dorée du taux $B$1", "glisser vers le haut ou le bas pour modifier le taux de TVA", 3.2, "y");
  window.LABV4H && window.LABV4H(K, rows[0].ht, "ht", "tva", "La colonne HT de la ligne 1", "glisser vers le haut ou le bas pour changer le montant HT", 3.2, "y");
  const beams = K.group();
  root.add(beams);
  const tags = rows.map((r, i) => K.tag("L" + (i + 1), () => new THREE.Vector3(r.x, r.frame.scale.y + 0.35, 0)));
  const tR = K.tag("Taux $B$1", () => rate.position.clone().add(new THREE.Vector3(0, rate.scale.y / 2 + 0.6, 0)), { big: true, color: P.gold });
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1.5, 4.5, 8.5], target: [0, 1, 0], pad: 0.9 },
    views: SC.views(() => rate.position.clone(), { label: "Taux $B$1", title: "Zoom sur la cellule du taux partagé", dist: 3.2 }),
    update() {
      const ht = K.v("ht"), t = K.v("tauxTva") / 100;
      const vals = [ht, 8.9, 3.2];
      const s = 0.09;
      R11.clear(beams);
      rate.scale.y = 0.3 + t * 8; rate.position.set(3, rate.scale.y / 2, -0.5);
      lock.position.set(3, rate.scale.y + 0.05, -0.5);
      rows.forEach((r, i) => {
        const hH = vals[i] * s, hT = vals[i] * t * s;
        r.ht.scale.y = hH; r.ht.position.set(r.x, hH / 2, 0);
        r.tv.scale.y = Math.max(0.01, hT); r.tv.position.set(r.x, hH + hT / 2, 0);
        r.frame.scale.y = hH + hT + 0.04; r.frame.position.set(r.x, (hH + hT) / 2, 0);
        beams.add(R11.arc(K, new THREE.Vector3(r.x, hH + hT / 2, 0), new THREE.Vector3(3, rate.scale.y * 0.8, -0.5), P.gold, 0.018));
        tags[i].set("L" + (i + 1) + " TTC", R11.euro(vals[i] * (1 + t)) + " (HT " + R11.euro(vals[i]) + ")");
      });
      tR.set("Taux unique $B$1", K.fmt(t * 100, 1) + " %");
    },
  };
});

/* ---------- 05 : synthèse SOMME.SI ---------- */
defineScene("synthese", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.desk(K, 10, 6));
  const POSTES = [{ n: "Peinture", b: 12.4 }, { n: "Quincaillerie", b: 28.5 }, { n: "Signalétique", b: 18.9 }];
  const cols = [P.acc, P.acc2, P.gold];
  const bars = POSTES.map((p, i) => { const b = K.box(1, 1, 1, K.mat(cols[i], { rough: 0.4, emissive: cols[i], ei: 0.2 }), 0.05); root.add(b); return b; });
  // entonnoir de filtrage → bac de la somme
  const funnel = K.cyl(0.9, 0.2, 0.8, K.glass(P.glassC, 0.25), 40, true);
  funnel.position.set(0, 2.6, 1.6);
  root.add(funnel);
  const bin = K.box(1.6, 1, 1.2, K.mat(P.ok, { rough: 0.4, emissive: P.ok, ei: 0.2 }), 0.06);
  root.add(bin);
  window.LABV4H && window.LABV4H(K, funnel, "filtrePoste", "synthese", "L’entonnoir de critère SOMME.SI", "cliquer pour faire défiler le poste filtré (Tous, Peinture, Quincaillerie, Signalétique)");
  window.LABV4H && window.LABV4H(K, bin, "infl", "synthese", "Le bac de la somme sélective", "glisser vers le haut ou le bas pour tester la sensibilité à l’inflation", 3.5, "y");
  K.tip(funnel, "<b>Critère de SOMME.SI</b><br>Il choisit les lignes ; la plage à sommer fournit les valeurs.");
  const tags = POSTES.map((p, i) => K.tag(p.n, () => bars[i].position.clone().add(new THREE.Vector3(0, bars[i].scale.y / 2 + 0.3, 0))));
  const tS = K.tag("Somme sélective", () => bin.position.clone().add(new THREE.Vector3(0, bin.scale.y / 2 + 0.3, 0)), { big: true, color: P.ok });
  const dots = K.dots(40, 0.07, K.glow(P.ok, 1.8));
  root.add(dots);
  const m4 = new THREE.Matrix4();
  let sel = [true, true, true];
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1, 5, 9], target: [0, 1.2, 0], pad: 0.9 },
    views: SC.views(() => bin.position.clone(), { label: "Somme", title: "Zoom sur le bac de la somme sélective", dist: 3.4 }),
    update() {
      const inf = K.v("infl"), f = +K.s("filtrePoste");
      const vals = POSTES.map((p) => p.b * (1 + inf / 100));
      sel = vals.map((_, i) => f === 0 || f === i + 1);
      const tot = vals.reduce((a, v, i) => a + (sel[i] ? v : 0), 0);
      vals.forEach((v, i) => {
        const h = v * 0.08;
        bars[i].scale.set(0.9, h, 0.9);
        bars[i].position.set(-2.6 + i * 2.6, h / 2, -1.4);
        bars[i].material.opacity = sel[i] ? 1 : 0.25;
        bars[i].material.transparent = !sel[i];
        tags[i].set(POSTES[i].n, R11.euro(v)).color(sel[i] ? cols[i] : P.mute);
      });
      const hb = Math.max(0.05, tot * 0.03);
      bin.scale.y = hb; bin.position.set(0, hb / 2, 1.6);
      tS.set("SOMME.SI · " + (f === 0 ? "tous" : POSTES[f - 1].n), R11.euro(tot));
    },
    tick(dt, t) {
      for (let i = 0; i < 40; i++) {
        const src = i % 3;
        const k = ((t * 0.4 + i / 40) % 1);
        const from = bars[src].position.clone().setY(bars[src].scale.y + 0.1);
        const p = from.lerp(new THREE.Vector3(0, 2.9, 1.6), k);
        m4.makeScale(sel[src] ? 1 : 0, sel[src] ? 1 : 0, sel[src] ? 1 : 0).setPosition(p.x, p.y + Math.sin(k * Math.PI) * 0.6, p.z);
        dots.setMatrixAt(i, m4);
      }
      dots.instanceMatrix.needsUpdate = true;
    },
  };
});

/* ---------- 06 : graphiques honnêtes ---------- */
defineScene("graphiques", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.desk(K, 10, 6));
  const cols = [P.acc, P.acc, P.acc2];
  const bars = cols.map((c) => { const b = K.box(0.9, 1, 0.9, K.mat(c, { rough: 0.4, emissive: c, ei: 0.2 }), 0.05); root.add(b); return b; });
  const axis = K.box(0.05, 4, 0.05, K.mat(P.mute));
  axis.position.set(-2.8, 2, -0.6);
  const axisFoot = K.box(0.36, 0.14, 0.36, K.mat(P.acc, { rough: 0.4, emissive: P.acc, ei: 0.25 }), 0.04);
  axisFoot.position.set(-2.8, 0.07, -0.6);
  root.add(axis, axisFoot);
  window.LABV4H && window.LABV4H(K, bars[2], "amp", "graphiques", "La barre de la semaine 3", "glisser vers le haut ou le bas pour modifier l’amplitude réelle", 3.5, "y");
  window.LABV4H && window.LABV4H(K, axisFoot, "zoomAxe", "graphiques", "Le socle de l’axe vertical", "cliquer pour basculer entre origine à 0 et axe tronqué");
  const cut = K.box(4.6, 0.04, 1.4, K.glow(P.danger, 1.2, 0.6));
  root.add(cut);
  const hidden = K.group();
  root.add(hidden);
  const tags = ["S1", "S2", "S3"].map((l, i) => K.tag(l, () => bars[i].position.clone().add(new THREE.Vector3(0, bars[i].scale.y / 2 + 0.3, 0))));
  const tMin = K.tag("Axe", () => new THREE.Vector3(-2.8, 0.25, 0.2), { big: true });
  return {
    root,
    shadowBox: 8,
    cam: { pos: [2, 3.5, 8.5], target: [0, 1.6, 0], pad: 0.9 },
    views: SC.views(() => new THREE.Vector3(-2.8, 0.6, -0.6), { label: "Axe", title: "Zoom sur le pied de l’axe vertical", dist: 3 }),
    update() {
      const amp = K.v("amp"), zoom = K.s("zoomAxe") === "1";
      const data = [98, 100, 100 + amp];
      const ymin = zoom ? Math.min(...data) - 2 : 0;
      const ymax = Math.max(110, Math.max(...data) + 4);
      const H = 3.8;
      data.forEach((v, i) => {
        const h = Math.max(0.03, ((v - ymin) / (ymax - ymin)) * H);
        bars[i].scale.y = h;
        bars[i].position.set(-1.6 + i * 1.6, h / 2, -0.6);
        tags[i].set(["S1", "S2", "S3"][i], K.fmt(v, 0) + " €");
      });
      // zoom trompeur : la base des barres est « coupée » (bande rouge)
      cut.visible = zoom;
      cut.position.set(0, 0.04, -0.6);
      axisFoot.material.color.copy(zoom ? P.danger : P.ok);
      axisFoot.material.emissive.copy(zoom ? P.danger : P.ok);
      const rel = ((data[2] - data[0]) / data[0]) * 100;
      tMin.set(zoom ? "Axe tronqué à " + K.fmt(ymin, 0) + " €" : "Axe à 0", "écart réel " + K.fmt(rel, 1) + " %").color(zoom ? P.danger : P.ok);
    },
  };
});

/* ---------- 07 : qualité (RECHERCHE, SIERREUR, protection) ---------- */
defineScene("qualite", (K) => {
  const { THREE, P } = K;
  const root = K.group();
  root.add(K.ground({ fade: 14 }));
  root.add(SC.desk(K, 11, 6));
  const STOCK = [{ code: "BAN", name: "Bande", px: 12.4 }, { code: "TAP", name: "Tapis", px: 3.2 }, { code: "PEI", name: "Peinture", px: 8.9 }];
  const table = K.group();
  root.add(table);
  const result = K.group();
  root.add(result);
  const beam = K.group();
  root.add(beam);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), K.glow(P.acc, 0.6, 0.12));
  shield.position.set(2.6, 0, 0);
  root.add(shield);
  const lk = R11.lock(K, P.acc);
  lk.scale.setScalar(1.6);
  root.add(lk);
  window.LABV4H && window.LABV4H(K, table, "cle", "qualite", "La table des articles (BAN, TAP, PEI)", "glisser vers le bas ou le haut pour changer le code recherché", -2.6, "y");
  window.LABV4H && window.LABV4H(K, result, "wrapErr", "qualite", "La cellule résultat", "cliquer pour activer ou retirer l’encadrement SIERREUR");
  window.LABV4H && window.LABV4H(K, lk, "prot", "qualite", "Le cadenas de protection", "cliquer pour protéger ou déverrouiller les cellules de formule");
  const tR = K.tag("Résultat", () => new THREE.Vector3(2.6, 1.0, 0.4), { big: true });
  const tP = K.tag("Protection", () => new THREE.Vector3(2.6, 1.9, -0.6), { color: P.acc });
  let key = "";
  return {
    root,
    shadowBox: 8,
    cam: { pos: [1.5, 6, 8], target: [0, 0.3, 0], pad: 0.9 },
    views: SC.views(() => new THREE.Vector3(2.6, 0.4, 0.4), { label: "Résultat", title: "Zoom sur la cellule résultat", dist: 3, coupeLabel: "Dessus", coupeTitle: "Vue de dessus quasi orthographique : le classeur à plat", coupeDir: [0, 1, 0.02] }),
    update() {
      const k = K.v("cle"), wrap = K.s("wrapErr") === "1", prot = K.s("prot") === "1";
      const hit = k >= 1 && k <= 3 ? STOCK[k - 1] : null;
      const k2 = [k, wrap, prot, P.dark].join("|");
      if (k2 === key) return;
      key = k2;
      [table, result, beam].forEach(R11.clear);
      STOCK.forEach((s, i) => {
        const on = hit && hit.code === s.code;
        const c = R11.cell(K, s.code, { w: 1, d: 0.6, mono: true, color: on ? P.ok : undefined, ink: on ? "#06281a" : undefined });
        c.position.set(-3.4, 0, -1.2 + i * 0.75);
        const n = R11.cell(K, s.name, { w: 1.5, d: 0.6, th: 0.22 });
        n.position.set(-2.1, 0, -1.2 + i * 0.75);
        const p = R11.cell(K, K.fmt(s.px, 2), { w: 1, d: 0.6, mono: true, color: on ? P.ok : undefined, ink: on ? "#06281a" : undefined });
        p.position.set(-0.8, 0, -1.2 + i * 0.75);
        table.add(c, n, p);
      });
      const txt = hit ? R11.euro(hit.px) : wrap ? "Non trouvé" : "#N/A";
      const col = hit ? P.ok : wrap ? P.warn : P.danger;
      const out = R11.cell(K, txt, { w: 1.8, d: 0.8, h: 0.3, mono: true, weight: 700, color: col, ink: "#14110a" });
      out.position.set(2.6, 0, 0.4);
      result.add(out);
      if (hit) beam.add(R11.arc(K, new THREE.Vector3(-0.8, 0.15, -1.2 + (k - 1) * 0.75), new THREE.Vector3(2.6, 0.3, 0.4), P.ok));
      else beam.add(R11.arc(K, new THREE.Vector3(-3.4, 0.15, 1.2), new THREE.Vector3(2.6, 0.3, 0.4), col));
      K.tip(out, hit ? "<b>Correspondance trouvée</b>" : wrap ? "<b>SIERREUR</b><br>Un message lisible remplace l’erreur brute." : "<b>#N/A</b><br>La clé ZZZ n’existe pas dans la table.");
      shield.visible = prot;
      lk.visible = true;
      lk.traverse((m) => { if (m.isMesh && m.material) { m.material.transparent = !prot; m.material.opacity = prot ? 1 : 0.35; } });
      lk.position.set(2.6, 1.3, -0.6);
      tR.set("Clé " + (hit ? hit.code : "ZZZ (absente)"), txt).color(col);
      tP.set(prot ? "Formules cadenassées" : "Saisie libre", prot ? "personne n’écrase le calcul" : "risque d’écrasement").show(true).color(prot ? P.acc : P.warn);
    },
    tick(dt, t) { shield.material.opacity = 0.08 + 0.05 * Math.sin(t * 2); },
  };
});