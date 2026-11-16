/* =====================================================================
   R1-10 · parcours pédagogiques v3 (mission Valdeau)
   Chaque atelier : predict (POÉ), observe (tâche détectée), measure (explication),
   plus (le piège), diag (cas pathologique). Données génériques : aucune valeur du dossier noté.
   ===================================================================== */
(() => {
  const g = 9.81;
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const near = (x, a, tol) => Math.abs(x - a) <= tol;
  const regime = (Re) => (Re < 2000 ? "Laminaire" : Re < 4000 ? "Transition" : "Turbulent");
  // λ de Darcy (même formule que la v1 de l'atelier 05)
  function lambdaDarcy(Re, er) {
    if (Re < 2000) return { lam: 64 / Math.max(Re, 1), regime: "laminaire" };
    const sj = (R) => { const d = Math.log10(er / 3.7 + 5.74 / Math.pow(R, 0.9)); return 0.25 / (d * d); };
    if (Re < 4000) { const t = (Re - 2000) / 2000, s = t * t * (3 - 2 * t); return { lam: (64 / 2000) * (1 - s) + sj(4000) * s, regime: "transition" }; }
    const lam = sj(Re);
    const kp = Re * er * Math.sqrt(lam / 8);
    return { lam, regime: kp < 5 ? "turbulent lisse" : kp < 70 ? "turbulent de transition" : "turbulent rugueux" };
  }
  window.LAB_R110 = { lambdaDarcy };

  const AT = {};

  /* ---------- 01 · Débit, section, Reynolds ---------- */
  AT.debit = {
    compute(v) {
      const Q = v("Q") / 1000, D = v("D") / 1000, nu = v("nu") * 1e-6;
      const vel = Q / (Math.PI * D * D / 4);
      const Re = vel * D / nu;
      return { vel, Re, reg: regime(Re) };
    },
    record(c) {
      const m = c.mem;
      (m.regs = m.regs || {})[c.out.reg] = true;
      if (near(c.v("Q"), 0.4, 0.03)) {
        if (near(c.v("D"), 100, 5)) m.at100 = { Re: c.out.Re, reg: c.out.reg };
        if (near(c.v("D"), 200, 5) && m.at100) m.at200 = { Re: c.out.Re, reg: c.out.reg };
      }
    },
    predict: {
      q: "Même débit, mais un tuyau deux fois plus gros. L’écoulement devient-il plus ou moins turbulent ?",
      opts: [
        { t: "Plus turbulent : il passe plus d’eau d’un coup" },
        { t: "Moins turbulent", ok: true },
        { t: "Pareil : le débit n’a pas changé" },
      ],
    },
    observe: {
      focus: ["Q", "D"], auto: [["Q", 0.4], ["D", 100], ["D", 200]],
      task: "Réglez Q = 0,4 L/s. Partez d’un diamètre de 100 mm, puis passez à 200 mm sans toucher au débit. Regardez les particules et les lignes de courant.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Débit réglé à 0,4 L/s", ok: near(c.v("Q"), 0.4, 0.03) },
          { t: "Tuyau de 100 mm observé", ok: !!m.at100 },
          { t: "Puis tuyau de 200 mm, même débit", ok: !!m.at200 },
        ];
        return { items, done: !!m.at200 };
      },
      reveal(c) {
        const m = c.mem;
        const a = m.at100 || {}, b = m.at200 || {};
        return `Le régime est passé de « ${(a.reg || "?").toLowerCase()} » à « ${(b.reg || "?").toLowerCase()} » : les lignes de courant se sont calmées alors que le tuyau est plus gros. Le nombre de Reynolds a été divisé par 2 ; l’étape 3 explique pourquoi.`;
      },
    },
    measure: {
      text: "Re = vD/ν et, à débit fixé, v = 4Q/(πD²) : donc Re = 4Q/(πDν).",
      q: "Pourquoi un tuyau plus gros, à débit égal, calme-t-il l’écoulement ?",
      opts: [
        { t: "La vitesse est divisée par 4 quand D double, et Re ∝ v·D est donc divisé par 2", ok: true, fb: "Re = 4Q/(πDν) : à débit fixé, Re varie comme 1/D. Le diamètre gagne en largeur ce qu’il perd, en double, en vitesse." },
        { t: "L’eau devient plus visqueuse dans un gros tuyau", fb: "ν est une propriété du fluide (et de sa température), pas du tuyau." },
        { t: "Le débit diminue quand le diamètre augmente", fb: "Non : le débit est imposé par les usagers, il reste fixe ici." },
      ],
    },
    plus: {
      task: "En distribution, l’eau est presque toujours turbulente. Trouvez un réglage réaliste, avec une vitesse entre 0,5 et 1,5 m/s, et vérifiez le régime.",
      hint: "partez de D = 120 mm et montez le débit.",
      check: (c) => c.out.vel >= 0.5 && c.out.vel <= 1.5,
      reveal: (c) => `Avec v = ${f(c.out.vel, 2)} m/s et D = ${c.v("D")} mm, Re ≈ ${f(c.out.Re, 0)} : régime ${c.out.reg.toLowerCase()}. Le laminaire n’existe pratiquement pas en AEP ; les plages élargies des curseurs servaient seulement à le rendre visible.`,
    },
    diag: {
      story: "Les riverains de l’artère principale entendent la conduite siffler et subissent des coups de bélier : la vitesse de l’eau est excessive.",
      preset: { Q: 8, D: 40, nu: 1.5 },
      culprit: "D",
      symptom: (c) => `Vitesse moyenne de ${f(c.out.vel, 2)} m/s pour un débit imposé de ${f(c.v("Q"), 1)} L/s.`,
      target: (c) => c.out.vel >= 0.5 && c.out.vel <= 1.5 && near(c.v("Q"), 8, 0.01),
      targetTxt: "vitesse entre 0,5 et 1,5 m/s, débit inchangé",
      now: (c) => `v = ${f(c.out.vel, 2)} m/s`,
      hint: "c’est la section qui fixe la vitesse : v = Q/S.",
      explain: "À débit imposé, seul le diamètre règle la vitesse : v = 4Q/(πD²). Il fallait passer de 40 mm à plus de 80 mm.",
    },
  };

  /* ---------- 02 · Fluides ---------- */
  AT.fluide = {
    compute(v) {
      const rho = v("rho"), mu = v("mu") * 1e-3;
      return { d: rho / 999, nu: mu / rho };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("rho"), 1000, 12)) { if (c.v("mu") <= 1.2) m.muLow = true; if (c.v("mu") >= 15) m.muHigh = true; }
      if (m.muLow && m.muHigh && Math.abs(c.v("rho") - 1000) >= 80) m.rhoMoved = true;
      if (c.out.d > 1.01) m.dense = true;
      if (c.out.d < 0.99) m.light = true;
    },
    predict: {
      q: "On ajoute un additif qui rend le liquide bien plus visqueux (« épais »), sans changer sa masse volumique. Le cube témoin, aussi dense que l’eau…",
      opts: [
        { t: "flotte plus haut : le liquide épais le porte mieux" },
        { t: "coule : le liquide épais l’entraîne vers le fond" },
        { t: "ne bouge pas : seule la masse volumique compte", ok: true },
      ],
    },
    observe: {
      focus: ["mu", "rho"], auto: [["rho", 1000], ["mu", 1], ["mu", 18], ["rho", 1200]],
      task: "Gardez ρ = 1000 kg/m³ et faites varier μ de 1 à 20 mPa·s en regardant le cube. Ensuite seulement, faites varier ρ.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "μ faible (≤ 1,2 mPa·s) à ρ = 1000", ok: !!m.muLow },
          { t: "μ forte (≥ 15 mPa·s) à ρ = 1000", ok: !!m.muHigh },
          { t: "Puis ρ modifiée", ok: !!m.rhoMoved },
        ];
        return { items, done: !!m.rhoMoved };
      },
      reveal: () => "Le cube n’a pas bougé tant que seule la viscosité variait : la flottaison dépend de la densité d = ρ/ρ<sub>eau</sub>, pas de la viscosité. En revanche, la flèche rouge des plaques a grandi : la viscosité règle le frottement entre couches.",
    },
    measure: {
      text: "d = ρ/ρ<sub>eau</sub> décide de la flottaison ; ν = μ/ρ intervient dans le nombre de Reynolds.",
      q: "Dans le nombre de Reynolds, quelle viscosité intervient, et pourquoi ?",
      opts: [
        { t: "ν = μ/ρ, car Re compare l’inertie (liée à ρ) aux frottements (liés à μ)", ok: true, fb: "Re = ρvD/μ = vD/ν : masse volumique et viscosité dynamique comptent ensemble, à travers leur rapport." },
        { t: "μ seule, car c’est elle qui « freine »", fb: "Re = ρvD/μ : la masse volumique (l’inertie) compte autant que μ." },
        { t: "ρ seule, car c’est elle qui fait couler ou flotter", fb: "La flottaison et le régime d’écoulement sont deux questions différentes." },
      ],
    },
    plus: {
      task: "Un fluide plus dense que l’eau peut-il avoir une viscosité cinématique plus faible ? Trouvez un tel réglage.",
      hint: "une masse volumique élevée et une viscosité dynamique faible.",
      check: (c) => c.out.d > 1.01 && c.out.nu < 1.0e-6,
      reveal: (c) => `Oui : avec ρ = ${c.v("rho")} kg/m³ et μ = ${f(c.v("mu"), 1)} mPa·s, ν = ${c.out.nu.toExponential(2).replace(".", ",")} m²/s, plus faible que celle de l’eau. Densité et viscosité sont deux propriétés indépendantes.`,
    },
    diag: {
      story: "Le laboratoire annonce un additif « plus dense que l’eau », mais dans l’éprouvette le cube témoin coule : une valeur a été mal saisie.",
      preset: { rho: 860, mu: 1.8 },
      culprit: "rho",
      symptom: (c) => `Densité saisie d = ${f(c.out.d, 3)} : le cube témoin (ρ = 999 kg/m³) ${c.out.d > 1.01 ? "flotte" : "coule"}.`,
      target: (c) => c.out.d >= 1.02 && near(c.v("mu"), 1.8, 0.05),
      targetTxt: "un fluide plus dense que l’eau (d ≥ 1,02), viscosité inchangée",
      now: (c) => `d = ${f(c.out.d, 3)}`,
      hint: "le cube a la masse volumique de l’eau.",
      explain: "Le cube témoin a la masse volumique de l’eau : il ne flotte que si le fluide est plus dense (d > 1). C’est la masse volumique saisie (860 kg/m³) qui contredisait l’annonce du laboratoire.",
    },
  };

  /* ---------- 03 · Hydrostatique ---------- */
  AT.hydro = {
    compute: (v) => ({ PB: v("PA") - v("rho2") * g * v("h") / 1e5 }),
    record(c) {
      const m = c.mem, h = c.v("h");
      if (h <= 0.5) m.h0 = true;
      if (near(h, 10, 0.5)) m.h10 = true;
      if (near(h, 20, 0.5)) m.h20 = true;
    },
    predict: {
      q: "Le hameau B est 10 m plus haut que le point A et l’eau est au repos. La pression en B est…",
      opts: [
        { t: "à peu près la même : l’eau ne bouge pas" },
        { t: "plus faible d’environ 1 bar", ok: true },
        { t: "plus faible d’environ 10 bar" },
      ],
    },
    observe: {
      focus: ["h"], auto: [["h", 0], ["h", 10], ["h", 20]],
      task: "Réglez h = 0 m, puis 10 m, puis 20 m, et suivez la colonne d’eau du piézomètre en B.",
      check(c) {
        const m = c.mem;
        return { items: [{ t: "h = 0 m", ok: !!m.h0 }, { t: "h = 10 m", ok: !!m.h10 }, { t: "h = 20 m", ok: !!m.h20 }], done: !!(m.h0 && m.h10 && m.h20) };
      },
      reveal: () => "La colonne en B a baissé exactement de la hauteur gagnée par B : le haut des deux colonnes reste sur le même plan horizontal, le plan de charge. Monter de 10 m coûte donc 10 m de colonne d’eau.",
    },
    measure: {
      text: "ΔP = ρ·g·h : 10 m d’eau pèsent environ 98 000 Pa, soit environ 1 bar.",
      q: "Pourquoi 10 m de dénivelé valent-ils environ 1 bar ?",
      opts: [
        { t: "Une colonne d’eau de 10 m exerce ρgh ≈ 1000 × 9,81 × 10 ≈ 98 000 Pa, soit environ 1 bar", ok: true, fb: "D’où le repère « 10 mCE ≈ 1 bar », valable pour l’eau." },
        { t: "La pression baisse de 10 % par mètre", fb: "La baisse est linéaire en h, pas proportionnelle à la pression." },
        { t: "1 bar vaut exactement 10 m, quel que soit le fluide", fb: "Non : avec un fluide plus dense, 10 m pèsent davantage (essayez ρ = 1200 kg/m³)." },
      ],
    },
    plus: {
      task: "Ouvrez le robinet : activez « En écoulement » dans la vue 3D. L’eau monte-t-elle jusqu’à B ?",
      check: (c) => !!c.flags["En écoulement"],
      reveal: () => "Oui : tant que la charge en A dépasse celle en B, l’eau monte de A vers B, même si B est plus haut. La ligne piézométrique s’incline, car les frottements consomment de la charge (atelier 05).",
    },
    diag: {
      story: "Au hameau du Plateau, la pression au repos n’est que de 0,9 bar. Le relief est imposé : on ne déplace pas le hameau.",
      preset: { PA: 3.0, h: 21, rho2: 999 },
      culprit: "PA",
      symptom: (c) => `Pression au repos en B : ${f(c.out.PB, 2)} bar, pour un dénivelé de ${f(c.v("h"), 0)} m.`,
      target: (c) => c.out.PB >= 2.2 && near(c.v("h"), 21, 0.01),
      targetTxt: "au moins 2,2 bar en B (consigne Valdeau), dénivelé inchangé",
      now: (c) => `P<sub>B</sub> = ${f(c.out.PB, 2)} bar`,
      hint: "le dénivelé coûte environ 0,1 bar par mètre.",
      explain: "Le dénivelé de 21 m coûte environ 2,06 bar. Pour garder 2,2 bar en B, il faut au moins 4,3 bar au départ : c’est la pression en A, fixée par le réservoir ou un surpresseur, qu’il fallait relever.",
    },
  };

  /* ---------- 04 · Bernoulli ---------- */
  AT.bernoulli = {
    compute(v) {
      const hp = v("Pbern") * 1e5 / (999 * g), hv = v("vbern") ** 2 / (2 * g), z = v("zbern");
      return { hp, hv, H: hp + hv + z, hpT: hp - 8 * hv };
    },
    predict: {
      q: "Dans un rétrécissement (un Venturi), l’eau accélère. La pression au col…",
      opts: [
        { t: "augmente : l’eau y est comprimée" },
        { t: "diminue", ok: true },
        { t: "ne change pas" },
      ],
    },
    observe: {
      focus: ["vbern"], focusAct: "Venturi", auto: [{ act: "Venturi" }, ["vbern", 2.5]],
      task: "Dans la vue 3D, activez « Venturi », puis augmentez la vitesse au-delà de 2 m/s. Regardez la colonne d’eau du piézomètre placé au col.",
      check(c) {
        const items = [{ t: "Venturi activé", ok: !!c.flags.Venturi }, { t: "Vitesse ≥ 2 m/s", ok: c.v("vbern") >= 2 }];
        if (items[0].ok && items[1].ok) c.mem.seen = true;
        return { items, done: !!c.mem.seen };
      },
      reveal: () => "La colonne du col descend : là où l’eau va plus vite, la pression baisse. La ligne dorée de la charge totale H, elle, reste horizontale.",
    },
    measure: {
      text: "Sans frottement, H = P/(ρg) + v²/(2g) + z reste constante le long de la conduite.",
      q: "Pourquoi la pression baisse-t-elle au col ?",
      opts: [
        { t: "La charge totale se conserve : si la charge de vitesse augmente, la charge de pression diminue d’autant", ok: true, fb: "L’énergie change de forme : la pression se transforme en vitesse au col, puis la vitesse redevient pression en aval." },
        { t: "Le col freine l’eau, qui y perd de l’énergie", fb: "Sans frottement, aucune énergie n’est perdue : la ligne dorée H reste horizontale." },
        { t: "L’eau se dilate dans le col", fb: "L’eau est pratiquement incompressible : c’est la vitesse qui change, pas le volume." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où la pression au col devient négative : c’est la cavitation.",
      hint: "baissez la pression et poussez la vitesse, Venturi activé.",
      check: (c) => !!c.flags.Venturi && c.out.hpT < 0,
      reveal: () => "La pression au col passe sous la pression atmosphérique : l’eau peut se vaporiser (cavitation) et les bulles qui implosent abîment vannes et pompes. Un rétrécissement n’est jamais anodin dans un réseau.",
    },
    diag: {
      story: "Un relevé donne une charge totale H = 52 m au point C, alors que le réseau est alimenté sous 35 m de charge : l’une des trois mesures saisies est aberrante.",
      preset: { Pbern: 2.4, vbern: 1, zbern: 27.5 },
      culprit: "zbern",
      symptom: (c) => `Charge totale calculée au point C : H = ${f(c.out.H, 1)} m.`,
      target: (c) => c.out.H >= 33 && c.out.H <= 37 && near(c.v("Pbern"), 2.4, 0.01) && near(c.v("vbern"), 1, 0.01),
      targetTxt: "charge totale H entre 33 et 37 m",
      now: (c) => `H = ${f(c.out.H, 1)} m`,
      hint: "la pression et la vitesse sont mesurées sur place ; l’altitude a été recopiée d’un plan.",
      explain: "Avec P = 2,4 bar (24,5 m) et v = 1 m/s (0,05 m), une charge de 35 m impose z ≈ 10 m : l’altitude de 27,5 m était une erreur de saisie. Le bilan en mètres permet de repérer ce genre d’incohérence en un coup d’œil.",
    },
  };

  /* ---------- 05 · Pertes de charge linéaires ---------- */
  AT.lineaire = {
    compute(v, s) {
      const L = v("L"), D = v("Dlin") / 1000, S = Math.PI * D * D / 4;
      const modeQ = s("linMode") === "Q";
      const Q = modeQ ? v("Qlin") / 1000 : v("vlin") * S;
      const vel = Q / S;
      const Re = vel * D / 1e-6;
      const r = lambdaDarcy(Re, (+s("eps") / 1000) / D);
      return { modeQ, Q, vel, Re, lam: r.lam, regime: r.regime, hf: r.lam * (L / D) * vel * vel / (2 * g) };
    },
    record(c) {
      const m = c.mem;
      if (!c.out.modeQ) return;
      if (near(c.v("Dlin"), 160, 5)) m.big = { hf: c.out.hf, Q: c.v("Qlin") };
      if (near(c.v("Dlin"), 80, 5) && m.big && near(c.v("Qlin"), m.big.Q, 0.05)) m.small = { hf: c.out.hf };
    },
    predict: {
      q: "À débit imposé, on divise le diamètre de la conduite par 2. Les pertes de charge sont multipliées par environ…",
      opts: [{ t: "2" }, { t: "4" }, { t: "32", ok: true }],
    },
    observe: {
      focus: ["linMode", "Dlin"], auto: [["linMode", "Q"], ["Dlin", 160], ["Dlin", 80]],
      task: "Passez en « Débit Q imposé ». Réglez D = 160 mm et regardez les piézomètres, puis passez à D = 80 mm sans toucher au débit.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Mode « débit imposé »", ok: c.out.modeQ },
          { t: "D ≈ 160 mm observé", ok: !!m.big },
          { t: "D ≈ 80 mm, même débit", ok: !!m.small },
        ];
        return { items, done: !!m.small };
      },
      reveal(c) {
        const m = c.mem;
        const r = m.big && m.small ? m.small.hf / m.big.hf : NaN;
        c.mem.ratio = r;
        return `Les colonnes d’eau se sont effondrées : la perte de charge a été multipliée par environ ${isFinite(r) ? f(r, 0) : "30"}. Un tuyau « un peu » trop petit suffit à priver un quartier de pression.`;
      },
    },
    measure: {
      text: "h<sub>f</sub> = λ (L/D) v²/(2g) et, à débit fixé, v = 4Q/(πD²).",
      q: "D’où vient ce facteur d’environ 32 ?",
      opts: [
        { t: "Section ÷ 4 donc vitesse × 4, v² × 16, et le terme L/D doublé : 16 × 2 = 32", ok: true, fb: "À débit imposé, h<sub>f</sub> ∝ λ L Q²/D⁵ (λ varie peu). C’est pour cela qu’on raisonne en débit, jamais en vitesse, quand on dimensionne." },
        { t: "La rugosité double quand le diamètre diminue", fb: "La rugosité absolue ε est celle du matériau ; seule la rugosité relative ε/D change, et elle pèse peu ici." },
        { t: "Les pertes sont proportionnelles au carré du diamètre", fb: "C’est l’inverse : à débit imposé, elles varient environ comme 1/D⁵." },
      ],
    },
    plus: {
      task: "Une vieille conduite en béton rugueux : trouvez un réglage en régime « turbulent rugueux », où λ ne dépend plus du nombre de Reynolds.",
      hint: "choisissez le béton, un petit diamètre et une vitesse élevée.",
      check: (c) => c.out.regime === "turbulent rugueux",
      reveal: (c) => `λ = ${f(c.out.lam, 4)} ne dépend plus que de ε/D : augmenter la vitesse ne change plus λ et les pertes deviennent strictement proportionnelles à v². L’âge et l’entartrage d’une conduite comptent alors autant que son diamètre.`,
    },
    diag: {
      story: "Sur les 500 m de la conduite du Plateau, les pertes linéaires dépassent 100 m de charge et l’eau file à plus de 4 m/s. Le débit de 12 L/s est imposé.",
      preset: { linMode: "Q", Qlin: 12, Dlin: 60, L: 500, eps: "0.0015" },
      culprit: "Dlin",
      symptom: (c) => `Perte de charge linéaire de ${f(c.out.hf, 1)} mCE, vitesse de ${f(c.out.vel, 2)} m/s.`,
      target: (c) => c.out.hf <= 10 && c.out.vel >= 0.5 && c.out.vel <= 1.5 && c.out.modeQ && near(c.v("Qlin"), 12, 0.01) && near(c.v("L"), 500, 0.1),
      targetTxt: "pertes ≤ 10 mCE et vitesse entre 0,5 et 1,5 m/s, même débit et même longueur",
      now: (c) => `h<sub>f</sub> = ${f(c.out.hf, 1)} mCE · v = ${f(c.out.vel, 2)} m/s`,
      hint: "à débit imposé, les pertes varient environ comme 1/D⁵.",
      explain: "À débit imposé, h<sub>f</sub> varie environ comme 1/D⁵ : passer de 60 mm à un peu plus de 100 mm divise les pertes par plus de 10. Le diamètre pèse bien plus que la longueur ou la rugosité.",
    },
  };

  /* ---------- 06 · Pertes de charge singulières ---------- */
  AT.singulier = {
    compute(v) {
      const sumK = v("nc") * 0.4 + v("nt") * 0.4 + v("nv") * 0.3;
      const hs = sumK * v("vsing") ** 2 / (2 * g);
      return { sumK, hs, Le: sumK * (v("Dsing") / 1000) / 0.02 };
    },
    record(c) {
      const m = c.mem;
      const key = c.v("nc") + "|" + c.v("nt") + "|" + c.v("nv");
      if (near(c.v("vsing"), 0.6, 0.05)) m.slow = { hs: c.out.hs, key };
      if (near(c.v("vsing"), 1.2, 0.05) && m.slow && m.slow.key === key) m.fast = { hs: c.out.hs };
    },
    predict: {
      q: "Dans le même tracé, la vitesse de l’eau double. La perte singulière h<sub>s</sub>…",
      opts: [{ t: "double" }, { t: "quadruple", ok: true }, { t: "ne change pas : ce sont les mêmes coudes" }],
    },
    observe: {
      focus: ["vsing"], auto: [["vsing", 0.6], ["vsing", 1.2]],
      task: "Réglez v = 0,6 m/s et regardez la colonne rouge h<sub>s</sub>, puis passez à v = 1,2 m/s sans toucher aux raccords.",
      check(c) {
        const m = c.mem;
        return { items: [{ t: "v ≈ 0,6 m/s", ok: !!m.slow }, { t: "v ≈ 1,2 m/s, mêmes raccords", ok: !!m.fast }], done: !!m.fast };
      },
      reveal(c) {
        const m = c.mem;
        const r = m.slow && m.fast ? m.fast.hs / m.slow.hs : 4;
        return `La colonne rouge a grandi bien plus que la vitesse : h<sub>s</sub> a été multipliée par environ ${f(r, 1)}.`;
      },
    },
    measure: {
      text: "h<sub>s</sub> = ΣK · v²/(2g) : chaque raccord a un coefficient K fixe.",
      q: "Pourquoi h<sub>s</sub> quadruple-t-elle ?",
      opts: [
        { t: "Les K ne changent pas, mais h<sub>s</sub> est proportionnelle à v² : (2v)² = 4v²", ok: true, fb: "Comme les pertes linéaires, les pertes singulières suivent le carré de la vitesse." },
        { t: "Chaque coude freine deux fois plus à vitesse double", fb: "Le coefficient K d’un raccord ne dépend pratiquement pas de la vitesse." },
        { t: "Le diamètre du tracé a changé", fb: "Le diamètre est resté le même : seul v a changé." },
      ],
    },
    plus: {
      task: "Longueur équivalente : trouvez un tracé dont les raccords « valent » plus de 50 m de tuyau droit.",
      check: (c) => c.out.Le >= 50,
      reveal: (c) => `Avec ΣK = ${f(c.out.sumK, 1)} et D = ${c.v("Dsing")} mm, les raccords équivalent à ${f(c.out.Le, 0)} m de tuyau droit. Dans un bourg aux tracés tortueux, les singularités ne sont pas « négligeables ».`,
    },
    diag: {
      story: "La traversée du bourg perd trop de charge rien qu’en raccords : le budget est de 0,45 m. Le nombre de tés et de vannes est imposé par l’exploitant.",
      preset: { nc: 16, nt: 4, nv: 6, vsing: 1.2, Dsing: 75 },
      culprit: "nc",
      symptom: (c) => `Perte singulière de ${f(c.out.hs, 2)} m pour un budget de 0,45 m (ΣK = ${f(c.out.sumK, 1)}).`,
      target: (c) => c.out.hs <= 0.45 && c.v("nt") === 4 && c.v("nv") === 6 && near(c.v("vsing"), 1.2, 0.01),
      targetTxt: "h<sub>s</sub> ≤ 0,45 m, tés, vannes et vitesse inchangés",
      now: (c) => `h<sub>s</sub> = ${f(c.out.hs, 2)} m`,
      explain: "Les 16 coudes pesaient 6,4 sur un ΣK de 9,8. En ramenant le tracé à 6 coudes au plus, h<sub>s</sub> repasse sous 0,45 m : simplifier le tracé est souvent le levier le moins cher.",
    },
  };

  /* ---------- 07 · Pompe et HMT ---------- */
  AT.pompe = {
    compute(v) {
      const HMT = Math.max(0, v("HBneed") + v("hptot") - v("HA"));
      const Phyd = v("Qpompe") / 1000 * 999 * g * HMT;
      return { HMT, Phyd, Pel: Phyd / (v("eta") / 100) };
    },
    record(c) {
      const m = c.mem;
      if (c.out.HMT <= 0.001) m.zero = true;
      if (m.zero && c.out.HMT > 0.001 && near(c.v("HA"), 52, 0.01)) m.pos = true;
    },
    predict: {
      q: "Le réservoir offre 52 m de charge, l’abonné a besoin de 28 m et les pertes valent 8 m. Faut-il une pompe ?",
      opts: [
        { t: "Oui : l’abonné est loin et il y a des pertes" },
        { t: "Non : la charge disponible suffit", ok: true },
        { t: "Impossible à dire sans le débit" },
      ],
    },
    observe: {
      focus: ["hptot", "HBneed"], auto: [["HA", 52], ["hptot", 8], ["hptot", 30]],
      task: "Sans toucher à la charge du réservoir (52 m), augmentez les pertes ou le besoin jusqu’à ce que la pompe devienne nécessaire.",
      check(c) {
        const m = c.mem;
        return { items: [{ t: "Pompe à l’arrêt observée", ok: !!m.zero }, { t: "Pompe devenue nécessaire, même réservoir", ok: !!m.pos }], done: !!m.pos };
      },
      reveal: () => "La pompe ne démarre que lorsque besoin + pertes dépassent la charge disponible : elle comble exactement le déficit, rien de plus.",
    },
    measure: {
      text: "HMT = besoin aval + pertes − charge amont (si positif) ; P<sub>élec</sub> = ρ g Q · HMT / η.",
      q: "Que fournit exactement la pompe ?",
      opts: [
        { t: "La charge qui manque au bilan, en mètres : HMT = besoin + pertes − charge disponible", ok: true, fb: "La gravité fournit déjà la charge du réservoir : la pompe ne paie que le déficit." },
        { t: "Une pression constante, quel que soit le réseau", fb: "La HMT dépend du réseau : du besoin, des pertes et de la charge disponible." },
        { t: "Toute la charge nécessaire à l’abonné", fb: "Non : la gravité en fournit déjà une grande partie." },
      ],
    },
    plus: {
      task: "Juste assez : trouvez le réglage où la pompe devient à peine nécessaire (HMT entre 0 et 1 m).",
      check: (c) => c.out.HMT > 0 && c.out.HMT < 1,
      reveal: () => "Au seuil, la moindre perte supplémentaire (vanne mal ouverte, conduite entartrée) fait basculer le réseau : c’est pour cela qu’on dimensionne une pompe avec une marge.",
    },
    diag: {
      story: "La pompe installée consomme 4,4 kW, alors qu’un collègue trouve 2,2 kW pour le même débit et la même HMT. Débit et HMT sont imposés par le réseau.",
      preset: { HA: 30, HBneed: 60, hptot: 15, Qpompe: 3.5, eta: 35 },
      culprit: "eta",
      symptom: (c) => `Puissance électrique de ${f(c.out.Pel / 1000, 2)} kW pour une HMT de ${f(c.out.HMT, 0)} m.`,
      target: (c) => c.out.Pel <= 2400 && near(c.out.HMT, 45, 0.01) && near(c.v("Qpompe"), 3.5, 0.01),
      targetTxt: "P<sub>élec</sub> ≤ 2,4 kW, même débit et même HMT",
      now: (c) => `P<sub>élec</sub> = ${f(c.out.Pel / 1000, 2)} kW`,
      explain: "P<sub>élec</sub> = ρ g Q · HMT / η : avec η = 35 %, près des deux tiers de l’électricité partent en chaleur. Un groupe qui tourne près de son meilleur rendement (60 à 70 %) divise la facture par deux.",
    },
  };

  /* ---------- 08 · Le réseau du Plateau (synthèse) ---------- */
  AT.reseau = {
    compute: (v, s) => window.LAB_R110_RESEAU.compute(v, s),
    terms: {
      pa: (c) => "P_A = " + f(c.out.PA, 2) + " bar = " + f(c.out.PA * 1e5 / (999 * g), 1) + " m",
      hmt: (c) => "HMT = " + f(c.out.HMT, 1) + " m",
      dz: (c) => "Δz = " + f(c.out.h, 1) + " m",
      hf: (c) => "h_f = " + f(c.out.hf, 2) + " m",
      hs: (c) => "h_s = " + f(c.out.hs, 2) + " m",
    },
    record(c) {
      const m = c.mem, o = c.out;
      if (c.v("HMTr") === 0 && o.PB >= 2.2) { m.passive = Math.min(m.passive || 999, +c.s("Dr")); }
      if (c.v("HMTr") > 0 && +c.s("Dr") === 100 && o.PB >= 2.2) m.active = true;
      (m.verdicts = m.verdicts || {})[o.cheaper] = true;
    },
    predict: {
      q: "Le hameau du Plateau manque de pression. D’instinct, quelle solution coûtera le moins cher sur 20 ans ?",
      opts: [
        { t: "Une conduite plus grosse (solution passive)" },
        { t: "Un surpresseur (solution active)" },
        { t: "Cela dépend des chiffres : il faut comparer", ok: true },
      ],
    },
    observe: {
      focus: ["Dr", "HMTr"], auto: [["HMTr", 0], ["Dr", "100"], ["Dr", "125"]],
      task: "Scénario passif : sans surpresseur (HMT = 0), cherchez le plus petit diamètre qui donne au moins 2,2 bar au Plateau. Regardez aussi la vitesse.",
      check(c) {
        const m = c.mem;
        return { items: [{ t: "Surpresseur à 0", ok: c.v("HMTr") === 0 }, { t: "Pression ≥ 2,2 bar au Plateau sans pompe", ok: !!m.passive }], done: !!m.passive };
      },
      reveal: (c) => `Sans pompe, il faut au moins Ø ${c.mem.passive} mm. Un diamètre trop généreux fait cependant passer la vitesse sous 0,5 m/s : l’eau stagne, se réchauffe et perd en qualité. Le plus gros n’est pas le meilleur.`,
    },
    measure: {
      text: "Bilan de charge (survolez chaque terme) : P<sub>B</sub> = <span class=\"v3-term\" data-term=\"pa\">P<sub>A</sub></span> + ρg (<span class=\"v3-term\" data-term=\"hmt\">HMT</span> − <span class=\"v3-term\" data-term=\"dz\">Δz</span> − <span class=\"v3-term\" data-term=\"hf\">h<sub>f</sub></span> − <span class=\"v3-term\" data-term=\"hs\">h<sub>s</sub></span>). Revenez ensuite à Ø 100 mm et réglez le surpresseur au plus juste : le graphique des coûts cumulés compare les deux solutions sur 20 ans.",
      q: "Que paie-t-on avec un surpresseur, que la solution passive ne coûte pas ?",
      opts: [
        { t: "L’électricité à chaque heure de fonctionnement, plus l’entretien, en plus de l’achat", ok: true, fb: "D’où la comparaison sur 20 ans : la conduite se paie une fois, la pompe tous les jours." },
        { t: "Seulement l’achat de la pompe", fb: "Une pompe consomme de l’électricité et s’entretient pendant toute sa vie." },
        { t: "Rien : la pompe récupère l’énergie des pertes", fb: "Les pertes de charge sont dissipées en chaleur, rien n’est récupéré." },
      ],
    },
    plus: {
      task: "Faites varier le prix de l’électricité : trouvez le prix à partir duquel l’autre solution devient la moins chère sur 20 ans.",
      hint: "le coût de la solution active augmente avec le prix du kWh, pas celui de la solution passive.",
      check: (c) => !!(c.mem.verdicts && c.mem.verdicts.passif && c.mem.verdicts.actif),
      reveal: (c) => `Les deux coûts se croisent vers ${isFinite(c.out.cross) ? window.LAB_R110_RESEAU.f(c.out.cross, 2) + " €/kWh" : "un prix hors de la plage"}. Le coût n’est qu’un critère : fiabilité en cas de panne, entretien et carbone comptent aussi (voir « Le coin du maître d’œuvre »).`,
    },
    diag: {
      story: "Un bureau d’études propose Ø 80 mm « pour faire des économies ». La vitesse paraît correcte, mais l’abonné du Plateau n’a presque plus de pression. La mairie refuse tout surpresseur.",
      preset: { Qr: 7, Lr: 900, Dr: "80", Kr: 12, hr: 18, PAr: 4.25, HMTr: 0, etar: 65, prixr: 0.2 },
      culprit: "Dr",
      symptom: (c) => `Pression au Plateau : ${window.LAB_R110_RESEAU.f(c.out.PB, 2)} bar, vitesse ${window.LAB_R110_RESEAU.f(c.out.vel, 2)} m/s.`,
      target: (c) => c.out.PB >= 2.2 && c.out.vel >= 0.5 && c.out.vel <= 1.5 && c.v("HMTr") === 0,
      targetTxt: "au moins 2,2 bar au Plateau et vitesse entre 0,5 et 1,5 m/s, sans surpresseur",
      now: (c) => `P<sub>B</sub> = ${window.LAB_R110_RESEAU.f(c.out.PB, 2)} bar · v = ${window.LAB_R110_RESEAU.f(c.out.vel, 2)} m/s`,
      hint: "le Ø 150 mm donne de la pression, mais l’eau y stagne.",
      explain: "Avec Ø 80 mm, les pertes linéaires dépassent 20 m. Il fallait remonter au Ø 125 mm : c’est le seul diamètre qui donne la pression sans faire stagner l’eau. Économiser sur le diamètre se paie en pression.",
    },
  };

  /* ---------- badges ---------- */
  const B = (id, icon, name, desc, how, check) => ({ id, icon, name, desc, how, check });
  const BADGES = [
    B("reynolds", "Re", "Reynolds Club", "Vous avez vu un même tuyau passer du laminaire au turbulent.", "Voir le laminaire et le turbulent à l’atelier 01.", (x) => { const r = x.mem.debit && x.mem.debit.regs; return !!(r && r.Laminaire && r.Turbulent); }),
    B("archimede", "d", "Archimède", "Un fluide plus dense, puis moins dense que l’eau.", "Faire flotter puis couler le cube témoin (atelier 02).", (x) => { const m = x.mem.fluide; return !!(m && m.dense && m.light); }),
    B("dix-metres", "10", "10 mCE = 1 bar", "Le repère du dénivelé est acquis.", "Terminer l’observation de l’atelier 03.", (x) => !!x.A("hydro").obsDone),
    B("cavitation", "V", "Cavitation", "Vous avez fait chuter la pression d’un Venturi sous zéro.", "Le piège de l’atelier 04.", (x) => !!x.A("bernoulli").plusDone),
    B("facteur32", "32", "Facteur 32", "Diamètre divisé par 2 à débit imposé : pertes × 32.", "L’observation de l’atelier 05.", (x) => { const m = x.mem.lineaire; return !!(m && m.ratio && m.ratio >= 20); }),
    B("peage", "K", "Péage", "Des raccords qui valent plus de 50 m de tuyau.", "Le piège de l’atelier 06.", (x) => !!x.A("singulier").plusDone),
    B("juste-assez", "H", "Juste assez", "La pompe réglée au seuil de nécessité.", "Le piège de l’atelier 07.", (x) => !!x.A("pompe").plusDone),
    B("pressentiment", "P", "Bon pressentiment", "Cinq prédictions justes.", "Cinq prédictions justes à l’étape 1.", (x) => Object.values(x.store.at).filter((a) => a.predOk).length >= 5),
    B("lucidite", "?", "Lucidité", "Sûr·e de vous et pourtant détrompé·e, puis l’explication trouvée.", "Se tromper avec assurance, puis valider l’explication.", (x) => Object.values(x.store.at).some((a) => a.pred != null && !a.predOk && a.conf === "Sûr·e" && a.explOk)),
    B("diagnostiqueur", "D", "Diagnostiqueur", "Trois réseaux réparés en mode diagnostic.", "Réussir trois diagnostics.", (x) => (x.store.nDiag || 0) >= 3),
    B("ingenieur", "★", "Ingénieur Valdeau", "Les deux scénarios du Plateau trouvés et comparés.", "Trouver le scénario passif et le scénario actif à l’atelier 08.", (x) => { const m = x.mem.reseau; return !!(m && m.passive && m.active); }),
    B("complet", "8", "Parcours complet", "Les huit ateliers parcourus jusqu’au diagnostic.", "Terminer les huit parcours.", (x) => ["debit", "fluide", "hydro", "bernoulli", "lineaire", "singulier", "pompe", "reseau"].every((k) => x.A(k).diagDone)),
  ];

  window.LABV3_PARCOURS = {
    storeKey: "r110_parcours", ateliers: AT, badges: BADGES, bilanHost: "defi",
    // graphes 2D gardés sous la 3D : seule la partie absente de la scène est visible
    keep2d: {
      lineaire: { top: 304, title: "Diagramme de Moody", cap: "λ en fonction de Re (échelles logarithmiques). Le point suit vos réglages : sur la droite 64/Re en laminaire, puis sur la courbe de votre matériau en turbulent. La ligne de charge elle-même se lit sur les piézomètres de la vue 3D." },
      reseau: { top: 350, title: "Coûts cumulés sur 20 ans", cap: "Solution passive (conduite plus grosse, coût d’achat seul) contre solution active (surpresseur : achat, électricité, entretien, renouvellement après 15 ans). La ligne de charge se lit dans la vue 3D ; survolez les termes de la formule à l’étape 3." },
    },
  };
})();
