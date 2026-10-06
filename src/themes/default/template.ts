import { marked } from 'marked';
import { getComposerCopy, type ComposerState } from '../../core/utils/dictation';
import { getChatErrorPresentation } from '../../core/errors';
import type { ChatState, Message, WidgetState } from '../../core/types';

/**
 * Default theme HTML templates
 * Pure string templates for vanilla JS rendering
 */

const translations = {
  en: {
    connecting: 'Connecting...',
    unavailable: 'Chat unavailable',
    clearChat: 'Clear Chat',
    retryConnection: 'Try connecting again',
    sendMessage: 'Send message',
  },
  ru: {
    connecting: 'Подключение...',
    unavailable: 'Чат недоступен',
    clearChat: 'Очистить чат',
    retryConnection: 'Подключиться снова',
    sendMessage: 'Отправить сообщение',
  },
  es: {
    connecting: 'Conectando...',
    unavailable: 'Chat no disponible',
    clearChat: 'Borrar chat',
    retryConnection: 'Conectar de nuevo',
    sendMessage: 'Enviar mensaje',
  },
  pt: {
    connecting: 'Conectando...',
    unavailable: 'Chat indisponível',
    clearChat: 'Limpar chat',
    retryConnection: 'Conectar novamente',
    sendMessage: 'Enviar mensagem',
  },
  fr: {
    connecting: 'Connexion...',
    unavailable: 'Chat indisponible',
    clearChat: 'Effacer le chat',
    retryConnection: 'Se reconnecter',
    sendMessage: 'Envoyer le message',
  },
  de: {
    connecting: 'Verbindung wird hergestellt...',
    unavailable: 'Chat nicht verfügbar',
    clearChat: 'Chat leeren',
    retryConnection: 'Erneut verbinden',
    sendMessage: 'Nachricht senden',
  },
  it: {
    connecting: 'Connessione...',
    unavailable: 'Chat non disponibile',
    clearChat: 'Cancella chat',
    retryConnection: 'Connetti di nuovo',
    sendMessage: 'Invia messaggio',
  }
};

export function renderUnified(
  widgetState: WidgetState,
  state: ChatState,
  config: { title: string; placeholder: string; showClose: boolean; lang: string; mode?: string; position?: string; suggestions?: string[] },
  hasInput: boolean,
  composer: ComposerState = {}
): string {
  const { messages, isConnecting, isTyping, error, isInteractionBlocked } = state;
  const lang = config.lang || 'en';
  const locale = lang.toLowerCase().split(/[-_]/)[0] as keyof typeof translations;
  const t = translations[locale] || translations.en;

  const voice = getComposerCopy(lang);

  const latestMessageError = [...messages].reverse().find((message) => message.type === 'error');
  const rawError = error || latestMessageError?.content || '';
  const renderableMessages = messages.filter((message) => message.type !== 'error');

  // Group messages with their following status messages
  const groupedMessages = groupMessagesWithStatus(renderableMessages);

  const arrowIcon = config.position === 'top' ? iconDownArrow() :
                    config.position === 'left' ? iconRightArrow() :
                    config.position === 'right' ? iconLeftArrow() :
                    iconUpArrow();

  let suggestionsHtml = '';
  const suggestions = state.suggestions ?? config.suggestions ?? [];
  const lastMessage = [...renderableMessages].reverse().find((message) => message.type !== 'status');
  const showSuggestions = Boolean(
    suggestions.length > 0 &&
    !rawError &&
    !isConnecting &&
    !isTyping &&
    lastMessage?.role === 'assistant' &&
    !lastMessage.metadata?.presentationStreaming
  );
  if (showSuggestions) {
    suggestionsHtml = `<div class="chat-suggestions">${suggestions.map(s => 
      `<button class="chat-suggestion-chip" data-action="suggestion" data-suggestion="${escapeHtml(s)}">${escapeHtml(s)}</button>`
    ).join('')}</div>`;
  }

  const errorHtml = rawError ? renderError(rawError, lang, isInteractionBlocked, t.retryConnection) : '';
  const inputDisabled = isConnecting || isInteractionBlocked;
  const inputPlaceholder = isConnecting ? t.connecting : (isInteractionBlocked ? t.unavailable : config.placeholder);

  const toggleLabel = widgetState === 'minimized' ? voice.expand : voice.minimize;
  const micLabel = composer.recording ? voice.micStop : voice.mic;
  return `<div class="assistant-widget-content">
    <div class="chat-header" ${widgetState === 'minimized' ? 'data-clickable="expand"' : 'data-clickable="minimize"'}>
      <div class="chat-header-group"><span class="chat-header-title">${config.title}</span></div>
      <div class="chat-header-actions">
        ${config.showClose && widgetState === 'full' ? `<button type="button" class="chat-header-button action-close" data-action="close" title="${t.clearChat}" aria-label="${t.clearChat}">${iconTrash()}</button>` : ''}
        ${config.mode !== 'inline' ? `<button type="button" class="chat-header-button" data-action="toggle" title="${toggleLabel}" aria-label="${toggleLabel}"><span class="chat-header-icon-arrow">${arrowIcon}</span></button>` : ''}
      </div>
    </div>
    <div class="chat-messages">${groupedMessages.map((group, index) => renderMessageGroup(group, isTyping && index === groupedMessages.length - 1)).join('')}${errorHtml}${suggestionsHtml}</div>
    <div class="chat-input-container${inputDisabled ? ' chat-input-container-disabled' : ''}">
      <textarea class="chat-input" placeholder="${inputPlaceholder}" ${inputDisabled || composer.recording ? 'disabled aria-disabled="true"' : ''} rows="1"></textarea>
      <button type="button" class="chat-input-button chat-mic-button${composer.recording ? ' recording' : ''}" data-action="dictation" title="${micLabel}" aria-label="${micLabel}" aria-pressed="${Boolean(composer.recording)}" ${inputDisabled ? 'disabled' : ''}>${composer.recording ? iconStop() : iconMic()}</button>
      <button type="button" class="chat-input-button" data-action="primary" aria-label="${t.sendMessage}" ${inputDisabled || !hasInput || composer.recording ? 'disabled' : ''}>${iconSend()}</button>
    </div>
    ${composer.dictationError ? `<div class="chat-dictation-error" role="alert">${voice.unavailable}</div>` : ''}
  </div>`;
}

