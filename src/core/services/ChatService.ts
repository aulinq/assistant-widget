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

  constructor(config: ChatConfig, eventHandler?: ChatEventHandler) {
    this.config = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      debug: false,
      transport: 'sse',
      ...config,
    };
    this.sessionId = config.sessionId || generateId();
    this.eventHandler = eventHandler;
    this.store = new ChatStore();
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
        this.session = await this.authenticate();
        this.sessionId = this.session.sessionId;
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
  }

  async sendControl(action: string): Promise<void> {
    this.log('Ignoring control message for text runtime:', action);
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

    const baseUrl = this.resolveIdentityBaseUrl();
    const url = `${baseUrl}/v1/chat/handshake`;

    this.log('Authenticating with handshake endpoint:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteToken: this.config.siteToken }),
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
      sessionId: this.config.sessionId || data.sessionId || data.session_id || this.sessionId,
      expiresAt: data.expires_at,
    };

    this.log('Authentication successful');
    return session;
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
    if (!raw || raw === '[DONE]') {
      this.handleResponseEnd();
      return;
    }

    try {
      this.handleRuntimeEvent(JSON.parse(raw) as WebSocketMessage);
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

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
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

    if (!chunk && !this.currentMessageId) return;

    const messages = this.store.getState().messages;

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
      });
      this.store.setTyping(true);
      this.emit({ type: 'typing-start' });
      return;
    }

    const current = messages.find((message) => message.id === this.currentMessageId);
    if (current) {
      this.store.updateMessage(this.currentMessageId, current.content + chunk);
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
