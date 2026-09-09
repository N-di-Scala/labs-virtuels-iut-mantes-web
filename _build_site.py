# -*- coding: utf-8 -*-
"""Assemble le site GitHub Pages (labs HTML + PNG, sans vidéos)."""
from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = Path(r"c:\Users\nicodisc-admin\Desktop\Agent\Enseignement\IUT_Mantes")
CONSIGNES = SRC / "Infographie_consignes_etudiants.png"

SEMESTERS = [
    {
        "id": "s1",
        "code": "S1",
        "year": "1re année",
        "title": "Semestre 1",
        "subtitle": "Méthode de travail, réseaux, métrologie",
        "accent": "#41c7e4",
    },
    {
        "id": "s2",
        "code": "S2",
        "year": "1re année",
        "title": "Semestre 2",
        "subtitle": "Transferts thermiques et hydriques",
        "accent": "#e08a5a",
    },
    {
        "id": "s3",
        "code": "S3",
        "year": "2e année",
        "title": "Semestre 3",
        "subtitle": "Physique et énergétique du bâtiment 1",
        "accent": "#95d5b2",
    },
    {
        "id": "s4",
        "code": "S4",
        "year": "2e année",
        "title": "Semestre 4",
        "subtitle": "Physique et énergétique du bâtiment 2",
        "accent": "#f0c674",
    },
]

PROJECTS = [
    {
        "id": "r1-1",
        "semester": "s1",
        "code": "R 1-1",
        "title": "Méthode de travail universitaire",
        "subtitle": "Tableur, références, logique de classeur",
        "mission": "Gymnase de Clairmont",
        "lab_src": SRC / "R 1-1 Méthode de travail universitaire et outils informatiques" / "App_interactive" / "Lab_virtuel_R1-1.html",
        "media_src": SRC / "R 1-1 Méthode de travail universitaire et outils informatiques" / "Vidéos_infographies",
        "accent": "#3ecf8e",
    },
    {
        "id": "r1-10",
        "semester": "s1",
        "code": "R 1-10",
        "title": "Réseaux secs et humides",
        "subtitle": "Hydraulique AEP, charges, pertes, pompe",
        "mission": "Valdeau",
        "lab_src": SRC / "R 1-10 Réseaux secs et humides" / "App_interactive" / "Lab_virtuel_R1-10.html",
        "media_src": SRC / "R 1-10 Réseaux secs et humides" / "Vidéos_infographies",
        "accent": "#41c7e4",
    },
    {
        "id": "r1-13",
        "semester": "s1",
        "code": "R 1-13",
        "title": "Fonctions des composants des bâtiments",
        "subtitle": "Métrologie, incertitudes, conformité",
        "mission": "Pierreclaire",
        "lab_src": SRC / "R 1-13 Fonctions des composants des bâtiments" / "App_interactive" / "Lab_virtuel_R1-13.html",
        "media_src": SRC / "R 1-13 Fonctions des composants des bâtiments" / "Vidéos_infographies",
        "accent": "#8fd3b0",
    },
    {
        "id": "r2-9",
        "semester": "s2",
        "code": "R 2-9",
        "title": "Transferts thermiques et hydriques",
        "subtitle": "Parois, confort, Glaser, ITI / ITE",
        "mission": "Halle de Valvert",
        "lab_src": SRC / "R 2-9 Transferts thermiques et hydriques dans les parois" / "App_interactive" / "Lab_virtuel_R2-9.html",
        "media_src": SRC / "R 2-9 Transferts thermiques et hydriques dans les parois" / "Vidéos_infographies",
        "accent": "#e08a5a",
    },
    {
        "id": "r3-10",
        "semester": "s3",
        "code": "R 3-10",
        "title": "Physique et énergétique du bâtiment 1",
        "subtitle": "Transmission, DJU, DPE, rénovation",
        "mission": "Pavillon des Aulnes",
        "lab_src": SRC / "R 3-10 Physique et Énergétique du bâtiment 1" / "App_interactive" / "Lab_virtuel_R3-10.html",
        "media_src": SRC / "R 3-10 Physique et Énergétique du bâtiment 1" / "Vidéos_infographies",
        "accent": "#95d5b2",
    },
    {
        "id": "r4-8",
        "semester": "s4",
        "code": "R 4-8",
        "title": "Physique et énergétique du bâtiment 2",
        "subtitle": "Été, inertie, BEPOS, aéraulique, acoustique",
        "mission": "Maison de santé de Lironde",
        "lab_src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "App_interactive" / "Lab_virtuel_R4-8.html",
        "media_src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "Vidéos_infographies",
        "accent": "#f0c674",
    },
]

