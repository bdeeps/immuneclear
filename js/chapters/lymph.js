// Chapter 5: lymph drainage. Blood pressure pushes fluid out of a capillary into the tissue; most is
// drawn back in at the far end, and the rest is collected by blind-ended lymph capillaries whose
// overlapping wall cells act as one-way flaps. Lymph vessels with valves carry it on, squeezed by
// the muscles around them, through a lymph node that filters out germs, and back to the blood at the
// neck. With an infection the node's lymphocytes multiply and it swells: a "swollen gland".
// Sources and numbers:
//  - Starling forces and lymph (Guyton & Hall, 14th ed., ch. 16): capillary pressure about 30–35
//    mmHg at the arterial end, about 10–15 mmHg at the venous end; plasma protein (oncotic) pull
//    about 28 mmHg. Classic estimate: about 20 L a day filtered, about 16–18 L reabsorbed, about 2–4 L
//    returned by lymph (Levick & Michel, Cardiovasc Res 87:198, 2010 argue most filtered fluid
//    actually returns as lymph; the daily lymph total, 2–4 L, is agreed);
//  - thoracic duct flow about 100 mL an hour at rest, about 120 mL an hour for all lymph together;
//    exercise can raise lymph flow 10–30 times, because squeezing muscles and valves pump it
//    (Guyton & Hall ch. 16);
//  - lymph nodes are normally under about 1 cm across; reactive nodes in an infection commonly swell
//    to 1–2 cm and feel tender (Gaddey & Riegel, Am Fam Physician 94:896, 2016);
//  - swollen glands usually go down within about 2 weeks; see a doctor if a lump lasts longer, feels
//    hard or fixed, or comes with night sweats, weight loss or a high temperature (NHS "Swollen
//    glands").
import { THREE, M, clamp, lerp, smooth, rod } from '../kit.js';
import { tint, fitNarrow, compactReadout, inReel, rnd, lumpyGeo, vtube, pathOf, rodGeo, blob } from '../immune.js';

const Y0 = 3.4;                              // the whole scene is lifted clear of the floor

