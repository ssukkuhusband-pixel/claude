// ═══ grid.js — Player/Enemy creation, Grid system ═══

function newPlayer() {
  return {
    hp: 200,
    maxHp: 200,
    level: 1,
    xp: 0,
    xpToNext: 50,

    baseMatchDamage: 100,
    lengthScaleBonus: 0,
    healPerSpin: 0,
    healOnKill: 0,
    elemBonus: {},
    elemBaseMult: { fire: 1.0, light: 1.0, nature: 1.0, water: 1.0 },
    symbolWeightMult: { fire: 1.0, light: 1.0, nature: 1.0, water: 1.0 },
    evasionChance: 0,
    tempEvasionBonus: 0,
    elementVariants: {},
    skills: [],
    skillNotes: [],

    hooks: {
      afterRoll: [],
      modifyMatches: [],
      decorateCell: [],
    },
    rowTalismans: new Set(),
    colTalismans: new Set(),
    rowTalismanBonus: new Map(),
    colTalismanBonus: new Map(),
    fixedRowTalismans: new Set(),
    fixedColTalismans: new Set(),
    fixedRowTalismanBonus: new Map(),
    fixedColTalismanBonus: new Map(),
    fixedLineEffectRow: new Map(),
    fixedLineEffectCol: new Map(),
    hybridSpawns: new Set(),
    hybridSpawnCounts: {},

    hybridConvertExtra: 0,
    dualBombardCount: {},
    dualConvertEvolution: false,
    singleConvertEvolution: false,
    singleConvertHold: null,
    bombardCount: {},
    bombardEnabled: new Set(),

    hybridChanceBonus: 0,
    variantChanceMult: {},
    variantGuaranteedExtra: {},
    luck: 0,
    luckHoldCount: 1,
    luckPatternDamageMult: 1.0,
    luckDoubleCheck: false,
    jackpotWeightBoost: {},
    reviveAvailable: false,
    lowHpImmunity: false,
    critChance: 0,
    critChanceBattleBonus: 0,
    critDamageMult: 1.0,

    proc: {
      lightThunder: false,
      natureThorn: false,
      fireFlame: false,
      waterIce: false,
      lightChain: false,
      natureHeal: false,
      firePower: false,
      waterSlip: false,
      fireArmorBreak: false,
      waterMiniCleanse: false,
      waterMiniShield: false,
      natureDizzy: false,
    },

    mini: {
      light: { enabled: false, ratio: 0.75, countMin: 1, countMax: 1, mult: 1.0, bypassShield: false },
      nature: { enabled: false, ratio: 1.0, countMin: 1, countMax: 1, mult: 1.0, bypassShield: false },
      fire: { enabled: false, ratio: 1.5, countMin: 1, countMax: 1, mult: 1.0, bypassShield: false },
      water: { enabled: false, ratio: 1.0, countMin: 1, countMax: 1, mult: 1.0, bypassShield: false },
    },

    comboSkills: {
      lightNature: false,
      lightFire: false,
      lightWater: false,
      natureFire: false,
      natureWater: false,
      fireWater: false,
      plasmaOverheat: false,
      lightningGaleBreakShield: false,
      darkCloudSuper: false,
      fireGaleDotPlus: false,
      tidalWaveCleanse: false,
      hotSpringWarm: false,
    },

    traits: {
      burn: { duration: 5, dmgPerStack: 6, stacksPerProc: 1 },
      heal: { pct: 0.03 },
      strike: { mult: 0.5 },
      freeze: { chance: 0.4, turns: 1 },
      stun: { chance: 0.0, turns: 1 },
      stunDamageBonus: 0,
      burnAttackDown: 0.0,
      bleed: { duration: 10, ratio: 0.7, dmgMult: 1.0 },

      ember: { pct: 0.07, bonusDamage: 0 },
      shockwave: { delay: 1, stunChance: 0.0 },
      iceBarrier: { pct: 0.05, cleanse: false },
    },

    damageMult: 1.0,
    demonContract: false,
    victoryBlessing: false,
    fullPrepared: false,
    knightShield: false,
    knightSword: false,
    starChance: 0,
    starHookAdded: false,

    battleStartShield: {
      enabled: false,
      threshold: 0.30,
      pct: 0.20,
    },

    constellationEnabled: false,
    patternTriangleEnabled: false,
    patternInvertedTriangleEnabled: false,
    patternXEnabled: false,
    patternXMult: PATTERN_MULT,

    shieldTraits: {
      light: 0,
      burn: 0,
      power: 0,
    },

    shieldCore: {
      extraProc: false,
      extraProcUsedThisSpin: false,
      directDmgMult: 1.0,
      lastStand: false,
      lastStandUsed: false,
    },
    nextSpinBonusDamage: 0,
    nextSpinDamageMult: 1.0,
    tempMatchDamage: 0,
    tempDamageMult: 1.0,

    tileTalismanChance: 0,
    tileTalismanMult: 2,
    tileTalismans: new Set(),
    rowConvertMarks: new Set(),
    colConvertMarks: new Set(),

    magicSword: false,
    magicShield: false,
    magicShieldStacks: 0,
    magicShieldMax: 10,
    magicSpirit: false,
    magicSpiritCount: 0,

    sortRowTalismans: new Set(),

    // Line effect talismans
    lineEffectRow: new Map(),
    lineEffectCol: new Map(),
    lineEffectCfg: {
      burn: { duration: 5, stacks: 1 },
      freeze: { chance: 0.3, turns: 1 },
      strike: { damage: 10 },
      heal: { pct: 0.05 },
    },


    fireBuild: {
      emberSpread: false,
      fireResonance: false,
      purifyingFlame: false,
      talismanIgnition: false,
      cinderGuard: false,
      burnScar: false,
      flameBurnStacks: 1,
      powerFlame: false,
      lastEmber: false,
      burnHealReduce: 0.0,
      powerKeepChapter: false,
      superPower: false,
      superPowerEnabled: false,
      powerHits: 0,
      powerPct: 0.05,
    },

    lightBuild: {
      lightResonance: false,
      chainConductor: false,
      staticDischarge: false,
      overcharge: false,
      shockLock: false,
      thorHammer: false,
      chainRamp: false,
      jackpotBoost: false,
      thunderStunChance: 0.2,
      thunderHammerOnStun: false,
      chainHits: 0,
      chainExtraMultiplier: 1,
      superChainEnabled: false,
    },

    natureBuild: {
      natureResonance: false,
      talismanBlossom: false,
      hemorrhage: false,
      saplingGuard: false,
      photosynthesis: false,
      bleedDouble: false,
      healBoost: false,
      frugalHeal: false,
      thornBleedStacks: 1,
      bleedBypassShield: false,
      healHits: 0,
      superHealZone: false,
      healCleanse: false,
      superHealEnabled: false,
    },

    waterBuild: {
      waterResonance: false,
      iceShatter: false,
      frostGuard: false,
      deepFreeze: false,
      iceArmor: false,
      frostbite: false,
      slipShieldPct: 0.05,
      shieldFury: false,
      freezeChance: 0.2,
      freezeTurnsBonus: 0,
      freezeHits: 0,
      statusImmuneWithShield: false,
      superGuard: false,
      superGuardEnabled: false,
    },

    reflectShield: {
      light: { enabled: false, ratio: 1.0, chanceStatus: 0.0, status: null },
      nature: { enabled: false, ratio: 1.0, chanceStatus: 1.0, status: "bleed" },
      fire: { enabled: false, ratio: 1.0, chanceStatus: 1.0, status: "burn" },
      water: { enabled: false, ratio: 1.0, chanceStatus: 0.0, status: "freeze" },
      hp: { enabled: false, ratio: 0.6, healOnHitPct: 0.0 },
    },

    bridges: {
      conductiveEmbers: false, // fire + light
      thawBurst: false, // fire + water
      ashenBloom: false, // fire + nature
      stormFrost: false, // light + water
      groundingRoots: false, // light + nature
      springThaw: false, // nature + water
    },

    comboAuras: {
      darkCloud: false,
      darkCloudMult: 0.5,
      hotSpring: false,
      hotSpringPct: 0.02,
    },

    comboAttackEnabled: false,
    comboAuraEnabled: false,
    comboAuraStacks: 0,
    comboMagicSwordEnabled: false,

    commonDoubleRune: false,
    commonCritRune: false,

    basicAttackMode: "none",
    basicAttackChainChance: 0,
    basicAttackChainMax: 5,
    basicAttackOneShotMult: 1.0,


    comboHeal: {
      enabled: false,
      every: 0,
      amount: 0,
    },

    overkillHeal: {
      enabled: false,
      ratio: 0,
    },

    shield: 0,
    status: {
      burnTurns: 0,
      burnStacks: 0,
      burnDmgPerStack: 3,
      frozenTurns: 0,
      weakenTurns: 0,

      lockHTurns: 0,
      lockVTurns: 0,
      lockHRow: null,
      lockVCol: null,
      invulTurns: 0,
      talismanSealTurns: 0,
      tileSealTurns: 0,

      // v3 두두 디버프
      playerBurnTiles: [],    // [{dmg, turns}, ...] — 각 인스턴스 = 불탄심볼 1개
      playerFrozenTurns: 0,   // 남은 턴 (> 0이면 매 스핀 3칸 얼림)
      playerStunTurns: 0,     // 남은 턴 (> 0이면 30% 스핀 실패)
      playerBurnTiles: [],
      playerFrozenTurns: 0,
      bleedTurns: 0,
      bleedStacks: 0,
      bleedDmgPerStack: 0,
      damageReductionShred: 0,
      damageReductionShredTurns: 0,
      attackDownRatio: 0,
      attackDownTurns: 0,
      stickyCells: [],
    },

    // ═══ v2 skill properties ═══

    // ── 상태이상 강화 ──
    statusEnhance: {
      burnDmgBonus: 0,
      burnExtraTurns: 0,
      burnShieldBonus: 0,
      dizzyEnabled: false,
      dizzyAtkReduce: 0.10,
      dizzyTurns: 2,
      dizzyExtraTurns: 0,
      dizzyCounterReduce: 0,
      thornPctBonus: 0,
      thornExtraTurns: 0,
      thornHealReduce: 0,
      freezeExtraTurns: 0,
      freezeThreshold: 3,
      freezeIgnoreReduce: false,
    },

    // ── 방패 카운트 ──
    shieldCount: 0,
    shieldMax: 3,
    shieldReducePct: 0.20,
    shieldElement: null,
    shieldOnBreakEffect: null,
    shieldStartCount: 0,
    shieldRechargeEvery: 0,
    shieldBattleAtkBonus: 0,

    // ── 불사 / 부활 ──
    immortal: false,
    immortalUsed: false,
    immortalShieldTurns: 0,
    reviveOnce: false,
    reviveUsed: false,
    revivePct: 0.50,

    // ── 재생 ──
    regenPct: 0,
    regenCrisisMult: 1,

    // ── 콤보강화 ──
    comboEnhance: {
      accelEvery: 0,
      berserker: false,
      berserkerAtkBonus: 0.30,
      berserkerDmgTaken: 0.15,
      berserkerTurns: 0,
      guardian: false,
      guardianPct: 0.10,
      dominator: false,
      dominatorTurns: 0,
      dominatorStatusBonus: 1,
      comboReduction: 0,
    },

    // ── 패턴배율 ──
    patternMult: { H: 1.0, V: 1.0, D: 1.0 },

    // ── 속성간 시너지 ──
    synergy: {
      plasma: false,            plasmaEnhanced: false,
      lightningGale: false,     lightningGaleEnhanced: false,
      electrocute: false,       electrocuteEnhanced: false,
      purifyingFlame: false,    purifyingFlameEnhanced: false,
      tidal: false,             tidalEnhanced: false,
      steamBlast: false,        steamBlastEnhanced: false,
    },

    // ── 속성 강화 (자동 상태이상) ──
    autoStatus: { fire: false, light: false, nature: false, water: false },

    // ── 특수심볼 효과 ──
    specialSymbol: {
      powerAtkPct: 0.05,
      thunderX2Chance: 0.50,
      emberBurnStacks: 1,
      thunderDizzyTurns: 2,
      thornStacks: 1,
      iceStacks: 1,
      boltMiniCount: 1,
      healPct: 0.05,
      protectPct: 0.06,
    },

    // ── 스탯 조건부 ──
    crisisPower: 0,
    desperationCrit: 0,
    fortitudeReduce: 0,
    healthyBodyAtk: 0,
    perfectConditionCrit: 0,
    damageAmp: 0,
    hybridFinishers: {},
    damageReduction: 0,

    // ── x2룬 ──
    runePerSpin: 0,
    specialSymbolX2: false,

    // ── 단일속성 각성 ──
    monoAwakeningBonus: 0,

    // ── 만능 심볼 ──
    elementEvolution: {
      fire: { enabled: false, threshold: 10, mult: 1.5 },
      light: { enabled: false, threshold: 10, chance: 0.30 },
      nature: { enabled: false, threshold: 10, hpFactor: 0.5 },
      water: { enabled: false, threshold: 10, hpFactor: 0.5 },
    },
    elementEvolutionCounter: { fire: 0, light: 0, nature: 0, water: 0 },
    rainbowEnabled: false,
    rainbowDmgBonus: 0,

    // ── 부적 강화 ──
    checkTalismanExtra: 0,
    healTalismanMult: 1.0,
    dmgTalismanMult: 1.5,

  };
}

