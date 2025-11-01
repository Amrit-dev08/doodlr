// Room Page
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [userPointers, setUserPointers] = useState({});

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join room on mount
    socket.emit("join-room", { roomId, username });

    // Room joined successfully
    socket.on("room-joined", ({ admin, users: roomUsers, canvas }) => {
      setIsAdmin(socket.id === admin);
      setUsers(roomUsers);

      // Load existing canvas
      if (canvas && canvasRef.current) {
        canvasRef.current.loadCanvas(canvas);
      }
    });

    // User joined
    socket.on("user-joined", ({ users: updatedUsers }) => {
      setUsers(updatedUsers);
    });

    // User left
    socket.on("user-left", ({ users: updatedUsers, newAdmin }) => {
      setUsers(updatedUsers);
      if (newAdmin === socket.id) {
        setIsAdmin(true);
      }
    });

    // Drawing events
    socket.on("draw", ({ drawData }) => {
      if (canvasRef.current) {
        canvasRef.current.drawRemote(drawData);
      }
    });

    // Canvas cleared
    socket.on("canvas-cleared", () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });

    // Canvas update (undo/redo)
    socket.on("canvas-update", ({ canvas }) => {
      if (canvasRef.current) {
        canvasRef.current.loadCanvas(canvas);
      }
    });

    // Pointer tracking
    socket.on(
      "pointer-move",
      ({ socketId, username: userName, color: userColor, x, y }) => {
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
      }
    );

    // Chat messages
    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Chat reactions
    socket.on("chat-reaction", (reaction) => {
      setReactions((prev) => [...prev, { ...reaction, id: Date.now() }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
    });

    // Room error
    socket.on("room-error", ({ message }) => {
      alert(message);
      navigate("/");
    });

    // Cleanup
    return () => {
      socket.off("room-joined");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("draw");
      socket.off("canvas-cleared");
      socket.off("canvas-update");
      socket.off("pointer-move");
      socket.off("chat-message");
      socket.off("chat-reaction");
      socket.off("room-error");
    };
  }, [socket, connected, roomId, username, navigate]);

  // Clean up old pointers
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

  const handleDraw = (drawData) => {
    if (socket && connected) {
      socket.emit("draw", { roomId, drawData });
    }
  };

  const handlePointerMove = (x, y) => {
    if (socket && connected) {
      socket.emit("pointer-move", { roomId, x, y });
    }
  };

  const handleClearCanvas = () => {
    if (socket && connected && isAdmin) {
      socket.emit("clear-canvas", { roomId });
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
      </div>
    );
  }

  return (
    <div className="room">
      <RoomControls
        roomId={roomId}
        users={users}
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
          onDraw={handleDraw}
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
      />
    </div>
  );
}

export default Room;
