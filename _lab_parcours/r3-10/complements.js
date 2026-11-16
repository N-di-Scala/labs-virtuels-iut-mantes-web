/* R3-10 · compléments pédagogiques (structure décrite dans r1-1/complements.js) */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });
  const C = {};

  C.trans = {
    duree: 12,
    okT: "U ne dépend que de la paroi ; b corrige l’écart de température avec le local voisin",
    m: ["b s’applique à la surface de la paroi, qui compte alors pour moitié", "U dépend de la température du local voisin, que b vient fixer"],
    crit: ["U ne dépend que des couches de la paroi", "Le garage, plus chaud que dehors, réduit l’écart de température", "Le facteur b traduit cette réduction dans le flux"],
    variante: "Le même mur ne donne plus sur l’extérieur mais sur un garage non chauffé (b = 0,5). Qu’advient-il du bilan ?",
    transfert: Q("Un plancher bas donne sur un vide sanitaire (b = 0,7). Par rapport au même plancher sur l’extérieur, ses pertes sont…",
      ok("multipliées par 0,7, avec le même U", "Le vide sanitaire est moins froid que dehors : seul l’écart change."),
      no("les mêmes, U n’a pas changé", "U est le même, mais l’écart de température est plus faible."),
      no("calculées avec un U réduit de 30 %", "On corrige l’écart de température, pas U.")),
  };
  C.vent = {
    duree: 12,
    okT: "De la capacité thermique de l’air, ρc<sub>p</sub> ≈ 1 200 J/(m³·K), ramenée à l’heure",
    m: ["C’est un coefficient de sécurité réglementaire appliqué aux débits d’air", "C’est la part de l’air du logement renouvelée chaque heure en moyenne"],
    crit: ["Les pertes par ventilation valent 0,34 × q (q en m³/h)", "0,34 vient de ρc<sub>p</sub> de l’air, ramené à l’heure", "Doubler le débit double cette seule part de H"],
    variante: "Avec H<sub>tr</sub> = 120 W/K et 16 W/K de ponts thermiques, on fait passer le débit de ventilation de 150 à 300 m³/h. Les déperditions totales augmentent d’environ…",
    transfert: Q("Un débit d’air de 100 m³/h entre à 0 °C dans un logement à 20 °C. La puissance perdue vaut environ…",
      ok("680 W", "0,34 × 100 × 20 = 680 W."),
      no("34 W", "Il faut multiplier par l’écart de température."),
      no("2 000 W", "C’est oublier le facteur 0,34.")),
  };
  C.dju = {
    duree: 10,
    okT: "H fixe les watts perdus par kelvin ; les DJU cumulent ces kelvins sur la saison",
    m: ["Les DJU augmentent H, car un climat froid dégrade l’isolation des parois", "C’est une coïncidence des valeurs choisies dans cet exemple chiffré"],
    crit: ["H donne la puissance perdue par kelvin d’écart", "Les DJU additionnent ces écarts sur toute la saison", "Besoin = H × DJU × 24 h"],
    variante: "On construit la même maison dans une région plus froide, à 3 200 DJU au lieu de 2 200. Son besoin de chauffage…",
    transfert: Q("Un bâtiment (H = 200 W/K) passe d’un climat à 2 000 DJU à un climat à 2 500 DJU. Son besoin augmente de…",
      ok("25 %", "Le besoin est proportionnel aux DJU : 2 500 / 2 000 = 1,25."),
      no("500 kWh", "Un DJU n’est pas un kWh : il faut multiplier par H × 24 h."),
      no("rien, c’est le même bâtiment", "Le climat change l’écart cumulé, donc le besoin.")),
  };
  C.dpe = {
    duree: 10,
    okT: "L’énergie primaire par m² : la consommation finale multipliée par un facteur conventionnel",
    m: ["La consommation lue chaque année au compteur, divisée par la surface", "Le besoin de chauffage calculé, sans tenir compte du système installé"],
    crit: ["L’étiquette classe l’énergie primaire par m²", "Énergie primaire = consommation finale × facteur conventionnel", "Changer ce facteur change l’étiquette, pas la facture"],
    variante: "Un logement tout électrique consomme 12 000 kWh/an. La réglementation fait passer le coefficient d’énergie primaire de 2,3 à 1,9. Sa facture…",
    transfert: Q("Deux logements identiques consomment 10 000 kWh/an, l’un au gaz (f<sub>p</sub> = 1), l’autre à l’électricité (f<sub>p</sub> = 1,9). Leur étiquette énergie…",
      ok("est moins bonne pour le logement électrique", "19 000 kWh d’énergie primaire contre 10 000."),
      no("est la même, ils consomment pareil", "L’étiquette porte sur l’énergie primaire, pas finale."),
      no("est meilleure pour le logement électrique", "Le facteur 1,9 augmente l’énergie primaire.")),
  };
  C.reno = {
    duree: 12,
    okT: "Les résistances s’ajoutent et U = 1/R : chaque centimètre gagne de moins en moins",
    m: ["L’isolant mince est d’une meilleure qualité que celui posé en forte épaisseur", "Le mur ancien absorbe les premiers centimètres, qui isolent alors doublement"],
    crit: ["Les résistances s’additionnent : R augmente linéairement", "U = 1/R baisse de moins en moins vite", "Les premiers centimètres apportent le plus grand gain"],
    variante: "On colle seulement 2 cm d’isolant (λ = 0,038) sur un mur ancien de U = 1,8 W/(m²·K). Le coefficient U baisse d’environ…",
    transfert: Q("Un mur passe de 10 à 20 cm d’isolant, puis de 20 à 30 cm. Le second ajout fait baisser U…",
      ok("moins que le premier", "U = 1/R : chaque centimètre ajouté pèse moins sur U."),
      no("autant que le premier", "La résistance augmente autant, mais pas U, qui est l’inverse."),
      no("plus que le premier", "Les gains diminuent avec l’épaisseur.")),
  };
  C.sys = {
    duree: 12,
    okT: "La récupération ne porte que sur la part ventilation : 0,70 × 25 % ≈ 18 %",
    m: ["Le rendement réel est plus faible qu’annoncé, environ un quart de 70 %", "La pompe à chaleur consomme une partie du gain fourni par l’échangeur"],
    crit: ["La récupération ne concerne que la part ventilation du besoin", "Gain = rendement × part ventilation", "0,70 × 25 % ≈ 18 % ; les pertes par les parois ne changent pas"],
    variante: "La ventilation fait 25 % des pertes d’un logement. On installe une double flux qui récupère 70 % de la chaleur de l’air extrait. Le besoin de chauffage baisse d’environ…",
    transfert: Q("Un récupérateur sur eaux grises récupère 40 % de la chaleur des eaux de douche, qui pèsent 15 % de la consommation d’eau chaude. Le gain sur l’eau chaude est d’environ…",
      ok("6 %", "0,40 × 15 % = 6 %."),
      no("40 %", "La récupération ne porte que sur la part des douches."),
      no("15 %", "Seuls 40 % de cette part sont récupérés.")),
  };
  C.tri = {
    duree: 10,
    okT: "Le gain annuel suit le prix de l’énergie, et le temps de retour en est l’inverse",
    m: ["Le COP de la pompe à chaleur augmente quand l’électricité coûte plus cher", "L’investissement diminue, car les aides suivent le prix de l’énergie"],
    crit: ["Temps de retour = investissement ÷ gain annuel", "Le gain annuel est proportionnel au prix de l’énergie", "Doubler le prix divise le temps de retour par 2"],
    variante: "Le prix de l’électricité passe de 0,20 à 0,40 €/kWh, toutes choses égales par ailleurs. Le temps de retour sur investissement de la pompe à chaleur…",
    transfert: Q("Une isolation coûte 10 000 € et économise 800 €/an. Si l’on obtient une aide de 4 000 €, le temps de retour passe…",
      ok("de 12,5 à 7,5 ans", "6 000 € / 800 € = 7,5 ans."),
      no("de 12,5 à 5 ans", "L’aide réduit l’investissement de 40 %, pas de 60 %."),
      no("de 12,5 ans à 12,5 ans", "L’investissement baisse, donc le temps de retour aussi.")),
  };

  // équilibrage des longueurs : la bonne explication ne doit pas se repérer à sa longueur
  C.trans.m[1] = "U dépend de la température du local voisin, que le facteur b vient fixer à mi-chemin de l’extérieur";
  C.dju.m[0] = "Les DJU augmentent H, car un climat plus froid dégrade la performance de l’isolation des parois";
  C.dpe.m[0] = "La consommation relevée chaque année au compteur électrique, divisée par la surface habitable";
  C.tri.m[0] = "Le COP de la pompe à chaleur augmente quand l’électricité coûte plus cher, ce qui raccourcit le retour";

  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
  const near = (a, b, e = 0.02) => Math.abs(a - b) <= e;

  C.trans.variants = [{
    story: "Variante audit : la cloison isolée (`12 cm`, `λ = 0,038`) sépare le séjour d’un garage fermé non chauffé (`b_LNC` réel = `0,50`), mais le thermicien a laissé `b_LNC = 1,00` comme s’il donnait dehors (`A = 25 m²`, `ΔT = 25 K`).",
    preset: { eiso1: 12, liso1: 0.038, esup: 20, lsup: 1.75, A1: 25, dT1: 25, bLNC: 1.0 },
    culprit: "bLNC",
    symptom: "La puissance de déperdition calculée sur cette paroi est doublée par erreur.",
    target: (c) => near(c.v("bLNC"), 0.5, 0.06) && c.v("eiso1") === 12 && c.v("A1") === 25,
    targetTxt: "facteur de réduction b_LNC ajusté autour de 0,50 sur local tampon",
    now: (c) => `b<sub>LNC</sub> = ${f(c.v("bLNC"), 2)} · Φ = ${f(c.v("bLNC") * c.out.U * c.v("A1") * c.v("dT1"), 0)} W`,
    hint: "La composition du mur est exacte : regardez la nature du volume situé derrière la paroi.",
    explain: "Une paroi donnant sur un local non chauffé subit un écart de température réduit, pris en compte par `b_LNC < 1`.",
  }];
  C.vent.variants = [{
    story: "Variante audit : la VMC hygroréglable est bien réglée (`Q_v = 105 m³/h`, `H_tr = 60 W/K`), mais `45 m` de balcons filants sans rupteurs créent `Ψ = 0,95 W/(m·K)`. Posez des rupteurs thermiques pour ramener `H_bat ≤ 110 W/K`.",
    preset: { Htr: 60, Qv: 105, Psi: 0.95, Lpt: 45, dT2: 26 },
    culprit: "Psi",
    symptom: "Les ponts linéiques ajoutent plus de 42 W/K malgré des murs et une VMC sobres.",
    target: (c) => c.out.H <= 110 && c.v("Htr") === 60 && c.v("Qv") === 105 && c.v("Lpt") === 45,
    targetTxt: "H_bat ≤ 110 W/K en traitant le coefficient linéique Ψ (≤ 0,30 W/(m·K))",
    now: (c) => `H<sub>bat</sub> = ${f(c.out.H, 0)} W/K · Ψ = ${f(c.v("Psi"), 2)}`,
    hint: "La ventilation est déjà optimisée : observez l’épaisseur incandescente des arêtes de ponts thermiques.",
    explain: "Sur un bâtiment bien isolé et bien ventilé, les balcons et nez de dalle non traités deviennent le premier poste de fuite.",
  }];
  C.dju.variants = [{
    story: "Variante audit : l’enveloppe (`H_bat = 140 W/K`) et la station météo (`DJU = 2 200 K·j`, `T_ext = 2 °C`) sont exactes, mais l’occupant chauffe tout l’hiver à `24 °C` au lieu des `19 °C` conventionnels.",
    preset: { Hbat3: 140, Tcons: 24, Text3: 2, DJU: 2200 },
    culprit: "Tcons",
    symptom: "L’appel de puissance par jour froid dépasse 3,0 kW au lieu de 2,38 kW à 19 °C.",
    target: (c) => c.v("Tcons") <= 19.5 && c.v("Hbat3") === 140 && c.v("DJU") === 2200,
    targetTxt: "consigne ramenée à ≤ 19,5 °C sur le même pavillon",
    now: (c) => `T<sub>cons</sub> = ${f(c.v("Tcons"), 1)} °C · Φ = ${f(c.v("Hbat3") * Math.max(0, c.v("Tcons") - c.v("Text3")) / 1000, 2)} kW`,
    hint: "Ni les murs ni la météo n’ont changé : vérifiez le thermostat d’ambiance.",
    explain: "Chaque degré de consigne supplémentaire augmente directement `ΔT` et alourdit la facture de chauffage d’environ 7 %.",
  }];
  C.dpe.variants = [{
    story: "Variante audit : la maison de `100 m²` est chauffée au bois-granulés (`C_ef = 15 000 kWh/an`), mais l’auditeur a laissé le facteur d’énergie primaire de l’électricité (`f_p = 2,3`) au lieu de `1,0` pour un combustible.",
    preset: { Cef: 15000, Shab: 100, fp: 2.3 },
    culprit: "fp",
    symptom: "Le logement écope d’une classe F (345 kWh_ep/m²·an) au lieu d’une classe C (150 kWh_ep/m²·an).",
    target: (c) => c.out.ind <= 180 && c.v("Cef") === 15000 && c.v("Shab") === 100 && near(c.v("fp"), 1.0, 0.05),
    targetTxt: "classe C rétablie avec le facteur réglementaire f_p = 1,0",
    now: (c) => `classe ${c.out.L} (${f(c.out.ind, 0)} kWh<sub>ep</sub>/m²·an)`,
    hint: "Surface et consommation finale sont exactes : contrôlez le facteur de conversion en énergie primaire f_p.",
    explain: "En DPE, `C_ep = f_p × C_ef` : confondre `f_p = 2,3` (électricité) et `f_p = 1,0` fait sauter deux classes d’étiquette.",
  }];
  C.reno.variants = [{
    story: "Variante audit : `12 cm` d’isolant sont bien prévus sur le mur ancien (`U₀ = 1,8 W/(m²·K)`), mais un isolant dégradé/humide (`λ = 0,090 W/(m·K)`) est resté saisi à la place d’une laine certifiée ACERMI (`λ ≤ 0,038`).",
    preset: { strat: "ite", eiso5: 12, liso5: 0.09, U0: 1.8 },
    culprit: "liso5",
    symptom: "Malgré 12 cm posés en ITE, `U₁` plafonne à 0,53 W/(m²·K) au lieu de ≤ 0,28.",
    target: (c) => c.out.U1 <= 0.28 && c.v("eiso5") === 12 && near(c.v("U0"), 1.8, 0.05),
    targetTxt: "U₁ ≤ 0,28 W/(m²·K) à 12 cm grâce à un λ certifié ≤ 0,038",
    now: (c) => `U₁ = ${f(c.out.U1, 3)} W/(m²·K)`,
    hint: "L’épaisseur de 12 cm est suffisante : vérifiez la conductivité thermique λ de l’isolant retenu.",
    explain: "À épaisseur identique, une laine humide ou un matériau deux fois plus conducteur divise par deux la résistance ajoutée `e/λ`.",
  }];
  C.sys.variants = [{
    story: "Variante audit : la PAC tourne correctement (`COP = 3,2`, `besoin = 15 000 kWh`, `part air = 35 %`), mais le bypass d’été de la VMC double flux est resté ouvert en plein hiver (`η = 0,05` au lieu de `≥ 0,75`).",
    preset: { bes: 15000, partV: 35, eta: 0.05, COP: 3.2 },
    culprit: "eta",
    symptom: "L’air neuf entre glacé : la consommation électrique dépasse 4 600 kWh/an.",
    target: (c) => c.out.Ce <= 3500 && c.v("bes") === 15000 && c.v("partV") === 35 && near(c.v("COP"), 3.2, 0.05),
    targetTxt: "C_élec ≤ 3 500 kWh en refermant l’échangeur double flux (η ≥ 0,75)",
    now: (c) => `C<sub>élec</sub> = ${f(c.out.Ce, 0)} kWh · η = ${f(c.v("eta"), 2)}`,
    hint: "La PAC a déjà un bon COP : regardez la couleur bleue de la gaine d’air neuf sortant du caisson VMC.",
    explain: "Si le bypass court-circuite l’échangeur en hiver, la VMC double flux se comporte comme une simple flux tout en consommant deux ventilateurs.",
  }];
  C.tri.variants = [{
    story: "Variante audit : le besoin (`14 000 kWh`), le tarif (`0,22 €/kWh`) et le `COP = 3,2` sont exacts, mais le commercial a inclus 10 000 € de travaux d’aménagement extérieur hors énergétique dans l’investissement (`18 000 €` au lieu du reste à charge PAC de `≤ 8 500 €`).",
    preset: { bes7: 14000, prix: 0.22, COP7: 3.2, cout: 18000, fCO2: 0.05 },
    culprit: "cout",
    symptom: "Le temps de retour dépasse 8,5 ans alors que la PAC est très performante.",
    target: (c) => c.out.TRI <= 4.2 && c.v("bes7") === 14000 && near(c.v("prix"), 0.22, 0.01) && near(c.v("COP7"), 3.2, 0.05),
    targetTxt: "TRI ≤ 4,2 ans en isolant le coût net réel du bouquet énergétique",
    now: (c) => `TRI ≈ ${f(c.out.TRI, 1)} ans (${f(c.v("cout"), 0)} €)`,
    hint: "Les économies annuelles sont justes : vérifiez le montant d’investissement inscrit au numérateur de `TRI = coût / gain`.",
    explain: "Pour calculer le temps de retour d’un équipement énergétique, on ne retient que le surcoût énergétique net d’aides.",
  }];

  const PROG = {
    ressource: "R3.10 · Physique et énergétique du bâtiment 1",
    competences: ["Dimensionner des ouvrages et des équipements techniques du BTP"],
    acs: ["AC23.01 · Identifier et exploiter les hypothèses permettant le calcul", "AC23.02 · Dimensionner un système simple avec et sans logiciel de calculs", "AC23.03 · Vérifier les exigences réglementaires"],
    sae: "SAÉ 3.BAT.04 · Détermination des besoins pour assurer le confort dans un bâtiment",
  };
  (window.LABV3_COMPLEMENTS = window.LABV3_COMPLEMENTS || []).push({ C, PROG });
})();
