# Labs virtuels au format « parcours » avec tuteur socratique scripté

Les six laboratoires (R1-1, R1-10, R1-13, R2-9, R3-10, R4-8) sont construits par :

```
python _lab_parcours/build.py          # tous les labs (ou un identifiant : r1-10, r2-9…)
python _build_site.py                  # copie dans labs/<id>/ et régénère le site
```

Le fichier produit remplace `IUT_Mantes/.../App_interactive/Lab_virtuel_<code>.html`.
La source reste la sauvegarde `App_interactive/Sauvegarde_v1/`, à laquelle on applique :

1. la couche de design et les scènes 3D (`_lab_v2/`, fonction `render`) ;
2. le parcours de chaque atelier en cinq étapes : prédire, observer (sans les chiffres),
   mesurer et expliquer, aller plus loin, diagnostic (`moteur/parcours.js` et `parcours.css`) ;
3. les relances socratiques scriptées, sans IA (`moteur/socratique.css`, contenus `<lab>/socratique.js`) :
   - après la prédiction, l'étudiant choisit le raisonnement qui la porte ;
   - si la prédiction ou ce raisonnement ne tient pas, un court échange de questions précède
     l'explication (une mauvaise réponse renvoie une question, pas la solution) ;
   - à l'étape 3 : question en retour à la première erreur, indices gradués, reformulation libre ;
   - au diagnostic : une question d'orientation après chaque essai manqué ;
4. la fin d'atelier : écran « atelier terminé », bouton vers l'atelier suivant non terminé
   (ou vers le bilan), carnet de l'atelier verrouillé pendant le parcours puis lisible
   en pleine page (questions flash, à retenir, prolongements, coin du maître d'œuvre).
   L'exploration libre déverrouille tout ;
5. l’interface simplifiée (`moteur/interface.js` et `interface.css`) : parcours à gauche,
   scène 3D au centre, commandes et mesures à droite ; accueil sans zoom à la molette ;
   « Réinitialiser tous les ateliers » dans le menu de gauche (revient aussi au parcours guidé) ;
6. les axes fléchés des graphiques 2D conservés (`moteur/axes2d.py` pour la liste,
   `moteur/axes2d.js` pour le tracé), et dans les scènes 3D les aides `SC.flux` et `SC.axis`
   (`_lab_v2/scenes/common.js`).

Les choix (prédiction, raisonnements, échanges, explication) s’affichent dans un ordre mélangé,
stable pour un même lab ; les questions flash de la v1 sont, elles, tirées au hasard à chaque chargement.

`_lab_v2/apply_lab_v2.py` refuse de reconstruire un lab qui a un dossier ici.

7. les compléments (`<lab>/complements.js`, `moteur/extensions.js`, `moteur/complements.css`) :
   - Camille, la tutrice, même visage 3D dans tous les labs (rendu une fois en image), qui porte les échanges,
     les indices et les questions flash ;
   - choix « Je ne sais pas » parmi les raisonnements ; auto-évaluation de la reformulation (idées clés à cocher) ;
   - « À retenir » lisible dès l’explication validée (étape 3), le reste du carnet à la fin ;
   - question de transfert en fin d’atelier ; rappel espacé à l’ouverture d’un nouvel atelier,
     reprise de deux questions au retour après plus de deux jours ;
   - variante de l’énoncé de prédiction au second passage ; diagnostic sans chronomètre au premier passage
     (défi chronométré ensuite) ;
   - bilan : carte des conceptions et rapport de mission imprimable ;
   - durée estimée de chaque atelier, lien avec le programme national du B.U.T. GC-CD (ressource, compétences,
     apprentissages critiques, SAÉ) ;
   - anneaux de progression (menu, cartes), visite guidée du premier atelier, session sur ordinateur partagé
     (reprendre, nouvelle session, fichier de progression), étiquettes 3D à trois niveaux, liens indicateurs ↔ scène,
     commandes en tiroir sur téléphone, annonces pour lecteurs d’écran, thème du système à la première visite.

Le test de bout en bout `tests/test_parcours.js` joue les 39 ateliers (cinq étapes) depuis une page du serveur local.

## Dossier d'un lab

- `parcours.js` (obligatoire) : contenus pédagogiques dans `window.LABV3_PARCOURS`,
  avec pour chaque atelier `predict`, `observe`, `measure`, `plus`, `diag`, puis les badges.
  `keep2d` indique les graphes 2D conservés sous la 3D. Les champs `plus.demo` et `diag.fix`
  servent aux tests automatiques.
- `socratique.js` : relances fondées sur les conceptions erronées fréquentes du thème
  (`why`, `relance`, `rq`, `indices`, `reformule`, `questions`), chargé après `parcours.js`.
  La structure est décrite en tête de `r1-10/socratique.js`.
- `config.py` (facultatif) : fichiers supplémentaires (`TAIL`, `SCENES`), raccords propres
  au lab (`hook`), poignées 3D (`HANDLES`) et retouches de textes (`PATCHES`). Un dossier de
  variante peut aussi déclarer `LAB` (lab de base), `OUT` (fichier produit) et son propre `moteur/`.

R1-10 a en plus l'atelier 08 « Le réseau du Plateau » (`reseau.js`, `scene_reseau.js`)
et les compléments de l'atelier 05 et du mode avancé de l'atelier 07 (`extras.js`).

## Versions

Seule la version en vigueur est conservée : les anciennes versions archivées ont été supprimées en novembre 2026.
Les fichiers `App_interactive/Sauvegarde_v1/` restent indispensables : ils sont la source de la chaîne de construction.
L'approche pédagogique est décrite dans `Guide_pedagogique_labs_virtuels.md`, à la racine du site.

Toutes les valeurs des parcours sont génériques : aucune ne reprend une donnée d'un dossier noté.

## Version anglaise (bascule FR | EN)

Le sélecteur FR | EN, fixé en haut à droite, traduit le lab sur place, sans rechargement ; le choix est mémorisé pour tous les labs (et `?lang=en` dans l'adresse ouvre directement la version anglaise). Le français reste la source : `moteur/i18n.js` cherche chaque bloc de texte affiché dans un dictionnaire, les nombres étant remplacés par {0}, {1}… Dictionnaires :

- `<lab>/en.json` : traductions du lab (clé française → anglais), généré à partir des textes récoltés ;
- `<lab>/en-extra.tsv` : ajouts saisis à la main (clé<TAB>traduction) ;
- `moteur/en.json` (facultatif) : textes communs à tous les labs.

Un texte absent du dictionnaire reste en français. Les choix de vocabulaire sont fixés dans `glossaire_fr_en.md`.
