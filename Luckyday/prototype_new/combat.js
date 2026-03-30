// ?먥븧??combat.js ??Combat core, Rendering, Log, Modal/Codex ?먥븧??

function applyPlayerHeal(player, amount) {
  if (!player || amount <= 0) return { healed: 0, shield: 0 };
  const healMult = player.equipPassive && Number.isFinite(player.equipPassive.healMult) ? player.equipPassive.healMult : 1.0;
  amount = Math.max(0, Math.floor(amount * healMult));
  const missing = Math.max(0, player.maxHp - player.hp);
  const healed = Math.min(missing, amount);
  if (healed > 0) player.hp += healed;
  let shield = 0;
  const extra = Math.max(0, amount - healed);
  if (extra > 0 && player.natureBuild && player.natureBuild.frugalHeal) {
    player.shield = (player.shield || 0) + extra;
    shield = extra;
    if (state && state.spinSeq !== state.frugalHealToastSeq) {
      state.frugalHealToastSeq = state.spinSeq;
      showFxToast({ title: t("combat.thriftyHeal"), subtitle: t("combat.thriftyHealSub", { val: extra }), symbolId: "nature" });
    }
  }
  const result = { healed, shield };
  if (typeof applyEquipmentAfterHeal === "function") {
    applyEquipmentAfterHeal(player, amount, result);
  }
  return result;
}

function enforceLowHpImmunity(player) {
  if (!player || !player.lowHpImmunity || !player.status) return;
  if (player.maxHp <= 0) return;
  if (player.hp / player.maxHp >= 0.2) return;
  const had =
    player.status.burnTurns > 0 ||
    player.status.burnStacks > 0 ||
    player.status.frozenTurns > 0 ||
    player.status.weakenTurns > 0 ||
    player.status.lockHTurns > 0 ||
    player.status.lockVTurns > 0 ||
    player.status.talismanSealTurns > 0 ||
    player.status.tileSealTurns > 0;
  player.status.burnTurns = 0;
  player.status.burnStacks = 0;
  player.status.burnByTurns = {};
  player.status.frozenTurns = 0;
  player.status.weakenTurns = 0;
  player.status.lockHTurns = 0;
  player.status.lockHRow = null;
  player.status.lockVTurns = 0;
  player.status.lockVCol = null;
  player.status.talismanSealTurns = 0;
  player.status.tileSealTurns = 0;
  if (had && state && state.lowHpImmunityTurn !== state.turn) {
    state.lowHpImmunityTurn = state.turn;
    showFxToast({ title: t("combat.ironWill"), subtitle: t("combat.ironWillSub"), symbolId: "water" });
    flashEl(ui.playerHpBar);
  }
}


function jackpotElementId(g) {
  const first = elementOfSymbolId(g[0][0]);
  if (!BASE_SYMBOLS.some((s) => s.id === first)) return null;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (elementOfSymbolId(g[r][c]) !== first) return null;
    }
  }
  return first;
}

function isJackpot(g) {
  return !!jackpotElementId(g);
}

function findStarCells(g) {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c] === "star") cells.push({ r, c });
    }
  }
  return cells;
}

function supportsElementSymbol(symbolId, elementId) {
  if (symbolId === "rainbow") return true; // 留뚮뒫 ?щ낵: 紐⑤뱺 ?띿꽦 留ㅼ튂
  if (symbolId === elementId) return true;
  if (VARIANT_BY_ID[symbolId] === elementId) return true;
  const h = HYBRID_BY_ID[symbolId];
  if (!h) return false;
  return h.a === elementId || h.b === elementId;
}

function isPureElementSymbol(symbolId, elementId) {
  if (symbolId === "rainbow") return true; // 留뚮뒫 ?щ낵: 紐⑤뱺 ?띿꽦???쒖닔 ?щ낵濡?痍④툒
  return symbolId === elementId || VARIANT_BY_ID[symbolId] === elementId;
}

