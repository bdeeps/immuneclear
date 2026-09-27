// Chapter 2: the walls and the first responders (innate immunity). A splinter carries bacteria
// through the skin. Nearby capillaries widen (redness, heat), leak fluid (swelling), and neutrophils
// squeeze out of the blood and eat the bacteria (phagocytosis); resident macrophages help and later
// clean up. A second view shows the walls that stop most germs getting in at all: skin, the mucus
// escalator of the airways, and stomach acid.
// The model (hours after the splinter): bacteria B, neutrophils at the site N, macrophages Mc.
//   dB/dt = r·B·(1 − B/Bmax) − k·(8N + 20Mc)·B/(B + 2×10⁴)
//   dN/dt = 40,000·I·ramp(t) − N/12 h,   I = B/(B + 10⁴) + a small signal from the wound itself
// Constants and sources:
//  - bacteria in tissue double about every 45 minutes (Staphylococcus aureus doubles in about 30 min
//    in broth, more slowly in tissue); Bmax = 10⁸ caps the growth;
//  - neutrophils start arriving within about an hour and pour in over the first 6–24 h; monocytes
//    that become macrophages follow over 1–2 days (Kumar, Abbas & Aster, Robbins Basic Pathology,
//    10th ed., ch. 3; Kolaczkowska & Kubes, Nat Rev Immunol 13:159, 2013); a neutrophil can eat
//    many bacteria before it dies, and dead neutrophils are the main part of pus;
//  - wounds with more than about 10⁵ bacteria per gram of tissue tend to become infected (Robson &
//    Heggers, Mil Med 134:19, 1969; Bowler et al., Clin Microbiol Rev 14:244, 2001): the model's
//    tipping point sits between 10⁴ and 10⁵;
//  - washing a wound with clean running water cuts the bacterial load (WHO, "Wound care" guidance);
//    we take it as about 10 times fewer;
//  - fever (about 38–39 °C) helps immune cells work and slows some microbes (Evans, Repasky & Fisher,
//    Nat Rev Immunol 15:335, 2015); modelled gently as 15% slower growth and 20% faster killing;
//  - the four classic signs of inflammation, rubor, calor, tumor, dolor (redness, heat, swelling,
//    pain), are from Celsus, 1st century CE.
// Walls: skin surface pH about 4.7–5.5 (Lambers et al., Int J Cosmet Sci 28:359, 2006) and a top
// layer of 15–20 sheets of dead, keratin-filled cells; airway cilia beat about 10–15 times a second and
// move mucus up towards the throat at several millimetres a minute (Bustamante-Marin & Ostrowski,
// Cold Spring Harb Perspect Biol 9:a028241, 2017); stomach pH about 1.5–3.5 (Guyton & Hall ch. 65).
import { THREE, M, clamp, lerp, smooth, canvasTexture, rod } from '../kit.js';
import { board, panel, tint, fitNarrow, compactReadout, inReel, rnd, rodGeo, lumpyGeo, makeNeutrophil, vtube, blob } from '../immune.js';

const T_END = 48;
const hoursPerSec = (h) => (h < 8 ? 0.4 : 3);           // slow at first, so the fight can be seen
export const fmtN = (x) => (x < 1 ? '0' : x < 1000 ? String(Math.round(x)) : x < 1e6 ? (x / 1000).toFixed(x < 1e4 ? 1 : 0) + ' thousand' : (x / 1e6).toFixed(x < 1e7 ? 1 : 0) + ' million');

function simStep(st, dt, s) {
  const r = (Math.log(2) / 0.75) * (s.fever ? 0.85 : 1), kk = s.fever ? 1.2 : 1;
  const n = Math.max(1, Math.ceil(dt / 0.01)), h = dt / n;
  for (let i = 0; i < n; i++) {
    const I = st.B / (st.B + 1e4) + 0.1 * Math.exp(-st.t / 8);
    const kill = kk * (8 * st.N + 20 * st.Mc) * st.B / (st.B + 2e4);
    st.B = Math.max(0, st.B + (r * st.B * (1 - st.B / 1e8) - kill) * h); if (st.B < 1) st.B = 0;
    st.N += (40000 * I * Math.min(1, st.t / 5) ** 2 - st.N / 12) * h;
    st.Mc += (400 * I * Math.min(1, st.t / 24) - (st.Mc - 500) / 72) * h;
    st.I = I; st.t += h;
  }
}

