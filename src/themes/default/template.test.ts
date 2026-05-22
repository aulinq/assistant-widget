import { beforeAll, describe, expect, it } from "vitest";

import { renderUnified } from "./template";
import type { ChatState } from "../../core/types";

const baseState: ChatState = {
  messages: [],
  isConnecting: false,
  isTyping: false,
  connectionId: null,
  lastError: null,
  error: null,
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
});
