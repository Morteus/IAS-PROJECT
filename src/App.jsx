// src/App.jsx
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import NavBar from "./components/navigationBar";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route (No NavBar) */}
        <Route path="/Login" element={<Login />} />

        {/* Dashboard Route (With NavBar) */}
        <Route
          path="/Dashboard"
          element={
            <>
              <NavBar />
              <Dashboard />
            </>
          }
        />

        {/* History Route (With NavBar) */}
        <Route
          path="/History"
          element={
            <>
              <NavBar />
              <History />
            </>
          }
        />
        {/* Default route */}
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
