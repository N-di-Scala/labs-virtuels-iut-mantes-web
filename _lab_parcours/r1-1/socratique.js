/* =====================================================================
   R1-1 · relances socratiques scriptées (tableur)
   Conceptions erronées visées : une copie de formule recopie le même texte ; le $ protège la valeur ;
   le tableur connaît les unités ; une majoration s'applique à tout ; doubler un taux double le prix ;
   SOMME.SI compte ; la hauteur d'une barre est toujours proportionnelle ; une valeur absente vaut 0.
   Structure : voir _lab_parcours/r1-10/socratique.js. Données génériques.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const S = {};
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });

  S.refs = {
    why: [
      [{ k: "copie", t: "Recopier une formule, c’est recopier exactement le même texte", faux: true }, { k: "devine", t: "Le tableur comprend qu’il s’agit du prix unique", faux: true }],
      [{ k: "decale", t: "Une référence sans $ se décale avec la recopie" }],
      [{ k: "vide-erreur", t: "Lire une cellule vide provoque une erreur", faux: true }],
    ],
    relance: { defaut: [
      Q("Recopiée d’une ligne vers le bas, une référence relative comme B1 devient…",
        ok("B2", "Le tableur retient une position relative (« la colonne B, sur ma ligne »), pas l’adresse B1."),
        no("B1", "Suivez les flèches de la deuxième ligne : vers quelle cellule pointent-elles ?"),
        no("C1", "On recopie vers le bas : est-ce la colonne ou la ligne qui change ?")),
      Q("À la ligne 4, la copie lit donc B4. Que contient B4 ?",
        ok("Rien : la cellule est vide, lue comme 0", "D’où des montants à zéro, sans aucun message d’erreur."),
        no("Le prix unique", "Le prix a été saisi une seule fois : dans quelle cellule ?")),
      Q("Pour que toutes les copies lisent B1, il faut…",
        ok("figer la colonne et la ligne : $B$1", "La recopie ne décale plus ni la lettre ni le chiffre."),
        no("retaper le prix sur chaque ligne", "Si le prix change, combien de cellules faudra-t-il corriger ?")),
    ] },
    rq: [null, "$B$1 empêche-t-il de taper un autre prix dans B1 ? Essayez.", "Le format monétaire change-t-il la cellule que la formule va lire ?"],
    indices: ["Comparez la formule de la ligne 1 et celle de la ligne 4 : qu’est-ce qui a changé ?", "Le $ se place devant ce qui ne doit pas bouger quand on recopie : la lettre, le chiffre, ou les deux."],
    reformule: { q: "Avec vos mots : que se passe-t-il quand on recopie une formule qui contient B1, puis $B$1 ?", modele: "Une référence relative se décale avec la recopie (B1 devient B2, B3…) ; le $ fige la colonne et la ligne, si bien que toutes les copies lisent B1." },
    questions: ["Seule la première ligne est juste : qu’est-ce qui change entre la formule de la ligne 1 et celles des lignes suivantes ?", "Quelle commande décide si la référence au prix suit la recopie ou reste fixe ?"],
  };

  S.unites = {
    why: [
      [{ k: "convertit", t: "Le tableur convertit les millimètres en mètres", faux: true }, { k: "bon-sens", t: "Le bon métré, c’est 3,20 m", faux: true }],
      [{ k: "nombres", t: "Le tableur additionne des nombres, sans unités" }],
      [{ k: "detecte", t: "Le tableur détecte des unités incompatibles", faux: true }],
    ],
    relance: { defaut: [
      Q("Dans les deux cellules, qu’est-ce que le tableur voit réellement ?",
        ok("Deux nombres : 2,4 et 800", "L’unité n’est écrite que dans l’en-tête, ou dans votre tête."),
        no("Deux longueurs, l’une en m, l’autre en mm", "Où l’unité est-elle écrite : dans la cellule ou à côté ?")),
      Q("Pour le tableur, 2,4 + 800 vaut…",
        ok("802,4", "Le calcul est juste pour lui : c’est la donnée qui est incohérente."),
        no("3,2", "Pour obtenir 3,2, qui aurait converti 800 en 0,8 ?")),
      Q("Comment éviter ce piège ?",
        ok("Une seule unité par colonne, écrite dans l’en-tête, et convertir à la saisie", "Le tableur ne vous protégera pas : la règle vient de vous."),
        no("Faire confiance au tableur, qui signale les incohérences", "Pendant l’essai, une alerte s’est-elle affichée ?")),
    ] },
    rq: [null, "Si le tableur convertissait, d’où saurait-il que 800 sont des millimètres ?", "802,40 mm ferait moins d’un mètre : est-ce cohérent avec deux tronçons de bordure ?"],
    indices: ["Que contient exactement la cellule où vous avez saisi 800 ?", "Un tableur manipule des nombres : l’unité n’existe que dans l’en-tête."],
    reformule: { q: "Avec vos mots : pourquoi le tableur additionne-t-il des mètres et des millimètres sans protester ?", modele: "Le tableur ne manipule que des nombres : 2,4 + 800 est un calcul valide pour lui. C’est à nous d’imposer une seule unité par colonne." },
    questions: ["Un couloir de gymnase de 802 m : lequel des deux tronçons a une valeur anormale ?", "Les deux tronçons sont-ils saisis dans la même unité ?"],
  };

  S.logique = {
    why: [
      [{ k: "tout", t: "Dès qu’on dépasse 40 h, toute la semaine passe au taux majoré", faux: true }],
      [{ k: "seuil", t: "Seules les heures au-delà de 40 h sont majorées" }],
      [{ k: "apres44", t: "La majoration ne commence qu’au-delà de 44 h", faux: true }],
    ],
    relance: { defaut: [
      Q("Sur 44 h, combien d’heures dépassent le seuil de 40 h ?",
        ok("4", "Ce sont les seules concernées par la majoration."),
        no("44", "Les 40 premières heures dépassent-elles le seuil ?")),
      Q("Les 40 premières heures sont payées 12,40 €. Les 4 suivantes, majorées de 25 %, sont payées…",
        ok("15,50 € chacune", "12,40 × 1,25 = 15,50 €."),
        no("12,40 € + 25 € chacune", "+25 % d’un taux, est-ce ajouter 25 € ou 25 % de 12,40 € ?")),
      Q("Le montant de la semaine vaut donc…",
        ok("40 × 12,40 + 4 × 15,50 = 558 €", "La branche « vrai » du SI sépare les deux parts."),
        no("44 × 15,50 = 682 €", "Les 40 premières heures ont-elles droit à la majoration ?")),
    ] },
    rq: [null, "558 € est-il un plafond, ou la somme de deux parts ?", "À 44 h, la branche « vrai » du SI s’allume-t-elle ?"],
    indices: ["Séparez la semaine en deux parts : jusqu’au seuil, puis au-delà.", "Au-delà de 40 h : montant = 40 × taux + (heures − 40) × taux × 1,25."],
    reformule: { q: "Avec vos mots : comment le SI calcule-t-il une semaine de 44 h ?", modele: "Le SI teste si l’on dépasse 40 h ; si oui, il paie 40 h au taux normal et seulement les heures au-delà au taux majoré de 25 %." },
    questions: ["La formule a été vérifiée sur d’autres fiches. Avant la formule, que faut-il contrôler ?", "Pour une semaine de 36 h, la branche majorée devrait-elle s’allumer ?"],
  };

  S.tva = {
    why: [
      [{ k: "double", t: "Le taux double, donc le prix double", faux: true }],
      [{ k: "part", t: "Seule la TVA double, et elle ne pèse qu’une petite part du TTC" }],
      [{ k: "ht-fixe", t: "Le HT ne change pas, donc le TTC non plus", faux: true }],
    ],
    relance: { defaut: [
      Q("Sur 12,40 € HT, que vaut la TVA à 6 %, puis à 12 % ?",
        ok("Environ 0,74 €, puis 1,49 €", "La TVA double bien."),
        no("6 €, puis 12 €", "6 % de 12,40 €, est-ce 6 € ?")),
      Q("TTC = HT + TVA. Le TTC passe donc…",
        ok("de 13,14 € à 13,89 €", "Une hausse de 0,74 €, environ 6 % du HT."),
        no("de 13,14 € à 26,28 €", "Le HT de 12,40 € a-t-il doublé, lui ?"),
        no("de 13,14 € à 13,14 €", "La TVA a doublé : le TTC peut-il rester le même ?")),
    ] },
    rq: [null, "Un arrondi au centime pourrait-il effacer une hausse de 75 centimes ?", "Le taux est-il limité dans la cellule ? Essayez 20 %."],
    indices: ["Écrivez TTC = HT + TVA : laquelle des deux parts a changé ?", "TVA = HT × taux : 0,74 € à 6 %, 1,49 € à 12 %."],
    reformule: { q: "Avec vos mots : pourquoi doubler le taux de TVA ne double-t-il pas le TTC ?", modele: "TTC = HT × (1 + taux) : seule la TVA double, et elle reste une petite part du TTC devant le HT, qui ne change pas." },
    questions: ["1,49 € de TVA sur 12,40 € HT : quel taux cela représente-t-il ?", "Le montant HT est celui de la commande. Quelle autre cellule entre dans le calcul de la TVA ?"],
  };

  S.synthese = {
    why: [
      [{ k: "filtre", t: "Le critère retient des lignes, la troisième plage fournit les montants" }, { k: "trie", t: "Le critère trie le tableau, puis on additionne tout", faux: true }],
      [{ k: "somme-tout", t: "SOMME additionne toujours toute la colonne", faux: true }],
      [{ k: "compte", t: "Un critère sert à compter, comme NB.SI", faux: true }],
    ],
    relance: { defaut: [
      Q("Dans =SOMME.SI(poste ; \"Quincaillerie\" ; montant), sur quelle plage le critère est-il testé ?",
        ok("La colonne des postes", "C’est là que se trouve le mot « Quincaillerie »."),
        no("La colonne des montants", "Un montant peut-il valoir « Quincaillerie » ?")),
      Q("Pour une ligne dont le poste est « Quincaillerie », que fait la formule ?",
        ok("Elle ajoute le montant de cette ligne", "Les autres lignes sont ignorées."),
        no("Elle ajoute 1", "Quelle fonction compte les lignes : SOMME.SI ou NB.SI ?"),
        no("Elle ajoute tous les montants", "Avec le filtre, le total a-t-il changé ?")),
    ] },
    rq: [null, "La seconde plage est-elle triée, ou lue ligne à ligne en face du critère ?", "Si les deux plages étaient additionnées, que vaudrait « Quincaillerie » en euros ?"],
    indices: ["Lisez les trois arguments dans l’ordre : où chercher, quoi chercher, quoi additionner.", "Plage 1 : les noms de postes (critère testé) ; plage 3 : les montants (valeurs additionnées)."],
    reformule: { q: "Avec vos mots : que font les trois arguments de SOMME.SI ?", modele: "Le premier donne la plage où tester le critère, le deuxième le critère lui-même, le troisième la plage dont on additionne les valeurs sur les lignes retenues." },
    questions: ["La quincaillerie dépasse le budget de tout le lot : la cellule additionne-t-elle un seul poste ?", "Quelle commande applique le critère sur le poste ?"],
  };

  S.graphiques = {
    why: [
      [{ k: "proportion", t: "La hauteur d’une barre est toujours proportionnelle à la valeur", faux: true }],
      [{ k: "ecart", t: "La barre ne montre plus que l’écart au bas de l’axe" }],
      [{ k: "proche", t: "98 et 101 sont trop proches pour se distinguer", faux: true }],
    ],
    relance: { defaut: [
      Q("Si l’axe commence à 96 €, la barre de la semaine 1 (98 €) représente combien d’euros à l’écran ?",
        ok("2 €", "Seule la partie au-dessus de 96 € est dessinée."),
        no("98 €", "Où commence la barre : à zéro ou à 96 € ?")),
      Q("Et celle de la semaine 3 (101 €) ?",
        ok("5 €, soit 2,5 fois la première", "D’où l’impression d’envolée pour +3 % réels."),
        no("101 €", "Même question : où commence la barre ?")),
      Q("Pour qu’un diagramme en barres reste honnête, l’axe doit…",
        ok("partir de zéro", "Les hauteurs redeviennent proportionnelles aux valeurs."),
        no("être zoomé pour bien voir les écarts", "Le zoom montre-t-il +3 % comme +3 %, ou comme +150 % ?")),
    ] },
    rq: [null, "Les valeurs de la série ont-elles changé quand vous avez zoomé ?", "Le zoom a-t-il ajouté une barre ou une semaine ?"],
    indices: ["Mesurez chaque barre à partir du bas de l’axe, pas à partir de zéro.", "Hauteur affichée = valeur − bas de l’axe : 2 € contre 5 €."],
    reformule: { q: "Avec vos mots : pourquoi un axe qui ne part pas de zéro trompe-t-il ?", modele: "La hauteur des barres ne représente plus la valeur mais l’écart au bas de l’axe : un faible écart relatif paraît énorme." },
    questions: ["+2 % réels pour une barre qui semble doubler : où commence l’axe vertical ?", "Quelle commande règle le bas de l’axe ?"],
  };

  S.qualite = {
    why: [
      [{ k: "zero", t: "Une valeur absente vaut zéro", faux: true }],
      [{ k: "signale", t: "Le tableur signale qu’il n’a rien trouvé" }],
      [{ k: "vide", t: "Le tableur laisse la cellule vide quand il ne trouve rien", faux: true }],
    ],
    relance: { defaut: [
      Q("Quand la clé 4 est absente de la table, la recherche a-t-elle une valeur à renvoyer ?",
        ok("Non : aucune ligne ne correspond", "Le tableur le dit par une erreur, #N/A."),
        no("Oui : zéro", "Zéro figure-t-il dans la table pour la clé 4 ?")),
      Q("Que devient une somme qui contient #N/A ?",
        ok("Elle affiche elle aussi une erreur", "L’erreur se propage : c’est gênant, mais on la voit."),
        no("Elle ignore la cellule", "Regardez le total du stock pendant l’essai.")),
      Q("Si la recherche renvoyait 0 en silence, que se passerait-il ?",
        ok("Le total serait faux sans que personne ne le voie", "D’où l’intérêt d’un message explicite."),
        no("Rien de grave", "Un article manquant compté pour 0 €, est-ce un stock juste ?")),
    ] },
    rq: [null, "Le tableur refuse-t-il d’afficher 0 ? Tapez 0 dans une cellule.", "Le but est-il d’augmenter le total, ou de garder l’anomalie visible ?"],
    indices: ["Comparez deux défauts : une erreur qui casse les calculs, un zéro qui passe inaperçu.", "SIERREUR(recherche ; \"Non trouvé\") garde l’anomalie visible sans casser les sommes."],
    reformule: { q: "Avec vos mots : pourquoi encadrer une recherche plutôt que renvoyer 0 ?", modele: "Un zéro fausserait les sommes en silence ; un message explicite signale l’anomalie sans casser les calculs." },
    questions: ["Le code cherché n’existe pas dans la table : qu’est-ce qui empêcherait l’erreur de se propager au total ?", "Quelle commande encadre la recherche ?"],
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
 "refs": [
  [
   {
    "k": "x-pointe",
    "t": "Une formule pointe toujours vers la cellule où la donnée a été saisie",
    "faux": true
   }
  ],
  [
   {
    "k": "x-relatif",
    "t": "Chaque ligne lit la cellule placée au même endroit par rapport à elle"
   },
   {
    "k": "x-prix-ligne",
    "t": "Le tableur avance d’une ligne parce que le prix change à chaque ligne",
    "faux": true
   }
  ],
  [
   {
    "k": "x-sans-dollar",
    "t": "Une formule recopiée sans $ est toujours rejetée",
    "faux": true
   },
   {
    "k": "x-refuse",
    "t": "Le tableur refuse de recopier une formule qui vise une donnée unique",
    "faux": true
   }
  ]
 ],
 "unites": [
  [
   {
    "k": "x-meme-unite",
    "t": "Ce sont deux longueurs, le tableur les ramène à la même unité",
    "faux": true
   }
  ],
  [
   {
    "k": "x-affichage",
    "t": "« m » ou « mm » n’est qu’un affichage : la cellule ne contient qu’un nombre"
   },
   {
    "k": "x-premiere",
    "t": "Le tableur prend l’unité de la première cellule",
    "faux": true
   }
  ],
  [
   {
    "k": "x-coherence",
    "t": "Un tableur vérifie la cohérence des métrés",
    "faux": true
   },
   {
    "k": "x-impossible",
    "t": "On ne peut pas additionner des mètres et des millimètres, le calcul échoue",
    "faux": true
   }
  ]
 ],
 "logique": [
  [
   {
    "k": "x-tout-salaire",
    "t": "Une majoration de 25 % s’applique à tout le salaire de la semaine",
    "faux": true
   },
   {
    "k": "x-statut",
    "t": "Le dépassement change le statut de toute la semaine",
    "faux": true
   }
  ],
  [
   {
    "k": "x-calcul",
    "t": "Les heures normales restent au taux de base, seules les heures en plus sont payées davantage"
   },
   {
    "k": "x-forfait",
    "t": "La majoration est un forfait, quelle que soit la durée dépassée",
    "faux": true
   }
  ],
  [
   {
    "k": "x-si-cellule",
    "t": "Une condition ne s’applique que si on l’écrit dans chaque cellule",
    "faux": true
   },
   {
    "k": "x-nuit",
    "t": "La majoration ne concerne que les heures de nuit",
    "faux": true
   }
  ]
 ],
 "tva": [
  [
   {
    "k": "x-suit-taux",
    "t": "Le TTC suit le taux de TVA",
    "faux": true
   },
   {
    "k": "x-tout-taxe",
    "t": "Tout le prix est taxé, donc tout double",
    "faux": true
   }
  ],
  [
   {
    "k": "x-formule",
    "t": "La TVA s’ajoute au prix hors taxe, qui ne bouge pas"
   }
  ],
  [
   {
    "k": "x-a-part",
    "t": "La TVA est payée à part, elle ne compte pas dans le TTC",
    "faux": true
   },
   {
    "k": "x-futur",
    "t": "Le nouveau taux ne s’applique qu’aux lignes à venir",
    "faux": true
   }
  ]
 ],
 "synthese": [
  [
   {
    "k": "x-cherche",
    "t": "SOMME.SI cherche le mot dans la colonne des montants",
    "faux": true
   }
  ],
  [
   {
    "k": "x-titre",
    "t": "Le texte entre guillemets est seulement affiché",
    "faux": true
   },
   {
    "k": "x-decor",
    "t": "Seul SOMME compte, le reste de la formule est décoratif",
    "faux": true
   }
  ],
  [
   {
    "k": "x-texte",
    "t": "Un texte ne s’additionne pas, donc la formule compte",
    "faux": true
   },
   {
    "k": "x-pareil",
    "t": "SOMME.SI et NB.SI donnent le même résultat",
    "faux": true
   }
  ]
 ],
 "graphiques": [
  [
   {
    "k": "x-echelle",
    "t": "Le tableur dessine toujours les barres à l’échelle",
    "faux": true
   },
   {
    "k": "x-graduations",
    "t": "Changer le début de l’axe ne change que les graduations",
    "faux": true
   }
  ],
  [
   {
    "k": "x-depuis-96",
    "t": "Avec un axe tronqué, la barre ne montre que ce qui dépasse le bas de l’axe"
   },
   {
    "k": "x-exagere",
    "t": "Le tableur exagère volontairement les petites hausses",
    "faux": true
   }
  ],
  [
   {
    "k": "x-invisible",
    "t": "Une hausse de 3 % est invisible sur un graphique",
    "faux": true
   },
   {
    "k": "x-arrondi",
    "t": "Le graphique arrondit les valeurs proches",
    "faux": true
   }
  ]
 ],
 "qualite": [
  [
   {
    "k": "x-defaut",
    "t": "Le tableur remplace ce qu’il ne trouve pas par 0",
    "faux": true
   },
   {
    "k": "x-nombre",
    "t": "Une cellule de calcul affiche toujours un nombre",
    "faux": true
   }
  ],
  [
   {
    "k": "x-sierreur",
    "t": "RECHERCHEV renvoie #N/A tant qu’on ne traite pas l’erreur (SIERREUR)"
   },
   {
    "k": "x-frappe",
    "t": "L’erreur vient forcément d’une faute de frappe dans la formule",
    "faux": true
   }
  ],
  [
   {
    "k": "x-efface",
    "t": "Une recherche sans résultat efface la cellule",
    "faux": true
   },
   {
    "k": "x-masque",
    "t": "Le tableur masque les erreurs par défaut",
    "faux": true
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
