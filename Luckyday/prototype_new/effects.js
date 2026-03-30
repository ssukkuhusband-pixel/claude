// ?먥븧??effects.js ??Match processing, Status effects, VFX, Events ?먥븧??

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nextFrame() {
  return new Promise((r) => {
    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; r(); } };
    window.requestAnimationFrame(done);
    setTimeout(done, 32); // fallback if rAF doesn't fire (headless/hidden tab)
  });
}

function mergeByElement(a, b) {
  return {
    fire: (a.fire || 0) + (b.fire || 0),
    light: (a.light || 0) + (b.light || 0),
    nature: (a.nature || 0) + (b.nature || 0),
    water: (a.water || 0) + (b.water || 0),
  };
}

function appendTag(tag, prev) {
  if (!prev) return tag;
  if (prev.includes(tag)) return prev;
  return `${prev}*${tag}`;
}

function formatTags(tag) {
  if (!tag) return "";
  return tag
    .split("*")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(", ");
}

function talismanClassForLineEffect(effectId) {
  if (effectId === "burn") return "talisman--fire";
  if (effectId === "strike") return "talisman--light";
  if (effectId === "heal") return "talisman--nature";
  if (effectId === "freeze") return "talisman--water";
  if (effectId === "dmgBoost") return "talisman--light";
  if (effectId === "cleanse") return "talisman--cleanse";
  if (effectId === "forge") return "talisman--forge";
  if (effectId === "guard") return "talisman--forge";
  return null;
}

function tagForLineEffect(effectId) {
  if (effectId === "burn") return "화상";
  if (effectId === "strike") return "낙뢰";
  if (effectId === "heal") return "회복";
  if (effectId === "freeze") return "빙결";
  if (effectId === "dmgBoost") return "강화";
  if (effectId === "cleanse") return "정화";
  if (effectId === "forge") return "단련";
  if (effectId === "guard") return "보호";
  return "부적";
}

function applyTileTalismanMultiplier(matches, tileTalismans, tileMult) {
  if (!tileTalismans || tileTalismans.size === 0) return matches;
  const mult = tileMult || 2;
  if (mult <= 1) return matches;
  const MAX_REPEAT = 64;
  const out = [];
  for (const m of matches) {
    out.push(m);
    let hitCount = 0;
    for (const [r, c] of m.cells) {
      if (tileTalismans.has(`${r},${c}`)) {
        hitCount += 1;
      }
    }
    if (hitCount <= 0) continue;

    const repeat = Math.min(MAX_REPEAT, Math.pow(mult, hitCount));
    const tag = t("tag.tileTalisman", { value: repeat });
    for (let i = 0; i < repeat - 1; i++) {
      out.push({ ...m, tag: appendTag(tag, m.tag) });
    }
  }
  return out;
}

function applyRepeatSourcesAdditive(matches, player) {
  if (!matches || matches.length === 0) return matches;

  const MAX_REPEAT = 64;
  const grouped = new Map();

  const keyOf = (m) => {
    const cells = m.cells.map(([r, c]) => `${r},${c}`).join(";");
    return `${m.symbolId}|${m.dir}|${m.len}|${cells}`;
  };

  for (const m of matches) {
    const k = keyOf(m);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(m);
  }

  const collectTags = (group) => {
    let tag = "";
    for (const m of group) {
      if (!m.tag) continue;
      const parts = String(m.tag).split("*").map((t) => t.trim()).filter(Boolean);
      for (const p of parts) tag = appendTag(p, tag);
    }
    return tag;
  };

  const out = [];
  for (const group of grouped.values()) {
    const base = group[0];

    // Line repeats already expanded by hooks (row/col talismans etc).
    // Treat group.length as the line repeat count including the base.
    let lineCount = Math.max(1, group.length);
    if (player) {
      if (base.dir === "H") {
        const r = base.cells[0][0];
        const rowBonus =
          (player.rowTalismanBonus && player.rowTalismanBonus.get(r)) ||
          ((player.rowTalismans && player.rowTalismans.has(r)) ? 1 : 0);
        if (rowBonus > 0) {
          lineCount += rowBonus;
          if (player.checkTalismanExtra > 0) lineCount += player.checkTalismanExtra;
        }
        // Pet extraRowCheck: all horizontal matches get +1 check
        if (state.petExtraRowCheckTurns > 0) lineCount += 1;
        // Pet talisman (row): add +N bonus for matching row
        if (state.petTalismans) {
          for (const pt of state.petTalismans) {
            if (pt.orientation === "row" && pt.idx === r && pt.turnsLeft > 0) lineCount += pt.bonus;
          }
        }
      } else if (base.dir === "V") {
        const c = base.cells[0][1];
        const colBonus =
          (player.colTalismanBonus && player.colTalismanBonus.get(c)) ||
          ((player.colTalismans && player.colTalismans.has(c)) ? 1 : 0);
        if (colBonus > 0) {
          lineCount += colBonus;
          if (player.checkTalismanExtra > 0) lineCount += player.checkTalismanExtra;
        }
        // Pet talisman (col): add +N bonus for matching column
        if (state.petTalismans) {
          for (const pt of state.petTalismans) {
            if (pt.orientation === "col" && pt.idx === c && pt.turnsLeft > 0) lineCount += pt.bonus;
          }
        }
      }
      if (
        player.luckDoubleCheck &&
        state &&
        state.luckyHoldActive &&
        state.luckyHoldActive.patternKeys &&
        state.luckyHoldActive.patternKeys.has(keyOf(base))
      ) {
        lineCount += 1;
      }

      if (player.commonDoubleRune && state && state.grid) {
        const runeCount = countAnyVariantsInMatch(state.grid, base, DOUBLE_RUNE_VARIANTS);
        if (runeCount > 0) {
          lineCount += runeCount;
        }
      }
    }

    let tileContribution = 0;
    let tileRepeat = 1;
    if (player && player.tileTalismans && player.tileTalismans.size > 0) {
      const hitCount = countTileTalismansInMatch(base, player.tileTalismans);
      if (hitCount > 0) {
        const mult = player.tileTalismanMult || 2;
        // Additive repeats: each tile contributes (mult-1) extra repeats.
        // This avoids runaway multiplicative scaling, while still rewarding setups.
        const extra = Math.max(0, (mult - 1) * hitCount);
        tileRepeat = Math.min(MAX_REPEAT, 1 + extra);
        tileContribution = extra;
      }
    }

    let total = Math.min(MAX_REPEAT, lineCount + tileContribution);
    if (total <= 0) total = 1;

    let tag = collectTags(group);
    if (player && player.commonDoubleRune && state && state.grid) {
      const runeCount = countAnyVariantsInMatch(state.grid, base, DOUBLE_RUNE_VARIANTS);
      if (runeCount > 0) tag = appendTag(t("tag.doubleRune", { count: runeCount }), tag);
    }
    if (tileContribution > 0) tag = appendTag(t("tag.tileTalisman", { value: tileRepeat }), tag);

    for (let i = 0; i < total; i++) {
      out.push({ ...base, tag });
    }
  }

  return out;
}

function applyLineEffectTalismans(player, match, extraByElement) {
  if (!player) return;
  if (player.status && player.status.talismanSealTurns > 0) return;
  const enemy = state.enemy;
  if (!enemy) return;

  let effectId = null;
  if (match.dir === "H" && player.lineEffectRow) {
    const r = match.cells[0][0];
    effectId = player.lineEffectRow.get(r) || null;
  } else if (match.dir === "V" && player.lineEffectCol) {
    const c = match.cells[0][1];
    effectId = player.lineEffectCol.get(c) || null;
  }

  if (!effectId) return;

  const cfg = player.lineEffectCfg || {
    burn: { duration: 5, stacks: 1 },
    freeze: { chance: 0.3, turns: 1 },
    strike: { damage: 10 },
    heal: { pct: 0.05 },
  };

  if (effectId === "burn" && enemy.status) {
    applyBurn(enemy, player, cfg.burn.stacks, cfg.burn.duration);
    logEvt("good", t("log.talismanBurn", { stacks: cfg.burn.stacks, turns: cfg.burn.duration }));
  }

  if (effectId === "freeze" && enemy.status) {
    if (Math.random() < cfg.freeze.chance) {
      addEnemyFreezeTurns(enemy, cfg.freeze.turns);
      logEvt("good", t("log.talismanFreeze", { turns: cfg.freeze.turns, total: enemy.status.frozenTurns }));
      if (enemy.shield && enemy.shield > 0) {
        enemy.shield = 0;
        logEvt("good", t("log.talismanFreezeBreak"));
      }
    }
  }

  if (effectId === "strike") {
    const add = cfg.strike.damage;
    extraByElement.light += add;
    logEvt("good", t("log.talismanStrike", { value: add }));
    tryStunFromLightning(player, enemy, t("tag.talismanStrike"));
    drawEnemyLightningBolt();
    flashEl(ui.enemyHpBar);
  }

  if (effectId === "cleanse") {
    const cleared = cleanseOneDebuff(state.player);
    if (cleared) logEvt("good", t("log.talismanCleanse", { status: cleared }));
  }

  if (effectId === "forge") {
    logEvt("good", t("log.talismanForge"));
  }

  if (effectId === "guard") {
    const addShield = Math.max(1, Math.floor(state.player.maxHp * 0.05));
    state.player.shield = (state.player.shield || 0) + addShield;
    logEvt("good", t("log.talismanGuard", { value: addShield }));
  }

    if (effectId === "heal" && state.player && state.player.hp > 0) {
      const healMult = state.player.healTalismanMult || 1.0;
      const heal = Math.max(1, Math.floor(state.player.maxHp * cfg.heal.pct * healMult));
      const res = applyPlayerHeal(state.player, heal);
      if (res.healed > 0) logEvt("good", t("log.talismanHeal", { value: res.healed }));
      if (res.shield > 0) logEvt("note", t("log.frugalHeal", { value: res.shield }));
    }

    // v2: 媛뺥솕遺??(dmgBoost) ???대떦 ?쇱씤 泥댄겕 ???곕?吏 諛곗쑉 ?곸슜
    if (effectId === "dmgBoost" && extraByElement) {
      const dmgMult = state.player.dmgTalismanMult || 1.5;
      const bonus = Math.max(1, Math.floor(
        (extraByElement[match.symbolId] || 0) > 0
          ? 0 // ?대? extraByElement媛 ?덉쑝硫??꾩옱 match 湲곗??쇰줈 怨꾩궛
          : 0
      ));
      // ??泥댄겕??湲곕낯 ?곕?吏??諛곗쑉 ?곸슜 (extraByElement??異붽?)
      const base = state.player.baseMatchDamage + (state.player.tempMatchDamage || 0);
      const sym = SYMBOL_BY_ID[match.symbolId];
      if (sym) {
        const elemMult = sym.mult + (state.player.elemBonus[match.symbolId] || 0);
        const baseLenMult = LENGTH_MULT[match.len] || 1.0;
        const baseDmg = Math.max(0, Math.floor(base * elemMult * baseLenMult));
        const dmgBonus = Math.max(1, Math.floor(baseDmg * (dmgMult - 1)));
        extraByElement[match.symbolId] += dmgBonus;
        logEvt("good", `?뷂툘 媛뺥솕遺?? ${match.symbolId} +${dmgBonus} (x${dmgMult})`);
      }
    }
}

