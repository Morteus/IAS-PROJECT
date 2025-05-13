import React, { useState, useEffect } from "react";
import NavBar from "../components/navigationBar";
import "./Settings.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faKey,
  faFileDownload,
  faFileExport,
  faEye,
  faEyeSlash,
  faPencilAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebasedepc/Firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import History from "./History";

const Settings = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [userData, setUserData] = useState({
    Name: "",
    Email: "",
    contactNumber: "",
    UID: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");
  const [accountInfo, setAccountInfo] = useState({
    totalParking: 0,
    lastParking: null,
    registrationDate: null,
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Fetch the actual password from your database if you want to display it (not recommended for security).
  // For demo, let's allow the user to type their current password for changing.
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Add file input ref for profile picture
  const fileInputRef = React.useRef();

  // Handle profile picture change
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      // TODO: Upload to storage if needed
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError("No user logged in");
        setIsLoading(false);
        return;
      }

      try {
        const accountDoc = await getDoc(doc(db, "Accounts", userId));
        if (accountDoc.exists()) {
          const data = accountDoc.data();
          setUserData({
            Name: data.Name || "",
            Email: data.Email || "",
            contactNumber: data.contactNumber || "",
            UID: data.UID || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!userId) return;

      try {
        // Get parking history
        const historyQuery = query(
          collection(db, "history"),
          where("ID", "==", userId)
        );
        const historySnap = await getDocs(historyQuery);

        // Get last parking date and total parkings
        const parkingData = historySnap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const lastParking = parkingData.sort(
          (a, b) => b.LOGGED_IN.toDate() - a.LOGGED_IN.toDate()
        )[0];

        // Get user registration date
        const userDoc = await getDoc(doc(db, "users", userId));
        const registrationDate = userDoc.data()?.createdAt;

        setAccountInfo({
          totalParking: parkingData.length,
          lastParking: lastParking?.LOGGED_IN?.toDate() || null,
          registrationDate: registrationDate?.toDate() || null,
        });
      } catch (err) {
        console.error("Error fetching account info:", err);
      }
    };

    fetchAccountInfo();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await updateDoc(doc(db, "Accounts", userId), {
        FullName: userData.Name,
        Email: userData.Email,
        ContactNo: userData.contactNumber,
        Username: userData.username,
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  // Helper: Convert array of objects to CSV string
  function convertToCSV(arr) {
    if (!arr.length) return "";
    const keys = Object.keys(arr[0]);
    const csvRows = [
      keys.join(","),
      ...arr.map((row) =>
        keys
          .map((k) => {
            const val = row[k];
            // Escape quotes
            return `"${
              val !== undefined && val !== null
                ? String(val).replace(/"/g, '""')
                : ""
            }"`;
          })
          .join(",")
      ),
    ];
    return csvRows.join("\n");
  }

  // Helper: Download a string as a file
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  // Export handler (fetches fresh data from Firestore)
  const handleExport = async (format) => {
    try {
      // Fetch ALL parking history from Firestore (not just for the current user)
      const historySnap = await getDocs(collection(db, "history"));

      // Prepare data for CSV/PDF
      const data = historySnap.docs.map((doc) => {
        const d = doc.data();
        return {
          ID: d.ID || "",
          LOGGED_IN: d.LOGGED_IN
            ? typeof d.LOGGED_IN === "string"
              ? d.LOGGED_IN
              : d.LOGGED_IN.toDate
              ? d.LOGGED_IN.toDate().toLocaleString()
              : ""
            : "",
          LOGGED_OUT: d.LOGGED_OUT
            ? typeof d.LOGGED_OUT === "string"
              ? d.LOGGED_OUT
              : d.LOGGED_OUT.toDate
              ? d.LOGGED_OUT.toDate().toLocaleString()
              : ""
            : "",
          Name: d.Name || "",
          Platenumber: d.Platenumber || "",
          TotalTime: d.TotalTime || "",
        };
      });

      if (!data.length) {
        alert("No parking history to export.");
        return;
      }

      if (format === "CSV") {
        // ...existing CSV export code...
        const keys = Object.keys(data[0]);
        const csvRows = [
          keys.join(","),
          ...data.map((row) =>
            keys
              .map((k) => {
                const val = row[k];
                return `"${
                  val !== undefined && val !== null
                    ? String(val).replace(/"/g, '""')
                    : ""
                }"`;
              })
              .join(",")
          ),
        ];
        const csv = csvRows.join("\n");
        // Download CSV
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "parking_history.csv";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      } else if (format === "PDF") {
        const doc2 = new jsPDF();
        doc2.setFontSize(14);
        doc2.text("Parking History", 14, 18);

        // Use autoTable from the imported variable, not as a method of jsPDF prototype
        autoTable(doc2, {
          head: [
            [
              "ID",
              "LOGGED_IN",
              "LOGGED_OUT",
              "Name",
              "Platenumber",
              "TotalTime",
            ],
          ],
          body: data.map((row) => [
            row.ID,
            row.LOGGED_IN,
            row.LOGGED_OUT,
            row.Name,
            row.Platenumber,
            row.TotalTime,
          ]),
          startY: 24,
          styles: { fontSize: 10, cellWidth: "wrap" },
          headStyles: { fillColor: [35, 35, 35] },
          margin: { left: 14, right: 14 },
          tableWidth: "auto",
        });
        doc2.save("parking_history.pdf");
      }
    } catch (err) {
      alert("Failed to export history.");
      console.error(err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    // TODO: Implement password change logic
    alert("Password change functionality to be implemented");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="settings-root">
      <NavBar />
      <div className="settings-container">
        <div className="settings-main-content">
          <div className="settings-sidebar">
            <h3>Settings</h3>
            <div className="sidebar-links">
              <a href="#personal" className="sidebar-link active">
                <FontAwesomeIcon icon={faUser} />
                Personal Details
              </a>
              <a href="#security" className="sidebar-link">
                <FontAwesomeIcon icon={faKey} />
                Password & Security
              </a>
              <a href="#export" className="sidebar-link">
                <FontAwesomeIcon icon={faFileExport} />
                Export History
              </a>
            </div>
          </div>

          <div className="settings-content">
            <section id="personal" className="settings-section">
              <div className="settings-card">
                <div className="profile-card-header">
                  <div
                    className="profile-avatar profile-avatar-lg"
                    style={{
                      position: "relative",
                      width: 160,
                      height: 160,
                      margin: "0 auto 16px",
                      borderRadius: "50%",
                      border: "4px solid white",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    {profilePicture ? (
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#f0f2f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 64,
                          color: "#666",
                        }}
                      >
                        {userData.Name ? userData.Name[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </div>
                  <div className="profile-card-info">
                    <h2 className="profile-name">{userData.Name}</h2>
                    <p className="profile-email">{userData.Email}</p>
                    <button
                      type="button"
                      className="profile-edit-btn"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: 20,
                        padding: "4px 12px",
                        fontSize: 13,
                        color: "#666",
                        margin: "12px auto 0",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <FontAwesomeIcon icon={faPencilAlt} size="sm" />
                      <span>Change Picture</span>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleProfilePicChange}
                    />
                  </div>
                </div>
                <div className="card-header">
                  <h2>Personal Information</h2>
                  <p>Update your personal details</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="Name"
                      value={userData.Name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="Email"
                      value={userData.Email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={userData.contactNumber}
                      onChange={handleInputChange}
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>UID</label>
                    <input
                      type="text"
                      name="UID"
                      value={userData.UID}
                      disabled
                      className="input-disabled"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section id="export" className="settings-section">
              <div className="settings-card">
                <div className="card-header">
                  <h2>Export History</h2>
                  <p>Download your parking history</p>
                </div>
                <div className="export-options">
                  <button
                    className="export-btn csv"
                    onClick={() => handleExport("CSV")}
                  >
                    <FontAwesomeIcon icon={faFileDownload} />
                    Export as CSV
                  </button>
                  <button
                    className="export-btn pdf"
                    onClick={() => handleExport("PDF")}
                  >
                    <FontAwesomeIcon icon={faFileDownload} />
                    Export as PDF
                  </button>
                </div>
              </div>
            </section>

            <section id="security" className="settings-section">
              <div className="settings-card">
                <div className="card-header">
                  <h2>Password & Security</h2>
                  <p>Manage your account security</p>
                </div>
                <form onSubmit={handlePasswordChange} className="settings-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={(e) =>
                          setPasswords((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="form-control"
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        tabIndex={-1}
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                      >
                        <FontAwesomeIcon
                          icon={showPasswords.current ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="form-control"
                        autoComplete="new-password"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        tabIndex={-1}
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                      >
                        <FontAwesomeIcon
                          icon={showPasswords.new ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="password-input">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={(e) =>
                          setPasswords((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="form-control"
                        autoComplete="new-password"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        tabIndex={-1}
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                      >
                        <FontAwesomeIcon
                          icon={showPasswords.confirm ? faEyeSlash : faEye}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
