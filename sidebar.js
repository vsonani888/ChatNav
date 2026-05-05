(function () {
  if (document.getElementById("chatnav-sidebar")) return;

  const CONTAINER_SEL = "div.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1";

  // ── Styles ───────────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #chatnav-sidebar {
      --cn-bg:      #f9f9f7;
      --cn-border:  rgba(0,0,0,0.07);
      --cn-divider: rgba(0,0,0,0.06);
      --cn-text:    #111827;
      --cn-sub:     #6b7280;
      --cn-arrow:   #d1d5db;
      --cn-arrowon: #6b7280;
      --cn-hover:   rgba(0,0,0,0.04);

      position: fixed;
      top: 60px;
      right: 0;
      width: 230px;
      max-height: calc(100vh - 80px);
      background: var(--cn-bg);
      border: 1px solid var(--cn-border);
      border-right: none;
      border-radius: 12px 0 0 12px;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", ui-sans-serif, sans-serif;
      z-index: 9999;
      box-shadow: -3px 0 18px rgba(0,0,0,0.07);
      overflow: hidden;
      transition: width 0.2s ease;
    }

    @media (prefers-color-scheme: dark) {
      #chatnav-sidebar {
        --cn-bg:      #1f1f1f;
        --cn-border:  rgba(255,255,255,0.08);
        --cn-divider: rgba(255,255,255,0.06);
        --cn-text:    #e5e7eb;
        --cn-sub:     #9ca3af;
        --cn-arrow:   #374151;
        --cn-arrowon: #9ca3af;
        --cn-hover:   rgba(255,255,255,0.05);
      }
    }

    #chatnav-sidebar.cn-col { width: 36px; }
    #chatnav-sidebar.cn-col #chatnav-title,
    #chatnav-sidebar.cn-col #chatnav-body { display: none; }

    #chatnav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 10px 9px 14px;
      border-bottom: 1px solid var(--cn-divider);
      flex-shrink: 0;
    }

    #chatnav-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--cn-sub);
    }

    #chatnav-toggle {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--cn-sub);
      font-size: 16px;
      line-height: 1;
      padding: 0;
    }

    #chatnav-body {
      overflow-y: auto;
      flex: 1;
      scrollbar-width: thin;
      scrollbar-color: var(--cn-arrow) transparent;
    }

    .cn-row {
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid var(--cn-divider);
    }
    .cn-row:last-child { border-bottom: none; }

    .cn-arrow {
      width: 22px;
      flex-shrink: 0;
      background: none;
      border: none;
      color: var(--cn-arrowon);
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.1s;
      padding: 0;
    }
    .cn-arrow:hover { background: var(--cn-hover); }
    .cn-arrow.off {
      color: var(--cn-arrow);
      cursor: default;
      pointer-events: none;
    }

    .cn-content {
      flex: 1;
      min-width: 0;
      padding: 8px 5px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .cn-content:hover { background: var(--cn-hover); }

    .cn-topic {
      font-size: 12px;
      font-weight: 600;
      color: var(--cn-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .cn-sub-text {
      font-size: 11px;
      color: var(--cn-sub);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
      line-height: 1.4;
    }

    .cn-siblings {
      font-size: 9px;
      color: var(--cn-sub);
      margin-top: 2px;
      opacity: 0.75;
    }

    .cn-empty {
      padding: 16px 14px;
      font-size: 11px;
      color: var(--cn-sub);
      line-height: 1.5;
    }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────────
  const sidebar = document.createElement("div");
  sidebar.id = "chatnav-sidebar";
  sidebar.innerHTML = `
    <div id="chatnav-header">
      <span id="chatnav-title">ChatNav</span>
      <button id="chatnav-toggle">‹</button>
    </div>
    <div id="chatnav-body">
      <div class="cn-empty">Send a message to build your nav.</div>
    </div>
  `;
  document.body.appendChild(sidebar);

  const toggleBtn = document.getElementById("chatnav-toggle");
  toggleBtn.addEventListener("click", () => {
    const c = sidebar.classList.toggle("cn-col");
    toggleBtn.textContent = c ? "›" : "‹";
  });

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
      if (buttons.length >= 2) {
        return { prev: buttons[0], next: buttons[buttons.length - 1] };
      }
      el = el.parentElement;
    }
    return null;
  }

  // ── Read turns from Claude's DOM ─────────────────────────────────────────────
  function readTurns() {
    const container = document.querySelector(CONTAINER_SEL);
    if (!container) return [];

    const turns = [];
    const children = Array.from(container.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const text = child.innerText || "";
      const data = parseSummaryJson(text);
      if (!data || !data.topic) continue;

      // Look at the previous sibling for edit controls (user turn)
      const userTurn = children[i - 1] || null;
      let counterSpan = null;
      let navButtons = null;
      let current = 1;
      let total = 1;

      if (userTurn) {
        counterSpan = findEditCounter(userTurn);
        if (counterSpan) {
          const parts = counterSpan.textContent.trim().split(" / ");
          current = parseInt(parts[0], 10);
          total = parseInt(parts[1], 10);
          navButtons = findNativeNavButtons(counterSpan);
        }
      }

      turns.push({
        data,
        responseTurn: child,
        userTurn,
        current,
        total,
        navButtons,
      });
    }

    return turns;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  let lastRenderKey = "";

  function render() {
    const body = document.getElementById("chatnav-body");

    const turns = readTurns();

    const renderKey = turns.map(t =>
      `${t.data.topic}|${t.data.user_request}|${t.current}/${t.total}`
    ).join("::");

    if (renderKey === lastRenderKey) return;
    lastRenderKey = renderKey;

    body.innerHTML = "";

    if (!turns.length) {
      body.innerHTML = `<div class="cn-empty">Send a message to build your nav.</div>`;
      return;
    }

    for (const turn of turns) {
      const { data, responseTurn, current, total, navButtons } = turn;
      const hasPrev = navButtons && current > 1;
      const hasNext = navButtons && current < total;
      const multi = total > 1;

      const row = document.createElement("div");
      row.className = "cn-row";

      const lBtn = document.createElement("button");
      lBtn.className = `cn-arrow${hasPrev ? "" : " off"}`;
      lBtn.textContent = "‹";
      lBtn.title = "Previous edit";
      if (hasPrev) {
        lBtn.addEventListener("click", () => {
          navButtons.prev.click();
          setTimeout(render, 400);
        });
      }

      const content = document.createElement("div");
      content.className = "cn-content";
      content.title = data.response_one_line || "";
      content.innerHTML = `
        <div class="cn-topic">${esc(data.topic)}</div>
        <div class="cn-sub-text">${esc(data.user_request)}</div>
        ${multi ? `<div class="cn-siblings">${current} / ${total}</div>` : ""}
      `;
      content.addEventListener("click", () => {
        responseTurn.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      const rBtn = document.createElement("button");
      rBtn.className = `cn-arrow${hasNext ? "" : " off"}`;
      rBtn.textContent = "›";
      rBtn.title = "Next edit";
      if (hasNext) {
        rBtn.addEventListener("click", () => {
          navButtons.next.click();
          setTimeout(render, 400);
        });
      }

      row.appendChild(lBtn);
      row.appendChild(content);
      row.appendChild(rBtn);
      body.appendChild(row);
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

  // ── Conversation change detection ────────────────────────────────────────────
  let currentPath = location.pathname;

  new MutationObserver(() => {
    if (location.pathname !== currentPath) {
      currentPath = location.pathname;
      render();
    }
  }).observe(document, { subtree: true, childList: true });

  render();
})();
