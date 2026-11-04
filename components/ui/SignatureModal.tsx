"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, Check, RotateCcw, PenTool, Trash2 } from "lucide-react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  initialSignature?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSave,
  title = "Draw Signature",
  initialSignature,
}: SignatureModalProps) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsEmpty(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    try {
      sigRef.current?.clear();
    } catch (e) {
      console.warn("Clear canvas error:", e);
    }
    setIsEmpty(true);
  };

  const handleRemoveExisting = () => {
    onSave("");
    onClose();
  };

  const handleSave = () => {
    if (!sigRef.current) return;

    let dataUrl = "";
    try {
      if (sigRef.current.isEmpty && sigRef.current.isEmpty()) {
        return;
      }

      // First attempt: trimmed canvas (tighter bounding box)
      try {
        const trimmed = sigRef.current.getTrimmedCanvas();
        if (trimmed && trimmed.width > 0 && trimmed.height > 0) {
          dataUrl = trimmed.toDataURL("image/png");
        }
      } catch (e) {
        console.warn("getTrimmedCanvas warning, falling back to full canvas:", e);
      }

      // Fallback: direct canvas export
      if (!dataUrl) {
        const raw = sigRef.current.getCanvas();
        if (raw) {
          dataUrl = raw.toDataURL("image/png");
        }
      }
    } catch (err) {
      console.error("Signature extraction error:", err);
    }

    if (dataUrl) {
      onSave(dataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <PenTool className="w-5 h-5 text-[#D71920]" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Sign inside the box using your mouse, trackpad, or touchscreen.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white mb-4 relative shadow-inner">
          <SignatureCanvas
            ref={sigRef}
            penColor="#151515"
            dotSize={1.5}
            minWidth={1.2}
            maxWidth={2.8}
            velocityFilterWeight={0.7}
            onBegin={() => setIsEmpty(false)}
            canvasProps={{
              width: 500,
              height: 200,
              className: "w-full h-48 cursor-crosshair touch-none select-none bg-white",
              style: { touchAction: "none" },
            }}
          />
          <div className="absolute bottom-2 left-3 text-[10px] text-gray-400 pointer-events-none uppercase tracking-wider font-semibold select-none">
            Signature Line
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Pad</span>
            </button>

            {initialSignature && (
              <button
                type="button"
                onClick={handleRemoveExisting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                title="Remove signature completely"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isEmpty}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg text-white shadow-xs transition-colors ${
                isEmpty
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#D71920] hover:bg-[#B5141A] active:scale-95"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Apply Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
