/* Prototype: 5x3 slot + checks (H/V/diagonal), damage stack, 1v1 turns, enemy passives, level-up skills. */

const ROWS = 3;
const COLS = 5;

const CHAPTER_SIZE = 10;
const FINAL_BOSS_STAGE = CHAPTER_SIZE;

const SAVE_KEY = "luckyday_save_v1";

const OLD_TO_NEW_PET_MAP = {
  "mangi": "1001", "warrior_mangi": "2002", "forest_slime": "2005",
  "nature_spirit": "2004", "snow_mangi": "3003", "corrupted_spirit": "3004",
  "thorn_mangi": "4004", "flower_dambi": "4001", "dune_master": "3007",
  "witch_mushroom": "2007", "witch_statue": "4005", "butcher": "4007",
  "temple_golem": "5007", "fallen_witch": "5006", "arachne": "5003",
  "desert_claw": "5004",
};

function emptyPetMeta() {
  return {
    inventory: {},       // { petId: count } - how many copies you have
    enhancement: {},     // { petId: enhanceLevel } - 0 to maxEnhance
    equippedPetIds: [],  // up to 2
    petFood: 0,          // currency from synthesis
  };
}

// ═══════════════════════════════════════════
//   DECORATION META (추억장식 세이브)
// ═══════════════════════════════════════════

function emptyDecoMeta() {
  return {
    fragments: {},         // { decoId: 조각수 }
    levels: {},            // { decoId: 1~5 } (없으면 미보유)
    equippedDecoIds: [null, null, null, null],   // 고정 4슬롯 (null = 빈칸)
  };
}

function sanitizeDecoMeta(raw) {
  const base = emptyDecoMeta();
  if (!raw || typeof raw !== "object") return base;

  // ── v1 → v2 마이그레이션 (inventory → fragments + levels) ──
  if (raw.inventory && !raw.fragments && !raw.levels) {
    const inv = typeof raw.inventory === "object" ? raw.inventory : {};
    for (const d of DECORATIONS) {
      const cnt = Number(inv[d.id]);
      if (Number.isFinite(cnt) && cnt >= 1) {
        base.levels[d.id] = 1;                       // 보유 → Lv1
        base.fragments[d.id] = Math.floor(cnt) - 1;  // 추가 카피 → 조각으로
      }
    }
  } else {
    // ── v2 포맷 검증 ──
    const frags = raw.fragments && typeof raw.fragments === "object" ? raw.fragments : {};
    for (const d of DECORATIONS) {
      const f = Number(frags[d.id]);
      if (Number.isFinite(f) && f > 0) base.fragments[d.id] = Math.floor(f);
    }
    const lvs = raw.levels && typeof raw.levels === "object" ? raw.levels : {};
    for (const d of DECORATIONS) {
      const lv = Number(lvs[d.id]);
      if (Number.isFinite(lv) && lv >= 1) base.levels[d.id] = Math.min(Math.floor(lv), 5);
    }
  }

  // ── 장착 검증 (고정 4슬롯) ──
  const eqList = Array.isArray(raw.equippedDecoIds) ? raw.equippedDecoIds : [];
  const nextEq = [null, null, null, null];
  const usedIds = new Set();
  for (let i = 0; i < DECO_MAX_SLOTS; i++) {
    const id = eqList[i];
    if (typeof id !== "string") continue;
    if (!DECO_BY_ID[id]) continue;
    if (!base.levels[id] || base.levels[id] < 1) continue;
    if (usedIds.has(id)) continue;
    nextEq[i] = id;
    usedIds.add(id);
  }
  base.equippedDecoIds = nextEq;
  return base;
}

// ═══════════════════════════════════════════
//   EQUIPMENT META (장비 세이브)
// ═══════════════════════════════════════════

function emptyEquipMeta() {
  return {
    inventory: {},   // { rootId: { grades: { gradeNum: count } } }
    equippedIds: [null, null, null, null, null, null],  // index = partType-1
    equippedGrades: [0, 0, 0, 0, 0, 0],                 // index = partType-1
  };
}

