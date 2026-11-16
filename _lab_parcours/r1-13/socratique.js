/* =====================================================================
   R1-13 · relances socratiques scriptées (métrologie d'essai)
   Conceptions erronées visées : répéter rend chaque mesure plus précise ; l'incertitude baisse comme 1/n ;
   les incertitudes s'additionnent ou la plus grande l'emporte ; un carré « adoucit » l'erreur ;
   une moyenne au-dessus de la limite suffit ; améliorer l'instrument le plus visible.
   Structure : voir _lab_parcours/r1-10/socratique.js. Données génériques.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const S = {};
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });

  S.ab = {
    why: [
      [{ k: "lin-n", t: "Quatre fois plus de mesures, quatre fois moins d’incertitude", faux: true }],
      [{ k: "racine", t: "L’incertitude sur la moyenne décroît comme 1/√n" }, { k: "s-baisse", t: "En répétant, chaque mesure devient plus précise", faux: true }],
      [{ k: "operateur", t: "L’incertitude dépend de l’opérateur et de l’instrument, pas du nombre de mesures", faux: true }],
    ],
    relance: { defaut: [
      Q("En passant de 4 à 16 mesures, le nuage des mesures s’est-il resserré ?",
        ok("Non, il garde la même largeur", "L’écart-type s, qui décrit chaque mesure, n’a pas changé."),
        no("Oui, nettement", "Comparez la largeur du nuage à n = 4 et à n = 16 : chaque mesure est-elle plus proche de la moyenne ?")),
      Q("u<sub>A</sub> = s/√n. Quand n est multiplié par 4, √n est multiplié par…",
        ok("2", "D’où une incertitude sur la moyenne divisée par 2 seulement."),
        no("4", "Que vaut √16 / √4 ?")),
      Q("Pour diviser u<sub>A</sub> par 4, il faudrait donc…",
        ok("16 fois plus de mesures", "Les gains coûtent de plus en plus cher : au-delà d’un certain n, mieux vaut agir sur d’autres sources."),
        no("8 fois plus de mesures", "Pour que √n soit multiplié par 4, par combien faut-il multiplier n ?")),
    ] },
    rq: [null, "Le nuage de mesures s’est-il resserré entre n = 4 et n = 16 ?", "La résolution de l’afficheur a-t-elle changé pendant votre essai ?"],
    indices: ["Distinguez la dispersion d’une mesure (s) et l’incertitude sur la moyenne (u<sub>A</sub>).", "u<sub>A</sub> = s/√n : écrivez le rapport pour n = 4 puis n = 16."],
    reformule: { q: "Avec vos mots : pourquoi 4 fois plus de mesures ne divisent-elles u<sub>A</sub> que par 2 ?", modele: "Chaque mesure garde la même dispersion s ; seule la moyenne gagne en précision, comme 1/√n : 4 fois plus de mesures divisent u<sub>A</sub> par √4 = 2." },
    questions: ["Les mesures répétées ne s’écartent que de quelques centièmes : la dispersion peut-elle expliquer 0,3 mm d’incertitude ?", "Quelle source de type B dépend de l’afficheur de l’instrument ?"],
  };

  S.compose = {
    why: [
      [{ k: "addition", t: "Les incertitudes s’additionnent, comme des erreurs", faux: true }],
      [{ k: "quadratique", t: "On additionne les carrés, puis on prend la racine" }],
      [{ k: "max", t: "La plus grande source l’emporte, la petite ne compte pas", faux: true }],
    ],
    relance: { defaut: [
      Q("Deux sources indépendantes jouent-elles toujours dans le même sens, à chaque mesure ?",
        ok("Non : elles se compensent parfois", "C’est pourquoi on ne les additionne pas simplement."),
        no("Oui, elles s’ajoutent toujours", "Si l’une tire vers le haut et l’autre vers le bas, l’écart total est-il la somme des deux ?")),
      Q("u<sub>c</sub> = √(u<sub>A</sub>² + u<sub>B</sub>²) = √(0,0064 + 0,0016) ≈…",
        ok("0,09 mm", "Un peu plus que la source dominante, bien moins que la somme."),
        no("0,12 mm", "√(a² + b²) est-il égal à a + b ?"),
        no("0,08 mm", "La petite source ajoute-t-elle vraiment zéro sous la racine ?")),
      Q("Diviser u<sub>B</sub> par 4 fait passer u<sub>B</sub>² de 0,0016 à 0,0001. Le gain sur u<sub>c</sub> est donc…",
        ok("faible : la source dominante reste u<sub>A</sub>", "Il faut agir sur la plus grosse contribution."),
        no("important : on a divisé une source par 4", "Quelle part de u<sub>c</sub>² représentait u<sub>B</sub>² au départ ?")),
    ] },
    rq: [null, "Si u<sub>c</sub> était plafonnée à la plus grande source, aurait-elle bougé du tout quand u<sub>B</sub> a baissé ?", "u<sub>c</sub> a-t-elle changé, même un peu, quand u<sub>B</sub> a baissé ?"],
    indices: ["Comparez u<sub>A</sub>² et u<sub>B</sub>² : laquelle domine ?", "u<sub>B</sub>² valait 0,0016 sur 0,0080, soit 20 % de u<sub>c</sub>²."],
    reformule: { q: "Avec vos mots : pourquoi réduire une petite source change-t-il peu l’incertitude composée ?", modele: "Les variances s’additionnent : une petite source, élevée au carré, pèse très peu dans u<sub>c</sub>². Il faut agir sur la source dominante." },
    questions: ["L’instrument est neuf. Laquelle des deux sources dépend surtout de l’opérateur ?", "Quelle source pèse le plus dans u<sub>c</sub>² ?"],
  };

  S.prop = {
    why: [
      [{ k: "adoucit", t: "Le carré « adoucit » l’incertitude, comme une racine", faux: true }],
      [{ k: "exposant", t: "L’exposant 2 multiplie l’incertitude relative par 2" }, { k: "deux-fois", t: "On mesure le diamètre deux fois", faux: true }],
      [{ k: "meme", t: "C’est la même grandeur mesurée, donc la même incertitude", faux: true }],
    ],
    relance: { defaut: [
      Q("Si D est surestimé de 1 %, D² est surestimé d’environ…",
        ok("2 %", "(1,01)² ≈ 1,02."),
        no("1 %", "Calculez 1,01 × 1,01."),
        no("0,5 %", "Calculez 1,01 × 1,01.")),
      Q("Pour une grandeur en D<sup>n</sup>, l’incertitude relative est multipliée par…",
        ok("n", "Pour la section (n = 2), u(D)/D compte double ; π et 4 sont exacts."),
        no("√n", "Reprenez l’exemple : 1 % sur D donne 2 % sur D².")),
    ] },
    rq: [null, "Combien de fois avez-vous mesuré D dans l’atelier ?", "Si D était plus facile à mesurer, l’exposant de D² changerait-il ?"],
    indices: ["Essayez un exemple : D surestimé de 1 %, que devient D² ?", "u(A)/A = 2 · u(D)/D : l’exposant devient un coefficient."],
    reformule: { q: "Avec vos mots : pourquoi l’incertitude sur le diamètre compte-t-elle double dans la section ?", modele: "La section varie comme D² : 1 % d’erreur relative sur D donne environ 2 % sur D². L’exposant devient un coefficient sur l’incertitude relative." },
    questions: ["Éprouvettes et pied à coulisse sont les mêmes : la section peut-elle expliquer un triplement soudain ?", "Quel autre appareil intervient dans σ = F/A ?"],
  };

  S.conform = {
    why: [
      [{ k: "moyenne", t: "La moyenne est au-dessus de la limite, cela suffit", faux: true }],
      [{ k: "intervalle", t: "L’intervalle s’élargit et finit par toucher la limite" }],
      [{ k: "k-baisse", t: "Un k plus grand fait baisser la résistance mesurée", faux: true }],
    ],
    relance: { defaut: [
      Q("Quand on passe de k = 2 à k = 3, la moyenne mesurée change-t-elle ?",
        ok("Non, elle reste à 26,4 MPa", "k n’agit que sur la largeur de l’intervalle."),
        no("Oui, elle baisse", "k multiplie u<sub>c</sub> : apparaît-il dans le calcul de la moyenne ?")),
      Q("U = k·u<sub>c</sub> passe de 1,1 à 1,65 MPa. La borne basse de l’intervalle passe donc…",
        ok("de 25,3 à 24,75 MPa, sous la limite", "L’intervalle chevauche la limite de 25 MPa."),
        no("à une valeur qui reste au-dessus de 25 MPa", "Calculez 26,4 − 1,65.")),
      Q("Un intervalle qui chevauche la limite signifie…",
        ok("qu’on ne peut conclure ni conforme ni non conforme", "C’est la zone de doute : réduire l’incertitude ou refaire des essais."),
        no("que le béton est non conforme", "La moyenne est-elle sous la limite ?")),
    ] },
    rq: [null, "La moyenne affichée a-t-elle changé entre k = 2 et k = 3 ?", "La limite de 25 MPa a-t-elle bougé dans la vue ?"],
    indices: ["Regardez l’intervalle [moyenne − U ; moyenne + U] face à la limite.", "U = k·u<sub>c</sub> : plus de confiance demande un intervalle plus large."],
    reformule: { q: "Avec vos mots : pourquoi le verdict peut-il changer sans que la moyenne change ?", modele: "La conformité se juge sur l’intervalle moyenne ± k·u<sub>c</sub>. Un niveau de confiance plus élevé élargit l’intervalle, qui peut alors chevaucher la limite." },
    questions: ["27,5 MPa pour une limite de 25 MPa, et pourtant le doute : l’intervalle est-il anormalement large ?", "À k fixé, quelle grandeur fixe la largeur de l’intervalle ?"],
  };

  S.lot = {
    why: [
      [{ k: "moyenne", t: "Seule la moyenne compte pour juger un lot", faux: true }],
      [{ k: "individuel", t: "Une éprouvette trop faible suffit à refuser le lot" }],
      [{ k: "trop-peu", t: "Trois éprouvettes ne suffisent jamais pour conclure", faux: true }],
    ],
    relance: { defaut: [
      Q("Chaque éprouvette représente une zone du béton coulé. Que dit l’éprouvette à 24 MPa sur sa zone ?",
        ok("Elle est nettement sous la classe visée", "6 MPa sous les 30 MPa attendus."),
        no("Rien : seule la moyenne a un sens", "Si cette éprouvette venait d’un poteau, ce poteau serait-il aussi résistant que prévu ?")),
      Q("Le critère individuel exige chaque résultat ≥ f<sub>ck</sub> − 4 = 26 MPa. L’éprouvette à 24 MPa…",
        ok("échoue au critère", "Le lot est refusé, malgré une moyenne correcte."),
        no("passe le critère", "24 est-il supérieur ou égal à 26 ?")),
      Q("Pourquoi la moyenne seule ne suffit-elle pas ?",
        ok("Elle peut masquer une zone faible derrière deux zones fortes", "Le critère individuel limite la dispersion vers le bas."),
        no("Elle est toujours fausse avec trois valeurs", "La moyenne de 34, 34 et 24 est-elle mal calculée ?")),
    ] },
    rq: [null, "Le critère individuel rend-il l’acceptation plus facile ou plus exigeante ?", "La moyenne de trois valeurs est-elle mal calculée, ou insuffisante pour juger seule ?"],
    indices: ["Deux critères s’appliquent au lot : lesquels ?", "La moyenne doit atteindre un seuil ET chaque résultat doit dépasser f<sub>ck</sub> − 4."],
    reformule: { q: "Avec vos mots : pourquoi un lot peut-il être refusé malgré une bonne moyenne ?", modele: "La moyenne peut cacher une zone faible : le critère individuel (chaque résultat ≥ f<sub>ck</sub> − 4) protège contre une dispersion vers le bas." },
    questions: ["Deux éprouvettes dépassent largement la classe : lequel des deux critères échoue ?", "Quelle éprouvette tire le lot vers le refus ?"],
  };

  S.budget = {
    why: [
      [{ k: "cinq-fois", t: "Un afficheur cinq fois plus fin divise l’incertitude par cinq", faux: true }],
      [{ k: "un-peu", t: "La résolution est une source parmi d’autres, elle pèse un peu", faux: true }],
      [{ k: "dominante", t: "La résolution pèse très peu devant l’étalonnage" }, { k: "inutile", t: "La résolution n’entre jamais dans l’incertitude", faux: true }],
    ],
    relance: {
      defaut: [
        Q("Dans le budget de départ, quelle contribution est la plus grande ?",
          ok("L’étalonnage, de très loin", "C’est elle qui fixe u<sub>c</sub>(F)."),
          no("La résolution de l’afficheur", "Regardez les barres du budget : laquelle est la plus longue ?")),
        Q("Les contributions s’ajoutent au carré. Réduire une contribution déjà minuscule change donc u<sub>c</sub>(F)…",
          ok("presque pas", "On investit sur la contribution dominante, ici l’étalonnage."),
          no("en proportion du gain sur l’afficheur", "Que reste-t-il sous la racine si un terme déjà minuscule devient encore plus petit ?")),
      ],
      inutile: [
        Q("La résolution entre-t-elle dans le budget ?",
          ok("Oui, mais elle y pèse très peu ici", "Elle compte, pour moins de 1 % de u<sub>c</sub>² : c’est son poids, pas son absence, qui la rend négligeable."),
          no("Non, jamais", "Réglez une résolution très grossière : u<sub>c</sub>(F) change-t-elle ?")),
      ],
    },
    rq: [null, "Un afficheur plus fin modifie-t-il la dérive de la presse ?", "La résolution figure-t-elle dans les lignes du budget ?"],
    indices: ["Comparez les contributions au carré : laquelle domine u<sub>c</sub>² ?", "La résolution pèse moins de 1 % de u<sub>c</sub>² : la réduire ne change presque rien."],
    reformule: { q: "Avec vos mots : sur quelle source faut-il investir pour réduire une incertitude composée ?", modele: "Sur la contribution dominante dans u<sub>c</sub>² : améliorer une source qui pèse peu, même de façon spectaculaire, ne change presque rien." },
    questions: ["La presse et l’afficheur n’ont pas changé. Qu’est-ce qui a changé avec le prestataire ?", "Quelle contribution du budget vient du certificat d’étalonnage ?"],
  };

  Object.entries(S).forEach(([id, x]) => {
    const at = PC.ateliers[id];
    if (!at) return;
    at.predict.why = x.why;
    at.observe.relance = x.relance;
    at.measure.indices = x.indices;
    at.measure.reformule = x.reformule;
    (x.rq || []).forEach((t, i) => { if (t && at.measure.opts[i]) at.measure.opts[i].rq = t; });
    at.diag.questions = x.questions;
  });
})();

/* raisonnements supplémentaires */
// Chaque option de prédiction propose plusieurs raisonnements, dont des raisonnements faux
// tirés des conceptions erronées fréquentes ; un raisonnement faux ouvre l'échange « defaut ».
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const MORE = {
 "ab": [
  [
   {
    "k": "x-facteur",
    "t": "L’incertitude est divisée par le même facteur que le nombre de mesures",
    "faux": true
   },
   {
    "k": "x-part-fixe",
    "t": "Chaque nouvelle mesure retire une part fixe d’incertitude",
    "faux": true
   }
  ],
  [
   {
    "k": "x-ecart-type",
    "t": "Chaque mesure reste aussi dispersée, seule la moyenne devient plus sûre"
   }
  ],
  [
   {
    "k": "x-rien-gagne",
    "t": "On ne gagne rien à répéter avec le même instrument",
    "faux": true
   },
   {
    "k": "x-resolution",
    "t": "L’incertitude de type A ne dépend que de la résolution",
    "faux": true
   }
  ]
 ],
 "compose": [
  [
   {
    "k": "x-cumul",
    "t": "Deux sources d’erreur, deux incertitudes à cumuler",
    "faux": true
   },
   {
    "k": "x-pire",
    "t": "Il faut toujours prendre le pire cas, donc la somme",
    "faux": true
   }
  ],
  [
   {
    "k": "x-independantes",
    "t": "Les deux sources sont indépendantes : leurs effets ne vont pas toujours dans le même sens"
   },
   {
    "k": "x-forfait",
    "t": "On garde la plus grande et on ajoute un petit forfait",
    "faux": true
   }
  ],
  [
   {
    "k": "x-disparait",
    "t": "u_B est deux fois plus petite, elle disparaît",
    "faux": true
   },
   {
    "k": "x-types",
    "t": "On ne combine pas des incertitudes de types différents",
    "faux": true
   }
  ]
 ],
 "prop": [
  [
   {
    "k": "x-divise4",
    "t": "On divise par 4 dans la formule, l’incertitude diminue",
    "faux": true
   },
   {
    "k": "x-constantes",
    "t": "π et 4 sont exacts, ils réduisent l’incertitude",
    "faux": true
   }
  ],
  [
   {
    "k": "x-un-pour-deux",
    "t": "Une erreur sur le diamètre compte deux fois dans la section"
   }
  ],
  [
   {
    "k": "x-pi-exact",
    "t": "π/4 est exact, donc rien ne change",
    "faux": true
   },
   {
    "k": "x-addition",
    "t": "Seule une addition propage les incertitudes",
    "faux": true
   }
  ]
 ],
 "conform": [
  [
   {
    "k": "x-affichage",
    "t": "Le facteur k ne change que l’écriture du résultat",
    "faux": true
   },
   {
    "k": "x-acquis",
    "t": "Un résultat conforme le reste quel que soit le niveau de confiance",
    "faux": true
   }
  ],
  [
   {
    "k": "x-calcul",
    "t": "Plus on veut être sûr, plus la marge autour de la moyenne s’élargit"
   },
   {
    "k": "x-moyenne-baisse",
    "t": "La moyenne baisse quand on augmente k",
    "faux": true
   }
  ],
  [
   {
    "k": "x-refus",
    "t": "À 99,7 % de confiance, tout résultat proche de la limite est refusé",
    "faux": true
   },
   {
    "k": "x-fausse",
    "t": "Un intervalle plus large signifie une mesure fausse",
    "faux": true
   }
  ]
 ],
 "lot": [
  [
   {
    "k": "x-compense",
    "t": "Une éprouvette faible est compensée par les deux autres",
    "faux": true
   },
   {
    "k": "x-ecarter",
    "t": "Une valeur basse est forcément une erreur de mesure à écarter",
    "faux": true
   }
  ],
  [
   {
    "k": "x-critere",
    "t": "Le critère porte aussi sur chaque résultat, pas seulement sur la moyenne"
   },
   {
    "k": "x-toutes-34",
    "t": "Toutes les éprouvettes doivent dépasser 34 MPa",
    "faux": true
   }
  ],
  [
   {
    "k": "x-disperse",
    "t": "Des résultats aussi dispersés ne permettent rien",
    "faux": true
   },
   {
    "k": "x-dix",
    "t": "Il faut au moins dix éprouvettes pour décider",
    "faux": true
   }
  ]
 ],
 "budget": [
  [
   {
    "k": "x-seule",
    "t": "La résolution est la seule source d’incertitude d’un afficheur",
    "faux": true
   },
   {
    "k": "x-juste",
    "t": "Plus fin veut dire plus juste dans la même proportion",
    "faux": true
   }
  ],
  [
   {
    "k": "x-egal",
    "t": "Chaque source pèse à peu près autant que les autres",
    "faux": true
   },
   {
    "k": "x-cinquieme",
    "t": "La résolution pèse un cinquième du budget",
    "faux": true
   }
  ],
  [
   {
    "k": "x-carres",
    "t": "Les sources se combinent au carré : la plus grosse écrase les petites"
   }
  ]
 ]
};
  Object.entries(MORE).forEach(([id, opts]) => {
    const at = PC.ateliers[id];
    if (!at || !at.predict) return;
    const why = (at.predict.why = at.predict.why || at.predict.opts.map(() => []));
    opts.forEach((rs, i) => { if (why[i]) rs.forEach((r) => { if (!why[i].some((x) => x.k === r.k)) why[i].push(r); }); });
  });
})();
