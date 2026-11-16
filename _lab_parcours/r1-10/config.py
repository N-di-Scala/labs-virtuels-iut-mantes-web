# -*- coding: utf-8 -*-
"""R1-10 Réseaux secs et humides : raccords propres au lab (atelier 08, profil de vitesse, Moody,
point de fonctionnement, poignées 3D, textes adaptés à la 3D). Utilisé par _lab_parcours/build.py."""
from __future__ import annotations

from pathlib import Path

HERE = Path(__file__).resolve().parent
TAIL = ["parcours.js", "reseau.js", "extras.js"]          # contenus, chargés avant le moteur
SCENES = ["scene_reseau.js"]                               # scènes 3D supplémentaires
DEBATS_EXTRA = {"reseau": "La solution la moins chère sur 20 ans est-elle la bonne ? Un surpresseur tombe en panne, une conduite surdimensionnée dégrade la qualité de l’eau. Comment pondérer coût, fiabilité, qualité sanitaire et carbone devant les élus ?"}


def sub1(html: str, old: str, new: str, what: str) -> str:
    n = html.count(old)
    if n != 1:
        raise SystemExit(f"r1-10 : ancre « {what} » trouvée {n} fois (1 attendue)")
    return html.replace(old, new)


NAV_BTN = """      <button class="nav-btn" data-atelier="reseau">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19 9 13l4 3 8-9"/><circle cx="9" cy="13" r="1.6"/><path d="M17 7h4v4"/></svg></span>
        <span class="txt"><span class="label">Réseau du Plateau</span><span class="sub">Passif ou actif ?</span></span>
        <span class="meta"><span class="marks"><svg class="star-ic" data-star="reseau" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.5L12 16.9 6.1 20.1l1.3-6.5L2.5 9l6.6-.8z"/></svg><span class="dot" data-dot="reseau"></span></span><span class="idx">08</span></span>
      </button>
"""

TEX = lambda t: f'<span class="tex" data-tex="{t}"></span>'  # noqa: E731


def ctrl(label: str, vid: str, rng: tuple, hint: str = "") -> str:
    lo, hi, step, val = rng
    h = f'\n              <span class="hint">{hint}</span>' if hint else ""
    return f"""            <div class="ctrl">
              <label>{label} <strong id="v-{vid}"></strong></label>{h}
              <input type="range" id="{vid}" min="{lo}" max="{hi}" step="{step}" value="{val}" />
            </div>
"""


