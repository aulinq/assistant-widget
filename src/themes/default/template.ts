import { marked } from 'marked';
import type { ChatState, Message, WidgetState } from '../../core/types';

/**
 * Default theme HTML templates
 * Pure string templates for vanilla JS rendering
 */

const translations = {
  en: {
    connecting: 'Connecting...',
    clearChat: 'Clear Chat',
  },
  ru: {
    connecting: 'Подключение...',
    clearChat: 'Очистить чат',
  }
};

export function renderUnified(
  widgetState: WidgetState,
  state: ChatState,
  config: { title: string; placeholder: string; showClose: boolean; lang: string; mode?: string; position?: string; suggestions?: string[] },
  hasInput: boolean
): string {
  const { messages, isConnecting, isTyping, error } = state;
  const lang = config.lang || 'en';
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Group messages with their following status messages
  const groupedMessages = groupMessagesWithStatus(messages);

  const arrowIcon = config.position === 'top' ? iconDownArrow() :
                    config.position === 'left' ? iconRightArrow() :
                    config.position === 'right' ? iconLeftArrow() :
                    iconUpArrow();

  let suggestionsHtml = '';
  const suggestions = state.suggestions ?? config.suggestions ?? [];
  const lastMessage = [...messages].reverse().find((message) => message.type !== 'status');
  const showSuggestions = Boolean(
    suggestions.length > 0 &&
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

  return `<div class="assistant-widget-content"><div class="chat-header" ${widgetState === 'minimized' ? 'data-clickable="expand"' : 'data-clickable="minimize"'}><div class="chat-header-group"><span class="chat-header-title">${config.title}</span></div><div class="chat-header-actions">${config.mode !== 'inline' ? `<div class="chat-header-icon-arrow">${arrowIcon}</div>` : ''}${config.showClose && widgetState === 'full' ? `<button class="chat-header-button action-close" data-action="close" aria-label="${t.clearChat}">${iconClose()}</button>` : ''}</div></div><div class="chat-messages">${error ? `<div class="chat-error">${escapeHtml(error)}</div>` : ''}${groupedMessages.map((group, index) => renderMessageGroup(group, isTyping && index === groupedMessages.length - 1)).join('')}${suggestionsHtml}</div><div class="chat-input-container"><textarea class="chat-input" placeholder="${isConnecting ? t.connecting : config.placeholder}" ${isConnecting ? 'disabled' : ''} rows="1"></textarea><button class="chat-input-button" data-action="primary" ${isConnecting || !hasInput ? 'disabled' : ''}>${iconSend()}</button></div></div>`;
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
const iconCopy=()=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
const iconThumbUp=()=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>';
const iconThumbDown=()=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>';
const iconClose=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const iconUpArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
const iconDownArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const iconLeftArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const iconRightArrow=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
