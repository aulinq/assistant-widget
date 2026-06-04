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
import { renderUnified } from './template';

export const standardPalettes: Record<ThemeVariant, ThemeColorPalette> = {
  brown: {
    primary: '#814133',
    accentIcon: '#BA7263',
    glass: 'rgba(255, 255, 255, 0.1)',
  },
  dark: {
    primary: '#333333',
    accentIcon: '#999999',
    glass: 'rgba(255, 255, 255, 0.05)',
  },
  light: {
    primary: '#f8f9fa',
    accentIcon: '#71717a',
    glass: 'rgba(0, 0, 0, 0.06)',
  },
  yellow: {
    primary: '#FFB300',
    accentIcon: '#FFCA28',
    glass: 'rgba(255, 255, 255, 0.25)',
  },
  red: {
    primary: '#FF5252',
    accentIcon: '#FF8A80',
    glass: 'rgba(255, 255, 255, 0.2)',
  },
  green: {
    primary: '#43A047',
    accentIcon: '#66BB6A',
    glass: 'rgba(255, 255, 255, 0.2)',
  },
  blue: {
    primary: '#1E88E5',
    accentIcon: '#42A5F5',
    glass: 'rgba(255, 255, 255, 0.2)',
  },
  purple: {
    primary: '#6366f1',
    accentIcon: '#8b5cf6',
    glass: 'rgba(255, 255, 255, 0.15)',
  },
  custom: {}
};

export class DefaultTheme implements ChatWidgetTheme {
  private config!: Required<DefaultThemeConfig>;
  private customColors?: ThemeColorPalette;

  constructor(config: DefaultThemeConfig = {}) {
    this.updateConfig(config);
  }

  updateConfig(config: DefaultThemeConfig): void {
    const lang = config.lang || this.config?.lang || 'en';
    const defaults = {
      en: {
        title: 'Chat',
        placeholder: 'Type a message...',
      },
      ru: {
        title: 'Чат',
        placeholder: 'Введите сообщение...',
      }
    };

    const t = defaults[lang as keyof typeof defaults] || defaults.en;

    const mode = config.mode || this.config?.mode || 'floating';

    this.config = {
      title: config.title || t.title,
      placeholder: config.placeholder || t.placeholder,
      showClose: config.showClose !== false,
      variant: config.variant || (this.config?.variant || 'brown'),
      customColors: config.customColors || (this.config?.customColors || {}),
      lang: lang as 'ru' | 'en',
      mode,
      position: mode === 'inline' ? 'bottom' : (config.position || this.config?.position || 'bottom'),
      suggestions: config.suggestions || (this.config?.suggestions || []),
    };
    this.customColors = this.config.customColors;
  }

  setLanguage(lang: 'ru' | 'en'): void {
    this.updateConfig({ lang });
  }

  render(state: WidgetState, chatState: ChatState, hasInput: boolean): string {
    const variant = this.config.variant;
    const basePalette = standardPalettes[variant] || {};
    // Only merge custom colors if the variant is 'custom', so standard theme contrast calculations are not polluted by custom color props passed in background previews
    const mergedColors = variant === 'custom'
      ? { ...basePalette, ...this.customColors }
      : { ...basePalette };
    
    // Always generate a custom style block dynamically mapping and analyzing contrast for active palette
    const styleTag = `<style>
         .theme-default.theme-variant-${variant} {
           ${Object.entries(this.mapColorsToVars(mergedColors)).map(([k, v]) => `${k}: ${v};`).join('\n')}
           ${mergedColors.background ? `background: ${mergedColors.background} !important;` : ''}
         }
         </style>`;

    return styleTag + renderUnified(state, chatState, this.config, hasInput);
  }

  getClassName(): string {
    return `theme-default theme-variant-${this.config.variant}`;
  }

  getCSSPath(): string | undefined {
    return undefined;
  }

  private mapColorsToVars(colors: ThemeColorPalette): Record<string, string> {
    const vars: Record<string, string> = {};
    if (colors.primary) vars['--theme-primary'] = colors.primary;
    if (colors.background) vars['--theme-background'] = colors.background;
    if (colors.foreground) vars['--theme-foreground'] = colors.foreground;
    if (colors.muted) vars['--theme-muted'] = colors.muted;
    if (colors.border) vars['--theme-border'] = colors.border;
    if (colors.accentIcon) vars['--theme-accent-icon'] = colors.accentIcon;
    if (colors.overlay) vars['--theme-overlay'] = colors.overlay;
    if (colors.glass) vars['--theme-glass'] = colors.glass;
    if (colors.textLight) vars['--theme-text-light'] = colors.textLight;
    if (colors.textMuted) vars['--theme-text-muted'] = colors.textMuted;

    // Dynamically calculate and apply high-contrast fallbacks for text, icons, and borders if background is light.
    // Use background if supplied, otherwise fall back to primary color.
    const baseColor = colors.background || colors.primary;
    if (baseColor) {
      const light = isLightColor(baseColor);
      console.log('[Theme] baseColor:', baseColor, 'isLightColor:', light);
      
      if (!colors.textLight) {
        vars['--theme-text-light'] = light ? '#101010' : '#ffffff';
      }
      if (!colors.textMuted) {
        vars['--theme-text-muted'] = light ? 'rgba(16, 16, 16, 0.7)' : 'rgba(255, 255, 255, 0.7)';
      }
      if (!colors.accentIcon) {
        vars['--theme-accent-icon'] = light ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
      }
      if (!colors.glass) {
        vars['--theme-glass'] = light ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      }
      if (!colors.border) {
        vars['--theme-border'] = light ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      }
    }

    return vars;
  }
}

/**
 * Calculates WCAG relative luminance of a color to determine if it is "light" or "dark".
 * Supports HEX format (#fff, #ffffff, #ffffff00), RGB/RGBA, and basic color names.
 */
function isLightColor(colorStr: string): boolean {
  if (!colorStr) return false;
  colorStr = colorStr.trim().toLowerCase();
  
  let r = 0, g = 0, b = 0;
  
  if (colorStr.startsWith('#')) {
    const hex = colorStr.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (colorStr.startsWith('rgb')) {
    const matches = colorStr.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0], 10);
      g = parseInt(matches[1], 10);
      b = parseInt(matches[2], 10);
    }
  } else {
    const colors: Record<string, [number, number, number]> = {
      white: [255, 255, 255],
      yellow: [255, 255, 0],
      lightgray: [211, 211, 211],
      lightgrey: [211, 211, 211],
      silver: [192, 192, 192],
      gray: [128, 128, 128],
      grey: [128, 128, 128],
      black: [0, 0, 0],
    };
    if (colors[colorStr]) {
      [r, g, b] = colors[colorStr];
    }
  }
  
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const lR = rNorm <= 0.03928 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
  const lG = gNorm <= 0.03928 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
  const lB = bNorm <= 0.03928 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);
  
  const luminance = 0.2126 * lR + 0.7152 * lG + 0.0722 * lB;
  return luminance > 0.5;
}
