import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCNpbWT1EhsrSg2Gn7nv-682ZOWJv-DrEw",
  authDomain: "rideshare-817e0.firebaseapp.com",
  projectId: "rideshare-817e0",
  storageBucket: "rideshare-817e0.firebasestorage.app",
  messagingSenderId: "1026935652876",
  appId: "1:1026935652876:web:4c9b081efc359d466ce429"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
