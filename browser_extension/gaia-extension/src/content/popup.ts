import { 
  LLM_MODELS, 
  IMAGE_MODELS, 
  VIDEO_MODELS, 
  AUDIO_MODELS,
  TASK_CATEGORIES,
  PLATFORMS,
  getSmartRecommendations,
  getCO2RatingColor,
  getCO2RatingIcon,
  getCO2RatingLabel,
  getEcoFriendlyModels
} from './constants';
import type { 
  ModelRecommendation, 
  UserPreferences,
  TaskCategory,
  StorageData
} from './types';

// ==================== AUTH CHECK ====================

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
          background: linear-gradient(135deg, #10a37f 0%, #0d8768 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          color: white;
        ">🤖</div>
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
        ">AI Model Recommendation Engine</p>
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
          color: #10a37f;
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
          background: linear-gradient(135deg, #10a37f 0%, #0d8768 100%);
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
        border-color: #10a37f;
        box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
      }
      
      #submit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
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
        color: #10a37f;
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

  document.getElementById("email")!.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
  });
  document.getElementById("password")!.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
  });
}

// ==================== MAIN CONTROLLER ====================

class GAIAController {
  private currentFilter: string = 'all';
  private selectedTask: string | null = null;
  private userPreferences: UserPreferences;
  private comparisonModels: ModelRecommendation[] = [];
  private showEcoMetrics: boolean = false;

  constructor() {
    // Initialize with proper default values
    this.userPreferences = {
      priority: 'balanced',
      budget: 'medium',
      expertise: 'intermediate',
      useCase: 'professional'
    };
    
    this.loadPreferences();
    this.initializeUI();
    this.attachEventListeners();
  }

  // ========== INITIALIZATION ==========

  private async loadPreferences() {
  const data = await chrome.storage.local.get([
    'userPreferences',
    'showEcoMetrics'
  ]) as Partial<StorageData>;

  const saved = data.userPreferences;

  if (saved) {
    this.userPreferences = {
      priority: saved.priority ?? 'balanced',
      budget: saved.budget ?? 'medium',
      expertise: saved.expertise ?? 'intermediate',
      useCase: saved.useCase ?? 'professional'
    };
  }

  this.showEcoMetrics = Boolean(data.showEcoMetrics);
}

  private async savePreferences() {
    await chrome.storage.local.set({ 
      userPreferences: this.userPreferences,
      showEcoMetrics: this.showEcoMetrics
    });
  }

  private initializeUI() {
    this.renderTaskGrid();
    this.renderAllModels();
    this.renderPreferences();
    this.showAllModels();
  }

