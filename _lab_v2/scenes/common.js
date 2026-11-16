/* Outils partagés par les scènes (ajoutés au kit au moment de la construction). */
const SC = {
  g: 9.81,
  /* particules qui circulent le long d'une courbe (eau dans une conduite) */
  flow(K, curve, n, r, mat, opts = {}) {
    const { THREE } = K;
    const im = K.dots(n, r, mat);
    const s = Array.from({ length: n }, (_, i) => ({ u: i / n, a: Math.random() * Math.PI * 2, rr: Math.sqrt(Math.random()) * (opts.spread ?? 0) }));
    const m4 = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const nrm = new THREE.Vector3();
    const bin = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const api = {
      mesh: im,
      speed: opts.speed ?? 0.1,
      step(dt) {
        const L = curve.getLength();
        s.forEach((q, i) => {
          q.u = (q.u + (api.speed * dt) / L + 1) % 1;
          curve.getPointAt(q.u, p);
          if (q.rr) {
            curve.getTangentAt(q.u, tan);
            nrm.crossVectors(tan, Math.abs(tan.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
            bin.crossVectors(tan, nrm).normalize();
            p.addScaledVector(nrm, Math.cos(q.a) * q.rr).addScaledVector(bin, Math.sin(q.a) * q.rr);
          }
          m4.makeTranslation(p.x, p.y, p.z);
          im.setMatrixAt(i, m4);
        });
        im.instanceMatrix.needsUpdate = true;
      },
    };
    api.step(0);
    return api;
  },
  /* arbre stylisé basse définition */
  tree(K, h = 1) {
    const g = K.group();
    const trunk = K.cyl(0.05 * h, 0.07 * h, 0.4 * h, K.mat(K.P.wood), 8);
    trunk.position.y = 0.2 * h;
    const crown = new K.THREE.Mesh(new K.THREE.IcosahedronGeometry(0.34 * h, 0), K.mat(K.P.dark ? "#3f7a5c" : "#7fb27a", { flat: true, rough: 0.9 }));
    crown.position.y = 0.62 * h;
    crown.castShadow = true;
    g.add(trunk, crown);
    return g;
  },
  /* tube vertical gradué (piézomètre) : le verre suit la hauteur d'eau */
  piezo(K, maxH, r = 0.07) {
    const { THREE, P } = K;
    const g = K.group();
    const glass = K.cyl(r, r, 1, K.glass(P.glassC, 0.22), 24, true);
    const water = K.cyl(r * 0.78, r * 0.78, 1, K.glow(P.acc, 0.55, 0.9), 20);
    water.castShadow = false;
    const meniscus = K.cyl(r * 0.95, r * 0.95, 0.012, K.glow(P.acc, 2.2), 20);
    const ticks = [];
    for (let y = 0.25; y < maxH * 1.3; y += 0.25) {
      const t = K.box(0.06, 0.008, 0.008, K.mat(P.mute));
      t.position.set(r + 0.03, y, 0);
      t.castShadow = false;
      g.add(t);
      ticks.push(t);
    }
    g.add(glass, water, meniscus);
    g.userData.set = (lvl) => {
      const l = Math.max(0.001, lvl);
      const gh = Math.max(0.8, l + 0.45);
      glass.scale.y = gh;
      glass.position.y = gh / 2;
      ticks.forEach((t) => { t.visible = t.position.y < gh; });
      water.scale.y = l;
      water.position.y = l / 2;
      meniscus.position.y = l;
      water.visible = lvl > 0.002;
      meniscus.visible = lvl > 0.002;
    };
    g.userData.set(maxH / 2);
    return g;
  },
  /* couleur « caméra thermique » : froid (bleu) → tiède → chaud (rouge) */
  tcol(K, T, Tmin = -10, Tmax = 25, out) {
    const c = out || new K.THREE.Color();
    const u = Math.max(0, Math.min(1, (T - Tmin) / (Tmax - Tmin)));
    const stops = [[0, 0.6, 0.85, 0.55], [0.35, 0.53, 0.75, 0.62], [0.55, 0.14, 0.75, 0.72], [0.78, 0.06, 0.85, 0.6], [1, 0.0, 0.85, 0.52]];
    let i = 0;
    while (i < stops.length - 2 && u > stops[i + 1][0]) i++;
    const a = stops[i], b = stops[i + 1];
    const k = (u - a[0]) / (b[0] - a[0] || 1);
    c.setHSL(a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k);
    return c;
  },
  /* bloc dont la couleur varie le long de x (profil de température) */
  gradBox(K, w, h, d, segX = 24, r = 0) {
    const { THREE } = K;
    const g = new THREE.BoxGeometry(w, h, d, segX, 1, 1);
    const n = g.attributes.position.count;
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }));
    m.castShadow = true; m.receiveShadow = true;
    const tmp = new THREE.Color();
    m.userData.paint = (fn) => {
      const p = g.attributes.position, c = g.attributes.color;
      for (let i = 0; i < n; i++) { fn((p.getX(i) + w / 2) / w, tmp); c.setXYZ(i, tmp.r, tmp.g, tmp.b); }
      c.needsUpdate = true;
    };
    return m;
  },
  /* nuage de particules qui traverse une boîte selon x (flux de chaleur, vapeur...) */
  stream(K, n, box, r, mat) {
    const { THREE } = K;
    const im = K.dots(n, r, mat);
    const q = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), s: 0.7 + Math.random() * 0.6 }));
    const m4 = new THREE.Matrix4();
    const api = {
      mesh: im, box, speed: 0.2, count: n, yfn: null,
      step(dt) {
        const b = api.box;
        for (let i = 0; i < n; i++) {
          const p = q[i];
          if (i >= api.count) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); continue; }
          p.x += api.speed * p.s * dt;
          if (p.x > 1) { p.x -= 1; p.y = Math.random(); p.z = Math.random(); }
          const x = b[0] + (b[1] - b[0]) * p.x;
          let y = b[2] + (b[3] - b[2]) * p.y;
          if (api.yfn) y = api.yfn(p.x, p.y, y);
          m4.makeTranslation(x, y, b[4] + (b[5] - b[4]) * p.z);
          im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
      },
    };
    api.step(0);
    return api;
  },
  /* polyligne lumineuse (profil T(x), Pv(x)...) : tiges + rotules réutilisées, aucune réallocation */
  ribbon(K, n, color, r = 0.025) {
    const { THREE } = K;
    const g = K.group();
    const mat = K.glow(color, 1.8);
    const rods = [], joints = [];
    const ensure = (k) => {
      while (joints.length < k) { const j = K.sphere(r, mat, 10); j.castShadow = false; g.add(j); joints.push(j); }
      while (rods.length < k - 1) { const rd = K.rod(mat, r); rd.castShadow = false; g.add(rd); rods.push(rd); }
    };
    g.userData.set = (pts) => {
      const v = pts.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)));
      ensure(v.length);
      joints.forEach((j, i) => { j.visible = i < v.length; if (j.visible) j.position.copy(v[i]); });
      rods.forEach((rd, i) => { if (i < v.length - 1) rd.set(v[i], v[i + 1]); else rd.visible = false; });
    };
    g.userData.mat = mat;
    return g;
  },
  /* axe de lecture fléché (sens croissant) avec le nom de la grandeur et son unité ;
     set(a, b) le replace (points [x, y, z] ou Vector3), ticks : graduations [{ p, t }] */
  axis(K, label, o = {}) {
    const { THREE, P } = K;
    const g = K.group();
    const col = o.color || (P.dark ? "#9aa6b8" : "#4a5468");
    const ar = K.arrow(col, { r: o.r ?? 0.012, glow: 0.5 });
    ar.traverse((m) => { if (m.isMesh) m.castShadow = false; });
    g.add(ar);
    const A = new THREE.Vector3(), B = new THREE.Vector3();
    const tg = K.tag(label, () => B.clone().add(o.labelOffset || new THREE.Vector3(0, 0.12, 0)), { color: col });
    tg.el.classList.add("v4-axis"); // repère d'axe : masqué au niveau « essentiel » des étiquettes
    const ticks = [];
    g.userData.set = (a, b, tk) => {
      A.set(...(a.isVector3 ? a.toArray() : a)); B.set(...(b.isVector3 ? b.toArray() : b));
      const d = B.clone().sub(A);
      ar.set(A, d, d.length());
      (tk || []).forEach((x, i) => {
        if (!ticks[i]) ticks[i] = { p: new THREE.Vector3(), tag: null };
        ticks[i].p.set(...(x.p.isVector3 ? x.p.toArray() : x.p));
        if (!ticks[i].tag) { const T = ticks[i]; T.tag = K.tag(x.t, () => T.p, { color: col }); T.tag.el.classList.add("v4-axis"); }
        ticks[i].tag.set(x.t).show(true);
      });
      for (let i = (tk || []).length; i < ticks.length; i++) if (ticks[i].tag) ticks[i].tag.show(false);
    };
    g.userData.tag = tg;
    g.userData.show = (b) => { g.visible = b; tg.show(b); ticks.forEach((T) => T.tag && T.tag.show(b)); };
    return g;
  },
  /* flèche de flux : son épaisseur et sa longueur suivent la valeur (rapportée à vmax) */
  flux(K, color, label, o = {}) {
    const { THREE } = K;
    const ar = K.arrow(color, { r: 0.05, glow: o.glow ?? 1.5 });
    ar.traverse((m) => { if (m.isMesh) m.castShadow = false; });
    const mid = new THREE.Vector3();
    const tg = label ? K.tag(label, () => mid.clone().add(o.labelOffset || new THREE.Vector3(0, 0.3, 0)), { color, big: !!o.big }) : null;
    ar.userData.setFlux = (from, dir, v, vmax, Lmin, Lmax, txt) => {
      const k = Math.max(0, Math.min(1, Math.abs(v) / (vmax || 1)));
      ar.userData.r = (o.rmin ?? 0.025) + (o.rmax ?? 0.16) * Math.sqrt(k);
      const L = Lmin + (Lmax - Lmin) * k;
      const d = dir.clone().normalize();
      ar.set(from, d, L);
      mid.copy(from).addScaledVector(d, L / 2);
      if (tg) tg.set(null, txt);
    };
    ar.userData.tag = tg;
    return ar;
  },
  /* trois vues caméra par atelier : ensemble, coupe de face (quasi orthographique, alignée sur la Fig. 2), détail */
  views(focus, o = {}) {
    return [
      { label: "3/4", title: "Vue studio : toute la scène" },
      { label: o.coupeLabel || "Coupe", title: o.coupeTitle || "Vue de face quasi orthographique, alignée sur le schéma 2D (Fig. 2)", dir: o.coupeDir || [0, 0.04, 1], fov: 14, pad: o.coupePad ?? 0.9 },
    ];
  },
  /* cadran de manomètre simple */
  gauge(K, r = 0.32) {
    const { THREE, P } = K;
    const g = K.group();
    const body = K.cyl(r, r, 0.12, K.mat(P.steel, { metal: 0.85, rough: 0.3 }), 40);
    body.rotation.x = Math.PI / 2;
    const face = K.cyl(r * 0.88, r * 0.88, 0.01, K.mat(P.dark ? "#e9edf3" : "#ffffff", { rough: 0.5 }), 40);
    face.rotation.x = Math.PI / 2;
    face.position.z = 0.065;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r * 0.7, 0.012, 6, 40, Math.PI * 1.5), K.mat("#3a4150"));
    arc.position.z = 0.072;
    arc.rotation.z = -Math.PI * 0.25;
    const red = new THREE.Mesh(new THREE.TorusGeometry(r * 0.7, 0.02, 6, 20, Math.PI * 0.3), K.glow(P.danger, 0.6));
    red.position.z = 0.073;
    red.rotation.z = -Math.PI * 0.25;
    const needle = K.box(r * 0.62, 0.025, 0.01, K.mat(P.danger, { emissive: P.danger, ei: 0.4 }));
    needle.geometry.translate(r * 0.31, 0, 0);
    needle.position.z = 0.08;
    const hub = K.cyl(0.035, 0.035, 0.03, K.mat("#222"), 16);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.085;
    g.add(body, face, arc, red, needle, hub);
    g.userData.set = (frac) => { needle.rotation.z = Math.PI * 1.25 - Math.max(0, Math.min(1, frac)) * Math.PI * 1.5; };
    g.userData.set(0);
    return g;
  },
};

