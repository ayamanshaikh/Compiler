"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
}

export function Particles({
  className = "",
  quantity = 30,
  staticity = 50,
  ease = 50,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Array<{
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
  }>>([]);
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const { resolvedAnimationMode } = useTheme();

  const isProfessional = resolvedAnimationMode === "professional";
  const isEnhanced = resolvedAnimationMode === "enhanced";

  useEffect(() => {
    if (isProfessional || !canvasRef.current) return;

    const canvas = canvasRef.current;
    context.current = canvas.getContext("2d");

    const initCanvas = () => {
      if (!canvas) return;
      canvasSize.current.w = canvas.parentElement?.clientWidth || window.innerWidth;
      canvasSize.current.h = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = canvasSize.current.w * dpr;
      canvas.height = canvasSize.current.h * dpr;
      canvas.style.width = `${canvasSize.current.w}px`;
      canvas.style.height = `${canvasSize.current.h}px`;
      context.current?.scale(dpr, dpr);
    };

    const actualCount = isEnhanced ? quantity * 1.3 : quantity;

    const createCircles = () => {
      circles.current = [];
      for (let i = 0; i < actualCount; i++) {
        const x = Math.floor(Math.random() * canvasSize.current.w);
        const y = Math.floor(Math.random() * canvasSize.current.h);
        const translateX = 0;
        const translateY = 0;
        const size = Math.floor(Math.random() * 2) + 1;
        const alpha = 0;
        const targetAlpha = parseFloat((Math.random() * 0.4 + 0.1).toFixed(2));
        const dx = (Math.random() - 0.5) * 0.2;
        const dy = (Math.random() - 0.5) * 0.2;
        const magnetism = 0.1 + Math.random() * 4;
        circles.current.push({
          x,
          y,
          translateX,
          translateY,
          size,
          alpha,
          targetAlpha,
          dx,
          dy,
          magnetism,
        });
      }
    };

    const drawCircle = (circle: (typeof circles.current)[0]) => {
      if (!context.current) return;
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(148, 163, 184, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let animationFrameId: number;

    const animate = () => {
      if (!context.current) return;
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);

      circles.current.forEach((circle) => {
        // Move towards target alpha
        if (circle.alpha < circle.targetAlpha) {
          circle.alpha += 0.02;
        }

        circle.x += circle.dx;
        circle.y += circle.dy;

        // Wrap edges
        if (circle.x < 0) circle.x = canvasSize.current.w;
        if (circle.x > canvasSize.current.w) circle.x = 0;
        if (circle.y < 0) circle.y = canvasSize.current.h;
        if (circle.y > canvasSize.current.h) circle.y = 0;

        // Mouse interaction in enhanced mode
        if (isEnhanced) {
          circle.translateX +=
            (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
          circle.translateY +=
            (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;
        }

        drawCircle(circle);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left - canvasSize.current.w / 2;
      const y = event.clientY - rect.top - canvasSize.current.h / 2;
      mousePosition.current = { x, y };
      mouse.current = { x, y };
    };

    const handleResize = () => {
      initCanvas();
      createCircles();
    };

    initCanvas();
    createCircles();
    animate();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isProfessional, isEnhanced, quantity, staticity, ease, dpr]);

  if (isProfessional) {
    return null;
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
