import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebasedepc/Firebase"; // Ensure this path is correct

// --- Constants ---
const ACCOUNTS_COLLECTION = "Accounts";
const HISTORY_COLLECTION = "history";
const CONFIG_DOC_PATH = "config/parking"; // Path to the capacity config document
const CAPACITY_FIELD = "capacity"; // Field name for total capacity

// --- Authentication & User Data ---

/**
 * Fetches all user accounts.
 * WARNING: Fetching all accounts on the client is generally inefficient and insecure.
 */
const fetchAccounts = async () => {
  try {
    const accountsCollectionRef = collection(db, ACCOUNTS_COLLECTION);
    const querySnapshot = await getDocs(accountsCollectionRef);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Error fetching accounts:", err);
    throw new Error("Failed to fetch user accounts.");
  }
};

/**
 * Handles user login by verifying credentials against fetched accounts.
 * **************************************************************************
 * SECURITY WARNING: Storing and comparing plaintext passwords on the client-side
 * after fetching all user data is HIGHLY INSECURE.
 * Please migrate to Firebase Authentication for a secure solution.
 * **************************************************************************
 * @param {string} username - The username input.
 * @param {string} password - The password input.
 * @returns {Promise<boolean>} - True if login is successful.
 * @throws {Error} - If login fails.
 */
export const handleLogin = async (username, password) => {
  const usernameInput = username?.trim().toLowerCase(); // Optional chaining for safety
  const passwordInput = password?.trim();

  if (!usernameInput || !passwordInput) {
    throw new Error("Username and password are required.");
  }

  console.log("Attempting login...");

  try {
    // SECURITY RISK: Fetching all user data to the client.
    const usersData = await fetchAccounts();

    // Assuming 'UID' field stores the username.
    const user = usersData.find(
      (u) => u.UID && u.UID.trim().toLowerCase() === usernameInput
    );

    if (!user) {
      console.warn(`Login failed: User '${usernameInput}' not found.`);
      throw new Error("User not found.");
    }

    // SECURITY RISK: Comparing plaintext password.
    if (user.Password === passwordInput) {
      console.log(`Login successful for user: ${user.Name} (ID: ${user.id})`);
      // Store minimal necessary, non-sensitive user info
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.Name || "");
      return true;
    } else {
      console.warn(
        `Login failed: Incorrect password for user '${usernameInput}'.`
      );
      throw new Error("Incorrect password.");
    }
  } catch (err) {
    console.error("Error during login process:", err);
    // Re-throw specific login errors or a generic one
    if (
      err.message === "User not found." ||
      err.message === "Incorrect password." ||
      err.message === "Username and password are required."
    ) {
      throw err;
    }
    throw new Error("Login failed due to an unexpected error.");
  }
};

/**
 * Listens for changes to the username of a specific user.
 * @param {string | null} userId - The Firestore document ID of the user in the 'Accounts' collection.
 * @param {function(string | null, Error | null)} callback - Called with the username or null, and an optional error.
 * @returns {function} - Unsubscribe function.
 */
export const useUsernameListener = (userId, callback) => {
  if (!userId) {
    // Ensure callback is called asynchronously even when returning early
    setTimeout(() => callback(null), 0);
    return () => {}; // Return a no-op unsubscribe function
  }

  const userDocRef = doc(db, ACCOUNTS_COLLECTION, userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        // Pass the name (or null if missing) to the callback
        callback(userData.Name || null);
      } else {
        console.warn(
          `User document with ID ${userId} not found for username listener.`
        );
        callback(null); // User document doesn't exist
      }
    },
    (err) => {
      console.error(`Error listening for username (User ID: ${userId}):`, err);
      callback(null, err); // Pass null for name and the error
    }
  );

  return unsubscribe;
};

// --- History & Parking Status ---

/**
 * Listens for the latest login event in the history.
 * @param {function(object | null, Error | null)} callback - Called with the latest login data object (incl. id) or null, and an optional error.
 * @returns {function} - Unsubscribe function.
 */
export const useLatestLogin = (callback) => {
  const historyCollectionRef = collection(db, HISTORY_COLLECTION);
  const q = query(historyCollectionRef, orderBy("LOGGED_IN", "desc"), limit(1));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[0];
        // Ensure the latest document has a LOGGED_IN timestamp before calling back
        if (latestDoc.data().LOGGED_IN) {
          callback({ id: latestDoc.id, ...latestDoc.data() });
        } else {
          console.warn("Latest history entry is missing LOGGED_IN timestamp.");
          callback(null); // Data inconsistency
        }
      } else {
        callback(null); // No history entries found
      }
    },
    (err) => {
      console.error("Error listening for latest login:", err);
      callback(null, err);
    }
  );

  return unsubscribe;
};

