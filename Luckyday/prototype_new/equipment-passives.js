const EQUIP_B_VALUE = 0.05;

function equipmentLoadoutSignature() {
  const ids = (META && META.equip && Array.isArray(META.equip.equippedIds)) ? META.equip.equippedIds : [];
  const grades = (META && META.equip && Array.isArray(META.equip.equippedGrades)) ? META.equip.equippedGrades : [];
  const parts = [];
  for (let i = 0; i < EQUIP_MAX_SLOTS; i++) {
    parts.push(`${i}:${Number(ids[i] || 0)}:${Number(grades[i] || 0)}`);
  }
  return parts.join("|");
}

function equippedEquipmentEntries() {
  const ids = (META && META.equip && Array.isArray(META.equip.equippedIds)) ? META.equip.equippedIds : [];
  const grades = (META && META.equip && Array.isArray(META.equip.equippedGrades)) ? META.equip.equippedGrades : [];
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    const rid = ids[i];
    if (rid == null) continue;
    const rootId = Number(rid);
    const equip = EQUIP_BY_ROOT[rootId];
    if (!equip) continue;
    const grade = Math.max(0, Math.floor(Number(grades[i]) || 0));
    if (grade <= 0) continue;
    if (equip.equipmentType !== i + 1) continue;
    const inv = META && META.equip && META.equip.inventory ? META.equip.inventory[rootId] : null;
    if (!inv || !inv.grades) continue;
    if ((inv.grades[grade] || 0) <= 0) continue;
    out.push({ ...equip, rootId, grade, slotIdx: i });
  }
  return out;
}

function ensureEquipmentChapterState(chapter) {
  const ch = Math.max(1, Number(chapter || state.chapter || META.selectedChapter || 1));
  const loadoutSig = equipmentLoadoutSignature();
  if (!state.equipChapterState || state.equipChapterState.chapter !== ch || state.equipChapterState.loadoutSig !== loadoutSig) {
    state.equipChapterState = {
      chapter: ch,
      loadoutSig,
      maxHpPct: 0,
      atkPct: 0,
      used: {},
    };
  }
  return state.equipChapterState;
}

function ensureEquipmentBattleState() {
  if (!state.equipBattleState) {
    state.equipBattleState = {
      turn: 0,
      nextTurnDoubleRunes: 0,
      nextTurnRainbow: 0,
      tempAtkPct: 0,
      tempAtkTurns: 0,
      tempDmgAmpPct: 0,
      tempDmgAmpTurns: 0,
      tempCritDmgPct: 0,
      tempCritDmgTurns: 0,
      tempCritChancePct: 0,
      tempCritChanceTurns: 0,
      startDmgAmpPct: 0,
      startDmgAmpTurns: 0,
      startCritDmgPct: 0,
      startCritDmgTurns: 0,
      spinHpCostPct: 0,
      spinAtkPct: 0,
      spinCritDmgPct: 0,
      critTriggeredThisTurn: false,
    };
  }
  return state.equipBattleState;
}

function resetEquipmentBattleState() {
  state.equipBattleState = null;
}

function restoreEquipmentBaseStats(player) {
  if (!player || !player.equipBaseStats) return;
  const base = player.equipBaseStats;
  player.maxHp = Math.max(1, Math.floor(base.maxHp || 1));
  player.hp = Math.min(player.maxHp, Math.max(0, Math.floor(player.hp || 0)));
  player.baseMatchDamage = Math.max(1, Math.floor(base.baseMatchDamage || 1));
  player.damageReduction = Number.isFinite(base.damageReduction) ? base.damageReduction : 0;
  player.critDamageMult = Number.isFinite(base.critDamageMult) ? base.critDamageMult : 1.0;
  if (player.traits && player.traits.burn) {
    player.traits.burn.dmgPerStack = Math.max(1, Math.floor(base.burnDmgPerStack || player.traits.burn.dmgPerStack || 1));
  }
  player.equipPassive = {
    healMult: 1,
    dmgAmpPct: 0,
    spinFailReduce: 0,
    burnSelfReduce: 0,
    bleedSelfReduce: 0,
  };
  player.lowHpImmunity = false;
}

