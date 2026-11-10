import { Resend } from 'resend';

/**
 * Shared, lazily-created Resend client.
 *
 * `new Resend(undefined)` throws, so creating the client at module load (as
 * the services used to) crashed any module that imported them whenever
 * RESEND_API_KEY was unset — including `next build`'s page-data step and
 * every route that merely imported an email-sending service. The client is
 * now created on first use, so a missing key only fails the email call itself.
 */
let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('Email service is not configured (missing RESEND_API_KEY).');
    }
    client = new Resend(key);
  }
  return client;
}

/** Drop-in for `new Resend(key)`: `resend.emails.send(...)`, `resend.batch.send(...)`. */
export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
