/**
 * Shared types for PathFinders
 */

export interface AuthError {
  message: string;
  code?: string;
}

export interface OtpResult {
  success: boolean;
  error?: string;
}