SECTION = (
    """    <!-- RESEAU (v3) -->
    <section class="atelier" id="atelier-reseau">
      <div class="hero">
        <div>
          <p class="eyebrow">Atelier 08</p>
          <h2>Le réseau du Plateau : passif ou actif ?</h2>
          <p class="lede">Synthèse des ateliers 01 à 07. Le hameau du Plateau manque de pression : faut-il une conduite plus grosse ou un surpresseur ?</p>
          <p class="mission"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7 C 12 2.7 5.5 10 5.5 14.5 a 6.5 6.5 0 0 0 13 0 C 18.5 10 12 2.7 12 2.7 Z"/></svg>Mission Valdeau : garantir 2,2 bar au Plateau, avec une vitesse entre 0,5 et 1,5 m/s, au meilleur coût sur 20 ans.</p>
        </div>
        <span class="tag">Étapes 6–7</span>
      </div>
      <div class="grid">
        <div class="card">
          <div class="hd">Profil en long : terrain, conduite et ligne de charge</div>
          <div class="bd">
            <canvas id="cv-reseau" width="1440" height="1120"></canvas>
            <p class="viz-cap">Lecture : la ligne de charge part de A, monte de la HMT au surpresseur, descend avec les pertes. La pression au Plateau est l’écart entre cette ligne et le terrain ; elle doit atteindre la ligne rouge. Survolez la conduite pour lire la pression en chaque point. En bas : coûts cumulés des deux solutions.</p>
          </div>
        </div>
        <div class="card controls-card">
          <div class="hd"><span>Commandes</span><button class="reset-btn" type="button" data-reset="reseau"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Réinitialiser</button></div>
          <div class="bd controls">
            <div class="v2-ctl-group">Conduite</div>
            <div class="ctrl">
              <label>Diamètre intérieur """ + TEX("D") + """ <strong id="v-Dr"></strong></label>
              <select id="Dr">
                <option value="80">Ø 80 mm · 55 €/m posé</option>
                <option value="100" selected>Ø 100 mm · 70 €/m posé</option>
                <option value="125">Ø 125 mm · 90 €/m posé</option>
                <option value="150">Ø 150 mm · 115 €/m posé</option>
              </select>
            </div>
"""
    + ctrl("Débit de pointe " + TEX("Q"), "Qr", (2, 12, 0.5, 7))
    + ctrl("Longueur " + TEX("L"), "Lr", (300, 1500, 50, 900))
    + ctrl("Singularités " + TEX("\\sum K"), "Kr", (0, 30, 0.5, 12), "Coudes, tés, vannes, compteurs du tracé (atelier 06).")
    + """            <div class="v2-ctl-group">Site</div>
"""
    + ctrl("Dénivelé A → Plateau " + TEX("\\Delta z"), "hr", (0, 35, 0.5, 18))
    + ctrl("Pression disponible en A " + TEX("P_A"), "PAr", (3, 6, 0.05, 4.25))
    + """            <div class="v2-ctl-group">Surpresseur et énergie</div>
"""
    + ctrl("HMT du surpresseur", "HMTr", (0, 30, 0.5, 0), "0 m : solution passive, sans pompe.")
    + ctrl("Rendement " + TEX("\\eta"), "etar", (40, 85, 1, 65))
    + ctrl("Prix de l’électricité", "prixr", (0.1, 0.4, 0.01, 0.2), "Le surpresseur tourne environ 3 000 h par an ; achat 5 000 €, renouvelé après 15 ans ; entretien 100 €/an.")
    + """            <div class="readouts" id="out-reseau"></div>
          </div>
        </div>
      </div>
      <div class="pedago">
        <div class="card retenir"><div class="hd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>À retenir</div><div class="bd"><ul>
          <li>Bilan de charge : """ + TEX("P_B = P_A + \\rho g\\,(\\mathrm{HMT} - \\Delta z - h_f - h_s)") + """.</li>
          <li>Solution passive : agrandir """ + TEX("D") + """ réduit les pertes (≈ 1/D⁵), mais l’eau ne doit pas stagner (v ≥ 0,5 m/s).</li>
          <li>Solution active : le surpresseur comble exactement le déficit ; il se paie à l’achat, puis chaque année en électricité et en entretien.</li>
        </ul></div></div>
        <div class="card challenge"><div class="hd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-2.5 4L18 12H5"/></svg>Méthode pour le projet</div><div class="bd"><ul>
          <li>Tracer le profil en long et la ligne de charge avant de choisir.</li>
          <li>Tester les diamètres du catalogue : pression, puis vitesse.</li>
          <li>Comparer les deux scénarios sur la même durée, puis ajouter les critères non chiffrés : panne, entretien, carbone.</li>
        </ul></div></div>
      </div>
      <div class="note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.3 1 2.1h5c0-.8.3-1.6 1-2.1A6 6 0 0 0 12 3Z"/></svg>
        <span>Données génériques (Plateau, prix, catalogue) : elles diffèrent volontairement de celles du projet noté. La méthode, elle, est la même.</span>
      </div>
    </section>

"""
)