function findMatches(g, frozenTiles) {
  const dirs = [
    { dr: 0, dc: 1, id: "H" },
    { dr: 1, dc: 0, id: "V" },
    { dr: 1, dc: 1, id: "D\\" },
    { dr: 1, dc: -1, id: "D/" },
  ];
  const matches = [];
  const specialSeen = new Set();

  // ?꾬툘 鍮숆껐??移몄? 泥댄겕 ??곸뿉???쒖쇅
  const frozenSet = new Set();
  if (frozenTiles && frozenTiles.length > 0) {
    for (const ft of frozenTiles) frozenSet.add(`${ft.r},${ft.c}`);
  }
  const stickySet = new Set();
  const stickyCells = state?.player?.status?.stickyCells;
  if (Array.isArray(stickyCells)) {
    for (const cell of stickyCells) {
      if (cell && Number.isFinite(cell.r) && Number.isFinite(cell.c) && (cell.turns || 0) > 0) {
        stickySet.add(`${cell.r},${cell.c}`);
      }
    }
  }
  const isFrozen = (r, c) => frozenSet.has(`${r},${c}`);
  const isBlocked = (r, c) => isFrozen(r, c) || stickySet.has(`${r},${c}`);

  // Element-centric scan so hybrid symbols can participate.
  for (const el of BASE_SYMBOLS) {
    const elementId = el.id;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isBlocked(r, c)) continue;
        if (!supportsElementSymbol(g[r][c], elementId)) continue;
        for (const d of dirs) {
          const pr = r - d.dr;
          const pc = c - d.dc;
          if (inBounds(pr, pc) && !isBlocked(pr, pc) && supportsElementSymbol(g[pr][pc], elementId)) continue; // not a start

          let rr = r;
          let cc = c;
          const cells = [];
          while (inBounds(rr, cc) && !isBlocked(rr, cc) && supportsElementSymbol(g[rr][cc], elementId)) {
            cells.push([rr, cc]);
            rr += d.dr;
            cc += d.dc;
          }

          if (cells.length >= 3) {
            matches.push({ symbolId: elementId, dir: d.id, len: cells.length, cells });
          }
        }
      }
    }
  }

  const specialPatterns = [];
  if (state && state.player) {
    if (state.player.bigTriangle) {
      specialPatterns.push({
        id: "TRI",
        patternId: "triangle",
        damageMult: 5.0,
        cells: [
          [0, 2],
          [1, 1], [1, 2], [1, 3],
          [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
        ],
      });
    }
    if (state.player.bigInvTriangle) {
      specialPatterns.push({
        id: "ITRI",
        patternId: "inv_triangle",
        damageMult: 5.0,
        cells: [
          [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
          [1, 1], [1, 2], [1, 3],
          [2, 2],
        ],
      });
    }
    if (state.player.crossPattern) {
      specialPatterns.push({
        id: "CROSS",
        patternId: "cross",
        damageMult: 4.0,
        cells: [
          [0, 2],
          [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
          [2, 2],
        ],
      });
    }
  }

  for (const pattern of specialPatterns) {
    const validCells = pattern.cells.filter(([r, c]) => inBounds(r, c) && !isFrozen(r, c));
    if (validCells.length !== pattern.cells.length) continue;
    for (const el of BASE_SYMBOLS) {
      const elementId = el.id;
      if (!validCells.every(([r, c]) => supportsElementSymbol(g[r][c], elementId))) continue;
      const key = `${pattern.id}|${elementId}`;
      if (specialSeen.has(key)) continue;
      specialSeen.add(key);
      matches.push({
        symbolId: elementId,
        dir: pattern.id,
        len: validCells.length,
        cells: validCells,
        specialPattern: pattern.patternId,
        damageMult: pattern.damageMult,
      });
    }
  }
  return matches;
}

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

function computeSpinDamage(player, matches, jackpot, jackpotElementIdValue = null) {
  // Each check adds damage: baseMatchDamage * elementMultiplier * lengthMultiplier
  let dmg = 0;
  let byElement = { fire: 0, light: 0, nature: 0, water: 0 };
  const attackDownMult = Math.max(0, 1 - Math.min(0.9, player.status?.attackDownRatio || 0));

  for (const m of matches) {
    const base = (player.baseMatchDamage + (player.tempMatchDamage || 0)) * attackDownMult;
    const sym = SYMBOL_BY_ID[m.symbolId];
    const elemMult = sym.mult + (player.elemBonus[m.symbolId] || 0);
    const baseLenMult = m.specialPattern ? (m.damageMult || 1.0) : (LENGTH_MULT[m.len] || 1.0);
    const extra = m.specialPattern ? 0 : (Math.max(0, m.len - 3) * player.lengthScaleBonus);
    const lenMult = baseLenMult + extra;
    const key = `${m.symbolId}|${m.dir}|${m.len}|${m.cells.map(([r, c]) => `${r},${c}`).join(";")}`;
    const luckyMult =
      state && state.luckyHoldActive && state.luckyHoldActive.patternKeys && state.luckyHoldActive.patternKeys.has(key)
        ? player.luckPatternDamageMult || 1.0
        : 1.0;
    const basePart = Math.max(0, Math.floor(base * elemMult * lenMult * luckyMult));
    const elemScale = player && player.elemBaseMult ? player.elemBaseMult[m.symbolId] || 1.0 : 1.0;
    // v2: ?⑦꽩 諛곗쑉 (H/V/D)
    let dirMult = 1.0;
    if (player && player.patternMult) {
      if (m.dir === "H") dirMult = player.patternMult.H || 1.0;
      else if (m.dir === "V") dirMult = player.patternMult.V || 1.0;
      else if (m.dir && m.dir.startsWith("D")) dirMult = player.patternMult.D || 1.0;
    }
    const part = Math.max(0, Math.floor(basePart * elemScale * dirMult));
    dmg += part;
    byElement[m.symbolId] += part;
  }

  let jackpotBonus = 0;
  if (jackpot) {
    const elementId = jackpotElementIdValue || "fire";
    const base = (player.baseMatchDamage + (player.tempMatchDamage || 0)) * attackDownMult;
    const sym = SYMBOL_BY_ID[elementId] || SYMBOL_BY_ID.fire;
    const elemMult = sym.mult + (player.elemBonus[elementId] || 0);
    jackpotBonus = Math.max(1, Math.floor(base * elemMult * JACKPOT_MULT));
    dmg += jackpotBonus;
  }

  return { dmg, byElement, jackpotBonus };
}

function applyEnemyDamage(enemy, rawDamage, byElement, opts = {}) {
  // Run passives, but keep some "element id" context by applying per-element chunks.
  let dealt = 0;
  let reflect = 0;
  const flags = [];
  const dealtByElement = {};

  const bypassShield = !!opts.bypassShield;
  const bypassShieldElements = new Set(opts.bypassShieldElements || []);

  const applyToEnemy = (amount, bypass = false) => {
    let dmg = amount;
    let absorbed = 0;
    if (!bypassShield && !bypass && enemy.shield && enemy.shield > 0) {
      absorbed = Math.min(enemy.shield, dmg);
      enemy.shield -= absorbed;
      dmg -= absorbed;
    }
    if (dmg > 0) enemy.hp = Math.max(0, enemy.hp - dmg);
    return { absorbed, hpDmg: dmg };
  };

  // Pet enemyTakeDmgDebuff: increase damage taken by enemy
  const petDebuffMult = (state.enemyTakeDmgDebuffTurns > 0 && state.enemyTakeDmgDebuff > 0)
    ? (1 + state.enemyTakeDmgDebuff) : 1.0;

  // v2: ?곌??(thorn) ?쇳빐 利앷?
  const thornMult = (state && state.player) ? thornDamageMult(enemy, state.player) : 1.0;

  for (const [elementId, chunk] of Object.entries(byElement)) {
    if (!chunk) continue;
    let ctx = { enemy, damage: chunk, elementId, flags: [] };
    for (const p of enemy.passives) {
      if (p.onTakeDamage) p.onTakeDamage(ctx);
    }
    const mult = enemy && Number.isFinite(enemy.damageTakenMult) ? enemy.damageTakenMult : 1.0;
    const final = Math.max(0, Math.floor(ctx.damage * mult * petDebuffMult * thornMult));
    const r = applyToEnemy(final, bypassShieldElements.has(elementId));
    dealt += r.hpDmg;
    dealtByElement[elementId] = (dealtByElement[elementId] || 0) + (r.hpDmg || 0);
    if (!bypassShield && !bypassShieldElements.has(elementId) && r.absorbed > 0) {
      flags.push(t("flag.shieldAbsorb", { value: r.absorbed }));
    }
    for (const f of ctx.flags) flags.push(f);
  }

  // Jackpot bonus (and any non-elemental damage) goes through without element tag.
  const remainder = Math.max(0, rawDamage - Object.values(byElement).reduce((a, b) => a + b, 0));
  if (remainder) {
    let ctx = { enemy, damage: remainder, elementId: null, flags: [] };
    for (const p of enemy.passives) {
      if (p.onTakeDamage) p.onTakeDamage(ctx);
    }
    const mult = enemy && Number.isFinite(enemy.damageTakenMult) ? enemy.damageTakenMult : 1.0;
    const final = Math.max(0, Math.floor(ctx.damage * mult * petDebuffMult * thornMult));
    const r = applyToEnemy(final, false);
    dealt += r.hpDmg;
    dealtByElement.neutral = (dealtByElement.neutral || 0) + (r.hpDmg || 0);
    if (!bypassShield && r.absorbed > 0) flags.push(t("flag.shieldAbsorb", { value: r.absorbed }));
    for (const f of ctx.flags) flags.push(f);
  }

  // After-damage passives.
  let afterCtx = { enemy, damageDealt: dealt, reflect: 0 };
  for (const p of enemy.passives) {
    if (p.onAfterTakeDamage) p.onAfterTakeDamage(afterCtx);
  }
  reflect += afterCtx.reflect || 0;

  if (dealt > 0) {
    addTurnDamage("enemy", dealt);
    if (!opts.suppressPopup) {
      showDmgPopup("enemy", dealt, "hit");
    }
  }
  return { dealt, reflect, flags, dealtByElement };
}

function enemyAttack(player, enemy) {
  let ctx = { enemy, damage: enemy.atk, flags: [], critChance: Math.max(0, enemy.critChance || 0) };
  const procs = [];
  const queuedAttackMults = Array.isArray(enemy._queuedAttackMults) ? enemy._queuedAttackMults : [];
  const queuedMult = queuedAttackMults.length ? Math.max(0, Number(queuedAttackMults.shift() || 1)) : 1;
  enemy._queuedAttackMults = queuedAttackMults;
  for (const p of enemy.passives) {
    if (!p.onAttack) continue;
    const beforeDmg = ctx.damage;
    const beforeFlags = ctx.flags.length;
    const beforeCrit = ctx.critChance;
    p.onAttack(ctx);
    if (ctx.damage !== beforeDmg || ctx.flags.length !== beforeFlags || ctx.critChance !== beforeCrit) procs.push(passiveName(p));
  }

  if (player && player.status && player.status.invulTurns > 0) {
    ctx.flags.push(t("flag.invul"));
    return { dmg: 0, flags: ctx.flags };
  }

  const evasion = player ? (player.evasionChance || 0) + (player.tempEvasionBonus || 0) : 0;
  if (player && evasion > 0 && Math.random() < Math.min(0.95, evasion)) {
    ctx.flags.push(t("flag.evade", null, t("combat.evade")));
    return { dmg: 0, flags: ctx.flags, passives: procs };
  }

  if (player && player.traits && player.traits.burnAttackDown > 0) {
    if (enemy.status && enemy.status.burnTurns > 0 && enemy.status.burnStacks > 0) {
      ctx.damage = Math.floor(ctx.damage * (1 - player.traits.burnAttackDown));
      ctx.flags.push(t("flag.burnWeaken"));
    }
  }

  // v3: ?댁??ъ? 鍮쀫굹媛??뺣쪧 泥댄겕
  const missChance = dizzyMissChance(enemy);
  if (missChance > 0 && Math.random() < missChance) {
    ctx.flags.push(`?댁??ъ? 鍮쀫굹媛?`);
    return { dmg: 0, flags: ctx.flags, passives: procs, dizzyMiss: true, crit: false };
  }

  // Pet debuffAtk: reduce enemy attack power
  if (state.petEnemyAtkDebuffTurns > 0 && state.petEnemyAtkDebuff > 0) {
    ctx.damage = Math.floor(ctx.damage * (1 - Math.min(0.9, state.petEnemyAtkDebuff)));
    ctx.flags.push(`怨듦꺽?β넃`);
  }

  // Pet playerDmgReduction: reduce damage taken by player
  if (state.playerDmgReductionTurns > 0 && state.playerDmgReduction > 0) {
    ctx.damage = Math.floor(ctx.damage * (1 - Math.min(0.9, state.playerDmgReduction)));
    ctx.flags.push("피해 감소");
  }

  // Pet passive permanent damage reduction (dmgReduceWhileActive)
  if (state.petPassiveState && state.petPassiveState.permanentDmgReduce > 0) {
    ctx.damage = Math.floor(ctx.damage * (1 - Math.min(0.9, state.petPassiveState.permanentDmgReduce)));
    ctx.flags.push("패시브 피해 감소");
  }

  const critChance = Math.min(0.95, Math.max(0, ctx.critChance || 0));
  const crit = Math.random() < critChance;
  enemy._lastAttackCrit = crit;
  let dmg = Math.max(1, Math.floor(ctx.damage * queuedMult));
  if (crit) {
    dmg = Math.max(1, Math.floor(dmg * 1.5));
    ctx.flags.push("치명타");
  }

  // Apply on-hit passives (debuffs).
  for (const p of enemy.passives) {
    if (!p.onHitPlayer) continue;
    const beforeFlags = ctx.flags.length;
    const prevStatus = player && player.status
      ? {
          burnTurns: player.status.burnTurns || 0,
          burnStacks: player.status.burnStacks || 0,
          frozenTurns: player.status.frozenTurns || 0,
          weakenTurns: player.status.weakenTurns || 0,
          lockHTurns: player.status.lockHTurns || 0,
          lockHRow: player.status.lockHRow,
          lockVTurns: player.status.lockVTurns || 0,
          lockVCol: player.status.lockVCol,
          talismanSealTurns: player.status.talismanSealTurns || 0,
          tileSealTurns: player.status.tileSealTurns || 0,
          bleedTurns: player.status.bleedTurns || 0,
          bleedStacks: player.status.bleedStacks || 0,
          bleedDmgPerStack: player.status.bleedDmgPerStack || 0,
          damageReductionShred: player.status.damageReductionShred || 0,
          damageReductionShredTurns: player.status.damageReductionShredTurns || 0,
          attackDownRatio: player.status.attackDownRatio || 0,
          attackDownTurns: player.status.attackDownTurns || 0,
          stickyCells: Array.isArray(player.status.stickyCells) ? player.status.stickyCells.map((it) => ({ ...it })) : [],
        }
      : null;
    p.onHitPlayer({ enemy, player, damage: dmg, flags: ctx.flags });
    if (
      prevStatus &&
      player &&
      player.status &&
      player.waterBuild &&
      player.waterBuild.statusImmuneWithShield &&
      player.shield > 0
    ) {
      player.status.burnTurns = prevStatus.burnTurns;
      player.status.burnStacks = prevStatus.burnStacks;
      player.status.frozenTurns = prevStatus.frozenTurns;
      player.status.weakenTurns = prevStatus.weakenTurns;
      player.status.lockHTurns = prevStatus.lockHTurns;
      player.status.lockHRow = prevStatus.lockHRow;
      player.status.lockVTurns = prevStatus.lockVTurns;
      player.status.lockVCol = prevStatus.lockVCol;
      player.status.talismanSealTurns = prevStatus.talismanSealTurns;
      player.status.tileSealTurns = prevStatus.tileSealTurns;
      player.status.bleedTurns = prevStatus.bleedTurns;
      player.status.bleedStacks = prevStatus.bleedStacks;
      player.status.bleedDmgPerStack = prevStatus.bleedDmgPerStack;
      player.status.damageReductionShred = prevStatus.damageReductionShred;
      player.status.damageReductionShredTurns = prevStatus.damageReductionShredTurns;
      player.status.attackDownRatio = prevStatus.attackDownRatio;
      player.status.attackDownTurns = prevStatus.attackDownTurns;
      player.status.stickyCells = prevStatus.stickyCells;
    }
    if (ctx.flags.length !== beforeFlags) procs.push(passiveName(p));
  }

  enforceLowHpImmunity(player);

  // Shield absorption.
  let final = dmg;

  // v2: 愿묒쟾??諛쏅뒗 ?쇳빐 利앷?
  if (player && player.comboEnhance && player.comboEnhance.berserkerTurns > 0) {
    const taken = player.comboEnhance.berserkerDmgTaken || 0.15;
    final = Math.max(1, Math.ceil(final * (1 + taken)));
    ctx.flags.push("광전사 피해 증가");
  }

  // v2: ?ㅽ궗 諛쏅뒗 ?쇳빐 媛먯냼 (damageReduction)
  if (player && player.damageReduction > 0) {
    const shred = player?.status?.damageReductionShred || 0;
    const effectiveReduction = Math.max(0, player.damageReduction - shred);
    final = Math.max(1, Math.floor(final * (1 - Math.min(0.9, effectiveReduction))));
  }

  // v2: 議곌굔遺 ?ㅽ꺈 ???몃궡 (HP 30%??諛쏇뵾媛먯냼)
  if (player && player.fortitudeReduce > 0 && player.hp / player.maxHp <= 0.3) {
    final = Math.max(1, Math.floor(final * (1 - player.fortitudeReduce)));
    ctx.flags.push("불굴");
  }

  // v2: 諛⑺뙣 移댁슫???쒖뒪??
  if (player && player.shieldCount > 0) {
    player.shieldCount -= 1;
    final = Math.max(1, Math.floor(final * (1 - player.shieldReducePct)));
    ctx.flags.push(`방패 (${player.shieldCount} 남음)`);

    // 諛⑺뙣 ?뚮㈇ ?④낵
    if (player.shieldElement && enemy && enemy.hp > 0) {
      if (player.shieldElement === "fire") {
        player.shieldBattleAtkBonus = (player.shieldBattleAtkBonus || 0) + 0.10;
        ctx.flags.push(`화염 방패: 공격력 +10%`);
      } else if (player.shieldElement === "light") {
        applyDizzy(enemy, player);
        ctx.flags.push(`번개 방패: 어지러움`);
      } else if (player.shieldElement === "nature") {
        applyThorn(enemy, player, 3);
        ctx.flags.push(`자연 방패: 따가움`);
      } else if (player.shieldElement === "water") {
        applyHypotherm(enemy, player, 3);
        ctx.flags.push(`얼음 방패: 저체온`);
      }
    }
  }

  // Shield core: direct damage reduction (does not apply to DoT).
  if (player && player.shieldCore && player.shieldCore.directDmgMult != null) {
    final = Math.max(1, Math.floor(final * (player.shieldCore.directDmgMult || 1.0)));
  }
  if (player && player.waterBuild && player.waterBuild.statusImmuneWithShield && player.shield > 0) {
    final = Math.max(1, Math.floor(final * 0.8));
  }
  if (player && player.magicShieldStacks > 0) {
    const stacks = Math.min(player.magicShieldStacks, player.magicShieldMax || 10);
    const mult = Math.pow(0.95, stacks);
    final = Math.max(1, Math.floor(final * mult));
  }
  if (player && player.knightShield) {
    final = Math.max(1, Math.floor(final * 0.7));
  }

  let absorbed = 0;
  if (player.shield && player.shield > 0) {
    absorbed = Math.min(player.shield, final);
    player.shield -= absorbed;
    final -= absorbed;
    if (absorbed > 0) ctx.flags.push(t("flag.shieldAbsorb", { value: absorbed }));
    if (absorbed > 0 && hasEquippedPetPassive("thorn_mangi") && enemy && enemy.hp > 0) {
      const rr = applyEnemyDamage(enemy, absorbed, { fire: 0, light: 0, nature: 0, water: 0 }, { bypassShield: true });
      if (rr.dealt > 0) {
        logEvt("good", `媛??留앹씠 諛섏궗 (${rr.dealt})`);
        flashEl(ui.enemyHpBar);
        pulseClass(ui.enemyPanel, "panel--hit", 190);
        pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
      }
    }
  }

  player.hp = Math.max(0, player.hp - final);
  if (final > 0) {
    state.playerHitThisRound = true; // 異붿뼲?μ떇 onHitAccum??
    state.playerHitCountThisRound = (state.playerHitCountThisRound || 0) + 1; // v34: ?쇨꺽 ?잛닔 移댁슫??
    addTurnDamage("player", final);
    showDmgPopup("player", final, "hit");
    if (typeof applyEquipmentOnPlayerDamaged === "function") {
      applyEquipmentOnPlayerDamaged(player, enemy, final);
    }

    // 媛?쒕갑?? ?쇨꺽 ???곸뿉寃?異쒗삁 遺??
    if (state.bleedOnHitDuration > 0 && enemy && enemy.hp > 0) {
      applyBleed(enemy, player, state.bleedOnHitStacks || 1, state.bleedOnHitBleedTurns || 3);
      logEvt("good", `피격 출혈 부여 ${state.bleedOnHitStacks || 1}중첩 ${state.bleedOnHitBleedTurns || 3}턴`);
    }
  }

  // Shield core: last stand (once per battle).
  if (player && player.shieldCore && player.shieldCore.lastStand && !player.shieldCore.lastStandUsed) {
    if (player.hp <= 0) {
      player.shieldCore.lastStandUsed = true;
      player.hp = 1;
      if (player.status) player.status.invulTurns = Math.max(player.status.invulTurns || 0, 2);
      ctx.flags.push(t("flag.invul"));
      logEvt("good", t("log.lastStand"));
      showFxToast({ title: t("combat.undying"), subtitle: t("combat.undyingSub"), symbolId: "fire" });
      flashEl(ui.playerHpBar);
    }
  }

  // v2: 遺덉궗 (immortal) ??移섎챸 ?쇨꺽 ??HP 1 ?앹〈
  if (player && player.immortal && !player.immortalUsed && player.hp <= 0) {
    player.immortalUsed = true;
    player.hp = 1;
    ctx.flags.push(`遺덉궗`);
    logEvt("good", `?? 遺덉궗 諛쒕룞! HP 1濡??앹〈`);
    // true_immortal: 3??臾댁쟻
    if (player.immortalShieldTurns > 0 && player.status) {
      player.status.invulTurns = Math.max(player.status.invulTurns || 0, player.immortalShieldTurns);
      logEvt("good", `?썳截?吏꾨텋?? ${player.immortalShieldTurns}??臾댁쟻`);
    }
    flashEl(ui.playerHpBar);
  }
  if (player && player.hp <= 0 && typeof tryEquipmentEmergencySave === "function") {
    if (tryEquipmentEmergencySave(player)) {
      ctx.flags.push(t("flag.invul"));
    }
  }
  enforceLowHpImmunity(player);
  if (typeof applyEquipmentLowHpRecovery === "function") {
    applyEquipmentLowHpRecovery(player);
  }
  if (final > 0) {
    flashEl(ui.playerHpBar);
    pulseClass(ui.playerPanel, "panel--hurt", 190);
    pulseClass(ui.journeyHero, "journey__hero--hurt", 190);
    applyHitShieldEffects(player, enemy);
  }
  if (player && player.magicShieldStacks > 0 && (final > 0 || absorbed > 0)) {
    player.magicShieldStacks = Math.max(0, player.magicShieldStacks - 1);
    logEvt("note", t("log.magicShieldBreak"));
  }
  return { dmg: final, flags: ctx.flags, passives: procs, crit };
}

function applyHitShieldEffects(player, enemy) {
  if (!player || !enemy || !player.shieldTraits) return;

  const procOnceMore = !!(player.shieldCore && player.shieldCore.extraProc && !player.shieldCore.extraProcUsedThisSpin);
  if (procOnceMore && player.shieldCore) player.shieldCore.extraProcUsedThisSpin = true;

  const lightStacks = player.shieldTraits.light || 0;
  if (lightStacks > 0) {
    const dmg = 24 * lightStacks;
    const res = applyEnemyDamage(enemy, dmg, { fire: 0, light: dmg, nature: 0, water: 0 });
    logEvt("good", t("log.shieldRetaliate", { value: res.dealt }));
    if (res.flags.length) logEvt("note", t("log.retaliateEffects", { value: res.flags.join(", ") }));
    tryStunFromLightning(player, enemy, t("label.shieldRetaliate"));
    drawEnemyLightningBolt();
    flashEl(ui.enemyHpBar);
    pulseClass(ui.enemyPanel, "panel--hit", 190);
    pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
  }

  const burnStacks = player.shieldTraits.burn || 0;
  if (burnStacks > 0 && enemy.status) {
    applyBurn(enemy, player, burnStacks * 2, 5);
    logEvt("note", t("log.shieldBurn", { value: burnStacks * 2, turns: 5 }));
  }

  const powerStacks = player.shieldTraits.power || 0;
  if (powerStacks > 0) {
    const add = 4 * powerStacks;
    player.nextSpinBonusDamage += add;
    logEvt("note", t("log.shieldPower", { value: add }));
  }

  if (player.reflectShield) {
    const applyReflect = (elementId, cfg) => {
      if (!cfg || !cfg.enabled || !cfg.ratio || cfg.ratio <= 0) return;
      const base = Math.max(1, Math.floor(player.baseMatchDamage * cfg.ratio));
      const payload = { fire: 0, light: 0, nature: 0, water: 0 };
      payload[elementId] = base;
      const res = applyEnemyDamage(enemy, base, payload);
      if (res.dealt > 0) logEvt("good", `${toLabel(elementId)} 諛⑺뙣 諛섏궗 (${res.dealt})`);

      if (cfg.status === "bleed" && enemy.status && Math.random() < (cfg.chanceStatus || 1)) {
        applyBleed(enemy, player, 1);
      }
      if (cfg.status === "burn" && enemy.status && Math.random() < (cfg.chanceStatus || 1)) {
        applyBurn(enemy, player, 1);
      }
      if (cfg.status === "freeze" && enemy.status && Math.random() < (cfg.chanceStatus || 0)) {
        addEnemyFreezeTurns(enemy, 1);
      }
      if (cfg.status === "stun" && enemy.status && Math.random() < (cfg.chanceStatus || 0)) {
        addEnemyStunTurns(enemy, 1);
      }
    };

    applyReflect("light", player.reflectShield.light);
    applyReflect("nature", player.reflectShield.nature);
    applyReflect("fire", player.reflectShield.fire);
    applyReflect("water", player.reflectShield.water);

    if (player.reflectShield.hp && player.reflectShield.hp.enabled) {
      const base = Math.max(1, Math.floor(player.hp * (player.reflectShield.hp.ratio || 0)));
      const res = applyEnemyDamage(enemy, base, { fire: 0, light: 0, nature: 0, water: base });
      if (res.dealt > 0) logEvt("good", `泥대젰 諛⑺뙣 諛섏궗 (${res.dealt})`);
      if (player.reflectShield.hp.healOnHitPct && player.reflectShield.hp.healOnHitPct > 0) {
        const heal = Math.max(1, Math.floor(player.maxHp * player.reflectShield.hp.healOnHitPct));
        applyPlayerHeal(player, heal);
      }
    }
  }

  if (procOnceMore) {
    // Re-run once (per spin) with extraProc disabled to avoid recursion.
    const prev = player.shieldCore.extraProc;
    player.shieldCore.extraProc = false;
    applyHitShieldEffects(player, enemy);
    player.shieldCore.extraProc = prev;
  }
}

function recalcShieldCorePlating(player) {
  if (!player || !player.shieldCore || !player.shieldTraits) return;
  const n =
    (player.shieldTraits.light ? 1 : 0) +
    (player.shieldTraits.burn ? 1 : 0) +
    (player.shieldTraits.power ? 1 : 0);
  player.shieldCore.directDmgMult = Math.pow(0.9, Math.max(0, n));
}

function applyBattleStartShield(player) {
  if (!player || !player.battleStartShield || !player.battleStartShield.enabled) return;
  const ratio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
  if (ratio > player.battleStartShield.threshold) return;
  const gain = Math.max(1, Math.floor(player.maxHp * player.battleStartShield.pct));
  player.shield = (player.shield || 0) + gain;
  logEvt("note", t("log.battleStartShield", { value: gain }));
}

function tryStunFromLightning(player, enemy, sourceLabel) {
  if (!player || !enemy || !enemy.status) return;
  const stun = player.traits && player.traits.stun ? player.traits.stun : null;
  if (!stun || stun.chance <= 0) return;
  if (Math.random() < stun.chance) {
    addEnemyStunTurns(enemy, stun.turns);
    logEvt("note", t("log.stunApplied", { source: sourceLabel, turns: stun.turns, total: enemy.status.stunnedTurns }));

    if (player.lightBuild && player.lightBuild.shockLock) {
      enemy.attackOffset = (enemy.attackOffset || 0) + 1;
      logEvt("note", t("log.shockLock", { value: 1 }));
    }
  }
}

function start(chapter = null) {
  const ch = chapter != null ? Number(chapter) : (state.chapter || META.selectedChapter || 1);
  state.chapter = Number.isFinite(ch) ? Math.max(1, Math.floor(ch)) : 1;

  state.player = newPlayer();
  {
    const growth = growthStatsForAccountLevel(META.accountLevel);
    state.player.maxHp = growth.maxHp;
    state.player.hp = growth.maxHp;
    state.player.baseMatchDamage = growth.baseDamage;
    state.chapterStartBaseMatchDamage = growth.baseDamage;
  }
  if (ui.playerName) ui.playerName.textContent = t("combat.playerName");
  state.stage = 1;
  state.turn = 1;
  if (typeof ensureEquipmentChapterState === "function") ensureEquipmentChapterState(state.chapter);
  state.spinSeq = 0;
  state.logEventSeq = 0;
  state.logPhase = null;
  state.grid = rollGrid(state.player);
  state.enemy = newEnemy(state.stage, state.chapter);
  showBossIntro(state.enemy);
  state.matchesAll = [];
  state.revealedMatchCount = 0;
  state.lastStepCells = new Set();
  state.lastJackpot = false;
  state.gridJustRolled = false;
  resetLogBoxes();
  state.turnDamage = null;
  ui.spinDamage.textContent = t("ui.spinDamage", { value: 0 });
  ui.spinChecks.textContent = "0";
  ui.jackpotText.textContent = t("ui.jackpotNo");
  logEvt("note", t("log.spinIntro"));
  state.player.elemBonus = {};
  state.nextCampfireStage = 2;
  state.nextGambleStage = 3;
  state.gambleUsed = false;
  state.nextStudyStage = 2;
  state.nextPriestStage = 3;
  state.knightEventUsed = false;
  state.studyEventCount = 0;
  resetPetBattleState(true);
  state.decoBattleState = initDecoBattleState();
  state.playerHitThisRound = false;
  state.playerHitCountThisRound = 0; // v34: ?쇨꺽 ?잛닔 移댁슫??
  state.playerHitCountLastRound = 0; // v34: 吏곸쟾 ?쇱슫???쇨꺽 ?잛닔
  sbRenderDecos();

  // Apply pet battle start passives after enemy is created and passive state is initialized
  applyPetBattleStartPassives(state.player);
  if (typeof applyEquipmentBattleStartPassives === "function") applyEquipmentBattleStartPassives(state.player);
  state.player.hp = state.player.maxHp;

  applyBattleStartShield(state.player);
  state.battleStartHp = state.player.hp;
  state.startingDraftRemaining = state.chapter >= 5 ? 2 : 1;
  setJourneyMode("meet");
  renderAll(true);
  if (state.chapter >= 5) {
    levelUpDraft().then(() => levelUpDraft());
  } else {
    levelUpDraft();
  }
}

function renderAll(fresh = false) {
  if (ui.chapter) ui.chapter.textContent = String(state.chapter);
  if (ui.stage) ui.stage.textContent = `${state.stage} / ${CHAPTER_SIZE}`;
  if (ui.gold) ui.gold.textContent = String(META.gold);
  if (!state.player) return;
  ui.level.textContent = String(state.player.level);
  ui.turn.textContent = t("ui.turn", { n: state.turn });
  ui.xp.textContent = `${state.player.xp} / ${state.player.xpToNext}`;

  // Update XP bar fill
  const xpBarFill = document.getElementById("xpBarFill");
  if (xpBarFill && state.player.xpToNext > 0) {
    xpBarFill.style.width = `${Math.max(0, Math.floor((state.player.xp / state.player.xpToNext) * 100))}%`;
  }

  // Update player ATK display
  const playerAtkDisplay = document.getElementById("playerAtkDisplay");
  if (playerAtkDisplay) {
    playerAtkDisplay.textContent = String(state.player.baseMatchDamage || 10);
  }

  ui.spinBtn.disabled = state.busy || isModalOpen() || isHelpOpen() || isCodexOpen() || isBattleOver();
  if (ui.previewBtn) ui.previewBtn.disabled = state.busy || isModalOpen() || isHelpOpen() || isCodexOpen();
  const renderPetSkillButton = (btn, slot) => {
    if (!btn) return;
    // ?? ??鍮꾪솢?깊솕 ??踰꾪듉 ?④? ??
    if (typeof PET_DISABLED !== "undefined" && PET_DISABLED) {
      btn.style.display = "none";
      return;
    }
    const pet = equippedPetDef(slot);
    const lv = equippedPetLevel(slot);
    const hasPet = !!(pet && lv >= 0);
    const cd = hasPet ? petCooldownTurnsById(pet.id) : 0;
    // Check if this is a mobile icon button (has m-btn__icon child)
    const iconSpan = btn.querySelector && btn.querySelector(".m-btn__icon");
    if (iconSpan) {
      // Mobile layout: show pet icon image or fallback emoji
      if (!hasPet) {
        btn.title = t("combat.petSkillTooltip");
        iconSpan.innerHTML = "?맽";
      } else {
        const iconSrc = pet.icon || "";
        const imgTag = iconSrc
          ? `<img src="${iconSrc}" alt="${escapeHtml(pet.name)}" class="m-btn__petImg" />`
          : escapeHtml(pet.name.charAt(0));
        if (cd > 0) {
          btn.title = `${pet.activeName}\n쿨다운 ${cd}턴`;
          iconSpan.innerHTML = `${imgTag}<span class="m-btn__cooldownOverlay" aria-hidden="true"><span class="m-btn__cooldownValue">${cd}</span></span>`;
        } else {
          btn.title = `${pet.activeName}`;
          iconSpan.innerHTML = imgTag;
        }
      }
    } else {
      if (!hasPet) {
        btn.textContent = slot === 0 ? t("combat.petSkillEmpty1") : t("combat.petSkillEmpty2");
        btn.title = t("combat.petSkillTooltip");
      } else if (cd > 0) {
        btn.textContent = `${pet.name} (${cd})`;
        btn.title = `액티브 ${pet.activeName}\n현재 쿨다운 ${cd}턴`;
      } else {
        btn.textContent = `${pet.name} 사용 가능`;
        btn.title = `액티브 ${pet.activeName}`;
      }
    }
    // Ready glow: 荑⑦???0 + ?꾪닾 以?+ ?ъ슜 媛???곹깭
    const isReady = hasPet && cd <= 0 && !!(state.player && state.enemy) && !isBattleOver();
    btn.classList.toggle("m-btn--petReady", isReady);
    // ?レ씠 ?덉쑝硫???긽 ?대┃ 媛??(?앹뾽 ?⑸룄), ???녾굅???꾪닾 ???앸굹硫?disabled
    btn.disabled = !hasPet || state.busy || isBattleOver();
  };
  renderPetSkillButton(ui.petSkillBtn, 0);
  renderPetSkillButton(ui.petSkillBtn2, 1);

  if (ui.petSkillInfo) {
    const pets = equippedPetDefs();
    if (!pets.length) {
      ui.petSkillInfo.textContent = t("combat.noPet");
    } else {
      const lines = pets.map((pet, idx) => {
        const cd = petCooldownTurnsById(pet.id);
        const cooldownText = cd > 0 ? t("combat.cooldown", { cd }) : t("combat.ready");
        return `${idx + 1}. ${pet.name} - ${pet.activeName} (${cooldownText})`;
      });
      ui.petSkillInfo.textContent = lines.join("\n");
    }
  }

  renderGrid(fresh);
  renderTalismans();
  renderBars();
  renderEvolutionHud();
  renderStats();
  renderSkills();
  renderBuffIndicators();
}

// ??? Buff Indicators (罹먮┃???꾩씠肄??꾨옒 ?쒖떆) ??????
function renderBuffIndicators() {
  if (!state.player || !state.enemy) {
    if (ui.heroBuffRow) ui.heroBuffRow.innerHTML = "";
    if (ui.enemyBuffRow) ui.enemyBuffRow.innerHTML = "";
    return;
  }

  // ?? Hero (?먮몢) Buffs ??
  const heroPills = [];
  if ((state.petAttackBuffTurns || 0) > 0) {
    heroPills.push({ cls: "atk", icon: "?뷂툘", label: t("combat.buffAtk"), turns: state.petAttackBuffTurns });
  }
  if ((state.petCritBuffTurns || 0) > 0) {
    heroPills.push({ cls: "crit", icon: "?뮙", label: t("combat.buffCrit"), turns: state.petCritBuffTurns });
  }
  if ((state.playerDmgReductionTurns || 0) > 0) {
    const turns = state.playerDmgReductionTurns >= 999 ? null : state.playerDmgReductionTurns;
    heroPills.push({ cls: "dmgReduce", icon: "?뵿", label: t("combat.buffDmgReduce"), turns });
  }
  if ((state.petRegenTurns || 0) > 0) {
    heroPills.push({ cls: "regen", icon: "?뮍", label: t("combat.buffRegen"), turns: state.petRegenTurns });
  }
  if ((state.bleedOnHitDuration || 0) > 0) {
    heroPills.push({ cls: "thornShield", icon: "?뙼", label: t("combat.buffThorn"), turns: state.bleedOnHitDuration });
  }
  // Slot manipulation buffs (?먮몢 履?
  if ((state.petRerollTurns || 0) > 0) {
    heroPills.push({ cls: "reroll", icon: "?봽", label: t("combat.buffReroll"), turns: state.petRerollTurns });
  }
  if ((state.petFixTurns || 0) > 0) {
    heroPills.push({ cls: "fix", icon: "?뱦", label: t("combat.buffFix"), turns: state.petFixTurns });
  }
  if ((state.petExtraRowCheckTurns || 0) > 0) {
    heroPills.push({ cls: "extraRow", icon: "+행", label: t("combat.buffExtraRow"), turns: state.petExtraRowCheckTurns });
  }
  if ((state.petComboAttackTurns || 0) > 0) {
    heroPills.push({ cls: "combo", icon: "콤보", label: t("combat.buffCombo"), turns: state.petComboAttackTurns });
  }

  if (ui.heroBuffRow) {
    ui.heroBuffRow.innerHTML = buildPillsHtml(heroPills);
  }

  // ?? Enemy Debuffs ??
  const enemyPills = [];
  if ((state.enemyTakeDmgDebuffTurns || 0) > 0) {
    enemyPills.push({ cls: "debuff", icon: "?뱵", label: t("combat.debuffDmgUp"), turns: state.enemyTakeDmgDebuffTurns });
  }
  if ((state.petEnemyAtkDebuffTurns || 0) > 0) {
    const turns = state.petEnemyAtkDebuffTurns >= 999 ? null : state.petEnemyAtkDebuffTurns;
    enemyPills.push({ cls: "debuff", icon: "?뱣", label: t("combat.debuffAtkDown"), turns });
  }

  if (ui.enemyBuffRow) {
    ui.enemyBuffRow.innerHTML = buildPillsHtml(enemyPills);
  }
}

function buildPillsHtml(pills) {
  return pills.map(p => {
    const turnsTxt = p.turns != null ? `<span class="buff-pill__turns">${p.turns}</span>` : "";
    return `<span class="buff-pill buff-pill--${p.cls}"><span class="buff-pill__icon">${p.icon}</span>${escapeHtml(p.label)}${turnsTxt}</span>`;
  }).join("");
}

function renderTalismans() {
  if (!ui.talismanLayer || !ui.gridWrap) return;
  ui.talismanLayer.innerHTML = "";
  if (!state.player) return;
  if (!ui.grid.children.length) return;

  const wrapRect = ui.gridWrap.getBoundingClientRect();
  const pad = 6;

  const cellRect = (r, c) => {
    const i = r * COLS + c;
    const el = ui.grid.children[i];
    if (!el) return null;
    return el.getBoundingClientRect();
  };

  const addBox = (left, top, width, height, tag, extraClass) => {
    const box = document.createElement("div");
    box.className = extraClass ? `talisman ${extraClass}` : "talisman";
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
    if (tag) {
      const t = document.createElement("div");
      t.className = "talisman__tag";
      t.textContent = tag;
      box.appendChild(t);
    }
    ui.talismanLayer.appendChild(box);
  };

  for (const r of state.player.rowTalismans) {
    const a = cellRect(r, 0);
    const b = cellRect(r, COLS - 1);
    if (!a || !b) continue;
    const left = a.left - wrapRect.left - pad;
    const top = a.top - wrapRect.top - pad;
    const width = b.right - a.left + pad * 2;
    const height = a.height + pad * 2;
    const bonus = (state.player.rowTalismanBonus && state.player.rowTalismanBonus.get(r)) || 1;
    const extra = state.player.checkTalismanExtra || 0;
    addBox(left, top, width, height, `x${1 + bonus + extra}`);
  }

  for (const c of state.player.colTalismans) {
    const a = cellRect(0, c);
    const b = cellRect(ROWS - 1, c);
    if (!a || !b) continue;
    const left = a.left - wrapRect.left - pad;
    const top = a.top - wrapRect.top - pad;
    const width = a.width + pad * 2;
    const height = b.bottom - a.top + pad * 2;
    const bonus = (state.player.colTalismanBonus && state.player.colTalismanBonus.get(c)) || 1;
    const extra = state.player.checkTalismanExtra || 0;
    addBox(left, top, width, height, `x${1 + bonus + extra}`);
  }

  for (const r of state.player.sortRowTalismans || []) {
    const a = cellRect(r, 0);
    const b = cellRect(r, COLS - 1);
    if (!a || !b) continue;
    const left = a.left - wrapRect.left - pad;
    const top = a.top - wrapRect.top - pad;
    const width = b.right - a.left + pad * 2;
    const height = a.height + pad * 2;
    addBox(left, top, width, height, t("tag.sort"), "talisman--sort");
  }

  if (state.player.lineEffectRow) {
    for (const [r, effectId] of state.player.lineEffectRow.entries()) {
      const a = cellRect(r, 0);
      const b = cellRect(r, COLS - 1);
      if (!a || !b) continue;
      const left = a.left - wrapRect.left - pad;
      const top = a.top - wrapRect.top - pad;
      const width = b.right - a.left + pad * 2;
      const height = a.height + pad * 2;
        addBox(left, top, width, height, `가로 ${tagForLineEffect(effectId)}`, talismanClassForLineEffect(effectId));
    }
  }

  if (state.player.lineEffectCol) {
    for (const [c, effectId] of state.player.lineEffectCol.entries()) {
      const a = cellRect(0, c);
      const b = cellRect(ROWS - 1, c);
      if (!a || !b) continue;
      const left = a.left - wrapRect.left - pad;
      const top = a.top - wrapRect.top - pad;
      const width = a.width + pad * 2;
      const height = b.bottom - a.top + pad * 2;
        addBox(left, top, width, height, `세로 ${tagForLineEffect(effectId)}`, talismanClassForLineEffect(effectId));
    }
  }

  if (state.player.status) {
    if (state.player.status.lockHTurns > 0 && Number.isInteger(state.player.status.lockHRow)) {
      const r = state.player.status.lockHRow;
      const a = cellRect(r, 0);
      const b = cellRect(r, COLS - 1);
      if (a && b) {
        const left = a.left - wrapRect.left - pad;
        const top = a.top - wrapRect.top - pad;
        const width = b.right - a.left + pad * 2;
        const height = a.height + pad * 2;
        addBox(left, top, width, height, t("tag.lockH"), "talisman--lock");
      }
    }

    if (state.player.status.lockVTurns > 0 && Number.isInteger(state.player.status.lockVCol)) {
      const c = state.player.status.lockVCol;
      const a = cellRect(0, c);
      const b = cellRect(ROWS - 1, c);
      if (a && b) {
        const left = a.left - wrapRect.left - pad;
        const top = a.top - wrapRect.top - pad;
        const width = a.width + pad * 2;
        const height = b.bottom - a.top + pad * 2;
        addBox(left, top, width, height, t("tag.lockV"), "talisman--lock");
      }
    }
  }
}

function renderGrid(fresh) {
  const matched = new Set();
  const previewOn = state.previewMode && !state.busy && !isModalOpen() && !isHelpOpen() && !isCodexOpen();
  const visible = previewOn ? state.matchesAll : state.matchesAll.slice(0, state.revealedMatchCount);
  for (const m of visible) {
    for (const [r, c] of m.cells) matched.add(`${r},${c}`);
  }
  const jackpot = state.lastJackpot;
  const stepActive = state.lastStepCells && state.lastStepCells.size > 0;
  const constellation = state.player && state.player.constellationEnabled ? findConstellation(state.grid) : null;
  const triangle = state.player && state.player.patternTriangleEnabled ? findTrianglePattern(state.grid, false) : null;
  const invertedTriangle = state.player && state.player.patternInvertedTriangleEnabled ? findTrianglePattern(state.grid, true) : null;
  const xPattern = state.player && state.player.patternXEnabled ? findXPattern(state.grid) : null;
  const constellationGuideKeys = state.player && state.player.constellationEnabled
    ? new Set(CONSTELLATION_CELLS.map(([r, c]) => `${r},${c}`))
    : new Set();
  const constellationKeys = new Set((constellation ? constellation.cells : []).map(([r, c]) => `${r},${c}`));
  const triangleKeys = new Set((triangle ? triangle.cells : []).map(([r, c]) => `${r},${c}`));
  const invertedKeys = new Set((invertedTriangle ? invertedTriangle.cells : []).map(([r, c]) => `${r},${c}`));
  const xKeys = new Set((xPattern ? xPattern.cells : []).map(([r, c]) => `${r},${c}`));
  const luckyHold = state.luckyHoldActive || state.luckyHoldPending;
  const luckyKeys = luckyHold && luckyHold.keys ? luckyHold.keys : null;
  const fixedKeys = state.singleConvertFixedKeys || new Set();

  // Lucky UI: no floating "LUCKY" badge; locked cells show their own label.
  if (ui.gridWrap) {
    if (luckyHold) ui.gridWrap.classList.add("gridWrap--luckyHold");
    else ui.gridWrap.classList.remove("gridWrap--luckyHold");
  }

  // previewOn: show full check coverage for the current board (educational / debugging).

  ui.grid.innerHTML = "";
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const key = `${r},${c}`;
      if (matched.has(`${r},${c}`)) cell.classList.add("cell--match");
      if (previewOn && matched.has(key)) cell.classList.add("cell--preview");
      if (stepActive && !state.lastStepCells.has(key)) cell.classList.add("cell--dim");
      if (luckyKeys && luckyKeys.has(key)) {
        cell.classList.add("cell--luckyHold");
        const lock = document.createElement("div");
        lock.className = "cellLockTag";
        lock.textContent = "???뵏";
        cell.appendChild(lock);
      }
      if (fixedKeys.has(key)) {
        cell.classList.add("cell--fixed");
        const lock = document.createElement("div");
        lock.className = "cellFixedTag";
        lock.textContent = "FIX";
        cell.appendChild(lock);
      }
      if (state.lastStepCells.has(key)) {
        cell.classList.add("cell--pulse");
        cell.classList.add("cell--blast");
        if (state.stepKind === "preview") cell.classList.add("cell--target");
        if (state.stepKind === "convert") {
          cell.classList.add("cell--convert");
          if (state.stepSymbolId) cell.classList.add(`cell--convert-${state.stepSymbolId}`);
        }
      }
      if (jackpot) cell.classList.add("cell--jackpot");
      if (!fresh && state.gridJustRolled) {
        cell.classList.add("cell--anim");
        cell.style.animationDelay = `${(idx % 5) * 14 + Math.floor(idx / 5) * 18}ms`;
      }

      const sym = SYMBOL_BY_ID[state.grid[r][c]];

      if (constellation && constellationKeys.has(key)) {
        cell.classList.add("cell--constellation");
        cell.style.setProperty("--constellation", elementColorVar(constellation.elementId));
        const bg = document.createElement("div");
        bg.className = "constellationBg";
        cell.appendChild(bg);
      }

      if (constellationGuideKeys.has(key)) {
        cell.classList.add("cell--constellationGuide");
        const guide = document.createElement("div");
        guide.className = "constellationGuideBg";
        cell.appendChild(guide);
      }

      if (triangle && triangleKeys.has(key)) {
        cell.classList.add("cell--pattern");
        cell.style.setProperty("--pattern", elementColorVar(triangle.elementId));
        const bg = document.createElement("div");
        bg.className = "patternBg";
        cell.appendChild(bg);
      }

      if (invertedTriangle && invertedKeys.has(key)) {
        cell.classList.add("cell--pattern");
        cell.style.setProperty("--pattern", elementColorVar(invertedTriangle.elementId));
        const bg = document.createElement("div");
        bg.className = "patternBg";
        cell.appendChild(bg);
      }

      if (xPattern && xKeys.has(key)) {
        cell.classList.add("cell--pattern");
        cell.style.setProperty("--pattern", elementColorVar(xPattern.elementId));
        const bg = document.createElement("div");
        bg.className = "patternBg";
        cell.appendChild(bg);
      }
      const sig = document.createElement("div");
      sig.className = `sigil sigil--${sym.id}`;
      if (VARIANT_BY_ID[sym.id]) sig.classList.add("sigil--variant");
      sig.title = symbolNameById(sym.id);

      // ?щ낵 ?꾩씠肄??대?吏 留ㅽ븨
      const SYMBOL_ICON_MAP = {
        fire: "icon_slot_symbol_301.png",
        light: "icon_slot_symbol_101.png",
        nature: "icon_slot_symbol_201.png",
        water: "icon_slot_symbol_401.png",
        fire_light: "icon_slot_symbol_half_101_301.png",
        fire_nature: "icon_slot_symbol_half_201_301.png",
        fire_water: "icon_slot_symbol_half_301_401.png",
        light_nature: "icon_slot_symbol_half_101_201.png",
        light_water: "icon_slot_symbol_half_101_401.png",
        nature_water: "icon_slot_symbol_half_201_401.png",
        rainbow: "icon_slot_symbol_10.png",
        // v2 ?뱀닔?щ낵 ?꾩슜 ?꾩씠肄?
        fire_ember: "icon_slot_symbol_special_301.png",
        fire_power: "icon_slot_symbol_special_302.png",
        light_bolt: "icon_slot_symbol_special_102.png",
        light_strike: "icon_slot_symbol_special_102.png",
        light_thunder: "icon_slot_symbol_special_101.png",
        light_thunder_sym: "icon_slot_symbol_special_101.png",
        nature_thorn_v: "icon_slot_symbol_special_201.png",
        nature_heal: "icon_slot_symbol_special_202.png",
        water_ice: "icon_slot_symbol_special_401.png",
        water_protect: "icon_slot_symbol_special_402.png",
      };
      // ?뱀닔 ?щ낵 ??湲곕낯 ?띿꽦 + ?대え吏 諭껋?
      const VARIANT_EMOJI = {
        fire_burn: "화상",
        fire_flame: "불꽃",
        fire_power: "파워",
        fire_ember: "불씨",
        fire_double_rune: "x2",
        fire_crit_rune: "치명",
        fire_row: "가로",
        fire_col: "세로",
        nature_thorn: "가시",
        nature_heal: "회복",
        nature_gale: "질풍",
        nature_double_rune: "x2",
        nature_crit_rune: "치명",
        nature_row: "가로",
        nature_col: "세로",
        light_thunder: "천둥",
        light_chain: "연쇄",
        light_strike: "낙뢰",
        light_shockwave: "충격",
        light_double_rune: "x2",
        light_crit_rune: "치명",
        light_row: "가로",
        light_col: "세로",
        water_slip: "물결",
        water_freeze: "빙결",
        water_ice_armor: "보호",
        water_double_rune: "x2",
        water_crit_rune: "치명",
        water_row: "가로",
        water_col: "세로",
      };

      const baseElement = VARIANT_BY_ID[sym.id] || sym.id;
      const iconFile = SYMBOL_ICON_MAP[sym.id] || SYMBOL_ICON_MAP[baseElement];

      if (iconFile) {
        const img = document.createElement("img");
        img.className = "sigil__img";
        img.src = `images/iconsymbol/${iconFile}`;
        img.alt = sym.label;
        sig.appendChild(img);
        // ?뱀닔 ?щ낵?대㈃ ?대え吏 諭껋? 異붽?
        const emoji = VARIANT_EMOJI[sym.id];
        if (emoji) {
          const badge = document.createElement("span");
          badge.className = "sigil__badge";
          badge.textContent = emoji;
          sig.appendChild(badge);
        }
      } else if (sym.id === "star") {
        sig.textContent = "★";
      } else {
        sig.textContent = sym.label;
      }
      cell.appendChild(sig);

      // ?뵦 遺덊깂 ??? 湲곗〈 ?щ낵 ?좎? + 遺덇퐙 ?댄럺???대?吏 ?ㅻ쾭?덉씠
      if (state.burntTiles && state.burntTiles.some(bt => bt.r === r && bt.c === c)) {
        cell.classList.add("cell--burnt");
        const burnImg = document.createElement("img");
        burnImg.src = "Images/IconSymbol/burn_overlay.png";
        burnImg.className = "cellOverlay cellOverlay--burn";
        burnImg.alt = "";
        cell.appendChild(burnImg);
      }

      // ?꾬툘 ?쇰┛ ??? ?먮낯 ?щ낵 ?좎? + 鍮숆껐 ?ㅻ쾭?덉씠
      if (state.frozenTiles && state.frozenTiles.some(ft => ft.r === r && ft.c === c)) {
        cell.classList.add("cell--frozen");
        const iceImg = document.createElement("img");
        iceImg.src = "Images/IconSymbol/frozen_symbol.png";
        iceImg.className = "cellOverlay cellOverlay--freeze";
        iceImg.alt = "";
        cell.appendChild(iceImg);
      }

      if (
        state.player &&
        state.player.status &&
        Array.isArray(state.player.status.stickyCells) &&
        state.player.status.stickyCells.some(sc => sc.r === r && sc.c === c && (sc.turns || 0) > 0)
      ) {
        cell.classList.add("cell--sticky");
        const stickyBadge = document.createElement("div");
        stickyBadge.className = "cellStickyBadge";
        stickyBadge.textContent = "!";
        cell.appendChild(stickyBadge);
      }

      if (state.player && state.player.tileTalismans && state.player.tileTalismans.has(`${r},${c}`)) {
        const rune = document.createElement("div");
        rune.className = "tileRune";
        rune.textContent = `x${state.player.tileTalismanMult}`;
        cell.appendChild(rune);
      }

      if (state.player && state.player.rowConvertMarks && state.player.rowConvertMarks.has(`${r},${c}`)) {
        const rune = document.createElement("div");
        rune.className = "rowConvertRune";
        rune.textContent = "—";
        cell.appendChild(rune);
      }

      if (state.player && state.player.colConvertMarks && state.player.colConvertMarks.has(`${r},${c}`)) {
        const rune = document.createElement("div");
        rune.className = "colConvertRune";
        rune.textContent = "|";
        cell.appendChild(rune);
      }

      ui.grid.appendChild(cell);
      idx++;
    }
  }


}

