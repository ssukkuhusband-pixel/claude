const ENEMIES = [
  { id: 10001, name: "Monster 10001", icon: "", baseHp: 700, baseAtk: 5, critChance: 0.1, monsterTurn: 1, chapter: 1, kind: 2, passives: ["1005"] },
  { id: 10002, name: "Monster 10002", icon: "", baseHp: 900, baseAtk: 8, critChance: 0.1, monsterTurn: 0, chapter: 2, kind: 2, passives: ["1024", "1002"] },
  { id: 10003, name: "Monster 10003", icon: "", baseHp: 1000, baseAtk: 30, critChance: 0.1, monsterTurn: 2, chapter: 2, kind: 2, passives: ["1002"] },
  { id: 10004, name: "Monster 10004", icon: "", baseHp: 1200, baseAtk: 10, critChance: 0.1, monsterTurn: 1, chapter: 1, kind: 2, passives: ["1002", "1007"] },
  { id: 10006, name: "Monster 10006", icon: "", baseHp: 1500, baseAtk: 30, critChance: 0.1, monsterTurn: 3, chapter: 4, kind: 2, passives: ["1005", "1029", "1011"] },
  { id: 10007, name: "Monster 10007", icon: "", baseHp: 1700, baseAtk: 40, critChance: 0.15, monsterTurn: 2, chapter: 1, kind: 3, passives: ["1002", "1010"] },
  { id: 10008, name: "Monster 10008", icon: "", baseHp: 700, baseAtk: 90, critChance: 0.1, monsterTurn: 2, chapter: 2, kind: 2, passives: ["1014"] },
  { id: 10009, name: "Monster 10009", icon: "", baseHp: 1000, baseAtk: 50, critChance: 0.1, monsterTurn: 2, chapter: 2, kind: 2, passives: ["1022", "1002"] },
  { id: 10010, name: "Monster 10010", icon: "", baseHp: 1000, baseAtk: 50, critChance: 0.1, monsterTurn: 2, chapter: 2, kind: 2, passives: ["1023", "1002"] },
  { id: 10011, name: "Monster 10011", icon: "", baseHp: 4000, baseAtk: 20, critChance: 0.15, monsterTurn: 5, chapter: 2, kind: 3, passives: ["1024", "1025"] },
  { id: 10012, name: "Monster 10012", icon: "", baseHp: 3000, baseAtk: 5, critChance: 0.1, monsterTurn: 4, chapter: 4, kind: 2, passives: ["1021", "1037"] },
  { id: 10013, name: "Monster 10013", icon: "", baseHp: 800, baseAtk: 15, critChance: 0.1, monsterTurn: 0, chapter: 4, kind: 2, passives: ["1011"] },
  { id: 10014, name: "Monster 10014", icon: "", baseHp: 3000, baseAtk: 50, critChance: 0.3, monsterTurn: 2, chapter: 2, kind: 4, passives: ["1003", "10014", "1026"] },
  { id: 10015, name: "Monster 10015", icon: "", baseHp: 800, baseAtk: 30, critChance: 0.1, monsterTurn: 2, chapter: 1, kind: 2, passives: ["1014"] },
  { id: 10016, name: "Monster 10016", icon: "", baseHp: 1200, baseAtk: 30, critChance: 0.15, monsterTurn: 1, chapter: 1, kind: 3, passives: ["1014", "1002", "1003"] },
  { id: 10017, name: "Monster 10017", icon: "", baseHp: 2500, baseAtk: 60, critChance: 0.2, monsterTurn: 2, chapter: 2, kind: 4, passives: ["1014", "1002", "10017", "1029"] },
  { id: 10018, name: "Monster 10018", icon: "", baseHp: 1444, baseAtk: 44, critChance: 0.1, monsterTurn: 3, chapter: 5, kind: 2, passives: ["1021", "1019"] },
  { id: 10019, name: "Monster 10019", icon: "", baseHp: 1444, baseAtk: 44, critChance: 0.1, monsterTurn: 3, chapter: 5, kind: 2, passives: ["1021", "1018"] },
  { id: 10101, name: "Monster 10101", icon: "", baseHp: 800, baseAtk: 10, critChance: 0.1, monsterTurn: 0, chapter: 1, kind: 2, passives: ["1014"] },
  { id: 10102, name: "Monster 10102", icon: "", baseHp: 1000, baseAtk: 30, critChance: 0.1, monsterTurn: 2, chapter: 1, kind: 2, passives: ["1024"] },
  { id: 10103, name: "Monster 10103", icon: "", baseHp: 1700, baseAtk: 50, critChance: 0.1, monsterTurn: 4, chapter: 1, kind: 2, passives: ["1027", "1006"] },
  { id: 10105, name: "Monster 10105", icon: "", baseHp: 1500, baseAtk: 25, critChance: 0.1, monsterTurn: 2, chapter: 1, kind: 2, passives: ["1005", "1029"] },
  { id: 10106, name: "Monster 10106", icon: "", baseHp: 1000, baseAtk: 20, critChance: 0.1, monsterTurn: 1, chapter: 1, kind: 2, passives: ["1017", "1002"] },
  { id: 10108, name: "Monster 10108", icon: "", baseHp: 1800, baseAtk: 50, critChance: 0.15, monsterTurn: 2, chapter: 1, kind: 3, passives: ["1019", "1017"] },
  { id: 10201, name: "Monster 10201", icon: "", baseHp: 800, baseAtk: 10, critChance: 0.1, monsterTurn: 0, chapter: 2, kind: 2, passives: ["1008", "1014"] },
  { id: 10204, name: "Monster 10204", icon: "", baseHp: 1500, baseAtk: 50, critChance: 0.1, monsterTurn: 3, chapter: 2, kind: 2, passives: ["1035", "1011"] },
  { id: 10205, name: "Monster 10205", icon: "", baseHp: 1200, baseAtk: 25, critChance: 0.1, monsterTurn: 2, chapter: 2, kind: 2, passives: ["1029", "1028"] },
  { id: 10206, name: "Monster 10206", icon: "", baseHp: 1000, baseAtk: 20, critChance: 0.1, monsterTurn: 1, chapter: 2, kind: 2, passives: ["1008", "1002"] },
  { id: 10208, name: "Monster 10208", icon: "", baseHp: 1000, baseAtk: 70, critChance: 0.8, monsterTurn: 2, chapter: 2, kind: 3, passives: ["1008", "1029", "1026"] },
  { id: 10301, name: "Monster 10301", icon: "", baseHp: 800, baseAtk: 10, critChance: 0.1, monsterTurn: 0, chapter: 3, kind: 2, passives: ["1014", "1009"] },
  { id: 10303, name: "Monster 10303", icon: "", baseHp: 1700, baseAtk: 25, critChance: 0.1, monsterTurn: 2, chapter: 3, kind: 2, passives: ["1009", "1006"] },
  { id: 10304, name: "Monster 10304", icon: "", baseHp: 2500, baseAtk: 20, critChance: 0.15, monsterTurn: 5, chapter: 3, kind: 3, passives: ["1034", "1029", "1036"] },
  { id: 10305, name: "Monster 10305", icon: "", baseHp: 1500, baseAtk: 30, critChance: 0.1, monsterTurn: 2, chapter: 3, kind: 2, passives: ["1029", "1036"] },
  { id: 10308, name: "Monster 10308", icon: "", baseHp: 2000, baseAtk: 20, critChance: 0.15, monsterTurn: 1, chapter: 3, kind: 3, passives: ["1017", "1029", "1018"] },
  { id: 10401, name: "Monster 10401", icon: "", baseHp: 800, baseAtk: 10, critChance: 0.1, monsterTurn: 0, chapter: 4, kind: 2, passives: ["1014", "1002"] },
  { id: 10403, name: "Monster 10403", icon: "", baseHp: 1200, baseAtk: 80, critChance: 0.3, monsterTurn: 2, chapter: 4, kind: 3, passives: ["1003", "1023"] },
  { id: 10404, name: "Monster 10404", icon: "", baseHp: 1200, baseAtk: 40, critChance: 0.15, monsterTurn: 1, chapter: 4, kind: 3, passives: ["1002", "1010", "1029"] },
  { id: 10405, name: "Monster 10405", icon: "", baseHp: 1500, baseAtk: 30, critChance: 0.1, monsterTurn: 2, chapter: 4, kind: 2, passives: ["1005", "1037"] },
  { id: 10406, name: "Monster 10406", icon: "", baseHp: 1200, baseAtk: 60, critChance: 0.1, monsterTurn: 4, chapter: 4, kind: 2, passives: ["1006", "1027", "1028"] },
  { id: 10501, name: "Monster 10501", icon: "", baseHp: 800, baseAtk: 10, critChance: 0.1, monsterTurn: 0, chapter: 5, kind: 2, passives: ["1014"] },
  { id: 10503, name: "Monster 10503", icon: "", baseHp: 1000, baseAtk: 30, critChance: 0.1, monsterTurn: 1, chapter: 5, kind: 2, passives: ["1023", "1014"] },
  { id: 10504, name: "Monster 10504", icon: "", baseHp: 1200, baseAtk: 40, critChance: 0.1, monsterTurn: 4, chapter: 5, kind: 2, passives: ["1006", "1027", "1029"] },
  { id: 10505, name: "Monster 10505", icon: "", baseHp: 1200, baseAtk: 30, critChance: 0.1, monsterTurn: 2, chapter: 5, kind: 2, passives: ["1005", "1029", "1002"] },
  { id: 10506, name: "Monster 10506", icon: "", baseHp: 1600, baseAtk: 20, critChance: 0.15, monsterTurn: 0, chapter: 5, kind: 3, passives: ["1019", "1002"] },
  { id: 20102, name: "Monster 20102", icon: "", baseHp: 3500, baseAtk: 80, critChance: 0.2, monsterTurn: 3, chapter: 1, kind: 4, passives: ["20102", "1017"] },
  { id: 20201, name: "Monster 20201", icon: "", baseHp: 3000, baseAtk: 100, critChance: 0.2, monsterTurn: 2, chapter: 2, kind: 4, passives: ["20201", "1007"] },
  { id: 20302, name: "Monster 20302", icon: "", baseHp: 2500, baseAtk: 80, critChance: 0.2, monsterTurn: 2, chapter: 3, kind: 4, passives: ["1021", "20302", "1019"] },
  { id: 20402, name: "Monster 20402", icon: "", baseHp: 2000, baseAtk: 50, critChance: 0.2, monsterTurn: 2, chapter: 4, kind: 4, passives: ["1007", "1008", "20402", "1027"] },
  { id: 20501, name: "Monster 20501", icon: "", baseHp: 2500, baseAtk: 90, critChance: 0.2, monsterTurn: 2, chapter: 5, kind: 4, passives: ["20501", "1018", "20501", "1028"] },
  { id: 10601, name: "Monster 10601", icon: "", baseHp: 800, baseAtk: 10, critChance: 0.15, monsterTurn: 0, chapter: 6, kind: 2, passives: ["1024", "1002"] },
  { id: 10602, name: "Monster 10602", icon: "", baseHp: 1000, baseAtk: 40, critChance: 0.15, monsterTurn: 2, chapter: 6, kind: 2, passives: ["1029", "1028"] },
  { id: 10604, name: "Monster 10604", icon: "", baseHp: 1200, baseAtk: 70, critChance: 0.5, monsterTurn: 2, chapter: 6, kind: 3, passives: ["1007", "1014", "1003"] },
  { id: 10605, name: "Monster 10605", icon: "", baseHp: 1700, baseAtk: 30, critChance: 0.15, monsterTurn: 2, chapter: 6, kind: 2, passives: ["1005", "1029", "1006"] },
  { id: 10606, name: "Monster 10606", icon: "", baseHp: 1400, baseAtk: 40, critChance: 0.15, monsterTurn: 1, chapter: 6, kind: 3, passives: ["1007", "1024", "1025"] },
  { id: 10607, name: "Monster 10607", icon: "", baseHp: 900, baseAtk: 60, critChance: 0.1, monsterTurn: 3, chapter: 6, kind: 2, passives: ["1022", "1023", "1025"] },
  { id: 10609, name: "Monster 10609", icon: "", baseHp: 2500, baseAtk: 40, critChance: 0.15, monsterTurn: 3, chapter: 6, kind: 3, passives: ["1023", "1029", "1025"] },
  { id: 20601, name: "Monster 20601", icon: "", baseHp: 4000, baseAtk: 60, critChance: 0.2, monsterTurn: 3, chapter: 6, kind: 4, passives: ["20601", "1029", "1024", "1025"] },
];

