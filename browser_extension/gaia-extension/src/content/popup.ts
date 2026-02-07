import { MODEL_RECOMMENDATIONS, TASK_CATEGORIES } from './constants';
import type { PromptSuggestion, StorageData } from './types';

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
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
