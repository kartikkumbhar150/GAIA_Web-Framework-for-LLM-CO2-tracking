// ===============================
// GAIA – Grammarly Style Injection
// ===============================

console.log("GAIA Grammarly-style loaded");

let gaiaIcon: HTMLDivElement | null = null;
let gaiaPopup: HTMLDivElement | null = null;

// ---------- 1. FIND EDITOR ----------
function getEditor(): HTMLElement | null {
  // 1️⃣ Primary: visible contenteditable (e.g., Gemini)
  const editable = Array.from(
    document.querySelectorAll('[contenteditable="true"]')
  ).find(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 200 && rect.height > 30 && el.textContent?.trim().length > 0;
  });

  if (editable) return editable as HTMLElement;

  // 2️⃣ Fallback: textarea or role=textbox (e.g., ChatGPT)
  const textarea = document.querySelector('textarea#prompt-textarea') ||
                   document.querySelector('[role="textbox"]') ||
                   document.querySelector('textarea');
  
  if (textarea) {
    const rect = textarea.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 30) return textarea as HTMLElement;
  }

  return null;
}

// Helper to get/set text based on editor type
function getEditorText(editor: HTMLElement): string {
  if (editor.tagName === 'TEXTAREA') {
    return (editor as HTMLTextAreaElement).value || '';
  }
  return editor.innerText || '';
}

function setEditorText(editor: HTMLElement, text: string): void {
  if (editor.tagName === 'TEXTAREA') {
    (editor as HTMLTextAreaElement).value = text;
  } else {
    editor.innerText = text;
  }
  // Dispatch input event for reactivity
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

// ---------- 2. CREATE GAIA ICON ----------
function injectGaiaIcon() {
  if (gaiaIcon) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();

  gaiaIcon = document.createElement("div");
  gaiaIcon.id = "gaia-icon";

  Object.assign(gaiaIcon.style, {
    position: "fixed",
    top: `${rect.bottom - 32}px`,
    left: `${rect.right - 32}px`,
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    cursor: "pointer",
    zIndex: "9999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  });

  gaiaIcon.innerText = "G";

  gaiaIcon.onclick = togglePopup;

  document.body.appendChild(gaiaIcon);
}

// ---------- 3. POPUP ----------
function togglePopup() {
  if (gaiaPopup) {
    gaiaPopup.remove();
    gaiaPopup = null;
    return;
  }

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();

  gaiaPopup = document.createElement("div");

  Object.assign(gaiaPopup.style, {
    position: "fixed",
    top: `${rect.top - 90}px`,
    left: `${rect.right - 260}px`,
    width: "240px",
    background: "#fff",
    borderRadius: "10px",
    padding: "12px",
    zIndex: "9999999",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    fontFamily: "Inter, system-ui, sans-serif"
  });

  const text = getEditorText(editor);
  const before = Math.ceil(text.length / 4);
  const optimized = optimize(text);
  const after = Math.ceil(optimized.length / 4);

  gaiaPopup.innerHTML = `
    <b>GAIA Optimize</b>
    <p style="font-size:12px;color:#6b7280">
      Tokens: ${before} → ${after}<br/>
      CO₂ saved 🌱
    </p>
    <button id="gaia-opt" style="
      width:100%;
      padding:6px;
      background:#16a34a;
      color:white;
      border:none;
      border-radius:6px;
      cursor:pointer;
    ">Optimize</button>
  `;

  document.body.appendChild(gaiaPopup);

  document.getElementById("gaia-opt")?.addEventListener("click", () => {
    setEditorText(editor, optimized);
    togglePopup();
  });
}

// ---------- 4. OPTIMIZER ----------
function optimize(text: string): string {
  return text
    .replace(/\b(please|kindly|as much as possible)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- 5. OBSERVE SPA (GRAMMARLY STYLE) ----------
const observer = new MutationObserver(() => {
  const editor = getEditor();

  if (!editor) {
    gaiaIcon?.remove();
    gaiaIcon = null;
    gaiaPopup?.remove();
    gaiaPopup = null;
  } else {
    injectGaiaIcon();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});