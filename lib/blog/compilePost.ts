import { type ReactElement } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import { extractHeadings } from '@/lib/blog/extractHeadings';
import { blogMdxComponents } from '@/lib/blog/mdxComponents';
import { getPostBody } from '@/lib/blog/loadPosts';
import type { TocHeading } from '@/lib/blog/types';

export type CompiledBlogPost = {
  content: ReactElement;
  headings: TocHeading[];
};

export async function compilePostContent(body: string): Promise<CompiledBlogPost> {
  const headings = extractHeadings(body);

  const { content } = await compileMDX({
    source: body,
    components: blogMdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypePrettyCode,
            {
              theme: 'github-light',
              keepBackground: false,
            },
          ] as [typeof rehypePrettyCode, { theme: string; keepBackground: boolean }],
        ],
      },
    },
  });

  return { content, headings };
}

export async function compilePost(slug: string): Promise<CompiledBlogPost | null> {
  const body = await getPostBody(slug);
  if (body == null) return null;
  return compilePostContent(body);
}
