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

type StatusLocale = 'en' | 'es' | 'ru' | 'pt' | 'fr' | 'de' | 'it';

type StatusKey =
  | 'thinking'
  | 'thinking_deeper'
  | 'rag_search'
  | 'rag_found'
  | 'rag_empty'
  | 'tool_start'
  | 'tool_end';

const STATUS_COPY: Record<StatusLocale, Record<StatusKey, string>> = {
  en: {
    thinking: 'Thinking...',
    thinking_deeper: 'Thinking it through...',
    rag_search: 'Checking the knowledge base...',
    rag_found: 'Reviewing the relevant details...',
    rag_empty: 'Checking what I know...',
    tool_start: 'Working with tools...',
    tool_end: 'Finishing up...',
  },
  es: {
    thinking: 'Pensando...',
    thinking_deeper: 'Dandole una vuelta mas...',
    rag_search: 'Consultando la base de conocimiento...',
    rag_found: 'Revisando los detalles relevantes...',
    rag_empty: 'Revisando lo que se...',
    tool_start: 'Usando herramientas...',
    tool_end: 'Terminando...',
  },
  ru: {
    thinking: 'Думаю...',
    thinking_deeper: 'Обдумываю глубже...',
    rag_search: 'Проверяю базу знаний...',
    rag_found: 'Изучаю найденные детали...',
    rag_empty: 'Сверяюсь с тем, что уже знаю...',
    tool_start: 'Работаю с инструментами...',
    tool_end: 'Завершаю...',
  },
  pt: {
    thinking: 'Pensando...',
    thinking_deeper: 'Pensando melhor...',
    rag_search: 'Consultando a base de conhecimento...',
    rag_found: 'Revisando os detalhes relevantes...',
    rag_empty: 'Verificando o que eu sei...',
    tool_start: 'Usando ferramentas...',
    tool_end: 'Finalizando...',
  },
  fr: {
    thinking: 'Je reflechis...',
    thinking_deeper: 'Je creuse un peu plus...',
    rag_search: 'Je consulte la base de connaissances...',
    rag_found: 'Je relis les details utiles...',
    rag_empty: 'Je verifie ce que je sais...',
    tool_start: 'J utilise les outils...',
    tool_end: 'Je termine...',
  },
  de: {
    thinking: 'Ich denke nach...',
    thinking_deeper: 'Ich denke genauer darueber nach...',
    rag_search: 'Ich pruefe die Wissensbasis...',
    rag_found: 'Ich lese die relevanten Details...',
    rag_empty: 'Ich pruefe, was ich weiss...',
    tool_start: 'Ich nutze Werkzeuge...',
    tool_end: 'Ich schliesse ab...',
  },
  it: {
    thinking: 'Sto pensando...',
    thinking_deeper: 'Ci sto ragionando meglio...',
    rag_search: 'Controllo la base di conoscenza...',
    rag_found: 'Rivedo i dettagli rilevanti...',
    rag_empty: 'Controllo quello che so...',
    tool_start: 'Uso gli strumenti...',
    tool_end: 'Sto finendo...',
  },
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
  private slowThinkingTimeout: ReturnType<typeof setTimeout> | null = null;
  private statusClearTimeout: ReturnType<typeof setTimeout> | null = null;
  private statusTransitionTimeout: ReturnType<typeof setTimeout> | null = null;
  private storageKey: string;
  private readonly minActivityStatusVisibleMs = 1400;
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
    this.storageKey = this.config.storageKey || config.siteToken;

    console.log('[ChatService] Initializing with siteToken:', config.siteToken, 'config:', config);

    let savedSessionId: string | null = null;
    let savedMessages: Message[] = [];
    let savedHandshakeSession: HandshakeSession | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const lastActivityStr = localStorage.getItem(this.storagePath('chat_last_activity'));
        const inactivityLimit = 15 * 60 * 1000; // 15 minutes inactivity limit
        const isStale = lastActivityStr && (Date.now() - parseInt(lastActivityStr, 10)) > inactivityLimit;

        if (isStale) {
          console.log('[ChatService] Chat session expired due to inactivity. Wiping localStorage.');
          localStorage.removeItem(this.storagePath('chat_history'));
          localStorage.removeItem(this.storagePath('chat_session'));
          localStorage.removeItem(this.storagePath('chat_session_data'));
          localStorage.removeItem(this.storagePath('chat_last_activity'));
        } else {
          savedSessionId = localStorage.getItem(this.storagePath('chat_session'));
          const historyJson = localStorage.getItem(this.storagePath('chat_history'));
          if (historyJson) {
            savedMessages = JSON.parse(historyJson);
          }

          const sessionDataJson = localStorage.getItem(this.storagePath('chat_session_data'));
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
              localStorage.removeItem(this.storagePath('chat_session_data'));
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
        localStorage.setItem(this.storagePath('chat_session'), this.sessionId);
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
          console.log('[ChatService] Saving messages to localStorage under key:', this.storagePath('chat_history'), 'messages:', persistable);
          localStorage.setItem(this.storagePath('chat_history'), JSON.stringify(persistable));
          
          // Save last activity timestamp to track inactivity
          localStorage.setItem(this.storagePath('chat_last_activity'), Date.now().toString());
        } catch (e) {
          console.error('Failed to persist chat history to localStorage:', e);
        }
      }
    });
  }

  private storagePath(kind: 'chat_history' | 'chat_session' | 'chat_session_data' | 'chat_last_activity'): string {
    return `aulinq:${kind}:${this.storageKey}`;
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
          localStorage.setItem(this.storagePath('chat_session'), this.sessionId);
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
    this.clearSlowThinkingTimer();
    this.clearStatusClearTimer();
    this.clearStatusTransitionTimer();

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
    this.store.setSuggestions([]);
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
    this.clearStatusTransitionTimer();
    this.clearStatusClearTimer();
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
        localStorage.removeItem(this.storagePath('chat_history'));
        localStorage.removeItem(this.storagePath('chat_session_data'));
        localStorage.removeItem(this.storagePath('chat_last_activity'));
        this.sessionId = generateId();
        this.session = null;
        localStorage.setItem(this.storagePath('chat_session'), this.sessionId);
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
      case WSMessageType.TOOL_START:
      case WSMessageType.TOOL_END:
        this.handleToolMessage(data);
        break;
      case WSMessageType.UI_SUGGESTIONS:
        this.handleSuggestionsMessage(data);
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
      this.clearSlowThinkingTimer();
      this.deferActivityStatusClear();
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
        message: this.statusText('thinking'),
        target: 'bot',
      },
      timestamp: Date.now(),
    });
    this.armSlowThinkingTimer();
  }

  private handleResponseEnd(): void {
    this.clearSlowThinkingTimer();
    if (this.store.getState().isTyping) {
      this.store.setTyping(false);
      this.emit({ type: 'typing-end' });
    }
    this.currentMessageId = null;
    this.deferActivityStatusClear();
  }

  private handleErrorMessage(data: WebSocketMessage): void {
    const errorMsg = data.payload?.message || data.content || 'An error occurred';

    this.clearSlowThinkingTimer();
    this.clearStatusClearTimer();
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
    const nextStatus = data.payload?.status || data.type;

    if (lastMsg && lastMsg.type === 'status' && lastMsg.metadata?.target === target) {
      const applyUpdate = () => {
        this.store.updateMessageDetails(lastMsg.id, {
          content: message,
          timestamp: Date.now(),
          metadata: {
            ...lastMsg.metadata,
            status: nextStatus,
            target,
            details: data.payload?.details || data.metadata,
          },
        });
        if (this.isActivityStatus(nextStatus) && !this.store.getState().isTyping) {
          this.deferActivityStatusClear();
        }
      };
      const remainingMs = this.activityStatusTransitionDelay(lastMsg, nextStatus, Date.now());

      this.clearStatusTransitionTimer();
      if (remainingMs > 0 && lastMsg.metadata?.status !== nextStatus) {
        this.clearStatusClearTimer();
        this.statusTransitionTimeout = setTimeout(() => {
          this.statusTransitionTimeout = null;
          applyUpdate();
        }, remainingMs);
      } else {
        applyUpdate();
      }
      return;
    }

    this.store.addMessage({
      id: data.id || generateId(),
      role,
      content: message,
      timestamp: Date.now(),
      type: 'status',
      metadata: {
        status: nextStatus,
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
    const statusKey = this.statusKeyFromEvent(data);
    const text = statusKey ? this.statusText(statusKey) : (data.content || data.payload?.text || '');
    if (!text) return;

    this.handleStatusMessage({
      type: WSMessageType.STATUS,
      payload: {
        status: statusKey || 'thought',
        message: text,
        target: 'bot',
        details: data.metadata,
      },
      timestamp: Date.now(),
    });
  }

  private handleToolMessage(data: WebSocketMessage): void {
    const statusKey = data.type === WSMessageType.TOOL_RES || data.type === WSMessageType.TOOL_END ? 'tool_end' : 'tool_start';
    const text = this.statusText(statusKey);

    this.handleStatusMessage({
      type: WSMessageType.STATUS,
      payload: {
        status: statusKey,
        message: text,
        target: 'bot',
        details: data.metadata,
      },
      timestamp: Date.now(),
    });
  }

  private armSlowThinkingTimer(): void {
    this.clearSlowThinkingTimer();
    this.slowThinkingTimeout = setTimeout(() => {
      this.slowThinkingTimeout = null;
      if (this.currentMessageId) return;

      const messages = this.store.getState().messages;
      const lastStatus = [...messages].reverse().find((message) => message.type === 'status' && message.metadata?.target === 'bot');
      if (!lastStatus || lastStatus.metadata?.status !== 'thinking') return;

      this.handleStatusMessage({
        type: WSMessageType.STATUS,
        payload: {
          status: 'thinking_deeper',
          message: this.statusText('thinking_deeper'),
          target: 'bot',
        },
        timestamp: Date.now(),
      });
    }, 6500);
  }

  private clearSlowThinkingTimer(): void {
    if (this.slowThinkingTimeout) {
      clearTimeout(this.slowThinkingTimeout);
      this.slowThinkingTimeout = null;
    }
  }

  private activityStatusTransitionDelay(current: Message, nextStatus: unknown, now: number): number {
    const currentStatus = current.metadata?.status;
    const isFastRagResult = currentStatus === 'rag_search' && (nextStatus === 'rag_found' || nextStatus === 'rag_empty');
    if (!isFastRagResult) {
      return 0;
    }

    const visibleForMs = now - current.timestamp;
    return Math.max(0, this.minActivityStatusVisibleMs - visibleForMs);
  }

  private deferActivityStatusClear(): void {
    if (this.statusTransitionTimeout) return;

    const status = this.latestBotStatusMessage();
    if (!status || !this.isActivityStatus(status.metadata?.status)) {
      this.store.removeStatusMessages();
      return;
    }

    const visibleForMs = Date.now() - status.timestamp;
    const remainingMs = this.minActivityStatusVisibleMs - visibleForMs;
    if (remainingMs <= 0) {
      this.store.removeStatusMessages();
      return;
    }

    this.clearStatusClearTimer();
    this.statusClearTimeout = setTimeout(() => {
      this.statusClearTimeout = null;
      this.store.removeStatusMessages();
    }, remainingMs);
  }

  private latestBotStatusMessage(): Message | undefined {
    return [...this.store.getState().messages]
      .reverse()
      .find((message) => message.type === 'status' && message.metadata?.target === 'bot');
  }

  private isActivityStatus(status: unknown): boolean {
    return status === 'rag_search'
      || status === 'rag_found'
      || status === 'rag_empty'
      || status === 'tool_start'
      || status === 'tool_end';
  }

  private clearStatusClearTimer(): void {
    if (this.statusClearTimeout) {
      clearTimeout(this.statusClearTimeout);
      this.statusClearTimeout = null;
    }
  }

  private clearStatusTransitionTimer(): void {
    if (this.statusTransitionTimeout) {
      clearTimeout(this.statusTransitionTimeout);
      this.statusTransitionTimeout = null;
    }
  }

  private statusKeyFromEvent(data: WebSocketMessage): StatusKey | null {
    const metadata = data.metadata || {};
    const raw = data.payload?.status || metadata.status || metadata.phase || data.content || '';
    const value = String(raw).toLowerCase();

    if (value.includes('rag_empty') || value.includes('rag.no_sources')) return 'rag_empty';
    if (value.includes('rag_found') || value.includes('rag.found') || value.includes('relevant context')) return 'rag_found';
    if (value.includes('rag_search') || value.includes('rag.search') || value.includes('searching knowledge')) return 'rag_search';
    return null;
  }

  private statusText(key: StatusKey): string {
    const locale = this.statusLocale();
    return STATUS_COPY[locale]?.[key] || STATUS_COPY.en[key];
  }

  private statusLocale(): StatusLocale {
    const raw = (this.config.initialLanguage || '').toLowerCase();
    const base = raw.split(/[-_]/)[0] as StatusLocale;
    return base in STATUS_COPY ? base : 'en';
  }

  private handleSuggestionsMessage(data: WebSocketMessage): void {
    const items = Array.isArray(data.ui?.items) ? data.ui.items : [];
    const suggestions = items
      .map((item) => (typeof item.send === 'string' && item.send.trim()) || (typeof item.label === 'string' && item.label.trim()) || '')
      .filter((item): item is string => item.length > 0)
      .slice(0, 4);
    this.store.setSuggestions(suggestions);
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
