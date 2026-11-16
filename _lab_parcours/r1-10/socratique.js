/* =====================================================================
   R1-10 · couche « tuteur socratique scripté » (sans IA)
   Chargé après parcours.js : enrichit window.LABV3_PARCOURS sans toucher aux contenus POE.
   Par atelier :
     why[option]      raisonnements proposés après la prédiction ({k, t, faux})
     relance[clé]     échange de questions si la prédiction ou son raisonnement ne tient pas
                      (clé = raisonnement choisi, sinon « defaut »)
     rq[option]       question en retour à la première mauvaise explication (étape 3)
     indices          indices gradués de l'étape 3, du plus ouvert au plus précis
     reformule        auto-explication libre, comparée à une formulation type
     questions        questions d'orientation du diagnostic, après un essai manqué
   Données génériques : aucune valeur du dossier noté.
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const S = {};
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });

  /* ---------- 01 · Débit, section, Reynolds ---------- */
  const d1 = {
    debit: Q("Le débit, c’est-à-dire le volume d’eau qui passe chaque seconde, a-t-il changé entre les deux tuyaux ?",
      ok("Non, il est resté à 0,4 L/s", "Le même volume passe donc chaque seconde dans une section plus grande."),
      no("Oui, il a augmenté avec le diamètre", "Qui fixe le débit : le tuyau, ou les usagers qui ouvrent leur robinet ? Regardez le curseur Q pendant votre essai.")),
    vitesse: Q("La section a été multipliée par 4 (elle varie comme D²). Pour faire passer le même volume chaque seconde, la vitesse de l’eau doit…",
      ok("être divisée par 4", "Le débit vaut v × S : si S est multipliée par 4, v est divisée par 4."),
      no("rester la même", "Si l’eau gardait sa vitesse dans une section 4 fois plus grande, combien d’eau passerait-il chaque seconde ?"),
      no("être multipliée par 4", "Plus de place pour le même volume : l’eau doit-elle se presser davantage, ou moins ?")),
    re: Q("Re = vD/ν. La vitesse est divisée par 4 et le diamètre multiplié par 2. Re est donc…",
      ok("divisé par 2", "Le gain sur D ne compense pas la perte sur v : Re diminue et l’écoulement se calme."),
      no("multiplié par 2", "Combinez les deux facteurs dans l’ordre : ÷ 4, puis × 2. Que reste-t-il ?"),
      no("inchangé", "÷ 4 et × 2 se compensent-ils vraiment ?")),
    quoi: Q("Dans Re = vD/ν, laquelle de ces grandeurs a vraiment diminué quand le tuyau a grossi ?",
      ok("La vitesse v", "C’est la chute de vitesse qui fait baisser Re. Les parois, elles, n’apparaissent pas dans la formule."),
      no("La viscosité ν", "ν dépend du fluide et de sa température. L’eau a-t-elle changé entre les deux essais ?"),
      no("Le diamètre D", "Le diamètre a augmenté. Que devient alors la vitesse, à débit égal ?")),
  };
  S.debit = {
    why: [
      [{ k: "plus-eau", t: "Plus de place, donc plus d’eau qui s’agite", faux: true }, { k: "gros-turb", t: "Les gros tuyaux sont toujours plus turbulents", faux: true }],
      [{ k: "vitesse", t: "L’eau va moins vite dans un tuyau plus large" }, { k: "parois", t: "Les parois sont plus loin, il y a moins de frottement", faux: true }],
      [{ k: "debit-seul", t: "Seul le débit décide du régime", faux: true }, { k: "meme-eau", t: "C’est la même eau, à la même température", faux: true }],
    ],
    relance: { defaut: [d1.debit, d1.vitesse, d1.re], parois: [d1.quoi, d1.re] },
    rq: [null, "La viscosité dépend-elle du fluide, ou du tuyau qui le contient ?", "Le curseur Q a-t-il bougé pendant votre essai ?"],
    indices: ["Écrivez la vitesse en fonction du débit et de la section.", "v = 4Q/(πD²) : que devient v quand D double ? Reportez-le dans Re = vD/ν."],
    reformule: { q: "Avec vos mots : pourquoi, à débit égal, un tuyau plus gros calme-t-il l’écoulement ?", modele: "À débit fixé, la vitesse varie comme 1/D² ; Re = vD/ν varie donc comme 1/D. Doubler le diamètre divise Re par 2." },
    questions: ["Le débit est imposé par les usagers. Parmi les commandes restantes, laquelle fixe la vitesse moyenne v = Q/S ?", "La viscosité change-t-elle la vitesse moyenne de l’eau ? Quelle commande reste alors ?"],
  };

  /* ---------- 02 · Fluides ---------- */
  const d2 = {
    change: Q("Qu’est-ce qui a changé quand vous avez déplacé le curseur μ ?",
      ok("Seulement la viscosité : ρ est restée à 1000 kg/m³", "La masse d’un litre de liquide n’a donc pas changé."),
      no("La viscosité et la masse volumique", "Regardez le curseur ρ pendant votre essai : a-t-il bougé ?")),
    archi: Q("La poussée d’Archimède vaut ρ·g·V, le poids du liquide déplacé. Avec ρ inchangée, cette poussée…",
      ok("ne change pas", "Le poids du cube ne change pas non plus : l’équilibre reste le même."),
      no("augmente, car le liquide est plus épais", "Où la viscosité apparaît-elle dans ρ·g·V ?")),
    role: Q("À quoi sert alors la viscosité ?",
      ok("À freiner le glissement entre couches de fluide (la flèche rouge des plaques)", "Elle règle la vitesse à laquelle un objet monte ou coule, pas l’endroit où il s’arrête."),
      no("À rien dans un écoulement", "Regardez la flèche rouge entre les plaques quand μ augmente : que représente-t-elle ?")),
    quoi: Q("L’additif a pourtant changé quelque chose dans le liquide. Quoi ?",
      ok("Sa viscosité, donc les frottements entre couches", "Le liquide a bien changé, mais cette propriété n’intervient pas dans la flottaison."),
      no("Rien du tout", "Regardez la flèche rouge des plaques quand μ augmente. Que mesure-t-elle ?")),
  };
  S.fluide = {
    why: [
      [{ k: "porte", t: "Un liquide épais porte mieux, comme du miel", faux: true }, { k: "epais-lourd", t: "Épais veut dire plus lourd", faux: true }],
      [{ k: "entraine", t: "Le liquide visqueux colle au cube et l’entraîne", faux: true }, { k: "pese", t: "Un liquide épais pèse davantage sur le cube", faux: true }],
      [{ k: "archimede", t: "La poussée d’Archimède dépend de la masse volumique du liquide" }, { k: "rien", t: "L’additif ne change rien d’important au liquide", faux: true }],
    ],
    relance: { defaut: [d2.change, d2.archi, d2.role], rien: [d2.quoi, d2.archi] },
    rq: [null, "Si l’on double la masse volumique sans toucher à μ, l’eau a-t-elle plus ou moins d’élan pour vaincre les frottements ?", "La flottaison et le régime d’écoulement répondent-ils à la même question ?"],
    indices: ["Re compare deux effets opposés : lesquels ?", "Re = ρvD/μ : regroupez ρ et μ en une seule grandeur."],
    reformule: { q: "Avec vos mots : quelle propriété décide de la flottaison, et laquelle du régime d’écoulement ?", modele: "La flottaison dépend de la masse volumique (d = ρ/ρ<sub>eau</sub>) ; le régime dépend de Re = vD/ν, où ν = μ/ρ réunit viscosité et masse volumique." },
    questions: ["Le cube témoin a la masse volumique de l’eau. Pour qu’il flotte, le liquide doit-il être plus ou moins dense que lui ?", "La viscosité joue-t-elle sur la flottaison ? Quelle commande reste alors ?"],
  };

  /* ---------- 03 · Hydrostatique ---------- */
  const d3 = {
    colonne: Q("En suivant le piézomètre de B, de combien la colonne d’eau a-t-elle baissé quand B est monté de 10 m ?",
      ok("D’environ 10 m", "Le haut des colonnes reste sur le même plan horizontal : ce que B gagne en altitude, il le perd en colonne."),
      no("Elle n’a pas bougé", "Comparez h = 0 m et h = 10 m : le haut de la colonne a-t-il bougé, ou est-ce B qui s’est rapproché de ce niveau ?"),
      no("D’environ 100 m", "La colonne peut-elle baisser de plus que la hauteur dont B est monté ?")),
    calcul: Q("Une colonne de 10 m d’eau exerce ρgh. Avec ρ ≈ 1000 kg/m³ et g ≈ 10 m/s², cela fait environ…",
      ok("100 000 Pa, soit 1 bar", "D’où le repère : 10 m d’eau valent environ 1 bar."),
      no("10 000 Pa, soit 0,1 bar", "Refaites le produit 1000 × 10 × 10."),
      no("1 000 000 Pa, soit 10 bar", "Refaites le produit 1000 × 10 × 10, sachant que 1 bar vaut 100 000 Pa.")),
    air: Q("Si la baisse venait de l’air, dépendrait-elle du liquide de la conduite ? Essayez ρ = 1200 kg/m³ et regardez P<sub>B</sub>.",
      ok("Oui : la baisse augmente avec la masse volumique du liquide", "C’est donc le poids de l’eau de la conduite qui compte. Sur 10 m, la pression de l’air ne varie que d’environ 0,001 bar."),
      no("Non : seule l’altitude compte", "Faites l’essai avec ρ = 1200 kg/m³ : P<sub>B</sub> reste-t-elle la même ?")),
  };
  S.hydro = {
    why: [
      [{ k: "repos", t: "Au repos, la pression est la même partout", faux: true }, { k: "relies", t: "Les deux points sont reliés par le même tuyau", faux: true }],
      [{ k: "colonne", t: "10 m d’eau pèsent environ 1 bar" }, { k: "air", t: "Plus haut, l’air est moins dense", faux: true }],
      [{ k: "bar-metre", t: "On perd environ 1 bar par mètre de dénivelé", faux: true }, { k: "dix-fois", t: "10 m plus haut, donc 10 fois moins de pression", faux: true }],
    ],
    relance: { defaut: [d3.colonne, d3.calcul], air: [d3.air, d3.calcul] },
    rq: [null, "Si la baisse était de 10 % par mètre, serait-elle la même en partant de 3 bar ou de 6 bar ? Est-ce ce que montre la colonne ?", "Avec un liquide plus dense, 10 m de colonne pèsent-ils autant ?"],
    indices: ["ΔP = ρgh : remplacez par les valeurs de l’eau.", "1000 × 9,81 × 10 ≈ 98 000 Pa. Combien de pascals dans 1 bar ?"],
    reformule: { q: "Avec vos mots : pourquoi gagner 10 m d’altitude coûte-t-il environ 1 bar ?", modele: "Au repos, la pression diminue de ρgh quand on monte ; pour l’eau, 10 m font environ 98 000 Pa, soit environ 1 bar." },
    questions: ["Le relief est imposé. Quelles commandes restent possibles ?", "D’où vient la pression du réseau au point de départ A ?"],
  };

  /* ---------- 04 · Bernoulli ---------- */
  const d4 = {
    vu: Q("Au col, la colonne du piézomètre a-t-elle monté ou baissé par rapport à l’entrée ?",
      ok("Elle a baissé", "La pression est donc plus faible au col qu’en amont."),
      no("Elle a monté", "Venturi activé, comparez le piézomètre du col à celui de l’entrée."),
      no("Je n’ai rien remarqué", "Venturi activé, poussez la vitesse au-delà de 2 m/s : la colonne du col reste-t-elle au niveau des autres ?")),
    vitesse: Q("Le débit est le même dans toute la conduite et la section est plus petite au col. La vitesse au col est donc…",
      ok("plus grande", "Même volume par seconde dans un passage plus étroit : l’eau accélère."),
      no("la même", "Même volume par seconde dans un passage plus étroit : l’eau peut-elle garder le même rythme ?"),
      no("plus petite", "Si l’eau ralentissait dans un passage plus étroit, combien d’eau passerait-il chaque seconde ?")),
    charge: Q("La ligne dorée H reste horizontale : la charge totale se conserve. Si la part de vitesse augmente, la part de pression…",
      ok("diminue d’autant", "La pression se transforme en vitesse au col, puis redevient pression en aval."),
      no("augmente aussi", "La somme H = P/(ρg) + v²/(2g) + z reste fixe : si un terme grandit, que doivent faire les autres ?")),
    surface: Q("Si seule la surface comptait, que verrait-on dans un rétrécissement où l’eau serait immobile ?",
      ok("La même pression qu’ailleurs : c’est le mouvement qui compte", "Au repos, la pression ne dépend pas du diamètre. C’est l’accélération de l’eau au col qui fait baisser la pression."),
      no("Une pression plus faible", "Venturi activé, ramenez la vitesse au minimum : la colonne du col baisse-t-elle encore ?")),
  };
  S.bernoulli = {
    why: [
      [{ k: "comprime", t: "L’eau est serrée dans le rétrécissement", faux: true }, { k: "bouchon", t: "Le rétrécissement fait bouchon", faux: true }],
      [{ k: "charge", t: "L’énergie de vitesse est prise sur la pression" }, { k: "surface", t: "Moins de surface, donc moins de pression", faux: true }],
      [{ k: "incomp", t: "L’eau est incompressible, sa pression ne bouge pas", faux: true }, { k: "debit", t: "Le débit est le même partout", faux: true }],
    ],
    relance: { defaut: [d4.vu, d4.vitesse, d4.charge], surface: [d4.surface, d4.charge] },
    rq: [null, "Si l’eau perdait de l’énergie au col, la ligne dorée H resterait-elle horizontale ?", "L’eau peut-elle changer de volume de façon visible sous quelques bars ?"],
    indices: ["Regardez la ligne dorée H : que fait-elle au col ?", "H = P/(ρg) + v²/(2g) + z est constante. Au col, quel terme augmente ?"],
    reformule: { q: "Avec vos mots : pourquoi la pression baisse-t-elle là où l’eau accélère ?", modele: "Sans frottement, la charge totale se conserve : au col, la charge de vitesse v²/(2g) augmente, donc la charge de pression diminue d’autant." },
    questions: ["Exprimez chaque mesure en mètres de charge. Laquelle pèse le plus dans H ?", "Pression et vitesse ont été mesurées sur place. Laquelle des trois valeurs a pu être recopiée d’un document ?"],
  };

  /* ---------- 05 · Pertes de charge linéaires ---------- */
  const d5 = {
    section: Q("Le débit est le même et le diamètre est divisé par 2. La section est divisée par…",
      ok("4", "La section d’un disque varie comme D²."),
      no("2", "La section vaut πD²/4 : que devient D² quand D est divisé par 2 ?")),
    vitesse: Q("Même débit dans une section 4 fois plus petite : la vitesse est multipliée par…",
      ok("4", "Le produit v × S doit rester égal au débit."),
      no("2", "Le débit vaut v × S. Si S est divisée par 4, de combien v doit-elle grandir pour garder le même produit ?")),
    formule: Q("h<sub>f</sub> = λ (L/D) v²/(2g). Avec v × 4 et D ÷ 2 (λ varie peu), h<sub>f</sub> est multipliée par…",
      ok("16 × 2 = 32", "Le carré de la vitesse donne 16, le terme L/D double : 32."),
      no("4 × 2 = 8", "Dans la formule, la vitesse apparaît-elle seule ou au carré ?"),
      no("16", "N’oubliez-vous pas le D au dénominateur de L/D ?")),
  };
  S.lineaire = {
    why: [
      [{ k: "prop-D", t: "Les pertes sont inversement proportionnelles au diamètre", faux: true }, { k: "v-double", t: "La vitesse double, donc les pertes doublent", faux: true }],
      [{ k: "v-x4", t: "La section est 4 fois plus petite, donc 4 fois plus de pertes", faux: true }, { k: "v2-double", t: "La vitesse double et les pertes suivent v²", faux: true }],
      [{ k: "complet", t: "Vitesse × 4, au carré × 16, et L/D doublé" }, { k: "d5", t: "J’ai retenu une loi en 1/D⁵" }],
    ],
    relance: { defaut: [d5.section, d5.vitesse, d5.formule] },
    rq: [null, "La rugosité absolue ε est-elle une propriété du matériau ou du diamètre ?", "Quand le tuyau a rétréci, les colonnes d’eau ont-elles monté ou baissé ?"],
    indices: ["Exprimez v en fonction de Q et de D, puis remplacez-la dans h<sub>f</sub>.", "v = 4Q/(πD²), donc v² varie comme 1/D⁴. Il reste le 1/D du terme L/D."],
    reformule: { q: "Avec vos mots : pourquoi un diamètre deux fois plus petit multiplie-t-il les pertes par environ 32 ?", modele: "À débit imposé, la vitesse est multipliée par 4, son carré par 16, et le terme L/D double : h<sub>f</sub> varie environ comme 1/D⁵." },
    questions: ["Débit et longueur sont imposés. Parmi les commandes restantes, laquelle agit le plus fortement sur les pertes ?", "Plus de 4 m/s à débit imposé : qu’est-ce qui fixe la vitesse quand le débit est donné ?"],
  };

  /* ---------- 06 · Pertes de charge singulières ---------- */
  const d6 = {
    vu: Q("Quand la vitesse a doublé, la colonne rouge h<sub>s</sub> a-t-elle doublé, ou grandi davantage ?",
      ok("Davantage, environ × 4", "La perte croît plus vite que la vitesse."),
      no("Elle a doublé", "Comparez la colonne rouge à 0,6 puis à 1,2 m/s : le rapport des hauteurs est-il 2 ?"),
      no("Elle n’a pas changé", "Les coudes sont les mêmes, mais l’eau qui les traverse a-t-elle la même énergie ?")),
    carre: Q("h<sub>s</sub> = ΣK · v²/(2g) et les K sont fixes. Si v est multipliée par 2, v² est multipliée par…",
      ok("4", "Les pertes singulières suivent le carré de la vitesse, comme les pertes linéaires."),
      no("2", "Que vaut (2v)² ?")),
  };
  S.singulier = {
    why: [
      [{ k: "prop-v", t: "Les pertes sont proportionnelles à la vitesse", faux: true }, { k: "chocs", t: "Deux fois plus de chocs sur les coudes", faux: true }],
      [{ k: "v2", t: "Les pertes suivent le carré de la vitesse" }, { k: "comme-lin", t: "C’est la même loi que pour les pertes linéaires" }],
      [{ k: "memes", t: "Les coudes sont les mêmes, leurs pertes aussi", faux: true }],
    ],
    relance: { defaut: [d6.vu, d6.carre] },
    rq: [null, "Le coefficient K d’un coude dépend-il de sa forme ou de la vitesse de l’eau ?", "Avez-vous touché au curseur du diamètre pendant l’essai ?"],
    indices: ["Dans h<sub>s</sub> = ΣK · v²/(2g), quelle grandeur a changé pendant l’essai ?", "Que vaut (2v)² ?"],
    reformule: { q: "Avec vos mots : pourquoi doubler la vitesse quadruple-t-il la perte dans les raccords ?", modele: "Les coefficients K des raccords sont fixes et h<sub>s</sub> = ΣK · v²/(2g) : doubler v multiplie v² par 4." },
    questions: ["Tés, vannes et vitesse sont imposés. Quelle commande vous reste ?", "Quel type de raccord est le plus nombreux dans ce tracé, et combien pèse-t-il dans ΣK ?"],
  };

  /* ---------- 07 · Pompe et HMT ---------- */
  const d7 = {
    besoin: Q("Additionnez ce dont l’abonné a besoin et ce que les conduites consomment en route. Combien de mètres de charge faut-il ?",
      ok("36 m", "28 m de besoin et 8 m de pertes."),
      no("28 m", "Les pertes en route sont-elles gratuites ?"),
      no("20 m", "Faut-il ajouter les pertes au besoin, ou les retrancher ?")),
    bilan: Q("Le réservoir offre 52 m de charge. Il manque donc…",
      ok("rien : il reste 16 m de marge", "La gravité suffit : la pompe ne démarre que si le bilan est déficitaire."),
      no("16 m, à fournir par une pompe", "Ces 16 m sont-ils un manque ou un surplus ?")),
    haut: Q("Si le réservoir n’offrait que 30 m de charge, l’eau arriverait-elle encore toute seule chez l’abonné ?",
      ok("Non : 30 m ne couvrent pas 28 + 8 = 36 m", "Ce n’est donc pas la hauteur seule qui décide, mais le bilan entre le besoin plus les pertes et la charge disponible."),
      no("Oui : le réservoir est toujours en hauteur", "Réglez la charge du réservoir à 30 m : la pompe reste-t-elle à l’arrêt ?")),
  };
  S.pompe = {
    why: [
      [{ k: "toujours", t: "Il faut toujours une pompe pour amener l’eau loin", faux: true }, { k: "pertes", t: "Les pertes doivent être compensées par une pompe", faux: true }],
      [{ k: "bilan", t: "52 m disponibles contre 28 + 8 = 36 m nécessaires" }, { k: "haut", t: "Le réservoir est en hauteur, l’eau descend toute seule", faux: true }],
      [{ k: "debit", t: "La puissance d’une pompe dépend du débit", faux: true }],
    ],
    relance: { defaut: [d7.besoin, d7.bilan], haut: [d7.haut] },
    rq: [null, "Si les pertes augmentent, la pompe doit-elle fournir plus, ou autant ?", "Le réservoir apporte déjà 52 m : la pompe doit-elle les fournir une seconde fois ?"],
    indices: ["Faites le bilan : ce qu’il faut (besoin + pertes) contre ce qu’on a (charge amont).", "HMT = besoin + pertes − charge disponible, quand ce nombre est positif."],
    reformule: { q: "Avec vos mots : que fournit une pompe dans un réseau ?", modele: "Elle fournit seulement la charge qui manque au bilan : HMT = besoin aval + pertes − charge disponible en amont." },
    questions: ["Débit et HMT sont imposés. Dans P<sub>élec</sub> = ρgQ · HMT/η, quel terme reste libre ?", "Avec un rendement de 35 %, quelle part de l’électricité devient de l’énergie hydraulique ?"],
  };

  /* ---------- 08 · Le réseau du Plateau ---------- */
  const d8 = {
    passif: Q("Que paie-t-on avec la solution passive, et combien de fois ?",
      ok("L’achat et la pose de la conduite, une seule fois", "Une conduite plus grosse ne consomme rien pour fonctionner."),
      no("De l’électricité chaque année", "Une conduite plus grosse a-t-elle besoin d’énergie pour fonctionner ?")),
    actif: Q("Et avec le surpresseur, que paie-t-on en plus de l’achat ?",
      ok("L’électricité et l’entretien, chaque année", "Et un renouvellement au bout d’une quinzaine d’années."),
      no("Rien après l’achat", "Une pompe tourne des heures chaque jour : avec quelle énergie ?")),
    verdict: Q("Le verdict sur 20 ans dépend donc…",
      ok("des chiffres : prix du kWh, coût des travaux, durée", "C’est ce que l’étape 4 vous fera explorer avec le prix de l’électricité."),
      no("toujours de la même façon", "Si le kWh devenait deux fois plus cher, le classement pourrait-il changer ?")),
  };
  S.reseau = {
    why: [
      [{ k: "pas-elec", t: "Une conduite ne consomme pas d’électricité", faux: true }],
      [{ k: "travaux", t: "Changer une conduite coûte trop cher en travaux", faux: true }],
      [{ k: "compare", t: "Achat d’un côté, achat + électricité + entretien de l’autre : il faut chiffrer" }],
    ],
    relance: { defaut: [d8.passif, d8.actif, d8.verdict], "pas-elec": [d8.passif, d8.actif, d8.verdict] },
    rq: [null, "Une pompe qui tourne a-t-elle besoin d’énergie ?", "Les pertes de charge chauffent très légèrement l’eau. Une pompe peut-elle récupérer cette chaleur ?"],
    indices: ["Listez les dépenses d’une pompe sur toute sa durée de vie.", "Achat, électricité à chaque heure de marche, entretien, renouvellement après 15 ans."],
    reformule: { q: "Avec vos mots : pourquoi compare-t-on les deux solutions sur 20 ans plutôt que sur le prix d’achat ?", modele: "La conduite se paie une fois ; le surpresseur se paie à l’achat puis chaque année en électricité et en entretien. Seul un cumul sur la durée de vie permet de comparer." },
    questions: ["Le surpresseur est refusé. Parmi les grandeurs du réseau, laquelle avez-vous le droit de changer pour réduire les pertes ?", "Avec Ø 80 mm, les pertes linéaires sont énormes. Quel levier les fait baisser le plus fortement ?"],
  };

  /* ---------- fusion dans les contenus du parcours ---------- */
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
 "singulier": [
  [],
  [],
  [
   {
    "k": "x-forme",
    "t": "Une perte singulière ne dépend que de la forme du coude",
    "faux": true
   },
   {
    "k": "x-k-fixe",
    "t": "Le coefficient K est fixe, donc la perte aussi",
    "faux": true
   }
  ]
 ],
 "pompe": [
  [],
  [],
  [
   {
    "k": "x-pertes-inconnues",
    "t": "Sans le débit, on ne peut pas connaître les pertes",
    "faux": true
   },
   {
    "k": "x-puissance",
    "t": "Il faut connaître la puissance avant de décider",
    "faux": true
   }
  ]
 ],
 "reseau": [
  [
   {
    "k": "x-pose",
    "t": "Une solution sans moteur ne coûte plus rien après la pose",
    "faux": true
   },
   {
    "k": "x-regle",
    "t": "Un tuyau plus gros règle le problème pour toujours",
    "faux": true
   }
  ],
  [
   {
    "k": "x-appareil",
    "t": "Un appareil coûte toujours moins cher que des travaux de voirie",
    "faux": true
   },
   {
    "k": "x-reglable",
    "t": "Un surpresseur se règle, donc il revient moins cher",
    "faux": true
   }
  ],
  [
   {
    "k": "x-electricite",
    "t": "L’électricité payée chaque année peut dépasser le surcoût des travaux"
   },
   {
    "k": "x-pareil",
    "t": "Sur 20 ans, les deux solutions finissent par coûter pareil",
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
