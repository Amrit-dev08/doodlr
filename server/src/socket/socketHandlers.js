// Socket Handlers
import roomManager from "./roomManager.js";
import {
  generateRoomCode,
  isValidRoomCode,
} from "../utils/roomCodeGenerator.js";

/**
 * Setup all Socket.io event handlers
 */
export function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    /**
     * Create a new room
     */
    socket.on("create-room", ({ username }) => {
      const roomId = generateRoomCode();
      const room = roomManager.createRoom(roomId, socket.id, username);

      socket.join(roomId);
      socket.emit("room-created", {
        roomId,
        admin: socket.id,
        users: room.users,
      });

      console.log(`🏠 Room created: ${roomId} by ${username}`);
    });

    /**
     * Join existing room
     */
    socket.on("join-room", ({ roomId, username }) => {
      if (!isValidRoomCode(roomId)) {
        socket.emit("room-error", { message: "Invalid room code format" });
        return;
      }

      if (!roomManager.roomExists(roomId)) {
        socket.emit("room-error", { message: "Room not found" });
        return;
      }

      const room = roomManager.joinRoom(roomId, socket.id, username);
      socket.join(roomId);

      // Send current canvas state to new user
      socket.emit("room-joined", {
        roomId,
        admin: room.admin,
        users: room.users,
        canvas: room.canvas,
      });

      // Notify others in room
      socket.to(roomId).emit("user-joined", {
        user: roomManager.getUserInfo(roomId, socket.id),
        users: room.users,
      });

      console.log(`👥 ${username} joined room: ${roomId}`);
    });

    /**
     * Drawing events
     */
    socket.on("draw", ({ roomId, drawData }) => {
      roomManager.updateCanvas(roomId, drawData);

      // Broadcast to all users in room except sender
      socket.to(roomId).emit("draw", { drawData });
    });

    /**
     * Mouse/Touch pointer tracking
     */
    socket.on("pointer-move", ({ roomId, x, y }) => {
      const user = roomManager.getUserInfo(roomId, socket.id);
      if (!user) return;

      socket.to(roomId).emit("pointer-move", {
        socketId: socket.id,
        username: user.username,
        color: user.color,
        x,
        y,
      });
    });

    /**
     * Clear canvas (admin only)
     */
    socket.on("clear-canvas", ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.admin !== socket.id) {
        socket.emit("error", { message: "Only admin can clear canvas" });
        return;
      }

      roomManager.clearCanvas(roomId);
      io.to(roomId).emit("canvas-cleared");
      console.log(`🗑️  Canvas cleared in room: ${roomId}`);
    });

    /**
     * Undo action
     */
    socket.on("undo", ({ roomId }) => {
      const canvas = roomManager.undo(roomId);
      if (canvas !== null) {
        io.to(roomId).emit("canvas-update", { canvas });
      }
    });

    /**
     * Redo action
     */
    socket.on("redo", ({ roomId }) => {
      const canvas = roomManager.redo(roomId);
      if (canvas !== null) {
        io.to(roomId).emit("canvas-update", { canvas });
      }
    });

    /**
     * Chat message
     */
    socket.on("chat-message", ({ roomId, message }) => {
      const user = roomManager.getUserInfo(roomId, socket.id);
      if (!user) return;

      const chatData = {
        id: Date.now(),
        username: user.username,
        message,
        timestamp: new Date().toISOString(),
        color: user.color,
      };

      io.to(roomId).emit("chat-message", chatData);
    });

    /**
     * Chat reaction
     */
    socket.on("chat-reaction", ({ roomId, emoji }) => {
      const user = roomManager.getUserInfo(roomId, socket.id);
      if (!user) return;

      io.to(roomId).emit("chat-reaction", {
        username: user.username,
        emoji,
        timestamp: Date.now(),
      });
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", () => {
      // Find and leave all rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          const result = roomManager.leaveRoom(roomId, socket.id);

          if (result && !result.deleted) {
            socket.to(roomId).emit("user-left", {
              socketId: socket.id,
              users: result.users,
              newAdmin: result.admin,
            });
          }
        }
      });

      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
}