function sanitizeEquipMeta(raw) {
  const base = emptyEquipMeta();
  if (!raw || typeof raw !== "object") return base;

  const inv = raw.inventory && typeof raw.inventory === "object" ? raw.inventory : {};
  for (const e of EQUIPMENT) {
    const entry = inv[e.rootId];
    if (!entry || typeof entry !== "object") continue;
    const maxG = e.tier === 1 ? 10 : 11;

    // 신규 포맷: { grades: { gradeNum: count } }
    if (entry.grades && typeof entry.grades === "object") {
      const cleanGrades = {};
      for (const [gStr, cnt] of Object.entries(entry.grades)) {
        const g = Number(gStr);
        const c = Number(cnt);
        if (Number.isFinite(g) && g >= 1 && g <= maxG && Number.isFinite(c) && c >= 1) {
          cleanGrades[Math.floor(g)] = Math.floor(c);
        }
      }
      if (Object.keys(cleanGrades).length > 0) {
        base.inventory[e.rootId] = { grades: cleanGrades };
      }
      continue;
    }

    // 구 포맷 마이그레이션: { grade, count } → { grades: { grade: count } }
    const g = Number(entry.grade);
    const c = Number(entry.count);
    if (Number.isFinite(g) && g >= 1 && Number.isFinite(c) && c >= 1) {
      base.inventory[e.rootId] = { grades: { [Math.min(Math.floor(g), maxG)]: Math.max(1, Math.floor(c)) } };
    }
  }

  const eqList = Array.isArray(raw.equippedIds) ? raw.equippedIds : [];
  const eqGradeList = Array.isArray(raw.equippedGrades) ? raw.equippedGrades : [];
  const nextEq = [null, null, null, null, null, null];
  const nextEqGrades = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < EQUIP_MAX_SLOTS; i++) {
    const rid = eqList[i];
    if (rid == null) continue;
    const rootId = Number(rid);
    const equip = EQUIP_BY_ROOT[rootId];
    if (!equip) continue;
    if (!base.inventory[rootId]) continue;
    if (equip.equipmentType !== (i + 1)) continue;
    const equippedGrade = Math.max(0, Math.floor(Number(eqGradeList[i]) || 0));
    if (equippedGrade <= 0) continue;
    if (!base.inventory[rootId].grades || (base.inventory[rootId].grades[equippedGrade] || 0) <= 0) continue;
    nextEq[i] = rootId;
    nextEqGrades[i] = equippedGrade;
  }
  base.equippedIds = nextEq;
  base.equippedGrades = nextEqGrades;
  return base;
}

function equipGradeFromInventory(entry) {
  if (!entry || !entry.grades) return 0;
  const grades = Object.keys(entry.grades).map(Number).filter((g) => entry.grades[g] > 0);
  return grades.length ? Math.max(...grades) : 0;
}

// ═══════════════════════════════════════════

function sanitizePetMeta(raw) {
  const base = emptyPetMeta();
  if (!raw || typeof raw !== "object") return base;

  // Detect old format and migrate
  if (raw.shards && raw.levels && !raw.inventory) {
    const oldLevels = raw.levels || {};
    const oldEquipped = Array.isArray(raw.equippedPetIds) ? raw.equippedPetIds :
                        raw.equippedPetId ? [raw.equippedPetId] : [];
    for (const [oldId, newId] of Object.entries(OLD_TO_NEW_PET_MAP)) {
      const lv = Number(oldLevels[oldId]) || 0;
      if (lv > 0) {
        base.inventory[newId] = 1;
        const pet = PET_BY_ID[newId];
        if (pet) base.enhancement[newId] = Math.min(lv - 1, pet.maxEnhance);
      }
    }
    const mappedEq = oldEquipped.map(id => OLD_TO_NEW_PET_MAP[id]).filter(Boolean);
    base.equippedPetIds = mappedEq.slice(0, 2).filter(id => base.inventory[id] >= 1);
    base.petFood = Math.max(0, Math.floor(Number(raw.universalShards) || 0));
    return base;
  }

  // New format validation
  const inv = raw.inventory && typeof raw.inventory === "object" ? raw.inventory : {};
  const enh = raw.enhancement && typeof raw.enhancement === "object" ? raw.enhancement : {};
  for (const p of PETS) {
    const cnt = Number(inv[p.id]);
    if (Number.isFinite(cnt) && cnt > 0) base.inventory[p.id] = Math.floor(cnt);
    const enhLv = Number(enh[p.id]);
    if (Number.isFinite(enhLv) && enhLv > 0) base.enhancement[p.id] = Math.min(Math.floor(enhLv), p.maxEnhance);
  }
  const pf = Number(raw.petFood);
  base.petFood = Number.isFinite(pf) ? Math.max(0, Math.floor(pf)) : 0;

  const eqList = Array.isArray(raw.equippedPetIds) ? raw.equippedPetIds : [];
  const nextEq = [];
  for (const id of eqList) {
    if (typeof id !== "string") continue;
    if (!PET_BY_ID[id]) continue;
    if (!base.inventory[id] || base.inventory[id] < 1) continue;
    if (nextEq.includes(id)) continue;
    nextEq.push(id);
    if (nextEq.length >= 2) break;
  }
  base.equippedPetIds = nextEq;
  return base;
}

