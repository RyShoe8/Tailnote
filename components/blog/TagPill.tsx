import Link from 'next/link';
import { getTagLabel } from '@/lib/blog/categories';
import { cn } from '@/lib/utils';

type TagPillProps = {
  tag: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function TagPill({ tag, active, href, onClick, className }: TagPillProps) {
  const label = getTagLabel(tag);
  const styles = cn(
    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-secondary bg-secondary text-secondary-foreground'
      : 'border-slate-200 bg-white text-muted-foreground hover:border-secondary/40 hover:text-foreground',
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
    <Link href={`/blog/tag/${tag}`} className={styles}>
      {label}
    </Link>
  );
}
