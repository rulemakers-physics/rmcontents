"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  ArrowUturnLeftIcon, 
  ArrowsPointingOutIcon,
  TrashIcon, 
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------------
// [아이콘 컴포넌트 정의]
// ----------------------------------------------------------------------

// 1. 형광펜 (Lucide 'Highlighter' 기반 + 색상 팁 추가)
const HighlighterIcon = ({ className, color }: { className?: string; color: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* 펜촉 색상 채우기 */}
    <path d="M12 19l7-7 3 3-7 7-3-3z" fill={color} stroke="none" /> 
    <path d="M12 19l-9 2 2-9 7 7Z" fill={color} stroke="none" opacity="0.6"/>

    {/* Lucide Pen Outlines */}
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

// 2. 펜 (Lucide 'Pen' 기반 + 색상 팁 추가)
const PenIcon = ({ className, color }: { className?: string; color: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    {/* 펜 끝부분(Tip)에 선택된 색상 반영 */}
    <path d="M2 22l1.5-5.5L7.5 20.5 2 22" fill={color} stroke="none"/> 
  </svg>
);

// 3. 지우개 (Lucide 'Eraser' 원본)
const EraserIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);
// ----------------------------------------------------------------------
// [타입 및 데이터]
// ----------------------------------------------------------------------

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

const PEN_COLORS = [
  { id: 'black', color: '#1e293b', label: '검정' },
  { id: 'red', color: '#ef4444', label: '빨강' },
  { id: 'blue', color: '#3b82f6', label: '파랑' },
  { id: 'green', color: '#10b981', label: '초록' },
];

export default function DrawingLayer({ initialData, onSave, disabled = false }: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 상태 관리
  const [strokes, setStrokes] = useState<Stroke[]>(initialData || []);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState(PEN_COLORS[0].color);
  
  // UI 상태
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 20, y: 100 });
  const [size, setSize] = useState({ width: 0, height: 0 });

  // [신규] 커스텀 커서 관련 상태 및 Ref
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isOverToolbar, setIsOverToolbar] = useState(false);

  // 드래그 참조 변수
  const isDraggingToolbar = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const toolbarStartPos = useRef({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStrokes(initialData || []);
  }, [initialData]);

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

  const getPoint = (e: React.PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  // --- [현재 도구의 설정값 계산] ---
  const getCurrentToolSettings = () => {
    if (tool === 'eraser') {
      return { width: 30, color: '#ffffff', opacity: 1 };
    } else if (tool === 'highlighter') {
      return { width: 20, color: '#fde047', opacity: 0.5 }; // 노랑 형광펜
    } else {
      return { width: 2, color: selectedColor, opacity: 1 };
    }
  };

  // --- 이벤트 핸들러 ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isDraggingToolbar.current) return;
    if ((e.target as HTMLElement).closest('.drawing-toolbar')) return;

    if (isColorMenuOpen) setIsColorMenuOpen(false);

    e.currentTarget.setPointerCapture(e.pointerId);

    const { width, color } = getCurrentToolSettings();
    let isHighlighter = false;
    let strokeColor = color;

    // 형광펜 실제 그리기용 색상 오버라이드
    if (tool === 'highlighter') {
        strokeColor = "rgba(253, 224, 71, 0.4)"; 
        isHighlighter = true;
    }

    setCurrentStroke({
      points: [getPoint(e)],
      color: strokeColor,
      width: width,
      isEraser: tool === 'eraser',
      isHighlighter
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. 커서 위치 업데이트 (성능을 위해 직접 DOM 조작)
    if (!disabled && cursorRef.current) {
        // e.clientX, clientY는 뷰포트 기준이므로 바로 적용 가능 (fixed position 사용 시)
        // 또는 container 기준이라면 offset 계산 필요. 여기선 fixed 사용 가정.
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }

    // 2. 드로잉 로직
    if (currentStroke) {
      const newPoint = getPoint(e);
      setCurrentStroke(prev => prev ? ({ ...prev, points: [...prev.points, newPoint] }) : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (currentStroke) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setCurrentStroke(null);
      onSave(newStrokes);
    }
  };

  // 커서 진입/이탈 핸들러
  const handlePointerEnter = () => setIsHovering(true);
  const handlePointerLeave = () => setIsHovering(false);

  // 툴바 드래그 로직 (생략 없이 유지)
  const startDragToolbar = (e: React.PointerEvent) => {
    e.stopPropagation();
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
      let newX = toolbarStartPos.current.x + dx;
      let newY = toolbarStartPos.current.y + dy;
      
      const toolbarEl = toolbarRef.current;
      if (toolbarEl && containerRef.current) {
        const maxX = containerRef.current.clientWidth - toolbarEl.offsetWidth;
        const maxY = containerRef.current.clientHeight - toolbarEl.offsetHeight;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
      }
      setToolbarPos({ x: newX, y: newY });
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

  const handleClearAll = () => {
    if(confirm("모든 필기를 지우시겠습니까?")) {
        setStrokes([]);
        onSave([]);
    }
  };

  // 현재 툴 설정값 가져오기 (커서 렌더링용)
  const currentSettings = getCurrentToolSettings();

  return (
    // 배경 투명 유지 (이전 수정사항 반영)
    <div 
      ref={containerRef} 
      className={`absolute inset-0 z-0 touch-none overflow-hidden bg-transparent ${disabled ? '' : 'cursor-none'}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* 1. Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="w-full h-full touch-none absolute inset-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      
      {/* [신규] 커스텀 커서 (마우스 팔로워) */}
      {!disabled && isHovering && !isOverToolbar && (
        <div
          ref={cursorRef}
          className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 transition-colors"
          style={{
            left: 0, 
            top: 0,
            width: `${Math.max(10, currentSettings.width)}px`, // 너무 작으면 안보이므로 최소값 10
            height: `${Math.max(10, currentSettings.width)}px`,
            backgroundColor: tool === 'eraser' ? 'white' : currentSettings.color,
            opacity: tool === 'highlighter' ? 0.5 : 1,
            // 지우개일 때만 그림자 추가해서 잘 보이게
            boxShadow: tool === 'eraser' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
            border: tool === 'eraser' ? '1px solid #cbd5e1' : 'none', // 지우개 테두리
          }}
        >
            {/* 펜 모드일 때만 가운데 십자 표시 추가 (정밀함 강조) 선택사항 */}
            {tool === 'pen' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
            )}
        </div>
      )}

      {/* 2. Floating Toolbar */}
      {!disabled && (
        <div 
          ref={toolbarRef}
          // [2] 툴바에 마우스 진입/이탈 이벤트 추가
          onPointerEnter={() => setIsOverToolbar(true)}
          onPointerLeave={() => setIsOverToolbar(false)}
          className="drawing-toolbar absolute flex flex-col gap-2 bg-white/90 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-2 border border-slate-200 w-[60px] items-center z-50 select-none cursor-auto" // 툴바 위에서는 기본 커서 보여주기
          style={{ 
            left: toolbarPos.x, 
            top: toolbarPos.y, 
            touchAction: 'none' 
          }}
          onPointerDown={(e) => e.stopPropagation()} // 툴바 클릭 시 그리기 방지
        >
          <div 
            className="w-full h-6 flex items-center justify-center cursor-move text-slate-400 hover:text-slate-600 mb-1"
            onPointerDown={startDragToolbar}
            onPointerMove={onDragToolbar}
            onPointerUp={stopDragToolbar}
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </div>

          {/* 펜 */}
          <div className="relative">
            <button
              onClick={() => { setTool('pen'); setIsColorMenuOpen(!isColorMenuOpen); }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                tool === 'pen' ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-300' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <PenIcon className="w-6 h-6" color={selectedColor} />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-400 opacity-50" />
            </button>
            <AnimatePresence>
              {isColorMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: 10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.9 }}
                  className="absolute left-full top-0 ml-3 flex gap-2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 cursor-default"
                >
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedColor(c.color); setTool('pen'); setIsColorMenuOpen(false); }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${selectedColor === c.color ? 'border-slate-400 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 형광펜 */}
          <button
            onClick={() => { setTool('highlighter'); setIsColorMenuOpen(false); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              tool === 'highlighter' ? 'bg-yellow-50 text-yellow-600 ring-2 ring-yellow-200' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <HighlighterIcon className="w-6 h-6" color="#fde047"/>
          </button>

          {/* 지우개 */}
          <button
            onClick={() => { setTool('eraser'); setIsColorMenuOpen(false); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              tool === 'eraser' ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-300' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <EraserIcon className="w-6 h-6" />
          </button>

          <div className="w-full h-px bg-slate-100 my-1"></div>

          <button onClick={handleUndo} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl">
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>

          <button onClick={handleClearAll} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}