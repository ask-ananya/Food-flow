// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_XIGzVo3Do3uA3jvkezy4lfMAsI_9V_4",
  authDomain: "rnauthfirebase-6af97.firebaseapp.com",
  projectId: "rnauthfirebase-6af97",
  storageBucket: "rnauthfirebase-6af97.firebasestorage.app",
  messagingSenderId: "79369524935",
  appId: "1:79369524935:web:18250b067c410c6727d0e2"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const FIREBASE_DB = getFirestore(FIREBASE_APP);