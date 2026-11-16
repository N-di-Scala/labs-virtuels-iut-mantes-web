# -*- coding: utf-8 -*-
"""R2-9 Parois hygrothermiques : poignées 3D existantes (ateliers 01 et 06) déclarées à l'interface
et soumises au verrou de l'étape 1. Utilisé par _lab_parcours/build.py."""

HANDLES = []

PATCHES = [
    # atelier 01 : interface isolant/béton (glisser horizontal, épaisseur d'isolant)
    ("  K.drag(grip, {\n    cursor: \"ew-resize\",\n    tip: \"<b>Glisser l’interface</b>",
     "  window.LABV4R && window.LABV4R(K, \"cond\", grip, \"L’interface isolant/béton (bande dorée)\", \"glisser vers la gauche ou la droite pour changer l’épaisseur d’isolant e<sub>1</sub>\", \"x\");\n  K.drag(grip, {\n    cursor: \"ew-resize\",\n    tip: \"<b>Glisser l’interface</b>",
     "poignée interface"),
    ("      const inp = document.getElementById(\"e1\");\n",
     "      const inp = document.getElementById(\"e1\");\n      if (!g0 || inp.disabled || inp.closest(\".v3-locked, .v3-picking, .v3-dim\")) return;\n",
     "verrou poignée interface"),
    # atelier 06 : face libre de l'isolant (ITI ou ITE)
    ("  [iso[0], iso[1], isoExt].forEach((m) => K.drag(m, dragIso));",
     "  [iso[0], iso[1], isoExt].forEach((m) => K.drag(m, dragIso));\n  [iso[0], isoExt].forEach((m) => window.LABV4R && window.LABV4R(K, \"rehab\", m, \"L’isolant\", \"glisser sa face libre pour changer son épaisseur\", \"x\"));",
     "poignée isolant"),
    ("      const inp = document.getElementById(\"eiso\");\n",
     "      const inp = document.getElementById(\"eiso\");\n      if (inp.disabled || inp.closest(\".v3-locked, .v3-picking, .v3-dim\")) return;\n",
     "verrou poignée isolant"),
]
