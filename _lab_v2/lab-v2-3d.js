/* =====================================================================
   Labs virtuels IUT Mantes - moteur 3D v2 (three.js, module ES)
   Un seul WebGLRenderer partagé ; chaque atelier déclare sa scène via
   defineScene(id, (K) => ({ root, cam, update, tick, views })).
   En cas d'échec (hors-ligne, WebGL absent) : repli sur les schémas 2D.
   ===================================================================== */
const LAB3D = { factories: {}, inst: {} };
function defineScene(id, factory) { LAB3D.factories[id] = factory; }

(async () => {
  const root = document.documentElement;
  const fail = (why) => {
    console.warn("[lab v2] 3D indisponible :", why);
    root.classList.add("v2-no3d");
  };
  if (!window.LABV2) { fail("interface v2 absente"); return; }
  let THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry;
  try {
    [THREE, { OrbitControls }, { RoomEnvironment }, { RoundedBoxGeometry }] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/environments/RoomEnvironment.js"),
      import("three/addons/geometries/RoundedBoxGeometry.js"),
    ]);
  } catch (e) { fail(e && e.message); return; }
  // halo lumineux (bloom) : facultatif, la scène reste rendue sans lui
  let PP = null;
  try {
    const [a, b, c, d, e] = await Promise.all([
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/OutputPass.js"),
      import("three/addons/postprocessing/ShaderPass.js"),
    ]);
    PP = { EffectComposer: a.EffectComposer, RenderPass: b.RenderPass, UnrealBloomPass: c.UnrealBloomPass, OutputPass: d.OutputPass, ShaderPass: e.ShaderPass };
  } catch (_) { PP = null; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { fail("WebGL"); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "v2-gl";
  const LOWQ = (navigator.hardwareConcurrency || 8) <= 4 || /Mobi|Android/i.test(navigator.userAgent);
  let composer = null, renderPass = null, bloom = null, backPass = null;
  if (PP && !LOWQ) {
    try {
      const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
      composer = new PP.EffectComposer(renderer, rt);
      renderPass = new PP.RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
      renderPass.clearAlpha = 0;
      bloom = new PP.UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.55, 1.0);
      composer.addPass(renderPass);
      // le halo s'ajoute à la couleur sans toucher à l'opacité : le fond peint ensuite reste net
      if (bloom.blendMaterial) Object.assign(bloom.blendMaterial, { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
      composer.addPass(bloom);
      composer.addPass(new PP.OutputPass());
      // fond studio peint après le rendu (couleurs exactes du thème, halo compris)
      backPass = new PP.ShaderPass({
        uniforms: { tDiffuse: { value: null }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uC: { value: new THREE.Color() }, uAsp: { value: 1 } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
        fragmentShader: "uniform sampler2D tDiffuse; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uAsp; varying vec2 vUv;"
          + "void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv - vec2(0.5, 0.65)) * vec2(1.0 / 1.2, 1.0 / 0.95) * 2.0; float r = length(d);"
          + " vec3 bg = r < 0.55 ? mix(uA, uB, r / 0.55) : mix(uB, uC, clamp((r - 0.55) / 0.45, 0.0, 1.0));"
          + " float a = clamp(c.a, 0.0, 1.0); gl_FragColor = vec4(c.rgb + bg * (1.0 - a), 1.0); }",
      });
      composer.addPass(backPass);
    } catch (e) { console.warn("[lab v2] halo indisponible", e); composer = null; }
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const col = (c, fb = "#888888") => { try { return new THREE.Color(c || fb); } catch (_) { return new THREE.Color(fb); } };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
  const fmt = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });

  function palette() {
    const dark = root.dataset.theme !== "light";
    return {
      dark,
      acc: col(css("--water"), "#41c7e4"),
      acc2: col(css("--accent"), "#e08a5a"),
      ok: col(css("--ok"), "#3ecf8e"),
      warn: col(css("--warn"), "#f2b73f"),
      danger: col(css("--danger"), "#f47d7d"),
      gold: col(css("--gold"), "#ffd166"),
      ink: col(dark ? "#eef2fa" : "#15171d"),
      mute: col(dark ? "#8d97b3" : "#6c7080"),
      slab: col(dark ? "#1a2232" : "#d8d1c4"),
      slabTop: col(dark ? "#222c3f" : "#ece7de"),
      grass: col(dark ? "#2e5b48" : "#9cc79a"),
      soil: col(dark ? "#3a2e27" : "#b9a189"),
      concrete: col(dark ? "#9097a3" : "#b9bcc2"),
      steel: col(dark ? "#aab4c4" : "#9aa3b2"),
      dark1: col(dark ? "#2a3243" : "#4a505c"),
      wall: col(dark ? "#d8d2c8" : "#efe9de"),
      roof: col(dark ? "#a4523f" : "#b6563f"),
      wood: col(dark ? "#a87a52" : "#c08a5c"),
      insul: col(dark ? "#e8c46a" : "#f0cf74"),
      glassC: col(dark ? "#9fd8ff" : "#7fb8e0"),
      water: col(dark ? "#3fb7e6" : "#2f8fc7"),
      hot: col("#ff6b4a"),
      cold: col("#4aa8ff"),
      gridC: col(dark ? "#8fa0c8" : "#5a5f70"),
    };
  }

  /* ---------------- textures procédurales partagées (grain des matières, plateau de maquette) ---------------- */
  const TEX = {};
  function grainTex() {
    if (TEX.grain) return TEX.grain;
    const n = 256, c = document.createElement("canvas");
    c.width = c.height = n;
    const g = c.getContext("2d"), im = g.createImageData(n, n);
    // bruit de valeur à deux octaves, raccord sur les bords
    const lat = (k) => { const a = new Float32Array(k * k); for (let i = 0; i < a.length; i++) a[i] = Math.random(); return a; };
    const L1 = lat(16), L2 = lat(64);
    const smp = (L, k, x, y) => { const fx = x * k / n, fy = y * k / n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const v = (i, j) => L[((j + k) % k) * k + ((i + k) % k)];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy; };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 0.55 * smp(L1, 16, x, y) + 0.3 * smp(L2, 64, x, y) + 0.15 * Math.random();
      const i = (y * n + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.round(v * 255); im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return (TEX.grain = t);
  }
  function boardTex(dark) {
    const k = dark ? "d" : "l";
    if (TEX["board" + k]) return TEX["board" + k];
    const n = 512, c = document.createElement("canvas");
    c.width = c.height = n;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, n, n);
    // carrelage de maquette : joints fins tous les 1/4, plus marqués tous les 1/1
    g.strokeStyle = dark ? "rgba(0,0,0,0.22)" : "rgba(60,50,30,0.10)";
    g.lineWidth = 1.2;
    for (let i = 0; i <= 4; i++) { const p = (i * n) / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, n); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(n, p); g.stroke(); }
    g.strokeStyle = dark ? "rgba(0,0,0,0.35)" : "rgba(60,50,30,0.16)";
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, n - 3, n - 3);
    // grain léger
    const im = g.getImageData(0, 0, n, n);
    for (let i = 0; i < im.data.length; i += 4) { const d = (Math.random() - 0.5) * (dark ? 10 : 7); im.data[i] += d; im.data[i + 1] += d; im.data[i + 2] += d; }
    g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return (TEX["board" + k] = t);
  }

  /* ---------------- boîte à outils des scènes ---------------- */
  function makeKit(world, scene) {
    const P = palette();
    const tagsLayer = $(".v2-tags", world);
    const tags = [];
    const tips = [];
    const drags = [];
    const K = {
      THREE, P, RM, clamp, lerp, damp, fmt, world, scene,
      motion: RM ? 0 : 1,
      v: (id) => { const e = document.getElementById(id); return e ? +e.value : 0; },
      s: (id) => { const e = document.getElementById(id); return e ? e.value : ""; },
      txt: (id) => { const e = document.getElementById(id); return e ? e.textContent : ""; },
      group: (...ch) => { const g = new THREE.Group(); ch.forEach((c) => c && g.add(c)); return g; },
      mat(c, o = {}) {
        const m = new THREE.MeshStandardMaterial({
          color: c instanceof THREE.Color ? c : col(c),
          roughness: o.rough ?? 0.6,
          metalness: o.metal ?? 0,
          transparent: (o.opacity ?? 1) < 1 || !!o.transparent,
          opacity: o.opacity ?? 1,
          side: o.side ?? THREE.FrontSide,
          depthWrite: o.depthWrite ?? ((o.opacity ?? 1) >= 1),
          flatShading: !!o.flat,
        });
        if (o.emissive) { m.emissive = o.emissive instanceof THREE.Color ? o.emissive : col(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
        // grain discret (béton, enduit, bois...) : relief fin sur les matières mates opaques
        if (o.grain !== false && !m.transparent && m.roughness >= 0.5 && (m.metalness || 0) < 0.5) { m.bumpMap = grainTex(); m.bumpScale = o.grain ?? 0.9; }
        return m;
      },
      glow(c, intensity = 1.6, opacity = 1) {
        const cc = c instanceof THREE.Color ? c : col(c);
        return new THREE.MeshStandardMaterial({ color: cc, emissive: cc, emissiveIntensity: intensity, roughness: 0.4, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
      },
      glass(c, opacity = 0.18) {
        return new THREE.MeshPhysicalMaterial({
          color: c instanceof THREE.Color ? c : col(c ?? "#cfe8ff"), roughness: 0.08, metalness: 0,
          transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1, clearcoatRoughness: 0.1,
        });
      },
      shadow(o, cast = true, rec = true) { o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = rec; } }); return o; },
      box(w, h, d, m, r = 0) {
        const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(g, m);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
      },
      cyl(rt, rb, h, m, seg = 40, open = false) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), m);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
      },
      sphere(r, m, seg = 32) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.6)), m); s.castShadow = true; return s; },
      torus(R, r, m, arc = Math.PI * 2) { const t = new THREE.Mesh(new THREE.TorusGeometry(R, r, 16, 48, arc), m); t.castShadow = true; return t; },
      /* tube le long d'une polyligne aux coins arrondis */
      path(points, bend = 0.4) {
        const v = points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)));
        const cp = new THREE.CurvePath();
        let prev = v[0].clone();
        for (let i = 1; i < v.length; i++) {
          const a = v[i];
          if (i < v.length - 1) {
            const b = v[i + 1];
            const din = a.clone().sub(v[i - 1]);
            const dout = b.clone().sub(a);
            const r = Math.min(bend, din.length() / 2, dout.length() / 2);
            const p1 = a.clone().sub(din.normalize().multiplyScalar(r));
            const p2 = a.clone().add(dout.normalize().multiplyScalar(r));
            if (p1.distanceTo(prev) > 1e-4) cp.add(new THREE.LineCurve3(prev, p1));
            cp.add(new THREE.QuadraticBezierCurve3(p1, a.clone(), p2));
            prev = p2;
          } else if (a.distanceTo(prev) > 1e-4) cp.add(new THREE.LineCurve3(prev, a.clone()));
        }
        return cp;
      },
      tube(curve, r, m, seg = 200, radial = 24, closed = false) {
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, radial, closed), m);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
      },
      /* flèche orientée (corps + pointe) */
      arrow(c, opts = {}) {
        const m = opts.mat || K.glow(c, opts.glow ?? 0.9);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16), m);
        const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 20), m);
        const g = new THREE.Group();
        g.add(body, head);
        g.userData = { body, head, r: opts.r ?? 0.05 };
        g.set = (from, dir, len) => {
          const r = g.userData.r;
          const hl = Math.min(len * 0.45, r * 5);
          const d = dir.clone().normalize();
          g.position.copy(from);
          g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
          body.scale.set(r, Math.max(len - hl, 1e-4), r);
          body.position.y = (len - hl) / 2;
          head.scale.set(r * 2.4, hl, r * 2.4);
          head.position.y = len - hl / 2;
          g.visible = len > 1e-3;
        };
        return g;
      },
      /* socle « diorama » : dalle arrondie + couche de surface */
      slab(w, d, h = 0.5, top = null, side = null, r = 0.25) {
        const g = new THREE.Group();
        const base = K.box(w, h, d, K.mat(side || P.slab, { rough: 0.85 }), r);
        base.position.y = -h / 2;
        // plateau de maquette : dalles fines + liseré d'accent du lab
        const tm = K.mat(top || P.slabTop, { rough: 0.88, grain: 0.5 });
        const bt = boardTex(P.dark).clone();
        bt.needsUpdate = true;
        bt.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(d / 2)));
        tm.map = bt;
        const skin = K.box(w - 0.02, 0.08, d - 0.02, tm, Math.min(r, 0.04));
        skin.position.y = 0.0;
        const band = K.box(w + 0.03, Math.min(0.06, h * 0.25), d + 0.03, K.mat(P.acc2, { rough: 0.4, emissive: P.acc2, ei: P.dark ? 0.35 : 0.12, grain: false }), Math.min(r, 0.05));
        band.position.y = -Math.min(0.12, h * 0.45);
        band.castShadow = false;
        g.add(base, skin, band);
        return g;
      },
      /* sol : capteur d'ombres + grille estompée */
      ground(o = {}) {
        const g = new THREE.Group();
        g.userData.noFit = true;
        const size = o.size ?? 60;
        const sh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity: P.dark ? 0.42 : 0.16 }));
        sh.rotation.x = -Math.PI / 2;
        sh.receiveShadow = true;
        sh.position.y = o.y ?? 0;
        g.add(sh);
        if (o.grid !== false) {
          const gm = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false,
            uniforms: { uC: { value: P.gridC }, uA: { value: P.dark ? 0.09 : 0.12 }, uCell: { value: o.cell ?? 1 }, uR: { value: o.fade ?? 12 } },
            vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
            fragmentShader: "uniform vec3 uC; uniform float uA; uniform float uCell; uniform float uR; varying vec3 vW; void main(){ vec2 c = vW.xz/uCell; vec2 gr = abs(fract(c-0.5)-0.5)/fwidth(c); float l = 1.0-min(min(gr.x,gr.y),1.0); float f = 1.0-smoothstep(uR*0.35, uR, length(vW.xz)); gl_FragColor = vec4(uC, l*uA*f); }",
          });
          const gp = new THREE.Mesh(new THREE.PlaneGeometry(size, size), gm);
          gp.rotation.x = -Math.PI / 2;
          gp.position.y = (o.y ?? 0) + 0.002;
          gp.renderOrder = -1;
          g.add(gp);
        }
        return g;
      },
      /* texte sur un plan (lettres DPE, repères gravés...) */
      textPlane(text, o = {}) {
        const fs = o.px ?? 96;
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        const font = `${o.weight ?? 700} ${fs}px ${o.font ?? "Outfit, 'Segoe UI', sans-serif"}`;
        ctx.font = font;
        const w = Math.ceil(ctx.measureText(text).width + fs * 0.5);
        c.width = w; c.height = Math.ceil(fs * 1.35);
        ctx.font = font;
        if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.fillStyle = o.color ?? "#ffffff";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, c.width / 2, c.height / 2 + fs * 0.04);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const h = o.h ?? 0.4;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * c.width / c.height, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
        return mesh;
      },
      /* maison à deux pans : enduit, soubassement, tuiles, menuiseries encadrées, cheminée */
      house(o = {}) {
        const w = o.w ?? 1.2, d = o.d ?? 1, h = o.h ?? 0.8, rh = o.rh ?? 0.45;
        const hasSC = typeof SC !== "undefined" && SC.texMat;
        const g = new THREE.Group();
        const wallMat = o.wall ? K.mat(o.wall, { rough: 0.8 }) : hasSC ? SC.texMat(K, "plaster") : K.mat(P.wall, { rough: 0.8 });
        const body = K.box(w, h, d, wallMat, 0.03);
        body.position.y = h / 2;
        const plinth = K.box(w + 0.02, Math.min(0.12, h * 0.15), d + 0.02, hasSC ? SC.texMat(K, "concrete") : K.mat(P.concrete), 0.015);
        plinth.position.y = Math.min(0.06, h * 0.075);
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2 - 0.08, 0); shape.lineTo(0, rh); shape.lineTo(w / 2 + 0.08, 0); shape.lineTo(-w / 2 - 0.08, 0);
        const roofG = new THREE.ExtrudeGeometry(shape, { depth: d + 0.16, bevelEnabled: false });
        roofG.translate(0, 0, -(d + 0.16) / 2);
        // UV des pans : projection simple pour que les tuiles suivent la pente
        const pos = roofG.attributes.position, uv = roofG.attributes.uv;
        for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getZ(i) + d) * 1.6, (Math.abs(pos.getX(i)) + pos.getY(i)) * 2.2);
        const roofMat = o.roof ? K.mat(o.roof, { rough: 0.7 }) : hasSC ? SC.texMat(K, "roof") : K.mat(P.roof, { rough: 0.7 });
        const roof = new THREE.Mesh(roofG, roofMat);
        roof.position.y = h;
        roof.castShadow = true; roof.receiveShadow = true;
        g.add(body, plinth, roof);
        if (o.chimney !== false) {
          const ch = K.box(0.14, 0.32, 0.14, hasSC ? SC.texMat(K, "brick") : K.mat(P.roof), 0.01);
          ch.position.set(w * 0.22, h + rh * 0.62, -d * 0.18);
          g.add(ch);
        }
        const winM = o.winMat || K.glow(P.gold, P.dark ? 1.2 : 0.4);
        const frameM = K.mat(P.dark ? "#e8e4dc" : "#ffffff", { rough: 0.4, grain: false });
        const wins = [];
        const nw = o.windows ?? 2;
        for (let i = 0; i < nw; i++) {
          const x = -w / 2 + (w / (nw + 1)) * (i + 1);
          const fr = K.box(0.25, 0.27, 0.02, frameM);
          fr.position.set(x, h * 0.55, d / 2 + 0.006);
          fr.castShadow = false;
          const sill = K.box(0.28, 0.025, 0.05, frameM);
          sill.position.set(x, h * 0.55 - 0.14, d / 2 + 0.02);
          const wnd = K.box(0.2, 0.22, 0.02, winM);
          wnd.position.set(x, h * 0.55, d / 2 + 0.012);
          wnd.castShadow = false;
          const mull = K.box(0.012, 0.22, 0.012, frameM);
          mull.position.set(x, h * 0.55, d / 2 + 0.024);
          g.add(fr, sill, wnd, mull);
          wins.push(wnd);
        }
        const door = K.box(0.2, 0.36, 0.02, K.mat(o.doorColor || (P.dark ? "#5b3a2a" : "#7a4a32"), { rough: 0.6 }));
        door.position.set(w * 0.32, 0.18 + 0.02, d / 2 + 0.012);
        const dfr = K.box(0.24, 0.39, 0.016, frameM);
        dfr.position.set(w * 0.32, 0.195 + 0.02, d / 2 + 0.006);
        if (o.door !== false) g.add(dfr, door);
        g.userData = { body, roof, wins };
        return g;
      },
      /* particules instanciées */
      dots(n, r, m) {
        const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), m, n);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.frustumCulled = false;
        return im;
      },
      /* étiquette HTML épinglée sur un objet 3D */
      tag(label, anchor, o = {}) {
        const e = document.createElement("div");
        e.className = "v2-tag" + (o.big ? " v2-big" : "");
        if (o.color) e.style.setProperty("--tc", o.color instanceof THREE.Color ? "#" + o.color.getHexString() : o.color);
        e.innerHTML = `<span></span><em></em>`;
        tagsLayer.append(e);
        let lastLbl = null, lastVal = null;
        const t = {
          el: e, anchor, offset: o.offset || new THREE.Vector3(),
          visible: true,
          set(lbl, val) {
            if (lbl != null && lbl !== lastLbl) { lastLbl = lbl; e.firstChild.textContent = lbl; }
            const v = val ?? "";
            if (v !== lastVal) {
              lastVal = v;
              e.lastChild.textContent = v;
              e.lastChild.style.display = v ? "" : "none";
            }
            return t;
          },
          show(b) { t.visible = b; e.classList.toggle("v2-hidden", !b); return t; },
          color(c) { e.style.setProperty("--tc", c instanceof THREE.Color ? "#" + c.getHexString() : c); return t; },
        };
        t.set(label, o.value);
        tags.push(t);
        return t;
      },
      /* info-bulle au survol */
      tip(obj, fn) { obj.traverse((m) => { if (m.isMesh) m.userData.tip = fn; }); tips.push(obj); return obj; },
      /* objet déplaçable à la souris : onMove(point) reçoit le point 3D sous le curseur */
      drag(obj, o) { drags.push(Object.assign({ obj }, o)); return obj; },
      /* tige cylindrique de rayon r entre deux points (géométrie partagée, rien n'est réalloué) */
      rod(m, r = 0.03) {
        if (!K._unitCyl) K._unitCyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
        const mesh = new THREE.Mesh(K._unitCyl, m);
        mesh.castShadow = true;
        mesh.userData.r = r;
        mesh.userData.shared = true;
        const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
        mesh.set = (a, b, rr) => {
          if (rr != null) mesh.userData.r = rr;
          d.subVectors(b, a);
          const L = d.length();
          mesh.visible = L > 1e-5;
          if (!mesh.visible) return mesh;
          mesh.position.copy(a).addScaledVector(d, 0.5);
          mesh.quaternion.setFromUnitVectors(up, d.normalize());
          mesh.scale.set(mesh.userData.r, L, mesh.userData.r);
          return mesh;
        };
        return mesh;
      },
      _tags: tags,
      _tips: tips,
      _drags: drags,
    };
    return K;
  }

  /* ---------------- habillage commun : ombre de contact, halo de sol, poussières ---------------- */
  let _blobTex = null;
  function blobTex() {
    if (_blobTex) return _blobTex;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.45, "rgba(255,255,255,0.5)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
    _blobTex = new THREE.CanvasTexture(c);
    return _blobTex;
  }
  function dressStage(K, root, stageG) {
    const P = K.P;
    const out = { motes: null };
    const box = new THREE.Box3();
    root.updateWorldMatrix(true, true);
    const walk = (o) => {
      if (!o.visible || o.userData.noFit) return;
      if (o.isMesh && !o.isInstancedMesh && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      }
      o.children.forEach(walk);
    };
    walk(root);
    if (box.isEmpty()) return out;
    const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const R = Math.max(size.x, size.z);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex(), color: P.dark ? 0x000000 : 0x5a4a32, transparent: true, opacity: P.dark ? 0.6 : 0.3, depthWrite: false, toneMapped: false }));
    sh.rotation.x = -Math.PI / 2;
    sh.scale.set(size.x * 1.3 + 1, size.z * 1.3 + 1, 1);
    sh.position.set(ctr.x, box.min.y - 0.01, ctr.z);
    sh.renderOrder = -2;
    sh.userData.noFit = true;
    stageG.add(sh);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex(), color: P.dark ? new THREE.Color("#2b4a8a") : new THREE.Color("#ffffff"), transparent: true, opacity: P.dark ? 0.3 : 0, depthWrite: false, blending: P.dark ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false }));
    glow.rotation.x = -Math.PI / 2;
    glow.scale.set(R * 2.4 + 4, R * 2.4 + 4, 1);
    glow.position.set(ctr.x, box.min.y - 0.02, ctr.z);
    glow.renderOrder = -3;
    glow.userData.noFit = true;
    stageG.add(glow);
    if (!RM) {
      const N = LOWQ ? 40 : 80;
      const H = Math.max(size.y * 1.2, 2), y0 = box.min.y;
      const pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = ctr.x + (Math.random() - 0.5) * size.x * 1.25;
        pos[i * 3 + 1] = y0 + Math.random() * H;
        pos[i * 3 + 2] = ctr.z + (Math.random() - 0.5) * size.z * 1.25;
        seed[i] = Math.random() * 6.28;
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pm = new THREE.PointsMaterial({ map: blobTex(), size: Math.max(0.05, R * 0.007), color: P.dark ? 0xbfd8ff : 0xb8935a, transparent: true, opacity: P.dark ? 0.5 : 0.3, depthWrite: false, blending: P.dark ? THREE.AdditiveBlending : THREE.NormalBlending });
      const pts = new THREE.Points(gg, pm);
      pts.userData.noFit = true;
      pts.frustumCulled = false;
      stageG.add(pts);
      out.motes = (dt, t) => {
        const a = gg.attributes.position.array;
        for (let i = 0; i < N; i++) {
          a[i * 3 + 1] += dt * 0.05 * (0.6 + (seed[i] % 1));
          a[i * 3] += Math.sin(t * 0.3 + seed[i]) * dt * 0.03;
          if (a[i * 3 + 1] > y0 + H) a[i * 3 + 1] = y0;
        }
        gg.attributes.position.needsUpdate = true;
      };
    }
    return out;
  }

  /* ---------------- instances de scènes ---------------- */
  const tmpV = new THREE.Vector3();
  function build(id, world) {
    const f = LAB3D.factories[id];
    if (!f) return null;
    const scene = new THREE.Scene();
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
    $(".v2-tags", world).innerHTML = "";
    const K = makeKit(world, scene);
    const P = K.P;
    const hemi = new THREE.HemisphereLight(P.dark ? 0xb8ccff : 0xfdfcff, P.dark ? 0x221a14 : 0xd6cbb8, P.dark ? 0.5 : 0.7);
    const key = new THREE.DirectionalLight(0xffeedd, P.dark ? 2.3 : 2.1);
    key.position.set(6, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(LOWQ ? 1024 : 2048, LOWQ ? 1024 : 2048);
    key.shadow.radius = 4;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    const sc = key.shadow.camera;
    sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.near = 0.5; sc.far = 40;
    const rim = new THREE.DirectionalLight(P.dark ? 0x7fb0ff : 0xffffff, P.dark ? 0.9 : 0.5);
    rim.position.set(-8, 5, -6);
    // contre-jour chaud au ras du sol : détache les volumes du fond
    const kick = new THREE.DirectionalLight(P.dark ? 0xffb07a : 0xffe2c4, P.dark ? 0.55 : 0.35);
    kick.position.set(2, 1.5, -9);
    scene.add(hemi, key, rim, kick);
    let def;
    try { def = f(K); } catch (e) { console.error("[lab v2] scène", id, e); return null; }
    if (K._unitCyl) K._disposeShared = () => K._unitCyl.dispose();
    if (!def || !def.root) return null;
    const stageG = new THREE.Group();
    stageG.add(def.root);
    scene.add(stageG);
    let fx = null;
    try { fx = dressStage(K, def.root, stageG); } catch (e) { console.warn(e); }
    if (def.shadowBox) { const s = def.shadowBox; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.updateProjectionMatrix(); }
    const camDef = Object.assign({ pos: [6, 4, 8], target: [0, 1, 0], fov: 38, min: 2, max: 40 }, def.cam || {});
    const camera = new THREE.PerspectiveCamera(camDef.fov, 1, 0.05, 300);
    camera.position.set(...camDef.pos);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...camDef.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = camDef.min;
    controls.maxDistance = camDef.max;
    controls.maxPolarAngle = camDef.maxPolar ?? Math.PI * 0.49;
    controls.autoRotateSpeed = 0.6;
    controls.enabled = false;
    controls.update();
    const inst = { id, world, scene, camera, controls, K, def, camDef, fly: null, stageG, fx, intro: RM ? 1 : 0 };
    if ((def.views && def.views.length) || (def.actions && def.actions.length)) buildViews(inst);
    return inst;
  }
  /* barre de la scène : vues caméra (segment) + actions propres à l'atelier */
  function buildViews(inst) {
    const host = $(".v2-views", inst.world);
    if (!host) return;
    host.innerHTML = "";
    if (inst.def.views && inst.def.views.length) {
      const seg = document.createElement("div");
      seg.className = "v2-seg3";
      seg.setAttribute("role", "group");
      seg.setAttribute("aria-label", "Vues caméra");
      inst.def.views.forEach((v, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = v.label;
        b.title = v.title || v.label;
        b.setAttribute("aria-pressed", String(i === (inst.view ?? 0)));
        b.addEventListener("click", () => {
          inst.view = i;
          [...seg.children].forEach((c, j) => c.setAttribute("aria-pressed", String(j === i)));
          if (v.on) v.on();
          goView(inst, i);
        });
        seg.append(b);
      });
      host.append(seg);
      const first = inst.def.views[inst.view ?? 0];
      if (first && first.on) first.on();
    }
    inst.actState = inst.actState || {};
    (inst.def.actions || []).forEach((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "v2-chipbtn v2-act";
      b.textContent = a.label;
      b.title = a.title || a.label;
      if (a.toggle) {
        const on = !!inst.actState[a.label];
        b.setAttribute("aria-pressed", String(on));
        if (on) { try { a.run(true, b); } catch (e) { console.error(e); } }
      }
      b.addEventListener("click", () => {
        if (a.toggle) {
          const on = b.getAttribute("aria-pressed") !== "true";
          inst.actState[a.label] = on;
          b.setAttribute("aria-pressed", String(on));
          a.run(on, b);
        } else a.run(true, b);
        inst.dirty = true;
      });
      host.append(b);
    });
  }
  function dispose(inst) {
    inst.controls.dispose();
    inst.scene.traverse((o) => {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
      if (o === inst.scene && inst.K._disposeShared) inst.K._disposeShared();
      if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    });
  }
  function flyTo(inst, pos, target, dur = 1.1, fov) {
    inst.fly = {
      t: 0, dur,
      p0: inst.camera.position.clone(), p1: new THREE.Vector3(...pos),
      t0: inst.controls.target.clone(), t1: new THREE.Vector3(...target),
      f0: inst.camera.fov, f1: fov ?? inst.camera.fov,
    };
  }

  /* cadrage automatique : la scène entière tient dans la vue */
  const _b = new THREE.Box3(), _bb = new THREE.Box3(), _sp = new THREE.Sphere();
  function fitView(inst, o = {}) {
    const cd = inst.camDef;
    const dir = o.dir ? new THREE.Vector3(...o.dir).normalize() : new THREE.Vector3(...cd.pos).sub(new THREE.Vector3(...cd.target)).normalize();
    const fov = o.fov ?? cd.fov;
    if (cd.fit === false && !o.dir) return { pos: cd.pos, target: cd.target, fov };
    _b.makeEmpty();
    const walk = (o) => {
      if (!o.visible || o.userData.noFit) return;
      if (o.isMesh && !o.isInstancedMesh && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        o.updateWorldMatrix(true, false);
        _bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        _b.union(_bb);
      }
      o.children.forEach(walk);
    };
    walk(inst.def.root);
    if (_b.isEmpty()) return { pos: cd.pos, target: cd.target, fov };
    _b.getBoundingSphere(_sp);
    const narrow = inst.world.clientWidth < 700;
    const aspect = Math.max(0.5, inst.camera.aspect * (1 - (narrow ? 0 : Math.abs(cd.shiftX || 0))));
    const v = THREE.MathUtils.degToRad(fov);
    const hh = 2 * Math.atan(Math.tan(v / 2) * aspect);
    const tgt = _b.getCenter(new THREE.Vector3()).add(new THREE.Vector3(...(cd.offset || [0, 0, 0])));
    // cadrage serré : chaque coin de la boîte englobante doit tenir dans le champ (marge selon pad)
    const m = Math.min(0.97, 0.88 * ((o.pad ?? cd.pad ?? 0.92) / 0.9));
    const tv = Math.tan(v / 2) * m, th = Math.tan(hh / 2) * m;
    const fw = dir.clone().negate(), up0 = Math.abs(fw.y) > 0.98 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
    const rt = new THREE.Vector3().crossVectors(fw, up0).normalize(), up = new THREE.Vector3().crossVectors(rt, fw);
    let dist = 0;
    const cc = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
      cc.set(i & 1 ? _b.max.x : _b.min.x, i & 2 ? _b.max.y : _b.min.y, i & 4 ? _b.max.z : _b.min.z).sub(tgt);
      const zr = cc.dot(fw), xr = Math.abs(cc.dot(rt)), yr = Math.abs(cc.dot(up));
      dist = Math.max(dist, xr / th + zr, yr / tv + zr);
    }
    if (!(dist > 0)) dist = (_sp.radius * (o.pad ?? cd.pad ?? 0.92)) / Math.sin(Math.min(v, hh) / 2);
    if (!o.dir && !o.fov) {
      // cadrage par défaut : mêmes bornes de zoom qu'avant
      inst.controls.minDistance = dist * 0.3;
      inst.controls.maxDistance = dist * 2.4;
    } else inst.controls.maxDistance = Math.max(inst.controls.maxDistance, dist * 1.3);
    return { pos: tgt.clone().addScaledVector(dir, dist).toArray(), target: tgt.toArray(), fov };
  }
  /* vue prédéfinie : { cam } fixe, { focus, dist, dir } détail, ou { dir, fov, pad } cadrée */
  function resolveView(inst, v) {
    const fov = v.fov ?? inst.camDef.fov;
    if (v.cam) return { pos: v.cam.pos, target: v.cam.target, fov };
    if (v.focus) {
      const t = typeof v.focus === "function" ? v.focus() : new THREE.Vector3(...v.focus);
      const dir = v.dir ? new THREE.Vector3(...v.dir).normalize() : new THREE.Vector3(...inst.camDef.pos).sub(new THREE.Vector3(...inst.camDef.target)).normalize();
      inst.controls.minDistance = Math.min(inst.controls.minDistance, (v.dist ?? 3) * 0.5);
      return { pos: t.clone().addScaledVector(dir, v.dist ?? 3).toArray(), target: t.toArray(), fov };
    }
    return fitView(inst, { dir: v.dir, fov: v.fov, pad: v.pad });
  }
  function goView(inst, i) {
    const v = inst.def.views && inst.def.views[i];
    const r = v ? resolveView(inst, v) : fitView(inst);
    flyTo(inst, r.pos, r.target, 1.1, r.fov);
  }
  function applyShift(inst, w, h) {
    const sx = w < 700 ? 0 : inst.camDef.shiftX || 0;
    if (sx) inst.camera.setViewOffset(w, h, -sx * w, 0, w, h);
    else inst.camera.clearViewOffset();
  }

  /* ---------------- montage / boucle ---------------- */
  let cur = null;
  const ro = new ResizeObserver(() => resize());
  function resize() {
    if (!cur) return;
    const r = cur.world.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    renderer.setSize(r.width, r.height, false);
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(r.width, r.height); }
    cur.camera.aspect = r.width / r.height;
    applyShift(cur, r.width, r.height);
    cur.camera.updateProjectionMatrix();
  }
  function mount(id, world) {
    if (cur) { cur.controls.enabled = false; ro.disconnect(); hideTip(); }
    cur = null;
    if (!world || !LAB3D.factories[id]) {
      if (world) world.closest(".v2-stage") && world.closest(".v2-stage").classList.add("v2-no3d");
      if (world) world.hidden = true;
      return;
    }
    let inst = LAB3D.inst[id];
    const fresh = !inst;
    if (!inst) {
      inst = build(id, world);
      if (!inst) {
        world.hidden = true;
        const st = world.closest(".v2-stage");
        if (st) st.classList.add("v2-no3d");
        return;
      }
      LAB3D.inst[id] = inst;
    }
    world.insertBefore(canvas, world.firstChild);
    cur = inst;
    inst.controls.enabled = true;
    ro.observe(world);
    resize();
    try { inst.def.update && inst.def.update(); } catch (e) { console.error(e); }
    world.classList.add("v2-ready");
    const home = world.closest(".v2-home");
    if (home) home.classList.add("v2-has3d");
    if (fresh) {
      const fv = fitView(inst);
      inst.fitted = fv;
      inst.controls.target.set(...fv.target);
      if (RM) inst.camera.position.set(...fv.pos);
      else {
        const p1 = new THREE.Vector3(...fv.pos);
        const dir = p1.clone().sub(inst.controls.target);
        inst.camera.position.copy(inst.controls.target.clone().add(dir.multiplyScalar(1.5)).add(new THREE.Vector3(0, 1.5, 0)));
        flyTo(inst, fv.pos, fv.target, 1.6);
      }
      if (id === "home") { inst.controls.autoRotate = !RM; inst.controls.autoRotateSpeed = 0.35; syncTools(inst); }
    }
    const hint = $(".v2-hint", world);
    if (hint && !world.dataset.hinted) {
      world.dataset.hinted = "1";
      hint.classList.add("on");
      setTimeout(() => hint.classList.remove("on"), 4200);
    }
  }
  function syncTools(inst) {
    const w = inst.world;
    const r = $('[data-tool="rotate"]', w);
    if (r) r.setAttribute("aria-pressed", String(!!inst.controls.autoRotate));
    const t = $('[data-tool="tags"]', w);
    if (t) t.setAttribute("aria-pressed", String(!w.classList.contains("v2-notags")));
  }

  let last = performance.now();
  let visible = true;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (cur && e.target === cur.world) visible = e.isIntersecting; }));
  function loop(now) {
    requestAnimationFrame(loop);
    step(now);
  }
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!cur || document.hidden) return;
    io.observe(cur.world);
    if (!visible) return;
    const inst = cur;
    if (inst.dirty) {
      inst.dirty = false;
      try { inst.def.update && inst.def.update(); } catch (e) { console.error(e); }
    }
    if (inst.fly) {
      const f = inst.fly;
      f.t += dt / f.dur;
      const k = f.t >= 1 ? 1 : 1 - Math.pow(1 - f.t, 3);
      inst.camera.position.lerpVectors(f.p0, f.p1, k);
      inst.controls.target.lerpVectors(f.t0, f.t1, k);
      if (f.f1 !== f.f0) { inst.camera.fov = f.f0 + (f.f1 - f.f0) * k; inst.camera.updateProjectionMatrix(); }
      if (f.t >= 1) inst.fly = null;
    }
    inst.controls.update();
    try { inst.def.tick && inst.def.tick(dt * inst.K.motion, now / 1000, dt); } catch (e) { console.error(e); inst.def.tick = null; }
    if (inst.intro < 1) {
      inst.intro = Math.min(1, inst.intro + dt / 1.2);
      const u = inst.intro, c1 = 1.4, c3 = c1 + 1;
      const k = 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); // sortie avec léger rebond
      inst.stageG.scale.setScalar(0.86 + 0.14 * k);
      inst.stageG.rotation.y = (1 - Math.min(1, u * 1.1)) * -0.3;
    }
    if (inst.fx && inst.fx.motes) inst.fx.motes(dt, now / 1000);
    renderFrame(inst);
    placeTags(inst);
    if (window.LABV4_TAGS) window.LABV4_TAGS(inst, THREE);
  }
  function renderFrame(inst) {
    if (composer && !inst.world.closest(".v2-home")) {
      const dk = inst.K.P.dark;
      backPass.uniforms.uA.value.set(dk ? "#172036" : "#fbfaf7").convertLinearToSRGB();
      backPass.uniforms.uB.value.set(dk ? "#0d1220" : "#efece5").convertLinearToSRGB();
      backPass.uniforms.uC.value.set(dk ? "#080b14" : "#e4e0d7").convertLinearToSRGB();
      renderPass.scene = inst.scene;
      renderPass.camera = inst.camera;
      bloom.strength = dk ? 0.55 : 0.3;
      bloom.radius = 0.5;
      bloom.threshold = dk ? 1.0 : 1.7;
      composer.render();
    } else renderer.render(inst.scene, inst.camera);
  }
  window.__lab3dStep = (n = 1, dt = 1 / 60) => { visible = true; for (let i = 0; i < n; i++) step(last + dt * 1000); };
  function placeTags(inst) {
    const r = inst.world.getBoundingClientRect();
    const w = r.width, h = r.height;
    inst.K._tags.forEach((t) => {
      if (!t.visible) return;
      const a = t.anchor;
      if (typeof a === "function") tmpV.copy(a());
      else if (a && a.isObject3D) a.getWorldPosition(tmpV);
      else if (a && a.isVector3) tmpV.copy(a);
      else return;
      tmpV.add(t.offset).project(inst.camera);
      const behind = tmpV.z > 1;
      const x = (tmpV.x + 1) / 2 * w;
      const y = (1 - tmpV.y) / 2 * h;
      const out = behind || x < -40 || x > w + 40 || y < -20 || y > h + 40;
      t._ax = x; t._ay = y; t._out = out;
      // placement anti-chevauchement fourni par la couche interface (window.LABV4_TAGS), sinon placement simple
      if (!window.LABV4_TAGS) { t.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`; t.el.style.opacity = out ? "0" : ""; }
    });
  }

  /* ---------------- survol ---------------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let tipPending = null;
  function hideTip() { if (cur) { const tp = $(".v2-tip", cur.world); if (tp) tp.classList.remove("on"); } }
  canvas.addEventListener("pointermove", (e) => {
    if (!cur || e.buttons) { hideTip(); return; }
    tipPending = e;
    requestAnimationFrame(() => {
      if (!tipPending || !cur) return;
      const ev = tipPending;
      tipPending = null;
      const r = canvas.getBoundingClientRect();
      ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, cur.camera);
      // on oublie les objets retirés de la scène (reconstruits par update)
      const attached = (o) => attachedTo(o, cur.scene);
      cur.K._tips.splice(0, cur.K._tips.length, ...cur.K._tips.filter(attached));
      const dh = pickDrag(ev);
      if (dh) {
        const tp0 = $(".v2-tip", cur.world);
        if (tp0 && dh.d.tip) {
          tp0.innerHTML = typeof dh.d.tip === "function" ? dh.d.tip() : dh.d.tip;
          tp0.style.left = (ev.clientX - r.left) + "px";
          tp0.style.top = (ev.clientY - r.top) + "px";
          tp0.classList.add("on");
        }
        canvas.style.cursor = dh.d.cursor || "grab";
        return;
      }
      const hits = cur.K._tips.length ? ray.intersectObjects(cur.K._tips, true) : [];
      const hit = hits.find((hh) => hh.object.userData.tip && hh.object.visible);
      const tp = $(".v2-tip", cur.world);
      if (!tp) return;
      if (hit) {
        const v = hit.object.userData.tip;
        tp.innerHTML = typeof v === "function" ? v() : v;
        tp.style.left = (ev.clientX - r.left) + "px";
        tp.style.top = (ev.clientY - r.top) + "px";
        tp.classList.add("on");
        canvas.style.cursor = "help";
      } else { tp.classList.remove("on"); canvas.style.cursor = ""; }
    });
  });
  canvas.addEventListener("pointerleave", hideTip);

  /* ---------------- manipulation directe : glisser un objet 3D ---------------- */
  function attachedTo(o, scene) { while (o) { if (o === scene) return true; o = o.parent; } return false; }
  const dragPlane = new THREE.Plane();
  const dragPt = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  let dragging = null;
  function setPtr(ev) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cur.camera);
  }
  function pickDrag(ev) {
    if (!cur || !cur.K._drags.length) return null;
    const list = cur.K._drags.filter((d) => d.obj.visible && attachedTo(d.obj, cur.scene));
    if (!list.length) return null;
    setPtr(ev);
    const hit = ray.intersectObjects(list.map((d) => d.obj), true)[0];
    if (!hit) return null;
    const d = list.find((dd) => attachedTo(hit.object, dd.obj));
    return d ? { d, point: hit.point } : null;
  }
  canvas.addEventListener("pointerdown", (e) => {
    const p = pickDrag(e);
    if (!p) return;
    // la poignée est prioritaire sur la rotation de caméra
    e.stopImmediatePropagation();
    e.preventDefault();
    cur.camera.getWorldDirection(camDir);
    dragPlane.setFromNormalAndCoplanarPoint(camDir, p.point);
    dragging = p.d;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    hideTip();
    if (dragging.onStart) dragging.onStart(p.point);
  }, true);
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || !cur) return;
    setPtr(e);
    if (ray.ray.intersectPlane(dragPlane, dragPt)) { try { dragging.onMove(dragPt.clone()); } catch (err) { console.error(err); } }
  });
  const endDrag = (e) => {
    if (!dragging) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    if (dragging.onEnd) dragging.onEnd();
    dragging = null;
    canvas.style.cursor = "";
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerdown", () => {
    hideTip();
    if (cur && cur.controls.autoRotate && cur.id !== "home") { cur.controls.autoRotate = false; syncTools(cur); }
  });

  /* ---------------- événements de l'interface ---------------- */
  document.addEventListener("labv2:atelier", (e) => mount(e.detail.id, e.detail.world));
  // les mises à jour sont regroupées : au plus une par image affichée
  document.addEventListener("labv2:update", (e) => {
    const inst = LAB3D.inst[e.detail.id];
    if (inst && inst.def.update) inst.dirty = true;
  });
  const onCtl = (e) => {
    if (!cur || !cur.def.update) return;
    if (e.target && cur.world.closest(".v2-stage") && cur.world.closest(".v2-stage").contains(e.target)) cur.dirty = true;
  };
  document.addEventListener("input", onCtl);
  document.addEventListener("change", onCtl);
  document.addEventListener("labv2:tool", (e) => {
    const { tool, world } = e.detail;
    const inst = Object.values(LAB3D.inst).find((i) => i.world === world);
    if (!inst) return;
    if (tool === "rotate") inst.controls.autoRotate = !inst.controls.autoRotate;
    if (tool === "tags") world.classList.toggle("v2-notags");
    if (tool === "center") goView(inst, inst.view ?? 0);
    syncTools(inst);
  });
  document.addEventListener("labv2:theme", () => {
    const ids = Object.keys(LAB3D.inst);
    const keepId = cur && cur.id;
    ids.forEach((id) => {
      const old = LAB3D.inst[id];
      const cam = old.camera.position.clone();
      const tgt = old.controls.target.clone();
      const view = old.view;
      const notags = old.world.classList.contains("v2-notags");
      const rot = old.controls.autoRotate;
      dispose(old);
      delete LAB3D.inst[id];
      if (id === keepId) {
        cur = null;
        const inst = build(id, old.world);
        if (!inst) return;
        inst.view = view;
        inst.actState = old.actState;
        if (inst.def.views || inst.def.actions) buildViews(inst);
        inst.camera.position.copy(cam);
        inst.controls.target.copy(tgt);
        inst.camera.fov = old.camera.fov;
        inst.camera.updateProjectionMatrix();
        inst.controls.autoRotate = rot;
        old.world.classList.toggle("v2-notags", notags);
        LAB3D.inst[id] = inst;
        mount(id, old.world);
        syncTools(inst);
      }
    });
  });

  window.LAB3D = LAB3D;
  requestAnimationFrame(loop);
  const c = window.LABV2.current();
  const st = window.LABV2.stages[c];
  if (c) mount(c, st && st.world);
  // Ateliers sans scène déclarée : schémas 2D en vedette.
  Object.entries(window.LABV2.stages).forEach(([id, s]) => {
    if (s.world && !LAB3D.factories[id]) {
      s.world.hidden = true;
      const stg = s.world.closest(".v2-stage");
      if (stg) stg.classList.add("v2-no3d");
    }
  });
})();
