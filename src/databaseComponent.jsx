import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebasedepc/Firebase"; // Import db from Firebase.jsx

// Function to fetch accounts from Firestore
const fetchAccounts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "Accounts"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return data;
  } catch (err) {
    console.error("Error fetching accounts:", err);
    throw err; // Re-throw the error to be handled by the caller
  }
};

// Function to handle login
export const handleLogin = async (username, password) => {
  const usernameInput = username.trim().toLowerCase();
  const passwordInput = password.trim();

  console.log("Attempting login...");

  try {
    const usersData = await fetchAccounts();
    console.log("Fetched users data:", usersData);

    const user = usersData.find(
      (user) => user.UID.trim().toLowerCase() === usernameInput
    );

    if (user) {
      if (user.Password === passwordInput) {
        console.log("Login successful!");
        // Store user data in local storage
        localStorage.setItem("userId", user.id); // Change user.UID to user.id
        localStorage.setItem("userName", user.Name);
        return true; // Indicate successful login
      } else {
        throw new Error("Incorrect password.");
      }
    } else {
      throw new Error("User not found.");
    }
  } catch (err) {
    console.error("Error during login:", err);
    throw err; // Re-throw the error to be handled by the caller
  }
};

// Function to get the latest login data in real-time
export const useLatestLogin = (callback) => {
  const unsubscribe = onSnapshot(
    query(collection(db, "history"), orderBy("LOGGED_IN", "desc"), limit(1)),
    (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error("Error listening for latest login:", err);
      callback(null, err); // Pass the error to the callback
    }
  );

  return unsubscribe; // Return the unsubscribe function
};

// Function to get the latest logout data in real-time
export const useLatestLogout = (callback) => {
  const unsubscribe = onSnapshot(
    query(collection(db, "history"), orderBy("LOGGED_OUT", "desc"), limit(1)),
    (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error("Error listening for latest logout:", err);
      callback(null, err); // Pass the error to the callback
    }
  );

  return unsubscribe; // Return the unsubscribe function
};

// Function to fetch all history data sorted by LOGGED_IN (descending)
export const fetchAllHistory = async () => {
  try {
    const historyCollection = collection(db, "history");
    const q = query(historyCollection, orderBy("LOGGED_IN", "desc")); // Add sorting here
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return data;
  } catch (err) {
    console.error("Error fetching history:", err);
    throw err; // Re-throw the error to be handled by the caller
  }
};

// New function to listen for username changes
export const useUsernameListener = (userId, callback) => {
  if (!userId) {
    callback(null);
    return () => {}; // Return an empty cleanup function
  }
  const userDocRef = doc(db, "Accounts", userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        callback(userData.Name); // Call the callback with the username
      } else {
        callback(null); // Call the callback with null if the user doesn't exist
      }
    },
    (err) => {
      console.error("Error listening for username:", err);
      callback(null); // Call the callback with null on error
    }
  );

  return unsubscribe; // Return the unsubscribe function
};
