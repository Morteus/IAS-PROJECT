import { useState } from "react";
import "./Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { handleLogin } from "../databaseComponent"; // Import handleLogin

function Login() {
  const [displayPassword, setDisplayPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleClick = () => {
    setDisplayPassword(!displayPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear any previous errors

    try {
      const success = await handleLogin(username, password);
      if (success) {
        navigate("/Dashboard"); // Navigate on successful login
      }
    } catch (err) {
      setError(err.message); // Set error message from handleLogin
    }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="input-container">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  color: "red",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                {error}
              </div>
            )}
            <div className="input-container-child">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label htmlFor="password">Password</label>
              <div className="password-box" style={{ position: "relative" }}>
                <input
                  placeholder="Password"
                  type={displayPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FontAwesomeIcon
                  onClick={handleClick}
                  icon={displayPassword ? faEyeSlash : faEye}
                  className="fa-icon"
                />
              </div>
              <button type="submit">Login</button>
              <a
                href="/forgot-password"
                style={{
                  marginTop: "10px",
                  display: "block",
                  color: "#2b2b2b",
                  textDecoration: "none",
                }}
              >
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
        <div className="logo-container"></div>
      </div>
    </div>
  );
}

export default Login;
