# -*- coding: utf-8 -*-
"""Correctifs ciblés du code v1 des laboratoires (propositions d'amélioration, octobre 2026).

Chaque correctif est un couple (texte d'origine, texte nouveau) :
  - si le texte nouveau est déjà présent, le correctif est ignoré (réapplication sans effet) ;
  - sinon le texte d'origine doit apparaître exactement une fois, faute de quoi on s'arrête
    (aucun remplacement silencieux : une v1 modifiée à la main est signalée tout de suite).
Les correctifs s'appliquent au texte v1 déjà nettoyé (tirets courts, polices de la v2).
"""
from __future__ import annotations


class PatchError(Exception):
    pass


def apply_patches(html: str, lab_id: str) -> tuple[str, list[str]]:
    done = []
    for name, old, new in COMMON + PATCHES.get(lab_id, []):
        if new and new in html:
            continue
        n = html.count(old)
        if not new and n == 0:
            continue  # suppression déjà faite
        if n != 1:
            raise PatchError(f"{lab_id} · correctif « {name} » : texte d'origine trouvé {n} fois (attendu : 1)")
        html = html.replace(old, new)
        done.append(name)
    return html, done


# ---------------------------------------------------------------------------
# Communs aux six laboratoires
# ---------------------------------------------------------------------------
COMMON = [
    (
        "police DM Sans retirée (doublon : la v2 impose Outfit et DM Mono)",
        '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />\n',
        "",
    ),
    (
        "formules lisibles hors-ligne (KaTeX absent)",
        "    return `<span class=\"tex-fallback\">${src}</span>`;",
        "    return `<span class=\"tex-fallback\">${window.LABV2_TEX ? window.LABV2_TEX(src) : src}</span>`;",
    ),
]

PATCHES: dict[str, list[tuple[str, str, str]]] = {}

# ---------------------------------------------------------------------------
# R1-1
# ---------------------------------------------------------------------------
PATCHES["r1-1"] = [
    (
        "bannière anti-spoil : nom exact du sujet noté",
        "dans le dossier Suivi de chantier Excel.</p>",
        "dans le dossier « Suivi de Chantier sur Excel ».</p>",
    ),
]

