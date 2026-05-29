import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const BlogPostSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    publishedAt: { type: String, required: true, trim: true },
    contentUpdatedAt: { type: String, trim: true, default: '' },
    author: { type: String, required: true, trim: true, default: 'tailnote-team' },
    category: { type: String, required: true, trim: true, index: true },
    coverImage: { type: String, default: '', trim: true },
    seoTitle: { type: String, default: '', trim: true, maxlength: 200 },
    seoDescription: { type: String, default: '', trim: true, maxlength: 500 },
    canonicalUrl: { type: String, default: '', trim: true },
    featured: { type: Boolean, default: false, index: true },
    draft: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
    body: { type: String, required: true, default: '' },
  },
  { timestamps: true }
);

BlogPostSchema.index({ publishedAt: -1 });

export type BlogPostDoc = InferSchemaType<typeof BlogPostSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BlogPostModel =
  mongoose.models.BlogPost ?? mongoose.model('BlogPost', BlogPostSchema);
