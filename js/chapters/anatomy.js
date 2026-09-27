// Chapter 1: the immune system's "hardware" in a ghosted body. The lymph vessels and about 600 lymph
// nodes, the two lymph ducts that empty into the big neck veins, the thymus, spleen, tonsils and
// adenoid, Peyer's patches and the appendix in the gut, and the red bone marrow where every white
// cell is born. Explode slides the lymphoid organs one way and the marrow the other.
// Numbers:
//  - about 600 lymph nodes (500–700) (Britannica "Lymph node"; Cleveland Clinic "Lymph nodes");
//  - 4,000–11,000 white cells per microlitre of blood (Guyton & Hall, 14th ed., ch. 34; MedlinePlus);
//  - the marrow releases about 100 billion neutrophils a day (Summers et al., Trends Immunol 31:318,
//    2010);
//  - about 2–3 L of lymph a day returns to the blood (Guyton & Hall ch. 16);
//  - spleen about 11–12 cm long, about 150 g; thymus largest around puberty, about 30–40 g (Gray's
//    Anatomy, 42nd ed.; Britannica "Spleen", "Thymus"); the spleen gets about 5% of cardiac output;
//    only about 2–5% of young T cells survive selection in the thymus (Janeway's Immunobiology, 9th ed., ch. 8).
import { THREE } from '../kit.js';
import { makeBody, sideLabels, fitNarrow, compactReadout, inReel, tint } from '../immune.js';
import { toast } from '../ui.js';

const ROUTES = ['legL', 'armR', 'headL', 'gut', 'legR', 'armL', 'headR'];

