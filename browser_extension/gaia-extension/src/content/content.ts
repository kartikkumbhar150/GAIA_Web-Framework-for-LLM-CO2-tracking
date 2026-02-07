import { analyzeRealtime } from "../realtime/analyzer";
import type { PromptSuggestion } from "../nlp/types";


console.log("GAIA Grammarly-style loaded");

let gaiaIcon: HTMLDivElement | null = null;
let gaiaPopup: HTMLDivElement | null = null;

function getEditor(): HTMLElement | null {
  const chatGptTextarea = document.querySelector("#prompt-textarea");
  if (chatGptTextarea) return chatGptTextarea as HTMLElement;

  const proseMirror = document.querySelector(".ProseMirror");
  if (proseMirror) return proseMirror as HTMLElement;

  const anyTextarea = Array.from(document.querySelectorAll("textarea")).find(
    el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 100 && rect.height > 30;
    }
  );
  if (anyTextarea) return anyTextarea as HTMLElement;

  const editable = Array.from(
    document.querySelectorAll('[contenteditable="true"]')
  ).find(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 200 && rect.height > 30;
  });
  if (editable) return editable as HTMLElement;

  const roleTextbox = document.querySelector('[role="textbox"]');
  if (roleTextbox) return roleTextbox as HTMLElement;

  return null;
}

function injectGaiaIcon() {
  if (gaiaIcon) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();

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
}

function togglePopup() {
  if (gaiaPopup) {
    gaiaPopup.remove();
    gaiaPopup = null;
    return;
  }

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();

  const text =
    editor.tagName === "TEXTAREA"
      ? (editor as HTMLTextAreaElement).value
      : editor.innerText || "";

  gaiaPopup = document.createElement("div");

  Object.assign(gaiaPopup.style, {
    position: "fixed",
    top: `${Math.max(10, rect.top - 120)}px`,
    left: `${rect.right - 300}px`,
    width: "280px",
    background: "#fff",
    borderRadius: "10px",
    padding: "14px",
    zIndex: "999999",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    fontFamily: "Inter, system-ui, sans-serif",
    border: "1px solid #e5e7eb"
  });

  document.body.appendChild(gaiaPopup);

  analyzeRealtime(text, (suggestions: PromptSuggestion[] | null) => {

    if (!suggestions || !gaiaPopup) return;

    gaiaPopup.innerHTML = `
      <div style="font-weight:600;font-size:14px;margin-bottom:10px">
        ✨ GAIA Prompt Suggestions
      </div>
      ${suggestions
        .map(
          (s, i) => `
        <div
          data-index="${i}"
          style="
            padding:8px;
            border-radius:8px;
            margin-bottom:6px;
            cursor:pointer;
            background:#f9fafb;
            border:1px solid #e5e7eb;
          "
        >
          <div style="font-weight:500;font-size:13px">${s.type}</div>
          <div style="font-size:12px;color:#374151;margin-top:4px">
            ${s.prompt}
          </div>
        </div>
      `
        )
        .join("")}
    `;

    gaiaPopup
      .querySelectorAll("[data-index]")
      .forEach(el => {
        el.addEventListener("click", () => {
          const index = Number(
            (el as HTMLElement).dataset.index
          );
          const selected = suggestions[index].prompt;

          if (editor.tagName === "TEXTAREA") {
            (editor as HTMLTextAreaElement).value = selected;
          } else {
            editor.innerText = selected;
          }

          editor.dispatchEvent(new Event("input", { bubbles: true }));
          editor.focus();

          gaiaPopup?.remove();
          gaiaPopup = null;
        });
      });
  });
}

function repositionIcon() {
  if (!gaiaIcon) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  gaiaIcon.style.top = `${rect.bottom - 40}px`;
  gaiaIcon.style.left = `${rect.right - 40}px`;
}

window.addEventListener("scroll", repositionIcon, true);
window.addEventListener("resize", repositionIcon);

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

setTimeout(() => injectGaiaIcon(), 1500);
setTimeout(() => injectGaiaIcon(), 3000);
setTimeout(() => injectGaiaIcon(), 5000);
