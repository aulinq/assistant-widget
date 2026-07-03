import { W as D } from "./index-hzgQXJLh.js";
import { C as W, a as _, b as v, D as L, d as Q, c as z, f as V, g as q, e as J, i as j, h as F, s as K, t as $ } from "./index-hzgQXJLh.js";
async function T(a) {
  if (typeof window > "u" || !navigator.mediaDevices?.getUserMedia)
    throw new Error("Microphone access not supported");
  const t = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: !0,
      noiseSuppression: !0,
      autoGainControl: !0,
      sampleRate: 16e3
    }
  }), n = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16e3
  }), e = n.createMediaStreamSource(t), o = n.createAnalyser();
  e.connect(o), o.fftSize = 2048;
  let d, u;
  try {
    const m = 'class AudioCaptureProcessor extends AudioWorkletProcessor{constructor(){super(),this.chunkCount=0}process(r,t,e){const o=r[0];if(!o||!o[0])return!0;const s=o[0],n=new Int16Array(s.length);for(let r=0;r<s.length;r++){const t=Math.max(-1,Math.min(1,s[r]));n[r]=t<0?32768*t:32767*t}return this.port.postMessage({audioData:n.buffer,length:n.length},[n.buffer]),this.chunkCount++,!0}}registerProcessor("audio-capture-processor",AudioCaptureProcessor);', I = new Blob([m], { type: "application/javascript" }), E = URL.createObjectURL(I);
    await n.audioWorklet.addModule(E), d = new AudioWorkletNode(n, "audio-capture-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1
    });
    let p = [];
    const g = 16, h = 0.05, b = 1e3, A = 2;
    let s = !1, i = 0, r = 0;
    const C = (f) => {
      const c = new Int16Array(f);
      let S = 0;
      for (let l = 0; l < c.length; l++) {
        const k = c[l] / 32768;
        S += k * k;
      }
      return Math.sqrt(S / c.length);
    };
    d.port.onmessage = (f) => {
      const { audioData: c } = f.data;
      if (p.push(c), p.length >= g) {
        const S = p.reduce((w, x) => w + x.byteLength, 0), l = new Uint8Array(S);
        let k = 0;
        for (const w of p)
          l.set(new Uint8Array(w), k), k += w.byteLength;
        const R = C(l.buffer), P = Date.now();
        R > h ? (r++, r >= A ? (s || (s = !0, a.onSpeechStart?.()), i = 0, a.onAudioData(l.buffer)) : s && (i = 0, a.onAudioData(l.buffer))) : (r = 0, s && (i === 0 ? i = P : P - i > b ? (s = !1, i = 0, a.onSilence?.()) : a.onAudioData(l.buffer))), p = [];
      }
    }, e.connect(d), d.connect(n.destination);
  } catch (m) {
    console.error("AudioWorklet failed, falling back to ScriptProcessorNode:", m), u = n.createScriptProcessor(4096, 1, 1);
    const I = 0.05, E = 1e3, p = 2;
    let g = !1, h = 0, b = 0;
    const A = (s) => {
      let i = 0;
      for (let r = 0; r < s.length; r++)
        i += s[r] * s[r];
      return Math.sqrt(i / s.length);
    };
    u && (u.onaudioprocess = (s) => {
      const i = s.inputBuffer.getChannelData(0), r = A(i), C = Date.now(), f = new Int16Array(i.length);
      for (let c = 0; c < i.length; c++) {
        const S = Math.max(-1, Math.min(1, i[c]));
        f[c] = S < 0 ? S * 32768 : S * 32767;
      }
      r > I ? (b++, b >= p ? (g || (g = !0, a.onSpeechStart?.()), h = 0, a.onAudioData(f.buffer)) : g && (h = 0, a.onAudioData(f.buffer))) : (b = 0, g && (h === 0 ? h = C : C - h > E ? (g = !1, h = 0, a.onSilence?.()) : a.onAudioData(f.buffer)));
    }), u && (e.connect(u), u.connect(n.destination));
  }
  return {
    mediaRecorder: new MediaRecorder(t),
    mediaStream: t,
    audioContext: n,
    analyser: o,
    workletNode: d,
    processorNode: u
  };
}
function N(a) {
  a.workletNode && a.workletNode.disconnect(), a.processorNode && a.processorNode.disconnect(), a.mediaStream && a.mediaStream.getTracks().forEach((t) => t.stop()), a.audioContext && a.audioContext.state !== "closed" && a.audioContext.close();
}
class M {
  audioContext = null;
  audioQueue = [];
  isPlaying = !1;
  currentSource = null;
  analyser = null;
  playbackStartCallback;
  playbackEndCallback;
  currentInteractionId = null;
  async initialize() {
    if (this.audioContext || (this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 24e3
      // Default for most TTS
    }), this.analyser = this.audioContext.createAnalyser(), this.analyser.fftSize = 256, this.analyser.connect(this.audioContext.destination)), this.audioContext.state === "suspended")
      try {
        await this.audioContext.resume();
      } catch (t) {
        console.warn("Failed to resume AudioContext:", t);
      }
  }
  onPlaybackStart(t) {
    this.playbackStartCallback = t;
  }
  onPlaybackEnd(t) {
    this.playbackEndCallback = t;
  }
  async playAudioChunk(t, n) {
    n && n !== this.currentInteractionId && (this.stopTTS(), this.audioQueue = [], this.currentInteractionId = n);
    let e;
    if (t instanceof Blob ? e = await t.arrayBuffer() : e = t, this.audioContext || await this.initialize(), this.audioContext && this.audioContext.state !== "running")
      try {
        await this.audioContext.resume();
      } catch {
      }
    try {
      this.audioQueue.push(e), this.isPlaying || this.playNext();
    } catch (o) {
      console.error("Error processing audio:", o);
    }
  }
  pcmToAudioBuffer(t, n, e) {
    const o = new Int16Array(t), d = this.audioContext.createBuffer(e, o.length / e, n), u = d.getChannelData(0);
    for (let y = 0; y < o.length; y++)
      u[y] = o[y] / 32768;
    return d;
  }
  async playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = !1, this.currentInteractionId = null, this.playbackEndCallback?.();
      return;
    }
    this.audioContext || await this.initialize();
    const t = this.audioQueue.shift();
    this.isPlaying || (this.isPlaying = !0, this.playbackStartCallback?.());
    try {
      const n = this.pcmToAudioBuffer(t, 24e3, 1), e = this.audioContext.createBufferSource();
      e.buffer = n, e.connect(this.analyser), this.currentSource = e, e.onended = () => {
        this.currentSource = null, this.playNext();
      }, e.start(0);
    } catch {
      try {
        const e = await this.audioContext.decodeAudioData(t.slice(0)), o = this.audioContext.createBufferSource();
        o.buffer = e, o.connect(this.analyser), this.currentSource = o, o.onended = () => {
          this.currentSource = null, this.playNext();
        }, o.start(0);
      } catch (e) {
        console.error("Failed to play audio chunk with both PCM and decodeAudioData:", e), this.playNext();
      }
    }
  }
  stopTTS() {
    this.currentSource && (this.currentSource.stop(), this.currentSource = null), this.audioQueue = [], this.isPlaying = !1, this.currentInteractionId = null, this.playbackEndCallback?.();
  }
  getVolume() {
    if (!this.analyser || !this.isPlaying) return 0;
    const t = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(t);
    let n = 0;
    for (let e = 0; e < t.length; e++) {
      const o = (t[e] - 128) / 128;
      n += o * o;
    }
    return Math.sqrt(n / t.length);
  }
  cancel() {
    this.stopTTS();
  }
}
class U {
  webSocket = null;
  recordingResources = {};
  audioPlayback;
  isRecording = !1;
  isSpeaking = !1;
  ttsEnabled = !1;
  currentInteractionId = null;
  callbacks;
  constructor(t = {}) {
    this.callbacks = t, this.audioPlayback = new M(), this.audioPlayback.onPlaybackStart(() => {
      this.isSpeaking = !0, this.callbacks.onSpeakingStateChange?.(!0);
    }), this.audioPlayback.onPlaybackEnd(() => {
      this.isSpeaking = !1, this.callbacks.onSpeakingStateChange?.(!1);
    });
  }
  setWebSocket(t) {
    this.webSocket = t;
  }
  async startRecording() {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN)
      throw new Error("WebSocket not connected");
    if (!this.isRecording)
      try {
        this.isRecording = !0, this.callbacks.onRecordingStateChange?.(!0), this.recordingResources = await T({
          onAudioData: (t) => {
            this.webSocket && this.webSocket.readyState === WebSocket.OPEN && this.webSocket.send(t);
          },
          onSilence: () => {
            if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN && this.currentInteractionId) {
              const t = {
                type: D.INPUT_END,
                payload: {
                  interactionId: this.currentInteractionId
                },
                timestamp: Date.now()
              };
              this.webSocket.send(JSON.stringify(t));
            }
          },
          onSpeechStart: () => {
            this.currentInteractionId = this.generateInteractionId(), this.callbacks.onInteractionStart && this.callbacks.onInteractionStart(this.currentInteractionId), this.audioPlayback.stopTTS();
          }
        });
      } catch (t) {
        throw this.isRecording = !1, this.callbacks.onRecordingStateChange?.(!1), t;
      }
  }
  stopRecording() {
    this.isRecording && (this.isRecording = !1, N(this.recordingResources), this.recordingResources = {}, this.currentInteractionId = null, this.callbacks.onRecordingStateChange?.(!1));
  }
  async playAudioChunk(t, n) {
    this.ttsEnabled && await this.audioPlayback.playAudioChunk(t, n);
  }
  stopPlayback() {
    this.audioPlayback.stopTTS();
  }
  cancel() {
    this.stopPlayback();
  }
  getIsRecording() {
    return this.isRecording;
  }
  getIsSpeaking() {
    return this.isSpeaking;
  }
  setTtsEnabled(t) {
    this.ttsEnabled = t, t || this.stopPlayback();
  }
  getTtsEnabled() {
    return this.ttsEnabled;
  }
  getVolume() {
    return this.audioPlayback.getVolume();
  }
  generateInteractionId() {
    return `interaction-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
export {
  M as AudioPlaybackManager,
  W as ChatService,
  _ as ChatStore,
  v as ChatWidget,
  L as DefaultTheme,
  U as VoiceService,
  D as WSMessageType,
  Q as debounce,
  z as deepClone,
  V as formatTime,
  q as generateId,
  J as isEmpty,
  j as isValidJson,
  F as safeJsonParse,
  K as sanitizeHtml,
  T as startAudioRecording,
  N as stopAudioRecording,
  $ as truncate
};
//# sourceMappingURL=index.js.map
