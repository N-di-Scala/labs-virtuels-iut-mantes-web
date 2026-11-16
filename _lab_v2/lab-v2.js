/* =====================================================================
   Labs virtuels IUT Mantes - interface v2 « studio »
   Réorganise le DOM de la v1 (sans toucher à sa logique) :
   scène 3D + tuiles de mesures + panneau de commandes + carnet.
   Doit s'exécuter AVANT le script principal du lab.
   ===================================================================== */
(() => {
  const C = window.LABV2_CONF || {};
  const doc = document;
  const root = doc.documentElement;
  root.classList.add("v2");
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const emit = (name, detail) => doc.dispatchEvent(new CustomEvent("labv2:" + name, { detail }));
  const I = {
    rotate: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
    tags: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    center: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4"/><path d="M12 16.8v.2"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.5a7.8 7.8 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5m0-5-5 5"/>',
    house: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    star: '<path fill="currentColor" stroke="none" d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.5L12 16.9 6.1 20.1l1.3-6.5L2.5 9l6.6-.8z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    memo: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
    debat: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  };
  const svg = (k, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[k]}</svg>`;
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* ignore */ } },
  };

  /* ---------------- LaTeX → Unicode : repli lisible si KaTeX n'est pas chargé (hors-ligne) ---------------- */
  const TEXMAP = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ", varepsilon: "ε", epsilon: "ε", zeta: "ζ", eta: "η",
    theta: "θ", lambda: "λ", mu: "μ", nu: "ν", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", varphi: "φ", phi: "φ",
    Phi: "Φ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω", sum: "∑", infty: "∞", times: "×", cdot: "·", pm: "±",
    approx: "≈", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", propto: "∝", circ: "°", to: "→",
    rightarrow: "→", Rightarrow: "⇒", ll: "≪", gg: "≫", oplus: "⊕", partial: "∂", ldots: "…", dots: "…",
    cdots: "⋯", lt: "&lt;", gt: "&gt;", quad: " ", qquad: " ", degree: "°", prime: "′",
  };
  function texToUnicode(src) {
    let s = String(src == null ? "" : src).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const has = (w) => Object.prototype.hasOwnProperty.call(TEXMAP, w);
    // 1) symboles connus (\cdot, \lambda...) avant tout collage de mots
    s = s.replace(/\\([A-Za-z]+)/g, (m, w) => (has(w) ? TEXMAP[w] : m));
    // 2) groupes les plus internes d'abord : indices, exposants, fractions, racines
    for (let k = 0; k < 5; k++) {
      s = s
        .replace(/\\(?:mathrm|text|textrm|mathbf|boldsymbol|operatorname|mathit|mathsf)\s*\{([^{}]*)\}/g, "$1")
        .replace(/_\{([^{}]*)\}/g, "<sub>$1</sub>")
        .replace(/\^\{([^{}]*)\}/g, "<sup>$1</sup>")
        .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
        .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
        .replace(/\\(?:bar|overline)\s*\{([^{}]*)\}/g, "$1̄")
        .replace(/\\(?:left|right|big|Big|bigg|Bigg)(?![A-Za-z])/g, "");
    }
    // 3) restes : indices/exposants d'un caractère, commandes inconnues, espacements
    s = s.replace(/_([^\s{}\\<])/g, "<sub>$1</sub>").replace(/\^([^\s{}\\<])/g, "<sup>$1</sup>");
    s = s.replace(/\\([A-Za-z]+)/g, "$1");
    s = s.replace(/\\[,;:! ]/g, " ").replace(/\\\\/g, " ").replace(/[{}]/g, "").replace(/\\/g, "");
    return s.replace(/\s{2,}/g, " ").trim();
  }
  window.LABV2_TEX = texToUnicode;

  const logoSVG = () => { const l = $(".brand .logo svg"); return l ? l.outerHTML : ""; };
  const labCode = C.code || (($(".brand .code") || {}).textContent || "").split("·")[0].trim();
  const labTitle = C.title || (($(".brand h1") || {}).textContent || "Laboratoire virtuel").trim();
  const titleHTML = C.titleHTML || labTitle.replace(/(\S+)$/, "<em>$1</em>");

  /* ---------------- intro (une fois par session) ---------------- */
  let intro = null;
  const introKey = "labv2_intro_" + labCode;
  if (!RM && !sessionStorage.getItem(introKey)) {
    try { sessionStorage.setItem(introKey, "1"); } catch (_) { /* ignore */ }
    intro = el("div", "v2-intro", `<div><div class="v2-i-logo">${logoSVG()}</div><h1>${titleHTML}</h1><p>${labCode} · Laboratoire virtuel${C.mission ? " · Mission " + C.mission : ""}</p><div class="v2-i-bar"><i></i></div></div>`);
    doc.body.appendChild(intro);
    requestAnimationFrame(() => requestAnimationFrame(() => { const b = $(".v2-i-bar i", intro); if (b) b.style.width = "100%"; }));
    const t0 = performance.now();
    const done = () => {
      const wait = Math.max(0, 1150 - (performance.now() - t0));
      setTimeout(() => { intro.classList.add("out"); setTimeout(() => intro.remove(), 800); }, wait);
    };
    if (doc.readyState === "complete") done(); else window.addEventListener("load", done, { once: true });
    setTimeout(() => intro && intro.classList.add("out"), 3200);
  }

  /* ---------------- monde 3D (coquille) ---------------- */
  function makeWorld(id, opts = {}) {
    const w = el("div", "v2-world");
    w.dataset.scene = id;
    w.innerHTML = `
      <div class="v2-loading"><div>Préparation de la scène 3D<i></i></div></div>
      <div class="v2-tags"></div><div class="v2-tip"></div>
      ${opts.home ? "" : '<div class="v2-scale">Fig. 1 · <b>vue 3D</b> interactive</div>'}
      <div class="v2-hint">Glisser pour tourner · molette pour zoomer · survoler pour lire</div>
      <div class="v2-tools">
        <div class="v2-views"></div>
        <span class="v2-sp"></span>
        <button type="button" class="v2-chipbtn" data-tool="rotate" aria-pressed="false" title="Rotation automatique (A)">${svg("rotate")}<span>Rotation</span><kbd>A</kbd></button>
        <button type="button" class="v2-chipbtn" data-tool="tags" aria-pressed="true" title="Étiquettes (E)">${svg("tags")}<span>Étiquettes</span><kbd>E</kbd></button>
        <button type="button" class="v2-chipbtn v2-icon" data-tool="center" title="Recentrer la caméra (C)">${svg("center")}</button>
        ${opts.home ? "" : `<button type="button" class="v2-chipbtn" data-tool="help" title="Comment c’est calculé ? (H)">${svg("help")}<span>Comment c’est calculé ?</span></button>`}
        ${opts.home ? "" : `<button type="button" class="v2-chipbtn v2-icon" data-tool="link" title="Copier le lien de ce réglage (à envoyer à un camarade ou à l’enseignant)">${svg("link")}</button>`}
        ${opts.home ? "" : `<button type="button" class="v2-chipbtn v2-icon" data-tool="memo" title="Mon mémo de calcul : réglages, formules et résultats, à copier ou imprimer">${svg("memo")}</button>`}
        <button type="button" class="v2-chipbtn v2-icon" data-tool="full" title="Plein écran (F)">${svg("full")}</button>
      </div>`;
    $$(".v2-tools [data-tool]", w).forEach((b) => b.addEventListener("click", () => tool(b.dataset.tool, w)));
    return w;
  }
  function tool(name, world) {
    if (name === "help") { openHelp(); return; }
    if (name === "link") { copyLink(); return; }
    if (name === "memo") { openMemo(); return; }
    if (name === "full") { toggleFull(world); return; }
    emit("tool", { tool: name, world });
  }
  function toggleFull(world) {
    const host = world.closest(".v2-stage, .v2-home") || world;
    if (doc.fullscreenElement) doc.exitFullscreen();
    else if (host.requestFullscreen) host.requestFullscreen().catch(() => {});
  }

  /* ---------------- ateliers → scène ---------------- */
  const stages = {};
  function buildStage(sec) {
    const id = sec.id.replace("atelier-", "");
    const hero = $(":scope > .hero", sec);
    const grid = $(":scope > .grid", sec);
    if (!hero || !grid) { sec.classList.add("v2-plain"); return; }
    const ctl = $(".controls-card", grid);
    const viz = [...grid.children].filter((c) => c !== ctl);
    const out = $('.readouts[id^="out-"]', sec);

    const stage = el("div", "v2-stage");
    const left = el("div", "v2-left");
    const brand = el("div", "v2-brand");
    const heroText = hero.firstElementChild && hero.firstElementChild.tagName === "DIV" ? hero.firstElementChild : hero;
    brand.append(...heroText.childNodes);
    const tag = $(".tag", hero);
    if (tag) brand.append(tag);
    const stats = el("div", "v2-stats");
    if (out) stats.append(out);
    left.append(brand, stats);

    const center = el("div", "v2-center");
    const world = makeWorld(id);
    const figs = el("div", "v2-figs");
    figs.append(...viz);
    center.append(world, figs);

    const right = el("div", "v2-right");
    if (ctl) right.append(ctl);

    stage.append(left, center, right);

    const nb = el("div", "v2-notebook");
    nb.append(el("div", "v2-nbhead", `<h3>Carnet de l’atelier</h3><span>Défi express · à retenir · pour aller plus loin</span>`));
    const rest = [...sec.children].filter((c) => c !== hero && c !== grid);
    nb.append(...rest);
    const deb = C.debats && C.debats[id];
    if (deb) {
      nb.append(el("div", "card v2-debat", `<div class="hd">${svg("debat")}Le coin du maître d’œuvre</div><div class="bd"><p>${deb}</p><p class="v2-debat-note">Question ouverte : pas de réponse unique. Argumentez avec la physique de l’atelier, puis avec le coût, le carbone, l’usage ou l’architecture.</p></div>`));
    }
    sec.replaceChildren(stage, nb);
    stages[id] = { sec, stage, world, figs, out, left, right };
  }

  /* ---------------- accueil ---------------- */
  function buildHome(sec) {
    const hero = $(":scope > .hero", sec);
    const vs = $(":scope > .viz-stack", sec);
    const cvHero = $("#cv-hero", sec);
    const heroCard = cvHero ? cvHero.closest(".card") : null;
    const lede = hero ? $(".lede", hero) : null;
    const eyebrow = hero ? $(".eyebrow", hero) : null;

    const home = el("div", "v2-home");
    const world = makeWorld("home", { home: true });
    const nAteliers = $$(".nav-btn").length - 2;
    const copy = el("div", "v2-home-copy", `
      ${C.mission ? `<span class="v2-kicker"><b>MISSION</b>${C.mission}${C.missionSub ? " · " + C.missionSub : ""}</span>` : ""}
      <p class="v2-eyebrow">${eyebrow ? eyebrow.textContent : labCode}${C.level ? " · " + C.level : ""}</p>
      <h2>${titleHTML}</h2>
      <p class="v2-lede">${C.lede || (lede ? lede.innerHTML : "")}</p>
      <div class="v2-cta">
        <button type="button" class="v2-btn v2-primary" data-go="next"><span>Commencer</span>${svg("arrow")}</button>
        <button type="button" class="v2-btn" data-go="gloss">${svg("book")}<span>Lexique express</span><kbd>L</kbd></button>
      </div>
      <div class="v2-home-stats">
        <div><i>Ateliers</i><b>${nAteliers}</b></div>
        <div title="Ateliers ouverts et manipulés au moins une fois"><i>Commencés</i><b data-mirror="prog-count">0</b></div>
        <div><i>Étoiles</i><b data-mirror="star-count">0</b></div>
        <div style="min-width:170px"><i>Rang</i><b data-mirror="rank-name" style="font:600 15px var(--v2-font);margin-top:8px;color:var(--gold)"></b></div>
      </div>`);
    home.append(world, copy);

    const cardsSec = el("div", "v2-section", `
      <div class="v2-sechead"><div class="v2-num">01</div><div><h3>Les <em>ateliers</em></h3><p>Chaque atelier isole un phénomène : bougez les curseurs, observez la scène, puis décrochez l’étoile du Défi express.</p></div></div>
      <div class="v2-cards"></div>`);
    const cards = $(".v2-cards", cardsSec);
    $$(".nav-btn").forEach((b) => {
      const a = b.dataset.atelier;
      if (a === "home") return;
      const c = el("button", "v2-card");
      c.type = "button";
      c.dataset.card = a;
      const ic = $(".ic", b);
      const idx = $(".idx", b);
      c.innerHTML = `<div class="v2-ctop"><span class="v2-cic">${ic ? ic.innerHTML : ""}</span><span class="v2-cidx">${idx ? idx.textContent : ""}</span></div>
        <h4>${($(".label", b) || {}).innerHTML || a}</h4><p>${($(".sub", b) || {}).innerHTML || ""}</p>
        <div class="v2-cstate"><i></i><span>${a === "defi" ? "Quiz de synthèse" : "À faire"}</span></div>`;
      c.addEventListener("click", () => b.click());
      cards.append(c);
    });

    const restSec = el("div", "v2-home-rest");
    const restHead = el("div", "v2-sechead", `<div class="v2-num">02</div><div><h3>Mode <em>d’emploi</em></h3><p>La mission, la méthode de travail et la remise à zéro.</p></div>`);
    restHead.style.gridColumn = "1 / -1";
    restHead.style.marginBottom = "0";
    restSec.append(restHead);
    if (vs) [...vs.children].forEach((c) => { if (c !== heroCard) restSec.append(c); });
    if (heroCard) { heroCard.classList.add("v2-herofallback"); restSec.append(heroCard); }
    const leftovers = [...sec.children].filter((c) => c !== hero && c !== vs);
    restSec.append(...leftovers);
    sec.replaceChildren(home, cardsSec, restSec);

    $('[data-go="gloss"]', copy).addEventListener("click", () => { const g = $("#gloss-btn"); if (g) g.click(); });
    $('[data-go="next"]', copy).addEventListener("click", () => {
      const btns = $$(".nav-btn").filter((b) => b.dataset.atelier !== "home");
      const next = btns.find((b) => !b.classList.contains("v2-explored")) || btns[0];
      if (next) next.click();
    });
    stages.home = { sec, world };
  }

  /* ---------------- rail : compteur d'étoiles + son ---------------- */
  function buildRail() {
    const tools = $(".side-tools");
    if (!tools) return;
    const star = el("div", "v2-railstar", `${svg("star")}<span data-mirror="star-count">0/0</span>`);
    star.title = "Étoiles de défi";
    tools.prepend(star);
    const snd = el("button", "theme-btn v2-toggle");
    snd.type = "button";
    snd.id = "v2-sound";
    snd.innerHTML = `<span class="v2-sic">${svg("mute")}</span><span>Sons d’interface</span>`;
    snd.addEventListener("click", () => setSound(!soundOn));
    const help = el("button", "theme-btn");
    help.type = "button";
    help.innerHTML = `${svg("help")}<span>Aide &amp; raccourcis</span>`;
    help.addEventListener("click", openHelp);
    const ctr = el("button", "theme-btn v2-toggle");
    ctr.type = "button";
    ctr.id = "v2-contrast";
    ctr.innerHTML = `${svg("contrast")}<span>Mode contrasté</span>`;
    ctr.title = "Mode contrasté : symboles ✓ ✗ ! en plus des couleurs (daltonisme, vidéoprojecteur)";
    ctr.addEventListener("click", () => setContrast(!root.classList.contains("v2-contrast")));
    // retour à l'accueil du site (les labs sont servis depuis labs/<id>/)
    const homeL = el("a", "theme-btn v2-sitehome");
    homeL.href = "../../index.html";
    homeL.innerHTML = `${svg("house")}<span>Accueil du site</span>`;
    homeL.title = "Revenir à l’accueil du site (liste des labs)";
    tools.append(snd, ctr, help, homeL);
    $$(".theme-btn", tools).forEach((b) => { if (!b.title) b.title = (b.textContent || "").trim(); });
  }

  /* ---------------- miroirs (HUD) ---------------- */
  function mirrors() {
    const sync = () => {
      $$("[data-mirror]").forEach((m) => {
        const src = doc.getElementById(m.dataset.mirror);
        if (src) m.textContent = src.textContent;
      });
      $$(".nav-btn").forEach((b) => {
        const dot = $(".dot", b);
        const st = $(".star-ic", b);
        const ex = !!(dot && dot.classList.contains("done"));
        const sr = !!(st && st.classList.contains("on"));
        b.classList.toggle("v2-explored", ex);
        b.classList.toggle("v2-starred", sr);
        const card = $(`.v2-card[data-card="${b.dataset.atelier}"]`);
        if (card) {
          card.classList.toggle("v2-explored", ex);
          card.classList.toggle("v2-starred", sr);
          const s = $(".v2-cstate span", card);
          if (s && b.dataset.atelier !== "defi") s.textContent = sr ? "★ Étoile obtenue" : ex ? "Commencé" : "À faire";
          if (s && b.dataset.atelier === "defi" && sr) s.textContent = "Réussi";
        }
      });
      const next = $('[data-go="next"] span');
      if (next) next.textContent = $$(".nav-btn.v2-explored").length ? "Reprendre" : "Commencer";
    };
    const mo = new MutationObserver(sync);
    $$("#prog-count, #star-count, #rank-name").forEach((n) => mo.observe(n, { childList: true, characterData: true, subtree: true }));
    $$(".nav-btn .dot, .nav-btn .star-ic").forEach((n) => mo.observe(n, { attributes: true, attributeFilter: ["class"] }));
    sync();
  }

  /* ---------------- curseurs & sélecteurs ---------------- */
  function enhanceRanges() {
    $$('.v2-right input[type="range"], .v2-stage input[type="range"]').forEach((inp) => {
      if (inp.parentElement.classList.contains("v2-range")) return;
      const wrap = el("div", "v2-range");
      inp.parentNode.insertBefore(wrap, inp);
      wrap.append(inp);
      const bub = el("span", "v2-bubble");
      wrap.append(bub);
      const ctrl = inp.closest(".ctrl");
      const valEl = ctrl ? $("label strong", ctrl) : null;
      const pos = () => {
        const p = (+inp.value - +inp.min) / ((+inp.max - +inp.min) || 1);
        bub.style.left = `calc(${p * 100}% + ${(0.5 - p) * 18}px)`;
        bub.textContent = valEl ? valEl.textContent : inp.value;
      };
      const on = () => { wrap.classList.add("v2-drag"); pos(); };
      const off = () => wrap.classList.remove("v2-drag");
      inp.addEventListener("pointerdown", on);
      inp.addEventListener("input", () => { pos(); tick(inp); });
      inp.addEventListener("pointerup", off);
      inp.addEventListener("pointercancel", off);
      inp.addEventListener("blur", off);
      inp.addEventListener("dblclick", () => {
        const d = inp.getAttribute("value");
        if (d == null) return;
        inp.value = d;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      });
      inp.title = "Double-clic : valeur par défaut";
    });
  }
  function enhanceSelects() {
    $$(".v2-right select").forEach((sel) => {
      const opts = [...sel.options];
      if (opts.length < 2 || opts.length > 5 || opts.some((o) => o.text.length > 46)) return;
      const seg = el("div", "v2-seg");
      seg.setAttribute("role", "group");
      opts.forEach((o) => {
        const b = el("button");
        b.type = "button";
        b.textContent = o.text;
        b.dataset.v = o.value;
        b.addEventListener("click", () => {
          sel.value = o.value;
          sel.dispatchEvent(new Event("input", { bubbles: true }));
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          syncSeg();
          tick(null, 0.6);
        });
        seg.append(b);
      });
      const syncSeg = () => $$("button", seg).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === sel.value)));
      sel.parentNode.insertBefore(seg, sel);
      sel.addEventListener("change", syncSeg);
      sel.addEventListener("input", syncSeg);
      sel._v2sync = syncSeg;
      syncSeg();
    });
  }

  /* ---------------- tuiles de mesures ---------------- */
  function watchReadouts() {
    Object.entries(stages).forEach(([id, s]) => {
      if (!s.out) return;
      let prev = [];
      const classify = () => {
        const kp = $$(".kpi", s.out);
        kp.forEach((k, i) => {
          const v = $(".v", k);
          const txt = v ? v.textContent.trim() : "";
          const isWhy = k.classList.contains("wide") && (txt.length > 30 || (v && v.querySelector("strong, b, sub")));
          k.classList.toggle("v2-why", !!isWhy);
          if (prev[i] !== undefined && prev[i] !== txt && !isWhy && !RM) {
            k.classList.remove("v2-flash");
            void k.offsetWidth;
            k.classList.add("v2-flash");
          }
          prev[i] = txt;
        });
        $$("select", s.right || doc).forEach((sel) => sel._v2sync && sel._v2sync());
        emit("update", { id });
      };
      new MutationObserver(classify).observe(s.out, { childList: true, subtree: true, characterData: true });
      classify();
    });
  }

  /* ---------------- atelier actif ---------------- */
  let current = null;
  function watchActive() {
    const check = () => {
      const a = $(".atelier.active");
      const id = a ? a.id.replace("atelier-", "") : null;
      if (id && id !== current) {
        current = id;
        emit("atelier", { id, world: stages[id] && stages[id].world });
      }
    };
    $$(".atelier").forEach((s) => new MutationObserver(check).observe(s, { attributes: true, attributeFilter: ["class"] }));
    check();
  }
  new MutationObserver(() => emit("theme", { theme: root.dataset.theme })).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------------- aide ---------------- */
  let dlg = null;
  function openHelp() {
    if (!dlg) {
      dlg = el("dialog", "v2-dialog");
      doc.body.append(dlg);
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    }
    const s = stages[current];
    const title = s ? ($(".v2-brand h2", s.stage) || {}).textContent : labTitle;
    let body = "";
    if (s) {
      // « À retenir » reste caché tant que le carnet de l'atelier est verrouillé (parcours en cours)
      const ret = !$(".v3s-nb-locked", s.sec) && $(".pedago .retenir ul", s.sec);
      if (ret) body += `<h3>À retenir</h3><ul>${ret.innerHTML}</ul>`;
      const ks = s.out ? $$(".kpi:not(.v2-why) .k", s.out).map((k) => `<li>${k.innerHTML}</li>`).join("") : "";
      if (ks) body += `<h3>Grandeurs affichées</h3><ul>${ks}</ul>`;
      const eq = $$(".eq-list", s.figs).map((u) => u.innerHTML).join("");
      if (eq) body += `<h3>Lecture des figures</h3><ul>${eq}</ul>`;
    } else {
      body += `<p style="color:var(--v2-ink2);line-height:1.6">Choisissez un atelier dans le rail de gauche ou sur les cartes de l’accueil. Chaque atelier propose une scène 3D manipulable, des mesures en direct, des figures détaillées et un Défi express.</p>`;
    }
    body += `<h3>Commandes</h3><div class="v2-keys">
      <kbd>← →</kbd><span>Atelier précédent / suivant</span>
      <kbd>0-9</kbd><span>Aller directement à un atelier</span>
      <kbd>A</kbd><span>Rotation automatique de la scène</span>
      <kbd>E</kbd><span>Afficher / masquer les étiquettes</span>
      <kbd>C</kbd><span>Recentrer la caméra</span>
      <kbd>F</kbd><span>Plein écran (pratique pour projeter en TD)</span>
      <kbd>H</kbd><span>Cette fenêtre</span>
      <kbd>L</kbd><span>Lexique express</span>
      <kbd>M</kbd><span>Sons d’interface</span>
      <kbd>Double-clic</kbd><span>Sur un curseur : revenir à la valeur par défaut</span>
    </div>`;
    dlg.innerHTML = `<button class="v2-close" type="button" aria-label="Fermer">×</button><div class="v2-dlg-in"><p class="v2-dlg-sub">${s ? "Comment c’est calculé ?" : "Aide"}</p><h2>${title || labTitle}</h2>${body}</div>`;
    $(".v2-close", dlg).addEventListener("click", () => dlg.close());
    if (!dlg.open) dlg.showModal();
  }

  /* ---------------- sons d'interface ---------------- */
  let soundOn = LS.get("labv2_sound", "0") === "1";
  let actx = null;
  let lastTick = 0;
  function ac() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { actx = null; } }
    return actx;
  }
  function blip(freq, dur = 0.05, gain = 0.035, type = "sine", when = 0) {
    const a = ac();
    if (!a) return;
    const t = a.currentTime + when;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function tick(inp, p) {
    if (!soundOn) return;
    const now = performance.now();
    if (now - lastTick < 38) return;
    lastTick = now;
    if (p == null && inp) p = (+inp.value - +inp.min) / ((+inp.max - +inp.min) || 1);
    blip(320 + 620 * (p || 0.5), 0.045, 0.03, "triangle");
  }
  function setSound(on) {
    soundOn = on;
    LS.set("labv2_sound", on ? "1" : "0");
    const b = $("#v2-sound");
    if (b) {
      b.setAttribute("aria-pressed", String(on));
      $(".v2-sic", b).innerHTML = svg(on ? "sound" : "mute");
    }
    if (on) { const a = ac(); if (a && a.state === "suspended") a.resume(); blip(660, 0.08, 0.04); blip(990, 0.1, 0.035, "sine", 0.07); }
  }
  function pinkNoise(a, dur) {
    const n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      // bruit rose (filtre de Paul Kellet)
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }
  /* son sourd de rupture (essai d'écrasement) */
  function thud() {
    const a = ac();
    if (!a) return;
    if (a.state === "suspended") a.resume();
    const t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.45);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + 0.65);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain();
    src.buffer = pinkNoise(a, 0.5);
    f.type = "lowpass"; f.frequency.value = 900;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.6, t + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    src.connect(f).connect(gn).connect(a.destination);
    src.start(t); src.stop(t + 0.5);
  }
  /* écoute illustrative : la source seule, puis derrière une paroi R_w dans un local de réverbération T */
  function playRoom(Rw, T) {
    const a = ac();
    if (!a) return 0;
    if (a.state === "suspended") a.resume();
    const t0 = a.currentTime + 0.05;
    const burst = 0.5;
    // 1) côté source : bruit rose bref, sans paroi ni réverbération
    const s1 = a.createBufferSource(), g1 = a.createGain();
    s1.buffer = pinkNoise(a, burst);
    g1.gain.setValueAtTime(0.0001, t0);
    g1.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
    g1.gain.setValueAtTime(0.3, t0 + burst - 0.03);
    g1.gain.exponentialRampToValueAtTime(0.0001, t0 + burst);
    s1.connect(g1).connect(a.destination);
    s1.start(t0); s1.stop(t0 + burst + 0.05);
    // 2) derrière la paroi : aigus coupés d'autant plus que R_w est grand, niveau atténué
    //    (compressé pour rester audible), puis décroissance de 60 dB en T secondes (Sabine)
    const t1 = t0 + burst + 0.45;
    const Tr = Math.max(0.1, Math.min(4, T || 0.8));
    const R = Math.max(20, Rw || 20);
    const fc = Math.max(180, 9000 * Math.pow(10, -(R - 20) / 30));
    const g = 0.3 * Math.pow(10, -(R - 20) / 60);
    const s2 = a.createBufferSource(), f2 = a.createBiquadFilter(), g2 = a.createGain();
    s2.buffer = pinkNoise(a, burst + Tr * 1.3 + 0.2);
    f2.type = "lowpass"; f2.frequency.value = fc; f2.Q.value = 0.5;
    g2.gain.setValueAtTime(0.0001, t1);
    g2.gain.exponentialRampToValueAtTime(g, t1 + 0.01);
    g2.gain.setValueAtTime(g, t1 + burst);
    g2.gain.setTargetAtTime(0.00001, t1 + burst, Tr / 6.91);
    s2.connect(f2).connect(g2).connect(a.destination);
    s2.start(t1); s2.stop(t1 + burst + Tr * 1.3 + 0.2);
    return (t1 - t0) + burst + Tr;
  }

  doc.addEventListener("click", (e) => {
    const o = e.target.closest && e.target.closest(".opt");
    if (!o || !soundOn) return;
    setTimeout(() => {
      if (o.classList.contains("correct")) { blip(660, 0.09, 0.045); blip(880, 0.1, 0.04, "sine", 0.08); blip(1320, 0.16, 0.035, "sine", 0.16); }
      else if (o.classList.contains("wrong")) { blip(180, 0.16, 0.05, "triangle"); }
    }, 0);
  }, true);

  /* ---------------- message bref (réutilise la bulle de la v1) ---------------- */
  let flashT;
  function flash(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(flashT);
    flashT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function copyText(text, okMsg) {
    const fallback = () => {
      const ta = el("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      doc.body.append(ta);
      ta.select();
      try { doc.execCommand("copy"); flash(okMsg); } catch (_) { flash("Copie impossible : sélectionnez le texte à la main."); }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => flash(okMsg), fallback);
    else fallback();
  }

  /* ---------------- lien d'état : le réglage courant est inscrit dans l'adresse ---------------- */
  function stateQuery(id) {
    if (!id || id === "home") return "";
    const p = new URLSearchParams();
    p.set("atelier", id);
    const s = stages[id];
    if (s && s.right) $$('input[type="range"], select', s.right).forEach((inp) => { if (inp.id) p.set(inp.id, inp.value); });
    return p.toString();
  }
  let urlT;
  function syncURL() {
    clearTimeout(urlT);
    urlT = setTimeout(() => {
      const q = stateQuery(current);
      try { history.replaceState(null, "", q ? "#" + q : location.pathname + location.search); } catch (_) { /* file:// ou bac à sable */ }
    }, 300);
  }
  function copyLink() {
    const q = stateQuery(current);
    copyText(location.href.split("#")[0] + (q ? "#" + q : ""), "Lien du réglage copié : collez-le dans un message.");
  }
  function restoreFromURL() {
    const h = location.hash.replace(/^#/, "");
    const qs = new URLSearchParams(location.search);
    const p = new URLSearchParams(h);
    const id = p.get("atelier") || qs.get("atelier") || (h && !h.includes("=") ? h : "");
    const btn = id && $(`.nav-btn[data-atelier="${id}"]`);
    if (!btn) return;
    btn.click();
    const s = stages[id];
    if (!s || !s.right) return;
    p.forEach((v, k) => {
      if (k === "atelier") return;
      const inp = doc.getElementById(k);
      if (!inp || !s.right.contains(inp)) return;
      if (inp.tagName === "SELECT" && ![...inp.options].some((o) => o.value === v)) return;
      if (inp.type === "range" && (!isFinite(+v) || +v < +inp.min || +v > +inp.max)) return;
      inp.value = v;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  /* ---------------- mémo de calcul (trace écrite pour le portfolio) ---------------- */
  const tx = (n) => (n ? n.textContent.replace(/\s+/g, " ").trim() : "");
  function plainK(node) {
    if (!node) return "";
    const c = node.cloneNode(true);
    $$(".katex-mathml", c).forEach((m) => m.remove());
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function memoData() {
    const s = stages[current];
    if (!s || !s.stage) return null;
    const title = tx($(".v2-brand h2", s.stage));
    const eyebrow = tx($(".v2-brand .eyebrow", s.stage));
    const ctrls = s.right ? $$(".ctrl", s.right).filter((c) => !c.hidden && $("input, select", c)).map((c) => {
      const lab = $("label", c);
      const val = lab ? $("strong", lab) : null;
      let name = "";
      if (lab) {
        const cl = lab.cloneNode(true);
        $$("strong, .katex-mathml", cl).forEach((m) => m.remove());
        name = cl.textContent.replace(/\s+/g, " ").trim();
      }
      const sel = $("select", c);
      return { name, v: val ? tx(val) : sel ? tx(sel.selectedOptions[0]) : "" };
    }) : [];
    const masked = !!$(".v2-stats.v3-masked", s.stage);
    const kpis = s.out && !masked ? $$(".kpi", s.out).map((k) => ({ name: plainK($(".k", k)), v: plainK($(".v", k)) })) : [];
    return { title, eyebrow, ctrls, kpis, masked };
  }
  function memoText(d, note) {
    const date = new Date().toLocaleDateString("fr-FR");
    return [
      `${labCode} · ${labTitle} · ${d.eyebrow}`,
      d.title,
      `Mémo de calcul du ${date}`,
      "",
      "Réglages :",
      ...d.ctrls.map((c) => `- ${c.name} : ${c.v}`),
      "",
      "Résultats affichés :",
      ...(d.masked ? ["- (les mesures s’affichent à l’étape 3 du parcours)"] : d.kpis.map((k) => `- ${k.name} : ${k.v}`)),
      "",
      ...(note ? ["Ma remarque :", note, ""] : []),
      "Lien vers ce réglage : " + location.href.split("#")[0] + "#" + stateQuery(current),
      "Situation générique d’entraînement : ces valeurs ne sont pas celles du dossier noté.",
    ].join("\n");
  }
  function openMemo() {
    const d = memoData();
    if (!d) return;
    if (!dlg) {
      dlg = el("dialog", "v2-dialog");
      doc.body.append(dlg);
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    }
    const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const rows = (a) => a.length ? `<dl>${a.map((x) => `<dt>${esc(x.name)}</dt><dd>${esc(x.v)}</dd>`).join("")}</dl>` : "";
    dlg.innerHTML = `<button class="v2-close" type="button" aria-label="Fermer">×</button><div class="v2-dlg-in">
      <p class="v2-dlg-sub">Mon mémo de calcul</p><h2>${esc(d.title)}</h2>
      <p class="v2-memo-why"><b>À quoi ça sert ?</b> Le mémo photographie l’atelier tel que vous l’avez réglé : les valeurs des commandes et les résultats obtenus. Ajoutez une phrase pour dire ce que vous en retenez, puis copiez-le dans votre compte rendu ou votre portfolio, ou imprimez-le. Le lien qu’il contient rouvre l’atelier exactement avec ces réglages.</p>
      <div class="v2-memo-grid">
        <div class="v2-memo-box"><h3>Mes réglages</h3>${rows(d.ctrls) || "<p>Aucun réglage.</p>"}</div>
        <div class="v2-memo-box"><h3>Mes résultats</h3>${d.masked ? "<p>Les mesures s’affichent à l’étape 3 du parcours : observez d’abord.</p>" : rows(d.kpis) || "<p>Aucun résultat affiché.</p>"}</div>
      </div>
      <label class="v2-memo-lbl" for="v2-memo-note">Ce que je retiens (facultatif)</label>
      <textarea id="v2-memo-note" class="v2-memo-note" placeholder="Exemple : en doublant l’épaisseur d’isolant, le flux est presque divisé par deux, car l’isolant porte l’essentiel de la résistance."></textarea>
      <div class="v2-memo-act"><button type="button" class="v2-btn v2-primary" data-m="copy">Copier le mémo</button><button type="button" class="v2-btn" data-m="print">Imprimer / PDF</button></div></div>`;
    const noteOf = () => ($("#v2-memo-note", dlg).value || "").trim();
    $(".v2-close", dlg).addEventListener("click", () => dlg.close());
    $('[data-m="copy"]', dlg).addEventListener("click", () => copyText(memoText(d, noteOf()), "Mémo copié : collez-le dans votre compte rendu ou votre portfolio."));
    $('[data-m="print"]', dlg).addEventListener("click", () => {
      const w = window.open("", "_blank");
      if (!w) { flash("Fenêtre bloquée : utilisez « Copier le mémo »."); return; }
      w.document.write(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Mémo - ${esc(d.title)}</title><body style="max-width:720px;margin:32px auto;color:#15171d"><pre style="white-space:pre-wrap;font:13.5px/1.6 Consolas,monospace">${esc(memoText(d, noteOf()))}</pre></body></html>`);
      w.document.close();
      w.focus();
      w.print();
    });
    if (!dlg.open) dlg.showModal();
  }

  /* ---------------- mode contrasté ---------------- */
  function setContrast(on) {
    root.classList.toggle("v2-contrast", on);
    LS.set("labv2_contrast", on ? "1" : "0");
    const b = $("#v2-contrast");
    if (b) b.setAttribute("aria-pressed", String(on));
  }

  /* ---------------- clavier ---------------- */
  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" || (t.tagName === "INPUT" && t.type !== "range"))) return;
    const k = e.key.toLowerCase();
    const s = stages[current];
    const w = s && s.world;
    if (k === "h" || k === "?") { e.preventDefault(); openHelp(); }
    else if (k === "m") setSound(!soundOn);
    else if (k === "f" && w) toggleFull(w);
    else if ((k === "a" || k === "e" || k === "c") && w) emit("tool", { tool: { a: "rotate", e: "tags", c: "center" }[k], world: w });
  });

  /* ---------------- montage ---------------- */
  function boot() {
    $$(".atelier").forEach((sec) => {
      if (sec.id === "atelier-home") buildHome(sec);
      else buildStage(sec);
    });
    buildRail();
    enhanceRanges();
    enhanceSelects();
    watchReadouts();
    mirrors();
    const sb = $("#v2-sound");
    if (sb) { sb.setAttribute("aria-pressed", String(soundOn)); $(".v2-sic", sb).innerHTML = svg(soundOn ? "sound" : "mute"); }
    watchActive();
    setContrast(LS.get("labv2_contrast", "0") === "1");
    window.LABV2 = { stages, current: () => current, conf: C, emit, audio: { thud, playRoom, blip }, flash };
    emit("ready", { stages });
    const inStage = (e) => e.target && e.target.closest && e.target.closest(".v2-stage");
    doc.addEventListener("input", (e) => { if (inStage(e)) syncURL(); });
    doc.addEventListener("change", (e) => { if (inStage(e)) syncURL(); });
    doc.addEventListener("labv2:atelier", syncURL);
    // un lien partagé ouvre l'atelier avec le même réglage (après l'initialisation de la v1)
    const restore = () => setTimeout(restoreFromURL, 350);
    if (doc.readyState === "complete") restore(); else window.addEventListener("load", restore, { once: true });
  }
  boot();
})();
