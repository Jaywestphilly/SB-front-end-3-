/// <reference types="vite/client" />
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import firebaseConfigRaw from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigRaw.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');


export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  username?: string | null;
}

// Local persistence fallback if Firebase isn't fully provisioned in current environment
export const saveUserDataLocally = <T>(key: string, data: T) => {
  try {
    if (data === null || data === undefined) {
      localStorage.removeItem(`stockbloc_user_${key}`);
      if (key === "profile") {
        localStorage.removeItem("user_session");
      }
    } else {
      localStorage.setItem(`stockbloc_user_${key}`, JSON.stringify(data));
      if (key === "profile") {
        localStorage.setItem("user_session", typeof data === 'object' ? JSON.stringify(data) : String(data));
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stockbloc_auth_changed", { detail: { key, data } }));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.warn("Unable to save locally", e);
  }
};

export const getUserDataLocally = <T>(key: string, fallback: T | null = null): T | null => {
  try {
    const raw = localStorage.getItem(`stockbloc_user_${key}`) || (key === "profile" ? (localStorage.getItem("user_session") || localStorage.getItem("stock_bloc_profile")) : null);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    return fallback;
  }
};
