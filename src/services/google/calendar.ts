import axios from 'axios';
import { GoogleOAuth2 } from '../../utils/oauth/google.js';

export class GoogleCalendarService {
  private static readonly CALENDAR_API_BASE =
    'https://www.googleapis.com/calendar/v3';

  /**
   * Crée un événement dans le calendrier
   */
  static async createEvent(
    userId: string,
    calendarId: string,
    event: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees?: Array<{ email: string; displayName?: string }>;
      location?: string;
    }
  ): Promise<any> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.post(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`,
        event,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur création événement:', error);
      throw new Error("Échec de la création de l'événement");
    }
  }

  /**
   * Récupère les événements du calendrier
   */
  static async getEvents(
    userId: string,
    calendarId: string,
    timeMin?: string,
    timeMax?: string
  ): Promise<any[]> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      throw new Error('Échec de la récupération des événements');
    }
  }

  /**
   * Met à jour un événement existant
   */
  static async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    event: any
  ): Promise<any> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.put(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        event,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour événement:', error);
      throw new Error("Échec de la mise à jour de l'événement");
    }
  }

  /**
   * Supprime un événement
   */
  static async deleteEvent(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      await axios.delete(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      throw new Error("Échec de la suppression de l'événement");
    }
  }

  /**
   * Récupère la liste des calendriers de l'utilisateur
   */
  static async getCalendars(userId: string): Promise<any[]> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.CALENDAR_API_BASE}/users/me/calendarList`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erreur récupération calendriers:', error);
      throw new Error('Échec de la récupération des calendriers');
    }
  }

  /**
   * Crée un nouveau calendrier
   */
  static async createCalendar(
    userId: string,
    title: string,
    description?: string,
    timeZone?: string
  ): Promise<any> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.post(
        `${this.CALENDAR_API_BASE}/calendars`,
        {
          summary: title,
          description,
          timeZone: timeZone || 'Europe/Paris',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur création calendrier:', error);
      throw new Error('Échec de la création du calendrier');
    }
  }
}
