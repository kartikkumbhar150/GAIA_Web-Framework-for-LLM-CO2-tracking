import { analyzeRealtime } from "../realtime/analyzer";
import type { PromptSuggestion } from "../nlp/types";

console.log("GAIA Grammarly-style loaded");

let gaiaIcon: HTMLDivElement | null = null;
let gaiaPopup: HTMLDivElement | null = null;
let extensionPanel: HTMLDivElement | null = null;

// Detect if we're in the extension popup/panel
function isExtensionPanel(): boolean {
  return window.location.href.includes('chrome-extension://') || 
         document.body.classList.contains('gaia-extension-panel');
}

// Model recommendations data
const MODEL_RECOMMENDATIONS = [
  {
    name: "Claude Sonnet 4.5",
    icon: "🧠",
    description: "Smart, efficient model for everyday tasks",
    bestFor: ["General queries", "Coding", "Analysis"],
    color: "#16a34a"
  },
  {
    name: "GPT-4",
    icon: "⚡",
    description: "Powerful reasoning and creative tasks",
    bestFor: ["Complex problems", "Creative writing", "Research"],
    color: "#7c3aed"
  },
  {
    name: "Claude Opus 4.5",
    icon: "🎯",
    description: "Advanced model for complex reasoning",
    bestFor: ["Deep analysis", "Long documents", "Technical tasks"],
    color: "#dc2626"
  },
  {
    name: "Gemini Pro",
    icon: "💎",
    description: "Multi-modal AI with strong reasoning",
    bestFor: ["Image analysis", "Data tasks", "Coding"],
    color: "#0891b2"
  }
];

const TASK_CATEGORIES = [
  {
    id: "writing",
    name: "Writing & Content",
    icon: "✍️",
    tasks: [
      "Blog post",
      "Email draft",
      "Social media post",
      "Product description",
      "Essay writing"
    ]
  },
  {
    id: "coding",
    name: "Coding & Technical",
    icon: "💻",
    tasks: [
      "Debug code",
      "Write function",
      "Code review",
      "API integration",
      "Database query"
    ]
  },
  {
    id: "analysis",
    name: "Analysis & Research",
    icon: "📊",
    tasks: [
      "Data analysis",
      "Market research",
      "Competitive analysis",
      "Document summary",
      "Trend analysis"
    ]
  },
  {
    id: "creative",
    name: "Creative & Design",
    icon: "🎨",
    tasks: [
      "Brainstorming",
      "Story writing",
      "UI/UX ideas",
      "Marketing copy",
      "Video script"
    ]
  }
];

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
    bottom: `${window.innerHeight - rect.bottom + 12}px`,
    right: `${window.innerWidth - rect.right + 12}px`,
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
    cursor: "pointer",
    zIndex: "999999",
    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.4), 0 0 0 0 rgba(22, 163, 74, 0.4)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
  });

  gaiaIcon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // Add keyframe animations
  if (!document.getElementById('gaia-animations')) {
    const style = document.createElement("style");
    style.id = 'gaia-animations';
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4), 0 0 0 0 rgba(22, 163, 74, 0.4);
        }
        50% {
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4), 0 0 0 6px rgba(22, 163, 74, 0);
        }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  gaiaIcon.onmouseenter = () => {
    gaiaIcon!.style.transform = "scale(1.1)";
    gaiaIcon!.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.5), 0 0 0 0 rgba(22, 163, 74, 0)";
  };
  gaiaIcon.onmouseleave = () => {
    gaiaIcon!.style.transform = "scale(1)";
  };

  gaiaIcon.onclick = togglePopup;

  document.body.appendChild(gaiaIcon);
}

