export function canAccessAdmin(user: {role?: string; isBlocked?: boolean} | null | undefined): boolean {
  return Boolean(user && !user.isBlocked && (user.role === 'admin' || user.role === 'superadmin'));
}
