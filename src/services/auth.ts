import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { env } from '../config/env.js';

export interface AuthResult {
  success: boolean;
  user?: IUser;
  token?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface GoogleUserData {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_EXPIRES_IN = '7d';

  /**
   * Inscription d'un utilisateur avec email/mot de passe
   */
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: 'Un utilisateur avec cet email existe déjà',
        };
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Créer l'utilisateur
      const user = await User.createLocalUser({
        ...data,
        password: hashedPassword,
      });

      // Générer le token JWT
      const token = this.generateJWT(user);

      return {
        success: true,
        user,
        token,
        message: 'Inscription réussie',
      };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'inscription',
      };
    }
  }

  /**
   * Connexion d'un utilisateur avec email/mot de passe
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Trouver l'utilisateur
      const user = await User.findByEmail(credentials.email);
      if (!user) {
        return {
          success: false,
          message: 'Email ou mot de passe incorrect',
        };
      }

      // Vérifier que c'est un utilisateur local
      if (user.authProvider !== 'local') {
        return {
          success: false,
          message: 'Veuillez utiliser la connexion Google pour ce compte',
        };
      }

      // Vérifier le mot de passe
      if (!user.password) {
        return {
          success: false,
          message: 'Mot de passe non configuré',
        };
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Email ou mot de passe incorrect',
        };
      }

      // Vérifier que le compte est actif
      if (!user.isActive) {
        return {
          success: false,
          message: 'Compte désactivé',
        };
      }

      // Mettre à jour la dernière connexion
      user.lastLoginAt = new Date();
      await user.save();

      // Générer le token JWT
      const token = this.generateJWT(user);

      return {
        success: true,
        user,
        token,
        message: 'Connexion réussie',
      };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        message: 'Erreur lors de la connexion',
      };
    }
  }

  /**
   * Créer ou mettre à jour un utilisateur Google
   */
  static async handleGoogleAuth(googleUserData: GoogleUserData): Promise<AuthResult> {
    try {
      // Vérifier si l'utilisateur existe déjà par Google ID
      let user = await User.findByGoogleId(googleUserData.id);

      if (user) {
        // Mettre à jour les informations si nécessaire
        user.lastLoginAt = new Date();
        if (user.profilePicture !== googleUserData.picture) {
          user.profilePicture = googleUserData.picture;
        }
        await user.save();
      } else {
        // Vérifier si un utilisateur avec cet email existe déjà
        const existingUserByEmail = await User.findByEmail(googleUserData.email);
        
        if (existingUserByEmail) {
          // Si l'utilisateur existe avec un autre provider, on peut soit:
          // 1. Lier les comptes (recommandé)
          // 2. Rejeter la connexion
          // Ici, on lie les comptes en ajoutant les infos Google
          existingUserByEmail.googleId = googleUserData.id;
          existingUserByEmail.profilePicture = googleUserData.picture;
          existingUserByEmail.emailVerified = true;
          existingUserByEmail.lastLoginAt = new Date();
          await existingUserByEmail.save();
          
          user = existingUserByEmail;
        } else {
          // Créer un nouvel utilisateur Google
          const nameParts = googleUserData.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          user = await User.createGoogleUser({
            email: googleUserData.email,
            firstName,
            lastName,
            googleId: googleUserData.id,
            profilePicture: googleUserData.picture,
          });
        }
      }

      // Générer le token JWT
      const token = this.generateJWT(user);

      return {
        success: true,
        user,
        token,
        message: 'Connexion Google réussie',
      };
    } catch (error) {
      console.error('Erreur lors de l\'authentification Google:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'authentification Google',
      };
    }
  }

  /**
   * Vérifier un token JWT
   */
  static async verifyToken(token: string): Promise<IUser | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return null;
    }
  }

  /**
   * Générer un token JWT
   */
  private static generateJWT(user: IUser): string {
    return jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        authProvider: user.authProvider 
      },
      env.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  /**
   * Valider la force d'un mot de passe
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
