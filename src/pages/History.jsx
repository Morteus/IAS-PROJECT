import React, { Fragment, useState, useEffect } from "react";
import { fetchAllHistory } from "../databaseComponent";
import "./History.css";

function History() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div>Error: {error.message || "Failed to load history"}</div>;
  }

  const formatTotalTime = (loggedIn, loggedOut) => {
    if (loggedIn && loggedOut) {
      const diff = loggedOut.getTime() - loggedIn.getTime();
      const diffInMinutes = Math.round(diff / (1000 * 60));

      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}`;
      } else if (diffInMinutes < 1440) {
        const diffInHours = Math.floor(diffInMinutes / 60);
        const remainingMinutes = diffInMinutes % 60;
        return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ${
          remainingMinutes > 0
            ? `${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`
            : ""
        }`;
      } else {
        const diffInDays = Math.floor(diffInMinutes / 1440);
        const remainingHours = Math.floor((diffInMinutes % 1440) / 60);
        return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ${
          remainingHours > 0
            ? `${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`
            : ""
        }`;
      }
    }
    return "N/A";
  };

  return (
    <Fragment>
      <div className="main-content">
        <div className="title">
          <label htmlFor="">HISTORY</label>
        </div>

        <div className="history-container">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Plate Number</th>
                  <th>Logged In</th>
                  <th>Logged Out</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => {
                  const loggedIn = item.LOGGED_IN
                    ? item.LOGGED_IN.toDate()
                    : null;
                  const loggedOut = item.LOGGED_OUT
                    ? item.LOGGED_OUT.toDate()
                    : null;

                  return (
                    <tr key={item.id}>
                      <td>{item.ID || "N/A"}</td>
                      <td>{item.Name || "N/A"}</td>
                      <td>{item.Platenumber || "N/A"}</td>
                      <td>{loggedIn ? loggedIn.toLocaleString() : "N/A"}</td>
                      <td>{loggedOut ? loggedOut.toLocaleString() : "N/A"}</td>
                      <td>{formatTotalTime(loggedIn, loggedOut)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default History;