function newEnemy(stage, chapter) {
  const isBoss = stage % 5 === 0;
  const stageInfo = stageBalanceFor(chapter, stage);
  const assignedMonsterId = stageInfo.firstMonsterId || stageInfo.defaultMonsterId || 0;
  const pool = chapterEnemyPoolIds(chapter, isBoss);
  const fallbackId = pool.length ? pickOne(pool) : pickOne(ENEMIES).id;
  const assignedBase = assignedMonsterId ? ENEMY_BY_ID[String(assignedMonsterId)] : null;
  const assignedMatchesTheme = assignedBase && typeof enemyMatchesChapterTheme === "function"
    ? enemyMatchesChapterTheme(assignedBase, chapter)
    : !!assignedBase;
  const baseId = assignedMatchesTheme ? assignedMonsterId : fallbackId;
  const base = ENEMY_BY_ID[String(baseId)] || ENEMY_BY_ID[String(fallbackId)] || pickOne(ENEMIES);
  let hp = Math.max(1, Math.floor(base.baseHp * (stageInfo.hp || 1)));
  const atk = Math.max(1, Math.floor(base.baseAtk * (stageInfo.atk || 1)));
  const attackEvery = Math.max(1, Number.isFinite(base.monsterTurn) ? base.monsterTurn + 1 : (base.attackEvery || 2));
  const passiveIds = [];
  for (const id of base.passives || []) {
    if (id == null) continue;
    const key = String(id);
    if (!passiveIds.includes(key) && key !== "1001") passiveIds.push(key);
  }
  const chapterPassiveId = String(chapterTraitPassiveId(chapter) || "");
  if (chapterPassiveId && !passiveIds.includes(chapterPassiveId)) passiveIds.unshift(chapterPassiveId);
  const passives = passiveIds
    .map((id) => PASSIVES.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ ...p }));

  if (isBoss) hp = Math.max(1, Math.floor(hp * 1.25));

  const enemy = {
    id: base.id,
    name: base.name,
    icon: base.icon || "",
    kind: base.kind || 2,
    hp,
    maxHp: hp,
    atk,
    critChance: Math.max(0, Number(base.critChance || 0)),
    attackEvery,
    passives,
    attackOffset: 0,
    isBoss,
    shield: 0,
    armorBreakStacks: 0,
    damageTakenMult: 1.0,
    status: {
      burnTurns: 0,
      burnStacks: 0,
      frozenTurns: 0,
      stunnedTurns: 0,
      bleedTurns: 0,
      bleedStacks: 0,
      shockTurns: 0,
      shockDmg: 0,
      // v2 상태이상 (레거시 — UI 표시용, 실제 로직은 인스턴스 배열 사용)
      thornTurns: 0,
      thornStacks: 0,
      hypothermTurns: 0,
      hypothermStacks: 0,
      dizzyTurns: 0,
      dizzyAtkReduce: 0,
      // v3 인스턴스 기반 상태이상
      burnInstances: [],       // [{dmg: Number, turns: Number}, ...]
      dizzyInstances: [],      // [Number, ...]  (각각 = 남은 턴)
      thornInstances: [],      // [Number, ...]
      hypothermInstances: [],  // [Number, ...]
    },
  };

  for (const p of enemy.passives) {
    if (p.onSpawn) p.onSpawn(enemy);
  }
  return enemy;
}

