import React, { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebasedepc/Firebase";
import "./Manual.css";

function Manual() {
  const [formData, setFormData] = useState({
    uid: "",
    name: "",
    plateNumber: "",
  });
  const [buttonText, setButtonText] = useState("Login");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const isUserLoggedIn = async (userId) => {
    const q = query(
      collection(db, "history"),
      where("ID", "==", userId),
      where("LOGGED_OUT", "==", null)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const logLogin = async (formData) => {
    try {
      const docRef = await addDoc(collection(db, "history"), {
        ID: formData.uid,
        Name: formData.name,
        Platenumber: formData.plateNumber,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.uid.trim()) {
      alert("Please enter a UID.");
      return;
    }

    setIsLoading(true);
    try {
      const loggedIn = await isUserLoggedIn(formData.uid);
      if (loggedIn) {
        await logLogout(formData.uid);
        setButtonText("Login");
      } else {
        await logLogin(formData);
        setButtonText("Logout");
      }
      // Clear form after successful submission
      setFormData({ uid: "", name: "", plateNumber: "" });
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGateControl = (gate) => {
    // Add your gate control logic here
    console.log(`Opening ${gate} gate`);
    alert(`${gate} gate opening...`);
  };

  return (
    <div className="main-content">
      <div className="title">
        <label>MANUAL INPUT</label>
      </div>
      <div className="manual-container">
        <div className="input-grid">
          {/* Login Card */}
          <div className="input-card">
            <div className="cardtitle">
              <label>Vehicle Login</label>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>UID</label>
                <input
                  type="text"
                  name="uid"
                  value={formData.uid}
                  onChange={handleInputChange}
                  placeholder="Enter UID"
                />
              </div>
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter Name"
                />
              </div>
              <div className="input-group">
                <label>Plate Number</label>
                <input
                  type="text"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Plate Number"
                />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Login"}
              </button>
            </form>
          </div>

          {/* Logout Card */}
          <div className="input-card">
            <div className="cardtitle">
              <label>Vehicle Logout</label>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>UID</label>
                <input
                  type="text"
                  name="uid"
                  placeholder="Enter UID to Logout"
                />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Logout"}
              </button>
            </form>
          </div>

          {/* Gate Control Card */}
          <div className="input-card">
            <div className="cardtitle">
              <label>Gate Controls</label>
            </div>
            <div className="gate-controls">
              <button
                className="gate-button entry"
                onClick={() => handleGateControl("Entry")}
              >
                Open Entry Gate
              </button>
              <button
                className="gate-button exit"
                onClick={() => handleGateControl("Exit")}
              >
                Open Exit Gate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Manual;
