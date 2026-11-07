import type { Anim, Pair, Pose } from '@/lib/figure';

// ─── shared poses ───────────────────────────────────────────────
const STAND: Pose = {};
const HINGE: Pose = { t: 122, lN: [16, -8], lF: [14, -8] };
const SQUAT: Pose = { t: 148, lN: [82, -28], lF: [80, -26] };
const RACK: Pair = [15, 165];
const UP: Pair = [178, 178];
const GOBLET: Pair = [22, 162];
const swingBottom: Pose = { ...HINGE, aN: [-22, -22], aF: [-20, -20] };
const swingTop: Pose = { t: 182, aN: [90, 90], aF: [88, 88] };

// push-up / plank on hands (hand-anchored)
const PU_TOP: Pose = { t: 110, aN: [0, 0], aF: [2, 2], lN: [-70, -70], lF: [-70, -70] };
const PU_BOTTOM: Pose = { t: 95, aN: [-45, 80], aF: [-43, 80], lN: [-84, -84], lF: [-84, -84] };

// lying on the back (head to the left)
const BENCH_LEGS = { lN: [60, 5] as Pair, lF: [58, 5] as Pair };

// gait helper: near leg forward when s = 1, back when s = -1
const gait = (k: number, lean: number, armSwing: number): [Pose, Pose, Pose, Pose] => {
  const a: Pose = { t: 180 - lean, lN: [35 * k, 5], lF: [-22 * k, -45 * k - 20], aN: [-armSwing, 60], aF: [armSwing, 100] };
  const b: Pose = { t: 180 - lean, lN: [5, -5], lF: [50 * k, -25], aN: [0, 75], aF: [0, 75] };
  const c: Pose = { t: 180 - lean, lN: [-22 * k, -45 * k - 20], lF: [35 * k, 5], aN: [armSwing, 100], aF: [-armSwing, 60] };
  const d: Pose = { t: 180 - lean, lN: [50 * k, -25], lF: [5, -5], aN: [0, 75], aF: [0, 75] };
  return [a, b, c, d];
};
const gaitAnim = (lean: number, arm: number, ms: number, scale = 1): Anim => {
  const [a, b, c, d] = gait(scale, lean, arm);
  return { anchor: 'lowest', moving: true, frames: [[a, ms], [b, ms], [c, ms], [d, ms]] };
};

const QUAD: Pose = { t: 108, aN: [0, 0], aF: [2, 2], lN: [0, -90], lF: [2, -90] };

