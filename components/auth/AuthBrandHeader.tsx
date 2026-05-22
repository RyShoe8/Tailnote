import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';

type AuthBrandHeaderProps = {
  heightClass?: string;
};

export function AuthBrandHeader({ heightClass = 'h-10 sm:h-12' }: AuthBrandHeaderProps) {
  return (
    <Link
      href="/"
      className="mb-6 flex justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <TailnoteLogo heightClass={heightClass} priority />
    </Link>
  );
}
