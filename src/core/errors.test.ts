import { describe, expect, it } from 'vitest';

import { getChatErrorPresentation } from './errors';

describe('getChatErrorPresentation', () => {
  it('maps a backend quota code to localized visitor copy', () => {
    expect(getChatErrorPresentation('Runtime stream failed: quota_exceeded', 'ru')).toEqual({
      title: 'Лимит запросов исчерпан',
      message: 'Сейчас консультант не может принять новый запрос. Попробуйте немного позже.',
    });
  });

  it('does not expose an unknown internal error', () => {
    const presentation = getChatErrorPresentation('provider_x_model_y_internal_code', 'en');
    expect(presentation.title).toBe('Something went wrong');
    expect(JSON.stringify(presentation)).not.toContain('provider_x');
  });

  it('uses connection copy for unknown startup failures', () => {
    expect(getChatErrorPresentation('unexpected handshake failure', 'es-AR', 'connection').title)
      .toBe('No se pudo conectar al chat');
  });
});
