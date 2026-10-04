'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Sin config (ver .env.local.example) el hub corre sin login, como hasta ahora.
export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey);
const app = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;

// Base de datos de Firestore del hub (por defecto "(default)"; si usas una base con nombre, ponla en NEXT_PUBLIC_FIRESTORE_DATABASE).
export const FIRESTORE_DATABASE = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || '(default)';
export const db = app ? getFirestore(app, FIRESTORE_DATABASE) : null;

// Dominio de correo con acceso: ver lib/brand.js (NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN).
export { ALLOWED_EMAIL_DOMAIN } from '@/lib/brand';
