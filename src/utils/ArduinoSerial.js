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
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: "https://iasdb-b56c8.firebaseio.com"
      });
    } else {
      firebaseApp = admin.apps[0];
    }
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

const MAX_SLOTS = 10;

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
      // Initialize slot count when serial connection is established
      updateSlotCount(db);
    });

    parser.on("data", async (line) => {
      try {
        console.log("Raw data received:", line);

        // Handle gate control acknowledgments
        if (line.startsWith("ACK:")) {
          console.log("Gate status:", line);
          return;
        }

        // Only try to parse lines that look like JSON
        if (line.trim().startsWith("{") && line.trim().endsWith("}")) {
          try {
            const data = JSON.parse(line);

            if (data.action === "ENTRY" || data.action === "EXIT") {
              const isEntry = data.action === "ENTRY";

              const historyData = {
                ID: data.userId,
                Name: data.name,
                Platenumber: data.plateNumber,
                LOGGED_IN: isEntry
                  ? admin.firestore.FieldValue.serverTimestamp()
                  : null,
                LOGGED_OUT: !isEntry
                  ? admin.firestore.FieldValue.serverTimestamp()
                  : null,
                TotalTime: null,
              };

              try {
                const historyRef = db.collection("history");

                if (isEntry) {
                  const docRef = await historyRef.add(historyData);
                  await docRef.update({ documentId: docRef.id });
                  console.log(
                    "Entry record created for:",
                    data.name,
                    "with ID:",
                    docRef.id
                  );
                } else {
                  const q = await historyRef
                    .where("ID", "==", data.userId)
                    .where("LOGGED_OUT", "==", null)
                    .get();

                  if (!q.empty) {
                    const docToUpdate = q.docs[0];
                    const entryData = docToUpdate.data();
                    const loggedInTime = entryData.LOGGED_IN.toDate();
                    const loggedOutTime = new Date();

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
                      .padStart(2, "0")}:${seconds
                      .toString()
                      .padStart(2, "0")}`;

                    await docToUpdate.ref.update({
                      LOGGED_OUT: admin.firestore.FieldValue.serverTimestamp(),
                      TotalTime: totalTime,
                    });
                    console.log("Exit record updated for:", data.name);
                  }
                }
              } catch (firestoreError) {
                console.error("Firestore write error:", firestoreError);
              }
            }
          } catch (jsonError) {
            console.error("Error parsing JSON:", jsonError, "Line:", line);
          }
        } else {
          // Optionally log or ignore non-JSON lines
          // console.log("Non-JSON serial line:", line);
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

    listenToGateCommands(db);
  } catch (error) {
    console.error("Serial port initialization error:", error);
  }
}

function listenToGateCommands(db) {
  // Listen for gate commands
  db.collection("gate_commands")
    .orderBy("timestamp", "desc")
    .limit(1)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const command = `${data.gate}_${data.action}\n`;
          if (serialPort && serialPort.isOpen) {
            serialPort.write(command, (err) => {
              if (err) {
                console.error("Failed to send command to Arduino:", err);
              } else {
                console.log("Sent command to Arduino:", command.trim());
              }
            });
          }
        }
      });
    });

  // Listen for slot changes
  db.collection("history")
    .where("LOGGED_OUT", "==", null)
    .onSnapshot((snapshot) => {
      const occupiedSlots = snapshot.size;
      const availableSlots = MAX_SLOTS - occupiedSlots;

      if (serialPort && serialPort.isOpen) {
        const command = `SLOTS:${availableSlots}\n`;
        serialPort.write(command, (err) => {
          if (err) {
            console.error("Failed to send slot update to Arduino:", err);
          } else {
            console.log("Sent slot update to Arduino:", command.trim());
          }
        });
      }
    });
}

// Add this new function to update slot count
async function updateSlotCount(db) {
  try {
    const snapshot = await db
      .collection("history")
      .where("LOGGED_OUT", "==", null)
      .get();

    const occupiedSlots = snapshot.size;
    const availableSlots = MAX_SLOTS - occupiedSlots;

    if (serialPort && serialPort.isOpen) {
      const command = `SLOTS:${availableSlots}\n`;
      serialPort.write(command);
      console.log("Initial slot count sent to Arduino:", availableSlots);
    }
  } catch (error) {
    console.error("Error updating slot count:", error);
  }
}

// Main execution
(async () => {
  try {
    const { db } = await initializeFirebase();
    console.log("Firebase Admin SDK initialized");
    startSerialConnection(db);
    console.log("Serial Manager initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Serial Manager:", error);
    throw error;
  }
})();

export default {
  getSerialPort: () => serialPort,
};
