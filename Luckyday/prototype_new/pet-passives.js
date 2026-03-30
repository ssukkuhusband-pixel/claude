// ═══ pet-passives.js — Pet passive system, Active skills ═══

function petDotDamageMult(kind) {
  // Passives can modify DoT damage in the future; for now return 1.0
  return 1.0;
}

function petPassiveAttackMult(player, enemy, grid) {
  if (!state.petPassiveState) return 1.0;
  const ps = state.petPassiveState;
  let mult = 1.0;

  // Stacking atk bonus (from periodicAtkBuff, stackingAtkBuff)
  if (ps.stackingAtkBonus > 0) mult *= (1 + ps.stackingAtkBonus);

  // Timed atk buff from passives
  if (ps.atkBuffFromPassive > 0 && ps.atkBuffFromPassiveTurns > 0) {
    mult *= (1 + ps.atkBuffFromPassive);
  }

  // Enemy HP below threshold bonus
  if (ps.enemyHpBelowDmgBonus > 0 && enemy && enemy.hp > 0 && enemy.maxHp > 0) {
    if (enemy.hp / enemy.maxHp < (ps.enemyHpBelowThreshold || 0.50)) {
      mult *= (1 + ps.enemyHpBelowDmgBonus);
    }
  }

  // Crit damage buff from passives (additive to existing crit)
  // This is handled separately in the crit section

  // passiveModify: atkBuffOverride (4002 P2) — permanent buff when passive is active
  const mods = getPetPassiveModifiers();
  if (mods.atkBuffOverride) {
    mult *= (1 + (mods.atkBuffOverride.pct || 0.30));
  }
  if (mods.atkBuffWhileActive) {
    // Only applies when active skill is not on cooldown
    const pet = equippedPetDef(0);
    if (pet && petCooldownTurnsById(pet.id) <= 0) {
      mult *= (1 + (mods.atkBuffWhileActive.pct || 0.20));
    }
  }
  if (mods.rerollMatchDmgBonus && state.petRerollTurns > 0) {
    mult *= (1 + (mods.rerollMatchDmgBonus.pct || 0.20));
  }
  if (mods.dmgReduceWhileActive) {
    // This is damage reduction, not attack mult — applied elsewhere
    // But for simplicity, we keep it as a flag
    const pet = equippedPetDef(0);
    if (pet && petCooldownTurnsById(pet.id) <= 0) {
      ps.permanentDmgReduce = Math.max(ps.permanentDmgReduce, mods.dmgReduceWhileActive.pct || 0.10);
    }
  }

  return mult;
}

function applyPetTurnPassiveEffects(player) {
  if (!player || player.hp <= 0) return;
  // Handle active skill regen effects
  if (state.petRegenTurns > 0 && state.petRegenPct > 0) {
    const heal = Math.max(1, Math.floor(player.maxHp * state.petRegenPct));
    const res = applyPlayerHeal(player, heal);
    if (res.healed > 0) logEvt("good", `펫 재생 +${res.healed}`);
  }
  // Run turn-start passives from the data-driven system
  applyPetTurnStartPassives(player, state.enemy);
  // Apply afterRound passives (round = player turn + enemy turn)
  applyPetAfterRoundPassives(player, state.enemy);
}

function resetPetBattleState(resetCooldown = false) {
  if (resetCooldown) state.petCooldownById = {};
  state.petSkillUsedOnce = false;
  state.petSpinDamageMult = 1.0;
  state.petAttackBuffTurns = 0;
  state.petAttackBuffMult = 1.0;
  state.petForcedElementTurns = 0;
  // New fields
  state.petRegenPct = 0;
  state.petRegenTurns = 0;
  state.enemyTakeDmgDebuff = 0;
  state.enemyTakeDmgDebuffTurns = 0;
  state.playerDmgReduction = 0;
  state.playerDmgReductionTurns = 0;
  state.bleedOnHitStacks = 0;
  state.bleedOnHitBleedTurns = 0;
  state.bleedOnHitDuration = 0;
  state.petCritBuffTurns = 0;
  state.petCritRateBuff = 0;
  state.petCritDmgBuff = 0;
  state.petComboAttackInterval = 0;
  state.petComboAttackMult = 0;
  state.petComboAttackTurns = 0;
  state.petEnemyAtkDebuff = 0;
  state.petEnemyAtkDebuffTurns = 0;
  state.petRerollCount = 0;
  state.petRerollTurns = 0;
  state.petFixedCells = [];
  state.petFixTurns = 0;
  state.petExtraRowCheckTurns = 0;
  state.petTalismans = [];
  // Passive system state
  state.petPassiveState = {
    onHitUsedThisTurn: false,
    periodicCounters: {},
    comboAccumulator: 0,
    patternCounters: { row: 0, col: 0 },
    roundNumber: 0,
    triggerCounts: {},
    passivesDisabled: false,
    stackingAtkBonus: 0,
    bigHealCooldown: 0,
    permanentAtkReduce: 0,
    permanentDmgReduce: 0,
    atkBuffFromPassive: 0,
    atkBuffFromPassiveTurns: 0,
    critDmgFromPassive: 0,
    critDmgFromPassiveTurns: 0,
    enemyHpBelowDmgBonus: 0,
    enemyHpBelowThreshold: 0,
    comboIntervalReduce: 0,
  };
}

