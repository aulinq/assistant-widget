import { ChatService } from '../services/ChatService';
import type { ChatConfig, ChatState, Message, WidgetState } from '../types';
import { marked } from 'marked';

export interface ChatWidgetConfig extends ChatConfig {
  title?: string;
  placeholder?: string;
  container?: HTMLElement;
  onClose?: () => void;
  lang?: string;
  variant?: string;
  customColors?: any;
  mode?: 'floating' | 'inline';
  position?: string;
  welcomeMessage?: string;
  suggestions?: string[];
  /** When true, widget starts collapsed even if it has messages/welcome message */
  startMinimized?: boolean;
}

export interface ChatWidgetTheme {
  render(state: WidgetState, chatState: ChatState, hasInput: boolean): string;
  getClassName(): string;
  getCSSPath?(): string | undefined;
}

type MessagesScrollSnapshot = {
  top: number;
  bottomOffset: number;
  isNearBottom: boolean;
};

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
  private displayedMessageContent = new Map<string, string>();
  private targetMessageContent = new Map<string, string>();
  private revealTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private scrollFrame: number | null = null;
  private wasPresentationStreaming = false;
  private lastRenderedMessageSignature = '';
  private readonly messageRevealDelayMs = 18;
  private readonly bottomFollowThresholdPx = 48;

  constructor(config: ChatWidgetConfig, theme: ChatWidgetTheme) {
    this.config = {
      title: 'Chat',
      placeholder: 'Type a message...',
      mode: 'floating',
      ...config,
    };
    this.theme = theme;

    // Find or create container
    this.container = config.container || this.createDefaultContainer();
    this.syncContainerClasses();

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

    this.widgetState = this.config.startMinimized ? 'minimized' : (
      this.config.mode === 'inline' ? 'full' : (this.service.store.getState().messages.length > 0 ? 'full' : 'minimized')
    );
    this.seedPresentationState(this.service.store.getState().messages);

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

  private syncContainerClasses(): void {
    const mode = this.config.mode || 'floating';

    this.container.classList.remove(
      'assistant-widget-container-floating',
      'assistant-widget-container-inline',
      'assistant-widget-container-bottom',
      'assistant-widget-container-top',
      'assistant-widget-container-left',
      'assistant-widget-container-right'
    );

    this.container.classList.add(`assistant-widget-container-${mode}`);

    if (mode !== 'inline' && this.config.position) {
      this.container.classList.add(`assistant-widget-container-${this.config.position}`);
    }
  }

  /**
   * Render the widget
   */
  protected render(): void {
    const scrollSnapshot = this.getMessagesScrollSnapshot();
    const chatState = this.service.store.getState();
    const presentationState = this.buildPresentationState(chatState);
    const messageSignature = this.getMessageSignature(presentationState);
    const messagesChanged = messageSignature !== this.lastRenderedMessageSignature;
    const hasInput = this.inputValue.trim().length > 0;

    const html = this.theme.render(this.widgetState, presentationState, hasInput);

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
    const isPresentationStreaming = this.hasPresentationStreaming(presentationState) || chatState.isTyping;
    this.syncMessagesScroll({
      previous: scrollSnapshot,
      shouldFollow: messagesChanged && (isPresentationStreaming || this.wasPresentationStreaming || scrollSnapshot?.isNearBottom !== false),
      smooth: messagesChanged && !isPresentationStreaming && !this.wasPresentationStreaming,
    });
    this.lastRenderedMessageSignature = messageSignature;
    this.wasPresentationStreaming = isPresentationStreaming;
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

    // Suggestion chips
    const suggestionChips = this.root.querySelectorAll('[data-action="suggestion"]');
    suggestionChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-suggestion');
        if (text) {
          this.inputValue = text;
          this.handleSendMessage();
        }
      });
    });

    // Copy message buttons
    const copyBtns = this.root.querySelectorAll('[data-action="copy"]');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const content = btn.getAttribute('data-content');
        if (content) {
          this.handleCopyMessage(content, btn as HTMLElement);
        }
      });
    });

    const likeBtns = this.root.querySelectorAll('[data-action="like"]');
    likeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        let runId = btn.getAttribute('data-run-id');
        console.log('[ChatWidget] Like button clicked. Attribute run-id:', runId, 'Fallback lastRunId:', (this.service as any).lastRunId);
        if (!runId) {
          runId = (this.service as any).lastRunId || '';
        }
        if (runId) {
          this.handleRateMessage(runId, 'like');
        } else {
          console.warn('[ChatWidget] Like clicked but no runId is available (both attribute and fallback are empty).');
        }
      });
    });

    const dislikeBtns = this.root.querySelectorAll('[data-action="dislike"]');
    dislikeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        let runId = btn.getAttribute('data-run-id');
        console.log('[ChatWidget] Dislike button clicked. Attribute run-id:', runId, 'Fallback lastRunId:', (this.service as any).lastRunId);
        if (!runId) {
          runId = (this.service as any).lastRunId || '';
        }
        if (runId) {
          this.handleRateMessage(runId, 'dislike');
        } else {
          console.warn('[ChatWidget] Dislike clicked but no runId is available (both attribute and fallback are empty).');
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

  private getMessagesScrollSnapshot(): MessagesScrollSnapshot | null {
    if (!this.root) return null;
    const messagesContainer = this.root.querySelector('.chat-messages') as HTMLElement | null;
    if (!messagesContainer) return null;

    const bottomOffset = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    return {
      top: messagesContainer.scrollTop,
      bottomOffset,
      isNearBottom: bottomOffset <= this.bottomFollowThresholdPx,
    };
  }

  private syncMessagesScroll(options: { previous: MessagesScrollSnapshot | null; shouldFollow: boolean; smooth: boolean }): void {
    if (!this.root) return;
    const messagesContainer = this.root.querySelector('.chat-messages') as HTMLElement | null;
    if (!messagesContainer) return;

    if (this.scrollFrame !== null && typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
    }

    if (!options.shouldFollow) {
      this.restoreMessagesScroll(messagesContainer, options.previous);
      return;
    }

    const bottom = messagesContainer.scrollHeight;
    if (!options.smooth) {
      messagesContainer.scrollTop = bottom;
      return;
    }

    this.restoreMessagesScroll(messagesContainer, options.previous);
    const scroll = () => {
      if (typeof messagesContainer.scrollTo === 'function') {
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
      } else {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      this.scrollFrame = null;
    };

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      this.scrollFrame = window.requestAnimationFrame(scroll);
    } else {
      scroll();
    }
  }

  private restoreMessagesScroll(messagesContainer: HTMLElement, previous: MessagesScrollSnapshot | null): void {
    if (!previous) return;

    const maxTop = Math.max(0, messagesContainer.scrollHeight - messagesContainer.clientHeight);
    messagesContainer.scrollTop = previous.isNearBottom
      ? maxTop
      : Math.min(previous.top, maxTop);
  }

  private getMessageSignature(chatState: ChatState): string {
    return chatState.messages
      .map((message) => `${message.id}:${message.type || 'text'}:${message.role}:${message.content.length}:${message.content}`)
      .join('|');
  }

  private hasPresentationStreaming(chatState: ChatState): boolean {
    return chatState.messages.some((message) => Boolean(message.metadata?.presentationStreaming));
  }

  private seedPresentationState(messages: Message[]): void {
    for (const message of messages) {
      if (this.shouldRevealMessage(message)) {
        const initialContent = message.id === 'welcome' ? '' : message.content;
        this.displayedMessageContent.set(message.id, initialContent);
        this.targetMessageContent.set(message.id, message.content);
      }
    }
  }

  private buildPresentationState(chatState: ChatState): ChatState {
    const visibleIds = new Set(chatState.messages.map((message) => message.id));
    this.prunePresentationState(visibleIds);

    return {
      ...chatState,
      messages: chatState.messages.map((message) => {
        if (!this.shouldRevealMessage(message)) {
          return message;
        }

        const targetContent = message.content;
        let displayedContent = this.displayedMessageContent.get(message.id);

        if (displayedContent === undefined) {
          displayedContent = '';
        }

        if (!targetContent.startsWith(displayedContent)) {
          displayedContent = '';
        }

        this.targetMessageContent.set(message.id, targetContent);
        this.displayedMessageContent.set(message.id, displayedContent);

        const isPresentationStreaming = displayedContent.length < targetContent.length;
        if (isPresentationStreaming) {
          this.scheduleMessageReveal(message.id);
        }

        return {
          ...message,
          content: displayedContent,
          metadata: {
            ...message.metadata,
            presentationStreaming: isPresentationStreaming,
          },
        };
      }),
    };
  }

  private shouldRevealMessage(message: Message): boolean {
    return message.role === 'assistant' && (message.type === undefined || message.type === 'text') && message.content.length > 0;
  }

  private scheduleMessageReveal(messageId: string): void {
    if (this.revealTimers.has(messageId)) {
      return;
    }

    const timer = setTimeout(() => {
      this.revealTimers.delete(messageId);

      const targetContent = this.targetMessageContent.get(messageId);
      const displayedContent = this.displayedMessageContent.get(messageId) ?? '';

      if (!targetContent || displayedContent.length >= targetContent.length) {
        return;
      }

      const revealCount = this.getRevealCount(targetContent.length - displayedContent.length);
      this.displayedMessageContent.set(messageId, targetContent.slice(0, displayedContent.length + revealCount));
      this.render();
    }, this.messageRevealDelayMs);

    this.revealTimers.set(messageId, timer);
  }

  private getRevealCount(remainingCharacters: number): number {
    if (remainingCharacters > 900) return 12;
    if (remainingCharacters > 400) return 8;
    if (remainingCharacters > 180) return 5;
    return 2;
  }

  private prunePresentationState(visibleIds: Set<string>): void {
    for (const messageId of this.displayedMessageContent.keys()) {
      if (!visibleIds.has(messageId)) {
        this.displayedMessageContent.delete(messageId);
        this.targetMessageContent.delete(messageId);
        const timer = this.revealTimers.get(messageId);
        if (timer) {
          clearTimeout(timer);
          this.revealTimers.delete(messageId);
        }
      }
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

  protected handleCopyMessage(content: string, btn?: HTMLElement): void {
    navigator.clipboard.writeText(content).then(() => {
      if (btn) {
        btn.classList.add('copied');
        setTimeout(() => {
          btn.classList.remove('copied');
        }, 800);
      }
    }).catch((error) => {
      console.error('[ChatWidget] Failed to copy:', error);
    });
  }

  protected async handleRateMessage(runId: string, rating: string): Promise<void> {
    const messages = this.service.store.getState().messages;
    let newRating = rating;
    for (const msg of messages) {
      if (msg.metadata?.run_id === runId) {
        if (msg.metadata?.rating === rating) {
          newRating = ''; // toggle off
        }
        break;
      }
    }

    try {
      await this.service.sendFeedback(runId, newRating);
      for (const msg of messages) {
        if (msg.metadata?.run_id === runId) {
          this.service.store.updateMessageDetails(msg.id, {
            metadata: { ...msg.metadata, rating: newRating },
          });
          break;
        }
      }
    } catch (error) {
      console.error('[ChatWidget] Failed to send feedback:', error);
    }
  }

  /**
   * Handle close (cross button)
   * Clears messages and effectively transitions to input-only
   */
  protected handleClose(): void {
    this.clearPresentationState();

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
    this.clearPresentationState();
    if (this.scrollFrame !== null && typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
    }
    this.service.disconnect();
    if (this.root) {
      this.root.remove();
    }
    // Clean up container classes added by this widget to allow safe container reuse in React/Next.js
    this.container.classList.remove(
      `assistant-widget-container-${this.config.mode || 'floating'}`,
      'assistant-widget-container-floating',
      'assistant-widget-container-inline',
      'assistant-widget-container-bottom',
      'assistant-widget-container-top',
      'assistant-widget-container-left',
      'assistant-widget-container-right'
    );
  }

  /**
   * Update widget configuration dynamically
   */
  public updateConfig(config: Partial<ChatWidgetConfig>): void {
    // Update internal config
    this.config = { ...this.config, ...config };
    this.syncContainerClasses();

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

  private clearPresentationState(): void {
    for (const timer of this.revealTimers.values()) {
      clearTimeout(timer);
    }
    this.revealTimers.clear();
    this.displayedMessageContent.clear();
    this.targetMessageContent.clear();
    this.wasPresentationStreaming = false;
    this.lastRenderedMessageSignature = '';
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
