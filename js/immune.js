// ImmuneClear's shared models: a ghosted, clearly stylised human figure with the lymphatic system
// and the immune organs inside it, the cells the chapters use (bacteria, viruses, neutrophils,
// macrophages, dendritic cells, lymphocytes, Y-shaped antibodies), and the physiology numbers they
// share.
//
// Orientation: we face the person (anterior view), as in an anatomy atlas, so their RIGHT is on YOUR
// LEFT. Axes: +x = the person's left, +y = up, +z = forwards (towards you). One model unit is 10 cm,
// so the figure is about 1.75 m tall with the feet on the floor (y = 0), the same size as the
// figures in CirculationClear and NervousClear.
//
// Placement follows standard anatomy (Gray's Anatomy, 42nd ed.; Moore, Clinically Oriented Anatomy,
// 8th ed.; Britannica "Lymphatic system"; Cleveland Clinic "Lymphatic system"):
//  - lymph from the legs, pelvis, gut and the LEFT arm and LEFT side of the head collects in the
//    thoracic duct, which starts at the cisterna chyli in front of the L1–L2 vertebrae, rises beside
//    the spine, crosses to the left at about T4–T5 and empties into the left venous angle (where the
//    left internal jugular and subclavian veins meet). The right arm and right side of the head and
//    chest drain into the short right lymphatic duct at the right venous angle;
//  - about 600 lymph nodes (estimates 500–700), in chains in the neck (cervical), armpits
//    (axillary), chest (mediastinal), gut (mesenteric), groin (inguinal) and behind the knees
//    (popliteal);
//  - the thymus sits behind the breastbone above the heart; it is largest around puberty (about
//    30–40 g) and then slowly turns to fat (Britannica "Thymus");
//  - the spleen lies under the left ribs (ribs 9–11), about 11–12 cm long and about 150 g in adults;
//  - palatine tonsils either side of the throat, the adenoid at the back of the nose;
//  - Peyer's patches: clusters of lymph follicles in the wall of the ileum, lower right belly; the
//    appendix also carries lymph tissue;
//  - in adults the red (blood-making) bone marrow is mainly in the flat bones and the spine: pelvis,
//    breastbone, ribs, vertebrae, skull, and the upper ends of the thigh and arm bones.
// Vessel and organ sizes are exaggerated a little so they can be seen; positions are to scale.
import { THREE, M, clamp, lerp, smooth } from './kit.js';

export const LYMPH = 0x6ee7a8, NODE = 0xa8f5cc, THYMUS = 0xc9a7ff, SPLEEN = 0xb0406a, TONSIL = 0xff9fc0, MARROW = 0xff5a6a, PEYER = 0xffd166, VEIN = 0x7f9cff;

// ---------------------------------------------------------------- shared physiology numbers
// White blood cells (Guyton & Hall, Textbook of Medical Physiology, 14th ed., ch. 34; MedlinePlus
// "WBC count"): 4,000–11,000 per microlitre of blood; neutrophils about 40–70% of them, lymphocytes
// about 20–40%, monocytes about 2–8%, eosinophils 1–4%, basophils under 1%.
// The marrow releases about 10^11 (100 billion) neutrophils a day (Summers et al., Trends Immunol
// 31:318, 2010). A neutrophil lives only about a day in the blood; macrophages can live for months.
// Lymph: about 2–3 litres a day return to the blood through the lymph vessels (Guyton & Hall ch.
// 16); thoracic duct flow about 100 mL an hour at rest, and many times more during exercise.
export const WBC = { lo: 4000, hi: 11000, neutPerDay: 1e11, lymphLday: [2, 3], nodes: 600 };

// Antibody level against days after meeting a germ, on a log scale (relative units: 1 = the
// detection limit). Shapes follow the textbook primary and secondary responses (Murphy & Weaver,
// Janeway's Immunobiology, 9th ed., ch. 10–11; Abbas, Cellular and Molecular Immunology, 10th ed.,
// fig. 12–2): primary: a lag of about 5–7 days, IgM first, peaking at about 10 days, IgG peaking
// at about 2–3 weeks. Secondary (memory): antibodies start within 1–3 days, rise to about 10–100×
// the primary peak, are mostly IgG, and stay up for longer.
const hump = (d, t0, rise, peak, fall) => (d < t0 ? 0 : d < t0 + rise ? peak * smooth((d - t0) / rise) : peak * Math.exp(-(d - t0 - rise) / fall));
export function antibody(day, memory = false) {
  if (memory) return { igm: hump(day, 2, 4, 0.8, 5), igg: hump(day, 1.5, 5, 3.6, 60) };   // log10 units
  return { igm: hump(day, 4, 6, 1.4, 5), igg: hump(day, 7, 8, 1.9, 25) };
}
export const abTotal = (d, mem) => { const a = antibody(d, mem); return Math.max(a.igm, a.igg); };

