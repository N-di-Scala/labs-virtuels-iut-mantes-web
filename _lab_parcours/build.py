# -*- coding: utf-8 -*-
"""Construit la version standard d'un laboratoire virtuel (format « parcours »).

Usage :
    python _lab_parcours/build.py            # tous les labs qui ont un dossier ici
    python _lab_parcours/build.py r1-10      # un seul lab
puis :
    python _build_site.py                    # copie les labs dans labs/<id>/ et régénère le site

Chaîne de construction, à partir de la sauvegarde v1 (App_interactive/Sauvegarde_v1/) :
  1. couche de design et scènes 3D (_lab_v2/apply_lab_v2.py, fonction render) ;
  2. parcours par atelier : prédire, observer, mesurer, aller plus loin, diagnostic
     (moteur/parcours.js + contenus <lab>/parcours.js), avec les relances socratiques
     scriptées (<lab>/socratique.js : raisonnement, échanges, indices, reformulation) ;
  3. interface simplifiée : 3D seule, outils rangés dans « Plus », valeurs saisissables,
     objets 3D à attraper, étiquettes sans chevauchement (moteur/interface.js).
Le fichier produit remplace App_interactive/Lab_virtuel_<code>.html.

Dossier d'un lab (<id>/) :
  parcours.js       contenus pédagogiques (window.LABV3_PARCOURS), obligatoire
  socratique.js     relances socratiques (conceptions erronées), chargé après parcours.js
  config.py         facultatif : TAIL, SCENES, DEBATS_EXTRA, hook(html), HANDLES, PATCHES
"""
from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
sys.path.insert(0, str(WEB / "_lab_v2"))
sys.path.insert(0, str(WEB))
from apply_lab_v2 import LABS, render, read  # noqa: E402
from debats import DEBATS  # noqa: E402

MOTEUR = HERE / "moteur"


def labs_disponibles() -> list[str]:
    return [p.name for p in sorted(HERE.iterdir()) if p.is_dir() and p.name in LABS and (p / "parcours.js").exists()]


def charger_config(lab: str):
    f = HERE / lab / "config.py"
    if not f.exists():
        return None
    spec = importlib.util.spec_from_file_location(f"config_{lab.replace('-', '_')}", f)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def sub1(html: str, old: str, new: str, what: str, lab: str) -> str:
    n = html.count(old)
    if n != 1:
        raise SystemExit(f"{lab} : ancre « {what} » trouvée {n} fois (1 attendue)")
    return html.replace(old, new)


def raccords_communs(html: str, lab: str) -> str:
    """Raccords de la v1 communs à tous les labs : compteurs, étoile du parcours, questions flash."""
    # compteurs d'exploration et d'étoiles calculés sur la liste réelle des ateliers
    html, n1 = re.subn(r'\$\("prog-count"\)\.textContent = n \+ "/\d+";', '$("prog-count").textContent = n + "/" + EXPLORABLE.length;', html)
    html, n2 = re.subn(r'\$\("prog-fill"\)\.style\.width = \(n / \d+ \* 100\) \+ "%";', '$("prog-fill").style.width = (n / EXPLORABLE.length * 100) + "%";', html)
    html, n3 = re.subn(r'\$\("star-count"\)\.textContent = sc \+ "/\d+";', '$("star-count").textContent = sc + "/" + EXPLORABLE.length;', html)
    html, n4 = re.subn(r'\$\("star-fill"\)\.style\.width = \(sc / \d+ \* 100\) \+ "%";', '$("star-fill").style.width = (sc / EXPLORABLE.length * 100) + "%";', html)
    if (n1, n2, n3, n4) != (1, 1, 1, 1):
        raise SystemExit(f"{lab} : compteurs de progression introuvables {(n1, n2, n3, n4)}")
    # étoile attribuée par le parcours (fin de l'étape 3)
    html = sub1(html, "  function markExplored(key) {",
                "  window.LABV1 = { star(k) { if (!store.stars[k]) { store.stars[k] = true; save(); renderHud(); } } };\n  function markExplored(key) {",
                "étoile du parcours", lab)
    # questions flash : entraînement, l'étoile vient aussi du parcours
    html = html.replace("Défi express - décrochez l’étoile", "Questions flash - entraînement (l’étoile s’obtient aussi en terminant le parcours)")
    return html