function renderBars() {
  const p = state.player;
  ui.playerHpText.textContent = `${p.hp} / ${p.maxHp}`;
  if (ui.playerBattleHpText) ui.playerBattleHpText.textContent = `${p.hp} / ${p.maxHp}`;
  ui.playerHpBar.style.width = `${Math.max(0, Math.floor((p.hp / p.maxHp) * 100))}%`;
  if (p.status && p.status.invulTurns > 0) ui.playerHpBar.classList.add("bar__fill--invul");
  else ui.playerHpBar.classList.remove("bar__fill--invul");

  const e = state.enemy;
  if (!e) {
    if (ui.enemyName) ui.enemyName.textContent = "";
    if (ui.enemyHpText) ui.enemyHpText.textContent = "";
    if (ui.enemyHpBar) ui.enemyHpBar.style.width = "0%";
    const enemyIconEl = document.getElementById("enemyIcon");
    if (enemyIconEl) {
      enemyIconEl.removeAttribute("src");
      enemyIconEl.alt = "적";
    }
    renderJourneyIndicators();
    return;
  }
  const eName = enemyName(e);
  const bossSuffix = e.isBoss ? ` (${t("ui.enemyBossSuffix")})` : "";
  ui.enemyName.textContent = `${eName}${bossSuffix}`;
  ui.enemyHpText.textContent = `${e.hp} / ${e.maxHp}`;
  ui.enemyHpBar.style.width = `${Math.max(0, Math.floor((e.hp / e.maxHp) * 100))}%`;

  if (ui.journeyEnemyName) ui.journeyEnemyName.textContent = `${eName}${bossSuffix}`;
  if (ui.journeyHeroName) ui.journeyHeroName.textContent = ui.playerName ? ui.playerName.textContent : t("combat.playerName");

  // Update enemy icon in battle scene
  const enemyIconEl = document.getElementById("enemyIcon");
  if (enemyIconEl) {
    const KIND_ICON_MAP = {
      2: 'images/ingame_battle_icon1.png',
      3: 'images/ingame_battle_icon2.png',
      4: 'images/ingame_battle_icon3.png',
    };
    const kindIcon = KIND_ICON_MAP[e.kind] || 'images/ingame_battle_icon1.png';
    enemyIconEl.src = e.icon || kindIcon;
    enemyIconEl.alt = eName || "적";
  }

  renderJourneyIndicators();
}

