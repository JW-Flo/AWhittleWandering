/**
 * Shared data model for email subscriptions
 * This serves as the source of truth for all components
 */

export interface EmailPreference {
  daily: boolean;
  weekly: boolean;
  tripUpdates: boolean;
  weatherAlerts: boolean;
}

export interface EmailSubscriber {
  email: string;
  dateAdded: string;
  preferences: EmailPreference;
  verificationToken?: string;
  verified: boolean;
  lastEmailSent?: string;
}

export type EmailTemplateType = 'welcome' | 'verification' | 'dailyUpdate' | 'weeklyUpdate' | 'tripUpdate' | 'weatherAlert';

export interface EmailTemplate {
  type: EmailTemplateType;
  subject: string;
  contentTemplate: string;
}

/**
 * Helper functions for email subscription management
 */

/**
 * Validates an email address with a more robust check
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
}

/**
 * Creates a verification token
 */
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Gets default preferences
 */
export function getDefaultPreferences(): EmailPreference {
  return {
    daily: false,
    weekly: true,
    tripUpdates: true,
    weatherAlerts: true
  };
}