// ============================================================
// PET PASSIVE DEFINITIONS — data-driven passive system
// ============================================================
const PET_PASSIVE_DEFS = [
  // === B grade (P1 only) ===
  { petId: "2001", slot: 1, trigger: "battleStart", effect: "applyBleedToEnemy", params: { stacks: 1, turns: 2 } },
  { petId: "2002", slot: 1, trigger: "onHit", effect: "counterAttack", params: { mult: 1.0 } },
  { petId: "2003", slot: 1, trigger: "comboThreshold", effect: "counterAttack", params: { threshold: 7, mult: 1.0 } },
  { petId: "2004", slot: 1, trigger: "afterSpin", effect: "shieldOnLowCombo", params: { comboMax: 3, pctMaxHp: 0.05, turns: 1 } },
  { petId: "2005", slot: 1, trigger: "turnStart", effect: "healIfHpBelow", params: { hpThreshold: 0.30, pctMaxHp: 0.04 } },
  { petId: "2006", slot: 1, trigger: "onHit", effect: "counterFreeze", params: { chance: 0.50, turns: 1 } },
  { petId: "2007", slot: 1, trigger: "turnStart", effect: "periodicAtkBuff", params: { interval: 3, pct: 0.04, stackable: true } },
  { petId: "2008", slot: 1, trigger: "onHit", effect: "debuffTakeDmg", params: { pct: 0.10, turns: 1, perTurnLimit: 1 } },

  // === A grade (P1-P2) ===
  { petId: "3001", slot: 1, trigger: "turnStart", effect: "cleansePlayerCC", params: { targetStatus: "freeze", chance: 0.50 } },
  { petId: "3001", slot: 2, trigger: "comboInterval", effect: "applyBurnToEnemy", params: { interval: 8, stacks: 1, turns: 2 } },
  { petId: "3002", slot: 1, trigger: "turnStart", effect: "cleansePlayerCC", params: { targetStatus: "stun", chance: 0.50 } },
  { petId: "3002", slot: 2, trigger: "passiveModify", effect: "activeDurationAdd", params: { hpThreshold: 0.50, addTurns: 1 } },
  { petId: "3003", slot: 1, trigger: "onActiveUse", effect: "cleansePlayerDoT", params: { type: "burn" } },
  { petId: "3003", slot: 2, trigger: "turnStart", effect: "cdReduceIfEnemyStatus", params: { enemyStatus: "freeze", cdReduce: 1 } },
  { petId: "3004", slot: 1, trigger: "turnStart", effect: "periodicDebuffTakeDmg", params: { interval: 4, pct: 0.15, turns: 2 } },
  { petId: "3004", slot: 2, trigger: "onHit", effect: "cdReduce", params: { cdReduce: 1, perTurnLimit: 1 } },
  { petId: "3005", slot: 1, trigger: "onActiveUse", effect: "cleansePlayerDoT", params: { type: "bleed" } },
  { petId: "3005", slot: 2, trigger: "turnStart", effect: "healIfHpBelow", params: { hpThreshold: 0.40, pctMaxHp: 0.06 } },
  { petId: "3006", slot: 1, trigger: "comboInterval", effect: "attackAndBleed", params: { interval: 5, mult: 1.0, stacks: 1, turns: 2 } },
  { petId: "3006", slot: 2, trigger: "turnStart", effect: "cdReduceIfEnemyBleed", params: { minStacks: 2, cdReduce: 1 } },
  { petId: "3007", slot: 1, trigger: "patternCheck", effect: "atkBuff", params: { orientation: "col", interval: 5, pct: 0.25, turns: 2 } },
  { petId: "3007", slot: 2, trigger: "patternCheck", effect: "applyBurnToEnemy", params: { orientation: "col", interval: 5, stacks: 1, turns: 2 } },
  { petId: "3008", slot: 1, trigger: "battleStart", effect: "applyStunToEnemy", params: { turns: 1 } },
  { petId: "3008", slot: 2, trigger: "passiveModify", effect: "activeBuffIfEnemyStun", params: { comboReduce: 1, dmgBonus: 0.20 } },

  // === S grade (P1-P3) ===
  { petId: "4001", slot: 1, trigger: "turnStart", effect: "periodicRegen", params: { interval: 3, pctMaxHp: 0.08, regenTurns: 2 } },
  { petId: "4001", slot: 2, trigger: "turnStart", effect: "cdReduceIfHpBelow", params: { hpThreshold: 0.40, cdReduce: 1 } },
  { petId: "4001", slot: 3, trigger: "turnStart", effect: "bigHealIfHpBelow", params: { hpThreshold: 0.30, pctMaxHp: 0.50, cooldownTurns: 3 } },
  { petId: "4002", slot: 1, trigger: "onHit", effect: "counterStun", params: { turns: 1, perTurnLimit: 1 } },
  { petId: "4002", slot: 2, trigger: "passiveModify", effect: "atkBuffOverride", params: { pct: 0.30 } },
  { petId: "4002", slot: 3, trigger: "comboThreshold", effect: "stackingAtkBuff", params: { threshold: 7, pct: 0.04, stackable: true } },
  { petId: "4003", slot: 1, trigger: "patternCheck", effect: "attackAndBurn", params: { orientation: "col", interval: 3, stacks: 1, turns: 2 } },
  { petId: "4003", slot: 2, trigger: "turnStart", effect: "cdReduceIfEnemyBurn", params: { minStacks: 4, cdReduce: 1 } },
  { petId: "4003", slot: 3, trigger: "afterRound", effect: "talismanBonusIncrease", params: { afterRound: 7, addCount: 1 } },
  { petId: "4004", slot: 1, trigger: "turnStart", effect: "periodicBleed", params: { interval: 2, stacks: 1, turns: 2 } },
  { petId: "4004", slot: 2, trigger: "onHit", effect: "cdReduce", params: { cdReduce: 1, perTurnLimit: 1 } },
  { petId: "4004", slot: 3, trigger: "battleStart", effect: "permanentEnemyAtkReduce", params: { pct: 0.10 } },
  { petId: "4005", slot: 1, trigger: "turnStart", effect: "cleansePlayerCC", params: { targetStatus: ["stun", "freeze"], chance: 0.50 } },
  { petId: "4005", slot: 2, trigger: "passiveModify", effect: "activeDurationAdd", params: { hpThreshold: 0.50, addTurns: 1 } },
  { petId: "4005", slot: 3, trigger: "passiveModify", effect: "rerollX2Rune", params: { count: 1 } },
  { petId: "4006", slot: 1, trigger: "turnStart", effect: "debuffTakeDmgIfEnemyFrozen", params: { pct: 0.10, turns: 2 } },
  { petId: "4006", slot: 2, trigger: "fixedSymbolMatch", effect: "cdReduce", params: { cdReduce: 1, perTurnLimit: 1 } },
  { petId: "4006", slot: 3, trigger: "fixedSymbolMatch", effect: "applyFreezeToEnemy", params: { turns: 1, perTurnLimit: 1 } },
  { petId: "4007", slot: 1, trigger: "turnStart", effect: "enemyHpBelowDmgBonus", params: { hpThreshold: 0.50, dmgBonus: 0.50 } },
  { petId: "4007", slot: 2, trigger: "afterRound", effect: "critDmgBuff", params: { triggerRound: 5, pct: 0.50, turns: 3 } },
  { petId: "4007", slot: 3, trigger: "afterRound", effect: "comboIntervalReduce", params: { afterRound: 7, reduce: 1 } },
  { petId: "4008", slot: 1, trigger: "patternCheck", effect: "shieldOnPattern", params: { orientation: "row", interval: 3, pctMaxHp: 0.12 } },
  { petId: "4008", slot: 2, trigger: "passiveModify", effect: "activeDurationAdd", params: { hpThreshold: 0.40, addTurns: 1 } },
  { petId: "4008", slot: 3, trigger: "battleStart", effect: "grantShield", params: { pctMaxHp: 0.10 } },

  // === SS grade (P1-P4) ===
  { petId: "5001", slot: 1, trigger: "turnStart", effect: "cleanseAny", params: { count: 1 } },
  { petId: "5001", slot: 2, trigger: "fixedSymbolMatch", effect: "cdReduce", params: { cdReduce: 1, perTurnLimit: 1 } },
  { petId: "5001", slot: 3, trigger: "passiveModify", effect: "activeSymbolCountOverride", params: { count: 3 } },
  { petId: "5001", slot: 4, trigger: "hpBelow", effect: "emergencyHealAndCleanse", params: { hpThreshold: 0.30, healPctMaxHp: 0.25, cleanseAll: true, maxTriggers: 1 } },
  { petId: "5002", slot: 1, trigger: "patternCheck", effect: "shieldOnPattern", params: { orientation: "row", interval: 3, pctMaxHp: 0.10 } },
  { petId: "5002", slot: 2, trigger: "turnStart", effect: "cdReduceIfHpBelow", params: { hpThreshold: 0.40, cdReduce: 1 } },
  { petId: "5002", slot: 3, trigger: "turnStart", effect: "periodicCleanseDoT", params: { interval: 3, count: 1 } },
  { petId: "5002", slot: 4, trigger: "battleStart", effect: "grantShieldWithDmgReduce", params: { pctMaxHp: 0.15, dmgReduce: 0.10 } },
  { petId: "5003", slot: 1, trigger: "comboInterval", effect: "counterAttack", params: { interval: 3, mult: 1.0 } },
  { petId: "5003", slot: 2, trigger: "rerollMatch", effect: "applyBleedToEnemy", params: { stacks: 1, turns: 2, perTurnLimit: 1 } },
  { petId: "5003", slot: 3, trigger: "passiveModify", effect: "rerollMatchDmgBonus", params: { pct: 0.20 } },
  { petId: "5003", slot: 4, trigger: "afterRound", effect: "activeTurnsAndX2Rune", params: { afterRound: 7, activeTurns: 3, x2Count: 1 } },
  { petId: "5004", slot: 1, trigger: "patternCheck", effect: "applyBurnToEnemy", params: { orientation: "col", interval: 3, stacks: 1, turns: 2 } },
  { petId: "5004", slot: 2, trigger: "turnStart", effect: "cdReduceIfEnemyBurn", params: { minStacks: 4, cdReduce: 1 } },
  { petId: "5004", slot: 3, trigger: "comboInterval", effect: "attackAndBurn", params: { interval: 4, stacks: 1, turns: 2 } },
  { petId: "5004", slot: 4, trigger: "special", effect: "gwangpokhwa", params: { hpCostPct: 0.20, interval: 2, mult: 1.50, turns: 3, disablesPassives: true, maxTriggers: 1 } },
  { petId: "5005", slot: 1, trigger: "patternCheck", effect: "shieldOnPattern", params: { orientation: "row", interval: 3, pctMaxHp: 0.08 } },
  { petId: "5005", slot: 2, trigger: "fixedSymbolMatch", effect: "applyFreezeToEnemy", params: { turns: 1, perTurnLimit: 1 } },
  { petId: "5005", slot: 3, trigger: "turnStart", effect: "debuffTakeDmgIfEnemyFrozen", params: { pct: 0.10, turns: 2 } },
  { petId: "5005", slot: 4, trigger: "hpBelow", effect: "emergencyShield", params: { hpThreshold: 0.30, shieldPctMaxHp: 0.20, dmgReduce: 0.15, turns: 2, maxTriggers: 1 } },
  { petId: "5006", slot: 1, trigger: "onHit", effect: "counterBleed", params: { stacks: 1, turns: 2, perTurnLimit: 1 } },
  { petId: "5006", slot: 2, trigger: "turnStart", effect: "atkBuffIfEnemyStatusCount", params: { minCount: 2, pct: 0.20, turns: 2 } },
  { petId: "5006", slot: 3, trigger: "turnStart", effect: "debuffTakeDmgIfEnemyStatusCount", params: { minCount: 3, pct: 0.10, turns: 2 } },
  { petId: "5006", slot: 4, trigger: "special", effect: "statusExplosion", params: { minCount: 5, extendTurns: 1, atkPct: 0.25, atkTurns: 3, maxTriggers: 2 } },
  { petId: "5007", slot: 1, trigger: "battleStart", effect: "permanentEnemyAtkReduce", params: { pct: 0.10 } },
  { petId: "5007", slot: 2, trigger: "turnStart", effect: "cdReduceIfEnemyDoT", params: { minStacks: 4, cdReduce: 1 } },
  { petId: "5007", slot: 3, trigger: "passiveModify", effect: "dmgReduceWhileActive", params: { pct: 0.10 } },
  { petId: "5007", slot: 4, trigger: "afterRound", effect: "addTalismanOnActive", params: { afterRound: 7, orientation: "col", bonus: 3 } },
  { petId: "5008", slot: 1, trigger: "onHit", effect: "counterStun", params: { turns: 1, cooldownTurns: 3 } },
  { petId: "5008", slot: 2, trigger: "passiveModify", effect: "atkBuffWhileActive", params: { pct: 0.20 } },
  { petId: "5008", slot: 3, trigger: "turnStart", effect: "debuffTakeDmgIfEnemyCC", params: { statusList: ["stun", "freeze"], pct: 0.15, turns: 2 } },
  { petId: "5008", slot: 4, trigger: "special", effect: "lastShield", params: { healToHpPct: 0.20, disablesPassives: true, maxTriggers: 1 } },
];