function renderEvolutionHud() {
  const hud = ui.evoHud;
  const spinModeLabel = ui.spinModeLabel;
  if (!hud || !state.player) return;

  const p = state.player;
  const ownsSkill = (skillId) => Array.isArray(p.skills) && p.skills.some((skill) => (skill && skill.id) === skillId);
  const evoDefs = [
    { element: "fire", key: "meteor", name: "메테오", chargeLabel: "파워", color: "#ff8c42", fxClass: "gridWrap--evoFire", btnClass: "m-btn--evoFire" },
    { element: "light", key: "chain_lightning", name: "연쇄 번개", chargeLabel: "낙뢰", color: "#f4d03f", fxClass: "gridWrap--evoLight", btnClass: "m-btn--evoLight" },
    { element: "nature", key: "storm", name: "폭풍", chargeLabel: "회복", color: "#5dd07a", fxClass: "gridWrap--evoNature", btnClass: "m-btn--evoNature" },
    { element: "water", key: "ice_spear", name: "얼음창", chargeLabel: "보호", color: "#59aaf8", fxClass: "gridWrap--evoWater", btnClass: "m-btn--evoWater" },
  ];
  const hybridDefs = [
    { counterKey: "light_nature", skillId: "lightning_gale", name: "번개 폭풍", chargeLabel: "번개-자연", color: "#8df26c", fxClass: "gridWrap--hybridLightNature" },
    { counterKey: "fire_light", skillId: "plasma", name: "플라즈마", chargeLabel: "화염-번개", color: "#ff9d48", fxClass: "gridWrap--hybridFireLight" },
    { counterKey: "light_water", skillId: "electrocute", name: "번개 비", chargeLabel: "물-번개", color: "#7bd4ff", fxClass: "gridWrap--hybridLightWater" },
    { counterKey: "fire_nature", skillId: "purifying_flame", name: "화염 폭풍", chargeLabel: "화염-자연", color: "#ff7e5f", fxClass: "gridWrap--hybridFireNature" },
    { counterKey: "nature_water", skillId: "tidal", name: "해일", chargeLabel: "물-자연", color: "#58d6c9", fxClass: "gridWrap--hybridNatureWater" },
    { counterKey: "fire_water", skillId: "steam_blast", name: "화염 비", chargeLabel: "화염-물", color: "#f97b6f", fxClass: "gridWrap--hybridFireWater" },
  ];

  const ownedEvos = evoDefs.filter((def) => ownsSkill(def.key));
  const ownedHybrids = hybridDefs.filter((def) => ownsSkill(def.skillId));

  const clearButtonFx = () => {
    if (!ui.spinBtn) return;
    ui.spinBtn.classList.remove("m-btn--evoReady", "m-btn--evoFire", "m-btn--evoLight", "m-btn--evoNature", "m-btn--evoWater");
  };

  const clearGridFx = () => {
    if (!ui.gridWrap) return;
    ui.gridWrap.classList.remove(
      "gridWrap--evoReady", "gridWrap--evoFire", "gridWrap--evoLight", "gridWrap--evoNature", "gridWrap--evoWater",
      "gridWrap--hybridReady", "gridWrap--hybridLightNature", "gridWrap--hybridFireLight", "gridWrap--hybridLightWater",
      "gridWrap--hybridFireNature", "gridWrap--hybridNatureWater", "gridWrap--hybridFireWater"
    );
  };

  if (!ownedEvos.length && !ownedHybrids.length) {
    hud.hidden = true;
    hud.innerHTML = "";
    if (spinModeLabel) spinModeLabel.textContent = "";
    clearButtonFx();
    clearGridFx();
    return;
  }

  let activeEvo = null;
  let activeHybrid = null;
  const cards = [];

  for (const def of ownedEvos) {
    const evo = p.elementEvolution ? p.elementEvolution[def.element] : null;
    const counter = state.turnEvolutionCounter ? (state.turnEvolutionCounter[def.element] || 0) : 0;
    const threshold = Math.max(1, evo && Number.isFinite(evo.threshold) ? evo.threshold : 10);
    const progress = Math.min(100, Math.floor((Math.min(counter, threshold) / threshold) * 100));
    const ready = !!(evo && evo.enabled && state.turnEvolutionTriggered && state.turnEvolutionTriggered[def.element]);
    if (!activeEvo && ready) activeEvo = def;
    cards.push(`
      <div class="evoHud__card ${ready ? "evoHud__card--ready" : ""}" style="--evo-color:${def.color}">
        <div class="evoHud__head">
          <span class="evoHud__name">${escapeHtml(def.name)}</span>
          <span class="evoHud__state">${ready ? "이번 턴 발동" : `${counter}/${threshold}`}</span>
        </div>
        <div class="evoHud__bar"><span class="evoHud__fill" style="width:${progress}%"></span></div>
        <div class="evoHud__meta">이번 턴 ${escapeHtml(def.chargeLabel)} 체크 ${counter} / ${threshold}</div>
      </div>
    `);
  }

  for (const def of ownedHybrids) {
    const counter = state.turnHybridCounter ? (state.turnHybridCounter[def.counterKey] || 0) : 0;
    const ready = !!(state.turnHybridTriggered && state.turnHybridTriggered[def.counterKey]);
    const progress = Math.min(100, Math.floor((Math.min(counter, 5) / 5) * 100));
    if (!activeHybrid && ready) activeHybrid = def;
    cards.push(`
      <div class="evoHud__card evoHud__card--hybrid ${ready ? "evoHud__card--ready" : ""}" style="--evo-color:${def.color}">
        <div class="evoHud__head">
          <span class="evoHud__name">${escapeHtml(def.name)}</span>
          <span class="evoHud__state">${ready ? "이번 턴 발동" : `${counter}/5`}</span>
        </div>
        <div class="evoHud__bar"><span class="evoHud__fill" style="width:${progress}%"></span></div>
        <div class="evoHud__meta">이번 턴 ${escapeHtml(def.chargeLabel)} 반반 심볼 체크 ${counter} / 5</div>
      </div>
    `);
  }

  hud.hidden = false;
  hud.innerHTML = cards.join("");

  clearButtonFx();
  if (activeEvo && ui.spinBtn) {
    ui.spinBtn.classList.add("m-btn--evoReady", activeEvo.btnClass);
  }

  clearGridFx();
  if (activeEvo && ui.gridWrap) {
    ui.gridWrap.classList.add("gridWrap--evoReady", activeEvo.fxClass);
  } else if (activeHybrid && ui.gridWrap) {
    ui.gridWrap.classList.add("gridWrap--hybridReady", activeHybrid.fxClass);
  }

  if (spinModeLabel) {
    if (activeEvo) spinModeLabel.textContent = `${activeEvo.name} 이번 턴 발동`;
    else if (activeHybrid) spinModeLabel.textContent = `${activeHybrid.name} 이번 턴 발동`;
    else if (ownedEvos.length) spinModeLabel.textContent = `${ownedEvos[0].name} 조건 진행 중`;
    else spinModeLabel.textContent = `${ownedHybrids[0].name} 조건 진행 중`;
  }
}

