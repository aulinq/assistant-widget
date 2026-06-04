import { ChatStore } from '../store';
import { generateId } from '../utils';
import type {
  ChatConfig,
  WebSocketMessage,
  Message,
  ChatEventHandler,
  ChatEvent,
  ChatTransport,
} from '../types';
import { WSMessageType } from '../types';

type HandshakeSession = {
  token: string;
  sessionId: string;
  expiresAt?: string;
};

type HandshakeResponse = {
  token: string;
  sessionId?: string;
  session_id?: string;
  expires_at?: string;
};

type ChatStreamRequest = {
  token: string;
  user_text: string;
  session_key: string;
};

export class ChatService {
  private ws: WebSocket | null = null;
  private config: ChatConfig;
  private sessionId: string;
  private eventHandler?: ChatEventHandler;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentMessageId: string | null = null;
  private session: HandshakeSession | null = null;
  private connectionPromise: Promise<void> | null = null;
  private activeStreamAbort: AbortController | null = null;
  public store: ChatStore;
  public lastRunId: string = '';

  constructor(config: ChatConfig, eventHandler?: ChatEventHandler) {
    this.config = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      debug: true, // Force debug logs
      transport: 'sse',
      ...config,
    };

    console.log('[ChatService] Initializing with siteToken:', config.siteToken, 'config:', config);

    let savedSessionId: string | null = null;
    let savedMessages: Message[] = [];
    let savedHandshakeSession: HandshakeSession | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const lastActivityStr = localStorage.getItem(`aulinq:chat_last_activity:${config.siteToken}`);
        const inactivityLimit = 15 * 60 * 1000; // 15 minutes inactivity limit
        const isStale = lastActivityStr && (Date.now() - parseInt(lastActivityStr, 10)) > inactivityLimit;

