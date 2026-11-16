# -*- coding: utf-8 -*-
"""R1-13 Métrologie d'essai : poignées 3D. Utilisé par _lab_parcours/build.py."""

# poignées : (ancre unique dans la scène, appel inséré juste avant)
# conform : x(v) = -5 + (v - 18)/22 × 10 ; lot : y(v) = (v - 14) × 0,15
HANDLES = [
    ('  const tV = K.tag("Verdict", () => new THREE.Vector3(x(sig), 1.3, 0), { big: true });',
     '  window.LABV4H && window.LABV4H(K, spec, "Lspec", "conform", "La limite de spécification (plan rouge)", "glisser vers la gauche ou la droite pour déplacer L<sub>spec</sub>", 15 * 10 / 22, "x");\n'
     '  window.LABV4H && window.LABV4H(K, bead, "sig", "conform", "La résistance moyenne (bille)", "glisser vers la gauche ou la droite pour changer σ̄", 20 * 10 / 22, "x");\n'),
    ('  const tags = specs.map((s, i) => K.tag("σ" + (i + 1)',
     '  ["s1", "s2", "s3"].forEach((id, i) => window.LABV4H && window.LABV4H(K, caps[i], id, "lot", "Le sommet de l’éprouvette " + (i + 1), "glisser vers le haut ou le bas pour changer sa résistance σ" + (i + 1), 22 * 0.15));\n'),
]
