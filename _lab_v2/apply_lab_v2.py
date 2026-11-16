# -*- coding: utf-8 -*-
"""Applique la couche de design v2 « studio » aux laboratoires virtuels.

Usage :
    python _lab_v2/apply_lab_v2.py            # tous les labs
    python _lab_v2/apply_lab_v2.py r1-10      # un seul lab

Le script lit chaque laboratoire source (IUT_Mantes/.../App_interactive/),
retire une éventuelle couche v2 déjà présente (idempotent), puis injecte :
  - la feuille de style v2 (après le <style> d'origine) ;
  - la configuration + l'interface v2 (avant le script principal du lab) ;
  - le moteur 3D + les scènes du lab (module ES, three.js via CDN).
La logique pédagogique et les calculs de la v1 ne sont pas modifiés.
Les sauvegardes v1 sont dans App_interactive/Sauvegarde_v1/.
Ensuite, lancer _build_site.py pour régénérer le site.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from v1_patches import apply_patches  # noqa: E402
from debats import DEBATS  # noqa: E402

HERE = Path(__file__).resolve().parent
SRC = Path(r"c:\Users\nicodisc-admin\Desktop\Agent\Enseignement\IUT_Mantes")
THREE_VER = "0.170.0"

LABS = {
    "r1-1": {
        "src": SRC / "R 1-1 Méthode de travail universitaire et outils informatiques" / "App_interactive" / "Lab_virtuel_R1-1.html",
        "code": "R1-1", "level": "BUT 1 GC-CD",
        "titleHTML": "Classeur &amp; <em>méthode</em>",
        "mission": "Gymnase de Clairmont", "missionSub": "chantier imaginaire",
    },
    "r1-10": {
        "src": SRC / "R 1-10 Réseaux secs et humides" / "App_interactive" / "Lab_virtuel_R1-10.html",
        "code": "R1-10", "level": "BUT 1 GC-CD",
        "titleHTML": "Hydraulique <em>AEP</em>",
        "mission": "Valdeau", "missionSub": "commune imaginaire",
    },
    "r1-13": {
        "src": SRC / "R 1-13 Fonctions des composants des bâtiments" / "App_interactive" / "Lab_virtuel_R1-13.html",
        "code": "R1-13", "level": "BUT 1 GC-CD",
        "titleHTML": "Métrologie <em>d’essai</em>",
        "mission": "Pierreclaire", "missionSub": "laboratoire imaginaire",
    },
    "r2-9": {
        "src": SRC / "R 2-9 Transferts thermiques et hydriques dans les parois" / "App_interactive" / "Lab_virtuel_R2-9.html",
        "code": "R2-9", "level": "BUT 1 GC-CD",
        "titleHTML": "Parois <em>hygrothermiques</em>",
        "mission": "Halle de Valvert", "missionSub": "bâtiment imaginaire",
    },
    "r3-10": {
        "src": SRC / "R 3-10 Physique et Énergétique du bâtiment 1" / "App_interactive" / "Lab_virtuel_R3-10.html",
        "code": "R3-10", "level": "BUT 2 GC-CD",
        "titleHTML": "Énergétique du <em>bâtiment</em>",
        "mission": "Pavillon des Aulnes", "missionSub": "maison imaginaire",
    },
    "r4-8": {
        "src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "App_interactive" / "Lab_virtuel_R4-8.html",
        "code": "R4-8", "level": "BUT 2 GC-CD",
        "titleHTML": "Énergétique du <em>bâtiment 2</em>",
        "mission": "Maison de santé de Lironde", "missionSub": "projet imaginaire",
    },
}

FONTS = (
    '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800'
    '&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />'
)
MARK = re.compile(r"<!--LABV2:BEGIN:(\w+)-->.*?<!--LABV2:END:\1-->\n?", re.S)


def block(name: str, body: str) -> str:
    return f"<!--LABV2:BEGIN:{name}-->\n{body}\n<!--LABV2:END:{name}-->\n"


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def clean_dashes(html: str) -> str:
    """Tirets cadratins → tirets courts (règle éditoriale)."""
    html = html.replace(" — ", " - ").replace("—", "-")
    return html


def render(lab_id: str, html: str, v1_hook=None, extra_css: str = "", extra_tail: str = "",
           extra_scenes: str = "", conf_extra: dict | None = None) -> str:
    """Construit le HTML v2 d'un lab à partir de son texte v1 (aucune écriture de fichier).

    Les paramètres extra_* servent aux couches expérimentales (v3) ; vides, la sortie v2 est inchangée.
    """
    cfg = LABS[lab_id]
    html = MARK.sub("", html)
    html = clean_dashes(html)
    # Polices des schémas canvas : alignées sur la v2
    html = html.replace("'DM Sans'", "'Outfit'").replace("'IBM Plex Mono'", "'DM Mono'")
    html = html.replace("DM Sans, sans-serif", "'Outfit', sans-serif").replace("IBM Plex Mono, monospace", "'DM Mono', monospace")
    # Correctifs ciblés de la v1 (propositions d'amélioration) : stricts et réapplicables
    html, done = apply_patches(html, lab_id)
    for d in done:
        print(f"  correctif v1 appliqué · {lab_id} · {d}")
    if v1_hook:
        html = v1_hook(html)

    conf = {k: v for k, v in cfg.items() if k != "src"}
    if lab_id in DEBATS:
        conf["debats"] = DEBATS[lab_id]
    if conf_extra:
        conf.update(conf_extra)
    css = read(HERE / "lab-v2.css")
    ui = read(HERE / "lab-v2.js")
    engine = read(HERE / "lab-v2-3d.js")
    common = read(HERE / "scenes" / "common.js")
    scene_file = HERE / "scenes" / f"{lab_id}.js"
    scenes = read(scene_file) if scene_file.exists() else ""

    head_block = block(
        "head",
        FONTS + "\n<style id=\"lab-v2-css\">\n" + css + "\n</style>"
        + ("\n<style id=\"lab-v3-css\">\n" + extra_css + "\n</style>" if extra_css else ""),
    )
    i = html.find("</style>")
    if i < 0:
        raise SystemExit(f"{lab_id} : balise </style> introuvable")
    i += len("</style>")
    # le saut de ligne qui suit </style> est réutilisé : réinjecter ne crée pas de lignes vides
    j = i + 1 if html[i:i + 1] == "\n" else i
    html = html[:i] + "\n" + head_block + html[j:]

    ui_block = block(
        "ui",
        "<script>window.LABV2_CONF = " + json.dumps(conf, ensure_ascii=False) + ";</script>\n"
        "<script>\n" + ui + "\n</script>",
    )
    k = html.find("STORE_KEY")
    if k < 0:
        raise SystemExit(f"{lab_id} : script principal introuvable")
    s = html.rfind("<script>", 0, k)
    html = html[:s] + ui_block + html[s:]

    importmap = {
        "imports": {
            "three": f"https://cdn.jsdelivr.net/npm/three@{THREE_VER}/build/three.module.min.js",
            "three/addons/": f"https://cdn.jsdelivr.net/npm/three@{THREE_VER}/examples/jsm/",
        }
    }
    gl_block = block(
        "gl",
        '<script type="importmap">' + json.dumps(importmap) + "</script>\n"
        '<script type="module">\n' + engine + "\n" + common + "\n" + scenes
        + ("\n" + extra_scenes if extra_scenes else "") + "\n</script>",
    )
    if extra_tail:
        gl_block = "<script>\n" + extra_tail + "\n</script>\n" + gl_block
    b = html.rfind("</body>")
    html = html[:b] + gl_block + html[b:]
    return html


def apply(lab_id: str) -> Path:
    path: Path = LABS[lab_id]["src"]
    path.write_text(render(lab_id, read(path)), encoding="utf-8")
    return path


def main() -> None:
    ids = sys.argv[1:] or list(LABS)
    # les labs au format « parcours » se construisent par _lab_parcours/build.py (qui réutilise render)
    parcours = HERE.parent / "_lab_parcours"
    for lab_id in ids:
        if (parcours / lab_id / "parcours.js").exists():
            print(f"{lab_id} : format parcours, utiliser python _lab_parcours/build.py {lab_id}")
            continue
        p = apply(lab_id)
        print(f"v2 appliquée : {lab_id} -> {p.name} ({p.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
