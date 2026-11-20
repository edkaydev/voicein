(() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isTop = window.top === window;

  const settings = { enabled: true, lang: navigator.language || "en-US" };
  try {
    chrome.storage.sync.get({ enabled: true, lang: settings.lang }, (s) => { Object.assign(settings, s); updateDock(); });
    chrome.storage.onChanged.addListener((changes) => {
      for (const k in changes) settings[k] = changes[k].newValue;
      if (changes.lang && rec && wanted && active) {
        const el = active;
        stop(false);
        start(el);
      }
      if (changes.enabled) updateDock();
      if (changes.enabled && !settings.enabled) stop(true);
    });
    chrome.runtime.onMessage.addListener((msg, sender, reply) => {
      if (msg?.type === "ping") reply({ ok: true, enabled: settings.enabled, top: isTop });
      if (msg?.type === "toggle-dictation" && isTop) toggle();
    });
  } catch (_) {}

  const TEXT_TYPES = new Set(["text", "search", "email", "url", "tel", ""]);
  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.readOnly || el.disabled) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      return TEXT_TYPES.has(type);
    }
    return !!el.isContentEditable;
  }

  function deepActive() {
    let el = document.activeElement;
    for (let i = 0; i < 6 && el; i++) {
      if (el.shadowRoot && el.shadowRoot.activeElement) { el = el.shadowRoot.activeElement; continue; }
      if (el.tagName === "IFRAME") {
        try {
          const d = el.contentDocument;
          if (d && d.activeElement) { el = d.activeElement; continue; }
        } catch (_) {}
      }
      break;
    }
    return el;
  }

  function insertText(el, raw) {
    let text = (raw || "").trim();
    if (!text || !el) return;
    const doc = el.ownerDocument || document;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const proto = el.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      const setter = desc && desc.set;
      const value = el.value || "";
      let start = el.selectionStart, end = el.selectionEnd;
      if (start == null || end == null) start = end = value.length;
      if (start > 0 && !/\s$/.test(value.slice(0, start))) text = " " + text;
      const next = value.slice(0, start) + text + value.slice(end);
      if (setter) setter.call(el, next); else el.value = next;
      const pos = start + text.length;
      try { el.setSelectionRange(pos, pos); } catch (_) {}
      try {
        el.dispatchEvent(new (doc.defaultView || window).InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      } catch (_) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else {
      const view = doc.defaultView || window;
      const sel = view.getSelection();
      let before = "";
      if (sel && sel.rangeCount > 0) {
        try {
          const range = sel.getRangeAt(0).cloneRange();
          range.collapse(true);
          range.setStart(el, 0);
          before = range.toString();
        } catch (_) {
          before = (sel.anchorNode && sel.anchorNode.textContent || "").slice(0, sel.anchorOffset || 0);
        }
      }
      if (before && !/\s$/.test(before)) text = " " + text;
      doc.execCommand("insertText", false, text);
    }
    try { el.focus(); } catch (_) {}
  }

  // ---------- Persistent bottom-left glass dock ----------
  let host = null, root = null, dock, fab, panel, panelTitle, panelFoot, stream, closeBtn;

  if (isTop) {
    host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;left:0;top:0;width:0;height:0;pointer-events:none;";
    root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>
        :host{all:initial}
        .dock{
          position:fixed;inset:auto auto 18px 18px;display:flex;flex-direction:column;align-items:flex-start;gap:12px;
          border:0;padding:0;margin:0;background:transparent;pointer-events:auto;
          font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a2e;
          overflow:visible;
        }
        .fab{
          all:unset;cursor:pointer;position:relative;display:grid;place-items:center;width:52px;height:52px;border-radius:24px;
          background:linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02));
          border:1px solid rgba(255,255,255,0.25);
          backdrop-filter:blur(6px) saturate(160%);-webkit-backdrop-filter:blur(6px) saturate(160%);
          box-shadow:0 8px 32px rgba(0,0,0,0.15),inset 0 1px 1px rgba(255,255,255,0.6),inset 0 -2px 6px rgba(255,255,255,0.15),inset 0 0 12px rgba(255,255,255,0.08);
          color:#f97316;
          transition:transform .18s ease,box-shadow .18s ease,background .18s ease,color .18s ease,border-color .18s ease;
        }
        .fab svg{position:relative;width:22px;height:22px;fill:currentColor;filter:drop-shadow(0 1px 2px rgba(249,115,22,0.35))}
        .fab .ico-field,.fab .ico-done{display:none}
        .fab.listening .ico-mic{display:none}
        .fab.listening .ico-field{display:block}
        .fab.inserted .ico-mic,.fab.inserted .ico-field{display:none}
        .fab.inserted .ico-done{display:block}
        .fab:hover{transform:translateY(-2px);box-shadow:0 12px 38px rgba(0,0,0,0.2),inset 0 1px 1px rgba(255,255,255,0.7),inset 0 -2px 6px rgba(255,255,255,0.2),inset 0 0 12px rgba(255,255,255,0.1)}
        .fab.listening{
          background:linear-gradient(135deg,rgba(251,146,60,0.45),rgba(234,88,12,0.35));
          border-color:rgba(255,255,255,0.4);color:#fff;
          box-shadow:0 8px 32px rgba(249,115,22,0.35),inset 0 1px 1px rgba(255,255,255,0.6),inset 0 -2px 6px rgba(255,255,255,0.2),inset 0 0 12px rgba(255,255,255,0.12);
        }
        .fab.listening svg{filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25))}
        .pulse{position:absolute;inset:-5px;border-radius:28px;border:2px solid rgba(249,115,22,0.5);opacity:0;pointer-events:none}
        .fab.listening .pulse{animation:pulse 1.6s ease-out infinite;opacity:1}
        @keyframes pulse{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.3);opacity:0}}

        .panel{
          display:none;width:340px;max-width:calc(100vw - 36px);
          background:linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02));
          border:1px solid rgba(255,255,255,0.25);
          backdrop-filter:blur(6px) saturate(160%);-webkit-backdrop-filter:blur(6px) saturate(160%);
          border-radius:24px;
          box-shadow:0 8px 32px rgba(0,0,0,0.15),inset 0 1px 1px rgba(255,255,255,0.6),inset 0 -2px 6px rgba(255,255,255,0.15),inset 0 0 12px rgba(255,255,255,0.08);
          padding:14px 16px 12px;overflow:hidden;
        }
        .panel.show{display:block;animation:in .2s cubic-bezier(.16,1,.3,1)}
        @keyframes in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
        .panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
        .panel-title{font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
        .panel.listening .panel-title{color:#f97316}
        .panel.error .panel-title{color:#b91c1c}
        .panel-close{all:unset;cursor:pointer;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;color:#94a3b8;font-size:18px;line-height:1}
        .panel-close:hover{background:rgba(26,26,46,.06);color:#1a1a2e}
        .stream{font-size:15px;line-height:1.5;max-height:150px;overflow-y:auto;color:#fff;word-break:break-word;min-height:22px;white-space:pre-wrap;text-shadow:0 1px 3px rgba(0,0,0,0.45)}
        .stream.empty{color:#fff;font-style:italic;opacity:0.8}
        .panel-foot{margin-top:10px;font-size:11px;color:#94a3b8;border-top:1px solid rgba(26,26,46,.06);padding-top:8px}
        .panel.error .panel-foot{color:#b91c1c}
      </style>
      <div class="dock" id="dock" popover="manual">
        <div class="panel" id="panel" role="status" aria-live="polite">
          <div class="panel-head">
            <span class="panel-title" id="panelTitle">Listening</span>
            <button class="panel-close" id="panelClose" type="button" aria-label="Close">×</button>
          </div>
          <div class="stream empty" id="stream">Start speaking…</div>
          <div class="panel-foot" id="panelFoot">Auto-inserts when you pause · Esc to stop</div>
        </div>
        <button class="fab" id="fab" type="button" aria-label="Start voice input" title="Start voice input (⌘/Ctrl+Shift+V)">
          <span class="pulse"></span>
          <svg class="ico-mic" viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>
          <svg class="ico-field" viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4z"/><path d="M6 9h8v1.5H6zM6 12h5v1.5H6z"/><path d="M14.5 11.5h1.6V16h-1.6z"/></svg>
          <svg class="ico-done" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
        </button>
      </div>
    `;
    (document.documentElement || document.body).appendChild(host);
    dock = root.getElementById("dock");
    try { dock.showPopover(); } catch (_) {}
    fab = root.getElementById("fab");
    panel = root.getElementById("panel");
    panelTitle = root.getElementById("panelTitle");
    panelFoot = root.getElementById("panelFoot");
    stream = root.getElementById("stream");
    closeBtn = root.getElementById("panelClose");
  }

  let rec = null;
  let active = null;
  let wanted = false;
  let transcript = "";
  let interim = "";
  let lastError = "";
  let silenceTimer = null;
  let target = null;
  let insertedText = "";
  let suppressAutoUntil = 0;
  let autoStartTimer = null;

  function armAutoStop() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { if (wanted) stop(false); }, 1300);
  }

  function renderStream() {
    const full = transcript + (interim ? (transcript ? " " : "") + interim : "");
    stream.textContent = full || "Start speaking…";
    stream.classList.toggle("empty", !full);
    stream.scrollTop = stream.scrollHeight;
  }

  function setPanel(state, title, foot) {
    panel.className = "panel show " + (state || "");
    panelTitle.textContent = title || "";
    panelFoot.textContent = foot || "";
    renderStream();
  }

  function hidePanel() { if (panel) panel.className = "panel"; }

  function updateDock() {
    if (!dock) return;
    dock.style.display = settings.enabled ? "flex" : "none";
    fab.classList.toggle("listening", wanted && !!rec);
    fab.setAttribute("aria-label", wanted ? "Stop voice input" : "Start voice input");
  }

  function flush() {
    const partial = interim.trim();
    transcript = "";
    interim = "";
    if (partial && target && isEditable(target)) {
      insertText(target, partial);
      insertedText += (insertedText ? " " : "") + partial;
      return partial;
    }
    return "";
  }

  function killRec() {
    clearTimeout(silenceTimer);
    silenceTimer = null;
    if (rec) {
      rec.onend = rec.onresult = rec.onerror = rec.onstart = rec.onspeechstart = rec.onspeechend = null;
      try { rec.abort(); } catch (_) {}
      rec = null;
    }
  }

  function fail(title, sub) {
    const inserted = flush();
    wanted = false;
    lastError = title;
    suppressAutoUntil = Date.now() + 1800;
    killRec();
    updateDock();
    if (inserted && fab) {
      fab.classList.add("inserted");
      setTimeout(() => fab.classList.remove("inserted"), 1400);
    }
    setPanel("error", title, sub + (inserted ? " · partial text inserted" : ""));
    setTimeout(() => { if (!wanted) hidePanel(); }, 5000);
  }

  function stop(showIdle) {
    const inserted = wanted ? flush() : "";
    wanted = false;
    lastError = "";
    suppressAutoUntil = Date.now() + 1800;
    killRec();
    updateDock();
    if (inserted && fab) {
      fab.classList.add("inserted");
      setTimeout(() => fab.classList.remove("inserted"), 1400);
    }
    if (showIdle) {
      hidePanel();
    } else {
      const count = insertedText ? insertedText.split(/\s+/).length : 0;
      setPanel("", inserted ? "Inserted " + count + (count === 1 ? " word" : " words") : "Voice paused",
        inserted ? "Added to your text field" : "Click the mic or press the shortcut to resume");
      setTimeout(() => { if (!wanted) hidePanel(); }, 2200);
    }
  }

  function start(el) {
    if (!settings.enabled || !isEditable(el)) return;
    if (!SR) {
      if (isTop) {
        setPanel("error", "Voice input unavailable", "Speech recognition is not supported in this browser");
        setTimeout(hidePanel, 3500);
      }
      return;
    }
    killRec();
    active = el;
    target = el;
    wanted = true;
    transcript = "";
    interim = "";
    insertedText = "";
    lastError = "";
    setPanel("listening", "Listening", "Auto-inserts when you pause · Esc to stop");

    rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = settings.lang || navigator.language || "en-US";
    rec.quality = "dictation";
    updateDock();

    rec.onresult = (e) => {
      let newFinal = "";
      let currentInterim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0] && r[0].transcript ? r[0].transcript : "";
        if (r.isFinal) newFinal += (newFinal ? " " : "") + t.trim();
        else currentInterim += t;
      }
      if (newFinal) {
        transcript += (transcript ? " " : "") + newFinal;
        if (wanted && target && isEditable(target)) {
          insertText(target, newFinal);
          insertedText += (insertedText ? " " : "") + newFinal;
        }
      }
      interim = currentInterim.trim();
      if (wanted) { renderStream(); armAutoStop(); }
    };

    rec.onspeechstart = () => { clearTimeout(silenceTimer); };

    rec.onspeechend = () => { if (wanted) armAutoStop(); };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        fail("Microphone blocked", "Allow mic access in this site's permissions");
      } else if (e.error === "audio-capture") {
        fail("No microphone found", "Check your microphone and try again");
      } else if (e.error === "network") {
        fail("Speech service unreachable", "Voice recognition needs an internet connection");
      } else if (e.error === "not-supported" || e.error === "language-not-supported") {
        fail("Voice input unavailable", "This language isn't supported here");
      }
    };

    rec.onend = () => {
      if (!wanted) return;
      const cur = deepActive();
      if (isEditable(cur) && cur === active) {
        setTimeout(() => {
          if (!wanted || !rec) return;
          try { rec.start(); }
          catch (_) {
            const el = active;
            killRec();
            if (wanted && el) start(el);
          }
        }, 200);
      } else {
        stop(true);
      }
    };

    try { rec.start(); }
    catch (_) {
      fail("Couldn't start voice input", "Try again in a moment");
    }
  }

  function toggle() {
    if (wanted) { stop(false); return; }
    const el = deepActive();
    if (!isEditable(el)) {
      setPanel("", "Click a text field first", "Then press the mic or shortcut to start dictating");
      setTimeout(() => { if (!wanted) hidePanel(); }, 2500);
      return;
    }
    active = el;
    start(el);
  }

  if (isTop) {
    fab.addEventListener("mousedown", (e) => e.preventDefault());
    panel.addEventListener("mousedown", (e) => e.preventDefault());
    fab.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
    closeBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); stop(false); });

    document.addEventListener("focusin", (e) => {
      const el = e.composedPath ? e.composedPath()[0] : e.target;
      if (!isEditable(el)) return;
      active = el;
      if (settings.enabled && !wanted && Date.now() > suppressAutoUntil) {
        clearTimeout(autoStartTimer);
        autoStartTimer = setTimeout(() => {
          if (settings.enabled && !wanted && Date.now() > suppressAutoUntil && deepActive() === el) start(el);
        }, 180);
      }
    }, true);
    document.addEventListener("pointerdown", (e) => {
      const el = e.composedPath ? e.composedPath()[0] : e.target;
      if (isEditable(el)) setTimeout(() => { active = el; }, 0);
    }, true);
    setInterval(() => { const el = deepActive(); if (isEditable(el)) active = el; }, 400);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wanted) { stop(false); e.stopPropagation(); }
    }, true);

    updateDock();
  }
})();