  private attachEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.handleTabSwitch(tab));
    });

    // Search
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch((e.target as HTMLInputElement).value);
      });
    }

    // Filters
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => this.handleFilterChange(chip));
    });

    // Preferences
    document.querySelectorAll('.preference-option').forEach(option => {
      option.addEventListener('click', () => this.handlePreferenceChange(option));
    });

    // Eco metrics toggle
    const ecoToggle = document.getElementById('eco-metrics-toggle');
    if (ecoToggle) {
      ecoToggle.addEventListener('change', (e) => {
        this.showEcoMetrics = (e.target as HTMLInputElement).checked;
        this.savePreferences();
        this.refreshCurrentView();
      });
      (ecoToggle as HTMLInputElement).checked = this.showEcoMetrics;
    }
  }

  // ========== TAB MANAGEMENT ==========

  private handleTabSwitch(tab: Element) {
    const tabName = tab.getAttribute('data-tab');
    if (!tabName) return;

    // Update tab UI
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    // Initialize tab-specific content
    if (tabName === 'compare') {
      this.renderComparisonSelector();
    }
  }

  // ========== TASK GRID ==========

  private renderTaskGrid() {
    const grid = document.getElementById('task-grid');
    if (!grid) return;

    grid.innerHTML = TASK_CATEGORIES.map(category => `
      <div class="task-card" data-task-id="${category.id}">
        <div class="task-icon">${category.icon}</div>
        <div class="task-name">${category.name}</div>
      </div>
    `).join('');

    // Attach click handlers
    grid.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        const taskId = card.getAttribute('data-task-id');
        if (taskId) this.handleTaskSelection(taskId, card);
      });
    });
  }

  // ========== TASK SELECTION ==========

  private handleTaskSelection(taskId: string, element: Element) {
    // Update UI
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');

    this.selectedTask = taskId;

    // Get task category
    const task = TASK_CATEGORIES.find(t => t.id === taskId);
    if (!task) return;

    // Generate recommendations
    this.showRecommendations(task);

    // Scroll to recommendations
    setTimeout(() => {
      document.getElementById('recommendations-container')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 100);
  }

  // ========== RECOMMENDATIONS ==========

  private showRecommendations(task: TaskCategory) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    // Show loading first
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Analyzing your task and finding the best models...</div>
      </div>
    `;

    // Simulate AI processing
    setTimeout(() => {
      const recommendations = this.generateRecommendations(task);
      container.innerHTML = this.renderRecommendations(task, recommendations);
    }, 800);
  }

  private generateRecommendations(task: TaskCategory) {
    const recs: { [key: string]: ModelRecommendation[] } = {};
    
    // Get LLM recommendations
    if (task.recommendedModels.llm) {
      recs.llm = LLM_MODELS.filter(m => 
        task.recommendedModels.llm?.includes(m.name)
      );
      
      // Apply user preferences
      if (this.userPreferences.budget === 'free') {
        recs.llm = recs.llm.filter(m => 
          m.tier === 'open-source' || m.pricing.toLowerCase().includes('free')
        );
      }
      
      if (this.userPreferences.priority === 'cost') {
        recs.llm.sort((a, b) => {
          const tierOrder: Record<ModelRecommendation['tier'], number> = { 
            'value': 0, 
            'efficient': 1, 
            'open-source': 2, 
            'specialized': 3,
            'premium': 4, 
            'flagship': 5,
            'enterprise': 6
          };
          return tierOrder[a.tier] - tierOrder[b.tier];
        });
      } else if (this.userPreferences.priority === 'eco-friendly') {
        // Sort by CO2 emissions rating
        recs.llm.sort((a, b) => {
          const ratingOrder: Record<string, number> = {
            'very-low': 1,
            'low': 2,
            'low-medium': 3,
            'medium': 4,
            'medium-high': 5,
            'high': 6,
            'very-high': 7
          };
          const aRating = a.co2Emissions?.rating || 'medium';
          const bRating = b.co2Emissions?.rating || 'medium';
          return ratingOrder[aRating] - ratingOrder[bRating];
        });
      }
    }

    // Get Image recommendations
    if (task.recommendedModels.image) {
      recs.image = IMAGE_MODELS.filter(m => 
        task.recommendedModels.image?.includes(m.name)
      );
      
      if (this.userPreferences.priority === 'eco-friendly' && recs.image.length > 0) {
        recs.image.sort((a, b) => {
          const ratingOrder: Record<string, number> = {
            'very-low': 1, 'low': 2, 'low-medium': 3, 'medium': 4,
            'medium-high': 5, 'high': 6, 'very-high': 7
          };
          const aRating = a.co2Emissions?.rating || 'medium';
          const bRating = b.co2Emissions?.rating || 'medium';
          return ratingOrder[aRating] - ratingOrder[bRating];
        });
      }
    }

    // Get Video recommendations
    if (task.recommendedModels.video) {
      recs.video = VIDEO_MODELS.filter(m => 
        task.recommendedModels.video?.includes(m.name)
      );
      
      if (this.userPreferences.priority === 'eco-friendly' && recs.video.length > 0) {
        recs.video.sort((a, b) => {
          const ratingOrder: Record<string, number> = {
            'very-low': 1, 'low': 2, 'low-medium': 3, 'medium': 4,
            'medium-high': 5, 'high': 6, 'very-high': 7
          };
          const aRating = a.co2Emissions?.rating || 'medium';
          const bRating = b.co2Emissions?.rating || 'medium';
          return ratingOrder[aRating] - ratingOrder[bRating];
        });
      }
    }

    // Get Audio recommendations
    if (task.recommendedModels.audio) {
      recs.audio = AUDIO_MODELS.filter(m => 
        task.recommendedModels.audio?.includes(m.name)
      );
      
      if (this.userPreferences.priority === 'eco-friendly' && recs.audio.length > 0) {
        recs.audio.sort((a, b) => {
          const ratingOrder: Record<string, number> = {
            'very-low': 1, 'low': 2, 'low-medium': 3, 'medium': 4,
            'medium-high': 5, 'high': 6, 'very-high': 7
          };
          const aRating = a.co2Emissions?.rating || 'medium';
          const bRating = b.co2Emissions?.rating || 'medium';
          return ratingOrder[aRating] - ratingOrder[bRating];
        });
      }
    }

    return recs;
  }

  private renderRecommendations(
    task: TaskCategory,
    recommendations: { [key: string]: ModelRecommendation[] }
  ): string {
    const priorityLabels = {
      'quality': 'highest quality',
      'speed': 'fastest performance',
      'cost': 'best value',
      'balanced': 'balanced performance',
      'eco-friendly': 'lowest environmental impact'
    };

    let html = `
      <div class="recommendation-card">
        <div class="recommendation-header">
          <div class="recommendation-icon">${task.icon}</div>
          <div>
            <div class="recommendation-title">Recommended for ${task.name}</div>
            <div class="recommendation-subtitle">Based on your preferences and task requirements</div>
          </div>
        </div>

        <div class="reason-list">
          <div class="reason-item">
            <span class="reason-icon">✓</span>
            <span>Optimized for ${priorityLabels[this.userPreferences.priority]}</span>
          </div>
          <div class="reason-item">
            <span class="reason-icon">✓</span>
            <span>Matches ${this.userPreferences.budget} budget tier</span>
          </div>
          <div class="reason-item">
            <span class="reason-icon">✓</span>
            <span>Suitable for ${this.userPreferences.expertise} users</span>
          </div>
        </div>
      </div>
    `;

    // Render each model type
    Object.entries(recommendations).forEach(([type, models]) => {
      if (models.length > 0) {
        const typeLabels = {
          llm: '💬 Language Models',
          image: '🖼️ Image Generation',
          video: '🎬 Video Generation',
          audio: '🎙️ Audio/Voice'
        };

        html += `
          <div class="section">
            <div class="section-title">${typeLabels[type as keyof typeof typeLabels]}</div>
            <div class="model-grid">
              ${models.map(model => this.createModelCard(model)).join('')}
            </div>
          </div>
        `;
      }
    });

    return html;
  }

  // ========== MODEL RENDERING ==========

  private createModelCard(model: ModelRecommendation): string {
    const tierClass = `tier-${model.tier.replace(' ', '-')}`;
    const co2 = model.co2Emissions;
    
    // CO2 badge HTML
    const co2Badge = co2 && this.showEcoMetrics ? `
      <div class="co2-badge" style="
        background: ${getCO2RatingColor(co2.rating)}15;
        border-left: 3px solid ${getCO2RatingColor(co2.rating)};
        padding: 8px 12px;
        margin-top: 12px;
        border-radius: 6px;
      ">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 14px;">${getCO2RatingIcon(co2.rating)}</span>
          <span style="
            font-size: 11px;
            font-weight: 600;
            color: ${getCO2RatingColor(co2.rating)};
          ">${getCO2RatingLabel(co2.rating)}</span>
        </div>
        <div style="font-size: 11px; color: #6b7280;">
          ${co2.perRequest} per request
          ${co2.comparison ? `<br/><span style="font-size: 10px;">${co2.comparison}</span>` : ''}
        </div>
      </div>
    ` : '';
    
    return `
      <div class="model-card" style="--model-color: ${model.color}; --icon-bg: ${model.color}15; --tag-bg: ${model.color}15; --tag-color: ${model.color}">
        <div class="model-header">
          <div class="model-icon" style="background: ${model.color}15">
            ${model.icon}
          </div>
          <div class="model-info">
            <div class="model-name-row">
              <div class="model-name">${model.name}</div>
              <div class="model-tier ${tierClass}">${model.tier}</div>
            </div>
            <div class="model-platform">${model.platform}</div>
            <div class="model-description">${model.description}</div>
          </div>
        </div>

        <div class="model-tags">
          ${model.bestFor.slice(0, 3).map(tag => 
            `<div class="model-tag">${tag}</div>`
          ).join('')}
        </div>

        ${co2Badge}

        <div class="model-footer">
          <div class="model-pricing">${model.pricing}</div>
          <div class="model-actions">
            <button class="action-btn action-btn-secondary" onclick="window.open('https://google.com/search?q=${encodeURIComponent(model.name + ' ' + model.platform)}', '_blank')">
              Learn More
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderAllModels() {
    // Will be called initially and after filter changes
  }

  private showAllModels() {
    const grid = document.getElementById('all-models-grid');
    if (!grid) return;

    let allModels: ModelRecommendation[] = [];

    switch (this.currentFilter) {
      case 'llm':
        allModels = LLM_MODELS;
        break;
      case 'image':
        allModels = IMAGE_MODELS;
        break;
      case 'video':
        allModels = VIDEO_MODELS;
        break;
      case 'audio':
        allModels = AUDIO_MODELS;
        break;
      case 'eco-friendly':
        allModels = getEcoFriendlyModels('low');
        break;
      default:
        allModels = [
          ...LLM_MODELS.slice(0, 3),
          ...IMAGE_MODELS.slice(0, 2),
          ...VIDEO_MODELS.slice(0, 2),
          ...AUDIO_MODELS.slice(0, 2)
        ];
    }

    // Sort by eco-friendliness if eco-friendly priority is set
    if (this.userPreferences.priority === 'eco-friendly') {
      allModels.sort((a, b) => {
        const ratingOrder: Record<string, number> = {
          'very-low': 1, 'low': 2, 'low-medium': 3, 'medium': 4,
          'medium-high': 5, 'high': 6, 'very-high': 7
        };
        const aRating = a.co2Emissions?.rating || 'medium';
        const bRating = b.co2Emissions?.rating || 'medium';
        return ratingOrder[aRating] - ratingOrder[bRating];
      });
    }

    grid.innerHTML = allModels.map(model => this.createModelCard(model)).join('');
  }

  // ========== FILTER HANDLING ==========

  private handleFilterChange(chip: Element) {
    const filter = chip.getAttribute('data-filter');
    if (!filter) return;

    // Update UI
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    this.currentFilter = filter;
    this.showAllModels();
  }

  // ========== SEARCH ==========

  private handleSearch(query: string) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      this.showAllModels();
      return;
    }

    // Search across all models
    const allModels = [
      ...LLM_MODELS,
      ...IMAGE_MODELS,
      ...VIDEO_MODELS,
      ...AUDIO_MODELS
    ];

    const results = allModels.filter(model => 
      model.name.toLowerCase().includes(normalizedQuery) ||
      model.description.toLowerCase().includes(normalizedQuery) ||
      model.bestFor.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
      model.platform.toLowerCase().includes(normalizedQuery)
    );

    const grid = document.getElementById('all-models-grid');
    if (!grid) return;

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No models found</div>
          <div class="empty-subtitle">Try a different search term</div>
        </div>
      `;
    } else {
      grid.innerHTML = results.map(model => this.createModelCard(model)).join('');
    }
  }

  // ========== PREFERENCES ==========

  private renderPreferences() {
    const prefs = this.userPreferences;
    
    // Update UI to reflect current preferences
    document.querySelectorAll('.preference-option').forEach(option => {
      const pref = option.getAttribute('data-pref') as keyof UserPreferences;
      const value = option.getAttribute('data-value');
      
      if (pref && value && prefs[pref] === value) {
        option.classList.add('selected');
      }
    });
  }

  private handlePreferenceChange(option: Element) {
    const pref = option.getAttribute('data-pref') as keyof UserPreferences;
    const value = option.getAttribute('data-value');
    
    if (!pref || !value) return;

    // Update preferences with proper type casting for each property
    if (pref === 'priority') {
      this.userPreferences.priority = value as UserPreferences['priority'];
    } else if (pref === 'budget') {
      this.userPreferences.budget = value as UserPreferences['budget'];
    } else if (pref === 'expertise') {
      this.userPreferences.expertise = value as UserPreferences['expertise'];
    } else if (pref === 'useCase') {
      this.userPreferences.useCase = value as UserPreferences['useCase'];
    }
    
    this.savePreferences();

    // Update UI
    document.querySelectorAll(`[data-pref="${pref}"]`).forEach(opt => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');

    // Show toast
    this.showToast(`Preference updated: ${pref} = ${value}`);

    // Refresh current view
    this.refreshCurrentView();
  }

  private refreshCurrentView() {
    // Refresh recommendations if task is selected
    if (this.selectedTask) {
      const task = TASK_CATEGORIES.find(t => t.id === this.selectedTask);
      if (task) {
        this.showRecommendations(task);
      }
    }
    
    // Refresh all models view
    this.showAllModels();
  }

  // ========== COMPARISON ==========

  private renderComparisonSelector() {
    const container = document.getElementById('comparison-selector');
    if (!container) return;

    container.innerHTML = `
      <div class="section-subtitle">Select 2-4 models to compare</div>
      <div class="model-grid" id="comparison-model-grid"></div>
    `;

    const grid = document.getElementById('comparison-model-grid');
    if (!grid) return;

    const allModels = [...LLM_MODELS.slice(0, 5)];
    grid.innerHTML = allModels.map(model => `
      <div class="comparison-card" data-model-name="${model.name}">
        <div style="font-weight: 600; margin-bottom: 4px;">${model.name}</div>
        <div style="font-size: 11px; color: #6b7280;">${model.platform}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.comparison-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('comparison-card-selected');
        this.updateComparison();
      });
    });
  }

  private updateComparison() {
    const selected = document.querySelectorAll('.comparison-card-selected');
    const resultsContainer = document.getElementById('comparison-results');
    
    if (!resultsContainer) return;
    
    if (selected.length < 2) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚖️</div>
          <div class="empty-title">Select at least 2 models</div>
          <div class="empty-subtitle">Click on models above to compare</div>
        </div>
      `;
      return;
    }

    // Render comparison
    const modelNames = Array.from(selected).map(el => el.getAttribute('data-model-name')).filter(Boolean) as string[];
    const models = LLM_MODELS.filter(m => modelNames.includes(m.name));

    resultsContainer.innerHTML = `
      <div class="comparison-grid">
        ${models.map(model => this.renderComparisonCard(model)).join('')}
      </div>
    `;
  }

  private renderComparisonCard(model: ModelRecommendation): string {
    const co2 = model.co2Emissions;
    
    return `
      <div class="model-card">
        <div class="model-header">
          <div class="model-icon">${model.icon}</div>
          <div class="model-info">
            <div class="model-name">${model.name}</div>
            <div class="model-platform">${model.platform}</div>
          </div>
        </div>
        <div style="margin-top: 12px;">
          <div class="metric-row">
            <span class="metric-label">Quality</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${this.getQualityScore(model)}%"></div>
            </div>
            <span class="metric-value">${this.getQualityScore(model)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Speed</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${this.getSpeedScore(model)}%"></div>
            </div>
            <span class="metric-value">${this.getSpeedScore(model)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Cost</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${this.getCostScore(model)}%"></div>
            </div>
            <span class="metric-value">${this.getCostScore(model)}</span>
          </div>
          ${co2 ? `
            <div class="metric-row">
              <span class="metric-label">Eco ${getCO2RatingIcon(co2.rating)}</span>
              <div class="metric-bar">
                <div class="metric-fill" style="
                  width: ${this.getEcoScore(model)}%;
                  background: ${getCO2RatingColor(co2.rating)};
                "></div>
              </div>
              <span class="metric-value">${this.getEcoScore(model)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getQualityScore(model: ModelRecommendation): number {
    const tierScores: Record<ModelRecommendation['tier'], number> = {
      'flagship': 95,
      'premium': 85,
      'specialized': 80,
      'efficient': 70,
      'value': 65,
      'open-source': 75,
      'enterprise': 90
    };
    return tierScores[model.tier];
  }

  private getSpeedScore(model: ModelRecommendation): number {
    const tierScores: Record<ModelRecommendation['tier'], number> = {
      'flagship': 70,
      'premium': 75,
      'specialized': 80,
      'efficient': 95,
      'value': 85,
      'open-source': 60,
      'enterprise': 80
    };
    return tierScores[model.tier];
  }

  private getCostScore(model: ModelRecommendation): number {
    const tierScores: Record<ModelRecommendation['tier'], number> = {
      'flagship': 30,
      'premium': 50,
      'specialized': 60,
      'efficient': 80,
      'value': 95,
      'open-source': 100,
      'enterprise': 40
    };
    return tierScores[model.tier];
  }

  private getEcoScore(model: ModelRecommendation): number {
    const ratingScores: Record<string, number> = {
      'very-low': 100,
      'low': 85,
      'low-medium': 75,
      'medium': 60,
      'medium-high': 45,
      'high': 30,
      'very-high': 15
    };
    const rating = model.co2Emissions?.rating || 'medium';
    return ratingScores[rating];
  }

  // ========== UTILITIES ==========

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #111827;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 GAIA Popup initializing...");
  
  const loggedIn = await checkAuth();

  if (!loggedIn) {
    console.log("⚠️ Not authenticated - showing auth UI");
    renderAuthUI();
    return;
  }

  console.log("✅ Authenticated - initializing GAIA");
  new GAIAController();
});