        if (isStale) {
          console.log('[ChatService] Chat session expired due to inactivity. Wiping localStorage.');
          localStorage.removeItem(`aulinq:chat_history:${config.siteToken}`);
          localStorage.removeItem(`aulinq:chat_session:${config.siteToken}`);
          localStorage.removeItem(`aulinq:chat_session_data:${config.siteToken}`);
          localStorage.removeItem(`aulinq:chat_last_activity:${config.siteToken}`);
        } else {
          savedSessionId = localStorage.getItem(`aulinq:chat_session:${config.siteToken}`);
          const historyJson = localStorage.getItem(`aulinq:chat_history:${config.siteToken}`);
          if (historyJson) {
            savedMessages = JSON.parse(historyJson);
          }

          const sessionDataJson = localStorage.getItem(`aulinq:chat_session_data:${config.siteToken}`);
          if (sessionDataJson) {
            const parsed = JSON.parse(sessionDataJson) as HandshakeSession;
            // check if expired. parsed.expiresAt can be ISO string or timestamp number
            const expiresAtTime = typeof parsed.expiresAt === 'number'
              ? parsed.expiresAt
              : (parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : 0);

            // Give a 5-minute grace period to avoid token expiring during an active chat session
            if (expiresAtTime > Date.now() + 5 * 60 * 1000) {
              savedHandshakeSession = parsed;
              savedSessionId = parsed.sessionId;
              console.log('[ChatService] Found valid cached chat session token in localStorage. Will bypass handshake.');
            } else {
              console.log('[ChatService] Cached chat session token is expired or close to expiry. Will perform handshake.');
              localStorage.removeItem(`aulinq:chat_session_data:${config.siteToken}`);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load chat session/history from localStorage:', e);
      }
    }

    this.sessionId = config.sessionId || savedSessionId || generateId();
    if (savedHandshakeSession) {
      this.session = savedHandshakeSession;
    }

    if (typeof window !== 'undefined' && window.localStorage && this.sessionId) {
      try {
        localStorage.setItem(`aulinq:chat_session:${config.siteToken}`, this.sessionId);
      } catch (e) {
        console.error('Failed to save chat session ID to localStorage:', e);
      }
    }

    this.eventHandler = eventHandler;
    let initialMessages = savedMessages;
    if (initialMessages.length === 0 && config.welcomeMessage) {
      initialMessages = [
        {
          id: 'welcome',
          role: 'assistant',
          content: config.welcomeMessage,
          timestamp: Date.now(),
          type: 'text',
        },
      ];
    }
    this.store = new ChatStore({ messages: initialMessages });

    this.store.subscribe((state) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const persistable = state.messages.filter(m => m.type !== 'status');
          console.log('[ChatService] Saving messages to localStorage under key:', `aulinq:chat_history:${config.siteToken}`, 'messages:', persistable);
          localStorage.setItem(`aulinq:chat_history:${config.siteToken}`, JSON.stringify(persistable));
          
          // Save last activity timestamp to track inactivity
          localStorage.setItem(`aulinq:chat_last_activity:${config.siteToken}`, Date.now().toString());
        } catch (e) {
          console.error('Failed to persist chat history to localStorage:', e);
        }
      }
    });
  }

  /**
   * Authenticate with identity-service and mark the text runtime ready.
   */
  async connect(): Promise<void> {
    if (this.store.getState().isConnected && this.session?.token) {
      this.log('Already connected');
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      this.store.setConnecting(true);
      this.emit({ type: 'connecting' });

      try {
        if (!this.session?.token) {
          this.session = await this.authenticate();
        }
        this.sessionId = this.session.sessionId;
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(`aulinq:chat_session:${this.config.siteToken}`, this.sessionId);
        }
        this.store.setConnected(true);
        this.emit({ type: 'connected' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Connection failed';
        this.handleConnectionError(message);
        throw error;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.activeStreamAbort) {
      this.activeStreamAbort.abort();
      this.activeStreamAbort = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.store.setConnected(false);
    this.emit({ type: 'disconnected' });
  }

  async sendMessage(content: string): Promise<void> {
    const text = content.trim();
    if (!text) return;

    if (!this.store.getState().isConnected || !this.session?.token) {
      await this.connect();
    }

    if (!this.session?.token) {
      throw new Error('Chat session is not connected');
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'text',
    };

    this.store.setError(null);
    this.store.removeStatusMessages();
    this.store.addMessage(userMessage);
    this.handleResponseStart();

    const request: ChatStreamRequest = {
      token: this.session.token,
      user_text: text,
      session_key: this.session.sessionId,
    };

    if ((this.config.transport || 'sse') === 'ws') {
      await this.sendViaWebSocket(request);
    } else {
      await this.sendViaSSE(request);
    }
  }

  clearMessages(): void {
    this.store.clearMessages();
    if (this.config.welcomeMessage) {
      this.store.addMessage({
        id: 'welcome',
        role: 'assistant',
        content: this.config.welcomeMessage,
        timestamp: Date.now(),
        type: 'text',
      });
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`aulinq:chat_history:${this.config.siteToken}`);
        localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`);
        localStorage.removeItem(`aulinq:chat_last_activity:${this.config.siteToken}`);
        this.sessionId = generateId();
        this.session = null;
        localStorage.setItem(`aulinq:chat_session:${this.config.siteToken}`, this.sessionId);
      } catch (e) {
        console.error('Failed to clear chat session/history from localStorage:', e);
      }
    }
  }

  async sendControl(action: string): Promise<void> {
    this.log('Ignoring control message for text runtime:', action);
  }

  async sendFeedback(runId: string, rating: string, comment?: string): Promise<void> {
    const baseUrl = this.resolveRuntimeUrl('sse').replace(/\/v1\/chat\/stream\/?$/, '');
    const url = `${baseUrl}/v1/chat/feedback`;

    const token = this.session?.token;
    if (!token) {
      this.log('Cannot send feedback: no active session token');
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          run_id: runId,
          rating,
          comment: comment || '',
          session_key: this.sessionId,
        }),
      });

      if (!response.ok) {
        this.log('Feedback send failed:', response.status, await response.text());
      }
    } catch (error) {
      this.log('Feedback send error:', error);
    }
  }

  isConnected(): boolean {
    return this.store.getState().isConnected && !!this.session?.token;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async startVoice(): Promise<void> {
    throw new Error('Voice is not supported by assistant-widget. Use voice-widget for realtime voice.');
  }

  stopVoice(): void {
    this.log('Voice is not supported by assistant-widget.');
  }

  async toggleVoice(): Promise<void> {
    await this.startVoice();
  }

  isRecording(): boolean {
    return false;
  }

  setLanguage(lang: string): void {
    this.config.initialLanguage = lang;
  }

  isSpeaking(): boolean {
    return false;
  }

  getTtsEnabled(): boolean {
    return false;
  }

  getVolume(): number {
    return 0;
  }

  toggleTTS(): void {
    this.log('TTS is not supported by assistant-widget text runtime.');
  }

  private async authenticate(): Promise<HandshakeSession> {
    if (this.session?.token) {
      return this.session;
    }

    const siteToken = this.config.siteToken;

    // Check global pending handshakes to prevent concurrent requests in Strict Mode
    if (typeof window !== 'undefined') {
      const globalPending = (window as any).__aulinq_pending_handshakes || {};
      (window as any).__aulinq_pending_handshakes = globalPending;

      if (globalPending[siteToken]) {
        this.log('Reusing pending handshake request for siteToken:', siteToken);
        return globalPending[siteToken];
      }
    }

    const handshakePromise = (async () => {
      const baseUrl = this.resolveIdentityBaseUrl();
      const url = new URL(`${baseUrl}/v1/chat/handshake`);
      url.searchParams.set('siteToken', siteToken);

      this.log('Authenticating with handshake endpoint:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteToken: siteToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Authentication failed:', errorText);
        throw new Error(`Authentication failed: ${this.formatHTTPError(response, errorText)}`);
      }

      const data = await response.json() as HandshakeResponse;
      if (!data.token) {
        throw new Error('Authentication failed: missing token');
      }

      const session = {
        token: data.token,
        sessionId: this.config.sessionId || data.sessionId || data.session_id || this.sessionId || generateId(),
        expiresAt: data.expires_at,
      };

      this.log('Authentication successful');

      // Cache the successful session data in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(`aulinq:chat_session_data:${siteToken}`, JSON.stringify(session));
        } catch (e) {
          console.error('Failed to save chat session data to localStorage:', e);
        }
      }

      return session;
    })();

    if (typeof window !== 'undefined') {
      const globalPending = (window as any).__aulinq_pending_handshakes;
      globalPending[siteToken] = handshakePromise;

      // Clean up when the promise resolves or rejects
      handshakePromise.finally(() => {
        delete globalPending[siteToken];
      });
    }

    return handshakePromise;
  }

  private async sendViaSSE(request: ChatStreamRequest): Promise<void> {
    const url = this.resolveRuntimeUrl('sse');
    const controller = new AbortController();
    this.activeStreamAbort = controller;

    this.store.setTyping(true);
    this.emit({ type: 'typing-start' });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isAuthError = response.status === 401 || 
                            errorText.includes('session expired') || 
                            errorText.includes('invalid token');
        if (isAuthError) {
          this.log('Session expired or invalid. Wiping cached session and re-authenticating.');
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`);
            } catch (e) {
              console.error(e);
            }
          }
          this.session = null;
          await this.connect();
          const restored = this.session as HandshakeSession | null;
          if (restored?.token) {
            request.token = restored.token;
            return this.sendViaSSE(request);
          }
        }
        throw new Error(`Runtime stream failed: ${this.formatHTTPError(response, errorText)}`);
      }

      if (!response.body) {
        throw new Error('Runtime stream failed: empty response body');
      }

      await this.readSSEStream(response.body);
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return;
      const message = error instanceof Error ? error.message : 'Runtime stream failed';
      this.handleErrorMessage({
        type: WSMessageType.ERROR,
        content: message,
        timestamp: Date.now(),
      });
      throw error;
    } finally {
      if (this.activeStreamAbort === controller) {
        this.activeStreamAbort = null;
      }
      this.handleResponseEnd();
    }
  }

  private async readSSEStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';

      for (const eventText of events) {
        this.handleSSEEvent(eventText);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      this.handleSSEEvent(buffer);
    }
  }

  private handleSSEEvent(eventText: string): void {
    const dataLines = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.replace(/^data:\s?/, ''));

    if (dataLines.length === 0) return;

    const raw = dataLines.join('\n').trim();
    console.log('[ChatService] Raw SSE event received:', raw);
    if (!raw || raw === '[DONE]') {
      this.handleResponseEnd();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as WebSocketMessage;
      console.log('[ChatService] Parsed SSE event type:', parsed.type, 'run_id:', parsed.run_id);
      this.handleRuntimeEvent(parsed);
    } catch (error) {
      this.log('Failed to parse SSE event:', error, raw);
    }
  }

  private async sendViaWebSocket(request: ChatStreamRequest): Promise<void> {
    const url = this.resolveRuntimeUrl('ws');

    this.store.setTyping(true);
    this.emit({ type: 'typing-start' });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(url);
      this.ws = ws;

      const settle = (error?: Error) => {
        if (settled) return;
        settled = true;
        this.ws = null;
        this.handleResponseEnd();
        if (error) reject(error);
        else resolve();
      };

      ws.onopen = () => {
        this.log('Runtime WebSocket opened');
        ws.send(JSON.stringify(request));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          const isAuthError = data.type === WSMessageType.ERROR && data.content && (
            data.content.includes('session expired') || 
            data.content.includes('invalid token')
          );
          if (isAuthError) {
            this.log('Session expired or invalid (WS). Wiping cached session and re-authenticating.');
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`);
              } catch (e) {
                console.error(e);
              }
            }
            this.session = null;
            ws.close(1008, 'Session expired');
            settle();
            await this.connect();
            const restoredWs = this.session as HandshakeSession | null;
            if (restoredWs?.token) {
              request.token = restoredWs.token;
              await this.sendViaWebSocket(request);
            }
            return;
          }
          this.handleRuntimeEvent(data);
          if (data.type === WSMessageType.DONE || data.type === WSMessageType.ERROR) {
            ws.close(1000, 'Message complete');
            settle();
          }
        } catch (error) {
          settle(error instanceof Error ? error : new Error('Invalid runtime WebSocket message'));
        }
      };

      ws.onerror = () => {
        settle(new Error('Runtime WebSocket error'));
      };

      ws.onclose = (event) => {
        if (event.code === 1000 || settled) {
          settle();
        } else {
          settle(new Error(`Runtime WebSocket closed with code ${event.code}`));
        }
      };
    });
  }

  private handleRuntimeEvent(data: WebSocketMessage): void {
    this.log('Received runtime event:', data);

    if (data.run_id) {
      this.lastRunId = data.run_id;
    }

    switch (data.type) {
      case WSMessageType.STREAM_STT:
        this.handleSttMessage(data);
        break;
      case WSMessageType.STREAM_LLM:
      case WSMessageType.DELTA:
        this.handleLlmMessage(data);
        break;
      case WSMessageType.THOUGHT:
        this.handleThoughtMessage(data);
        break;
      case WSMessageType.TYPING:
      case WSMessageType.STATUS:
        this.handleStatusMessage(data);
        break;
      case WSMessageType.TOOL_CALL:
      case WSMessageType.TOOL_RES:
        this.handleToolMessage(data);
        break;
      case WSMessageType.DONE:
      case WSMessageType.RESPONSE_END:
        if (!this.currentMessageId && data.content) {
          this.handleLlmMessage({ ...data, type: WSMessageType.STREAM_LLM });
        }
        // Store run_id on the last assistant message for feedback correlation
        if (data.run_id) {
          const messages = this.store.getState().messages;
          for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m.role === 'assistant' && m.type === 'text') {
              this.store.updateMessageDetails(m.id, {
                metadata: { ...m.metadata, run_id: data.run_id },
              });
              break;
            }
          }
        }
        this.handleResponseEnd();
        break;
      case WSMessageType.ERROR:
        this.handleErrorMessage(data);
        break;
      case WSMessageType.SERVICE_MESSAGE:
        this.handleServiceMessage(data);
        break;
      default:
        this.log('Unknown runtime event type:', data.type);
    }
  }

  private handleSttMessage(data: WebSocketMessage): void {
    const text = data.payload?.text || '';
    const isFinal = Boolean(data.payload?.is_final);

    if (!text.trim()) return;

    const messages = this.store.getState().messages;
    const lastMsg = messages[messages.length - 1];

    if (isFinal && lastMsg && lastMsg.role === 'user' && lastMsg.type === 'text' && !lastMsg.metadata?.finalized) {
      this.store.updateMessageDetails(lastMsg.id, {
        content: text,
        metadata: { ...lastMsg.metadata, finalized: true },
      });
      return;
    }

    if (lastMsg && lastMsg.role === 'user' && lastMsg.type === 'text' && !lastMsg.metadata?.finalized) {
      this.store.updateMessage(lastMsg.id, text);
      return;
    }

    this.store.addMessage({
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'text',
      metadata: { finalized: isFinal },
    });
  }

  private handleLlmMessage(data: WebSocketMessage): void {
    const delta = data.payload?.delta || (data.type === WSMessageType.DELTA ? data.content : '') || '';
    const content = data.payload?.content || (data.type === WSMessageType.DELTA ? '' : data.content) || '';
    const chunk = delta || content;
    const runId = data.run_id;

    if (!chunk && !this.currentMessageId) return;

    if (!this.currentMessageId) {
      this.store.removeStatusMessages();
      const messageId = generateId();
      this.currentMessageId = messageId;
      this.store.addMessage({
        id: messageId,
        role: 'assistant',
        content: chunk,
        timestamp: Date.now(),
        type: 'text',
        metadata: runId ? { run_id: runId } : undefined,
      });
      this.store.setTyping(true);
      this.emit({ type: 'typing-start' });
      return;
    }

    const current = this.store.getState().messages.find((message) => message.id === this.currentMessageId);
    if (current) {
      this.store.updateMessage(this.currentMessageId, current.content + chunk);
      // Update run_id on the message if not already set
      if (runId && !current.metadata?.run_id) {
        this.store.updateMessageDetails(this.currentMessageId, {
          metadata: { ...current.metadata, run_id: runId },
        });
      }
    }
  }

  private handleResponseStart(): void {
    this.currentMessageId = null;
    this.store.removeStatusMessages();
    this.handleStatusMessage({
      type: WSMessageType.STATUS,
      payload: {
        status: 'thinking',
        message: 'Thinking...',
        target: 'bot',
      },
      timestamp: Date.now(),
    });
  }

  private handleResponseEnd(): void {
    if (this.store.getState().isTyping) {
      this.store.setTyping(false);
      this.emit({ type: 'typing-end' });
    }
    this.currentMessageId = null;
    this.store.removeStatusMessages();
  }

  private handleErrorMessage(data: WebSocketMessage): void {
    const errorMsg = data.payload?.message || data.content || 'An error occurred';

    this.store.removeStatusMessages();
    this.handleResponseEnd();

    this.store.addMessage({
      id: generateId(),
      role: 'assistant',
      content: errorMsg,
      timestamp: Date.now(),
      type: 'error',
    });

    this.store.setError(errorMsg);
    this.emit({ type: 'error', data: errorMsg });
  }

  private handleStatusMessage(data: WebSocketMessage): void {
    const message = data.payload?.message || data.payload?.status || data.content;
    if (!message) return;

    const messages = this.store.getState().messages;
    const lastMsg = messages[messages.length - 1];
    const target = (data.payload?.target as string | undefined) || 'bot';
    const role = target === 'user' ? 'user' : 'assistant';

    if (lastMsg && lastMsg.type === 'status' && lastMsg.metadata?.target === target) {
      this.store.updateMessageDetails(lastMsg.id, {
        content: message,
        timestamp: Date.now(),
        metadata: {
          ...lastMsg.metadata,
          status: data.payload?.status || data.type,
          target,
          details: data.payload?.details || data.metadata,
        },
      });
      return;
    }

    this.store.addMessage({
      id: data.id || generateId(),
      role,
      content: message,
      timestamp: Date.now(),
      type: 'status',
      metadata: {
        status: data.payload?.status || data.type,
        target,
        details: data.payload?.details || data.metadata,
      },
    });
  }

  private handleServiceMessage(data: WebSocketMessage): void {
    const payload = data.payload;
    this.store.removeStatusMessages();

    this.store.addMessage({
      id: data.id || generateId(),
      role: payload?.target === 'user' ? 'user' : 'assistant',
      content: payload?.content || data.content || 'Service notification',
      timestamp: Date.now(),
      type: 'error',
      metadata: {
        messageType: payload?.messageType,
        localized: payload?.localized,
        target: payload?.target || 'bot',
      },
    });
  }

  private handleThoughtMessage(data: WebSocketMessage): void {
    const text = data.content || data.payload?.text || '';
    if (!text) return;

    this.handleStatusMessage({
      type: WSMessageType.STATUS,
      payload: {
        status: 'thought',
        message: text,
        target: 'bot',
      },
      timestamp: Date.now(),
    });
  }

  private handleToolMessage(data: WebSocketMessage): void {
    const text = data.content || data.payload?.text || '';
    const label = data.type === WSMessageType.TOOL_CALL ? 'Executing tool' : 'Tool result';

    this.handleStatusMessage({
      type: WSMessageType.STATUS,
      payload: {
        status: data.type,
        message: text ? `${label}: ${text}` : label,
        target: 'bot',
      },
      timestamp: Date.now(),
    });
  }

  private handleConnectionError(message: string): void {
    this.session = null;
    this.store.setConnected(false);
    this.store.setError(message);
    this.emit({ type: 'error', data: message });
  }

  private resolveIdentityBaseUrl(): string {
    const source = this.config.identityUrl || this.config.serverUrl || 'http://localhost:8100';
    return this.normalizeHttpBase(source).replace(/\/v1\/chat\/handshake\/?$/, '');
  }

  private resolveRuntimeUrl(transport: ChatTransport): string {
    const fallback = transport === 'ws'
      ? 'ws://localhost:8890/v1/chat/ws'
      : 'http://localhost:8890/v1/chat/stream';
    const source = this.config.runtimeUrl || this.config.serverUrl || fallback;
    const url = new URL(transport === 'ws' ? this.toWebSocketUrl(source) : this.toHttpUrl(source));

    if (transport === 'ws') {
      if (url.pathname.endsWith('/v1/chat/stream')) {
        url.pathname = url.pathname.replace(/\/v1\/chat\/stream\/?$/, '/v1/chat/ws');
      } else if (!url.pathname.endsWith('/v1/chat/ws')) {
        url.pathname = `${url.pathname.replace(/\/$/, '')}/v1/chat/ws`;
      }
    } else if (url.pathname.endsWith('/v1/chat/ws')) {
      url.pathname = url.pathname.replace(/\/v1\/chat\/ws\/?$/, '/v1/chat/stream');
    } else if (!url.pathname.endsWith('/v1/chat/stream')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/v1/chat/stream`;
    }

    return url.toString();
  }

  private normalizeHttpBase(url: string): string {
    const parsed = new URL(this.toHttpUrl(url));
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  }

  private toHttpUrl(url: string): string {
    return url.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
  }

  private toWebSocketUrl(url: string): string {
    return url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  }

  private formatHTTPError(response: Response, body: string): string {
    if (body) {
      try {
        const parsed = JSON.parse(body) as { error?: string; message?: string };
        if (parsed.error || parsed.message) {
          return parsed.error || parsed.message || response.statusText || String(response.status);
        }
      } catch {
        return body;
      }
    }
    return response.statusText || String(response.status);
  }

  private emit(event: ChatEvent): void {
    this.eventHandler?.(event);
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ChatService]', ...args);
    }
  }
}
