/* =====================================================================
   Bascule de langue FR / EN des labs.
   Le texte français reste la source : chaque bloc de texte (élément qui ne contient que du
   texte et des balises en ligne) est cherché dans un dictionnaire FR → EN, les nombres étant
   remplacés par {0}, {1}... (le dictionnaire reste valable quelles que soient les valeurs).
   Les nœuds texte existants sont réécrits sur place (les références tenues par le code restent
   valides) ; le texte français d'origine est gardé pour revenir en arrière sans rechargement.
   Un MutationObserver traduit au fil de l'eau ce que le code ajoute ou modifie.
   Dictionnaire : window.LABI18N_EN = { "<clé française>": "<traduction>" }.
   ===================================================================== */
(() => {
  if (window.LABI18N) return;
  const doc = document;
  const KEY = "labs-lang";
  const D0 = window.LABI18N_EN || {};
  // une même formule peut apparaître avec ou sans enveloppe : clés et traductions ramenées à une seule forme
  const unwrap = (x) => x.split("<span><span></span></span>").join("<span></span>");
  const D = {};
  for (const k in D0) D[unwrap(k)] = unwrap(D0[k]);
  // phrases qui citent la réponse choisie (« … ») : modèle où la citation devient {q0}, {q1}…,
  // la citation étant traduite à part ; vaut pour toutes les réponses, pas seulement celle vue en test
  const QFR = /«\s*([^«»]*?)\s*»/g, QEN = /"([^"]*)"/g;
  const qTpl = (x, re) => { let i = 0; return x.replace(re, (m) => (re === QFR ? `«{q${i++}}»` : `"{q${i++}}"`)); };
  for (const k of Object.keys(D)) {
    if (k.indexOf("«") < 0) continue;
    const nk = (k.match(QFR) || []).length, nv = (D[k].match(QEN) || []).length;
    if (!nk || nk !== nv) continue;
    const kt = qTpl(k, QFR);
    if (!(kt in D)) D[kt] = qTpl(D[k], QEN);
  }
  // message composé de plusieurs phrases (retour de Camille : constat, bonne réponse citée, explication) :
  // chaque phrase est cherchée à part ; la traduction n'est retenue que si toutes les phrases sont connues
  function lookSentences(k) {
    if (/<(?!\/?(sub|sup|b|i|em|strong)>)/.test(k)) return null;
    const parts = k.split(/(?<=[.!?…»])\s+(?=[A-ZÀ-ÖØ-Ý«{<])/);
    if (parts.length < 2) return null;
    const out = [];
    for (const p of parts) {
      // numéros {n} renumérotés depuis 0 dans chaque phrase, puis remis à leur place
      const ids = [];
      const loc = p.trim().replace(/\{(\d+)\}/g, (m, d) => `{${ids.push(d) - 1}}`);
      const v = look1(loc);
      if (v == null) return null;
      out.push(v.replace(/\{(\d+)\}/g, (m, i) => (ids[i] != null ? `{${ids[i]}}` : m)));
    }
    return out.join(" ");
  }
  // « Libellé : valeur » (Prédiction : juste, Indice : …, Objectif : …) : libellé et valeur traduits séparément.
  // Libellés connus déduits des entrées « Libellé : {0} » du dictionnaire, plus quelques libellés du moteur.
  const LBL = { "Prédiction": "Prediction", "Explication": "Explanation", "Indice": "Hint", "Objectif": "Target", "Actuel": "Current",
    "Atelier suivant": "Next workshop", "Badge débloqué": "Badge unlocked", "Diagnostic": "Diagnosis", "Parcours": "Course", "Confiance": "Confidence" };
  for (const k of Object.keys(D)) {
    const a = k.match(/^([^:{}<>«»]{2,40}) : \{0\}$/), b = D[k].match(/^([^:{}<>"]{2,40}): \{0\}$/);
    if (a && b && !(a[1] in LBL)) LBL[a[1]] = b[1];
  }
  function lookLabel(k) {
    const m = k.match(/^([^:{}<>«»]{2,40}) : ([\s\S]+)$/);
    if (!m || !(m[1] in LBL)) return null;
    const ids = [];
    const loc = m[2].replace(/\{(\d+)\}/g, (x, d) => `{${ids.push(d) - 1}}`);
    let v = look1(loc);
    if (v == null) v = lookSentences(loc);
    if (v == null) { if (/[àâçéèêëîïôûùœ’]|\b(le|la|les|des|du|et|est|une|un|pour|dans|sur|avec|pas)\b/i.test(loc)) return null; v = loc; }
    return `${LBL[m[1]]}: ` + v.replace(/\{(\d+)\}/g, (x, i) => (ids[i] != null ? `{${ids[i]}}` : x));
  }
  function look(k) {
    const v = look1(k);
    if (v != null) return v;
    const w = lookSentences(k);
    return w != null ? w : lookLabel(k);
  }
  function look1(k) {
    if (k in D) return D[k];
    if (k.indexOf("«") < 0) return null;
    const qs = [];
    const kt = k.replace(QFR, (m, x) => `«{q${qs.push(x) - 1}}»`);
    const vt = D[kt];
    if (vt == null) return null;
    // citation traduite avec ses propres nombres renumérotés, puis replacée avec les numéros d'origine
    const trq = (q) => {
      const ids = [];
      const loc = q.replace(/\{(\d+)\}/g, (m, d) => `{${ids.push(d) - 1}}`);
      const t = D[loc];
      return t == null ? q : t.replace(/\{(\d+)\}/g, (m, i) => (ids[i] != null ? `{${ids[i]}}` : m));
    };
    return vt.replace(/\{q(\d+)\}/g, (m, i) => (qs[i] != null ? trq(qs[i]) : m));
  }
  // options de QCM : le texte de l'option seul, quelle que soit la lettre qui l'accompagne à l'écran
  const OPT = /^<(i|span)>(?:[A-D]|\{0\})<\/\1><span>([\s\S]*)<\/span>$/;
  for (const k of Object.keys(D)) {
    const a = k.match(OPT), b = D[k].match(OPT);
    if (a && b && !(a[2] in D)) D[a[2]] = b[2];
  }
  window.LABI18N_EN = D;
  let lang = "fr";
  try { lang = localStorage.getItem(KEY) === "en" ? "en" : "fr"; } catch (e) { /* stockage indisponible */ }
  // lien direct vers une langue : ?lang=en ou ?lang=fr (le choix est ensuite mémorisé)
  const qp = new URLSearchParams(location.search).get("lang");
  if (qp === "en" || qp === "fr") { lang = qp; try { localStorage.setItem(KEY, qp); } catch (e) { /* idem */ } }
  let collect = false;
  try { collect = localStorage.getItem("labs-i18n-collect") === "1"; } catch (e) { /* idem */ }
  const missing = new Map();

  const INL = new Set(["B", "I", "EM", "STRONG", "SUB", "SUP", "SPAN", "CODE", "BR", "A", "SMALL", "U", "MARK", "ABBR", "KBD", "Q", "S", "VAR", "DFN", "CITE", "TIME"]);
  const SKIP = "script, style, textarea, noscript, .katex, [data-noi18n], .i18n-sw";
  const ATTRS = ["title", "aria-label", "placeholder", "alt", "data-tip"];
  const NUM = /\d(?:[\d  ]*\d)?(?:,\d+)?/g;
  const WORD = /[A-Za-zÀ-ÿ]{2,}/;

  const enNum = (s) => s.replace(/,(?=\d+$)/, ".").replace(/[  ](?=\d)/g, ",");
  const norm = (s) => s.replace(/\s+/g, " ").trim();

  /* texte d'origine (français) de chaque nœud texte réécrit */
  const orig = new Map();
  const origAttr = new WeakMap();
  const touchedEl = new Set();
  const fr = (n) => (orig.has(n) ? orig.get(n) : n.nodeValue);

  const skipped = (el) => !el || (el.closest && el.closest(SKIP));
  let ioCache = new WeakMap();
  const inlineOnly = (el) => {
    if (ioCache.has(el)) return ioCache.get(el);
    const r = inlineOnly0(el);
    ioCache.set(el, r);
    return r;
  };
  const isKatex = (el) => el.classList && (el.classList.contains("katex") || el.classList.contains("katex-display"));
  // formule seule dans une enveloppe <span> (sans autre texte) : traitée comme la formule elle-même
  const isMath = (el) => isKatex(el) || (el.tagName === "SPAN" && el.children.length === 1 && isKatex(el.children[0]) && ![...el.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim()));
  const inlineOnly0 = (el) => {
    if (el.namespaceURI && el.namespaceURI !== "http://www.w3.org/1999/xhtml") return false;
    if (isMath(el)) return false;
    for (const c of el.querySelectorAll("*")) {
      if (isMath(c)) { if (c.parentElement.closest(".katex")) continue; continue; }
      if (c.closest(".katex")) continue;
      if (!INL.has(c.tagName)) return false;
    }
    return true;
  };
  /* bloc de traduction d'un nœud texte : le plus haut ancêtre « en ligne » dont le parent ne contient que du texte */
  const unitOfEl = (el) => {
    let p = el;
    if (!p || !inlineOnly(p)) return null;
    while (p.parentElement && INL.has(p.tagName) && inlineOnly(p.parentElement)) p = p.parentElement;
    return p;
  };
  const unitOf = (t) => unitOfEl(t.parentElement);

  /* clé canonique d'un bloc : balises sans attributs, nombres masqués */
  function canon(el, nums) {
    let s = "";
    for (const c of el.childNodes) {
      if (c.nodeType === 3) s += fr(c).replace(NUM, (m) => `{${nums.push(m) - 1}}`);
      else if (c.nodeType === 1) {
        const tg = c.tagName.toLowerCase();
        s += tg === "br" ? "<br>" : isMath(c) ? "<span></span>" : `<${tg}>${canon(c, nums)}</${tg}>`;
      }
    }
    return s;
  }

  const tplEl = doc.createElement("template");
  const fill = (s, nums) => s.replace(/\{(\d+)\}/g, (m, i) => (nums[i] != null ? enNum(nums[i]) : m));

  /* applique la traduction en conservant les éléments existants (mêmes balises, même ordre) */
  function sameShape(a, b) {
    const ea = [...a.children], eb = [...b.children];
    if (ea.length !== eb.length) return false;
    return ea.every((x, i) => x.tagName === eb[i].tagName && (isMath(x) || sameShape(x, eb[i])));
  }
  function setText(n, v) {
    if (!orig.has(n)) orig.set(n, n.nodeValue);
    if (n.nodeValue !== v) n.nodeValue = v;
  }
  function graft(dst, src) {
    // découpe en « trous » entre éléments ; le texte de chaque trou va dans le premier nœud texte existant
    const gaps = (el) => { const g = [[]]; for (const c of el.childNodes) { if (c.nodeType === 1) g.push([]); else if (c.nodeType === 3) g[g.length - 1].push(c); } return g; };
    if (gaps(dst).length !== gaps(src).length) return;
    const gd = gaps(dst), gs = gaps(src), ed = [...dst.children], es = [...src.children];
    gd.forEach((nodes, i) => {
      const txt = gs[i].map((n) => n.nodeValue).join("");
      if (nodes.length) { nodes.forEach((n, k) => setText(n, k ? "" : txt)); }
      else if (txt.trim()) {
        const tn = doc.createTextNode(txt);
        orig.set(tn, "");
        dst.insertBefore(tn, ed[i] || null);
      }
    });
    ed.forEach((e, i) => { if (!isMath(e)) graft(e, es[i]); });
  }

  function translateUnit(u) {
    const nums = [];
    const raw = canon(u, nums);
    if (!WORD.test(raw)) return;
    const k = norm(raw);
    const lead = /^\s/.test(raw) ? " " : "", trail = /\s$/.test(raw) && raw.trim() ? " " : "";
    const v = look(k);
    if (v == null) {
      // bloc inconnu en entier : on tente ses morceaux (ex. lettre d'option + texte de l'option)
      const kids = [...u.children].filter((c) => !isMath(c) && c.tagName !== "BR");
      if (kids.length > 1 || (kids.length === 1 && [...u.childNodes].some((c) => c.nodeType === 3 && WORD.test(fr(c))))) {
        kids.forEach((c) => { if (WORD.test(c.textContent)) translateUnit(c); });
        [...u.childNodes].forEach((c) => { if (c.nodeType === 3) translateText(c); });
        if (collect && !missing.has(k)) missing.set(k, 1);
        return;
      }
      if (collect && !missing.has(k)) missing.set(k, 1);
      if (lang === "en") restoreUnit(u);
      return;
    }
    if (lang !== "en") { restoreUnit(u); return; }
    tplEl.innerHTML = lead + fill(v, nums) + trail;
    const src = tplEl.content;
    const box = doc.createElement("div"); box.append(src);
    if (sameShape(u, box)) graft(u, box);
  }
  function restoreUnit(u) {
    const w = doc.createTreeWalker(u, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (orig.has(n)) { n.nodeValue = orig.get(n); orig.delete(n); }
  }
  function translateText(n) {
    // nœud texte isolé dans un élément qui contient aussi des blocs (ex. bouton avec icône)
    const raw = fr(n), nums = [];
    if (!WORD.test(raw)) return;
    const k = norm(raw.replace(NUM, (m) => `{${nums.push(m) - 1}}`));
    const v = look(k);
    if (v == null) { if (collect && !missing.has(k)) missing.set(k, 1); if (orig.has(n)) { n.nodeValue = orig.get(n); orig.delete(n); } return; }
    if (lang !== "en") { if (orig.has(n)) { n.nodeValue = orig.get(n); orig.delete(n); } return; }
    const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    setText(n, lead + fill(v, nums) + trail);
  }
  function translateAttrs(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      let o = origAttr.get(el);
      const cur = el.getAttribute(a);
      const src = o && a in o && o[a].en === cur ? o[a].fr : cur;
      const t = T(src);
      if (lang === "en" && t !== src) {
        if (!o) { o = {}; origAttr.set(el, o); }
        o[a] = { fr: src, en: t };
        touchedEl.add(el);
        if (cur !== t) el.setAttribute(a, t);
      } else if (o && a in o) {
        if (cur !== src) el.setAttribute(a, src);
        delete o[a];
      }
    }
  }

  let busy = false;
  function walk(root) {
    if (!root) return;
    ioCache = new WeakMap();
    if (root.nodeType === 3) { root = root.parentElement; if (!root) return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && skipped(root)) return;
    const units = new Set();
    const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const texts = [];
    if (root.nodeType === 1) translateAttrs(root);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (n.nodeType === 1) { translateAttrs(n); continue; }
      if (!WORD.test(n.nodeValue) && !orig.has(n)) continue;
      const u = unitOf(n);
      if (u) units.add(u); else texts.push(n);
    }
    // un bloc peut déborder la racine (texte modifié au milieu d'une phrase) : on le prend en entier
    units.forEach(translateUnit);
    texts.forEach(translateText);
  }
  function walkAround(node) {
    if (node.nodeType === 3) { const u = unitOf(node); if (u) translateUnit(u); else translateText(node); return; }
    const u = unitOfEl(node);
    if (u) translateUnit(u); else walk(node);
  }

  /* traduction d'une chaîne isolée (attributs, textes dessinés dans les canevas, code des labs) */
  function T(s) {
    if (s == null || (lang !== "en" && !collect)) return s;
    const str = String(s);
    if (!WORD.test(str)) return s;
    const nums = [];
    const k = norm(str.replace(NUM, (m) => `{${nums.push(m) - 1}}`));
    const v = look(k);
    if (v == null) { if (collect) missing.set(k, 1); return s; }
    return lang === "en" ? fill(v, nums) : s;
  }

  const mo = new MutationObserver((recs) => {
    if (busy) return;
    busy = true;
    try {
      const seen = new Set();
      ioCache = new WeakMap();
      for (const r of recs) {
        let n = r.type === "childList" ? r.target : r.target;
        if (r.type === "characterData") {
          // le code a réécrit un texte : la nouvelle valeur est la source française
          if (orig.has(n)) orig.delete(n);
        }
        if (r.type === "attributes") { if (!skipped(n)) translateAttrs(n); continue; }
        if (r.type === "childList") r.addedNodes.forEach((a) => { if (a.nodeType === 3 && orig.has(a)) orig.delete(a); });
        if (seen.has(n)) continue;
        seen.add(n);
        const el = n.nodeType === 3 ? n.parentElement : n;
        if (!el || skipped(el) || !el.isConnected) continue;
        walkAround(n.nodeType === 3 ? n : el);
      }
    } finally {
      mo.takeRecords();
      busy = false;
    }
  });

  /* fenêtres du navigateur (confirmation de remise à zéro, alertes) */
  ["alert", "confirm", "prompt"].forEach((f) => {
    const o = window[f];
    if (typeof o === "function") window[f] = function (m, ...a) { return o.call(window, T(m), ...a); };
  });

  /* canevas 2D (graphiques, textures des étiquettes 3D) */
  const CP = CanvasRenderingContext2D.prototype;
  const fillT = CP.fillText, strokeT = CP.strokeText, measT = CP.measureText;
  CP.fillText = function (t, ...a) { return fillT.call(this, T(t), ...a); };
  CP.strokeText = function (t, ...a) { return strokeT.call(this, T(t), ...a); };
  CP.measureText = function (t) { return measT.call(this, T(t)); };

  function translateAll() {
    busy = true;
    try {
      walk(doc.body);
      if (doc.title) {
        if (!translateAll.title) translateAll.title = doc.title;
        doc.title = lang === "en" ? T(translateAll.title) : translateAll.title;
      }
    } finally { mo.takeRecords(); busy = false; }
  }
  function restoreAll() {
    busy = true;
    try {
      orig.forEach((v, n) => { if (n.nodeValue !== v) n.nodeValue = v; });
      orig.clear();
      touchedEl.forEach((el) => { const o = origAttr.get(el); if (o) for (const a in o) el.setAttribute(a, o[a].fr); origAttr.delete(el); });
      touchedEl.clear();
      if (translateAll.title) doc.title = translateAll.title;
    } finally { mo.takeRecords(); busy = false; }
  }

  /* ---------------- sélecteur FR | EN, fixe en haut à droite ---------------- */
  let sw;
  const CSS = `
.i18n-sw{position:fixed;top:12px;right:14px;z-index:2147483000;display:flex;padding:3px;gap:2px;border-radius:999px;
  background:rgba(255,255,255,.92);border:1px solid rgba(20,24,36,.14);box-shadow:0 4px 14px rgba(0,0,0,.12);
  backdrop-filter:blur(8px);font:600 12.5px/1 Outfit,"Segoe UI",system-ui,sans-serif}
.i18n-sw button{all:unset;cursor:pointer;padding:6px 10px;border-radius:999px;color:#4a5060;letter-spacing:.04em}
.i18n-sw button:hover{color:#1f2430}
.i18n-sw button[aria-pressed="true"]{background:#c25a1e;color:#fff}
.i18n-sw button:focus-visible{outline:2px solid #e08a5a;outline-offset:2px}
[data-theme="dark"] .i18n-sw{background:rgba(22,27,40,.88);border-color:rgba(255,255,255,.16);box-shadow:0 4px 14px rgba(0,0,0,.4)}
[data-theme="dark"] .i18n-sw button{color:#c4cad6}
[data-theme="dark"] .i18n-sw button:hover{color:#fff}
[data-theme="dark"] .i18n-sw button[aria-pressed="true"]{background:#e08a5a;color:#14161d}
.i18n-sw.i18n-inline{position:static;box-shadow:none;backdrop-filter:none}
@media print{.i18n-sw{display:none}}`;
  function buildSwitch() {
    const st = doc.createElement("style");
    st.textContent = CSS;
    doc.head.append(st);
    sw = doc.createElement("div");
    sw.className = "i18n-sw";
    sw.setAttribute("role", "group");
    sw.setAttribute("aria-label", "Langue / Language");
    sw.innerHTML = '<button type="button" data-l="fr" lang="fr" title="Français">FR</button><button type="button" data-l="en" lang="en" title="English">EN</button>';
    sw.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setLang(b.dataset.l); });
    // emplacement réservé dans la page (barre du site) ; sinon fixé en haut à droite
    const mount = doc.querySelector("[data-i18n-mount]");
    if (mount) { sw.classList.add("i18n-inline"); mount.replaceWith(sw); } else doc.body.append(sw);
    syncSwitch();
  }
  const syncSwitch = () => sw && sw.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === lang)));

  function setLang(l) {
    l = l === "en" ? "en" : "fr";
    if (l === lang) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* idem */ }
    doc.documentElement.lang = l;
    syncSwitch();
    if (l === "en") translateAll(); else restoreAll();
    window.dispatchEvent(new CustomEvent("labs:lang", { detail: { lang: l } }));
    // les canevas (graphiques, étiquettes peintes) sont redessinés par leur propre code
    window.dispatchEvent(new Event("resize"));
  }

  function start() {
    doc.documentElement.lang = lang;
    buildSwitch();
    if (lang === "en" || collect) translateAll();
    mo.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();

  window.LABI18N = {
    T, setLang,
    get lang() { return lang; },
    missing: () => [...missing.keys()],
    // contrôle : blocs visibles restés en français (clés françaises), pour l'audit de traduction
    audit() {
      const FRX = /[àâçéèêëîïôûùœ’«»]|\b(le|la|les|des|du|et|est|une|un|pour|dans|sur|avec|pas|vous|au|aux|de|en|ou|qui|que)\b/i;
      const out = new Set();
      ioCache = new WeakMap();
      const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (orig.has(n) || !WORD.test(n.nodeValue) || !FRX.test(n.nodeValue)) continue;
        const el = n.parentElement;
        if (!el || skipped(el) || !el.getClientRects().length) continue;
        const u = unitOf(n);
        const nums = [];
        out.add(norm(u ? canon(u, nums) : n.nodeValue.replace(NUM, (m) => `{${nums.push(m) - 1}}`)));
      }
      return [...out];
    },
    canonOf(html) { const b = doc.createElement("div"); b.innerHTML = html; const nums = []; return norm(canon(b, nums)); },
  };
})();
