import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config/env.js';

// Interface pour les données chiffrées
export interface EncryptedData {
  data: string; // Données chiffrées en base64
  iv: string; // IV en base64
}

/**
 * Convertit une clé base64 en Buffer
 */
function getKeyFromBase64(keyBase64: string): Buffer {
  try {
    return Buffer.from(keyBase64, 'base64');
  } catch (error) {
    throw new Error(`Clé de chiffrement invalide: ${error}`);
  }
}

/**
 * Obtient la clé de chiffrement (actuelle ou précédente)
 */
function getEncryptionKey(usePreviousKey = false): Buffer {
  const keyBase64 = usePreviousKey
    ? env.ENCRYPTION_KEY_PREVIOUS
    : env.ENCRYPTION_KEY_CURRENT;

  if (!keyBase64) {
    throw new Error(
      `Clé de chiffrement ${usePreviousKey ? 'précédente' : 'actuelle'} non définie`
    );
  }

  const key = getKeyFromBase64(keyBase64);

  if (key.length !== 32) {
    throw new Error(
      `La clé de chiffrement doit faire exactement 32 bytes (actuellement ${key.length})`
    );
  }

  return key;
}

/**
 * Chiffre un texte en utilisant AES-256-CBC
 * @param plaintext - Le texte à chiffrer
 * @returns Objet contenant les données chiffrées et l'IV en base64
 */
export function encrypt(plaintext: string): EncryptedData {
  if (!plaintext) {
    throw new Error('Le texte à chiffrer ne peut pas être vide');
  }

  try {
    const key = getEncryptionKey();
    const iv = randomBytes(16); // IV de 16 bytes pour AES-256-CBC
    const cipher = createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
      data: encrypted,
      iv: iv.toString('base64'),
    };
  } catch (error) {
    throw new Error(`Erreur de chiffrement: ${error}`);
  }
}

/**
 * Déchiffre un texte en utilisant AES-256-CBC
 * @param encryptedData - Les données chiffrées
 * @param usePreviousKey - Utiliser la clé précédente
 * @returns Le texte déchiffré
 */
export function decrypt(
  encryptedData: EncryptedData,
  usePreviousKey = false
): string {
  if (!encryptedData || !encryptedData.data || !encryptedData.iv) {
    throw new Error('Données chiffrées invalides');
  }

  try {
    const key = getEncryptionKey(usePreviousKey);
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Si le déchiffrement échoue avec la clé actuelle, essayer avec la clé précédente
    if (!usePreviousKey && env.ENCRYPTION_KEY_PREVIOUS) {
      try {
        return decrypt(encryptedData, true);
      } catch (previousError) {
        throw new Error(`Erreur de déchiffrement avec les deux clés: ${error}`);
      }
    }
    throw new Error(`Erreur de déchiffrement: ${error}`);
  }
}

/**
 * Génère une nouvelle clé de chiffrement en base64
 * @returns Une clé de 32 bytes encodée en base64
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64');
}

/**
 * Vérifie si une clé de chiffrement est valide
 * @param keyBase64 - La clé en base64
 * @returns true si la clé est valide
 */
export function isValidEncryptionKey(keyBase64: string): boolean {
  try {
    const key = getKeyFromBase64(keyBase64);
    return key.length === 32;
  } catch {
    return false;
  }
}