export default {
  id: 'anatomy',
  short: 'The defence network',
  title: 'An army spread through your body',
  subtitle: 'Lymph vessels and nodes, the thymus, spleen, tonsils and bone marrow.',
  view: { pos: [-2.4, 9.6, 23], target: [-4.5, 9.2, 0] },
  learn: `<p>Your <b>immune system</b> is not one organ. It is an army of cells and a network of places where they are made, trained and gather. We are facing the person, so their <b>right</b> side is on <b>your left</b>.</p>
    <p>Every immune cell is born in the <b>red bone marrow</b>, inside the hip bones, breastbone and spine. The marrow makes about <b>100 billion</b> white cells a day (see SkeletonClear for bones). Some of them, the <b>T cells</b>, travel to the <b>thymus</b>, a small organ behind your breastbone, to be trained. It is biggest around puberty and then slowly shrinks.</p>
    <p>Threading through the whole body is a second set of pipes beside the blood vessels: the <b>lymphatic system</b>. Thin <b>lymph vessels</b> collect clear fluid, called <b>lymph</b>, that leaks out of the blood. On its way back, lymph passes through about <b>600 lymph nodes</b>, bean-shaped filters packed in your neck, armpits, belly and groin. Two ducts pour it back into big veins near your neck (see CirculationClear).</p>
    <p>Guard posts sit where germs get in. The <b>tonsils</b> and <b>adenoid</b> watch your mouth and nose. <b>Peyer's patches</b> watch your gut, where trillions of friendly microbes live (see DigestionClear). The <b>spleen</b>, under your left ribs, filters the blood itself.</p>
    <p class="tip"><b>Try it:</b> turn X-ray off and on, then take it apart to see the organs and the marrow side by side. Click the spleen or the marrow.</p>`,
  terms: [
    { t: 'Immune system', d: 'The cells, organs and chemicals that protect you from germs and repair damage.' },
    { t: 'White blood cell', d: 'Any immune cell (leukocyte). You have about 4,000–11,000 in every microlitre of blood.' },
    { t: 'Lymph', d: 'Clear fluid that leaks from the blood into the tissues and is carried back by lymph vessels.' },
    { t: 'Lymph node', d: 'A bean-shaped filter on the lymph vessels where immune cells meet germs.' },
    { t: 'Thymus', d: 'An organ behind the breastbone where T cells learn to attack germs but not you.' },
    { t: 'Spleen', d: 'An organ under the left ribs that filters the blood and removes old red cells.' },
    { t: 'Bone marrow', d: 'Soft tissue inside bones where all blood cells, including immune cells, are made.' },
  ],
  defaults: { explode: 0, xray: true, flow: true, labels: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'marrow | organs'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: see through the skin' },
    { key: 'flow', type: 'toggle', label: 'Show lymph flowing' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Where are all your immune cells born?', options: ['In the lymph nodes', 'In the red bone marrow', 'In the spleen', 'In the stomach'], answer: 1, why: 'Every white blood cell starts in the red bone marrow. Some then mature elsewhere, like T cells in the thymus.' },
    { q: 'What do lymph nodes do?', options: ['Pump blood', 'Filter lymph so immune cells can meet germs', 'Make hormones', 'Store fat'], answer: 1, why: 'Lymph flows through the nodes on its way back to the blood. Immune cells inside them catch and study germs.' },
    { q: 'Where does lymph finally go?', options: ['Out through the skin', 'Into the gut', 'Back into big veins near the neck', 'Into the lungs'], answer: 2, why: 'The thoracic duct and the right lymphatic duct empty lymph into the veins where the neck and arm veins meet.' },
  ],
  reel: [
    { ms: 5200, caption: 'Your immune system is an army of cells spread through a hidden network of vessels and organs.', set: { explode: 0, xray: true, flow: true, labels: false }, view: { pos: [0.5, 9.8, 22], target: [0, 9.4, 0] }, spin: 0.5 },
    { ms: 5400, caption: 'Immune cells are born in the bone marrow, trained in the thymus, and gather in about 600 lymph nodes.', set: { explode: 0, xray: true, flow: false, labels: false }, anim: { explode: [0, 1] }, view: { pos: [0.3, 10.2, 22], target: [0, 10.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage);
    root.add(body.root);
    const sides = sideLabels(stage, root, 2.6, 3.1, 1.4);
    const O = body.organ;
    stage.pickables.push(O.spleen, O.thymus, O.tonsils, O.gut, ...body.marrow);
    const partL = [tint(stage.label('Where immune cells are born: red marrow', [-3.3, 16.4, 0.3], root), 'marrow'), tint(stage.label('Lymphoid organs: thymus, tonsils, spleen, Peyer’s patches', [3.3, 17.2, 0.3], root), 'thymus')];
    let xr = 1, t = 0, lastToast = -9, next = 0, k = 0;
    const fit = fitNarrow(stage, { pos: [0, 15, 22.3], target: [0, 14.5, 0] });
    return compactReadout(stage, {
      pick(o) {
        if (t - lastToast < 1) return; lastToast = t;
        const inO = (g) => g === o || g.children?.includes(o);
        if (o === O.spleen) toast('About 5% of the blood your heart pumps flows through the spleen, which catches germs and old red cells. <a href="/circulationclear/">See the blood in CirculationClear</a>.');
        else if (inO(O.thymus)) toast('The thymus trains T cells. Only a few in every 100 pass the test of attacking germs but not you.');
        else if (inO(O.tonsils)) toast('Tonsils sample everything you breathe in and swallow. They often swell when you have a sore throat.');
        else if (inO(O.gut)) toast('Peyer’s patches watch the gut wall, next to trillions of friendly microbes. <a href="/digestionclear/">See DigestionClear</a>.');
        else toast('Red marrow fills the hip bones, breastbone and spine in adults. <a href="/skeletonclear/">See SkeletonClear</a>.');
      },
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 5);
        body.setXray(xr);
        body.setExplode(s.explode);
        // Lymph moves slowly in life (a litre or so every 8–12 hours); shown speeded up here.
        if (s.flow && s.explode < 0.05) { next -= dt; if (next <= 0) { body.drops.send(body.routes[ROUTES[k++ % ROUTES.length]], { speed: 3.2 }); next = 0.35; } }
        if (!s.flow || s.explode >= 0.05) body.drops.clear();
        body.drops.step(dt);
        // a gentle pulse in the nodes
        body.nodeMat.emissiveIntensity = (0.2 + 0.15 * xr) * (1 + 0.25 * Math.sin(t * 2));
        const narrow = fit(), on = s.labels && !inReel();
        body.showLabels(on && !narrow && s.explode < 0.3);
        partL.forEach((l) => { l.visible = on && !narrow && s.explode >= 0.3; });
        sides.forEach((l) => { l.visible = on && !narrow; });
      },
      readout: (s) => `<div class="big">Made in the marrow, gathered in the nodes</div>
        <div class="row"><span>White cells in blood</span><b>4,000–11,000 per µL</b></div>
        <div class="row"><span>Neutrophils made each day</span><b>about 100 billion</b></div>
        <div class="row"><span>Lymph nodes</span><b>about 600</b></div>
        <div class="row"><span>Lymph back to the blood</span><b>about 2–3 L a day</b></div>
        <div class="row"><span>Spleen</span><b>about 12 cm, 150 g</b></div>
        <small>${s.explode > 0.4 ? 'Left: red bone marrow, where immune cells are born. Right: the lymphoid organs.' : 'Green: lymph vessels and nodes. Purple: thymus. Pink: tonsils. Red: marrow. Yellow: Peyer’s patches.'}</small>`,
    });
  },
};