// ---------------------------------------------------------------- colours and label helpers
const TINT = { lymph: '#6ee7a8', node: '#a8f5cc', thymus: '#c9a7ff', spleen: '#ff8ab0', tonsil: '#ff9fc0', marrow: '#ff8a8a', peyer: '#ffd166', side: '#8ef0ff', gold: '#ffd166', vein: '#9db4ff', red: '#ff8a8a', blue: '#9db4ff', good: '#6ee7a8', purple: '#c9a7ff', pink: '#ff9fc0' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export function sideLabels(stage, parent, y, x, z = 1.2) {
  return [tint(stage.label('← Their right', [-x, y, z], parent), 'side'), tint(stage.label('Their left →', [x, y, z], parent), 'side')];
}
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !inReel()) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
export function board(ct, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function panel(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.88)'; rrect(g, 0, 0, w, h, 20); g.fill(); }
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// A tiny seeded generator for simulations that must replay the same way in the video.
export function prng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- geometry helpers
export const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));
export function pathOf(points) {
  const Pt = points.map(V), L = [0];
  for (let i = 1; i < Pt.length; i++) L.push(L[i - 1] + Pt[i].distanceTo(Pt[i - 1]));
  const total = Math.max(1e-6, L[L.length - 1]);
  return {
    points: Pt, total,
    at(u, out = new THREE.Vector3()) {
      const d = clamp(u, 0, 1) * total;
      let lo = 0, hi = L.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= d) lo = m; else hi = m; }
      return out.copy(Pt[lo]).lerp(Pt[hi], (d - L[lo]) / Math.max(1e-9, L[hi] - L[lo]));
    },
  };
}
export const smoothPts = (pts, n = 60) => new THREE.CatmullRomCurve3(pts.map(V), false, 'centripetal').getPoints(n);
export function capsule(a, b, r, mat) {
  const A = V(a), B = V(b), len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
export function blob(r, pos, mat, seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(...r); m.position.set(...pos);
  return m;
}
export function vtube(pts, r, mat, n) {
  const p = pts.length > 2 ? smoothPts(pts, n ?? pts.length * 8) : pts.map(V);
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p, false, 'centripetal'), Math.max(6, p.length * 2), r, 8, false), mat);
  m.userData.pts = p;
  return m;
}
export const glowMat = (c, ei = 0.45, op = 1) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: c, emissiveIntensity: ei, transparent: op < 1, opacity: op, depthWrite: op >= 1 });
// Merge several geometries (with their own transforms) into one, for instanced cells.
export function merge(parts) {
  const pos = [], nor = [];
  parts.forEach(([geo, mtx]) => {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); if (mtx) g.applyMatrix4(mtx);
    g.computeVertexNormals();
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}
const mtx = (p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));

