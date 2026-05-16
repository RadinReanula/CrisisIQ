import type { SupabaseClient } from '@supabase/supabase-js';
import { volunteerSignInPasswordCandidates } from './volunteerPassword';

/**
 * RLS on `volunteers` requires `auth.uid() === user_id`. Anonymous requests always fail.
 * After `signUp`, a session is often missing until email is confirmed — this helper
 * re-establishes a session when possible before inserts/upserts.
 *
 * Accepts the volunteer phone string so multiple password variants can be tried.
 */
export async function ensureAuthSessionForUser(
  client: SupabaseClient,
  userId: string,
  email: string,
  phone: string,
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

  let lastMessage = 'Sign-in failed.';
  let sawNeedConfirm = false;

  for (const password of volunteerSignInPasswordCandidates(phone)) {
    const signIn = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (!signIn.error && signIn.data.session?.user.id === userId) {
      return { status: 'ready' };
    }

    const msg = signIn.error?.message ?? 'Sign-in failed.';
    lastMessage = msg;
    const lower = msg.toLowerCase();
    if (
      lower.includes('email not confirmed') ||
      lower.includes('not confirmed') ||
      lower.includes('confirm your email')
    ) {
      sawNeedConfirm = true;
    }
  }

  if (sawNeedConfirm) {
    return { status: 'need_email_confirm' };
  }

  return { status: 'auth_failed', message: lastMessage };
}