function equipEnemyStatusTypeCount(enemy) {
  if (!enemy || !enemy.status) return 0;
  let count = 0;
  if ((enemy.status.burnInstances && enemy.status.burnInstances.length > 0) || (enemy.status.burnTurns || 0) > 0) count += 1;
  if ((enemy.status.bleedTurns || 0) > 0 || (enemy.status.bleedStacks || 0) > 0) count += 1;
  if ((enemy.status.dizzyInstances && enemy.status.dizzyInstances.length > 0) || (enemy.status.dizzyTurns || 0) > 0) count += 1;
  if ((enemy.status.hypothermInstances && enemy.status.hypothermInstances.length > 0) || (enemy.status.hypothermTurns || 0) > 0) count += 1;
  if ((enemy.status.frozenTurns || 0) > 0) count += 1;
  if ((enemy.status.stunnedTurns || 0) > 0) count += 1;
  return count;
}

function equipEnemyBurnPreview(enemy) {
  if (!enemy || !enemy.status) return 0;
  if (enemy.status.burnInstances && enemy.status.burnInstances.length > 0) {
    return enemy.status.burnInstances.reduce((sum, it) => sum + Math.max(0, it.dmg || 0), 0);
  }
  if ((enemy.status.burnTurns || 0) > 0 && (enemy.status.burnStacks || 0) > 0) {
    return Math.max(0, (enemy.status.burnStacks || 0) * (enemy.status.burnDmgPerStack || 0));
  }
  return 0;
}

function equipmentPassiveValue(multiplier = 1) {
  return EQUIP_B_VALUE * multiplier;
}

function equipLog(text, kind = "good") {
  if (typeof logEvt === "function") logEvt(kind, "장비: " + text);
}

