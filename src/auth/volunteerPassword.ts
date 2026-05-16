/**
 * Volunteer accounts use a deterministic password derived from the phone number
 * (same algorithm as registration). Any volunteer sign-in must use this helper
 * so credentials match `auth.users` in Supabase.
 */

function volunteerPasswordFromDigits(digits: string): string {
  const base = digits.length >= 6 ? digits : `${digits}crisisiq`;
  return `${base}Aa1`;
}

/**
 * Normalize common Sri Lanka mobile shapes so `077…`, `77…`, and `947…`
 * yield the same digit sequence before `Aa1` is appended.
 */
function canonicalVolunteerDigits(rawDigits: string): string {
  if (/^0[17]\d{8}$/.test(rawDigits)) {
    return `94${rawDigits.slice(1)}`;
  }
  if (/^[17]\d{8}$/.test(rawDigits)) {
    return `94${rawDigits}`;
  }
  return rawDigits;
}

/** Password stored at registration — canonical digits only. */
export function buildVolunteerPasswordFromPhone(phone: string): string {
  const raw = phone.replace(/\D/g, '');
  const canon = canonicalVolunteerDigits(raw);
  return volunteerPasswordFromDigits(canon);
}

/**
 * Try these in order during sign-in so accounts created before canonicalisation
 * (raw leading `0`) still authenticate.
 */
export function volunteerSignInPasswordCandidates(phone: string): readonly string[] {
  const raw = phone.replace(/\D/g, '');
  const canon = canonicalVolunteerDigits(raw);
  const bases = canon === raw ? [canon] : [canon, raw];
  const passwords = bases.map(volunteerPasswordFromDigits);
  return [...new Set(passwords)];
}
