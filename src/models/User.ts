import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface TypeScript pour le document User
export interface IUser extends Document {
  email: string;
  password?: string; // Optionnel pour les utilisateurs OAuth
  firstName: string;
  lastName: string;
  isActive: boolean;
  authProvider: 'local' | 'google'; // Type d'authentification
  googleId?: string; // ID Google pour les utilisateurs OAuth
  profilePicture?: string; // Photo de profil (principalement pour OAuth)
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les méthodes statiques du modèle User
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  createLocalUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<IUser>;
  createGoogleUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    profilePicture?: string;
  }): Promise<IUser>;
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
      required: function() {
        return this.authProvider === 'local';
      },
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
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Permet les valeurs null/undefined
    },
    profilePicture: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
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
userSchema.index({ googleId: 1 });
userSchema.index({ authProvider: 1 });

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

// Méthodes statiques pour la gestion des utilisateurs
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findByGoogleId = function(googleId: string) {
  return this.findOne({ googleId });
};

userSchema.statics.createLocalUser = function(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return this.create({
    ...userData,
    authProvider: 'local',
    emailVerified: false,
  });
};

userSchema.statics.createGoogleUser = function(userData: {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  profilePicture?: string;
}) {
  return this.create({
    ...userData,
    authProvider: 'google',
    emailVerified: true, // Google vérifie automatiquement l'email
  });
};

// Export du modèle
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