# ---------------------------------------------------------------------------
# R1-10 : λ laminaire / transition / turbulent, mode « débit Q imposé »
# ---------------------------------------------------------------------------
PATCHES["r1-10"] = [
    (
        "atelier 05 : choix vitesse imposée / débit imposé",
        """            <div class="ctrl">
              <label>Longueur <span class="tex" data-tex="L"></span> <strong id="v-L">200 m</strong></label>""",
        """            <div class="ctrl">
              <label>Mode de dimensionnement</label>
              <span class="hint">En projet AEP, c’est le débit des abonnés qui est imposé : à débit fixé, réduire D fait grimper la vitesse et les pertes.</span>
              <select id="linMode">
                <option value="v" selected>Vitesse v imposée</option>
                <option value="Q">Débit Q imposé (chantier)</option>
              </select>
            </div>
            <div class="ctrl">
              <label>Longueur <span class="tex" data-tex="L"></span> <strong id="v-L">200 m</strong></label>""",
    ),
    (
        "atelier 05 : curseur de vitesse identifié",
        """            <div class="ctrl">
              <label>Vitesse <span class="tex" data-tex="v"></span> <strong id="v-vlin">0,80 m/s</strong></label>
              <input type="range" id="vlin" min="0.2" max="2.5" step="0.05" value="0.8" />
            </div>""",
        """            <div class="ctrl" id="ctrl-vlin">
              <label>Vitesse <span class="tex" data-tex="v"></span> <strong id="v-vlin">0,80 m/s</strong></label>
              <input type="range" id="vlin" min="0.2" max="2.5" step="0.05" value="0.8" />
            </div>
            <div class="ctrl" id="ctrl-Qlin" hidden>
              <label>Débit <span class="tex" data-tex="Q"></span> <strong id="v-Qlin">9,8 L/s</strong></label>
              <span class="hint">À débit fixé, <span class="tex" data-tex="h_f \\propto \\lambda L Q^{2}/D^{5}"></span> : diviser D par 2 multiplie les pertes par environ 32.</span>
              <input type="range" id="Qlin" min="0.5" max="40" step="0.1" value="9.8" />
            </div>""",
    ),
    (
        "atelier 05 : λ selon le régime (64/Re, raccord, Swamee-Jain)",
        """  function updateLin() {
    const L = +$("L").value;
    const D = +$("Dlin").value / 1000;
    const v = +$("vlin").value;
    const eps_mm = +$("eps").value;
    const eps = eps_mm / 1000;
    $("v-L").textContent = L + " m";
    $("v-Dlin").textContent = $("Dlin").value + " mm";
    $("v-vlin").textContent = fmt(v, 2) + " m/s";
    $("v-eps").textContent = $("eps").selectedOptions[0].text;
    const nu = 1e-6;
    const Re = v * D / nu;
    const lam = swameeJain(Re, eps / D);
    const hf = lam * (L / D) * (v * v) / (2 * g);
    $("out-lin").innerHTML = kpiHTML([
      { texK: "Re", v: fmt(Re, 0) },
      { texK: "\\\\lambda", kSuffix: "(Swamee-Jain)", v: fmt(lam, 4) },
      { texK: "\\\\varepsilon/D", kSuffix: "(rugosité relative)", v: (eps / D).toExponential(2).replace(".", ",") },
      { texK: "h_f", kSuffix: "(perte de charge linéaire)", v: fmt(hf, 2) + " mCE", wide: true },
    ]);
    drawLin(hf, L, lam);
  }""",
        """  /* λ de Darcy selon le régime : 64/Re en laminaire, raccord cubique entre 2000 et 4000,
     Swamee-Jain en turbulent ; le régime turbulent est qualifié par la rugosité réduite k+ */
  function lambdaDarcy(Re, epsRel) {
    if (Re < 2000) return { lam: 64 / Math.max(Re, 1), regime: "Laminaire" };
    const sj = (R) => { const d = Math.log10(epsRel / 3.7 + 5.74 / Math.pow(R, 0.9)); return 0.25 / (d * d); };
    if (Re < 4000) {
      const t = (Re - 2000) / 2000, s = t * t * (3 - 2 * t);
      return { lam: (64 / 2000) * (1 - s) + sj(4000) * s, regime: "Transition" };
    }
    const lam = sj(Re);
    const kp = Re * epsRel * Math.sqrt(lam / 8);
    return { lam, regime: kp < 5 ? "Turbulent lisse" : kp < 70 ? "Turbulent de transition" : "Turbulent rugueux" };
  }
  function updateLin() {
    const L = +$("L").value;
    const D = +$("Dlin").value / 1000;
    const modeQ = $("linMode").value === "Q";
    $("ctrl-vlin").hidden = modeQ;
    $("ctrl-Qlin").hidden = !modeQ;
    const S = Math.PI * D * D / 4;
    const Q = modeQ ? +$("Qlin").value / 1000 : +$("vlin").value * S;
    const v = modeQ ? Q / S : +$("vlin").value;
    const eps_mm = +$("eps").value;
    const eps = eps_mm / 1000;
    $("v-L").textContent = L + " m";
    $("v-Dlin").textContent = $("Dlin").value + " mm";
    $("v-vlin").textContent = fmt(v, 2) + " m/s";
    $("v-Qlin").textContent = fmt(Q * 1000, 1) + " L/s";
    $("v-eps").textContent = $("eps").selectedOptions[0].text;
    const nu = 1e-6;
    const Re = v * D / nu;
    const res = lambdaDarcy(Re, eps / D);
    const lam = res.lam;
    const hf = lam * (L / D) * (v * v) / (2 * g);
    $("out-lin").innerHTML = kpiHTML([
      { texK: "Re", v: fmt(Re, 0) },
      { texK: "\\\\lambda", kSuffix: "(" + res.regime + ")", v: fmt(lam, 4) },
      { texK: "\\\\varepsilon/D", kSuffix: "(rugosité relative)", v: (eps / D).toExponential(2).replace(".", ",") },
      modeQ
        ? { texK: "v=Q/S", kSuffix: "(vitesse obtenue)", v: fmt(v, 2) + " m/s" }
        : { texK: "Q=v\\\\,S", kSuffix: "(débit transporté)", v: fmt(Q * 1000, 1) + " L/s" },
      { texK: "h_f", kSuffix: "(perte de charge linéaire)", v: fmt(hf, 2) + " mCE", wide: true },
      {
        k: "Lecture",
        v: modeQ
          ? "Débit imposé : <strong>h<sub>f</sub> ∝ λ L Q²/D⁵</strong>. Un diamètre un peu trop petit fait exploser les pertes."
          : "Vitesse imposée : h<sub>f</sub> ∝ λ L v²/D. Passez en <strong>débit imposé</strong> pour voir le vrai poids du diamètre.",
        wide: true,
      },
    ]);
    drawLin(hf, L, lam);
  }""",
    ),
    (
        "atelier 05 : nouvelles commandes réinitialisables",
        """    lineaire: ["L", "Dlin", "vlin", "eps"],""",
        """    lineaire: ["linMode", "L", "Dlin", "vlin", "Qlin", "eps"],""",
    ),
]

# ---------------------------------------------------------------------------
# R1-13 : bannière
# ---------------------------------------------------------------------------
PATCHES["r1-13"] = [
    (
        "bannière anti-spoil : nom exact du sujet noté",
        "Elles ne donnent aucune valeur à recopier dans le dossier noté.</p>",
        "Elles ne donnent aucune valeur à recopier dans le dossier « Qualification d’un Béton de Construction ».</p>",
    ),
]

