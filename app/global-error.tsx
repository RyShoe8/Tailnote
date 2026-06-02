'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[app]', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: '#fafafa',
          color: '#18181b',
        }}
      >
        <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#52525b', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again. If the problem continues, contact support.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#fff',
              background: '#18181b',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
