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

PROJECTS = [
    {
        "id": "r1-1",
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
        "code": "R 4-8",
        "title": "Physique et énergétique du bâtiment 2",
        "subtitle": "Été, inertie, BEPOS, aéraulique, acoustique",
        "mission": "Maison de santé de Lironde",
        "lab_src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "App_interactive" / "Lab_virtuel_R4-8.html",
        "media_src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "Vidéos_infographies",
        "accent": "#f0c674",
    },
]


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


def main() -> None:
    labs_dir = ROOT / "labs"
    img_root = ROOT / "infographies"
    if labs_dir.exists():
        shutil.rmtree(labs_dir)
    if img_root.exists():
        shutil.rmtree(img_root)
    labs_dir.mkdir()
    img_root.mkdir()

    catalog = []
    yt_map = {}
    for proj in PROJECTS:
        lab_dst_dir = labs_dir / proj["id"]
        lab_dst_dir.mkdir()
        if not proj["lab_src"].is_file():
            raise SystemExit(f"Lab manquant : {proj['lab_src']}")
        shutil.copy2(proj["lab_src"], lab_dst_dir / "index.html")

        img_dst = img_root / proj["id"]
        img_dst.mkdir()
        items = []
        for png in collect_pngs(proj["media_src"]):
            dest_name = slugify(png.name) + ".png"
            shutil.copy2(png, img_dst / dest_name)
            key = f"{proj['id']}/{dest_name}"
            # Matching mp4 by leading number
            num = re.match(r"^(\d+)", png.name)
            mp4_hint = ""
            if num:
                n = num.group(1)
                for cand in proj["media_src"].iterdir():
                    if cand.suffix.lower() == ".mp4" and cand.name.startswith(n + "."):
                        mp4_hint = cand.name
                        break
            yt_map[key] = {"id": "", "mp4": mp4_hint, "title": pretty_title(png.stem)}
            items.append(
                {
                    "file": dest_name,
                    "title": pretty_title(png.stem),
                    "key": key,
                    "mp4": mp4_hint,
                }
            )
        catalog.append({**{k: proj[k] for k in ("id", "code", "title", "subtitle", "mission", "accent")}, "images": items})

    (ROOT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "videos.js").write_text(render_videos_js(yt_map), encoding="utf-8")
    (ROOT / "index.html").write_text(render_index(catalog), encoding="utf-8")
    (ROOT / "README.md").write_text(render_readme(), encoding="utf-8")
    n_png = sum(len(p["images"]) for p in catalog)
    print(f"OK : {len(catalog)} labs, {n_png} infographies PNG")


def render_videos_js(yt_map: dict) -> str:
    lines = [
        "/* Collez ici l’identifiant YouTube (la partie après v=) une fois la vidéo importée.",
        "   Exemple : 'id': 'dQw4w9WgXcQ'",
        "   Le champ mp4 rappelle le fichier source local — ne pas l’envoyer sur GitHub. */",
        "window.YOUTUBE_IDS = {",
    ]
    for key, meta in yt_map.items():
        comment = meta["mp4"].replace("\\", "/").replace("'", "\\'") if meta["mp4"] else ""
        title = meta["title"].replace("'", "\\'")
        lines.append(f"  '{key}': {{ id: '', title: '{title}', mp4: '{comment}' }},")
    lines.append("};")
    return "\n".join(lines) + "\n"


