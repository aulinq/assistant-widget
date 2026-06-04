/**
 * Script Generator for Dashboard
 *
 * This utility generates the loader script that users copy from their dashboard.
 *
 * Usage in dashboard:
 * ```typescript
 * import { generateWidgetScript } from '@aulinq/assistant-widget/generator';
 *
 * const script = generateWidgetScript({
 *   siteToken: user.siteToken,
 *   theme: user.preferences.theme,
 *   customColors: user.preferences.customColors,
 *   title: user.preferences.title,
 *   placeholder: user.preferences.placeholder,
 * });
 * ```
 */

export interface WidgetScriptConfig {
  siteToken: string;
  theme?: 'brown' | 'dark' | 'light' | 'yellow' | 'red' | 'green' | 'blue' | 'custom';
  customColors?: {
    primary?: string;
    background?: string;
    textLight?: string;
  } | null;
  title?: string;
  placeholder?: string;
  lang?: 'ru' | 'en';
  cdnUrl?: string;
  serverUrl?: string;
  identityUrl?: string;
  runtimeUrl?: string;
  transport?: 'sse' | 'ws';
  mode?: 'floating' | 'inline';
  containerId?: string;
  position?: string;
}

/**
 * Generate the loader script for embedding in user's website
 */
export function generateWidgetScript(config: WidgetScriptConfig): string {
  const {
    siteToken,
    theme = 'brown',
    customColors = null,
    title = 'Chat Support',
    placeholder = 'Type your message...',
    lang = 'en',
    cdnUrl = 'https://cdn.aulinq.com/assistant-widget/v2/embed.js',
    serverUrl,
    identityUrl = 'https://api.aulinq.com',
    runtimeUrl = 'https://runtime.aulinq.com/v1/chat/stream',
    transport = 'sse',
    mode = 'floating',
    containerId = 'aulinq-assistant-widget',
    position,
  } = config;

  // Format custom colors for script
  const customColorsStr = customColors
    ? JSON.stringify(customColors, null, 2).split('\n').map((line, i) =>
        i === 0 ? line : `    ${line}`
      ).join('\n')
    : 'null';

  return `<!-- Aulinq Chat Widget -->
${mode === 'inline' ? `<div id="${containerId}"></div>\n` : ''}<script>
(function() {
  var config = {
    cdnUrl: '${cdnUrl}',
    siteToken: '${siteToken}',
    theme: '${theme}',
    customColors: ${customColorsStr},
    ${serverUrl ? `serverUrl: '${serverUrl}',` : ''}
    identityUrl: '${identityUrl}',
    runtimeUrl: '${runtimeUrl}',
    transport: '${transport}',
    title: '${title}',
    placeholder: '${placeholder}',
    lang: '${lang}',
    mode: '${mode}'${mode === 'inline' ? `,
    containerId: '${containerId}'` : ''}${position ? `,
    position: '${position}'` : ''}
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
</script>`;
}

/**
 * Generate a minified version of the loader script
 */
export function generateWidgetScriptMinified(config: WidgetScriptConfig): string {
  const {
    siteToken,
    theme = 'brown',
    customColors = null,
    title = 'Chat Support',
    placeholder = 'Type your message...',
    lang = 'en',
    cdnUrl = 'https://cdn.aulinq.com/assistant-widget/v2/embed.js',
    serverUrl,
    identityUrl = 'https://api.aulinq.com',
    runtimeUrl = 'https://runtime.aulinq.com/v1/chat/stream',
    transport = 'sse',
    mode = 'floating',
    containerId = 'aulinq-assistant-widget',
    position,
  } = config;

  const customColorsStr = customColors ? JSON.stringify(customColors) : 'null';
  const serverUrlStr = serverUrl ? `,serverUrl:'${serverUrl}'` : '';
  const inlinePrefix = mode === 'inline' ? `<div id="${containerId}"></div>` : '';
  const containerStr = mode === 'inline' ? `,containerId:'${containerId}'` : '';
  const positionStr = position ? `,position:'${position}'` : '';

  return `${inlinePrefix}<script>(function(){var c={cdnUrl:'${cdnUrl}',siteToken:'${siteToken}',theme:'${theme}',customColors:${customColorsStr}${serverUrlStr},identityUrl:'${identityUrl}',runtimeUrl:'${runtimeUrl}',transport:'${transport}',title:'${title}',placeholder:'${placeholder}',lang:'${lang}',mode:'${mode}'${containerStr}${positionStr}};window.aulinq=window.aulinq||function(){(window.aulinq.q=window.aulinq.q || []).push(arguments)};window.aulinq.l=+new Date();window.aulinq.config=c;var s=document.createElement('script');s.async=true;s.src=c.cdnUrl;s.onerror=function(){console.error('Failed to load Aulinq Chat Widget')};var f=document.getElementsByTagName('script')[0];f.parentNode.insertBefore(s,f)})();</script>`;
}

/**
 * Example usage for testing
 */
export const exampleScript = generateWidgetScript({
  siteToken: 'site_abc123xyz',
  theme: 'brown',
  customColors: null,
  title: 'Customer Support',
  placeholder: 'How can we help you?',
});

export const exampleCustomColorScript = generateWidgetScript({
  siteToken: 'site_abc123xyz',
  theme: 'custom',
  customColors: {
    primary: '#FF00FF',
    background: '#000000',
    textLight: '#FFFFFF',
  },
  title: 'Custom Support',
  placeholder: 'Ask us anything...',
});
