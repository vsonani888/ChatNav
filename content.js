const DEFAULT_PROMPT = `[cn]
You must append a valid JSON block at the end of every response.

Format:

<summary_json>
{
  "user_request": "",
  "response_one_line": ""
}
</summary_json>

Field definitions:
- user_request: up to 10 word summary of the request
- response_one_line: up to 10 word summary of the response

Rules:
- Direct phrases only, no "user asked/requested"
- Neutral, third-person language
- No time sequence language
- Output valid JSON only inside the tags
- Always place at the very end
[/cn]`;

let enabled = true;
let isInjecting = false;

chrome.storage.sync.get(["enabled"], (result) => {
  if (result.enabled !== undefined) enabled = result.enabled;
  chrome.storage.sync.set({ prompt: DEFAULT_PROMPT });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled !== undefined) enabled = changes.enabled.newValue;
});

const INPUT_SELECTOR = 'div[contenteditable="true"].ProseMirror';

function injectPrompt() {
  if (!enabled) return;
  const editor = document.querySelector(INPUT_SELECTOR);
  if (!editor) return;
  const userText = editor.innerText.trim();
  if (userText.startsWith("[cn]")) return;
  const injected = userText ? DEFAULT_PROMPT + "\n\n" + userText : DEFAULT_PROMPT;
  isInjecting = true;
  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand("insertText", false, injected);
  setTimeout(() => { isInjecting = false; }, 200);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const editor = document.querySelector(INPUT_SELECTOR);
    if (editor && document.activeElement === editor) injectPrompt();
  }
}, true);

document.addEventListener("mousedown", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const label = btn.getAttribute("aria-label") || "";
  if (!label.toLowerCase().includes("send")) return;
  const editor = document.querySelector(INPUT_SELECTOR);
  if (editor) injectPrompt();
}, true);

// ── Hide injected content from UI ────────────────────────────────────────────

const CN_RE = /\[cn\][\s\S]*?\[\/cn\]\s*/g;
const SJ_RE = /<summary_json>[\s\S]*?<\/summary_json>/g;

// Strip both blocks from clipboard copies
if (navigator.clipboard && navigator.clipboard.writeText) {
  const _origWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = (text) => {
    const clean = text.replace(CN_RE, "").replace(SJ_RE, "").trimEnd();
    return _origWrite(clean);
  };
}

// CSS to hide scrubbed elements
const cnHideStyle = document.createElement("style");
cnHideStyle.textContent = `[data-cn-h]{display:none!important}`;
document.head.appendChild(cnHideStyle);

// Hide <summary_json> blocks in Claude's response display
function scrubSummaryJson() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue.includes("<summary_json>")) continue;
    let el = node.parentElement;
    for (let d = 0; d < 10 && el && el !== document.body; d++) {
      if (el.dataset.cnH) break;
      if ((el.tagName === "P" || el.tagName === "PRE" || el.tagName === "DIV") &&
          (el.innerText || "").includes("<summary_json>")) {
        el.dataset.cnH = "1";
        break;
      }
      el = el.parentElement;
    }
  }
}

// Strip [cn]...[/cn] from user message bubbles.
// Claude renders each line of the user message as a separate <p>, so [cn] and
// [/cn] are in different elements. We find the <p> that opens [cn], walk the
// parent container's children, and hide every child from [cn] to [/cn].
function scrubUserMessages() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  let node;
  while ((node = walker.nextNode())) {
    if ((node.nodeValue || "").includes("[cn]")) hits.push(node);
  }

  for (const textNode of hits) {
    const startEl = textNode.parentElement;
    // Skip non-message elements (e.g. sr-only h2 labels)
    if (!startEl || !startEl.classList.contains("whitespace-pre-wrap")) continue;
    const container = startEl.parentElement;
    if (!container || container.dataset.cnScrubbed) continue;
    container.dataset.cnScrubbed = "1";

    // Hide all children from the [cn] opener to the [/cn] closer, inclusive
    let hiding = false;
    for (const child of Array.from(container.children)) {
      const t = child.textContent || "";
      if (t.includes("[cn]") && !hiding) hiding = true;
      if (hiding) child.dataset.cnH = "1";
      if (t.includes("[/cn]") && hiding) { hiding = false; break; }
    }

    // Auto-expand any "Show more" collapse Claude added because of the long prompt.
    // Search up a few levels and click the expand button if found.
    let ancestor = container.parentElement;
    for (let i = 0; i < 6 && ancestor; i++) {
      for (const btn of ancestor.querySelectorAll("button")) {
        const label = (btn.textContent || btn.getAttribute("aria-label") || "").trim().toLowerCase();
        if (label.includes("show more") || label.includes("see more") || label.includes("expand")) {
          btn.click();
        }
      }
      ancestor = ancestor.parentElement;
    }
  }
}

// Strip [cn] block when user enters edit mode on an existing message
function watchEditorForEditMode() {
  let lastLen = 0;
  setInterval(() => {
    const editor = document.querySelector(INPUT_SELECTOR);
    if (!editor || isInjecting) return;
    const text = editor.innerText || "";
    const delta = text.length - lastLen;
    if (delta > 80 && text.includes("[cn]") && text.includes("[/cn]")) {
      const userText = text.replace(CN_RE, "").trimStart();
      isInjecting = true;
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("insertText", false, userText);
      setTimeout(() => { isInjecting = false; }, 200);
      lastLen = userText.length;
      return;
    }
    lastLen = text.length;
  }, 300);
}

// Run scrubbers on DOM changes
let scrubTimer;
new MutationObserver(() => {
  clearTimeout(scrubTimer);
  scrubTimer = setTimeout(() => {
    scrubSummaryJson();
    scrubUserMessages();
  }, 500);
}).observe(document.body, { childList: true, subtree: true });

watchEditorForEditMode();
