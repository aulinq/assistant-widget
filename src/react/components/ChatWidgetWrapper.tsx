import { useEffect, useRef } from 'react';
import { ChatWidget, type ChatWidgetConfig } from '../../core';
import { DefaultTheme, ThemeVariant, ThemeColorPalette } from '../../themes/default';

export interface ChatWidgetWrapperProps extends Omit<ChatWidgetConfig, 'container'> {
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
export function ChatWidgetWrapper({
  theme = 'default',
  variant,
  customColors,
  className = '',
  title,
  placeholder,
  lang,
  ...config
}: ChatWidgetWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<ChatWidget | null>(null);

  // Handle critical config changes (requires re-instantiation)
  useEffect(() => {
    if (!containerRef.current) return;
    const effectivePosition = config.mode === 'inline' ? undefined : config.position;

    // Create theme instance
    const themeInstance = new DefaultTheme({ 
      title, 
      placeholder,
      variant,
      customColors,
      lang,
      mode: config.mode,
      position: effectivePosition,
      suggestions: config.suggestions,
    });

    // Create widget instance
    const widget = new ChatWidget(
      {
        ...config,
        title,
        placeholder,
        lang,
        position: effectivePosition,
        container: containerRef.current,
      },
      themeInstance
    );

    widgetRef.current = widget;

    // Cleanup on unmount
    return () => {
      widget.destroy();
      widgetRef.current = null;
    };
  }, [config.serverUrl, config.identityUrl, config.runtimeUrl, config.transport, config.siteToken, config.mode]);

  // Handle dynamic property updates (re-uses existing instance)
  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.updateConfig({
        title,
        placeholder,
        lang,
        variant,
        customColors,
        position: config.mode === 'inline' ? undefined : config.position,
        welcomeMessage: config.welcomeMessage,
        suggestions: config.suggestions,
      });
    }
  }, [title, placeholder, lang, variant, customColors, config.position, config.mode, config.welcomeMessage, config.suggestions]);


  return <div ref={containerRef} className={`assistant-widget-container ${className}`.trim()} />;
}
