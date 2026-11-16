/* =====================================================================
   R1-10 v3 · Atelier 08 « Le réseau du Plateau : passif ou actif ? »
   Synthèse des ateliers 01 à 07 sur le modèle de l'étape 7 du projet,
   avec des données génériques (aucune valeur du dossier noté).
   ===================================================================== */
(() => {
  const g = 9.81, rho = 999, nu = 1e-6, EPS = 0.0015e-3; // PVC
  const PMIN = 2.2;               // bar, consigne Valdeau au point le plus défavorisé
  const VMIN = 0.5, VMAX = 1.5;   // m/s, plage de vitesse recommandée
  const DIAMS = [80, 100, 125, 150];
  const PRIX_M = { 80: 55, 100: 70, 125: 90, 150: 115 }; // €/m posé (valeurs illustratives)
  // surpresseur : achat 5 000 €, renouvelé au bout de 15 ans ; entretien 100 €/an ; 3 000 h de marche par an
  const POMPE = 5000, VIE = 15, ENTRETIEN = 100, HEURES = 3000, ANS = 20;
  const STOPS = [0.3, 0.6, 0.85]; // positions illustratives des groupes de singularités
  const $ = (id) => document.getElementById(id);
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const eur = (x) => (isFinite(x) ? Math.round(x / 100) * 100 : NaN);
  const feur = (x) => (isFinite(x) ? eur(x).toLocaleString("fr-FR") + " €" : "-");

  function hydro(Q, L, Dmm, K) {
    const D = Dmm / 1000, S = Math.PI * D * D / 4, vel = Q / S, Re = vel * D / nu;
    const r = window.LAB_R110.lambdaDarcy(Re, EPS / D);
    const hv = vel * vel / (2 * g);
    return { vel, Re, lam: r.lam, regime: r.regime, hf: r.lam * (L / D) * hv, hs: K * hv };
  }
  const pB = (PA, HMT, h, hy) => PA + rho * g * (HMT - h - hy.hf - hy.hs) / 1e5;
  // coût cumulé de la solution active à l'année t (achat, renouvellement, entretien, électricité)
  const actAt = (o, t) => o.pipeAct + (o.HMTmin > 0 ? POMPE * (1 + (t >= VIE ? 1 : 0)) + (ENTRETIEN + o.kWhAn * o.prix) * t : 0);

  function compute(v, s) {
    const Q = v("Qr") / 1000, L = v("Lr"), D = +s("Dr"), K = v("Kr"), h = v("hr"), PA = v("PAr");
    const HMT = v("HMTr"), eta = v("etar") / 100, prix = v("prixr");
    const hy = hydro(Q, L, D, K);
    const PB = pB(PA, HMT, h, hy);
    const Pel = rho * g * Q * HMT / eta;
    // scénario passif : plus petit diamètre du catalogue qui tient la pression sans pompe
    let Dpass = null;
    for (const d of DIAMS) { if (pB(PA, 0, h, hydro(Q, L, d, K)) >= PMIN) { Dpass = d; break; } }
    const vPass = Dpass ? hydro(Q, L, Dpass, K).vel : NaN;
    const costPass = Dpass ? PRIX_M[Dpass] * L : Infinity;
    // scénario actif : diamètre choisi + surpresseur réglé au plus juste
    const HMTmin = Math.max(0, (PMIN - pB(PA, 0, h, hy)) * 1e5 / (rho * g));
    const kWhAn = HMTmin > 0 ? rho * g * Q * HMTmin / eta / 1000 * HEURES : 0;
    const pipeAct = PRIX_M[D] * L;
    const o = { Q, L, D, h, PA, HMT, eta, prix, ...hy, PB, Pel, Dpass, vPass, costPass, HMTmin, kWhAn, pipeAct };
    o.costAct = actAt(o, ANS);
    o.okP = PB >= PMIN;
    o.okV = hy.vel >= VMIN && hy.vel <= VMAX;
    o.cheaper = !Dpass ? "actif" : HMTmin <= 0 ? "passif" : costPass <= o.costAct ? "passif" : "actif";
    // prix du kWh qui égalise les deux coûts sur 20 ans
    const fix = o.costAct - kWhAn * prix * ANS;
    o.cross = HMTmin > 0 && Dpass && kWhAn > 0 ? (costPass - fix) / (kWhAn * ANS) : NaN;
    // année où les coûts cumulés se croisent (si elle existe)
    o.year = NaN;
    if (HMTmin > 0 && Dpass) {
      const first = actAt(o, 0) < costPass;
      for (let t = 0; t <= ANS; t += 0.05) { if ((actAt(o, t) < costPass) !== first) { o.year = t; break; } }
      o.firstCheaper = first ? "actif" : "passif";
    }
    return o;
  }

  /* ---------- affichage ---------- */
  const kpi = (k, val, wide) => `<div class="kpi${wide ? " wide" : ""}"><div class="k">${k}</div><div class="v">${val}</div></div>`;
  let last = null;
  function update() {
    const v = (id) => +$(id).value, s = (id) => $(id).value;
    if (!$("Qr")) return;
    const o = compute(v, s);
    last = o;
    $("v-Qr").textContent = f(v("Qr"), 1) + " L/s";
    $("v-Lr").textContent = v("Lr") + " m";
    $("v-Dr").textContent = "Ø " + s("Dr") + " mm (PVC)";
    $("v-Kr").textContent = f(v("Kr"), 1);
    $("v-hr").textContent = f(v("hr"), 1) + " m";
    $("v-PAr").textContent = f(v("PAr"), 2) + " bar";
    $("v-HMTr").textContent = v("HMTr") > 0 ? f(v("HMTr"), 1) + " m" : "0 m (pas de surpresseur)";
    $("v-etar").textContent = v("etar") + " %";
    $("v-prixr").textContent = f(v("prixr"), 2) + " €/kWh";
    const vState = o.vel < VMIN ? "eau qui stagne" : o.vel > VMAX ? "trop rapide" : "dans la plage";
    const verdict = o.okP && o.okV ? "<strong>Conforme</strong> : pression et vitesse respectées."
      : !o.okP ? `<strong>Non conforme</strong> : il manque ${f((PMIN - o.PB), 2)} bar au Plateau.`
      : `<strong>Pression tenue</strong>, mais la vitesse sort de la plage ${f(VMIN, 1)} - ${f(VMAX, 1)} m/s.`;
    const passK = o.Dpass ? `Passif 20 ans · Ø ${o.Dpass} mm sans pompe${o.vPass < VMIN ? " (eau qui stagne)" : ""}` : "Passif 20 ans · aucun Ø du catalogue ne suffit";
    const actK = o.HMTmin > 0 ? `Actif 20 ans · Ø ${s("Dr")} mm + HMT ${f(o.HMTmin, 1)} m` : `Actif 20 ans · Ø ${s("Dr")} mm, pompe inutile`;
    $("out-reseau").innerHTML = [
      kpi("Vitesse v · " + vState, f(o.vel, 2) + " m/s"),
      kpi("Re", f(o.Re, 0)),
      kpi("Pertes linéaires h<sub>f</sub>", f(o.hf, 2) + " m"),
      kpi("Pertes singulières h<sub>s</sub>", f(o.hs, 2) + " m"),
      kpi("Pression au Plateau P<sub>B</sub>", f(o.PB, 2) + " bar", true),
      kpi("Diagnostic", verdict, true),
      kpi("Surpresseur" + (o.HMT > 0 ? " · HMT " + f(o.HMT, 1) + " m" : ""), o.HMT > 0 ? f(o.Pel / 1000, 2) + " kW" : "à l’arrêt", true),
      kpi(passK, feur(o.costPass)),
      kpi(actK, o.HMTmin > 0 ? feur(o.costAct) : "-"),
      kpi("Le moins cher sur 20 ans à " + f(o.prix, 2) + " €/kWh", (o.cheaper === "passif" ? "<strong>Solution passive</strong>" : "<strong>Solution active</strong>")
        + (isFinite(o.cross) && o.cross > 0 ? ` · les coûts s’égalisent vers ${f(o.cross, 2)} €/kWh` : ""), true),
    ].join("");
    draw(o);
  }

  /* ---------- schéma 2D : profil en long (haut) et coûts cumulés (bas) ---------- */
  function pal() {
    const dark = document.documentElement.dataset.theme !== "light";
    return dark
      ? { ink: "#e6f1f5", muted: "#9fb3bf", faint: "rgba(159,179,191,0.35)", ground: "#1d4a40", groundF: "rgba(29,74,64,0.55)", pipe: "#64869f", H: "#41c7e4", need: "#f47d7d", pump: "#3ecf8e", loss: "#f2b73f", ghost: "rgba(230,241,245,0.55)", act: "#e08a5a", card: "rgba(127,190,214,0.08)" }
      : { ink: "#14212b", muted: "#5a6b78", faint: "rgba(90,107,120,0.35)", ground: "#8bb39a", groundF: "rgba(139,179,154,0.45)", pipe: "#3d4f5f", H: "#0b6e8a", need: "#9b1c1c", pump: "#1f7a4c", loss: "#a15c00", ghost: "rgba(20,33,43,0.45)", act: "#c45c26", card: "rgba(61,79,95,0.06)" };
  }
  let probe = null; // abscisse relative survolée (0 à 1) ou null
  let geo = null;   // repères du dernier dessin (pour la sonde)
  // points de la ligne de charge (t relatif, H en m)
  function linePts(o) {
    const HA = o.PA * 1e5 / (rho * g);
    const Hp = HA + o.HMT;
    const t0 = o.HMT > 0 ? 0.04 : 0;
    const pts = [[0, HA]];
    if (o.HMT > 0) pts.push([t0, HA], [t0, Hp]);
    let H = Hp, tp = t0;
    STOPS.forEach((t) => { H -= o.hf * (t - tp) / (1 - t0); pts.push([t, H]); H -= o.hs / 3; pts.push([t, H]); tp = t; });
    H -= o.hf * (1 - tp) / (1 - t0);
    pts.push([1, H]);
    return pts;
  }
  const Hat = (pts, t) => {
    // dernière valeur atteinte à l'abscisse t (après un éventuel saut)
    let H = pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [ta, Ha] = pts[i - 1], [tb, Hb] = pts[i];
      if (t >= tb) { H = Hb; continue; }
      if (t >= ta && tb > ta) return Ha + (Hb - Ha) * (t - ta) / (tb - ta);
    }
    return H;
  };
  function draw(o) {
    const cv = $("cv-reseau");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const w = cv.width / 2, h = cv.height / 2;
    ctx.clearRect(0, 0, w, h);
    const P = pal();
    const A = window.LABV3 && window.LABV3.snapOut ? window.LABV3.snapOut("reseau") : null;
    const x0 = 70, x1 = w - 90, yb = 320, top = 46;
    const pts = linePts(o);
    const need = o.h + PMIN * 1e5 / (rho * g);
    const ptsA = A ? linePts(A) : null;
    let maxH = Math.max(...pts.map((p) => p[1]), need, o.h, 10) * 1.12;
    let minH = Math.min(0, pts[pts.length - 1][1]) - 2;
    if (window.LABV3S) { maxH = window.LABV3S("reseau", maxH); minH = window.LABV3S("reseau-min", minH, true); }
    const Y = (H) => yb - (Math.max(minH, Math.min(maxH, H)) - minH) / (maxH - minH) * (yb - top);
    const X = (t) => x0 + t * (x1 - x0);
    geo = { x0, x1, yb, top, Y, X, o, pts };
    // terrain
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(o.h)); ctx.lineTo(X(1), yb + 14); ctx.lineTo(X(0), yb + 14); ctx.closePath();
    ctx.fillStyle = P.groundF; ctx.fill();
    ctx.strokeStyle = P.ground; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(o.h)); ctx.stroke();
    // conduite
    ctx.strokeStyle = P.pipe; ctx.lineWidth = Math.max(3, o.D / 25);
    ctx.beginPath(); ctx.moveTo(X(0), Y(0) + 6); ctx.lineTo(X(1), Y(o.h) + 6); ctx.stroke();
    // charge requise en B
    ctx.setLineDash([6, 5]); ctx.strokeStyle = P.need; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(0.8), Y(need)); ctx.lineTo(X(1) + 30, Y(need)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = P.need; ctx.font = "12px 'Outfit', sans-serif"; ctx.textAlign = "right";
    ctx.fillText("charge requise (Plateau + 2,2 bar)", X(1) - 4, Y(need) + 15);
    // ligne de charge fantôme de l'état A (comparateur)
    const path = (p) => { ctx.beginPath(); p.forEach(([t, H], i) => (i ? ctx.lineTo(X(t), Y(H)) : ctx.moveTo(X(t), Y(H)))); ctx.stroke(); };
    if (ptsA) {
      ctx.setLineDash([7, 5]); ctx.strokeStyle = P.ghost; ctx.lineWidth = 2; path(ptsA); ctx.setLineDash([]);
      ctx.fillStyle = P.ghost; ctx.textAlign = "left"; ctx.font = "600 12px 'Outfit', sans-serif";
      ctx.fillText("A (figé)", X(0.62), Y(Hat(ptsA, 0.62)) - 8);
    }
    // ligne de charge actuelle
    ctx.strokeStyle = P.H; ctx.lineWidth = 2.6; path(pts);
    if (o.HMT > 0) { ctx.strokeStyle = P.pump; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(pts[2][0]), Y(pts[1][1])); ctx.lineTo(X(pts[2][0]), Y(pts[2][1])); ctx.stroke(); }
    // pression en B : colonne entre le sol et la ligne de charge
    const HB = pts[pts.length - 1][1];
    const ok = o.PB >= PMIN;
    ctx.strokeStyle = ok ? P.pump : P.need; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(X(1) + 14, Y(o.h)); ctx.lineTo(X(1) + 14, Y(Math.max(HB, o.h))); ctx.stroke(); ctx.lineCap = "butt";
    // étiquettes
    ctx.textAlign = "left"; ctx.font = "600 12px 'DM Mono', monospace"; ctx.fillStyle = P.ink;
    ctx.fillText("A · " + f(o.PA, 2) + " bar", X(0) - 40, Y(0) + 26);
    ctx.textAlign = "right";
    ctx.fillText("Plateau B · " + f(o.PB, 2) + " bar", X(1) + 20, Y(o.h) + 26);
    ctx.textAlign = "left"; ctx.font = "12px 'Outfit', sans-serif"; ctx.fillStyle = P.H;
    ctx.fillText("ligne de charge H", X(0.3), Y(Hat(pts, 0.3) + 0.01) - 10);
    if (o.HMT > 0) { ctx.fillStyle = P.pump; ctx.fillText("+ HMT " + f(o.HMT, 1) + " m", X(0.05) + 4, Y((pts[1][1] + pts[2][1]) / 2)); }
    ctx.fillStyle = P.loss;
    ctx.fillText("pertes hf + hs = " + f(o.hf + o.hs, 1) + " m", X(0.3), Y(Hat(pts, 0.3)) + 22);
    ctx.fillStyle = P.muted;
    ctx.fillText("dénivelé " + f(o.h, 1) + " m sur " + o.L + " m · survolez la conduite", X(0.36), yb + 28);
    // sonde piézométrique baladeuse
    if (probe != null) {
      const t = probe, z = o.h * t, H = Hat(pts, t), p = rho * g * (H - z) / 1e5;
      const xp = X(t);
      ctx.strokeStyle = P.H; ctx.lineWidth = 6; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(xp, Y(z)); ctx.lineTo(xp, Y(Math.max(H, z))); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(xp, Y(z)); ctx.lineTo(xp, top - 6); ctx.stroke(); ctx.setLineDash([]);
      const label = `x = ${f(t * o.L, 0)} m · z = ${f(z, 1)} m · H = ${f(H, 1)} m · P = ${f(p, 2)} bar`;
      ctx.font = "600 11.5px 'DM Mono', monospace";
      const tw = ctx.measureText(label).width + 14;
      const lx = Math.min(w - tw - 6, Math.max(6, xp - tw / 2));
      ctx.fillStyle = P.ink; ctx.globalAlpha = 0.9; ctx.fillRect(lx, top - 34, tw, 20); ctx.globalAlpha = 1;
      ctx.fillStyle = document.documentElement.dataset.theme !== "light" ? "#08131b" : "#ffffff";
      ctx.textAlign = "left"; ctx.fillText(label, lx + 7, top - 20);
    }
    drawCosts(ctx, o, P, w, h);
    ctx.textAlign = "left";
  }

  // coûts cumulés de t = 0 à 20 ans
  function drawCosts(ctx, o, P, w, h) {
    const x0 = 90, x1 = w - 40, y0 = h - 36, y1 = 382;
    ctx.fillStyle = P.card; ctx.fillRect(20, y1 - 34, w - 40, y0 - y1 + 62);
    ctx.fillStyle = P.ink; ctx.font = "600 13px 'Outfit', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Coûts cumulés sur 20 ans", 32, y1 - 14);
    if (!o.Dpass || !(o.HMTmin > 0)) {
      ctx.fillStyle = P.muted; ctx.font = "12px 'Outfit', sans-serif";
      ctx.fillText(!o.Dpass ? "Aucun diamètre du catalogue ne suffit sans pompe : seule la solution active est possible." : "Au diamètre choisi, aucun surpresseur n’est nécessaire : pas de comparaison à faire.", 32, y1 + 30);
      return;
    }
    const ys = [o.costPass, actAt(o, 0), actAt(o, ANS)];
    let cMax = Math.max(...ys) * 1.06, cMin = Math.min(...ys) * 0.94;
    const X = (t) => x0 + t / ANS * (x1 - x0);
    const Y = (c) => y0 - (c - cMin) / (cMax - cMin) * (y0 - y1);
    // axes
    ctx.strokeStyle = P.faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
    ctx.fillStyle = P.muted; ctx.font = "11px 'DM Mono', monospace"; ctx.textAlign = "center";
    for (let t = 0; t <= ANS; t += 5) ctx.fillText(t + " ans", X(t), y0 + 14);
    ctx.textAlign = "right";
    [cMin, (cMin + cMax) / 2, cMax].forEach((c) => ctx.fillText(Math.round(c / 1000) + " k€", x0 - 6, Y(c) + 4));
    // passif : investissement unique
    ctx.strokeStyle = P.H; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(X(0), Y(o.costPass)); ctx.lineTo(X(ANS), Y(o.costPass)); ctx.stroke();
    // actif : achat, pente annuelle, renouvellement de la pompe
    ctx.strokeStyle = P.act; ctx.beginPath();
    ctx.moveTo(X(0), Y(actAt(o, 0)));
    ctx.lineTo(X(VIE - 0.001), Y(actAt(o, VIE - 0.001)));
    ctx.lineTo(X(VIE), Y(actAt(o, VIE)));
    ctx.lineTo(X(ANS), Y(actAt(o, ANS)));
    ctx.stroke();
    ctx.font = "12px 'Outfit', sans-serif"; ctx.textAlign = "left";
    ctx.fillStyle = P.H; ctx.fillText("passif · Ø " + o.Dpass + " mm", X(0.4), Y(o.costPass) - 7);
    ctx.fillStyle = P.act; ctx.fillText("actif · Ø " + o.D + " mm + surpresseur", X(0.4), Y(actAt(o, 0)) + 16);
    ctx.fillStyle = P.muted; ctx.textAlign = "center";
    ctx.fillText("pompe renouvelée", X(VIE), Y(actAt(o, VIE)) - 8);
    if (isFinite(o.year)) {
      const c = o.costPass;
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(X(o.year), Y(c), 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = o.year > 14 ? "right" : "left";
      ctx.fillText(`les coûts se croisent vers ${f(o.year, 1)} ans`, X(o.year) + (o.year > 14 ? -8 : 8), Y(c) + 18);
    } else {
      ctx.fillStyle = P.ink; ctx.textAlign = "right";
      ctx.fillText(`pas de croisement sur 20 ans : la solution ${o.cheaper === "passif" ? "passive" : "active"} reste la moins chère`, x1, y1 - 14);
    }
  }

  window.LAB_R110_RESEAU = { compute, update, f, PMIN, ANS, actAt };

  function bind() {
    // le thème clair / sombre redessine le schéma
    new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const cv = $("cv-reseau");
    if (cv) {
      cv.addEventListener("pointermove", (e) => {
        if (!geo || !last) return;
        const r = cv.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * (cv.width / 2);
        const y = (e.clientY - r.top) / r.height * (cv.height / 2);
        const t = (x - geo.x0) / (geo.x1 - geo.x0);
        const np = t >= 0 && t <= 1 && y < geo.yb + 20 ? t : null;
        if (np !== probe) { probe = np; draw(last); }
      });
      cv.addEventListener("pointerleave", () => { probe = null; if (last) draw(last); });
    }
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();