function applyEquipmentBattleStartPassives(player) {
  if (!player) return;
  restoreEquipmentBaseStats(player);
  player.equipBaseStats = {
    maxHp: player.maxHp,
    baseMatchDamage: player.baseMatchDamage,
    damageReduction: player.damageReduction || 0,
    critDamageMult: player.critDamageMult || 1.0,
    burnDmgPerStack: player.traits && player.traits.burn ? player.traits.burn.dmgPerStack : 0,
  };
  ensureEquipmentChapterState(state.chapter || META.selectedChapter || 1);
  const chapterState = ensureEquipmentChapterState(state.chapter || META.selectedChapter || 1);
  const battle = ensureEquipmentBattleState();
  battle.turn = 0;
  battle.nextTurnDoubleRunes = 0;
  battle.nextTurnRainbow = 0;
  battle.tempAtkPct = 0;
  battle.tempAtkTurns = 0;
  battle.tempDmgAmpPct = 0;
  battle.tempDmgAmpTurns = 0;
  battle.tempCritDmgPct = 0;
  battle.tempCritDmgTurns = 0;
  battle.tempCritChancePct = 0;
  battle.tempCritChanceTurns = 0;
  battle.startDmgAmpPct = 0;
  battle.startDmgAmpTurns = 0;
  battle.startCritDmgPct = 0;
  battle.startCritDmgTurns = 0;
  battle.spinHpCostPct = 0;
  battle.spinAtkPct = 0;
  battle.spinCritDmgPct = 0;
  battle.critTriggeredThisTurn = false;

  let atkPct = chapterState.atkPct || 0;
  let hpPct = chapterState.maxHpPct || 0;
  let healPct = 0;
  let critDmgPct = 0;
  let dmgReducePct = 0;
  let dmgAmpPct = 0;
  let burnPct = 0;
  let spinFailReduce = 0;
  let burnSelfReduce = 0;
  let bleedSelfReduce = 0;

  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    const atkBase = equipmentPassiveValue(isStar ? 1.5 : 1);
    const hpBase = equipmentPassiveValue(isStar ? 1.5 : 1);
    const burnBase = equipmentPassiveValue(isStar ? 1.5 : 1);
    const reduceBase = equipmentPassiveValue(isStar ? 1.5 : 1);

    if (eq.axis === 1) {
      if (eq.equipmentType <= 3) {
        if (g >= 1) atkPct += atkBase;
        if (g >= 2) healPct += atkBase;
        if (g >= 7) atkPct += equipmentPassiveValue(isStar ? 3 : 2);
      } else {
        if (g >= 1) hpPct += hpBase;
        if (g >= 2) dmgReducePct += reduceBase;
        if (g >= 7) dmgReducePct += equipmentPassiveValue(isStar ? 3 : 2);
      }
    }

    if (eq.axis === 2) {
      if (eq.equipmentType <= 3) {
        if (g >= 1) atkPct += atkBase;
        if (g >= 2) critDmgPct += atkBase;
        if (g >= 7) critDmgPct += equipmentPassiveValue(isStar ? 3 : 2);
      } else {
        if (g >= 1) hpPct += hpBase;
        if (g >= 2) dmgAmpPct += reduceBase;
        if (g >= 7) dmgAmpPct += equipmentPassiveValue(isStar ? 3 : 2);
      }
    }

    if (eq.axis === 3) {
      if (eq.equipmentType <= 3) {
        if (g >= 1) atkPct += equipmentPassiveValue(1);
        if (g >= 2) burnPct += burnBase;
        if (g >= 7) burnPct += equipmentPassiveValue(isStar ? 3 : 2);
      } else {
        if (g >= 1) hpPct += equipmentPassiveValue(isStar ? 1 : 1);
        if (g >= 2) spinFailReduce += isStar ? 0.15 : 0.10;
        if (g >= 7) spinFailReduce += isStar ? 0.35 : 0.25;
      }
    }

    if (eq.axis === 2 && eq.tier === 2 && eq.equipmentType === 6 && g >= 11) {
      atkPct += (player.skills ? player.skills.length : 0) * equipmentPassiveValue(1);
    }
    if (eq.axis === 3) {
      if (eq.equipmentType === 5 && g >= 3) burnSelfReduce += equipmentPassiveValue(isStar ? 2 : 1);
      if (eq.equipmentType === 6 && g >= 3) bleedSelfReduce += equipmentPassiveValue(isStar ? 2 : 1);
    }
  }

  const hpBefore = Math.max(0, Math.floor(player.hp || 0));
  player.maxHp = Math.max(1, Math.floor(player.maxHp * (1 + hpPct)));
  player.hp = Math.min(player.maxHp, hpBefore);
  player.baseMatchDamage = Math.max(1, Math.floor(player.baseMatchDamage * (1 + atkPct)));
  player.damageReduction = Math.min(0.9, (player.damageReduction || 0) + dmgReducePct);
  player.critDamageMult = (player.critDamageMult || 1.0) + critDmgPct;
  player.equipPassive = {
    healMult: 1 + healPct,
    dmgAmpPct,
    spinFailReduce,
    burnSelfReduce,
    bleedSelfReduce,
  };
  if (player.traits && player.traits.burn) {
    player.traits.burn.dmgPerStack = Math.max(1, Math.floor(player.traits.burn.dmgPerStack * (1 + burnPct)));
  }

  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.axis !== 1) continue;

    if (eq.equipmentType === 5) {
      if (!battle.protectShieldPerTurn) battle.protectShieldPerTurn = [];
      if (!isStar) {
        if (g >= 3) battle.protectShieldPerTurn.push({ threshold: 0.5, below: true, pct: equipmentPassiveValue(1) });
        if (g >= 4) battle.protectShieldPerTurn.push({ threshold: 0.5, below: false, pct: equipmentPassiveValue(1) });
      } else {
        if (g >= 3) battle.protectShieldPerTurn.push({ threshold: null, below: false, pct: equipmentPassiveValue(1) });
        if (g >= 4) battle.battleStartShieldPct = (battle.battleStartShieldPct || 0) + equipmentPassiveValue(1);
      }
      if (g >= 11 && isStar && eq.rootId === 25101) battle.winShieldToHealPct = (battle.winShieldToHealPct || 0) + equipmentPassiveValue(1);
    }

    if (eq.equipmentType === 6) {
      if (!battle.protectHealPerTurn) battle.protectHealPerTurn = [];
      if (!isStar) {
        if (g >= 3) battle.protectHealPerTurn.push({ threshold: 0.5, below: true, pct: equipmentPassiveValue(1) });
        if (g >= 4) battle.protectHealPerTurn.push({ threshold: 0.5, below: false, pct: equipmentPassiveValue(1) });
      } else {
        if (g >= 3) battle.protectHealPerTurn.push({ threshold: null, below: false, pct: equipmentPassiveValue(1) });
        if (g >= 4) battle.battleStartHealPct = (battle.battleStartHealPct || 0) + equipmentPassiveValue(1);
      }
      if (g >= 11 && isStar && eq.rootId === 26101) battle.winHealPct = (battle.winHealPct || 0) + equipmentPassiveValue(1);
    }

    if (eq.equipmentType === 4) {
      if (!battle.emergencySave) battle.emergencySave = {};
      if (!isStar) {
        if (g >= 3) battle.emergencySave.recoverLowOnce = equipmentPassiveValue(1);
        if (g >= 4) battle.emergencySave.invulOnLethal = true;
      } else {
        if (g >= 3) battle.emergencySave.fullHealLowOnce = true;
        if (g >= 4) battle.emergencySave.fullHealLethal = true;
        if (g >= 11) battle.emergencySave.reviveFullOnce = true;
      }
    }

    if (eq.equipmentType === 1) {
      if (!isStar) {
        if (g >= 4 && player.hp / player.maxHp >= 0.8) battle.nextTurnDoubleRunes += 2;
      } else {
        if (g >= 4 && player.hp / player.maxHp >= 0.5) battle.nextTurnDoubleRunes += 2;
      }
    }
  }

  if (battle.battleStartShieldPct > 0) {
    player.shield = (player.shield || 0) + Math.max(1, Math.floor(player.maxHp * battle.battleStartShieldPct));
  }
  if (battle.battleStartHealPct > 0) {
    applyPlayerHeal(player, Math.max(1, Math.floor(player.maxHp * battle.battleStartHealPct)));
  }
}