function hasVariantInMatch(grid, match, variantId) {
  for (const [r, c] of match.cells) {
    if (grid[r][c] === variantId) return true;
  }
  return false;
}

function countVariantInMatch(grid, match, variantId) {
  let n = 0;
  for (const [r, c] of match.cells) {
    if (grid[r][c] === variantId) n += 1;
  }
  return n;
}

function countAnyVariantsInMatch(grid, match, variantIds) {
  if (!variantIds || !variantIds.length) return 0;
  const set = new Set(variantIds);
  let n = 0;
  for (const [r, c] of match.cells) {
    if (set.has(grid[r][c])) n += 1;
  }
  return n;
}

function countTileTalismansInMatch(match, tileTalismans) {
  if (!tileTalismans || tileTalismans.size === 0) return 0;
  let n = 0;
  for (const [r, c] of match.cells) {
    if (tileTalismans.has(`${r},${c}`)) n += 1;
  }
  return n;
}

function matchHasHybridWithElement(grid, match, elementId) {
  for (const [r, c] of match.cells) {
    const sym = grid[r][c];
    const h = HYBRID_BY_ID[sym];
    if (!h) continue;
    if (h.a === elementId || h.b === elementId) return true;
  }
  return false;
}

function isLineTalismanMatch(player, match) {
  if (!player) return false;
  if (player.status && player.status.talismanSealTurns > 0) return false;
  if (match.dir === "H") {
    const r = match.cells[0][0];
    return (
      player.rowTalismans.has(r) ||
      (player.sortRowTalismans && player.sortRowTalismans.has(r)) ||
      (player.lineEffectRow && player.lineEffectRow.has(r))
    );
  }
  if (match.dir === "V") {
    const c = match.cells[0][1];
    return player.colTalismans.has(c) || (player.lineEffectCol && player.lineEffectCol.has(c));
  }
  return false;
}

function applyBurn(enemy, player, stacks, durationOverride) {
  // NOTE: burn/bleed stacks track their own remaining turns.
  // status.{burnTurns,burnStacks} remain as UI-friendly summaries.
  if (!enemy.status) return;
  if (enemy.immuneBurn) return;
  if ((enemy.resistBurnChance || 0) > 0 && Math.random() < enemy.resistBurnChance) return;
  if (!stacks) return;
  const t = player.traits && player.traits.burn ? player.traits.burn : { duration: 5, dmgPerStack: 6 };
  let duration = durationOverride ? durationOverride : t.duration;
  // v2 dominator: ?곹깭?댁긽 吏??+N
  if (player && player.comboEnhance && player.comboEnhance.dominatorTurns > 0) {
    duration += (player.comboEnhance.dominatorStatusBonus || 1);
  }
  enemy.status.burnDmgPerStack = t.dmgPerStack;
  dotAddStacks(enemy.status, "burn", duration, stacks);
}

function dotKey(kind) {
  return kind === "burn" ? "burnByTurns" : "bleedByTurns";
}

function dotEnsure(status, kind) {
  const key = dotKey(kind);
  let by = status[key];
  if (!by || typeof by !== "object" || Array.isArray(by)) {
    by = {};
    const turns = Math.max(0, Math.floor(status[`${kind}Turns`] || 0));
    const stacks = Math.max(0, Math.floor(status[`${kind}Stacks`] || 0));
    if (turns > 0 && stacks > 0) by[String(turns)] = stacks;
    status[key] = by;
  }
  return by;
}

function dotSync(status, kind) {
  const key = dotKey(kind);
  const by = dotEnsure(status, kind);
  let maxTurns = 0;
  let totalStacks = 0;
  for (const [k, v] of Object.entries(by)) {
    const turns = Math.max(0, Math.floor(Number(k)));
    const stacks = Math.max(0, Math.floor(Number(v)));
    if (turns <= 0 || stacks <= 0) continue;
    totalStacks += stacks;
    if (turns > maxTurns) maxTurns = turns;
  }
  if (maxTurns <= 0 || totalStacks <= 0) {
    status[`${kind}Turns`] = 0;
    status[`${kind}Stacks`] = 0;
    status[key] = {};
    return;
  }
  status[`${kind}Turns`] = maxTurns;
  status[`${kind}Stacks`] = totalStacks;
}

function dotAddStacks(status, kind, turns, stacks) {
  if (!status) return;
  const t = Math.max(1, Math.floor(turns || 0));
  const s = Math.max(1, Math.floor(stacks || 0));
  const by = dotEnsure(status, kind);
  const key = String(t);
  by[key] = (by[key] || 0) + s;
  dotSync(status, kind);
}

function dotTick(status, kind) {
  if (!status) return;
  const key = dotKey(kind);
  const by = dotEnsure(status, kind);
  const next = {};
  for (const [k, v] of Object.entries(by)) {
    const turns = Math.max(0, Math.floor(Number(k)));
    const stacks = Math.max(0, Math.floor(Number(v)));
    if (turns <= 0 || stacks <= 0) continue;
    const nt = turns - 1;
    if (nt > 0) next[String(nt)] = (next[String(nt)] || 0) + stacks;
  }
  status[key] = next;
  dotSync(status, kind);
}

function dotReduceTurns(status, kind, decTurns) {
  if (!status) return;
  const dec = Math.max(1, Math.floor(decTurns || 1));
  const key = dotKey(kind);
  const by = dotEnsure(status, kind);
  const next = {};
  for (const [k, v] of Object.entries(by)) {
    const turns = Math.max(0, Math.floor(Number(k)));
    const stacks = Math.max(0, Math.floor(Number(v)));
    if (turns <= 0 || stacks <= 0) continue;
    const nt = turns - dec;
    if (nt > 0) next[String(nt)] = (next[String(nt)] || 0) + stacks;
  }
  status[key] = next;
  dotSync(status, kind);
}

function resonanceEnabledForElement(player, elementId) {
  if (!player) return false;
  if (elementId === "fire") return !!player.fireBuild.fireResonance;
  if (elementId === "light") return !!player.lightBuild.lightResonance;
  if (elementId === "nature") return !!player.natureBuild.natureResonance;
  if (elementId === "water") return !!player.waterBuild.waterResonance;
  return false;
}

function tickEnemyBurn(enemy) {
  if (!enemy.status) return 0;
  // v3: ?몄뒪?댁뒪 湲곕컲 ?붿긽???덉쑝硫??몄뒪?댁뒪 tick ?꾩엫
  if (enemy.status.burnInstances && enemy.status.burnInstances.length > 0) {
    return tickEnemyBurnInstances(enemy);
  }
  dotSync(enemy.status, "burn");
  if (enemy.status.burnTurns <= 0 || enemy.status.burnStacks <= 0) return 0;
  const dmgPerStack = enemy.status.burnDmgPerStack || 4;
  const dmg = Math.max(1, Math.floor(enemy.status.burnStacks * dmgPerStack * petDotDamageMult("burn")));
  dotTick(enemy.status, "burn");
  return dmg;
}

// ?먥븧??v3 ?붿긽 ?몄뒪?댁뒪 ?먥븧??
function applyBurnFromFire(enemy, fireDamage, player) {
  if (!enemy?.status || !fireDamage || fireDamage <= 0) return;
  const ratio = 0.10 + (player?.statusEnhance?.burnDmgBonus || 0);
  const baseTurns = 2 + (player?.statusEnhance?.burnExtraTurns || 0);
  const dominator = (player?.comboEnhance?.dominatorTurns > 0)
    ? (player.comboEnhance.dominatorStatusBonus || 1) : 0;
  const dmgPerTurn = Math.max(1, Math.floor(fireDamage * ratio));
  enemy.status.burnInstances.push({ dmg: dmgPerTurn, turns: baseTurns + dominator });
  syncBurnLegacy(enemy);
}

function tickEnemyBurnInstances(enemy) {
  if (!enemy?.status) return 0;
  const inst = enemy.status.burnInstances;
  if (!inst || inst.length === 0) return 0;
  let totalDmg = 0;
  for (const b of inst) totalDmg += b.dmg;
  for (let i = inst.length - 1; i >= 0; i--) {
    inst[i].turns -= 1;
    if (inst[i].turns <= 0) inst.splice(i, 1);
  }
  syncBurnLegacy(enemy);
  return Math.max(0, totalDmg);
}

function syncBurnLegacy(enemy) {
  if (!enemy?.status) return;
  const inst = enemy.status.burnInstances;
  if (!inst || inst.length === 0) {
    if (!enemy.status.burnByTurns || Object.keys(enemy.status.burnByTurns).length === 0) {
      enemy.status.burnStacks = 0;
      enemy.status.burnTurns = 0;
    }
    return;
  }
  enemy.status.burnStacks = inst.length;
  enemy.status.burnTurns = Math.max(...inst.map(b => b.turns));
}

function applyBleed(enemy, player, stacks, durationOverride) {
  if (!enemy.status) return;
  if (enemy.immuneBleed) return;
  if (!stacks) return;
  if (player && player.natureBuild && player.natureBuild.bleedDouble) {
    stacks *= 2;
    if (state && state.spinSeq !== state.bleedDoubleToastSeq) {
      state.bleedDoubleToastSeq = state.spinSeq;
      showFxToast({ title: t("fx.bleedDouble"), subtitle: t("fx.bleedDoubleSub"), symbolId: "nature" });
    }
  }
  const burnBase = player.traits && player.traits.burn ? player.traits.burn.dmgPerStack : 6;
  const ratio = player.traits && player.traits.bleed ? player.traits.bleed.ratio : 0.7;
  const dmgMult = player.traits && player.traits.bleed ? player.traits.bleed.dmgMult || 1.0 : 1.0;
  const duration = player.traits && player.traits.bleed ? player.traits.bleed.duration : 10;
  enemy.status.bleedDmgPerStack = Math.max(1, Math.floor(burnBase * ratio * dmgMult));
  dotAddStacks(enemy.status, "bleed", durationOverride ? durationOverride : duration, stacks);
}