// emptyGrid() moved to core.js (needed at state init time)

function rollGrid(player) {
  const weights = symbolWeights();
  const total = weights.reduce((a, b) => a + b.w, 0);
  if (state && state.nextSpinElementBoost && state.nextSpinElementBoost.elementId) {
    state.nextSpinElementBoost.remainingSpins = Math.max(0, (state.nextSpinElementBoost.remainingSpins || 1) - 1);
    if (state.nextSpinElementBoost.remainingSpins <= 0) state.nextSpinElementBoost = null;
  }
  const g = emptyGrid();
  const forceSingleElement = state && state.petForcedElementTurns > 0;
  const forcedElementId = forceSingleElement ? highestWeightElementId(weights) : null;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      g[r][c] = forceSingleElement ? convertToElementSymbolId(player, forcedElementId) : rollSymbolId(player, weights, total);
    }
  }
  // Pet fixSymbol: pre-fill locked cells before other holds
  if (state && state.petFixTurns > 0 && state.petFixedCells && state.petFixedCells.length > 0) {
    for (const cell of state.petFixedCells) {
      if (cell && typeof cell.r === "number" && typeof cell.c === "number" && cell.id) {
        g[cell.r][cell.c] = cell.id;
      }
    }
  }

  if (state && state.luckyHoldPending && state.luckyHoldPending.cells) {
    const hold = state.luckyHoldPending;
    for (const cell of hold.cells) {
      if (!cell) continue;
      const { r, c, id } = cell;
      if (typeof r === "number" && typeof c === "number" && id) g[r][c] = id;
    }
    state.luckyHoldActive = hold;
    state.luckyHoldPending = null;
  }
  // ── v2: 만능 심볼 배치 ──
  if (player && player.rainbowEnabled) {
    const blocked = state && state.luckyHoldActive && state.luckyHoldActive.keys ? state.luckyHoldActive.keys : null;
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r},${c}`;
        if (blocked && blocked.has(key)) continue;
        cells.push({ r, c });
      }
    }
    if (cells.length) {
      const pick = pickOne(cells);
      g[pick.r][pick.c] = "rainbow";
    }
  }

  if (player && player.starChance && Math.random() < player.starChance) {
    const blocked = state && state.luckyHoldActive && state.luckyHoldActive.keys ? state.luckyHoldActive.keys : null;
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r},${c}`;
        if (blocked && blocked.has(key)) continue;
        cells.push({ r, c });
      }
    }
    if (cells.length) {
      const pick = pickOne(cells);
      g[pick.r][pick.c] = "star";
    }
  }
  enforceGuaranteedElementVariants(g, player);
  enforceGuaranteedHybridSymbols(g, player);
  return g;
}

