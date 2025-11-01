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
  (
    { tool, color, lineWidth, onDrawComplete, onDrawPreview, onPointerMove },
    ref
  ) => {
    const canvasRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentStroke, setCurrentStroke] = useState([]); // For pen/eraser strokes
    const [textInput, setTextInput] = useState({
      show: false,
      x: 0,
      y: 0,
      value: "",
    });

    // Initialize canvases
    useEffect(() => {
      const canvas = canvasRef.current;
      const previewCanvas = previewCanvasRef.current;
      if (!canvas || !previewCanvas) return;

      const resizeCanvas = () => {
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Save current canvas content
        const mainCtx = canvas.getContext("2d");
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

        canvas.width = width;
        canvas.height = height;
        previewCanvas.width = width;
        previewCanvas.height = height;

        // Restore content
        mainCtx.drawImage(tempCanvas, 0, 0);
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    const throttledPointerMove = useRef(
      throttle((x, y) => onPointerMove(x, y), 100)
    ).current;

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        const canvas = canvasRef.current;
        const previewCanvas = previewCanvasRef.current;
        const mainCtx = canvas.getContext("2d");
        const previewCtx = previewCanvas.getContext("2d");
        mainCtx.clearRect(0, 0, canvas.width, canvas.height);
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      },

      loadCanvas: (drawDataArray) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawDataArray.forEach((data) => {
          executeDrawing(ctx, data);
        });
      },

      drawRemoteComplete: (drawData) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        executeDrawing(ctx, drawData);
      },

      drawRemotePreview: (drawData) => {
        const previewCanvas = previewCanvasRef.current;
        const ctx = previewCanvas.getContext("2d");
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        executeDrawing(ctx, drawData);
      },
    }));

    const executeDrawing = (ctx, data) => {
      const {
        tool: drawTool,
        points,
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
          if (points && points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = drawLineWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
          }
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
          if (points && points.length > 0) {
            ctx.globalCompositeOperation = "destination-out";
            points.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, drawLineWidth, 0, 2 * Math.PI);
              ctx.fill();
            });
            ctx.globalCompositeOperation = "source-over";
          }
          break;
        default:
          break;
      }
    };

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
      setCurrentStroke([coords]);
    };

    const draw = (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const coords = getCoordinates(canvas, e);

      if (!isDrawing) {
        throttledPointerMove(coords.x, coords.y);
        return;
      }

      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext("2d");

      if (tool === "pen") {
        const mainCtx = canvas.getContext("2d");
        drawLine(
          mainCtx,
          currentStroke[currentStroke.length - 1].x,
          currentStroke[currentStroke.length - 1].y,
          coords.x,
          coords.y,
          color,
          lineWidth
        );
        setCurrentStroke((prev) => [...prev, coords]);
      } else if (tool === "eraser") {
        const mainCtx = canvas.getContext("2d");
        erase(mainCtx, coords.x, coords.y, lineWidth * 2);
        setCurrentStroke((prev) => [...prev, coords]);
      } else if (["line", "circle", "rectangle", "arrow"].includes(tool)) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        const previewData = {
          tool,
          x1: startPos.x,
          y1: startPos.y,
          x2: coords.x,
          y2: coords.y,
          color,
          lineWidth,
        };

        executeDrawing(previewCtx, previewData);
        onDrawPreview(previewData);
      }

      throttledPointerMove(coords.x, coords.y);
    };

    const stopDrawing = (e) => {
      if (!isDrawing) return;

      e.preventDefault();
      setIsDrawing(false);

      const canvas = canvasRef.current;
      const coords = getCoordinates(canvas, e);
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext("2d");
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      let drawData;

      if (tool === "pen") {
        drawData = {
          tool: "pen",
          points: currentStroke,
          color,
          lineWidth,
        };
      } else if (tool === "eraser") {
        drawData = {
          tool: "eraser",
          points: currentStroke,
          lineWidth: lineWidth * 2,
        };
      } else if (["line", "circle", "rectangle", "arrow"].includes(tool)) {
        drawData = {
          tool,
          x1: startPos.x,
          y1: startPos.y,
          x2: coords.x,
          y2: coords.y,
          color,
          lineWidth,
        };

        const mainCtx = canvas.getContext("2d");
        executeDrawing(mainCtx, drawData);
      }

      if (drawData) {
        onDrawComplete(drawData);
      }

      setCurrentStroke([]);
    };

    const handleTextSubmit = () => {
      if (!textInput.value.trim()) {
        setTextInput({ show: false, x: 0, y: 0, value: "" });
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const drawData = {
        tool: "text",
        x1: textInput.x,
        y1: textInput.y,
        text: textInput.value,
        color,
      };

      executeDrawing(ctx, drawData);
      onDrawComplete(drawData);
      setTextInput({ show: false, x: 0, y: 0, value: "" });
    };

    return (
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className={`canvas main-canvas ${
            tool === "eraser" ? "eraser-cursor" : ""
          }`}
        />
        <canvas
          ref={previewCanvasRef}
          className={`canvas preview-canvas ${
            tool === "eraser" ? "eraser-cursor" : ""
          }`}
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
