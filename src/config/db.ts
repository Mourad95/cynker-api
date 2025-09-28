import mongoose from 'mongoose';
import { env } from './env.js';

// Connexion à MongoDB avec Mongoose
export const connectDB = async (): Promise<void> => {
  try {
    // Configuration des options de connexion
    const options = {
      maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
      serverSelectionTimeoutMS: 5000, // Garder la tentative de connexion ouverte pendant 5 secondes
      socketTimeoutMS: 45000, // Fermer les sockets après 45 secondes d'inactivité
      bufferCommands: false, // Désactiver le buffering mongoose
    };

    console.log('🔄 Tentative de connexion à MongoDB...');

    await mongoose.connect(env.MONGODB_URI, options);

    console.log('✅ Mongo connected');

    // Gestion des événements de connexion
    mongoose.connection.on('error', (error) => {
      console.error('❌ Erreur de connexion MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnecté');
    });

    // Gestion gracieuse de la fermeture
    process.on('SIGINT', async () => {
      console.log('🛑 Fermeture de la connexion MongoDB...');
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};
