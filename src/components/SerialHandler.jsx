import { useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebasedepc/Firebase";
import serialService from "../services/SerialService";

const SerialHandler = () => {
  useEffect(() => {
    // Slot tracking logic
    const activeUsersQuery = query(
      collection(db, "history"),
      where("LOGGED_OUT", "==", null)
    );

    const unsubscribe = onSnapshot(activeUsersQuery, async (snapshot) => {
      const activeUserCount = snapshot.docs.length;
      const availableSlots = 10 - activeUserCount;
      console.log("Available slots:", availableSlots);

      if (serialService.isConnected()) {
        try {
          const data = `SLOTS:${availableSlots}\n`;
          await serialService.write(data);
        } catch (error) {
          console.error("Error writing to serial:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
};

export default SerialHandler;
