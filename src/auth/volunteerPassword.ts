/**
 * Volunteer accounts use a deterministic password derived from the phone number
 * (same algorithm as registration). Any volunteer sign-in must use this helper
 * so credentials match `auth.users` in Supabase.
 */
export function buildVolunteerPasswordFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const base = digits.length >= 6 ? digits : `${digits}crisisiq`;
  return `${base}Aa1`;
}
