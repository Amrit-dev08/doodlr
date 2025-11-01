// Home Page
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPalette, FaUsers, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../hooks/useSocket";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { socket, connected } = useSocket();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!socket || !connected) {
      setError("Not connected to server");
      return;
    }

    setLoading(true);
    setError("");

    socket.emit("create-room", { username: username.trim() });

    socket.once("room-created", ({ roomId }) => {
      setLoading(false);
      navigate(`/room/${roomId}`, { state: { username: username.trim() } });
    });

    socket.once("room-error", ({ message }) => {
      setError(message);
      setLoading(false);
    });
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter room code");
      return;
    }

    if (!socket || !connected) {
      setError("Not connected to server");
      return;
    }

    setLoading(true);
    setError("");

    const code = roomCode.trim().toUpperCase();

    socket.emit("join-room", { roomId: code, username: username.trim() });

    socket.once("room-joined", () => {
      setLoading(false);
      navigate(`/room/${code}`, { state: { username: username.trim() } });
    });

    socket.once("room-error", ({ message }) => {
      setError(message);
      setLoading(false);
    });
  };

  return (
    <div className="home">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? <FaMoon /> : <FaSun />}
      </button>

      <motion.div
        className="home-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="logo"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FaPalette className="logo-icon" />
          <h1>Doodlr</h1>
          <p>Draw, Create & Collaborate in Real-Time</p>
        </motion.div>

        <div className="connection-status">
          <span
            className={`status-dot ${connected ? "connected" : "disconnected"}`}
          />
          <span className="status-text">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>

        <motion.div
          className="form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="input-group">
            <label htmlFor="username">Your Name</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              disabled={loading}
            />
          </div>

          <motion.button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={loading || !connected}
            whileTap={{ scale: 0.95 }}
          >
            <FaUsers />
            Create New Room
          </motion.button>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="input-group">
            <label htmlFor="roomCode">Room Code</label>
            <input
              id="roomCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={loading}
            />
          </div>

          <motion.button
            className="btn btn-secondary"
            onClick={handleJoinRoom}
            disabled={loading || !connected}
            whileTap={{ scale: 0.95 }}
          >
            Join Room
          </motion.button>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Home;
