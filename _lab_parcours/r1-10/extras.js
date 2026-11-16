/* =====================================================================
   R1-10 v3 · compléments physiques
   - atelier 05 : mini-diagramme de Moody (point Re, λ mobile) et sonde au survol
   - atelier 07 : mode avancé « point de fonctionnement pompe / réseau »
   - atelier 01 : son de la conduite (si les sons d'interface sont activés)
   ===================================================================== */
(() => {
  const $ = (id) => document.getElementById(id);
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const dark = () => document.documentElement.dataset.theme !== "light";
  const pal = () => (dark()
    ? { ink: "#e6f1f5", muted: "#9fb3bf", faint: "rgba(159,179,191,0.28)", grid: "rgba(159,179,191,0.12)", acc: "#41c7e4", gold: "#ffd166", warn: "#f2b73f", ok: "#3ecf8e", act: "#e08a5a", card: "rgba(127,190,214,0.07)", inv: "#08131b" }
    : { ink: "#14212b", muted: "#5a6b78", faint: "rgba(90,107,120,0.3)", grid: "rgba(90,107,120,0.12)", acc: "#0b6e8a", gold: "#c98a12", warn: "#a15c00", ok: "#1f7a4c", act: "#c45c26", card: "rgba(61,79,95,0.05)", inv: "#ffffff" });
  const ctx2 = (cv) => { const c = cv.getContext("2d"); c.setTransform(2, 0, 0, 2, 0, 0); return { c, w: cv.width / 2, h: cv.height / 2 }; };

  /* ---------- atelier 05 : Moody ---------- */
  const EPS = [{ e: 0.0015, n: "PVC" }, { e: 0.25, n: "fonte" }, { e: 1.0, n: "béton" }];
  let linProbe = null;
  function moody(d) {
    const cv = $("cv-lin");
    if (!cv) return;
    const { c, w, h } = ctx2(cv);
    const P = pal();
    const L = window.LAB_R110.lambdaDarcy;
    const bx = 70, bw = w - 150, by = 330, bh = h - 72 - by;
    c.fillStyle = P.card; c.fillRect(20, by - 26, w - 40, bh + 52);
    c.fillStyle = P.ink; c.font = "600 12.5px 'Outfit', sans-serif"; c.textAlign = "left";
    c.fillText("Diagramme de Moody (λ en fonction de Re, échelles logarithmiques)", 32, by - 9);
    const lx = (Re) => bx + (Math.log10(Re) - 3) / (8 - 3) * bw;               // Re de 1e3 à 1e8
    const ly = (lam) => by + bh - (Math.log10(lam) - Math.log10(0.008)) / (Math.log10(0.1) - Math.log10(0.008)) * bh;
    c.strokeStyle = P.grid; c.lineWidth = 1;
    for (let k = 3; k <= 8; k++) { c.beginPath(); c.moveTo(lx(10 ** k), by); c.lineTo(lx(10 ** k), by + bh); c.stroke(); }
    [0.01, 0.02, 0.04, 0.08].forEach((l) => { c.beginPath(); c.moveTo(bx, ly(l)); c.lineTo(bx + bw, ly(l)); c.stroke(); });
    c.fillStyle = P.muted; c.font = "10.5px 'DM Mono', monospace"; c.textAlign = "center";
    for (let k = 3; k <= 8; k++) c.fillText("1e" + k, lx(10 ** k), by + bh + 12);
    c.textAlign = "right";
    [0.01, 0.02, 0.04, 0.08].forEach((l) => c.fillText(String(l).replace(".", ","), bx - 4, ly(l) + 3));
    // zone de transition
    c.fillStyle = P.grid; c.fillRect(lx(2000), by, lx(4000) - lx(2000), bh);
    const curve = (epsRel, color, lw, label) => {
      c.strokeStyle = color; c.lineWidth = lw; c.beginPath();
      let first = true;
      for (let i = 0; i <= 200; i++) {
        const Re = 10 ** (3 + i * 5 / 200);
        const lam = L(Re, epsRel).lam;
        if (lam < 0.008 || lam > 0.1) { first = true; continue; }
        if (first) { c.moveTo(lx(Re), ly(lam)); first = false; } else c.lineTo(lx(Re), ly(lam));
      }
      c.stroke();
      if (label) { const lam = L(1e8, epsRel).lam; c.fillStyle = color; c.font = "11px 'Outfit', sans-serif"; c.textAlign = "left"; c.fillText(label, bx + bw + 4, ly(lam) + 4); }
    };
    // courbes des trois matériaux au diamètre choisi, plus la courbe lisse
    const D = +$("Dlin").value / 1000;
    curve(0, P.faint, 1.2, "lisse");
    EPS.forEach((m) => curve(m.e / 1000 / D, Math.abs(m.e / 1000 / D - d.epsRel) < 1e-9 ? P.acc : P.faint, Math.abs(m.e / 1000 / D - d.epsRel) < 1e-9 ? 2.2 : 1.2, m.n));
    c.fillStyle = P.muted; c.font = "10.5px 'Outfit', sans-serif"; c.textAlign = "center";
    c.fillText("laminaire 64/Re", lx(1500), ly(64 / 1500) - 6);
    c.fillText("transition", (lx(2000) + lx(4000)) / 2, by + 11);
    // point de fonctionnement actuel
    if (d.Re >= 1000 && d.Re <= 1e8) {
      const x = lx(d.Re), y = ly(Math.min(0.1, Math.max(0.008, d.lam)));
      c.fillStyle = P.gold; c.shadowColor = P.gold; c.shadowBlur = dark() ? 10 : 0;
      c.beginPath(); c.arc(x, y, 5.5, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
      c.fillStyle = P.ink; c.font = "600 11px 'DM Mono', monospace"; c.textAlign = x > bx + bw * 0.7 ? "right" : "left";
      c.fillText(`Re = ${f(d.Re, 0)} · λ = ${f(d.lam, 4)} · ${d.regime.toLowerCase()}`, x + (c.textAlign === "right" ? -9 : 9), y - 8);
    }
    // sonde le long de la conduite (schéma du haut)
    const G = window.LAB_R110_LINGEO;
    if (linProbe != null && G) {
      const t = linProbe, x = G.xL + t * (G.xR - G.xL), y = G.y1 + t * (G.y2 - G.y1);
      c.strokeStyle = P.acc; c.globalAlpha = 0.35; c.lineWidth = 6;
      c.beginPath(); c.moveTo(x, G.pipeY); c.lineTo(x, y); c.stroke(); c.globalAlpha = 1;
      const label = `x = ${f(t * d.L, 0)} m · charge perdue = ${f(t * d.hf, 2)} m`;
      c.font = "600 11.5px 'DM Mono', monospace";
      const tw = c.measureText(label).width + 14, lx0 = Math.min(w - tw - 6, Math.max(6, x - tw / 2));
      c.fillStyle = P.ink; c.globalAlpha = 0.9; c.fillRect(lx0, 30, tw, 20); c.globalAlpha = 1;
      c.fillStyle = P.inv; c.textAlign = "left"; c.fillText(label, lx0 + 7, 44);
    }
    c.textAlign = "left";
  }
  window.LAB_R110_LIN = moody;

  /* ---------- atelier 07 : point de fonctionnement ---------- */
  const QMAX = 15; // L/s, débit à hauteur nulle de la pompe type
  function pf() {
    const cv = $("cv-pf");
    if (!cv || !$("H0pf")) return;
    const { c, w, h } = ctx2(cv);
    c.clearRect(0, 0, w, h);
    const P = pal();
    const HA = +$("HA").value, need = +$("HBneed").value, hp = +$("hptot").value, Q0 = +$("Qpompe").value, eta = +$("eta").value;
    const H0 = +$("H0pf").value;
    $("v-H0pf").textContent = H0 + " m";
    const Hs = need - HA;                  // hauteur statique à vaincre (m)
    const Rh = hp / (Q0 * Q0);             // pertes = Rh·Q² (Q en L/s)
    const a = H0 / (QMAX * QMAX);
    const Hr = (Q) => Hs + Rh * Q * Q, Hp = (Q) => H0 - a * Q * Q;
    const Qb = 0.6 * QMAX, et = (Q) => Math.max(0, eta * (1 - ((Q - Qb) / Qb) ** 2));
    const Qs = H0 > Hs ? Math.sqrt((H0 - Hs) / (Rh + a)) : NaN;
    const x0 = 64, x1 = w - 30, y0 = h - 46, y1 = 40;
    const hMax = Math.max(H0, Hs + Rh * Q0 * Q0 * 1.8, 10) * 1.1, hMin = Math.min(0, Hs) - 2;
    const X = (Q) => x0 + Q / QMAX * (x1 - x0), Y = (H) => y0 - (Math.max(hMin, Math.min(hMax, H)) - hMin) / (hMax - hMin) * (y0 - y1);
    c.strokeStyle = P.grid; c.lineWidth = 1;
    for (let q = 0; q <= QMAX; q += 3) { c.beginPath(); c.moveTo(X(q), y1); c.lineTo(X(q), y0); c.stroke(); }
    c.strokeStyle = P.faint; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y0); c.lineTo(x1, y0); c.stroke();
    c.fillStyle = P.muted; c.font = "10.5px 'DM Mono', monospace"; c.textAlign = "center";
    for (let q = 0; q <= QMAX; q += 3) c.fillText(q + " L/s", X(q), y0 + 14);
    c.textAlign = "right";
    for (let k = 0; k <= 4; k++) { const H = hMin + (hMax - hMin) * k / 4; c.fillText(f(H, 0) + " m", x0 - 5, Y(H) + 3); }
    const plot = (fn, color, lw, dash) => {
      c.strokeStyle = color; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath();
      let pen = false;
      for (let i = 0; i <= 240; i++) { const Q = i / 240 * QMAX, H = fn(Q); if (H > hMax || H < hMin) { pen = false; continue; } pen ? c.lineTo(X(Q), Y(H)) : c.moveTo(X(Q), Y(H)); pen = true; }
      c.stroke(); c.setLineDash([]);
    };
    // cloche de rendement (échelle de droite implicite : 100 % = haut du graphe)
    plot((Q) => hMin + et(Q) / 100 * (hMax - hMin), P.faint, 1.5, [4, 4]);
    plot(Hr, P.acc, 2.4);
    plot(Hp, P.act, 2.4);
    c.font = "12px 'Outfit', sans-serif"; c.textAlign = "left";
    c.fillStyle = P.acc; c.fillText("courbe du réseau : Hs + R·Q²", X(0.6), Y(Hr(0.6)) - 8);
    c.fillStyle = P.act; c.fillText("courbe de la pompe", X(QMAX * 0.62), Y(Hp(QMAX * 0.62)) - 8);
    c.fillStyle = P.muted; c.fillText("rendement η(Q)", X(Qb) - 30, Y(hMin + et(Qb) / 100 * (hMax - hMin)) - 6);
    // débit demandé
    c.strokeStyle = P.muted; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(X(Q0), y1); c.lineTo(X(Q0), y0); c.stroke(); c.setLineDash([]);
    c.fillStyle = P.muted; c.textAlign = "center"; c.fillText("Q demandé", X(Q0), y1 - 6);
    let msg;
    if (isFinite(Qs) && Qs <= QMAX) {
      c.fillStyle = P.gold; c.beginPath(); c.arc(X(Qs), Y(Hr(Qs)), 6, 0, Math.PI * 2); c.fill();
      msg = `Point de fonctionnement : Q = ${f(Qs, 1)} L/s, H = ${f(Hr(Qs), 1)} m, η ≈ ${f(et(Qs), 0)} %. ` + (Qs < Q0 * 0.97 ? `La pompe ne livre pas les ${f(Q0, 1)} L/s demandés.` : Qs > Q0 * 1.03 ? `Elle livre plus que demandé : on la bride (vanne) ou on la règle en vitesse.` : `Le débit demandé est tenu.`);
    } else msg = "Pas de point de fonctionnement : la pompe ne vainc même pas la hauteur statique.";
    c.fillStyle = P.ink; c.font = "600 12px 'Outfit', sans-serif"; c.textAlign = "left";
    c.fillText(msg, 20, h - 14);
  }

  /* ---------- atelier 01 : son de la conduite ---------- */
  let ac = null, gain = null, bp = null;
  function hum() {
    const on = (() => { try { return localStorage.getItem("labv2_sound") === "1"; } catch (_) { return false; } })();
    const cur = window.LABV2 && window.LABV2.current && window.LABV2.current();
    const Q = +($("Q") || {}).value / 1000, D = +($("D") || {}).value / 1000;
    const v = Q / (Math.PI * D * D / 4);
    const level = on && cur === "debit" && isFinite(v) ? Math.min(1, Math.max(0, (v - 1.5) / 4)) : 0;
    if (!ac && level <= 0) return;
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < n; i++) { const wn = Math.random() * 2 - 1; b0 = 0.997 * b0 + wn * 0.029591; b1 = 0.985 * b1 + wn * 0.032534; b2 = 0.95 * b2 + wn * 0.048056; d[i] = (b0 + b1 + b2 + wn * 0.1848) * 0.25; }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
      gain = ac.createGain(); gain.gain.value = 0;
      src.connect(bp); bp.connect(gain); gain.connect(ac.destination); src.start();
    }
    if (ac.state === "suspended") ac.resume();
    bp.frequency.setTargetAtTime(220 + v * 140, ac.currentTime, 0.1);
    gain.gain.setTargetAtTime(level * 0.12, ac.currentTime, 0.15);
  }

  function bind() {
    const lin = $("cv-lin");
    if (lin) {
      lin.addEventListener("pointermove", (e) => {
        const G = window.LAB_R110_LINGEO;
        if (!G) return;
        const r = lin.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * (lin.width / 2), y = (e.clientY - r.top) / r.height * (lin.height / 2);
        const t = (x - G.xL) / (G.xR - G.xL);
        const np = t >= 0 && t <= 1 && y < G.pipeY + 20 ? t : null;
        if (np !== linProbe) { linProbe = np; window.LABV3_REDRAW && window.LABV3_REDRAW("lineaire"); }
      });
      lin.addEventListener("pointerleave", () => { linProbe = null; window.LABV3_REDRAW && window.LABV3_REDRAW("lineaire"); });
    }
    ["HA", "HBneed", "hptot", "Qpompe", "eta", "H0pf"].forEach((id) => { const e = $(id); if (e) e.addEventListener("input", pf); });
    const adv = document.querySelector("details.v3-adv");
    if (adv) adv.addEventListener("toggle", pf);
    new MutationObserver(pf).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("input", hum);
    document.addEventListener("labv2:atelier", hum);
    document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#v2-sound")) setTimeout(hum, 50); });
    pf();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();
