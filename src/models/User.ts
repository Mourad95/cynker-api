import mongoose, { Schema, Document } from 'mongoose';

// Interface TypeScript pour le document User
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Mongoose pour User
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email est requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Mot de passe requis'],
      minlength: [8, 'Le mot de passe doit faire au moins 8 caractères'],
    },
    firstName: {
      type: String,
      required: [true, 'Prénom requis'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },
    lastName: {
      type: String,
      required: [true, 'Nom requis'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour optimiser les requêtes
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Plugin toJSON personnalisé pour supprimer les champs sensibles
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  // Supprimer les champs sensibles
  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

// Virtual pour le nom complet
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Middleware pre-save pour normaliser l'email
userSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Export du modèle
export const User = mongoose.model<IUser>('User', userSchema);
