(function () {
  if (document.getElementById("chatnav-sidebar")) return;

  // ── State ────────────────────────────────────────────────────────────────────
  const nodes    = new Map(); // id → { id, parent_id, topic, user_request, response_one_line, element }
  const children = new Map(); // parentId|"__root__" → [childId, ...]
  let activePath = [];        // [id, id, ...] root → current leaf, always the visible branch

  // ── Styles ───────────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #chatnav-sidebar {
      --cn-bg:          #f9f9f7;
      --cn-border:      rgba(0,0,0,0.07);
      --cn-divider:     rgba(0,0,0,0.06);
      --cn-text:        #111827;
      --cn-sub:         #6b7280;
      --cn-arrow:       #d1d5db;
      --cn-arrow-on:    #6b7280;
      --cn-hover:       rgba(0,0,0,0.04);

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
        --cn-bg:       #1f1f1f;
        --cn-border:   rgba(255,255,255,0.08);
        --cn-divider:  rgba(255,255,255,0.06);
        --cn-text:     #e5e7eb;
        --cn-sub:      #9ca3af;
        --cn-arrow:    #374151;
        --cn-arrow-on: #9ca3af;
        --cn-hover:    rgba(255,255,255,0.05);
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

    /* each row = left arrow | content | right arrow */
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
      color: var(--cn-arrow-on);
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

  function isVisible(el) {
    return el &&
      document.body.contains(el) &&
      el.offsetHeight > 0 &&
      el.offsetParent !== null;
  }

  function siblingsOf(id) {
    const node = nodes.get(id);
    if (!node) return [];
    return children.get(node.parent_id || "__root__") || [];
  }

  // ── Sibling navigation ───────────────────────────────────────────────────────
  function navigateSibling(nodeId, dir) {
    const sibs = siblingsOf(nodeId);
    const idx  = sibs.indexOf(nodeId);
    const next = idx + dir;
    if (next < 0 || next >= sibs.length) return;

    const newId = sibs[next];
    const depth = activePath.indexOf(nodeId);
    if (depth === -1) return;

    // Replace from this depth with the new sibling,
    // then follow first-child down to leaf
    activePath = activePath.slice(0, depth);
    activePath.push(newId);
    let cur = newId;
    while (true) {
      const kids = children.get(cur) || [];
      if (!kids.length) break;
      cur = kids[0];
      activePath.push(cur);
    }

    render();

    const newNode = nodes.get(newId);
    if (newNode?.element && isVisible(newNode.element)) {
      newNode.element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function render() {
    const body = document.getElementById("chatnav-body");
    body.innerHTML = "";

    if (!activePath.length) {
      body.innerHTML = `<div class="cn-empty">Send a message to build your nav.</div>`;
      return;
    }

    for (const id of activePath) {
      const node = nodes.get(id);
      if (!node) continue;

      const sibs     = siblingsOf(id);
      const idx      = sibs.indexOf(id);
      const hasPrev  = idx > 0;
      const hasNext  = idx < sibs.length - 1;
      const multi    = sibs.length > 1;

      const row = document.createElement("div");
      row.className = "cn-row";

      // Left arrow
      const lBtn = document.createElement("button");
      lBtn.className = `cn-arrow${hasPrev ? "" : " off"}`;
      lBtn.textContent = "‹";
      lBtn.title = "Previous branch";
      lBtn.addEventListener("click", () => navigateSibling(id, -1));

      // Content
      const content = document.createElement("div");
      content.className = "cn-content";
      content.title = node.response_one_line || "";
      content.innerHTML = `
        <div class="cn-topic">${esc(node.topic)}</div>
        <div class="cn-sub-text">${esc(node.user_request)}</div>
        ${multi ? `<div class="cn-siblings">${idx + 1} / ${sibs.length}</div>` : ""}
      `;
      content.addEventListener("click", () => {
        if (node.element && isVisible(node.element)) {
          node.element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      // Right arrow
      const rBtn = document.createElement("button");
      rBtn.className = `cn-arrow${hasNext ? "" : " off"}`;
      rBtn.textContent = "›";
      rBtn.title = "Next branch";
      rBtn.addEventListener("click", () => navigateSibling(id, 1));

      row.appendChild(lBtn);
      row.appendChild(content);
      row.appendChild(rBtn);
      body.appendChild(row);
    }
  }

  // ── Active path: follow what's visible in Claude's DOM ───────────────────────
  function updateActivePath() {
    const visible = [];
    for (const [id, node] of nodes) {
      if (isVisible(node.element)) {
        visible.push({ id, node });
      }
    }

    if (!visible.length) return;

    // Sort by DOM order
    visible.sort((a, b) => {
      const pos = a.node.element.compareDocumentPosition(b.node.element);
      return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });

    const newPath = visible.map(v => v.id);

    // Only re-render if something actually changed (handles Claude's own branch switching)
    if (newPath.join(",") !== activePath.join(",")) {
      activePath = newPath;
      render();
    }
  }

  // ── DOM scanning ─────────────────────────────────────────────────────────────
  function findMessageContainer(textNode) {
    let el = textNode.parentElement;
    for (let i = 0; i < 12; i++) {
      if (!el || el === document.body) break;
      const testId = el.getAttribute("data-testid") || "";
      if (
        testId.includes("message") ||
        testId.includes("turn") ||
        (el.tagName === "DIV" && el.offsetHeight > 80 && el.offsetWidth > 200)
      ) return el;
      el = el.parentElement;
    }
    return textNode.parentElement;
  }

  let scanTimer;
  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 600);
  }

  function scan() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(n) {
          return n.textContent.includes("</summary_json>")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let textNode;
    while ((textNode = walker.nextNode())) {
      const fullText = textNode.parentElement?.innerText || textNode.textContent;
      const match = fullText.match(/<summary_json>([\s\S]*?)<\/summary_json>/);
      if (!match) continue;

      let data;
      try { data = JSON.parse(match[1].trim()); } catch { continue; }
      if (!data?.id) continue;

      const container = findMessageContainer(textNode);

      if (nodes.has(data.id)) {
        // Refresh element ref in case Claude rebuilt the DOM for this node
        nodes.get(data.id).element = container;
      } else {
        // New node — register it
        nodes.set(data.id, { ...data, element: container });
        const pid = data.parent_id || "__root__";
        if (!children.has(pid)) children.set(pid, []);
        if (!children.get(pid).includes(data.id)) {
          children.get(pid).push(data.id);
        }
      }
    }

    // After every scan, sync active path to what's visible
    // (catches both new nodes AND Claude's own branch switching)
    updateActivePath();
  }

  // ── Observer ─────────────────────────────────────────────────────────────────
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  scan();
})();
