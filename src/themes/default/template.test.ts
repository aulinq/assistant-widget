import { beforeAll, describe, expect, it } from "vitest";

import { renderUnified } from "./template";
import type { ChatState } from "../../core/types";

const baseState: ChatState = {
  messages: [],
  isConnected: false,
  isConnecting: false,
  isTyping: false,
  isRecording: false,
  isSpeaking: false,
  ttsEnabled: false,
  error: null,
  isInteractionBlocked: false,
};

describe("renderUnified", () => {
  beforeAll(() => {
    (globalThis as unknown as { document: { createElement: (tag: string) => { textContent: string; innerHTML: string } } }).document = {
      createElement: (_tag: string) => {
        let text = "";
        return {
          get textContent() {
            return text;
          },
          set textContent(value: string) {
            text = value ?? "";
          },
          get innerHTML() {
            return text
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;")
              .replaceAll("'", "&#39;");
          },
        };
      },
    };
  });

  it("groups status with preceding same-role message", () => {
    const html = renderUnified(
      "full",
      {
        ...baseState,
        messages: [
          { role: "assistant", content: "Hello", type: "text", timestamp: Date.now() },
          { role: "assistant", content: "Calling tool...", type: "status", timestamp: Date.now() + 1 },
        ],
      },
      { title: "Aulinq", placeholder: "Type", showClose: true, lang: "en" },
      true,
    );

    expect((html.match(/chat-message /g) ?? []).length).toBe(1);
    expect(html).toContain("chat-message-status");
    expect(html).toContain("Calling tool...");
  });

  it("keeps status standalone when role does not match previous message", () => {
    const html = renderUnified(
      "full",
      {
        ...baseState,
        messages: [
          { role: "user", content: "Hi", type: "text", timestamp: Date.now() },
          { role: "assistant", content: "Working...", type: "status", timestamp: Date.now() + 1 },
        ],
      },
      { title: "Aulinq", placeholder: "Type", showClose: true, lang: "en" },
      true,
    );

    expect((html.match(/chat-message /g) ?? []).length).toBe(2);
    expect(html).toContain("chat-status-standalone");
  });

  it("disables input while connecting and shows translated placeholder", () => {
    const html = renderUnified(
      "full",
      { ...baseState, isConnecting: true },
      { title: "Aulinq", placeholder: "Type", showClose: true, lang: "en" },
      true,
    );

    expect(html).toContain('placeholder="Connecting..."');
    expect(html).toContain("<textarea");
    expect(html).toContain("disabled");
  });

  it("shows suggestions after the initial welcome message", () => {
    const html = renderUnified(
      "full",
      {
        ...baseState,
        messages: [
          { role: "assistant", content: "Welcome to the clinic", type: "text", timestamp: Date.now() },
        ],
      },
      {
        title: "Aulinq",
        placeholder: "Type",
        showClose: true,
        lang: "en",
        suggestions: ["Book a visit", "Prices"],
      },
      false,
    );

    expect(html).toContain("Welcome to the clinic");
    expect(html).toContain("chat-suggestions");
    expect(html).toContain("Book a visit");
    expect(html).toContain("Prices");
  });

  it("prefers per-turn suggestions over static suggestions", () => {
    const html = renderUnified(
      "full",
      {
        ...baseState,
        suggestions: ["Dynamic price question"],
        messages: [{ id: "m1", role: "assistant", content: "Sure.", timestamp: Date.now(), type: "text" }],
      },
      {
        title: "Chat",
        placeholder: "Type...",
        showClose: true,
        lang: "en",
        suggestions: ["Static booking question"],
      },
      false,
    );

    expect(html).toContain("Dynamic price question");
    expect(html).not.toContain("Static booking question");
  });

  it("renders runtime errors as one human-readable alert after messages", () => {
    const html = renderUnified(
      "full",
      {
        ...baseState,
        error: "Runtime stream failed: quota_exceeded",
        messages: [
          { id: "m1", role: "user", content: "Цена?", timestamp: Date.now(), type: "text" },
          { id: "legacy-error", role: "assistant", content: "quota_exceeded", timestamp: Date.now(), type: "error" },
        ],
      },
      { title: "Консультант", placeholder: "Сообщение", showClose: true, lang: "ru", suggestions: ["Каталог"] },
      false,
    );

    expect((html.match(/class="chat-error"/g) ?? []).length).toBe(1);
    expect(html).toContain("Лимит запросов исчерпан");
    expect(html).not.toContain("quota_exceeded");
    expect(html).not.toContain("chat-suggestions");
  });

  it("blocks input and offers reconnect for startup errors", () => {
    const html = renderUnified(
      "full",
      {
        ...baseState,
        error: "Failed to fetch",
        isInteractionBlocked: true,
        messages: [{ id: "welcome", role: "assistant", content: "Здравствуйте", timestamp: Date.now(), type: "text" }],
      },
      { title: "Консультант", placeholder: "Сообщение", showClose: true, lang: "ru", suggestions: ["Каталог"] },
      true,
    );

    expect(html).toContain("Не удалось подключиться к чату");
    expect(html).toContain('data-action="retry-connection"');
    expect(html).toContain('placeholder="Чат недоступен"');
    expect(html).toContain('disabled aria-disabled="true"');
    expect(html).not.toContain("chat-suggestions");
  });
});
