const enabledToggle = document.getElementById("enabledToggle");

chrome.storage.sync.get(["enabled"], (result) => {
  enabledToggle.checked = result.enabled !== false;
});

enabledToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
});
