// Chapter 6: when the immune system goes wrong, and how to help it. A ghosted body shows where each
// problem happens; a dish of bacteria shows antibiotic resistance. Always "see a doctor": no
// diagnosis or dosing advice.
// Sources:
//  - Allergy: IgE antibodies on mast cells release histamine when they meet a harmless trigger such
//    as pollen, dust mites or peanuts (Janeway's Immunobiology, 9th ed., ch. 14). Allergic rhinitis
//    affects about 10–30% of people worldwide (World Allergy Organization White Book on Allergy,
//    2013). Anaphylaxis is an emergency: call 112 (or 108 for an ambulance in most Indian states);
//    use an adrenaline auto-injector if one has been prescribed (NHS "Anaphylaxis"; WAO guidance).
//  - Autoimmunity: in type 1 diabetes T cells destroy the insulin-making beta cells of the pancreas
//    (NIDDK). India has more children and teenagers with type 1 diabetes than any other country
//    (IDF Diabetes Atlas, 10th ed., 2021: about 2.3 lakh aged 0–19). Rheumatoid arthritis: the
//    immune system attacks the lining of joints; about 0.5–1% of adults (NIAMS; Malaviya et al.,
//    J Assoc Physicians India 41:697, 1993 found about 0.75% in India).
//  - HIV infects helper (CD4) T cells. Healthy CD4 counts are about 500–1,500 per µL; below 200 is
//    AIDS (CDC "About HIV"). Treatment (antiretroviral therapy, ART) keeps the virus suppressed, and
//    people with an undetectable viral load do not pass HIV on through sex (CDC, U=U). HIV spreads
//    through blood, sex and from mother to baby, not by touching, hugging or sharing food (WHO).
//    About 25 lakh people live with HIV in India (NACO, India HIV Estimations 2023: 25.44 lakh);
//    about 40 million worldwide (UNAIDS 2024 fact sheet: 39.9 million in 2023); ART is free at
//    government ART centres in India (NACO).
//  - Antibiotics kill bacteria but do nothing to viruses such as colds and flu (WHO "Antimicrobial
//    resistance" fact sheet). Resistant bacteria were directly responsible for about 1.27 million
//    deaths in 2019 (GRAM, Murray et al., Lancet 399:629, 2022). India's "Red Line" campaign (2016)
//    marks prescription-only antibiotics with a red vertical line (MoHFW / CDSCO).
//  - Hand washing with soap for at least 20 seconds (CDC). Handwashing education cut diarrhoeal
//    illness by about 23–40% and respiratory illness by about 16–21% in studies (CDC "Show me the
//    science"). People sleeping under 6 hours were about 4 times more likely to catch a cold when
//    exposed to the virus (Prather et al., Sleep 38:1353, 2015); teenagers need about 8–10 hours
//    (AASM, Paruthi et al., J Clin Sleep Med 12:785, 2016).
import { THREE, M, clamp, lerp, smooth } from '../kit.js';
import { makeBody, tint, fitNarrow, compactReadout, inReel, rnd, ORG, rodGeo, prng } from '../immune.js';

const COND = {
  allergy: { label: 'Allergy', title: 'Allergy: an overreaction' },
  auto: { label: 'Autoimmunity', title: 'Autoimmunity: attacking yourself' },
  hiv: { label: 'HIV', title: 'HIV: an attack on the helpers' },
  antibiotics: { label: 'Antibiotics', title: 'Antibiotics, viruses and resistance' },
  habits: { label: 'Hand washing, sleep', title: 'Everyday habits that help' },
};