PLAYLISTS = {
    "r1-1": "PLdvfbV6gHmIs",
    "r1-10": "PLOtp-9v_CG9E",
    "r1-13": "PLOUGV3afMlSA",
    "r3-10": "PLU-mhVpV4vZ0",
}

VIDEO_IDS = {
    "r1-1/1-automatisation-du-suivi-de-chantier.png": "QO5S8-SY8Gk",
    "r1-1/2-budget-de-chantier-avec-somme-si.png": "RfgMrGv0h7U",
    "r1-1/3-guide-du-pilotage-par-tcd.png": "tHIdovQdoV8",
    "r1-1/4-concevoir-un-tableau-de-bord.png": "sI89pUaTGo8",
    "r1-1/5-les-fondamentaux-d-un-tableur-professionnel.png": "oykX68_NGug",
    "r1-10/1-les-fondamentaux-de-l-aep.png": "IfY00H-DeXE",
    "r1-10/2-masse-volumique-versus-viscosite.png": "eHxa7GX64C0",
    "r1-10/3-comprendre-la-pression-hydrostatique.png": "Ea4we82args",
    "r1-10/4-comprendre-la-charge-hydraulique-bernoulli.png": "RI4u-O8MEBw",
    "r1-10/5-les-pertes-de-charge-lineaires.png": "AxpnPHgEtYY",
    "r1-10/6-pertes-de-charge-en-aep.png": "b_AqoX5MTxo",
    "r1-10/7-guide-de-selection-de-pompe.png": "p0_S3oV2bTQ",
    "r1-13/1-comprendre-les-incertitudes-de-mesure.png": "s7_QM8P2aCE",
    "r1-13/2-la-propagation-des-incertitudes.png": "92IBJeWBkwk",
    "r1-13/3-incertitude-et-conformite-decisionnelle.png": "VHfqS-rlQzw",
    "r1-13/4-guide-de-conformite-des-lots.png": "YPMf3Mss2ig",
    "r1-13/5-le-budget-d-incertitudes-en-btp.png": "8q9lbUvqEzY",
    "r3-10/1-guide-d-analyse-des-deperditions-thermiques.png": "yrmPQ_9LN8E",
    "r3-10/2-comprendre-l-indicateur-thermique-hbat.png": "JTATHtqHXiQ",
    "r3-10/3-comprendre-le-processus-du-dpe.png": "TPDGJ40naqo",
    "r3-10/4-renover-l-enveloppe-strategie-coherente.png": "_qlOBY1eH6Q",
    "r3-10/5-dimensionnement-vmc-et-pac.png": "LmwkgN5VbmY",
    "r3-10/6-reussir-son-bilan-energetique.png": "0ufPGzwFKNw",
}

SEM_BY_ID = {s["id"]: s for s in SEMESTERS}


def slugify(name: str) -> str:
    stem = Path(name).stem
    n = unicodedata.normalize("NFD", stem)
    n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    n = n.replace("œ", "oe").replace("Œ", "oe")
    n = n.lower()
    n = re.sub(r"[^a-z0-9]+", "-", n)
    return n.strip("-")


def pretty_title(stem: str) -> str:
    t = re.sub(r"^\d+\.", "", stem).replace("_", " ").replace("___", " — ").replace("  ", " ")
    t = re.sub(r"\s+", " ", t).strip(" .")
    return t


def collect_pngs(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    files = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() == ".png"]

    def key(p: Path):
        m = re.match(r"^(\d+)", p.name)
        return (int(m.group(1)) if m else 99, p.name.lower())

    return sorted(files, key=key)


