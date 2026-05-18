import { ChatService } from '../services/ChatService';
import type { ChatConfig, ChatState, WidgetState } from '../types';
import { marked } from 'marked';

export interface ChatWidgetConfig extends ChatConfig {
  title?: string;
  placeholder?: string;
  container?: HTMLElement;
  onClose?: () => void;
  lang?: 'ru' | 'en';
  variant?: string;
  customColors?: any;
  mode?: 'floating' | 'inline';
}

export interface ChatWidgetTheme {
  render(state: WidgetState, chatState: ChatState, hasInput: boolean): string;
  getClassName(): string;
  getCSSPath?(): string | undefined;
}

/**
 * Headless Chat Widget - Vanilla JavaScript implementation
 * Manages all widget logic, DOM manipulation, and event handling
 */
export class ChatWidget {
  protected service: ChatService;
  protected config: ChatWidgetConfig;
  protected container: HTMLElement;
  protected widgetState: WidgetState = 'minimized';
  protected inputValue: string = '';
  protected unsubscribe?: () => void;
  protected root?: HTMLElement;
  protected theme: ChatWidgetTheme;

  constructor(config: ChatWidgetConfig, theme: ChatWidgetTheme) {
    this.config = {
      title: 'Chat',
      placeholder: 'Type a message...',
      mode: 'floating',
      ...config,
    };
    this.theme = theme;
    this.widgetState = this.config.mode === 'inline' ? 'full' : 'minimized';

    // Find or create container
    this.container = config.container || this.createDefaultContainer();
    this.container.classList.add(`assistant-widget-container-${this.config.mode || 'floating'}`);

    // Initialize chat service
    const chatServiceConfig = {
      ...config,
      initialLanguage: config.lang || config.initialLanguage,
    };

    this.service = new ChatService(chatServiceConfig, (event) => {
      if (config.debug) {
        console.log('[ChatWidget] Event:', event);
      }
    });

    // Subscribe to state changes
    this.unsubscribe = this.service.store.subscribe(() => {
      this.render();
    });

    // Initial render
    this.render();

    // Auto-connect if not disabled
    if (config.autoConnect !== false) {
      this.service.connect().catch((error) => {
        console.error('[ChatWidget] Auto-connect failed:', error);
      });
    }
  }

  /**
   * Create default container element
   */
  private createDefaultContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'assistant-widget-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Render the widget
   */
  protected render(): void {
    const chatState = this.service.store.getState();
    const hasInput = this.inputValue.trim().length > 0;

    const html = this.theme.render(this.widgetState, chatState, hasInput);

    if (!this.root) {
      this.root = document.createElement('div');
      this.container.appendChild(this.root);

      // Inject theme CSS if provided
      const cssPath = this.theme.getCSSPath?.();
      if (cssPath) {
        this.injectCSS(cssPath);
      }
    }

    // Update root classes
    this.root.className = `assistant-widget ${this.theme.getClassName()} assistant-widget-${this.widgetState} assistant-widget-mode-${this.config.mode || 'floating'}`;

    // Only update innerHTML if it has changed significantly or if we want to support full re-renders
    // For now, we keep the simple innerHTML replacement but the root class handles the transitions
    this.root.innerHTML = html;
    this.attachEventListeners();
    this.scrollToBottom();
  }

  /**
   * Inject theme CSS
   */
  private injectCSS(cssPath: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }

