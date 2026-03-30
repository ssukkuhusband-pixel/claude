// ─────────────────────────────────────────────
// Decoration System Data  —  v34 (20 decorations × 5 levels)
// Balatro-style combat multiplier system with simplified leveling
// ─────────────────────────────────────────────

const DECO_GACHA_COST = 2;
const DECO_MAX_SLOTS = 4;
const DECO_FRAGMENT_COST = [10, 20, 30, 40, 50];

const DECO_FRAGMENTS_PER_DRAW = 5;   // 1회 뽑기 시 획득 조각 수

const DECO_GRADE_RATES = [
  { grade: "A",   w: 40 },
  { grade: "S",   w: 30 },
  { grade: "SS",  w: 20 },
  { grade: "SSS", w: 10 },
];

// ─────────────────────────────────────────────
// v34 simplified leveling:
//   All 5 levels share the same conditionType.
//   Only baseValue / mult / conditionParams values change.
//   No bonuses, no jumpLabel, no capstoneLabel.
//
// multType: "mult" = 곱배율 (승산) — all v34 decorations
// conditionType: evaluateDecoration()에서 switch 분기
// icon: 이미지 경로
// levels[]: index 0 = Lv1, index 4 = Lv5
// ─────────────────────────────────────────────

const DECORATIONS = [

  // ═══════════════  A grade (5)  ═══════════════

  // ── d001: 깃털 부적 ──────────────────────────
  // 가로 체크 시 확률 곱배율. 방향 특화 입문.
  {
    id: "d001",
    grade: "A",
    name: "깃털 부적",
    icon: "images/charm_icons/icon_charm_4101.png",
    levels: [
      {
        multType: "mult",
        desc: "가로 체크 시 30% 확률로 해당 속성 데미지 x1.1",
        shortDesc: "가로 30% x1.1",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "H", chance: 0.3 },
        baseValue: 1.1,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "가로 체크 시 30% 확률로 해당 속성 데미지 x1.15",
        shortDesc: "가로 30% x1.15",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "H", chance: 0.3 },
        baseValue: 1.15,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "가로 체크 시 30% 확률로 해당 속성 데미지 x1.2",
        shortDesc: "가로 30% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "H", chance: 0.3 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "가로 체크 시 30% 확률로 해당 속성 데미지 x1.25",
        shortDesc: "가로 30% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "H", chance: 0.3 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "가로 체크 시 30% 확률로 해당 속성 데미지 x1.3",
        shortDesc: "가로 30% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "H", chance: 0.3 },
        baseValue: 1.3,
        timing: "perCheck",
      },
    ],
  },

  // ── d002: 바람개비 ──────────────────────────
  // 세로 체크 시 확률 곱배율. 방향 특화 입문.
  {
    id: "d002",
    grade: "A",
    name: "바람개비",
    icon: "images/charm_icons/icon_charm_4102.png",
    levels: [
      {
        multType: "mult",
        desc: "세로 체크 시 30% 확률로 해당 속성 데미지 x1.1",
        shortDesc: "세로 30% x1.1",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "V", chance: 0.3 },
        baseValue: 1.1,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "세로 체크 시 30% 확률로 해당 속성 데미지 x1.15",
        shortDesc: "세로 30% x1.15",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "V", chance: 0.3 },
        baseValue: 1.15,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "세로 체크 시 30% 확률로 해당 속성 데미지 x1.2",
        shortDesc: "세로 30% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "V", chance: 0.3 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "세로 체크 시 30% 확률로 해당 속성 데미지 x1.25",
        shortDesc: "세로 30% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "V", chance: 0.3 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "세로 체크 시 30% 확률로 해당 속성 데미지 x1.3",
        shortDesc: "세로 30% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "V", chance: 0.3 },
        baseValue: 1.3,
        timing: "perCheck",
      },
    ],
  },

  // ── d003: 작은 종 ──────────────────────────
  // 라운드 비례 스케일링. 장기전 입문.
  {
    id: "d003",
    grade: "A",
    name: "작은 종",
    icon: "images/charm_icons/icon_charm_4103.png",
    levels: [
      {
        multType: "mult",
        desc: "스핀 종료 후 현재 라운드 수에 비례하여 전체 데미지에 배율. 1R당 +0.03",
        shortDesc: "R당 +0.03",
        conditionType: "perRound",
        conditionParams: { perUnit: 0.03 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "스핀 종료 후 현재 라운드 수에 비례하여 전체 데미지에 배율. 1R당 +0.04",
        shortDesc: "R당 +0.04",
        conditionType: "perRound",
        conditionParams: { perUnit: 0.04 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "스핀 종료 후 현재 라운드 수에 비례하여 전체 데미지에 배율. 1R당 +0.05",
        shortDesc: "R당 +0.05",
        conditionType: "perRound",
        conditionParams: { perUnit: 0.05 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "스핀 종료 후 현재 라운드 수에 비례하여 전체 데미지에 배율. 1R당 +0.06",
        shortDesc: "R당 +0.06",
        conditionType: "perRound",
        conditionParams: { perUnit: 0.06 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "스핀 종료 후 현재 라운드 수에 비례하여 전체 데미지에 배율. 1R당 +0.07",
        shortDesc: "R당 +0.07",
        conditionType: "perRound",
        conditionParams: { perUnit: 0.07 },
        baseValue: 0,
      },
    ],
  },

  // ── d004: 구슬 팔찌 ──────────────────────────
  // 적 상태이상 종류 비례. 상태이상 빌드 서포트.
  {
    id: "d004",
    grade: "A",
    name: "구슬 팔찌",
    icon: "images/charm_icons/icon_charm_4104.png",
    levels: [
      {
        multType: "mult",
        desc: "적의 상태이상 종류 수에 비례. 1종당 +0.05",
        shortDesc: "상태이상종 +0.05",
        conditionType: "perStatusTypes",
        conditionParams: { perUnit: 0.05 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "적의 상태이상 종류 수에 비례. 1종당 +0.07",
        shortDesc: "상태이상종 +0.07",
        conditionType: "perStatusTypes",
        conditionParams: { perUnit: 0.07 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "적의 상태이상 종류 수에 비례. 1종당 +0.09",
        shortDesc: "상태이상종 +0.09",
        conditionType: "perStatusTypes",
        conditionParams: { perUnit: 0.09 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "적의 상태이상 종류 수에 비례. 1종당 +0.11",
        shortDesc: "상태이상종 +0.11",
        conditionType: "perStatusTypes",
        conditionParams: { perUnit: 0.11 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "적의 상태이상 종류 수에 비례. 1종당 +0.13",
        shortDesc: "상태이상종 +0.13",
        conditionType: "perStatusTypes",
        conditionParams: { perUnit: 0.13 },
        baseValue: 0,
      },
    ],
  },

  // ── d005: 나침반 ──────────────────────────
  // 대각선 체크 시 확률 곱배율. 방향 특화 입문.
  {
    id: "d005",
    grade: "A",
    name: "나침반",
    icon: "images/charm_icons/icon_charm_4103.png",
    levels: [
      {
        multType: "mult",
        desc: "대각선 체크 시 50% 확률로 해당 속성 데미지 x1.15",
        shortDesc: "대각 50% x1.15",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "D", chance: 0.5 },
        baseValue: 1.15,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "대각선 체크 시 50% 확률로 해당 속성 데미지 x1.2",
        shortDesc: "대각 50% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "D", chance: 0.5 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "대각선 체크 시 50% 확률로 해당 속성 데미지 x1.25",
        shortDesc: "대각 50% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "D", chance: 0.5 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "대각선 체크 시 50% 확률로 해당 속성 데미지 x1.3",
        shortDesc: "대각 50% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "D", chance: 0.5 },
        baseValue: 1.3,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "대각선 체크 시 50% 확률로 해당 속성 데미지 x1.35",
        shortDesc: "대각 50% x1.35",
        conditionType: "perCheckDirChance",
        conditionParams: { direction: "D", chance: 0.5 },
        baseValue: 1.35,
        timing: "perCheck",
      },
    ],
  },

  // ═══════════════  S grade (5)  ═══════════════

  // ── d006: 화염의 심장 ──────────────────────────
  // 화염+가로 특화 곱배율.
  {
    id: "d006",
    grade: "S",
    name: "화염의 심장",
    icon: "images/charm_icons/icon_charm_4203.png",
    levels: [
      {
        multType: "mult",
        desc: "화염+가로 체크 시 50% 확률로 화염 데미지 x1.2",
        shortDesc: "화염가로 50% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "fire", direction: "H", chance: 0.5 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "화염+가로 체크 시 50% 확률로 화염 데미지 x1.25",
        shortDesc: "화염가로 50% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "fire", direction: "H", chance: 0.5 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "화염+가로 체크 시 50% 확률로 화염 데미지 x1.3",
        shortDesc: "화염가로 50% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "fire", direction: "H", chance: 0.5 },
        baseValue: 1.3,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "화염+가로 체크 시 50% 확률로 화염 데미지 x1.35",
        shortDesc: "화염가로 50% x1.35",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "fire", direction: "H", chance: 0.5 },
        baseValue: 1.35,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "화염+가로 체크 시 50% 확률로 화염 데미지 x1.4",
        shortDesc: "화염가로 50% x1.4",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "fire", direction: "H", chance: 0.5 },
        baseValue: 1.4,
        timing: "perCheck",
      },
    ],
  },

  // ── d007: 뇌광의 결정 ──────────────────────────
  // 번개+세로 특화 곱배율.
  {
    id: "d007",
    grade: "S",
    name: "뇌광의 결정",
    icon: "images/charm_icons/icon_charm_4204.png",
    levels: [
      {
        multType: "mult",
        desc: "번개+세로 체크 시 50% 확률로 번개 데미지 x1.2",
        shortDesc: "번개세로 50% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "thunder", direction: "V", chance: 0.5 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "번개+세로 체크 시 50% 확률로 번개 데미지 x1.25",
        shortDesc: "번개세로 50% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "thunder", direction: "V", chance: 0.5 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "번개+세로 체크 시 50% 확률로 번개 데미지 x1.3",
        shortDesc: "번개세로 50% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "thunder", direction: "V", chance: 0.5 },
        baseValue: 1.3,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "번개+세로 체크 시 50% 확률로 번개 데미지 x1.35",
        shortDesc: "번개세로 50% x1.35",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "thunder", direction: "V", chance: 0.5 },
        baseValue: 1.35,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "번개+세로 체크 시 50% 확률로 번개 데미지 x1.4",
        shortDesc: "번개세로 50% x1.4",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "thunder", direction: "V", chance: 0.5 },
        baseValue: 1.4,
        timing: "perCheck",
      },
    ],
  },

  // ── d008: 생명의 이슬 ──────────────────────────
  // 자연+세로 특화 곱배율.
  {
    id: "d008",
    grade: "S",
    name: "생명의 이슬",
    icon: "images/charm_icons/icon_charm_4205.png",
    levels: [
      {
        multType: "mult",
        desc: "자연+세로 체크 시 50% 확률로 자연 데미지 x1.2",
        shortDesc: "자연세로 50% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "nature", direction: "V", chance: 0.5 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "자연+세로 체크 시 50% 확률로 자연 데미지 x1.25",
        shortDesc: "자연세로 50% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "nature", direction: "V", chance: 0.5 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "자연+세로 체크 시 50% 확률로 자연 데미지 x1.3",
        shortDesc: "자연세로 50% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "nature", direction: "V", chance: 0.5 },
        baseValue: 1.3,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "자연+세로 체크 시 50% 확률로 자연 데미지 x1.35",
        shortDesc: "자연세로 50% x1.35",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "nature", direction: "V", chance: 0.5 },
        baseValue: 1.35,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "자연+세로 체크 시 50% 확률로 자연 데미지 x1.4",
        shortDesc: "자연세로 50% x1.4",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "nature", direction: "V", chance: 0.5 },
        baseValue: 1.4,
        timing: "perCheck",
      },
    ],
  },

  // ── d009: 산호 목걸이 ──────────────────────────
  // 물+가로 특화 곱배율.
  {
    id: "d009",
    grade: "S",
    name: "산호 목걸이",
    icon: "images/charm_icons/icon_charm_4207.png",
    levels: [
      {
        multType: "mult",
        desc: "물+가로 체크 시 50% 확률로 물 데미지 x1.2",
        shortDesc: "물가로 50% x1.2",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "water", direction: "H", chance: 0.5 },
        baseValue: 1.2,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "물+가로 체크 시 50% 확률로 물 데미지 x1.25",
        shortDesc: "물가로 50% x1.25",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "water", direction: "H", chance: 0.5 },
        baseValue: 1.25,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "물+가로 체크 시 50% 확률로 물 데미지 x1.3",
        shortDesc: "물가로 50% x1.3",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "water", direction: "H", chance: 0.5 },
        baseValue: 1.3,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "물+가로 체크 시 50% 확률로 물 데미지 x1.35",
        shortDesc: "물가로 50% x1.35",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "water", direction: "H", chance: 0.5 },
        baseValue: 1.35,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "물+가로 체크 시 50% 확률로 물 데미지 x1.4",
        shortDesc: "물가로 50% x1.4",
        conditionType: "perCheckDirChance",
        conditionParams: { element: "water", direction: "H", chance: 0.5 },
        baseValue: 1.4,
        timing: "perCheck",
      },
    ],
  },

  // ── d010: 콤보 왕관 ──────────────────────────
  // 고콤보 스케일링. 콤보 5 이상에서 5콤보 단위 배율.
  {
    id: "d010",
    grade: "S",
    name: "콤보 왕관",
    icon: "images/charm_icons/icon_charm_4206.png",
    levels: [
      {
        multType: "mult",
        desc: "콤보 5 이상 시 매 5콤보당 +0.2배. (5콤보=x1.2 / 10콤보=x1.4)",
        shortDesc: "5콤보당 +0.2",
        conditionType: "comboScaling",
        conditionParams: { minCombo: 5, chunkSize: 5, perChunk: 0.2 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "콤보 5 이상 시 매 5콤보당 +0.22배. (5콤보=x1.22 / 10콤보=x1.44)",
        shortDesc: "5콤보당 +0.22",
        conditionType: "comboScaling",
        conditionParams: { minCombo: 5, chunkSize: 5, perChunk: 0.22 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "콤보 5 이상 시 매 5콤보당 +0.25배. (5콤보=x1.25 / 10콤보=x1.5)",
        shortDesc: "5콤보당 +0.25",
        conditionType: "comboScaling",
        conditionParams: { minCombo: 5, chunkSize: 5, perChunk: 0.25 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "콤보 5 이상 시 매 5콤보당 +0.28배. (5콤보=x1.28 / 10콤보=x1.56)",
        shortDesc: "5콤보당 +0.28",
        conditionType: "comboScaling",
        conditionParams: { minCombo: 5, chunkSize: 5, perChunk: 0.28 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "콤보 5 이상 시 매 5콤보당 +0.3배. (5콤보=x1.3 / 10콤보=x1.6)",
        shortDesc: "5콤보당 +0.3",
        conditionType: "comboScaling",
        conditionParams: { minCombo: 5, chunkSize: 5, perChunk: 0.3 },
        baseValue: 0,
      },
    ],
  },

  // ═══════════════  SS grade (5)  ═══════════════

  // ── d011: 심연의 눈 ──────────────────────────
  // HP 손실 비례. 위기 빌드.
  {
    id: "d011",
    grade: "SS",
    name: "심연의 눈",
    icon: "images/charm_icons/icon_charm_4301.png",
    levels: [
      {
        multType: "mult",
        desc: "HP 10% 손실당 +0.05배. HP 100%이면 미발동",
        shortDesc: "HP10%손실당 +0.05",
        conditionType: "perHpLoss",
        conditionParams: { per10pct: 0.05 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "HP 10% 손실당 +0.06배. HP 100%이면 미발동",
        shortDesc: "HP10%손실당 +0.06",
        conditionType: "perHpLoss",
        conditionParams: { per10pct: 0.06 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "HP 10% 손실당 +0.08배. HP 100%이면 미발동",
        shortDesc: "HP10%손실당 +0.08",
        conditionType: "perHpLoss",
        conditionParams: { per10pct: 0.08 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "HP 10% 손실당 +0.1배. HP 100%이면 미발동",
        shortDesc: "HP10%손실당 +0.1",
        conditionType: "perHpLoss",
        conditionParams: { per10pct: 0.1 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "HP 10% 손실당 +0.12배. HP 100%이면 미발동",
        shortDesc: "HP10%손실당 +0.12",
        conditionType: "perHpLoss",
        conditionParams: { per10pct: 0.12 },
        baseValue: 0,
      },
    ],
  },

  // ── d012: 무지개 프리즘 ──────────────────────────
  // 다속성 티어 배율. 속성 다양성 보상.
  {
    id: "d012",
    grade: "SS",
    name: "무지개 프리즘",
    icon: "images/charm_icons/icon_charm_4302.png",
    levels: [
      {
        multType: "mult",
        desc: "체크 속성 2종+ 시 종수별 배율. (2종=x1.3 / 3종=x1.5 / 4종=x1.7)",
        shortDesc: "2종x1.3 / 3종x1.5 / 4종x1.7",
        conditionType: "elementTypeTier",
        conditionParams: { tiers: { 2: 1.3, 3: 1.5, 4: 1.7 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "체크 속성 2종+ 시 종수별 배율. (2종=x1.35 / 3종=x1.55 / 4종=x1.75)",
        shortDesc: "2종x1.35 / 3종x1.55 / 4종x1.75",
        conditionType: "elementTypeTier",
        conditionParams: { tiers: { 2: 1.35, 3: 1.55, 4: 1.75 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "체크 속성 2종+ 시 종수별 배율. (2종=x1.4 / 3종=x1.6 / 4종=x1.8)",
        shortDesc: "2종x1.4 / 3종x1.6 / 4종x1.8",
        conditionType: "elementTypeTier",
        conditionParams: { tiers: { 2: 1.4, 3: 1.6, 4: 1.8 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "체크 속성 2종+ 시 종수별 배율. (2종=x1.45 / 3종=x1.65 / 4종=x1.85)",
        shortDesc: "2종x1.45 / 3종x1.65 / 4종x1.85",
        conditionType: "elementTypeTier",
        conditionParams: { tiers: { 2: 1.45, 3: 1.65, 4: 1.85 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "체크 속성 2종+ 시 종수별 배율. (2종=x1.5 / 3종=x1.7 / 4종=x1.9)",
        shortDesc: "2종x1.5 / 3종x1.7 / 4종x1.9",
        conditionType: "elementTypeTier",
        conditionParams: { tiers: { 2: 1.5, 3: 1.7, 4: 1.9 } },
        baseValue: 0,
      },
    ],
  },

  // ── d013: 용암의 맥박 ──────────────────────────
  // 속공 디케이. 초반 강력, 3R 이후 소멸.
  {
    id: "d013",
    grade: "SS",
    name: "용암의 맥박",
    icon: "images/charm_icons/icon_charm_4106.png",
    levels: [
      {
        multType: "mult",
        desc: "3R 이하 시 라운드별 배율. (1R=x1.3 / 2R=x1.2 / 3R=x1.1)",
        shortDesc: "1R x1.3 / 2R x1.2 / 3R x1.1",
        conditionType: "roundDecayTier",
        conditionParams: { tiers: { 1: 1.3, 2: 1.2, 3: 1.1 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "3R 이하 시 라운드별 배율. (1R=x1.35 / 2R=x1.25 / 3R=x1.15)",
        shortDesc: "1R x1.35 / 2R x1.25 / 3R x1.15",
        conditionType: "roundDecayTier",
        conditionParams: { tiers: { 1: 1.35, 2: 1.25, 3: 1.15 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "3R 이하 시 라운드별 배율. (1R=x1.4 / 2R=x1.3 / 3R=x1.2)",
        shortDesc: "1R x1.4 / 2R x1.3 / 3R x1.2",
        conditionType: "roundDecayTier",
        conditionParams: { tiers: { 1: 1.4, 2: 1.3, 3: 1.2 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "3R 이하 시 라운드별 배율. (1R=x1.45 / 2R=x1.35 / 3R=x1.25)",
        shortDesc: "1R x1.45 / 2R x1.35 / 3R x1.25",
        conditionType: "roundDecayTier",
        conditionParams: { tiers: { 1: 1.45, 2: 1.35, 3: 1.25 } },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "3R 이하 시 라운드별 배율. (1R=x1.5 / 2R=x1.4 / 3R=x1.3)",
        shortDesc: "1R x1.5 / 2R x1.4 / 3R x1.3",
        conditionType: "roundDecayTier",
        conditionParams: { tiers: { 1: 1.5, 2: 1.4, 3: 1.3 } },
        baseValue: 0,
      },
    ],
  },

  // ── d014: 가시 면류관 ──────────────────────────
  // 따가움 스택 비례. 자연 속성 시너지.
  {
    id: "d014",
    grade: "SS",
    name: "가시 면류관",
    icon: "images/charm_icons/icon_charm_4105.png",
    levels: [
      {
        multType: "mult",
        desc: "따가움 1스택당 +0.08배. 0스택이면 미발동",
        shortDesc: "따가움당 +0.08",
        conditionType: "perStatusStack",
        conditionParams: { statusType: "thorn", perStack: 0.08 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "따가움 1스택당 +0.1배. 0스택이면 미발동",
        shortDesc: "따가움당 +0.1",
        conditionType: "perStatusStack",
        conditionParams: { statusType: "thorn", perStack: 0.1 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "따가움 1스택당 +0.12배. 0스택이면 미발동",
        shortDesc: "따가움당 +0.12",
        conditionType: "perStatusStack",
        conditionParams: { statusType: "thorn", perStack: 0.12 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "따가움 1스택당 +0.14배. 0스택이면 미발동",
        shortDesc: "따가움당 +0.14",
        conditionType: "perStatusStack",
        conditionParams: { statusType: "thorn", perStack: 0.14 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "따가움 1스택당 +0.16배. 0스택이면 미발동",
        shortDesc: "따가움당 +0.16",
        conditionType: "perStatusStack",
        conditionParams: { statusType: "thorn", perStack: 0.16 },
        baseValue: 0,
      },
    ],
  },

  // ── d015: 서리꽃 ──────────────────────────
  // 미체크 심볼 비례. 저콤보 빌드.
  {
    id: "d015",
    grade: "SS",
    name: "서리꽃",
    icon: "images/charm_icons/icon_charm_4303.png",
    levels: [
      {
        multType: "mult",
        desc: "미체크 심볼 1개당 +0.03배. 잭팟이면 미발동",
        shortDesc: "미체크당 +0.03",
        conditionType: "perUnchecked",
        conditionParams: { perUnit: 0.03 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "미체크 심볼 1개당 +0.035배. 잭팟이면 미발동",
        shortDesc: "미체크당 +0.035",
        conditionType: "perUnchecked",
        conditionParams: { perUnit: 0.035 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "미체크 심볼 1개당 +0.04배. 잭팟이면 미발동",
        shortDesc: "미체크당 +0.04",
        conditionType: "perUnchecked",
        conditionParams: { perUnit: 0.04 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "미체크 심볼 1개당 +0.045배. 잭팟이면 미발동",
        shortDesc: "미체크당 +0.045",
        conditionType: "perUnchecked",
        conditionParams: { perUnit: 0.045 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "미체크 심볼 1개당 +0.05배. 잭팟이면 미발동",
        shortDesc: "미체크당 +0.05",
        conditionType: "perUnchecked",
        conditionParams: { perUnit: 0.05 },
        baseValue: 0,
      },
    ],
  },

  // ═══════════════  SSS grade (5)  ═══════════════

  // ── d016: 태양의 왕관 ──────────────────────────
  // 메타 버퍼. 좌측 장식 발동마다 곱배율 중첩.
  {
    id: "d016",
    grade: "SSS",
    name: "태양의 왕관",
    icon: "images/charm_icons/icon_charm_4402.png",
    levels: [
      {
        multType: "mult",
        desc: "좌측 장식 발동할 때마다 전체 데미지에 x1.05. 발동 횟수만큼 중첩",
        shortDesc: "좌측발동당 x1.05",
        conditionType: "leftDecoMeta",
        conditionParams: { perTrigger: 1.05 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "좌측 장식 발동할 때마다 전체 데미지에 x1.07. 발동 횟수만큼 중첩",
        shortDesc: "좌측발동당 x1.07",
        conditionType: "leftDecoMeta",
        conditionParams: { perTrigger: 1.07 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "좌측 장식 발동할 때마다 전체 데미지에 x1.1. 발동 횟수만큼 중첩",
        shortDesc: "좌측발동당 x1.1",
        conditionType: "leftDecoMeta",
        conditionParams: { perTrigger: 1.1 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "좌측 장식 발동할 때마다 전체 데미지에 x1.12. 발동 횟수만큼 중첩",
        shortDesc: "좌측발동당 x1.12",
        conditionType: "leftDecoMeta",
        conditionParams: { perTrigger: 1.12 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "좌측 장식 발동할 때마다 전체 데미지에 x1.15. 발동 횟수만큼 중첩",
        shortDesc: "좌측발동당 x1.15",
        conditionType: "leftDecoMeta",
        conditionParams: { perTrigger: 1.15 },
        baseValue: 0,
      },
    ],
  },

  // ── d017: 혼돈의 주사위 ──────────────────────────
  // 도박 장식. 50/50 확률 + 천장 시스템.
  {
    id: "d017",
    grade: "SSS",
    name: "혼돈의 주사위",
    icon: "images/charm_icons/icon_charm_4403.png",
    levels: [
      {
        multType: "mult",
        desc: "50% 확률로 x1.8 또는 x0.8. 연속 실패 3회 시 확정 성공",
        shortDesc: "성공x1.8 / 실패x0.8 / 천장3",
        conditionType: "gamble5050",
        conditionParams: { win: 1.8, lose: 0.8, ceiling: 3 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "50% 확률로 x1.85 또는 x0.85. 연속 실패 3회 시 확정 성공",
        shortDesc: "성공x1.85 / 실패x0.85 / 천장3",
        conditionType: "gamble5050",
        conditionParams: { win: 1.85, lose: 0.85, ceiling: 3 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "50% 확률로 x1.9 또는 x0.85. 연속 실패 3회 시 확정 성공",
        shortDesc: "성공x1.9 / 실패x0.85 / 천장3",
        conditionType: "gamble5050",
        conditionParams: { win: 1.9, lose: 0.85, ceiling: 3 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "50% 확률로 x1.95 또는 x0.9. 연속 실패 3회 시 확정 성공",
        shortDesc: "성공x1.95 / 실패x0.9 / 천장3",
        conditionType: "gamble5050",
        conditionParams: { win: 1.95, lose: 0.9, ceiling: 3 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "50% 확률로 x2.0 또는 x0.9. 연속 실패 3회 시 확정 성공",
        shortDesc: "성공x2.0 / 실패x0.9 / 천장3",
        conditionType: "gamble5050",
        conditionParams: { win: 2.0, lose: 0.9, ceiling: 3 },
        baseValue: 0,
      },
    ],
  },

  // ── d018: 영원의 모래시계 ──────────────────────────
  // 장기전 누적 곱배율. 5R부터 매 라운드 곱.
  {
    id: "d018",
    grade: "SSS",
    name: "영원의 모래시계",
    icon: "images/charm_icons/icon_charm_4404.png",
    levels: [
      {
        multType: "mult",
        desc: "5R부터 매 라운드 x1.1 누적. (5R=x1.1 / 6R=x1.21 / 7R=x1.33)",
        shortDesc: "5R부터 R당 x1.1누적",
        conditionType: "roundAccumMult",
        conditionParams: { startRound: 5, perRoundMult: 1.1 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "5R부터 매 라운드 x1.11 누적. (5R=x1.11 / 6R=x1.23 / 7R=x1.37)",
        shortDesc: "5R부터 R당 x1.11누적",
        conditionType: "roundAccumMult",
        conditionParams: { startRound: 5, perRoundMult: 1.11 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "5R부터 매 라운드 x1.13 누적. (5R=x1.13 / 6R=x1.28 / 7R=x1.44)",
        shortDesc: "5R부터 R당 x1.13누적",
        conditionType: "roundAccumMult",
        conditionParams: { startRound: 5, perRoundMult: 1.13 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "5R부터 매 라운드 x1.15 누적. (5R=x1.15 / 6R=x1.32 / 7R=x1.52)",
        shortDesc: "5R부터 R당 x1.15누적",
        conditionType: "roundAccumMult",
        conditionParams: { startRound: 5, perRoundMult: 1.15 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "5R부터 매 라운드 x1.17 누적. (5R=x1.17 / 6R=x1.37 / 7R=x1.60)",
        shortDesc: "5R부터 R당 x1.17누적",
        conditionType: "roundAccumMult",
        conditionParams: { startRound: 5, perRoundMult: 1.17 },
        baseValue: 0,
      },
    ],
  },

  // ── d019: 별의 파편 ──────────────────────────
  // 특수심볼 포함 체크 시 전체 곱배율.
  {
    id: "d019",
    grade: "SSS",
    name: "별의 파편",
    icon: "images/charm_icons/icon_charm_4401.png",
    levels: [
      {
        multType: "mult",
        desc: "특수심볼 포함 체크 시 전체 데미지에 x1.1",
        shortDesc: "특수심볼체크 x1.1",
        conditionType: "perCheckSpecial",
        conditionParams: {},
        baseValue: 1.1,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "특수심볼 포함 체크 시 전체 데미지에 x1.12",
        shortDesc: "특수심볼체크 x1.12",
        conditionType: "perCheckSpecial",
        conditionParams: {},
        baseValue: 1.12,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "특수심볼 포함 체크 시 전체 데미지에 x1.15",
        shortDesc: "특수심볼체크 x1.15",
        conditionType: "perCheckSpecial",
        conditionParams: {},
        baseValue: 1.15,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "특수심볼 포함 체크 시 전체 데미지에 x1.17",
        shortDesc: "특수심볼체크 x1.17",
        conditionType: "perCheckSpecial",
        conditionParams: {},
        baseValue: 1.17,
        timing: "perCheck",
      },
      {
        multType: "mult",
        desc: "특수심볼 포함 체크 시 전체 데미지에 x1.2",
        shortDesc: "특수심볼체크 x1.2",
        conditionType: "perCheckSpecial",
        conditionParams: {},
        baseValue: 1.2,
        timing: "perCheck",
      },
    ],
  },

  // ── d020: 부서진 거울 ──────────────────────────
  // 피격 보복. 직전 라운드 피격 횟수 비례.
  {
    id: "d020",
    grade: "SSS",
    name: "부서진 거울",
    icon: "images/charm_icons/icon_charm_4106.png",
    levels: [
      {
        multType: "mult",
        desc: "직전 라운드 피격 1회당 +0.3배. 미피격 시 미발동",
        shortDesc: "피격당 +0.3",
        conditionType: "perHitLastRound",
        conditionParams: { perHit: 0.3 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "직전 라운드 피격 1회당 +0.32배. 미피격 시 미발동",
        shortDesc: "피격당 +0.32",
        conditionType: "perHitLastRound",
        conditionParams: { perHit: 0.32 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "직전 라운드 피격 1회당 +0.35배. 미피격 시 미발동",
        shortDesc: "피격당 +0.35",
        conditionType: "perHitLastRound",
        conditionParams: { perHit: 0.35 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "직전 라운드 피격 1회당 +0.38배. 미피격 시 미발동",
        shortDesc: "피격당 +0.38",
        conditionType: "perHitLastRound",
        conditionParams: { perHit: 0.38 },
        baseValue: 0,
      },
      {
        multType: "mult",
        desc: "직전 라운드 피격 1회당 +0.4배. 미피격 시 미발동",
        shortDesc: "피격당 +0.4",
        conditionType: "perHitLastRound",
        conditionParams: { perHit: 0.4 },
        baseValue: 0,
      },
    ],
  },

];

// ─────────────────────────────────────────────
// Lookup maps
// ─────────────────────────────────────────────

const DECO_BY_ID = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]));

const DECO_IDS_BY_GRADE = {
  A:   DECORATIONS.filter((d) => d.grade === "A").map((d) => d.id),
  S:   DECORATIONS.filter((d) => d.grade === "S").map((d) => d.id),
  SS:  DECORATIONS.filter((d) => d.grade === "SS").map((d) => d.id),
  SSS: DECORATIONS.filter((d) => d.grade === "SSS").map((d) => d.id),
};
