// Chapter 3: learning the enemy (adaptive immunity), inside a lymph node. A dendritic cell catches
// a virus and shows pieces of it (antigen) to helper T cells; the one helper T cell whose receptor
// fits is switched on and calls in the others. Of many B cells, only the one whose receptor fits the
// antigen (lock and key) is chosen; it multiplies into plasma cells that pour out Y-shaped
// antibodies, which coat the viruses. Killer T cells find body cells the virus has taken over and
// make them self-destruct. The board shows antibody levels against days: the slow first (primary)
// response and the fast, big second (secondary) response.
// Sources and numbers:
//  - Murphy & Weaver, Janeway's Immunobiology, 9th ed., ch. 1, 6, 9–11; Abbas, Lichtman & Pillai,
//    Cellular and Molecular Immunology, 10th ed., ch. 12;
//  - each B or T cell carries one kind of receptor; together they can recognise more than 10¹¹
//    (hundreds of billions) different shapes, made by shuffling gene pieces (V(D)J recombination;
//    Tonegawa, Nobel Prize 1987); the "one cell, one receptor, the matching one multiplies" idea is
//    Burnet's clonal selection theory (1957);
//  - a plasma cell can release roughly 2,000 antibody molecules a second (Helmreich et al., 1961,
//    cited in Janeway); an antibody is about 10–15 nm across and has two identical binding tips;
//  - an activated lymphocyte divides every 6–8 hours for about a week, so one cell becomes thousands
//    (Janeway ch. 9);
//  - primary response: antibodies detectable after about 5–7 days (IgM first), peak around 1–3
//    weeks; secondary response: within 1–3 days, about 10–100 times higher, mostly IgG (Janeway
//    ch. 11, fig. 11.x; Abbas fig. 12–2). The curve here is a smooth sketch of that textbook shape.
import { THREE, M, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { board, panel, tint, fitNarrow, compactReadout, inReel, rnd, virusGeo, antibodyGeo, lumpyGeo, dendriticGeo, antibody, abTotal } from '../immune.js';

const STEPS = [
  { v: 1, label: '1 Catch', title: 'A dendritic cell catches the virus' },
  { v: 2, label: '2 Show', title: 'It shows the pieces to a helper T cell' },
  { v: 3, label: '3 Antibodies', title: 'The matching B cell makes antibodies' },
  { v: 4, label: '4 Kill', title: 'Killer T cells destroy infected cells' },
];
const STEP_S = 6.5, MATCH = 2;
const DAYS = 30;

function drawAb(g, w, h, st) {
  panel(g, w, h);
  const L = 74, R = w - 24, top = 74, bot = h - 48, lmax = 4;
  const X = (d) => L + (d / DAYS) * (R - L), Y = (v) => bot - clamp(v / lmax, 0, 1) * (bot - top);
  g.fillStyle = '#e8eef8'; g.font = 'bold 28px sans-serif'; g.fillText('Antibody level after meeting a germ', L, 42);
  g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
  [0, 1, 2, 3, 4].forEach((v) => { g.fillText(['1×', '10×', '100×', '1,000×', '10,000×'][v], 6, Y(v) + 7); g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(L + 10, Y(v)); g.lineTo(R, Y(v)); g.stroke(); });
  [0, 7, 14, 21, 28].forEach((d) => g.fillText('day ' + d, X(d) - 22, h - 16));
  const curve = (mem, col, wdt) => { g.strokeStyle = col; g.lineWidth = wdt; g.beginPath(); for (let d = 0; d <= DAYS; d += 0.25) { const y = Y(abTotal(d, mem)); d ? g.lineTo(X(d), y) : g.moveTo(X(d), y); } g.stroke(); g.lineWidth = 1; };
  curve(false, '#ffd166', 5);
  if (st.second) curve(true, '#6ee7a8', 5);
  g.font = 'bold 20px sans-serif'; g.fillStyle = '#ffd166'; g.fillText('first meeting', X(15), Y(abTotal(15, false)) - 16);
  if (st.second) { g.fillStyle = '#6ee7a8'; g.fillText('second meeting (memory)', X(7), Y(3.7) - 6); }
  const x = X(st.day); g.strokeStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke();
  [[false, '#ffd166'], ...(st.second ? [[true, '#6ee7a8']] : [])].forEach(([m, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, Y(abTotal(st.day, m)), 9, 0, 7); g.fill(); });
}

export default {
  id: 'adaptive',
  short: 'Learning the enemy',
  title: 'Learning the enemy',
  subtitle: 'T cells and B cells learn one germ’s exact shape and build weapons made for it.',
  view: { pos: [1.2, 5.4, 15.5], target: [-0.6, 4.2, 0] },
  learn: `<p>The first responders fight any germ the same way. The <b>adaptive</b> immune system is slower, but it learns the exact shape of <b>this</b> germ, and it remembers. Its soldiers are two kinds of <b>lymphocytes</b>: <b>T cells</b> and <b>B cells</b>. They meet the enemy in your lymph nodes.</p>
    <p><b>1. Catch.</b> A <b>dendritic cell</b>, a scout with long arms, grabs a virus, chops it up and carries the pieces to the nearest lymph node. A piece of a germ that the immune system can recognise is called an <b>antigen</b>.</p>
    <p><b>2. Show.</b> The dendritic cell holds up the antigen for <b>helper T cells</b> to check. You have millions of different T and B cells, each with a receptor of <b>one</b> shape. The one whose receptor fits is switched on and sends out chemical orders.</p>
    <p><b>3. Antibodies.</b> The helper T cell wakes the one <b>B cell</b> whose receptor fits the antigen, like a key in a lock. It multiplies into thousands of <b>plasma cells</b>, each pouring out about 2,000 <b>antibodies</b> a second. An antibody is a tiny <b>Y</b>: its two tips grab the germ, which blocks it and marks it for eater cells.</p>
    <p><b>4. Kill.</b> Viruses hide inside your own cells. <b>Killer T cells</b> spot infected cells by the virus pieces on their surface and make them self-destruct, virus and all.</p>
    <p>All this takes about a week the first time, which is why you feel ill for days. The second time, memory makes it far faster.</p>
    <p class="tip"><b>Try it:</b> step through 1 to 4, and watch which B cell's receptor fits. Then switch on "Meet it again" to compare the two responses.</p>`,
  terms: [
    { t: 'Adaptive immunity', d: 'Defence that learns the exact shape of each germ and remembers it.' },
    { t: 'Antigen', d: 'A piece of a germ (or anything foreign) that immune receptors and antibodies recognise.' },
    { t: 'Dendritic cell', d: 'A scout cell that catches germs and shows their antigens to T cells in a lymph node.' },
    { t: 'Helper T cell', d: 'A T cell that, once switched on, gives orders to B cells and killer T cells.' },
    { t: 'B cell', d: 'A lymphocyte that, when its receptor fits an antigen, becomes a plasma cell making antibodies.' },
    { t: 'Antibody', d: 'A Y-shaped protein whose two tips lock onto one antigen shape.' },
    { t: 'Killer T cell', d: 'A T cell that destroys body cells infected by a virus (a cytotoxic T cell).' },
  ],
  defaults: { step: 1, auto: true, second: false, labels: true },
  controls: [
    { key: 'step', type: 'seg', label: 'Step', options: STEPS.map((x) => ({ v: x.v, label: x.label })), fmt: (v) => STEPS[v - 1].title },
    { key: 'auto', type: 'toggle', label: 'Play the steps in turn' },
    { key: 'second', type: 'toggle', label: 'Meet it again (memory)', hint: 'Adds the second response to the board.' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  onChange(s, key) { if (key === 'step') s._stepAt = null; },
  quiz: [
    { q: 'What does a dendritic cell do?', options: ['Makes antibodies', 'Catches germs and shows their pieces to T cells', 'Carries oxygen', 'Kills infected cells'], answer: 1, why: 'Dendritic cells are scouts. They carry antigen from the battle to the lymph node and present it to T cells.' },
    { q: 'Why does only one of the B cells make antibodies against this virus?', options: ['It is the oldest', 'Only its receptor fits the virus’s antigen, like a key in a lock', 'It is nearest the heart', 'All B cells make the same antibody'], answer: 1, why: 'Each B cell has a receptor of one shape. Only the one that fits is chosen to multiply: that is clonal selection.' },
    { q: 'How does the second response to the same germ compare with the first?', options: ['Slower and weaker', 'The same', 'Faster and much bigger', 'There is no second response'], answer: 2, why: 'Memory cells start it within a day or two, and antibody levels climb about 10 to 100 times higher.' },
  ],
  reel: [
    { ms: 5400, caption: 'A dendritic cell catches the virus and shows its pieces to a helper T cell in a lymph node.', set: { step: 2, auto: false, second: false, labels: false }, act: (s) => { s._stepAt = null; }, view: { pos: [-1.4, 4.8, 9.5], target: [-2.4, 4.2, 0] }, spin: 0 },
    { ms: 5600, caption: 'Only the B cell whose receptor fits makes antibodies: Y-shaped proteins that lock onto the virus.', set: { step: 3, auto: false, second: true, labels: false }, act: (s) => { s._stepAt = null; }, view: { pos: [2.2, 5.0, 13], target: [1.2, 4.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 4.2; stage.root.add(root);   // lifted clear of the floor
    const mat = (c, op = 0.85, ei = 0.35) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, clearcoat: 0.4, transparent: op < 1, opacity: op, emissive: c, emissiveIntensity: ei, depthWrite: op >= 1 });
    // a faint lymph-node backdrop
    const bg = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ color: 0x6ee7a8, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.BackSide }));
    bg.scale.set(9, 5.2, 3.5); bg.position.set(0.8, -0.2, -1.5); root.add(bg);

    // ---- cells
    const dcMat = mat(0xffb547, 1, 0.3);
    const dc = new THREE.Mesh(dendriticGeo(0.55, 12, 3), dcMat); root.add(dc);
    const th = new THREE.Mesh(lumpyGeo(0.5, 0.05, 1), mat(0x7f9cff, 1, 0.25)); th.position.set(-1.2, 0.5, 0); root.add(th);
    const tk = new THREE.Mesh(lumpyGeo(0.5, 0.05, 5), mat(0x6ee7a8, 1, 0.25)); root.add(tk);
    const TK_HOME = new THREE.Vector3(2.4, -2.9, 0.4);
    // B cells, each with a differently shaped receptor on top; index MATCH has the triangle that fits
    const shapes = [new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.SphereGeometry(0.12, 12, 8), new THREE.CylinderGeometry(0.15, 0.15, 0.14, 3), new THREE.TorusGeometry(0.1, 0.04, 8, 16), new THREE.OctahedronGeometry(0.14)];
    const bMat = (i) => mat(i === MATCH ? 0xff9fc0 : 0xe8b0c8, 1, 0.2);
    const bcells = shapes.map((geo, i) => {
      const g = new THREE.Group(); g.position.set(-2.8 + i * 1.25, -2.0, 0);
      const c = new THREE.Mesh(lumpyGeo(0.42, 0.05, i + 9), bMat(i)); g.add(c);
      const rec = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.2 })); rec.position.y = 0.56; if (i === 2) rec.rotation.x = Math.PI / 2; g.add(rec);
      root.add(g); return { g, c, rec };
    });
    // clones of the matching B cell → plasma cells
    const clones = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(lumpyGeo(0.3, 0.05, i + 20), mat(0xff9fc0, 1, 0.5)); m.visible = false; root.add(m); return m; });
    const cloneAt = (i) => { const a = (i / 6) * Math.PI * 2; return new THREE.Vector3(1.6 + Math.cos(a) * 0.95, -0.2 + Math.sin(a) * 0.75, 0.2); };
    // antigen pieces: small red triangles, first on the dendritic cell
    const agGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 3); agGeo.rotateX(Math.PI / 2);
    const ags = Array.from({ length: 5 }, () => { const m = new THREE.Mesh(agGeo, M.glow(0xff5a6a)); root.add(m); return m; });
    // viruses
    const NV = 9, vir = new THREE.InstancedMesh(virusGeo(0.2, 16), new THREE.MeshStandardMaterial({ color: 0xff5a6a, roughness: 0.4, emissive: 0x551018, emissiveIntensity: 0.6 }), NV);
    vir.instanceMatrix.setUsage(THREE.DynamicDrawUsage); vir.frustumCulled = false; root.add(vir);
    const vHome = Array.from({ length: NV }, (_, i) => new THREE.Vector3(3.9 + (rnd(i) - 0.3) * 2.4, 0.6 + (rnd(i + 3) - 0.5) * 2.0, (rnd(i + 6) - 0.5) * 1.2));
    // antibodies (Y shapes)
    const NA = 42, abm = new THREE.InstancedMesh(antibodyGeo(0.16), new THREE.MeshStandardMaterial({ color: 0xffe08a, roughness: 0.35, emissive: 0x806010, emissiveIntensity: 0.6 }), NA);
    abm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); abm.frustumCulled = false; root.add(abm);
    // an infected body cell, with viruses budding from it
    const inf = new THREE.Mesh(lumpyGeo(0.8, 0.04, 7), mat(0xd9a0a8, 0.6, 0.15)); const INF = new THREE.Vector3(4.6, -2.3, 0); inf.position.copy(INF); root.add(inf);
    const infV = new THREE.InstancedMesh(virusGeo(0.12, 12), vir.material, 6); infV.instanceMatrix.setUsage(THREE.DynamicDrawUsage); infV.frustumCulled = false; root.add(infV);
    const frag = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 0), mat(0xd9a0a8, 0.8, 0.1), 14); frag.instanceMatrix.setUsage(THREE.DynamicDrawUsage); frag.frustumCulled = false; root.add(frag);
    // chemical orders from the helper T cell (cytokines)
    const NS = 30, sig = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), M.glow(0x9db4ff), NS); sig.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sig.frustumCulled = false; root.add(sig);

    // ---- board
    const st = { day: 0, second: false };
    const chart = canvasTexture(1100, 520, (g, w, h) => drawAb(g, w, h, st));
    const cb = board(chart, 5.4, 5.4 * 520 / 1100); cb.position.set(4.3, 3.5, -1.2); cb.rotation.y = -0.12; root.add(cb);

    const L = (h, p, c) => tint(stage.label(h, p, root), c);
    const labs = {
      dc: L('Dendritic cell: the scout', [-4.6, 1.2, 0.5], 'gold'), th: L('Helper T cell', [-1.2, 1.35, 0.4], 'blue'),
      b: L('B cells: each receptor a different shape', [-0.3, -3.0, 0.5], 'pink'), fit: L('This one fits!', [-1.1, -1.0, 0.6], 'pink'),
      pc: L('Plasma cells: antibody factories', [3.4, -0.9, 0.6], 'pink'), v: L('Virus', [5.6, 1.9, 0.3], 'red'),
      tk: L('Killer T cell', [2.4, -3.8, 0.4], 'good'), inf: L('Infected cell', [5.8, -3.3, 0.3], 'red'),
    };

    const o = new THREE.Object3D();
    let t = 0, stepT = 0, cyc = 0;
    const fit = fitNarrow(stage, { pos: [0.8, 4.4, 15.5], target: [0.8, 3.8, 0] });
    const DC_FAR = new THREE.Vector3(-4.8, 0.2, 0.2), DC_NEAR = new THREE.Vector3(-2.1, 0.35, 0.2);
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (s._stepAt == null) { s._stepAt = t; }
        stepT = t - s._stepAt;
        if (s.auto && stepT > STEP_S) { s.step = (s.step % 4) + 1; s._stepAt = t; stepT = 0; }
        const k = s.step, e = smooth(clamp(stepT / 2.2, 0, 1));
        const on = s.labels && !inReel(), narrow = fit();
        // day cursor sweeps the board continuously
        cyc += dt; st.day = (cyc * 1.6) % DAYS; st.second = s.second; chart.redraw();

        // dendritic cell: catches (1), carries to the helper T cell (2+)
        const dcP = k === 1 ? DC_FAR.clone().add(new THREE.Vector3(-1.5 * (1 - e), 0, 0)) : k === 2 ? DC_FAR.clone().lerp(DC_NEAR, e) : DC_NEAR.clone();
        dc.position.copy(dcP); dc.rotation.y = t * 0.3; dc.rotation.z = Math.sin(t * 0.7) * 0.1;
        // antigen triangles on the dendritic cell's surface (appear once caught)
        const caught = k > 1 || stepT > 1.8;
        ags.forEach((m, i) => {
          const a = i * 1.26 + t * 0.3; m.visible = caught;
          m.position.copy(dc.position).add(new THREE.Vector3(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.25));
          if (k >= 2 && i === 0) m.position.copy(dc.position).lerp(th.position, 0.5 * e);
          m.rotation.z = a;
        });
        // helper T cell: switched on in step 2 and after
        const thOn = k >= 3 || (k === 2 && stepT > 2.2);
        th.material.emissiveIntensity = thOn ? 0.6 + 0.3 * Math.sin(t * 6) : 0.25;
        th.scale.setScalar(thOn ? 1.1 : 1);
        for (let i = 0; i < NS; i++) {
          const ph = (t * 0.6 + rnd(i)) % 1, tgt = i % 3 === 0 ? tk.position : bcells[MATCH].g.position;
          const p = th.position.clone().lerp(tgt, ph); p.y += Math.sin(ph * Math.PI) * 0.5 * (rnd(i + 1) - 0.3);
          o.position.copy(p); o.rotation.set(0, 0, 0); o.scale.setScalar(thOn ? 1 : 0.0001); o.updateMatrix(); sig.setMatrixAt(i, o.matrix);
        }
        sig.instanceMatrix.needsUpdate = true;
        // B cells: all try the antigen in step 3; only MATCH lights up and clones
        bcells.forEach((b, i) => {
          const chosen = i === MATCH && k >= 3;
          b.c.material.emissiveIntensity = chosen ? 0.55 + 0.25 * Math.sin(t * 5) : k === 3 && stepT < 1.5 ? 0.35 : 0.15;
          b.rec.material.emissiveIntensity = chosen ? 1 : 0.2;
          b.g.scale.setScalar(chosen ? 1.15 : 1);
          b.rec.rotation.y = t * (chosen ? 0 : 0.6);
        });
        const cloneK = k >= 3 ? clamp((stepT - (k === 3 ? 1.0 : -9)) / 1.5, 0, 1) : 0;
        clones.forEach((m, i) => { m.visible = cloneK > 0; m.position.copy(bcells[MATCH].g.position).lerp(cloneAt(i), smooth(cloneK)); m.material.emissiveIntensity = 0.4 + 0.2 * Math.sin(t * 4 + i); });
        // antibodies stream from the plasma cells to the viruses and stick
        const abOn = k >= 3 && (k > 3 || stepT > 2.2);
        const coat = k === 4 ? 1 : clamp((stepT - 2.2) / 3.5, 0, 1);
        for (let i = 0; i < NA; i++) {
          const vi = i % NV, from = cloneAt(i % 6), ph = abOn ? clamp(coat * 1.6 - (i / NA) * 0.6, 0, 1) : 0;
          const vp = vHome[vi].clone().add(new THREE.Vector3(Math.sin(t * 0.8 + vi) * 0.1, Math.cos(t * 0.6 + vi) * 0.1, 0));
          const off = new THREE.Vector3(Math.cos(i * 2.4), Math.sin(i * 2.4), Math.sin(i * 1.3) * 0.5).normalize();
          const end = vp.clone().addScaledVector(off, 0.42);
          o.position.copy(from).lerp(end, smooth(ph));
          o.lookAt(vp); o.rotateX(-Math.PI / 2);             // tips (+y) towards the virus
          o.scale.setScalar(abOn && ph > 0 ? 1 : 0.0001); o.updateMatrix(); abm.setMatrixAt(i, o.matrix);
        }
        abm.instanceMatrix.needsUpdate = true;
        const vDim = abOn ? coat : 0;
        vir.material.emissiveIntensity = 0.6 * (1 - 0.7 * vDim);
        for (let i = 0; i < NV; i++) {
          const vp = vHome[i].clone().add(new THREE.Vector3(Math.sin(t * 0.8 + i) * 0.1, Math.cos(t * 0.6 + i) * 0.1, 0));
          let sc = 1;
          if (k === 1 && i === 0) { vp.lerp(DC_FAR.clone().add(new THREE.Vector3(-1.5 * (1 - e), 0, 0)), smooth(clamp(stepT / 1.8, 0, 1))); sc = stepT > 1.8 ? 0.0001 : 1; }
          if (k > 1 && i === 0) sc = 0.0001;
          if (k === 1 && i === 0 && stepT < 0.01) vp.copy(vHome[0]);
          o.position.copy(vp); o.rotation.set(t * 0.3 + i, t * 0.2, 0); o.scale.setScalar(sc); o.updateMatrix(); vir.setMatrixAt(i, o.matrix);
        }
        vir.instanceMatrix.needsUpdate = true;
        // killer T cell and the infected cell
        const killK = k === 4 ? clamp(stepT / 2.0, 0, 1) : 0, burst = k === 4 ? clamp((stepT - 2.3) / 1.5, 0, 1) : 0;
        tk.position.copy(TK_HOME).lerp(INF.clone().add(new THREE.Vector3(-1.15, -0.2, 0.2)), smooth(killK));
        tk.material.emissiveIntensity = k === 4 ? 0.5 + 0.4 * Math.sin(t * 8) : k >= 3 ? 0.4 : 0.2;
        inf.scale.setScalar(Math.max(0.0001, 1 - 0.85 * smooth(burst)));
        inf.material.opacity = 0.6 * (1 - 0.6 * burst);
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 0.2; o.position.copy(INF).add(new THREE.Vector3(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0.2)); o.rotation.set(t, i, 0); o.scale.setScalar(burst > 0.2 ? 0.0001 : 1); o.updateMatrix(); infV.setMatrixAt(i, o.matrix); }
        infV.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 14; i++) { const d = new THREE.Vector3(rnd(i) - 0.5, rnd(i + 1) - 0.5, rnd(i + 2) - 0.5).normalize(); o.position.copy(INF).addScaledVector(d, 0.3 + 0.9 * burst); o.rotation.set(i, t, 0); o.scale.setScalar(burst > 0.05 ? 1 - 0.5 * burst : 0.0001); o.updateMatrix(); frag.setMatrixAt(i, o.matrix); }
        frag.instanceMatrix.needsUpdate = true;
        // labels
        Object.values(labs).forEach((l) => { l.visible = on && !narrow; });
        labs.fit.visible = on && !narrow && k >= 3;
        labs.pc.visible = on && !narrow && k >= 3;
        cb.visible = !narrow || inReel();
      },
      readout: (s) => {
        const d = st.day, a1 = abTotal(d, false), a2 = abTotal(d, true), ab = antibody(d, false);
        return `<div class="big">${STEPS[s.step - 1].title}</div>
          <div class="row"><span>Board: day</span><b>${d.toFixed(0)}</b></div>
          <div class="row"><span>First meeting: antibody level</span><b>${a1 < 0.05 ? 'none yet' : a1 < 0.3 ? 'just starting' : 'about ' + Math.round(Math.pow(10, a1)).toLocaleString('en-IN') + '×'}${ab.igm > ab.igg && a1 > 0.05 ? ' (mostly IgM)' : ''}</b></div>
          ${s.second ? `<div class="row"><span>Second meeting</span><b>${a2 < 0.05 ? 'none yet' : 'about ' + Math.round(Math.pow(10, a2)).toLocaleString('en-IN') + '×'}</b></div>` : ''}
          <div class="row"><span>Different receptors you can make</span><b>more than 100 billion</b></div>
          <div class="row"><span>Antibodies per plasma cell</span><b>about 2,000 a second</b></div>
          <small>Antibody levels are relative to the smallest amount a lab test can find. A sketch of the textbook curves.</small>`;
      },
    });
  },
};