function applyEquipmentTurnStartPassives(player, enemy) {
  if (!player) return;
  const battle = ensureEquipmentBattleState();
  battle.turn += 1;
  battle.critTriggeredThisTurn = false;

  if (battle.protectShieldPerTurn) {
    for (const eff of battle.protectShieldPerTurn) {
      const ratio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
      const ok = eff.threshold == null ? true : (eff.below ? ratio < eff.threshold : ratio >= eff.threshold);
      if (!ok) continue;
      const gain = Math.max(1, Math.floor(player.maxHp * eff.pct));
      player.shield = (player.shield || 0) + gain;
      equipLog("보호막 +" + gain);
    }
  }

  if (battle.protectHealPerTurn) {
    for (const eff of battle.protectHealPerTurn) {
      const ratio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
      const ok = eff.threshold == null ? true : (eff.below ? ratio < eff.threshold : ratio >= eff.threshold);
      if (!ok) continue;
      const heal = Math.max(1, Math.floor(player.maxHp * eff.pct));
      const res = applyPlayerHeal(player, heal);
      if (res.healed > 0) equipLog("회복 +" + res.healed);
    }
  }

  const entries = equippedEquipmentEntries();
  for (const eq of entries) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.axis !== 3) continue;

    if (eq.equipmentType === 1 && enemy && enemy.hp > 0 && g >= 4) {
      const burnPreview = equipEnemyBurnPreview(enemy);
      if (burnPreview > 0) {
        const ratio = isStar ? 0.80 : 0.50;
        const dmg = Math.max(1, Math.floor(burnPreview * ratio));
        const res = applyEnemyDamage(enemy, dmg, { fire: dmg, light: 0, nature: 0, water: 0 }, { bypassShield: true });
        if (res.dealt > 0) equipLog("화상 폭발 " + res.dealt);
      }
    }

    if (eq.equipmentType === 4) {
      const interval = isStar ? 2 : 4;
      if (g >= 3 && battle.turn % interval === 0) {
        const removed = cleanseOneDebuff(player);
        if (removed) {
          equipLog("정화: " + removed);
          if (g >= 4) {
            const healPct = equipmentPassiveValue(isStar ? 2 : 1);
            const res = applyPlayerHeal(player, Math.max(1, Math.floor(player.maxHp * healPct)));
            if (res.healed > 0) equipLog("정화 회복 +" + res.healed);
          }
        }
      }
      if (isStar && g >= 11 && player.maxHp > 0 && player.hp / player.maxHp < 0.3) {
        player.lowHpImmunity = true;
        equipLog("저체력 상태이상 면역");
      }
    }
  }
}