// ============================================================
// PET PASSIVE HELPERS
// ============================================================

/** Returns array of unlocked passive defs for the currently equipped pet */
function getEquippedPetActivePassives() {
  const pet = equippedPetDef(0);
  if (!pet) return [];
  const count = petUnlockedPassiveCount(pet.id);
  if (count <= 0) return [];
  return PET_PASSIVE_DEFS.filter(d => d.petId === pet.id && d.slot <= count);
}

/** Count total status effects on enemy */
function petStatusCount(enemy) {
  if (!enemy || !enemy.status) return 0;
  let count = 0;
  if ((enemy.status.burnTurns || 0) > 0 && (enemy.status.burnStacks || 0) > 0) count++;
  if ((enemy.status.bleedTurns || 0) > 0 && (enemy.status.bleedStacks || 0) > 0) count++;
  if ((enemy.status.frozenTurns || 0) > 0) count++;
  if ((enemy.status.stunnedTurns || 0) > 0) count++;
  // Count stacks individually for high-count checks
  count += Math.max(0, (enemy.status.burnStacks || 0) - 1);
  count += Math.max(0, (enemy.status.bleedStacks || 0) - 1);
  return count;
}

/** Count total DoT stacks on enemy (burn + bleed) */
function petEnemyDoTCount(enemy) {
  if (!enemy || !enemy.status) return 0;
  return (enemy.status.burnStacks || 0) + (enemy.status.bleedStacks || 0);
}

/** Unique key for passive trigger counting */
function passiveKey(def) {
  return `${def.petId}_${def.slot}`;
}

/** Check and increment periodic counter; returns true when interval is reached */
function checkPeriodicCounter(def, interval) {
  const ps = state.petPassiveState;
  const key = passiveKey(def);
  if (!ps.periodicCounters[key]) ps.periodicCounters[key] = 0;
  ps.periodicCounters[key]++;
  if (ps.periodicCounters[key] >= interval) {
    ps.periodicCounters[key] = 0;
    return true;
  }
  return false;
}

/** Check maxTriggers limit */
function canTrigger(def, maxTriggers) {
  if (!maxTriggers) return true;
  const ps = state.petPassiveState;
  const key = passiveKey(def);
  return (ps.triggerCounts[key] || 0) < maxTriggers;
}

/** Record a trigger for maxTriggers tracking */
function recordTrigger(def) {
  const ps = state.petPassiveState;
  const key = passiveKey(def);
  ps.triggerCounts[key] = (ps.triggerCounts[key] || 0) + 1;
}

// ============================================================
// PET PASSIVE EFFECT EXECUTOR
// ============================================================

