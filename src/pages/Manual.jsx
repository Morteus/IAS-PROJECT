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
import { useModal } from "../context/ModalContext";

function Manual({ serialPort }) {
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
  // Changed to uppercase to match properly with button logic
  const [entryGateStatus, setEntryGateStatus] = useState("CLOSED");
  const [exitGateStatus, setExitGateStatus] = useState("CLOSED");
  const [gateError, setGateError] = useState({ entry: null, exit: null });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [gateLoading, setGateLoading] = useState({ entry: false, exit: false });
  const { openModal, closeModal } = useModal();
  const [rfidMode, setRfidMode] = useState(false);

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
    const available = totalSlots - snapshot.docs.length;
    console.log(
      "Active vehicles:",
      snapshot.docs.length,
      "Available slots:",
      available
    );
    // Never return negative slots
    return available > 0 ? available : 0;
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

  // Remove logLogout and handleConfirmLogout from the login form logic

  // Check if UID or plate number is already logged in
  const isVehicleAlreadyEntered = async (uid, plateNumber) => {
    const q = query(
      collection(db, "history"),
      where("LOGGED_OUT", "==", null),
      where("ID", "==", uid)
    );
    const plateQ = query(
      collection(db, "history"),
      where("LOGGED_OUT", "==", null),
      where("Platenumber", "==", plateNumber)
    );
    const [uidSnapshot, plateSnapshot] = await Promise.all([
      getDocs(q),
      getDocs(plateQ),
    ]);
    return !uidSnapshot.empty || !plateSnapshot.empty;
  };

  // Remove the logout button and logic from the vehicle login form
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    try {
      // Check if vehicle (by UID or plate number) is already logged in
      const alreadyEntered = await isVehicleAlreadyEntered(
        formData.uid,
        formData.plateNumber
      );
      if (alreadyEntered) {
        setSubmitError("This vehicle has already entered.");
        setSubmitLoading(false);
        return;
      }

      // Only allow login
      await logLogin(formData);

      // If this was triggered by RFID, automatically open the gate
      if (rfidMode) {
        await sendGateCommand("Entry", "OPEN");
        setTimeout(() => sendGateCommand("Entry", "CLOSE"), 5000);
      }

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

  const handleLogoutClick = (user) => {
    openModal(
      <div>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to log out this user?</p>
        <div className="modal-details">
          <p>UID: {user?.ID}</p>
          <p>Name: {user?.Name}</p>
          <p>Plate Number: {user?.Platenumber}</p>
        </div>
        <div className="modal-buttons">
          <button
            className="modal-button confirm"
            onClick={async () => {
              await handleConfirmLogout(user);
              closeModal();
            }}
          >
            Confirm
          </button>
          <button className="modal-button cancel" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const handleConfirmLogout = async (user) => {
    if (!user) return;
    try {
      await logLogout(user.ID, user.id);
      setSubmitError(""); // Clear error after successful logout
    } catch (error) {
      console.error("Error during logout:", error);
      setSubmitError("Error during logout. Please try again.");
    }
  };

  const handleInputFocus = () => {
    setSubmitError(""); // Clear error when user starts typing again
  };

  const sendGateCommand = async (gate, action) => {
    const gateKey = gate.toLowerCase();
    setGateLoading({ ...gateLoading, [gateKey]: true });

    try {
      await addDoc(collection(db, "gate_commands"), {
        gate: gate.toUpperCase(),
        action: action.toUpperCase(),
        timestamp: serverTimestamp(),
      });

      // Update gate status based on action immediately for better UI feedback
      if (gateKey === "entry") {
        setEntryGateStatus(action);
      } else {
        setExitGateStatus(action);
      }
    } catch (error) {
      console.error("Gate command error:", error);
      setGateError({
        ...gateError,
        [gateKey]: "Failed to send command",
      });
    } finally {
      // Make sure to clear loading state
      setTimeout(() => {
        setGateLoading((prev) => ({ ...prev, [gateKey]: false }));
      }, 500); // Small delay to ensure state updates properly
    }
  };

  // Add useEffect to handle Arduino responses
  useEffect(() => {
    if (serialPort) {
      serialPort.on("data", (data) => {
        const response = data.toString().trim();
        console.log("Arduino response:", response);

        if (response.includes("ENTRY")) {
          setEntryGateStatus(response.includes("OPEN") ? "OPEN" : "CLOSED");
          setGateError({ ...gateError, entry: null });
        } else if (response.includes("EXIT")) {
          setExitGateStatus(response.includes("OPEN") ? "OPEN" : "CLOSED");
          setGateError({ ...gateError, exit: null });
        }
      });
    }
  }, [serialPort]);

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

  // Add RFID listener
  useEffect(() => {
    const handleRfidDetected = (event) => {
      const rfidData = event.detail;
      console.log("RFID detected in Manual component:", rfidData);

      // Temporarily disable manual input
      setRfidMode(true);

      // Auto-fill form with RFID data if needed
      // You might want to fetch user data associated with this RFID
      setFormData((prev) => ({
        ...prev,
        uid: rfidData,
      }));

      // Re-enable manual input after 5 seconds
      setTimeout(() => setRfidMode(false), 5000);
    };

    window.addEventListener("rfidDetected", handleRfidDetected);
    return () => window.removeEventListener("rfidDetected", handleRfidDetected);
  }, []);

  // Helper function to get proper CSS class for gate status display
  const getStatusClass = (status) => {
    return status === "OPEN" ? "open" : "closed";
  };

  // Helper function to get formatted gate status for display
  const getDisplayStatus = (status) => {
    return status === "OPEN" ? "Open" : "Closed";
  };

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
                <label>UID {rfidMode && <span>(RFID Mode Active)</span>}</label>
                <input
                  type="text"
                  name="uid"
                  value={formData.uid}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Enter UID"
                  className={formErrors.uid ? "error" : ""}
                  disabled={rfidMode}
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
                  disabled={rfidMode}
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
                  disabled={rfidMode}
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
                  onClick={() => sendGateCommand("Entry", "OPEN")}
                  disabled={gateLoading.entry || entryGateStatus === "OPEN"}
                >
                  Open Gate
                </button>
                <button
                  className={`gate-button entry ${
                    gateLoading.entry ? "loading" : ""
                  }`}
                  onClick={() => sendGateCommand("Entry", "CLOSED")}
                  disabled={gateLoading.entry || entryGateStatus === "CLOSED"}
                >
                  Close Gate
                </button>
                {gateError.entry && (
                  <div className="gate-error">{gateError.entry}</div>
                )}
                <div className="gate-status">
                  Status:{" "}
                  <span className={getStatusClass(entryGateStatus)}>
                    {getDisplayStatus(entryGateStatus)}
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
                  onClick={() => sendGateCommand("Exit", "OPEN")}
                  disabled={gateLoading.exit || exitGateStatus === "OPEN"}
                >
                  Open Gate
                </button>
                <button
                  className={`gate-button exit ${
                    gateLoading.exit ? "loading" : ""
                  }`}
                  onClick={() => sendGateCommand("Exit", "CLOSED")}
                  disabled={gateLoading.exit || exitGateStatus === "CLOSED"}
                >
                  Close Gate
                </button>
                {gateError.exit && (
                  <div className="gate-error">{gateError.exit}</div>
                )}
                <div className="gate-status">
                  Status:{" "}
                  <span className={getStatusClass(exitGateStatus)}>
                    {getDisplayStatus(exitGateStatus)}
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

      {/* Show error modal only if not showing parking full modal and not showing logout modal */}
      {showModal && submitError && !showParkingFullModal && !selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Error</h3>
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