const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((enemy) => [String(enemy.id), enemy]));

const MONSTER_THEME_META_BY_ID = {
  10001: { monsterTheme: 1, minChapter: 1 },
  10002: { monsterTheme: 2, minChapter: 2 },
  10003: { monsterTheme: 5, minChapter: 2 },
  10004: { monsterTheme: 1, minChapter: 1 },
  10006: { monsterTheme: 4, minChapter: 4 },
  10007: { monsterTheme: 5, minChapter: 1 },
  10008: { monsterTheme: 2, minChapter: 2 },
  10009: { monsterTheme: 5, minChapter: 2 },
  10010: { monsterTheme: 5, minChapter: 2 },
  10011: { monsterTheme: 5, minChapter: 2 },
  10012: { monsterTheme: 4, minChapter: 4 },
  10013: { monsterTheme: 4, minChapter: 4 },
  10014: { monsterTheme: 1, minChapter: 2 },
  10015: { monsterTheme: 1, minChapter: 1 },
  10016: { monsterTheme: 1, minChapter: 1 },
  10017: { monsterTheme: 1, minChapter: 2 },
  10018: { monsterTheme: 5, minChapter: 5 },
  10019: { monsterTheme: 5, minChapter: 5 },
  10101: { monsterTheme: 1, minChapter: 1 },
  10102: { monsterTheme: 1, minChapter: 1 },
  10103: { monsterTheme: 1, minChapter: 1 },
  10105: { monsterTheme: 1, minChapter: 1 },
  10106: { monsterTheme: 1, minChapter: 1 },
  10108: { monsterTheme: 1, minChapter: 1 },
  10201: { monsterTheme: 2, minChapter: 2 },
  10204: { monsterTheme: 2, minChapter: 2 },
  10205: { monsterTheme: 2, minChapter: 2 },
  10206: { monsterTheme: 2, minChapter: 2 },
  10208: { monsterTheme: 2, minChapter: 2 },
  10301: { monsterTheme: 3, minChapter: 3 },
  10303: { monsterTheme: 3, minChapter: 3 },
  10304: { monsterTheme: 3, minChapter: 3 },
  10305: { monsterTheme: 3, minChapter: 3 },
  10308: { monsterTheme: 3, minChapter: 3 },
  10401: { monsterTheme: 4, minChapter: 4 },
  10403: { monsterTheme: 4, minChapter: 4 },
  10404: { monsterTheme: 4, minChapter: 4 },
  10405: { monsterTheme: 4, minChapter: 4 },
  10406: { monsterTheme: 4, minChapter: 4 },
  10501: { monsterTheme: 5, minChapter: 5 },
  10503: { monsterTheme: 5, minChapter: 5 },
  10504: { monsterTheme: 5, minChapter: 5 },
  10505: { monsterTheme: 5, minChapter: 5 },
  10506: { monsterTheme: 5, minChapter: 5 },
  10601: { monsterTheme: 6, minChapter: 6 },
  10602: { monsterTheme: 6, minChapter: 6 },
  10604: { monsterTheme: 6, minChapter: 6 },
  10605: { monsterTheme: 6, minChapter: 6 },
  10606: { monsterTheme: 6, minChapter: 6 },
  10607: { monsterTheme: 6, minChapter: 6 },
  10609: { monsterTheme: 6, minChapter: 6 },
  20102: { monsterTheme: 1, minChapter: 1 },
  20201: { monsterTheme: 2, minChapter: 2 },
  20302: { monsterTheme: 3, minChapter: 3 },
  20402: { monsterTheme: 4, minChapter: 4 },
  20501: { monsterTheme: 5, minChapter: 5 },
  20601: { monsterTheme: 6, minChapter: 6 },
};

