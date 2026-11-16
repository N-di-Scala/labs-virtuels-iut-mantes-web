/* =====================================================================
   R1-13 · parcours pédagogiques (mission Pierreclaire, laboratoire de Clairval)
   Chaque atelier : predict (POÉ), observe (tâche détectée), measure (explication),
   plus (le piège), diag (cas pathologique). Données génériques : aucune valeur du dossier noté.
   Les champs demo (plus) et fix (diag) servent aux tests automatiques.
   ===================================================================== */
(() => {
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const near = (x, a, tol) => Math.abs(x - a) <= tol;
  const AT = {};

  /* ---------- 01 · Incertitudes de type A et de type B ---------- */
  AT.ab = {
    compute(v) {
      const n = v("n"), s = v("s"), res = v("res");
      const uA = s / Math.sqrt(n), uB = (res / 2) / Math.sqrt(3);
      const uc = Math.sqrt(uA * uA + uB * uB);
      return { uA, uB, uc, cA: uA * uA / (uc * uc) * 100, cB: uB * uB / (uc * uc) * 100 };
    },
    record(c) {
      const m = c.mem;
      if (c.v("n") === 4) m.at4 = { s: c.v("s"), uA: c.out.uA };
      if (c.v("n") === 16 && m.at4 && near(c.v("s"), m.at4.s, 1e-9)) m.at16 = { uA: c.out.uA };
    },
    predict: {
      q: "Même opérateur, même pied à coulisse : on passe de 4 à 16 mesures répétées (quatre fois plus). L’incertitude de type A sur la moyenne…",
      opts: [
        { t: "est divisée par 4" },
        { t: "est divisée par 2", ok: true },
        { t: "ne change pas : l’opérateur est le même" },
      ],
    },
    observe: {
      focus: ["n"], auto: [["n", 4], ["n", 16]],
      task: "Sans toucher à l’écart-type, réglez n = 4 répétitions, puis n = 16. Regardez le nuage de mesures et la barre de type A.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "n = 4 observé", ok: !!m.at4 },
          { t: "Puis n = 16, même écart-type", ok: !!m.at16 },
        ];
        return { items, done: !!m.at16 };
      },
      reveal(c) {
        const m = c.mem;
        const r = m.at4 && m.at16 ? m.at4.uA / m.at16.uA : 2;
        return `u<sub>A</sub> est passée de ${f(m.at4 ? m.at4.uA : 0, 3)} à ${f(m.at16 ? m.at16.uA : 0, 3)} mm : divisée par ${f(r, 1)}, pas par 4. Le nuage, lui, garde la même largeur : chaque mesure n’est pas plus précise, c’est la moyenne qui l’est.`;
      },
    },
    measure: {
      text: "u<sub>A</sub> = s/√n : incertitude-type sur la moyenne de n mesures.",
      q: "Pourquoi quatre fois plus de mesures ne divisent-elles u_A que par 2 ?",
      opts: [
        { t: "L’incertitude sur la moyenne décroît comme 1/√n, et √4 = 2", ok: true, fb: "u<sub>A</sub> = s/√n : pour diviser u<sub>A</sub> par 10, il faudrait 100 fois plus de mesures. Répéter a un rendement décroissant." },
        { t: "L’écart-type s diminue quand on répète", fb: "Non : s décrit la dispersion d’une mesure isolée ; il reste du même ordre quel que soit n." },
        { t: "La résolution de l’afficheur limite le gain", fb: "La résolution entre dans u<sub>B</sub>, pas dans u<sub>A</sub> = s/√n." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où l’instrument (type B) pèse plus de 50 % de l’incertitude composée.",
      hint: "une dispersion faible et un afficheur grossier.",
      demo: [["s", 0.05], ["res", 0.5]],
      check: (c) => c.out.cB > 50,
      reveal: (c) => `Type B : ${f(c.out.cB, 0)} % de u<sub>c</sub>². Répéter les mesures ne servirait presque plus à rien : seul un instrument plus fin réduirait l’incertitude.`,
    },
    diag: {
      story: "Le technicien annonce une incertitude-type de près de 0,3 mm sur des diamètres d’éprouvettes, alors que ses mesures répétées ne s’écartent que de quelques centièmes.",
      preset: { n: 8, s: 0.18, res: 1 },
      culprit: "res",
      fix: ["res", 0.05],
      symptom: (c) => `u<sub>c</sub> = ${f(c.out.uc, 3)} mm, dont ${f(c.out.cB, 0)} % vient du type B.`,
      target: (c) => c.out.uc <= 0.08 && c.v("n") === 8 && near(c.v("s"), 0.18, 1e-9),
      targetTxt: "u<sub>c</sub> ≤ 0,08 mm, sans changer n ni s",
      now: (c) => `u<sub>c</sub> = ${f(c.out.uc, 3)} mm`,
      hint: "u<sub>B</sub> = (résolution/2)/√3 : quelle est la résolution réglée ?",
      explain: "La résolution d’affichage était réglée au millimètre : u<sub>B</sub> = 0,5/√3 ≈ 0,29 mm écrasait tout. Un pied à coulisse au 1/20 de mm ramène u<sub>B</sub> à 0,014 mm.",
    },
  };

  /* ---------- 02 · Incertitude composée ---------- */
  AT.compose = {
    compute(v) {
      const uA = v("uA"), uB = v("uB");
      const uc = Math.sqrt(uA * uA + uB * uB);
      return { uc, sum: uA + uB, cA: uA * uA / (uc * uc) * 100 };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("uA"), 0.08, 1e-9)) {
        if (near(c.v("uB"), 0.04, 1e-9)) m.b40 = c.out.uc;
        if (near(c.v("uB"), 0.01, 1e-9) && m.b40) m.b10 = c.out.uc;
      }
    },
    predict: {
      q: "u_A = 0,08 mm et u_B = 0,04 mm. L’incertitude composée u_c vaut environ…",
      opts: [
        { t: "0,12 mm : on additionne" },
        { t: "0,09 mm", ok: true },
        { t: "0,08 mm : on garde la plus grande" },
      ],
    },
    observe: {
      focus: ["uB"], auto: [["uA", 0.08], ["uB", 0.04], ["uB", 0.01]],
      task: "Gardez u_A = 0,08 mm. Réglez u_B = 0,04 mm, puis divisez-la par 4 (0,01 mm) et suivez u_c.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "u_A = 0,08 mm et u_B = 0,04 mm", ok: !!m.b40 },
          { t: "Puis u_B = 0,01 mm", ok: !!m.b10 },
        ];
        return { items, done: !!m.b10 };
      },
      reveal(c) {
        const m = c.mem;
        const g = m.b40 && m.b10 ? (1 - m.b10 / m.b40) * 100 : 0;
        return `u<sub>c</sub> est passée de ${f(m.b40 || 0, 3)} à ${f(m.b10 || 0, 3)} mm : seulement ${f(g, 0)} % de gain pour une source divisée par 4. Une petite source, élevée au carré, pèse très peu.`;
      },
    },
    measure: {
      text: "u<sub>c</sub> = √(u<sub>A</sub>² + u<sub>B</sub>²) : on additionne les variances, pas les incertitudes.",
      q: "Pourquoi diviser u_B par 4 a-t-il si peu réduit u_c ?",
      opts: [
        { t: "u_B² ne représentait que 20 % de u_c² : la source dominante reste u_A", ok: true, fb: "0,04² = 0,0016 contre 0,08² = 0,0064 : u<sub>B</sub> pesait 20 % de la variance. On agit d’abord sur la contribution dominante." },
        { t: "Le calcul plafonne u_c à la plus grande des deux", fb: "u<sub>c</sub> est toujours un peu plus grande que la plus grande des deux, sans s’y réduire." },
        { t: "u_B n’intervient pas dans u_c", fb: "Elle intervient, mais par son carré : petite source, très petit poids." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où la somme arithmétique u_A + u_B surestime u_c d’au moins 40 %.",
      hint: "deux contributions de même taille.",
      demo: [["uA", 0.2], ["uB", 0.2]],
      check: (c) => c.out.sum / c.out.uc >= 1.4,
      reveal: (c) => `Somme : ${f(c.out.sum, 3)} mm, u<sub>c</sub> : ${f(c.out.uc, 3)} mm, soit ${f((c.out.sum / c.out.uc - 1) * 100, 0)} % d’écart. L’erreur est maximale (√2, soit 41 %) quand les deux sources sont égales.`,
    },
    diag: {
      story: "Sur un essai de routine, u_c dépasse 0,4 mm alors que l’instrument est neuf. Un opérateur débutant a réalisé les mesures.",
      preset: { uA: 0.4, uB: 0.02 },
      culprit: "uA",
      fix: ["uA", 0.08],
      symptom: (c) => `u<sub>c</sub> = ${f(c.out.uc, 3)} mm, dont ${f(c.out.cA, 0)} % de type A.`,
      target: (c) => c.out.uc <= 0.1 && near(c.v("uB"), 0.02, 1e-9),
      targetTxt: "u<sub>c</sub> ≤ 0,10 mm, instrument inchangé",
      now: (c) => `u<sub>c</sub> = ${f(c.out.uc, 3)} mm`,
      hint: "l’instrument est neuf : regardez la dispersion.",
      explain: "La dispersion des répétitions (type A) faisait 99 % de la variance : on forme l’opérateur et on fixe le mode opératoire avant de racheter un instrument.",
    },
  };

  /* ---------- 03 · Propagation : section et résistance ---------- */
  AT.prop = {
    compute(v) {
      const D = v("D"), uD = v("uD"), F = v("F"), uF = v("uF");
      const A = Math.PI * D * D / 4, sigma = F * 1000 / A;
      const rF = uF / F, rA = 2 * uD / D;
      const rel = Math.sqrt(rF * rF + rA * rA);
      return { sigma, uSig: sigma * rel, cF: rF * rF / (rel * rel) * 100, cA: rA * rA / (rel * rel) * 100 };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("uF"), 0.5, 0.05)) {
        if (near(c.v("uD"), 0.1, 0.005)) m.lo = c.out.cA;
        if (near(c.v("uD"), 0.4, 0.005) && m.lo != null) m.hi = c.out.cA;
      }
    },
    predict: {
      q: "La section d’une éprouvette vaut A = πD²/4. L’incertitude relative sur le diamètre se retrouve dans celle de la section…",
      opts: [
        { t: "divisée par 2" },
        { t: "multipliée par 2", ok: true },
        { t: "telle quelle" },
      ],
    },
    observe: {
      focus: ["uF", "uD"], auto: [["uF", 0.5], ["uD", 0.1], ["uD", 0.4]],
      task: "Réglez u(F) = 0,5 kN (force très bien connue). Puis faites passer u(D) de 0,1 à 0,4 mm et suivez la contribution de la section.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "u(F) = 0,5 kN et u(D) = 0,1 mm", ok: m.lo != null },
          { t: "Puis u(D) = 0,4 mm", ok: m.hi != null },
        ];
        return { items, done: m.hi != null };
      },
      reveal: (c) => `La part de la section dans u(σ) est passée de ${f(c.mem.lo || 0, 0)} % à ${f(c.mem.hi || 0, 0)} %. Quelques dixièmes de millimètre suffisent, parce que le diamètre est élevé au carré.`,
    },
    measure: {
      text: "σ = F/A et A = πD²/4 : u(σ)/σ = √[(u(F)/F)² + (2 u(D)/D)²].",
      q: "Pourquoi u(D)/D compte-t-il double ?",
      opts: [
        { t: "L’exposant 2 de D² devient un coefficient 2 sur l’incertitude relative", ok: true, fb: "Pour un produit de puissances, les incertitudes relatives se composent pondérées par les exposants : u(A)/A = 2 u(D)/D." },
        { t: "On mesure le diamètre deux fois", fb: "Le nombre de mesures joue sur u<sub>A</sub>, pas sur la propagation." },
        { t: "Le diamètre est plus difficile à mesurer que la force", fb: "La difficulté de mesure est dans u(D) lui-même ; le facteur 2 vient de la formule." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où force et section pèsent à peu près autant (chacune entre 40 et 60 % de u(σ)²).",
      hint: "u(F)/F et 2 u(D)/D doivent être égaux.",
      demo: [["F", 380], ["uF", 0.5], ["uD", 0.08]],
      check: (c) => c.out.cF >= 40 && c.out.cF <= 60,
      reveal: (c) => `Force ${f(c.out.cF, 0)} %, section ${f(c.out.cA, 0)} % : u(F)/F ≈ 2 u(D)/D. C’est le réglage où investir sur l’un ou l’autre rapporte autant.`,
    },
    diag: {
      story: "Sur une série d’essais, u(σ) a triplé d’un coup. Les éprouvettes et le pied à coulisse sont les mêmes que d’habitude.",
      preset: { D: 118, uD: 0.15, F: 380, uF: 15 },
      culprit: "uF",
      fix: ["uF", 4.5],
      symptom: (c) => `u(σ) = ${f(c.out.uSig, 2)} MPa pour σ = ${f(c.out.sigma, 1)} MPa.`,
      target: (c) => c.out.uSig <= 0.5 && c.v("D") === 118 && near(c.v("uD"), 0.15, 1e-9),
      targetTxt: "u(σ) ≤ 0,5 MPa, diamètre et pied à coulisse inchangés",
      now: (c) => `u(σ) = ${f(c.out.uSig, 2)} MPa`,
      hint: "si le diamètre n’a pas changé, cherchez du côté de la force.",
      explain: "L’incertitude sur la force (15 kN, soit 4 %) dominait : un afficheur de presse mal étalonné. Revenue à 4,5 kN, elle ramène u(σ) à environ 0,4 MPa.",
    },
  };

  /* ---------- 04 · Incertitude élargie et verdict ---------- */
  const verdict = (lo, hi, L) => (lo >= L ? "conforme" : hi < L ? "non conforme" : "zone de doute");
  AT.conform = {
    compute(v) {
      const sig = v("sig"), uc = v("uc"), k = v("k"), L = v("Lspec");
      const U = k * uc;
      return { U, lo: sig - U, hi: sig + U, ver: verdict(sig - U, sig + U, L) };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("sig"), 26.4, 1e-9) && near(c.v("uc"), 0.55, 1e-9) && near(c.v("Lspec"), 25, 1e-9)) {
        if (c.v("k") === 2) m.k2 = c.out.ver;
        if (c.v("k") === 3 && m.k2) m.k3 = c.out.ver;
      }
    },
    predict: {
      q: "σ̄ = 26,4 MPa, u_c = 0,55 MPa, limite 25 MPa. On passe de k = 2 (≈ 95 %) à k = 3 (≈ 99,7 %). Le verdict…",
      opts: [
        { t: "reste conforme : la moyenne n’a pas bougé" },
        { t: "passe en zone de doute", ok: true },
        { t: "devient non conforme" },
      ],
    },
    observe: {
      focus: ["k"], auto: [["k", 2], ["k", 3]],
      task: "Avec les réglages de départ (26,4 MPa, 0,55 MPa, limite 25 MPa), comparez k = 2 puis k = 3. Regardez l’intervalle face à la limite.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "k = 2 observé", ok: !!m.k2 },
          { t: "Puis k = 3", ok: !!m.k3 },
        ];
        return { items, done: !!m.k3 };
      },
      reveal: (c) => `Verdict à k = 2 : ${c.mem.k2 || "?"} ; à k = 3 : ${c.mem.k3 || "?"}. La borne basse est passée de 25,30 à 24,75 MPa : l’intervalle chevauche maintenant la limite.`,
    },
    measure: {
      text: "U = k·u<sub>c</sub> ; on compare tout l’intervalle [σ̄ − U ; σ̄ + U] à la limite.",
      q: "Pourquoi le verdict change-t-il alors que la moyenne est la même ?",
      opts: [
        { t: "Un niveau de confiance plus élevé élargit l’intervalle, qui finit par chevaucher la limite", ok: true, fb: "U = k u<sub>c</sub> : demander 99,7 % au lieu de 95 % élargit l’intervalle de 50 %. Tant qu’il chevauche la limite, on ne déclare pas la conformité." },
        { t: "k modifie la moyenne mesurée", fb: "k ne touche que la largeur de l’intervalle, jamais la moyenne." },
        { t: "La limite de spécification dépend de k", fb: "La limite est fixée par le cahier des charges ; seul l’intervalle bouge." },
      ],
    },
    plus: {
      task: "Gardez σ̄ = 26,4 MPa, la limite à 25 MPa et k = 3 : sortez de la zone de doute.",
      hint: "le seul levier restant est la qualité de la mesure.",
      demo: [["uc", 0.45]],
      check: (c) => c.v("k") === 3 && near(c.v("sig"), 26.4, 1e-9) && near(c.v("Lspec"), 25, 1e-9) && c.out.ver === "conforme",
      reveal: (c) => `Avec u<sub>c</sub> = ${f(c.v("uc"), 2)} MPa, U = ${f(c.out.U, 2)} MPa et la borne basse vaut ${f(c.out.lo, 2)} MPa. Mesurer mieux est la seule façon honnête de conclure avec plus de confiance.`,
    },
    diag: {
      story: "Un béton clairement au-dessus de la classe visée (27,5 MPa pour une limite de 25 MPa) ressort en zone de doute, à k = 2.",
      preset: { sig: 27.5, uc: 2, k: 2, Lspec: 25 },
      culprit: "uc",
      fix: ["uc", 0.55],
      symptom: (c) => `Intervalle [${f(c.out.lo, 2)} ; ${f(c.out.hi, 2)}] MPa : ${c.out.ver}.`,
      target: (c) => c.out.ver === "conforme" && near(c.v("sig"), 27.5, 1e-9) && c.v("k") === 2 && near(c.v("Lspec"), 25, 1e-9),
      targetTxt: "verdict conforme, à moyenne, k et limite inchangés",
      now: (c) => `${c.out.ver}, borne basse ${f(c.out.lo, 2)} MPa`,
      hint: "à k = 2, quelle incertitude-type faudrait-il pour que la borne basse dépasse 25 MPa ?",
      explain: "L’incertitude-type saisie (2 MPa) était l’écart-type des éprouvettes et non l’incertitude sur la moyenne : avec u<sub>c</sub> ≤ 1,25 MPa, l’intervalle repasse au-dessus de la limite.",
    },
  };

  /* ---------- 05 · Campagne multi-éprouvettes ---------- */
  AT.lot = {
    compute(v) {
      const s1 = v("s1"), s2 = v("s2"), s3 = v("s3"), fck = v("fck");
      const mean = (s1 + s2 + s3) / 3;
      const s = Math.sqrt(((s1 - mean) ** 2 + (s2 - mean) ** 2 + (s3 - mean) ** 2) / 2);
      const U = 2 * s / Math.sqrt(3);
      const okInd = Math.min(s1, s2, s3) >= fck - 4, okMean = mean >= fck;
      const reserve = mean - U < fck && mean + U > fck;
      return { mean, s, U, okInd, okMean, reserve };
    },
    record(c) {
      const m = c.mem;
      if (c.v("fck") === 30 && near(c.v("s1"), 34, 1e-9) && near(c.v("s2"), 34, 1e-9)) {
        if (c.v("s3") >= 33.9) m.hi = true;
        if (c.v("s3") <= 24.1 && m.hi) m.lo = { mean: c.out.mean, okInd: c.out.okInd, okMean: c.out.okMean };
      }
    },
    predict: {
      q: "Classe visée f_ck = 30 MPa. Trois éprouvettes : 34, 34 et 24 MPa (moyenne 30,7 MPa). Le lot est…",
      opts: [
        { t: "conforme : la moyenne dépasse 30 MPa" },
        { t: "non conforme : une éprouvette est trop faible", ok: true },
        { t: "impossible à juger avec trois éprouvettes" },
      ],
    },
    observe: {
      focus: ["s3"], auto: [["fck", 30], ["s1", 34], ["s2", 34], ["s3", 34], ["s3", 24]],
      task: "Réglez f_ck = 30 MPa et les deux premières éprouvettes à 34 MPa. Partez de σ3 = 34 MPa, puis descendez-la jusqu’à 24 MPa en suivant les deux critères.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "f_ck = 30 MPa, σ1 = σ2 = 34 MPa, σ3 = 34 MPa", ok: !!m.hi },
          { t: "Puis σ3 = 24 MPa", ok: !!m.lo },
        ];
        return { items, done: !!m.lo };
      },
      reveal: (c) => `À σ3 = 24 MPa, la moyenne (${f(c.mem.lo ? c.mem.lo.mean : 0, 1)} MPa) passe encore, mais le critère individuel (au moins f<sub>ck</sub> − 4 = 26 MPa) tombe. Une seule éprouvette faible suffit à refuser le lot ; l’intervalle U a aussi grandi avec la dispersion.`,
    },
    measure: {
      text: "Critères simplifiés : moyenne ≥ f<sub>ck</sub> et chaque éprouvette ≥ f<sub>ck</sub> − 4 MPa.",
      q: "Pourquoi exiger un critère individuel en plus de la moyenne ?",
      opts: [
        { t: "La moyenne peut masquer une zone faible de l’ouvrage ; le critère individuel limite la dispersion vers le bas", ok: true, fb: "Deux bonnes éprouvettes peuvent compenser une mauvaise dans la moyenne, pas dans la structure : la partie faible reste faible." },
        { t: "Pour avoir plus de chances d’accepter le lot", fb: "C’est l’inverse : le second critère rend l’acceptation plus exigeante." },
        { t: "Parce que la moyenne de trois valeurs n’a pas de sens", fb: "La moyenne a un sens ; elle ne dit simplement rien de la dispersion." },
      ],
    },
    plus: {
      task: "Composez un lot conforme sans réserve : les deux critères respectés et l’intervalle sur la moyenne entièrement au-dessus de f_ck.",
      hint: "des éprouvettes proches les unes des autres, nettement au-dessus de la classe.",
      demo: [["fck", 30], ["s1", 33], ["s2", 33.5], ["s3", 34]],
      check: (c) => c.out.okInd && c.out.okMean && !c.out.reserve,
      reveal: (c) => `Moyenne ${f(c.out.mean, 2)} MPa, U = ${f(c.out.U, 2)} MPa : l’intervalle ne touche pas f<sub>ck</sub> = ${c.v("fck")} MPa. C’est la faible dispersion, plus que la moyenne élevée, qui lève la réserve.`,
    },
    diag: {
      story: "Le béton d’une dalle est refusé alors que deux éprouvettes sur trois dépassent largement la classe visée de 30 MPa.",
      preset: { s1: 36, s2: 35, s3: 21, fck: 30 },
      culprit: "s3",
      fix: ["s3", 30],
      symptom: (c) => `Moyenne ${f(c.out.mean, 1)} MPa ; critère individuel : ${c.out.okInd ? "OK" : "échec"}.`,
      target: (c) => c.out.okInd && c.out.okMean && near(c.v("s1"), 36, 1e-9) && near(c.v("s2"), 35, 1e-9) && c.v("fck") === 30,
      targetTxt: "les deux critères respectés, sans toucher aux deux bonnes éprouvettes",
      now: (c) => `min ${f(Math.min(c.v("s1"), c.v("s2"), c.v("s3")), 1)} MPa, moyenne ${f(c.out.mean, 1)} MPa`,
      hint: "quelle éprouvette est sous f<sub>ck</sub> − 4 ?",
      explain: "La troisième éprouvette (21 MPa) faisait échouer le critère individuel. Sur un vrai chantier, on cherche d’abord la cause (surfaçage, cure, transport) avant de conclure : la contre-épreuve remplace l’éprouvette douteuse.",
    },
  };

  /* ---------- 06 · Budget d’incertitudes ---------- */
  AT.budget = {
    compute(v) {
      const ucal = v("Ucal") / 2, uder = v("ader") / Math.sqrt(3), ures = (v("rF") / 2) / Math.sqrt(3);
      const uc = Math.sqrt(ucal ** 2 + uder ** 2 + ures ** 2);
      const p = (u) => u * u / (uc * uc) * 100;
      const parts = [["étalonnage", p(ucal)], ["dérive", p(uder)], ["résolution", p(ures)]].sort((a, b) => b[1] - a[1]);
      return { ucal, uder, ures, uc, pres: p(ures), top: parts[0][0] };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("ader"), 2.4, 1e-9)) {
        if (near(c.v("Ucal"), 5.2, 1e-9) && near(c.v("rF"), 0.5, 1e-9)) m.r5 = c.out.uc;
        if (near(c.v("Ucal"), 5.2, 1e-9) && near(c.v("rF"), 0.1, 1e-9) && m.r5) m.r1 = c.out.uc;
        if (near(c.v("Ucal"), 2.6, 1e-9) && near(c.v("rF"), 0.1, 1e-9) && m.r1) m.cal = c.out.uc;
      }
    },
    predict: {
      q: "La presse affiche la force à 0,5 kN près. On achète un afficheur cinq fois plus fin (0,1 kN). u_c(F) baisse…",
      opts: [
        { t: "d’environ 80 %" },
        { t: "d’environ 20 %" },
        { t: "presque pas", ok: true },
      ],
    },
    observe: {
      focus: ["rF", "Ucal"], auto: [["rF", 0.5], ["rF", 0.1], ["Ucal", 2.6]],
      task: "Partez des réglages de départ. Passez la résolution de 0,5 à 0,1 kN, puis divisez par 2 l’incertitude d’étalonnage (de 5,2 à 2,6 kN).",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Résolution 0,5 kN (départ)", ok: !!m.r5 },
          { t: "Résolution 0,1 kN", ok: !!m.r1 },
          { t: "Puis étalonnage à 2,6 kN", ok: !!m.cal },
        ];
        return { items, done: !!m.cal };
      },
      reveal: (c) => `u<sub>c</sub>(F) : ${f(c.mem.r5 || 0, 2)} kN, puis ${f(c.mem.r1 || 0, 2)} kN avec l’afficheur fin, puis ${f(c.mem.cal || 0, 2)} kN avec un meilleur étalonnage. L’investissement « visible » ne rapportait rien ; le certificat d’étalonnage, si.`,
    },
    measure: {
      text: "u<sub>c</sub>(F)² = u<sub>cal</sub>² + u<sub>dér</sub>² + u<sub>rés</sub>², avec u<sub>cal</sub> = U<sub>cal</sub>/2 et u = a/√3 pour une loi rectangulaire.",
      q: "Pourquoi l’afficheur plus fin ne sert-il presque à rien ici ?",
      opts: [
        { t: "La résolution pesait moins de 1 % de u_c² : on investit sur la contribution dominante", ok: true, fb: "Contributions en carrés : l’étalonnage faisait 78 % du budget, la résolution 0,2 %. Le prochain euro va à l’étalonnage." },
        { t: "Un afficheur plus fin augmente la dérive", fb: "La dérive est une source indépendante ; elle n’a pas bougé." },
        { t: "La résolution n’entre pas dans le budget", fb: "Elle y entre, par (résolution/2)/√3, mais avec un poids minime ici." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où la dérive devient la priorité d’investissement.",
      hint: "un étalonnage récent et précis, une presse qui dérive.",
      demo: [["Ucal", 2], ["ader", 4]],
      check: (c) => c.out.top === "dérive",
      reveal: (c) => `Dérive : u<sub>dér</sub> = ${f(c.out.uder, 2)} kN contre u<sub>cal</sub> = ${f(c.out.ucal, 2)} kN. La réponse « où investir » dépend du budget, pas d’une règle fixe.`,
    },
    diag: {
      story: "Après un changement de prestataire d’étalonnage, u_c(F) a presque doublé. La presse et l’afficheur n’ont pas changé.",
      preset: { Ucal: 10, ader: 2.4, rF: 0.5 },
      culprit: "Ucal",
      fix: ["Ucal", 5.2],
      symptom: (c) => `u<sub>c</sub>(F) = ${f(c.out.uc, 2)} kN, priorité : ${c.out.top}.`,
      target: (c) => c.out.uc <= 3 && near(c.v("ader"), 2.4, 1e-9) && near(c.v("rF"), 0.5, 1e-9),
      targetTxt: "u<sub>c</sub>(F) ≤ 3 kN, presse et afficheur inchangés",
      now: (c) => `u<sub>c</sub>(F) = ${f(c.out.uc, 2)} kN`,
      hint: "le seul élément qui a changé est le certificat.",
      explain: "Le nouveau certificat annonçait U<sub>cal</sub> = 10 kN (k = 2) : u<sub>cal</sub> = 5 kN dominait tout. Le choix du prestataire d’étalonnage est une décision métrologique, pas seulement un prix.",
    },
  };

  const B = (id, icon, name, desc, how, check) => ({ id, icon, name, desc, how, check });
  const IDS = ["ab", "compose", "prop", "conform", "lot", "budget"];
  const BADGES = [
    B("racine-n", "√n", "Loi en 1/√n", "Quatre fois plus de mesures, deux fois moins d’incertitude.", "Terminer l’observation de l’atelier 01.", (x) => !!x.A("ab").obsDone),
    B("pythagore", "²", "Variances", "Une petite source pèse très peu dans u_c.", "Terminer l’observation de l’atelier 02.", (x) => !!x.A("compose").obsDone),
    B("exposant", "×2", "Exposant", "Le diamètre au carré compte double.", "Terminer l’observation de l’atelier 03.", (x) => !!x.A("prop").obsDone),
    B("zone-doute", "U", "Hors de doute", "Conclure à 99,7 % en mesurant mieux.", "Le piège de l’atelier 04.", (x) => !!x.A("conform").plusDone),
    B("lot-sur", "3", "Lot sans réserve", "Un lot conforme sans chevauchement.", "Le piège de l’atelier 05.", (x) => !!x.A("lot").plusDone),
    B("levier", "€", "Bon levier", "La dérive devenue priorité d’investissement.", "Le piège de l’atelier 06.", (x) => !!x.A("budget").plusDone),
    B("pressentiment", "P", "Bon pressentiment", "Quatre prédictions justes.", "Quatre prédictions justes à l’étape 1.", (x) => Object.values(x.store.at).filter((a) => a.predOk).length >= 4),
    B("lucidite", "?", "Lucidité", "Sûr·e de vous et pourtant détrompé·e, puis l’explication trouvée.", "Se tromper avec assurance, puis valider l’explication.", (x) => Object.values(x.store.at).some((a) => a.pred != null && !a.predOk && a.conf === "Sûr·e" && a.explOk)),
    B("diagnostiqueur", "D", "Diagnostiqueur", "Trois essais remis d’aplomb en mode diagnostic.", "Réussir trois diagnostics.", (x) => (x.store.nDiag || 0) >= 3),
    B("complet", "6", "Parcours complet", "Les six ateliers parcourus jusqu’au diagnostic.", "Terminer les six parcours.", (x) => IDS.every((k) => x.A(k).diagDone)),
  ];

  window.LABV3_PARCOURS = { storeKey: "r113_parcours", ateliers: AT, badges: BADGES, bilanHost: "defi", keep2d: {} };
})();