# ---------------------------------------------------------------------------
# R2-9 : analogie électrique, jonction mur / plancher, matériaux types
# ---------------------------------------------------------------------------
PATCHES["r2-9"] = [
    (
        "atelier 01 : place pour le circuit équivalent",
        '<canvas id="cv-cond" width="720" height="340"></canvas>',
        '<canvas id="cv-cond" width="720" height="450"></canvas>',
    ),
    (
        "atelier 01 : la paroi garde sa hauteur d'origine",
        "    const xL = 80, xR = w - 80, yTop = 36, yBot = h - 50;\n    const w1 = (e1 / eTot) * (xR - xL), w2 = (e2 / eTot) * (xR - xL);",
        "    const xL = 80, xR = w - 80, yTop = 36, yBot = 340 - 50;\n    const w1 = (e1 / eTot) * (xR - xL), w2 = (e2 / eTot) * (xR - xL);",
    ),
    (
        "atelier 01 : analogie électrique synchronisée (ΔT = R·φ)",
        """    ctx.fillText("Intérieur →", xL, yBot + 28);
    ctx.fillText("← Extérieur", xR - 90, yBot + 28);
  }

  function updateSurf() {""",
        """    ctx.fillText("Intérieur →", xL, yBot + 28);
    ctx.fillText("← Extérieur", xR - 90, yBot + 28);
    // Analogie électrique : T ↔ potentiel, φ ↔ courant, R = e/λ ↔ résistance (longueur ∝ R)
    const R1 = e1 / +$("l1").value, R2 = e2 / +$("l2").value, Rt = R1 + R2;
    const phi = (Ti - Te) / Rt;
    const yC = 392, xm = xL + (R1 / Rt) * (xR - xL);
    ctx.fillStyle = P.muted;
    ctx.font = "600 12px 'Outfit', sans-serif";
    ctx.fillText("Circuit équivalent : longueur des résistances ∝ R = e/λ, même flux φ dans toute la branche", xL, yC - 30);
    const zig = (xa, xb, col) => {
      const n = Math.max(3, Math.round((xb - xa) / 14));
      const st = (xb - xa - 12) / n;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xa, yC);
      ctx.lineTo(xa + 6, yC);
      for (let i = 0; i < n; i++) ctx.lineTo(xa + 6 + (i + 0.5) * st, yC + (i % 2 ? 7 : -7));
      ctx.lineTo(xb - 6, yC);
      ctx.lineTo(xb, yC);
      ctx.stroke();
    };
    zig(xL, xm, P.iso === "#8a6a48" ? "#c49a6c" : "#8a6a48");
    zig(xm, xR, P.axis);
    [[xL, Ti, P.heat, -18, -12], [xm, T12, P.ink, -18, -12], [xR, Te, P.vapor, 9, 4]].forEach(([x, T, c, dx, dy]) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x, yC, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.font = "11px 'DM Mono', monospace";
      ctx.fillText(fmt(T, 1) + " °C", x + dx, yC + dy);
    });
    ctx.fillStyle = P.muted;
    ctx.font = "11px 'DM Mono', monospace";
    ctx.fillText("R₁ = " + fmt(R1, 2), (xL + xm) / 2 - 22, yC + 24);
    ctx.fillText("R₂ = " + fmt(R2, 2), (xm + xR) / 2 - 22, yC + 24);
    ctx.fillStyle = P.heat;
    ctx.font = "600 12px 'Outfit', sans-serif";
    ctx.fillText("φ = " + fmt(phi, 1) + " W/m² →", xL, yC + 46);
    ctx.fillStyle = P.muted;
    ctx.font = "12px 'Outfit', sans-serif";
    ctx.fillText("ΔT₁ = R₁·φ = " + fmt(R1 * phi, 1) + " K   ·   ΔT₂ = R₂·φ = " + fmt(R2 * phi, 1) + " K", xL + 150, yC + 46);
  }

  function updateSurf() {""",
    ),
    (
        "atelier 06 : place pour la jonction mur / plancher",
        '<canvas id="cv-rehab" width="720" height="360"></canvas>',
        '<canvas id="cv-rehab" width="720" height="650"></canvas>',
    ),
    (
        "atelier 06 : lignes de flux à la jonction mur / plancher",
        """    ctx.fillText("Extérieur", xR - 70, y0 + th + 48);
  }""",
        """    ctx.fillText("Extérieur", xR - 70, y0 + th + 48);
    // Jonction mur / plancher en coupe, lignes de flux de chaleur (lecture qualitative)
    const iti = pos === "iti";
    const J0 = 352, top = J0 + 14, bot = J0 + 266;
    const wx = 430, ww = 44, isoW = 24, slabY = J0 + 116, slabH = 30, sx0 = 120;
    ctx.fillStyle = P.muted;
    ctx.font = "600 13px 'Outfit', sans-serif";
    ctx.fillText("Jonction mur / plancher en coupe : lignes de flux de chaleur (qualitatif)", 40, J0 - 4);
    ctx.fillStyle = "rgba(224,138,90,0.08)";
    ctx.fillRect(40, top, (iti ? wx - isoW : wx) - 40, bot - top);
    ctx.fillStyle = "rgba(107,184,201,0.10)";
    const xo = iti ? wx + ww : wx + ww + isoW;
    ctx.fillRect(xo, top, w - 40 - xo, bot - top);
    ctx.fillStyle = P.beton;
    ctx.fillRect(wx, top, ww, bot - top);
    ctx.fillRect(sx0, slabY, wx - sx0, slabH);
    ctx.fillStyle = P.iso;
    if (iti) {
      ctx.fillRect(wx - isoW, top, isoW, slabY - top);
      ctx.fillRect(wx - isoW, slabY + slabH, isoW, bot - slabY - slabH);
    } else ctx.fillRect(wx + ww, top, isoW, bot - top);
    const head = (x, y, a) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8 * Math.cos(a - 0.45), y - 8 * Math.sin(a - 0.45));
      ctx.lineTo(x - 8 * Math.cos(a + 0.45), y - 8 * Math.sin(a + 0.45));
      ctx.closePath();
      ctx.fill();
    };
    const xs = 60, xe = w - 56;
    const ys = [top + 22, top + 50, top + 78, slabY - 10, slabY + slabH + 10, bot - 78, bot - 50, bot - 22];
    ctx.strokeStyle = P.heat;
    ctx.fillStyle = P.heat;
    ys.forEach((y, i) => {
      ctx.lineWidth = 1.7;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(xs, y);
      if (iti && i > 0 && i < ys.length - 1) {
        // l'isolant intérieur est contourné : les lignes plongent dans la dalle et se resserrent dans le nez de dalle
        const yc = slabY + slabH / 2 + (i - 3.5) * 3.4;
        ctx.bezierCurveTo(150, y, 230, yc, 300, yc);
        ctx.lineTo(wx + ww, yc);
        const yOut = yc + (y - yc) * 0.45;
        ctx.bezierCurveTo(wx + ww + 70, yc, wx + ww + 120, yOut, xe, yOut);
        ctx.stroke();
        head(xe, yOut, 0);
      } else if (iti) {
        // les lignes extrêmes traversent l'isolant : flux faible
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([5, 5]);
        ctx.lineTo(xe, y);
        ctx.stroke();
        ctx.setLineDash([]);
        head(xe, y, 0);
      } else {
        ctx.lineTo(xe, y);
        ctx.stroke();
        head(xe, y, 0);
      }
    });
    ctx.globalAlpha = 1;
    ctx.font = "12px 'Outfit', sans-serif";
    ctx.fillStyle = iti ? P.danger : P.ok;
    ctx.fillText(iti
      ? "ITI : la dalle traverse l’isolant, les lignes se resserrent dans le nez de dalle (pont thermique)."
      : "ITE : le manteau isolant est continu, les lignes restent parallèles et régulièrement espacées.", 40, bot + 26);
    ctx.fillStyle = P.muted;
    ctx.fillText("Intérieur (dalle de plancher)", 50, top + 14);
    ctx.fillText("Extérieur", xe - 60, top + 14);
  }""",
    ),
    (
        "atelier 05 : matériaux types",
        """            <div class="ctrl">
              <label>Épaisseur <span class="tex" data-tex="e"></span> <strong id="v-ed">22 cm</strong></label>""",
        """            <div class="ctrl">
              <label>Matériau type</label>
              <span class="hint">Remplit λ, ρ et c<sub>p</sub> (valeurs usuelles arrondies au pas des curseurs) ; l’épaisseur reste la vôtre.</span>
              <select id="matd">
                <option value="perso" selected>Perso</option>
                <option value="beton">Béton plein</option>
                <option value="bois">Fibre de bois</option>
                <option value="laine">Laine de verre</option>
                <option value="terre">Terre crue</option>
              </select>
            </div>
            <div class="ctrl">
              <label>Épaisseur <span class="tex" data-tex="e"></span> <strong id="v-ed">22 cm</strong></label>""",
    ),
    (
        "atelier 05 : matériau type réinitialisable",
        """    dyn: ["ed", "ld", "rd", "cp"],""",
        """    dyn: ["matd", "ed", "ld", "rd", "cp"],""",
    ),
    (
        "atelier 05 : préréglages appliqués aux curseurs",
        """  function resetGroup(key) {""",
        """  /* matériaux types de l'atelier dynamique (λ, ρ, cp) ; un réglage manuel repasse en « Perso » */
  const MATS_DYN = {
    beton: { ld: 1.75, rd: 2400, cp: 1000 },
    bois: { ld: 0.04, rd: 160, cp: 2000 },
    laine: { ld: 0.04, rd: 20, cp: 1040 },
    terre: { ld: 1.1, rd: 1900, cp: 1000 },
  };
  $("matd").addEventListener("input", () => {
    const m = MATS_DYN[$("matd").value];
    if (!m) return;
    Object.entries(m).forEach(([k, v]) => { $(k).value = v; syncFill($(k)); });
    updateDyn();
  });
  ["ld", "rd", "cp"].forEach((k) => $(k).addEventListener("input", (e) => { if (e.isTrusted) $("matd").value = "perso"; }));
  function resetGroup(key) {""",
    ),
]

