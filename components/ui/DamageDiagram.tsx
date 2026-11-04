"use client";

import React, { useRef, useState, useEffect } from "react";
import { RotateCcw, AlertTriangle, Check } from "lucide-react";

interface DamageDiagramProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  readOnly?: boolean;
}

export default function DamageDiagram({
  value,
  onChange,
  readOnly = false,
}: DamageDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize car diagram outline
  useEffect(() => {
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
      drawBaseCar(ctx, canvas.width, canvas.height);
    }
  }, [value]);

  const drawBaseCar = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FAFAFA";
    ctx.fillRect(0, 0, w, h);

    // Car silhouette outline
    ctx.strokeStyle = "#9CA3AF";
    ctx.lineWidth = 2;

    // Center Top View Car Body
    ctx.beginPath();
    ctx.roundRect(w * 0.35, h * 0.15, w * 0.3, h * 0.7, 30);
    ctx.stroke();

    // Windshield & Rear glass
    ctx.beginPath();
    ctx.roundRect(w * 0.38, h * 0.32, w * 0.24, h * 0.14, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(w * 0.38, h * 0.62, w * 0.24, h * 0.12, 8);
    ctx.stroke();

    // Wheels
    ctx.fillStyle = "#4B5563";
    ctx.fillRect(w * 0.31, h * 0.22, 16, 32); // Front Left
    ctx.fillRect(w * 0.65, h * 0.22, 16, 32); // Front Right
    ctx.fillRect(w * 0.31, h * 0.65, 16, 32); // Rear Left
    ctx.fillRect(w * 0.65, h * 0.65, 16, 32); // Rear Right

    // Labels
    ctx.fillStyle = "#6B7280";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FRONT", w * 0.5, h * 0.1);
    ctx.fillText("REAR", w * 0.5, h * 0.93);
    ctx.fillText("PASSENGER / N/S", w * 0.18, h * 0.5);
    ctx.fillText("DRIVER / O/S", w * 0.82, h * 0.5);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = "#D71920";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
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

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawBaseCar(ctx, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase">
          <AlertTriangle className="w-3.5 h-3.5 text-[#D71920]" />
          <span>Vehicle Damage Diagram (Draw to Mark Defects)</span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-2.5 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Diagram</span>
          </button>
        )}
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-xs flex justify-center">
        <canvas
          ref={canvasRef}
          width={450}
          height={320}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`touch-none ${readOnly ? "cursor-default" : "cursor-crosshair"}`}
        />
      </div>
      <p className="text-[10px] text-gray-400 text-center">
        Click and drag in red on the vehicle body to mark scratches, dents, or existing damage.
      </p>
    </div>
  );
}