/* =====================================================================
   Matières dessinées (canvas) et accessoires de mise en scène, partagés par tous les labs.
   Les textures sont générées une fois, puis réutilisées (aucun fichier image externe).
   ===================================================================== */
SC._tx = {};
Object.assign(SC, {
  /* texture procédurale : concrete, wool, plaster, brick, wood, eps, grass, soil, steel, tile, asphalt, gravel */
  tex(K, kind) {
    if (SC._tx[kind]) return SC._tx[kind];
    const { THREE } = K;
    const n = 256, c = document.createElement("canvas");
    c.width = c.height = n;
    const g = c.getContext("2d");
    const R = (a, b) => a + Math.random() * (b - a);
    const speck = (cnt, cols, rmin, rmax, alpha = 1) => { for (let i = 0; i < cnt; i++) { g.globalAlpha = alpha * R(0.4, 1); g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(R(0, n), R(0, n), R(rmin, rmax), 0, 7); g.fill(); } g.globalAlpha = 1; };
    const noise = (amp) => { const im = g.getImageData(0, 0, n, n); for (let i = 0; i < im.data.length; i += 4) { const d = (Math.random() - 0.5) * amp; im.data[i] += d; im.data[i + 1] += d; im.data[i + 2] += d; } g.putImageData(im, 0, 0); };
    const fill = (c0) => { g.fillStyle = c0; g.fillRect(0, 0, n, n); };
    if (kind === "concrete") { fill("#b9b7b2"); speck(900, ["#a3a09a", "#cfccc6", "#8f8c86"], 0.6, 2.2, 0.7); speck(40, ["#6f6c67"], 1, 2.5, 0.6); noise(18); }
    else if (kind === "wool") { fill("#e9c56a"); g.lineWidth = 1.2; for (let i = 0; i < 700; i++) { g.strokeStyle = ["#d6ae4c", "#f4d98c", "#c99b3a", "#fae7a8"][i % 4]; g.globalAlpha = R(0.3, 0.8); g.beginPath(); const x = R(-20, n), y = R(0, n); g.moveTo(x, y); g.bezierCurveTo(x + R(5, 20), y + R(-6, 6), x + R(20, 40), y + R(-6, 6), x + R(30, 60), y + R(-4, 4)); g.stroke(); } g.globalAlpha = 1; noise(10); }
    else if (kind === "eps") { fill("#f1f1ee"); for (let i = 0; i < 260; i++) { g.strokeStyle = "rgba(150,150,150,0.25)"; g.beginPath(); g.arc(R(0, n), R(0, n), R(5, 9), 0, 7); g.stroke(); } noise(8); }
    else if (kind === "plaster") { fill("#eeeae3"); speck(1200, ["#e4dfd6", "#f6f3ee"], 0.5, 1.6, 0.6); noise(8); }
    else if (kind === "brick") { fill("#cfc6b8"); const bh = n / 8, bw = n / 4; for (let r = 0; r < 8; r++) for (let k = -1; k < 5; k++) { const x = k * bw + (r % 2 ? bw / 2 : 0); g.fillStyle = ["#a9543c", "#b5603f", "#9c4a35", "#ba6a48"][(r * 5 + k + 8) % 4]; g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4); } noise(22); }
    else if (kind === "wood") { fill("#c4925f"); for (let i = 0; i < 90; i++) { g.strokeStyle = ["#a8774a", "#d6a674", "#b5824f"][i % 3]; g.globalAlpha = R(0.3, 0.7); g.lineWidth = R(0.6, 2.2); g.beginPath(); const y = R(0, n); g.moveTo(0, y); for (let x = 0; x <= n; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 3); g.stroke(); } g.globalAlpha = 1; g.fillStyle = "rgba(90,60,30,0.35)"; for (let p = 0; p < 4; p++) g.fillRect(0, (p * n) / 4, n, 1.5); noise(10); }
    else if (kind === "grass") { fill("#6f9e5c"); speck(2500, ["#5e8c4c", "#86b36d", "#4f7d40", "#9cc47f"], 0.5, 1.8, 0.8); noise(14); }
    else if (kind === "soil") { fill("#8a6a4c"); speck(1400, ["#755a40", "#9d7b59", "#5f4733", "#b08d69"], 0.6, 2.4, 0.8); noise(18); }
    else if (kind === "gravel") { fill("#9c968c"); speck(700, ["#b8b2a7", "#7f796f", "#c9c3b8", "#6a655d"], 1.5, 4, 0.9); noise(14); }
    else if (kind === "asphalt") { fill("#4a4d53"); speck(2200, ["#5a5d63", "#3c3f44", "#6b6e74"], 0.4, 1.3, 0.8); noise(14); }
    else if (kind === "tile") { fill("#dcd6cc"); g.strokeStyle = "rgba(90,80,60,0.35)"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { const p = (i * n) / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, n); g.moveTo(0, p); g.lineTo(n, p); g.stroke(); } noise(10); }
    else if (kind === "roof") { fill("#a9553f"); const rh = n / 10; for (let r = 0; r < 10; r++) { for (let k = -1; k < 9; k++) { const x = k * (n / 8) + (r % 2 ? n / 16 : 0); g.fillStyle = ["#b45d44", "#a24f39", "#bd664c", "#984632"][(r * 3 + k + 9) % 4]; g.beginPath(); g.moveTo(x + 1, r * rh); g.lineTo(x + n / 8 - 1, r * rh); g.quadraticCurveTo(x + n / 8 - 1, r * rh + rh, x + n / 16, r * rh + rh); g.quadraticCurveTo(x + 1, r * rh + rh, x + 1, r * rh); g.fill(); } g.fillStyle = "rgba(40,15,10,0.35)"; g.fillRect(0, r * rh + rh - 1.5, n, 1.5); } noise(16); }
    else if (kind === "pv") { fill("#c9d0da"); const k = 6, cw = n / k; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const gr = g.createLinearGradient(i * cw, j * cw, (i + 1) * cw, (j + 1) * cw); gr.addColorStop(0, "#22366b"); gr.addColorStop(1, "#14244d"); g.fillStyle = gr; g.fillRect(i * cw + 2, j * cw + 2, cw - 4, cw - 4); g.fillStyle = "rgba(200,210,230,0.35)"; g.fillRect(i * cw + 2, j * cw + cw / 2, cw - 4, 1); } }
    else if (kind === "foam") { fill("#4a5468"); const k = 8, cw = n / k; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const x = i * cw, y = j * cw; const gr = g.createLinearGradient(x, y, x + cw, y + cw); gr.addColorStop(0, "#6b7590"); gr.addColorStop(0.5, "#454e63"); gr.addColorStop(1, "#2f3646"); g.fillStyle = gr; g.beginPath(); g.moveTo(x + cw / 2, y + 1); g.lineTo(x + cw - 1, y + cw / 2); g.lineTo(x + cw / 2, y + cw - 1); g.lineTo(x + 1, y + cw / 2); g.fill(); } }
    else if (kind === "steel") { fill("#b9c0ca"); for (let i = 0; i < 400; i++) { g.strokeStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(60,70,80,0.15)"; g.beginPath(); const y = R(0, n); g.moveTo(0, y); g.lineTo(n, y + R(-1, 1)); g.stroke(); } }
    else fill("#cccccc");
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return (SC._tx[kind] = t);
  },
  /* matière texturée ; o.rep = [rx, ry] répétitions, o.tint = couleur multipliée */
  texMat(K, kind, o = {}) {
    const { THREE } = K;
    const base = SC.tex(K, kind);
    const map = o.rep ? base.clone() : base;
    if (o.rep) { map.repeat.set(o.rep[0], o.rep[1]); map.needsUpdate = true; }
    const rough = { concrete: 0.85, wool: 0.98, eps: 0.9, plaster: 0.9, brick: 0.85, wood: 0.65, grass: 0.95, soil: 0.97, gravel: 0.95, asphalt: 0.9, tile: 0.5, steel: 0.35, pv: 0.22, foam: 1 }[kind] ?? 0.8;
    const m = new THREE.MeshStandardMaterial({ map, roughness: o.rough ?? rough, metalness: kind === "steel" ? 0.75 : kind === "pv" ? 0.5 : 0, bumpMap: map, bumpScale: o.bump ?? (kind === "wool" ? 2.5 : kind === "brick" ? 2 : 1.2) });
    if (o.tint) m.color = o.tint instanceof THREE.Color ? o.tint.clone() : new THREE.Color(o.tint);
    if (K.P.dark) m.color.multiplyScalar(o.darkK ?? 0.82);
    if (o.opacity != null && o.opacity < 1) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
    return m;
  },
  /* volume d'air coloré : plan au dégradé doux (remplace les aplats) */
  air(K, color, w, h) {
    const { THREE, P } = K;
    if (!SC._tx.airGrad) {
      const c = document.createElement("canvas");
      c.width = 64; c.height = 128;
      const g = c.getContext("2d");
      const gx = g.createLinearGradient(0, 0, 64, 0);
      gx.addColorStop(0, "rgba(255,255,255,0)"); gx.addColorStop(0.25, "rgba(255,255,255,1)"); gx.addColorStop(0.75, "rgba(255,255,255,1)"); gx.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gx; g.fillRect(0, 0, 64, 128);
      g.globalCompositeOperation = "destination-in";
      const gy = g.createLinearGradient(0, 0, 0, 128);
      gy.addColorStop(0, "rgba(255,255,255,0)"); gy.addColorStop(0.3, "rgba(255,255,255,1)"); gy.addColorStop(1, "rgba(255,255,255,0.85)");
      g.fillStyle = gy; g.fillRect(0, 0, 64, 128);
      SC._tx.airGrad = new THREE.CanvasTexture(c);
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, map: SC._tx.airGrad, transparent: true, opacity: P.dark ? 0.16 : 0.2, depthWrite: false, side: THREE.DoubleSide }));
    m.userData.noFit = true;
    return m;
  },
  /* radiateur à éléments */
  radiator(K, n = 8) {
    const { P } = K;
    const g = K.group();
    const m = K.mat(P.dark ? "#d9dde3" : "#f4f5f7", { rough: 0.35, metal: 0.2, grain: false });
    for (let i = 0; i < n; i++) { const f = K.box(0.06, 0.55, 0.12, m, 0.025); f.position.set(-((n - 1) * 0.075) / 2 + i * 0.075, 0.42, 0); g.add(f); }
    const p = K.cyl(0.018, 0.018, n * 0.075 + 0.1, K.mat(P.steel, { metal: 0.8, rough: 0.3 }), 10);
    p.rotation.z = Math.PI / 2; p.position.y = 0.17; g.add(p);
    return g;
  },
  /* plante en pot */
  plant(K, s = 1) {
    const { THREE, P } = K;
    const g = K.group();
    const pot = K.cyl(0.13 * s, 0.1 * s, 0.22 * s, K.mat(P.dark ? "#a0573e" : "#c2694a", { rough: 0.8 }), 20);
    pot.position.y = 0.11 * s; g.add(pot);
    const lm = K.mat(P.dark ? "#3f8a5e" : "#5aa66f", { rough: 0.7, flat: true });
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.42 * s, 5), lm); l.castShadow = true; const a = (i / 7) * Math.PI * 2; l.position.set(Math.cos(a) * 0.04 * s, 0.38 * s, Math.sin(a) * 0.04 * s); l.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); g.add(l); }
    return g;
  },
  /* silhouette humaine stylisée (échelle) */
  person(K, color, s = 1) {
    const { THREE, P } = K;
    const g = K.group();
    const m = K.mat(color || (P.dark ? "#7aa2d6" : "#4f78b0"), { rough: 0.6 });
    const skin = K.mat(P.dark ? "#d9b59a" : "#e8c3a6", { rough: 0.7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * s, 0.55 * s, 6, 14), m);
    body.position.y = 0.72 * s; body.castShadow = true;
    const head = K.sphere(0.13 * s, skin, 20); head.position.y = 1.36 * s;
    const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.11 * s, 0.4 * s, 4, 10), K.mat(P.dark ? "#2a3243" : "#3a4150"));
    legs.position.y = 0.3 * s; legs.scale.x = 1.35; legs.castShadow = true;
    g.add(legs, body, head);
    return g;
  },
  /* nuage doux */
  cloud(K, s = 1) {
    const { P } = K;
    const g = K.group();
    const m = K.mat(P.dark ? "#cfd8e8" : "#ffffff", { rough: 1, grain: false, emissive: P.dark ? "#334" : "#ffffff", ei: P.dark ? 0.2 : 0.15 });
    [[0, 0, 0, 0.5], [0.45, -0.05, 0.05, 0.38], [-0.45, -0.08, 0, 0.36], [0.15, 0.22, -0.05, 0.36]].forEach(([x, y, z, r]) => { const b = K.sphere(r * s, m, 18); b.position.set(x * s, y * s, z * s); b.castShadow = false; g.add(b); });
    g.userData.noFit = true;
    return g;
  },
  /* flocons ou gouttes qui tombent dans une boîte [x0,x1,y0,y1,z0,z1] */
  fall(K, n, box, r, mat, speed = 0.4) {
    const { THREE } = K;
    const im = K.dots(n, r, mat);
    im.userData.noFit = true;
    const q = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), s: 0.6 + Math.random() * 0.8, p: Math.random() * 6 }));
    const m4 = new THREE.Matrix4();
    const api = {
      mesh: im, box, speed, on: 1,
      step(dt, t = 0) {
        const b = api.box;
        for (let i = 0; i < n; i++) {
          const p = q[i];
          p.y -= api.speed * p.s * dt / Math.max(0.1, b[3] - b[2]);
          if (p.y < 0) { p.y += 1; p.x = Math.random(); p.z = Math.random(); }
          const k = api.on;
          m4.makeScale(k, k, k).setPosition(b[0] + (b[1] - b[0]) * p.x + Math.sin(t * 1.3 + p.p) * 0.05, b[2] + (b[3] - b[2]) * p.y, b[4] + (b[5] - b[4]) * p.z);
          im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
        im.visible = api.on > 0.01;
      },
    };
    api.step(0);
    return api;
  },
  /* bande de décor intérieur (parquet, radiateur, plante) centrée en x */
  indoor(K, x, w = 2.2, d = 2.6) {
    const g = K.group();
    const fl = K.box(w, 0.04, d, SC.texMat(K, "wood", { rep: [w / 1.2, d / 1.2] }), 0.01);
    fl.position.set(x, 0.06, 0); g.add(fl);
    const rad = SC.radiator(K, 7); rad.position.set(x + w * 0.3, 0.08, -d * 0.2); rad.rotation.y = Math.PI / 2; g.add(rad);
    const pl = SC.plant(K, 0.9); pl.position.set(x - w * 0.25, 0.08, -d * 0.3); g.add(pl);
    g.userData.noFit = true;
    return g;
  },
  /* bande de décor extérieur (gazon, arbre) centrée en x */
  outdoor(K, x, w = 2.2, d = 2.6) {
    const g = K.group();
    const gr = K.box(w, 0.05, d, SC.texMat(K, "grass", { rep: [w / 1.5, d / 1.5] }), 0.01);
    gr.position.set(x, 0.065, 0); g.add(gr);
    const t = SC.tree(K, 1.1); t.position.set(x + w * 0.2, 0.09, -d * 0.28); g.add(t);
    g.userData.noFit = true;
    return g;
  },
});
/* arbre plus fin : houppier en masses lisses, deux tons */
SC.tree = function (K, h = 1) {
  const { THREE, P } = K;
  const g = K.group();
  const trunk = K.cyl(0.045 * h, 0.075 * h, 0.5 * h, K.mat(P.dark ? "#7a5a3e" : "#8a6545", { rough: 0.9 }), 10);
  trunk.position.y = 0.25 * h;
  g.add(trunk);
  const c1 = K.mat(P.dark ? "#3c7a58" : "#6da66a", { rough: 0.85, flat: true });
  const c2 = K.mat(P.dark ? "#2f6649" : "#5a9258", { rough: 0.85, flat: true });
  [[0, 0.68, 0, 0.3, c1], [0.14, 0.58, 0.08, 0.22, c2], [-0.13, 0.6, -0.06, 0.21, c2], [0.02, 0.86, -0.02, 0.2, c1]].forEach(([x, y, z, r, m]) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * h, 1), m);
    b.position.set(x * h, y * h, z * h); b.castShadow = true; b.receiveShadow = true; g.add(b);
  });
  return g;
};
/* bloc thermique : il reçoit le grain d'une matière (texture multipliée par les couleurs de sommet) */
SC._gradBox0 = SC.gradBox;
SC.gradBox = function (K, w, h, d, segX = 24, r = 0, kind = "plaster") {
  const m = SC._gradBox0(K, w, h, d, segX, r);
  if (kind) { const t = SC.tex(K, kind); m.material.map = t; m.material.bumpMap = t; m.material.bumpScale = 1.2; m.material.needsUpdate = true; }
  return m;
};

  /* coulisses de la coupe : pièce chauffée d'un côté, jardin (et neige s'il gèle) de l'autre */
