/* R4-8 · compléments pédagogiques (structure décrite dans r1-1/complements.js) */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });
  const C = {};

  C.ete = {
    duree: 12,
    okT: "L’écart de température est faible (7 K) : Φ<sub>T</sub> reste petit devant le soleil et les apports internes",
    m: ["L’isolant n’agit qu’en hiver, quand la chaleur sort du bâtiment par les murs", "Le soleil chauffe les murs plus que l’air, et l’isolant ne voit que l’air"],
    crit: ["En été, l’écart de température dedans-dehors est faible", "Le flux par les parois opaques reste donc petit", "Le soleil par les vitrages et les apports internes dominent le bilan"],
    variante: "Un bureau en été : 33 °C dehors, 26 °C dedans, 9 m² de vitrage ensoleillé, six occupants et leurs ordinateurs. Parmi les apports de chaleur, lequel est le plus faible ?",
    transfert: Q("Pour éviter la surchauffe d’une salle de classe très vitrée et bien isolée, le premier levier est…",
      ok("protéger les vitrages du soleil", "Les apports solaires dominent le bilan d’été."),
      no("ajouter de l’isolant dans les murs", "Le flux par les murs est déjà faible en été."),
      no("augmenter l’épaisseur de la dalle", "L’inertie aide, mais n’empêche pas le soleil d’entrer.")),
  };
  C.inertie = {
    duree: 12,
    okT: "Sa diffusivité est environ 6 fois plus faible : l’onde y avance plus lentement",
    m: ["Elle stocke plus de chaleur que le béton dense, à épaisseur égale", "Elle est plus épaisse que le béton pour une même résistance thermique"],
    crit: ["Le déphasage dépend de la diffusivité a = λ/(ρc<sub>p</sub>)", "La fibre de bois conduit très peu : sa diffusivité est faible", "Elle déphase plus, même si elle stocke moins de chaleur"],
    variante: "Dans une paroi de 28 cm, on remplace le béton par de la fibre de bois (λ = 0,05, ρ = 200 kg/m³, c<sub>p</sub> = 2 000 J/(kg·K)). Le déphasage…",
    transfert: Q("Une laine minérale (λ = 0,035, ρ = 30 kg/m³, c<sub>p</sub> = 1 000) et une fibre de bois de même λ mais ρ = 150. À épaisseur égale, la meilleure en confort d’été est…",
      ok("la fibre de bois", "Plus dense à λ égal, elle a une diffusivité plus faible : elle déphase davantage."),
      no("les deux se valent, elles ont le même λ", "Le λ égal donne la même isolation, pas le même déphasage."),
      no("la laine minérale, plus légère", "Plus léger à λ égal, c’est une diffusivité plus forte.")),
  };
  C.bepos = {
    duree: 12,
    okT: "Chaque litre stocke une énergie proportionnelle à ΔT : deux fois moins d’écart, deux fois plus de litres",
    m: ["L’eau est plus dense à basse température, il en faut donc deux fois plus", "La puissance stockée double quand l’écart de température est réduit"],
    crit: ["Énergie stockée = m · c<sub>p</sub> · ΔT", "À énergie fixée, la masse d’eau varie comme 1/ΔT", "Deux fois moins d’écart : deux fois plus de litres"],
    variante: "On veut stocker la même énergie dans un ballon tampon, mais avec un écart de température réduit de moitié (de 12 K à 6 K). Le volume du ballon…",
    transfert: Q("Un ballon d’eau chaude stocke 10 kWh entre 15 et 55 °C. Si l’on ne chauffe qu’à 45 °C, il stocke…",
      ok("7,5 kWh", "L’écart passe de 40 à 30 K : 10 × 30/40 = 7,5 kWh."),
      no("8,2 kWh", "C’est le rapport des températures (45/55), qui n’a pas de sens ici."),
      no("10 kWh, le volume n’a pas changé", "L’énergie stockée suit l’écart de température.")),
  };
  C.aera = {
    duree: 12,
    m: ["Le rendement du ventilateur s’améliore quand le réseau s’allonge", "Le débit baisse quand le réseau s’allonge, ce qui limite la hausse"],
    crit: ["Les pertes de charge se partagent entre linéaires et singulières", "Doubler la longueur ne double que les pertes linéaires", "ΔP, et donc P = q·ΔP/η, augmente sans doubler"],
    variante: "Sans changer le débit, on double la longueur des gaines de ventilation (de 35 à 70 m). La puissance électrique du ventilateur…",
    transfert: Q("Dans un réseau, les pertes singulières font 70 % des pertes de charge. On divise par 2 la longueur des gaines droites. ΔP baisse de…",
      ok("15 %", "Seules les pertes linéaires (30 %) sont divisées par deux."),
      no("50 %", "Les coudes, grilles et filtres ne raccourcissent pas."),
      no("35 %", "C’est la moitié des pertes singulières, qui ne changent pas.")),
  };
  C.acou = {
    duree: 12,
    m: ["Les deux ondes s’annulent en partie, ce qui limite le niveau à 73 dB", "L’oreille sature vers 73 dB : au-delà, les niveaux ne s’additionnent plus"],
    crit: ["Les décibels sont une échelle logarithmique", "Deux sources égales doublent l’énergie sonore", "Doubler l’énergie ajoute 10·log 2 ≈ 3 dB"],
    variante: "Deux machines identiques produisent chacune 70 dB au même endroit. Lorsqu’elles fonctionnent ensemble, le niveau sonore vaut environ…",
    transfert: Q("Dix ventilateurs identiques de 50 dB fonctionnent ensemble. Le niveau total vaut environ…",
      ok("60 dB", "Dix fois plus d’énergie : + 10·log 10 = + 10 dB."),
      no("500 dB", "Les décibels ne s’additionnent pas comme des nombres."),
      no("53 dB", "+ 3 dB, c’est pour deux sources, pas dix.")),
  };

  // équilibrage des longueurs : la bonne explication ne doit pas se repérer à sa longueur
  C.ete.m[0] = "L’isolant n’agit qu’en hiver, quand la chaleur sort du bâtiment à travers les murs et la toiture";
  C.bepos.m[0] = "L’eau est plus dense à basse température : il faut donc deux fois plus de litres pour stocker autant d’énergie";
  C.acou.m[0] = "Les deux ondes sonores s’annulent en partie, ce qui limite le niveau total à environ 73 dB";
  C.ete.okT = "L’écart de température est faible (7 K) : le flux par les murs reste petit devant le soleil";

  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
  const near = (a, b, e = 0.02) => Math.abs(a - b) <= e;

  C.ete.variants = [{
    story: "Variante canicule : le vitrage à contrôle solaire (`g = 0,42`, `S_vit = 18 m²`, `E = 650 W/m²`) est bien posé, mais l’automate des brise-soleil orientables est resté bloqué lames relevées (`F_s = 0,95`). Abaissez les brise-soleil pour ramener la charge totale `≤ 3 600 W`.",
    preset: { Uete: 0.25, Sete: 65, Text: 33, Tint: 26, Svit: 18, Esol: 650, gsol: 0.42, Fs: 0.95, nOcc: 6, Peq: 1.5, Lat: 48, delta: 23 },
    culprit: "Fs",
    symptom: "Une large tache solaire chauffe la salle : les apports totaux dépassent 6 600 W.",
    target: (c) => c.out.tot <= 3600 && c.v("Svit") === 18 && near(c.v("gsol"), 0.42, 0.02),
    targetTxt: "apports totaux ≤ 3 600 W grâce à l’occultation extérieure (F_s ≤ 0,30)",
    now: (c) => `${f(c.out.tot, 0)} W · F<sub>s</sub> = ${f(c.v("Fs"), 2)}`,
    hint: "Le vitrage est déjà sélectif : regardez l’inclinaison des lames du brise-soleil extérieur.",
    explain: "En confort d’été, une occultation extérieure mobile (`F_s` bas) arrête le rayonnement avant qu’il ne franchisse le vitrage.",
  }];
  C.inertie.variants = [{
    story: "Variante canicule : le béton lourd (`ρ = 2 200 kg/m³`, `λ = 1,4`, `c_p = 880`) a bien été retenu, mais une cloison mince de `6 cm` a été coulée au lieu d’un voile porteur épais. Augmentez l’épaisseur pour obtenir un déphasage `φ ≥ 6,5 h`.",
    preset: { ein: 6, lin: 1.4, rin: 2200, cpin: 880 },
    culprit: "ein",
    symptom: "L’onde de chaleur traverse le voile mince en à peine 1,5 h.",
    target: (c) => c.out.phi >= 6.5 && c.v("rin") === 2200 && near(c.v("lin"), 1.4, 0.05),
    targetTxt: "déphasage φ ≥ 6,5 h en redonnant de l’épaisseur au voile béton",
    now: (c) => `φ = ${f(c.out.phi, 1)} h (e = ${c.v("ein")} cm)`,
    hint: "Le matériau est déjà dense : c’est l’épaisseur e traversée par l’onde qui est trop faible.",
    explain: "Le déphasage croît proportionnellement à l’épaisseur `e` : même du béton lourd déphase peu en voile très mince.",
  }];
  C.bepos.variants = [{
    story: "Variante chaufferie : la PAC (`COP = 3,5`) fonctionne bien, mais le régime d’eau du ballon tampon (`Q = 3,5 kW`, `t = 1,5 h`) a été réglé avec un pincement minuscule `ΔT = 3 K`, imposant un ballon géant de plus de 1 500 L ! Élargissez `ΔT` pour ramener le ballon sous `450 L`.",
    preset: { Eu: 6500, etaSys: 3.5, Qstock: 3.5, tstock: 1.5, dTeau: 3, Ppv: 9, prod: 1050, prix: 0.22, inv: 11000 },
    culprit: "dTeau",
    symptom: "Le ballon tampon dépasse 1 500 L et ne passe plus par la porte de la chaufferie.",
    target: (c) => ((c.v("Qstock") * 1000 * c.v("tstock") * 3600) / (1000 * 4180 * c.v("dTeau"))) * 1000 <= 450 && near(c.v("Qstock"), 3.5, 0.05) && near(c.v("tstock"), 1.5, 0.05),
    targetTxt: "volume de ballon V ≤ 450 L en portant ΔT_eau ≥ 10 K",
    now: (c) => `V = ${f(((c.v("Qstock") * 1000 * c.v("tstock") * 3600) / (1000 * 4180 * c.v("dTeau"))) * 1000, 0)} L (ΔT = ${c.v("dTeau")} K)`,
    hint: "Regardez la formule `V = Q·t / (ρ·c_p·ΔT)` : un trop faible écart de température fait exploser le volume d’eau.",
    explain: "Stocker la même énergie sur `ΔT = 10 K` plutôt que `3 K` divise par plus de trois la taille et le coût du ballon.",
  }];
  C.aera.variants = [{
    story: "Variante aéraulique : les singularités sont modérées (`ΔP_sing = 80 Pa`, `S = 0,12 m²`, `L = 35 m`), mais la vitesse d’air dans la gaine principale a été poussée à `9,5 m/s` ! Ramenez la vitesse dans une plage acoustique et énergétique saine (`v ≤ 4,5 m/s`, `P ≤ 140 W`).",
    preset: { Sa: 0.12, va: 9.5, La: 35, J: 1.2, Psing: 80, etaA: 0.55 },
    culprit: "va",
    symptom: "La gaine siffle (ondes rouges) et le ventilateur engloutit plus de 1 000 W électriques !",
    target: (c) => c.v("va") <= 4.5 && c.out.P <= 140 && near(c.v("Sa"), 0.12, 0.01) && c.v("Psing") === 80,
    targetTxt: "v ≤ 4,5 m/s et P_élec ≤ 140 W en réduisant la vitesse d’air",
    now: (c) => `v = ${f(c.v("va"), 1)} m/s · P = ${f(c.out.P, 0)} W`,
    hint: "En réseau couplé, la puissance appelée au ventilateur varie comme le cube de la vitesse (`v³`) !",
    explain: "Diviser la vitesse par deux divise le débit par 2 et la perte de charge par 4, donc la puissance ventilateur par 8.",
  }];
  C.acou.variants = [{
    story: "Variante acoustique : la cloison séparative isole très bien (`R_w = 52 dB`), mais la salle d’attente de `95 m³` en béton brut n’a presque aucun absorbant (`A = 6 m²`), d’où un écho fatigant (`T = 2,53 s`). Posez un plafond acoustique pour ramener `T ≤ 0,65 s`.",
    preset: { L1: 68, L2: 61, Lw: 75, dAc: 3, Rw: 52, Vac: 95, Aac: 6 },
    culprit: "Aac",
    symptom: "Le bruit voisin est bloqué, mais la salle résonne plus de 2,5 secondes (formule de Sabine).",
    target: (c) => (0.16 * c.v("Vac") / c.v("Aac")) <= 0.65 && c.v("Vac") === 95 && c.v("Rw") === 52,
    targetTxt: "temps de réverbération T ≤ 0,65 s grâce à l’aire d’absorption A ≥ 24 m²",
    now: (c) => `T = ${f(0.16 * c.v("Vac") / c.v("Aac"), 2)} s (A = ${c.v("Aac")} m²)`,
    hint: "Ne confondez pas isolement (`R_w`) et réverbération interne (`T = 0,16·V/A`) : il manque des panneaux absorbants.",
    explain: "Une paroi lourde bloque la transmission entre locaux (`R_w`), tandis que les matériaux poreux absorbent l’écho dans la pièce (`A`).",
  }];

  const PROG = {
    ressource: "R4.08 · Physique et énergétique du bâtiment 2",
    competences: ["Dimensionner des ouvrages et des équipements techniques du BTP"],
    acs: ["AC23.01 · Identifier et exploiter les hypothèses permettant le calcul", "AC23.02 · Dimensionner un système simple avec et sans logiciel de calculs", "AC23.03 · Vérifier les exigences réglementaires"],
    sae: "SAÉ 4.BAT.04 · Dimensionnement de systèmes pour assurer le confort dans un bâtiment",
  };
  (window.LABV3_COMPLEMENTS = window.LABV3_COMPLEMENTS || []).push({ C, PROG });
})();
