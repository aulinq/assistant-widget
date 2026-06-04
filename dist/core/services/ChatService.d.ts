import { ChatStore } from '../store';
import type { ChatConfig, ChatEventHandler } from '../types';
export declare class ChatService {
    private ws;
    private config;
    private sessionId;
    private eventHandler?;
    private reconnectTimeout;
    private currentMessageId;
    private session;
    private connectionPromise;
    private activeStreamAbort;
    store: ChatStore;
    lastRunId: string;
    constructor(config: ChatConfig, eventHandler?: ChatEventHandler);
    /**
     * Authenticate with identity-service and mark the text runtime ready.
     */
    connect(): Promise<void>;
    disconnect(): void;
    sendMessage(content: string): Promise<void>;
    clearMessages(): void;
    sendControl(action: string): Promise<void>;
    sendFeedback(runId: string, rating: string, comment?: string): Promise<void>;
    isConnected(): boolean;
    getSessionId(): string;
    startVoice(): Promise<void>;
    stopVoice(): void;
    toggleVoice(): Promise<void>;
    isRecording(): boolean;
    setLanguage(lang: string): void;
    isSpeaking(): boolean;
    getTtsEnabled(): boolean;
    getVolume(): number;
    toggleTTS(): void;
    private authenticate;
    private sendViaSSE;
    private readSSEStream;
    private handleSSEEvent;
    private sendViaWebSocket;
    private handleRuntimeEvent;
    private handleSttMessage;
    private handleLlmMessage;
    private handleResponseStart;
    private handleResponseEnd;
    private handleErrorMessage;
    private handleStatusMessage;
    private handleServiceMessage;
    private handleThoughtMessage;
    private handleToolMessage;
    private handleConnectionError;
    private resolveIdentityBaseUrl;
    private resolveRuntimeUrl;
    private normalizeHttpBase;
    private toHttpUrl;
    private toWebSocketUrl;
    private formatHTTPError;
    private emit;
    private log;
}
//# sourceMappingURL=ChatService.d.ts.map