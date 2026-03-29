# 모바일 게임 UX/UI 설계 원칙 조사

> 조사일: 2026-03-29 | 조사 대원: 치즈김밥 (Sonnet 에이전트)
> 출처: GDC, Apple Developer, GameRefinery, Smashing Magazine 등

---

## 1. 튜토리얼 설계 원칙

### "가르치지 말고 체험하게 하라"
- Apple 공식: "Get players into core gameplay within minutes using interactive tutorials"
- GameRefinery: "Players discover mechanics by doing rather than reading"
- 30초 안에 파워 판타지 보여주고 Micro-Win 줘야 함

### 강제 vs 자유 — 데이터
- 3단계 가이드: 완료율 **72%**
- 7단계 가이드: 완료율 **16%**
- 정답: 하이브리드 — 핵심 2~3개만 강제, 나머지 자연 탐색

### 참신한 메커닉 교육 법칙
1. 제일 쉬운 버전을 먼저 → 결과가 무조건 좋게
2. 텍스트 금지 → 숫자와 시각으로
3. 첫 체험 = 즉각적 성취감 연결

### Aha Moment 3단계
- 0~30초: Micro-Win
- 1~3분: Core Fun 체험
- 3~5분: 욕심 유발

### 이탈 데이터
- 가장 많은 이탈: 첫 3~5분
- 모바일 MMO 첫 세션 평균: **8분**
- 튜토리얼 최적화 후 D1 리텐션 **+18%** 가능

## 2. 모바일 UI 패턴

### Thumb Zone
- 75%가 엄지 조작
- GREEN(하단)=핵심 / YELLOW(중간)=2순위 / RED(상단)=회피
- 최소 탭 타깃: 48x48px

### 정보 과부하 방지
- Miller's Law: 동시 7±2개 항목 한계
- HUD 핵심 정보: 3~5개 이하
- Progressive Disclosure: 처음엔 숨기고 필요할 때 공개

### UI 실수 TOP 5
1. 불명확한 온보딩
2. 정보 과부하
3. 탭 피드백 없음
4. 너무 작은 탭 타깃
5. 불일관한 디자인 언어

## 3. FTUE 설계

### 첫 5분의 법칙
1. 10초: "이 게임이 뭔지" 이해
2. 30~45초: 첫 행동
3. 5분: "또 하고 싶다" 상태

### 전달해야 하는 3가지
1. 핵심 재미 (직접 체험으로)
2. 성장 느낌 (숫자/레벨업 피드백)
3. 미완의 목표 (재방문 동기)

### 과금 노출 타이밍
- 너무 빠름(첫 세션) = 이탈
- 최적: 코어 루프 이해 후, 첫 벽 만났을 때
- 리워드 광고 FTUE 체험 유저 → IAP 전환 **5배**

## 4. 정보 공개 전략

### Progressive Disclosure 타임라인
- Day 1: 핵심 전투만
- Day 2~3: PvP/소셜
- Day 4~5: 길드/클랜
- Day 7+: 심층 콘텐츠

### 3-레이어 목표 시스템
- 즉각(0~10분): 화면 화살표/강조
- 단기(오늘): 로비에 항상 표시
- 장기(이번 주): 탭 안에 배치

### 배지/알림
- OK: 일일 보상, 새 콘텐츠(1회), 마감 임박
- 금지: 무의미 알림, 기지 정보 반복, 3탭 동시 뱃지

## 5. 복귀 유저 UX
- 즉시: 환영 보상 + 변경 요약 + 빠른 재진입
- UI 대규모 변경 금지 (복귀 혼란 최대 원인)
- 튜토리얼 재표시 = 모욕 → 스킵 필수

## 6. 로그라이트 특화 UX

### 런 시작: 로비→2탭 이내→게임
### 스킬 선택: 3카드 하단 배치, 1~2줄 설명, 즉각 피드백
### 빌드 정보: 가장자리 소아이콘, 탭으로 상세
### 사망 화면 공식:
1. 결과 간결하게(숫자 3~4개)
2. 다음 런의 이유 제시
3. 영구 성장 표시
4. "다시 하기" = 주 CTA, 크고 가까이

출처: GameAnalytics, GameRefinery, Apple Developer WWDC24, Smashing Magazine, iabdi.com, Sonamine, solar-engine, Braze, GDevelop, Mistplay, Celia Hodent
