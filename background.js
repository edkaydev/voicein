chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-dictation") return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-dictation" });
  } catch (_) {
    // Content script not available on this page (e.g. chrome:// pages)
  }
});
