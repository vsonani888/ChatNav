const INPUT_SELECTOR = 'div[contenteditable="true"].ProseMirror';
const SEND_BUTTON_SELECTOR = 'button[aria-label="Send message"]';

let enabled = true;
let prompt = "";

chrome.storage.sync.get(["enabled", "prompt"], (result) => {
  if (result.enabled !== undefined) enabled = result.enabled;
  if (result.prompt) prompt = result.prompt;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled !== undefined) enabled = changes.enabled.newValue;
  if (changes.prompt !== undefined) prompt = changes.prompt.newValue;
});

function generateId() {
  return Math.random().toString(36).substr(2, 6);
}

function getLastResponseId() {
  const bodyText = document.body.innerText;
  const matches = [...bodyText.matchAll(/<summary_json>([\s\S]*?)<\/summary_json>/g)];
  if (!matches.length) return null;
  try {
    const data = JSON.parse(matches[matches.length - 1][1].trim());
    return data.id || null;
  } catch {
    return null;
  }
}

function injectPrompt() {
  if (!enabled) return;
  if (!prompt) return;

  const editor = document.querySelector(INPUT_SELECTOR);
  if (!editor) return;

  const userText = editor.innerText.trim();
  if (!userText) return;

  if (userText.startsWith(prompt.substring(0, 20))) return;

  const newId = generateId();
  const parentId = getLastResponseId();

  const idInstruction = `\n\nFor the summary_json, use these exact values:\n"id": "${newId}"\n"parent_id": ${parentId ? `"${parentId}"` : "null"}`;

  const injected = prompt + idInstruction + "\n\n" + userText;

  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand("insertText", false, injected);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const editor = document.querySelector(INPUT_SELECTOR);
    if (editor && document.activeElement === editor) {
      injectPrompt();
    }
  }
}, true);

document.addEventListener("click", (e) => {
  if (e.target.closest(SEND_BUTTON_SELECTOR)) {
    injectPrompt();
  }
}, true);
