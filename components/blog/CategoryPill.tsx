import Link from 'next/link';
import { getCategoryLabel } from '@/lib/blog/categories';
import { cn } from '@/lib/utils';

type CategoryPillProps = {
  category: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function CategoryPill({ category, active, href, onClick, className }: CategoryPillProps) {
  const label = getCategoryLabel(category);
  const styles = cn(
    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-slate-200 bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground',
    className
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {label}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={styles}>
        {label}
      </button>
    );
  }

  return (
    <Link href={`/blog/category/${category}`} className={styles}>
      {label}
    </Link>
  );
}