function executePetPassiveEffect(def, player, enemy) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;
  const p = def.params || {};
  const ps = state.petPassiveState;

  switch (def.effect) {
    // --- Status application to enemy ---
    case "applyBleedToEnemy": {
      if (!enemy || enemy.hp <= 0) return;
      applyBleed(enemy, player, p.stacks || 1, p.turns || 2);
      logEvt("good", `[패시브] 출혈 ${p.stacks || 1}×${p.turns || 2}턴`);
      break;
    }
    case "applyBurnToEnemy": {
      if (!enemy || enemy.hp <= 0) return;
      applyBurn(enemy, player, p.stacks || 1, p.turns || 2);
      logEvt("good", `[패시브] 화상 ${p.stacks || 1}×${p.turns || 2}턴`);
      break;
    }
    case "applyStunToEnemy": {
      if (!enemy || enemy.hp <= 0) return;
      addEnemyStunTurns(enemy, p.turns || 1);
      logEvt("good", `[패시브] 기절 ${p.turns || 1}턴`);
      break;
    }
    case "applyFreezeToEnemy": {
      if (!enemy || enemy.hp <= 0) return;
      addEnemyFreezeTurns(enemy, p.turns || 1);
      logEvt("good", `[패시브] 빙결 ${p.turns || 1}턴`);
      break;
    }

    // --- Counter attacks ---
    case "counterAttack": {
      if (!enemy || enemy.hp <= 0) return;
      const res = usePetDirectDamage(p.mult || 1.0);
      if (res.dealt > 0) logEvt("good", `[패시브] 반격 ${res.dealt}`);
      break;
    }
    case "counterFreeze": {
      if (!enemy || enemy.hp <= 0) return;
      if (Math.random() < (p.chance || 0.50)) {
        addEnemyFreezeTurns(enemy, p.turns || 1);
        logEvt("good", `[패시브] 반격 빙결 ${p.turns || 1}턴`);
      }
      break;
    }
    case "counterStun": {
      if (!enemy || enemy.hp <= 0) return;
      addEnemyStunTurns(enemy, p.turns || 1);
      logEvt("good", `[패시브] 반격 기절 ${p.turns || 1}턴`);
      break;
    }
    case "counterBleed": {
      if (!enemy || enemy.hp <= 0) return;
      applyBleed(enemy, player, p.stacks || 1, p.turns || 2);
      logEvt("good", `[패시브] 반격 출혈 ${p.stacks || 1}×${p.turns || 2}턴`);
      break;
    }
    case "attackAndBleed": {
      if (!enemy || enemy.hp <= 0) return;
      const res = usePetDirectDamage(p.mult || 1.0);
      applyBleed(enemy, player, p.stacks || 1, p.turns || 2);
      if (res.dealt > 0) logEvt("good", `[패시브] 공격 ${res.dealt} + 출혈`);
      break;
    }
    case "attackAndBurn": {
      if (!enemy || enemy.hp <= 0) return;
      const resBurn = usePetDirectDamage(p.mult || 1.0);
      applyBurn(enemy, player, p.stacks || 1, p.turns || 2);
      if (resBurn.dealt > 0) logEvt("good", `[패시브] 공격 ${resBurn.dealt} + 화상`);
      break;
    }

    // --- Healing ---
    case "healIfHpBelow": {
      if (player.hp / player.maxHp < (p.hpThreshold || 0.30)) {
        const heal = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.04)));
        const res = applyPlayerHeal(player, heal);
        if (res.healed > 0) logEvt("good", `[패시브] 회복 +${res.healed}`);
      }
      break;
    }
    case "periodicRegen": {
      if (checkPeriodicCounter(def, p.interval || 3)) {
        state.petRegenPct = Math.max(state.petRegenPct || 0, p.pctMaxHp || 0.08);
        state.petRegenTurns = Math.max(state.petRegenTurns || 0, p.regenTurns || 2);
        logEvt("good", `[패시브] 재생 ${Math.round((p.pctMaxHp || 0.08) * 100)}% (${p.regenTurns || 2}턴)`);
      }
      break;
    }
    case "bigHealIfHpBelow": {
      if (ps.bigHealCooldown > 0) { ps.bigHealCooldown--; break; }
      if (player.hp / player.maxHp < (p.hpThreshold || 0.30)) {
        const heal = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.50)));
        const res = applyPlayerHeal(player, heal);
        if (res.healed > 0) {
          logEvt("good", `[패시브] 대량 회복 +${res.healed}`);
          showFxToast({ title: "긴급 회복", subtitle: `+${res.healed}`, symbolId: "nature" });
        }
        ps.bigHealCooldown = p.cooldownTurns || 3;
      }
      break;
    }

    // --- Shields ---
    case "shieldOnLowCombo": {
      if (ps.comboAccumulator <= (p.comboMax || 3)) {
        const s = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.05)));
        player.shield = (player.shield || 0) + s;
        logEvt("good", `[패시브] 보호막 +${s} (낮은 콤보)`);
      }
      break;
    }
    case "shieldOnPattern": {
      const s = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.12)));
      player.shield = (player.shield || 0) + s;
      logEvt("good", `[패시브] 보호막 +${s}`);
      break;
    }
    case "grantShield": {
      const gs = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.10)));
      player.shield = (player.shield || 0) + gs;
      logEvt("good", `[패시브] 전투 시작 보호막 +${gs}`);
      break;
    }
    case "grantShieldWithDmgReduce": {
      const gsdr = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.15)));
      player.shield = (player.shield || 0) + gsdr;
      state.playerDmgReduction = Math.max(state.playerDmgReduction || 0, p.dmgReduce || 0.10);
      state.playerDmgReductionTurns = 999; // permanent for this battle
      logEvt("good", `[패시브] 보호막 +${gsdr}, 받피 -${Math.round((p.dmgReduce || 0.10) * 100)}%`);
      break;
    }
    case "emergencyShield": {
      if (!canTrigger(def, p.maxTriggers)) break;
      const es = Math.max(1, Math.floor(player.maxHp * (p.shieldPctMaxHp || 0.20)));
      player.shield = (player.shield || 0) + es;
      state.playerDmgReduction = Math.max(state.playerDmgReduction || 0, p.dmgReduce || 0.15);
      state.playerDmgReductionTurns = Math.max(state.playerDmgReductionTurns || 0, p.turns || 2);
      logEvt("good", `[패시브] 긴급 보호막 +${es}, 받피 -${Math.round((p.dmgReduce || 0.15) * 100)}%`);
      showFxToast({ title: "긴급 보호", subtitle: `보호막 +${es}`, symbolId: "water" });
      recordTrigger(def);
      break;
    }

    // --- Buffs ---
    case "periodicAtkBuff": {
      if (checkPeriodicCounter(def, p.interval || 3)) {
        if (p.stackable) {
          ps.stackingAtkBonus += (p.pct || 0.04);
        }
        logEvt("good", `[패시브] 공격력 +${Math.round((p.pct || 0.04) * 100)}%`);
      }
      break;
    }
    case "atkBuff": {
      ps.atkBuffFromPassive = Math.max(ps.atkBuffFromPassive, p.pct || 0.25);
      ps.atkBuffFromPassiveTurns = Math.max(ps.atkBuffFromPassiveTurns, p.turns || 2);
      logEvt("good", `[패시브] 공격력 +${Math.round((p.pct || 0.25) * 100)}% (${p.turns || 2}턴)`);
      break;
    }
    case "stackingAtkBuff": {
      ps.stackingAtkBonus += (p.pct || 0.04);
      logEvt("good", `[패시브] 공격력 +${Math.round((p.pct || 0.04) * 100)}% (누적 ${Math.round(ps.stackingAtkBonus * 100)}%)`);
      break;
    }
    case "atkBuffIfEnemyStatusCount": {
      if (petStatusCount(enemy) >= (p.minCount || 2)) {
        ps.atkBuffFromPassive = Math.max(ps.atkBuffFromPassive, p.pct || 0.20);
        ps.atkBuffFromPassiveTurns = Math.max(ps.atkBuffFromPassiveTurns, p.turns || 2);
        logEvt("good", `[패시브] 적 상태이상 ${p.minCount}개 이상 → 공격력 +${Math.round((p.pct || 0.20) * 100)}%`);
      }
      break;
    }
    case "critDmgBuff": {
      ps.critDmgFromPassive = Math.max(ps.critDmgFromPassive, p.pct || 0.50);
      ps.critDmgFromPassiveTurns = Math.max(ps.critDmgFromPassiveTurns, p.turns || 3);
      logEvt("good", `[패시브] 크리 피해 +${Math.round((p.pct || 0.50) * 100)}% (${p.turns || 3}턴)`);
      break;
    }
    case "enemyHpBelowDmgBonus": {
      if (enemy && enemy.hp > 0 && enemy.maxHp > 0 && enemy.hp / enemy.maxHp < (p.hpThreshold || 0.50)) {
        ps.enemyHpBelowDmgBonus = Math.max(ps.enemyHpBelowDmgBonus, p.dmgBonus || 0.50);
        ps.enemyHpBelowThreshold = p.hpThreshold || 0.50;
      } else {
        ps.enemyHpBelowDmgBonus = 0;
      }
      break;
    }

    // --- Debuffs on enemy ---
    case "debuffTakeDmg": {
      state.enemyTakeDmgDebuff = Math.max(state.enemyTakeDmgDebuff || 0, p.pct || 0.10);
      state.enemyTakeDmgDebuffTurns = Math.max(state.enemyTakeDmgDebuffTurns || 0, p.turns || 1);
      logEvt("good", `[패시브] 적 받피 +${Math.round((p.pct || 0.10) * 100)}%`);
      break;
    }
    case "periodicDebuffTakeDmg": {
      if (checkPeriodicCounter(def, p.interval || 4)) {
        state.enemyTakeDmgDebuff = Math.max(state.enemyTakeDmgDebuff || 0, p.pct || 0.15);
        state.enemyTakeDmgDebuffTurns = Math.max(state.enemyTakeDmgDebuffTurns || 0, p.turns || 2);
        logEvt("good", `[패시브] 적 받피 +${Math.round((p.pct || 0.15) * 100)}% (${p.turns || 2}턴)`);
      }
      break;
    }
    case "debuffTakeDmgIfEnemyFrozen": {
      if (enemy && enemy.status && (enemy.status.frozenTurns || 0) > 0) {
        state.enemyTakeDmgDebuff = Math.max(state.enemyTakeDmgDebuff || 0, p.pct || 0.10);
        state.enemyTakeDmgDebuffTurns = Math.max(state.enemyTakeDmgDebuffTurns || 0, p.turns || 2);
        logEvt("good", `[패시브] 빙결 상태 → 적 받피 +${Math.round((p.pct || 0.10) * 100)}%`);
      }
      break;
    }
    case "debuffTakeDmgIfEnemyStatusCount": {
      if (petStatusCount(enemy) >= (p.minCount || 3)) {
        state.enemyTakeDmgDebuff = Math.max(state.enemyTakeDmgDebuff || 0, p.pct || 0.10);
        state.enemyTakeDmgDebuffTurns = Math.max(state.enemyTakeDmgDebuffTurns || 0, p.turns || 2);
        logEvt("good", `[패시브] 적 상태이상 ${p.minCount}개 이상 → 받피 +${Math.round((p.pct || 0.10) * 100)}%`);
      }
      break;
    }
    case "debuffTakeDmgIfEnemyCC": {
      const statusList = p.statusList || ["stun", "freeze"];
      const hasCC = enemy && enemy.status && statusList.some(s => {
        if (s === "stun") return (enemy.status.stunnedTurns || 0) > 0;
        if (s === "freeze") return (enemy.status.frozenTurns || 0) > 0;
        return false;
      });
      if (hasCC) {
        state.enemyTakeDmgDebuff = Math.max(state.enemyTakeDmgDebuff || 0, p.pct || 0.15);
        state.enemyTakeDmgDebuffTurns = Math.max(state.enemyTakeDmgDebuffTurns || 0, p.turns || 2);
        logEvt("good", `[패시브] 적 CC 상태 → 받피 +${Math.round((p.pct || 0.15) * 100)}%`);
      }
      break;
    }
    case "permanentEnemyAtkReduce": {
      ps.permanentAtkReduce += (p.pct || 0.10);
      state.petEnemyAtkDebuff = Math.max(state.petEnemyAtkDebuff || 0, ps.permanentAtkReduce);
      state.petEnemyAtkDebuffTurns = 999; // permanent
      logEvt("good", `[패시브] 적 공격력 영구 -${Math.round(ps.permanentAtkReduce * 100)}%`);
      break;
    }

    // --- Cooldown reduction ---
    case "cdReduce": {
      const petDef = equippedPetDef(0);
      if (petDef && petCooldownTurnsById(petDef.id) > 0) {
        setPetCooldownTurns(petDef.id, petCooldownTurnsById(petDef.id) - (p.cdReduce || 1));
        logEvt("good", `[패시브] 쿨타임 -${p.cdReduce || 1}`);
      }
      break;
    }
    case "cdReduceIfHpBelow": {
      if (player.hp / player.maxHp < (p.hpThreshold || 0.40)) {
        const petDef = equippedPetDef(0);
        if (petDef && petCooldownTurnsById(petDef.id) > 0) {
          setPetCooldownTurns(petDef.id, petCooldownTurnsById(petDef.id) - (p.cdReduce || 1));
          logEvt("good", `[패시브] HP ${Math.round((p.hpThreshold || 0.40) * 100)}% 미만 → 쿨타임 -${p.cdReduce || 1}`);
        }
      }
      break;
    }
    case "cdReduceIfEnemyStatus": {
      if (enemy && enemy.status) {
        const s = p.enemyStatus;
        const has = (s === "freeze" && (enemy.status.frozenTurns || 0) > 0) ||
                    (s === "stun" && (enemy.status.stunnedTurns || 0) > 0) ||
                    (s === "burn" && (enemy.status.burnTurns || 0) > 0) ||
                    (s === "bleed" && (enemy.status.bleedTurns || 0) > 0);
        if (has) {
          const petDef = equippedPetDef(0);
          if (petDef && petCooldownTurnsById(petDef.id) > 0) {
            setPetCooldownTurns(petDef.id, petCooldownTurnsById(petDef.id) - (p.cdReduce || 1));
            logEvt("good", `[패시브] 적 ${s} → 쿨타임 -${p.cdReduce || 1}`);
          }
        }
      }
      break;
    }
    case "cdReduceIfEnemyBurn": {
      if (enemy && enemy.status && (enemy.status.burnStacks || 0) >= (p.minStacks || 4)) {
        const petDef = equippedPetDef(0);
        if (petDef && petCooldownTurnsById(petDef.id) > 0) {
          setPetCooldownTurns(petDef.id, petCooldownTurnsById(petDef.id) - (p.cdReduce || 1));
          logEvt("good", `[패시브] 적 화상 ${p.minStacks}+ → 쿨타임 -${p.cdReduce || 1}`);
        }
      }
      break;
    }
    case "cdReduceIfEnemyBleed": {
      if (enemy && enemy.status && (enemy.status.bleedStacks || 0) >= (p.minStacks || 2)) {
        const petDef = equippedPetDef(0);
        if (petDef && petCooldownTurnsById(petDef.id) > 0) {
          setPetCooldownTurns(petDef.id, petCooldownTurnsById(petDef.id) - (p.cdReduce || 1));
          logEvt("good", `[패시브] 적 출혈 ${p.minStacks}+ → 쿨타임 -${p.cdReduce || 1}`);
        }
      }
      break;
    }
    case "cdReduceIfEnemyDoT": {
      if (petEnemyDoTCount(enemy) >= (p.minStacks || 4)) {
        const petDef = equippedPetDef(0);
        if (petDef && petCooldownTurnsById(petDef.id) > 0) {
          setPetCooldownTurns(petDef.id, petCooldownTurnsById(petDef.id) - (p.cdReduce || 1));
          logEvt("good", `[패시브] 적 DoT ${p.minStacks}+ → 쿨타임 -${p.cdReduce || 1}`);
        }
      }
      break;
    }

    // --- Cleanse ---
    case "cleansePlayerCC": {
      if (!player.status) break;
      const targets = Array.isArray(p.targetStatus) ? p.targetStatus : [p.targetStatus];
      const chance = p.chance || 0.50;
      for (const s of targets) {
        if (Math.random() >= chance) continue;
        if (s === "freeze" && (player.status.frozenTurns || 0) > 0) {
          player.status.frozenTurns = 0;
          logEvt("good", `[패시브] 빙결 해제`);
        }
        if (s === "stun" && (player.status.stunnedTurns || 0) > 0) {
          player.status.stunnedTurns = 0;
          logEvt("good", `[패시브] 기절 해제`);
        }
      }
      break;
    }
    case "cleansePlayerDoT": {
      if (!player.status) break;
      if (p.type === "burn" && ((player.status.burnTurns || 0) > 0 || (player.status.burnStacks || 0) > 0)) {
        player.status.burnTurns = 0;
        player.status.burnStacks = 0;
        if (player.status.burnByTurns) player.status.burnByTurns = {};
        logEvt("good", `[패시브] 화상 정화`);
      }
      if (p.type === "bleed" && ((player.status.bleedTurns || 0) > 0 || (player.status.bleedStacks || 0) > 0)) {
        player.status.bleedTurns = 0;
        player.status.bleedStacks = 0;
        logEvt("good", `[패시브] 출혈 정화`);
      }
      break;
    }
    case "cleanseAny": {
      if (!player.status) break;
      let cleansed = 0;
      const max = p.count || 1;
      // Priority: CC first, then DoT
      if (cleansed < max && (player.status.stunnedTurns || 0) > 0) {
        player.status.stunnedTurns = 0; cleansed++;
        logEvt("good", `[패시브] 기절 정화`);
      }
      if (cleansed < max && (player.status.frozenTurns || 0) > 0) {
        player.status.frozenTurns = 0; cleansed++;
        logEvt("good", `[패시브] 빙결 정화`);
      }
      if (cleansed < max && (player.status.burnTurns || 0) > 0) {
        player.status.burnTurns = 0; player.status.burnStacks = 0;
        if (player.status.burnByTurns) player.status.burnByTurns = {};
        cleansed++;
        logEvt("good", `[패시브] 화상 정화`);
      }
      if (cleansed < max && (player.status.bleedTurns || 0) > 0) {
        player.status.bleedTurns = 0; player.status.bleedStacks = 0;
        cleansed++;
        logEvt("good", `[패시브] 출혈 정화`);
      }
      break;
    }
    case "periodicCleanseDoT": {
      if (checkPeriodicCounter(def, p.interval || 3)) {
        if (!player.status) break;
        let cleansed = 0;
        const max = p.count || 1;
        if (cleansed < max && ((player.status.burnTurns || 0) > 0 || (player.status.burnStacks || 0) > 0)) {
          player.status.burnTurns = 0; player.status.burnStacks = 0;
          if (player.status.burnByTurns) player.status.burnByTurns = {};
          cleansed++;
          logEvt("good", `[패시브] 화상 주기 정화`);
        }
        if (cleansed < max && ((player.status.bleedTurns || 0) > 0 || (player.status.bleedStacks || 0) > 0)) {
          player.status.bleedTurns = 0; player.status.bleedStacks = 0;
          cleansed++;
          logEvt("good", `[패시브] 출혈 주기 정화`);
        }
      }
      break;
    }
    case "emergencyHealAndCleanse": {
      if (!canTrigger(def, p.maxTriggers)) break;
      const heal = Math.max(1, Math.floor(player.maxHp * (p.healPctMaxHp || 0.25)));
      const res = applyPlayerHeal(player, heal);
      if (p.cleanseAll && player.status) {
        player.status.frozenTurns = 0;
        player.status.stunnedTurns = 0;
        player.status.burnTurns = 0; player.status.burnStacks = 0;
        if (player.status.burnByTurns) player.status.burnByTurns = {};
        player.status.bleedTurns = 0; player.status.bleedStacks = 0;
      }
      logEvt("good", `[패시브] 긴급 회복 +${res.healed} + 전체 정화`);
      showFxToast({ title: "긴급 정화", subtitle: `+${res.healed}`, symbolId: "water" });
      recordTrigger(def);
      break;
    }

    // --- Periodic DoT on enemy ---
    case "periodicBleed": {
      if (!enemy || enemy.hp <= 0) break;
      if (checkPeriodicCounter(def, p.interval || 2)) {
        applyBleed(enemy, player, p.stacks || 1, p.turns || 2);
        logEvt("good", `[패시브] 주기 출혈 ${p.stacks || 1}×${p.turns || 2}턴`);
      }
      break;
    }

    // --- Round-based effects ---
    case "talismanBonusIncrease": {
      if (ps.roundNumber >= (p.afterRound || 7)) {
        // Increase talisman bonus on all existing talismans
        if (state.petTalismans && state.petTalismans.length > 0) {
          for (const t of state.petTalismans) {
            t.bonus += (p.addCount || 1);
          }
          logEvt("good", `[패시브] 부적 보너스 +${p.addCount || 1}`);
        }
      }
      break;
    }
    case "comboIntervalReduce": {
      if (ps.roundNumber >= (p.afterRound || 7)) {
        ps.comboIntervalReduce = Math.max(ps.comboIntervalReduce, p.reduce || 1);
        logEvt("good", `[패시브] 콤보 간격 -${p.reduce || 1}`);
      }
      break;
    }
    case "addTalismanOnActive": {
      // Only triggers if active skill is available (not on cooldown)
      if (ps.roundNumber >= (p.afterRound || 7)) {
        const petDef = equippedPetDef(0);
        if (petDef && petCooldownTurnsById(petDef.id) <= 0) {
          // Add a talisman
          const orient = p.orientation || "col";
          const bonus = p.bonus || 3;
          const max = orient === "row" ? 3 : 5; // ROWS or COLS
          const existing = (state.petTalismans || []).map(t => `${t.orientation}:${t.idx}`);
          const avail = [];
          for (let i = 0; i < max; i++) {
            if (!existing.includes(`${orient}:${i}`)) avail.push(i);
          }
          if (avail.length) {
            const idx = avail[Math.floor(Math.random() * avail.length)];
            if (!state.petTalismans) state.petTalismans = [];
            state.petTalismans.push({ orientation: orient, idx, bonus, turnsLeft: 999 });
            logEvt("good", `[패시브] +${bonus} ${orient === "row" ? "가로" : "세로"} 부적 추가`);
          }
        }
      }
      break;
    }
    case "activeTurnsAndX2Rune": {
      // Extend active skill duration + place x2 rune (simplified: just reduce cooldown)
      if (ps.roundNumber >= (p.afterRound || 7)) {
        const petDef = equippedPetDef(0);
        if (petDef) {
          // Reduce cooldown as a proxy for "extend active turns"
          if (petCooldownTurnsById(petDef.id) > 0) {
            setPetCooldownTurns(petDef.id, Math.max(0, petCooldownTurnsById(petDef.id) - (p.activeTurns || 3)));
          }
          logEvt("good", `[패시브] 액티브 연장 ${p.activeTurns || 3}턴 + x2 룬`);
        }
      }
      break;
    }

    // --- Special / Ultimate ---
    case "gwangpokhwa": {
      // 광폭화: sacrifice HP for massive damage
      if (!canTrigger(def, p.maxTriggers)) break;
      if (!enemy || enemy.hp <= 0) break;
      const hpCost = Math.max(1, Math.floor(player.hp * (p.hpCostPct || 0.20)));
      player.hp = Math.max(1, player.hp - hpCost);
      addTurnDamage("player", hpCost);
      const res = usePetDirectDamage(p.mult || 1.50);
      if (p.disablesPassives) ps.passivesDisabled = true;
      logEvt("good", `[패시브] 광폭화! 체력 -${hpCost}, 피해 ${res.dealt}`);
      showFxToast({ title: "광폭화", subtitle: `피해 ${res.dealt}`, symbolId: "fire" });
      recordTrigger(def);
      break;
    }
    case "statusExplosion": {
      // 상태이상 폭발
      if (!canTrigger(def, p.maxTriggers)) break;
      if (!enemy || enemy.hp <= 0) break;
      const count = petStatusCount(enemy);
      if (count >= (p.minCount || 5)) {
        // Extend all status durations
        if (enemy.status) {
          if (enemy.status.burnTurns > 0) enemy.status.burnTurns += (p.extendTurns || 1);
          if (enemy.status.bleedTurns > 0) enemy.status.bleedTurns += (p.extendTurns || 1);
          if (enemy.status.frozenTurns > 0) enemy.status.frozenTurns += (p.extendTurns || 1);
          if (enemy.status.stunnedTurns > 0) enemy.status.stunnedTurns += (p.extendTurns || 1);
        }
        ps.atkBuffFromPassive = Math.max(ps.atkBuffFromPassive, p.atkPct || 0.25);
        ps.atkBuffFromPassiveTurns = Math.max(ps.atkBuffFromPassiveTurns, p.atkTurns || 3);
        logEvt("good", `[패시브] 상태이상 폭발! 연장 +${p.extendTurns || 1}턴, 공격력 +${Math.round((p.atkPct || 0.25) * 100)}%`);
        showFxToast({ title: "저주의 폭발", subtitle: `상태이상 연장 + 공격력↑`, symbolId: "nature" });
        recordTrigger(def);
      }
      break;
    }
    case "lastShield": {
      // 최후의 방패: heal to threshold, disable passives
      if (!canTrigger(def, p.maxTriggers)) break;
      const targetHp = Math.max(1, Math.floor(player.maxHp * (p.healToHpPct || 0.20)));
      if (player.hp < targetHp) {
        const healAmt = targetHp - player.hp;
        player.hp = targetHp;
        logEvt("good", `[패시브] 최후의 방패! 체력 → ${targetHp}`);
      } else {
        logEvt("good", `[패시브] 최후의 방패 발동!`);
      }
      if (p.disablesPassives) ps.passivesDisabled = true;
      showFxToast({ title: "최후의 방패", subtitle: "생존 모드", symbolId: "water" });
      recordTrigger(def);
      break;
    }

    default:
      // passiveModify effects are handled inline in usePetActiveSkill/petPassiveAttackMult
      break;
  }
}

