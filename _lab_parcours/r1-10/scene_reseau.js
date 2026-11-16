/* ---------- 08 (v3) : le réseau du Plateau, passif ou actif ---------- */
defineScene("reseau", (K) => {
  const { THREE, P } = K;
  const R = window.LAB_R110_RESEAU;
  const root = K.group();
  root.add(K.ground({ fade: 18 }));
  const SC_H = 0.075;                // échelle verticale : 1 m de charge = 0,075 unité
  const XA = -5.4, XB = 5.0, XS = -4.4; // A, Plateau, station de surpression
  const Z = 0;
  // relief : profil extrudé (plaine en A, coteau, replat du Plateau)
  const soilM = K.mat(P.grass, { rough: 0.95 });
  let terrain = null;
  function buildTerrain(hB) {
    if (terrain) { root.remove(terrain); terrain.geometry.dispose(); }
    const sh = new THREE.Shape();
    sh.moveTo(-7, -0.02); sh.lineTo(-7, 0.02); sh.lineTo(XA + 0.6, 0.02); sh.lineTo(XB - 1.2, hB); sh.lineTo(7, hB); sh.lineTo(7, -0.02); sh.lineTo(-7, -0.02);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false });
    geo.translate(0, 0, -2.6);
    terrain = new THREE.Mesh(geo, soilM);
    terrain.receiveShadow = true;
    root.add(terrain);
  }
  // station de surpression en A
  const station = K.group();
  const hut = K.house({ w: 1.3, d: 1.0, h: 0.8, windows: 1, roof: P.dark1 });
  station.add(hut);
  const pumpGlow = K.box(0.34, 0.12, 0.02, K.glow(P.mute, 1.4));
  pumpGlow.position.set(-0.3, 0.62, 0.52);
  station.add(pumpGlow);
  station.position.set(XS, 0.02, -1.1);
  root.add(station);
  K.tip(station, () => `<b>Station de surpression</b><br>${K.v("HMTr") > 0 ? "HMT " + K.fmt(K.v("HMTr"), 1) + " m · " + K.fmt(state.Pel / 1000, 2) + " kW" : "À l’arrêt (solution passive)"}`);
  // arrivée en A (vanne de sectionnement)
  const valve = K.cyl(0.16, 0.16, 0.5, K.mat(P.acc2, { rough: 0.4, metal: 0.3 }), 24);
  valve.position.set(XA, 0.45, Z);
  root.add(valve);
  K.tip(valve, () => `<b>Point A</b><br>Pression disponible : ${K.txt("v-PAr")}`);
  // hameau du Plateau
  const hamlet = K.group();
  [[0, 0, 1.1], [1.1, -0.9, 0.9], [-0.2, -1.6, 1]].forEach(([x, z, s]) => {
    const hs = K.house({ w: 0.9 * s, d: 0.8 * s, h: 0.65 * s, windows: 2 });
    hs.position.set(x, 0, z);
    hamlet.add(hs);
  });
  root.add(hamlet);
  // conduite (tige dont le rayon suit le diamètre) et eau qui circule
  const pipe = K.rod(K.glass(P.glassC, 0.32), 0.1);
  root.add(pipe);
  const curve = new THREE.LineCurve3(new THREE.Vector3(XA, 0.3, Z), new THREE.Vector3(XB, 1, Z));
  const fl = SC.flow(K, curve, 46, 0.045, K.glow(P.acc, 2.2), { speed: 1 });
  root.add(fl.mesh);
  K.tip(pipe, () => `<b>Conduite PVC ${K.txt("v-Dr")}</b><br>v = ${K.fmt(state.vel, 2)} m/s · h<sub>f</sub> = ${K.fmt(state.hf, 1)} m`);
  // piézomètre au Plateau : la colonne d'eau traduit la pression en B
  const col = K.rod(K.glow(P.ok, 1.2, 0.85), 0.07);
  const colGlass = K.rod(K.glass(P.glassC, 0.2), 0.1);
  root.add(col, colGlass);
  // borne-fontaine témoin au Plateau : jet vif si P_B ≥ 2,2 bar, filet faible sinon
  const tap = K.group();
  const tapPost = K.cyl(0.06, 0.08, 0.42, K.mat(P.steel, { metal: 0.75, rough: 0.3 }), 16);
  tapPost.position.y = 0.21;
  const tapNoz = K.box(0.16, 0.05, 0.05, K.mat(P.steel, { metal: 0.8, rough: 0.3 }));
  tapNoz.position.set(0.06, 0.38, 0);
  tap.add(tapPost, tapNoz);
  root.add(tap);
  K.tip(tap, () => `<b>Borne témoin d’abonné</b><br>Jet franc dès 2,2 bar ; filet mou ou robinet à sec en dessous.`);
  const NJ = 26;
  const jetM = K.glow(P.acc, 2.0);
  const jetDots = K.dots(NJ, 0.038, jetM);
  root.add(jetDots);
  const jm4 = new THREE.Matrix4();
  let jetP = 2.2;
  // ligne de charge et charge requise
  const eM = K.glow(P.dark ? P.gold : P.acc2, 2);
  const e0 = K.rod(eM, 0.035), e1 = K.rod(K.glow(P.ok, 2), 0.035), e2 = K.rod(K.glow(P.dark ? P.gold : P.acc2, 2), 0.035);
  const need = K.rod(K.glow(P.danger, 1.4), 0.025);
  root.add(e0, e1, e2, need);
  // ligne de charge fantôme de l'état A (comparateur A/B)
  const gM = K.glow(P.mute, 0.8, 0.45);
  const g0 = K.rod(gM, 0.025), g1 = K.rod(gM, 0.025), g2 = K.rod(gM, 0.025);
  root.add(g0, g1, g2);
  // poignées : attraper le hameau (dénivelé) ou la flèche du surpresseur (HMT)
  const setIn = (id, val) => { const e = document.getElementById(id); if (!e) return; val = K.clamp(val, +e.min, +e.max); const st = +e.step || 0.5; val = Math.round(val / st) * st; if (+e.value !== val) { e.value = val; e.dispatchEvent(new Event("input", { bubbles: true })); } };
  let dg = null;
  const grip = K.group();
  const gripCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 24), K.glow(P.ok, 1.6));
  const gripBall = K.cyl(0.11, 0.11, 0.08, K.glow(P.ok, 1.2), 24);
  gripCone.position.y = 0.2;
  grip.add(gripCone, gripBall);
  root.add(grip);
  const ZE = -0.05;
  const tA = K.tag("A", () => new THREE.Vector3(XA, yHA + 0.2, ZE));
  const tS = K.tag("Surpresseur", () => new THREE.Vector3(XS, 1.5, -1.1), { color: P.ok });
  const tB = K.tag("Plateau", () => new THREE.Vector3(XB + 1.1, yB + 1.3, -1.0), { big: true });
  const tN = K.tag("Charge requise", () => new THREE.Vector3(XB - 2.4, yN - 0.3, ZE), { color: P.danger });
  const tV = K.tag("v", () => new THREE.Vector3((XA + XB) / 2, (0.3 + yB) / 2 + 0.35, Z));
  const state = { vel: 1, hf: 0, Pel: 0 };
  let yB = 1, yHA = 3, yHB = 2, yN = 3, lastH = -1, yHp = 3;
  K.drag(hamlet, {
    cursor: "ns-resize",
    tip: "<b>Glisser le hameau</b><br>vers le haut ou le bas pour changer le dénivelé Δz",
    onStart(pt) { dg = { y: pt.y, v: K.v("hr") }; },
    onMove(pt) { if (dg) setIn("hr", dg.v + (pt.y - dg.y) / SC_H); },
    onEnd() { dg = null; },
  });
  K.drag(grip, {
    cursor: "ns-resize",
    tip: "<b>Hisser la ligne de charge</b><br>glisser vers le haut pour régler la HMT du surpresseur",
    onStart(pt) { dg = { y: pt.y, v: K.v("HMTr") }; },
    onMove(pt) { if (dg) setIn("HMTr", dg.v + (pt.y - dg.y) / SC_H); },
    onEnd() { dg = null; },
  });
  // formule « vivante » : le terme survolé éclaire son objet
  const hlSet = (objs, on) => objs.forEach((o) => o && o.traverse((m) => {
    if (!m.isMesh || !m.material || !m.material.emissive) return;
    const u = m.userData;
    if (on) { if (u.hl0 == null) { u.hl0 = m.material.emissiveIntensity; u.hlC = m.material.emissive.clone(); } m.material.emissive.copy(P.gold); m.material.emissiveIntensity = Math.max(u.hl0 * 2.5, 0.9); }
    else if (u.hl0 != null) { m.material.emissiveIntensity = u.hl0; m.material.emissive.copy(u.hlC); u.hl0 = null; }
  }));
  document.addEventListener("labv3:term", (e) => {
    if (!e.detail || e.detail.id !== "reseau") return;
    const map = { pa: [valve, e0], hmt: [e1, grip], dz: [terrain, hamlet], hf: [e2, pipe], hs: [e2] };
    hlSet(map[e.detail.term] || [], e.detail.on);
  });
  const V = (x, y, z = ZE) => new THREE.Vector3(x, y, z);
  return {
    root,
    shadowBox: 12,
    cam: { pos: [1.5, 6.4, 13.5], target: [0, 2.2, -0.4], min: 5, max: 30 },
    views: SC.views(() => new THREE.Vector3(XB, yB + 0.8, -0.4), { label: "Plateau", title: "Zoom sur le hameau et son piézomètre", dist: 4 }),
    update() {
      const o = R.compute(K.v, K.s);
      state.vel = o.vel; state.hf = o.hf; state.Pel = o.Pel;
      const hB = o.h * SC_H;
      if (o.h !== lastH) { buildTerrain(hB); lastH = o.h; }
      yB = hB + 0.02;
      hamlet.position.set(XB + 0.9, yB, -1.0);
      const yA0 = 0.3, yB0 = yB + 0.28;
      curve.v1.set(XA, yA0, Z); curve.v2.set(XB, yB0, Z);
      curve.updateArcLengths && curve.updateArcLengths();
      pipe.set(V(XA - 0.4, yA0, Z), V(XB + 0.4, yB0, Z), 0.05 + o.D / 1000 * 0.9);
      const HA = o.PA * 1e5 / (999 * SC.g), Hp = HA + o.HMT, HB = Hp - o.hf - o.hs;
      const Hneed = o.h + R.PMIN * 1e5 / (999 * SC.g);
      yHA = HA * SC_H; yHp = Hp * SC_H; yHB = HB * SC_H; yN = Hneed * SC_H;
      e0.set(V(XA, yHA), V(XS + 0.1, yHA));
      e1.set(V(XS + 0.1, yHA), V(XS + 0.1, yHp)); e1.visible = o.HMT > 0.05;
      e2.set(V(XS + 0.1, yHp), V(XB, yHB));
      grip.position.set(XS + 0.1, yHp + 0.12, ZE);
      const A = window.LABV3 && window.LABV3.snapOut ? window.LABV3.snapOut("reseau") : null;
      [g0, g1, g2].forEach((gg) => { gg.visible = !!A; });
      if (A) {
        const HAa = A.PA * 1e5 / (999 * SC.g) * SC_H, Hpa = HAa + A.HMT * SC_H, HBa = Hpa - (A.hf + A.hs) * SC_H;
        g0.set(V(XA, HAa, ZE + 0.25), V(XS + 0.1, HAa, ZE + 0.25));
        g1.set(V(XS + 0.1, HAa, ZE + 0.25), V(XS + 0.1, Hpa, ZE + 0.25)); g1.visible = A.HMT > 0.05;
        g2.set(V(XS + 0.1, Hpa, ZE + 0.25), V(XB, HBa, ZE + 0.25));
      }
      need.set(V(XB - 2.6, yN), V(XB + 1.9, yN));
      const ok = o.PB >= R.PMIN;
      col.material.color.copy(ok ? P.ok : P.danger); col.material.emissive.copy(ok ? P.ok : P.danger);
      col.set(V(XB, yB0), V(XB, Math.max(yB0 + 0.01, yHB)), 0.07);
      colGlass.set(V(XB, yB0), V(XB, Math.max(yN, yHB) + 0.3), 0.1);
      pumpGlow.material.color.copy(o.HMT > 0.05 ? P.ok : P.mute); pumpGlow.material.emissive.copy(o.HMT > 0.05 ? P.ok : P.mute);
      tA.set("A", K.fmt(o.PA, 2) + " bar");
      tS.set("Surpresseur", o.HMT > 0.05 ? "+" + K.fmt(o.HMT, 1) + " m · " + K.fmt(o.Pel / 1000, 2) + " kW" : "à l’arrêt").color(o.HMT > 0.05 ? P.ok : P.mute);
      tB.set("Plateau", K.fmt(o.PB, 2) + " bar").color(ok ? P.ok : P.danger);
      tN.set("Requis", "2,2 bar");
      const vOk = o.vel >= 0.5 && o.vel <= 1.5;
      tV.set("v", K.fmt(o.vel, 2) + " m/s" + (o.vel < 0.5 ? " · stagne" : o.vel > 1.5 ? " · trop rapide" : "")).color(vOk ? P.acc : P.warn);
      fl.speed = 0.3 + o.vel * 1.6;
      jetP = o.PB;
      tap.position.set(XB + 0.35, yB, -0.45);
      const jc = o.PB >= R.PMIN ? P.acc : o.PB > 0.3 ? P.warn : P.danger;
      jetM.color.copy(jc); jetM.emissive.copy(jc);
    },
    tick(dt, t) {
      fl.step(dt);
      const pPos = Math.max(0, jetP);
      const reach = Math.min(1.1, pPos * 0.28);
      const hPeak = Math.min(0.95, pPos * 0.24);
      for (let i = 0; i < NJ; i++) {
        if (pPos <= 0.05) { jm4.makeScale(0, 0, 0); jetDots.setMatrixAt(i, jm4); continue; }
        const u = ((t * (0.9 + Math.min(pPos, 4) * 0.35) + i / NJ) % 1);
        const x = tap.position.x + 0.12 + u * reach;
        const y = tap.position.y + 0.38 + Math.sin(u * Math.PI * 0.85) * hPeak - u * u * 0.36;
        const sc = (1 - u * 0.35) * (jetP >= R.PMIN ? 1.05 : 0.7);
        jm4.makeScale(sc, sc, sc).setPosition(x, Math.max(yB + 0.02, y), tap.position.z);
        jetDots.setMatrixAt(i, jm4);
      }
      jetDots.instanceMatrix.needsUpdate = true;
    },
  };
});
