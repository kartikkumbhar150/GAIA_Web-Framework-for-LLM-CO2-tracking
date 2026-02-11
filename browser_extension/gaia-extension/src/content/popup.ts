import { MODEL_RECOMMENDATIONS, TASK_CATEGORIES } from './constants';
import type { PromptSuggestion, StorageData } from './types';

function checkAuth(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "GET_TOKEN" }, res => {
      if (chrome.runtime.lastError) {
        console.error("❌ Auth check error:", chrome.runtime.lastError);
        resolve(false);
        return;
      }
      resolve(!!res?.token);
    });
  });
}

function renderAuthUI() {
  document.body.innerHTML = `
    <div style="
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(to bottom, #f9fafb, #ffffff);
      min-height: 500px;
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 16px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          color: white;
        ">G</div>
        <h2 style="
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        ">Welcome to GAIA</h2>
        <p style="
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        ">Your AI-powered prompt companion</p>
      </div>

      <div id="auth-tabs" style="
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        background: #f3f4f6;
        padding: 4px;
        border-radius: 8px;
      ">
        <button id="login-tab" class="auth-tab active" style="
          flex: 1;
          padding: 10px;
          border: none;
          background: white;
          color: #16a34a;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        ">Login</button>
        <button id="register-tab" class="auth-tab" style="
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        ">Register</button>
      </div>

      <div id="auth-form">
        <div style="margin-bottom: 16px;">
          <label style="
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
          ">Email</label>
          <input id="email" type="email" placeholder="you@example.com" style="
            width: 100%;
            padding: 10px 12px;
            border: 1.5px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
            box-sizing: border-box;
          "/>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
          ">Password</label>
          <input id="password" type="password" placeholder="••••••••" style="
            width: 100%;
            padding: 10px 12px;
            border: 1.5px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
            box-sizing: border-box;
          "/>
        </div>

        <div id="error-message" style="
          display: none;
          padding: 12px;
          margin-bottom: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
        "></div>

        <button id="submit-btn" style="
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Login</button>
      </div>
    </div>

    <style>
      #email:focus, #password:focus {
        outline: none;
        border-color: #16a34a;
        box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
      }
      
      #submit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      }
      
      #submit-btn:active {
        transform: translateY(0);
      }
      
      #submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .auth-tab:hover {
        background: rgba(255, 255, 255, 0.5);
      }

      .auth-tab.active {
        background: white;
        color: #16a34a;
      }
    </style>
  `;

  let isLoginMode = true;

  const loginTab = document.getElementById("login-tab")!;
  const registerTab = document.getElementById("register-tab")!;
  const submitBtn = document.querySelector<HTMLButtonElement>("#submit-btn")!;
  const errorMessage = document.getElementById("error-message")!;

  const switchMode = (toLogin: boolean) => {
    isLoginMode = toLogin;
    
    if (toLogin) {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      submitBtn.textContent = "Login";
    } else {
      loginTab.classList.remove("active");
      registerTab.classList.add("active");
      submitBtn.textContent = "Register";
    }
    
    errorMessage.style.display = "none";
  };

  loginTab.onclick = () => switchMode(true);
  registerTab.onclick = () => switchMode(false);

  const handleSubmit = () => {
    const email = (document.getElementById("email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("password") as HTMLInputElement).value;

    // Validate input
    if (!email || !password) {
      errorMessage.textContent = "Please enter both email and password";
      errorMessage.style.display = "block";
      return;
    }

    if (password.length < 6) {
      errorMessage.textContent = "Password must be at least 6 characters";
      errorMessage.style.display = "block";
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = isLoginMode ? "Logging in..." : "Registering...";
    errorMessage.style.display = "none";

    const messageType = isLoginMode ? "LOGIN" : "REGISTER";

    chrome.runtime.sendMessage({
      type: messageType,
      payload: { email, password }
    }, res => {
      if (chrome.runtime.lastError) {
        console.error("❌ Runtime error:", chrome.runtime.lastError);
        errorMessage.textContent = "Communication error. Please try again.";
        errorMessage.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? "Login" : "Register";
        return;
      }

      if (res?.success) {
        console.log("✅ Authentication successful");
        location.reload();
      } else {
        console.error("❌ Authentication failed:", res?.error);
        errorMessage.textContent = res?.error || "Authentication failed. Please try again.";
        errorMessage.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? "Login" : "Register";
      }
    });
  };

  submitBtn.onclick = handleSubmit;

  // Allow Enter key to submit
  document.getElementById("email")!.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
  });
  document.getElementById("password")!.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
  });
}

class PopupController {
  private selectedTaskDisplay: HTMLElement | null = null;
  private selectedTaskName: HTMLElement | null = null;
  private taskSuggestions: HTMLElement | null = null;

  constructor() {
    this.initializeElements();
    this.renderTaskCategories();
    this.renderModelRecommendations();
  }

