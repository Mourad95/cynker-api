#!/usr/bin/env node

/**
 * Script de démonstration pour l'intégration OAuth2 Google
 *
 * Ce script montre comment utiliser l'API OAuth2 Google de manière interactive
 *
 * Usage: node scripts/demo-google-oauth.js
 */

import axios from 'axios';
import readline from 'readline';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Fonction utilitaire pour poser des questions
const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

// Fonction pour faire des requêtes HTTP
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur API:', error.response?.data || error.message);
    return null;
  }
};

// Fonction pour afficher le menu
const showMenu = () => {
  console.log('\n🔐 Menu OAuth2 Google');
  console.log('===================');
  console.log('1. Initier la connexion Google');
  console.log('2. Vérifier le statut de connexion');
  console.log('3. Envoyer un email via Gmail');
  console.log('4. Récupérer les emails');
  console.log('5. Créer un événement calendrier');
  console.log('6. Lire une feuille Google Sheets');
  console.log('7. Déconnexion Google');
  console.log('0. Quitter');
  console.log('===================');
};

// Fonction pour initier la connexion Google
const initiateGoogleAuth = async () => {
  const userId = await question('Entrez votre userId: ');

  console.log('\n🔄 Initiation de la connexion Google...');
  const result = await apiRequest('GET', `/oauth/google?userId=${userId}`);

  if (result) {
    console.log("✅ URL d'autorisation générée:");
    console.log(result.authUrl);
    console.log('\n📋 Instructions:');
    console.log("1. Copiez l'URL ci-dessus dans votre navigateur");
    console.log("2. Autorisez l'application sur Google");
    console.log('3. Vous serez redirigé automatiquement');
    console.log('4. Les tokens seront sauvegardés automatiquement');
  }
};

// Fonction pour vérifier le statut
const checkConnectionStatus = async () => {
  const userId = await question('Entrez votre userId: ');

  console.log('\n🔍 Vérification du statut de connexion...');
  const result = await apiRequest(
    'GET',
    `/oauth/google/status?userId=${userId}`
  );

  if (result) {
    console.log('📊 Statut de connexion:');
    console.log(`- Connecté: ${result.connected ? '✅' : '❌'}`);
    if (result.connected) {
      console.log(`- Token valide: ${result.isValid ? '✅' : '❌'}`);
      console.log(`- Expire le: ${result.expiresAt}`);
      console.log(`- Scopes: ${result.scope.join(', ')}`);
    }
  }
};

// Fonction pour envoyer un email
const sendEmail = async () => {
  const userId = await question('Entrez votre userId: ');
  const to = await question('Destinataire (email): ');
  const subject = await question('Sujet: ');
  const body = await question('Contenu: ');

  console.log("\n📧 Envoi de l'email...");
  const result = await apiRequest('POST', '/api/google/gmail/send', {
    userId,
    to,
    subject,
    body,
    isHtml: false,
  });

  if (result) {
    console.log('✅ Email envoyé avec succès!');
  }
};

// Fonction pour récupérer les emails
const getEmails = async () => {
  const userId = await question('Entrez votre userId: ');
  const maxResults =
    (await question("Nombre d'emails à récupérer (défaut: 10): ")) || '10';

  console.log('\n📬 Récupération des emails...');
  const result = await apiRequest(
    'GET',
    `/api/google/gmail/emails/${userId}?maxResults=${maxResults}`
  );

  if (result) {
    console.log(`📧 ${result.emails.length} emails récupérés:`);
    result.emails.forEach((email, index) => {
      console.log(`${index + 1}. ID: ${email.id}`);
    });
  }
};

// Fonction pour créer un événement calendrier
const createCalendarEvent = async () => {
  const userId = await question('Entrez votre userId: ');
  const summary = await question("Titre de l'événement: ");
  const description = await question('Description (optionnel): ');
  const startTime = await question('Heure de début (YYYY-MM-DDTHH:MM:SS): ');
  const endTime = await question('Heure de fin (YYYY-MM-DDTHH:MM:SS): ');

  console.log("\n📅 Création de l'événement...");
  const result = await apiRequest('POST', '/api/google/calendar/events', {
    userId,
    calendarId: 'primary',
    event: {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Europe/Paris',
      },
    },
  });

  if (result) {
    console.log('✅ Événement créé avec succès!');
    console.log(`ID: ${result.event.id}`);
  }
};

// Fonction pour lire une feuille Google Sheets
const readGoogleSheet = async () => {
  const userId = await question('Entrez votre userId: ');
  const spreadsheetId = await question('ID de la feuille de calcul: ');
  const range = await question('Plage à lire (ex: A1:C10): ');

  console.log('\n📊 Lecture de la feuille de calcul...');
  const result = await apiRequest(
    'GET',
    `/api/google/sheets/${spreadsheetId}/${range}`,
    {
      userId,
    }
  );

  if (result) {
    console.log('📋 Données récupérées:');
    result.data.forEach((row, index) => {
      console.log(`Ligne ${index + 1}: ${row.join(' | ')}`);
    });
  }
};

// Fonction pour déconnexion
const disconnectGoogle = async () => {
  const userId = await question('Entrez votre userId: ');

  console.log('\n🔌 Déconnexion de Google...');
  const result = await apiRequest('DELETE', '/oauth/google', { userId });

  if (result) {
    console.log('✅ Déconnexion réussie!');
  }
};

// Fonction principale
const main = async () => {
  console.log('🚀 Démonstration OAuth2 Google - Cynker API');
  console.log(`🌐 URL de base: ${BASE_URL}`);
  console.log('📋 Assurez-vous que le serveur est démarré (yarn dev)');

  let running = true;

  while (running) {
    showMenu();
    const choice = await question('\nChoisissez une option (0-7): ');

    switch (choice) {
      case '1':
        await initiateGoogleAuth();
        break;
      case '2':
        await checkConnectionStatus();
        break;
      case '3':
        await sendEmail();
        break;
      case '4':
        await getEmails();
        break;
      case '5':
        await createCalendarEvent();
        break;
      case '6':
        await readGoogleSheet();
        break;
      case '7':
        await disconnectGoogle();
        break;
      case '0':
        console.log('👋 Au revoir!');
        running = false;
        break;
      default:
        console.log('❌ Option invalide, veuillez réessayer.');
    }

    if (running) {
      await question('\nAppuyez sur Entrée pour continuer...');
    }
  }

  rl.close();
};

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Démarrage du script
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