/**
 * Listens for the latest logout event in the history.
 * @param {function(object | null, Error | null)} callback - Called with the latest logout data object (incl. id) or null, and an optional error.
 * @returns {function} - Unsubscribe function.
 */
export const useLatestLogout = (callback) => {
  const historyCollectionRef = collection(db, HISTORY_COLLECTION);
  // Query for documents that HAVE a LOGGED_OUT timestamp, order by it
  const q = query(
    historyCollectionRef,
    where("LOGGED_OUT", "!=", null), // Filter for documents with a LOGGED_OUT value
    orderBy("LOGGED_OUT", "desc"),
    limit(1)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[0];
        callback({ id: latestDoc.id, ...latestDoc.data() });
      } else {
        callback(null); // No logout entries found yet
      }
    },
    (err) => {
      console.error("Error listening for latest logout:", err);
      callback(null, err);
    }
  );

  return unsubscribe;
};

/**
 * Fetches all history entries, ordered by login time descending.
 * Consider adding pagination or limits for very large history collections.
 * @returns {Promise<Array<object>>} - Array of history documents with IDs.
 * @throws {Error} - If fetching fails.
 */
export const fetchAllHistory = async () => {
  try {
    const historyCollectionRef = collection(db, HISTORY_COLLECTION);
    const q = query(historyCollectionRef, orderBy("LOGGED_IN", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Error fetching all history:", err);
    throw new Error("Failed to fetch parking history.");
  }
};

// --- Real-time & One-Time Counts ---

/**
 * Listens for real-time changes to the count of currently logged-in vehicles.
 * Assumes a 'history' collection where entries without a 'LOGGED_OUT' timestamp are considered logged in.
 * NOTE: Listening to query result size can be less efficient/costly than maintaining a dedicated counter document,
 * especially with large datasets or frequent updates. Consider using a counter updated via Cloud Functions.
 * @param {function(number | null, Error | null)} callback - Called with the current count or null, and an optional error.
 * @returns {function} - Unsubscribe function.
 */
export const useLoggedInCountListener = (callback) => {
  const historyCollectionRef = collection(db, HISTORY_COLLECTION);
  const q = query(historyCollectionRef, where("LOGGED_OUT", "==", null));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // snapshot.size gives the number of documents matching the query
      callback(snapshot.size);
    },
    (err) => {
      console.error("Error listening for logged-in count:", err);
      callback(null, err); // Pass null for count and the error
    }
  );

  return unsubscribe;
};

/**
 * Gets the total count of logout events recorded in history (one-time fetch).
 * Assumes a 'LOGGED_OUT' timestamp indicates a logout event.
 * @returns {Promise<number>} - The total count of logout events.
 * @throws {Error} - If counting fails.
 */
export const getLoggedOutCount = async () => {
  try {
    const historyRef = collection(db, HISTORY_COLLECTION);
    const q = query(historyRef, where("LOGGED_OUT", "!=", null));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting total logged-out count:", error);
    throw new Error("Failed to count total departures.");
  }
};

/**
 * Gets the total count of login events recorded in history (one-time fetch).
 * Assumes every document in 'history' represents a login/entry event.
 * @returns {Promise<number>} - The total count of login events.
 * @throws {Error} - If counting fails.
 */
export const getTotalEnteredCount = async () => {
  try {
    const historyRef = collection(db, HISTORY_COLLECTION);
    // If *every* document represents an entry, no 'where' clause is needed.
    const q = query(historyRef);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting total entered count:", error);
    throw new Error("Failed to count total entries.");
  }
};

/**
 * Gets the total parking capacity from configuration (one-time fetch).
 * Assumes a document at CONFIG_DOC_PATH with a numeric field named CAPACITY_FIELD.
 * @returns {Promise<number>} - The total capacity, or 0 if not found/invalid.
 * @throws {Error} - If fetching fails.
 */
export const getTotalCapacity = async () => {
  try {
    const docRef = doc(db, CONFIG_DOC_PATH);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const capacity = docSnap.data()[CAPACITY_FIELD];
      // Validate that capacity is a non-negative number
      if (typeof capacity === "number" && capacity >= 0) {
        return capacity;
      } else {
        console.warn(
          `Invalid '${CAPACITY_FIELD}' field in document '${CONFIG_DOC_PATH}'. Found:`,
          capacity,
          "Returning 0."
        );
        return 0; // Return 0 if capacity is not a valid number
      }
    } else {
      console.warn(
        `Parking config document ('${CONFIG_DOC_PATH}') not found! Defaulting capacity to 0.`
      );
      return 0; // Default capacity if document missing
    }
  } catch (error) {
    console.error(
      `Error getting total capacity from '${CONFIG_DOC_PATH}':`,
      error
    );
    throw new Error("Failed to get parking capacity.");
  }
};
