function enemyPassiveHeal(enemy, amount, flags, label) {
  if (!enemy || amount <= 0) return 0;
  if ((enemy.hp || 0) <= 0) return 0;
  const healed = Math.min(Math.max(0, enemy.maxHp - enemy.hp), Math.max(0, Math.floor(amount)));
  if (healed > 0) {
    enemy.hp += healed;
    if (flags) flags.push(`${label || "회복"} +${healed}`);
  }
  return healed;
}

function applyPlayerBleed(player, dmg, turns) {
  if (!player?.status) return;
  const perStack = Math.max(1, Math.floor(dmg || 1));
  player.status.bleedDmgPerStack = Math.max(player.status.bleedDmgPerStack || 0, perStack);
  dotAddStacks(player.status, "bleed", Math.max(1, Math.floor(turns || 2)), 1);
}

function addPlayerStickyCell(player, turns) {
  if (!player?.status) return;
  if (!Array.isArray(player.status.stickyCells)) player.status.stickyCells = [];
  const used = new Set(player.status.stickyCells.map((it) => `${it.r},${it.c}`));
  const pool = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (!used.has(key)) pool.push({ r, c });
    }
  }
  const pick = pickOne(pool.length ? pool : Array.from({ length: ROWS * COLS }, (_, i) => ({ r: Math.floor(i / COLS), c: i % COLS })));
  if (!pick) return;
  player.status.stickyCells.push({ r: pick.r, c: pick.c, turns: Math.max(1, Math.floor(turns || 5)) });
}

