import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatService } from "./ChatService";
import { WSMessageType } from "../types";

describe("ChatService", () => {
  const fetchMock = vi.fn();
  let localStorageMock: Map<string, string>;

  beforeEach(() => {
    vi.useRealTimers();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorageMock = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageMock.get(key) ?? null,
      setItem: (key: string, value: string) => localStorageMock.set(key, value),
      removeItem: (key: string) => localStorageMock.delete(key),
      clear: () => localStorageMock.clear(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("connects through handshake and updates connection state", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "token-1", sessionId: "session-1" }),
    });

    const service = new ChatService({
      siteToken: "site-token",
      identityUrl: "http://localhost:8100",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
    });

    await service.connect();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/v1/chat/handshake?siteToken=site-token");
    expect(service.isConnected()).toBe(true);
    expect(service.getSessionId()).toBe("session-1");

    service.disconnect();
    expect(service.isConnected()).toBe(false);
  });

  it("accumulates delta chunks and finalizes on done", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; payload?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({ type: WSMessageType.DELTA, content: "Hello " });
    invoke.handleRuntimeEvent({ type: WSMessageType.DELTA, content: "world" });
    invoke.handleRuntimeEvent({ type: WSMessageType.DONE, content: "" });

    const state = service.store.getState();
    const assistant = state.messages.find((m) => m.role === "assistant" && m.type === "text");
    expect(assistant?.content).toBe("Hello world");
    expect(state.isTyping).toBe(false);
  });

  it("shows localized transient status for tool.start and tool.end events", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      initialLanguage: "es-AR",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; payload?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({ type: WSMessageType.TOOL_START, content: "Search CRM" });
    invoke.handleRuntimeEvent({ type: WSMessageType.TOOL_END, content: "Found 3 results" });

    const statusMessages = service.store.getState().messages.filter((m) => m.type === "status");
    expect(statusMessages.length).toBe(1);
    expect(statusMessages[0].content).toBe("Terminando...");
  });

  it("localizes structured RAG thought statuses", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      initialLanguage: "ru",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; metadata?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({
      type: WSMessageType.THOUGHT,
      content: "Searching knowledge...",
      metadata: { status: "rag_search" },
    });

    const statusMessages = service.store.getState().messages.filter((m) => m.type === "status");
    expect(statusMessages[0].content).toBe("Проверяю базу знаний...");
  });

  it("keeps RAG search visible before fast RAG found transitions", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      initialLanguage: "ru",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; metadata?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({
      type: WSMessageType.THOUGHT,
      content: "Searching knowledge...",
      metadata: { status: "rag_search" },
    });
    vi.setSystemTime(1_500);
    invoke.handleRuntimeEvent({
      type: WSMessageType.THOUGHT,
      content: "Found 3 relevant context chunks",
      metadata: { status: "rag_found" },
    });
    invoke.handleRuntimeEvent({ type: WSMessageType.DELTA, content: "Ответ" });
    invoke.handleRuntimeEvent({ type: WSMessageType.DONE, content: "" });

    const currentStatus = () => service.store.getState().messages.find((m) => m.type === "status");
    expect(currentStatus()?.content).toBe("Проверяю базу знаний...");

    vi.setSystemTime(2_399);
    vi.advanceTimersByTime(899);
    expect(currentStatus()?.content).toBe("Проверяю базу знаний...");

    vi.setSystemTime(2_400);
    vi.advanceTimersByTime(1);
    expect(currentStatus()?.content).toBe("Изучаю найденные детали...");

    vi.advanceTimersByTime(1_401);
    expect(currentStatus()).toBeUndefined();
  });

  it("keeps fast RAG statuses visible briefly after answer streaming starts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      initialLanguage: "ru",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; metadata?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({
      type: WSMessageType.THOUGHT,
      content: "Found 3 relevant context chunks",
      metadata: { status: "rag_found" },
    });
    vi.setSystemTime(1_500);
    invoke.handleRuntimeEvent({ type: WSMessageType.DELTA, content: "Ответ" });

    expect(service.store.getState().messages.some((m) => m.type === "status")).toBe(true);

    vi.advanceTimersByTime(901);
    expect(service.store.getState().messages.some((m) => m.type === "status")).toBe(false);
  });

  it("keeps fast RAG statuses visible briefly even when done arrives immediately", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      initialLanguage: "ru",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; metadata?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({
      type: WSMessageType.THOUGHT,
      content: "Found 3 relevant context chunks",
      metadata: { status: "rag_found" },
    });
    vi.setSystemTime(1_250);
    invoke.handleRuntimeEvent({ type: WSMessageType.DELTA, content: "Ответ" });
    vi.setSystemTime(1_300);
    invoke.handleRuntimeEvent({ type: WSMessageType.DONE, content: "" });

    expect(service.store.getState().messages.some((m) => m.type === "status")).toBe(true);

    vi.advanceTimersByTime(1_101);
    expect(service.store.getState().messages.some((m) => m.type === "status")).toBe(false);
  });

  it("updates dynamic suggestions from runtime ui.suggestions events", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      suggestions: ["Static"],
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; ui?: { items?: Array<Record<string, unknown>> }; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({
      type: WSMessageType.UI_SUGGESTIONS,
      ui: { items: [{ label: "Ask about prices" }, { label: " ", send: "Book a visit" }] },
    });

    expect(service.store.getState().suggestions).toEqual(["Ask about prices", "Book a visit"]);
  });

  it("clears previous dynamic suggestions when a new user message starts", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      body: stream,
    });

    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      suggestions: ["Static"],
    });
    service.store.setConnected(true);
    service.store.setSuggestions(["Old dynamic"]);
    const internal = service as unknown as {
      session: { token: string; sessionId: string };
    };
    internal.session = { token: "runtime-token", sessionId: "session-1" };

    await service.sendMessage("next question");

    expect(service.store.getState().suggestions).toEqual([]);
  });

  it("surfaces runtime SSE failures as error messages", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "token-1", sessionId: "session-1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => `{"error":"runtime unavailable"}`,
      });

    const service = new ChatService({
      siteToken: "site-token",
      identityUrl: "http://localhost:8100",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
    });

    await expect(service.sendMessage("hello")).rejects.toThrow("Runtime stream failed");

    const state = service.store.getState();
    expect(state.error).toContain("runtime unavailable");
    const errorMessage = state.messages.find((m) => m.type === "error");
    expect(errorMessage?.content).toContain("runtime unavailable");
    expect(state.isTyping).toBe(false);
  });

  it("maps runtime URLs for ws and sse transports", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
    });

    const internal = service as unknown as {
      resolveRuntimeUrl: (transport: "sse" | "ws") => string;
    };

    expect(internal.resolveRuntimeUrl("ws")).toBe("ws://localhost:8890/v1/chat/ws");
    expect(internal.resolveRuntimeUrl("sse")).toBe("http://localhost:8890/v1/chat/stream");
  });

  it("uses storageKey to isolate preview history and show a new welcome", () => {
    localStorageMock.set(
      "aulinq:chat_history:site-token",
      JSON.stringify([{ id: "old", role: "user", content: "old", timestamp: Date.now(), type: "text" }]),
    );

    const service = new ChatService({
      siteToken: "site-token",
      storageKey: "preview:new-content",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
      welcomeMessage: "Fresh welcome",
    });

    const messages = service.store.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe("Fresh welcome");
  });

  it("disconnect aborts active stream and closes websocket", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
    });

    const closeMock = vi.fn();
    const abortMock = vi.fn();
    const timeout = setTimeout(() => {}, 60_000);

    service.store.setConnected(true);

    const internal = service as unknown as {
      ws: { close: (code?: number, reason?: string) => void } | null;
      reconnectTimeout: ReturnType<typeof setTimeout> | null;
      activeStreamAbort: { abort: () => void } | null;
    };
    internal.ws = { close: closeMock };
    internal.reconnectTimeout = timeout;
    internal.activeStreamAbort = { abort: abortMock };

    service.disconnect();

    expect(closeMock).toHaveBeenCalledWith(1000, "Client disconnect");
    expect(abortMock).toHaveBeenCalled();
    expect(service.isConnected()).toBe(false);
  });
});