function symbolWeights() {
  // Equal weights with optional player bias.
  const mult = (state.player && state.player.symbolWeightMult) || {};
  const boost = state && state.nextSpinElementBoost ? state.nextSpinElementBoost : null;
  return BASE_SYMBOLS.map((s) => {
    let w = Math.max(0.01, 1 * (mult[s.id] || 1.0));
    if (boost && boost.elementId === s.id) w *= Math.max(1, boost.mult || 1);
    return { id: s.id, w };
  });
}

function highestWeightElementId(weights) {
  if (!weights || weights.length === 0) return "fire";
  let max = -Infinity;
  for (const w of weights) {
    if (w.w > max) max = w.w;
  }
  const tops = weights.filter((w) => w.w === max);
  const pick = tops.length ? pickOne(tops) : weights[0];
  return pick.id;
}

function rollSymbolId(player, baseWeights, baseTotal) {
  const base = weightedPick(baseWeights, baseTotal).id;
  const variantId = pickVariantForElement(player, base);
  if (variantId) return variantId;
  return base;
}

function elementOfSymbolId(symbolId) {
  return VARIANT_BY_ID[symbolId] || symbolId;
}

function isSpecialSymbolId(symbolId) {
  if (!symbolId) return false;
  if (VARIANT_BY_ID[symbolId]) return true;
  if (HYBRID_BY_ID[symbolId]) return true;
  return false;
}

