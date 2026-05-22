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
});
