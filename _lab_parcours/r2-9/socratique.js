/* =====================================================================
   R2-9 · relances socratiques scriptées (thermique des parois)
   Conceptions erronées visées : le « froid » entre dans le mur ; le béton lourd isole ; la surface
   est à la température de l'air ; la consommation suit U du mur seul ; le pare-vapeur se pose côté
   froid ; lourd veut dire retard ; isoler par l'extérieur baisse U.
   Structure : voir _lab_parcours/r1-10/socratique.js. Données génériques.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const S = {};
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });

  S.cond = {
    why: [
      [{ k: "resistance", t: "La résistance de l’isolant double, et c’est lui qui fait presque tout" }, { k: "exact", t: "Le flux est toujours inversement proportionnel à l’épaisseur d’isolant", faux: true }],
      [{ k: "carre", t: "L’effet de l’épaisseur est au carré", faux: true }],
      [{ k: "beton", t: "Le béton, lourd et épais, isole l’essentiel", faux: true }],
    ],
    relance: {
      defaut: [
        Q("Dans la paroi, où se fait la plus grande chute de température ?",
          ok("Dans l’isolant", "C’est donc lui qui porte l’essentiel de la résistance."),
          no("Dans le béton", "Regardez le profil de température : sur quelle couche la pente est-elle la plus forte ?")),
        Q("Les résistances des couches s’additionnent, avec R = e/λ pour chacune. Doubler l’épaisseur d’isolant…",
          ok("double sa résistance", "Les autres couches gardent la leur."),
          no("quadruple sa résistance", "Dans R = e/λ, l’épaisseur apparaît-elle au carré ?")),
        Q("Le flux vaut ΔT/R<sub>total</sub>. Si l’isolant fait presque tout R<sub>total</sub>, le flux est…",
          ok("presque divisé par 2", "Presque, car le béton et les échanges de surface gardent leur petite résistance."),
          no("divisé par 4", "Si R<sub>total</sub> double, que devient ΔT/R<sub>total</sub> ?")),
      ],
      exact: [
        Q("Le flux a-t-il été divisé exactement par 2 ?",
          ok("Un peu moins : les autres couches gardent leur résistance", "R<sub>total</sub> = 2·R<sub>isolant</sub> + R<sub>reste</sub> : un peu moins que le double."),
          no("Exactement par 2", "Regardez φ avant et après : le rapport vaut-il exactement 2 ?")),
      ],
    },
    rq: [null, "La conductivité λ est une propriété du matériau : change-t-elle si l’on en pose davantage ?", "Dans R = e/λ, l’épaisseur apparaît-elle au carré ?"],
    indices: ["Additionnez les résistances des couches avant et après.", "R<sub>mat</sub> passe de 1,88 à 3,66 m²·K/W : un peu moins que le double."],
    reformule: { q: "Avec vos mots : pourquoi doubler l’isolant ne divise-t-il pas exactement le flux par 2 ?", modele: "Les résistances s’additionnent : seule celle de l’isolant double, celles du béton et des surfaces restent. R<sub>total</sub> fait un peu moins que doubler." },
    questions: ["Le flux est deux fois et demie trop fort avec l’épaisseur prévue : quelle propriété de l’isolant a pu se dégrader ?", "Un isolant tassé ou humide conduit-il plus ou moins la chaleur ?"],
  };

  S.surf = {
    why: [
      [{ k: "air-piece", t: "La surface prend la température de l’air de la pièce", faux: true }],
      [{ k: "chute-rsi", t: "Le flux, fort, crée une chute de température dans l’air contre le mur" }],
      [{ k: "froid", t: "Le froid du dehors traverse le mur jusqu’à la surface", faux: true }],
    ],
    relance: { defaut: [
      Q("Entre l’air de la pièce et la surface du mur se trouve une fine lame d’air, de résistance R<sub>si</sub>. Quand la chaleur la traverse, la température…",
        ok("baisse un peu entre l’air et la surface", "Cette chute vaut φ · R<sub>si</sub>."),
        no("reste la même des deux côtés", "Une résistance traversée par un flux peut-elle avoir la même température de chaque côté ?")),
      Q("Un mur qui isole mal laisse passer un flux…",
        ok("plus fort, donc une chute φ·R<sub>si</sub> plus grande", "C’est pourquoi la surface est froide."),
        no("plus faible", "Moins de résistance, plus de chaleur qui passe : dans quel sens varie φ ?")),
      Q("Le froid « entre-t-il » dans le mur ?",
        ok("Non : c’est la chaleur qui sort, de l’intérieur vers l’extérieur", "On raisonne toujours en flux de chaleur, du chaud vers le froid."),
        no("Oui, le froid se propage", "Le froid est-il une grandeur qui se transporte, ou un manque de chaleur ?")),
    ] },
    rq: [null, "Le mur laisse-t-il passer de l’air, ou de la chaleur par conduction ?", "R<sub>si</sub> décrit l’échange entre l’air et la surface : a-t-elle changé pendant l’essai ?"],
    indices: ["Suivez le profil de température : que se passe-t-il juste contre la face intérieure ?", "T<sub>si</sub> = T<sub>int</sub> − φ·R<sub>si</sub> : plus φ est grand, plus T<sub>si</sub> baisse."],
    reformule: { q: "Avec vos mots : pourquoi la surface d’un mur mal isolé est-elle froide ?", modele: "Le flux de chaleur, plus fort, traverse aussi la lame d’air intérieure : la chute φ·R<sub>si</sub> grandit et la surface se rapproche de la température extérieure." },
    questions: ["La buée apparaît sur la surface intérieure. Quelle couche de la paroi fixe surtout le flux ?", "L’isolant prévu n’a jamais été posé : quelle commande représente la résistance du mur ?"],
  };

  S.bilan = {
    why: [
      [{ k: "proportion", t: "La consommation est proportionnelle à U du mur", faux: true }],
      [{ k: "part", t: "Le mur n’est qu’une partie des déperditions" }],
      [{ k: "ponts", t: "Les ponts thermiques font l’essentiel des pertes", faux: true }],
    ],
    relance: { defaut: [
      Q("Par où le bâtiment perd-il sa chaleur ?",
        ok("Par les murs, les vitrages et les ponts thermiques", "H<sub>tot</sub> est la somme de ces trois postes."),
        no("Seulement par les murs", "Regardez la répartition des pertes : quels autres postes apparaissent ?")),
      Q("Le mur pèse environ 41 % de H<sub>tot</sub>. Diviser U<sub>mur</sub> par 2 retire donc…",
        ok("environ 20 % de H<sub>tot</sub>", "La moitié de 41 %."),
        no("50 % de H<sub>tot</sub>", "Les vitrages et les ponts ont-ils été divisés par 2, eux ?")),
      Q("Après l’isolation, la part des ponts thermiques dans les pertes…",
        ok("augmente", "Mieux on isole les murs, plus les jonctions pèsent."),
        no("diminue", "Les ponts n’ont pas changé, mais le total a baissé : que devient leur part ?")),
    ] },
    rq: [null, "Les DJU décrivent le climat : dépendent-ils de l’isolation ?", "Si U et la consommation n’étaient pas liés, l’énergie aurait-elle baissé du tout ?"],
    indices: ["Écrivez H<sub>tot</sub> = U<sub>mur</sub>·A<sub>mur</sub> + U<sub>vit</sub>·A<sub>vit</sub> + ponts.", "Seul le premier terme est divisé par 2 : il pesait 41 %."],
    reformule: { q: "Avec vos mots : pourquoi diviser U<sub>mur</sub> par 2 ne divise-t-il pas la consommation par 2 ?", modele: "Le mur n’est qu’un des postes de H<sub>tot</sub> : vitrages et ponts thermiques restent. On gagne la moitié de la part du mur, soit environ 20 %." },
    questions: ["Murs très bien isolés, et pourtant beaucoup de pertes : quels postes restent hors du mur ?", "Quelle commande représente les jonctions plancher/façade ?"],
  };

  S.glaser = {
    why: [
      [{ k: "bloque", t: "La vapeur, bloquée, s’accumule derrière le pare-vapeur", faux: true }],
      [{ k: "chute", t: "La vapeur perd sa pression en traversant le pare-vapeur, avant le point froid" }],
      [{ k: "temperature", t: "La condensation ne dépend que de la température", faux: true }],
    ],
    relance: { defaut: [
      Q("En hiver, d’où vient la vapeur d’eau qui condense dans le mur ?",
        ok("De l’air intérieur, plus chaud et plus humide", "Elle migre du côté chaud et humide vers le côté froid."),
        no("De l’extérieur", "En hiver, où la pression de vapeur est-elle la plus forte : dedans ou dehors ?")),
      Q("Dans une couche de grand S<sub>d</sub>, la pression de vapeur…",
        ok("chute fortement", "Comme la température chute dans une couche très isolante."),
        no("augmente", "S<sub>d</sub> est une résistance à la diffusion : en la traversant, la pression peut-elle monter ?")),
      Q("Avec le pare-vapeur côté chaud, la pression de vapeur à l’interface froide…",
        ok("reste sous la pression saturante", "Les courbes ne se croisent plus : pas de condensation."),
        no("dépasse la pression saturante", "Regardez P<sub>v</sub> et P<sub>sat</sub> à l’interface avec le pare-vapeur.")),
    ] },
    rq: [null, "Le pare-vapeur change-t-il la température de l’isolant ?", "La facilité de pose suffirait-elle à justifier une règle de l’art aussi stricte ?"],
    indices: ["Comparez le profil de P<sub>v</sub> avec et sans pare-vapeur.", "P<sub>v</sub> chute surtout dans les couches de grand S<sub>d</sub> : côté chaud, la chute a lieu avant le point froid."],
    reformule: { q: "Avec vos mots : pourquoi le pare-vapeur se pose-t-il côté chaud ?", modele: "La pression de vapeur chute surtout dans les couches de grand S<sub>d</sub> : côté chaud, le pare-vapeur la fait chuter avant que la vapeur atteigne la zone froide, où elle condenserait." },
    questions: ["Salle de douches à 80 % d’humidité : de quel côté de la paroi vient la vapeur ?", "Quelle couche devrait faire chuter la pression de vapeur côté chaud ?"],
  };

  S.dyn = {
    why: [
      [{ k: "vitesse", t: "L’onde de chaleur avance à vitesse fixe dans un matériau donné" }, { k: "poids", t: "Deux fois plus de masse, deux fois plus de retard", faux: true }],
      [{ k: "carre", t: "Le retard varie comme le carré de l’épaisseur", faux: true }],
      [{ k: "materiau", t: "Le déphasage dépend du matériau, pas de l’épaisseur", faux: true }],
    ],
    relance: {
      defaut: [
        Q("L’onde de chaleur du cycle jour/nuit avance dans le mur à une vitesse fixée par…",
          ok("le matériau, à travers sa diffusivité", "Pour un matériau donné, cette vitesse est fixe."),
          no("l’épaisseur du mur", "Si l’on coupait le mur en deux tranches, l’onde avancerait-elle plus vite dans chacune ?")),
        Q("À vitesse fixe, deux fois plus de chemin donne…",
          ok("deux fois plus de retard", "Le déphasage est proportionnel à l’épaisseur."),
          no("quatre fois plus de retard", "Pour une onde à vitesse fixe, le temps de parcours varie-t-il comme la distance ou comme son carré ?")),
        Q("Et l’amortissement de l’onde ?",
          ok("Il se renforce bien plus : il est élevé au carré", "Chaque tranche écrase l’onde du même facteur."),
          no("Il double, comme le déphasage", "Regardez A : est-il passé de x à 2x, ou de x à x² ?")),
      ],
      poids: [
        Q("Un matériau lourd mais très conducteur, comme l’acier, retarderait-il beaucoup l’onde ?",
          ok("Non : il la laisse passer vite", "C’est la diffusivité λ/(ρc<sub>p</sub>) qui compte, pas la masse seule."),
          no("Oui, il est très lourd", "Une casserole en acier chauffe-t-elle lentement ?")),
        Q("À matériau fixé, deux fois plus d’épaisseur donne…",
          ok("deux fois plus de retard", "La masse double aussi, mais c’est le chemin parcouru par l’onde qui compte."),
          no("quatre fois plus de retard", "Le temps de parcours d’une onde varie-t-il comme la distance ou comme son carré ?")),
      ],
    },
    rq: [null, "Un métal conduit très bien : retarde-t-il l’onde ?", "L’acier est très dense : retarde-t-il pour autant la chaleur ?"],
    indices: ["Comparez deux matériaux : l’un conduit bien, l’autre stocke beaucoup.", "a = λ/(ρc<sub>p</sub>) : faible conductivité et forte capacité ralentissent l’onde."],
    reformule: { q: "Avec vos mots : de quoi dépend le déphasage d’un mur ?", modele: "De son épaisseur et de la diffusivité a = λ/(ρc<sub>p</sub>) du matériau : l’onde avance plus lentement dans un matériau peu conducteur et à forte capacité, et le retard croît comme l’épaisseur." },
    questions: ["Le pic arrive presque sans retard sous la toiture-terrasse : la dalle est-elle épaisse ?", "Pour un béton donné, quelle commande fixe la durée de traversée de l’onde ?"],
  };

  S.rehab = {
    why: [
      [{ k: "ext-mieux", t: "Isoler par l’extérieur est plus efficace, donc U baisse", faux: true }],
      [{ k: "serie", t: "En série, l’ordre des couches ne change pas la somme des résistances" }],
      [{ k: "beton-chaud", t: "Le béton côté chaud perd plus de chaleur", faux: true }],
    ],
    relance: { defaut: [
      Q("U = 1/R<sub>total</sub>, et R<sub>total</sub> est la somme des résistances des couches. Changer l’ordre des couches change-t-il cette somme ?",
        ok("Non", "1 + 2 = 2 + 1 : U du mur courant ne change pas."),
        no("Oui", "Une addition dépend-elle de l’ordre des termes ?")),
      Q("Qu’est-ce qui change alors entre ITI et ITE ?",
        ok("Le traitement des planchers et la place de la masse du béton", "En ITE, l’isolant passe devant les nez de plancher et le béton reste côté intérieur."),
        no("Rien du tout", "Regardez la vue 3D au droit du plancher dans les deux cas.")),
    ] },
    rq: [null, "U a-t-il changé entre ITI et ITE dans votre essai ?", "Les ponts thermiques disparaissent-ils du calcul en ITE, ou deviennent-ils plus faibles ?"],
    indices: ["Comparez U, puis les ponts de plancher, dans les deux positions.", "U est le même ; en ITE, les planchers sont recouverts et la masse reste côté chaud."],
    reformule: { q: "Avec vos mots : si U ne change pas, pourquoi préfère-t-on souvent l’ITE ?", modele: "L’ordre des couches ne change pas U, mais l’ITE recouvre les nez de plancher (moins de ponts thermiques) et garde la masse du béton côté intérieur, utile en été." },
    questions: ["U du mur courant est bon, et pourtant des traces noires au droit des planchers : où passe la chaleur ?", "Quelle commande représente les pertes aux jonctions des planchers ?"],
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
 "cond": [
  [],
  [
   {
    "k": "x-double-effet",
    "t": "Plus d’isolant ralentit et réduit la chaleur : deux effets qui se multiplient",
    "faux": true
   },
   {
    "k": "x-beton-aussi",
    "t": "Doubler l’isolant divise aussi par 2 les pertes du béton",
    "faux": true
   }
  ],
  [
   {
    "k": "x-epais",
    "t": "Le béton est la couche la plus épaisse, donc la plus résistante",
    "faux": true
   },
   {
    "k": "x-condensation",
    "t": "L’isolant sert surtout à éviter la condensation",
    "faux": true
   }
  ]
 ],
 "surf": [
  [
   {
    "k": "x-mur-interieur",
    "t": "Un mur intérieur est toujours à la température de la pièce",
    "faux": true
   },
   {
    "k": "x-air-chauffe",
    "t": "L’air de la pièce réchauffe complètement la surface",
    "faux": true
   }
  ],
  [
   {
    "k": "x-entre-deux",
    "t": "La surface est entre l’intérieur et l’extérieur, plus près de l’intérieur car la lame d’air résiste peu"
   },
   {
    "k": "x-mi-chemin",
    "t": "Le mur se met toujours à mi-chemin entre dedans et dehors",
    "faux": true
   }
  ],
  [
   {
    "k": "x-tel-quel",
    "t": "Un mur peu isolé laisse passer le froid tel quel",
    "faux": true
   },
   {
    "k": "x-materiau",
    "t": "La surface prend la température du matériau extérieur",
    "faux": true
   }
  ]
 ],
 "bilan": [
  [
   {
    "k": "x-tout-divise",
    "t": "Diviser U par 2 divise toutes les pertes par 2",
    "faux": true
   },
   {
    "k": "x-mur-tout",
    "t": "Le mur fait presque toutes les pertes d’un bâtiment",
    "faux": true
   }
  ],
  [
   {
    "k": "x-inchanges",
    "t": "Vitrages, ponts thermiques et ventilation restent inchangés"
   },
   {
    "k": "x-rendement",
    "t": "Le rendement du chauffage limite le gain",
    "faux": true
   }
  ],
  [
   {
    "k": "x-toit",
    "t": "La chaleur part par le toit et les fenêtres, jamais par les murs",
    "faux": true
   },
   {
    "k": "x-u-compte-pas",
    "t": "U d’un mur ne compte pas dans la consommation",
    "faux": true
   }
  ]
 ],
 "glaser": [
  [
   {
    "k": "x-surpression",
    "t": "Le pare-vapeur crée une surpression dans le mur",
    "faux": true
   },
   {
    "k": "x-ailleurs",
    "t": "La vapeur contourne le pare-vapeur et s’accumule à l’interface",
    "faux": true
   }
  ],
  [
   {
    "k": "x-resistance-vapeur",
    "t": "Le pare-vapeur, très résistant à la vapeur, prend l’essentiel de la chute de pression"
   },
   {
    "k": "x-rechauffe",
    "t": "Le pare-vapeur réchauffe l’interface",
    "faux": true
   }
  ],
  [
   {
    "k": "x-temp-seule",
    "t": "Un pare-vapeur n’agit que sur la température",
    "faux": true
   },
   {
    "k": "x-traverse",
    "t": "La vapeur finit toujours par traverser, quoi qu’on mette",
    "faux": true
   }
  ]
 ],
 "dyn": [
  [],
  [
   {
    "k": "x-multiplient",
    "t": "Plus de masse et plus d’épaisseur : les deux effets se multiplient",
    "faux": true
   },
   {
    "k": "x-distance-masse",
    "t": "Deux fois plus de matière à chauffer sur deux fois plus de distance",
    "faux": true
   }
  ],
  [
   {
    "k": "x-isolation",
    "t": "L’épaisseur ne joue que sur l’isolation, pas sur le retard",
    "faux": true
   },
   {
    "k": "x-instantane",
    "t": "Le béton réagit instantanément à la chaleur",
    "faux": true
   }
  ]
 ],
 "rehab": [
  [
   {
    "k": "x-premier",
    "t": "L’isolant reçoit le froid en premier, il est donc plus efficace",
    "faux": true
   },
   {
    "k": "x-plus-ponts",
    "t": "En ITE il n’y a plus de pont thermique, donc U baisse",
    "faux": true
   }
  ],
  [
   {
    "k": "x-ponts-inertie",
    "t": "La position change les ponts thermiques et l’inertie, pas U du mur courant"
   },
   {
    "k": "x-rien",
    "t": "Même isolant, même épaisseur : rien ne change dans le bâtiment",
    "faux": true
   }
  ],
  [
   {
    "k": "x-beton-froid",
    "t": "Le béton exposé au froid conduit davantage",
    "faux": true
   },
   {
    "k": "x-humide",
    "t": "L’isolant extérieur prend l’humidité et isole moins",
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