function renderStats() {
  const p = state.player;
  ui.playerStats.innerHTML = "";
  ui.playerStats.appendChild(pill(t("ui.baseDamage"), String(p.baseMatchDamage)));
  ui.playerStats.appendChild(pill(t("ui.spinHeal"), String(p.healPerSpin)));
  if (p.nextSpinBonusDamage > 0) ui.playerStats.appendChild(pill(t("ui.nextSpinBonus"), `+${p.nextSpinBonusDamage}`));
  if (p.lengthScaleBonus) {
    ui.playerStats.appendChild(pill(t("ui.lengthBonus"), t("ui.perTileBonus", { value: p.lengthScaleBonus.toFixed(2) })));
  }

  const bonuses = Object.entries(p.elemBonus)
    .filter(([, v]) => v)
    .map(([k, v]) => `${toLabel(k)} +${v.toFixed(2)}`);
  if (bonuses.length) ui.playerStats.appendChild(pill(t("ui.elementBonus"), bonuses.join(", ")));
  if (Number.isFinite(p.luck)) ui.playerStats.appendChild(pill(t("combat.luck"), String(p.luck)));
  if (p.skillNotes.length) ui.playerStats.appendChild(pill(t("ui.memo"), p.skillNotes.slice(-2).join(" | ")));
  {
    const pets = equippedPetDefs();
    for (const pet of pets) {
      const lv = petLevel(pet.id);
      const cd = petCooldownTurnsById(pet.id);
      const passiveOn = isPetPassiveActive(pet.id) ? t("combat.passiveOn") : t("combat.passiveOff");
      const v = `Lv.${lv} 쨌 ${cd > 0 ? t("combat.cooldown", { cd }) : t("combat.ready")} 쨌 ${passiveOn}`;
      ui.playerStats.appendChild(pill(`?? ${pet.name}`, v));
    }
  }

  if (ui.symbolOdds) {
    const weights = symbolWeights();
    const total = weights.reduce((a, b) => a + b.w, 0) || 1;
    const map = new Map(weights.map((w) => [w.id, w.w]));
    ui.symbolOdds.innerHTML = "";
    for (const base of BASE_SYMBOLS) {
      const w = map.get(base.id) || 0;
      const pct = Math.max(0, (w / total) * 100);
      const row = document.createElement("div");
      row.className = "odds__item";
      row.innerHTML = `<div class="odds__left"><span class="odds__dot" style="--dot:${elementColorVar(
        base.id
      )}"></span><span class="odds__label">${escapeHtml(toLabel(base.id))}</span></div><div class="odds__value">${pct.toFixed(
        1
      )}%</div>`;
      ui.symbolOdds.appendChild(row);
    }
  }

  if (ui.playerStatusRow) {
    ui.playerStatusRow.innerHTML = "";
    if (p.shield && p.shield > 0) {
      ui.playerStatusRow.appendChild(statusChip("shield", t("status.shield", { value: p.shield }), t("status.shieldDesc")));
    }
    if (p.shieldTraits) {
      if (p.shieldTraits.light > 0) {
        ui.playerStatusRow.appendChild(
          statusChip(
            "retaliate",
            t("status.retaliate", { value: p.shieldTraits.light }),
            t("status.retaliateDesc")
          )
        );
      }
      if (p.shieldTraits.burn > 0) {
        ui.playerStatusRow.appendChild(
          statusChip(
            "burn",
            t("status.shieldBurn", { value: p.shieldTraits.burn }),
            t("status.shieldBurnDesc")
          )
        );
      }
      if (p.shieldTraits.power > 0) {
        ui.playerStatusRow.appendChild(
          statusChip(
            "power",
            t("status.shieldPower", { value: p.shieldTraits.power }),
            t("status.shieldPowerDesc")
          )
        );
      }
    }
  if (p.status) {
    if (p.status.burnTurns > 0) {
      ui.playerStatusRow.appendChild(
        statusMiniIcon("burn", p.status.burnTurns, t("status.burnDesc", { turns: p.status.burnTurns }))
      );
    }
    if (p.status.frozenTurns > 0) {
      ui.playerStatusRow.appendChild(
        statusMiniIcon("freeze", p.status.frozenTurns, t("status.freezePlayerDesc"))
      );
    }
    if (p.status.weakenTurns > 0) {
      ui.playerStatusRow.appendChild(
        statusMiniIcon("weaken", p.status.weakenTurns, t("status.weakenDesc"))
      );
    }
    if (p.status.invulTurns > 0) {
      ui.playerStatusRow.appendChild(
        statusChip("shield", t("status.invul", { turns: p.status.invulTurns }), t("status.invulDesc"))
      );
    }

      if (p.status.lockHTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("lockH", p.status.lockHTurns, t("status.lockHDesc"))
        );
      }
      if (p.status.lockVTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("lockV", p.status.lockVTurns, t("status.lockVDesc"))
        );
      }
      if (p.status.talismanSealTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("seal", p.status.talismanSealTurns, t("status.sealDesc"))
        );
      }
      if (p.status.tileSealTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("tileSeal", p.status.tileSealTurns, t("status.tileSealDesc"))
        );
      }

      // v3 ?뚮젅?댁뼱 ?붾쾭??(紐ъ뒪?곌? 遺?ы븯???붿긽/鍮숆껐/湲곗젅) ??誘몃땲 ?꾩씠肄?
      if (p.status.playerBurnTiles && p.status.playerBurnTiles.length > 0) {
        const maxTurns = Math.max(...p.status.playerBurnTiles.map(bt => bt.turns));
        ui.playerStatusRow.appendChild(
          statusMiniIcon("burn", maxTurns, "화상: 불탄 심볼이 체크될 때 피해")
        );
      }
      if (p.status.bleedTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("bleed", p.status.bleedTurns, "출혈: 슬롯 스핀 시 피해")
        );
      }
      if (p.status.playerFrozenTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("freeze", p.status.playerFrozenTurns, "빙결: 랜덤한 칸 2개 봉인")
        );
      }
      if (p.status.playerStunTurns > 0) {
        ui.playerStatusRow.appendChild(
          statusMiniIcon("stun", p.status.playerStunTurns, "어지러움: 일정 확률로 스핀 무효화")
        );
      }
    }
  }

  if (p.elemBonus) {
    const entries = Object.entries(p.elemBonus).filter(([, v]) => v > 0);
    for (const [k, v] of entries) {
      ui.playerStatusRow.appendChild(
        statusChip("power", `${toLabel(k)} +${Math.round(v * 100)}%`, t("status.forgeDesc"))
      );
    }
  }

  const e = state.enemy;

  if (ui.enemyStatusRow) {
    ui.enemyStatusRow.innerHTML = "";
    if (e.shield && e.shield > 0) {
      ui.enemyStatusRow.appendChild(
        statusChip("shield", `보호막 ${e.shield}`, `남아 있는 보호막 ${e.shield}`)
      );
    }
    if (e.status) {
      if (e.status.burnTurns > 0 && !(e.status.burnInstances?.length > 0)) {
        ui.enemyStatusRow.appendChild(
          statusChip(
            "burn",
            `화상 ${Math.max(1, e.status.burnStacks || 1)}중첩`,
            `${e.status.burnTurns}턴 동안 화상 피해`
          )
        );
      }
      if (e.status.bleedTurns > 0) {
        ui.enemyStatusRow.appendChild(
          statusChip(
            "bleed",
            `출혈 ${Math.max(1, e.status.bleedStacks || 1)}중첩`,
            `${e.status.bleedTurns}턴 동안 출혈 피해`
          )
        );
      }
      if (e.armorBreakStacks && e.armorBreakStacks > 0) {
        ui.enemyStatusRow.appendChild(
          statusChip(
            "weaken",
            `방깎 ${e.armorBreakStacks * 5}%`,
            `피해 감면 ${e.armorBreakStacks * 5}% 감소`
          )
        );
      }
      if (e.status.shockTurns > 0) {
        ui.enemyStatusRow.appendChild(
          statusChip("stun", `감전 ${e.status.shockTurns}턴`, `${e.status.shockTurns}턴 동안 감전`)
        );
      }
      if (e.status.frozenTurns > 0 && state.player && state.player.waterBuild && state.player.waterBuild.frostbite) {
        ui.enemyStatusRow.appendChild(
          statusChip("freeze", "동상", "빙결 연계 효과가 적용 중")
        );
      }
      if (e.status.frozenTurns > 0) {
        ui.enemyStatusRow.appendChild(
          statusChip("freeze", `빙결 ${e.status.frozenTurns}턴`, `${e.status.frozenTurns}턴 동안 행동 제약`)
        );
      }
      if (e.status.stunnedTurns > 0) {
        ui.enemyStatusRow.appendChild(
          statusChip("stun", `기절 ${e.status.stunnedTurns}턴`, `${e.status.stunnedTurns}턴 동안 행동 불가`)
        );
      }
      if (e.status.burnInstances?.length > 0) {
        const count = e.status.burnInstances.length;
        const totalDmg = e.status.burnInstances.reduce((s, b) => s + b.dmg, 0);
        const maxTurn = Math.max(...e.status.burnInstances.map(b => b.turns));
        ui.enemyStatusRow.appendChild(
          statusChip("burn", `화상 ${count}중첩`, `${maxTurn}턴 동안 총 ${totalDmg} 화상 피해`)
        );
      }
      if (e.status.thornInstances?.length > 0) {
        const count = e.status.thornInstances.length;
        ui.enemyStatusRow.appendChild(
          statusChip("thorn", `따가움 ${count}중첩`, `받는 피해 ${count * 10}% 증가`)
        );
      }
      if (e.status.hypothermInstances?.length > 0) {
        const count = e.status.hypothermInstances.length;
        ui.enemyStatusRow.appendChild(
          statusChip("freeze", `저체온 ${count}/3`, "3중첩 시 빙결")
        );
      }
      if (e.status.dizzyInstances?.length > 0) {
        const count = e.status.dizzyInstances.length;
        ui.enemyStatusRow.appendChild(
          statusChip("stun", `어지러움 ${count}중첩`, `공격력 ${count * 10}% 감소`)
        );
      }
    }
  }

  // ???꾩씠肄??곹깭?댁긽 VFX ?대옒??
  const enemyEl = document.getElementById("journeyEnemy");
  if (enemyEl) {
    const fxClasses = ["enemy-fx-burn", "enemy-fx-freeze", "enemy-fx-thorn", "enemy-fx-dizzy", "enemy-fx-hypotherm"];
    if (e.status) {
      const hasBurn = (e.status.burnInstances?.length > 0) || (e.status.burnTurns > 0);
      const hasFreeze = (e.status.frozenTurns > 0);
      const hasThorn = (e.status.thornInstances?.length > 0);
      const hasDizzy = (e.status.dizzyInstances?.length > 0);
      const hasHypotherm = (e.status.hypothermInstances?.length > 0);
      enemyEl.classList.toggle("enemy-fx-burn", hasBurn);
      enemyEl.classList.toggle("enemy-fx-freeze", hasFreeze);
      enemyEl.classList.toggle("enemy-fx-thorn", hasThorn);
      enemyEl.classList.toggle("enemy-fx-dizzy", hasDizzy);
      enemyEl.classList.toggle("enemy-fx-hypotherm", hasHypotherm);
    } else {
      fxClasses.forEach(c => enemyEl.classList.remove(c));
    }
  }

  // ?뮟?뵦?꾬툘 ?ㅽ? 踰꾪듉 ?붾쾭???댄럺??
  const spinBtn = document.getElementById("spinBtn");
  if (spinBtn && state.player && state.player.status) {
    spinBtn.classList.toggle("spinBtn--burn",
      state.player.status.playerBurnTiles && state.player.status.playerBurnTiles.length > 0);
    spinBtn.classList.toggle("spinBtn--freeze",
      state.player.status.playerFrozenTurns > 0);
    spinBtn.classList.toggle("spinBtn--stun",
      state.player.status.playerStunTurns > 0);
  }

  ui.enemyStats.innerHTML = "";

  const mod = (state.turn + (e.attackOffset || 0)) % e.attackEvery;
  const turnsToAttack = (e.attackEvery - mod) % e.attackEvery; // 0 means "this turn"
  const nextAttackText = turnsToAttack === 0 ? t("ui.turnThis") : t("ui.turnsLater", { n: turnsToAttack });

  // Update mobile attack counter badge
  const atkCounter = document.getElementById("enemyAtkCounter");
  if (atkCounter) {
    atkCounter.textContent = String(turnsToAttack);
    atkCounter.title = turnsToAttack === 0 ? t("combat.attackNow") : t("combat.attackIn", { turns: turnsToAttack });
    if (turnsToAttack === 0) {
      atkCounter.classList.add("m-atk-counter--imminent");
    } else {
      atkCounter.classList.remove("m-atk-counter--imminent");
    }
  }

  ui.enemyStats.appendChild(statSectionLabel("몬스터 정보"));
  ui.enemyStats.appendChild(pill(t("ui.attack"), String(e.atk)));
  ui.enemyStats.appendChild(pill(t("ui.attackCycle"), t("ui.attackEvery", { n: e.attackEvery })));
  const nextAttackPill = pill(t("ui.nextAttack"), nextAttackText);
  if (turnsToAttack === 0) nextAttackPill.classList.add("pill--alert");
  ui.enemyStats.appendChild(nextAttackPill);
  if (e.passives && e.passives.length > 0) {
    ui.enemyStats.appendChild(statSectionLabel("몬스터 스킬"));
  }
  for (const pas of e.passives) {
    ui.enemyStats.appendChild(passivePill(pas));
  }
}