// ============================================================
// PET PASSIVE TRIGGER HOOKS
// ============================================================

/** Called at battle start */
function applyPetBattleStartPassives(player) {
  const passives = getEquippedPetActivePassives();
  const enemy = state.enemy;
  for (const def of passives) {
    if (def.trigger !== "battleStart") continue;
    executePetPassiveEffect(def, player, enemy);
  }
}

/** Called every turn start (before spin). Also handles existing regen. */
function applyPetTurnStartPassives(player, enemy) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;

  const passives = getEquippedPetActivePassives();
  const ps = state.petPassiveState;

  // Reset per-turn limits
  ps.onHitUsedThisTurn = false;

  // Decrement big heal cooldown
  if (ps.bigHealCooldown > 0) ps.bigHealCooldown--;

  // Decrement passive atk buff turns
  if (ps.atkBuffFromPassiveTurns > 0) ps.atkBuffFromPassiveTurns--;
  if (ps.atkBuffFromPassiveTurns <= 0) ps.atkBuffFromPassive = 0;

  // Decrement passive crit buff turns
  if (ps.critDmgFromPassiveTurns > 0) ps.critDmgFromPassiveTurns--;
  if (ps.critDmgFromPassiveTurns <= 0) ps.critDmgFromPassive = 0;

  for (const def of passives) {
    if (def.trigger !== "turnStart") continue;
    executePetPassiveEffect(def, player, enemy);
  }

  // Check hpBelow triggers
  for (const def of passives) {
    if (def.trigger !== "hpBelow") continue;
    const p = def.params || {};
    if (player.hp / player.maxHp < (p.hpThreshold || 0.30)) {
      executePetPassiveEffect(def, player, enemy);
    }
  }

  // Check special triggers (per-turn evaluation)
  for (const def of passives) {
    if (def.trigger !== "special") continue;
    const p = def.params || {};
    if (def.effect === "gwangpokhwa") {
      // Triggers periodically
      if (checkPeriodicCounter(def, p.interval || 2)) {
        executePetPassiveEffect(def, player, enemy);
      }
    }
    if (def.effect === "statusExplosion") {
      executePetPassiveEffect(def, player, enemy);
    }
    if (def.effect === "lastShield") {
      if (player.hp / player.maxHp < 0.15) {
        executePetPassiveEffect(def, player, enemy);
      }
    }
  }
}

