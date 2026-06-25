import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const QuoteCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuoteCategorySchema.index({ isActive: 1, sortOrder: 1 });

export type QuoteCategoryDoc = InferSchemaType<typeof QuoteCategorySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const QuoteCategoryModel =
  mongoose.models.QuoteCategory ?? mongoose.model('QuoteCategory', QuoteCategorySchema);
