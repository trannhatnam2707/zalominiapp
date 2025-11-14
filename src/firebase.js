import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = { 
  apiKey : "AIzaSyAxk_Pb7x7VWVZPL-Cqj0276IDkQd4VlXM" , 
  authDomain : "mini-zalo-app-f49b2.firebaseapp.com" , 
  projectId : "mini-zalo-app-f49b2" , 
  storageBucket : "mini-zalo-app-f49b2.firebasestorage.app" , 
  messagingSenderId : "769050370991" , 
  appId : "1:769050370991:web:bb1d11023b4179c45c055a" , 
  measurementId : "G-936J3QYCKQ" 
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;