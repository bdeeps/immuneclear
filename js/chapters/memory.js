// Chapter 4: memory and vaccines. Two people meet the same germ: one catches the disease, one is
// vaccinated first. Both end up with memory cells; only one had to be ill to get them. When the real
// germ comes later, memory answers in a day or two. Then the crowd view: herd immunity, with the
// threshold 1 − 1/R0.
// Sources and numbers:
//  - memory B and T cells can last for decades (Janeway's Immunobiology, 9th ed., ch. 11; Amanna,
//    Carlson & Slifka, N Engl J Med 357:1903, 2007, antibody half-lives of decades for measles and
//    mumps after infection or vaccination);
//  - the illness and antibody curves are sketches of the textbook primary and secondary responses
//    (see adaptive.js); a vaccine often gives a mild sore arm or a slight fever for a day or two (WHO
//    "Vaccines and immunization: what is vaccination?");
//  - vaccine types and examples (WHO; CDC "Vaccine types"; Bharat Biotech; Serum Institute of India):
//    inactivated (Covaxin, IPV polio shots), live weakened (oral polio drops, MMR, BCG), protein
//    subunit (hepatitis B, HPV), viral vector (Covishield / Oxford-AstraZeneca), mRNA (Pfizer-BioNTech,
//    Moderna);
//  - basic reproduction numbers R0 (Fine, Eames & Heymann, "Herd immunity: a rough guide", Clin Infect
//    Dis 52:911, 2011; Guerra et al., Lancet Infect Dis 17:e420, 2017 for measles): measles 12–18,
//    chickenpox about 10–12, polio 5–7, the first COVID-19 strain about 2.5–3, seasonal flu about 1.3;
//    herd-immunity threshold = 1 − 1/R0 (measles about 92–95%);
//  - an outbreak below the threshold: each chain of cases averages 1/(1 − Reff) people; above it the
//    final share of unprotected people infected z solves z = 1 − exp(−Reff·z) (the Kermack–McKendrick
//    final-size equation);
//  - India's Universal Immunisation Programme (MoHFW / NHM): started 1985 (from the 1978 Expanded
//    Programme on Immunization), free vaccines against 12 diseases, about 2.67 crore newborns and 2.9
//    crore pregnant women a year. Last wild polio case in India 13 January 2011 (Howrah, West Bengal);
//    WHO South-East Asia Region certified polio-free 27 March 2014.
import { THREE, M, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { board, panel, tint, fitNarrow, compactReadout, inReel, rnd, prng, virusGeo, lumpyGeo, makeFigure, vtube, antibody, abTotal } from '../immune.js';

export const DISEASES = {
  measles: { label: 'Measles', R0: 15, range: '12–18' },
  chickenpox: { label: 'Chickenpox', R0: 11, range: '10–12' },
  polio: { label: 'Polio', R0: 6, range: '5–7' },
  covid: { label: 'COVID-19 (2020)', R0: 2.8, range: '2.5–3' },
  flu: { label: 'Seasonal flu', R0: 1.3, range: 'about 1.3' },
};
const VTYPES = {
  inactivated: { label: 'Inactivated', what: 'the whole germ, killed', eg: 'Covaxin, polio shots (IPV)' },
  live: { label: 'Weakened', what: 'a live but weakened germ', eg: 'oral polio drops, MMR, BCG' },
  protein: { label: 'Protein', what: 'just one piece of the germ', eg: 'hepatitis B, HPV' },
  vector: { label: 'Viral vector', what: 'a harmless virus carrying the recipe', eg: 'Covishield' },
  mrna: { label: 'mRNA', what: 'a recipe your cells read to make one piece', eg: 'Pfizer-BioNTech, Moderna' },
};
export const threshold = (R0) => 1 - 1 / R0;
export function finalSize(R) { if (R <= 1) return 0; let z = 0.5; for (let i = 0; i < 200; i++) z = 1 - Math.exp(-R * z); return z; }

// Illness (0–1) and antibody level (log units) for the two paths; second meeting on day 40.
const MEET2 = 40, DMAX = 60;
function illness(d, vacc) {
  if (d >= MEET2) { const x = d - MEET2; return (x > 1 && x < 4 ? 0.08 * Math.sin(((x - 1) / 3) * Math.PI) : 0); }
  if (vacc) return d > 0.5 && d < 2.5 ? 0.15 * Math.sin(((d - 0.5) / 2) * Math.PI) : 0;          // sore arm, maybe a slight fever
  return d > 3 && d < 15 ? 0.9 * Math.sin(((d - 3) / 12) * Math.PI) ** 0.8 : 0;
}
const abPath = (d, vacc) => (d < MEET2 ? abTotal(d, false) * (vacc ? 0.85 : 1) : Math.max(abTotal(d, false) * (vacc ? 0.85 : 1), abTotal(d - MEET2, true)));

function drawPaths(g, w, h, st) {
  panel(g, w, h);
  const L = 70, R = w - 24;
  const X = (d) => L + (d / DMAX) * (R - L);
  g.fillStyle = '#e8eef8'; g.font = 'bold 28px sans-serif'; g.fillText('Catch it, or be vaccinated first?', L, 40);
  const box = (y0, y1, title, f, max) => {
    g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(title, L, y0 - 10);
    g.strokeStyle = 'rgba(255,255,255,.1)'; g.strokeRect(L, y0, R - L, y1 - y0);
    [[false, '#ff8a8a'], [true, '#6ee7a8']].forEach(([v, c]) => { g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); for (let d = 0; d <= DMAX; d += 0.25) { const y = y1 - clamp(f(d, v) / max, 0, 1) * (y1 - y0 - 8); d ? g.lineTo(X(d), y) : g.moveTo(X(d), y); } g.stroke(); g.lineWidth = 1; });
  };
  box(90, 250, 'How ill you feel', illness, 1);
  box(300, 470, 'Antibodies (log scale)', abPath, 4);
  g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
  [0, 20, 40, 60].forEach((d) => g.fillText('day ' + d, X(d) - 24, h - 14));
  g.strokeStyle = 'rgba(255,209,102,.7)'; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(X(MEET2), 80); g.lineTo(X(MEET2), 470); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#ffd166'; g.fillText('the real germ again', X(MEET2) + 8, 110);
  g.font = 'bold 20px sans-serif'; g.fillStyle = '#ff8a8a'; g.fillText('caught the disease', R - 440, 40); g.fillStyle = '#6ee7a8'; g.fillText('vaccinated', R - 130, 40);
  const x = X(st.day); g.strokeStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.moveTo(x, 90); g.lineTo(x, 470); g.stroke();
}
function drawHerd(g, w, h, st) {
  panel(g, w, h);
  const L = 40, R = w - 40, y = 150;
  g.fillStyle = '#e8eef8'; g.font = 'bold 28px sans-serif'; g.fillText(`${st.name}: R0 about ${st.range}`, L, 44);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(L, y - 30, R - L, 60);
  g.fillStyle = st.cov >= st.th ? '#6ee7a8' : '#8ab4ff'; g.fillRect(L, y - 30, (R - L) * st.cov, 60);
  const tx = L + (R - L) * st.th;
  g.strokeStyle = '#ffd166'; g.lineWidth = 5; g.beginPath(); g.moveTo(tx, y - 50); g.lineTo(tx, y + 50); g.stroke(); g.lineWidth = 1;
  g.font = 'bold 22px sans-serif'; g.fillStyle = '#ffd166'; const tl = `needed: ${Math.round(st.th * 100)}%`; g.fillText(tl, clamp(tx - g.measureText(tl).width / 2, L, R - g.measureText(tl).width), y + 80);
  g.fillStyle = '#e8eef8'; g.fillText(`immune: ${Math.round(st.cov * 100)}%`, L, y - 44 + 0);
  g.font = 'bold 26px sans-serif'; g.fillStyle = st.cov >= st.th ? '#6ee7a8' : '#ff8a8a';
  g.fillText(st.cov >= st.th ? 'Herd immunity: outbreaks fizzle out' : 'Below the threshold: outbreaks can spread', L, h - 30);
}

