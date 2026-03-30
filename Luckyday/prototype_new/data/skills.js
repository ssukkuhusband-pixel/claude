function addSymbolWeight(player, elementId, mult) {
  if (!player || !player.symbolWeightMult) return;
  const cur = player.symbolWeightMult[elementId] || 1.0;
  player.symbolWeightMult[elementId] = cur * (1 + mult);
}

function addElementVariant(player, elementId, variantId) {
  if (!player || !player.elementVariants) return;
  const cur = player.elementVariants[elementId];
  if (!cur) {
    player.elementVariants[elementId] = [variantId];
    return;
  }
  if (Array.isArray(cur)) {
    if (!cur.includes(variantId)) cur.push(variantId);
    return;
  }
  if (cur !== variantId) player.elementVariants[elementId] = [cur, variantId];
}

function hasAnySkill(ctx, ids) {
  if (!ctx || !ids || !ids.length) return false;
  if (ctx.counts) {
    for (const id of ids) {
      if ((ctx.counts.get(id) || 0) > 0) return true;
    }
  }
  if (ctx.ids) {
    for (const id of ids) {
      if (ctx.ids.has(id)) return true;
    }
  }
  return false;
}

function hasAllSkills(ctx, ids) {
  if (!ctx || !ids || !ids.length) return false;
  return ids.every((id) => hasAnySkill(ctx, [id]));
}

function boostVariantChance(player, variantId) {
  if (!player) return;
  if (!player.variantGuaranteedExtra) player.variantGuaranteedExtra = {};
  player.variantGuaranteedExtra[variantId] = (player.variantGuaranteedExtra[variantId] || 0) + 1;
}

const DUAL_CONVERT_IDS = [
  "dual_convert_light_nature",
  "dual_convert_fire_light",
  "dual_convert_light_water",
  "dual_convert_fire_nature",
  "dual_convert_nature_water",
  "dual_convert_fire_water",
];

const SPECIAL_SYMBOL_BASE_IDS = [
  "ember", "thunder_symbol", "thorn", "ice_shard",
  "power_symbol", "thunderbolt", "heal_symbol", "protect_symbol",
];

