import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthToken extends Document {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OAuthTokenSchema = new Schema<IOAuthToken>(
  {
    userId: { type: String, required: true, index: true },
    provider: {
      type: String,
      required: true,
      enum: [
        'google',
        'facebook',
        'instagram',
        'whatsapp',
        'outlook',
        'asana',
        'notion',
        'calendly',
        'linkedin',
      ],
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date, required: true },
    scope: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index composé pour les requêtes efficaces
OAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const OAuthToken = mongoose.model<IOAuthToken>(
  'OAuthToken',
  OAuthTokenSchema
);
