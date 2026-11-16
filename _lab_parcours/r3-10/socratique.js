/* =====================================================================
   R3-10 · relances socratiques scriptées (thermique réglementaire et énergie)
   Conceptions erronées visées : U dépend du local voisin ; l'air n'emporte pas de chaleur ;
   un DJU vaut un kWh ; l'étiquette DPE est la facture ; quelques centimètres d'isolant ne servent à rien ;
   la récupération porte sur tout le besoin ; une énergie chère allonge le temps de retour.
   Structure : voir _lab_parcours/r1-10/socratique.js. Données génériques.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const S = {};
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });

  S.trans = {
    why: [
      [{ k: "u-voisin", t: "U dépend de ce qui se trouve de l’autre côté du mur", faux: true }],
      [{ k: "ecart", t: "Le garage est moins froid : seul l’écart de température change" }],
      [{ k: "meme-mur", t: "Même mur, même déperdition", faux: true }],
    ],
    relance: { defaut: [
      Q("De quoi U dépend-il ?",
        ok("Des couches du mur : épaisseurs et matériaux", "C’est une propriété de la paroi."),
        no("Du climat de chaque côté", "Si l’on transportait le même mur dans une autre région, ses couches changeraient-elles ?")),
      Q("Le garage non chauffé est plus chaud que dehors. L’écart de température vu par le mur…",
        ok("est plus faible", "Le facteur b = 0,5 traduit cette réduction."),
        no("est le même", "La température du garage est-elle celle de l’extérieur ?")),
      Q("Φ = U·A·b·ΔT. Avec b = 0,5, le flux est…",
        ok("divisé par 2, U restant le même", "b corrige l’écart de température, pas la paroi."),
        no("inchangé", "Le facteur b multiplie-t-il le flux ?")),
    ] },
    rq: [null, "Le facteur b multiplie-t-il la surface du mur, ou l’écart de température ?", "Un même mur a-t-il un U différent par 0 °C et par 10 °C dehors ?"],
    indices: ["Séparez ce qui dépend de la paroi (U) et ce qui dépend des locaux (ΔT, b).", "Φ = U·A·b·ΔT : b corrige l’écart de température, pas la paroi."],
    reformule: { q: "Avec vos mots : pourquoi un mur sur garage perd-il moins sans que son U change ?", modele: "U ne dépend que des couches du mur ; le garage, plus chaud que dehors, réduit l’écart de température, ce que traduit le facteur b." },
    questions: ["Le matériau est le bon, mais U vaut 1,3 au lieu de 0,3 : quelle grandeur de la pose a pu manquer ?", "Pour un isolant donné, quelle commande fixe sa résistance R = e/λ ?"],
  };

  const v1 = Q("À 150 m³/h, la ventilation perd 0,34 × 150 ≈ 51 W/K. Que pèsent la transmission et les ponts ?",
    ok("120 + 16 = 136 W/K", "La ventilation pèse donc environ 27 % des pertes au départ."),
    no("Presque rien", "Les murs, vitrages et ponts ne perdent-ils pas de chaleur ?"));
  const v2 = Q("Doubler le débit ajoute 51 W/K, sur un total de 187 W/K. Les pertes augmentent donc…",
    ok("d’environ un quart", "Seule la part ventilation double."),
    no("de 100 %", "La transmission a-t-elle doublé, elle ?"));
  S.vent = {
    why: [
      [{ k: "double", t: "Deux fois plus d’air, deux fois plus de pertes", faux: true }],
      [{ k: "part", t: "La ventilation n’est qu’une partie des déperditions" }],
      [{ k: "air-leger", t: "L’air est trop léger pour emporter de la chaleur", faux: true }],
    ],
    relance: {
      defaut: [v1, v2],
      "air-leger": [
        Q("Un mètre cube d’air qui sort à 20 °C, remplacé par de l’air à 0 °C, emporte-t-il de la chaleur ?",
          ok("Oui : environ 1 200 J par kelvin", "C’est l’origine du coefficient 0,34 W·h/(m³·K)."),
          no("Non, l’air ne pèse rien", "Un mètre cube d’air pèse environ 1,2 kg : est-ce rien ?")),
        v1, v2,
      ],
    },
    rq: [null, "Un coefficient de sécurité tomberait-il exactement sur 0,34 ? D’où viendrait ce nombre ?", "Une part d’air renouvelé s’exprime en volumes par heure : les unités de 0,34 W·h/(m³·K) collent-elles ?"],
    indices: ["Pensez à l’énergie qu’il faut pour chauffer 1 m³ d’air de 1 K.", "ρc<sub>p</sub> ≈ 1,2 kg/m³ × 1 000 J/(kg·K) ≈ 1 200 J/(m³·K), divisé par 3 600 s pour passer à l’heure."],
    reformule: { q: "Avec vos mots : pourquoi doubler la ventilation n’augmente-t-il les pertes que d’un quart ?", modele: "Les pertes par ventilation (0,34·q) ne sont qu’une partie de H ; doubler le débit double cette seule part, qui pesait environ un quart du total." },
    questions: ["Enveloppe performante, et pourtant plus de 200 W/K : quel poste peut dépasser la transmission ?", "L’occupant entend la ventilation souffler en permanence : quelle commande est en cause ?"],
  };

  S.dju = {
    why: [
      [{ k: "proportion", t: "Le besoin est proportionnel aux DJU" }],
      [{ k: "un-pour-un", t: "Un DJU de plus, c’est un kWh de plus", faux: true }],
      [{ k: "maison", t: "Le besoin dépend de la maison, pas du climat", faux: true }],
    ],
    relance: { defaut: [
      Q("Un degré-jour, c’est un kelvin d’écart pendant 24 h. La maison perd H = 180 W par kelvin. Un DJU lui coûte…",
        ok("180 W × 24 h ≈ 4,3 kWh", "Chaque DJU coûte la même énergie à cette maison."),
        no("1 kWh", "Combien d’énergie perd-on à 180 W pendant 24 h ?")),
      Q("Passer de 2 200 à 3 200 DJU, soit +45 %, fait varier le besoin de…",
        ok("+45 %", "Besoin = H × DJU × 24 h : proportionnel aux DJU."),
        no("+1 000 kWh", "1 000 DJU de plus, à 4,3 kWh chacun, font-ils 1 000 kWh ?")),
    ] },
    rq: [null, "H dépend-il du climat, ou de la maison ?", "Essayez d’autres DJU : le rapport entre besoin et DJU reste-t-il le même ?"],
    indices: ["Écrivez le besoin comme H × DJU × 24 h.", "H est fixe : le besoin suit les DJU."],
    reformule: { q: "Avec vos mots : pourquoi le besoin de chauffage est-il proportionnel aux DJU ?", modele: "H donne la puissance perdue par kelvin d’écart ; les DJU additionnent ces kelvins sur la saison. Besoin = H × DJU × 24 h." },
    questions: ["Le climat est correct, le besoin est deux fois trop fort : quelle autre grandeur entre dans le calcul ?", "Des surfaces comptées deux fois gonflent quelle grandeur ?"],
  };

  S.dpe = {
    why: [
      [{ k: "facture", t: "Le facteur primaire change ce que l’on paie", faux: true }],
      [{ k: "convention", t: "Le facteur primaire est une convention de calcul, pas une consommation" }],
      [{ k: "reel", t: "L’étiquette reflète la consommation réelle, qui n’a pas bougé", faux: true }],
    ],
    relance: { defaut: [
      Q("Le compteur électrique compte-t-il de l’énergie primaire ou finale ?",
        ok("Finale : les kWh livrés au logement", "Ce sont eux qui sont facturés."),
        no("Primaire", "Le compteur sait-il comment l’électricité a été produite ?")),
      Q("L’étiquette classe l’énergie primaire par m², soit consommation finale × facteur ÷ surface. Si le facteur passe de 2,3 à 1,9…",
        ok("l’indicateur baisse et la classe peut s’améliorer, sans un kWh économisé", "L’étiquette dépend d’une convention ; la facture, du compteur."),
        no("rien ne change", "L’indicateur est multiplié par le facteur : baisse-t-il quand le facteur baisse ?")),
    ] },
    rq: [null, "Le compteur n’a pas bougé, et pourtant l’étiquette a changé : l’étiquette lit-elle le compteur ?", "Un besoin de chauffage calculé changerait-il sans travaux sur le logement ?"],
    indices: ["Distinguez énergie finale (compteur, facture) et énergie primaire (convention).", "Indicateur = consommation finale × facteur primaire ÷ surface."],
    reformule: { q: "Avec vos mots : pourquoi l’étiquette peut-elle s’améliorer sans baisse de facture ?", modele: "L’étiquette classe l’énergie primaire par m², c’est-à-dire la consommation finale multipliée par un facteur conventionnel. Changer ce facteur change l’étiquette, pas la facture." },
    questions: ["Consommation banale, et pourtant classe G : l’indicateur est divisé par quelle grandeur ?", "Une surface sous-estimée gonfle-t-elle ou réduit-elle l’indicateur ?"],
  };

  S.reno = {
    why: [
      [{ k: "mince", t: "2 cm, c’est trop peu pour changer grand-chose", faux: true }],
      [{ k: "resistance", t: "2 cm d’isolant ajoutent une résistance comparable à celle du mur ancien" }],
      [{ k: "tout", t: "Un isolant, même mince, fait presque tout le travail", faux: true }],
    ],
    relance: { defaut: [
      Q("Le mur ancien a U = 1,8, soit R ≈ 0,56 m²·K/W. Que valent 2 cm d’isolant à λ = 0,038 ?",
        ok("R ≈ 0,53 m²·K/W", "Presque autant que tout le mur ancien."),
        no("R ≈ 0,05 m²·K/W", "R = e/λ = 0,02/0,038 : refaites le calcul.")),
      Q("La résistance passe donc d’environ 0,56 à 1,09. U = 1/R passe de 1,8 à…",
        ok("environ 0,9, soit −50 %", "Les premiers centimètres rapportent beaucoup."),
        no("environ 1,6", "Que vaut 1/1,09 ?")),
      Q("14 cm ajoutent R ≈ 3,7. Pourquoi le gain n’est-il pas sept fois plus grand qu’avec 2 cm ?",
        ok("U varie comme 1/R : chaque centimètre gagne de moins en moins", "La courbe de U s’aplatit quand l’épaisseur augmente."),
        no("L’isolant épais est de moins bonne qualité", "λ est le même dans les deux cas : qu’est-ce qui change alors ?")),
    ] },
    rq: [null, "La conductivité λ de l’isolant est-elle différente entre 2 et 14 cm ?", "Un mur peut-il « absorber » une résistance thermique ?"],
    indices: ["Additionnez les résistances avant et après, puis inversez.", "U = 1/(R<sub>mur</sub> + e/λ) : la courbe s’aplatit quand e augmente."],
    reformule: { q: "Avec vos mots : pourquoi les premiers centimètres d’isolant sont-ils les plus efficaces ?", modele: "Les résistances s’additionnent et U = 1/R : chaque centimètre ajoute la même résistance, mais fait baisser U de moins en moins." },
    questions: ["Le mur garde U = 0,9 après une rénovation « performante » : quelle grandeur de l’isolant a été réduite ?", "Quelle commande règle la résistance ajoutée par l’isolant ?"],
  };

  S.sys = {
    why: [
      [{ k: "tout", t: "La double flux récupère 70 % de la chaleur du logement", faux: true }],
      [{ k: "part", t: "La récupération ne porte que sur la part ventilation" }],
      [{ k: "supprime", t: "La double flux supprime les pertes par ventilation", faux: true }],
    ],
    relance: { defaut: [
      Q("Sur quelles pertes la double flux agit-elle ?",
        ok("Seulement sur l’air extrait, soit la part ventilation", "Murs, vitrages et ponts ne passent pas par l’échangeur."),
        no("Sur toutes les pertes du logement", "La chaleur qui traverse un mur passe-t-elle par l’échangeur ?")),
      Q("Elle récupère 70 % d’une part qui pèse 25 % du besoin. Le gain total est donc…",
        ok("La récupération ne joue que sur la part des pertes due à l’air", "Le reste du besoin ne change pas."),
        no("25 %", "Récupère-t-elle 100 % de la chaleur de l’air extrait ?"),
        no("70 %", "70 % de quoi : de tout le besoin, ou de la part ventilation ?")),
    ] },
    rq: [null, "Un rendement réel plus faible tomberait-il pile sur 0,70 × 25 % ?", "Y a-t-il une PAC dans cette comparaison ?"],
    indices: ["Repérez la part du besoin qui passe par la ventilation.", "Gain = rendement de récupération × part ventilation."],
    reformule: { q: "Avec vos mots : pourquoi 70 % de récupération ne font-ils gagner que 18 % ?", modele: "La récupération ne porte que sur la part ventilation du besoin : 0,70 × 25 % ≈ 18 %. Les pertes par les parois ne changent pas." },
    questions: ["La PAC consomme presque comme un chauffage direct : quel indicateur dit combien de chaleur elle produit par kWh électrique ?", "Avec un COP proche de 1, à quoi ressemble la PAC ?"],
  };

  S.tri = {
    why: [
      [{ k: "cher", t: "Énergie plus chère, investissement plus long à rembourser", faux: true }],
      [{ k: "gain", t: "L’économie annuelle double, l’investissement reste le même" }],
      [{ k: "cop", t: "Le temps de retour ne dépend que de la performance de la PAC", faux: true }],
    ],
    relance: { defaut: [
      Q("La PAC évite des kWh chaque année. En euros, cette économie annuelle…",
        ok("double quand le prix double", "Même nombre de kWh évités, payés deux fois plus cher."),
        no("reste la même", "Un kWh économisé vaut-il plus quand l’électricité est plus chère ?")),
      Q("TRI = investissement ÷ économie annuelle. Si l’économie double…",
        ok("le TRI est divisé par 2", "Plus l’énergie est chère, plus vite l’investissement se rembourse."),
        no("le TRI double", "Diviser par un nombre deux fois plus grand donne-t-il plus ou moins ?")),
    ] },
    rq: [null, "Le COP dépend-il du prix de l’électricité ?", "Le coût d’achat a-t-il bougé pendant l’essai ?"],
    indices: ["Écrivez TRI = investissement ÷ gain annuel.", "Gain annuel = kWh économisés × prix du kWh."],
    reformule: { q: "Avec vos mots : pourquoi une énergie plus chère raccourcit-elle le temps de retour ?", modele: "Le gain annuel est proportionnel au prix de l’énergie ; le TRI, investissement divisé par ce gain, diminue d’autant." },
    questions: ["30 ans de retour pour une PAC : le gain annuel paraît-il normal ?", "Quelle commande fixe le nombre de kWh de chaleur produits par kWh électrique ?"],
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
 "trans": [
  [
   {
    "k": "x-moins-sollicite",
    "t": "Un mur moins sollicité devient plus isolant",
    "faux": true
   },
   {
    "k": "x-b-lambda",
    "t": "Le facteur b multiplie la conductivité des matériaux",
    "faux": true
   }
  ],
  [
   {
    "k": "x-couches",
    "t": "U ne dépend que des couches du mur ; b corrige l’écart de température"
   },
   {
    "k": "x-garage-isole",
    "t": "Le garage remplace la moitié de l’isolation du mur",
    "faux": true
   }
  ],
  [
   {
    "k": "x-rien-corriger",
    "t": "Un garage est un local comme un autre, il n’y a rien à corriger",
    "faux": true
   },
   {
    "k": "x-b-ventil",
    "t": "Le facteur b ne concerne que la ventilation",
    "faux": true
   }
  ]
 ],
 "vent": [
  [
   {
    "k": "x-essentiel",
    "t": "La ventilation fait l’essentiel des déperditions",
    "faux": true
   },
   {
    "k": "x-debit-tout",
    "t": "Tout le bilan dépend du débit d’air",
    "faux": true
   }
  ],
  [
   {
    "k": "x-calcul",
    "t": "Seule la part due à l’air renouvelé double, le reste des pertes ne change pas"
   },
   {
    "k": "x-quart",
    "t": "La ventilation fait toujours le quart des pertes",
    "faux": true
   }
  ],
  [
   {
    "k": "x-rechauffe",
    "t": "L’air froid se réchauffe tout seul en entrant",
    "faux": true
   },
   {
    "k": "x-parois",
    "t": "Seules les parois comptent dans un bilan thermique",
    "faux": true
   }
  ]
 ],
 "dju": [
  [
   {
    "k": "x-bati",
    "t": "Le bâti fixe les pertes par degré d’écart, le climat fixe le nombre de degrés cumulés"
   },
   {
    "k": "x-minimale",
    "t": "Le besoin suit la température minimale de la région",
    "faux": true
   }
  ],
  [
   {
    "k": "x-ajoute",
    "t": "On ajoute la différence de DJU au besoin",
    "faux": true
   },
   {
    "k": "x-kwh",
    "t": "Les DJU s’expriment en kWh",
    "faux": true
   }
  ],
  [
   {
    "k": "x-compense",
    "t": "L’isolation compense automatiquement le climat",
    "faux": true
   },
   {
    "k": "x-ete",
    "t": "Le climat ne change que le confort d’été",
    "faux": true
   }
  ]
 ],
 "dpe": [
  [
   {
    "k": "x-etiquette-facture",
    "t": "Une meilleure étiquette veut dire une facture plus basse",
    "faux": true
   },
   {
    "k": "x-primaire-facture",
    "t": "Le fournisseur facture l’énergie primaire",
    "faux": true
   }
  ],
  [
   {
    "k": "x-compteur",
    "t": "Le compteur mesure la même chose, seule la convention de calcul de l’étiquette change"
   },
   {
    "k": "x-renove",
    "t": "Changer la convention revient à rénover le logement",
    "faux": true
   }
  ],
  [
   {
    "k": "x-factures",
    "t": "Le DPE se calcule à partir des factures",
    "faux": true
   },
   {
    "k": "x-neuf",
    "t": "Un facteur conventionnel ne concerne que les logements neufs",
    "faux": true
   }
  ]
 ],
 "reno": [
  [
   {
    "k": "x-dix-cm",
    "t": "Une isolation efficace demande au moins 10 cm",
    "faux": true
   },
   {
    "k": "x-tasse",
    "t": "Un isolant mince se tasse et ne compte pas",
    "faux": true
   }
  ],
  [
   {
    "k": "x-calcul",
    "t": "Même mince, l’isolant résiste autant que tout le mur ancien"
   },
   {
    "k": "x-toujours-moitie",
    "t": "Tout isolant divise U par 2",
    "faux": true
   }
  ],
  [
   {
    "k": "x-bloque",
    "t": "Avec λ = 0,038, l’isolant bloque presque tout",
    "faux": true
   },
   {
    "k": "x-remplace",
    "t": "L’isolant remplace la résistance du mur ancien",
    "faux": true
   }
  ]
 ],
 "sys": [
  [
   {
    "k": "x-rendement-global",
    "t": "Le rendement de récupération s’applique à tout le bâtiment",
    "faux": true
   },
   {
    "k": "x-tout-besoin",
    "t": "La double flux réduit tout le besoin de 70 %",
    "faux": true
   }
  ],
  [
   {
    "k": "x-produit",
    "t": "La récupération ne joue que sur la part des pertes due à l’air"
   },
   {
    "k": "x-cinquieme",
    "t": "Une double flux économise toujours un cinquième",
    "faux": true
   }
  ],
  [
   {
    "k": "x-air-chaud",
    "t": "Avec une récupération, l’air neuf arrive déjà à 20 °C",
    "faux": true
   },
   {
    "k": "x-annule",
    "t": "Récupérer la chaleur annule la part ventilation",
    "faux": true
   }
  ]
 ],
 "tri": [
  [
   {
    "k": "x-ajoute",
    "t": "Le prix de l’énergie s’ajoute au coût de la PAC",
    "faux": true
   },
   {
    "k": "x-consomme",
    "t": "La PAC consomme de l’électricité, elle devient donc moins rentable",
    "faux": true
   }
  ],
  [
   {
    "k": "x-definition",
    "t": "On rembourse le même investissement avec des économies plus grosses"
   },
   {
    "k": "x-divise-cout",
    "t": "Un prix doublé divise aussi le prix d’achat de la PAC",
    "faux": true
   }
  ],
  [
   {
    "k": "x-appareil",
    "t": "Le temps de retour est une caractéristique de l’appareil",
    "faux": true
   },
   {
    "k": "x-prix-absent",
    "t": "Le prix de l’énergie n’intervient pas dans la rentabilité",
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
