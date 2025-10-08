import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.js';
import { IUser } from '../models/User.js';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware d'authentification JWT
 * Vérifie le token JWT et ajoute l'utilisateur à la requête
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Token d\'authentification requis',
      });
      return;
    }

    const token = authHeader.substring(7); // Enlève "Bearer "
    const user = await AuthService.verifyToken(token);

    if (!user) {
      res.status(401).json({
        error: 'Token invalide ou expiré',
      });
      return;
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est actif
 */
export const requireActiveUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentification requise',
    });
    return;
  }

  if (!req.user.isActive) {
    res.status(403).json({
      error: 'Compte désactivé',
    });
    return;
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur a un email vérifié
 */
export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentification requise',
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      error: 'Email non vérifié',
    });
    return;
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur utilise l'authentification locale
 */
export const requireLocalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentification requise',
    });
    return;
  }

  if (req.user.authProvider !== 'local') {
    res.status(403).json({
      error: 'Cette action nécessite une authentification locale',
    });
    return;
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur utilise l'authentification Google
 */
export const requireGoogleAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentification requise',
    });
    return;
  }

  if (req.user.authProvider !== 'google') {
    res.status(403).json({
      error: 'Cette action nécessite une authentification Google',
    });
    return;
  }

  next();
};
