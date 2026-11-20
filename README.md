# VoiceIn

**Dictate into any text field.** Click a field, start speaking, and your words appear live before dropping straight into the input — no extra clicks.

VoiceIn is a small Chrome Manifest V3 extension with a persistent, orange-accented liquid-glass mic dock that stays above page content.

## Features

- **Auto-start on focus** — click any text field and dictation begins by itself
- **Live transcript** — words stream into the glass panel as Chrome transcribes them
- **Automatic insertion** — final phrases are inserted into the field as they are recognized; the trailing text drops in after a short pause
- **Silence detection** — roughly 1.3 seconds of quiet finishes the dictation
- **Always-visible dock** — uses the browser top layer to stay above website overlays, posters, and modals
- **Clear mic states** — microphone while idle, text-field icon while listening, checkmark after insertion
- **Keyboard shortcut** — `⌘ + Shift + V` on macOS, `Ctrl + Shift + V` elsewhere; customizable in Chrome
- **Language selection** — 12 built-in language options with sync across your Chrome profile
- **Site-aware** — works with inputs, textareas, contenteditable fields, shadow DOM, and same-origin iframes
- **No backend** — no VoiceIn server, analytics, or account required

## Install from GitHub

1. Download this repository as a ZIP, or clone it:

   ```bash
   git clone https://github.com/edkaydev/voicein.git
   ```

2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder that contains `manifest.json` — for a cloned repo, that is the `voicein` folder.
6. Optionally pin VoiceIn from the extensions menu.
7. Click any text field and speak.

> Keep the folder where it is after loading. Chrome reads the extension files from that path. For a downloaded ZIP, extract it first and select the inner folder — Chrome does not load `.zip` files directly.

To update later, pull/download the newest source, then click the reload icon on the VoiceIn card in `chrome://extensions`.

## How to use

1. Click into a text field, textarea, or editable area.
2. The mic starts listening automatically.
3. Watch the words appear in the floating panel.
4. Pause when you finish — the remaining words drop into the field automatically.
5. Press `Esc`, click the mic, or use the keyboard shortcut to stop early.

### Keyboard shortcut

| Platform | Shortcut |
| --- | --- |
| macOS | `⌘ + Shift + V` |
| Windows / Linux / ChromeOS | `Ctrl + Shift + V` |

To change it, open the VoiceIn popup and click **Customize**, or go to `chrome://extensions/shortcuts`.

## Settings

Open the VoiceIn popup from the toolbar:

- **Enable voice input** — shows or hides the mic dock on pages
- **Language** — chooses the speech recognition language
- **Keyboard shortcut** — opens Chrome's shortcut editor
- **Status line** — reports whether the content script is active on the current tab

Settings are stored with `chrome.storage.sync`, so they follow your signed-in Chrome profile.

## Permissions and privacy

VoiceIn asks for a small set of Chrome permissions:

| Permission | Why it is needed |
| --- | --- |
| `storage` | Saves the enable toggle and language preference |
| `activeTab` | Lets the keyboard shortcut reach the current page |
| `<all_urls>` content access | Places the dock and inserts text into fields across websites |
| Microphone | Captures speech when dictation starts |

VoiceIn has **no server component**. It uses Chrome's built-in Web Speech API, so recognition may be performed by Chrome's speech service and can require an internet connection. VoiceIn does not record, upload, or store audio itself, and it contains no analytics or tracking.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Mic dock is not visible | Reload the tab after installing, then check the popup status line |
| Popup says the extension is not active | Refresh the page; site access may also be disabled for the extension |
| Dictation does not start | Click a real text field, allow microphone access, and make sure you are online |
| Mic permission is blocked | Use the site's permission icon in the address bar and allow the microphone |
| Shortcut does nothing | Check `chrome://extensions/shortcuts` for conflicts |
| Wrong language is detected | Choose the correct language in the VoiceIn popup |
| It does not work on `chrome://` pages | Expected — Chrome blocks extensions on its internal pages |
| Text does not appear in a custom editor | Some editors use non-standard inputs; try a normal textarea or input |

## Project structure

```text
voicein/
├── background.js       # keyboard shortcut handler
├── content.js          # dock UI, speech recognition, transcript, insertion
├── manifest.json       # extension metadata, permissions, content script
├── popup.html          # settings popup UI and styles
├── popup.js            # settings, status check, shortcut link
└── icons/              # extension toolbar icons
```

## Development

There is no build step. Edit the files directly, then reload the extension at `chrome://extensions`.

Syntax checks:

```bash
node --check background.js
node --check content.js
node --check popup.js
```

## Contributing

Issues and pull requests are welcome. If something breaks on a specific website, include the site type, browser version, and the popup status message.

## License

No license has been specified yet. This is a personal project shared for convenience.
