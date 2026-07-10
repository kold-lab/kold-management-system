"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Finger/stylus signature capture: plain canvas + pointer events, no deps.
 * Writes a PNG data URL into a hidden input named `name` (empty until drawn).
 */
export function SignaturePad({ name, label }: { name: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Match the drawing buffer to the on-screen size for crisp strokes.
    const scale = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0F2D4D";
    }
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext("2d");
    const { x, y } = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = e.currentTarget.getContext("2d");
    const { x, y } = pos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    setHasInk(true);
    if (inputRef.current && canvasRef.current) {
      inputRef.current.value = canvasRef.current.toDataURL("image/png");
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (inputRef.current) inputRef.current.value = "";
    setHasInk(false);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-brand-deep">{label}</span>
        {hasInk && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="mt-1 h-32 w-full touch-none rounded border border-dashed border-brand-slate/40 bg-white"
      />
      {!hasInk && (
        <p className="mt-1 text-xs text-brand-slate">Sign above with a finger.</p>
      )}
      <input ref={inputRef} type="hidden" name={name} />
    </div>
  );
}
