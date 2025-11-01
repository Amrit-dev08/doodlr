// Room Code Generator
/**
 * Generate a unique 6-character room code
 * @returns {string} Room code
 */
export function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate room code format
 * @param {string} code - Room code to validate
 * @returns {boolean} Is valid
 */
export function isValidRoomCode(code) {
  return /^[A-Z0-9]{6}$/.test(code);
}