function drawChart(g, w, h, st) {
  panel(g, w, h);
  const L = 70, R = w - 24, top = 70, bot = h - 46;
  const X = (t) => L + (t / T_END) * (R - L), Y = (v) => bot - clamp(v / 8, 0, 1) * (bot - top);
  g.fillStyle = '#e8eef8'; g.font = 'bold 28px sans-serif'; g.fillText('The fight at the splinter', L, 40);
  g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
  [0, 2, 4, 6, 8].forEach((v) => { g.fillText(v ? '10' : '1', 18, Y(v) + 7); if (v) { g.font = '13px sans-serif'; g.fillText(v, 42, Y(v) - 4); g.font = '20px sans-serif'; } g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); });
  [0, 12, 24, 36, 48].forEach((t) => g.fillText(t + ' h', X(t) - 14, h - 14));
  // infection line: 10^5 per gram
  g.strokeStyle = 'rgba(255,90,106,.5)'; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(L, Y(5)); g.lineTo(R, Y(5)); g.stroke(); g.setLineDash([]);
  g.fillStyle = 'rgba(255,138,138,.85)'; g.font = '18px sans-serif'; g.fillText('infection likely above about 100,000', R - 330, Y(5) - 8);
  const line = (key, col) => { g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); st.hist.forEach((p, i) => { const x = X(p.t), y = Y(Math.log10(1 + p[key])); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.lineWidth = 1; };
  line('B', '#b8e05a'); line('N', '#c9a7ff');
  g.font = 'bold 20px sans-serif'; g.fillStyle = '#b8e05a'; g.fillText('bacteria', R - 250, 40); g.fillStyle = '#c9a7ff'; g.fillText('neutrophils', R - 140, 40);
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(X(st.t), top); g.lineTo(X(st.t), bot); g.stroke();
}