function tickEnemyBleed(enemy) {
  if (!enemy.status) return 0;
  dotSync(enemy.status, "bleed");
  if (enemy.status.bleedTurns <= 0 || enemy.status.bleedStacks <= 0) return 0;
  const dmgPerStack = enemy.status.bleedDmgPerStack || 3;
  const dmg = Math.max(1, Math.floor(enemy.status.bleedStacks * dmgPerStack * petDotDamageMult("bleed")));
  dotTick(enemy.status, "bleed");
  return dmg;
}

function tickEnemyShock(enemy) {
  if (!enemy.status) return 0;
  if (enemy.status.shockTurns <= 0 || enemy.status.shockDmg <= 0) return 0;
  const dmg = Math.max(1, enemy.status.shockDmg);
  enemy.status.shockTurns -= 1;
  if (enemy.status.shockTurns <= 0) enemy.status.shockDmg = 0;
  return dmg;
}

// ?먥븧??v2 ?곹깭?댁긽 ?먥븧??

// ?? ?곌?? (thorn) ???먯뿰 ?꾩슜 (v3 ?몄뒪?댁뒪) ??
// ?몄뒪?댁뒪??諛쏅뒗 ?쇳빐 10% 利앷?
function applyThorn(enemy, player, turns) {
  if (!enemy || !enemy.status) return;
  if ((enemy.resistThornChance || 0) > 0 && Math.random() < enemy.resistThornChance) return;
  const base = Math.max(1, turns || 3);
  const extra = player && player.statusEnhance ? (player.statusEnhance.thornExtraTurns || 0) : 0;
  const dominator = (player && player.comboEnhance && player.comboEnhance.dominatorTurns > 0)
    ? (player.comboEnhance.dominatorStatusBonus || 1) : 0;
  enemy.status.thornInstances.push(base + extra + dominator);
  syncThornLegacy(enemy);
}

function thornDamageMult(enemy, player) {
  if (!enemy || !enemy.status) return 1.0;
  const count = enemy.status.thornInstances ? enemy.status.thornInstances.length : 0;
  if (count <= 0) {
    // ?덇굅???대갚
    if (enemy.status.thornStacks > 0) {
      const basePct = 0.10;
      const bonusPct = player && player.statusEnhance ? (player.statusEnhance.thornPctBonus || 0) : 0;
      return 1.0 + enemy.status.thornStacks * (basePct + bonusPct);
    }
    return 1.0;
  }
  const basePct = 0.10;
  const bonusPct = player && player.statusEnhance ? (player.statusEnhance.thornPctBonus || 0) : 0;
  return 1.0 + count * (basePct + bonusPct);
}

function tickEnemyThorn(enemy) {
  if (!enemy || !enemy.status) return;
  const arr = enemy.status.thornInstances;
  if (arr && arr.length > 0) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i] -= 1;
      if (arr[i] <= 0) arr.splice(i, 1);
    }
    syncThornLegacy(enemy);
    return;
  }
  // ?덇굅???대갚
  if (enemy.status.thornTurns <= 0) return;
  enemy.status.thornTurns -= 1;
  if (enemy.status.thornTurns <= 0) { enemy.status.thornStacks = 0; }
}

function syncThornLegacy(enemy) {
  if (!enemy?.status) return;
  const arr = enemy.status.thornInstances;
  if (!arr || arr.length === 0) {
    enemy.status.thornStacks = 0;
    enemy.status.thornTurns = 0;
    return;
  }
  enemy.status.thornStacks = arr.length;
  enemy.status.thornTurns = Math.max(...arr);
}

// ?? ?泥댁삩/鍮숆껐 (hypothermia ??freeze) ??臾??꾩슜 (v3 ?몄뒪?댁뒪) ??
// ?몄뒪?댁뒪 3媛?紐⑥씠硫?鍮숆껐 1??諛쒕룞
function applyHypotherm(enemy, player, turns) {
  if (!enemy || !enemy.status) return false;
  if ((enemy.resistHypothermChance || 0) > 0 && Math.random() < enemy.resistHypothermChance) return false;
  const base = Math.max(1, turns || 3);
  const dominator = (player && player.comboEnhance && player.comboEnhance.dominatorTurns > 0)
    ? (player.comboEnhance.dominatorStatusBonus || 1) : 0;
  enemy.status.hypothermInstances.push(base + dominator);
  syncHypothermLegacy(enemy);
  // threshold 泥댄겕 ??鍮숆껐 諛쒕룞
  const threshold = player && player.statusEnhance ? (player.statusEnhance.freezeThreshold || 3) : 3;
  if (enemy.status.hypothermInstances.length >= threshold) {
    enemy.status.hypothermInstances.splice(0, threshold); // ?ㅻ옒??N媛??뚮퉬
    const freezeExtra = player && player.statusEnhance ? (player.statusEnhance.freezeExtraTurns || 0) : 0;
    if (!enemy.immuneFreeze) {
      enemy.status.frozenTurns = (enemy.status.frozenTurns || 0) + 1 + freezeExtra + dominator;
    }
    syncHypothermLegacy(enemy);
    return !enemy.immuneFreeze; // 鍮숆껐 諛쒕룞
  }
  return false;
}

function tickEnemyHypotherm(enemy) {
  if (!enemy || !enemy.status) return;
  const arr = enemy.status.hypothermInstances;
  if (arr && arr.length > 0) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i] -= 1;
      if (arr[i] <= 0) arr.splice(i, 1);
    }
    syncHypothermLegacy(enemy);
    return;
  }
  // ?덇굅???대갚
  if (enemy.status.hypothermTurns <= 0) return;
  enemy.status.hypothermTurns -= 1;
  if (enemy.status.hypothermTurns <= 0) { enemy.status.hypothermStacks = 0; }
}

function syncHypothermLegacy(enemy) {
  if (!enemy?.status) return;
  const arr = enemy.status.hypothermInstances;
  if (!arr || arr.length === 0) {
    enemy.status.hypothermStacks = 0;
    enemy.status.hypothermTurns = 0;
    return;
  }
  enemy.status.hypothermStacks = arr.length;
  enemy.status.hypothermTurns = Math.max(...arr);
}

// ?? ?댁??ъ? (dizzy) ??踰덇컻 ?꾩슜 (v3 ?몄뒪?댁뒪) ??
// ?몄뒪?댁뒪??10% 鍮쀫굹媛??뺣쪧
function applyDizzy(enemy, player) {
  if (!enemy || !enemy.status) return;
  if ((enemy.resistDizzyChance || 0) > 0 && Math.random() < enemy.resistDizzyChance) return;
  const baseTurns = player && player.statusEnhance ? (player.statusEnhance.dizzyTurns || 2) : 2;
  const extra = player && player.statusEnhance ? (player.statusEnhance.dizzyExtraTurns || 0) : 0;
  const dominator = (player && player.comboEnhance && player.comboEnhance.dominatorTurns > 0)
    ? (player.comboEnhance.dominatorStatusBonus || 1) : 0;
  enemy.status.dizzyInstances.push(baseTurns + extra + dominator);
  enemy.status.dizzyAtkReduce = player && player.statusEnhance
    ? (player.statusEnhance.dizzyAtkReduce || enemy.status.dizzyAtkReduce || 0.10)
    : (enemy.status.dizzyAtkReduce || 0.10);
  syncDizzyLegacy(enemy);
}

function tickEnemyDizzy(enemy) {
  if (!enemy || !enemy.status) return;
  const arr = enemy.status.dizzyInstances;
  if (arr && arr.length > 0) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i] -= 1;
      if (arr[i] <= 0) arr.splice(i, 1);
    }
    syncDizzyLegacy(enemy);
    return;
  }
  // ?덇굅???대갚
  if (enemy.status.dizzyTurns <= 0) return;
  enemy.status.dizzyTurns -= 1;
  if (enemy.status.dizzyTurns <= 0) { enemy.status.dizzyAtkReduce = 0; }
}

function dizzyMissChance(enemy) {
  if (!enemy?.status?.dizzyInstances) return 0;
  return Math.min(0.90, enemy.status.dizzyInstances.length * 0.10);
}

function dizzyAtkMult(enemy) {
  if (!enemy || !enemy.status || !enemy.status.dizzyTurns || enemy.status.dizzyTurns <= 0) return 1.0;
  return 1.0 - (enemy.status.dizzyAtkReduce || 0.10);
}

function syncDizzyLegacy(enemy) {
  if (!enemy?.status) return;
  const arr = enemy.status.dizzyInstances;
  if (!arr || arr.length === 0) {
    enemy.status.dizzyTurns = 0;
    enemy.status.dizzyAtkReduce = 0;
    return;
  }
  enemy.status.dizzyTurns = Math.max(...arr);
  enemy.status.dizzyAtkReduce = Math.max(enemy.status.dizzyAtkReduce || 0, 0.10);
}

function tryCleanseOnHeal(player) {
  if (!player || !player.status) return false;
  let changed = false;
  const d = player.status;
  const dec = (k) => {
    if (d[k] && d[k] > 0) {
      d[k] -= 1;
      changed = true;
    }
  };
  dec("weakenTurns");
  dec("frozenTurns");
  dec("lockHTurns");
  if (d.lockHTurns <= 0) d.lockHRow = null;
  dec("lockVTurns");
  if (d.lockVTurns <= 0) d.lockVCol = null;
  dec("talismanSealTurns");
  dec("tileSealTurns");
  return changed;
}

function cleanseOneDebuff(player) {
  if (!player || !player.status) return null;
  const d = player.status;
  const order = [
    { key: "burnTurns", label: t("combat.statusBurn") },
    { key: "frozenTurns", label: t("combat.statusFreeze") },
    { key: "weakenTurns", label: t("combat.statusWeaken") },
    { key: "lockHTurns", label: t("combat.statusLockH") },
    { key: "lockVTurns", label: t("combat.statusLockV") },
    { key: "talismanSealTurns", label: t("combat.statusTalismanSeal") },
    { key: "tileSealTurns", label: t("combat.statusTileSeal") },
  ];

  for (const it of order) {
    if (it.key === "burnTurns") {
      dotSync(d, "burn");
      if (d.burnTurns > 0 && d.burnStacks > 0) {
        dotReduceTurns(d, "burn", 1);
        return it.label;
      }
      continue;
    }
    if (d[it.key] && d[it.key] > 0) {
      d[it.key] -= 1;
      if (it.key === "lockHTurns" && d.lockHTurns <= 0) d.lockHRow = null;
      if (it.key === "lockVTurns" && d.lockVTurns <= 0) d.lockVCol = null;
      return it.label;
    }
  }

  return null;
}

function cleanseAllDebuffs(player) {
  if (!player || !player.status) return false;
  const d = player.status;
  dotSync(d, "burn");
  d.burnTurns = 0;
  d.burnStacks = 0;
  d.burnByTurns = {};
  d.frozenTurns = 0;
  d.weakenTurns = 0;
  d.lockHTurns = 0;
  d.lockHRow = null;
  d.lockVTurns = 0;
  d.lockVCol = null;
  d.talismanSealTurns = 0;
  d.tileSealTurns = 0;
  return true;
}