def render_index(catalog: list) -> str:
    cards = []
    galleries = []
    for p in catalog:
        n = len(p["images"])
        cards.append(
            f"""
        <article class="lab-card" style="--accent:{p['accent']}">
          <p class="code">{p['code']}</p>
          <h2>{p['title']}</h2>
          <p class="sub">{p['subtitle']}</p>
          <p class="mission">Entraînement : {p['mission']}</p>
          <div class="actions">
            <a class="btn primary" href="labs/{p['id']}/">Ouvrir le laboratoire virtuel</a>
            <a class="btn ghost" href="#g-{p['id']}">Infographies ({n})</a>
          </div>
        </article>"""
        )
        figs = []
        for im in p["images"]:
            figs.append(
                f"""
            <figure class="fig" data-key="{im['key']}">
              <a href="infographies/{p['id']}/{im['file']}" target="_blank" rel="noopener">
                <img src="infographies/{p['id']}/{im['file']}" alt="{im['title']}" loading="lazy" />
              </a>
              <figcaption>
                <strong>{im['title']}</strong>
                <span class="yt" hidden></span>
              </figcaption>
            </figure>"""
            )
        galleries.append(
            f"""
      <section class="gallery" id="g-{p['id']}">
        <h2><span class="code">{p['code']}</span> {p['title']}</h2>
        <p class="hint">Cliquez une image pour l’ouvrir en grand. Les vidéos associées seront ajoutées ici dès qu’elles seront sur YouTube.</p>
        <div class="grid-figs">{''.join(figs)}</div>
      </section>"""
        )

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Laboratoires virtuels — IUT Mantes · GC-CD</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,650;0,9..40,800;1,9..40,400&family=IBM+Plex+Mono:wght@500;650&display=swap" rel="stylesheet" />
<style>
  :root {{
    --bg0:#07131d; --bg1:#0b1c2a; --ink:#e9f4f9; --muted:#9cb3c0; --steel:#a9bcc8;
    --panel:#0f2330; --brd:rgba(127,190,214,.16); --water:#41c7e4; --water-deep:#0b6e8a;
    --gold:#ffd166; --sans:"DM Sans","Segoe UI",sans-serif; --mono:"IBM Plex Mono",Consolas,monospace;
    --radius:16px; --shadow:0 18px 40px rgba(2,10,16,.5);
  }}
  * {{ box-sizing:border-box; }}
  html {{ scroll-behavior:smooth; }}
  body {{
    margin:0; font-family:var(--sans); color:var(--ink);
    background:
      radial-gradient(1100px 620px at 12% -12%, rgba(11,110,138,.28), transparent 55%),
      radial-gradient(900px 500px at 100% 0%, rgba(217,122,69,.10), transparent 50%),
      linear-gradient(180deg, var(--bg0), var(--bg1));
    min-height:100vh;
  }}
  a {{ color:var(--water); }}
  header.hero {{
    max-width:1100px; margin:0 auto; padding:2.2rem 1.25rem 1.2rem;
  }}
  .eyebrow {{ font-family:var(--mono); font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; color:var(--water); margin:0 0 .4rem; }}
  h1 {{ margin:0; font-size:clamp(1.7rem, 3vw, 2.35rem); font-weight:800; letter-spacing:-.02em; }}
  .lede {{ max-width:46rem; color:var(--muted); line-height:1.55; }}
  .note {{
    margin:1.1rem 0 0; padding:.75rem 1rem; border-radius:12px;
    background:rgba(224,138,90,.08); border:1px dashed rgba(224,138,90,.35);
    color:var(--steel); font-size:.9rem; line-height:1.5;
  }}
  .labs {{
    max-width:1100px; margin:0 auto; padding:0 1.25rem 2rem;
    display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem;
  }}
  .lab-card {{
    background:var(--panel); border:1px solid var(--brd); border-radius:var(--radius);
    padding:1.15rem 1.2rem 1.25rem; box-shadow:var(--shadow);
    border-top:3px solid var(--accent, var(--water));
  }}
  .lab-card .code {{ font-family:var(--mono); font-size:.75rem; color:var(--accent, var(--water)); margin:0 0 .35rem; }}
  .lab-card h2 {{ margin:0; font-size:1.12rem; }}
  .lab-card .sub {{ color:var(--muted); font-size:.88rem; line-height:1.4; margin:.35rem 0 .15rem; }}
  .lab-card .mission {{ font-size:.82rem; color:var(--gold); margin:0 0 .85rem; }}
  .actions {{ display:flex; flex-wrap:wrap; gap:.5rem; }}
  .btn {{
    display:inline-flex; align-items:center; justify-content:center;
    text-decoration:none; font-weight:650; font-size:.86rem;
    padding:.48rem .85rem; border-radius:999px;
  }}
  .btn.primary {{ background:var(--water-deep); color:#eaf6fb; border:1px solid transparent; }}
  .btn.ghost {{ border:1px solid var(--brd); color:var(--ink); background:transparent; }}
  .galleries {{ max-width:1100px; margin:0 auto; padding:0 1.25rem 5rem; }}
  .gallery {{ margin-top:2.2rem; }}
  .gallery h2 {{ font-size:1.2rem; display:flex; gap:.6rem; align-items:baseline; flex-wrap:wrap; }}
  .gallery h2 .code {{ font-family:var(--mono); font-size:.8rem; color:var(--water); }}
  .hint {{ color:var(--muted); font-size:.88rem; }}
  .grid-figs {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:.9rem; }}
  .fig {{ margin:0; background:var(--panel); border:1px solid var(--brd); border-radius:14px; overflow:hidden; }}
  .fig img {{ display:block; width:100%; height:160px; object-fit:cover; background:#0a1a27; }}
  .fig figcaption {{ padding:.65rem .8rem .8rem; font-size:.84rem; line-height:1.4; color:var(--steel); }}
  .fig figcaption strong {{ display:block; color:var(--ink); font-size:.9rem; margin-bottom:.25rem; }}
  .yt a {{ font-size:.82rem; }}
  footer.credit {{
    position:sticky; bottom:0; display:grid; grid-template-columns:1fr 1.2fr 1fr;
    background:rgba(8,22,31,.92); color:#d7e8ef; font-size:.8rem;
  }}
  footer.credit div {{ padding:.55rem .9rem; }}
  footer.credit .mid {{ text-align:center; background:linear-gradient(135deg,#0b5871,#0b6e8a); }}
  footer.credit .who {{ font-weight:700; }}
  footer.credit .role {{ color:rgba(215,232,239,.68); font-size:.72rem; }}
  @media (max-width:700px) {{
    footer.credit {{ grid-template-columns:1fr; }}
    .fig img {{ height:200px; }}
  }}
</style>
</head>
<body>
  <header class="hero">
    <p class="eyebrow">IUT Mantes-en-Yvelines · GC-CD</p>
    <h1>Laboratoires virtuels &amp; infographies</h1>
    <p class="lede">Ouvrez un laboratoire dans le navigateur (ordinateur, tablette ou téléphone). Les infographies rappellent les notions ; les vidéos YouTube seront reliées ici dès qu’elles seront en ligne. Rien de tout cela ne remplace le sujet PDF ni les notes de calcul.</p>
    <p class="note">Site public pédagogique : pas de sujets notés, pas de corrigés, pas de chiffres des dossiers. Les QCM des labs sont formatifs (mission fictive).</p>
  </header>
  <section class="labs" aria-label="Laboratoires virtuels">
    {''.join(cards)}
  </section>
  <div class="galleries">
    <h1>Infographies</h1>
    {''.join(galleries)}
  </div>
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
<script src="videos.js"></script>
<script>
(function () {{
  const map = window.YOUTUBE_IDS || {{}};
  document.querySelectorAll(".fig").forEach((fig) => {{
    const key = fig.getAttribute("data-key");
    const rec = map[key];
    const slot = fig.querySelector(".yt");
    if (!slot || !rec) return;
    if (rec.id) {{
      slot.hidden = false;
      slot.innerHTML = '<a href="https://www.youtube.com/watch?v=' + encodeURIComponent(rec.id) + '" target="_blank" rel="noopener">Voir la vidéo (YouTube)</a>';
    }}
  }});
}})();
</script>
</body>
</html>
"""


def render_readme() -> str:
    return """# Laboratoires virtuels — IUT Mantes (GC-CD)

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
"""


if __name__ == "__main__":
    main()
