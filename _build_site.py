# -*- coding: utf-8 -*-
"""Assemble le site GitHub Pages (labs HTML + PNG + visionneuse + progression + charte éditoriale)."""
from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = Path(r"c:\Users\nicodisc-admin\Desktop\Agent\Enseignement\IUT_Mantes")

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
        "store_key": "r11_parcours",
        "v1_key": "r11_lab_virtuel",
        "lab_src": SRC / "R 1-1 Méthode de travail universitaire et outils informatiques" / "App_interactive" / "Lab_virtuel_R1-1.html",
        "media_src": SRC / "R 1-1 Méthode de travail universitaire et outils informatiques" / "Vidéos_infographies",
        "accent": "#3ecf8e",
        "workshops": [
            ("refs", "01 · Références $", 6, "QO5S8-SY8Gk"),
            ("unites", "02 · Unités & formats", 5, "oykX68_NGug"),
            ("logique", "03 · Logique SI", 7, "QO5S8-SY8Gk"),
            ("tva", "04 · HT / TVA / TTC", 7, "RfgMrGv0h7U"),
            ("synthese", "05 · SOMME.SI & TCD", 2, "RfgMrGv0h7U"),
            ("graphiques", "06 · Graphiques", 4, "sI89pUaTGo8"),
            ("qualite", "07 · Qualité & SIERREUR", 8, "oykX68_NGug"),
        ],
        "img_ws": {
            1: ("refs", "01 · Références $"),
            2: ("synthese", "05 · SOMME.SI & TCD"),
            3: ("synthese", "05 · SOMME.SI & TCD"),
            4: ("graphiques", "06 · Graphiques"),
            5: ("unites", "02 · Unités & formats"),
            6: ("refs", "01 · Références $"),
            7: ("logique", "03 · Logique SI"),
            8: ("qualite", "07 · Qualité & SIERREUR"),
        },
    },
    {
        "id": "r1-10",
        "semester": "s1",
        "code": "R 1-10",
        "title": "Réseaux secs et humides",
        "subtitle": "Hydraulique AEP, charges, pertes, pompe",
        "mission": "Valdeau",
        "store_key": "r110_parcours",
        "v1_key": "r110_lab_v4",
        "lab_src": SRC / "R 1-10 Réseaux secs et humides" / "App_interactive" / "Lab_virtuel_R1-10.html",
        "media_src": SRC / "R 1-10 Réseaux secs et humides" / "Vidéos_infographies",
        "accent": "#41c7e4",
        "workshops": [
            ("debit", "01 · Débit & continuité", 1, "IfY00H-DeXE"),
            ("fluide", "02 · Viscosité & Reynolds", 2, "eHxa7GX64C0"),
            ("hydro", "03 · Hydrostatique", 3, "Ea4we82args"),
            ("bernoulli", "04 · Bernoulli & Venturi", 4, "RI4u-O8MEBw"),
            ("lineaire", "05 · Pertes linéaires", 5, "AxpnPHgEtYY"),
            ("singulier", "06 · Pertes singulières", 6, "b_AqoX5MTxo"),
            ("pompe", "07 · Sélection pompe", 7, "p0_S3oV2bTQ"),
            ("reseau", "08 · Réseau du Plateau", 8, "p0_S3oV2bTQ"),
        ],
        "img_ws": {
            1: ("debit", "01 · Débit & continuité"),
            2: ("fluide", "02 · Viscosité & Reynolds"),
            3: ("hydro", "03 · Hydrostatique"),
            4: ("bernoulli", "04 · Bernoulli & Venturi"),
            5: ("lineaire", "05 · Pertes linéaires"),
            6: ("singulier", "06 · Pertes singulières"),
            7: ("pompe", "07 · Sélection pompe"),
            8: ("reseau", "08 · Réseau du Plateau"),
        },
    },
    {
        "id": "r1-13",
        "semester": "s1",
        "code": "R 1-13",
        "title": "Fonctions des composants des bâtiments",
        "subtitle": "Métrologie, incertitudes, conformité",
        "mission": "Pierreclaire",
        "store_key": "r113_parcours",
        "v1_key": "r113_lab_virtuel",
        "lab_src": SRC / "R 1-13 Fonctions des composants des bâtiments" / "App_interactive" / "Lab_virtuel_R1-13.html",
        "media_src": SRC / "R 1-13 Fonctions des composants des bâtiments" / "Vidéos_infographies",
        "accent": "#b38cff",
        "workshops": [
            ("ab", "01 · Type A & Type B", 1, "s7_QM8P2aCE"),
            ("compose", "02 · Composition quadratique", 7, "s7_QM8P2aCE"),
            ("prop", "03 · Propagation", 2, "92IBJeWBkwk"),
            ("conform", "04 · Conformité", 3, "VHfqS-rlQzw"),
            ("lot", "05 · Contrôle de lot", 4, "YPMf3Mss2ig"),
            ("budget", "06 · Budget d'incertitude", 5, "8q9lbUvqEzY"),
        ],
        "img_ws": {
            1: ("ab", "01 · Type A & Type B"),
            2: ("prop", "03 · Propagation"),
            3: ("conform", "04 · Conformité"),
            4: ("lot", "05 · Contrôle de lot"),
            5: ("budget", "06 · Budget d'incertitude"),
            6: ("budget", "06 · Restitution & bilan"),
            7: ("compose", "02 · Composition quadratique"),
        },
    },
    {
        "id": "r2-9",
        "semester": "s2",
        "code": "R 2-9",
        "title": "Transferts thermiques et hydriques",
        "subtitle": "Parois, confort, Glaser, ITI / ITE",
        "mission": "Halle de Valvert",
        "store_key": "r29_parcours",
        "v1_key": "r29_lab_virtuel",
        "lab_src": SRC / "R 2-9 Transferts thermiques et hydriques dans les parois" / "App_interactive" / "Lab_virtuel_R2-9.html",
        "media_src": SRC / "R 2-9 Transferts thermiques et hydriques dans les parois" / "Vidéos_infographies",
        "accent": "#ff8a4c",
        "workshops": [
            ("cond", "01 · Paroi & résistance R", 1, "pKv1AhqyRZQ"),
            ("surf", "02 · Confort & T_si", 2, "eGctIwvyGho"),
            ("bilan", "03 · Ponts thermiques", 3, "wYyCvxTThbc"),
            ("glaser", "04 · Vapeur & Glaser", 4, "I1FCCekPJpg"),
            ("dyn", "05 · Déphasage & inertie", 5, "_1hXRLOt9PM"),
            ("rehab", "06 · ITI vs ITE", 6, "vboYFY8i9tY"),
        ],
        "img_ws": {
            1: ("cond", "01 · Paroi & résistance R"),
            2: ("surf", "02 · Confort & T_si"),
            3: ("bilan", "03 · Ponts thermiques"),
            4: ("glaser", "04 · Vapeur & Glaser"),
            5: ("dyn", "05 · Déphasage & inertie"),
            6: ("rehab", "06 · ITI vs ITE"),
        },
    },
    {
        "id": "r3-10",
        "semester": "s3",
        "code": "R 3-10",
        "title": "Physique et énergétique du bâtiment 1",
        "subtitle": "Transmission, DJU, DPE, rénovation",
        "mission": "Pavillon des Aulnes",
        "store_key": "r310_parcours",
        "v1_key": "r310_lab_virtuel",
        "lab_src": SRC / "R 3-10 Physique et Énergétique du bâtiment 1" / "App_interactive" / "Lab_virtuel_R3-10.html",
        "media_src": SRC / "R 3-10 Physique et Énergétique du bâtiment 1" / "Vidéos_infographies",
        "accent": "#ff5d8f",
        "workshops": [
            ("trans", "01 · Déperditions U·A", 1, "yrmPQ_9LN8E"),
            ("vent", "02 · Ventilation & H_bât", 2, "JTATHtqHXiQ"),
            ("dju", "03 · DJU & besoin annuel", 7, "TPDGJ40naqo"),
            ("dpe", "04 · Double seuil DPE", 3, "TPDGJ40naqo"),
            ("reno", "05 · Scénario rénovation", 4, "_qlOBY1eH6Q"),
            ("sys", "06 · VMC & PAC", 5, "LmwkgN5VbmY"),
            ("tri", "07 · Bilan carbone & TRI", 6, "0ufPGzwFKNw"),
        ],
        "img_ws": {
            1: ("trans", "01 · Déperditions U·A"),
            2: ("vent", "02 · Ventilation & H_bât"),
            3: ("dpe", "04 · Double seuil DPE"),
            4: ("reno", "05 · Scénario rénovation"),
            5: ("sys", "06 · VMC & PAC"),
            6: ("tri", "07 · Bilan carbone & TRI"),
            7: ("dju", "03 · DJU & besoin annuel"),
        },
    },
    {
        "id": "r4-8",
        "semester": "s4",
        "code": "R 4-8",
        "title": "Physique et énergétique du bâtiment 2",
        "subtitle": "Été, inertie, BEPOS, aéraulique, acoustique",
        "mission": "Maison de santé de Lironde",
        "store_key": "r48_parcours",
        "v1_key": "r48_lab_virtuel",
        "lab_src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "App_interactive" / "Lab_virtuel_R4-8.html",
        "media_src": SRC / "R 4-8 Physique et Énergétique du bâtiment 2" / "Vidéos_infographies",
        "accent": "#f0c674",
        "workshops": [
            ("ete", "01 · Apports d'été & Fs", 1, "OzAZHJf-c2A"),
            ("inertie", "02 · Inertie estivale", 2, "cpyKxevCrsQ"),
            ("bepos", "03 · Solaire & BEPOS", 3, "WCc3p50XQGc"),
            ("aera", "04 · Réseau aéraulique", 4, "0pcszIEADaI"),
            ("acou", "05 · Acoustique & T_r", 5, "st5KHJ6GAYw"),
        ],
        "img_ws": {
            1: ("ete", "01 · Apports d'été & Fs"),
            2: ("inertie", "02 · Inertie estivale"),
            3: ("bepos", "03 · Solaire & BEPOS"),
            4: ("aera", "04 · Réseau aéraulique"),
            5: ("acou", "05 · Acoustique & T_r"),
        },
    },
]

