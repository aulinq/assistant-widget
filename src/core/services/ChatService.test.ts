import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatService } from "./ChatService";
import { WSMessageType } from "../types";

describe("ChatService", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
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

  it("shows transient tool status for tool_call and tool_res events", () => {
    const service = new ChatService({
      siteToken: "site-token",
      runtimeUrl: "http://localhost:8890/v1/chat/stream",
    });

    const invoke = service as unknown as {
      handleRuntimeEvent: (data: { type: string; content?: string; payload?: Record<string, unknown>; timestamp?: number }) => void;
    };

    invoke.handleRuntimeEvent({ type: WSMessageType.TOOL_CALL, content: "Search CRM" });
    invoke.handleRuntimeEvent({ type: WSMessageType.TOOL_RES, content: "Found 3 results" });

    const statusMessages = service.store.getState().messages.filter((m) => m.type === "status");
    expect(statusMessages.length).toBe(1);
    expect(statusMessages[0].content).toContain("Tool result: Found 3 results");
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
