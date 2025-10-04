export class ScopeValidator {
  private static readonly ALLOWED_SCOPES = {
    google: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    facebook: [
      'email',
      'public_profile',
      'pages_manage_posts',
      'pages_read_engagement',
    ],
    instagram: [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
    ],
    whatsapp: ['whatsapp_business_management', 'whatsapp_business_messaging'],
    outlook: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Calendars.ReadWrite',
    ],
    asana: ['default'],
    notion: ['read', 'insert', 'update'],
    calendly: ['default'],
    linkedin: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
  };

  static validateScopes(provider: string, requestedScopes: string[]): string[] {
    const allowedScopes =
      this.ALLOWED_SCOPES[provider as keyof typeof this.ALLOWED_SCOPES];

    if (!allowedScopes) {
      throw new Error(`Provider ${provider} non supporté`);
    }

    return requestedScopes.filter((scope) => allowedScopes.includes(scope));
  }

  static getAllowedScopes(provider: string): string[] {
    const allowedScopes =
      this.ALLOWED_SCOPES[provider as keyof typeof this.ALLOWED_SCOPES];

    if (!allowedScopes) {
      throw new Error(`Provider ${provider} non supporté`);
    }

    return allowedScopes;
  }
}