function convertToElementSymbolId(player, elementId) {
  const variantId = pickVariantForElement(player, elementId);
  if (variantId) return variantId;
  return elementId;
}

function getElementVariants(player, elementId) {
  if (!player || !player.elementVariants || !elementId) return [];
  const v = player.elementVariants[elementId];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

const GUARANTEED_SPECIAL_VARIANTS = new Set([
  "fire_ember",
  "light_thunder_sym",
  "nature_thorn_v",
  "water_ice",
  "fire_power",
  "light_bolt",
  "nature_heal",
  "water_protect",
]);

function guaranteedVariantCount(player, variantId) {
  if (!player || !variantId) return 0;
  const extra = player.variantGuaranteedExtra && Number.isFinite(player.variantGuaranteedExtra[variantId])
    ? player.variantGuaranteedExtra[variantId]
    : 0;
  return 1 + Math.max(0, extra);
}

function guaranteedHybridCount(player, hybridId) {
  if (!player || !hybridId) return 0;
  if (!player.hybridSpawns || !player.hybridSpawns.has(hybridId)) return 0;
  const skillCounts = {
    light_nature: { base: "half_light_nature", extra: "half_light_nature_2" },
    fire_light: { base: "half_fire_light", extra: "half_fire_light_2" },
    light_water: { base: "half_water_light", extra: "half_water_light_2" },
    fire_nature: { base: "half_fire_nature", extra: "half_fire_nature_2" },
    nature_water: { base: "half_water_nature", extra: "half_water_nature_2" },
    fire_water: { base: "half_fire_water", extra: "half_fire_water_2" },
  };
  const ids = skillCounts[hybridId];
  if (ids && Array.isArray(player.skills)) {
    const baseOwned = player.skills.some((s) => s && s.id === ids.base);
    const extraCount = player.skills.filter((s) => s && s.id === ids.extra).length;
    if (baseOwned) return Math.max(1, 1 + extraCount);
  }
  return Math.max(1, Number(player.hybridSpawnCounts?.[hybridId] || 1));
}

function enforceGuaranteedElementVariants(grid, player) {
  if (!grid || !player) return;
  for (const el of BASE_SYMBOLS) {
    const elementId = el.id;
    const owned = getElementVariants(player, elementId).filter((variantId) => GUARANTEED_SPECIAL_VARIANTS.has(variantId));
    if (!owned.length) continue;

    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === elementId) candidates.push({ r, c });
      }
    }
    if (!candidates.length) continue;

    const pool = uniqueSample(candidates, candidates.length);
    let cursor = 0;
    for (const variantId of owned) {
      const need = guaranteedVariantCount(player, variantId);
      let placed = 0;
      for (let i = 0; i < pool.length; i++) {
        if (grid[pool[i].r][pool[i].c] === variantId) placed += 1;
      }
      while (placed < need && cursor < pool.length) {
        const pick = pool[cursor++];
        grid[pick.r][pick.c] = variantId;
        placed += 1;
      }
      if (cursor >= pool.length) break;
    }
  }
}

