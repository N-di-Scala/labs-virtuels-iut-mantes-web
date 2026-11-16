/* Camille, la tutrice des labs : visage 3D stylisé (casque, gilet de chantier).
   Fichier unique, utilisé par les labs (extensions.js) et par la page d'accueil du site,
   pour que le personnage soit exactement le même partout.
   window.LABV4_CAMILLE(THREE, taille) -> image PNG (data URL). */
window.LABV4_CAMILLE = function (THREE, S0) {
  const doc = document;
  const S = S0 || 256;
  const cv = doc.createElement("canvas");
  cv.width = cv.height = S;
  let r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (_) { return null; }
  r.setSize(S, S, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(0.35, 0.25, 6.1);
  cam.lookAt(0, 0.12, 0);
  sc.add(new THREE.HemisphereLight(0xfff4e6, 0x30384a, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 3, 4);
  sc.add(key);
  const rim = new THREE.DirectionalLight(0x8fc7ff, 1.4);
  rim.position.set(-3, 1.5, -2);
  sc.add(rim);
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 0 });
  const g = new THREE.Group();
  sc.add(g);
  const sph = (rad, mat, x, y, z, sx = 1, sy = 1, sz = 1, seg = 40) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, seg, seg), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  const skin = M(0xf1c7a1, { r: 0.6 }), hair = M(0x3b2a22, { r: 0.8 }), dark = M(0x1d1b22, { r: 0.3 }), white = M(0xffffff, { r: 0.2 });
  // cou, épaules (gilet de chantier)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.7, 32), skin); neck.position.set(0, -1.15, 0); g.add(neck);
  const vest = new THREE.Mesh(new THREE.SphereGeometry(1.55, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M(0xff8a1f, { r: 0.7 })); vest.position.set(0, -2.45, 0); vest.scale.set(1.15, 0.75, 0.8); g.add(vest);
  // bandes réfléchissantes verticales du gilet
  [-0.55, 0.55].forEach((x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.05), M(0xe8f0f5, { e: 0xdfe9ff, ei: 0.35 })); b.position.set(x, -1.95, 0.95); b.rotation.x = -0.45; g.add(b); });
  // tête, cheveux, oreilles
  sph(1, skin, 0, 0, 0, 0.92, 1.05, 0.95, 64);
  sph(1.02, hair, 0, 0.12, -0.12, 0.95, 1.0, 0.95, 48);
  sph(1, skin, 0, -0.06, 0.05, 0.9, 0.98, 0.95, 64); // visage par-dessus les cheveux
  sph(0.45, hair, -0.7, -0.35, -0.35, 0.6, 1.2, 0.8); sph(0.45, hair, 0.7, -0.35, -0.35, 0.6, 1.2, 0.8); // mèches
  // frange sous la visière
  sph(0.42, hair, -0.32, 0.36, 0.66, 1.25, 0.3, 0.55); sph(0.36, hair, 0.3, 0.38, 0.68, 1.1, 0.26, 0.5);
  sph(0.17, skin, -0.9, -0.05, 0, 0.6, 1, 0.8); sph(0.17, skin, 0.9, -0.05, 0, 0.6, 1, 0.8);
  // yeux expressifs (style jeu vidéo)
  [-0.33, 0.33].forEach((x) => {
    sph(0.2, white, x, 0.05, 0.8, 1, 1.15, 0.5);
    sph(0.125, M(0x3c6f9e, { r: 0.25 }), x + 0.02, 0.03, 0.88, 1, 1.1, 0.5);
    sph(0.07, dark, x + 0.02, 0.03, 0.93, 1, 1.1, 0.5);
    sph(0.035, M(0xffffff, { e: 0xffffff, ei: 1 }), x + 0.07, 0.1, 0.97);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), hair); brow.position.set(x, 0.33, 0.83); brow.rotation.z = Math.PI / 2 + (x < 0 ? -0.15 : 0.15); g.add(brow);
  });
  // nez, joues, sourire
  sph(0.09, M(0xe9b18c, { r: 0.6 }), 0, -0.15, 0.93, 1, 1.1, 1);
  sph(0.13, M(0xf29a8a, { r: 0.8 }), -0.5, -0.27, 0.72, 1, 0.6, 0.4); sph(0.13, M(0xf29a8a, { r: 0.8 }), 0.5, -0.27, 0.72, 1, 0.6, 0.4);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 28, Math.PI), M(0x8a3b3b, { r: 0.4 })); smile.position.set(0, -0.36, 0.86); smile.rotation.set(-0.15, 0, Math.PI); g.add(smile);
  // casque de chantier orange, avec visière et bande réfléchissante
  const hatMat = M(0xf28a1c, { r: 0.35, m: 0.05 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.03, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), hatMat); dome.position.set(0, 0.4, -0.02); dome.scale.set(1.02, 0.9, 1.04); g.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.16, 0.08, 48), hatMat); brim.position.set(0, 0.43, 0.04); g.add(brim);
  const peak = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), hatMat); peak.position.set(0, 0.43, 0.75); peak.scale.set(1, 0.12, 0.7); g.add(peak);
  const refl = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 8, 64), M(0xe8f0f5, { e: 0xdfe9ff, ei: 0.4 })); refl.position.set(0, 0.62, -0.02); refl.rotation.x = Math.PI / 2; refl.scale.set(1, 1.02, 1); g.add(refl);
  g.rotation.y = -0.18;
  g.position.y = 0.05;
  r.render(sc, cam);
  const url = cv.toDataURL("image/png");
  r.dispose();
  return url;
};
