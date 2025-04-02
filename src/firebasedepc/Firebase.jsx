import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyD1mo1I8KEXOWrrbad_ITE0z-wM5fIueDY",
  authDomain: "iasdb-b56c8.firebaseapp.com",
  projectId: "iasdb-b56c8",
  storageBucket: "iasdb-b56c8.firebasestorage.app",
  messagingSenderId: "1035364535383",
  appId: "1:1035364535383:web:504911504c73d52fe86712",
  measurementId: "G-WY6WMMN571",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db }; // Add this line to export the db object
