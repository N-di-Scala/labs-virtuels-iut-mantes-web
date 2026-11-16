/* =====================================================================
   R4-8 · parcours pédagogiques (mission Lironde)
   Chaque atelier : predict (POÉ), observe (tâche détectée), measure (explication),
   plus (le piège), diag (cas pathologique). Données génériques : aucune valeur du dossier noté.
   Les champs demo (plus) et fix (diag) servent aux tests automatiques.
   ===================================================================== */
(() => {
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const near = (x, a, tol) => Math.abs(x - a) <= tol;
  const AT = {};

  /* ---------- 01 · Bilan d’été ---------- */
  AT.ete = {
    compute(v) {
      const PhiT = v("Uete") * v("Sete") * (v("Text") - v("Tint"));
      const PhiS = v("Svit") * v("Esol") * v("gsol") * v("Fs");
      const PhiI = v("nOcc") * 70 + v("Peq") * 1000;
      return { PhiT, PhiS, PhiI, tot: PhiT + PhiS + PhiI };
    },
    record(c) {
      const m = c.mem;
      const base = c.v("Sete") === 55 && c.v("Text") === 33 && c.v("Tint") === 26 && c.v("Svit") === 9 && near(c.v("gsol"), 0.45, 1e-9);
      if (!base) return;
      if (near(c.v("Uete"), 0.35, 1e-9) && near(c.v("Fs"), 0.65, 1e-9)) m.a = { T: c.out.PhiT, S: c.out.PhiS, tot: c.out.tot };
      if (near(c.v("Uete"), 0.15, 1e-9) && near(c.v("Fs"), 0.65, 1e-9) && m.a) m.b = { T: c.out.PhiT, tot: c.out.tot };
      if (near(c.v("Uete"), 0.15, 1e-9) && c.v("Fs") <= 0.2 && m.b) m.c = { S: c.out.PhiS, tot: c.out.tot };
    },
    predict: {
      q: "Un bureau en été : 33 °C dehors, 26 °C dedans, 9 m² de vitrage au soleil, six personnes et leurs ordinateurs. Quel poste d’apports est le plus faible ?",
      opts: [
        { t: "Les parois opaques", ok: true },
        { t: "Le vitrage ensoleillé" },
        { t: "Les occupants et les équipements" },
      ],
    },
    observe: {
      focus: ["Uete", "Fs"], auto: [["Uete", 0.35], ["Uete", 0.15], ["Fs", 0.2]],
      task: "Partez des réglages de départ. Isolez mieux les murs (U de 0,35 à 0,15), puis baissez les stores (F_s de 0,65 à 0,2). Comparez les deux gains.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Départ (U = 0,35, F_s = 0,65)", ok: !!m.a },
          { t: "Murs mieux isolés (U = 0,15)", ok: !!m.b },
          { t: "Puis stores baissés (F_s ≤ 0,2)", ok: !!m.c },
        ];
        return { items, done: !!m.c };
      },
      reveal: (c) => { const a = c.mem.a || { tot: 0 }, b = c.mem.b || { tot: 0 }, d = c.mem.c || { tot: 0 }; return `Isoler les murs fait gagner ${f(a.tot - b.tot, 0)} W ; baisser les stores, ${f(b.tot - d.tot, 0)} W. En été, le soleil par les vitrages et les apports internes pèsent bien plus que les parois.`; },
    },
    measure: {
      text: "Φ<sub>T</sub> = U·S·(T<sub>ext</sub> − T<sub>int</sub>) ; Φ<sub>S</sub> = S<sub>vit</sub>·E·g·F<sub>s</sub> ; Φ<sub>I</sub> = 70 W par occupant + équipements.",
      q: "Pourquoi mieux isoler les murs change-t-il si peu le bilan d’été ?",
      opts: [
        { t: "L’écart de température est faible (7 K) : Φ_T reste petit devant le soleil et les apports internes", ok: true, fb: "135 W par les murs contre 1 470 W de soleil et 3 600 W d’apports internes : on agit d’abord sur les protections solaires et les équipements." },
        { t: "L’isolant n’agit qu’en hiver", fb: "Il agit dans les deux sens, mais le flux d’été par les murs est petit." },
        { t: "Le soleil chauffe les murs plus que l’air", fb: "Le modèle ne compte pas l’ensoleillement des murs ; même ainsi, Φ<sub>T</sub> reste faible." },
      ],
    },
    plus: {
      task: "Sans toucher aux températures (33 °C et 26 °C), ramenez les apports totaux sous 2 000 W.",
      hint: "protections solaires, vitrage à contrôle solaire, équipements plus sobres.",
      demo: [["Fs", 0.2], ["gsol", 0.3], ["Peq", 1]],
      check: (c) => c.v("Text") === 33 && c.v("Tint") === 26 && c.out.tot < 2000,
      reveal: (c) => `${f(c.out.tot, 0)} W au total, dont ${f(c.out.PhiI, 0)} W d’apports internes. La sobriété des équipements est un levier thermique à part entière.`,
    },
    diag: {
      story: "Une salle de réunion avec 20 m² de vitrage dépasse 7 kW d’apports l’après-midi, stores à moitié baissés.",
      preset: { Uete: 0.35, Sete: 55, Text: 33, Tint: 26, Svit: 20, Esol: 560, gsol: 0.8, Fs: 0.4, nOcc: 6, Peq: 3.2 },
      culprit: "gsol",
      fix: ["gsol", 0.3],
      symptom: (c) => `Apports totaux ${f(c.out.tot, 0)} W, dont ${f(c.out.PhiS, 0)} W de soleil.`,
      target: (c) => c.out.tot <= 5500 && c.v("Svit") === 20 && near(c.v("Fs"), 0.4, 1e-9) && near(c.v("Peq"), 3.2, 1e-9) && c.v("nOcc") === 6,
      targetTxt: "apports ≤ 5 500 W, même surface vitrée, mêmes stores et mêmes occupants",
      now: (c) => `${f(c.out.tot, 0)} W`,
      hint: "les stores sont baissés : que laisse passer le verre lui-même ?",
      explain: "Le vitrage était un verre clair (g = 0,8). Un vitrage à contrôle solaire (g ≤ 0,4) divise l’apport solaire par 2 sans toucher à la surface vitrée.",
    },
  };

  /* ---------- 02 · Inertie et déphasage ---------- */
  const phiH = (e, lam, rho, cp) => 1.38 * e * Math.sqrt(1 / Math.max(lam / (rho * cp) * 3600, 1e-12));
  AT.inertie = {
    compute(v) {
      const e = v("ein") / 100, lam = v("lin"), rho = v("rin"), cp = v("cpin");
      return { phi: phiH(e, lam, rho, cp), a: lam / (rho * cp), Cs: rho * cp * e / 1000 };
    },
    record(c) {
      const m = c.mem;
      if (c.v("ein") !== 28) return;
      if (near(c.v("lin"), 1.4, 1e-9) && c.v("rin") === 2200 && c.v("cpin") === 880) m.a = { phi: c.out.phi, Cs: c.out.Cs };
      if (near(c.v("lin"), 0.05, 1e-9) && c.v("rin") === 200 && c.v("cpin") === 2000 && m.a) m.b = { phi: c.out.phi, Cs: c.out.Cs };
    },
    predict: {
      q: "On remplace 28 cm de béton par 28 cm de fibre de bois (λ = 0,05, ρ = 200 kg/m³, c_p = 2 000 J/(kg·K)). Le déphasage…",
      opts: [
        { t: "diminue : le matériau est dix fois plus léger" },
        { t: "augmente nettement", ok: true },
        { t: "ne change pas : l’épaisseur est la même" },
      ],
    },
    observe: {
      focus: ["lin", "rin", "cpin"], auto: [["ein", 28], ["lin", 1.4], ["rin", 2200], ["cpin", 880], ["lin", 0.05], ["rin", 200], ["cpin", 2000]],
      task: "À 28 cm, réglez d’abord le béton (λ = 1,40, ρ = 2 200, c_p = 880), puis la fibre de bois (λ = 0,05, ρ = 200, c_p = 2 000). Comparez φ et la capacité C_s.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Béton de 28 cm", ok: !!m.a },
          { t: "Puis fibre de bois de 28 cm", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => { const a = c.mem.a || { phi: 0, Cs: 0 }, b = c.mem.b || { phi: 0, Cs: 0 }; return `φ passe de ${f(a.phi, 1)} à ${f(b.phi, 1)} h, alors que la capacité surfacique tombe de ${f(a.Cs, 0)} à ${f(b.Cs, 0)} kJ/(m²·K). Retarder l’onde et stocker la chaleur sont deux propriétés distinctes.`; },
    },
    measure: {
      text: "a = λ/(ρc<sub>p</sub>) ; φ ≈ 1,38·e·√(1/a), a en m²/h ; C<sub>s</sub> = ρc<sub>p</sub>e.",
      q: "Pourquoi la fibre de bois déphase-t-elle plus qu’un béton dense ?",
      opts: [
        { t: "Sa diffusivité est environ 6 fois plus faible : l’onde de chaleur y avance plus lentement", ok: true, fb: "a = 1,25·10⁻⁷ m²/s contre 7,2·10⁻⁷ pour le béton : faible conductivité et forte chaleur massique ralentissent l’onde." },
        { t: "Elle stocke plus de chaleur que le béton", fb: "C’est l’inverse : sa capacité surfacique est près de 5 fois plus faible." },
        { t: "Elle est plus épaisse", fb: "Les deux parois font 28 cm." },
      ],
    },
    plus: {
      task: "Avec le béton (λ = 1,40, ρ = 2 200, c_p = 880), obtenez un déphasage d’au moins 10 h.",
      hint: "le matériau est fixé : seule l’épaisseur reste.",
      demo: [["lin", 1.4], ["rin", 2200], ["cpin", 880], ["ein", 38]],
      check: (c) => near(c.v("lin"), 1.4, 1e-9) && c.v("rin") === 2200 && c.v("cpin") === 880 && c.out.phi >= 10,
      reveal: (c) => `Il faut ${c.v("ein")} cm de béton pour φ = ${f(c.out.phi, 1)} h : la masse seule coûte cher en épaisseur et en carbone.`,
    },
    diag: {
      story: "Un local en « béton » reste chaud jusqu’à 21 h ; le calcul annonce pourtant moins de 3 h de déphasage.",
      preset: { ein: 28, lin: 1.4, rin: 300, cpin: 880 },
      culprit: "rin",
      fix: ["rin", 2200],
      symptom: (c) => `φ = ${f(c.out.phi, 1)} h ; a = ${c.out.a.toExponential(2).replace(".", ",")} m²/s.`,
      target: (c) => c.out.phi >= 6 && c.v("ein") === 28 && near(c.v("lin"), 1.4, 1e-9) && c.v("cpin") === 880,
      targetTxt: "φ ≥ 6 h, même épaisseur, même λ et même c<sub>p</sub>",
      now: (c) => `φ = ${f(c.out.phi, 1)} h`,
      hint: "un béton de 300 kg/m³, est-ce plausible ?",
      explain: "La masse volumique saisie (300 kg/m³) était celle d’un isolant, pas d’un béton. À 2 200 kg/m³, le déphasage remonte à 7,6 h, ce qui explique le pic tardif observé.",
    },
  };

  /* ---------- 03 · Systèmes, ballon, PV ---------- */
  AT.bepos = {
    compute(v) {
      const Ef = v("Eu") / v("etaSys");
      const V = v("Qstock") * 1000 * v("tstock") * 3600 / (1000 * 4180 * v("dTeau")) * 1000;
      const Epv = v("Ppv") * v("prod"), eco = Epv * v("prix");
      return { Ef, V, Epv, TRI: eco > 0 ? v("inv") / eco : Infinity };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("Qstock"), 3.2, 1e-9) && near(c.v("tstock"), 1.5, 1e-9)) {
        if (c.v("dTeau") === 12) m.a = c.out.V;
        if (c.v("dTeau") === 6 && m.a) m.b = c.out.V;
      }
    },
    predict: {
      q: "Un ballon tampon doit stocker la même énergie avec un écart de température deux fois plus faible (12 K → 6 K). Son volume…",
      opts: [
        { t: "double", ok: true },
        { t: "est divisé par 2" },
        { t: "ne change pas : l’énergie est la même" },
      ],
    },
    observe: {
      focus: ["dTeau"], auto: [["dTeau", 12], ["dTeau", 6]],
      task: "Avec 3,2 kW stockés pendant 1,5 h, comparez un écart de 12 K puis de 6 K dans le ballon.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "ΔT = 12 K", ok: !!m.a },
          { t: "Puis ΔT = 6 K", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Le volume passe de ${f(c.mem.a || 0, 0)} à ${f(c.mem.b || 0, 0)} L : il double. Un ballon qui travaille sur un faible écart de température doit être plus gros.`,
    },
    measure: {
      text: "Q = ρ·V·c<sub>p</sub>·ΔT, avec Q = P·t : V = P·t/(ρ·c<sub>p</sub>·ΔT).",
      q: "Pourquoi le volume double-t-il ?",
      opts: [
        { t: "Chaque litre stocke une énergie proportionnelle à ΔT : deux fois moins d’écart, deux fois plus de litres", ok: true, fb: "1 L d’eau sur 12 K stocke 50 kJ ; sur 6 K, 25 kJ. Pour 17 MJ, il faut donc deux fois plus d’eau." },
        { t: "L’eau est plus dense à basse température", fb: "La variation de masse volumique est négligeable ici." },
        { t: "La puissance stockée double", fb: "La puissance (3,2 kW) et la durée sont les mêmes." },
      ],
    },
    plus: {
      task: "Pour un investissement PV de 12 500 €, trouvez un réglage avec un temps de retour inférieur à 8 ans.",
      hint: "plus de puissance installée ou un meilleur site (productible).",
      demo: [["inv", 12500], ["prix", 0.22], ["Ppv", 8], ["prod", 900]],
      check: (c) => c.v("inv") === 12500 && c.out.TRI < 8,
      reveal: (c) => `${f(c.out.Epv, 0)} kWh/an produits, TRI ≈ ${f(c.out.TRI, 1)} ans. Le TRI simple suppose que tout est autoconsommé au prix d’achat : c’est un ordre de grandeur optimiste.`,
    },
    diag: {
      story: "Une PAC consomme le double de ce qu’annonçait le constructeur pour 6 500 kWh de chaleur utile.",
      preset: { modeSys: "cop", Eu: 6500, etaSys: 1.5 },
      culprit: "etaSys",
      fix: ["etaSys", 3.2],
      symptom: (c) => `Énergie finale ${f(c.out.Ef, 0)} kWh pour 6 500 kWh utiles.`,
      target: (c) => c.out.Ef <= 2200 && c.v("Eu") === 6500,
      targetTxt: "énergie finale ≤ 2 200 kWh, même besoin utile",
      now: (c) => `E<sub>f</sub> = ${f(c.out.Ef, 0)} kWh`,
      hint: "E<sub>f</sub> = E<sub>u</sub>/COP.",
      explain: "Le COP saisonnier retenu (1,5) correspondait à une machine mal réglée ou à un appoint électrique permanent. Avec un COP de 3,2, l’énergie finale retombe vers 2 000 kWh.",
    },
  };

  /* ---------- 04 · Aéraulique ---------- */
  AT.aera = {
    compute(v) {
      const Qv = v("Sa") * v("va"), dP = v("La") * v("J") + v("Psing");
      return { Qh: Qv * 3600, dP, P: Qv * dP / v("etaA") };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("Sa"), 0.12, 1e-9) && near(c.v("va"), 4.5, 1e-9) && near(c.v("J"), 1.2, 1e-9) && c.v("Psing") === 90 && near(c.v("etaA"), 0.55, 1e-9)) {
        if (c.v("La") === 35) m.a = c.out.P;
        if (c.v("La") === 70 && m.a) m.b = c.out.P;
      }
    },
    predict: {
      q: "À débit égal, on double la longueur du réseau de gaines (35 → 70 m). La puissance électrique du ventilateur…",
      opts: [
        { t: "double" },
        { t: "augmente d’environ un tiers", ok: true },
        { t: "ne change pas : le débit est le même" },
      ],
    },
    observe: {
      focus: ["La"], auto: [["La", 35], ["La", 70]],
      task: "Avec les réglages de départ, passez la longueur du réseau de 35 à 70 m. Suivez ΔP et la puissance électrique.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "35 m de gaines", ok: !!m.a },
          { t: "Puis 70 m", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `La puissance passe de ${f(c.mem.a || 0, 0)} à ${f(c.mem.b || 0, 0)} W (+${f(((c.mem.b || 0) / (c.mem.a || 1) - 1) * 100, 0)} %). Les 90 Pa des singularités (coudes, grilles, filtre) ne dépendent pas de la longueur.`,
    },
    measure: {
      text: "q<sub>v</sub> = S·v ; ΔP = L·J + ΣΔP<sub>sing</sub> ; P<sub>élec</sub> = q<sub>v</sub>·ΔP/η.",
      q: "Pourquoi la puissance n’a-t-elle pas doublé ?",
      opts: [
        { t: "Seules les pertes linéaires doublent ; les pertes singulières restent", ok: true, fb: "ΔP passe de 42 + 90 = 132 Pa à 84 + 90 = 174 Pa : +32 %. Les accidents du réseau pèsent souvent plus que sa longueur." },
        { t: "Le rendement du ventilateur s’améliore", fb: "η est resté à 0,55." },
        { t: "Le débit baisse quand le réseau s’allonge", fb: "Le débit est imposé ici (section × vitesse)." },
      ],
    },
    plus: {
      task: "Pour le même débit (environ 1 940 m³/h), ramenez la puissance électrique sous 80 W.",
      hint: "moins d’accidents dans le réseau et un meilleur ventilateur.",
      demo: [["Sa", 0.12], ["va", 4.5], ["Psing", 30], ["etaA", 0.85]],
      check: (c) => c.out.Qh >= 1900 && c.out.Qh <= 2000 && c.out.P < 80,
      reveal: (c) => `${f(c.out.P, 0)} W pour ${f(c.out.Qh, 0)} m³/h, avec ΔP = ${f(c.out.dP, 0)} Pa. Un réseau sobre et un bon ventilateur divisent la consommation, sans toucher au débit d’hygiène.`,
    },
    diag: {
      story: "Le ventilateur d’une centrale de traitement d’air consomme plus de 300 W pour un débit pourtant ordinaire.",
      preset: { Sa: 0.12, va: 4.5, La: 35, J: 1.2, Psing: 300, etaA: 0.55 },
      culprit: "Psing",
      fix: ["Psing", 90],
      symptom: (c) => `P<sub>élec</sub> = ${f(c.out.P, 0)} W ; ΔP = ${f(c.out.dP, 0)} Pa.`,
      target: (c) => c.out.P <= 150 && near(c.v("Sa"), 0.12, 1e-9) && near(c.v("va"), 4.5, 1e-9) && c.v("La") === 35 && near(c.v("J"), 1.2, 1e-9) && near(c.v("etaA"), 0.55, 1e-9),
      targetTxt: "P<sub>élec</sub> ≤ 150 W, même réseau, même débit, même ventilateur",
      now: (c) => `P = ${f(c.out.P, 0)} W`,
      hint: "le réseau n’a pas changé de longueur : qu’est-ce qui s’encrasse ou se ferme ?",
      explain: "300 Pa de pertes singulières : filtre colmaté ou registre resté fermé. Une fois corrigé (90 Pa), la consommation retombe vers 130 W.",
    },
  };

  /* ---------- 05 · Acoustique ---------- */
  AT.acou = {
    compute(v) {
      const Ltot = 10 * Math.log10(Math.pow(10, v("L1") / 10) + Math.pow(10, v("L2") / 10));
      return { Ltot, Lrec: Ltot - v("Rw"), T: 0.16 * v("Vac") / v("Aac") };
    },
    record(c) {
      const m = c.mem;
      if (c.v("L1") === 70) {
        if (c.v("L2") === 70) m.a = c.out.Ltot;
        if (c.v("L2") <= 60 && m.a) m.b = c.out.Ltot;
      }
    },
    predict: {
      q: "Deux machines identiques font chacune 70 dB. Ensemble, le niveau sonore vaut environ…",
      opts: [
        { t: "140 dB" },
        { t: "73 dB", ok: true },
        { t: "76 dB" },
      ],
    },
    observe: {
      focus: ["L1", "L2"], auto: [["L1", 70], ["L2", 70], ["L2", 60]],
      task: "Réglez les deux sources à 70 dB, puis baissez la seconde à 60 dB. Suivez le niveau total.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Deux sources à 70 dB", ok: !!m.a },
          { t: "Puis la seconde à 60 dB", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Deux sources égales : ${f(c.mem.a || 0, 1)} dB ; avec une source 10 dB plus faible : ${f(c.mem.b || 0, 1)} dB. La plus faible n’ajoute presque rien : on traite d’abord la source dominante.`,
    },
    measure: {
      text: "L<sub>total</sub> = 10·log(Σ 10<sup>L<sub>i</sub>/10</sup>) : on additionne les intensités, pas les décibels.",
      q: "Pourquoi 70 dB + 70 dB ne font-ils pas 140 dB ?",
      opts: [
        { t: "Deux fois plus d’énergie sonore ajoute 10·log 2 ≈ 3 dB à l’échelle logarithmique", ok: true, fb: "Le décibel est un logarithme : doubler l’intensité ajoute 3 dB, la multiplier par 10 ajoute 10 dB." },
        { t: "Les deux sons s’annulent en partie", fb: "Pour des bruits ordinaires, les intensités s’additionnent sans s’annuler." },
        { t: "L’oreille plafonne à 73 dB", fb: "Il s’agit d’un niveau physique, pas d’une perception." },
      ],
    },
    plus: {
      task: "Pour une salle d’au moins 200 m³, réglez l’absorption pour obtenir un temps de réverbération entre 0,5 et 0,7 s.",
      hint: "T = 0,16·V/A.",
      demo: [["Vac", 200], ["Aac", 55]],
      check: (c) => c.v("Vac") >= 200 && c.out.T >= 0.5 && c.out.T <= 0.7,
      reveal: (c) => `T = ${f(c.out.T, 2)} s avec A = ${c.v("Aac")} m² Sabine. Un volume plus grand demande proportionnellement plus de surfaces absorbantes.`,
    },
    diag: {
      story: "Dans un cabinet médical, on entend les conversations de la salle d’attente voisine : le niveau reçu atteint 45 dB.",
      preset: { L1: 68, L2: 61, Lw: 82, dAc: 4, Rw: 24, Vac: 95, Aac: 18 },
      culprit: "Rw",
      fix: ["Rw", 42],
      symptom: (c) => `Niveau total côté attente ${f(c.out.Ltot, 1)} dB ; reçu dans le cabinet ≈ ${f(c.out.Lrec, 1)} dB.`,
      target: (c) => c.out.Lrec <= 30 && c.v("L1") === 68 && c.v("L2") === 61,
      targetTxt: "niveau reçu ≤ 30 dB, mêmes sources",
      now: (c) => `L<sub>reçu</sub> ≈ ${f(c.out.Lrec, 1)} dB`,
      hint: "on ne fera pas taire la salle d’attente.",
      explain: "La cloison n’affaiblissait que 24 dB (simple plaque de plâtre). Il faut au moins 39 dB d’indice d’affaiblissement pour descendre sous 30 dB reçus.",
    },
  };

  const B = (id, icon, name, desc, how, check) => ({ id, icon, name, desc, how, check });
  const IDS = ["ete", "inertie", "bepos", "aera", "acou"];
  const BADGES = [
    B("soleil", "g", "Le soleil d’abord", "En été, les stores battent l’isolant.", "Terminer l’observation de l’atelier 01.", (x) => !!x.A("ete").obsDone),
    B("onde-lente", "φ", "Onde lente", "Dix heures de déphasage obtenues.", "Le piège de l’atelier 02.", (x) => !!x.A("inertie").plusDone),
    B("ballon", "ΔT", "Ballon tampon", "Moins d’écart, plus de litres.", "Terminer l’observation de l’atelier 03.", (x) => !!x.A("bepos").obsDone),
    B("sobre", "Pa", "Réseau sobre", "Le même débit pour moins de 80 W.", "Le piège de l’atelier 04.", (x) => !!x.A("aera").plusDone),
    B("plus-trois", "+3", "Plus 3 dB", "Deux sources égales : +3 dB, pas le double.", "Terminer l’observation de l’atelier 05.", (x) => !!x.A("acou").obsDone),
    B("pressentiment", "P", "Bon pressentiment", "Quatre prédictions justes.", "Quatre prédictions justes à l’étape 1.", (x) => Object.values(x.store.at).filter((a) => a.predOk).length >= 4),
    B("lucidite", "?", "Lucidité", "Sûr·e de vous et pourtant détrompé·e, puis l’explication trouvée.", "Se tromper avec assurance, puis valider l’explication.", (x) => Object.values(x.store.at).some((a) => a.pred != null && !a.predOk && a.conf === "Sûr·e" && a.explOk)),
    B("diagnostiqueur", "D", "Diagnostiqueur", "Trois installations corrigées en mode diagnostic.", "Réussir trois diagnostics.", (x) => (x.store.nDiag || 0) >= 3),
    B("complet", "5", "Parcours complet", "Les cinq ateliers parcourus jusqu’au diagnostic.", "Terminer les cinq parcours.", (x) => IDS.every((k) => x.A(k).diagDone)),
  ];

  window.LABV3_PARCOURS = {
    storeKey: "r48_parcours", ateliers: AT, badges: BADGES, bilanHost: "defi",
    // graphe 2D qui porte une information absente de la 3D
    keep2d: { inertie: true },
  };
})();
