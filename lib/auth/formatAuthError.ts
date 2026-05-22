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

/** OAuth callback errors (e.g. ?error=account_not_linked on /login). */
export function formatOAuthCallbackError(code: string): string {
  const key = code.trim().toLowerCase();
  if (key === 'account_not_linked') {
    return (
      'We could not link your Google account automatically. Sign in with email and password using the same email as your Google account, ' +
      'then open Dashboard → Billing → Sign-in methods and click Connect Google. ' +
      'If you originally signed up with Google only, use Forgot password to add a password for that email.'
    );
  }
  if (key === 'banned') {
    return 'This account cannot sign in. Contact support if you need help.';
  }
  return 'Google sign-in did not complete. Try again, or sign in with email and password.';
}
