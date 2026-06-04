export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'audio' | 'control' | 'break' | 'error' | 'status';
export declare enum WSMessageType {
    INPUT_TEXT = "input.text",
    INPUT_AUDIO = "input.audio",
    INPUT_END = "input.end",
    STREAM_LLM = "stream.llm",
    STREAM_STT = "stream.stt",
    RESPONSE_START = "response.start",
    RESPONSE_AUDIO_START = "response.audio_start",
    RESPONSE_AUDIO_END = "response.audio_end",
    RESPONSE_END = "response.end",
    CONTROL_CONFIG = "control.config",
    ERROR = "error",
    STATUS = "status",
    AUDIO = "audio",
    SERVICE_MESSAGE = "service.message",
    DELTA = "delta",
    THOUGHT = "thought",
    DONE = "done",
    TOOL_CALL = "tool_call",
    TOOL_RES = "tool_res",
    TYPING = "typing"
}
export type WebSocketMessageType = 'input.text' | 'input.audio' | 'input.end' | 'stream.llm' | 'stream.stt' | 'response.start' | 'response.audio_start' | 'response.audio_end' | 'response.end' | 'control.config' | 'error' | 'status' | 'audio' | 'service.message' | 'delta' | 'thought' | 'done' | 'tool_call' | 'tool_res' | 'typing';
export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
    type?: MessageType;
    metadata?: Record<string, unknown>;
}
export type WidgetState = 'minimized' | 'input-only' | 'full';
export type ChatTransport = 'sse' | 'ws';
export interface ChatConfig {
    serverUrl?: string;
    identityUrl?: string;
    runtimeUrl?: string;
    transport?: ChatTransport;
    siteToken: string;
    sessionId?: string;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    autoConnect?: boolean;
    debug?: boolean;
    initialLanguage?: string;
    welcomeMessage?: string;
    suggestions?: string[];
}
export interface WebSocketMessage {
    id?: string;
    type: WebSocketMessageType;
    session_id?: string;
    content?: string;
    tenant_id?: string;
    tenant_agent_id?: string;
    run_id?: string;
    metadata?: Record<string, unknown>;
    payload?: {
        text?: string;
        content?: string;
        delta?: string;
        audio?: string;
        data?: string;
        message?: string;
        status?: string;
        action?: string;
        target?: string;
        details?: unknown;
        is_final?: boolean;
        messageType?: string;
        localized?: Record<string, string>;
        interactionId?: string;
        context?: {
            interaction_id?: string;
            [key: string]: unknown;
        };
        provider?: {
            chat?: {
                provider: string;
                model: string;
            };
            stt?: {
                provider: string;
            };
            tts?: {
                provider: string;
            };
        };
        [key: string]: unknown;
    };
    timestamp?: number;
}
export interface ChatState {
    messages: Message[];
    isConnected: boolean;
    isConnecting: boolean;
    isTyping: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    ttsEnabled: boolean;
    error: string | null;
}
export type ChatEventType = 'connected' | 'disconnected' | 'connecting' | 'message' | 'error' | 'typing-start' | 'typing-end' | 'recording-start' | 'recording-stop' | 'state-change';
export interface ChatEvent {
    type: ChatEventType;
    data?: unknown;
}
export type ChatEventHandler = (event: ChatEvent) => void;
export interface ChatWidgetOptions {
    config: ChatConfig;
    onEvent?: ChatEventHandler;
}
//# sourceMappingURL=index.d.ts.map