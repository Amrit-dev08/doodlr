// Canvas Drawing Utils
/**
 * Drawing utilities for canvas operations
 */

/**
 * Draw a line on canvas
 */
export function drawLine(ctx, x1, y1, x2, y2, color, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.closePath();
}

/**
 * Draw a circle on canvas
 */
export function drawCircle(
  ctx,
  x1,
  y1,
  x2,
  y2,
  color,
  lineWidth,
  fill = false
) {
  const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.stroke();
  }
  ctx.closePath();
}

/**
 * Draw a rectangle on canvas
 */
export function drawRectangle(
  ctx,
  x1,
  y1,
  x2,
  y2,
  color,
  lineWidth,
  fill = false
) {
  const width = x2 - x1;
  const height = y2 - y1;

  ctx.beginPath();
  ctx.rect(x1, y1, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.stroke();
  }
  ctx.closePath();
}

/**
 * Draw an arrow on canvas
 */
export function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth) {
  const headLength = 20;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
  ctx.closePath();
}

/**
 * Draw text on canvas
 */
export function drawText(ctx, text, x, y, color, fontSize = 24) {
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

/**
 * Erase on canvas
 */
export function erase(ctx, x, y, lineWidth) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, lineWidth / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Get coordinates from mouse or touch event
 */
export function getCoordinates(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX, clientY;

  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
