import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// If you prefer env vars, move these to Vite env and read via import.meta.env
const firebaseConfig = {
  apiKey: 'AIzaSyD0oU7iTokciSD_ZZtr68dju1zEXL_ecPA',
  authDomain: 'yunax-873e2.firebaseapp.com',
  projectId: 'yunax-873e2',
  storageBucket: 'yunax-873e2.firebasestorage.app',
  messagingSenderId: '921032384229',
  appId: '1:921032384229:web:0fa15994dcb272bda83e0c',
  measurementId: 'G-2DZZ5MXXYH',
};

// Avoid re-initializing in Vite HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Analytics only runs in browser and when supported
let analytics;
isSupported()
  .then((ok) => {
    if (ok) analytics = getAnalytics(app);
  })
  .catch(() => {
    /* ignore analytics failures */
  });

export { app, auth, db, analytics };
