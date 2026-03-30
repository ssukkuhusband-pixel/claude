// ?먥븧??entities.js ??Skill helpers, Pet/Deco management, Gacha, UI menus ?먥븧??

// ?? i18n helpers for entity names/descriptions ??

function equipNameI18n(equip) {
  if (state.lang === "zh" && typeof EQUIP_ZH !== "undefined" && EQUIP_ZH[equip.rootId]) return EQUIP_ZH[equip.rootId].name;
  return equip.name;
}
function equipPassiveDescI18n(equip, gradeLabel) {
  if (state.lang === "zh" && typeof EQUIP_ZH !== "undefined" && EQUIP_ZH[equip.rootId]) {
    const zh = EQUIP_ZH[equip.rootId]; if (zh.passives && zh.passives[gradeLabel]) return zh.passives[gradeLabel];
  }
  return null;
}
function petNameI18n(pet) {
  if (state.lang === "zh" && typeof PET_ZH !== "undefined" && PET_ZH[pet.id]) return PET_ZH[pet.id].name;
  return pet.name;
}
function petActiveNameI18n(pet) {
  if (state.lang === "zh" && typeof PET_ZH !== "undefined" && PET_ZH[pet.id]) return PET_ZH[pet.id].activeName || pet.activeName;
  return pet.activeName;
}
function petActiveDescI18n(pet) {
  if (state.lang === "zh" && typeof PET_ZH !== "undefined" && PET_ZH[pet.id]) return PET_ZH[pet.id].activeDesc || pet.activeDesc;
  return pet.activeDesc;
}
function petPassiveI18n(pet, idx) {
  const key = `passive${idx}`;
  if (state.lang === "zh" && typeof PET_ZH !== "undefined" && PET_ZH[pet.id]) return PET_ZH[pet.id][key] || pet[key];
  return pet[key];
}
function decoNameI18n(deco) {
  if (state.lang === "zh" && typeof DECO_ZH !== "undefined" && DECO_ZH[deco.id]) return DECO_ZH[deco.id].name;
  return deco.name;
}
function decoLevelDescI18n(deco, lvIdx) {
  if (state.lang === "zh" && typeof DECO_ZH !== "undefined" && DECO_ZH[deco.id] && DECO_ZH[deco.id].desc) {
    const lines = DECO_ZH[deco.id].desc.split("\n"); if (lines[lvIdx]) { const m = lines[lvIdx].match(/^Lv\d+:\s*(.+)/); return m ? m[1] : lines[lvIdx]; }
  }
  return null;
}
function decoShortDescI18n(deco) {
  if (state.lang === "zh" && typeof DECO_ZH !== "undefined" && DECO_ZH[deco.id]) return DECO_ZH[deco.id].shortDesc || "";
  return "";
}
function equipPartNameI18n(partNum) {
  const keys = { 1:"ui.slotWeapon", 2:"ui.slotNecklace", 3:"ui.slotEarring", 4:"ui.slotArmor", 5:"ui.slotGloves", 6:"ui.slotShoes" };
  return t(keys[partNum], null, EQUIP_PART_NAMES[partNum] || "");
}
function equipAxisNameI18n(axis) {
  const keys = { 1:"ui.setSpeed", 2:"ui.setChain", 3:"ui.setEndure" };
  return t(keys[axis], null, EQUIP_AXIS_NAMES[axis] || "");
}
function equipTierNameI18n(tier) {
  const keys = { 1:"ui.tierNormal", 2:"ui.tierStar" };
  return t(keys[tier], null, EQUIP_TIER_NAMES[tier] || "");
}
function mergeTypeLabelI18n(type) {
  const keys = { 1:"ui.mergeTypeSame", 2:"ui.mergeTypePart", 3:"ui.mergeTypeTierPart" };
  return t(keys[type], null, MERGE_TYPE_LABELS[type] || "");
}
function multLabelI18n(multType) {
  return multType === "add" ? t("ui.decoMultAdd") : t("ui.decoMultMul");
}
function multLabelFullI18n(multType) {
  return multType === "add" ? t("ui.multAddFull") : t("ui.multMulFull");
}
function tagLabelI18n(tag) {
  const keys = { attack:"ui.tagAttack", buff:"ui.tagBuff", debuff:"ui.tagDebuff", special:"ui.tagSpecial" };
  return t(keys[tag], null, tag);
}
function statLabelI18n(stat) {
  const keys = { atkPct:"ui.statAtkPct", hpPct:"ui.statHpPct", critPct:"ui.statCritPct", critDmgPct:"ui.statCritDmgPct", defPct:"ui.statDefPct" };
  return t(keys[stat], null, stat);
}

const SKILL_TEXT_OVERRIDES = {
  fire_focus: { name: "화염 집중", short: "화염 심볼 등장 확률 증가", desc: "화염 심볼 등장 확률이 증가합니다." },
  water_focus: { name: "물 집중", short: "물 심볼 등장 확률 증가", desc: "물 심볼 등장 확률이 증가합니다." },
  light_focus: { name: "번개 집중", short: "번개 심볼 등장 확률 증가", desc: "번개 심볼 등장 확률이 증가합니다." },
  nature_focus: { name: "자연 집중", short: "자연 심볼 등장 확률 증가", desc: "자연 심볼 등장 확률이 증가합니다." },
  fire_dominate: { name: "화염 지배", short: "화염 심볼 등장 확률 대폭 증가", desc: "화염 심볼 등장 확률이 크게 증가합니다." },
  water_dominate: { name: "물 지배", short: "물 심볼 등장 확률 대폭 증가", desc: "물 심볼 등장 확률이 크게 증가합니다." },
  light_dominate: { name: "번개 지배", short: "번개 심볼 등장 확률 대폭 증가", desc: "번개 심볼 등장 확률이 크게 증가합니다." },
  nature_dominate: { name: "자연 지배", short: "자연 심볼 등장 확률 대폭 증가", desc: "자연 심볼 등장 확률이 크게 증가합니다." },
  light_nature_focus: { name: "번개와 자연", short: "번개·자연 심볼 등장 확률 증가", desc: "번개와 자연 심볼 등장 확률이 증가합니다." },
  fire_light_focus: { name: "화염과 번개", short: "화염·번개 심볼 등장 확률 증가", desc: "화염과 번개 심볼 등장 확률이 증가합니다." },
  water_light_focus: { name: "물과 번개", short: "물·번개 심볼 등장 확률 증가", desc: "물과 번개 심볼 등장 확률이 증가합니다." },
  fire_nature_focus: { name: "자연과 화염", short: "자연·화염 심볼 등장 확률 증가", desc: "자연과 화염 심볼 등장 확률이 증가합니다." },
  nature_water_focus: { name: "물과 자연", short: "물·자연 심볼 등장 확률 증가", desc: "물과 자연 심볼 등장 확률이 증가합니다." },
  fire_water_focus: { name: "화염과 물", short: "화염·물 심볼 등장 확률 증가", desc: "화염과 물 심볼 등장 확률이 증가합니다." },
  light_nature_dominate: { name: "번개와 자연 지배", short: "번개·자연 심볼 등장 확률 대폭 증가", desc: "번개와 자연 심볼 등장 확률이 크게 증가합니다." },
  fire_light_dominate: { name: "화염과 번개 지배", short: "화염·번개 심볼 등장 확률 대폭 증가", desc: "화염과 번개 심볼 등장 확률이 크게 증가합니다." },
  water_light_dominate: { name: "물과 번개 지배", short: "물·번개 심볼 등장 확률 대폭 증가", desc: "물과 번개 심볼 등장 확률이 크게 증가합니다." },
  fire_nature_dominate: { name: "자연과 화염 지배", short: "자연·화염 심볼 등장 확률 대폭 증가", desc: "자연과 화염 심볼 등장 확률이 크게 증가합니다." },
  nature_water_dominate: { name: "물과 자연 지배", short: "물·자연 심볼 등장 확률 대폭 증가", desc: "물과 자연 심볼 등장 확률이 크게 증가합니다." },
  fire_water_dominate: { name: "화염과 물 지배", short: "화염·물 심볼 등장 확률 대폭 증가", desc: "화염과 물 심볼 등장 확률이 크게 증가합니다." },
  element_monopoly: { name: "속성 독점", short: "가장 높은 속성 등장 확률 증가", desc: "현재 가장 높은 속성의 등장 확률을 추가로 올립니다." },
  mono_awakening: { name: "단일속성 각성", short: "50% 이상 속성 공격력 +30%", desc: "등장 확률이 50% 이상인 속성의 공격력이 30% 증가합니다." },
  fire_convert: { name: "화염 변환", short: "화염이 아닌 심볼 1개를 화염으로 변환", desc: "스핀 후 화염이 아닌 심볼 1개를 화염으로 변환합니다." },
  water_convert: { name: "물 변환", short: "물이 아닌 심볼 1개를 물로 변환", desc: "스핀 후 물이 아닌 심볼 1개를 물로 변환합니다." },
  light_convert: { name: "번개 변환", short: "번개가 아닌 심볼 1개를 번개로 변환", desc: "스핀 후 번개가 아닌 심볼 1개를 번개로 변환합니다." },
  nature_convert: { name: "자연 변환", short: "자연이 아닌 심볼 1개를 자연으로 변환", desc: "스핀 후 자연이 아닌 심볼 1개를 자연으로 변환합니다." },
  fire_erode: { name: "화염 침식", short: "화염 변환 1개 추가", desc: "화염 변환으로 바뀌는 심볼이 1개 추가됩니다." },
  water_erode: { name: "물 침식", short: "물 변환 1개 추가", desc: "물 변환으로 바뀌는 심볼이 1개 추가됩니다." },
  light_erode: { name: "번개 침식", short: "번개 변환 1개 추가", desc: "번개 변환으로 바뀌는 심볼이 1개 추가됩니다." },
  nature_erode: { name: "자연 침식", short: "자연 변환 1개 추가", desc: "자연 변환으로 바뀌는 심볼이 1개 추가됩니다." },
  dual_convert_light_nature: { name: "번-자 변환", short: "심볼 2개를 번개 또는 자연으로 변환", desc: "스핀 후 심볼 2개를 번개 또는 자연으로 변환합니다." },
  dual_convert_fire_light: { name: "번-화 변환", short: "심볼 2개를 번개 또는 화염으로 변환", desc: "스핀 후 심볼 2개를 번개 또는 화염으로 변환합니다." },
  dual_convert_light_water: { name: "번-물 변환", short: "심볼 2개를 번개 또는 물로 변환", desc: "스핀 후 심볼 2개를 번개 또는 물로 변환합니다." },
  dual_convert_fire_nature: { name: "자-화 변환", short: "심볼 2개를 자연 또는 화염으로 변환", desc: "스핀 후 심볼 2개를 자연 또는 화염으로 변환합니다." },
  dual_convert_nature_water: { name: "자-물 변환", short: "심볼 2개를 자연 또는 물로 변환", desc: "스핀 후 심볼 2개를 자연 또는 물로 변환합니다." },
  dual_convert_fire_water: { name: "화-물 변환", short: "심볼 2개를 화염 또는 물로 변환", desc: "스핀 후 심볼 2개를 화염 또는 물로 변환합니다." },
  dual_convert_master: { name: "이중변환 마스터", short: "이중변환 결과가 반반심볼로 등장", desc: "이중변환 결과가 모두 반반심볼로 등장합니다." },
  ember: { name: "불씨", short: "화염 심볼 1개가 불씨로 등장", desc: "불씨 심볼 체크 시 화상 2턴을 부여합니다." },
  thunder_symbol: { name: "천둥", short: "번개 심볼 1개가 천둥으로 등장", desc: "천둥 심볼 체크 시 적에게 어지러움을 부여합니다." },
  thorn: { name: "가시", short: "자연 심볼 1개가 가시로 등장", desc: "가시 심볼 체크 시 따가움 2턴을 부여합니다." },
  ice_shard: { name: "얼음", short: "물 심볼 1개가 얼음으로 등장", desc: "얼음 심볼 체크 시 저체온 1개를 부여합니다." },
  ember_2: { name: "불씨 추가!", short: "불씨 1개 추가 등장", desc: "불씨 심볼이 1개 추가로 등장합니다." },
  thunder_symbol_2: { name: "천둥 추가!", short: "천둥 1개 추가 등장", desc: "천둥 심볼이 1개 추가로 등장합니다." },
  thorn_2: { name: "가시 추가!", short: "가시 1개 추가 등장", desc: "가시 심볼이 1개 추가로 등장합니다." },
  ice_2: { name: "얼음 추가!", short: "얼음 1개 추가 등장", desc: "얼음 심볼이 1개 추가로 등장합니다." },
  ember_special_boost: { name: "불씨강화", short: "불씨 화상 1개 -> 2개", desc: "불씨로 부여하는 화상 스택이 2개가 됩니다." },
  thunder_symbol_boost: { name: "천둥강화", short: "천둥 어지러움 턴 +1", desc: "천둥으로 부여하는 어지러움 지속 턴이 늘어납니다." },
  thorn_special_boost: { name: "가시강화", short: "가시 따가움 1개 -> 2개", desc: "가시로 부여하는 따가움 스택이 2개가 됩니다." },
  ice_special_boost: { name: "얼음강화", short: "얼음 저체온 1개 -> 2개", desc: "얼음으로 부여하는 저체온 스택이 2개가 됩니다." },
  ember_boost: { name: "화상 강화", short: "화상 피해량 +30%", desc: "화상 피해량이 30% 증가합니다." },
  dizzy_boost: { name: "어지러움 강화", short: "어지러움 적 공격력 -10%", desc: "어지러움 상태의 적 공격력이 10% 감소합니다." },
  thorn_boost: { name: "따가움 강화", short: "따가움 피해 증가량 +5%", desc: "따가움의 받는 피해 증가량이 5% 증가합니다." },
  ice_boost: { name: "빙결 강화", short: "빙결 지속 턴 +1", desc: "빙결 지속 턴이 1 증가합니다." },
  inferno: { name: "업화", short: "화상 피해 +50%, 지속 +1턴", desc: "화상 피해량이 증가하고 지속 턴이 1 늘어납니다." },
  critical_wound: { name: "치명상", short: "어지러움에 피해감소 감소 효과 추가", desc: "어지러움 상태인 적의 피해감소를 낮춥니다." },
  daze: { name: "혼미", short: "따가움 +5%, 지속 +1턴", desc: "따가움의 받는 피해 증가량과 지속 턴이 늘어납니다." },
  permafrost: { name: "영구동토", short: "저체온 2스택이면 빙결", desc: "저체온 2스택에서 빙결이 발동합니다." },
  shield_melt: { name: "보호막 녹이기", short: "화상이 보호막에 주는 피해 +100%", desc: "화상이 보호막에 주는 피해량이 100% 증가합니다." },
  faint: { name: "혼절", short: "어지러움 적 반격/연속공격 확률 -50%", desc: "어지러움 상태의 적 반격 및 연속공격 확률이 감소합니다." },
  hemorrhage: { name: "과다출혈", short: "따가움 적 회복량 -80%", desc: "따가움 상태인 적의 회복량이 크게 감소합니다." },
  ice_age: { name: "빙하기", short: "빙결 적 피해감면 무효", desc: "빙결 상태인 적의 피해감면 효과를 무효화합니다." },
  power_symbol: { name: "파워", short: "화염 심볼 1개가 파워로 등장", desc: "파워 심볼 체크 시 공격력이 증가합니다." },
  thunderbolt: { name: "낙뢰", short: "번개 심볼 1개가 낙뢰로 등장", desc: "낙뢰 심볼 체크 시 미니 번개가 추가 공격합니다." },
  heal_symbol: { name: "회복", short: "자연 심볼 1개가 회복으로 등장", desc: "회복 심볼 체크 시 최대 체력의 일부를 회복합니다." },
  protect_symbol: { name: "보호", short: "물 심볼 1개가 보호로 등장", desc: "보호 심볼 체크 시 보호막을 획득합니다." },
  power_symbol_2: { name: "파워 추가!", short: "파워 1개 추가 등장", desc: "파워 심볼이 1개 추가로 등장합니다." },
  bolt_2: { name: "낙뢰 추가!", short: "낙뢰 1개 추가 등장", desc: "낙뢰 심볼이 1개 추가로 등장합니다." },
  heal_symbol_2: { name: "회복 추가!", short: "회복 1개 추가 등장", desc: "회복 심볼이 1개 추가로 등장합니다." },
  protect_symbol_2: { name: "보호 추가!", short: "보호 1개 추가 등장", desc: "보호 심볼이 1개 추가로 등장합니다." },
  power_enhance: { name: "파워강화", short: "파워 공격력 증가량 7%", desc: "파워 심볼의 공격력 증가량이 7%가 됩니다." },
  bolt_enhance: { name: "낙뢰강화", short: "낙뢰 미니 번개 1개 -> 2개", desc: "낙뢰 심볼 체크 시 생성되는 미니 번개가 2개가 됩니다." },
  heal_enhance: { name: "회복강화", short: "회복량 7%", desc: "회복 심볼의 회복량이 증가합니다." },
  protect_enhance: { name: "보호강화", short: "보호막 8%", desc: "보호 심볼의 보호막 크기가 증가합니다." },
  meteor: { name: "메테오", short: "파워 10회 이상 체크된 턴 화염 강화", desc: "파워 심볼을 충분히 체크한 턴의 화염 공격이 메테오로 강화됩니다." },
  chain_lightning: { name: "연쇄 번개", short: "낙뢰 10회 이상 체크된 턴 번개 재시전", desc: "낙뢰 심볼을 충분히 체크한 턴의 번개 공격이 연쇄 번개로 강화됩니다." },
  storm: { name: "폭풍", short: "회복 10회 이상 체크된 턴 자연 강화", desc: "회복 심볼을 충분히 체크한 턴의 자연 공격이 폭풍으로 강화됩니다." },
  ice_spear: { name: "얼음창", short: "보호 10회 이상 체크된 턴 물 강화", desc: "보호 심볼을 충분히 체크한 턴의 물 공격이 얼음창으로 강화됩니다." },
  meteor_fast: { name: "효율 메테오", short: "메테오 조건 10 -> 5", desc: "메테오 발동 조건이 5회로 감소합니다." },
  chain_lightning_fast: { name: "효율 연쇄 번개", short: "연쇄 번개 조건 10 -> 5", desc: "연쇄 번개 발동 조건이 5회로 감소합니다." },
  storm_fast: { name: "효율 폭풍", short: "폭풍 조건 10 -> 5", desc: "폭풍 발동 조건이 5회로 감소합니다." },
  ice_spear_fast: { name: "효율 얼음창", short: "얼음창 조건 10 -> 5", desc: "얼음창 발동 조건이 5회로 감소합니다." },
  meteor_ultra: { name: "초강력 메테오", short: "메테오 배율 강화", desc: "메테오의 화염 기본 공격 배율이 더 증가합니다." },
  chain_lightning_ultra: { name: "초강력 연쇄 번개", short: "연쇄 번개 재시전 확률 강화", desc: "연쇄 번개의 재시전 확률이 더 증가합니다." },
  storm_ultra: { name: "초강력 폭풍", short: "폭풍 체력 계수 강화", desc: "폭풍의 현재 체력 비례 계수가 강화됩니다." },
  ice_spear_ultra: { name: "초강력 얼음창", short: "얼음창 체력 계수 강화", desc: "얼음창의 최대 체력 비례 계수가 강화됩니다." },
  special_symbol_boost: { name: "특수심볼 강화", short: "특수 심볼 1개에 x2 룬 부착", desc: "특수 심볼 중 1개에 x2 룬이 부착되어 등장합니다." },
  half_light_nature: { name: "번개-자연 심볼", short: "번개·자연 반반 심볼 1개 등장", desc: "번개와 자연 모두에 매치되는 반반 심볼이 등장합니다." },
  half_fire_light: { name: "화염-번개 심볼", short: "화염·번개 반반 심볼 1개 등장", desc: "화염과 번개 모두에 매치되는 반반 심볼이 등장합니다." },
  half_water_light: { name: "물-번개 심볼", short: "물·번개 반반 심볼 1개 등장", desc: "물과 번개 모두에 매치되는 반반 심볼이 등장합니다." },
  half_fire_nature: { name: "화염-자연 심볼", short: "화염·자연 반반 심볼 1개 등장", desc: "화염과 자연 모두에 매치되는 반반 심볼이 등장합니다." },
  half_water_nature: { name: "물-자연 심볼", short: "물·자연 반반 심볼 1개 등장", desc: "물과 자연 모두에 매치되는 반반 심볼이 등장합니다." },
  half_fire_water: { name: "화염-물 심볼", short: "화염·물 반반 심볼 1개 등장", desc: "화염과 물 모두에 매치되는 반반 심볼이 등장합니다." },
  half_light_nature_2: { name: "번개-자연 심볼 추가", short: "번개·자연 반반 심볼 1개 추가", desc: "번개와 자연 반반 심볼이 1개 추가됩니다." },
  half_fire_light_2: { name: "화염-번개 심볼 추가", short: "화염·번개 반반 심볼 1개 추가", desc: "화염과 번개 반반 심볼이 1개 추가됩니다." },
  half_water_light_2: { name: "물-번개 심볼 추가", short: "물·번개 반반 심볼 1개 추가", desc: "물과 번개 반반 심볼이 1개 추가됩니다." },
  half_fire_nature_2: { name: "화염-자연 심볼 추가", short: "화염·자연 반반 심볼 1개 추가", desc: "화염과 자연 반반 심볼이 1개 추가됩니다." },
  half_water_nature_2: { name: "물-자연 심볼 추가", short: "물·자연 반반 심볼 1개 추가", desc: "물과 자연 반반 심볼이 1개 추가됩니다." },
  half_fire_water_2: { name: "화염-물 심볼 추가", short: "화염·물 반반 심볼 1개 추가", desc: "화염과 물 반반 심볼이 1개 추가됩니다." },
  plasma: { name: "플라즈마", short: "화염·번개 반반 5회 체크 시 발동", desc: "화염과 번개 최종 데미지 합 기반 추가타가 발동합니다." },
  lightning_gale: { name: "번개 폭풍", short: "번개·자연 반반 5회 체크 시 발동", desc: "보호막 파괴 효과를 가진 번개 폭풍이 발동합니다." },
  electrocute: { name: "번개 비", short: "물·번개 반반 5회 체크 시 발동", desc: "적의 스킬을 봉인하는 번개 비가 발동합니다." },
  purifying_flame: { name: "화염 폭풍", short: "화염·자연 반반 5회 체크 시 발동", desc: "회복 방해 효과를 가진 화염 폭풍이 발동합니다." },
  tidal: { name: "해일", short: "물·자연 반반 5회 체크 시 발동", desc: "자신의 상태이상을 1개 정화하는 해일이 발동합니다." },
  steam_blast: { name: "화염 비", short: "화염·물 반반 5회 체크 시 발동", desc: "적의 공격력을 감소시키는 화염 비가 발동합니다." },
  rainbow_symbol: { name: "무지개 심볼", short: "모든 속성에 매치되는 만능 심볼 1개 등장", desc: "모든 속성에 매치되는 무지개 심볼이 등장합니다." },
  rainbow_resonance: { name: "무지개 공명", short: "만능 심볼 포함 체크 데미지 +50%", desc: "무지개 심볼이 포함된 체크의 데미지가 50% 증가합니다." },
  rune_engrave: { name: "룬 각인", short: "매 스핀 랜덤 심볼 1개에 x2 룬", desc: "매 스핀마다 랜덤 심볼 1개에 x2 룬을 부착합니다." },
  rune_spread: { name: "룬 확산", short: "x2 룬 부착 개수 +1", desc: "x2 룬이 부착되는 개수가 1 증가합니다." },
  atk_up_1: { name: "공격력 증가 I", short: "공격력 +5%", desc: "공격력이 5% 증가합니다." },
  atk_up_2: { name: "공격력 증가 II", short: "공격력 +10%", desc: "공격력이 10% 증가합니다." },
  atk_up_3: { name: "공격력 증가 III", short: "공격력 +15%", desc: "공격력이 15% 증가합니다." },
  crit_chance_1: { name: "치명타 확률 I", short: "치명타 확률 +5%", desc: "치명타 확률이 5% 증가합니다." },
  crit_chance_2: { name: "치명타 확률 II", short: "치명타 확률 +10%", desc: "치명타 확률이 10% 증가합니다." },
  crit_chance_3: { name: "치명타 확률 III", short: "치명타 확률 +15%", desc: "치명타 확률이 15% 증가합니다." },
  crit_dmg_1: { name: "치명타 피해 I", short: "치명타 피해 +10%", desc: "치명타 피해가 10% 증가합니다." },
  crit_dmg_2: { name: "치명타 피해 II", short: "치명타 피해 +20%", desc: "치명타 피해가 20% 증가합니다." },
  crit_dmg_3: { name: "치명타 피해 III", short: "치명타 피해 +30%", desc: "치명타 피해가 30% 증가합니다." },
  max_hp_up: { name: "체력 증가 I", short: "최대 HP +10%", desc: "최대 체력이 10% 증가합니다." },
  max_hp_up_2: { name: "체력 증가 II", short: "최대 HP +15%", desc: "최대 체력이 15% 증가합니다." },
  max_hp_up_3: { name: "체력 증가 III", short: "최대 HP +25%", desc: "최대 체력이 25% 증가합니다." },
  damage_amp: { name: "피해증가", short: "데미지 증폭 +10%", desc: "데미지 증폭이 10% 증가합니다." },
  damage_reduce: { name: "피해감소", short: "데미지 절감 +10%", desc: "데미지 절감이 10% 증가합니다." },
  dmg_reduce_1: { name: "피해감소 I", short: "받는 피해 -5%", desc: "받는 피해가 5% 감소합니다." },
  dmg_reduce_2: { name: "피해감소 II", short: "받는 피해 -10%", desc: "받는 피해가 10% 감소합니다." },
  crisis_power: { name: "위기의 힘", short: "HP 30% 이하일 때 공격력 +30%", desc: "HP 30% 이하일 때 공격력이 30% 증가합니다." },
  desperation: { name: "필사의 일격", short: "HP 50% 이하일 때 치명타 확률 +20%", desc: "HP 50% 이하일 때 치명타 확률이 20% 증가합니다." },
  fortitude: { name: "불굴", short: "HP 30% 이하일 때 받는 피해 -30%", desc: "HP 30% 이하일 때 받는 피해가 30% 감소합니다." },
  reversal_will: { name: "역전의 의지", short: "HP 30% 이하 공격/치확/받피 강화", desc: "HP 30% 이하에서 공격력, 치명타 확률, 피해 감소가 함께 증가합니다." },
  healthy_body: { name: "건강한 육체", short: "HP 70% 이상일 때 공격력 +20%", desc: "HP 70% 이상일 때 공격력이 20% 증가합니다." },
  perfect_condition: { name: "만전 상태", short: "HP 100%일 때 치명타 확률 +30%", desc: "HP 100%일 때 치명타 확률이 30% 증가합니다." },
  h_pattern_1: { name: "가로 강화 I", short: "가로 체크 데미지 +20%", desc: "가로 체크 데미지가 20% 증가합니다." },
  v_pattern_1: { name: "세로 강화 I", short: "세로 체크 데미지 +15%", desc: "세로 체크 데미지가 15% 증가합니다." },
  d_pattern_1: { name: "대각 강화 I", short: "대각 체크 데미지 +20%", desc: "대각 체크 데미지가 20% 증가합니다." },
  h_pattern_2: { name: "가로 강화 II", short: "가로 체크 데미지 +30%", desc: "가로 체크 데미지가 30% 증가합니다." },
  v_pattern_2: { name: "세로 강화 II", short: "세로 체크 데미지 +25%", desc: "세로 체크 데미지가 25% 증가합니다." },
  d_pattern_2: { name: "대각 강화 II", short: "대각 체크 데미지 +30%", desc: "대각 체크 데미지가 30% 증가합니다." },
  pattern_triangle: { name: "삼각형", short: "거대 삼각형 패턴 추가", desc: "삼각형 패턴이 추가되고 체크 시 공격력이 증가합니다." },
  pattern_inv_triangle: { name: "역삼각형", short: "거대 역삼각형 패턴 추가", desc: "역삼각형 패턴이 추가되고 체크 시 보호막을 얻습니다." },
  pattern_cross: { name: "십자가", short: "십자가 패턴 추가", desc: "십자가 패턴이 추가되고 체크 시 체력을 회복합니다." },
  combo_accel: { name: "가속", short: "4콤보마다 랜덤 펫 쿨타임 -1", desc: "4콤보마다 랜덤한 펫의 쿨타임이 1 감소합니다." },
  berserker: { name: "광전사", short: "콤보 5 이상 시 2턴간 공격력 증가", desc: "콤보 5 이상 달성 시 2턴간 '광전사' 상태가 됩니다. 공격력 +30%, 받는 피해 +15%가 적용됩니다." },
  guardian_barrier: { name: "수호결계", short: "콤보 5 이상 시 보호막 획득", desc: "콤보 5 이상 달성 시 최대 체력의 10% 보호막을 즉시 획득합니다." },
  dominator: { name: "전장의 지배자", short: "콤보 5 이상 시 상태이상 지속 증가", desc: "콤보 5 이상 달성 시 3턴간 '전장의 지배자' 상태가 되어 적에게 거는 상태이상 지속 턴이 증가합니다." },
  berserker_boost: { name: "광전사 강화", short: "광전사 공격력 증가량 +10%", desc: "광전사 상태의 공격력 증가량이 더 커집니다." },
  guardian_boost: { name: "수호결계강화", short: "수호결계 보호막 20%", desc: "수호결계로 얻는 보호막이 20%가 됩니다." },
  dominator_boost: { name: "전장의 지배자 강화", short: "전장의 지배자 상태이상 지속 +1", desc: "전장의 지배자 상태에서 적에게 거는 상태이상 지속이 더 증가합니다." },
  shield_create: { name: "방패 생성", short: "전투 시작 시 방패 1개", desc: "전투 시작 시 방패 1개를 획득합니다." },
  shield_recharge: { name: "방패 충전", short: "3라운드마다 방패 1개", desc: "매 3라운드 시작 시 방패를 1개 얻습니다." },
  shield_enhance: { name: "방패 강화", short: "방패 피해 감소량 증가", desc: "방패가 줄여주는 피해량이 증가합니다." },
  fire_shield: { name: "화염 방패", short: "방패 소모 시 공격력 증가", desc: "방패가 사라질 때마다 공격력이 증가합니다." },
  light_shield: { name: "번개 방패", short: "방패 소모 시 적에게 어지러움", desc: "방패가 사라질 때마다 적에게 어지러움을 부여합니다." },
  nature_shield: { name: "자연 방패", short: "방패 소모 시 적에게 따가움", desc: "방패가 사라질 때마다 적에게 따가움을 부여합니다." },
  ice_shield: { name: "얼음 방패", short: "방패 소모 시 적에게 저체온", desc: "방패가 사라질 때마다 적에게 저체온을 부여합니다." },
  shield_mass: { name: "방패 대량생산", short: "전투 시작 시 방패 2개", desc: "전투 시작 시 방패를 2개 획득합니다." },
  angel_wing: { name: "천사의 날개", short: "탐험 중 1회 부활", desc: "탐험 중 1회 사망 시 최대 체력의 일부로 부활합니다." },
  immortal: { name: "불사", short: "치명상 시 HP 1로 생존", desc: "치명적인 피해를 받아도 HP 1로 생존합니다." },
  true_immortal: { name: "진짜 불사", short: "불사 발동 시 3턴 무적 보호막", desc: "불사 발동 시 3턴간 무적 보호막을 획득합니다." },
  regen: { name: "재생", short: "매 라운드 시작 시 체력 회복", desc: "매 라운드 시작 시 체력을 회복합니다." },
  strong_regen: { name: "강인한 재생", short: "재생 회복량 증가", desc: "재생 회복량이 증가합니다." },
  crisis_regen: { name: "위기의 재생", short: "저체력일 때 재생량 3배", desc: "HP가 낮을 때 재생 회복량이 크게 증가합니다." },
  wraith_row_check_1: { name: "가로체크부적 I", short: "랜덤 가로줄 1개에 +1 체크부적", desc: "망령 이벤트 보상 스킬입니다." },
  wraith_col_check_1: { name: "세로체크부적 I", short: "랜덤 세로줄 1개에 +1 체크부적", desc: "망령 이벤트 보상 스킬입니다." },
  wraith_row_check_2: { name: "가로체크부적 II", short: "랜덤 가로줄 1개에 +2 체크부적", desc: "망령 이벤트 보상 스킬입니다." },
  wraith_col_check_2: { name: "세로체크부적 II", short: "랜덤 세로줄 1개에 +2 체크부적", desc: "망령 이벤트 보상 스킬입니다." },
  wraith_row_check_3: { name: "가로체크부적 III", short: "랜덤 가로줄 1개에 +3 체크부적", desc: "망령 이벤트 보상 스킬입니다." },
  wraith_col_check_3: { name: "세로체크부적 III", short: "랜덤 세로줄 1개에 +3 체크부적", desc: "망령 이벤트 보상 스킬입니다." }
};