def hook(html: str) -> str:
    html = sub1(html, '      <button class="nav-btn" data-atelier="defi">', NAV_BTN + '      <button class="nav-btn" data-atelier="defi">', "bouton Grand contrôle")
    html = sub1(html, '<span class="idx">08</span></span>\n      </button>\n    </nav>', '<span class="idx">09</span></span>\n      </button>\n    </nav>', "numéro du Grand contrôle")
    html = sub1(html, "7 ateliers guidés", "8 ateliers guidés", "puce d'accueil")
    html = sub1(html, '<p class="eyebrow">Atelier 08</p>\n          <h2>Le Grand contrôle', '<p class="eyebrow">Atelier 09</p>\n          <h2>Le Grand contrôle', "titre du Grand contrôle")
    html = sub1(html, "    <!-- DEFI FINAL -->", SECTION + "    <!-- DEFI FINAL -->", "section Grand contrôle")
    html = sub1(html, '    pompe: ["HA", "HBneed", "hptot", "Qpompe", "eta"],\n  };',
                '    pompe: ["HA", "HBneed", "hptot", "Qpompe", "eta"],\n    reseau: ["Qr", "Lr", "Dr", "Kr", "hr", "PAr", "HMTr", "etar", "prixr"],\n  };', "GROUPS")
    html = sub1(html, "    pompe: updatePompe,\n  };",
                "    pompe: updatePompe,\n    reseau: () => { if (window.LAB_R110_RESEAU) window.LAB_R110_RESEAU.update(); },\n  };\n  window.LABV3_REDRAW = (k) => { if (UPDATERS[k]) UPDATERS[k](); };", "UPDATERS")
    html = sub1(html, '"singulier", "pompe", "defi"]', '"singulier", "pompe", "reseau", "defi"]', "ORDER")
    html = sub1(html, "    updatePompe();\n    ensureAnim();", "    updatePompe();\n    if (window.LAB_R110_RESEAU) window.LAB_R110_RESEAU.update();\n    ensureAnim();", "repaintAll")
    html = sub1(html, '    else if (current === "pompe") { updatePompe(); }',
                '    else if (current === "pompe") { updatePompe(); }\n    else if (current === "reseau" && window.LAB_R110_RESEAU) { window.LAB_R110_RESEAU.update(); }', "repaintCurrent")
    return hook_v1(html)

PROFIL = """      // vitesse locale selon la distance à la paroi : Poiseuille (laminaire) ou loi en 1/7 (turbulent)
      const xi = Math.min(1, Math.abs(2 * p.y - 1));
      const tt = r.cls === "lam" ? 0 : r.cls === "tr" ? Math.min(1, Math.max(0, (Re - 2000) / 2000)) : 1;
      const uL = 2 * (1 - xi * xi), uT = 1.224 * Math.pow(Math.max(0, 1 - xi), 1 / 7);
      p.x += RM ? 0 : speed * 0.7 * ((1 - tt) * uL + tt * uT);
      if (!RM && tt > 0) p.y = Math.min(0.97, Math.max(0.03, p.y + (Math.random() - 0.5) * 0.03 * tt));"""

ENVELOPPE = """    // enveloppe du profil de vitesse u(r)
    {
      const tt = r.cls === "lam" ? 0 : r.cls === "tr" ? Math.min(1, Math.max(0, (Re - 2000) / 2000)) : 1;
      const xb = w - 190, k = 34;
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xb, y0 + 6); ctx.lineTo(xb, y0 + pipeH - 6); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const yy = i / 40, xi = Math.abs(2 * yy - 1);
        const u = (1 - tt) * 2 * (1 - xi * xi) + tt * 1.224 * Math.pow(Math.max(0, 1 - xi), 1 / 7);
        const X = xb + u * k, Yy = y0 + 6 + yy * (pipeH - 12);
        i ? ctx.lineTo(X, Yy) : ctx.moveTo(X, Yy);
      }
      ctx.stroke();
      for (let i = 1; i < 6; i++) {
        const yy = i / 6, xi = Math.abs(2 * yy - 1);
        const u = (1 - tt) * 2 * (1 - xi * xi) + tt * 1.224 * Math.pow(Math.max(0, 1 - xi), 1 / 7);
        const Yy = y0 + 6 + yy * (pipeH - 12);
        ctx.beginPath(); ctx.moveTo(xb, Yy); ctx.lineTo(xb + u * k - 4, Yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xb + u * k, Yy); ctx.lineTo(xb + u * k - 6, Yy - 3); ctx.lineTo(xb + u * k - 6, Yy + 3); ctx.closePath(); ctx.fillStyle = P.accent; ctx.fill();
      }
      ctx.fillStyle = P.accent;
      ctx.font = "600 12px 'Outfit', sans-serif";
      ctx.fillText(tt < 0.5 ? "profil u(r) parabolique : vitesse nulle à la paroi" : "profil u(r) aplati : brassage turbulent", Math.max(50, xb - 150), y0 + pipeH + 18);
    }
"""

