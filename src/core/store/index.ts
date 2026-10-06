import type { ChatState, Message } from '../types';

type Listener = (state: ChatState) => void;

/**
 * Vanilla JavaScript store for chat state
 * Framework-agnostic implementation using subscriber pattern
 */
export class ChatStore {
  private state: ChatState;
  private listeners: Set<Listener> = new Set();

  constructor(initialState?: Partial<ChatState>) {
    this.state = {
      messages: [],
      isConnected: false,
      isConnecting: false,
      isTyping: false,
      isRecording: false,
      isSpeaking: false,
      ttsEnabled: false,
      error: null,
      isInteractionBlocked: false,
      suggestions: undefined,
      ...initialState,
    };
  }

  /**
   * Get current state
   */
  getState(): ChatState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<ChatState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  // State update methods

  syncSite(messages: Message[], connected: boolean, typing: boolean, error: string | null): void {
    this.setState({messages, isConnected: connected, isConnecting: !connected && typing, isTyping: connected && typing, error, suggestions: undefined});
  }

  addMessage(message: Message): void {
    this.setState({
      messages: [...this.state.messages, message],
    });
  }

  updateMessage(id: string, content: string): void {
    this.setState({
      messages: this.state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    });
  }

  updateMessageDetails(id: string, updates: Partial<Message>): void {
    this.setState({
      messages: this.state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    });
  }

  clearMessages(): void {
    this.setState({ messages: [] });
  }

  restartConversation(welcome?: Message): void {
    this.setState({
      messages: welcome ? [welcome] : [],
      isTyping: false,
      error: null,
      isInteractionBlocked: false,
      suggestions: undefined,
    });
  }

  removeStatusMessages(): void {
    const hasStatus = this.state.messages.some(m => m.type === 'status');
    if (hasStatus) {
      this.setState({
        messages: this.state.messages.filter(m => m.type !== 'status')
      });
    }
  }

  setConnected(connected: boolean): void {
    this.setState({
      isConnected: connected,
      isConnecting: false,
      error: connected ? null : this.state.error,
      isInteractionBlocked: connected ? false : this.state.isInteractionBlocked,
    });
  }

  setConnecting(connecting: boolean): void {
    this.setState({
      isConnecting: connecting,
      ...(connecting ? { error: null, isInteractionBlocked: false } : {}),
    });
  }

  setTyping(typing: boolean): void {
    this.setState({ isTyping: typing });
  }

  setError(error: string | null, isInteractionBlocked = false): void {
    this.setState({
      error,
      isConnecting: false,
      isInteractionBlocked: Boolean(error) && isInteractionBlocked,
    });
  }

  setRecording(recording: boolean): void {
    this.setState({ isRecording: recording });
  }

  setSpeaking(speaking: boolean): void {
    this.setState({ isSpeaking: speaking });
  }

  setTtsEnabled(enabled: boolean): void {
    this.setState({ ttsEnabled: enabled });
  }

  setSuggestions(suggestions: string[] | undefined): void {
    this.setState({ suggestions });
  }

  reset(): void {
    this.setState({
      messages: [],
      isConnected: false,
      isConnecting: false,
      isTyping: false,
      isRecording: false,
      isSpeaking: false,
      ttsEnabled: false,
      error: null,
      isInteractionBlocked: false,
      suggestions: undefined,
    });
  }
}
