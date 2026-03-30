// ═══ slot-manipulation.js — Bombard, Convert, Talisman, Line effects ═══

function enableBombard(player, elementId, n) {
  player.bombardCount[elementId] = n;
  if (player.bombardEnabled.has(elementId)) return;
  player.bombardEnabled.add(elementId);

  player.hooks.afterRoll.push(async (ctx) => {
    const count = player.bombardCount[elementId] || n;
    const targets = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        // 특수 심볼(변형/반반)은 변환 대상에서 제외한다.
        if (elementOfSymbolId(ctx.grid[r][c]) !== elementId) targets.push({ r, c });
      }
    }
    if (!targets.length) return null;
    const pick = uniqueSample(targets, Math.min(count, targets.length));
    const changes = pick.map(({ r, c }) => ({ r, c, to: convertToElementSymbolId(player, elementId) }));
    return {
      kind: "bombard",
      elementId,
      persistNextSpin: !!player.singleConvertEvolution,
      label: t("label.bombard", { element: toLabel(elementId) }),
      subtitle: t("subtitle.randomConvert", { count: pick.length }),
      symbolId: elementId,
      preview: pick,
      changes,
    };
  });
}

function enableDualBombard(player, a, b, n) {
  const all = ["fire", "light", "nature", "water"];
  if (!all.includes(a) || !all.includes(b) || a === b) return;
  const pairKey = [a, b].sort().join("_");
  if (!player.dualBombardCount) player.dualBombardCount = {};
  player.dualBombardCount[pairKey] = n;

  player.hooks.afterRoll.push(async (ctx) => {
    const count = player.dualBombardCount && player.dualBombardCount[pairKey] ? player.dualBombardCount[pairKey] : n;
    const targets = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        const base = elementOfSymbolId(ctx.grid[r][c]);
        if (base !== a && base !== b) targets.push({ r, c });
      }
    }
    if (!targets.length) return null;
    const pick = uniqueSample(targets, Math.min(count, targets.length));
    const hybridId = [a, b].sort().join("_");
    const useHybrid = !!player.dualConvertEvolution && !!HYBRID_BY_ID[hybridId];
    const changes = pick.map(({ r, c }) => {
      if (useHybrid) return { r, c, to: hybridId };
      const toEl = Math.random() < 0.5 ? a : b;
      return { r, c, to: convertToElementSymbolId(player, toEl) };
    });
    return {
      kind: "dualBombard",
      elementId: a,
      label: t("label.bombard", { element: `${toLabel(a)}+${toLabel(b)}` }),
      subtitle: t("subtitle.randomConvert", { count: pick.length }),
      symbolId: a,
      preview: pick,
      changes,
    };
  });
}

function enableHybridConvert(player, hybridId, baseCount) {
  const baseElement = HYBRID_BY_ID[hybridId] ? HYBRID_BY_ID[hybridId].a : null;
  const otherElement = HYBRID_BY_ID[hybridId] ? HYBRID_BY_ID[hybridId].b : null;
  if (!baseElement || !otherElement) return;

  const oppositeElementsFor = (a, b) => {
    const all = ["fire", "light", "nature", "water"];
    return all.filter((e) => e !== a && e !== b);
  };
  const opposites = oppositeElementsFor(baseElement, otherElement);

  player.hooks.afterRoll.push(async (ctx) => {
    const extra = player.hybridConvertExtra || 0;
    const count = baseCount + extra;
    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        const base = elementOfSymbolId(ctx.grid[r][c]);
        if (opposites.includes(base)) candidates.push({ r, c });
      }
    }

    if (!candidates.length) return null;
    const picks = uniqueSample(candidates, Math.min(count, candidates.length));
    const changes = picks.map(({ r, c }) => ({ r, c, to: hybridId }));
    const preview = picks;

    return {
      kind: "hybridConvert",
      elementId: baseElement,
      label: t("label.hybrid", { a: toLabel(baseElement), b: toLabel(otherElement) }),
      subtitle: t("subtitle.convertCount", { count: changes.length }),
      symbolId: baseElement,
      preview,
      changes,
    };
  });
}

function enableRowConvert(player, elementId, chance) {
  player.hooks.afterRoll.push(async (ctx) => {
    player.rowConvertMarks = new Set();

    const marks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (elementOfSymbolId(ctx.grid[r][c]) !== elementId) continue;
        if (Math.random() < chance) {
          const key = `${r},${c}`;
          player.rowConvertMarks.add(key);
          marks.push({ r, c });
        }
      }
    }

    if (!marks.length) return null;

    const pick = pickOne(marks);
    const rows = new Set([pick.r]);
    const preview = [pick];
    const changes = [];
    for (const r of rows) {
      for (let c = 0; c < COLS; c++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        const base = elementOfSymbolId(ctx.grid[r][c]);
        if (base === elementId) continue;
        const to = convertToElementSymbolId(player, elementId);
        if (ctx.grid[r][c] !== to) changes.push({ r, c, to });
      }
    }

    if (!changes.length) return null;

    return {
      kind: "rowConvert",
      elementId,
      label: t("label.rowConvert", { element: toLabel(elementId) }),
      subtitle: t("subtitle.targetRow", { count: rows.size }),
      symbolId: elementId,
      preview,
      changes,
    };
  });
}