export default {
  id: 'lymph',
  short: 'Lymph drainage',
  title: 'The body’s drain and filter',
  subtitle: 'Fluid leaks out of your blood all day. Lymph vessels collect it, filter it through the nodes and pour it back.',
  view: { pos: [4.4, Y0 + 4.6, 19.5], target: [3.4, Y0 + 2.0, 0] },
  learn: `<p>Your blood doesn't stay perfectly inside its pipes. In each tiny <b>capillary</b>, blood pressure pushes some watery fluid out through the thin wall into the spaces between your cells: <b>tissue fluid</b>. It brings them food and oxygen. At the far end of the capillary, where the pressure is lower, proteins in the blood pull most of it back in (see CirculationClear).</p>
    <p>But not all of it. What is left, about <b>2–4 litres a day</b>, would pile up and make you puffy. Instead it seeps into <b>lymph capillaries</b>, dead-end tubes whose wall cells overlap like flaps: fluid can get in but not out. Now it is called <b>lymph</b>.</p>
    <p>Lymph has no heart to pump it. It is squeezed along by the <b>muscles</b> around the vessels, and <b>valves</b> stop it flowing backwards, so walking and moving speed it up many times. On its way, lymph must pass through <b>lymph nodes</b>. Inside, macrophages eat germs and dead cells, and B and T cells check everything for enemies. Filtered lymph flows on into the <b>thoracic duct</b> and back into a vein near your neck. In the gut, lymph vessels also carry away fats from your food (see DigestionClear).</p>
    <p>When germs arrive at a node, its lymphocytes multiply to fight them and the node swells. That is why the "glands" in your neck feel sore and lumpy when you have a sore throat. They usually go down within about two weeks. If a lump stays longer, feels hard, or comes with fevers, night sweats or weight loss, <b>see a doctor</b>.</p>
    <p class="tip"><b>Try it:</b> slide from resting to running and watch the lymph speed up. Then add an infection and watch the node swell.</p>`,
  terms: [
    { t: 'Tissue fluid', d: 'Fluid pushed out of capillaries that bathes your cells.' },
    { t: 'Lymph capillary', d: 'A tiny dead-end lymph vessel with flap-like walls that lets fluid in but not out.' },
    { t: 'Valve', d: 'A flap inside a lymph vessel that lets lymph flow only towards the heart.' },
    { t: 'Thoracic duct', d: 'The largest lymph vessel. It empties into a vein at the base of the left side of the neck.' },
    { t: 'Swollen gland', d: 'A lymph node enlarged because its immune cells are multiplying to fight an infection.' },
    { t: 'Oedema', d: 'Swelling from fluid building up in the tissues, for example when lymph can’t drain.' },
  ],
  defaults: { move: 0.2, infect: false, labels: true },
  controls: [
    { key: 'move', type: 'range', label: 'How much you move', min: 0, max: 1, step: 0.01, ends: ['lying still', 'running'], fmt: (v) => (v < 0.15 ? 'resting' : v < 0.5 ? 'walking' : v < 0.8 ? 'brisk exercise' : 'running') },
    { key: 'infect', type: 'toggle', label: 'An infection nearby', hint: 'Bacteria in the tissue are carried to the node.' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Where does lymph come from?', options: ['The stomach', 'Fluid that leaked out of blood capillaries into the tissues', 'The lungs', 'Sweat'], answer: 1, why: 'Blood pressure pushes fluid out of capillaries. The part not drawn back in is collected by lymph vessels as lymph.' },
    { q: 'What moves lymph along, since it has no heart?', options: ['Gravity only', 'Squeezing muscles, with valves that stop it going back', 'The lungs blowing on it', 'It doesn’t move'], answer: 1, why: 'Muscles and breathing squeeze the vessels, and valves keep the flow one way. Moving about pumps lymph much faster.' },
    { q: 'Why do the glands in your neck swell when you have a sore throat?', options: ['They fill with food', 'Immune cells in the lymph nodes multiply to fight the germs', 'The bones grow', 'They fill with air'], answer: 1, why: 'Germs drain to the nearest nodes. Lymphocytes there multiply, and the node gets bigger and tender for a while.' },
  ],
  reel: [
    { ms: 5600, caption: 'Fluid leaks out of the blood all day; lymph vessels collect it, filter it through nodes and pour it back.', set: { move: 0.6, infect: true, labels: false }, view: { pos: [3.4, Y0 + 2.6, 13.5], target: [3.0, Y0 + 0.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = Y0; stage.root.add(root);
    // ---- the blood capillary: red (arterial end) to blue (venous end)
    const capG = new THREE.CylinderGeometry(0.34, 0.34, 10, 32, 20, true); capG.rotateZ(-Math.PI / 2);
    const col = []; const p = capG.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = (p.getX(i) + 5) / 10; const c = new THREE.Color(0xd8303c).lerp(new THREE.Color(0x5a5ad0), k); col.push(c.r, c.g, c.b); }
    capG.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const cap = new THREE.Mesh(capG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    root.add(cap);
    const NR = 34, rbc = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 14), new THREE.MeshStandardMaterial({ color: 0xd8303c, roughness: 0.5 }), NR); rbc.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(rbc);
    // ---- tissue cells around it
    const cellMat = new THREE.MeshStandardMaterial({ color: 0xf0b8a0, roughness: 0.6, transparent: true, opacity: 0.5, depthWrite: false, emissive: 0xc06048, emissiveIntensity: 0.7 });
    for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(lumpyGeo(0.55, 0.08, i), cellMat); c.position.set(-4.5 + (i % 7) * 1.5 + (rnd(i) - 0.5) * 0.4, i < 7 ? -1.2 : 1.0, (rnd(i + 3) - 0.5) * 1.4 + (i < 7 ? 0.3 : 0.9)); root.add(c); }
    // ---- lymph capillary (blind end at the left), then a lymph vessel with valves, a node, and onwards
    const lyMat = new THREE.MeshStandardMaterial({ color: 0x6ee7a8, roughness: 0.35, transparent: true, opacity: 0.45, depthWrite: false, emissive: 0x1f6a48, emissiveIntensity: 0.5, side: THREE.DoubleSide });
    const LC = [[-4.2, 1.9, -1.0], [-2, 2.0, -1.0], [0, 2.0, -1.0], [2, 2.05, -1.0], [4.0, 2.2, -1.0], [5.6, 2.4, -1.0], [7.0, 2.4, -1.0]];
    const lcap = vtube(LC, 0.3, lyMat, 60); root.add(lcap);
    root.add(blob([0.3, 0.3, 0.3], LC[0], lyMat, 20));
    // overlapping flap cells along the lymph capillary (drawn as little tiles)
    const flapMat = new THREE.MeshStandardMaterial({ color: 0xa8f5cc, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    for (let x = -3.8; x < 3.8; x += 0.7) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), flapMat); f.position.set(x, 1.72, -0.8); f.rotation.set(-0.4, 0, 0.35); root.add(f); }
    // valves in the collecting vessel
    const valves = [];
    for (const x of [4.6, 5.5, 6.4]) { const v = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.4, 16, 1, true), flapMat); v.rotation.z = -Math.PI / 2; v.position.set(x, 2.35, -1.0); root.add(v); valves.push(v); }
    // the lymph node: a bean, cut open to show follicles of lymphocytes
    const node = new THREE.Group(); node.position.set(8.4, 2.4, -1.0); root.add(node);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI), new THREE.MeshPhysicalMaterial({ color: 0x8ee8b8, roughness: 0.4, transparent: true, opacity: 0.35, depthWrite: false, clearcoat: 0.4, side: THREE.DoubleSide }));
    shell.scale.set(1.25, 0.85, 0.75); node.add(shell);
    const follMat = new THREE.MeshStandardMaterial({ color: 0x9a70e0, roughness: 0.5, emissive: 0x4a2a90, emissiveIntensity: 0.4 });
    const folls = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const f = blob([0.22, 0.22, 0.22], [Math.cos(a) * 0.85, Math.sin(a) * 0.52, 0.1], follMat, 16); node.add(f); folls.push(f); }
    const macMat = new THREE.MeshStandardMaterial({ color: 0x8ef0ff, roughness: 0.4, emissive: 0x1a4a55, emissiveIntensity: 0.6 });
    const nmac = [[-0.3, 0.1, 0.2], [0.3, -0.15, 0.2]].map((q, i) => { const m = new THREE.Mesh(lumpyGeo(0.2, 0.15, i + 2), macMat); m.position.set(...q); node.add(m); return m; });
    const OUT = [[9.6, 2.5, -1.0], [10.6, 3.0, -1.0], [11.6, 3.8, -1.0]];
    root.add(vtube([[9.3, 2.45, -1.0], ...OUT], 0.2, lyMat, 30));
    // ---- particles: fluid out of the capillary, into the lymph capillary, along to the node; bacteria
    const NF = 90, fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9ed8ff }), NF);
    fl.instanceMatrix.setUsage(THREE.DynamicDrawUsage); fl.frustumCulled = false; root.add(fl);
    const NL = 60, ly = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), M.glow(0x6ee7a8), NL);
    ly.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ly.frustumCulled = false; root.add(ly);
    const lyPath = pathOf([...LC.slice(1), [8.4, 2.4, -1.0], ...OUT]);
    const nodeU = (() => { let best = 0, bd = 1e9; for (let u = 0; u <= 1; u += 0.005) { const d = lyPath.at(u).distanceTo(new THREE.Vector3(8.4, 2.4, -1.0)); if (d < bd) { bd = d; best = u; } } return best; })();
    const NB = 16, bac = new THREE.InstancedMesh(rodGeo(0.07, 0.18), new THREE.MeshStandardMaterial({ color: 0xb8e05a, emissive: 0x405010, emissiveIntensity: 0.5 }), NB);
    bac.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bac.frustumCulled = false; root.add(bac);

    const L = (h, q, c) => tint(stage.label(h, q, root), c);
    const labs = [
      L('Blood capillary: pressure pushes fluid out', [-2.6, -2.2, 1.4], 'red'), L('Most is drawn back in here', [4.0, -2.2, 1.2], 'blue'),
      L('Lymph capillary: a dead end with flaps', [-3.6, 2.9, -1.0], 'lymph'), L('Valves: one way only', [5.5, 3.1, -1.0], 'lymph'),
      L('Lymph node: the filter', [8.4, 3.9, -1.0], 'node'), L('On to a neck vein', [10.6, 4.9, -1.0], 'lymph'),
    ];
    const swollenL = L('Swollen: lymphocytes multiplying', [8.4, 0.7, -0.4], 'purple');

    const o = new THREE.Object3D();
    let t = 0, lyT = 0, sw = 0, bacK = 0;
    const fit = fitNarrow(stage, { pos: [3.6, Y0 + 2.2, 22], target: [3.6, Y0 + 1.0, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const on = s.labels && !inReel(), narrow = fit();
        const flowK = 1 + 14 * s.move;                        // lymph flow multiplier (Guyton: up to 10–30×)
        lyT += dt * (0.05 + 0.03 * Math.sqrt(flowK));           // shown compressed, not to scale
        for (let i = 0; i < NR; i++) { const x = ((rnd(i) * 10 + t * 1.8) % 10) - 5; o.position.set(x, (rnd(i + 1) - 0.5) * 0.3, (rnd(i + 2) - 0.5) * 0.3); o.rotation.set(rnd(i) * 3, 0, Math.PI / 2); o.scale.setScalar(1); o.updateMatrix(); rbc.setMatrixAt(i, o.matrix); }
        rbc.instanceMatrix.needsUpdate = true;
        // tissue fluid: out at the arterial (left) end; most back in at the venous (right) end; some up into the lymph capillary
        for (let i = 0; i < NF; i++) {
          const ph = (t * 0.25 + rnd(i)) % 1, x0 = -4.6 + rnd(i + 4) * 5.2, toLymph = rnd(i + 7) < 0.3;
          let q;
          if (toLymph) q = new THREE.Vector3(x0 + ph * 1.2, lerp(0.3, 1.75, smooth(ph)), lerp(0.2, -0.95, smooth(ph)));
          else { const up = ph < 0.5, k = up ? ph * 2 : (ph - 0.5) * 2; const x = x0 + 4.0 * ph; const r = up ? lerp(0.35, 1.0, smooth(k)) : lerp(1.0, 0.35, smooth(k)); const a = rnd(i + 2) * Math.PI * 2; q = new THREE.Vector3(x, Math.sin(a) * r, Math.cos(a) * r * 0.8); }
          o.position.copy(q); o.rotation.set(0, 0, 0); o.scale.setScalar(ph > 0.96 ? 0.0001 : 1); o.updateMatrix(); fl.setMatrixAt(i, o.matrix);
        }
        fl.instanceMatrix.needsUpdate = true;
        // lymph drops along the vessel; muscles squeeze the vessel harder when you move
        for (let i = 0; i < NL; i++) { const u = (lyT + i / NL) % 1; lyPath.at(u, o.position); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); ly.setMatrixAt(i, o.matrix); }
        ly.instanceMatrix.needsUpdate = true;
        valves.forEach((v, i) => { v.scale.set(1, 1 + 0.25 * s.move * Math.sin(t * 6 + i), 1 + 0.25 * s.move * Math.sin(t * 6 + i)); });
        lcap.scale.set(1, 1, 1);
        // infection: bacteria drift into the lymph and are caught in the node; the node swells
        sw = s.infect ? Math.min(1, sw + dt * 0.25) : Math.max(0, sw - dt * 0.25);
        bacK = s.infect ? 1 : 0;
        for (let i = 0; i < NB; i++) {
          const u = ((lyT * 0.9 + i / NB) % 1) * nodeU;
          if (bacK) lyPath.at(u, o.position); else o.position.set(0, -99, 0);
          o.rotation.set(0, t + i, t * 0.5); o.scale.setScalar(bacK && u < nodeU * 0.97 ? 1 : 0.0001); o.updateMatrix(); bac.setMatrixAt(i, o.matrix);
        }
        bac.instanceMatrix.needsUpdate = true;
        node.scale.setScalar(1 + 0.7 * smooth(sw));
        folls.forEach((f, i) => { f.scale.setScalar(0.22 * (1 + 0.8 * smooth(sw)) * (1 + 0.08 * Math.sin(t * 3 + i))); });
        follMat.emissiveIntensity = 0.4 + 0.6 * sw;
        nmac.forEach((m, i) => { m.rotation.y = t + i; });
        labs.forEach((l) => { l.visible = on && !narrow; });
        swollenL.visible = on && !narrow && sw > 0.3;
      },
      readout: (s) => {
        const flowK = 1 + 14 * s.move, flow = 120 * flowK;
        const size = (0.8 * (1 + 0.9 * smooth(sw))).toFixed(1);
        return `<div class="big">${s.infect ? (sw > 0.6 ? 'Swollen gland: the node is fighting' : 'Germs reach the node') : 'Draining quietly'}</div>
          <div class="row"><span>Leaks out of capillaries</span><b>about 20 L a day</b></div>
          <div class="row"><span>Returned as lymph</span><b>about 2–4 L a day</b></div>
          <div class="row"><span>Lymph flow now</span><b>about ${flow >= 1000 ? (flow / 1000).toFixed(1) + ' L' : Math.round(flow) + ' mL'} an hour</b></div>
          <div class="row"><span>Lymph node size</span><b>about ${size} cm${sw > 0.6 ? ', tender' : ''}</b></div>
          <small>${s.infect ? 'Swollen glands usually settle within about 2 weeks. A lump that stays, feels hard, or comes with fevers or weight loss: see a doctor.' : 'Moving your muscles is the lymph pump: flow can rise 10 to 30 times with exercise.'}</small>`;
      },
    });
  },
};
