'use client';

import { useState, useRef, useEffect } from 'react';

// Types
type Point = { x: number; y: number };
type Polyline = Point[];
type Mode = 'idle' | 'begin' | 'delete' | 'move';

// Cute pastel color palette
const COLORS = ['#ff69b4', '#87ceeb', '#ffd700', '#98d8c8', '#f7a8dc', '#b4a7d6'];

// Build ideas reference shapes
const BUILD_IDEAS = [
  { name: 'Tiny house', points: 5, icon: '🏠' },
  { name: 'Rocket cat', points: 8, icon: '🚀' },
  { name: 'Bunny face', points: 9, icon: '🐰' },
  { name: 'Star', points: 10, icon: '⭐' },
  { name: 'Heart', points: 12, icon: '❤️' },
];

export default function PolyLineEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [polylines, setPolylines] = useState<Polyline[]>([]);
  const [currentPolyline, setCurrentPolyline] = useState<Point[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [selectedPolylineIndex, setSelectedPolylineIndex] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ polylineIdx: number; pointIdx: number } | null>(null);
  const [showRefWindow, setShowRefWindow] = useState(true);
  const [canvasDims, setCanvasDims] = useState({ width: 1000, height: 600 });
  const [mood, setMood] = useState<number>(0);
  const [glitters, setGlitters] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [windowPos, setWindowPos] = useState({ x: 600, y: 100 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const POINT_RADIUS = 6;
  const HOVER_DISTANCE = 15;

  // Glitter burst effect
  const createGlitterBurst = (x: number, y: number) => {
    const newGlitters = Array.from({ length: 15 }, (_, i) => ({
      x,
      y,
      id: Date.now() + i,
    }));
    setGlitters(newGlitters);
    setTimeout(() => setGlitters([]), 800);
  };

  // Set canvas dimensions on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanvasDims({
        width: window.innerWidth - 224,
        height: window.innerHeight - 60,
      });

      const handleResize = () => {
        setCanvasDims({
          width: window.innerWidth - 224,
          height: window.innerHeight - 60,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Draw function with cute aesthetic
  const draw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lines: Polyline[],
    current: Point[],
    mouse: Point,
    hovered: { polylineIdx: number; pointIdx: number } | null,
    selected: { polylineIdx: number; pointIdx: number } | null
  ) => {
    // Clear canvas with soft pink background
    ctx.fillStyle = '#fef3f8';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = '#f0d5e0';
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw completed polylines
    lines.forEach((line, lineIdx) => {
      ctx.strokeStyle = COLORS[lineIdx % COLORS.length];
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      line.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      // Draw points
      line.forEach((point, pointIdx) => {
        const isSelected = selected && selected.polylineIdx === lineIdx && selected.pointIdx === pointIdx;
        const isHovered = hovered && hovered.polylineIdx === lineIdx && hovered.pointIdx === pointIdx;

        if (isSelected) {
          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.arc(point.x, point.y, POINT_RADIUS + 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.fillStyle = isHovered ? '#ffd700' : '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle shadow
        ctx.strokeStyle = COLORS[lineIdx % COLORS.length];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      });
    });

    // Draw current polyline being drawn
    if (current.length > 0) {
      ctx.strokeStyle = '#87ceeb';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      current.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      // Preview line to cursor
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw points of current polyline
      current.forEach((point) => {
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4da6d6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  };

  // Find nearest point
  const findNearestPoint = (x: number, y: number): { polylineIdx: number; pointIdx: number } | null => {
    let nearest: { polylineIdx: number; pointIdx: number } | null = null;
    let minDist = HOVER_DISTANCE;

    polylines.forEach((line, lineIdx) => {
      line.forEach((point, pointIdx) => {
        const dist = Math.hypot(point.x - x, point.y - y);
        if (dist < minDist) {
          minDist = dist;
          nearest = { polylineIdx: lineIdx, pointIdx };
        }
      });
    });

    // Also check current polyline
    currentPolyline.forEach((point, pointIdx) => {
      const dist = Math.hypot(point.x - x, point.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { polylineIdx: -1, pointIdx };
      }
    });

    return nearest;
  };

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const hovered = findNearestPoint(mousePos.x, mousePos.y);
    const selected = selectedPolylineIndex !== null && selectedPointIndex !== null
      ? { polylineIdx: selectedPolylineIndex, pointIdx: selectedPointIndex }
      : null;

    draw(ctx, canvas.width, canvas.height, polylines, currentPolyline, mousePos, hovered, selected);
    setHoveredPoint(hovered);
  }, [polylines, currentPolyline, mousePos, selectedPolylineIndex, selectedPointIndex]);

  // Mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Mouse click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'begin') {
      setCurrentPolyline([...currentPolyline, { x, y }]);
    } else if (mode === 'delete') {
      const nearest = findNearestPoint(x, y);
      if (nearest) {
        if (nearest.polylineIdx === -1) {
          // Delete from current polyline
          const updated = currentPolyline.filter((_, idx) => idx !== nearest.pointIdx);
          setCurrentPolyline(updated);
        } else {
          // Delete from completed polyline
          const updated = [...polylines];
          updated[nearest.polylineIdx] = updated[nearest.polylineIdx].filter(
            (_, idx) => idx !== nearest.pointIdx
          );
          setPolylines(updated);
        }
      }
    } else if (mode === 'move') {
      if (selectedPolylineIndex === null) {
        // First click: select nearest point
        const nearest = findNearestPoint(x, y);
        if (nearest) {
          setSelectedPolylineIndex(nearest.polylineIdx);
          setSelectedPointIndex(nearest.pointIdx);
        }
      } else {
        // Second click: move the point
        const updated = [...polylines];
        if (selectedPolylineIndex >= 0) {
          updated[selectedPolylineIndex][selectedPointIndex!] = { x, y };
          setPolylines(updated);
        } else {
          const currUpdated = [...currentPolyline];
          currUpdated[selectedPointIndex!] = { x, y };
          setCurrentPolyline(currUpdated);
        }
        setSelectedPolylineIndex(null);
        setSelectedPointIndex(null);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'b') {
        // Begin new polyline
        if (currentPolyline.length > 0) {
          setPolylines([...polylines, currentPolyline]);
        }
        setCurrentPolyline([]);
        setMode('begin');
      } else if (key === 'd') {
        setMode('delete');
      } else if (key === 'm') {
        setMode('move');
        setSelectedPolylineIndex(null);
        setSelectedPointIndex(null);
      } else if (key === 'r') {
        // Refresh/redraw
        draw(canvasRef.current!.getContext('2d')!, canvasRef.current!.width, canvasRef.current!.height, polylines, currentPolyline, mousePos, hoveredPoint, null);
      } else if (key === 'q') {
        // Quit/clear all
        setPolylines([]);
        setCurrentPolyline([]);
        setMode('idle');
        setSelectedPolylineIndex(null);
        setSelectedPointIndex(null);
      } else if (key === 'escape') {
        setMode('idle');
        setSelectedPolylineIndex(null);
        setSelectedPointIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [polylines, currentPolyline, mousePos, hoveredPoint]);

  // Finish current polyline
  const finishPolyline = () => {
    if (currentPolyline.length > 0) {
      setPolylines([...polylines, currentPolyline]);
      setCurrentPolyline([]);
    }
    setMode('idle');
  };

  const totalPoints = polylines.reduce((sum, line) => sum + line.length, 0) + currentPolyline.length;

  return (
    <div ref={containerRef} className="flex h-screen bg-pink-100 text-gray-800">
      {/* Toolbar */}
      <div className="w-56 bg-gradient-to-b from-pink-200 to-pink-100 border-r-4 border-pink-300 flex flex-col p-6 overflow-y-auto shadow-lg">
        <div className="mb-6 bg-white rounded-xl p-4 border-2 border-pink-300">
          <h1 className="text-xl font-bold text-pink-700">POLYLINE</h1>
          <p className="text-xs text-pink-500 font-semibold">EDITOR v1.0</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 flex-1">
          {/* Begin Button */}
          <button
            onClick={() => {
              if (currentPolyline.length > 0) {
                setPolylines([...polylines, currentPolyline]);
                setCurrentPolyline([]);
              }
              setMode('begin');
            }}
            className={`w-full p-3 rounded-xl border-3 transition-all font-['Quicksand'] font-bold ${
              mode === 'begin'
                ? 'bg-green-300 border-green-500 shadow-lg text-green-800'
                : 'bg-green-200 border-green-400 hover:bg-green-300 text-green-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">BEGIN</span>
              <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-green-400">B</span>
            </div>
            <p className="text-xs font-medium">Start a new polyline</p>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setMode('delete')}
            className={`w-full p-3 rounded-xl border-3 transition-all font-['Quicksand'] font-bold ${
              mode === 'delete'
                ? 'bg-red-300 border-red-500 shadow-lg text-red-800'
                : 'bg-red-200 border-red-400 hover:bg-red-300 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">DELETE</span>
              <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-red-400">D</span>
            </div>
            <p className="text-xs font-medium">Delete nearest point</p>
          </button>

          {/* Move Button */}
          <button
            onClick={() => {
              setMode('move');
              setSelectedPolylineIndex(null);
              setSelectedPointIndex(null);
            }}
            className={`w-full p-3 rounded-xl border-3 transition-all font-['Quicksand'] font-bold ${
              mode === 'move'
                ? 'bg-pink-300 border-pink-500 shadow-lg text-pink-800'
                : 'bg-pink-200 border-pink-400 hover:bg-pink-300 text-pink-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">MOVE</span>
              <span className="ml-auto bg-white px-2 py-0.5 rounded text-xs font-bold border border-pink-400">M</span>
            </div>
            <p className="text-xs font-medium">Drag point to new location</p>
          </button>

          {/* Quit Button */}
          <button
            onClick={() => {
              setPolylines([]);
              setCurrentPolyline([]);
              setMode('idle');
              setSelectedPolylineIndex(null);
              setSelectedPointIndex(null);
            }}
            className="w-full p-3 rounded-xl border-3 bg-blue-200 border-blue-400 hover:bg-blue-300 text-blue-800 transition-all font-['Quicksand'] font-bold"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">QUIT</span>
              <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-blue-400">Q</span>
            </div>
            <p className="text-xs font-medium">Exit / Reset canvas</p>
          </button>
        </div>

        {/* Mood Selector */}
        <div className="mt-6 p-3 bg-white rounded-xl border-3 border-pink-300 text-center space-y-2">
          <p className="text-xs font-bold text-pink-700 font-['Quicksand']">MOOD:</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-xl transition-all ${
                  mood === m ? 'scale-125' : 'hover:scale-110'
                }`}
              >
                {m === 1 ? '😞' : m === 2 ? '😐' : m === 3 ? '😊' : m === 4 ? '😄' : '🤩'}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-white rounded-lg border-2 border-pink-300">
          <p className="text-xs text-pink-700 leading-relaxed font-medium">
            <strong>Double-click</strong> or press <kbd className="bg-pink-200 px-1 rounded text-pink-800 font-bold">B</kbd> again to finish polyline.
          </p>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        <canvas
          ref={canvasRef}
          width={canvasDims.width}
          height={canvasDims.height}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onDoubleClick={finishPolyline}
          className="flex-1 cursor-crosshair"
          suppressHydrationWarning
        />

        {/* Floating Glitter Bow Button */}
        <div className="absolute top-6 right-6 relative">
          <button
            onClick={(e) => createGlitterBurst(e.currentTarget.offsetLeft + 20, e.currentTarget.offsetTop + 20)}
            className="text-5xl hover:scale-110 transition-transform cursor-pointer"
          >
            🎀
          </button>
          {glitters.map((g) => (
            <div
              key={g.id}
              className="absolute pointer-events-none animate-pulse"
              style={{
                left: g.x,
                top: g.y,
                fontSize: '12px',
                animation: `burst 0.8s ease-out forwards`,
              }}
            >
              ✨
            </div>
          ))}
        </div>

        <style>{`
          @keyframes burst {
            0% {
              opacity: 1;
              transform: translate(0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(var(--tx, 20px), var(--ty, 20px)) scale(0);
            }
          }
          div[style*="left"] {
            --tx: ${Math.random() * 60 - 30}px;
            --ty: ${Math.random() * 60 - 30}px;
          }
        `}</style>

        {/* Floating Build Ideas Window - Draggable */}
        {showRefWindow && (
          <div
            className="absolute w-64 bg-white rounded-xl border-4 border-yellow-300 shadow-xl overflow-hidden cursor-move"
            style={{
              left: `${windowPos.x}px`,
              top: `${windowPos.y}px`,
            }}
            onMouseDown={(e) => {
              if (e.currentTarget.querySelector('[data-drag-handle]')?.contains(e.target as Node)) {
                setIsDraggingWindow(true);
                setDragOffset({
                  x: e.clientX - windowPos.x,
                  y: e.clientY - windowPos.y,
                });
              }
            }}
          >
            <div
              data-drag-handle
              className="bg-gradient-to-r from-yellow-300 to-orange-200 p-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
              <h3 className="font-bold text-xs text-gray-800 font-['Quicksand']">BUILD IDEAS</h3>
              <button
                onClick={() => setShowRefWindow(false)}
                className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto bg-yellow-50">
              {BUILD_IDEAS.map((idea, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-lg border-2 border-yellow-200 hover:border-yellow-400 cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{idea.icon}</span>
                    <span className="font-bold text-xs text-gray-800 font-['Quicksand']">{idea.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isDraggingWindow && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onMouseMove={(e) => {
              setWindowPos({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
              });
            }}
            onMouseUp={() => setIsDraggingWindow(false)}
            onMouseLeave={() => setIsDraggingWindow(false)}
          />
        )}

        {/* Status Bar */}
        <div className="h-14 bg-gradient-to-r from-pink-300 to-blue-200 border-t-4 border-pink-300 flex items-center px-6 gap-8 shadow-lg font-['Quicksand']">
          <div className="text-sm font-bold">
            <span className="text-gray-600">Mode:</span>
            <span className="ml-2 text-pink-700 uppercase">{mode || 'idle'}</span>
          </div>
          <div className="text-sm font-bold">
            <span className="text-gray-600">Position:</span>
            <span className="ml-2 font-mono text-blue-700">
              {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
            </span>
          </div>
          <div className="text-sm font-bold">
            <span className="text-gray-600">Polylines:</span>
            <span className="ml-2 text-pink-700">{polylines.length}</span>
          </div>
          <div className="text-sm font-bold">
            <span className="text-gray-600">Points:</span>
            <span className="ml-2 text-blue-700">{totalPoints}</span>
          </div>
          <button
            onClick={() => setShowRefWindow(!showRefWindow)}
            className="ml-auto bg-white px-3 py-1 rounded-full text-xs font-bold text-pink-700 border-2 border-pink-400 hover:bg-pink-100"
          >
            {showRefWindow ? '✓' : '?'} Ideas
          </button>
        </div>
      </div>
    </div>
  );
}
