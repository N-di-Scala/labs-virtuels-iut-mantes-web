/* =====================================================================
   Labs virtuels IUT Mantes - couche « compléments » (après interface.js)
   - Camille, la tutrice : un même visage 3D dans tous les labs (rendu une fois, en image)
   - visite guidée du premier atelier (parcours, scène, commandes)
   - accueil : session (reprendre / nouvelle session / fichier de progression),
     lien avec le programme national, durée totale
   - étiquettes 3D à trois niveaux, pulsation de l'étiquette modifiée,
     liens entre mesures (indicateurs) et étiquettes de la scène
   - téléphone : commandes en tiroir ; accessibilité : annonces des retours
   ===================================================================== */
(() => {
  const V2 = window.LABV2;
  if (!V2) return;
  const doc = document;
  const root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const PC = window.LABV3_PARCOURS || {};
  const KEY = (PC.storeKey || "lab") + "_ui";
  let ui = {};
  try { ui = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) { ui = {}; }
  const saveUi = () => { try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch (_) { /* ignore */ } };
  const AV = '<span class="v4-av" aria-hidden="true"></span>';
  const TUTOR = "Camille";
  const activeId = () => { const s = $(".atelier.active"); return s ? s.id.replace("atelier-", "") : ""; };

  /* ---------------- 1. Camille : visage 3D stylisé, rendu une seule fois ----------------
     Même géométrie, mêmes couleurs dans tous les labs : le personnage est reconnaissable partout. */
  async function avatar() {
    try {
      const cached = sessionStorage.getItem("labv4_avatar_v2");
      if (cached) { root.style.setProperty("--v4-avatar", `url(${cached})`); return; }
    } catch (_) { /* ignore */ }
    let THREE;
    try { THREE = await import("three"); } catch (_) { return; }
    const url = window.LABV4_CAMILLE ? window.LABV4_CAMILLE(THREE, 256) : null;
    if (!url) return;
    root.style.setProperty("--v4-avatar", `url(${url})`);
    try { sessionStorage.setItem("labv4_avatar_v2", url); } catch (_) { /* ignore */ }
  }

  /* ---------------- 2. présentation guidée : au premier atelier du lab, puis à la demande dans chaque atelier ---------------- */
  function tour(force) {
    const id = activeId();
    if (!id || id === "home" || !(PC.ateliers || {})[id]) return;
    const sec = $(`#atelier-${id}`);
    const ctx = $(".v4-ctx", sec);
    if (ctx && !$(".v4-retour", ctx)) {
      const b = el("button", "v3-link v4-retour", "Revoir la présentation de l’atelier");
      b.type = "button";
      b.addEventListener("click", (e) => { e.preventDefault(); tour(true); });
      ctx.append(b);
    }
    // présentation automatique une seule fois par lab (premier atelier ouvert) ; ensuite, sur demande
    const seen = ui.toured === true || (ui.toured && typeof ui.toured === "object" && Object.keys(ui.toured).length > 0);
    if (seen && !force) return;
    if ($(".v4-tour-pop")) return;
    const steps = [
      { sel: ".v4-ctx", t: "Le contexte de l’atelier", p: "Commencez par lire la situation : le chantier, la question posée et ce que vous allez manipuler. Vous pourrez la rouvrir à tout moment ici.", open: true },
      { sel: ".v3-panel", t: "Le parcours", p: "Ici, je vous guide en cinq étapes. On commence toujours par un pari : prédire ce qui va se passer, avant de toucher à quoi que ce soit." },
      { sel: ".v2-world", t: "La scène 3D", p: "Faites-la tourner en glissant, zoomez à la molette, survolez les objets pour les lire. Les objets marqués « à saisir » se règlent directement à la souris." },
      { sel: ".controls-card", t: "Les commandes", p: "Les curseurs changent la physique de la scène. Cliquez sur une valeur encadrée pour taper un nombre précis. Elles se déverrouillent après votre pari." },
      { sel: ".v2-stats", t: "Les mesures", p: "Les chiffres restent cachés pendant l’observation : regardez d’abord. Ils apparaissent à l’étape 3, avec les formules." },
    ].filter((s) => $(s.sel, sec));
    if (!steps.length) return;
    ui.toured = true; ui.welcomed = true; saveUi();
    if (ctx) ctx.open = true;
    $$(".v4-bubble").forEach((b) => b.remove());
    const hole = el("div", "v4-tour-hole");
    const pop = el("div", "v4-tour-pop");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-live", "polite");
    doc.body.append(hole, pop);
    let i = 0;
    const end = () => { hole.remove(); pop.remove(); doc.removeEventListener("keydown", onKey); window.removeEventListener("resize", place); };
    const onKey = (e) => { if (e.key === "Escape") end(); };
    doc.addEventListener("keydown", onKey);
    function place() {
      const t = $(steps[i].sel, sec);
      const r = t.getBoundingClientRect();
      const pad = 6;
      Object.assign(hole.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + 2 * pad + "px", height: Math.min(r.height, innerHeight - 20) + 2 * pad + "px" });
      const pw = pop.offsetWidth || 330, ph = pop.offsetHeight || 180;
      let x = r.right + 16, y = r.top;
      if (x + pw > innerWidth - 12) x = r.left - pw - 16;
      if (x < 12) { x = Math.max(12, Math.min(innerWidth - pw - 12, r.left)); y = Math.min(r.bottom + 14, innerHeight - ph - 12); }
      pop.style.left = x + "px";
      pop.style.top = Math.max(12, Math.min(y, innerHeight - ph - 12)) + "px";
    }
    function show() {
      const s = steps[i];
      pop.innerHTML = `<header>${AV}<span>${TUTOR}, votre tutrice</span></header><h4>${s.t}</h4><p>${s.p}</p>
        <footer><em>${i + 1} / ${steps.length}</em><button type="button" class="v3-link" data-k="skip">Passer</button><button type="button" class="v3-btn" data-k="next">${i < steps.length - 1 ? "Suivant →" : "C’est parti"}</button></footer>`;
      $('[data-k="skip"]', pop).addEventListener("click", end);
      $('[data-k="next"]', pop).addEventListener("click", () => { if (++i >= steps.length) end(); else show(); });
      const t = $(s.sel, sec);
      t.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(place, 380);
      $('[data-k="next"]', pop).focus({ preventScroll: true });
    }
    window.addEventListener("resize", place);
    show();
  }

  /* ---------------- 3. accueil : session, fichier de progression, programme, durée ---------------- */
  const progressKeys = () => { const k = []; for (let i = 0; i < localStorage.length; i++) { const n = localStorage.key(i); if (n && n !== "iut_mantes_" + "theme" && n !== "labv2_sound") k.push(n); } return k; };
  function exportFile() {
    const data = { app: "labs-virtuels-iut-mantes", v: 1, date: new Date().toISOString(), lab: (V2.conf || {}).code || "", items: {} };
    progressKeys().forEach((k) => { data.items[k] = localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = `progression-labs-${new Date().toISOString().slice(0, 10)}.json`;
    doc.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function importFile() {
    const f = el("input");
    f.type = "file";
    f.accept = "application/json,.json";
    f.addEventListener("change", () => {
      const file = f.files && f.files[0];
      if (!file) return;
      file.text().then((t) => {
        let d;
        try { d = JSON.parse(t); } catch (_) { d = null; }
        if (!d || d.app !== "labs-virtuels-iut-mantes" || !d.items) { alert("Ce fichier n’est pas un fichier de progression des labs virtuels."); return; }
        if (!confirm("Remplacer la progression de ce navigateur par celle du fichier ?")) return;
        Object.entries(d.items).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch (_) { /* ignore */ } });
        location.reload();
      });
    });
    f.click();
  }
  function home() {
    const stg = V2.stages && V2.stages.home;
    if (!stg || !stg.sec) return;
    const L3 = window.LABV3 || {};
    const st = L3.store ? L3.store() : { at: {} };
    const ids = Object.keys(PC.ateliers || {});
    const started = ids.filter((k) => st.at[k] && st.at[k].pred != null).length;
    const copy = $(".v2-home-copy", stg.sec);
    // session : sur un ordinateur partagé, l'étudiant reprend ou repart de zéro
    if (copy && !$(".v4-session", copy)) {
      const box = el("div", "v4-session");
      if (started) {
        box.innerHTML = `<span>Une progression est enregistrée sur ce navigateur : <b>${started} atelier${started > 1 ? "s" : ""} commencé${started > 1 ? "s" : ""}</b>. C’est la vôtre ?</span>`;
        const go = el("button", "v2-btn v2-primary", "Oui, reprendre"); go.type = "button";
        go.addEventListener("click", () => { box.remove(); const c = $('[data-go="next"]', copy); if (c) c.click(); });
        const nw = el("button", "v2-btn", "Non : nouvelle session"); nw.type = "button";
        nw.addEventListener("click", () => { const w = doc.getElementById("wipe-btn"); if (w) w.click(); });
        box.append(go, nw);
      } else box.innerHTML = `<span>Vous avez commencé sur un autre ordinateur ? Reprenez votre progression depuis votre fichier.</span>`;
      const files = el("div", "v4-session-file");
      const ex = el("button", "v3-link", "Enregistrer ma progression dans un fichier"); ex.type = "button"; ex.addEventListener("click", exportFile);
      const im = el("button", "v3-link", "Reprendre depuis un fichier"); im.type = "button"; im.addEventListener("click", importFile);
      if (started) files.append(ex);
      files.append(im);
      box.append(files);
      const cta = $(".v2-cta", copy);
      if (cta) cta.after(box); else copy.append(box);
    }
    // P10 : révision ciblée dès 3 ateliers commencés (ou 2 terminés)
    if (copy && L3.openReview && !$(".v4-rev-cta", copy)) {
      const doneN = ids.filter((k) => L3.stepsDone && L3.stepsDone(k) >= 5).length;
      if (started >= 3 || doneN >= 2) {
        const rb = el("button", "v2-btn v4-rev-cta", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></svg><span>Réviser mes points fragiles (5 min)</span>`);
        rb.type = "button";
        rb.addEventListener("click", () => L3.openReview());
        const cta = $(".v2-cta", copy);
        if (cta) cta.append(rb);
      }
    }
    // durée totale estimée, dans les chiffres de l'accueil
    const tot = ids.reduce((x, k) => x + (PC.ateliers[k].duree || 0), 0);
    const stats = copy && $(".v2-home-stats", copy);
    if (tot && stats && !$(".v4-dur", stats)) {
      const h = Math.floor(tot / 60), m = tot % 60;
      stats.insertAdjacentHTML("beforeend", `<div class="v4-dur"><i>Durée</i><b>≈ ${h ? h + " h " : ""}${m ? String(m).padStart(h ? 2 : 1, "0") + (h ? "" : " min") : ""}</b></div>`);
    }
    // Camille se présente
    if (copy && !$(".v4-meet", copy)) {
      const lede = $(".v2-lede", copy);
      const meet = el("p", "v4-meet", `${AV}<span><b>${TUTOR}</b>, conductrice de travaux, vous accompagne dans chaque atelier : elle pose les questions, donne les indices et fait le point à la fin.</span>`);
      if (lede) lede.after(meet);
    }
    // lien avec le programme national du B.U.T. GC-CD
    const P = PC.programme;
    const rest = $(".v2-home-rest", stg.sec);
    if (P && rest && !$(".v4-prog", rest)) {
      const card = el("div", "card v4-prog", `<div class="hd"><span>Dans votre B.U.T. Génie civil - Construction durable</span></div>
        <div class="bd"><p><b>${P.ressource}</b>${P.sae ? ` · mobilisée dans la ${P.sae}` : ""}</p>
        <p>Compétence${P.competences.length > 1 ? "s" : ""} visée${P.competences.length > 1 ? "s" : ""} :</p><div class="v4-chips">${P.competences.map((c) => `<span>${c}</span>`).join("")}</div>
        <p>Apprentissages critiques travaillés :</p><ul>${P.acs.map((a) => `<li>${a}</li>`).join("")}</ul>
        <p class="v3-meta">Source : programme national du B.U.T. GC-CD (ministère de l’Enseignement supérieur et de la Recherche).</p></div>`);
      const head = $(".v2-sechead", rest);
      if (head) head.after(card); else rest.prepend(card);
    }
  }

  /* ---------------- 4. étiquettes 3D : tout / essentiel / aucune ---------------- */
  const LVL = { all: "tout", ess: "essentiel", none: "aucune" };
  function setLvl(w, lvl) {
    w.dataset.tagLvl = lvl;
    w.classList.toggle("v2-notags", lvl === "none");
    w.classList.toggle("v4-tags-ess", lvl === "ess");
    markSec(w);
    const b = $('[data-tool="tags"]', w);
    if (b) {
      b.setAttribute("aria-pressed", String(lvl !== "none"));
      const sp = $("span", b);
      if (sp) sp.textContent = "Étiquettes : " + LVL[lvl];
      b.title = "Étiquettes (E) : tout → essentiel → aucune";
    }
  }
  // secondaires : étiquettes sans valeur (simples noms) et repères d'axes ; les grandes étiquettes et « à saisir » restent
  function markSec(w) {
    $$(".v2-tag", w).forEach((t) => {
      const em = t.lastElementChild;
      const noVal = !em || !em.textContent.trim() || em.style.display === "none";
      t.classList.toggle("v4-sec", t.classList.contains("v4-axis") || (!t.classList.contains("v2-big") && !t.classList.contains("v4-grabtag") && noVal));
    });
  }
  doc.addEventListener("labv2:tool", (e) => {
    const { tool, world } = e.detail || {};
    if (tool !== "tags" || !world) return;
    const cur = world.dataset.tagLvl || "all";
    setLvl(world, cur === "all" ? "ess" : cur === "ess" ? "none" : "all");
  });

  /* ---------------- 5. l'étiquette dont la valeur change pulse (juste après un réglage) ---------------- */
  let lastInput = 0;
  doc.addEventListener("input", (e) => { if (e.target.closest && e.target.closest(".v2-stage")) lastInput = performance.now(); }, true);
  const pulsed = new WeakMap();
  function watchTags() {
    $$(".v2-world .v2-tags").forEach((layer) => {
      if (layer.dataset.v4w) return;
      layer.dataset.v4w = "1";
      new MutationObserver((ms) => {
        if (performance.now() - lastInput > 450) return;
        ms.forEach((m) => {
          const t = (m.target.nodeType === 1 ? m.target : m.target.parentNode).closest(".v2-tag");
          if (!t || (pulsed.get(t) || 0) > performance.now() - 900) return;
          pulsed.set(t, performance.now());
          t.classList.remove("v4-tagpulse"); void t.offsetWidth; t.classList.add("v4-tagpulse");
        });
      }).observe(layer, { subtree: true, characterData: true, childList: true });
    });
  }

  /* ---------------- 6. mesures ↔ scène : survoler un indicateur éclaire l'étiquette 3D de la même grandeur ---------------- */
  const SUBS = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
  const GREEK = [
    [/\\bar\{\\sigma\}|σ̄/g, "sbar"],
    [/\\varphi|\\phi|φ|ϕ/g, "phi"],
    [/\\Delta|Δ|δ/g, "delta"],
    [/\\sigma|σ/g, "sigma"],
    [/\\lambda|λ/g, "lambda"],
    [/\\Psi|\\psi|Ψ|ψ/g, "psi"],
    [/\\eta|η/g, "eta"],
    [/\\rho|ρ/g, "rho"],
  ];
  const norm = (x) => {
    let s = String(x || "");
    GREEK.forEach(([re, r]) => { s = s.replace(re, r); });
    return s.replace(/[₀-₉]/g, (c) => SUBS[c]).replace(/mathrm|text|overline|bar/g, "").replace(/[\s_{}\\]/g, "").toLowerCase();
  };
  const kSym = (k) => {
    const tex = $(".tex[data-tex]", k);
    if (tex && tex.dataset.tex) return norm(tex.dataset.tex.split(/[=(]/)[0] || "");
    const c = k.cloneNode(true);
    $$(".katex-mathml", c).forEach((m) => m.remove());
    return norm((c.textContent.split(/[=(]/)[0] || ""));
  };
  const tSym = (t) => norm(((t.firstElementChild || t).textContent || "").split(/[\s=:]/)[0]);
  function linkFor(kpi) {
    const sec = kpi.closest(".atelier");
    const k = $(".k", kpi);
    if (!sec || !k) return [];
    const s = kSym(k);
    if (!s || s.length > 12) return [];
    return $$(".v2-world .v2-tag", sec).filter((t) => { const ts = tSym(t); return ts && (ts === s || (s.length >= 2 && ts.startsWith(s)) || (ts.length >= 2 && s.startsWith(ts))); });
  }
  doc.addEventListener("mouseover", (e) => {
    const kpi = e.target.closest && e.target.closest(".v2-stats .kpi");
    if (!kpi || kpi.dataset.v4l) return;
    kpi.dataset.v4l = "1";
    const on = (b) => { const ts = linkFor(kpi); kpi.classList.toggle("v4-link", b && ts.length > 0); ts.forEach((t) => t.classList.toggle("v4-link", b)); };
    if (linkFor(kpi).length) { kpi.classList.add("v4-linkable"); kpi.title = "Survolez : la grandeur s’éclaire dans la scène 3D"; }
    kpi.addEventListener("mouseenter", () => on(true));
    kpi.addEventListener("mouseleave", () => on(false));
    on(true);
  });

  /* ---------------- 6b. P1 · Fiche visuelle & capsule vidéo du cours intégrées aux ateliers ---------------- */
  const MEDIA = window.LABV4_MEDIA || {};
  function renderYtFallbackCard(host, s, ytWatch) {
    const safeT = (s.title || "").replace(/"/g, "&quot;");
    const thumb = s.video ? `https://i.ytimg.com/vi/${encodeURIComponent(s.video)}/hqdefault.jpg` : s.img;
    host.innerHTML = `<a class="v4-md-ytcard" href="${ytWatch}" target="_blank" rel="noopener">
      <img class="v4-md-ytbg" src="${thumb}" alt="${safeT}">
      <div class="v4-md-ytshade">
        <span class="v4-md-ytplay" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>
        <b>Lancer la capsule vidéo commentée sur YouTube ↗</b>
        <small>Ouverture locale hors serveur web : cliquez pour ouvrir directement la vidéo sans erreur de lecteur intégré.</small>
      </div>
    </a>`;
    const bg = $(".v4-md-ytbg", host);
    if (bg && s.img) bg.addEventListener("error", () => { if (bg.src !== s.img) bg.src = s.img; }, { once: true });
  }
  function openMediaModal(id, startTab) {
    const m = MEDIA[id];
    if (!m) return;
    $$(".v4-media-ov").forEach((x) => x.remove());
    const sheets = [{ img: m.img, title: m.title, video: m.video, mp4: m.mp4 || "" }].concat(m.extra || []);
    let cur = 0;
    let mode = startTab === "video" && sheets[0].video ? "video" : "img";
    const ov = el("div", "v3s-fin v4-media-ov");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    const card = el("div", "v3s-fin-card v4-media-card");
    ov.append(card);
    const close = () => { ov.remove(); doc.removeEventListener("keydown", onK); };
    const onK = (e) => { if (e.key === "Escape") close(); };
    doc.addEventListener("keydown", onK);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    const isHttp = location.protocol === "http:" || location.protocol === "https:";
    const draw = () => {
      const s = sheets[cur];
      const hasVid = !!(s.video || s.mp4);
      if (mode === "video" && !hasVid) mode = "img";
      const safeT = (s.title || "").replace(/"/g, "&quot;");
      const ytWatch = s.video ? `https://www.youtube.com/watch?v=${encodeURIComponent(s.video)}` : "";
      const ytEmbed = s.video
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(s.video)}?rel=0${isHttp ? "&origin=" + encodeURIComponent(location.origin) : ""}`
        : "";
      card.innerHTML = `<div class="v4-md-top">
          <div><p class="v3-kicker"><span>${m.label || "Ressource associée"}</span> · <span>Atelier</span></p><h3>${s.title}</h3></div>
          <button type="button" class="v3s-fin-x v4-md-close" aria-label="Fermer">×</button>
        </div>
        <div class="v4-md-bar">
          <div class="v4-md-tabs">
            <button type="button" class="v3-chip" data-m="img" aria-pressed="${mode === "img"}">Fiche infographique</button>
            ${hasVid ? `<button type="button" class="v3-chip" data-m="video" aria-pressed="${mode === "video"}">Capsule vidéo commentée</button>` : ""}
          </div>
          ${sheets.length > 1 ? `<div class="v4-md-sheets">${sheets.map((x, idx) => `<button type="button" class="v3-chip" data-s="${idx}" aria-pressed="${idx === cur}">Fiche ${idx + 1}/${sheets.length}</button>`).join("")}</div>` : ""}
        </div>
        <div class="v4-md-stage">${mode === "video" && hasVid
          ? (isHttp && ytEmbed
              ? `<div class="v4-md-vid"><iframe src="${ytEmbed}" title="${safeT}" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
              : `<div class="v4-md-vid" data-v4-localvid></div>`)
          : `<div class="v4-md-img" title="Cliquer pour zoomer / dézoomer"><img src="${s.img}" alt="${safeT}"></div>`}</div>
        <div class="v4-md-foot">
          <span class="v3-meta">${mode === "img" ? "Astuce : cliquez sur l’infographie pour zoomer à 175 % et lire les schémas de détail." : (isHttp ? "Capsule vidéo commentée du cours (lecteur sans traceur)." : "Capsule vidéo commentée du cours.")}</span>
          <div class="v4-md-links">
            ${mode === "video" && ytWatch ? `<a class="v3-link" href="${ytWatch}" target="_blank" rel="noopener">Regarder sur YouTube ↗</a>` : ""}
            <a class="v3-link" href="${s.img}" target="_blank" rel="noopener">Ouvrir l’image en plein onglet ↗</a>
          </div>
        </div>`;
      $(".v4-md-close", card).addEventListener("click", close);
      $$("[data-m]", card).forEach((b) => b.addEventListener("click", () => { mode = b.dataset.m; draw(); }));
      $$("[data-s]", card).forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.s; draw(); }));
      const imWrap = $(".v4-md-img", card);
      if (imWrap) imWrap.addEventListener("click", () => imWrap.classList.toggle("zoomed"));
      const locHost = $("[data-v4-localvid]", card);
      if (locHost) {
        if (s.mp4) {
          const vidEl = doc.createElement("video");
          vidEl.controls = true;
          vidEl.autoplay = true;
          vidEl.playsInline = true;
          vidEl.preload = "metadata";
          if (s.img) vidEl.poster = s.img;
          vidEl.addEventListener("error", () => {
            if (ytWatch) renderYtFallbackCard(locHost, s, ytWatch);
          }, { once: true });
          vidEl.src = s.mp4;
          locHost.append(vidEl);
        } else if (ytWatch) {
          renderYtFallbackCard(locHost, s, ytWatch);
        }
      }
    };
    draw();
    doc.body.append(ov);
  }
  window.LABV4_OPEN_MEDIA = openMediaModal;
  function mountMediaButtons() {
    Object.keys(MEDIA).forEach((id) => {
      const sec = doc.getElementById("atelier-" + id);
      if (!sec) return;
      const m = MEDIA[id];
      const ctx = $(".v4-ctx", sec);
      if (ctx && !$(".v4-md-trig", ctx)) {
        const row = el("div", "v4-md-row");
        const b1 = el("button", "v3-btn ghost v4-md-trig", `Fiche visuelle${m.video ? " & vidéo" : ""} du cours`);
        b1.type = "button";
        b1.addEventListener("click", (e) => { e.preventDefault(); openMediaModal(id, "img"); });
        row.append(b1);
        if (m.video) {
          const b2 = el("button", "v3-link v4-md-vidlink", "Regarder la capsule (2 min)");
          b2.type = "button";
          b2.addEventListener("click", (e) => { e.preventDefault(); openMediaModal(id, "video"); });
          row.append(b2);
        }
        ctx.append(row);
      }
      const nb = $(".v2-nbhead", sec);
      if (nb && !$(".v4-md-nbbtn", nb)) {
        const bn = el("button", "v3-btn ghost v4-md-nbbtn", `Revoir l’infographie${m.video ? " / vidéo" : ""}`);
        bn.type = "button";
        bn.addEventListener("click", () => openMediaModal(id, "img"));
        nb.append(bn);
      }
    });
  }

  /* ---------------- 6c. P8 · Micro-jauges de seuils métiers dans les tuiles de mesures ---------------- */
  const GAUGE_RULES = [
    // Vitesse hydraulique réseau (m/s) : confort acoustique & auto-curage [0.5 ; 1.5] m/s, max 2.0
    { test: (k, u) => /m\/s/.test(u) && (/vitesse|\bv\b/i.test(k)) && !/gaine|air|vent|souffl/i.test(k), min: 0, max: 3.0, tick: 1.5, eval: (v) => v < 0.4 ? ["warn", "!", "< 0,5 m/s"] : v <= 1.5 ? ["ok", "✓", "0,5-1,5 m/s"] : v <= 2.0 ? ["warn", "!", "1,5-2,0 m/s"] : ["bad", "✗", "> 2,0 m/s (bruit)"] },
    // Vitesse d'air en gaine aéraulique (m/s) : <= 4 m/s confort, > 5 m/s sifflement
    { test: (k, u) => /m\/s/.test(u) && /gaine|air|souffl|aéra|vent/i.test(k), min: 0, max: 8.0, tick: 4.5, eval: (v) => v <= 4.0 ? ["ok", "✓", "≤ 4 m/s"] : v <= 5.5 ? ["warn", "!", "limite acoust."] : ["bad", "✗", "> 5,5 m/s"] },
    // Pression de service au robinet / plateau (bar)
    { test: (k, u) => /\bbar\b/.test(u) && /pression|service|plateau|\bp_/i.test(k), min: 0, max: 6.0, tick: 1.5, eval: (v) => v < 1.0 ? ["bad", "✗", "< 1 bar"] : v < 1.5 ? ["warn", "!", "limite"] : v <= 4.5 ? ["ok", "✓", "confort 1,5-4 bar"] : ["warn", "!", "> 4,5 bar (réducteur)"] },
    // Facteur de température superficielle f_Rsi : >= 0.70 anti-moisissures
    { test: (k) => /f_.*rsi|\bfrsi\b|facteur.*temp/i.test(k), min: 0.4, max: 1.0, tick: 0.70, eval: (v) => v >= 0.75 ? ["ok", "✓", "sain ≥ 0,75"] : v >= 0.70 ? ["warn", "!", "seuil 0,70"] : ["bad", "✗", "< 0,70 moisissures"] },
    // Coefficient de transmission thermique U d'une paroi W/(m²·K)
    { test: (k, u) => /w\s*\/\s*\(?m[²2]/i.test(u) && (/\bu\b|\bu_|\bu\{|transmission/i.test(k)) && !/flux|densité|phi/i.test(k), min: 0, max: 2.5, tick: 0.36, eval: (v) => v <= 0.30 ? ["ok", "✓", "isolé RE2020"] : v <= 0.65 ? ["warn", "!", "correct réno"] : ["bad", "✗", "paroi déperditive"] },
    // Part des ponts thermiques (%)
    { test: (k, u) => /%/.test(u) && /part.*pont/i.test(k), min: 0, max: 60, tick: 15, eval: (v) => v <= 15 ? ["ok", "✓", "maîtrisé ≤ 15 %"] : v <= 30 ? ["warn", "!", "significatif"] : ["bad", "✗", "> 30 % déperd."] },
    // Énergie primaire Cep DPE (kWh/m².an)
    { test: (k, u) => /kwh/i.test(u) && /c_.*ep|\bcep\b|primaire|dpe|besoin/i.test(k), min: 0, max: 420, tick: 110, eval: (v) => v <= 110 ? ["ok", "✓", "classe A-B"] : v <= 250 ? ["warn", "!", "classe C-D"] : ["bad", "✗", "passoire E-G"] },
    // Temps de réverbération acoustique Tr / Sabine (s) : cible salle [0.4 ; 0.8] s
    { test: (k, u) => /\bs\b/.test(u) && (/\bt_?r\b|réverb|sabine/i.test(k)), min: 0, max: 2.2, tick: 0.8, eval: (v) => v >= 0.4 && v <= 0.85 ? ["ok", "✓", "cible 0,4-0,8 s"] : v <= 1.2 ? ["warn", "!", "un peu réverb."] : ["bad", "✗", "brouhaha > 1,2 s"] },
    // Déphasage thermique d'été (h) : confort >= 8 h
    { test: (k, u) => /\bh\b/.test(u) && (/déphasage|\\varphi|\\Delta\s*t/i.test(k)), min: 0, max: 16, tick: 8, eval: (v) => v >= 9 ? ["ok", "✓", "≥ 9 h (nuit)"] : v >= 6 ? ["warn", "!", "6-9 h moyen"] : ["bad", "✗", "< 6 h (surchauffe)"] },
    // Niveau sonore reçu / perçu (dB)
    { test: (k, u) => /db/i.test(u) && (/niveau|bruit|perçu|reçu|intérieur|l_.*re/i.test(k)), min: 20, max: 85, tick: 40, eval: (v) => v <= 38 ? ["ok", "✓", "calme ≤ 38 dB"] : v <= 50 ? ["warn", "!", "gênant"] : ["bad", "✗", "fort > 50 dB"] },
    // Incertitude relative u(y)/y (%) en métrologie R1-13
    { test: (k, u) => /%/.test(u) && (/incertitude\s+rel|u_?\{?r|\bu\s*\(.*\)\s*\//i.test(k)), min: 0, max: 15, tick: 5, eval: (v) => v <= 2.5 ? ["ok", "✓", "précis ≤ 2,5 %"] : v <= 6 ? ["warn", "!", "modéré"] : ["bad", "✗", "> 6 % imprécis"] },
  ];
  let inGauge = false;
  function updateKpiGauges(rootSec) {
    if (inGauge) return;
    inGauge = true;
    try {
      const scope = rootSec || doc;
      $$(".v2-stats", scope).forEach((stats) => {
        const masked = stats.classList.contains("v3-masked");
        $$(".kpi:not(.v2-why)", stats).forEach((kpi) => {
          let g = $(".v4-gauge", kpi);
          if (masked) { if (g && !g.hidden) g.hidden = true; return; }
          const kEl = $(".k", kpi), vEl = $(".v", kpi);
          if (!kEl || !vEl) return;
          const tex = [
            ...$$(".tex[data-tex]", kEl).map((t) => t.dataset.tex || ""),
            ...$$("annotation", kEl).map((a) => a.textContent || ""),
          ].join(" ");
          const kClone = kEl.cloneNode(true);
          $$(".katex-mathml", kClone).forEach((x) => x.remove());
          const kTxt = (tex + " " + (kClone.textContent || "")).replace(/\s+/g, " ").trim();
          const vTxt = vEl.textContent || "";
          const m = vTxt.replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
          if (!m) return;
          const val = +m[0];
          const unit = vTxt.replace(/\s/g, "").replace(",", ".").replace(m[0], "") + " " + vTxt + " " + kTxt;
          const rule = GAUGE_RULES.find((r) => r.test(kTxt, unit));
          if (!rule) return;
          const [state, sym, note] = rule.eval(val);
          const pct = Math.max(2, Math.min(98, ((val - rule.min) / (rule.max - rule.min)) * 100));
          const tickPct = Math.max(4, Math.min(96, ((rule.tick - rule.min) / (rule.max - rule.min)) * 100));
          const sig = `${state}|${pct.toFixed(1)}|${tickPct.toFixed(1)}|${note}`;
          if (g && g.dataset.sig === sig && !g.hidden) return;
          if (!g) { g = el("div", "v4-gauge"); kpi.append(g); }
          g.hidden = false;
          g.dataset.sig = sig;
          g.className = `v4-gauge st-${state}`;
          g.innerHTML = `<div class="v4-g-bar"><i style="width:${pct.toFixed(1)}%"></i><span class="v4-g-tick" style="left:${tickPct.toFixed(1)}%" title="Repère métier"></span></div><span class="v4-g-lbl"><b>${sym}</b> ${note}</span>`;
        });
      });
    } finally {
      inGauge = false;
    }
  }
  function bindGaugeUnmask() {
    $$(".v2-stats").forEach((stats) => {
      if (stats.dataset.v4gm) return;
      stats.dataset.v4gm = "1";
      new MutationObserver(() => updateKpiGauges(stats.closest(".atelier") || doc))
        .observe(stats, { attributes: true, attributeFilter: ["class"] });
    });
  }
  doc.addEventListener("labv2:update", (e) => {
    const id = e.detail && e.detail.id;
    updateKpiGauges(id ? doc.getElementById("atelier-" + id) : doc);
  });

  /* ---------------- 7. téléphone : commandes en tiroir ---------------- */
  const narrow = () => matchMedia("(max-width: 900px)").matches;
  function drawers() {
    $$(".v4-split .controls-card").forEach((c) => {
      if (c.dataset.v4d) return;
      c.dataset.v4d = "1";
      const hd = $(".hd", c);
      if (!hd) return;
      hd.insertAdjacentHTML("beforeend", '<span class="v4-drawer-hint">toucher pour ouvrir / fermer</span>');
      hd.addEventListener("click", (e) => { if (!narrow() || e.target.closest("button")) return; c.classList.toggle("v4-open"); });
    });
  }
  doc.addEventListener("click", (e) => {
    if (!narrow() || !e.target.closest) return;
    if (e.target.closest(".v3-gotochip, .v3-link")) { const c = $(".atelier.active .controls-card"); if (c) c.classList.add("v4-open"); }
  });

  /* ---------------- 8. accessibilité : les retours du parcours sont annoncés ---------------- */
  function live(n) { $$(".v3-result, .v3s-hint, .v3-progress", n).forEach((x) => { if (!x.hasAttribute("aria-live")) x.setAttribute("aria-live", "polite"); }); }
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) live(n.parentNode || n); }))).observe(doc.body, { childList: true, subtree: true });

  /* ---------------- 9. menu « Plus » : toujours entièrement visible dans la scène ---------------- */
  function fitMenu(wrap) {
    const m = $(".v4-menu", wrap), w = wrap.closest(".v2-world");
    if (!m || !w) return;
    Object.assign(m.style, { left: "", right: "", top: "", bottom: "" });
    const mr = m.getBoundingClientRect(), wr = w.getBoundingClientRect(), br = wrap.getBoundingClientRect();
    // trop à gauche : on aligne le menu sur le bord gauche du bouton (il s'ouvre vers la droite)
    if (mr.left < wr.left + 6) { m.style.right = "auto"; m.style.left = Math.max(wr.left + 6 - br.left, -br.left + wr.left + 6) + "px"; }
    const mr2 = m.getBoundingClientRect();
    if (mr2.right > wr.right - 6) { m.style.left = "auto"; m.style.right = "0"; }
    // trop haut : il s'ouvre vers le bas
    if (mr2.top < wr.top + 6) { m.style.bottom = "auto"; m.style.top = "calc(100% + 8px)"; }
  }
  doc.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".v4-more > .v2-chipbtn");
    if (b) setTimeout(() => fitMenu(b.parentNode), 0);
  });

  /* ---------------- 10. menu de gauche : légende de l'anneau et de l'étoile ; libellés de l'accueil ---------------- */
  function legend() {
    const wrap = $(".v4-atwrap") || $("nav.ateliers");
    if (!wrap || $(".v4-navlegend")) return;
    const lg = el("div", "v4-navlegend", `<p><span class="v4-lg-ring"></span>Anneau orange : étapes du parcours faites</p>
      <p><span class="v4-lg-ring ok"></span>Anneau vert : parcours terminé</p>
      <p><span class="v4-lg-star"></span>Point doré : étoile obtenue</p>`);
    lg.title = "Étoile : obtenue en trouvant l’explication (étape 3) ou en réussissant toutes les questions flash du carnet";
    wrap.after(lg);
    // accueil : « Explorés » = ateliers ouverts et manipulés ; « Étoiles » = explication trouvée ou questions flash réussies
    const stats = $(".v2-home-stats");
    if (stats) {
      $$("div", stats).forEach((d) => {
        const i = $("i", d);
        if (!i) return;
        if (/Explorés/.test(i.textContent)) { i.textContent = "Commencés"; d.title = "Ateliers ouverts et manipulés au moins une fois"; }
        if (/Étoiles/.test(i.textContent)) d.title = "Une étoile par atelier : explication trouvée à l’étape 3, ou toutes les questions flash du carnet réussies";
        if (/Rang/.test(i.textContent)) d.title = "Votre rang monte avec le nombre d’étoiles";
      });
    }
  }

  function init() {
    avatar();
    legend();
    home();
    mountMediaButtons();
    bindGaugeUnmask();
    updateKpiGauges(doc);
    watchTags();
    drawers();
    live(doc.body);
    $$(".v2-world").forEach((w) => { if ($('[data-tool="tags"]', w)) setLvl(w, w.classList.contains("v2-notags") ? "none" : "all"); new MutationObserver(() => markSec(w)).observe($(".v2-tags", w) || w, { childList: true, subtree: true, characterData: true }); });
    // visite guidée : à la première ouverture d'un atelier
    doc.addEventListener("labv2:atelier", () => setTimeout(() => { tour(); mountMediaButtons(); bindGaugeUnmask(); updateKpiGauges(doc); }, 700));
    setTimeout(() => tour(), 900);
    window.LABV4_TOUR = () => tour(true);
  }
  const go = () => setTimeout(init, 200);
  if (doc.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
})();