for (const enemy of ENEMIES) {
  const meta = MONSTER_THEME_META_BY_ID[enemy.id];
  if (!meta) continue;
  enemy.monsterTheme = meta.monsterTheme;
  enemy.minChapter = meta.minChapter;
}

const STAGE_BALANCE = {
  "1-1": { atk: 0.6, hp: 0.6, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "1-2": { atk: 0.6, hp: 0.6, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "1-3": { atk: 0.66, hp: 0.78, firstMonsterId: 10001, defaultMonsterId: 0, stageType: 2 },
  "1-4": { atk: 0.66, hp: 0.78, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "1-5": { atk: 0.66, hp: 0.78, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "1-6": { atk: 0.73, hp: 1.01, firstMonsterId: 10102, defaultMonsterId: 0, stageType: 2 },
  "1-7": { atk: 0.73, hp: 1.01, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "1-8": { atk: 0.73, hp: 1.01, firstMonsterId: 0, defaultMonsterId: 0, stageType: 5 },
  "1-9": { atk: 0.73, hp: 1.01, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "1-10": { atk: 1.2, hp: 1.31, firstMonsterId: 10016, defaultMonsterId: 0, stageType: 3 },
  "2-1": { atk: 0.9, hp: 1.2, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "2-2": { atk: 0.99, hp: 1.56, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "2-3": { atk: 0.99, hp: 1.56, firstMonsterId: 0, defaultMonsterId: 0, stageType: 5 },
  "2-4": { atk: 0.99, hp: 1.56, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "2-5": { atk: 1.09, hp: 2.03, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "2-6": { atk: 1.09, hp: 2.03, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "2-7": { atk: 1.09, hp: 2.03, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "2-8": { atk: 1.2, hp: 2.64, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "2-9": { atk: 1.2, hp: 2.64, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "2-10": { atk: 1.32, hp: 3.43, firstMonsterId: 0, defaultMonsterId: 0, stageType: 3 },
  "3-1": { atk: 1.35, hp: 2.4, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "3-2": { atk: 1.35, hp: 2.4, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "3-3": { atk: 1.49, hp: 3.12, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "3-4": { atk: 1.49, hp: 3.12, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "3-5": { atk: 1.49, hp: 3.12, firstMonsterId: 0, defaultMonsterId: 0, stageType: 5 },
  "3-6": { atk: 1.49, hp: 3.12, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "3-7": { atk: 1.49, hp: 3.12, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "3-8": { atk: 1.64, hp: 4.06, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "3-9": { atk: 1.64, hp: 4.06, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "3-10": { atk: 1.8, hp: 5.28, firstMonsterId: 0, defaultMonsterId: 0, stageType: 3 },
  "4-1": { atk: 2.025, hp: 4.8, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "4-2": { atk: 2.23, hp: 6.24, firstMonsterId: 0, defaultMonsterId: 10401, stageType: 2 },
  "4-3": { atk: 2.23, hp: 6.24, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "4-4": { atk: 2.23, hp: 6.24, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "4-5": { atk: 2.23, hp: 6.24, firstMonsterId: 0, defaultMonsterId: 0, stageType: 5 },
  "4-6": { atk: 2.23, hp: 6.24, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "4-7": { atk: 2.45, hp: 8.11, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "4-8": { atk: 2.45, hp: 8.11, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "4-9": { atk: 2.45, hp: 8.11, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "4-10": { atk: 2.7, hp: 10.54, firstMonsterId: 0, defaultMonsterId: 0, stageType: 3 },
  "5-1": { atk: 2.83, hp: 6.72, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "5-2": { atk: 2.83, hp: 6.72, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "5-3": { atk: 2.83, hp: 6.72, firstMonsterId: 0, defaultMonsterId: 0, stageType: 5 },
  "5-4": { atk: 2.83, hp: 6.72, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "5-5": { atk: 3.11, hp: 8.74, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "5-6": { atk: 3.11, hp: 8.74, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "5-7": { atk: 3.11, hp: 8.74, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "5-8": { atk: 3.42, hp: 11.36, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "5-9": { atk: 3.42, hp: 11.36, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "5-10": { atk: 3.76, hp: 14.77, firstMonsterId: 0, defaultMonsterId: 0, stageType: 3 },
  "6-1": { atk: 3.96, hp: 9.4, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "6-2": { atk: 3.96, hp: 9.4, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "6-3": { atk: 3.96, hp: 9.4, firstMonsterId: 0, defaultMonsterId: 0, stageType: 5 },
  "6-4": { atk: 3.96, hp: 9.4, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "6-5": { atk: 4.36, hp: 12.22, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "6-6": { atk: 4.36, hp: 12.22, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "6-7": { atk: 4.36, hp: 12.22, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "6-8": { atk: 4.8, hp: 15.89, firstMonsterId: 0, defaultMonsterId: 0, stageType: 2 },
  "6-9": { atk: 4.8, hp: 15.89, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 },
  "6-10": { atk: 5.28, hp: 20.66, firstMonsterId: 0, defaultMonsterId: 0, stageType: 3 },
};

const CHAPTER_THEMES = ["forest", "desert", "snow", "swamp", "ruins", "eastern"];
const CHAPTER_PASSIVE_BY_CHAPTER = {
  1: "1031",
  2: "1032",
  3: "1033",
  4: "1030",
  5: "1017",
  6: "1027",
  7: "1031",
  8: "1032",
  9: "1033",
  10: "1030",
  11: "1017",
  12: "1027",
  13: "1031",
  14: "1032",
  15: "1033",
  16: "1030",
  17: "1017",
  18: "1027",
  19: "1031",
  20: "1032",
  21: "1033",
  22: "1030",
  23: "1017",
  24: "1027",
  25: "1031",
  26: "1032",
  27: "1033",
  28: "1030",
  29: "1017",
  30: "1027",
};

function chapterThemeId(chapter) {
  const ch = Math.max(1, Math.floor(chapter || 1));
  return CHAPTER_THEMES[(ch - 1) % CHAPTER_THEMES.length];
}

function chapterThemeNo(chapter) {
  const ch = Math.max(1, Math.floor(chapter || 1));
  return ((ch - 1) % CHAPTER_THEMES.length) + 1;
}

function enemyMatchesChapterTheme(enemy, chapter) {
  if (!enemy) return false;
  const requiredTheme = chapterThemeNo(chapter);
  return Number(enemy.monsterTheme || 0) === requiredTheme;
}

function finalBossPassiveIdsForChapter(chapter) {
  return [];
}

function chapterTraitPassiveId(chapter) {
  const ch = Math.max(1, Math.floor(chapter || 1));
  return CHAPTER_PASSIVE_BY_CHAPTER[ch] || CHAPTER_PASSIVE_BY_CHAPTER[1];
}

function stageBalanceFor(chapter, stage) {
  const key = `${Math.max(1, Math.floor(chapter || 1))}-${Math.max(1, Math.floor(stage || 1))}`;
  return STAGE_BALANCE[key] || { atk: 1, hp: 1, firstMonsterId: 0, defaultMonsterId: 0, stageType: 1 };
}

function chapterEnemyPoolIds(chapter, bossOnly = false) {
  const ch = Math.max(1, Math.floor(chapter || 1));
  const themed = ENEMIES.filter((enemy) =>
    enemyMatchesChapterTheme(enemy, ch) &&
    (enemy.minChapter || enemy.chapter || 1) <= ch &&
    (bossOnly ? enemy.kind === 4 : enemy.kind !== 4)
  );
  if (themed.length) return themed.map((enemy) => enemy.id);
  const eligible = ENEMIES.filter((enemy) => (enemy.minChapter || enemy.chapter || 1) <= ch && (bossOnly ? enemy.kind === 4 : enemy.kind !== 4));
  return eligible.length ? eligible.map((enemy) => enemy.id) : ENEMIES.map((enemy) => enemy.id);
}