PLAYLISTS = {
    "r1-1": "PLdvfbV6gHmIs",
    "r1-10": "PLOtp-9v_CG9E",
    "r1-13": "PLOUGV3afMlSA",
    "r2-9": "PLJQ4kWqmCdVI",
    "r3-10": "PLU-mhVpV4vZ0",
    "r4-8": "PLI2gBdKJjUhA",
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
    "r1-13/6-l-art-de-la-restitution.png": "MmKYLUyEqyw",
    "r2-9/1-anatomie-d-une-paroi-isolee.png": "pKv1AhqyRZQ",
    "r2-9/2-la-physique-du-confort-thermique.png": "eGctIwvyGho",
    "r2-9/3-comprendre-les-ponts-thermiques.png": "wYyCvxTThbc",
    "r2-9/4-comprendre-la-methode-glaser.png": "I1FCCekPJpg",
    "r2-9/5-maitriser-dephasage-et-inertie-thermique.png": "_1hXRLOt9PM",
    "r2-9/6-strategies-de-rehabilitation-thermique.png": "vboYFY8i9tY",
    "r3-10/1-guide-d-analyse-des-deperditions-thermiques.png": "yrmPQ_9LN8E",
    "r3-10/2-comprendre-l-indicateur-thermique-hbat.png": "JTATHtqHXiQ",
    "r3-10/3-comprendre-le-processus-du-dpe.png": "TPDGJ40naqo",
    "r3-10/4-renover-l-enveloppe-strategie-coherente.png": "_qlOBY1eH6Q",
    "r3-10/5-dimensionnement-vmc-et-pac.png": "LmwkgN5VbmY",
    "r3-10/6-reussir-son-bilan-energetique.png": "0ufPGzwFKNw",
    "r4-8/1-bilan-thermique-d-ete-passif.png": "OzAZHJf-c2A",
    "r4-8/2-maitriser-le-confort-thermique-estival.png": "cpyKxevCrsQ",
    "r4-8/3-philosophie-bepos-et-systemes-actifs.png": "WCc3p50XQGc",
    "r4-8/4-l-aeraulique-poumon-du-batiment.png": "0pcszIEADaI",
    "r4-8/5-identifier-le-bon-levier-acoustique.png": "st5KHJ6GAYw",
}

