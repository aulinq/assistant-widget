/** Browser dictation, matching the landing and contact form. */
export type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
export type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export type ComposerState = { recording?: boolean; dictationError?: boolean };

const copy = {
  en: ['Voice input', 'Stop dictation', 'Voice input is unavailable. You can type your message.', 'Expand chat', 'Minimize chat'],
  ru: ['Голосовой ввод', 'Остановить диктовку', 'Голосовой ввод недоступен. Можно написать сообщение.', 'Развернуть чат', 'Свернуть чат'],
  es: ['Entrada de voz', 'Detener dictado', 'El dictado no está disponible. Puedes escribir.', 'Expandir chat', 'Minimizar chat'],
  pt: ['Entrada de voz', 'Parar ditado', 'A entrada de voz está indisponível. Você pode escrever.', 'Expandir chat', 'Minimizar chat'],
  fr: ['Saisie vocale', 'Arrêter la dictée', 'La dictée est indisponible. Vous pouvez écrire.', 'Développer le chat', 'Réduire le chat'],
  de: ['Spracheingabe', 'Diktat stoppen', 'Spracheingabe ist nicht verfügbar. Sie können schreiben.', 'Chat öffnen', 'Chat minimieren'],
  it: ['Input vocale', 'Interrompi dettatura', 'La dettatura non è disponibile. Puoi scrivere.', 'Espandi chat', 'Riduci chat'],
};
export function getComposerCopy(lang: string) {
  const locale = lang.toLowerCase().split(/[-_]/)[0] as keyof typeof copy;
  const [mic, micStop, unavailable, expand, minimize] = copy[locale] || copy.en;
  return { mic, micStop, unavailable, expand, minimize };
}
