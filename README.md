# Laboratoires virtuels — IUT Mantes (GC-CD)

Site **public** pour les étudiants : laboratoires HTML + infographies PNG.

Adresse Pages : `https://N-di-Scala.github.io/labs-virtuels-iut-mantes-web/`

## Navigation

- `index.html` : choix du semestre (S1 à S4).
- `s1/` … `s4/` : laboratoire, infographies et liens vidéos du semestre.
- `charte.html` : infographie des consignes étudiants.
- `labs/` : applications HTML autonomes.
- `infographies/` : PNG pédagogiques (pas les vidéos).
- `videos.js` : identifiants YouTube.

Le thème clair / sombre est mémorisé (`iut_mantes_theme`) et suivi dans les laboratoires.

## Relier une vidéo YouTube

1. Importer le MP4 sur YouTube, visibilité **Non répertoriée**.
2. Copier l’identifiant (après `v=`).
3. Remplir le champ `id` dans `videos.js` (ou `VIDEO_IDS` dans `_build_site.py`).