function renderSkills() {
  const p = state.player;
    ui.skills.innerHTML = "";
  if (!p.skills.length) {
    const empty = document.createElement("div");
    empty.className = "skill";
    empty.innerHTML = `<div class="skill__name">${escapeHtml(t("ui.skillNoneTitle"))}</div><div class="skill__desc">${escapeHtml(t("ui.skillNoneDesc"))}</div>`;
    ui.skills.appendChild(empty);
    return;
  }
  for (const s of p.skills) {
    const el = document.createElement("div");
      el.className = isMiniSkill(s) ? "skill skill--mini" : "skill";
      const gradeHtml = skillGradeBadge(s, "gradeBadge--skill");
      const shortDesc = skillShortDesc(s);
      const shortHtml = shortDesc ? `<div class="skill__short">${escapeHtml(shortDesc)}</div>` : "";
      const fullDesc = skillDesc(s);
      const fullHtml = fullDesc ? `<div class="skill__desc">${escapeHtml(fullDesc)}</div>` : "";
      el.innerHTML = `${gradeHtml}<div class="skill__name">${escapeHtml(skillName(s))}</div>${shortHtml}${fullHtml}`;
    ui.skills.appendChild(el);
  }
}

function pill(k, v) {
  const el = document.createElement("div");
  el.className = "pill";
  el.innerHTML = `<div class="pill__k">${escapeHtml(k)}</div><div class="pill__v">${escapeHtml(v)}</div>`;
  return el;
}

