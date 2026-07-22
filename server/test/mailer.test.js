import { describe, expect, it } from 'vitest';
import { normalizeBaseUrl, templateResetEmail } from '../src/lib/mailer.js';

describe('mailer links', () => {
  it('uses the first configured origin for comma-separated frontend origins', () => {
    expect(normalizeBaseUrl('https://yunax.vercel.app, https://preview.yunax.app/')).toBe('https://yunax.vercel.app');
  });

  it('builds a valid reset-password link', () => {
    const email = templateResetEmail({
      name: 'User',
      token: 'token with spaces',
      baseUrl: 'https://yunax.vercel.app, https://preview.yunax.app/',
    });

    expect(email.text).toContain('https://yunax.vercel.app/reset-password?token=token%20with%20spaces');
    expect(email.text).not.toContain('https://yunax.vercel.app,');
  });
});
