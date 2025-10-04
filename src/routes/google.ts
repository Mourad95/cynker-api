import express from 'express';
import { GmailService } from '../services/google/gmail.js';
import { GoogleSheetsService } from '../services/google/sheets.js';
import { GoogleCalendarService } from '../services/google/calendar.js';

const router = express.Router();

// Gmail routes
/**
 * Envoie un email via Gmail
 * POST /api/google/gmail/send
 */
router.post('/gmail/send', async (req, res) => {
  try {
    const { userId, to, subject, body, isHtml } = req.body;

    if (!userId || !to || !subject || !body) {
      return res.status(400).json({
        error: 'userId, to, subject et body sont requis',
      });
    }

    await GmailService.sendEmail(userId, to, subject, body, isHtml);

    res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Récupère les emails de l'utilisateur
 * GET /api/google/gmail/emails/:userId
 */
router.get('/gmail/emails/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxResults } = req.query;

    const emails = await GmailService.getEmails(
      userId,
      parseInt(maxResults as string) || 10
    );

    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Récupère le contenu d'un email spécifique
 * GET /api/google/gmail/email/:userId/:messageId
 */
router.get('/gmail/email/:userId/:messageId', async (req, res) => {
  try {
    const { userId, messageId } = req.params;

    const emailContent = await GmailService.getEmailContent(userId, messageId);

    res.json({ email: emailContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Marque un email comme lu/non lu
 * PATCH /api/google/gmail/mark/:userId/:messageId
 */
router.patch('/gmail/mark/:userId/:messageId', async (req, res) => {
  try {
    const { userId, messageId } = req.params;
    const { read } = req.body;

    await GmailService.markAsRead(userId, messageId, read);

    res.json({
      success: true,
      message: `Email marqué comme ${read ? 'lu' : 'non lu'}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Sheets routes
/**
 * Lit les données d'une feuille de calcul
 * GET /api/google/sheets/:spreadsheetId/:range
 */
router.get('/sheets/:spreadsheetId/:range', async (req, res) => {
  try {
    const { userId } = req.body;
    const { spreadsheetId, range } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis dans le body' });
    }

    const data = await GoogleSheetsService.readSheet(
      userId,
      spreadsheetId,
      range
    );

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Écrit des données dans une feuille de calcul
 * PUT /api/google/sheets/:spreadsheetId/:range
 */
router.put('/sheets/:spreadsheetId/:range', async (req, res) => {
  try {
    const { userId, values } = req.body;
    const { spreadsheetId, range } = req.params;

    if (!userId || !values) {
      return res.status(400).json({ error: 'userId et values sont requis' });
    }

    await GoogleSheetsService.writeSheet(userId, spreadsheetId, range, values);

    res.json({ success: true, message: 'Données écrites avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Crée une nouvelle feuille de calcul
 * POST /api/google/sheets/create
 */
router.post('/sheets/create', async (req, res) => {
  try {
    const { userId, title } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: 'userId et title sont requis' });
    }

    const result = await GoogleSheetsService.createSpreadsheet(userId, title);

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Récupère les métadonnées d'une feuille de calcul
 * GET /api/google/sheets/metadata/:spreadsheetId
 */
router.get('/sheets/metadata/:spreadsheetId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { spreadsheetId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis dans le body' });
    }

    const metadata = await GoogleSheetsService.getSpreadsheetMetadata(
      userId,
      spreadsheetId
    );

    res.json({ metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Ajoute une nouvelle feuille dans un spreadsheet
 * POST /api/google/sheets/:spreadsheetId/add-sheet
 */
router.post('/sheets/:spreadsheetId/add-sheet', async (req, res) => {
  try {
    const { userId, sheetTitle } = req.body;
    const { spreadsheetId } = req.params;

    if (!userId || !sheetTitle) {
      return res
        .status(400)
        .json({ error: 'userId et sheetTitle sont requis' });
    }

    await GoogleSheetsService.addSheet(userId, spreadsheetId, sheetTitle);

    res.json({ success: true, message: 'Feuille ajoutée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Calendar routes
/**
 * Crée un événement dans le calendrier
 * POST /api/google/calendar/events
 */
router.post('/calendar/events', async (req, res) => {
  try {
    const { userId, calendarId, event } = req.body;

    if (!userId || !calendarId || !event) {
      return res.status(400).json({
        error: 'userId, calendarId et event sont requis',
      });
    }

    const createdEvent = await GoogleCalendarService.createEvent(
      userId,
      calendarId,
      event
    );

    res.json({ success: true, event: createdEvent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Récupère les événements du calendrier
 * GET /api/google/calendar/events/:calendarId
 */
router.get('/calendar/events/:calendarId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { calendarId } = req.params;
    const { timeMin, timeMax } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis dans le body' });
    }

    const events = await GoogleCalendarService.getEvents(
      userId,
      calendarId,
      timeMin as string,
      timeMax as string
    );

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Met à jour un événement existant
 * PUT /api/google/calendar/events/:calendarId/:eventId
 */
router.put('/calendar/events/:calendarId/:eventId', async (req, res) => {
  try {
    const { userId, event } = req.body;
    const { calendarId, eventId } = req.params;

    if (!userId || !event) {
      return res.status(400).json({ error: 'userId et event sont requis' });
    }

    const updatedEvent = await GoogleCalendarService.updateEvent(
      userId,
      calendarId,
      eventId,
      event
    );

    res.json({ success: true, event: updatedEvent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Supprime un événement
 * DELETE /api/google/calendar/events/:calendarId/:eventId
 */
router.delete('/calendar/events/:calendarId/:eventId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { calendarId, eventId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis dans le body' });
    }

    await GoogleCalendarService.deleteEvent(userId, calendarId, eventId);

    res.json({ success: true, message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Récupère la liste des calendriers de l'utilisateur
 * GET /api/google/calendar/calendars
 */
router.get('/calendar/calendars', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis dans le body' });
    }

    const calendars = await GoogleCalendarService.getCalendars(userId);

    res.json({ calendars });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Crée un nouveau calendrier
 * POST /api/google/calendar/create
 */
router.post('/calendar/create', async (req, res) => {
  try {
    const { userId, title, description, timeZone } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: 'userId et title sont requis' });
    }

    const calendar = await GoogleCalendarService.createCalendar(
      userId,
      title,
      description,
      timeZone
    );

    res.json({ success: true, calendar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
