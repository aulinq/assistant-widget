export interface ThemeColorPalette {
    primary?: string;
    background?: string;
    foreground?: string;
    muted?: string;
    border?: string;
    accentIcon?: string;
    overlay?: string;
    glass?: string;
    textLight?: string;
    textMuted?: string;
    linkColor?: string;
    linkHover?: string;
}
export type ThemeVariant = 'brown' | 'dark' | 'light' | 'yellow' | 'red' | 'green' | 'blue' | 'purple' | 'custom';
export interface DefaultThemeConfig {
    title?: string;
    placeholder?: string;
    showClose?: boolean;
    variant?: ThemeVariant;
    customColors?: ThemeColorPalette;
    lang?: 'ru' | 'en';
    mode?: string;
    position?: string;
    suggestions?: string[];
}
import { ChatWidgetTheme } from '../../core/ui/ChatWidget';
import { ChatState, WidgetState } from '../../core/types';
export declare const standardPalettes: Record<ThemeVariant, ThemeColorPalette>;
export declare class DefaultTheme implements ChatWidgetTheme {
    private config;
    private customColors?;
    constructor(config?: DefaultThemeConfig);
    updateConfig(config: DefaultThemeConfig): void;
    setLanguage(lang: 'ru' | 'en'): void;
    render(state: WidgetState, chatState: ChatState, hasInput: boolean): string;
    getClassName(): string;
    getCSSPath(): string | undefined;
    private mapColorsToVars;
}
//# sourceMappingURL=index.d.ts.map