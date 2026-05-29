import type { BlogAuthor } from '@/lib/blog/types';

export const BLOG_AUTHORS: Record<string, BlogAuthor> = {
  'tailnote-team': {
    id: 'tailnote-team',
    name: 'Tailnote Team',
    role: 'Email branding & deliverability',
    avatar: '/images/tailnote-icon.png',
    bio: 'Practical guides on email signatures, deliverability, and branded outbound email for solo founders and small teams.',
  },
};

export function getAuthor(id: string): BlogAuthor {
  return (
    BLOG_AUTHORS[id] ?? {
      id,
      name: id,
      role: 'Contributor',
      avatar: '/images/tailnote-icon.png',
      bio: '',
    }
  );
}
