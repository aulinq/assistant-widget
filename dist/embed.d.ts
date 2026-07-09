/**
 * CDN Embeddable Chat Widget
 * Can be loaded via <script> tag and initialized with global ChatWidget
 *
 * Usage:
 * <script src="https://cdn.example.com/assistant-widget.js"></script>
 * <script>
 *   ChatWidget.init({
 *     identityUrl: 'http://localhost:8100',
 *     runtimeUrl: 'http://localhost:8890/v1/chat/stream',
 *     siteToken: 'your-token',
 *     theme: 'default',
 *     title: 'Chat',
 *   });
 * </script>
 */
import { ChatWidget, ChatWidgetConfig } from './core/ui/ChatWidget';
import { ThemeVariant } from './themes/default';
declare global {
    interface Window {
        ChatWidget: {
            init: (config: ChatWidgetConfig & {
                theme?: 'default';
                variant?: ThemeVariant;
                customColors?: Record<string, string>;
            }) => ChatWidget;
            version: string;
        };
        aulinq?: {
            (command: string, ...args: unknown[]): void;
            q?: unknown[][];
            l?: number;
            config?: {
                cdnUrl: string;
                siteToken: string;
                theme?: ThemeVariant;
                customColors?: Record<string, string> | null;
                serverUrl?: string;
                identityUrl?: string;
                runtimeUrl?: string;
                transport?: 'sse' | 'ws';
                title?: string;
                placeholder?: string;
                lang?: string;
                mode?: 'floating' | 'inline';
                containerId?: string;
                position?: string;
                welcomeMessage?: string;
                suggestions?: string[];
            };
        };
    }
}
export {};
//# sourceMappingURL=embed.d.ts.map