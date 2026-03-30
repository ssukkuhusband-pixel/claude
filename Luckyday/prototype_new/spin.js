// ═══ spin.js — Main game loop, Win/Defeat, Skill draft, Event listeners ═══

// 15칸 중 랜덤 n칸 선택 (중복 없이)
function pickRandomGridPositions(n) {
  const all = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) all.push({ r, c });
  }
  const shuffled = shuffledCopy(all);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function assignLineTalismansForSpin(player) {
  if (!player) return;

  const rows = Array.from({ length: ROWS }, (_, i) => i);
  const cols = Array.from({ length: COLS }, (_, i) => i);

  const rowCheckCount = Math.max(0, Math.floor(player.rowCheckTalismans || 0));
  if (!player.fixedRowTalismans) player.fixedRowTalismans = new Set();
  if (!player.fixedColTalismans) player.fixedColTalismans = new Set();
  if (!player.fixedRowTalismanBonus) player.fixedRowTalismanBonus = new Map();
  if (!player.fixedColTalismanBonus) player.fixedColTalismanBonus = new Map();
  if (!player.fixedLineEffectRow) player.fixedLineEffectRow = new Map();
  if (!player.fixedLineEffectCol) player.fixedLineEffectCol = new Map();

  const ensureFixedEffectLine = (count, fixedMap, pool, effectId, usedSet) => {
    const n = Math.max(0, Math.floor(count || 0));
    const existingIdx = Array.from(fixedMap.entries()).find(([, value]) => value === effectId)?.[0];
    if (existingIdx !== undefined && existingIdx !== null && n > 0) {
      usedSet.add(existingIdx);
      return;
    }
    for (const [idx, value] of fixedMap.entries()) {
      if (value === effectId) fixedMap.delete(idx);
    }
    if (n <= 0) return;
    const available = pool.filter((idx) => !usedSet.has(idx));
    const pick = pickOne(available.length ? available : pool);
    if (pick === undefined || pick === null) return;
    fixedMap.set(pick, effectId);
    usedSet.add(pick);
  };

  if (rowCheckCount > 0) {
    const existingRow = Array.from(player.fixedRowTalismanBonus.keys())[0];
    player.fixedRowTalismans.clear();
    player.fixedRowTalismanBonus.clear();
    const row = existingRow !== undefined ? existingRow : pickOne(rows);
    if (row !== undefined && row !== null) {
      player.fixedRowTalismans.add(row);
      player.fixedRowTalismanBonus.set(row, rowCheckCount);
    }
  } else {
    player.fixedRowTalismans.clear();
    player.fixedRowTalismanBonus.clear();
  }

  const colCheckCount = Math.max(0, Math.floor(player.colCheckTalismans || 0));
  if (colCheckCount > 0) {
    const existingCol = Array.from(player.fixedColTalismanBonus.keys())[0];
    player.fixedColTalismans.clear();
    player.fixedColTalismanBonus.clear();
    const col = existingCol !== undefined ? existingCol : pickOne(cols);
    if (col !== undefined && col !== null) {
      player.fixedColTalismans.add(col);
      player.fixedColTalismanBonus.set(col, colCheckCount);
    }
  } else {
    player.fixedColTalismans.clear();
    player.fixedColTalismanBonus.clear();
  }

  const usedRows = new Set(player.fixedRowTalismans || []);
  const usedCols = new Set(player.fixedColTalismans || []);
  for (const idx of player.fixedLineEffectRow.keys()) usedRows.add(idx);
  for (const idx of player.fixedLineEffectCol.keys()) usedCols.add(idx);
  ensureFixedEffectLine(player.rowHealTalismans, player.fixedLineEffectRow, rows, "heal", usedRows);
  ensureFixedEffectLine(player.colHealTalismans, player.fixedLineEffectCol, cols, "heal", usedCols);
  ensureFixedEffectLine(player.rowDamageTalismans, player.fixedLineEffectRow, rows, "dmgBoost", usedRows);
  ensureFixedEffectLine(player.colDamageTalismans, player.fixedLineEffectCol, cols, "dmgBoost", usedCols);

  player.rowTalismans = new Set(player.fixedRowTalismans || []);
  player.colTalismans = new Set(player.fixedColTalismans || []);
  player.rowTalismanBonus = new Map(player.fixedRowTalismanBonus || []);
  player.colTalismanBonus = new Map(player.fixedColTalismanBonus || []);
  player.lineEffectRow = new Map(player.fixedLineEffectRow || []);
  player.lineEffectCol = new Map(player.fixedLineEffectCol || []);
}

// ❄️ 빙결 즉시 반영: 적 공격으로 빙결이 걸리면 현재 그리드에서 즉시 2칸 얼리기
function applyImmediateFreeze() {
  if (!state.player?.status || state.player.status.playerFrozenTurns <= 0) return;
  if (!state.grid) return;
  // 이미 얼린 칸이 있으면 유지 (재빙결 시 위치 변경 없음, 지속시간만 갱신)
  if (state.frozenTiles && state.frozenTiles.length > 0) return;
  state.frozenTiles = pickRandomGridPositions(2);
  renderAll(false);
}

// 기절 스핀 실패 시 적 턴 + DOT를 진행하는 축약 함수
async function doEnemyTurnAndDot() {
  // Enemy attack timing
  const willAttack = (state.turn + (state.enemy.attackOffset || 0)) % state.enemy.attackEvery === 0;
  const runTurnPassives = () => {
    const flags = [];
    const procNames = [];
    for (const p of state.enemy.passives || []) {
      if (!p.onTurn) continue;
      const before = flags.length;
      p.onTurn({ enemy: state.enemy, player: state.player, turn: state.turn, flags });
      if (flags.length !== before) procNames.push(passiveName(p));
    }
    if (flags.length) logEvt("note", `${enemyName(state.enemy)} 효과: ${flags.join(", ")}`);
    return procNames;
  };
  const runAfterAttackPassives = (res, totalFlags) => {
    let extraAttacks = 0;
    const procNames = [];
    for (const p of state.enemy.passives || []) {
      if (!p.onAfterAttack) continue;
      const ctx = {
        enemy: state.enemy,
        player: state.player,
        damageDealt: res.dmg || 0,
        crit: !!res.crit,
        flags: totalFlags,
        extraAttacks: 0,
        queuedAttackMultipliers: [],
      };
      const beforeFlags = ctx.flags.length;
      p.onAfterAttack(ctx);
      totalFlags = ctx.flags || totalFlags;
      if (Array.isArray(ctx.queuedAttackMultipliers) && ctx.queuedAttackMultipliers.length) {
        state.enemy._queuedAttackMults = (state.enemy._queuedAttackMults || []).concat(ctx.queuedAttackMultipliers);
      }
      const queuedCount = Array.isArray(ctx.queuedAttackMultipliers) ? ctx.queuedAttackMultipliers.length : 0;
      if (ctx.flags.length !== beforeFlags || (ctx.extraAttacks || 0) > 0 || queuedCount > 0) procNames.push(passiveName(p));
      extraAttacks += (ctx.extraAttacks || 0) + queuedCount;
    }
    return { totalFlags, extraAttacks: Math.min(5, extraAttacks), procNames };
  };
  runTurnPassives();
  if (willAttack) {
    state.logPhase = "enemy";
    logEvt("note", t("log.enemyTurn", { name: enemyName(state.enemy) }));
    await sleep(280);
    if (state.enemy.status && state.enemy.status.stunnedTurns > 0) {
      state.enemy.status.stunnedTurns -= 1;
      state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
      logEvt("note", t("log.enemyStunnedSkip", { name: enemyName(state.enemy) }));
    } else if (state.enemy.status && state.enemy.status.frozenTurns > 0) {
      state.enemy.status.frozenTurns -= 1;
      state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
      logEvt("note", t("log.enemyFrozenSkip", { name: enemyName(state.enemy) }));
    } else {
      let totalFlags = [];
      let totalDmg = 0;
      let attackCount = 0;
      while (attackCount < 5 && state.player.hp > 0) {
        let res = enemyAttack(state.player, state.enemy);
        if (res.dizzyMiss) {
          await playDizzyMissEffect();
          logEvt("note", `💫 ${enemyName(state.enemy)}의 공격이 빗나갔다!`);
        } else {
          await playEnemyLunge();
        }
        totalFlags = totalFlags.concat(res.flags || []);
        totalDmg += res.dmg || 0;
        const after = runAfterAttackPassives(res, totalFlags);
        totalFlags = after.totalFlags;
        if (!(after.extraAttacks > 0)) break;
        attackCount += 1;
      }
      if (totalDmg > 0 && state.player.hp > 0) applyPetOnHitPassives(state.player, state.enemy, totalDmg);
      // ❄️ 적 공격 후 빙결 즉시 반영
      applyImmediateFreeze();
    }
    renderBars();
    await sleep(260);
  }
}

function clearStepFx() {
  state.lastStepCells = new Set();
  state.stepKind = "none";
  state.stepSymbolId = null;
  clearFx();
}

function toLabel(symbolId) {
  return t(`element.${symbolId}`, null, symbolId);
}

function drawFxForMatch(match) {
  if (!ui.fx || !ui.gridWrap) return;
  if (!ui.grid.children.length) return;

  const w = ui.gridWrap.clientWidth;
  const h = ui.gridWrap.clientHeight;
  ui.fx.setAttribute("viewBox", `0 0 ${w} ${h}`);
  ui.fx.setAttribute("preserveAspectRatio", "none");
  ui.fx.setAttribute("width", String(w));
  ui.fx.setAttribute("height", String(h));

  const wrapRect = ui.gridWrap.getBoundingClientRect();
  const first = match.cells[0];
  const last = match.cells[match.cells.length - 1];

  const getCenter = ([r, c]) => {
    const i = r * COLS + c;
    const el = ui.grid.children[i];
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - wrapRect.left + rect.width / 2,
      y: rect.top - wrapRect.top + rect.height / 2,
      "stat_evasion_up": "skill_1008.png",
    };
  };

  const a = getCenter(first);
  const b = getCenter(last);

  const ns = "http://www.w3.org/2000/svg";
  const stroke = symbolStroke(match.symbolId);
  const line = document.createElementNS(ns, "line");
  line.setAttribute("x1", a.x.toFixed(1));
  line.setAttribute("y1", a.y.toFixed(1));
  line.setAttribute("x2", b.x.toFixed(1));
  line.setAttribute("y2", b.y.toFixed(1));
  line.setAttribute("stroke", stroke);
  line.setAttribute("class", "fx__line fx__line--anim");
  ui.fx.appendChild(line);

  const mkDot = (pt) => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", pt.x.toFixed(1));
    c.setAttribute("cy", pt.y.toFixed(1));
    c.setAttribute("r", "5");
    c.setAttribute("fill", stroke);
    c.setAttribute("opacity", "0.95");
    return c;
  };
  ui.fx.appendChild(mkDot(a));
  ui.fx.appendChild(mkDot(b));
}

