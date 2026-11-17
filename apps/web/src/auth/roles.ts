export type Role = 'trainee' | 'trainer' | 'admin'
export const ROLES: readonly Role[] = ['trainee', 'trainer', 'admin']

/**
 * The admin client is configured without the server's custom access control, so its types only
 * know "user" | "admin". The server accepts our three roles; this narrows the cast to one place.
 */
export function toClientRole(role: Role): 'admin' {
  return role as 'admin'
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