# ---------------------------------------------------------------------------
# R3-10 : Rsi / Rse dans T(x), GES du DPE, analogie kW / kWh, Sankey PAC + VMC
# ---------------------------------------------------------------------------
PATCHES["r3-10"] = [
    (
        "atelier 01 : profil T(x) avec les couches d'air Rsi et Rse",
        """    const Rmat = Riso + Rsup;
    const Ti = 20, Te = 0;
    const T12 = Ti - (Ti - Te) * (Riso / Rmat);
    const Y = (T) => {
      const Tmin = -2, Tmax = 22;
      return yBot - ((T - Tmin) / (Tmax - Tmin)) * (yBot - yTop - 50) - 25;
    };
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xL, Y(Ti));
    ctx.lineTo(xL + wI, Y(T12));
    ctx.lineTo(xR, Y(Te));
    ctx.stroke();
    [[xL, Ti], [xL + wI, T12], [xR, Te]].forEach(([x, T]) => {
      ctx.fillStyle = P.accent;
      ctx.beginPath(); ctx.arc(x, Y(T), 5, 0, TAU); ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.font = "12px 'DM Mono', monospace";
      ctx.fillText(fmt(T, 1) + " °C", x - 16, Y(T) - 10);
    });""",
        """    // R_si et R_se comptent dans R_th : petits décrochements de température dans les couches d'air
    const Rsi = 0.13, Rse = 0.04;
    const Rth = Rsi + Riso + Rsup + Rse;
    const Ti = 20, Te = 0;
    const Tsi = Ti - (Ti - Te) * (Rsi / Rth);
    const T12 = Tsi - (Ti - Te) * (Riso / Rth);
    const Tse = Te + (Ti - Te) * (Rse / Rth);
    const Y = (T) => {
      const Tmin = -2, Tmax = 22;
      return yBot - ((T - Tmin) / (Tmax - Tmin)) * (yBot - yTop - 50) - 25;
    };
    const xa = xL - 36, xb = xR + 36;
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(xa, Y(Ti)); ctx.lineTo(xL, Y(Tsi)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xR, Y(Tse)); ctx.lineTo(xb, Y(Te)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xL, Y(Tsi));
    ctx.lineTo(xL + wI, Y(T12));
    ctx.lineTo(xR, Y(Tse));
    ctx.stroke();
    [[xa, Ti, "", -40, -12], [xL, Tsi, "T si", 6, 18], [xL + wI, T12, "", -16, -10], [xR, Tse, "T se", -58, 18], [xb, Te, "", -20, -12]].forEach(([x, T, lb, dx, dy]) => {
      ctx.fillStyle = P.accent;
      ctx.beginPath(); ctx.arc(x, Y(T), 4.5, 0, TAU); ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.font = "12px 'DM Mono', monospace";
      ctx.fillText((lb ? lb + " " : "") + fmt(T, 1) + " °C", x + dx, Y(T) + dy);
    });
    ctx.fillStyle = P.muted;
    ctx.font = "11px 'Outfit', sans-serif";
    ctx.fillText("Rsi", xa + 6, yBot - 8);
    ctx.fillText("Rse", xR + 8, yBot - 8);""",
    ),
    (
        "atelier 04 : énergie de chauffage pour les émissions GES",
        """            <div class="readouts" id="out-dpe"></div>""",
        """            <div class="ctrl">
              <label>Énergie de chauffage (émissions)</label>
              <span class="hint">Facteurs d’émission indicatifs du DPE 2021, en kgCO₂e/kWh</span>
              <select id="energDpe">
                <option value="0.079" selected>Électricité · 0,079</option>
                <option value="0.227">Gaz naturel · 0,227</option>
                <option value="0.324">Fioul · 0,324</option>
                <option value="0.030">Bois bûches · 0,030</option>
              </select>
            </div>
            <div class="readouts" id="out-dpe"></div>""",
    ),
    (
        "atelier 04 : double seuil énergie / climat",
        """    $("out-dpe").innerHTML = kpiHTML([
      { texK: "C_{\\\\mathrm{ep}}=f_{\\\\mathrm{p}} C_{\\\\mathrm{ef}}", v: fmt(Cep, 0) + " kWh_ep/an", wide: true },
      { texK: "C_{\\\\mathrm{ep}}/S_{\\\\mathrm{hab}}", v: fmt(ind, 0) + " kWh_ep/(m²·an)", wide: true },
      { k: "Position sur l’échelle (seuils génériques)", v: badgeHTML, wide: true },
    ]);""",
        """    // Émissions de gaz à effet de serre : le DPE 2021 retient la plus mauvaise des deux classes
    const fGes = +$("energDpe").value;
    const ges = fGes * Cef, gesS = ges / Shab;
    const GES_T = [["A", 6], ["B", 11], ["C", 30], ["D", 50], ["E", 70], ["F", 100], ["G", Infinity]];
    const gesL = GES_T.find((r) => gesS <= r[1])[0];
    const worst = gesL > letter ? gesL : letter;
    $("out-dpe").innerHTML = kpiHTML([
      { texK: "C_{\\\\mathrm{ep}}=f_{\\\\mathrm{p}} C_{\\\\mathrm{ef}}", v: fmt(Cep, 0) + " kWh_ep/an", wide: true },
      { texK: "C_{\\\\mathrm{ep}}/S_{\\\\mathrm{hab}}", v: fmt(ind, 0) + " kWh_ep/(m²·an)", wide: true },
      { k: "Position sur l’échelle (seuils génériques)", v: badgeHTML, wide: true },
      { k: "Émissions GES associées", v: fmt(ges, 0) + " kgCO₂e/an · " + fmt(gesS, 1) + " kgCO₂e/(m²·an)", wide: true },
      {
        k: "Double seuil (DPE 2021)",
        v: `Énergie <strong>${letter}</strong> · climat <strong>${gesL}</strong> : l’étiquette retient la plus mauvaise, <strong>${worst}</strong>. Seuils climat : A ≤ 6, B ≤ 11, C ≤ 30, D ≤ 50, E ≤ 70, F ≤ 100 kgCO₂e/(m²·an).`,
        wide: true,
      },
    ]);""",
    ),
    (
        "atelier 04 : énergie de chauffage réinitialisable",
        """    dpe: ["Cef", "Shab", "fp"],""",
        """    dpe: ["Cef", "Shab", "fp", "energDpe"],""",
    ),
    (
        "atelier 06 : diagramme de Sankey proportionnel (PAC + VMC double flux)",
        """    box(40, 90, 160, 80, P.boxVmc, "VMC DF", "η = " + fmt(eta, 2));
    box(280, 90, 160, 80, P.boxNeed, "Besoin net", fmt(besNet, 0) + " kWh");
    box(520, 90, 160, 80, P.boxPac, "PAC", "COP = " + fmt(COP, 1));
    arrow(200, 130, 280, 130);
    arrow(440, 130, 520, 130);
    ctx.fillStyle = P.ink;
    ctx.font = "600 14px 'Outfit', sans-serif";
    ctx.fillText("électricité ≈ " + fmt(Celec, 0) + " kWh", 520, 210);
    ctx.fillStyle = P.muted;
    ctx.font = "12px 'Outfit', sans-serif";
    ctx.fillText("Air extrait → récupération → air neuf préchauffé", 40, 50);
    ctx.fillText("Chaleur utile / COP = électricité", 420, 50);
    ctx.fillStyle = P.gaugeBg;
    ctx.fillRect(40, 230, 200, 18);
    ctx.fillStyle = P.accent;
    ctx.fillRect(40, 230, 200 * eta, 18);
    ctx.strokeStyle = P.wallStroke;
    ctx.strokeRect(40, 230, 200, 18);
    ctx.fillStyle = P.ink;
    ctx.font = "12px 'Outfit', sans-serif";
    ctx.fillText("Récupération η", 40, 270);
    const copX = 320;
    ctx.fillStyle = P.gaugeBg;
    ctx.fillRect(copX, 230, 280, 18);
    ctx.fillStyle = P.accentDeep;
    ctx.fillRect(copX, 230, 280 * Math.min(COP / 5, 1), 18);
    ctx.strokeStyle = P.wallStroke;
    ctx.strokeRect(copX, 230, 280, 18);
    ctx.fillStyle = P.ink;
    ctx.fillText("Sensibilité COP (1 → 5)", copX, 270);""",
        """    // Sankey proportionnel : électricité + chaleur gratuite de l'air = chaleur PAC ; + récupération VMC = besoin brut
    const bes = +$("bes").value, pV = +$("partV").value / 100;
    const rec = bes * pV * eta;
    const amb = Math.max(0, besNet - Celec);
    const dark = document.documentElement.dataset.theme !== "light";
    const cE = dark ? "#f2b73f" : "#b07d0a", cA = dark ? "#6bb8e0" : "#1f6f95", cH = P.heat, cR = P.accent;
    const k = 120 / Math.max(bes, 1);
    const band = (x1, y1, x2, y2, t, col, alpha) => {
      ctx.globalAlpha = alpha ?? 0.85;
      ctx.fillStyle = col;
      const mx = (x1 + x2) / 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
      ctx.lineTo(x2, y2 + t);
      ctx.bezierCurveTo(mx, y2 + t, mx, y1 + t, x1, y1 + t);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    const tE = Celec * k, tA = amb * k, tR = rec * k, tH = besNet * k, tB = bes * k;
    const yS = 52, yP = 76, xP = 250, xB = 470;
    // sources : électricité (1 part) et chaleur prise à l'air extérieur (COP - 1 parts)
    band(30, yS, xP, yP, tE, cE);
    band(30, yS + tE + 18, xP, yP + tE, tA, cA);
    ctx.fillStyle = P.boxPac; ctx.fillRect(xP, yP, 16, tH);
    band(xP + 16, yP, xB, yP, tH, cH);
    ctx.fillStyle = P.boxNeed; ctx.fillRect(xB, yP, 16, tB);
    // sortie : déperditions (dont l'air extrait non récupéré)
    band(xB + 16, yP, 690, yP, tB - tR, cH, 0.5);
    // boucle de l'échangeur : la chaleur de l'air extrait revient vers l'entrée du bâtiment
    const yU = yP + tB + 34;
    if (tR > 0.5) {
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = cR;
      ctx.lineWidth = tR;
      ctx.beginPath();
      ctx.moveTo(xB + 16, yP + tB - tR / 2);
      ctx.bezierCurveTo(xB + 90, yP + tB - tR / 2, xB + 90, yU, xB + 20, yU);
      ctx.lineTo(xP + 110, yU);
      ctx.bezierCurveTo(xP + 50, yU, xP + 60, yP + tH + tR / 2, xB, yP + tH + tR / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const pct = (x) => fmt((100 * x) / Math.max(bes, 1), 0) + " %";
    ctx.font = "600 12px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = cE; ctx.fillText("Électricité " + fmt(Celec, 0) + " kWh (1 part)", 30, yS - 8);
    ctx.fillStyle = cA; ctx.fillText("Air extérieur " + fmt(amb, 0) + " kWh (COP - 1 = " + fmt(COP - 1, 1) + " parts)", 30, yS + tE + 18 + tA + 16);
    ctx.fillStyle = P.ink; ctx.fillText("PAC · COP " + fmt(COP, 1), xP - 30, yP - 8);
    ctx.fillText("Besoin brut " + fmt(bes, 0) + " kWh", xB - 40, yP + tB + 16);
    // étiquettes dans les bandes épaisses (sinon au-dessus)
    const inBand = (txt, x, yTop, t, col) => {
      if (t >= 18) { ctx.fillStyle = "#ffffff"; ctx.fillText(txt, x, yTop + t / 2 + 4); }
      else { ctx.fillStyle = col; ctx.fillText(txt, x, yTop - 6); }
    };
    inBand("Chaleur PAC " + fmt(besNet, 0) + " kWh", xP + 30, yP, tH, cH);
    ctx.fillStyle = cR; ctx.fillText("Récupérée par la VMC : " + fmt(rec, 0) + " kWh (" + pct(rec) + ")", xP + 110, yU + tR / 2 + 16);
    inBand("Déperditions " + fmt(bes - rec, 0) + " kWh", xB + 40, yP, tB - tR, P.ink);
    ctx.fillStyle = P.muted; ctx.font = "12px 'Outfit', sans-serif";
    ctx.fillText("Rien n’est créé : la PAC déplace la chaleur de l’air extérieur, l’électricité ne paie que le transport.", 30, h - 10);""",
    ),
    (
        "atelier 03 : analogie compteur de vitesse / compteur kilométrique",
        """        <div class="bd" id="quiz-dju"></div>
      </div>""",
        """        <div class="bd" id="quiz-dju"></div>
      </div>
      <div class="note v2-analogy"><span><b>Puissance ou énergie ?</b> H<sub>bat</sub> × ΔT est une puissance, en W : c’est la vitesse à laquelle le pavillon perd sa chaleur à un instant donné, comme l’indique le compteur de vitesse d’une voiture. Multiplier par les DJU × 24 h revient à additionner ces puissances sur tout l’hiver, comme le compteur kilométrique additionne les vitesses au fil du trajet : on obtient une énergie, en kWh. Une chaudière se dimensionne en kW, une facture se paie en kWh.</span></div>""",
    ),
    (
        "atelier 06 : place pour le diagramme de Sankey",
        '<canvas id="cv-sys" width="720" height="300"></canvas>',
        '<canvas id="cv-sys" width="720" height="390"></canvas>',
    ),
]