async function spin() {
  if (state.busy || isModalOpen() || isHelpOpen() || isCodexOpen() || isBattleOver()) return;
  state.busy = true;
  state.spinSeq = (state.spinSeq || 0) + 1;
  state.logEventSeq = 0;
  state.logPhase = "spin";
  state.luckyHoldActive = null;
  renderAll();
  sbReset();

  try {
    if (state.player.status && state.player.status.bleedTurns > 0 && state.player.hp > 0) {
      const bleed = tickPlayerBleed(state.player);
      if (bleed > 0) {
        if (state.player.status.invulTurns > 0) {
          logEvt("note", "무적: 출혈 피해 무시");
        } else {
          state.player.hp = Math.max(0, state.player.hp - bleed);
          addTurnDamage("player", bleed);
          logEvt("bad", `출혈 피해 -${bleed}`);
          renderBars();
          await sleep(220);
          if (state.player.hp <= 0) {
            onDefeat();
            return;
          }
        }
      }
    }
    if (typeof applyEquipmentTurnStartPassives === "function") {
      applyEquipmentTurnStartPassives(state.player, state.enemy);
    }
    if (typeof applyEquipmentSpinStart === "function") {
      applyEquipmentSpinStart(state.player);
    }
    // 💫 어지러움: 확률적 스핀 실패
    if (state.player.status && state.player.status.playerStunTurns > 0) {
      const stunReduce = state.player.equipPassive && state.player.equipPassive.spinFailReduce ? state.player.equipPassive.spinFailReduce : 0;
      const stunChance = Math.max(0, 0.30 * (1 - stunReduce));
      if (Math.random() < stunChance) {
        await playStunFailEffect();
        logEvt("bad", `💫 어지러움! 스핀 무효!`);
        runEnemyPlayerFailedAttackPassives();
        renderAll(false);
        await sleep(400);
        // 어지러움 실패 시에도 적 턴 + DOT + tick 진행
        await doEnemyTurnAndDot();
        tickPlayerDebuffs(state.player);
        // ❄️ 빙결 만료 시 frozenTiles 정리
        if (!state.player.status || state.player.status.playerFrozenTurns <= 0) {
          state.frozenTiles = [];
        }
        tickPetCooldownsAfterSpin();
        state.turn += 1;
        renderAll();
        state.busy = false;
        return;
      }
    }

    if (state.player.lightBuild.staticDischarge && state.enemy.status && state.enemy.status.frozenTurns > 0) {
      const perHit = 10;
      let total = 0;
      for (let i = 0; i < 3; i++) {
        const res = applyEnemyDamage(state.enemy, perHit, { fire: 0, light: perHit, nature: 0, water: 0 });
        total += res.dealt;
      }
      logEvt("good", t("log.staticDischarge", { value: total }));
      drawEnemyLightningBolt();
      flashEl(ui.enemyHpBar);
      pulseClass(ui.enemyPanel, "panel--hit", 190);
      pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
      renderBars();
      await sleep(220);
      if (state.enemy.hp <= 0) {
        await onWin();
        return;
      }
    }

    if (state.player.lightBuild.thorHammer && state.enemy.status && state.enemy.status.stunnedTurns > 0) {
      const dmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 2.0));
      const res = applyEnemyDamage(state.enemy, dmg, { fire: 0, light: dmg, nature: 0, water: 0 });
      logEvt("good", `토르 망치 (${res.dealt})`);
      showFxToast({ title: t("fx.thorHammer"), subtitle: t("fx.thorSub", { dmg: res.dealt }), symbolId: "light" });
      showComboFx("light");
      drawEnemyLightningBolt();
      flashEl(ui.enemyHpBar);
      pulseClass(ui.enemyPanel, "panel--hit", 190);
      pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
      renderBars();
      await sleep(180);
      if (state.enemy.hp <= 0) {
        await onWin();
        return;
      }
    }

    state.player.tempMatchDamage = state.player.nextSpinBonusDamage || 0;
    state.player.nextSpinBonusDamage = 0;
    state.player.tempDamageMult = state.player.nextSpinDamageMult || 1.0;
    state.player.nextSpinDamageMult = 1.0;
    state.player.tempEvasionBonus = 0;

    if (state.player.demonContract) {
      const cost = Math.max(1, Math.floor(state.player.maxHp * 0.02));
      state.player.hp = Math.max(1, state.player.hp - cost);
      addTurnDamage("player", cost);
      logEvt("bad", t("log.demonContract", { value: cost }));
      renderBars();
      await sleep(180);
      if (state.player.hp <= 0) {
        onDefeat();
        return;
      }
    }

    // ❄️ 빙결: 얼어붙은 칸의 현재 값 저장 (스핀 전)
    const frozenSaved = [];
    if (state.frozenTiles && state.frozenTiles.length > 0 && state.grid) {
      for (const { r, c } of state.frozenTiles) {
        frozenSaved.push({ r, c, val: state.grid[r][c] });
      }
    }

    state.grid = rollGrid(state.player);
    assignLineTalismansForSpin(state.player);

    // ❄️ 빙결: 얼어붙은 칸을 저장된 값으로 복원 (나머지만 스핀)
    for (const { r, c, val } of frozenSaved) {
      state.grid[r][c] = val;
    }

    state.singleConvertFixedKeys = new Set();
    if (state.player.singleConvertHold && Array.isArray(state.player.singleConvertHold.cells)) {
      for (const it of state.player.singleConvertHold.cells) {
        if (!it) continue;
        const r = Number(it.r);
        const c = Number(it.c);
        if (!Number.isFinite(r) || !Number.isFinite(c)) continue;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        if (!it.symbolId) continue;
        state.grid[r][c] = it.symbolId;
        state.singleConvertFixedKeys.add(`${r},${c}`);
      }
      state.player.singleConvertHold = null;
    }
    // Pet reroll: re-randomize N cells after grid is generated
    if (state.petRerollTurns > 0 && state.petRerollCount > 0) {
      const rerollWeights = symbolWeights();
      const rerollTotal = rerollWeights.reduce((a, b) => a + b.w, 0);
      const fixedKeys = new Set();
      // Don't reroll fixed cells (from pet fixSymbol or luckyHold)
      if (state.petFixTurns > 0 && state.petFixedCells) {
        for (const fc of state.petFixedCells) fixedKeys.add(`${fc.r},${fc.c}`);
      }
      if (state.luckyHoldActive && state.luckyHoldActive.keys) {
        for (const k of state.luckyHoldActive.keys) fixedKeys.add(k);
      }
      for (const k of state.singleConvertFixedKeys) fixedKeys.add(k);
      const rerollCandidates = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!fixedKeys.has(`${r},${c}`)) rerollCandidates.push({ r, c });
        }
      }
      const rerollPicks = uniqueSample(rerollCandidates, Math.min(state.petRerollCount, rerollCandidates.length));
      for (const { r, c } of rerollPicks) {
        state.grid[r][c] = rollSymbolId(state.player, rerollWeights, rerollTotal);
      }
      if (rerollPicks.length > 0) {
        logEvt("good", `펫 리롤: ${rerollPicks.length}개 심볼 교체`);
      }
    }

    // 🔥 화상: 불탄 심볼 위치 배정
    let burntPositions = [];
    const playerBurnTiles = state.player.status ? state.player.status.playerBurnTiles : [];
    if (playerBurnTiles.length > 0) {
      const allPos = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) allPos.push({ r, c });
      }
      // 얼린 칸 제외
      const fzTiles = state.frozenTiles || [];
      const available = allPos.filter(
        p => !fzTiles.some(f => f.r === p.r && f.c === p.c)
      );
      const shuffled = shuffledCopy(available);
      for (let i = 0; i < playerBurnTiles.length && i < shuffled.length; i++) {
        burntPositions.push({ ...shuffled[i], dmg: playerBurnTiles[i].dmg });
      }
    }
    state.burntTiles = burntPositions;

    state.gridJustRolled = true;
    state.logPhase = "checks";

    // Reset per-spin tile talismans.
    state.player.tileTalismans = new Set();
    state.player.rowConvertMarks = new Set();
    state.player.colConvertMarks = new Set();
    if (state.player.shieldCore) state.player.shieldCore.extraProcUsedThisSpin = false;
    state.spinBombardCells = new Set();
    state.spinBombardElementId = null;

    // Show the new roll before any post-roll effects.
    state.matchesAll = [];
    state.revealedMatchCount = 0;
    state.lastStepCells = new Set();
    state.lastJackpot = false;
    state.stepKind = "none";
    state.stepSymbolId = null;
    renderAll(false);
    state.gridJustRolled = false;
    clearFx();

    // Give the player a beat to read the raw roll.
    await sleep(420);

    // Water defense hook: if you have tile talismans, convert it into shield (once per spin).
    if (state.player.waterBuild.iceArmor && state.player.tileTalismans && state.player.tileTalismans.size > 0) {
      const n = state.player.tileTalismans.size;
      const addShield = Math.min(16, n * 2);
      state.player.shield = (state.player.shield || 0) + addShield;
      logEvt("note", t("log.iceArmor", { value: addShield }));
    }

    // Per-tile talisman spawn (visual): highlights then attaches.
    if (state.player.tileTalismanChance > 0 && (!state.player.status || state.player.status.tileSealTurns <= 0)) {
      const maxTileTalismans = 3;
      const preview = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (Math.random() < state.player.tileTalismanChance) preview.push({ r, c });
        }
      }

      if (preview.length > maxTileTalismans) {
        const picks = uniqueSample(preview, maxTileTalismans);
        preview.length = 0;
        preview.push(...picks);
      }

      if (preview.length) {
        const mult = state.player.tileTalismanMult;
        state.stepKind = "preview";
        state.stepSymbolId = null;
        state.lastStepCells = new Set(preview.map(({ r, c }) => `${r},${c}`));
        renderAll(false);
        showFxToast({
          title: t("label.tileAttach", { mult }),
          subtitle: t("subtitle.targetCount", { count: preview.length }),
          symbolId: null,
        });
        await sleep(420);

        for (const t of preview) state.player.tileTalismans.add(`${t.r},${t.c}`);
        state.stepKind = "convert";
        state.lastStepCells = new Set(preview.map(({ r, c }) => `${r},${c}`));
        renderAll(false);
        logEvt("note", t("log.skillAttach", { mult, count: preview.length }));
        await sleep(360);
        clearStepFx();
        renderAll(false);
        await sleep(120);
      }
    }

    // Post-roll skill effects (visual): preview -> apply.
    for (const fx of state.player.hooks.afterRoll) {
      const plan = await fx({ grid: state.grid });
      if (!plan) continue;

      const preview = plan.preview || [];
      const changes = plan.changes || [];
      if (!preview.length && !changes.length) continue;

      const title = plan.label || t("ui.fxSkill");
      const sym = plan.symbolId || null;

      state.stepKind = "preview";
      state.stepSymbolId = sym;
      state.lastStepCells = new Set(preview.map(({ r, c }) => `${r},${c}`));
      renderAll(false);
      showFxToast({
        title,
        subtitle: plan.subtitle || (preview.length ? t("subtitle.targetCount", { count: preview.length }) : null),
        symbolId: sym,
      });
      await sleep(520);

      for (const ch of changes) {
        state.grid[ch.r][ch.c] = ch.to;
      }
      if (plan.kind === "bombard") {
        for (const ch of changes) state.spinBombardCells.add(`${ch.r},${ch.c}`);
        state.spinBombardElementId = plan.elementId;
        if (plan.persistNextSpin) {
          state.player.singleConvertHold = {
            cells: changes.map((ch) => ({ r: ch.r, c: ch.c, symbolId: ch.to })),
          };
        }
      }

      state.stepKind = "convert";
      state.stepSymbolId = sym;
      state.lastStepCells = new Set(changes.map(({ r, c }) => `${r},${c}`));
      renderAll(false);
      logEvt("note", t("log.skillConvert", { title, count: changes.length, target: sym ? toLabel(sym) : t("ui.change") }));
      await sleep(520);
      if (plan.kind === "rowConvert") state.player.rowConvertMarks = new Set();
      if (plan.kind === "colConvert") state.player.colConvertMarks = new Set();
      clearStepFx();
      renderAll(false);
      await sleep(160);
    }

    // 공명(신규): 폭격으로 변환된 칸에 심볼 부적 부착
    if (
      state.spinBombardElementId &&
      resonanceEnabledForElement(state.player, state.spinBombardElementId) &&
      state.spinBombardCells.size > 0 &&
      (!state.player.status || state.player.status.tileSealTurns <= 0)
    ) {
      const cells = Array.from(state.spinBombardCells).map((key) => {
        const [r, c] = key.split(",").map((x) => Number(x));
        return { r, c };
      }).filter(({ r, c }) => Number.isFinite(r) && Number.isFinite(c));

      if (cells.length) {
        const pick = pickOne(cells);
        const picks = [pick];
        state.stepKind = "preview";
        state.stepSymbolId = null;
        state.lastStepCells = new Set(picks.map(({ r, c }) => `${r},${c}`));
        renderAll(false);
        showFxToast({
          title: t("label.resonance"),
          subtitle: t("subtitle.tileAttach", { count: 1 }),
          symbolId: null,
        });
        await sleep(360);

        state.player.tileTalismans.add(`${pick.r},${pick.c}`);
        state.stepKind = "convert";
        state.lastStepCells = new Set(picks.map(({ r, c }) => `${r},${c}`));
        renderAll(false);
        logEvt("note", t("log.resonanceAttach"));
        await sleep(260);
        clearStepFx();
        renderAll(false);
      }
    }

    // v2: runePerSpin — 매 스핀 랜덤 심볼에 x2룬(tileTalisman) 부착
    if (state.player.runePerSpin > 0 && (!state.player.status || state.player.status.tileSealTurns <= 0)) {
      const runeCount = state.player.runePerSpin;
      const available = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const key = `${r},${c}`;
          if (!state.player.tileTalismans.has(key)) available.push({ r, c });
        }
      }
      const picks = uniqueSample(available, Math.min(runeCount, available.length));
      if (picks.length) {
        for (const p of picks) state.player.tileTalismans.add(`${p.r},${p.c}`);
        logEvt("good", `✨ 룬 각인: x2룬 ${picks.length}개 부착`);
      }
    }
    if (state.equipBattleState && state.equipBattleState.nextTurnDoubleRunes > 0 && (!state.player.status || state.player.status.tileSealTurns <= 0)) {
      const runeCount = state.equipBattleState.nextTurnDoubleRunes;
      const available = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const key = `${r},${c}`;
          if (!state.player.tileTalismans.has(key)) available.push({ r, c });
        }
      }
      const picks = uniqueSample(available, Math.min(runeCount, available.length));
      if (picks.length) {
        for (const p of picks) state.player.tileTalismans.add(`${p.r},${p.c}`);
        logEvt("good", `장비 룬 ${picks.length}개`);
      }
      state.equipBattleState.nextTurnDoubleRunes = 0;
    }
    if (state.equipBattleState && state.equipBattleState.nextTurnRainbow > 0) {
      const all = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) all.push({ r, c });
      }
      const picks = uniqueSample(all, Math.min(state.equipBattleState.nextTurnRainbow, all.length));
      for (const p of picks) state.grid[p.r][p.c] = "rainbow";
      if (picks.length) logEvt("good", `장비 만능 심볼 ${picks.length}개`);
      state.equipBattleState.nextTurnRainbow = 0;
    }

    // v2: specialSymbolX2 — 특수심볼 1개에 x2룬 자동 부착
    if (state.player.specialSymbolX2 && (!state.player.status || state.player.status.tileSealTurns <= 0)) {
      const V2_SPECIAL_VARIANTS = new Set([
        "fire_ember", "fire_power", "light_bolt", "light_thunder_sym",
        "nature_thorn_v", "nature_heal", "water_ice", "water_protect"
      ]);
      const specialCells = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (V2_SPECIAL_VARIANTS.has(state.grid[r][c])) {
            const key = `${r},${c}`;
            if (!state.player.tileTalismans.has(key)) specialCells.push({ r, c });
          }
        }
      }
      if (specialCells.length) {
        const pick = pickOne(specialCells);
        state.player.tileTalismans.add(`${pick.r},${pick.c}`);
        logEvt("good", `✨ 특수심볼 강화: x2룬 부착`);
      }
    }

    const patternBonuses = [];
    if (state.player.constellationEnabled) {
      const constellation = findConstellation(state.grid);
      if (constellation) {
        state.player.status.invulTurns = Math.max(state.player.status.invulTurns || 0, 2);
        logEvt("good", t("log.constellationProc"));
        showFxToast({
          title: t("label.constellation"),
          subtitle: t("subtitle.invulTurns", { turns: 2 }),
          symbolId: constellation.elementId,
        });
        await sleep(220);
      }
    }

    if (state.player.patternTriangleEnabled) {
      const triangle = findTrianglePattern(state.grid, false);
      if (triangle) {
        const base = state.player.baseMatchDamage + (state.player.tempMatchDamage || 0);
        const sym = SYMBOL_BY_ID[triangle.elementId];
        const elemMult = sym.mult + (state.player.elemBonus[triangle.elementId] || 0);
        const bonus = Math.max(1, Math.floor(base * elemMult * PATTERN_MULT));
        patternBonuses.push({ label: t("pattern.triangle"), elementId: triangle.elementId, damage: bonus });
      }
    }

    if (state.player.patternInvertedTriangleEnabled) {
      const tri = findTrianglePattern(state.grid, true);
      if (tri) {
        const base = state.player.baseMatchDamage + (state.player.tempMatchDamage || 0);
        const sym = SYMBOL_BY_ID[tri.elementId];
        const elemMult = sym.mult + (state.player.elemBonus[tri.elementId] || 0);
        const bonus = Math.max(1, Math.floor(base * elemMult * PATTERN_MULT));
        patternBonuses.push({ label: t("pattern.invertedTriangle"), elementId: tri.elementId, damage: bonus });
      }
    }

    if (state.player.patternXEnabled) {
      const x = findXPattern(state.grid);
      if (x) {
        const base = state.player.baseMatchDamage + (state.player.tempMatchDamage || 0);
        const sym = SYMBOL_BY_ID[x.elementId];
        const elemMult = sym.mult + (state.player.elemBonus[x.elementId] || 0);
        const xMult = state.player.patternXMult || PATTERN_MULT;
        const bonus = Math.max(1, Math.floor(base * elemMult * xMult));
        patternBonuses.push({ label: t("pattern.x"), elementId: x.elementId, damage: bonus });
      }
    }

    if (patternBonuses.length) {
      for (const b of patternBonuses) {
        logEvt("good", t("log.patternProc", { pattern: b.label, value: b.damage, element: toLabel(b.elementId) }));
      }
      const last = patternBonuses[patternBonuses.length - 1];
      window._lastPatternFx = { elementId: last.elementId };
      showFxToast({
        title: patternBonuses.length > 1 ? t("label.pattern") : last.label,
        subtitle: t("subtitle.bonusDamage", { value: patternBonuses.reduce((s, x) => s + x.damage, 0) }),
        symbolId: last.elementId,
      });
      await sleep(220);
    }

    const jackpotElementIdValue = jackpotElementId(state.grid);
    const jackpot = !!jackpotElementIdValue;
    let matches = findMatches(state.grid, state.frozenTiles);
    for (const fn of state.player.hooks.modifyMatches) {
      matches = fn(matches);
    }
    matches = applyRepeatSourcesAdditive(matches, state.player);
    matches.sort((a, b) => b.len - a.len || a.dir.localeCompare(b.dir) || a.symbolId.localeCompare(b.symbolId));

    // 체크 봉인(가로/세로)
    if (state.player.status) {
      if (state.player.status.lockHTurns > 0) {
        const row = state.player.status.lockHRow;
        matches = matches.filter((m) => !(m.dir === "H" && m.cells[0][0] === row));
      }
      if (state.player.status.lockVTurns > 0) {
        const col = state.player.status.lockVCol;
        matches = matches.filter((m) => !(m.dir === "V" && m.cells[0][1] === col));
      }
    }

    state.matchesAll = matches;
    const queuedMatches = state.matchesAll.slice();
    const gridSnapshot = state.grid.map((row) => row.slice());
    const turnEvolutionCounter = { fire: 0, light: 0, nature: 0, water: 0 };
    const turnEvolutionTriggered = { fire: false, light: false, nature: false, water: false };
  const turnHybridCounter = { light_nature: 0, fire_light: 0, light_water: 0, fire_nature: 0, nature_water: 0, fire_water: 0 };
  const turnHybridTriggered = { light_nature: false, fire_light: false, light_water: false, fire_nature: false, nature_water: false, fire_water: false };
    state.turnEvolutionCounter = { ...turnEvolutionCounter };
    state.turnEvolutionTriggered = { ...turnEvolutionTriggered };
  state.turnHybridCounter = { ...turnHybridCounter };
  state.turnHybridTriggered = { ...turnHybridTriggered };

    // Pet passive: pattern check triggers (count H/V matches)
    if (state.player.hp > 0 && matches.length > 0) {
      applyPetPatternPassives(state.player, state.enemy, matches);
    }

    state.revealedMatchCount = 0;
    clearStepFx();
    state.lastJackpot = false;
    renderAll(false);
    clearFx();

    ui.spinChecks.textContent = `0 / ${queuedMatches.length}`;
    ui.spinDamage.textContent = t("ui.spinDamage", { value: 0 });
    ui.jackpotText.textContent = jackpot ? t("ui.jackpotPending") : t("ui.jackpotNo");

    if (queuedMatches.length) {
      logEvt("note", t("log.checkQueue", { summary: summarizeMatches(queuedMatches) }));
    } else {
      logEvt("note", t("log.checkNone"));
      runEnemyPlayerFailedAttackPassives();
    }

    // Lucky: keep one checked pattern for next spin.
    if (!state.luckyHoldPending) {
      const luck = Math.max(0, state.player.luck || 0);
      const chance = Math.min(0.95, luck / 100);
      if (chance > 0 && queuedMatches.length > 0 && Math.random() < chance) {
        const unique = [];
        const seen = new Set();
        for (const m of queuedMatches) {
          const key = `${m.symbolId}|${m.dir}|${m.len}|${m.cells.map(([r, c]) => `${r},${c}`).join(";")}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(m);
        }
        if (unique.length) {
          const maxHold = Math.max(1, state.player.luckHoldCount || 1);
          const picks = uniqueSample(unique, Math.min(maxHold, unique.length));
          const cells = [];
          const keys = new Set();
          const patternKeys = new Set();
          for (const pick of picks) {
            const key = `${pick.symbolId}|${pick.dir}|${pick.len}|${pick.cells.map(([r, c]) => `${r},${c}`).join(";")}`;
            patternKeys.add(key);
            for (const [r, c] of pick.cells) {
              cells.push({ r, c, id: state.grid[r][c] });
              keys.add(`${r},${c}`);
            }
          }
          state.luckyHoldPending = { cells, keys, patternKeys };
          logEvt("good", `럭키 발동! 패턴 ${picks.length}개 유지`);
          showFxToast({ title: t("fx.lucky"), subtitle: t("fx.luckySub", { count: picks.length }), symbolId: picks[0].symbolId });
          if (ui.gridWrap) pulseClass(ui.gridWrap, "gridWrap--luckyHold", 420);
        }
      }
    }

    // Reveal checks sequentially, then apply damage.
    state.logPhase = "checks";
    let partialMatches = [];
    let extraByElement = { fire: 0, light: 0, nature: 0, water: 0 };
    let extraByElementBypass = { fire: 0, light: 0, nature: 0, water: 0 };
    let extraStrikeLog = [];      // v3: [{type, damage}, ...] 추가타 로그
    let burnTriggersThisSpin = 0; // v3: 화상 지연 적용 카운터
    let miniAppliedSum = 0;
    if (patternBonuses && patternBonuses.length) {
      for (const b of patternBonuses) {
        extraByElement[b.elementId] += b.damage;
      }
    }
    let comboHealsDone = 0;
    const specialOnceKeys = new Set();
    const talismanSynergyLogged = { burn: false, heal: false, strike: false, freeze: false };
    const miniProc = { fire: false, light: false, nature: false, water: false };
    const comboProc = { fire: false, light: false, nature: false, water: false };
    // ── per-check 장식 상태 ──
    const perCheckDecoState = { triggerCounts: {}, totalChainMult: 1.0 };
    const perCheckExtraByElement = { fire: 0, light: 0, nature: 0, water: 0 };
    let perCheckChainMult = 1.0;

    // ── 통합 비트 시스템 ──
    // 체크든 장식이든 모든 "이벤트"가 동일한 실제 간격으로 진행되며 점점 빨라짐
    // 가속은 콤보가 길어질 때만 발동 — 짧은 콤보는 처음부터 끝까지 같은 속도
    // 핵심: sleep 대기시간이 아니라, 이벤트 사이의 "실제 간격"을 일정하게 맞춤
    const BASE_BEAT = 450;   // 기본 비트 간격 (ms)
    const MIN_BEAT = 150;    // 최소 비트 간격
    const ACCEL_AFTER = 5;   // 이 비트까지는 일정 속도 유지
    const STEP_EVERY = 4;    // N비트마다 한 단계 가속
    const STEP_SIZE = 60;    // 단계당 감소 (ms)
    let beatIndex = 0;
    let lastBeatTs = performance.now();
    function beatMs() {
      // 처음 ACCEL_AFTER 비트까지는 일정한 BASE_BEAT
      if (beatIndex <= ACCEL_AFTER) return BASE_BEAT;
      // 이후 STEP_EVERY 비트마다 STEP_SIZE씩 빨라짐
      const steps = Math.floor((beatIndex - ACCEL_AFTER) / STEP_EVERY);
      return Math.max(MIN_BEAT, BASE_BEAT - steps * STEP_SIZE);
    }
    // 경과시간 보상: 처리 시간을 빼서 실제 간격을 일정하게
    async function waitBeat() {
      const target = beatMs();
      const elapsed = performance.now() - lastBeatTs;
      const actualSleep = Math.max(16, target - elapsed);
      await sleep(actualSleep);
      lastBeatTs = performance.now();
      beatIndex++;
    }

    for (let i = 0; i < queuedMatches.length; i++) {
      const m = queuedMatches[i];
      partialMatches.push(m);
      state.revealedMatchCount = i + 1;
      state.lastStepCells = new Set(m.cells.map(([r, c]) => `${r},${c}`));
      renderAll(false);
      await nextFrame();
      clearFx();
      drawFxForMatch(m);

      const part = computeSpinDamage(state.player, [m], false);
      const running = computeSpinDamage(state.player, partialMatches, false);
      if (part.dmg > 0 && comboProc[m.symbolId] !== undefined) comboProc[m.symbolId] = true;
      ui.spinChecks.textContent = `${i + 1} / ${queuedMatches.length}`;

      // ── 전광판: 체크마다 속성별 데미지 & 콤보 업데이트 ──
      sbSetCombo(i + 1);
      for (const eid of ["fire", "light", "nature", "water"]) {
        let total = (running.byElement[eid] || 0) + (extraByElement[eid] || 0) + (perCheckExtraByElement[eid] || 0);
        if (perCheckChainMult !== 1.0) total = Math.floor(total * perCheckChainMult);
        if (total > 0) sbSetElemDmg(eid, total);
      }

      // ── ♪ 체크 비트: 1비트 대기 (경과시간 보상) ──
      await waitBeat();

      if (m.specialPattern && part.dmg > 0) {
        if (m.specialPattern === "triangle") {
          const prev = state.player.baseMatchDamage || 0;
          state.player.baseMatchDamage = Math.max(1, Math.floor(prev * 1.2));
          logEvt("good", `△ 삼각형: 공격력 +20%`);
          showFxToast({ title: "삼각형", subtitle: "공격력 +20%", symbolId: m.symbolId });
          renderBars();
        } else if (m.specialPattern === "inv_triangle") {
          const shieldAmt = Math.max(1, Math.floor(state.player.maxHp * 0.2));
          state.player.shield = (state.player.shield || 0) + shieldAmt;
          logEvt("good", `▽ 역삼각형: 보호막 +${shieldAmt}`);
          showFxToast({ title: "역삼각형", subtitle: `보호막 +${shieldAmt}`, symbolId: m.symbolId });
          renderBars();
        } else if (m.specialPattern === "cross") {
          const healAmt = Math.max(1, Math.floor(state.player.maxHp * 0.12));
          const healResult = applyPlayerHeal(state.player, healAmt);
          logEvt("good", `✚ 십자가: 체력 ${healResult.healed > 0 ? `+${healResult.healed}` : "회복"}`);
          showFxToast({ title: "십자가", subtitle: `체력 +${Math.max(healResult.healed || 0, healAmt)}`, symbolId: m.symbolId });
          renderBars();
        }
      }

      // ── per-check 장식 평가 (체크 중 실시간 발동) ──
      if (part.dmg > 0 && typeof evaluatePerCheckDecorations === "function") {
        const pcResult = evaluatePerCheckDecorations(m, part, perCheckDecoState);
        if (pcResult.triggers.length > 0) {
          // 트리거를 하나씩 순차 처리: 각 장식 발동도 1비트
          let runningCheckDmgMult = 1.0;
          // 이전 체크에서 누적된 chainMult부터 시작해야 전광판이 줄어들지 않음
          let displayChainMult = perCheckChainMult;
          for (const trig of pcResult.triggers) {
            // elementId 주입: checkMult는 해당 체크 속성, chainMult는 데미지 있는 모든 속성
            if (trig.type === "checkMult") {
              trig.elementId = m.symbolId;
            } else if (trig.type === "chainMult") {
              // chainMult는 전체 배율 → 데미지가 있는 모든 속성에 레이블 표시
              const activeEids = [];
              for (const eid of ["fire", "light", "nature", "water"]) {
                const td = (running.byElement[eid] || 0) + (extraByElement[eid] || 0) + (perCheckExtraByElement[eid] || 0);
                if (td > 0) activeEids.push(eid);
              }
              trig.elementIds = activeEids;
              trig.elementId = activeEids[0] || m.symbolId; // fallback
            }
            logEvt("good", `🎀 ${trig.name}: x${trig.value.toFixed(1)} [per-check]`);

            // 데미지 증분 반영
            if (trig.type === "checkMult") {
              runningCheckDmgMult *= trig.value;
              const newExtra = Math.floor(part.dmg * (runningCheckDmgMult - 1));
              perCheckExtraByElement[m.symbolId] = newExtra;
            } else if (trig.type === "chainMult") {
              perCheckChainMult *= trig.value;
              displayChainMult *= trig.value;
            }

            // 전광판 즉시 업데이트 (textContent 먼저 갱신)
            for (const eid of ["fire", "light", "nature", "water"]) {
              let total = (running.byElement[eid] || 0) + (extraByElement[eid] || 0) + (perCheckExtraByElement[eid] || 0);
              if (displayChainMult !== 1.0) total = Math.floor(total * displayChainMult);
              if (total > 0) sbSetElemDmg(eid, total);
            }

            // 장식 발동 연출: wobble + 데미지 위 배율 + 숫자 떨림
            // sbSetElemDmg 이후에 호출해야 textContent가 레이블을 파괴하지 않음
            sbAnimatePerCheckDeco(trig);

            // ── ♪ 장식 비트: 1비트 대기 (경과시간 보상) ──
            await waitBeat();
          }
        }
      }

      if (state.player.magicSword && m.dir === "V" && part.dmg > 0) {
        extraByElement[m.symbolId] += part.dmg;
        logEvt("good", t("log.magicSword", { value: part.dmg }));
      }
      if (state.player.knightSword && part.dmg > 0) {
        const sword = Math.max(1, Math.floor(state.player.baseMatchDamage * 0.75));
        extraByElementBypass.light += sword;
        logEvt("good", `기사의 검 (${sword})`);
      }

      if (state.player.magicShield && m.dir === "H") {
        const max = state.player.magicShieldMax || 10;
        if (state.player.magicShieldStacks < max) {
          state.player.magicShieldStacks += 1;
          logEvt("good", t("log.magicShieldGain", { value: 1, total: state.player.magicShieldStacks }));
        }
      }

      if (state.player.magicSpirit && m.dir.startsWith("D")) {
        state.player.magicSpiritCount = (state.player.magicSpiritCount || 0) + 1;
        state.player.luck = (state.player.luck || 0) + 5;
        logEvt("good", t("log.magicSpiritGain", { value: 5, total: state.player.magicSpiritCount }));
      }

      // ── v2 Variant-on-check effects ──
      const matchKey = `${m.symbolId}|${m.dir}|${m.len}|${m.cells.map(([r, c]) => `${r},${c}`).join(";")}`;
      const firstOfLine = !specialOnceKeys.has(matchKey);
      if (firstOfLine) specialOnceKeys.add(matchKey);

      // v2 특수심볼 체크
      const emberCount = countVariantInMatch(gridSnapshot, m, "fire_ember");
      const powerCount = countVariantInMatch(gridSnapshot, m, "fire_power");
      const boltCount = countVariantInMatch(gridSnapshot, m, "light_bolt");
      const thunderSymCount = countVariantInMatch(gridSnapshot, m, "light_thunder_sym");
      const thornCount = countVariantInMatch(gridSnapshot, m, "nature_thorn_v");
      const healCount = countVariantInMatch(gridSnapshot, m, "nature_heal");
      const iceCount = countVariantInMatch(gridSnapshot, m, "water_ice");
      const protectCount = countVariantInMatch(gridSnapshot, m, "water_protect");
      const emberHit = emberCount > 0;       // 불씨 → 화상
      const powerHit = powerCount > 0;       // 파워 → 공격력%
      const boltHit = boltCount > 0;         // 낙뢰 → 미니번개
      const thunderSymHit = thunderSymCount > 0; // 천둥 → 어지러움
      const thornHit = thornCount > 0;       // 가시 → 따가움
      const healHit = healCount > 0;         // 회복 → HP회복
      const iceHit = iceCount > 0;           // 얼음 → 저체온
      const protectHit = protectCount > 0;   // 보호 → 보호막
      turnHybridCounter.light_nature += countVariantInMatch(gridSnapshot, m, "light_nature");
      turnHybridCounter.fire_light += countVariantInMatch(gridSnapshot, m, "fire_light");
      turnHybridCounter.light_water += countVariantInMatch(gridSnapshot, m, "light_water");
      turnHybridCounter.fire_nature += countVariantInMatch(gridSnapshot, m, "fire_nature");
      turnHybridCounter.nature_water += countVariantInMatch(gridSnapshot, m, "nature_water");
      turnHybridCounter.fire_water += countVariantInMatch(gridSnapshot, m, "fire_water");
      state.turnHybridCounter = { ...turnHybridCounter };
      if (state.player && state.player.hybridFinishers) {
        const defs = [
          ["light_nature", "light_nature", "번개 폭풍", "light"],
          ["fire_light", "fire_light", "플라즈마", "fire"],
          ["light_water", "water_light", "번개 비", "light"],
          ["fire_nature", "fire_nature", "화염 폭풍", "fire"],
          ["nature_water", "water_nature", "해일", "water"],
          ["fire_water", "fire_water", "화염 비", "fire"],
        ];
        for (const [counterKey, finisherKey, title, symbolId] of defs) {
          if (!state.player.hybridFinishers[finisherKey]) continue;
          if (turnHybridCounter[counterKey] < 5) continue;
          if (state.turnHybridTriggered[counterKey]) continue;
          state.turnHybridTriggered[counterKey] = true;
          if (typeof renderEvolutionHud === "function") renderEvolutionHud();
          showFxToast({ title, subtitle: "이번 턴 발동", symbolId });
        }
      }

      // v1 호환 (아직 v1 변이가 그리드에 남아있을 수 있음)
      const burnHit = hasVariantInMatch(gridSnapshot, m, "fire_burn");
      const flameHit = hasVariantInMatch(gridSnapshot, m, "fire_flame");
      const chainHit = hasVariantInMatch(gridSnapshot, m, "light_chain");
      const thunderHit = hasVariantInMatch(gridSnapshot, m, "light_thunder");
      const slipHit = hasVariantInMatch(gridSnapshot, m, "water_slip");
      const freezeCount = countVariantInMatch(gridSnapshot, m, "water_freeze");
      const iceArmorHit = hasVariantInMatch(gridSnapshot, m, "water_ice_armor");
      const galeHit = hasVariantInMatch(gridSnapshot, m, "nature_gale");
      const strikeHit = hasVariantInMatch(gridSnapshot, m, "light_strike");
      const shockwaveHit = hasVariantInMatch(gridSnapshot, m, "light_shockwave");

      const tileCount = countTileTalismansInMatch(m, state.player.tileTalismans);
      const critRuneCount = countAnyVariantsInMatch(state.grid, m, CRIT_RUNE_VARIANTS);

      if (state.player.commonCritRune && critRuneCount > 0) {
        const addChance = 0.05 * critRuneCount;
        state.player.critChanceBattleBonus = Math.min(0.95, (state.player.critChanceBattleBonus || 0) + addChance);
        logEvt("good", `치명 룬: 치명타 확률 +${Math.round(addChance * 100)}%`);
      }

      // ═══ v2 특수심볼 on-check 효과 ═══

      // ── 만능심볼(rainbow) 데미지 보너스 ──
      if (state.player.rainbowDmgBonus > 0 && part.dmg > 0) {
        let hasRainbow = false;
        for (const [r, c] of m.cells) {
          if (gridSnapshot[r][c] === "rainbow") { hasRainbow = true; break; }
        }
        if (hasRainbow) {
          const bonus = Math.max(1, Math.floor(part.dmg * state.player.rainbowDmgBonus));
          extraByElement[m.symbolId] += bonus;
          logEvt("good", `🌈 무지개 공명: +${bonus}`);
          showFxToast({ title: "무지개 공명", subtitle: `+${bonus}`, symbolId: m.symbolId });
        }
      }

      // ── 화염 속성 ──
      if (m.symbolId === "fire") {
        // 불씨(fire_ember): 화상 부여 (v3: 지연 적용)
        if (emberHit && state.enemy.status) {
          const burnStacks = state.player.specialSymbol ? (state.player.specialSymbol.emberBurnStacks || 1) : 1;
          burnTriggersThisSpin += burnStacks;
          logEvt("good", `🔥 불씨 발동: 화상 +${burnStacks}`);
          showFxToast({ title: "불씨", subtitle: `화상 +${burnStacks}`, symbolId: "fire" });
        }
        // 파워(fire_power): 공격력 증가
        if (powerHit) {
          const pct = state.player.specialSymbol ? state.player.specialSymbol.powerAtkPct : 0.05;
          turnEvolutionCounter.fire += powerCount;
          state.turnEvolutionCounter.fire = turnEvolutionCounter.fire;
          state.player.elemBonus.fire = (state.player.elemBonus.fire || 0) + pct;
          logEvt("good", `💪 파워 발동: 공격력 +${Math.round(pct * 100)}%`);
          showFxToast({ title: "파워", subtitle: `공격력 +${Math.round(pct * 100)}%`, symbolId: "fire" });
        }
        const fireEvo = state.player.elementEvolution ? state.player.elementEvolution.fire : null;
        const fireCount = turnEvolutionCounter.fire;
        if (fireEvo && fireEvo.enabled && fireCount >= fireEvo.threshold && part.dmg > 0) {
          const wasTriggered = !!state.turnEvolutionTriggered.fire;
          state.turnEvolutionTriggered.fire = true;
          if (!wasTriggered && typeof renderEvolutionHud === "function") renderEvolutionHud();
          const bonus = Math.max(1, Math.floor(part.dmg * ((fireEvo.mult || 1.5) - 1)));
          extraByElement.fire += bonus;
          logEvt("good", `☄️ 메테오 발동: +${bonus}`);
          showFxToast({ title: "메테오", subtitle: `+${bonus}`, symbolId: "fire" });
        }
        // 자동 화상 (auto_burn 스킬) — v3: 지연 적용
        if (state.player.autoStatus && state.player.autoStatus.fire && state.enemy.status && !emberHit) {
          burnTriggersThisSpin += 1;
          logEvt("good", `🔥 속성 강화: 화염 공격 → 화상 자동`);
        }
        // v1 호환: fire_flame — v3: 지연 적용
        if (flameHit && !emberHit && state.enemy.status) {
          const stacks = Math.max(1, state.player.fireBuild ? state.player.fireBuild.flameBurnStacks || 1 : 1);
          burnTriggersThisSpin += stacks;
          logEvt("good", `불씨 발동: 화상 +${stacks}`);
        }
      }

      // ── 번개 속성 ──
        if (m.symbolId === "light") {
          // 낙뢰(light_bolt): 미니번개 추가타
          if (boltHit && part.dmg > 0) {
            turnEvolutionCounter.light += boltCount;
            state.turnEvolutionCounter.light = turnEvolutionCounter.light;
            const lightEvo = state.player.elementEvolution ? state.player.elementEvolution.light : null;
            const lightCount = turnEvolutionCounter.light;
            if (lightEvo && lightEvo.enabled && lightCount >= lightEvo.threshold) {
              const wasTriggered = !!state.turnEvolutionTriggered.light;
              state.turnEvolutionTriggered.light = true;
              if (!wasTriggered && typeof renderEvolutionHud === "function") renderEvolutionHud();
            }
            const miniBoltCount = state.player.specialSymbol ? (state.player.specialSymbol.boltMiniCount || 1) : 1;
            const boltDmg = Math.max(1, Math.floor(part.dmg * 0.3));
            for (let i = 0; i < miniBoltCount; i++) {
              extraByElement.light += boltDmg;
              extraStrikeLog.push({ type: "lightning", damage: boltDmg });
          }
          logEvt("good", `⚡ 낙뢰 발동: 미니번개 ${miniBoltCount}회`);
          showFxToast({ title: "낙뢰", subtitle: `미니번개 ${miniBoltCount}회`, symbolId: "light" });
        }
        // 천둥(light_thunder_sym): 어지러움 부여
        if (thunderSymHit && state.enemy.status) {
          applyDizzy(state.enemy, state.player);
          const dizzyTurns = state.player.specialSymbol ? (state.player.specialSymbol.thunderDizzyTurns || 2) : 2;
          logEvt("good", `🌩️ 천둥 발동: 어지러움 ${dizzyTurns}턴`);
          showFxToast({ title: "천둥", subtitle: `어지러움 ${dizzyTurns}턴`, symbolId: "light" });
        }
        // 자동 미니번개 (auto_mini_light 스킬)
        if (state.player.autoStatus && state.player.autoStatus.light && part.dmg > 0 && !boltHit) {
          const autoBoltDmg = Math.max(1, Math.floor(part.dmg * 0.15));
          extraByElement.light += autoBoltDmg;
          logEvt("good", `⚡ 속성 강화: 번개 공격 → 미니번개 +${autoBoltDmg}`);
        }
        // v1 호환: light_thunder (기절)
        if (thunderHit && !thunderSymHit && state.enemy.status) {
          const chance = Math.max(0, Math.min(1, state.player.lightBuild ? state.player.lightBuild.thunderStunChance || 0.2 : 0.2));
          if (Math.random() < chance) {
            addEnemyStunTurns(state.enemy, 1);
            logEvt("good", t("log.stunApplied", { source: t("fx.thunder"), turns: 1, total: state.enemy.status.stunnedTurns }));
          }
        }
        // v1 호환: light_chain
        if (chainHit) {
          const mul = Math.max(1, state.player.lightBuild ? state.player.lightBuild.chainExtraMultiplier || 1 : 1);
          const chainDmg = Math.max(0, Math.floor(part.dmg * mul));
          extraByElement.light += chainDmg;
          if (chainDmg > 0) {
            logEvt("good", `낙뢰 추가타 (${chainDmg})`);
          }
        }
      }

      // ── 자연 속성 ──
      if (m.symbolId === "nature") {
        // 가시(nature_thorn_v): 따가움 부여
        if (thornHit && state.enemy.status) {
          const thornStacks = state.player.specialSymbol ? (state.player.specialSymbol.thornStacks || 1) : 1;
          for (let i = 0; i < thornStacks; i++) applyThorn(state.enemy, state.player, 3);
          logEvt("good", `🌿 가시 발동: 따가움 +${thornStacks}`);
          showFxToast({ title: "가시", subtitle: `따가움 +${thornStacks}`, symbolId: "nature" });
        }
        // 회복(nature_heal): HP 회복
        if (healHit) {
          turnEvolutionCounter.nature += healCount;
          state.turnEvolutionCounter.nature = turnEvolutionCounter.nature;
          const healPct = state.player.specialSymbol ? state.player.specialSymbol.healPct : 0.05;
          const healAmt = Math.max(1, Math.floor(state.player.maxHp * healPct));
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmt);
          logEvt("good", `💚 회복 발동: HP +${healAmt}`);
          showFxToast({ title: "회복", subtitle: `HP +${healAmt}`, symbolId: "nature" });
        }
        const natureEvo = state.player.elementEvolution ? state.player.elementEvolution.nature : null;
        const natureCount = turnEvolutionCounter.nature;
        if (natureEvo && natureEvo.enabled && natureCount >= natureEvo.threshold && part.dmg > 0) {
          const wasTriggered = !!state.turnEvolutionTriggered.nature;
          state.turnEvolutionTriggered.nature = true;
          if (!wasTriggered && typeof renderEvolutionHud === "function") renderEvolutionHud();
          const bonus = Math.max(1, Math.floor(state.player.hp * (natureEvo.hpFactor || 3)));
          extraByElement.nature += bonus;
          logEvt("good", `🌪️ 폭풍 발동: +${bonus}`);
          showFxToast({ title: "폭풍", subtitle: `+${bonus}`, symbolId: "nature" });
        }
        // 자동 따가움 (auto_thorn 스킬)
        if (state.player.autoStatus && state.player.autoStatus.nature && state.enemy.status && !thornHit) {
          applyThorn(state.enemy, state.player, 3);
          logEvt("good", `🌿 속성 강화: 자연 공격 → 따가움 자동`);
        }
      }

      // ── 물 속성 ──
      if (m.symbolId === "water") {
        // 얼음(water_ice): 저체온 부여
        if (iceHit && state.enemy.status) {
          const iceStacks = state.player.specialSymbol ? (state.player.specialSymbol.iceStacks || 1) : 1;
          let froze = false;
          for (let i = 0; i < iceStacks; i++) {
            froze = applyHypotherm(state.enemy, state.player, 3) || froze;
          }
          if (froze) {
            logEvt("good", `❄️ 얼음 발동: 저체온 → 빙결!`);
            showFxToast({ title: "얼음", subtitle: "빙결 발동!", symbolId: "water" });
          } else {
            logEvt("good", `🧊 얼음 발동: 저체온 +${iceStacks}`);
            showFxToast({ title: "얼음", subtitle: `저체온 +${iceStacks}`, symbolId: "water" });
          }
        }
        // 보호(water_protect): 보호막
        if (protectHit) {
          turnEvolutionCounter.water += protectCount;
          state.turnEvolutionCounter.water = turnEvolutionCounter.water;
          const protPct = state.player.specialSymbol ? state.player.specialSymbol.protectPct : 0.06;
          const shieldAmt = Math.max(1, Math.floor(state.player.maxHp * protPct));
          state.player.shield = (state.player.shield || 0) + shieldAmt;
          logEvt("good", `🛡️ 보호 발동: 보호막 +${shieldAmt}`);
          showFxToast({ title: "보호", subtitle: `보호막 +${shieldAmt}`, symbolId: "water" });
        }
        const waterEvo = state.player.elementEvolution ? state.player.elementEvolution.water : null;
        const waterCount = turnEvolutionCounter.water;
        if (waterEvo && waterEvo.enabled && waterCount >= waterEvo.threshold && part.dmg > 0) {
          const wasTriggered = !!state.turnEvolutionTriggered.water;
          state.turnEvolutionTriggered.water = true;
          if (!wasTriggered && typeof renderEvolutionHud === "function") renderEvolutionHud();
          const bonus = Math.max(1, Math.floor(state.player.maxHp * (waterEvo.hpFactor || 2)));
          extraByElement.water += bonus;
          logEvt("good", `🗡️ 얼음창 발동: +${bonus}`);
          showFxToast({ title: "얼음창", subtitle: `+${bonus}`, symbolId: "water" });
        }
        // 자동 저체온 (auto_hypotherm 스킬)
        if (state.player.autoStatus && state.player.autoStatus.water && state.enemy.status && !iceHit) {
          applyHypotherm(state.enemy, state.player, 3);
          logEvt("good", `🧊 속성 강화: 물 공격 → 저체온 자동`);
        }
        // v1 호환: water_slip (보호막)
        if (slipHit && !protectHit) {
          const pct = state.player.waterBuild && state.player.waterBuild.slipShieldPct ? state.player.waterBuild.slipShieldPct : 0.05;
          const addShield = Math.max(1, Math.floor(state.player.maxHp * pct));
          state.player.shield = (state.player.shield || 0) + addShield;
          logEvt("good", `미끌 보호막 +${addShield}`);
        }
      }

      const miniCfg = state.player.mini && state.player.mini[m.symbolId] ? state.player.mini[m.symbolId] : null;
      if (miniCfg && miniCfg.enabled && part.dmg > 0) {
        const base = state.player.baseMatchDamage + (state.player.tempMatchDamage || 0);
        const sym = SYMBOL_BY_ID[m.symbolId];
        const elemMult = sym.mult + (state.player.elemBonus[m.symbolId] || 0);
        const baseLenMult = LENGTH_MULT[m.len] || 1.0;
        const extra = Math.max(0, m.len - 3) * state.player.lengthScaleBonus;
        const lenMult = baseLenMult + extra;
        const basePart = Math.max(0, Math.floor(base * elemMult * lenMult));
        const min = Math.max(1, Math.floor(miniCfg.countMin || 1));
        const max = Math.max(min, Math.floor(miniCfg.countMax || min));
        const count = min === max ? min : randInt(min, max);
        const stunBonus =
          state.player.traits && state.player.traits.stunDamageBonus && state.enemy.status && state.enemy.status.stunnedTurns > 0
            ? 1 + state.player.traits.stunDamageBonus
            : 1;
        const per = Math.max(1, Math.floor(basePart * miniCfg.ratio * (miniCfg.mult || 1) * stunBonus));
        const bypass = !!miniCfg.bypassShield;
        const miniNames = { light: t("fx.miniLight"), nature: t("fx.miniNature"), fire: t("fx.miniFire"), water: t("fx.miniWater") };
        let miniDealt = 0;
        for (let k = 0; k < count; k++) {
          const payload = { fire: 0, light: 0, nature: 0, water: 0 };
          payload[m.symbolId] = per;
          const opts = bypass ? { bypassShieldElements: [m.symbolId] } : undefined;
          const res = applyEnemyDamage(state.enemy, per, payload, opts);
          if (res.dealt && res.dealt > 0) {
            miniAppliedSum += res.dealt;
            miniDealt += res.dealt;
          }
          if (res.reflect && res.reflect > 0) {
            state.player.hp = Math.max(0, state.player.hp - res.reflect);
            addTurnDamage("player", res.reflect);
          }
        }
        miniProc[m.symbolId] = true;
        if (miniDealt > 0) {
          logEvt("good", `${miniNames[m.symbolId]} ${count}회 (${miniDealt})`);
          showFxToast({ title: miniNames[m.symbolId], subtitle: `${count}회 발동`, symbolId: m.symbolId });
        }

        if (m.symbolId === "nature" && state.player.proc.natureDizzy && state.enemy) {
          if (Math.random() < 0.10) {
            state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
            logEvt("good", t("fx.turnDelayLog"));
            showFxToast({ title: t("fx.turnDelay"), subtitle: t("fx.turnDelaySub"), symbolId: "nature" });
          }
        }

        if (m.symbolId === "fire" && state.player.proc.fireArmorBreak && state.enemy) {
          const stacks = Math.min(5, (state.enemy.armorBreakStacks || 0) + 1);
          state.enemy.armorBreakStacks = stacks;
          state.enemy.damageTakenMult = 1 + stacks * 0.05;
          logEvt("good", `갑옷 파괴 x${stacks}`);
          showFxToast({ title: t("fx.armorBreak"), subtitle: t("fx.armorBreakSub", { stacks }), symbolId: "fire" });
        }

        if (m.symbolId === "water" && state.player.proc.waterMiniCleanse) {
          cleanseOneDebuff(state.player);
        }

        if (m.symbolId === "water" && state.player.proc.waterMiniShield) {
          const addShield = Math.max(1, Math.floor(state.player.maxHp * 0.03 * count));
          state.player.shield = (state.player.shield || 0) + addShield;
        }
      }

      // 라인 부적(상태이상/회복) + 강화 부적
      const onLine = isLineTalismanMatch(state.player, m);
      if (onLine) {
        let forgeOnLine = false;
        if (m.dir === "H" && state.player.lineEffectRow) {
          const r = m.cells[0][0];
          forgeOnLine = state.player.lineEffectRow.get(r) === "forge";
        } else if (m.dir === "V" && state.player.lineEffectCol) {
          const c = m.cells[0][1];
          forgeOnLine = state.player.lineEffectCol.get(c) === "forge";
        }

        // Proc Contract: line effects and forge trigger once per unique line-check per spin.
        if (forgeOnLine && firstOfLine) {
          state.player.elemBonus[m.symbolId] = (state.player.elemBonus[m.symbolId] || 0) + 0.10;
          logEvt(
            "good",
            t("log.forgeBoost", {
              element: toLabel(m.symbolId),
              value: (state.player.elemBonus[m.symbolId] || 0).toFixed(2),
            })
          );
        }

        if (firstOfLine) applyLineEffectTalismans(state.player, m, extraByElement);
      }

      if (burnHit && state.enemy.status) {
        const stacksPerProc = state.player.traits.burn.stacksPerProc;
        burnTriggersThisSpin += stacksPerProc;
        if (state.player.fireBuild.emberSpread && tileCount > 0) {
          burnTriggersThisSpin += tileCount;
        }
        const gained = stacksPerProc + (state.player.fireBuild.emberSpread && tileCount > 0 ? tileCount : 0);
        logEvt("good", t("log.burnApply", { value: gained, turns: 2 }));

        if (gained > 0 && state.player.fireBuild.cinderGuard) {
          const addShield = 6;
          state.player.shield = (state.player.shield || 0) + addShield;
          logEvt("good", t("log.cinderGuard", { value: addShield }));
        }
      }

      // 정화의 불꽃: 화염 이중문양이 포함된 화염 체크면 화상 +1 (v3: 지연)
      if (state.player.fireBuild.purifyingFlame && state.enemy.status && m.symbolId === "fire") {
        if (matchHasHybridWithElement(state.grid, m, "fire")) {
          burnTriggersThisSpin += 1;
          logEvt("good", t("log.purifyingFlame"));
        }
      }

      // 부적 연소: 심볼 부적이 포함된 화염 체크면 화상 +1 (v3: 지연)
      if (state.player.fireBuild.talismanIgnition && state.enemy.status && m.symbolId === "fire" && tileCount > 0) {
        burnTriggersThisSpin += 1;
        logEvt("good", t("log.talismanIgnition"));
      }

      if (healHit && state.player.hp > 0) {
        state.player.natureBuild.healHits = (state.player.natureBuild.healHits || 0) + 1;
        if (state.player.natureBuild.superHealEnabled && (state.player.natureBuild.healHits || 0) % 10 === 0) {
          state.player.natureBuild.superHealZone = true;
          showFxToast({ title: t("fx.superHeal"), subtitle: t("fx.superHealSub"), symbolId: "nature" });
        }
        const pct = state.player.traits.heal.pct;
        const heal = Math.max(1, Math.floor(state.player.maxHp * pct));
        const res = applyPlayerHeal(state.player, heal);
        if (res.healed > 0) {
          logEvt("good", t("log.heal", { value: res.healed }));
          showFxToast({ title: t("fx.heal"), subtitle: t("fx.healSub", { val: res.healed }), symbolId: "nature" });
          if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
          if (state.player.natureBuild && state.player.natureBuild.healBoost) {
            showFxToast({ title: t("fx.healBoost"), subtitle: t("fx.healBoostSub"), symbolId: "nature" });
          }

          if (state.player.natureBuild.saplingGuard) {
            const addShield = 8;
            state.player.shield = (state.player.shield || 0) + addShield;
            logEvt("good", t("log.saplingGuard", { value: addShield }));
          }

          if (state.player.natureBuild.photosynthesis) {
            const cur = state.player.elemBonus.nature || 0;
            const next = Math.min(0.50, cur + 0.05);
            state.player.elemBonus.nature = next;
            logEvt("good", t("log.photosynthesis", { value: next.toFixed(2) }));
          }

          // 자연 특성: 회복 시 디버프/봉인 1턴 해제
          if (state.player.natureBuild.healCleanse && elementHasVariant(state.player, "nature", "nature_heal")) {
            if (tryCleanseOnHeal(state.player)) logEvt("good", t("log.cleanse"));
          }

          if (state.player.bridges.groundingRoots && state.enemy.status) {
            if (Math.random() < 0.2) {
              addEnemyStunTurns(state.enemy, 1);
              state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
              logEvt("good", t("log.groundingRoots", { value: 1, total: state.enemy.status.stunnedTurns }));
            }
          }
        }

        if (state.player.bridges.ashenBloom && state.enemy.status && state.enemy.status.burnTurns > 0) {
          burnTriggersThisSpin += 1;
          logEvt("good", t("log.ashenBloom", { value: 1 }));
        }

        if (state.player.natureBuild.talismanBlossom && tileCount > 0) {
          const extra = Math.max(1, Math.floor(state.player.maxHp * 0.01 * tileCount));
            const res = applyPlayerHeal(state.player, extra);
            if (res.healed > 0) {
              logEvt("good", t("log.talismanBlossom", { value: res.healed }));
              if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);

          if (state.player.natureBuild.healCleanse && elementHasVariant(state.player, "nature", "nature_heal")) {
            if (tryCleanseOnHeal(state.player)) logEvt("good", t("log.cleanse"));
          }
          }
        }
      }

      if (galeHit && state.enemy.status) {
        applyBleed(state.enemy, state.player, 1);
        logEvt("good", t("log.bleedApply", { turns: state.enemy.status.bleedTurns }));

        if (state.player.natureBuild.hemorrhage) {
          const add = Math.min(36, (state.enemy.status.bleedStacks || 0) * 2);
          if (add > 0) {
            extraByElement.nature += add;
            logEvt("good", t("log.hemorrhage", { value: add }));
          }
        }
      }

      if (strikeHit) {
        const mult = state.player.traits.strike.mult;
        const extra = Math.max(1, Math.floor(part.dmg * mult));
        extraByElement.light += extra;
        logEvt("good", t("log.strikeExtra", { value: extra }));

        tryStunFromLightning(state.player, state.enemy, symbolNameById("light_strike"));
        drawEnemyLightningBolt();
        flashEl(ui.enemyHpBar);

        if (state.player.lightBuild.chainConductor && tileCount > 0) {
          const add = 6 * tileCount;
          extraByElement.light += add;
          logEvt("good", t("log.chainConductor", { value: add }));

          tryStunFromLightning(state.player, state.enemy, t("skill.chain_conductor.name"));
          drawEnemyLightningBolt();
          flashEl(ui.enemyHpBar);
        }

        if (state.player.lightBuild.overcharge) {
          state.player.nextSpinBonusDamage = (state.player.nextSpinBonusDamage || 0) + 2;
          logEvt("good", t("log.overcharge", { value: 2 }));
        }

        if (
          state.player.bridges.conductiveEmbers &&
          state.enemy.status &&
          state.enemy.status.burnTurns > 0 &&
          state.enemy.status.burnStacks > 0
        ) {
          const add = Math.min(48, state.enemy.status.burnStacks * 3);
          extraByElement.light += add;
          logEvt("good", t("log.conductiveEmbers", { value: add }));
        }
      }

      if (shockwaveHit && state.enemy) {
        // 50% proc chance per unique line-check.
        if (Math.random() < 0.5) {
        const d = state.player && state.player.traits && state.player.traits.shockwave ? state.player.traits.shockwave.delay : 1;
        const delay = Math.max(1, Math.floor(d || 1));
        state.enemy.attackOffset = (state.enemy.attackOffset || 0) + delay;
        logEvt("good", t("log.shockwave", { value: delay }));

        const sc = state.player && state.player.traits && state.player.traits.shockwave ? state.player.traits.shockwave.stunChance : 0;
        if (state.enemy.status && sc > 0 && Math.random() < sc) {
          addEnemyStunTurns(state.enemy, 1);
          logEvt(
            "good",
            t("log.stunApplied", {
              source: symbolNameById("light_shockwave"),
              turns: 1,
              total: state.enemy.status.stunnedTurns,
            })
          );
        }
        }
      }

      if (emberHit && state.player) {
        const p = state.player;
        const ep = p.traits && p.traits.ember ? p.traits.ember.pct : 0.07;
        const pct = Math.max(0, ep || 0);
        p.nextSpinDamageMult = (p.nextSpinDamageMult || 1.0) * (1.0 + pct);
        logEvt("good", t("log.ember", { value: Math.round(pct * 100) }));

        const bonus = p.traits && p.traits.ember ? p.traits.ember.bonusDamage : 0;
        const add = Math.max(0, Math.floor(bonus || 0));
        if (add > 0) {
          p.nextSpinBonusDamage = (p.nextSpinBonusDamage || 0) + add;
          logEvt("good", t("log.emberCatalyst", { value: add }));
        }
      }


      let froze = false;
      if (freezeCount > 0 && state.enemy.status) {
        const f = {
          chance: Math.max(0, Math.min(1, state.player.waterBuild.freezeChance || 0.2)),
          turns: 1 + Math.max(0, state.player.waterBuild.freezeTurnsBonus || 0),
        };
        let procs = 0;
        for (let k = 0; k < freezeCount; k++) {
          if (Math.random() < f.chance) {
            addEnemyFreezeTurns(state.enemy, f.turns);
            procs += 1;
          }
        }
        if (procs > 0) {
          logEvt(
            "good",
            t("log.freezeProc", { value: procs * f.turns, total: state.enemy.status.frozenTurns })
          );
          showFxToast({ title: t("fx.ice"), subtitle: t("fx.iceSub", { turns: procs * f.turns }), symbolId: "water" });
          if (state.enemy.shield && state.enemy.shield > 0) {
            state.enemy.shield = 0;
            logEvt("good", t("log.freezeBreak"));
          }
          froze = true;
        }
      }

      if (froze && state.player.waterBuild.iceShatter) {
        extraByElement.water += 20;
        logEvt("good", t("log.iceShatter"));
      }

      if (froze && state.player.waterBuild.deepFreeze && state.enemy.status) {
        const add = Math.min(40, (state.enemy.status.frozenTurns || 0) * 5);
        if (add > 0) {
          extraByElement.water += add;
          logEvt("good", t("log.deepFreeze", { value: add }));
        }
      }

      if (froze && state.player.waterBuild.frostGuard) {
        const addShield = 10;
        state.player.shield = (state.player.shield || 0) + addShield;
        logEvt("good", t("log.frostGuard", { value: addShield }));
      }

      if (froze && state.player.bridges.stormFrost) {
        const add = 14;
        extraByElement.light += add;
        logEvt("good", t("log.stormFrost", { value: add }));
      }

      if (froze && state.player.bridges.springThaw && state.player.hp > 0) {
        const heal = Math.max(1, Math.floor(state.player.maxHp * 0.04));
        const res = applyPlayerHeal(state.player, heal);
        if (res.healed > 0) logEvt("good", t("log.springThaw", { value: res.healed }));
        if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
      }

      if (froze && state.player.bridges.thawBurst) {
        const add = 18;
        extraByElement.fire += add;
        logEvt("good", t("log.thawBurst", { value: add }));
      }

      if (iceArmorHit && state.player && state.player.hp > 0) {
        const p = state.player;
        const ip = p.traits && p.traits.iceBarrier ? p.traits.iceBarrier.pct : 0.05;
        const pct = Math.max(0, ip || 0);
        const addShield = Math.max(1, Math.floor(p.maxHp * pct));
        state.player.shield = (state.player.shield || 0) + addShield;
        logEvt("good", t("log.iceBarrier", { value: addShield }));

        if (p.traits && p.traits.iceBarrier && p.traits.iceBarrier.cleanse) {
          if (cleanseOneDebuff(p)) logEvt("good", t("log.cleanse"));
        }
      }

      const runningTotal =
        running.dmg +
        extraByElement.fire +
        extraByElement.light +
        extraByElement.nature +
        extraByElement.water +
        extraByElementBypass.fire +
        extraByElementBypass.light +
        extraByElementBypass.nature +
        extraByElementBypass.water +
        miniAppliedSum;
      const dmgMult = state.player.damageMult || 1;
      ui.spinDamage.textContent = t("ui.spinDamage", { value: Math.floor(runningTotal * dmgMult) });

      // 콤보 치료: 체크 누적 기준으로 회복(표현은 체크 단계에서 바로).
      if (state.player.comboHeal.enabled && state.player.hp > 0) {
        const every = state.player.comboHeal.every || 0;
        const amount = state.player.comboHeal.amount || 0;
        if (every > 0 && amount > 0) {
          const should = Math.floor((i + 1) / every);
          while (comboHealsDone < should) {
            comboHealsDone += 1;
            const res = applyPlayerHeal(state.player, amount);
            if (res.healed > 0) logEvt("good", t("log.comboHeal", { value: res.healed }));
            if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
          }
        }
      }

      // (기존 await sleep(360) 제거 — waitBeat()이 비트 간격을 담당)
    }
    if (state.player.comboSkills.lightNature && comboProc.light && comboProc.nature) {
      const dmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 1.0));
      extraByElement.light += dmg;
      if (
        state.player.comboSkills.lightningGaleBreakShield &&
        state.enemy &&
        state.enemy.shield &&
        state.enemy.shield > 0
      ) {
        state.enemy.shield = 0;
        logEvt("note", t("fx.shieldBreakLog"));
        showFxToast({ title: t("fx.shieldBreak"), subtitle: "", symbolId: "light" });
      }
      logEvt("good", `번개 돌풍 발동 (${dmg})`);
      showFxToast({
        title: t("fx.lightningGust"),
        subtitle: state.player.comboSkills.lightningGaleBreakShield ? "100% + 보호막 제거" : "100%",
        symbolId: "light",
      });
      showComboFx("light");
    }
    if (state.player.comboSkills.lightFire && comboProc.light && comboProc.fire) {
      const dmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 1.0));
      extraByElement.light += dmg;
      if (state.player.comboSkills.plasmaOverheat && state.enemy) {
        state.enemy.damageTakenMult = Math.max(1.0, state.enemy.damageTakenMult || 1.0) * 1.2;
      }
      logEvt("good", `플라즈마 발동 (${dmg})`);
      showFxToast({
        title: t("fx.plasma"),
        subtitle: state.player.comboSkills.plasmaOverheat ? t("fx.plasmaDefDown") : t("fx.plasmaFull"),
        symbolId: "light",
      });
      showComboFx("light");
    }
    if (state.player.comboSkills.lightWater && comboProc.light && comboProc.water) {
      state.player.comboAuras.darkCloud = true;
      state.player.comboAuras.darkCloudMult = state.player.comboSkills.darkCloudSuper ? 1.0 : 0.5;
      logEvt("good", t("fx.darkCloudLog"));
      showFxToast({
        title: t("fx.darkCloud"),
        subtitle: state.player.comboSkills.darkCloudSuper ? t("fx.darkCloudSuper") : t("fx.darkCloudNormal"),
        symbolId: "light",
      });
      showComboFx("light");
    }
    if (state.player.comboSkills.natureFire && comboProc.nature && comboProc.fire) {
      const dmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 1.0));
      extraByElement.fire += dmg;
      if (state.player.comboSkills.fireGaleDotPlus && state.enemy.status) {
        burnTriggersThisSpin += 3;
        applyBleed(state.enemy, state.player, 3);
      }
      logEvt("good", `화염 돌풍 발동 (${dmg})`);
      showFxToast({
        title: t("fx.fireGust"),
        subtitle: state.player.comboSkills.fireGaleDotPlus ? t("fx.fireGustSuper") : t("fx.fireGustNormal"),
        symbolId: "fire",
      });
      showComboFx("fire");
    }
    if (state.player.comboSkills.natureWater && comboProc.nature && comboProc.water) {
      const dmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 1.0));
      extraByElement.water += dmg;
      if (state.player.comboSkills.tidalWaveCleanse) cleanseAllDebuffs(state.player);
      logEvt("good", `해일 발동 (${dmg})`);
      showFxToast({
        title: t("fx.tidal"),
        subtitle: state.player.comboSkills.tidalWaveCleanse ? t("fx.tidalSuper") : t("fx.tidalNormal"),
        symbolId: "water",
      });
      showComboFx("water");
    }
    if (state.player.comboSkills.fireWater && comboProc.fire && comboProc.water) {
      state.player.comboAuras.hotSpring = true;
      state.player.comboAuras.hotSpringPct = state.player.comboSkills.hotSpringWarm ? 0.05 : 0.02;
      showFxToast({
        title: t("fx.hotSpring"),
        subtitle: state.player.comboSkills.hotSpringWarm ? t("fx.hotSpringSuper") : t("fx.hotSpringNormal"),
        symbolId: "water",
      });
      showComboFx("water");
    }

    if (state.player.hybridFinishers) {
      const hybridTotal = computeSpinDamage(state.player, partialMatches, false);
      if (state.player.hybridFinishers.light_nature && turnHybridCounter.light_nature >= 5) {
        const synDmg = Math.max(1, Math.floor(((hybridTotal.byElement.light || 0) + (hybridTotal.byElement.nature || 0)) * 0.5));
        extraByElement.light += Math.floor(synDmg * 0.5);
        extraByElement.nature += Math.floor(synDmg * 0.5);
        extraStrikeLog.push({ type: "hybrid_light_nature", damage: synDmg });
        if (state.enemy && state.enemy.shield > 0) state.enemy.shield = 0;
        logEvt("good", `⚡🌿 번개 폭풍 발동 (${synDmg})`);
        showFxToast({ title: "번개 폭풍", subtitle: "보호막 파괴", symbolId: "light" });
      }
      if (state.player.hybridFinishers.fire_light && turnHybridCounter.fire_light >= 5) {
        const synDmg = Math.max(1, Math.floor(((hybridTotal.byElement.fire || 0) + (hybridTotal.byElement.light || 0)) * 0.5));
        extraByElement.fire += Math.floor(synDmg * 0.5);
        extraByElement.light += Math.floor(synDmg * 0.5);
        extraStrikeLog.push({ type: "hybrid_fire_light", damage: synDmg });
        if (state.enemy) state.enemy.damageTakenMult = Math.max(1.0, state.enemy.damageTakenMult || 1.0) * 1.2;
        logEvt("good", `🔥⚡ 플라즈마 발동 (${synDmg})`);
        showFxToast({ title: "플라즈마", subtitle: "데미지 절감 약화", symbolId: "fire" });
      }
      if (state.player.hybridFinishers.water_light && turnHybridCounter.light_water >= 5) {
        const synDmg = Math.max(1, Math.floor(((hybridTotal.byElement.water || 0) + (hybridTotal.byElement.light || 0)) * 0.5));
        extraByElement.water += Math.floor(synDmg * 0.5);
        extraByElement.light += Math.floor(synDmg * 0.5);
        extraStrikeLog.push({ type: "hybrid_light_water", damage: synDmg });
        if (state.enemy) state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
        logEvt("good", `💧⚡ 번개 비 발동 (${synDmg})`);
        showFxToast({ title: "번개 비", subtitle: "적 스킬 봉인", symbolId: "light" });
      }
      if (state.player.hybridFinishers.fire_nature && turnHybridCounter.fire_nature >= 5) {
        const synDmg = Math.max(1, Math.floor(((hybridTotal.byElement.fire || 0) + (hybridTotal.byElement.nature || 0)) * 0.5));
        extraByElement.fire += Math.floor(synDmg * 0.5);
        extraByElement.nature += Math.floor(synDmg * 0.5);
        extraStrikeLog.push({ type: "hybrid_fire_nature", damage: synDmg });
        if (state.player.fireBuild) state.player.fireBuild.burnHealReduce = Math.max(state.player.fireBuild.burnHealReduce || 0, 0.5);
        logEvt("good", `🔥🌿 화염 폭풍 발동 (${synDmg})`);
        showFxToast({ title: "화염 폭풍", subtitle: "적 회복 방해", symbolId: "fire" });
      }
      if (state.player.hybridFinishers.water_nature && turnHybridCounter.nature_water >= 5) {
        const synDmg = Math.max(1, Math.floor(((hybridTotal.byElement.water || 0) + (hybridTotal.byElement.nature || 0)) * 0.5));
        extraByElement.water += Math.floor(synDmg * 0.5);
        extraByElement.nature += Math.floor(synDmg * 0.5);
        extraStrikeLog.push({ type: "hybrid_nature_water", damage: synDmg });
        cleanseOneDebuff(state.player);
        logEvt("good", `💧🌿 해일 발동 (${synDmg})`);
        showFxToast({ title: "해일", subtitle: "상태이상 정화", symbolId: "water" });
      }
      if (state.player.hybridFinishers.fire_water && turnHybridCounter.fire_water >= 5) {
        const synDmg = Math.max(1, Math.floor(((hybridTotal.byElement.fire || 0) + (hybridTotal.byElement.water || 0)) * 0.5));
        extraByElement.fire += Math.floor(synDmg * 0.5);
        extraByElement.water += Math.floor(synDmg * 0.5);
        extraStrikeLog.push({ type: "hybrid_fire_water", damage: synDmg });
        if (state.enemy) applyDizzy(state.enemy, state.player);
        logEvt("good", `🔥💧 화염 비 발동 (${synDmg})`);
        showFxToast({ title: "화염 비", subtitle: "적 공격력 감소", symbolId: "fire" });
      }
    }

    // ═══ v2 속성간 시너지 ═══
    if (state.player.synergy) {
      const syn = state.player.synergy;
      const hasFireDmg = comboProc.fire;
      const hasLightDmg = comboProc.light;
      const hasNatureDmg = comboProc.nature;
      const hasWaterDmg = comboProc.water;

      // 플라즈마: 화염+번개
      if (syn.plasma && hasFireDmg && hasLightDmg) {
        const total = computeSpinDamage(state.player, partialMatches, false);
        const synDmg = Math.max(1, (total.byElement.fire || 0) + (total.byElement.light || 0));
        extraByElement.fire += Math.floor(synDmg * 0.5);
        extraByElement.light += Math.floor(synDmg * 0.5);
        logEvt("good", `🔥⚡ 플라즈마: 합산 공격 (+${synDmg})`);
        showFxToast({ title: "플라즈마", subtitle: `+${synDmg}`, symbolId: "fire" });
        showComboFx("fire");
        if (syn.plasmaEnhanced) {
          state.player.critChanceBattleBonus = Math.min(0.95, (state.player.critChanceBattleBonus || 0) + 0.30);
          state.player.critDamageMult = (state.player.critDamageMult || 1.0) + 0.30;
          logEvt("good", `플라즈마 강화: 치명확률/치피 +30%`);
        }
      }

      // 번개 돌풍: 번개+자연
      if (syn.lightningGale && hasLightDmg && hasNatureDmg) {
        const total = computeSpinDamage(state.player, partialMatches, false);
        const synDmg = Math.max(1, (total.byElement.light || 0) + (total.byElement.nature || 0));
        extraByElement.light += Math.floor(synDmg * 0.5);
        extraByElement.nature += Math.floor(synDmg * 0.5);
        logEvt("good", `⚡🌿 번개 돌풍: 합산 공격 (+${synDmg})`);
        showFxToast({ title: "번개 돌풍", subtitle: `+${synDmg}`, symbolId: "light" });
        showComboFx("light");
        if (syn.lightningGaleEnhanced && state.enemy && Math.random() < 0.5) {
          state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
          logEvt("good", `번개 돌풍 강화: 적 공격 턴 +1`);
        }
      }

      // 뇌전: 번개+물
      if (syn.electrocute && hasLightDmg && hasWaterDmg) {
        const total = computeSpinDamage(state.player, partialMatches, false);
        const synDmg = Math.max(1, (total.byElement.light || 0) + (total.byElement.water || 0));
        extraByElement.light += Math.floor(synDmg * 0.5);
        extraByElement.water += Math.floor(synDmg * 0.5);
        logEvt("good", `⚡💧 뇌전: 합산 공격 (+${synDmg})`);
        showFxToast({ title: "뇌전", subtitle: `+${synDmg}`, symbolId: "light" });
        showComboFx("light");
        if (syn.electrocuteEnhanced && Math.random() < 0.5) {
          extraByElement.light += Math.floor(synDmg * 0.25);
          extraByElement.water += Math.floor(synDmg * 0.25);
          logEvt("good", `뇌전 강화: 추가 공격!`);
        }
      }

      // 정화의 불길: 자연+화염
      if (syn.purifyingFlame && hasNatureDmg && hasFireDmg) {
        const total = computeSpinDamage(state.player, partialMatches, false);
        const synDmg = Math.max(1, (total.byElement.nature || 0) + (total.byElement.fire || 0));
        extraByElement.nature += Math.floor(synDmg * 0.5);
        extraByElement.fire += Math.floor(synDmg * 0.5);
        logEvt("good", `🌿🔥 정화의 불길: 합산 공격 (+${synDmg})`);
        showFxToast({ title: "정화의 불길", subtitle: `+${synDmg}`, symbolId: "nature" });
        showComboFx("nature");
        if (syn.purifyingFlameEnhanced) {
          if (cleanseOneDebuff(state.player)) logEvt("good", `정화의 불길 강화: 상태이상 해제`);
        }
      }

      // 해일: 자연+물
      if (syn.tidal && hasNatureDmg && hasWaterDmg) {
        const total = computeSpinDamage(state.player, partialMatches, false);
        const synDmg = Math.max(1, (total.byElement.nature || 0) + (total.byElement.water || 0));
        extraByElement.nature += Math.floor(synDmg * 0.5);
        extraByElement.water += Math.floor(synDmg * 0.5);
        logEvt("good", `🌿💧 해일: 합산 공격 (+${synDmg})`);
        showFxToast({ title: "해일", subtitle: `+${synDmg}`, symbolId: "water" });
        showComboFx("water");
        if (syn.tidalEnhanced && state.enemy) {
          // 적의 이로운 효과 제거 (보호막 등)
          if (state.enemy.shield > 0) {
            logEvt("good", `해일 강화: 적 보호막 제거 (${state.enemy.shield})`);
            state.enemy.shield = 0;
          }
          state.enemy.damageTakenMult = Math.max(state.enemy.damageTakenMult || 1.0, 1.0);
        }
      }

      // 증기 돌풍: 화염+물
      if (syn.steamBlast && hasFireDmg && hasWaterDmg) {
        const total = computeSpinDamage(state.player, partialMatches, false);
        const synDmg = Math.max(1, (total.byElement.fire || 0) + (total.byElement.water || 0));
        extraByElement.fire += Math.floor(synDmg * 0.5);
        extraByElement.water += Math.floor(synDmg * 0.5);
        logEvt("good", `🔥💧 증기 돌풍: 합산 공격 (+${synDmg})`);
        showFxToast({ title: "증기 돌풍", subtitle: `+${synDmg}`, symbolId: "fire" });
        showComboFx("fire");
        if (syn.steamBlastEnhanced && state.enemy && state.enemy.shield > 0) {
          logEvt("good", `증기 돌풍 강화: 적 보호막 즉시 제거 (${state.enemy.shield})`);
          state.enemy.shield = 0;
        }
      }
    }

    const comboCount = queuedMatches.length;

    // Pet passive: combo triggers (comboThreshold, comboInterval, afterSpin)
    if (state.player.hp > 0 && comboCount > 0) {
      applyPetComboPassives(state.player, state.enemy, comboCount);
    }

    if (state.player.comboAuraEnabled && comboCount >= 5) {
      const gain = Math.floor(comboCount / 5);
      if (gain > 0) {
        const before = state.player.comboAuraStacks || 0;
        state.player.comboAuraStacks = Math.min(3, before + gain);
        const gained = state.player.comboAuraStacks - before;
        if (gained > 0) {
          logEvt("good", `콤보 오라 +${gained} (총 ${state.player.comboAuraStacks})`);
          showFxToast({ title: t("fx.comboAura"), subtitle: t("fx.comboAuraSub", { stacks: state.player.comboAuraStacks }), symbolId: "nature" });
        }
      }
    }

    if (state.player.comboMagicSwordEnabled && comboCount >= 5) {
      const swordHits = Math.floor(comboCount / 5);
      if (swordHits > 0) {
        const swordDmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 1.0)) * swordHits;
        extraByElement.light += swordDmg;
        logEvt("good", `콤보 운석 ${swordHits}회 (${swordDmg})`);
      }
    }

    // ═══ v2 콤보강화 (comboEnhance) ═══
    if (state.player.comboEnhance && comboCount > 0) {
      const ce = state.player.comboEnhance;
      const threshold = Math.max(1, 5 - (ce.comboReduction || 0));

      // 광전사 (berserker): 콤보 threshold+ → 2턴 공격력+30%/받피+15%
      if (ce.berserker && comboCount >= threshold) {
        const atkBonus = ce.berserkerAtkBonus || 0.30;
        state.player.damageMult = (state.player.damageMult || 1.0) * (1 + atkBonus);
        ce.berserkerTurns = 2;
        logEvt("good", `⚔️ 광전사: 공격력 +${Math.round(atkBonus * 100)}% (2턴, 받피+${Math.round((ce.berserkerDmgTaken || 0.15) * 100)}%)`);
        showFxToast({ title: "광전사", subtitle: `공격력 +${Math.round(atkBonus * 100)}%`, symbolId: "fire" });
      }

      // 수호결계 (guardian): 콤보 threshold+ → 보호막
      if (ce.guardian && comboCount >= threshold) {
        const shieldPct = ce.guardianPct || 0.10;
        const shieldAmt = Math.max(1, Math.floor(state.player.maxHp * shieldPct));
        state.player.shield = (state.player.shield || 0) + shieldAmt;
        logEvt("good", `🛡️ 수호결계: 보호막 +${shieldAmt}`);
        showFxToast({ title: "수호결계", subtitle: `보호막 +${shieldAmt}`, symbolId: "water" });
      }

      // 전장의 지배자 (dominator): 콤보 threshold+ → 3턴 상태이상 지속+1
      if (ce.dominator && comboCount >= threshold) {
        ce.dominatorTurns = 3;
        logEvt("good", `👑 전장의 지배자: 상태이상 지속 +${ce.dominatorStatusBonus || 1} (3턴)`);
        showFxToast({ title: "전장의 지배자", subtitle: `상태이상 +${ce.dominatorStatusBonus || 1}턴`, symbolId: "light" });
      }
    }

    const miniLabels = [];
    if (miniProc.light) miniLabels.push({ id: "light", name: t("fx.miniLight") });
    if (miniProc.nature) miniLabels.push({ id: "nature", name: t("fx.miniNature") });
    if (miniProc.fire) miniLabels.push({ id: "fire", name: t("fx.miniFire") });
    if (miniProc.water) miniLabels.push({ id: "water", name: t("fx.miniWater") });
    if (miniLabels.length) {
      for (const it of miniLabels) {
        showFxToast({ title: it.name, subtitle: t("fx.miniHit"), symbolId: it.id });
      }
    }

    if (jackpot) {
      state.lastStepCells = new Set();
      state.lastJackpot = true;
      renderAll(false);
      clearFx();
      const all = computeSpinDamage(state.player, partialMatches, true, jackpotElementIdValue);
      ui.jackpotText.textContent = t("ui.jackpotYes", { value: all.jackpotBonus });
      const extraSum =
        extraByElement.fire +
        extraByElement.light +
        extraByElement.nature +
        extraByElement.water +
        extraByElementBypass.fire +
        extraByElementBypass.light +
        extraByElementBypass.nature +
        extraByElementBypass.water;
      ui.spinDamage.textContent = t("ui.spinDamage", { value: all.dmg + extraSum });
      logEvt("good", t("log.jackpotCheck", { value: all.jackpotBonus }));
      await sleep(420);
    } else {
      ui.jackpotText.textContent = t("ui.jackpotNo");
    }

    state.lastStepCells = new Set();
    clearFx();

    const total = computeSpinDamage(state.player, partialMatches, jackpot, jackpotElementIdValue);
    const jackpotElemId = jackpot ? jackpotElementIdValue : null;
    // per-check 보너스 데미지를 extraByElement에 합산
    for (const eid of ["fire", "light", "nature", "water"]) {
      extraByElement[eid] += (perCheckExtraByElement[eid] || 0);
    }
    const byElement = mergeByElement(total.byElement, extraByElement);
    if (jackpotElemId && state.player.jackpotWeightBoost && state.player.jackpotWeightBoost[jackpotElemId]) {
      state.nextSpinElementBoost = {
        elementId: jackpotElemId,
        mult: state.player.jackpotWeightBoost[jackpotElemId],
        remainingSpins: 1,
      };
      showFxToast({ title: `${toLabel(jackpotElemId)}\uC758 \uAE30\uC6B4`, subtitle: "\uB2E4\uC74C \uC2A4\uD540 \uD655\uB960 \uC99D\uAC00", symbolId: jackpotElemId });
    }
    const extraSum = extraByElement.fire + extraByElement.light + extraByElement.nature + extraByElement.water;
    const bypassSum =
      extraByElementBypass.fire +
      extraByElementBypass.light +
      extraByElementBypass.nature +
      extraByElementBypass.water;
    const raw = total.dmg + extraSum + bypassSum;
    // Player debuffs that reduce outgoing damage.
    let outMult = 1.0;
    if (state.player.damageMult && state.player.damageMult > 0) outMult *= state.player.damageMult;
    if (state.player.tempDamageMult && state.player.tempDamageMult > 0) outMult *= state.player.tempDamageMult;
    if (state.player.status) {
      if (state.player.status.frozenTurns > 0) outMult *= 0.7;
      if (state.player.status.weakenTurns > 0) outMult *= 0.85;
    }
    const stunBonus =
      state.player.traits && state.player.traits.stunDamageBonus && state.enemy.status && state.enemy.status.stunnedTurns > 0
        ? 1 + state.player.traits.stunDamageBonus
        : 1;
    if (state.player.fireBuild.lastEmber && state.player.hp / state.player.maxHp < 0.3) outMult *= 1.5;
    if (state.player.fullPrepared && state.player.hp / state.player.maxHp >= 0.8) outMult *= 1.3;
    if (state.player.waterBuild.shieldFury && state.player.shield > 0) outMult *= 1.3;
    if (state.player.fireBuild.superPower) outMult *= 2.0;
    // v2: 단일속성 각성 (monoAwakeningBonus) — 50% 이상 속성 공격력 증가
    if (state.player.monoAwakeningBonus > 0 && state.grid) {
      const counts = { fire: 0, light: 0, nature: 0, water: 0 };
      const totalCells = ROWS * COLS;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const eid = elementOfSymbolId(state.grid[r][c]);
          if (eid && counts[eid] !== undefined) counts[eid]++;
        }
      }
      for (const eid of ["fire", "light", "nature", "water"]) {
        if (counts[eid] / totalCells >= 0.5 && byElement[eid] > 0) {
          const bonus = state.player.monoAwakeningBonus;
          outMult *= (1 + bonus);
          logEvt("good", `🌟 단일속성 각성: ${toLabel(eid)} 공격력 +${Math.round(bonus * 100)}%`);
          break;
        }
      }
    }
    // v2: 위기의 힘 (crisisPower) — HP 30%↓ 시 공격력 증가
    if (state.player.crisisPower > 0 && state.player.hp / state.player.maxHp <= 0.3) {
      outMult *= (1 + state.player.crisisPower);
    }
    if (state.player.healthyBodyAtk > 0 && state.player.hp / state.player.maxHp >= 0.7) {
      outMult *= (1 + state.player.healthyBodyAtk);
    }
    if (state.player.damageAmp > 0) {
      outMult *= (1 + state.player.damageAmp);
    }
    // v2: 화염방패 누적 공격력 보너스
    if (state.player.shieldBattleAtkBonus > 0) {
      outMult *= (1 + state.player.shieldBattleAtkBonus);
    }
    outMult *= petPassiveAttackMult(state.player, state.enemy, state.grid);
    if (state.petAttackBuffTurns > 0 && state.petAttackBuffMult > 0) outMult *= state.petAttackBuffMult;
    if (state.petSpinDamageMult > 0) outMult *= state.petSpinDamageMult;
    if (state.player.comboAttackEnabled && comboCount > 0) outMult *= 1 + comboCount * 0.05;
    if (state.player.comboAuraStacks && state.player.comboAuraStacks > 0) outMult *= 1 + state.player.comboAuraStacks * 0.10;
    if (state.player.basicAttackMode === "oneShot" && state.player.basicAttackOneShotMult > 1) {
      outMult *= state.player.basicAttackOneShotMult;
    }
    const equipModifiers = (typeof buildEquipmentSpinModifiers === "function")
      ? buildEquipmentSpinModifiers(state.player, state.enemy, {
          comboCount,
          activeElements: Object.entries(byElement).filter(([, v]) => v > 0).map(([k]) => k),
        })
      : null;
    if (equipModifiers) outMult *= equipModifiers.outMult || 1.0;

    // ── per-check 장식 체인 배율 적용 ──
    if (perCheckChainMult !== 1.0) {
      outMult *= perCheckChainMult;
      logEvt("good", `🎀 per-check 연쇄 배율: x${perCheckChainMult.toFixed(2)}`);
    }

    // ── v34: per-check 장식 트리거 상태를 battleState에 동기화 (leftDecoMeta 등 메타 장식용) ──
    if (perCheckDecoState.triggerCounts && state.decoBattleState) {
      for (const [pcId, pcCount] of Object.entries(perCheckDecoState.triggerCounts)) {
        if (pcCount > 0) {
          if (!state.decoBattleState[pcId]) state.decoBattleState[pcId] = {};
          state.decoBattleState[pcId].triggered = true;
        }
      }
    }

    // ── 추억장식 배율 + 전광판 연출 (post-check 장식만) ──
    const decoCtx = buildDecoSpinContext(state.matchesAll, jackpot);
    const decoResult = computeDecorationMultiplier(decoCtx);
    if (decoResult.finalMult !== 1.0) {
      outMult *= decoResult.finalMult;
      for (const dlog of decoResult.logs) logEvt("good", `🎀 ${dlog}`);
    }

    // 전광판 장식 순차 발동 애니메이션 (체크와 동일한 비트 리듬)
    if (equippedDecoDefs().length > 0 && raw > 0) {
      await sbAnimateDecoSequence(decoResult, waitBeat);
    }

    // v2: 필사의 일격 (desperationCrit) — HP 50%↓ 시 치명타 확률 증가
    const desperationBonus = (state.player.desperationCrit > 0 && state.player.hp / state.player.maxHp <= 0.5)
      ? state.player.desperationCrit : 0;
    const perfectConditionBonus = (state.player.perfectConditionCrit > 0 && state.player.hp >= state.player.maxHp)
      ? state.player.perfectConditionCrit : 0;
    const equipCritChanceBonus = equipModifiers ? (equipModifiers.critChanceBonus || 0) : 0;
    const critChance = Math.max(0, Math.min(0.95, (state.player.critChance || 0) + (state.player.critChanceBattleBonus || 0) + desperationBonus + perfectConditionBonus + equipCritChanceBonus));
    const isCrit = raw > 0 && ((equipModifiers && equipModifiers.guaranteedCrit) || (critChance > 0 && Math.random() < critChance));
    if (isCrit) {
      // Add passive crit damage buff
      const passiveCritBonus = (state.petPassiveState && state.petPassiveState.critDmgFromPassive > 0 && state.petPassiveState.critDmgFromPassiveTurns > 0)
        ? state.petPassiveState.critDmgFromPassive : 0;
      const equipCritDamageBonus = equipModifiers ? (equipModifiers.critDamageBonus || 0) : 0;
      const critMult = 1 + Math.max(0, (state.player.critDamageMult || 1) + passiveCritBonus + equipCritDamageBonus);
      outMult *= critMult;
      logEvt("good", `치명타 발동! x${critMult.toFixed(2)}`);
      showFxToast({ title: t("fx.critical"), subtitle: t("fx.criticalSub", { mult: critMult.toFixed(2) }), symbolId: "fire" });
      if (typeof applyEquipmentOnCrit === "function") applyEquipmentOnCrit(state.player);
    }

    if (state.player.fireBuild.lastEmber && state.player.hp / state.player.maxHp < 0.3 && state.lastBreathToastSeq !== state.spinSeq) {
      state.lastBreathToastSeq = state.spinSeq;
      showFxToast({ title: t("fx.lastResort"), subtitle: t("fx.lastResortSub"), symbolId: "fire" });
      showComboFx("fire");
    }
    if (state.player.waterBuild.shieldFury && state.player.shield > 0 && state.shieldFuryToastSeq !== state.spinSeq) {
      state.shieldFuryToastSeq = state.spinSeq;
      showFxToast({ title: t("fx.momentum"), subtitle: t("fx.momentumSub"), symbolId: "water" });
      showComboFx("water");
    }
    const normalRaw = Math.max(0, Math.floor((total.dmg + extraSum) * outMult * stunBonus));
    const scaledByElement = {
      fire: Math.floor(byElement.fire * outMult * stunBonus),
      light: Math.floor(byElement.light * outMult * stunBonus),
      nature: Math.floor(byElement.nature * outMult * stunBonus),
      water: Math.floor(byElement.water * outMult * stunBonus),
    };

    // v3: 화상 인스턴스 지연 생성 (최종 화염 데미지 기반)
    if (burnTriggersThisSpin > 0 && scaledByElement.fire > 0 && state.enemy.status) {
      for (let bti = 0; bti < burnTriggersThisSpin; bti++) {
        applyBurnFromFire(state.enemy, scaledByElement.fire, state.player);
      }
      const dmgPer = Math.max(1, Math.floor(scaledByElement.fire * 0.10));
      logEvt("good", `🔥 화상 ${burnTriggersThisSpin}건 (${dmgPer}/턴 × 2턴)`);
    }

    // 🔥 불탄 타일 체크 → 자해 데미지
    if (state.burntTiles && state.burntTiles.length > 0 && queuedMatches.length > 0) {
      let burnSelfDmg = 0;
      for (const bt of state.burntTiles) {
        let hitCount = 0;
        for (const m of queuedMatches) {
          if (m.cells && m.cells.some(([r, c]) => r === bt.r && c === bt.c)) {
            hitCount++;
          }
        }
        if (hitCount > 0) {
          burnSelfDmg += bt.dmg * hitCount;
        }
      }
      if (burnSelfDmg > 0 && state.player.status && state.player.status.invulTurns <= 0) {
        state.player.hp = Math.max(0, state.player.hp - burnSelfDmg);
        addTurnDamage("player", burnSelfDmg);
        logEvt("bad", `🔥 불탄 심볼 피해! -${burnSelfDmg} HP`);
        showDmgPopupText("player", `-${burnSelfDmg}`, "bad");
        renderBars();
        await sleep(220);
        if (state.player.hp <= 0) {
          onDefeat();
          return;
        }
      }
    }

    // ── 전광판: 최종 데미지 폭발 연출 제거 ──
    // v34: 장식 발동 중 점진적으로 데미지가 업데이트되므로 별도 폭발 불필요

    const bypassRaw = Math.max(0, Math.floor(bypassSum * outMult * stunBonus));
    const scaledBypassByElement = {
      fire: Math.floor(extraByElementBypass.fire * outMult * stunBonus),
      light: Math.floor(extraByElementBypass.light * outMult * stunBonus),
      nature: Math.floor(extraByElementBypass.nature * outMult * stunBonus),
      water: Math.floor(extraByElementBypass.water * outMult * stunBonus),
    };

    let dealtMain = 0;
    let reflect = 0;
    if (raw > 0) {
      state.logPhase = "damage";
      const flags = [];
      const dealtPopupByElement = { fire: 0, light: 0, nature: 0, water: 0, neutral: 0 };

      // ── Phase 1: 속성별 투사체 발사 ──
      const elemOrder = ["fire", "light", "nature", "water"];
      for (const el of elemOrder) {
        const v = scaledByElement[el] || 0;
        if (v > 0) await fireProjectile(el, v, { showNumber: false });
      }

      // ── Phase 2: 실제 데미지 적용 (팝업 억제 — Phase 1에서 표시) ──
      if (bypassRaw > 0) {
        const elems = Object.entries(scaledBypassByElement)
          .filter(([, v]) => v > 0)
          .map(([k]) => k);
        const resBypass = applyEnemyDamage(state.enemy, bypassRaw, scaledBypassByElement, { bypassShieldElements: elems, suppressPopup: true });
        dealtMain += resBypass.dealt;
        reflect += resBypass.reflect || 0;
        for (const [el, v] of Object.entries(resBypass.dealtByElement || {})) {
          dealtPopupByElement[el] = (dealtPopupByElement[el] || 0) + (v || 0);
        }
        if (resBypass.flags && resBypass.flags.length) flags.push(...resBypass.flags);
      }
      if (normalRaw > 0) {
        const res = applyEnemyDamage(state.enemy, normalRaw, scaledByElement, { suppressPopup: true });
        dealtMain += res.dealt;
        reflect += res.reflect || 0;
        for (const [el, v] of Object.entries(res.dealtByElement || {})) {
          dealtPopupByElement[el] = (dealtPopupByElement[el] || 0) + (v || 0);
        }
        if (res.flags && res.flags.length) flags.push(...res.flags);
      }

      // ── Phase 3: 추가타 이펙트 (미니번개/해머 등) ──
      for (const strike of extraStrikeLog) {
        if (state.enemy.hp > 0) {
          await playExtraStrike(strike.type, strike.damage);
        }
      }

      const lightEvo = state.player.elementEvolution ? state.player.elementEvolution.light : null;
      const lightCount = turnEvolutionCounter.light;
      if (lightEvo && lightEvo.enabled && lightCount >= lightEvo.threshold && scaledByElement.light > 0 && state.enemy.hp > 0) {
        const wasTriggered = !!state.turnEvolutionTriggered.light;
        state.turnEvolutionTriggered.light = true;
        if (!wasTriggered && typeof renderEvolutionHud === "function") renderEvolutionHud();
        const chance = Math.max(0, Math.min(1, lightEvo.chance || 0.30));
        const maxChain = 5;
        const lightChainRaw = Math.max(0, scaledByElement.light);
        let chainHits = 0;
        let chainDealt = 0;
        while (chainHits < maxChain && state.enemy.hp > 0 && Math.random() < chance) {
          chainHits += 1;
          await fireProjectile("light", lightChainRaw, { showNumber: false });
          const res = applyEnemyDamage(state.enemy, lightChainRaw, { fire: 0, light: lightChainRaw, nature: 0, water: 0 }, { suppressPopup: true });
          chainDealt += res.dealt || 0;
          reflect += res.reflect || 0;
        }
        if (chainHits > 0) {
          dealtMain += chainDealt;
          if (chainDealt > 0) {
            showElementDmgPopup("enemy", chainDealt, "light", { crit: isCrit });
            await sleep(260);
          }
          logEvt("good", `⚡ 연쇄 번개 발동: 번개 공격 재시전 ${chainHits}회 (${chainDealt})`);
          showFxToast({ title: "연쇄 번개", subtitle: `번개 공격 재시전 ${chainHits}회`, symbolId: "light" });
        }
      }

      if (state.player.basicAttackMode === "chain" && dealtMain > 0 && state.enemy.hp > 0) {
        console.warn("[damage-debug] legacy basicAttackMode=chain path is still reachable", {
          normalRaw,
          scaledByElement,
        });
      }

      if (dealtMain > 0) {
        for (const el of ["fire", "light", "nature", "water"]) {
          const dealt = dealtPopupByElement[el] || 0;
          if (dealt > 0) {
            showElementDmgPopup("enemy", dealt, el, { crit: isCrit });
            await sleep(260);
          }
        }
        if ((dealtPopupByElement.neutral || 0) > 0) {
          showDmgPopup("enemy", dealtPopupByElement.neutral, isCrit ? "crit" : "hit");
          await sleep(260);
        }
        flashEl(ui.enemyHpBar);
        pulseClass(ui.enemyPanel, "panel--hit", 190);
        pulseClass(ui.journeyEnemy, "journey__enemy--hit", 190);
        if (typeof applyEquipmentPostDamageEffects === "function") {
          applyEquipmentPostDamageEffects(state.player, state.enemy, { dealt: dealtMain, comboCount });
        }
      }

      if (raw > 0 && dealtMain <= 0 && state.enemy.hp > 0) {
        const suspicious = {
          checks: queuedMatches.length,
          totalDamage: total.dmg,
          extraSum,
          bypassSum,
          raw,
          normalRaw,
          bypassRaw,
          scaledByElement,
          scaledBypassByElement,
        };
        console.warn("[damage-suspicious] raw damage exists but nothing was dealt", suspicious);
        logEvt("bad", `피해 이상 감지 raw:${raw} normal:${normalRaw} bypass:${bypassRaw}`);
      }

      if (state.player.overkillHeal.enabled && state.player.hp > 0) {
        const ratio = state.player.overkillHeal.ratio || 0;
        if (ratio > 0) {
          const heal = Math.floor(dealtMain * ratio);
          const res = applyPlayerHeal(state.player, heal);
          if (res.healed > 0) logEvt("good", t("log.bloodSiphon", { value: res.healed }));
          if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
        }
      }

      if (reflect > 0) {
        state.player.hp = Math.max(0, state.player.hp - reflect);
        addTurnDamage("player", reflect);
        flashEl(ui.playerHpBar);
        pulseClass(ui.playerPanel, "panel--hurt", 190);
        pulseClass(ui.journeyHero, "journey__hero--hurt", 190);
      }
    }

    // Combo spectacle (readable): show after damage so it's noticeable.
    {
      const patternTotal = patternBonuses.reduce((s, x) => s + (x.damage || 0), 0);
      const extraTotal = extraByElement.fire + extraByElement.light + extraByElement.nature + extraByElement.water;
      const totalChecks = queuedMatches.length;
      const uniqueChecks = specialOnceKeys.size;
      let tier = 0;
      if (totalChecks >= 2) tier = 1;
      if (totalChecks >= 4) tier = 2;
      if (totalChecks >= 6) tier = 3;
      if (patternTotal > 0) tier = Math.min(3, tier + 1);
      if (jackpot) tier = 3;

      if (tier >= 2 || jackpot || patternTotal > 0) {
        const elements = ["fire", "light", "nature", "water"];
        let primary = null;
        let best = -1;
        for (const el of elements) {
          const v = scaledByElement[el] || 0;
          if (v > best) {
            best = v;
            primary = el;
          }
        }
        showComboToast(tier, primary, { checks: `${uniqueChecks}/${totalChecks}`, extra: String(extraTotal) });
      }
    }

    // Action recap (one line): what happened in this spin.
    {
      const patternTotal = patternBonuses.reduce((s, x) => s + (x.damage || 0), 0);
      const extraTotal = extraByElement.fire + extraByElement.light + extraByElement.nature + extraByElement.water;
      const totalChecks = queuedMatches.length;
      const uniqueChecks = specialOnceKeys.size;
      logEvt(
        "note",
        t("log.spinRecap", {
          checks: `${uniqueChecks}/${totalChecks}`,
          pattern: patternTotal,
          jackpot: total.jackpotBonus || 0,
          extra: extraTotal,
          dealt: dealtMain,
        })
      );
    }

    renderBars();
    await sleep(320);

    // Passive healing after the spin.
    if (state.player.healPerSpin > 0 && state.player.hp > 0) {
      const res = applyPlayerHeal(state.player, state.player.healPerSpin);
      if (res.healed > 0) logEvt("good", t("log.healAfterSpin", { value: res.healed }));
      if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
    }

    if (state.player.natureBuild.superHealZone && state.player.hp > 0) {
      const heal = Math.max(1, Math.floor(state.player.maxHp * 0.05));
      const res = applyPlayerHeal(state.player, heal);
      if (res.healed > 0) logEvt("good", `회복 지대 +${res.healed}`);
      if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
    }

    if (state.player.comboAuras && state.player.comboAuras.hotSpring && state.player.hp > 0) {
      const springPct = Math.max(0, state.player.comboAuras.hotSpringPct || 0.02);
      const heal = Math.max(1, Math.floor(state.player.maxHp * springPct));
      const res = applyPlayerHeal(state.player, heal);
      const addShield = Math.max(1, Math.floor(state.player.maxHp * springPct));
      state.player.shield = (state.player.shield || 0) + addShield;
      if (res.healed > 0) logEvt("good", `온천 회복 +${res.healed}`);
      logEvt("good", `온천 보호막 +${addShield}`);
      if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
    }

    // Enemy defeated?
    if (state.enemy.hp <= 0) {
      tickPetCooldownsAfterSpin();
      await onWin();
      return;
    }

    // Enemy per-turn passives (run every turn, regardless of attack timing).
    {
      const turnFlags = [];
      for (const p of state.enemy.passives) {
        if (!p.onTurn) continue;
        p.onTurn({ enemy: state.enemy, player: state.player, flags: turnFlags, turn: state.turn });
      }
      if (turnFlags.length) {
        logEvt("note", t("log.enemyTurnFlags", { name: enemyName(state.enemy), flags: turnFlags.join(", ") }));
      }
    }

    // Enemy attack timing.
    const willAttack = (state.turn + (state.enemy.attackOffset || 0)) % state.enemy.attackEvery === 0;
    if (willAttack) {
      state.logPhase = "enemy";
      logEvt("note", t("log.enemyTurn", { name: enemyName(state.enemy) }));
      await sleep(280);
      if (state.enemy.status && state.enemy.status.stunnedTurns > 0) {
        state.enemy.status.stunnedTurns -= 1;
        state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
        logEvt("note", t("log.enemyStunnedSkip", { name: enemyName(state.enemy) }));
      } else if (state.enemy.status && state.enemy.status.frozenTurns > 0) {
        state.enemy.status.frozenTurns -= 1;
        state.enemy.attackOffset = (state.enemy.attackOffset || 0) + 1;
        logEvt("note", t("log.enemyFrozenSkip", { name: enemyName(state.enemy) }));
      } else {
        // Enemy turn passives (shield/regen etc).
        const turnFlags = [];
        const turnPassiveNames = [];
        for (const p of state.enemy.passives) {
          if (p.onTurn) {
            const beforeTurn = turnFlags.length;
            p.onTurn({ enemy: state.enemy, player: state.player, turn: state.turn, flags: turnFlags });
            if (turnFlags.length !== beforeTurn) turnPassiveNames.push(passiveName(p));
          }
          if (!p.onEnemyTurn) continue;
          const before = turnFlags.length;
          p.onEnemyTurn({ enemy: state.enemy, player: state.player, flags: turnFlags });
          if (turnFlags.length !== before) turnPassiveNames.push(passiveName(p));
        }
        if (turnFlags.length) {
          logEvt("note", t("log.enemyTurnFlags", { name: enemyName(state.enemy), flags: turnFlags.join(", ") }));
        }

        let totalFlags = [];
        const procNames = [];
        let totalDmg = 0;
        let extraAttacks = 0;
        let attacksDone = 0;
        do {
          let res = enemyAttack(state.player, state.enemy);
          if (res.dizzyMiss) {
            await playDizzyMissEffect();
            logEvt("note", `💫 ${enemyName(state.enemy)}의${attacksDone > 0 ? " 추가" : ""} 공격이 빗나갔다!`);
          } else {
            await playEnemyLunge();
          }
          totalFlags = totalFlags.concat(res.flags || []);
          if (res.passives && res.passives.length) procNames.push(...res.passives);
          totalDmg += res.dmg || 0;

          let chained = 0;
          for (const p of state.enemy.passives) {
            if (!p.onAfterAttack) continue;
            const ctx = {
              enemy: state.enemy,
              player: state.player,
              damageDealt: res.dmg || 0,
              crit: !!res.crit,
              flags: totalFlags,
              extraAttacks: 0,
              queuedAttackMultipliers: [],
            };
            const beforeFlags = ctx.flags.length;
            p.onAfterAttack(ctx);
            if (ctx.flags) totalFlags = ctx.flags;
            const queuedCount = Array.isArray(ctx.queuedAttackMultipliers) ? ctx.queuedAttackMultipliers.length : 0;
            if (queuedCount > 0) {
              state.enemy._queuedAttackMults = (state.enemy._queuedAttackMults || []).concat(ctx.queuedAttackMultipliers);
            }
            if (ctx.flags.length !== beforeFlags || (ctx.extraAttacks || 0) > 0 || queuedCount > 0) procNames.push(passiveName(p));
            chained += (ctx.extraAttacks || 0) + queuedCount;
          }
          extraAttacks += chained;
          attacksDone += 1;
        } while (state.player.hp > 0 && attacksDone < 5 && attacksDone <= extraAttacks);

        if (extraAttacks > 0) {
          state.journeyFx = state.journeyFx || { pStatus: 0, eStatus: 0, eExtraUntil: 0, eExtra: 0 };
          state.journeyFx.eExtra = Math.min(extraAttacks, 4);
          state.journeyFx.eExtraUntil = Date.now() + 1200;
          if (ui.journeyEnemyExtra) pulseClass(ui.journeyEnemyExtra, "journeyChip--pulse", 420);
        }

        // Pet passive: onHit triggers after enemy attacks
        if (totalDmg > 0 && state.player.hp > 0) {
          applyPetOnHitPassives(state.player, state.enemy, totalDmg);
        }

        const uniq = (arr) => [...new Set(arr.filter(Boolean).map((s) => String(s).trim()).filter(Boolean))];
        const passiveProcs = uniq(turnPassiveNames.concat(procNames));
        if (passiveProcs.length) {
          logEvt("note", t("log.enemyPassiveProcs", { value: passiveProcs.join(", ") }));
        }

        // ❄️ 적 공격 후 빙결 즉시 반영
        applyImmediateFreeze();

        if (state.enemy.hp <= 0) {
          tickPetCooldownsAfterSpin();
          await onWin();
          return;
        }
      }
      renderBars();
      await sleep(260);
    }

    // Damage-over-time after enemy turn.
    state.logPhase = "dot";
    const hasBurnInstances = state.enemy.status && state.enemy.status.burnInstances && state.enemy.status.burnInstances.length > 0;
    const hasBurnLegacy = state.enemy.status && state.enemy.status.burnTurns > 0;
    if ((hasBurnInstances || hasBurnLegacy) && state.enemy.hp > 0) {
      const burnDmg = tickEnemyBurn(state.enemy);
      if (burnDmg > 0) {
        const res = applyEnemyDamage(state.enemy, burnDmg, { fire: burnDmg, light: 0, nature: 0, water: 0 }, { bypassShield: true, suppressPopup: true });
        await playBurnDotFx(burnDmg);
        renderBars();
        await sleep(220);
        if (state.enemy.hp <= 0) {
          tickPetCooldownsAfterSpin();
          await onWin();
          return;
        }
      }
    }

    if (state.player.comboAuras && state.player.comboAuras.darkCloud && state.enemy.hp > 0) {
      const darkCloudMult = Math.max(0, state.player.comboAuras.darkCloudMult || 0.5);
      const cloud = Math.max(1, Math.floor(state.player.baseMatchDamage * darkCloudMult));
      const res = applyEnemyDamage(state.enemy, cloud, { fire: 0, light: cloud, nature: 0, water: 0 });
      // damage handled in addTurnDamage
      renderBars();
      await sleep(140);
      if (state.enemy.hp <= 0) {
        tickPetCooldownsAfterSpin();
        await onWin();
        return;
      }
    }

    if (state.enemy.status && state.enemy.status.bleedTurns > 0 && state.enemy.hp > 0) {
      const bleedDmg = tickEnemyBleed(state.enemy);
      if (bleedDmg > 0) {
        const bypass = !!(state.player && state.player.natureBuild && state.player.natureBuild.bleedBypassShield);
        const res = applyEnemyDamage(
          state.enemy,
          bleedDmg,
          { fire: 0, light: 0, nature: bleedDmg, water: 0 },
          bypass ? { bypassShield: true } : undefined
        );
        // damage handled in addTurnDamage
        showEnemyDotFx("bleed");
        renderBars();
        await sleep(220);
        if (state.enemy.hp <= 0) {
          tickPetCooldownsAfterSpin();
          await onWin();
          return;
        }
      }
    }

    if (state.enemy.status && state.enemy.status.shockTurns > 0 && state.enemy.hp > 0) {
      const shockDmg = tickEnemyShock(state.enemy);
      if (shockDmg > 0) {
        const res = applyEnemyDamage(state.enemy, shockDmg, { fire: 0, light: shockDmg, nature: 0, water: 0 }, { bypassShield: true });
        // damage handled in addTurnDamage
        showEnemyDotFx("stun");
        renderBars();
        await sleep(220);
        if (state.enemy.hp <= 0) {
          tickPetCooldownsAfterSpin();
          await onWin();
          return;
        }
      }
    }

    if (state.player.waterBuild.frostbite && state.enemy.status && state.enemy.status.frozenTurns > 0 && state.enemy.hp > 0) {
      const dmg = Math.max(1, Math.floor(state.player.baseMatchDamage * 1.0));
      const res = applyEnemyDamage(state.enemy, dmg, { fire: 0, light: 0, nature: 0, water: dmg }, { bypassShield: true });
      // damage handled in addTurnDamage
      showFxToast({ title: t("fx.frostbite"), subtitle: t("fx.frostbiteSub", { dmg: res.dealt }), symbolId: "water" });
      showComboFx("water");
      showEnemyDotFx("freeze");
      renderBars();
      await sleep(220);
      if (state.enemy.hp <= 0) {
        tickPetCooldownsAfterSpin();
        await onWin();
        return;
      }
    }

    // Debuff durations tick down after your spin.
    state.logPhase = "end";
    if (state.player.status) {
      if (state.player.status.frozenTurns > 0) state.player.status.frozenTurns -= 1;
      if (state.player.status.weakenTurns > 0) state.player.status.weakenTurns -= 1;
      if (state.player.status.invulTurns > 0) state.player.status.invulTurns -= 1;
      if (state.player.status.lockHTurns > 0) state.player.status.lockHTurns -= 1;
      if (state.player.status.lockHTurns <= 0) state.player.status.lockHRow = null;
      if (state.player.status.lockVTurns > 0) state.player.status.lockVTurns -= 1;
      if (state.player.status.lockVTurns <= 0) state.player.status.lockVCol = null;
      if (state.player.status.talismanSealTurns > 0) state.player.status.talismanSealTurns -= 1;
      if (state.player.status.tileSealTurns > 0) state.player.status.tileSealTurns -= 1;
    }

    // v3 플레이어 디버프 tick
    tickPlayerDebuffs(state.player);

    // ❄️ 빙결 만료 시 frozenTiles 정리
    if (!state.player.status || state.player.status.playerFrozenTurns <= 0) {
      state.frozenTiles = [];
    }

    // Lose?
    if (state.player.hp <= 0) {
      if (state.player.reviveAvailable) {
        state.player.reviveAvailable = false;
        const revivePct = state.player.revivePct || 0.3;
        const reviveHp = Math.max(1, Math.floor(state.player.maxHp * revivePct));
        state.player.hp = reviveHp;
        logEvt("good", t("fx.reviveLog"));
        showFxToast({ title: t("fx.revive"), subtitle: t("fx.reviveSub"), symbolId: "water" });
        flashEl(ui.playerHpBar);
      } else {
        onDefeat();
        return;
      }
    }

    applyPetTurnPassiveEffects(state.player);
    updateDecoRoundEnd();
    state.playerHitThisRound = false; // 라운드 종료 시 리셋
    // v34: 피격 횟수를 "직전 라운드"로 이동 후 리셋
    state.playerHitCountLastRound = state.playerHitCountThisRound || 0;
    state.playerHitCountThisRound = 0;
    tickPetCooldownsAfterSpin();
    if (state.petAttackBuffTurns > 0) state.petAttackBuffTurns -= 1;
    if (state.petForcedElementTurns > 0) state.petForcedElementTurns -= 1;
    if (state.petRegenTurns > 0) state.petRegenTurns -= 1;
    if (state.enemyTakeDmgDebuffTurns > 0) state.enemyTakeDmgDebuffTurns -= 1;
    if (state.playerDmgReductionTurns > 0) state.playerDmgReductionTurns -= 1;
    if (state.bleedOnHitDuration > 0) state.bleedOnHitDuration -= 1;
    if (state.petCritBuffTurns > 0) state.petCritBuffTurns -= 1;
    if (state.petComboAttackTurns > 0) state.petComboAttackTurns -= 1;
    if (state.petEnemyAtkDebuffTurns > 0) state.petEnemyAtkDebuffTurns -= 1;
    if (state.petRerollTurns > 0) state.petRerollTurns -= 1;
    if (state.petFixTurns > 0) {
      state.petFixTurns -= 1;
      if (state.petFixTurns <= 0) state.petFixedCells = [];
    }
    if (state.petExtraRowCheckTurns > 0) state.petExtraRowCheckTurns -= 1;
    if (state.petTalismans && state.petTalismans.length > 0) {
      for (const pt of state.petTalismans) pt.turnsLeft -= 1;
      state.petTalismans = state.petTalismans.filter(pt => pt.turnsLeft > 0);
    }

    // ═══ v2 라운드 종료 처리 ═══
    const p = state.player;
    const e = state.enemy;

    // 재생 (regen)
    if (p && p.regenPct > 0) {
      let regen = p.regenPct;
      if (p.regenCrisisMult > 1 && p.hp / p.maxHp <= 0.3) regen *= p.regenCrisisMult;
      const healAmt = Math.max(1, Math.floor(p.maxHp * regen));
      applyPlayerHeal(p, healAmt);
      logEvt("good", `🌿 재생: HP +${healAmt}`);
    }

    // 방패 충전
    if (p && p.shieldRechargeEvery > 0) {
      const roundNum = Math.floor(state.turn / 2) + 1;
      if (roundNum > 0 && roundNum % p.shieldRechargeEvery === 0 && p.shieldCount < p.shieldMax) {
        p.shieldCount = Math.min(p.shieldMax, p.shieldCount + 1);
        logEvt("good", `🛡️ 방패 충전 (${p.shieldCount}/${p.shieldMax})`);
      }
    }

    // 조건부 스탯 — 위기의 힘/필사즉생 (매 라운드 체크하여 임시 버프 적용은 spin 시)
    // 화염방패 공격력 보너스 적용
    if (p && p.shieldBattleAtkBonus > 0) {
      p.damageMult = (p.damageMult || 1.0) * 1; // 이미 damageMult에 반영됨 (apply에서)
    }

    // v2: 콤보강화 턴 tick-down
    if (p && p.comboEnhance) {
      if (p.comboEnhance.berserkerTurns > 0) {
        p.comboEnhance.berserkerTurns -= 1;
        if (p.comboEnhance.berserkerTurns <= 0) {
          // 광전사 버프 해제 (다음 스핀에서 다시 발동 가능)
        }
      }
      if (p.comboEnhance.dominatorTurns > 0) {
        p.comboEnhance.dominatorTurns -= 1;
      }
    }

    // 적 상태이상 tick
    if (e && e.hp > 0) {
      tickEnemyThorn(e);
      tickEnemyHypotherm(e);
      tickEnemyDizzy(e);
    }

    if (typeof tickEquipmentTurnEnd === "function") {
      tickEquipmentTurnEnd();
    }

    state.turn += 1;

    // 망령 성불: 라운드 제한 체크 (턴 2 = 1R 종료 기준)
    if (state.wraithBattle && state.enemy && state.enemy.hp > 0) {
      const roundsUsed = Math.floor(state.turn / 2);
      if (roundsUsed >= state.wraithBattle.roundLimit) {
        logEvt("note", "망령 성불: 7라운드 초과. 성불에 실패했다.");
        logEvt("note", "\"아직... 해방될 때가 아닌 모양이구나.\"");
        resetBattleScopedBonuses();
        state.wraithBattle = null;
        state.enemy = null;
        proceedAfterCampfire();
        return;
      }
    }
  } catch (err) {
    console.error(err);
    const msg = err && err.message ? err.message : String(err);
    logEvt("bad", t("log.error", { value: msg }));
    if (err && err.stack) {
      const first = String(err.stack).split("\n").slice(0, 2).join(" | ");
      logEvt("note", first);
    }
    logEvt("note", t("log.resetHint"));
  } finally {
    if (state.player) state.player.tempMatchDamage = 0;
    if (state.player) state.player.tempDamageMult = 1.0;
    state.petSpinDamageMult = 1.0;
    state.busy = false;
    state.logPhase = null;
    renderAll();
  }
}

function summarizeMatches(matches) {
  // e.g. fire x2 (3,4), water x1 (3)
  const groups = new Map();
  for (const m of matches) {
    const key = m.symbolId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m.len);
  }
  const parts = [];
  for (const [k, lens] of groups.entries()) {
    lens.sort((a, b) => a - b);
    parts.push(`${toLabel(k)} x${lens.length} (${lens.join(",")})`);
  }
  return parts.join(" | ");
}

function resetBattleScopedBonuses() {
  const p = state.player;
  if (!p) return;
  p.shield = 0;
  if (p.status) {
    p.status.burnTurns = 0;
    p.status.burnStacks = 0;
    p.status.burnByTurns = {};
    p.status.bleedTurns = 0;
    p.status.bleedStacks = 0;
    p.status.bleedDmgPerStack = 0;
    p.status.frozenTurns = 0;
    p.status.weakenTurns = 0;
    p.status.lockHTurns = 0;
    p.status.lockVTurns = 0;
    p.status.lockHRow = null;
    p.status.lockVCol = null;
    p.status.invulTurns = 0;
    p.status.talismanSealTurns = 0;
    p.status.tileSealTurns = 0;
    p.status.playerBurnTiles = [];
    p.status.playerFrozenTurns = 0;
    p.status.playerStunTurns = 0;
    p.status.damageReductionShred = 0;
    p.status.damageReductionShredTurns = 0;
    p.status.attackDownRatio = 0;
    p.status.attackDownTurns = 0;
    p.status.stickyCells = [];
  }
  p.elemBonus = {};
  state.turnEvolutionCounter = { fire: 0, light: 0, nature: 0, water: 0 };
  state.turnEvolutionTriggered = { fire: false, light: false, nature: false, water: false };
  state.turnHybridCounter = { light_nature: 0, fire_light: 0, light_water: 0, fire_nature: 0, nature_water: 0, fire_water: 0 };
  state.turnHybridTriggered = { light_nature: false, fire_light: false, light_water: false, fire_nature: false, nature_water: false, fire_water: false };
  if (p.elementEvolutionCounter) {
    p.elementEvolutionCounter.fire = 0;
    p.elementEvolutionCounter.light = 0;
    p.elementEvolutionCounter.nature = 0;
    p.elementEvolutionCounter.water = 0;
  }
  if (typeof resetEquipmentBattleState === "function") {
    resetEquipmentBattleState();
  }
}

function onDefeat() {
  // 망령 성불: 패배해도 탐험 종료 아님
  if (state.wraithBattle) {
    logEvt("note", "망령 성불: 전투에 패배했다. 보상 없이 종료된다.");
    logEvt("note", "\"다음에 다시 오너라...\"");
    const p = state.player;
    if (p.magicShieldStacks > 0) p.magicShieldStacks = 0;
    if (p.magicSpiritCount > 0) { p.luck = Math.max(0, (p.luck || 0) - p.magicSpiritCount * 5); p.magicSpiritCount = 0; }
    p.critChanceBattleBonus = 0;
    p.comboAuraStacks = 0;
    p.shield = 0;
    resetBattleScopedBonuses();
    resetPetBattleState(false);
    // HP 복구 (망령에게 죽었을 때 탐험 종료 방지 — HP를 전투 시작 시 값으로 복원)
    p.hp = Math.max(1, state.battleStartHp || p.hp);
    state.wraithBattle = null;
    proceedAfterCampfire();
    return;
  }

  logEvt("bad", t("log.defeatReset"));
  resetBattleScopedBonuses();
  renderAll();

  // Show game-over modal with return button
  const titleEl = document.getElementById("modalTitle");
  const kickerEl = document.getElementById("modalKicker");
  const messageEl = document.getElementById("modalMessage");
  const hintEl = document.getElementById("modalHint");
  if (kickerEl) kickerEl.textContent = "";
  if (titleEl) titleEl.textContent = t("combat.defeatTitle");
  if (messageEl) messageEl.textContent = `챕터 ${state.chapter} - 스테이지 ${state.stage}에서 쓰러졌습니다.`;
  if (hintEl) hintEl.textContent = "";

  ui.choices.innerHTML = "";
  const btn = document.createElement("div");
  btn.className = "choice";
  btn.innerHTML = `<div class="choice__name">메인으로 돌아가기</div><div class="choice__desc">시작 화면으로 돌아갑니다</div>`;
  btn.addEventListener("click", () => {
    state.started = false;
    closeModal();
    setJourneyMode("idle");
    showStartScreen();
  }, { once: true });
  ui.choices.appendChild(btn);
  openModal();
}

async function onWin() {
  const prepareNextBattleFallback = () => {
    const p = state.player;
    if (!p) return;
    state.wraithBattle = null;
    state.turn = 1;
    state.turnDamage = null;
    resetLogBoxes();
    state.enemy = newEnemy(state.stage, state.chapter);
    showBossIntro(state.enemy);
    state.battleStartHp = p.hp;
    state.grid = rollGrid(p);
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
    applyPetBattleStartPassives(p);
    if (typeof applyEquipmentBattleStartPassives === "function") applyEquipmentBattleStartPassives(p);
    applyBattleStartShield(p);
    setJourneyMode("meet");
    renderAll();
  };

  try {
    // Play defeat effect before anything else
    await playDefeatEffect();
    state.busy = false;
    state.logPhase = null;

  // 망령 성불: 승리 처리 — 사용한 라운드 수로 등급 판정
  if (state.wraithBattle) {
    const p = state.player;
    const roundsUsed = Math.floor(state.turn / 2);
    let rewardGrade;
    if (roundsUsed <= 3) rewardGrade = "SS";
    else if (roundsUsed <= 5) rewardGrade = "S";
    else rewardGrade = "A";
    logEvt("good", `망령 성불 성공! ${roundsUsed}R 클리어, ${rewardGrade} 등급 스킬 보상 획득.`);
    // 전투 상태 정리
    if (p.magicShieldStacks > 0) p.magicShieldStacks = 0;
    if (p.magicSpiritCount > 0) { p.luck = Math.max(0, (p.luck || 0) - p.magicSpiritCount * 5); p.magicSpiritCount = 0; }
    p.critChanceBattleBonus = 0;
    p.comboAuraStacks = 0;
    if (typeof applyEquipmentOnWin === "function") applyEquipmentOnWin(p);
    resetPetBattleState(false);
    state.wraithBattle = null;

    const picks = draftSkillsByGrade(rewardGrade, 1, true);
    if (picks.length > 0) {
      openSimpleEventModal("성불 보상", "", "스킬 하나를 선택하세요", "wraith");
      const msgEl2 = document.getElementById("modalMessage");
      if (msgEl2) {
        msgEl2.innerHTML = `<div class="event-reward event-reward--good"><div class="event-reward__title">${roundsUsed}R 클리어, ${rewardGrade} 등급 스킬 1종 획득</div></div>`
          + `<div class="event-quote">"고맙다... 이제야 쉴 수 있겠구나."</div>`;
      }
      for (const s of picks) {
        addEventChoice(skillName(s), skillShortDesc(s), () => {
          applySkillToPlayer(s);
          closeModal();
          proceedAfterCampfire();
        });
      }
      } else {
        proceedAfterCampfire();
      }
      renderAll();
      return;
    }

  const p = state.player;
  const clearedStage = state.stage;
  p.xpToNext = xpToNextForLevel(p.level);
  const baseXp = Math.floor((clearedStage === 5 ? 100 : 50) * 2.25);
  const gained = state.chapter >= 3 ? baseXp * 2 : baseXp;
  p.xp += gained;
  logEvt("good", t("log.enemyKilled", { value: gained }));

  {
    const isBoss = !!(state.enemy && state.enemy.isBoss);
    const g = goldRewardForWin(state.chapter, state.stage, isBoss);
    META.gold += g;
    saveMeta(META);
    logEvt("good", t("log.goldGain", { value: g }));
  }

  if (p.healOnKill > 0 && p.hp > 0) {
    const res = applyPlayerHeal(p, p.healOnKill);
    if (res.healed > 0) logEvt("good", t("log.killHeal", { value: res.healed }));
    if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
  }

  if (p.victoryBlessing && p.hp > 0) {
    const lostThisBattle = Math.max(0, (state.battleStartHp || p.hp) - p.hp);
    const heal = Math.max(0, lostThisBattle);
    const res = applyPlayerHeal(p, heal);
    if (res.healed > 0) logEvt("good", t("log.victoryBlessing", { value: res.healed }));
    if (res.shield > 0) logEvt("note", `알뜰한 회복 +${res.shield}`);
  }

  if (p.magicShieldStacks > 0) p.magicShieldStacks = 0;
  if (p.magicSpiritCount > 0) {
    p.luck = Math.max(0, (p.luck || 0) - p.magicSpiritCount * 5);
    p.magicSpiritCount = 0;
  }
  p.critChanceBattleBonus = 0;
  p.comboAuraStacks = 0;
  p.shield = 0;
  if (typeof applyEquipmentOnWin === "function") applyEquipmentOnWin(p);
  resetBattleScopedBonuses();
  resetPetBattleState(false);

  setJourneyMode("advance");
  await sleep(360);

  if (clearedStage >= CHAPTER_SIZE) {
    META.unlockedChapter = Math.max(META.unlockedChapter || 1, state.chapter + 1);
    if ((META.selectedChapter || 1) < (META.unlockedChapter || 1)) {
      META.selectedChapter = Math.min(META.unlockedChapter, Math.max(1, META.selectedChapter || 1));
    }
    saveMeta(META);
    logEvt("good", t("log.chapterCleared", { chapter: state.chapter }));
    setJourneyMode("idle");
    renderAll(true);
    showStartScreen();
    return;
  }

  state.stage += 1;
  state.turn = 1;
  state.turnDamage = null;
  resetLogBoxes();
  p.elemBonus = {};
  if (p.shieldCore) p.shieldCore.lastStandUsed = false;

  // v2: 전투 시작 시 방패 초기화
  if (p.shieldStartCount > 0) {
    p.shieldCount = Math.min(p.shieldMax, p.shieldStartCount);
  }
  // v2: 불사 리셋 (매 전투)
  p.immortalUsed = false;

  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level += 1;
    p.xpToNext = xpToNextForLevel(p.level);
    logEvt("good", `레벨 업! Lv.${p.level}`);
    await levelUpDraft();
  }

  const evt = pickEventType(clearedStage);
  if (evt === "wraith") { startWraithEvent(); return; }
  if (evt === "priest") { startPriestEvent(); return; }
  if (evt === "vault") { startRouletteEvent(); return; }

  state.enemy = newEnemy(state.stage, state.chapter);
  showBossIntro(state.enemy);
  state.battleStartHp = state.player.hp;
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
  if (typeof applyEquipmentBattleStartPassives === "function") applyEquipmentBattleStartPassives(state.player);
  applyBattleStartShield(p);
    setJourneyMode("meet");
    renderAll();
  } catch (err) {
    console.error(err);
    logEvt("bad", `승리 처리 중 오류: ${err && err.message ? err.message : String(err)}`);
    prepareNextBattleFallback();
  }
}


const EXCLUSIVE_GROUPS = [
  {
    key: "convert",
    ids: [
      "fire_convert", "water_convert", "light_convert", "nature_convert",
      "dual_convert_fire_light", "dual_convert_fire_nature", "dual_convert_fire_water",
      "dual_convert_light_nature", "dual_convert_light_water", "dual_convert_nature_water",
    ],
  },
  {
    key: "halfSymbol",
    ids: [
      "half_fire_water", "half_fire_light", "half_fire_nature",
      "half_water_light", "half_water_nature", "half_light_nature",
    ],
  },
  {
    key: "shieldElement",
    ids: ["fire_shield", "light_shield", "nature_shield", "ice_shield"],
  },
];

const MAX_DUAL_SIGILS = 2;

function skillGroupKey(skillId) {
  for (const g of EXCLUSIVE_GROUPS) {
    if (g.ids.includes(skillId)) return g.key;
  }
  return null;
}

function declaredBombardElement(owned) {
  if (owned.has("fire_bombard")) return "fire";
  if (owned.has("light_bombard")) return "light";
  if (owned.has("nature_bombard")) return "nature";
  if (owned.has("water_bombard")) return "water";
  return null;
}

function declaredPrimaryElement(owned) {
  if (owned.has("fire_attunement")) return "fire";
  if (owned.has("light_attunement")) return "light";
  if (owned.has("nature_attunement")) return "nature";
  if (owned.has("water_attunement")) return "water";
  return declaredBombardElement(owned);
}

function isDualSigilSkillId(skillId) {
  return (
    skillId === "dual_sigil_fire_light" ||
    skillId === "dual_sigil_fire_nature" ||
    skillId === "dual_sigil_fire_water" ||
    skillId === "dual_sigil_light_nature" ||
    skillId === "dual_sigil_light_water" ||
    skillId === "dual_sigil_nature_water"
  );
}

function countDualSigils(owned) {
  if (!owned) return 0;
  let n = 0;
  for (const id of owned) {
    if (isDualSigilSkillId(id)) n += 1;
  }
  return n;
}

function dualSigilContainsElement(skillId, elementId) {
  if (!isDualSigilSkillId(skillId)) return false;
  const parts = skillId.replace("dual_sigil_", "").split("_");
  return parts.includes(elementId);
}

function hasElementAccess(owned, elementId) {
  if (!owned || !elementId) return false;
  if (owned.has(`${elementId}_attunement`)) return true;
  if (owned.has(`${elementId}_bombard`)) return true;
  for (const id of owned) {
    if (!isDualSigilSkillId(id)) continue;
    if (!dualSigilContainsElement(id, elementId)) continue;
    const parts = id.replace("dual_sigil_", "").split("_");
    const other = parts.find((p) => p !== elementId);
    if (other && (owned.has(`${other}_attunement`) || owned.has(`${other}_bombard`))) return true;
  }
  return false;
}

function hasBurnSkill(owned) {
  if (!owned || owned.size === 0) return false;
  const burnIds = new Set([
    "scorch_marks",
    "ember_spread",
    "purifying_flame",
    "burn_mastery",
    "talisman_ignition",
    "line_rune_burn_row",
    "line_rune_burn_mastery",
    "fire_front",
  ]);
  for (const id of owned) {
    if (burnIds.has(id)) return true;
  }
  return false;
}

function hasFreezeSkill(owned) {
  if (!owned || owned.size === 0) return false;
  const freezeIds = new Set([
    "frost_runes",
    "freeze_mastery",
    "ice_shatter",
    "line_rune_freeze_row",
    "line_rune_freeze_mastery",
  ]);
  for (const id of owned) {
    if (freezeIds.has(id)) return true;
  }
  return false;
}

function shuffledCopy(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function weightedPickOne(items) {
  // items: [{ item, w }]
  const total = items.reduce((a, b) => a + b.w, 0);
  if (total <= 0) return null;
  let x = Math.random() * total;
  for (const it of items) {
    x -= it.w;
    if (x <= 0) return it.item;
  }
  return items[items.length - 1].item;
}

function skillTags(skill) {
  if (!skill || !Array.isArray(skill.tags)) return [];
  return skill.tags.filter(Boolean);
}

function ownedSkillCounts(skills) {
  const map = new Map();
  for (const s of skills || []) {
    if (!s || !s.id) continue;
    map.set(s.id, (map.get(s.id) || 0) + 1);
  }
  return map;
}

function ownedTagSet(skills) {
  const out = new Set();
  for (const s of skills || []) {
    for (const tag of skillTags(s)) out.add(tag);
  }
  return out;
}

function skillBaseWeight(skill) {
  if (skill && Number.isFinite(skill.baseWeight)) return Math.max(0, skill.baseWeight);
  return 10;
}

function skillRarity(skill) {
  const id = String((skill && skill.id) || "");
  if (!id) return "common";
  if (id === "demon_contract") return "legendary";
  if (id === "constellation") return "legendary";
  if (id === "pattern_compass") return "uncommon";
  if (id === "shock_lock") return "uncommon";
  if (id === "photosynthesis") return "uncommon";
  if (id === "ice_armor") return "uncommon";
  if (id.endsWith("_plus") && id.startsWith("line_rune_")) return "uncommon";
  if (id.startsWith("bridge_")) return "uncommon";
  if (id.startsWith("pattern_")) return "rare";
  if (id === "tile_talisman" || id === "tile_talisman_plus") return "rare";
  if (id === "row_talisman" || id === "col_talisman") return "rare";
  if (id.startsWith("forge_talisman_")) return "uncommon";
  if (id.startsWith("line_rune_")) return "uncommon";
  if (id.startsWith("dual_sigil_") || id === "dual_sigil_amplifier") return "uncommon";
  if (id.endsWith("_bombard") || id.startsWith("dual_bombard_")) return "rare";
  return "common";
}

function rarityWeight(rarity) {
  if (rarity === "legendary") return 0.45;
  if (rarity === "rare") return 0.7;
  if (rarity === "uncommon") return 0.9;
  return 1.0;
}

function minLevelForRarity(rarity) {
  if (rarity === "legendary") return 7;
  if (rarity === "rare") return 4;
  if (rarity === "uncommon") return 2;
  return 1;
}

function allowedSkillGradesForLevel(level) {
  if (level === 2) return ["B"];
  return ["B", "A", "S", "SS"];
}

function runEnemyPlayerFailedAttackPassives() {
  const flags = [];
  const procNames = [];
  for (const p of state.enemy?.passives || []) {
    if (!p.onPlayerFailedAttack) continue;
    const beforeFlags = flags.length;
    p.onPlayerFailedAttack({ enemy: state.enemy, player: state.player, flags });
    if (flags.length !== beforeFlags) procNames.push(passiveName(p));
  }
  if (flags.length) logEvt("note", `${enemyName(state.enemy)} 효과: ${flags.join(", ")}`);
  return procNames;
}

function draftGradeWeightsForLevel(level) {
  if (level === 2) return { B: 100 };
  return { B: 25, A: 40, S: 25, SS: 10 };
}

function chooseDraftGrade(level, skills, minCount = 1) {
  const weights = draftGradeWeightsForLevel(level);
  const counts = {};
  for (const skill of skills) {
    const grade = skillGrade(skill);
    if (!grade || !weights[grade]) continue;
    counts[grade] = (counts[grade] || 0) + 1;
  }

  const buildItems = (requiredCount) => Object.entries(counts)
    .filter(([grade, count]) => weights[grade] && count >= requiredCount)
    .map(([grade]) => ({ item: grade, w: weights[grade] }));

  const strictItems = buildItems(minCount);
  if (strictItems.length) return weightedPickOne(strictItems);
  return "";
}

function accessibleElements(owned) {
  const els = ["fire", "light", "nature", "water"];
  const out = [];
  for (const e of els) {
    if (hasElementAccess(owned, e)) out.push(e);
  }
  return out;
}

function skillAffinityElements(skill) {
  return new Set(skillTags(skill));
}

function hasOwnedTagAffinity(skill, ownedCtx) {
  if (!skill || !ownedCtx || !ownedCtx.tags) return false;
  const tags = skillTags(skill);
  if (!tags.length) return false;
  for (const tag of tags) {
    if (ownedCtx.tags.has(tag)) return true;
  }
  return false;
}

function hasOwnedSingleTagAffinity(skill, ownedCtx) {
  if (!skill || !ownedCtx || !ownedCtx.tags) return false;
  const tags = skillTags(skill);
  return tags.length === 1 && ownedCtx.tags.has(tags[0]);
}

const DUAL_FOCUS_BLOCKS_SINGLE_FOCUS = {
  light_nature_focus: ["light_focus", "nature_focus"],
  fire_light_focus: ["fire_focus", "light_focus"],
  water_light_focus: ["water_focus", "light_focus"],
  fire_nature_focus: ["fire_focus", "nature_focus"],
  nature_water_focus: ["nature_focus", "water_focus"],
  fire_water_focus: ["fire_focus", "water_focus"],
};

const SINGLE_DOMINATE_IDS = new Set([
  "fire_dominate",
  "water_dominate",
  "light_dominate",
  "nature_dominate",
]);

function ownedDualFocusIds(ownedCtx) {
  if (!ownedCtx || !ownedCtx.ids) return [];
  return Object.keys(DUAL_FOCUS_BLOCKS_SINGLE_FOCUS).filter((id) => ownedCtx.ids.has(id));
}

function hasOwnedDualFocus(ownedCtx) {
  return ownedDualFocusIds(ownedCtx).length > 0;
}

function isBlockedSingleFocusByOwnedDualFocus(skill, ownedCtx) {
  if (!skill || !ownedCtx || !ownedCtx.ids) return false;
  const id = String(skill.id || "");
  if (!id.endsWith("_focus")) return false;
  for (const [dualId, blockedSingles] of Object.entries(DUAL_FOCUS_BLOCKS_SINGLE_FOCUS)) {
    if (ownedCtx.ids.has(dualId) && blockedSingles.includes(id)) return true;
  }
  return false;
}

function isBlockedSingleDominateByOwnedDualFocus(skill, ownedCtx) {
  if (!skill || !ownedCtx) return false;
  const id = String(skill.id || "");
  if (!SINGLE_DOMINATE_IDS.has(id)) return false;
  return hasOwnedDualFocus(ownedCtx);
}

function isOwnedDualFocusSkill(skill, ownedCtx) {
  if (!skill || !ownedCtx || !ownedCtx.ids) return false;
  const id = String(skill.id || "");
  return Object.prototype.hasOwnProperty.call(DUAL_FOCUS_BLOCKS_SINGLE_FOCUS, id) && ownedCtx.ids.has(id);
}

function isAnyDualFocusSkill(skill) {
  if (!skill) return false;
  return Object.prototype.hasOwnProperty.call(DUAL_FOCUS_BLOCKS_SINGLE_FOCUS, String(skill.id || ""));
}
// v2: 속성 독점/각성 계열 — 태그 매칭 보너스에서 제외 (모든 속성에 적용 가능하므로)
const ELEMENT_POWER_SERIES_IDS = new Set([
  "element_monopoly",
  "mono_awakening",
]);

function isUpgradeSkill(skill) {
  if (!skill) return false;
  const id = String(skill.id || "");
  if (id.includes("_plus")) return true;
  if (id.includes("_mastery")) return true;
  if (id.startsWith("line_rune_") && id.endsWith("_mastery")) return true;
  return false;
}

function skillDraftWeight(skill, ownedCtx) {
  let w = skillBaseWeight(skill);

  const tags = skillTags(skill);
  const id = String((skill && skill.id) || "");
  const lv = state && state.player ? state.player.level : 1;

  // ── 1. 엔진 스킬 baseWeight 보정 (v1 복원) ──
  // 변환 스킬: v1에서 single_convert=80, dual_convert=40
  if (id.endsWith("_convert")) w *= 4.0;           // 속성변환: 강한 엔진
  else if (id.startsWith("dual_convert_")) w *= 3.0; // 이중변환: 엔진
  else if (id.endsWith("_focus")) w *= 2.0;         // 속성집중: 빌드 씨앗
  else if (id === "ember" || id === "thunder_symbol" || id === "thunderbolt" || id === "thorn" || id === "ice_shard") w *= 2.5; // 특수심볼: 빌드 정체성
  else if (id.startsWith("half_")) w *= 1.8;        // 반반심볼

  // ── 2. 태그 매칭 빌드 집중 ──
  // 이미 보유한 태그와 매칭되면 크게 가중 (빌드 집중 유도)
  // 초반(lv<5)에는 더 강하게 집중 → v1의 빌드 집중감 복원
  // 속성 독점/각성은 모든 빌드에서 범용이므로 태그 보너스 제외 (v1 호환)
  if (ownedCtx && ownedCtx.tags && tags.length && !ELEMENT_POWER_SERIES_IDS.has(id)) {
    const tagMult = lv < 5 ? 24.0 : 20.0;
    for (const tag of tags) {
      if (ownedCtx.tags.has(tag)) w *= tagMult;
    }
  }

  if (hasOwnedDualFocus(ownedCtx) && isAnyDualFocusSkill(skill)) {
    w *= 1.8;
  }
  if (isOwnedDualFocusSkill(skill, ownedCtx)) {
    w *= 2.4;
  }

  // 태그가 있는 스킬은 기본적으로 한 번 더 우대해서, 공용보다 속성 빌드 스킬이 잘 보이게 한다.
  if (tags.length > 0) {
    w *= 2.1;
  }

  // ── 3. 범용/부적 가중치 조정 (v1 복원) ──
  if (!tags.length) {
    // 공용 스킬 과다 노출 방지: 부적은 더 낮게, 일반 공용도 태그 스킬보다 낮게.
    if (id.includes("_talisman") || id.includes("talisman_")) {
      w *= 0.3375;
    } else {
      w *= 0.5625;
    }
  }

  // ── 4. 변환 스킬 추가 가중 ──
  if (id.endsWith("_convert") || id.startsWith("dual_convert_")) {
    w *= 1.35;
  }

  return w;
}

function xpToNextForLevel(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  return 50 + ((lv - 1) * 25);
}

function guaranteedFallbackSkillIdsForGrade(grade) {
  switch (String(grade || "").toUpperCase()) {
    case "B":
      return ["atk_up_1", "crit_chance_1", "max_hp_up", "crit_dmg_1", "shield_create", "rune_engrave"];
    case "A":
      return ["atk_up_2", "crit_chance_2", "max_hp_up_2", "crit_dmg_2", "shield_enhance", "combo_accel"];
    case "S":
      return ["atk_up_3", "crit_chance_3", "max_hp_up_3", "crit_dmg_3", "crisis_power", "desperation", "fortitude"];
    case "SS":
      return ["damage_amp", "damage_reduce", "reversal_will", "angel_wing", "true_immortal"];
    default:
      return [];
  }
}

function guaranteedFallbackSkillsForGrade(grade) {
  const byId = new Map(SKILLS.map((skill) => [skill.id, skill]));
  return guaranteedFallbackSkillIdsForGrade(grade)
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((skill) => ({ ...skill }));
}

function draftSkillsByGrade(targetGrade, count = 2, eventOnly = false) {
  const ownedIds = new Set((state.player.skills || []).map((s) => s.id));
  const ownedCounts = ownedSkillCounts(state.player.skills || []);
  const ownedTags = ownedTagSet(state.player.skills || []);
  const ownedCtx = { ids: ownedIds, counts: ownedCounts, tags: ownedTags };
  const lockedGroups = new Set();
  for (const g of EXCLUSIVE_GROUPS) {
    if (g.ids.some((id) => ownedIds.has(id))) lockedGroups.add(g.key);
  }
  const pool = SKILLS.filter(s => {
    if (eventOnly ? !s.eventOnly : s.eventOnly) return false;
    if (s.firstPickOnly) return false;
    if (isBlockedSingleFocusByOwnedDualFocus(s, ownedCtx)) return false;
    if (isBlockedSingleDominateByOwnedDualFocus(s, ownedCtx)) return false;
    const grade = skillGrade(s);
    if (grade !== targetGrade.toUpperCase()) return false;
    const maxStacks = Number.isFinite(s.maxStacks) ? s.maxStacks : 1;
    if (maxStacks > 0 && (ownedCounts.get(s.id) || 0) >= maxStacks) return false;
    const gk = skillGroupKey(s.id);
    if (gk && lockedGroups.has(gk) && !ownedIds.has(s.id)) return false;
    if (typeof s.requires === "function") {
      try {
        if (!s.requires(ownedCtx)) return false;
      } catch (err) {
        console.warn("[draft-requires-error]", s && s.id, err);
        return false;
      }
    }
    return true;
  });
  return shuffledCopy(pool).slice(0, Math.min(count, pool.length));
}

function draftSkills(n = 3) {
  const ownedIds = new Set(state.player.skills.map((s) => s.id));
  const ownedCounts = ownedSkillCounts(state.player.skills);
  const ownedTags = ownedTagSet(state.player.skills);
  const ownedCtx = { ids: ownedIds, counts: ownedCounts, tags: ownedTags };
  const forceCommonOnly = false;

  // If you already own one skill from an exclusive group, the rest should never appear.
  const lockedGroups = new Set();
  for (const g of EXCLUSIVE_GROUPS) {
    if (g.ids.some((id) => ownedIds.has(id))) lockedGroups.add(g.key);
  }

  const allowedGrades = new Set(allowedSkillGradesForLevel(state.player.level));
  const pool = SKILLS.filter((s) => {
    if (s.eventOnly) return false;
    if (s.firstPickOnly) return false;
    if (isBlockedSingleFocusByOwnedDualFocus(s, ownedCtx)) return false;
    if (isBlockedSingleDominateByOwnedDualFocus(s, ownedCtx)) return false;
    const grade = skillGrade(s);
    if (!grade || !allowedGrades.has(grade)) return false;
    const maxStacks = Number.isFinite(s.maxStacks) ? s.maxStacks : 1;
    if (maxStacks > 0 && (ownedCounts.get(s.id) || 0) >= maxStacks) return false;
    if (s.minLevel && state.player.level < s.minLevel) return false;
    const gk = skillGroupKey(s.id);
    if (gk && lockedGroups.has(gk) && !ownedIds.has(s.id)) return false;

    if (typeof s.requires === "function") {
      try {
        if (!s.requires(ownedCtx)) return false;
      } catch (err) {
        console.warn("[draft-requires-error]", s && s.id, err);
        return false;
      }
    }

    return true;
  });

  let targetDraftGrade = chooseDraftGrade(state.player.level, pool, Math.min(n, 3));
  if (!targetDraftGrade && pool.length) {
    const gradeCounts = new Map();
    for (const skill of pool) {
      const grade = skillGrade(skill);
      if (!grade) continue;
      gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
    }
    targetDraftGrade = [...gradeCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }
  let gradePool = pool
    .filter((skill) => !targetDraftGrade || skillGrade(skill) === targetDraftGrade)
    .map((s) => ({ ...s }));
  if (gradePool.length < n) {
    targetDraftGrade = chooseDraftGrade(state.player.level, pool, n) || chooseDraftGrade(state.player.level, pool, 1) || targetDraftGrade;
    gradePool = pool
      .filter((skill) => !targetDraftGrade || skillGrade(skill) === targetDraftGrade)
      .map((s) => ({ ...s }));
  }

  const hasAffinity = (skill) => !forceCommonOnly && ownedTags.size && hasOwnedTagAffinity(skill, ownedCtx);
  const isCommonSkill = (skill) => skillTags(skill).length === 0;

  // Weighted draft without replacement.
  // Order:
  // 1. same grade + owned tag affinity
  // 2. same grade + common skills
  // 3. same grade + any remaining skills
  const picks = [];
  const remaining = [...gradePool];
  const usedGroups = new Set();
  const usedAxes = new Set();
  let talismanPickCount = 0;
  const isLineTalismanSkill = (skill) => {
    const id = String((skill && skill.id) || "");
    return id.includes("_talisman") || id.includes("talisman_");
  };

  const pickOneFrom = (cands) => {
    const weighted = [];
    for (const s of cands) {
      if (isLineTalismanSkill(s) && talismanPickCount >= 1) continue;
      const gk = skillGroupKey(s.id);
      if (gk && usedGroups.has(gk)) continue;
      let w = skillDraftWeight(s, ownedCtx);
      if (w <= 0) continue;

      if (forceCommonOnly) {
        const id = String((s && s.id) || "");
        if (id.includes("_talisman") || id.includes("talisman_")) w *= 0.55;
      }

      const ax = skillAxis(s);
      if (!usedAxes.has(ax)) w *= 1.35;

      weighted.push({ item: s, w });
    }
    if (!weighted.length) return null;
    return weightedPickOne(weighted);
  };

  for (let i = 0; i < n && remaining.length; i++) {
    let pick = null;

    const affinityCandidates = remaining.filter((s) => hasAffinity(s));
    if (affinityCandidates.length) {
      const nonTalismanAffinity = affinityCandidates.filter((s) => !isLineTalismanSkill(s));
      pick = pickOneFrom(nonTalismanAffinity.length ? nonTalismanAffinity : affinityCandidates);
    }

    if (!pick) {
      const commonCandidates = remaining.filter((s) => isCommonSkill(s));
      if (commonCandidates.length) {
        const nonTalismanCommon = commonCandidates.filter((s) => !isLineTalismanSkill(s));
        pick = pickOneFrom(nonTalismanCommon.length ? nonTalismanCommon : commonCandidates);
      }
    }

    if (!pick) {
      const nonTalismanRemaining = remaining.filter((s) => !isLineTalismanSkill(s));
      pick = pickOneFrom(nonTalismanRemaining.length ? nonTalismanRemaining : remaining);
    }

    if (!pick) break;

    picks.push(pick);
    if (isLineTalismanSkill(pick)) talismanPickCount += 1;
    const gk = skillGroupKey(pick.id);
    if (gk) usedGroups.add(gk);
    usedAxes.add(skillAxis(pick));
    const idx = remaining.findIndex((x) => x.id === pick.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  if (picks.length < n) {
    const fallbackCommons = gradePool.filter((s) => isCommonSkill(s) && !picks.some((p) => p.id === s.id));
    for (const skill of fallbackCommons) {
      if (picks.length >= n) break;
      picks.push(skill);
    }
  }

  if (picks.length < n) {
    const fallbackAny = gradePool.filter((s) => !picks.some((p) => p.id === s.id));
    for (const skill of fallbackAny) {
      if (picks.length >= n) break;
      picks.push(skill);
    }
  }

  if (picks.length < n && targetDraftGrade) {
    const emergencyPool = SKILLS.filter((s) => {
      if (s.eventOnly || s.firstPickOnly) return false;
      if (skillGrade(s) !== targetDraftGrade) return false;
      const maxStacks = Number.isFinite(s.maxStacks) ? s.maxStacks : 1;
      if (maxStacks > 0 && (ownedCounts.get(s.id) || 0) >= maxStacks) return false;
      const gk = skillGroupKey(s.id);
      if (gk && lockedGroups.has(gk) && !ownedIds.has(s.id)) return false;
      if (typeof s.requires === "function") {
        try {
          if (!s.requires(ownedCtx)) return false;
        } catch (err) {
          console.warn("[draft-requires-error]", s && s.id, err);
          return false;
        }
      }
      return !picks.some((p) => p.id === s.id);
    });
    for (const skill of shuffledCopy(emergencyPool)) {
      if (picks.length >= n) break;
      picks.push(skill);
    }
  }

  // Avoid role/position lock feel (e.g. 1st/3rd always talisman-like).
  for (let i = picks.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    const tmp = picks[i];
    picks[i] = picks[j];
    picks[j] = tmp;
  }

  if (!picks.length && pool.length) {
    const backupGrade = chooseDraftGrade(state.player.level, pool, 1) || skillGrade(pool[0]);
    const backup = shuffledCopy(pool.filter((s) => skillGrade(s) === backupGrade)).slice(0, n);
    return backup;
  }

  if (picks.length < n && gradePool.length) {
    const duplicatePool = gradePool.filter((s) => isCommonSkill(s)).length
      ? gradePool.filter((s) => isCommonSkill(s))
      : gradePool;
    let cursor = 0;
    while (picks.length < n && duplicatePool.length) {
      const base = duplicatePool[cursor % duplicatePool.length];
      picks.push({ ...base });
      cursor += 1;
    }
  }

  if (picks.length < n) {
    const fallbackGrade = targetDraftGrade || chooseDraftGrade(state.player.level, pool, 1) || "B";
    const fallbackPool = guaranteedFallbackSkillsForGrade(fallbackGrade);
    let cursor = 0;
    while (picks.length < n && fallbackPool.length) {
      const base = fallbackPool[cursor % fallbackPool.length];
      picks.push({ ...base });
      cursor += 1;
    }
  }

  return picks.slice(0, n);
}

// ── 규칙 1: 첫 선택은 반드시 속성 집중(B등급) 스킬 ──
const DOMINATE_IDS = [
  "fire_focus", "water_focus", "light_focus", "nature_focus",
  "light_nature_focus", "fire_light_focus", "water_light_focus",
  "fire_nature_focus", "nature_water_focus", "fire_water_focus",
];

const START_CONVERT_IDS = [
  "fire_convert", "water_convert", "light_convert", "nature_convert",
  "dual_convert_light_nature", "dual_convert_fire_light", "dual_convert_light_water",
  "dual_convert_fire_nature", "dual_convert_nature_water", "dual_convert_fire_water",
];

function draftFirstPick(n = 3) {
  const pool = SKILLS.filter(s => DOMINATE_IDS.includes(s.id));
  // Fisher-Yates 셔플
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

function draftSecondStartPick(n = 3) {
  const pool = SKILLS.filter(s => START_CONVERT_IDS.includes(s.id));
  const ownedIds = new Set((state.player.skills || []).map((s) => s.id));
  const ownedCounts = ownedSkillCounts(state.player.skills || []);
  const ownedTags = ownedTagSet(state.player.skills || []);
  const ownedCtx = { ids: ownedIds, counts: ownedCounts, tags: ownedTags };
  const exactAffinity = pool.filter((s) => {
    const tags = skillTags(s);
    return tags.length > 0 && tags.every((t) => ownedCtx.tags.has(t));
  });
  const partialAffinity = pool.filter((s) => {
    if (exactAffinity.some((a) => a.id === s.id)) return false;
    return hasOwnedTagAffinity(s, ownedCtx);
  });
  const others = pool.filter((s) => {
    if (exactAffinity.some((a) => a.id === s.id)) return false;
    if (partialAffinity.some((a) => a.id === s.id)) return false;
    return true;
  });
  const ordered = [
    ...shuffledCopy(exactAffinity),
    ...shuffledCopy(partialAffinity),
    ...shuffledCopy(others),
  ];
  return ordered.slice(0, n);
}

function buildSafeLevelUpPicks(n = 3, forcedGrade = "") {
  const ownedIds = new Set(state.player.skills.map((s) => s.id));
  const ownedCounts = ownedSkillCounts(state.player.skills);
  const ownedTags = ownedTagSet(state.player.skills);
  const ownedCtx = { ids: ownedIds, counts: ownedCounts, tags: ownedTags };
  const lockedGroups = new Set(
    state.player.skills
      .map((s) => skillGroupKey(s && s.id))
      .filter(Boolean)
  );
  const allowedGrades = allowedSkillGradesForLevel(state.player.level);
  const level2FocusOnlyIds = new Set([
    "fire_focus", "water_focus", "light_focus", "nature_focus",
    "light_nature_focus", "fire_light_focus", "water_light_focus",
    "fire_nature_focus", "nature_water_focus", "fire_water_focus",
  ]);

  const pool = SKILLS.filter((s) => {
    if (s.eventOnly || s.firstPickOnly) return false;
    if (isBlockedSingleFocusByOwnedDualFocus(s, ownedCtx)) return false;
    if (isBlockedSingleDominateByOwnedDualFocus(s, ownedCtx)) return false;
    const grade = skillGrade(s);
    if (!allowedGrades.includes(grade)) return false;
    if (state.player.level === 2 && !level2FocusOnlyIds.has(s.id)) return false;
    const maxStacks = Number.isFinite(s.maxStacks) ? s.maxStacks : 1;
    if (maxStacks > 0 && (ownedCounts.get(s.id) || 0) >= maxStacks) return false;
    const gk = skillGroupKey(s.id);
    if (gk && lockedGroups.has(gk) && !ownedIds.has(s.id)) return false;
    if (typeof s.requires === "function") {
      try {
        if (!s.requires(ownedCtx)) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  let targetGrade = forcedGrade && allowedGrades.includes(forcedGrade) ? forcedGrade : chooseDraftGrade(state.player.level, pool, 1);
  if (!targetGrade) {
    targetGrade = allowedGrades[0] || "B";
  }

  const gradePool = shuffledCopy(pool.filter((s) => skillGrade(s) === targetGrade));
  const exactSingleAffinity = gradePool.filter((s) => hasOwnedSingleTagAffinity(s, ownedCtx));
  const affinity = gradePool.filter((s) => !exactSingleAffinity.some((a) => a.id === s.id) && hasOwnedTagAffinity(s, ownedCtx));
  const commons = gradePool.filter((s) => skillTags(s).length === 0);
  const others = gradePool.filter((s) =>
    !exactSingleAffinity.some((a) => a.id === s.id) &&
    !affinity.some((a) => a.id === s.id) &&
    !commons.some((c) => c.id === s.id)
  );

  const picks = [];
  const pushUnique = (list) => {
    for (const skill of list) {
      if (picks.length >= n) break;
      if (picks.some((p) => p.id === skill.id)) continue;
      picks.push({ ...skill });
    }
  };

  if (targetGrade === "B") {
    pushUnique(exactSingleAffinity);
    pushUnique(commons);
    pushUnique(affinity);
    pushUnique(others);
  } else {
    pushUnique(exactSingleAffinity);
    pushUnique(affinity);
    pushUnique(commons);
    pushUnique(others);
  }

  if (picks.length < n) {
    const fallback = (state.player.level === 2)
      ? shuffledCopy(SKILLS.filter((s) => level2FocusOnlyIds.has(s.id) && skillGrade(s) === "B"))
      : guaranteedFallbackSkillsForGrade(targetGrade);
    let cursor = 0;
    while (picks.length < n && fallback.length) {
      picks.push({ ...fallback[cursor % fallback.length] });
      cursor += 1;
    }
  }

  const shouldForceElemental = state.player.level > 0 && state.player.level % 3 === 0;
  if (shouldForceElemental) {
    const hasElementalPick = picks.some((s) => skillTags(s).length > 0);
    if (!hasElementalPick) {
      const elementalFallback = [
        ...exactSingleAffinity,
        ...affinity,
        ...others.filter((s) => skillTags(s).length > 0),
      ].find((s) => !picks.some((p) => p.id === s.id));
      if (elementalFallback) {
        const replaceIdx = picks.findIndex((s) => skillTags(s).length === 0);
        if (replaceIdx >= 0) picks[replaceIdx] = { ...elementalFallback };
        else if (picks.length < n) picks.push({ ...elementalFallback });
      }
    }
  }

  return picks.slice(0, n);
}

function levelUpDraft() {
  return new Promise((resolve) => {
    setModalArt(null);
    const startingDraftRemaining = Number(state.startingDraftRemaining || 0);
    const inStartingDraft = startingDraftRemaining > 0;
    const forcedGrade = "";
    let picks = [];
    try {
      picks = buildSafeLevelUpPicks(3);
    } catch (err) {
      console.warn("[levelup-draft-error]", { level: state.player.level, err });
      picks = guaranteedFallbackSkillsForGrade(allowedSkillGradesForLevel(state.player.level)[0] || "B").slice(0, 3);
    }
    if (picks.length < 3) {
      const fallbackGrade = chooseDraftGrade(state.player.level, SKILLS.filter((s) => {
        if (s.eventOnly || s.firstPickOnly) return false;
        return allowedSkillGradesForLevel(state.player.level).includes(skillGrade(s));
      }), 1) || "B";
      const fallback = guaranteedFallbackSkillsForGrade(fallbackGrade);
      let cursor = 0;
      while (picks.length < 3 && fallback.length) {
        picks.push({ ...fallback[cursor % fallback.length] });
        cursor += 1;
      }
    }
    ui.choices.innerHTML = "";
    if (!picks.length) {
      logEvt("note", t("log.levelUpEmpty"));
      resolve();
      return;
    }

    const titleEl = document.getElementById("modalTitle");
    const kickerEl = document.getElementById("modalKicker");
    const messageEl = document.getElementById("modalMessage");
    const hintEl = document.getElementById("modalHint");
    if (kickerEl) kickerEl.textContent = t("ui.levelUp");
    if (titleEl) titleEl.textContent = t("ui.chooseSkill");
    if (messageEl) messageEl.textContent = "";
    if (hintEl) hintEl.textContent = t("ui.chooseOne");

    openModal();
    renderAll();

    const done = (skill) => {
      applySkillToPlayer(skill);
      recalcShieldCorePlating(state.player);
      if (state.startingDraftRemaining > 0) {
        state.startingDraftRemaining = Math.max(0, state.startingDraftRemaining - 1);
      }
      closeModal();
      renderAll();
      resolve();
    };

    // 등급 → grade icon 매핑
    const GRADE_ICON_MAP = { B: 2, A: 3, S: 4, SS: 5 };

    // 스킬 ID → 아이콘 파일번호 매핑
    const SKILL_ICON_MAP = {
      // ===== 속성 확률업 (Rate Up) =====
      "light_rate_up": "skill_1013",
      "nature_rate_up": "skill_1012",
      "fire_rate_up": "skill_1010",
      "water_rate_up": "skill_1011",

      // ===== 이중 변환 (Dual Convert) =====
      "dual_convert_light_nature": "skill_1104",
      "dual_convert_fire_light": "skill_1105",
      "dual_convert_light_water": "skill_1106",
      "dual_convert_fire_nature": "skill_1107",
      "dual_convert_nature_water": "skill_1108",
      "dual_convert_fire_water": "skill_1109",

      // ===== 단일 변환 (Single Convert) =====
      "light_convert": "skill_1100",
      "nature_convert": "skill_1101",
      "fire_convert": "skill_1102",
      "water_convert": "skill_1103",

      // ===== 변환 강화/진화 =====
      "fire_erode": "skill_1102",
      "water_erode": "skill_1103",
      "light_erode": "skill_1100",
      "nature_erode": "skill_1101",
      "dual_convert_master": "skill_0000",

      // ===== 룬 =====
      "common_double_rune": "skill_0015",
      "common_crit_rune": "skill_0016",

      // ===== 스탯 =====
      "stat_attack_up": "skill_0075",
      "stat_max_hp_up": "skill_0078",
      "stat_evasion_up": "skill_1008",

      // ===== 속성 고수/장인/정점 =====
      "light_master": "skill_0083",
      "light_artisan": "skill_0090",
      "light_pinnacle": "skill_0090",
      "nature_master": "skill_0084",
      "nature_artisan": "skill_0091",
      "nature_pinnacle": "skill_0091",
      "fire_master": "skill_0085",
      "fire_artisan": "skill_0092",
      "fire_pinnacle": "skill_0092",
      "water_master": "skill_0086",
      "water_artisan": "skill_0093",
      "water_pinnacle": "skill_0093",

      // ===== 콤보 =====
      "combo_attack": "skill_0072",
      "combo_aura": "skill_0072",
      "combo_magic_sword": "skill_0000",

      // ===== 기본 공격 진화 =====
      "basic_attack_evolution_chain": "skill_0075",
      "basic_attack_evolution_one_shot": "skill_0075",
      "basic_attack_evolution_chain_plus": "skill_0075",
      "basic_attack_evolution_one_shot_plus": "skill_0075",

      // ===== 속성 심볼 추가 (천둥/가시/불씨/얼음) =====
      "light_thunder_add": "skill_1114",
      "nature_thorn_add": "skill_1111",
      "fire_flame_add": "skill_1112",
      "water_ice_add": "skill_1113",

      // ===== 미니 추가타 =====
      "light_mini_bolt": "skill_1038",
      "nature_mini_gale": "skill_0053",
      "fire_mini_blast": "skill_1020",
      "water_mini_wave": "skill_1027",

      // ===== 미니 강화 (번개) =====
      "light_random_mini_bolt": "skill_0070",
      "light_pierce_shield_mini_bolt": "skill_0070",
      "light_super_mini_bolt": "skill_0070",

      // ===== 미니 강화 (자연) =====
      "nature_double_mini_gale": "skill_0053",
      "nature_dizzy_mini_gale": "skill_0053",
      "nature_super_mini_gale": "skill_0053",

      // ===== 미니 강화 (불) =====
      "fire_strong_mini_blast": "skill_1023",
      "fire_armor_break_blast": "skill_1024",
      "fire_super_mini_blast": "skill_1023",

      // ===== 미니 강화 (물) =====
      "water_cleanse_mini_wave": "skill_1027",
      "water_guard_mini_wave": "skill_0064",
      "water_super_mini_wave": "skill_1027",

      // ===== 심볼 변형 추가 (낙뢰/회복/파워/보호) =====
      "light_chain_add": "skill_1114",
      "nature_heal_add": "skill_1115",
      "fire_power_add": "skill_1116",
      "water_slip_add": "skill_1117",

      // ===== 이중속성 콤보 스킬 =====
      "combo_light_nature": "skill_1118",
      "combo_light_fire": "skill_1119",
      "combo_light_water": "skill_1120",
      "combo_nature_fire": "skill_1121",
      "combo_nature_water": "skill_1122",
      "combo_fire_water": "skill_1123",

      // ===== 이중속성 콤보 강화 =====
      "combo_light_fire_overheat": "skill_1119",
      "combo_light_nature_break_shield": "skill_1118",
      "combo_light_water_super": "skill_1120",
      "combo_nature_fire_dot_plus": "skill_1121",
      "combo_nature_water_cleanse": "skill_1122",
      "combo_fire_water_warm": "skill_1123",

      // ===== 가로/세로 심볼 추가 =====
      "light_row_add": "skill_9901",
      "nature_row_add": "skill_9902",
      "fire_row_add": "skill_9903",
      "water_row_add": "skill_9904",
      "light_col_add": "skill_9901",
      "nature_col_add": "skill_9902",
      "fire_col_add": "skill_9903",
      "water_col_add": "skill_9904",

      // ===== 부적 =====
      "row_talisman_heal": "skill_0013",
      "row_talisman_guard": "skill_0013",
      "row_talisman_double": "skill_0013",
      "col_talisman_heal": "skill_0012",
      "col_talisman_guard": "skill_0012",
      "col_talisman_double": "skill_0012",

      // ===== 상태이상 특화 =====
      "light_stun_vulnerable": "skill_1042",
      "nature_bleed_mastery": "skill_1036",
      "fire_burn_mastery": "skill_1021",
      "water_cold": "skill_1027",

      // ===== 행운 =====
      "luck_up": "skill_0003",
      "luck_efficiency": "skill_0004",
      "luck_efficiency_plus": "skill_0005",
      "luck_double_check": "skill_0002",
      "luck_power": "skill_0009",
      "luck_meteor": "skill_0008",

      // ===== 특수/이벤트 스킬 =====
      "demon_contract": "skill_7001",
      "shining_star": "skill_7002",
      "victory_blessing": "skill_7004",
      "full_prepared": "icon_skill_priest_005",
      "knight_shield": "skill_1014",
      "knight_sword": "skill_0022",
      "last_stand": "skill_1056",
      "revive_once": "skill_7004",
      "low_hp_immunity": "skill_0000",
      "heaven_punish": "skill_7005",
      "frugal_heal": "skill_1055",
      "last_breath": "skill_0000",
      "shield_fury": "skill_0000",
      "magic_sword": "skill_0017",
      "magic_shield": "skill_1014",
      "magic_spirit": "skill_0000",

      // ===== 심볼 변형 등장 확률 증가 =====
      "light_thunder_rate_up": "skill_1114",
      "nature_thorn_rate_up": "skill_1111",
      "fire_flame_rate_up": "skill_1112",
      "water_ice_rate_up": "skill_1113",

      // ===== 더 큰 심볼 =====
      "light_big_thunder": "skill_1114",
      "nature_big_thorn": "skill_1111",
      "fire_big_flame": "skill_1112",
      "water_big_ice": "skill_1113",

      // ===== 출혈/화상 강화 =====
      "bleed_double": "skill_0060",
      "burn_scar": "skill_0058",
      "frostbite": "skill_0071",
      "thor_hammer": "skill_0065",
      "nature_bleed_bypass": "skill_0060",
      "nature_status_cleanse": "skill_0000",

      // ===== 심볼 변형 등장/강화 =====
      "light_chain_rate_up": "skill_1110",
      "nature_heal_rate_up": "skill_1115",
      "fire_power_rate_up": "skill_1116",
      "water_slip_rate_up": "skill_1117",
      "light_chain_upgrade": "skill_1114",
      "heal_mastery": "skill_1032",
      "power_fire_mastery": "skill_1116",
      "slip_mastery": "skill_1117",
      "chain_mastery": "skill_0070",
      "fire_power_persist": "skill_1116",

      // ===== 슈퍼 심볼 =====
      "super_light_chain": "skill_1114",
      "super_nature_heal": "skill_1115",
      "super_fire_power": "skill_1116",
      "super_water_guard": "skill_1117",

      // ===== 잭팟 =====
      "jackpot_lightning": "skill_9901",
      "jackpot_nature": "skill_9902",
      "jackpot_fire": "skill_9903",
      "jackpot_water": "skill_9904",

      // ===== 반반 심볼 =====
      "half_fire_light": "skill_1119",
      "half_water_nature": "skill_1122",
      "half_fire_water": "skill_1123",
      "half_fire_nature": "skill_1121",
      "half_water_light": "skill_1120",
      "half_light_nature": "skill_1118",
      "half_fire_light_2": "skill_1119",
      "half_water_nature_2": "skill_1122",
      "half_fire_water_2": "skill_1123",
      "half_fire_nature_2": "skill_1121",
      "half_water_light_2": "skill_1120",
      "half_light_nature_2": "skill_1118",

      // ===== 이중 속성 집중/지배 =====
      "light_nature_focus": "skill_1118",
      "fire_light_focus": "skill_1119",
      "water_light_focus": "skill_1120",
      "fire_nature_focus": "skill_1121",
      "nature_water_focus": "skill_1122",
      "fire_water_focus": "skill_1123",
      "light_nature_dominate": "skill_1118",
      "fire_light_dominate": "skill_1119",
      "water_light_dominate": "skill_1120",
      "fire_nature_dominate": "skill_1121",
      "nature_water_dominate": "skill_1122",
      "fire_water_dominate": "skill_1123",

      // ===== 이중 속성 강화 =====
      "lightning_gale": "skill_1118",
      "plasma": "skill_1119",
      "electrocute": "skill_1120",
      "purifying_flame": "skill_1121",
      "tidal": "skill_1122",
      "steam_blast": "skill_1123",

      // ===== 추가 스탯 =====
      "max_hp_up_2": "skill_1007",
      "max_hp_up_3": "skill_1007",
      "crit_chance_3": "skill_1006",
      "crit_dmg_3": "skill_1004",
      "damage_amp": "skill_1002",
      "damage_reduce": "skill_1003",
      "healthy_body": "skill_1001",
      "perfect_condition": "skill_1006",

      // ===== 망령 이벤트 =====
      "wraith_row_check_1": "skill_1025",
      "wraith_col_check_1": "skill_1026",
      "wraith_row_check_2": "skill_1025",
      "wraith_col_check_2": "skill_1026",
      "wraith_row_check_3": "skill_1025",
      "wraith_col_check_3": "skill_1026",

      // ===== 반사 방패 =====
      "light_reflect_shield": "skill_0025",
      "nature_reflect_shield": "skill_0026",
      "fire_reflect_shield": "skill_0027",
      "water_reflect_shield": "skill_0028",
      "hp_reflect_shield": "skill_0029",
      "light_reflect_shield_up": "skill_0030",
      "nature_reflect_shield_up": "skill_0031",
      "fire_reflect_shield_up": "skill_0032",
      "water_reflect_shield_up": "skill_0033",
      "hp_reflect_shield_up": "skill_0029",
      "light_reflect_shield_super": "skill_0030",
      "nature_reflect_shield_super": "skill_0031",
      "fire_reflect_shield_super": "skill_0032",
      "water_reflect_shield_super": "skill_0033",
      "hp_reflect_shield_super": "skill_0029",

      // ===== 속성 집중/지배 (Focus / Dominate) =====
      "fire_focus": "skill_1010",
      "water_focus": "skill_1011",
      "light_focus": "skill_1013",
      "nature_focus": "skill_1012",
      "fire_dominate": "skill_1045",
      "water_dominate": "skill_1046",
      "light_dominate": "skill_1048",
      "nature_dominate": "skill_1047",
      "element_monopoly": "skill_0000",
      "mono_awakening": "skill_0000",

      // ===== 속성 방패 =====
      "fire_shield": "skill_0027",
      "light_shield": "skill_0025",
      "nature_shield": "skill_0026",
      "ice_shield": "skill_0028",

      // ===== 불씨/화상 계열 =====
      "ember": "skill_1112",
      "ember_2": "skill_1112",
      "ember_boost": "skill_1021",
      "ember_special_boost": "skill_1023",
      "inferno": "skill_1024",
      "shield_melt": "skill_1024",

      // ===== 얼음/빙결 계열 =====
      "ice_shard": "skill_1113",
      "ice_2": "skill_1113",
      "ice_boost": "skill_1113",
      "ice_spear": "skill_0057",
      "ice_spear_fast": "skill_0057",
      "ice_spear_ultra": "skill_0057",
      "ice_special_boost": "skill_1027",
      "ice_age": "skill_1026",
      "permafrost": "skill_1026",

      // ===== 가시/출혈 계열 =====
      "thorn": "skill_1111",
      "thorn_2": "skill_1111",
      "thorn_boost": "skill_1036",
      "thorn_special_boost": "skill_1035",
      "hemorrhage": "skill_1036",

      // ===== 천둥/기절 계열 =====
      "thunder_symbol": "skill_1110",
      "thunder_symbol_2": "skill_1110",
      "thunder_symbol_boost": "skill_1110",
      "thunderbolt": "skill_1114",
      "daze": "skill_1042",
      "dizzy_boost": "skill_1042",
      "faint": "skill_1039",

      // ===== 회복/힐 심볼 계열 =====
      "heal_symbol": "skill_1115",
      "heal_symbol_2": "skill_1115",
      "heal_enhance": "skill_1115",
      "heal_talisman_boost": "skill_1032",

      // ===== 파워 심볼 계열 =====
      "power_symbol": "skill_1116",
      "power_symbol_2": "skill_1116",
      "power_enhance": "skill_1116",

      // ===== 보호 심볼 계열 =====
      "protect_symbol": "skill_1117",
      "protect_symbol_2": "skill_1117",
      "protect_enhance": "skill_1117",

      // ===== 특수심볼 공통 =====
      "special_symbol_boost": "skill_0015",
      "rainbow_symbol": "skill_7002",
      "rainbow_resonance": "skill_7002",

      // ===== 스탯 강화 =====
      "atk_up_1": "skill_0075",
      "atk_up_2": "skill_0076",
      "atk_up_3": "skill_0077",
      "crit_chance_1": "skill_1009",
      "crit_chance_2": "skill_1009",
      "crit_dmg_1": "skill_0082",
      "crit_dmg_2": "skill_0082",
      "critical_wound": "skill_1042",
      "dmg_reduce_1": "skill_1014",
      "dmg_reduce_2": "skill_1014",
      "max_hp_up": "skill_0078",
      "crisis_power": "skill_0075",
      "desperation": "skill_0082",
      "fortitude": "skill_1014",
      "reversal_will": "skill_1061",

      // ===== 패턴 배율 =====
      "h_pattern_1": "skill_0094",
      "h_pattern_2": "skill_0094",
      "v_pattern_1": "skill_0095",
      "v_pattern_2": "skill_0095",
      "d_pattern_1": "skill_0096",
      "d_pattern_2": "skill_0096",
      "pattern_triangle": "skill_0000",
      "pattern_inv_triangle": "skill_0000",
      "pattern_cross": "skill_0000",

      // ===== 부적 추가 =====
      "row_check_talisman": "skill_0013",
      "col_check_talisman": "skill_0012",
      "row_heal_talisman": "skill_0013",
      "col_heal_talisman": "skill_0012",
      "row_dmg_talisman": "skill_0013",
      "col_dmg_talisman": "skill_0012",
      "check_talisman_boost": "skill_0013",
      "dmg_talisman_boost": "skill_0013",

      // ===== 룬 =====
      "rune_engrave": "skill_0015",
      "rune_spread": "skill_0016",

      // ===== 콤보 강화 =====
      "combo_accel": "skill_0000",
      "combo_master": "skill_0074",
      "berserker": "skill_0072",
      "berserker_boost": "skill_0072",
      "dominator": "skill_0072",
      "dominator_boost": "skill_0072",
      "guardian_barrier": "skill_0063",
      "guardian_boost": "skill_0063",

      // ===== 방패 =====
      "shield_create": "skill_1014",
      "shield_recharge": "skill_1014",
      "shield_enhance": "skill_1014",
      "shield_mass": "skill_1014",

      // ===== 생존/회복 =====
      "angel_wing": "skill_7004",
      "immortal": "skill_7004",
      "true_immortal": "skill_1055",
      "regen": "skill_1032",
      "strong_regen": "skill_1032",
      "crisis_regen": "skill_1032",

      // ===== 번개 공격 계열 =====
      "bolt_2": "skill_1114",
      "bolt_enhance": "skill_1114",
      "chain_lightning": "skill_0051",
      "chain_lightning_fast": "skill_0051",
      "chain_lightning_ultra": "skill_0051",

      // ===== 속성 진화 기술 =====
      "meteor": "skill_0055",
      "meteor_fast": "skill_0055",
      "meteor_ultra": "skill_0055",
      "storm": "skill_0053",
      "storm_fast": "skill_0053",
      "storm_ultra": "skill_0053",
    };
    // HUD 등 외부에서 접근 가능하도록 노출
    if (typeof window !== "undefined") window.SKILL_ICON_MAP = SKILL_ICON_MAP;

    // fallback: 매핑에 없는 스킬은 랜덤 아이콘 배정
    const usedIcons = new Set();

    for (const s of picks) {
      try {
        const el = document.createElement("div");
        el.className = isMiniSkill(s) ? "choice choice--mini" : "choice";

        const skillId = s && s.id ? s.id : "";
        let iconNum = SKILL_ICON_MAP[skillId];
        if (!iconNum) {
          let iconIdx;
          do { iconIdx = Math.floor(Math.random() * 97); } while (usedIcons.has(iconIdx));
          usedIcons.add(iconIdx);
          iconNum = `skill_${String(iconIdx).padStart(4, "0")}`;
        }
        const iconSrc = `Images/IconSkill/${iconNum}.png`;

        const grade = typeof skillGrade === "function" ? skillGrade(s) : "";
        if (grade) el.classList.add(`choice--${grade}`);
        const gradeIconNum = GRADE_ICON_MAP[grade] || 1;
        const gradeIconSrc = `images/skill_icons/skill_grade${gradeIconNum}.png`;

        const safeName = String((skillName(s) || s.name || s.id || "스킬")).trim();
        const safeShort = String((skillShortDesc(s) || s.shortDesc || "")).trim();
        const safeDesc = String((skillDesc(s) || s.desc || "")).trim();
        const shortHtml = safeShort ? `<div class="choice__short">${escapeHtml(safeShort)}</div>` : "";
        const fullHtml = safeDesc ? `<div class="choice__desc">${escapeHtml(safeDesc)}</div>` : "";

        el.innerHTML = `
          <div class="choice__iconWrap">
            <img class="choice__icon" src="${iconSrc}" alt="" />
            <img class="choice__gradeIcon" src="${gradeIconSrc}" alt="${grade}" />
          </div>
          <div class="choice__name">${escapeHtml(safeName)}</div>
          ${shortHtml}${fullHtml}`;
        el.addEventListener("click", () => done(s), { once: true });
        ui.choices.appendChild(el);
      } catch (err) {
        const fallbackEl = document.createElement("div");
        fallbackEl.className = "choice";
        fallbackEl.innerHTML = `<div class="choice__name">${escapeHtml(String((s && (s.name || s.id)) || "스킬"))}</div>`;
        fallbackEl.addEventListener("click", () => done(s), { once: true });
        ui.choices.appendChild(fallbackEl);
        console.warn("[levelup-render-fallback]", s && s.id, err);
      }
    }

    if (!ui.choices.children.length) {
      for (const s of picks) {
        const fallbackEl = document.createElement("div");
        fallbackEl.className = "choice";
        fallbackEl.innerHTML = `<div class="choice__name">${escapeHtml(String((s && (s.name || s.id)) || "스킬"))}</div>`;
        fallbackEl.addEventListener("click", () => done(s), { once: true });
        ui.choices.appendChild(fallbackEl);
      }
    }
  });
}

ui.spinBtn.addEventListener("click", () => spin());
ui.resetBtn.addEventListener("click", () => {
  // On defeat, reset returns to the main menu.
  if (state.player && state.player.hp <= 0) {
    state.started = false;
    try {
      closeModal();
    } catch {
      // ignore
    }
    try {
      closeHelp();
    } catch {
      // ignore
    }
    setJourneyMode("idle");
    showStartScreen();
    return;
  }
  start(state.chapter);
});

if (ui.previewBtn) {
  ui.previewBtn.addEventListener("click", () => {
    state.previewMode = !state.previewMode;
    renderAll(false);
  });
}

if (ui.langButtons) {
  ui.langButtons.addEventListener("click", (e) => {
    const btn = e.target.closest(".langBtn");
    if (!btn) return;
    applyLanguage(btn.dataset.lang);
  });
}

if (ui.startGameBtn) {
  ui.startGameBtn.addEventListener("click", () => {
    state.started = true;
    hideStartScreen();
    start(META.selectedChapter);
  });
}

if (ui.petDrawBtn) {
  ui.petDrawBtn.addEventListener("click", () => {
    const result = petDrawOnce();
    if (!result) {
      if (ui.petDrawResult) ui.petDrawResult.textContent = t("ui.goldShort", { cost: PET_GACHA_COST });
      return;
    }
    openGachaPopup("pet", [result]);
    renderMainMenu();
    renderAll(false);
    logEvt("note", `펫 뽑기: ${result.grade} ${result.pet.name}`);
  });
}

if (ui.petDraw10Btn) {
  ui.petDraw10Btn.addEventListener("click", () => {
    const need = PET_GACHA_COST * 10;
    if (META.gold < need) {
      if (ui.petDrawResult) ui.petDrawResult.textContent = t("ui.goldShort", { cost: need });
      return;
    }
    const results = petDrawMany(10);
    if (!results.length) {
      if (ui.petDrawResult) ui.petDrawResult.textContent = t("ui.drawFail");
      return;
    }
    openGachaPopup("pet", results);
    renderMainMenu();
    renderAll(false);
    logEvt("note", `펫 10연속: ${summary}`);
  });
}

// ── Decoration gacha handlers ──
if (ui.decoDrawBtn) {
  ui.decoDrawBtn.addEventListener("click", () => {
    const result = decoDrawOnce();
    if (!result) {
      if (ui.decoDrawResult) ui.decoDrawResult.textContent = t("ui.goldShort", { cost: DECO_GACHA_COST });
      return;
    }
    openGachaPopup("deco", [result]);
    renderMainMenu();
    renderAll(false);
    logEvt("note", `장식 뽑기: ${result.grade} ${result.deco.name}`);
  });
}

if (ui.decoDraw10Btn) {
  ui.decoDraw10Btn.addEventListener("click", () => {
    const need = DECO_GACHA_COST * 10;
    if (META.gold < need) {
      if (ui.decoDrawResult) ui.decoDrawResult.textContent = t("ui.goldShort", { cost: need });
      return;
    }
    const results = decoDrawMany(10);
    if (!results.length) {
      if (ui.decoDrawResult) ui.decoDrawResult.textContent = t("ui.drawFail");
      return;
    }
    openGachaPopup("deco", results);
    renderMainMenu();
    renderAll(false);
    logEvt("note", `장식 10연속: ${results.length}회`);
  });
}

if (ui.decoDetailCloseBtn) {
  ui.decoDetailCloseBtn.addEventListener("click", closeDecoDetail);
}
if (ui.decoDetailModal) {
  ui.decoDetailModal.addEventListener("click", (e) => {
    if (e.target === ui.decoDetailModal) closeDecoDetail();
  });
}

// ── Equipment gacha ──
if (ui.equipDrawBtn) {
  ui.equipDrawBtn.addEventListener("click", () => {
    if (META.gold < EQUIP_GACHA_COST) return;
    const result = equipDrawOnce();
    if (!result) return;
    openGachaPopup("equip", [result], t("ui.gachaEquipTitle"));
    renderMainMenu();
    renderAll(false);
  });
}

if (ui.equipDraw10Btn) {
  ui.equipDraw10Btn.addEventListener("click", () => {
    const need = EQUIP_GACHA_COST * 10;
    if (META.gold < need) return;
    const results = equipDrawMany(10);
    if (!results.length) return;
    openGachaPopup("equip", results, t("ui.gachaEquip10Title"));
    renderMainMenu();
    renderAll(false);
  });
}

if (ui.equipDetailCloseBtn) {
  ui.equipDetailCloseBtn.addEventListener("click", closeEquipDetail);
}
if (ui.equipDetailModal) {
  ui.equipDetailModal.addEventListener("click", (e) => {
    if (e.target === ui.equipDetailModal) closeEquipDetail();
  });
}

if (ui.equipInnerTabs) {
  ui.equipInnerTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-equiptab]");
    if (!btn) return;
    const target = btn.dataset.equiptab;
    document.querySelectorAll(".equipInnerTabs__btn").forEach(b => b.classList.remove("equipInnerTabs__btn--active"));
    btn.classList.add("equipInnerTabs__btn--active");
    document.querySelectorAll(".equipInnerPanel").forEach(p => p.classList.remove("equipInnerPanel--active"));
    const panel = document.querySelector(`.equipInnerPanel[data-equiptab="${target}"]`);
    if (panel) panel.classList.add("equipInnerPanel--active");
    if (target === "merge") renderEquipMergeUI();
  });
}

if (ui.petSkillBtn) {
  ui.petSkillBtn.addEventListener("click", () => {
    const pet = equippedPetDef(0);
    if (pet) openPetActivePopup(pet.id);
  });
}

if (ui.petSkillBtn2) {
  ui.petSkillBtn2.addEventListener("click", () => {
    const pet = equippedPetDef(1);
    if (pet) openPetActivePopup(pet.id);
  });
}

if (ui.levelUpBtn) {
  ui.levelUpBtn.addEventListener("click", () => {
    if (tryMetaLevelUp()) {
      logEvt("good", t("log.levelUpMeta", { level: META.accountLevel }));
      renderMainMenu();
      renderAll(false);
    }
  });
}

if (ui.resetMetaBtn) {
  ui.resetMetaBtn.addEventListener("click", () => {
    const ok = window.confirm(t("ui.resetMetaConfirm"));
    if (!ok) return;
    resetMeta();
    renderMainMenu();
    renderAll(false);
    logEvt("note", t("log.resetMetaDone"));
  });
}

if (ui.chapterPrevBtn) {
  ui.chapterPrevBtn.addEventListener("click", () => {
    META.selectedChapter = Math.max(1, (META.selectedChapter || 1) - 1);
    clampSelectedChapter();
    saveMeta(META);
    renderMainMenu();
  });
}

if (ui.chapterNextBtn) {
  ui.chapterNextBtn.addEventListener("click", () => {
    META.selectedChapter = Math.min(META.unlockedChapter || 1, (META.selectedChapter || 1) + 1);
    clampSelectedChapter();
    saveMeta(META);
    renderMainMenu();
  });
}

if (ui.helpBtn) {
  ui.helpBtn.addEventListener("click", () => openHelp());
}

if (ui.helpCloseBtn) {
  ui.helpCloseBtn.addEventListener("click", () => closeHelp());
}

if (ui.helpModal) {
  ui.helpModal.addEventListener("click", (e) => {
    if (e.target === ui.helpModal) closeHelp();
  });
}

if (ui.codexBtnWide) {
  ui.codexBtnWide.addEventListener("click", () => openCodex());
}

if (ui.codexCloseBtn) {
  ui.codexCloseBtn.addEventListener("click", () => closeCodex());
}

if (ui.codexModal) {
  ui.codexModal.addEventListener("click", (e) => {
    if (e.target === ui.codexModal) closeCodex();
  });
}

if (ui.petDrawCloseBtn) {
  ui.petDrawCloseBtn.addEventListener("click", () => closePetDrawModal());
}

if (ui.petDrawModal) {
  ui.petDrawModal.addEventListener("click", (e) => {
    if (e.target === ui.petDrawModal) closePetDrawModal();
  });
}

if (ui.codexTabs) {
  ui.codexTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".codex__tab");
    if (!btn || !btn.dataset || !btn.dataset.tab) return;
    setCodexTab(btn.dataset.tab);
    if (ui.codexBody) ui.codexBody.scrollTop = 0;
  });

  ui.codexTabs.addEventListener("keydown", (e) => {
    if (!isCodexOpen()) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const tabs = Array.from(ui.codexTabs.querySelectorAll(".codex__tab"));
    const idx = tabs.findIndex((t) => t.dataset && t.dataset.tab === (state.codexTab || "light"));
    if (idx < 0) return;
    const dir = e.key === "ArrowLeft" ? -1 : 1;
    const next = tabs[(idx + dir + tabs.length) % tabs.length];
    if (!next || !next.dataset || !next.dataset.tab) return;
    e.preventDefault();
    setCodexTab(next.dataset.tab);
    next.focus();
    if (ui.codexBody) ui.codexBody.scrollTop = 0;
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isPetDetailOpen()) closePetDetail();
  else if (isPetDrawOpen()) closePetDrawModal();
  else if (isHelpOpen()) closeHelp();
  else if (isCodexOpen()) closeCodex();
});

// ── Lobby Tab Navigation ──
function switchLobbyTab(tabId) {
  if (!ui.lobbyNav) return;
  // Update panels
  const panels = document.querySelectorAll(".lobby__panel");
  panels.forEach((p) => {
    p.classList.toggle("lobby__panel--active", p.dataset.tab === tabId);
  });
  // Update nav buttons
  const btns = ui.lobbyNav.querySelectorAll(".lobby__navBtn");
  btns.forEach((b) => {
    b.classList.toggle("lobby__navBtn--active", b.dataset.tab === tabId);
  });
}

if (ui.lobbyNav) {
  ui.lobbyNav.addEventListener("click", (e) => {
    const btn = e.target.closest(".lobby__navBtn");
    if (!btn || !btn.dataset.tab) return;
    switchLobbyTab(btn.dataset.tab);
  });
}

// ── 내 정보 서브탭 전환 ──
if (ui.myinfoTabs) {
  ui.myinfoTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".myinfo__tab");
    if (!tab || !tab.dataset.subtab) return;
    // 탭 버튼 활성화
    ui.myinfoTabs.querySelectorAll(".myinfo__tab").forEach((t) => {
      t.classList.toggle("myinfo__tab--active", t === tab);
    });
    // 패널 전환
    const panels = document.querySelectorAll(".myinfo__panel");
    panels.forEach((p) => {
      p.classList.toggle("myinfo__panel--active", p.dataset.subtab === tab.dataset.subtab);
    });
  });
}

// ── 펫 상세 팝업 닫기 ──
if (ui.petDetailCloseBtn) {
  ui.petDetailCloseBtn.addEventListener("click", closePetDetail);
}
if (ui.petDetailModal) {
  ui.petDetailModal.addEventListener("click", (e) => {
    if (e.target === ui.petDetailModal) closePetDetail();
  });
}

// ── 펫 내부 탭 (보유펫/합성/제작) ──
document.getElementById("petInnerTabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-pettab]");
  if (!btn) return;
  const target = btn.dataset.pettab;
  document.querySelectorAll(".petInnerTabs__btn").forEach(b => b.classList.remove("petInnerTabs__btn--active"));
  btn.classList.add("petInnerTabs__btn--active");
  document.querySelectorAll(".petInnerPanel").forEach(p => p.classList.remove("petInnerPanel--active"));
  const panel = document.querySelector(`.petInnerPanel[data-pettab="${target}"]`);
  if (panel) panel.classList.add("petInnerPanel--active");
  // 탭 전환 시 합성/제작/교환소 리렌더
  if (target === "synth") renderSynthesisUI();
  if (target === "craft") renderCraftUI();
  if (target === "exchange") renderPetShop();
});

// ── 펫 합성 탭 / 버튼 ──
document.getElementById("synthesisTabs")?.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-synth]");
  if (!tab) return;
  synthGrade = tab.dataset.synth;
  synthSelected = [];
  document.querySelectorAll(".petSynthesis__tab").forEach(t => t.classList.remove("petSynthesis__tab--active"));
  tab.classList.add("petSynthesis__tab--active");
  renderSynthesisUI();
});

document.getElementById("synthesisBtn")?.addEventListener("click", doSynthesis);

showStartScreen();







