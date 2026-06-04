function f(s) {
  const {
    siteToken: l,
    theme: c = "brown",
    customColors: n = null,
    title: a = "Chat Support",
    placeholder: u = "Type your message...",
    lang: d = "en",
    cdnUrl: p = "https://cdn.aulinq.com/assistant-widget/v2/embed.js",
    serverUrl: e,
    identityUrl: m = "https://api.aulinq.com",
    runtimeUrl: $ = "https://runtime.aulinq.com/v1/chat/stream",
    transport: g = "sse",
    mode: t = "floating",
    containerId: i = "aulinq-assistant-widget",
    position: r
  } = s, w = n ? JSON.stringify(n, null, 2).split(`
`).map(
    (o, h) => h === 0 ? o : `    ${o}`
  ).join(`
`) : "null";
  return `<!-- Aulinq Chat Widget -->
${t === "inline" ? `<div id="${i}"></div>
` : ""}<script>
(function() {
  var config = {
    cdnUrl: '${p}',
    siteToken: '${l}',
    theme: '${c}',
    customColors: ${w},
    ${e ? `serverUrl: '${e}',` : ""}
    identityUrl: '${m}',
    runtimeUrl: '${$}',
    transport: '${g}',
    title: '${a}',
    placeholder: '${u}',
    lang: '${d}',
    mode: '${t}'${t === "inline" ? `,
    containerId: '${i}'` : ""}${r ? `,
    position: '${r}'` : ""}
  };

  window.aulinq = window.aulinq || function() {
    (window.aulinq.q = window.aulinq.q || []).push(arguments);
  };
  window.aulinq.l = +new Date();
  window.aulinq.config = config;

  var script = document.createElement('script');
  script.async = true;
  script.src = config.cdnUrl;
  script.onerror = function() {
    console.error('Failed to load Aulinq Chat Widget');
  };

  var firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
})();
<\/script>`;
}
function y(s) {
  const {
    siteToken: l,
    theme: c = "brown",
    customColors: n = null,
    title: a = "Chat Support",
    placeholder: u = "Type your message...",
    lang: d = "en",
    cdnUrl: p = "https://cdn.aulinq.com/assistant-widget/v2/embed.js",
    serverUrl: e,
    identityUrl: m = "https://api.aulinq.com",
    runtimeUrl: $ = "https://runtime.aulinq.com/v1/chat/stream",
    transport: g = "sse",
    mode: t = "floating",
    containerId: i = "aulinq-assistant-widget",
    position: r
  } = s, w = n ? JSON.stringify(n) : "null", o = e ? `,serverUrl:'${e}'` : "", h = t === "inline" ? `<div id="${i}"></div>` : "", q = t === "inline" ? `,containerId:'${i}'` : "", v = r ? `,position:'${r}'` : "";
  return `${h}<script>(function(){var c={cdnUrl:'${p}',siteToken:'${l}',theme:'${c}',customColors:${w}${o},identityUrl:'${m}',runtimeUrl:'${$}',transport:'${g}',title:'${a}',placeholder:'${u}',lang:'${d}',mode:'${t}'${q}${v}};window.aulinq=window.aulinq||function(){(window.aulinq.q=window.aulinq.q || []).push(arguments)};window.aulinq.l=+new Date();window.aulinq.config=c;var s=document.createElement('script');s.async=true;s.src=c.cdnUrl;s.onerror=function(){console.error('Failed to load Aulinq Chat Widget')};var f=document.getElementsByTagName('script')[0];f.parentNode.insertBefore(s,f)})();<\/script>`;
}
const U = f({
  siteToken: "site_abc123xyz",
  theme: "brown",
  customColors: null,
  title: "Customer Support",
  placeholder: "How can we help you?"
}), S = f({
  siteToken: "site_abc123xyz",
  theme: "custom",
  customColors: {
    primary: "#FF00FF",
    background: "#000000",
    textLight: "#FFFFFF"
  },
  title: "Custom Support",
  placeholder: "Ask us anything..."
});
export {
  S as exampleCustomColorScript,
  U as exampleScript,
  f as generateWidgetScript,
  y as generateWidgetScriptMinified
};
//# sourceMappingURL=generator.js.map
