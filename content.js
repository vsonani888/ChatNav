const DEFAULT_PROMPT = `You must append a valid JSON block at the end of every response.

Format:

<summary_json>
{
  "topic": "",
  "user_request": "",
  "response_one_line": ""
}
</summary_json> 

Field definitions:
- topic: 2–5 word neutral label (NOT a sentence, no "user asked/requested")
- user_request: 5–10 word summary of the request
- response_one_line: one concise sentence summary

Rules:
- topic must be a clean label suitable for UI display
- Start with memorable nouns or key phrases
- Neutral, third-person, instruction-manual language
- No time sequence language
- Output valid JSON only inside the tags
- Always place at the very end`;

let enabled = true;

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
  if (userText.startsWith(DEFAULT_PROMPT.substring(0, 20))) return;
  const injected = userText ? DEFAULT_PROMPT + "\n\n" + userText : DEFAULT_PROMPT;
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
    if (editor && document.activeElement === editor) injectPrompt();
  }
}, true);

document.addEventListener("mousedown", (e) => {
  if (!e.target.closest("button")) return;
  const editor = document.querySelector(INPUT_SELECTOR);
  if (editor) injectPrompt();
}, true);
