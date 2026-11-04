"use client";

import React, { useRef, useState, useEffect } from "react";
import { RotateCcw, PenTool, Check, CarFront, AlertCircle } from "lucide-react";

interface AccidentSketchCanvasProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  readOnly?: boolean;
}

export default function AccidentSketchCanvas({
  value,
  onChange,
  readOnly = false,
}: AccidentSketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#D71920"); // Default PCH Red (Client Car)
  const [lineWidth, setLineWidth] = useState(3);
  const [isEditing, setIsEditing] = useState(!value);

  // Initialize or redraw canvas
  useEffect(() => {
    if (!isEditing && value) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    } else {
      drawRoadGrid(ctx, canvas.width, canvas.height);
    }
  }, [value, isEditing]);

  const drawRoadGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    // Background
    ctx.fillStyle = "#F9FAFB";
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Road guide line in the center
    ctx.strokeStyle = "#D1D5DB";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Watermark guide
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SKETCH ACCIDENT SCENE: DRAW VEHICLES, ARROWS & POINT OF IMPACT", w / 2, 22);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawRoadGrid(ctx, canvas.width, canvas.height);
    onChange("");
  };

  // If a saved sketch exists and user is not currently in edit mode
  if (value && !isEditing) {
    return (
      <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl flex flex-col items-center gap-3">
        <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs max-w-full">
          <img
            src={value}
            alt="Saved Accident Circumstance Sketch"
            className="max-h-[300px] w-auto object-contain mx-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 hover:border-[#D71920] text-gray-700 hover:text-[#D71920] rounded-xl text-xs font-bold transition shadow-xs"
          >
            <PenTool className="w-3.5 h-3.5 text-[#D71920]" />
            <span>Update / Redraw Sketch</span>
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2.5 py-1.5 text-gray-400 hover:text-red-600 text-xs transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase">Pen:</span>
          {/* Red - Client Car */}
          <button
            type="button"
            onClick={() => setColor("#D71920")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              color === "#D71920"
                ? "bg-red-50 text-[#D71920] border-2 border-[#D71920]"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#D71920]" />
            <span>Client (Red)</span>
          </button>

          {/* Black - 3rd Party */}
          <button
            type="button"
            onClick={() => setColor("#121212")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              color === "#121212"
                ? "bg-gray-100 text-gray-900 border-2 border-gray-900"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#121212]" />
            <span>3rd Party (Black)</span>
          </button>

          {/* Blue - Arrow / Road */}
          <button
            type="button"
            onClick={() => setColor("#2563EB")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              color === "#2563EB"
                ? "bg-blue-50 text-blue-700 border-2 border-blue-600"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span>Path / Road (Blue)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg text-xs font-semibold transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Sketch</span>
          </button>

          {value && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
            >
              <Check className="w-3 h-3" />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={700}
          height={320}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="border-2 border-gray-300 rounded-xl bg-white shadow-xs cursor-crosshair touch-none w-full max-w-[700px] h-auto"
        />
      </div>

      <p className="text-[11px] text-gray-500 text-center italic">
        Tip: Draw road direction, arrows showing vehicle movement, and the point of collision.
      </p>
    </div>
  );
}
