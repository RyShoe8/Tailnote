import { revalidatePath } from 'next/cache';
import { getAllCategories, getAllTags, getPublishedPosts } from '@/lib/blog/loadPosts';

export async function revalidateBlogPaths(options?: { slug?: string }): Promise<void> {
  revalidatePath('/blog');
  revalidatePath('/rss.xml');

  if (options?.slug) {
    revalidatePath(`/blog/${options.slug}`);
  } else {
    const posts = await getPublishedPosts();
    for (const post of posts) {
      revalidatePath(`/blog/${post.slug}`);
    }
  }

  const categories = await getAllCategories();
  for (const category of categories) {
    revalidatePath(`/blog/category/${category}`);
  }

  const tags = await getAllTags();
  for (const tag of tags) {
    revalidatePath(`/blog/tag/${tag}`);
  }
}