function loadMeta() {
  try {
    const raw = window.localStorage ? window.localStorage.getItem(SAVE_KEY) : null;
    if (!raw) {
      return { gold: 10000, accountLevel: 0, unlockedChapter: 1, selectedChapter: 1, pet: emptyPetMeta(), deco: emptyDecoMeta(), equip: emptyEquipMeta() };
    }
    const parsed = JSON.parse(raw);
    const gold = Number.isFinite(parsed.gold) ? Math.max(0, Math.floor(parsed.gold)) : 10000;
    const accountLevel = Number.isFinite(parsed.accountLevel) ? Math.max(0, Math.floor(parsed.accountLevel)) : 0;
    const unlockedChapter = Number.isFinite(parsed.unlockedChapter) ? Math.max(1, Math.floor(parsed.unlockedChapter)) : 1;
    const selectedChapter = Number.isFinite(parsed.selectedChapter)
      ? Math.max(1, Math.min(unlockedChapter, Math.floor(parsed.selectedChapter)))
      : 1;
    const pet = sanitizePetMeta(parsed.pet);
    const deco = sanitizeDecoMeta(parsed.deco);
    const equip = sanitizeEquipMeta(parsed.equip);
    return { gold, accountLevel, unlockedChapter, selectedChapter, pet, deco, equip };
  } catch {
    return { gold: 10000, accountLevel: 0, unlockedChapter: 1, selectedChapter: 1, pet: emptyPetMeta(), deco: emptyDecoMeta(), equip: emptyEquipMeta() };
  }
}

function saveMeta(meta) {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function resetMeta() {
  META.gold = 10000;
  META.accountLevel = 0;
  META.unlockedChapter = 1;
  META.selectedChapter = 1;
  META.pet = emptyPetMeta();
  META.deco = emptyDecoMeta();
  META.equip = emptyEquipMeta();
  try {
    if (window.localStorage) window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
  saveMeta(META);
}

const META = loadMeta();
if (!META.pet) META.pet = emptyPetMeta();
if (!META.deco) META.deco = emptyDecoMeta();
if (!META.equip) META.equip = emptyEquipMeta();

function metaLevelCost(nextAccountLevel) {
  const n = Math.max(0, Math.floor(nextAccountLevel));
  return 10;
}

function growthStatsForAccountLevel(accountLevel) {
  const n = Math.max(0, Math.floor(accountLevel || 0));
  const level = Math.floor(n / 10) + 1;
  const step = n % 10;
  const baseDamage = 100 + (25 * (level - 1) * level) + (5 * level * step);
  const maxHp = baseDamage * 2;
  return { level, step, maxHp, baseDamage };
}

function metaBonuses(accountLevel) {
  const current = growthStatsForAccountLevel(accountLevel);
  if (!Number.isFinite(accountLevel) || accountLevel <= 0) {
    return { maxHp: 0, baseDamage: 0, totalMaxHp: current.maxHp, totalBaseDamage: current.baseDamage };
  }
  const prev = growthStatsForAccountLevel(accountLevel - 1);
  return {
    maxHp: current.maxHp - prev.maxHp,
    baseDamage: current.baseDamage - prev.baseDamage,
    totalMaxHp: current.maxHp,
    totalBaseDamage: current.baseDamage,
  };
}

function goldRewardForWin(chapter, stage, isBoss) {
  const ch = Math.max(1, Math.floor(chapter || 1));
  const st = Math.max(1, Math.floor(stage || 1));
  const base = 12;
  const chapterBonus = (ch - 1) * 3;
  const stageBonus = Math.min(8, st);
  const bossBonus = isBoss ? 15 : 0;
  return Math.ceil((base + chapterBonus + stageBonus + bossBonus) * 1.3);
}

const LENGTH_MULT = {
  3: 1.0,
  4: 1.5,
  5: 2.0,
};

const BASE_SYMBOLS = [
  { id: "fire", label: "F", name: "화염", mult: 1.0 },
  { id: "light", label: "L", name: "번개", mult: 1.15 },
  { id: "nature", label: "N", name: "자연", mult: 0.95 },
  { id: "water", label: "W", name: "물", mult: 1.05 },
];

const HYBRID_SYMBOLS = [
  { id: "fire_light", label: "F/L", name: "화염+번개" },
  { id: "fire_nature", label: "F/N", name: "화염+자연" },
  { id: "fire_water", label: "F/W", name: "화염+물" },
  { id: "light_nature", label: "L/N", name: "번개+자연" },
  { id: "light_water", label: "L/W", name: "번개+물" },
  { id: "nature_water", label: "N/W", name: "자연+물" },
];

const HYBRID_BY_ID = {
  fire_light: { a: "fire", b: "light" },
  fire_nature: { a: "fire", b: "nature" },
  fire_water: { a: "fire", b: "water" },
  light_nature: { a: "light", b: "nature" },
  light_water: { a: "light", b: "water" },
  nature_water: { a: "nature", b: "water" },
};

const VARIANT_SYMBOLS = [
  { id: "fire_burn", label: "Fb", name: "화상" },
  { id: "fire_flame", label: "Ff", name: "화염" },
  { id: "fire_double_rune", label: "Fd", name: "더블 룬" },
  { id: "fire_crit_rune", label: "Fc", name: "치명 룬" },
  { id: "fire_power", label: "Fp", name: "파워" },
  { id: "fire_row", label: "Fh", name: "가로 불" },
  { id: "fire_col", label: "Fv", name: "세로 불" },
  { id: "fire_ember", label: "Fe", name: "잿불" },
  { id: "nature_thorn", label: "Nt", name: "가시" },
  { id: "nature_double_rune", label: "Nd", name: "더블 룬" },
  { id: "nature_crit_rune", label: "Nc", name: "치명 룬" },
  { id: "nature_heal", label: "Nh", name: "회복" },
  { id: "nature_row", label: "Nh", name: "가로 자연" },
  { id: "nature_col", label: "Nv", name: "세로 자연" },
  { id: "nature_gale", label: "Ng", name: "칼바람" },
  { id: "light_thunder", label: "Lt", name: "천둥" },
  { id: "light_double_rune", label: "Ld", name: "더블 룬" },
  { id: "light_crit_rune", label: "Lr", name: "치명 룬" },
  { id: "light_chain", label: "Lc", name: "연속" },
  { id: "light_row", label: "Lh", name: "가로 번개" },
  { id: "light_col", label: "Lv", name: "세로 번개" },
  { id: "light_strike", label: "Ls", name: "낙뢰" },
  { id: "light_shockwave", label: "Lw", name: "충격파" },
  { id: "water_slip", label: "Ws", name: "미끌" },
  { id: "water_double_rune", label: "Wd", name: "더블 룬" },
  { id: "water_crit_rune", label: "Wc", name: "치명 룬" },
  { id: "water_row", label: "Wh", name: "가로 물" },
  { id: "water_col", label: "Wv", name: "세로 물" },
  { id: "water_freeze", label: "Wf", name: "빙결" },
  { id: "water_ice_armor", label: "Wi", name: "얼음보호막" },
  { id: "star", label: "★", name: "별" },
  // ── v2 신규 특수심볼 ──
  { id: "light_bolt", label: "Lb", name: "낙뢰" },
  { id: "nature_thorn_v", label: "Nv", name: "가시" },
  { id: "water_ice", label: "Wi2", name: "얼음" },
  { id: "light_thunder_sym", label: "Lts", name: "천둥" },
  { id: "water_protect", label: "Wp", name: "보호" },
  // ── 만능 심볼 ──
  { id: "rainbow", label: "🌈", name: "만능" },
];

const VARIANT_BY_ID = {
  fire_burn: "fire",
  fire_flame: "fire",
  fire_double_rune: "fire",
  fire_crit_rune: "fire",
  fire_power: "fire",
  fire_row: "fire",
  fire_col: "fire",
  fire_ember: "fire",
  nature_thorn: "nature",
  nature_double_rune: "nature",
  nature_crit_rune: "nature",
  nature_heal: "nature",
  nature_row: "nature",
  nature_col: "nature",
  nature_gale: "nature",
  light_thunder: "light",
  light_double_rune: "light",
  light_crit_rune: "light",
  light_chain: "light",
  light_row: "light",
  light_col: "light",
  light_strike: "light",
  light_shockwave: "light",
  water_slip: "water",
  water_double_rune: "water",
  water_crit_rune: "water",
  water_row: "water",
  water_col: "water",
  water_freeze: "water",
  water_ice_armor: "water",
  // ── v2 신규 특수심볼 ──
  light_bolt: "light",
  nature_thorn_v: "nature",
  water_ice: "water",
  light_thunder_sym: "light",
  water_protect: "water",
};

const VARIANT_CHANCE = 0.15;
const CONSTELLATION_MULT = 3.0;
const PATTERN_MULT = 3.0;
const JACKPOT_MULT = 5.0;

const DOUBLE_RUNE_VARIANTS = ["fire_double_rune", "light_double_rune", "nature_double_rune", "water_double_rune"];
const CRIT_RUNE_VARIANTS = ["fire_crit_rune", "light_crit_rune", "nature_crit_rune", "water_crit_rune"];

const SYMBOLS = BASE_SYMBOLS.concat(HYBRID_SYMBOLS, VARIANT_SYMBOLS);

const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));

