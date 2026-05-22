import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { sendEmail } from '@/lib/email/mail';
import { isBrevoConfigured } from '@/lib/email/brevo';
import { buildPasswordResetEmail } from '@/lib/email/templates/passwordResetEmail';
import { syncUserToBrevoList } from '@/lib/email/brevoContacts';

let authInstance: ReturnType<typeof betterAuth> | undefined;

export async function getAuth() {
  if (authInstance) return authInstance;
  const { connectMongoose, getMongoDb, getMongoClient } = await import('@/lib/mongoose');
  await connectMongoose();
  const db = getMongoDb();
  const client = getMongoClient();

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required');
  }

  authInstance = betterAuth({
    secret,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    database: mongodbAdapter(db as never, { client: client as never }),
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (user.email) {
              return { data: { ...user, email: user.email.trim().toLowerCase() } };
            }
            return { data: user };
          },
          after: async (user) => {
            void syncUserToBrevoList({
              email: user.email,
              name: user.name,
            }).catch((err) => {
              console.error('[Tailnote] Brevo contact sync failed', user.email, err);
            });
          },
        },
      },
    },
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          socialProviders: {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          },
        }
      : {}),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        if (!isBrevoConfigured()) {
          if (process.env.NODE_ENV === 'development') {
            console.info('[Tailnote] Password reset (Brevo not configured):', user.email, url);
            return;
          }
          throw new Error('Password reset email is not configured');
        }
        const { subject, html, text } = buildPasswordResetEmail(url);
        const result = await sendEmail({
          to: user.email,
          subject,
          html,
          text,
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
      },
    },
    user: {
      additionalFields: {
        name: { type: 'string', required: false },
        organizationId: { type: 'string', required: false },
        role: { type: 'string', required: false },
        /** Tailnote platform operator; can open /admin and platform APIs */
        platformAdmin: { type: 'boolean', required: false },
      },
    },
    plugins: [nextCookies()],
  }) as unknown as ReturnType<typeof betterAuth>;

  return authInstance;
}
