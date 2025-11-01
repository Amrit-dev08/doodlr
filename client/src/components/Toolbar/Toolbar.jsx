// Toolbar Component
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPen,
  FaMinus,
  FaCircle,
  FaSquare,
  FaArrowRight,
  FaFont,
  FaEraser,
  FaUndo,
  FaRedo,
  FaTrash,
  FaPalette,
} from "react-icons/fa";
import "./Toolbar.css";

const TOOLS = [
  { id: "pen", icon: FaPen, label: "Pen" },
  { id: "line", icon: FaMinus, label: "Line" },
  { id: "circle", icon: FaCircle, label: "Circle" },
  { id: "rectangle", icon: FaSquare, label: "Rectangle" },
  { id: "arrow", icon: FaArrowRight, label: "Arrow" },
  { id: "text", icon: FaFont, label: "Text" },
  { id: "eraser", icon: FaEraser, label: "Eraser" },
];

const COLORS = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#ffa07a",
  "#98d8c8",
  "#f7b731",
  "#5f27cd",
  "#00d2d3",
  "#ff9ff3",
  "#54a0ff",
  "#48dbfb",
  "#1dd1a1",
];

const LINE_WIDTHS = [1, 2, 3, 5, 8, 12, 16];

function Toolbar({
  tool,
  color,
  lineWidth,
  onToolChange,
  onColorChange,
  onLineWidthChange,
  onUndo,
  onRedo,
  onClear,
  isAdmin,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineWidthPicker, setShowLineWidthPicker] = useState(false);

  return (
    <div className="toolbar-container">
      <motion.div
        className="toolbar"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Drawing tools */}
        <div className="toolbar-section">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                className={`toolbar-btn ${tool === t.id ? "active" : ""}`}
                onClick={() => onToolChange(t.id)}
                whileTap={{ scale: 0.9 }}
                title={t.label}
              >
                <Icon />
              </motion.button>
            );
          })}
        </div>

        <div className="toolbar-divider" />

        {/* Color picker */}
        <div className="toolbar-section">
          <motion.button
            className="toolbar-btn color-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            whileTap={{ scale: 0.9 }}
            title="Colors"
          >
            <div className="color-preview" style={{ background: color }} />
            <FaPalette className="color-icon" />
          </motion.button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                className="color-picker"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className="color-grid">
                  {COLORS.map((c) => (
                    <motion.button
                      key={c}
                      className={`color-option ${color === c ? "active" : ""}`}
                      style={{ background: c }}
                      onClick={() => {
                        onColorChange(c);
                        setShowColorPicker(false);
                      }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="custom-color-input"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Line width */}
        <div className="toolbar-section">
          <motion.button
            className="toolbar-btn"
            onClick={() => setShowLineWidthPicker(!showLineWidthPicker)}
            whileTap={{ scale: 0.9 }}
            title="Line Width"
          >
            <div className="line-width-preview">
              <div
                className="line-width-indicator"
                style={{
                  width: `${lineWidth * 2}px`,
                  height: `${lineWidth * 2}px`,
                  background: color,
                }}
              />
            </div>
          </motion.button>

          <AnimatePresence>
            {showLineWidthPicker && (
              <motion.div
                className="line-width-picker"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {LINE_WIDTHS.map((w) => (
                  <motion.button
                    key={w}
                    className={`line-width-option ${
                      lineWidth === w ? "active" : ""
                    }`}
                    onClick={() => {
                      onLineWidthChange(w);
                      setShowLineWidthPicker(false);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className="line-width-dot"
                      style={{ width: `${w * 2}px`, height: `${w * 2}px` }}
                    />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="toolbar-divider" />

        {/* Actions */}
        <div className="toolbar-section">
          <motion.button
            className="toolbar-btn"
            onClick={onUndo}
            whileTap={{ scale: 0.9 }}
            title="Undo"
          >
            <FaUndo />
          </motion.button>

          <motion.button
            className="toolbar-btn"
            onClick={onRedo}
            whileTap={{ scale: 0.9 }}
            title="Redo"
          >
            <FaRedo />
          </motion.button>

          {isAdmin && (
            <motion.button
              className="toolbar-btn danger"
              onClick={onClear}
              whileTap={{ scale: 0.9 }}
              title="Clear Canvas (Admin Only)"
            >
              <FaTrash />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Toolbar;
