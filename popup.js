const enabled = document.getElementById("enabled");
const lang = document.getElementById("lang");
const shortcutEl = document.getElementById("shortcut");
const shortcutsBtn = document.getElementById("shortcuts");

const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
shortcutEl.textContent = isMac ? "⌘ + Shift + V" : "Ctrl + Shift + V";

chrome.storage.sync.get({ enabled: true, lang: "en-US" }, (s) => {
  enabled.checked = s.enabled;
  if (![...lang.options].some((o) => o.value === s.lang)) {
    lang.add(new Option(s.lang, s.lang));
  }
  lang.value = s.lang;
});

enabled.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabled.checked });
});

lang.addEventListener("change", () => {
  chrome.storage.sync.set({ lang: lang.value });
});

shortcutsBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

const statusEl = document.getElementById("status");
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id) {
    statusEl.textContent = "No active tab found.";
    return;
  }
  chrome.tabs.sendMessage(tab.id, { type: "ping" }, (res) => {
    if (chrome.runtime.lastError || !res) {
      statusEl.textContent = "Not active on this page. Reload the tab and make sure site access is allowed.";
    } else if (!res.enabled) {
      statusEl.textContent = "Active here, but voice input is turned off above.";
    } else {
      statusEl.textContent = "Active on this page. Click any text field and start speaking.";
    }
  });
});
