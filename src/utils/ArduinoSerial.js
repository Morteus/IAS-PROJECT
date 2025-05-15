import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const SERVICE_ACCOUNT_PATH = join(
  __dirname,
  "../../config/serviceAccountKey.json" // Make sure this points to config folder
);
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  console.log("Service account loaded successfully");
} catch (error) {
  console.error("Error loading service account:", error.message);
  console.log("Expected path:", SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

// Global variable to track the serial port
let serialPort;

// Initialize Firebase Admin once
let firebaseApp;
let dbInstance;

async function initializeFirebase() {
  try {
    // Fix: Use correct credential and databaseURL if needed
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Uncomment and set your databaseURL if using Realtime Database
        // databaseURL: "https://iasdb-b56c8.firebaseio.com"
      });
    } else {
      firebaseApp = admin.apps[0];
    }

    // Fix: Use getFirestore from admin.firestore (for v10+)
    dbInstance = admin.firestore();
    console.log("Firestore Admin SDK initialized successfully");
    return { db: dbInstance };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// Test the Firestore connection
async function testFirestoreConnection(db) {
  try {
    const testRef = db.collection("test");
    const testDoc = await testRef.add({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Test document written with ID:", testDoc.id);
    return true;
  } catch (error) {
    console.error("Firestore test connection failed:", error);
    return false;
  }
}

// Handle serial connection
function startSerialConnection(db) {
  try {
    serialPort = new SerialPort({
      path: "COM9",
      baudRate: 9600,
    });

    // Make serialPort globally accessible
    if (typeof window !== "undefined") {
      window.serialPort = serialPort;
    }

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    serialPort.on("open", () => {
      console.log("Serial port opened on COM9");
    });

    parser.on("data", async (line) => {
      try {
        console.log("Raw data received:", line);

        // Handle gate control acknowledgments
        if (line.startsWith("GATE:")) {
          console.log("Gate status:", line);
          return;
        }

        if (line.startsWith("ENTRY") || line.startsWith("EXIT")) {
          const parts = line.trim().split(",");
          console.log("Parsed parts:", parts);

          if (parts.length === 5) {
            const [action, uid, name, plate, userId] = parts;
            const isEntry = action === "ENTRY";

            const historyData = {
              ID: userId,
              Name: name,
              Platenumber: plate,
              LOGGED_IN: isEntry
                ? admin.firestore.FieldValue.serverTimestamp()
                : null,
              LOGGED_OUT: !isEntry
                ? admin.firestore.FieldValue.serverTimestamp()
                : null,
              TotalTime: null, // Will be calculated on exit
            };

            try {
              const historyRef = db.collection("history"); // Changed from "access_logs" to "history"

              if (isEntry) {
                // Handle entry - Create document and update with its ID
                const docRef = await historyRef.add(historyData);
                await docRef.update({
                  documentId: docRef.id, // Add document ID to the document itself
                });
                console.log(
                  "Entry record created for:",
                  name,
                  "with ID:",
                  docRef.id
                );
              } else {
                // Handle exit - Find the matching entry record
                const q = await historyRef
                  .where("ID", "==", userId)
                  .where("LOGGED_OUT", "==", null)
                  .get();

                if (!q.empty) {
                  const docToUpdate = q.docs[0];
                  const entryData = docToUpdate.data();
                  const loggedInTime = entryData.LOGGED_IN.toDate();
                  const loggedOutTime = new Date();

                  // Calculate total time
                  const timeDiff =
                    loggedOutTime.getTime() - loggedInTime.getTime();
                  const totalSeconds = Math.floor(timeDiff / 1000);
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = totalSeconds % 60;
                  const totalTime = `${hours
                    .toString()
                    .padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

                  await docToUpdate.ref.update({
                    LOGGED_OUT: admin.firestore.FieldValue.serverTimestamp(),
                    TotalTime: totalTime,
                  });
                  console.log("Exit record updated for:", name);
                }
              }
            } catch (firestoreError) {
              console.error("Firestore write error:", firestoreError);
            }
          }
        }
      } catch (error) {
        console.error("Error processing serial data:", error);
      }
    });

    serialPort.on("error", (err) => {
      console.error("Serial port error:", err.message);
    });

    serialPort.on("close", () => {
      console.log("Serial port closed");
    });
  } catch (error) {
    console.error("Serial port initialization error:", error);
  }
}

// Main execution
(async () => {
  try {
    const { db } = await initializeFirebase();
    console.log("Firebase Admin SDK initialized");

    const isConnected = await testFirestoreConnection(db);

    if (!isConnected) {
      console.error(
        "Could not connect to Firestore. Please check your credentials and service account."
      );
      process.exit(1);
    }

    startSerialConnection(db);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})();

// Handle process termination
process.on("SIGINT", () => {
  console.log("Closing serial port...");
  if (serialPort) serialPort.close();
  process.exit();
});