function tickPlayerBurn(player) {
  if (!player.status) return 0;
  dotSync(player.status, "burn");
  if (player.status.burnTurns <= 0 || player.status.burnStacks <= 0) return 0;
  const dmgPerStack = player.status.burnDmgPerStack || 3;
  const dmg = Math.max(1, player.status.burnStacks * dmgPerStack);
  dotTick(player.status, "burn");
  return dmg;
}

function tickPlayerBleed(player) {
  if (!player?.status) return 0;
  dotSync(player.status, "bleed");
  if (player.status.bleedTurns <= 0 || player.status.bleedStacks <= 0) return 0;
  const dmgPerStack = player.status.bleedDmgPerStack || 1;
  const dmg = Math.max(1, player.status.bleedStacks * dmgPerStack);
  dotTick(player.status, "bleed");
  return dmg;
}

function symbolStroke(symbolId) {
  if (symbolId === "fire") return "var(--fire)";
  if (symbolId === "light") return "var(--light)";
  if (symbolId === "nature") return "var(--nature)";
  if (symbolId === "water") return "var(--water)";
  return "rgba(242,177,60,0.9)";
}

function elementColorVar(elementId) {
  if (elementId === "fire") return "var(--fire)";
  if (elementId === "light") return "var(--light)";
  if (elementId === "nature") return "var(--nature)";
  if (elementId === "water") return "var(--water)";
  return "var(--accent)";
}

const CONSTELLATION_CELLS = [
  [0, 2],
  [1, 1], [1, 2], [1, 3],
  [2, 2],
];

function findConstellation(grid) {
  if (!grid || ROWS < 3 || COLS < 3) return null;
  const cells = CONSTELLATION_CELLS;
  const base = elementOfSymbolId(grid[cells[0][0]][cells[0][1]]);
  if (!BASE_SYMBOLS.some((s) => s.id === base)) return null;
  for (const [r, c] of cells) {
    if (elementOfSymbolId(grid[r][c]) !== base) return null;
  }
  return { elementId: base, cells };
}

function findTrianglePattern(grid, inverted = false) {
  if (!grid || ROWS < 3 || COLS < 5) return null;
  const cells = inverted
    ? [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
        [1, 1], [1, 3],
        [2, 2],
      ]
    : [
        [0, 2],
        [1, 1], [1, 3],
        [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
      ];
  const base = elementOfSymbolId(grid[cells[0][0]][cells[0][1]]);
  if (!BASE_SYMBOLS.some((s) => s.id === base)) return null;
  for (const [r, c] of cells) {
    if (elementOfSymbolId(grid[r][c]) !== base) return null;
  }
  return { elementId: base, cells };
}

function findXPattern(grid) {
  if (!grid || ROWS < 3 || COLS < 5) return null;
  const cells = [
    [0, 1], [0, 3],
    [1, 2],
    [2, 1], [2, 3],
  ];
  const base = elementOfSymbolId(grid[cells[0][0]][cells[0][1]]);
  if (!BASE_SYMBOLS.some((s) => s.id === base)) return null;
  for (const [r, c] of cells) {
    if (elementOfSymbolId(grid[r][c]) !== base) return null;
  }
  return { elementId: base, cells };
}

function clearFx() {
  if (!ui.fx) return;
  ui.fx.innerHTML = "";
}

function flashEl(el) {
  if (!el) return;
  el.classList.remove("bar__fill--flash");
  void el.offsetWidth;
  el.classList.add("bar__fill--flash");
  window.setTimeout(() => el.classList.remove("bar__fill--flash"), 280);
}

function pulseClass(el, className, ms) {
  if (!el || !className) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), ms || 180);
}

function showEnemyDotFx(kind) {
  if (!ui.enemyHpBar) return;
  const track = ui.enemyHpBar.parentElement;
  if (!track) return;
  const dot = document.createElement("div");
  dot.className = `dotFx dotFx--${kind}`;
  dot.style.left = `${10 + Math.random() * 80}%`;
  track.appendChild(dot);
  window.setTimeout(() => dot.remove(), 620);
}

function showEnemyBarFlame() {
  if (!ui.enemyHpBar) return;
  const track = ui.enemyHpBar.parentElement;
  if (!track) return;
  const flame = document.createElement("div");
  flame.className = "flameFx";
  flame.style.left = `${8 + Math.random() * 84}%`;
  track.appendChild(flame);
  window.setTimeout(() => flame.remove(), 700);
}

// ?? Battle Effect Utilities ??????????????????????????????????

/**
 * showDmgPopup - floating damage number on a character.
 * @param {"enemy"|"player"} target - who is taking damage
 * @param {number} amount - damage or heal amount
 * @param {"hit"|"crit"|"heal"|"shield"|"dot"} kind
 */
function showDmgPopup(target, amount, kind) {
  if (!amount || amount <= 0) return;
  const isEnemy = target === "enemy";
  const container = isEnemy
    ? document.querySelector(".m-char--enemy")
    : document.querySelector(".m-char--hero");
  if (!container) return;

  const el = document.createElement("div");
  let cls = "dmg-popup";
  if (kind === "crit") cls += " dmg-popup--crit";
  else if (kind === "heal") cls += " dmg-popup--heal";
  else if (kind === "shield") cls += " dmg-popup--shield";
  else if (isEnemy) cls += " dmg-popup--enemy";
  else cls += " dmg-popup--player";
  el.className = cls;

  const prefix = kind === "heal" ? "+" : kind === "shield" ? "" : "-";
  el.textContent = kind === "crit" ? `CRIT ${prefix}${amount}` : `${prefix}${amount}`;

  // Slight horizontal randomness to avoid stacking
  const offsetX = (Math.random() - 0.5) * 30;
  el.style.left = `calc(50% + ${offsetX}px)`;

  container.appendChild(el);
  window.setTimeout(() => el.remove(), 850);
}

/**
 * playEnemyLunge - enemy lunges toward player, player recoils.
 * Returns a promise that resolves when lunge is done.
 */
function playEnemyLunge() {
  return new Promise((resolve) => {
    const enemyEl = document.querySelector(".m-char--enemy");
    const heroEl = document.querySelector(".m-char--hero");
    const field = document.querySelector(".m-battle__field");

    if (enemyEl) {
      enemyEl.classList.remove("enemy-lunge");
      void enemyEl.offsetWidth;
      enemyEl.classList.add("enemy-lunge");
      window.setTimeout(() => enemyEl.classList.remove("enemy-lunge"), 420);
    }

    // Hero recoil slightly after lunge connects (~160ms)
    window.setTimeout(() => {
      if (heroEl) {
        heroEl.classList.remove("hero-recoil");
        void heroEl.offsetWidth;
        heroEl.classList.add("hero-recoil");
        window.setTimeout(() => heroEl.classList.remove("hero-recoil"), 380);
      }
      // Screen shake
      if (field) {
        field.classList.remove("screen-shake");
        void field.offsetWidth;
        field.classList.add("screen-shake");
        window.setTimeout(() => field.classList.remove("screen-shake"), 320);
      }
    }, 160);

    window.setTimeout(resolve, 420);
  });
}

/**
 * playDefeatEffect - explosion + flash + particles when enemy dies.
 * Returns a promise that resolves when effect is done.
 */
function playDefeatEffect() {
  return new Promise((resolve) => {
    const enemyEl = document.querySelector(".m-char--enemy");
    const field = document.querySelector(".m-battle__field");

    // Flash overlay
    if (field) {
      const flash = document.createElement("div");
      flash.className = "defeat-flash";
      field.appendChild(flash);
      window.setTimeout(() => flash.remove(), 520);
    }

    // Particles burst from enemy position
    if (field && enemyEl) {
      const rect = enemyEl.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      const cx = rect.left - fieldRect.left + rect.width / 2;
      const cy = rect.top - fieldRect.top + rect.height / 2;
      const colors = ["#ff5a3d", "#ffd84a", "#ff8844", "#ffffff", "#ff3333"];
      for (let i = 0; i < 10; i++) {
        const p = document.createElement("div");
        p.className = "defeat-particle";
        const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.5;
        const dist = 30 + Math.random() * 50;
        p.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
        p.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        p.style.background = colors[i % colors.length];
        p.style.width = `${4 + Math.random() * 5}px`;
        p.style.height = p.style.width;
        field.appendChild(p);
        window.setTimeout(() => p.remove(), 750);
      }
    }

    // Enemy defeat animation
    if (enemyEl) {
      enemyEl.classList.remove("enemy-defeat");
      void enemyEl.offsetWidth;
      enemyEl.classList.add("enemy-defeat");
      window.setTimeout(() => enemyEl.classList.remove("enemy-defeat"), 650);
    }

    // Screen shake (bigger)
    if (field) {
      field.classList.remove("screen-shake");
      void field.offsetWidth;
      field.classList.add("screen-shake");
      window.setTimeout(() => field.classList.remove("screen-shake"), 320);
    }

    window.setTimeout(resolve, 600);
  });
}

// ?먥븧??v3 ?꾪닾 ?댄럺???먥븧??

function fireProjectile(elementId, damage, opts = {}) {
  return new Promise((resolve) => {
    const showNumber = opts.showNumber !== false;
    const heroEl = document.querySelector(".m-char--hero");
    const enemyEl = document.querySelector(".m-char--enemy");
    const field = document.querySelector(".m-battle__field");
    if (!heroEl || !enemyEl || !field) {
      if (showNumber) showElementDmgPopup("enemy", damage, elementId);
      return window.setTimeout(resolve, 120);
    }
    const fieldRect = field.getBoundingClientRect();
    const heroRect = heroEl.getBoundingClientRect();
    const enemyRect = enemyEl.getBoundingClientRect();
    const sx = heroRect.left - fieldRect.left + heroRect.width / 2;
    const sy = heroRect.top - fieldRect.top + heroRect.height * 0.3;
    const ex = enemyRect.left - fieldRect.left + enemyRect.width / 2;
    const ey = enemyRect.top - fieldRect.top + enemyRect.height * 0.5;
    const dx = ex - sx;
    const dy = ey - sy;
    const proj = document.createElement("div");
    proj.className = `projectile projectile--${elementId}`;
    proj.style.left = `${sx}px`;
    proj.style.top = `${sy}px`;
    proj.style.setProperty("--dx", `${dx}px`);
    proj.style.setProperty("--dy", `${dy}px`);
    field.appendChild(proj);
    window.setTimeout(() => {
      proj.remove();
      showImpactBurst(elementId, ex, ey, field);
      if (showNumber) showElementDmgPopup("enemy", damage, elementId);
      if (ui.enemyHpBar) flashEl(ui.enemyHpBar);
      pulseClass(document.querySelector(".m-char--enemy"), "panel--hit", 120);
    }, 300);
    window.setTimeout(resolve, 420);
  });
}

