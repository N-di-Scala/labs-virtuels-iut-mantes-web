/* =====================================================================
   R1-1 · parcours pédagogiques (mission Gymnase de Clairmont)
   Chaque atelier : predict (POÉ), observe (tâche détectée), measure (explication),
   plus (le piège), diag (cas pathologique). Données génériques : aucune valeur du dossier noté.
   Les champs demo (plus) et fix (diag) servent aux tests automatiques.
   Ici, la grille 2D est le tableur lui-même : elle reste affichée à côté de la 3D.
   ===================================================================== */
(() => {
  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { maximumFractionDigits: n, minimumFractionDigits: n });
  const eur = (x) => f(x, 2) + " €";
  const near = (x, a, tol) => Math.abs(x - a) <= tol;
  const AT = {};

  /* ---------- 01 · Références relatives et absolues ---------- */
  AT.refs = {
    compute: (v, s) => ({ n: v("nCopies"), abs: s("lockAbs") === "abs" }),
    record(c) {
      const m = c.mem;
      if (!c.out.abs && c.out.n >= 5) m.rel = true;
      if (c.out.abs && c.out.n >= 5 && m.rel) m.abs = true;
    },
    predict: {
      q: "En ligne 1, une formule lit le prix unique saisi en B1. On la recopie vers le bas sans symbole $. À la ligne 4, la copie lit le prix…",
      opts: [
        { t: "en B1, comme en C2" },
        { t: "en B4, une cellule vide", ok: true },
        { t: "nulle part : le tableur affiche une erreur" },
      ],
    },
    observe: {
      focus: ["lockAbs", "nCopies"], auto: [["lockAbs", "rel"], ["nCopies", 5], ["lockAbs", "abs"]],
      task: "En référence relative, recopiez la formule sur au moins 5 lignes et suivez les flèches. Puis passez en référence absolue.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Relatif, 5 copies ou plus", ok: !!m.rel },
          { t: "Puis absolu, mêmes copies", ok: !!m.abs },
        ];
        return { items, done: !!m.abs };
      },
      reveal: () => "En relatif, chaque copie descend d’une ligne : B2, B3, B4… des cellules vides, donc des montants à zéro. En absolu, toutes les flèches restent sur $B$1 : le prix unique est lu partout.",
    },
    measure: {
      text: "Une référence relative (B1) se décale avec la recopie ; une référence absolue ($B$1) reste fixe.",
      q: "Que verrouille exactement le symbole $ dans $B$1 ?",
      opts: [
        { t: "La colonne ($B) et la ligne ($1) : la recopie ne les décale plus", ok: true, fb: "Chaque $ fige la partie qui le suit. B$1 ne figerait que la ligne, $B1 que la colonne : ce sont les références mixtes." },
        { t: "La valeur de la cellule, qui ne peut plus être modifiée", fb: "B1 reste modifiable ; c’est l’adresse lue par la formule qui est figée." },
        { t: "Le format monétaire de la cellule", fb: "Le $ n’a rien à voir avec la devise." },
      ],
    },
    plus: {
      task: "Recopiez la formule sur les 6 lignes du tableau de sorte que toutes lisent le prix unique.",
      hint: "le nombre de copies au maximum, et la bonne référence.",
      demo: [["lockAbs", "abs"], ["nCopies", 6]],
      check: (c) => c.out.abs && c.out.n === 6,
      reveal: () => "Six lignes, une seule ancre : si le prix change, une seule cellule à modifier. Dans une formule « quantité × prix », on mélange les deux : quantité relative (A2), prix absolu ($B$1).",
    },
    diag: {
      story: "Dans le devis du gymnase, seule la première ligne a un montant : toutes les autres affichent 0 €.",
      preset: { nCopies: 4, lockAbs: "rel" },
      culprit: "lockAbs",
      fix: ["lockAbs", "abs"],
      symptom: (c) => `${c.out.n} lignes recopiées : leurs montants sont nuls, seule la ligne d’origine est juste.`,
      target: (c) => c.out.abs,
      targetTxt: "toutes les lignes lisent le prix unique",
      now: (c) => (c.out.abs ? "ancre verrouillée" : "référence relative"),
      hint: "où pointent les flèches des lignes du bas ?",
      explain: "La formule utilisait B1 en relatif : la recopie la faisait glisser vers des cellules vides. Avec $B$1, toutes les lignes lisent le même prix.",
    },
  };

  /* ---------- 02 · Unités ---------- */
  AT.unites = {
    compute: (v, s) => ({ L: v("lenM"), mix: s("mixTrap") === "mix", tot: s("mixTrap") === "mix" ? v("lenM") + 800 : v("lenM") + 0.8 }),
    record(c) {
      const m = c.mem;
      if (!c.out.mix) m.ok = c.out.tot;
      if (c.out.mix && m.ok != null) m.mix = c.out.tot;
    },
    predict: {
      q: "Une colonne contient 2,40 (en mètres) et 800 (en millimètres). Le tableur additionne les deux cellules. Il affiche…",
      opts: [
        { t: "3,20" },
        { t: "802,40", ok: true },
        { t: "une erreur d’unités" },
      ],
    },
    observe: {
      focus: ["mixTrap"], auto: [["mixTrap", "ok"], ["mixTrap", "mix"]],
      task: "Comparez l’addition correcte (tout en mètres) puis l’addition « piège » (mètres et millimètres mélangés).",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Addition convertie", ok: m.ok != null },
          { t: "Puis addition mélangée", ok: m.mix != null },
        ];
        return { items, done: m.mix != null };
      },
      reveal: (c) => `Correct : ${f(c.mem.ok || 0, 2)} m. Mélangé : ${f(c.mem.mix || 0, 2)}, sans aucun message d’alerte. Le tableur additionne des nombres, pas des grandeurs.`,
    },
    measure: {
      text: "Une colonne = une unité, écrite dans l’en-tête. On convertit (× 1 000, ÷ 1 000) avant de calculer.",
      q: "Pourquoi le tableur ne signale-t-il aucune erreur ?",
      opts: [
        { t: "Il ne connaît pas les unités : 2,4 + 800 est un calcul valide pour lui", ok: true, fb: "La cohérence des unités est de votre responsabilité : en-têtes explicites, conversion avant toute opération." },
        { t: "Il convertit automatiquement les millimètres", fb: "Aucun tableur ne déduit l’unité d’un nombre." },
        { t: "Le résultat est juste, mais affiché en millimètres", fb: "802,4 n’est juste dans aucune unité : 2 400 + 800 = 3 200 mm." },
      ],
    },
    plus: {
      task: "Réglez une longueur de 4,00 m et faites l’addition correctement : le total doit valoir 4,80 m.",
      hint: "addition convertie, longueur au bon pas du curseur.",
      demo: [["mixTrap", "ok"], ["lenM", 4]],
      check: (c) => !c.out.mix && near(c.out.L, 4, 1e-9),
      reveal: () => "4,00 + 0,80 = 4,80 m. Une vérification d’ordre de grandeur (deux tronçons de quelques mètres font quelques mètres) suffit à repérer le piège.",
    },
    diag: {
      story: "Le métré total de deux tronçons de bordure affiche 802,40 m pour un couloir de gymnase.",
      preset: { lenM: 2.4, mixTrap: "mix" },
      culprit: "mixTrap",
      fix: ["mixTrap", "ok"],
      symptom: (c) => `Total affiché : ${f(c.out.tot, 2)}.`,
      target: (c) => !c.out.mix,
      targetTxt: "un total cohérent, en mètres",
      now: (c) => `total ${f(c.out.tot, 2)}`,
      hint: "deux tronçons courts ne font pas 800 m.",
      explain: "Le second tronçon était saisi en millimètres (800) et ajouté à des mètres. Converti (0,80 m), le total revient à 3,20 m.",
    },
  };

  /* ---------- 03 · Logique SI ---------- */
  const paie = (h, t) => Math.min(h, 40) * t + Math.max(0, h - 40) * t * 1.25;
  AT.logique = {
    compute: (v) => ({ h: v("heures"), t: v("tauxH"), tot: paie(v("heures"), v("tauxH")) }),
    record(c) {
      const m = c.mem;
      if (near(c.out.t, 12.4, 1e-9)) {
        if (c.out.h === 40) m.a = c.out.tot;
        if (c.out.h === 44 && m.a) m.b = c.out.tot;
      }
    },
    predict: {
      q: "Une semaine de 44 h à 12,40 €/h, avec +25 % au-delà de 40 h. Le montant vaut…",
      opts: [
        { t: "682,00 € (tout est majoré)" },
        { t: "558,00 €", ok: true },
        { t: "545,60 € (rien n’est majoré)" },
      ],
    },
    observe: {
      focus: ["heures"], auto: [["tauxH", 12.4], ["heures", 40], ["heures", 44]],
      task: "À 12,40 €/h, réglez 40 h puis 44 h. Regardez quelle branche du SI s’allume et le montant.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "40 h (seuil)", ok: !!m.a },
          { t: "Puis 44 h", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `${eur(c.mem.a || 0)} à 40 h, ${eur(c.mem.b || 0)} à 44 h : les 4 heures en plus valent 15,50 € chacune. Seules les heures au-delà du seuil sont majorées.`,
    },
    measure: {
      text: "=SI(h>40 ; 40*t + (h−40)*t*1,25 ; h*t)",
      q: "Pourquoi le SI ne multiplie-t-il pas toute la semaine par 1,25 ?",
      opts: [
        { t: "La règle de gestion ne majore que les heures au-dessus du seuil : la branche « vrai » sépare les deux parts", ok: true, fb: "40 h au tarif simple (496 €) + 4 h majorées (62 €) = 558 €. Multiplier tout par 1,25 paierait 124 € de trop." },
        { t: "Le tableur plafonne la majoration", fb: "Le tableur applique exactement ce qu’on lui écrit : c’est la formule qui traduit la règle." },
        { t: "La majoration ne s’applique qu’au-delà de 44 h", fb: "Le seuil est de 40 h ici." },
      ],
    },
    plus: {
      task: "À 12,40 €/h, trouvez le plus petit nombre d’heures dont le montant dépasse 600 €.",
      hint: "chaque heure au-delà de 40 h vaut 15,50 €.",
      demo: [["tauxH", 12.4], ["heures", 47]],
      check: (c) => near(c.out.t, 12.4, 1e-9) && c.out.tot > 600 && c.out.h <= 47,
      reveal: (c) => `${c.out.h} h donnent ${eur(c.out.tot)}. À 46 h, on reste à 589 € : les heures majorées s’additionnent une à une.`,
    },
    diag: {
      story: "Une fiche de paie pour une semaine de 36 h affiche 558,00 € au lieu de 446,40 €.",
      preset: { heures: 44, tauxH: 12.4 },
      culprit: "heures",
      fix: ["heures", 36],
      symptom: (c) => `Montant : ${eur(c.out.tot)} pour un tarif de ${eur(c.out.t)}/h.`,
      target: (c) => near(c.out.tot, 446.4, 0.01),
      targetTxt: "le montant de la semaine de 36 h (446,40 €)",
      now: (c) => eur(c.out.tot),
      hint: "le tarif est le bon ; la donnée d’entrée ?",
      explain: "Les heures saisies (44 h) n’étaient pas celles de la semaine (36 h) : la formule était juste, la donnée fausse. Toujours vérifier les entrées avant la formule.",
    },
  };

  /* ---------- 04 · HT, TVA, TTC ---------- */
  AT.tva = {
    compute(v) {
      const ht = v("ht"), t = v("tauxTva") / 100;
      return { ht, t, tva: ht * t, ttc: ht * (1 + t) };
    },
    record(c) {
      const m = c.mem;
      if (near(c.out.ht, 12.4, 1e-9)) {
        if (near(c.out.t, 0.06, 1e-9)) m.a = c.out.ttc;
        if (near(c.out.t, 0.12, 1e-9) && m.a) m.b = c.out.ttc;
      }
    },
    predict: {
      q: "Une ligne à 12,40 € HT. Le taux de TVA passe de 6 % à 12 %. Le montant TTC…",
      opts: [
        { t: "double" },
        { t: "augmente d’environ 6 %", ok: true },
        { t: "ne change pas : le HT est le même" },
      ],
    },
    observe: {
      focus: ["tauxTva"], auto: [["ht", 12.4], ["tauxTva", 6], ["tauxTva", 12]],
      task: "À 12,40 € HT, réglez le taux à 6 % puis à 12 %. Comparez la TVA et le TTC.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Taux de 6 %", ok: !!m.a },
          { t: "Puis 12 %", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `TTC : ${eur(c.mem.a || 0)}, puis ${eur(c.mem.b || 0)}. La TVA a doublé, mais elle reste une petite part du TTC.`,
    },
    measure: {
      text: "TVA = HT × t ; TTC = HT × (1 + t). Le taux vit dans une seule cellule, en référence absolue.",
      q: "Pourquoi le TTC n’a-t-il pas doublé ?",
      opts: [
        { t: "Seule la TVA double ; le HT, qui fait l’essentiel du TTC, ne bouge pas", ok: true, fb: "TTC = HT × (1 + t) : passer de 1,06 à 1,12 multiplie le TTC par 1,057." },
        { t: "Le tableur arrondit la TVA", fb: "L’arrondi ne joue qu’au centime." },
        { t: "La TVA est plafonnée", fb: "Le calcul est proportionnel, sans plafond." },
      ],
    },
    plus: {
      task: "Au taux de 8,5 %, trouvez le montant HT qui donne 40,00 € TTC (à 5 centimes près).",
      hint: "HT = TTC/(1 + t) : on divise, on ne retranche pas 8,5 %.",
      demo: [["tauxTva", 8.5], ["ht", 36.9]],
      check: (c) => near(c.out.t, 0.085, 1e-9) && near(c.out.ttc, 40, 0.05),
      reveal: (c) => `${eur(c.out.ht)} HT donnent ${eur(c.out.ttc)} TTC. Retrancher 8,5 % de 40 € donnerait 36,60 € : l’erreur classique du « pourcentage à l’envers ».`,
    },
    diag: {
      story: "Une facture affiche 1,49 € de TVA sur une ligne à 12,40 € HT, alors que le taux de la commande est de 8,5 %.",
      preset: { ht: 12.4, tauxTva: 12 },
      culprit: "tauxTva",
      fix: ["tauxTva", 8.5],
      symptom: (c) => `TVA ${eur(c.out.tva)} ; TTC ${eur(c.out.ttc)}.`,
      target: (c) => near(c.out.ht, 12.4, 1e-9) && near(c.out.t, 0.085, 1e-9),
      targetTxt: "la TVA au taux de la commande, même HT",
      now: (c) => `taux ${f(c.out.t * 100, 1)} %`,
      hint: "1,49/12,40 = ?",
      explain: "La cellule du taux contenait 12 % au lieu de 8,5 %. Avec un taux unique en référence absolue, une seule correction rectifie toute la facture.",
    },
  };

  /* ---------- 05 · Synthèse SOMME.SI ---------- */
  const POSTES = [["Peinture", 12.4], ["Quincaillerie", 28.5], ["Signalétique", 18.9]];
  AT.synthese = {
    compute(v) {
      const k = 1 + v("infl") / 100, fp = v("filtrePoste");
      const vals = POSTES.map((p) => p[1] * k);
      return { fp, tot: vals.reduce((a, x, i) => a + (fp === 0 || fp === i + 1 ? x : 0), 0) };
    },
    record(c) {
      const m = c.mem;
      if (c.out.fp === 0) m.a = c.out.tot;
      if (c.out.fp === 2 && m.a) m.b = c.out.tot;
    },
    predict: {
      q: "=SOMME.SI(poste ; \"Quincaillerie\" ; montant). Cette formule additionne…",
      opts: [
        { t: "les montants des lignes dont le poste est « Quincaillerie »", ok: true },
        { t: "tous les montants, puis affiche le poste Quincaillerie" },
        { t: "le nombre de lignes « Quincaillerie »" },
      ],
    },
    observe: {
      focus: ["filtrePoste"], auto: [["filtrePoste", "0"], ["filtrePoste", "2"]],
      task: "Affichez la somme de tous les postes, puis filtrez sur « Quincaillerie ».",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Tous les postes", ok: !!m.a },
          { t: "Puis la seule Quincaillerie", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Total : ${eur(c.mem.a || 0)} ; Quincaillerie seule : ${eur(c.mem.b || 0)}. Le critère porte sur une colonne, la somme sur une autre.`,
    },
    measure: {
      text: "SOMME.SI(plage_critère ; critère ; plage_à_sommer)",
      q: "Quel est le rôle de chacune des deux plages ?",
      opts: [
        { t: "L’une sert à tester le critère (les noms de postes), l’autre fournit les valeurs additionnées (les montants)", ok: true, fb: "Les deux plages doivent avoir la même hauteur : la ligne i du critère décide si la ligne i des montants entre dans la somme." },
        { t: "La première est additionnée, la seconde est triée", fb: "SOMME.SI ne trie rien : elle filtre puis additionne." },
        { t: "Les deux plages sont additionnées ensemble", fb: "Une seule plage est additionnée : celle des montants." },
      ],
    },
    plus: {
      task: "Avec une inflation de 8 %, affichez le total du seul poste Signalétique.",
      hint: "deux réglages : la sensibilité et le critère.",
      demo: [["infl", 8], ["filtrePoste", "3"]],
      check: (c) => near(c.v("infl"), 8, 1e-9) && c.out.fp === 3,
      reveal: (c) => `${eur(c.out.tot)} : 18,90 € × 1,08. L’inflation est une cellule de paramètre ; tout le tableau la lit en référence absolue.`,
    },
    diag: {
      story: "La synthèse remise au chef de chantier annonce 62,19 € de quincaillerie, plus que le budget de tout le lot.",
      preset: { infl: 4, filtrePoste: "0" },
      culprit: "filtrePoste",
      fix: ["filtrePoste", "2"],
      symptom: (c) => `Montant affiché pour « Quincaillerie » : ${eur(c.out.tot)}.`,
      target: (c) => c.out.fp === 2,
      targetTxt: "la somme filtrée sur le seul poste Quincaillerie",
      now: (c) => eur(c.out.tot),
      hint: "le montant affiché est-il filtré ?",
      explain: "Aucun critère n’était appliqué : la cellule additionnait les trois postes. Filtrée sur « Quincaillerie », elle donne 29,64 €.",
    },
  };

  /* ---------- 06 · Graphiques ---------- */
  AT.graphiques = {
    compute(v, s) {
      const amp = v("amp"), zoom = s("zoomAxe") === "1", d = [98, 100, 100 + amp];
      const ymin = zoom ? Math.min(...d) - 2 : 0;
      return { amp, zoom, rel: (d[2] - d[0]) / d[0] * 100, vis: (d[2] - ymin) / (d[0] - ymin) };
    },
    record(c) {
      const m = c.mem;
      if (near(c.out.amp, 1, 1e-9)) {
        if (!c.out.zoom) m.a = c.out.vis;
        if (c.out.zoom && m.a) m.b = c.out.vis;
      }
    },
    predict: {
      q: "Semaine 1 : 98 € ; semaine 3 : 101 € (+3 %). Si l’axe vertical commence à 96 €, la barre de la semaine 3 paraît…",
      opts: [
        { t: "3 % plus haute" },
        { t: "plus de deux fois plus haute", ok: true },
        { t: "de même hauteur" },
      ],
    },
    observe: {
      focus: ["zoomAxe", "amp"], auto: [["amp", 1], ["zoomAxe", "0"], ["zoomAxe", "1"]],
      task: "Réglez l’amplitude à +1 € (101 € en semaine 3). Comparez l’axe partant de zéro puis l’axe « zoomé ».",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Axe depuis zéro", ok: !!m.a },
          { t: "Puis axe zoomé", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: (c) => `Même série, +3 % réels. Rapport des hauteurs de barres : ${f(c.mem.a || 0, 2)} avec l’axe à zéro, ${f(c.mem.b || 0, 2)} avec l’axe zoomé.`,
    },
    measure: {
      text: "Dans un diagramme en barres, la hauteur doit être proportionnelle à la valeur : l’axe part de zéro.",
      q: "Pourquoi l’axe tronqué trompe-t-il le lecteur ?",
      opts: [
        { t: "La hauteur ne représente plus la valeur, mais l’écart au bas de l’axe", ok: true, fb: "Avec un axe à 96 €, les barres mesurent 2 et 5 unités : +150 % visuels pour +3 % réels." },
        { t: "Le tableur arrondit les valeurs", fb: "Les valeurs sont exactes ; c’est leur représentation qui change." },
        { t: "Le zoom ajoute des données", fb: "Aucune donnée n’est ajoutée ni retirée." },
      ],
    },
    plus: {
      task: "Axe partant de zéro : trouvez la plus petite amplitude pour que la semaine 3 dépasse la semaine 1 d’au moins 10 %.",
      hint: "(100 + amplitude)/98 ≥ 1,10.",
      demo: [["zoomAxe", "0"], ["amp", 8]],
      check: (c) => !c.out.zoom && c.out.rel >= 10 && c.out.amp <= 8,
      reveal: (c) => `+${f(c.out.rel, 1)} % avec ${c.out.amp} € d’amplitude : un écart réel se voit sur un axe honnête, sans avoir besoin de zoomer.`,
    },
    diag: {
      story: "Un rapport de suivi présente une « envolée » des coûts en semaine 3. Les chiffres montrent pourtant +2 % seulement.",
      preset: { amp: 0, zoomAxe: "1" },
      culprit: "zoomAxe",
      fix: ["zoomAxe", "0"],
      symptom: (c) => `Hausse réelle : +${f(c.out.rel, 1)} % ; rapport des hauteurs affichées : ${f(c.out.vis, 2)}.`,
      target: (c) => !c.out.zoom,
      targetTxt: "un graphique dont l’axe part de zéro",
      now: (c) => (c.out.zoom ? "axe zoomé" : "axe depuis zéro"),
      hint: "où commence l’axe vertical ?",
      explain: "L’axe partait juste sous la plus petite valeur : +2 % paraissait doubler. Avec l’axe à zéro, les barres retrouvent des hauteurs proportionnelles.",
    },
  };

  /* ---------- 07 · Qualité du classeur ---------- */
  AT.qualite = {
    compute: (v, s) => ({ k: v("cle"), wrap: s("wrapErr") === "1", prot: s("prot") === "1", hit: v("cle") <= 3 }),
    record(c) {
      const m = c.mem;
      if (c.out.k === 4 && !c.out.wrap) m.a = true;
      if (c.out.k === 4 && c.out.wrap && m.a) m.b = true;
    },
    predict: {
      q: "Une recherche (RECHERCHEV) porte sur un code absent de la table. Sans traitement, la cellule affiche…",
      opts: [
        { t: "0" },
        { t: "une erreur brute (#N/A)", ok: true },
        { t: "une cellule vide" },
      ],
    },
    observe: {
      focus: ["cle", "wrapErr"], auto: [["wrapErr", "0"], ["cle", 4], ["wrapErr", "1"]],
      task: "Cherchez la clé 4 (absente de la table) sans traitement d’erreur, puis encadrez la recherche.",
      check(c) {
        const m = c.mem;
        const items = [
          { t: "Clé absente, erreur brute", ok: !!m.a },
          { t: "Puis recherche encadrée", ok: !!m.b },
        ];
        return { items, done: !!m.b };
      },
      reveal: () => "Sans traitement, l’erreur brute s’affiche et contamine toute somme qui l’utilise. Encadrée, la cellule affiche un message explicite : le problème reste visible, mais il ne casse plus le classeur.",
    },
    measure: {
      text: "=SIERREUR(RECHERCHEV(…) ; \"Non trouvé\") : un message explicite plutôt qu’une erreur brute ou un zéro silencieux.",
      q: "Pourquoi afficher « Non trouvé » plutôt que 0 ?",
      opts: [
        { t: "Un zéro passerait inaperçu dans les sommes ; le message garde l’anomalie visible sans casser les calculs", ok: true, fb: "Vide, zéro et « introuvable » sont trois informations différentes : un classeur fiable ne les confond pas." },
        { t: "Le tableur refuse d’afficher 0", fb: "Il l’accepterait : c’est un choix de qualité de ne pas le faire." },
        { t: "Pour que le total soit plus élevé", fb: "Le texte n’entre pas dans les sommes ; il ne change pas le total des lignes valides." },
      ],
    },
    plus: {
      task: "Préparez le classeur pour un collègue : erreurs encadrées et cellules de formule protégées.",
      hint: "deux réglages de qualité.",
      demo: [["wrapErr", "1"], ["prot", "1"]],
      check: (c) => c.out.wrap && c.out.prot,
      reveal: () => "Erreurs encadrées et formules protégées : un utilisateur peut saisir ses données sans écraser un calcul par mégarde.",
    },
    diag: {
      story: "Le total du stock affiche une erreur depuis qu’une ligne cherche un code qui n’existe pas dans la table.",
      preset: { cle: 4, wrapErr: "0", prot: "1" },
      culprit: "wrapErr",
      fix: ["wrapErr", "1"],
      symptom: (c) => (c.out.wrap ? "Message explicite affiché." : "La recherche renvoie une erreur brute, propagée au total."),
      target: (c) => c.out.wrap && c.out.k === 4,
      targetTxt: "un message explicite, même clé cherchée",
      now: (c) => (c.out.wrap ? "erreur encadrée" : "erreur brute"),
      hint: "on ne change pas la clé cherchée : on traite le cas où elle manque.",
      explain: "La recherche n’était pas encadrée : une clé absente produisait une erreur brute qui se propageait. Avec SIERREUR, l’anomalie reste signalée sans bloquer les calculs.",
    },
  };

  const B = (id, icon, name, desc, how, check) => ({ id, icon, name, desc, how, check });
  const IDS = ["refs", "unites", "logique", "tva", "synthese", "graphiques", "qualite"];
  const BADGES = [
    B("ancre", "$", "Ancre", "Une référence absolue bien posée.", "Terminer l’observation de l’atelier 01.", (x) => !!x.A("refs").obsDone),
    B("unites", "mm", "Unités", "Le piège des millimètres repéré.", "Terminer l’observation de l’atelier 02.", (x) => !!x.A("unites").obsDone),
    B("seuil", "SI", "Seuil", "Seules les heures au-delà du seuil sont majorées.", "Le piège de l’atelier 03.", (x) => !!x.A("logique").plusDone),
    B("ttc", "%", "À l’endroit", "Retrouver le HT à partir du TTC.", "Le piège de l’atelier 04.", (x) => !!x.A("tva").plusDone),
    B("critere", "Σ", "Critère", "Filtrer sur une colonne, sommer une autre.", "Terminer l’observation de l’atelier 05.", (x) => !!x.A("synthese").obsDone),
    B("axe-zero", "0", "Axe honnête", "Le zoom qui dramatise démasqué.", "Terminer l’observation de l’atelier 06.", (x) => !!x.A("graphiques").obsDone),
    B("qualite", "✓", "Classeur propre", "Erreurs encadrées, formules protégées.", "Le piège de l’atelier 07.", (x) => !!x.A("qualite").plusDone),
    B("pressentiment", "P", "Bon pressentiment", "Cinq prédictions justes.", "Cinq prédictions justes à l’étape 1.", (x) => Object.values(x.store.at).filter((a) => a.predOk).length >= 5),
    B("lucidite", "?", "Lucidité", "Sûr·e de vous et pourtant détrompé·e, puis l’explication trouvée.", "Se tromper avec assurance, puis valider l’explication.", (x) => Object.values(x.store.at).some((a) => a.pred != null && !a.predOk && a.conf === "Sûr·e" && a.explOk)),
    B("diagnostiqueur", "D", "Diagnostiqueur", "Trois classeurs réparés en mode diagnostic.", "Réussir trois diagnostics.", (x) => (x.store.nDiag || 0) >= 3),
    B("complet", "7", "Parcours complet", "Les sept ateliers parcourus jusqu’au diagnostic.", "Terminer les sept parcours.", (x) => IDS.every((k) => x.A(k).diagDone)),
  ];

  window.LABV3_PARCOURS = {
    storeKey: "r11_parcours", ateliers: AT, badges: BADGES, bilanHost: "defi",
    // la grille 2D est le tableur lui-même : elle reste affichée dans tous les ateliers
    keep2d: { refs: true, unites: true, logique: true, tva: true, synthese: true, graphiques: true, qualite: true },
  };
})();
