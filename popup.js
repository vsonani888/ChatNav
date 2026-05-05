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

const enabledToggle = document.getElementById("enabledToggle");
const promptDisplay = document.getElementById("promptDisplay");

// read both values from storage; if prompt was never saved, write the default in
chrome.storage.sync.get(["enabled", "prompt"], (result) => {
  enabledToggle.checked = result.enabled !== false;

  if (result.prompt) {
    promptDisplay.textContent = result.prompt;
  } else {
    chrome.storage.sync.set({ prompt: DEFAULT_PROMPT });
    promptDisplay.textContent = DEFAULT_PROMPT;
  }
});

enabledToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
});