function showImpactBurst(elementId, x, y, container) {
  const colors = { fire: "#ff5a3d", light: "#ffe033", nature: "#69d2a5", water: "#43b4ff" };
  const color = colors[elementId] || "#ffffff";
  for (let i = 0; i < 5; i++) {
    const p = document.createElement("div");
    p.className = "impact-particle";
    const angle = (Math.PI * 2 * i) / 5 + (Math.random() - 0.5) * 0.6;
    const dist = 12 + Math.random() * 18;
    p.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = color;
    container.appendChild(p);
    window.setTimeout(() => p.remove(), 450);
  }
}

function showElementDmgPopup(target, amount, elementId, opts = {}) {
  if (!amount || amount <= 0) return;
  const isEnemy = target === "enemy";
  const container = isEnemy
    ? document.querySelector(".m-char--enemy")
    : document.querySelector(".m-char--hero");
  if (!container) return;
  const el = document.createElement("div");
  let cls = "dmg-popup";
  if (isEnemy) cls += " dmg-popup--enemy";
  else cls += " dmg-popup--player";
  if (opts.crit) cls += " dmg-popup--crit";
  if (elementId) cls += ` dmg-popup--${elementId}`;
  el.className = cls;
  el.textContent = opts.crit ? `CRIT -${Math.floor(amount)}` : `-${Math.floor(amount)}`;
  const offsetX = (Math.random() - 0.5) * 30;
  el.style.left = `calc(50% + ${offsetX}px)`;
  container.appendChild(el);
  window.setTimeout(() => el.remove(), 850);
}

function playExtraStrike(type, damage) {
  return new Promise((resolve) => {
    const field = document.querySelector(".m-battle__field");
    const flashField = (cls, element, duration = 420) => {
      if (field) {
        field.classList.remove("screen-shake");
        void field.offsetWidth;
        field.classList.add("screen-shake");
        window.setTimeout(() => field.classList.remove("screen-shake"), 250);
      }
      const enemyEl = document.querySelector(".m-char--enemy");
      if (enemyEl) {
        enemyEl.classList.remove(cls);
        void enemyEl.offsetWidth;
        enemyEl.classList.add(cls);
        window.setTimeout(() => enemyEl.classList.remove(cls), duration);
      }
      window.setTimeout(() => { showElementDmgPopup("enemy", damage, element); }, 120);
      window.setTimeout(resolve, duration);
    };
    if (type === "lightning") {
      drawEnemyLightningBolt();
      if (field) {
        field.classList.remove("screen-shake");
        void field.offsetWidth;
        field.classList.add("screen-shake");
        window.setTimeout(() => field.classList.remove("screen-shake"), 250);
      }
      window.setTimeout(() => { showElementDmgPopup("enemy", damage, "light"); }, 120);
      window.setTimeout(resolve, 430);
    } else if (type === "hammer") {
      const enemyEl = document.querySelector(".m-char--enemy");
      if (!enemyEl || !field) {
        showElementDmgPopup("enemy", damage, "light");
        return window.setTimeout(resolve, 200);
      }
      const fieldRect = field.getBoundingClientRect();
      const enemyRect = enemyEl.getBoundingClientRect();
      const cx = enemyRect.left - fieldRect.left + enemyRect.width / 2;
      const topY = enemyRect.top - fieldRect.top - 20;
      const targetY = enemyRect.height * 0.6;
      const hammer = document.createElement("div");
      hammer.className = "strike-hammer";
      hammer.style.left = `${cx}px`;
      hammer.style.top = `${topY}px`;
      hammer.style.setProperty("--target-y", `${targetY}px`);
      field.appendChild(hammer);
      window.setTimeout(() => hammer.remove(), 450);
      window.setTimeout(() => {
        if (field) {
          field.classList.remove("screen-shake");
          void field.offsetWidth;
          field.classList.add("screen-shake");
          window.setTimeout(() => field.classList.remove("screen-shake"), 250);
        }
        showElementDmgPopup("enemy", damage, "light");
      }, 240);
      window.setTimeout(resolve, 480);
    } else if (type === "hybrid_light_nature") {
      drawEnemyLightningBolt();
      flashField("enemy-hit-light", "light");
    } else if (type === "hybrid_fire_light") {
      drawEnemyLightningBolt();
      flashField("enemy-hit-fire", "fire");
    } else if (type === "hybrid_light_water") {
      drawEnemyLightningBolt();
      flashField("enemy-hit-water", "light");
    } else if (type === "hybrid_fire_nature") {
      flashField("enemy-hit-fire", "fire");
    } else if (type === "hybrid_nature_water") {
      flashField("enemy-hit-water", "water");
    } else if (type === "hybrid_fire_water") {
      flashField("enemy-hit-fire", "fire");
    } else {
      showElementDmgPopup("enemy", damage, "light");
      window.setTimeout(resolve, 200);
    }
  });
}

function playBurnDotFx(damage) {
  return new Promise((resolve) => {
    const enemyEl = document.querySelector(".m-char--enemy");
    if (!enemyEl) {
      showElementDmgPopup("enemy", damage, "fire");
      return window.setTimeout(resolve, 200);
    }
    const overlay = document.createElement("div");
    overlay.className = "burn-overlay";
    enemyEl.appendChild(overlay);
    window.setTimeout(() => overlay.remove(), 650);
    for (let i = 0; i < 4; i++) {
      window.setTimeout(() => {
        const spark = document.createElement("div");
        spark.className = "burn-spark";
        spark.style.left = `${15 + Math.random() * 70}%`;
        enemyEl.appendChild(spark);
        window.setTimeout(() => spark.remove(), 650);
      }, i * 80);
    }
    showEnemyBarFlame();
    window.setTimeout(() => { showElementDmgPopup("enemy", damage, "fire"); }, 150);
    window.setTimeout(resolve, 600);
  });
}

// ?먥븧??v3 ?댁??ъ? 鍮쀫굹媛??댄럺???먥븧??

function playDizzyMissEffect() {
  return new Promise((resolve) => {
    const enemyEl = document.querySelector(".m-char--enemy");
    if (enemyEl) {
      enemyEl.classList.add("enemy-dizzy-miss");
      setTimeout(() => enemyEl.classList.remove("enemy-dizzy-miss"), 500);
    }
    showDmgPopupText("player", "MISS", "miss");
    setTimeout(resolve, 500);
  });
}

