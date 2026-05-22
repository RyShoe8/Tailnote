import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const PRESET_IDS = [
  'default',
  'creator',
  'executive_minimalist',
  'minimal',
  'stacked',
  'corporate',
  'professional',
  'portfolio',
] as const;

export type CatalogPresetId = (typeof PRESET_IDS)[number];

const SignaturePresetCatalogSchema = new Schema(
  {
    presetId: {
      type: String,
      enum: PRESET_IDS,
      required: true,
      unique: true,
      index: true,
    },
    enabled: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type SignaturePresetCatalogDoc = InferSchemaType<typeof SignaturePresetCatalogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SignaturePresetCatalogModel =
  mongoose.models.SignaturePresetCatalog ??
  mongoose.model('SignaturePresetCatalog', SignaturePresetCatalogSchema);

export { PRESET_IDS as CATALOG_PRESET_IDS };