def build(dossier: str) -> Path:
    # Un dossier de variante (ex. r1-10-socratique) déclare LAB et OUT dans son config.py
    # et peut fournir son propre moteur (<dossier>/moteur/) : le lab standard n'est pas touché.
    cfg = charger_config(dossier) if (HERE / dossier).is_dir() else None
    lab = getattr(cfg, "LAB", dossier) if cfg else dossier
    if lab not in LABS:
        raise SystemExit(f"lab inconnu : {dossier}")
    d = HERE / dossier
    moteur = d / "moteur" if (d / "moteur").is_dir() else MOTEUR

    def m(n: str) -> str:
        return read(moteur / n) if (moteur / n).exists() else read(MOTEUR / n)

    src: Path = LABS[lab]["src"]
    v1 = src.parent / "Sauvegarde_v1" / src.name
    out: Path = getattr(cfg, "OUT", src) if cfg else src
    tail_files = list(getattr(cfg, "TAIL", ["parcours.js"]) if cfg else ["parcours.js"])
    # relances socratiques du lab (socratique.js), chargées juste après les contenus du parcours
    if (d / "socratique.js").exists() and "socratique.js" not in tail_files:
        tail_files.insert(tail_files.index("parcours.js") + 1, "socratique.js")
    # compléments pédagogiques (distracteurs, idées clés, variantes, transfert, durées, programme)
    if (d / "complements.js").exists() and "complements.js" not in tail_files:
        i = tail_files.index("socratique.js") + 1 if "socratique.js" in tail_files else tail_files.index("parcours.js") + 1
        tail_files.insert(i, "complements.js")
    tail = "\n".join([read(d / n) for n in tail_files]
                     + [m("parcours.js"), m("interface.js"), m("camille.js"), m("extensions.js")])
    scenes = "\n".join(read(d / n) for n in (getattr(cfg, "SCENES", []) if cfg else []))
    hook_lab = getattr(cfg, "hook", None) if cfg else None

    def v1_hook(html: str) -> str:
        if hook_lab:
            html = hook_lab(html)
        return raccords_communs(html, lab)

    debats = {**DEBATS.get(lab, {}), **(getattr(cfg, "DEBATS_EXTRA", {}) if cfg else {})}
    html = render(
        lab, read(v1), v1_hook=v1_hook,
        extra_css="\n".join(m(n) for n in ["parcours.css", "interface.css", "socratique.css", "complements.css"] + getattr(cfg, "CSS_EXTRA", [])),
        extra_tail=tail,
        extra_scenes=scenes,
        conf_extra={"debats": debats},
    )
    # poignées 3D (appel inséré juste avant une ancre de la scène) et retouches de textes
    for anchor, call in (getattr(cfg, "HANDLES", []) if cfg else []):
        html = sub1(html, anchor, call + anchor, "poignée " + call.split('"')[3], lab)
    for old, new, what in (getattr(cfg, "PATCHES", []) if cfg else []):
        html = sub1(html, old, new, what, lab)
    # axes fléchés (grandeur, unité, sens de lecture) des graphiques 2D conservés
    sys.path.insert(0, str(MOTEUR))
    import axes2d
    html = axes2d.apply(html, lab)
    # une seule tutrice dans tous les labs : Camille (avatar 3D) remplace les mascottes propres à chaque lab
    html = re.sub(r"\b(Casque|Gouttelette|Clairon|Calorine|Thermie|Solaire) souffle", "Camille souffle", html)
    html = re.sub(r'<svg class="coach-ic"[^>]*>.*?</svg>', '<span class="v4-av" aria-hidden="true"></span>', html, flags=re.S)
    # vouvoiement partout : les bulles d'indice d'origine tutoyaient
    for a, b in [
        ("réponds d’abord dans ta tête, vérifie ensuite avec les curseurs.", "répondez d’abord de tête, vérifiez ensuite avec les curseurs."),
        ("relis « À retenir » des ateliers avant de te lancer.", "relisez « À retenir » des ateliers avant de vous lancer."),
        ("souffle : cherche qui", "souffle : cherchez qui"),
        ("souffle : compare ", "souffle : comparez "),
        ("souffle : fais le bilan", "souffle : faites le bilan"),
        ("souffle : pense « ", "souffle : pensez « "),
    ]:
        html = html.replace(a, b)
    # première balise </head> : celle du document (les suivantes sont dans des chaînes JS)
    html = html.replace("</head>", "<script>\n" + m("axes2d.js") + "\n</script>\n</head>", 1)
    # bascule FR / EN : dictionnaire commun (moteur/en.json) complété par celui du lab (<id>/en.json).
    # Injecté en tête de page pour intercepter le texte peint dans les canevas dès le départ ;
    # le dictionnaire, posé après les retouches de tirets, garde les clés telles qu'elles s'affichent.
    import json
    dico = {}
    for f in (HERE / "site" / "en.json", MOTEUR / "en.json", d / "en.json"):
        if f.exists():
            dico.update(json.loads(f.read_text(encoding="utf-8")))
    for f in (HERE / "site" / "en-extra.tsv", MOTEUR / "en-extra.tsv", d / "en-extra.tsv"):
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                if "\t" in line and not line.startswith("#"):
                    k, v = line.split("\t", 1)
                    dico[k] = v
    i18n = "window.LABI18N_EN = " + json.dumps(dico, ensure_ascii=False).replace("</", "<\\/") + ";\n" + m("i18n.js")
    ref_meta = '<meta name="referrer" content="strict-origin-when-cross-origin" />\n'
    html = html.replace("<head>", "<head>\n" + ref_meta + "<script>\n" + i18n + "\n</script>", 1) if "<head>" in html else html.replace("</head>", ref_meta + "<script>\n" + i18n + "\n</script>\n</head>", 1)
    # boutons d'indice des questions flash : le schéma 2D est remplacé par la scène 3D
    html = html.replace("Voir sur le schéma :", "Voir dans la 3D :")
    # tirets cadratins des textes d'origine remplacés par des tirets courts
    html = html.replace(" — ", " - ").replace("—", "-")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return out


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ids = sys.argv[1:] or labs_disponibles()
    for lab in ids:
        p = build(lab)
        print(f"{lab} : {p.name} ({p.stat().st_size // 1024} Ko)")
    print("Lancer ensuite : python _build_site.py")


if __name__ == "__main__":
    main()
