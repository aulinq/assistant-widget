import { ChatService } from '../services/ChatService';
import type { ChatConfig, ChatState, WidgetState } from '../types';
export interface ChatWidgetConfig extends ChatConfig {
    title?: string;
    placeholder?: string;
    container?: HTMLElement;
    onClose?: () => void;
    lang?: 'ru' | 'en';
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
/**
 * Headless Chat Widget - Vanilla JavaScript implementation
 * Manages all widget logic, DOM manipulation, and event handling
 */
export declare class ChatWidget {
    protected service: ChatService;
    protected config: ChatWidgetConfig;
    protected container: HTMLElement;
    protected widgetState: WidgetState;
    protected inputValue: string;
    protected unsubscribe?: () => void;
    protected root?: HTMLElement;
    protected theme: ChatWidgetTheme;
    private displayedMessageContent;
    private targetMessageContent;
    private revealTimers;
    private scrollFrame;
    private wasPresentationStreaming;
    private lastRenderedMessageSignature;
    private readonly messageRevealDelayMs;
    private readonly bottomFollowThresholdPx;
    constructor(config: ChatWidgetConfig, theme: ChatWidgetTheme);
    /**
     * Create default container element
     */
    private createDefaultContainer;
    private syncContainerClasses;
    /**
     * Render the widget
     */
    protected render(): void;
    /**
     * Inject theme CSS
     */
    private injectCSS;
    /**
     * Attach event listeners to rendered DOM
     */
    protected attachEventListeners(): void;
    /**
     * Auto-resize textarea based on content
     */
    protected autoResizeTextarea(textarea: HTMLTextAreaElement): void;
    private getMessagesScrollSnapshot;
    private syncMessagesScroll;
    private restoreMessagesScroll;
    private getMessageSignature;
    private hasPresentationStreaming;
    private seedPresentationState;
    private buildPresentationState;
    private shouldRevealMessage;
    private scheduleMessageReveal;
    private getRevealCount;
    private prunePresentationState;
    /**
     * Handle header click
     */
    protected handleHeaderClick(): void;
    /**
     * Handle primary action (send)
     */
    protected handlePrimaryAction(): Promise<void>;
    /**
     * Handle send message
     */
    protected handleSendMessage(): Promise<void>;
    protected handleCopyMessage(content: string, btn?: HTMLElement): void;
    protected handleRateMessage(runId: string, rating: string): Promise<void>;
    /**
     * Handle close (cross button)
     * Clears messages and effectively transitions to input-only
     */
    protected handleClose(): void;
    /**
     * Set widget state
     */
    setWidgetState(state: WidgetState): void;
    /**
     * Get widget state
     */
    getWidgetState(): WidgetState;
    /**
     * Get chat service instance
     */
    getService(): ChatService;
    /**
     * Destroy widget and cleanup
     */
    destroy(): void;
    /**
     * Update widget configuration dynamically
     */
    updateConfig(config: Partial<ChatWidgetConfig>): void;
    private clearPresentationState;
    /**
     * Render markdown content
     */
    protected renderMarkdown(content: string): string;
}
//# sourceMappingURL=ChatWidget.d.ts.map