  private initializeElements(): void {
    this.selectedTaskDisplay = document.getElementById('selected-task-display');
    this.selectedTaskName = document.getElementById('selected-task-name');
    this.taskSuggestions = document.getElementById('task-suggestions');
  }

  private renderTaskCategories(): void {
    const container = document.getElementById('task-categories');
    if (!container) return;

    container.innerHTML = TASK_CATEGORIES.map(category => `
      <div class="category">
        <div class="category-header">
          <span class="category-icon">${category.icon}</span>
          ${category.name}
        </div>
        <div class="task-buttons">
          ${category.tasks.map(task => `
            <button class="task-btn" data-task="${task}">
              ${task}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('.task-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        
        // Remove selected class from all buttons
        container.querySelectorAll('.task-btn').forEach(b => 
          b.classList.remove('selected')
        );
        
        // Add selected class to clicked button
        target.classList.add('selected');
        
        const taskName = target.dataset.task;
        if (taskName) {
          this.handleTaskSelection(taskName);
        }
      });
    });
  }

  private renderModelRecommendations(): void {
    const container = document.getElementById('model-recommendations');
    if (!container) return;

    container.innerHTML = MODEL_RECOMMENDATIONS.map(model => `
      <div class="model-card" 
           style="border-color: ${model.color}20;" 
           data-model="${model.name}">
        <div class="model-card-content">
          <div class="model-icon" 
               style="background: linear-gradient(135deg, ${model.color}15, ${model.color}25);">
            ${model.icon}
          </div>
          <div class="model-info">
            <div class="model-name">${model.name}</div>
            <div class="model-description">${model.description}</div>
            <div class="model-tags">
              ${model.bestFor.map(tag => `
                <span class="model-tag" 
                      style="background: ${model.color}15; color: ${model.color};">
                  ${tag}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('.model-card').forEach(card => {
      card.addEventListener('click', () => {
        const modelName = (card as HTMLElement).dataset.model;
        if (modelName) {
          this.handleModelSelection(modelName);
        }
      });
    });
  }

  private handleTaskSelection(taskName: string): void {
    if (!this.selectedTaskDisplay || !this.selectedTaskName || !this.taskSuggestions) {
      return;
    }

    this.selectedTaskName.textContent = taskName;
    this.selectedTaskDisplay.style.display = 'block';

    // Scroll to show the selection
    setTimeout(() => {
      this.selectedTaskDisplay?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }, 100);

    // Show loading
    this.taskSuggestions.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Generating suggestions...</div>
      </div>
    `;

    // Simulate API call (replace with actual implementation)
    setTimeout(() => {
      const suggestions = this.generateSuggestions(taskName);
      this.displaySuggestions(suggestions);
    }, 800);
  }

  private generateSuggestions(taskName: string): PromptSuggestion[] {
    return [
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
  }

  private displaySuggestions(suggestions: PromptSuggestion[]): void {
    if (!this.taskSuggestions) return;

    this.taskSuggestions.innerHTML = suggestions.map((s, i) => `
      <div class="suggestion-card" data-index="${i}">
        <div class="suggestion-type">${s.type}</div>
        <div class="suggestion-text">${s.prompt}</div>
      </div>
    `).join('');

    // Add click handlers
    this.taskSuggestions.querySelectorAll('.suggestion-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        const suggestion = suggestions[index];
        this.copySuggestionToClipboard(suggestion.prompt, card as HTMLElement);
      });
    });
  }

  private handleModelSelection(modelName: string): void {
    // Store selected model preference
    const data: StorageData = { selectedModel: modelName };
    
    chrome.storage.local.set(data, () => {
      console.log('Model selected:', modelName);
      
      // Visual feedback
      const cards = document.querySelectorAll('.model-card');
      cards.forEach(card => {
        if ((card as HTMLElement).dataset.model === modelName) {
          (card as HTMLElement).style.transform = 'scale(0.98)';
          setTimeout(() => {
            (card as HTMLElement).style.transform = 'translateY(-2px)';
          }, 100);
        }
      });
    });
  }

  private copySuggestionToClipboard(text: string, element: HTMLElement): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
      
      // Visual feedback
      element.style.background = '#dcfce7';
      element.style.borderColor = '#16a34a';
      
      this.showToast('Copied to clipboard!');
      
      setTimeout(() => {
        element.style.background = '#f9fafb';
        element.style.borderColor = '#e5e7eb';
      }, 300);
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.showToast('Failed to copy');
    });
  }

  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #111827;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Popup initializing...");
  
  const loggedIn = await checkAuth();

  if (!loggedIn) {
    console.log("⚠️ Not authenticated - showing auth UI");
    renderAuthUI();
    return;
  }

  console.log("✅ Authenticated - showing main UI");
  new PopupController();
});