const PASSIVES = [
  { id: "1001", name: "기본 공격", desc: "기본 공격을 사용합니다." },
  {
    id: "1002",
    name: "연속 공격",
    desc: "30% 확률로 최대 5회 연속 공격합니다. 추가 공격은 50% 피해를 줍니다.",
    onAfterAttack: (ctx) => {
      if (Math.random() >= 0.3) return;
      const extra = 1 + randInt(0, 3);
      if (!ctx.queuedAttackMultipliers) ctx.queuedAttackMultipliers = [];
      for (let i = 0; i < extra; i++) ctx.queuedAttackMultipliers.push(0.5);
      ctx.flags.push(`연속 공격 x${extra}`);
    },
  },
  {
    id: "1003",
    name: "치명 연속 공격",
    desc: "치명타가 발생하면 최대 5회 연속 공격합니다. 추가 공격은 100% 피해를 줍니다.",
    onAfterAttack: (ctx) => {
      if (!ctx.enemy._lastAttackCrit) return;
      const extra = 1 + randInt(0, 3);
      if (!ctx.queuedAttackMultipliers) ctx.queuedAttackMultipliers = [];
      for (let i = 0; i < extra; i++) ctx.queuedAttackMultipliers.push(1.0);
      ctx.flags.push(`치명 연속 공격 x${extra}`);
    },
  },
  {
    id: "1004",
    name: "자폭",
    desc: "남은 체력에 비례한 자폭 피해를 줍니다.",
    onTakeDamage: (ctx) => {
      if (ctx.enemy._selfDestructArmed) return;
      if (ctx.enemy.hp - ctx.damage > 0) return;
      ctx.enemy._selfDestructArmed = true;
    },
    onAfterTakeDamage: (ctx) => {
      if (!ctx.enemy._selfDestructArmed || !state?.player) return;
      ctx.enemy._selfDestructArmed = false;
      const dmg = Math.max(1, Math.floor(ctx.enemy.hp * 1.5));
      state.player.hp = Math.max(0, state.player.hp - dmg);
      showDmgPopup("player", dmg, "hit");
    },
  },
  {
    id: "1005",
    name: "충격 흡수",
    desc: "받은 데미지의 20%만큼 회복합니다.",
    onAfterTakeDamage: (ctx) => {
      enemyPassiveHeal(ctx.enemy, ctx.damageDealt * 0.2);
    },
  },
  {
    id: "1006",
    name: "방어 태세",
    desc: "공격하지 않은 턴에는 데미지 절감 20%를 얻습니다.",
    onTurn: (ctx) => {
      const willAttack = ((ctx.turn || 0) + (ctx.enemy.attackOffset || 0)) % ctx.enemy.attackEvery === 0;
      ctx.enemy._guardStance = !willAttack;
    },
    onTakeDamage: (ctx) => {
      if (!ctx.enemy._guardStance) return;
      ctx.damage = Math.floor(ctx.damage * 0.8);
      ctx.flags.push("방어 태세");
    },
  },
  {
    id: "1007",
    name: "출혈",
    desc: "공격 시 출혈을 부여합니다. 출혈 피해는 공격력의 30%입니다.",
    onHitPlayer: (ctx) => {
      applyPlayerBleed(ctx.player, Math.max(1, Math.floor(ctx.enemy.atk * 0.3)), 3);
      ctx.flags.push("출혈");
    },
  },
  {
    id: "1008",
    name: "화상",
    desc: "공격 시 화상을 부여합니다. 화상 피해는 공격력의 30%입니다.",
    onHitPlayer: (ctx) => {
      applyPlayerBurn(ctx.player, Math.max(1, Math.floor(ctx.enemy.atk * 0.3)), 2);
      ctx.flags.push("화상");
    },
  },
  {
    id: "1009",
    name: "빙결",
    desc: "공격 시 20% 확률로 2턴 빙결을 부여합니다.",
    onHitPlayer: (ctx) => {
      if (Math.random() >= 0.2) return;
      applyPlayerFreeze(ctx.player, 2);
      ctx.flags.push("빙결");
    },
  },
  {
    id: "1010",
    name: "기절",
    desc: "공격 시 20% 확률로 2턴 기절을 부여합니다.",
    onHitPlayer: (ctx) => {
      if (Math.random() >= 0.2) return;
      applyPlayerStun(ctx.player, 2);
      ctx.flags.push("기절");
    },
  },
  {
    id: "1011",
    name: "흡혈",
    desc: "가한 데미지의 30%만큼 회복합니다.",
    onAfterAttack: (ctx) => {
      enemyPassiveHeal(ctx.enemy, Math.floor((ctx.damageDealt || 0) * 0.3), ctx.flags, "흡혈");
    },
  },
  {
    id: "1012",
    name: "빙결 면역",
    desc: "빙결 상태이상에 걸리지 않습니다.",
    onSpawn: (enemy) => {
      enemy.immuneFreeze = true;
    },
  },
  {
    id: "1013",
    name: "기절 면역",
    desc: "기절 상태이상에 걸리지 않습니다.",
    onSpawn: (enemy) => {
      enemy.immuneStun = true;
    },
  },
  {
    id: "1014",
    name: "선제공격",
    desc: "공격 턴을 무시하고 먼저 공격합니다.",
    onSpawn: (enemy) => {
      enemy.attackOffset = Math.max(enemy.attackOffset || 0, Math.max(0, enemy.attackEvery - 1));
    },
  },
  {
    id: "1015",
    name: "화상 면역",
    desc: "화상 상태이상에 걸리지 않습니다.",
    onSpawn: (enemy) => {
      enemy.immuneBurn = true;
    },
  },
  {
    id: "1016",
    name: "출혈 면역",
    desc: "출혈 상태이상에 걸리지 않습니다.",
    onSpawn: (enemy) => {
      enemy.immuneBleed = true;
    },
  },
  {
    id: "1017",
    name: "끈적한 방해",
    desc: "기본 공격 시 30% 확률로 랜덤 슬롯 1칸을 5턴간 막습니다.",
    onHitPlayer: (ctx) => {
      if (Math.random() >= 0.3) return;
      addPlayerStickyCell(ctx.player, 5);
      ctx.flags.push("끈적한 방해");
    },
  },
  {
    id: "1018",
    name: "봉인 : 세로",
    desc: "전투 시작 시 가운데 세로 한 줄을 봉인합니다.",
    onSpawn: (enemy) => {
      const s = state?.player?.status;
      if (!s) return;
      s.lockVTurns = 999;
      s.lockVCol = Math.floor(COLS / 2);
    },
  },
  {
    id: "1019",
    name: "봉인 : 가로",
    desc: "전투 시작 시 가운데 가로 한 줄을 봉인합니다.",
    onSpawn: (enemy) => {
      const s = state?.player?.status;
      if (!s) return;
      s.lockHTurns = 999;
      s.lockHRow = Math.floor(ROWS / 2);
    },
  },
  {
    id: "1020",
    name: "저주",
    desc: "전투 시작 시 행운을 감소시킵니다.",
    onSpawn: () => {
      if (!state?.player) return;
      state.player.luck = Math.max(-10, (state.player.luck || 0) - 1);
    },
  },
  {
    id: "1021",
    name: "악마의 낙인",
    desc: "전투 시작 후 매 턴 최대 체력의 1% 피해를 줍니다.",
    onTurn: (ctx) => {
      if (!ctx.player || ctx.player.hp <= 0) return;
      const dmg = Math.max(1, Math.floor(ctx.player.maxHp * 0.01));
      ctx.player.hp = Math.max(0, ctx.player.hp - dmg);
      ctx.flags.push(`악마의 낙인 ${dmg}`);
    },
  },
  {
    id: "1022",
    name: "방어 약화",
    desc: "공격 시 데미지 절감 감소 5%를 부여합니다.",
    onHitPlayer: (ctx) => {
      if (!ctx.player?.status) return;
      ctx.player.status.damageReductionShred = (ctx.player.status.damageReductionShred || 0) + 0.05;
      ctx.player.status.damageReductionShredTurns = Math.max(ctx.player.status.damageReductionShredTurns || 0, 2);
      ctx.flags.push("방어 약화");
    },
  },
  {
    id: "1023",
    name: "공격 약화",
    desc: "공격 시 공격력 감소 5%를 부여합니다.",
    onHitPlayer: (ctx) => {
      if (!ctx.player?.status) return;
      ctx.player.status.attackDownRatio = Math.min(0.8, (ctx.player.status.attackDownRatio || 0) + 0.05);
      ctx.player.status.attackDownTurns = Math.max(ctx.player.status.attackDownTurns || 0, 2);
      ctx.flags.push("공격 약화");
    },
  },
  {
    id: "1024",
    name: "반격",
    desc: "피격 시 25% 확률로 기본 공격의 150% 반격을 가합니다.",
    onAfterTakeDamage: (ctx) => {
      if (Math.random() >= 0.25) return;
      ctx.reflect = (ctx.reflect || 0) + Math.max(1, Math.floor(ctx.enemy.atk * 1.5));
    },
  },
  {
    id: "1025",
    name: "잭팟 반격",
    desc: "잭팟 공격에 피격되면 기본 공격의 150% 반격을 가합니다.",
    onAfterTakeDamage: (ctx) => {
      if (!state?.lastJackpot) return;
      ctx.reflect = (ctx.reflect || 0) + Math.max(1, Math.floor(ctx.enemy.atk * 1.5));
    },
  },
  {
    id: "1026",
    name: "각성",
    desc: "체력이 50% 미만이 되면 공격력과 데미지 절감이 증가합니다.",
    onTakeDamage: (ctx) => {
      if (ctx.enemy._awakened) {
        ctx.damage = Math.floor(ctx.damage * 0.8);
        return;
      }
      const projectedHp = ctx.enemy.hp - ctx.damage;
      if (projectedHp < Math.floor(ctx.enemy.maxHp * 0.5)) {
        ctx.enemy._awakened = true;
        ctx.damage = Math.floor(ctx.damage * 0.8);
        ctx.flags.push("각성");
      }
    },
    onAttack: (ctx) => {
      if (!ctx.enemy._awakened) return;
      ctx.damage = Math.floor(ctx.damage * 1.35);
    },
  },
  {
    id: "1027",
    name: "보호막 생성",
    desc: "매 턴 최대 체력의 10% 보호막을 생성합니다.",
    onEnemyTurn: (ctx) => {
      const gain = Math.max(1, Math.floor(ctx.enemy.maxHp * 0.1));
      ctx.enemy.shield = (ctx.enemy.shield || 0) + gain;
      ctx.flags.push(`보호막 +${gain}`);
    },
  },
  {
    id: "1028",
    name: "긴급 보호막",
    desc: "체력이 30% 미만이 되면 최대 체력의 30% 보호막을 1회 얻습니다.",
    onTakeDamage: (ctx) => {
      if (ctx.enemy._emergencyShieldUsed) return;
      const projectedHp = ctx.enemy.hp - ctx.damage;
      if (projectedHp >= Math.floor(ctx.enemy.maxHp * 0.3)) return;
      ctx.enemy._emergencyShieldUsed = true;
      const gain = Math.max(1, Math.floor(ctx.enemy.maxHp * 0.3));
      ctx.enemy.shield = (ctx.enemy.shield || 0) + gain;
      ctx.flags.push(`긴급 보호막 +${gain}`);
    },
  },
  {
    id: "1029",
    name: "생명 창조",
    desc: "매 턴 최대 체력의 6%를 회복합니다.",
    onEnemyTurn: (ctx) => {
      enemyPassiveHeal(ctx.enemy, ctx.enemy.maxHp * 0.06, ctx.flags, "생명 창조");
    },
  },
  {
    id: "1030",
    name: "번개 절감",
    desc: "번개 속성 피해를 35% 감소시킵니다.",
    onTakeDamage: (ctx) => {
      if (ctx.elementId !== "light") return;
      ctx.damage = Math.floor(ctx.damage * 0.65);
      ctx.flags.push("번개 절감");
    },
  },
  {
    id: "1031",
    name: "자연 절감",
    desc: "자연 속성 피해를 35% 감소시킵니다.",
    onTakeDamage: (ctx) => {
      if (ctx.elementId !== "nature") return;
      ctx.damage = Math.floor(ctx.damage * 0.65);
      ctx.flags.push("자연 절감");
    },
  },
  {
    id: "1032",
    name: "불 절감",
    desc: "불 속성 피해를 35% 감소시킵니다.",
    onTakeDamage: (ctx) => {
      if (ctx.elementId !== "fire") return;
      ctx.damage = Math.floor(ctx.damage * 0.65);
      ctx.flags.push("불 절감");
    },
  },
  {
    id: "1033",
    name: "물 절감",
    desc: "물 속성 피해를 35% 감소시킵니다.",
    onTakeDamage: (ctx) => {
      if (ctx.elementId !== "water") return;
      ctx.damage = Math.floor(ctx.damage * 0.65);
      ctx.flags.push("물 절감");
    },
  },
  {
    id: "1034",
    name: "출혈 반사",
    desc: "피격 시 출혈을 반사합니다.",
    onAfterTakeDamage: (ctx) => {
      applyPlayerBleed(state?.player, Math.max(1, Math.floor(ctx.enemy.atk * 0.3)), 3);
    },
  },
  {
    id: "1035",
    name: "화상 반사",
    desc: "피격 시 화상을 반사합니다.",
    onAfterTakeDamage: (ctx) => {
      if (!state?.player?.status) return;
      state.player.status.burnDmgPerStack = Math.max(
        state.player.status.burnDmgPerStack || 0,
        Math.max(1, Math.floor(ctx.enemy.atk * 0.3))
      );
      dotAddStacks(state.player.status, "burn", 3, 1);
    },
  },
  {
    id: "1036",
    name: "빙결 반사",
    desc: "피격 시 20% 확률로 빙결을 반사합니다.",
    onAfterTakeDamage: () => {
      if (Math.random() >= 0.2) return;
      applyPlayerFreeze(state?.player, 2);
    },
  },
  {
    id: "1037",
    name: "기절 반사",
    desc: "피격 시 20% 확률로 기절을 반사합니다.",
    onAfterTakeDamage: () => {
      if (Math.random() >= 0.2) return;
      applyPlayerStun(state?.player, 2);
    },
  },
  {
    id: "10014",
    name: "사냥 본능",
    desc: "적 체력이 50% 미만이면 치명타율이 증가합니다.",
    onAttack: (ctx) => {
      if (!ctx.player || ctx.player.hp > Math.floor(ctx.player.maxHp * 0.5)) return;
      ctx.enemy._attackCritBonus = 0.25;
      ctx.flags.push("사냥 본능");
    },
  },
  {
    id: "10017",
    name: "불굴의 복서",
    desc: "치명적인 공격을 받으면 1회에 한해 체력 1로 생존합니다.",
    onTakeDamage: (ctx) => {
      if (ctx.enemy._lastStandUsed) return;
      if (ctx.enemy.hp - ctx.damage > 0) return;
      ctx.enemy._lastStandUsed = true;
      ctx.damage = Math.max(0, ctx.enemy.hp - 1);
      ctx.flags.push("불굴의 복서");
    },
  },
  {
    id: "20102",
    name: "독 지대",
    desc: "전투 진입 후 매 턴 공격력의 50% 독 피해를 줍니다.",
    onTurn: (ctx) => {
      if (!ctx.player || ctx.player.hp <= 0) return;
      const dmg = Math.max(1, Math.floor(ctx.enemy.atk * 0.5));
      ctx.player.hp = Math.max(0, ctx.player.hp - dmg);
      ctx.flags.push(`독 지대 ${dmg}`);
      showDmgPopup("player", dmg, "hit");
    },
  },
  {
    id: "20201",
    name: "화염 돌진",
    desc: "적 체력이 50% 이하일 때 200% 피해의 화염 돌진을 사용합니다.",
    onAttack: (ctx) => {
      if (!ctx.player || ctx.player.hp > Math.floor(ctx.player.maxHp * 0.5)) return;
      ctx.damage = Math.floor(ctx.enemy.atk * 2.0);
      ctx.enemy._specialAttack = "fire_charge";
      ctx.flags.push("화염 돌진");
    },
    onHitPlayer: (ctx) => {
      if (ctx.enemy._specialAttack !== "fire_charge" || !ctx.player?.status) return;
      ctx.enemy._specialAttack = null;
      ctx.player.status.burnDmgPerStack = Math.max(
        ctx.player.status.burnDmgPerStack || 0,
        Math.max(1, Math.floor(ctx.enemy.atk * 0.3))
      );
      dotAddStacks(ctx.player.status, "burn", 3, 3);
      ctx.flags.push("화상 3");
    },
  },
  {
    id: "20302",
    name: "눈보라",
    desc: "두두가 공격에 실패하면 눈보라를 시전합니다.",
    onPlayerFailedAttack: (ctx) => {
      const dmg = Math.max(1, Math.floor(ctx.enemy.atk * 0.2));
      ctx.player.hp = Math.max(0, ctx.player.hp - dmg);
      showDmgPopup("player", dmg, "hit");
      if (Math.random() < 0.2) applyPlayerFreeze(ctx.player, 2);
      if (ctx.flags) ctx.flags.push(`눈보라 ${dmg}`);
    },
  },
  {
    id: "20402",
    name: "고통의 희열",
    desc: "두두에게 걸린 상태이상 1개당 최대 체력의 3%를 회복합니다.",
    onTurn: (ctx) => {
      const count = statusCountFor(ctx.player);
      if (!count) return;
      enemyPassiveHeal(ctx.enemy, ctx.enemy.maxHp * 0.03 * count, ctx.flags, "고통의 희열");
    },
  },
  {
    id: "20501",
    name: "골렘 점프",
    desc: "체력이 50% 미만이면 250% 피해의 골렘 점프를 사용합니다.",
    onAttack: (ctx) => {
      if (ctx.enemy.hp > Math.floor(ctx.enemy.maxHp * 0.5)) return;
      ctx.damage = Math.floor(ctx.enemy.atk * 2.5);
      ctx.enemy._specialAttack = "golem_jump";
      ctx.flags.push("골렘 점프");
    },
    onHitPlayer: (ctx) => {
      if (ctx.enemy._specialAttack !== "golem_jump") return;
      ctx.enemy._specialAttack = null;
      if (Math.random() < 0.2) {
        applyPlayerStun(ctx.player, 2);
        ctx.flags.push("기절");
      }
    },
  },
  {
    id: "20601",
    name: "접근 불허",
    desc: "전투 시작 시 최대 체력의 50% 보호막을 얻습니다.",
    onSpawn: (enemy) => {
      enemy.shield = (enemy.shield || 0) + Math.max(1, Math.floor(enemy.maxHp * 0.5));
    },
  },
];

