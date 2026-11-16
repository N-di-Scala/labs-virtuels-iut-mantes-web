/* R2-9 · compléments pédagogiques (structure décrite dans r1-1/complements.js) */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });
  const C = {};

  C.cond = {
    duree: 12,
    okT: "Le béton garde sa propre résistance : R<sub>mat</sub> passe de 1,88 à 3,66 m²·K/W",
    m: ["La conductivité de l’isolant augmente avec l’épaisseur, ce qui réduit le gain", "Le flux varie comme 1/e² : doubler l’isolant le divise par plus de 2"],
    crit: ["Les résistances des couches s’additionnent", "Seule la résistance de l’isolant double", "Celles du béton et des surfaces restent : R<sub>total</sub> fait un peu moins que doubler"],
    variante: "On passe l’épaisseur d’isolant de la paroi de 8 à 16 cm, sans toucher au béton. Le flux de chaleur qui traverse la paroi…",
    transfert: Q("Une fenêtre double vitrage (R ≈ 0,35 m²·K/W) est remplacée par un triple vitrage (R ≈ 0,7). Les pertes par cette fenêtre…",
      ok("sont divisées par 2 environ", "Le flux varie comme 1/R pour un même écart de température."),
      no("sont divisées par 4", "Le flux ne varie pas comme 1/R²."),
      no("baissent de 35 %", "La résistance double : les pertes sont divisées par deux.")),
  };
  C.surf = {
    duree: 12,
    okT: "Le flux, plus fort, traverse aussi la lame d’air : la chute φ·R<sub>si</sub> grandit",
    m: ["L’air extérieur traverse le mur et refroidit directement la face intérieure", "R<sub>si</sub> diminue quand le mur isole mal, ce qui refroidit la surface"],
    crit: ["Un mur peu isolé laisse passer un flux plus fort", "Ce flux traverse aussi la lame d’air intérieure, de résistance R<sub>si</sub>", "La chute φ·R<sub>si</sub> grandit : la surface se rapproche de l’extérieur"],
    variante: "Un mur ancien isole très mal (R<sub>mat</sub> = 0,3 m²·K/W). Il fait 20 °C dans la pièce et 0 °C dehors. La face intérieure du mur est à environ…",
    transfert: Q("Dans une pièce à 20 °C, on touche un simple vitrage par 0 °C dehors. Il paraît très froid parce que…",
      ok("le flux est fort et la chute dans la lame d’air intérieure aussi", "Peu de résistance, beaucoup de flux : la surface descend vers 5 °C environ."),
      no("le verre est un matériau froid par nature", "Un matériau n’est pas froid en soi : tout dépend du flux qui le traverse."),
      no("l’air extérieur passe à travers le verre", "Le verre est étanche à l’air : c’est la chaleur qui traverse.")),
  };
  C.bilan = {
    duree: 12,
    okT: "Le mur ne pesait que 41 % de H<sub>tot</sub> : vitrages et ponts n’ont pas changé",
    m: ["Les DJU augmentent quand on isole, ce qui compense une partie du gain", "U et la consommation ne sont liés qu’au-dessus de 0,5 W/(m²·K)"],
    crit: ["Les déperditions totales additionnent plusieurs postes (H<sub>tot</sub>)", "Diviser U du mur par 2 ne divise que la part du mur", "On gagne environ la moitié de 41 %, soit 20 %"],
    variante: "Sans toucher aux vitrages ni aux ponts thermiques, on divise par 2 le U du mur courant (de 0,55 à 0,28). La consommation de chauffage baisse d’environ…",
    transfert: Q("Dans une maison, la toiture représente 30 % des déperditions. On divise par 3 ses pertes. Les déperditions totales baissent de…",
      ok("20 %", "On supprime les deux tiers de 30 %, soit 20 %."),
      no("66 %", "Seule la part de la toiture est concernée."),
      no("30 %", "La toiture perd encore un tiers de ce qu’elle perdait.")),
  };
  C.glaser = {
    duree: 15,
    okT: "P<sub>v</sub> chute surtout dans les couches de grand S<sub>d</sub> : côté chaud, avant le point froid",
    m: ["Il réchauffe l’isolant, qui reste alors au-dessus du point de rosée", "Il est plus facile à poser côté intérieur, à l’abri des intempéries"],
    crit: ["La pression de vapeur chute surtout dans les couches de grand S<sub>d</sub>", "Côté chaud, cette chute a lieu avant la zone froide", "La vapeur arrive à l’interface froide sous la pression saturante : pas de condensation"],
    variante: "Un mur isolé par l’intérieur condense à l’interface isolant/béton. On pose un pare-vapeur de S<sub>d</sub> = 20 m côté chaud, avant l’isolant. À l’interface, la pression de vapeur…",
    transfert: Q("On pose par erreur le pare-vapeur côté froid, contre le béton. Le risque de condensation…",
      ok("reste ou s’aggrave", "La vapeur traverse l’isolant sans freinage et s’accumule contre le pare-vapeur froid."),
      no("disparaît aussi, la position ne compte pas", "C’est la position de la chute de pression qui compte."),
      no("disparaît mieux encore", "Il bloque la vapeur après la zone froide, trop tard.")),
  };
  C.dyn = {
    duree: 12,
    okT: "La diffusivité a = λ/(ρc<sub>p</sub>) : faible conduction et forte capacité ralentissent l’onde",
    m: ["La conductivité λ seule : plus elle est faible, plus l’onde arrive tard", "La masse volumique seule : plus le mur est lourd, plus il retarde"],
    crit: ["Le retard croît comme l’épaisseur", "Il dépend de la diffusivité a = λ/(ρc<sub>p</sub>)", "Faible conductivité et forte capacité ralentissent l’onde"],
    variante: "On double l’épaisseur d’un mur en béton plein, de 20 à 40 cm. Le retard du pic de chaleur à l’intérieur…",
    transfert: Q("Une toiture de 10 cm de béton déphase d’environ 3 h. Pour viser 9 h avec le même béton, il faut environ…",
      ok("30 cm", "Le déphasage croît comme l’épaisseur."),
      no("90 cm", "Ce serait le cas si le déphasage croissait comme le carré de l’épaisseur."),
      no("un béton plus lourd, à épaisseur égale", "La masse seule ne fixe pas la vitesse de l’onde.")),
  };
  C.rehab = {
    duree: 12,
    okT: "Elle traite les ponts de plancher et garde la masse du béton côté intérieur",
    m: ["Elle donne un U plus faible, car l’isolant reçoit le froid en premier", "Elle évite de calculer les ponts thermiques, absents en ITE"],
    crit: ["L’ordre des couches ne change pas U", "L’ITE recouvre les nez de plancher : moins de ponts thermiques", "Elle garde la masse du béton côté intérieur, utile en été"],
    variante: "On garde le même isolant et la même épaisseur, mais on le place à l’extérieur du mur (ITE) au lieu de l’intérieur (ITI). U du mur courant…",
    transfert: Q("Deux murs ont les mêmes couches, dans un ordre différent. Leurs coefficients U sont…",
      ok("identiques", "La résistance totale est une somme : l’ordre ne compte pas."),
      no("plus faible pour celui dont l’isolant est dehors", "La position change les ponts et l’inertie, pas U."),
      no("plus faible pour celui dont l’isolant est dedans", "U ne dépend pas de l’ordre des couches.")),
  };

  // équilibrage des longueurs : la bonne explication ne doit pas se repérer à sa longueur
  C.glaser.m[0] = "Il réchauffe l’isolant et le béton, qui restent alors au-dessus du point de rosée de l’air intérieur";
  C.dyn.m[1] = "La masse volumique seule : plus le mur est lourd, plus il retarde l’arrivée du pic de chaleur à l’intérieur";
  C.rehab.m[0] = "Elle donne un U plus faible, car l’isolant posé dehors reçoit le froid en premier et le bloque mieux";

  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
  const near = (a, b, e = 0.02) => Math.abs(a - b) <= e;

  C.cond.variants = [{
    story: "Variante chantier : la laine minérale livrée a bien la bonne conductivité (`λ₁ = 0,038 W/(m·K)`), mais seuls 3 cm d’épaisseur ont été posés devant le voile béton de 18 cm (`T_ext = 0 °C`). Portez l’épaisseur d’isolant pour ramener `φ ≤ 6,5 W/m²`.",
    preset: { e1: 3, l1: 0.038, e2: 18, l2: 1.8, Text: 0 },
    culprit: "e1",
    symptom: "Le flux de déperdition dépasse 22 W/m² malgré un bon matériau isolant.",
    target: (c) => c.out.phi <= 6.5 && near(c.v("l1"), 0.038, 0.005) && c.v("e2") === 18 && c.v("Text") === 0,
    targetTxt: "φ ≤ 6,5 W/m² en portant l’épaisseur d’isolant e₁ à sa cote nominale",
    now: (c) => `φ = ${f(c.out.phi, 1)} W/m²`,
    hint: "La conductivité λ₁ est excellente : regardez l’épaisseur e₁ réellement posée.",
    explain: "Un isolant performant (`λ` bas) posé en couche trop mince n’offre qu’une faible résistance `R = e/λ`.",
  }];
  C.surf.variants = [{
    story: "Variante chantier : le mur présente une résistance correcte (`R_mat = 1,8 m²·K/W`, `f_Rsi ≥ 0,90`), mais la buanderie non ventilée fait grimper la température de rosée à `18,8 °C` par `T_ext = -5 °C`. Rétablissez l’extraction d’humidité pour stopper la buée (`T_d ≤ 13,5 °C`).",
    preset: { Rmat: 1.8, Rsi: 0.13, Rse: 0.04, Text2: -5, Td: 18.8 },
    culprit: "Td",
    symptom: "La paroi ruisselle alors que `f_Rsi` dépasse pourtant 0,90.",
    target: (c) => !c.out.cond && c.v("Td") <= 13.5 && near(c.v("Rmat"), 1.8, 0.05) && c.v("Text2") === -5,
    targetTxt: "aucune condensation avec T_d ≤ 13,5 °C sans sur-isoler la paroi",
    now: (c) => `T<sub>si</sub> = ${f(c.out.Tsi, 1)} °C · T<sub>rosée</sub> = ${f(c.v("Td"), 1)} °C`,
    hint: "La paroi est saine (`f_Rsi > 0,90`) : c’est la charge d’humidité intérieure (point de rosée T_d) qui est excessive.",
    explain: "Même une paroi bien isolée condense si la production de vapeur intérieure n’est pas évacuée par la VMC.",
  }];
  C.bilan.variants = [{
    story: "Variante chantier : les murs (`U_m = 0,20`, `60 m²`) et les ponts (`H_L = 8 W/K`) sont traités, mais les `18 m²` de baies sont restés en simple vitrage (`U_v = 4,8 W/(m²·K)`). Passez en double/triple vitrage performant pour ramener `E ≤ 2 100 kWh`.",
    preset: { Um: 0.2, Am: 60, Uv: 4.8, Av: 18, HL: 8, DJU: 1800 },
    culprit: "Uv",
    symptom: "Les vitrages représentent à eux seuls plus de 80 % des pertes de l’enveloppe.",
    target: (c) => c.out.E <= 2100 && near(c.v("Um"), 0.2, 0.02) && c.v("Am") === 60 && c.v("Av") === 18 && near(c.v("HL"), 8, 0.5),
    targetTxt: "E ≤ 2 100 kWh en remplaçant les vitrages (U_v ≤ 1,5 W/(m²·K))",
    now: (c) => `E ≈ ${f(c.out.E, 0)} kWh · U<sub>v</sub> = ${f(c.v("Uv"), 1)}`,
    hint: "Observez les flèches bleues sur la façade vitrée : elles dépassent largement celles des murs.",
    explain: "Sur une enveloppe opaque déjà isolée, conserver d’anciens simples vitrages ruine le bilan global `H_D`.",
  }];
  C.glaser.variants = [{
    story: "Variante chantier : un frein-vapeur (`S_d,PV = 5 m`) est posé côté chaud (`HR_i = 65 %`, `S_d1 = 0,35 m`), mais un revêtement extérieur étanche (`S_d2 = 35 m`) bloque le séchage vers dehors. Choisissez un parement extérieur perspirant pour supprimer la condensation.",
    preset: { HRi: 65, Sd1: 0.35, Sd2: 35, SdPV: 5 },
    culprit: "Sd2",
    symptom: "La vapeur piégée derrière l’enduit extérieur étanche condense à l’interface froide.",
    target: (c) => !c.out.risk && c.v("HRi") === 65 && near(c.v("SdPV"), 5, 0.2) && c.v("Sd2") <= 2.5,
    targetTxt: "zéro condensation en ouvrant la paroi à la diffusion côté extérieur (S_d2 ≤ 2,5 m)",
    now: (c) => `P<sub>v</sub> = ${f(c.out.PvIf, 0)} Pa · S<sub>d2</sub> = ${f(c.v("Sd2"), 1)} m`,
    hint: "Règle du « 5 pour 1 » : la face froide extérieure doit laisser sortir la vapeur beaucoup plus facilement que la face chaude ne la laisse entrer.",
    explain: "Une paroi saine freine la vapeur côté chaud (grand `S_d` intérieur) et reste ouverte côté froid (petit `S_d` extérieur).",
  }];
  C.dyn.variants = [{
    story: "Variante chantier : l’épaisseur est limitée à `20 cm` par le gabarit (`ρ = 2 100`, `c_p = 920`), mais un granulat trop conducteur (`λ = 2,2 W/(m·K)`) laisse filer l’onde thermique en moins de 5 h. Abaissez la conductivité du matériau pour atteindre `Δt ≥ 9 h`.",
    preset: { ed: 20, ld: 2.2, rd: 2100, cp: 920 },
    culprit: "ld",
    symptom: "Le pic de chaleur traverse les 20 cm dès le début de soirée (`Δt < 5 h`).",
    target: (c) => c.out.dt >= 9 && c.v("ed") === 20,
    targetTxt: "Δt ≥ 9 h à épaisseur bloquée (20 cm) en abaissant la diffusivité via λ",
    now: (c) => `Δt = ${f(c.out.dt, 1)} h`,
    hint: "L’épaisseur est bloquée à 20 cm : agissez sur la conductivité λ qui gouverne la diffusivité `a = λ/(ρ·c_p)`.",
    explain: "À capacité thermique égale, un matériau moins conducteur abaisse la diffusivité `a` et allonge fortement le déphasage.",
  }];
  C.rehab.variants = [{
    story: "Variante chantier : les 14 cm de laine (`λ = 0,036`) sont bien prévus, mais la variante retenue est encore en isolation intérieure (`ITI`), coupée par la dalle béton (`H_L = 18 W/K`). Basculez le procédé en `ITE` et réduisez le pont résiduel (`H_L ≤ 5 W/K`).",
    preset: { pos: "iti", eiso: 14, liso: 0.036, HLr: 18 },
    culprit: "pos",
    symptom: "Le nez de dalle reste traversant et la masse béton passe côté froid.",
    target: (c) => c.s("pos") === "ite" && c.out.HL <= 5 && c.v("eiso") === 14,
    targetTxt: "procédé basculé en ITE avec pont résiduel H_L ≤ 5 W/K",
    now: (c) => `${c.s("pos").toUpperCase()} · H<sub>L</sub> = ${f(c.out.HL, 1)} W/K`,
    hint: "Changez d’abord la face de pose de l’isolant pour envelopper le nez de plancher par l’extérieur.",
    explain: "L’ITE traite d’un seul tenant le pont de plancher intermédiaire tout en conservant l’inertie du voile béton côté intérieur.",
  }];

  const PROG = {
    ressource: "R2.09 · Transferts thermiques et hydriques dans les parois",
    competences: ["Dimensionner des ouvrages et des équipements techniques du BTP"],
    acs: ["AC13.04 · Calculer la performance thermique et hygrothermique d’une paroi"],
    sae: "SAÉ 2.05 · Performance d’isolation d’un élément d’ouvrage simple et solutions pour satisfaire des contraintes hygrothermiques",
  };
  (window.LABV3_COMPLEMENTS = window.LABV3_COMPLEMENTS || []).push({ C, PROG });
})();
