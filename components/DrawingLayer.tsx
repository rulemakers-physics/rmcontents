// components/DrawingLayer.tsx

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { 
  TrashIcon, 
  ArrowUturnLeftIcon, 
  ArrowsPointingOutIcon // 드래그 핸들용 아이콘
} from "@heroicons/react/24/outline";

// 커스텀 형광펜 아이콘 (더 직관적인 디자인)
const HighlighterIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 11l-7-7-9 9 7 7 9-9z" />
    <path d="M15 15l-7-7" />
    <path d="M3 21h18" />
  </svg>
);

// 커스텀 펜 아이콘
const PenIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isEraser: boolean;
  isHighlighter?: boolean;
}

interface DrawingLayerProps {
  initialData: Stroke[];
  onSave: (data: Stroke[]) => void;
  disabled?: boolean;
}

// 펜 색상 옵션
const PEN_COLORS = [
  { id: 'black', color: '#1e293b', label: '검정' },
  { id: 'red', color: '#ef4444', label: '빨강' },
  { id: 'blue', color: '#3b82f6', label: '파랑' },
];

export default function DrawingLayer({ initialData, onSave, disabled = false }: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 드로잉 상태
  const [strokes, setStrokes] = useState<Stroke[]>(initialData || []);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState(PEN_COLORS[0].color);
  const [isDrawing, setIsDrawing] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // 툴바 드래그 상태
  const [toolbarPos, setToolbarPos] = useState({ x: 20, y: 100 });
  const isDraggingToolbar = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 }); // 마우스 시작 위치
  const toolbarStartPos = useRef({ x: 0, y: 0 }); // 툴바 시작 위치

  // 초기 데이터 로드
  useEffect(() => {
    setStrokes(initialData || []);
  }, [initialData]);

  // 화면 크기 감지
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 캔버스 그리기
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const allStrokes = [...strokes, ...(currentStroke ? [currentStroke] : [])];

    allStrokes.forEach(stroke => {
      if (stroke.points.length < 1) return;
      
      ctx.beginPath();
      ctx.lineWidth = stroke.width;
      
      if (stroke.isEraser) {
         ctx.globalCompositeOperation = "destination-out"; 
         ctx.strokeStyle = "#ffffff";
      } else {
         // 형광펜은 뒤에 비치도록 multiply 모드 사용 (선택 사항)
         ctx.globalCompositeOperation = stroke.isHighlighter ? "multiply" : "source-over";
         ctx.strokeStyle = stroke.color;
      }

      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    });
    
    ctx.globalCompositeOperation = "source-over";
  }, [strokes, currentStroke]);

  useEffect(() => {
    renderCanvas();
  }, [size, renderCanvas]);

  // 좌표 계산 (상대 좌표)
  const getPoint = (e: React.PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  // --- 드로잉 핸들러 ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isDraggingToolbar.current) return;
    
    // 툴바 위에서 발생한 이벤트면 드로잉 시작 안함
    if ((e.target as HTMLElement).closest('.drawing-toolbar')) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    let strokeColor = selectedColor;
    let strokeWidth = 2;
    let isHighlighter = false;

    if (tool === 'eraser') {
      strokeWidth = 30;
    } else if (tool === 'highlighter') {
      strokeColor = "rgba(253, 224, 71, 0.5)"; // 형광펜 노랑 (반투명)
      strokeWidth = 20;
      isHighlighter = true;
    }

    setCurrentStroke({
      points: [getPoint(e)],
      color: strokeColor,
      width: strokeWidth,
      isEraser: tool === 'eraser',
      isHighlighter
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDrawing && currentStroke) {
      const newPoint = getPoint(e);
      setCurrentStroke(prev => prev ? ({ ...prev, points: [...prev.points, newPoint] }) : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing && currentStroke) {
      setIsDrawing(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setCurrentStroke(null);
      onSave(newStrokes);
    }
  };

  // --- 툴바 드래그 핸들러 ---
  const startDragToolbar = (e: React.PointerEvent) => {
    e.stopPropagation(); // 캔버스 터치 방지
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingToolbar.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    toolbarStartPos.current = { ...toolbarPos };
  };

  const onDragToolbar = (e: React.PointerEvent) => {
    if (isDraggingToolbar.current) {
      e.stopPropagation();
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setToolbarPos({
        x: toolbarStartPos.current.x + dx,
        y: toolbarStartPos.current.y + dy
      });
    }
  };

  const stopDragToolbar = (e: React.PointerEvent) => {
    if (isDraggingToolbar.current) {
      isDraggingToolbar.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleUndo = () => {
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    onSave(newStrokes);
  };

  const handleClear = () => {
    if(confirm("필기를 모두 지우시겠습니까?")) {
        setStrokes([]);
        onSave([]);
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 touch-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="w-full h-full cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      
      {/* --- 드래그 가능한 툴바 --- */}
      {!disabled && (
        <div 
          className="drawing-toolbar absolute flex flex-col gap-3 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 border border-slate-100 w-16 items-center"
          style={{ 
            left: toolbarPos.x, 
            top: toolbarPos.y, 
            touchAction: 'none' 
          }}
        >
          {/* 드래그 핸들 */}
          <div 
            className="w-full h-6 flex items-center justify-center cursor-move text-slate-300 hover:text-slate-500 mb-1"
            onPointerDown={startDragToolbar}
            onPointerMove={onDragToolbar}
            onPointerUp={stopDragToolbar}
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </div>

          {/* 1. 펜 & 색상 */}
          {PEN_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setTool('pen'); setSelectedColor(c.color); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                tool === 'pen' && selectedColor === c.color 
                  ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 border-transparent' 
                  : 'border-slate-200 hover:scale-105'
              }`}
              style={{ backgroundColor: c.color }}
              title={`${c.label} 펜`}
            >
              {tool === 'pen' && selectedColor === c.color && (
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
              )}
            </button>
          ))}

          <div className="w-full h-px bg-slate-100 my-1"></div>

          {/* 2. 형광펜 */}
          <button
            onClick={() => setTool('highlighter')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'highlighter' 
                ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-200' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
            title="형광펜"
          >
            <HighlighterIcon className="w-6 h-6" />
          </button>

          {/* 3. 지우개 */}
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'eraser' 
                ? 'bg-slate-200 text-slate-700 ring-2 ring-slate-300' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
            title="지우개"
          >
            <TrashIcon className="w-6 h-6" />
          </button>

          <div className="w-full h-px bg-slate-100 my-1"></div>

          {/* 4. 유틸리티 */}
          <button onClick={handleUndo} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors" title="되돌리기">
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}