  /**
   * Attach event listeners to rendered DOM
   */
  protected attachEventListeners(): void {
    if (!this.root) return;

    // Header click - expand/collapse
    const header = this.root.querySelector('.chat-header');
    if (header) {
      header.addEventListener('click', (e) => {
        if (this.config.mode === 'inline') {
          return;
        }
        const target = e.target as HTMLElement;
        // Don't toggle if clicking on actual action buttons (like Close or TTS)
        if (target.closest('.chat-header-button')) {
          return;
        }
        this.handleHeaderClick();
      });
    }



    // Close button
    const closeBtn = this.root.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleClose();
      });
    }

    // Input textarea
    const textarea = this.root.querySelector('.chat-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = this.inputValue;

      textarea.addEventListener('input', (e) => {
        const target = e.target as HTMLTextAreaElement;
        const newValue = target.value;
        const wasEmpty = this.inputValue.trim().length === 0;
        const isEmpty = newValue.trim().length === 0;
        
        this.inputValue = newValue;
        this.autoResizeTextarea(textarea);

        // Only re-render if the state of "hasInput" changed (switching between Mic and Send)
        if (wasEmpty !== isEmpty) {
             const selectionStart = target.selectionStart;
             const selectionEnd = target.selectionEnd;
             
             this.render();
             
             // Restore focus and selection
             const newTextarea = this.root?.querySelector('.chat-input') as HTMLTextAreaElement;
             if (newTextarea) {
                 newTextarea.focus();
                 newTextarea.setSelectionRange(selectionStart, selectionEnd);
                 // Ensure value is set (though render should handle it via this.inputValue, explicit is safe)
                 newTextarea.value = this.inputValue;
             }
        }
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      this.autoResizeTextarea(textarea);
    }

    // Primary action button (send)
    const primaryBtn = this.root.querySelector('[data-action="primary"]');
    if (primaryBtn) {
      primaryBtn.addEventListener('click', () => {
        this.handlePrimaryAction();
      });
    }

    // Copy message buttons
    const copyBtns = this.root.querySelectorAll('[data-action="copy"]');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const content = btn.getAttribute('data-content');
        if (content) {
          this.handleCopyMessage(content);
        }
      });
    });

    // Auto-resize textarea on render
    if (textarea) {
      this.autoResizeTextarea(textarea);
    }
  }

  /**
   * Auto-resize textarea based on content
   */
  protected autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  /**
   * Scroll messages to bottom
   */
  protected scrollToBottom(): void {
    if (!this.root) return;
    const messagesContainer = this.root.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Handle header click
   */
  protected handleHeaderClick(): void {
    if (this.widgetState === 'minimized') {
      // If we have messages, go to full, otherwise input only
      const hasMessages = this.service.store.getState().messages.length > 0;
      this.setWidgetState(hasMessages ? 'full' : 'input-only');
    } else {
      // If expanded (full or input-only), clicking header minimizes
      this.setWidgetState('minimized');
    }
  }

  /**
   * Handle primary action (send)
   */
  protected async handlePrimaryAction(): Promise<void> {
    if (this.inputValue.trim()) {
      await this.handleSendMessage();
    }
  }

  /**
   * Handle send message
   */
  protected async handleSendMessage(): Promise<void> {
    const message = this.inputValue;
    if (!message.trim()) {
      return;
    }

    this.inputValue = '';
    
    // Auto-expand to full if not already
    if (this.widgetState !== 'full') {
       this.setWidgetState('full');
    } else {
      this.render();
    }

    try {
      await this.service.sendMessage(message);
    } catch (error) {
      console.error('[ChatWidget] Failed to send message:', error);
    }
  }

  /**
   * Handle copy message
   */
  protected handleCopyMessage(content: string): void {
    navigator.clipboard.writeText(content).catch((error) => {
      console.error('[ChatWidget] Failed to copy:', error);
    });
  }

  /**
   * Handle close (cross button)
   * Clears messages and effectively transitions to input-only
   */
  protected handleClose(): void {
    // Clear messages
    this.service.clearMessages();

    // Inline embeds keep their stable full-height frame.
    this.setWidgetState(this.config.mode === 'inline' ? 'full' : 'input-only');
  }

  /**
   * Set widget state
   */
  public setWidgetState(state: WidgetState): void {
    this.widgetState = state;
    this.render();
  }

  /**
   * Get widget state
   */
  public getWidgetState(): WidgetState {
    return this.widgetState;
  }

  /**
   * Get chat service instance
   */
  public getService(): ChatService {
    return this.service;
  }

  /**
   * Destroy widget and cleanup
   */
  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.service.disconnect();
    if (this.root) {
      this.root.remove();
    }
  }

  /**
   * Update widget configuration dynamically
   */
  public updateConfig(config: Partial<ChatWidgetConfig>): void {
    // Update internal config
    this.config = { ...this.config, ...config };

    if (config.mode === 'inline') {
      this.widgetState = 'full';
    }

    // Update language if changed
    if (config.lang) {
      this.service.setLanguage(config.lang);
      if ('setLanguage' in this.theme) {
        (this.theme as any).setLanguage(config.lang);
      }
    }

    // Update theme other properties
    if ('updateConfig' in this.theme) {
       (this.theme as any).updateConfig(config);
    }

    // Trigger re-render
    this.render();
  }

  /**
   * Render markdown content
   */
  protected renderMarkdown(content: string): string {
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return content;
    }
  }
}
