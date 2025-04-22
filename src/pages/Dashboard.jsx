import React, { Fragment, useState, useEffect } from "react";
import {
  useLatestLogin,
  useLatestLogout,
  fetchAllHistory,
  getLoggedOutCount,
  getTotalEnteredCount,
  // Removed getTotalCapacity import
  useLoggedInCountListener,
} from "../databaseComponent";
import "./Dashboard.css";

// --- Hardcoded Total Capacity ---
const TOTAL_PARKING_CAPACITY = 10;
// ---

function Dashboard() {
  // State for dashboard data
  const [latestLogin, setLatestLogin] = useState(null);
  const [latestLogout, setLatestLogout] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);
  const [loggedInCount, setLoggedInCount] = useState(0); // Updated by listener
  const [loggedOutCount, setLoggedOutCount] = useState(0); // Fetched once
  const [totalEnteredCount, setTotalEnteredCount] = useState(0); // Fetched once
  // Removed totalCapacity state, using constant instead
  // const [totalCapacity, setTotalCapacity] = useState(10);
  const [availableSlots, setAvailableSlots] = useState(TOTAL_PARKING_CAPACITY); // Default to hardcoded capacity

  // Loading state to track different asynchronous operations
  const [loadingStatus, setLoadingStatus] = useState({
    initialData: true, // For history, one-time counts (capacity fetch removed)
    loggedInCountListener: true, // For the real-time count listener
    latestLoginListener: true, // For latest login listener
    latestLogoutListener: true, // For latest logout listener
  });

  // Derived overall loading state - true if any part is still loading
  const isLoading = Object.values(loadingStatus).some(
    (status) => status === true
  );

  // Effect 1: Fetch initial one-time data (History, Static Counts - NO Capacity)
  useEffect(() => {
    const fetchInitialData = async () => {
      setError(null); // Reset error before fetching
      setLoadingStatus((prev) => ({ ...prev, initialData: true }));

      try {
        // Fetch data - Removed getTotalCapacity
        const [
          historyResult,
          loggedOutResult,
          totalEnteredResult,
          // capacityResult, // Removed
        ] = await Promise.all([
          fetchAllHistory(),
          getLoggedOutCount(),
          getTotalEnteredCount(),
          // getTotalCapacity(), // Removed
        ]);

        // Update state with fetched data
        setHistoryData(historyResult);
        setLoggedOutCount(loggedOutResult);
        setTotalEnteredCount(totalEnteredResult);
        // No need to setTotalCapacity anymore
        // setTotalCapacity(capacityResult);
        // console.log("Actual Capacity Fetched:", capacityResult); // Removed log
      } catch (err) {
        console.error("Error fetching initial dashboard data:", err);
        setError(err); // Set error state to display message
      } finally {
        // Mark this fetch operation as complete
        setLoadingStatus((prev) => ({ ...prev, initialData: false }));
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect 2: Listen for real-time logged-in count changes
  useEffect(() => {
    let isMounted = true;
    setLoadingStatus((prev) => ({ ...prev, loggedInCountListener: true }));

    const handleCountUpdate = (count, err) => {
      if (isMounted) {
        if (err) {
          console.error("Error from loggedInCount listener:", err);
          setError(err);
        } else if (count !== null) {
          console.log("Real-time LoggedIn Count Update:", count); // Log count updates
          setLoggedInCount(count);
        }
        setLoadingStatus((prev) => ({ ...prev, loggedInCountListener: false }));
      }
    };

    const unsubscribe = useLoggedInCountListener(handleCountUpdate);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect 3: Calculate available slots whenever loggedInCount changes (capacity is now constant)
  useEffect(() => {
    // Ensure count is a valid number before calculating
    if (typeof loggedInCount === "number") {
      // Use the hardcoded capacity constant
      console.log(
        `Calculating Available Slots: Capacity=${TOTAL_PARKING_CAPACITY}, LoggedIn=${loggedInCount}`
      );
      setAvailableSlots(TOTAL_PARKING_CAPACITY - loggedInCount);
    } else {
      console.log(
        `Skipping slot calculation: LoggedIn Type=${typeof loggedInCount}`
      );
    }
    // Dependency array only includes loggedInCount now
  }, [loggedInCount]);

  // Effect 4: Listen for latest login/logout details (for display boxes 2 & 3)
  useEffect(() => {
    let isMounted = true;
    setLoadingStatus((prev) => ({
      ...prev,
      latestLoginListener: true,
      latestLogoutListener: true,
    }));

    const handleLoginUpdate = (data, err) => {
      if (isMounted) {
        if (err) {
          console.error("Error from latestLogin listener:", err);
        } else {
          setLatestLogin(data);
        }
        setLoadingStatus((prev) => ({ ...prev, latestLoginListener: false }));
      }
    };

    const handleLogoutUpdate = (data, err) => {
      if (isMounted) {
        if (err) {
          console.error("Error from latestLogout listener:", err);
        } else {
          setLatestLogout(data);
        }
        setLoadingStatus((prev) => ({ ...prev, latestLogoutListener: false }));
      }
    };

    const unsubscribeLogin = useLatestLogin(handleLoginUpdate);
    const unsubscribeLogout = useLatestLogout(handleLogoutUpdate);

    return () => {
      isMounted = false;
      unsubscribeLogin();
      unsubscribeLogout();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Loading State ---
  if (isLoading) {
    // return <div>Loading dashboard data...</div>; // Still optional
  }

  // --- Error State ---
  if (
    error &&
    (loadingStatus.initialData === false ||
      loadingStatus.loggedInCountListener === false)
  ) {
    return <div>Error: {error.message || "Failed to load dashboard data"}</div>;
  }

  // --- Render Dashboard UI ---
  return (
    <Fragment>
      <div className="App">
        <div className="main-content">
          <div className="title">
            <label>DASHBOARD</label>
          </div>
          <div className="gridcont">
            {/* Box 1: History */}
            <div className="box box-1">
              <div className="cardtitle">
                <label>History</label>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.length > 0 ? (
                      historyData.map((item) => (
                        <tr key={item.id}>
                          <td>{item.Platenumber || "N/A"}</td>
                          <td>{item.Name || "N/A"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#777",
                          }}
                        >
                          No history records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Box 2: Latest Logged In */}
            <div className="box box-2">
              <div className="cardtitle">
                <label>Latest Logged In</label>
              </div>
              {latestLogin ? (
                <div className="loggedin-outcontainer">
                  <label>UID:</label>
                  <span>{latestLogin.ID || "N/A"}</span>
                  <label>Name:</label>
                  <span>{latestLogin.Name || "N/A"}</span>
                  <label>Plate Number:</label>
                  <span>{latestLogin.Platenumber || "N/A"}</span>
                  <label>Date:</label>
                  <span>
                    {latestLogin.LOGGED_IN?.toDate().toLocaleDateString() ??
                      "N/A"}
                  </span>
                  <label>Time:</label>
                  <span>
                    {latestLogin.LOGGED_IN?.toDate().toLocaleTimeString() ??
                      "N/A"}
                  </span>
                </div>
              ) : (
                <div className="no-data-message">
                  No recent login data available.
                </div>
              )}
            </div>

            {/* Box 3: Latest Logged Out */}
            <div className="box box-3">
              <div className="cardtitle">
                <label>Latest Logged Out</label>
              </div>
              {latestLogout ? (
                <div className="loggedin-outcontainer">
                  <label>UID:</label>
                  <span>{latestLogout.ID || "N/A"}</span>
                  <label>Name:</label>
                  <span>{latestLogout.Name || "N/A"}</span>
                  <label>Plate Number:</label>
                  <span>{latestLogout.Platenumber || "N/A"}</span>
                  <label>Date:</label>
                  <span>
                    {latestLogout.LOGGED_OUT?.toDate().toLocaleDateString() ??
                      "N/A"}
                  </span>
                  <label>Time:</label>
                  <span>
                    {latestLogout.LOGGED_OUT?.toDate().toLocaleTimeString() ??
                      "N/A"}
                  </span>
                </div>
              ) : (
                <div className="no-data-message">
                  No recent logout data available.
                </div>
              )}
            </div>

            {/* --- Box 4: Available Slots --- */}
            <div className="box box-4">
              <div className="cardtitle">
                <label>Available Slots</label>
              </div>
              {/* Display the count using hardcoded total */}
              <div className="count-display">
                {`${availableSlots} / ${TOTAL_PARKING_CAPACITY}`}
              </div>
            </div>

            {/* --- Box 5: Vehicles Currently In --- */}
            <div className="box box-5">
              <div className="cardtitle">
                <label>Vehicles Currently In</label>
              </div>
              <div className="count-display">{loggedInCount}</div>
            </div>

            {/* --- Box 6: Total Departures --- */}
            <div className="box box-6">
              <div className="cardtitle">
                <label>Total Departures</label>
              </div>
              <div className="count-display">{loggedOutCount}</div>
            </div>

            {/* --- Box 7: Total Entries --- */}
            <div className="box box-7">
              <div className="cardtitle">
                <label>Total Entries</label>
              </div>
              <div className="count-display">{totalEnteredCount}</div>
            </div>
          </div>{" "}
          {/* End gridcont */}
        </div>{" "}
        {/* End main-content */}
      </div>{" "}
      {/* End App */}
    </Fragment>
  );
}

export default Dashboard;
