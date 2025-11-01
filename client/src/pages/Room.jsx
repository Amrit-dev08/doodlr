import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../hooks/useSocket";
import Canvas from "../components/Canvas/Canvas";
import Toolbar from "../components/Toolbar/Toolbar";
import Sidebar from "../components/Sidebar/Sidebar";
import RoomControls from "../components/RoomControls/RoomControls";
import UserPointers from "../components/UserPointers/UserPointers";
import "./Room.css";

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  const [username] = useState(location.state?.username || "Guest");
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [userPointers, setUserPointers] = useState({});
  const [notification, setNotification] = useState(null);

  const canvasRef = useRef(null);
  const mySocketIdRef = useRef(null);

  // Show notification helper
  const showNotification = (message, type = "info") => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!socket || !connected) return;

    mySocketIdRef.current = socket.id;
    socket.emit("join-room", { roomId, username });

    const handlers = {
      "room-joined": ({
        admin,
        users: roomUsers,
        canvas,
        userCount: count,
      }) => {
        setIsAdmin(socket.id === admin);
        setUsers(roomUsers);
        setUserCount(count);

        if (canvas && canvasRef.current) {
          canvasRef.current.loadCanvas(canvas);
        }
      },

      "user-joined": ({ user, users: updatedUsers, userCount: count }) => {
        setUsers(updatedUsers);
        setUserCount(count);
        if (user.socketId !== socket.id) {
          showNotification(`${user.username} joined`, "success");
        }
      },

      "user-left": ({ users: updatedUsers, newAdmin, userCount: count }) => {
        setUsers(updatedUsers);
        setUserCount(count);
        if (newAdmin === socket.id) {
          setIsAdmin(true);
          showNotification("You are now the admin", "info");
        }
      },

      "draw-complete": ({ drawData }) => {
        if (canvasRef.current) {
          canvasRef.current.drawRemoteComplete(drawData);
        }
      },

      "draw-preview": ({ drawData }) => {
        if (canvasRef.current) {
          canvasRef.current.drawRemotePreview(drawData);
        }
      },

      "canvas-cleared": () => {
        if (canvasRef.current) {
          canvasRef.current.clearCanvas();
        }
        showNotification("Canvas cleared", "info");
      },

      "canvas-update": ({ canvas }) => {
        if (canvasRef.current) {
          canvasRef.current.loadCanvas(canvas);
        }
      },

      "pointer-move": ({
        socketId,
        username: userName,
        color: userColor,
        x,
        y,
      }) => {
        setUserPointers((prev) => ({
          ...prev,
          [socketId]: {
            username: userName,
            color: userColor,
            x,
            y,
            timestamp: Date.now(),
          },
        }));
      },

      "chat-message": (message) => {
        setMessages((prev) => [...prev, message]);
        if (message.socketId !== socket.id && !sidebarOpen) {
          showNotification(
            `${message.username}: ${message.message.substring(0, 30)}${
              message.message.length > 30 ? "..." : ""
            }`,
            "message"
          );
        }
      },

      "chat-reaction": (reaction) => {
        setReactions((prev) => [...prev, { ...reaction, id: Date.now() }]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }, 3000);
      },

      "room-error": ({ message }) => {
        alert(message);
        navigate("/");
      },
    };

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    return () => {
      Object.entries(handlers).forEach(([evt]) => socket.off(evt));
    };
  }, [socket, connected, roomId, username, navigate, sidebarOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUserPointers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (now - updated[key].timestamp > 3000) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDrawComplete = (drawData) => {
    if (socket && connected) {
      socket.emit("draw-complete", { roomId, drawData });
    }
  };

  const handleDrawPreview = (drawData) => {
    if (socket && connected) {
      socket.emit("draw-preview", { roomId, drawData });
    }
  };

  const handlePointerMove = (x, y) => {
    if (socket && connected) {
      socket.emit("pointer-move", { roomId, x, y });
    }
  };

  const handleClearCanvas = () => {
    if (socket && connected && isAdmin) {
      if (confirm("Clear the entire canvas? This cannot be undone.")) {
        socket.emit("clear-canvas", { roomId });
      }
    }
  };

  const handleUndo = () => {
    if (socket && connected) {
      socket.emit("undo", { roomId });
    }
  };

  const handleRedo = () => {
    if (socket && connected) {
      socket.emit("redo", { roomId });
    }
  };

  const handleSendMessage = (message) => {
    if (socket && connected) {
      socket.emit("chat-message", { roomId, message });
    }
  };

  const handleSendReaction = (emoji) => {
    if (socket && connected) {
      socket.emit("chat-reaction", { roomId, emoji });
    }
  };

  if (!connected) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="room">
      <RoomControls
        roomId={roomId}
        users={users}
        userCount={userCount}
        isAdmin={isAdmin}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="room-content">
        <Canvas
          ref={canvasRef}
          tool={tool}
          color={color}
          lineWidth={lineWidth}
          onDrawComplete={handleDrawComplete}
          onDrawPreview={handleDrawPreview}
          onPointerMove={handlePointerMove}
        />

        <UserPointers pointers={userPointers} />

        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              className="floating-reaction"
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -100, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3 }}
              style={{
                left: `${Math.random() * 80 + 10}%`,
                fontSize: "48px",
              }}
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {notification && (
            <motion.div
              className={`notification notification-${notification.type}`}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toolbar
        tool={tool}
        color={color}
        lineWidth={lineWidth}
        onToolChange={setTool}
        onColorChange={setColor}
        onLineWidthChange={setLineWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClearCanvas}
        isAdmin={isAdmin}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendReaction={handleSendReaction}
        mySocketId={mySocketIdRef.current}
      />
    </div>
  );
}

export default Room;
