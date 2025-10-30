// UI Component utilities and types for Hide & Seek Game

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

export interface ProgressBarProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export interface StatusIndicatorProps {
  type: 'success' | 'warning' | 'error' | 'info';
  text: string;
}

export interface PanelProps {
  title?: string;
  children: HTMLElement | string;
}

// Utility functions for creating UI components
export class UIComponents {
  
  /**
   * Create a button element with the specified props
   */
  static createButton(text: string, props: ButtonProps = {}): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    
    // Base classes
    button.className = 'btn';
    
    // Variant classes
    const variant = props.variant || 'primary';
    button.classList.add(`btn-${variant}`);
    
    // Size classes
    if (props.size && props.size !== 'md') {
      button.classList.add(`btn-${props.size}`);
    }
    
    // States
    if (props.disabled) {
      button.disabled = true;
    }
    
    if (props.loading) {
      button.innerHTML = `
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        ${text}
      `;
      button.disabled = true;
    }
    
    return button;
  }
  
  /**
   * Create a modal overlay with content
   */
  static createModal(props: ModalProps): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = `modal-overlay ${props.isOpen ? 'active' : ''}`;
    
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${props.title}</h2>
          <button class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-content"></div>
        <div class="modal-actions"></div>
      </div>
    `;
    
    // Add close functionality
    const closeBtn = overlay.querySelector('.modal-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', props.onClose);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        props.onClose();
      }
    });
    
    return overlay;
  }
  
  /**
   * Create a progress bar element
   */
  static createProgressBar(props: ProgressBarProps): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'progress-bar';
    
    if (props.size && props.size !== 'md') {
      container.classList.add(`progress-bar-${props.size}`);
    }
    
    const fill = document.createElement('div');
    fill.className = 'progress-bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, props.value))}%`;
    
    container.appendChild(fill);
    return container;
  }
  
  /**
   * Create a status indicator
   */
  static createStatusIndicator(props: StatusIndicatorProps): HTMLDivElement {
    const indicator = document.createElement('div');
    indicator.className = `status-indicator status-${props.type}`;
    indicator.textContent = props.text;
    return indicator;
  }
  
  /**
   * Create a panel component
   */
  static createPanel(props: PanelProps): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'panel';
    
    if (props.title) {
      const header = document.createElement('div');
      header.className = 'panel-header';
      header.innerHTML = `<h3 class="panel-title">${props.title}</h3>`;
      panel.appendChild(header);
    }
    
    const content = document.createElement('div');
    content.className = 'panel-content';
    
    if (typeof props.children === 'string') {
      content.innerHTML = props.children;
    } else {
      content.appendChild(props.children);
    }
    
    panel.appendChild(content);
    return panel;
  }
  
  /**
   * Create a card component
   */
  static createCard(content: string | HTMLElement, interactive = false): HTMLDivElement {
    const card = document.createElement('div');
    card.className = `card ${interactive ? 'card-interactive' : ''}`;
    
    if (typeof content === 'string') {
      card.innerHTML = content;
    } else {
      card.appendChild(content);
    }
    
    return card;
  }
  
  /**
   * Create a badge component
   */
  static createBadge(text: string, variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary'): HTMLSpanElement {
    const badge = document.createElement('span');
    badge.className = `badge ${variant !== 'primary' ? `badge-${variant}` : ''}`;
    badge.textContent = text;
    return badge;
  }
  
  /**
   * Show a toast notification
   */
  static showToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', duration = 3000): void {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-panel);
      color: var(--text-primary);
      padding: var(--spacing-md);
      border-radius: var(--border-radius);
      border-left: 4px solid var(--accent-primary);
      box-shadow: var(--shadow-heavy);
      z-index: var(--z-tooltip);
      max-width: 300px;
      animation: slideInFromRight 0.3s ease-out;
    `;
    
    // Set border color based on type
    const colors = {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: 'var(--accent-primary)'
    };
    toast.style.borderLeftColor = colors[type];
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOutToRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// CSS for toast animations (add to main CSS)
export const toastCSS = `
@keyframes slideOutToRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.toast {
  cursor: pointer;
  transition: var(--transition-fast);
}

.toast:hover {
  transform: translateX(-5px);
}
`;