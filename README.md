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

## Add VoiceIn to Chrome

VoiceIn is not published on the Chrome Web Store yet, so install it in developer mode. This works on personal Chrome profiles and takes about a minute.

### 1. Get the files

**Option A — download ZIP (no terminal):**

1. Open https://github.com/edkaydev/voicein.
2. Click **Code → Download ZIP**.
3. Extract the downloaded file. On macOS, double-click the ZIP; on Windows, right-click it and choose **Extract All**.
4. Open the extracted folder. You should see `manifest.json`, `content.js`, `popup.html`, and an `icons` folder.

**Option B — clone with Git:**

```bash
git clone https://github.com/edkaydev/voicein.git
cd voicein
```

### 2. Load it into Chrome

1. Open Chrome.
2. In the address bar, go to `chrome://extensions` and press Enter.
3. Turn on **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. In the file picker, select the folder that directly contains `manifest.json` — for example `voicein` or `voicein-main`.
6. Click **Select Folder** / **Open**.
7. The **VoiceIn** card should appear in the list. If Chrome shows an error, make sure you selected the inner folder with `manifest.json`, not the ZIP file or the folder above it.
8. Click the puzzle-piece icon in Chrome's toolbar and pin **VoiceIn** so the settings popup is easy to open.

### 3. Test it

1. Open a normal website, such as a search engine or your email.
2. Click a text field. The glass mic dock should appear at the bottom-left.
3. Allow microphone access if Chrome asks.
4. Speak a sentence, then pause. The words should appear live and then drop into the field automatically.

> Chrome needs an internet connection for speech recognition, and some sites need a page refresh after the extension is first installed. If the dock does not appear, reload the tab and check the status line in the VoiceIn popup.

### Update or remove it

- **Update:** download or pull the newest source, then click the reload icon on the VoiceIn card in `chrome://extensions`.
- **Remove:** click **Remove** on the VoiceIn card in `chrome://extensions`.

> Keep the selected folder on your computer. Chrome loads the extension files from that path, so moving or deleting the folder will break the extension until you load it again.

### Share with friends

Send them https://github.com/edkaydev/voicein and have them follow the same steps. They do not need Git if they use **Download ZIP**.

For a normal **Add to Chrome** button instead of developer mode, the extension would need to be published to the Chrome Web Store. That requires a Chrome Web Store developer account, zipping the folder contents with `manifest.json` at the root, completing the store listing and privacy disclosures, and passing Google's review.

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
├── icons/              # extension toolbar icons
├── CONTRIBUTING.md     # how to contribute via pull requests
└── LICENSE             # MIT license
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

Contributions are welcome! The `main` branch is protected, so please **fork the repo, create a branch, and open a pull request** — direct pushes to `main` are not allowed.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## License

[MIT](LICENSE) © Kayiira Edward
