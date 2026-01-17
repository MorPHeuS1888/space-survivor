// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- COLA AQUI A TUA CONFIGURAÇÃO DO SITE DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDhDOXbQs4lruCk5yW61IDHHxrISCREjw4",
  authDomain: "spacesurvivor-6efcc.firebaseapp.com",
  projectId: "spacesurvivor-6efcc",
  storageBucket: "spacesurvivor-6efcc.firebasestorage.app",
  messagingSenderId: "1081144819584",
  appId: "1:1081144819584:web:454dc2a04be2d51e640b65"
};
// -------------------------------------------------------

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);