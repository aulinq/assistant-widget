/**
 * Audio processing utilities for voice chat
 */
export interface AudioCallback {
    onAudioData: (data: ArrayBuffer) => void;
    onSilence?: () => void;
    onSpeechStart?: () => void;
}
export interface RecordingResources {
    mediaRecorder: MediaRecorder;
    mediaStream: MediaStream;
    audioContext: AudioContext;
    analyser: AnalyserNode;
    workletNode?: AudioWorkletNode;
    processorNode?: ScriptProcessorNode;
}
/**
 * Start recording audio from microphone
 * Captures raw PCM audio for streaming STT
 */
export declare function startAudioRecording(callbacks: AudioCallback): Promise<RecordingResources>;
/**
 * Stop audio recording and cleanup resources
 */
export declare function stopAudioRecording(resources: Partial<RecordingResources>): void;
/**
 * Audio playback manager for TTS
 */
export declare class AudioPlaybackManager {
    private audioContext;
    private audioQueue;
    private isPlaying;
    private currentSource;
    private analyser;
    private playbackStartCallback?;
    private playbackEndCallback?;
    private currentInteractionId;
    initialize(): Promise<void>;
    onPlaybackStart(callback: () => void): void;
    onPlaybackEnd(callback: () => void): void;
    playAudioChunk(audioData: ArrayBuffer | Blob, interactionId?: string): Promise<void>;
    private pcmToAudioBuffer;
    private playNext;
    stopTTS(): void;
    getVolume(): number;
    cancel(): void;
}
//# sourceMappingURL=audio.d.ts.map