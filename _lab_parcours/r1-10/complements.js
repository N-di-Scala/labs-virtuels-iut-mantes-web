/* R1-10 · compléments pédagogiques (structure décrite dans r1-1/complements.js) */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });
  const C = {};

  C.debit = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [["Q", 8], ["D", 100]], fix: ["D", 100],
    duree: 12,
    m: ["La viscosité de l’eau augmente dans un gros tuyau, ce qui freine les tourbillons", "Le débit diminue quand le diamètre augmente, et Re suit le débit"],
    crit: ["À débit fixé, la vitesse varie comme 1/D²", "Re = vD/ν varie donc comme 1/D", "Doubler le diamètre divise Re par 2 : l’écoulement se calme"],
    variante: "On fait passer le même débit dans une conduite dont le diamètre est doublé (de 100 à 200 mm). L’écoulement devient-il plus ou moins turbulent ?",
    transfert: Q("Une gaine de ventilation transporte toujours le même débit d’air, mais on réduit son diamètre de moitié. Le nombre de Reynolds…",
      ok("double", "Vitesse × 4, diamètre ÷ 2 : Re = vD/ν double."),
      no("est divisé par 2", "C’est l’effet inverse : un diamètre plus petit accélère l’air."),
      no("ne change pas, car le débit est le même", "Le débit est le même, mais la vitesse ne l’est pas.")),
  };
  C.fluide = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [["rho", 1200], ["mu", 1]], fix: ["rho", 1100],
    duree: 12,
    m: ["μ seule, car c’est la viscosité dynamique qui freine le fluide contre les parois", "ρ seule, car c’est la masse volumique qui fait couler ou flotter un corps"],
    crit: ["La flottaison dépend de la masse volumique (d = ρ/ρ<sub>eau</sub>)", "Le régime d’écoulement dépend de Re = vD/ν", "ν = μ/ρ réunit viscosité et masse volumique"],
    variante: "On rend le liquide beaucoup plus visqueux avec un additif, sans changer sa masse volumique. Un cube aussi dense que l’eau, plongé dans ce liquide…",
    transfert: Q("Une huile est plus visqueuse que l’eau mais moins dense. Un objet qui flotte tout juste dans l’eau, posé dans cette huile…",
      ok("coule", "La flottaison ne dépend que des masses volumiques : l’huile, moins dense, porte moins."),
      no("flotte mieux, car l’huile est épaisse", "La viscosité freine le mouvement, elle ne porte pas l’objet."),
      no("reste à mi-hauteur", "Seule l’égalité des masses volumiques donnerait cet équilibre.")),
  };
  C.hydro = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [{ act: "En écoulement" }], fix: ["PA", 4.5],
    duree: 10,
    okT: "Une colonne d’eau de 10 m exerce ρgh ≈ 98 000 Pa, soit environ 1 bar",
    m: ["La pression baisse de 10 % à chaque mètre de dénivelé gagné", "Un bar vaut exactement 10 m de colonne, quel que soit le fluide"],
    crit: ["Au repos, la pression diminue de ρgh quand on monte", "Pour l’eau, 10 m font environ 98 000 Pa", "98 000 Pa, c’est environ 1 bar"],
    variante: "Au repos, le point B est 10 m au-dessus du point A, sur la même conduite. Par rapport à A, la pression en B est…",
    transfert: Q("Au pied d’un immeuble, la pression de l’eau vaut 4 bar. Au 6e étage, 18 m plus haut, elle vaut environ…",
      ok("2,2 bar", "18 m de dénivelé coûtent environ 1,8 bar."),
      no("4 bar, car c’est le même réseau", "La pression baisse quand on monte, même dans le même réseau."),
      no("0,4 bar", "C’est diviser par 10 au lieu de retrancher ρgh.")),
  };
  C.bernoulli = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [{ act: "Venturi" }, ["Pbern", 0.5], ["vbern", 4]], fix: ["zbern", 10],
    duree: 12,
    okT: "La charge totale se conserve : si la charge de vitesse augmente, celle de pression diminue",
    m: ["Le col freine l’eau, qui y perd une partie de son énergie par frottement", "L’eau se dilate en passant dans le col, ce qui fait chuter sa pression"],
    crit: ["Sans frottement, la charge totale se conserve", "Au col, la vitesse augmente, donc la charge de vitesse v²/(2g) aussi", "La charge de pression diminue d’autant"],
    variante: "L’eau traverse un rétrécissement de la conduite (un Venturi) et y accélère. Au col, la pression de l’eau…",
    transfert: Q("Dans une lance d’incendie, l’eau sort à grande vitesse par la buse. Juste avant la sortie, dans la buse, la pression est…",
      ok("plus faible qu’en amont, dans le tuyau", "La vitesse augmente dans la buse : la charge de pression diminue."),
      no("plus forte, car l’eau est comprimée", "L’eau est quasi incompressible : c’est la vitesse qui change."),
      no("égale à celle du tuyau", "La charge totale se conserve, pas la pression seule.")),
  };
  C.lineaire = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [["linMode", "Q"], ["eps", "1.0"], ["Dlin", 50], ["Qlin", 40]], fix: ["Dlin", 125],
    duree: 15,
    okT: "Vitesse × 4 donc v² × 16, et L/D doublé : 16 × 2 = 32",
    m: ["La rugosité relative double, et λ est multiplié par 32 dans le diagramme", "La section est divisée par 4 et le périmètre par 2 : 4 × 4 × 2 = 32"],
    crit: ["À débit imposé, diviser D par 2 multiplie la vitesse par 4", "Les pertes suivent v² : facteur 16", "Le terme L/D double : 16 × 2 = 32, soit environ 1/D⁵"],
    variante: "Le débit de la conduite est imposé. On remplace la conduite par une autre de diamètre deux fois plus petit. Les pertes de charge sont multipliées par environ…",
    transfert: Q("À débit imposé, on augmente le diamètre d’une conduite de 20 % seulement. Les pertes linéaires sont divisées par environ…",
      ok("2,5", "1,2⁵ ≈ 2,5 : les pertes chutent vite avec le diamètre."),
      no("1,2", "Ce serait vrai si les pertes variaient comme 1/D."),
      no("1,44", "Ce serait vrai si les pertes variaient comme 1/D².")),
  };
  C.singulier = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [["nc", 20], ["Dsing", 200]], fix: ["nc", 6],
    duree: 12,
    m: ["Chaque coude freine deux fois plus, et il y a deux fois plus de chocs", "Le diamètre équivalent des raccords diminue quand la vitesse double"],
    crit: ["Les coefficients K des raccords sont fixes", "hs = ΣK · v²/(2g)", "Doubler la vitesse multiplie v² par 4"],
    variante: "Sans changer aucun raccord, on fait circuler l’eau deux fois plus vite dans le tracé. La perte de charge singulière hs…",
    transfert: Q("Dans une gaine de ventilation, on réduit la vitesse de l’air de 30 %. Les pertes singulières baissent d’environ…",
      ok("50 %", "0,7² ≈ 0,49 : elles sont presque divisées par deux."),
      no("30 %", "Ce serait vrai si les pertes suivaient la vitesse, pas son carré."),
      no("9 %", "C’est 0,3², une confusion entre la baisse et ce qui reste.")),
  };
  C.pompe = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [["HA", 52], ["HBneed", 28], ["hptot", 24.5]], fix: ["eta", 70],
    duree: 12,
    okT: "La charge qui manque au bilan : HMT = besoin + pertes − charge disponible",
    m: ["Une pression constante de service, quel que soit le réseau en aval", "Toute la charge dont l’abonné a besoin, réservoir non compris"],
    crit: ["On fait le bilan : charge disponible contre besoin + pertes", "La pompe ne fournit que ce qui manque", "HMT = besoin aval + pertes − charge disponible en amont"],
    variante: "Le réservoir apporte 52 m de charge. L’abonné a besoin de 28 m, et le réseau perd 8 m en route. Une pompe est-elle nécessaire ?",
    transfert: Q("Un réservoir offre 40 m de charge, l’abonné a besoin de 30 m et le réseau perd 15 m. La pompe doit fournir une HMT de…",
      ok("5 m", "30 + 15 − 40 = 5 m : seulement ce qui manque."),
      no("45 m", "Le réservoir apporte déjà 40 m : la pompe ne fournit pas tout."),
      no("15 m", "Les pertes ne sont qu’une partie du bilan.")),
  };
  C.reseau = {
    // valeurs de test automatique (étape 4 : démonstration ; étape 5 : correctif)
    demo: [["Dr", "100"], ["prixr", 0.1], ["prixr", 0.4]], fix: ["Dr", "125"],
    duree: 20,
    okT: "L’électricité de chaque heure de marche et l’entretien, en plus de l’achat",
    m: ["Seulement l’achat de la pompe, amorti dès la première année d’usage", "Rien de plus : la pompe récupère l’énergie perdue dans les pertes"],
    crit: ["La conduite se paie une fois, à l’achat", "Le surpresseur se paie à l’achat, puis chaque année (électricité, entretien)", "Seul un cumul sur la durée de vie permet de comparer"],
    variante: "Au hameau du Plateau, la pression est insuffisante. Entre une conduite plus grosse et un surpresseur, laquelle coûtera le moins sur 20 ans ?",
    transfert: Q("Une chaudière A coûte 3 000 € et consomme 1 200 €/an ; une chaudière B coûte 6 000 € et consomme 800 €/an. Sur 10 ans, la moins chère est…",
      ok("B, 14 000 € contre 15 000 €", "3 000 + 12 000 = 15 000 € ; 6 000 + 8 000 = 14 000 €."),
      no("A, car elle coûte deux fois moins cher", "L’achat ne suffit pas : il faut cumuler la consommation."),
      no("Elles se valent", "Le cumul sur 10 ans les départage.")),
  };

  // équilibrage des longueurs : la bonne explication ne doit pas se repérer à sa longueur
  C.bernoulli.m[0] = "Le col freine l’eau, qui y perd une partie de son énergie par frottement contre les parois rapprochées";
  C.reseau.m[0] = "Seulement l’achat de la pompe, qui est amorti dès la première année grâce à la pression gagnée";

  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
  const near = (a, b, e = 0.02) => Math.abs(a - b) <= e;

  C.debit.variants = [{
    story: "Variante terrain : la conduite DN 100 est bien posée, mais un poteau incendie resté ouvert en aval tire 18 L/s au lieu du débit nominal de 8 L/s.",
    preset: { Q: 18, D: 100 },
    culprit: "Q",
    symptom: "La vitesse grimpe à 2,29 m/s : bruit et coups de bélier dans la colonne.",
    target: (c) => c.out.vel >= 0.5 && c.out.vel <= 1.5 && c.v("D") === 100,
    targetTxt: "0,5 ≤ v ≤ 1,5 m/s sur la conduite DN 100",
    now: (c) => `v = ${f(c.out.vel, 2)} m/s`,
    hint: "Le diamètre DN 100 est conforme au plan : ramenez le débit appelé à sa plage nominale.",
    explain: "À section fixée, toute surconsommation ou fuite aval fait croître proportionnellement la vitesse `v = Q/S`.",
  }];
  C.fluide.variants = [{
    story: "Variante terrain : le réseau d’eau glycolée a bien la bonne masse volumique, mais le fluide froid non réchauffé présente une viscosité dynamique trop élevée (14 mPa·s au lieu de ≤ 2 mPa·s).",
    preset: { rho: 1030, mu: 14 },
    culprit: "mu",
    symptom: "Le fluide s’écoule difficilement à la mise en route hivernale.",
    target: (c) => c.v("mu") <= 2.2 && c.v("rho") >= 1020,
    targetTxt: "μ ≤ 2,2 mPa·s avec ρ conservée (≥ 1 020 kg/m³)",
    now: (c) => `μ = ${f(c.v("mu"), 1)} mPa·s · d = ${f(c.out.d, 3)}`,
    hint: "La densité du mélange est bonne : regardez la viscosité dynamique μ.",
    explain: "À froid, la viscosité d’une eau glycolée grimpe vite et freine l’écoulement sans presque changer sa densité.",
  }];
  C.hydro.variants = [{
    story: "Variante terrain : la pression au départ est bien réglée à 4,0 bar, mais une erreur de nivellement a fait saisir un dénivelé de +26 m au lieu des +14 m réels du relevé topographique.",
    preset: { PA: 4.0, h: 26 },
    culprit: "h",
    symptom: "La note de calcul annonce seulement 1,45 bar en haut de côte au lieu de plus de 2,5 bar.",
    target: (c) => c.out.PB >= 2.5 && near(c.v("PA"), 4.0, 0.05),
    targetTxt: "P_B ≥ 2,5 bar avec P_A = 4,0 bar conservée",
    now: (c) => `P<sub>B</sub> = ${f(c.out.PB, 2)} bar`,
    hint: "La pression amont P_A est exacte : corrigez la cote altimétrique h saisie.",
    explain: "Chaque dizaine de mètres d’erreur d’altitude fausse la pression statique d’environ 1 bar (`ρ·g·h`).",
  }];
  C.bernoulli.variants = [{
    story: "Variante terrain : la vitesse (1,0 m/s) et la cote (10 m) sont exactes, mais la prise manométrique encrassée affiche 0,6 bar au lieu de la pression réelle (~2,4 bar, charge totale visée : 33 à 37 m).",
    preset: { Pbern: 0.6, vbern: 1.0, zbern: 10 },
    culprit: "Pbern",
    symptom: "La charge totale semble s’effondrer à 16 mCE alors que le débit n’a pas bougé.",
    target: (c) => c.out.H >= 33 && c.out.H <= 37 && near(c.v("vbern"), 1.0, 0.05) && near(c.v("zbern"), 10, 0.1),
    targetTxt: "33 ≤ H ≤ 37 m avec v = 1,0 m/s et z = 10 m",
    now: (c) => `H = ${f(c.out.H, 1)} m`,
    hint: "La vitesse et l’altitude sont vérifiées : contrôlez le terme de pression P/(ρ·g).",
    explain: "Dans le trinôme de Bernoulli, 1 bar d’erreur de lecture manométrique représente environ 10,2 m de charge hydraulique.",
  }];
  C.lineaire.variants = [{
    story: "Variante terrain : le diamètre DN 100 et le débit de 12 L/s (sur 500 m) sont imposés, mais l’ancienne fonte entartrée (`ε = 1,0 mm`) double la perte linéaire : passez en tube PEHD/PVC lisse.",
    preset: { Dlin: 100, Qlin: 12, L: 500, eps: "1" },
    culprit: "eps",
    symptom: "La perte de charge linéaire dépasse 14 mCE sur 500 m.",
    target: (c) => c.out.hf <= 9.5 && near(c.v("Dlin"), 100, 0.1) && near(c.v("Qlin"), 12, 0.05) && near(c.v("L"), 500, 0.5),
    targetTxt: "h_f ≤ 9,5 mCE à DN 100, Q = 12 L/s et L = 500 m",
    now: (c) => `h<sub>f</sub> = ${f(c.out.hf, 1)} mCE`,
    hint: "Géométrie et débit sont imposés : regardez l’état de surface intérieur (rugosité ε).",
    explain: "En régime turbulent rugueux, remplacer un tronçon entartré par un tube lisse abaisse fortement le facteur `f` de Darcy.",
  }];
  C.singulier.variants = [{
    story: "Variante terrain : le tracé (4 coudes, 2 tés, 2 vannes) est figé par la galerie technique, mais la vitesse d’écoulement a été poussée à 2,4 m/s : ramenez-la à ≤ 1,2 m/s.",
    preset: { nc: 4, nt: 2, nv: 2, vsing: 2.4 },
    culprit: "vsing",
    symptom: "Les pertes singulières dépassent 1,4 mCE dans le local technique.",
    target: (c) => c.out.hs <= 0.40 && c.v("nc") === 4 && c.v("nt") === 2 && c.v("nv") === 2,
    targetTxt: "h_s ≤ 0,40 m avec le même nombre d’accessoires",
    now: (c) => `h<sub>s</sub> = ${f(c.out.hs, 2)} m`,
    hint: "On ne peut supprimer ni coude ni vanne : agissez sur la vitesse v (qui compte au carré).",
    explain: "Comme `h_s = ΣK · v²/(2g)`, diviser la vitesse par 2 divise par 4 la perte de charge de tous les accessoires.",
  }];
  C.pompe.variants = [{
    story: "Variante terrain : le groupe de pompage a un bon rendement (70 %), mais une vanne de refoulement restée à moitié fermée crée 38 m de pertes totales au lieu des 12 m du réseau ouvert.",
    preset: { HA: 35, HBneed: 48, hptot: 38, Qpompe: 3.5, eta: 70 },
    culprit: "hptot",
    symptom: "La pompe réclame plus de 2,5 kW électriques pour vaincre une perte artificielle.",
    target: (c) => c.out.Pel <= 1300 && near(c.v("Qpompe"), 3.5, 0.05) && c.v("eta") >= 65,
    targetTxt: "P_élec ≤ 1,30 kW après réouverture de la vanne (pertes ramenées vers 12 m)",
    now: (c) => `P<sub>élec</sub> = ${f(c.out.Pel / 1000, 2)} kW`,
    hint: "Le rendement de la pompe est déjà bon : cherchez ce qui gonfle anormalement les pertes du circuit.",
    explain: "Vanner au refoulement pour réguler un réseau dissipe inutilement de la HMT et alourdit directement la facture électrique.",
  }];
  C.reseau.variants = [{
    story: "Variante terrain : sur l’antenne existante conservée en DN 100 (`Q = 7 L/s`, `L = 900 m`, `h = 18 m`), le surpresseur en pied de côte est tombé à l’arrêt (`HMT = 0 m`). Réglez sa HMT juste assez pour rétablir ≥ 2,2 bar sans dépasser 3,0 bar.",
    preset: { PAr: 4.25, hr: 18, Lr: 900, Dr: "100", Qr: 7, HMTr: 0, prixr: 0.22 },
    culprit: "HMTr",
    symptom: "Les abonnés du Plateau n’ont plus que 1,4 bar au robinet sur la conduite DN 100 existante.",
    target: (c) => c.s("Dr") === "100" && c.out.PB >= 2.2 && c.out.PB <= 3.0 && near(c.v("Qr"), 7, 0.05),
    targetTxt: "2,2 ≤ P_B ≤ 3,0 bar sur le DN 100 existant grâce au surpresseur",
    now: (c) => `P<sub>B</sub> = ${window.LAB_R110_RESEAU.f(c.out.PB, 2)} bar · HMT = ${c.v("HMTr")} m`,
    hint: "La conduite DN 100 est déjà enterrée : ajustez la HMT du surpresseur sans surpresser le hameau.",
    explain: "Sur une conduite existante sous-dimensionnée, le surpresseur compense la perte linéaire au prix d’une dépense électrique permanente.",
  }];

  const PROG = {
    ressource: "R1.10 · Réseaux secs et humides",
    competences: ["Dimensionner des ouvrages et des équipements techniques du BTP"],
    acs: ["AC13.03 · Dimensionner des réseaux secs et humides simples et les systèmes associés"],
    sae: "SAÉ 1.04 · Repérage et dimensionnement des réseaux secs et humides d’un ouvrage simple",
  };
  (window.LABV3_COMPLEMENTS = window.LABV3_COMPLEMENTS || []).push({ C, PROG });
})();
