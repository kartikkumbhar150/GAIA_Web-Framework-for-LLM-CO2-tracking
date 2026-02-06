// ===============================
// GAIA – Grammarly Style Injection
// ===============================

console.log("GAIA Grammarly-style loaded");

let gaiaIcon: HTMLDivElement | null = null;
let gaiaPopup: HTMLDivElement | null = null;

// ---------- 1. FIND EDITOR ----------
function getEditor(): HTMLElement | null {
  console.log("🔍 Searching for editor...");
  
  // 1️⃣ ChatGPT: Main textarea
  const chatGptTextarea = document.querySelector('#prompt-textarea');
  if (chatGptTextarea) {
    console.log("✅ Found ChatGPT textarea:", chatGptTextarea);
    return chatGptTextarea as HTMLElement;
  }

  // 2️⃣ ChatGPT: ProseMirror
  const proseMirror = document.querySelector('.ProseMirror');
  if (proseMirror) {
    console.log("✅ Found ProseMirror:", proseMirror);
    return proseMirror as HTMLElement;
  }

  // 3️⃣ ChatGPT: Any visible textarea
  const anyTextarea = Array.from(document.querySelectorAll('textarea')).find(el => {
    const rect = el.getBoundingClientRect();
    const isVisible = rect.width > 100 && rect.height > 30;
    if (isVisible) console.log("✅ Found visible textarea:", el);
    return isVisible;
  });
  if (anyTextarea) return anyTextarea as HTMLElement;

  // 4️⃣ Gemini/Claude: contenteditable
  const editable = Array.from(
    document.querySelectorAll('[contenteditable="true"]')
  ).find(el => {
    const rect = el.getBoundingClientRect();
    const isVisible = rect.width > 200 && rect.height > 30;
    if (isVisible) console.log("✅ Found contenteditable:", el);
    return isVisible;
  });
  if (editable) return editable as HTMLElement;

  // 5️⃣ Generic fallback
  const roleTextbox = document.querySelector('[role="textbox"]');
  if (roleTextbox) {
    console.log("✅ Found role=textbox:", roleTextbox);
    return roleTextbox as HTMLElement;
  }

  console.log("❌ No editor found");
  return null;
}

// ---------- 2. CREATE GAIA ICON ----------
function injectGaiaIcon() {
  if (gaiaIcon) {
    console.log("⏭️ Icon already exists");
    return;
  }

  const editor = getEditor();
  if (!editor) {
    console.log("❌ No editor, can't inject icon");
    return;
  }

  const rect = editor.getBoundingClientRect();
  console.log("📏 Editor rect:", rect);

  gaiaIcon = document.createElement("div");
  gaiaIcon.id = "gaia-icon";

  Object.assign(gaiaIcon.style, {
    position: "fixed",
    top: `${rect.bottom - 40}px`,
    left: `${rect.right - 40}px`,
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "transform 0.2s"
  });

  gaiaIcon.innerText = "G";

  gaiaIcon.onmouseenter = () => {
    gaiaIcon!.style.transform = "scale(1.15)";
  };
  gaiaIcon.onmouseleave = () => {
    gaiaIcon!.style.transform = "scale(1)";
  };

  gaiaIcon.onclick = togglePopup;

  document.body.appendChild(gaiaIcon);
  console.log("✅ GAIA icon injected!");
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
    top: `${Math.max(10, rect.top - 100)}px`,
    left: `${rect.right - 260}px`,
    width: "240px",
    background: "#fff",
    borderRadius: "10px",
    padding: "14px",
    zIndex: "999999",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    fontFamily: "Inter, system-ui, sans-serif",
    border: "1px solid #e5e7eb"
  });

  const text = editor.tagName === 'TEXTAREA' 
    ? (editor as HTMLTextAreaElement).value 
    : editor.innerText || "";
    
  const before = Math.ceil(text.length / 4);
  const after = Math.ceil(optimize(text).length / 4);

  gaiaPopup.innerHTML = `
    <div style="font-weight:600;font-size:14px;margin-bottom:8px">🌱 GAIA Optimize</div>
    <p style="font-size:12px;color:#6b7280;margin:0 0 12px 0;line-height:1.5">
      Tokens: <b>${before} → ${after}</b><br/>
      CO₂ saved 🌱
    </p>
    <button id="gaia-opt" style="
      width:100%;
      padding:10px;
      background:#16a34a;
      color:white;
      border:none;
      border-radius:6px;
      cursor:pointer;
      font-weight:600;
      font-size:13px;
    ">✨ Optimize Now</button>
  `;

  document.body.appendChild(gaiaPopup);

  document.getElementById("gaia-opt")?.addEventListener("click", () => {
    const optimized = optimize(text);
    
    if (editor.tagName === 'TEXTAREA') {
      (editor as HTMLTextAreaElement).value = optimized;
    } else {
      editor.innerText = optimized;
    }
    
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    editor.focus();
    
    togglePopup();
  });
}

// ---------- 4. OPTIMIZER ----------
function optimize(text: string): string {
  return text
    .replace(/\b(please|kindly|as much as possible|if possible)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- 5. REPOSITION ICON ON SCROLL/RESIZE ----------
function repositionIcon() {
  if (!gaiaIcon) return;
  
  const editor = getEditor();
  if (!editor) return;
  
  const rect = editor.getBoundingClientRect();
  gaiaIcon.style.top = `${rect.bottom - 40}px`;
  gaiaIcon.style.left = `${rect.right - 40}px`;
}

window.addEventListener('scroll', repositionIcon, true);
window.addEventListener('resize', repositionIcon);

// ---------- 6. OBSERVE SPA ----------
const observer = new MutationObserver(() => {
  const editor = getEditor();

  if (!editor) {
    gaiaIcon?.remove();
    gaiaIcon = null;
    gaiaPopup?.remove();
    gaiaPopup = null;
  } else {
    injectGaiaIcon();
    repositionIcon();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// ---------- 7. INITIAL LOAD ----------
setTimeout(() => {
  console.log("🚀 Initial GAIA injection attempt...");
  injectGaiaIcon();
}, 1500);

// Retry a few times for slow-loading pages
setTimeout(() => injectGaiaIcon(), 3000);
setTimeout(() => injectGaiaIcon(), 5000);