/** Called when player is hit by enemy attack */
function applyPetOnHitPassives(player, enemy, damage) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;

  const passives = getEquippedPetActivePassives();
  const ps = state.petPassiveState;

  for (const def of passives) {
    if (def.trigger !== "onHit") continue;
    const p = def.params || {};

    // Per-turn limit check
    if (p.perTurnLimit && ps.onHitUsedThisTurn) continue;

    // Cooldown check for counterStun with cooldownTurns
    if (p.cooldownTurns) {
      const key = passiveKey(def) + "_cd";
      if ((ps.periodicCounters[key] || 0) > 0) {
        ps.periodicCounters[key]--;
        continue;
      }
      executePetPassiveEffect(def, player, enemy);
      ps.periodicCounters[key] = p.cooldownTurns;
    } else {
      executePetPassiveEffect(def, player, enemy);
    }

    if (p.perTurnLimit) ps.onHitUsedThisTurn = true;
  }

  // Check hpBelow triggers after taking damage
  for (const def of passives) {
    if (def.trigger !== "hpBelow") continue;
    const p = def.params || {};
    if (player.hp > 0 && player.hp / player.maxHp < (p.hpThreshold || 0.30)) {
      executePetPassiveEffect(def, player, enemy);
    }
  }
}

/** Called after spin with the combo count (number of matches) */
function applyPetComboPassives(player, enemy, comboCount) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;

  const passives = getEquippedPetActivePassives();
  const ps = state.petPassiveState;

  // Update cumulative combo accumulator
  ps.comboAccumulator += comboCount;

  for (const def of passives) {
    const p = def.params || {};

    if (def.trigger === "comboThreshold") {
      if (comboCount >= (p.threshold || 7)) {
        executePetPassiveEffect(def, player, enemy);
      }
    }

    if (def.trigger === "comboInterval") {
      const interval = Math.max(1, (p.interval || 5) - ps.comboIntervalReduce);
      // Check how many times the interval was crossed
      const prevAccum = ps.comboAccumulator - comboCount;
      const crossings = Math.floor(ps.comboAccumulator / interval) - Math.floor(prevAccum / interval);
      for (let i = 0; i < crossings; i++) {
        executePetPassiveEffect(def, player, enemy);
      }
    }

    if (def.trigger === "afterSpin") {
      executePetPassiveEffect(def, player, enemy);
    }
  }
}

/** Called after pattern checks with match results from findMatches */
function applyPetPatternPassives(player, enemy, matches) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;

  const passives = getEquippedPetActivePassives();
  const ps = state.petPassiveState;

  // Count H (row) and V (col) matches
  let hCount = 0, vCount = 0;
  for (const m of matches) {
    if (m.dir === "H") hCount++;
    if (m.dir === "V") vCount++;
  }
  ps.patternCounters.row += hCount;
  ps.patternCounters.col += vCount;

  for (const def of passives) {
    if (def.trigger !== "patternCheck") continue;
    const p = def.params || {};
    const orient = p.orientation || "col";
    const interval = p.interval || 3;
    const counter = orient === "row" ? "row" : "col";
    const added = orient === "row" ? hCount : vCount;

    if (added <= 0) continue;

    // Check how many times interval was crossed
    const current = ps.patternCounters[counter];
    const prev = current - added;
    const crossings = Math.floor(current / interval) - Math.floor(prev / interval);
    for (let i = 0; i < crossings; i++) {
      executePetPassiveEffect(def, player, enemy);
    }
  }

  // Handle fixedSymbolMatch triggers (when fixed cells match)
  if (state.petFixedCells && state.petFixedCells.length > 0) {
    const fixedSet = new Set(state.petFixedCells.map(c => `${c.r},${c.c}`));
    let fixedMatched = false;
    for (const m of matches) {
      for (const [r, c] of m.cells) {
        if (fixedSet.has(`${r},${c}`)) {
          fixedMatched = true;
          break;
        }
      }
      if (fixedMatched) break;
    }

    if (fixedMatched) {
      let fixedTurnUsed = false;
      for (const def of passives) {
        if (def.trigger !== "fixedSymbolMatch") continue;
        const p = def.params || {};
        if (p.perTurnLimit && fixedTurnUsed) continue;
        executePetPassiveEffect(def, player, enemy);
        if (p.perTurnLimit) fixedTurnUsed = true;
      }
    }
  }

  // Handle rerollMatch triggers (when rerolled cells match)
  // Simplified: if there are active rerolls and matches exist, trigger
  if (state.petRerollTurns > 0 && matches.length > 0) {
    let rerollTurnUsed = false;
    for (const def of passives) {
      if (def.trigger !== "rerollMatch") continue;
      const p = def.params || {};
      if (p.perTurnLimit && rerollTurnUsed) continue;
      executePetPassiveEffect(def, player, enemy);
      if (p.perTurnLimit) rerollTurnUsed = true;
    }
  }
}

