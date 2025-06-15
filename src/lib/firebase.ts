// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - real config from your Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyD8ajizcba8hH63jCVqPvro-evYpoo5SC8",
  authDomain: "arab-syr.firebaseapp.com",
  projectId: "arab-syr",
  storageBucket: "arab-syr.firebasestorage.app",
  messagingSenderId: "739945251083",
  appId: "1:739945251083:web:74d07bd93aebf07777220e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