function passivePill(passive) {
  const k = passiveName(passive);
  const base = passive.ui ? passive.ui(state.enemy) : null;
  const desc = base || passiveDesc(passive);
  const counter = passiveCounter(passive);
  const v = counter ? `${desc} 쨌 ${counter}` : desc;

  const el = document.createElement("div");
  el.className = "pill pill--passive";
  el.innerHTML = `<div class="pill__left"><span class="pill__icon">${passiveIconSvg(passive.id)}</span><div class="pill__k">${escapeHtml(
    k
  )}</div></div><div class="pill__v">${escapeHtml(v)}</div>`;
  return el;
}

function statSectionLabel(text) {
  const el = document.createElement("div");
  el.className = "statsSectionLabel";
  el.textContent = text;
  return el;
}

function statusChip(kind, text, title) {
  const el = document.createElement("div");
  el.className = `statusChip statusChip--${kind}`;
  if (title) el.title = title;

  const icon = document.createElement("span");
  icon.className = "statusChip__icon";
  if (kind === "burn") icon.innerHTML = flameSvg();
  else if (kind === "bleed") icon.innerHTML = dropSvg();
  else if (kind === "freeze") icon.innerHTML = snowSvg();
  else if (kind === "stun") icon.innerHTML = boltSvg();
  else if (kind === "shield") icon.innerHTML = shieldSvg();
  else if (kind === "weaken") icon.innerHTML = downSvg();
  else if (kind === "seal") icon.innerHTML = lockSvg();
  else if (kind === "lockH") icon.innerHTML = lockSvg();
  else if (kind === "lockV") icon.innerHTML = lockSvg();
  else if (kind === "tileSeal") icon.innerHTML = lockSvg();
  else if (kind === "thorn") icon.innerHTML = leafSvg();
  else if (kind === "retaliate") icon.innerHTML = boltSvg();
  else if (kind === "power") icon.innerHTML = upSvg();
  else icon.innerHTML = dotSvg();
  el.appendChild(icon);

  const t = document.createElement("span");
  t.className = "statusChip__text";
  t.textContent = text;
  el.appendChild(t);

  return el;
}

function flameSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c1.7 3.2 1.2 5.8-.8 7.8C9.4 11.6 8 13 8 15.2 8 18.4 10.4 22 14.6 22c4 0 6.4-3 6.4-6.4 0-3.9-2.5-6.2-5-8.6.1 2.1-.7 3.8-2.4 5.2.2-2.3-.5-4.4-1.6-6.2Z" fill="currentColor"/></svg>`;
}

function snowSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 2h2v3.1l2.2-1.3 1 1.7L13.9 7l2.7 1.6-1 1.7L13 8.7V11h2.6l1.3-2.2 1.7 1-1.6 2.7 1.6 2.7-1.7 1-1.3-2.2H13v2.3l2.2-1.3 1 1.7-2.7 1.6 2.3 1.3-1 1.7L13 18.9V22h-2v-3.1l-2.2 1.3-1-1.7 2.7-1.6L8.2 16l1-1.7L11 15.3V13H8.4l-1.3 2.2-1.7-1 1.6-2.7-1.6-2.7 1.7-1L8.4 11H11V8.7L8.8 10 7.8 8.3 10.5 6.7 8.2 5.4l1-1.7L11 5.1V2Z" fill="currentColor"/></svg>`;
}

function shieldSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 20 6v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6l8-4Z" fill="currentColor" opacity="0.95"/></svg>`;
}

function downSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21 4.5 13.5l1.8-1.8L11 16.4V3h2v13.4l4.7-4.7 1.8 1.8L12 21Z" fill="currentColor"/></svg>`;
}

function upSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3 19.5 10.5l-1.8 1.8L13 7.6V21h-2V7.6L6.3 12.3l-1.8-1.8L12 3Z" fill="currentColor"/></svg>`;
}

function dotSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>`;
}

function dropSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C9.3 6.1 6 9.3 6 13.2 6 17 8.9 21 12 21s6-4 6-7.8C18 9.3 14.7 6.1 12 2Z" fill="currentColor"/></svg>`;
}

function leafSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.6 4.4C14.4 4.4 8.5 6.3 5.5 11c-1.6 2.6-2 5.7-.9 8.6 2.9-1 5.1-3.2 6.4-5.9 1.2-2.4 2.9-3.9 5.2-4.9-2.3 2.1-3.6 4-4.3 6-1 2.8-1 5.2-.9 7.2h2c-.1-1.5-.1-3.2.5-5.2 1.1.8 2.4 1.2 3.9 1.2 4 0 6.6-3.1 6.6-7.1 0-3.6-2.1-6.5-4.4-6.5Z" fill="currentColor"/></svg>`;
}

function boltSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor"/></svg>`;
}

function lockSvg() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 1 0-6 0v2Z" fill="currentColor"/></svg>`;
}

function statusMiniIcon(kind, count, tooltip) {
  const el = document.createElement("div");
  el.className = `statusMini statusMini--${kind}`;
  if (tooltip) el.title = tooltip;

  const icon = document.createElement("span");
  icon.className = "statusMini__icon";
  if (kind === "burn") icon.innerHTML = flameSvg();
  else if (kind === "bleed") icon.innerHTML = dropSvg();
  else if (kind === "freeze") icon.innerHTML = snowSvg();
  else if (kind === "stun") icon.innerHTML = boltSvg();
  else if (kind === "shield") icon.innerHTML = shieldSvg();
  else if (kind === "weaken") icon.innerHTML = downSvg();
  else if (kind === "thorn") icon.innerHTML = leafSvg();
  else if (kind === "hypotherm") icon.innerHTML = snowSvg();
  else if (kind === "lock" || kind === "lockH" || kind === "lockV") icon.innerHTML = lockSvg();
  else if (kind === "seal" || kind === "tileSeal") icon.innerHTML = lockSvg();
  else icon.innerHTML = dotSvg();
  el.appendChild(icon);

  if (count !== undefined && count !== null) {
    const badge = document.createElement("span");
    badge.className = "statusMini__badge";
    badge.textContent = String(count);
    el.appendChild(badge);
  }

  return el;
}

const LOG_BOX_MAX = Infinity;
const LOG_BOX_DURATION = 0;
const LOG_BOX_EXIT = 0;
const logBoxTimers = new Map();
const logBoxByKey = new Map();

function resetLogBoxes() {
  for (const timers of logBoxTimers.values()) {
    if (timers && timers.exit) clearTimeout(timers.exit);
    if (timers && timers.remove) clearTimeout(timers.remove);
  }
  logBoxTimers.clear();
  logBoxByKey.clear();
  if (ui.log) ui.log.innerHTML = "";
}

function logBoxDurationForCount() {
  return LOG_BOX_DURATION;
}

function removeLogBox(el) {
  if (!el) return;
  const key = el.dataset ? el.dataset.logKey : null;
  if (key) logBoxByKey.delete(key);
  const timers = logBoxTimers.get(el);
  if (timers) {
    if (timers.exit) clearTimeout(timers.exit);
    if (timers.remove) clearTimeout(timers.remove);
    logBoxTimers.delete(el);
  }
  if (el.parentElement) el.parentElement.removeChild(el);
}

function scheduleLogBox(el, duration) {
  if (!duration || duration <= 0) return;
  const prev = logBoxTimers.get(el);
  if (prev) {
    if (prev.exit) clearTimeout(prev.exit);
    if (prev.remove) clearTimeout(prev.remove);
  }
  el.classList.remove("logBox--exit");
  const exitDelay = Math.max(0, duration - LOG_BOX_EXIT);
  const exit = setTimeout(() => {
    if (el.isConnected) el.classList.add("logBox--exit");
  }, exitDelay);
  const remove = setTimeout(() => {
    removeLogBox(el);
  }, duration);
  logBoxTimers.set(el, { exit, remove });
}

function pushLogBox({ text, kind = "note", side = null, key = null }) {
  if (!ui.log) return null;
  const resolvedSide = side || (kind === "bad" ? "enemy" : kind === "good" ? "ally" : "note");
  let el = key ? logBoxByKey.get(key) : null;
  const duration = logBoxDurationForCount();

  if (!el) {
    while (ui.log.childElementCount >= LOG_BOX_MAX) removeLogBox(ui.log.firstElementChild);
    el = document.createElement("div");
    el.className = "logBox";
    if (key) {
      el.dataset.logKey = key;
      logBoxByKey.set(key, el);
    }
    ui.log.prepend(el);
  }

  el.classList.remove("logBox--ally", "logBox--enemy", "logBox--note");
  el.classList.add(`logBox--${resolvedSide}`);
  el.textContent = text;
  if (el.parentElement === ui.log) ui.log.prepend(el);
  scheduleLogBox(el, duration);
  return el;
}

function damageText(value) {
  const v = Math.max(0, Math.floor(value || 0));
  const lang = (state && state.lang) || "ko";
  if (lang === "en") return `${v} damage!`;
  if (lang === "zh") return `${v} 伤害!`;
  return `${v} 데미지!`;
}

function addTurnDamage(side, amount) {
  if (!state) return;
  if (!Number.isFinite(amount) || amount <= 0) return;
  const turn = Number.isFinite(state.turn) ? state.turn : 0;
  if (!state.turnDamage || state.turnDamage.turn !== turn) {
    state.turnDamage = { turn, enemy: 0, player: 0 };
  }
  if (side !== "enemy" && side !== "player") return;
  state.turnDamage[side] = (state.turnDamage[side] || 0) + Math.floor(amount);
  const total = state.turnDamage[side];
  const logSide = side === "enemy" ? "ally" : "enemy";
  const kind = side === "enemy" ? "good" : "bad";
  pushLogBox({ text: damageText(total), kind, side: logSide, key: `damage:${turn}:${side}` });
}

function logEvt(kind, text) {
  if (kind === "note") return;
  let prefix = "";
  if (typeof state !== "undefined" && state && state.started) {
    const t = Number.isFinite(state.turn) ? state.turn : null;
    const s = Number.isFinite(state.spinSeq) ? state.spinSeq : null;
    const phase = state.logPhase ? String(state.logPhase) : null;
    let seq = null;
    if (state.busy) {
      state.logEventSeq = Number.isFinite(state.logEventSeq) ? state.logEventSeq + 1 : 1;
      seq = state.logEventSeq;
    }
    const parts = [];
    if (t != null) parts.push(`T${t}`);
    if (s != null) parts.push(`S${s}`);
    if (seq != null) parts.push(`E${seq}`);
    if (phase) parts.push(phase);
    if (parts.length) prefix = `[${parts.join(" ")}] `;
  }

  pushLogBox({ text: `${prefix}${text}`, kind });
}


function isBattleOver() {
  if (!state.player) return true;
  if (!state.enemy) return true;
  return state.player.hp <= 0 || state.enemy.hp <= 0;
}

function isModalOpen() {
  return ui.modal.classList.contains("modal--open");
}

function isHelpOpen() {
  return ui.helpModal && ui.helpModal.classList.contains("modal--open");
}

