// src/App.jsx
import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import NavBar from "./components/navigationBar";
import Login from "./pages/Login";
import LoginLogout from "./pages/LoginLogout";
import Manual from "./pages/Manual";
import Settings from "./pages/Settings";
import { ModalProvider } from "./context/ModalContext";
import serialService from "./services/SerialService";

// Layout component for pages with NavBar
const WithNavBar = ({ children }) => (
  <>
    <NavBar />
    {children}
  </>
);

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <WithNavBar>
                  <Dashboard />
                </WithNavBar>
              }
            />
            <Route
              path="/history"
              element={
                <WithNavBar>
                  <History />
                </WithNavBar>
              }
            />
            <Route
              path="/manual"
              element={
                <WithNavBar>
                  <Manual />
                </WithNavBar>
              }
            />
            <Route
              path="/loginlogout"
              element={
                <WithNavBar>
                  <LoginLogout />
                </WithNavBar>
              }
            />
            <Route path="/Settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
