/* =====================================================================
   R2-9 · parcours pédagogiques (mission Halle de Valvert)
   Chaque atelier : predict (POÉ), observe (tâche détectée), measure (explication),
   plus (le piège), diag (cas pathologique). Données génériques : aucune valeur du dossier noté.
   Les champs demo (plus) et fix (diag) servent aux tests automatiques.
   ===================================================================== */
(() => {
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const near = (x, a, tol) => Math.abs(x - a) <= tol;
  const Ti = 20;
  // pression de vapeur saturante (formule de Magnus, comme la v1)
  const Psat = (T) => (T >= 0 ? 610.5 * Math.exp((17.269 * T) / (237.3 + T)) : 610.5 * Math.exp((21.875 * T) / (265.5 + T)));
  const AT = {};

  /* ---------- 01 · Conduction et résistance thermique ---------- */
  AT.cond = {
    compute(v) {
      const R1 = v("e1") / 100 / v("l1"), R2 = v("e2") / 100 / v("l2"), Rm = R1 + R2;
      const Te = v("Text"), phi = (Ti - Te) / Rm, T12 = Ti - phi * R1;
      return { R1, R2, Rm, phi, T12, part1: (Ti - T12) / (Ti - Te) };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("l1"), 0.045, 1e-9) && c.v("e2") === 18 && near(c.v("l2"), 1.8, 1e-9) && c.v("Text") === 0) {
        if (c.v("e1") === 8) m.e8 = { phi: c.out.phi, T12: c.out.T12 };
        if (c.v("e1") === 16 && m.e8) m.e16 = { phi: c.out.phi, T12: c.out.T12 };
      }
    },
    predict: {
      q: "On double l’épaisseur d’isolant de la paroi (de 8 à 16 cm). Le flux de chaleur qui la traverse…",
      opts: [
        { t: "est divisé par 2, à peu près", ok: true },
        { t: "est divisé par 4" },
        { t: "ne change presque pas : le béton fait l’essentiel" },
      ],
    },
    observe: {
      focus: ["e1"], auto: [["e1", 8], ["e1", 16]],
      task: "Avec les autres réglages de départ (0 °C dehors), passez l’isolant de 8 à 16 cm. Suivez le flux φ et la température à l’interface isolant/béton.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Isolant de 8 cm", ok: !!m.e8 },
          { t: "Puis 16 cm, le reste inchangé", ok: !!m.e16 },
        ];
        return { items, done: !!m.e16 };
      },
      reveal: (c) => `φ est passé de ${f(c.mem.e8 ? c.mem.e8.phi : 0, 2)} à ${f(c.mem.e16 ? c.mem.e16.phi : 0, 2)} W/m², presque divisé par 2. L’interface reste vers ${f(c.mem.e16 ? c.mem.e16.T12 : 0, 1)} °C : presque toute la chute de température se fait dans l’isolant.`,
    },
    measure: {
      text: "R = e/λ ; en série, R<sub>mat</sub> = R<sub>1</sub> + R<sub>2</sub> ; φ = (T<sub>i</sub> − T<sub>e</sub>)/R<sub>mat</sub>.",
      q: "Pourquoi le flux n’est-il pas exactement divisé par 2 ?",
      opts: [
        { t: "Le béton garde sa propre résistance : R_mat passe de 1,88 à 3,66 m²·K/W, un peu moins que le double", ok: true, fb: "Seule R<sub>1</sub> double (1,78 → 3,56) ; R<sub>2</sub> = 0,10 reste. Les résistances en série s’additionnent." },
        { t: "La conductivité de l’isolant change avec l’épaisseur", fb: "λ est une propriété du matériau : elle ne dépend pas de l’épaisseur." },
        { t: "Le flux dépend de l’épaisseur au carré", fb: "R = e/λ est proportionnelle à l’épaisseur, pas à son carré." },
      ],
    },
    plus: {
      task: "Trouvez une paroi où la chute de température se partage à peu près à égalité entre les deux couches (isolant entre 40 et 60 % de l’écart).",
      hint: "il faut R₁ ≈ R₂ : un isolant mince et médiocre, un béton épais et plus isolant.",
      demo: [["Text", 0], ["e1", 3], ["l1", 0.12], ["e2", 20], ["l2", 0.8]],
      check: (c) => c.out.part1 >= 0.4 && c.out.part1 <= 0.6,
      reveal: (c) => `R<sub>1</sub> = ${f(c.out.R1, 2)} et R<sub>2</sub> = ${f(c.out.R2, 2)} m²·K/W : l’isolant ne prend que ${f(c.out.part1 * 100, 0)} % de l’écart. La pente du profil dans chaque couche suit R, pas l’épaisseur dessinée.`,
    },
    diag: {
      story: "Une paroi annoncée « isolée par 8 cm » laisse passer plus de 25 W/m² par 0 °C dehors, deux fois et demie la valeur attendue.",
      preset: { e1: 8, l1: 0.12, e2: 18, l2: 1.8, Text: 0 },
      culprit: "l1",
      fix: ["l1", 0.045],
      symptom: (c) => `φ = ${f(c.out.phi, 1)} W/m² ; R<sub>mat</sub> = ${f(c.out.Rm, 2)} m²·K/W.`,
      target: (c) => c.out.phi <= 12 && c.v("e1") === 8 && c.v("e2") === 18 && near(c.v("l2"), 1.8, 1e-9) && c.v("Text") === 0,
      targetTxt: "φ ≤ 12 W/m², épaisseurs et béton inchangés",
      now: (c) => `φ = ${f(c.out.phi, 1)} W/m²`,
      hint: "l’épaisseur est bonne : qu’est-ce qui fait la qualité d’un isolant ?",
      explain: "La conductivité de l’isolant valait 0,12 W/(m·K) : un isolant tassé ou humide. À 0,045 W/(m·K), R<sub>1</sub> remonte à 1,78 m²·K/W et φ redescend vers 11 W/m².",
    },
  };

  /* ---------- 02 · Échanges de surface ---------- */
  AT.surf = {
    compute(v) {
      const Rsi = v("Rsi"), Rtot = Rsi + v("Rmat") + v("Rse"), Te = v("Text2");
      const phi = (Ti - Te) / Rtot, Tsi = Ti - phi * Rsi;
      return { phi, Tsi, fR: (Tsi - Te) / (Ti - Te), cond: Tsi < v("Td") };
    },
    record(c) {
      const m = c.mem;
      if (c.v("Text2") === 0 && near(c.v("Rsi"), 0.13, 1e-9)) {
        if (c.v("Rmat") >= 3.15) m.hi = c.out.Tsi;
        if (c.v("Rmat") <= 0.31 && m.hi != null) m.lo = c.out.Tsi;
      }
    },
    predict: {
      q: "Un mur ancien très peu isolé (R_mat = 0,3 m²·K/W), 20 °C dans la pièce et 0 °C dehors. La surface intérieure du mur est à environ…",
      opts: [
        { t: "19 °C : presque la température de la pièce" },
        { t: "14 °C", ok: true },
        { t: "2 °C : presque la température extérieure" },
      ],
    },
    observe: {
      focus: ["Rmat"], auto: [["Rmat", 3.2], ["Rmat", 0.3]],
      task: "Par 0 °C dehors, partez de R_mat = 3,2 m²·K/W, puis descendez à 0,3 m²·K/W. Suivez la température de surface intérieure T_si.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Mur bien isolé (R_mat = 3,2)", ok: m.hi != null },
          { t: "Puis mur ancien (R_mat = 0,3)", ok: m.lo != null },
        ];
        return { items, done: m.lo != null };
      },
      reveal: (c) => `T<sub>si</sub> est passée de ${f(c.mem.hi || 0, 1)} à ${f(c.mem.lo || 0, 1)} °C. La main posée sur ce mur le sent froid, et l’air humide de la pièce s’en rapproche du point de rosée.`,
    },
    measure: {
      text: "φ = (T<sub>i</sub> − T<sub>e</sub>)/R<sub>tot</sub> avec R<sub>tot</sub> = R<sub>si</sub> + R<sub>mat</sub> + R<sub>se</sub>, puis T<sub>si</sub> = T<sub>i</sub> − φ·R<sub>si</sub>.",
      q: "Pourquoi la surface intérieure se refroidit-elle quand le mur isole mal ?",
      opts: [
        { t: "Le flux, plus fort, traverse aussi la lame d’air intérieure : la chute φ·R_si y grandit", ok: true, fb: "R<sub>si</sub> ne change pas, mais φ a été multiplié par 7 : la chute dans la lame d’air passe de 0,8 à 5,5 K." },
        { t: "L’air extérieur traverse le mur", fb: "Le modèle est en conduction pure : pas de passage d’air." },
        { t: "R_si diminue quand le mur isole mal", fb: "R<sub>si</sub> est une résistance d’échange superficiel, indépendante du mur." },
      ],
    },
    plus: {
      task: "Par −10 °C dehors, avec un point de rosée de 12 °C, trouvez une isolation juste suffisante (R_mat ≤ 0,6 m²·K/W) qui évite la condensation de surface.",
      hint: "il faut T_si ≥ 12 °C.",
      demo: [["Text2", -10], ["Td", 12], ["Rmat", 0.4]],
      check: (c) => c.v("Text2") === -10 && near(c.v("Td"), 12, 1e-9) && !c.out.cond && c.v("Rmat") <= 0.6,
      reveal: (c) => `T<sub>si</sub> = ${f(c.out.Tsi, 1)} °C : pas de buée. Mais f<sub>Rsi</sub> = ${f(c.out.fR, 2)}, loin du seuil de 0,90 : éviter la buée de justesse ne suffit pas à éviter les moisissures dans les angles.`,
    },
    diag: {
      story: "Buée sur le mur d’une chambre (point de rosée 14 °C, −5 °C dehors) : on découvre que l’isolant prévu derrière le doublage n’a jamais été posé.",
      preset: { Rmat: 0.3, Rsi: 0.13, Rse: 0.04, Text2: -5, Td: 14 },
      culprit: "Rmat",
      fix: ["Rmat", 3.2],
      symptom: (c) => `T<sub>si</sub> = ${f(c.out.Tsi, 1)} °C, sous le point de rosée ; f<sub>Rsi</sub> = ${f(c.out.fR, 2)}.`,
      target: (c) => !c.out.cond && c.out.fR >= 0.9 && c.v("Text2") === -5 && near(c.v("Td"), 14, 1e-9) && near(c.v("Rsi"), 0.13, 1e-9),
      targetTxt: "pas de condensation et f<sub>Rsi</sub> ≥ 0,90, mêmes conditions",
      now: (c) => `T<sub>si</sub> = ${f(c.out.Tsi, 1)} °C, f<sub>Rsi</sub> = ${f(c.out.fR, 2)}`,
      hint: "quelle résistance manque dans la paroi ?",
      explain: "Sans isolant, R<sub>mat</sub> = 0,3 m²·K/W : T<sub>si</sub> tombe à 13 °C, sous le point de rosée de 14 °C. Avec l’isolant prévu (R<sub>mat</sub> ≥ 1,2 m²·K/W), f<sub>Rsi</sub> dépasse 0,90 et la surface reste au-dessus du point de rosée.",
    },
  };

  /* ---------- 03 · U, surfaces et ponts thermiques ---------- */
  AT.bilan = {
    compute(v) {
      const HD = v("Um") * v("Am") + v("Uv") * v("Av"), Htot = HD + v("HL");
      return { HD, Htot, pL: Htot > 0 ? v("HL") / Htot * 100 : 0, E: Htot * 24 * v("DJU") / 1000 };
    },
    record(c) {
      const m = c.mem;
      if (c.v("Am") === 60 && near(c.v("Uv"), 2.2, 1e-9) && c.v("Av") === 18 && near(c.v("HL"), 8, 1e-9) && c.v("DJU") === 1800) {
        if (near(c.v("Um"), 0.55, 1e-9)) m.a = { E: c.out.E, pL: c.out.pL };
        if (c.v("Um") <= 0.28 && m.a) m.b = { E: c.out.E, pL: c.out.pL };
      }
    },
    predict: {
      q: "On divise par 2 le coefficient U du mur courant (0,55 → 0,28), sans toucher aux vitrages ni aux ponts thermiques. La consommation de chauffage baisse d’environ…",
      opts: [
        { t: "50 %" },
        { t: "20 %", ok: true },
        { t: "presque rien" },
      ],
    },
    observe: {
      focus: ["Um"], auto: [["Um", 0.55], ["Um", 0.28]],
      task: "Avec les surfaces et les ponts de départ, passez U_mur de 0,55 à 0,28 W/(m²·K). Suivez l’énergie de la saison et la part des ponts.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "U_mur = 0,55", ok: !!m.a },
          { t: "Puis U_mur ≤ 0,28", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => { const a = c.mem.a || { E: 0, pL: 0 }, b = c.mem.b || { E: 0, pL: 0 }; return `L’énergie passe de ${f(a.E, 0)} à ${f(b.E, 0)} kWh (−${f((1 - b.E / (a.E || 1)) * 100, 0)} %). La part des ponts monte de ${f(a.pL, 0)} à ${f(b.pL, 0)} % : mieux on isole, plus les jonctions pèsent.`; },
    },
    measure: {
      text: "H<sub>tot</sub> = Σ U<sub>i</sub>A<sub>i</sub> + H<sub>L</sub> ; E ≈ H<sub>tot</sub> · 24 · DJU (Wh, si H<sub>tot</sub> en W/K).",
      q: "Pourquoi diviser U_mur par 2 ne divise-t-il pas la consommation par 2 ?",
      opts: [
        { t: "Le mur ne représentait que 41 % de H_tot : vitrages et ponts restent inchangés", ok: true, fb: "H<sub>tot</sub> = 33 (mur) + 39,6 (vitrages) + 8 (ponts) W/K : seul le premier terme a été divisé par 2." },
        { t: "Les DJU augmentent quand on isole", fb: "Les DJU dépendent du climat et de la consigne, pas de l’enveloppe." },
        { t: "U et la consommation ne sont pas liés", fb: "Ils le sont, à travers H<sub>tot</sub>, mais pour la seule part du mur." },
      ],
    },
    plus: {
      task: "Trouvez un réglage où les ponts thermiques dépassent 30 % des déperditions totales.",
      hint: "une enveloppe très performante, des jonctions mal traitées.",
      demo: [["Um", 0.2], ["Uv", 1], ["HL", 30]],
      check: (c) => c.out.pL > 30,
      reveal: (c) => `Les ponts font ${f(c.out.pL, 0)} % de H<sub>tot</sub> = ${f(c.out.Htot, 1)} W/K. Dans un bâtiment performant, le traitement des jonctions devient le premier poste.`,
    },
    diag: {
      story: "Une halle aux murs très bien isolés (U = 0,20 W/(m²·K)) consomme encore près de 4 000 kWh par saison : bien plus que ne le laissait prévoir l’isolation des murs.",
      preset: { Um: 0.2, Am: 60, Uv: 2.2, Av: 18, HL: 40, Tcons: 19, Tjour: 6, DJU: 1800 },
      culprit: "HL",
      fix: ["HL", 8],
      symptom: (c) => `E ≈ ${f(c.out.E, 0)} kWh ; ponts : ${f(c.out.pL, 0)} % de H<sub>tot</sub>.`,
      target: (c) => c.out.pL <= 15 && near(c.v("Um"), 0.2, 1e-9) && near(c.v("Uv"), 2.2, 1e-9) && c.v("Am") === 60 && c.v("Av") === 18,
      targetTxt: "ponts ≤ 15 % de H<sub>tot</sub>, murs et vitrages inchangés",
      now: (c) => `ponts ${f(c.out.pL, 0)} %, E ≈ ${f(c.out.E, 0)} kWh`,
      hint: "le mur est bon : où passe la chaleur ?",
      explain: "Les ponts thermiques valaient 40 W/K, autant que tout le mur : jonctions plancher/façade non traitées. Des rupteurs ou une isolation continue les ramènent sous 10 W/K.",
    },
  };

  /* ---------- 04 · Glaser ---------- */
  AT.glaser = {
    compute(v) {
      const PvInt = v("HRi") / 100 * Psat(20), PvExt = 0.8 * Psat(-2);
      const warm = v("SdPV") + v("Sd1"), tot = warm + v("Sd2");
      const PvIf = PvInt - (PvInt - PvExt) * warm / tot;
      return { PvInt, PvIf, Ps: Psat(2), risk: PvIf > Psat(2) };
    },
    record(c) {
      const m = c.mem;
      if (c.v("HRi") === 65 && near(c.v("Sd1"), 0.35, 1e-9) && c.v("Sd2") === 6) {
        if (c.v("SdPV") === 0) m.a = c.out.PvIf;
        if (c.v("SdPV") >= 20 && m.a != null) m.b = c.out.PvIf;
      }
    },
    predict: {
      q: "Un mur isolé par l’intérieur condense à l’interface isolant/béton. On ajoute côté chaud un pare-vapeur (S_d = 20 m). La pression de vapeur à l’interface…",
      opts: [
        { t: "augmente : la vapeur est bloquée dans le mur" },
        { t: "baisse nettement, sous la pression saturante", ok: true },
        { t: "ne change pas : seule la température compte" },
      ],
    },
    observe: {
      focus: ["SdPV"], auto: [["SdPV", 0], ["SdPV", 20]],
      task: "Avec HR = 65 % et les couches de départ, comparez le mur sans pare-vapeur (S_d = 0) puis avec un pare-vapeur de 20 m. Regardez P_v face à P_sat à l’interface.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Sans pare-vapeur", ok: m.a != null },
          { t: "Puis pare-vapeur de 20 m", ok: m.b != null },
        ];
        return { items, done: m.b != null };
      },
      reveal: (c) => `À l’interface, P<sub>v</sub> passe de ${f(c.mem.a || 0, 0)} à ${f(c.mem.b || 0, 0)} Pa, pour une pression saturante de ${f(Psat(2), 0)} Pa. Le croisement disparaît : la vapeur perd sa pression avant d’atteindre le froid.`,
    },
    measure: {
      text: "P<sub>v</sub> décroît linéairement en fonction du S<sub>d</sub> cumulé ; P<sub>sat</sub> ne dépend que de la température.",
      q: "Pourquoi le pare-vapeur se pose-t-il côté chaud ?",
      opts: [
        { t: "La pression de vapeur chute surtout dans les couches de grand S_d : côté chaud, elle chute avant le point froid", ok: true, fb: "Avec le pare-vapeur côté chaud, 77 % de la chute de P<sub>v</sub> se fait avant l’interface froide. Côté froid, il piégerait la vapeur contre la paroi froide." },
        { t: "Pour réchauffer l’isolant", fb: "Le pare-vapeur ne change presque rien aux températures." },
        { t: "Parce qu’il est plus facile à poser à l’intérieur", fb: "La raison est physique : où la vapeur perd-elle sa pression ?" },
      ],
    },
    plus: {
      task: "Sans pare-vapeur, avec les mêmes couches, trouvez l’humidité intérieure la plus haute qui évite la condensation.",
      hint: "baissez HR jusqu’à ce que le croisement disparaisse.",
      demo: [["SdPV", 0], ["HRi", 30]],
      check: (c) => c.v("SdPV") === 0 && near(c.v("Sd1"), 0.35, 1e-9) && c.v("Sd2") === 6 && !c.out.risk,
      reveal: (c) => `Il faut descendre à HR = ${c.v("HRi")} % : un air de logement est rarement aussi sec en hiver. Sans pare-vapeur, ce mur condense dans des conditions normales d’usage.`,
    },
    diag: {
      story: "Après rénovation, des moisissures apparaissent derrière l’isolant d’une salle de douches maintenue à 80 % d’humidité.",
      preset: { HRi: 80, Sd1: 0.35, Sd2: 6, SdPV: 0 },
      culprit: "SdPV",
      fix: ["SdPV", 30],
      symptom: (c) => `P<sub>v</sub> à l’interface : ${f(c.out.PvIf, 0)} Pa, pour P<sub>sat</sub> = ${f(c.out.Ps, 0)} Pa.`,
      target: (c) => !c.out.risk && c.v("HRi") === 80 && near(c.v("Sd1"), 0.35, 1e-9) && c.v("Sd2") === 6,
      targetTxt: "plus de croisement, à HR et couches inchangées",
      now: (c) => `P<sub>v</sub> = ${f(c.out.PvIf, 0)} Pa`,
      hint: "à 80 % d’HR, il manque une couche.",
      explain: "Aucun pare-vapeur n’avait été posé côté chaud. À 80 % d’HR, il faut un S<sub>d</sub> cumulé d’au moins 24 m côté chaud pour que P<sub>v</sub> reste sous P<sub>sat</sub> à l’interface.",
    },
  };

  /* ---------- 05 · Onde de chaleur ---------- */
  AT.dyn = {
    compute(v) {
      const e = v("ed") / 100, a = v("ld") / (v("rd") * v("cp")), T0 = 86400;
      return { a, dt: e * Math.sqrt(T0 / (4 * Math.PI * a)) / 3600, A: Math.exp(-e * Math.sqrt(Math.PI / (a * T0))) };
    },
    record(c) {
      const m = c.mem;
      if (near(c.v("ld"), 1.6, 1e-9) && c.v("rd") === 2100 && c.v("cp") === 920) {
        if (c.v("ed") === 20) m.e20 = { dt: c.out.dt, A: c.out.A };
        if (c.v("ed") === 40 && m.e20) m.e40 = { dt: c.out.dt, A: c.out.A };
      }
    },
    predict: {
      q: "Un mur en béton plein passe de 20 à 40 cm d’épaisseur. Le retard du pic de chaleur à l’intérieur (déphasage)…",
      opts: [
        { t: "double", ok: true },
        { t: "quadruple" },
        { t: "ne change pas : c’est le matériau qui compte" },
      ],
    },
    observe: {
      focus: ["ed"], auto: [["ld", 1.6], ["rd", 2100], ["cp", 920], ["ed", 20], ["ed", 40]],
      task: "Avec le béton de départ (λ = 1,6, ρ = 2100, c_p = 920), réglez 20 cm puis 40 cm. Suivez le déphasage Δt et l’amortissement A.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Béton de 20 cm", ok: !!m.e20 },
          { t: "Puis 40 cm", ok: !!m.e40 },
        ];
        return { items, done: !!m.e40 };
      },
      reveal: (c) => { const a = c.mem.e20 || { dt: 0, A: 0 }, b = c.mem.e40 || { dt: 0, A: 0 }; return `Δt passe de ${f(a.dt, 1)} à ${f(b.dt, 1)} h : il double. L’amortissement passe de ${f(a.A, 3)} à ${f(b.A, 3)} : il est élevé au carré, l’onde est bien plus écrasée.`; },
    },
    measure: {
      text: "a = λ/(ρc<sub>p</sub>) ; Δt = e·√(T<sub>0</sub>/(4πa)) ; A = exp(−e·√(π/(aT<sub>0</sub>))).",
      q: "Quelle grandeur du matériau règle la vitesse de l’onde dans le mur ?",
      opts: [
        { t: "La diffusivité a = λ/(ρc_p) : un matériau peu conducteur et à forte capacité ralentit l’onde", ok: true, fb: "Δt ∝ e/√a : diviser a par 4 double le déphasage, à épaisseur égale." },
        { t: "La conductivité λ seule", fb: "λ compte, mais rapportée à la capacité ρc<sub>p</sub> : c’est leur rapport qui règle l’onde." },
        { t: "La masse volumique seule : plus c’est lourd, plus ça retarde", fb: "La masse aide, mais un béton lourd conduit aussi beaucoup : c’est la diffusivité qui compte." },
      ],
    },
    plus: {
      task: "Obtenez un déphasage de plus de 10 h avec une paroi de 20 cm au plus.",
      hint: "un matériau léger, peu conducteur et à forte capacité thermique.",
      demo: [["ed", 20], ["ld", 0.05], ["rd", 200], ["cp", 2000]],
      check: (c) => c.out.dt > 10 && c.v("ed") <= 20,
      reveal: (c) => `Δt = ${f(c.out.dt, 1)} h avec a = ${c.out.a.toExponential(2).replace(".", ",")} m²/s. Une fibre de bois déphase plus qu’un béton de même épaisseur : la diffusivité compte plus que la masse.`,
    },
    diag: {
      story: "Des bureaux sous une toiture-terrasse en béton surchauffent dès 14 h : le pic extérieur arrive presque sans retard.",
      preset: { ed: 5, ld: 1.6, rd: 2100, cp: 920 },
      culprit: "ed",
      fix: ["ed", 30],
      symptom: (c) => `Déphasage Δt = ${f(c.out.dt, 1)} h ; amortissement A = ${f(c.out.A, 2)}.`,
      target: (c) => c.out.dt >= 6 && near(c.v("ld"), 1.6, 1e-9) && c.v("rd") === 2100 && c.v("cp") === 920,
      targetTxt: "Δt ≥ 6 h avec le même béton",
      now: (c) => `Δt = ${f(c.out.dt, 1)} h`,
      hint: "le matériau est imposé : que reste-t-il ?",
      explain: "Une dalle de 5 cm ne retarde l’onde que d’environ 1 h. Avec le même béton, il faut au moins 24 cm pour décaler le pic au-delà de 6 h, vers la fin de journée.",
    },
  };

  /* ---------- 06 · ITI ou ITE ---------- */
  AT.rehab = {
    compute(v, s) {
      const Riso = v("eiso") / 100 / v("liso");
      return { pos: s("pos"), Riso, U: 1 / (0.13 + Riso + 0.18 / 1.8 + 0.04), HL: v("HLr") };
    },
    record(c) {
      const m = c.mem;
      if (c.out.pos === "iti") m.iti = c.out.U;
      if (c.out.pos === "ite" && m.iti != null) m.ite = c.out.U;
    },
    predict: {
      q: "Même isolant, même épaisseur : on le déplace de l’intérieur (ITI) vers l’extérieur (ITE). Le coefficient U du mur courant…",
      opts: [
        { t: "baisse nettement" },
        { t: "ne change pas", ok: true },
        { t: "augmente" },
      ],
    },
    observe: {
      focus: ["pos"], auto: [["pos", "iti"], ["pos", "ite"]],
      task: "Comparez la position intérieure (ITI) puis extérieure (ITE) de l’isolant. Regardez U, le plancher et la place du béton dans la vue 3D.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Isolant à l’intérieur (ITI)", ok: m.iti != null },
          { t: "Puis à l’extérieur (ITE)", ok: m.ite != null },
        ];
        return { items, done: m.ite != null };
      },
      reveal: (c) => `U reste à ${f(c.mem.ite || 0, 3)} W/(m²·K) : en série, l’ordre des couches ne change pas la somme des résistances. Ce qui change se voit dans la 3D : en ITI, le plancher traverse l’isolant et le béton reste côté froid.`,
    },
    measure: {
      text: "En série, R<sub>tot</sub> = R<sub>si</sub> + R<sub>iso</sub> + R<sub>béton</sub> + R<sub>se</sub> : l’ordre n’intervient pas. Les ponts (H<sub>L</sub>) et l’inertie, si.",
      q: "Alors pourquoi préfère-t-on souvent l’ITE ?",
      opts: [
        { t: "Elle traite les ponts de plancher et laisse la masse du béton côté intérieur, utile en été", ok: true, fb: "L’isolant continu enveloppe les jonctions (H<sub>L</sub> réduit) et le béton, côté chaud, amortit les surchauffes." },
        { t: "Elle donne un U plus faible", fb: "Le U du mur courant est le même ; l’avantage est ailleurs." },
        { t: "Elle évite de calculer les ponts thermiques", fb: "On les calcule toujours ; ils sont simplement plus faibles." },
      ],
    },
    plus: {
      task: "En ITE, composez une paroi à U ≤ 0,20 W/(m²·K) avec des ponts résiduels d’au plus 5 W/K.",
      hint: "épaisseur d’isolant et continuité de l’enveloppe.",
      demo: [["pos", "ite"], ["eiso", 20], ["HLr", 4]],
      check: (c) => c.out.pos === "ite" && c.out.U <= 0.2 && c.out.HL <= 5,
      reveal: (c) => `U = ${f(c.out.U, 3)} W/(m²·K) et H<sub>L</sub> = ${f(c.out.HL, 1)} W/K : une enveloppe performante en partie courante et aux jonctions.`,
    },
    diag: {
      story: "Après une isolation par l’intérieur soignée (U ≈ 0,24), la facture baisse moins que prévu et des traces noires apparaissent au droit des planchers.",
      preset: { pos: "iti", eiso: 14, liso: 0.036, HLr: 30 },
      culprit: "HLr",
      fix: ["HLr", 5],
      symptom: (c) => `U = ${f(c.out.U, 3)} W/(m²·K), mais ponts résiduels H<sub>L</sub> = ${f(c.out.HL, 1)} W/K.`,
      target: (c) => c.out.HL <= 8 && c.v("eiso") === 14 && near(c.v("liso"), 0.036, 1e-9),
      targetTxt: "H<sub>L</sub> ≤ 8 W/K, isolant inchangé",
      now: (c) => `H<sub>L</sub> = ${f(c.out.HL, 1)} W/K`,
      hint: "le mur courant est bon : regardez les jonctions.",
      explain: "Les ponts de plancher (30 W/K) concentrent les pertes et refroidissent la surface : rupteurs, retour d’isolant ou passage en ITE les ramènent sous 8 W/K.",
    },
  };

  const B = (id, icon, name, desc, how, check) => ({ id, icon, name, desc, how, check });
  const IDS = ["cond", "surf", "bilan", "glaser", "dyn", "rehab"];
  const BADGES = [
    B("serie", "R", "Résistances en série", "Doubler l’isolant, c’est presque diviser le flux par 2.", "Terminer l’observation de l’atelier 01.", (x) => !!x.A("cond").obsDone),
    B("main-froide", "Tsi", "Paroi froide", "La surface intérieure trahit un mur mal isolé.", "Terminer l’observation de l’atelier 02.", (x) => !!x.A("surf").obsDone),
    B("jonctions", "ψ", "Jonctions", "Les ponts au-delà de 30 % des pertes.", "Le piège de l’atelier 03.", (x) => !!x.A("bilan").plusDone),
    B("pare-vapeur", "PV", "Pare-vapeur", "Le croisement de Glaser supprimé.", "Terminer l’observation de l’atelier 04.", (x) => !!x.A("glaser").obsDone),
    B("diffusivite", "a", "Diffusivité", "Plus de 10 h de déphasage sur 20 cm.", "Le piège de l’atelier 05.", (x) => !!x.A("dyn").plusDone),
    B("enveloppe", "ITE", "Enveloppe continue", "Une paroi performante en partie courante et aux jonctions.", "Le piège de l’atelier 06.", (x) => !!x.A("rehab").plusDone),
    B("pressentiment", "P", "Bon pressentiment", "Quatre prédictions justes.", "Quatre prédictions justes à l’étape 1.", (x) => Object.values(x.store.at).filter((a) => a.predOk).length >= 4),
    B("lucidite", "?", "Lucidité", "Sûr·e de vous et pourtant détrompé·e, puis l’explication trouvée.", "Se tromper avec assurance, puis valider l’explication.", (x) => Object.values(x.store.at).some((a) => a.pred != null && !a.predOk && a.conf === "Sûr·e" && a.explOk)),
    B("diagnostiqueur", "D", "Diagnostiqueur", "Trois parois remises en état en mode diagnostic.", "Réussir trois diagnostics.", (x) => (x.store.nDiag || 0) >= 3),
    B("complet", "6", "Parcours complet", "Les six ateliers parcourus jusqu’au diagnostic.", "Terminer les six parcours.", (x) => IDS.every((k) => x.A(k).diagDone)),
  ];

  window.LABV3_PARCOURS = {
    storeKey: "r29_parcours", ateliers: AT, badges: BADGES, bilanHost: "defi",
    // graphes 2D qui portent une information absente de la 3D
    keep2d: { cond: true, bilan: ["cv-dju"], glaser: true, dyn: true },
  };
})();
