export type ChatErrorContext = 'connection' | 'request';

export interface ChatErrorPresentation {
  title: string;
  message: string;
}

type ErrorKind = 'quota' | 'connection' | 'session' | 'timeout' | 'unavailable' | 'generic';
type ErrorLocale = 'en' | 'es' | 'ru' | 'pt' | 'fr' | 'de' | 'it';

const ERROR_COPY: Record<ErrorLocale, Record<ErrorKind, ChatErrorPresentation>> = {
  en: {
    quota: { title: 'Request limit reached', message: 'The assistant cannot accept a new request right now. Please try again a little later.' },
    connection: { title: 'Could not connect to chat', message: 'Check your internet connection and try connecting again.' },
    session: { title: 'Could not start the chat', message: 'Refresh the page and try again.' },
    timeout: { title: 'The response took too long', message: 'Please try sending your message again.' },
    unavailable: { title: 'The assistant is temporarily unavailable', message: 'Please try again in a few minutes.' },
    generic: { title: 'Something went wrong', message: 'The assistant could not reply. Please try sending your message again.' },
  },
  es: {
    quota: { title: 'Se alcanzó el límite de solicitudes', message: 'El asistente no puede aceptar una nueva solicitud ahora. Inténtalo de nuevo un poco más tarde.' },
    connection: { title: 'No se pudo conectar al chat', message: 'Comprueba tu conexión a internet e intenta conectarte de nuevo.' },
    session: { title: 'No se pudo iniciar el chat', message: 'Actualiza la página e inténtalo de nuevo.' },
    timeout: { title: 'La respuesta tardó demasiado', message: 'Intenta enviar tu mensaje de nuevo.' },
    unavailable: { title: 'El asistente no está disponible temporalmente', message: 'Inténtalo de nuevo en unos minutos.' },
    generic: { title: 'Algo salió mal', message: 'El asistente no pudo responder. Intenta enviar tu mensaje de nuevo.' },
  },
  ru: {
    quota: { title: 'Лимит запросов исчерпан', message: 'Сейчас консультант не может принять новый запрос. Попробуйте немного позже.' },
    connection: { title: 'Не удалось подключиться к чату', message: 'Проверьте интернет-соединение и попробуйте подключиться снова.' },
    session: { title: 'Не удалось начать чат', message: 'Обновите страницу и попробуйте ещё раз.' },
    timeout: { title: 'Ответ занял слишком много времени', message: 'Попробуйте отправить сообщение ещё раз.' },
    unavailable: { title: 'Консультант временно недоступен', message: 'Попробуйте снова через несколько минут.' },
    generic: { title: 'Что-то пошло не так', message: 'Не удалось получить ответ. Попробуйте отправить сообщение ещё раз.' },
  },
  pt: {
    quota: { title: 'Limite de solicitações atingido', message: 'O assistente não pode aceitar uma nova solicitação agora. Tente novamente um pouco mais tarde.' },
    connection: { title: 'Não foi possível conectar ao chat', message: 'Verifique sua conexão com a internet e tente conectar novamente.' },
    session: { title: 'Não foi possível iniciar o chat', message: 'Atualize a página e tente novamente.' },
    timeout: { title: 'A resposta demorou demais', message: 'Tente enviar sua mensagem novamente.' },
    unavailable: { title: 'O assistente está temporariamente indisponível', message: 'Tente novamente em alguns minutos.' },
    generic: { title: 'Algo deu errado', message: 'O assistente não conseguiu responder. Tente enviar sua mensagem novamente.' },
  },
  fr: {
    quota: { title: 'Limite de requêtes atteinte', message: 'L’assistant ne peut pas accepter une nouvelle demande pour le moment. Réessayez un peu plus tard.' },
    connection: { title: 'Impossible de se connecter au chat', message: 'Vérifiez votre connexion internet et réessayez.' },
    session: { title: 'Impossible de démarrer le chat', message: 'Actualisez la page et réessayez.' },
    timeout: { title: 'La réponse a pris trop de temps', message: 'Essayez d’envoyer votre message à nouveau.' },
    unavailable: { title: 'L’assistant est temporairement indisponible', message: 'Réessayez dans quelques minutes.' },
    generic: { title: 'Un problème est survenu', message: 'L’assistant n’a pas pu répondre. Essayez d’envoyer votre message à nouveau.' },
  },
  de: {
    quota: { title: 'Anfragelimit erreicht', message: 'Der Assistent kann gerade keine neue Anfrage annehmen. Bitte versuchen Sie es etwas später erneut.' },
    connection: { title: 'Verbindung zum Chat fehlgeschlagen', message: 'Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.' },
    session: { title: 'Chat konnte nicht gestartet werden', message: 'Laden Sie die Seite neu und versuchen Sie es erneut.' },
    timeout: { title: 'Die Antwort hat zu lange gedauert', message: 'Versuchen Sie, Ihre Nachricht erneut zu senden.' },
    unavailable: { title: 'Der Assistent ist vorübergehend nicht verfügbar', message: 'Versuchen Sie es in einigen Minuten erneut.' },
    generic: { title: 'Etwas ist schiefgelaufen', message: 'Der Assistent konnte nicht antworten. Versuchen Sie, Ihre Nachricht erneut zu senden.' },
  },
  it: {
    quota: { title: 'Limite di richieste raggiunto', message: 'L’assistente non può accettare una nuova richiesta in questo momento. Riprova più tardi.' },
    connection: { title: 'Impossibile connettersi alla chat', message: 'Controlla la connessione internet e prova a connetterti di nuovo.' },
    session: { title: 'Impossibile avviare la chat', message: 'Aggiorna la pagina e riprova.' },
    timeout: { title: 'La risposta ha richiesto troppo tempo', message: 'Prova a inviare di nuovo il messaggio.' },
    unavailable: { title: 'L’assistente è temporaneamente non disponibile', message: 'Riprova tra qualche minuto.' },
    generic: { title: 'Qualcosa è andato storto', message: 'L’assistente non ha potuto rispondere. Prova a inviare di nuovo il messaggio.' },
  },
};

export function getChatErrorPresentation(
  rawError: string,
  language = 'en',
  context: ChatErrorContext = 'request',
): ChatErrorPresentation {
  const locale = resolveErrorLocale(language);
  return ERROR_COPY[locale][classifyError(rawError, context)];
}

function classifyError(rawError: string, context: ChatErrorContext): ErrorKind {
  const normalized = rawError.toLowerCase().replace(/[\\_-]+/g, ' ');

  if (/quota|rate limit|too many requests|\b429\b/.test(normalized)) return 'quota';
  if (/timeout|timed out|deadline exceeded|gateway timeout|\b408\b|\b504\b/.test(normalized)) return 'timeout';
  if (/invalid token|missing token|session expired|unauthori[sz]ed|forbidden|authentication failed|\b401\b|\b403\b/.test(normalized)) return 'session';
  if (/failed to fetch|network ?error|load failed|connection failed|websocket (error|closed)|offline|dns/.test(normalized)) return 'connection';
  if (/service unavailable|runtime unavailable|internal server error|empty response body|bad gateway|\b500\b|\b502\b|\b503\b/.test(normalized)) return 'unavailable';
  return context === 'connection' ? 'connection' : 'generic';
}

function resolveErrorLocale(language: string): ErrorLocale {
  const locale = language.toLowerCase().split(/[-_]/)[0] as ErrorLocale;
  return locale in ERROR_COPY ? locale : 'en';
}