# ---------------------------------------------------------------------------
# R4-8 : h_max, matériaux types, ΔP ∝ v², groupes acoustiques, écoute, bannière
# ---------------------------------------------------------------------------
PATCHES["r4-8"] = [
    (
        "atelier 01 : hauteur solaire maximale (midi solaire)",
        """<li>Hauteur solaire (option) : <span class="tex" data-tex="h=90^{\\circ}-\\mathrm{Lat}+\\delta"></span></li>""",
        """<li>Hauteur solaire maximale, au midi solaire vrai : <span class="tex" data-tex="h_{\\max}=90^{\\circ}-\\mathrm{Lat}+\\delta"></span> (l’après-midi, le soleil est plus bas et entre davantage dans les baies ouest)</li>""",
    ),
    (
        "atelier 01 : indicateur h_max",
        """      { texK: "h", kSuffix: "(hauteur solaire)", v: fmt(hSol, 0) + " °" },""",
        """      { texK: "h_{\\\\max}", kSuffix: "(hauteur solaire au midi solaire)", v: fmt(hSol, 0) + " °" },""",
    ),
    (
        "atelier 01 : légende h_max",
        """      texHTML("h") + " ≈ " + fmt(hSol, 0) + "°";""",
        """      texHTML("h_{\\\\max}") + " ≈ " + fmt(hSol, 0) + "° (midi solaire)";""",
    ),
    (
        "atelier 02 : matériaux types",
        """            <div class="ctrl">
              <label>Épaisseur <span class="tex" data-tex="e"></span> <strong id="v-ein">28 cm</strong></label>""",
        """            <div class="ctrl">
              <label>Matériau type</label>
              <span class="hint">Remplit λ, ρ et c<sub>p</sub> (valeurs usuelles arrondies au pas des curseurs) ; l’épaisseur reste la vôtre.</span>
              <select id="matin">
                <option value="perso" selected>Perso</option>
                <option value="beton">Béton plein</option>
                <option value="bois">Fibre de bois</option>
                <option value="laine">Laine de verre</option>
                <option value="terre">Terre crue</option>
              </select>
            </div>
            <div class="ctrl">
              <label>Épaisseur <span class="tex" data-tex="e"></span> <strong id="v-ein">28 cm</strong></label>""",
    ),
    (
        "atelier 02 : matériau type réinitialisable",
        """    inertie: ["ein", "lin", "rin", "cpin"],""",
        """    inertie: ["matin", "ein", "lin", "rin", "cpin"],""",
    ),
    (
        "atelier 04 : couplage physique ΔP ∝ v²",
        """            <div class="ctrl">
              <label>Perte linéique <span class="tex" data-tex="J"></span> <strong id="v-J">1,2 Pa/m</strong></label>""",
        """            <div class="ctrl">
              <label>Pertes de charge et vitesse</label>
              <span class="hint">Couplé : J et ΣP<sub>sing</sub> sont donnés à 4,5 m/s puis suivent v² (loi physique). Découplé : ils restent figés (lecture trompeuse).</span>
              <select id="couplageA">
                <option value="v2" selected>Couplé : ΔP ∝ v²</option>
                <option value="fixe">Découplé (J figé)</option>
              </select>
            </div>
            <div class="ctrl">
              <label>Perte linéique <span class="tex" data-tex="J"></span> <strong id="v-J">1,2 Pa/m</strong></label>""",
    ),
    (
        "atelier 04 : calcul de ΔP couplé à la vitesse",
        """    const dP = L * J + Psing;""",
        """    // couplage physique : J et ΣP_sing sont des valeurs de référence à 4,5 m/s, puis ∝ v²
    const kv = $("couplageA").value === "v2" ? (v / 4.5) * (v / 4.5) : 1;
    const dP = (L * J + Psing) * kv;""",
    ),
    (
        "atelier 04 : couplage réinitialisable",
        """    aera: ["Sa", "va", "La", "J", "Psing", "etaA"],""",
        """    aera: ["couplageA", "Sa", "va", "La", "J", "Psing", "etaA"],""",
    ),
    (
        "atelier 05 : commandes regroupées par formule + écoute",
        """            <div class="ctrl">
              <label>Niveau source 1 <span class="tex" data-tex="L_1"></span> <strong id="v-L1">68 dB</strong></label>
              <span class="hint">Valeur générique pédagogique - pas celle du sujet</span>
              <input type="range" id="L1" min="40" max="95" step="1" value="68" />
            </div>
            <div class="ctrl">
              <label>Niveau source 2 <span class="tex" data-tex="L_2"></span> <strong id="v-L2">61 dB</strong></label>
              <input type="range" id="L2" min="40" max="95" step="1" value="61" />
            </div>
            <div class="ctrl">
              <label>Puissance source émise <span class="tex" data-tex="L_w"></span> <strong id="v-Lw">82 dB</strong></label>
              <input type="range" id="Lw" min="60" max="110" step="1" value="82" />
            </div>
            <div class="ctrl">
              <label>Distance <span class="tex" data-tex="d"></span> <strong id="v-d">4,0 m</strong></label>
              <input type="range" id="dAc" min="1" max="30" step="0.5" value="4" />
            </div>
            <div class="ctrl">
              <label>Indice d’affaiblissement <span class="tex" data-tex="R_w"></span> <strong id="v-Rw">42 dB</strong></label>
              <input type="range" id="Rw" min="20" max="60" step="1" value="42" />
            </div>
            <div class="ctrl">
              <label>Volume salle <span class="tex" data-tex="V"></span> <strong id="v-V">95 m³</strong></label>
              <span class="hint">Volume fictif Lironde - pas celui du dossier noté</span>
              <input type="range" id="Vac" min="40" max="400" step="5" value="95" />
            </div>
            <div class="ctrl">
              <label>Aire d’absorption <span class="tex" data-tex="A"></span> <strong id="v-Aac">18 m² Sabine</strong></label>
              <input type="range" id="Aac" min="5" max="80" step="1" value="18" />
            </div>""",
        """            <div class="v2-ctl-group">1. Cumul de deux bruits (L₁ ⊕ L₂) et isolement R<sub>w</sub></div>
            <div class="ctrl">
              <label>Niveau source 1 <span class="tex" data-tex="L_1"></span> <strong id="v-L1">68 dB</strong></label>
              <span class="hint">Valeur générique pédagogique - pas celle du sujet</span>
              <input type="range" id="L1" min="40" max="95" step="1" value="68" />
            </div>
            <div class="ctrl">
              <label>Niveau source 2 <span class="tex" data-tex="L_2"></span> <strong id="v-L2">61 dB</strong></label>
              <input type="range" id="L2" min="40" max="95" step="1" value="61" />
            </div>
            <div class="ctrl">
              <label>Indice d’affaiblissement <span class="tex" data-tex="R_w"></span> <strong id="v-Rw">42 dB</strong></label>
              <span class="hint">Niveau reçu derrière le mur ≈ L<sub>total</sub> − R<sub>w</sub></span>
              <input type="range" id="Rw" min="20" max="60" step="1" value="42" />
            </div>
            <div class="v2-ctl-group">2. Atténuation avec la distance (champ libre)</div>
            <div class="ctrl">
              <label>Puissance source émise <span class="tex" data-tex="L_w"></span> <strong id="v-Lw">82 dB</strong></label>
              <span class="hint">Ce bloc calcule L<sub>p</sub> à la distance d ; il n’entre pas dans le niveau reçu derrière le mur.</span>
              <input type="range" id="Lw" min="60" max="110" step="1" value="82" />
            </div>
            <div class="ctrl">
              <label>Distance <span class="tex" data-tex="d"></span> <strong id="v-d">4,0 m</strong></label>
              <input type="range" id="dAc" min="1" max="30" step="0.5" value="4" />
            </div>
            <div class="v2-ctl-group">3. Réverbération du local (Sabine)</div>
            <div class="ctrl">
              <label>Volume salle <span class="tex" data-tex="V"></span> <strong id="v-V">95 m³</strong></label>
              <span class="hint">Volume fictif Lironde - pas celui du dossier noté</span>
              <input type="range" id="Vac" min="40" max="400" step="5" value="95" />
            </div>
            <div class="ctrl">
              <label>Aire d’absorption <span class="tex" data-tex="A"></span> <strong id="v-Aac">18 m² Sabine</strong></label>
              <input type="range" id="Aac" min="5" max="80" step="1" value="18" />
            </div>
            <div class="ctrl">
              <button type="button" class="v2-btn" id="btn-ecoute" style="width:100%;justify-content:center;height:40px;">Écouter : côté source, puis derrière le mur</button>
              <span class="hint">Écoute illustrative (niveaux compressés pour rester audibles) : le mur coupe les aigus selon R<sub>w</sub>, le local prolonge le son pendant T.</span>
            </div>""",
    ),
    (
        "atelier 05 : bouton d'écoute",
        """  function resetGroup(key) {""",
        """  /* matériaux types de l'atelier inertie (λ, ρ, cp) ; un réglage manuel repasse en « Perso » */
  const MATS_IN = {
    beton: { lin: 1.75, rin: 2400, cpin: 1000 },
    bois: { lin: 0.04, rin: 160, cpin: 2000 },
    laine: { lin: 0.04, rin: 20, cpin: 1040 },
    terre: { lin: 1.1, rin: 1900, cpin: 1000 },
  };
  $("matin").addEventListener("input", () => {
    const m = MATS_IN[$("matin").value];
    if (!m) return;
    Object.entries(m).forEach(([k, v]) => { $(k).value = v; syncFill($(k)); });
    updateInertie();
  });
  ["lin", "rin", "cpin"].forEach((k) => $(k).addEventListener("input", (e) => { if (e.isTrusted) $("matin").value = "perso"; }));
  $("btn-ecoute").addEventListener("click", () => {
    const T = 0.16 * +$("Vac").value / +$("Aac").value;
    if (window.LABV2 && window.LABV2.audio) window.LABV2.audio.playRoom(+$("Rw").value, T);
  });
  function resetGroup(key) {""",
    ),
    (
        "bannière anti-spoil : nom exact du sujet noté",
        "Elles ne donnent aucune valeur à recopier dans le dossier noté R 4-8.</p>",
        "Elles ne donnent aucune valeur à recopier dans le dossier « Le Zénith Bioclimatique ».</p>",
    ),
]
