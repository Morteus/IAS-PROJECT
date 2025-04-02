import React, { Fragment, useState, useEffect } from "react";
import { useLatestLogin, useLatestLogout } from "../databaseComponent"; // Import the functions
import "./Dashboard.css";
import { fetchAllHistory } from "../databaseComponent";

function Dashboard() {
  const [latestLogin, setLatestLogin] = useState(null);
  const [latestLogout, setLatestLogout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await fetchAllHistory();
        setHistoryData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleLoginUpdate = (data, err) => {
      if (isMounted) {
        if (err) {
          setError(err);
        } else {
          setLatestLogin(data);
        }
        setLoading(false);
      }
    };

    const handleLogoutUpdate = (data, err) => {
      if (isMounted) {
        if (err) {
          setError(err);
        } else {
          setLatestLogout(data);
        }
        setLoading(false);
      }
    };

    const unsubscribeLogin = useLatestLogin(handleLoginUpdate);
    const unsubscribeLogout = useLatestLogout(handleLogoutUpdate);

    return () => {
      isMounted = false;
      unsubscribeLogin();
      unsubscribeLogout();
    };
  }, []);

  if (loading) {
    return <div>Loading latest history...</div>;
  }

  if (error) {
    return <div>Error: {error.message || "Failed to load latest history"}</div>;
  }

  return (
    <Fragment>
      <div className="App">
        <div className="main-content">
          <div className="title">
            <label htmlFor="">DASHBOARD </label>
          </div>
          <div className="gridcont">
            {/* box1 */}
            <div className="box box-1">
              <div className="cardtitle">
                <label htmlFor="">History</label>
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
                    {historyData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.Platenumber || "N/A"}</td>
                        <td>{item.Name || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* box1 */}
            <div className="box box-2">
              <div className="cardtitle">
                <label htmlFor="">Logged In</label>
              </div>

              {latestLogin && (
                <div key={latestLogin.id} className="loggedin-outcontainer">
                  <label htmlFor={`uid-${latestLogin.id}`}>UID:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={latestLogin.ID || "N/A"}
                    id={`uid-${latestLogin.id}`}
                  />
                  <label htmlFor={`name-${latestLogin.id}`}>Name:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={latestLogin.Name || "N/A"}
                    id={`name-${latestLogin.id}`}
                  />
                  <label htmlFor={`plate-${latestLogin.id}`}>
                    Plate Number:
                  </label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={latestLogin.Platenumber || "N/A"}
                    id={`plate-${latestLogin.id}`}
                  />
                  <label htmlFor={`date-${latestLogin.id}`}>Date:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={
                      latestLogin.LOGGED_IN
                        ? latestLogin.LOGGED_IN.toDate().toLocaleDateString()
                        : "N/A"
                    }
                    id={`date-${latestLogin.id}`}
                  />
                  <label htmlFor={`time-${latestLogin.id}`}>Time:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={
                      latestLogin.LOGGED_IN
                        ? latestLogin.LOGGED_IN.toDate().toLocaleTimeString()
                        : "N/A"
                    }
                    id={`time-${latestLogin.id}`}
                  />
                </div>
              )}
            </div>
            <div className="box box-3">
              <div className="cardtitle">
                <label htmlFor="">Logged out</label>
              </div>
              {latestLogout && (
                <div key={latestLogout.id} className="loggedin-outcontainer">
                  <label htmlFor={`uid-${latestLogout.id}`}>UID:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={latestLogout.ID || "N/A"}
                    id={`uid-${latestLogout.id}`}
                  />
                  <label htmlFor={`name-${latestLogout.id}`}>Name:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={latestLogout.Name || "N/A"}
                    id={`name-${latestLogout.id}`}
                  />
                  <label htmlFor={`plate-${latestLogout.id}`}>
                    Plate Number:
                  </label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={latestLogout.Platenumber || "N/A"}
                    id={`plate-${latestLogout.id}`}
                  />
                  <label htmlFor={`date-${latestLogout.id}`}>Date:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={
                      latestLogout.LOGGED_OUT
                        ? latestLogout.LOGGED_OUT.toDate().toLocaleDateString()
                        : "N/A"
                    }
                    id={`date-${latestLogout.id}`}
                  />
                  <label htmlFor={`time-${latestLogout.id}`}>Time:</label>
                  <input
                    type="text"
                    className="text-information"
                    readOnly={true}
                    value={
                      latestLogout.LOGGED_OUT
                        ? latestLogout.LOGGED_OUT.toDate().toLocaleTimeString()
                        : "N/A"
                    }
                    id={`time-${latestLogout.id}`}
                  />
                </div>
              )}
            </div>

            <div className="box box-4">
              <div className="cardtitle">
                <label htmlFor="">Available Slots</label>
              </div>
            </div>
            <div className="box box-5">
              <div className="cardtitle">
                <label htmlFor="">Total Vehicle logged in</label>
              </div>
            </div>
            <div className="box box-6">
              <div className="cardtitle">
                <label htmlFor="">Total Vehicle logged out</label>
              </div>
            </div>
            <div className="box box-7">
              <div className="cardtitle">
                <label htmlFor="">Total Vehicles Entered</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;
