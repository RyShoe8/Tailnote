import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const PendingOrganizationCheckoutSchema = new Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, default: '' },
  userName: { type: String, default: '' },
  organizationName: { type: String, required: true },
  subscriptionPlanId: { type: Schema.Types.ObjectId, required: true },
  checkoutSessionId: { type: String, default: '' },
}, { timestamps: true });

export type PendingOrganizationCheckoutDoc = InferSchemaType<typeof PendingOrganizationCheckoutSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PendingOrganizationCheckoutModel =
  mongoose.models.PendingOrganizationCheckout ??
  mongoose.model('PendingOrganizationCheckout', PendingOrganizationCheckoutSchema);
