import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import "./LoginLogout.css";

const firebaseConfig = {
  apiKey: "AIzaSyD1mo1I8KEXOWrrbad_ITE0z-wM5fIueDY",
  authDomain: "iasdb-b56c8.firebaseapp.com",
  projectId: "iasdb-b56c8",
  storageBucket: "iasdb-b56c8.firebasestorage.app",
  messagingSenderId: "1035364535383",
  appId: "1:1035364535383:web:504911504c73d52fe86712",
  measurementId: "G-WY6WMMN571",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function LoginLogout() {
  const [userId, setUserId] = useState("");
  const [buttonText, setButtonText] = useState("Login");
  const [isLoading, setIsLoading] = useState(false);

  const isUserLoggedIn = async (userId) => {
    const q = query(
      collection(db, "history"),
      where("ID", "==", userId),
      where("LOGGED_OUT", "==", null)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const logLogin = async (userId) => {
    try {
      const docRef = await addDoc(collection(db, "history"), {
        ID: userId,
        LOGGED_IN: serverTimestamp(),
        LOGGED_OUT: null,
        TotalTime: null,
      });
      console.log("Document written with ID: ", docRef.id);
      alert("Logged in entry created successfully!");
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error creating logged in entry. Check console for details.");
      return null;
    }
  };

  const calculateTotalTime = async (loggedInTimestamp, loggedOutTimestamp) => {
    const loggedInDate = loggedInTimestamp.toDate();
    const loggedOutDate = new Date();
    const timeDifference = loggedOutDate.getTime() - loggedInDate.getTime();
    const totalSeconds = Math.floor(timeDifference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const logLogout = async (userId) => {
    try {
      const q = query(
        collection(db, "history"),
        where("ID", "==", userId),
        where("LOGGED_OUT", "==", null)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("No active login found for this user.");
        return;
      }

      const docToUpdate = querySnapshot.docs[0];
      const docRef = doc(db, "history", docToUpdate.id);
      const loginData = docToUpdate.data();
      const loggedInTimestamp = loginData.LOGGED_IN;
      const loggedOutTimestamp = serverTimestamp();
      const totalTime = await calculateTotalTime(
        loggedInTimestamp,
        loggedOutTimestamp
      );

      await updateDoc(docRef, {
        LOGGED_OUT: loggedOutTimestamp,
        TotalTime: totalTime,
      });

      alert("Logout successful!");
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Error during logout. Check console for details.");
    }
  };

  const handleToggle = async () => {
    if (!userId.trim()) {
      alert("Please enter a user ID.");
      return;
    }

    setIsLoading(true);
    try {
      const loggedIn = await isUserLoggedIn(userId);
      if (loggedIn) {
        await logLogout(userId);
        setButtonText("Login");
      } else {
        await logLogin(userId);
        setButtonText("Logout");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-logout-page">
      <div className="login-logout-container">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="user-input"
        />
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="toggle-button"
        >
          {isLoading ? "Processing..." : buttonText}
        </button>
      </div>
    </div>
  );
}

export default LoginLogout;