PF_CARD = """
        <details class="card v3-adv">
          <summary>Mode avancé : point de fonctionnement pompe / réseau</summary>
          <div class="bd">
            <canvas id="cv-pf" width="1440" height="760"></canvas>
            <p class="viz-cap">Une pompe réelle ne fournit pas une HMT fixe : sa hauteur baisse quand le débit augmente. Le débit livré est celui où la courbe de la pompe coupe la courbe du réseau (hauteur statique H<sub>s</sub> = besoin aval − charge amont, plus des pertes en Q²). Réduire le diamètre raidit la courbe du réseau : le point recule et le débit livré chute.</p>
            <div class="ctrl">
              <label>Hauteur de la pompe à débit nul H<sub>0</sub> <strong id="v-H0pf">60 m</strong></label>
              <input type="range" id="H0pf" min="10" max="100" step="1" value="60" />
            </div>
          </div>
        </details>"""


def hook_v1(html: str) -> str:
    """Raccords de la v1 propres à R1-10 (atelier 08 dans la progression, schémas, Moody, mode avancé)."""
    html = sub1(html, 'const EXPLORABLE = ["debit", "fluide", "hydro", "bernoulli", "lineaire", "singulier", "pompe"];',
                'const EXPLORABLE = ["debit", "fluide", "hydro", "bernoulli", "lineaire", "singulier", "pompe", "reseau"];', "EXPLORABLE")
    html = sub1(html, '<b id="prog-count">0/7</b>', '<b id="prog-count">0/8</b>', "compteur initial")
    html = sub1(html, '<b id="star-count">0/7</b>', '<b id="star-count">0/8</b>', "étoiles initiales")
    html = sub1(html, "/^[0-8]$/.test(e.key)", "/^[0-9]$/.test(e.key)", "raccourcis clavier")
    # atelier 01 : profil de vitesse réel
    html = sub1(html, "      p.x += RM ? 0 : speed * (0.6 + p.r / 4);", PROFIL, "vitesse des particules")
    html = sub1(html, "    ctx.fillText(`v ≈ ${fmt(vv, 2)} m/s · ${r.name}`, 50, Math.max(22, y0 - 12));",
                ENVELOPPE + "    ctx.fillStyle = P.ink;\n    ctx.font = \"600 14px 'Outfit', sans-serif\";\n    ctx.fillText(`v ≈ ${fmt(vv, 2)} m/s · ${r.name}`, 50, Math.max(22, y0 - 12));", "titre du schéma débit")
    # échelles figées pendant une comparaison A/B
    html = sub1(html, "    const maxH = Math.max(H, 1);", "    const maxH = window.LABV3S ? window.LABV3S(\"bernoulli\", Math.max(H, 1)) : Math.max(H, 1);", "échelle Bernoulli")
    html = sub1(html, "    const max = Math.max(HA, need + hp, HMT, 1) * 1.15;", "    const max = window.LABV3S ? window.LABV3S(\"pompe\", Math.max(HA, need + hp, HMT, 1) * 1.15) : Math.max(HA, need + hp, HMT, 1) * 1.15;", "échelle pompe")
    html = sub1(html, "    const maxDrop = Math.max(hf, 0.5);", "    const maxDrop = window.LABV3S ? window.LABV3S(\"lineaire\", Math.max(hf, 0.5)) : Math.max(hf, 0.5);", "échelle pertes linéaires")
    # atelier 05 : Moody et sonde
    html = sub1(html, '<canvas id="cv-lin" width="1440" height="720"></canvas>', '<canvas id="cv-lin" width="1440" height="1120"></canvas>', "taille cv-lin")
    html = sub1(html, "    const y2 = yTop + hf * scaleY;\n", "    const y2 = yTop + hf * scaleY;\n    window.LAB_R110_LINGEO = { xL, xR, y1, y2, pipeY: Math.max(y2, y1) + 36 };\n", "repères cv-lin")
    html = sub1(html, "    drawLin(hf, L, lam);\n  }", "    drawLin(hf, L, lam);\n    if (window.LAB_R110_LIN) window.LAB_R110_LIN({ hf, L, lam, Re, epsRel: eps / D, regime: res.regime });\n  }", "Moody")
    # atelier 07 : mode avancé
    html = sub1(html, '<span class="tex" data-tex="h_f+h_s"></span>.</p>\n          </div>\n        </div>',
                '<span class="tex" data-tex="h_f+h_s"></span>.</p>\n          </div>\n        </div>' + PF_CARD, "carte point de fonctionnement")
    return html