function applyEquipmentAfterHeal(player, amount, result) {
  if (!player || !result || (result.healed || 0) + (result.shield || 0) <= 0) return;
  const battle = ensureEquipmentBattleState();
  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.equipmentType !== 3 || eq.axis !== 1) continue;
    if (g >= 3) {
      battle.tempAtkPct = Math.max(battle.tempAtkPct || 0, equipmentPassiveValue(isStar ? 2 : 1));
      battle.tempAtkTurns = Math.max(battle.tempAtkTurns || 0, 1);
      equipLog("회복 반응: 공격력 증가");
    }
    if (g >= 4) {
      battle.tempDmgAmpPct = Math.max(battle.tempDmgAmpPct || 0, equipmentPassiveValue(isStar ? 2 : 1));
      battle.tempDmgAmpTurns = Math.max(battle.tempDmgAmpTurns || 0, 1);
      equipLog("회복 반응: 피해 증폭");
    }
  }
}

function applyEquipmentOnCrit(player) {
  if (!player) return;
  const battle = ensureEquipmentBattleState();
  battle.critTriggeredThisTurn = true;
  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.equipmentType !== 2 || eq.axis !== 2) continue;
    if (g >= 3) {
      battle.tempAtkPct = Math.max(battle.tempAtkPct || 0, equipmentPassiveValue(isStar ? 2 : 1));
      battle.tempAtkTurns = Math.max(battle.tempAtkTurns || 0, 5);
      equipLog("치명타 반응: 공격력 증가");
    }
    if (g >= 4) {
      battle.nextTurnDoubleRunes += isStar ? 4 : 2;
      equipLog("치명타 반응: 다음 턴 x2 룬");
    }
    if (isStar && g >= 11) {
      battle.nextTurnRainbow += 1;
      equipLog("치명타 반응: 다음 턴 무지개 심볼");
    }
  }
}

function applyEquipmentOnPlayerDamaged(player, enemy, damage) {
  if (!player || !enemy || damage <= 0) return;
  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.axis !== 3) continue;
    if (eq.equipmentType === 5 && g >= 4) {
      const chance = equipmentPassiveValue(isStar ? 2 : 1);
      if (Math.random() < chance) {
        applyHypotherm(enemy, player, 3);
        equipLog("피격 반응: 저체온 부여");
      }
    }
    if (eq.equipmentType === 6 && g >= 4) {
      const chance = equipmentPassiveValue(isStar ? 2 : 1);
      if (Math.random() < chance) {
        applyDizzy(enemy, player);
        equipLog("피격 반응: 어지러움 부여");
      }
    }
  }
}

function tryEquipmentEmergencySave(player) {
  if (!player || player.hp > 0) return false;
  const chapterState = ensureEquipmentChapterState(state.chapter || META.selectedChapter || 1);
  const battle = ensureEquipmentBattleState();
  const used = chapterState.used;
  const save = battle.emergencySave || {};

  if (save.reviveFullOnce && !used.reviveFullOnce) {
    used.reviveFullOnce = true;
    player.hp = player.maxHp;
    equipLog("부활");
    return true;
  }
  if (save.fullHealLethal && !used.fullHealLethal) {
    used.fullHealLethal = true;
    player.hp = player.maxHp;
    if (player.status) player.status.invulTurns = Math.max(player.status.invulTurns || 0, 2);
    equipLog("치명상 방지 + 무적");
    return true;
  }
  if (save.invulOnLethal && !used.invulOnLethal) {
    used.invulOnLethal = true;
    player.hp = 1;
    if (player.status) player.status.invulTurns = Math.max(player.status.invulTurns || 0, 2);
    equipLog("치명상 방지");
    return true;
  }
  return false;
}

function applyEquipmentLowHpRecovery(player) {
  if (!player) return;
  const chapterState = ensureEquipmentChapterState(state.chapter || META.selectedChapter || 1);
  const battle = ensureEquipmentBattleState();
  const save = battle.emergencySave || {};
  const used = chapterState.used;
  if (player.maxHp <= 0 || player.hp / player.maxHp >= 0.1) return;

  if (save.fullHealLowOnce && !used.fullHealLowOnce) {
    used.fullHealLowOnce = true;
    player.hp = player.maxHp;
    equipLog("긴급 전회복");
    return;
  }
  if (save.recoverLowOnce && !used.recoverLowOnce) {
    used.recoverLowOnce = true;
    const heal = Math.max(1, Math.floor(player.maxHp * save.recoverLowOnce));
    const res = applyPlayerHeal(player, heal);
    if (res.healed > 0) equipLog("긴급 회복 +" + res.healed);
  }
}

