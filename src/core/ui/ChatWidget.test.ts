/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatWidget } from "./ChatWidget";

const state = {
  messages: [] as Array<unknown>,
  isConnected: false,
  isConnecting: false,
  isTyping: false,
  isRecording: false,
  isSpeaking: false,
  ttsEnabled: false,
  error: null as string | null,
};

const sendMessage = vi.fn(async () => {});
const connect = vi.fn(async () => {});
const disconnect = vi.fn(() => {});
const clearMessages = vi.fn(() => {});
const subscribe = vi.fn((cb: () => void) => {
  cb();
  return () => {};
});

vi.mock("../services/ChatService", () => ({
  ChatService: class {
    store = {
      getState: () => state,
      subscribe,
    };
    connect = connect;
    disconnect = disconnect;
    sendMessage = sendMessage;
    clearMessages = clearMessages;
    setLanguage = vi.fn();
  },
}));

const theme = {
  render: (widgetState: string, _chatState: unknown, hasInput: boolean) => `
    <div class="chat-header"><button class="chat-header-button" data-action="close">x</button></div>
    <div class="chat-messages"></div>
    <textarea class="chat-input"></textarea>
    <button data-action="primary" ${hasInput ? "" : "disabled"}>send</button>
    <div data-state="${widgetState}"></div>
  `,
  getClassName: () => "test-theme",
};

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    state.messages = [];
    state.isConnecting = false;
    state.error = null;
    sendMessage.mockClear();
    connect.mockClear();
    disconnect.mockClear();
    clearMessages.mockClear();
  });

  it("auto-connects and toggles states via header", async () => {
    const widget = new ChatWidget({ siteToken: "t", mode: "floating" }, theme);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(widget.getWidgetState()).toBe("minimized");

    const header = document.querySelector(".chat-header") as HTMLElement;
    header.click();
    expect(widget.getWidgetState()).toBe("input-only");

    header.click();
    expect(widget.getWidgetState()).toBe("minimized");
    widget.destroy();
  });

  it("sends input and clears messages on close", async () => {
    const widget = new ChatWidget({ siteToken: "t", mode: "floating" }, theme);
    const textarea = document.querySelector(".chat-input") as HTMLTextAreaElement;
    textarea.value = "Hello";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    const sendBtn = document.querySelector('[data-action="primary"]') as HTMLButtonElement;
    sendBtn.click();

    await Promise.resolve();
    expect(sendMessage).toHaveBeenCalledWith("Hello");
    expect(widget.getWidgetState()).toBe("full");

    const closeBtn = document.querySelector('[data-action="close"]') as HTMLButtonElement;
    closeBtn.click();
    expect(clearMessages).toHaveBeenCalledTimes(1);
    expect(widget.getWidgetState()).toBe("input-only");
    widget.destroy();
  });

  it("reveals the welcome message incrementally", async () => {
    vi.useFakeTimers();
    state.messages = [
      {
        id: "welcome",
        role: "assistant",
        content: "Hello friend",
        timestamp: Date.now(),
        type: "text",
      },
    ];

    const render = vi.fn(theme.render);
    const widget = new ChatWidget(
      { siteToken: "t", mode: "inline", autoConnect: false },
      { ...theme, render },
    );

    const initialState = render.mock.calls.at(-1)?.[1] as typeof state;
    expect(initialState.messages[0]).toMatchObject({
      content: "",
      metadata: { presentationStreaming: true },
    });

    vi.advanceTimersByTime(18);
    await Promise.resolve();

    const nextState = render.mock.calls.at(-1)?.[1] as typeof state;
    expect(String(nextState.messages[0].content).length).toBeGreaterThan(0);
    expect(String(nextState.messages[0].content).length).toBeLessThan("Hello friend".length);

    widget.destroy();
    vi.useRealTimers();
  });

  it("pins streaming messages without starting smooth scroll animations", async () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 512,
    });

    try {
      state.messages = [
        {
          id: "welcome",
          role: "assistant",
          content: "A longer welcome message that should be revealed without scroll jitter.",
          timestamp: Date.now(),
          type: "text",
        },
      ];

      const widget = new ChatWidget({ siteToken: "t", mode: "inline", autoConnect: false }, theme);
      const messages = document.querySelector(".chat-messages") as HTMLElement;

      expect(messages.scrollTop).toBe(512);
      expect(scrollTo).not.toHaveBeenCalled();

      vi.advanceTimersByTime(18);
      await Promise.resolve();

      expect(scrollTo).not.toHaveBeenCalled();

      for (let i = 0; i < 50; i += 1) {
        vi.advanceTimersByTime(18);
        await Promise.resolve();
      }

      expect(scrollTo).not.toHaveBeenCalled();
      widget.destroy();
    } finally {
      if (originalScrollTo) {
        Object.defineProperty(HTMLElement.prototype, "scrollTo", {
          configurable: true,
          value: originalScrollTo,
        });
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
      }

      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollHeight;
      }
      vi.useRealTimers();
    }
  });

  it("preserves message scroll position on config-only rerenders", () => {
    const scrollTo = vi.fn();
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");

    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 512,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => 120,
    });

    try {
      state.messages = [
        {
          id: "done",
          role: "assistant",
          content: "Finished answer with enough text to make scrolling meaningful.",
          timestamp: Date.now(),
          type: "text",
        },
      ];

      const widget = new ChatWidget({ siteToken: "t", mode: "inline", autoConnect: false }, theme);
      const messages = document.querySelector(".chat-messages") as HTMLElement;
      messages.scrollTop = 160;

      widget.updateConfig({ variant: "blue", customColors: { primary: "#1E88E5" } });

      const rerenderedMessages = document.querySelector(".chat-messages") as HTMLElement;
      expect(rerenderedMessages.scrollTop).toBe(160);
      expect(scrollTo).not.toHaveBeenCalled();

      widget.destroy();
    } finally {
      if (originalScrollTo) {
        Object.defineProperty(HTMLElement.prototype, "scrollTo", {
          configurable: true,
          value: originalScrollTo,
        });
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
      }

      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollHeight;
      }
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).clientHeight;
      }
    }
  });
});