function openHelp() {
  if (!ui.helpModal) return;
  if (isModalOpen()) return;

  if (ui.helpKicker) ui.helpKicker.textContent = t("ui.runInfoKicker", { chapter: state.chapter || 1, stage: state.stage || 1 });
  if (ui.helpTitle) ui.helpTitle.textContent = t("ui.runInfoTitle");
  if (ui.helpMessage) ui.helpMessage.textContent = "";
  if (ui.helpHint) ui.helpHint.textContent = "";

  if (ui.helpSteps) {
    ui.helpSteps.innerHTML = "";

    // ?? Section 1: Symbol probabilities ??
    const secOdds = document.createElement("li");
    secOdds.className = "runInfo__section";
    let oddsHtml = `<div class="runInfo__heading">${escapeHtml(t("ui.runInfoOdds"))}</div><div class="runInfo__odds">`;
    const weights = symbolWeights();
    const total = weights.reduce((a, b) => a + b.w, 0) || 1;
    const map = new Map(weights.map((w) => [w.id, w.w]));
    for (const base of BASE_SYMBOLS) {
      const w = map.get(base.id) || 0;
      const pct = Math.max(0, (w / total) * 100);
      const color = elementColorVar(base.id);
      oddsHtml += `<div class="runInfo__oddsRow">` +
        `<span class="runInfo__dot" style="background:${color}"></span>` +
        `<span class="runInfo__elemName">${escapeHtml(toLabel(base.id))}</span>` +
        `<span class="runInfo__bar"><span class="runInfo__barFill" style="width:${pct}%;background:${color}"></span></span>` +
        `<span class="runInfo__pct">${pct.toFixed(1)}%</span>` +
        `</div>`;
    }
    oddsHtml += `</div>`;
    secOdds.innerHTML = oddsHtml;
    ui.helpSteps.appendChild(secOdds);

    // ?? Section 2: Acquired skills ??
    const secSkills = document.createElement("li");
    secSkills.className = "runInfo__section";
    const skills = (state.player && state.player.skills) || [];
    let skillsHtml = `<div class="runInfo__heading">${escapeHtml(t("ui.runInfoSkills", { count: skills.length }))}</div>`;
    if (skills.length === 0) {
      skillsHtml += `<div class="runInfo__empty">${escapeHtml(t("ui.runInfoNoSkill"))}</div>`;
    } else {
      // Count duplicates
      const countMap = new Map();
      const orderMap = new Map();
      for (const s of skills) {
        const id = s.id;
        countMap.set(id, (countMap.get(id) || 0) + 1);
        if (!orderMap.has(id)) orderMap.set(id, s);
      }
      skillsHtml += `<div class="runInfo__skillList">`;
      for (const [id, skill] of orderMap) {
        const count = countMap.get(id) || 1;
        const name = skillName(skill);
        const desc = skillShortDesc(skill) || skillDesc(skill);
        const countBadge = count > 1 ? `<span class="runInfo__skillCount">횞${count}</span>` : "";
        skillsHtml += `<div class="runInfo__skillItem">` +
          `<div class="runInfo__skillName">${escapeHtml(name)}${countBadge}</div>` +
          (desc ? `<div class="runInfo__skillDesc">${escapeHtml(desc)}</div>` : "") +
          `</div>`;
      }
      skillsHtml += `</div>`;
    }
    secSkills.innerHTML = skillsHtml;
    ui.helpSteps.appendChild(secSkills);

    // ?? Section 3: Quit button ??
    const secQuit = document.createElement("li");
    secQuit.className = "runInfo__section";
    const quitBtn = document.createElement("button");
    quitBtn.className = "runInfo__quit";
    quitBtn.type = "button";
    quitBtn.textContent = t("ui.runInfoQuit");
    quitBtn.addEventListener("click", () => {
      closeHelp();
      onDefeat();
    });
    secQuit.appendChild(quitBtn);
    ui.helpSteps.appendChild(secQuit);
  }

  ui.helpModal.classList.add("modal--open");
  ui.helpModal.setAttribute("aria-hidden", "false");
}

function closeHelp() {
  if (!ui.helpModal) return;
  ui.helpModal.classList.remove("modal--open");
  ui.helpModal.setAttribute("aria-hidden", "true");
}

function isCodexOpen() {
  return ui.codexModal && ui.codexModal.classList.contains("modal--open");
}

function codexTabLabel(key) {
  if (key === "light") return t("elemName.light");
  if (key === "nature") return t("elemName.nature");
  if (key === "fire") return t("elemName.fire");
  if (key === "water") return t("elemName.water");
  if (key === "fusion") return t("elemName.fusion");
  if (key === "luck") return t("elemName.luck");
  return t("elemName.common");
}

function codexCategoryForSkill(skill) {
  const elementIds = ["light", "nature", "fire", "water"];
  const tags = skillTags(skill);
  if (tags.includes("luck")) return "luck";
  const elemTags = tags.filter((t) => elementIds.includes(t));
  if (elemTags.length >= 2) return "fusion";
  if (elemTags.length === 1) return elemTags[0];

  // Fallback: try to infer from localized text.
  const text = `${skillName(skill)} ${skillShortDesc(skill)} ${skillDesc(skill)}`;
  const hits = new Set();
  if (text.includes("번개")) hits.add("light");
  if (text.includes("자연")) hits.add("nature");
  if (text.includes("화염") || text.includes("불")) hits.add("fire");
  if (text.includes("물")) hits.add("water");
  if (hits.size >= 2) return "fusion";
  if (hits.size === 1) return Array.from(hits)[0];
  return "common";
}

function renderCodexList(listEl, skills) {
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!skills || skills.length === 0) {
    const empty = document.createElement("div");
    empty.className = "skill";
    empty.innerHTML = `<div class="skill__name">${escapeHtml(t("ui.skillNoneTitle"))}</div><div class="skill__desc">-</div>`;
    listEl.appendChild(empty);
    return;
  }

  for (const s of skills) {
    const el = document.createElement("div");
    el.className = isMiniSkill(s) ? "skill skill--mini" : "skill";
    const shortDesc = skillShortDesc(s);
    const shortHtml = shortDesc ? `<div class="skill__short">${escapeHtml(shortDesc)}</div>` : "";
    const fullDesc = skillDesc(s);
    const fullHtml = fullDesc ? `<div class="skill__desc">${escapeHtml(fullDesc)}</div>` : "";
    el.innerHTML = `<div class="skill__name">${escapeHtml(skillName(s))}</div>${shortHtml}${fullHtml}`;
    listEl.appendChild(el);
  }
}

function renderCodex() {
  if (!ui.codexKicker || !ui.codexTitle) return;
  ui.codexKicker.textContent = t("combat.codexTitle");
  ui.codexTitle.textContent = t("combat.codexTitle");

  const buckets = {
    light: [],
    nature: [],
    fire: [],
    water: [],
    fusion: [],
    luck: [],
    common: [],
  };

  const all = typeof SKILLS !== "undefined" && Array.isArray(SKILLS) ? SKILLS : [];
  for (const s of all) {
    const k = codexCategoryForSkill(s);
    (buckets[k] || buckets.common).push(s);
  }

  renderCodexList(ui.codexListLight, buckets.light);
  renderCodexList(ui.codexListNature, buckets.nature);
  renderCodexList(ui.codexListFire, buckets.fire);
  renderCodexList(ui.codexListWater, buckets.water);
  renderCodexList(ui.codexListFusion, buckets.fusion);
  renderCodexList(ui.codexListLuck, buckets.luck);
  renderCodexList(ui.codexListCommon, buckets.common);
}

function setCodexTab(key) {
  if (!ui.codexTabs || !ui.codexModal) return;
  const k = key || "light";
  const tabs = Array.from(ui.codexTabs.querySelectorAll(".codex__tab"));
  const panels = Array.from(ui.codexModal.querySelectorAll(".codex__panel"));

  for (const tEl of tabs) {
    const isActive = tEl.dataset && tEl.dataset.tab === k;
    tEl.classList.toggle("is-active", isActive);
    tEl.setAttribute("aria-selected", isActive ? "true" : "false");
    tEl.tabIndex = isActive ? 0 : -1;
  }

  for (const pEl of panels) {
    const isActive = pEl.dataset && pEl.dataset.panel === k;
    if (isActive) pEl.removeAttribute("hidden");
    else pEl.setAttribute("hidden", "");
  }

  state.codexTab = k;
}

function openCodex() {
  if (!ui.codexModal) return;
  if (isModalOpen()) return;
  if (isHelpOpen()) return;

  renderCodex();
  ui.codexModal.classList.add("modal--open");
  ui.codexModal.setAttribute("aria-hidden", "false");

  const initial = state.codexTab || "light";
  setCodexTab(initial);

  const active = ui.codexTabs ? ui.codexTabs.querySelector(`.codex__tab[data-tab="${state.codexTab}"]`) : null;
  if (active) active.focus();
}

function closeCodex() {
  if (!ui.codexModal) return;
  ui.codexModal.classList.remove("modal--open");
  ui.codexModal.setAttribute("aria-hidden", "true");
  if (ui.codexBtnWide) ui.codexBtnWide.focus();
}

function isPetDrawOpen() {
  return isGachaPopupOpen();
}

function closePetDrawModal() {
  closeGachaPopup();
}

// ?섏쐞 ?명솚 ??湲곗〈 肄붾뱶媛 openPetDrawModal ?몄텧?섎㈃ ???앹뾽?쇰줈 ?꾨떖
function openPetDrawModal(results, titleText) {
  openGachaPopup("pet", results, titleText);
}

// ?먥븧???듯빀 戮묎린 寃곌낵 ?앹뾽 ?먥븧??

function isGachaPopupOpen() {
  const m = document.getElementById("gachaModal");
  return m && m.classList.contains("modal--open");
}

function closeGachaPopup() {
  const m = document.getElementById("gachaModal");
  if (!m) return;
  m.classList.remove("modal--open");
  m.setAttribute("aria-hidden", "true");
}

/**
 * ?듯빀 戮묎린 寃곌낵 ?앹뾽
 * @param {"pet"|"deco"} type - ??or ?μ떇
 * @param {Array} results - petDrawOnce/decoDrawOnce 寃곌낵 諛곗뿴
 * @param {string} [title] - ??댄? ?띿뒪??
 */
function openGachaPopup(type, results, title) {
  const modal = document.getElementById("gachaModal");
  const grid = document.getElementById("gachaPopupGrid");
  const titleEl = document.getElementById("gachaPopupTitle");
  if (!modal || !grid) return;

  // ??댄?
  if (titleEl) {
    if (title) {
      titleEl.textContent = title;
    } else {
      const typeLabel = t(`combat.typeLabel.${type}`);
      titleEl.textContent = results.length > 1 ? `${typeLabel} ${results.length}?곗냽 戮묎린` : `${typeLabel} 戮묎린`;
    }
  }

  grid.innerHTML = "";

  results.forEach((r, i) => {
    const card = document.createElement("div");
    const grade = r.grade || "B";
    card.className = `gachaCard gachaCard--${grade}`;
    card.style.animationDelay = `${i * 0.07}s`;

    // ?꾩씠肄?
    const iconWrap = document.createElement("div");
    iconWrap.className = "gachaCard__icon";

    const entity = type === "pet" ? r.pet : type === "equip" ? r.equip : r.deco;
    if (entity && entity.icon) {
      const img = document.createElement("img");
      img.src = entity.icon;
      img.alt = entity.name || "";
      iconWrap.appendChild(img);
    } else {
      iconWrap.classList.add("gachaCard__icon--placeholder");
      iconWrap.textContent = "?";
    }

    // NEW 諭껋?
    if (r.isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "gachaCard__new";
      newBadge.textContent = "NEW";
      iconWrap.appendChild(newBadge);
    }

    card.appendChild(iconWrap);

    // ?깃툒 諭껋?
    const gradeBadge = document.createElement("span");
    gradeBadge.className = "gachaCard__grade";
    gradeBadge.textContent = grade;
    card.appendChild(gradeBadge);

    // ?대쫫
    const nameEl = document.createElement("div");
    nameEl.className = "gachaCard__name";
    nameEl.textContent = entity ? entity.name : "???";
    card.appendChild(nameEl);

    // ?? 以묐났 ?뺣낫 / ?μ떇: 議곌컖 ?뺣낫 / ?λ퉬: 遺??異??뺣낫
    if (type === "pet") {
      if (!r.isNew && r.totalCopies > 1) {
        const frag = document.createElement("div");
        frag.className = "gachaCard__frag";
        frag.textContent = `${r.totalCopies}留덈━`;
        card.appendChild(frag);
      }
    } else if (type === "equip") {
      const info = document.createElement("div");
      info.className = "gachaCard__frag";
      info.textContent = `${equipPartNameI18n(entity.equipmentType)} 쨌 ${equipAxisNameI18n(entity.axis)}`;
      card.appendChild(info);
      if (r.isNew) {
        const newBadge = document.createElement("div");
        newBadge.className = "gachaCard__new";
        newBadge.textContent = "NEW!";
        card.appendChild(newBadge);
      }
    } else {
      const frag = document.createElement("div");
      frag.className = "gachaCard__frag";
      frag.textContent = `議곌컖 +${r.fragmentCount || 1}`;
      card.appendChild(frag);
    }

    grid.appendChild(card);
  });

  modal.classList.add("modal--open");
  modal.setAttribute("aria-hidden", "false");

  // ?꾨Т?곕굹 ?대┃?섎㈃ ?リ린
  const closeHandler = (e) => {
    closeGachaPopup();
    modal.removeEventListener("click", closeHandler);
  };
  // ?쎄컙???쒕젅?????대┃ ?대깽???깅줉 (利됱떆 ?ロ엳??寃?諛⑹?)
  setTimeout(() => modal.addEventListener("click", closeHandler), 300);
}


// ?먥븧??Modal helpers (moved from spin area) ?먥븧??

function openModal() {
  ui.modal.classList.add("modal--open");
  ui.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  setModalArt(null);
  ui.modal.classList.remove("modal--open");
  ui.modal.setAttribute("aria-hidden", "true");
}