function applyEquipmentSpinStart(player) {
  if (!player) return;
  const battle = ensureEquipmentBattleState();
  battle.spinHpCostPct = 0;
  battle.spinAtkPct = 0;
  battle.spinCritDmgPct = 0;

  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.axis !== 2 || eq.equipmentType !== 1 || g < 4) continue;
    battle.spinHpCostPct += isStar ? 0.015 : 0.03;
    battle.spinAtkPct += isStar ? equipmentPassiveValue(3.5) : equipmentPassiveValue(3);
    battle.spinCritDmgPct += isStar ? equipmentPassiveValue(3.5) : equipmentPassiveValue(3);
  }

  if (battle.spinHpCostPct > 0) {
    const hpCost = Math.max(1, Math.floor(player.maxHp * battle.spinHpCostPct));
    player.hp = Math.max(1, player.hp - hpCost);
    equipLog("스핀 대가 -" + hpCost, "bad");
  }
}

function buildEquipmentSpinModifiers(player, enemy, ctx) {
  const battle = ensureEquipmentBattleState();
  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  const activeElements = (ctx.activeElements || []).length;
  let outMult = 1 + ((player.equipPassive && player.equipPassive.dmgAmpPct) || 0);
  let critChanceBonus = 0;
  let critDamageBonus = 0;
  let guaranteedCrit = false;

  if (battle.tempAtkTurns > 0) outMult *= 1 + (battle.tempAtkPct || 0);
  if (battle.tempDmgAmpTurns > 0) outMult *= 1 + (battle.tempDmgAmpPct || 0);
  if (battle.tempCritChanceTurns > 0) critChanceBonus += battle.tempCritChancePct || 0;
  if (battle.tempCritDmgTurns > 0) critDamageBonus += battle.tempCritDmgPct || 0;
  if (battle.startDmgAmpTurns > 0) outMult *= 1 + (battle.startDmgAmpPct || 0);
  if (battle.startCritDmgTurns > 0) critDamageBonus += battle.startCritDmgPct || 0;
  if (battle.spinAtkPct > 0) outMult *= 1 + battle.spinAtkPct;
  if (battle.spinCritDmgPct > 0) critDamageBonus += battle.spinCritDmgPct;

  const lostHpRatio = player.maxHp > 0 ? Math.max(0, 1 - hpRatio) : 0;
  const lostHp10 = Math.floor(lostHpRatio / 0.10);
  const lostHp5 = Math.floor(lostHpRatio / 0.05);
  const comboCount = ctx.comboCount || 0;
  const statusTypeCount = equipEnemyStatusTypeCount(enemy);
  const hypothermCount = enemy?.status?.hypothermInstances ? enemy.status.hypothermInstances.length : 0;

  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;

    if (eq.axis === 1 && eq.equipmentType === 2) {
      if (g >= 3 && player.shield > 0) critChanceBonus += equipmentPassiveValue(isStar ? 2 : 1);
      if (g >= 4 && player.shield > 0) critDamageBonus += equipmentPassiveValue(isStar ? 2 : 1);
    }

    if (eq.axis === 2) {
      if (eq.equipmentType === 1) {
        if ((!isStar && g >= 3 && comboCount >= 15) || (isStar && g >= 3 && comboCount >= 7)) guaranteedCrit = true;
        if (isStar && g >= 11) {
          if (activeElements === 1) outMult *= 1 + equipmentPassiveValue(5);
          else if (activeElements >= 2) critDamageBonus += equipmentPassiveValue(5);
        }
      }
      if (eq.equipmentType === 3) {
        if ((!isStar && g >= 3 && comboCount >= 15) || (isStar && g >= 3 && comboCount >= 10)) {
          outMult *= 1 + equipmentPassiveValue(isStar ? 2 : 1);
        }
      }
      if (eq.equipmentType === 4) {
        if ((!isStar && g >= 3) || (isStar && g >= 3)) {
          outMult *= 1 + (isStar ? lostHp5 : lostHp10) * equipmentPassiveValue(1);
        }
        if ((!isStar && g >= 4) || (isStar && g >= 4)) {
          critChanceBonus += (isStar ? lostHp5 : lostHp10) * equipmentPassiveValue(1);
        }
        if (isStar && g >= 11 && hpRatio <= 0.3) {
          battle.nextTurnDoubleRunes = Math.max(battle.nextTurnDoubleRunes || 0, ROWS * COLS);
        }
      }
      if (eq.equipmentType === 5) {
        if ((!isStar && g >= 3 && hpRatio < 0.3) || (isStar && g >= 3 && hpRatio < 0.65)) {
          outMult *= 1 + equipmentPassiveValue(1);
        }
      }
      if (eq.equipmentType === 6) {
        if ((!isStar && g >= 3 && hpRatio < 0.3) || (isStar && g >= 3 && hpRatio < 0.65)) {
          critDamageBonus += equipmentPassiveValue(1);
        }
      }
    }

    if (eq.axis === 3) {
      if (eq.equipmentType === 2 && g >= 4 && hypothermCount > 0) {
        outMult *= 1 + hypothermCount * equipmentPassiveValue(isStar ? 2 : 1);
      }
      if (eq.equipmentType === 3) {
        if (g >= 3 && statusTypeCount > 0) outMult *= 1 + statusTypeCount * equipmentPassiveValue(isStar ? 2 : 1);
      }
    }
  }

  return { outMult, critChanceBonus, critDamageBonus, guaranteedCrit };
}

