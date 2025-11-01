// Canvas Component
import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { throttle } from "../../utils/roomUtils";
import {
  drawLine,
  drawCircle,
  drawRectangle,
  drawArrow,
  drawText,
  erase,
  getCoordinates,
} from "./DrawingUtils";
import "./Canvas.css";

const Canvas = forwardRef(
  ({ tool, color, lineWidth, onDraw, onPointerMove }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [tempCanvas, setTempCanvas] = useState(null);
    const [textInput, setTextInput] = useState({
      show: false,
      x: 0,
      y: 0,
      value: "",
    });

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      // Set canvas size
      const resizeCanvas = () => {
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        // Redraw canvas content after resize
        if (tempCanvas) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [tempCanvas]);

    // Throttled pointer move for performance
    const throttledPointerMove = useRef(
      throttle((x, y) => {
        onPointerMove(x, y);
      }, 100)
    ).current;

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      loadCanvas: (drawDataArray) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawDataArray.forEach((data) => {
          executeDrawing(ctx, data);
        });
      },
      drawRemote: (drawData) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        executeDrawing(ctx, drawData);
      },
    }));

    // Execute drawing based on draw data
    const executeDrawing = (ctx, data) => {
      const {
        tool: drawTool,
        x1,
        y1,
        x2,
        y2,
        color: drawColor,
        lineWidth: drawLineWidth,
        text,
      } = data;

      switch (drawTool) {
        case "pen":
          drawLine(ctx, x1, y1, x2, y2, drawColor, drawLineWidth);
          break;
        case "line":
          drawLine(ctx, x1, y1, x2, y2, drawColor, drawLineWidth);
          break;
        case "circle":
          drawCircle(ctx, x1, y1, x2, y2, drawColor, drawLineWidth);
          break;
        case "rectangle":
          drawRectangle(ctx, x1, y1, x2, y2, drawColor, drawLineWidth);
          break;
        case "arrow":
          drawArrow(ctx, x1, y1, x2, y2, drawColor, drawLineWidth);
          break;
        case "text":
          drawText(ctx, text, x1, y1, drawColor, 24);
          break;
        case "eraser":
          erase(ctx, x2, y2, drawLineWidth * 2);
          break;
        default:
          break;
      }
    };

    // Start drawing
    const startDrawing = (e) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      const coords = getCoordinates(canvas, e);

      if (tool === "text") {
        setTextInput({ show: true, x: coords.x, y: coords.y, value: "" });
        return;
      }

      setIsDrawing(true);
      setStartPos(coords);
      setCurrentPos(coords);

      // Save current canvas state for shapes
      if (["line", "circle", "rectangle", "arrow"].includes(tool)) {
        const ctx = canvas.getContext("2d");
        setTempCanvas(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    };

    // Continue drawing
    const draw = (e) => {
      e.preventDefault();

      if (!isDrawing) {
        // Just track pointer for other users
        const canvas = canvasRef.current;
        const coords = getCoordinates(canvas, e);
        throttledPointerMove(coords.x, coords.y);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const coords = getCoordinates(canvas, e);

      setCurrentPos(coords);

      if (tool === "pen") {
        // Free drawing
        drawLine(
          ctx,
          startPos.x,
          startPos.y,
          coords.x,
          coords.y,
          color,
          lineWidth
        );

        const drawData = {
          tool,
          x1: startPos.x,
          y1: startPos.y,
          x2: coords.x,
          y2: coords.y,
          color,
          lineWidth,
        };

        onDraw(drawData);
        setStartPos(coords);
      } else if (tool === "eraser") {
        // Eraser
        erase(ctx, coords.x, coords.y, lineWidth * 2);

        const drawData = {
          tool,
          x1: startPos.x,
          y1: startPos.y,
          x2: coords.x,
          y2: coords.y,
          lineWidth,
        };

        onDraw(drawData);
        setStartPos(coords);
      } else if (["line", "circle", "rectangle", "arrow"].includes(tool)) {
        // Shapes - show preview
        ctx.putImageData(tempCanvas, 0, 0);

        switch (tool) {
          case "line":
            drawLine(
              ctx,
              startPos.x,
              startPos.y,
              coords.x,
              coords.y,
              color,
              lineWidth
            );
            break;
          case "circle":
            drawCircle(
              ctx,
              startPos.x,
              startPos.y,
              coords.x,
              coords.y,
              color,
              lineWidth
            );
            break;
          case "rectangle":
            drawRectangle(
              ctx,
              startPos.x,
              startPos.y,
              coords.x,
              coords.y,
              color,
              lineWidth
            );
            break;
          case "arrow":
            drawArrow(
              ctx,
              startPos.x,
              startPos.y,
              coords.x,
              coords.y,
              color,
              lineWidth
            );
            break;
          default:
            break;
        }
      }

      throttledPointerMove(coords.x, coords.y);
    };

    // Stop drawing
    const stopDrawing = (e) => {
      if (!isDrawing) return;

      e.preventDefault();
      setIsDrawing(false);

      const canvas = canvasRef.current;
      const coords = getCoordinates(canvas, e);

      if (["line", "circle", "rectangle", "arrow"].includes(tool)) {
        const drawData = {
          tool,
          x1: startPos.x,
          y1: startPos.y,
          x2: coords.x,
          y2: coords.y,
          color,
          lineWidth,
        };

        onDraw(drawData);
      }
    };

    // Handle text input
    const handleTextSubmit = () => {
      if (!textInput.value.trim()) {
        setTextInput({ show: false, x: 0, y: 0, value: "" });
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      drawText(ctx, textInput.value, textInput.x, textInput.y, color, 24);

      const drawData = {
        tool: "text",
        x1: textInput.x,
        y1: textInput.y,
        text: textInput.value,
        color,
      };

      onDraw(drawData);
      setTextInput({ show: false, x: 0, y: 0, value: "" });
    };

    return (
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className={`canvas ${tool === "eraser" ? "eraser-cursor" : ""}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {textInput.show && (
          <div
            className="text-input-overlay"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              type="text"
              value={textInput.value}
              onChange={(e) =>
                setTextInput({ ...textInput, value: e.target.value })
              }
              onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
              placeholder="Type text..."
              autoFocus
              maxLength={50}
            />
            <div className="text-input-buttons">
              <button onClick={handleTextSubmit}>✓</button>
              <button
                onClick={() =>
                  setTextInput({ show: false, x: 0, y: 0, value: "" })
                }
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
