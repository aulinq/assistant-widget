import { D as h, b as l } from "../index-DW4odXKb.js";
import { jsx as v } from "react/jsx-runtime";
import { useRef as a, useEffect as p } from "react";
function y({
  theme: M = "default",
  variant: i,
  customColors: o,
  className: w = "",
  title: t,
  placeholder: s,
  lang: r,
  ...e
}) {
  const u = a(null), n = a(null);
  return p(() => {
    if (!u.current) return;
    const m = e.mode === "inline" ? void 0 : e.position, W = new h({
      title: t,
      placeholder: s,
      variant: i,
      customColors: o,
      lang: r,
      mode: e.mode,
      position: m,
      suggestions: e.suggestions
    }), d = new l(
      {
        ...e,
        title: t,
        placeholder: s,
        lang: r,
        position: m,
        container: u.current
      },
      W
    );
    return n.current = d, () => {
      d.destroy(), n.current = null;
    };
  }, [e.serverUrl, e.identityUrl, e.runtimeUrl, e.transport, e.siteToken, e.mode]), p(() => {
    n.current && n.current.updateConfig({
      title: t,
      placeholder: s,
      lang: r,
      variant: i,
      customColors: o,
      position: e.mode === "inline" ? void 0 : e.position,
      welcomeMessage: e.welcomeMessage,
      suggestions: e.suggestions
    });
  }, [t, s, r, i, o, e.position, e.mode, e.welcomeMessage, e.suggestions]), /* @__PURE__ */ v("div", { ref: u, className: `assistant-widget-container ${w}`.trim() });
}
export {
  y as ChatWidget,
  y as ChatWidgetWrapper
};
//# sourceMappingURL=index.js.map