def patch_lab_html(html: str, semester_id: str) -> str:
    sem = SEM_BY_ID[semester_id]
    if "iut_mantes_theme" not in html:
        html = html.replace(
            '<html lang="fr" data-theme="dark">',
            '<html lang="fr" data-theme="dark">\n'
            "<script>(function(){try{var t=localStorage.getItem('iut_mantes_theme');"
            "if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();</script>",
            1,
        )
        html = html.replace(
            "    store.theme = t;\n    save();",
            '    store.theme = t;\n    try { localStorage.setItem("iut_mantes_theme", t); } catch (_) {}\n    save();',
            1,
        )
        html = html.replace(
            '    applyTheme(store.theme === "light" ? "light" : "dark");',
            "    let siteTheme = \"\";\n"
            '    try { siteTheme = localStorage.getItem("iut_mantes_theme") || ""; } catch (_) {}\n'
            '    applyTheme(siteTheme === "light" || siteTheme === "dark" ? siteTheme : (store.theme === "light" ? "light" : "dark"));',
            1,
        )
    if ".site-back" not in html:
        html = html.replace(
            "</style>",
            "  .site-back { display:inline-flex; margin: 0 0 0.75rem; font-size: 0.78rem; font-weight: 650;"
            " color: var(--water, #41c7e4); text-decoration: none; }\n"
            "  .site-back:hover { text-decoration: underline; }\n</style>",
            1,
        )
        html = html.replace(
            "    </div>\n    <p class=\"brand-sub\">",
            "    </div>\n"
            f'    <a class="site-back" href="../../{sem["id"]}/index.html">← {sem["code"]} · {sem["title"]}</a>\n'
            '    <p class="brand-sub">',
            1,
        )
    return html


def main() -> None:
    labs_dir = ROOT / "labs"
    img_root = ROOT / "infographies"
    labs_dir.mkdir(exist_ok=True)
    img_root.mkdir(exist_ok=True)

    if CONSIGNES.is_file():
        shutil.copy2(CONSIGNES, img_root / "consignes-etudiants.png")

    catalog = []
    yt_map = {}
    for proj in PROJECTS:
        lab_dst_dir = labs_dir / proj["id"]
        lab_dst_dir.mkdir(exist_ok=True)
        if not proj["lab_src"].is_file():
            raise SystemExit(f"Lab manquant : {proj['lab_src']}")
        html = proj["lab_src"].read_text(encoding="utf-8")
        (lab_dst_dir / "index.html").write_text(patch_lab_html(html, proj["semester"]), encoding="utf-8")

        img_dst = img_root / proj["id"]
        img_dst.mkdir(exist_ok=True)
        items = []
        for png in collect_pngs(proj["media_src"]):
            dest_name = slugify(png.name) + ".png"
            dest = img_dst / dest_name
            if not dest.exists() or png.stat().st_mtime > dest.stat().st_mtime:
                shutil.copy2(png, dest)
            key = f"{proj['id']}/{dest_name}"
            num = re.match(r"^(\d+)", png.name)
            mp4_hint = ""
            if num:
                n = num.group(1)
                for cand in proj["media_src"].iterdir():
                    if cand.suffix.lower() == ".mp4" and cand.name.startswith(n + "."):
                        mp4_hint = cand.name
                        break
            yt_map[key] = {
                "id": VIDEO_IDS.get(key, ""),
                "mp4": mp4_hint,
                "title": pretty_title(png.stem),
            }
            items.append(
                {
                    "file": dest_name,
                    "title": pretty_title(png.stem),
                    "key": key,
                    "mp4": mp4_hint,
                }
            )
        keys = ("id", "semester", "code", "title", "subtitle", "mission", "accent")
        catalog.append({**{k: proj[k] for k in keys}, "images": items})

    (ROOT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "videos.js").write_text(render_videos_js(yt_map), encoding="utf-8")
    (ROOT / "index.html").write_text(render_home(catalog), encoding="utf-8")
    (ROOT / "charte.html").write_text(render_charte(), encoding="utf-8")
    (ROOT / "404.html").write_text(render_404(), encoding="utf-8")
    for sem in SEMESTERS:
        sem_dir = ROOT / sem["id"]
        sem_dir.mkdir(exist_ok=True)
        items = [p for p in catalog if p["semester"] == sem["id"]]
        (sem_dir / "index.html").write_text(render_semester(sem, items), encoding="utf-8")
    (ROOT / "README.md").write_text(render_readme(), encoding="utf-8")
    n_png = sum(len(p["images"]) for p in catalog)
    print(f"OK : accueil + 4 semestres, {len(catalog)} labs, {n_png} infographies PNG")


