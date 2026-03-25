'use client';

import { useState, useRef, useEffect } from 'react';

// Types
type Point = { x: number; y: number };
type Polyline = Point[];
type Mode = 'idle' | 'begin' | 'delete' | 'move';

// Color palette for polylines
const COLORS = ['#00f0ff', '#00ff00', '#ff6600', '#ff1493', '#9933ff', '#ffff00'];

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

  const POINT_RADIUS = 6;
  const HOVER_DISTANCE = 15;

  // Draw function
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
    // Clear canvas
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
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
      ctx.lineWidth = 2;
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

        ctx.fillStyle = isSelected ? '#ff9900' : isHovered ? '#ffff00' : '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw current polyline being drawn
    if (current.length > 0) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
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
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
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
    <div ref={containerRef} className="flex h-screen bg-gray-950 text-gray-100">
      {/* Toolbar */}
      <div className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">PolyLine Editor</h1>
          <p className="text-xs text-gray-400 mt-1">HCI Lab — CS 555</p>
        </div>

        {/* Buttons */}
        <div className="space-y-4 flex-1">
          {/* Begin Button */}
          <button
            onClick={() => {
              if (currentPolyline.length > 0) {
                setPolylines([...polylines, currentPolyline]);
                setCurrentPolyline([]);
              }
              setMode('begin');
            }}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              mode === 'begin'
                ? 'bg-green-600 border-green-400 shadow-lg shadow-green-500'
                : 'bg-gray-800 border-gray-700 hover:border-green-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🟢</span>
              <span className="font-semibold">Begin</span>
              <span className="ml-auto bg-gray-700 px-2 py-1 rounded text-xs font-mono">B</span>
            </div>
            <p className="text-xs text-gray-300">Start a new polyline</p>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setMode('delete')}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              mode === 'delete'
                ? 'bg-red-600 border-red-400 shadow-lg shadow-red-500'
                : 'bg-gray-800 border-gray-700 hover:border-red-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔴</span>
              <span className="font-semibold">Delete</span>
              <span className="ml-auto bg-gray-700 px-2 py-1 rounded text-xs font-mono">D</span>
            </div>
            <p className="text-xs text-gray-300">Delete nearest point</p>
          </button>

          {/* Move Button */}
          <button
            onClick={() => {
              setMode('move');
              setSelectedPolylineIndex(null);
              setSelectedPointIndex(null);
            }}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              mode === 'move'
                ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500'
                : 'bg-gray-800 border-gray-700 hover:border-blue-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔵</span>
              <span className="font-semibold">Move</span>
              <span className="ml-auto bg-gray-700 px-2 py-1 rounded text-xs font-mono">M</span>
            </div>
            <p className="text-xs text-gray-300">Drag point to new location</p>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              // Trigger redraw
              setPolylines([...polylines]);
            }}
            className="w-full p-4 rounded-lg border-2 bg-gray-800 border-gray-700 hover:border-gray-500 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔄</span>
              <span className="font-semibold">Refresh</span>
              <span className="ml-auto bg-gray-700 px-2 py-1 rounded text-xs font-mono">R</span>
            </div>
            <p className="text-xs text-gray-300">Redraw all polylines</p>
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
            className="w-full p-4 rounded-lg border-2 bg-gray-800 border-gray-600 hover:border-red-500 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⛔</span>
              <span className="font-semibold">Quit</span>
              <span className="ml-auto bg-gray-700 px-2 py-1 rounded text-xs font-mono">Q</span>
            </div>
            <p className="text-xs text-gray-300">Exit / Reset canvas</p>
          </button>
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-700 space-y-3">
          <h3 className="text-xs font-semibold text-gray-300 uppercase">Point States</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <span className="text-gray-400">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-gray-400">Hovered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-gray-400">Selected</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-300">Double-click</strong> or press <kbd className="bg-gray-800 px-1 rounded text-gray-300">B</kbd> again to finish polyline.
          </p>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <canvas
          ref={canvasRef}
          width={typeof window !== 'undefined' ? window.innerWidth - 224 : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight - 60 : 600}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onDoubleClick={finishPolyline}
          className="flex-1 cursor-crosshair bg-gray-950"
        />

        {/* Status Bar */}
        <div className="h-14 bg-gray-900 border-t border-gray-700 flex items-center px-6 gap-8">
          <div className="text-sm">
            <span className="text-gray-400">Mode:</span>
            <span className="ml-2 font-semibold text-cyan-400 uppercase">{mode}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Position:</span>
            <span className="ml-2 font-mono text-cyan-400">
              {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Polylines:</span>
            <span className="ml-2 font-semibold text-cyan-400">{polylines.length}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Points:</span>
            <span className="ml-2 font-semibold text-cyan-400">{totalPoints}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
