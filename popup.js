const DEFAULT_PROMPT = `You must append a valid JSON block at the end of every response.

Format:

<summary_json>
{
  "id": "",
  "parent_id": null,
  "topic": "",
  "user_request": "",
  "response_one_line": ""
}
</summary_json>

Field definitions:
- id: copy the exact value provided at the end of the user's message
- parent_id: copy the exact value provided at the end of the user's message (null if not provided)
- topic: 2–5 word neutral label (NOT a sentence, no "user asked/requested")
- user_request: 5–10 word summary of the request
- response_one_line: one concise sentence summary

Main idea:
- this is for a user clickable sidebar to navigate long chats
- make the content such that users can easily get value out of them and remember what they were talking about
- make it neutral, third person, make it feel like instruction manual language, no sequence of time
- start with rememberable words, perhaps nouns or key phrases so user remembers conversation quickly.

Rules:
- Do NOT include phrases like "user asked", "user requested", etc.
- topic must be a clean label suitable for UI display
- Keep everything concise
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
