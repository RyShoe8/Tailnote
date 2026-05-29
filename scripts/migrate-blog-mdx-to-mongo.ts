/**
 * One-time migration: import content/blog/posts/*.mdx into MongoDB.
 * Run: npm run migrate:blog
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { slugify } from '../lib/blog/categories';
import { blogPostFrontmatterSchema } from '../lib/blog/types';
import { upsertBlogPostFromMigration } from '../lib/admin/blogPosts';
import { connectMongoose } from '../lib/mongoose';

const POSTS_DIR = path.join(process.cwd(), 'content/blog/posts');

async function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No content/blog/posts directory — nothing to migrate.');
    return;
  }

  await connectMongoose();

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
  let count = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const parsed = blogPostFrontmatterSchema.safeParse(data);

    if (!parsed.success) {
      console.error(`Skipping ${file}: ${parsed.error.message}`);
      continue;
    }

    const slug = parsed.data.slug ?? slugify(file.replace(/\.mdx$/, ''));
    await upsertBlogPostFromMigration({
      frontmatter: { ...parsed.data, slug },
      body: content.trim(),
    });
    console.log(`Migrated: ${slug}`);
    count += 1;
  }

  console.log(`\nDone. Migrated ${count} post(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