# poignées 3D et retouches de textes (appliquées au HTML final)
HANDLES = [
    ("  K.tip(secDisc, ",
     '  window.LABV4H && window.LABV4H(K, secDisc, "D", "debit", "La section de la conduite", "glisser vers le haut pour élargir le diamètre D, vers le bas pour le réduire", 6);\n'),
    ('  K.tip(top, "<b>Relief</b>',
     '  window.LABV4H && window.LABV4H(K, top, "h", "hydro", "Le relief sous B", "glisser vers le haut ou le bas pour changer la dénivelée h", 6);\n'),
    ('  K.tip(pz, "<b>Piézomètre</b>',
     '  window.LABV4H && window.LABV4H(K, pz, "Pbern", "bernoulli", "Le piézomètre", "glisser vers le haut ou le bas pour changer la pression P", 6);\n'
     '  window.LABV4H && window.LABV4H(K, colV, "vbern", "bernoulli", "Le bloc de charge cinétique v²/(2g)", "glisser vers le haut ou le bas pour modifier la vitesse d’écoulement v", 5);\n'),
    ("  K.tip(resA, ",
     '  window.LABV4H && window.LABV4H(K, resA, "HA", "pompe", "Le réservoir amont A", "glisser vers le haut ou le bas pour changer la charge disponible H<sub>A</sub>", 6);\n'),
    ('  const tHf = K.tag("hf"',
     '  window.LABV4H && window.LABV4H(K, pipeG, "Dlin", "lineaire", "La conduite", "glisser vers le haut pour élargir le diamètre D, vers le bas pour le réduire (pertes en 1/D⁵ à débit imposé)", 6);\n'),
]

# autres raccords (ancre, remplacement, description)
PATCHES = [
    # poignées de l'atelier 08 : déclarées à l'interface pour la légende et le repérage
    ("K.drag(hamlet, {",
     'window.LABV4R && window.LABV4R(K, "reseau", hamlet, "Le hameau", "glisser vers le haut ou le bas pour changer le dénivelé");\n  K.drag(hamlet, {', "poignée hameau"),
    ("K.drag(grip, {",
     'window.LABV4R && window.LABV4R(K, "reseau", grip, "La flèche verte du surpresseur", "glisser vers le haut pour régler la HMT");\n  K.drag(grip, {', "poignée HMT"),
    # consignes qui citaient le schéma 2D retiré
    ("Regardez les particules et les lignes de courant.",
     "Regardez les particules et le profil des vitesses (flèches) dans la conduite 3D.", "consigne atelier 01"),
    ("les lignes de courant se sont calmées", "les particules se sont calmées", "retour atelier 01"),
    ("Sur le schéma des lignes de courant, le régime turbulent se reconnaît à…",
     "Dans la conduite 3D, le régime turbulent se reconnaît à…", "question flash 3 atelier 01"),
    ("des lignes parallèles bien rangées", "un profil parabolique et des particules qui glissent en couches", "réponse B question 3 atelier 01"),
    ("des lignes qui ondulent fort et se croisent", "un profil aplati et des particules qui se mélangent", "réponse C question 3 atelier 01"),
    # le verrou de l'étape 1 s'applique aussi aux poignées de l'atelier 08
    ("const setIn = (id, val) => { const e = document.getElementById(id); if (!e) return;",
     'const setIn = (id, val) => { const e = document.getElementById(id); if (!e || e.disabled || e.closest(".v3-locked, .v3-picking, .v3-dim")) return;', "verrou poignées atelier 08"),
]

