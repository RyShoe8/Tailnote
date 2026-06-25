import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const QuoteSchema = new Schema(
  {
    quoteText: { type: String, required: true, trim: true, maxlength: 2000 },
    attribution: { type: String, default: '', trim: true, maxlength: 200 },
    source: { type: String, default: '', trim: true, maxlength: 200 },
    sourceUrl: { type: String, default: '', trim: true, maxlength: 2000 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'QuoteCategory', required: true, index: true },
    categoryName: { type: String, required: true, trim: true, maxlength: 120 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuoteSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });
QuoteSchema.index({ isActive: 1, isFeatured: 1 });
QuoteSchema.index({ quoteText: 'text', attribution: 'text' });

export type QuoteDoc = InferSchemaType<typeof QuoteSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const QuoteModel = mongoose.models.Quote ?? mongoose.model('Quote', QuoteSchema);