export default {
  id: 'health',
  short: 'Keeping it healthy',
  title: 'When defences misfire, and how to help them',
  subtitle: 'Allergies, autoimmunity, HIV, antibiotic resistance, and the habits that keep your army strong.',
  view: { pos: [-2.2, 9.6, 21.5], target: [-4.1, 8.8, 0] },
  learn: `<p>An immune system has to be strong against germs but gentle with everything else. This chapter explains common problems; it cannot tell you what is going on in your own body. For that, <b>see a doctor</b>.</p>
    <p>An <b>allergy</b> is an <b>overreaction</b> to something harmless, like pollen, dust mites or peanuts. Special antibodies (IgE) sit on <b>mast cells</b>, which burst open with <b>histamine</b>: sneezing, itchy eyes, rashes or wheezing. A severe reaction, <b>anaphylaxis</b>, with trouble breathing or a swelling face, is an emergency: call <b>112</b> (or 108), and use an adrenaline pen if one was prescribed.</p>
    <p>In <b>autoimmune</b> diseases the army attacks your own body. In <b>type 1 diabetes</b> it destroys the insulin-making cells of the pancreas (see PancreasClear); India has more children with it than any other country. In <b>rheumatoid arthritis</b> it attacks the joints.</p>
    <p><b>HIV</b> is a virus that infects the helper T cells, the army's commanders. Without treatment they slowly fall until ordinary germs become dangerous (AIDS). Daily medicines keep the virus down so people live long, healthy lives, and they are free at government ART centres in India. HIV does not spread by touching, hugging or sharing food.</p>
    <p><b>Antibiotics</b> kill bacteria but do <b>nothing</b> to viruses such as colds and flu. Using them when not needed helps <b>resistant</b> bacteria win. Take them only when a doctor prescribes them, exactly as told. And the simple things work: wash your hands with soap for <b>20 seconds</b>, sleep well (teenagers need 8–10 hours), and keep your vaccines up to date.</p>
    <p class="tip"><b>Try it:</b> pick "Antibiotics" and watch the dish: which bacteria are left after the medicine?</p>`,
  terms: [
    { t: 'Allergy', d: 'An immune overreaction to something harmless, like pollen or peanuts.' },
    { t: 'Histamine', d: 'A chemical released by mast cells that causes itching, swelling and sneezing.' },
    { t: 'Anaphylaxis', d: 'A sudden, severe allergic reaction affecting breathing or circulation. An emergency.' },
    { t: 'Autoimmune disease', d: 'When the immune system attacks the body’s own tissues.' },
    { t: 'HIV and AIDS', d: 'HIV infects helper T cells; AIDS is the late stage when too few are left.' },
    { t: 'Antibiotic resistance', d: 'When bacteria evolve so an antibiotic no longer kills them.' },
  ],
  defaults: { cond: 'allergy', labels: true },
  controls: [
    { key: 'cond', type: 'seg', label: 'Show', options: Object.entries(COND).map(([v, c]) => ({ v, label: c.label })), fmt: (v) => COND[v].title },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'What is an allergy?', options: ['A germ infection', 'The immune system overreacting to something harmless', 'A shortage of white cells', 'A vitamin deficiency'], answer: 1, why: 'In an allergy the immune system treats something harmless, like pollen, as an enemy and releases histamine.' },
    { q: 'Will antibiotics cure a cold?', options: ['Yes, always', 'No: colds are caused by viruses, and antibiotics only kill bacteria', 'Only strong ones', 'Only with fever'], answer: 1, why: 'Antibiotics don’t work on viruses. Taking them when not needed helps resistant bacteria spread.' },
    { q: 'Which cells does HIV attack?', options: ['Red blood cells', 'Helper T cells', 'Skin cells', 'Bone cells'], answer: 1, why: 'HIV infects helper (CD4) T cells, the commanders of the immune response. Treatment keeps the virus in check.' },
  ],
  reel: [
    { ms: 5600, caption: 'Antibiotics kill bacteria, not viruses. Misuse lets the rare resistant ones take over.', set: { cond: 'antibiotics', labels: false }, act: (s) => { s._dish = true; }, view: { pos: [4.3, 11.8, 9.0], target: [4.1, 9.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage, { labels: false });
    root.add(body.root);
    const mk = (pos, col = 0xff5a6a, r = 0.3) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false })); m.position.set(...pos); root.add(m); return m; };
    const mk3 = (list, col, r) => list.map((p) => mk(p, col, r));
    const MK = {
      allergy: mk3([ORG.nose, [0.3, 16.5, 0.76], [-0.3, 16.5, 0.76], ORG.lungL, ORG.lungR, [1.95, 11.6, 0.35]], 0xffd166, 0.22),
      auto: mk3([ORG.pancreas, [2.45, 9.6, 0.2], [-2.45, 9.6, 0.2], ORG.kneeL, ORG.kneeR], 0xff8ab0, 0.28),
      hiv: [],
      habits: mk3([ORG.handL, ORG.handR, [0, 16.8, 0.4]], 0x6ee7a8, 0.32),
    };
    // ---- a dish of bacteria (for antibiotics), beside the body
    const dish = new THREE.Group(); dish.position.set(4.3, 8.9, 0.6); dish.rotation.x = 0.5; root.add(dish);
    dish.add(new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.25, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8eef8, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide })));
    const agar = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.08, 48), new THREE.MeshStandardMaterial({ color: 0xe8d890, roughness: 0.6, transparent: true, opacity: 0.8 })); agar.position.y = -0.08; dish.add(agar);
    const drugM = new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0, depthWrite: false });
    const drug = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.02, 48), drugM); drug.position.y = 0.0; dish.add(drug);
    const NB = 220, RES = [17, 88, 151];
    const bm = new THREE.InstancedMesh(rodGeo(0.05, 0.12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), NB); bm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bm.frustumCulled = false; dish.add(bm);
    const bpos = Array.from({ length: NB }, (_, i) => { const a = rnd(i) * Math.PI * 2, r = 1.8 * Math.sqrt(rnd(i + 5)); return new THREE.Vector3(Math.cos(a) * r, 0.04, Math.sin(a) * r); });
    // resistant descendants spread out from the three resistant founders
    const founder = bpos.map((p) => RES.reduce((b, j) => (p.distanceTo(bpos[j]) < p.distanceTo(bpos[b]) ? j : b), RES[0]));
    const cS = new THREE.Color(0xb8e05a), cR = new THREE.Color(0xff5a6a);
    // HIV: helper T cells in the nodes, shown by the nodes' glow, falling without treatment
    const L = (h, p, c) => tint(stage.label(h, p, root), c);
    const bodyL = L('', [2.9, 17.6, 0], 'pink'), subL = L('', [3.2, 7.2, 0], 'side'), dishL = L('', [4.3, 11.0, 0.6], 'good');
    let t = 0, dishT = 0, last = '';
    const fit = fitNarrow(stage, { pos: [0, 15, 22.3], target: [0, 14.5, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const c = s.cond, on = s.labels && !inReel(), narrow = fit(), pulse = 0.55 + 0.45 * Math.sin(t * 4);
        if (c !== last || s._dish) { last = c; dishT = 0; s._dish = false; }
        dishT += dt;
        Object.entries(MK).forEach(([k, arr]) => arr.forEach((m) => { m.visible = k === c; m.scale.setScalar(0.8 + 0.4 * pulse); m.material.opacity = 0.3 + 0.5 * pulse; }));
        // HIV: helper T cells (node glow) fall over "years" without treatment, rise with it
        const cyc = (t * 0.12) % 1, cd4 = c === 'hiv' ? (cyc < 0.6 ? lerp(1000, 150, smooth(cyc / 0.6)) : lerp(150, 700, smooth((cyc - 0.6) / 0.4))) : 1000;
        body.nodeMat.emissiveIntensity = 0.05 + 0.4 * (cd4 / 1000);
        body.nodeMat.color.set(c === 'hiv' && cd4 < 300 ? 0x55665e : 0xa8f5cc);
        body.organ.thymus.visible = true;
        // antibiotics dish: 0–2.5 s grow; the drug goes in; susceptible bacteria die; resistant ones spread
        const showDish = c === 'antibiotics';
        dish.visible = showDish;
        body.root.visible = true;
        body.skinMat.opacity = showDish ? 0.05 : 0.1;
        if (showDish) {
          const T = (dishT * 1.4) % 11, drugOn = T > 2.5, die = clamp((T - 3) / 2, 0, 1), spread = clamp((T - 5.5) / 4.5, 0, 1);
          drugM.opacity = drugOn ? 0.25 : 0;
          for (let i = 0; i < NB; i++) {
            const res = RES.includes(i), grow = clamp(T / 2.5, 0, 1), f = founder[i];
            let sc, col;
            if (res) { sc = 1.4; col = cR; }
            else if (!drugOn || die < rnd(i + 3)) { sc = (rnd(i) < grow ? 1 : 0.0001) * (drugOn ? 1 - die * 0.3 : 1); col = cS; }
            else {
              // replaced by a resistant descendant once the resistant ones spread
              const d = bpos[i].distanceTo(bpos[f]);
              sc = d < spread * 2.4 ? 1 : 0.0001; col = cR;
            }
            bm.setColorAt(i, col);
            const q = bpos[i]; const o = new THREE.Object3D(); o.position.copy(q); o.rotation.set(0, rnd(i) * 6, 0); o.scale.setScalar(sc); o.updateMatrix(); bm.setMatrixAt(i, o.matrix);
          }
          bm.instanceMatrix.needsUpdate = true; if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
          dishL.element.textContent = T < 2.5 ? 'Growing: 3 of them resistant (red)' : T < 5.5 ? 'Antibiotic in: the green ones die' : 'Resistant ones take over';
        }
        bodyL.element.innerHTML = { allergy: 'Harmless triggers set off mast cells: nose, eyes, lungs, skin', auto: 'Type 1 diabetes: the pancreas. Rheumatoid arthritis: the joints', hiv: `Helper T cells: about ${Math.round(cd4 / 10) * 10} per µL${cyc < 0.6 ? ' (no treatment)' : ' (on treatment)'}`, antibiotics: 'Antibiotics work on bacteria only', habits: 'Soap for 20 seconds; sleep 8–10 hours as a teen' }[c];
        subL.element.innerHTML = c === 'allergy' ? 'Severe (anaphylaxis): call 112 or 108' : c === 'hiv' ? 'Not spread by touch, hugs or sharing food' : '';
        bodyL.visible = on && !narrow; subL.visible = on && !narrow && !!subL.element.innerHTML; dishL.visible = on && showDish && !narrow;
      },
      readout: (s) => {
        const rows = {
          allergy: [['Trigger', 'pollen, dust mites, foods, stings'], ['What happens', 'IgE on mast cells → histamine'], ['Hay fever affects', 'about 10–30% of people'], ['Emergency signs', 'hard to breathe, swollen face: call 112']],
          auto: [['Type 1 diabetes', 'immune cells destroy insulin makers'], ['Children with it, India', 'more than any other country'], ['Rheumatoid arthritis', 'attacks joint linings; about 1 in 100–200 adults'], ['Treatment', 'insulin; medicines that calm the attack']],
          hiv: [['HIV infects', 'helper (CD4) T cells'], ['Healthy count', 'about 500–1,500 per µL'], ['AIDS', 'below 200 per µL'], ['Living with HIV, India', 'about 25 lakh; treatment is free']],
          antibiotics: [['Antibiotics kill', 'bacteria, not viruses'], ['Colds and flu', 'viruses: antibiotics don’t help'], ['Deaths from resistant bacteria', 'about 1.27 million (2019)'], ['Red line on the pack', 'only on a doctor’s prescription']],
          habits: [['Hand washing', 'soap, at least 20 seconds'], ['Cuts stomach bugs by', 'about 23–40%'], ['Sleep under 6 hours', 'about 4× more colds'], ['Vaccines', 'keep them up to date']],
        }[s.cond];
        return `<div class="big">${COND[s.cond].title}</div>${rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>This explains; it doesn’t diagnose. For your own health, see a doctor.</small>`;
      },
    });
  },
};
