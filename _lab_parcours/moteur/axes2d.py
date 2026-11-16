"""Axes fléchés des graphiques 2D encore affichés sous la 3D (voir axes2d.js).

Pour chaque lab : (fonction de dessin, variable du contexte, « gauche, haut, droite, bas »,
titre de x, titre de y, options JS). L'appel est inséré juste avant la fin de la fonction.
"""
from __future__ import annotations

import json

AXES = {
    "r1-1": [
        ("updateGraphiques", "ctx", "ox, oy, ox + gw, oy + gh", "semaine", "montant (€)", {"xpos": "center", "xdy": 36}),
    ],
    "r1-10": [
        ("moody", "c", "bx, by, bx + bw, by + bh", "Re (nombre de Reynolds, échelle log)", "λ (coefficient de perte de charge, échelle log)", {"xdy": 30, "ypos": "inside"}),
        ("drawCosts", "ctx", "x0, y1, x1, y0", "temps (années)", "coût cumulé (k€)", {"xdy": 30, "ypos": "inside"}),
    ],
    "r2-9": [
        ("drawCond", "ctx", "xL, yTop, xR, yBot", "x : position dans la paroi", "T (°C)", {"xpos": "center", "xdy": 28}),
        ("drawDju", "ctx", "x0, y0, x1, y1", "temps (jours)", "T (°C)", {"xpos": "center", "xdy": 36}),
        ("drawGlaser", "ctx", "x0, y0, x1, y1", "S_d cumulée (m)", "pression de vapeur p (Pa)", {"xpos": "center", "xdy": 48}),
        ("drawDyn", "ctx", "x0, y0, x1, y1", "t (h)", "T (°C)", {"xpos": "center", "xdy": 38, "ypos": "inside"}),
    ],
    "r3-10": [
        ("drawDju", "ctx", "x0, y0, x1, y1", "temps (jours)", "T (°C)", {"xpos": "center", "xdy": 36}),
    ],
    "r4-8": [
        ("drawInertie", "ctx", "x0, y0, x1, y1", "t (h)", None, {"xpos": "center", "xdy": 38}),
    ],
}


def _fin_fonction(html: str, nom: str) -> int:
    """Position de l'accolade fermante de « function nom(...) { ... } »."""
    i = html.find(f"function {nom}(")
    if i < 0 or html.find(f"function {nom}(", i + 1) >= 0:
        raise SystemExit(f"axes 2D : fonction {nom} introuvable ou en double")
    j = html.index("{", html.index(")", i))
    depth = 0
    k = j
    while True:
        ch = html[k]
        if ch in "\"'`":  # chaîne : on la saute (gabarits simples, sans ${} imbriqué contenant des accolades)
            q = ch
            k += 1
            while html[k] != q:
                if html[k] == "\\":
                    k += 1
                k += 1
        elif ch == "/" and html[k + 1] == "/":
            k = html.index("\n", k)
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return k
        k += 1


def apply(html: str, lab: str) -> str:
    for nom, ctx, box, xl, yl, opt in AXES.get(lab, []):
        k = _fin_fonction(html, nom)
        call = (f"\n    window.LABAX && window.LABAX({ctx}, {box}, {json.dumps(xl, ensure_ascii=False)}, "
                f"{json.dumps(yl, ensure_ascii=False)}, {json.dumps(opt)});\n  ")
        html = html[:k] + call + html[k:]
    return html
