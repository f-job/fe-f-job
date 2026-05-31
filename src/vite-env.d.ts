/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute origin of the backend API (empty in local dev). */
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_SECRET?: string;
  readonly VITE_GOOGLE_REDIRECT_URI?: string;
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_FACEBOOK_APP_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
