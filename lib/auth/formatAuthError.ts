/** User-facing copy for common Better Auth signup/login errors. */
export function formatSignupError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('already exists') ||
    m.includes('already in use') ||
    m.includes('user already') ||
    m.includes('email already')
  ) {
    return 'An account with this email already exists. Log in instead, continue with Google using the same email, or use Forgot password to add a password to a Google account.';
  }
  return message;
}

export function formatLoginError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid') && (m.includes('password') || m.includes('credential'))) {
    return 'Invalid email or password. If you signed up with Google, use Continue with Google or reset your password to add one.';
  }
  return message;
}
