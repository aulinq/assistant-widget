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
export declare function generateWidgetScript(config: WidgetScriptConfig): string;
/**
 * Generate a minified version of the loader script
 */
export declare function generateWidgetScriptMinified(config: WidgetScriptConfig): string;
/**
 * Example usage for testing
 */
export declare const exampleScript: string;
export declare const exampleCustomColorScript: string;
//# sourceMappingURL=generator.d.ts.map