def render_videos_js(yt_map: dict) -> str:
    lines = [
        "/* Identifiants YouTube (après v=) et playlists. Le champ mp4 est un aide-mémoire local. */",
        "window.YOUTUBE_PLAYLISTS = {",
    ]
    for pid, pl in PLAYLISTS.items():
        lines.append(f"  '{pid}': '{pl}',")
    lines.append("};")
    lines.append("window.YOUTUBE_IDS = {")
    for key, meta in yt_map.items():
        comment = meta["mp4"].replace("\\", "/").replace("'", "\\'") if meta["mp4"] else ""
        title = meta["title"].replace("'", "\\'")
        vid = (meta.get("id") or "").replace("'", "\\'")
        lines.append(f"  '{key}': {{ id: '{vid}', title: '{title}', mp4: '{comment}' }},")
    lines.append("};")
    return "\n".join(lines) + "\n"


def chrome(base: str, crumb: str, title: str) -> tuple[str, str]:
    home = f"{base}index.html" if base else "index.html"
    head = f"""<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<meta name="theme-color" content="#07131d" />
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,650;0,9..40,800;1,9..40,400&family=IBM+Plex+Mono:wght@500;650&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="{base}assets/site.css" />
<script>(function(){{try{{var t=localStorage.getItem("iut_mantes_theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else if(matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.dataset.theme="light";}}catch(e){{}}}})();</script>
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="topbar">
  <div>
    <a class="home" href="{home}">IUT Mantes · GC-CD</a>
    {crumb}
  </div>
  <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Activer le mode clair">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>
    <span data-theme-label>Mode clair</span>
  </button>
</header>
"""
    foot = f"""
<footer class="credit" aria-label="Crédit">
  <div>
    <div class="who">Nicolas di Scala</div>
    <div class="role">Maître de conférences en Physique (28<sup>e</sup> section)</div>
  </div>
  <div class="mid">
    <div class="who">BUT Génie Civil — Construction Durable</div>
    <div class="role">Laboratoires virtuels pédagogiques</div>
  </div>
  <div>
    <div class="who">IUT Mantes-en-Yvelines</div>
    <div class="role">Génie Civil - Construction Durable (GC-CD)</div>
  </div>
</footer>
<script src="{base}assets/theme.js"></script>
"""
    return head, foot


def lab_cards(items: list, base: str) -> str:
    cards = []
    for p in items:
        n = len(p["images"])
        pl = PLAYLISTS.get(p["id"], "")
        yt_btn = ""
        if pl:
            yt_btn = (
                f'<a class="btn ghost" href="https://www.youtube.com/playlist?list={pl}" '
                f'target="_blank" rel="noopener">Vidéos</a>'
            )
        cards.append(
            f"""
        <article class="lab-card" data-lab="{p['id']}" style="--accent:{p['accent']}">
          <p class="code">{p['code']}</p>
          <h2>{p['title']}</h2>
          <p class="sub">{p['subtitle']}</p>
          <p class="mission">Entraînement : {p['mission']}</p>
          <div class="actions">
            <a class="btn primary" href="{base}labs/{p['id']}/index.html">Ouvrir le laboratoire virtuel</a>
            <button type="button" class="btn ghost" data-toggle-gallery="{p['id']}" aria-expanded="false" aria-controls="g-{p['id']}">Infographies et vidéos ({n})</button>
            {yt_btn}
          </div>
          {one_gallery(p, base)}
        </article>"""
        )
    return "".join(cards)


def one_gallery(p: dict, base: str) -> str:
    figs = []
    for im in p["images"]:
        figs.append(
            f"""
            <figure class="fig" data-key="{im['key']}">
              <a href="{base}infographies/{p['id']}/{im['file']}" target="_blank" rel="noopener">
                <img src="{base}infographies/{p['id']}/{im['file']}" alt="{im['title']}" loading="lazy" />
              </a>
              <figcaption>
                <strong>{im['title']}</strong>
                <span class="yt" hidden></span>
              </figcaption>
            </figure>"""
        )
    return f"""
          <section class="gallery" id="g-{p['id']}" hidden>
            <p class="hint">Cliquez une image pour l’ouvrir en grand.</p>
            <div class="grid-figs">{''.join(figs)}</div>
          </section>"""


