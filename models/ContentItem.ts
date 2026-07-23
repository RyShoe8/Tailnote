import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const ContentItemSchema = new Schema(
  {
    contentSourceId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentSource',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publishedAt: { type: Date },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    guid: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ContentItemSchema.index({ contentSourceId: 1, guid: 1 }, { unique: true });
ContentItemSchema.index({ contentSourceId: 1, publishedAt: -1 });

export type ContentItemDoc = InferSchemaType<typeof ContentItemSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ContentItemModel =
  mongoose.models.ContentItem ?? mongoose.model('ContentItem', ContentItemSchema);