export default {
  id: 'memory',
  short: 'Memory and vaccines',
  title: 'Memory, and training without the danger',
  subtitle: 'Why you rarely get measles twice, how a vaccine teaches the same lesson safely, and how a crowd protects the few who can’t be vaccinated.',
  view: { pos: [1.0, 5.4, 16.5], target: [0.6, 4.6, 0] },
  learn: `<p>After a fight, most B and T cells die off, but some stay on as <b>memory cells</b>, sometimes for your whole life. If the same germ comes back, they recognise it at once. Antibodies climb within a day or two, to levels 10 to 100 times higher than the first time, and the germ is usually beaten before you even feel ill. That is <b>immunity</b>.</p>
    <p>Catching a disease to get immunity is risky: measles, polio or diphtheria can disable or kill. A <b>vaccine</b> teaches the same lesson safely. It shows your immune system a <b>harmless version</b> of the germ: a killed germ (India's <b>Covaxin</b>), a weakened one (<b>oral polio drops</b>), one piece of it (hepatitis B), or a recipe for one piece (<b>mRNA</b> vaccines). Your body makes memory cells, and at most you get a sore arm for a day.</p>
    <p>Vaccines also protect people who can't be vaccinated, like newborns or people on cancer treatment. If enough people are immune, a germ can't find enough new people to spread to, and outbreaks fizzle out: <b>herd immunity</b>. How many is "enough" depends on how contagious the germ is. Its <b>R0</b> is how many people one case infects when no one is immune; the share needed is <b>1 − 1/R0</b>. For measles, one of the most contagious diseases, that is about <b>92–95%</b>.</p>
    <p>India's <b>Universal Immunisation Programme</b>, started in 1985, gives free vaccines against 12 diseases to about 2.7 crore babies every year. Pulse Polio drives reached every child, the last case of wild polio in India was in January 2011, and India was certified <b>polio-free in 2014</b>.</p>
    <p class="tip"><b>Try it:</b> in the crowd, pick measles and slide the immune share just below, then just above the threshold, and start an outbreak each time.</p>`,
  terms: [
    { t: 'Memory cell', d: 'A long-lived B or T cell that remembers a germ and answers fast if it returns.' },
    { t: 'Immunity', d: 'Protection against a germ, from having had it or from a vaccine.' },
    { t: 'Vaccine', d: 'A harmless version or piece of a germ that trains the immune system to remember it.' },
    { t: 'R0', d: 'How many people one infected person infects, on average, when nobody is immune.' },
    { t: 'Herd immunity', d: 'When enough people are immune that a germ can’t keep spreading, protecting everyone.' },
    { t: 'Eradication', d: 'Wiping a disease out worldwide. Smallpox is the only human disease eradicated so far.' },
  ],
  defaults: { mode: 'vaccine', vtype: 'inactivated', disease: 'measles', cov: 0.6, labels: true },
  controls: [
    { key: 'mode', type: 'seg', label: 'Show', options: [{ v: 'vaccine', label: 'Disease vs vaccine' }, { v: 'herd', label: 'Herd immunity' }] },
    { key: 'vtype', type: 'seg', label: 'Kind of vaccine', options: Object.entries(VTYPES).map(([v, x]) => ({ v, label: x.label })), fmt: (v) => VTYPES[v].eg },
    { key: 'disease', type: 'seg', label: 'Germ (herd immunity)', options: Object.entries(DISEASES).map(([v, x]) => ({ v, label: x.label })), fmt: (v) => 'R0 about ' + DISEASES[v].range },
    { key: 'cov', type: 'range', label: 'Share of people immune', min: 0, max: 0.99, step: 0.01, ends: ['0%', '99%'], fmt: (v, s) => Math.round(v * 100) + '% (needed: ' + Math.round(threshold(DISEASES[s.disease].R0) * 100) + '%)' },
    { key: 'go', type: 'buttons', label: 'Crowd', items: [{ label: 'Start an outbreak', act: (s) => { s._outbreak = true; s.mode = 'herd'; } }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  onChange(s, key) {
    const sig = s.disease + ':' + s.cov;
    if ((key === 'cov' || key === 'disease') && sig !== s._sig) s._outbreak = true;
    s._sig = sig;
  },
  quiz: [
    { q: 'Why does a vaccine protect you?', options: ['It kills every germ in your body', 'It trains your immune system to make memory cells, without the disease', 'It makes your skin thicker', 'It works like an antibiotic'], answer: 1, why: 'A vaccine shows your immune system a harmless version of the germ, so memory cells are ready if the real one comes.' },
    { q: 'Measles has an R0 of about 15. Roughly what share of people must be immune for herd immunity?', options: ['About 15%', 'About 50%', 'About 93%', '100%'], answer: 2, why: '1 − 1/15 is about 0.93, so about 93%. That is why measles needs two doses and very high coverage.' },
    { q: 'In which year was India certified polio-free?', options: ['1985', '1995', '2011', '2014'], answer: 3, why: 'The last wild polio case was in January 2011. After three years with no cases, WHO certified the region polio-free on 27 March 2014.' },
  ],
  reel: [
    { ms: 5600, caption: 'A vaccine teaches your immune system with a harmless version of the germ, so memory is ready without the illness.', set: { mode: 'vaccine', vtype: 'inactivated', labels: false }, view: { pos: [0.6, 5.0, 14], target: [0.4, 4.2, 0] }, spin: 0 },
    { ms: 5800, caption: 'When about 93% of people are immune to measles, an outbreak can’t find enough people to spread to.', set: { mode: 'herd', disease: 'measles', cov: 0.95, labels: false }, act: (s) => { s._outbreak = true; }, view: { pos: [0.3, 10.5, 12.5], target: [0.3, 0.6, 1.2] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const VAC = new THREE.Group(), HERD = new THREE.Group(); root.add(VAC, HERD);
    HERD.position.set(0, 0, 0);

    // ---------------- disease vs vaccine: two small figures, their memory cells, and the board
    const figMat = (c) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.22, roughness: 0.6, depthWrite: false, side: THREE.DoubleSide });
    const figA = makeFigure(figMat(0xff8a8a)), figB = makeFigure(figMat(0x6ee7a8));
    const FX = [-4.0, -0.8], SC = 0.3;
    [figA, figB].forEach((f, i) => { f.scale.setScalar(SC); f.position.set(FX[i], 0, 0); VAC.add(f); });
    const glowA = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff5a6a, transparent: true, opacity: 0, depthWrite: false })); glowA.position.set(FX[0], 16.45 * SC, 0.2); VAC.add(glowA);
    const armB = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff9f7a, transparent: true, opacity: 0, depthWrite: false })); armB.position.set(FX[1] + 2.0 * SC, 12.9 * SC, 0.1); VAC.add(armB);
    const memMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.7, roughness: 0.3 });
    const mems = [[], []];
    for (let s2 = 0; s2 < 2; s2++) for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(lumpyGeo(0.14, 0.05, i), memMat); VAC.add(m); mems[s2].push(m); }
    // the training dummy for each vaccine type, above the vaccinated figure
    const dummy = new THREE.Group(); dummy.position.set(FX[1], 6.3, 0); dummy.scale.setScalar(0.8); VAC.add(dummy);
    const virMat = (c, ei = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: c, emissiveIntensity: ei });
    const D = {
      inactivated: new THREE.Mesh(virusGeo(0.42, 20), virMat(0x9aa3b5, 0.15)),
      live: new THREE.Mesh(virusGeo(0.34, 10), virMat(0xff9f9f, 0.2)),
      protein: new THREE.Group(),
      vector: new THREE.Group(),
      mrna: new THREE.Group(),
    };
    const spikeGeo = new THREE.CylinderGeometry(0.08, 0.03, 0.4, 6);
    for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(spikeGeo, virMat(0xff5a6a, 0.5)); sp.position.set((i - 2) * 0.3, Math.sin(i) * 0.15, 0); sp.rotation.z = (i - 2) * 0.3; D.protein.add(sp); }
    D.vector.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), virMat(0x8ab4ff, 0.3)));
    const helix = (n, r, len, col) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(-len / 2, len / 2, u), Math.sin(u * 18) * r, Math.cos(u * 18) * r]); } return vtube(pts, 0.035, virMat(col, 0.6), n * 2); };
    D.vector.add(helix(60, 0.08, 0.5, 0xff5a6a));
    D.mrna.add(helix(90, 0.1, 1.6, 0xff5a6a));
    const lip = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe8eef8, transparent: true, opacity: 0.18, depthWrite: false })); D.mrna.add(lip);
    Object.values(D).forEach((m) => dummy.add(m));
    const pst = { day: 0 };
    const chart = canvasTexture(1100, 520, (g, w, h) => drawPaths(g, w, h, pst));
    const cb = board(chart, 7, 7 * 520 / 1100); cb.position.set(3.9, 6.9, -1); VAC.add(cb);

    // ---------------- herd immunity: a crowd of people seen from above
    const COLS = 26, ROWS = 14, NP = COLS * ROWS, GAP = 0.48;
    const people = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.14, 0.26, 4, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), NP);
    people.instanceMatrix.setUsage(THREE.DynamicDrawUsage); HERD.add(people);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), NP); HERD.add(heads);
    const pos = [], o = new THREE.Object3D();
    for (let i = 0; i < NP; i++) { const c = i % COLS, r = Math.floor(i / COLS); pos.push(new THREE.Vector3((c - (COLS - 1) / 2) * GAP + (rnd(i) - 0.5) * 0.14, 0.27, (r - (ROWS - 1) / 2) * GAP + (rnd(i + 5) - 0.5) * 0.14)); }
    pos.forEach((p, i) => { o.position.copy(p); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); people.setMatrixAt(i, o.matrix); o.position.y = p.y + 0.34; o.updateMatrix(); heads.setMatrixAt(i, o.matrix); });
    const COL = { sus: new THREE.Color(0x9aa3b5), imm: new THREE.Color(0x5b8cff), inf: new THREE.Color(0xff3a4a), rec: new THREE.Color(0x7a4a50) };
    const hst = { cov: 0.6, th: 0.93, name: '', range: '' };
    const hchart = canvasTexture(1000, 300, (g, w, h) => drawHerd(g, w, h, hst));
    const hb = board(hchart, 7.2, 7.2 * 300 / 1000); hb.position.set(0.9, 1.3, 5.7); hb.rotation.x = -0.6; HERD.add(hb);
    let state = new Array(NP).fill('sus'), gen = 0, genT = 0, rng = prng(7), infectedTotal = 0, seedOf = 1;
    const outbreak = (s) => {
      rng = prng(1000 + Math.round(s.cov * 100) * 7 + seedOf++);
      const shuffled = [...Array(NP).keys()].sort(() => rng() - 0.5);
      const nImm = Math.round(s.cov * NP);
      state = new Array(NP).fill('sus');
      shuffled.slice(0, nImm).forEach((i) => { state[i] = 'imm'; });
      // patient zero: one unprotected person near the middle
      let z = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2); for (let k = 0; k < NP && state[z] !== 'sus'; k++) z = (z + 1) % NP;
      state[z] = 'inf';
      gen = 0; genT = 0; infectedTotal = 1;
    };
    // One generation: each infected person meets R0 others (mostly neighbours, some anyone) and
    // infects the ones who are not immune; then recovers.
    const nextGen = (R0) => {
      const inf = state.map((x, i) => (x === 'inf' ? i : -1)).filter((i) => i >= 0);
      if (!inf.length) return false;
      const n = [...state];
      inf.forEach((i) => {
        n[i] = 'rec';
        const contacts = Math.floor(R0) + (rng() < R0 - Math.floor(R0) ? 1 : 0);
        for (let k = 0; k < contacts; k++) {
          let j;
          if (rng() < 0.35) j = Math.floor(rng() * NP);
          else { const c = i % COLS, r = Math.floor(i / COLS), dc = Math.round((rng() - 0.5) * 7), dr = Math.round((rng() - 0.5) * 7); j = clamp(r + dr, 0, ROWS - 1) * COLS + clamp(c + dc, 0, COLS - 1); }
          if (state[j] === 'sus' && n[j] === 'sus') { n[j] = 'inf'; infectedTotal++; }
        }
      });
      state = n; gen++;
      return true;
    };

    const L = (h, p, par, c) => tint(stage.label(h, p, par), c);
    const vl = [L('Catches the disease', [FX[0], -0.5, 1.0], VAC, 'red'), L('Vaccinated first', [FX[1] + 0.4, -0.9, 1.0], VAC, 'good'), L('Memory cells', [-6.2, 3.6, 0.5], VAC, 'gold'), L('', [FX[1], 7.3, 0], VAC, 'blue')];
    const hl = [L('Grey: can catch it · Blue: immune · Red: infected · Dark: recovered', [0.9, -0.1, 7.3], HERD, 'side')];

    let t = 0, day = 0, lastMode = '', started = false;
    const VIEWS = { vaccine: { pos: [1.0, 5.4, 16.5], target: [0.6, 4.6, 0] }, herd: { pos: [0.4, 11.0, 15.5], target: [0.0, 0.4, 2.2] } };
    const fit = fitNarrow(stage, { pos: [0, 6, 22], target: [0, 5.0, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const herd = s.mode === 'herd', on = s.labels && !inReel(), narrow = fit();
        if (s.mode !== lastMode) { if (lastMode && !inReel()) stage.setView(VIEWS[s.mode].pos, VIEWS[s.mode].target, 0.9); lastMode = s.mode; }
        VAC.visible = !herd; HERD.visible = herd;
        if (!herd) {
          day = (day + dt * 4.5) % (DMAX + 6); const d = Math.min(DMAX, day);
          pst.day = d; chart.redraw();
          glowA.material.opacity = 0.6 * illness(d, false);
          glowA.scale.setScalar(1 + illness(d, false));
          armB.material.opacity = 3 * illness(d, true);
          // memory cells gather after about day 10 on both sides; the vaccinated side appears just as fast
          const memK = clamp((d - 8) / 12, 0, 1);
          mems.forEach((arr, side) => arr.forEach((m, i) => {
            const show = i < Math.round(memK * 10) || (d >= MEET2 && i < 10);
            const a = i * 0.63 + t * 0.4, cx = FX[side];
            m.position.set(cx + Math.cos(a) * 1.0, 3.6 + Math.sin(a * 1.3) * 0.4, Math.sin(a) * 0.5);
            m.scale.setScalar(show ? (d >= MEET2 && d < MEET2 + 5 ? 1.4 : 1) : 0.0001);
          }));
          Object.entries(D).forEach(([k, m]) => { m.visible = k === s.vtype; m.rotation.y = t * 0.6; });
          vl[3].element.textContent = 'Vaccine: ' + VTYPES[s.vtype].what;
          vl.forEach((l) => { l.visible = on && !narrow; });
          cb.visible = !narrow || inReel();
        } else {
          const R0 = DISEASES[s.disease].R0;
          if (s._outbreak) { s._outbreak = false; outbreak(s); }
          genT += dt;
          if (genT > 0.75) { genT = 0; nextGen(R0); }
          // restart on its own a few seconds after an outbreak ends
          if (!started) { started = true; outbreak(s); }
          if (!state.includes('inf')) { if ((s._idle = (s._idle || 0) + dt) > 3.5) { s._idle = 0; outbreak(s); } } else s._idle = 0;
          state.forEach((x, i) => { const c = COL[x]; people.setColorAt(i, c); heads.setColorAt(i, x === 'inf' ? COL.inf.clone().multiplyScalar(1.3 + 0.3 * Math.sin(t * 8)) : c); });
          people.instanceColor.needsUpdate = true; heads.instanceColor.needsUpdate = true;
          Object.assign(hst, { cov: s.cov, th: threshold(R0), name: DISEASES[s.disease].label, range: DISEASES[s.disease].range });
          hchart.redraw();
          hl.forEach((l) => { l.visible = on && !narrow; });
        }
      },
      readout: (s) => {
        if (s.mode === 'herd') {
          const d = DISEASES[s.disease], th = threshold(d.R0), Reff = d.R0 * (1 - s.cov);
          const out = Reff < 1 ? `a short chain: about ${Math.max(1, Math.round(1 / (1 - Reff)))} cases` : `about ${Math.round(finalSize(Reff) * (1 - s.cov) * 1000)} in every 1,000 people`;
          return `<div class="big">${s.cov >= th ? 'Protected: the outbreak fizzles' : 'Unprotected: it can spread'}</div>
            <div class="row"><span>${d.label}: R0</span><b>about ${d.range}</b></div>
            <div class="row"><span>Needed immune: 1 − 1/R0</span><b>${Math.round(th * 100)}%</b></div>
            <div class="row"><span>Each case now infects (Reff)</span><b>${Reff.toFixed(2)}</b></div>
            <div class="row"><span>Expected outbreak</span><b>${out}</b></div>
            <div class="row"><span>In this crowd so far</span><b>${infectedTotal} of ${NP} infected</b></div>
            <small>India’s Universal Immunisation Programme: free vaccines against 12 diseases for about 2.7 crore babies a year. Polio-free since 2014.</small>`;
        }
        const v = VTYPES[s.vtype];
        return `<div class="big">Same memory, without the danger</div>
          <div class="row"><span>Day</span><b>${Math.round(pst.day)}${pst.day >= MEET2 ? ': the real germ arrives' : ''}</b></div>
          <div class="row"><span>Caught the disease</span><b>${pst.day < MEET2 && illness(pst.day, false) > 0.2 ? 'ill for about 10 days' : pst.day >= MEET2 ? 'memory beats it' : 'recovering or well'}</b></div>
          <div class="row"><span>Vaccinated</span><b>${illness(pst.day, true) > 0.03 && pst.day < MEET2 ? 'sore arm for a day' : pst.day >= MEET2 ? 'memory beats it' : 'well'}</b></div>
          <div class="row"><span>This vaccine uses</span><b>${v.what}</b></div>
          <div class="row"><span>Examples</span><b>${v.eg}</b></div>
          <small>Memory cells can last for decades. Some vaccines need boosters to top memory up.</small>`;
      },
    });
  },
};
