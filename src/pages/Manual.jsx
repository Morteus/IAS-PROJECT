import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
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
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeNow, setTimeNow] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formErrors, setFormErrors] = useState({
    uid: "",
    name: "",
    plateNumber: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [totalSlots] = useState(10);
  const [showParkingFullModal, setShowParkingFullModal] = useState(false);
  const [entryGateStatus, setEntryGateStatus] = useState("Closed");
  const [exitGateStatus, setExitGateStatus] = useState("Closed");
  const [gateError, setGateError] = useState({ entry: null, exit: null });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [gateLoading, setGateLoading] = useState({ entry: false, exit: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!formData.uid.trim()) {
      errors.uid = "UID is required";
      isValid = false;
    } else if (!/^[A-Za-z0-9]{3,}$/.test(formData.uid)) {
      errors.uid =
        "UID must be at least 3 characters (letters and numbers only)";
      isValid = false;
    }

    if (!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (!/^[A-Za-z\s]{2,}$/.test(formData.name)) {
      errors.name =
        "Name must contain only letters and spaces (min 2 characters)";
      isValid = false;
    }

    if (!formData.plateNumber.trim()) {
      errors.plateNumber = "Plate Number is required";
      isValid = false;
    } else if (!/^[A-Za-z0-9\s-]{2,}$/.test(formData.plateNumber)) {
      errors.plateNumber =
        "Invalid plate number format (letters, numbers, spaces, and hyphens only)";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
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

  const checkAvailableSlots = async () => {
    const q = query(collection(db, "history"), where("LOGGED_OUT", "==", null));
    const snapshot = await getDocs(q);
    return totalSlots - snapshot.docs.length;
  };

  const logLogin = async (formData) => {
    try {
      const availableSlots = await checkAvailableSlots();

      if (availableSlots <= 0) {
        setShowParkingFullModal(true);
        return null;
      }

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

  const calculateTotalTime = (loginTime) => {
    if (!loginTime) return "00:00:00";

    const now = new Date();
    const loginDate =
      loginTime instanceof Date ? loginTime : loginTime.toDate();
    const diff = Math.max(0, now - loginDate); // Ensure non-negative difference

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const logLogout = async (userId, docId) => {
    try {
      const docRef = doc(db, "history", docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("No document found!");
        return;
      }

      const loginData = docSnap.data();
      const loggedInTimestamp = loginData.LOGGED_IN;

      if (!loggedInTimestamp) {
        console.error("No login timestamp found");
        return;
      }

      const totalTime = calculateTotalTime(loggedInTimestamp.toDate());

      await updateDoc(docRef, {
        LOGGED_OUT: serverTimestamp(),
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
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    try {
      const loggedIn = await isUserLoggedIn(formData.uid);
      if (loggedIn) {
        throw new Error(`User with ID ${formData.uid} is already logged in`);
      }

      await logLogin(formData);
      setButtonText("Logout");
      setFormData({ uid: "", name: "", plateNumber: "" });
      setFormErrors({});
    } catch (error) {
      setSubmitError(error.message || "An unexpected error occurred");
      console.error("Submit error:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGateControl = async (gate, action) => {
    const gateType = gate.toLowerCase();
    setGateLoading((prev) => ({ ...prev, [gateType]: true }));
    setGateError((prev) => ({ ...prev, [gateType]: null }));

    try {
      // Simulate gate operation with timeout
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random failure
          if (Math.random() < 0.1) {
            // 10% chance of failure
            reject(new Error(`Failed to ${action.toLowerCase()} ${gate} gate`));
          }
          resolve();
        }, 1500);
      });

      if (gate === "Entry") {
        setEntryGateStatus(action === "Open" ? "Open" : "Closed");
      } else {
        setExitGateStatus(action === "Open" ? "Open" : "Closed");
      }
    } catch (error) {
      setGateError((prev) => ({ ...prev, [gateType]: error.message }));
      console.error(`Gate operation error:`, error);
    } finally {
      setGateLoading((prev) => ({ ...prev, [gateType]: false }));
    }
  };

  const handleLogoutClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleConfirmLogout = async () => {
    if (!selectedUser) return;
    try {
      await logLogout(selectedUser.ID, selectedUser.id);
      setShowModal(false);
      setSelectedUser(null);
      setSubmitError(""); // Clear error after successful logout
    } catch (error) {
      console.error("Error during logout:", error);
      setSubmitError("Error during logout. Please try again.");
    }
  };

  const handleInputFocus = () => {
    setSubmitError(""); // Clear error when user starts typing again
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const activeUsersQuery = query(
      collection(db, "history"),
      where("LOGGED_OUT", "==", null)
    );

    const unsubscribe = onSnapshot(
      activeUsersQuery,
      (snapshot) => {
        const activeUsersList = snapshot.docs.map((doc) => {
          const data = doc.data();
          const loginDate = data.LOGGED_IN
            ? data.LOGGED_IN.toDate()
            : new Date();
          return {
            id: doc.id,
            ID: data.ID,
            Name: data.Name,
            Platenumber: data.Platenumber,
            loginTime: loginDate.toLocaleString(),
            loginDate: loginDate,
          };
        });
        setActiveUsers(activeUsersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching active users:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-content">
      <div className="title">
        <label>MANUAL INPUT</label>
      </div>
      <div className="manual-container">
        <div className="input-grid">
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
                  onFocus={handleInputFocus}
                  placeholder="Enter UID"
                  className={formErrors.uid ? "error" : ""}
                />
                {formErrors.uid && (
                  <span className="error-text">{formErrors.uid}</span>
                )}
              </div>
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Enter Name"
                  className={formErrors.name ? "error" : ""}
                />
                {formErrors.name && (
                  <span className="error-text">{formErrors.name}</span>
                )}
              </div>
              <div className="input-group">
                <label>Plate Number</label>
                <input
                  type="text"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Enter Plate Number"
                  className={formErrors.plateNumber ? "error" : ""}
                />
                {formErrors.plateNumber && (
                  <span className="error-text">{formErrors.plateNumber}</span>
                )}
              </div>
              {submitError && <div className="submit-error">{submitError}</div>}
              <button
                type="submit"
                disabled={submitLoading}
                className={submitLoading ? "loading" : ""}
              >
                {submitLoading ? "Processing..." : buttonText}
              </button>
            </form>
          </div>
          <div className="controls-column">
            <div className="input-card">
              <div className="cardtitle">
                <label>Entry Gate</label>
              </div>
              <div className="gate-controls">
                <button
                  className={`gate-button entry ${
                    gateLoading.entry ? "loading" : ""
                  }`}
                  onClick={() => handleGateControl("Entry", "Open")}
                  disabled={entryGateStatus === "Open" || gateLoading.entry}
                >
                  {gateLoading.entry ? "Processing..." : "Open Gate"}
                </button>
                {gateError.entry && (
                  <div className="gate-error">{gateError.entry}</div>
                )}
                <button
                  className="gate-button entry"
                  onClick={() => handleGateControl("Entry", "Close")}
                  disabled={entryGateStatus === "Closed"}
                >
                  Close Gate
                </button>
                <div className="gate-status">
                  Status:{" "}
                  <span className={entryGateStatus.toLowerCase()}>
                    {entryGateStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="input-card">
              <div className="cardtitle">
                <label>Exit Gate</label>
              </div>
              <div className="gate-controls">
                <button
                  className={`gate-button exit ${
                    gateLoading.exit ? "loading" : ""
                  }`}
                  onClick={() => handleGateControl("Exit", "Open")}
                  disabled={exitGateStatus === "Open" || gateLoading.exit}
                >
                  {gateLoading.exit ? "Processing..." : "Open Gate"}
                </button>
                {gateError.exit && (
                  <div className="gate-error">{gateError.exit}</div>
                )}
                <button
                  className="gate-button exit"
                  onClick={() => handleGateControl("Exit", "Close")}
                  disabled={exitGateStatus === "Closed"}
                >
                  Close Gate
                </button>
                <div className="gate-status">
                  Status:{" "}
                  <span className={exitGateStatus.toLowerCase()}>
                    {exitGateStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="active-users-section">
          <h2>Currently Active Vehicles</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error-message">Error: {error}</p>}
          <div className="active-users-grid">
            {activeUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="status-indicator"></div>
                <h3>UID: {user.ID}</h3>
                <p>Name: {user.Name}</p>
                <p>Plate Number: {user.Platenumber}</p>
                <p>Login Time: {user.loginTime}</p>
                <p className="elapsed-time">
                  Duration: {calculateTotalTime(user.loginDate)}
                </p>
                <button
                  className="force-logout-btn nav-colored-btn"
                  onClick={() => handleLogoutClick(user)}
                >
                  Logout
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showParkingFullModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Parking Full</h3>
            <div className="modal-details warning">
              <p>Maximum parking capacity reached.</p>
              <p>Please wait for available space.</p>
            </div>
            <div className="modal-buttons">
              <button
                className="modal-button confirm"
                onClick={() => setShowParkingFullModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && !showParkingFullModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out this user?</p>
            <div className="modal-details">
              <p>UID: {selectedUser?.ID}</p>
              <p>Name: {selectedUser?.Name}</p>
              <p>Plate Number: {selectedUser?.Platenumber}</p>
            </div>
            <div className="modal-buttons">
              <button
                className="modal-button confirm"
                onClick={handleConfirmLogout}
              >
                Confirm
              </button>
              <button
                className="modal-button cancel"
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && submitError && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Parking Full</h3>
            <p>{submitError}</p>
            <div className="modal-buttons">
              <button
                className="modal-button confirm"
                onClick={() => {
                  setShowModal(false);
                  setSubmitError("");
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manual;