function showDmgPopupText(target, text, kind) {
  const container = target === "enemy"
    ? document.querySelector(".m-char--enemy")
    : document.querySelector(".m-char--hero");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `dmg-popup dmg-popup--${kind}`;
  el.textContent = text;
  el.style.left = `calc(50% + ${(Math.random() - 0.5) * 20}px)`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function showBossIntro(enemy) {
  if (!enemy || !enemy.isBoss) return;
  const name = enemyName(enemy);
  logEvt("note", t("log.bossIntro", { name }));
  showFxToast({ title: t("label.bossIntro"), subtitle: name, symbolId: null });
  if (ui.enemyPanel) {
    ui.enemyPanel.classList.remove("panel--bossIntro");
    void ui.enemyPanel.offsetWidth;
    ui.enemyPanel.classList.add("panel--bossIntro");
    window.setTimeout(() => ui.enemyPanel.classList.remove("panel--bossIntro"), 900);
  }
}

function setJourneyMode(mode) {
  if (!ui.journey) return;
  ui.journey.classList.remove("journey--idle", "journey--meet", "journey--advance");
  ui.journey.classList.add(`journey--${mode}`);
}

function pickEventType(clearedStage) {
  if (clearedStage < 2) return null;
  if (Math.random() >= 0.4) return null;

  const options = [];
  if (!state.wraithUsed) options.push("wraith");
  if (!state.nextPriestStage || clearedStage >= state.nextPriestStage) options.push("priest");
  if (!state.nextVaultStage || clearedStage >= state.nextVaultStage) options.push("vault");
  if (!options.length) return null;
  return pickOne(options);
}

function skillById(id) {
  const active = SKILLS.find((s) => s.id === id);
  if (active) return active;
  if (typeof RAW_SKILLS !== "undefined" && Array.isArray(RAW_SKILLS)) {
    const raw = RAW_SKILLS.find((s) => s.id === id);
    if (raw) return raw;
  }
  return null;
}

function openSimpleEventModal(title, message, hint = null, artKind = "campfire") {
  setModalArt(artKind);
  const titleEl = document.getElementById("modalTitle");
  const kickerEl = document.getElementById("modalKicker");
  const messageEl = document.getElementById("modalMessage");
  const hintEl = document.getElementById("modalHint");
  if (kickerEl) kickerEl.textContent = t("ev.eventKicker");
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (hintEl) hintEl.textContent = hint || t("ev.chooseHint");
  if (ui.modal) {
    ui.modal.classList.add("modal--campfire");
  }
  ui.choices.innerHTML = "";
  openModal();
  renderAll();
}

function addEventChoice(name, desc, onPick) {
  const el = document.createElement("div");
  el.className = "choice";
  el.innerHTML = `<div class="choice__name">${escapeHtml(name)}</div><div class="choice__desc">${escapeHtml(desc || "")}</div>`;
  el.addEventListener("click", () => onPick(), { once: true });
  ui.choices.appendChild(el);
}


const GHOST_EVENT_TEXT = {
  title: "망령 성불",
  quote: "\"나를... 이 갑옷에서 해방시켜주겠나...\"",
  name: "서린 갑주의 망령",
  info: "7라운드 안에 망령을 성불시키면 라운드 기록에 따라 스킬 보상을 획득합니다.",
  challenge: "성불한다",
  challengeDesc: "7라운드 이내 처치 시 등급별 스킬 보상 획득",
  battleLog: "망령 성불: 7라운드 안에 처치하라!",
  rewardSS: "3R 이내: SS 등급 스킬 1종",
  rewardS: "5R 이내: S 등급 스킬 1종",
  rewardA: "7R 이내: A 등급 스킬 1종",
};

// ?? 留앸졊 ?깅텋 ??
function startWraithEvent() {
  state.wraithUsed = true;
  openSimpleEventModal(GHOST_EVENT_TEXT.title, "", null, "wraith");
  const msgEl = document.getElementById("modalMessage");
  if (msgEl) {
    msgEl.innerHTML = `<div class="event-quote">${GHOST_EVENT_TEXT.quote}</div>`
      + `<div class="wraith-monster"><span class="wraith-monster__icon">👻</span><span class="wraith-monster__name">${GHOST_EVENT_TEXT.name}</span></div>`
      + `<div class="wraith-info">${GHOST_EVENT_TEXT.info}</div>`
      + `<div class="ghost-rewards">`
      + `<div class="ghost-reward ghost-reward--ss"><div class="ghost-reward__round">3R</div><div class="ghost-reward__grade">SS</div><div class="ghost-reward__desc">${GHOST_EVENT_TEXT.rewardSS}</div></div>`
      + `<div class="ghost-reward ghost-reward--s"><div class="ghost-reward__round">5R</div><div class="ghost-reward__grade">S</div><div class="ghost-reward__desc">${GHOST_EVENT_TEXT.rewardS}</div></div>`
      + `<div class="ghost-reward ghost-reward--a"><div class="ghost-reward__round">7R</div><div class="ghost-reward__grade">A</div><div class="ghost-reward__desc">${GHOST_EVENT_TEXT.rewardA}</div></div>`
      + `</div>`;
  }

  addEventChoice(GHOST_EVENT_TEXT.challenge, GHOST_EVENT_TEXT.challengeDesc, () => {
    closeModal();
    startGhostBattle();
  });
}

function startGhostBattle() {
  state.wraithBattle = { roundLimit: 7, startTurn: 1 };
  // 留앸졊 ?깅텋: ?뚮뱶諛?紐ъ뒪?????쇰컲 紐ъ뒪?곗쓽 200% HP, 怨듦꺽 ????
  const baseEnemy = newEnemy(state.stage, state.chapter);
  const chapterStartAtk = Math.max(
    1,
    Math.floor(Number(state.chapterStartBaseMatchDamage || state.player?.baseMatchDamage || 1))
  );
  const wraithHp = chapterStartAtk * 50;
  const ghost = {
    ...baseEnemy,
    id: "wraith",
    name: GHOST_EVENT_TEXT.name,
    icon: "Images/enemy_6.png",
    hp: wraithHp,
    maxHp: wraithHp,
    atk: 1,
    attackEvery: 99,
    attackOffset: 99,
    isBoss: false,
    passives: [],
    shield: 0,
    status: {
      ...(baseEnemy.status || {}),
      burnInstances: [...((baseEnemy.status && baseEnemy.status.burnInstances) || [])],
      dizzyInstances: [...((baseEnemy.status && baseEnemy.status.dizzyInstances) || [])],
      thornInstances: [...((baseEnemy.status && baseEnemy.status.thornInstances) || [])],
      hypothermInstances: [...((baseEnemy.status && baseEnemy.status.hypothermInstances) || [])],
    },
  };
  state.enemy = ghost;
  showBossIntro(state.enemy);
  state.turn = 1;
  state.turnDamage = null;
  resetLogBoxes();
  state.grid = rollGrid(state.player);
  state.matchesAll = [];
  state.revealedMatchCount = 0;
  state.lastStepCells = new Set();
  state.lastJackpot = false;
  if (state.petPassiveState) {
    state.petPassiveState.onHitUsedThisTurn = false;
    state.petPassiveState.periodicCounters = {};
    state.petPassiveState.comboAccumulator = 0;
    state.petPassiveState.patternCounters = { row: 0, col: 0 };
    state.petPassiveState.roundNumber = 0;
    state.petPassiveState.triggerCounts = {};
    state.petPassiveState.passivesDisabled = false;
    state.petPassiveState.stackingAtkBonus = 0;
    state.petPassiveState.bigHealCooldown = 0;
    state.petPassiveState.permanentAtkReduce = 0;
    state.petPassiveState.permanentDmgReduce = 0;
    state.petPassiveState.atkBuffFromPassive = 0;
    state.petPassiveState.atkBuffFromPassiveTurns = 0;
    state.petPassiveState.critDmgFromPassive = 0;
    state.petPassiveState.critDmgFromPassiveTurns = 0;
    state.petPassiveState.enemyHpBelowDmgBonus = 0;
    state.petPassiveState.enemyHpBelowThreshold = 0;
    state.petPassiveState.comboIntervalReduce = 0;
  }
  applyPetBattleStartPassives(state.player);
  applyBattleStartShield(state.player);
  state.battleStartHp = state.player.hp;
  logEvt("note", GHOST_EVENT_TEXT.battleLog);
  setJourneyMode("meet");
  renderAll(true);
}

// ?? 愿댁쭨??猷곕젢 ??

const ROULETTE_EXP_PER_SLOT = 20;

const ROULETTE_SLOT_COLORS = {
  exp:      "rgba(34, 197, 94, 0.13)",
  s_skill:  "rgba(59, 130, 246, 0.20)",
  ss_skill: "rgba(168, 85, 247, 0.22)",
  skull:    "rgba(239, 68, 68, 0.22)",
};

const ROULETTE_SLOT_ICONS = {
  exp:      "✦",
  s_skill:  "◆",
  ss_skill: "✹",
  skull:    "☠",
};

function buildInitialRouletteSlots() {
  return [
    { type: "exp", consumed: false },
    { type: "exp", consumed: false },
    { type: "s_skill", consumed: false },
    { type: "exp", consumed: false },
    { type: "exp", consumed: false },
    { type: "ss_skill", consumed: false },
    { type: "exp", consumed: false },
    { type: "exp", consumed: false },
  ];
}

function rouletteBuildWheelHTML(slots, hitSlot, rotationDeg) {
  const totalSlots = slots.length;
  const segAngle = 360 / totalSlots;

  let gradStops = [];
  for (let i = 0; i < totalSlots; i++) {
    const s = slots[i];
    const color = s.consumed ? ROULETTE_SLOT_COLORS.skull : ROULETTE_SLOT_COLORS[s.type];
    gradStops.push(`${color} ${i * segAngle}deg ${(i + 1) * segAngle}deg`);
  }

  const rotStyle = rotationDeg != null ? `transform: rotate(${rotationDeg}deg);` : "";

  let html = `<div class="roulette-container">`;
  html += `<div class="roulette-pointer">▼</div>`;
  html += `<div class="roulette-circle" id="rouletteCircle" style="background: conic-gradient(from -${segAngle / 2}deg, ${gradStops.join(", ")}); ${rotStyle}">`;

  for (let i = 0; i < totalSlots; i++) {
    const angle = i * segAngle;
    const iconAngle = angle + segAngle / 2;
    const s = slots[i];
    const icon = s.consumed ? ROULETTE_SLOT_ICONS.skull : ROULETTE_SLOT_ICONS[s.type];
    const isHit = hitSlot !== null && i === hitSlot;
    let iconCls = "roulette-seg-icon";
    if (isHit) iconCls += s.consumed ? " seg-icon--bust-hit" : " seg-icon--reward-hit";
    html += `<div class="${iconCls}" style="--angle: ${iconAngle}deg">${icon}</div>`;
    html += `<div class="roulette-seg-line" style="--angle: ${angle}deg"></div>`;
  }
  html += `<div class="roulette-center"></div>`;
  html += `</div></div>`;
  return html;
}

function rouletteBuildAccumHTML(accum) {
  const parts = [];
  if (accum.exp > 0) parts.push(`EXP +${accum.exp}`);
  if (accum.sSkill) parts.push(`◆ ${t("ev.rouletteSkillToken")}`);
  if (accum.ssSkill) parts.push(`✹ ${t("ev.rouletteSkillToken")}`);
  if (!parts.length) return "";
  return `<div class="event-reward event-reward--good"><div class="event-reward__title">${t("ev.rouletteAccum")}</div>`
    + `<div class="event-reward__detail">${parts.join(" / ")}</div></div>`;
}

function startRouletteEvent() {
  state.nextVaultStage = state.stage + 4;
  const slots = buildInitialRouletteSlots();
  const accumulated = { exp: 0, sSkill: false, ssSkill: false };

  openSimpleEventModal(t("ev.rouletteTitle"), "", null, "vault");
  const msgEl = document.getElementById("modalMessage");
  if (msgEl) {
    msgEl.innerHTML = `<div class="event-quote">${t("ev.rouletteQuote")}</div>`
      + rouletteBuildWheelHTML(slots, null)
      + `<div class="roulette-info">${t("ev.rouletteInfo")}</div>`;
  }
  addEventChoice(t("ev.rouletteSpin"), t("ev.rouletteSpinDesc"), () => {
    closeModal();
    rouletteDoSpin(slots, accumulated);
  });
  addEventChoice(t("ev.rouletteRefuse"), t("ev.rouletteRefuseDesc"), () => {
    logEvt("note", t("ev.rouletteRefuseLog"));
    closeModal();
    proceedAfterCampfire();
  });
}

function rouletteDoSpin(slots, accumulated) {
  const totalSlots = slots.length;
  const segAngle = 360 / totalSlots;

  // ?꾩껜 ?щ’ 以??쒕뜡 hitSlot (?? 移몄뿉 嫄몃━硫?苑?
  const allIndices = [];
  for (let i = 0; i < totalSlots; i++) allIndices.push(i);
  const hitSlot = pickOne(allIndices);

  // ? ?ㅽ? ?좊땲硫붿씠??紐⑤떖 ?
  openSimpleEventModal(t("ev.rouletteTitle"), "", null, "vault");
  const msgEl = document.getElementById("modalMessage");
  if (msgEl) {
    msgEl.innerHTML = rouletteBuildWheelHTML(slots, null)
      + `<div class="roulette-spinning-text">${t("ev.rouletteSpinning")}</div>`;
  }

  const circle = document.getElementById("rouletteCircle");
  if (circle) {
    const targetSegCenter = hitSlot * segAngle + segAngle / 2;
    const fullRotations = (3 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = fullRotations - targetSegCenter;

    requestAnimationFrame(() => {
      circle.style.transition = "transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
      circle.style.transform = `rotate(${targetAngle}deg)`;
    });

    const finalAngle = targetAngle % 360;
    setTimeout(() => {
      showRouletteResult(slots, hitSlot, accumulated, finalAngle);
    }, 2700);
  }
}

function showRouletteResult(slots, hitSlot, accumulated, finalAngle) {
  const hitType = slots[hitSlot].type;
  const isSkull = slots[hitSlot].consumed;

  if (isSkull) {
    // ??? 苑? ?꾩븸 ?먯떎 ???
    logEvt("bad", t("ev.rouletteBustLog", { exp: accumulated.exp, sSkill: accumulated.sSkill, ssSkill: accumulated.ssSkill }));

    openSimpleEventModal(t("ev.rouletteBustTitle"), "", null, "vault");
    const msgEl = document.getElementById("modalMessage");
    if (msgEl) {
      msgEl.innerHTML = rouletteBuildWheelHTML(slots, hitSlot, finalAngle)
        + `<div class="event-reward event-reward--bad"><div class="event-reward__title">${t("ev.rouletteBust")}</div>`
        + `<div class="event-reward__detail">${t("ev.rouletteBustAllLost")}</div></div>`
        + `<div class="event-quote">${t("ev.rouletteBustQuote")}</div>`;
    }
    addEventChoice(t("ev.continueBtn"), "", () => {
      closeModal();
      proceedAfterCampfire();
    });
    return;
  }

  // ??? 蹂댁긽 ?꾩쟻 (?곸슜?섏? ?딄퀬 湲곕줉留? ???
  let rewardLabel = "";
  if (hitType === "exp") {
    accumulated.exp += ROULETTE_EXP_PER_SLOT;
    rewardLabel = `EXP +${ROULETTE_EXP_PER_SLOT}`;
  } else if (hitType === "s_skill") {
    accumulated.sSkill = true;
    rewardLabel = `◆ ${t("ev.rouletteSlotS")}`;
  } else if (hitType === "ss_skill") {
    accumulated.ssSkill = true;
    rewardLabel = `✹ ${t("ev.rouletteSlotSS")}`;
  }
  logEvt("good", t("ev.rouletteRewardLog", { reward: rewardLabel }));

  // ??? ?щ’ ?뚮㈇: ?뱀꺼移?+ ?쒕뜡 1移???consumed ???
  slots[hitSlot].consumed = true;
  const remaining = [];
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i].consumed) remaining.push(i);
  }
  if (remaining.length > 0) {
    const extraSkull = pickOne(remaining);
    slots[extraSkull].consumed = true;
  }

  // ?⑥? ?쒖꽦 ?щ’
  const stillActive = slots.filter(s => !s.consumed).length;

  if (stillActive === 0) {
    // 紐⑤뱺 移??뚮㈇ ???먮룞 ?뺤젙
    logEvt("good", t("ev.rouletteCompleteLog"));
    openSimpleEventModal(t("ev.rouletteTitle"), "", null, "vault");
    const msgEl = document.getElementById("modalMessage");
    if (msgEl) {
      msgEl.innerHTML = rouletteBuildWheelHTML(slots, hitSlot, finalAngle)
        + `<div class="event-reward event-reward--good"><div class="event-reward__title">${rewardLabel}</div></div>`
        + rouletteBuildAccumHTML(accumulated)
        + `<div class="event-quote">${t("ev.rouletteCompleteQuote")}</div>`;
    }
    addEventChoice(t("ev.continueBtn"), "", () => {
      closeModal();
      rouletteEndEvent(accumulated);
    });
  } else {
    // ?좏깮: ??踰???vs 洹몃쭔?먭린
    const skullCount = slots.filter(s => s.consumed).length;
    const skullPct = Math.round(skullCount / slots.length * 100);

    openSimpleEventModal(t("ev.rouletteRewardTitle"), "", null, "vault");
    const msgEl = document.getElementById("modalMessage");
    if (msgEl) {
      msgEl.innerHTML = rouletteBuildWheelHTML(slots, hitSlot, finalAngle)
        + `<div class="event-reward event-reward--good"><div class="event-reward__title">${rewardLabel}</div></div>`
        + rouletteBuildAccumHTML(accumulated)
        + `<div class="roulette-next-info">${t("ev.rouletteNextBust", { pct: skullPct })}</div>`;
    }
    addEventChoice(t("ev.rouletteMore"), t("ev.rouletteMoreDesc", { pct: skullPct }), () => {
      closeModal();
      rouletteDoSpin(slots, accumulated);
    });
    addEventChoice(t("ev.rouletteStop"), t("ev.rouletteStopDesc"), () => {
      logEvt("good", t("ev.rouletteStopLog"));
      closeModal();
      rouletteEndEvent(accumulated);
    });
  }
}

