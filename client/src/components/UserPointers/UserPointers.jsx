// User Pointer Component
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./UserPointers.css";

function UserPointers({ pointers }) {
  return (
    <div className="user-pointers">
      <AnimatePresence>
        {Object.entries(pointers).map(([socketId, pointer]) => (
          <motion.div
            key={socketId}
            className="user-pointer"
            style={{
              left: pointer.x,
              top: pointer.y,
              borderColor: pointer.color,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={pointer.color}
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35z" />
            </svg>
            <motion.div
              className="user-pointer-label"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ background: pointer.color }}
            >
              {pointer.username}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default UserPointers;
