(function () {
  if (document.getElementById("chatnav-sidebar")) return;

  const CONTAINER_SEL = "div.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1";
  const SIDEBAR_W = 164;
  const SIDEBAR_W_COL = 20;

  // ── Styles ───────────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #chatnav-sidebar {
      position: fixed;
      top: 64px;
      width: ${SIDEBAR_W}px;
      max-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", ui-sans-serif, sans-serif;
      z-index: 9999;
      overflow: hidden;
      transition: width 0.2s ease;
    }

    #chatnav-sidebar.cn-col {
      width: ${SIDEBAR_W_COL}px;
    }
    #chatnav-sidebar.cn-col #chatnav-body { display: none; }

    #chatnav-toggle {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(107,114,128,0.5);
      font-size: 14px;
      line-height: 1;
      padding: 0 2px;
      align-self: flex-start;
      margin-bottom: 4px;
      transition: color 0.15s;
      flex-shrink: 0;
    }
    #chatnav-toggle:hover { color: rgba(107,114,128,0.9); }

    #chatnav-body {
      overflow-y: auto;
      flex: 1;
      scrollbar-width: none;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    #chatnav-body::-webkit-scrollbar { display: none; }

    .cn-pair {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-bottom: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(107,114,128,0.12);
    }
    .cn-pair:last-child { border-bottom: none; margin-bottom: 0; }

    .cn-user-row {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .cn-user-bubble {
      flex: 1;
      min-width: 0;
      font-size: 10px;
      font-weight: 500;
      line-height: 1.35;
      color: #374151;
      background: rgba(107,114,128,0.1);
      border-radius: 8px;
      padding: 3px 6px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      cursor: pointer;
      transition: background 0.1s;
    }

    @media (prefers-color-scheme: dark) {
      .cn-user-bubble {
        color: #d1d5db;
        background: rgba(255,255,255,0.09);
      }
      #chatnav-toggle { color: rgba(156,163,175,0.45); }
      #chatnav-toggle:hover { color: rgba(156,163,175,0.9); }
      .cn-resp-text { color: rgba(156,163,175,0.65) !important; }
      .cn-pair { border-bottom-color: rgba(255,255,255,0.07); }
      .cn-arrow-btn { color: rgba(156,163,175,0.4) !important; }
      .cn-arrow-btn:hover { color: rgba(156,163,175,0.8) !important; }
      .cn-counter { color: rgba(156,163,175,0.35) !important; }
    }

    .cn-user-bubble:hover { background: rgba(107,114,128,0.17); }

    .cn-resp-text {
      font-size: 10px;
      line-height: 1.35;
      color: rgba(107,114,128,0.7);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      padding: 0 2px;
      cursor: pointer;
    }
    .cn-resp-text:hover { color: rgba(107,114,128,1); }

    .cn-nav-row {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0;
      height: 16px;
    }

    .cn-arrow-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(107,114,128,0.4);
      font-size: 12px;
      padding: 0;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      align-self: center;
      transition: color 0.1s;
      flex-shrink: 0;
    }
    .cn-arrow-btn:hover { color: rgba(107,114,128,0.9); }
    .cn-arrow-btn:disabled {
      opacity: 0.2;
      cursor: default;
      pointer-events: none;
    }

    .cn-counter {
      font-size: 10px;
      color: rgba(107,114,128,0.35);
      white-space: nowrap;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      align-self: center;
      line-height: 1;
    }

    .cn-arrow-btn svg {
      display: block;
    }

    .cn-empty {
      font-size: 10px;
      color: rgba(107,114,128,0.4);
      line-height: 1.5;
      padding: 2px;
    }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────────
  const sidebar = document.createElement("div");
  sidebar.id = "chatnav-sidebar";
  sidebar.innerHTML = `
    <button id="chatnav-toggle" title="Toggle nav">‹</button>
    <div id="chatnav-body"><div class="cn-empty">Send a message to build your nav.</div></div>
  `;
  document.body.appendChild(sidebar);

  const toggleBtn = document.getElementById("chatnav-toggle");
  toggleBtn.addEventListener("click", () => {
    const c = sidebar.classList.toggle("cn-col");
    toggleBtn.textContent = c ? "›" : "‹";
    positionSidebar();
  });

  // ── Position sidebar to the right of the content container ───────────────────
  function positionSidebar() {
    const container = document.querySelector(CONTAINER_SEL);
    const collapsed = sidebar.classList.contains("cn-col");
    const w = collapsed ? SIDEBAR_W_COL : SIDEBAR_W;

    if (container) {
      const rect = container.getBoundingClientRect();
      const idealLeft = rect.right + 6;
      const maxLeft = window.innerWidth - w - 6;
      sidebar.style.left = Math.min(idealLeft, maxLeft) + "px";
    } else {
      sidebar.style.left = (window.innerWidth - w - 6) + "px";
    }
    sidebar.style.right = "auto";
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function parseSummaryJson(text) {
    const match = text.match(/<summary_json>([\s\S]*?)<\/summary_json>/);
    if (!match) return null;
    try { return JSON.parse(match[1].trim()); } catch { return null; }
  }

  function findEditCounter(turnEl) {
    const spans = turnEl.querySelectorAll("span");
    for (const span of spans) {
      if (/^\d+ \/ \d+$/.test(span.textContent.trim())) return span;
    }
    return null;
  }

  function findNativeNavButtons(counterSpan) {
    let el = counterSpan.parentElement;
    for (let i = 0; i < 5; i++) {
      if (!el) break;
      const buttons = el.querySelectorAll("button");
      if (buttons.length >= 2) return { prev: buttons[0], next: buttons[buttons.length - 1] };
      el = el.parentElement;
    }
    return null;
  }

  // ── Fallback text extraction (no JSON) ──────────────────────────────────────
  const CN_RE_SB = /\[cn\][\s\S]*?\[\/cn\]\s*/g;
  const SJ_RE_SB = /<summary_json>[\s\S]*?<\/summary_json>/g;

  function extractText(el, max, isUserTurn) {
    if (!el) return "";
    // Use textContent so display:none elements are still readable
    let raw = (el.textContent || "").trim();

    if (isUserTurn) raw = raw.replace(CN_RE_SB, "").trimStart();
    if (!isUserTurn) raw = raw.replace(SJ_RE_SB, "").trim();

    // Strip "You:" / "Claude:" / "Assistant:" role prefixes
    raw = raw.replace(/^(You|Claude|Assistant)\s*:\s*/i, "").trim();

    raw = raw.replace(/\s+/g, " ").trim();
    return raw.length > max ? raw.slice(0, max - 1) + "…" : raw;
  }

  // ── Read turns from Claude's DOM ─────────────────────────────────────────────
  function readTurns() {
    const container = document.querySelector(CONTAINER_SEL);
    if (!container) return [];

    const kids = Array.from(container.children);
    const turns = [];
    const paired = new Set();

    // First pass: JSON-anchored turns
    // Use textContent (not innerText) so JSON is found even after display:none scrubbing
    for (let i = 0; i < kids.length; i++) {
      const text = kids[i].textContent || "";
      const data = parseSummaryJson(text);
      if (!data || (!data.topic && !data.user_request && !data.response_one_line)) continue;

      const userTurn = kids[i - 1] && !paired.has(i - 1) ? kids[i - 1] : null;
      let counterSpan = null, navButtons = null, current = 1, total = 1;

      if (userTurn) {
        counterSpan = findEditCounter(userTurn);
        if (counterSpan) {
          const parts = counterSpan.textContent.trim().split(" / ");
          current = parseInt(parts[0], 10);
          total = parseInt(parts[1], 10);
          navButtons = findNativeNavButtons(counterSpan);
        }
        paired.add(i - 1);
      }
      paired.add(i);
      turns.push({ data, responseTurn: kids[i], userTurn, current, total, navButtons });
    }

    // Second pass: fallback pairs — only anchor on positively-identified user turns
    // (detected by the edit counter span Claude renders on every user message)
    const unpaired = kids.map((el, i) => ({ el, i })).filter(({ i }) => !paired.has(i));
    let j = 0;
    while (j < unpaired.length) {
      const { el: userEl, i: userIdx } = unpaired[j];
      // Only treat this element as a user turn if it has Claude's edit counter
      if (!findEditCounter(userEl)) { j++; continue; }

      const next = unpaired[j + 1];
      const respEl = next ? next.el : null;
      const userText = extractText(userEl, 80, true);
      const respText = respEl ? extractText(respEl, 80, false) : "";
      if (userText || respText) {
        turns.push({
          data: { user_request: userText, response_one_line: respText },
          responseTurn: respEl || userEl,
          userTurn: userEl,
          current: 1, total: 1, navButtons: null
        });
      }
      j += respEl ? 2 : 1;
    }

    // Sort by DOM position
    turns.sort((a, b) => kids.indexOf(a.responseTurn) - kids.indexOf(b.responseTurn));
    return turns;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  let lastRenderKey = "";

  function render() {
    positionSidebar();
    const body = document.getElementById("chatnav-body");
    const turns = readTurns();

    const renderKey = turns.map(t =>
      `${t.data.topic || ""}|${t.data.user_request || ""}|${t.data.response_one_line || ""}|${t.current}/${t.total}`
    ).join("::");

    if (renderKey === lastRenderKey) return;
    lastRenderKey = renderKey;
    body.innerHTML = "";

    if (!turns.length) {
      body.innerHTML = `<div class="cn-empty">Send a message to build your nav.</div>`;
      return;
    }

    for (const turn of turns) {
      const { data, responseTurn, userTurn, current, total, navButtons } = turn;
      const multi = total > 1;
      const hasPrev = navButtons && current > 1;
      const hasNext = navButtons && current < total;

      const pair = document.createElement("div");
      pair.className = "cn-pair";

      // ── User row ──
      const userRow = document.createElement("div");
      userRow.className = "cn-user-row";

      const bubble = document.createElement("div");
      bubble.className = "cn-user-bubble";
      bubble.title = data.user_request || "";
      bubble.textContent = data.user_request || data.topic || "";
      bubble.addEventListener("click", () => {
        const target = userTurn || responseTurn;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      userRow.appendChild(bubble);
      pair.appendChild(userRow);

      // ── Response row ──
      const respText = document.createElement("div");
      respText.className = "cn-resp-text";
      respText.title = data.response_one_line || "";
      respText.textContent = data.response_one_line || data.topic || "";
      respText.addEventListener("click", () => {
        responseTurn.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pair.appendChild(respText);

      // ── Nav row (only if multi-edit) ──
      if (multi) {
        const navRow = document.createElement("div");
        navRow.className = "cn-nav-row";

        const prevBtn = document.createElement("button");
        prevBtn.className = "cn-arrow-btn";
        prevBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
        prevBtn.disabled = !hasPrev;
        if (hasPrev) {
          prevBtn.addEventListener("click", () => {
            navButtons.prev.click();
            setTimeout(render, 400);
          });
        }

        const counter = document.createElement("span");
        counter.className = "cn-counter";
        counter.textContent = `${current}/${total}`;

        const nextBtn = document.createElement("button");
        nextBtn.className = "cn-arrow-btn";
        nextBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
        nextBtn.disabled = !hasNext;
        if (hasNext) {
          nextBtn.addEventListener("click", () => {
            navButtons.next.click();
            setTimeout(render, 400);
          });
        }

        navRow.appendChild(prevBtn);
        navRow.appendChild(counter);
        navRow.appendChild(nextBtn);
        pair.appendChild(navRow);
      }

      body.appendChild(pair);
    }
  }

  // ── Observer ─────────────────────────────────────────────────────────────────
  let scanTimer;
  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(render, 600);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.addEventListener("resize", () => { positionSidebar(); });

  // ── Conversation change detection ────────────────────────────────────────────
  let currentPath = location.pathname;
  new MutationObserver(() => {
    if (location.pathname !== currentPath) {
      currentPath = location.pathname;
      lastRenderKey = "";
      render();
    }
  }).observe(document, { subtree: true, childList: true });

  render();
})();