// ??? ?대깽??醫낅즺: 蹂댁긽 ?쇨큵 ?곸슜 ???
function rouletteEndEvent(accumulated) {
  const p = state.player;
  if (accumulated.exp > 0) {
    p.xp += accumulated.exp;
    logEvt("good", t("ev.rouletteExpGain", { exp: accumulated.exp }));
  }

  // 泥댁씤: ?덈꺼????S?ㅽ궗 ??SS?ㅽ궗 ???먰뿕 怨꾩냽
  rouletteChainLevelUps(() => {
    rouletteOfferGradeSkill(accumulated, "S", () => {
      rouletteOfferGradeSkill(accumulated, "SS", () => {
        proceedAfterCampfire();
      });
    });
  });
}

// ?덈꺼???곗뇙 泥섎━ (?ш?)
function rouletteChainLevelUps(callback) {
  const p = state.player;
  if (p.xp < p.xpToNext) { callback(); return; }

  p.xp -= p.xpToNext;
  p.level += 1;
  p.xpToNext = (typeof xpToNextForLevel === "function") ? xpToNextForLevel(p.level) : p.xpToNext;
  logEvt("good", t("ui.levelUp") + ` Lv.${p.level}`);
  let picks = [];
  try {
    if (typeof buildSafeLevelUpPicks === "function") picks = buildSafeLevelUpPicks(3);
    else if (typeof draftSkills === "function") picks = draftSkills(3);
  } catch (err) {
    console.warn("[roulette-levelup-draft-error]", err);
  }
  if (!picks || picks.length === 0) { callback(); return; }

  openSimpleEventModal(t("ui.levelUp") + ` Lv.${p.level}`, "", t("ui.chooseSkill"), "gamble");
  for (const s of picks) {
    addEventChoice(skillName(s), skillShortDesc(s), () => {
      applySkillToPlayer(s);
      closeModal();
      rouletteChainLevelUps(callback);
    });
  }
}

// ?깃툒蹂??ㅽ궗 ?좏깮
function rouletteOfferGradeSkill(accumulated, grade, callback) {
  const key = grade === "S" ? "sSkill" : "ssSkill";
  if (!accumulated[key]) { callback(); return; }

  const picks = draftSkillsByGrade(grade, 3);
  if (picks.length === 0) { callback(); return; }

  const icon = grade === "S" ? "◆" : "✹";
  openSimpleEventModal(`${icon} ${grade}${t("ev.rouletteSkillReward")}`, "", t("ev.chooseSkillHint"), "gamble");
  for (const s of picks) {
    addEventChoice(skillName(s), skillShortDesc(s), () => {
      applySkillToPlayer(s);
      closeModal();
      callback();
    });
  }
}

function startPriestEvent() {
  state.nextPriestStage = state.stage + 4;
  openSimpleEventModal(t("ev.priestTitle"), "", null, "priest");
  const msgEl = document.getElementById("modalMessage");
  const p = state.player;
  const hpLoss = Math.max(1, Math.floor(p.maxHp * 0.1));
  if (msgEl) {
    msgEl.innerHTML = `<div class="event-quote">${t("ev.priestQuote")}</div>`
      + `<div class="priest-trade">`
      + `<div class="priest-trade__cost"><span class="priest-trade__icon">♥</span><span>${t("ev.priestCost", { loss: hpLoss })}</span></div>`
      + `<div class="priest-trade__arrow">→</div>`
      + `<div class="priest-trade__reward"><span class="priest-trade__icon">✦</span><span>${t("ev.priestReward")}</span></div>`
      + `</div>`;
  }

  addEventChoice(t("ev.priestDeal"), t("ev.priestDealDesc", { loss: hpLoss }), () => {
    p.maxHp = Math.max(1, p.maxHp - hpLoss);
    p.hp = Math.min(p.hp, p.maxHp);
    logEvt("bad", t("ev.priestDealLog", { loss: hpLoss }));

    const priestIds = [
      "demon_contract",
      "last_breath",
      "last_stand",
      "victory_blessing",
      "frugal_heal",
      "full_prepared",
      "heaven_punish",
      "shining_star",
      "pattern_triangle",
      "pattern_inv_triangle",
      "pattern_cross",
    ];
    const ownedCounts = ownedSkillCounts(state.player.skills || []);
    const pool = priestIds
      .map((id) => skillById(id))
      .filter(Boolean)
      .filter((s) => {
        const maxStacks = Number.isFinite(s.maxStacks) ? s.maxStacks : 1;
        if (maxStacks <= 0) return false;
        return (ownedCounts.get(s.id) || 0) < maxStacks;
      });

    const picks = shuffledCopy(pool).slice(0, Math.min(2, pool.length));
    openSimpleEventModal(t("ev.priestOfferTitle"), "", t("ev.chooseSkillHint"), "priest");
    const msgEl2 = document.getElementById("modalMessage");
    if (msgEl2) {
      msgEl2.innerHTML = `<div class="event-reward event-reward--bad"><div class="event-reward__title">${t("ev.priestPaidTitle")}</div>`
        + `<div class="event-reward__detail">${t("ev.priestPaidDetail", { loss: hpLoss })}</div></div>`
        + `<div class="event-quote">${t("ev.priestOfferQuote")}</div>`;
    }
    for (const s of picks) {
      addEventChoice(skillName(s), skillShortDesc(s), () => {
        applySkillToPlayer(s);
        closeModal();
        proceedAfterCampfire();
      });
    }
    if (!picks.length) {
      addEventChoice(t("ev.priestNoSkill"), t("ev.priestNoSkillDesc"), () => {
        closeModal();
        proceedAfterCampfire();
      });
    }
  });

  addEventChoice(t("ev.priestPass"), t("ev.priestPassDesc"), () => {
    logEvt("note", t("ev.priestPassLog"));
    closeModal();
    proceedAfterCampfire();
  });
}

function startCampfireEvent() {
  proceedAfterCampfire();
}

function proceedAfterCampfire() {
  setModalArt(null);
  const titleEl = document.getElementById("modalTitle");
  const kickerEl = document.getElementById("modalKicker");
  const messageEl = document.getElementById("modalMessage");
  const hintEl = document.getElementById("modalHint");
  if (kickerEl) kickerEl.textContent = t("ui.levelUp");
  if (titleEl) titleEl.textContent = t("ui.chooseSkill");
  if (messageEl) messageEl.textContent = "";
  if (hintEl) hintEl.textContent = t("ui.chooseOne");
  if (ui.modal) {
    ui.modal.classList.remove("modal--campfire");
  }
  state.wraithBattle = null;
  state.turn = 1;
  state.turnDamage = null;
  resetLogBoxes();
  state.enemy = newEnemy(state.stage, state.chapter);
  showBossIntro(state.enemy);
  state.grid = rollGrid(state.player);
  state.matchesAll = [];
  state.revealedMatchCount = 0;
  state.lastStepCells = new Set();
  state.lastJackpot = false;
  // Reset passive state for new battle (keep cooldowns)
  if (state.petPassiveState) {
    state.petPassiveState.onHitUsedThisTurn = false;
    state.petPassiveState.periodicCounters = {};
    state.petPassiveState.comboAccumulator = 0;
    state.petPassiveState.patternCounters = { row: 0, col: 0 };
    state.petPassiveState.roundNumber = 0;
    state.petPassiveState.triggerCounts = {};
    state.petPassiveState.passivesDisabled = false;
    state.petPassiveState.stackingAtkBonus = 0;
    state.petPassiveState.bigHealCooldown = 0;
    state.petPassiveState.permanentAtkReduce = 0;
    state.petPassiveState.permanentDmgReduce = 0;
    state.petPassiveState.atkBuffFromPassive = 0;
    state.petPassiveState.atkBuffFromPassiveTurns = 0;
    state.petPassiveState.critDmgFromPassive = 0;
    state.petPassiveState.critDmgFromPassiveTurns = 0;
    state.petPassiveState.enemyHpBelowDmgBonus = 0;
    state.petPassiveState.enemyHpBelowThreshold = 0;
    state.petPassiveState.comboIntervalReduce = 0;
  }
  applyPetBattleStartPassives(state.player);
  applyBattleStartShield(state.player);
  state.battleStartHp = state.player.hp;
  setJourneyMode("meet");
  renderAll(true);
}

