/* =====================================================================
   R3-10 · parcours pédagogiques (mission Aulnes)
   Chaque atelier : predict (POÉ), observe (tâche détectée), measure (explication),
   plus (le piège), diag (cas pathologique). Données génériques : aucune valeur du dossier noté.
   Les champs demo (plus) et fix (diag) servent aux tests automatiques.
   ===================================================================== */
(() => {
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const near = (x, a, tol) => Math.abs(x - a) <= tol;
  const DPE = [[70, "A"], [110, "B"], [180, "C"], [250, "D"], [330, "E"], [420, "F"], [Infinity, "G"]];
  const lettre = (ind) => DPE.find((r) => ind <= r[0])[1];
  const AT = {};

  /* ---------- 01 · Transmission ---------- */
  AT.trans = {
    compute(v) {
      const R = 0.13 + v("eiso1") / 100 / v("liso1") + v("esup") / 100 / v("lsup") + 0.04;
      const U = 1 / R;
      return { R, U, Phi: v("bLNC") * U * v("A1") * v("dT1") };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("bLNC"), 1, 1e-9)) m.a = { U: c.out.U, Phi: c.out.Phi, k: [c.v("eiso1"), c.v("A1"), c.v("dT1")].join() };
      if (near(c.v("bLNC"), 0.5, 1e-9) && m.a && m.a.k === [c.v("eiso1"), c.v("A1"), c.v("dT1")].join()) m.b = { U: c.out.U, Phi: c.out.Phi };
    },
    predict: {
      q: "Le même mur donne sur un garage non chauffé au lieu de l’extérieur (facteur b = 0,5). Que devient le bilan ?",
      opts: [
        { t: "U est divisé par 2" },
        { t: "Le flux est divisé par 2, U ne change pas", ok: true },
        { t: "Rien ne change : c’est le même mur" },
      ],
    },
    observe: {
      focus: ["bLNC"], auto: [["bLNC", 1], ["bLNC", 0.5]],
      task: "Sans toucher à la paroi, réglez b = 1 (mur sur l’extérieur), puis b = 0,5 (mur sur un garage). Suivez U et le flux Φ.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "b = 1", ok: !!m.a },
          { t: "Puis b = 0,5, même paroi", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `U reste à ${f(c.mem.b ? c.mem.b.U : 0, 3)} W/(m²·K) ; Φ passe de ${f(c.mem.a ? c.mem.a.Phi : 0, 0)} à ${f(c.mem.b ? c.mem.b.Phi : 0, 0)} W. Le garage, plus chaud que dehors, réduit l’écart de température vu par le mur.`,
    },
    measure: {
      text: "R = R<sub>si</sub> + Σ e/λ + R<sub>se</sub> ; U = 1/R ; Φ = b·U·A·ΔT.",
      q: "Pourquoi U ne change-t-il pas avec b ?",
      opts: [
        { t: "U ne dépend que de la paroi ; b corrige l’écart de température entre l’intérieur et le local voisin", ok: true, fb: "b = 0,5 signifie que le garage se trouve à mi-chemin entre l’intérieur et l’extérieur : l’écart effectif est divisé par 2." },
        { t: "b s’applique à la surface", fb: "La surface reste la même ; b agit sur l’écart de température." },
        { t: "U dépend de la température extérieure", fb: "U est une propriété de la paroi, indépendante des températures." },
      ],
    },
    plus: {
      task: "Sur 80 m², avec ΔT = 20 K et b = 1, trouvez une paroi qui laisse passer moins de 200 W.",
      hint: "il faut U ≤ 0,125 W/(m²·K), soit R ≥ 8 m²·K/W.",
      demo: [["A1", 80], ["dT1", 20], ["bLNC", 1], ["eiso1", 30], ["liso1", 0.035]],
      check: (c) => c.v("A1") === 80 && c.v("dT1") === 20 && near(c.v("bLNC"), 1, 1e-9) && c.out.Phi < 200,
      reveal: (c) => `Φ = ${f(c.out.Phi, 0)} W avec R = ${f(c.out.R, 2)} m²·K/W. U = 1/R : chaque watt gagné demande de plus en plus d’épaisseur.`,
    },
    diag: {
      story: "Un mur rénové affiche U ≈ 1,3 W/(m²·K) alors que le bureau d’études visait 0,3. Le matériau commandé est le bon.",
      preset: { eiso1: 2, liso1: 0.04, esup: 20, lsup: 1.75, A1: 80, dT1: 20, bLNC: 1 },
      culprit: "eiso1",
      fix: ["eiso1", 12],
      symptom: (c) => `U = ${f(c.out.U, 3)} W/(m²·K) ; Φ = ${f(c.out.Phi, 0)} W.`,
      target: (c) => c.out.U <= 0.32 && near(c.v("liso1"), 0.04, 1e-9) && c.v("esup") === 20 && near(c.v("lsup"), 1.75, 1e-9),
      targetTxt: "U ≤ 0,32 W/(m²·K), même isolant et même support",
      now: (c) => `U = ${f(c.out.U, 3)} W/(m²·K)`,
      hint: "le matériau est le bon : en a-t-on mis assez ?",
      explain: "L’isolant posé ne faisait que 2 cm (R = 0,5 m²·K/W). Avec les 12 cm prévus, R<sub>iso</sub> = 3 m²·K/W et U retombe à 0,30.",
    },
  };

  /* ---------- 02 · Ventilation et ponts ---------- */
  AT.vent = {
    compute(v) {
      const Htr = v("Htr"), Hv = 0.34 * v("Qv"), Hpt = v("Psi") * v("Lpt"), H = Htr + Hv + Hpt;
      return { Htr, Hv, Hpt, H, pV: Hv / H * 100 };
    },
    record(c) {
      const m = c.mem;
      if (c.v("Htr") === 120 && near(c.v("Psi"), 0.4, 1e-9) && c.v("Lpt") === 40) {
        if (c.v("Qv") === 150) m.a = { H: c.out.H, pV: c.out.pV };
        if (c.v("Qv") === 300 && m.a) m.b = { H: c.out.H, pV: c.out.pV };
      }
    },
    predict: {
      q: "On double le débit de ventilation (150 → 300 m³/h), avec H_tr = 120 W/K et 16 W/K de ponts. Les déperditions totales augmentent d’environ…",
      opts: [
        { t: "100 %" },
        { t: "25 %", ok: true },
        { t: "presque rien : l’air ne pèse rien" },
      ],
    },
    observe: {
      focus: ["Qv"], auto: [["Qv", 150], ["Qv", 300]],
      task: "Avec H_tr = 120 W/K et les ponts de départ, passez le débit de 150 à 300 m³/h. Suivez H et la part de la ventilation.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "150 m³/h", ok: !!m.a },
          { t: "Puis 300 m³/h", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => { const a = c.mem.a || { H: 0, pV: 0 }, b = c.mem.b || { H: 0, pV: 0 }; return `H passe de ${f(a.H, 0)} à ${f(b.H, 0)} W/K (+${f((b.H / (a.H || 1) - 1) * 100, 0)} %) ; la ventilation passe de ${f(a.pV, 0)} à ${f(b.pV, 0)} % des pertes.`; },
    },
    measure: {
      text: "H<sub>v</sub> = 0,34·q<sub>v</sub> (W/K, q<sub>v</sub> en m³/h) ; H = H<sub>tr</sub> + H<sub>v</sub> + Σψ·L.",
      q: "D’où vient le coefficient 0,34 ?",
      opts: [
        { t: "De la capacité thermique volumique de l’air, ρc_p ≈ 1 200 J/(m³·K), ramenée à l’heure (÷ 3 600)", ok: true, fb: "Chauffer 1 m³ d’air de 1 K demande environ 1 200 J, soit 0,34 Wh : à 150 m³/h, cela fait 51 W par kelvin d’écart." },
        { t: "C’est un coefficient de sécurité réglementaire", fb: "C’est une grandeur physique de l’air, pas une marge." },
        { t: "C’est la part de l’air renouvelé chaque heure", fb: "Le débit q<sub>v</sub> joue ce rôle ; 0,34 est une capacité thermique." },
      ],
    },
    plus: {
      task: "Dans un bâtiment très isolé (H_tr ≤ 60 W/K), trouvez un réglage où la ventilation devient le premier poste de pertes.",
      hint: "une enveloppe performante et un débit d’air ordinaire.",
      demo: [["Htr", 60], ["Qv", 200]],
      check: (c) => c.out.Htr <= 60 && c.out.Hv > c.out.Htr && c.out.Hv > c.out.Hpt,
      reveal: (c) => `H<sub>v</sub> = ${f(c.out.Hv, 0)} W/K dépasse H<sub>tr</sub> = ${f(c.out.Htr, 0)} W/K. Dans un bâtiment performant, l’air renouvelé devient le premier poste : d’où la double flux de l’atelier 06.`,
    },
    diag: {
      story: "Un logement à enveloppe performante (H_tr = 60 W/K) perd plus de 200 W/K : l’occupant entend la ventilation souffler en permanence.",
      preset: { Htr: 60, Qv: 400, Psi: 0.4, Lpt: 40, dT2: 20 },
      culprit: "Qv",
      fix: ["Qv", 120],
      symptom: (c) => `H = ${f(c.out.H, 0)} W/K, dont ${f(c.out.pV, 0)} % de ventilation.`,
      target: (c) => c.out.H <= 130 && c.v("Htr") === 60 && near(c.v("Psi"), 0.4, 1e-9) && c.v("Lpt") === 40,
      targetTxt: "H ≤ 130 W/K, enveloppe et ponts inchangés",
      now: (c) => `H = ${f(c.out.H, 0)} W/K`,
      hint: "« souffler en permanence »…",
      explain: "La ventilation restait bloquée en grande vitesse (400 m³/h, soit 136 W/K). Ramenée au débit d’hygiène (120 m³/h), elle ne pèse plus que 41 W/K.",
    },
  };

  /* ---------- 03 · DJU et besoin annuel ---------- */
  AT.dju = {
    compute: (v) => ({ B: v("Hbat3") * v("DJU") * 24 / 1000 }),
    record(c) {
      const m = c.mem;
      if (c.v("Hbat3") === 180) {
        if (c.v("DJU") === 2200) m.a = c.out.B;
        if (c.v("DJU") === 3200 && m.a) m.b = c.out.B;
      }
    },
    predict: {
      q: "La même maison est construite dans une région plus froide : 3 200 DJU au lieu de 2 200. Son besoin de chauffage…",
      opts: [
        { t: "augmente de 45 %, comme les DJU", ok: true },
        { t: "augmente de 1 000 kWh exactement" },
        { t: "ne change pas : c’est la même maison" },
      ],
    },
    observe: {
      focus: ["DJU"], auto: [["DJU", 2200], ["DJU", 3200]],
      task: "Avec H = 180 W/K, comparez une saison à 2 200 DJU puis à 3 200 DJU.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "2 200 DJU", ok: !!m.a },
          { t: "Puis 3 200 DJU", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Le besoin passe de ${f(c.mem.a || 0, 0)} à ${f(c.mem.b || 0, 0)} kWh : +45 %, exactement comme les DJU.`,
    },
    measure: {
      text: "B ≈ H·DJU·24 (Wh, H en W/K) : 1 DJU = 1 K d’écart sous la consigne pendant un jour.",
      q: "Pourquoi le besoin est-il proportionnel aux DJU ?",
      opts: [
        { t: "H fixe la puissance perdue par kelvin d’écart ; les DJU additionnent ces kelvins sur toute la saison", ok: true, fb: "B = H × (somme des écarts journaliers) × 24 h : l’enveloppe et le climat se multiplient." },
        { t: "Les DJU augmentent H", fb: "H dépend du bâtiment seul ; les DJU décrivent le climat." },
        { t: "C’est une coïncidence des valeurs choisies", fb: "C’est la structure même de la formule : B est un produit." },
      ],
    },
    plus: {
      task: "Dans une région à 3 000 DJU au moins, trouvez l’enveloppe qui ramène le besoin sous 8 000 kWh.",
      hint: "H ≤ 8 000/(DJU × 0,024).",
      demo: [["DJU", 3000], ["Hbat3", 110]],
      check: (c) => c.v("DJU") >= 3000 && c.out.B < 8000,
      reveal: (c) => `H = ${c.v("Hbat3")} W/K suffit : ${f(c.out.B, 0)} kWh. Un climat froid se compense par l’enveloppe, pas par la chaudière.`,
    },
    diag: {
      story: "Le besoin calculé pour un pavillon atteint 18 500 kWh, le double de sa consommation relevée. Le climat retenu (2 200 DJU) est correct.",
      preset: { Hbat3: 350, Tcons: 19, Text3: 5, DJU: 2200 },
      culprit: "Hbat3",
      fix: ["Hbat3", 180],
      symptom: (c) => `Besoin calculé : ${f(c.out.B, 0)} kWh.`,
      target: (c) => c.out.B <= 10000 && c.v("DJU") === 2200,
      targetTxt: "besoin ≤ 10 000 kWh, même climat",
      now: (c) => `B = ${f(c.out.B, 0)} kWh`,
      hint: "le climat est juste : reste l’enveloppe.",
      explain: "Le coefficient H avait été surestimé (350 W/K, surfaces comptées deux fois). Avec H = 180 W/K, le besoin retombe vers 9 500 kWh, cohérent avec la consommation.",
    },
  };

  /* ---------- 04 · DPE ---------- */
  AT.dpe = {
    compute(v) {
      const ind = v("fp") * v("Cef") / v("Shab");
      return { ind, L: lettre(ind) };
    },
    record(c) {
      const m = c.mem;
      if (c.v("Cef") === 12000 && c.v("Shab") === 100) {
        if (near(c.v("fp"), 2.3, 1e-9)) m.a = c.out.L;
        if (near(c.v("fp"), 1.9, 1e-9) && m.a) m.b = c.out.L;
      }
    },
    predict: {
      q: "Un logement chauffé à l’électricité consomme 12 000 kWh/an. La convention fait passer le facteur primaire de 2,3 à 1,9. La facture…",
      opts: [
        { t: "baisse de 17 %" },
        { t: "ne change pas, mais l’étiquette s’améliore", ok: true },
        { t: "ne change pas, et l’étiquette non plus" },
      ],
    },
    observe: {
      focus: ["fp"], auto: [["fp", 2.3], ["fp", 1.9]],
      task: "À 12 000 kWh/an et 100 m², passez le facteur primaire de 2,3 à 1,9. Regardez la classe.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "f_p = 2,3", ok: !!m.a },
          { t: "Puis f_p = 1,9", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Classe ${c.mem.a || "?"}, puis classe ${c.mem.b || "?"} : sans un seul kWh économisé au compteur. L’étiquette mesure une énergie primaire conventionnelle.`,
    },
    measure: {
      text: "C<sub>ep</sub> = f<sub>p</sub>·C<sub>ef</sub> ; indicateur = C<sub>ep</sub>/S<sub>hab</sub>, en kWh<sub>ep</sub>/(m²·an).",
      q: "Que mesure l’étiquette énergie du DPE ?",
      opts: [
        { t: "L’énergie primaire par m², c’est-à-dire la consommation finale multipliée par un facteur conventionnel", ok: true, fb: "Le compteur donne C<sub>ef</sub> ; l’étiquette affiche f<sub>p</sub>·C<sub>ef</sub>/S. Changer la convention change la lettre, pas la facture." },
        { t: "La consommation lue au compteur", fb: "Ce serait l’énergie finale ; l’étiquette applique le facteur primaire." },
        { t: "Le besoin de chauffage calculé", fb: "Le besoin est une énergie utile, avant rendement et conversion." },
      ],
    },
    plus: {
      task: "Pour 100 m² et f_p = 2,3, trouvez une consommation finale qui place le logement en classe C.",
      hint: "indicateur ≤ 180 kWh_ep/(m²·an).",
      demo: [["fp", 2.3], ["Cef", 7500]],
      check: (c) => c.v("Shab") === 100 && near(c.v("fp"), 2.3, 1e-9) && c.out.L === "C",
      reveal: (c) => `${f(c.v("Cef"), 0)} kWh/an donnent ${f(c.out.ind, 0)} kWh<sub>ep</sub>/(m²·an) : classe C. Il faut diviser la consommation par 1,6 environ pour gagner deux classes.`,
    },
    diag: {
      story: "Un logement de 100 m² chauffé à l’électricité ressort en classe G, alors que sa consommation (12 000 kWh/an) est banale.",
      preset: { Cef: 12000, Shab: 50, fp: 2.3 },
      culprit: "Shab",
      fix: ["Shab", 100],
      symptom: (c) => `Indicateur ${f(c.out.ind, 0)} kWh<sub>ep</sub>/(m²·an) : classe ${c.out.L}.`,
      target: (c) => c.out.ind <= 330 && c.v("Cef") === 12000 && near(c.v("fp"), 2.3, 1e-9),
      targetTxt: "classe E ou mieux, à consommation et facteur inchangés",
      now: (c) => `classe ${c.out.L}`,
      hint: "l’indicateur est ramené au m² : lequel ?",
      explain: "La surface saisie (50 m²) était la moitié de la vraie : l’indicateur doublait. Avec 100 m², il retombe à 276 kWh<sub>ep</sub>/(m²·an), en classe E.",
    },
  };

  /* ---------- 05 · Rénovation d’enveloppe ---------- */
  AT.reno = {
    compute(v, s) {
      const U0 = v("U0"), U1 = 1 / (1 / U0 + v("eiso5") / 100 / v("liso5"));
      return { strat: s("strat"), U1, gain: (U0 - U1) / U0 * 100 };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("liso5"), 0.038, 1e-9) && near(c.v("U0"), 1.8, 1e-9)) {
        if (c.v("eiso5") === 2) m.e2 = c.out.gain;
        if (c.v("eiso5") === 14 && m.e2 != null) m.e14 = c.out.gain;
      }
    },
    predict: {
      q: "Sur un mur ancien (U = 1,8 W/(m²·K)), on colle seulement 2 cm d’isolant (λ = 0,038). U baisse d’environ…",
      opts: [
        { t: "10 %" },
        { t: "50 %", ok: true },
        { t: "90 %" },
      ],
    },
    observe: {
      focus: ["strat", "eiso5"], auto: [["strat", "thin"], ["eiso5", 2], ["strat", "ite"], ["eiso5", 14]],
      task: "Sur le mur de départ (U = 1,8), posez 2 cm d’isolant (stratégie « mince »), puis 14 cm en ITE. Comparez les gains.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "2 cm d’isolant", ok: m.e2 != null },
          { t: "Puis 14 cm", ok: m.e14 != null },
        ];
        return { items, done: m.e14 != null };
      },
      reveal: (c) => `2 cm font déjà −${f(c.mem.e2 || 0, 0)} % ; 14 cm, −${f(c.mem.e14 || 0, 0)} %. Sept fois plus d’isolant pour moins de deux fois plus de gain : les premiers centimètres rapportent le plus.`,
    },
    measure: {
      text: "U<sub>1</sub> = 1/(1/U<sub>0</sub> + e/λ) : on ajoute une résistance à celle du mur existant.",
      q: "Pourquoi les premiers centimètres sont-ils les plus efficaces ?",
      opts: [
        { t: "Les résistances s’ajoutent et U varie en 1/R : chaque centimètre de plus gagne de moins en moins", ok: true, fb: "Avec 2 cm, R passe de 0,56 à 1,08 m²·K/W : U est presque divisé par 2. Les centimètres suivants agissent sur un R déjà grand." },
        { t: "L’isolant mince est d’une meilleure qualité", fb: "λ est le même dans les deux cas." },
        { t: "Le mur ancien absorbe les premiers centimètres", fb: "Le mur garde sa résistance ; l’isolant s’y ajoute simplement." },
      ],
    },
    plus: {
      task: "Avec cet isolant (λ = 0,038) sur ce mur, trouvez la plus petite épaisseur qui atteint U ≤ 0,25 W/(m²·K).",
      hint: "il faut R<sub>total</sub> ≥ 4 m²·K/W.",
      demo: [["strat", "ite"], ["eiso5", 14]],
      check: (c) => c.out.U1 <= 0.25 && c.v("eiso5") <= 14 && near(c.v("liso5"), 0.038, 1e-9) && near(c.v("U0"), 1.8, 1e-9),
      reveal: (c) => `${c.v("eiso5")} cm donnent U = ${f(c.out.U1, 3)} W/(m²·K). À 13 cm, on resterait juste au-dessus de 0,25 : le seuil se joue au centimètre.`,
    },
    diag: {
      story: "Après une rénovation présentée comme « performante », le mur garde un U de 0,9 W/(m²·K).",
      preset: { strat: "ite", eiso5: 2, liso5: 0.038, U0: 1.8 },
      culprit: "eiso5",
      fix: ["eiso5", 14],
      symptom: (c) => `U = ${f(c.out.U1, 3)} W/(m²·K), soit −${f(c.out.gain, 0)} % seulement.`,
      target: (c) => c.out.U1 <= 0.3 && near(c.v("liso5"), 0.038, 1e-9) && near(c.v("U0"), 1.8, 1e-9),
      targetTxt: "U ≤ 0,30 W/(m²·K), même isolant, même mur",
      now: (c) => `U = ${f(c.out.U1, 3)} W/(m²·K)`,
      hint: "le gain de 50 % était réel, mais insuffisant.",
      explain: "Seuls 2 cm avaient été posés : gain réel mais très insuffisant. Il faut au moins 11 cm de cet isolant pour passer sous 0,30 W/(m²·K).",
    },
  };

  /* ---------- 06 · Double flux et PAC ---------- */
  AT.sys = {
    compute(v) {
      const bes = v("bes"), pV = v("partV") / 100;
      const net = bes * (1 - pV) + bes * pV * (1 - v("eta"));
      return { net, Ce: net / v("COP"), red: (1 - net / bes) * 100 };
    },
    record(c) {
      const m = c.mem;
      if (c.v("bes") === 15000 && c.v("partV") === 25) {
        if (near(c.v("eta"), 0, 1e-9)) m.a = c.out.net;
        if (near(c.v("eta"), 0.7, 1e-9) && m.a) m.b = c.out.net;
      }
    },
    predict: {
      q: "On remplace une ventilation simple flux par une double flux qui récupère 70 % de la chaleur de l’air extrait. La ventilation fait 25 % des pertes. Le besoin de chauffage baisse d’environ…",
      opts: [
        { t: "70 %" },
        { t: "18 %", ok: true },
        { t: "25 %" },
      ],
    },
    observe: {
      focus: ["eta"], auto: [["eta", 0], ["eta", 0.7]],
      task: "Avec un besoin de 15 000 kWh et 25 % de ventilation, comparez un rendement de récupération de 0 (simple flux) puis de 0,70.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Sans récupération", ok: !!m.a },
          { t: "Puis récupération à 70 %", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Le besoin net passe de ${f(c.mem.a || 0, 0)} à ${f(c.mem.b || 0, 0)} kWh : −${f((1 - (c.mem.b || 0) / (c.mem.a || 1)) * 100, 1)} %.`,
    },
    measure: {
      text: "Besoin net = B·(1 − part<sub>v</sub>) + B·part<sub>v</sub>·(1 − η) ; consommation électrique = besoin net / COP.",
      q: "Pourquoi 70 % de récupération ne réduisent-ils le besoin que de 18 % ?",
      opts: [
        { t: "La récupération ne porte que sur la part ventilation : 0,70 × 25 % ≈ 18 %", ok: true, fb: "Les 75 % de pertes par les parois ne sont pas touchés. La double flux est un levier sur un seul poste." },
        { t: "Le rendement réel est plus faible qu’annoncé", fb: "Le modèle prend bien 70 % ; la limite vient de la part ventilation." },
        { t: "La PAC consomme une partie du gain", fb: "La PAC intervient après : elle divise le besoin net par son COP." },
      ],
    },
    plus: {
      task: "Pour un besoin de 15 000 kWh, ramenez la consommation électrique sous 2 000 kWh.",
      hint: "combinez récupération et COP ; la part ventilation dépend de l’étanchéité du bâtiment.",
      demo: [["bes", 15000], ["eta", 0.9], ["COP", 5], ["partV", 40]],
      check: (c) => c.v("bes") === 15000 && c.out.Ce < 2000,
      reveal: (c) => `${f(c.out.Ce, 0)} kWh électriques pour 15 000 kWh de besoin : les deux leviers se multiplient (récupération sur l’air, puis COP sur le reste).`,
    },
    diag: {
      story: "Une pompe à chaleur neuve consomme presque autant qu’un chauffage électrique direct.",
      preset: { bes: 15000, partV: 25, eta: 0.7, COP: 1.1 },
      culprit: "COP",
      fix: ["COP", 3.5],
      symptom: (c) => `Consommation électrique : ${f(c.out.Ce, 0)} kWh pour un besoin net de ${f(c.out.net, 0)} kWh.`,
      target: (c) => c.out.Ce <= 4000 && c.v("bes") === 15000 && c.v("partV") === 25 && near(c.v("eta"), 0.7, 1e-9),
      targetTxt: "consommation ≤ 4 000 kWh, mêmes besoins et même ventilation",
      now: (c) => `C<sub>élec</sub> = ${f(c.out.Ce, 0)} kWh`,
      hint: "qu’est-ce qui distingue une PAC d’un radiateur ?",
      explain: "Le COP effectif était de 1,1 : PAC mal dimensionnée, qui tourne surtout sur sa résistance d’appoint. Avec un COP de 3,5, la consommation tombe vers 3 500 kWh.",
    },
  };

  /* ---------- 07 · Temps de retour et CO₂ ---------- */
  AT.tri = {
    compute(v) {
      const bes = v("bes7"), gain = bes * v("prix") * (1 - 1 / v("COP7"));
      return { gain, TRI: gain > 0 ? v("cout") / gain : Infinity, dCO2: v("fCO2") * bes * (1 - 1 / v("COP7")) };
    },
    record(c) {
      const m = c.mem;
      if (c.v("bes7") === 14000 && near(c.v("COP7"), 3.2, 1e-9) && c.v("cout") === 8000) {
        if (near(c.v("prix"), 0.2, 1e-9)) m.a = c.out.TRI;
        if (near(c.v("prix"), 0.4, 1e-9) && m.a) m.b = c.out.TRI;
      }
    },
    predict: {
      q: "Le prix de l’électricité double (0,20 → 0,40 €/kWh). Le temps de retour de la pompe à chaleur…",
      opts: [
        { t: "double" },
        { t: "est divisé par 2", ok: true },
        { t: "ne change pas : le COP est le même" },
      ],
    },
    observe: {
      focus: ["prix"], auto: [["prix", 0.2], ["prix", 0.4]],
      task: "Avec les réglages de départ (14 000 kWh, COP 3,2, 8 000 €), comparez un prix de 0,20 puis de 0,40 €/kWh.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "0,20 €/kWh", ok: !!m.a },
          { t: "Puis 0,40 €/kWh", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `TRI : ${f(c.mem.a || 0, 1)} ans, puis ${f(c.mem.b || 0, 1)} ans. Plus l’énergie est chère, plus vite l’économie rembourse l’investissement.`,
    },
    measure: {
      text: "Gain annuel = C<sub>ef</sub>·prix·(1 − 1/COP) ; TRI = coût net / gain annuel.",
      q: "Pourquoi un prix plus élevé raccourcit-il le temps de retour ?",
      opts: [
        { t: "Le gain annuel est proportionnel au prix, et le TRI en est l’inverse", ok: true, fb: "Les kWh économisés sont les mêmes ; chacun vaut deux fois plus. Le TRI est divisé par 2." },
        { t: "Le COP augmente avec le prix", fb: "Le COP est une caractéristique de la machine." },
        { t: "L’investissement diminue", fb: "Le coût net est fixé ; seul le gain annuel change." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où le temps de retour dépasse 15 ans.",
      hint: "petit besoin, électricité bon marché, COP faible.",
      demo: [["bes7", 6000], ["prix", 0.1], ["COP7", 1.5]],
      check: (c) => c.out.TRI > 15,
      reveal: (c) => `TRI ≈ ${isFinite(c.out.TRI) ? f(c.out.TRI, 0) : "∞"} ans : au-delà de la durée de vie d’une PAC (15 à 20 ans). Le TRI ne dit rien du CO₂ évité, ${f(c.out.dCO2, 0)} kg/an ici.`,
    },
    diag: {
      story: "Une étude annonce près de 30 ans de temps de retour pour une PAC dans une maison de 14 000 kWh de besoin, à 0,22 €/kWh.",
      preset: { bes7: 14000, prix: 0.22, COP7: 1.1, cout: 8000, fCO2: 0.08 },
      culprit: "COP7",
      fix: ["COP7", 3.2],
      symptom: (c) => `Gain annuel ${f(c.out.gain, 0)} € ; TRI ≈ ${f(c.out.TRI, 1)} ans.`,
      target: (c) => c.out.TRI <= 6 && c.v("bes7") === 14000 && near(c.v("prix"), 0.22, 1e-9) && c.v("cout") === 8000,
      targetTxt: "TRI ≤ 6 ans, mêmes besoin, prix et coût",
      now: (c) => `TRI ≈ ${f(c.out.TRI, 1)} ans`,
      hint: "un COP de 1,1, c’est le rendement de quel appareil ?",
      explain: "Le COP saisi (1,1) était celui d’un chauffage à effet Joule. Avec le COP réel de la PAC (3,2), le gain annuel atteint 2 100 € et le TRI moins de 4 ans.",
    },
  };

  const B = (id, icon, name, desc, how, check) => ({ id, icon, name, desc, how, check });
  const IDS = ["trans", "vent", "dju", "dpe", "reno", "sys", "tri"];
  const BADGES = [
    B("local-nc", "b", "Local non chauffé", "U de la paroi, b de l’écart de température.", "Terminer l’observation de l’atelier 01.", (x) => !!x.A("trans").obsDone),
    B("air", "0,34", "L’air compte", "La ventilation devenue premier poste.", "Le piège de l’atelier 02.", (x) => !!x.A("vent").plusDone),
    B("climat", "DJU", "Climat", "Le besoin suit les DJU.", "Terminer l’observation de l’atelier 03.", (x) => !!x.A("dju").obsDone),
    B("primaire", "ep", "Énergie primaire", "Une lettre gagnée sans un kWh économisé.", "Terminer l’observation de l’atelier 04.", (x) => !!x.A("dpe").obsDone),
    B("premiers-cm", "cm", "Premiers centimètres", "Les premiers centimètres rapportent le plus.", "Terminer l’observation de l’atelier 05.", (x) => !!x.A("reno").obsDone),
    B("leviers", "COP", "Deux leviers", "Moins de 2 000 kWh électriques pour 15 000 kWh de besoin.", "Le piège de l’atelier 06.", (x) => !!x.A("sys").plusDone),
    B("retour", "TRI", "Retour long", "Un investissement qui ne se rembourse pas.", "Le piège de l’atelier 07.", (x) => !!x.A("tri").plusDone),
    B("pressentiment", "P", "Bon pressentiment", "Cinq prédictions justes.", "Cinq prédictions justes à l’étape 1.", (x) => Object.values(x.store.at).filter((a) => a.predOk).length >= 5),
    B("lucidite", "?", "Lucidité", "Sûr·e de vous et pourtant détrompé·e, puis l’explication trouvée.", "Se tromper avec assurance, puis valider l’explication.", (x) => Object.values(x.store.at).some((a) => a.pred != null && !a.predOk && a.conf === "Sûr·e" && a.explOk)),
    B("diagnostiqueur", "D", "Diagnostiqueur", "Trois bilans corrigés en mode diagnostic.", "Réussir trois diagnostics.", (x) => (x.store.nDiag || 0) >= 3),
    B("complet", "7", "Parcours complet", "Les sept ateliers parcourus jusqu’au diagnostic.", "Terminer les sept parcours.", (x) => IDS.every((k) => x.A(k).diagDone)),
  ];

  window.LABV3_PARCOURS = {
    storeKey: "r310_parcours", ateliers: AT, badges: BADGES, bilanHost: "defi",
    // graphe 2D qui porte une information absente de la 3D
    keep2d: { dju: true },
  };
})();