const overridePassive = (id, patch) => {
  const target = PASSIVES.find((p) => String(p.id) === String(id));
  if (target) Object.assign(target, patch);
};

overridePassive("1010", {
  name: "어지러움",
  desc: "공격 시 20% 확률로 2턴 동안 어지러움을 부여합니다.",
  onHitPlayer: (ctx) => {
    if (Math.random() >= 0.2) return;
    applyPlayerStun(ctx.player, 2);
    ctx.flags.push("어지러움");
  },
});

overridePassive("1012", {
  name: "빙결 면역",
  desc: "일정 확률로 저체온에 걸리지 않습니다.",
  onSpawn: (enemy) => {
    enemy.resistHypothermChance = Math.max(enemy.resistHypothermChance || 0, 0.5);
  },
});

overridePassive("1013", {
  name: "기절 면역",
  desc: "일정 확률로 어지러움에 걸리지 않습니다.",
  onSpawn: (enemy) => {
    enemy.resistDizzyChance = Math.max(enemy.resistDizzyChance || 0, 0.5);
  },
});

overridePassive("1015", {
  name: "화상 면역",
  desc: "일정 확률로 화상에 걸리지 않습니다.",
  onSpawn: (enemy) => {
    enemy.resistBurnChance = Math.max(enemy.resistBurnChance || 0, 0.5);
  },
});

