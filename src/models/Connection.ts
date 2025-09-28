import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface TypeScript pour le document Connection
export interface IConnection extends Document {
  userId: Types.ObjectId;
  provider: 'google' | 'microsoft' | 'github' | 'discord';
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  encryptedRefreshToken?: string;
  iv?: string;
  tag?: string;
  expiresAt?: Date;
  scope?: string[];
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Mongoose pour Connection
const connectionSchema = new Schema<IConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID utilisateur requis'],
      index: true,
    },
    provider: {
      type: String,
      required: [true, 'Fournisseur requis'],
      enum: {
        values: ['google', 'microsoft', 'github', 'discord'],
        message: 'Fournisseur non supporté',
      },
    },
    providerId: {
      type: String,
      required: [true, 'ID fournisseur requis'],
    },
    accessToken: {
      type: String,
      required: [true, "Token d'accès requis"],
    },
    refreshToken: {
      type: String,
    },
    encryptedRefreshToken: {
      type: String,
    },
    iv: {
      type: String,
    },
    tag: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    scope: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index composés pour optimiser les requêtes
connectionSchema.index({ userId: 1, provider: 1 }, { unique: true });
connectionSchema.index({ provider: 1, providerId: 1 });
connectionSchema.index({ isActive: 1 });
connectionSchema.index({ expiresAt: 1 });
connectionSchema.index({ lastSyncAt: -1 });

// Plugin toJSON personnalisé pour supprimer les champs sensibles
connectionSchema.methods.toJSON = function () {
  const connectionObject = this.toObject();

  // Supprimer les champs sensibles
  delete connectionObject.accessToken;
  delete connectionObject.refreshToken;
  delete connectionObject.encryptedRefreshToken;
  delete connectionObject.iv;
  delete connectionObject.tag;
  delete connectionObject.__v;

  return connectionObject;
};

// Virtual pour vérifier si le token est expiré
connectionSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Middleware pre-save pour normaliser les données
connectionSchema.pre('save', function (next) {
  if (this.isModified('provider')) {
    this.provider = this.provider.toLowerCase() as any;
  }
  next();
});

// Méthode statique pour trouver une connexion active
connectionSchema.statics.findActiveByUserAndProvider = function (
  userId: Types.ObjectId,
  provider: string
) {
  return this.findOne({ userId, provider, isActive: true });
};

// Méthode d'instance pour désactiver la connexion
connectionSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

// Export du modèle
export const Connection = mongoose.model<IConnection>(
  'Connection',
  connectionSchema
);
