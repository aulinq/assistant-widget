class ye {
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
      suggestions: void 0,
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
        (n) => n.id === e ? { ...n, content: t } : n
      )
    });
  }
  updateMessageDetails(e, t) {
    this.setState({
      messages: this.state.messages.map(
        (n) => n.id === e ? { ...n, ...t } : n
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
  setSuggestions(e) {
    this.setState({ suggestions: e });
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
      error: null,
      suggestions: void 0
    });
  }
}
function v() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function yt(i) {
  const e = new Date(i), t = e.getHours().toString().padStart(2, "0"), n = e.getMinutes().toString().padStart(2, "0");
  return `${t}:${n}`;
}
function xt(i, e) {
  let t = null;
  return function(...s) {
    const r = () => {
      t = null, i(...s);
    };
    t && clearTimeout(t), t = setTimeout(r, e);
  };
}
function vt(i) {
  const e = document.createElement("div");
  return e.textContent = i, e.innerHTML;
}
function Tt(i) {
  try {
    return JSON.parse(i), !0;
  } catch {
    return !1;
  }
}
function Ct(i) {
  return JSON.parse(JSON.stringify(i));
}
function Rt(i) {
  return i == null ? !0 : typeof i == "string" ? i.trim().length === 0 : Array.isArray(i) ? i.length === 0 : typeof i == "object" ? Object.keys(i).length === 0 : !1;
}
function _t(i, e) {
  return i.length <= e ? i : i.slice(0, e - 3) + "...";
}
function $t(i, e) {
  try {
    return JSON.parse(i);
  } catch {
    return e;
  }
}
var f = /* @__PURE__ */ ((i) => (i.INPUT_TEXT = "input.text", i.INPUT_AUDIO = "input.audio", i.INPUT_END = "input.end", i.STREAM_LLM = "stream.llm", i.STREAM_STT = "stream.stt", i.RESPONSE_START = "response.start", i.RESPONSE_AUDIO_START = "response.audio_start", i.RESPONSE_AUDIO_END = "response.audio_end", i.RESPONSE_END = "response.end", i.CONTROL_CONFIG = "control.config", i.ERROR = "error", i.STATUS = "status", i.AUDIO = "audio", i.SERVICE_MESSAGE = "service.message", i.DELTA = "delta", i.THOUGHT = "thought", i.DONE = "done", i.TOOL_CALL = "tool_call", i.TOOL_RES = "tool_res", i.TOOL_START = "tool.start", i.TOOL_END = "tool.end", i.TYPING = "typing", i.UI_SUGGESTIONS = "ui.suggestions", i))(f || {});
const U = {
  en: {
    thinking: "Thinking...",
    thinking_deeper: "Thinking it through...",
    rag_search: "Checking the knowledge base...",
    rag_found: "Reviewing the relevant details...",
    rag_empty: "Checking what I know...",
    tool_start: "Working with tools...",
    tool_end: "Finishing up..."
  },
  es: {
    thinking: "Pensando...",
    thinking_deeper: "Dandole una vuelta mas...",
    rag_search: "Consultando la base de conocimiento...",
    rag_found: "Revisando los detalles relevantes...",
    rag_empty: "Revisando lo que se...",
    tool_start: "Usando herramientas...",
    tool_end: "Terminando..."
  },
  ru: {
    thinking: "Думаю...",
    thinking_deeper: "Обдумываю глубже...",
    rag_search: "Проверяю базу знаний...",
    rag_found: "Изучаю найденные детали...",
    rag_empty: "Сверяюсь с тем, что уже знаю...",
    tool_start: "Работаю с инструментами...",
    tool_end: "Завершаю..."
  },
  pt: {
    thinking: "Pensando...",
    thinking_deeper: "Pensando melhor...",
    rag_search: "Consultando a base de conhecimento...",
    rag_found: "Revisando os detalhes relevantes...",
    rag_empty: "Verificando o que eu sei...",
    tool_start: "Usando ferramentas...",
    tool_end: "Finalizando..."
  },
  fr: {
    thinking: "Je reflechis...",
    thinking_deeper: "Je creuse un peu plus...",
    rag_search: "Je consulte la base de connaissances...",
    rag_found: "Je relis les details utiles...",
    rag_empty: "Je verifie ce que je sais...",
    tool_start: "J utilise les outils...",
    tool_end: "Je termine..."
  },
  de: {
    thinking: "Ich denke nach...",
    thinking_deeper: "Ich denke genauer darueber nach...",
    rag_search: "Ich pruefe die Wissensbasis...",
    rag_found: "Ich lese die relevanten Details...",
    rag_empty: "Ich pruefe, was ich weiss...",
    tool_start: "Ich nutze Werkzeuge...",
    tool_end: "Ich schliesse ab..."
  },
  it: {
    thinking: "Sto pensando...",
    thinking_deeper: "Ci sto ragionando meglio...",
    rag_search: "Controllo la base di conoscenza...",
    rag_found: "Rivedo i dettagli rilevanti...",
    rag_empty: "Controllo quello che so...",
    tool_start: "Uso gli strumenti...",
    tool_end: "Sto finendo..."
  }
};
class xe {
  ws = null;
  config;
  sessionId;
  eventHandler;
  reconnectTimeout = null;
  currentMessageId = null;
  session = null;
  connectionPromise = null;
  activeStreamAbort = null;
  slowThinkingTimeout = null;
  statusClearTimeout = null;
  statusTransitionTimeout = null;
  storageKey;
  minActivityStatusVisibleMs = 1400;
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
    }, this.storageKey = this.config.storageKey || e.siteToken, console.log("[ChatService] Initializing with siteToken:", e.siteToken, "config:", e);
    let n = null, s = [], r = null;
    if (typeof window < "u" && window.localStorage)
      try {
        const l = localStorage.getItem(this.storagePath("chat_last_activity")), o = 900 * 1e3;
        if (l && Date.now() - parseInt(l, 10) > o)
          console.log("[ChatService] Chat session expired due to inactivity. Wiping localStorage."), localStorage.removeItem(this.storagePath("chat_history")), localStorage.removeItem(this.storagePath("chat_session")), localStorage.removeItem(this.storagePath("chat_session_data")), localStorage.removeItem(this.storagePath("chat_last_activity"));
        else {
          n = localStorage.getItem(this.storagePath("chat_session"));
          const h = localStorage.getItem(this.storagePath("chat_history"));
          h && (s = JSON.parse(h));
          const u = localStorage.getItem(this.storagePath("chat_session_data"));
          if (u) {
            const g = JSON.parse(u);
            (typeof g.expiresAt == "number" ? g.expiresAt : g.expiresAt ? new Date(g.expiresAt).getTime() : 0) > Date.now() + 300 * 1e3 ? (r = g, n = g.sessionId, console.log("[ChatService] Found valid cached chat session token in localStorage. Will bypass handshake.")) : (console.log("[ChatService] Cached chat session token is expired or close to expiry. Will perform handshake."), localStorage.removeItem(this.storagePath("chat_session_data")));
          }
        }
      } catch (l) {
        console.error("Failed to load chat session/history from localStorage:", l);
      }
    if (this.sessionId = e.sessionId || n || v(), r && (this.session = r), typeof window < "u" && window.localStorage && this.sessionId)
      try {
        localStorage.setItem(this.storagePath("chat_session"), this.sessionId);
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
    ]), this.store = new ye({ messages: a }), this.store.subscribe((l) => {
      if (typeof window < "u" && window.localStorage)
        try {
          const o = l.messages.filter((c) => c.type !== "status");
          console.log("[ChatService] Saving messages to localStorage under key:", this.storagePath("chat_history"), "messages:", o), localStorage.setItem(this.storagePath("chat_history"), JSON.stringify(o)), localStorage.setItem(this.storagePath("chat_last_activity"), Date.now().toString());
        } catch (o) {
          console.error("Failed to persist chat history to localStorage:", o);
        }
    });
  }
  storagePath(e) {
    return `aulinq:${e}:${this.storageKey}`;
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
        this.session?.token || (this.session = await this.authenticate()), this.sessionId = this.session.sessionId, typeof window < "u" && window.localStorage && localStorage.setItem(this.storagePath("chat_session"), this.sessionId), this.store.setConnected(!0), this.emit({ type: "connected" });
      } catch (e) {
        const t = e instanceof Error ? e.message : "Connection failed";
        throw this.handleConnectionError(t), e;
      } finally {
        this.connectionPromise = null;
      }
    })(), this.connectionPromise);
  }
  disconnect() {
    this.reconnectTimeout && (clearTimeout(this.reconnectTimeout), this.reconnectTimeout = null), this.activeStreamAbort && (this.activeStreamAbort.abort(), this.activeStreamAbort = null), this.clearSlowThinkingTimer(), this.clearStatusClearTimer(), this.clearStatusTransitionTimer(), this.ws && (this.ws.close(1e3, "Client disconnect"), this.ws = null), this.store.setConnected(!1), this.emit({ type: "disconnected" });
  }
  async sendMessage(e) {
    const t = e.trim();
    if (!t) return;
    if ((!this.store.getState().isConnected || !this.session?.token) && await this.connect(), !this.session?.token)
      throw new Error("Chat session is not connected");
    const n = {
      id: v(),
      role: "user",
      content: t,
      timestamp: Date.now(),
      type: "text"
    };
    this.store.setError(null), this.store.removeStatusMessages(), this.store.setSuggestions([]), this.store.addMessage(n), this.handleResponseStart();
    const s = {
      token: this.session.token,
      user_text: t,
      session_key: this.session.sessionId
    };
    (this.config.transport || "sse") === "ws" ? await this.sendViaWebSocket(s) : await this.sendViaSSE(s);
  }
  clearMessages() {
    if (this.clearStatusTransitionTimer(), this.clearStatusClearTimer(), this.store.clearMessages(), this.config.welcomeMessage && this.store.addMessage({
      id: "welcome",
      role: "assistant",
      content: this.config.welcomeMessage,
      timestamp: Date.now(),
      type: "text"
    }), typeof window < "u" && window.localStorage)
      try {
        localStorage.removeItem(this.storagePath("chat_history")), localStorage.removeItem(this.storagePath("chat_session_data")), localStorage.removeItem(this.storagePath("chat_last_activity")), this.sessionId = v(), this.session = null, localStorage.setItem(this.storagePath("chat_session"), this.sessionId);
      } catch (e) {
        console.error("Failed to clear chat session/history from localStorage:", e);
      }
  }
  async sendControl(e) {
    this.log("Ignoring control message for text runtime:", e);
  }
  async sendFeedback(e, t, n) {
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
          comment: n || "",
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
      const n = window.__aulinq_pending_handshakes || {};
      if (window.__aulinq_pending_handshakes = n, n[e])
        return this.log("Reusing pending handshake request for siteToken:", e), n[e];
    }
    const t = (async () => {
      const n = this.resolveIdentityBaseUrl(), s = new URL(`${n}/v1/chat/handshake`);
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
      const n = window.__aulinq_pending_handshakes;
      n[e] = t, t.finally(() => {
        delete n[e];
      });
    }
    return t;
  }
  async sendViaSSE(e) {
    const t = this.resolveRuntimeUrl("sse"), n = new AbortController();
    this.activeStreamAbort = n, this.store.setTyping(!0), this.emit({ type: "typing-start" });
    try {
      const s = await fetch(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body: JSON.stringify(e),
        signal: n.signal
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
        type: f.ERROR,
        content: r,
        timestamp: Date.now()
      }), s;
    } finally {
      this.activeStreamAbort === n && (this.activeStreamAbort = null), this.handleResponseEnd();
    }
  }
  async readSSEStream(e) {
    const t = e.getReader(), n = new TextDecoder();
    let s = "";
    for (; ; ) {
      const { value: r, done: a } = await t.read();
      if (a) break;
      s += n.decode(r, { stream: !0 });
      const l = s.split(/\r?\n\r?\n/);
      s = l.pop() || "";
      for (const o of l)
        this.handleSSEEvent(o);
    }
    s += n.decode(), s.trim() && this.handleSSEEvent(s);
  }
  handleSSEEvent(e) {
    const t = e.split(/\r?\n/).filter((s) => s.startsWith("data:")).map((s) => s.replace(/^data:\s?/, ""));
    if (t.length === 0) return;
    const n = t.join(`
`).trim();
    if (console.log("[ChatService] Raw SSE event received:", n), !n || n === "[DONE]") {
      this.handleResponseEnd();
      return;
    }
    try {
      const s = JSON.parse(n);
      console.log("[ChatService] Parsed SSE event type:", s.type, "run_id:", s.run_id), this.handleRuntimeEvent(s);
    } catch (s) {
      this.log("Failed to parse SSE event:", s, n);
    }
  }
  async sendViaWebSocket(e) {
    const t = this.resolveRuntimeUrl("ws");
    this.store.setTyping(!0), this.emit({ type: "typing-start" }), await new Promise((n, s) => {
      let r = !1;
      const a = new WebSocket(t);
      this.ws = a;
      const l = (o) => {
        r || (r = !0, this.ws = null, this.handleResponseEnd(), o ? s(o) : n());
      };
      a.onopen = () => {
        this.log("Runtime WebSocket opened"), a.send(JSON.stringify(e));
      }, a.onmessage = async (o) => {
        try {
          const c = JSON.parse(o.data);
          if (c.type === f.ERROR && c.content && (c.content.includes("session expired") || c.content.includes("invalid token"))) {
            if (this.log("Session expired or invalid (WS). Wiping cached session and re-authenticating."), typeof window < "u" && window.localStorage)
              try {
                localStorage.removeItem(`aulinq:chat_session_data:${this.config.siteToken}`);
              } catch (g) {
                console.error(g);
              }
            this.session = null, a.close(1008, "Session expired"), l(), await this.connect();
            const u = this.session;
            u?.token && (e.token = u.token, await this.sendViaWebSocket(e));
            return;
          }
          this.handleRuntimeEvent(c), (c.type === f.DONE || c.type === f.ERROR) && (a.close(1e3, "Message complete"), l());
        } catch (c) {
          l(c instanceof Error ? c : new Error("Invalid runtime WebSocket message"));
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
      case f.STREAM_STT:
        this.handleSttMessage(e);
        break;
      case f.STREAM_LLM:
      case f.DELTA:
        this.handleLlmMessage(e);
        break;
      case f.THOUGHT:
        this.handleThoughtMessage(e);
        break;
      case f.TYPING:
      case f.STATUS:
        this.handleStatusMessage(e);
        break;
      case f.TOOL_CALL:
      case f.TOOL_RES:
      case f.TOOL_START:
      case f.TOOL_END:
        this.handleToolMessage(e);
        break;
      case f.UI_SUGGESTIONS:
        this.handleSuggestionsMessage(e);
        break;
      case f.DONE:
      case f.RESPONSE_END:
        if (!this.currentMessageId && e.content && this.handleLlmMessage({ ...e, type: f.STREAM_LLM }), e.run_id) {
          const t = this.store.getState().messages;
          for (let n = t.length - 1; n >= 0; n--) {
            const s = t[n];
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
      case f.ERROR:
        this.handleErrorMessage(e);
        break;
      case f.SERVICE_MESSAGE:
        this.handleServiceMessage(e);
        break;
      default:
        this.log("Unknown runtime event type:", e.type);
    }
  }
  handleSttMessage(e) {
    const t = e.payload?.text || "", n = !!e.payload?.is_final;
    if (!t.trim()) return;
    const s = this.store.getState().messages, r = s[s.length - 1];
    if (n && r && r.role === "user" && r.type === "text" && !r.metadata?.finalized) {
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
      metadata: { finalized: n }
    });
  }
  handleLlmMessage(e) {
    const t = e.payload?.delta || (e.type === f.DELTA ? e.content : "") || "", n = e.payload?.content || (e.type === f.DELTA ? "" : e.content) || "", s = t || n, r = e.run_id;
    if (!s && !this.currentMessageId) return;
    if (!this.currentMessageId) {
      this.clearSlowThinkingTimer(), this.deferActivityStatusClear();
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
      type: f.STATUS,
      payload: {
        status: "thinking",
        message: this.statusText("thinking"),
        target: "bot"
      },
      timestamp: Date.now()
    }), this.armSlowThinkingTimer();
  }
  handleResponseEnd() {
    this.clearSlowThinkingTimer(), this.store.getState().isTyping && (this.store.setTyping(!1), this.emit({ type: "typing-end" })), this.currentMessageId = null, this.deferActivityStatusClear();
  }
  handleErrorMessage(e) {
    const t = e.payload?.message || e.content || "An error occurred";
    this.clearSlowThinkingTimer(), this.clearStatusClearTimer(), this.store.removeStatusMessages(), this.handleResponseEnd(), this.store.addMessage({
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
    const n = this.store.getState().messages, s = n[n.length - 1], r = e.payload?.target || "bot", a = r === "user" ? "user" : "assistant", l = e.payload?.status || e.type;
    if (s && s.type === "status" && s.metadata?.target === r) {
      const o = () => {
        this.store.updateMessageDetails(s.id, {
          content: t,
          timestamp: Date.now(),
          metadata: {
            ...s.metadata,
            status: l,
            target: r,
            details: e.payload?.details || e.metadata
          }
        }), this.isActivityStatus(l) && !this.store.getState().isTyping && this.deferActivityStatusClear();
      }, c = this.activityStatusTransitionDelay(s, l, Date.now());
      this.clearStatusTransitionTimer(), c > 0 && s.metadata?.status !== l ? (this.clearStatusClearTimer(), this.statusTransitionTimeout = setTimeout(() => {
        this.statusTransitionTimeout = null, o();
      }, c)) : o();
      return;
    }
    this.store.addMessage({
      id: e.id || v(),
      role: a,
      content: t,
      timestamp: Date.now(),
      type: "status",
      metadata: {
        status: l,
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
    const t = this.statusKeyFromEvent(e), n = t ? this.statusText(t) : e.content || e.payload?.text || "";
    n && this.handleStatusMessage({
      type: f.STATUS,
      payload: {
        status: t || "thought",
        message: n,
        target: "bot",
        details: e.metadata
      },
      timestamp: Date.now()
    });
  }
  handleToolMessage(e) {
    const t = e.type === f.TOOL_RES || e.type === f.TOOL_END ? "tool_end" : "tool_start", n = this.statusText(t);
    this.handleStatusMessage({
      type: f.STATUS,
      payload: {
        status: t,
        message: n,
        target: "bot",
        details: e.metadata
      },
      timestamp: Date.now()
    });
  }
  armSlowThinkingTimer() {
    this.clearSlowThinkingTimer(), this.slowThinkingTimeout = setTimeout(() => {
      if (this.slowThinkingTimeout = null, this.currentMessageId) return;
      const t = [...this.store.getState().messages].reverse().find((n) => n.type === "status" && n.metadata?.target === "bot");
      !t || t.metadata?.status !== "thinking" || this.handleStatusMessage({
        type: f.STATUS,
        payload: {
          status: "thinking_deeper",
          message: this.statusText("thinking_deeper"),
          target: "bot"
        },
        timestamp: Date.now()
      });
    }, 6500);
  }
  clearSlowThinkingTimer() {
    this.slowThinkingTimeout && (clearTimeout(this.slowThinkingTimeout), this.slowThinkingTimeout = null);
  }
  activityStatusTransitionDelay(e, t, n) {
    if (!(e.metadata?.status === "rag_search" && (t === "rag_found" || t === "rag_empty")))
      return 0;
    const a = n - e.timestamp;
    return Math.max(0, this.minActivityStatusVisibleMs - a);
  }
  deferActivityStatusClear() {
    if (this.statusTransitionTimeout) return;
    const e = this.latestBotStatusMessage();
    if (!e || !this.isActivityStatus(e.metadata?.status)) {
      this.store.removeStatusMessages();
      return;
    }
    const t = Date.now() - e.timestamp, n = this.minActivityStatusVisibleMs - t;
    if (n <= 0) {
      this.store.removeStatusMessages();
      return;
    }
    this.clearStatusClearTimer(), this.statusClearTimeout = setTimeout(() => {
      this.statusClearTimeout = null, this.store.removeStatusMessages();
    }, n);
  }
  latestBotStatusMessage() {
    return [...this.store.getState().messages].reverse().find((e) => e.type === "status" && e.metadata?.target === "bot");
  }
  isActivityStatus(e) {
    return e === "rag_search" || e === "rag_found" || e === "rag_empty" || e === "tool_start" || e === "tool_end";
  }
  clearStatusClearTimer() {
    this.statusClearTimeout && (clearTimeout(this.statusClearTimeout), this.statusClearTimeout = null);
  }
  clearStatusTransitionTimer() {
    this.statusTransitionTimeout && (clearTimeout(this.statusTransitionTimeout), this.statusTransitionTimeout = null);
  }
  statusKeyFromEvent(e) {
    const t = e.metadata || {}, n = e.payload?.status || t.status || t.phase || e.content || "", s = String(n).toLowerCase();
    return s.includes("rag_empty") || s.includes("rag.no_sources") ? "rag_empty" : s.includes("rag_found") || s.includes("rag.found") || s.includes("relevant context") ? "rag_found" : s.includes("rag_search") || s.includes("rag.search") || s.includes("searching knowledge") ? "rag_search" : null;
  }
  statusText(e) {
    const t = this.statusLocale();
    return U[t]?.[e] || U.en[e];
  }
  statusLocale() {
    const t = (this.config.initialLanguage || "").toLowerCase().split(/[-_]/)[0];
    return t in U ? t : "en";
  }
  handleSuggestionsMessage(e) {
    const n = (Array.isArray(e.ui?.items) ? e.ui.items : []).map((s) => typeof s.send == "string" && s.send.trim() || typeof s.label == "string" && s.label.trim() || "").filter((s) => s.length > 0).slice(0, 4);
    this.store.setSuggestions(n);
  }
  handleConnectionError(e) {
    this.session = null, this.store.setConnected(!1), this.store.setError(e), this.emit({ type: "error", data: e });
  }
  resolveIdentityBaseUrl() {
    const e = this.config.identityUrl || this.config.serverUrl || "http://localhost:8100";
    return this.normalizeHttpBase(e).replace(/\/v1\/chat\/handshake\/?$/, "");
  }
  resolveRuntimeUrl(e) {
    const t = e === "ws" ? "ws://localhost:8890/v1/chat/ws" : "http://localhost:8890/v1/chat/stream", n = this.config.runtimeUrl || this.config.serverUrl || t, s = new URL(e === "ws" ? this.toWebSocketUrl(n) : this.toHttpUrl(n));
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
        const n = JSON.parse(t);
        if (n.error || n.message)
          return n.error || n.message || e.statusText || String(e.status);
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
function W() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var R = W();
function ce(i) {
  R = i;
}
var I = { exec: () => null };
function d(i, e = "") {
  let t = typeof i == "string" ? i : i.source, n = { replace: (s, r) => {
    let a = typeof r == "string" ? r : r.source;
    return a = a.replace(w.caret, "$1"), t = t.replace(s, a), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var ve = (() => {
  try {
    return !!new RegExp("(?<=1)(?<!1)");
  } catch {
    return !1;
  }
})(), w = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (i) => new RegExp(`^( {0,3}${i})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (i) => new RegExp(`^ {0,${Math.min(3, i - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (i) => new RegExp(`^ {0,${Math.min(3, i - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (i) => new RegExp(`^ {0,${Math.min(3, i - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (i) => new RegExp(`^ {0,${Math.min(3, i - 1)}}#`), htmlBeginRegex: (i) => new RegExp(`^ {0,${Math.min(3, i - 1)}}<(?:[a-z].*>|!--)`, "i") }, Te = /^(?:[ \t]*(?:\n|$))+/, Ce = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, P = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, _e = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, J = /(?:[*+-]|\d{1,9}[.)])/, he = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, ue = d(he).replace(/bull/g, J).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), $e = d(he).replace(/bull/g, J).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Z = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ee = /^[^\n]+/, G = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Ae = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", G).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Me = d(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, J).getRegex(), N = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Q = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Ie = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Q).replace("tag", N).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ge = d(Z).replace("hr", P).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex(), Pe = d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ge).getRegex(), K = { blockquote: Pe, code: Ce, def: Ae, fences: Re, heading: _e, hr: P, html: Ie, lheading: ue, list: Me, newline: Te, paragraph: ge, table: I, text: Ee }, se = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", P).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex(), Le = { ...K, lheading: $e, table: se, paragraph: d(Z).replace("hr", P).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", N).getRegex() }, ze = { ...K, html: d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Q).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: I, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: d(Z).replace("hr", P).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ue).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, Oe = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, De = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, de = /^( {2,}|\\)\n(?!\s*$)/, Be = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, F = /[\p{P}\p{S}]/u, X = /[\s\p{P}\p{S}]/u, pe = /[^\s\p{P}\p{S}]/u, Ne = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, X).getRegex(), fe = /(?!~)[\p{P}\p{S}]/u, Fe = /(?!~)[\s\p{P}\p{S}]/u, qe = /(?:[^\s\p{P}\p{S}]|~)/u, Ue = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", ve ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), me = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, He = d(me, "u").replace(/punct/g, F).getRegex(), Ve = d(me, "u").replace(/punct/g, fe).getRegex(), ke = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", je = d(ke, "gu").replace(/notPunctSpace/g, pe).replace(/punctSpace/g, X).replace(/punct/g, F).getRegex(), We = d(ke, "gu").replace(/notPunctSpace/g, qe).replace(/punctSpace/g, Fe).replace(/punct/g, fe).getRegex(), Je = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, pe).replace(/punctSpace/g, X).replace(/punct/g, F).getRegex(), Ze = d(/\\(punct)/, "gu").replace(/punct/g, F).getRegex(), Ge = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Qe = d(Q).replace("(?:-->|$)", "-->").getRegex(), Ke = d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Qe).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), O = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/, Xe = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", O).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), we = d(/^!?\[(label)\]\[(ref)\]/).replace("label", O).replace("ref", G).getRegex(), be = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", G).getRegex(), Ye = d("reflink|nolink(?!\\()", "g").replace("reflink", we).replace("nolink", be).getRegex(), ne = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, Y = { _backpedal: I, anyPunctuation: Ze, autolink: Ge, blockSkip: Ue, br: de, code: De, del: I, emStrongLDelim: He, emStrongRDelimAst: je, emStrongRDelimUnd: Je, escape: Oe, link: Xe, nolink: be, punctuation: Ne, reflink: we, reflinkSearch: Ye, tag: Ke, text: Be, url: I }, et = { ...Y, link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", O).getRegex(), reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", O).getRegex() }, H = { ...Y, emStrongRDelimAst: We, emStrongLDelim: Ve, url: d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ne).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: d(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ne).getRegex() }, tt = { ...H, br: d(de).replace("{2,}", "*").getRegex(), text: d(H.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, z = { normal: K, gfm: Le, pedantic: ze }, E = { normal: Y, gfm: H, breaks: tt, pedantic: et }, st = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, ie = (i) => st[i];
function T(i, e) {
  if (e) {
    if (w.escapeTest.test(i)) return i.replace(w.escapeReplace, ie);
  } else if (w.escapeTestNoEncode.test(i)) return i.replace(w.escapeReplaceNoEncode, ie);
  return i;
}
function re(i) {
  try {
    i = encodeURI(i).replace(w.percentDecode, "%");
  } catch {
    return null;
  }
  return i;
}
function ae(i, e) {
  let t = i.replace(w.findPipe, (r, a, l) => {
    let o = !1, c = a;
    for (; --c >= 0 && l[c] === "\\"; ) o = !o;
    return o ? "|" : " |";
  }), n = t.split(w.splitPipe), s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; s < n.length; s++) n[s] = n[s].trim().replace(w.slashPipe, "|");
  return n;
}
function A(i, e, t) {
  let n = i.length;
  if (n === 0) return "";
  let s = 0;
  for (; s < n && i.charAt(n - s - 1) === e; )
    s++;
  return i.slice(0, n - s);
}
function nt(i, e) {
  if (i.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < i.length; n++) if (i[n] === "\\") n++;
  else if (i[n] === e[0]) t++;
  else if (i[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function oe(i, e, t, n, s) {
  let r = e.href, a = e.title || null, l = i[1].replace(s.other.outputLinkReplace, "$1");
  n.state.inLink = !0;
  let o = { type: i[0].charAt(0) === "!" ? "image" : "link", raw: t, href: r, title: a, text: l, tokens: n.inlineTokens(l) };
  return n.state.inLink = !1, o;
}
function it(i, e, t) {
  let n = i.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let s = n[1];
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
  constructor(i) {
    this.options = i || R;
  }
  space(i) {
    let e = this.rules.block.newline.exec(i);
    if (e && e[0].length > 0) return { type: "space", raw: e[0] };
  }
  code(i) {
    let e = this.rules.block.code.exec(i);
    if (e) {
      let t = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: e[0], codeBlockStyle: "indented", text: this.options.pedantic ? t : A(t, `
`) };
    }
  }
  fences(i) {
    let e = this.rules.block.fences.exec(i);
    if (e) {
      let t = e[0], n = it(t, e[3] || "", this.rules);
      return { type: "code", raw: t, lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2], text: n };
    }
  }
  heading(i) {
    let e = this.rules.block.heading.exec(i);
    if (e) {
      let t = e[2].trim();
      if (this.rules.other.endingHash.test(t)) {
        let n = A(t, "#");
        (this.options.pedantic || !n || this.rules.other.endingSpaceChar.test(n)) && (t = n.trim());
      }
      return { type: "heading", raw: e[0], depth: e[1].length, text: t, tokens: this.lexer.inline(t) };
    }
  }
  hr(i) {
    let e = this.rules.block.hr.exec(i);
    if (e) return { type: "hr", raw: A(e[0], `
`) };
  }
  blockquote(i) {
    let e = this.rules.block.blockquote.exec(i);
    if (e) {
      let t = A(e[0], `
`).split(`
`), n = "", s = "", r = [];
      for (; t.length > 0; ) {
        let a = !1, l = [], o;
        for (o = 0; o < t.length; o++) if (this.rules.other.blockquoteStart.test(t[o])) l.push(t[o]), a = !0;
        else if (!a) l.push(t[o]);
        else break;
        t = t.slice(o);
        let c = l.join(`
`), h = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        n = n ? `${n}
${c}` : c, s = s ? `${s}
${h}` : h;
        let u = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(h, r, !0), this.lexer.state.top = u, t.length === 0) break;
        let g = r.at(-1);
        if (g?.type === "code") break;
        if (g?.type === "blockquote") {
          let k = g, m = k.raw + `
` + t.join(`
`), b = this.blockquote(m);
          r[r.length - 1] = b, n = n.substring(0, n.length - k.raw.length) + b.raw, s = s.substring(0, s.length - k.text.length) + b.text;
          break;
        } else if (g?.type === "list") {
          let k = g, m = k.raw + `
` + t.join(`
`), b = this.list(m);
          r[r.length - 1] = b, n = n.substring(0, n.length - g.raw.length) + b.raw, s = s.substring(0, s.length - k.raw.length) + b.raw, t = m.substring(r.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: n, tokens: r, text: s };
    }
  }
  list(i) {
    let e = this.rules.block.list.exec(i);
    if (e) {
      let t = e[1].trim(), n = t.length > 1, s = { type: "list", raw: "", ordered: n, start: n ? +t.slice(0, -1) : "", loose: !1, items: [] };
      t = n ? `\\d{1,9}\\${t.slice(-1)}` : `\\${t}`, this.options.pedantic && (t = n ? t : "[*+-]");
      let r = this.rules.other.listItemRegex(t), a = !1;
      for (; i; ) {
        let o = !1, c = "", h = "";
        if (!(e = r.exec(i)) || this.rules.block.hr.test(i)) break;
        c = e[0], i = i.substring(c.length);
        let u = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (b) => " ".repeat(3 * b.length)), g = i.split(`
`, 1)[0], k = !u.trim(), m = 0;
        if (this.options.pedantic ? (m = 2, h = u.trimStart()) : k ? m = e[1].length + 1 : (m = e[2].search(this.rules.other.nonSpaceChar), m = m > 4 ? 1 : m, h = u.slice(m), m += e[1].length), k && this.rules.other.blankLine.test(g) && (c += g + `
`, i = i.substring(g.length + 1), o = !0), !o) {
          let b = this.rules.other.nextBulletRegex(m), S = this.rules.other.hrRegex(m), L = this.rules.other.fencesBeginRegex(m), te = this.rules.other.headingBeginRegex(m), Se = this.rules.other.htmlBeginRegex(m);
          for (; i; ) {
            let q = i.split(`
`, 1)[0], $;
            if (g = q, this.options.pedantic ? (g = g.replace(this.rules.other.listReplaceNesting, "  "), $ = g) : $ = g.replace(this.rules.other.tabCharGlobal, "    "), L.test(g) || te.test(g) || Se.test(g) || b.test(g) || S.test(g)) break;
            if ($.search(this.rules.other.nonSpaceChar) >= m || !g.trim()) h += `
` + $.slice(m);
            else {
              if (k || u.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || L.test(u) || te.test(u) || S.test(u)) break;
              h += `
` + g;
            }
            !k && !g.trim() && (k = !0), c += q + `
`, i = i.substring(q.length + 1), u = $.slice(m);
          }
        }
        s.loose || (a ? s.loose = !0 : this.rules.other.doubleBlankLine.test(c) && (a = !0)), s.items.push({ type: "list_item", raw: c, task: !!this.options.gfm && this.rules.other.listIsTask.test(h), loose: !1, text: h, tokens: [] }), s.raw += c;
      }
      let l = s.items.at(-1);
      if (l) l.raw = l.raw.trimEnd(), l.text = l.text.trimEnd();
      else return;
      s.raw = s.raw.trimEnd();
      for (let o of s.items) {
        if (this.lexer.state.top = !1, o.tokens = this.lexer.blockTokens(o.text, []), o.task) {
          if (o.text = o.text.replace(this.rules.other.listReplaceTask, ""), o.tokens[0]?.type === "text" || o.tokens[0]?.type === "paragraph") {
            o.tokens[0].raw = o.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), o.tokens[0].text = o.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let h = this.lexer.inlineQueue.length - 1; h >= 0; h--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[h].src)) {
              this.lexer.inlineQueue[h].src = this.lexer.inlineQueue[h].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let c = this.rules.other.listTaskCheckbox.exec(o.raw);
          if (c) {
            let h = { type: "checkbox", raw: c[0] + " ", checked: c[0] !== "[ ]" };
            o.checked = h.checked, s.loose ? o.tokens[0] && ["paragraph", "text"].includes(o.tokens[0].type) && "tokens" in o.tokens[0] && o.tokens[0].tokens ? (o.tokens[0].raw = h.raw + o.tokens[0].raw, o.tokens[0].text = h.raw + o.tokens[0].text, o.tokens[0].tokens.unshift(h)) : o.tokens.unshift({ type: "paragraph", raw: h.raw, text: h.raw, tokens: [h] }) : o.tokens.unshift(h);
          }
        }
        if (!s.loose) {
          let c = o.tokens.filter((u) => u.type === "space"), h = c.length > 0 && c.some((u) => this.rules.other.anyLine.test(u.raw));
          s.loose = h;
        }
      }
      if (s.loose) for (let o of s.items) {
        o.loose = !0;
        for (let c of o.tokens) c.type === "text" && (c.type = "paragraph");
      }
      return s;
    }
  }
  html(i) {
    let e = this.rules.block.html.exec(i);
    if (e) return { type: "html", block: !0, raw: e[0], pre: e[1] === "pre" || e[1] === "script" || e[1] === "style", text: e[0] };
  }
  def(i) {
    let e = this.rules.block.def.exec(i);
    if (e) {
      let t = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return { type: "def", tag: t, raw: e[0], href: n, title: s };
    }
  }
  table(i) {
    let e = this.rules.block.table.exec(i);
    if (!e || !this.rules.other.tableDelimiter.test(e[2])) return;
    let t = ae(e[1]), n = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), s = e[3]?.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], r = { type: "table", raw: e[0], header: [], align: [], rows: [] };
    if (t.length === n.length) {
      for (let a of n) this.rules.other.tableAlignRight.test(a) ? r.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? r.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? r.align.push("left") : r.align.push(null);
      for (let a = 0; a < t.length; a++) r.header.push({ text: t[a], tokens: this.lexer.inline(t[a]), header: !0, align: r.align[a] });
      for (let a of s) r.rows.push(ae(a, r.header.length).map((l, o) => ({ text: l, tokens: this.lexer.inline(l), header: !1, align: r.align[o] })));
      return r;
    }
  }
  lheading(i) {
    let e = this.rules.block.lheading.exec(i);
    if (e) return { type: "heading", raw: e[0], depth: e[2].charAt(0) === "=" ? 1 : 2, text: e[1], tokens: this.lexer.inline(e[1]) };
  }
  paragraph(i) {
    let e = this.rules.block.paragraph.exec(i);
    if (e) {
      let t = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return { type: "paragraph", raw: e[0], text: t, tokens: this.lexer.inline(t) };
    }
  }
  text(i) {
    let e = this.rules.block.text.exec(i);
    if (e) return { type: "text", raw: e[0], text: e[0], tokens: this.lexer.inline(e[0]) };
  }
  escape(i) {
    let e = this.rules.inline.escape.exec(i);
    if (e) return { type: "escape", raw: e[0], text: e[1] };
  }
  tag(i) {
    let e = this.rules.inline.tag.exec(i);
    if (e) return !this.lexer.state.inLink && this.rules.other.startATag.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(e[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: e[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: e[0] };
  }
  link(i) {
    let e = this.rules.inline.link.exec(i);
    if (e) {
      let t = e[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(t)) {
        if (!this.rules.other.endAngleBracket.test(t)) return;
        let r = A(t.slice(0, -1), "\\");
        if ((t.length - r.length) % 2 === 0) return;
      } else {
        let r = nt(e[2], "()");
        if (r === -2) return;
        if (r > -1) {
          let a = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + r;
          e[2] = e[2].substring(0, r), e[0] = e[0].substring(0, a).trim(), e[3] = "";
        }
      }
      let n = e[2], s = "";
      if (this.options.pedantic) {
        let r = this.rules.other.pedanticHrefTitle.exec(n);
        r && (n = r[1], s = r[3]);
      } else s = e[3] ? e[3].slice(1, -1) : "";
      return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(t) ? n = n.slice(1) : n = n.slice(1, -1)), oe(e, { href: n && n.replace(this.rules.inline.anyPunctuation, "$1"), title: s && s.replace(this.rules.inline.anyPunctuation, "$1") }, e[0], this.lexer, this.rules);
    }
  }
  reflink(i, e) {
    let t;
    if ((t = this.rules.inline.reflink.exec(i)) || (t = this.rules.inline.nolink.exec(i))) {
      let n = (t[2] || t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), s = e[n.toLowerCase()];
      if (!s) {
        let r = t[0].charAt(0);
        return { type: "text", raw: r, text: r };
      }
      return oe(t, s, t[0], this.lexer, this.rules);
    }
  }
  emStrong(i, e, t = "") {
    let n = this.rules.inline.emStrongLDelim.exec(i);
    if (!(!n || n[3] && t.match(this.rules.other.unicodeAlphaNumeric)) && (!(n[1] || n[2]) || !t || this.rules.inline.punctuation.exec(t))) {
      let s = [...n[0]].length - 1, r, a, l = s, o = 0, c = n[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, e = e.slice(-1 * i.length + s); (n = c.exec(e)) != null; ) {
        if (r = n[1] || n[2] || n[3] || n[4] || n[5] || n[6], !r) continue;
        if (a = [...r].length, n[3] || n[4]) {
          l += a;
          continue;
        } else if ((n[5] || n[6]) && s % 3 && !((s + a) % 3)) {
          o += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + o);
        let h = [...n[0]][0].length, u = i.slice(0, s + n.index + h + a);
        if (Math.min(s, a) % 2) {
          let k = u.slice(1, -1);
          return { type: "em", raw: u, text: k, tokens: this.lexer.inlineTokens(k) };
        }
        let g = u.slice(2, -2);
        return { type: "strong", raw: u, text: g, tokens: this.lexer.inlineTokens(g) };
      }
    }
  }
  codespan(i) {
    let e = this.rules.inline.code.exec(i);
    if (e) {
      let t = e[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(t), s = this.rules.other.startingSpaceChar.test(t) && this.rules.other.endingSpaceChar.test(t);
      return n && s && (t = t.substring(1, t.length - 1)), { type: "codespan", raw: e[0], text: t };
    }
  }
  br(i) {
    let e = this.rules.inline.br.exec(i);
    if (e) return { type: "br", raw: e[0] };
  }
  del(i) {
    let e = this.rules.inline.del.exec(i);
    if (e) return { type: "del", raw: e[0], text: e[2], tokens: this.lexer.inlineTokens(e[2]) };
  }
  autolink(i) {
    let e = this.rules.inline.autolink.exec(i);
    if (e) {
      let t, n;
      return e[2] === "@" ? (t = e[1], n = "mailto:" + t) : (t = e[1], n = t), { type: "link", raw: e[0], text: t, href: n, tokens: [{ type: "text", raw: t, text: t }] };
    }
  }
  url(i) {
    let e;
    if (e = this.rules.inline.url.exec(i)) {
      let t, n;
      if (e[2] === "@") t = e[0], n = "mailto:" + t;
      else {
        let s;
        do
          s = e[0], e[0] = this.rules.inline._backpedal.exec(e[0])?.[0] ?? "";
        while (s !== e[0]);
        t = e[0], e[1] === "www." ? n = "http://" + e[0] : n = e[0];
      }
      return { type: "link", raw: e[0], text: t, href: n, tokens: [{ type: "text", raw: t, text: t }] };
    }
  }
  inlineText(i) {
    let e = this.rules.inline.text.exec(i);
    if (e) {
      let t = this.lexer.state.inRawBlock;
      return { type: "text", raw: e[0], text: e[0], escaped: t };
    }
  }
}, y = class V {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || R, this.options.tokenizer = this.options.tokenizer || new D(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let t = { other: w, block: z.normal, inline: E.normal };
    this.options.pedantic ? (t.block = z.pedantic, t.inline = E.pedantic) : this.options.gfm && (t.block = z.gfm, this.options.breaks ? t.inline = E.breaks : t.inline = E.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: z, inline: E };
  }
  static lex(e, t) {
    return new V(t).lex(e);
  }
  static lexInline(e, t) {
    return new V(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(w.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = !1) {
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
        this.options.extensions.startBlock.forEach((c) => {
          o = c.call({ lexer: this }, l), typeof o == "number" && o >= 0 && (a = Math.min(a, o));
        }), a < 1 / 0 && a >= 0 && (r = e.substring(0, a + 1));
      }
      if (this.state.top && (s = this.tokenizer.paragraph(r))) {
        let a = t.at(-1);
        n && a?.type === "paragraph" ? (a.raw += (a.raw.endsWith(`
`) ? "" : `
`) + s.raw, a.text += `
` + s.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = a.text) : t.push(s), n = r.length !== e.length, e = e.substring(s.raw.length);
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
    let n = e, s = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0) for (; (s = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; ) o.includes(s[0].slice(s[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (s = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; ) n = n.slice(0, s.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let r;
    for (; (s = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; ) r = s[2] ? s[2].length : 0, n = n.slice(0, s.index + r) + "[" + "a".repeat(s[0].length - r - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
    let a = !1, l = "";
    for (; e; ) {
      a || (l = ""), a = !1;
      let o;
      if (this.options.extensions?.inline?.some((h) => (o = h.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
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
        let h = t.at(-1);
        o.type === "text" && h?.type === "text" ? (h.raw += o.raw, h.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, l)) {
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
      let c = e;
      if (this.options.extensions?.startInline) {
        let h = 1 / 0, u = e.slice(1), g;
        this.options.extensions.startInline.forEach((k) => {
          g = k.call({ lexer: this }, u), typeof g == "number" && g >= 0 && (h = Math.min(h, g));
        }), h < 1 / 0 && h >= 0 && (c = e.substring(0, h + 1));
      }
      if (o = this.tokenizer.inlineText(c)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (l = o.raw.slice(-1)), a = !0;
        let h = t.at(-1);
        h?.type === "text" ? (h.raw += o.raw, h.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let h = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(h);
          break;
        } else throw new Error(h);
      }
    }
    return t;
  }
}, B = class {
  options;
  parser;
  constructor(i) {
    this.options = i || R;
  }
  space(i) {
    return "";
  }
  code({ text: i, lang: e, escaped: t }) {
    let n = (e || "").match(w.notSpaceStart)?.[0], s = i.replace(w.endingNewline, "") + `
`;
    return n ? '<pre><code class="language-' + T(n) + '">' + (t ? s : T(s, !0)) + `</code></pre>
` : "<pre><code>" + (t ? s : T(s, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: i }) {
    return `<blockquote>
${this.parser.parse(i)}</blockquote>
`;
  }
  html({ text: i }) {
    return i;
  }
  def(i) {
    return "";
  }
  heading({ tokens: i, depth: e }) {
    return `<h${e}>${this.parser.parseInline(i)}</h${e}>
`;
  }
  hr(i) {
    return `<hr>
`;
  }
  list(i) {
    let e = i.ordered, t = i.start, n = "";
    for (let a = 0; a < i.items.length; a++) {
      let l = i.items[a];
      n += this.listitem(l);
    }
    let s = e ? "ol" : "ul", r = e && t !== 1 ? ' start="' + t + '"' : "";
    return "<" + s + r + `>
` + n + "</" + s + `>
`;
  }
  listitem(i) {
    return `<li>${this.parser.parse(i.tokens)}</li>
`;
  }
  checkbox({ checked: i }) {
    return "<input " + (i ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: i }) {
    return `<p>${this.parser.parseInline(i)}</p>
`;
  }
  table(i) {
    let e = "", t = "";
    for (let s = 0; s < i.header.length; s++) t += this.tablecell(i.header[s]);
    e += this.tablerow({ text: t });
    let n = "";
    for (let s = 0; s < i.rows.length; s++) {
      let r = i.rows[s];
      t = "";
      for (let a = 0; a < r.length; a++) t += this.tablecell(r[a]);
      n += this.tablerow({ text: t });
    }
    return n && (n = `<tbody>${n}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + n + `</table>
`;
  }
  tablerow({ text: i }) {
    return `<tr>
${i}</tr>
`;
  }
  tablecell(i) {
    let e = this.parser.parseInline(i.tokens), t = i.header ? "th" : "td";
    return (i.align ? `<${t} align="${i.align}">` : `<${t}>`) + e + `</${t}>
`;
  }
  strong({ tokens: i }) {
    return `<strong>${this.parser.parseInline(i)}</strong>`;
  }
  em({ tokens: i }) {
    return `<em>${this.parser.parseInline(i)}</em>`;
  }
  codespan({ text: i }) {
    return `<code>${T(i, !0)}</code>`;
  }
  br(i) {
    return "<br>";
  }
  del({ tokens: i }) {
    return `<del>${this.parser.parseInline(i)}</del>`;
  }
  link({ href: i, title: e, tokens: t }) {
    let n = this.parser.parseInline(t), s = re(i);
    if (s === null) return n;
    i = s;
    let r = '<a href="' + i + '"';
    return e && (r += ' title="' + T(e) + '"'), r += ">" + n + "</a>", r;
  }
  image({ href: i, title: e, text: t, tokens: n }) {
    n && (t = this.parser.parseInline(n, this.parser.textRenderer));
    let s = re(i);
    if (s === null) return T(t);
    i = s;
    let r = `<img src="${i}" alt="${t}"`;
    return e && (r += ` title="${T(e)}"`), r += ">", r;
  }
  text(i) {
    return "tokens" in i && i.tokens ? this.parser.parseInline(i.tokens) : "escaped" in i && i.escaped ? i.text : T(i.text);
  }
}, ee = class {
  strong({ text: i }) {
    return i;
  }
  em({ text: i }) {
    return i;
  }
  codespan({ text: i }) {
    return i;
  }
  del({ text: i }) {
    return i;
  }
  html({ text: i }) {
    return i;
  }
  text({ text: i }) {
    return i;
  }
  link({ text: i }) {
    return "" + i;
  }
  image({ text: i }) {
    return "" + i;
  }
  br() {
    return "";
  }
  checkbox({ raw: i }) {
    return i;
  }
}, x = class j {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || R, this.options.renderer = this.options.renderer || new B(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new ee();
  }
  static parse(e, t) {
    return new j(t).parse(e);
  }
  static parseInline(e, t) {
    return new j(t).parseInline(e);
  }
  parse(e) {
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let s = e[n];
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
    let n = "";
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      if (this.options.extensions?.renderers?.[r.type]) {
        let l = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (l !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
          n += l || "";
          continue;
        }
      }
      let a = r;
      switch (a.type) {
        case "escape": {
          n += t.text(a);
          break;
        }
        case "html": {
          n += t.html(a);
          break;
        }
        case "link": {
          n += t.link(a);
          break;
        }
        case "image": {
          n += t.image(a);
          break;
        }
        case "checkbox": {
          n += t.checkbox(a);
          break;
        }
        case "strong": {
          n += t.strong(a);
          break;
        }
        case "em": {
          n += t.em(a);
          break;
        }
        case "codespan": {
          n += t.codespan(a);
          break;
        }
        case "br": {
          n += t.br(a);
          break;
        }
        case "del": {
          n += t.del(a);
          break;
        }
        case "text": {
          n += t.text(a);
          break;
        }
        default: {
          let l = 'Token with "' + a.type + '" type was not found.';
          if (this.options.silent) return console.error(l), "";
          throw new Error(l);
        }
      }
    }
    return n;
  }
}, M = class {
  options;
  block;
  constructor(i) {
    this.options = i || R;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(i) {
    return i;
  }
  postprocess(i) {
    return i;
  }
  processAllTokens(i) {
    return i;
  }
  emStrongMask(i) {
    return i;
  }
  provideLexer() {
    return this.block ? y.lex : y.lexInline;
  }
  provideParser() {
    return this.block ? x.parse : x.parseInline;
  }
}, rt = class {
  defaults = W();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = x;
  Renderer = B;
  TextRenderer = ee;
  Lexer = y;
  Tokenizer = D;
  Hooks = M;
  constructor(...i) {
    this.use(...i);
  }
  walkTokens(i, e) {
    let t = [];
    for (let n of i) switch (t = t.concat(e.call(this, n)), n.type) {
      case "table": {
        let s = n;
        for (let r of s.header) t = t.concat(this.walkTokens(r.tokens, e));
        for (let r of s.rows) for (let a of r) t = t.concat(this.walkTokens(a.tokens, e));
        break;
      }
      case "list": {
        let s = n;
        t = t.concat(this.walkTokens(s.items, e));
        break;
      }
      default: {
        let s = n;
        this.defaults.extensions?.childTokens?.[s.type] ? this.defaults.extensions.childTokens[s.type].forEach((r) => {
          let a = s[r].flat(1 / 0);
          t = t.concat(this.walkTokens(a, e));
        }) : s.tokens && (t = t.concat(this.walkTokens(s.tokens, e)));
      }
    }
    return t;
  }
  use(...i) {
    let e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return i.forEach((t) => {
      let n = { ...t };
      if (n.async = this.defaults.async || n.async || !1, t.extensions && (t.extensions.forEach((s) => {
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
      }), n.extensions = e), t.renderer) {
        let s = this.defaults.renderer || new B(this.defaults);
        for (let r in t.renderer) {
          if (!(r in s)) throw new Error(`renderer '${r}' does not exist`);
          if (["options", "parser"].includes(r)) continue;
          let a = r, l = t.renderer[a], o = s[a];
          s[a] = (...c) => {
            let h = l.apply(s, c);
            return h === !1 && (h = o.apply(s, c)), h || "";
          };
        }
        n.renderer = s;
      }
      if (t.tokenizer) {
        let s = this.defaults.tokenizer || new D(this.defaults);
        for (let r in t.tokenizer) {
          if (!(r in s)) throw new Error(`tokenizer '${r}' does not exist`);
          if (["options", "rules", "lexer"].includes(r)) continue;
          let a = r, l = t.tokenizer[a], o = s[a];
          s[a] = (...c) => {
            let h = l.apply(s, c);
            return h === !1 && (h = o.apply(s, c)), h;
          };
        }
        n.tokenizer = s;
      }
      if (t.hooks) {
        let s = this.defaults.hooks || new M();
        for (let r in t.hooks) {
          if (!(r in s)) throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r)) continue;
          let a = r, l = t.hooks[a], o = s[a];
          M.passThroughHooks.has(r) ? s[a] = (c) => {
            if (this.defaults.async && M.passThroughHooksRespectAsync.has(r)) return (async () => {
              let u = await l.call(s, c);
              return o.call(s, u);
            })();
            let h = l.call(s, c);
            return o.call(s, h);
          } : s[a] = (...c) => {
            if (this.defaults.async) return (async () => {
              let u = await l.apply(s, c);
              return u === !1 && (u = await o.apply(s, c)), u;
            })();
            let h = l.apply(s, c);
            return h === !1 && (h = o.apply(s, c)), h;
          };
        }
        n.hooks = s;
      }
      if (t.walkTokens) {
        let s = this.defaults.walkTokens, r = t.walkTokens;
        n.walkTokens = function(a) {
          let l = [];
          return l.push(r.call(this, a)), s && (l = l.concat(s.call(this, a))), l;
        };
      }
      this.defaults = { ...this.defaults, ...n };
    }), this;
  }
  setOptions(i) {
    return this.defaults = { ...this.defaults, ...i }, this;
  }
  lexer(i, e) {
    return y.lex(i, e ?? this.defaults);
  }
  parser(i, e) {
    return x.parse(i, e ?? this.defaults);
  }
  parseMarkdown(i) {
    return (e, t) => {
      let n = { ...t }, s = { ...this.defaults, ...n }, r = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === !0 && n.async === !1) return r(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof e > "u" || e === null) return r(new Error("marked(): input parameter is undefined or null"));
      if (typeof e != "string") return r(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected"));
      if (s.hooks && (s.hooks.options = s, s.hooks.block = i), s.async) return (async () => {
        let a = s.hooks ? await s.hooks.preprocess(e) : e, l = await (s.hooks ? await s.hooks.provideLexer() : i ? y.lex : y.lexInline)(a, s), o = s.hooks ? await s.hooks.processAllTokens(l) : l;
        s.walkTokens && await Promise.all(this.walkTokens(o, s.walkTokens));
        let c = await (s.hooks ? await s.hooks.provideParser() : i ? x.parse : x.parseInline)(o, s);
        return s.hooks ? await s.hooks.postprocess(c) : c;
      })().catch(r);
      try {
        s.hooks && (e = s.hooks.preprocess(e));
        let a = (s.hooks ? s.hooks.provideLexer() : i ? y.lex : y.lexInline)(e, s);
        s.hooks && (a = s.hooks.processAllTokens(a)), s.walkTokens && this.walkTokens(a, s.walkTokens);
        let l = (s.hooks ? s.hooks.provideParser() : i ? x.parse : x.parseInline)(a, s);
        return s.hooks && (l = s.hooks.postprocess(l)), l;
      } catch (a) {
        return r(a);
      }
    };
  }
  onError(i, e) {
    return (t) => {
      if (t.message += `
Please report this to https://github.com/markedjs/marked.`, i) {
        let n = "<p>An error occurred:</p><pre>" + T(t.message + "", !0) + "</pre>";
        return e ? Promise.resolve(n) : n;
      }
      if (e) return Promise.reject(t);
      throw t;
    };
  }
}, C = new rt();
function p(i, e) {
  return C.parse(i, e);
}
p.options = p.setOptions = function(i) {
  return C.setOptions(i), p.defaults = C.defaults, ce(p.defaults), p;
};
p.getDefaults = W;
p.defaults = R;
p.use = function(...i) {
  return C.use(...i), p.defaults = C.defaults, ce(p.defaults), p;
};
p.walkTokens = function(i, e) {
  return C.walkTokens(i, e);
};
p.parseInline = C.parseInline;
p.Parser = x;
p.parser = x.parse;
p.Renderer = B;
p.TextRenderer = ee;
p.Lexer = y;
p.lexer = y.lex;
p.Tokenizer = D;
p.Hooks = M;
p.parse = p;
p.options;
p.setOptions;
p.use;
p.walkTokens;
p.parseInline;
x.parse;
y.lex;
class Et {
  service;
  config;
  container;
  widgetState = "minimized";
  inputValue = "";
  unsubscribe;
  root;
  theme;
  displayedMessageContent = /* @__PURE__ */ new Map();
  targetMessageContent = /* @__PURE__ */ new Map();
  revealTimers = /* @__PURE__ */ new Map();
  scrollFrame = null;
  wasPresentationStreaming = !1;
  lastRenderedMessageSignature = "";
  messageRevealDelayMs = 18;
  bottomFollowThresholdPx = 48;
  constructor(e, t) {
    this.config = {
      title: "Chat",
      placeholder: "Type a message...",
      mode: "floating",
      ...e
    }, this.theme = t, this.container = e.container || this.createDefaultContainer(), this.syncContainerClasses();
    const n = {
      ...e,
      initialLanguage: e.lang || e.initialLanguage
    };
    this.service = new xe(n, (s) => {
      e.debug && console.log("[ChatWidget] Event:", s);
    }), this.widgetState = this.config.startMinimized ? "minimized" : this.config.mode === "inline" || this.service.store.getState().messages.length > 0 ? "full" : "minimized", this.seedPresentationState(this.service.store.getState().messages), this.unsubscribe = this.service.store.subscribe(() => {
      this.render();
    }), this.render(), e.autoConnect !== !1 && this.service.connect().catch((s) => {
      console.error("[ChatWidget] Auto-connect failed:", s);
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
    const e = this.getMessagesScrollSnapshot(), t = this.service.store.getState(), n = this.buildPresentationState(t), s = this.getMessageSignature(n), r = s !== this.lastRenderedMessageSignature, a = this.inputValue.trim().length > 0, l = this.theme.render(this.widgetState, n, a);
    if (!this.root) {
      this.root = document.createElement("div"), this.container.appendChild(this.root);
      const c = this.theme.getCSSPath?.();
      c && this.injectCSS(c);
    }
    this.root.className = `assistant-widget ${this.theme.getClassName()} assistant-widget-${this.widgetState} assistant-widget-mode-${this.config.mode || "floating"}`, this.root.innerHTML = l, this.attachEventListeners();
    const o = this.hasPresentationStreaming(n) || t.isTyping;
    this.syncMessagesScroll({
      previous: e,
      shouldFollow: r && (o || this.wasPresentationStreaming || e?.isNearBottom !== !1),
      smooth: r && !o && !this.wasPresentationStreaming
    }), this.lastRenderedMessageSignature = s, this.wasPresentationStreaming = o;
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
    e && e.addEventListener("click", (c) => {
      this.config.mode === "inline" || c.target.closest(".chat-header-button") || this.handleHeaderClick();
    });
    const t = this.root.querySelector('[data-action="close"]');
    t && t.addEventListener("click", (c) => {
      c.stopPropagation(), this.handleClose();
    });
    const n = this.root.querySelector(".chat-input");
    n && (n.value = this.inputValue, n.addEventListener("input", (c) => {
      const h = c.target, u = h.value, g = this.inputValue.trim().length === 0, k = u.trim().length === 0;
      if (this.inputValue = u, this.autoResizeTextarea(n), g !== k) {
        const m = h.selectionStart, b = h.selectionEnd;
        this.render();
        const S = this.root?.querySelector(".chat-input");
        S && (S.focus(), S.setSelectionRange(m, b), S.value = this.inputValue);
      }
    }), n.addEventListener("keydown", (c) => {
      c.key === "Enter" && !c.shiftKey && (c.preventDefault(), this.handleSendMessage());
    }), this.autoResizeTextarea(n));
    const s = this.root.querySelector('[data-action="primary"]');
    s && s.addEventListener("click", () => {
      this.handlePrimaryAction();
    }), this.root.querySelectorAll('[data-action="suggestion"]').forEach((c) => {
      c.addEventListener("click", () => {
        const h = c.getAttribute("data-suggestion");
        h && (this.inputValue = h, this.handleSendMessage());
      });
    }), this.root.querySelectorAll('[data-action="copy"]').forEach((c) => {
      c.addEventListener("click", () => {
        const h = c.getAttribute("data-content");
        h && this.handleCopyMessage(h, c);
      });
    }), this.root.querySelectorAll('[data-action="like"]').forEach((c) => {
      c.addEventListener("click", () => {
        let h = c.getAttribute("data-run-id");
        console.log("[ChatWidget] Like button clicked. Attribute run-id:", h, "Fallback lastRunId:", this.service.lastRunId), h || (h = this.service.lastRunId || ""), h ? this.handleRateMessage(h, "like") : console.warn("[ChatWidget] Like clicked but no runId is available (both attribute and fallback are empty).");
      });
    }), this.root.querySelectorAll('[data-action="dislike"]').forEach((c) => {
      c.addEventListener("click", () => {
        let h = c.getAttribute("data-run-id");
        console.log("[ChatWidget] Dislike button clicked. Attribute run-id:", h, "Fallback lastRunId:", this.service.lastRunId), h || (h = this.service.lastRunId || ""), h ? this.handleRateMessage(h, "dislike") : console.warn("[ChatWidget] Dislike clicked but no runId is available (both attribute and fallback are empty).");
      });
    }), n && this.autoResizeTextarea(n);
  }
  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea(e) {
    e.style.height = "auto", e.style.height = `${Math.min(e.scrollHeight, 120)}px`;
  }
  getMessagesScrollSnapshot() {
    if (!this.root) return null;
    const e = this.root.querySelector(".chat-messages");
    if (!e) return null;
    const t = e.scrollHeight - e.scrollTop - e.clientHeight;
    return {
      top: e.scrollTop,
      bottomOffset: t,
      isNearBottom: t <= this.bottomFollowThresholdPx
    };
  }
  syncMessagesScroll(e) {
    if (!this.root) return;
    const t = this.root.querySelector(".chat-messages");
    if (!t) return;
    if (this.scrollFrame !== null && typeof window < "u" && window.cancelAnimationFrame && (window.cancelAnimationFrame(this.scrollFrame), this.scrollFrame = null), !e.shouldFollow) {
      this.restoreMessagesScroll(t, e.previous);
      return;
    }
    const n = t.scrollHeight;
    if (!e.smooth) {
      t.scrollTop = n;
      return;
    }
    this.restoreMessagesScroll(t, e.previous);
    const s = () => {
      typeof t.scrollTo == "function" ? t.scrollTo({ top: t.scrollHeight, behavior: "smooth" }) : t.scrollTop = t.scrollHeight, this.scrollFrame = null;
    };
    typeof window < "u" && window.requestAnimationFrame ? this.scrollFrame = window.requestAnimationFrame(s) : s();
  }
  restoreMessagesScroll(e, t) {
    if (!t) return;
    const n = Math.max(0, e.scrollHeight - e.clientHeight);
    e.scrollTop = t.isNearBottom ? n : Math.min(t.top, n);
  }
  getMessageSignature(e) {
    return e.messages.map((t) => `${t.id}:${t.type || "text"}:${t.role}:${t.content.length}:${t.content}`).join("|");
  }
  hasPresentationStreaming(e) {
    return e.messages.some((t) => !!t.metadata?.presentationStreaming);
  }
  seedPresentationState(e) {
    for (const t of e)
      if (this.shouldRevealMessage(t)) {
        const n = t.id === "welcome" ? "" : t.content;
        this.displayedMessageContent.set(t.id, n), this.targetMessageContent.set(t.id, t.content);
      }
  }
  buildPresentationState(e) {
    const t = new Set(e.messages.map((n) => n.id));
    return this.prunePresentationState(t), {
      ...e,
      messages: e.messages.map((n) => {
        if (!this.shouldRevealMessage(n))
          return n;
        const s = n.content;
        let r = this.displayedMessageContent.get(n.id);
        r === void 0 && (r = ""), s.startsWith(r) || (r = ""), this.targetMessageContent.set(n.id, s), this.displayedMessageContent.set(n.id, r);
        const a = r.length < s.length;
        return a && this.scheduleMessageReveal(n.id), {
          ...n,
          content: r,
          metadata: {
            ...n.metadata,
            presentationStreaming: a
          }
        };
      })
    };
  }
  shouldRevealMessage(e) {
    return e.role === "assistant" && (e.type === void 0 || e.type === "text") && e.content.length > 0;
  }
  scheduleMessageReveal(e) {
    if (this.revealTimers.has(e))
      return;
    const t = setTimeout(() => {
      this.revealTimers.delete(e);
      const n = this.targetMessageContent.get(e), s = this.displayedMessageContent.get(e) ?? "";
      if (!n || s.length >= n.length)
        return;
      const r = this.getRevealCount(n.length - s.length);
      this.displayedMessageContent.set(e, n.slice(0, s.length + r)), this.render();
    }, this.messageRevealDelayMs);
    this.revealTimers.set(e, t);
  }
  getRevealCount(e) {
    return e > 900 ? 12 : e > 400 ? 8 : e > 180 ? 5 : 2;
  }
  prunePresentationState(e) {
    for (const t of this.displayedMessageContent.keys())
      if (!e.has(t)) {
        this.displayedMessageContent.delete(t), this.targetMessageContent.delete(t);
        const n = this.revealTimers.get(t);
        n && (clearTimeout(n), this.revealTimers.delete(t));
      }
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
    }).catch((n) => {
      console.error("[ChatWidget] Failed to copy:", n);
    });
  }
  async handleRateMessage(e, t) {
    const n = this.service.store.getState().messages;
    let s = t;
    for (const r of n)
      if (r.metadata?.run_id === e) {
        r.metadata?.rating === t && (s = "");
        break;
      }
    try {
      await this.service.sendFeedback(e, s);
      for (const r of n)
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
    this.clearPresentationState(), this.service.clearMessages(), this.setWidgetState(this.config.mode === "inline" ? "full" : "input-only");
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
    this.unsubscribe && this.unsubscribe(), this.clearPresentationState(), this.scrollFrame !== null && typeof window < "u" && window.cancelAnimationFrame && (window.cancelAnimationFrame(this.scrollFrame), this.scrollFrame = null), this.service.disconnect(), this.root && this.root.remove(), this.container.classList.remove(
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
  clearPresentationState() {
    for (const e of this.revealTimers.values())
      clearTimeout(e);
    this.revealTimers.clear(), this.displayedMessageContent.clear(), this.targetMessageContent.clear(), this.wasPresentationStreaming = !1, this.lastRenderedMessageSignature = "";
  }
  /**
   * Render markdown content
   */
  renderMarkdown(e) {
    try {
      return p.parse(e, { async: !1 });
    } catch {
      return e;
    }
  }
}
const le = {
  en: {
    connecting: "Connecting...",
    clearChat: "Clear Chat"
  },
  ru: {
    connecting: "Подключение...",
    clearChat: "Очистить чат"
  }
};
function at(i, e, t, n) {
  const { messages: s, isConnecting: r, isTyping: a, error: l } = e, o = t.lang || "en", c = le[o] || le.en, h = ot(s), u = t.position === "top" ? mt() : t.position === "left" ? wt() : t.position === "right" ? kt() : ft();
  let g = "";
  const k = e.suggestions ?? t.suggestions ?? [], m = [...s].reverse().find((S) => S.type !== "status");
  return k.length > 0 && !r && !a && m?.role === "assistant" && !m.metadata?.presentationStreaming && (g = `<div class="chat-suggestions">${k.map(
    (S) => `<button class="chat-suggestion-chip" data-action="suggestion" data-suggestion="${_(S)}">${_(S)}</button>`
  ).join("")}</div>`), `<div class="assistant-widget-content"><div class="chat-header" ${i === "minimized" ? 'data-clickable="expand"' : 'data-clickable="minimize"'}><div class="chat-header-group"><span class="chat-header-title">${t.title}</span></div><div class="chat-header-actions">${t.mode !== "inline" ? `<div class="chat-header-icon-arrow">${u}</div>` : ""}${t.showClose && i === "full" ? `<button class="chat-header-button action-close" data-action="close" aria-label="${c.clearChat}">${pt()}</button>` : ""}</div></div><div class="chat-messages">${l ? `<div class="chat-error">${_(l)}</div>` : ""}${h.map((S, L) => lt(S, a && L === h.length - 1)).join("")}${g}</div><div class="chat-input-container"><textarea class="chat-input" placeholder="${r ? c.connecting : t.placeholder}" ${r ? "disabled" : ""} rows="1"></textarea><button class="chat-input-button" data-action="primary" ${r || !n ? "disabled" : ""}>${ht()}</button></div></div>`;
}
function ot(i) {
  const e = [];
  for (const t of i) {
    if (t.type === "status") {
      const n = e[e.length - 1];
      if (n && n.main.role === t.role && n.main.type !== "status") {
        n.status = t;
        continue;
      }
    }
    e.push({ main: t });
  }
  return e;
}
function lt(i, e) {
  const t = i.main, n = t.type === "status", s = n ? t : i.status, r = t.role === "user", a = t.type === "error", l = !!t.metadata?.presentationStreaming;
  let o = "";
  if (!n) {
    let u = r ? _(t.content) : ct(t.content);
    (e || l) && !r && (u += '<span class="typing-cursor"></span>'), o = `<div class="chat-message-bubble ${r ? "chat-message-bubble-user" : a ? "chat-message-bubble-error" : "chat-message-bubble-assistant"}">${r ? `<p>${u}</p>` : `<div class="markdown-content">${u}</div>`}</div>`;
  }
  let c = "";
  s && (c = `<div class="chat-message-status ${n ? "chat-status-standalone" : ""}"><div class="loader-box"><div class="loader"></div></div><div class="chat-status-text">${_(s.content)}</div></div>`);
  const h = !r && !a && !n && !l ? `<div class="chat-message-actions"><button class="chat-message-action" data-action="copy" data-content="${_(t.content)}">${ut()}</button><button class="chat-message-action${t.metadata?.rating === "like" ? " active" : ""}" data-action="like" data-run-id="${t.metadata?.run_id ?? ""}">${gt()}</button><button class="chat-message-action${t.metadata?.rating === "dislike" ? " active" : ""}" data-action="dislike" data-run-id="${t.metadata?.run_id ?? ""}">${dt()}</button></div>` : "";
  return `<div class="chat-message ${r ? "chat-message-user" : "chat-message-assistant"}">${o}${c}${h}</div>`;
}
function ct(i) {
  if (!i) return "";
  try {
    return p.parse(i, { async: !1 });
  } catch (e) {
    return console.error("Error parsing markdown:", e), i;
  }
}
function _(i) {
  const e = document.createElement("div");
  return e.textContent = i, e.innerHTML;
}
const ht = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>', ut = () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>', gt = () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>', dt = () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>', pt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>', ft = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>', mt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>', kt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>', wt = () => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>', bt = {
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
    const t = e.lang || this.config?.lang || "en", n = {
      en: {
        title: "Chat",
        placeholder: "Type a message..."
      },
      ru: {
        title: "Чат",
        placeholder: "Введите сообщение..."
      }
    }, s = n[t] || n.en, r = e.mode || this.config?.mode || "floating";
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
  render(e, t, n) {
    const s = this.config.variant, r = bt[s] || {}, a = s === "custom" ? { ...r, ...this.customColors } : { ...r };
    return `<style>
         .theme-default.theme-variant-${s} {
           ${Object.entries(this.mapColorsToVars(a)).map(([o, c]) => `${o}: ${c};`).join(`
`)}
           ${a.background ? `background: ${a.background} !important;` : ""}
         }
         </style>` + at(e, t, this.config, n);
  }
  getClassName() {
    return `theme-default theme-variant-${this.config.variant}`;
  }
  getCSSPath() {
  }
  mapColorsToVars(e) {
    const t = {};
    e.primary && (t["--theme-primary"] = e.primary), e.background && (t["--theme-background"] = e.background), e.foreground && (t["--theme-foreground"] = e.foreground), e.muted && (t["--theme-muted"] = e.muted), e.border && (t["--theme-border"] = e.border), e.accentIcon && (t["--theme-accent-icon"] = e.accentIcon), e.overlay && (t["--theme-overlay"] = e.overlay), e.glass && (t["--theme-glass"] = e.glass), e.textLight && (t["--theme-text-light"] = e.textLight), e.textMuted && (t["--theme-text-muted"] = e.textMuted), e.linkColor && (t["--theme-link-color"] = e.linkColor), e.linkHover && (t["--theme-link-hover"] = e.linkHover);
    const n = e.background || e.primary;
    if (n) {
      const s = St(n);
      console.log("[Theme] baseColor:", n, "isLightColor:", s), e.textLight || (t["--theme-text-light"] = s ? "#101010" : "#ffffff"), e.textMuted || (t["--theme-text-muted"] = s ? "rgba(16, 16, 16, 0.7)" : "rgba(255, 255, 255, 0.7)"), e.accentIcon || (t["--theme-accent-icon"] = s ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"), e.glass || (t["--theme-glass"] = s ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)"), e.border || (t["--theme-border"] = s ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"), e.linkColor || (t["--theme-link-color"] = s ? "#075985" : "#bfdbfe"), e.linkHover || (t["--theme-link-hover"] = s ? "#0c4a6e" : "#ffffff");
    }
    return t;
  }
}
function St(i) {
  if (!i) return !1;
  i = i.trim().toLowerCase();
  let e = 0, t = 0, n = 0;
  if (i.startsWith("#")) {
    const u = i.substring(1);
    u.length === 3 ? (e = parseInt(u[0] + u[0], 16), t = parseInt(u[1] + u[1], 16), n = parseInt(u[2] + u[2], 16)) : (u.length === 6 || u.length === 8) && (e = parseInt(u.substring(0, 2), 16), t = parseInt(u.substring(2, 4), 16), n = parseInt(u.substring(4, 6), 16));
  } else if (i.startsWith("rgb")) {
    const u = i.match(/\d+/g);
    u && u.length >= 3 && (e = parseInt(u[0], 10), t = parseInt(u[1], 10), n = parseInt(u[2], 10));
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
    u[i] && ([e, t, n] = u[i]);
  }
  const s = e / 255, r = t / 255, a = n / 255, l = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4), o = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4), c = a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4);
  return 0.2126 * l + 0.7152 * o + 0.0722 * c > 0.5;
}
export {
  xe as C,
  At as D,
  f as W,
  ye as a,
  Et as b,
  Ct as c,
  xt as d,
  Rt as e,
  yt as f,
  v as g,
  $t as h,
  Tt as i,
  vt as s,
  _t as t
};
//# sourceMappingURL=index-hzgQXJLh.js.map
