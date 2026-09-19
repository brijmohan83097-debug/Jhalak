/**
 * Super Admin Configuration
 * Jhalak Reels: Made in India
 */

export const ADMIN_EMAIL = 'Brijmohan83097@gmail.com';

/**
 * Checks whether the provided user object or email string matches the Super Admin.
 * Strictly checks case-insensitive match against ADMIN_EMAIL.
 */
export function isSuperAdmin(userOrEmail?: { email?: string } | string | null): boolean {
  if (!userOrEmail) return false;
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email;
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
}