LAB_VIGNETTES = {
    "r1-1": """<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect x="14" y="14" width="142" height="122" rx="12" fill="rgba(62,207,142,0.09)" stroke="currentColor" stroke-opacity="0.35"/>
      <rect x="24" y="24" width="122" height="22" rx="6" fill="currentColor" fill-opacity="0.24"/>
      <text x="32" y="39" font-size="11" font-family="monospace" fill="currentColor" font-weight="700">fx = A2*$B$1</text>
      <g fill="currentColor" fill-opacity="0.16"><rect x="24" y="54" width="36" height="18" rx="4"/><rect x="65" y="54" width="36" height="18" rx="4"/><rect x="106" y="54" width="40" height="18" rx="4"/>
      <rect x="24" y="77" width="36" height="18" rx="4"/><rect x="65" y="77" width="36" height="18" rx="4"/><rect x="106" y="77" width="40" height="18" rx="4" fill-opacity="0.34"/>
      <rect x="24" y="100" width="36" height="18" rx="4"/><rect x="65" y="100" width="36" height="18" rx="4"/><rect x="106" y="100" width="40" height="18" rx="4"/></g>
      <rect x="174" y="68" width="16" height="62" rx="4" fill="currentColor" fill-opacity="0.35"/>
      <rect x="198" y="42" width="16" height="88" rx="4" fill="currentColor" fill-opacity="0.62"/>
      <rect x="222" y="24" width="16" height="106" rx="4" fill="currentColor"/>
    </svg>""",
    "r1-10": """<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect x="20" y="22" width="44" height="54" rx="7" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.8"/>
      <line x1="30" y1="76" x2="24" y2="128" stroke="currentColor" stroke-opacity="0.5" stroke-width="2.5"/>
      <line x1="54" y1="76" x2="60" y2="128" stroke="currentColor" stroke-opacity="0.5" stroke-width="2.5"/>
      <path d="M42 76 L42 114 L132 114 L198 88 L238 88" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <path d="M42 36 L132 58 L132 28 L238 56" fill="none" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="5 4"/>
      <circle cx="132" cy="114" r="12" fill="#0b1526" stroke="currentColor" stroke-width="2.5"/>
      <text x="132" y="118" text-anchor="middle" font-size="11" font-family="monospace" fill="currentColor" font-weight="700">P</text>
      <rect x="208" y="58" width="28" height="28" rx="4" fill="currentColor" fill-opacity="0.2" stroke="currentColor"/>
    </svg>""",
    "r1-13": """<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect x="22" y="20" width="76" height="14" rx="4" fill="currentColor" fill-opacity="0.4"/>
      <rect x="22" y="118" width="76" height="14" rx="4" fill="currentColor" fill-opacity="0.4"/>
      <line x1="32" y1="34" x2="32" y2="118" stroke="currentColor" stroke-opacity="0.45" stroke-width="3"/>
      <line x1="88" y1="34" x2="88" y2="118" stroke="currentColor" stroke-opacity="0.45" stroke-width="3"/>
      <rect x="44" y="58" width="32" height="58" rx="5" fill="currentColor" fill-opacity="0.24" stroke="currentColor" stroke-width="2"/>
      <path d="M116 122 C138 122 148 36 178 36 C208 36 218 122 242 122" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="2.6"/>
      <line x1="178" y1="28" x2="178" y2="126" stroke="#ffd166" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="178" y="22" text-anchor="middle" font-size="10" font-family="monospace" fill="#ffd166">± U</text>
    </svg>""",
    "r2-9": """<svg viewBox="0 0 260 150" aria-hidden="true">
      <rect x="58" y="18" width="22" height="114" rx="4" fill="#f8fafc" fill-opacity="0.25"/>
      <rect x="82" y="18" width="46" height="114" rx="4" fill="#fbbf24" fill-opacity="0.34" stroke="#fbbf24" stroke-opacity="0.7"/>
      <rect x="130" y="18" width="48" height="114" rx="4" fill="#94a3b8" fill-opacity="0.3"/>
      <path d="M26 42 L188 42 L208 92 L236 106" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
      <text x="26" y="33" font-size="11" font-family="monospace" fill="#ff8a4c">20°C</text>
      <text x="206" y="124" font-size="11" font-family="monospace" fill="#7fe3ff">0°C</text>
    </svg>""",
    "r3-10": """<svg viewBox="0 0 260 150" aria-hidden="true">
      <g font-family="monospace" font-size="10" font-weight="700" fill="#08101c">
        <rect x="20" y="18" width="66" height="15" rx="4" fill="#00a06d"/><text x="28" y="29">A</text>
        <rect x="20" y="36" width="84" height="15" rx="4" fill="#52b153"/><text x="28" y="47">B</text>
        <rect x="20" y="54" width="102" height="15" rx="4" fill="#a5cc74"/><text x="28" y="65">C</text>
        <rect x="20" y="72" width="120" height="15" rx="4" fill="#f4e70f"/><text x="28" y="83">D</text>
        <rect x="20" y="90" width="138" height="15" rx="4" fill="#f0b40f"/><text x="28" y="101">E</text>
        <rect x="20" y="108" width="156" height="15" rx="4" fill="#eb8235"/><text x="28" y="119">F</text>
      </g>
      <rect x="192" y="52" width="50" height="68" rx="9" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2"/>
      <circle cx="217" cy="86" r="16" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M217 72 L217 100 M203 86 L231 86" stroke="currentColor" stroke-width="2"/>
    </svg>""",
    "r4-8": """<svg viewBox="0 0 260 150" aria-hidden="true">
      <circle cx="48" cy="40" r="18" fill="#ffd166" fill-opacity="0.85"/>
      <line x1="68" y1="50" x2="118" y2="76" stroke="#ffd166" stroke-width="2.2" stroke-dasharray="4 4"/>
      <line x1="118" y1="42" x2="138" y2="50" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="118" y1="60" x2="138" y2="68" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="118" y1="78" x2="138" y2="86" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="142" y="34" width="8" height="88" rx="3" fill="#7fe3ff" fill-opacity="0.55"/>
      <path d="M174 88 A18 18 0 0 1 174 62" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M188 98 A30 30 0 0 1 188 52" fill="none" stroke="currentColor" stroke-opacity="0.7" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M202 108 A42 42 0 0 1 202 42" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="2.4" stroke-linecap="round"/>
    </svg>""",
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
    t = re.sub(r"^\d+\.", "", stem).replace("_", " ").replace("___", " - ").replace("  ", " ")
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


def patch_lab_html(html: str, semester_id: str, lab_media_json: str) -> str:
    sem = SEM_BY_ID[semester_id]
    if "window.LABV4_MEDIA = " not in html:
        html = html.replace(
            "<head>",
            f"<head>\n<script>window.LABV4_MEDIA = {lab_media_json};</script>",
            1,
        )
    if "iut_mantes_theme" not in html:
        html = html.replace(
            '<html lang="fr" data-theme="dark">',
            '<html lang="fr" data-theme="dark">\n'
            "<script>(function(){try{var t=localStorage.getItem('iut_mantes_theme');"
            "if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;"
            "else if(matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='light';}catch(e){}})();</script>",
            1,
        )
        html = html.replace(
            "    store.theme = t;\n    save();",
            '    store.theme = t;\n    try { localStorage.setItem("iut_mantes_theme", t); } catch (_) {}\n    save();',
            1,
        )
        html = html.replace(
            '    applyTheme(store.theme === "light" ? "light" : "dark");',
            '    let siteTheme = "";\n'
            '    try { siteTheme = localStorage.getItem("iut_mantes_theme") || ""; } catch (_) {}\n'
            '    applyTheme(siteTheme === "light" || siteTheme === "dark" ? siteTheme : (store.theme === "light" || store.theme === "dark" ? store.theme : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")));',
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
            '    </div>\n    <p class="brand-sub">',
            "    </div>\n"
            f'    <a class="site-back" href="../../{sem["id"]}/index.html">← {sem["code"]} · {sem["title"]}</a>\n'
            '    <p class="brand-sub">',
            1,
        )
    return html


def write_i18n() -> None:
    """Sélecteur FR | EN du site : moteur commun des labs + dictionnaire du site (assets/i18n.js)."""
    lp = ROOT / "_lab_parcours"
    dico = {}
    for f in (lp / "moteur" / "en.json", lp / "site" / "en.json"):
        if f.exists():
            dico.update(json.loads(f.read_text(encoding="utf-8")))
    for ex in (lp / "moteur" / "en-extra.tsv", lp / "site" / "en-extra.tsv"):
        if ex.exists():
            for line in ex.read_text(encoding="utf-8").splitlines():
                if chr(9) in line and not line.startswith("#"):
                    k, v = line.split(chr(9), 1)
                    dico[k] = v
    js = "window.LABI18N_EN = " + json.dumps(dico, ensure_ascii=False) + ";" + chr(10) + (lp / "moteur" / "i18n.js").read_text(encoding="utf-8")
    (ROOT / "assets" / "i18n.js").write_text(js, encoding="utf-8")


def main() -> None:
    write_i18n()
    labs_dir = ROOT / "labs"
    img_root = ROOT / "infographies"
    labs_dir.mkdir(exist_ok=True)
    img_root.mkdir(exist_ok=True)

    # Ancienne affiche PNG de la charte retirée du flux éditorial (charte.html intégralement réécrite)
    stale_consignes = img_root / "consignes-etudiants.png"
    if stale_consignes.exists():
        stale_consignes.unlink()

    catalog = []
    yt_map = {}
    for proj in PROJECTS:
        img_dst = img_root / proj["id"]
        img_dst.mkdir(exist_ok=True)
        items = []
        by_num = {}
        for png in collect_pngs(proj["media_src"]):
            dest_name = slugify(png.name) + ".png"
            dest = img_dst / dest_name
            if not dest.exists() or png.stat().st_mtime > dest.stat().st_mtime:
                shutil.copy2(png, dest)
            key = f"{proj['id']}/{dest_name}"
            num_m = re.match(r"^(\d+)", png.name)
            idx_num = int(num_m.group(1)) if num_m else 99
            mp4_hint = ""
            if num_m:
                n = num_m.group(1)
                for cand in proj["media_src"].iterdir():
                    if cand.suffix.lower() == ".mp4" and cand.name.startswith(n + "."):
                        mp4_hint = cand.name
                        break
            ws_id, ws_label = proj["img_ws"].get(idx_num, (proj["workshops"][0][0], proj["workshops"][0][1]))
            vid = VIDEO_IDS.get(key, "")
            yt_map[key] = {
                "id": vid,
                "mp4": mp4_hint,
                "title": pretty_title(png.stem),
                "atelier": ws_id,
                "atelierLabel": ws_label,
            }
            item = {
                "num": idx_num,
                "file": dest_name,
                "title": pretty_title(png.stem),
                "key": key,
                "mp4": mp4_hint,
                "video": vid,
                "atelier": ws_id,
                "atelierLabel": ws_label,
            }
            items.append(item)
            by_num[idx_num] = item

        mp4_by_vid = {it["video"]: it["mp4"] for it in items if it["video"] and it["mp4"]}

        def rel_mp4(prefix: str, mp4_name: str) -> str:
            if not mp4_name:
                return ""
            from urllib.parse import quote
            rel_parts = proj["media_src"].relative_to(SRC.parent).parts + (mp4_name,)
            return prefix + "/".join(quote(part) for part in rel_parts)

        for it in items:
            resolved_mp4 = it["mp4"] or mp4_by_vid.get(it["video"], "")
            yt_map[it["key"]]["mp4Url"] = rel_mp4("../../", resolved_mp4)

        # Table média injectée dans chaque lab pour le maillage croisé par atelier (P1)
        ws_media = {}
        for ws_id, ws_lbl, pref_num, yt_fb in proj["workshops"]:
            im = by_num.get(pref_num) or (items[0] if items else None)
            extra = [x for x in items if x["atelier"] == ws_id and (not im or x["file"] != im["file"])]
            ws_vid = im["video"] if im and im["video"] else yt_fb
            ws_mp4 = (im["mp4"] if im and im["mp4"] else "") or mp4_by_vid.get(ws_vid, "")
            ws_media[ws_id] = {
                "lab": proj["id"],
                "playlist": PLAYLISTS.get(proj["id"], ""),
                "label": ws_lbl,
                "img": f"../../infographies/{proj['id']}/{im['file']}" if im else "",
                "title": im["title"] if im else ws_lbl,
                "video": ws_vid,
                "mp4": rel_mp4("../../../", ws_mp4),
                "extra": [
                    {
                        "img": f"../../infographies/{proj['id']}/{x['file']}",
                        "title": x["title"],
                        "video": x["video"] or yt_fb,
                        "mp4": rel_mp4("../../../", x["mp4"] or mp4_by_vid.get(x["video"] or yt_fb, "")),
                    }
                    for x in extra
                ],
            }
        lab_media_json = json.dumps(ws_media, ensure_ascii=False).replace("</", "<\\/")

        lab_dst_dir = labs_dir / proj["id"]
        lab_dst_dir.mkdir(exist_ok=True)
        if not proj["lab_src"].is_file():
            raise SystemExit(f"Lab manquant : {proj['lab_src']}")
        html = proj["lab_src"].read_text(encoding="utf-8")
        (lab_dst_dir / "index.html").write_text(patch_lab_html(html, proj["semester"], lab_media_json), encoding="utf-8")

        keys = ("id", "semester", "code", "title", "subtitle", "mission", "accent", "store_key", "v1_key")
        ws_list = [{"id": w[0], "label": w[1]} for w in proj["workshops"]]
        catalog.append({**{k: proj[k] for k in keys}, "workshops": ws_list, "images": items})

    (ROOT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "videos.js").write_text(render_videos_js(yt_map, catalog), encoding="utf-8")
    shutil.copyfile(ROOT / "_lab_parcours" / "moteur" / "camille.js", ROOT / "assets" / "camille.js")
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


def render_videos_js(yt_map: dict, catalog: list) -> str:
    lines = [
        "/* Identifiants YouTube (après v=), playlists et catalogue de progression des labs. */",
        "window.YOUTUBE_PLAYLISTS = {",
    ]
    for pid, pl in PLAYLISTS.items():
        lines.append(f"  '{pid}': '{pl}',")
    lines.append("};")
    lines.append("window.YOUTUBE_IDS = {")
    for key, meta in yt_map.items():
        comment = meta["mp4"].replace("\\", "/").replace("'", "\\'") if meta["mp4"] else ""
        mp4_url = (meta.get("mp4Url") or "").replace("'", "\\'")
        title = meta["title"].replace("'", "\\'")
        vid = (meta.get("id") or "").replace("'", "\\'")
        at_id = (meta.get("atelier") or "").replace("'", "\\'")
        at_lbl = (meta.get("atelierLabel") or "").replace("'", "\\'")
        lines.append(f"  '{key}': {{ id: '{vid}', title: '{title}', mp4: '{comment}', mp4Url: '{mp4_url}', atelier: '{at_id}', atelierLabel: '{at_lbl}' }},")
    lines.append("};")
    prog_meta = [
        {
            "id": p["id"],
            "code": p["code"],
            "title": p["title"],
            "semester": p["semester"],
            "accent": p["accent"],
            "storeKey": p["store_key"],
            "v1Key": p["v1_key"],
            "workshops": p["workshops"],
        }
        for p in catalog
    ]
    lines.append("window.IUT_LABS_META = " + json.dumps(prog_meta, ensure_ascii=False) + ";")
    return "\n".join(lines) + "\n"


def chrome(base: str, crumb: str, title: str, is_charte: bool = False) -> tuple[str, str]:
    home = f"{base}index.html" if base else "index.html"
    charte_href = f"{base}charte.html" if base else "charte.html"
    charte_cur = ' aria-current="page"' if is_charte else ""
    head = f"""<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta name="color-scheme" content="dark light" />
<meta name="theme-color" content="#07131d" />
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" />
<link rel="stylesheet" href="{base}assets/site.css" />
<script>(function(){{try{{var t=localStorage.getItem("iut_mantes_theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else if(matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.dataset.theme="light";}}catch(e){{}}}})();</script>
<script src="{base}assets/i18n.js"></script>
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="topbar">
  <div>
    <a class="home" href="{home}">IUT Mantes · GC-CD</a>
    {crumb}
  </div>
  <div class="top-tools">
  <a class="top-charter" href="{charte_href}" title="Charte du projet (mode BET)"{charte_cur}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg><span>Charte du projet</span></a>
  <span data-i18n-mount></span>
  <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Activer le mode clair">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>
    <span data-theme-label>Mode clair</span>
  </button>
  </div>
</header>
"""
    foot = f"""
<footer class="credit" aria-label="Crédit">
  <div>
    <div class="who">Nicolas di Scala</div>
    <div class="role">Maître de conférences en Physique (28<sup>e</sup> section)</div>
  </div>
  <div class="mid">
    <div class="who">BUT Génie Civil - Construction Durable</div>
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
        a_cnt, m_tot = _lab_meta(p["id"])
        dur_txt = f" · ≈ {_hm(m_tot)}" if m_tot else ""
        pl = PLAYLISTS.get(p["id"], "")
        yt_btn = ""
        if pl:
            yt_btn = (
                f'<a class="btn ghost" href="https://www.youtube.com/playlist?list={pl}" '
                f'target="_blank" rel="noopener">Playlist YouTube ↗</a>'
            )
        ws_chips = "".join(
            f'<a class="ws-chip" data-ws-chip="{p["id"]}:{w["id"]}" href="{base}labs/{p["id"]}/index.html#atelier={w["id"]}">'
            f'<i></i><span>{w["label"]}</span></a>'
            for w in p["workshops"]
        )
        vignette = LAB_VIGNETTES.get(p["id"], "")
        cards.append(
            f"""
        <article class="lab-card" data-lab="{p['id']}" style="--accent:{p['accent']}">
          <div class="lab-card-grid">
            <div class="lab-card-main">
              <div class="lab-card-top">
                <p class="code">{p['code']} · {a_cnt} ateliers guidés{dur_txt}</p>
                <span class="lab-prog-pill" data-lab-prog="{p['id']}" hidden></span>
              </div>
              <h2>{p['title']}</h2>
              <p class="sub">{p['subtitle']}</p>
              <p class="mission">Mission d’entraînement : {p['mission']}</p>
              <div class="ws-chips" aria-label="Accès direct aux ateliers">{ws_chips}</div>
              <div class="actions">
                <a class="btn primary" data-lab-cta="{p['id']}" href="{base}labs/{p['id']}/index.html">Ouvrir le laboratoire virtuel</a>
                <button type="button" class="btn ghost" data-toggle-gallery="{p['id']}" aria-expanded="false" aria-controls="g-{p['id']}">Infographies et vidéos ({n})</button>
                {yt_btn}
              </div>
            </div>
            <a class="lab-illus" href="{base}labs/{p['id']}/index.html" aria-label="Ouvrir {p['code']} - {p['title']}">
              {vignette}
              <span class="lab-illus-cap">Manipuler en 3D →</span>
            </a>
          </div>
          {one_gallery(p, base)}
        </article>"""
        )
    return "".join(cards)


def one_gallery(p: dict, base: str) -> str:
    figs = []
    for idx, im in enumerate(p["images"]):
        ws_url = f"{base}labs/{p['id']}/index.html#atelier={im['atelier']}"
        img_url = f"{base}infographies/{p['id']}/{im['file']}"
        figs.append(
            f"""
            <figure class="fig" data-key="{im['key']}" data-lab="{p['id']}" data-idx="{idx}" data-img="{img_url}" data-title="{im['title']}" data-ws="{ws_url}" data-ws-label="{im['atelierLabel']}">
              <button type="button" class="fig-open" data-open-lightbox="{im['key']}" aria-label="Ouvrir la fiche {im['title']} dans la visionneuse">
                <img src="{img_url}" alt="{im['title']}" loading="lazy" />
                <span class="fig-badges"><span class="fig-pill">Infographie HD</span><span class="fig-pill vid" data-vid-pill hidden>▶ Vidéo</span></span>
              </button>
              <figcaption>
                <strong>{im['title']}</strong>
                <div class="fig-links">
                  <button type="button" class="fig-act" data-open-lightbox="{im['key']}">Agrandir</button>
                  <span class="yt" hidden></span>
                  <a class="fig-ws" href="{ws_url}">Atelier {im['atelierLabel']} →</a>
                </div>
              </figcaption>
            </figure>"""
        )
    return f"""
          <section class="gallery" id="g-{p['id']}" hidden>
            <p class="hint">Cliquez une fiche pour l’ouvrir dans la visionneuse interactive (zoom, navigation ←/→, vidéo intégrée et lien direct vers l’atelier 3D).</p>
            <div class="grid-figs">{''.join(figs)}</div>
          </section>"""


def _lab_meta(pid: str) -> tuple[int, int]:
    """Nombre d'ateliers guidés et durée totale estimée (minutes), lus dans complements.js du lab."""
    f = ROOT / "_lab_parcours" / pid / "complements.js"
    if not f.exists():
        return 0, 0
    t = f.read_text(encoding="utf-8")
    d = [int(x) for x in re.findall(r"\bduree:\s*(\d+)", t)]
    return len(d), sum(d)


def _hm(m: int) -> str:
    h, r = divmod(m, 60)
    return f"{h} h {r:02d}" if h and r else f"{h} h" if h else f"{r} min"


STEPS = [
    ("Prédire", "Avant de toucher : on parie sur ce qui va se passer, et on dit pourquoi."),
    ("Observer", "La scène 3D réagit, sans les chiffres : on compare au pari."),
    ("Mesurer", "Chiffres, formules et explication. Camille relance si besoin."),
    ("Aller plus loin", "Un réglage à trouver, le piège classique du thème."),
    ("Diagnostiquer", "Un cas pathologique : trouver la commande fautive et la corriger."),
]


def render_home(catalog: list) -> str:
    by_sem = {s["id"]: [p for p in catalog if p["semester"] == s["id"]] for s in SEMESTERS}
    n_at = n_min = 0
    for p in catalog:
        a, m = _lab_meta(p["id"])
        n_at += a
        n_min += m
    n_img = sum(len(p["images"]) for p in catalog)
    cards = []
    for s in SEMESTERS:
        labs = []
        for p in by_sem[s["id"]]:
            a, m = _lab_meta(p["id"])
            info = f"{a} ateliers · ≈ {_hm(m)}" if a else ""
            labs.append(
                f'<a class="sem-lab" data-lab-row="{p["id"]}" href="labs/{p["id"]}/index.html" style="--lab:{p["accent"]}"><i></i>'
                f'<span><b>{p["code"]} · {p["title"]}</b><small>{p["subtitle"]}</small></span><em data-default="{info}">{info}</em></a>'
            )
        cards.append(
            f"""
      <article class="sem-card" data-code="{s['code']}" style="--accent:{s['accent']}">
        <p class="code">{s['code']} · {s['year']}</p>
        <h2>{s['title']}</h2>
        <p class="sub">{s['subtitle']}</p>
        <div class="sem-labs">{''.join(labs)}</div>
        <a class="go" href="{s['id']}/index.html">Infographies et vidéos du semestre →</a>
      </article>"""
        )
    steps = "".join(f'<div class="step"><b>{t}</b><span>{d}</span></div>' for t, d in STEPS)
    head, foot = chrome("", "", "Laboratoires virtuels - IUT Mantes · GC-CD")
    head = head.replace(
        '<link rel="stylesheet" href="assets/site.css" />',
        '<link rel="stylesheet" href="assets/site.css" />\n<link rel="stylesheet" href="assets/home.css" />',
    )
    head = head.replace("<body>", '<body class="home-page">', 1)
    head = head.replace(
        "</head>",
        '<script type="importmap">{"imports": {"three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>\n</head>',
        1,
    )
    labs_json = json.dumps({p["id"]: _lab_meta(p["id"])[0] for p in catalog})
    return f"""{head}
<main class="wrap" id="contenu">
  <section class="hero hero-xl">
    <div class="scene" data-hero3d data-labs='{labs_json}'><img class="bat apercu3d" src="assets/hero3d-apercu.jpg" alt="Le quartier des labs en 3D : château d’eau, maison en coupe, pompe à chaleur, presse d’essai, bureau de chantier et réseaux enterrés" width="1425" height="780" /></div>
    <div class="hero-copy">
      <p class="eyebrow">IUT Mantes-en-Yvelines · B.U.T. Génie civil - Construction durable</p>
      <h1>Laboratoires virtuels <em>de physique du bâtiment</em></h1>
      <p class="lede">Des ateliers en 3D pour manipuler la physique avant de la calculer : on prédit, on observe, on mesure, puis on diagnostique un cas réel.</p>
      <div class="hero-cta">
        <a class="btn primary" href="#semestres">Choisir mon semestre ↓</a>
        <a class="btn charter" href="charte.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg><span>Lire la charte du projet</span></a>
      </div>
      <div class="stats">
        <div class="stat"><b>{len(catalog)}</b><span>laboratoires</span></div>
        <div class="stat"><b>{n_at}</b><span>ateliers guidés</span></div>
        <div class="stat"><b>{n_img}</b><span>infographies</span></div>
      </div>
    </div>
  </section>
  <div class="camille"><img data-camille alt="Camille, la tutrice des labs" width="64" height="64" />
    <p><b>Bonjour, je suis Camille</b>, conductrice de travaux. Ce quartier réunit les six laboratoires : faites-le tourner, changez l’heure, cliquez un bâtiment pour le découvrir. Dans les ateliers, je pose les questions, je donne des indices et je fais le point avec vous.</p></div>

  <section class="my-progress" data-my-progress aria-label="Ma progression personnelle" hidden></section>

  <div class="sec-head"><span class="num">01</span><h2>Un atelier en <em>cinq étapes</em></h2></div>
  <p class="sec-lede">Toujours le même rythme : les trois premières étapes font l’essentiel, les deux dernières approfondissent. Le carnet de l’atelier (questions flash, à retenir, fiche infographique et vidéo) s’ouvre au fil du parcours, et un bilan fait le point à la fin du lab.</p>
  <div class="steps">{steps}</div>

  <div class="sec-head" id="semestres"><span class="num">02</span><h2>Les laboratoires, <em>par semestre</em></h2></div>
  <p class="sec-lede">Ouvrez directement un laboratoire, ou entrez dans le semestre pour retrouver aussi ses infographies et ses vidéos.</p>
  <section class="semesters" aria-label="Semestres">{''.join(cards)}</section>

  <p class="note">Site public pédagogique : pas de sujets notés, pas de corrigés, pas de chiffres des dossiers. Les questions des labs sont formatives (missions fictives), et votre progression reste enregistrée localement sur votre propre navigateur.</p>

</main>
{foot}
<script src="videos.js"></script>
<script src="assets/hub.js"></script>
<script src="assets/camille.js"></script>
<script type="module">
{(ROOT / "assets" / "hero3d.js").read_text(encoding="utf-8")}
</script>
<script type="module">
  // Camille : même visage 3D que dans les labs (rendu une fois, gardé pour la session)
  const img = document.querySelector("img[data-camille]");
  let url = null;
  try {{ url = sessionStorage.getItem("labv4_avatar_v2"); }} catch (_) {{}}
  if (!url) {{
    try {{
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js");
      url = window.LABV4_CAMILLE ? window.LABV4_CAMILLE(THREE, 256) : null;
      if (url) try {{ sessionStorage.setItem("labv4_avatar_v2", url); }} catch (_) {{}}
    }} catch (_) {{}}
  }}
  if (url && img) img.src = url; else if (img) img.replaceWith(Object.assign(document.createElement("span"), {{ className: "ph" }}));
</script>
</body>
</html>
"""


def render_semester(sem: dict, items: list) -> str:
    crumb = f'<span class="crumb"> · {sem["code"]} {sem["title"]}</span>'
    head, foot = chrome(
        "../",
        crumb,
        f"{sem['code']} {sem['title']} - Laboratoires virtuels · IUT Mantes",
    )
    return f"""{head}
<main class="wrap" id="contenu">
  <p class="eyebrow">{sem["year"]} · BUT GC-CD</p>
  <h1>{sem["code"]} - <em>{sem["title"]}</em></h1>
  <p class="lede">{sem["subtitle"]}. Ouvrez directement un atelier en 3D, reprenez votre progression ou parcourez les infographies et vidéos dans la visionneuse intégrée.</p>
  <p class="sem-top-actions"><a class="btn ghost" href="../index.html">← Accueil du quartier 3D</a><a class="btn ghost" href="../charte.html">Charte du projet (mode BET)</a></p>
  <section class="labs stack" aria-label="Ressources du semestre">{lab_cards(items, "../")}</section>
</main>
{foot}
<script src="../videos.js"></script>
<script src="../assets/hub.js"></script>
</body>
</html>
"""


def render_charte() -> str:
    head, foot = chrome("", '<span class="crumb"> · Charte du projet</span>', "Charte du projet - IUT Mantes · GC-CD", is_charte=True)
    mod_rows = "".join(
        f"""<tr>
          <td><span class="ch-code" style="--c:{p['accent']}">{p['code']}</span></td>
          <td><b>{p['title']}</b><small>{p['subtitle']}</small></td>
          <td><a href="{p['semester']}/index.html">{p['semester'].upper()}</a></td>
          <td><a class="btn ghost ch-go" href="labs/{p['id']}/index.html">Entraînement : {p['mission']} →</a></td>
        </tr>"""
        for p in PROJECTS
    )
    return f"""{head}
<main class="wrap charte-page" id="contenu">
  <section class="ch-hero">
    <p class="eyebrow">Tous semestres · B.U.T. Génie civil - Construction durable</p>
    <h1>Charte du projet <em>en mode bureau d’études</em></h1>
    <p class="lede">Pendant vos séances de projet à l’IUT, vous ne faites pas une suite d’exercices scolaires isolés : vous travaillez en équipe de techniciens-conseils sur un dossier complet, du premier métré jusqu’à la soutenance devant le maître d’ouvrage.</p>
    <div class="ch-pills">
      <span>Équipes de ≈ 5 techniciens-conseils</span>
      <span>Étapes chaînées N → N+1</span>
      <span>3 piliers d’évaluation</span>
      <span>Interlocuteur mystère &amp; droit de rachat</span>
    </div>
    <p class="ch-back"><a class="btn ghost" href="index.html">← Retour à l’accueil des laboratoires</a></p>
  </section>

  <section class="ch-sec">
    <div class="ch-sec-hd"><span class="ch-num">01</span><h2>Vos rôles en <em>bureau d’études (BET)</em></h2></div>
    <div class="ch-grid-2">
      <article class="ch-card">
        <p class="ch-kicker">Votre équipe</p>
        <h3>Techniciens-conseils solidaires</h3>
        <p>Vous êtes regroupés en équipes d’environ <b>5 étudiants</b>. Vous organisez la répartition des calculs, la vérification croisée des formules, la tenue du classeur commun et la clarté des livrables remis à chaque jalon.</p>
      </article>
      <article class="ch-card ch-accent">
        <p class="ch-kicker">Votre enseignant</p>
        <h3>Directeur Technique, puis Client final</h3>
        <p>Pendant toutes les séances de travail, l’enseignant agit comme votre <b>Directeur Technique</b> : il guide, débloque les points durs et valide vos étapes. Le jour de la soutenance finale, il endosse le rôle du <b>Client / Maître d’Ouvrage</b> devant qui vous défendez vos choix.</p>
      </article>
    </div>
  </section>

  <section class="ch-sec">
    <div class="ch-sec-hd"><span class="ch-num">02</span><h2>La chaîne du projet &amp; <em>le rituel d’une séance</em></h2></div>
    <p class="ch-intro">Dans un vrai dossier d’ingénierie, <b>les résultats de l’étape N nourrissent directement l’étape N+1</b> (un métré ou une déperdition erronés faussent le dimensionnement et le chiffrage qui suivent). Un chronogramme précis, indiquant le budget de séances par étape, vous est remis dès la séance 1.</p>
    <div class="ch-timeline">
      <article class="ch-step">
        <span class="ch-step-n">1</span>
        <div>
          <h3>Top départ · Brief d’équipe <em>(≈ 3 min / groupe)</em></h3>
          <p>Point rapide en début de séance avec le Directeur Technique autour de trois questions : <b>Où en êtes-vous ? Qu’est-ce qui vous bloque ? Quel est votre objectif précis d’ici la fin de la séance ?</b></p>
        </div>
      </article>
      <article class="ch-step">
        <span class="ch-step-n">2</span>
        <div>
          <h3>Production en autonomie supervisée</h3>
          <p>Calculs physiques, schémas de principe, structuration du classeur de calcul, contrôles d’ordres de grandeur et rédaction progressive des notes justificatives.</p>
        </div>
      </article>
      <article class="ch-step">
        <span class="ch-step-n">3</span>
        <div>
          <h3>Revue de projet &amp; validation <em>(≈ 5 min / groupe en fin d’étape)</em></h3>
          <p>Vérification du livrable de l’étape, contrôle de la maîtrise collective et saisie de l’avancement sur la fiche de suivi de chantier avant de débloquer l’étape suivante.</p>
        </div>
      </article>
    </div>
  </section>

  <section class="ch-sec">
    <div class="ch-sec-hd"><span class="ch-num">03</span><h2>Les trois piliers <em>de l’évaluation</em></h2></div>
    <div class="ch-grid-3">
      <article class="ch-card">
        <span class="ch-badge">Pilier 1</span>
        <h3>Rapport &amp; livrable écrit</h3>
        <p>Notes de calcul structurées, hypothèses explicites, unités systématiques, schémas lisibles, classeurs propres et conclusions argumentées pour le maître d’ouvrage.</p>
      </article>
      <article class="ch-card">
        <span class="ch-badge">Pilier 2</span>
        <h3>Soutenance orale finale</h3>
        <p>Créneau maximal d’<b>1 h 30 par groupe</b> : environ <b>30 minutes de présentation</b> structurée en équipe, suivies d’environ <b>1 heure de questions</b> techniques et d’arbitrages avec le Client.</p>
      </article>
      <article class="ch-card">
        <span class="ch-badge">Pilier 3</span>
        <h3>Participation « suivi de chantier »</h3>
        <p>Évaluation continue au fil des validations d’étapes collectives en séance : régularité, implication dans le groupe, rigueur technique et capacité à justifier le travail produit.</p>
      </article>
    </div>
  </section>

  <section class="ch-sec">
    <div class="ch-sec-hd"><span class="ch-num">04</span><h2>Responsabilité collective : <em>interlocuteur mystère &amp; rachat</em></h2></div>
    <div class="ch-grid-2">
      <article class="ch-card ch-warn">
        <p class="ch-kicker">Anti-passager clandestin</p>
        <h3>La règle de l’interlocuteur mystère</h3>
        <p>Lors de chaque validation d’étape, le Directeur Technique <b>désigne aléatoirement un membre du groupe</b> pour expliquer un calcul, une formule de tableur ou un graphique du livrable.</p>
        <p>Si la personne désignée est incapable d’expliquer ce que le groupe présente (travail découpé en silos sans relecture croisée, ou sortie d’IA recopiée sans recul), <b>l’étape n’est pas validée et toute l’équipe est solidaire</b>.</p>
      </article>
      <article class="ch-card ch-ok">
        <p class="ch-kicker">Droit à l’erreur formatif</p>
        <h3>Le droit de rachat à l’étape suivante</h3>
        <p>Une non-validation n’est jamais une sanction définitive : elle ouvre une <b>note provisoire basse</b> sans bloquer l’avancement matériel du projet.</p>
        <p>La mission de l’équipe consiste alors à <b>réexpliquer les notions au camarade concerné</b> d’ici le jalon suivant, où <b>cette même personne sera réinterrogée</b> afin de revaloriser la note de toute l’équipe.</p>
      </article>
    </div>
  </section>

  <section class="ch-sec">
    <div class="ch-sec-hd"><span class="ch-num">05</span><h2>Outils numériques, IA <em>&amp; laboratoires virtuels</em></h2></div>
    <div class="ch-ai-rule">
      <h3>La règle d’or sur les outils numériques et l’intelligence artificielle</h3>
      <p>Tableur, outils numériques, infographies, vidéos de cours et assistants d’IA sont <b>autorisés</b> pour comprendre une notion, vérifier une cohérence ou soigner une mise en page, à <b>une condition absolue</b> : <b>100 % des membres du groupe doivent maîtriser et savoir démontrer chaque chiffre, chaque formule et chaque graphique à tout instant</b>.</p>
      <p>Les six laboratoires virtuels de ce portail sont conçus exactement dans cet esprit : vous permettre de vous entraîner individuellement, chez vous et à votre rythme, sur des <b>missions fictives</b> avant d’appliquer les méthodes aux données réelles de votre projet.</p>
    </div>

    <div class="ch-table-wrap">
      <table class="ch-table">
        <thead>
          <tr><th>Ressource</th><th>Thématique travaillée</th><th>Semestre</th><th>Entraînement interactif</th></tr>
        </thead>
        <tbody>{mod_rows}</tbody>
      </table>
    </div>
  </section>
</main>
{foot}
</body>
</html>
"""


def render_404() -> str:
    head, foot = chrome("", "", "Page introuvable - IUT Mantes · GC-CD")
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
    return """# Laboratoires virtuels - IUT Mantes (GC-CD)

Site **public** pour les étudiants : laboratoires HTML 3D, infographies PNG, visionneuse intégrée et suivi local de progression.

Adresse Pages : `https://N-di-Scala.github.io/labs-virtuels-iut-mantes-web/`

## Navigation

- `index.html` : quartier 3D des 6 laboratoires, suivi personnel de progression et choix du semestre (S1 à S4).
- `s1/` … `s4/` : laboratoires, accès direct aux ateliers, visionneuse d’infographies et vidéos du semestre.
- `charte.html` : charte éditoriale complète du fonctionnement en mode bureau d’études (BET).
- `labs/` : applications HTML autonomes (39 ateliers guidés).
- `infographies/` : fiches visuelles PNG haute définition.
- `videos.js` : identifiants YouTube et métadonnées de maillage par atelier.

Le thème clair / sombre (`iut_mantes_theme`), la langue (`labs-lang`) et la progression sont mémorisés localement dans le navigateur de chaque étudiant.
"""


if __name__ == "__main__":
    main()