overridePassive("1016", {
  name: "출혈 면역",
  desc: "일정 확률로 따가움에 걸리지 않습니다.",
  onSpawn: (enemy) => {
    enemy.resistThornChance = Math.max(enemy.resistThornChance || 0, 0.5);
  },
});

overridePassive("1017", {
  name: "끈적한 방해",
  desc: "기본 공격 시 30% 확률로 빙결을 부여합니다.",
  onHitPlayer: (ctx) => {
    if (Math.random() >= 0.3) return;
    applyPlayerFreeze(ctx.player, 2);
    ctx.flags.push("빙결");
  },
});

overridePassive("1008", {
  desc: "공격 시 화상을 부여합니다. 화상은 불탄 심볼이 체크될 때 피해를 줍니다.",
  onHitPlayer: (ctx) => {
    applyPlayerBurn(ctx.player, Math.max(1, Math.floor(ctx.enemy.atk * 0.3)), 2);
    ctx.flags.push("화상");
  },
});

overridePassive("20501", {
  onHitPlayer: (ctx) => {
    if (ctx.enemy._specialAttack !== "golem_jump") return;
    ctx.enemy._specialAttack = null;
    if (Math.random() < 0.2) {
      applyPlayerStun(ctx.player, 2);
      ctx.flags.push("어지러움");
    }
  },
});
