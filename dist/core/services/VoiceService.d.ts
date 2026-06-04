export interface VoiceServiceCallbacks {
    onRecordingStateChange?: (isRecording: boolean) => void;
    onSpeakingStateChange?: (isSpeaking: boolean) => void;
    onInteractionStart?: (id: string) => void;
}
export declare class VoiceService {
    private webSocket;
    private recordingResources;
    private audioPlayback;
    private isRecording;
    private isSpeaking;
    private ttsEnabled;
    private currentInteractionId;
    private callbacks;
    constructor(callbacks?: VoiceServiceCallbacks);
    setWebSocket(ws: WebSocket): void;
    startRecording(): Promise<void>;
    stopRecording(): void;
    playAudioChunk(audioData: ArrayBuffer | Blob, interactionId?: string): Promise<void>;
    stopPlayback(): void;
    cancel(): void;
    getIsRecording(): boolean;
    getIsSpeaking(): boolean;
    setTtsEnabled(enabled: boolean): void;
    getTtsEnabled(): boolean;
    getVolume(): number;
    private generateInteractionId;
}
//# sourceMappingURL=VoiceService.d.ts.map