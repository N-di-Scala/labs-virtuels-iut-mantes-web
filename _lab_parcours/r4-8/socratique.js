/* =====================================================================
   R4-8 · relances socratiques scriptées (confort d'été, inertie, stockage, aéraulique, acoustique)
   Conceptions erronées visées : l'isolant agit autant en été ; les occupants sont négligeables ;
   léger veut dire sans retard ; un matériau qui déphase stocke ; même énergie, même ballon ;
   les pertes d'un réseau suivent sa longueur ; les décibels s'additionnent.
   Structure : voir _lab_parcours/r1-10/socratique.js. Données génériques.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const S = {};
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });

  S.ete = {
    why: [
      [{ k: "ecart", t: "L’écart de température dedans-dehors est faible en été" }, { k: "isolant", t: "Les murs sont isolés, donc ils ne laissent rien passer", faux: true }],
      [{ k: "vitre", t: "Une vitre laisse passer peu de chaleur", faux: true }],
      [{ k: "gens", t: "Quelques personnes et leurs ordinateurs, c’est négligeable", faux: true }],
    ],
    relance: {
      defaut: [
        Q("Ici, l’écart entre dehors et dedans vaut…",
          ok("7 K", "Contre 20 K ou plus en hiver."),
          no("33 K", "L’écart, c’est 33 − 26 : combien ?")),
        Q("Une personne assise dégage environ 100 W, un ordinateur du même ordre. Six postes font donc…",
          ok("environ 1 kW", "Bien plus que les murs sous 7 K d’écart."),
          no("quelques watts", "Une personne chauffe-t-elle autant qu’une ampoule à incandescence de 100 W ?")),
        Q("Sur 9 m² de vitrage au soleil, plusieurs centaines de W/m² arrivent, réduits par le facteur solaire et les stores. Ce poste est…",
          ok("le plus important", "C’est pourquoi les stores et le facteur solaire sont les leviers d’été."),
          no("faible", "Baissez les stores : le gain est-il petit ?")),
      ],
      isolant: [
        Q("Les murs isolés laissent-ils passer zéro chaleur ?",
          ok("Non, mais l’écart de 7 K est faible, donc le flux aussi", "Φ<sub>T</sub> = U·A·ΔT reste petit en été, avec ou sans isolant épais."),
          no("Oui", "U vaut 0,35, pas 0 : que vaut U·A·ΔT ?")),
      ],
    },
    rq: [null, "L’isolant cesse-t-il d’agir en été, ou est-ce l’écart de température qui est faible ?", "Le soleil chauffe les murs, mais ce poste a-t-il beaucoup changé quand vous avez isolé ?"],
    indices: ["Comparez les ordres de grandeur des trois postes.", "Φ<sub>T</sub> = U·A·ΔT avec ΔT = 7 K reste petit devant le soleil et les apports internes."],
    reformule: { q: "Avec vos mots : pourquoi mieux isoler les murs change-t-il peu le bilan d’été ?", modele: "En été, l’écart de température est faible : le flux à travers les parois reste petit devant le soleil par les vitrages et les apports internes." },
    questions: ["Stores à moitié baissés, et pourtant plus de 7 kW : quel poste domine l’après-midi ?", "À surface vitrée donnée, quelle propriété du verre règle la part du soleil qui entre ?"],
  };

  const i2 = Q("Sa capacité volumique ρc<sub>p</sub> vaut 0,4 MJ/(m³·K), contre 1,9 pour le béton. La diffusivité λ/(ρc<sub>p</sub>) de la fibre est donc…",
    ok("environ 6 fois plus faible", "L’onde y avance plus lentement : le déphasage augmente."),
    no("plus forte", "Le numérateur est divisé par 28, le dénominateur par 5 environ : le rapport baisse-t-il ou monte-t-il ?"));
  const i3 = Q("La fibre de bois stocke-t-elle pour autant plus de chaleur que le béton ?",
    ok("Non : sa capacité surfacique est bien plus faible", "Retarder l’onde et stocker la chaleur sont deux propriétés distinctes."),
    no("Oui", "Regardez C<sub>s</sub> pour les deux matériaux."));
  S.inertie = {
    why: [
      [{ k: "leger", t: "Plus léger, donc moins d’inertie, donc moins de retard", faux: true }],
      [{ k: "diffusivite", t: "La fibre de bois conduit très peu : l’onde y avance lentement" }, { k: "stocke", t: "La fibre de bois stocke plus de chaleur que le béton", faux: true }],
      [{ k: "epaisseur", t: "Le déphasage ne dépend que de l’épaisseur", faux: true }],
    ],
    relance: {
      defaut: [
        Q("Comparez les conductivités : 1,40 pour le béton, 0,05 pour la fibre de bois. La fibre conduit…",
          ok("environ 28 fois moins", "1,40 ÷ 0,05 = 28."),
          no("à peu près autant", "Calculez 1,40 ÷ 0,05.")),
        i2, i3,
      ],
      stocke: [i3, i2],
    },
    rq: [null, "Regardez C<sub>s</sub> : la fibre stocke-t-elle plus que le béton ?", "Les deux murs font 28 cm : l’épaisseur est-elle différente ?"],
    indices: ["Comparez λ et ρc<sub>p</sub> des deux matériaux.", "a = λ/(ρc<sub>p</sub>) : la fibre a une diffusivité environ 6 fois plus faible."],
    reformule: { q: "Avec vos mots : pourquoi un isolant léger peut-il déphaser plus qu’un béton lourd ?", modele: "Le déphasage dépend de la diffusivité a = λ/(ρc<sub>p</sub>) : la fibre de bois, très peu conductrice, a une diffusivité plus faible, même si elle stocke beaucoup moins de chaleur." },
    questions: ["Le local reste chaud tard, mais le calcul annonce un faible déphasage : une valeur saisie ressemble-t-elle à celle d’un isolant ?", "Quelle propriété du « béton » saisi est anormalement faible ?"],
  };

  S.bepos = {
    why: [
      [{ k: "litre", t: "Chaque litre stocke deux fois moins d’énergie" }],
      [{ k: "moins", t: "Moins d’écart, moins de besoin, donc un plus petit ballon", faux: true }],
      [{ k: "energie", t: "Même énergie, même ballon", faux: true }],
    ],
    relance: { defaut: [
      Q("Un litre d’eau stocke environ 4,18 kJ par kelvin. Avec un écart de 6 K au lieu de 12 K, un litre stocke…",
        ok("deux fois moins", "Q = m·c·ΔT."),
        no("deux fois plus", "Q = m·c·ΔT : si ΔT diminue, que devient Q ?")),
      Q("Pour stocker la même énergie, il faut donc…",
        ok("deux fois plus de litres", "Le volume varie comme E/ΔT."),
        no("le même volume", "Si chaque litre stocke deux fois moins, combien de litres faut-il ?")),
    ] },
    rq: [null, "La masse volumique de l’eau change-t-elle de façon notable entre 40 et 50 °C ?", "La puissance stockée et la durée ont-elles changé pendant l’essai ?"],
    indices: ["Q = m·c·ΔT : qu’est-ce qui a changé ?", "Même Q et ΔT divisé par 2 : la masse d’eau double."],
    reformule: { q: "Avec vos mots : pourquoi un ballon qui travaille sur un plus faible écart doit-il être plus gros ?", modele: "Chaque litre stocke une énergie proportionnelle à ΔT : avec deux fois moins d’écart, il faut deux fois plus de litres pour la même énergie." },
    questions: ["La consommation est double pour la même chaleur utile : quel indicateur relie chaleur produite et électricité consommée ?", "Un COP saisonnier de 1,5 est-il crédible pour une PAC bien réglée ?"],
  };

  S.aera = {
    why: [
      [{ k: "lineaire", t: "Deux fois plus de gaine, deux fois plus de pertes de pression", faux: true }],
      [{ k: "singulier", t: "Coudes, grilles et filtre ne changent pas avec la longueur" }],
      [{ k: "debit", t: "Même débit, même puissance", faux: true }],
    ],
    relance: { defaut: [
      Q("La perte de pression d’un réseau a deux parts. Laquelle dépend de la longueur ?",
        ok("Les pertes linéaires, le long des gaines", "Elles doublent avec la longueur."),
        no("Les pertes dans les coudes, grilles et filtre", "Un filtre perd-il plus de pression si la gaine qui le suit est plus longue ?")),
      Q("Avec 90 Pa de singularités qui ne bougent pas, la perte totale…",
        ok("augmente, sans doubler", "Seule la part linéaire double."),
        no("double", "Les 90 Pa des singularités ont-ils doublé ?")),
      Q("Même débit, mais plus de pression à fournir : la puissance du ventilateur…",
        ok("augmente avec ΔP", "P = q·ΔP/η."),
        no("ne change pas", "P = q·ΔP/η : si ΔP augmente, que fait P ?")),
    ] },
    rq: [null, "Le rendement η a-t-il bougé pendant l’essai ?", "Le débit est-il imposé dans cet atelier ?"],
    indices: ["Séparez ΔP en une part linéaire (J·L) et une part singulière.", "Seule J·L double ; les 90 Pa des singularités restent."],
    reformule: { q: "Avec vos mots : pourquoi doubler la longueur des gaines ne double-t-il pas la puissance du ventilateur ?", modele: "Seules les pertes linéaires doublent ; les pertes singulières (coudes, grilles, filtre) restent. ΔP, et donc P = q·ΔP/η, augmente sans doubler." },
    questions: ["Débit ordinaire, mais plus de 300 W : la pression à fournir est-elle normale ?", "Un filtre colmaté ou un registre resté fermé ajoute quel type de perte ?"],
  };

  S.acou = {
    why: [
      [{ k: "addition", t: "Les décibels s’additionnent comme des nombres ordinaires", faux: true }],
      [{ k: "log", t: "Deux fois plus d’énergie sonore ajoute 3 dB" }],
      [{ k: "plus6", t: "Deux sources doublent la pression acoustique, donc +6 dB", faux: true }],
    ],
    relance: { defaut: [
      Q("L’échelle des décibels est-elle linéaire ou logarithmique ?",
        ok("Logarithmique : +10 dB, c’est 10 fois plus d’énergie", "On ne peut donc pas additionner des décibels directement."),
        no("Linéaire", "Si 70 + 70 faisaient 140 dB, deux machines seraient-elles plus bruyantes qu’un avion au décollage ?")),
      Q("Deux machines identiques et indépendantes rayonnent deux fois plus d’énergie qu’une seule. En décibels, cela ajoute…",
        ok("10·log 2 ≈ 3 dB", "70 dB + 70 dB ≈ 73 dB."),
        no("6 dB", "Deux sources indépendantes doublent l’énergie, pas l’amplitude de pression : 10·log 2 ou 20·log 2 ?"),
        no("rien", "Deux machines font-elles exactement le même bruit qu’une seule ?")),
      Q("Une source de 60 dB s’ajoute à une de 70 dB. Le total vaut environ…",
        ok("70,4 dB", "La plus faible n’ajoute presque rien : on traite d’abord la source dominante."),
        no("130 dB", "60 dB, c’est 10 fois moins d’énergie que 70 dB : combien ajoute-t-elle ?")),
    ] },
    rq: [null, "Des bruits de machines différentes s’annulent-ils de façon régulière ?", "L’oreille plafonne-t-elle ? Montez les deux sources à 90 dB."],
    indices: ["Revenez aux énergies : additionnez-les, puis repassez en décibels.", "L = 10·log(10<sup>L1/10</sup> + 10<sup>L2/10</sup>)."],
    reformule: { q: "Avec vos mots : pourquoi deux sources de 70 dB ne font-elles que 73 dB ?", modele: "Les décibels sont logarithmiques : deux sources égales doublent l’énergie sonore, ce qui ajoute 10·log 2 ≈ 3 dB." },
    questions: ["45 dB reçus à travers une cloison : la cloison arrête-t-elle assez de bruit ?", "Quelle grandeur dit de combien de décibels la cloison affaiblit le son ?"],
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
 "ete": [
  [],
  [
   {
    "k": "x-bloque",
    "t": "Un vitrage récent bloque tout le rayonnement solaire",
    "faux": true
   },
   {
    "k": "x-air-ext",
    "t": "Le soleil chauffe l’air extérieur, pas l’intérieur",
    "faux": true
   }
  ],
  [
   {
    "k": "x-ampoule",
    "t": "Une personne dégage moins qu’une ampoule",
    "faux": true
   },
   {
    "k": "x-ordi",
    "t": "Les ordinateurs modernes ne chauffent plus",
    "faux": true
   }
  ]
 ],
 "inertie": [
  [
   {
    "k": "x-masse-seule",
    "t": "Seule la masse donne de l’inertie, quel que soit le matériau",
    "faux": true
   },
   {
    "k": "x-leger-vite",
    "t": "Un matériau léger laisse passer la chaleur plus vite",
    "faux": true
   }
  ],
  [
   {
    "k": "x-a-faible",
    "t": "La fibre de bois conduit si peu que la chaleur s’y propage lentement"
   }
  ],
  [
   {
    "k": "x-meme-retard",
    "t": "Même épaisseur, même retard, quel que soit le matériau",
    "faux": true
   },
   {
    "k": "x-couleur",
    "t": "Le déphasage dépend surtout de la couleur du mur",
    "faux": true
   }
  ]
 ],
 "bepos": [
  [
   {
    "k": "x-mcdt",
    "t": "Chaque litre stocke moins d’énergie quand l’écart de température est plus petit"
   },
   {
    "k": "x-refroidir",
    "t": "Un écart plus faible demande plus d’eau pour refroidir le ballon",
    "faux": true
   }
  ],
  [
   {
    "k": "x-moins-energie",
    "t": "Un écart plus faible demande moins d’énergie",
    "faux": true
   },
   {
    "k": "x-suit",
    "t": "Le volume suit l’écart de température",
    "faux": true
   }
  ],
  [
   {
    "k": "x-energie-seule",
    "t": "Le volume d’un ballon ne dépend que de l’énergie stockée",
    "faux": true
   },
   {
    "k": "x-toutes-temp",
    "t": "L’eau stocke la même énergie à toutes les températures",
    "faux": true
   }
  ]
 ],
 "aera": [
  [
   {
    "k": "x-frottement-tout",
    "t": "Toute la pression du ventilateur sert au frottement dans les gaines",
    "faux": true
   },
   {
    "k": "x-longueur",
    "t": "La puissance suit la longueur du réseau",
    "faux": true
   }
  ],
  [
   {
    "k": "x-part-lineaire",
    "t": "Seule la part des pertes linéaires double, le reste ne bouge pas"
   },
   {
    "k": "x-rendement",
    "t": "Le ventilateur gagne en rendement quand il travaille plus",
    "faux": true
   }
  ],
  [
   {
    "k": "x-debit-seul",
    "t": "La puissance d’un ventilateur ne dépend que du débit",
    "faux": true
   },
   {
    "k": "x-glisse",
    "t": "L’air ne frotte pas sur les parois des gaines",
    "faux": true
   }
  ]
 ],
 "acou": [
  [
   {
    "k": "x-deux-fois",
    "t": "Deux machines, deux fois plus de décibels",
    "faux": true
   },
   {
    "k": "x-somme",
    "t": "Le niveau total est la somme des niveaux",
    "faux": true
   }
  ],
  [
   {
    "k": "x-log",
    "t": "Les décibels suivent une échelle logarithmique, pas une addition simple"
   },
   {
    "k": "x-par-machine",
    "t": "On ajoute 3 dB par machine, quels que soient leurs niveaux",
    "faux": true
   }
  ],
  [
   {
    "k": "x-percu",
    "t": "Deux sources doublent le niveau perçu, soit +6 dB",
    "faux": true
   },
   {
    "k": "x-phase",
    "t": "Les bruits de deux machines s’additionnent toujours en phase",
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
