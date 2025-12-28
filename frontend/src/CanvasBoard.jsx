import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const CanvasBoard = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (ctx && canvasRef.current) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    getBlob: async () => {
      if (!canvasRef.current) return null;
      return new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = 'white';
    context.lineWidth = 15; // Thicker lines for better recognition
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    setCtx(context);
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !ctx) return;
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const getCoordinates = (e) => {
    if (e.nativeEvent instanceof MouseEvent) {
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    } else if (e.nativeEvent instanceof TouchEvent) {
      const rect = e.target.getBoundingClientRect();
      const touch = e.nativeEvent.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={280}
      className="border-2 border-gray-300 rounded-lg cursor-crosshair touch-none"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{ width: '280px', height: '280px', backgroundColor: 'black' }}
    />
  );
});

CanvasBoard.displayName = 'CanvasBoard';

export default CanvasBoard;
