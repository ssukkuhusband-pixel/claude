// Equipment System Data - v2

const EQUIP_GACHA_COST = 2;
const EQUIP_MAX_SLOTS = 6;

const EQUIP_GRADE_MAP = { 1: "C", 2: "B", 3: "A", 4: "S", 5: "S1", 6: "S2", 7: "SS", 8: "SS1", 9: "SS2", 10: "SS3", 11: "SSS" };
const EQUIP_GRADE_NUM = { C: 1, B: 2, A: 3, S: 4, S1: 5, S2: 6, SS: 7, SS1: 8, SS2: 9, SS3: 10, SSS: 11 };

const EQUIP_PART_NAMES = { 1: "항아리", 2: "목걸이", 3: "귀걸이", 4: "옷", 5: "투구", 6: "신발" };
const EQUIP_PART_ICONS = { 1: "🏺", 2: "📿", 3: "💎", 4: "🧥", 5: "🪖", 6: "👟" };

const EQUIP_AXIS_NAMES = { 1: "보호", 2: "공격", 3: "상태" };
const EQUIP_AXIS_LABELS = { 1: "PROTECT", 2: "ATTACK", 3: "STATUS" };

const EQUIP_TIER_NAMES = { 1: "일반", 2: "스타" };

const EQUIP_GRADE_RATES = [
  { grade: "C", w: 60 },
  { grade: "B", w: 30 },
  { grade: "A", w: 8 },
  { grade: "S", w: 2 },
];

const EQUIP_TIER_RATES = [
  { tier: 1, w: 90 },
  { tier: 2, w: 10 },
];

const EQUIP_GRADE_COLORS = {
  1: "#7A7F87",
  2: "#2FA65A",
  3: "#46A8FF",
  4: "#8E5BFF",
  5: "#8E5BFF",
  6: "#8E5BFF",
  7: "#E25555",
  8: "#E25555",
  9: "#E25555",
  10: "#E25555",
  11: "#E25555",
};

const EQUIP_AXIS_COLORS = { 1: "#2E7D32", 2: "#C62828", 3: "#1565C0" };

Object.assign(EQUIP_PART_NAMES, {
  1: "항아리",
  2: "목걸이",
  3: "귀걸이",
  4: "옷",
  5: "장갑",
  6: "신발",
});

const EQUIP_MERGE_RULES = [
  { tier: 1, fromGrade: 1, materials: [{ type: 1, grade: 1 }, { type: 1, grade: 1 }] },
  { tier: 1, fromGrade: 2, materials: [{ type: 1, grade: 2 }, { type: 1, grade: 2 }] },
  { tier: 1, fromGrade: 3, materials: [{ type: 1, grade: 3 }, { type: 1, grade: 3 }] },
  { tier: 1, fromGrade: 4, materials: [{ type: 2, grade: 4 }] },
  { tier: 1, fromGrade: 5, materials: [{ type: 2, grade: 4 }, { type: 2, grade: 4 }] },
  { tier: 1, fromGrade: 6, materials: [{ type: 1, grade: 6 }] },
  { tier: 1, fromGrade: 7, materials: [{ type: 2, grade: 7 }] },
  { tier: 1, fromGrade: 8, materials: [{ type: 2, grade: 7 }] },
  { tier: 1, fromGrade: 9, materials: [{ type: 2, grade: 7 }, { type: 2, grade: 7 }] },
  { tier: 1, fromGrade: 10, materials: [{ type: 1, grade: 10 }] },
  { tier: 2, fromGrade: 4, materials: [{ type: 2, grade: 4 }] },
  { tier: 2, fromGrade: 5, materials: [{ type: 2, grade: 4 }, { type: 2, grade: 4 }] },
  { tier: 2, fromGrade: 6, materials: [{ type: 1, grade: 6 }] },
  { tier: 2, fromGrade: 7, materials: [{ type: 2, grade: 7 }] },
  { tier: 2, fromGrade: 8, materials: [{ type: 2, grade: 7 }] },
  { tier: 2, fromGrade: 9, materials: [{ type: 3, grade: 7 }, { type: 2, grade: 7 }] },
  { tier: 2, fromGrade: 10, materials: [{ type: 1, grade: 10 }] },
];

const MERGE_TYPE_LABELS = {
  1: "동일 장비",
  2: "같은 부위",
  3: "같은 티어+부위",
};

const EQUIP_B_DESC_PERCENT = 5;