export const ANIMATIONS: Record<string, Anim> = {
  // ─────────── Strongman ───────────
  farmers: (() => {
    const [a, b, c, d] = gait(0.8, 2, 0);
    const arms = { aN: [2, 2] as Pair, aF: [0, 0] as Pair };
    return { anchor: 'lowest', moving: true, equip: 'farmers', frames: [[{ ...a, ...arms }, 420], [{ ...b, ...arms }, 420], [{ ...c, ...arms }, 420], [{ ...d, ...arms }, 420]] } as Anim;
  })(),
  logpress: {
    anchor: 'ankle',
    equip: 'log',
    frames: [
      [{ aN: [22, 160], aF: [20, 160] }, 700, 200],
      [{ t: 172, lN: [22, -24], lF: [20, -24], aN: [22, 160], aF: [20, 160] }, 300],
      [{ aN: UP, aF: UP }, 700, 400],
    ],
  },
  atlas: {
    anchor: 'ankle',
    equip: 'stone',
    frames: [
      [{ ...SQUAT, t: 128, aN: [-40, 40], aF: [-38, 40] }, 900, 200],
      [{ t: 150, lN: [55, -30], lF: [53, -30], aN: [-10, 70], aF: [-8, 70] }, 700],
      [{ t: 186, aN: [30, 120], aF: [28, 120] }, 800, 400],
    ],
  },
  sledpush: (() => {
    const [a, b, c, d] = gait(1.1, 55, 0);
    const arms = { aN: [85, 85] as Pair, aF: [83, 83] as Pair };
    return { anchor: 'lowest', moving: true, props: [{ kind: 'sled' }], frames: [[{ ...a, ...arms }, 380], [{ ...b, ...arms }, 380], [{ ...c, ...arms }, 380], [{ ...d, ...arms }, 380]] } as Anim;
  })(),
  sbclean: {
    anchor: 'ankle',
    equip: 'sandbag',
    frames: [
      [{ ...SQUAT, t: 125, aN: [-25, 10], aF: [-23, 10] }, 800, 200],
      [{ t: 150, lN: [50, -28], lF: [48, -28], aN: [-5, 60], aF: [-3, 60] }, 500],
      [{ t: 182, aN: [40, 160], aF: [20, 150] }, 800, 400],
    ],
  },
  boxjump: {
    anchor: 'ankle',
    props: [{ kind: 'box' }],
    frames: [
      [{ aN: [10, 10], aF: [8, 8] }, 500],
      [{ ...SQUAT, t: 140, lN: [60, -24], lF: [58, -24], aN: [-40, -20], aF: [-38, -20] }, 350],
      [{ t: 170, lN: [70, -60], lF: [68, -60], aN: [140, 150], aF: [138, 150], dx: 22, dy: -58, fN: 30, fF: 30 }, 350],
      [{ t: 150, lN: [50, -30], lF: [48, -30], aN: [60, 70], aF: [58, 70], dx: 44, dy: -34 }, 400],
      [{ aN: [10, 10], aF: [8, 8], dx: 44, dy: -34 }, 600, 300],
    ],
  },
  ringrow: {
    anchor: 'ankle',
    props: [{ kind: 'rings' }],
    frames: [[{ t: 122, aN: [172, 172], aF: [170, 170], lN: [-58, -58], lF: [-58, -58] }, 800, 150], [{ t: 134, aN: [185, 100], aF: [183, 100], lN: [-46, -46], lF: [-46, -46] }, 800, 250]],
  },

  // ─────────── Kettlebell ───────────
  swing2: { anchor: 'ankle', equip: 'kb2', frames: [[swingBottom, 550], [swingTop, 550, 120]] },
  swing1: {
    anchor: 'ankle',
    equip: 'kb1',
    frames: [[{ ...swingBottom, aF: [-5, -5] }, 550], [{ ...swingTop, aF: [55, 70] }, 550, 120]],
  },
  kbdeadlift: {
    anchor: 'ankle',
    equip: 'kb2',
    frames: [[{ t: 128, lN: [38, -20], lF: [36, -20], aN: [2, 2], aF: [0, 0] }, 900, 200], [STAND, 900, 300]],
  },
  goblet: {
    anchor: 'ankle',
    equip: 'kb2',
    frames: [[{ aN: GOBLET, aF: GOBLET }, 900, 200], [{ ...SQUAT, aN: [28, 168], aF: [28, 168] }, 900, 300]],
  },
  kbclean: {
    anchor: 'ankle',
    equip: 'kb1',
    frames: [[{ t: 135, lN: [14, -6], lF: [12, -6], aN: [-12, -12], aF: [-5, -5] }, 500], [{ t: 182, aN: RACK, aF: [10, 30] }, 600, 400]],
  },
  kbpress: { anchor: 'ankle', equip: 'kb1', frames: [[{ aN: RACK, aF: [10, 40] }, 900, 200], [{ aN: UP, aF: [10, 40] }, 900, 300]] },
  snatch: {
    anchor: 'ankle',
    equip: 'kb1',
    frames: [
      [{ ...swingBottom, aF: [-5, -5] }, 400],
      [{ t: 182, aN: [100, 60], aF: [40, 60] }, 300],
      [{ t: 180, aN: UP, aF: [20, 40] }, 700, 300],
    ],
  },
  tgu: {
    anchor: 'lowest',
    equip: 'kb1',
    frames: [
      [{ t: 270, aN: UP, aF: [-120, -120], lN: [135, 45], lF: [90, 90] }, 900, 300],
      [{ t: 225, aN: UP, aF: [-40, -40], lN: [135, 45], lF: [90, 90] }, 900, 200],
      [{ t: 195, aN: UP, aF: [-25, -25], lN: [120, 40], lF: [90, 90] }, 1000, 200],
      [{ t: 180, aN: UP, aF: [15, 15], lN: [90, 0], lF: [0, -90], fF: 0 }, 1000, 200],
      [{ t: 180, aN: UP, aF: [10, 10] }, 1100, 500],
      [{ t: 180, aN: UP, aF: [15, 15], lN: [90, 0], lF: [0, -90], fF: 0 }, 1000, 200],
      [{ t: 195, aN: UP, aF: [-25, -25], lN: [120, 40], lF: [90, 90] }, 900, 200],
      [{ t: 225, aN: UP, aF: [-40, -40], lN: [135, 45], lF: [90, 90] }, 900, 200],
    ],
  },
  kbrow: {
    anchor: 'ankle',
    equip: 'kb1',
    frames: [[{ t: 112, lN: [30, -5], lF: [-10, -15], aN: [0, 0], aF: [40, 10] }, 700, 150], [{ t: 112, lN: [30, -5], lF: [-10, -15], aN: [-70, 0], aF: [40, 10] }, 700, 200]],
  },
  halo: {
    anchor: 'ankle',
    equip: 'kb2',
    frames: [
      [{ aN: [120, 200], aF: [118, 200] }, 500],
      [{ aN: [170, 170], aF: [168, 170] }, 500],
      [{ aN: [-150, 150], aF: [-148, 150] }, 500],
      [{ aN: [-120, 130], aF: [-118, 130] }, 500],
      [{ aN: [-150, 150], aF: [-148, 150] }, 500],
      [{ aN: [170, 170], aF: [168, 170] }, 500],
    ],
  },
  kbthruster: {
    anchor: 'ankle',
    equip: 'kb1',
    frames: [[{ ...SQUAT, aN: RACK, aF: [30, 120] }, 700, 150], [{ aN: UP, aF: [10, 40] }, 800, 200]],
  },

  // ─────────── Gym ───────────
  bbsquat: {
    anchor: 'ankle',
    equip: 'bbBack',
    frames: [[{ aN: [-35, 150], aF: [-33, 150] }, 1000, 200], [{ ...SQUAT, t: 145, aN: [-30, 150], aF: [-28, 150] }, 1000, 250]],
  },
  bbdeadlift: {
    anchor: 'ankle',
    equip: 'bb',
    frames: [[{ t: 135, lN: [50, -28], lF: [48, -28], aN: [2, 2], aF: [0, 0] }, 1100, 300], [STAND, 1100, 400]],
  },
  bench: {
    anchor: 'hip',
    equip: 'bb',
    props: [{ kind: 'bench' }],
    frames: [[{ t: -90, aN: [55, 180], aF: [53, 180], ...BENCH_LEGS }, 1000, 200], [{ t: -90, aN: UP, aF: UP, ...BENCH_LEGS }, 1000, 300]],
  },
  ohp: { anchor: 'ankle', equip: 'bb', frames: [[{ aN: [20, 165], aF: [18, 165] }, 1000, 200], [{ aN: UP, aF: UP }, 1000, 300]] },
  bbrow: {
    anchor: 'ankle',
    equip: 'bb',
    frames: [[{ t: 118, lN: [20, -10], lF: [18, -10], aN: [0, 0], aF: [2, 2] }, 700, 150], [{ t: 118, lN: [20, -10], lF: [18, -10], aN: [-60, 0], aF: [-58, 0] }, 700, 250]],
  },
  dbpress: {
    anchor: 'hip',
    equip: 'db2',
    props: [{ kind: 'bench' }],
    frames: [[{ t: -90, aN: [55, 180], aF: [53, 180], ...BENCH_LEGS }, 1000, 200], [{ t: -90, aN: UP, aF: UP, ...BENCH_LEGS }, 1000, 300]],
  },
  dbrow: {
    anchor: 'ankle',
    equip: 'db1',
    frames: [[{ t: 105, lN: [30, -5], lF: [-10, -15], aN: [0, 0], aF: [25, 25] }, 700, 150], [{ t: 105, lN: [30, -5], lF: [-10, -15], aN: [-75, 0], aF: [25, 25] }, 700, 200]],
  },
  rdl: {
    anchor: 'ankle',
    equip: 'db2',
    frames: [[STAND, 1100, 200], [{ t: 112, lN: [10, -4], lF: [8, -4], aN: [2, 2], aF: [0, 0] }, 1100, 300]],
  },
  legpress: {
    anchor: 'hip',
    props: [{ kind: 'seat' }, { kind: 'platform' }],
    frames: [[{ t: 215, aN: [15, 60], aF: [13, 60], lN: [118, 118], lF: [116, 116] }, 1100, 200], [{ t: 215, aN: [15, 60], aF: [13, 60], lN: [168, 72], lF: [166, 72] }, 1100, 300]],
  },
  latpull: {
    anchor: 'hip',
    props: [{ kind: 'seat' }, { kind: 'cable', dx: 0, dy: -14 }],
    frames: [[{ t: 186, aN: [174, 180], aF: [172, 180], lN: [92, 0], lF: [90, 0] }, 900, 200], [{ t: 192, aN: [25, 195], aF: [23, 195], lN: [92, 0], lF: [90, 0] }, 900, 300]],
  },
  cablerow: {
    anchor: 'hip',
    props: [{ kind: 'seat' }, { kind: 'cable', dx: 45, dy: 0 }],
    frames: [[{ t: 160, aN: [92, 92], aF: [90, 90], lN: [85, 80], lF: [83, 80] }, 900, 200], [{ t: 184, aN: [-55, 92], aF: [-53, 92], lN: [85, 80], lF: [83, 80] }, 900, 300]],
  },
  lateral: { anchor: 'ankle', equip: 'db2', frames: [[{ aN: [5, 5], aF: [3, 3] }, 900, 150], [{ aN: [82, 88], aF: [80, 86] }, 900, 250]] },
  curl: { anchor: 'ankle', equip: 'db2', frames: [[{ aN: [0, 0], aF: [2, 2] }, 800, 150], [{ aN: [5, 160], aF: [7, 160] }, 800, 250]] },
  triceps: {
    anchor: 'ankle',
    props: [{ kind: 'cable', dx: 22, dy: -80 }],
    frames: [[{ t: 172, aN: [8, 150], aF: [10, 150] }, 800, 150], [{ t: 172, aN: [8, 8], aF: [10, 10] }, 800, 250]],
  },
  legcurl: {
    anchor: 'hip',
    props: [{ kind: 'bench' }],
    frames: [[{ t: 90, aN: [20, 0], aF: [18, 0], lN: [-90, -90], lF: [-90, -90] }, 900, 150], [{ t: 90, aN: [20, 0], aF: [18, 0], lN: [-90, -165], lF: [-90, -163] }, 900, 250]],
  },
  hipthrust: {
    anchor: 'shoulder',
    equip: 'bbHip',
    props: [{ kind: 'benchShoulder' }],
    frames: [[{ t: -92, aN: [60, 90], aF: [58, 90], lN: [92, 0], lF: [90, 0] }, 900, 300], [{ t: -115, aN: [60, 90], aF: [58, 90], lN: [120, 0], lF: [118, 0] }, 900, 150]],
  },

  // ─────────── Bodyweight ───────────
  pushup: { anchor: 'hand', frames: [[PU_TOP, 800, 150], [PU_BOTTOM, 800, 150]] },
  squat: { anchor: 'ankle', frames: [[{ aN: [10, 10], aF: [8, 8] }, 800, 150], [{ ...SQUAT, aN: [90, 90], aF: [88, 88] }, 800, 200]] },
  lunge: {
    anchor: 'ankle',
    frames: [[STAND, 800, 200], [{ lN: [85, 0], lF: [-15, -100], fF: 15, aN: [5, 5], aF: [-5, -5] }, 800, 250]],
  },
  glutebridge: {
    anchor: 'lowest',
    frames: [[{ t: -90, aN: [90, 90], aF: [88, 88], lN: [140, 10], lF: [138, 10] }, 800, 150], [{ t: -110, aN: [70, 70], aF: [68, 68], lN: [115, 0], lF: [113, 0] }, 800, 350]],
  },
  plank: {
    anchor: 'lowest',
    frames: [[{ t: 100, aN: [0, 90], aF: [2, 90], lN: [-82, -82], lF: [-82, -82] }, 1500], [{ t: 102, aN: [0, 90], aF: [2, 90], lN: [-81, -81], lF: [-81, -81] }, 1500]],
  },
  mountain: {
    anchor: 'hand',
    frames: [
      [{ ...PU_TOP, lN: [35, -95] }, 260],
      [{ ...PU_TOP, lF: [35, -95] }, 260],
    ],
  },
  burpee: {
    anchor: 'lowest',
    frames: [
      [{ aN: [10, 10], aF: [8, 8] }, 350],
      [{ t: 110, lN: [100, -40], lF: [98, -40], aN: [15, 15], aF: [13, 13] }, 350],
      [PU_TOP, 350, 100],
      [{ t: 110, lN: [100, -40], lF: [98, -40], aN: [15, 15], aF: [13, 13] }, 350],
      [{ aN: UP, aF: UP, dy: -18, fN: 30, fF: 30 }, 350],
    ],
  },
  jumpsquat: {
    anchor: 'ankle',
    frames: [[{ aN: [10, 10], aF: [8, 8] }, 450], [{ ...SQUAT, aN: [-30, -10], aF: [-28, -10] }, 300], [{ aN: [150, 160], aF: [148, 160], dy: -22, fN: 30, fF: 30 }, 450]],
  },
  superman: {
    anchor: 'lowest',
    frames: [[{ t: 90, aN: [90, 90], aF: [92, 92], lN: [-90, -90], lF: [-90, -90] }, 800, 150], [{ t: 80, bend: -6, aN: [100, 100], aF: [102, 102], lN: [-100, -100], lF: [-100, -100] }, 800, 400]],
  },
  sideplank: {
    anchor: 'lowest',
    frames: [[{ t: 100, aN: [0, 90], aF: UP, lN: [-82, -82], lF: [-82, -82] }, 1500], [{ t: 103, aN: [0, 90], aF: [176, 176], lN: [-80, -80], lF: [-80, -80] }, 1500]],
  },

  // ─────────── Calisthenics ───────────
  pullup: {
    anchor: 'hand',
    props: [{ kind: 'bar' }],
    frames: [[{ aN: UP, aF: UP, lN: [5, -15], lF: [3, -15] }, 900, 150], [{ aN: [35, 195], aF: [33, 195], lN: [10, -20], lF: [8, -20] }, 900, 300]],
  },
  chinup: {
    anchor: 'hand',
    props: [{ kind: 'bar' }],
    frames: [[{ aN: UP, aF: UP, lN: [15, -30], lF: [13, -30] }, 900, 150], [{ aN: [40, 195], aF: [38, 195], lN: [20, -40], lF: [18, -40] }, 900, 300]],
  },
  negpullup: {
    anchor: 'hand',
    props: [{ kind: 'bar' }],
    frames: [[{ aN: [35, 195], aF: [33, 195], lN: [10, -20], lF: [8, -20] }, 2600, 300], [{ aN: UP, aF: UP, lN: [5, -15], lF: [3, -15] }, 500, 300]],
  },
  deadhang: {
    anchor: 'hand',
    props: [{ kind: 'bar' }],
    frames: [[{ aN: UP, aF: UP, lN: [3, -5], lF: [1, -5] }, 1500], [{ t: 178, aN: UP, aF: UP, lN: [6, -8], lF: [4, -8] }, 1500]],
  },
  dip: {
    anchor: 'hand',
    props: [{ kind: 'dipbar' }],
    frames: [[{ t: 178, aN: [0, 0], aF: [2, 2], lN: [5, -70], lF: [3, -70] }, 800, 150], [{ t: 160, aN: [-85, 15], aF: [-83, 15], lN: [15, -70], lF: [13, -70] }, 800, 250]],
  },
  pikepush: {
    anchor: 'hand',
    frames: [[{ t: 55, aN: [20, 20], aF: [22, 22], lN: [-15, -15], lF: [-15, -15] }, 800, 150], [{ t: 65, aN: [-35, 35], aF: [-33, 35], lN: [-30, -30], lF: [-30, -30] }, 800, 250]],
  },
  invrow: {
    anchor: 'ankle',
    props: [{ kind: 'lowbar' }],
    frames: [[{ t: 118, aN: [172, 172], aF: [170, 170], lN: [-62, -62], lF: [-62, -62] }, 800, 150], [{ t: 130, aN: [185, 100], aF: [183, 100], lN: [-50, -50], lF: [-50, -50] }, 800, 250]],
  },
  hollow: {
    anchor: 'lowest',
    frames: [[{ t: -100, bend: 5, aN: [-105, -105], aF: [-103, -103], lN: [100, 100], lF: [98, 98] }, 1400], [{ t: -102, bend: 6, aN: [-107, -107], aF: [-105, -105], lN: [102, 102], lF: [100, 100] }, 1400]],
  },
  legraise: {
    anchor: 'hand',
    props: [{ kind: 'bar' }],
    frames: [[{ aN: UP, aF: UP }, 900, 150], [{ t: 174, aN: UP, aF: UP, lN: [88, 88], lF: [86, 86] }, 900, 300]],
  },
  pistol: {
    anchor: 'ankle',
    frames: [[{ aN: [80, 80], aF: [78, 78], lF: [40, 40] }, 1000, 200], [{ t: 140, lN: [85, -35], lF: [80, 82], aN: [95, 95], aF: [93, 93] }, 1000, 250]],
  },

  // ─────────── Cardio ───────────
  jumprope: {
    anchor: 'lowest',
    props: [{ kind: 'rope' }],
    frames: [[{ aN: [12, 70], aF: [10, 70] }, 220], [{ aN: [12, 70], aF: [10, 70], dy: -9, fN: 40, fF: 40 }, 220]],
  },
  jacks: {
    anchor: 'lowest',
    frames: [[{ aN: [5, 5], aF: [-5, -5] }, 300], [{ aN: [170, 175], aF: [190, 185], lN: [14, 0], lF: [-14, 0], dy: -5 }, 300]],
  },
  highknees: {
    anchor: 'lowest',
    frames: [[{ lN: [90, 0], aN: [-30, 70], aF: [30, 110] }, 230], [{ lF: [90, 0], aN: [30, 110], aF: [-30, 70] }, 230]],
  },
  bike: {
    anchor: 'hip',
    props: [{ kind: 'bike' }],
    frames: [
      [{ t: 135, aN: [85, 70], aF: [83, 70], lN: [75, -15], lF: [25, 0] }, 250],
      [{ t: 135, aN: [85, 70], aF: [83, 70], lN: [55, 10], lF: [50, -25] }, 250],
      [{ t: 135, aN: [85, 70], aF: [83, 70], lN: [25, 0], lF: [75, -15] }, 250],
      [{ t: 135, aN: [85, 70], aF: [83, 70], lN: [50, -25], lF: [55, 10] }, 250],
    ],
  },
  rower: {
    anchor: 'ankle',
    props: [{ kind: 'rower' }],
    frames: [[{ t: 158, aN: [95, 95], aF: [93, 93], lN: [130, 30], lF: [128, 30] }, 700, 100], [{ t: 200, aN: [-60, 95], aF: [-58, 95], lN: [95, 90], lF: [93, 90] }, 900, 100]],
  },
  stairs: {
    anchor: 'lowest',
    props: [{ kind: 'step' }],
    frames: [[{ lN: [50, -10], aN: [-20, 40], aF: [20, 80] }, 500, 100], [{ lF: [-10, -40], aN: [20, 80], aF: [-20, 40], dy: -11 }, 500, 100]],
  },

  // ─────────── Running ───────────
  run: gaitAnim(10, 35, 170),
  jog: gaitAnim(6, 25, 220, 0.8),
  walk: { anchor: 'lowest', moving: true, frames: [[{ lN: [22, 5], lF: [-18, -10], aN: [-18, -10], aF: [18, 20] }, 380], [{ lN: [-18, -10], lF: [22, 5], aN: [18, 20], aF: [-18, -10] }, 380]] },
  sprint: gaitAnim(18, 55, 130, 1.25),

  // ─────────── Mobility ───────────
  catcow: { anchor: 'lowest', frames: [[{ ...QUAD, bend: -9 }, 1300, 200], [{ ...QUAD, t: 104, bend: 10 }, 1300, 200]] },
  hipflexor: {
    anchor: 'lowest',
    frames: [[{ lN: [90, 0], lF: [-5, -90], fF: 0, aN: [10, 10], aF: [8, 8] }, 1400, 300], [{ t: 186, lN: [70, -15], lF: [-30, -90], fF: 0, aN: [170, 175], aF: [168, 175] }, 1400, 600]],
  },
  worldsgreatest: {
    anchor: 'lowest',
    frames: [[{ t: 120, lN: [100, -15], lF: [-55, -80], aN: [5, 5], aF: [8, 8] }, 1200, 300], [{ t: 135, lN: [100, -15], lF: [-55, -80], aN: [178, 178], aF: [8, 8] }, 1200, 600]],
  },
  childpose: {
    anchor: 'lowest',
    frames: [[{ t: 78, aN: [95, 92], aF: [97, 94], lN: [60, -90], lF: [62, -90], fN: 0, fF: 0 }, 1600], [{ t: 82, aN: [97, 92], aF: [99, 94], lN: [60, -90], lF: [62, -90], fN: 0, fF: 0 }, 1600]],
  },
  hamstretch: {
    anchor: 'ankle',
    frames: [[{ t: 170, aN: [10, 10], aF: [8, 8] }, 1400, 200], [{ t: 98, aN: [5, 8], aF: [3, 6] }, 1400, 900]],
  },
  shoulderroll: {
    anchor: 'ankle',
    frames: [
      [{ aN: [0, 0], aF: [0, 0] }, 400],
      [{ aN: [90, 90], aF: [90, 90] }, 400],
      [{ aN: [180, 180], aF: [180, 180] }, 400],
      [{ aN: [270, 270], aF: [270, 270] }, 400],
      [{ aN: [360, 360], aF: [360, 360] }, 0],
    ],
  },
};

