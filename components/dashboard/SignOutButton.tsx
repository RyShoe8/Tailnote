'use client';

import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SignOutButtonProps = {
  onSignedOut?: () => void;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
};

export function SignOutButton({
  onSignedOut,
  variant = 'ghost',
  size,
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(variant === 'ghost' && !className && 'w-full justify-start px-2', className)}
      onClick={async () => {
        await authClient.signOut();
        onSignedOut?.();
        router.push('/');
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