function applyEquipmentPostDamageEffects(player, enemy, ctx) {
  if (!player || !enemy || enemy.hp <= 0) return;
  const dealt = ctx.dealt || 0;
  const comboCount = ctx.comboCount || 0;
  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    const isStar = eq.tier === 2;
    if (eq.axis !== 2 || eq.equipmentType !== 3 || g < 4) continue;
    const req = isStar ? 7 : 15;
    if (comboCount < req || dealt <= 0) continue;
    const ratio = isStar && g >= 11 ? equipmentPassiveValue(2) : equipmentPassiveValue(1);
    const dmg = Math.max(1, Math.floor(dealt * ratio));
    const res = applyEnemyDamage(enemy, dmg, { fire: dmg, light: 0, nature: 0, water: 0 }, { bypassShield: true });
    if (res.dealt > 0) equipLog("운석 " + res.dealt);
  }
}

function applyEquipmentOnWin(player) {
  if (!player) return;
  const chapterState = ensureEquipmentChapterState(state.chapter || META.selectedChapter || 1);
  const battle = ensureEquipmentBattleState();
  if (battle.winShieldToHealPct > 0 && player.shield > 0) {
    const heal = Math.max(1, Math.floor(player.shield * battle.winShieldToHealPct));
    const res = applyPlayerHeal(player, heal);
    if (res.healed > 0) equipLog("승리 회복 +" + res.healed);
  }
  if (battle.winHealPct > 0) {
    const heal = Math.max(1, Math.floor(player.maxHp * battle.winHealPct));
    const res = applyPlayerHeal(player, heal);
    if (res.healed > 0) equipLog("승리 회복 +" + res.healed);
  }

  for (const eq of equippedEquipmentEntries()) {
    const g = eq.grade;
    if (eq.tier !== 2 || g < 11) continue;
    if (eq.rootId === 22101 && player.shield > 0) { chapterState.maxHpPct += equipmentPassiveValue(1); equipLog("챕터 누적 최대 체력 증가"); }
    if (eq.rootId === 23101 && player.maxHp > 0 && player.hp / player.maxHp >= 0.7) { chapterState.maxHpPct += equipmentPassiveValue(1); equipLog("챕터 누적 최대 체력 증가"); }
    if (eq.rootId === 25201) { chapterState.atkPct += equipmentPassiveValue(1); equipLog("챕터 누적 공격력 증가"); }
  }
}

function tickEquipmentTurnEnd() {
  const battle = ensureEquipmentBattleState();
  const keys = [
    ["tempAtkTurns", "tempAtkPct"],
    ["tempDmgAmpTurns", "tempDmgAmpPct"],
    ["tempCritDmgTurns", "tempCritDmgPct"],
    ["tempCritChanceTurns", "tempCritChancePct"],
    ["startDmgAmpTurns", "startDmgAmpPct"],
    ["startCritDmgTurns", "startCritDmgPct"],
  ];
  for (const [turnKey, pctKey] of keys) {
    if ((battle[turnKey] || 0) > 0) {
      battle[turnKey] -= 1;
      if (battle[turnKey] <= 0) battle[pctKey] = 0;
    }
  }
}