const RAW_SKILLS = [
  { id: "fire_focus", name: "?占쎌뿼 吏묒쨷", shortDesc: "?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 5, apply: (p) => addSymbolWeight(p, "fire", 1.0) },
  { id: "water_focus", name: "占?吏묒쨷", shortDesc: "占??占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "占??占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 5, apply: (p) => addSymbolWeight(p, "water", 1.0) },
  { id: "light_focus", name: "踰덇컻 吏묒쨷", shortDesc: "踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 5, apply: (p) => addSymbolWeight(p, "light", 1.0) },
  { id: "nature_focus", name: "?占쎌뿰 吏묒쨷", shortDesc: "?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 5, apply: (p) => addSymbolWeight(p, "nature", 1.0) },
  { id: "fire_dominate", name: "?占쎌뿼 吏占?", shortDesc: "?占쎌뿼 ?占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 5, requires: (ctx) => hasAnySkill(ctx, ["fire_focus"]), apply: (p) => addSymbolWeight(p, "fire", 1.2) },
  { id: "water_dominate", name: "占?吏占?", shortDesc: "占??占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "占??占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 4, requires: (ctx) => hasAnySkill(ctx, ["water_focus"]), apply: (p) => addSymbolWeight(p, "water", 1.2) },
  { id: "light_dominate", name: "踰덇컻 吏占?", shortDesc: "踰덇컻 ?占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 5, requires: (ctx) => hasAnySkill(ctx, ["light_focus"]), apply: (p) => addSymbolWeight(p, "light", 1.2) },
  { id: "nature_dominate", name: "?占쎌뿰 吏占?", shortDesc: "?占쎌뿰 ?占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 5, requires: (ctx) => hasAnySkill(ctx, ["nature_focus"]), apply: (p) => addSymbolWeight(p, "nature", 1.2) },
  {
    id: "element_monopoly",
    name: "?占쎌꽦 ?占쎌젏",
    shortDesc: "媛???占쏙옙? ?占쎌꽦???占쎌옣 ?占쎈쪧 留롮씠 利앾옙?",
    desc: "가장 높은 속성의 등장 확률이 증가합니다",
    tags: [],
    minLevel: 1,
    apply: (p) => {
      if (!p || !p.symbolWeightMult) return;
      let best = "fire";
      let bestWeight = 0;
      for (const e of ["fire", "light", "nature", "water"]) {
        const w = p.symbolWeightMult[e] || 1;
        if (w > bestWeight) {
          bestWeight = w;
          best = e;
        }
      }
      addSymbolWeight(p, best, 0.5);
    },
  },
  { id: "mono_awakening", name: "?占쎌씪?占쎌꽦 媛곸꽦", shortDesc: "?占쎌옣 ?占쎈쪧??50% ?占쎌긽???占쎌꽦??怨듦꺽??+30%", desc: "?占쎌옣 ?占쎈쪧??50% ?占쎌긽???占쎌꽦??怨듦꺽?占쎌씠 30% 利앾옙??占쎈땲??", tags: [], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["element_monopoly"]), apply: (p) => { if (p) p.monoAwakeningBonus = 0.30; } },

  { id: "fire_convert", name: "?占쎌뿼 蹂??", shortDesc: "?占쏙옙? ???占쎌뿼???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿼?占쎈줈 蹂??", desc: "?占쏙옙? ???占쎌뿼???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿼?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["fire"], minLevel: 1, apply: (p) => enableBombard(p, "fire", 1) },
  { id: "water_convert", name: "占?蹂??", shortDesc: "?占쏙옙? ??臾쇱씠 ?占쎈땶 ?占쎈낵 1媛쒙옙? 臾쇰줈 蹂??", desc: "?占쏙옙? ??臾쇱씠 ?占쎈땶 ?占쎈낵 1媛쒙옙? 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["water"], minLevel: 1, apply: (p) => enableBombard(p, "water", 1) },
  { id: "light_convert", name: "踰덇컻 蹂??", shortDesc: "?占쏙옙? ??踰덇컻媛 ?占쎈땶 ?占쎈낵 1媛쒙옙? 踰덇컻占?蹂??", desc: "?占쏙옙? ??踰덇컻媛 ?占쎈땶 ?占쎈낵 1媛쒙옙? 踰덇컻占?蹂?占쏀빀?占쎈떎", tags: ["light"], minLevel: 1, apply: (p) => enableBombard(p, "light", 1) },
  { id: "nature_convert", name: "?占쎌뿰 蹂??", shortDesc: "?占쏙옙? ???占쎌뿰???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿰?占쎈줈 蹂??", desc: "?占쏙옙? ???占쎌뿰???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿰?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["nature"], minLevel: 1, apply: (p) => enableBombard(p, "nature", 1) },
  { id: "fire_erode", name: "?占쎌뿼 移⑥떇", shortDesc: "?占쎌뿼蹂?占쎌쑝占?蹂?占쏀븯???占쎈낵 1占?異뷂옙?", desc: "?占쎌뿼蹂?占쎌쑝占?蹂?占쏀븯???占쎈낵??1占?異뷂옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["fire_convert"]), apply: (p) => { if (p && p.bombardCount) p.bombardCount.fire = (p.bombardCount.fire || 0) + 1; } },
  { id: "water_erode", name: "占?移⑥떇", shortDesc: "臾쇽옙??占쎌쑝占?蹂?占쏀븯???占쎈낵 1占?異뷂옙?", desc: "臾쇽옙??占쎌쑝占?蹂?占쏀븯???占쎈낵??1占?異뷂옙??占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["water_convert"]), apply: (p) => { if (p && p.bombardCount) p.bombardCount.water = (p.bombardCount.water || 0) + 1; } },
  { id: "light_erode", name: "踰덇컻 移⑥떇", shortDesc: "踰덇컻蹂?占쎌쑝占?蹂?占쏀븯???占쎈낵 1占?異뷂옙?", desc: "踰덇컻蹂?占쎌쑝占?蹂?占쏀븯???占쎈낵??1占?異뷂옙??占쎈땲??", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["light_convert"]), apply: (p) => { if (p && p.bombardCount) p.bombardCount.light = (p.bombardCount.light || 0) + 1; } },
  { id: "nature_erode", name: "?占쎌뿰 移⑥떇", shortDesc: "?占쎌뿰蹂?占쎌쑝占?蹂?占쏀븯???占쎈낵 1占?異뷂옙?", desc: "?占쎌뿰蹂?占쎌쑝占?蹂?占쏀븯???占쎈낵??1占?異뷂옙??占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["nature_convert"]), apply: (p) => { if (p && p.bombardCount) p.bombardCount.nature = (p.bombardCount.nature || 0) + 1; } },
  { id: "dual_convert_light_nature", name: "占???蹂??", shortDesc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿰?占쎈줈 蹂??", desc: "?占쎌쨷蹂?????占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿰?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["light", "nature"], minLevel: 1, apply: (p) => enableDualBombard(p, "light", "nature", 2) },
  { id: "dual_convert_fire_light", name: "占?占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂??", desc: "?占쎌쨷蹂?????占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["light", "fire"], minLevel: 1, apply: (p) => enableDualBombard(p, "light", "fire", 2) },
  { id: "dual_convert_light_water", name: "占?占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 臾쇰줈 蹂??", desc: "?占쎌쨷蹂?????占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["light", "water"], minLevel: 1, apply: (p) => enableDualBombard(p, "light", "water", 2) },
  { id: "dual_convert_fire_nature", name: "??占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂??", desc: "?占쎌쨷蹂?????占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["nature", "fire"], minLevel: 1, apply: (p) => enableDualBombard(p, "nature", "fire", 2) },
  { id: "dual_convert_nature_water", name: "??占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 臾쇰줈 蹂??", desc: "?占쎌쨷蹂?????占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["nature", "water"], minLevel: 1, apply: (p) => enableDualBombard(p, "nature", "water", 2) },
  { id: "dual_convert_fire_water", name: "占?占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? ?占쎌뿼 ?占쎈뒗 臾쇰줈 蹂??", desc: "?占쎌쨷蹂?????占쎈낵 2媛쒙옙? ?占쎌뿼 ?占쎈뒗 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["fire", "water"], minLevel: 1, apply: (p) => enableDualBombard(p, "fire", "water", 2) },
  { id: "dual_convert_master", name: "?占쎌쨷蹂??留덉뒪??", shortDesc: "?占쎌쨷蹂???占쎈낵??諛섎컲?占쎈낵占??占쎌옣", desc: "?占쎌쨷蹂???占쎈낵??紐⑤몢 諛섎컲?占쎈낵占??占쎌옣?占쎈땲??", tags: [], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p) p.dualConvertEvolution = true; } },

  { id: "ember", name: "遺덉뵪", shortDesc: "?占쎌뿼 ?占쎈낵 占?1媛쒙옙? 遺덉뵪占??占쎌옣", desc: "泥댄겕 ???占쎌긽 2?占쎌쓣 遺?占쏀빀?占쎈떎", tags: ["fire"], minLevel: 1, apply: (p) => addElementVariant(p, "fire", "fire_ember") },
  { id: "thunder_symbol", name: "泥쒕뫁", shortDesc: "踰덇컻 ?占쎈낵 占?1媛쒙옙? 泥쒕뫁?占쎈줈 ?占쎌옣", desc: "泥댄겕 ???占쎌뿉占??占쏙옙??占쏙옙???遺?占쏀빀?占쎈떎", tags: ["light"], minLevel: 1, apply: (p) => addElementVariant(p, "light", "light_thunder_sym") },
  { id: "thorn", name: "媛??", shortDesc: "?占쎌뿰 ?占쎈낵 占?1媛쒙옙? 媛?占쎈줈 ?占쎌옣", desc: "泥댄겕 ???占쏙옙??占?2?占쎌쓣 遺?占쏀빀?占쎈떎", tags: ["nature"], minLevel: 1, apply: (p) => addElementVariant(p, "nature", "nature_thorn_v") },
  { id: "ice_shard", name: "?占쎌쓬", shortDesc: "占??占쎈낵 占?1媛쒙옙? ?占쎌쓬?占쎈줈 ?占쎌옣", desc: "泥댄겕 ???占쎌껜??1媛쒙옙? 遺?占쏀빀?占쎈떎", tags: ["water"], minLevel: 1, apply: (p) => addElementVariant(p, "water", "water_ice") },
  { id: "ember_2", name: "遺덉뵪 異뷂옙?!", shortDesc: "遺덉뵪 1占?異뷂옙? ?占쎌옣", desc: "遺덉뵪媛 1占????占쎌옣?占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["ember"]), apply: (p) => boostVariantChance(p, "fire_ember") },
  { id: "thunder_symbol_2", name: "泥쒕뫁 異뷂옙?!", shortDesc: "泥쒕뫁 1占?異뷂옙? ?占쎌옣", desc: "泥쒕뫁??1占????占쎌옣?占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["thunder_symbol"]), apply: (p) => boostVariantChance(p, "light_thunder_sym") },
  { id: "thorn_2", name: "媛??異뷂옙?!", shortDesc: "媛??1占?異뷂옙? ?占쎌옣", desc: "媛?占쏙옙? 1占????占쎌옣?占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["thorn"]), apply: (p) => boostVariantChance(p, "nature_thorn_v") },
  { id: "ice_2", name: "?占쎌쓬 異뷂옙?!", shortDesc: "?占쎌쓬 1占?異뷂옙? ?占쎌옣", desc: "?占쎌쓬??1占????占쎌옣?占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["ice_shard"]), apply: (p) => boostVariantChance(p, "water_ice") },
  { id: "ember_special_boost", name: "遺덉뵪媛뺥솕", shortDesc: "遺덉뵪 ?占쎌긽 1占???2占?", desc: "遺덉뵪媛 遺?占쏀븯???占쎌긽??2媛쒕줈 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ember"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.emberBurnStacks = 2; } },
  { id: "thunder_symbol_boost", name: "泥쒕뫁媛뺥솕", shortDesc: "泥쒕뫁 ?占쏙옙??占쏙옙? ????+1", desc: "泥쒕뫁?占쎈줈 ?占쏀븳 ?占쏙옙??占쏙옙? 吏???占쎌닔媛 1 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thunder_symbol"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.thunderDizzyTurns = 3; } },
  { id: "thorn_special_boost", name: "媛?占쎄컯??", shortDesc: "媛???占쏙옙??占?1占???2占?", desc: "媛?占쏙옙? 遺?占쏀븯???占쏙옙??占??2媛쒕줈 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thorn"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.thornStacks = 2; } },
  { id: "ice_special_boost", name: "?占쎌쓬媛뺥솕", shortDesc: "?占쎌쓬 ?占쎌껜??1占???2占?", desc: "?占쎌쓬??遺?占쏀븯???占쎌껜???2媛쒕줈 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ice_shard"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.iceStacks = 2; } },

  { id: "ember_boost", name: "?占쎌긽 媛뺥솕", shortDesc: "?占쎌긽 ?占쏀빐??+30%", desc: "?占쎌긽 ?占쏀빐?占쎌씠 30% 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ember"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.burnDmgBonus += 0.30; } },
  { id: "dizzy_boost", name: "?占쏙옙??占쏙옙? 媛뺥솕", shortDesc: "?占쏙옙??占쏙옙???嫄몃┛ ??怨듦꺽??-10%", desc: "?占쏙옙??占쏙옙???嫄몃┛ ?占쎌쓽 怨듦꺽?占쎌씠 10% 媛먯냼?占쎈땲??", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thunder_symbol"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.dizzyAtkReduce = 0.10; } },
  { id: "thorn_boost", name: "?占쏙옙??占?媛뺥솕", shortDesc: "?占쏙옙??占??諛쏅뒗 ?占쏀빐 利앾옙???+5%", desc: "?占쏙옙??占??諛쏅뒗 ?占쏀빐 利앾옙??占쎌씠 5% 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thorn"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.thornPctBonus += 0.05; } },
  { id: "ice_boost", name: "鍮숆껐 媛뺥솕", shortDesc: "鍮숆껐 吏???占쎌닔 +1", desc: "鍮숆껐 吏???占쎌닔媛 1 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ice_shard"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.freezeExtraTurns += 1; } },
  { id: "inferno", name: "?占쏀솕", shortDesc: "?占쎌긽 ?占쏀빐 +50%, ?占쎌긽 吏??+1??", desc: "?占쎌긽 ?占쏀빐?占쎌씠 50% 利앾옙??占쎄퀬 吏???占쎌닔媛 1 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ember_boost"]), apply: (p) => { if (p && p.statusEnhance) { p.statusEnhance.burnDmgBonus += 0.50; p.statusEnhance.burnExtraTurns += 1; } } },
  { id: "critical_wound", name: "移섎챸??", shortDesc: "?占쏙옙??占쏙옙????占쏙옙?吏 ?占쎄컧 媛먯냼 ?占쎄낵 異뷂옙?", desc: "?占쏙옙??占쏙옙? ?占쏀깭???占쎌쓽 ?占쏙옙?吏 ?占쎄컧 ?占쎄낵占??占쏀솕?占쏀궢?占쎈떎", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["dizzy_boost"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.dizzyCounterReduce = 0.25; } },
  { id: "daze", name: "?占쏙옙?", shortDesc: "?占쏙옙??占?+5%, ?占쏙옙??占?吏??+1??", desc: "?占쏙옙??占??諛쏅뒗 ?占쏀빐 利앾옙??占쎌씠 5% 異뷂옙??占쎄퀬 吏???占쎌닔媛 1 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thorn_boost"]), apply: (p) => { if (p && p.statusEnhance) { p.statusEnhance.thornPctBonus += 0.05; p.statusEnhance.thornExtraTurns += 1; } } },
  { id: "permafrost", name: "?占쎄뎄?占쏀넗", shortDesc: "?占쎌껜??2?占쏀깮??鍮숆껐", desc: "?占쎌껜???2?占쏀깮占??占쎌뼱??鍮숆껐??嫄몃┰?占쎈떎", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ice_boost"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.freezeThreshold = 2; } },
  { id: "shield_melt", name: "蹂댄샇占??占쎌씠占?", shortDesc: "?占쎌긽??蹂댄샇留됱뿉 ?占쏀엳???占쏀빐??+100%", desc: "?占쎌긽??蹂댄샇留됱뿉 ?占쏀엳???占쏀빐?占쎌씠 100% 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["inferno"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.burnShieldBonus = 1.0; } },
  { id: "faint", name: "?占쎌젅", shortDesc: "?占쏙옙??占쏙옙? ?占쏀깭???占쎌쓽 諛섍꺽 占??占쎌냽怨듦꺽 ?占쎈쪧 -50%", desc: "?占쏙옙??占쏙옙? ?占쏀깭???占쎌쓽 諛섍꺽 占??占쎌냽怨듦꺽 ?占쎈쪧??50% 媛먯냼?占쎈땲??", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["critical_wound"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.dizzyCounterReduce = 0.50; } },
  { id: "hemorrhage", name: "怨쇰떎異쒗삁", shortDesc: "?占쏙옙??占??占쏀깭???占쏙옙? ?占쎈났??80% 媛먯냼", desc: "?占쏙옙??占??占쏀깭???占쏙옙? ?占쎈났?占쎌씠 80% 媛먯냼?占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["daze"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.thornHealReduce = 0.80; } },
  { id: "ice_age", name: "鍮숉븯占?", shortDesc: "鍮숆껐 ?占쏀깭???占쏙옙? ?占쏀빐媛먮㈃ 臾댄슚", desc: "鍮숆껐 ?占쏀깭???占쏙옙? 紐⑤뱺 ?占쏀빐媛먮㈃ ?占쏀궗??臾댄슚媛 ?占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["permafrost"]), apply: (p) => { if (p && p.statusEnhance) p.statusEnhance.freezeIgnoreReduce = true; } },

  { id: "power_symbol", name: "?占쎌썙", shortDesc: "?占쎌뿼 ?占쎈낵 占?1媛쒙옙? ?占쎌썙 ?占쎈낵占??占쎌옣", desc: "?占쎌썙 ?占쎈낵 泥댄겕 ?占쎈쭏??怨듦꺽?占쎌씠 5% 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, apply: (p) => addElementVariant(p, "fire", "fire_power") },
  { id: "thunderbolt", name: "?占쎈ː", shortDesc: "踰덇컻 ?占쎈낵 占?1媛쒙옙? ?占쎈ː占??占쎌옣", desc: "?占쎈ː ?占쎈낵 泥댄겕 ??誘몃땲踰덇컻媛 異뷂옙? 怨듦꺽?占쎈땲??", tags: ["light"], minLevel: 1, apply: (p) => addElementVariant(p, "light", "light_bolt") },
  { id: "heal_symbol", name: "?占쎈났", shortDesc: "?占쎌뿰 ?占쎈낵 占?1媛쒙옙? ?占쎈났 ?占쎈낵占??占쎌옣", desc: "?占쎈났 ?占쎈낵 泥댄겕 ??理쒙옙?泥대젰??5%占??占쎈났?占쎈땲??", tags: ["nature"], minLevel: 1, apply: (p) => addElementVariant(p, "nature", "nature_heal") },
  { id: "protect_symbol", name: "蹂댄샇", shortDesc: "占??占쎈낵 占?1媛쒙옙? 蹂댄샇 ?占쎈낵占??占쎌옣", desc: "蹂댄샇 ?占쎈낵 泥댄겕 ??理쒙옙?泥대젰??6% 蹂댄샇留됱쓣 ?占쎈뱷?占쎈땲??", tags: ["water"], minLevel: 1, apply: (p) => addElementVariant(p, "water", "water_protect") },
  { id: "power_symbol_2", name: "?占쎌썙 異뷂옙?!", shortDesc: "?占쎌썙 1占?異뷂옙? ?占쎌옣", desc: "?占쎌썙媛 1占????占쎌옣?占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["power_symbol"]), apply: (p) => boostVariantChance(p, "fire_power") },
  { id: "bolt_2", name: "?占쎈ː 異뷂옙?!", shortDesc: "?占쎈ː 1占?異뷂옙? ?占쎌옣", desc: "?占쎈ː媛 1占????占쎌옣?占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["thunderbolt"]), apply: (p) => boostVariantChance(p, "light_bolt") },
  { id: "heal_symbol_2", name: "?占쎈났 異뷂옙?!", shortDesc: "?占쎈났 1占?異뷂옙? ?占쎌옣", desc: "?占쎈났??1占????占쎌옣?占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["heal_symbol"]), apply: (p) => boostVariantChance(p, "nature_heal") },
  { id: "protect_symbol_2", name: "蹂댄샇 異뷂옙?!", shortDesc: "蹂댄샇 1占?異뷂옙? ?占쎌옣", desc: "蹂댄샇媛 1占????占쎌옣?占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["protect_symbol"]), apply: (p) => boostVariantChance(p, "water_protect") },
  { id: "power_enhance", name: "?占쎌썙媛뺥솕", shortDesc: "?占쎌썙 ?占쎈낵??利앾옙? 怨듦꺽?占쎌씠 7%占?利앾옙?", desc: "?占쎌썙 ?占쎈낵??利앾옙? 怨듦꺽?占쎌씠 7%占?利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["power_symbol"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.powerAtkPct = 0.07; } },
  { id: "bolt_enhance", name: "?占쎈ː媛뺥솕", shortDesc: "?占쎈ː ?占쎈낵 泥댄겕 ???占쎌꽦?占쎈뒗 誘몃땲 踰덇컻 1占???2占?", desc: "?占쎈ː ?占쎈낵 泥댄겕 ???占쎌꽦?占쎈뒗 誘몃땲 踰덇컻媛 2媛쒕줈 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thunderbolt"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.boltMiniCount = 2; } },
  { id: "heal_enhance", name: "?占쎈났媛뺥솕", shortDesc: "?占쎈났 ?占쎈낵???占쎈났??7%占?利앾옙?", desc: "?占쎈났 ?占쎈낵???占쎈났?占쎌씠 7%占?利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["heal_symbol"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.healPct = 0.07; } },
  { id: "protect_enhance", name: "蹂댄샇媛뺥솕", shortDesc: "蹂댄샇 ?占쎈낵??蹂댄샇占?8%占?利앾옙?", desc: "蹂댄샇 ?占쎈낵??蹂댄샇留됱씠 8%占?利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["protect_symbol"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.protectPct = 0.08; } },

  { id: "meteor", name: "硫뷀뀒??", shortDesc: "?占쎌썙 ?占쎈낵 10???占쎌긽 泥댄겕???占쎌뿉???占쎌뿼 怨듦꺽??硫뷀뀒??怨듦꺽?占쎈줈 蹂占?", desc: "?占쎈떦 ?占쎌쓽 ?占쎌뿼 湲곕낯 怨듦꺽 諛곗쑉???占쎄쾶 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["power_symbol"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.fire.enabled = true; } },
  { id: "chain_lightning", name: "?占쎌뇙 踰덇컻", shortDesc: "?占쎈ː ?占쎈낵 10???占쎌긽 泥댄겕???占쎌뿉??踰덇컻 怨듦꺽???占쎌뇙 踰덇컻 怨듦꺽?占쎈줈 蹂占?", desc: "?占쎈떦 ?占쎌쓽 踰덇컻 怨듦꺽???占쎌젙 ?占쎈쪧占?理쒙옙? 5?占쎄퉴吏 ?占쎌떆?占쎈맗?占쎈떎", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["thunderbolt"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.light.enabled = true; } },
  { id: "storm", name: "??占쏙옙", shortDesc: "?占쎈났 ?占쎈낵 10???占쎌긽 泥댄겕???占쎌뿉???占쎌뿰 怨듦꺽???占쎌옱 泥대젰 x0.5 異뷂옙?", desc: "?占쎈떦 ?占쎌쓽 ?占쎌뿰 湲곕낯 怨듦꺽???占쎌옱 泥대젰??50%留뚰겮 異뷂옙? ?占쏀빐媛 遺숈뒿?占쎈떎", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["heal_symbol"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.nature.enabled = true; } },
  { id: "ice_spear", name: "?占쎌쓬占?", shortDesc: "蹂댄샇 ?占쎈낵 10???占쎌긽 泥댄겕???占쎌뿉??占?怨듦꺽??理쒙옙? 泥대젰 x0.5 異뷂옙?", desc: "?占쎈떦 ?占쎌쓽 占?湲곕낯 怨듦꺽??理쒙옙? 泥대젰??50%留뚰겮 異뷂옙? ?占쏀빐媛 遺숈뒿?占쎈떎", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["protect_symbol"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.water.enabled = true; } },
  { id: "meteor_fast", name: "?占쎌쑉 硫뷀뀒??", shortDesc: "硫뷀뀒??議곌굔 10????5??", desc: "硫뷀뀒???占쏀궗???占쎌썙 ?占쎈낵 議곌굔??5?占쎈줈 媛먯냼?占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["meteor"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.fire.threshold = 5; } },
  { id: "chain_lightning_fast", name: "?占쎌쑉 ?占쎌뇙 踰덇컻", shortDesc: "?占쎌뇙 踰덇컻 議곌굔 10????5??", desc: "?占쎌뇙 踰덇컻 ?占쏀궗???占쎈ː ?占쎈낵 議곌굔??5?占쎈줈 媛먯냼?占쎈땲??", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["chain_lightning"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.light.threshold = 5; } },
  { id: "storm_fast", name: "?占쎌쑉 ??占쏙옙", shortDesc: "??占쏙옙 議곌굔 10????5??", desc: "??占쏙옙 ?占쏀궗???占쎈났 ?占쎈낵 議곌굔??5?占쎈줈 媛먯냼?占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["storm"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.nature.threshold = 5; } },
  { id: "ice_spear_fast", name: "?占쎌쑉 ?占쎌쓬占?", shortDesc: "?占쎌쓬占?議곌굔 10????5??", desc: "?占쎌쓬占??占쏀궗??蹂댄샇 ?占쎈낵 議곌굔??5?占쎈줈 媛먯냼?占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ice_spear"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.water.threshold = 5; } },
  { id: "meteor_ultra", name: "珥덇컯??硫뷀뀒??", shortDesc: "硫뷀뀒??怨듦꺽 媛뺥솕", desc: "?占쎌뿼 ?占쎌꽦 湲곕낯 怨듦꺽 諛곗쑉??1.5諛곗뿉??2諛곕줈 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["meteor"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.fire.mult = 2.0; } },
  { id: "chain_lightning_ultra", name: "珥덇컯???占쎌뇙 踰덇컻", shortDesc: "?占쎌뇙 踰덇컻 ?占쎌떆???占쎈쪧 30% ??50%", desc: "?占쎌뇙 踰덇컻媛 ?占쎌슧 媛뺣젰?占쎌쭛?占쎈떎", tags: ["light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["chain_lightning"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.light.chance = 0.50; } },
  { id: "storm_ultra", name: "珥덇컯????占쏙옙", shortDesc: "?占쎌옱 泥대젰 怨꾩닔 0.5 ??1.0", desc: "??占쏙옙???占쎌옱 泥대젰 鍮꾬옙? 異뷂옙? ?占쏀빐 怨꾩닔媛 100%占?利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["storm"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.nature.hpFactor = 1.0; } },
  { id: "ice_spear_ultra", name: "珥덇컯???占쎌쓬占?", shortDesc: "理쒙옙? 泥대젰 怨꾩닔 0.5 ??1.0", desc: "?占쎌쓬李쎌쓽 理쒙옙? 泥대젰 鍮꾬옙? 異뷂옙? ?占쏀빐 怨꾩닔媛 100%占?利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["ice_spear"]), apply: (p) => { if (p && p.elementEvolution) p.elementEvolution.water.hpFactor = 1.0; } },

  { id: "special_symbol_boost", name: "?占쎌닔?占쎈낵 媛뺥솕", shortDesc: "?占쎌닔 ?占쎈낵 占?1媛쒖뿉 x2 占?遺占?", desc: "?占쎌닔 ?占쎈낵 占?1媛쒖뿉 x2 猷ъ씠 遺李⑸릺???占쎌옣?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.specialSymbolX2 = true; } },

  { id: "half_fire_water", name: "?占쎌뿼-占??占쎈낵", shortDesc: "?占쎌뿼占?占?紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣", desc: "?占쎌뿼占?占?紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣?占쎈땲??", tags: ["fire", "water"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("fire_water"); } },
  { id: "half_fire_light", name: "?占쎌뿼-踰덇컻 ?占쎈낵", shortDesc: "?占쎌뿼占?踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣", desc: "?占쎌뿼占?踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣?占쎈땲??", tags: ["fire", "light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("fire_light"); } },
  { id: "half_fire_nature", name: "?占쎌뿼-?占쎌뿰 ?占쎈낵", shortDesc: "?占쎌뿼占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣", desc: "?占쎌뿼占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣?占쎈땲??", tags: ["fire", "nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("fire_nature"); } },
  { id: "half_water_light", name: "占?踰덇컻 ?占쎈낵", shortDesc: "臾쇨낵 踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣", desc: "臾쇨낵 踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣?占쎈땲??", tags: ["water", "light"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("light_water"); } },
  { id: "half_water_nature", name: "占??占쎌뿰 ?占쎈낵", shortDesc: "臾쇨낵 ?占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣", desc: "臾쇨낵 ?占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣?占쎈땲??", tags: ["water", "nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("nature_water"); } },
  { id: "half_light_nature", name: "踰덇컻-?占쎌뿰 ?占쎈낵", shortDesc: "踰덇컻?占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣", desc: "踰덇컻?占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵???占쎌옣?占쎈땲??", tags: ["light", "nature"], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("light_nature"); } },
  { id: "rainbow_symbol", name: "臾댐옙?占??占쎈낵", shortDesc: "紐⑤뱺 ?占쎌꽦??留ㅼ튂?占쎈뒗 留뚮뒫 ?占쎈낵 1占??占쎌옣", desc: "紐⑤뱺 ?占쎌꽦??留ㅼ튂?占쎈뒗 留뚮뒫 ?占쎈낵??1占??占쎌옣?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.rainbowEnabled = true; } },
  { id: "rainbow_resonance", name: "臾댐옙?占?怨듬챸", shortDesc: "留뚮뒫 ?占쎈낵??泥댄겕???占쏀븿?占쎈㈃ ?占쎈떦 泥댄겕 ?占쏙옙?吏 +50%", desc: "留뚮뒫 ?占쎈낵??泥댄겕???占쏀븿?占쎈㈃ ?占쎈떦 泥댄겕 ?占쏙옙?吏媛 50% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.rainbowDmgBonus = 0.50; } },
  { id: "row_check_talisman", name: "媛濡쒖껜?占쏙옙???", shortDesc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +1 泥댄겕遺??", desc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +1 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.rowCheckTalismans = (p.rowCheckTalismans || 0) + 1; } },
  { id: "col_check_talisman", name: "?占쎈줈泥댄겕遺??", shortDesc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +1 泥댄겕遺??", desc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +1 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.colCheckTalismans = (p.colCheckTalismans || 0) + 1; } },
  { id: "row_heal_talisman", name: "媛濡쒗쉶蹂듸옙???", shortDesc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 ?占쎈났 遺??", desc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 ?占쎈났 遺?占쎌쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.rowHealTalismans = (p.rowHealTalismans || 0) + 1; } },
  { id: "col_heal_talisman", name: "?占쎈줈?占쎈났遺??", shortDesc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 ?占쎈났 遺??", desc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 ?占쎈났 遺?占쎌쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.colHealTalismans = (p.colHealTalismans || 0) + 1; } },
  { id: "check_talisman_boost", name: "泥댄겕遺?占쎄컯??", shortDesc: "紐⑤뱺 泥댄겕遺?占쎌쓽 泥댄겕 ??+1", desc: "紐⑤뱺 泥댄겕遺?占쎌쓽 泥댄겕 ?占쏙옙? 1 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.checkTalismanExtra = (p.checkTalismanExtra || 0) + 1; } },
  { id: "heal_talisman_boost", name: "?占쎈났遺?占쎄컯??", shortDesc: "紐⑤뱺 ?占쎈났遺???占쎈났??1.5占?", desc: "紐⑤뱺 ?占쎈났遺?占쎌쓽 ?占쎈났?占쎌씠 1.5諛곤옙? ?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.healTalismanMult = 1.5; } },
  { id: "row_dmg_talisman", name: "媛濡쒓컯?占쏙옙???", shortDesc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 ?占쏙옙?吏 1.5占?媛뺥솕遺??", desc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 ?占쏙옙?吏 1.5占?媛뺥솕遺?占쎌쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.rowDamageTalismans = (p.rowDamageTalismans || 0) + 1; } },
  { id: "col_dmg_talisman", name: "?占쎈줈媛뺥솕遺??", shortDesc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 ?占쏙옙?吏 1.5占?媛뺥솕遺??", desc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 ?占쏙옙?吏 1.5占?媛뺥솕遺?占쎌쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.colDamageTalismans = (p.colDamageTalismans || 0) + 1; } },
  { id: "dmg_talisman_boost", name: "媛뺥솕遺?占쎄컯??", shortDesc: "紐⑤뱺 媛뺥솕遺???占쏙옙?吏 利앾옙???2占?", desc: "紐⑤뱺 媛뺥솕遺?占쎌쓽 ?占쏙옙?吏 利앾옙??占쎌씠 2諛곤옙? ?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.dmgTalismanMult = 2.0; } },
  { id: "rune_engrave", name: "占?媛곸씤", shortDesc: "占??占쏙옙?留덈떎 ?占쎈뜡???占쎈낵 1媛쒖뿉 x2 占?遺占?", desc: "占??占쏙옙?留덈떎 ?占쎈뜡???占쎈낵 1媛쒖뿉 x2 猷ъ쓣 遺李⑺빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) p.runePerSpin = 1; } },
  { id: "rune_spread", name: "占??占쎌궛", shortDesc: "x2 占?遺占?媛쒖닔 +1", desc: "x2 猷ъ씠 遺李⑸릺??媛쒖닔媛 1 利앾옙??占쎈땲??", tags: [], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["rune_engrave"]), apply: (p) => { if (p) p.runePerSpin = Math.max(p.runePerSpin || 0, 1) + 1; } },

  { id: "atk_up_1", name: "怨듦꺽??利앾옙? I", shortDesc: "怨듦꺽??+5%", desc: "怨듦꺽?占쎌씠 5% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.baseMatchDamage = Math.max(1, Math.floor((p.baseMatchDamage || 1) * 1.05)); } },
  { id: "atk_up_2", name: "怨듦꺽??利앾옙? II", shortDesc: "怨듦꺽??+10%", desc: "怨듦꺽?占쎌씠 10% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.baseMatchDamage = Math.max(1, Math.floor((p.baseMatchDamage || 1) * 1.10)); } },
  { id: "crit_chance_1", name: "移섎챸?占??占쎈쪧 I", shortDesc: "移섎챸?占??占쎈쪧 +5%", desc: "移섎챸?占??占쎈쪧??5% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.crit = (p.crit || 0) + 0.05; } },
  { id: "crit_dmg_1", name: "移섎챸?占??占쏀빐 I", shortDesc: "移섎챸?占??占쏀빐 +10%", desc: "移섎챸?占??占쏀빐媛 10% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.critDmg = (p.critDmg || 1.5) + 0.10; } },
  { id: "max_hp_up", name: "理쒙옙?泥대젰 利앾옙?", shortDesc: "理쒙옙? HP +15%", desc: "理쒙옙? 泥대젰??15% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) { p.maxHp *= 1.15; p.hp = Math.min(p.hp, p.maxHp); } } },
  { id: "dmg_reduce_1", name: "?占쏀빐媛먯냼 I", shortDesc: "諛쏅뒗 ?占쏀빐 -5%", desc: "諛쏅뒗 ?占쏀빐媛 5% 媛먯냼?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.damageReduction = (p.damageReduction || 0) + 0.05; } },
  { id: "atk_up_3", name: "怨듦꺽??利앾옙? III", shortDesc: "怨듦꺽??+15%", desc: "怨듦꺽?占쎌씠 15% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.baseMatchDamage = Math.max(1, Math.floor((p.baseMatchDamage || 1) * 1.15)); } },
  { id: "crit_chance_2", name: "移섎챸?占??占쎈쪧 II", shortDesc: "移섎챸?占??占쎈쪧 +10%", desc: "移섎챸?占??占쎈쪧??10% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.crit = (p.crit || 0) + 0.10; } },
  { id: "crit_dmg_2", name: "移섎챸?占??占쏀빐 II", shortDesc: "移섎챸?占??占쏀빐 +20%", desc: "移섎챸?占??占쏀빐媛 20% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.critDmg = (p.critDmg || 1.5) + 0.20; } },
  { id: "dmg_reduce_2", name: "?占쏀빐媛먯냼 II", shortDesc: "諛쏅뒗 ?占쏀빐 -10%", desc: "諛쏅뒗 ?占쏀빐媛 10% 媛먯냼?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.damageReduction = (p.damageReduction || 0) + 0.10; } },
  { id: "crisis_power", name: "?占쎄린????", shortDesc: "HP 30% ?占쏀븯????怨듦꺽??+30%", desc: "HP 30% ?占쏀븯????怨듦꺽?占쎌씠 30% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.crisisPower = 0.30; } },
  { id: "desperation", name: "?占쎌궗???占쎄꺽", shortDesc: "HP 50% ?占쏀븯????移섎챸?占??占쎈쪧 +20%", desc: "HP 50% ?占쏀븯????移섎챸?占??占쎈쪧??20% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.desperationCrit = 0.20; } },
  { id: "fortitude", name: "遺덇뎬", shortDesc: "HP 30% ?占쏀븯????諛쏅뒗 ?占쏀빐 -30%", desc: "HP 30% ?占쏀븯????諛쏅뒗 ?占쏀빐媛 30% 媛먯냼?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.fortitudeReduce = 0.30; } },
  { id: "reversal_will", name: "??占쏙옙???占쏙옙?", shortDesc: "HP 30% ?占쏀븯????怨듦꺽??20% 移섎챸?占?占쎈쪧+15% 諛쏇뵾-15%", desc: "HP 30% ?占쏀븯????怨듦꺽?? 移섎챸?占??占쎈쪧, ?占쏀빐 媛먯냼媛 ?占쎄퍡 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.reversalWill = { atk: 0.20, crit: 0.15, reduce: 0.15 }; } },
  { id: "h_pattern_1", name: "媛占?媛뺥솕 I", shortDesc: "媛占??占쏀꽩 諛곗쑉 +20%", desc: "媛占??占쏀꽩 諛곗쑉??20% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.patternMult) p.patternMult.H *= 1.20; } },
  { id: "v_pattern_1", name: "?占쎈줈 媛뺥솕 I", shortDesc: "?占쎈줈 泥댄겕 ?占쏙옙?吏 +15%", desc: "?占쎈줈 泥댄겕 ?占쏙옙?吏媛 15% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.patternMult) p.patternMult.V *= 1.15; } },
  { id: "d_pattern_1", name: "?占쏙옙?媛뺥솕 I", shortDesc: "?占쏙옙?泥댄겕 ?占쏙옙?吏 +20%", desc: "?占쏙옙?泥댄겕 ?占쏙옙?吏媛 20% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.patternMult) p.patternMult.D *= 1.20; } },
  { id: "h_pattern_2", name: "媛占?媛뺥솕 II", shortDesc: "媛占?泥댄겕 ?占쏙옙?吏 +30%", desc: "媛占?泥댄겕 ?占쏙옙?吏媛 30% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.patternMult) p.patternMult.H *= 1.30; } },
  { id: "v_pattern_2", name: "?占쎈줈 媛뺥솕 II", shortDesc: "?占쎈줈 泥댄겕 ?占쏙옙?吏 +25%", desc: "?占쎈줈 泥댄겕 ?占쏙옙?吏媛 25% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.patternMult) p.patternMult.V *= 1.25; } },
  { id: "d_pattern_2", name: "?占쏙옙?媛뺥솕 II", shortDesc: "?占쏙옙?泥댄겕 ?占쏙옙?吏 +30%", desc: "?占쏙옙?泥댄겕 ?占쏙옙?吏媛 30% 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.patternMult) p.patternMult.D *= 1.30; } },
  { id: "pattern_triangle", name: "?占쎄컖??", shortDesc: "嫄곤옙? ?占쎄컖???占쏀꽩 異뷂옙?", desc: "嫄곤옙? ?占쎄컖???占쏀꽩??異뷂옙??占쎈ŉ 泥댄겕???占쎈쭏??怨듦꺽?占쎌씠 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.bigTriangle = true; } },
  { id: "pattern_inv_triangle", name: "??占쏙옙媛곹삎", shortDesc: "嫄곤옙? ??占쏙옙媛곹삎 ?占쏀꽩 異뷂옙?", desc: "嫄곤옙? ??占쏙옙媛곹삎 ?占쏀꽩??異뷂옙??占쎈ŉ 泥댄겕???占쎈쭏??蹂댄샇留됱쓣 ?占쎈뱷?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.bigInvTriangle = true; } },
  { id: "pattern_cross", name: "??占쏙옙媛", shortDesc: "??占쏙옙媛 ?占쏀꽩 異뷂옙?", desc: "??占쏙옙媛 ?占쏀꽩??異뷂옙??占쎈ŉ 泥댄겕???占쎈쭏??泥대젰???占쎈났?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.crossPattern = true; } },

  { id: "combo_accel", name: "媛??", shortDesc: "占?7 肄ㅻ낫留덈떎 ?占쎈뜡????荑⑨옙???1 媛먯냼", desc: "占?7 肄ㅻ낫留덈떎 ?占쎈뜡???占쎌쓽 荑⑨옙??占쎌쓣 1 媛먯냼?占쏀궢?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.accelEvery = 7; } },
  { id: "berserker", name: "愿묒쟾??", shortDesc: "肄ㅻ낫 10 ?占쎌긽 ?占쎌꽦 ??愿묒쟾???占쏀깭", desc: "肄ㅻ낫 10 ?占쎌긽 ?占쎌꽦 ??2?占쎄컙 愿묒쟾???占쏀깭媛 ?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.berserker = true; } },
  { id: "guardian_barrier", name: "?占쏀샇寃곌퀎", shortDesc: "肄ㅻ낫 10 ?占쎌긽 ?占쎌꽦 ??理쒙옙?泥대젰??10% 蹂댄샇占?利됱떆 ?占쎈뱷", desc: "肄ㅻ낫 10 ?占쎌긽 ?占쎌꽦 ??理쒙옙? 泥대젰??10% 蹂댄샇留됱쓣 利됱떆 ?占쎈뱷?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.guardian = true; } },
  { id: "dominator", name: "?占쎌옣??吏諛곗옄", shortDesc: "肄ㅻ낫 10 ?占쎌긽 ?占쎌꽦 ???占쏀깭?占쎌긽 吏?占쏀꽩??+1", desc: "肄ㅻ낫 10 ?占쎌긽 ?占쎌꽦 ???占쎌뿉占?遺?占쏀븯??紐⑤뱺 ?占쏀깭?占쎌긽??吏???占쎌닔媛 利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.dominator = true; } },
  { id: "berserker_boost", name: "愿묒쟾??媛뺥솕", shortDesc: "愿묒쟾??怨듦꺽??利앾옙???+10%", desc: "愿묒쟾???占쏀깭??怨듦꺽??利앾옙??占쎌씠 10% ??利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.berserkerAtkBonus = 0.40; } },
  { id: "guardian_boost", name: "?占쏀샇寃곌퀎媛뺥솕", shortDesc: "?占쏀샇寃곌퀎 蹂댄샇占?20%", desc: "?占쏀샇寃곌퀎占??占쎈뱷?占쎈뒗 蹂댄샇留됱씠 20%媛 ?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.guardianPct = 0.20; } },
  { id: "dominator_boost", name: "?占쎌옣??吏諛곗옄 媛뺥솕", shortDesc: "?占쎌옣??吏諛곗옄 ?占쏀깭?占쎌꽌 ?占쎌뿉占?嫄곕뒗 ?占쏀깭?占쎌긽 吏?占쏀꽩??+1", desc: "?占쎌옣??吏諛곗옄 ?占쏀깭?占쎌꽌 ?占쎌뿉占?嫄곕뒗 ?占쏀깭?占쎌긽 吏???占쎌닔媛 1 ??利앾옙??占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.dominatorStatusBonus = 2; } },
  { id: "combo_master", name: "肄ㅻ낫 留덉뒪??", shortDesc: "紐⑤뱺 ?占쎌슂 肄ㅻ낫 ??2 媛먯냼", desc: "紐⑤뱺 ?占쎌슂 肄ㅻ낫 ?占쏙옙? 2 媛먯냼?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.comboReduction = 2; } },

  { id: "shield_create", name: "諛⑺뙣 ?占쎌꽦", shortDesc: "?占쏀닾 ?占쎌옉 ??諛⑺뙣 1占??占쎈뱷", desc: "?占쏀닾 ?占쎌옉 ??諛⑺뙣 1媛쒙옙? ?占쎈뱷?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.shieldStartCount = Math.max(p.shieldStartCount || 0, 1); } },
  { id: "shield_recharge", name: "諛⑺뙣 異⑹쟾", shortDesc: "占?3?占쎌슫???占쎌옉 ??諛⑺뙣 1占??占쎈뱷", desc: "占?3?占쎌슫???占쎌옉 ??諛⑺뙣 1媛쒙옙? ?占쎈뱷?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.shieldRechargeEvery = 3; } },
  { id: "shield_enhance", name: "諛⑺뙣 媛뺥솕", shortDesc: "諛⑺뙣 ?占쏀빐 媛먯냼??30%", desc: "諛⑺뙣???占쏀빐 媛먯냼?占쎌씠 30%媛 ?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.shieldReducePct = 0.30; } },
  { id: "fire_shield", name: "?占쎌뿼 諛⑺뙣", shortDesc: "諛⑺뙣 ?占쎈え ??怨듦꺽??利앾옙?", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏??怨듦꺽?占쎌씠 ?占쏀닾 醫낅즺 ?占쎄퉴吏 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, apply: (p) => { if (p) p.shieldElement = "fire"; } },
  { id: "light_shield", name: "踰덇컻 諛⑺뙣", shortDesc: "諛⑺뙣 ?占쎈え ???占쎌뿉占??占쏙옙??占쏙옙? 3??", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏???占쎌뿉占??占쏙옙??占쏙옙? 3?占쎌쓣 遺?占쏀빀?占쎈떎.", tags: ["light"], minLevel: 1, apply: (p) => { if (p) p.shieldElement = "light"; } },
  { id: "nature_shield", name: "?占쎌뿰 諛⑺뙣", shortDesc: "諛⑺뙣 ?占쎈え ???占쎌뿉占??占쏙옙??占?3??", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏???占쎌뿉占??占쏙옙??占?3?占쎌쓣 遺?占쏀빀?占쎈떎.", tags: ["nature"], minLevel: 1, apply: (p) => { if (p) p.shieldElement = "nature"; } },
  { id: "ice_shield", name: "?占쎌쓬 諛⑺뙣", shortDesc: "諛⑺뙣 ?占쎈え ???占쎌뿉占??占쎌껜??3??", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏???占쎌뿉占??占쎌껜??3?占쎌쓣 遺?占쏀빀?占쎈떎.", tags: ["water"], minLevel: 1, apply: (p) => { if (p) p.shieldElement = "water"; } },
  { id: "shield_mass", name: "諛⑺뙣 ?占?占쎌깮??", shortDesc: "?占쏀닾 ?占쎌옉 ??諛⑺뙣 2占??占쎈뱷", desc: "?占쏀닾 ?占쎌옉 ??諛⑺뙣占?2占??占쎈뱷?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.shieldStartCount = (p.shieldStartCount || 0) + 1; } },
  { id: "angel_wing", name: "泥쒖궗???占쎄컻", shortDesc: "?占쏀뿕 占?1?占쎌뿉 ?占쏀빐 遺??", desc: "?占쏀뿕 占?1?占쎌뿉 ?占쏀빐 ?占쎈쭩 ??理쒙옙? 泥대젰??50%占?遺?占쏀빀?占쎈떎.", tags: [], minLevel: 1, apply: (p) => { if (p) { p.reviveAvailable = true; p.revivePct = 0.50; } } },
  { id: "immortal", name: "遺덉궗", shortDesc: "移섎챸?占쎌씤 ?占쎄꺽 ??HP 1占??占쎌〈", desc: "移섎챸?占쎌씤 ?占쎄꺽 ??HP 1占??占쎌〈?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.immortal = true; } },
  { id: "true_immortal", name: "吏꾩쭨 遺덉궗", shortDesc: "遺덉궗 諛쒕룞 ??3?占쎄컙 臾댁쟻 蹂댄샇占?", desc: "遺덉궗占??占쎌븘?占쎄쾶 ?占쎈㈃ 3?占쎄컙 臾댁쟻 蹂댄샇留됱쓣 ?占쎈뱷?占쎈땲??", tags: [], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["immortal"]), apply: (p) => { if (p) p.immortalShieldTurns = 3; } },
  { id: "regen", name: "?占쎌깮", shortDesc: "占??占쎌슫???占쎌옉 ??理쒙옙?泥대젰??2% ?占쎈났", desc: "占??占쎌슫???占쎌옉 ??理쒙옙? 泥대젰??2%占??占쎈났?占쎈땲??", tags: [], minLevel: 1, apply: (p) => { if (p) p.regenPct = 0.02; } },
  { id: "strong_regen", name: "媛뺤씤???占쎌깮", shortDesc: "?占쎌깮???占쎈났?占쎌씠 4%占?利앾옙?", desc: "?占쎌깮???占쎈났?占쎌씠 4%占?利앾옙??占쎈땲??", tags: [], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["regen"]), apply: (p) => { if (p) p.regenPct = 0.04; } },
  { id: "crisis_regen", name: "?占쎄린???占쎌깮", shortDesc: "HP 30% ?占쏀븯?????占쎌깮 ?占쎈났??3占?", desc: "HP 30% ?占쏀븯?????占쎌깮???占쎈났?占쎌씠 3諛곤옙? ?占쎈땲??", tags: [], minLevel: 1, requires: (ctx) => hasAnySkill(ctx, ["regen"]), apply: (p) => { if (p) p.regenCrisisMult = 3; } },

];

RAW_SKILLS.push(
  { id: "fire_focus", name: "?占쎌뿼 吏묒쨷", shortDesc: "?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 3, apply: (p) => addSymbolWeight(p, "fire", 1.0) },
  { id: "water_focus", name: "占?吏묒쨷", shortDesc: "占??占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "占??占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 3, apply: (p) => addSymbolWeight(p, "water", 1.0) },
  { id: "light_focus", name: "踰덇컻 吏묒쨷", shortDesc: "踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 3, apply: (p) => addSymbolWeight(p, "light", 1.0) },
  { id: "nature_focus", name: "?占쎌뿰 吏묒쨷", shortDesc: "?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 3, apply: (p) => addSymbolWeight(p, "nature", 1.0) },
  { id: "light_nature_focus", name: "踰덇컻?占??占쎌뿰", shortDesc: "踰덇컻, ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "踰덇컻, ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["light", "nature"], minLevel: 1, maxStacks: 3, apply: (p) => { addSymbolWeight(p, "light", 1.0); addSymbolWeight(p, "nature", 1.0); } },
  { id: "fire_light_focus", name: "?占쎌뿼占?踰덇컻", shortDesc: "?占쎌뿼, 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿼, 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["fire", "light"], minLevel: 1, maxStacks: 3, apply: (p) => { addSymbolWeight(p, "fire", 1.0); addSymbolWeight(p, "light", 1.0); } },
  { id: "water_light_focus", name: "臾쇨낵 踰덇컻", shortDesc: "占? 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "占? 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["water", "light"], minLevel: 1, maxStacks: 3, apply: (p) => { addSymbolWeight(p, "water", 1.0); addSymbolWeight(p, "light", 1.0); } },
  { id: "fire_nature_focus", name: "?占쎌뿰占??占쎌뿼", shortDesc: "?占쎌뿰, ?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿰, ?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["nature", "fire"], minLevel: 1, maxStacks: 3, apply: (p) => { addSymbolWeight(p, "nature", 1.0); addSymbolWeight(p, "fire", 1.0); } },
  { id: "nature_water_focus", name: "臾쇨낵 ?占쎌뿰", shortDesc: "占? ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "占? ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["water", "nature"], minLevel: 1, maxStacks: 3, apply: (p) => { addSymbolWeight(p, "water", 1.0); addSymbolWeight(p, "nature", 1.0); } },
  { id: "fire_water_focus", name: "?占쎌뿼占?占?", shortDesc: "?占쎌뿼, 占??占쎈낵 ?占쎌옣 ?占쎈쪧 議곌툑 利앾옙?", desc: "?占쎌뿼, 占??占쎈낵 ?占쎌옣 ?占쎈쪧??議곌툑 利앾옙??占쎈땲??", tags: ["fire", "water"], minLevel: 1, maxStacks: 3, apply: (p) => { addSymbolWeight(p, "fire", 1.0); addSymbolWeight(p, "water", 1.0); } },

  { id: "fire_dominate", name: "?占쎌뿼 吏占?", shortDesc: "?占쎌뿼 ?占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["fire_focus"]), apply: (p) => addSymbolWeight(p, "fire", 1.2) },
  { id: "water_dominate", name: "占?吏占?", shortDesc: "占??占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "占??占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["water_focus"]), apply: (p) => addSymbolWeight(p, "water", 1.2) },
  { id: "light_dominate", name: "踰덇컻 吏占?", shortDesc: "踰덇컻 ?占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["light_focus"]), apply: (p) => addSymbolWeight(p, "light", 1.2) },
  { id: "nature_dominate", name: "?占쎌뿰 吏占?", shortDesc: "?占쎌뿰 ?占쎈낵 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["nature_focus"]), apply: (p) => addSymbolWeight(p, "nature", 1.2) },
  { id: "light_nature_dominate", name: "踰덇컻?占??占쎌뿰 吏占?", shortDesc: "踰덇컻, ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧 留롮씠 利앾옙?", desc: "踰덇컻, ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["light", "nature"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["light_nature_focus"]), apply: (p) => { addSymbolWeight(p, "light", 1.2); addSymbolWeight(p, "nature", 1.2); } },
  { id: "fire_light_dominate", name: "?占쎌뿼占?踰덇컻 吏占?", shortDesc: "?占쎌뿼, 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿼, 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["fire", "light"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["fire_light_focus"]), apply: (p) => { addSymbolWeight(p, "fire", 1.2); addSymbolWeight(p, "light", 1.2); } },
  { id: "water_light_dominate", name: "臾쇨낵 踰덇컻 吏占?", shortDesc: "占? 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧 留롮씠 利앾옙?", desc: "占? 踰덇컻 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["water", "light"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["water_light_focus"]), apply: (p) => { addSymbolWeight(p, "water", 1.2); addSymbolWeight(p, "light", 1.2); } },
  { id: "fire_nature_dominate", name: "?占쎌뿰占??占쎌뿼 吏占?", shortDesc: "?占쎌뿰, ?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿰, ?占쎌뿼 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["nature", "fire"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["fire_nature_focus"]), apply: (p) => { addSymbolWeight(p, "nature", 1.2); addSymbolWeight(p, "fire", 1.2); } },
  { id: "nature_water_dominate", name: "臾쇨낵 ?占쎌뿰 吏占?", shortDesc: "占? ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧 留롮씠 利앾옙?", desc: "占? ?占쎌뿰 ?占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["water", "nature"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["nature_water_focus"]), apply: (p) => { addSymbolWeight(p, "water", 1.2); addSymbolWeight(p, "nature", 1.2); } },
  { id: "fire_water_dominate", name: "?占쎌뿼占?占?吏占?", shortDesc: "?占쎌뿼, 占??占쎈낵 ?占쎌옣 ?占쎈쪧 留롮씠 利앾옙?", desc: "?占쎌뿼, 占??占쎈낵 ?占쎌옣 ?占쎈쪧??留롮씠 利앾옙??占쎈땲??", tags: ["fire", "water"], minLevel: 1, maxStacks: 3, requires: (ctx) => hasAnySkill(ctx, ["fire_water_focus"]), apply: (p) => { addSymbolWeight(p, "fire", 1.2); addSymbolWeight(p, "water", 1.2); } },

  { id: "fire_convert", name: "?占쎌뿼 蹂??", shortDesc: "?占쏙옙? ???占쎌뿼???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿼?占쎈줈 蹂??", desc: "?占쏙옙? ???占쎌뿼???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿼?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["fire"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["fire_dominate"]), apply: (p) => enableBombard(p, "fire", 1) },
  { id: "water_convert", name: "占?蹂??", shortDesc: "?占쏙옙? ??臾쇱씠 ?占쎈땶 ?占쎈낵 1媛쒙옙? 臾쇰줈 蹂??", desc: "?占쏙옙? ??臾쇱씠 ?占쎈땶 ?占쎈낵 1媛쒙옙? 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["water_dominate"]), apply: (p) => enableBombard(p, "water", 1) },
  { id: "light_convert", name: "踰덇컻 蹂??", shortDesc: "?占쏙옙? ??踰덇컻媛 ?占쎈땶 ?占쎈낵 1媛쒙옙? 踰덇컻占?蹂??", desc: "?占쏙옙? ??踰덇컻媛 ?占쎈땶 ?占쎈낵 1媛쒙옙? 踰덇컻占?蹂?占쏀빀?占쎈떎", tags: ["light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["light_dominate"]), apply: (p) => enableBombard(p, "light", 1) },
  { id: "nature_convert", name: "?占쎌뿰 蹂??", shortDesc: "?占쏙옙? ???占쎌뿰???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿰?占쎈줈 蹂??", desc: "?占쏙옙? ???占쎌뿰???占쎈땶 ?占쎈낵 1媛쒙옙? ?占쎌뿰?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["nature_dominate"]), apply: (p) => enableBombard(p, "nature", 1) },
  { id: "dual_convert_light_nature", name: "占?- ??蹂??", shortDesc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿰?占쎈줈 蹂??", desc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿰?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["light", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["light_nature_dominate"]), apply: (p) => enableDualBombard(p, "light", "nature", 2) },
  { id: "dual_convert_fire_light", name: "占?- ??蹂??", shortDesc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂??", desc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["light", "fire"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["fire_light_dominate"]), apply: (p) => enableDualBombard(p, "light", "fire", 2) },
  { id: "dual_convert_light_water", name: "占?- 占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 臾쇰줈 蹂??", desc: "?占쎈낵 2媛쒙옙? 踰덇컻 ?占쎈뒗 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["light", "water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["water_light_dominate"]), apply: (p) => enableDualBombard(p, "light", "water", 2) },
  { id: "dual_convert_fire_nature", name: "??- ??蹂??", shortDesc: "?占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂??", desc: "?占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 ?占쎌뿼?占쎈줈 蹂?占쏀빀?占쎈떎", tags: ["nature", "fire"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["fire_nature_dominate"]), apply: (p) => enableDualBombard(p, "nature", "fire", 2) },
  { id: "dual_convert_nature_water", name: "??- 占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 臾쇰줈 蹂??", desc: "?占쎈낵 2媛쒙옙? ?占쎌뿰 ?占쎈뒗 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["nature", "water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["nature_water_dominate"]), apply: (p) => enableDualBombard(p, "nature", "water", 2) },
  { id: "dual_convert_fire_water", name: "??- 占?蹂??", shortDesc: "?占쎈낵 2媛쒙옙? ?占쎌뿼 ?占쎈뒗 臾쇰줈 蹂??", desc: "?占쎈낵 2媛쒙옙? ?占쎌뿼 ?占쎈뒗 臾쇰줈 蹂?占쏀빀?占쎈떎", tags: ["fire", "water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["fire_water_dominate"]), apply: (p) => enableDualBombard(p, "fire", "water", 2) },

  { id: "half_light_nature_2", name: "踰덇컻 - ?占쎌뿰 ?占쎈낵 異뷂옙?", shortDesc: "踰덇컻, ?占쎌뿰 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "踰덇컻, ?占쎌뿰 諛섎컲 ?占쎈낵??1占?異뷂옙?占??占쎌옣?占쎈땲??", tags: ["light", "nature"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_light_nature"]), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("light_nature"); } },
  { id: "half_fire_light_2", name: "?占쎌뿼 - 踰덇컻 ?占쎈낵 異뷂옙?", shortDesc: "?占쎌뿼, 踰덇컻 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "?占쎌뿼, 踰덇컻 諛섎컲 ?占쎈낵??1占?異뷂옙?占??占쎌옣?占쎈땲??", tags: ["fire", "light"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_fire_light"]), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("fire_light"); } },
  { id: "half_water_light_2", name: "占?- 踰덇컻 ?占쎈낵 異뷂옙?", shortDesc: "占? 踰덇컻 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "占? 踰덇컻 諛섎컲 ?占쎈낵??1占?異뷂옙?占??占쎌옣?占쎈땲??", tags: ["water", "light"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_water_light"]), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("light_water"); } },
  { id: "half_fire_nature_2", name: "?占쎌뿼 - ?占쎌뿰 ?占쎈낵 異뷂옙?", shortDesc: "?占쎌뿼, ?占쎌뿰 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "?占쎌뿼, ?占쎌뿰 諛섎컲 ?占쎈낵??1占?異뷂옙?占??占쎌옣?占쎈땲??", tags: ["fire", "nature"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_fire_nature"]), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("fire_nature"); } },
  { id: "half_water_nature_2", name: "占?- ?占쎌뿰 ?占쎈낵 異뷂옙?", shortDesc: "占? ?占쎌뿰 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "占? ?占쎌뿰 諛섎컲 ?占쎈낵??1占?異뷂옙?占??占쎌옣?占쎈땲??", tags: ["water", "nature"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_water_nature"]), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("nature_water"); } },
  { id: "half_fire_water_2", name: "?占쎌뿼 - 占??占쎈낵 異뷂옙?", shortDesc: "?占쎌뿼, 占?諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "?占쎌뿼, 占?諛섎컲 ?占쎈낵??1占?異뷂옙?占??占쎌옣?占쎈땲??", tags: ["fire", "water"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_fire_water"]), apply: (p) => { if (p && p.hybridSpawns) p.hybridSpawns.add("fire_water"); } },

  { id: "plasma", name: "?占쎈씪利덈쭏", shortDesc: "?占쎌뿼, 踰덇컻 諛섎컲 ?占쎈낵 5??泥댄겕 ???占쎈씪利덈쭏 諛쒖깮", desc: "?占쎌뿼, 踰덇컻 諛섎컲 ?占쎈낵??5??泥댄겕?占쎈㈃ ?占쎈씪利덈쭏媛 諛쒖깮?占쎈땲??", tags: ["fire", "light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["half_fire_light"]), apply: (p) => { if (p && p.hybridFinishers) p.hybridFinishers.fire_light = true; } },
  { id: "lightning_gale", name: "踰덇컻 ??占쏙옙", shortDesc: "踰덇컻, ?占쎌뿰 諛섎컲 ?占쎈낵 5??泥댄겕 ??踰덇컻 ??占쏙옙 諛쒖깮", desc: "踰덇컻, ?占쎌뿰 諛섎컲 ?占쎈낵??5??泥댄겕?占쎈㈃ 踰덇컻 ??占쏙옙??諛쒖깮?占쎈땲??", tags: ["light", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["half_light_nature"]), apply: (p) => { if (p && p.hybridFinishers) p.hybridFinishers.light_nature = true; } },
  { id: "electrocute", name: "踰덇컻 占?", shortDesc: "占? 踰덇컻 諛섎컲 ?占쎈낵 5??泥댄겕 ??踰덇컻 占?諛쒖깮", desc: "占? 踰덇컻 諛섎컲 ?占쎈낵??5??泥댄겕?占쎈㈃ 踰덇컻 鍮꾬옙? 諛쒖깮?占쎈땲??", tags: ["water", "light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["half_water_light"]), apply: (p) => { if (p && p.hybridFinishers) p.hybridFinishers.water_light = true; } },
  { id: "purifying_flame", name: "?占쎌뿼 ??占쏙옙", shortDesc: "?占쎌뿼, ?占쎌뿰 諛섎컲 ?占쎈낵 5??泥댄겕 ???占쎌뿼 ??占쏙옙 諛쒖깮", desc: "?占쎌뿼, ?占쎌뿰 諛섎컲 ?占쎈낵??5??泥댄겕?占쎈㈃ ?占쎌뿼 ??占쏙옙??諛쒖깮?占쎈땲??", tags: ["fire", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["half_fire_nature"]), apply: (p) => { if (p && p.hybridFinishers) p.hybridFinishers.fire_nature = true; } },
  { id: "tidal", name: "?占쎌씪", shortDesc: "占? ?占쎌뿰 諛섎컲 ?占쎈낵 5??泥댄겕 ???占쎌씪 諛쒖깮", desc: "占? ?占쎌뿰 諛섎컲 ?占쎈낵??5??泥댄겕?占쎈㈃ ?占쎌씪??諛쒖깮?占쎈땲??", tags: ["water", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["half_water_nature"]), apply: (p) => { if (p && p.hybridFinishers) p.hybridFinishers.water_nature = true; } },
  { id: "steam_blast", name: "?占쎌뿼 占?", shortDesc: "?占쎌뿼, 占?諛섎컲 ?占쎈낵 5??泥댄겕 ???占쎌뿼 占?諛쒖깮", desc: "?占쎌뿼, 占?諛섎컲 ?占쎈낵??5??泥댄겕?占쎈㈃ ?占쎌뿼 鍮꾬옙? 諛쒖깮?占쎈땲??", tags: ["fire", "water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["half_fire_water"]), apply: (p) => { if (p && p.hybridFinishers) p.hybridFinishers.fire_water = true; } },

  { id: "max_hp_up", name: "泥대젰 利앾옙? I", shortDesc: "理쒙옙? HP +10%", desc: "理쒙옙? 泥대젰??10% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) { p.maxHp *= 1.10; p.hp = Math.min(p.hp, p.maxHp); } } },
  { id: "max_hp_up_2", name: "泥대젰 利앾옙? II", shortDesc: "理쒙옙? HP +15%", desc: "理쒙옙? 泥대젰??15% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) { p.maxHp *= 1.15; p.hp = Math.min(p.hp, p.maxHp); } } },
  { id: "max_hp_up_3", name: "泥대젰 利앾옙? III", shortDesc: "理쒙옙? HP +25%", desc: "理쒙옙? 泥대젰??25% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) { p.maxHp *= 1.25; p.hp = Math.min(p.hp, p.maxHp); } } },
  { id: "crit_chance_3", name: "移섎챸?占??占쎈쪧 III", shortDesc: "移섎챸?占??占쎈쪧 +15%", desc: "移섎챸?占??占쎈쪧??15% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) p.crit = (p.crit || 0) + 0.15; } },
  { id: "crit_dmg_3", name: "移섎챸?占??占쏀빐 III", shortDesc: "移섎챸?占??占쏀빐 +30%", desc: "移섎챸?占??占쏀빐媛 30% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) p.critDmg = (p.critDmg || 1.5) + 0.30; } },
  { id: "damage_amp", name: "?占쏀빐利앾옙?", shortDesc: "?占쏙옙?吏 利앺룺 +10%", desc: "理쒖쥌 ?占쏙옙?吏媛 10% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) p.damageAmp = (p.damageAmp || 0) + 0.10; } },
  { id: "damage_reduce", name: "?占쏀빐媛먯냼", shortDesc: "?占쏙옙?吏 ?占쎄컧 +10%", desc: "諛쏅뒗 ?占쏀빐媛 10% 媛먯냼?占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) p.damageReduction = (p.damageReduction || 0) + 0.10; } },
  { id: "healthy_body", name: "嫄닿컯???占쎌껜", shortDesc: "HP 70% ?占쎌긽????怨듦꺽??+20%", desc: "HP媛 70% ?占쎌긽????怨듦꺽?占쎌씠 20% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) p.healthyBodyAtk = 0.20; } },
  { id: "perfect_condition", name: "留뚯쟾 ?占쏀깭", shortDesc: "HP 100%????移섎챸?占??占쎈쪧 +30%", desc: "HP媛 100%????移섎챸?占??占쎈쪧??30% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, apply: (p) => { if (p) p.perfectConditionCrit = 0.30; } },

  { id: "shield_recharge", name: "諛⑺뙣 異⑹쟾", shortDesc: "占?3?占쎌슫???占쎌옉 ??留덈떎 諛⑺뙣 1占??占쎈뱷", desc: "占?3?占쎌슫???占쎌옉 ??留덈떎 諛⑺뙣 1媛쒙옙? ?占쎈뱷?占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldRechargeEvery = 3; } },
  { id: "shield_enhance", name: "諛⑺뙣 媛뺥솕", shortDesc: "諛⑺뙣???占쏀빐 媛먯냼?占쎌씠 10% 利앾옙?", desc: "諛⑺뙣???占쏀빐 媛먯냼?占쎌씠 30%媛 ?占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldReducePct = 0.30; } },
  { id: "fire_shield", name: "?占쎌뿼 諛⑺뙣", shortDesc: "諛⑺뙣媛 ?占쎌뿼諛⑺뙣媛 ?占쎈떎", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏??怨듦꺽?占쎌씠 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldElement = "fire"; } },
  { id: "light_shield", name: "踰덇컻 諛⑺뙣", shortDesc: "諛⑺뙣媛 踰덇컻諛⑺뙣媛 ?占쎈떎", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏???占쎌뿉占??占쏙옙??占쏙옙???遺?占쏀빀?占쎈떎", tags: ["light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldElement = "light"; } },
  { id: "nature_shield", name: "?占쎌뿰 諛⑺뙣", shortDesc: "諛⑺뙣媛 ?占쎌뿰諛⑺뙣媛 ?占쎈떎", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏???占쎌뿉占??占쏙옙??占??遺?占쏀빀?占쎈떎", tags: ["nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldElement = "nature"; } },
  { id: "ice_shield", name: "?占쎌쓬 諛⑺뙣", shortDesc: "諛⑺뙣媛 ?占쎌쓬諛⑺뙣媛 ?占쎈떎", desc: "諛⑺뙣媛 ?占쎈씪占??占쎈쭏???占쎌뿉占??占쎌껜???遺?占쏀빀?占쎈떎", tags: ["water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldElement = "water"; } },
  { id: "shield_mass", name: "諛⑺뙣 ?占?占쎌깮??", shortDesc: "?占쏀닾 ?占쎌옉 ??諛⑺뙣占?2占??占쎈뱷?占쎈떎", desc: "?占쏀닾 ?占쎌옉 ??諛⑺뙣占?2占??占쎈뱷?占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["shield_create"]), apply: (p) => { if (p) p.shieldStartCount = (p.shieldStartCount || 0) + 1; } },

  { id: "wraith_row_check_1", name: "媛濡쒖껜?占쏙옙???I", shortDesc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +1 泥댄겕遺??", desc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +1 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎", tags: [], minLevel: 1, maxStacks: 1, eventOnly: true, apply: (p) => { if (p) p.rowCheckTalismans = (p.rowCheckTalismans || 0) + 1; } },
  { id: "wraith_col_check_1", name: "?占쎈줈泥댄겕遺??I", shortDesc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +1 泥댄겕遺??", desc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +1 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎", tags: [], minLevel: 1, maxStacks: 1, eventOnly: true, apply: (p) => { if (p) p.colCheckTalismans = (p.colCheckTalismans || 0) + 1; } },
  { id: "wraith_row_check_2", name: "媛濡쒖껜?占쏙옙???II", shortDesc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +2 泥댄겕遺??", desc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +2 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎", tags: [], minLevel: 1, maxStacks: 1, eventOnly: true, apply: (p) => { if (p) p.rowCheckTalismans = (p.rowCheckTalismans || 0) + 2; } },
  { id: "wraith_col_check_2", name: "?占쎈줈泥댄겕遺??II", shortDesc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +2 泥댄겕遺??", desc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +2 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎", tags: [], minLevel: 1, maxStacks: 1, eventOnly: true, apply: (p) => { if (p) p.colCheckTalismans = (p.colCheckTalismans || 0) + 2; } },
  { id: "wraith_row_check_3", name: "媛濡쒖껜?占쏙옙???III", shortDesc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +3 泥댄겕遺??", desc: "?占쎈뜡 媛濡쒖쨪 1媛쒖뿉 +3 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎", tags: [], minLevel: 1, maxStacks: 1, eventOnly: true, apply: (p) => { if (p) p.rowCheckTalismans = (p.rowCheckTalismans || 0) + 3; } },
  { id: "wraith_col_check_3", name: "?占쎈줈泥댄겕遺??III", shortDesc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +3 泥댄겕遺??", desc: "?占쎈뜡 ?占쎈줈占?1媛쒖뿉 +3 泥댄겕遺?占쎌쓣 遺李⑺빀?占쎈떎", tags: [], minLevel: 1, maxStacks: 1, eventOnly: true, apply: (p) => { if (p) p.colCheckTalismans = (p.colCheckTalismans || 0) + 3; } }
);

RAW_SKILLS.push(
  { id: "half_light_nature", name: "踰덇컻-?占쎌뿰 ?占쎈낵", shortDesc: "踰덇컻?占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵 1占??占쎌옣", desc: "踰덇컻?占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵??1占??占쎌옣?占쎈땲??", tags: ["light", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dual_convert_light_nature"]), apply: (p) => { if (p) { p.hybridSpawns.add("light_nature"); p.hybridSpawnCounts.light_nature = Math.max(1, Number(p.hybridSpawnCounts.light_nature || 0) + 1); } } },
  { id: "half_fire_light", name: "?占쎌뿼-踰덇컻 ?占쎈낵", shortDesc: "?占쎌뿼占?踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵 1占??占쎌옣", desc: "?占쎌뿼占?踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵??1占??占쎌옣?占쎈땲??", tags: ["fire", "light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dual_convert_fire_light"]), apply: (p) => { if (p) { p.hybridSpawns.add("fire_light"); p.hybridSpawnCounts.fire_light = Math.max(1, Number(p.hybridSpawnCounts.fire_light || 0) + 1); } } },
  { id: "half_water_light", name: "占?踰덇컻 ?占쎈낵", shortDesc: "臾쇨낵 踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵 1占??占쎌옣", desc: "臾쇨낵 踰덇컻 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵??1占??占쎌옣?占쎈땲??", tags: ["water", "light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dual_convert_light_water"]), apply: (p) => { if (p) { p.hybridSpawns.add("light_water"); p.hybridSpawnCounts.light_water = Math.max(1, Number(p.hybridSpawnCounts.light_water || 0) + 1); } } },
  { id: "half_fire_nature", name: "?占쎌뿼-?占쎌뿰 ?占쎈낵", shortDesc: "?占쎌뿼占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵 1占??占쎌옣", desc: "?占쎌뿼占??占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵??1占??占쎌옣?占쎈땲??", tags: ["fire", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dual_convert_fire_nature"]), apply: (p) => { if (p) { p.hybridSpawns.add("fire_nature"); p.hybridSpawnCounts.fire_nature = Math.max(1, Number(p.hybridSpawnCounts.fire_nature || 0) + 1); } } },
  { id: "half_water_nature", name: "占??占쎌뿰 ?占쎈낵", shortDesc: "臾쇨낵 ?占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵 1占??占쎌옣", desc: "臾쇨낵 ?占쎌뿰 紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵??1占??占쎌옣?占쎈땲??", tags: ["water", "nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dual_convert_nature_water"]), apply: (p) => { if (p) { p.hybridSpawns.add("nature_water"); p.hybridSpawnCounts.nature_water = Math.max(1, Number(p.hybridSpawnCounts.nature_water || 0) + 1); } } },
  { id: "half_fire_water", name: "?占쎌뿼-占??占쎈낵", shortDesc: "?占쎌뿼占?占?紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵 1占??占쎌옣", desc: "?占쎌뿼占?占?紐⑤몢??留ㅼ튂?占쎈뒗 諛섎컲?占쎈낵??1占??占쎌옣?占쎈땲??", tags: ["fire", "water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dual_convert_fire_water"]), apply: (p) => { if (p) { p.hybridSpawns.add("fire_water"); p.hybridSpawnCounts.fire_water = Math.max(1, Number(p.hybridSpawnCounts.fire_water || 0) + 1); } } },

  { id: "half_light_nature_2", name: "踰덇컻 - ?占쎌뿰 ?占쎈낵 異뷂옙?", shortDesc: "踰덇컻, ?占쎌뿰 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "踰덇컻, ?占쎌뿰 諛섎컲 ?占쎈낵??1占?異뷂옙? ?占쎌옣?占쎈땲??", tags: ["light", "nature"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_light_nature"]), apply: (p) => { if (p) { p.hybridSpawns.add("light_nature"); p.hybridSpawnCounts.light_nature = Math.max(1, Number(p.hybridSpawnCounts.light_nature || 0) + 1); } } },
  { id: "half_fire_light_2", name: "?占쎌뿼 - 踰덇컻 ?占쎈낵 異뷂옙?", shortDesc: "?占쎌뿼, 踰덇컻 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "?占쎌뿼, 踰덇컻 諛섎컲 ?占쎈낵??1占?異뷂옙? ?占쎌옣?占쎈땲??", tags: ["fire", "light"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_fire_light"]), apply: (p) => { if (p) { p.hybridSpawns.add("fire_light"); p.hybridSpawnCounts.fire_light = Math.max(1, Number(p.hybridSpawnCounts.fire_light || 0) + 1); } } },
  { id: "half_water_light_2", name: "占?- 踰덇컻 ?占쎈낵 異뷂옙?", shortDesc: "占? 踰덇컻 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "占? 踰덇컻 諛섎컲 ?占쎈낵??1占?異뷂옙? ?占쎌옣?占쎈땲??", tags: ["water", "light"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_water_light"]), apply: (p) => { if (p) { p.hybridSpawns.add("light_water"); p.hybridSpawnCounts.light_water = Math.max(1, Number(p.hybridSpawnCounts.light_water || 0) + 1); } } },
  { id: "half_fire_nature_2", name: "?占쎌뿼-?占쎌뿰 ?占쎈낵 異뷂옙?", shortDesc: "?占쎌뿼, ?占쎌뿰 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "?占쎌뿼, ?占쎌뿰 諛섎컲 ?占쎈낵??1占?異뷂옙? ?占쎌옣?占쎈땲??", tags: ["fire", "nature"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_fire_nature"]), apply: (p) => { if (p) { p.hybridSpawns.add("fire_nature"); p.hybridSpawnCounts.fire_nature = Math.max(1, Number(p.hybridSpawnCounts.fire_nature || 0) + 1); } } },
  { id: "half_water_nature_2", name: "占??占쎌뿰 ?占쎈낵 異뷂옙?", shortDesc: "占? ?占쎌뿰 諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "占? ?占쎌뿰 諛섎컲 ?占쎈낵??1占?異뷂옙? ?占쎌옣?占쎈땲??", tags: ["water", "nature"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_water_nature"]), apply: (p) => { if (p) { p.hybridSpawns.add("nature_water"); p.hybridSpawnCounts.nature_water = Math.max(1, Number(p.hybridSpawnCounts.nature_water || 0) + 1); } } },
  { id: "half_fire_water_2", name: "?占쎌뿼-占??占쎈낵 異뷂옙?", shortDesc: "?占쎌뿼, 占?諛섎컲 ?占쎈낵 1占?異뷂옙? ?占쎌옣", desc: "?占쎌뿼, 占?諛섎컲 ?占쎈낵??1占?異뷂옙? ?占쎌옣?占쎈땲??", tags: ["fire", "water"], minLevel: 1, maxStacks: 2, requires: (ctx) => hasAnySkill(ctx, ["half_fire_water"]), apply: (p) => { if (p) { p.hybridSpawns.add("fire_water"); p.hybridSpawnCounts.fire_water = Math.max(1, Number(p.hybridSpawnCounts.fire_water || 0) + 1); } } }
);

RAW_SKILLS.push(
  { id: "ember_special_boost", name: "遺덉뵪媛뺥솕", shortDesc: "遺덉뵪占??占쏀븳 ?占쎌긽 1占?-> 2占?", desc: "遺덉뵪占??占쏀븳 ?占쎌긽??2媛쒕줈 利앾옙??占쎈땲??", tags: ["fire"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["ember"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.emberBurnStacks = 2; } },
  { id: "thunder_symbol_boost", name: "泥쒕뫁媛뺥솕", shortDesc: "泥쒕뫁?占쎈줈 ?占쏀븳 ?占쏙옙??占쏙옙? ????+ 1", desc: "泥쒕뫁?占쎈줈 ?占쏀븳 ?占쏙옙??占쏙옙? ???占쏙옙? 1 利앾옙??占쎈땲??", tags: ["light"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["thunder_symbol"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.thunderDizzyTurns = 3; } },
  { id: "thorn_special_boost", name: "媛?占쎄컯??", shortDesc: "媛?占쎈줈 ?占쏀븳 ?占쏙옙??占?1占?-> 2占?", desc: "媛?占쎈줈 ?占쏀븳 ?占쏙옙??占??2媛쒕줈 利앾옙??占쎈땲??", tags: ["nature"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["thorn"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.thornStacks = 2; } },
  { id: "ice_special_boost", name: "?占쎌쓬媛뺥솕", shortDesc: "?占쎌쓬?占쎈줈 ?占쏀븳 ?占쎌껜??1占?-> 2占?", desc: "?占쎌쓬?占쎈줈 ?占쏀븳 ?占쎌껜???2媛쒕줈 利앾옙??占쎈땲??", tags: ["water"], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["ice_shard"]), apply: (p) => { if (p && p.specialSymbol) p.specialSymbol.iceStacks = 2; } },
  { id: "rainbow_resonance", name: "臾댐옙?占?怨듬챸", shortDesc: "留뚮뒫 ?占쎈낵??泥댄겕???占쏀븿?占쎈㈃ ?占쎈떦 泥댄겕 ?占쏙옙?吏 +50%", desc: "留뚮뒫 ?占쎈낵??泥댄겕???占쏀븿?占쎈㈃ ?占쎈떦 泥댄겕 ?占쏙옙?吏媛 50% 利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["rainbow_symbol"]), apply: (p) => { if (p) p.rainbowDmgBonus = 0.50; } }
);

RAW_SKILLS.push(
  { id: "guardian_boost", name: "?占쏀샇寃곌퀎媛뺥솕", shortDesc: "?占쏀샇寃곌퀎占??占쎈뱷?占쎈뒗 蹂댄샇留됱씠 20%媛 ??", desc: "?占쏀샇寃곌퀎占??占쎈뱷?占쎈뒗 蹂댄샇留됱씠 20%媛 ?占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["guardian_barrier"]), apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.guardianPct = 0.20; } },
  { id: "dominator_boost", name: "?占쎌옣??吏諛곗옄 媛뺥솕", shortDesc: "?占쎌옣??吏諛곗옄 ?占쏀깭?占쎌꽌 ?占쎌뿉占?嫄곕뒗 ?占쏀깭?占쎌긽 吏?占쏀꽩??+1", desc: "?占쎌옣??吏諛곗옄 ?占쏀깭?占쎌꽌 ?占쎌뿉占?嫄곕뒗 ?占쏀깭?占쎌긽 吏???占쎌닔媛 1 ??利앾옙??占쎈땲??", tags: [], minLevel: 1, maxStacks: 1, requires: (ctx) => hasAnySkill(ctx, ["dominator"]), apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.dominatorStatusBonus = 2; } }
);

const SKILL_ALLOWLIST = new Set(RAW_SKILLS.map((skill) => skill.id));

const REMOVED_SKILL_IDS = new Set([
  "pattern_triangle",
  "pattern_inv_triangle",
  "pattern_cross",
  "row_check_talisman",
  "col_check_talisman",
  "row_heal_talisman",
  "col_heal_talisman",
  "check_talisman_boost",
  "heal_talisman_boost",
  "row_dmg_talisman",
  "col_dmg_talisman",
  "dmg_talisman_boost",
  "regen",
  "strong_regen",
  "crisis_regen",
  "dmg_reduce_1",
  "dmg_reduce_2",
  "combo_master",
]);

const SKILL_GRADE_BY_ID = {
  fire_focus: "B", water_focus: "B", light_focus: "B", nature_focus: "B",
  fire_dominate: "A", water_dominate: "A", light_dominate: "A", nature_dominate: "A",
  element_monopoly: "S", mono_awakening: "SS",
  fire_convert: "B", water_convert: "B", light_convert: "B", nature_convert: "B",
  fire_erode: "A", water_erode: "A", light_erode: "A", nature_erode: "A",
  dual_convert_light_nature: "S", dual_convert_fire_light: "S", dual_convert_light_water: "S",
  dual_convert_fire_nature: "S", dual_convert_nature_water: "S", dual_convert_fire_water: "S",
  dual_convert_master: "SS",
  ember: "A", thunder_symbol: "A", thorn: "A", ice_shard: "A",
  ember_2: "A", thunder_symbol_2: "A", thorn_2: "A", ice_2: "A",
  ember_special_boost: "SS", thunder_symbol_boost: "SS", thorn_special_boost: "SS", ice_special_boost: "SS",
  ember_boost: "A", dizzy_boost: "A", thorn_boost: "A", ice_boost: "A",
  inferno: "S", critical_wound: "S", daze: "S", permafrost: "S",
  shield_melt: "SS", faint: "SS", hemorrhage: "SS", ice_age: "SS",
  power_symbol: "A", thunderbolt: "A", heal_symbol: "A", protect_symbol: "A",
  power_symbol_2: "A", bolt_2: "A", heal_symbol_2: "A", protect_symbol_2: "A",
  power_enhance: "S", bolt_enhance: "S", heal_enhance: "S", protect_enhance: "S",
  meteor: "A", chain_lightning: "A", storm: "A", ice_spear: "A",
  meteor_fast: "S", chain_lightning_fast: "S", storm_fast: "S", ice_spear_fast: "S",
  meteor_ultra: "SS", chain_lightning_ultra: "SS", storm_ultra: "SS", ice_spear_ultra: "SS",
  special_symbol_boost: "SS",
  half_fire_water: "B", half_fire_light: "B", half_fire_nature: "B",
  half_water_light: "B", half_water_nature: "B", half_light_nature: "B",
  rainbow_symbol: "S", rainbow_resonance: "SS",
  row_check_talisman: "A", col_check_talisman: "A",
  row_heal_talisman: "B", col_heal_talisman: "B",
  check_talisman_boost: "S", heal_talisman_boost: "S",
  row_dmg_talisman: "A", col_dmg_talisman: "A", dmg_talisman_boost: "S",
  rune_engrave: "B", rune_spread: "S",
  atk_up_1: "B", atk_up_2: "B", crit_chance_1: "B", crit_dmg_1: "B", max_hp_up: "B",
  dmg_reduce_1: "A", atk_up_3: "A", crit_chance_2: "A", crit_dmg_2: "A", dmg_reduce_2: "A",
  crisis_power: "S", desperation: "S", fortitude: "S", reversal_will: "SS",
  h_pattern_1: "B", v_pattern_1: "B", d_pattern_1: "B",
  h_pattern_2: "A", v_pattern_2: "A", d_pattern_2: "A",
  pattern_triangle: "S", pattern_inv_triangle: "S", pattern_cross: "S",
  combo_accel: "A", berserker: "S", guardian_barrier: "S", dominator: "S",
  berserker_boost: "S", guardian_boost: "S", dominator_boost: "SS", combo_master: "SS",
  shield_create: "B", shield_recharge: "B",
  shield_enhance: "A", fire_shield: "A", light_shield: "A", nature_shield: "A", ice_shield: "A",
  shield_mass: "S", angel_wing: "SS", immortal: "S", true_immortal: "SS",
  regen: "B", strong_regen: "A", crisis_regen: "S",
};

Object.assign(SKILL_GRADE_BY_ID, {
  fire_focus: "B", water_focus: "B", light_focus: "B", nature_focus: "B",
  light_nature_focus: "B", fire_light_focus: "B", water_light_focus: "B", fire_nature_focus: "B", nature_water_focus: "B", fire_water_focus: "B",
  fire_dominate: "A", water_dominate: "A", light_dominate: "A", nature_dominate: "A",
  light_nature_dominate: "A", fire_light_dominate: "A", water_light_dominate: "A", fire_nature_dominate: "A", nature_water_dominate: "A", fire_water_dominate: "A",
  fire_convert: "A", water_convert: "A", light_convert: "A", nature_convert: "A",
  fire_erode: "A", water_erode: "A", light_erode: "A", nature_erode: "A",
  dual_convert_light_nature: "A", dual_convert_fire_light: "A", dual_convert_light_water: "A", dual_convert_fire_nature: "A", dual_convert_nature_water: "A", dual_convert_fire_water: "A",
  dual_convert_master: "SS",
  ember: "B", thunder_symbol: "B", thorn: "B", ice_shard: "B",
  ember_2: "A", thunder_symbol_2: "A", thorn_2: "A", ice_2: "A",
  ember_special_boost: "SS", thunder_symbol_boost: "SS", thorn_special_boost: "SS", ice_special_boost: "SS",
  power_symbol: "A", thunderbolt: "A", heal_symbol: "A", protect_symbol: "A",
  power_symbol_2: "A", bolt_2: "A", heal_symbol_2: "A", protect_symbol_2: "A",
  half_light_nature: "A", half_fire_light: "A", half_water_light: "A", half_fire_nature: "A", half_water_nature: "A", half_fire_water: "A",
  half_light_nature_2: "S", half_fire_light_2: "S", half_water_light_2: "S", half_fire_nature_2: "S", half_water_nature_2: "S", half_fire_water_2: "S",
  lightning_gale: "SS", plasma: "SS", electrocute: "SS", purifying_flame: "SS", tidal: "SS", steam_blast: "SS",
  atk_up_1: "B", crit_chance_1: "B", max_hp_up: "B", crit_dmg_1: "B",
  atk_up_2: "A", crit_chance_2: "A", max_hp_up_2: "A", crit_dmg_2: "A",
  atk_up_3: "S", crit_chance_3: "S", max_hp_up_3: "S", crit_dmg_3: "S",
  damage_amp: "SS", damage_reduce: "SS",
  crisis_power: "S", desperation: "S", fortitude: "S", reversal_will: "SS", healthy_body: "S", perfect_condition: "S",
  shield_create: "B", shield_recharge: "B", shield_enhance: "A", fire_shield: "A", light_shield: "A", nature_shield: "A", ice_shield: "A", shield_mass: "S",
  wraith_row_check_1: "A", wraith_col_check_1: "A", wraith_row_check_2: "S", wraith_col_check_2: "S", wraith_row_check_3: "SS", wraith_col_check_3: "SS",
});

function withSkillMeta(skill) {
  const grade = SKILL_GRADE_BY_ID[skill.id] || "";
  if (!grade) return skill;
  return { ...skill, grade };
}

function skillGrade(skill) {
  if (!skill || typeof skill.grade !== "string") return "";
  return skill.grade.toUpperCase();
}

const SKILLS = (() => {
  const byId = new Map();
  for (const skill of RAW_SKILLS) {
    if (!SKILL_ALLOWLIST.has(skill.id)) continue;
    if (REMOVED_SKILL_IDS.has(skill.id)) continue;
    byId.set(skill.id, withSkillMeta(skill));
  }
  const noRequireIds = new Set([
    // 속성 확률
    "fire_dominate", "water_dominate", "light_dominate", "nature_dominate",
    "light_nature_dominate", "fire_light_dominate", "water_light_dominate",
    "fire_nature_dominate", "nature_water_dominate", "fire_water_dominate",
    "mono_awakening",
    // 속성 변환
    "fire_convert", "water_convert", "light_convert", "nature_convert",
    "fire_erode", "water_erode", "light_erode", "nature_erode",
    "dual_convert_light_nature", "dual_convert_fire_light", "dual_convert_light_water",
    "dual_convert_fire_nature", "dual_convert_nature_water", "dual_convert_fire_water",
    "dual_convert_master",
  ]);
  for (const id of noRequireIds) {
    if (!byId.has(id)) continue;
    const skill = byId.get(id);
    byId.set(id, {
      ...skill,
      requires: undefined,
    });
  }
  const restoreRequires = {
    fire_convert: (ctx) => hasAnySkill(ctx, ["fire_focus"]),
    water_convert: (ctx) => hasAnySkill(ctx, ["water_focus"]),
    light_convert: (ctx) => hasAnySkill(ctx, ["light_focus"]),
    nature_convert: (ctx) => hasAnySkill(ctx, ["nature_focus"]),
    dual_convert_light_nature: (ctx) => hasAnySkill(ctx, ["light_nature_focus"]),
    dual_convert_fire_light: (ctx) => hasAnySkill(ctx, ["fire_light_focus"]),
    dual_convert_light_water: (ctx) => hasAnySkill(ctx, ["water_light_focus"]),
    dual_convert_fire_nature: (ctx) => hasAnySkill(ctx, ["fire_nature_focus"]),
    dual_convert_nature_water: (ctx) => hasAnySkill(ctx, ["nature_water_focus"]),
    dual_convert_fire_water: (ctx) => hasAnySkill(ctx, ["fire_water_focus"]),
    fire_erode: (ctx) => hasAnySkill(ctx, ["fire_convert"]),
    water_erode: (ctx) => hasAnySkill(ctx, ["water_convert"]),
    light_erode: (ctx) => hasAnySkill(ctx, ["light_convert"]),
    nature_erode: (ctx) => hasAnySkill(ctx, ["nature_convert"]),
    dual_convert_master: (ctx) => hasAnySkill(ctx, DUAL_CONVERT_IDS),
  };
  for (const [id, requires] of Object.entries(restoreRequires)) {
    if (!byId.has(id)) continue;
    const skill = byId.get(id);
    byId.set(id, {
      ...skill,
      requires,
    });
  }
  if (byId.has("berserker_boost")) {
    const skill = byId.get("berserker_boost");
    byId.set("berserker_boost", {
      ...skill,
      requires: (ctx) => hasAnySkill(ctx, ["berserker"]),
    });
  }
  if (byId.has("guardian_boost")) {
    const skill = byId.get("guardian_boost");
    byId.set("guardian_boost", {
      ...skill,
      requires: (ctx) => hasAnySkill(ctx, ["guardian_barrier"]),
    });
  }
  if (byId.has("dominator_boost")) {
    const skill = byId.get("dominator_boost");
    byId.set("dominator_boost", {
      ...skill,
      requires: (ctx) => hasAnySkill(ctx, ["dominator"]),
    });
  }
  const comboSkillOverrides = {
    combo_accel: {
      name: "가속",
      shortDesc: "매 4콤보마다 랜덤한 펫의 쿨타임 1 감소",
      desc: "매 4콤보마다 랜덤한 펫의 쿨타임을 1 감소시킵니다.",
      apply: (p) => { if (p && p.comboEnhance) p.comboEnhance.accelEvery = 4; },
    },
    berserker: {
      name: "광전사",
      shortDesc: "콤보 5 이상 달성 시 2턴간 '광전사' 상태",
      desc: "콤보 5 이상 달성 시 2턴간 '광전사' 상태가 됩니다. 공격력 +30%, 받는 피해 +15%",
    },
    guardian_barrier: {
      name: "수호결계",
      shortDesc: "콤보 5 이상 달성 시 최대체력의 10% 보호막 획득",
      desc: "콤보 5 이상 달성 시 최대체력의 10% 보호막을 즉시 획득합니다.",
    },
    dominator: {
      name: "전장의 지배자",
      shortDesc: "콤보 5 이상 달성 시 3턴간 상태이상 지속 +1",
      desc: "콤보 5 이상 달성 시 3턴간 '전장의 지배자' 상태가 됩니다. 적에게 부여하는 모든 상태이상의 지속 턴수 +1",
    },
  };
  for (const [id, patch] of Object.entries(comboSkillOverrides)) {
    if (!byId.has(id)) continue;
    const skill = byId.get(id);
    byId.set(id, {
      ...skill,
      ...patch,
    });
  }
  return [...byId.values()];
})();
