import roomManager from "./roomManager.js";
import {
  generateRoomCode,
  isValidRoomCode,
} from "../utils/roomCodeGenerator.js";

export function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on("create-room", ({ username }) => {
      const roomId = generateRoomCode();
      const room = roomManager.createRoom(roomId, socket.id, username);

      socket.join(roomId);
      socket.emit("room-created", {
        roomId,
        admin: socket.id,
        users: room.users,
        userCount: room.users.length,
      });

      console.log(`🏠 Room created: ${roomId} by ${username}`);
    });

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

      socket.emit("room-joined", {
        roomId,
        admin: room.admin,
        users: room.users,
        canvas: room.canvas,
        userCount: room.users.length,
      });

      socket.to(roomId).emit("user-joined", {
        user: roomManager.getUserInfo(roomId, socket.id),
        users: room.users,
        userCount: room.users.length,
      });

      console.log(
        `👥 ${username} joined room: ${roomId}. Total users: ${room.users.length}`
      );
    });

    /**
     * FIXED: Drawing events - each complete stroke/shape is one unit
     */
    socket.on("draw-complete", ({ roomId, drawData }) => {
      roomManager.addToCanvas(roomId, drawData);
      socket.to(roomId).emit("draw-complete", { drawData });
    });

    socket.on("draw-preview", ({ roomId, drawData }) => {
      socket.to(roomId).emit("draw-preview", { drawData });
    });

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

    socket.on("undo", ({ roomId }) => {
      const result = roomManager.undo(roomId);
      if (result) {
        io.to(roomId).emit("canvas-update", result);
      }
    });

    socket.on("redo", ({ roomId }) => {
      const result = roomManager.redo(roomId);
      if (result) {
        io.to(roomId).emit("canvas-update", result);
      }
    });

    socket.on("chat-message", ({ roomId, message }) => {
      const user = roomManager.getUserInfo(roomId, socket.id);
      if (!user) return;

      const chatData = {
        id: Date.now(),
        socketId: socket.id,
        username: user.username,
        message,
        timestamp: new Date().toISOString(),
        color: user.color,
      };

      io.to(roomId).emit("chat-message", chatData);
    });

    socket.on("chat-reaction", ({ roomId, emoji }) => {
      const user = roomManager.getUserInfo(roomId, socket.id);
      if (!user) return;

      io.to(roomId).emit("chat-reaction", {
        username: user.username,
        emoji,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          const result = roomManager.leaveRoom(roomId, socket.id);

          if (result && !result.deleted) {
            socket.to(roomId).emit("user-left", {
              socketId: socket.id,
              users: result.users,
              newAdmin: result.admin,
              userCount: result.users.length,
            });
          }
        }
      });

      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
}