// NOTE: enemies moved to data/enemies.js
// NOTE: passives moved to data/passives.js
// NOTE: skills moved to data/skills.js
const $ = (id) => document.getElementById(id);

const ui = {
  chapter: $("chapter"),
  stage: $("stage"),
  level: $("level"),
  xp: $("xp"),
  gold: $("gold"),
  turn: $("turnText"),
  gridWrap: $("gridWrap"),
  fx: $("fx"),
  talismanLayer: $("talismanLayer"),
  fxToast: $("fxToast"),
  luckyBadge: $("luckyBadge"),
  grid: $("grid"),
  spinBtn: $("spinBtn"),
  spinModeLabel: $("spinModeLabel"),
  evoHud: $("evoHud"),
  resetBtn: $("resetBtn"),
  previewBtn: $("previewBtn"),
  petSkillInfo: $("petSkillInfo"),
  spinDamage: $("spinDamage"),
  spinChecks: $("spinChecks"),
  jackpotText: $("jackpotText"),
  playerName: $("playerName"),
  playerHpText: $("playerHpText"),
  playerBattleHpText: $("playerBattleHpText"),
  playerHpBar: $("playerHpBar"),
  playerStatusRow: $("playerStatusRow"),
  playerStats: $("playerStats"),
  symbolOdds: $("symbolOdds"),
  skills: $("skills"),
  playerPanel: $("playerPanel"),
  journey: $("journey"),
  journeyHero: $("journeyHero"),
  journeyEnemy: $("journeyEnemy"),
  journeyHeroName: $("journeyHeroName"),
  journeyEnemyName: $("journeyEnemyName"),

  journeyHeroExtra: $("journeyHeroExtra"),
  journeyHeroStatus: $("journeyHeroStatus"),
  journeyEnemyExtra: $("journeyEnemyExtra"),
  journeyEnemyStatus: $("journeyEnemyStatus"),
  enemyName: $("enemyName"),
  enemyPanel: $("enemyPanel"),
  enemyStatusRow: $("enemyStatusRow"),
  enemyFx: $("enemyFx"),
  enemyHpText: $("enemyHpText"),
  enemyHpBar: $("enemyHpBar"),
  enemyStats: $("enemyStats"),
  log: $("log"),
  modal: $("modal"),
  choices: $("choices"),
  startScreen: $("startScreen"),
  startTitle: $("startTitle"),
  startSubtitle: $("startSubtitle"),
  startGameBtn: $("startGameBtn"),
  langButtons: $("langButtons"),
  petEquippedText: $("petEquippedText"),
  petDrawBtn: $("petDrawBtn"),
  petDraw10Btn: $("petDraw10Btn"),
  petDrawResult: $("petDrawResult"),
  petList: $("petList"),
  petDrawModal: $("petDrawModal"),
  petDrawCloseBtn: $("petDrawCloseBtn"),
  petDrawSummary: $("petDrawSummary"),
  petDrawList: $("petDrawList"),
  petGrid: $("petGrid"),
  petSlot0: $("petSlot0"),
  petSlot1: $("petSlot1"),
  myinfoTabs: $("myinfoTabs"),
  petDetailModal: $("petDetailModal"),
  petDetailCloseBtn: $("petDetailCloseBtn"),
  petDetailIconWrap: $("petDetailIconWrap"),
  petDetailGrade: $("petDetailGrade"),
  petDetailName: $("petDetailName"),
  petDetailActions: $("petDetailActions"),

  // ── Equipment UI ──
  equipDrawBtn: $("equipDrawBtn"),
  equipDraw10Btn: $("equipDraw10Btn"),
  equipAutoBtn: $("equipAutoBtn"),
  equipGrid: $("equipGrid"),
  equipSlot0: $("equipSlot0"),
  equipSlot1: $("equipSlot1"),
  equipSlot2: $("equipSlot2"),
  equipSlot3: $("equipSlot3"),
  equipSlot4: $("equipSlot4"),
  equipSlot5: $("equipSlot5"),
  equipDetailModal: $("equipDetailModal"),
  equipDetailCloseBtn: $("equipDetailCloseBtn"),
  equipInnerTabs: $("equipInnerTabs"),
  equipMergeBtn: $("equipMergeBtn"),

  // ── Decoration UI ──
  decoGrid: $("decoGrid"),
  decoSlot0: $("decoSlot0"),
  decoSlot1: $("decoSlot1"),
  decoSlot2: $("decoSlot2"),
  decoSlot3: $("decoSlot3"),
  decoDrawBtn: $("decoDrawBtn"),
  decoDraw10Btn: $("decoDraw10Btn"),
  decoDrawResult: $("decoDrawResult"),
  decoDetailModal: $("decoDetailModal"),
  decoDetailCloseBtn: $("decoDetailCloseBtn"),
  decoDetailIconWrap: $("decoDetailIconWrap"),
  decoDetailGrade: $("decoDetailGrade"),
  decoDetailMultBadge: $("decoDetailMultBadge"),
  decoDetailName: $("decoDetailName"),
  decoDetailShortDesc: $("decoDetailShortDesc"),
  decoDetailDesc: $("decoDetailDesc"),
  decoDetailActions: $("decoDetailActions"),

  // ── Scoreboard (전광판) ──
  scoreboard: $("scoreboard"),
  sbDecos: $("sbDecos"),
  sbDamages: $("sbDamages"),
  sbFire: $("sbFire"),
  sbLight: $("sbLight"),
  sbNature: $("sbNature"),
  sbWater: $("sbWater"),
  sbFireVal: $("sbFireVal"),
  sbLightVal: $("sbLightVal"),
  sbNatureVal: $("sbNatureVal"),
  sbWaterVal: $("sbWaterVal"),
  sbMultWrap: $("sbMultWrap"),
  sbMultBg: $("sbMultBg"),
  sbMultVal: $("sbMultVal"),
  sbSparkles: $("sbSparkles"),
  sbComboNum: $("sbComboNum"),

  heroBuffRow: $("heroBuffRow"),
  enemyBuffRow: $("enemyBuffRow"),

  modalArt: $("modalArt"),

  accountLevelText: $("accountLevelText"),
  goldText: $("goldText"),
  levelUpHint: $("levelUpHint"),
  resetMetaBtn: $("resetMetaBtn"),
  chapterPrevBtn: $("chapterPrevBtn"),
  chapterNextBtn: $("chapterNextBtn"),
  chapterSelectText: $("chapterSelectText"),
  chapterThemeText: $("chapterThemeText"),
  chapterTraitName: $("chapterTraitName"),
  chapterTraitDesc: $("chapterTraitDesc"),
  chapterTraitCounter: $("chapterTraitCounter"),
  bossPassivesList: $("bossPassivesList"),
  levelUpBtn: $("levelUpBtn"),
  growthLevelText: $("growthLevelText"),
  growthLevelHint: $("growthLevelHint"),
  lobbyNav: $("lobbyNav"),

  helpBtn: $("helpBtn"),
  helpModal: $("helpModal"),
  helpKicker: $("helpKicker"),
  helpTitle: $("helpTitle"),
  helpMessage: $("helpMessage"),
  helpSteps: $("helpSteps"),
  helpHint: $("helpHint"),
  helpCloseBtn: $("helpCloseBtn"),

  codexBtnWide: $("codexBtnWide"),
  codexModal: $("codexModal"),
  codexKicker: $("codexKicker"),
  codexTitle: $("codexTitle"),
  codexHint: $("codexHint"),
  codexCloseBtn: $("codexCloseBtn"),
  codexTabs: $("codexTabs"),
  codexBody: $("codexBody"),
  codexListLight: $("codexListLight"),
  codexListNature: $("codexListNature"),
  codexListFire: $("codexListFire"),
  codexListWater: $("codexListWater"),
  codexListFusion: $("codexListFusion"),
  codexListLuck: $("codexListLuck"),
  codexListCommon: $("codexListCommon"),

  petSkillBtn: $("petSkillBtn"),
  petSkillBtn2: $("petSkillBtn2"),
};