// ---------------------------------------------------------------- cell geometries
// A Y-shaped antibody (about 10 nm across in life): two arms that each end in an antigen-binding
// tip, and a stem (the Fc part) that other immune cells grab. Size s is the arm length.
export function antibodyGeo(s = 0.3) {
  const r = s * 0.16, arm = new THREE.CylinderGeometry(r, r, s, 8), tip = new THREE.CylinderGeometry(r * 1.6, r * 1.6, s * 0.28, 3);
  return merge([
    [arm, mtx([0, -s * 0.5, 0])],
    [arm, mtx([-s * 0.35, s * 0.35, 0], [0, 0, 0.78])], [arm, mtx([s * 0.35, s * 0.35, 0], [0, 0, -0.78])],
    [tip, mtx([-s * 0.72, s * 0.72, 0], [0, 0, 0.78])], [tip, mtx([s * 0.72, s * 0.72, 0], [0, 0, -0.78])],
  ]);
}
// A virus: a ball studded with spike proteins (the antigen antibodies grab).
export function virusGeo(r = 0.22, spikes = 18) {
  const parts = [[new THREE.IcosahedronGeometry(r, 2)]], sp = new THREE.CylinderGeometry(r * 0.12, r * 0.05, r * 0.5, 5);
  for (let i = 0; i < spikes; i++) {
    const y = 1 - (2 * (i + 0.5)) / spikes, rr = Math.sqrt(1 - y * y), a = i * 2.4;
    const n = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    parts.push([sp, new THREE.Matrix4().compose(n.clone().multiplyScalar(r * 1.2), q, new THREE.Vector3(1, 1, 1))]);
  }
  return merge(parts);
}
// A rod-shaped bacterium (like E. coli, about 2 µm long) or a round one (like Staphylococcus).
export const rodGeo = (r = 0.1, len = 0.28) => { const g = new THREE.CapsuleGeometry(r, len, 4, 10); g.rotateZ(Math.PI / 2); return g; };
// A cell with a lumpy surface (white cells are not smooth balls).
export function lumpyGeo(r = 1, amt = 0.08, seed = 1, detail = 3) {
  const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const k = 1 + amt * (Math.sin(n.x * 7 + seed) * Math.sin(n.y * 6 + seed * 2) + 0.6 * Math.sin(n.z * 9 + seed * 3)); v.copy(n).multiplyScalar(r * k); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
}
// A dendritic cell: a body with long branching arms (dendrites) that reach out to catch germs.
export function dendriticGeo(r = 0.7, arms = 11, seed = 3) {
  const parts = [[lumpyGeo(r, 0.12, seed, 3)]];
  for (let i = 0; i < arms; i++) {
    const y = 1 - (2 * (i + 0.5)) / arms, rr = Math.sqrt(1 - y * y), a = i * 2.4 + seed;
    const n = new THREE.Vector3(Math.cos(a) * rr, y * 0.7, Math.sin(a) * rr).normalize();
    const L = r * (1.3 + rnd(i + seed) * 0.9);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    parts.push([new THREE.ConeGeometry(r * 0.2, L, 6), new THREE.Matrix4().compose(n.clone().multiplyScalar(r * 0.8 + L * 0.5), q, new THREE.Vector3(1, 1, 1))]);
  }
  return merge(parts);
}
// A neutrophil: a round cell whose nucleus has 3–5 lobes (drawn as a group of beads inside).
export function makeNeutrophil(r = 0.35) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(lumpyGeo(r, 0.06, 2, 3), new THREE.MeshPhysicalMaterial({ color: 0xe9e0ff, roughness: 0.35, transparent: true, opacity: 0.55, depthWrite: false, clearcoat: 0.5 }));
  const nm = new THREE.MeshStandardMaterial({ color: 0x8a6ad8, roughness: 0.5, emissive: 0x3a2a70, emissiveIntensity: 0.5 });
  [[-0.4, 0.1, 0], [-0.1, 0.3, 0.1], [0.25, 0.15, 0], [0.35, -0.2, 0.05]].forEach(([x, y, z]) => g.add(blob([r * 0.26, r * 0.22, r * 0.22], [x * r, y * r, z * r], nm, 12)));
  g.add(shell); g.userData.shell = shell;
  return g;
}

// ---------------------------------------------------------------- the figure
export function makeFigure(mat) {
  const g = new THREE.Group();
  g.add(blob([0.78, 1.0, 0.88], [0, 16.45, 0.05], mat));                       // head
  g.add(capsule([0, 14.9, -0.02], [0, 15.6, 0.0], 0.38, mat));                 // neck
  const prof = [[15.1, 0.02], [15.0, 0.55], [14.75, 1.45], [14.35, 1.8], [13.6, 1.72], [12.4, 1.55], [11.3, 1.32], [10.4, 1.35], [9.6, 1.55], [9.0, 1.5], [8.55, 1.05], [8.4, 0.02]];
  const torso = new THREE.LatheGeometry(prof.map(([y, r]) => new THREE.Vector2(r, y)), 48);
  torso.scale(1, 1, 0.6); torso.computeVertexNormals();
  g.add(new THREE.Mesh(torso, mat));
  for (const sx of [1, -1]) {
    g.add(capsule([sx * 1.85, 14.35, 0], [sx * 2.2, 11.8, 0.05], 0.36, mat));   // upper arm
    g.add(capsule([sx * 2.2, 11.8, 0.05], [sx * 2.45, 9.45, 0.1], 0.29, mat));  // forearm
    g.add(blob([0.24, 0.48, 0.13], [sx * 2.56, 8.72, 0.08], mat));              // hand
    g.add(capsule([sx * 0.78, 9.0, 0], [sx * 0.95, 4.8, 0], 0.6, mat));         // thigh
    g.add(capsule([sx * 0.95, 4.8, 0], [sx * 0.97, 0.75, -0.05], 0.44, mat));   // shin
    g.add(blob([0.34, 0.2, 0.62], [sx * 1.0, 0.24, 0.35], mat));                // foot
  }
  return g;
}