/** Called when active skill is used */
function applyPetOnActivePassives(player, enemy) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;

  const passives = getEquippedPetActivePassives();
  for (const def of passives) {
    if (def.trigger !== "onActiveUse") continue;
    executePetPassiveEffect(def, player, enemy);
  }
}

/** Called at end of round (after enemy turn completes) */
function applyPetAfterRoundPassives(player, enemy) {
  if (!player || player.hp <= 0) return;
  if (!state.petPassiveState) return;
  if (state.petPassiveState.passivesDisabled) return;

  const passives = getEquippedPetActivePassives();
  const ps = state.petPassiveState;

  // Increment round number (player turn + enemy turn = 1 round)
  ps.roundNumber++;

  for (const def of passives) {
    if (def.trigger !== "afterRound") continue;
    const p = def.params || {};
    const triggerRound = p.triggerRound || p.afterRound || 5;
    if (ps.roundNumber >= triggerRound) {
      executePetPassiveEffect(def, player, enemy);
    }
  }
}

/** Get passiveModify effects for active skill modifications */
function getPetPassiveModifiers() {
  const passives = getEquippedPetActivePassives();
  const mods = {};
  for (const def of passives) {
    if (def.trigger !== "passiveModify") continue;
    mods[def.effect] = def.params;
  }
  return mods;
}

function petCooldownTurnsById(petId) {
  if (!petId || !state.petCooldownById) return 0;
  return Math.max(0, Math.floor(state.petCooldownById[petId] || 0));
}

function setPetCooldownTurns(petId, turns) {
  if (!petId) return;
  if (!state.petCooldownById || typeof state.petCooldownById !== "object") state.petCooldownById = {};
  state.petCooldownById[petId] = Math.max(0, Math.floor(turns || 0));
}

function tickPetCooldownsAfterSpin() {
  if (!state.petCooldownById || typeof state.petCooldownById !== "object") return;
  for (const id of Object.keys(state.petCooldownById)) {
    if (state.petCooldownById[id] > 0) state.petCooldownById[id] -= 1;
  }
}

function canUsePetActive(petId = null) {
  if (!state.player || !state.enemy) return false;
  if (state.busy || isModalOpen() || isHelpOpen() || isCodexOpen() || isBattleOver()) return false;
  const pet = petId ? PET_BY_ID[petId] : equippedPetDef(0);
  if (!pet || !isPetOwned(pet.id)) return false;
  if (!equippedPetIds().includes(pet.id)) return false;
  if (petCooldownTurnsById(pet.id) > 0) return false;
  return true;
}

function usePetDirectDamage(mult, opts = {}) {
  const dmg = Math.max(1, Math.floor((state.player.baseMatchDamage || 1) * mult));
  const res = applyEnemyDamage(state.enemy, dmg, { fire: 0, light: 0, nature: 0, water: 0 }, opts);
  if (res.dealt > 0) {
    flashEl(ui.enemyHpBar);
    pulseClass(ui.enemyPanel, "panel--hit", 190);
    pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
  }
  return res;
}

function executePetEffect(eff, player, enemy) {
  if (!eff || !eff.type) return { log: "" };
  const p = eff.params || {};
  switch (eff.type) {
    case "directDamage": {
      const res = usePetDirectDamage(p.mult || 1.0);
      return { log: `피해 ${res.dealt}` };
    }
    case "burn": {
      applyBurn(enemy, player, p.stacks || 1, p.turns || 3);
      return { log: `화상 ${p.stacks || 1}×${p.turns || 3}턴` };
    }
    case "bleed": {
      applyBleed(enemy, player, p.stacks || 1, p.turns || 3);
      return { log: `출혈 ${p.stacks || 1}×${p.turns || 3}턴` };
    }
    case "bleedOnHit": {
      // 피격 시마다 적에게 출혈 부여 (가시방패)
      state.bleedOnHitStacks = p.stacks || 1;
      state.bleedOnHitBleedTurns = p.bleedTurns || 3;
      state.bleedOnHitDuration = Math.max(state.bleedOnHitDuration || 0, p.duration || 3);
      return { log: `가시방패: 피격 시 출혈 ${p.duration || 3}턴간` };
    }
    case "freeze": {
      addEnemyFreezeTurns(enemy, p.turns || 1);
      return { log: `빙결 ${p.turns}턴` };
    }
    case "stun": {
      addEnemyStunTurns(enemy, p.turns || 1);
      return { log: `기절 ${p.turns}턴` };
    }
    case "heal": {
      const heal = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.1)));
      const res = applyPlayerHeal(player, heal);
      if (p.regenPct && p.regenTurns) {
        state.petRegenPct = p.regenPct;
        state.petRegenTurns = Math.max(state.petRegenTurns || 0, p.regenTurns);
      }
      return { log: `회복 +${res.healed}` };
    }
    case "shield": {
      const s = Math.max(1, Math.floor(player.maxHp * (p.pctMaxHp || 0.1)));
      player.shield = (player.shield || 0) + s;
      return { log: `보호막 +${s}` };
    }
    case "atkBuff": {
      state.petAttackBuffTurns = Math.max(state.petAttackBuffTurns || 0, p.turns || 2);
      state.petAttackBuffMult = Math.max(state.petAttackBuffMult || 1, 1 + (p.pct || 0.2));
      return { log: `공격력 +${Math.round((p.pct || 0.2) * 100)}%` };
    }
    case "critBuff": {
      state.petCritRateBuff = (state.petCritRateBuff || 0) + (p.ratePct || 0);
      state.petCritDmgBuff = (state.petCritDmgBuff || 0) + (p.dmgPct || 0);
      state.petCritBuffTurns = Math.max(state.petCritBuffTurns || 0, p.turns || 2);
      return { log: `크리 버프 ${p.turns || 2}턴` };
    }
    case "dmgReduction": {
      state.playerDmgReduction = p.pct || 0.15;
      state.playerDmgReductionTurns = Math.max(state.playerDmgReductionTurns || 0, p.turns || 3);
      return { log: `받피 -${Math.round((p.pct || 0.15) * 100)}%` };
    }
    case "debuffTakeDmg": {
      state.enemyTakeDmgDebuff = (state.enemyTakeDmgDebuff || 0) + (p.pct || 0.15);
      state.enemyTakeDmgDebuffTurns = Math.max(state.enemyTakeDmgDebuffTurns || 0, p.turns || 2);
      return { log: `적 받피 +${Math.round((p.pct || 0.15) * 100)}%` };
    }
    case "debuffAtk": {
      state.petEnemyAtkDebuff = (state.petEnemyAtkDebuff || 0) + (p.pct || 0.1);
      state.petEnemyAtkDebuffTurns = Math.max(state.petEnemyAtkDebuffTurns || 0, p.turns || 2);
      return { log: `적 공격력 -${Math.round((p.pct || 0.1) * 100)}%` };
    }
    case "spinMultiplier": {
      state.petSpinDamageMult = Math.max(state.petSpinDamageMult || 1, p.mult || 2);
      return { log: `스핀 피해 x${p.mult}` };
    }
    case "selfDamage": {
      const cut = Math.max(1, Math.floor(player.hp * (p.pctCurrentHp || 0.15)));
      player.hp = Math.max(1, player.hp - cut);
      addTurnDamage("player", cut);
      return { log: `체력 -${cut}` };
    }
    case "cleanseDoT": {
      const cleansed = [];
      if (player.status) {
        if (player.status.burnTurns > 0 || player.status.burnStacks > 0) {
          player.status.burnTurns = 0;
          player.status.burnStacks = 0;
          if (player.status.burnByTurns) player.status.burnByTurns = {};
          cleansed.push("화상");
        }
      }
      return { log: cleansed.length ? `${cleansed.join("/")} 해제` : `지속피해 없음` };
    }
    case "cleanseCC": {
      const cleansed = [];
      if (player.status) {
        if ((player.status.frozenTurns || 0) > 0) {
          player.status.frozenTurns = 0;
          cleansed.push("빙결");
        }
        if ((player.status.stunnedTurns || 0) > 0) {
          player.status.stunnedTurns = 0;
          cleansed.push("기절");
        }
      }
      return { log: cleansed.length ? `${cleansed.join("/")} 해제` : `행동불가 없음` };
    }
    case "reroll": {
      state.petRerollCount = Math.max(state.petRerollCount || 0, p.count || 3);
      state.petRerollTurns = Math.max(state.petRerollTurns || 0, p.turns || 2);
      return { log: `리롤 ${p.count || 3}개 (${p.turns || 2}턴)` };
    }
    case "fixSymbol": {
      // Pick N random cells from current grid to lock
      const fixCount = p.count || 1;
      const fixTurns = p.turns || 3;
      if (state.grid) {
        const candidates = [];
        const alreadyFixed = new Set((state.petFixedCells || []).map(c => `${c.r},${c.c}`));
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (!alreadyFixed.has(`${r},${c}`)) candidates.push({ r, c });
          }
        }
        const picks = uniqueSample(candidates, Math.min(fixCount, candidates.length));
        const newFixed = picks.map(({ r, c }) => ({ r, c, id: state.grid[r][c] }));
        state.petFixedCells = (state.petFixedCells || []).concat(newFixed);
      }
      state.petFixTurns = Math.max(state.petFixTurns || 0, fixTurns);
      return { log: `심볼 고정 ${fixCount}개 (${fixTurns}턴)` };
    }
    case "extraRowCheck": {
      state.petExtraRowCheckTurns = Math.max(state.petExtraRowCheckTurns || 0, p.turns || 2);
      return { log: `가로 추가체크 (${p.turns || 2}턴)` };
    }
    case "talisman": {
      const orient = p.orientation || "col";
      const bonus = p.bonus || 2;
      const turns = p.turns || 2;
      // Pick a random available row/col for talisman placement
      const existing = (state.petTalismans || []).map(t => `${t.orientation}:${t.idx}`);
      const max = orient === "row" ? ROWS : COLS;
      const avail = [];
      for (let i = 0; i < max; i++) {
        if (!existing.includes(`${orient}:${i}`)) avail.push(i);
      }
      if (avail.length) {
        const idx = pickOne(avail);
        if (!state.petTalismans) state.petTalismans = [];
        state.petTalismans.push({ orientation: orient, idx, bonus, turnsLeft: turns });
      }
      return { log: `+${bonus} ${orient === "row" ? "가로" : "세로"} 부적 (${turns}턴)` };
    }
    case "comboAttack": {
      state.petComboAttackInterval = p.interval || 3;
      state.petComboAttackMult = p.mult || 1.0;
      state.petComboAttackTurns = Math.max(state.petComboAttackTurns || 0, p.turns || 3);
      return { log: `콤보 공격 (${p.turns || 3}턴)` };
    }
    default:
      return { log: eff.type };
  }
}