function statusCountFor(entity) {
  const s = entity && entity.status ? entity.status : null;
  if (!s) return 0;
  let n = 0;
  if (s.burnTurns > 0 && (s.burnStacks || 0) > 0) n++;
  if (s.bleedTurns > 0 && (s.bleedStacks || 0) > 0) n++;
  if ((s.frozenTurns || 0) > 0) n++;
  if ((s.stunnedTurns || 0) > 0) n++;
  if ((s.shockTurns || 0) > 0) n++;
  if ((s.weakenTurns || 0) > 0) n++;
  if ((s.talismanSealTurns || 0) > 0) n++;
  if ((s.tileSealTurns || 0) > 0) n++;
  if ((s.lockHTurns || 0) > 0) n++;
  if ((s.lockVTurns || 0) > 0) n++;
  return n;
}

function renderJourneyIndicators() {
  const now = Date.now();
  const enemy = state.enemy;
  const player = state.player;

  // Status
  const pStatus = statusCountFor(player);
  const eStatus = statusCountFor(enemy);
  const prev = state.journeyFx || { pStatus: 0, eStatus: 0, eExtraUntil: 0, eExtra: 0 };

  if (ui.journeyHeroStatus) {
    ui.journeyHeroStatus.hidden = pStatus <= 0;
    ui.journeyHeroStatus.textContent = pStatus > 0 ? t("combat.statusCount", { count: pStatus }) : t("combat.statusLabel");
    if (pStatus !== prev.pStatus && pStatus > 0) pulseClass(ui.journeyHeroStatus, "journeyChip--pulse", 420);
  }

  if (ui.journeyEnemyStatus) {
    ui.journeyEnemyStatus.hidden = eStatus <= 0;
    ui.journeyEnemyStatus.textContent = eStatus > 0 ? t("combat.statusCount", { count: eStatus }) : t("combat.statusLabel");
    if (eStatus !== prev.eStatus && eStatus > 0) pulseClass(ui.journeyEnemyStatus, "journeyChip--pulse", 420);
  }

  // Extra attacks (enemy only: rapid_strike / onAfterAttack)
  const extraActive = prev.eExtraUntil && now < prev.eExtraUntil ? prev.eExtra : 0;
  if (ui.journeyEnemyExtra) {
    ui.journeyEnemyExtra.hidden = extraActive <= 0;
    ui.journeyEnemyExtra.textContent = extraActive > 0 ? t("combat.extraHitCount", { count: extraActive }) : t("combat.extraHit");
  }

  state.journeyFx = {
    pStatus,
    eStatus,
    eExtra: prev.eExtra || 0,
    eExtraUntil: prev.eExtraUntil || 0,
  };
}

