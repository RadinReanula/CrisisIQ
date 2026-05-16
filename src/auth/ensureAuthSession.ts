import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * RLS on `volunteers` requires `auth.uid() === user_id`. Anonymous requests always fail.
 * After `signUp`, a session is often missing until email is confirmed — this helper
 * re-establishes a session when possible before inserts/upserts.
 */
export async function ensureAuthSessionForUser(
  client: SupabaseClient,
  userId: string,
  email: string,
  password: string,
): Promise<
  | { status: 'ready' }
  | { status: 'need_email_confirm' }
  | { status: 'auth_failed'; message: string }
> {
  const {
    data: { session: existing },
  } = await client.auth.getSession();

  if (existing?.user.id === userId) {
    return { status: 'ready' };
  }

  const signIn = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (!signIn.error && signIn.data.session?.user.id === userId) {
    return { status: 'ready' };
  }

  const msg = signIn.error?.message ?? 'Sign-in failed.';
  const lower = msg.toLowerCase();
  if (
    lower.includes('email not confirmed') ||
    lower.includes('not confirmed') ||
    lower.includes('confirm your email')
  ) {
    return { status: 'need_email_confirm' };
  }

  return { status: 'auth_failed', message: msg };
}