SC.sides = function (K, D = 2.6) {
  const { THREE, P } = K;
  const inn = SC.indoor(K, 0, 2.3, D), out = SC.outdoor(K, 0, 2.3, D);
  const snow = SC.fall(K, 60, [-1, 1, 0.1, 3.2, -D / 2, D / 2], 0.03, K.mat("#ffffff", { rough: 0.9, grain: false }), 0.35);
  out.add(snow.mesh);
  const lamp = new THREE.PointLight(0xffb070, P.dark ? 2.2 : 1, 4, 1.8);
  lamp.position.set(0, 1.6, 0.6);
  inn.add(lamp);
  return {
    inn, out, snow,
    place(xIn, xOut, Text) {
      inn.position.x = xIn; out.position.x = xOut;
      snow.target = Text <= 1 ? 1 : 0;
    },
    step(dt, t) { snow.on = K.damp(snow.on, snow.target ?? 0, 3, dt || 0.016); snow.step(dt, t); },
  };
};

/* soleil : disque lumineux, halo doux et couronne de rayons qui tourne lentement */
SC.sun = function (K, r = 0.4) {
  const { THREE, P } = K;
  const s = K.sphere(r, K.glow(P.gold, 3), 28);
  s.castShadow = false;
  s.userData.noFit = true;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.8, 24, 16), new THREE.MeshBasicMaterial({ color: P.gold, transparent: true, opacity: 0.18, depthWrite: false }));
  const halo2 = new THREE.Mesh(new THREE.SphereGeometry(r * 2.8, 24, 16), new THREE.MeshBasicMaterial({ color: P.gold, transparent: true, opacity: 0.07, depthWrite: false }));
  const rays = K.group();
  for (let i = 0; i < 12; i++) { const b = K.box(r * 0.12, r * 0.7, r * 0.05, K.glow(P.gold, 1.6, 0.8)); b.castShadow = false; const a = (i / 12) * Math.PI * 2; b.position.set(Math.cos(a) * r * 1.65, Math.sin(a) * r * 1.65, 0); b.rotation.z = a - Math.PI / 2; rays.add(b); }
  rays.onBeforeRender = () => {};
  s.add(halo, halo2, rays);
  s.onBeforeRender = (renderer, scene, camera) => { rays.quaternion.copy(camera.quaternion); rays.rotateZ(performance.now() * 0.0002); };
  return s;
};

