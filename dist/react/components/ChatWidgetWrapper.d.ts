import { type ChatWidgetConfig } from '../../core';
import { ThemeVariant, ThemeColorPalette } from '../../themes/default';
export interface ChatWidgetWrapperProps extends Omit<ChatWidgetConfig, 'container'> {
    openSignal?: number;
    theme?: 'default';
    variant?: ThemeVariant;
    customColors?: ThemeColorPalette;
    className?: string;
    position?: string;
}
/**
 * React wrapper for vanilla ChatWidget
 * This is just a thin layer that mounts the headless widget
 */
export declare function ChatWidgetWrapper({ theme, openSignal, variant, customColors, className, title, placeholder, lang, ...config }: ChatWidgetWrapperProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatWidgetWrapper.d.ts.map