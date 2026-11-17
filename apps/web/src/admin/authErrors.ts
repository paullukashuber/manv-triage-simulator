type AuthErrorKey =
  | 'admin.errors.userExists'
  | 'admin.errors.passwordLength'
  | 'admin.errors.emailInvalid'
  | 'admin.errors.notAllowed'
  | 'admin.errors.userNotFound'

const KEYS_BY_CODE: Record<string, AuthErrorKey> = {
  USER_ALREADY_EXISTS: 'admin.errors.userExists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'admin.errors.userExists',
  PASSWORD_TOO_SHORT: 'admin.errors.passwordLength',
  PASSWORD_TOO_LONG: 'admin.errors.passwordLength',
  INVALID_EMAIL: 'admin.errors.emailInvalid',
  USER_NOT_FOUND: 'admin.errors.userNotFound',
}

/**
 * i18n key for a better-auth error code, or null when the code is unknown. Server messages are
 * English and never shown; callers fall back to a generic German text.
 */
export function authErrorKey(code: unknown): AuthErrorKey | null {
  if (typeof code !== 'string') return null
  if (code.startsWith('YOU_ARE_NOT_ALLOWED_TO_')) return 'admin.errors.notAllowed'
  return KEYS_BY_CODE[code] ?? null
}