function createExtensionPanel() {
  if (extensionPanel) return;

  extensionPanel = document.createElement("div");
  extensionPanel.id = "gaia-extension-panel";

  Object.assign(extensionPanel.style, {
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f9fafb, #ffffff)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "0",
    overflow: "auto"
  });

  extensionPanel.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      padding: 24px 20px;
      color: white;
    ">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">GAIA Assistant</h1>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Your AI-powered prompt companion</p>
        </div>
      </div>
    </div>

    <div style="padding: 20px;">
      <!-- Quick Task Selection -->
      <div style="margin-bottom: 24px;">
        <h2 style="
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                  stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Select Your Task
        </h2>
        
        <div id="task-categories">
          ${TASK_CATEGORIES.map(category => `
            <div style="margin-bottom: 16px;">
              <div style="
                font-weight: 600;
                font-size: 13px;
                color: #374151;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span style="font-size: 16px;">${category.icon}</span>
                ${category.name}
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${category.tasks.map(task => `
                  <button
                    class="task-btn"
                    data-task="${task}"
                    style="
                      padding: 8px 14px;
                      border-radius: 8px;
                      border: 1.5px solid #e5e7eb;
                      background: white;
                      font-size: 12px;
                      color: #374151;
                      cursor: pointer;
                      transition: all 0.2s;
                      font-weight: 500;
                    "
                    onmouseenter="this.style.borderColor='#16a34a'; this.style.background='#f0fdf4'; this.style.color='#16a34a';"
                    onmouseleave="this.style.borderColor='#e5e7eb'; this.style.background='white'; this.style.color='#374151';"
                  >
                    ${task}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Model Recommendations -->
      <div>
        <h2 style="
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" 
                  stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Recommended Models
        </h2>
        
        <div style="display: grid; gap: 12px;">
          ${MODEL_RECOMMENDATIONS.map(model => `
            <div
              class="model-card"
              style="
                background: white;
                border: 1.5px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseenter="this.style.borderColor='${model.color}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
              onmouseleave="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"
            >
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="
                  width: 40px;
                  height: 40px;
                  border-radius: 10px;
                  background: linear-gradient(135deg, ${model.color}15, ${model.color}25);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 20px;
                  flex-shrink: 0;
                ">
                  ${model.icon}
                </div>
                <div style="flex: 1;">
                  <div style="
                    font-weight: 600;
                    font-size: 14px;
                    color: #111827;
                    margin-bottom: 4px;
                  ">
                    ${model.name}
                  </div>
                  <div style="
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 8px;
                    line-height: 1.4;
                  ">
                    ${model.description}
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${model.bestFor.map(tag => `
                      <span style="
                        font-size: 10px;
                        padding: 3px 8px;
                        background: ${model.color}15;
                        color: ${model.color};
                        border-radius: 4px;
                        font-weight: 600;
                      ">
                        ${tag}
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Selected Task Display -->
      <div id="selected-task-display" style="
        margin-top: 24px;
        padding: 16px;
        background: white;
        border: 2px solid #16a34a;
        border-radius: 12px;
        display: none;
      ">
        <div style="
          font-weight: 600;
          font-size: 14px;
          color: #16a34a;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                  stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Task Selected
        </div>
        <div id="selected-task-name" style="
          font-size: 13px;
          color: #374151;
          margin-bottom: 12px;
        "></div>
        <div id="task-suggestions" style="
          display: grid;
          gap: 8px;
        "></div>
      </div>
    </div>
  `;

  document.body.innerHTML = '';
  document.body.appendChild(extensionPanel);

  // Add event listeners for task buttons
  document.querySelectorAll('.task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskName = (e.target as HTMLElement).dataset.task || '';
      handleTaskSelection(taskName);
    });
  });
}

function handleTaskSelection(taskName: string) {
  const display = document.getElementById('selected-task-display');
  const taskNameEl = document.getElementById('selected-task-name');
  const suggestionsEl = document.getElementById('task-suggestions');

  if (!display || !taskNameEl || !suggestionsEl) return;

  taskNameEl.textContent = taskName;
  display.style.display = 'block';
  display.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Show loading
  suggestionsEl.innerHTML = `
    <div style="text-align: center; padding: 12px;">
      <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #16a34a; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">Generating suggestions...</div>
    </div>
  `;

  // Simulate getting suggestions (replace with actual API call)
  setTimeout(() => {
    const mockSuggestions = [
      {
        type: "Clarity",
        prompt: `Create a comprehensive ${taskName.toLowerCase()} with clear structure and detailed examples`
      },
      {
        type: "Specificity",
        prompt: `Help me with ${taskName.toLowerCase()} by providing step-by-step guidance and best practices`
      },
      {
        type: "Context",
        prompt: `Generate a ${taskName.toLowerCase()} optimized for professional use with industry standards`
      }
    ];

    suggestionsEl.innerHTML = mockSuggestions.map((s, i) => `
      <div
        class="suggestion-card"
        style="
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          transition: all 0.2s;
        "
        onmouseenter="this.style.borderColor='#16a34a'; this.style.background='#f0fdf4';"
        onmouseleave="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb';"
      >
        <div style="
          font-weight: 600;
          font-size: 11px;
          color: #16a34a;
          background: #dcfce7;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 6px;
        ">
          ${s.type}
        </div>
        <div style="
          font-size: 13px;
          color: #374151;
          line-height: 1.5;
        ">
          ${s.prompt}
        </div>
      </div>
    `).join('');
  }, 800);
}

function togglePopup() {
  if (gaiaPopup) {
    gaiaPopup.style.animation = "fadeIn 0.15s ease-out reverse";
    setTimeout(() => {
      gaiaPopup?.remove();
      gaiaPopup = null;
    }, 150);
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

  // Position popup above the icon, expanding upward
  Object.assign(gaiaPopup.style, {
    position: "fixed",
    bottom: `${window.innerHeight - rect.bottom + 50}px`,
    right: `${window.innerWidth - rect.right + 12}px`,
    width: "320px",
    maxHeight: "400px",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "0",
    zIndex: "999998",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    animation: "slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  });

  document.body.appendChild(gaiaPopup);

  // Show loading state
  gaiaPopup.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #16a34a; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <div style="margin-top: 12px; font-size: 13px; color: #6b7280;">Analyzing your prompt...</div>
    </div>
  `;

  analyzeRealtime(text, (suggestions: PromptSuggestion[] | null) => {
    if (!gaiaPopup) return;

    if (!suggestions || suggestions.length === 0) {
      gaiaPopup.innerHTML = `
        <div style="padding: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div style="font-weight: 600; font-size: 14px; color: #111827;">All good!</div>
          </div>
          <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
            Your prompt looks great. No suggestions at this time.
          </div>
        </div>
      `;
      return;
    }

    gaiaPopup.innerHTML = `
      <div style="
        padding: 16px 18px;
        border-bottom: 1px solid #f3f4f6;
        background: linear-gradient(to bottom, #ffffff, #fafafa);
        border-radius: 12px 12px 0 0;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-weight: 600; font-size: 14px; color: #111827;">
            ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          Click to apply
        </div>
      </div>
      <div style="padding: 8px;">
        ${suggestions
          .map(
            (s, i) => `
          <div
            data-index="${i}"
            class="suggestion-card"
            style="
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 6px;
              cursor: pointer;
              background: #ffffff;
              border: 1.5px solid #e5e7eb;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            "
            onmouseenter="this.style.borderColor='#16a34a'; this.style.background='#f0fdf4'; this.style.transform='translateX(-2px)';"
            onmouseleave="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.transform='translateX(0)';"
          >
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="
                display: inline-block;
                font-weight: 600;
                font-size: 11px;
                color: #16a34a;
                background: #dcfce7;
                padding: 3px 8px;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
              ">
                ${s.type}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="opacity: 0.5;">
                <path d="M9 5l7 7-7 7" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div style="
              font-size: 13px;
              color: #374151;
              line-height: 1.5;
              font-weight: 400;
            ">
              ${s.prompt}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
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

          // Visual feedback
          (el as HTMLElement).style.background = "#dcfce7";
          (el as HTMLElement).style.borderColor = "#16a34a";
          
          setTimeout(() => {
            gaiaPopup?.remove();
            gaiaPopup = null;
          }, 200);
        });
      });
  });
}

function repositionIcon() {
  if (!gaiaIcon) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  gaiaIcon.style.bottom = `${window.innerHeight - rect.bottom + 12}px`;
  gaiaIcon.style.right = `${window.innerWidth - rect.right + 12}px`;
}

function repositionPopup() {
  if (!gaiaPopup) return;

  const editor = getEditor();
  if (!editor) return;

  const rect = editor.getBoundingClientRect();
  gaiaPopup.style.bottom = `${window.innerHeight - rect.bottom + 50}px`;
  gaiaPopup.style.right = `${window.innerWidth - rect.right + 12}px`;
}

// Initialize based on context
function initialize() {
  if (isExtensionPanel()) {
    // Extension panel mode
    createExtensionPanel();
  } else {
    // In-page mode (Grammarly style)
    window.addEventListener("scroll", () => {
      repositionIcon();
      repositionPopup();
    }, true);

    window.addEventListener("resize", () => {
      repositionIcon();
      repositionPopup();
    });

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
  }
}

// Start the extension
initialize();