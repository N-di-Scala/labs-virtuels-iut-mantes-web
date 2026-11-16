/* =====================================================================
   Labs virtuels IUT Mantes - couche pédagogique v3 « parcours »
   Par atelier : 1 Prédire · 2 Observer · 3 Mesurer et expliquer ·
   4 Aller plus loin · 5 Diagnostic, + comparateur A/B et badges.
   Contenus : window.LABV3_PARCOURS (un fichier par lab).
   S'exécute après la v1 et l'interface v2 (window.LABV2).
   Tuteur socratique scripté (contenus : <lab>/socratique.js) : raisonnement demandé après la
   prédiction, échange de questions avant l'explication, question en retour et indices gradués
   à l'étape 3, reformulation libre, questions d'orientation au diagnostic.
   Fin d'atelier : écran « atelier terminé », accès à l'atelier suivant et carnet de l'atelier
   (défi express, à retenir, prolongements, coin du maître d'œuvre), verrouillé jusque-là.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  const V2 = window.LABV2;
  if (!PC || !V2) return;
  const doc = document;
  const root = doc.documentElement;
  root.classList.add("v3");
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const fmt = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const STEPS = [
    { k: "predire", t: "Prédire", sub: "Avant de toucher" },
    { k: "observer", t: "Observer", sub: "Sans les chiffres" },
    { k: "mesurer", t: "Mesurer", sub: "Chiffres et formule" },
    { k: "plus", t: "Aller plus loin", sub: "Le piège" },
    { k: "diag", t: "Diagnostic", sub: "Trouver l’erreur" },
  ];

  /* ---------------- compléments pédagogiques (complements.js de chaque lab) ---------------- */
  (window.LABV3_COMPLEMENTS || []).forEach(({ C, PROG }) => {
    if (PROG) PC.programme = PROG;
    Object.entries(C || {}).forEach(([id, x]) => {
      const at = PC.ateliers[id];
      if (!at) return;
      const m = at.measure;
      if (m && m.opts) {
        const wrong = m.opts.filter((o) => !o.ok);
        (x.m || []).forEach((t, i) => { if (wrong[i]) wrong[i].t = t; });
        const good = m.opts.find((o) => o.ok);
        if (good && x.okT) good.t = x.okT;
        if (x.crit && m.reformule) m.reformule.crit = x.crit;
      }
      if (x.variante) at.predict.variante = x.variante;
      if (x.transfert) at.transfert = x.transfert;
      if (x.duree) at.duree = x.duree;
      if (x.demo && at.plus) at.plus.demo = x.demo;
      if (x.fix && at.diag) at.diag.fix = x.fix;
      if (x.variants && at.diag) at.diag.variants = x.variants;
    });
  });

  /* ---------------- notation : indices écrits « S_d » rendus en vrais indices (S<sub>d</sub>) ---------------- */
  const SUBRE = /([A-Za-zλφσΦθρμνηΔ])_\{?([A-Za-zé0-9]+)\}?/g;
  function subify(rootEl) {
    if (!rootEl) return;
    const w = doc.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && n.parentNode.closest && n.parentNode.closest("textarea, script, style, .katex, input") ? NodeFilter.FILTER_REJECT : /[A-Za-zλφσΦθρμνηΔ]_[A-Za-z0-9{]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
    });
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach((n) => {
      const span = doc.createElement("span");
      span.innerHTML = n.nodeValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(SUBRE, "$1<sub>$2</sub>");
      n.replaceWith(...span.childNodes);
    });
  }
  const subObs = new MutationObserver((ms) => { const seen = new Set(); ms.forEach((m) => { const t = m.target.nodeType === 1 ? m.target : m.target.parentNode; if (t && !seen.has(t)) { seen.add(t); subify(t); } }); });
  const watchSub = (n) => { if (n) { subify(n); subObs.observe(n, { childList: true, subtree: true, characterData: true }); } };

  /* ---------------- tuteur : un même personnage dans tous les labs (avatar 3D rendu par interface.js) ---------------- */
  const TUTOR = "Camille";
  const AV = '<span class="v4-av" aria-hidden="true"></span>';

  /* ---------------- mémoire ---------------- */
  const KEY = PC.storeKey || "labv3";
  let store = { at: {}, badges: {}, free: false, nPredOk: 0, nDiag: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) store = Object.assign(store, s); } catch (_) { /* ignore */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) { /* ignore */ } if (typeof drawBilan === "function") drawBilan(); if (typeof drawRings === "function") drawRings(); };
  // ordre d'affichage des choix : mélangé, mais stable pour un même lab et une même question
  const mix = (arr, seed) => {
    let h = 2166136261;
    const str = (PC.storeKey || "") + "|" + seed;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
    const o = arr.map((x, i) => [x, i]);
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    return o;
  };
  // énoncé de la prédiction : variante aux passages pairs (après une remise à zéro de l'atelier)
  const qOf = (id) => { const p = PC.ateliers[id].predict; return p.variante && ((store.pass || {})[id] || 0) % 2 === 1 ? p.variante : p.q; };
  const bumpPass = (id) => { store.pass = store.pass || {}; store.pass[id] = (store.pass[id] || 0) + 1; };
  const A = (id) => (store.at[id] = store.at[id] || { step: 0, max: 0 });
  const mem = {}; // mémoire de séance par atelier (états visités)

  /* ---------------- lecture / écriture des commandes ---------------- */
  const inp = (id) => doc.getElementById(id);
  const v = (id) => { const e = inp(id); return e ? +e.value : NaN; };
  const s = (id) => { const e = inp(id); return e ? e.value : ""; };
  function setVal(id, val) {
    const e = inp(id);
    if (!e) return;
    e.value = val;
    e.dispatchEvent(new Event("input", { bubbles: true }));
    e.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const ctxFor = (id) => {
    const cfg = PC.ateliers[id];
    const m = (mem[id] = mem[id] || {});
    const out = cfg && cfg.compute ? cfg.compute(v, s) : {};
    return { v, s, out, mem: m, flags: flags(id), st: A(id), store };
  };
  function flags(id) {
    const i = window.LAB3D && window.LAB3D.inst && window.LAB3D.inst[id];
    return (i && i.actState) || {};
  }

  /* ---------------- chiffres peints dans les schémas 2D : masqués à l'étape « Observer » ---------------- */
  const CP = CanvasRenderingContext2D.prototype;
  const fillText0 = CP.fillText;
  const NUM = /[-−]?\d[\d\u00a0\u202f ]*(?:[.,]\d+)?(?:e[-−]?\d+)?/gi;
  CP.fillText = function (t, x, y, mw) {
    const cv = this.canvas;
    // graduations des axes (nombre seul, ou entier suivi d'une unité courte) : toujours lisibles ;
    // valeurs calculées (décimales avec unité, égalités, phrases) : masquées jusqu'à l'étape 3
    const tick = /^\s*(?:1e[-−]?\d+|[-−]?\d[\d\u00a0\u202f ]*(?:[.,]\d+)?|[-−]?\d[\d\u00a0\u202f ]*\s?(?:°C|K|h|j|s|m|mm|cm|ans?|k€|€|Pa|bar|%|dB|Hz))\s*$/i;
    if (cv && cv.closest && cv.closest(".v3-qual-fig") && !tick.test(String(t))) t = String(t).replace(NUM, "…");
    return mw === undefined ? fillText0.call(this, t, x, y) : fillText0.call(this, t, x, y, mw);
  };
  // étiquettes 3D dont le libellé contient un nombre : masquées elles aussi à l'étape « Observer »
  const markTags = (layer) => $$(".v2-tag", layer).forEach((t) => t.classList.toggle("v3-numtag", /\d/.test((t.firstChild || {}).textContent || "")));
  $$(".v2-world .v2-tags").forEach((layer) => {
    new MutationObserver(() => markTags(layer)).observe(layer, { childList: true, subtree: true, characterData: true });
    markTags(layer);
  });
  const redraw = (id) => { if (window.LABV3_REDRAW) { try { window.LABV3_REDRAW(id); } catch (_) { /* ignore */ } } };

  /* ---------------- sons (respecte le réglage « sons d'interface ») ---------------- */
  const soundOn = () => { try { return localStorage.getItem("labv2_sound") === "1"; } catch (_) { return false; } };
  const chime = (good = true) => {
    if (!soundOn() || !V2.audio) return;
    if (good) { V2.audio.blip(660, 0.09, 0.04); V2.audio.blip(990, 0.12, 0.035, "sine", 0.08); }
    else V2.audio.blip(200, 0.15, 0.045, "triangle");
  };

  /* ---------------- panneau de parcours (au-dessus des commandes) ---------------- */
  const panels = {};
  function guided(id) { return !store.free && A(id).done !== true; }

  function buildPanel(id) {
    const stg = V2.stages[id];
    if (!stg || !stg.right) return;
    const p = el("div", "card v3-panel");
    const dur = PC.ateliers[id].duree;
    p.innerHTML = `<div class="v3-hd"><span>Parcours de l’atelier</span><span class="v3-free-hint"></span>${dur ? `<span class="v3-dur" title="Durée estimée du parcours complet">≈ ${dur} min</span>` : ""}</div>
      <ol class="v3-steps">${STEPS.map((x, i) => `<li><button type="button" data-i="${i}"><b>${i + 1}</b><span>${x.t}</span></button></li>`).join("")}</ol>
      <div class="v3-body"></div>`;
    stg.right.prepend(p);
    // voile sur les commandes (étape 1) et masque des mesures (étapes 1-2)
    const ctl = $(".controls-card", stg.right);
    const veil = el("div", "v3-veil", `<div><b>Prédiction d’abord</b><span>Les commandes se déverrouillent dès que vous avez fait votre pari.</span></div>`);
    if (ctl) { ctl.classList.add("v3-ctl"); ctl.append(veil); }
    const stats = $(".v2-stats", stg.left);
    if (stats) stats.append(el("div", "v3-mask-note", `<b>Mesures masquées</b><span>Observez d’abord : les chiffres et les formules arrivent à l’étape 3.</span>`));
    $$(".v3-steps button", p).forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      if (i <= A(id).max || !guided(id)) go(id, i);
    }));
    panels[id] = { p, body: $(".v3-body", p), ctl, stats, stg };
    watchSub(p);
    render(id);
  }

  function go(id, i) {
    const a = A(id);
    a.step = i;
    a.max = Math.max(a.max, i);
    save();
    render(id);
  }

  function applyLocks(id) {
    const P = panels[id];
    if (!P) return;
    const a = A(id);
    const g = guided(id);
    const lockCtl = g && a.step === 0;
    const mask = g && a.step <= 1;
    if (P.ctl) P.ctl.classList.toggle("v3-locked", lockCtl);
    if (P.stats) P.stats.classList.toggle("v3-masked", mask);
    if (P.stg.world) P.stg.world.classList.toggle("v3-qual", mask);
    if (P.stg.figs) {
      const was = P.stg.figs.classList.contains("v3-qual-fig");
      P.stg.figs.classList.toggle("v3-qual-fig", mask);
      if (was !== mask) redraw(id);
    }
  }

  function render(id) {
    const P = panels[id];
    const cfg = PC.ateliers[id];
    if (!P || !cfg) return;
    const a = A(id);
    $$(".v3-steps li", P.p).forEach((li, i) => {
      li.classList.toggle("on", i === a.step);
      li.classList.toggle("done", i < a.max || (a.done && i <= a.max));
      li.classList.toggle("lock", guided(id) && i > a.max);
    });
    $(".v3-free-hint", P.p).textContent = store.free ? "exploration libre" : a.done ? "parcours terminé" : "";
    const st = STEPS[a.step].k;
    const body = P.body;
    body.innerHTML = "";
    if (finished(id)) body.append(endCard(id));
    else if (store.free) {
      const cb = el("button", "v3-btn ghost v3s-free-nb", "Ouvrir le carnet de l’atelier");
      cb.type = "button";
      cb.addEventListener("click", () => openCarnet(id));
      body.append(cb);
    } else { const rp = rappel(id); if (rp) body.append(rp); }
    if (st === "predire") renderPredict(id, cfg, body);
    else if (st === "observer") renderObserve(id, cfg, body);
    else if (st === "mesurer") renderMeasure(id, cfg, body);
    else if (st === "plus") renderPlus(id, cfg, body);
    else renderDiag(id, cfg, body);
    applyLocks(id);
    lockNotebook(id);
    if (window.katex) $$(".tex[data-tex]", body).forEach((t) => { try { t.innerHTML = katex.renderToString(t.dataset.tex, { throwOnError: false }); } catch (_) { /* ignore */ } });
    else $$(".tex[data-tex]", body).forEach((t) => { t.innerHTML = window.LABV2_TEX ? window.LABV2_TEX(t.dataset.tex) : t.dataset.tex; });
  }

  const nav = (id, prevOk, nextLabel, nextOk = true) => {
    const a = A(id);
    const f = el("div", "v3-nav");
    if (a.step > 0) { const b = el("button", "v3-btn ghost", "← Étape précédente"); b.type = "button"; b.addEventListener("click", () => go(id, a.step - 1)); f.append(b); }
    if (a.step < STEPS.length - 1 && nextLabel) {
      const b = el("button", "v3-btn" + (nextOk ? "" : " ghost"), nextLabel);
      b.type = "button";
      b.addEventListener("click", () => go(id, a.step + 1));
      f.append(b);
    }
    return f;
  };

  /* ---------------- fin d'atelier : atelier suivant et carnet ---------------- */
  // le parcours est « terminé » quand le diagnostic est réussi (l'étoile, elle, exige aussi l'explication)
  const finished = (id) => !!(A(id).done || A(id).diagDone);
  const order = () => [...new Set($$(".nav-btn[data-atelier]").map((b) => b.dataset.atelier))].filter((k) => PC.ateliers[k]);
  const title = (id) => { const st = V2.stages[id]; const h = st && st.left && $(".v2-brand h2", st.left); return h ? h.textContent.trim() : id; };
  function nextOf(id) {
    const o = order();
    const i = o.indexOf(id);
    const rest = o.slice(i + 1).concat(o.slice(0, i));
    return rest.find((k) => !finished(k)) || null;
  }
  const nextLabel = (n) => (n ? `Atelier suivant : ${title(n)} →` : PC.bilanHost ? "Tous les ateliers sont faits : voir mon bilan →" : "Retour à l’accueil →");
  function goAtelier(k) {
    const b = $(`.nav-btn[data-atelier="${k}"]`);
    closeFin();
    closeCarnet();
    if (b) { b.click(); setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60); }
  }
  function nextButtons(id, box, primary = true) {
    const n = nextOf(id);
    const cb = el("button", "v3-btn" + (primary ? "" : " ghost"), "Ouvrir le carnet de l’atelier");
    cb.type = "button";
    cb.addEventListener("click", () => openCarnet(id));
    const nb = el("button", "v3-btn" + (primary ? " ghost" : ""), nextLabel(n));
    nb.type = "button";
    nb.addEventListener("click", () => goAtelier(n || PC.bilanHost || "home"));
    box.append(cb, nb);
  }
  /* ---------------- petite question à choix (transfert, rappel espacé) ----------------
     Q : { q, opts: [{ t, ok, fb }] } ; done(okPremierEssai, index) est appelé au choix.
     Après le choix, la bonne réponse et son explication s'affichent. */
  function qBox(seed, Q, title, done, prev) {
    const box = el("div", "v3s-q");
    box.append(el("p", "v3s-q-hd", title));
    box.append(el("p", "v3-q", Q.q));
    const opts = el("div", "v3-opts");
    const fb = el("div", "v3-result");
    fb.setAttribute("aria-live", "polite");
    const reveal = (pick) => {
      $$(".v3-opt", opts).forEach((b) => { b.disabled = true; const o = Q.opts[+b.dataset.i]; if (o.ok) b.classList.add("good"); else if (+b.dataset.i === pick) b.classList.add("bad"); });
      const o = Q.opts[pick], g = Q.opts.find((x) => x.ok);
      fb.className = "v3-result " + (o.ok ? "good" : "surprise");
      fb.innerHTML = o.ok ? `<b>Oui.</b><span>${o.fb || ""}</span>` : `<b>Pas tout à fait.</b><span>${o.fb || ""} La bonne réponse : « ${g.t} ». ${g.fb || ""}</span>`;
    };
    mix(Q.opts, seed).forEach(([o, i], n) => {
      const b = el("button", "v3-opt", `<i>${String.fromCharCode(65 + n)}</i><span>${o.t}</span>`);
      b.type = "button";
      b.dataset.i = i;
      b.addEventListener("click", () => { reveal(i); chime(!!o.ok); done(!!o.ok, i); });
      opts.append(b);
    });
    box.append(opts, fb);
    if (prev != null) reveal(prev);
    return box;
  }
  function transferBox(id) {
    const at = PC.ateliers[id], a = A(id);
    if (!at.transfert) return null;
    return qBox(id + "|t", at.transfert, "Question de transfert · même idée, autre situation", (ok, i) => { if (a.transPick == null) { a.transPick = i; a.transOk = ok; save(); } }, a.transPick);
  }

  /* ---------------- rappel espacé : à l'ouverture d'un nouvel atelier, une question d'un atelier déjà terminé ---------------- */
  const doneIds = () => Object.keys(PC.ateliers).filter((k) => finished(k));
  const pickPast = (except, salt) => {
    const d = doneIds().filter((k) => k !== except && PC.ateliers[k].measure && PC.ateliers[k].measure.opts);
    if (!d.length) return null;
    let h = 0; const str = except + "|" + salt; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return d[h % d.length];
  };
  function rappel(id) {
    const a = A(id);
    if (a.pred != null || a.rappelDone || store.free) return null;
    const k = pickPast(id, "r");
    if (!k) return null;
    const m = PC.ateliers[k].measure;
    const wrap = el("div", "v3s-rappel");
    wrap.append(qBox(k + "|r", { q: m.q, opts: m.opts }, `${AV}${TUTOR} · petit rappel de l’atelier « ${title(k)} »`, (ok) => { a.rappelDone = true; a.rappelOk = ok; save(); }));
    const skip = el("button", "v3-link", "Passer le rappel");
    skip.type = "button";
    skip.addEventListener("click", () => { a.rappelDone = true; save(); wrap.remove(); });
    wrap.append(skip);
    return wrap;
  }
  /* au retour après plus de deux jours : deux questions de reprise sur des ateliers terminés */
  function reprise() {
    const now = Date.now(), last = store.lastSeen || 0;
    store.lastSeen = now;
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) { /* ignore */ }
    if (!last || now - last < 2 * 864e5 || doneIds().length < 1) return;
    const ks = [...new Set([pickPast("", "a" + now), pickPast("", "b" + now)].filter(Boolean))];
    if (!ks.length) return;
    const ov = el("div", "v3s-fin v3s-reprise");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    const card = el("div", "v3s-fin-card", `<p class="v3-kicker">${AV}${TUTOR} · bon retour !</p><h3>Petite reprise avant de continuer</h3><p class="v3-txt">Quelques jours ont passé : se tester sur ce qu’on a déjà vu est la meilleure façon de le retenir. ${ks.length > 1 ? "Deux questions" : "Une question"}, sans note.</p>`);
    ks.forEach((k) => { const m = PC.ateliers[k].measure; card.append(qBox(k + "|rep", { q: m.q, opts: m.opts }, `Atelier « ${title(k)} »`, () => {})); });
    const close = el("button", "v3-btn", "Continuer");
    close.type = "button";
    close.addEventListener("click", () => ov.remove());
    card.append(close);
    ov.append(card);
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    doc.body.append(ov);
    watchSub(ov);
  }

  function endCard(id) {
    const c = el("div", "v3s-end", `<b>Atelier terminé</b><span>Les cinq étapes sont faites. Le carnet de l’atelier est maintenant disponible : questions flash, points à retenir, prolongements et coin du maître d’œuvre.</span>`);
    const row = el("div", "v3s-end-row");
    nextButtons(id, row, false);
    const tb = transferBox(id);
    if (tb) c.append(tb);
    c.append(row);
    return c;
  }
  // écran de fin d'atelier, affiché une fois, à la réussite du diagnostic
  let finEl = null;
  function closeFin() { if (finEl) { finEl.remove(); finEl = null; } }
  function openFin(id) {
    closeFin();
    if (V2.current() !== id) return;
    const a = A(id);
    const n = nextOf(id);
    finEl = el("div", "v3s-fin");
    finEl.setAttribute("role", "dialog");
    finEl.setAttribute("aria-modal", "true");
    const lines = [
      `Prédiction : ${a.predOk ? "juste" : "détrompée, puis comprise"}`,
      `Explication : ${a.explOk ? "trouvée" : "passée"}`,
      `Diagnostic : réussi${a.diagHelp ? " avec l’aide" : ""}`,
    ];
    finEl.innerHTML = `<div class="v3s-fin-card"><p class="v3-kicker">Atelier terminé</p><h3>${title(id)}</h3>
      <ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <div class="v3s-fin-tr"></div>
      <p class="v3-txt">Avant de passer à la suite, le carnet de l’atelier fait le point : questions flash, ce qu’il faut retenir, prolongements et une question ouverte de maître d’œuvre.</p>
      ${n ? "" : `<p class="v3-note">C’était le dernier atelier à terminer : votre bilan vous attend.</p>`}
      <div class="v3s-end-row"></div>
      <button type="button" class="v3-link v3s-fin-x">Rester sur cet atelier</button></div>`;
    nextButtons(id, $(".v3s-end-row", finEl), true);
    // une question de transfert : vérifier que c'est l'idée, et pas seulement le cas, qui est acquise
    const tb = transferBox(id);
    if (tb) $(".v3s-fin-tr", finEl).append(tb);
    watchSub(finEl);
    $(".v3s-fin-x", finEl).addEventListener("click", closeFin);
    finEl.addEventListener("click", (e) => { if (e.target === finEl) closeFin(); });
    doc.body.append(finEl);
    $(".v3s-end-row .v3-btn", finEl).focus();
  }
  doc.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (carnetEl) closeCarnet(); else closeFin(); } });

  // carnet : verrouillé pendant le parcours guidé, puis ouvert dans l'atelier et en pleine page
  const nbLock = {};
  function lockNotebook(id) {
    const stg = V2.stages[id];
    const nb = stg && stg.sec && $(".v2-notebook", stg.sec);
    if (!nb || nb.closest(".v3s-carnet")) return;
    nb.classList.add("v3s-nb");
    // niveaux : rien (étapes 1-2), « À retenir » seul (dès l'explication validée), tout (fin ou exploration libre)
    const full = store.free || finished(id);
    const partial = !full && !!A(id).explOk;
    const locked = !full && !partial;
    nb.classList.toggle("v3s-nb-locked", locked);
    nb.classList.toggle("v3s-nb-partial", partial);
    let ph = nbLock[id];
    if (!ph) { ph = nbLock[id] = el("div", "v3s-nb-ph"); const h = $(".v2-nbhead", nb); if (h) h.after(ph); else nb.prepend(ph); }
    const a = A(id);
    ph.innerHTML = locked
      ? `<b>Le carnet s’ouvre à la fin du parcours</b><span>Il contient les questions flash, l’essentiel à retenir, les prolongements et le coin du maître d’œuvre. Le lire maintenant donnerait les réponses avant que vous les ayez trouvées. Vous êtes à l’étape ${a.step + 1} sur 5.</span>`
      : `<b>Carnet ouvert</b><span>${store.free && !finished(id) ? "Exploration libre : le carnet est accessible sans terminer le parcours." : "Parcours terminé : relisez l’essentiel et testez-vous avec les questions flash."}</span>`;
    if (!locked) {
      const b = el("button", "v3-btn ghost", "Lire le carnet en pleine page");
      b.type = "button";
      b.addEventListener("click", () => openCarnet(id));
      ph.append(b);
    }
  }
  let carnetEl = null, carnetBack = null;
  function openCarnet(id, onlyRetenir) {
    closeFin();
    closeCarnet();
    const stg = V2.stages[id];
    const nb = stg && stg.sec && $(".v2-notebook", stg.sec);
    if (!nb) return;
    const partial = onlyRetenir || (!store.free && !finished(id));
    carnetEl = el("div", "v3s-carnet" + (partial ? " v3s-carnet-partial" : ""));
    carnetEl.setAttribute("role", "dialog");
    carnetEl.setAttribute("aria-modal", "true");
    carnetEl.setAttribute("aria-label", "Carnet de l’atelier");
    const bar = el("div", "v3s-carnet-bar", `<span>${partial ? "À retenir" : "Carnet de l’atelier"} · ${title(id)}</span>`);
    const row = el("div", "v3s-end-row");
    const x = el("button", "v3-btn ghost", "Revenir à l’atelier");
    x.type = "button";
    x.addEventListener("click", closeCarnet);
    const n = nextOf(id);
    const nb2 = el("button", "v3-btn", nextLabel(n));
    nb2.type = "button";
    nb2.addEventListener("click", () => goAtelier(n || PC.bilanHost || "home"));
    row.append(x);
    if (!partial) row.append(nb2);
    bar.append(row);
    const page = el("div", "v3s-carnet-page");
    // le carnet est déplacé, pas copié : les questions flash gardent leur état
    carnetBack = { nb, parent: nb.parentNode, next: nb.nextSibling };
    nb.classList.remove("v3s-nb-locked");
    if (partial) page.append(el("p", "v3s-partial-note", "Vous avez trouvé l’explication : voici l’essentiel à retenir. Le reste du carnet (questions flash, prolongements, coin du maître d’œuvre) s’ouvrira à la fin du parcours."));
    page.append(nb);
    carnetEl.append(bar, page);
    doc.body.append(carnetEl);
    doc.documentElement.classList.add("v3s-noscroll");
    page.scrollTop = 0;
    x.focus();
  }
  function closeCarnet() {
    if (!carnetEl) return;
    if (carnetBack) carnetBack.parent.insertBefore(carnetBack.nb, carnetBack.next);
    carnetEl.remove();
    carnetEl = null; carnetBack = null;
    doc.documentElement.classList.remove("v3s-noscroll");
  }

  /* --- 1 · Prédire --- */
  function renderPredict(id, cfg, body) {
    const a = A(id);
    const q = cfg.predict;
    body.append(el("p", "v3-kicker", "Étape 1 · Prédire"));
    const qText = qOf(id);
    body.append(el("p", "v3-q", qText));
    const opts = el("div", "v3-opts");
    let pick = a.pred != null ? a.pred : null;
    let conf = a.conf || null;
    mix(q.opts, id + "|p|" + qText).forEach(([o, i], n) => {
      const b = el("button", "v3-opt", `<i>${String.fromCharCode(65 + n)}</i><span>${o.t}</span>`);
      b.type = "button";
      b.dataset.i = i;
      b.setAttribute("aria-pressed", String(pick === i));
      if (a.pred != null) b.disabled = true;
      b.addEventListener("click", () => { pick = i; $$(".v3-opt", opts).forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.i === i))); upd(); });
      opts.append(b);
    });
    body.append(opts);
    const cw = el("div", "v3-conf", `<span>Confiance :</span>`);
    ["Sûr·e", "Plutôt", "Au hasard"].forEach((c) => {
      const b = el("button", "v3-chip", c);
      b.type = "button";
      b.setAttribute("aria-pressed", String(conf === c));
      if (a.pred != null) b.disabled = true;
      b.addEventListener("click", () => { conf = c; $$(".v3-chip", cw).forEach((x) => x.setAttribute("aria-pressed", String(x.textContent === c))); upd(); });
      cw.append(b);
    });
    body.append(cw);
    // socratique : « pourquoi ce choix ? », un raisonnement à choisir parmi ceux propres à l'option
    const whyBox = el("div", "v3s-why");
    body.append(whyBox);
    let why = a.why != null ? a.why : null;
    const NSP = { k: "nsp", t: "Je ne sais pas vraiment pourquoi", faux: true, nsp: true };
    const reasons = () => { const r = (q.why && pick != null && q.why[pick]) || []; return r.length ? r.concat(NSP) : []; };
    const drawWhy = () => {
      whyBox.innerHTML = "";
      const rs = reasons();
      if (!rs.length) return;
      whyBox.append(el("p", "v3s-why-q", "Pourquoi ce choix ? Retenez le raisonnement le plus proche du vôtre."));
      // les raisonnements proposés sont mélangés ; « je ne sais pas » reste en dernier
      mix(rs.filter((r) => !r.nsp), id + "|w|" + pick).concat([[NSP]]).forEach(([r]) => {
        const b = el("button", "v3-chip v3s-reason" + (r.nsp ? " v3s-nsp" : ""), r.t);
        b.type = "button";
        b.setAttribute("aria-pressed", String(why === r.k));
        if (a.pred != null) b.disabled = true;
        b.addEventListener("click", () => { why = r.k; drawWhy(); upd(); });
        whyBox.append(b);
      });
    };
    drawWhy();
    if (a.pred == null) {
      const go2 = el("button", "v3-btn", "Valider ma prédiction");
      go2.type = "button";
      go2.disabled = true;
      const upd2 = () => { drawWhyOnce(); go2.disabled = pick == null || !conf || (reasons().length > 0 && !reasons().some((r) => r.k === why)); };
      let lastPick = pick;
      const drawWhyOnce = () => { if (pick !== lastPick) { lastPick = pick; why = null; drawWhy(); } };
      upd = upd2;
      go2.addEventListener("click", () => {
        const r = reasons().find((x) => x.k === why);
        a.pred = pick; a.conf = conf; a.predOk = !!q.opts[pick].ok;
        a.why = r ? r.k : null; a.whyBad = !!(r && r.faux); a.whyNsp = !!(r && r.nsp);
        a.whyT = r ? r.t : null; // texte du raisonnement retenu (carte des conceptions du bilan)
        save();
        go(id, 1);
      });
      body.append(go2);
      body.append(el("p", "v3-note", "Pas de bonne ou de mauvaise réponse à ce stade : on teste une intuition et le raisonnement qui la porte. La vérification vient à l’étape 2."));
    } else {
      const r = reasons().find((x) => x.k === a.why);
      body.append(el("p", "v3-note", "Prédiction enregistrée : « " + q.opts[a.pred].t + " » (" + a.conf + ")" + (r ? ", parce que « " + r.t + " »" : "") + "."));
      body.append(nav(id, true, "Observer →"));
    }
    function upd() { /* remplacé ci-dessus */ }
  }

  /* ---------------- échange socratique : une suite de questions courtes ----------------
     steps : [{ q, opts: [{ t, ok, fb }] }]. Une mauvaise réponse renvoie une question en retour
     (fb), sans donner la solution ; l'étudiant réessaie. Une bonne réponse confirme et passe
     à la question suivante. */
  function dialogue(id, steps, key, title, onDone) {
    const a = A(id);
    const st = (a[key] = a[key] || { i: 0, wrong: 0 });
    const box = el("div", "v3s-dlg");
    const draw = () => {
      box.innerHTML = "";
      box.append(el("p", "v3s-dlg-hd", `${AV}${TUTOR} · ${title.toLowerCase()} <em>question ${Math.min(st.i + 1, steps.length)}/${steps.length}</em>`));
      const s = steps[st.i];
      box.append(el("p", "v3-q", s.q));
      const opts = el("div", "v3-opts");
      const fb = el("div", "v3-result");
      mix(s.opts, id + "|d|" + s.q).forEach(([o], j) => {
        const b = el("button", "v3-opt", `<i>${String.fromCharCode(65 + j)}</i><span>${o.t}</span>`);
        b.type = "button";
        b.addEventListener("click", () => {
          if (o.ok) {
            b.classList.add("good");
            $$(".v3-opt", opts).forEach((x) => { x.disabled = true; });
            fb.className = "v3-result good";
            fb.innerHTML = `<b>Oui.</b><span>${o.fb || ""}</span>`;
            chime(true);
            const nx = el("button", "v3-btn", st.i + 1 < steps.length ? "Question suivante →" : "Continuer →");
            nx.type = "button";
            nx.addEventListener("click", () => {
              st.i++; st.wrong = 0; save();
              if (st.i >= steps.length) { st.done = true; save(); onDone(); } else draw();
            });
            box.append(nx);
          } else {
            b.classList.add("bad");
            b.disabled = true;
            st.wrong++;
            fb.className = "v3-result surprise";
            fb.innerHTML = `<b>${AV}${TUTOR} : une question en retour.</b><span>${o.fb || "Regardez de nouveau la scène 3D."}</span>`;
            chime(false);
          }
        });
        opts.append(b);
      });
      box.append(opts, fb);
      const skip = el("button", "v3-link", "Passer cet échange");
      skip.type = "button";
      skip.addEventListener("click", () => { st.done = true; st.skipped = true; save(); onDone(); });
      box.append(skip);
    };
    draw();
    return box;
  }

  /* --- 2 · Observer (qualitatif) --- */
  function renderObserve(id, cfg, body) {
    const a = A(id);
    const o = cfg.observe;
    body.append(el("p", "v3-kicker", "Étape 2 · Observer"));
    body.append(el("p", "v3-q", o.task));
    // les commandes de la consigne : un clic les montre et les fait clignoter dans la zone « Commandes »
    const fids = (o.focus || []).filter((k) => inp(k));
    if (fids.length) {
      const row = el("div", "v3-goto", "<span>Commandes à utiliser :</span>");
      fids.forEach((k) => {
        const ct = inp(k).closest(".ctrl");
        const lab = ct && $("label", ct);
        let name = k;
        if (lab) { const cl = lab.cloneNode(true); $$("strong, .katex-mathml, .v4-pen", cl).forEach((x) => x.remove()); name = cl.textContent.replace(/\s+/g, " ").trim() || k; }
        const b = el("button", "v3-chip v3-gotochip", `${name} <span aria-hidden="true">→</span>`);
        b.type = "button";
        b.title = "Montrer cette commande";
        b.addEventListener("click", () => {
          if (!ct) return;
          ct.scrollIntoView({ behavior: "smooth", block: "center" });
          ct.classList.remove("v3-ping"); void ct.offsetWidth; ct.classList.add("v3-ping");
          const i = $("input, select", ct); if (i) setTimeout(() => i.focus({ preventScroll: true }), 400);
        });
        row.append(b);
      });
      body.append(row);
    }
    const prog = el("div", "v3-progress");
    body.append(prog);
    const res = el("div", "v3-result");
    body.append(res);
    const foot = el("div");
    body.append(foot);
    const refresh = () => {
      const c = ctxFor(id);
      const r = o.check(c) || {};
      prog.innerHTML = (r.items || []).map((it) => `<span class="${it.ok ? "ok" : ""}">${it.ok ? "✓" : "○"} ${it.t}</span>`).join("");
      if (r.done && !a.obsDone) { a.obsDone = true; save(); chime(true); }
      if (a.obsDone) {
        const q = cfg.predict;
        const okP = a.predOk;
        // socratique : si la prédiction ou son raisonnement ne tient pas, l'explication n'est pas
        // donnée d'emblée ; un court échange de questions y conduit (o.relance[clé du raisonnement]).
        const rel = o.relance && (o.relance[a.why] || o.relance.defaut);
        const needDlg = !!rel && (!okP || a.whyBad);
        const dlgOpen = needDlg && !(a.rel && a.rel.done);
        res.className = "v3-result " + (okP && !a.whyBad ? "good" : "surprise");
        const head = okP && !a.whyBad ? "Votre prédiction tient." : okP && a.whyNsp ? "Bonne prédiction : construisons maintenant le pourquoi." : okP ? "Bonne prédiction, mais le raisonnement invoqué ne tient pas." : "Surprise : ce n’est pas ce que vous aviez prédit.";
        res.innerHTML = `<b>${head}</b>
          <span>Vous aviez parié : « ${q.opts[a.pred] ? q.opts[a.pred].t : "?"} ». ${dlgOpen ? (o.constat ? o.constat(c) : "Avant l’explication, quelques questions pour comprendre ce qui s’est passé.") : o.reveal(c)}</span>
          ${!okP && a.conf === "Sûr·e" ? "<span class=\"v3-meta\">Vous étiez sûr·e de vous : c’est précisément ce genre d’écart qui fait progresser. Notez ce qui vous a trompé.</span>" : ""}`;
        foot.innerHTML = "";
        if (dlgOpen) {
          if (P_refresh[id] === refresh) P_refresh[id] = () => {}; // l'échange ne doit pas être redessiné à chaque réglage
          foot.append(dialogue(id, rel, "rel", "Échange", () => { P_refresh[id] = refresh; refresh(); }));
          return;
        }
        if (needDlg && a.rel && !a.rel.skipped) res.append(el("span", "v3-meta", "Vous avez reconstruit l’explication vous-même : c’est elle qui reste."));
        foot.append(nav(id, true, "Voir les mesures →"));
      } else {
        res.className = "v3-result";
        res.innerHTML = "";
        foot.innerHTML = "";
        const lvl = HELP[id] || 0;
        const skip = el("button", "v3-link", lvl === 0 ? "Besoin d’un coup de pouce ?" : "Toujours bloqué·e : faire le réglage automatiquement");
        skip.type = "button";
        skip.addEventListener("click", () => {
          if ((HELP[id] || 0) === 0) { HELP[id] = 1; pulse(id, o); refresh(); }
          else if (o.auto) autoPlay(id, o.auto);
          else { a.obsDone = true; save(); refresh(); }
        });
        foot.append(skip);
        if (lvl === 1) foot.append(el("p", "v3-note", "Les commandes à manipuler clignotent. Essayez d’abord vous-même."));
      }
    };
    P_refresh[id] = refresh;
    record(id); // l'état de départ compte déjà (ex. « sans pare-vapeur » avant tout réglage)
    refresh();
  }

  const HELP = {};
  function pulse(id, o) {
    const P = panels[id];
    if (!P) return;
    const ids = o.focus || [];
    const ctrls = P.ctl ? $$(".ctrl", P.ctl).filter((c) => !ids.length || ids.some((k) => $("#" + k, c))) : [];
    const acts = (o.focusAct ? [o.focusAct] : []).map((l) => $$(".v2-views button", P.stg.world || doc).find((b) => b.textContent.trim().startsWith(l))).filter(Boolean);
    [...ctrls, ...acts].forEach((c) => { c.classList.remove("v3-pulse"); void c.offsetWidth; c.classList.add("v3-pulse"); setTimeout(() => c.classList.remove("v3-pulse"), 4200); });
  }
  function autoPlay(id, seq) {
    let i = 0;
    const P = panels[id];
    const step = () => {
      if (i >= seq.length) return;
      const x = seq[i++];
      if (x.act) { const b = $$(".v2-views button", (P && P.stg.world) || doc).find((bb) => bb.textContent.trim().startsWith(x.act)); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); }
      else setVal(x[0], x[1]);
      setTimeout(step, 700);
    };
    step();
  }

  /* ---------------- termes liés des formules (survol : valeur + objet 3D éclairé) ---------------- */
  doc.addEventListener("mouseover", (e) => term(e, true));
  doc.addEventListener("mouseout", (e) => term(e, false));
  function term(e, on) {
    const t = e.target.closest && e.target.closest(".v3-term[data-term]");
    if (!t) return;
    const id = V2.current();
    const cfg = PC.ateliers[id];
    const fn = cfg && cfg.terms && cfg.terms[t.dataset.term];
    if (on && fn) t.dataset.val = fn(ctxFor(id));
    t.classList.toggle("on", on);
    doc.dispatchEvent(new CustomEvent("labv3:term", { detail: { id, term: t.dataset.term, on } }));
  }

  /* --- 3 · Mesurer et expliquer --- */
  function renderMeasure(id, cfg, body) {
    const a = A(id);
    const m = cfg.measure;
    body.append(el("p", "v3-kicker", "Étape 3 · Mesurer et expliquer"));
    if (m.text) body.append(el("p", "v3-txt", m.text));
    body.append(el("p", "v3-q", m.q));
    const opts = el("div", "v3-opts");
    const fb = el("div", "v3-result");
    mix(m.opts, id + "|m|" + m.q).forEach(([o, i], n) => {
      const b = el("button", "v3-opt", `<i>${String.fromCharCode(65 + n)}</i><span>${o.t}</span>`);
      b.type = "button";
      if (a.explOk) { b.disabled = true; if (o.ok) b.classList.add("good"); }
      b.addEventListener("click", () => {
        if (o.ok) {
          b.classList.add("good");
          a.explOk = true; save(); if (a.obsDone && window.LABV1 && window.LABV1.star) window.LABV1.star(id);
          $$(".v3-opt", opts).forEach((x) => { x.disabled = true; });
          fb.className = "v3-result good";
          fb.innerHTML = `<b>Oui.</b><span>${o.fb || ""}</span>`;
          chime(true);
          drawHints();
          // l'explication est trouvée : « À retenir » s'ouvre (le reste du carnet attend la fin du parcours)
          render(id);
          return;
        } else {
          b.classList.add("bad");
          b.disabled = true;
          a.mWrong = (a.mWrong || 0) + 1; save();
          fb.className = "v3-result surprise";
          // socratique : d'abord une question en retour (o.rq), l'explication du piège ensuite
          fb.innerHTML = o.rq && a.mWrong < 2
            ? `<b>${AV}${TUTOR} : une question en retour.</b><span>${o.rq}</span>`
            : `<b>Pas tout à fait.</b><span>${o.fb || "Relisez les mesures à gauche."}</span>`;
          chime(false);
          drawHints();
        }
      });
      opts.append(b);
    });
    body.append(opts, fb);
    // indices gradués : du plus ouvert au plus précis, à la demande
    const hintsBox = el("div", "v3s-hints");
    body.append(hintsBox);
    function drawHints() {
      hintsBox.innerHTML = "";
      if (a.explOk) return;
      const ind = m.indices || [];
      if (ind.length) {
        const n = Math.min(a.mHint || 0, ind.length);
        ind.slice(0, n).forEach((t, i) => hintsBox.append(el("p", "v3s-hint", `<b>${AV}Indice ${i + 1}/${ind.length}</b> ${t}`)));
        if (n < ind.length) {
          const hb = el("button", "v3-link", n === 0 ? "Un indice ?" : "Un indice plus précis ?");
          hb.type = "button";
          hb.addEventListener("click", () => { a.mHint = n + 1; save(); drawHints(); });
          hintsBox.append(hb);
        }
      }
      if ((a.mWrong || 0) >= 2 && (window.LABV4_MEDIA || {})[id]) {
        const mb = el("button", "v3-link", "Consulter la fiche visuelle du cours");
        mb.type = "button";
        mb.addEventListener("click", () => { if (window.LABV4_OPEN_MEDIA) window.LABV4_OPEN_MEDIA(id, "img"); });
        hintsBox.append(mb);
      }
    }
    drawHints();
    const foot = el("div");
    body.append(foot);
    if (a.explOk) {
      fb.className = "v3-result good"; fb.innerHTML = `<b>Explication validée.</b><span>${(m.opts.find((x) => x.ok) || {}).fb || ""}</span>`;
      if (m.reformule) foot.append(reformule(id, m.reformule));
      if (!finished(id) && !store.free) {
        const rb = el("button", "v3-btn ghost v3s-retenir", "Lire « À retenir »");
        rb.type = "button";
        rb.addEventListener("click", () => openCarnet(id, true));
        foot.append(rb);
      }
      foot.append(nav(id, true, "Aller plus loin →"));
    }
    else foot.append(nav(id, true, "Passer", false));
    // les mesures se dévoilent avec un léger éclat
    const P = panels[id];
    if (P && P.stats) { P.stats.classList.remove("v3-reveal"); void P.stats.offsetWidth; P.stats.classList.add("v3-reveal"); }
  }

  /* ---------------- reformulation libre (auto-explication, non notée) ----------------
     r : { q, modele } ; le texte reste dans ce navigateur, puis on compare à une formulation type. */
  function reformule(id, r) {
    const a = A(id);
    const box = el("div", "v3s-ref");
    box.append(el("p", "v3s-why-q", r.q));
    const ta = el("textarea", "v3s-ta");
    ta.rows = 2;
    ta.placeholder = "Une ou deux phrases, avec vos mots.";
    ta.value = a.ref || "";
    box.append(ta);
    const out = el("div", "v3-result");
    const b = el("button", "v3-btn ghost", "Comparer à une formulation type");
    b.type = "button";
    // auto-évaluation : l'étudiant coche les idées clés présentes dans SA phrase
    const show = () => {
      out.className = "v3-result good";
      out.innerHTML = `<b>Formulation type</b><span>${r.modele}</span>`;
      if (!r.crit || !r.crit.length) { out.append(el("span", "v3-meta", "Votre phrase contient-elle la même cause et le même effet ? Si non, complétez-la.")); return; }
      const chk = el("div", "v3s-crit", `<p class="v3s-crit-q">Relisez <b>votre</b> phrase : quelles idées clés y figurent ?</p>`);
      const got = (a.refCrit = a.refCrit || []);
      const note = el("p", "v3-meta");
      const upd = () => {
        const n = got.filter(Boolean).length;
        note.textContent = n === r.crit.length ? "Toutes les idées clés y sont : votre explication est complète."
          : n === 0 ? "Aucune idée clé pour l’instant : complétez votre phrase à partir de la formulation type, avec vos mots."
          : `${n} idée(s) clé(s) sur ${r.crit.length} : ajoutez celle(s) qui manque(nt) à votre phrase.`;
      };
      r.crit.forEach((c, i) => {
        const lab = el("label", "v3s-crit-it", `<input type="checkbox"${got[i] ? " checked" : ""}><span>${c}</span>`);
        $("input", lab).addEventListener("change", (e) => { got[i] = e.target.checked; a.refCritN = got.filter(Boolean).length; save(); upd(); });
        chk.append(lab);
      });
      chk.append(note);
      out.append(chk);
      upd();
    };
    b.addEventListener("click", () => { a.ref = ta.value.trim(); a.refShown = true; save(); show(); });
    ta.addEventListener("input", () => { a.ref = ta.value; save(); });
    box.append(b, out);
    if (a.refShown) show();
    return box;
  }

  /* --- 4 · Aller plus loin --- */
  function renderPlus(id, cfg, body) {
    const a = A(id);
    const x = cfg.plus;
    body.append(el("p", "v3-kicker", "Étape 4 · Aller plus loin"));
    body.append(el("p", "v3-q", x.task));
    const res = el("div", "v3-result");
    body.append(res);
    const foot = el("div");
    body.append(foot);
    const refresh = () => {
      const c = ctxFor(id);
      const r = x.check(c);
      if (r && !a.plusDone) { a.plusDone = true; save(); chime(true); checkBadges(); }
      if (a.plusDone) { res.className = "v3-result good"; res.innerHTML = `<b>Bien vu.</b><span>${x.reveal(c)}</span>`; }
      else { res.className = "v3-result"; res.innerHTML = x.hint ? `<span class="v3-meta">Indice : ${x.hint}</span>` : ""; }
      foot.innerHTML = "";
      foot.append(nav(id, true, "Diagnostic →", a.plusDone));
    };
    P_refresh[id] = refresh;
    refresh();
  }

  /* --- 5 · Diagnostic (mode « erreur volontaire ») --- */
  const D = {}; // état du diagnostic en cours par atelier
  function renderDiag(id, cfg, body) {
    const a = A(id);
    const ds = D[id];
    const pool = Array.isArray(cfg.diag.variants) && cfg.diag.variants.length ? [cfg.diag, ...cfg.diag.variants] : [cfg.diag];
    const previewIdx = a.diagDone && pool.length > 1 ? ((a.diagVar || 0) + 1) % pool.length : 0;
    const d = (ds && ds.case) || pool[previewIdx] || cfg.diag;
    const P = panels[id];
    const ctrls = P && P.ctl ? $$(".ctrl", P.ctl).filter((c) => $("input, select", c) && !c.hidden && !c.closest("[hidden]")) : [];
    const maxTries = Math.min(3, Math.max(1, ctrls.length <= 4 ? ctrls.length - 1 : 3));
    const triesLbl = `${maxTries} essai${maxTries > 1 ? "s" : ""}`;
    body.append(el("p", "v3-kicker", "Étape 5 · Diagnostic" + (a.diagDone && pool.length > 1 ? ` · cas ${(ds ? ds.vIdx : previewIdx) + 1}/${pool.length}` : "")));
    // premier passage sans chronomètre ; une fois réussi, le diagnostic peut se rejouer en défi chronométré
    body.append(el("p", "v3-txt", a.diagDone
      ? `Défi chronométré : retrouvez la commande responsable (${triesLbl}), puis corrigez-la en moins de 60 s.`
      : `Un cas pathologique est chargé. Retrouvez la commande responsable (${triesLbl}), puis corrigez-la. Prenez le temps qu’il faut : seul le raisonnement compte.`));
    const box = el("div", "v3-diag");
    body.append(box);
    const foot = el("div");
    body.append(foot);
    const ctrlId = (c) => { const i = $("input, select", c); return i ? i.id : ""; };
    const clear = () => {
      ctrls.forEach((c) => { c.classList.remove("v3-pick", "v3-dim", "v3-wrong", "v3-culprit"); c.onclick = null; });
      if (P && P.ctl) P.ctl.classList.remove("v3-picking");
    };
    if (!ds) {
      box.innerHTML = `<div class="v3-symptom"><b>Le cas</b><span>${d.story}</span></div>`;
      const b = el("button", "v3-btn", a.diagDone ? (pool.length > 1 ? "Rejouer en défi chronométré (nouvelle panne)" : "Rejouer en défi chronométré") : "Lancer le diagnostic");
      b.type = "button";
      b.addEventListener("click", () => {
        // on mémorise les réglages de l'étudiant pour les rendre à la fin
        const snap = {};
        ctrls.forEach((c) => { const i = $("input, select", c); if (i) snap[i.id] = i.value; });
        const vIdx = a.diagDone && pool.length > 1 ? ((a.diagVar || 0) + 1) % pool.length : 0;
        if (a.diagDone && pool.length > 1) { a.diagVar = vIdx; save(); }
        const chosen = pool[vIdx] || cfg.diag;
        D[id] = { phase: "pick", tries: 0, snap, t0: 0, chrono: !!a.diagDone, case: chosen, vIdx };
        Object.entries(chosen.preset).forEach(([k, val]) => setVal(k, val));
        render(id);
      });
      box.append(b);
      if (a.diagDone) box.append(el("p", "v3-note", "Diagnostic déjà réussi : badge acquis." + (a.diagTime ? ` Meilleur temps en défi : ${fmt(a.diagTime, 0)} s.` : " Rejouez-le en défi chronométré si vous le souhaitez.")));
      foot.append(nav(id, true, null));
      clear();
      return;
    }
    const c = ctxFor(id);
    box.innerHTML = `<div class="v3-symptom"><b>Symptôme</b><span>${d.symptom(c)}</span></div>`;
    if (ds.phase === "pick") {
      box.append(el("p", "v3-q", `Quelle commande est en cause ? <em>Essai ${ds.tries + 1}/${maxTries}</em>`));
      // socratique : après un essai manqué, une question oriente la recherche sans nommer la commande
      if (ds.tries > 0 && d.questions && d.questions.length) box.append(el("div", "v3-result surprise", `<b>${AV}${TUTOR} : une question pour vous orienter.</b><span>${d.questions[Math.min(ds.tries, d.questions.length) - 1]}</span>`));
      if (P && P.ctl) P.ctl.classList.add("v3-picking");
      ctrls.forEach((ct) => {
        ct.classList.add("v3-pick");
        ct.onclick = (ev) => {
          ev.preventDefault();
          const cid = ctrlId(ct);
          if (cid === d.culprit) {
            chime(true);
            ds.phase = "fix"; ds.t0 = performance.now(); ds.found = ds.tries < maxTries;
            clear();
            render(id);
          } else {
            ct.classList.add("v3-wrong");
            setTimeout(() => ct.classList.remove("v3-wrong"), 500);
            chime(false);
            ds.tries++;
            if (ds.tries >= maxTries) {
              ds.phase = "fix"; ds.t0 = performance.now(); ds.found = false;
              clear();
              render(id);
              return;
            }
            render(id);
          }
        };
      });
    } else if (ds.phase === "fix") {
      box.append(el("p", "v3-q", ds.found ? "Exact. Corrigez maintenant ce réglage, les autres sont verrouillés." : "C’était la commande surlignée. Corrigez-la, les autres sont verrouillées."));
      ctrls.forEach((ct) => { ct.classList.toggle("v3-dim", ctrlId(ct) !== d.culprit); ct.classList.toggle("v3-culprit", ctrlId(ct) === d.culprit); });
      const stat = el("div", "v3-target");
      box.append(stat);
      const tick = () => {
        if (!D[id] || D[id].phase !== "fix") return;
        const cc = ctxFor(id);
        const ok = d.target(cc);
        const el0 = (performance.now() - ds.t0) / 1000, left = Math.max(0, 60 - el0);
        const timer = ds.chrono ? `<span class="v3-timer ${left < 10 ? "late" : ""}">${left > 0 ? Math.ceil(left) + " s" : "Temps écoulé : prenez le temps qu’il faut"}</span>` : "";
        const showHint = d.hint && (ds.chrono ? left <= 0 : el0 > 45);
        stat.innerHTML = `<span>Objectif : ${d.targetTxt}</span><span>Actuel : ${d.now(cc)}</span>${timer}${showHint ? `<span class="v3-meta">Indice : ${d.hint}</span>` : ""}`;
        if (ok) {
          ds.phase = "ok";
          ds.time = (performance.now() - ds.t0) / 1000;
          if (!a.diagDone) { store.nDiag++; }
          a.diagDone = true;
          if (ds.chrono) a.diagTime = Math.min(a.diagTime || 1e9, ds.time); // temps retenu seulement en défi chronométré
          a.diagHelp = !ds.found;
          a.done = a.done || (a.obsDone && a.explOk);
          save();
          if (a.done && window.LABV1 && window.LABV1.star) window.LABV1.star(id);
          chime(true);
          clear();
          checkBadges();
          const first = !a.finiVu;
          a.finiVu = true; save();
          render(id);
          if (first) setTimeout(() => openFin(id), 900);
          return;
        }
        setTimeout(tick, 250);
      };
      tick();
    } else {
      box.append(el("div", "v3-result good", `<b>Cas résolu en ${fmt(ds.time, 0)} s${ds.found ? "" : " (avec l’aide)"}.</b><span>${d.explain}</span>`));
      const r = el("button", "v3-btn ghost", "Rendre mes réglages d’avant le diagnostic");
      r.type = "button";
      r.addEventListener("click", () => { Object.entries(ds.snap).forEach(([k, val]) => setVal(k, val)); delete D[id]; render(id); });
      box.append(r);
      const again = el("button", "v3-link", "Revenir au cas");
      again.type = "button";
      again.addEventListener("click", () => { delete D[id]; render(id); });
      box.append(again);
    }
    foot.append(nav(id, true, null));
  }

  /* ---------------- rafraîchissement sur chaque réglage ---------------- */
  const P_refresh = {};
  const refreshCur = () => {
    const id = V2.current();
    record(id); // d'abord mémoriser l'état atteint, puis réévaluer la tâche (sinon le dernier réglage n'est vu qu'au suivant)
    if (P_refresh[id] && panels[id]) {
      const st = STEPS[A(id).step].k;
      if (st === "observer" || st === "plus") P_refresh[id]();
    }
    checkBadges();
  };
  // mémorise les états visités (utile aux tâches « allez de X à Y »)
  function record(id) {
    const cfg = PC.ateliers[id];
    if (!cfg || !cfg.record) return;
    cfg.record(ctxFor(id));
  }
  doc.addEventListener("input", (e) => { if (e.target.closest && e.target.closest(".v2-stage")) setTimeout(refreshCur, 0); });
  doc.addEventListener("change", (e) => { if (e.target.closest && e.target.closest(".v2-stage")) setTimeout(refreshCur, 0); });
  doc.addEventListener("labv2:update", () => setTimeout(refreshCur, 0));
  doc.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".v2-views")) setTimeout(refreshCur, 60); });

  /* ---------------- comparateur A / B (écran partagé sur la figure) ---------------- */
  const CMP = {};
  function addCompareTool(id) {
    const stg = V2.stages[id];
    if (!stg || !stg.world) return;
    const tools = $(".v2-tools", stg.world);
    const help = tools && $('[data-tool="help"]', tools);
    const b = el("button", "v2-chipbtn", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 3v18"/></svg><span>Comparer A/B</span>`);
    b.type = "button";
    b.title = "Figer l’état actuel (A), puis comparer avec vos nouveaux réglages (B) : figure en écran partagé et tableau des écarts";
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => (CMP[id] ? stopCompare(id, b) : startCompare(id, b)));
    if (help) tools.insertBefore(b, help); else if (tools) tools.append(b);
  }
  function kpis(stg) { return stg.out ? $$(".kpi", stg.out).map((k) => ({ k: plain($(".k", k)), v: plain($(".v", k)) })) : []; }
  function plain(n) { if (!n) return ""; const c = n.cloneNode(true); $$(".katex-mathml", c).forEach((m) => m.remove()); return c.textContent.replace(/\s+/g, " ").trim(); }
  // échelles des schémas : figées (avec marge) pendant une comparaison, pour que A et B restent superposables
  const SCL = { last: {}, frozen: {} };
  window.LABV3S = (k, m, isMin) => { SCL.last[k] = { m, isMin }; const f = SCL.frozen[k]; return f == null ? m : f; };
  function freeze(id, on) {
    Object.keys(SCL.last).filter((k) => k === id || k.startsWith(id + "-")).forEach((k) => {
      if (!on) { delete SCL.frozen[k]; return; }
      const { m, isMin } = SCL.last[k];
      SCL.frozen[k] = isMin ? m - Math.abs(m) * 0.6 - 2 : m * 1.6;
    });
    redraw(id);
  }
  function startCompare(id, btn) {
    const stg = V2.stages[id];
    freeze(id, true);
    const cv = stg.figs && $("canvas", stg.figs);
    const cfgA = PC.ateliers[id];
    const snap = { k: kpis(stg), img: null, cv, out: cfgA && cfgA.compute ? cfgA.compute(v, s) : null };
    try { snap.img = cv ? cv.toDataURL("image/png") : null; } catch (_) { snap.img = null; }
    // superposition : A à gauche du curseur, B (en direct) à droite
    if (cv && snap.img && !(cfgA && cfgA.ghost)) {
      const host = cv.parentElement;
      host.classList.add("v3-cmp-host");
      const ov = el("div", "v3-cmp", `<img alt="État A figé"><div class="v3-cmp-bar"><span>A</span><span>B</span></div>`);
      $("img", ov).src = snap.img;
      host.append(ov);
      const place = () => {
        ov.style.left = cv.offsetLeft + "px"; ov.style.top = cv.offsetTop + "px";
        ov.style.width = cv.offsetWidth + "px"; ov.style.height = cv.offsetHeight + "px";
      };
      place();
      snap.ro = new ResizeObserver(place);
      snap.ro.observe(cv);
      let f = 0.5;
      const setF = (x) => { f = Math.max(0.02, Math.min(0.98, x)); $("img", ov).style.clipPath = `inset(0 ${(1 - f) * 100}% 0 0)`; $(".v3-cmp-bar", ov).style.left = f * 100 + "%"; };
      setF(0.5);
      const bar = $(".v3-cmp-bar", ov);
      bar.addEventListener("pointerdown", (e) => {
        bar.setPointerCapture(e.pointerId);
        const mv = (ev) => { const r = ov.getBoundingClientRect(); setF((ev.clientX - r.left) / r.width); };
        const up = () => { bar.removeEventListener("pointermove", mv); bar.removeEventListener("pointerup", up); };
        bar.addEventListener("pointermove", mv);
        bar.addEventListener("pointerup", up);
      });
      snap.ov = ov;
    }
    const tab = el("div", "card v3-cmp-tab");
    stg.left.append(tab);
    snap.tab = tab;
    CMP[id] = snap;
    btn.setAttribute("aria-pressed", "true");
    $("span", btn).textContent = "Effacer A/B";
    updCompare(id);
    V2.emit && V2.emit("update", { id });
    V2.flash && V2.flash("État A figé : modifiez les réglages, l’écart s’affiche en direct.");
  }
  function updCompare(id) {
    const c = CMP[id];
    if (!c) return;
    const now = kpis(V2.stages[id]);
    const num = (t) => { const m = String(t).replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?(e-?\d+)?/i); return m ? +m[0] : NaN; };
    const rows = c.k.map((a, i) => {
      const b = now[i] || { v: "" };
      const na = num(a.v), nb = num(b.v);
      const d = isFinite(na) && isFinite(nb) && na !== 0 ? ((nb - na) / Math.abs(na)) * 100 : NaN;
      const short = (t) => (t.length > 34 ? t.slice(0, 32) + "…" : t);
      return `<tr><td>${a.k.replace(/\(.*?\)/g, "").trim()}</td><td>${short(a.v)}</td><td>${short(b.v)}</td><td class="${isFinite(d) ? (d > 0 ? "up" : d < 0 ? "dn" : "") : ""}">${isFinite(d) ? (d > 0 ? "+" : "") + fmt(d, 0) + " %" : ""}</td></tr>`;
    }).join("");
    c.tab.innerHTML = `<div class="hd">Comparaison A (figé) / B (actuel)</div><div class="bd"><table><thead><tr><th></th><th>A</th><th>B</th><th>écart</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function stopCompare(id, btn) {
    const c = CMP[id];
    if (c) { if (c.ov) c.ov.remove(); if (c.ro) c.ro.disconnect(); if (c.tab) c.tab.remove(); }
    delete CMP[id];
    freeze(id, false);
    V2.emit && V2.emit("update", { id });
    btn.setAttribute("aria-pressed", "false");
    $("span", btn).textContent = "Comparer A/B";
  }
  doc.addEventListener("labv2:update", (e) => { if (CMP[e.detail.id]) updCompare(e.detail.id); });
  window.LABV3 = { closeCarnet: () => closeCarnet(), resetAt: (id) => { delete store.at[id]; bumpPass(id); save(); if (panels[id]) { render(id); applyLocks(id); } }, hasCompare: (id) => !!CMP[id], snapOut: (id) => (CMP[id] ? CMP[id].out : null), isMasked: (id) => !!(panels[id] && panels[id].stg.figs && panels[id].stg.figs.classList.contains("v3-qual-fig")) };

  /* ---------------- badges ---------------- */
  let shelf = null;
  function checkBadges() {
    const id = V2.current();
    (PC.badges || []).forEach((b) => {
      if (store.badges[b.id]) return;
      let ok = false;
      try { ok = b.check({ id, ctx: id && PC.ateliers[id] ? ctxFor(id) : null, store, A, mem }); } catch (_) { ok = false; }
      if (ok) {
        store.badges[b.id] = Date.now();
        save();
        toastBadge(b);
        drawShelf();
      }
    });
  }
  function toastBadge(b) {
    const t = el("div", "v3-badge-toast", `<span class="v3-bic">${b.icon}</span><div><b>Badge débloqué : ${b.name}</b><span>${b.desc}</span></div>`);
    doc.body.append(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 500); }, 4200);
    chime(true);
  }
  function drawShelf() {
    if (!shelf) return;
    const n = (PC.badges || []).filter((b) => store.badges[b.id]).length;
    $(".v3-shelf-n", shelf).textContent = n + " / " + PC.badges.length;
    $(".v3-badges", shelf).innerHTML = PC.badges.map((b) => `<div class="v3-badge ${store.badges[b.id] ? "got" : ""}" title="${b.desc}"><span class="v3-bic">${b.icon}</span><b>${b.name}</b><span>${store.badges[b.id] ? b.desc : b.how || b.desc}</span></div>`).join("");
  }
  function buildShelf() {
    const home = V2.stages.home && V2.stages.home.sec;
    if (!home) return;
    const cards = $(".v2-section", home);
    shelf = el("div", "v2-section v3-shelf", `<div class="v2-sechead"><div class="v2-num">★</div><div><h3>Vos <em>badges</em> <span class="v3-shelf-n"></span></h3><p>Des trophées de bureau d’études, liés aux erreurs classiques. Ils restent sur cet ordinateur.</p></div></div><div class="v3-badges"></div>`);
    if (cards) cards.after(shelf); else home.append(shelf);
    drawShelf();
  }

  /* ---------------- mode libre / guidé (rail) ---------------- */
  function buildRailToggle() {
    const tools = $(".side-tools");
    if (!tools) return;
    const b = el("button", "theme-btn v2-toggle", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M4 12h16M4 18h7"/><circle cx="17" cy="6" r="2"/><circle cx="14" cy="18" r="2"/></svg><span>Exploration libre</span>`);
    b.type = "button";
    b.id = "v3-free";
    b.title = "Exploration libre : sans étapes ni verrous (pratique en démonstration). Désactivé : parcours guidé.";
    b.setAttribute("aria-pressed", String(!!store.free));
    b.addEventListener("click", () => {
      store.free = !store.free;
      save();
      b.setAttribute("aria-pressed", String(store.free));
      Object.keys(panels).forEach(render);
      V2.flash && V2.flash(store.free ? "Exploration libre : toutes les commandes et mesures sont visibles." : "Parcours guidé : prédire, observer, mesurer.");
    });
    const help = $$(".theme-btn", tools).pop();
    tools.insertBefore(b, help);
  }

  /* ---------------- saisie numérique : clic sur la valeur affichée d'un curseur ---------------- */
  function numEdit(strong) {
    const ctrl = strong.closest(".ctrl");
    const rng = ctrl && $('input[type="range"]', ctrl);
    if (!rng || strong.dataset.editing) return;
    const card = ctrl.closest(".controls-card");
    if (card && (card.classList.contains("v3-locked") || card.classList.contains("v3-picking"))) return;
    if (ctrl.classList.contains("v3-dim")) return;
    strong.dataset.editing = "1";
    const f = el("input", "v3-num");
    f.type = "text";
    f.inputMode = "decimal";
    f.value = String(+rng.value).replace(".", ",");
    f.setAttribute("aria-label", "Saisir la valeur (" + rng.min + " à " + rng.max + ")");
    f.title = "Entrée pour valider, Échap pour annuler · de " + String(rng.min).replace(".", ",") + " à " + String(rng.max).replace(".", ",");
    strong.style.display = "none";
    strong.after(f);
    f.focus();
    f.select();
    let done = false;
    const close = (ok) => {
      if (done) return;
      done = true;
      if (ok) {
        const m = f.value.replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
        if (m) {
          const x = Math.min(+rng.max, Math.max(+rng.min, +m[0]));
          const st = +rng.step;
          // une valeur entre deux crans : le curseur passe en réglage continu pour la garder exacte
          if (st > 0 && Math.abs((x - +rng.min) / st - Math.round((x - +rng.min) / st)) > 1e-6) rng.step = "any";
          if (x !== +m[0] && V2.flash) V2.flash("Valeur ramenée dans la plage du curseur (" + String(rng.min).replace(".", ",") + " à " + String(rng.max).replace(".", ",") + ").");
          setVal(rng.id, x);
        } else if (V2.flash) V2.flash("Valeur non reconnue : saisissez un nombre.");
      }
      f.remove();
      strong.style.display = "";
      delete strong.dataset.editing;
    };
    f.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); close(true); } if (e.key === "Escape") { e.preventDefault(); close(false); } });
    f.addEventListener("blur", () => close(true));
    f.addEventListener("click", (e) => e.stopPropagation());
  }
  function markEditable() {
    $$(".v2-stage .controls-card .ctrl").forEach((c) => {
      const rng = $('input[type="range"]', c);
      const st = $('label strong[id^="v-"]', c);
      if (rng && st && !st.classList.contains("v3-editable")) { st.classList.add("v3-editable"); st.title = "Cliquer pour saisir une valeur précise"; st.tabIndex = 0; }
    });
  }
  doc.addEventListener("click", (e) => {
    const st = e.target.closest && e.target.closest("strong.v3-editable");
    if (!st) return;
    const card = st.closest(".controls-card");
    if (card && card.classList.contains("v3-picking")) return; // en diagnostic, le clic sert à désigner la commande
    e.preventDefault();
    e.stopPropagation();
    numEdit(st);
  }, true);
  doc.addEventListener("keydown", (e) => {
    const st = e.target.closest && e.target.closest("strong.v3-editable");
    if (st && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); numEdit(st); }
  });

  /* ---------------- « Tout recommencer » efface aussi les parcours ---------------- */
  const wipe = doc.getElementById("wipe-btn");
  if (wipe) wipe.addEventListener("click", () => {
    const conf0 = window.confirm;
    window.confirm = (m) => {
      window.confirm = conf0;
      const ok = conf0.call(window, m);
      if (ok) {
        // remise à zéro complète : on revient aussi au parcours guidé
        const pass = store.pass || {};
        Object.keys(PC.ateliers).forEach((k) => { if (store.at[k]) pass[k] = (pass[k] || 0) + 1; });
        store = { at: {}, badges: {}, free: false, nPredOk: 0, nDiag: 0, pass };
        save();
        const fb = doc.getElementById("v3-free");
        if (fb) fb.setAttribute("aria-pressed", "false");
        Object.keys(mem).forEach((k) => delete mem[k]);
        Object.keys(D).forEach((k) => delete D[k]);
        Object.keys(HELP).forEach((k) => delete HELP[k]);
        Object.keys(panels).forEach(render);
        drawShelf();
        drawBilan();
      }
      return ok;
    };
    setTimeout(() => { window.confirm = conf0; }, 0);
  }, true);

  /* ---------------- bilan métacognitif (dans l'atelier de synthèse finale) ---------------- */
  const AT_FR_NAMES = {};
  Object.keys(PC.ateliers).forEach((id) => {
    const st = V2.stages[id];
    const h = st && $(".v2-brand h2", st.left);
    if (h) AT_FR_NAMES[id] = h.textContent;
  });
  let bilan = null;
  function bilanData() {
    const rows = Object.keys(PC.ateliers).map((id) => {
      const st = V2.stages[id];
      const h = st && $(".v2-brand h2", st.left);
      return { id, name: AT_FR_NAMES[id] || (h ? h.textContent : id), a: store.at[id] || {} };
    });
    const pred = rows.filter((r) => r.a.pred != null);
    const ok = pred.filter((r) => r.a.predOk);
    const sure = pred.filter((r) => r.a.conf === "Sûr·e");
    const sureOk = sure.filter((r) => r.a.predOk);
    const surprises = pred.filter((r) => !r.a.predOk && r.a.explOk);
    const diags = rows.filter((r) => r.a.diagDone);
    const tAvg = diags.length ? diags.reduce((x, r) => x + (r.a.diagTime || 0), 0) / diags.length : NaN;
    return { rows, pred, ok, sure, sureOk, surprises, diags, tAvg, nB: (PC.badges || []).filter((b) => store.badges[b.id]).length };
  }
  // état d'une conception : juste d'emblée, corrigée en chemin, à revoir, en cours, pas encore fait
  function concept(r) {
    const a = r.a;
    if (a.pred == null) return { k: "none", t: "Pas encore fait" };
    const bad = !a.predOk || a.whyBad;
    if (!bad) return { k: "ok", t: "Juste d’emblée" };
    if (a.rel && a.rel.done && !a.rel.skipped) return { k: "fixed", t: a.whyNsp ? "Construite en chemin" : "Corrigée en chemin" };
    if (a.rel && a.rel.skipped) return { k: "todo", t: "À revoir" };
    return { k: a.explOk ? "fixed" : "run", t: a.explOk ? "Corrigée en chemin" : "En cours" };
  }
  const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const plainT = (x) => String(x || "").replace(/<sub>(.*?)<\/sub>/g, "_$1").replace(/<[^>]+>/g, "");
  function bilanHTML(d, print) {
    const tile = (v, t, k, frac) => `<div class="v3b-tile ${k || ""}"><b>${v}</b><span>${t}</span>${frac != null ? `<em><i style="width:${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%"></i></em>` : ""}</div>`;
    const fr = (a, b) => (b ? a / b : 0);
    const nFix = d.rows.filter((r) => concept(r).k === "fixed").length;
    const nTodo = d.rows.filter((r) => concept(r).k === "todo").length;
    const tr = d.rows.filter((r) => r.a.transPick != null);
    const tiles = `<div class="v3b-tiles">
      ${tile(`${d.rows.filter((r) => finished(r.id)).length}/${d.rows.length}`, "ateliers terminés", "", fr(d.rows.filter((r) => finished(r.id)).length, d.rows.length))}
      ${tile(`${d.ok.length}/${d.pred.length || 0}`, "prédictions justes au départ", "acc", fr(d.ok.length, d.pred.length))}
      ${tile(nFix, "idées fausses corrigées en chemin", "fix")}
      ${tile(`${tr.filter((r) => r.a.transOk).length}/${tr.length}`, "questions de transfert réussies", "", fr(tr.filter((r) => r.a.transOk).length, tr.length))}
      ${tile(`${d.nB}/${(PC.badges || []).length}`, "badges", "", fr(d.nB, (PC.badges || []).length))}
    </div>`;
    const cards = d.rows.map((r, i) => {
      const c = concept(r), a = r.a, at = PC.ateliers[r.id];
      const pred = a.pred != null && at.predict.opts[a.pred] ? at.predict.opts[a.pred].t : "";
      const mod = at.measure && at.measure.reformule ? at.measure.reformule.modele : "";
      const crit = at.measure && at.measure.reformule && at.measure.reformule.crit;
      const iOk = at.predict.opts.findIndex((o) => o.ok);
      // piège : l'idée fausse de l'étudiant s'il en avait une, sinon l'erreur la plus fréquente sur ce point
      const myBad = a.pred != null && (!a.predOk || (a.whyBad && !a.whyNsp));
      const common = ((at.predict.why || [])[iOk] || []).find((x) => x.faux && !x.nsp) || ((at.predict.why || []).flat().find((x) => x.faux && !x.nsp));
      const trap = myBad ? `Votre idée de départ ne tenait pas : « ${!a.predOk ? pred : a.whyT} ».` : common ? `Erreur fréquente : « ${common.t} ».` : "";
      const foot = [];
      if (crit && a.refCritN != null) foot.push(`idées clés : ${a.refCritN}/${crit.length}`);
      if (a.transPick != null) foot.push(a.transOk ? "transfert réussi" : "transfert à revoir");
      if (a.diagDone) foot.push(a.diagHelp ? "diagnostic avec aide" : "diagnostic réussi");
      return `<article class="v3b-card st-${c.k}">
        <header><span class="v3b-num">${String(i + 1).padStart(2, "0")}</span><b>${esc(r.name)}</b><span class="v3b-chip">${c.t}</span></header>
        ${a.pred != null ? `<p class="v3b-from"><i>Au départ</i>« ${pred} »${a.whyT ? ` parce que « ${a.whyT} »` : ""}${a.conf ? ` <em>(${esc(a.conf)})</em>` : ""}</p>` : `<p class="v3b-from v3b-mute">Atelier pas encore commencé.</p>`}
        ${a.explOk && trap ? `<p class="v3b-trap"><i>${myBad ? "Le piège dans lequel vous étiez" : "Le piège à éviter"}</i>${trap}</p>` : ""}
        ${a.explOk && mod ? `<p class="v3b-to"><i>À retenir</i>${mod}</p>` : a.pred != null ? `<p class="v3b-from v3b-mute">L’essentiel à retenir s’affichera ici dès l’explication trouvée (étape 3).</p>` : ""}
        ${a.explOk && crit ? `<ul class="v3b-keys">${crit.map((c) => `<li>${c}</li>`).join("")}</ul>` : ""}
        ${foot.length ? `<footer>${foot.map((f) => `<span>${f}</span>`).join("")}</footer>` : ""}
      </article>`;
    }).join("");
    const advice = nTodo ? `<p class="v3b-advice">${AV}<span><b>${TUTOR} :</b> ${nTodo} conception(s) « à revoir » : vous aviez passé l’échange de questions. Rouvrez ces ateliers et refaites l’étape 2, c’est là que l’idée se construit.</span></p>`
      : nFix ? `<p class="v3b-advice">${AV}<span><b>${TUTOR} :</b> ${nFix} idée(s) fausse(s) au départ, corrigée(s) en chemin. C’est exactement à cela que servent ces ateliers : notez-les, ce sont celles qui reviennent le plus facilement.</span></p>` : "";
    const P = PC.programme;
    const prog = P ? `<div class="v3b-prog"><h4>Ce que ce lab travaille dans votre B.U.T. GC-CD</h4><p><b>${esc(P.ressource)}</b>${P.sae ? ` · ${esc(P.sae)}` : ""}</p><p><i>Compétence${P.competences.length > 1 ? "s" : ""}</i> ${P.competences.map(esc).join(" · ")}</p><ul>${P.acs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
    return `${tiles}<h4 class="v3b-h">Carte de mes conceptions · fiche mémo du lab</h4>
      <p class="v3b-lede">Pour chaque atelier : ce que vous pensiez au départ, le piège à éviter, puis l’essentiel et les idées clés à retenir. Imprimée, cette carte sert de fiche de révision.</p>
      <div class="v3b-legend"><span class="st-ok">Juste d’emblée</span><span class="st-fixed">Corrigée en chemin</span><span class="st-todo">À revoir</span><span class="st-none">Pas encore fait</span></div>
      <div class="v3b-map">${cards}</div>${advice}${print ? "" : prog}`;
  }
  function drawBilan() {
    if (!bilan) return;
    $(".v3-bilan-bd", bilan).innerHTML = bilanHTML(bilanData(), false);
  }
  // rapport de mission imprimable : nom, rang, badges, carte des conceptions
  function printBilan() {
    const d = bilanData();
    const w = window.open("", "_blank");
    if (!w) { if (V2.flash) V2.flash("Fenêtre bloquée : autorisez les fenêtres surgissantes pour imprimer."); return; }
    const conf = V2.conf || {};
    const rank = ($('[data-mirror="rank-name"]') || $("#rank-name") || {}).textContent || "";
    const badges = (PC.badges || []).filter((b) => store.badges[b.id]);
    const css = $$("style").map((x) => x.textContent).filter((t) => /v3b-/.test(t)).join("\n");
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport de mission ${esc(conf.code || "")}</title>
      <style>${css}
      body{font:13.5px/1.5 system-ui,"Segoe UI",sans-serif;margin:28px;color:#14171f;background:#fff;--v2-ink:#14171f;--v2-ink2:#3b4252;--v2-mute:#6b7385;--v2-acc:#c4622d;--v2-line:#d9dde6;--v2-chip-hi:#f4f5f8;--v2-bg2:#fff;--ok:#1f7a4c;--warn:#a15c00;--danger:#9b1c1c}
      .rm-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #c4622d;padding-bottom:10px;margin-bottom:16px}
      .rm-head h1{margin:0;font-size:22px}.rm-head p{margin:2px 0;color:#3b4252}.rm-k{font:600 11px monospace;letter-spacing:.14em;text-transform:uppercase;color:#c4622d}
      .rm-badges{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 14px}.rm-badges span{border:1px solid #d9dde6;border-radius:999px;padding:2px 10px;font-size:12px}
      .v4-av{display:none}@page{margin:14mm}.v3b-card{break-inside:avoid}</style></head><body>
      <div class="rm-head"><div><p class="rm-k">Rapport de mission · ${esc(conf.mission || "")}</p><h1>${esc(conf.code || "")} · ${esc((conf.titleHTML || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&"))}</h1></div>
      <div style="text-align:right"><p>Nom : ..............................................</p><p>Date : ${new Date().toLocaleDateString("fr-FR")}${rank ? ` · Rang : <b>${esc(rank)}</b>` : ""}</p></div></div>
      ${bilanHTML(d, true)}
      <h4 class="v3b-h">Badges obtenus</h4><div class="rm-badges">${badges.length ? badges.map((b) => `<span>${esc(b.name)}</span>`).join("") : "<span>aucun pour l’instant</span>"}</div>
      <p>Ce qui m’a le plus surpris : .....................................................................................................................</p>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }
  function openTargetedReview() {
    $$(".v3s-reprise").forEach((x) => x.remove());
    const ids = Object.keys(PC.ateliers);
    // score de fragilité : priorité aux prédictions fausses, raisonnements erronés, essais multiples et transferts manqués
    const scored = ids.map((id) => {
      const a = store.at[id] || {};
      const started = a.pred != null || finished(id);
      let w = 0;
      if (a.pred != null && !a.predOk) w += 4;
      if (a.whyBad) w += 3;
      if ((a.mWrong || 0) > 0) w += 2 * Math.min(3, a.mWrong);
      if ((a.mHint || 0) > 0) w += 1;
      if (a.diagHelp) w += 2;
      if (a.transOk === false) w += 3;
      if (a.rel && a.rel.skipped) w += 2;
      return { id, a, started, w };
    });
    let pool = scored.filter((r) => r.started).sort((x, y) => y.w - x.w);
    if (!pool.length) pool = scored.slice(0, 5);
    const items = [];
    const salt = Date.now();
    pool.forEach((r) => {
      if (items.length >= 5) return;
      const at = PC.ateliers[r.id];
      if (!at) return;
      // alterner transfert, explication (étape 3) et variante de prédiction
      const q = (r.a.transOk === false && at.transfert) ? { kind: "Transfert", Q: at.transfert }
        : (at.transfert && items.length % 2 === 0) ? { kind: "Transfert", Q: at.transfert }
        : (at.measure && at.measure.opts) ? { kind: "Mécanisme clé", Q: { q: at.measure.q, opts: at.measure.opts } }
        : (at.predict && at.predict.variante) ? { kind: "Intuition", Q: at.predict.variante } : null;
      if (q && q.Q && Array.isArray(q.Q.opts) && q.Q.opts.length >= 2) items.push({ id: r.id, fragile: r.w > 0, ...q });
    });
    // compléter jusqu'à 5 questions si moins de 5 ateliers ont été ouverts
    if (items.length < 5) {
      scored.forEach((r) => {
        if (items.length >= 5 || items.some((x) => x.id === r.id && x.kind === "Mécanisme clé")) return;
        const at = PC.ateliers[r.id];
        if (at && at.measure && at.measure.opts) items.push({ id: r.id, fragile: r.w > 0, kind: "Mécanisme clé", Q: { q: at.measure.q, opts: at.measure.opts } });
      });
    }
    if (!items.length) return;
    const ov = el("div", "v3s-fin v3s-reprise");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    const fragileN = items.filter((x) => x.fragile).length;
    const card = el("div", "v3s-fin-card", `<button type="button" class="v3s-fin-x" aria-label="Fermer">×</button>
      <p class="v3-kicker">${AV}${TUTOR} · révision ciblée (5 min)</p>
      <h3>Consolidation de vos points fragiles</h3>
      <p class="v3-txt">${fragileN ? `J’ai sélectionné ${items.length} questions centrées en priorité sur les ${fragileN} notion(s) où vous aviez hésité ou changé d’idée en chemin.` : `Aucune erreur marquée jusqu’ici : voici ${items.length} questions de synthèse pour ancrer vos réflexes métiers.`}</p>`);
    let ans = 0, good = 0;
    const scoreEl = el("div", "v3s-rev-score");
    scoreEl.hidden = true;
    items.forEach((it, idx) => {
      let counted = false;
      const tag = `${idx + 1}/${items.length} · Atelier « ${title(it.id)} » · ${it.kind}${it.fragile ? " · point à consolider" : ""}`;
      card.append(qBox(`${it.id}|rev|${salt}|${idx}`, it.Q, tag, (ok) => {
        if (counted) return;
        counted = true; ans++; if (ok) good++;
        scoreEl.hidden = false;
        scoreEl.innerHTML = ans < items.length
          ? `Progression de la révision : <b>${good}/${ans}</b> juste(s) · encore ${items.length - ans} question(s).`
          : `Révision terminée : <b>${good}/${items.length}</b> au premier essai. ${good === items.length ? "Vos points fragiles sont solidement verrouillés !" : "Rouvrez librement les ateliers signalés pour manipuler la scène 3D."}`;
      }));
    });
    card.append(scoreEl);
    const close = el("button", "v3-btn", "Terminer la révision");
    close.type = "button";
    const rm = () => { ov.remove(); doc.removeEventListener("keydown", onK); };
    const onK = (e) => { if (e.key === "Escape") rm(); };
    doc.addEventListener("keydown", onK);
    close.addEventListener("click", rm);
    $(".v3s-fin-x", card).addEventListener("click", rm);
    card.append(close);
    ov.append(card);
    ov.addEventListener("click", (e) => { if (e.target === ov) rm(); });
    doc.body.append(ov);
    watchSub(ov);
    if (window.katex) $$(".tex[data-tex]", ov).forEach((t) => { try { t.innerHTML = katex.renderToString(t.dataset.tex, { throwOnError: false }); } catch (_) { /* ignore */ } });
  }

  function buildBilan() {
    const host = PC.bilanHost && doc.getElementById("atelier-" + PC.bilanHost);
    if (!host) return;
    bilan = el("div", "card v3-bilan", `<div class="hd"><span>Votre bilan de parcours</span><div class="v3-bilan-acts"><button type="button" class="v3-btn" data-bilan="rev">Réviser mes points fragiles (5 min)</button><button type="button" class="v3-btn ghost" data-bilan="print">Imprimer mon rapport de mission</button></div></div><div class="bd v3-bilan-bd"></div>`);
    watchSub(bilan);
    bilan.classList.add("v3-bilan-wide");
    const stage = $(":scope > .v2-stage", host);
    if (stage) stage.before(bilan); else host.prepend(bilan);
    $('[data-bilan="rev"]', bilan).addEventListener("click", openTargetedReview);
    $('[data-bilan="print"]', bilan).addEventListener("click", printBilan);
    drawBilan();
    doc.addEventListener("labv2:atelier", (e) => { if (e.detail && e.detail.id === PC.bilanHost) drawBilan(); });
  }

  /* ---------------- anneaux de progression : 5 segments, un par étape franchie ---------------- */
  const stepsDone = (id) => { const a = store.at[id] || {}; return finished(id) ? 5 : (a.pred != null) + !!a.obsDone + !!a.explOk + !!a.plusDone + !!a.diagDone; };
  function ringSVG(n) {
    const R0 = 15, C = 2 * Math.PI * R0, seg = C / 5, gap = 4.6; // écart net entre les 5 arcs
    let arcs = "";
    for (let i = 0; i < 5; i++) arcs += `<circle r="${R0}" cx="18" cy="18" class="${i < n ? "on" : ""}" stroke-dasharray="${seg - gap} ${C - seg + gap}" stroke-dashoffset="${-i * seg}" />`;
    return `<svg class="v3-ring" viewBox="0 0 36 36" aria-hidden="true"><g transform="rotate(-90 18 18)">${arcs}</g></svg>`;
  }
  function drawRings() {
    Object.keys(PC.ateliers).forEach((id) => {
      const n = stepsDone(id);
      const lbl = n === 5 ? "parcours terminé" : `${n} étape(s) sur 5`;
      $$(`.nav-btn[data-atelier="${id}"] .ic, .v2-card[data-card="${id}"] .v2-cic`).forEach((ic) => {
        let r = $(".v3-ringbox", ic);
        if (!r) { r = el("span", "v3-ringbox"); ic.classList.add("v3-hasring"); ic.append(r); }
        if (r.dataset.n !== String(n)) { r.dataset.n = n; r.innerHTML = ringSVG(n); }
      });
      // info-bulle du menu : ce que signifient l'anneau et l'étoile
      const nb = $(`.nav-btn[data-atelier="${id}"]`);
      if (nb) nb.title = `Parcours : ${n === 5 ? "terminé (anneau vert)" : `${n} étape(s) sur 5 (anneau orange)`} · ${nb.classList.contains("v2-starred") ? "étoile obtenue" : "étoile pas encore obtenue"}`;
      const card = $(`.v2-card[data-card="${id}"]`);
      if (card) {
        let st = $(".v3-cardstep", card);
        if (!st) { st = el("span", "v3-cardstep"); const top = $(".v2-ctop", card); if (top) top.append(st); }
        const dur = PC.ateliers[id].duree;
        st.textContent = (n === 5 ? "✓ terminé" : n ? `${n}/5 étapes` : "") + (dur ? `${n ? " · " : ""}≈ ${dur} min` : "");
      }
    });
  }

  /* ---------------- montage ---------------- */
  Object.keys(PC.ateliers).forEach((id) => { buildPanel(id); });
  buildShelf();
  buildRailToggle();
  buildBilan();
  markEditable();
  // étoiles déjà méritées (parcours terminés avant cette version)
  Object.keys(PC.ateliers).forEach((id) => { if ((A(id).done || (A(id).obsDone && A(id).explOk)) && window.LABV1 && window.LABV1.star) window.LABV1.star(id); });
  if (PC.init) PC.init({ setVal, v, s, V2 });
  checkBadges();
  drawRings();
  doc.addEventListener("labv2:atelier", (e) => {
    setTimeout(drawRings, 50);
    // en entrant dans un atelier pas encore commencé : panneau redessiné (rappel espacé d'un atelier terminé)
    const id = e.detail && e.detail.id, a = id && store.at[id];
    if (panels[id] && (!a || a.pred == null) && !D[id]) render(id);
  });
  setTimeout(reprise, 1500);
  window.LABV3.stepsDone = stepsDone;
  window.LABV3.store = () => store;
  window.LABV3.programme = PC.programme;
  window.LABV3.openReview = openTargetedReview;
})();
