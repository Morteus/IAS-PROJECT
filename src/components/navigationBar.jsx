import "./NavigationBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faHourglassEmpty,
  faHand,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import LogoImage from "../assets/Bolls.png";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUsernameListener } from "../databaseComponent";
import { useModal } from "../context/ModalContext";

function NavBar() {
  const [username, setUsername] = useState("Loading..."); // Default username
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    if (userId) {
      const unsubscribe = useUsernameListener(userId, setUsername);

      return () => {
        unsubscribe(); // Cleanup the listener when the component unmounts
      };
    } else {
      setUsername("Not Logged In");
    }
  }, [userId]);

  const handleLogoutClick = () => {
    openModal(
      <div>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to log out?</p>
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="modal-button confirm"
            onClick={() => {
              confirmLogout();
              closeModal();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    );
  };

  const confirmLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    navigate("/Login");
  };

  return (
    <div className="nav">
      <div className="info">
        <div className="imagecont">
          <img src={LogoImage} alt="" />
        </div>
        <div className="infocont-child">
          <label>ParkingSystem</label>
          <label id="userNameLabel">{username}</label>
        </div>
      </div>
      <div className="navigationlinks">
        <ul>
          <li>
            <Link to="/Dashboard" className="a">
              <FontAwesomeIcon icon={faHouse} className="fa-icon" />
              <label htmlFor="home">Dashboard</label>
            </Link>
          </li>
          <li>
            <Link to="/History" id="navigateToHistory" className="a">
              <FontAwesomeIcon icon={faHourglassEmpty} className="fa-icon" />
              <label htmlFor="history">History</label>
            </Link>
          </li>
          <li>
            <Link to="/Manual" id="navigateToManual" className="a">
              <FontAwesomeIcon icon={faHand} className="fa-icon" />
              <label htmlFor="manual">Manual</label>
            </Link>
          </li>
        </ul>
      </div>
      <div className="logout">
        <ul>
          <li>
            <div
              onClick={handleLogoutClick}
              id="navigateToLogout"
              className="a"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="fa-icon" />
              <label htmlFor="logout">Logout</label>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default NavBar;