function setModalArt(kind) {
  if (!ui.modalArt) return;
  if (!kind) {
    ui.modalArt.classList.remove("modal__art--show");
    ui.modalArt.removeAttribute("src");
    return;
  }
  let src = null;
  if (kind === "campfire") src = "Images/Campfire.png";
  if (kind === "wraith") src = "Images/Event_Wraith.png";
  if (kind === "vault") src = "Images/Event_Vault.png";
  if (!src) {
    ui.modalArt.classList.remove("modal__art--show");
    ui.modalArt.removeAttribute("src");
    return;
  }
  ui.modalArt.src = src;
  ui.modalArt.classList.add("modal__art--show");
}

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => "fire"));
}

const state = {
  chapter: 1,
  stage: 1,
  turn: 1,
  grid: emptyGrid(),
  matchesAll: [],
  revealedMatchCount: 0,
  lastStepCells: new Set(),
  lastJackpot: false,
  player: null,
  enemy: null,
  busy: false,
  gridJustRolled: false,
  stepKind: "none", // none | preview | convert
  stepSymbolId: null,
  spinBombardCells: new Set(),
  spinBombardElementId: null,
  nextCampfireStage: 2,
  nextPriestStage: 3,
  nextVaultStage: 3,
  wraithUsed: false,
  wraithBattle: null,
  lang: "ko",
  started: false,
  previewMode: false,
  spinSeq: 0,
  logEventSeq: 0,
  logPhase: null,
  turnEvolutionCounter: { fire: 0, light: 0, nature: 0, water: 0 },
  turnEvolutionTriggered: { fire: false, light: false, nature: false, water: false },
  luckyHoldPending: null,
  luckyHoldActive: null,
  singleConvertFixedKeys: new Set(),
  frugalHealToastSeq: -1,
  bleedDoubleToastSeq: -1,
  chainRampToastSeq: -1,
  lastBreathToastSeq: -1,
  shieldFuryToastSeq: -1,
  lowHpImmunityTurn: -1,
  petCooldownById: {},
  petSkillUsedOnce: false,
  petSpinDamageMult: 1.0,
  petAttackBuffTurns: 0,
  petAttackBuffMult: 1.0,
  petForcedElementTurns: 0,
  battleStartHp: 0,
};