function enforceGuaranteedHybridSymbols(grid, player) {
  if (!grid || !player || !player.hybridSpawns || player.hybridSpawns.size <= 0) return;
  for (const hybridId of player.hybridSpawns) {
    const def = HYBRID_BY_ID[hybridId];
    if (!def) continue;
    const need = guaranteedHybridCount(player, hybridId);
    if (need <= 0) continue;

    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const symbolId = grid[r][c];
        if (symbolId !== def.a && symbolId !== def.b) continue;
        if (isSpecialSymbolId(symbolId)) continue;
        candidates.push({ r, c });
      }
    }
    if (!candidates.length) continue;

    const picks = uniqueSample(candidates, Math.min(need, candidates.length));
    for (const { r, c } of picks) grid[r][c] = hybridId;
  }
}

function pickVariantForElement(player, elementId) {
  const variants = getElementVariants(player, elementId).filter((variantId) => !GUARANTEED_SPECIAL_VARIANTS.has(variantId));
  if (!variants.length) return null;
  const hits = [];
  for (const variantId of variants) {
    if (Math.random() < variantChance(variantId)) hits.push(variantId);
  }
  if (!hits.length) return null;
  return hits.length === 1 ? hits[0] : pickOne(hits);
}

function elementHasVariant(player, elementId, variantId) {
  return getElementVariants(player, elementId).includes(variantId);
}

