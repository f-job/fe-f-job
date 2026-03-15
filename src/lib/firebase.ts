import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type Auth,
} from 'firebase/auth';
import { formatVietnamesePhone } from './phone';

// Re-export phone utilities for convenience
export { formatVietnamesePhone, isValidVietnamesePhone } from './phone';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Get the Firebase app instance (lazy singleton — safe for hot reload).
 */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Get the Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * Set up an invisible reCAPTCHA verifier on a given button element.
 * Must be called from a client component (browser only).
 */
export function setupRecaptcha(buttonId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  const verifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — will proceed with sendOtp
    },
  });
  return verifier;
}

/**
 * Send OTP to a phone number using Firebase Auth.
 * Returns a ConfirmationResult that can be used to verify the code.
 */
export async function sendOtp(
  phone: string,
  recaptchaVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const e164Phone = formatVietnamesePhone(phone);
  return signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier);
}

/**
 * Verify the 6-digit OTP code using the ConfirmationResult from sendOtp.
 */
export async function verifyOtp(
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<string> {
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Mã OTP phải gồm 6 chữ số.');
  }
  const userCredential = await confirmationResult.confirm(code);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
}
