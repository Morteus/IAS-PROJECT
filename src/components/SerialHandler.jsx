import { useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebasedepc/Firebase";

const SerialHandler = ({ serialPort }) => {
  useEffect(() => {
    // Remove manual connection logic
    // Keep only the slot tracking logic
    const activeUsersQuery = query(
      collection(db, "history"),
      where("LOGGED_OUT", "==", null)
    );

    const unsubscribe = onSnapshot(activeUsersQuery, async (snapshot) => {
      const activeUserCount = snapshot.docs.length;
      const availableSlots = 10 - activeUserCount;
      console.log("Available slots:", availableSlots);

      if (serialPort && serialPort.writable) {
        const writer = serialPort.writable.getWriter();
        try {
          const data = `SLOTS:${availableSlots}\n`;
          await writer.write(new TextEncoder().encode(data));
        } catch (error) {
          console.error("Error writing to serial:", error);
        } finally {
          writer.releaseLock();
        }
      }
    });

    return () => unsubscribe();
  }, [serialPort]);

  return null;
};

export default SerialHandler;