// ─── Pet Active Popup ───────────────────────────────
function openPetActivePopup(petId) {
  const pet = PET_BY_ID[petId];
  if (!pet) return;
  // 이미 열려 있으면 닫기
  const existing = document.getElementById("petActivePopup");
  if (existing) existing.remove();

  const cd = petCooldownTurnsById(pet.id);
  const canUse = canUsePetActive(pet.id);
  const cdTxt = petActiveCooldownTurns(pet);

  const overlay = document.createElement("div");
  overlay.className = "petActivePopup";
  overlay.id = "petActivePopup";

  const iconSrc = pet.icon || "";
  const iconHtml = iconSrc
    ? `<img class="petActivePopup__icon" src="${iconSrc}" alt="${escapeHtml(pet.name)}" />`
    : `<div class="petActivePopup__icon" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);font-size:24px;">🐾</div>`;

  let cooldownHtml = "";
  if (cd > 0) {
    cooldownHtml = `<div class="petActivePopup__cooldownInfo">쿨타임 ${cd}턴 남음</div>`;
  }

  // Build passive list
  const unlockedCount = petUnlockedPassiveCount(pet.id);
  const passiveKeys = ["passive1", "passive2", "passive3", "passive4"];
  const passiveSlotLabels = ["P1", "P2", "P3", "P4"];
  let passiveHtml = "";
  const hasAnyPassive = passiveKeys.some(k => pet[k]);
  if (hasAnyPassive) {
    const rows = passiveKeys.map((k, i) => {
      const text = pet[k];
      if (!text) return "";
      const unlocked = (i + 1) <= unlockedCount;
      const lockIcon = unlocked ? "" : "🔒 ";
      const cls = unlocked ? "petActivePopup__passiveRow--on" : "petActivePopup__passiveRow--off";
      return `<div class="petActivePopup__passiveRow ${cls}"><span class="petActivePopup__passiveSlot">${passiveSlotLabels[i]}</span>${lockIcon}${escapeHtml(text)}</div>`;
    }).filter(Boolean).join("");
    passiveHtml = `<div class="petActivePopup__passiveSection"><div class="petActivePopup__passiveTitle">패시브</div>${rows}</div>`;
  }

  overlay.innerHTML = `
    <div class="petActivePopup__card">
      <div class="petActivePopup__header">
        ${iconHtml}
        <div class="petActivePopup__meta">
          <div class="petActivePopup__name">${escapeHtml(pet.name)}</div>
          <div class="petActivePopup__skillName">${escapeHtml(pet.activeName)}</div>
          <div class="petActivePopup__cd">쿨타임 ${cdTxt}턴</div>
        </div>
      </div>
      <div class="petActivePopup__desc">${escapeHtml(pet.activeDesc || "")}</div>
      ${passiveHtml}
      ${cooldownHtml}
      <div class="petActivePopup__actions">
        <button class="petActivePopup__btn petActivePopup__btn--close" id="petActivePopupClose">닫기</button>
        <button class="petActivePopup__btn petActivePopup__btn--use" id="petActivePopupUse" ${canUse ? "" : "disabled"}>
          ${canUse ? "스킬 사용" : (cd > 0 ? `${cd}턴 후 사용 가능` : "사용 불가")}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 배경 클릭 → 닫기
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePetActivePopup();
  });
  document.getElementById("petActivePopupClose").addEventListener("click", closePetActivePopup);
  const useBtn = document.getElementById("petActivePopupUse");
  if (useBtn && canUse) {
    useBtn.addEventListener("click", () => {
      closePetActivePopup();
      usePetActiveSkill(pet.id);
    });
  }
}

function closePetActivePopup() {
  const el = document.getElementById("petActivePopup");
  if (el) el.remove();
}

function usePetActiveSkill(petId = null) {
  if (!canUsePetActive(petId)) return;
  const pet = petId ? PET_BY_ID[petId] : equippedPetDef(0);
  if (!pet || !isPetOwned(pet.id)) return;

  // Check passiveModify effects that alter active skill behavior
  const mods = getPetPassiveModifiers();

  const effects = pet.activeEffects || [];
  const logParts = [];
  for (let eff of effects) {
    // Apply activeDurationAdd: extend duration-based effects
    if (mods.activeDurationAdd) {
      const mod = mods.activeDurationAdd;
      if (state.player.hp / state.player.maxHp < (mod.hpThreshold || 0.50)) {
        if (eff.params && eff.params.turns) {
          eff = { ...eff, params: { ...eff.params, turns: eff.params.turns + (mod.addTurns || 1) } };
        }
      }
    }
    // Apply activeBuffIfEnemyStun: bonus damage if enemy is stunned
    if (mods.activeBuffIfEnemyStun && state.enemy && state.enemy.status && (state.enemy.status.stunnedTurns || 0) > 0) {
      const mod = mods.activeBuffIfEnemyStun;
      if (eff.type === "directDamage" || eff.type === "comboAttack") {
        eff = { ...eff, params: { ...eff.params, mult: ((eff.params || {}).mult || 1.0) + (mod.dmgBonus || 0.20) } };
      }
    }
    const result = executePetEffect(eff, state.player, state.enemy);
    if (result.log) logParts.push(result.log);
  }

  const cd = petActiveCooldownTurns(pet);
  setPetCooldownTurns(pet.id, cd);
  state.petSkillUsedOnce = true;

  // Trigger onActiveUse passives
  applyPetOnActivePassives(state.player, state.enemy);

  const logLine = `${pet.name}: ${logParts.join(", ")}`;
  logEvt("good", logLine);

  const elementToSymbol = { fire: "fire", water: "water", nature: "nature", lightning: "light", none: "fire" };
  const symbolId = elementToSymbol[pet.element] || "fire";
  showFxToast({ title: `${pet.name} 액티브`, subtitle: `쿨타임 ${cd}턴`, symbolId });
  renderAll(false);
  if (state.enemy && state.enemy.hp <= 0) {
    onWin();
  }
}