function enableRowConvertVariant(player, elementId, variantId) {
  player.hooks.afterRoll.push(async (ctx) => {
    player.rowConvertMarks = new Set();
    const marks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (ctx.grid[r][c] !== variantId) continue;
        const key = `${r},${c}`;
        player.rowConvertMarks.add(key);
        marks.push({ r, c });
      }
    }
    if (!marks.length) return null;

    const pick = pickOne(marks);
    const rows = new Set([pick.r]);
    const preview = [pick];
    const changes = [];
    for (const r of rows) {
      for (let c = 0; c < COLS; c++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        const base = elementOfSymbolId(ctx.grid[r][c]);
        if (base === elementId) continue;
        const to = convertToElementSymbolId(player, elementId);
        if (ctx.grid[r][c] !== to) changes.push({ r, c, to });
      }
    }
    if (!changes.length) return null;

    return {
      kind: "rowConvert",
      elementId,
      label: t("label.rowConvert", { element: toLabel(elementId) }),
      subtitle: t("subtitle.targetRow", { count: rows.size }),
      symbolId: elementId,
      preview,
      changes,
    };
  });
}

function enableColConvert(player, elementId, chance) {
  player.hooks.afterRoll.push(async (ctx) => {
    player.colConvertMarks = new Set();

    const marks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (elementOfSymbolId(ctx.grid[r][c]) !== elementId) continue;
        if (Math.random() < chance) {
          const key = `${r},${c}`;
          player.colConvertMarks.add(key);
          marks.push({ r, c });
        }
      }
    }

    if (!marks.length) return null;

    const pick = pickOne(marks);
    const cols = new Set([pick.c]);
    const preview = [pick];
    const changes = [];
    for (const c of cols) {
      for (let r = 0; r < ROWS; r++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        const base = elementOfSymbolId(ctx.grid[r][c]);
        if (base === elementId) continue;
        const to = convertToElementSymbolId(player, elementId);
        if (ctx.grid[r][c] !== to) changes.push({ r, c, to });
      }
    }

    if (!changes.length) return null;

    return {
      kind: "colConvert",
      elementId,
      label: t("label.colConvert", { element: toLabel(elementId) }),
      subtitle: t("subtitle.targetCol", { count: cols.size }),
      symbolId: elementId,
      preview,
      changes,
    };
  });
}

function enableColConvertVariant(player, elementId, variantId) {
  player.hooks.afterRoll.push(async (ctx) => {
    player.colConvertMarks = new Set();
    const marks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (ctx.grid[r][c] !== variantId) continue;
        const key = `${r},${c}`;
        player.colConvertMarks.add(key);
        marks.push({ r, c });
      }
    }
    if (!marks.length) return null;

    const pick = pickOne(marks);
    const cols = new Set([pick.c]);
    const preview = [pick];
    const changes = [];
    for (const c of cols) {
      for (let r = 0; r < ROWS; r++) {
        if (isSpecialSymbolId(ctx.grid[r][c])) continue;
        const base = elementOfSymbolId(ctx.grid[r][c]);
        if (base === elementId) continue;
        const to = convertToElementSymbolId(player, elementId);
        if (ctx.grid[r][c] !== to) changes.push({ r, c, to });
      }
    }
    if (!changes.length) return null;

    return {
      kind: "colConvert",
      elementId,
      label: t("label.colConvert", { element: toLabel(elementId) }),
      subtitle: t("subtitle.targetCol", { count: cols.size }),
      symbolId: elementId,
      preview,
      changes,
    };
  });
}

function addRowLineEffect(player, effectId) {
  if (!player) return false;
  if (!player.lineEffectRow) player.lineEffectRow = new Map();
  const used = new Set(player.rowTalismans || []);
  for (const r of player.lineEffectRow.keys()) used.add(r);
  for (const r of player.sortRowTalismans || []) used.add(r);
  const available = [];
  for (let r = 0; r < ROWS; r++) {
    if (!used.has(r)) available.push(r);
  }
  if (!available.length) return false;
  const pick = pickOne(available);
  player.lineEffectRow.set(pick, effectId);
  return true;
}

function addColLineEffect(player, effectId) {
  if (!player) return false;
  if (!player.lineEffectCol) player.lineEffectCol = new Map();
  const used = new Set(player.colTalismans || []);
  for (const c of player.lineEffectCol.keys()) used.add(c);
  const available = [];
  for (let c = 0; c < COLS; c++) {
    if (!used.has(c)) available.push(c);
  }
  if (!available.length) return false;
  const pick = pickOne(available);
  player.lineEffectCol.set(pick, effectId);
  return true;
}

function addRowDoubleTalisman(player) {
  if (!player) return false;
  const used = new Set(player.rowTalismans || []);
  if (player.lineEffectRow) {
    for (const r of player.lineEffectRow.keys()) used.add(r);
  }
  for (const r of player.sortRowTalismans || []) used.add(r);
  const available = [];
  for (let r = 0; r < ROWS; r++) {
    if (!used.has(r)) available.push(r);
  }
  if (!available.length) return false;
  const pick = pickOne(available);
  player.rowTalismans.add(pick);
  return true;
}

function addColDoubleTalisman(player) {
  if (!player) return false;
  const used = new Set(player.colTalismans || []);
  if (player.lineEffectCol) {
    for (const c of player.lineEffectCol.keys()) used.add(c);
  }
  const available = [];
  for (let c = 0; c < COLS; c++) {
    if (!used.has(c)) available.push(c);
  }
  if (!available.length) return false;
  const pick = pickOne(available);
  player.colTalismans.add(pick);
  return true;
}

