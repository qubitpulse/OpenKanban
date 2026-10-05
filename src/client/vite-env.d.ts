/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "firebase" stores the board in Firestore behind a login; otherwise the Hono API is used */
  readonly VITE_BACKEND?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