def render_home(catalog: list) -> str:
    by_sem = {s["id"]: [p for p in catalog if p["semester"] == s["id"]] for s in SEMESTERS}
    cards = []
    for s in SEMESTERS:
        mods = ", ".join(p["code"] for p in by_sem[s["id"]])
        n = len(by_sem[s["id"]])
        cards.append(
            f"""
      <a class="sem-card" href="{s['id']}/index.html" style="--accent:{s['accent']}">
        <p class="code">{s['code']} · {s['year']}</p>
        <h2>{s['title']}</h2>
        <p class="sub">{s['subtitle']}</p>
        <p class="mods">{n} ressource{"s" if n > 1 else ""} : {mods}</p>
        <span class="go">Entrer dans le semestre →</span>
      </a>"""
        )
    head, foot = chrome("", "", "Laboratoires virtuels — IUT Mantes · GC-CD")
    return f"""{head}
<main class="wrap" id="contenu">
  <p class="eyebrow">IUT Mantes-en-Yvelines · GC-CD</p>
  <h1>Laboratoires virtuels &amp; infographies</h1>
  <p class="lede">Choisissez d’abord votre semestre. Vous y trouverez le laboratoire interactif, les infographies et, lorsqu’elles existent, les vidéos de cours.</p>
  <p class="note">Site public pédagogique : pas de sujets notés, pas de corrigés, pas de chiffres des dossiers. Les QCM des labs sont formatifs (mission fictive).</p>
  <section class="semesters" aria-label="Semestres">{''.join(cards)}</section>
  <section class="charte" aria-labelledby="charte-titre">
    <div class="txt">
      <h2 id="charte-titre">Charte du projet — déroulé des séances</h2>
      <p>Rôles, rituel de séance, note, interlocuteur mystère et usage de l’IA. À lire avant de commencer un projet.</p>
      <a class="btn primary" href="charte.html">Lire la charte</a>
    </div>
    <a class="preview" href="charte.html">
      <img src="infographies/consignes-etudiants.png" alt="Aperçu de la charte du projet, mode BET" />
    </a>
  </section>
</main>
{foot}
</body>
</html>
"""


def render_semester(sem: dict, items: list) -> str:
    crumb = f'<span class="crumb"> · {sem["code"]} {sem["title"]}</span>'
    head, foot = chrome(
        "../",
        crumb,
        f"{sem['code']} {sem['title']} — Laboratoires virtuels · IUT Mantes",
    )
    return f"""{head}
<main class="wrap" id="contenu">
  <p class="eyebrow">{sem["year"]} · BUT GC-CD</p>
  <h1>{sem["code"]} — {sem["title"]}</h1>
  <p class="lede">{sem["subtitle"]}. Ouvrez un laboratoire, consultez les infographies, ou lancez les vidéos lorsqu’un lien est proposé.</p>
  <p><a class="btn ghost" href="../charte.html">Charte du projet</a></p>
  <section class="labs stack" aria-label="Ressources du semestre">{lab_cards(items, "../")}</section>
</main>
{foot}
<script src="../videos.js"></script>
<script src="../assets/hub.js"></script>
</body>
</html>
"""


def render_charte() -> str:
    head, foot = chrome("", '<span class="crumb"> · Charte du projet</span>', "Charte du projet — IUT Mantes · GC-CD")
    return f"""{head}
<main class="wrap charte-page" id="contenu">
  <p class="eyebrow">Tous semestres</p>
  <h1>Charte du projet — mode BET</h1>
  <p class="lede">Déroulé des séances à l’IUT : rôles, chaîne du projet, rituel, notation, interlocuteur mystère et outils.</p>
  <p><a class="btn ghost" href="index.html">Retour à l’accueil</a></p>
  <p><img src="infographies/consignes-etudiants.png" alt="Charte du projet – mode BET : vous êtes des techniciens-conseils en équipe" /></p>
</main>
{foot}
</body>
</html>
"""


def render_404() -> str:
    head, foot = chrome("", "", "Page introuvable — IUT Mantes · GC-CD")
    return f"""{head}
<main class="wrap" id="contenu">
  <p class="eyebrow">Erreur 404</p>
  <h1>Cette page n’existe pas</h1>
  <p class="lede">Revenez à l’accueil pour choisir un semestre.</p>
  <p><a class="btn primary" href="index.html">Retour à l’accueil</a></p>
</main>
{foot}
</body>
</html>
"""


def render_readme() -> str:
    return """# Laboratoires virtuels — IUT Mantes (GC-CD)

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
"""


if __name__ == "__main__":
    main()
