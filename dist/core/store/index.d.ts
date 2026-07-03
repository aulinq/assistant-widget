import type { ChatState, Message } from '../types';
type Listener = (state: ChatState) => void;
/**
 * Vanilla JavaScript store for chat state
 * Framework-agnostic implementation using subscriber pattern
 */
export declare class ChatStore {
    private state;
    private listeners;
    constructor(initialState?: Partial<ChatState>);
    /**
     * Get current state
     */
    getState(): ChatState;
    /**
     * Subscribe to state changes
     * Returns unsubscribe function
     */
    subscribe(listener: Listener): () => void;
    /**
     * Notify all listeners of state change
     */
    private notify;
    /**
     * Update state and notify listeners
     */
    private setState;
    addMessage(message: Message): void;
    updateMessage(id: string, content: string): void;
    updateMessageDetails(id: string, updates: Partial<Message>): void;
    clearMessages(): void;
    removeStatusMessages(): void;
    setConnected(connected: boolean): void;
    setConnecting(connecting: boolean): void;
    setTyping(typing: boolean): void;
    setError(error: string | null): void;
    setRecording(recording: boolean): void;
    setSpeaking(speaking: boolean): void;
    setTtsEnabled(enabled: boolean): void;
    setSuggestions(suggestions: string[] | undefined): void;
    reset(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map