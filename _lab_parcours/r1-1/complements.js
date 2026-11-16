/* =====================================================================
   R1-1 · compléments pédagogiques (chargés après socratique.js)
   Par atelier :
     duree      durée estimée du parcours (minutes)
     m          explications fausses de l'étape 3, réécrites (même longueur et même style que la juste)
     okT        formulation (plus courte) de l'explication juste, si besoin
     crit       idées clés de la reformulation libre (auto-évaluation)
     variante   autre énoncé de la prédiction (second passage), mêmes options
     transfert  question de transfert en fin d'atelier : même idée, autre contexte
   Lab : programme (lien avec le programme national du B.U.T. GC-CD).
   ===================================================================== */
(() => {
  const PC = window.LABV3_PARCOURS;
  if (!PC) return;
  const Q = (q, ...opts) => ({ q, opts });
  const ok = (t, fb) => ({ t, ok: true, fb });
  const no = (t, fb) => ({ t, fb });
  const C = {};

  C.refs = {
    duree: 10,
    m: ["La valeur de la cellule B1 : elle ne peut plus être modifiée", "Le format monétaire, pour que les copies restent en euros"],
    crit: ["Sans $, la référence se décale à chaque ligne recopiée", "Le $ fige la colonne et/ou la ligne de la référence", "Toutes les copies lisent alors la même cellule (B1)"],
    variante: "En ligne 1, une formule lit le prix unique saisi en B1. On la recopie vers le bas, sans symbole $, jusqu’à la ligne 4. La copie de la ligne 4 lit le prix…",
    transfert: Q("Une formule en C2 multiplie une quantité (A2) par un taux saisi une seule fois en F1. Pour la recopier sur toute la colonne, on écrit…",
      ok("=A2*$F$1", "A2 doit suivre chaque ligne, F1 doit rester fixe."),
      no("=$A$2*$F$1", "Toutes les lignes utiliseraient alors la quantité de la ligne 2."),
      no("=A2*F1", "Recopiée, F1 deviendrait F2, F3… : des cellules vides.")),
  };
  C.unites = {
    duree: 10,
    m: ["Il convertit les millimètres en mètres grâce au format de la cellule", "Le résultat est juste, mais il est affiché en millimètres"],
    crit: ["Le tableur ne manipule que des nombres, sans unité", "2,4 + 800 est un calcul valide pour lui", "Il faut imposer une seule unité par colonne et vérifier l’ordre de grandeur"],
    variante: "Une colonne contient 2,40 (une longueur en mètres) et 800 (une longueur en millimètres). On fait la somme des deux cellules. Le tableur affiche…",
    transfert: Q("Une colonne de masses contient 1,2 (en tonnes) et 350 (en kilogrammes). La somme affichée vaut…",
      ok("351,2", "Le tableur additionne les nombres : 1,2 + 350."),
      no("1,55", "Ce serait le bon total en tonnes, mais le tableur ne convertit rien."),
      no("une erreur d’unités", "Le tableur ne connaît pas les unités : aucune erreur n’est signalée.")),
  };
  C.logique = {
    duree: 12,
    okT: "Seules les heures au-delà de 40 h sont majorées : la branche « vrai » sépare les deux parts",
    m: ["La majoration est plafonnée à 4 h par le tableur, quel que soit le dépassement", "Le SI majore toute la semaine, mais seulement au-delà de 44 h travaillées"],
    crit: ["Le SI teste si l’on dépasse le seuil de 40 h", "Les 40 premières heures restent au taux normal", "Seules les heures au-delà du seuil sont majorées de 25 %"],
    variante: "Un salarié fait 44 h dans la semaine à 12,40 €/h. Les heures au-delà de 40 h sont payées 25 % de plus. Le montant de la semaine vaut…",
    transfert: Q("Une remise de 10 % s’applique aux quantités au-delà de 100 unités. Pour 120 unités à 2 €, le montant vaut…",
      ok("236 €", "100 × 2 + 20 × 2 × 0,9 = 236 € : seule la part au-delà du seuil est remisée."),
      no("216 €", "C’est la remise appliquée à toute la commande."),
      no("240 €", "C’est le montant sans aucune remise.")),
  };
  C.tva = {
    duree: 10,
    okT: "Seule la TVA double ; le HT, qui fait l’essentiel du TTC, reste le même",
    m: ["Le tableur arrondit la TVA au centime, ce qui limite la hausse", "La TVA est plafonnée par la loi au-delà d’un certain montant"],
    crit: ["TTC = HT × (1 + taux)", "Seule la part TVA double", "Le HT, qui pèse le plus dans le TTC, ne change pas"],
    variante: "Une ligne de devis vaut 12,40 € HT. Le taux de TVA appliqué double, de 6 % à 12 %. Le montant TTC de cette ligne…",
    transfert: Q("Les frais de port représentent 5 % du prix d’une commande. Le transporteur double ses tarifs. La facture totale augmente d’environ…",
      ok("5 %", "Seule la petite part « port » double."),
      no("100 %", "Le prix des articles, lui, ne bouge pas."),
      no("10 %", "Le port passe de 5 à 10 % du prix des articles, soit +5 % sur la facture.")),
  };
  C.synthese = {
    duree: 10,
    okT: "L’une teste le critère (les postes), l’autre fournit les valeurs additionnées (les montants)",
    m: ["La première est additionnée, la seconde sert seulement à trier les lignes", "Les deux plages sont additionnées, puis le critère choisit l’affichage"],
    crit: ["La première plage sert à tester le critère", "Le critère choisit les lignes retenues", "La dernière plage fournit les valeurs additionnées"],
    variante: "Dans un devis, =SOMME.SI(poste ; \"Quincaillerie\" ; montant) est saisie sous le tableau. Cette formule additionne…",
    transfert: Q("Pour compter le nombre de lignes dont le poste est « Peinture », on utilise…",
      ok("NB.SI(poste ; \"Peinture\")", "On compte les lignes : pas besoin de plage de valeurs."),
      no("SOMME.SI(poste ; \"Peinture\")", "Sans troisième plage, SOMME.SI additionne la plage testée, qui contient du texte."),
      no("SOMME(poste)", "SOMME additionne des nombres, sans critère.")),
  };
  C.graphiques = {
    duree: 10,
    m: ["Le tableur arrondit les valeurs quand on change l’échelle de l’axe", "Le zoom ajoute des points intermédiaires entre les semaines"],
    crit: ["Avec un axe tronqué, la hauteur ne représente plus la valeur", "Elle représente l’écart au bas de l’axe", "Un faible écart relatif paraît alors énorme"],
    variante: "Un coût passe de 98 € (semaine 1) à 101 € (semaine 3), soit +3 %. L’axe vertical du graphique commence à 96 €. La barre de la semaine 3 paraît…",
    transfert: Q("Un graphique de consommation d’énergie a un axe qui part de 9 000 kWh. Les barres de deux années (9 500 et 10 000 kWh) semblent…",
      ok("du simple au double", "Hauteurs 500 et 1 000 au-dessus du bas de l’axe : un écart de 5 % paraît doubler."),
      no("presque identiques", "C’est ce que montrerait un axe partant de zéro."),
      no("dans le rapport exact 9 500 / 10 000", "La hauteur ne suit plus la valeur quand l’axe ne part pas de zéro.")),
  };
  C.qualite = {
    duree: 10,
    okT: "Un zéro passerait inaperçu dans les sommes ; le message garde l’anomalie visible",
    m: ["Le tableur refuse d’afficher 0 dans une cellule de recherche", "Un message de texte augmente le total pour éviter les sous-estimations"],
    crit: ["Une recherche sans résultat renvoie une erreur (#N/A)", "Remplacer l’erreur par 0 fausserait les sommes en silence", "Un message explicite garde l’anomalie visible"],
    variante: "On cherche avec RECHERCHEV un code qui n’existe pas dans la table, sans traitement d’erreur. La cellule de résultat affiche…",
    transfert: Q("Dans un tableau de métrés, une cellule de surface est vide par oubli. Le total de la colonne…",
      ok("est calculé sans signaler l’oubli", "Une cellule vide compte pour zéro dans une somme : l’erreur passe inaperçue."),
      no("affiche une erreur", "SOMME ignore les cellules vides sans rien signaler."),
      no("refuse de se calculer", "La somme se calcule normalement, ce qui est justement le danger.")),
  };

  // équilibrage des longueurs : la bonne explication ne doit pas se repérer à sa longueur
  C.refs.m[0] = "La valeur de la cellule B1 : elle est protégée et ne peut plus être modifiée par erreur";
  C.logique.m[0] = "La majoration est plafonnée à 4 h par le tableur, quel que soit le nombre d’heures au-delà du seuil";
  C.synthese.m[0] = "La première plage est additionnée, et la seconde sert seulement à trier les lignes avant le calcul";
  C.qualite.m[0] = "Le tableur refuse d’afficher 0 dans une cellule de recherche : il faut donc lui fournir un texte";

  const f = (x, n = 2) => Number(x).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
  const eur = (x) => f(x, 2) + " €";
  const near = (a, b, e = 0.02) => Math.abs(a - b) <= e;

  C.refs.variants = [{
    story: "Variante de chantier : l’ancre `$B$1` est bien posée, mais la poignée de recopie s’est arrêtée à la ligne 2 au lieu de couvrir les 6 postes du bordereau.",
    preset: { nCopies: 2, lockAbs: "abs" },
    culprit: "nCopies",
    symptom: "Seules 2 lignes sont calculées sur les 6 lignes du devis.",
    target: (c) => c.out.abs && c.out.n === 6,
    targetTxt: "6 lignes recopiées avec l’ancre verrouillée",
    now: (c) => `${c.out.n} ligne(s) · ${c.out.abs ? "ancre $B$1" : "sans $"}`,
    hint: "Vérifiez jusqu’à quelle ligne la formule a été étirée dans la colonne.",
    explain: "Même une formule bien verrouillée fausse le sous-total si la recopie s’arrête avant la dernière ligne du lot.",
  }];
  C.unites.variants = [{
    story: "Variante de chantier : toutes les longueurs sont bien en mètres, mais le premier tronçon a été saisi à 1,50 m au lieu des 3,20 m cotés sur le plan (le second vaut 0,80 m, total attendu : 4,00 m).",
    preset: { lenM: 1.5, mixTrap: "ok" },
    culprit: "lenM",
    symptom: "Le linéaire total affiche 2,30 m au lieu de 4,00 m sur le plan.",
    target: (c) => !c.out.mix && near(c.out.tot, 4.0, 0.03),
    targetTxt: "total = 4,00 m en mètres homogènes",
    now: (c) => `total ${f(c.out.tot, 2)} m`,
    hint: "Les unités sont déjà homogènes : contrôlez la longueur saisie sur le premier tronçon.",
    explain: "Une fois l’unité homogénéisée, le contrôle d’ordre de grandeur sert aussi à repérer une faute de frappe sur un métré.",
  }];
  C.logique.variants = [{
    story: "Variante de chantier : le pointage hebdomadaire est bien à 44 h, mais le taux horaire de base a été saisi à 15,00 €/h au lieu de 12,40 €/h prévus par la grille (total attendu : 558,00 €).",
    preset: { heures: 44, tauxH: 15.0 },
    culprit: "tauxH",
    symptom: "La semaine à 44 h ressort à 675,00 € au lieu de 558,00 €.",
    target: (c) => c.out.h === 44 && near(c.out.t, 12.4, 0.02),
    targetTxt: "558,00 € (44 h au taux de base 12,40 €/h)",
    now: (c) => eur(c.out.tot),
    hint: "Les 44 h pointées sont exactes : regardez le tarif horaire unitaire appliqué.",
    explain: "Quand une formule conditionnelle est juste, un écart proportionnel provient souvent du paramètre unitaire en amont.",
  }];
  C.tva.variants = [{
    story: "Variante de chantier : le taux normal de TVA à 20 % est bien sélectionné, mais le montant HT unitaire a été saisi en double (24,80 € HT au lieu de 12,40 € HT, soit 14,88 € TTC attendus).",
    preset: { ht: 24.8, tauxTva: 20 },
    culprit: "ht",
    symptom: "La ligne ressort à 29,76 € TTC au lieu de 14,88 € TTC.",
    target: (c) => near(c.out.ht, 12.4, 0.05) && near(c.out.t, 0.2, 0.002),
    targetTxt: "12,40 € HT à 20 % (14,88 € TTC)",
    now: (c) => `${eur(c.out.ht)} HT · TTC ${eur(c.out.ttc)}`,
    hint: "Le taux de TVA à 20 % est conforme au marché : vérifiez la base HT.",
    explain: "Un TTC exactement doublé à taux de TVA exact trahit immédiatement une erreur sur la base HT.",
  }];
  C.synthese.variants = [{
    story: "Variante de chantier : la synthèse filtre bien le lot n° 1, mais l’indice d’actualisation des prix est resté bloqué à +15 % d’un ancien scénario au lieu de 0 % (base marché).",
    preset: { infl: 15, filtrePoste: "1" },
    culprit: "infl",
    symptom: "Le sous-total du lot est majoré de 15 % par rapport au bordereau de base.",
    target: (c) => c.out.fp === 1 && near(c.v("infl"), 0, 0.1),
    targetTxt: "lot n° 1 sélectionné avec actualisation revenue à 0 %",
    now: (c) => `${eur(c.out.tot)} (indice ${f(c.v("infl"), 0)} %)`,
    hint: "Le bon poste est déjà filtré : regardez le coefficient d’inflation globale.",
    explain: "Un paramètre global oublié en haut de feuille décale tous les sous-totaux `SOMME.SI` d’un même pourcentage.",
  }];
  C.graphiques.variants = [{
    story: "Variante de chantier : l’axe vertical part bien de 0 €, mais la valeur de la semaine 3 a été saisie à +18 € d’écart au lieu de +4 € (104 € attendus).",
    preset: { amp: 18, zoomAxe: "0" },
    culprit: "amp",
    symptom: "Même avec un axe honnête depuis 0 €, la semaine 3 culmine à 118 € au lieu de 104 €.",
    target: (c) => !c.out.zoom && near(c.out.amp, 4, 0.1),
    targetTxt: "axe depuis 0 € et écart réel ramené à +4 €",
    now: (c) => `écart +${f(c.out.amp, 0)} € · ${c.out.zoom ? "axe tronqué" : "axe depuis 0"}`,
    hint: "L’échelle graphique est déjà honnête : contrôlez la donnée source de la semaine 3.",
    explain: "Après avoir vérifié que l’axe part de zéro, une barre anormalement haute signale un vrai écart dans les données.",
  }];
  C.qualite.variants = [{
    story: "Variante de chantier : `SIERREUR` encadre déjà les codes absents, mais le classeur s’apprête à partir sur chantier sans verrouillage des cellules de formules.",
    preset: { cle: 2, wrapErr: "1", prot: "0" },
    culprit: "prot",
    symptom: "N’importe quel opérateur peut écraser une formule en tapant un nombre par-dessus.",
    target: (c) => c.out.wrap && c.out.prot,
    targetTxt: "erreurs encadrées ET formules protégées",
    now: (c) => (c.out.prot ? "formules protégées" : "formules exposées"),
    hint: "Le traitement d’erreur est actif : vérifiez la protection de la feuille avant diffusion.",
    explain: "Sur un classeur partagé en conduite de travaux, seules les cellules de saisie bleues doivent rester déverrouillées.",
  }];

  /* ---------------- P10 : Barre de formule interactive fx = [...] (R1-1) ---------------- */
  const FX_SPECS = {
    refs: {
      cell: "C2",
      ph: "=A2*$B$1",
      chips: ["=", "$", "A2", "$B$1", "*"],
      eval(s) {
        if (/^=\s*\$?A2\s*\*\s*\$?B\$1\s*$/i.test(s) || /^=\s*\$?B\$1\s*\*\s*\$?A2\s*$/i.test(s)) {
          return { ok: true, set: ["lockAbs", "abs"], msg: "Référence verrouillée sur la ligne 1 (`$B$1`) : recopiable sur tout le devis sans décalage !" };
        }
        if (/^\=\s*\$?A\$2\s*\*\s*\$?B\$?1\s*$/i.test(s)) {
          return { warn: true, msg: "Attention : `$A$2` bloque aussi la quantité de la ligne 2 ! Seul le tarif `B1` doit porter `$`." };
        }
        if (/^=\s*A2\s*\*\s*B1\s*$/i.test(s) || /^=\s*B1\s*\*\s*A2\s*$/i.test(s)) {
          return { warn: true, set: ["lockAbs", "rel"], msg: "Sans `$` devant le `1`, `B1` glissera en `B2`, `B3`… lors de la recopie vers le bas." };
        }
        return { msg: "Écrivez la formule de montant en C2 reliant la quantité `A2` et le tarif unique `B1` (ex. `=A2*$B$1`)." };
      },
    },
    logique: {
      cell: "D2",
      ph: "=SI(A2>40;40*B2+(A2-40)*B2*1,25;A2*B2)",
      chips: ["=SI(", ";", "40", "1,25", ")"],
      eval(s) {
        if (/^=\s*SI\s*\(/i.test(s)) {
          const inner = s.replace(/^=\s*SI\s*\(/i, "").replace(/\)\s*$/, "");
          const parts = inner.split(";");
          if (parts.length < 3) return { warn: true, msg: "`SI` attend 3 parties séparées par `;` : `test_logique ; valeur_si_vrai ; valeur_si_faux`." };
          if (!/40/.test(parts[0])) return { warn: true, msg: "Le test logique doit comparer les heures au seuil légal ou contractuel (`A2>40`)." };
          if (/40\s*\*/.test(parts[1]) && /\(\s*A2\s*-\s*40\s*\)/i.test(parts[1])) {
            return { ok: true, msg: "Formule `SI` impeccable : les 40 premières heures restent au taux normal et seul le dépassement `(A2-40)` est majoré." };
          }
          return { warn: true, msg: "Dans la branche « si vrai », veillez à ne majorer que `(A2-40)` et non la totalité de `A2` !" };
        }
        return { msg: "Testez une formule conditionnelle avec `=SI(A2>40 ; ... ; A2*B2)`." };
      },
    },
    tva: {
      cell: "C2",
      ph: "=A2*(1+$B$1)",
      chips: ["=", "A2*(1+", "$B$1", ")"],
      eval(s) {
        if (/^=\s*A2\s*\*\s*\(\s*1\s*\+\s*\$?B\$1\s*\)\s*$/i.test(s)) {
          return { ok: true, msg: "Formule TTC directe `=A2*(1+$B$1)` avec taux de TVA verrouillé : nette et recopiable !" };
        }
        if (/^=\s*A2\s*\*\s*\(\s*1\s*\+\s*B1\s*\)\s*$/i.test(s)) {
          return { warn: true, msg: "Le facteur `(1+taux)` est juste, mais pensez à figer `$B$1` si le taux de TVA est en en-tête !" };
        }
        return { msg: "Exprimez le TTC à partir du HT (`A2`) et du taux de TVA en `B1` : `=A2*(1+$B$1)`." };
      },
    },
    synthese: {
      cell: "F4",
      ph: '=SOMME.SI(B2:B20;"Peinture";D2:D20)',
      chips: ["=SOMME.SI(", ";", '"Peinture"', "B2:B20", "D2:D20)"],
      eval(s) {
        if (/^=\s*SOMME\.SI\s*\(/i.test(s)) {
          const parts = s.replace(/^=\s*SOMME\.SI\s*\(/i, "").replace(/\)\s*$/, "").split(";");
          if (parts.length < 3) return { warn: true, msg: "`SOMME.SI` requiert ici 3 arguments séparés par `;` : `plage_postes ; \"Poste\" ; plage_montants`." };
          let fp = null;
          if (/peint/i.test(parts[1])) fp = "1";
          else if (/gros|quinc|bois|macon/i.test(parts[1])) fp = "2";
          else if (/elec|plomb/i.test(parts[1])) fp = "3";
          return { ok: true, set: fp ? ["filtrePoste", fp] : null, msg: "Syntaxe `SOMME.SI(plage_critère ; critère ; plage_somme)` conforme : le sous-total se met à jour automatiquement." };
        }
        return { msg: 'Essayez `=SOMME.SI(B2:B20 ; "Peinture" ; D2:D20)` pour filtrer un poste sans trier le devis.' };
      },
    },
    qualite: {
      cell: "D2",
      ph: '=SIERREUR(RECHERCHEV(A2;Tarifs;2;FAUX);"Code à vérifier")',
      chips: ["=SIERREUR(", "RECHERCHEV(", ";FAUX)", ';"Code à vérifier")'],
      eval(s) {
        if (/^=\s*SIERREUR\s*\(/i.test(s)) {
          if (/;\s*0\s*\)\s*$/.test(s) || /;\s*"0"\s*\)\s*$/.test(s)) {
            return { warn: true, set: ["wrapErr", "0"], msg: "Danger métier : renvoyer `0` cache un code introuvable dans la somme du devis ! Renvoyez un texte explicite." };
          }
          if (/;\s*"[^"]+"\s*\)\s*$/.test(s)) {
            return { ok: true, set: ["wrapErr", "1"], msg: "Parfait : `SIERREUR(... ; \"Code à vérifier\")` intercepte `#N/A` tout en gardant l’alerte bien visible." };
          }
          return { warn: true, msg: 'Complétez le second argument de `SIERREUR(formule ; "Message d’alerte")`.' };
        }
        return { msg: 'Encadrez la recherche par `=SIERREUR(RECHERCHEV(...) ; "Code à vérifier")`.' };
      },
    },
  };

  function mountFxBars() {
    Object.entries(FX_SPECS).forEach(([id, sp]) => {
      const sec = document.getElementById("atelier-" + id);
      const bd = sec && sec.querySelector(".controls-card .bd");
      if (!bd || bd.querySelector(".v4-fxbar")) return;
      const box = document.createElement("div");
      box.className = "v4-fxbar";
      box.innerHTML = `<div class="v4-fxbar-hd"><b>Barre de formule · ${sp.cell}</b><span>Testez votre écriture tableur</span></div>`
        + `<div class="v4-fxbar-row"><span class="v4-fx-tag">fx</span><input type="text" class="v4-fx-inp" spellcheck="false" autocomplete="off" placeholder="${sp.ph.replace(/"/g, "&quot;")}" aria-label="Formule tableur de la cellule ${sp.cell}" /></div>`
        + `<div class="v4-fx-chips"></div>`
        + `<div class="v4-fx-fb">${sp.eval("").msg}</div>`;
      const inp = box.querySelector(".v4-fx-inp");
      const chips = box.querySelector(".v4-fx-chips");
      const fb = box.querySelector(".v4-fx-fb");
      sp.chips.forEach((tok) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "v3-chip";
        b.textContent = tok;
        b.addEventListener("click", () => {
          const st = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
          inp.value = inp.value.slice(0, st) + tok + inp.value.slice(en);
          inp.focus();
          inp.selectionStart = inp.selectionEnd = st + tok.length;
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        });
        chips.append(b);
      });
      inp.addEventListener("input", () => {
        const raw = inp.value.trim();
        window.dispatchEvent(new CustomEvent("labv4:r11cell", { detail: { hasB1: /\$?B\$?1\b/i.test(raw) } }));
        fb.classList.remove("ok", "warn");
        if (!raw) { fb.textContent = sp.eval("").msg; return; }
        if (!raw.startsWith("=")) {
          fb.classList.add("warn");
          fb.textContent = "Camille : commencez par le signe = (sans lui, le tableur stocke un simple texte).";
          return;
        }
        const openP = (raw.match(/\(/g) || []).length, closeP = (raw.match(/\)/g) || []).length;
        if (openP !== closeP) {
          fb.classList.add("warn");
          fb.textContent = `Camille : parenthèses non équilibrées (${openP} ouverte(s) pour ${closeP} fermée(s)).`;
          return;
        }
        if (/\b(SI|SOMME\.SI|SIERREUR|RECHERCHEV)\s*\([^)]*,[^0-9]/i.test(raw)) {
          fb.classList.add("warn");
          fb.textContent = "Camille : en version française, séparez les arguments par un point-virgule « ; » (la virgule sert aux décimales).";
          return;
        }
        const res = sp.eval(raw);
        if (res.ok) fb.classList.add("ok");
        else if (res.warn) fb.classList.add("warn");
        fb.textContent = res.msg.replace(/`/g, "");
        if (res.set) {
          const ctl = document.getElementById(res.set[0]);
          if (ctl && ctl.value !== String(res.set[1])) {
            ctl.value = res.set[1];
            ctl.dispatchEvent(new Event("input", { bubbles: true }));
            ctl.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      });
      bd.prepend(box);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(mountFxBars, 0));
  else setTimeout(mountFxBars, 0);

  const PROG = {
    ressource: "R1.01 · Méthodes de travail universitaire / Outils informatiques",
    competences: ["Dimensionner des ouvrages et des équipements techniques du BTP", "Organiser un chantier de BTP", "Piloter techniquement un ouvrage tout au long de sa vie"],
    acs: ["AC14.02 · Exploiter les pièces écrites, graphiques et numériques du dossier technique pour réaliser un quantitatif", "AC15.03 · Collecter, organiser et analyser des données"],
    sae: "SAÉ 1.05 · Devis d’un ouvrage simple",
  };
  (window.LABV3_COMPLEMENTS = window.LABV3_COMPLEMENTS || []).push({ C, PROG });
})();
