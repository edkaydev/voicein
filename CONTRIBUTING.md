# Contributing to VoiceIn

Thanks for your interest in improving VoiceIn! Contributions are welcome — bug fixes, improvements, docs, and new ideas.

## How to contribute

The `main` branch is protected, so please contribute through a pull request:

1. **Fork** this repository to your GitHub account.
2. **Clone** your fork and create a branch (do not work on `main`):
   ```bash
   git clone https://github.com/<your-username>/voicein.git
   cd voicein
   git checkout -b feature/my-change
   ```
3. **Make your changes.** Keep them focused on one thing when possible.
4. **Test locally:**
   - Open `chrome://extensions` in Chrome and turn on **Developer mode**.
   - Click **Load unpacked** and select the folder with `manifest.json`.
   - After editing files, click the reload icon on the VoiceIn card and refresh the page you’re testing on.
   - Optional syntax checks:
     ```bash
     node --check background.js
     node --check content.js
     node --check popup.js
     ```
5. **Commit and push** your branch to your fork:
   ```bash
   git add -A
   git commit -m "Describe your change"
   git push origin feature/my-change
   ```
6. **Open a Pull Request** to `edkaydev/voicein`’s `main` branch. Describe what you changed and why.

## Reporting issues

If you find a bug, please open an issue with:
- What you expected vs. what happened
- Steps to reproduce
- The website/app where it happened (if relevant)
- Browser version and OS
- The status message shown in the VoiceIn popup, if helpful

## Notes

- There is no build step — edit the source files directly.
- Please don’t include unrelated changes in the same PR.
- By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