// Where things sit (shared by the chapters).
export const ORG = {
  thymus: [0, 13.75, 0.5], spleen: [1.12, 11.55, -0.35], tonsilL: [0.2, 15.72, 0.32], tonsilR: [-0.2, 15.72, 0.32], adenoid: [0, 16.05, -0.05],
  peyer: [-0.55, 9.75, 0.45], appendix: [-0.72, 9.35, 0.35], heart: [0.25, 12.55, 0.35], pancreas: [0.35, 11.0, -0.1],
  angleL: [0.55, 14.75, 0.05], angleR: [-0.55, 14.75, 0.05], cisterna: [0.05, 11.0, -0.38],
  nose: [0, 16.35, 0.85], lungL: [1.0, 13.1, -0.1], lungR: [-1.0, 13.1, -0.1], kneeL: [0.95, 4.8, 0.3], kneeR: [-0.95, 4.8, 0.3], handL: [2.56, 8.72, 0.08], handR: [-2.56, 8.72, 0.08],
};

// ---------------------------------------------------------------- the whole body
export function makeBody(stage, opts = {}) {
  const o = { labels: true, ...opts };
  const root = new THREE.Group(), G = {};
  ['skin', 'veins', 'lymph', 'nodes', 'organs', 'marrow'].forEach((k) => { G[k] = new THREE.Group(); root.add(G[k]); });

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a47e, transparent: true, opacity: 0.12, roughness: 0.65, depthWrite: false, side: THREE.DoubleSide });
  G.skin.add(makeFigure(skinMat));

  // ---- the big veins the lymph empties into (for context): jugulars, subclavians, the superior vena cava
  const veinMat = new THREE.MeshStandardMaterial({ color: VEIN, roughness: 0.45, transparent: true, opacity: 0.45, depthWrite: false, emissive: VEIN, emissiveIntensity: 0.2 });
  for (const sx of [1, -1]) {
    G.veins.add(vtube([[sx * 0.42, 16.0, 0.05], [sx * 0.5, 15.3, 0.1], [sx * 0.55, 14.75, 0.05]], 0.06, veinMat, 20));
    G.veins.add(vtube([[sx * 1.75, 14.3, 0.0], [sx * 1.1, 14.55, 0.08], [sx * 0.55, 14.75, 0.05]], 0.06, veinMat, 20));
    G.veins.add(vtube([[sx * 0.55, 14.75, 0.05], [sx * 0.3, 14.1, 0.2], [-0.15, 13.6, 0.25]], 0.07, veinMat, 20));
  }
  G.veins.add(vtube([[-0.15, 13.6, 0.25], [-0.15, 13.1, 0.3]], 0.09, veinMat));
  const heart = blob([0.4, 0.55, 0.36], ORG.heart, new THREE.MeshStandardMaterial({ color: 0xc23a48, transparent: true, opacity: 0.35, depthWrite: false, roughness: 0.5 }), 24); heart.rotation.z = 0.7; G.veins.add(heart);

  // ---- lymph vessels: from hands, feet, head and gut, through the node chains, to the two ducts
  const lyMat = glowMat(LYMPH, 0.45), fineMat = glowMat(LYMPH, 0.35, 0.6);
  const paths = {};
  const add = (name, pts, r = 0.032, mat = lyMat) => { const m = vtube(pts, r, mat); G.lymph.add(m); if (name) paths[name] = m.userData.pts; return m; };
  for (const sx of [1, -1]) {
    const side = sx > 0 ? 'L' : 'R';
    // leg: top of the foot → front of the shin → knee (popliteal nodes behind) → thigh → groin → pelvis → cisterna
    add('leg' + side, [[sx * 1.0, 0.35, 0.55], [sx * 0.98, 1.4, 0.3], [sx * 0.96, 3.2, 0.25], [sx * 0.95, 4.9, -0.2], [sx * 0.9, 6.6, 0.25], [sx * 0.82, 8.0, 0.4], [sx * 0.72, 8.6, 0.42], [sx * 0.55, 9.3, 0.0], [sx * 0.3, 10.2, -0.3], ORG.cisterna]);
    add(null, [[sx * 1.2, 0.8, 0.2], [sx * 1.25, 2.6, 0.05], [sx * 1.25, 4.4, -0.05], [sx * 0.95, 4.9, -0.2]], 0.02, fineMat);
    // arm: hand → forearm → elbow nodes → upper arm → armpit nodes → venous angle
    const angle = sx > 0 ? ORG.angleL : ORG.angleR;
    add('arm' + side, [[sx * 2.58, 8.9, 0.2], [sx * 2.45, 9.8, 0.25], [sx * 2.3, 11.0, 0.25], [sx * 2.22, 11.9, 0.2], [sx * 2.05, 12.9, 0.1], [sx * 1.6, 13.7, 0.1], [sx * 1.1, 14.4, 0.1], angle]);
    // head: face and scalp → neck nodes → venous angle
    add('head' + side, [[sx * 0.55, 16.6, 0.6], [sx * 0.62, 16.0, 0.35], [sx * 0.5, 15.5, 0.25], [sx * 0.48, 15.1, 0.15], angle]);
    add(null, [[sx * 0.7, 17.1, -0.2], [sx * 0.72, 16.3, -0.3], [sx * 0.55, 15.6, -0.1], [sx * 0.5, 15.2, 0.1]], 0.02, fineMat);
    // chest wall and breast → armpit
    add(null, [[sx * 0.8, 12.6, 0.75], [sx * 1.2, 13.2, 0.55], [sx * 1.6, 13.7, 0.1]], 0.02, fineMat);
  }
  // gut: mesenteric nodes → cisterna chyli
  add('gut', [[-0.55, 9.75, 0.45], [-0.3, 10.1, 0.35], [0, 10.4, 0.25], [0.05, 10.75, -0.1], ORG.cisterna]);
  add(null, [[0.5, 10.0, 0.4], [0.2, 10.35, 0.3], [0, 10.4, 0.25]], 0.022, fineMat);
  // thoracic duct: cisterna → up beside the spine → crosses left at about T5 → left venous angle
  const duct = add('duct', [ORG.cisterna, [0.0, 11.8, -0.42], [-0.05, 12.6, -0.4], [0.02, 13.3, -0.35], [0.2, 14.0, -0.25], [0.45, 14.6, -0.1], [0.6, 14.95, 0.0], ORG.angleL], 0.055);
  const rduct = add('rduct', [[-0.4, 14.3, -0.05], [-0.5, 14.55, 0.0], ORG.angleR], 0.045);
  const cist = blob([0.12, 0.28, 0.1], ORG.cisterna, lyMat, 16); G.lymph.add(cist);

  // ---- lymph nodes: little beans in chains (a few hundred in life; a representative few here)
  const nodeMat = new THREE.MeshStandardMaterial({ color: NODE, roughness: 0.45, emissive: LYMPH, emissiveIntensity: 0.35 });
  const nodes = [];
  const NODE_AT = [];
  for (const sx of [1, -1]) {
    [[0.52, 15.5, 0.25], [0.48, 15.2, 0.18], [0.6, 15.85, 0.3], [0.62, 16.1, -0.2], [0.52, 15.35, -0.05]].forEach((p) => NODE_AT.push(['neck', [sx * p[0], p[1], p[2]]]));
    [[1.55, 13.7, 0.1], [1.68, 13.55, -0.05], [1.45, 13.85, 0.0], [1.6, 13.45, 0.15]].forEach((p) => NODE_AT.push(['armpit', [sx * p[0], p[1], p[2]]]));
    [[2.22, 11.95, 0.2]].forEach((p) => NODE_AT.push(['elbow', [sx * p[0], p[1], p[2]]]));
    [[0.72, 8.62, 0.44], [0.62, 8.8, 0.4], [0.82, 8.45, 0.4], [0.5, 9.2, 0.1]].forEach((p) => NODE_AT.push(['groin', [sx * p[0], p[1], p[2]]]));
    [[0.95, 4.95, -0.22], [0.92, 4.8, -0.25]].forEach((p) => NODE_AT.push(['knee', [sx * p[0], p[1], p[2]]]));
    [[0.3, 13.2, 0.0], [0.25, 12.9, -0.1]].forEach((p) => NODE_AT.push(['chest', [sx * p[0], p[1], p[2]]]));
  }
  [[-0.3, 10.1, 0.35], [0, 10.35, 0.3], [0.2, 10.3, 0.35], [-0.1, 10.6, 0.1], [0.3, 10.05, 0.4]].forEach((p) => NODE_AT.push(['gut', p]));
  NODE_AT.forEach(([where, p], i) => { const n = blob([0.07, 0.1, 0.06], p, nodeMat, 12); n.rotation.z = rnd(i) * 2; G.nodes.add(n); nodes.push({ mesh: n, where }); });

  // ---- lymphoid organs
  const om = (c, op = 0.85, ei = 0.35) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.45, clearcoat: 0.4, transparent: op < 1, opacity: op, emissive: c, emissiveIntensity: ei, depthWrite: op >= 1 });
  const organ = {};
  organ.thymus = new THREE.Group();
  [[-0.14, 0, 0], [0.14, 0.03, 0]].forEach(([x, y]) => organ.thymus.add(blob([0.16, 0.36, 0.1], [x, y, 0], om(THYMUS, 0.9), 20)));
  organ.thymus.position.set(...ORG.thymus);
  organ.spleen = blob([0.22, 0.55, 0.3], ORG.spleen, om(SPLEEN, 0.92, 0.3), 28); organ.spleen.rotation.set(0.3, -0.4, -0.5);
  organ.tonsils = new THREE.Group();
  [ORG.tonsilL, ORG.tonsilR].forEach((p) => organ.tonsils.add(blob([0.07, 0.11, 0.06], p, om(TONSIL, 0.95), 14)));
  organ.tonsils.add(blob([0.14, 0.07, 0.07], ORG.adenoid, om(TONSIL, 0.95), 14));
  // a loop of ileum (ghosted) with Peyer's patches on it, and the appendix
  organ.gut = new THREE.Group();
  const ileMat = new THREE.MeshStandardMaterial({ color: 0xe8b07a, transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.6 });
  organ.gut.add(vtube([[0.6, 10.2, 0.45], [0.2, 9.9, 0.5], [-0.25, 10.2, 0.5], [-0.6, 10.0, 0.45], [-0.5, 9.6, 0.45], [-0.75, 9.55, 0.35]], 0.1, ileMat, 40));
  const pp = om(PEYER, 1, 0.6);
  [[-0.25, 10.2, 0.6], [-0.58, 10.0, 0.55], [-0.52, 9.64, 0.55], [0.15, 9.92, 0.6]].forEach((p) => organ.gut.add(blob([0.09, 0.05, 0.03], p, pp, 12)));
  organ.gut.add(vtube([[-0.75, 9.5, 0.35], [-0.72, 9.3, 0.38], [-0.66, 9.2, 0.4]], 0.03, om(PEYER, 1, 0.4), 12));
  ['thymus', 'spleen', 'tonsils', 'gut'].forEach((k) => G.organs.add(organ[k]));

  // ---- red bone marrow inside faint bones: pelvis, breastbone, spine, upper femurs and humeri, skull
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, transparent: true, opacity: 0.14, roughness: 0.7, depthWrite: false });
  const rmMat = om(MARROW, 0.85, 0.5);
  const marrow = [];
  const mar = (mesh) => { G.marrow.add(mesh); marrow.push(mesh); return mesh; };
  for (const sx of [1, -1]) {
    const il = blob([0.5, 0.42, 0.14], [sx * 0.7, 9.45, -0.2], boneMat, 20); il.rotation.set(0, sx * 0.5, sx * 0.3); G.marrow.add(il);
    const ilm = mar(blob([0.36, 0.3, 0.07], [sx * 0.7, 9.45, -0.2], rmMat, 18)); ilm.rotation.copy(il.rotation);
    G.marrow.add(capsule([sx * 0.8, 8.8, 0], [sx * 0.92, 5.2, 0], 0.13, boneMat));
    mar(capsule([sx * 0.8, 8.75, 0], [sx * 0.84, 8.0, 0], 0.07, rmMat));
    G.marrow.add(capsule([sx * 1.85, 14.2, 0], [sx * 2.18, 11.9, 0.05], 0.1, boneMat));
    mar(capsule([sx * 1.86, 14.1, 0], [sx * 1.92, 13.6, 0.02], 0.055, rmMat));
  }
  G.marrow.add(capsule([0, 13.9, 0.72], [0, 12.4, 0.8], 0.12, boneMat));
  mar(capsule([0, 13.8, 0.72], [0, 12.5, 0.8], 0.06, rmMat));
  for (let k = 0; k < 17; k++) { const y = 14.9 - k * 0.3; const v = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 14), boneMat); v.position.set(0, y, -0.5); G.marrow.add(v); mar(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 10), rmMat)).position.set(0, y, -0.5); }

  // ---- lymph flow: glowing droplets that run along any path
  const dropGeo = new THREE.SphereGeometry(0.06, 10, 8), pool = [];
  const flow = new THREE.Group(); root.add(flow);
  const drops = {
    send(path, { speed = 3, color = LYMPH, size = 1, onDone = null } = {}) {
      let p = pool.find((q) => !q.live);
      if (!p) { p = { mesh: new THREE.Mesh(dropGeo, M.glow(0xffffff)) }; pool.push(p); flow.add(p.mesh); }
      p.mesh.material.color.set(color);
      Object.assign(p, { live: true, path, u: 0, speed, size, onDone }); p.mesh.visible = true;
      return p;
    },
    step(dt) {
      pool.forEach((p) => {
        if (!p.live) return;
        p.u += (dt * p.speed) / p.path.total;
        if (p.u >= 1) { p.live = false; p.mesh.visible = false; p.onDone?.(); return; }
        p.path.at(p.u, p.mesh.position); p.mesh.scale.setScalar(p.size);
      });
    },
    clear() { pool.forEach((p) => { p.live = false; p.mesh.visible = false; }); },
  };
  // Whole routes from the edge of the body to a vein.
  const ductPts = paths.duct;
  const routes = {
    legL: pathOf(paths.legL.concat(ductPts)), legR: pathOf(paths.legR.concat(ductPts)), gut: pathOf(paths.gut.concat(ductPts)),
    armL: pathOf(paths.armL), armR: pathOf(paths.armR), headL: pathOf(paths.headL), headR: pathOf(paths.headR),
  };

  // ---- labels
  const labels = [];
  const L = (html, pos, parent, cls = '') => { const l = tint(stage.label(html, pos, parent), cls); labels.push(l); return l; };
  if (o.labels) {
    L('Tonsils and adenoid', [2.9, 17.1, 0.4], G.organs, 'tonsil');
    L('Neck lymph nodes', [3.0, 16.4, 0.3], G.nodes, 'node');
    L('Lymph ducts empty into veins here', [3.5, 15.7, 0.2], G.lymph, 'lymph');
    L('Thymus: T cells train here', [3.4, 15.0, 0.5], G.organs, 'thymus');
    L('Armpit nodes', [3.3, 14.1, 0.1], G.nodes, 'node');
    L('Spleen: filters the blood', [3.4, 11.5, -0.3], G.organs, 'spleen');
    L('Thoracic duct', [-2.8, 11.3, -0.4], G.lymph, 'lymph');
    L('Peyer’s patches in the gut wall', [-3.4, 10.3, 0.5], G.organs, 'peyer');
    L('Red bone marrow: see SkeletonClear', [-3.4, 9.2, -0.3], G.marrow, 'marrow');
    L('Groin nodes', [2.8, 8.6, 0.4], G.nodes, 'node');
    L('Lymph vessels', [-2.6, 6.6, 0.3], G.lymph, 'lymph');
  }

  const api = {
    root, G, organ, nodes, marrow, skinMat, boneMat, lyMat, nodeMat, rmMat, veinMat, labels, drops, routes, duct, rduct, paths,
    setXray(k) {
      skinMat.opacity = lerp(0.5, 0.1, k);
      boneMat.opacity = lerp(0.03, 0.14, k);
      lyMat.emissiveIntensity = lerp(0.1, 0.45, k);
      nodeMat.emissiveIntensity = lerp(0.1, 0.35, k);
    },
    // Explode: the lymphoid organs slide to their left (your right), the marrow to their right,
    // and the vessels and nodes stay in the body.
    setExplode(k) {
      const e = smooth(k);
      G.organs.position.set(3.3 * e, 0, 0.4 * e);
      G.marrow.position.set(-3.3 * e, 0, 0);
    },
    showLabels(on) { labels.forEach((l) => { l.visible = on; }); },
  };
  api.setExplode(0); api.setXray(1);
  return api;
}
