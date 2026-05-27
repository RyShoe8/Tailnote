import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const OrganizationUserInviteSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
    inviteToken: { type: String, required: true, unique: true, index: true },
    inviteExpiresAt: { type: Date, required: true },
    inviteSentAt: { type: Date },
    acceptedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

OrganizationUserInviteSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true, partialFilterExpression: { acceptedAt: null } }
);

export type OrganizationUserInviteDoc = InferSchemaType<typeof OrganizationUserInviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OrganizationUserInviteModel =
  (mongoose.models.OrganizationUserInvite as mongoose.Model<OrganizationUserInviteDoc> | undefined) ??
  mongoose.model<OrganizationUserInviteDoc>('OrganizationUserInvite', OrganizationUserInviteSchema);
