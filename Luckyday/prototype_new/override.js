/* ═══════════════════════════════════════════════════════════════
   override.js — 운수좋은날 UI/연출 개선 패치 (프로토 3)
   기존 함수 최소 수정, DOM 관찰로 파티클 burst 추가.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 1. 장식 발동 시 아이콘 위치에서 파티클 burst
  //    sb__decoIcon--active 클래스 감지 → 파티클 터뜨리기
  // ─────────────────────────────────────────────

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

      // 방사형 퍼짐 — 위쪽 방향에 더 많이 쏘기 (발라트로 느낌)
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

        // active 클래스가 새로 붙었을 때만 burst (중복 방지)
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

  // ─────────────────────────────────────────────
  // 2. 배율 변경 시 데미지 실시간 카운트업
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // 3. 잭팟 폭죽 연출 (Canvas 기반)
  // ─────────────────────────────────────────────

  (function () {
    const FIREWORK_COLORS = [
      '#f5bc2e', '#ff8c42', '#ff5252', '#5ce8a0',
      '#30b5ff', '#ffe566', '#ffffff', '#ff80ab',
    ];

    let animFrameId = null;
    let particles   = [];
    let canvas, ctx;

    function getCanvas() {
      if (!canvas) {
        canvas = document.getElementById('fireworksCanvas');
        if (canvas) ctx = canvas.getContext('2d');
      }
      return canvas;
    }

    function resizeCanvas() {
      const c = getCanvas();
      if (!c) return;
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
    }

    function randomBetween(a, b) {
      return a + Math.random() * (b - a);
    }

    // 단일 로켓 → 폭발
    function explode(x, y) {
      const count  = Math.floor(randomBetween(60, 90));
      const color  = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      const color2 = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = randomBetween(2.5, 7.5);
        const c     = Math.random() < 0.5 ? color : color2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: c,
          radius: randomBetween(2, 4.5),
          decay: randomBetween(0.012, 0.022),
          gravity: 0.12,
          trail: Math.random() < 0.4,
        });
      }
    }

    // 랜덤 위치에 연속으로 폭발시키기
    let allBurstsScheduled = false;
    let burstTimers = [];
    const TOTAL_BURSTS = 12;
    const BURST_INTERVAL = 280; // ms

    function scheduleBursts() {
      allBurstsScheduled = false;
      burstTimers.forEach(clearTimeout);
      burstTimers = [];

      const cw = (canvas || { width: window.innerWidth  }).width;
      const ch = (canvas || { height: window.innerHeight }).height;

      for (let i = 0; i < TOTAL_BURSTS; i++) {
        const t = setTimeout(() => {
          resizeCanvas();
          const x = randomBetween(cw * 0.1, cw * 0.9);
          const y = randomBetween(ch * 0.08, ch * 0.6);
          explode(x, y);
          if (i % 3 === 0) {
            explode(
              randomBetween(cw * 0.1, cw * 0.9),
              randomBetween(ch * 0.08, ch * 0.55)
            );
          }
          if (i === TOTAL_BURSTS - 1) allBurstsScheduled = true;
        }, i * BURST_INTERVAL);
        burstTimers.push(t);
      }
    }

    function animate() {
      const c = getCanvas();
      if (!c) return;

      ctx.clearRect(0, 0, c.width, c.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.alpha -= p.decay;

        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.trail) {
          // 꼬리 효과
          ctx.shadowBlur  = 8;
          ctx.shadowColor = p.color;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(animate);

      // 모든 폭발이 끝나고 파티클도 다 사라지면 캔버스 숨기기
      if (allBurstsScheduled && particles.length === 0) {
        stopFireworks();
      }
    }

    function startFireworks() {
      const c = getCanvas();
      if (!c) return;
      particles = [];
      if (animFrameId) cancelAnimationFrame(animFrameId);
      resizeCanvas();
      c.classList.add('fireworks--active');
      scheduleBursts();
      animFrameId = requestAnimationFrame(animate);

      // 최대 5초 후 강제 종료 (안전장치)
      setTimeout(stopFireworks, 5000);
    }

    function stopFireworks() {
      const c = getCanvas();
      if (c) c.classList.remove('fireworks--active');
      if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      burstTimers.forEach(clearTimeout);
      burstTimers = [];
      particles  = [];
      burstCount = TOTAL_BURSTS;
    }

    window.addEventListener('resize', resizeCanvas);

    // ── 잭팟 감지 ──
    function setupJackpotObserver() {
      const jackpotEl = document.getElementById('jackpotText');
      if (!jackpotEl) return;

      const observer = new MutationObserver(() => {
        const text = (jackpotEl.textContent || '').trim();
        // "예 (+N)" 형태일 때 폭죽 발사
        if (text.startsWith('예')) {
          startFireworks();
        }
      });

      observer.observe(jackpotEl, { characterData: true, childList: true, subtree: true });
    }

    setupJackpotObserver();
  })();

  // ─────────────────────────────────────────────
  // 4. 이스터에그 — 로고 5번 클릭 시 폭죽 + 토스트
  // ─────────────────────────────────────────────

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      background: rgba(20,12,6,0.88);
      color: #f5bc2e;
      font-size: 20px;
      font-weight: 900;
      padding: 18px 32px;
      border-radius: 20px;
      border: 2px solid rgba(245,188,46,0.6);
      box-shadow: 0 8px 40px rgba(245,188,46,0.3);
      z-index: 99999;
      pointer-events: none;
      transition: transform 200ms ease, opacity 400ms ease;
      opacity: 0;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }

  function setupEasterEgg() {
    const logo = document.querySelector('.startScreen__logoArt');
    if (!logo) return;
    let clickCount = 0;
    let clickTimer = null;

    logo.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 800);

      if (clickCount >= 5) {
        clickCount = 0;
        clearTimeout(clickTimer);
        if (typeof startFireworks === 'function') startFireworks();
        showToast('🍀 오늘은 운수 좋은 날! 🍀');
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5. 럭키락 테스트 치트 — ` 키로 토글
  // ─────────────────────────────────────────────

  function setupLuckyLockCheat() {
    const turnEl = document.getElementById('turnText');
    if (!turnEl) return;

    let tapCount = 0;
    let tapTimer = null;

    turnEl.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 800);

      if (tapCount < 3) return;
      tapCount = 0;
      clearTimeout(tapTimer);

      if (typeof state === 'undefined' || !state.grid) return;

      if (state.luckyHoldActive) {
        state.luckyHoldActive = null;
        showToast('🔓 럭키락 해제');
      } else {
        const keys = new Set();
        for (let c = 0; c < 5; c++) keys.add(`0,${c}`);
        state.luckyHoldActive = { keys };
        showToast('🍀🔒 럭키락 테스트 ON');
      }

      if (typeof renderGrid === 'function') renderGrid(true);
    });
  }

  // ─────────────────────────────────────────────
  // 5. 스핀 버튼 햅틱
  // ─────────────────────────────────────────────

  function setupSpinHaptic() {
    const spinBtn = document.getElementById('spinBtn');
    if (!spinBtn || !navigator.vibrate) return;
    spinBtn.addEventListener('click', () => {
      try { navigator.vibrate(10); } catch (_) {}
    });
  }

  // ─────────────────────────────────────────────
  // 6. 낙뢰 타격 연출 — 번개 낙하 이펙트
  // ─────────────────────────────────────────────

  function spawnLightningStrike(count) {
    var journey = document.getElementById('journey');
    var enemy   = document.getElementById('journeyEnemy');
    if (!journey || !enemy) return;

    var jRect = journey.getBoundingClientRect();
    var eRect = enemy.getBoundingClientRect();

    // 적 머리 위 기준: journey 상단(0) → 적 중앙 y
    var cx     = eRect.left - jRect.left + eRect.width  / 2;
    var boltH  = (eRect.top  - jRect.top  + eRect.height / 2);
    boltH = Math.max(30, boltH);

    for (var i = 0; i < count; i++) {
      (function (idx) {
        setTimeout(function () {
          var spread = (Math.random() - 0.5) * 24;
          var bx = cx + spread;

          // SVG 생성
          var NS  = 'http://www.w3.org/2000/svg';
          var svg = document.createElementNS(NS, 'svg');
          svg.classList.add('lightning-bolt-svg');
          svg.setAttribute('viewBox', '0 0 20 ' + boltH);
          svg.style.cssText =
            'left:' + (bx - 10) + 'px;' +
            'top:0;' +
            'width:20px;' +
            'height:' + boltH + 'px;';

          // zig-zag 경로 (위 → 아래)
          var segs = 7;
          var sh   = boltH / segs;
          var d    = 'M 10,0';
          for (var s = 1; s <= segs; s++) {
            d += ' L ' + (10 + (s % 2 === 0 ? -6 : 6)) + ',' + (s * sh);
          }

          var path = document.createElementNS(NS, 'path');
          path.setAttribute('d', d);
          path.setAttribute('stroke', '#ffe566');
          path.setAttribute('stroke-width', '2.5');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          svg.style.filter =
            'drop-shadow(0 0 3px #ffe033) drop-shadow(0 0 7px rgba(255,255,180,0.8))';

          svg.appendChild(path);
          journey.appendChild(svg);

          // 화면 플래시
          var flash = document.createElement('div');
          flash.className = 'lightning-flash';
          journey.appendChild(flash);

          setTimeout(function () { svg.remove(); flash.remove(); }, 450);
        }, idx * 90);
      }(i));
    }
  }

  function patchDrawEnemyLightningBolt() {
    if (typeof window.drawEnemyLightningBolt !== 'function') return false;
    var _orig = window.drawEnemyLightningBolt;
    window.drawEnemyLightningBolt = function () {
      _orig.call(this);
      spawnLightningStrike(1);
    };
    return true;
  }

  // ─────────────────────────────────────────────
  // 7. 스킬 아이콘 HUD — 전투 좌상단 획득 스킬 표시
  // ─────────────────────────────────────────────

  function renderSkillHud() {
    const hud = document.getElementById('skillIconHud');
    if (!hud) return;

    const skills =
      typeof state !== 'undefined' && state.player && Array.isArray(state.player.skills)
        ? state.player.skills
        : [];

    const iconMap = window.SKILL_ICON_MAP || {};

    hud.innerHTML = '';

    for (const skill of skills) {
      const id = skill && skill.id ? skill.id : '';
      const iconNum = iconMap[id] || 'skill_0000';
      const grade = (skill && skill.grade) ? skill.grade : '';

      const box = document.createElement('div');
      box.className = 'skill-hud-icon' + (grade ? ' skill-hud-icon--' + grade : '');
      box.title = id;

      const img = document.createElement('img');
      img.src = 'Images/IconSkill/' + iconNum + '.png';
      img.alt = '';

      box.appendChild(img);
      hud.appendChild(box);
    }
  }

  function patchRenderAll() {
    if (typeof window.renderAll !== 'function') return false;
    const _orig = window.renderAll;
    window.renderAll = function (fresh) {
      _orig.call(this, fresh);
      renderSkillHud();
    };
    return true;
  }

  // ─────────────────────────────────────────────
  // 8. 패턴 발동 강화 연출 — SVG 선 트레이스 + 셀 버스트
  // ─────────────────────────────────────────────

  function spawnPatternBurstFx(elementId) {
    var gridEl   = document.getElementById('grid');
    var gridWrap = document.getElementById('gridWrap');
    if (!gridEl || !gridWrap) return;

    var allCells   = Array.from(gridEl.querySelectorAll('.cell'));
    var patternEls = Array.from(gridEl.querySelectorAll('.cell--pattern'));
    if (!patternEls.length) return;

    var NCOLS = 5;
    var patternRC = patternEls.map(function(el) {
      var idx = allCells.indexOf(el);
      return { el: el, r: Math.floor(idx / NCOLS), c: idx % NCOLS };
    });

    var wrapRect = gridWrap.getBoundingClientRect();

    function cellCenter(r, c) {
      for (var i = 0; i < patternRC.length; i++) {
        if (patternRC[i].r === r && patternRC[i].c === c) {
          var rect = patternRC[i].el.getBoundingClientRect();
          return {
            x: rect.left - wrapRect.left + rect.width  / 2,
            y: rect.top  - wrapRect.top  + rect.height / 2,
          };
        }
      }
      return null;
    }

    var keys = {};
    patternRC.forEach(function(p) { keys[p.r + ',' + p.c] = true; });
    var n = patternRC.length;

    // 패턴 종류 판별 → SVG 경로 세그먼트 결정
    var segments = [];

    if (n >= 7 && keys['0,2'] && keys['2,0'] && keys['2,4']) {
      // 정삼각형: apex(0,2) → 좌하(2,0) → 우하(2,4) → 닫기
      var p0 = cellCenter(0,2), p1 = cellCenter(2,0), p2 = cellCenter(2,4);
      if (p0 && p1 && p2) segments.push([p0, p1, p2, p0]);

    } else if (n >= 7 && keys['0,0'] && keys['0,4'] && keys['2,2']) {
      // 역삼각형: 좌상(0,0) → 우상(0,4) → apex(2,2) → 닫기
      var p0 = cellCenter(0,0), p1 = cellCenter(0,4), p2 = cellCenter(2,2);
      if (p0 && p1 && p2) segments.push([p0, p1, p2, p0]);

    } else if (n === 5 && keys['0,1'] && keys['0,3'] && keys['1,2'] && keys['2,1'] && keys['2,3']) {
      // X 패턴: 두 대각선
      var tl = cellCenter(0,1), tr = cellCenter(0,3), ce = cellCenter(1,2);
      var bl = cellCenter(2,1), br = cellCenter(2,3);
      if (tl && ce && br) segments.push([tl, ce, br]);
      if (tr && ce && bl) segments.push([tr, ce, bl]);

    } else if (n === 5 && keys['0,2'] && keys['1,1'] && keys['1,2'] && keys['1,3'] && keys['2,2']) {
      // 별자리(십자): 세로 + 가로
      var top = cellCenter(0,2), bot = cellCenter(2,2);
      var lft = cellCenter(1,1), rgt = cellCenter(1,3);
      if (top && bot) segments.push([top, bot]);
      if (lft && rgt) segments.push([lft, rgt]);

    } else {
      // 폴백: 모든 패턴 셀 연결
      var pts = patternRC.map(function(p) { return cellCenter(p.r, p.c); }).filter(Boolean);
      if (pts.length >= 2) segments.push(pts);
    }

    var GLOW_COL = {
      fire:   'rgba(255,112,64,0.24)',
      light:  'rgba(247,208,64,0.24)',
      nature: 'rgba(86,212,100,0.24)',
      water:  'rgba(64,200,247,0.24)',
    };
    var LINE_COL = {
      fire:   '#ff7040',
      light:  '#f7d040',
      nature: '#56d464',
      water:  '#40c8f7',
    };
    var glowCol = GLOW_COL[elementId] || 'rgba(247,208,64,0.24)';
    var lineCol = LINE_COL[elementId] || '#f7d040';

    // ① 그리드 플래시
    var flash = document.createElement('div');
    flash.className = 'o-patternGridFlash';
    flash.style.background = glowCol;
    gridWrap.appendChild(flash);
    setTimeout(function() { if (flash.parentNode) flash.remove(); }, 480);

    // ② 그리드 셰이크
    gridWrap.classList.remove('o-patternShake');
    void gridWrap.offsetWidth;
    gridWrap.classList.add('o-patternShake');
    setTimeout(function() { gridWrap.classList.remove('o-patternShake'); }, 420);

    // ③ 각 패턴 셀 버스트
    patternEls.forEach(function(el) {
      var burst = document.createElement('div');
      burst.className = 'o-patternCellBurst';
      burst.style.setProperty('--burst-col', lineCol);
      el.appendChild(burst);
      setTimeout(function() { if (burst.parentNode) burst.remove(); }, 640);
    });

    // ④ SVG 라인 트레이스
    if (!segments.length) return;

    var NS  = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:26;overflow:visible';

    var filterId = 'pfx' + Date.now();
    var defs = document.createElementNS(NS, 'defs');
    var filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
    filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
    var feBlur = document.createElementNS(NS, 'feGaussianBlur');
    feBlur.setAttribute('in', 'SourceGraphic');
    feBlur.setAttribute('stdDeviation', '4');
    feBlur.setAttribute('result', 'blur');
    var feMerge = document.createElementNS(NS, 'feMerge');
    ['blur', 'SourceGraphic'].forEach(function(src) {
      var mn = document.createElementNS(NS, 'feMergeNode');
      mn.setAttribute('in', src);
      feMerge.appendChild(mn);
    });
    filter.appendChild(feBlur);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    var pathEls = segments.map(function(pts) {
      var pts2 = pts.filter(Boolean);
      if (pts2.length < 2) return null;
      var d = pts2.map(function(p, i) {
        return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }).join(' ');
      var pe = document.createElementNS(NS, 'path');
      pe.setAttribute('d', d);
      pe.setAttribute('fill', 'none');
      pe.setAttribute('stroke', lineCol);
      pe.setAttribute('stroke-width', '3.5');
      pe.setAttribute('stroke-linecap', 'round');
      pe.setAttribute('stroke-linejoin', 'round');
      pe.setAttribute('filter', 'url(#' + filterId + ')');
      pe.style.opacity = '0';
      svg.appendChild(pe);
      return pe;
    }).filter(Boolean);

    gridWrap.appendChild(svg);

    // DOM 추가 후 draw-on 애니메이션
    requestAnimationFrame(function() {
      pathEls.forEach(function(pe) {
        var len = pe.getTotalLength ? pe.getTotalLength() : 200;
        pe.style.strokeDasharray = len + ' ' + len;
        pe.style.strokeDashoffset = len + '';
        pe.style.opacity = '1';
        void pe.getBoundingClientRect();
        pe.style.transition = 'stroke-dashoffset 0.40s ease-out';
        requestAnimationFrame(function() {
          pe.style.strokeDashoffset = '0';
          setTimeout(function() {
            pe.style.transition = 'opacity 0.30s ease-in';
            pe.style.opacity = '0';
          }, 400);
        });
      });
      setTimeout(function() { if (svg.parentNode) svg.remove(); }, 820);
    });
  }

  // ─────────────────────────────────────────────
  // 9. 스킬 선택 모달 — 심볼 등장 확률 게이지 바
  // ─────────────────────────────────────────────

  function renderSymbolOddsBar() {
    var barEl = document.getElementById('symbolOddsBar');
    if (!barEl) return;
    if (typeof symbolWeights !== 'function') return;

    var weights = symbolWeights();
    var total = weights.reduce(function(s, w) { return s + w.w; }, 0) || 1;

    var ELEM = {
      fire:   { emoji: '🔥', bg: '#b84020' },
      light:  { emoji: '⚡', bg: '#906a00' },
      nature: { emoji: '🌿', bg: '#2a7235' },
      water:  { emoji: '💧', bg: '#1258a0' },
    };

    barEl.innerHTML = '';
    barEl.removeAttribute('aria-hidden');

    var track = document.createElement('div');
    track.className = 'o-odds-track';

    weights.forEach(function(w) {
      var pct = Math.round(w.w / total * 100);
      var cfg = ELEM[w.id] || { emoji: '?', bg: '#555' };

      var seg = document.createElement('div');
      seg.className = 'o-odds-seg';
      seg.style.flex = String(w.w);
      seg.style.background = cfg.bg;
      seg.title = w.id + ' ' + pct + '%';
      seg.innerHTML =
        '<span class="o-odds-emoji">' + cfg.emoji + '</span>' +
        '<span class="o-odds-pct">' + pct + '%</span>';

      track.appendChild(seg);
    });

    barEl.appendChild(track);
  }

  function clearSymbolOddsBar() {
    var barEl = document.getElementById('symbolOddsBar');
    if (!barEl) return;
    barEl.innerHTML = '';
    barEl.setAttribute('aria-hidden', 'true');
  }

  function setupSymbolOddsBarObserver() {
    var modal = document.getElementById('modal');
    if (!modal) return;

    var observer = new MutationObserver(function() {
      if (modal.classList.contains('modal--open')) {
        var kicker = document.getElementById('modalKicker');
        if (kicker && kicker.textContent.trim() === '레벨 업') {
          renderSymbolOddsBar();
        } else {
          clearSymbolOddsBar();
        }
      } else {
        clearSymbolOddsBar();
      }
    });

    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  function patchShowFxToastForPattern() {
    if (typeof window.showFxToast !== 'function') return false;
    var _orig = window.showFxToast;
    window.showFxToast = function(opts) {
      _orig.call(this, opts);
      if (window._lastPatternFx) {
        var eid = window._lastPatternFx.elementId;
        window._lastPatternFx = null;
        setTimeout(function() { spawnPatternBurstFx(eid); }, 20);
      }
    };
    return true;
  }

  // ─────────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────────

  function init() {
    setupDecoActiveObserver();
    setupMultObserver();
    setupSnapshotObserver();
    setupResetObserver();
    setupSpinHaptic();
    setupEasterEgg();
    setupLuckyLockCheat();
    setupSymbolOddsBarObserver();

    if (!patchDrawEnemyLightningBolt()) {
      var _boltTid = setInterval(function () {
        if (patchDrawEnemyLightningBolt()) clearInterval(_boltTid);
      }, 100);
      setTimeout(function () { clearInterval(_boltTid); }, 3000);
    }

    renderSkillHud();
    if (!patchRenderAll()) {
      // renderAll이 아직 없을 경우 대비 (안전장치)
      const tid = setInterval(function () {
        if (patchRenderAll()) clearInterval(tid);
      }, 100);
      setTimeout(function () { clearInterval(tid); }, 3000);
    }

    if (!patchShowFxToastForPattern()) {
      var _pfxTid = setInterval(function () {
        if (patchShowFxToastForPattern()) clearInterval(_pfxTid);
      }, 100);
      setTimeout(function () { clearInterval(_pfxTid); }, 3000);
    }

    console.log('[프로토 3] override.js 초기화 완료');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
