import { getAuthor } from '@/lib/blog/authors';

type AuthorCardProps = {
  authorId: string;
};

export function AuthorCard({ authorId }: AuthorCardProps) {
  const author = getAuthor(authorId);

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={author.avatar}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 rounded-full border border-slate-200 bg-white object-cover"
      />
      <div>
        <p className="font-semibold text-foreground">{author.name}</p>
        <p className="text-sm text-primary">{author.role}</p>
        {author.bio ? <p className="mt-2 text-sm text-muted-foreground">{author.bio}</p> : null}
      </div>
    </div>
  );
}
