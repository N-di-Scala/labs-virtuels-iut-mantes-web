/* R1-13 · compléments pédagogiques (structure décrite dans r1-1/complements.js) */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });
  const C = {};

  C.ab = {
    duree: 12,
    m: ["L’écart-type s des mesures diminue de moitié quand on répète quatre fois plus", "La résolution de l’afficheur limite le gain à un facteur 2 au maximum"],
    crit: ["Chaque mesure garde la même dispersion s", "Seule la moyenne gagne en précision, comme 1/√n", "4 fois plus de mesures divisent u<sub>A</sub> par √4 = 2"],
    variante: "Même opérateur, même instrument : on passe de 4 à 16 mesures répétées du même diamètre. L’incertitude de type A sur la moyenne…",
    transfert: Q("Pour diviser par 3 l’incertitude de type A sur une moyenne obtenue avec 5 mesures, il faut…",
      ok("45 mesures", "√(45/5) = 3 : il faut 9 fois plus de mesures."),
      no("15 mesures", "Trois fois plus de mesures ne divisent u<sub>A</sub> que par √3 ≈ 1,7."),
      no("un instrument trois fois plus fin", "La résolution relève du type B, pas de la dispersion des mesures.")),
  };
  C.compose = {
    duree: 12,
    okT: "u<sub>B</sub>² ne pesait que 20 % de u<sub>c</sub>² : la source dominante reste u<sub>A</sub>",
    m: ["Le calcul plafonne u<sub>c</sub> à la plus grande des deux incertitudes", "u<sub>B</sub> n’intervient dans u<sub>c</sub> qu’au-delà d’un seuil de 0,05 mm"],
    crit: ["Les variances s’additionnent : u<sub>c</sub>² = u<sub>A</sub>² + u<sub>B</sub>²", "Une petite source, élevée au carré, pèse très peu", "Il faut agir sur la source dominante"],
    variante: "Pour une mesure de diamètre, u<sub>A</sub> = 0,08 mm et u<sub>B</sub> = 0,04 mm. L’incertitude composée u<sub>c</sub> vaut environ…",
    transfert: Q("Deux sources : 0,3 mm et 0,1 mm. Laquelle faut-il améliorer en priorité pour réduire u<sub>c</sub> ?",
      ok("Celle de 0,3 mm", "Elle pèse 0,09 contre 0,01 dans u<sub>c</sub>² : 90 % du total."),
      no("Celle de 0,1 mm, plus facile à réduire", "La supprimer ne ferait baisser u<sub>c</sub> que d’environ 5 %."),
      no("Les deux de la même façon", "Les carrés rendent leurs poids très inégaux.")),
  };
  C.prop = {
    duree: 12,
    okT: "L’exposant 2 de D² devient un facteur 2 sur l’incertitude relative",
    m: ["On mesure le diamètre deux fois, une fois pour chaque côté de la section", "Le diamètre est plus difficile à mesurer que la force sur la presse"],
    crit: ["La section varie comme D²", "1 % d’erreur relative sur D donne environ 2 % sur la section", "L’exposant devient un coefficient sur l’incertitude relative"],
    variante: "La section d’une éprouvette cylindrique se calcule par A = πD²/4. L’incertitude relative sur D se retrouve dans celle de A…",
    transfert: Q("Le volume d’un cube vaut a³. Une erreur relative de 1 % sur l’arête a donne sur le volume une erreur relative d’environ…",
      ok("3 %", "L’exposant 3 devient un coefficient 3."),
      no("1 %", "L’erreur sur a intervient trois fois dans a × a × a."),
      no("0,33 %", "C’est l’effet d’une racine cubique, pas d’un cube.")),
  };
  C.conform = {
    duree: 12,
    okT: "Un niveau de confiance plus élevé élargit l’intervalle, qui touche alors la limite",
    m: ["Le facteur k modifie la moyenne mesurée, qui passe sous la limite", "La limite de spécification se décale vers le haut quand k augmente"],
    crit: ["La conformité se juge sur l’intervalle moyenne ± k·u<sub>c</sub>", "Plus de confiance, c’est un k plus grand et un intervalle plus large", "L’intervalle peut alors chevaucher la limite"],
    variante: "Résistance moyenne 26,4 MPa, u<sub>c</sub> = 0,55 MPa, limite 25 MPa. On passe d’un niveau de confiance de 95 % (k = 2) à 99,7 % (k = 3). Le verdict…",
    transfert: Q("Une mesure de bruit donne 34 dB ± 1,5 dB (k = 2), pour une exigence de 35 dB au plus. Le verdict est…",
      ok("en zone de doute", "L’intervalle 32,5 à 35,5 dB chevauche la limite."),
      no("conforme, car 34 dB < 35 dB", "L’intervalle dépasse la limite : on ne peut pas conclure."),
      no("non conforme", "La valeur centrale respecte l’exigence : on ne peut pas non plus refuser.")),
  };
  C.lot = {
    duree: 12,
    okT: "La moyenne peut masquer une zone faible ; le critère individuel limite la dispersion",
    m: ["Il augmente les chances d’accepter le lot quand la moyenne est juste", "La moyenne de trois valeurs n’a aucun sens statistique pour un béton"],
    crit: ["Une moyenne correcte peut cacher une zone faible", "Le critère individuel impose que chaque résultat dépasse f<sub>ck</sub> − 4", "Il protège contre une dispersion vers le bas"],
    variante: "Pour une classe visée f<sub>ck</sub> = 30 MPa, trois éprouvettes donnent 24, 34 et 34 MPa (moyenne 30,7 MPa). Le lot est…",
    transfert: Q("Trois carottages d’une dalle donnent 35, 36 et 25 MPa pour une classe de 30 MPa. Que faut-il en conclure ?",
      ok("Une zone de la dalle est suspecte : on investigue", "25 MPa est sous 30 − 4 = 26 MPa, même si la moyenne passe."),
      no("La dalle est conforme, la moyenne vaut 32 MPa", "La moyenne masque la valeur faible."),
      no("On écarte 25 MPa, c’est une erreur de mesure", "On n’écarte pas une valeur gênante sans raison technique.")),
  };
  C.budget = {
    duree: 12,
    okT: "La résolution pesait moins de 1 % de u<sub>c</sub>² : on investit sur la source dominante",
    m: ["Un afficheur plus fin augmente la dérive, qui compense le gain obtenu", "La résolution n’entre pas dans le budget d’incertitude d’une presse"],
    crit: ["On compare les contributions dans u<sub>c</sub>²", "Améliorer une source qui pèse peu ne change presque rien", "On investit sur la contribution dominante"],
    variante: "L’afficheur d’une presse donne la force à 0,5 kN près. On le remplace par un afficheur à 0,1 kN, cinq fois plus fin. L’incertitude u<sub>c</sub>(F) baisse…",
    transfert: Q("Le budget d’un thermomètre : étalonnage 0,4 °C, résolution 0,05 °C, stabilité 0,1 °C. Le meilleur investissement est…",
      ok("un meilleur étalonnage", "Il domine u<sub>c</sub>² à plus de 90 %."),
      no("un afficheur au centième", "La résolution pèse moins de 2 % du budget."),
      no("un boîtier plus stable", "La stabilité pèse environ 6 % du budget.")),
  };

  // équilibrage des longueurs : la bonne explication ne doit pas se repérer à sa longueur
  C.conform.m[0] = "Le facteur k modifie la moyenne mesurée, qui passe alors sous la limite de spécification de 25 MPa";
  C.lot.m[0] = "Il augmente les chances d’accepter le lot quand la moyenne des trois éprouvettes est tout juste suffisante";
  C.budget.m[0] = "Un afficheur plus fin augmente la dérive de la presse, qui compense alors le gain obtenu sur la résolution";

  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
  const near = (a, b, e = 0.02) => Math.abs(a - b) <= e;

  C.ab.variants = [{
    story: "Variante labo : le comparateur au centième (`res = 0,05 mm`) est irréprochable, mais l’opérateur n’a pris que 2 lectures sur un parement rugueux (`s = 0,22 mm`). Augmentez le nombre de répétitions pour ramener `u_c ≤ 0,075 mm`.",
    preset: { n: 2, s: 0, res: 0.05 },
    culprit: "n",
    symptom: "L’incertitude de répétabilité u_A domine tout le bilan faute de lectures suffisantes.",
    target: (c) => c.out.uc <= 0.075 && near(c.v("res"), 0.05, 0.01),
    targetTxt: "u_c ≤ 0,075 mm en multipliant les mesures (avec s = 0,22 mm)",
    now: (c) => `u<sub>c</sub> = ${f(c.out.uc, 3)} mm (n = ${c.v("n")})`,
    hint: "L’instrument est déjà fin : c’est le nombre de lectures répétées n qui est trop faible.",
    explain: "Quand le type A domine, moyenner davantage de mesures divise `u_A` par `√n` sans changer d’appareil.",
  }];
  C.ab.variants[0].preset.s = 0.22;

  C.compose.variants = [{
    story: "Variante labo : la répétabilité est excellente (`u_A = 0,04 mm`), mais l’étalonnage périmé du capteur introduit `u_B = 0,28 mm`. Ramenez `u_B` pour obtenir `u_c ≤ 0,08 mm`.",
    preset: { uA: 0.04, uB: 0.28 },
    culprit: "uB",
    symptom: "L’incertitude composée atteint 0,283 mm malgré des lectures très régulières.",
    target: (c) => c.out.uc <= 0.08 && near(c.v("uA"), 0.04, 0.005),
    targetTxt: "u_c ≤ 0,08 mm en corrigeant la composante u_B",
    now: (c) => `u<sub>c</sub> = ${f(c.out.uc, 3)} mm`,
    hint: "Comparez `u_A²` et `u_B²` : la composante de type B écrase le triangle de Pythagore.",
    explain: "En composition quadratique, réduire le petit terme ne change presque rien : il faut traiter le terme dominant `u_B`.",
  }];
  C.prop.variants = [{
    story: "Variante labo : la presse est fraîchement étalonnée (`F = 380 kN`, `u(F) = 1,5 kN`), mais le diamètre de l’éprouvette (`D = 118 mm`) a été estimé au réglet avec `u(D) = 0,80 mm`. Passez au pied à coulisse pour ramener `u(σ) ≤ 0,35 MPa`.",
    preset: { D: 118, uD: 0.8, F: 380, uF: 1.5 },
    culprit: "uD",
    symptom: "L’incertitude sur σ dépasse 0,49 MPa alors que la presse est très précise.",
    target: (c) => c.out.uSig <= 0.35 && c.v("D") === 118 && near(c.v("uF"), 1.5, 0.05),
    targetTxt: "u(σ) ≤ 0,35 MPa grâce à une mesure fine du diamètre D",
    now: (c) => `u(σ) = ${f(c.out.uSig, 2)} MPa`,
    hint: "Regardez les barres de contribution : `A = πD²/4` fait compter deux fois l’erreur relative sur `D` !",
    explain: "Comme `D` intervient au carré dans la section, une mesure grossière du diamètre ruine la précision d’une excellente presse.",
  }];
  C.conform.variants = [{
    story: "Variante labo : le béton affiche `σ = 26,4 MPa` avec `u_c = 0,55 MPa` pour un seuil `L_spec = 25 MPa`, mais le stagiaire a coché `k = 3` (99,7 %) au lieu du facteur contractuel `k = 2` (95 %).",
    preset: { sig: 26.4, uc: 0.55, k: "3", Lspec: 25 },
    culprit: "k",
    symptom: "Le lot bascule en zone de doute uniquement à cause d’un facteur d’élargissement excessif.",
    target: (c) => c.out.ver === "conforme" && near(c.v("sig"), 26.4, 0.05) && near(c.v("uc"), 0.55, 0.02) && near(c.v("Lspec"), 25, 0.05),
    targetTxt: "verdict conforme avec le facteur d’élargissement normalisé k = 2",
    now: (c) => `${c.out.ver}, borne basse ${f(c.out.lo, 2)} MPa`,
    hint: "Ni la mesure ni l’appareil ne sont en cause : vérifiez le facteur d’élargissement k retenu.",
    explain: "En contrôle courant BTP, la déclaration de conformité s’appuie sur `k = 2` (niveau de confiance d’environ 95 %).",
  }];
  C.lot.variants = [{
    story: "Variante labo : les trois éprouvettes d’un béton C25/30 donnent 28,0 / 29,0 / 27,5 MPa, mais la fiche de réception a été paramétrée par erreur sur un béton C35/45 (`f_ck = 35 MPa` au lieu de `25 MPa`).",
    preset: { s1: 28, s2: 29, s3: 27.5, fck: 35 },
    culprit: "fck",
    symptom: "Un lot C25/30 sain est déclaré non conforme sur la fiche de contrôle.",
    target: (c) => c.out.okInd && c.out.okMean && near(c.v("s1"), 28, 0.05) && near(c.v("s2"), 29, 0.05) && near(c.v("s3"), 27.5, 0.05) && c.v("fck") === 25,
    targetTxt: "lot conforme en rétablissant la classe prescrite f_ck = 25 MPa",
    now: (c) => `f<sub>ck</sub> = ${c.v("fck")} MPa · moyenne ${f(c.out.mean, 1)} MPa`,
    hint: "Les trois éprouvettes sont homogènes autour de 28 MPa : vérifiez la classe de béton inscrite au CCTP.",
    explain: "Avant de rebuter une gâchée, on vérifie toujours que le seuil `f_ck` correspond bien à la classe commandée.",
  }];
  C.budget.variants = [{
    story: "Variante labo : le certificat d’étalonnage est bon (`U_cal = 2,2 kN`) et l’afficheur est fin (`r_F = 0,2 kN`), mais la presse n’a pas été vérifiée depuis trois ans (`a_der = 8,5 kN`). Révisez-la pour ramener `u_c(F) ≤ 2,0 kN`.",
    preset: { Ucal: 2.2, ader: 8.5, rF: 0.2 },
    culprit: "ader",
    symptom: "La dérive représente plus de 90 % du budget d’incertitude de la presse.",
    target: (c) => c.out.uc <= 2.0 && near(c.v("Ucal"), 2.2, 0.05) && near(c.v("rF"), 0.2, 0.05),
    targetTxt: "u_c(F) ≤ 2,0 kN en maîtrisant la dérive entre vérifications",
    now: (c) => `u<sub>c</sub>(F) = ${f(c.out.uc, 2)} kN`,
    hint: "Regardez l’anneau 3D : quel secteur écrase les deux autres ?",
    explain: "Un bon certificat initial ne vaut plus rien si la dérive annuelle de la machine n’est pas suivie.",
  }];

  const PROG = {
    ressource: "R1.13 · Fonctions des composants des bâtiments",
    competences: ["Piloter techniquement un ouvrage tout au long de sa vie"],
    acs: ["AC15.02 · Identifier et caractériser les principaux matériaux et équipements du Génie Civil", "AC15.03 · Collecter, organiser et analyser des données"],
    sae: "SAÉ 1.06 · État des lieux d’un ouvrage existant",
  };
  (window.LABV3_COMPLEMENTS = window.LABV3_COMPLEMENTS || []).push({ C, PROG });
})();
