class xe {
  state;
  listeners = /* @__PURE__ */ new Set();
  constructor(e) {
    this.state = {
      messages: [],
      isConnected: !1,
      isConnecting: !1,
      isTyping: !1,
      isRecording: !1,
      isSpeaking: !1,
      ttsEnabled: !1,
      error: null,
      ...e
    };
  }
  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(e) {
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  /**
   * Notify all listeners of state change
   */
  notify() {
    const e = this.getState();
    this.listeners.forEach((t) => t(e));
  }
  /**
   * Update state and notify listeners
   */
  setState(e) {
    this.state = { ...this.state, ...e }, this.notify();
  }
  // State update methods
  addMessage(e) {
    this.setState({
      messages: [...this.state.messages, e]
    });
  }
  updateMessage(e, t) {
    this.setState({
      messages: this.state.messages.map(
        (i) => i.id === e ? { ...i, content: t } : i
      )
    });
  }
  updateMessageDetails(e, t) {
    this.setState({
      messages: this.state.messages.map(
        (i) => i.id === e ? { ...i, ...t } : i
      )
    });
  }
  clearMessages() {
    this.setState({ messages: [] });
  }
  removeStatusMessages() {
    this.state.messages.some((t) => t.type === "status") && this.setState({
      messages: this.state.messages.filter((t) => t.type !== "status")
    });
  }
  setConnected(e) {
    this.setState({
      isConnected: e,
      isConnecting: !1,
      error: e ? null : this.state.error
    });
  }
  setConnecting(e) {
    this.setState({ isConnecting: e });
  }
  setTyping(e) {
    this.setState({ isTyping: e });
  }
  setError(e) {
    this.setState({
      error: e,
      isConnecting: !1
    });
  }
  setRecording(e) {
    this.setState({ isRecording: e });
  }
  setSpeaking(e) {
    this.setState({ isSpeaking: e });
  }
  setTtsEnabled(e) {
    this.setState({ ttsEnabled: e });
  }
  reset() {
    this.setState({
      messages: [],
      isConnected: !1,
      isConnecting: !1,
      isTyping: !1,
      isRecording: !1,
      isSpeaking: !1,
      ttsEnabled: !1,
      error: null
    });
  }
}
function v() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function xt(n) {
  const e = new Date(n), t = e.getHours().toString().padStart(2, "0"), i = e.getMinutes().toString().padStart(2, "0");
  return `${t}:${i}`;
}
function yt(n, e) {
  let t = null;
  return function(...s) {
    const r = () => {
      t = null, n(...s);
    };
    t && clearTimeout(t), t = setTimeout(r, e);
  };
}
function St(n) {
  const e = document.createElement("div");
  return e.textContent = n, e.innerHTML;
}
function vt(n) {
  try {
    return JSON.parse(n), !0;
  } catch {
    return !1;
  }
}
function Tt(n) {
  return JSON.parse(JSON.stringify(n));
}
function $t(n) {
  return n == null ? !0 : typeof n == "string" ? n.trim().length === 0 : Array.isArray(n) ? n.length === 0 : typeof n == "object" ? Object.keys(n).length === 0 : !1;
}
function Rt(n, e) {
  return n.length <= e ? n : n.slice(0, e - 3) + "...";
}
function Ct(n, e) {
  try {
    return JSON.parse(n);
  } catch {
    return e;
  }
}
var m = /* @__PURE__ */ ((n) => (n.INPUT_TEXT = "input.text", n.INPUT_AUDIO = "input.audio", n.INPUT_END = "input.end", n.STREAM_LLM = "stream.llm", n.STREAM_STT = "stream.stt", n.RESPONSE_START = "response.start", n.RESPONSE_AUDIO_START = "response.audio_start", n.RESPONSE_AUDIO_END = "response.audio_end", n.RESPONSE_END = "response.end", n.CONTROL_CONFIG = "control.config", n.ERROR = "error", n.STATUS = "status", n.AUDIO = "audio", n.SERVICE_MESSAGE = "service.message", n.DELTA = "delta", n.THOUGHT = "thought", n.DONE = "done", n.TOOL_CALL = "tool_call", n.TOOL_RES = "tool_res", n.TYPING = "typing", n))(m || {});
class ye {
  ws = null;
  config;
  sessionId;
  eventHandler;
  reconnectTimeout = null;
  currentMessageId = null;
  session = null;
  connectionPromise = null;
  activeStreamAbort = null;
  store;
  lastRunId = "";
  constructor(e, t) {
    this.config = {
      reconnect: !0,
      reconnectInterval: 3e3,
      maxReconnectAttempts: 5,
      debug: !0,
      // Force debug logs
      transport: "sse",
      ...e
    }, console.log("[ChatService] Initializing with siteToken:", e.siteToken, "config:", e);
    let i = null, s = [], r = null;
    if (typeof window < "u" && window.localStorage)
      try {
        const l = localStorage.getItem(`aulinq:chat_last_activity:${e.siteToken}`), o = 900 * 1e3;
        if (l && Date.now() - parseInt(l, 10) > o)
          console.log("[ChatService] Chat session expired due to inactivity. Wiping localStorage."), localStorage.removeItem(`aulinq:chat_history:${e.siteToken}`), localStorage.removeItem(`aulinq:chat_session:${e.siteToken}`), localStorage.removeItem(`aulinq:chat_session_data:${e.siteToken}`), localStorage.removeItem(`aulinq:chat_last_activity:${e.siteToken}`);
        else {
          i = localStorage.getItem(`aulinq:chat_session:${e.siteToken}`);
          const c = localStorage.getItem(`aulinq:chat_history:${e.siteToken}`);
          c && (s = JSON.parse(c));
          const u = localStorage.getItem(`aulinq:chat_session_data:${e.siteToken}`);
          if (u) {
            const p = JSON.parse(u);
            (typeof p.expiresAt == "number" ? p.expiresAt : p.expiresAt ? new Date(p.expiresAt).getTime() : 0) > Date.now() + 300 * 1e3 ? (r = p, i = p.sessionId, console.log("[ChatService] Found valid cached chat session token in localStorage. Will bypass handshake.")) : (console.log("[ChatService] Cached chat session token is expired or close to expiry. Will perform handshake."), localStorage.removeItem(`aulinq:chat_session_data:${e.siteToken}`));
          }
        }
      } catch (l) {
        console.error("Failed to load chat session/history from localStorage:", l);
      }
    if (this.sessionId = e.sessionId || i || v(), r && (this.session = r), typeof window < "u" && window.localStorage && this.sessionId)
      try {
        localStorage.setItem(`aulinq:chat_session:${e.siteToken}`, this.sessionId);
      } catch (l) {
        console.error("Failed to save chat session ID to localStorage:", l);
      }
    this.eventHandler = t;
    let a = s;
    a.length === 0 && e.welcomeMessage && (a = [
      {
        id: "welcome",
        role: "assistant",
        content: e.welcomeMessage,
        timestamp: Date.now(),
        type: "text"
      }
    ]), this.store = new xe({ messages: a }), this.store.subscribe((l) => {
      if (typeof window < "u" && window.localStorage)
        try {
          const o = l.messages.filter((h) => h.type !== "status");
          console.log("[ChatService] Saving messages to localStorage under key:", `aulinq:chat_history:${e.siteToken}`, "messages:", o), localStorage.setItem(`aulinq:chat_history:${e.siteToken}`, JSON.stringify(o)), localStorage.setItem(`aulinq:chat_last_activity:${e.siteToken}`, Date.now().toString());
        } catch (o) {
          console.error("Failed to persist chat history to localStorage:", o);
        }
    });
  }
  /**
   * Authenticate with identity-service and mark the text runtime ready.
   */
  async connect() {
    if (this.store.getState().isConnected && this.session?.token) {
      this.log("Already connected");
      return;
    }
    return this.connectionPromise ? this.connectionPromise : (this.connectionPromise = (async () => {
      this.store.setConnecting(!0), this.emit({ type: "connecting" });
      try {
        this.session?.token || (this.session = await this.authenticate()), this.sessionId = this.session.sessionId, typeof window < "u" && window.localStorage && localStorage.setItem(`aulinq:chat_session:${this.config.siteToken}`, this.sessionId), this.store.setConnected(!0), this.emit({ type: "connected" });
      } catch (e) {
        const t = e instanceof Error ? e.message : "Connection failed";
        throw this.handleConnectionError(t), e;
      } finally {
        this.connectionPromise = null;
      }
    })(), this.connectionPromise);
  }
  disconnect() {
    this.reconnectTimeout && (clearTimeout(this.reconnectTimeout), this.reconnectTimeout = null), this.activeStreamAbort && (this.activeStreamAbort.abort(), this.activeStreamAbort = null), this.ws && (this.ws.close(1e3, "Client disconnect"), this.ws = null), this.store.setConnected(!1), this.emit({ type: "disconnected" });
  }
  async sendMessage(e) {
    const t = e.trim();
    if (!t) return;
    if ((!this.store.getState().isConnected || !this.session?.token) && await this.connect(), !this.session?.token)
      throw new Error("Chat session is not connected");
    const i = {
      id: v(),
      role: "user",
      content: t,
      timestamp: Date.now(),
      type: "text"
    };
    this.store.setError(null), this.store.removeStatusMessages(), this.store.addMessage(i), this.handleResponseStart();
    const s = {
      token: this.session.token,
      user_text: t,
      session_key: this.session.sessionId
    };
    (this.config.transport || "sse") === "ws" ? await this.sendViaWebSocket(s) : await this.sendViaSSE(s);
  }
  clearMessages() {
    if (this.store.clearMessages(), this.config.welcomeMessage && this.store.addMessage({
      id: "welcome",
      role: "assistant",
      content: this.config.welcomeMessage,
      timestamp: Date.now(),
      type: "text"
    }), typeof window < "u" && window.localStorage)
      try {
        localStorage.removeItem(`aulinq:chat_history:${this.config.siteToken}`), localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`), localStorage.removeItem(`aulinq:chat_last_activity:${this.config.siteToken}`), this.sessionId = v(), this.session = null, localStorage.setItem(`aulinq:chat_session:${this.config.siteToken}`, this.sessionId);
      } catch (e) {
        console.error("Failed to clear chat session/history from localStorage:", e);
      }
  }
  async sendControl(e) {
    this.log("Ignoring control message for text runtime:", e);
  }
  async sendFeedback(e, t, i) {
    const r = `${this.resolveRuntimeUrl("sse").replace(/\/v1\/chat\/stream\/?$/, "")}/v1/chat/feedback`, a = this.session?.token;
    if (!a) {
      this.log("Cannot send feedback: no active session token");
      return;
    }
    try {
      const l = await fetch(r, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: a,
          run_id: e,
          rating: t,
          comment: i || "",
          session_key: this.sessionId
        })
      });
      l.ok || this.log("Feedback send failed:", l.status, await l.text());
    } catch (l) {
      this.log("Feedback send error:", l);
    }
  }
  isConnected() {
    return this.store.getState().isConnected && !!this.session?.token;
  }
  getSessionId() {
    return this.sessionId;
  }
  async startVoice() {
    throw new Error("Voice is not supported by assistant-widget. Use voice-widget for realtime voice.");
  }
  stopVoice() {
    this.log("Voice is not supported by assistant-widget.");
  }
  async toggleVoice() {
    await this.startVoice();
  }
  isRecording() {
    return !1;
  }
  setLanguage(e) {
    this.config.initialLanguage = e;
  }
  isSpeaking() {
    return !1;
  }
  getTtsEnabled() {
    return !1;
  }
  getVolume() {
    return 0;
  }
  toggleTTS() {
    this.log("TTS is not supported by assistant-widget text runtime.");
  }
  async authenticate() {
    if (this.session?.token)
      return this.session;
    const e = this.config.siteToken;
    if (typeof window < "u") {
      const i = window.__aulinq_pending_handshakes || {};
      if (window.__aulinq_pending_handshakes = i, i[e])
        return this.log("Reusing pending handshake request for siteToken:", e), i[e];
    }
    const t = (async () => {
      const i = this.resolveIdentityBaseUrl(), s = new URL(`${i}/v1/chat/handshake`);
      s.searchParams.set("siteToken", e), this.log("Authenticating with handshake endpoint:", s.toString());
      const r = await fetch(s.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteToken: e })
      });
      if (!r.ok) {
        const o = await r.text();
        throw this.log("Authentication failed:", o), new Error(`Authentication failed: ${this.formatHTTPError(r, o)}`);
      }
      const a = await r.json();
      if (!a.token)
        throw new Error("Authentication failed: missing token");
      const l = {
        token: a.token,
        sessionId: this.config.sessionId || a.sessionId || a.session_id || this.sessionId || v(),
        expiresAt: a.expires_at
      };
      if (this.log("Authentication successful"), typeof window < "u" && window.localStorage)
        try {
          localStorage.setItem(`aulinq:chat_session_data:${e}`, JSON.stringify(l));
        } catch (o) {
          console.error("Failed to save chat session data to localStorage:", o);
        }
      return l;
    })();
    if (typeof window < "u") {
      const i = window.__aulinq_pending_handshakes;
      i[e] = t, t.finally(() => {
        delete i[e];
      });
    }
    return t;
  }
  async sendViaSSE(e) {
    const t = this.resolveRuntimeUrl("sse"), i = new AbortController();
    this.activeStreamAbort = i, this.store.setTyping(!0), this.emit({ type: "typing-start" });
    try {
      const s = await fetch(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(e),
        signal: i.signal
      });
      if (!s.ok) {
        const r = await s.text();
        if (s.status === 401 || r.includes("session expired") || r.includes("invalid token")) {
          if (this.log("Session expired or invalid. Wiping cached session and re-authenticating."), typeof window < "u" && window.localStorage)
            try {
              localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`);
            } catch (o) {
              console.error(o);
            }
          this.session = null, await this.connect();
          const l = this.session;
          if (l?.token)
            return e.token = l.token, this.sendViaSSE(e);
        }
        throw new Error(`Runtime stream failed: ${this.formatHTTPError(s, r)}`);
      }
      if (!s.body)
        throw new Error("Runtime stream failed: empty response body");
      await this.readSSEStream(s.body);
    } catch (s) {
      if (s.name === "AbortError") return;
      const r = s instanceof Error ? s.message : "Runtime stream failed";
      throw this.handleErrorMessage({
        type: m.ERROR,
        content: r,
        timestamp: Date.now()
      }), s;
    } finally {
      this.activeStreamAbort === i && (this.activeStreamAbort = null), this.handleResponseEnd();
    }
  }
  async readSSEStream(e) {
    const t = e.getReader(), i = new TextDecoder();
    let s = "";
    for (; ; ) {
      const { value: r, done: a } = await t.read();
      if (a) break;
      s += i.decode(r, { stream: !0 });
      const l = s.split(/\r?\n\r?\n/);
      s = l.pop() || "";
      for (const o of l)
        this.handleSSEEvent(o);
    }
    s += i.decode(), s.trim() && this.handleSSEEvent(s);
  }
  handleSSEEvent(e) {
    const t = e.split(/\r?\n/).filter((s) => s.startsWith("data:")).map((s) => s.replace(/^data:\s?/, ""));
    if (t.length === 0) return;
    const i = t.join(`
`).trim();
    if (console.log("[ChatService] Raw SSE event received:", i), !i || i === "[DONE]") {
      this.handleResponseEnd();
      return;
    }
    try {
      const s = JSON.parse(i);
      console.log("[ChatService] Parsed SSE event type:", s.type, "run_id:", s.run_id), this.handleRuntimeEvent(s);
    } catch (s) {
      this.log("Failed to parse SSE event:", s, i);
    }
  }
  async sendViaWebSocket(e) {
    const t = this.resolveRuntimeUrl("ws");
    this.store.setTyping(!0), this.emit({ type: "typing-start" }), await new Promise((i, s) => {
      let r = !1;
      const a = new WebSocket(t);
      this.ws = a;
      const l = (o) => {
        r || (r = !0, this.ws = null, this.handleResponseEnd(), o ? s(o) : i());
      };
      a.onopen = () => {
        this.log("Runtime WebSocket opened"), a.send(JSON.stringify(e));
      }, a.onmessage = async (o) => {
        try {
          const h = JSON.parse(o.data);
          if (h.type === m.ERROR && h.content && (h.content.includes("session expired") || h.content.includes("invalid token"))) {
            if (this.log("Session expired or invalid (WS). Wiping cached session and re-authenticating."), typeof window < "u" && window.localStorage)
              try {
                localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`);
              } catch (p) {
                console.error(p);
              }
            this.session = null, a.close(1008, "Session expired"), l(), await this.connect();
            const u = this.session;
            u?.token && (e.token = u.token, await this.sendViaWebSocket(e));
            return;
          }
          this.handleRuntimeEvent(h), (h.type === m.DONE || h.type === m.ERROR) && (a.close(1e3, "Message complete"), l());
        } catch (h) {
          l(h instanceof Error ? h : new Error("Invalid runtime WebSocket message"));
        }
      }, a.onerror = () => {
        l(new Error("Runtime WebSocket error"));
      }, a.onclose = (o) => {
        o.code === 1e3 || r ? l() : l(new Error(`Runtime WebSocket closed with code ${o.code}`));
      };
    });
  }
  handleRuntimeEvent(e) {
    switch (this.log("Received runtime event:", e), e.run_id && (this.lastRunId = e.run_id), e.type) {
      case m.STREAM_STT:
        this.handleSttMessage(e);
        break;
      case m.STREAM_LLM:
      case m.DELTA:
        this.handleLlmMessage(e);
        break;
      case m.THOUGHT:
        this.handleThoughtMessage(e);
        break;
      case m.TYPING:
      case m.STATUS:
        this.handleStatusMessage(e);
        break;
      case m.TOOL_CALL:
      case m.TOOL_RES:
        this.handleToolMessage(e);
        break;
      case m.DONE:
      case m.RESPONSE_END:
        if (!this.currentMessageId && e.content && this.handleLlmMessage({ ...e, type: m.STREAM_LLM }), e.run_id) {
          const t = this.store.getState().messages;
          for (let i = t.length - 1; i >= 0; i--) {
            const s = t[i];
            if (s.role === "assistant" && s.type === "text") {
              this.store.updateMessageDetails(s.id, {
                metadata: { ...s.metadata, run_id: e.run_id }
              });
              break;
            }
          }
        }
        this.handleResponseEnd();
        break;
      case m.ERROR:
        this.handleErrorMessage(e);
        break;
      case m.SERVICE_MESSAGE:
        this.handleServiceMessage(e);
        break;
      default:
        this.log("Unknown runtime event type:", e.type);
    }
  }
  handleSttMessage(e) {
    const t = e.payload?.text || "", i = !!e.payload?.is_final;
    if (!t.trim()) return;
    const s = this.store.getState().messages, r = s[s.length - 1];
    if (i && r && r.role === "user" && r.type === "text" && !r.metadata?.finalized) {
      this.store.updateMessageDetails(r.id, {
        content: t,
        metadata: { ...r.metadata, finalized: !0 }
      });
      return;
    }
    if (r && r.role === "user" && r.type === "text" && !r.metadata?.finalized) {
      this.store.updateMessage(r.id, t);
      return;
    }
    this.store.addMessage({
      id: v(),
      role: "user",
      content: t,
      timestamp: Date.now(),
      type: "text",
      metadata: { finalized: i }
    });
  }
  handleLlmMessage(e) {
    const t = e.payload?.delta || (e.type === m.DELTA ? e.content : "") || "", i = e.payload?.content || (e.type === m.DELTA ? "" : e.content) || "", s = t || i, r = e.run_id;
    if (!s && !this.currentMessageId) return;
    if (!this.currentMessageId) {
      this.store.removeStatusMessages();
      const l = v();
      this.currentMessageId = l, this.store.addMessage({
        id: l,
        role: "assistant",
        content: s,
        timestamp: Date.now(),
        type: "text",
        metadata: r ? { run_id: r } : void 0
      }), this.store.setTyping(!0), this.emit({ type: "typing-start" });
      return;
    }
    const a = this.store.getState().messages.find((l) => l.id === this.currentMessageId);
    a && (this.store.updateMessage(this.currentMessageId, a.content + s), r && !a.metadata?.run_id && this.store.updateMessageDetails(this.currentMessageId, {
      metadata: { ...a.metadata, run_id: r }
    }));
  }
  handleResponseStart() {
    this.currentMessageId = null, this.store.removeStatusMessages(), this.handleStatusMessage({
      type: m.STATUS,
      payload: {
        status: "thinking",
        message: "Thinking...",
        target: "bot"
      },
      timestamp: Date.now()
    });
  }
  handleResponseEnd() {
    this.store.getState().isTyping && (this.store.setTyping(!1), this.emit({ type: "typing-end" })), this.currentMessageId = null, this.store.removeStatusMessages();
  }
  handleErrorMessage(e) {
    const t = e.payload?.message || e.content || "An error occurred";
    this.store.removeStatusMessages(), this.handleResponseEnd(), this.store.addMessage({
      id: v(),
      role: "assistant",
      content: t,
      timestamp: Date.now(),
      type: "error"
    }), this.store.setError(t), this.emit({ type: "error", data: t });
  }
  handleStatusMessage(e) {
    const t = e.payload?.message || e.payload?.status || e.content;
    if (!t) return;
    const i = this.store.getState().messages, s = i[i.length - 1], r = e.payload?.target || "bot", a = r === "user" ? "user" : "assistant";
    if (s && s.type === "status" && s.metadata?.target === r) {
      this.store.updateMessageDetails(s.id, {
        content: t,
        timestamp: Date.now(),
        metadata: {
          ...s.metadata,
          status: e.payload?.status || e.type,
          target: r,
          details: e.payload?.details || e.metadata
        }
      });
      return;
    }
    this.store.addMessage({
      id: e.id || v(),
      role: a,
      content: t,
      timestamp: Date.now(),
      type: "status",
      metadata: {
        status: e.payload?.status || e.type,
        target: r,
        details: e.payload?.details || e.metadata
      }
    });
  }
  handleServiceMessage(e) {
    const t = e.payload;
    this.store.removeStatusMessages(), this.store.addMessage({
      id: e.id || v(),
      role: t?.target === "user" ? "user" : "assistant",
      content: t?.content || e.content || "Service notification",
      timestamp: Date.now(),
      type: "error",
      metadata: {
        messageType: t?.messageType,
        localized: t?.localized,
        target: t?.target || "bot"
      }
    });
  }
  handleThoughtMessage(e) {
    const t = e.content || e.payload?.text || "";
    t && this.handleStatusMessage({
      type: m.STATUS,
      payload: {
        status: "thought",
        message: t,
        target: "bot"
      },
      timestamp: Date.now()
    });
  }
  handleToolMessage(e) {
    const t = e.content || e.payload?.text || "", i = e.type === m.TOOL_CALL ? "Executing tool" : "Tool result";
    this.handleStatusMessage({
      type: m.STATUS,
      payload: {
        status: e.type,
        message: t ? `${i}: ${t}` : i,
        target: "bot"
      },
      timestamp: Date.now()
    });
  }
  handleConnectionError(e) {
    this.session = null, this.store.setConnected(!1), this.store.setError(e), this.emit({ type: "error", data: e });
  }
  resolveIdentityBaseUrl() {
    const e = this.config.identityUrl || this.config.serverUrl || "http://localhost:8100";
    return this.normalizeHttpBase(e).replace(/\/v1\/chat\/handshake\/?$/, "");
  }
  resolveRuntimeUrl(e) {
    const t = e === "ws" ? "ws://localhost:8890/v1/chat/ws" : "http://localhost:8890/v1/chat/stream", i = this.config.runtimeUrl || this.config.serverUrl || t, s = new URL(e === "ws" ? this.toWebSocketUrl(i) : this.toHttpUrl(i));
    return e === "ws" ? s.pathname.endsWith("/v1/chat/stream") ? s.pathname = s.pathname.replace(/\/v1\/chat\/stream\/?$/, "/v1/chat/ws") : s.pathname.endsWith("/v1/chat/ws") || (s.pathname = `${s.pathname.replace(/\/$/, "")}/v1/chat/ws`) : s.pathname.endsWith("/v1/chat/ws") ? s.pathname = s.pathname.replace(/\/v1\/chat\/ws\/?$/, "/v1/chat/stream") : s.pathname.endsWith("/v1/chat/stream") || (s.pathname = `${s.pathname.replace(/\/$/, "")}/v1/chat/stream`), s.toString();
  }
  normalizeHttpBase(e) {
    const t = new URL(this.toHttpUrl(e));
    return t.pathname = t.pathname.replace(/\/$/, ""), t.search = "", t.hash = "", t.toString().replace(/\/$/, "");
  }
  toHttpUrl(e) {
    return e.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
  }
  toWebSocketUrl(e) {
    return e.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  }
  formatHTTPError(e, t) {
    if (t)
      try {
        const i = JSON.parse(t);
        if (i.error || i.message)
          return i.error || i.message || e.statusText || String(e.status);
      } catch {
        return t;
      }
    return e.statusText || String(e.status);
  }
  emit(e) {
    this.eventHandler?.(e);
  }
  log(...e) {
    this.config.debug && console.log("[ChatService]", ...e);
  }
}
function V() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var R = V();
function le(n) {
  R = n;
}
var M = { exec: () => null };
function d(n, e = "") {
  let t = typeof n == "string" ? n : n.source, i = { replace: (s, r) => {
    let a = typeof r == "string" ? r : r.source;
    return a = a.replace(w.caret, "$1"), t = t.replace(s, a), i;
  }, getRegex: () => new RegExp(t, e) };
  return i;
}
var Se = (() => {
  try {
    return !!new RegExp("(?<=1)(?<!1)");
  } catch {
    return !1;
  }
})(), w = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (n) => new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}#`), htmlBeginRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}<(?:[a-z].*>|!--)`, "i") }, ve = /^(?:[ \t]*(?:\n|$))+/, Te = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, $e = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, L = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Re = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, j = /(?:[*+-]|\d{1,9}[.)])/, ce = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, he = d(ce).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Ce = d(ce).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), W = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ee = /^[^\n]+/, Z = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Ae = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Z).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Ie = d(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, j).getRegex(), q = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", G = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, _e = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", G).replace("tag", q).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ue = d(W).replace("hr", L).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", q).getRegex(), Me = d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ue).getRegex(), J = { blockquote: Me, code: Te, def: Ae, fences: $e, heading: Re, hr: L, html: _e, lheading: he, list: Ie, newline: ve, paragraph: ue, table: M, text: Ee }, te = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", L).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", q).getRegex(), Le = { ...J, lheading: Ce, table: te, paragraph: d(W).replace("hr", L).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", te).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", q).getRegex() }, ze = { ...J, html: d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", G).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: M, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: d(W).replace("hr", L).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", he).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, Pe = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, De = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, pe = /^( {2,}|\\)\n(?!\s*$)/, Oe = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, B = /[\p{P}\p{S}]/u, Q = /[\s\p{P}\p{S}]/u, de = /[^\s\p{P}\p{S}]/u, qe = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Q).getRegex(), ge = /(?!~)[\p{P}\p{S}]/u, Be = /(?!~)[\s\p{P}\p{S}]/u, Ne = /(?:[^\s\p{P}\p{S}]|~)/u, He = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Se ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), fe = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, Ue = d(fe, "u").replace(/punct/g, B).getRegex(), Fe = d(fe, "u").replace(/punct/g, ge).getRegex(), ke = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Ve = d(ke, "gu").replace(/notPunctSpace/g, de).replace(/punctSpace/g, Q).replace(/punct/g, B).getRegex(), je = d(ke, "gu").replace(/notPunctSpace/g, Ne).replace(/punctSpace/g, Be).replace(/punct/g, ge).getRegex(), We = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, de).replace(/punctSpace/g, Q).replace(/punct/g, B).getRegex(), Ze = d(/\\(punct)/, "gu").replace(/punct/g, B).getRegex(), Ge = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Je = d(G).replace("(?:-->|$)", "-->").getRegex(), Qe = d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Je).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), P = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/, Xe = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", P).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), me = d(/^!?\[(label)\]\[(ref)\]/).replace("label", P).replace("ref", Z).getRegex(), be = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", Z).getRegex(), Ke = d("reflink|nolink(?!\\()", "g").replace("reflink", me).replace("nolink", be).getRegex(), se = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, X = { _backpedal: M, anyPunctuation: Ze, autolink: Ge, blockSkip: He, br: pe, code: De, del: M, emStrongLDelim: Ue, emStrongRDelimAst: Ve, emStrongRDelimUnd: We, escape: Pe, link: Xe, nolink: be, punctuation: qe, reflink: me, reflinkSearch: Ke, tag: Qe, text: Oe, url: M }, Ye = { ...X, link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", P).getRegex(), reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", P).getRegex() }, H = { ...X, emStrongRDelimAst: je, emStrongLDelim: Fe, url: d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", se).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: d(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", se).getRegex() }, et = { ...H, br: d(pe).replace("{2,}", "*").getRegex(), text: d(H.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, z = { normal: J, gfm: Le, pedantic: ze }, A = { normal: X, gfm: H, breaks: et, pedantic: Ye }, tt = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, ne = (n) => tt[n];
function T(n, e) {
  if (e) {
    if (w.escapeTest.test(n)) return n.replace(w.escapeReplace, ne);
  } else if (w.escapeTestNoEncode.test(n)) return n.replace(w.escapeReplaceNoEncode, ne);
  return n;
}
function ie(n) {
  try {
    n = encodeURI(n).replace(w.percentDecode, "%");
  } catch {
    return null;
  }
  return n;
}
function re(n, e) {
  let t = n.replace(w.findPipe, (r, a, l) => {
    let o = !1, h = a;
    for (; --h >= 0 && l[h] === "\\"; ) o = !o;
    return o ? "|" : " |";
  }), i = t.split(w.splitPipe), s = 0;
  if (i[0].trim() || i.shift(), i.length > 0 && !i.at(-1)?.trim() && i.pop(), e) if (i.length > e) i.splice(e);
  else for (; i.length < e; ) i.push("");
  for (; s < i.length; s++) i[s] = i[s].trim().replace(w.slashPipe, "|");
  return i;
}
function I(n, e, t) {
  let i = n.length;
  if (i === 0) return "";
  let s = 0;
  for (; s < i && n.charAt(i - s - 1) === e; )
    s++;
  return n.slice(0, i - s);
}
function st(n, e) {
  if (n.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let i = 0; i < n.length; i++) if (n[i] === "\\") i++;
  else if (n[i] === e[0]) t++;
  else if (n[i] === e[1] && (t--, t < 0)) return i;
  return t > 0 ? -2 : -1;
}
function ae(n, e, t, i, s) {
  let r = e.href, a = e.title || null, l = n[1].replace(s.other.outputLinkReplace, "$1");
  i.state.inLink = !0;
  let o = { type: n[0].charAt(0) === "!" ? "image" : "link", raw: t, href: r, title: a, text: l, tokens: i.inlineTokens(l) };
  return i.state.inLink = !1, o;
}
function nt(n, e, t) {
  let i = n.match(t.other.indentCodeCompensation);
  if (i === null) return e;
  let s = i[1];
  return e.split(`
`).map((r) => {
    let a = r.match(t.other.beginningSpace);
    if (a === null) return r;
    let [l] = a;
    return l.length >= s.length ? r.slice(s.length) : r;
  }).join(`
`);
}
var D = class {
  options;
  rules;
  lexer;
  constructor(n) {
    this.options = n || R;
  }
  space(n) {
    let e = this.rules.block.newline.exec(n);
    if (e && e[0].length > 0) return { type: "space", raw: e[0] };
  }
  code(n) {
    let e = this.rules.block.code.exec(n);
    if (e) {
      let t = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: e[0], codeBlockStyle: "indented", text: this.options.pedantic ? t : I(t, `
`) };
    }
  }
  fences(n) {
    let e = this.rules.block.fences.exec(n);
    if (e) {
      let t = e[0], i = nt(t, e[3] || "", this.rules);
      return { type: "code", raw: t, lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2], text: i };
    }
  }
  heading(n) {
    let e = this.rules.block.heading.exec(n);
    if (e) {
      let t = e[2].trim();
      if (this.rules.other.endingHash.test(t)) {
        let i = I(t, "#");
        (this.options.pedantic || !i || this.rules.other.endingSpaceChar.test(i)) && (t = i.trim());
      }
      return { type: "heading", raw: e[0], depth: e[1].length, text: t, tokens: this.lexer.inline(t) };
    }
  }
  hr(n) {
    let e = this.rules.block.hr.exec(n);
    if (e) return { type: "hr", raw: I(e[0], `
`) };
  }
  blockquote(n) {
    let e = this.rules.block.blockquote.exec(n);
    if (e) {
      let t = I(e[0], `
`).split(`
`), i = "", s = "", r = [];
      for (; t.length > 0; ) {
        let a = !1, l = [], o;
        for (o = 0; o < t.length; o++) if (this.rules.other.blockquoteStart.test(t[o])) l.push(t[o]), a = !0;
        else if (!a) l.push(t[o]);
        else break;
        t = t.slice(o);
        let h = l.join(`
`), c = h.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        i = i ? `${i}
${h}` : h, s = s ? `${s}
${c}` : c;
        let u = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, r, !0), this.lexer.state.top = u, t.length === 0) break;
        let p = r.at(-1);
        if (p?.type === "code") break;
        if (p?.type === "blockquote") {
          let f = p, k = f.raw + `
` + t.join(`
`), b = this.blockquote(k);
          r[r.length - 1] = b, i = i.substring(0, i.length - f.raw.length) + b.raw, s = s.substring(0, s.length - f.text.length) + b.text;
          break;
        } else if (p?.type === "list") {
          let f = p, k = f.raw + `
` + t.join(`
`), b = this.list(k);
          r[r.length - 1] = b, i = i.substring(0, i.length - p.raw.length) + b.raw, s = s.substring(0, s.length - f.raw.length) + b.raw, t = k.substring(r.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: i, tokens: r, text: s };
    }
  }
  list(n) {
    let e = this.rules.block.list.exec(n);
    if (e) {
      let t = e[1].trim(), i = t.length > 1, s = { type: "list", raw: "", ordered: i, start: i ? +t.slice(0, -1) : "", loose: !1, items: [] };
      t = i ? `\\d{1,9}\\${t.slice(-1)}` : `\\${t}`, this.options.pedantic && (t = i ? t : "[*+-]");
      let r = this.rules.other.listItemRegex(t), a = !1;
      for (; n; ) {
        let o = !1, h = "", c = "";
        if (!(e = r.exec(n)) || this.rules.block.hr.test(n)) break;
        h = e[0], n = n.substring(h.length);
        let u = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (b) => " ".repeat(3 * b.length)), p = n.split(`
`, 1)[0], f = !u.trim(), k = 0;
        if (this.options.pedantic ? (k = 2, c = u.trimStart()) : f ? k = e[1].length + 1 : (k = e[2].search(this.rules.other.nonSpaceChar), k = k > 4 ? 1 : k, c = u.slice(k), k += e[1].length), f && this.rules.other.blankLine.test(p) && (h += p + `
`, n = n.substring(p.length + 1), o = !0), !o) {
          let b = this.rules.other.nextBulletRegex(k), S = this.rules.other.hrRegex(k), Y = this.rules.other.fencesBeginRegex(k), ee = this.rules.other.headingBeginRegex(k), we = this.rules.other.htmlBeginRegex(k);
          for (; n; ) {
            let N = n.split(`
`, 1)[0], E;
            if (p = N, this.options.pedantic ? (p = p.replace(this.rules.other.listReplaceNesting, "  "), E = p) : E = p.replace(this.rules.other.tabCharGlobal, "    "), Y.test(p) || ee.test(p) || we.test(p) || b.test(p) || S.test(p)) break;
            if (E.search(this.rules.other.nonSpaceChar) >= k || !p.trim()) c += `
` + E.slice(k);
            else {
              if (f || u.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(u) || ee.test(u) || S.test(u)) break;
              c += `
` + p;
            }
            !f && !p.trim() && (f = !0), h += N + `
`, n = n.substring(N.length + 1), u = E.slice(k);
          }
        }
        s.loose || (a ? s.loose = !0 : this.rules.other.doubleBlankLine.test(h) && (a = !0)), s.items.push({ type: "list_item", raw: h, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: !1, text: c, tokens: [] }), s.raw += h;
      }
      let l = s.items.at(-1);
      if (l) l.raw = l.raw.trimEnd(), l.text = l.text.trimEnd();
      else return;
      s.raw = s.raw.trimEnd();
      for (let o of s.items) {
        if (this.lexer.state.top = !1, o.tokens = this.lexer.blockTokens(o.text, []), o.task) {
          if (o.text = o.text.replace(this.rules.other.listReplaceTask, ""), o.tokens[0]?.type === "text" || o.tokens[0]?.type === "paragraph") {
            o.tokens[0].raw = o.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), o.tokens[0].text = o.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let c = this.lexer.inlineQueue.length - 1; c >= 0; c--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)) {
              this.lexer.inlineQueue[c].src = this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let h = this.rules.other.listTaskCheckbox.exec(o.raw);
          if (h) {
            let c = { type: "checkbox", raw: h[0] + " ", checked: h[0] !== "[ ]" };
            o.checked = c.checked, s.loose ? o.tokens[0] && ["paragraph", "text"].includes(o.tokens[0].type) && "tokens" in o.tokens[0] && o.tokens[0].tokens ? (o.tokens[0].raw = c.raw + o.tokens[0].raw, o.tokens[0].text = c.raw + o.tokens[0].text, o.tokens[0].tokens.unshift(c)) : o.tokens.unshift({ type: "paragraph", raw: c.raw, text: c.raw, tokens: [c] }) : o.tokens.unshift(c);
          }
        }
        if (!s.loose) {
          let h = o.tokens.filter((u) => u.type === "space"), c = h.length > 0 && h.some((u) => this.rules.other.anyLine.test(u.raw));
          s.loose = c;
        }
      }
      if (s.loose) for (let o of s.items) {
        o.loose = !0;
        for (let h of o.tokens) h.type === "text" && (h.type = "paragraph");
      }
      return s;
    }
  }
  html(n) {
    let e = this.rules.block.html.exec(n);
    if (e) return { type: "html", block: !0, raw: e[0], pre: e[1] === "pre" || e[1] === "script" || e[1] === "style", text: e[0] };
  }
  def(n) {
    let e = this.rules.block.def.exec(n);
    if (e) {
      let t = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), i = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return { type: "def", tag: t, raw: e[0], href: i, title: s };
    }
  }
  table(n) {
    let e = this.rules.block.table.exec(n);
    if (!e || !this.rules.other.tableDelimiter.test(e[2])) return;
    let t = re(e[1]), i = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), s = e[3]?.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], r = { type: "table", raw: e[0], header: [], align: [], rows: [] };
    if (t.length === i.length) {
      for (let a of i) this.rules.other.tableAlignRight.test(a) ? r.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? r.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? r.align.push("left") : r.align.push(null);
      for (let a = 0; a < t.length; a++) r.header.push({ text: t[a], tokens: this.lexer.inline(t[a]), header: !0, align: r.align[a] });
      for (let a of s) r.rows.push(re(a, r.header.length).map((l, o) => ({ text: l, tokens: this.lexer.inline(l), header: !1, align: r.align[o] })));
      return r;
    }
  }
  lheading(n) {
    let e = this.rules.block.lheading.exec(n);
    if (e) return { type: "heading", raw: e[0], depth: e[2].charAt(0) === "=" ? 1 : 2, text: e[1], tokens: this.lexer.inline(e[1]) };
  }
  paragraph(n) {
    let e = this.rules.block.paragraph.exec(n);
    if (e) {
      let t = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return { type: "paragraph", raw: e[0], text: t, tokens: this.lexer.inline(t) };
    }
  }
  text(n) {
    let e = this.rules.block.text.exec(n);
    if (e) return { type: "text", raw: e[0], text: e[0], tokens: this.lexer.inline(e[0]) };
  }
  escape(n) {
    let e = this.rules.inline.escape.exec(n);
    if (e) return { type: "escape", raw: e[0], text: e[1] };
  }
  tag(n) {
    let e = this.rules.inline.tag.exec(n);
    if (e) return !this.lexer.state.inLink && this.rules.other.startATag.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(e[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: e[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: e[0] };
  }
  link(n) {
    let e = this.rules.inline.link.exec(n);
    if (e) {
      let t = e[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(t)) {
        if (!this.rules.other.endAngleBracket.test(t)) return;
        let r = I(t.slice(0, -1), "\\");
        if ((t.length - r.length) % 2 === 0) return;
      } else {
        let r = st(e[2], "()");
        if (r === -2) return;
        if (r > -1) {
          let a = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + r;
          e[2] = e[2].substring(0, r), e[0] = e[0].substring(0, a).trim(), e[3] = "";
        }
      }
      let i = e[2], s = "";
      if (this.options.pedantic) {
        let r = this.rules.other.pedanticHrefTitle.exec(i);
        r && (i = r[1], s = r[3]);
      } else s = e[3] ? e[3].slice(1, -1) : "";
      return i = i.trim(), this.rules.other.startAngleBracket.test(i) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(t) ? i = i.slice(1) : i = i.slice(1, -1)), ae(e, { href: i && i.replace(this.rules.inline.anyPunctuation, "$1"), title: s && s.replace(this.rules.inline.anyPunctuation, "$1") }, e[0], this.lexer, this.rules);
    }
  }
  reflink(n, e) {
    let t;
    if ((t = this.rules.inline.reflink.exec(n)) || (t = this.rules.inline.nolink.exec(n))) {
      let i = (t[2] || t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), s = e[i.toLowerCase()];
      if (!s) {
        let r = t[0].charAt(0);
        return { type: "text", raw: r, text: r };
      }
      return ae(t, s, t[0], this.lexer, this.rules);
    }
  }
  emStrong(n, e, t = "") {
    let i = this.rules.inline.emStrongLDelim.exec(n);
    if (!(!i || i[3] && t.match(this.rules.other.unicodeAlphaNumeric)) && (!(i[1] || i[2]) || !t || this.rules.inline.punctuation.exec(t))) {
      let s = [...i[0]].length - 1, r, a, l = s, o = 0, h = i[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (h.lastIndex = 0, e = e.slice(-1 * n.length + s); (i = h.exec(e)) != null; ) {
        if (r = i[1] || i[2] || i[3] || i[4] || i[5] || i[6], !r) continue;
        if (a = [...r].length, i[3] || i[4]) {
          l += a;
          continue;
        } else if ((i[5] || i[6]) && s % 3 && !((s + a) % 3)) {
          o += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + o);
        let c = [...i[0]][0].length, u = n.slice(0, s + i.index + c + a);
        if (Math.min(s, a) % 2) {
          let f = u.slice(1, -1);
          return { type: "em", raw: u, text: f, tokens: this.lexer.inlineTokens(f) };
        }
        let p = u.slice(2, -2);
        return { type: "strong", raw: u, text: p, tokens: this.lexer.inlineTokens(p) };
      }
    }
  }
  codespan(n) {
    let e = this.rules.inline.code.exec(n);
    if (e) {
      let t = e[2].replace(this.rules.other.newLineCharGlobal, " "), i = this.rules.other.nonSpaceChar.test(t), s = this.rules.other.startingSpaceChar.test(t) && this.rules.other.endingSpaceChar.test(t);
      return i && s && (t = t.substring(1, t.length - 1)), { type: "codespan", raw: e[0], text: t };
    }
  }
  br(n) {
    let e = this.rules.inline.br.exec(n);
    if (e) return { type: "br", raw: e[0] };
  }
  del(n) {
    let e = this.rules.inline.del.exec(n);
    if (e) return { type: "del", raw: e[0], text: e[2], tokens: this.lexer.inlineTokens(e[2]) };
  }
  autolink(n) {
    let e = this.rules.inline.autolink.exec(n);
    if (e) {
      let t, i;
      return e[2] === "@" ? (t = e[1], i = "mailto:" + t) : (t = e[1], i = t), { type: "link", raw: e[0], text: t, href: i, tokens: [{ type: "text", raw: t, text: t }] };
    }
  }
  url(n) {
    let e;
    if (e = this.rules.inline.url.exec(n)) {
      let t, i;
      if (e[2] === "@") t = e[0], i = "mailto:" + t;
      else {
        let s;
        do
          s = e[0], e[0] = this.rules.inline._backpedal.exec(e[0])?.[0] ?? "";
        while (s !== e[0]);
        t = e[0], e[1] === "www." ? i = "http://" + e[0] : i = e[0];
      }
      return { type: "link", raw: e[0], text: t, href: i, tokens: [{ type: "text", raw: t, text: t }] };
    }
  }
  inlineText(n) {
    let e = this.rules.inline.text.exec(n);
    if (e) {
      let t = this.lexer.state.inRawBlock;
      return { type: "text", raw: e[0], text: e[0], escaped: t };
    }
  }
}, x = class U {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || R, this.options.tokenizer = this.options.tokenizer || new D(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let t = { other: w, block: z.normal, inline: A.normal };
    this.options.pedantic ? (t.block = z.pedantic, t.inline = A.pedantic) : this.options.gfm && (t.block = z.gfm, this.options.breaks ? t.inline = A.breaks : t.inline = A.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: z, inline: A };
  }
  static lex(e, t) {
    return new U(t).lex(e);
  }
  static lexInline(e, t) {
    return new U(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(w.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let i = this.inlineQueue[t];
      this.inlineTokens(i.src, i.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], i = !1) {
    for (this.options.pedantic && (e = e.replace(w.tabCharGlobal, "    ").replace(w.spaceLine, "")); e; ) {
      let s;
      if (this.options.extensions?.block?.some((a) => (s = a.call({ lexer: this }, e, t)) ? (e = e.substring(s.raw.length), t.push(s), !0) : !1)) continue;
      if (s = this.tokenizer.space(e)) {
        e = e.substring(s.raw.length);
        let a = t.at(-1);
        s.raw.length === 1 && a !== void 0 ? a.raw += `
` : t.push(s);
        continue;
      }
      if (s = this.tokenizer.code(e)) {
        e = e.substring(s.raw.length);
        let a = t.at(-1);
        a?.type === "paragraph" || a?.type === "text" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + s.raw, a.text += `
` + s.text, this.inlineQueue.at(-1).src = a.text) : t.push(s);
        continue;
      }
      if (s = this.tokenizer.fences(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.heading(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.hr(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.blockquote(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.list(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.html(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.def(e)) {
        e = e.substring(s.raw.length);
        let a = t.at(-1);
        a?.type === "paragraph" || a?.type === "text" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + s.raw, a.text += `
` + s.raw, this.inlineQueue.at(-1).src = a.text) : this.tokens.links[s.tag] || (this.tokens.links[s.tag] = { href: s.href, title: s.title }, t.push(s));
        continue;
      }
      if (s = this.tokenizer.table(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      if (s = this.tokenizer.lheading(e)) {
        e = e.substring(s.raw.length), t.push(s);
        continue;
      }
      let r = e;
      if (this.options.extensions?.startBlock) {
        let a = 1 / 0, l = e.slice(1), o;
        this.options.extensions.startBlock.forEach((h) => {
          o = h.call({ lexer: this }, l), typeof o == "number" && o >= 0 && (a = Math.min(a, o));
        }), a < 1 / 0 && a >= 0 && (r = e.substring(0, a + 1));
      }
      if (this.state.top && (s = this.tokenizer.paragraph(r))) {
        let a = t.at(-1);
        i && a?.type === "paragraph" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + s.raw, a.text += `
` + s.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a.text) : t.push(s), i = r.length !== e.length, e = e.substring(s.raw.length);
        continue;
      }
      if (s = this.tokenizer.text(e)) {
        e = e.substring(s.raw.length);
        let a = t.at(-1);
        a?.type === "text" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + s.raw, a.text += `
` + s.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a.text) : t.push(s);
        continue;
      }
      if (e) {
        let a = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(a);
          break;
        } else throw new Error(a);
      }
    }
    return this.state.top = !0, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  inlineTokens(e, t = []) {
    let i = e, s = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0) for (; (s = this.tokenizer.rules.inline.reflinkSearch.exec(i)) != null; ) o.includes(s[0].slice(s[0].lastIndexOf("[") + 1, -1)) && (i = i.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (s = this.tokenizer.rules.inline.anyPunctuation.exec(i)) != null; ) i = i.slice(0, s.index) + "++" + i.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let r;
    for (; (s = this.tokenizer.rules.inline.blockSkip.exec(i)) != null; ) r = s[2] ? s[2].length : 0, i = i.slice(0, s.index + r) + "[" + "a".repeat(s[0].length - r - 2) + "]" + i.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    i = this.options.hooks?.emStrongMask?.call({ lexer: this }, i) ?? i;
    let a = !1, l = "";
    for (; e; ) {
      a || (l = ""), a = !1;
      let o;
      if (this.options.extensions?.inline?.some((c) => (o = c.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let c = t.at(-1);
        o.type === "text" && c?.type === "text" ? (c.raw += o.raw, c.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, i, l)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let h = e;
      if (this.options.extensions?.startInline) {
        let c = 1 / 0, u = e.slice(1), p;
        this.options.extensions.startInline.forEach((f) => {
          p = f.call({ lexer: this }, u), typeof p == "number" && p >= 0 && (c = Math.min(c, p));
        }), c < 1 / 0 && c >= 0 && (h = e.substring(0, c + 1));
      }
      if (o = this.tokenizer.inlineText(h)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (l = o.raw.slice(-1)), a = !0;
        let c = t.at(-1);
        c?.type === "text" ? (c.raw += o.raw, c.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let c = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(c);
          break;
        } else throw new Error(c);
      }
    }
    return t;
  }
}, O = class {
  options;
  parser;
  constructor(n) {
    this.options = n || R;
  }
  space(n) {
    return "";
  }
  code({ text: n, lang: e, escaped: t }) {
    let i = (e || "").match(w.notSpaceStart)?.[0], s = n.replace(w.endingNewline, "") + `
`;
    return i ? '<pre><code class="language-' + T(i) + '">' + (t ? s : T(s, !0)) + `</code></pre>
` : "<pre><code>" + (t ? s : T(s, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: n }) {
    return `<blockquote>
${this.parser.parse(n)}</blockquote>
`;
  }
  html({ text: n }) {
    return n;
  }
  def(n) {
    return "";
  }
  heading({ tokens: n, depth: e }) {
    return `<h${e}>${this.parser.parseInline(n)}</h${e}>
`;
  }
  hr(n) {
    return `<hr>
`;
  }
  list(n) {
    let e = n.ordered, t = n.start, i = "";
    for (let a = 0; a < n.items.length; a++) {
      let l = n.items[a];
      i += this.listitem(l);
    }
    let s = e ? "ol" : "ul", r = e && t !== 1 ? ' start="' + t + '"' : "";
    return "<" + s + r + `>
` + i + "</" + s + `>
`;
  }
  listitem(n) {
    return `<li>${this.parser.parse(n.tokens)}</li>
`;
  }
  checkbox({ checked: n }) {
    return "<input " + (n ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: n }) {
    return `<p>${this.parser.parseInline(n)}</p>
`;
  }
  table(n) {
    let e = "", t = "";
    for (let s = 0; s < n.header.length; s++) t += this.tablecell(n.header[s]);
    e += this.tablerow({ text: t });
    let i = "";
    for (let s = 0; s < n.rows.length; s++) {
      let r = n.rows[s];
      t = "";
      for (let a = 0; a < r.length; a++) t += this.tablecell(r[a]);
      i += this.tablerow({ text: t });
    }
    return i && (i = `<tbody>${i}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + i + `</table>
`;
  }
  tablerow({ text: n }) {
    return `<tr>
${n}</tr>
`;
  }
  tablecell(n) {
    let e = this.parser.parseInline(n.tokens), t = n.header ? "th" : "td";
    return (n.align ? `<${t} align="${n.align}">` : `<${t}>`) + e + `</${t}>
`;
  }
  strong({ tokens: n }) {
    return `<strong>${this.parser.parseInline(n)}</strong>`;
  }
  em({ tokens: n }) {
    return `<em>${this.parser.parseInline(n)}</em>`;
  }
  codespan({ text: n }) {
    return `<code>${T(n, !0)}</code>`;
  }
  br(n) {
    return "<br>";
  }
  del({ tokens: n }) {
    return `<del>${this.parser.parseInline(n)}</del>`;
  }
  link({ href: n, title: e, tokens: t }) {
    let i = this.parser.parseInline(t), s = ie(n);
    if (s === null) return i;
    n = s;
    let r = '<a href="' + n + '"';
    return e && (r += ' title="' + T(e) + '"'), r += ">" + i + "</a>", r;
  }
  image({ href: n, title: e, text: t, tokens: i }) {
    i && (t = this.parser.parseInline(i, this.parser.textRenderer));
    let s = ie(n);
    if (s === null) return T(t);
    n = s;
    let r = `<img src="${n}" alt="${t}"`;
    return e && (r += ` title="${T(e)}"`), r += ">", r;
  }
  text(n) {
    return "tokens" in n && n.tokens ? this.parser.parseInline(n.tokens) : "escaped" in n && n.escaped ? n.text : T(n.text);
  }
}, K = class {
  strong({ text: n }) {
    return n;
  }
  em({ text: n }) {
    return n;
  }
  codespan({ text: n }) {
    return n;
  }
  del({ text: n }) {
    return n;
  }
  html({ text: n }) {
    return n;
  }
  text({ text: n }) {
    return n;
  }
  link({ text: n }) {
    return "" + n;
  }
  image({ text: n }) {
    return "" + n;
  }
  br() {
    return "";
  }
  checkbox({ raw: n }) {
    return n;
  }
}, y = class F {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || R, this.options.renderer = this.options.renderer || new O(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new K();
  }
  static parse(e, t) {
    return new F(t).parse(e);
  }
  static parseInline(e, t) {
    return new F(t).parseInline(e);
  }
  parse(e) {
    let t = "";
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      if (this.options.extensions?.renderers?.[s.type]) {
        let a = s, l = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (l !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(a.type)) {
          t += l || "";
          continue;
        }
      }
      let r = s;
      switch (r.type) {
        case "space": {
          t += this.renderer.space(r);
          break;
        }
        case "hr": {
          t += this.renderer.hr(r);
          break;
        }
        case "heading": {
          t += this.renderer.heading(r);
          break;
        }
        case "code": {
          t += this.renderer.code(r);
          break;
        }
        case "table": {
          t += this.renderer.table(r);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(r);
          break;
        }
        case "list": {
          t += this.renderer.list(r);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(r);
          break;
        }
        case "html": {
          t += this.renderer.html(r);
          break;
        }
        case "def": {
          t += this.renderer.def(r);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(r);
          break;
        }
        case "text": {
          t += this.renderer.text(r);
          break;
        }
        default: {
          let a = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent) return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    let i = "";
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      if (this.options.extensions?.renderers?.[r.type]) {
        let l = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (l !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
          i += l || "";
          continue;
        }
      }
      let a = r;
      switch (a.type) {
        case "escape": {
          i += t.text(a);
          break;
        }
        case "html": {
          i += t.html(a);
          break;
        }
        case "link": {
          i += t.link(a);
          break;
        }
        case "image": {
          i += t.image(a);
          break;
        }
        case "checkbox": {
          i += t.checkbox(a);
          break;
        }
        case "strong": {
          i += t.strong(a);
          break;
        }
        case "em": {
          i += t.em(a);
          break;
        }
        case "codespan": {
          i += t.codespan(a);
          break;
        }
        case "br": {
          i += t.br(a);
          break;
        }
        case "del": {
          i += t.del(a);
          break;
        }
        case "text": {
          i += t.text(a);
          break;
        }
        default: {
          let l = 'Token with "' + a.type + '" type was not found.';
          if (this.options.silent) return console.error(l), "";
          throw new Error(l);
        }
      }
    }
    return i;
  }
}, _ = class {
  options;
  block;
  constructor(n) {
    this.options = n || R;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(n) {
    return n;
  }
  postprocess(n) {
    return n;
  }
  processAllTokens(n) {
    return n;
  }
  emStrongMask(n) {
    return n;
  }
  provideLexer() {
    return this.block ? x.lex : x.lexInline;
  }
  provideParser() {
    return this.block ? y.parse : y.parseInline;
  }
}, it = class {
  defaults = V();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = y;
  Renderer = O;
  TextRenderer = K;
  Lexer = x;
  Tokenizer = D;
  Hooks = _;
  constructor(...n) {
    this.use(...n);
  }
  walkTokens(n, e) {
    let t = [];
    for (let i of n) switch (t = t.concat(e.call(this, i)), i.type) {
      case "table": {
        let s = i;
        for (let r of s.header) t = t.concat(this.walkTokens(r.tokens, e));
        for (let r of s.rows) for (let a of r) t = t.concat(this.walkTokens(a.tokens, e));
        break;
      }
      case "list": {
        let s = i;
        t = t.concat(this.walkTokens(s.items, e));
        break;
      }
      default: {
        let s = i;
        this.defaults.extensions?.childTokens?.[s.type] ? this.defaults.extensions.childTokens[s.type].forEach((r) => {
          let a = s[r].flat(1 / 0);
          t = t.concat(this.walkTokens(a, e));
        }) : s.tokens && (t = t.concat(this.walkTokens(s.tokens, e)));
      }
    }
    return t;
  }
  use(...n) {
    let e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return n.forEach((t) => {
      let i = { ...t };
      if (i.async = this.defaults.async || i.async || !1, t.extensions && (t.extensions.forEach((s) => {
        if (!s.name) throw new Error("extension name required");
        if ("renderer" in s) {
          let r = e.renderers[s.name];
          r ? e.renderers[s.name] = function(...a) {
            let l = s.renderer.apply(this, a);
            return l === !1 && (l = r.apply(this, a)), l;
          } : e.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let r = e[s.level];
          r ? r.unshift(s.tokenizer) : e[s.level] = [s.tokenizer], s.start && (s.level === "block" ? e.startBlock ? e.startBlock.push(s.start) : e.startBlock = [s.start] : s.level === "inline" && (e.startInline ? e.startInline.push(s.start) : e.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (e.childTokens[s.name] = s.childTokens);
      }), i.extensions = e), t.renderer) {
        let s = this.defaults.renderer || new O(this.defaults);
        for (let r in t.renderer) {
          if (!(r in s)) throw new Error(`renderer '${r}' does not exist`);
          if (["options", "parser"].includes(r)) continue;
          let a = r, l = t.renderer[a], o = s[a];
          s[a] = (...h) => {
            let c = l.apply(s, h);
            return c === !1 && (c = o.apply(s, h)), c || "";
          };
        }
        i.renderer = s;
      }
      if (t.tokenizer) {
        let s = this.defaults.tokenizer || new D(this.defaults);
        for (let r in t.tokenizer) {
          if (!(r in s)) throw new Error(`tokenizer '${r}' does not exist`);
          if (["options", "rules", "lexer"].includes(r)) continue;
          let a = r, l = t.tokenizer[a], o = s[a];
          s[a] = (...h) => {
            let c = l.apply(s, h);
            return c === !1 && (c = o.apply(s, h)), c;
          };
        }
        i.tokenizer = s;
      }
      if (t.hooks) {
        let s = this.defaults.hooks || new _();
        for (let r in t.hooks) {
          if (!(r in s)) throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r)) continue;
          let a = r, l = t.hooks[a], o = s[a];
          _.passThroughHooks.has(r) ? s[a] = (h) => {
            if (this.defaults.async && _.passThroughHooksRespectAsync.has(r)) return (async () => {
              let u = await l.call(s, h);
              return o.call(s, u);
            })();
            let c = l.call(s, h);
            return o.call(s, c);
          } : s[a] = (...h) => {
            if (this.defaults.async) return (async () => {
              let u = await l.apply(s, h);
              return u === !1 && (u = await o.apply(s, h)), u;
            })();
            let c = l.apply(s, h);
            return c === !1 && (c = o.apply(s, h)), c;
          };
        }
        i.hooks = s;
      }
      if (t.walkTokens) {
        let s = this.defaults.walkTokens, r = t.walkTokens;
        i.walkTokens = function(a) {
          let l = [];
          return l.push(r.call(this, a)), s && (l = l.concat(s.call(this, a))), l;
        };
      }
      this.defaults = { ...this.defaults, ...i };
    }), this;
  }
  setOptions(n) {
    return this.defaults = { ...this.defaults, ...n }, this;
  }
  lexer(n, e) {
    return x.lex(n, e ?? this.defaults);
  }
  parser(n, e) {
    return y.parse(n, e ?? this.defaults);
  }
  parseMarkdown(n) {
    return (e, t) => {
      let i = { ...t }, s = { ...this.defaults, ...i }, r = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === !0 && i.async === !1) return r(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof e > "u" || e === null) return r(new Error("marked(): input parameter is undefined or null"));
      if (typeof e != "string") return r(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected"));
      if (s.hooks && (s.hooks.options = s, s.hooks.block = n), s.async) return (async () => {
        let a = s.hooks ? await s.hooks.preprocess(e) : e, l = await (s.hooks ? await s.hooks.provideLexer() : n ? x.lex : x.lexInline)(a, s), o = s.hooks ? await s.hooks.processAllTokens(l) : l;
        s.walkTokens && await Promise.all(this.walkTokens(o, s.walkTokens));
        let h = await (s.hooks ? await s.hooks.provideParser() : n ? y.parse : y.parseInline)(o, s);
        return s.hooks ? await s.hooks.postprocess(h) : h;
      })().catch(r);
      try {
        s.hooks && (e = s.hooks.preprocess(e));
        let a = (s.hooks ? s.hooks.provideLexer() : n ? x.lex : x.lexInline)(e, s);
        s.hooks && (a = s.hooks.processAllTokens(a)), s.walkTokens && this.walkTokens(a, s.walkTokens);
        let l = (s.hooks ? s.hooks.provideParser() : n ? y.parse : y.parseInline)(a, s);
        return s.hooks && (l = s.hooks.postprocess(l)), l;
      } catch (a) {
        return r(a);
      }
    };
  }
  onError(n, e) {
    return (t) => {
      if (t.message += `
Please report this to https://github.com/markedjs/marked.`, n) {
        let i = "<p>An error occurred:</p><pre>" + T(t.message + "", !0) + "</pre>";
        return e ? Promise.resolve(i) : i;
      }
      if (e) return Promise.reject(t);
      throw t;
    };
  }
}, $ = new it();
function g(n, e) {
  return $.parse(n, e);
}
g.options = g.setOptions = function(n) {
  return $.setOptions(n), g.defaults = $.defaults, le(g.defaults), g;
};
g.getDefaults = V;
g.defaults = R;
g.use = function(...n) {
  return $.use(...n), g.defaults = $.defaults, le(g.defaults), g;
};
g.walkTokens = function(n, e) {
  return $.walkTokens(n, e);
};
g.parseInline = $.parseInline;
g.Parser = y;
g.parser = y.parse;
g.Renderer = O;
g.TextRenderer = K;
g.Lexer = x;
g.lexer = x.lex;
g.Tokenizer = D;
g.Hooks = _;
g.parse = g;
g.options;
g.setOptions;
g.use;
g.walkTokens;
g.parseInline;
y.parse;
x.lex;
class Et {
  service;
  config;
  container;
  widgetState = "minimized";
  inputValue = "";
  unsubscribe;
  root;
  theme;
  constructor(e, t) {
    this.config = {
      title: "Chat",
      placeholder: "Type a message...",
      mode: "floating",
      ...e
    }, this.theme = t, this.container = e.container || this.createDefaultContainer(), this.syncContainerClasses();
    const i = {
      ...e,
      initialLanguage: e.lang || e.initialLanguage
    };
    this.service = new ye(i, (r) => {
      e.debug && console.log("[ChatWidget] Event:", r);
    });
    const s = this.service.store.getState().messages.length > 0;
    this.widgetState = this.config.mode === "inline" || s ? "full" : "minimized", this.unsubscribe = this.service.store.subscribe(() => {
      this.render();
    }), this.render(), e.autoConnect !== !1 && this.service.connect().catch((r) => {
      console.error("[ChatWidget] Auto-connect failed:", r);
    });
  }
  /**
   * Create default container element
   */
  createDefaultContainer() {
    const e = document.createElement("div");
    return e.className = "assistant-widget-container", document.body.appendChild(e), e;
  }
  syncContainerClasses() {
    const e = this.config.mode || "floating";
    this.container.classList.remove(
      "assistant-widget-container-floating",
      "assistant-widget-container-inline",
      "assistant-widget-container-bottom",
      "assistant-widget-container-top",
      "assistant-widget-container-left",
      "assistant-widget-container-right"
    ), this.container.classList.add(`assistant-widget-container-${e}`), e !== "inline" && this.config.position && this.container.classList.add(`assistant-widget-container-${this.config.position}`);
  }
  /**
   * Render the widget
   */
  render() {
    const e = this.service.store.getState(), t = this.inputValue.trim().length > 0, i = this.theme.render(this.widgetState, e, t);
    if (!this.root) {
      this.root = document.createElement("div"), this.container.appendChild(this.root);
      const s = this.theme.getCSSPath?.();
      s && this.injectCSS(s);
    }
    this.root.className = `assistant-widget ${this.theme.getClassName()} assistant-widget-${this.widgetState} assistant-widget-mode-${this.config.mode || "floating"}`, this.root.innerHTML = i, this.attachEventListeners(), this.scrollToBottom();
  }
  /**
   * Inject theme CSS
   */
  injectCSS(e) {
    const t = document.createElement("link");
    t.rel = "stylesheet", t.href = e, document.head.appendChild(t);
  }
  /**
   * Attach event listeners to rendered DOM
   */
  attachEventListeners() {
    if (!this.root) return;
    const e = this.root.querySelector(".chat-header");
    e && e.addEventListener("click", (h) => {
      this.config.mode === "inline" || h.target.closest(".chat-header-button") || this.handleHeaderClick();
    });
    const t = this.root.querySelector('[data-action="close"]');
    t && t.addEventListener("click", (h) => {
      h.stopPropagation(), this.handleClose();
    });
    const i = this.root.querySelector(".chat-input");
    i && (i.value = this.inputValue, i.addEventListener("input", (h) => {
      const c = h.target, u = c.value, p = this.inputValue.trim().length === 0, f = u.trim().length === 0;
      if (this.inputValue = u, this.autoResizeTextarea(i), p !== f) {
        const k = c.selectionStart, b = c.selectionEnd;
        this.render();
        const S = this.root?.querySelector(".chat-input");
        S && (S.focus(), S.setSelectionRange(k, b), S.value = this.inputValue);
      }
    }), i.addEventListener("keydown", (h) => {
      h.key === "Enter" && !h.shiftKey && (h.preventDefault(), this.handleSendMessage());
    }), this.autoResizeTextarea(i));
    const s = this.root.querySelector('[data-action="primary"]');
    s && s.addEventListener("click", () => {
      this.handlePrimaryAction();
    }), this.root.querySelectorAll('[data-action="suggestion"]').forEach((h) => {
      h.addEventListener("click", () => {
        const c = h.getAttribute("data-suggestion");
        c && (this.inputValue = c, this.handleSendMessage());
      });
    }), this.root.querySelectorAll('[data-action="copy"]').forEach((h) => {
      h.addEventListener("click", () => {
        const c = h.getAttribute("data-content");
        c && this.handleCopyMessage(c, h);
      });
    }), this.root.querySelectorAll('[data-action="like"]').forEach((h) => {
      h.addEventListener("click", () => {
        let c = h.getAttribute("data-run-id");
        console.log("[ChatWidget] Like button clicked. Attribute run-id:", c, "Fallback lastRunId:", this.service.lastRunId), c || (c = this.service.lastRunId || ""), c ? this.handleRateMessage(c, "like") : console.warn("[ChatWidget] Like clicked but no runId is available (both attribute and fallback are empty).");
      });
    }), this.root.querySelectorAll('[data-action="dislike"]').forEach((h) => {
      h.addEventListener("click", () => {
        let c = h.getAttribute("data-run-id");
        console.log("[ChatWidget] Dislike button clicked. Attribute run-id:", c, "Fallback lastRunId:", this.service.lastRunId), c || (c = this.service.lastRunId || ""), c ? this.handleRateMessage(c, "dislike") : console.warn("[ChatWidget] Dislike clicked but no runId is available (both attribute and fallback are empty).");
      });
    }), i && this.autoResizeTextarea(i);
  }
  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea(e) {
    e.style.height = "auto", e.style.height = `${Math.min(e.scrollHeight, 120)}px`;
  }
  /**
   * Scroll messages to bottom
   */
  scrollToBottom() {
    if (!this.root) return;
    const e = this.root.querySelector(".chat-messages");
    e && (e.scrollTop = e.scrollHeight);
  }
  /**
   * Handle header click
   */
  handleHeaderClick() {
    if (this.widgetState === "minimized") {
      const e = this.service.store.getState().messages.length > 0;
      this.setWidgetState(e ? "full" : "input-only");
    } else
      this.setWidgetState("minimized");
  }
  /**
   * Handle primary action (send)
   */
  async handlePrimaryAction() {
    this.inputValue.trim() && await this.handleSendMessage();
  }
  /**
   * Handle send message
   */
  async handleSendMessage() {
    const e = this.inputValue;
    if (e.trim()) {
      this.inputValue = "", this.widgetState !== "full" ? this.setWidgetState("full") : this.render();
      try {
        await this.service.sendMessage(e);
      } catch (t) {
        console.error("[ChatWidget] Failed to send message:", t);
      }
    }
  }
  handleCopyMessage(e, t) {
    navigator.clipboard.writeText(e).then(() => {
      t && (t.classList.add("copied"), setTimeout(() => {
        t.classList.remove("copied");
      }, 800));
    }).catch((i) => {
      console.error("[ChatWidget] Failed to copy:", i);
    });
  }
  async handleRateMessage(e, t) {
    const i = this.service.store.getState().messages;
    let s = t;
    for (const r of i)
      if (r.metadata?.run_id === e) {
        r.metadata?.rating === t && (s = "");
        break;
      }
    try {
      await this.service.sendFeedback(e, s);
      for (const r of i)
        if (r.metadata?.run_id === e) {
          this.service.store.updateMessageDetails(r.id, {
            metadata: { ...r.metadata, rating: s }
          });
          break;
        }
    } catch (r) {
      console.error("[ChatWidget] Failed to send feedback:", r);
    }
  }
  /**
   * Handle close (cross button)
   * Clears messages and effectively transitions to input-only
   */
  handleClose() {
    this.service.clearMessages(), this.setWidgetState(this.config.mode === "inline" ? "full" : "input-only");
  }
  /**
   * Set widget state
   */
  setWidgetState(e) {
    this.widgetState = e, this.render();
  }
  /**
   * Get widget state
   */
  getWidgetState() {
    return this.widgetState;
  }
  /**
   * Get chat service instance
   */
  getService() {
    return this.service;
  }
  /**
   * Destroy widget and cleanup
   */
  destroy() {
    this.unsubscribe && this.unsubscribe(), this.service.disconnect(), this.root && this.root.remove(), this.container.classList.remove(
      `assistant-widget-container-${this.config.mode || "floating"}`,
      "assistant-widget-container-floating",
      "assistant-widget-container-inline",
      "assistant-widget-container-bottom",
      "assistant-widget-container-top",
      "assistant-widget-container-left",
      "assistant-widget-container-right"
    );
  }
  /**
   * Update widget configuration dynamically
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e }, this.syncContainerClasses(), e.mode === "inline" && (this.widgetState = "full"), e.lang && (this.service.setLanguage(e.lang), "setLanguage" in this.theme && this.theme.setLanguage(e.lang)), "updateConfig" in this.theme && this.theme.updateConfig(e), this.render();
  }
  /**
   * Render markdown content
   */
  renderMarkdown(e) {
    try {
      return g.parse(e, { async: !1 });
    } catch {
      return e;
    }
  }
}
const oe = {
  en: {
    connecting: "Connecting...",
    clearChat: "Clear Chat"
  },
  ru: {
    connecting: "Подключение...",
    clearChat: "Очистить чат"
  }
};
function rt(n, e, t, i) {
  const { messages: s, isConnecting: r, isTyping: a, error: l } = e, o = t.lang || "en", h = oe[o] || oe.en, c = at(s), u = t.position === "top" ? ft() : t.position === "left" ? mt() : t.position === "right" ? kt() : gt();
  let p = "";
  const f = t.suggestions;
  return f && f.length > 0 && s.length <= 1 && (p = `<div class="chat-suggestions">${f.map(
    (b) => `<button class="chat-suggestion-chip" data-action="suggestion" data-suggestion="${C(b)}">${C(b)}</button>`
  ).join("")}</div>`), `<div class="assistant-widget-content"><div class="chat-header" ${n === "minimized" ? 'data-clickable="expand"' : 'data-clickable="minimize"'}><div class="chat-header-group"><span class="chat-header-title">${t.title}</span></div><div class="chat-header-actions">${t.mode !== "inline" ? `<div class="chat-header-icon-arrow">${u}</div>` : ""}${t.showClose && n === "full" ? `<button class="chat-header-button action-close" data-action="close" aria-label="${h.clearChat}">${dt()}</button>` : ""}</div></div><div class="chat-messages">${l ? `<div class="chat-error">${C(l)}</div>` : ""}${c.map((b, S) => ot(b, a && S === c.length - 1)).join("")}${p}</div><div class="chat-input-container"><textarea class="chat-input" placeholder="${r ? h.connecting : t.placeholder}" ${r ? "disabled" : ""} rows="1"></textarea><button class="chat-input-button" data-action="primary" ${r || !i ? "disabled" : ""}>${ct()}</button></div></div>`;
}
function at(n) {
  const e = [];
  for (const t of n) {
    if (t.type === "status") {
      const i = e[e.length - 1];
      if (i && i.main.role === t.role && i.main.type !== "status") {
        i.status = t;
        continue;
      }
    }
    e.push({ main: t });
  }
  return e;
}
function ot(n, e) {
  const t = n.main, i = t.type === "status", s = i ? t : n.status, r = t.role === "user", a = t.type === "error";
  let l = "";
  if (!i) {
    let c = r ? C(t.content) : lt(t.content);
    e && !r && (c += '<span class="typing-cursor"></span>'), l = `<div class="chat-message-bubble ${r ? "chat-message-bubble-user" : a ? "chat-message-bubble-error" : "chat-message-bubble-assistant"}">${r ? `<p>${c}</p>` : `<div class="markdown-content">${c}</div>`}</div>`;
  }
  let o = "";
  s && (o = `<div class="chat-message-status ${i ? "chat-status-standalone" : ""}"><div class="loader-box"><div class="loader"></div></div><div class="chat-status-text">${C(s.content)}</div></div>`);
  const h = !r && !a && !i ? `<div class="chat-message-actions"><button class="chat-message-action" data-action="copy" data-content="${C(t.content)}">${ht()}</button><button class="chat-message-action${t.metadata?.rating === "like" ? " active" : ""}" data-action="like" data-run-id="${t.metadata?.run_id ?? ""}">${ut()}</button><button class="chat-message-action${t.metadata?.rating === "dislike" ? " active" : ""}" data-action="dislike" data-run-id="${t.metadata?.run_id ?? ""}">${pt()}</button></div>` : "";
  return `<div class="chat-message ${r ? "chat-message-user" : "chat-message-assistant"}">${l}${o}${h}</div>`;
}
function lt(n) {
  if (!n) return "";
  try {
    return g.parse(n, { async: !1 });
  } catch (e) {
    return console.error("Error parsing markdown:", e), n;
  }
}
function C(n) {
  const e = document.createElement("div");
  return e.textContent = n, e.innerHTML;
}
const ct = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>', ht = () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>', ut = () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>', pt = () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>', dt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>', gt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>', ft = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>', kt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>', mt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>', bt = {
  brown: {
    primary: "#814133",
    accentIcon: "#BA7263",
    glass: "rgba(255, 255, 255, 0.1)"
  },
  dark: {
    primary: "#333333",
    accentIcon: "#999999",
    glass: "rgba(255, 255, 255, 0.05)"
  },
  light: {
    primary: "#f8f9fa",
    accentIcon: "#71717a",
    glass: "rgba(0, 0, 0, 0.06)"
  },
  yellow: {
    primary: "#FFB300",
    accentIcon: "#FFCA28",
    glass: "rgba(255, 255, 255, 0.25)"
  },
  red: {
    primary: "#FF5252",
    accentIcon: "#FF8A80",
    glass: "rgba(255, 255, 255, 0.2)"
  },
  green: {
    primary: "#43A047",
    accentIcon: "#66BB6A",
    glass: "rgba(255, 255, 255, 0.2)"
  },
  blue: {
    primary: "#1E88E5",
    accentIcon: "#42A5F5",
    glass: "rgba(255, 255, 255, 0.2)"
  },
  purple: {
    primary: "#6366f1",
    accentIcon: "#8b5cf6",
    glass: "rgba(255, 255, 255, 0.15)"
  },
  custom: {}
};
class At {
  config;
  customColors;
  constructor(e = {}) {
    this.updateConfig(e);
  }
  updateConfig(e) {
    const t = e.lang || this.config?.lang || "en", i = {
      en: {
        title: "Chat",
        placeholder: "Type a message..."
      },
      ru: {
        title: "Чат",
        placeholder: "Введите сообщение..."
      }
    }, s = i[t] || i.en, r = e.mode || this.config?.mode || "floating";
    this.config = {
      title: e.title || s.title,
      placeholder: e.placeholder || s.placeholder,
      showClose: e.showClose !== !1,
      variant: e.variant || this.config?.variant || "brown",
      customColors: e.customColors || this.config?.customColors || {},
      lang: t,
      mode: r,
      position: r === "inline" ? "bottom" : e.position || this.config?.position || "bottom",
      suggestions: e.suggestions || this.config?.suggestions || []
    }, this.customColors = this.config.customColors;
  }
  setLanguage(e) {
    this.updateConfig({ lang: e });
  }
  render(e, t, i) {
    const s = this.config.variant, r = bt[s] || {}, a = s === "custom" ? { ...r, ...this.customColors } : { ...r };
    return `<style>
         .theme-default.theme-variant-${s} {
           ${Object.entries(this.mapColorsToVars(a)).map(([o, h]) => `${o}: ${h};`).join(`
`)}
           ${a.background ? `background: ${a.background} !important;` : ""}
         }
         </style>` + rt(e, t, this.config, i);
  }
  getClassName() {
    return `theme-default theme-variant-${this.config.variant}`;
  }
  getCSSPath() {
  }
  mapColorsToVars(e) {
    const t = {};
    e.primary && (t["--theme-primary"] = e.primary), e.background && (t["--theme-background"] = e.background), e.foreground && (t["--theme-foreground"] = e.foreground), e.muted && (t["--theme-muted"] = e.muted), e.border && (t["--theme-border"] = e.border), e.accentIcon && (t["--theme-accent-icon"] = e.accentIcon), e.overlay && (t["--theme-overlay"] = e.overlay), e.glass && (t["--theme-glass"] = e.glass), e.textLight && (t["--theme-text-light"] = e.textLight), e.textMuted && (t["--theme-text-muted"] = e.textMuted);
    const i = e.background || e.primary;
    if (i) {
      const s = wt(i);
      console.log("[Theme] baseColor:", i, "isLightColor:", s), e.textLight || (t["--theme-text-light"] = s ? "#101010" : "#ffffff"), e.textMuted || (t["--theme-text-muted"] = s ? "rgba(16, 16, 16, 0.7)" : "rgba(255, 255, 255, 0.7)"), e.accentIcon || (t["--theme-accent-icon"] = s ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"), e.glass || (t["--theme-glass"] = s ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)"), e.border || (t["--theme-border"] = s ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)");
    }
    return t;
  }
}
function wt(n) {
  if (!n) return !1;
  n = n.trim().toLowerCase();
  let e = 0, t = 0, i = 0;
  if (n.startsWith("#")) {
    const u = n.substring(1);
    u.length === 3 ? (e = parseInt(u[0] + u[0], 16), t = parseInt(u[1] + u[1], 16), i = parseInt(u[2] + u[2], 16)) : (u.length === 6 || u.length === 8) && (e = parseInt(u.substring(0, 2), 16), t = parseInt(u.substring(2, 4), 16), i = parseInt(u.substring(4, 6), 16));
  } else if (n.startsWith("rgb")) {
    const u = n.match(/\d+/g);
    u && u.length >= 3 && (e = parseInt(u[0], 10), t = parseInt(u[1], 10), i = parseInt(u[2], 10));
  } else {
    const u = {
      white: [255, 255, 255],
      yellow: [255, 255, 0],
      lightgray: [211, 211, 211],
      lightgrey: [211, 211, 211],
      silver: [192, 192, 192],
      gray: [128, 128, 128],
      grey: [128, 128, 128],
      black: [0, 0, 0]
    };
    u[n] && ([e, t, i] = u[n]);
  }
  const s = e / 255, r = t / 255, a = i / 255, l = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4), o = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4), h = a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4);
  return 0.2126 * l + 0.7152 * o + 0.0722 * h > 0.5;
}
export {
  ye as C,
  At as D,
  m as W,
  xe as a,
  Et as b,
  Tt as c,
  yt as d,
  $t as e,
  xt as f,
  v as g,
  Ct as h,
  vt as i,
  St as s,
  Rt as t
};
//# sourceMappingURL=index-DW4odXKb.js.map