function variantChance(variantId) {
  const mult = state && state.player && state.player.variantChanceMult && state.player.variantChanceMult[variantId]
    ? state.player.variantChanceMult[variantId]
    : 1;
  // 10% variants (special-case)
  if (variantId === "water_freeze") return Math.min(1, 0.10 * mult);
  if (variantId === "light_shockwave") return Math.min(1, 0.10 * mult);
  if (variantId === "light_thunder") return Math.min(1, 0.10 * mult);
  if (variantId === "light_row") return Math.min(1, 0.10 * mult);
  if (variantId === "nature_row") return Math.min(1, 0.10 * mult);
  if (variantId === "fire_row") return Math.min(1, 0.10 * mult);
  if (variantId === "water_row") return Math.min(1, 0.10 * mult);
  if (variantId === "light_col") return Math.min(1, 0.15 * mult);
  if (variantId === "nature_col") return Math.min(1, 0.15 * mult);
  if (variantId === "fire_col") return Math.min(1, 0.15 * mult);
  if (variantId === "water_col") return Math.min(1, 0.15 * mult);
  if (variantId === "fire_flame") return Math.min(1, 0.30 * mult);
  if (variantId === "nature_thorn") return Math.min(1, 0.30 * mult);
  if (DOUBLE_RUNE_VARIANTS.includes(variantId)) return Math.min(1, 0.20 * mult);
  if (CRIT_RUNE_VARIANTS.includes(variantId)) return Math.min(1, 0.20 * mult);
  if (variantId === "light_chain") return Math.min(1, 0.05 * mult);
  if (variantId === "nature_heal") return Math.min(1, 0.05 * mult);
  if (variantId === "fire_power") return Math.min(1, 0.05 * mult);
  if (variantId === "water_slip") return Math.min(1, 0.05 * mult);
  // default: 15%
  return Math.min(1, VARIANT_CHANCE * mult);
}


function addEnemyFreezeTurns(enemy, turns) {
  if (!enemy || !enemy.status) return;
  if (enemy.immuneFreeze) return;
  const add = Math.max(0, Math.floor(turns || 0));
  if (!add) return;
  enemy.status.frozenTurns += add;
}

function addEnemyStunTurns(enemy, turns) {
  if (!enemy || !enemy.status) return;
  if (enemy.immuneStun) return;
  const add = Math.max(0, Math.floor(turns || 0));
  if (!add) return;
  enemy.status.stunnedTurns += add;
}

// ═══ 플레이어 디버프 apply/tick ═══

function applyPlayerBurn(player, dmg, turns) {
  if (!player?.status) return;
  player.status.playerBurnTiles.push({
    dmg: Math.max(1, Math.floor(dmg)),
    turns: turns || 2,
  });
}

function applyPlayerFreeze(player, turns) {
  if (!player?.status) return;
  player.status.playerFrozenTurns = Math.max(
    player.status.playerFrozenTurns,
    turns || 1
  );
}

function applyPlayerStun(player, turns) {
  if (!player?.status) return;
  player.status.playerStunTurns = Math.max(
    player.status.playerStunTurns,
    turns || 1
  );
}

function tickPlayerDebuffs(player) {
  if (!player?.status) return;
  // 화상 턴 감소 + 만료 제거
  const bt = player.status.playerBurnTiles;
  for (let i = bt.length - 1; i >= 0; i--) {
    bt[i].turns -= 1;
    if (bt[i].turns <= 0) bt.splice(i, 1);
  }
  // 빙결/기절 턴 감소
  if (player.status.playerFrozenTurns > 0) player.status.playerFrozenTurns -= 1;
  if (player.status.playerStunTurns > 0) player.status.playerStunTurns -= 1;
  if (player.status.damageReductionShredTurns > 0) {
    player.status.damageReductionShredTurns -= 1;
    if (player.status.damageReductionShredTurns <= 0) player.status.damageReductionShred = 0;
  }
  if (player.status.attackDownTurns > 0) {
    player.status.attackDownTurns -= 1;
    if (player.status.attackDownTurns <= 0) player.status.attackDownRatio = 0;
  }
  if (Array.isArray(player.status.stickyCells)) {
    for (let i = player.status.stickyCells.length - 1; i >= 0; i--) {
      player.status.stickyCells[i].turns -= 1;
      if (player.status.stickyCells[i].turns <= 0) player.status.stickyCells.splice(i, 1);
    }
  }
}
