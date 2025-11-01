// Room Controls Component 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaComments,
  FaCopy,
  FaCheck,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaChevronDown
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { generateRoomLink, copyToClipboard } from '../../utils/roomUtils';
import './RoomControls.css';

function RoomControls({ roomId, users, isAdmin, onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  const handleCopyLink = async () => {
    const link = generateRoomLink(roomId);
    const success = await copyToClipboard(link);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomId);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    if (confirm('Are you sure you want to leave this room?')) {
      navigate('/');
    }
  };

  return (
    <div className="room-controls">
      <div className="room-info">
        <motion.div
          className="room-code-badge"
          whileHover={{ scale: 1.05 }}
        >
          <span className="room-label">Room:</span>
          <span className="room-code">{roomId}</span>
          <motion.button
            className="icon-btn"
            onClick={handleCopyCode}
            whileTap={{ scale: 0.9 }}
            title="Copy room code"
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </motion.button>
        </motion.div>

        {isAdmin && (
          <span className="admin-badge">Admin</span>
        )}
      </div>

      <div className="room-actions">
        {/* Users dropdown */}
        <div className="dropdown">
          <motion.button
            className="control-btn"
            onClick={() => setShowUsers(!showUsers)}
            whileTap={{ scale: 0.95 }}
          >
            <FaUsers />
            <span className="badge">{users.length}</span>
            <FaChevronDown className={`chevron ${showUsers ? 'open' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showUsers && (
              <motion.div
                className="dropdown-menu users-menu"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="dropdown-header">
                  <h4>Users in Room ({users.length})</h4>
                </div>
                <div className="users-list">
                  {users.map((user) => (
                    <div key={user.socketId} className="user-item">
                      <div
                        className="user-avatar"
                        style={{ background: user.color }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="user-name">{user.username}</span>
                      {user.socketId === users.find(u => u.socketId)?.socketId && isAdmin && (
                        <span className="user-badge">You</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <button className="share-btn" onClick={handleCopyLink}>
                    <FaCopy />
                    Copy Invite Link
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat toggle */}
        <motion.button
          className={`control-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          whileTap={{ scale: 0.95 }}
          title="Toggle chat"
        >
          <FaComments />
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          className="control-btn"
          onClick={toggleTheme}
          whileTap={{ scale: 0.95 }}
          title="Toggle theme"
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </motion.button>

        {/* Leave room */}
        <motion.button
          className="control-btn danger"
          onClick={handleLeaveRoom}
          whileTap={{ scale: 0.95 }}
          title="Leave room"
        >
          <FaSignOutAlt />
        </motion.button>
      </div>

      {/* Copied notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="copied-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FaCheck /> Copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RoomControls;