function renderError(rawError: string, lang: string, isBlocking: boolean, retryLabel: string): string {
  const error = getChatErrorPresentation(rawError, lang, isBlocking ? 'connection' : 'request');
  const retry = isBlocking
    ? `<button class="chat-error-action" type="button" data-action="retry-connection">${escapeHtml(retryLabel)}</button>`
    : '';

  return `<div class="chat-error" role="alert" aria-live="assertive"><div class="chat-error-icon" aria-hidden="true">${iconAlert()}</div><div class="chat-error-content"><div class="chat-error-title">${escapeHtml(error.title)}</div><div class="chat-error-message">${escapeHtml(error.message)}</div>${retry}</div></div>`;
}

function groupMessagesWithStatus(messages: Message[]): Array<{main: Message, status?: Message}> {
  const groups: Array<{main: Message, status?: Message}> = [];

  for (const msg of messages) {
    if (msg.type === 'status') {
      const lastGroup = groups[groups.length - 1];
      // Only group if roles match (Ensures status is aligned with its related message)
      if (lastGroup && lastGroup.main.role === msg.role && lastGroup.main.type !== 'status') {
        lastGroup.status = msg;
        continue;
      }
      // If not grouping, it will fall through to push as its own group
    }

    groups.push({ main: msg });
  }

  return groups;
}

function renderMessageGroup(group: {main: Message, status?: Message}, isStreaming: boolean): string {
  const msg = group.main;
  const isStatusOnly = msg.type === 'status';
  const statusMsg = isStatusOnly ? msg : group.status;

  const isUser = msg.role === 'user';
  const isError = msg.type === 'error';
  const isPresentationStreaming = Boolean(msg.metadata?.presentationStreaming);

  let bubbleHtml = '';
  if (!isStatusOnly) {
    let content = isUser ? escapeHtml(msg.content) : renderMarkdown(msg.content);
    if ((isStreaming || isPresentationStreaming) && !isUser) {
      content += '<span class="typing-cursor"></span>';
    }
    const bubbleClass = isUser ? 'chat-message-bubble-user' : (isError ? 'chat-message-bubble-error' : 'chat-message-bubble-assistant');
    bubbleHtml = `<div class="chat-message-bubble ${bubbleClass}">${isUser ? `<p>${content}</p>` : `<div class="markdown-content">${content}</div>`}</div>`;
  }

  // Add status below message bubble or standalone
  let statusHtml = '';
  if (statusMsg) {
    statusHtml = `<div class="chat-message-status ${isStatusOnly ? 'chat-status-standalone' : ''}"><div class="loader-box"><div class="loader"></div></div><div class="chat-status-text">${escapeHtml(statusMsg.content)}</div></div>`;
  }

  const bubbleActions = (!isUser && !isError && !isStatusOnly && !isPresentationStreaming) ? `<div class="chat-message-actions"><button class="chat-message-action" data-action="copy" data-content="${escapeHtml(msg.content)}">${iconCopy()}</button><button class="chat-message-action${msg.metadata?.rating === 'like' ? ' active' : ''}" data-action="like" data-run-id="${msg.metadata?.run_id ?? ''}">${iconThumbUp()}</button><button class="chat-message-action${msg.metadata?.rating === 'dislike' ? ' active' : ''}" data-action="dislike" data-run-id="${msg.metadata?.run_id ?? ''}">${iconThumbDown()}</button></div>` : '';

  return `<div class="chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}">${bubbleHtml}${statusHtml}${bubbleActions}</div>`;
}

function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    return marked.parse(content, { async: false }) as string;
  } catch (e) {
    console.error('Error parsing markdown:', e);
    return content;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Icons (minified)
const iconSend=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const iconAlert=()=>'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.7L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.7a2 2 0 00-3.4 0z"/></svg>';
const iconCopy=()=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
const iconThumbUp=()=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>';
const iconThumbDown=()=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>';
const iconTrash=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 6.5h15M9 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M6 6.5l.8 12.2a2.5 2.5 0 0 0 2.5 2.3h5.4a2.5 2.5 0 0 0 2.5-2.3L18 6.5M10 10.5v6M14 10.5v6"/></svg>';
const iconMic=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8"/></svg>';
const iconStop=()=>'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';
const iconUpArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
const iconDownArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const iconLeftArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const iconRightArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