// NOTE: text moved to data/text.js
function formatText(template, vars) {
  if (!vars) return String(template);
  return String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

function t(key, vars, fallback) {
  const lang = state.lang || "ko";
  const dict = TEXT[lang] || TEXT.ko;
  const parts = String(key).split(".");
  let cur = dict;
  for (const p of parts) {
    if (!cur || !Object.prototype.hasOwnProperty.call(cur, p)) {
      cur = null;
      break;
    }
    cur = cur[p];
  }
  if (cur == null) return fallback != null ? fallback : key;
  if (typeof cur === "function") return cur(vars || {});
  if (typeof cur === "string") return formatText(cur, vars);
  return cur;
}

function tMaybe(key, vars) {
  const val = t(key, vars);
  return val === key ? null : val;
}

function enemyName(enemy) {
  if (!enemy) return "";
  const fallbackName =
    enemy.name && /^Monster\s+\d+$/i.test(String(enemy.name).trim())
      ? `적 ${enemy.id || ""}`.trim()
      : (enemy.name || enemy.id || "");
  return t(`enemy.${enemy.id}`, null, fallbackName);
}

const PASSIVE_TEXT_OVERRIDES = {
  "1002": { name: "연속 공격", desc: "30% 확률로 최대 5회 연속 공격. 연속 공격은 50% 피해." },
  "1003": { name: "치명 연속 공격", desc: "치명타 발생 시 최대 5회 연속 공격. 연속 공격은 100% 피해." },
  "1004": { name: "자폭", desc: "남은 체력의 1.5배만큼 자폭 피해." },
  "1005": { name: "충격 흡수", desc: "받은 피해의 20%만큼 회복." },
  "1006": { name: "방어 태세", desc: "공격하지 않은 턴에 피해 감소 20% 증가." },
  "1007": { name: "출혈", desc: "공격 시 출혈 부여. 출혈 피해는 공격력의 30%." },
  "1008": { name: "화상", desc: "공격 시 화상 부여. 화상 피해는 공격력의 30%." },
  "1009": { name: "빙결", desc: "공격 시 20% 확률로 2턴 빙결. 빙결은 랜덤한 칸 2개를 봉인합니다." },
  "1010": { name: "어지러움", desc: "공격 시 20% 확률로 2턴 어지러움. 어지러움은 일정 확률로 스핀을 무효화합니다." },
  "1011": { name: "흡혈", desc: "가한 피해의 30%만큼 회복." },
  "1012": { name: "빙결 면역", desc: "일정 확률로 저체온에 걸리지 않음." },
  "1013": { name: "기절 면역", desc: "일정 확률로 어지러움에 걸리지 않음." },
  "1014": { name: "선제공격", desc: "플레이어보다 먼저 공격." },
  "1015": { name: "화상 면역", desc: "일정 확률로 화상에 걸리지 않음." },
  "1016": { name: "출혈 면역", desc: "일정 확률로 따가움에 걸리지 않음." },
  "1017": { name: "끈적한 방해", desc: "기본 공격 시 일정 확률로 빙결을 부여." },
  "1018": { name: "봉인 : 세로", desc: "전투 시작 시 가운데 세로 한 줄 봉인." },
  "1019": { name: "봉인 : 가로", desc: "전투 시작 시 가운데 가로 한 줄 봉인." },
  "1020": { name: "저주", desc: "전투 시작 시 행운 감소." },
  "1021": { name: "악마의 낙인", desc: "전투 시작 시 악마 심볼 추가. 악마 심볼 1개당 체력의 1% 피해." },
  "1022": { name: "방어 약화", desc: "공격 시 확률적으로 피해 감소 5% 감소 디버프 부여." },
  "1023": { name: "공격 약화", desc: "공격 시 확률적으로 공격력 5% 감소 디버프 부여." },
  "1024": { name: "반격", desc: "피격 시 확률적으로 기본 공격 150% 반격." },
  "1025": { name: "잭팟 반격", desc: "잭팟 공격 피격 시 기본 공격 150% 반격." },
  "1026": { name: "각성", desc: "체력 50% 미만 시 공격력과 피해 감소 증가." },
  "1027": { name: "보호막 생성", desc: "매 턴 체력 비례 보호막 생성." },
  "1028": { name: "긴급 보호막", desc: "체력 30% 미만 시 전투 중 1회 긴급 보호막 생성." },
  "1029": { name: "생명 창조", desc: "매 턴 체력 비례 회복." },
  "1030": { name: "번개 절감", desc: "번개 속성 피해 감소." },
  "1031": { name: "자연 절감", desc: "자연 속성 피해 감소." },
  "1032": { name: "불 절감", desc: "화염 속성 피해 감소." },
  "1033": { name: "물 절감", desc: "물 속성 피해 감소." },
  "1034": { name: "출혈 반사", desc: "피격 시 공격력의 30% 출혈 반사." },
  "1035": { name: "화상 반사", desc: "피격 시 공격력의 30% 화상 반사." },
  "1036": { name: "빙결 반사", desc: "피격 시 확률적으로 2턴 빙결 반사." },
  "1037": { name: "기절 반사", desc: "피격 시 확률적으로 2턴 기절 반사." },
  "10014": { name: "사냥 본능", desc: "플레이어 체력 50% 미만일 때 치명타율 증가." },
  "10017": { name: "불굴의 복서", desc: "치명타 피해를 받아도 체력 1로 1회 생존." },
  "20102": { name: "독 지대", desc: "전투 시작 시 독 안개 부여. 매 턴 공격력의 50% 피해." },
  "20201": { name: "화염 돌진", desc: "플레이어 체력 50% 이하일 때 200% 화염 돌진과 화상 3개 부여." },
  "20302": { name: "눈보라", desc: "플레이어 공격 실패 시 눈보라 발동. 공격력 20% 피해와 확률 빙결." },
  "20402": { name: "고통의 희열", desc: "매 턴 플레이어 상태이상 1개당 체력 비례 회복." },
  "20501": { name: "골렘 점프", desc: "체력 50% 미만일 때 250% 골렘 점프와 확률 기절." },
  "20601": { name: "접근 불허", desc: "전투 시작 시 체력의 50% 보호막 획득." },
};

function passiveName(passive) {
  if (!passive) return "";
  const override = PASSIVE_TEXT_OVERRIDES[String(passive.id)];
  return t(`passive.${passive.id}.name`, null, override?.name || passive.name || passive.id || "");
}

function passiveDesc(passive) {
  if (!passive) return "";
  const override = PASSIVE_TEXT_OVERRIDES[String(passive.id)];
  return t(`passive.${passive.id}.desc`, null, override?.desc || passive.desc || "");
}

function passiveCounter(passive) {
  if (!passive) return null;
  const c = tMaybe(`passive.${passive.id}.counter`);
  if (!c) return null;
  const s = String(c).trim();
  return s ? s : null;
}

function passiveIconSvg(passiveId) {
  // Keep it simple: map to existing status icons.
  if (!passiveId) return dotSvg();
  if (passiveId === "stone_skin") return shieldSvg();
  if (passiveId === "chapter_trait_overgrowth") return dropSvg();
  if (passiveId === "chapter_trait_ice_bulwark") return shieldSvg();
  if (passiveId === "chapter_trait_mire_curse") return lockSvg();
  if (passiveId === "chapter_trait_sun_fury") return upSvg();
  if (passiveId === "chapter_trait_ancient_ward") return lockSvg();
  if (passiveId === "ward") return lockSvg();
  if (passiveId === "rage") return upSvg();
  if (passiveId === "scorching_claws") return flameSvg();
  if (passiveId === "frostbite") return snowSvg();
  if (passiveId === "sunder") return downSvg();
  if (passiveId === "barrier") return shieldSvg();
  if (passiveId === "regeneration") return dropSvg();
  if (passiveId === "icy_shell") return shieldSvg();
  if (passiveId === "talisman_seal") return lockSvg();
  if (passiveId === "check_lock") return lockSvg();
  if (passiveId === "tile_seal") return lockSvg();
  if (passiveId === "rapid_strike") return boltSvg();
  return dotSvg();
}


// ═══ Utility functions (moved from other sections) ═══

function weightedPick(items, total) {
  let x = Math.random() * total;
  for (const it of items) {
    x -= it.w;
    if (x <= 0) return it;
  }
  return items[items.length - 1];
}

function pickOne(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueSample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
