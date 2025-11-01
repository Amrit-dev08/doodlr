/**
 * Room Manager - Handles all room-related operations
 * FIXED: Proper undo/redo per stroke, user count logic
 */
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, adminSocketId, username) {
    this.rooms.set(roomId, {
      admin: adminSocketId,
      users: [
        { socketId: adminSocketId, username, color: this.getRandomColor() },
      ],
      canvas: [], // Array of complete strokes/shapes
      redoStack: [], // For redo functionality
    });
    console.log(`✅ Room created: ${roomId} with 1 user`);
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, socketId, username) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = {
      socketId,
      username,
      color: this.getRandomColor(),
    };
    room.users.push(user);
    console.log(`✅ User joined ${roomId}. Total users: ${room.users.length}`);
    return room;
  }

  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const userCountBefore = room.users.length;
    room.users = room.users.filter((u) => u.socketId !== socketId);

    console.log(
      `👋 User left ${roomId}. Users: ${userCountBefore} -> ${room.users.length}`
    );

    if (room.admin === socketId && room.users.length > 0) {
      room.admin = room.users[0].socketId;
      console.log(`👑 New admin assigned: ${room.users[0].username}`);
    }

    if (room.users.length === 0) {
      this.rooms.delete(roomId);
      console.log(`🗑️  Room ${roomId} deleted (empty)`);
      return { deleted: true };
    }

    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * Add complete stroke/shape to canvas
   * Each drawing action is ONE undo unit
   */
  addToCanvas(roomId, drawData) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Add complete stroke/shape as single unit
    room.canvas.push(drawData);

    // Clear redo stack when new action is performed
    room.redoStack = [];

    return true;
  }

  /**
   * Undo last complete stroke/shape
   */
  undo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.canvas.length === 0) return null;

    const lastAction = room.canvas.pop();
    room.redoStack.push(lastAction);

    console.log(`↩️  Undo in ${roomId}. Canvas items: ${room.canvas.length}`);
    return { canvas: room.canvas };
  }

  /**
   * Redo last undone stroke/shape
   */
  redo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.redoStack.length === 0) return null;

    const action = room.redoStack.pop();
    room.canvas.push(action);

    console.log(`↪️  Redo in ${roomId}. Canvas items: ${room.canvas.length}`);
    return { canvas: room.canvas };
  }

  clearCanvas(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.canvas = [];
    room.redoStack = [];
    console.log(`🗑️  Canvas cleared in ${roomId}`);
    return true;
  }

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

  getUserInfo(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.users.find((u) => u.socketId === socketId);
  }

  getUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users.length : 0;
  }
}

export default new RoomManager();