function resolveEquipPassiveDesc(desc) {
  if (!desc) return desc;
  return String(desc)
    .replace(/2B턴/g, "2턴")
    .replace(/B턴/g, "1턴")
    .replace(/0\.5B%/g, (EQUIP_B_DESC_PERCENT * 0.5) + "%")
    .replace(/1\.5B%/g, (EQUIP_B_DESC_PERCENT * 1.5) + "%")
    .replace(/2B%/g, (EQUIP_B_DESC_PERCENT * 2) + "%")
    .replace(/3\.5B%/g, (EQUIP_B_DESC_PERCENT * 3.5) + "%")
    .replace(/3B%/g, (EQUIP_B_DESC_PERCENT * 3) + "%")
    .replace(/5B%/g, (EQUIP_B_DESC_PERCENT * 5) + "%")
    .replace(/B%/g, EQUIP_B_DESC_PERCENT + "%");
}

function equipPassives(rows) {
  const gradeMap = { C: 1, B: 2, A: 3, S: 4, SS: 7, SSS: 11 };
  return rows
    .filter((row) => row && row[1] && row[1] !== "-")
    .map(([label, desc]) => ({ grade: gradeMap[label], desc: resolveEquipPassiveDesc(desc) }));
}

const EQUIPMENT = [
  { rootId: 11101, tier: 1, equipmentType: 1, axis: 1, name: "보호 항아리", icon: "images/iconitem_Equipment/icon_equipment_11101.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "회복량 + B%"],
    ["A", "체력이 80% 이상일 때, 공격력 + B%"],
    ["S", "체력이 80% 이상일 때, X2 룬 2개 등장"],
    ["SS", "공격력 + 2B%"],
  ]) },
  { rootId: 11201, tier: 1, equipmentType: 1, axis: 2, name: "공격 항아리", icon: "images/iconitem_Equipment/icon_equipment_11201.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "치명타 데미지 + B%"],
    ["A", "콤보 15 이상일 때, 치명타 100% (해당 턴만)"],
    ["S", "스핀 1회당 체력 3% 소모, 공격력 + 15%, 치명타 데미지 15% 증가"],
    ["SS", "치명타 데미지 + 2B%"],
  ]) },
  { rootId: 11301, tier: 1, equipmentType: 1, axis: 3, name: "상태 항아리", icon: "images/iconitem_Equipment/icon_equipment_11301.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "화상 데미지 + B%"],
    ["A", "전투 시작 시, 적에게 저체온 1스택 부여"],
    ["S", "턴마다 화상에 걸린 적에게 화염 폭발 부여 (걸려있는 화상 데미지 합의 50%)"],
    ["SS", "화상 데미지 + 2B%"],
  ]) },

  { rootId: 21101, tier: 2, equipmentType: 1, axis: 1, name: "스타 보호 항아리", icon: "images/iconitem_Equipment/icon_equipment_21101.png", passives: equipPassives([
    ["C", "공격력 + 1.5B%"],
    ["B", "회복량 + 1.5B%"],
    ["A", "체력이 50% 이상일 때, 공격력 + B%"],
    ["S", "체력이 50% 이상일 때, 심볼에 X2 룬 2개 등장"],
    ["SS", "공격력 + 3B%"],
    ["SSS", "체력이 50% 이상일 때, 회복 룬 5개 등장"],
  ]) },
  { rootId: 21201, tier: 2, equipmentType: 1, axis: 2, name: "스타 공격 항아리", icon: "images/iconitem_Equipment/icon_equipment_21201.png", passives: equipPassives([
    ["C", "공격력 + 1.5B%"],
    ["B", "치명타 데미지 + 1.5B%"],
    ["A", "콤보 7 이상일 때, 치명타 100% (해당 턴만)"],
    ["S", "스핀 1회당 체력 1.5% 소모, 공격력 + 17.5%, 치명타 데미지 17.5% 증가"],
    ["SS", "치명타 데미지 + 3B%"],
    ["SSS", "한 가지 속성으로만 공격 시, 데미지 증폭 5B% 증가\n두 가지 이상 속성으로 공격 시, 치명타 데미지 5B% 증가"],
  ]) },
  { rootId: 21301, tier: 2, equipmentType: 1, axis: 3, name: "스타 상태 항아리", icon: "images/iconitem_Equipment/icon_equipment_21301.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "화상 데미지 + 1.5B%"],
    ["A", "전투 시작 시, 적에게 저체온 2스택 부여"],
    ["S", "턴마다 화상에 걸린 적에게 대폭발 부여 (걸려있는 화상 데미지 합의 80%)"],
    ["SS", "화상 데미지 + 3B%"],
    ["SSS", "모든 상태이상 턴 수 + 1"],
  ]) },

  { rootId: 12101, tier: 1, equipmentType: 2, axis: 1, name: "보호 목걸이", icon: "images/iconitem_Equipment/icon_equipment_12101.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "회복량 + B%"],
    ["A", "보호막이 존재할 때, 치명타 확률 + B%"],
    ["S", "보호막이 존재할 때, 치명타 데미지 + B%"],
    ["SS", "공격력 + 2B%"],
  ]) },
  { rootId: 12201, tier: 1, equipmentType: 2, axis: 2, name: "공격 목걸이", icon: "images/iconitem_Equipment/icon_equipment_12201.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "치명타 데미지 + B%"],
    ["A", "치명타 공격 발생 시, B턴간 공격력 + B%"],
    ["S", "치명타 공격 발생 시, 다음 턴 심볼에 X2 룬 2개 등장"],
    ["SS", "치명타 데미지 + 2B%"],
  ]) },
  { rootId: 12301, tier: 1, equipmentType: 2, axis: 3, name: "상태 목걸이", icon: "images/iconitem_Equipment/icon_equipment_12301.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "화상 데미지 + B%"],
    ["A", "저체온 스택 부여 시, B% 확률로 스택 2배 부여"],
    ["S", "저체온 스택 1개 부여당 공격력 + B% (전투 종료 시 제거)"],
    ["SS", "화상 데미지 2B%"],
  ]) },

  { rootId: 22101, tier: 2, equipmentType: 2, axis: 1, name: "스타 보호 목걸이", icon: "images/iconitem_Equipment/icon_equipment_22101.png", passives: equipPassives([
    ["C", "공격력 + 1.5B%"],
    ["B", "회복량 + 1.5B%"],
    ["A", "보호막이 존재할 때, 치명타 확률 + 2B%"],
    ["S", "보호막이 존재할 때, 치명타 데미지 + 2B%"],
    ["SS", "공격력 + 3B%"],
    ["SSS", "보호막이 존재하는 상태에서 전투 승리 시 최대 체력 B% 증가 (챕터 종료 시 초기화)"],
  ]) },
  { rootId: 22201, tier: 2, equipmentType: 2, axis: 2, name: "스타 공격 목걸이", icon: "images/iconitem_Equipment/icon_equipment_22201.png", passives: equipPassives([
    ["C", "공격력 + 1.5B%"],
    ["B", "치명타 데미지 + 1.5B%"],
    ["A", "치명타 공격 발생 시, B턴간 공격력 + 2B%"],
    ["S", "치명타 공격 발생 시, 다음 턴 심볼에 X2 룬 4개 등장"],
    ["SS", "치명타 데미지 + 3B%"],
    ["SSS", "치명타 발생 시, 다음 턴에 모든 속성 취급되는 만능 심볼 1개 등장"],
  ]) },
  { rootId: 22301, tier: 2, equipmentType: 2, axis: 3, name: "스타 상태 목걸이", icon: "images/iconitem_Equipment/icon_equipment_22301.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "화상 데미지 + 1.5B%"],
    ["A", "저체온 스택 부여 시, 2B% 확률로 스택 2배 부여"],
    ["S", "저체온 스택 1개 부여마다 공격력 + 2B% (전투 종료 시 제거)"],
    ["SS", "화상 데미지 3B%"],
    ["SSS", "빙결 상태인 적에게 적용되는 화상 데미지 + 5B%"],
  ]) },

  { rootId: 13101, tier: 1, equipmentType: 3, axis: 1, name: "보호 귀걸이", icon: "images/iconitem_Equipment/icon_equipment_13101.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "회복량 + B%"],
    ["A", "회복 효과를 받았을 때, 1턴간 공격력 + B%"],
    ["S", "회복 효과를 받았을 때, 1턴간 데미지 증폭 + B%"],
    ["SS", "공격력 + 2B%"],
  ]) },
  { rootId: 13201, tier: 1, equipmentType: 3, axis: 2, name: "공격 귀걸이", icon: "images/iconitem_Equipment/icon_equipment_13201.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "치명타 데미지 + B%"],
    ["A", "콤보 15 이상일 때, 1턴간 데미지 증폭 + B%"],
    ["S", "콤보 15 이상일 때, 운석 발생 (최종 데미지의 B%)"],
    ["SS", "치명타 데미지 + 2B%"],
  ]) },
  { rootId: 13301, tier: 1, equipmentType: 3, axis: 3, name: "상태 귀걸이", icon: "images/iconitem_Equipment/icon_equipment_13301.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "화상 데미지 + B%"],
    ["A", "적에게 걸린 상태이상 1개당 공격력 + B%"],
    ["S", "적에게 걸린 상태이상이 2개 이상일 때 화상 데미지 + B%"],
    ["SS", "화상 데미지 2B%"],
  ]) },

  { rootId: 23101, tier: 2, equipmentType: 3, axis: 1, name: "스타 보호 귀걸이", icon: "images/iconitem_Equipment/icon_equipment_23101.png", passives: equipPassives([
    ["C", "공격력 + 1.5B%"],
    ["B", "회복량 + 1.5B%"],
    ["A", "회복 효과를 받았을 때, 1턴간 공격력 + 2B%"],
    ["S", "회복 효과를 받았을 때, 1턴간 데미지 증폭 + 2B%"],
    ["SS", "공격력 + 3B%"],
    ["SSS", "체력 70% 이상인 상태에서 승리 시, 최대 체력 B% 증가 (챕터 종료 시 초기화)"],
  ]) },
  { rootId: 23201, tier: 2, equipmentType: 3, axis: 2, name: "스타 공격 귀걸이", icon: "images/iconitem_Equipment/icon_equipment_23201.png", passives: equipPassives([
    ["C", "공격력 + 1.5B%"],
    ["B", "치명타 데미지 + 1.5B%"],
    ["A", "콤보 10 이상일 때, 1턴간 데미지 증폭 + 2B%"],
    ["S", "콤보 7 이상일 때, 운석 발생 (최종 데미지의 B%)"],
    ["SS", "치명타 데미지 + 3B%"],
    ["SSS", "콤보 12 이상일 때, 초거대 운석 발생 (최종 데미지의 2B%)"],
  ]) },
  { rootId: 23301, tier: 2, equipmentType: 3, axis: 3, name: "스타 상태 귀걸이", icon: "images/iconitem_Equipment/icon_equipment_23301.png", passives: equipPassives([
    ["C", "공격력 + B%"],
    ["B", "화상 데미지 + 1.5B%"],
    ["A", "적에게 걸린 상태이상 1개당 공격력 + 2B%"],
    ["S", "적에게 걸린 상태이상일 때 화상 데미지 + 2B%"],
    ["SS", "화상 데미지 3B%"],
    ["SSS", "전투 시작 시, 무한히 지속되는 어지러움 1개 적에게 부여"],
  ]) },

  { rootId: 14101, tier: 1, equipmentType: 4, axis: 1, name: "보호 옷", icon: "images/iconitem_Equipment/icon_equipment_14101.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "데미지 절감 + B%"],
    ["A", "전투 중 체력이 10% 미만일 때, 체력 B% 회복 (챕터 중 1회)"],
    ["S", "전투 중 죽음에 이르는 공격을 받을 때, 2턴 무적 부여 (챕터 중 1회)"],
    ["SS", "데미지 절감 + 2B%"],
  ]) },
  { rootId: 14201, tier: 1, equipmentType: 4, axis: 2, name: "공격 옷", icon: "images/iconitem_Equipment/icon_equipment_14201.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "데미지 증폭 + B%"],
    ["A", "잃은 체력 10% 당 공격력 + B%"],
    ["S", "잃은 체력 10% 당 치명타 확률 + B%"],
    ["SS", "데미지 증폭 + 2B%"],
  ]) },
  { rootId: 14301, tier: 1, equipmentType: 4, axis: 3, name: "상태 옷", icon: "images/iconitem_Equipment/icon_equipment_14301.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "어지러움 상태 스핀 실패 확률 소폭 감소"],
    ["A", "4턴마다 본인에게 걸린 상태이상 1개 해제"],
    ["S", "두두에게 걸린 상태이상이 사라질 때마다 체력 B% 회복 (턴이 끝난 상태이상도 제거로 취급)"],
    ["SS", "어지러움 상태 스핀 실패 확률 대폭 감소"],
  ]) },

  { rootId: 24101, tier: 2, equipmentType: 4, axis: 1, name: "스타 보호 옷", icon: "images/iconitem_Equipment/icon_equipment_24101.png", passives: equipPassives([
    ["C", "최대 체력 + 1.5B%"],
    ["B", "데미지 절감 + 1.5B%"],
    ["A", "전투 중 체력이 10% 미만일 때, 체력 전부 회복 (챕터 중 1회)"],
    ["S", "전투 중 죽음에 이르는 공격을 받을 때, 2턴 무적 부여 및 체력 전부 회복 (챕터 중 1회)"],
    ["SS", "데미지 절감 + 3B%"],
    ["SSS", "사망 시 체력 100%로 부활 (챕터 중 1회)"],
  ]) },
  { rootId: 24201, tier: 2, equipmentType: 4, axis: 2, name: "스타 공격 옷", icon: "images/iconitem_Equipment/icon_equipment_24201.png", passives: equipPassives([
    ["C", "최대 체력 + 1.5B%"],
    ["B", "데미지 증폭 + 1.5B%"],
    ["A", "잃은 체력 5% 당 공격력 + B%"],
    ["S", "잃은 체력 5% 당 치명타 확률 + B%"],
    ["SS", "데미지 증폭 + 3B%"],
    ["SSS", "체력이 30% 이하일 때, 모든 심볼에 공격 룬 등장"],
  ]) },
  { rootId: 24301, tier: 2, equipmentType: 4, axis: 3, name: "스타 상태 옷", icon: "images/iconitem_Equipment/icon_equipment_24301.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "어지러움 상태 스핀 실패 확률 감소"],
    ["A", "2턴마다 본인에게 걸린 상태이상 1개 해제"],
    ["S", "두두에게 걸린 상태이상이 사라질 때마다 체력 2B% 회복 (턴이 끝난 상태이상도 제거로 취급)"],
    ["SS", "어지러움 상태 스핀 실패 확률 초대폭 감소"],
    ["SSS", "체력이 30% 미만일 때 모든 상태이상에 면역"],
  ]) },

  { rootId: 15101, tier: 1, equipmentType: 5, axis: 1, name: "보호 투구", icon: "images/iconitem_Equipment/icon_equipment_15101.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "데미지 절감 + B%"],
    ["A", "체력이 50% 미만일 때, 매 턴 B% 보호막"],
    ["S", "체력이 50% 이상일 때, 매 턴 B% 보호막"],
    ["SS", "데미지 절감 + 2B%"],
  ]) },
  { rootId: 15201, tier: 1, equipmentType: 5, axis: 2, name: "공격 투구", icon: "images/iconitem_Equipment/icon_equipment_15201.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "데미지 증폭 + B%"],
    ["A", "체력이 30% 미만일 때, 데미지 증폭 + B%"],
    ["S", "전투 시작 시 B턴간 데미지 증폭 + B%"],
    ["SS", "데미지 증폭 + 2B%"],
  ]) },
  { rootId: 15301, tier: 1, equipmentType: 5, axis: 3, name: "상태 투구", icon: "images/iconitem_Equipment/icon_equipment_15301.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "어지러움 상태 스핀 실패 확률 소폭 감소"],
    ["A", "화상으로 인해 입는 피해 B% 감소"],
    ["S", "피격 시 B% 확률로 적에게 저체온 1스택 부여"],
    ["SS", "어지러움 상태 스핀 실패 확률 대폭 감소"],
  ]) },

  { rootId: 25101, tier: 2, equipmentType: 5, axis: 1, name: "스타 보호 투구", icon: "images/iconitem_Equipment/icon_equipment_25101.png", passives: equipPassives([
    ["C", "최대 체력 + 1.5B%"],
    ["B", "데미지 절감 + 1.5B%"],
    ["A", "매 턴 B% 보호막"],
    ["S", "전투 시작 시 B% 보호막 생성"],
    ["SS", "데미지 절감 + 3B%"],
    ["SSS", "전투 승리 시 남은 보호막 B%를 회복으로 전환"],
  ]) },
  { rootId: 25201, tier: 2, equipmentType: 5, axis: 2, name: "스타 공격 투구", icon: "images/iconitem_Equipment/icon_equipment_25201.png", passives: equipPassives([
    ["C", "최대 체력 + 1.5B%"],
    ["B", "데미지 증폭 + 1.5B%"],
    ["A", "체력이 65% 미만일 때, 데미지 증폭 + B%"],
    ["S", "전투 시작 시 2B턴간 데미지 증폭 + 1.5B%"],
    ["SS", "데미지 증폭 + 3B%"],
    ["SSS", "전투 승리 시 공격력 B% 증가 (챕터 종료 시 초기화)"],
  ]) },
  { rootId: 25301, tier: 2, equipmentType: 5, axis: 3, name: "스타 상태 투구", icon: "images/iconitem_Equipment/icon_equipment_25301.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "어지러움 상태 스핀 실패 확률 감소"],
    ["A", "화상으로 인해 입는 피해 2B% 감소"],
    ["S", "피격 시 2B% 확률로 적에게 저체온 1스택 부여"],
    ["SS", "어지러움 상태 스핀 실패 확률 초대폭 감소"],
    ["SSS", "적이 빙결 상태가 될 때 B% 보호막 획득"],
  ]) },

  { rootId: 16101, tier: 1, equipmentType: 6, axis: 1, name: "보호 신발", icon: "images/iconitem_Equipment/icon_equipment_16101.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "데미지 절감 + B%"],
    ["A", "체력이 50% 미만일 때, 매 턴 B% 회복"],
    ["S", "체력이 50% 이상일 때, 매 턴 B% 회복"],
    ["SS", "데미지 절감 + 2B%"],
  ]) },
  { rootId: 16201, tier: 1, equipmentType: 6, axis: 2, name: "공격 신발", icon: "images/iconitem_Equipment/icon_equipment_16201.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "데미지 증폭 + B%"],
    ["A", "체력이 30% 미만일 때, 치명타 데미지 + B%"],
    ["S", "전투 시작 시 B턴간 치명타 데미지 + B%"],
    ["SS", "데미지 증폭 + 2B%"],
  ]) },
  { rootId: 16301, tier: 1, equipmentType: 6, axis: 3, name: "상태 신발", icon: "images/iconitem_Equipment/icon_equipment_16301.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "어지러움 상태 스핀 실패 확률 소폭 감소"],
    ["A", "출혈로 인해 입는 피해 B% 감소"],
    ["S", "피격 시 B% 확률로 적에게 어지러움 1개 부여"],
    ["SS", "어지러움 상태 스핀 실패 확률 대폭 감소"],
  ]) },

  { rootId: 26101, tier: 2, equipmentType: 6, axis: 1, name: "스타 보호 신발", icon: "images/iconitem_Equipment/icon_equipment_26101.png", passives: equipPassives([
    ["C", "최대 체력 + 1.5B%"],
    ["B", "데미지 절감 + 1.5B%"],
    ["A", "매 턴 B% 회복"],
    ["S", "전투 시작 시 B% 회복"],
    ["SS", "데미지 절감 + 3B%"],
    ["SSS", "전투 승리 시 B% 회복"],
  ]) },
  { rootId: 26201, tier: 2, equipmentType: 6, axis: 2, name: "스타 공격 신발", icon: "images/iconitem_Equipment/icon_equipment_26201.png", passives: equipPassives([
    ["C", "최대 체력 + 1.5B%"],
    ["B", "데미지 증폭 + 1.5B%"],
    ["A", "체력이 65% 미만일 때, 치명타 데미지 + B%"],
    ["S", "전투 시작 시 2B턴간 치명타 데미지 + 1.5B%"],
    ["SS", "데미지 증폭 + 3B%"],
    ["SSS", "획득한 스킬 1개당 공격력 B% 증가"],
  ]) },
  { rootId: 26301, tier: 2, equipmentType: 6, axis: 3, name: "스타 상태 신발", icon: "images/iconitem_Equipment/icon_equipment_26301.png", passives: equipPassives([
    ["C", "최대 체력 + B%"],
    ["B", "어지러움 상태 스핀 실패 확률 감소"],
    ["A", "출혈로 인해 입는 피해 2B% 감소"],
    ["S", "피격 시 2B% 확률로 적에게 어지러움 1개 부여"],
    ["SS", "어지러움 상태 스핀 실패 확률 초대폭 감소"],
    ["SSS", "적이 어지러움 상태일 때 턴마다 B% 보호막 획득"],
  ]) },
];

const EQUIP_BY_ROOT = {};
for (const e of EQUIPMENT) EQUIP_BY_ROOT[e.rootId] = e;

const EQUIP_IDS_BY_TIER = { 1: [], 2: [] };
for (const e of EQUIPMENT) EQUIP_IDS_BY_TIER[e.tier].push(e.rootId);

const EQUIP_IDS_BY_TYPE = {};
for (let t = 1; t <= 6; t++) EQUIP_IDS_BY_TYPE[t] = [];
for (const e of EQUIPMENT) EQUIP_IDS_BY_TYPE[e.equipmentType].push(e.rootId);
