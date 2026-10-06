/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatWidget } from "./ChatWidget";
import { DefaultTheme } from "../../themes/default";
import type { Recognition, SpeechWindow } from "../utils/dictation";

const state = {
  messages: [] as Array<unknown>,
  isConnected: false,
  isConnecting: false,
  isTyping: false,
  isRecording: false,
  isSpeaking: false,
  ttsEnabled: false,
  error: null as string | null,
  isInteractionBlocked: false,
};

const sendMessage = vi.fn(async () => {});
const connect = vi.fn(async () => {});
const disconnect = vi.fn(() => {});
const clearMessages = vi.fn(() => {});
const subscribe = vi.fn((cb: (nextState: typeof state) => void) => {
  cb(state);
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
    delete (window as SpeechWindow).SpeechRecognition;
    delete (window as SpeechWindow).webkitSpeechRecognition;
    document.body.innerHTML = "";
    state.messages = [];
    state.isConnecting = false;
    state.error = null;
    state.isInteractionBlocked = false;
    sendMessage.mockClear();
    connect.mockClear();
    disconnect.mockClear();
    clearMessages.mockClear();
  });

  function mockRecognition() {
    const instances: Recognition[] = [];
    class MockRecognition implements Recognition {
      lang = ''; interimResults = false; continuous = true;
      onresult: Recognition['onresult'] = null;
      onend: Recognition['onend'] = null;
      onerror: Recognition['onerror'] = null;
      start = vi.fn();
      stop = vi.fn(() => this.onend?.());
      abort = vi.fn();
      constructor() { instances.push(this); }
    }
    (window as SpeechWindow).webkitSpeechRecognition = MockRecognition;
    return instances;
  }

  it('dictates into the draft without duplicating interim results or sending before stopping', async () => {
    const instances = mockRecognition();
    const widget = new ChatWidget({siteToken: 't', lang: 'ru-RU', autoConnect: false}, new DefaultTheme({lang: 'ru'}));
    widget.setWidgetState('full');
    const input = document.querySelector('.chat-input') as HTMLTextAreaElement;
    input.value = 'Заказ'; input.dispatchEvent(new Event('input'));
    (document.querySelector('[data-action="dictation"]') as HTMLElement).click();
    const recognition = instances[0];
    expect(recognition.lang).toBe('ru-RU');
    expect(recognition.interimResults).toBe(true);
    expect(recognition.continuous).toBe(false);
    recognition.onresult?.({results: [[{transcript: 'две'}]]});
    recognition.onresult?.({results: [[{transcript: 'две двери'}]]});
    expect((document.querySelector('.chat-input') as HTMLTextAreaElement).value).toBe('Заказ две двери');
    expect((document.querySelector('[data-action="primary"]') as HTMLButtonElement).disabled).toBe(true);
    expect(sendMessage).not.toHaveBeenCalled();
    (document.querySelector('[data-action="dictation"]') as HTMLElement).click();
    (document.querySelector('[data-action="primary"]') as HTMLElement).click();
    await Promise.resolve();
    expect(sendMessage).toHaveBeenCalledWith('Заказ две двери');
    widget.destroy();
  });

  it('allows typing when recognition is unsupported', () => {
    const widget = new ChatWidget({siteToken: 't', autoConnect: false}, new DefaultTheme({lang: 'ru'}));
    widget.setWidgetState('full');
    (document.querySelector('[data-action="dictation"]') as HTMLElement).click();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Голосовой ввод недоступен');
    expect((document.querySelector('.chat-input') as HTMLTextAreaElement).disabled).toBe(false);
    widget.destroy();
  });

  it('handles microphone errors and aborts recognition on clear, collapse and destruction', () => {
    const instances = mockRecognition();
    const widget = new ChatWidget({siteToken: 't', autoConnect: false}, new DefaultTheme());
    widget.setWidgetState('full');
    const start = () => (document.querySelector('[data-action="dictation"]') as HTMLElement).click();
    start(); instances[0].onerror?.();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Voice input is unavailable');
    start(); (document.querySelector('[data-action="close"]') as HTMLElement).click();
    expect(instances[1].abort).toHaveBeenCalledOnce();
    expect(instances[1].onresult).toBeNull();
    start(); widget.setWidgetState('minimized');
    expect(instances[2].abort).toHaveBeenCalledOnce();
    widget.setWidgetState('full'); start(); widget.destroy();
    expect(instances[3].abort).toHaveBeenCalledOnce();
  });

  it('places clear before collapse and toggles via the accessible button', () => {
    const widget = new ChatWidget({siteToken: 't', autoConnect: false}, new DefaultTheme());
    widget.setWidgetState('full');
    expect(Array.from(document.querySelectorAll('.chat-header-actions button')).map(b => b.getAttribute('data-action'))).toEqual(['close', 'toggle']);
    (document.querySelector('[data-action="toggle"]') as HTMLElement).click();
    expect(widget.getWidgetState()).toBe('minimized');
    expect(clearMessages).not.toHaveBeenCalled();
    widget.destroy();
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

  it('keeps the restored welcome and original quick questions visible after clear', () => {
    vi.useFakeTimers();
    clearMessages.mockImplementationOnce(() => {
      state.messages = [{id: 'welcome', role: 'assistant', content: 'Welcome', type: 'text'}];
    });
    const widget = new ChatWidget({siteToken: 't', autoConnect: false}, new DefaultTheme({suggestions: ['Start here']}));
    widget.setWidgetState('full');
    const input = document.querySelector('.chat-input') as HTMLTextAreaElement;
    input.value = 'Unsent draft'; input.dispatchEvent(new Event('input'));
    (document.querySelector('[data-action="close"]') as HTMLElement).click();
    vi.runAllTimers();
    expect(widget.getWidgetState()).toBe('full');
    expect(document.querySelector('.chat-messages')?.textContent).toContain('Welcome');
    expect(document.querySelector('[data-action="suggestion"]')?.textContent).toBe('Start here');
    expect((document.querySelector('.chat-input') as HTMLTextAreaElement).value).toBe('');
    widget.destroy();
  });

  it("does not send while a startup error blocks interaction", async () => {
    state.error = "Failed to fetch";
    state.isInteractionBlocked = true;

    const widget = new ChatWidget({ siteToken: "t", mode: "floating", autoConnect: false }, theme);
    expect(widget.getWidgetState()).toBe("full");

    const textarea = document.querySelector(".chat-input") as HTMLTextAreaElement;
    textarea.value = "Hello";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    const sendBtn = document.querySelector('[data-action="primary"]') as HTMLButtonElement;
    sendBtn.click();

    await Promise.resolve();
    expect(sendMessage).not.toHaveBeenCalled();
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