function cleanBrokenText(text, fallback = "") {
  const s = String(text || "").trim();
  if (!s) return fallback;
  if (s.includes("占") || s.includes("??") || s.includes("�")) return fallback;
  return s;
}

function skillName(skill) {
  if (!skill) return "";
  const override = SKILL_TEXT_OVERRIDES[skill.id];
  return t(`skill.${skill.id}.name`, null, override?.name || cleanBrokenText(skill.name, skill.id || ""));
}

function skillDesc(skill) {
  if (!skill) return "";
  const override = SKILL_TEXT_OVERRIDES[skill.id];
  return t(`skill.${skill.id}.desc`, null, override?.desc || cleanBrokenText(skill.desc, ""));
}

function skillShortDesc(skill) {
  if (!skill) return "";
  const override = SKILL_TEXT_OVERRIDES[skill.id];
  return t(`skill.${skill.id}.short`, null, override?.short || cleanBrokenText(skill.shortDesc, ""));
}

function skillGradeBadge(skill, extraClass = "") {
  const grade = typeof skillGrade === "function" ? skillGrade(skill) : "";
  if (!grade) return "";
  const gradeText = String(grade);
  const baseGrade =
    gradeText.startsWith("SSS") ? "SSS" :
    gradeText.startsWith("SS") ? "SS" :
    gradeText.startsWith("S") ? "S" :
    gradeText.startsWith("A") ? "A" :
    gradeText.startsWith("B") ? "B" :
    gradeText.startsWith("C") ? "C" : gradeText;
  const suffix = extraClass ? ` ${extraClass}` : "";
  return `<span class="gradeBadge gradeBadge--${baseGrade}${suffix}">${grade}</span>`;
}

function isMiniSkill(skill) {
  if (!skill) return false;
  const id = String(skill.id || "");
  const name = String(skillName(skill) || "");
  return id.includes("mini") || name.includes("미니") || name.includes("Mini");
}

function skillRoles(skill) {
  if (!skill || !skill.id) return [];
  const id = String(skill.id);
  const roles = new Set();

  // Engine: board shaping, probability manipulation
  if (
    id.includes("_focus") || id.includes("_dominate") ||
    id.includes("_convert") || id.includes("_erode") ||
    id.startsWith("dual_convert_") ||
    id.startsWith("half_") || id === "rainbow_symbol" ||
    id.includes("_talisman") || id === "rune_engrave"
  ) {
    roles.add("engine");
  }

  // Payoff: damage scaling, burst, synergy
  if (
    id.includes("_boost") || id.includes("_enhance") ||
    id.includes("pattern_") || id.includes("atk_up") ||
    id.includes("crit_") || id.includes("_pattern_") ||
    id === "element_monopoly" || id === "mono_awakening" ||
    id === "berserker" || id === "dominator" ||
    id === "inferno" || id === "critical_wound" ||
    id === "rainbow_resonance" || id === "combo_master" ||
    id === "special_symbol_boost" || id === "dual_convert_master" ||
    id.startsWith("auto_") ||
    // ?쒕꼫吏 湲곕낯
    id === "plasma" || id === "lightning_gale" || id === "electrocute" ||
    id === "purifying_flame" || id === "tidal" || id === "steam_blast"
  ) {
    roles.add("payoff");
  }

  // Defense: survival, shields, heals, CC
  if (
    id.includes("shield") || id.includes("regen") ||
    id.includes("immortal") || id === "angel_wing" ||
    id.includes("_heal_") || id === "max_hp_up" ||
    id.includes("dmg_reduce") || id === "fortitude" ||
    id === "guardian_barrier" || id === "crisis_regen" ||
    id === "ice_boost" || id === "permafrost" || id === "ice_age" ||
    id === "desperation" || id === "reversal_will"
  ) {
    roles.add("defense");
  }

  if (!roles.size) roles.add("payoff");
  return [...roles];
}

function skillRoleLabels(skill) {
  const roles = skillRoles(skill);
  const out = [];
  for (const r of roles) {
    if (r === "engine") out.push(t("ui.roleEngine"));
    else if (r === "payoff") out.push(t("ui.rolePayoff"));
    else if (r === "defense") out.push(t("ui.roleDefense"));
  }
  return out;
}

function skillAxis(skill) {
  const id = String((skill && skill.id) || "");
  if (!id) return "general";

  // ?⑦꽩
  if (id.startsWith("pattern_") || id.includes("_pattern_")) return "pattern";

  // 遺???щ’ 議곗옉
  if (id.includes("_talisman") || id === "rune_engrave" || id === "rune_spread") return "talisman";

  // 蹂???뺣쪧 (?붿쭊)
  if (
    id.includes("_convert") || id.includes("_erode") ||
    id.startsWith("dual_convert_") ||
    id.includes("_focus") || id.includes("_dominate") ||
    id.startsWith("half_") || id === "rainbow_symbol" || id === "rainbow_resonance"
  ) return "engine";

  // ?곹깭?댁긽 / ?뱀닔?щ낵
  if (
    id === "ember" || id === "thunderbolt" || id === "thorn" || id === "ice_shard" ||
    id.includes("_boost") || id.includes("_enhance") ||
    id.startsWith("auto_") ||
    id === "inferno" || id === "critical_wound" || id === "daze" || id === "permafrost" ||
    id === "shield_melt" || id === "faint" || id === "hemorrhage" || id === "ice_age" ||
    id.includes("_symbol")
  ) return "status";

  // ?쒕꼫吏
  if (
    id === "plasma" || id === "lightning_gale" || id === "electrocute" ||
    id === "purifying_flame" || id === "tidal" || id === "steam_blast" ||
    id.endsWith("_enhance") && (id.includes("plasma") || id.includes("gale") || id.includes("electrocute") || id.includes("purifying") || id.includes("tidal") || id.includes("steam"))
  ) return "synergy";

  return "general";
}

function skillAxisLabel(axis) {
  if (axis === "status") return t("ui.axisStatus");
  if (axis === "talisman") return t("ui.axisTalismans");
  if (axis === "pattern") return t("ui.axisPattern");
  return t("ui.axisGeneral");
}

function dirLabel(dir) {
  return t(`dir.${dir}`, null, dir);
}

function symbolNameById(symbolId) {
  const custom = tMaybe(`symbol.${symbolId}`);
  if (custom) return custom;
  const sym = SYMBOL_BY_ID[symbolId];
  if (sym && sym.name) return sym.name;
  const h = HYBRID_BY_ID[symbolId];
  if (h) return `${toLabel(h.a)}+${toLabel(h.b)}`;
  const base = elementOfSymbolId(symbolId);
  if (base !== symbolId) return toLabel(base);
  return toLabel(symbolId);
}

function applyLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  document.title = t("title.app");
  const nodes = document.querySelectorAll("[data-i18n]");
  for (const el of nodes) {
    if (!el.dataset || !el.dataset.i18n) continue;
    el.textContent = t(el.dataset.i18n);
  }
  const ariaNodes = document.querySelectorAll("[data-i18n-aria]");
  for (const el of ariaNodes) {
    if (!el.dataset || !el.dataset.i18nAria) continue;
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  }
  if (ui.startTitle) ui.startTitle.textContent = t("start.title");
  if (ui.startSubtitle) ui.startSubtitle.textContent = t("start.subtitle");
  if (ui.startGameBtn) ui.startGameBtn.textContent = t("start.button");
  if (ui.langButtons) {
    const btns = ui.langButtons.querySelectorAll(".langBtn");
    for (const b of btns) {
      b.classList.toggle("langBtn--active", b.dataset.lang === lang);
    }
  }
  if (state.started) renderAll(true);
  if (!state.started && typeof renderMainMenu === "function") renderMainMenu();
  if (isHelpOpen()) openHelp();
  if (isCodexOpen()) openCodex();
}

function showStartScreen() {
  if (!ui.startScreen) return;
  ui.startScreen.style.display = "grid";
  applyLanguage(state.lang);
  renderMainMenu();
}

function hideStartScreen() {
  if (!ui.startScreen) return;
  ui.startScreen.style.display = "none";
}

function clampSelectedChapter() {
  META.unlockedChapter = Math.max(1, META.unlockedChapter || 1);
  META.selectedChapter = Math.max(1, Math.min(META.unlockedChapter, META.selectedChapter || 1));
}

function renderMainMenu() {
  clampSelectedChapter();
  if (ui.accountLevelText) ui.accountLevelText.textContent = String(META.accountLevel);
  if (ui.goldText) ui.goldText.textContent = String(META.gold);
  if (ui.chapterSelectText) ui.chapterSelectText.textContent = String(META.selectedChapter);

  {
    const themeId = chapterThemeId(META.selectedChapter);
    if (ui.chapterThemeText) ui.chapterThemeText.textContent = t(`theme.${themeId}`);

    const traitId = chapterTraitPassiveId(META.selectedChapter);
    const name = t(`passive.${traitId}.name`, null, "-");
    const desc = t(`passive.${traitId}.desc`, null, "-");
    const counter = tMaybe(`passive.${traitId}.counter`);
    if (ui.chapterTraitName) ui.chapterTraitName.textContent = String(name);
    if (ui.chapterTraitDesc) ui.chapterTraitDesc.textContent = String(desc);
    if (ui.chapterTraitCounter) ui.chapterTraitCounter.textContent = counter ? String(counter) : "";

    if (ui.bossPassivesList) {
      ui.bossPassivesList.innerHTML = "";
      const ids = finalBossPassiveIdsForChapter(META.selectedChapter);
      for (const id of ids) {
        const el = document.createElement("div");
        el.className = "bossPassiveItem";
        const n = t(`passive.${id}.name`, null, id);
        const d = t(`passive.${id}.desc`, null, "");
        el.innerHTML = `<div class="bossPassiveItem__name">${escapeHtml(n)}</div><div class="bossPassiveItem__desc">${escapeHtml(
          d
        )}</div>`;
        ui.bossPassivesList.appendChild(el);
      }
    }
  }

  const next = META.accountLevel + 1;
  const cost = metaLevelCost(next);
  const b = metaBonuses(next);
  if (ui.levelUpHint) {
    ui.levelUpHint.textContent = t("ui.levelUpHint", { cost, hp: b.maxHp, atk: b.baseDamage });
  }
  if (ui.levelUpBtn) ui.levelUpBtn.disabled = META.gold < cost;
  if (ui.growthLevelText) ui.growthLevelText.textContent = String(META.accountLevel);
  if (ui.growthLevelHint) {
    ui.growthLevelHint.textContent = t("ui.levelUpHint", { cost, hp: b.maxHp, atk: b.baseDamage });
  }
  if (ui.chapterPrevBtn) ui.chapterPrevBtn.disabled = META.selectedChapter <= 1;
  if (ui.chapterNextBtn) ui.chapterNextBtn.disabled = META.selectedChapter >= META.unlockedChapter;
  renderPetMenu();
  renderDecoMenu();
  if (typeof renderEquipMenu === "function") renderEquipMenu();
}

function tryMetaLevelUp() {
  const next = META.accountLevel + 1;
  const cost = metaLevelCost(next);
  if (META.gold < cost) return false;
  META.gold -= cost;
  META.accountLevel = next;
  saveMeta(META);
  return true;
}

function petEnhancement(petId) {
  if (!META.pet || !META.pet.enhancement) return 0;
  return Math.max(0, Math.floor(META.pet.enhancement[petId] || 0));
}

function petCopies(petId) {
  if (!META.pet || !META.pet.inventory) return 0;
  return Math.max(0, Math.floor(META.pet.inventory[petId] || 0));
}

function isPetOwned(petId) {
  return petCopies(petId) >= 1;
}

function petUnlockedPassiveCount(petId) {
  const pet = PET_BY_ID[petId];
  if (!pet || !isPetOwned(petId)) return 0;
  return Math.min(
    (PET_PASSIVES_AT_0[pet.grade] || 0) + petEnhancement(petId),
    4
  );
}

// Backward compat alias
function petLevel(petId) { return isPetOwned(petId) ? petEnhancement(petId) + 1 : 0; }
function isPetPassiveActive(petId) { return petUnlockedPassiveCount(petId) > 0; }

// ?? ???쇱떆 鍮꾪솢?깊솕 (?ㅽ궗 ?쒖뒪??v2 ?묒뾽 以? ??
// ?꾪닾 ?먯튃: "?ㅽ? ?놁씠 ?붿긽/誘몃땲踰덇컻 遺덇?" ?????꾨㈃ ?ъ꽕怨??꾧퉴吏 OFF
const PET_DISABLED = true;

function equippedPetIds() {
  if (PET_DISABLED) return [];
  if (!META.pet) return [];
  const src = Array.isArray(META.pet.equippedPetIds) ? META.pet.equippedPetIds : [];
  const out = [];
  for (const id of src) {
    if (!PET_BY_ID[id]) continue;
    if (!isPetOwned(id)) continue;
    if (out.includes(id)) continue;
    out.push(id);
    if (out.length >= 2) break;
  }
  META.pet.equippedPetIds = out;
  return out;
}

function equippedPetDefs() {
  return equippedPetIds().map((id) => PET_BY_ID[id]).filter(Boolean);
}

function equippedPetDef(slot = 0) {
  const arr = equippedPetDefs();
  return arr[slot] || null;
}

function equippedPetLevel(slot = 0) {
  const pet = equippedPetDef(slot);
  return pet ? petEnhancement(pet.id) : 0;
}

function equippedPetPassiveIds() {
  const out = [];
  for (const pet of equippedPetDefs()) {
    if (isPetPassiveActive(pet.id)) out.push(pet.id);
  }
  return out;
}

function hasEquippedPetPassive(petId) {
  return equippedPetPassiveIds().includes(petId);
}

