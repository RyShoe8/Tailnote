'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BLOG_AUTHORS } from '@/lib/blog/authors';
import { BLOG_CATEGORIES, slugify } from '@/lib/blog/categories';
import type { AdminBlogPostRow } from '@/lib/blog/types';

type FormState = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  author: string;
  category: string;
  tags: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  featured: boolean;
  draft: boolean;
  body: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function rowToForm(post: AdminBlogPostRow & { body?: string }): FormState {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description,
    publishedAt: post.publishedAt.slice(0, 10),
    author: post.author,
    category: post.category,
    tags: post.tags?.join(', ') ?? '',
    coverImage: post.coverImage ?? '',
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    featured: post.featured ?? false,
    draft: post.isDraft ?? false,
    body: post.body ?? '',
  };
}

const emptyForm = (): FormState => ({
  title: '',
  slug: '',
  description: '',
  publishedAt: todayIso(),
  author: 'tailnote-team',
  category: BLOG_CATEGORIES[0] ?? 'email-signatures',
  tags: '',
  coverImage: '',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  featured: false,
  draft: true,
  body: '',
});

type AdminBlogPostFormProps = {
  mode: 'create' | 'edit';
  postId?: string;
  initial?: AdminBlogPostRow & { body?: string; seoTitle?: string; seoDescription?: string; canonicalUrl?: string };
};

export function AdminBlogPostForm({ mode, postId, initial }: AdminBlogPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    initial ? rowToForm(initial) : emptyForm()
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (initial) {
      setForm({
        ...rowToForm(initial),
        seoTitle: initial.seoTitle ?? '',
        seoDescription: initial.seoDescription ?? '',
        canonicalUrl: initial.canonicalUrl ?? '',
        body: initial.body ?? '',
      });
    }
  }, [initial]);

  const fetchPreview = useCallback(async (body: string) => {
    if (!body.trim()) {
      setPreviewHtml(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/blog/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as { html?: string; error?: string };
      if (res.ok && data.html) {
        setPreviewHtml(data.html);
      }
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPreview(form.body);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.body, fetchPreview]);

  function buildPayload() {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim(),
      publishedAt: form.publishedAt,
      updatedAt: todayIso(),
      author: form.author,
      category: form.category,
      tags,
      coverImage: form.coverImage.trim() || undefined,
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      canonicalUrl: form.canonicalUrl.trim() || undefined,
      featured: form.featured,
      draft: form.draft,
      body: form.body,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = buildPayload();
      const url = mode === 'create' ? '/api/admin/blog' : `/api/admin/blog/${postId}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; post?: { id: string } };
      if (!res.ok) {
        setError(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }
      router.push('/admin/blog');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveAndPreview() {
    setError(null);
    setLoading(true);
    try {
      const payload = buildPayload();
      const url = mode === 'create' ? '/api/admin/blog' : `/api/admin/blog/${postId}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; post?: { id: string } };
      if (!res.ok) {
        setError(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }
      const id = j.post?.id ?? postId;
      if (id) {
        router.push(`/admin/blog/${id}/preview`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'New blog post' : 'Edit blog post'}</CardTitle>
          <CardDescription>
            Content is stored in MongoDB and published to the public blog when not marked as draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: mode === 'create' && !f.slug ? slugify(title) : f.slug,
                }));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
              required
              disabled={mode === 'edit'}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishedAt">Published date</Label>
            <Input
              id="publishedAt"
              type="date"
              value={form.publishedAt}
              onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <select
              id="author"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            >
              {Object.keys(BLOG_AUTHORS).map((id) => (
                <option key={id} value={id}>
                  {BLOG_AUTHORS[id].name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="spf, dkim, dmarc"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="coverImage">Cover image URL</Label>
            <Input
              id="coverImage"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              placeholder="/blog/covers/example.png"
            />
          </div>
          <div className="flex flex-wrap gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.draft}
                onChange={(e) => setForm((f) => ({ ...f, draft: e.target.checked }))}
              />
              Draft
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO overrides</CardTitle>
          <CardDescription>Optional — leave blank to use title and description.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Input
              id="seoDescription"
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="canonicalUrl">Canonical URL</Label>
            <Input
              id="canonicalUrl"
              value={form.canonicalUrl}
              onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
              placeholder="https://tailnote.io/blog/your-slug"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Content</CardTitle>
            <CardDescription>WYSIWYG editor — saves as markdown with MDX shortcodes.</CardDescription>
          </div>
          <div className="flex gap-2 lg:hidden">
            <Button
              type="button"
              size="sm"
              variant={previewTab === 'edit' ? 'default' : 'outline'}
              onClick={() => setPreviewTab('edit')}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewTab === 'preview' ? 'default' : 'outline'}
              onClick={() => setPreviewTab('preview')}
            >
              Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={previewTab === 'preview' ? 'hidden lg:block' : undefined}>
              <BlogEditor value={form.body} onChange={(body) => setForm((f) => ({ ...f, body }))} />
            </div>
            <div
              className={`rounded-xl border border-slate-200 bg-white p-4 ${
                previewTab === 'edit' ? 'hidden lg:block' : undefined
              }`}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live preview
              </p>
              {previewLoading ? (
                <p className="text-sm text-muted-foreground">Rendering…</p>
              ) : previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-sm text-muted-foreground">Start writing to see a preview.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void saveAndPreview()}>
          Save & preview
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/blog">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
