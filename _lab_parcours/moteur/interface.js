/* =====================================================================
   Labs virtuels IUT Mantes - couche v4 « prise en main »
   Au-dessus de la v3 : interface allégée (3D seule, outils secondaires
   rangés dans « Plus »), affordances visibles (valeurs saisissables,
   objets 3D à attraper, menu qui défile), réinitialisation dans le menu.
   ===================================================================== */
(() => {
  const V2 = window.LABV2;
  if (!V2) return;
  const doc = document;
  const root = doc.documentElement;
  root.classList.add("v4");
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const KEY = ((window.LABV3_PARCOURS || {}).storeKey || "lab") + "_ui";
  let ui = {};
  try { ui = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) { ui = {}; }
  const saveUi = () => { try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch (_) { /* ignore */ } };
  const ICON = {
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6 7-2.6 0-4-1.2-5.4-3.3L3.4 14a1.5 1.5 0 0 1 2.5-1.7L8 15"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    wipe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  };
  const activeId = () => { const s = $(".atelier.active"); return s ? s.id.replace("atelier-", "") : ""; };

  /* ---------------- poignées 3D : enregistrement par les scènes ---------------- */
  // window.LABV4H(K, objet, idCurseur, atelier, titre, consigne, portée 3D pour toute la plage, axe "y" ou "x")
  const HANDLES = {};
  const isBlocked = (e) => !e || e.disabled || !!e.closest(".v3-locked, .v3-picking, .v3-dim");
  window.LABV4H = (K, obj, id, at, title, how, span = 6, axis = "y") => {
    let d0 = null;
    const inp = () => doc.getElementById(id);
    K.drag(obj, {
      cursor: axis === "x" ? "ew-resize" : "ns-resize",
      tip: `<b>${title}</b><br>${how}`,
      onStart(pt) {
        const e = inp();
        if (isBlocked(e)) { d0 = null; return; }
        d0 = { p: pt[axis], v: e.tagName === "SELECT" ? e.selectedIndex : +e.value, moved: false };
      },
      onMove(pt) {
        const e = inp();
        if (!d0 || isBlocked(e)) return;
        const delta = pt[axis] - d0.p;
        if (Math.abs(delta) > 0.04) d0.moved = true;
        if (e.tagName === "SELECT") {
          const n = e.options.length;
          if (!n) return;
          const stepIdx = Math.round((delta / Math.max(0.8, span)) * Math.max(1, n - 1));
          const idx = Math.max(0, Math.min(n - 1, d0.v + stepIdx));
          if (e.selectedIndex !== idx) {
            e.selectedIndex = idx;
            e.dispatchEvent(new Event("input", { bubbles: true }));
            e.dispatchEvent(new Event("change", { bubbles: true }));
          }
          return;
        }
        const lo = +e.min, hi = +e.max, st = +e.step || 0;
        let v = d0.v + delta / span * (hi - lo);
        v = Math.min(hi, Math.max(lo, v));
        if (st > 0) v = lo + Math.round((v - lo) / st) * st;
        v = +v.toFixed(6);
        if (+e.value !== v) { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }
      },
      onEnd() {
        const e = inp();
        if (d0 && !d0.moved && e && e.tagName === "SELECT" && !isBlocked(e) && e.options.length > 1) {
          e.selectedIndex = (e.selectedIndex + 1) % e.options.length;
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
        }
        d0 = null;
        grabbed();
      },
    });
    return window.LABV4R(K, at, obj, title, how, axis);
  };
  // déclaration seule (poignées dont le glisser est déjà codé ailleurs, atelier 08)
  window.LABV4R = (K, at, obj, title, how, axis = "y") => {
    const { THREE } = K;
    const wp = new THREE.Vector3(), box = new THREE.Box3(), mb = new THREE.Box3();
    // pastille permanente au-dessus de la partie réellement visible de l'objet (ignore les graduations masquées)
    const shown = () => { for (let o = obj; o; o = o.parent) if (!o.visible) return false; return true; };
    const visBox = () => {
      box.makeEmpty();
      obj.updateWorldMatrix(true, true);
      const walk = (o) => {
        if (!o.visible) return;
        if (o.isMesh && !o.isInstancedMesh && o.geometry) {
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          if (!o.geometry.boundingBox.isEmpty()) box.union(mb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
        }
        for (let i = 0; i < o.children.length; i++) walk(o.children[i]);
      };
      walk(obj);
      if (box.isEmpty()) box.setFromObject(obj);
      return box;
    };
    // objet masqué (variante non affichée) : pastille renvoyée hors champ
    const mark = K.tag(axis === "x" ? "↔ à saisir" : "↕ à saisir", () => { if (!shown()) return wp.set(1e6, 1e6, 1e6); visBox().getCenter(wp); wp.y = box.max.y + 0.22; return wp; }, { color: K.P.gold || K.P.acc });
    mark.el.classList.add("v4-grabtag");
    mark._grabShown = shown;
    mark._grabObj = obj;
    (HANDLES[at] = HANDLES[at] || []).push({ title, how, obj, mark });
    if (ready) legend(at);
    return obj;
  };
  function grabbed() {
    if (!ui.dragged) { ui.dragged = true; saveUi(); }
    $$(".v4-grab").forEach((g) => g.classList.remove("v4-new"));
  }
  // repérage : l'objet clignote en doré pendant deux secondes
  function flash(obj) {
    const ms = [];
    obj.traverse((m) => { if (m.isMesh && m.material && m.material.emissive && !ms.some((x) => x.mat === m.material)) ms.push({ mat: m.material, c: m.material.emissive.clone(), i: m.material.emissiveIntensity }); });
    if (!ms.length) return;
    const t0 = performance.now();
    const step = () => {
      const t = (performance.now() - t0) / 1000;
      if (t > 2) { ms.forEach((x) => { x.mat.emissive.copy(x.c); x.mat.emissiveIntensity = x.i; }); return; }
      const k = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
      ms.forEach((x) => { x.mat.emissive.setRGB(1, 0.78, 0.25); x.mat.emissiveIntensity = 0.3 + 1.6 * k; });
      requestAnimationFrame(step);
    };
    step();
  }

  /* ---------------- étiquettes 3D sans chevauchement ----------------
     Toutes les 200 ms : on projette à l'écran l'emprise des objets de la scène (boîtes englobantes,
     tiges découpées en segments), puis chaque étiquette choisit, autour de son point d'ancrage,
     la position qui recouvre le moins d'objets et d'autres étiquettes. Si elle est décalée,
     un trait la relie à son point. Entre deux calculs, les décalages suivent l'objet. */
  const LAY = new WeakMap();
  const DIRS = [[0, -1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [0, 1]];
  window.LABV4_TAGS = (inst, THREE) => {
    const layer = $(".v2-tags", inst.world);
    if (!layer) return;
    let st = LAY.get(inst);
    if (!st) {
      const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "v4-leads");
      layer.prepend(svg);
      st = { t: 0, svg, v: new THREE.Vector3(), box: new THREE.Box3(), c: Array.from({ length: 8 }, () => new THREE.Vector3()) };
      LAY.set(inst, st);
    }
    const r = inst.world.getBoundingClientRect();
    const W = r.width, H = r.height;
    // Les pastilles « à saisir » d'un objet visible devant la caméra restent dans le cadre même si l'objet est très haut
    if (W > 90 && H > 90) {
      inst.K._tags.forEach((t) => {
        if (!t.visible || !t._grabShown || t._ax == null) return;
        if (!t._grabShown()) return;
        t._grabObj.getWorldPosition(st.v).project(inst.camera);
        if (st.v.z > 1) return;
        t._ax = Math.max(46, Math.min(W - 46, t._ax));
        t._ay = Math.max(30, Math.min(H - 10, t._ay));
        t._out = false;
      });
    }
    const tags = inst.K._tags.filter((t) => t.visible && !t._out && t._ax != null && t.el.firstChild.textContent);
    const now = performance.now();
    if (now - st.t > 200) { st.t = now; layout(inst, st, tags, W, H); }
    let lines = "";
    inst.K._tags.forEach((t) => {
      if (t._ax == null) return;
      const dx = t._dx || 0, dy = t._dy || 0;
      t.el.style.transform = `translate(${(t._ax + dx).toFixed(1)}px, ${(t._ay + dy).toFixed(1)}px) translate(-50%, -100%)`;
      t.el.style.opacity = t._out ? "0" : "";
      if (t.visible && !t._out && (dx * dx + dy * dy) > 64) {
        // trait du point d'ancrage au bord le plus proche de la bulle
        const bw = t._w || 60, bh = t._h || 22;
        const cx = t._ax + dx, cy = t._ay + dy - bh / 2;
        const ex = Math.max(cx - bw / 2, Math.min(t._ax, cx + bw / 2)), ey = Math.max(cy - bh / 2, Math.min(t._ay, cy + bh / 2));
        lines += `<line x1="${t._ax.toFixed(1)}" y1="${t._ay.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" style="stroke:${getComputedStyle(t.el).getPropertyValue("--tc") || "currentColor"}"/><circle cx="${t._ax.toFixed(1)}" cy="${t._ay.toFixed(1)}" r="2.6"/>`;
      }
    });
    if (st.lines !== lines) { st.svg.innerHTML = lines; st.lines = lines; }
  };
  function occupancy(inst, st, W, H) {
    const rects = [];
    const P = (v) => { v.project(inst.camera); return v.z > 1 ? null : [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    const push = (x0, y0, x1, y1) => {
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
      if (x1 > x0 && y1 > y0) rects.push([x0, y0, x1, y1]);
    };
    const visibleUp = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
    inst.scene.traverse((m) => {
      if (!(m.isMesh || m.isLine || m.isPoints) || !m.geometry || !visibleUp(m)) return;
      if (m.material && m.material.opacity != null && m.material.opacity < 0.08) return;
      // tige (K.rod) : segment découpé en petites boîtes, pour ne pas bloquer toute sa diagonale
      if (m.userData && m.userData.shared && m.geometry.type === "CylinderGeometry") {
        m.updateWorldMatrix(true, false);
        const a = P(st.v.set(0, -0.5, 0).applyMatrix4(m.matrixWorld)), b = P(st.v.set(0, 0.5, 0).applyMatrix4(m.matrixWorld));
        if (!a || !b) return;
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14));
        for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n; push(x - 6, y - 6, x + 6, y + 6); }
        return;
      }
      let bb;
      if (m.isInstancedMesh) { if (m.count === 0) return; m.computeBoundingBox(); bb = st.box.copy(m.boundingBox); }
      else { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb = st.box.copy(m.geometry.boundingBox); }
      if (bb.isEmpty()) return;
      m.updateWorldMatrix(true, false);
      bb.applyMatrix4(m.matrixWorld);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, k = 0;
      for (let i = 0; i < 8; i++) {
        const p = P(st.c[i].set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z));
        if (!p) continue;
        k++; x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
      }
      if (!k) return;
      // sol, dalles, terrain : trop étendus pour compter comme un objet à ne pas masquer
      if ((x1 - x0) * (y1 - y0) > 0.18 * W * H) return;
      push(x0, y0, x1, y1);
    });
    return rects;
  }
  const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  function layout(inst, st, tags, W, H) {
    const occ = occupancy(inst, st, W, H);
    // bandeau d'usage et barre d'outils : zones réservées (avec une marge)
    const wr = inst.world.getBoundingClientRect();
    const ui = $$(".v4-legend, .v2-tools > *", inst.world).map((e) => e.getBoundingClientRect()).filter((q) => q.width > 0)
      .map((q) => [q.left - wr.left - 6, q.top - wr.top - 6, q.right - wr.left + 6, q.bottom - wr.top + 6]);
    const placed = [];
    // les grandes étiquettes et pastilles « à saisir » d'abord, puis de haut en bas
    const prio = (t) => (t.el.classList.contains("v2-big") ? 2 : t.el.classList.contains("v4-grabtag") ? 1 : 0);
    tags.sort((a, b) => (prio(b) - prio(a)) || a._ay - b._ay);
    tags.forEach((t) => {
      const bw = t._w = t.el.offsetWidth || 64, bh = t._h = t.el.offsetHeight || 22;
      const area = bw * bh;
      const cand = [[0, 0]];
      [26, 52, 84, 120, 160].forEach((d) => DIRS.forEach(([ux, uy]) => cand.push([ux * (d + (ux ? bw / 2 : 0)), uy * (d + (uy > 0 ? bh : 0))])));
      let best = null, bs = 1e9;
      cand.forEach(([dx, dy]) => {
        const rc = [t._ax + dx - bw / 2, t._ay + dy - bh, t._ax + dx + bw / 2, t._ay + dy];
        let o = 0;
        occ.forEach((q) => { o += inter(rc, q); });
        let tg = 0;
        placed.forEach((q) => { tg += inter(rc, q); });
        ui.forEach((q) => { tg += inter(rc, q); });
        const outx = Math.max(0, 6 - rc[0]) + Math.max(0, rc[2] - (W - 6)), outy = Math.max(0, 6 - rc[1]) + Math.max(0, rc[3] - (H - 6));
        // le point d'ancrage ne doit pas être caché par une autre bulle déjà posée
        const hideA = placed.some((q) => t._ax > q[0] && t._ax < q[2] && t._ay > q[1] && t._ay < q[3]) ? 0.5 : 0;
        const prev = t._dx === dx && t._dy === dy ? -0.06 : 0; // stabilité : on garde la position précédente à score proche
        const s = Math.min(1.5, o / area) * 1 + (tg / area) * 4 + (outx + outy) * 0.35 + Math.hypot(dx, dy) * 0.0025 + hideA + prev;
        if (s < bs) { bs = s; best = [dx, dy, rc]; }
      });
      let dx = best[0], dy = best[1];
      if (W > bw + 14 && H > bh + 14) {
        dx = Math.max(6 + bw / 2 - t._ax, Math.min(W - 6 - bw / 2 - t._ax, dx));
        dy = Math.max(6 + bh - t._ay, Math.min(H - 6 - t._ay, dy));
      }
      t._dx = dx; t._dy = dy;
      placed.push([t._ax + dx - bw / 2, t._ay + dy - bh, t._ax + dx + bw / 2, t._ay + dy]);
    });
  }

  let ready = false;
  function legend(id) {
    const stg = V2.stages && V2.stages[id];
    if (!stg || !stg.world) return;
    const old = $(".v2-hint", stg.world);
    if (old) old.remove();
    const prev = $(".v4-legend", stg.world);
    if (prev) prev.remove();
    // un même objet peut avoir plusieurs pièces déclarées sous un seul nom (ex. isolant intérieur ou extérieur)
    const h = HANDLES[id] && Object.values(HANDLES[id].reduce((acc, x) => { (acc[x.title] = acc[x.title] || { title: x.title, how: x.how, objs: [] }).objs.push(x.obj); return acc; }, {}));
    const leg = el("div", "v4-legend" + (h ? " v4-has" : ""));
    leg.innerHTML = (id === "home" ? `<span><kbd>glisser</kbd> tourner</span><span><kbd>molette</kbd> descendre dans la page</span>` : `<span><kbd>glisser</kbd> tourner</span><span><kbd>molette</kbd> zoomer</span><span><kbd>survol</kbd> lire</span>`)
      + (h ? `<button type="button" class="v4-grab${ui.dragged ? "" : " v4-new"}">${ICON.hand}<b>${h.length > 1 ? h.length + " objets" : "1 objet"} à attraper</b></button>` : "");
    stg.world.append(leg);
    if (h) {
      const pop = el("div", "v4-grabpop", `<p><b>Objets manipulables</b> : repérés par la pastille « à saisir » ; ils clignotent quand vous survolez leur nom.</p><ul>${h.map((x, i) => `<li data-i="${i}"><b>${x.title}</b> : ${x.how}</li>`).join("")}</ul>`);
      leg.append(pop);
      const g = $(".v4-grab", leg);
      g.addEventListener("click", () => { const o = leg.classList.toggle("v4-open"); if (o) h.forEach((x) => x.objs.forEach(flash)); });
      $$("li", pop).forEach((li) => li.addEventListener("mouseenter", () => h[+li.dataset.i].objs.forEach(flash)));
    }
  }

  function init() {
    /* 1. outils secondaires rangés dans un menu « Plus » */
    Object.keys(V2.stages || {}).forEach((id) => {
      const stg = V2.stages[id];
      const tools = stg && stg.world && $(".v2-tools", stg.world);
      if (!tools || id === "home") return;
      const pick = (sel) => $(sel, tools);
      const moved = [
        [pick('[data-tool="rotate"]'), "Rotation automatique"],
        [pick('[data-tool="center"]'), "Recentrer la vue"],
        [pick('[data-tool="link"]'), "Copier le lien de ce réglage"],
        [pick('[data-tool="full"]'), "Plein écran"],
      ].filter((x) => x[0]);
      // mémo de calcul : bouton visible et nommé, à côté de « Comment c'est calculé ? »
      const memo = pick('[data-tool="memo"]');
      if (memo) {
        memo.classList.remove("v2-icon");
        memo.classList.add("v4-memobtn");
        if (!$("span", memo)) memo.insertAdjacentHTML("beforeend", "<span>Mon mémo</span>");
        memo.title = "Mon mémo de calcul : vos réglages et vos résultats, prêts à coller dans votre compte rendu";
      }
      if (!moved.length) return;
      const wrap = el("div", "v4-more");
      const btn = el("button", "v2-chipbtn", `${ICON.more}<span>Plus</span>`);
      btn.type = "button";
      btn.title = "Autres outils : rotation, comparaison, mémo, lien, plein écran";
      btn.setAttribute("aria-haspopup", "true");
      btn.setAttribute("aria-expanded", "false");
      const menu = el("div", "v4-menu");
      menu.setAttribute("role", "menu");
      moved.forEach(([b, label]) => {
        b.classList.add("v4-item");
        const sp = $("span", b);
        if (sp) sp.textContent = label; else b.insertAdjacentHTML("beforeend", `<span>${label}</span>`);
        const kb = $("kbd", b); if (kb) b.append(kb);
        b.setAttribute("role", "menuitem");
        menu.append(b);
      });
      const close = () => { wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
      btn.addEventListener("click", (e) => { e.stopPropagation(); const o = !wrap.classList.contains("open"); wrap.classList.toggle("open", o); btn.setAttribute("aria-expanded", String(o)); });
      menu.addEventListener("click", (e) => { if (e.target.closest(".v4-item")) setTimeout(close, 0); });
      doc.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });
      doc.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
      wrap.append(btn, menu);
      tools.append(wrap);
      // la comparaison en cours reste visible : le bouton « Plus » s'allume
      const cmp = moved.find((m) => /Comparer|réglages/.test(m[1]));
      if (cmp) new MutationObserver(() => wrap.classList.toggle("v4-busy", cmp[0].getAttribute("aria-pressed") === "true"))
        .observe(cmp[0], { attributes: true, attributeFilter: ["aria-pressed"] });
    });

    /* 2. approche 3D seule : schémas 2D redondants retirés ; pour 05 et 08, seul le graphe absent de la 3D reste visible */
    // graphes 2D conservés : { atelier: true } (cartes entières), ["cv-id", …] (ces graphes seulement) ou { top, title, cap } (recadrage sous la 3D)
    const KEEP = (window.LABV3_PARCOURS || {}).keep2d || {};
    Object.keys(V2.stages || {}).forEach((id) => {
      const stg = V2.stages[id];
      if (!stg || !stg.figs || id === "home") return;
      const cards = $$(".card", stg.figs).filter((c) => !c.parentNode.closest(".card"));
      cards.forEach((c) => {
        if (c.classList.contains("v3-adv")) return; // mode avancé (repliable) conservé
        const k = KEEP[id], cv = k && $("canvas", c);
        if (!cv || (Array.isArray(k) && !k.includes(cv.id))) { c.classList.add("v4-hide2d"); return; }
        c.classList.add("v4-graph");
        if (k === true || Array.isArray(k)) return;
        const W = cv.width / 2, H = cv.height / 2;
        const crop = el("div", "v4-crop");
        crop.style.aspectRatio = `${W} / ${H - k.top}`;
        cv.style.marginTop = `${-k.top / W * 100}%`;
        cv.parentNode.insertBefore(crop, cv);
        crop.append(cv);
        const hd = $(".hd", c);
        if (hd) hd.innerHTML = `<span>${k.title}</span>`;
        const cap = $(".viz-cap", c);
        if (cap) cap.textContent = k.cap;
      });
      if (cards.length && cards.every((c) => c.classList.contains("v4-hide2d"))) stg.figs.classList.add("v4-hide2d");
    });

    /* 3. légende d'usage de la scène 3D (remplace la bulle « glisser pour tourner ») */
    ready = true;
    Object.keys(V2.stages || {}).forEach(legend);

    /* 4. valeurs saisissables : rendues visibles, avec une astuce une fois */
    const tag = () => $$("strong.v3-editable").forEach((s) => { if (!$(".v4-pen", s)) s.insertAdjacentHTML("beforeend", `<i class="v4-pen" aria-hidden="true">${ICON.pen}</i>`); });
    tag();
    new MutationObserver(() => tag()).observe(doc.body, { subtree: true, childList: true, characterData: false });
    $$(".controls-card").forEach((card) => {
      if (card.closest("#atelier-defi") || !$("input[type=range]", card)) return;
      const tip = el("p", "v4-tipline", `${ICON.pen}<span>Cliquez sur une valeur encadrée pour taper un nombre précis, ou utilisez le curseur.</span>`);
      const bd = $(".bd", card);
      if (bd) bd.prepend(tip);
    });

    /* 5. menu latéral : réinitialisation + indication de défilement */
    const tools = $(".side-tools");
    if (tools) {
      const rb = el("button", "theme-btn v4-sidereset", `${ICON.reset}<span>Réinitialiser l’atelier</span>`);
      rb.type = "button";
      rb.title = "Remettre les curseurs de l’atelier affiché à leurs valeurs de départ";
      rb.addEventListener("click", () => {
        const s = $(".atelier.active");
        const b = s && $(".reset-btn", s);
        if (!b) { toast(rb, "Ouvrez d’abord un atelier"); return; }
        b.click();
        const id = activeId();
        const L3 = window.LABV3;
        toast(rb, "Curseurs remis à leurs valeurs de départ.", L3 && L3.resetAt ? ["Recommencer aussi le parcours de cet atelier", () => { L3.resetAt(id); toast(rb, "Parcours de l’atelier repris à l’étape 1"); }] : null);
      });
      tools.append(rb);
      const wb = el("button", "theme-btn v4-sidewipe", `${ICON.wipe}<span>Réinitialiser tous les ateliers</span>`);
      wb.type = "button";
      wb.title = "Remettre à zéro tous les ateliers : parcours, étoiles, défis, badges et curseurs";
      wb.addEventListener("click", () => { const w = doc.getElementById("wipe-btn"); if (w) w.click(); });
      tools.append(wb);
      const upd = () => { const a = activeId(); rb.disabled = !a || a === "home" || a === "defi"; bubble(a); };
      new MutationObserver(upd).observe(doc.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
      upd();
    }
    // zone défilante du menu : bandeau dégradé non bloquant ; seule la pastille ronde fait défiler
    const scrollCues = (box, cls, upTxt, dnTxt) => {
      const wrap = el("div", "v4-navwrap " + cls);
      box.parentNode.insertBefore(wrap, box);
      wrap.append(box);
      const cueEl = (c2, icon, txt, dir) => {
        const c = el("div", "v4-navcue " + c2, `<span>${txt}</span>`);
        const b = el("button", "v4-cuebtn", icon);
        b.type = "button"; b.title = txt; b.setAttribute("aria-label", txt);
        b.addEventListener("click", () => box.scrollBy({ top: dir * box.clientHeight * 0.7, behavior: "smooth" }));
        c.prepend(b);
        wrap.append(c);
      };
      cueEl("up", ICON.up, upTxt, -1);
      cueEl("dn", ICON.down, dnTxt, 1);
      const cue = () => {
        const more = box.scrollHeight - box.clientHeight > 4;
        wrap.classList.toggle("v4-can-up", more && box.scrollTop > 4);
        wrap.classList.toggle("v4-can-dn", more && box.scrollTop < box.scrollHeight - box.clientHeight - 4);
      };
      box.addEventListener("scroll", cue, { passive: true });
      window.addEventListener("resize", cue);
      new ResizeObserver(cue).observe(box);
      cue();
      return wrap;
    };
    if (tools) scrollCues(tools, "v4-toolwrap", "Outils précédents", "Autres outils en dessous");
    const nav = $("nav.ateliers");
    if (nav) {
      scrollCues(nav, "v4-atwrap", "Ateliers précédents", "Autres ateliers en dessous");
      // l'atelier actif reste visible dans le menu
      doc.addEventListener("click", (e) => { if (e.target.closest(".nav-btn")) setTimeout(() => { const a = $(".nav-btn.active", nav); if (a) a.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 50); });
    }

    /* 6. étapes facultatives du parcours signalées comme telles */
    const mark = () => $$(".v3-steps li").forEach((li, i) => { if (i >= 3) li.classList.add("v4-opt"); });
    mark();
    $$(".v3-steps").forEach((ol) => { if (!ol.parentNode.querySelector(".v4-optnote")) ol.insertAdjacentHTML("afterend", '<p class="v4-optnote">Étapes 1 à 3 : l’essentiel. Étapes 4 et 5 : pour approfondir.</p>'); });

    /* 7. boutons d'indice des questions flash : ils renvoient vers la scène 3D ou les indicateurs */
    doc.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest(".q-apply");
      if (!b) return;
      // « Voir sur les indicateurs » mène aux indicateurs, « Voir dans la 3D » à la scène
      const w = $(/indicateurs/.test(b.textContent) ? ".atelier.active .v2-stats" : ".atelier.active .v2-world");
      if (!w) return;
      setTimeout(() => {
        w.scrollIntoView({ behavior: "smooth", block: "center" });
        w.classList.remove("v4-ping"); void w.offsetWidth; w.classList.add("v4-ping");
      }, 60);
    });
    layout3();
    home();
    bubble(activeId());
  }

  /* 8. trois zones distinctes : parcours à gauche, scène 3D au centre, commandes et mesures à droite */
  function layout3() {
    Object.keys(V2.stages || {}).forEach((id) => {
      const stg = V2.stages[id];
      if (!stg || !stg.left || !stg.right || id === "home") return;
      const pan = $(".v3-panel", stg.right);
      if (!pan) return;
      const brand = $(".v2-brand", stg.left);
      // contexte de l'atelier replié sous le titre, pour laisser la place au parcours
      if (brand && !$(".v4-ctx", brand)) {
        const extra = $$(":scope > .lede, :scope > .mission", brand);
        if (extra.length) {
          const det = el("details", "v4-ctx", `<summary><span class="v4-ctx-ic">i</span><b>Contexte de l’atelier</b><em>cliquer pour lire</em>${ICON.down}</summary>`);
          extra.forEach((x) => det.append(x));
          brand.append(det);
          if (!ui.ctxSeen) det.classList.add("v4-ctx-new");
          det.addEventListener("toggle", () => { if (det.open && !ui.ctxSeen) { ui.ctxSeen = true; saveUi(); $$(".v4-ctx-new").forEach((d) => d.classList.remove("v4-ctx-new")); } });
        }
      }
      if (brand) brand.after(pan); else stg.left.prepend(pan);
      const stats = $(".v2-stats", stg.left);
      const ctl = $(".controls-card", stg.right);
      if (stats) { if (ctl) ctl.after(stats); else stg.right.append(stats); }
      stg.sec.classList.add("v4-split");
      // P7 : rappel compact des mesures principales en haut des commandes quand les mesures défilent hors champ
      if (ctl && stats && !$(".v4-pin-kpi", ctl)) {
        const pin = el("div", "v4-pin-kpi");
        pin.setAttribute("aria-hidden", "true");
        const hd = $(".hd", ctl);
        if (hd) hd.after(pin); else ctl.prepend(pin);
        const prev = {};
        const cleanTxt = (n) => { if (!n) return ""; const c = n.cloneNode(true); $$(".katex-mathml, .v4-gauge", c).forEach((m) => m.remove()); return c.textContent.replace(/\s+/g, " ").trim(); };
        const parseNum = (s) => { const m = String(s || "").replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? +m[0] : NaN; };
        const syncPin = () => {
          const masked = stats.classList.contains("v3-masked");
          pin.classList.toggle("v4-pin-masked", masked);
          if (masked) { pin.innerHTML = ""; return; }
          const ks = $$(".kpi:not(.v2-why)", stats).filter((k) => !k.hidden && $(".v", k)).slice(0, 3);
          if (!ks.length) { pin.innerHTML = ""; return; }
          pin.innerHTML = ks.map((k, idx) => {
            const lbl = cleanTxt($(".k", k)).split("(")[0].trim().slice(0, 22);
            const val = cleanTxt($(".v", k)).slice(0, 22);
            const num = parseNum(val);
            const old = prev[idx];
            let dir = "";
            if (isFinite(num) && isFinite(old) && Math.abs(num - old) > 1e-6) dir = num > old ? "up" : "dn";
            else if (prev["d" + idx]) dir = prev["d" + idx];
            if (isFinite(num)) { prev[idx] = num; if (dir) prev["d" + idx] = dir; }
            const arrow = dir === "up" ? "↗" : dir === "dn" ? "↘" : "";
            return `<span class="v4-pk-it"><i>${lbl}</i><b>${val}${arrow ? `<em class="v4-pk-${dir}">${arrow}</em>` : ""}</b></span>`;
          }).join("");
        };
        const checkVis = () => {
          const r = stats.getBoundingClientRect();
          const outOfView = r.height > 0 && (r.top > innerHeight - 70 || r.bottom < 60);
          const compact = innerWidth <= 1240 || innerHeight <= 850;
          pin.classList.toggle("v4-pin-on", outOfView || compact);
        };
        syncPin();
        new MutationObserver(syncPin).observe(stats, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class"] });
        doc.addEventListener("scroll", checkVis, { passive: true });
        if (stg.right) stg.right.addEventListener("scroll", checkVis, { passive: true });
        window.addEventListener("resize", checkVis);
        setTimeout(checkVis, 250);
      }
    });
  }

  /* 9. accueil : la molette fait défiler la page, contenu resserré */
  function home() {
    const stg = V2.stages && V2.stages.home;
    if (!stg || !stg.sec) return;
    const noZoom = () => { const i = window.LAB3D && window.LAB3D.inst && window.LAB3D.inst.home; if (i && i.controls) { i.controls.enableZoom = false; return true; } return false; };
    if (!noZoom()) { let n = 0; const t = setInterval(() => { if (noZoom() || ++n > 40) clearInterval(t); }, 250); }
    // flèche vers la suite de la page
    const hero = $(".v2-home", stg.sec);
    if (hero && !$(".v4-homedown", hero)) {
      const b = el("button", "v4-homedown", `<span>Ateliers et badges</span>${ICON.down}`);
      b.type = "button";
      b.addEventListener("click", () => { const n = hero.nextElementSibling; if (n) n.scrollIntoView({ behavior: "smooth", block: "start" }); });
      hero.append(b);
    }
    const rest = $(".v2-home-rest", stg.sec);
    if (!rest) return;
    $$(".v2-herofallback", rest).forEach((c) => { c.hidden = true; });
    const wipe = $(".wipe-card", rest);
    if (wipe) wipe.hidden = true; // bouton repris dans le menu de gauche
    const head = $(".v2-sechead p", rest);
    if (head) head.textContent = "La mission et la méthode de travail. La remise à zéro est dans le menu de gauche.";
    const wel = $(".welcome", rest);
    if (wel && !wel.closest("details")) {
      const det = el("details", "card v4-howto", "<summary>Méthode de travail et règles du laboratoire</summary>");
      wel.classList.remove("card");
      wel.before(det);
      det.append(wel);
    }
  }

  /* premier atelier ouvert : une bulle d'une ligne, qui disparaît au premier clic dans le panneau */
  function bubble(id) {
    if (ui.welcomed || !id || id === "home" || id === "defi") return;
    const stg = V2.stages && V2.stages[id];
    const pan = stg && stg.sec && $(".v3-panel", stg.sec);
    if (!pan || $(".v4-bubble", stg.sec)) return;
    const b = el("div", "v4-bubble", `<b>Pour commencer :</b> 1. faites votre pari ci-dessous ; 2. manipulez la 3D (glisser, objets « à saisir ») ou les commandes à droite (valeurs ${ICON.pen} à taper).`);
    pan.before(b);
    const off = () => { b.remove(); ui.welcomed = true; saveUi(); stg.sec.removeEventListener("click", off, true); };
    stg.sec.addEventListener("click", off, true);
  }

  function toast(anchor, msg, action) {
    $$(".v4-toast").forEach((x) => x.remove());
    const t = el("div", "v4-toast" + (action ? " v4-act" : ""), `<span>${msg}</span>`);
    if (action) {
      const b = el("button", "", action[0]);
      b.type = "button";
      b.addEventListener("click", () => { t.remove(); action[1](); });
      t.append(b);
    }
    doc.body.append(t);
    const r = anchor.getBoundingClientRect();
    t.style.left = r.right + 10 + "px";
    t.style.top = r.top + r.height / 2 + "px";
    const life = action ? 6000 : 1600;
    setTimeout(() => t.classList.add("out"), life);
    setTimeout(() => t.remove(), life + 500);
  }

  // après la v2 et la v3 (qui ajoutent leurs boutons au chargement)
  const go = () => setTimeout(init, 60);
  if (doc.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
})();