/* =====================================================================
   Décors de travail : bureau d'études (R1-1) et paillasse d'essais (R1-13).
   Le plan de travail remplace le socle ; les accessoires restent en bordure
   et n'entrent pas dans le cadrage (noFit).
   ===================================================================== */
Object.assign(SC, {
  prop: {
    laptop(K) {
      const { P } = K;
      const g = K.group();
      const alu = K.mat(P.dark ? "#9aa3b2" : "#c3c8d0", { metal: 0.7, rough: 0.3, grain: false });
      const base = K.box(1.3, 0.05, 0.85, alu, 0.03); base.position.y = 0.025;
      const keys = K.box(1.1, 0.01, 0.45, K.mat("#1e2430", { rough: 0.6, grain: false })); keys.position.set(0, 0.055, -0.08);
      const lid = K.group();
      const back = K.box(1.3, 0.85, 0.04, alu, 0.03); back.position.y = 0.425;
      const scr = K.box(1.18, 0.72, 0.01, K.glow(P.ok, P.dark ? 0.9 : 0.5)); scr.position.set(0, 0.43, 0.022);
      lid.add(back, scr); lid.position.set(0, 0.05, -0.42); lid.rotation.x = -0.25;
      g.add(base, keys, lid);
      return g;
    },
    mug(K, c) {
      const g = K.group();
      const m = K.mat(c || "#e8e4dc", { rough: 0.35, grain: false });
      const b = K.cyl(0.12, 0.11, 0.26, m, 24); b.position.y = 0.13;
      const h = K.torus(0.07, 0.02, m); h.position.set(0.13, 0.14, 0); h.rotation.y = 0;
      const coffee = K.cyl(0.105, 0.105, 0.01, K.mat("#3b2416", { rough: 0.2, grain: false }), 20); coffee.position.y = 0.24;
      g.add(b, h, coffee);
      return g;
    },
    lamp(K) {
      const { THREE, P } = K;
      const g = K.group();
      const m = K.mat(P.dark1, { metal: 0.5, rough: 0.35, grain: false });
      const foot = K.cyl(0.22, 0.25, 0.05, m, 28); foot.position.y = 0.025;
      const a1 = K.rod(m, 0.025); a1.set(new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0.1, 0.85, 0));
      const a2 = K.rod(m, 0.025); a2.set(new THREE.Vector3(0.1, 0.85, 0), new THREE.Vector3(0.55, 0.95, 0));
      const head = K.cyl(0.07, 0.17, 0.2, m, 24, true); head.position.set(0.62, 0.85, 0); head.rotation.z = 0.5;
      const bulb = K.sphere(0.06, K.glow("#ffe2a8", 2.5), 14); bulb.position.set(0.6, 0.8, 0);
      const li = new THREE.SpotLight(0xffd9a0, P.dark ? 6 : 2.5, 4, 0.7, 0.6, 1.5); li.position.set(0.6, 0.8, 0); li.target.position.set(0.9, 0, 0);
      g.add(foot, a1, a2, head, bulb, li, li.target);
      return g;
    },
    binders(K, n = 4) {
      const { P } = K;
      const g = K.group();
      const cols = [P.acc, P.acc2, P.gold, P.ok, "#7b8bd6"];
      for (let i = 0; i < n; i++) { const b = K.box(0.14, 0.62, 0.5, K.mat(cols[i % cols.length], { rough: 0.5, grain: false }), 0.02); b.position.set(i * 0.15, 0.31, 0); b.rotation.z = i === n - 1 ? -0.18 : 0; if (i === n - 1) b.position.x += 0.05; g.add(b); const lab = K.box(0.1, 0.12, 0.01, K.mat("#ffffff", { grain: false })); lab.position.set(i * 0.15 + (i === n - 1 ? 0.05 : 0), 0.4, 0.255); lab.rotation.z = b.rotation.z; g.add(lab); }
      return g;
    },
    papers(K) {
      const g = K.group();
      for (let i = 0; i < 4; i++) { const p = K.box(0.6, 0.008, 0.84, K.mat("#fbfaf6", { rough: 0.9, grain: false })); p.position.set(i * 0.03, 0.006 + i * 0.009, i * 0.02); p.rotation.y = (i - 1.5) * 0.08; p.castShadow = false; g.add(p); }
      const pen = K.cyl(0.015, 0.015, 0.5, K.mat("#2a5bd7", { rough: 0.3, grain: false }), 10); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5; pen.position.set(0.1, 0.06, 0.1); g.add(pen);
      return g;
    },
    roll(K) {
      const g = K.group();
      [0, 1, 2].forEach((i) => { const r = K.cyl(0.07, 0.07, 1.1, K.mat(["#e9e4d6", "#dfe8f1", "#efe0cf"][i], { rough: 0.8, grain: false }), 16); r.rotation.z = Math.PI / 2; r.rotation.y = 0.2 * i; r.position.set(0, 0.07 + (i === 2 ? 0.12 : 0), i === 2 ? 0.07 : i * 0.15); g.add(r); });
      return g;
    },
    helmet(K, c) {
      const { THREE } = K;
      const g = K.group();
      const m = K.mat(c || "#f2b31c", { rough: 0.35, grain: false });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.castShadow = true;
      const brim = K.cyl(0.29, 0.29, 0.02, m, 28); brim.scale.z = 1.15;
      const ridge = K.box(0.05, 0.05, 0.44, m, 0.02); ridge.position.y = 0.2;
      g.add(dome, brim, ridge); g.position.y = 0.01;
      return g;
    },
    calculator(K) {
      const g = K.group();
      const b = K.box(0.34, 0.04, 0.5, K.mat("#2b303b", { rough: 0.5, grain: false }), 0.03); b.position.y = 0.02;
      const s = K.box(0.26, 0.005, 0.1, K.mat("#b9d4a0", { emissive: "#6f8f50", ei: 0.2, grain: false })); s.position.set(0, 0.043, -0.16);
      g.add(b, s);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const k = K.box(0.05, 0.015, 0.05, K.mat(j === 3 ? "#f08a2e" : "#c7ccd6", { rough: 0.5, grain: false })); k.position.set(-0.1 + j * 0.067, 0.045, -0.03 + i * 0.07); g.add(k); }
      return g;
    },
    beaker(K, h = 0.4, c) {
      const { P } = K;
      const g = K.group();
      const gl = K.cyl(0.13, 0.13, h, K.glass(P.glassC, 0.25), 24, true); gl.position.y = h / 2;
      const liq = K.cyl(0.12, 0.12, h * 0.55, K.mat(c || P.acc, { opacity: 0.6, rough: 0.1, grain: false }), 24); liq.position.y = h * 0.28;
      g.add(gl, liq);
      return g;
    },
    mould(K) {
      const g = K.group();
      const m = K.mat("#5b6472", { metal: 0.6, rough: 0.4, grain: false });
      const c = K.cyl(0.16, 0.16, 0.4, m, 24, true); c.position.y = 0.2;
      const conc = K.cyl(0.15, 0.15, 0.38, SC.texMat(K, "concrete"), 24); conc.position.y = 0.19;
      g.add(c, conc);
      return g;
    },
    scale(K) {
      const { P } = K;
      const g = K.group();
      const b = K.box(0.6, 0.12, 0.6, K.mat(P.dark ? "#d9dde4" : "#f4f5f7", { rough: 0.35, grain: false }), 0.04); b.position.y = 0.06;
      const plate = K.cyl(0.24, 0.24, 0.02, K.mat(P.steel, { metal: 0.85, rough: 0.25, grain: false }), 32); plate.position.set(0, 0.13, -0.05);
      const disp = K.box(0.3, 0.07, 0.01, K.glow(P.ok, 1.2)); disp.position.set(0, 0.07, 0.305);
      g.add(b, plate, disp);
      return g;
    },
    caliper(K) {
      const { P } = K;
      const g = K.group();
      const m = K.mat(P.steel, { metal: 0.9, rough: 0.25, grain: false });
      const bar = K.box(0.9, 0.015, 0.07, m); bar.position.y = 0.01;
      const j1 = K.box(0.04, 0.015, 0.22, m); j1.position.set(-0.43, 0.01, 0.12);
      const j2 = K.box(0.04, 0.015, 0.22, m); j2.position.set(-0.2, 0.01, 0.12);
      g.add(bar, j1, j2);
      return g;
    },
    goggles(K) {
      const { P } = K;
      const g = K.group();
      const fr = K.mat(P.acc2, { rough: 0.4, grain: false });
      [-0.09, 0.09].forEach((x) => { const l = K.torus(0.07, 0.018, fr); l.position.set(x, 0.03, 0); l.rotation.x = -Math.PI / 2 + 0.3; g.add(l); });
      const strap = K.torus(0.2, 0.012, K.mat("#2b303b", { grain: false }), Math.PI); strap.rotation.x = -Math.PI / 2; strap.position.set(0, 0.02, -0.02); g.add(strap);
      return g;
    },
  },
  /* plan de travail : plateau, chant, pieds ; puis accessoires posés à des points de bordure */
  workTop(K, w, d, o = {}) {
    const { THREE, P } = K;
    const g = K.group();
    const top = K.box(w, 0.18, d, o.topM, 0.06);
    top.position.y = -0.05;
    const edge = K.box(w + 0.04, 0.06, d + 0.04, K.mat(o.edge || P.acc2, { rough: 0.4, grain: false }), 0.03);
    edge.position.y = -0.17;
    const legM = K.mat(P.dark1, { metal: 0.6, rough: 0.35, grain: false });
    g.add(top, edge);
    // tiroirs sous le plateau, en retrait (le plateau repose sur le sol de la scène)
    [-1, 1].forEach((sg) => { const c = K.box(Math.min(1.6, w * 0.2), 0.12, d * 0.8, legM, 0.03); c.position.set(sg * (w / 2 - Math.min(0.8, w * 0.1) - 0.2), -0.2, 0); c.userData.noFit = true; g.add(c); });
    (o.props || []).forEach(([name, u, v, rot, s, arg]) => {
      const pr = SC.prop[name](K, arg);
      pr.position.set(u * (w / 2 - 0.9), 0.04, v * (d / 2 - 0.6));
      pr.rotation.y = rot || 0;
      pr.scale.setScalar((s || 1) * (o.ps ?? 2.2));
      pr.userData.noFit = true;
      g.add(pr);
    });
    return g;
  },
  desk(K, w, d) {
    return SC.workTop(K, w, d, {
      topM: SC.texMat(K, "wood", { rep: [w / 3, d / 3], tint: "#f2e3cf" }),
      props: [["laptop", -0.8, -0.78, 0.35, 1], ["mug", 0.9, -0.82, 0, 1, "#e8e4dc"], ["lamp", 0.92, -0.55, -2.4, 1], ["binders", -0.97, 0.15, Math.PI / 2, 1, 4], ["papers", 0.86, 0.78, -0.3, 1], ["roll", -0.6, 0.86, 0.1, 1], ["helmet", 0.62, -0.86, 0.4, 0.9], ["calculator", 0.95, 0.15, -0.2, 1]],
    });
  },
  bench(K, w, d) {
    return SC.workTop(K, w, d, {
      topM: SC.texMat(K, "tile", { rep: [w / 1.2, d / 1.2], tint: "#b9c6d2" }),
      edge: K.P.dark1,
      props: [["beaker", -0.92, -0.8, 0, 1, 0.42], ["beaker", -0.84, -0.86, 0, 1, 0.3], ["mould", 0.9, -0.82, 0, 1], ["mould", 0.82, -0.62, 0, 1], ["scale", -0.9, 0.7, 0.2, 1], ["caliper", 0.78, 0.82, -0.3, 1], ["goggles", 0.62, 0.86, 0.2, 1.2], ["papers", -0.68, 0.84, 0.25, 1], ["helmet", 0.95, 0.1, 0.5, 0.9, "#ffffff"]],
    });
  },
});
