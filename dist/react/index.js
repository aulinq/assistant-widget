/* empty css                 */
import { jsx as R } from "react/jsx-runtime";
import { useRef as w, useEffect as m } from "react";
import { D as h, C as v } from "../index-C1lhhCiE.js";
function D({
  theme: y = "default",
  openSignal: d = 0,
  variant: n,
  customColors: u,
  className: W = "",
  title: s,
  placeholder: r,
  lang: i,
  ...e
}) {
  const o = w(null), t = w(null);
  return m(() => {
    if (!o.current) return;
    const a = e.mode === "inline" ? void 0 : e.position, l = new h({
      title: s,
      placeholder: r,
      variant: n,
      customColors: u,
      lang: i,
      mode: e.mode,
      position: a,
      suggestions: e.suggestions
    }), p = new v(
      {
        ...e,
        title: s,
        placeholder: r,
        lang: i,
        position: a,
        container: o.current
      },
      l
    );
    return t.current = p, () => {
      p.destroy(), t.current = null;
    };
  }, [e.serverUrl, e.identityUrl, e.runtimeUrl, e.transport, e.siteToken, e.storageKey, e.mode, e.siteRuntime]), m(() => {
    d && t.current?.setWidgetState("full");
  }, [d]), m(() => {
    t.current && t.current.updateConfig({
      title: s,
      placeholder: r,
      lang: i,
      variant: n,
      customColors: u,
      position: e.mode === "inline" ? void 0 : e.position,
      welcomeMessage: e.welcomeMessage,
      suggestions: e.suggestions
    });
  }, [s, r, i, n, u, e.position, e.mode, e.welcomeMessage, e.suggestions]), /* @__PURE__ */ R("div", { ref: o, className: `assistant-widget-container ${W}`.trim() });
}
export {
  D as ChatWidget,
  D as ChatWidgetWrapper
};
//# sourceMappingURL=index.js.map
