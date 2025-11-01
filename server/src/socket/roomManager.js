// Room Manager
/**
 * Room Manager - Handles all room-related operations
 */
class RoomManager {
  constructor() {
    // Store active rooms: { roomId: { users: [], admin: socketId, canvas: [], history: [] } }
    this.rooms = new Map();
  }

  /**
   * Create a new room
   */
  createRoom(roomId, adminSocketId, username) {
    this.rooms.set(roomId, {
      admin: adminSocketId,
      users: [
        { socketId: adminSocketId, username, color: this.getRandomColor() },
      ],
      canvas: [], // Current canvas state
      history: [], // Undo/redo history
      historyIndex: -1,
    });
    return this.rooms.get(roomId);
  }

  /**
   * Join existing room
   */
  joinRoom(roomId, socketId, username) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = {
      socketId,
      username,
      color: this.getRandomColor(),
    };
    room.users.push(user);
    return room;
  }

  /**
   * Leave room
   */
  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.users = room.users.filter((u) => u.socketId !== socketId);

    // If admin left, assign new admin
    if (room.admin === socketId && room.users.length > 0) {
      room.admin = room.users[0].socketId;
    }

    // Delete room if empty
    if (room.users.length === 0) {
      this.rooms.delete(roomId);
      return { deleted: true };
    }

    return room;
  }

  /**
   * Get room data
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Check if room exists
   */
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * Update canvas state
   */
  updateCanvas(roomId, drawData) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.canvas.push(drawData);

    // Add to history for undo/redo
    room.history = room.history.slice(0, room.historyIndex + 1);
    room.history.push(drawData);
    room.historyIndex = room.history.length - 1;

    return true;
  }

  /**
   * Clear canvas
   */
  clearCanvas(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.canvas = [];
    room.history = [];
    room.historyIndex = -1;
    return true;
  }

  /**
   * Undo action
   */
  undo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.historyIndex < 0) return null;

    room.historyIndex--;
    room.canvas = room.history.slice(0, room.historyIndex + 1);
    return room.canvas;
  }

  /**
   * Redo action
   */
  redo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.historyIndex >= room.history.length - 1) return null;

    room.historyIndex++;
    room.canvas = room.history.slice(0, room.historyIndex + 1);
    return room.canvas;
  }

  /**
   * Get random user color
   */
  getRandomColor() {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7B731",
      "#5F27CD",
      "#00D2D3",
      "#FF9FF3",
      "#54A0FF",
      "#48DBFB",
      "#1DD1A1",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get user info
   */
  getUserInfo(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.users.find((u) => u.socketId === socketId);
  }
}

export default new RoomManager();
