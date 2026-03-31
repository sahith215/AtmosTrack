/**
 * Centralised runtime config — read from Vite env vars.
 */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