function petActiveCooldownTurns(pet, _level) {
  if (!pet) return 0;
  return Math.max(1, Math.floor(pet.cooldown || 8));
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   DECORATION HELPERS (異붿뼲?μ떇 ?ы띁 ??議곌컖 ?쒖뒪??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function decoFragments(decoId) {
  if (!META.deco || !META.deco.fragments) return 0;
  return Math.max(0, Math.floor(META.deco.fragments[decoId] || 0));
}

function decoLevel(decoId) {
  if (!META.deco || !META.deco.levels) return 0;
  return Math.max(0, Math.floor(META.deco.levels[decoId] || 0));
}

function isDecoOwned(decoId) {
  return decoLevel(decoId) >= 1;
}

function decoLevelData(decoId) {
  const lv = decoLevel(decoId);
  if (lv < 1) return null;
  const deco = DECO_BY_ID[decoId];
  if (!deco || !deco.levels) return null;
  return deco.levels[lv - 1] || null;
}

function decoNextCost(decoId) {
  const lv = decoLevel(decoId);
  if (lv >= DECO_FRAGMENT_COST.length) return null;
  return DECO_FRAGMENT_COST[lv];
}

function grantDecoFragment(decoId, count) {
  const deco = DECO_BY_ID[decoId];
  if (!deco || !META.deco) return { fragmentCount: 0, isNew: false };
  if (!META.deco.fragments) META.deco.fragments = {};
  const wasZero = (META.deco.fragments[decoId] || 0) === 0;
  const amount = (typeof count === "number" && count > 0) ? count : 1;
  META.deco.fragments[decoId] = (META.deco.fragments[decoId] || 0) + amount;
  return { fragmentCount: META.deco.fragments[decoId], isNew: wasZero };
}

function assembleDecoration(decoId) {
  const deco = DECO_BY_ID[decoId];
  if (!deco) return { ok: false, reason: t("dl.decoNotExist") };
  if (isDecoOwned(decoId)) return { ok: false, reason: t("dl.decoAlreadyOwned") };
  const cost = DECO_FRAGMENT_COST[0];
  const frags = decoFragments(decoId);
  if (frags < cost) return { ok: false, reason: t("dl.fragShort", { cur: frags, cost }) };
  if (!META.deco.fragments) META.deco.fragments = {};
  if (!META.deco.levels) META.deco.levels = {};
  META.deco.fragments[decoId] -= cost;
  META.deco.levels[decoId] = 1;
  saveMeta(META);
  return { ok: true };
}

function enhanceDecoration(decoId) {
  const deco = DECO_BY_ID[decoId];
  if (!deco) return { ok: false, reason: t("dl.decoNotExist") };
  const lv = decoLevel(decoId);
  if (lv < 1) return { ok: false, reason: t("dl.decoNotOwned2") };
  if (lv >= DECO_FRAGMENT_COST.length) return { ok: false, reason: t("dl.decoMaxLevel") };
  const cost = DECO_FRAGMENT_COST[lv];
  const frags = decoFragments(decoId);
  if (frags < cost) return { ok: false, reason: t("dl.fragShort", { cur: frags, cost }) };
  META.deco.fragments[decoId] -= cost;
  META.deco.levels[decoId] = lv + 1;
  saveMeta(META);
  return { ok: true, newLevel: lv + 1 };
}

function equippedDecoIds() {
  if (!META.deco) return [null, null, null, null];
  const src = Array.isArray(META.deco.equippedDecoIds) ? META.deco.equippedDecoIds : [];
  const out = [null, null, null, null];
  const used = new Set();
  for (let i = 0; i < DECO_MAX_SLOTS; i++) {
    const id = src[i];
    if (!id || typeof id !== "string") continue;
    if (!DECO_BY_ID[id]) continue;
    if (!isDecoOwned(id)) continue;
    if (used.has(id)) continue;
    out[i] = id;
    used.add(id);
  }
  META.deco.equippedDecoIds = out;
  return out;
}

/** ?μ갑???μ떇 ID留?(null ?쒖쇅) ???꾪닾 ?쒖꽌?濡?*/
function equippedDecoIdsPacked() {
  return equippedDecoIds().filter(Boolean);
}

function equippedDecoDefs() {
  return equippedDecoIdsPacked().map((id) => DECO_BY_ID[id]).filter(Boolean);
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   DECORATION GACHA (異붿뼲?μ떇 戮묎린 ??議곌컖 ?띾뱷)
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function pickDecoGrade() {
  const total = DECO_GRADE_RATES.reduce((a, b) => a + b.w, 0);
  return weightedPick(DECO_GRADE_RATES, total).grade;
}

function decoDrawOnce() {
  if (META.gold < DECO_GACHA_COST) return null;
  META.gold -= DECO_GACHA_COST;
  const grade = pickDecoGrade();
  const pool = DECO_IDS_BY_GRADE[grade] || [];
  const decoId = pool.length ? pickOne(pool) : DECORATIONS[0].id;
  const amount = DECO_FRAGMENTS_PER_DRAW;
  const result = grantDecoFragment(decoId, amount);
  saveMeta(META);
  return {
    grade,
    deco: DECO_BY_ID[decoId],
    fragmentCount: amount,
    totalFragments: result.fragmentCount,
    isNew: result.isNew,
  };
}

function decoDrawMany(count) {
  const n = Math.max(1, Math.floor(count || 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    const one = decoDrawOnce();
    if (!one) break;
    out.push(one);
  }
  return out;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 異붿뼲?μ떇 ???꾪닾 諛곗쑉 ?쒖뒪??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function initDecoBattleState() {
  const bs = {};
  const ids = equippedDecoIdsPacked();
  for (const id of ids) {
    const deco = DECO_BY_ID[id];
    if (!deco) continue;
    const ld = decoLevelData(id);
    if (!ld) continue;
    const ct = ld.conditionType;
    const p = ld.conditionParams || {};
    const entry = { triggered: false, destroyed: false };

    // Legacy conditionTypes
    if (ct === "evolve") {
      entry.evolved = false;
      entry.charge = 0;
    }
    if (ct === "accumPerRound") {
      entry.accumBonus = 0;
    }
    if (ct === "ceilingGamble") {
      entry.ceilingChance = p.baseChance || 0.2;
      entry.ceilingUsed = false;
    }
    if (ct === "decayPerRound") {
      entry.currentValue = p.start || 2.0;
      entry.hitMin = false;
      entry.reboundUsed = false;
      entry.recovering = false;
    }
    if (ct === "fragile") {
      entry.survivalCount = 0;
      entry.immune = false;
    }
    if (ct === "gamble5050") {
      entry.consecutiveLosses = 0;
    }

    // New conditionTypes
    if (ct === "accumCombo") {
      entry.totalCombo = 0;
      entry.stacks = 0;
    }
    if (ct === "onHitAccum") {
      entry.accumBonus = 0;
    }
    if (ct === "randomElement") {
      entry.designatedElement = pickOne(["fire", "light", "nature", "water"]);
      entry.totalDesignatedChecks = 0;
    }
    if (ct === "chargeRelease") {
      entry.charge = 0;
      entry.roundCount = 0;
      entry.released = false;
    }

    bs[id] = entry;
  }
  return bs;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   PER-CHECK DECORATION EVALUATION
//   泥댄겕 ?닿껐 以?媛쒕퀎 泥댄겕留덈떎 ?됯??섎뒗 ?μ떇 ?쒖뒪??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

/**
 * Evaluate per-check decorations for a single match/check.
 * Called during the per-check loop in spin.js for each individual match.
 *
 * @param {object} match - The current match object { symbolId, dir, len, cells }
 * @param {object} partDmg - Damage info for this match { dmg, byElement }
 * @param {object} pcState - Persistent state across all checks this spin
 *   { triggerCounts: {decoId: number}, totalChainMult: number }
 * @returns {{ checkDmgMult: number, chainMult: number, triggers: Array }}
 *   checkDmgMult: multiplier to apply to this specific check's damage
 *   chainMult: multiplier to apply to the total accumulated damage
 *   triggers: array of { decoId, slotIdx, name, value, type }
 */
function evaluatePerCheckDecorations(match, partDmg, pcState) {
  const fullSlots = equippedDecoIds(); // [null|id, null|id, null|id, null|id]
  const triggers = [];
  let checkDmgMult = 1.0;
  let chainMult = 1.0;

  // Initialize pcState if needed
  if (!pcState.triggerCounts) pcState.triggerCounts = {};
  if (!pcState.totalChainMult) pcState.totalChainMult = 1.0;

  for (let slotIdx = 0; slotIdx < fullSlots.length; slotIdx++) {
    const id = fullSlots[slotIdx];
    if (!id) continue;
    const deco = DECO_BY_ID[id];
    if (!deco) continue;
    const ld = decoLevelData(id);
    if (!ld) continue;
    // timing? ?덈꺼 ?곗씠?곗뿉 ?덉쓬 (deco 理쒖긽?꾧? ?꾨떂)
    if (ld.timing !== "perCheck") continue;

    switch (ld.conditionType) {

      // ?? v34: perCheckDirChance: 諛⑺뼢(+?띿꽦) 泥댄겕 ???뺣쪧??怨깅같????
      // A-01(媛濡?, A-02(?몃줈), A-05(?媛?, S-01~S-04(?띿꽦+諛⑺뼢)
      case "perCheckDirChance": {
        const p2 = ld.conditionParams || {};
        // ?띿꽦 泥댄겕 (S?깃툒: ?뱀젙 ?띿꽦 ?꾩닔)
        if (p2.element && match.symbolId !== p2.element) break;
        // 諛⑺뼢 泥댄겕
        if (p2.direction === "D") {
          // ?媛곸꽑: H/V ?꾨땶 紐⑤뱺 寃?
          if (match.dir === "H" || match.dir === "V") break;
        } else {
          if (match.dir !== p2.direction) break;
        }
        // ?뺣쪧 ?먯젙
        const dirChance = p2.chance || 0.3;
        const roll = Math.random();
        if (roll < dirChance) {
          checkDmgMult *= ld.baseValue;
          const displayName = decoNameI18n(deco);
          triggers.push({
            decoId: id, slotIdx, name: displayName, value: ld.baseValue,
            type: "checkMult", icon: deco.icon,
          });
          pcState.triggerCounts[id] = (pcState.triggerCounts[id] || 0) + 1;
        }
        break;
      }

      // ?? v34: perCheckSpecial: ?뱀닔?щ낵 ?ы븿 泥댄겕 ???꾩껜 怨깅같????
      // SSS-04 (蹂꾩쓽 ?뚰렪)
      case "perCheckSpecial": {
        const SPECIAL_VARIANT_IDS = [
          "fire_ember", "fire_power", "light_bolt", "light_thunder_sym",
          "nature_thorn_v", "nature_heal", "water_ice", "water_protect",
          // v1 ?명솚
          "fire_burn", "fire_flame", "light_chain", "light_thunder",
          "light_strike", "light_shockwave", "water_slip", "water_freeze",
          "water_ice_armor", "nature_gale",
        ];
        let hasSpecial = false;
        for (const [r, c] of match.cells) {
          const cellId = state.grid[r][c];
          if (SPECIAL_VARIANT_IDS.includes(cellId)) { hasSpecial = true; break; }
        }
        if (hasSpecial) {
          checkDmgMult *= ld.baseValue;
          const displayName = decoNameI18n(deco);
          triggers.push({
            decoId: id, slotIdx, name: displayName, value: ld.baseValue,
            type: "checkMult", icon: deco.icon,
          });
          pcState.triggerCounts[id] = (pcState.triggerCounts[id] || 0) + 1;
        }
        break;
      }

      // ?? perCheckElementDir: ?뱀젙 ?띿꽦+諛⑺뼢 泥댄겕 ???뺣쪧??諛곗쑉 (?덇굅?? ??
      case "perCheckElementDir": {
        const p = ld.conditionParams || {};
        // Element must match
        if (match.symbolId !== p.element) break;
        // Direction must match (p.direction can be "V", "H", "VH", "D", etc.)
        if (!p.direction.includes(match.dir)) break;

        // Check for Lv5 direction-specific overrides (bonuses)
        let chance = p.chance;
        let mult = p.mult;
        if (ld.bonuses) {
          for (const bonus of ld.bonuses) {
            if (bonus.type === "dirGuarantee" && bonus.params.direction === match.dir) {
              chance = bonus.params.chance;
              mult = bonus.params.mult;
            }
          }
        }

        // Roll the dice
        if (Math.random() < chance) {
          checkDmgMult *= mult;
          const displayName = decoNameI18n(deco);
          triggers.push({
            decoId: id, slotIdx, name: displayName, value: mult,
            type: "checkMult", icon: deco.icon,
          });
          pcState.triggerCounts[id] = (pcState.triggerCounts[id] || 0) + 1;
        }
        break;
      }

      // ?? perCheckLeftChain: 醫뚯륫(?먮뒗 ?ㅻⅨ) ?μ떇 泥댄겕 以?諛쒕룞???곗뇙 ??
      case "perCheckLeftChain": {
        const p = ld.conditionParams || {};
        let leftTriggered = false;

        // Check if any per-check decoration triggered in THIS check (triggers array)
        for (const trig of triggers) {
          if (trig.decoId === id) continue; // Skip self by default
          if (p.includeAll) {
            // Lv3+: react to any other per-check decoration
            leftTriggered = true;
            break;
          }
          // Default: only react to decorations in slots to the left
          if (trig.slotIdx < slotIdx) {
            leftTriggered = true;
            break;
          }
        }

        // Lv5 includeSelf: also trigger if self already triggered (capped at 1 per check)
        if (!leftTriggered && p.includeSelf && triggers.length > 0) {
          leftTriggered = true;
        }

        if (leftTriggered) {
          chainMult *= p.mult;
          pcState.totalChainMult *= p.mult;
          const displayName = decoNameI18n(deco);
          triggers.push({
            decoId: id, slotIdx, name: displayName, value: p.mult,
            type: "chainMult", icon: deco.icon,
          });
          pcState.triggerCounts[id] = (pcState.triggerCounts[id] || 0) + 1;
        }
        break;
      }
    }
  }

  return { checkDmgMult, chainMult, triggers };
}

function buildDecoSpinContext(matchesAll, jackpot) {
  const comboCount = matchesAll.length;
  const elemChecks = { fire: 0, light: 0, nature: 0, water: 0 };
  let hCount = 0, vCount = 0;
  const checkedCells = new Set();

  let dCount = 0;
  for (const m of matchesAll) {
    if (elemChecks[m.symbolId] !== undefined) elemChecks[m.symbolId]++;
    if (m.dir === "H") hCount++;
    else if (m.dir === "V") vCount++;
    else dCount++; // diagonal or other
    for (const [r, c] of m.cells) checkedCells.add(`${r},${c}`);
  }

  const uncheckedCount = ROWS * COLS - checkedCells.size;
  const typesChecked = Object.values(elemChecks).filter(v => v > 0).length;
  const maxSameElement = Math.max(0, ...Object.values(elemChecks));

  // Count horizontal full lines (all 5 cells in a row are checked)
  let horizontalFullCount = 0;
  for (let r = 0; r < ROWS; r++) {
    let allChecked = true;
    for (let c = 0; c < COLS; c++) {
      if (!checkedCells.has(`${r},${c}`)) { allChecked = false; break; }
    }
    if (allChecked) horizontalFullCount++;
  }

  // Count vertical full lines (all 3 cells in a column are checked)
  let verticalFullCount = 0;
  for (let c = 0; c < COLS; c++) {
    let allChecked = true;
    for (let r = 0; r < ROWS; r++) {
      if (!checkedCells.has(`${r},${c}`)) { allChecked = false; break; }
    }
    if (allChecked) verticalFullCount++;
  }

  const enemy = state.enemy || {};
  const es = enemy.status || {};

  // v34: ?곹깭?댁긽 醫낅쪟 ??(perStatusTypes ??
  let statusTypeCount = 0;
  if ((es.burnTurns || 0) > 0 && (es.burnStacks || 0) > 0) statusTypeCount++;
  if ((es.bleedTurns || 0) > 0 && (es.bleedStacks || 0) > 0) statusTypeCount++;
  if ((es.stunnedTurns || 0) > 0) statusTypeCount++;
  if ((es.frozenTurns || 0) > 0) statusTypeCount++;
  if ((es.thornInstances && es.thornInstances.length > 0) || (es.thornStacks || 0) > 0) statusTypeCount++;
  if ((es.dizzyTurns || 0) > 0) statusTypeCount++;
  if ((es.hypothermiaTurns || 0) > 0 || (es.hypothermiaStacks || 0) > 0) statusTypeCount++;

  // v34: ?곌?? ?ㅽ깮 ??(perStatusStack ??
  const thornStackCount = es.thornInstances ? es.thornInstances.length : (es.thornStacks || 0);

  // v34: 吏곸쟾 ?쇱슫???쇨꺽 ?잛닔 (perHitLastRound ??
  const hitsTakenLastRound = state.playerHitCountLastRound || 0;

  return {
    comboCount,
    elemChecks,
    hCount,
    vCount,
    dCount,
    uncheckedCount,
    elementTypesChecked: typesChecked,
    maxSameElement,
    horizontalFullCount,
    verticalFullCount,
    jackpot: !!jackpot,
    round: state.turn || 1,
    playerHpPct: state.player.maxHp > 0 ? state.player.hp / state.player.maxHp : 1,
    enemyHpPct: enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1,
    playerWasHit: !!(state.playerHitThisRound),
    enemyBurn: (es.burnTurns || 0) > 0 && (es.burnStacks || 0) > 0,
    enemyBleed: (es.bleedTurns || 0) > 0 && (es.bleedStacks || 0) > 0,
    enemyStun: (es.stunnedTurns || 0) > 0,
    enemyFreeze: (es.frozenTurns || 0) > 0,
    statusTypeCount,
    thornStackCount,
    hitsTakenLastRound,
  };
}

/**
 * Evaluate a single decoration's condition using levelData.
 * Returns { triggered, value, label, bonusLabels: [] }
 *   value: for "add" -> amount to add; for "mult" -> multiplier
 *   If not triggered: add->0, mult->1 (identity)
 */
function evaluateDecoration(deco, levelData, bs, ctx, priorTriggered) {
  const ld = levelData;
  if (!ld) return { triggered: false, value: 1, label: "", bonusLabels: [] };

  const p = ld.conditionParams || {};
  const identity = ld.multType === "add" ? 0 : 1;
  const fail = { triggered: false, value: identity, label: "", bonusLabels: [] };

  if (bs && bs.destroyed) return fail;

  let result;

  switch (ld.conditionType) {

    // ??? Existing conditionTypes ???

    case "comboMax": {
      if (ctx.comboCount <= p.maxCombo) {
        result = { triggered: true, value: ld.baseValue, label: "콤보 " + ctx.comboCount + " / " + p.maxCombo, bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "sameElementMin": {
      if (ctx.maxSameElement >= p.minChecks) {
        result = { triggered: true, value: ld.baseValue, label: "연속 " + ctx.maxSameElement, bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perUnchecked": {
      const bonus = ctx.uncheckedCount * (p.perUnit || 0.03);
      if (bonus > 0) {
        // v34: multType "mult"??寃쎌슦 1+bonus 諛섑솚 (怨깅같??, "add"??寃쎌슦 bonus 洹몃?濡?
        const value = ld.multType === "mult" ? 1 + bonus : bonus;
        result = { triggered: true, value, label: "미체크 " + ctx.uncheckedCount + "개", bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perOtherTriggered": {
      const count = p.includeSelf ? priorTriggered + 1 : priorTriggered;
      const bonus = count * (p.perUnit || 0.15);
      if (bonus > 0) {
        result = { triggered: true, value: bonus, label: p.includeSelf ? t("dl.allTrigger", { count }) : t("dl.otherTrigger", { count }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "enemyDoT": {
      const burn = ctx.enemyBurn;
      const bleed = ctx.enemyBleed;
      if (burn && bleed) {
        result = { triggered: true, value: p.both || 0.4, label: t("dl.burnBleed"), bonusLabels: [] };
      } else if (burn || bleed) {
        result = { triggered: true, value: p.single || 0.2, label: burn ? t("dl.burn") : t("dl.bleed"), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "enemyDoTCount": {
      let dotCount = 0;
      if (ctx.enemyBurn) dotCount++;
      if (ctx.enemyBleed) dotCount++;
      // count stacks if available
      const es = (state.enemy || {}).status || {};
      if (es.burnStacks) dotCount += (es.burnStacks - 1);
      if (es.bleedStacks) dotCount += (es.bleedStacks - 1);
      dotCount = Math.min(dotCount, p.maxDoT || 99);
      if (dotCount > 0) {
        const val = dotCount * (p.perDoT || 0.15);
        result = { triggered: true, value: val, label: "DoT " + dotCount + "개", bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "enemyCC": {
      const stun = ctx.enemyStun;
      const freeze = ctx.enemyFreeze;
      if (stun && freeze) {
        // Lv5 special: bothMultType/bothValue override
        if (p.bothMultType === "mult" && p.bothValue) {
          result = { triggered: true, value: p.bothValue, label: t("dl.stunFreezeX", { val: p.bothValue }), bonusLabels: [], multTypeOverride: "mult" };
        } else {
          result = { triggered: true, value: p.both || 0.8, label: t("dl.stunFreeze"), bonusLabels: [] };
        }
      } else if (stun || freeze) {
        result = { triggered: true, value: p.single || 0.5, label: stun ? t("dl.stun") : t("dl.freeze"), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perElementType": {
      const n = ctx.elementTypesChecked;
      const minTypes = p.minTypes || 1;
      if (n >= minTypes) {
        const mult = Math.pow(p.perUnit || 1.15, n);
        result = { triggered: true, value: mult, label: t("dl.elemN", { n }), bonusLabels: [] };
      } else if (n === 1 && p.singleFloor && p.singleFloor > 1) {
        result = { triggered: true, value: p.singleFloor, label: t("dl.elem1Safe"), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "comboMin": {
      if (ctx.comboCount >= p.minCombo) {
        result = { triggered: true, value: ld.baseValue, label: t("dl.comboGte", { cur: ctx.comboCount, min: p.minCombo }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "horizontalMin": {
      if (ctx.hCount >= (p.minLines || 2)) {
        result = { triggered: true, value: ld.baseValue, label: t("dl.hRowN", { n: ctx.hCount }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "gamble5050": {
      let won;
      if (p.ceiling && bs && bs.consecutiveLosses >= p.ceiling) {
        won = true;
        bs.consecutiveLosses = 0;
      } else {
        won = Math.random() < 0.5;
      }
      if (won) {
        if (bs) bs.consecutiveLosses = 0;
        result = { triggered: true, value: p.win || 2.0, label: t("dl.gambleWin"), bonusLabels: [] };
      } else {
        if (bs) bs.consecutiveLosses = (bs.consecutiveLosses || 0) + 1;
        result = { triggered: true, value: p.lose || 0.5, label: t("dl.gambleLose"), bonusLabels: [] };
      }
      break;
    }

    case "fragile": {
      if (bs && bs.destroyed) return fail;
      const val = p.value || ld.baseValue || 1.5;
      // Survival immunity check (Lv5)
      if (bs && bs.immune) {
        result = { triggered: true, value: val, label: t("dl.fragileImmune"), bonusLabels: [] };
        break;
      }
      const breaks = Math.random() < (p.breakChance || 0.2);
      if (breaks && bs) {
        bs.destroyed = true;
        bs.survivalCount = 0;
      } else if (bs) {
        bs.survivalCount = (bs.survivalCount || 0) + 1;
        if (p.survivalImmunity && bs.survivalCount >= p.survivalImmunity) {
          bs.immune = true;
        }
      }
      result = { triggered: true, value: val, label: breaks ? t("dl.fragileBreak") : t("dl.fragileSurvive", { count: bs ? bs.survivalCount : 0 }), bonusLabels: [] };
      break;
    }

    case "decayPerRound": {
      if (bs) {
        let val = bs.currentValue || p.start || 2.0;
        val = Math.max(p.min || 1.0, val);
        // Rebound mechanic (Lv3+): when hitting min, bounce once
        if (p.rebound && val <= (p.min || 1.0) && !bs.reboundUsed) {
          val = p.rebound;
          bs.reboundUsed = true;
        }
        // Recovery mechanic (Lv5): after hitting min, recover each round
        if (p.recovery && bs.recovering) {
          val = Math.min(p.recoveryMax || 1.5, val);
        }
        if (val > 1.0) {
          result = { triggered: true, value: val, label: "x" + val.toFixed(1), bonusLabels: [] };
        } else {
          return fail;
        }
      } else {
        return fail;
      }
      break;
    }

    case "playerHpBelow": {
      if (ctx.playerHpPct <= (p.threshold || 0.5)) {
        result = { triggered: true, value: ld.baseValue, label: t("dl.playerHp", { pct: Math.floor(ctx.playerHpPct * 100) }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "accumPerRound": {
      if (bs && bs.accumBonus > 0) {
        result = { triggered: true, value: bs.accumBonus, label: t("dl.accumPlus", { val: bs.accumBonus.toFixed(2) }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "hpCost": {
      let costPct = p.costPct || 0.10;
      // Lv5 low-HP cost reduction
      if (p.lowHpCostReduction && ctx.playerHpPct <= p.lowHpCostReduction.threshold) {
        costPct = p.lowHpCostReduction.reducedCost || costPct;
      }
      const cost = Math.max(1, Math.floor(state.player.maxHp * costPct));
      if (state.player.hp > cost) {
        state.player.hp -= cost;
        result = { triggered: true, value: ld.baseValue, label: t("dl.hpCost", { cost }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "ceilingGamble": {
      if (bs && bs.ceilingUsed) return fail;
      const chance = bs ? bs.ceilingChance : (p.baseChance || 0.2);
      if (Math.random() < chance) {
        if (bs) bs.ceilingUsed = true;
        result = { triggered: true, value: p.value || 5.0, label: t("dl.jackpotPct", { pct: Math.floor(chance * 100) }), bonusLabels: [] };
      } else {
        if (bs) bs.ceilingChance = Math.min(1.0, (bs.ceilingChance || 0.2) + (p.increment || 0.1));
        return fail;
      }
      break;
    }

    case "jackpot": {
      if (ctx.jackpot) {
        result = { triggered: true, value: ld.baseValue, label: t("dl.jackpot"), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "enemyHpBelow": {
      if (ctx.enemyHpPct <= (p.threshold || 0.5)) {
        result = { triggered: true, value: ld.baseValue, label: t("dl.enemyHp", { pct: Math.floor(ctx.enemyHpPct * 100) }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perTriggeredThisSpin": {
      if (priorTriggered > 0) {
        const mult = Math.pow(p.perUnit || 1.1, priorTriggered);
        result = { triggered: true, value: mult, label: t("dl.trigCount", { count: priorTriggered }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "evolve": {
      if (bs) {
        if (bs.evolved) {
          result = { triggered: true, value: p.evolvedValue || 1.5, label: t("dl.evolvedDone"), bonusLabels: [] };
        } else {
          bs.charge = (bs.charge || 0) + (p.chargePerSpin || 0.05);
          if (bs.charge >= (p.evolveAt || 0.5)) {
            bs.evolved = true;
            result = { triggered: true, value: p.evolvedValue || 1.5, label: t("dl.evolved"), bonusLabels: [] };
          } else {
            return { triggered: false, value: identity, label: t("dl.evolveCharge", { cur: bs.charge.toFixed(2), max: p.evolveAt || 0.5 }), bonusLabels: [] };
          }
        }
      } else {
        return fail;
      }
      break;
    }

    // ??? New conditionTypes ???

    case "accumCombo": {
      if (!bs) return fail;
      bs.totalCombo = (bs.totalCombo || 0) + ctx.comboCount;
      const threshold = p.comboPerStack || 5;
      bs.stacks = Math.floor(bs.totalCombo / threshold);
      if (bs.stacks > 0) {
        let perStack = p.perStack || 0.1;
        // Lv5 stackAccelerate bonus handled in bonuses[] below
        const val = bs.stacks * perStack;
        result = { triggered: true, value: val, label: t("dl.stackCombo", { stacks: bs.stacks, total: bs.totalCombo }), bonusLabels: [] };
      } else {
        return { triggered: false, value: identity, label: t("dl.stackCharge", { cur: bs.totalCombo, max: threshold }), bonusLabels: [] };
      }
      break;
    }

    case "horizontalFull": {
      const hFull = ctx.horizontalFullCount || 0;
      const vFull = ctx.verticalFullCount || 0;
      let value = 1;
      let triggered = false;
      let parts = [];
      if (hFull > 0) {
        const perH = p.perH || 1.2;
        value *= Math.pow(perH, hFull);
        parts.push(t("dl.hFullN", { n: hFull }));
        triggered = true;
      }
      if (vFull > 0 && p.perV) {
        value *= Math.pow(p.perV, vFull);
        parts.push(t("dl.vFullN", { n: vFull }));
        triggered = true;
      }
      if (triggered) {
        result = { triggered: true, value, label: parts.join("+"), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "onHitAccum": {
      if (!bs) return fail;
      if (bs.accumBonus > 0) {
        result = { triggered: true, value: bs.accumBonus, label: t("dl.hitAccum", { val: bs.accumBonus.toFixed(2) }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "randomElement": {
      if (!bs) return fail;
      const designated = bs.designatedElement || "fire";
      const designatedChecks = ctx.elemChecks[designated] || 0;
      bs.totalDesignatedChecks = (bs.totalDesignatedChecks || 0) + designatedChecks;
      let val = designatedChecks * (p.perDesignated || 0.15);
      // Non-designated checks (Lv3+)
      if (p.perOther) {
        let otherChecks = 0;
        for (const elem of ["fire", "light", "nature", "water"]) {
          if (elem !== designated) otherChecks += (ctx.elemChecks[elem] || 0);
        }
        val += otherChecks * p.perOther;
      }
      if (val > 0) {
        const elemNames = { fire: t("elemName.fire"), light: t("elemName.light"), nature: t("elemName.nature"), water: t("elemName.water") };
        result = { triggered: true, value: val, label: t("dl.elemCheck", { elem: elemNames[designated] || designated, count: designatedChecks }), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "chargeRelease": {
      if (!bs) return fail;
      const factor = p.factor || 0.1;
      bs.charge = (bs.charge || 0) + ctx.comboCount * factor;
      if (bs.released) {
        const releaseValue = 1.0 + bs.charge;
        const carryover = p.carryover || 0;
        const carryoverAmount = bs.charge * carryover;
        result = { triggered: true, value: releaseValue, label: t("dl.release", { val: releaseValue.toFixed(2) }), bonusLabels: [] };
        // Store charge for bonuses check before resetting
        result._chargeBeforeReset = bs.charge;
        bs.charge = carryoverAmount;
        bs.released = false;
      } else {
        return { triggered: false, value: 1, label: t("dl.charging", { val: bs.charge.toFixed(2) }), bonusLabels: [] };
      }
      break;
    }

    // encore and desperateRetrigger are handled in computeDecorationMultiplier (second pass)
    case "encore": {
      return fail;
    }

    case "desperateRetrigger": {
      return fail;
    }

    case "addResonance": {
      // Handled in computeDecorationMultiplier after first pass
      return fail;
    }

    // ??? v34 New conditionTypes ???

    case "perRound": {
      // A-03 ?묒? 醫? ?쇱슫??鍮꾨? 怨깅같??
      const round = ctx.round || 1;
      const perUnit = p.perUnit || 0.03;
      const bonus = round * perUnit;
      if (bonus > 0) {
        result = { triggered: true, value: 1 + bonus, label: round + "R x" + (1 + bonus).toFixed(2), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perStatusTypes": {
      // A-04 援ъ뒳 ?붿컡: ???곹깭?댁긽 醫낅쪟 鍮꾨?
      const count = ctx.statusTypeCount || 0;
      if (count > 0) {
        const perUnit = p.perUnit || 0.05;
        const bonus = count * perUnit;
        result = { triggered: true, value: 1 + bonus, label: "상태이상 " + count + "종 x" + (1 + bonus).toFixed(2), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "comboScaling": {
      // S-05 肄ㅻ낫 ?뺢?: 肄ㅻ낫 5+ ??留?5肄ㅻ낫 ?⑥쐞 諛곗쑉
      const combo = ctx.comboCount || 0;
      const minCombo = p.minCombo || 5;
      if (combo >= minCombo) {
        const chunkSize = p.chunkSize || 5;
        const chunks = Math.floor(combo / chunkSize);
        const perChunk = p.perChunk || 0.2;
        const bonus = chunks * perChunk;
        result = { triggered: true, value: 1 + bonus, label: combo + "콤보 x" + (1 + bonus).toFixed(2), bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perHpLoss": {
      // SS-01 ?ъ뿰???? HP ?먯떎 鍮꾨?
      const hpPct = ctx.playerHpPct;
      if (hpPct >= 1.0) return fail; // HP 100% = 誘몃컻??
      const lostPct = 1 - hpPct;
      const steps = Math.floor(lostPct * 10); // 10% ?⑥쐞
      if (steps <= 0) return fail;
      const per10pct = p.per10pct || 0.05;
      const bonus = steps * per10pct;
      result = { triggered: true, value: 1 + bonus, label: "HP " + Math.floor(hpPct * 100) + "% x" + (1 + bonus).toFixed(2), bonusLabels: [] };
      break;
    }

    case "elementTypeTier": {
      // SS-02 臾댁?媛??꾨━利? ?띿꽦 醫낆닔蹂?怨좎젙 諛곗쑉 (2醫? ??諛쒕룞)
      const types = ctx.elementTypesChecked || 0;
      const tiers = p.tiers || {};
      const mult = tiers[types];
      if (mult && types >= 2) {
        result = { triggered: true, value: mult, label: types + "속성 x" + mult, bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "roundDecayTier": {
      // SS-03 ?⑹븫??留λ컯: 珥덈컲 ?쇱슫?쒕퀎 ?붿???諛곗쑉 (4R+ 誘몃컻??
      const round = ctx.round || 1;
      const tiers = p.tiers || {};
      const mult = tiers[round];
      if (mult) {
        result = { triggered: true, value: mult, label: round + "R x" + mult, bonusLabels: [] };
      } else {
        return fail;
      }
      break;
    }

    case "perStatusStack": {
      // SS-04 媛??硫대쪟愿: ?곌?? ?ㅽ깮 鍮꾨?
      const stacks = ctx.thornStackCount || 0;
      if (stacks <= 0) return fail;
      const perStack = p.perStack || 0.08;
      const bonus = stacks * perStack;
      result = { triggered: true, value: 1 + bonus, label: "중첩 " + stacks + "스택 x" + (1 + bonus).toFixed(2), bonusLabels: [] };
      break;
    }

    case "leftDecoMeta": {
      // SSS-01 ?쒖뼇???뺢?: 醫뚯륫 ?μ떇 諛쒕룞 硫뷀? ??2nd pass?먯꽌 泥섎━
      return fail;
    }

    case "roundAccumMult": {
      // SSS-03 ?곸썝??紐⑤옒?쒓퀎: 5R遺??留??쇱슫???꾩쟻 怨?
      const round = ctx.round || 1;
      const startRound = p.startRound || 5;
      if (round < startRound) return fail;
      const roundsPassed = round - startRound + 1;
      const accumMult = Math.pow(p.perRoundMult || 1.1, roundsPassed);
      result = { triggered: true, value: accumMult, label: round + "R x" + accumMult.toFixed(2), bonusLabels: [] };
      break;
    }

    case "perHitLastRound": {
      // SSS-05 遺?쒖쭊 嫄곗슱: 吏곸쟾 ?쇱슫???쇨꺽 ?잛닔 鍮꾨?
      const hits = ctx.hitsTakenLastRound || 0;
      if (hits <= 0) return fail;
      const perHit = p.perHit || 0.3;
      const bonus = hits * perHit;
      result = { triggered: true, value: 1 + bonus, label: "피격 " + hits + "회 x" + (1 + bonus).toFixed(2), bonusLabels: [] };
      break;
    }

    default:
      return fail;
  }

  // ??? Bonus evaluation (Lv3/Lv5 special effects) ???
  if (result && result.triggered && ld.bonuses && ld.bonuses.length > 0) {
    const es = (state.enemy || {}).status || {};
    let dotCount = 0;
    if (ctx.enemyBurn) dotCount++;
    if (ctx.enemyBleed) dotCount++;
    if (es.burnStacks) dotCount += (es.burnStacks - 1);
    if (es.bleedStacks) dotCount += (es.bleedStacks - 1);
    let ccCount = 0;
    if (ctx.enemyStun) ccCount++;
    if (ctx.enemyFreeze) ccCount++;

    for (const bonus of ld.bonuses) {
      let bonusActive = false;
      switch (bonus.type) {
        case "threshold": bonusActive = result.value >= bonus.params.min; break;
        case "comboBonus": bonusActive = ctx.comboCount >= bonus.params.min; break;
        case "comboExact": bonusActive = ctx.comboCount === bonus.params.combo; break;
        case "comboThreshold": bonusActive = ctx.comboCount >= bonus.params.minCombo; break;
        case "hpBonus": bonusActive = ctx.playerHpPct <= bonus.params.max; break;
        case "hpThreshold": bonusActive = ctx.playerHpPct <= bonus.params.threshold; break;
        case "stackBonus": bonusActive = (bs && bs.stacks || 0) >= bonus.params.min; break;
        case "fullCombo": bonusActive = ctx.uncheckedCount === 0; break;
        case "allElement": bonusActive = ctx.elementTypesChecked >= 4; break;
        case "allElements": bonusActive = ctx.elementTypesChecked >= (bonus.params.requiredTypes || 4); break;
        case "extreme": {
          if (bonus.params.combo !== undefined) bonusActive = ctx.comboCount === bonus.params.combo;
          else if (bonus.params.minCombo !== undefined) bonusActive = ctx.comboCount >= bonus.params.minCombo;
          else if (bonus.params.hpPct !== undefined) bonusActive = ctx.playerHpPct <= bonus.params.hpPct;
          else bonusActive = true;
          break;
        }
        case "dotCount": bonusActive = dotCount >= bonus.params.min; break;
        case "ccCount": bonusActive = ccCount >= bonus.params.min; break;
        case "sameElement": bonusActive = ctx.maxSameElement >= bonus.params.min; break;
        case "multiElement": bonusActive = ctx.elementTypesChecked >= bonus.params.min; break;
        case "hpBelow": bonusActive = ctx.playerHpPct <= bonus.params.threshold; break;
        case "enemyHpBelow": bonusActive = ctx.enemyHpPct <= bonus.params.threshold; break;
        case "roundMin": bonusActive = ctx.round >= bonus.params.min; break;
        case "unchecked": bonusActive = ctx.uncheckedCount >= bonus.params.min; break;
        case "uncheckedThreshold": bonusActive = ctx.uncheckedCount >= bonus.params.minUnchecked; break;
        case "horizontalFull": bonusActive = (ctx.horizontalFullCount || 0) >= bonus.params.min; break;
        case "horizontalFullCount": bonusActive = (ctx.horizontalFullCount || 0) >= bonus.params.minH; break;
        case "unconditional": bonusActive = true; break;
        case "chargeThreshold": bonusActive = (result._chargeBeforeReset || 0) >= bonus.params.min; break;
        case "comboScaling": {
          if (ctx.comboCount > (bonus.params.startCombo || 0)) {
            const extra = ctx.comboCount - (bonus.params.startCombo || 0);
            const scaleMult = Math.pow(bonus.params.perCombo || 1.05, extra);
            result.value *= scaleMult;
            result.bonusLabels.push(bonus.label || t("dl.comboScale", { val: scaleMult.toFixed(2) }));
          }
          continue; // already applied directly
        }
        case "stackAccelerate": {
          if (bs && bs.stacks > (bonus.params.afterStacks || 10)) {
            const extraStacks = bs.stacks - (bonus.params.afterStacks || 10);
            const extraVal = extraStacks * ((bonus.params.perStack || 0.2) - (p.perStack || 0.1));
            result.value += extraVal;
            result.bonusLabels.push(bonus.label || t("dl.accel", { val: extraVal.toFixed(2) }));
          }
          continue; // already applied directly
        }
        case "triggerCountConvert": {
          const totalTriggers = priorTriggered + 1; // +1 for self
          bonusActive = totalTriggers >= (bonus.params.minTriggers || 3);
          if (bonusActive) {
            // Convert this decoration's result to mult type
            result.multTypeOverride = "mult";
            result.value = bonus.value;
            result.bonusLabels.push(bonus.label || t("dl.multConvert"));
          }
          continue;
        }
        // Special bonuses that don't directly modify value (side effects)
        case "critBonus":
        case "dotDamageBoost":
        case "designatedSymbolPlace":
        case "resonanceFeedback":
        case "desperateGuarantee": {
          // These are handled externally or as side effects
          // Just note them for display
          bonusActive = true;
          if (bonusActive) {
            result.bonusLabels.push(bonus.label || bonus.type);
            if (bonus.type === "critBonus" && bonus.params.critChance) {
              result.sideEffects = result.sideEffects || [];
              result.sideEffects.push({ type: "critBonus", critChance: bonus.params.critChance });
            }
          }
          continue;
        }
        default: bonusActive = false; break;
      }
      if (bonusActive) {
        if (bonus.multType === "add") {
          result.value += bonus.value;
          result.bonusLabels.push(bonus.label || ("+" + bonus.value));
        } else if (bonus.multType === "mult") {
          result.value *= bonus.value;
          result.bonusLabels.push(bonus.label || ("x" + bonus.value));
        } else if (bonus.multType === "override") {
          result.value = bonus.value;
          result.bonusLabels.push(bonus.label || ("=" + bonus.value));
        }
      }
    }
  }

  // Clean up internal fields
  if (result && result._chargeBeforeReset !== undefined) delete result._chargeBeforeReset;

  return result || fail;
}

function computeDecorationMultiplier(spinCtx) {
  const ids = equippedDecoIdsPacked();
  if (!ids.length) return { finalMult: 1.0, triggered: [], logs: [] };

  const bs = state.decoBattleState || {};
  let currentMult = 1.0;
  const triggered = [];
  const logs = [];
  let priorTriggered = 0;
  let addTriggeredCount = 0;

  // ??? 留??ㅽ?留덈떎 triggered ?뚮옒洹?由ъ뀑 (?꾪닾 以??꾩쟻 ?곹깭???좎?) ???
  for (const id of ids) {
    if (bs[id]) bs[id].triggered = false;
  }

  // Track which decorations are encore/desperateRetrigger/addResonance/leftDecoMeta for second pass
  let encoreId = null;
  let encoreLd = null;
  let desperateId = null;
  let desperateLd = null;
  let resonanceId = null;
  let resonanceLd = null;
  let leftDecoMetaId = null;
  let leftDecoMetaLd = null;

  // ??? First pass: evaluate normal decorations ???
  for (const id of ids) {
    const deco = DECO_BY_ID[id];
    if (!deco) continue;
    const ld = decoLevelData(id);
    if (!ld) continue;
    if (!bs[id]) bs[id] = {};
    const decoBS = bs[id];

    // Skip per-check decorations (evaluated during individual check resolution in spin.js)
    // timing? ?덈꺼 ?곗씠?곗뿉 ?덉쓬 (deco 理쒖긽?꾧? ?꾨떂)
    if (ld.timing === "perCheck") continue;

    // Mark meta decorations for second pass
    if (ld.conditionType === "encore") { encoreId = id; encoreLd = ld; continue; }
    if (ld.conditionType === "desperateRetrigger") { desperateId = id; desperateLd = ld; continue; }
    if (ld.conditionType === "addResonance") { resonanceId = id; resonanceLd = ld; continue; }
    if (ld.conditionType === "leftDecoMeta") { leftDecoMetaId = id; leftDecoMetaLd = ld; continue; }

    const result = evaluateDecoration(deco, ld, decoBS, spinCtx, priorTriggered);
    const effectiveMultType = result.multTypeOverride || ld.multType;

    if (result.triggered) {
      decoBS.triggered = true;
      if (effectiveMultType === "add") {
        currentMult += result.value;
        addTriggeredCount++;
        logs.push(`${deco.name}: +${result.value.toFixed(2)} (${result.label})`);
      } else {
        currentMult *= result.value;
        logs.push(`${deco.name}: x${result.value.toFixed(2)} (${result.label})`);
      }
      if (result.bonusLabels && result.bonusLabels.length > 0) {
        logs.push(`  ??蹂대꼫?? ${result.bonusLabels.join(", ")}`);
      }
      triggered.push({ id, name: deco.name, value: result.value, label: result.label, type: effectiveMultType, bonusLabels: result.bonusLabels || [] });
      priorTriggered++;

      // Apply side effects (e.g., crit bonus)
      if (result.sideEffects) {
        for (const se of result.sideEffects) {
          if (se.type === "critBonus" && state.player) {
            state.player.tempCritBonus = (state.player.tempCritBonus || 0) + se.critChance;
          }
        }
      }
    } else if (result.label) {
      logs.push(`${deco.name}: ${result.label}`);
    }
  }

  // ??? v34: leftDecoMeta evaluation (SSS-01 ?쒖뼇???뺢?) ???
  // 醫뚯륫 ?μ떇??諛쒕룞???뚮쭏??perTrigger 諛곗쑉??以묒꺽
  if (leftDecoMetaId && leftDecoMetaLd) {
    const deco = DECO_BY_ID[leftDecoMetaId];
    const lp = leftDecoMetaLd.conditionParams || {};
    const decoBS = bs[leftDecoMetaId] || {};

    const fullSlots = equippedDecoIds(); // [null|id, null|id, null|id, null|id]
    const metaSlotIdx = fullSlots.indexOf(leftDecoMetaId);

    // 醫뚯륫???덈뒗 ?μ떇 以?諛쒕룞??寃?移댁슫??
    let leftTriggerCount = 0;
    for (let si = 0; si < metaSlotIdx; si++) {
      const slotId = fullSlots[si];
      if (!slotId) continue;
      if (bs[slotId] && bs[slotId].triggered) leftTriggerCount++;
    }

    if (leftTriggerCount > 0) {
      const perTrigger = lp.perTrigger || 1.05;
      const metaMult = Math.pow(perTrigger, leftTriggerCount);
      decoBS.triggered = true;
      currentMult *= metaMult;
      logs.push(`${deco.name}: x${metaMult.toFixed(2)} (醫뚯륫 ${leftTriggerCount}媛?諛쒕룞)`);
      triggered.push({ id: leftDecoMetaId, name: deco.name, value: metaMult, label: "좌측 " + leftTriggerCount + "개 발동", type: "mult", bonusLabels: [] });
      priorTriggered++;
    }
  }

  // ??? addResonance evaluation ???
  if (resonanceId && resonanceLd) {
    const deco = DECO_BY_ID[resonanceId];
    const rp = resonanceLd.conditionParams || {};
    const decoBS = bs[resonanceId] || {};
    if (addTriggeredCount > 0) {
      const perAdd = rp.perAddTrigger || 1.15;
      let resonanceValue = Math.pow(perAdd, addTriggeredCount);
      decoBS.triggered = true;
      currentMult *= resonanceValue;
      logs.push(`${deco.name}: x${resonanceValue.toFixed(2)} (?⑸같??${addTriggeredCount}媛?諛쒕룞)`);
      triggered.push({ id: resonanceId, name: deco.name, value: resonanceValue, label: t("dl.addResonance", { count: addTriggeredCount }), type: "mult", bonusLabels: [] });
      priorTriggered++;

      // Evaluate bonuses for addResonance
      if (resonanceLd.bonuses) {
        for (const bonus of resonanceLd.bonuses) {
          if (bonus.type === "resonanceFeedback" && resonanceValue >= (bonus.params.minResonance || 2.0)) {
            // Feed back add value to all add-type triggered decorations
            logs.push(`  ??${bonus.label || t("dl.resFeedback")}: ?⑸같??+${bonus.params.feedbackValue || 0.1}`);
          }
        }
      }
    } else if (rp.minIfEquipped) {
      const minVal = rp.minIfEquipped;
      currentMult *= minVal;
      logs.push(`${deco.name}: x${minVal.toFixed(2)} (?μ갑 理쒖냼 蹂댁옣)`);
      triggered.push({ id: resonanceId, name: deco.name, value: minVal, label: t("dl.minGuarantee"), type: "mult", bonusLabels: [] });
      priorTriggered++;
    }
  }

  // ??? encore evaluation (second pass) ???
  // ?숈퐫瑜? ?먭린 "醫뚯륫"???μ갑???μ떇???꾨? 諛쒕룞?덉쑝硫?
  //         醫뚯륫?믪슦痢??쒖꽌?濡???踰???諛곗쑉 ?곸슜
  if (encoreId && encoreLd) {
    const deco = DECO_BY_ID[encoreId];
    const ep = encoreLd.conditionParams || {};
    const decoBS = bs[encoreId] || {};

    // 怨좎젙 4?щ’ 諛곗뿴?먯꽌 ?숈퐫瑜댁쓽 ?щ’ ?몃뜳??李얘린
    const fullSlots = equippedDecoIds();   // [null|id, null|id, null|id, null|id]
    const encoreSlotIdx = fullSlots.indexOf(encoreId);

    // ?숈퐫瑜?醫뚯륫???덈뒗 ?쇰컲 ?μ떇留??섏쭛 (硫뷀? ?μ떇 ?쒖쇅)
    const META_TYPES = ["encore", "desperateRetrigger", "addResonance"];
    const leftIds = [];
    for (let si = 0; si < encoreSlotIdx; si++) {
      const slotId = fullSlots[si];
      if (!slotId) continue;
      const slotLd = decoLevelData(slotId);
      if (!slotLd) continue;
      if (META_TYPES.includes(slotLd.conditionType)) continue;
      leftIds.push(slotId);
    }

    const leftTriggeredIds = leftIds.filter(id => bs[id] && bs[id].triggered);
    const missCount = leftIds.length - leftTriggeredIds.length;

    let encoreActivated = false;
    if (missCount === 0 && leftIds.length > 0) {
      encoreActivated = true;
    } else if (missCount <= (ep.missAllowance || 0) && leftIds.length > 0) {
      encoreActivated = Math.random() < (ep.missChance || 0);
    }

    if (encoreActivated) {
      decoBS.triggered = true;
      const amplify = ep.amplify || 1.0;
      logs.push(`${deco.name}: ?숈퐫瑜?諛쒕룞! (醫뚯륫 ${leftTriggeredIds.length}媛??꾩썝 諛쒕룞 ???щ컻?? x${amplify} 利앺룺)`);
      triggered.push({ id: encoreId, name: deco.name, value: amplify, label: t("dl.encore"), type: "mult", bonusLabels: [] });

      // 醫뚯륫?믪슦痢??쒖꽌?濡??щ컻??(leftIds???대? ?щ’ ?쒖꽌)
      for (const reId of leftTriggeredIds) {
        const reDeco = DECO_BY_ID[reId];
        if (!reDeco) continue;
        const reLd = decoLevelData(reId);
        if (!reLd) continue;
        const reBS = bs[reId] || {};
        const reResult = evaluateDecoration(reDeco, reLd, reBS, spinCtx, priorTriggered);
        const reEffMultType = reResult.multTypeOverride || reLd.multType;

        if (reResult.triggered) {
          let reVal = reResult.value * amplify;
          if (reEffMultType === "add") {
            currentMult += reVal;
          } else {
            currentMult *= reVal;
          }
          logs.push(`  ???щ컻??${reDeco.name}: ${reEffMultType === "add" ? "+" : "x"}${reVal.toFixed(2)}`);
          triggered.push({ id: reId, name: reDeco.name, value: reVal, label: t("dl.encoreRetrigger"), type: reEffMultType, bonusLabels: [], encore: true });
        }
      }
    } else if (leftIds.length > 0) {
      logs.push(`${deco.name}: ?숈퐫瑜??湲?(醫뚯륫 ${leftTriggeredIds.length}/${leftIds.length} 諛쒕룞)`);
    } else {
      logs.push(`${deco.name}: 醫뚯륫???μ떇 ?놁쓬`);
    }
  }

  // ??? desperateRetrigger evaluation (second pass) ???
  if (desperateId && desperateLd) {
    const deco = DECO_BY_ID[desperateId];
    const dp = desperateLd.conditionParams || {};
    const decoBS = bs[desperateId] || {};

    if (spinCtx.playerHpPct <= (dp.hpThreshold || 0.3)) {
      decoBS.triggered = true;
      let retriggerChance = dp.retriggerChance || 0.5;

      // Lv5 desperate guarantee bonus
      if (desperateLd.bonuses) {
        for (const bonus of desperateLd.bonuses) {
          if (bonus.type === "desperateGuarantee" && spinCtx.playerHpPct <= bonus.params.hpThreshold) {
            retriggerChance = 1.0;
          }
        }
      }

      const otherTriggered = triggered.filter(t => t.id !== desperateId && t.id !== encoreId && t.id !== resonanceId);
      let retriggered = 0;

      for (const t of otherTriggered) {
        if (Math.random() < retriggerChance) {
          const reDeco = DECO_BY_ID[t.id];
          if (!reDeco) continue;
          const reLd = decoLevelData(t.id);
          if (!reLd) continue;
          const reBS = bs[t.id] || {};
          const reResult = evaluateDecoration(reDeco, reLd, reBS, spinCtx, priorTriggered);
          const reEffMultType = reResult.multTypeOverride || reLd.multType;

          if (reResult.triggered) {
            if (reEffMultType === "add") {
              currentMult += reResult.value;
            } else {
              currentMult *= reResult.value;
            }
            logs.push(`  ???꾪솕???щ컻??${reDeco.name}: ${reEffMultType === "add" ? "+" : "x"}${reResult.value.toFixed(2)}`);
            retriggered++;
          }
        }
      }

      logs.push(deco.name + ": HP " + Math.floor(spinCtx.playerHpPct * 100) + "% / " + retriggered + "개 재발동");
      triggered.push({ id: desperateId, name: deco.name, value: retriggered, label: retriggered + "개 재발동", type: "mult", bonusLabels: [] });
    }
  }

  return { finalMult: Math.max(0.01, currentMult), triggered, logs };
}

function updateDecoRoundEnd() {
  if (!state.decoBattleState) return;
  const ids = equippedDecoIdsPacked();
  for (const id of ids) {
    const deco = DECO_BY_ID[id];
    if (!deco) continue;
    const ld = decoLevelData(id);
    if (!ld) continue;
    const bs = state.decoBattleState[id];
    if (!bs) continue;
    const ct = ld.conditionType;
    const p = ld.conditionParams || {};

    if (ct === "accumPerRound") {
      bs.accumBonus = (bs.accumBonus || 0) + (p.perRound || 0.15);
    }
    if (ct === "decayPerRound") {
      const currentVal = bs.currentValue || p.start || 2.0;
      const minVal = p.min || 1.0;
      const newVal = currentVal - (p.decay || 0.2);
      if (newVal <= minVal && !bs.hitMin) {
        bs.hitMin = true;
        bs.recovering = !!p.recovery;
      }
      if (bs.recovering && p.recovery) {
        bs.currentValue = Math.min(p.recoveryMax || 1.5, (bs.currentValue || minVal) + p.recovery);
      } else {
        bs.currentValue = Math.max(minVal, newVal);
      }
    }
    if (ct === "onHitAccum") {
      if (state.playerHitThisRound) {
        bs.accumBonus = (bs.accumBonus || 0) + (p.perHit || 0.3);
      }
    }
    if (ct === "chargeRelease") {
      bs.roundCount = (bs.roundCount || 0) + 1;
      if (bs.roundCount % (p.releaseEvery || 3) === 0) {
        bs.released = true;
      }
    }
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function pickPetGrade() {
  const total = PET_GRADE_RATES.reduce((a, b) => a + b.w, 0);
  return weightedPick(PET_GRADE_RATES, total).grade;
}

function grantPet(petId) {
  const pet = PET_BY_ID[petId];
  if (!pet || !META.pet) return { isNew: false };
  const wasOwned = isPetOwned(petId);
  META.pet.inventory[petId] = (META.pet.inventory[petId] || 0) + 1;
  return { isNew: !wasOwned, totalCopies: META.pet.inventory[petId] };
}

function enhancePet(petId) {
  const pet = PET_BY_ID[petId];
  if (!pet || !META.pet) return { ok: false, reason: "invalid" };
  if (!isPetOwned(petId)) return { ok: false, reason: "not_owned" };
  const enh = petEnhancement(petId);
  if (enh >= pet.maxEnhance) return { ok: false, reason: "max" };
  if (petCopies(petId) < 2) return { ok: false, reason: "need_copy" };
  META.pet.inventory[petId] -= 1;
  META.pet.enhancement[petId] = enh + 1;
  saveMeta(META);
  return { ok: true, newEnhance: enh + 1, newPassiveCount: petUnlockedPassiveCount(petId) };
}

function synthesizePets(petIds, fromGrade) {
  const needed = PET_SYNTHESIS_COST[fromGrade];
  if (!needed || petIds.length < needed) return { ok: false, reason: "not_enough" };
  const toGradeMap = { C: "B", B: "A", A: "S" };
  const toGrade = toGradeMap[fromGrade];
  if (!toGrade) return { ok: false, reason: "invalid_grade" };
  // Validate all pets are owned and correct grade
  for (const id of petIds) {
    const pet = PET_BY_ID[id];
    if (!pet || pet.grade !== fromGrade || !isPetOwned(id)) return { ok: false, reason: "invalid_pet" };
  }
  // Consume pets
  for (const id of petIds) {
    META.pet.inventory[id] = (META.pet.inventory[id] || 1) - 1;
    if (META.pet.inventory[id] <= 0) {
      // Unequip if was equipped
      META.pet.equippedPetIds = (META.pet.equippedPetIds || []).filter(eid => eid !== id);
    }
  }
  // Grant random pet of higher grade
  const pool = PET_IDS_BY_GRADE[toGrade] || [];
  const resultId = pool.length ? pickOne(pool) : null;
  if (resultId) grantPet(resultId);
  // Grant pet food
  const food = PET_FOOD_PER_SYNTHESIS[toGrade] || 5;
  META.pet.petFood = (META.pet.petFood || 0) + food;
  saveMeta(META);
  return { ok: true, resultPet: resultId ? PET_BY_ID[resultId] : null, foodGained: food };
}

function craftSSPet(ssId) {
  const ssPet = PET_BY_ID[ssId];
  if (!ssPet || ssPet.grade !== "SS" || !ssPet.craftMaterials) return { ok: false, reason: "invalid" };
  // Parse craftMaterials like "苑껊떞鍮?+ & 留덈???議고삎臾?+"
  const matNames = ssPet.craftMaterials.split("&").map(s => s.trim().replace(/\+\+$/, ""));
  const matPets = matNames.map(name => PETS.find(p => p.name === name && p.grade === "S"));
  if (matPets.some(p => !p)) return { ok: false, reason: "invalid_materials" };
  // Check all materials are owned and max enhanced
  for (const mp of matPets) {
    if (!isPetOwned(mp.id)) return { ok: false, reason: "not_owned", pet: mp };
    if (petEnhancement(mp.id) < mp.maxEnhance) return { ok: false, reason: "not_max", pet: mp };
  }
  // Consume materials
  for (const mp of matPets) {
    META.pet.inventory[mp.id] = (META.pet.inventory[mp.id] || 1) - 1;
    META.pet.enhancement[mp.id] = 0;
    META.pet.equippedPetIds = (META.pet.equippedPetIds || []).filter(eid => eid !== mp.id);
  }
  // Grant SS pet
  grantPet(ssId);
  saveMeta(META);
  return { ok: true, pet: ssPet };
}

function buyPetFromShop(petId) {
  const pet = PET_BY_ID[petId];
  if (!pet || pet.grade !== "S") return { ok: false, reason: "invalid" };
  const food = META.pet.petFood || 0;
  if (food < PET_SHOP_COST) return { ok: false, reason: "not_enough_food" };
  META.pet.petFood -= PET_SHOP_COST;
  grantPet(petId);
  saveMeta(META);
  return { ok: true, pet };
}

function petDrawOnce() {
  if (META.gold < PET_GACHA_COST) return null;
  META.gold -= PET_GACHA_COST;
  const grade = pickPetGrade();
  const pool = PET_IDS_BY_GRADE[grade] || [];
  const petId = pool.length ? pickOne(pool) : PETS[0].id;
  const pet = PET_BY_ID[petId];
  const wasOwned = isPetOwned(petId);
  const result = grantPet(petId);
  saveMeta(META);
  return { grade, pet, isNew: result.isNew, isDuplicate: wasOwned, totalCopies: result.totalCopies };
}

function petDrawMany(count) {
  const n = Math.max(1, Math.floor(count || 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    const one = petDrawOnce();
    if (!one) break;
    out.push(one);
  }
  return out;
}

function summarizePetDrawResults(results) {
  const byGrade = { C: 0, B: 0, A: 0, S: 0, SS: 0 };
  let newCount = 0;
  let dupCount = 0;
  for (const r of results) {
    if (r && r.grade && byGrade[r.grade] != null) byGrade[r.grade] += 1;
    if (r && r.isNew) newCount++;
    if (r && r.isDuplicate) dupCount++;
  }
  const parts = [];
  for (const g of ["C", "B", "A", "S", "SS"]) {
    if (byGrade[g] > 0) parts.push(`${g} ${byGrade[g]}`);
  }
  if (newCount > 0) parts.push(`NEW ${newCount}`);
  if (dupCount > 0) parts.push(`以묐났 ${dupCount}`);
  return parts.join(" 쨌 ");
}

function renderPetMenu() {
  // Draw buttons
  if (ui.petDrawBtn) {
    ui.petDrawBtn.textContent = t("ui.draw1", { cost: PET_GACHA_COST });
    ui.petDrawBtn.disabled = META.gold < PET_GACHA_COST;
  }
  if (ui.petDraw10Btn) {
    ui.petDraw10Btn.textContent = t("ui.draw10", { cost: PET_GACHA_COST * 10 });
    ui.petDraw10Btn.disabled = META.gold < PET_GACHA_COST * 10;
  }
  // Pet food display
  const foodEl = document.getElementById("petFoodText2");
  if (foodEl) foodEl.textContent = META.pet ? META.pet.petFood || 0 : 0;

  renderPetGrid();
  renderPetSlots();
  renderSynthesisUI();
  renderCraftUI();
  renderPetShop();
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   DECORATION MENU / GRID / SLOTS / DETAIL
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function renderDecoMenu() {
  if (ui.decoDrawBtn) {
    ui.decoDrawBtn.textContent = t("ui.draw1", { cost: DECO_GACHA_COST });
    ui.decoDrawBtn.disabled = META.gold < DECO_GACHA_COST;
  }
  if (ui.decoDraw10Btn) {
    ui.decoDraw10Btn.textContent = t("ui.draw10", { cost: DECO_GACHA_COST * 10 });
    ui.decoDraw10Btn.disabled = META.gold < DECO_GACHA_COST * 10;
  }
  renderDecoGrid();
  renderDecoSlots();
  sbRenderDecos();
}

function renderDecoGrid() {
  if (!ui.decoGrid) return;
  ui.decoGrid.innerHTML = "";
  const eqIds = equippedDecoIds();
  const GRADE_ORDER = { SSS: 0, SS: 1, S: 2, A: 3 };

  // 蹂댁쑀 ?μ떇 + 議곌컖??1媛쒕씪???덈뒗 ?μ떇 紐⑤몢 ?쒖떆
  const visibleDecos = DECORATIONS.filter(d => isDecoOwned(d.id) || decoFragments(d.id) > 0);
  visibleDecos.sort((a, b) => {
    // 蹂댁쑀 ?곗꽑, 洹??ㅼ쓬 ?깃툒 ??
    const aOwned = isDecoOwned(a.id) ? 0 : 1;
    const bOwned = isDecoOwned(b.id) ? 0 : 1;
    if (aOwned !== bOwned) return aOwned - bOwned;
    return (GRADE_ORDER[a.grade] ?? 9) - (GRADE_ORDER[b.grade] ?? 9);
  });

  for (const deco of visibleDecos) {
    const owned = isDecoOwned(deco.id);
    const lv = decoLevel(deco.id);
    const frags = decoFragments(deco.id);
    const isEquipped = eqIds.includes(deco.id);
    const ld = decoLevelData(deco.id);

    const el = document.createElement("div");
    el.className = "decoGridItem";
    if (owned) el.classList.add("decoGridItem--owned");
    else el.classList.add("decoGridItem--fragment");
    if (isEquipped) el.classList.add("decoGridItem--equipped");

    const gradeClass = `decoGridItem__grade--${deco.grade}`;
    const iconHtml = deco.icon
      ? (deco.icon.includes("/")
        ? `<img class="decoGridItem__icon" src="${deco.icon}" alt="${decoNameI18n(deco)}" />`
        : `<span class="decoGridItem__emoji">${deco.icon}</span>`)
      : `<div class="decoGridItem__iconPlaceholder">${decoNameI18n(deco).charAt(0)}</div>`;

    // 議곌컖 寃뚯씠吏 怨꾩궛
    const nextCost = owned ? decoNextCost(deco.id) : DECO_FRAGMENT_COST[0];
    const gaugeMax = nextCost || 1;
    const gaugeFill = nextCost ? Math.min(frags, gaugeMax) : gaugeMax;
    const gaugePct = Math.floor((gaugeFill / gaugeMax) * 100);
    const isMaxLv = owned && lv >= DECO_FRAGMENT_COST.length;

    // 寃뚯씠吏 ?됱긽: 誘몃낫???뚯깋, 蹂댁쑀=?깃툒?? MAX=湲덉깋
    let gaugeColor = "rgba(255,255,255,0.25)";
    if (owned && !isMaxLv) {
      const GAUGE_COLORS = { A: "#2e8b57", S: "#c06020", SS: "#a030c0", SSS: "#d4a017" };
      gaugeColor = GAUGE_COLORS[deco.grade] || gaugeColor;
    } else if (isMaxLv) {
      gaugeColor = "#d4a017";
    }

    const gaugeHtml = isMaxLv
      ? `<div class="decoGridItem__gauge">
           <div class="decoGridItem__gaugeFill decoGridItem__gaugeFill--max" style="width:100%;background:${gaugeColor};"></div>
           <span class="decoGridItem__gaugeLabel">MAX</span>
         </div>`
      : `<div class="decoGridItem__gauge">
           <div class="decoGridItem__gaugeFill" style="width:${gaugePct}%;background:${gaugeColor};"></div>
           <span class="decoGridItem__gaugeLabel">${frags}/${gaugeMax}</span>
         </div>`;

    if (owned) {
      const multType = ld ? ld.multType : (deco.levels[0] || {}).multType || "mult";
      el.innerHTML = `
        <div class="decoGridItem__top ${gradeClass}">
          ${iconHtml}
          <span class="decoGridItem__lvBadge">Lv${lv}</span>
          ${isEquipped ? `<span class="decoGridItem__eqBadge">${t("ui.equip")}</span>` : ''}
        </div>
        <div class="decoGridItem__bottom">
          <span class="decoGridItem__grade">${deco.grade}</span>
          <span class="decoGridItem__multBadge decoGridItem__multBadge--${multType}">${multLabelI18n(multType)}</span>
        </div>
        ${gaugeHtml}
      `;
    } else {
      // 誘몃낫????議곌컖留??덈뒗 ?곹깭
      el.innerHTML = `
        <div class="decoGridItem__top ${gradeClass}" style="opacity:0.5;">
          ${iconHtml}
        </div>
        <div class="decoGridItem__bottom">
          <span class="decoGridItem__grade">${deco.grade}</span>
        </div>
        ${gaugeHtml}
      `;
    }
    el.addEventListener("click", () => openDecoDetail(deco.id));
    ui.decoGrid.appendChild(el);
  }

  if (visibleDecos.length === 0) {
    ui.decoGrid.innerHTML = `<div class="decoGrid__empty">${t("ui.decoNone")}</div>`;
  }
}

function renderDecoSlots() {
  const eqIds = equippedDecoIds();
  for (let i = 0; i < DECO_MAX_SLOTS; i++) {
    const slotEl = ui[`decoSlot${i}`];
    if (!slotEl) continue;
    const decoId = eqIds[i];
    if (decoId) {
      const deco = DECO_BY_ID[decoId];
      if (!deco) { slotEl.innerHTML = `<div class="decoSlot__empty">${t("ui.emptySlot")}</div>`; continue; }
      const lv = decoLevel(decoId);
      const ld = decoLevelData(decoId);
      const multType = ld ? ld.multType : "mult";
      const gradeClass = `decoGridItem__grade--${deco.grade}`;
      const iconHtml = deco.icon
        ? (deco.icon.includes("/")
          ? `<img class="decoSlot__icon" src="${deco.icon}" alt="${decoNameI18n(deco)}" />`
          : `<span class="decoSlot__emoji">${deco.icon}</span>`)
        : `<div class="decoSlot__iconPlaceholder">${decoNameI18n(deco).charAt(0)}</div>`;
      slotEl.innerHTML = `
        <div class="decoSlot__filled">
          <div class="decoSlot__iconWrap ${gradeClass}">
            ${iconHtml}
            <span class="decoSlot__lvBadge">Lv${lv}</span>
          </div>
          <span class="decoSlot__multBadge decoSlot__multBadge--${multType}">${multLabelI18n(multType)}</span>
          <button class="decoSlot__removeBtn" data-idx="${i}" type="button">??/button>
        </div>
      `;
      slotEl.querySelector(".decoSlot__removeBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        META.deco.equippedDecoIds[i] = null;
        saveMeta(META);
        renderDecoMenu();
      });
      slotEl.addEventListener("click", () => openDecoDetail(decoId));
    } else {
      slotEl.innerHTML = `<div class="decoSlot__empty">${t("ui.emptySlot")}</div>`;
    }
  }
}

function openDecoDetail(decoId) {
  const deco = DECO_BY_ID[decoId];
  if (!deco || !ui.decoDetailModal) return;
  const owned = isDecoOwned(decoId);
  const lv = decoLevel(decoId);
  const frags = decoFragments(decoId);
  const eqIds = equippedDecoIds();
  const equipped = eqIds.includes(decoId);
  const ld = decoLevelData(decoId);
  const GRADE_COLORS = { A: "#4caf50", S: "#2196f3", SS: "#9c27b0", SSS: "#ff9800" };

  // Icon
  if (ui.decoDetailIconWrap) {
    if (deco.icon && deco.icon.includes("/")) {
      ui.decoDetailIconWrap.innerHTML = `<img class="decoDetail__icon" src="${deco.icon}" alt="${decoNameI18n(deco)}" />`;
    } else if (deco.icon) {
      ui.decoDetailIconWrap.innerHTML = `<span class="decoDetail__emoji">${deco.icon}</span>`;
    } else {
      ui.decoDetailIconWrap.innerHTML = `<div class="decoDetail__iconPlaceholder">${decoNameI18n(deco).charAt(0)}</div>`;
    }
  }
  // Badges
  if (ui.decoDetailGrade) {
    ui.decoDetailGrade.textContent = deco.grade;
    ui.decoDetailGrade.style.background = GRADE_COLORS[deco.grade] || "#666";
  }
  // ?꾩옱 ?덈꺼??multType?쇰줈 諛곗쑉 諭껋? ?쒖떆
  const currentMultType = ld ? ld.multType : (deco.levels[0] ? deco.levels[0].multType : "mult");
  if (ui.decoDetailMultBadge) {
    ui.decoDetailMultBadge.textContent = multLabelFullI18n(currentMultType);
    ui.decoDetailMultBadge.className = `decoDetail__multBadge decoDetail__multBadge--${currentMultType}`;
  }
  // Name
  if (ui.decoDetailName) ui.decoDetailName.textContent = decoNameI18n(deco);

  // ?덈꺼 + 議곌컖 ?뺣낫 (shortDesc ?곸뿭 ?ы솢??
  if (ui.decoDetailShortDesc) {
    if (owned) {
      const nextCost = decoNextCost(decoId);
      const fragInfo = nextCost ? `  |  ${t("ui.decoFragInfo", { cur: frags, cost: nextCost })}` : `  |  ${t("ui.decoFragCount", { cur: frags })}`;
      ui.decoDetailShortDesc.textContent = `Lv${lv}${lv >= 5 ? " (MAX)" : ""}${fragInfo}`;
    } else {
      ui.decoDetailShortDesc.textContent = t("ui.decoNotOwned", { cur: frags, cost: DECO_FRAGMENT_COST[0] });
    }
  }

  // ?덈꺼蹂??④낵 由ъ뒪??(desc ?곸뿭 ?ы솢??
  if (ui.decoDetailDesc) {
    let descHtml = "";
    for (let i = 0; i < deco.levels.length; i++) {
      const lvData = deco.levels[i];
      const lvNum = i + 1;
      const isCurrent = lvNum === lv;
      const isNext = lvNum === lv + 1;
      const isLocked = lvNum > lv;
      const lvLabel = `Lv${lvNum}`;
      let style = "margin:4px 0;padding:4px 6px;border-radius:4px;font-size:12px;line-height:1.4;";
      if (isCurrent) {
        style += "background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);color:#ffd700;";
      } else if (isNext) {
        style += "background:rgba(100,200,255,0.1);border:1px solid rgba(100,200,255,0.3);color:rgba(100,200,255,0.9);";
      } else if (isLocked && !owned) {
        style += "color:rgba(60,42,28,0.25);";
      } else if (isLocked) {
        style += "color:rgba(60,42,28,0.38);";
      } else {
        style += "color:rgba(60,42,28,0.55);";
      }
      const marker = isCurrent ? "??" : isNext ? "??" : "";
      descHtml += `<div style="${style}">${marker}<b>${lvLabel}</b>: ${decoLevelDescI18n(deco, i) || lvData.desc}</div>`;
    }
    ui.decoDetailDesc.innerHTML = descHtml;
  }

  // Actions
  const inBattle = !!(state && state.started && state.enemy);
  if (ui.decoDetailActions) {
    ui.decoDetailActions.innerHTML = "";

    if (inBattle) {
      const hint = document.createElement("span");
      hint.style.cssText = "font-size:12px;color:rgba(60,42,28,0.4);";
      hint.textContent = t("ui.battleNoChange");
      ui.decoDetailActions.appendChild(hint);
    } else {
      // 議곕┰ 踰꾪듉 (誘몃낫??+ 議곌컖 異⑸텇)
      if (!owned) {
        const cost = DECO_FRAGMENT_COST[0];
        const canAssemble = frags >= cost;
        const assembleBtn = document.createElement("button");
        assembleBtn.className = "btn";
        assembleBtn.textContent = t("ui.assemble", { cur: frags, cost: cost });
        assembleBtn.disabled = !canAssemble;
        if (canAssemble) {
          assembleBtn.addEventListener("click", () => {
            const res = assembleDecoration(decoId);
            if (res.ok) {
              closeDecoDetail();
              renderDecoMenu();
              if (ui.decoDrawResult) ui.decoDrawResult.textContent = t("ui.assembleOk", { name: decoNameI18n(deco) });
            }
          });
        }
        ui.decoDetailActions.appendChild(assembleBtn);
      }

      // 媛뺥솕 踰꾪듉 (蹂댁쑀 + 理쒕? ?덈꺼 誘몃쭔)
      if (owned && lv < DECO_FRAGMENT_COST.length) {
        const nextCost = DECO_FRAGMENT_COST[lv];
        const canEnhance = frags >= nextCost;
        const enhBtn = document.createElement("button");
        enhBtn.className = "btn";
        enhBtn.textContent = t("ui.upgrade", { from: lv, to: lv + 1, cur: frags, cost: nextCost });
        enhBtn.disabled = !canEnhance;
        if (canEnhance) {
          enhBtn.addEventListener("click", () => {
            const res = enhanceDecoration(decoId);
            if (res.ok) {
              openDecoDetail(decoId); // ?덈줈怨좎묠
              renderDecoMenu();
              if (ui.decoDrawResult) ui.decoDrawResult.textContent = t("ui.upgradeOk", { name: decoNameI18n(deco), level: res.newLevel });
            }
          });
        }
        ui.decoDetailActions.appendChild(enhBtn);
      }

      // ?μ갑 踰꾪듉 ??鍮??щ’(null)???덉쓣 ?뚮쭔
      const emptySlotIdx = eqIds.indexOf(null);
      if (owned && !equipped && emptySlotIdx >= 0) {
        const equipBtn = document.createElement("button");
        equipBtn.className = "btn";
        equipBtn.textContent = t("ui.equip");
        equipBtn.addEventListener("click", () => {
          const slot = META.deco.equippedDecoIds.indexOf(null);
          if (slot >= 0) META.deco.equippedDecoIds[slot] = decoId;
          saveMeta(META);
          closeDecoDetail();
          renderDecoMenu();
        });
        ui.decoDetailActions.appendChild(equipBtn);
      }

      // ?댁젣 踰꾪듉 ???대떦 ?щ’??null濡?
      if (owned && equipped) {
        const unequipBtn = document.createElement("button");
        unequipBtn.className = "btn btn--ghost";
        unequipBtn.textContent = t("ui.unequip");
        unequipBtn.addEventListener("click", () => {
          const idx = META.deco.equippedDecoIds.indexOf(decoId);
          if (idx >= 0) META.deco.equippedDecoIds[idx] = null;
          saveMeta(META);
          closeDecoDetail();
          renderDecoMenu();
        });
        ui.decoDetailActions.appendChild(unequipBtn);
      }
    }
  }

  ui.decoDetailModal.classList.add("modal--open");
  ui.decoDetailModal.setAttribute("aria-hidden", "false");
}

function closeDecoDetail() {
  if (!ui.decoDetailModal) return;
  ui.decoDetailModal.classList.remove("modal--open");
  ui.decoDetailModal.setAttribute("aria-hidden", "true");
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   SCOREBOARD (?꾧킅?? CONTROLLER
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

const SB_ELEM_MAP = {
  fire:   { el: "sbFire",   val: "sbFireVal"   },
  light:  { el: "sbLight",  val: "sbLightVal"  },
  nature: { el: "sbNature", val: "sbNatureVal" },
  water:  { el: "sbWater",  val: "sbWaterVal"  },
};

/**
 * Render equipped decoration icons on the scoreboard.
 * Called on battle start and whenever decorations change.
 */
function sbRenderDecos() {
  if (!ui.sbDecos) return;
  ui.sbDecos.innerHTML = "";
  const decos = equippedDecoDefs();
  if (!decos.length) {
    ui.sbDecos.innerHTML = `<span style="font-size:10px;color:rgba(255,255,255,0.25);">${t("ui.noDecoration")}</span>`;
    return;
  }
  for (let i = 0; i < decos.length; i++) {
    const deco = decos[i];
    const lv = decoLevel(deco.id);
    const ld = decoLevelData(deco.id);
    const multType = ld ? ld.multType : "mult";
    const shortDesc = ld ? ld.shortDesc : "";
    const wrap = document.createElement("div");
    wrap.className = "sb__decoIcon";
    wrap.id = `sbDeco${i}`;
    wrap.title = `${decoNameI18n(deco)} Lv${lv}\n${shortDesc}`;
    if (deco.icon && deco.icon.includes("/")) {
      wrap.innerHTML = `<img src="${deco.icon}" alt="${escapeHtml(decoNameI18n(deco))}" /><span class="sb__decoIcon__multBadge sb__decoIcon__multBadge--${multType}">${multLabelI18n(multType)}</span>`;
    } else {
      wrap.innerHTML = `<span class="sb__decoEmoji">${deco.icon || decoNameI18n(deco).charAt(0)}</span><span class="sb__decoIcon__multBadge sb__decoIcon__multBadge--${multType}">${multLabelI18n(multType)}</span>`;
    }
    // ?곗튂 ???μ떇 ?곸꽭 ?앹뾽
    wrap.addEventListener("click", () => openDecoDetail(deco.id));
    wrap.style.cursor = "pointer";
    ui.sbDecos.appendChild(wrap);
  }
}

/**
 * Reset the scoreboard for a new spin.
 */
function sbReset() {
  // Reset element damages ??怨듦컙? ?좎??섍퀬 ?щ챸?섍쾶
  for (const key of Object.keys(SB_ELEM_MAP)) {
    const ref = SB_ELEM_MAP[key];
    if (ui[ref.el]) { ui[ref.el].classList.remove("sb__elem--visible", "sb__elem--explode", "sb__elem--bump"); }
    if (ui[ref.val]) ui[ref.val].textContent = "0";
  }
  // Reset sparkles
  if (ui.sbSparkles) ui.sbSparkles.innerHTML = "";
  // Reset combo
  if (ui.sbComboNum) {
    ui.sbComboNum.textContent = "0";
    ui.sbComboNum.classList.remove("sb__comboNum--bump");
  }
  // Reset deco icon states
  const decos = equippedDecoDefs();
  for (let i = 0; i < decos.length; i++) {
    const icon = document.getElementById(`sbDeco${i}`);
    if (icon) {
      icon.classList.remove("sb__decoIcon--active", "sb__decoIcon--dim", "sb__decoIcon--pending");
      // Remove any floating labels
      const old = icon.querySelector(".sb__decoTriggerLabel");
      if (old) old.remove();
    }
  }
  if (ui.scoreboard) ui.scoreboard.classList.remove("scoreboard--flash");
}

/**
 * Update per-element damage on scoreboard during checks.
 * @param {string} elementId - fire/light/nature/water
 * @param {number} totalDmg - cumulative damage for this element so far
 */
function sbSetElemDmg(elementId, totalDmg) {
  const ref = SB_ELEM_MAP[elementId];
  if (!ref) return;
  if (totalDmg > 0 && ui[ref.el]) {
    ui[ref.el].classList.add("sb__elem--visible");
  }
  if (ui[ref.val]) {
    const old = parseInt(ui[ref.val].textContent) || 0;
    ui[ref.val].textContent = String(totalDmg);
    if (totalDmg > old) {
      // Bump animation
      const el = ui[ref.el];
      if (el) {
        el.classList.remove("sb__elem--bump");
        void el.offsetWidth;
        el.classList.add("sb__elem--bump");
        setTimeout(() => el.classList.remove("sb__elem--bump"), 260);
      }
    }
  }
}

/**
 * Update combo count on scoreboard.
 */
function sbSetCombo(count) {
  if (!ui.sbComboNum) return;
  ui.sbComboNum.textContent = String(count);
  if (count > 0) {
    ui.sbComboNum.classList.remove("sb__comboNum--bump");
    void ui.sbComboNum.offsetWidth;
    ui.sbComboNum.classList.add("sb__comboNum--bump");
    setTimeout(() => ui.sbComboNum.classList.remove("sb__comboNum--bump"), 320);
  }
}

/**
 * Set all deco icons to pending state before trigger phase.
 */
function sbDecosStartTriggerPhase() {
  const decos = equippedDecoDefs();
  for (let i = 0; i < decos.length; i++) {
    const icon = document.getElementById(`sbDeco${i}`);
    if (icon) icon.classList.add("sb__decoIcon--pending");
  }
}

/**
 * Animate a single decoration trigger on the scoreboard.
 * @param {number} index - slot index (0-3)
 * @param {object} deco - decoration definition
 * @param {boolean} triggered - whether it triggered
 * @param {number} value - the multiplier value
 * @param {string} multType - "add" or "mult"
 * @param {number} currentMult - running multiplier after this deco
 */
async function sbAnimateDecoTrigger(index, deco, triggered, value, multType, currentMult) {
  const icon = document.getElementById(`sbDeco${index}`);
  if (!icon) return;

  icon.classList.remove("sb__decoIcon--pending");

  if (triggered) {
    // 1) ?꾩씠肄?鍮쏅궓 + ?붾뱾由?
    icon.classList.add("sb__decoIcon--active");

    // 2) 紐⑤뱺 ?쒖꽦 ?띿꽦 ?곕?吏 ?꾩뿉 諛곗쑉?쒓렇 ?쒖떆
    const labelText = multType === "add"
      ? `+${value.toFixed(2)}` : `x${value.toFixed(2)}`;
    for (const key of Object.keys(SB_ELEM_MAP)) {
      const ref = SB_ELEM_MAP[key];
      if (!ui[ref.el]) continue;
      const dmgVal = parseInt(ui[ref.val]?.textContent) || 0;
      if (dmgVal <= 0) continue;

      const elemContainer = ui[ref.el];
      const valSpan = ui[ref.val];
      // 諛곗쑉 ?덉씠釉붿? ?レ옄(valSpan) 湲곗? 媛?대뜲?뺣젹
      const oldLabel = valSpan.querySelector(".sb__decoTriggerLabel");
      if (oldLabel) oldLabel.remove();
      const label = document.createElement("span");
      label.className = `sb__decoTriggerLabel sb__decoTriggerLabel--${multType}`;
      label.textContent = labelText;
      valSpan.style.position = "relative";
      valSpan.appendChild(label);
      setTimeout(() => label.remove(), 750);

      // ?곕?吏 ?レ옄 ?移?
      elemContainer.classList.remove("sb__elem--pcPunch");
      void elemContainer.offsetWidth;
      elemContainer.classList.add("sb__elem--pcPunch");
      setTimeout(() => elemContainer.classList.remove("sb__elem--pcPunch"), 400);
    }

    // 3) ?ㅽ뙆???④낵
    sbSpawnSparkles(6);

    await sleep(320);
  } else {
    icon.classList.add("sb__decoIcon--dim");
    await sleep(120);
  }
}

/**
 * Spawn sparkle particles in the multiplier area.
 */
function sbSpawnSparkles(count) {
  if (!ui.sbSparkles) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "sb__sparkle";
    const x = 20 + Math.random() * 50;
    const y = 10 + Math.random() * 30;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--sx", `${(Math.random() - 0.5) * 30}px`);
    s.style.setProperty("--sy", `${(Math.random() - 0.5) * 20}px`);
    s.style.animationDelay = `${Math.random() * 0.15}s`;
    ui.sbSparkles.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }
}

/**
 * Animate a per-check decoration trigger ??諛쒕씪?몃줈 ?ㅽ???
 * 1) ?μ떇 ?꾩씠肄?wobble ?붾뱾由?+ 鍮쏅궓
 * 2) ?대떦 ?띿꽦 ?곕?吏 ?レ옄 ?꾩뿉 諛곗쑉 ?덉씠釉?(x1.5)
 * 3) ?곕?吏 ?レ옄 而ㅼ?硫댁꽌 ?⑤┝
 *
 * @param {object} trigger - { decoId, slotIdx, name, value, type, icon, elementId? }
 *   slotIdx is full 4-slot index (0-3, including null gaps)
 *   elementId: ?곹뼢諛쏅뒗 ?띿꽦 (checkMult?????대떦 泥댄겕??symbolId)
 */
function sbAnimatePerCheckDeco(trigger) {
  // ?? 1. ?μ떇 ?꾩씠肄?wobble ?붾뱾由?+ 鍮쏅궓 ??
  const packedIds = equippedDecoIdsPacked();
  const fullSlots = equippedDecoIds();
  const decoId = fullSlots[trigger.slotIdx];
  if (!decoId) return;
  const packedIdx = packedIds.indexOf(decoId);
  if (packedIdx < 0) return;

  const icon = document.getElementById(`sbDeco${packedIdx}`);
  if (icon) {
    icon.classList.remove("sb__decoIcon--pcFlash");
    void icon.offsetWidth;
    icon.classList.add("sb__decoIcon--pcFlash");
    setTimeout(() => icon.classList.remove("sb__decoIcon--pcFlash"), 600);
  }

  // ?? 2. ?대떦 ?띿꽦 ?곕?吏 ?レ옄 ?꾩뿉 諛곗쑉 ?덉씠釉???
  // chainMult(怨듬챸??嫄곗슱)??elementIds 諛곗뿴濡?紐⑤뱺 ?쒖꽦 ?띿꽦???쒖떆
  const elemIds = trigger.elementIds
    ? trigger.elementIds
    : trigger.elementId ? [trigger.elementId] : [];
  for (const elemId of elemIds) {
    const ref = SB_ELEM_MAP[elemId];
    if (ref && ui[ref.el]) {
      const elemContainer = ui[ref.el];
      const valSpan = ui[ref.val];
      // 湲곗〈 per-check ?덉씠釉??쒓굅 ???レ옄 span 湲곗? 媛?대뜲?뺣젹
      const oldLabel = valSpan.querySelector(".sb__pcMultLabel");
      if (oldLabel) oldLabel.remove();
      // ??諛곗쑉 ?덉씠釉??앹꽦
      const label = document.createElement("span");
      label.className = "sb__pcMultLabel";
      label.textContent = `x${trigger.value.toFixed(1)}`;
      valSpan.style.position = "relative"; // label absolute 湲곗?
      valSpan.appendChild(label);
      setTimeout(() => label.remove(), 750);

      // ?? 3. ?곕?吏 ?レ옄 而ㅼ?硫댁꽌 ?⑤┝ ??
      elemContainer.classList.remove("sb__elem--pcPunch");
      void elemContainer.offsetWidth;
      elemContainer.classList.add("sb__elem--pcPunch");
      setTimeout(() => elemContainer.classList.remove("sb__elem--pcPunch"), 400);
    }
  }

  // ?? 4. Mini sparkle burst ??
  sbSpawnSparkles(3);
}

/**
 * Animate the damage explosion: element damages multiply by finalMult.
 * @param {object} byElement - {fire, light, nature, water} final scaled damages
 * @param {number} finalMult - decoration multiplier
 */
async function sbExplodeDamages(byElement, finalMult) {
  if (finalMult <= 1.0) return;

  // Flash scoreboard
  if (ui.scoreboard) {
    ui.scoreboard.classList.remove("scoreboard--flash");
    void ui.scoreboard.offsetWidth;
    ui.scoreboard.classList.add("scoreboard--flash");
  }

  // Sparkle burst
  sbSpawnSparkles(8);

  // Update element damages to final values with explode animation
  for (const key of Object.keys(SB_ELEM_MAP)) {
    const ref = SB_ELEM_MAP[key];
    const val = byElement[key] || 0;
    if (val > 0 && ui[ref.el]) {
      ui[ref.val].textContent = String(val);
      ui[ref.el].classList.remove("sb__elem--explode");
      void ui[ref.el].offsetWidth;
      ui[ref.el].classList.add("sb__elem--explode");
    }
  }

  await sleep(500);
}

/**
 * Run the full decoration trigger animation sequence on the scoreboard.
 * Called after checks are done, before damage is applied.
 * @param {object} decoResult - from computeDecorationMultiplier()
 * @returns {Promise<void>}
 */
async function sbAnimateDecoSequence(decoResult, waitBeatFn) {
  // 怨좎젙 4?щ’ 湲곗??쇰줈 ?좊땲硫붿씠??
  // waitBeatFn: ?ㅽ? 泥댄겕? ?숈씪??鍮꾪듃 ?⑥닔 (媛??由щ벉 ?좎?)
  const fullSlots = equippedDecoIds(); // [null|id, ...]
  const activeCount = fullSlots.filter(Boolean).length;
  if (!activeCount) return;
  const beat = waitBeatFn || (() => sleep(300));

  // ?꾩옱 ?꾧킅??媛믪쓣 湲곕컲媛믪쑝濡?罹≪쿂 (泥댄겕 以??볦씤 ?곕?吏)
  const baseDmgs = {};
  for (const key of Object.keys(SB_ELEM_MAP)) {
    baseDmgs[key] = parseInt(ui[SB_ELEM_MAP[key].val]?.textContent) || 0;
  }

  // Set all to pending
  sbDecosStartTriggerPhase();
  await beat();

  // ??? 1李??⑥뒪: 醫뚢넂???쒖감 諛쒕룞 ???
  let currentMult = 1.0;
  const packedIds = equippedDecoIdsPacked();

  for (let pi = 0; pi < packedIds.length; pi++) {
    const id = packedIds[pi];
    const deco = DECO_BY_ID[id];
    if (!deco) continue;
    const trig = decoResult.triggered.find(t => t.id === id && !t.encore);
    const triggered = !!trig;
    const ld = decoLevelData(id);
    let multType = trig ? trig.type : (ld ? ld.multType : "mult");

    const icon = document.getElementById(`sbDeco${pi}`);
    if (!icon) continue;
    icon.classList.remove("sb__decoIcon--pending");

    if (triggered) {
      const value = trig.value;
      if (multType === "add") currentMult += value;
      else currentMult *= value;

      // ?? 1) ?꾩씠肄?鍮쏅궓 + ?붾뱾由?(fire-and-forget CSS) ??
      icon.classList.add("sb__decoIcon--active");

      // ?? 2) ?곕?吏 媛깆떊 癒쇱?, 諛곗쑉 ?덉씠釉??꾩뿉 ??
      // sbSetElemDmg媛 textContent瑜???뼱?곕?濡??덉씠釉붾낫??癒쇱? ?ㅽ뻾?댁빞 ??
      const labelText = multType === "add"
        ? `+${value.toFixed(2)}` : `x${value.toFixed(2)}`;
      for (const key of Object.keys(SB_ELEM_MAP)) {
        const ref = SB_ELEM_MAP[key];
        const base = baseDmgs[key];
        if (base <= 0) continue;

        // ?곕?吏 ?レ옄 媛깆떊 癒쇱? (textContent ??뼱?곌린)
        sbSetElemDmg(key, Math.floor(base * currentMult));

        // 諛곗쑉 ?덉씠釉?(?レ옄 ?? ???곕?吏 媛깆떊 ??異붽??댁빞 ?뚭눼 ????
        const valSpan = ui[ref.val];
        const oldLabel = valSpan.querySelector(".sb__decoTriggerLabel");
        if (oldLabel) oldLabel.remove();
        const label = document.createElement("span");
        label.className = `sb__decoTriggerLabel sb__decoTriggerLabel--${multType}`;
        label.textContent = labelText;
        valSpan.style.position = "relative";
        valSpan.appendChild(label);
        setTimeout(() => label.remove(), 750);
      }

      // ?? 3) ?ㅽ뙆????
      sbSpawnSparkles(6);
      // 諛쒕룞???μ떇留?鍮꾪듃 ?뚮퉬
      await beat();
    } else {
      // 誘몃컻?? 利됱떆 dim 泥섎━, 鍮꾪듃 ?뚮퉬 ?놁쓬
      icon.classList.add("sb__decoIcon--dim");
    }
  }

  // ??? 2李??⑥뒪: ?숈퐫瑜??щ컻??(醫뚢넂???ㅼ떆 ?쒖감) ???
  const encoreRetriggers = decoResult.triggered.filter(t => t.encore);
  if (encoreRetriggers.length > 0) {
    await beat();

    // 紐⑤뱺 ?꾩씠肄??ㅼ떆 pending ?곹깭濡?(?숈퐫瑜??쒖쇅)
    for (let pi = 0; pi < packedIds.length; pi++) {
      const id = packedIds[pi];
      const ld2 = decoLevelData(id);
      if (ld2 && ld2.conditionType === "encore") continue;
      const icon2 = document.getElementById(`sbDeco${pi}`);
      if (icon2) {
        icon2.classList.remove("sb__decoIcon--active", "sb__decoIcon--dim");
        icon2.classList.add("sb__decoIcon--pending");
      }
    }
    await beat();

    // ?щ컻???μ떇???щ’ ?쒖꽌?濡??좊땲硫붿씠??
    for (const rt of encoreRetriggers) {
      const pi = packedIds.indexOf(rt.id);
      if (pi < 0) continue;
      const deco2 = DECO_BY_ID[rt.id];
      if (!deco2) continue;
      const rtMultType = rt.type || "mult";

      if (rtMultType === "add") currentMult += rt.value;
      else currentMult *= rt.value;

      const icon2 = document.getElementById(`sbDeco${pi}`);
      if (icon2) {
        icon2.classList.remove("sb__decoIcon--pending", "sb__decoIcon--dim");
        icon2.classList.add("sb__decoIcon--active");
      }

      // ?곕?吏 媛깆떊 癒쇱?, 諛곗쑉 ?덉씠釉??꾩뿉
      const labelText2 = rtMultType === "add"
        ? `+${rt.value.toFixed(2)}` : `x${rt.value.toFixed(2)}`;
      for (const key of Object.keys(SB_ELEM_MAP)) {
        const ref = SB_ELEM_MAP[key];
        const base = baseDmgs[key];
        if (base <= 0) continue;
        sbSetElemDmg(key, Math.floor(base * currentMult));
        const valSpan = ui[ref.val];
        const oldLabel = valSpan.querySelector(".sb__decoTriggerLabel");
        if (oldLabel) oldLabel.remove();
        const label = document.createElement("span");
        label.className = `sb__decoTriggerLabel sb__decoTriggerLabel--${rtMultType}`;
        label.textContent = labelText2;
        valSpan.style.position = "relative";
        valSpan.appendChild(label);
        setTimeout(() => label.remove(), 750);
      }
      sbSpawnSparkles(6);
      await beat();
    }

    // ?щ컻???????μ떇? dim 泥섎━
    for (let pi = 0; pi < packedIds.length; pi++) {
      const id = packedIds[pi];
      const isRetriggered = encoreRetriggers.some(r => r.id === id);
      const ld2 = decoLevelData(id);
      if (ld2 && ld2.conditionType === "encore") continue;
      if (!isRetriggered) {
        const icon2 = document.getElementById(`sbDeco${pi}`);
        if (icon2) {
          icon2.classList.remove("sb__decoIcon--pending");
          icon2.classList.add("sb__decoIcon--dim");
        }
      }
    }
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   PET GRID / SLOTS / DETAIL POPUP
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function renderPetGrid() {
  if (!ui.petGrid) return;
  ui.petGrid.innerHTML = "";
  const eqIds = equippedPetIds();
  const ELEM_EMOJI = { fire: "\u{1F525}", water: "\u{1F4A7}", nature: "\u{1F33F}", light: "\u26A1", none: "" };

  // ?깃툒 ?믪? ???뺣젹 (SS > S > A > B > C)
  const GRADE_ORDER = { SS: 0, S: 1, A: 2, B: 3, C: 4 };
  const ownedPets = PETS.filter(p => petCopies(p.id) >= 1);
  ownedPets.sort((a, b) => (GRADE_ORDER[a.grade] ?? 9) - (GRADE_ORDER[b.grade] ?? 9));

  let totalCards = 0;
  for (const pet of ownedPets) {
    const copies = petCopies(pet.id);
    const enh = petEnhancement(pet.id);
    const isEquipped = eqIds.includes(pet.id);

    // 媛??щ낯留덈떎 媛쒕퀎 移대뱶 ?앹꽦
    for (let c = 0; c < copies; c++) {
      totalCards++;
      const isThisEquipped = isEquipped && c === 0; // 泥?踰덉㎏ 移대뱶?먮쭔 異쒖쟾 諭껋?

      const el = document.createElement("div");
      el.className = "petGridItem petGridItem--owned";
      if (isThisEquipped) el.classList.add("petGridItem--equipped");

      const gradeBadge = `<span class="petGridItem__grade petGridItem__grade--${pet.grade}">${pet.grade}</span>`;
      const eqBadge = isThisEquipped ? `<span class="petGridItem__eqBadge">${t("ui.petDeployed")}</span>` : "";
      const elemEmoji = ELEM_EMOJI[pet.element] || "";
      const enhText = enh > 0 ? `<span class="petGridItem__enhance">+${enh}</span>` : "";

      const iconSrc = pet.icon || "";
      const iconHtml = iconSrc
        ? `<img class="petGridItem__img" src="${iconSrc}" alt="${escapeHtml(petNameI18n(pet))}" />`
        : `<div class="petGridItem__imgPlaceholder">?</div>`;

      el.innerHTML = `${gradeBadge}${eqBadge}${iconHtml}<div class="petGridItem__name">${elemEmoji}${escapeHtml(petNameI18n(pet))}${enhText}</div>`;
      el.addEventListener("click", () => openPetDetail(pet.id));
      ui.petGrid.appendChild(el);
    }
  }

  if (totalCards === 0) {
    ui.petGrid.innerHTML = `<div class="petGrid__empty">${t("ui.petNone")}</div>`;
  }
}

function renderPetSlots() {
  const eqIds = equippedPetIds();
  for (let slot = 0; slot < 2; slot++) {
    const container = slot === 0 ? ui.petSlot0 : ui.petSlot1;
    if (!container) continue;
    const petId = eqIds[slot];
    const pet = petId ? PET_BY_ID[petId] : null;

    if (!pet) {
      container.className = "petSlot";
      container.innerHTML = `<div class="petSlot__empty">${t("ui.emptySlot")}</div>`;
    } else {
      const enh = petEnhancement(pet.id);
      container.className = "petSlot petSlot--filled";
      const iconSrc = pet.icon || "";
      const imgTag = iconSrc ? `<img class="petSlot__img" src="${iconSrc}" alt="${escapeHtml(petNameI18n(pet))}" />` : "";
      const enhStr = enh > 0 ? ` +${enh}` : "";
      container.innerHTML =
        `${imgTag}<div class="petSlot__info"><div class="petSlot__name">${escapeHtml(petNameI18n(pet))}${enhStr}</div>` +
        `<div class="petSlot__sub">${t("ui.petGradeSuffix", { grade: pet.grade })}</div></div>` +
        `<button class="petSlot__unequip" type="button">${t("ui.unequip")}</button>`;
      container.querySelector(".petSlot__unequip").addEventListener("click", (e) => {
        e.stopPropagation();
        META.pet.equippedPetIds = equippedPetIds().filter((id) => id !== pet.id);
        META.pet.equippedPetId = META.pet.equippedPetIds[0] || null;
        saveMeta(META);
        renderMainMenu();
        renderAll(false);
      });
      container.addEventListener("click", () => openPetDetail(pet.id));
    }
  }
}

function openPetDetail(petId) {
  const pet = PET_BY_ID[petId];
  if (!pet || !ui.petDetailModal) return;
  const owned = isPetOwned(petId);
  const enh = petEnhancement(petId);
  const copies = petCopies(petId);
  const maxEnh = PET_MAX_ENHANCE[pet.grade] || 0;
  const eqIds = equippedPetIds();
  const equipped = eqIds.includes(petId);
  const unlockedPassives = petUnlockedPassiveCount(petId);

  const ELEM_EMOJI = { fire: "\u{1F525}", water: "\u{1F4A7}", nature: "\u{1F33F}", light: "\u26A1", none: "" };
  // TAG_LABEL and STAT_LABEL replaced by tagLabelI18n() and statLabelI18n()

  // Header icon
  const iconWrap = document.getElementById("petDetailIconWrap");
  if (iconWrap) {
    const iconSrc = pet.icon || "";
    iconWrap.innerHTML = iconSrc
      ? `<img src="${iconSrc}" alt="${escapeHtml(petNameI18n(pet))}" />`
      : `<div style="width:72px;height:72px;border-radius:14px;background:rgba(60,42,28,0.1);display:flex;align-items:center;justify-content:center;font-size:28px">?</div>`;
  }

  // Badges
  const gradeEl = document.getElementById("petDetailGrade");
  if (gradeEl) { gradeEl.textContent = pet.grade; gradeEl.className = `petDetail__grade petDetail__grade--${pet.grade}`; }
  const elemEl = document.getElementById("petDetailElement");
  if (elemEl) elemEl.textContent = ELEM_EMOJI[pet.element] || "";
  const tagEl = document.getElementById("petDetailTag");
  if (tagEl) tagEl.textContent = tagLabelI18n(pet.tag);

  // Name + enhance
  const nameEl = document.getElementById("petDetailName");
  if (nameEl) nameEl.textContent = petNameI18n(pet);
  const enhEl = document.getElementById("petDetailEnhance");
  if (enhEl) {
    if (!owned) enhEl.textContent = t("ui.notOwned");
    else if (maxEnh === 0) enhEl.textContent = t("ui.enhImpossible");
    else enhEl.textContent = `+${enh} / ${maxEnh}`;
  }

  // Stats
  const statsEl = document.getElementById("petDetailStats");
  if (statsEl) {
    const s1 = statLabelI18n(pet.stat1);
    const s2 = statLabelI18n(pet.stat2);
    statsEl.innerHTML = `<div class="petDetail__statItem">${t("ui.statLine", { num: 1 })} <span>${s1}</span></div><div class="petDetail__statItem">${t("ui.statLine", { num: 2 })} <span>${s2}</span></div>`;
  }

  // Active skill
  const activeNameEl = document.getElementById("petDetailActiveName");
  if (activeNameEl) activeNameEl.textContent = petActiveNameI18n(pet);
  const cdEl = document.getElementById("petDetailCd");
  if (cdEl) cdEl.textContent = `CD ${pet.cooldown}`;
  const activeDescEl = document.getElementById("petDetailActiveDesc");
  if (activeDescEl) activeDescEl.textContent = petActiveDescI18n(pet);

  // Passives
  const passivesEl = document.getElementById("petDetailPassives");
  if (passivesEl) {
    passivesEl.innerHTML = "";
    const passiveTexts = [petPassiveI18n(pet, 1), petPassiveI18n(pet, 2), petPassiveI18n(pet, 3), petPassiveI18n(pet, 4)];
    for (let i = 0; i < 4; i++) {
      const text = passiveTexts[i];
      if (!text) continue;
      const isUnlocked = (i + 1) <= unlockedPassives;
      const row = document.createElement("div");
      row.className = `petDetail__passiveRow ${isUnlocked ? "petDetail__passiveRow--unlocked" : "petDetail__passiveRow--locked"}`;

      let lockInfo = "";
      if (!isUnlocked) {
        const basePassives = PET_PASSIVES_AT_0[pet.grade] || 0;
        const neededEnh = (i + 1) - basePassives;
        if (neededEnh > maxEnh) lockInfo = `<span class="petDetail__passiveLock">${t("ui.unlockImpossible")}</span>`;
        else lockInfo = `<span class="petDetail__passiveLock">${t("ui.unlockAt", { enh: neededEnh })}</span>`;
      }

      row.innerHTML = `<div class="petDetail__passiveIdx">${i + 1}</div><div class="petDetail__passiveText">${escapeHtml(text)}</div>${lockInfo}`;
      passivesEl.appendChild(row);
    }
    if (passivesEl.children.length === 0) {
      passivesEl.innerHTML = `<div style="font-size:12px;color:var(--muted)">${t("ui.passiveNone")}</div>`;
    }
  }

  // Enhancement bar
  const enhLabelEl = document.getElementById("petDetailEnhanceLabel");
  if (enhLabelEl) {
    if (!owned) enhLabelEl.textContent = t("ui.notOwned");
    else if (maxEnh === 0) enhLabelEl.textContent = t("ui.enhBarNoEnh", { copies });
    else enhLabelEl.textContent = t("ui.enhBar", { enh, max: maxEnh, copies });
  }
  const enhFillEl = document.getElementById("petDetailEnhanceFill");
  if (enhFillEl) {
    const pct = maxEnh > 0 ? Math.min(100, (enh / maxEnh) * 100) : 0;
    enhFillEl.style.width = `${pct}%`;
  }

  // Actions
  const actionsEl = document.getElementById("petDetailActions");
  if (actionsEl) {
    actionsEl.innerHTML = "";

    // Equip / Unequip
    if (owned) {
      const eqBtn = document.createElement("button");
      eqBtn.className = equipped ? "btn btn--ghost" : "btn";
      eqBtn.type = "button";
      eqBtn.textContent = equipped ? t("ui.unequip") : t("ui.equip");
      if (!equipped && eqIds.length >= 2) eqBtn.disabled = true;
      eqBtn.addEventListener("click", () => {
        const cur = equippedPetIds();
        if (cur.includes(petId)) {
          META.pet.equippedPetIds = cur.filter((id) => id !== petId);
        } else {
          if (cur.length >= 2) return;
          META.pet.equippedPetIds = [...cur, petId];
        }
        META.pet.equippedPetId = META.pet.equippedPetIds[0] || null;
        saveMeta(META);
        renderMainMenu();
        renderAll(false);
        openPetDetail(petId);
      });
      actionsEl.appendChild(eqBtn);
    }

    // Enhance button (needs copies >= 2, enhancement < maxEnhance)
    if (owned && enh < maxEnh) {
      const enhBtn = document.createElement("button");
      enhBtn.className = "btn";
      enhBtn.type = "button";
      enhBtn.textContent = t("ui.enhCopiesBtn");
      enhBtn.disabled = copies < 2;
      enhBtn.addEventListener("click", () => {
        const result = enhancePet(petId);
        if (result.ok) {
          saveMeta(META);
          renderMainMenu();
          renderAll(false);
          openPetDetail(petId);
        }
      });
      actionsEl.appendChild(enhBtn);
    }
  }

  ui.petDetailModal.classList.add("modal--open");
  ui.petDetailModal.setAttribute("aria-hidden", "false");
}

function closePetDetail() {
  if (!ui.petDetailModal) return;
  ui.petDetailModal.classList.remove("modal--open");
  ui.petDetailModal.setAttribute("aria-hidden", "true");
}

function isPetDetailOpen() {
  return ui.petDetailModal && ui.petDetailModal.classList.contains("modal--open");
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   SYNTHESIS UI
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

let synthGrade = "C";
let synthSelected = [];

function renderSynthesisUI() {
  const container = document.getElementById("petSynthesis");
  if (!container) return;
  const slotsEl = document.getElementById("synthesisSlots");
  const resultEl = document.getElementById("synthesisResult");
  const btnEl = document.getElementById("synthesisBtn");
  if (!slotsEl) return;

  const cost = PET_SYNTHESIS_COST[synthGrade] || 4;
  const targetGrades = { C: "B", B: "A", A: "S" };
  const targetGrade = targetGrades[synthGrade];

  const eqIds = equippedPetIds();
  const maxEnh = PET_MAX_ENHANCE[synthGrade] || 0;
  const available = [];
  for (const pid of (PET_IDS_BY_GRADE[synthGrade] || [])) {
    const cp = petCopies(pid);
    if (cp < 1) continue;
    // 理쒕? 媛뺥솕 ?ъ꽦???ル쭔 ?⑹꽦 媛??
    const enh = petEnhancement(pid);
    if (enh < maxEnh) continue;
    const eqCount = eqIds.filter(e => e === pid).length;
    const usable = cp - eqCount;
    if (usable > 0) available.push({ id: pid, pet: PET_BY_ID[pid], usable });
  }

  synthSelected = synthSelected.filter(sid => {
    const a = available.find(x => x.id === sid);
    return a && a.usable > 0;
  });

  slotsEl.innerHTML = "";

  let pickerHtml = `<div class="petSynthesis__picker">`;
  for (const a of available) {
    const selectedCount = synthSelected.filter(s => s === a.id).length;
    pickerHtml += `<div class="petSynthesis__pickItem${selectedCount > 0 ? " petSynthesis__pickItem--selected" : ""}" data-pid="${a.id}">`;
    pickerHtml += a.pet.icon ? `<img src="${a.pet.icon}" alt="${escapeHtml(petNameI18n(a.pet))}" />` : `<div style="width:36px;height:36px;border-radius:8px;background:rgba(60,42,28,0.1);display:flex;align-items:center;justify-content:center">?</div>`;
    pickerHtml += `<div class="petSynthesis__pickName">${escapeHtml(petNameI18n(a.pet))}</div>`;
    pickerHtml += `<div class="petSynthesis__pickCount">${selectedCount} / ${a.usable}</div>`;
    pickerHtml += `</div>`;
  }
  pickerHtml += `</div>`;

  if (available.length > 0) {
    slotsEl.innerHTML = pickerHtml;
    slotsEl.querySelectorAll(".petSynthesis__pickItem").forEach(el => {
      el.addEventListener("click", () => {
        const pid = el.dataset.pid;
        const a = available.find(x => x.id === pid);
        if (!a) return;
        const selectedCount = synthSelected.filter(s => s === pid).length;
        if (synthSelected.length >= cost) {
          if (selectedCount > 0) {
            const idx = synthSelected.indexOf(pid);
            if (idx >= 0) synthSelected.splice(idx, 1);
          }
        } else {
          if (selectedCount < a.usable) {
            synthSelected.push(pid);
          } else if (selectedCount > 0) {
            const idx = synthSelected.indexOf(pid);
            if (idx >= 0) synthSelected.splice(idx, 1);
          }
        }
        renderSynthesisUI();
      });
    });
  } else {
    const enhReq = maxEnh > 0 ? t("ui.enhRequired", { enh: maxEnh }) : "";
    slotsEl.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:12px;text-align:center">${t("ui.synthNoMat2", { grade: synthGrade, req: enhReq })}</div>`;
  }

  if (resultEl) {
    resultEl.textContent = t("ui.synthResult", { count: synthSelected.length, cost, target: targetGrade, food: PET_FOOD_PER_SYNTHESIS[targetGrade] || 0 });
  }

  if (btnEl) {
    btnEl.disabled = synthSelected.length < cost;
    btnEl.textContent = synthSelected.length >= cost ? t("ui.synthDo", { from: synthGrade, to: targetGrade }) : t("ui.synthNeed", { cost });
  }
}

function doSynthesis() {
  const cost = PET_SYNTHESIS_COST[synthGrade] || 4;
  if (synthSelected.length < cost) return;
  const petIds = synthSelected.slice(0, cost);
  const result = synthesizePets(petIds, synthGrade);
  if (!result.ok) return;

  synthSelected = [];
  saveMeta(META);
  renderMainMenu();
  renderAll(false);

  const resultEl = document.getElementById("synthesisResult");
  if (resultEl) {
    resultEl.textContent = t("ui.synthSuccess", { name: petNameI18n(result.pet), grade: result.pet.grade, food: result.food });
    resultEl.style.color = "#ffc83c";
    setTimeout(() => { resultEl.style.color = ""; }, 3000);
  }
  renderSynthesisUI();
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   CRAFT UI (SS)
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function renderCraftUI() {
  const listEl = document.getElementById("craftList");
  if (!listEl) return;
  listEl.innerHTML = "";

  const ssPets = PETS.filter(p => p.grade === "SS" && p.craftMaterials);
  for (const ss of ssPets) {
    const mats = parseCraftMaterials(ss.craftMaterials);
    let canCraft = true;
    let matsHtml = "";
    for (const mat of mats) {
      const have = mat.id ? petCopies(mat.id) : 0;
      const ok = have >= mat.need;
      if (!ok) canCraft = false;
      const cls = ok ? "petCraft__matOk" : "petCraft__matMissing";
      matsHtml += `<span class="${cls}">${escapeHtml(mat.id && PET_BY_ID[mat.id] ? petNameI18n(PET_BY_ID[mat.id]) : mat.name)} ${have}/${mat.need}</span> `;
    }

    const item = document.createElement("div");
    item.className = "petCraft__item";
    const iconHtml = ss.icon ? `<img class="petCraft__icon" src="${ss.icon}" alt="${escapeHtml(petNameI18n(ss))}" />` : `<div class="petCraft__icon" style="background:rgba(60,42,28,0.1);display:flex;align-items:center;justify-content:center">?</div>`;
    item.innerHTML = `${iconHtml}<div class="petCraft__info"><div class="petCraft__name">${escapeHtml(petNameI18n(ss))}</div><div class="petCraft__mats">${matsHtml}</div></div>`;

    const btn = document.createElement("button");
    btn.className = "petCraft__btn";
    btn.type = "button";
    btn.textContent = t("ui.craftBtn");
    btn.disabled = !canCraft || isPetOwned(ss.id);
    if (isPetOwned(ss.id)) btn.textContent = t("ui.craftOwned");
    btn.addEventListener("click", () => {
      const result = craftSSPet(ss.id);
      if (result.ok) {
        saveMeta(META);
        renderMainMenu();
        renderAll(false);
        renderCraftUI();
        openPetDetail(ss.id);
      }
    });
    item.appendChild(btn);
    listEl.appendChild(item);
  }
}

function parseCraftMaterials(str) {
  if (!str) return [];
  return str.split("&").map(s => s.trim()).filter(Boolean).map(part => {
    const plusMatch = part.match(/^(.+?)(\+{1,3})$/);
    let name, need;
    if (plusMatch) {
      name = plusMatch[1].trim();
      need = plusMatch[2].length;
    } else {
      name = part.trim();
      need = 1;
    }
    const pet = PETS.find(p => p.name === name);
    return { name, need, id: pet ? pet.id : null };
  });
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   PET SHOP (援먰솚??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

function renderPetShop() {
  const listEl = document.getElementById("petShopList");
  if (!listEl) return;
  listEl.innerHTML = "";

  const sPets = PETS.filter(p => p.grade === "S");
  const food = META.pet ? META.pet.petFood || 0 : 0;

  // ?ル㉨???붿븸 ?쒖떆 ?낅뜲?댄듃
  const foodEl = document.getElementById("petFoodText2");
  if (foodEl) foodEl.textContent = food;

  for (const pet of sPets) {
    const item = document.createElement("div");
    item.className = "petShop__item";
    const iconHtml = pet.icon ? `<img class="petShop__icon" src="${pet.icon}" alt="${escapeHtml(petNameI18n(pet))}" />` : `<div class="petShop__icon" style="background:rgba(60,42,28,0.1);display:flex;align-items:center;justify-content:center">?</div>`;
    item.innerHTML = `${iconHtml}<div class="petShop__info"><div class="petShop__name">${escapeHtml(petNameI18n(pet))}</div><div class="petShop__price">${t("ui.shopPrice", { cost: PET_SHOP_COST })}</div></div>`;

    const btn = document.createElement("button");
    btn.className = "petShop__btn";
    btn.type = "button";
    btn.textContent = t("ui.petBuyBtn");
    btn.disabled = food < PET_SHOP_COST;
    btn.addEventListener("click", () => {
      const result = buyPetFromShop(pet.id);
      if (result.ok) {
        saveMeta(META);
        renderMainMenu();
        renderAll(false);
        renderPetShop();
      }
    });
    item.appendChild(btn);
    listEl.appendChild(item);
  }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
//   EQUIPMENT SYSTEM (?λ퉬 ?쒖뒪??
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

// ?? Helper Functions ??

/** 蹂댁쑀 ?λ퉬??理쒓퀬 ?깃툒 踰덊샇瑜?諛섑솚 (誘몃낫????0) */
function equipGrade(rootId) {
  if (!META.equip || !META.equip.inventory) return 0;
  const entry = META.equip.inventory[rootId];
  if (!entry || !entry.grades) return 0;
  const gradeNums = Object.keys(entry.grades).map(Number).filter(g => entry.grades[g] > 0);
  return gradeNums.length > 0 ? Math.max(...gradeNums) : 0;
}

function equippedGrade(slotIdx) {
  if (!META.equip) return 0;
  const grades = Array.isArray(META.equip.equippedGrades) ? META.equip.equippedGrades : [];
  return Math.max(0, Math.floor(Number(grades[slotIdx]) || 0));
}

/** 蹂댁쑀 ?λ퉬???꾩껜 ?섎웾 ?⑷퀎瑜?諛섑솚 (誘몃낫????0) */
function equipCount(rootId) {
  if (!META.equip || !META.equip.inventory) return 0;
  const entry = META.equip.inventory[rootId];
  if (!entry || !entry.grades) return 0;
  return Object.values(entry.grades).reduce((sum, c) => sum + (c || 0), 0);
}

/** ?뱀젙 ?깃툒???섎웾??諛섑솚 */
function equipCountAtGrade(rootId, grade) {
  if (!META.equip || !META.equip.inventory) return 0;
  const entry = META.equip.inventory[rootId];
  if (!entry || !entry.grades) return 0;
  return entry.grades[grade] || 0;
}

/** ?깃툒蹂??섎웾 留?諛섑솚 (蹂듭궗蹂? */
function equipGradeBreakdown(rootId) {
  if (!META.equip || !META.equip.inventory) return {};
  const entry = META.equip.inventory[rootId];
  if (!entry || !entry.grades) return {};
  const result = {};
  for (const [g, c] of Object.entries(entry.grades)) {
    if (c > 0) result[Number(g)] = c;
  }
  return result;
}

/** ?λ퉬瑜?蹂댁쑀 以묒씤吏 ?щ? */
function isEquipOwned(rootId) {
  return equipCount(rootId) >= 1;
}

/** ?몃깽?좊━ ?뷀듃由ъ뿉??鍮??깃툒 ?뺣━, ?꾩쟾??鍮꾨㈃ ??젣 */
function cleanEquipEntry(rootId) {
  const entry = META.equip.inventory[rootId];
  if (!entry || !entry.grades) return;
  for (const g of Object.keys(entry.grades)) {
    if (entry.grades[g] <= 0) delete entry.grades[g];
  }
  if (Object.keys(entry.grades).length === 0) {
    delete META.equip.inventory[rootId];
    // ?μ갑 ?댁젣
    for (let i = 0; i < EQUIP_MAX_SLOTS; i++) {
      if (String(META.equip.equippedIds[i]) === String(rootId)) {
        META.equip.equippedIds[i] = null;
        if (Array.isArray(META.equip.equippedGrades)) META.equip.equippedGrades[i] = 0;
      }
    }
  }
}

/** ?깃툒 踰덊샇 ???깃툒 ?쇰꺼 (C, B, A, S, S1, ...) */
function equipGradeLabel(gradeNum) {
  return EQUIP_GRADE_MAP[gradeNum] || "";
}

/** ?깃툒 踰덊샇??????몃씪???ㅽ???(諭껋? 諛곌꼍?? */
function equipGradeStyle(gradeNum) {
  const color = EQUIP_GRADE_COLORS[gradeNum] || "#888";
  return `background:${color};color:#fff;`;
}

// ?? Gacha Functions ??

/** ?λ퉬 ?④굔 戮묎린 (Tier 1留???? */
function equipDrawOnce() {
  if (META.gold < EQUIP_GACHA_COST) return null;
  META.gold -= EQUIP_GACHA_COST;

  const totalTier = EQUIP_TIER_RATES.reduce((a, b) => a + b.w, 0);
  const drawnTier = weightedPick(EQUIP_TIER_RATES, totalTier).tier;

  // ?깃툒 寃곗젙 (媛以묒튂 湲곕컲)
  const total = EQUIP_GRADE_RATES.reduce((a, b) => a + b.w, 0);
  const drawn = weightedPick(EQUIP_GRADE_RATES, total);
  const drawnGradeLabel = drawn.grade;
  const drawnGradeNum = EQUIP_GRADE_NUM[drawnGradeLabel] || 1;

  const pool = EQUIP_IDS_BY_TIER[drawnTier] || EQUIP_IDS_BY_TIER[1] || [];
  const rootId = pool.length ? pickOne(pool) : EQUIPMENT[0].rootId;
  const equip = EQUIP_BY_ROOT[rootId];

  if (!META.equip.inventory) META.equip.inventory = {};
  const existing = META.equip.inventory[rootId];
  let isNew = false;

  if (!existing) {
    // 泥??띾뱷: ?대떦 ?깃툒??1媛?
    META.equip.inventory[rootId] = { grades: { [drawnGradeNum]: 1 } };
    isNew = true;
  } else {
    // ?대? 蹂댁쑀: ?대떦 ?깃툒 ?섎웾 利앷? (?깃툒蹂??낅┰ 異붿쟻)
    if (!existing.grades) existing.grades = {};
    existing.grades[drawnGradeNum] = (existing.grades[drawnGradeNum] || 0) + 1;
  }

  saveMeta(META);
  return {
    grade: drawnGradeLabel,
    equip: equip,
    isNew: isNew,
    count: equipCount(rootId),
  };
}

/** ?λ퉬 N嫄?戮묎린 */
function equipDrawMany(n) {
  const count = Math.max(1, Math.floor(n || 1));
  const out = [];
  for (let i = 0; i < count; i++) {
    const one = equipDrawOnce();
    if (!one) break;
    out.push(one);
  }
  return out;
}

// ?? Equip / Unequip ??

const AUTO_EQUIP_AXIS_PRIORITY = { 2: 3, 1: 2, 3: 1 };

function compareAutoEquipCandidate(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  if (a.grade !== b.grade) return b.grade - a.grade;
  const aAxis = AUTO_EQUIP_AXIS_PRIORITY[a.axis] || 0;
  const bAxis = AUTO_EQUIP_AXIS_PRIORITY[b.axis] || 0;
  if (aAxis !== bAxis) return bAxis - aAxis;
  if ((a.tier || 1) !== (b.tier || 1)) return (b.tier || 1) - (a.tier || 1);
  return Number(a.rootId) - Number(b.rootId);
}

function pickBestOwnedEquipForSlot(equipmentType) {
  let best = null;
  for (const equip of EQUIPMENT) {
    if (!equip || equip.equipmentType !== equipmentType) continue;
    const grade = equipGrade(equip.rootId);
    if (grade <= 0) continue;
    const candidate = {
      rootId: equip.rootId,
      grade,
      axis: equip.axis,
      tier: equip.tier || 1,
    };
    if (!best || compareAutoEquipCandidate(best, candidate) > 0) best = candidate;
  }
  return best;
}

function autoEquipBestOwned(forceSave = true) {
  if (!META.equip) return false;
  if (!Array.isArray(META.equip.equippedIds)) META.equip.equippedIds = [null, null, null, null, null, null];
  if (!Array.isArray(META.equip.equippedGrades)) META.equip.equippedGrades = [0, 0, 0, 0, 0, 0];

  let changed = false;
  for (let partType = 1; partType <= EQUIP_MAX_SLOTS; partType++) {
    const slotIdx = partType - 1;
    const best = pickBestOwnedEquipForSlot(partType);
    const nextId = best ? best.rootId : null;
    const nextGrade = best ? best.grade : 0;
    if (String(META.equip.equippedIds[slotIdx] || "") !== String(nextId || "") ||
        Number(META.equip.equippedGrades[slotIdx] || 0) !== nextGrade) {
      META.equip.equippedIds[slotIdx] = nextId;
      META.equip.equippedGrades[slotIdx] = nextGrade;
      changed = true;
    }
  }

  if (changed && forceSave) saveMeta(META);
  return changed;
}

/** ?λ퉬 ?μ갑 (遺???щ’???먮룞 諛곗튂) */
function equipEquipment(rootId) {
  const equip = EQUIP_BY_ROOT[rootId];
  if (!equip) return;
  if (!isEquipOwned(rootId)) return;

  const slotIdx = equip.equipmentType - 1;
  if (slotIdx < 0 || slotIdx >= EQUIP_MAX_SLOTS) return;

  if (!Array.isArray(META.equip.equippedGrades)) META.equip.equippedGrades = [0, 0, 0, 0, 0, 0];
  META.equip.equippedIds[slotIdx] = rootId;
  META.equip.equippedGrades[slotIdx] = equipGrade(rootId);
  saveMeta(META);
  renderEquipMenu();
}

/** ?λ퉬 ?댁젣 */
function unequipEquipment(slotIdx) {
  if (slotIdx < 0 || slotIdx >= EQUIP_MAX_SLOTS) return;
  META.equip.equippedIds[slotIdx] = null;
  if (Array.isArray(META.equip.equippedGrades)) META.equip.equippedGrades[slotIdx] = 0;
  saveMeta(META);
  renderEquipMenu();
}

// ?? Merge (?⑹꽦) ??

/** ?뱀젙 ?깃툒?먯꽌 ?곸슜 媛?ν븳 癒몄? 洹쒖튃??諛섑솚 */
function getEquipMergeRule(rootId, grade) {
  const equip = EQUIP_BY_ROOT[rootId];
  if (!equip) return null;
  if (!grade) grade = equipGrade(rootId);
  if (grade <= 0) return null;

  return EQUIP_MERGE_RULES.find(r =>
    r.tier === equip.tier && r.fromGrade === grade
  ) || null;
}

function nextMergeEquipmentResult(rootId, grade) {
  const equip = EQUIP_BY_ROOT[rootId];
  if (!equip) return null;
  if (equip.tier === 1 && grade >= 10) {
    const starRootId = Number(rootId) + 10000;
    const starEquip = EQUIP_BY_ROOT[starRootId];
    if (starEquip && starEquip.equipmentType === equip.equipmentType && starEquip.axis === equip.axis) {
      return { rootId: starRootId, grade: 4 };
    }
  }
  return { rootId, grade: grade + 1 };
}

/**
 * ?꾩떆 ?몃깽?좊━瑜?grades 湲곕컲?쇰줈 源딆? 蹂듭궗.
 * 諛섑솚: { rootId: { grades: { gradeNum: count } } }
 */
function _cloneGradesInventory() {
  const tempInv = {};
  for (const [rid, entry] of Object.entries(META.equip.inventory || {})) {
    if (!entry.grades) continue;
    const g = {};
    for (const [gk, gc] of Object.entries(entry.grades)) {
      if (gc > 0) g[Number(gk)] = gc;
    }
    if (Object.keys(g).length > 0) tempInv[rid] = { grades: g };
  }
  return tempInv;
}

/**
 * ?꾩떆 ?몃깽?좊━?먯꽌 議곌굔??留욌뒗 ?щ즺 1媛쒕? 李얠븘 李④컧.
 * @returns {{ rootId, name, grade }} | null
 */
function _findOneMaterial(tempInv, mat, targetEquip, targetRootId) {
  for (const [rid, entry] of Object.entries(tempInv)) {
    const candidateEquip = EQUIP_BY_ROOT[rid];
    if (!candidateEquip) continue;

    let matches = false;
    switch (mat.type) {
      case 1: matches = (rid === String(targetRootId)); break;
      case 2: matches = (candidateEquip.equipmentType === targetEquip.equipmentType); break;
      case 3: matches = (candidateEquip.tier === targetEquip.tier &&
                         candidateEquip.equipmentType === targetEquip.equipmentType); break;
    }
    if (!matches) continue;

    // grades?먯꽌 ?붽뎄 ?깃툒 ?댁긽??寃껋쓣 李얜릺, ??? ?깃툒遺???곗꽑 ?뚮え
    const sortedGrades = Object.keys(entry.grades).map(Number).filter(g => g >= mat.grade && entry.grades[g] > 0).sort((a, b) => a - b);
    if (sortedGrades.length === 0) continue;

    const useGrade = sortedGrades[0];
    entry.grades[useGrade] -= 1;
    if (entry.grades[useGrade] <= 0) delete entry.grades[useGrade];
    if (Object.keys(entry.grades).length === 0) delete tempInv[rid];

    return { rootId: rid, name: candidateEquip.name, grade: useGrade };
  }
  return null;
}

/** 癒몄????꾩슂???щ즺瑜??몃깽?좊━?먯꽌 ?먯깋 (?깃툒蹂??낅┰ 異붿쟻) */
function findMergeMaterials(targetRootId, targetGrade, rule) {
  if (!rule || !rule.materials) return { canMerge: false, materialsNeeded: [], materialsAvailable: [] };

  const targetEquip = EQUIP_BY_ROOT[targetRootId];
  if (!targetEquip) return { canMerge: false, materialsNeeded: [], materialsAvailable: [] };

  // ????깃툒??1媛??댁긽 ?덈뒗吏 ?뺤씤
  if (equipCountAtGrade(targetRootId, targetGrade) < 1) {
    return { canMerge: false, materialsNeeded: [], materialsAvailable: [] };
  }

  const materialsNeeded = [];
  const materialsAvailable = [];
  let canMerge = true;

  // ?꾩떆 ?몃깽?좊━ (grades 湲곕컲 源딆? 蹂듭궗)
  const tempInv = _cloneGradesInventory();

  // ????λ퉬 1媛쒕? 誘몃━ 李④컧 (?寃잛? ?щ즺濡??ъ슜 諛⑹?)
  if (tempInv[targetRootId] && tempInv[targetRootId].grades[targetGrade]) {
    tempInv[targetRootId].grades[targetGrade] -= 1;
    if (tempInv[targetRootId].grades[targetGrade] <= 0) {
      delete tempInv[targetRootId].grades[targetGrade];
    }
    if (Object.keys(tempInv[targetRootId].grades).length === 0) {
      delete tempInv[targetRootId];
    }
  }

  for (const mat of rule.materials) {
    const needed = { type: mat.type, grade: mat.grade, label: MERGE_TYPE_LABELS[mat.type] || "", gradeLabel: equipGradeLabel(mat.grade) };
    materialsNeeded.push(needed);

    const found = _findOneMaterial(tempInv, mat, targetEquip, targetRootId);
    materialsAvailable.push(found);
    if (!found) canMerge = false;
  }

  return { canMerge, materialsNeeded, materialsAvailable };
}

/** ?λ퉬 ?⑹꽦 ?ㅽ뻾 (?뱀젙 ?깃툒??1?④퀎 ?낃렇?덉씠?? */
function mergeEquipment(targetRootId, targetGrade) {
  if (!targetGrade) targetGrade = equipGrade(targetRootId);
  const rule = getEquipMergeRule(targetRootId, targetGrade);
  if (!rule) return { ok: false, reason: t("dl.noMergeRule") };

  const result = findMergeMaterials(targetRootId, targetGrade, rule);
  if (!result.canMerge) return { ok: false, reason: t("dl.noMergeMat") };

  const targetEquip = EQUIP_BY_ROOT[targetRootId];
  const nextResult = nextMergeEquipmentResult(targetRootId, targetGrade);
  if (!targetEquip || !nextResult) return { ok: false, reason: t("dl.noMergeRule") };

  // ?꾩떆 ?몃깽?좊━濡??뚮퉬???щ즺 紐⑸줉 寃곗젙
  const tempInv = _cloneGradesInventory();
  // ?寃?1媛??덉빟
  tempInv[targetRootId].grades[targetGrade] -= 1;
  if (tempInv[targetRootId].grades[targetGrade] <= 0) delete tempInv[targetRootId].grades[targetGrade];
  if (Object.keys(tempInv[targetRootId].grades || {}).length === 0) delete tempInv[targetRootId];

  const consumeList = []; // { rootId, grade }
  for (const mat of rule.materials) {
    const found = _findOneMaterial(tempInv, mat, targetEquip, targetRootId);
    if (found) consumeList.push({ rootId: found.rootId, grade: found.grade });
  }

  // ?ㅼ젣 ?뚮퉬: ?寃??깃툒?먯꽌 1媛??쒓굅
  const targetEntry = META.equip.inventory[targetRootId];
  if (targetEntry && targetEntry.grades) {
    targetEntry.grades[targetGrade] = (targetEntry.grades[targetGrade] || 0) - 1;
  }

  // ?ㅼ젣 ?뚮퉬: ?щ즺??
  for (const { rootId: rid, grade: g } of consumeList) {
    const entry = META.equip.inventory[rid];
    if (!entry || !entry.grades) continue;
    entry.grades[g] = (entry.grades[g] || 0) - 1;
  }

  // ?앹궛: ?寃??ㅼ쓬 ?깃툒??1媛?異붽?
  const newRootId = nextResult.rootId;
  const newGrade = nextResult.grade;
  if (!META.equip.inventory[newRootId]) META.equip.inventory[newRootId] = { grades: {} };
  if (!META.equip.inventory[newRootId].grades) META.equip.inventory[newRootId].grades = {};
  META.equip.inventory[newRootId].grades[newGrade] = (META.equip.inventory[newRootId].grades[newGrade] || 0) + 1;

  // ?뺣━: 鍮??깃툒 ?쒓굅
  cleanEquipEntry(targetRootId);
  for (const { rootId: rid } of consumeList) {
    if (rid !== String(targetRootId)) cleanEquipEntry(rid);
  }

  saveMeta(META);
  return {
    ok: true,
    newRootId: newRootId,
    newGrade: newGrade,
    newGradeLabel: equipGradeLabel(newGrade),
  };
}

// ?? Rendering ??

/** ?λ퉬 ?щ’ 6媛??뚮뜑留?(遺?꾨퀎 怨좎젙 ?щ’) */
function renderEquipSlots() {
  const eqIds = META.equip.equippedIds || [null, null, null, null, null, null];

  for (let i = 0; i < EQUIP_MAX_SLOTS; i++) {
    const slotEl = ui[`equipSlot${i}`];
    if (!slotEl) continue;

    const rootId = eqIds[i];
    const partNum = i + 1;
    const partIcon = EQUIP_PART_ICONS[partNum] || "";

    if (rootId && EQUIP_BY_ROOT[rootId] && isEquipOwned(rootId)) {
      const equip = EQUIP_BY_ROOT[rootId];
      const gradeNum = equippedGrade(i) || equipGrade(rootId);
      const gradeLabel = equipGradeLabel(gradeNum);
      const axisColor = EQUIP_AXIS_COLORS[equip.axis] || "#666";

      slotEl.className = "equipSlot equipSlot--filled";
      slotEl.innerHTML = `
        <div class="equipSlot__iconWrap">
          <img class="equipSlot__icon" src="${equip.icon}" alt="${escapeHtml(equipNameI18n(equip))}" />
          <span class="equipSlot__gradeBadge" style="${equipGradeStyle(gradeNum)}">${escapeHtml(gradeLabel)}</span>
          <span class="equipSlot__axisStrip" style="background:${axisColor};"></span>
        </div>
        <div class="equipSlot__name">${escapeHtml(equipNameI18n(equip))}</div>
        <button class="equipSlot__removeBtn" data-idx="${i}" type="button">\u2715</button>
      `;

      // ?댁젣 踰꾪듉 ?대깽??
      slotEl.querySelector(".equipSlot__removeBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        unequipEquipment(i);
      });
      // ?대┃ ???곸꽭 蹂닿린
      slotEl.addEventListener("click", () => openEquipDetail(rootId));
    } else {
      // 鍮??щ’
      slotEl.className = "equipSlot";
      slotEl.innerHTML = `<div class="equipSlot__empty">${partIcon} ${escapeHtml(equipPartNameI18n(partNum))}</div>`;
      // 鍮??щ’??鍮꾩옣李??곹깭 ?쒖떆瑜??꾪빐 equippedIds ?뺣━
      if (META.equip.equippedIds[i]) {
        META.equip.equippedIds[i] = null;
      }
    }
  }
}

/** 蹂댁쑀 ?λ퉬 洹몃━???뚮뜑留?*/
function renderEquipGrid() {
  if (!ui.equipGrid) return;
  ui.equipGrid.innerHTML = "";

  const eqIds = META.equip.equippedIds || [];

  // 蹂댁쑀 ?λ퉬 ?꾪꽣留?& ?뺣젹 (?깃툒 ?대┝李⑥닚 ??遺????異????곗뼱)
  const ownedEquips = EQUIPMENT.filter(e => isEquipOwned(e.rootId));
  ownedEquips.sort((a, b) => {
    const ga = equipGrade(a.rootId), gb = equipGrade(b.rootId);
    if (ga !== gb) return gb - ga; // ?깃툒 ?믪? ??
    if (a.equipmentType !== b.equipmentType) return a.equipmentType - b.equipmentType;
    if (a.axis !== b.axis) return a.axis - b.axis;
    return a.tier - b.tier;
  });

  for (const equip of ownedEquips) {
    const gradeNum = equipGrade(equip.rootId);
    const gradeLabel = equipGradeLabel(gradeNum);
    const count = equipCount(equip.rootId);
    const isEquipped = eqIds.includes(equip.rootId);
    const axisColor = EQUIP_AXIS_COLORS[equip.axis] || "#666";

    const el = document.createElement("div");
    el.className = "equipGrid__item";
    if (isEquipped) el.classList.add("equipGrid__item--equipped");

    // ?꾩씠肄?
    const eqName = equipNameI18n(equip);
    const iconHtml = equip.icon
      ? `<img class="equipGrid__icon" src="${equip.icon}" alt="${escapeHtml(eqName)}" />`
      : `<div class="equipGrid__iconPlaceholder">${escapeHtml(eqName.charAt(0))}</div>`;

    // ?깃툒 諭껋?
    const gradeBadgeHtml = `<span class="equipGrid__gradeBadge" style="${equipGradeStyle(gradeNum)}">${escapeHtml(gradeLabel)}</span>`;

    // 異??됱긽 ??(?띿뒪???놁씠 而щ윭 諛붾쭔)
    const axisStripHtml = `<span class="equipGrid__axisStrip" style="background:${axisColor};" title="${escapeHtml(equipAxisNameI18n(equip.axis))}"></span>`;

    // ?ㅽ? 諭껋? (Tier 2)
    const starBadgeHtml = equip.tier === 2
      ? `<span class="equipGrid__starBadge">\u2605</span>`
      : "";

    // ?섎웾 諭껋?
    const countBadgeHtml = count > 1
      ? `<span class="equipGrid__countBadge">x${count}</span>`
      : "";

    // ?μ갑 諭껋?
    const equipBadgeHtml = isEquipped
      ? `<span class="equipGrid__eqBadge">${t("ui.equip")}</span>`
      : "";

    el.innerHTML = `
      <div class="equipGrid__top">
        ${iconHtml}
        ${gradeBadgeHtml}
        ${starBadgeHtml}
        ${equipBadgeHtml}
      </div>
      <div class="equipGrid__bottom">
        ${axisStripHtml}
        <span class="equipGrid__name">${escapeHtml(eqName)}</span>
        ${countBadgeHtml}
      </div>
    `;

    el.addEventListener("click", () => openEquipDetail(equip.rootId));
    ui.equipGrid.appendChild(el);
  }

  if (ownedEquips.length === 0) {
    ui.equipGrid.innerHTML = `<div class="equipGrid__empty">${t("ui.equipNoEquip")}</div>`;
  }
}

/** ?λ퉬 ?곸꽭 紐⑤떖 ?닿린 */
function openEquipDetail(rootId) {
  const equip = EQUIP_BY_ROOT[rootId];
  if (!equip || !ui.equipDetailModal) return;

  const owned = isEquipOwned(rootId);
  const gradeNum = equipGrade(rootId);
  const gradeLabel = equipGradeLabel(gradeNum);
  const count = equipCount(rootId);
  const eqIds = META.equip.equippedIds || [];
  const slotIdx = equip.equipmentType - 1;
  const isEquipped = eqIds[slotIdx] === rootId;

  const partIcon = EQUIP_PART_ICONS[equip.equipmentType] || "";
  const axisColor = EQUIP_AXIS_COLORS[equip.axis] || "#666";

  // 紐⑤떖 ?댁슜 援ъ꽦
  let html = `<div class="equipDetail">`;

  // ?곷떒: ?꾩씠肄?+ ?대쫫 + 諭껋???
  html += `<div class="equipDetail__header">`;
  const eqName = equipNameI18n(equip);
  html += equip.icon
    ? `<img class="equipDetail__icon" src="${equip.icon}" alt="${escapeHtml(eqName)}" />`
    : `<div class="equipDetail__iconPlaceholder">${escapeHtml(eqName.charAt(0))}</div>`;
  html += `<div class="equipDetail__headerInfo">`;
  html += `<div class="equipDetail__name">${escapeHtml(eqName)}</div>`;
  html += `<div class="equipDetail__badges">`;
  html += `<span class="equipDetail__gradeBadge" style="${equipGradeStyle(gradeNum)}">${escapeHtml(gradeLabel)}</span>`;
  html += `<span class="equipDetail__partBadge">${partIcon} ${escapeHtml(equipPartNameI18n(equip.equipmentType))}</span>`;
  html += `<span class="equipDetail__axisBadge" style="background:${axisColor};color:#fff;">${escapeHtml(equipAxisNameI18n(equip.axis))}</span>`;
  if (equip.tier === 2) {
    html += `<span class="equipDetail__tierBadge">\u2605 ${escapeHtml(equipTierNameI18n(equip.tier))}</span>`;
  }
  html += `</div>`; // badges
  if (owned) {
    html += `<div class="equipDetail__sub">${t("ui.equipOwnedCount", { count })}</div>`;
  } else {
    html += `<div class="equipDetail__sub">${t("ui.equipNotOwned")}</div>`;
  }
  html += `</div>`; // headerInfo
  html += `</div>`; // header

  // ?⑥떆釉?紐⑸줉
  html += `<div class="equipDetail__passives">`;
  if (equip.passives && equip.passives.length > 0) {
    for (const passive of equip.passives) {
      const pGradeLabel = equipGradeLabel(passive.grade);
      const isUnlocked = owned && gradeNum >= passive.grade;
      const rowClass = isUnlocked ? "equipDetail__passiveRow--unlocked" : "equipDetail__passiveRow--locked";
      const marker = isUnlocked ? "\u25B6 " : "\u25B7 ";
      html += `<div class="equipDetail__passiveRow ${rowClass}">`;
      html += `<span class="equipDetail__passiveGrade" style="${equipGradeStyle(passive.grade)}">${escapeHtml(pGradeLabel)}</span>`;
      html += `<span class="equipDetail__passiveDesc">${marker}${escapeHtml(equipPassiveDescI18n(equip, pGradeLabel) || passive.desc)}</span>`;
      html += `</div>`;
    }
  } else {
    html += `<div style="font-size:12px;color:rgba(60,42,28,0.4);">${t("ui.equipPassiveNone")}</div>`;
  }
  html += `</div>`; // passives

  // ?깃툒蹂?蹂댁쑀 ?꾪솴
  if (owned) {
    const breakdown = equipGradeBreakdown(rootId);
    const breakdownParts = Object.entries(breakdown)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([g, c]) => `<span style="${equipGradeStyle(Number(g))};padding:1px 5px;border-radius:3px;font-size:10px;margin:1px;">${escapeHtml(equipGradeLabel(Number(g)))} x${c}</span>`);
    if (breakdownParts.length > 0) {
      html += `<div class="equipDetail__breakdown" style="display:flex;flex-wrap:wrap;gap:4px;padding:6px 0;">${breakdownParts.join("")}</div>`;
    }
  }

  // ?≪뀡 踰꾪듉
  html += `<div class="equipDetail__actions" id="equipDetailActions">`;

  if (owned) {
    if (isEquipped) {
      html += `<button class="btn btn--ghost" id="equipDetailUnequipBtn" type="button">${t("ui.unequip")}</button>`;
    } else {
      html += `<button class="btn" id="equipDetailEquipBtn" type="button">${t("ui.equip")}</button>`;
    }
  }

  html += `</div>`; // actions
  html += `</div>`; // equipDetail

  // 紐⑤떖 ?댁슜 ?ㅼ젙 ??modal__card ?덉뿉 ?ｊ린
  const contentEl = ui.equipDetailModal.querySelector(".modal__card") || ui.equipDetailModal;
  contentEl.innerHTML = `<button class="modal__closeBtn" id="equipDetailCloseBtn2" type="button">\u2715</button>` + html;

  // ?대깽??諛붿씤??
  const closeBtn2 = document.getElementById("equipDetailCloseBtn2");
  if (closeBtn2) closeBtn2.addEventListener("click", closeEquipDetail);

  const equipBtn = document.getElementById("equipDetailEquipBtn");
  if (equipBtn) {
    equipBtn.addEventListener("click", () => {
      equipEquipment(rootId);
      closeEquipDetail();
    });
  }

  const unequipBtn = document.getElementById("equipDetailUnequipBtn");
  if (unequipBtn) {
    unequipBtn.addEventListener("click", () => {
      unequipEquipment(slotIdx);
      closeEquipDetail();
    });
  }

  ui.equipDetailModal.classList.add("modal--open");
  ui.equipDetailModal.setAttribute("aria-hidden", "false");
}

/** ?λ퉬 ?곸꽭 紐⑤떖 ?リ린 */
function closeEquipDetail() {
  if (!ui.equipDetailModal) return;
  ui.equipDetailModal.classList.remove("modal--open");
  ui.equipDetailModal.setAttribute("aria-hidden", "true");
}

/** ?⑹꽦 媛?ν븳 ?λ퉬 紐⑸줉 UI (?깃툒蹂?遺꾨━) */
function renderEquipMergeUI() {
  const container = document.getElementById("equipMerge");
  if (!container) return;
  container.innerHTML = "";

  // 蹂댁쑀 ?λ퉬??媛??깃툒蹂꾨줈 ?⑹꽦 媛???щ? 泥댄겕
  const mergeItems = []; // { equip, grade, rule, mergeResult }
  for (const equip of EQUIPMENT) {
    if (!isEquipOwned(equip.rootId)) continue;
    const breakdown = equipGradeBreakdown(equip.rootId);
    for (const gStr of Object.keys(breakdown).sort((a, b) => Number(a) - Number(b))) {
      const g = Number(gStr);
      const rule = getEquipMergeRule(equip.rootId, g);
      if (!rule) continue;
      const mergeResult = findMergeMaterials(equip.rootId, g, rule);
      mergeItems.push({ equip, grade: g, rule, mergeResult });
    }
  }

  if (mergeItems.length === 0) {
    container.innerHTML = `<div style="font-size:12px;color:rgba(60,42,28,0.4);padding:12px;text-align:center;">${t("ui.equipMergeNoMat")}</div>`;
    return;
  }

  for (const { equip, grade: gradeNum, rule, mergeResult } of mergeItems) {
    const gradeLabel = equipGradeLabel(gradeNum);
    const nextGradeLabel = equipGradeLabel(gradeNum + 1);
    const axisColor = EQUIP_AXIS_COLORS[equip.axis] || "#666";
    const countAtGrade = equipCountAtGrade(equip.rootId, gradeNum);

    const item = document.createElement("div");
    item.className = "equipMerge__item";
    if (mergeResult.canMerge) item.classList.add("equipMerge__item--ready");

    const iconHtml = equip.icon
      ? `<img class="equipMerge__icon" src="${equip.icon}" alt="${escapeHtml(equipNameI18n(equip))}" />`
      : `<div class="equipMerge__iconPlaceholder">${escapeHtml(equipNameI18n(equip).charAt(0))}</div>`;

    // ?щ즺 ?곹깭 ?쒖떆
    let matsHtml = "";
    for (let mi = 0; mi < rule.materials.length; mi++) {
      const mat = rule.materials[mi];
      const avail = mergeResult.materialsAvailable[mi];
      const typeLabel = mergeTypeLabelI18n(mat.type);
      const matGradeLabel = equipGradeLabel(mat.grade);
      const cls = avail ? "equipMerge__matOk" : "equipMerge__matMissing";
      matsHtml += `<span class="${cls}">${escapeHtml(typeLabel)} ${escapeHtml(matGradeLabel)}</span> `;
    }

    item.innerHTML = `
      ${iconHtml}
      <div class="equipMerge__info">
        <div class="equipMerge__name">
          <span class="equipMerge__axisDot" style="background:${axisColor};"></span>
          ${escapeHtml(equipNameI18n(equip))} (x${countAtGrade})
          <span style="${equipGradeStyle(gradeNum)};padding:1px 4px;border-radius:3px;font-size:10px;">${escapeHtml(gradeLabel)}</span>
          \u2192
          <span style="${equipGradeStyle(gradeNum + 1)};padding:1px 4px;border-radius:3px;font-size:10px;">${escapeHtml(nextGradeLabel)}</span>
        </div>
        <div class="equipMerge__mats">${matsHtml}</div>
      </div>
    `;

    const btn = document.createElement("button");
    btn.className = "equipMerge__btn";
    btn.type = "button";
    btn.textContent = t("ui.equipMergeLbl");
    btn.disabled = !mergeResult.canMerge;
    btn.addEventListener("click", () => {
      const res = mergeEquipment(equip.rootId, gradeNum);
      if (res.ok) {
        renderEquipMenu();
        renderEquipMergeUI();
      }
    });
    item.appendChild(btn);
    container.appendChild(item);
  }
}

/** ?λ퉬 硫붾돱 ?꾩껜 ?뚮뜑留?(硫붿씤硫붾돱?먯꽌 ?몄텧) */
function renderEquipMenu() {
  // 戮묎린 踰꾪듉 ?곹깭
  if (ui.equipDrawBtn) {
    ui.equipDrawBtn.textContent = t("ui.draw1", { cost: EQUIP_GACHA_COST });
    ui.equipDrawBtn.disabled = META.gold < EQUIP_GACHA_COST;
  }
  if (ui.equipDraw10Btn) {
    ui.equipDraw10Btn.textContent = t("ui.draw10", { cost: EQUIP_GACHA_COST * 10 });
    ui.equipDraw10Btn.disabled = META.gold < EQUIP_GACHA_COST * 10;
  }
  if (ui.equipAutoBtn) {
    ui.equipAutoBtn.textContent = "자동 장착";
    ui.equipAutoBtn.onclick = () => {
      const changed = autoEquipBestOwned(true);
      if (changed && typeof addLog === "function") addLog("장비 자동 장착");
      renderEquipMenu();
    };
  }

  renderEquipSlots();
  renderEquipGrid();
  renderEquipMergeUI();
}


/* ?먥븧???꾨줈??3 UI/?곗텧 媛쒖꽑 (援?override.js ?듯빀) ?먥븧??*/
(function () {
  'use strict';

  // ?????????????????????????????????????????????
  // 1. ?μ떇 諛쒕룞 ???꾩씠肄??꾩튂?먯꽌 ?뚰떚??burst
  //    sb__decoIcon--active ?대옒??媛먯? ???뚰떚???곕쑉由ш린
  // ?????????????????????????????????????????????

  function spawnIconBurst(iconEl) {
    const appEl = document.querySelector('.app') || document.body;
    const iconRect = iconEl.getBoundingClientRect();
    const appRect  = appEl.getBoundingClientRect();

    const cx = iconRect.left - appRect.left + iconRect.width  / 2;
    const cy = iconRect.top  - appRect.top  + iconRect.height / 2;

    const COLORS = ['#f5bc2e', '#ff8c42', '#fff6cc', '#ffe566', '#ffffff'];
    const COUNT = 10;

    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement('div');
      p.className = 'deco-burst-particle';

      // 諛⑹궗???쇱쭚 ???꾩そ 諛⑺뼢????留롮씠 ?섍린 (諛쒕씪?몃줈 ?먮굦)
      const angle   = (i / COUNT) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const dist    = 12 + Math.random() * 16;
      const dx      = Math.cos(angle) * dist;
      const dy      = Math.sin(angle) * dist;
      const size    = 3 + Math.random() * 3;
      const color   = COLORS[Math.floor(Math.random() * COLORS.length)];
      const delay   = Math.random() * 0.06;

      p.style.cssText = `
        left: ${cx}px;
        top:  ${cy}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        animation-delay: ${delay}s;
      `;
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);

      appEl.appendChild(p);
      setTimeout(() => p.remove(), 550);
    }
  }

  function setupDecoActiveObserver() {
    const decoContainer = document.getElementById('sbDecos');
    if (!decoContainer) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== 'attributes') continue;
        const target = m.target;
        if (!target.classList) continue;

        // active ?대옒?ㅺ? ?덈줈 遺숈뿀???뚮쭔 burst (以묐났 諛⑹?)
        if (
          target.classList.contains('sb__decoIcon--active') &&
          !target._burstFired
        ) {
          target._burstFired = true;
          spawnIconBurst(target);
          setTimeout(() => { target._burstFired = false; }, 400);
        }
      }
    });

    observer.observe(decoContainer, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class'],
    });
  }

  // ?????????????????????????????????????????????
  // 2. 諛곗쑉 蹂寃????곕?吏 ?ㅼ떆媛?移댁슫?몄뾽
  // ?????????????????????????????????????????????

  let baseDmgSnapshot = null;

  const ELEM_REFS = {
    fire:   { valId: 'sbFireVal',   elId: 'sbFire'   },
    light:  { valId: 'sbLightVal',  elId: 'sbLight'  },
    nature: { valId: 'sbNatureVal', elId: 'sbNature' },
    water:  { valId: 'sbWaterVal',  elId: 'sbWater'  },
  };

  function readElemDmg() {
    const snap = {};
    for (const [k, ref] of Object.entries(ELEM_REFS)) {
      const el = document.getElementById(ref.valId);
      snap[k] = el ? (parseInt(el.textContent) || 0) : 0;
    }
    return snap;
  }

  function applyScaledDmg(mult) {
    if (!baseDmgSnapshot) return;
    for (const [key, ref] of Object.entries(ELEM_REFS)) {
      const base = baseDmgSnapshot[key] || 0;
      if (base <= 0) continue;
      const scaled = Math.floor(base * mult);
      const valEl = document.getElementById(ref.valId);
      const rowEl = document.getElementById(ref.elId);
      if (!valEl) continue;
      const old = parseInt(valEl.textContent) || 0;
      if (scaled !== old) {
        valEl.textContent = String(scaled);
        if (rowEl) {
          rowEl.classList.remove('sb__elem--bump');
          void rowEl.offsetWidth;
          rowEl.classList.add('sb__elem--bump');
          setTimeout(() => rowEl.classList.remove('sb__elem--bump'), 200);
        }
      }
    }
  }

  function setupMultObserver() {
    const multValEl = document.getElementById('sbMultVal');
    if (!multValEl) return;

    const observer = new MutationObserver(() => {
      const text = multValEl.textContent || '';
      const mult = parseFloat(text.replace('x', '')) || 1;
      if (mult > 1.0) applyScaledDmg(mult);
    });

    observer.observe(multValEl, { characterData: true, childList: true, subtree: true });
  }

  function setupSnapshotObserver() {
    const decoContainer = document.getElementById('sbDecos');
    if (!decoContainer) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== 'attributes') continue;
        const target = m.target;
        if (!target.classList) continue;
        if (
          (target.classList.contains('sb__decoIcon--pending') ||
           target.classList.contains('sb__decoIcon--active')) &&
          !baseDmgSnapshot
        ) {
          baseDmgSnapshot = readElemDmg();
          return;
        }
      }
    });

    observer.observe(decoContainer, {
      attributes: true, subtree: true, attributeFilter: ['class'],
    });
  }

  function setupResetObserver() {
    const comboEl = document.getElementById('sbComboNum');
    if (!comboEl) return;
    const observer = new MutationObserver(() => {
      if ((parseInt(comboEl.textContent) || 0) === 0) baseDmgSnapshot = null;
    });
    observer.observe(comboEl, { characterData: true, childList: true, subtree: true });
  }

  // ?????????????????????????????????????????????
  // 3. ?ㅽ? 踰꾪듉 ?낇떛
  // ?????????????????????????????????????????????

  function setupJackpotFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const jackpotEl = document.getElementById('jackpotText');
    if (!canvas || !jackpotEl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = ['#f5bc2e', '#ff8c42', '#ff5252', '#5ce8a0', '#30b5ff', '#ffe566', '#ffffff', '#ff80ab'];
    const TOTAL_BURSTS = 12;
    const BURST_INTERVAL = 280;
    let particles = [];
    let burstTimers = [];
    let animFrameId = null;
    let stopTimerId = null;
    let allBurstsScheduled = false;
    let active = false;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function randomBetween(a, b) {
      return a + Math.random() * (b - a);
    }

    function explode(x, y) {
      const count = Math.floor(randomBetween(60, 90));
      const colorA = COLORS[Math.floor(Math.random() * COLORS.length)];
      const colorB = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = randomBetween(2.5, 7.5);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: Math.random() < 0.5 ? colorA : colorB,
          radius: randomBetween(2, 4.5),
          decay: randomBetween(0.012, 0.022),
          gravity: 0.12,
          trail: Math.random() < 0.4,
        });
      }
    }

    function stopFireworks() {
      active = false;
      canvas.classList.remove('fireworks--active');
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (stopTimerId) clearTimeout(stopTimerId);
      animFrameId = null;
      stopTimerId = null;
      burstTimers.forEach(clearTimeout);
      burstTimers = [];
      particles = [];
      allBurstsScheduled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.trail) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }
      if (allBurstsScheduled && particles.length === 0) {
        stopFireworks();
        return;
      }
      animFrameId = requestAnimationFrame(animate);
    }

    function startFireworks() {
      if (active) stopFireworks();
      active = true;
      resizeCanvas();
      canvas.classList.add('fireworks--active');
      allBurstsScheduled = false;

      for (let i = 0; i < TOTAL_BURSTS; i++) {
        const timerId = setTimeout(() => {
          const x = randomBetween(canvas.width * 0.1, canvas.width * 0.9);
          const y = randomBetween(canvas.height * 0.08, canvas.height * 0.6);
          explode(x, y);
          if (i % 3 === 0) {
            explode(
              randomBetween(canvas.width * 0.1, canvas.width * 0.9),
              randomBetween(canvas.height * 0.08, canvas.height * 0.55)
            );
          }
          if (i === TOTAL_BURSTS - 1) allBurstsScheduled = true;
        }, i * BURST_INTERVAL);
        burstTimers.push(timerId);
      }

      animFrameId = requestAnimationFrame(animate);
      stopTimerId = setTimeout(stopFireworks, 5000);
    }

    function isJackpotSuccessText(text) {
      const value = String(text || '').trim();
      const noText = typeof t === 'function' ? String(t('ui.jackpotNo') || '') : '';
      const pendingText = typeof t === 'function' ? String(t('ui.jackpotPending') || '') : '';
      if (!value || value === noText || value === pendingText) return false;
      return /\(\s*\+\d+\s*\)/.test(value);
    }

    const observer = new MutationObserver(() => {
      if (isJackpotSuccessText(jackpotEl.textContent)) startFireworks();
    });

    observer.observe(jackpotEl, { characterData: true, childList: true, subtree: true });
    jackpotEl.addEventListener('dblclick', startFireworks);
    window.__testJackpotFireworks = startFireworks;
    window.addEventListener('resize', resizeCanvas);
  }

  function setupSpinHaptic() {
    const spinBtn = document.getElementById('spinBtn');
    if (!spinBtn || !navigator.vibrate) return;
    spinBtn.addEventListener('click', () => {
      try { navigator.vibrate(10); } catch (_) {}
    });
  }

  // ?????????????????????????????????????????????
  // 珥덇린??
  // ?????????????????????????????????????????????

  function init() {
    setupDecoActiveObserver();
    setupMultObserver();
    setupSnapshotObserver();
    setupResetObserver();
    setupJackpotFireworks();
    setupSpinHaptic();
    console.log('[?꾨줈??3] override.js 珥덇린???꾨즺');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

