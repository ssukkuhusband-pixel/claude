// SkillColection: popup-based skill codex with 6 tabs.
// Drop-in script: load after skill data is available.

(function () {
  const ELEMENTS = ["light", "nature", "fire", "water"];
  const TAB_ORDER = ["light", "nature", "fire", "water", "fusion", "common"];
  const TAB_LABEL = {
    light: "번개",
    nature: "자연",
    fire: "불",
    water: "물",
    fusion: "융합",
    common: "공통",
  };

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getSkills() {
    // Works with non-module scripts that define top-level `const SKILLS = [...]`.
    try {
      // eslint-disable-next-line no-undef
      if (typeof SKILLS !== "undefined" && Array.isArray(SKILLS)) return SKILLS;
    } catch {
      // ignore
    }
    return [];
  }

  function skillText(skill) {
    const n = (skill && (skill.name || skill.id)) || "";
    const s = (skill && (skill.shortDesc || "")) || "";
    const d = (skill && (skill.desc || "")) || "";
    return `${n} ${s} ${d}`;
  }

  function elementTags(skill) {
    const tags = (skill && Array.isArray(skill.tags) ? skill.tags : []).filter(Boolean);
    return tags.filter((t) => ELEMENTS.includes(t));
  }

  function categoryForSkill(skill) {
    const el = elementTags(skill);
    if (el.length >= 2) return "fusion";
    if (el.length === 1) return el[0];

    const text = skillText(skill);
    const hits = new Set();
    if (text.includes("번개")) hits.add("light");
    if (text.includes("자연")) hits.add("nature");
    if (text.includes("불") || text.includes("화염")) hits.add("fire");
    if (text.includes("물")) hits.add("water");
    if (hits.size >= 2) return "fusion";
    if (hits.size === 1) return Array.from(hits)[0];
    return "common";
  }

  function ensureStyles() {
    if (document.getElementById("skillCodexStyle")) return;
    const style = document.createElement("style");
    style.id = "skillCodexStyle";
    style.textContent = `
      .modal#codexModal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; padding: 18px; background: rgba(0,0,0,0.54); z-index: 50; }
      .modal#codexModal.modal--open { display: flex; }
      .modal__card.codex { width: min(920px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); padding: 0; display: flex; flex-direction: column; overflow: hidden; border-radius: 18px; border: 1px solid rgba(255,255,255,0.16); background: linear-gradient(180deg, rgba(15,22,32,0.92), rgba(10,14,20,0.92)); box-shadow: 0 30px 90px rgba(0,0,0,0.55); color: rgba(255,255,255,0.88); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
      @supports not (height: 100dvh) { .modal__card.codex { max-height: calc(100vh - 24px); } }
      .codex__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 14px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .codex__title { margin: 0; font-size: 16px; font-weight: 900; }
      .codex__close { width: 28px; height: 28px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.80); font-weight: 900; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
      .codex__tabs { display: flex; gap: 8px; padding: 10px 14px 12px; overflow-x: auto; overflow-y: hidden; border-bottom: 1px solid rgba(255,255,255,0.08); -webkit-overflow-scrolling: touch; }
      .codex__tab { appearance: none; border: 1px solid rgba(255,255,255,0.14); background: rgba(0,0,0,0.20); color: rgba(255,255,255,0.88); border-radius: 999px; padding: 8px 12px; font-size: 13px; line-height: 1; white-space: nowrap; cursor: pointer; min-height: 36px; }
      .codex__tab.is-active { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.10); }
      .codex__body { flex: 1; min-height: 0; overflow: auto; padding: 12px 14px 14px; -webkit-overflow-scrolling: touch; }
      .codex__panel[hidden] { display: none; }
      .codex__hint { padding: 10px 14px 14px; color: rgba(255,255,255,0.62); font-size: 12px; }
      .codexSkill { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.035); border-radius: 16px; padding: 10px; }
      .codexSkill__name { font-weight: 900; font-size: 13px; }
      .codexSkill__short { margin-top: 4px; font-size: 12px; color: rgba(255,255,255,0.82); font-weight: 700; }
      .codexSkill__desc { margin-top: 4px; color: rgba(255,255,255,0.62); font-size: 12px; line-height: 1.35; }
      .codexList { display: grid; gap: 10px; }
    `;
    document.head.appendChild(style);
  }

  function ensureMarkup() {
    if (document.getElementById("codexModal")) return;
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "codexModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal__card codex" role="dialog" aria-modal="true" aria-labelledby="codexTitle">
        <div class="codex__header">
          <h2 class="codex__title" id="codexTitle">스킬 도감</h2>
          <button class="codex__close" id="codexCloseBtn" type="button" aria-label="닫기">✕</button>
        </div>
        <nav class="codex__tabs" id="codexTabs" role="tablist" aria-label="스킬 속성 탭"></nav>
        <div class="codex__body" id="codexBody" aria-label="스킬 목록"></div>
        <div class="codex__hint">ESC 또는 바깥을 클릭해서 닫기</div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function buildTabs(activeKey) {
    const tabs = document.getElementById("codexTabs");
    if (!tabs) return;
    tabs.innerHTML = "";
    for (const key of TAB_ORDER) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "codex__tab" + (key === activeKey ? " is-active" : "");
      b.setAttribute("role", "tab");
      b.dataset.tab = key;
      b.textContent = TAB_LABEL[key] || key;
      tabs.appendChild(b);
    }
  }

  function render(activeKey) {
    const body = document.getElementById("codexBody");
    if (!body) return;
    const skills = getSkills();

    const buckets = { light: [], nature: [], fire: [], water: [], fusion: [], common: [] };
    for (const s of skills) {
      const k = categoryForSkill(s);
      (buckets[k] || buckets.common).push(s);
    }

    body.innerHTML = "";
    for (const key of TAB_ORDER) {
      const panel = document.createElement("div");
      panel.className = "codex__panel";
      panel.dataset.panel = key;
      panel.setAttribute("role", "tabpanel");
      if (key !== activeKey) panel.setAttribute("hidden", "");

      const list = document.createElement("div");
      list.className = "codexList";
      const items = buckets[key] || [];
      for (const s of items) {
        const card = document.createElement("article");
        card.className = "codexSkill";
        const name = (s && (s.name || s.id)) || "";
        const shortDesc = (s && (s.shortDesc || "")) || "";
        const desc = (s && (s.desc || "")) || "";
        const shortHtml = shortDesc ? `<div class="codexSkill__short">${escapeHtml(shortDesc)}</div>` : "";
        const descHtml = desc ? `<div class="codexSkill__desc">${escapeHtml(desc)}</div>` : "";
        card.innerHTML = `<div class="codexSkill__name">${escapeHtml(name)}</div>${shortHtml}${descHtml}`;
        list.appendChild(card);
      }
      panel.appendChild(list);
      body.appendChild(panel);
    }
  }

  function setTab(key) {
    const tabs = document.getElementById("codexTabs");
    const modal = document.getElementById("codexModal");
    if (!tabs || !modal) return;

    const k = key || "light";
    for (const el of tabs.querySelectorAll(".codex__tab")) {
      el.classList.toggle("is-active", el.dataset.tab === k);
    }
    for (const el of modal.querySelectorAll(".codex__panel")) {
      if (el.dataset.panel === k) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
    window.__skillCodexTab = k;
  }

  function open() {
    const modal = document.getElementById("codexModal");
    if (!modal) return;
    const active = window.__skillCodexTab || "light";
    buildTabs(active);
    render(active);
    setTab(active);
    modal.classList.add("modal--open");
    modal.setAttribute("aria-hidden", "false");
  }

  function close() {
    const modal = document.getElementById("codexModal");
    if (!modal) return;
    modal.classList.remove("modal--open");
    modal.setAttribute("aria-hidden", "true");
  }

  function wire() {
    const modal = document.getElementById("codexModal");
    const closeBtn = document.getElementById("codexCloseBtn");
    const tabs = document.getElementById("codexTabs");
    if (closeBtn) closeBtn.addEventListener("click", () => close());
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
      });
    }
    if (tabs) {
      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".codex__tab");
        if (!btn || !btn.dataset || !btn.dataset.tab) return;
        const k = btn.dataset.tab;
        setTab(k);
        const body = document.getElementById("codexBody");
        if (body) body.scrollTop = 0;
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const m = document.getElementById("codexModal");
      if (!m) return;
      if (m.classList.contains("modal--open")) close();
    });
  }

  function install() {
    ensureStyles();
    ensureMarkup();
    wire();
    window.SkillColection = { open, close, render: () => render(window.__skillCodexTab || "light") };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