function applySkillToPlayer(skill) {
  if (!skill || !state.player) return;
  const ownedCounts = ownedSkillCounts(state.player.skills);
  const lockedGroups = new Set(
    (state.player.skills || [])
      .map((s) => (typeof skillGroupKey === "function" ? skillGroupKey(s && s.id) : null))
      .filter(Boolean)
  );
  const maxStacks = Number.isFinite(skill.maxStacks) ? skill.maxStacks : 1;
  const groupKey = typeof skillGroupKey === "function" ? skillGroupKey(skill.id) : null;
  if (groupKey && lockedGroups.has(groupKey) && !(state.player.skills || []).some((s) => s && s.id === skill.id)) {
    logEvt("bad", `이미 다른 변환류 스킬을 보유 중입니다`);
    renderAll();
    return;
  }
  if (maxStacks <= 0 || (ownedCounts.get(skill.id) || 0) < maxStacks) {
    const prevMaxHp = state.player.maxHp || 0;
    const prevHp = state.player.hp || 0;
    const prevBaseMatchDamage = state.player.baseMatchDamage || 0;
    const prevDamageReduction = state.player.damageReduction || 0;
    const prevCritDamageMult = state.player.critDamageMult || 1.0;
    state.player.skills.push(skill);
    if (skill.apply) skill.apply(state.player);
    if ((state.player.maxHp || 0) !== prevMaxHp) {
      state.player.maxHp = Math.max(1, Math.floor(state.player.maxHp || 1));
      if (prevMaxHp > 0) {
        const hpRatio = Math.max(0, Math.min(1, prevHp / prevMaxHp));
        state.player.hp = Math.max(0, Math.min(state.player.maxHp, Math.floor(state.player.maxHp * hpRatio)));
      } else {
        state.player.hp = Math.min(state.player.maxHp, Math.max(0, Math.floor(state.player.hp || 0)));
      }
    }
    if ((state.player.baseMatchDamage || 0) !== prevBaseMatchDamage) {
      state.player.baseMatchDamage = Math.max(1, Math.floor(state.player.baseMatchDamage || 1));
    }
    if (state.player.equipBaseStats) {
      if ((state.player.maxHp || 0) !== prevMaxHp) {
        const hpRatio = prevMaxHp > 0 ? Math.max(0, Math.min(1, prevHp / prevMaxHp)) : 1;
        state.player.equipBaseStats.maxHp = Math.max(1, Math.floor(state.player.maxHp || 1));
        state.player.hp = Math.max(0, Math.min(state.player.maxHp, Math.floor(state.player.maxHp * hpRatio)));
      }
      if ((state.player.baseMatchDamage || 0) !== prevBaseMatchDamage) {
        state.player.equipBaseStats.baseMatchDamage = Math.max(1, Math.floor(state.player.baseMatchDamage || 1));
      }
      if ((state.player.damageReduction || 0) !== prevDamageReduction) {
        state.player.equipBaseStats.damageReduction = state.player.damageReduction || 0;
      }
      if ((state.player.critDamageMult || 1.0) !== prevCritDamageMult) {
        state.player.equipBaseStats.critDamageMult = state.player.critDamageMult || 1.0;
      }
    }
    logEvt("good", t("log.skillGain", { name: skillName(skill) }));
    showFxToast({ title: skillName(skill), subtitle: t("ui.obtain"), symbolId: skillFxSymbolId(skill.id) });
  }
  renderAll();
}

function clearEnemyFx() {
  if (!ui.enemyFx) return;
  ui.enemyFx.innerHTML = "";
}

function drawEnemyLightningBolt() {
  if (!ui.enemyFx) return;
  const panel = ui.enemyFx.parentElement;
  if (!panel) return;
  if (!ui.enemyHpBar) return;

  const w = panel.clientWidth;
  const h = panel.clientHeight;
  ui.enemyFx.setAttribute("viewBox", `0 0 ${w} ${h}`);
  ui.enemyFx.setAttribute("preserveAspectRatio", "none");

  const panelRect = panel.getBoundingClientRect();
  const barRect = ui.enemyHpBar.getBoundingClientRect();
  const to = {
    x: barRect.left - panelRect.left + barRect.width * (0.25 + Math.random() * 0.5),
    y: barRect.top - panelRect.top + barRect.height / 2,
  };
  const from = { x: to.x + randInt(-10, 10), y: -12 };

  const steps = 7;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wiggle = randInt(-10, 10) * (1 - Math.abs(0.5 - t) * 2);
    const x = from.x + (to.x - from.x) * t + wiggle;
    const y = from.y + (to.y - from.y) * t;
    pts.push([x, y]);
  }
  pts[0] = [from.x, from.y];
  pts[pts.length - 1] = [to.x, to.y];

  clearEnemyFx();
  const ns = "http://www.w3.org/2000/svg";

  const poly = document.createElementNS(ns, "polyline");
  poly.setAttribute("points", pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
  poly.setAttribute("stroke", "var(--light)");
  poly.setAttribute("fill", "none");
  poly.setAttribute("class", "fx__bolt fx__bolt--anim");
  ui.enemyFx.appendChild(poly);

  const dot = document.createElementNS(ns, "circle");
  dot.setAttribute("cx", to.x.toFixed(1));
  dot.setAttribute("cy", to.y.toFixed(1));
  dot.setAttribute("r", "5");
  dot.setAttribute("fill", "var(--light)");
  dot.setAttribute("opacity", "0.9");
  ui.enemyFx.appendChild(dot);

  window.setTimeout(() => clearEnemyFx(), 650);
}

function getCellCenterInWrap(r, c) {
  if (!ui.gridWrap || !ui.grid.children.length) return { x: 0, y: 0 };
  const wrapRect = ui.gridWrap.getBoundingClientRect();
  const i = r * COLS + c;
  const el = ui.grid.children[i];
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - wrapRect.left + rect.width / 2,
    y: rect.top - wrapRect.top + rect.height / 2,
  };
}

function drawLightningBoltTo(r, c) {
  if (!ui.fx || !ui.gridWrap) return;
  const w = ui.gridWrap.clientWidth;
  const h = ui.gridWrap.clientHeight;
  ui.fx.setAttribute("viewBox", `0 0 ${w} ${h}`);
  ui.fx.setAttribute("preserveAspectRatio", "none");

  const to = getCellCenterInWrap(r, c);
  const from = { x: to.x + randInt(-8, 8), y: -10 };

  const steps = 6;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t + randInt(-10, 10) * (1 - Math.abs(0.5 - t) * 2);
    const y = from.y + (to.y - from.y) * t;
    pts.push([x, y]);
  }
  pts[0] = [from.x, from.y];
  pts[pts.length - 1] = [to.x, to.y];

  const ns = "http://www.w3.org/2000/svg";
  const poly = document.createElementNS(ns, "polyline");
  poly.setAttribute("points", pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
  poly.setAttribute("stroke", "var(--light)");
  poly.setAttribute("fill", "none");
  poly.setAttribute("class", "fx__bolt fx__bolt--anim");
  ui.fx.appendChild(poly);
}

const fxToastQueue = [];
let fxToastBusy = false;

function showFxToast({ title, subtitle, symbolId }) {
  if (!ui.fxToast) return;
  fxToastQueue.push({ title, subtitle, symbolId });
  if (!fxToastBusy) flushFxToastQueue();
}

function flushFxToastQueue() {
  if (!ui.fxToast || fxToastBusy) return;
  const next = fxToastQueue.shift();
  if (!next) return;
  fxToastBusy = true;
  const { title, subtitle, symbolId } = next;
  const sym = symbolId ? ` fxToast__t--${symbolId}` : "";
  ui.fxToast.innerHTML = `<div class="fxToast__k">${escapeHtml(t("ui.fxSkill"))}</div><div class="fxToast__t${sym}">${escapeHtml(title)}</div>${subtitle ? `<div class="fxToast__s">${escapeHtml(subtitle)}</div>` : ""}`;
  ui.fxToast.classList.remove("fxToast--show");
  void ui.fxToast.offsetWidth;
  ui.fxToast.classList.add("fxToast--show");
  setTimeout(() => {
    fxToastBusy = false;
    flushFxToastQueue();
  }, 950);
}

function showComboFx(elementId) {
  if (!elementId) return;
  if (elementId === "light") drawEnemyLightningBolt();
  if (ui.gridWrap) pulseClass(ui.gridWrap, `gridWrap--combo-${elementId}`, 360);
  flashEl(ui.enemyHpBar);
  pulseClass(ui.enemyPanel, "panel--hit", 190);
  pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
}

function showComboToast(tier, primaryElementId, detail) {
  if (!tier || tier <= 0) return;
  const title = t("combo.title", { tier });
  const subtitle = detail ? t("combo.subtitle", detail) : null;
  showFxToast({ title, subtitle, symbolId: primaryElementId || null });
  if (tier >= 3) pulseClass(ui.gridWrap, "gridWrap--lucky", 320);
}

// ?먥븧???뚮젅?댁뼱 ?붾쾭??VFX ?먥븧??

function playStunFailEffect() {
  return new Promise((resolve) => {
    const gridWrap = document.getElementById("gridWrap");
    if (!gridWrap) return resolve();
    const el = document.createElement("div");
    el.className = "stunBurst";
    el.textContent = "??";
    gridWrap.style.position = "relative";
    gridWrap.appendChild(el);
    setTimeout(() => { el.remove(); resolve(); }, 700);
  });
}

function skillFxSymbolId(skillId) {
  if (skillId === "shield_light_retaliate") return "light";
  if (skillId === "shield_burn") return "fire";
  if (skillId === "shield_power") return "nature";
  return null;
}

