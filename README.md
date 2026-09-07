# Laboratoires virtuels — IUT Mantes (GC-CD)

Site **public** pour les étudiants : laboratoires HTML + infographies PNG.

Adresse Pages (après activation) :

`https://N-di-Scala.github.io/labs-virtuels-iut-mantes-web/`

## Contenu

- `labs/r1-1/` … `labs/r4-8/` : chaque `index.html` est le laboratoire virtuel.
- `infographies/` : PNG pédagogiques (pas les vidéos).
- `videos.js` : coller ici les identifiants YouTube une fois les imports faits.

## Ce qui n’est pas dans ce dépôt

- sujets et corrigés des projets notés ;
- classeurs Excel, PDF de notes de calcul ;
- fichiers `.mp4` (trop lourds pour GitHub — à mettre sur YouTube en non répertorié).

## Relier une vidéo YouTube

1. Importer le MP4 sur YouTube (compte @uvsq), visibilité **Non répertoriée**.
2. Copier l’identifiant (après `v=` dans l’URL).
3. Dans `videos.js`, remplir le champ `id` de la ligne correspondante (`mp4` rappelle le fichier source).
4. `git add videos.js && git commit && git push` : le site se met à jour.

## Mise à jour d’un lab

Remplacer le HTML dans `Enseignement/IUT_Mantes/.../App_interactive/`, relancer `_build_site.py`, puis commit / push.