export default {
  id: 'innate',
  short: 'Walls and first responders',
  title: 'Walls, fire and hungry cells',
  subtitle: 'Skin, mucus and acid keep germs out. When one gets in, inflammation and eater cells hit back in minutes.',
  view: { pos: [-0.6, 6.0, 13], target: [-1.2, 2.9, 0] },
  learn: `<p>Most germs never get inside you, because your body is wrapped in <b>walls</b>. <b>Skin</b> is a tough top layer of dead cells, slightly acidic and salty (see SkinClear). Your airways are lined with sticky <b>mucus</b>, and tiny hairs called <b>cilia</b> beat 10–15 times a second to sweep it up to your throat, where you swallow it: the <b>mucus escalator</b> (see RespirationClear). Swallowed germs meet <b>stomach acid</b> strong enough to kill most of them (see DigestionClear). Tears and saliva carry germ-dissolving enzymes too.</p>
    <p>When a wall is broken, say by a <b>splinter</b>, the <b>innate</b> immune system answers within minutes. It doesn't need to know which germ it is. Damaged cells and guard cells called <b>macrophages</b> release alarm chemicals. Nearby blood vessels widen and leak: the spot turns <b>red</b>, <b>warm</b> and <b>swollen</b>, and it hurts. That is <b>inflammation</b>, and it is a good sign.</p>
    <p>The leaky vessels let <b>neutrophils</b>, the most common white cells, squeeze out of the blood and crawl towards the bacteria. They swallow them whole and digest them inside: <b>phagocytosis</b>, "cell eating". Dead neutrophils and bacteria make <b>pus</b>. If germs get into the blood, the brain can raise your thermostat: a <b>fever</b> helps immune cells work and slows some germs down.</p>
    <p class="tip"><b>Try it:</b> raise the number of bacteria the splinter carries in until the fight is lost. Then wash the wound, or switch to the walls.</p>`,
  terms: [
    { t: 'Innate immunity', d: 'The fast, general defences you are born with: walls, inflammation and eater cells.' },
    { t: 'Inflammation', d: 'Redness, heat, swelling and pain where vessels widen and leak to let defenders in.' },
    { t: 'Neutrophil', d: 'The most common white cell: a fast, short-lived bacteria eater.' },
    { t: 'Macrophage', d: 'A big, long-lived eater cell that guards tissues, cleans up and raises the alarm.' },
    { t: 'Phagocytosis', d: 'When a cell wraps around a germ, swallows it and digests it.' },
    { t: 'Mucus escalator', d: 'Cilia in the airways sweeping a sticky mucus layer, and the germs caught in it, up to the throat.' },
    { t: 'Fever', d: 'A raised body temperature set by the brain during infection. It helps defences work.' },
  ],
  defaults: { scene: 'splinter', dose: 10000, wash: false, fever: false, labels: true },
  controls: [
    { key: 'scene', type: 'seg', label: 'Show', options: [{ v: 'splinter', label: 'A splinter' }, { v: 'walls', label: 'The walls' }] },
    { key: 'dose', type: 'log', label: 'Bacteria carried in', min: 10, max: 1000000, fmt: (v) => fmtN(v), hint: 'A clean prick carries a few; a dirty thorn can carry many thousands.' },
    { key: 'wash', type: 'toggle', label: 'Wash the wound first', hint: 'Clean running water rinses most bacteria away.' },
    { key: 'fever', type: 'toggle', label: 'Fever (38.5 °C)' },
    { key: 'go', type: 'buttons', label: 'Start again', items: [{ label: 'New splinter', act: (s, inst) => inst.restart?.() }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  onChange(s, key) { if (key === 'dose' || key === 'wash') s._restart = true; },
  quiz: [
    { q: 'Why does the skin around a splinter go red and swollen?', options: ['The splinter is poisonous', 'Blood vessels widen and leak so defenders can get in', 'The skin is dying', 'Bacteria are red'], answer: 1, why: 'Inflammation widens the vessels (redness, heat) and makes them leaky (swelling), letting fluid and neutrophils reach the germs.' },
    { q: 'What does a neutrophil do to a bacterium?', options: ['Makes an antibody against it', 'Swallows and digests it', 'Turns it into a virus', 'Carries it to the heart'], answer: 1, why: 'Neutrophils are eater cells. Swallowing and digesting a germ is called phagocytosis.' },
    { q: 'Which of these is NOT one of the body’s walls against germs?', options: ['Skin', 'Mucus and cilia in the airways', 'Stomach acid', 'Red blood cells'], answer: 3, why: 'Red blood cells carry oxygen. Skin, mucus and cilia, stomach acid, tears and saliva are the walls.' },
  ],
  reel: [
    { ms: 5400, caption: 'When a splinter breaks the skin, vessels widen and leak: that red, warm swelling is inflammation.', set: { scene: 'splinter', dose: 50000, wash: false, fever: false, labels: false }, act: (s, inst) => inst.restart?.(), view: { pos: [0.4, 6.1, 11.5], target: [0.2, 3.1, 0] }, spin: 0 },
    { ms: 5200, caption: 'Neutrophils squeeze out of the blood and swallow the bacteria whole.', set: { scene: 'splinter', dose: 50000, labels: false }, view: { pos: [2.0, 4.1, 6.5], target: [0.2, 2.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const S = new THREE.Group(); S.position.y = 3.7; root.add(S);                        // splinter scene
    const W = new THREE.Group(); W.position.set(40, 3.7, 0); root.add(W);   // walls scene

    // ---- skin block: epidermis on top, dermis below, cut open towards us
    const epi = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 5), new THREE.MeshStandardMaterial({ color: 0xe0b08a, roughness: 0.7 }));
    epi.position.y = -0.25; S.add(epi);
    const derm = new THREE.Mesh(new THREE.BoxGeometry(12, 3.1, 5), new THREE.MeshStandardMaterial({ color: 0xf0a8a0, roughness: 0.6, transparent: true, opacity: 0.28, depthWrite: false }));
    derm.position.y = -2.05; S.add(derm);
    // the red flush and the swelling: a glowing patch and a raised dome at the surface
    const flushMat = new THREE.MeshBasicMaterial({ color: 0xff4050, transparent: true, opacity: 0, depthWrite: false });
    const flush = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), flushMat); flush.rotation.x = -Math.PI / 2; flush.position.y = 0.012; S.add(flush);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8a080, roughness: 0.6, transparent: true, opacity: 0.8 }));
    dome.scale.set(1, 0.01, 1); S.add(dome);
    // capillary under the splinter, blood flowing left to right
    const capMat = new THREE.MeshStandardMaterial({ color: 0xc23a48, roughness: 0.4, transparent: true, opacity: 0.55, depthWrite: false, emissive: 0x551018, emissiveIntensity: 0.4 });
    const cap = rod(-6, 6, 0.35, 0.35, capMat, 32, true); cap.position.y = -2.5; S.add(cap);
    const rbc = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 14), new THREE.MeshStandardMaterial({ color: 0xd8303c, roughness: 0.5 }), 40); rbc.instanceMatrix.setUsage(THREE.DynamicDrawUsage); S.add(rbc);
    // the splinter: a sliver of wood driven in at an angle
    const spl = rod(0, 3.6, 0.13, 0.02, new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.8 }), 8);
    spl.position.set(0, 0, 0); const splG = new THREE.Group(); splG.add(spl); spl.position.x = 1.8; splG.rotation.z = -1.05; splG.position.set(-0.6, 1.0, 0.2); S.add(splG);
    const tip = new THREE.Vector3(0.1, -1.4, 0.2);
    // bacteria (rods), neutrophils, macrophages
    const NB = 160, bact = new THREE.InstancedMesh(rodGeo(0.07, 0.2), new THREE.MeshStandardMaterial({ color: 0xb8e05a, roughness: 0.4, emissive: 0x405010, emissiveIntensity: 0.5 }), NB);
    bact.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bact.frustumCulled = false; S.add(bact);
    const bHome = Array.from({ length: NB }, (_, i) => { const a = rnd(i) * Math.PI * 2, r = Math.pow(rnd(i + 7), 0.7), y = (rnd(i + 3) - 0.5); return { dir: new THREE.Vector3(Math.cos(a) * r, y * 0.6, Math.sin(a) * r * 0.8), eat: 0, alive: false }; });
    const NN = 36, neut = [];
    for (let i = 0; i < NN; i++) { const n = makeNeutrophil(0.22); n.visible = false; S.add(n); neut.push({ g: n, k: 0, from: new THREE.Vector3(-3 + rnd(i) * 6, -2.5, (rnd(i + 2) - 0.5) * 0.3), pos: new THREE.Vector3(), target: -1, full: 0 }); }
    const macMat = new THREE.MeshPhysicalMaterial({ color: 0x8ef0ff, roughness: 0.4, transparent: true, opacity: 0.7, clearcoat: 0.4, emissive: 0x1a4a55, emissiveIntensity: 0.5 });
    const macs = [[-2.2, -1.4, 0.8], [2.0, -1.2, -0.6], [0.8, -1.9, 1.3]].map((p, i) => { const m = new THREE.Mesh(lumpyGeo(0.38, 0.18, i + 4), macMat); m.position.set(...p); S.add(m); return { m, home: new THREE.Vector3(...p) }; });
    // fluid leaking out of the capillary (the swelling)
    const NF = 80, fluid = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9ed8ff, transparent: true, opacity: 0.7 }), NF);
    fluid.instanceMatrix.setUsage(THREE.DynamicDrawUsage); fluid.frustumCulled = false; S.add(fluid);

    // ---- board
    const st = { t: 0, B: 0, N: 0, Mc: 500, I: 0, hist: [] };
    const chart = canvasTexture(1100, 460, (g, w, h) => drawChart(g, w, h, st));
    const cb = board(chart, 7, 7 * 460 / 1100); cb.position.set(1.8, 3.4, -2.2); cb.rotation.y = -0.15; S.add(cb);

    const L = (h, p, par, c) => tint(stage.label(h, p, par), c);
    const labs = [
      L('Splinter', [-2.4, 1.6, 0.3], S, 'gold'), L('Skin: the wall is broken', [-5.0, 0.2, 2.5], S, 'pink'),
      L('Capillary: widens and leaks', [-5.0, -3.0, 2.5], S, 'red'), L('Bacteria', [1.9, -0.7, 1.5], S, 'good'),
      L('Neutrophils: squeeze out and eat', [-3.4, -0.9, 2.5], S, 'purple'), L('Macrophage: guard and cleaner', [1.6, -3.3, 2.5], S, 'side'),
    ];

    // ---- the walls: skin, airway escalator, stomach acid
    const skin2 = new THREE.Group(); skin2.position.set(-5.2, 0, 0); W.add(skin2);
    for (let k = 0; k < 6; k++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 2.4), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.07, 0.45, 0.72 - k * 0.04), roughness: 0.8 })); sl.position.y = -k * 0.14; skin2.add(sl); }
    const live = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2.4), new THREE.MeshStandardMaterial({ color: 0xf0a8a0, roughness: 0.6, transparent: true, opacity: 0.5 })); live.position.y = -1.5; skin2.add(live);
    const wb = new THREE.InstancedMesh(rodGeo(0.07, 0.2), bact.material, 14); wb.instanceMatrix.setUsage(THREE.DynamicDrawUsage); wb.frustumCulled = false; W.add(wb);
    // airway: a half pipe tilted up; cilia on the floor; mucus sheet on top moving up
    const air = new THREE.Group(); air.position.set(0, -0.4, 0); air.rotation.z = 0.5; W.add(air);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 5, 40, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf2a7b6, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
    pipe.rotation.set(0, 0, 0); air.add(pipe);
    const NC = 180, cil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.35, 5), new THREE.MeshStandardMaterial({ color: 0xffe0e8, roughness: 0.5 }), NC); cil.instanceMatrix.setUsage(THREE.DynamicDrawUsage); air.add(cil);
    const cilAt = Array.from({ length: NC }, (_, i) => ({ y: -2.3 + (i % 30) * 0.16, a: Math.PI * 0.62 + (Math.floor(i / 30) / 5) * Math.PI * 0.76 }));
    const NM = 22, muc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd8e89a, roughness: 0.3, transparent: true, opacity: 0.85 }), NM); muc.instanceMatrix.setUsage(THREE.DynamicDrawUsage); air.add(muc);
    // stomach: a bowl of acid
    const sto = new THREE.Group(); sto.position.set(5.2, -0.6, 0); W.add(sto);
    sto.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8a08a, roughness: 0.55, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })));
    const acid = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40), new THREE.MeshStandardMaterial({ color: 0xd8f060, emissive: 0x607010, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, side: THREE.DoubleSide })); acid.rotation.x = -Math.PI / 2; acid.position.y = -0.25; sto.add(acid);
    const sb = new THREE.InstancedMesh(rodGeo(0.07, 0.2), new THREE.MeshStandardMaterial({ color: 0xb8e05a, transparent: true, opacity: 1, emissive: 0x405010, emissiveIntensity: 0.5 }), 10); sb.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sb.frustumCulled = false; sto.add(sb);
    const wl = [
      L('Skin: tough dead cells, pH about 5', [-5.2, -2.8, 1.0], W, 'pink'),
      L('Mucus escalator: cilia sweep germs up', [0, -3.4, 1.0], W, 'gold'), L('To the throat ↑', [-1.3, 2.9, 0.4], W, 'gold'),
      L('Stomach acid, pH 1.5–3.5: germs die', [5.2, -2.8, 1.0], W, 'good'),
    ];

    // ---- dynamics
    const o = new THREE.Object3D();
    let t = 0, hold = 0, lastScene = '', shownB = 0;
    const restart = (s) => {
      Object.assign(st, { t: 0, B: s.dose * (s.wash ? 0.1 : 1), N: 0, Mc: 500, I: 0, hist: [] });
      bHome.forEach((b) => { b.alive = false; b.eat = 0; }); neut.forEach((n) => { n.k = 0; n.g.visible = false; n.full = 0; }); hold = 0;
    };
    let sRef = null;
    const fit = fitNarrow(stage, { pos: [0.6, 7.1, 17], target: [0.4, 4.7, 0] });
    return compactReadout(stage, {
      restart: () => sRef && restart(sRef),
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; sRef = s;
        if (!st.hist.length || s._restart) { s._restart = false; restart(s); }
        const walls = s.scene === 'walls', on = s.labels && !inReel(), narrow = fit();
        if (s.scene !== lastScene) {
          if (lastScene && !inReel()) stage.setView(walls ? WALL_VIEW.pos : this_view.pos, walls ? WALL_VIEW.target : this_view.target, 0.9);
          lastScene = s.scene;
        }
        S.visible = !walls; W.visible = walls;
        // ---- splinter model
        if (st.t < T_END) { simStep(st, dt * hoursPerSec(st.t), s); if (!st.hist.length || st.t - st.hist.at(-1).t > 0.1) st.hist.push({ t: st.t, B: st.B, N: st.N }); }
        else { hold += dt; if (hold > 4) restart(s); }
        chart.redraw();
        const inf = clamp(st.I * 1.2, 0, 1), spread = 0.6 + 0.25 * Math.log10(1 + st.B);
        flushMat.opacity = 0.55 * inf; flush.scale.setScalar(0.6 + 0.3 * spread);
        dome.scale.set(0.5 + 0.2 * spread, 0.02 + 0.28 * smooth(clamp(st.N / 30000, 0, 1)), 0.5 + 0.2 * spread);
        const rCap = 1 + 0.5 * inf; cap.scale.set(1, rCap, rCap);
        capMat.emissiveIntensity = 0.4 + 0.8 * inf;
        for (let i = 0; i < 40; i++) { const x = ((rnd(i) * 12 + t * (1.6 - 0.8 * inf)) % 12) - 6; o.position.set(x, -2.5 + (rnd(i + 1) - 0.5) * 0.35 * rCap, (rnd(i + 2) - 0.5) * 0.35 * rCap); o.rotation.set(rnd(i) * 3, 0, Math.PI / 2 + rnd(i + 5)); o.scale.setScalar(1); o.updateMatrix(); rbc.setMatrixAt(i, o.matrix); }
        rbc.instanceMatrix.needsUpdate = true;
        // bacteria shown on a log scale: each extra one is roughly 10^(7/160) more in life
        const want = st.B < 1 ? 0 : Math.round(clamp(Math.log10(st.B) / 7, 0.02, 1) * NB);
        shownB = want;
        bHome.forEach((b, i) => {
          if (i < want) { b.alive = true; b.eat = 0; } else if (b.alive) { b.alive = false; b.eat = 1; }
          if (b.eat > 0) b.eat = Math.max(0, b.eat - dt * 2.2);
          const vis = b.alive || b.eat > 0;
          const p = tip.clone().addScaledVector(b.dir, 0.5 + 0.35 * spread);
          p.x += Math.sin(t * 2 + i) * 0.03; p.y += Math.cos(t * 1.7 + i) * 0.03;
          o.position.copy(p); o.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, rnd(i + 2) * 3 + t * 0.5);
          o.scale.setScalar(vis ? (b.alive ? 1 : b.eat) : 0.0001); o.updateMatrix(); bact.setMatrixAt(i, o.matrix);
        });
        bact.instanceMatrix.needsUpdate = true;
        // neutrophils: log-scaled count, each one crawls out of the capillary towards a bacterium
        const nWant = Math.round(clamp(Math.log10(1 + st.N) / 5.3, 0, 1) * NN);
        neut.forEach((n, i) => {
          if (i < nWant) n.k = Math.min(1, n.k + dt * 0.5); else n.k = Math.max(0, n.k - dt * 0.3);
          n.g.visible = n.k > 0.01;
          if (!n.g.visible) return;
          const tgtI = shownB ? (i * 7) % Math.max(1, shownB) : -1;
          const goal = tgtI >= 0 ? tip.clone().addScaledVector(bHome[tgtI].dir, 0.5 + 0.35 * spread) : tip.clone().add(new THREE.Vector3(Math.sin(i) * 1.5, -0.3, Math.cos(i) * 1.0));
          const k = smooth(n.k);
          n.pos.copy(n.from).lerp(goal, k);
          n.pos.y += Math.sin(k * Math.PI) * 0.3;
          n.g.position.copy(n.pos); n.g.rotation.y = t * 0.7 + i;
          const squeeze = n.k < 0.15 ? 0.6 + n.k * 2.6 : 1;          // squeezing through the vessel wall
          n.g.scale.set(squeeze, 1 / squeeze, 1);
          n.g.userData.shell.material.opacity = 0.35 + 0.3 * (st.B > 0 ? 1 : 0.4);
        });
        macs.forEach((mc, i) => { mc.m.position.copy(mc.home).add(new THREE.Vector3(Math.sin(t * 0.4 + i) * 0.2, 0, Math.cos(t * 0.3 + i) * 0.2)); mc.m.scale.setScalar(1 + 0.15 * clamp((st.Mc - 500) / 3000, 0, 1)); mc.m.rotation.y = t * 0.2; });
        for (let i = 0; i < NF; i++) {
          const ph = (t * 0.35 + rnd(i)) % 1, a = rnd(i + 3) * Math.PI * 2, show = inf * (rnd(i + 9) < inf ? 1 : 0);
          o.position.set(-2.5 + rnd(i) * 5, -2.5 + ph * 1.6, Math.sin(a) * (0.3 + ph * 1.5)); o.rotation.set(0, 0, 0); o.scale.setScalar(show ? 1 : 0.0001); o.updateMatrix(); fluid.setMatrixAt(i, o.matrix);
        }
        fluid.instanceMatrix.needsUpdate = true;
        labs.forEach((l) => { l.visible = on && !walls && !narrow; });
        cb.visible = !walls && (!narrow || inReel());
        // ---- walls
        for (let i = 0; i < 14; i++) { const ph = (t * 0.6 + rnd(i)) % 1, h = 2.2 * Math.abs(Math.sin(ph * Math.PI)); o.position.set(-5.2 - 1.4 + rnd(i) * 2.8, 0.15 + h * 0.6, (rnd(i + 1) - 0.5) * 2); o.rotation.set(0, 0, t + i); o.scale.setScalar(1); o.updateMatrix(); wb.setMatrixAt(i, o.matrix); }
        wb.instanceMatrix.needsUpdate = true;
        cilAt.forEach((c, i) => { const beat = Math.sin(t * 9 - c.y * 3) * 0.5; const r = 0.97; o.position.set(Math.sin(c.a) * r, c.y, Math.cos(c.a) * r); o.lookAt(0, c.y, 0); o.rotateX(Math.PI / 2 + beat); o.scale.setScalar(1); o.updateMatrix(); cil.setMatrixAt(i, o.matrix); });
        cil.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < NM; i++) { const y = ((t * 0.5 + rnd(i) * 5) % 5) - 2.5, a = Math.PI * 0.8 + rnd(i + 4) * Math.PI * 0.4; o.position.set(Math.sin(a) * 0.78, y, Math.cos(a) * 0.78); o.rotation.set(0, 0, 0); o.scale.set(1.4, 0.7, 1.4); o.updateMatrix(); muc.setMatrixAt(i, o.matrix); }
        muc.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 10; i++) { const ph = (t * 0.3 + rnd(i)) % 1; o.position.set((rnd(i) - 0.5) * 2, 1.8 - ph * 2.6, (rnd(i + 1) - 0.5) * 1.6); o.rotation.set(0, 0, t + i); o.scale.setScalar(ph < 0.8 ? 1 : Math.max(0.0001, (1 - ph) * 5)); o.updateMatrix(); sb.setMatrixAt(i, o.matrix); }
        sb.instanceMatrix.needsUpdate = true;
        wl.forEach((l) => { l.visible = on && walls && !narrow; });
      },
      readout: (s) => {
        if (s.scene === 'walls') return `<div class="big">Three walls most germs never get past</div>
          <div class="row"><span>Skin surface</span><b>dead cells, pH about 5</b></div>
          <div class="row"><span>Airway cilia</span><b>10–15 beats a second</b></div>
          <div class="row"><span>Mucus moves</span><b>several mm a minute, to the throat</b></div>
          <div class="row"><span>Stomach acid</span><b>pH 1.5–3.5</b></div>
          <small>Tears and saliva add lysozyme, an enzyme that breaks bacterial walls.</small>`;
        const lost = st.B > 1e6, won = st.B === 0 && st.t > 0.5;
        const phase = lost ? 'Infection spreading' : won ? 'Bacteria cleared: healing' : st.t < 1 ? 'Alarm raised' : 'Neutrophils pouring in';
        return `<div class="big">${phase}</div>
          <div class="row"><span>Time since the splinter</span><b>${st.t.toFixed(1)} h</b></div>
          <div class="row"><span>Bacteria</span><b>${fmtN(st.B)}</b></div>
          <div class="row"><span>Neutrophils at the spot</span><b>${fmtN(st.N)}</b></div>
          <div class="row"><span>Redness and swelling</span><b>${st.I > 0.6 ? 'strong' : st.I > 0.2 ? 'clear' : st.N > 3000 ? 'fading' : 'slight'}</b></div>
          <div class="row"><span>Body temperature</span><b>${s.fever ? '38.5 °C (fever)' : '37 °C'}</b></div>
          <small>${lost ? 'Too many to eat in time. Spreading redness, pus, fever or red streaks mean: see a doctor.' : 'Speeded up: in life this takes hours. The model is a teaching sketch, not a medical tool.'}</small>`;
      },
    });
  },
};
const this_view = { pos: [-0.6, 6.0, 13], target: [-1.2, 2.9, 0] };
const WALL_VIEW = { pos: [39.2, 5.3, 17.5], target: [39.4, 4.3, 0] };
