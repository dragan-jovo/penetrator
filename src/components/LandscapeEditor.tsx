import React from 'react';
import { StageData, EnemyType, Point } from '../types/game';
import { Play, ArrowLeft, Plus, Trash2, RotateCcw, Download, Upload } from 'lucide-react';

interface LandscapeEditorProps {
  onBack: () => void;
  onTestFly: (customStage: StageData) => void;
}

export const LandscapeEditor: React.FC<LandscapeEditorProps> = ({ onBack, onTestFly }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Editor stage state
  const [stageName, setStageName] = React.useState('CUSTOM CAVERN');
  const [totalLength] = React.useState(6000);
  const [scrollSpeed, setScrollSpeed] = React.useState(210);
  const [selectedTool, setSelectedTool] = React.useState<'floor' | 'ceiling' | EnemyType>('floor');
  const [viewX, setViewX] = React.useState(0);

  // Points
  const [ceiling, setCeiling] = React.useState<Point[]>(() => {
    const pts: Point[] = [];
    for (let x = 0; x <= 6000; x += 150) {
      pts.push({ x, y: 70 + Math.sin(x * 0.005) * 40 });
    }
    return pts;
  });

  const [floor, setFloor] = React.useState<Point[]>(() => {
    const pts: Point[] = [];
    for (let x = 0; x <= 6000; x += 150) {
      pts.push({ x, y: 440 + Math.cos(x * 0.004) * 60 });
    }
    return pts;
  });

  const [enemies, setEnemies] = React.useState<{ type: EnemyType; x: number; y?: number; attachTo?: 'floor' | 'ceiling' }[]>([
    { type: 'radar', x: 600, attachTo: 'floor' },
    { type: 'missile', x: 1000, attachTo: 'floor' },
    { type: 'fuel', x: 1400, attachTo: 'floor' },
    { type: 'interceptor', x: 1800, y: 220 },
    { type: 'turret', x: 2200, attachTo: 'ceiling' },
    { type: 'missile', x: 2600, attachTo: 'floor' },
    { type: 'fuel', x: 3000, attachTo: 'floor' },
    { type: 'reactor', x: 5500, attachTo: 'floor' },
  ]);

  // Handle canvas click to edit terrain or place enemy
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX + viewX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (selectedTool === 'floor') {
      // Find closest floor point and adjust y
      setFloor((prev) =>
        prev.map((pt) => {
          if (Math.abs(pt.x - clickX) < 100) {
            return { ...pt, y: Math.max(160, Math.min(500, clickY)) };
          }
          return pt;
        })
      );
    } else if (selectedTool === 'ceiling') {
      // Find closest ceiling point and adjust y
      setCeiling((prev) =>
        prev.map((pt) => {
          if (Math.abs(pt.x - clickX) < 100) {
            return { ...pt, y: Math.max(20, Math.min(350, clickY)) };
          }
          return pt;
        })
      );
    } else {
      // Place enemy
      const attachTo = selectedTool === 'turret' ? 'ceiling' : selectedTool === 'interceptor' ? undefined : 'floor';
      setEnemies((prev) => [
        ...prev,
        {
          type: selectedTool,
          x: Math.round(clickX),
          y: attachTo ? undefined : Math.round(clickY),
          attachTo,
        },
      ]);
    }
  };

  // Redraw canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#060B12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = -viewX;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Ceiling
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ceiling.forEach((p, idx) => {
      const scrX = p.x + offsetX;
      if (idx === 0) ctx.moveTo(scrX, p.y);
      else ctx.lineTo(scrX, p.y);
    });
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ceiling control points
    ceiling.forEach((p) => {
      const scrX = p.x + offsetX;
      if (scrX >= -20 && scrX <= canvas.width + 20) {
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(scrX - 3, p.y - 3, 6, 6);
      }
    });

    // Floor
    ctx.beginPath();
    floor.forEach((p, idx) => {
      const scrX = p.x + offsetX;
      if (idx === 0) ctx.moveTo(scrX, p.y);
      else ctx.lineTo(scrX, p.y);
    });
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Floor control points
    floor.forEach((p) => {
      const scrX = p.x + offsetX;
      if (scrX >= -20 && scrX <= canvas.width + 20) {
        ctx.fillStyle = '#00FF66';
        ctx.fillRect(scrX - 3, p.y - 3, 6, 6);
      }
    });

    // Enemies
    enemies.forEach((e) => {
      const scrX = e.x + offsetX;
      if (scrX < -30 || scrX > canvas.width + 30) return;

      let drawY = e.y || 300;
      if (e.attachTo === 'floor') {
        const floorPt = floor.find((p) => Math.abs(p.x - e.x) < 80);
        drawY = (floorPt?.y || 440) - 14;
      } else if (e.attachTo === 'ceiling') {
        const ceilPt = ceiling.find((p) => Math.abs(p.x - e.x) < 80);
        drawY = (ceilPt?.y || 70) + 10;
      }

      ctx.fillStyle =
        e.type === 'reactor'
          ? '#FF00E1'
          : e.type === 'fuel'
          ? '#00FF66'
          : e.type === 'missile'
          ? '#FF0033'
          : e.type === 'radar'
          ? '#00E5FF'
          : '#FFAA00';

      ctx.beginPath();
      ctx.arc(scrX, drawY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '8px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(e.type.slice(0, 3).toUpperCase(), scrX, drawY - 12);
    });
  }, [ceiling, floor, enemies, viewX]);

  const handleTestFlight = () => {
    const customStage: StageData = {
      id: 99,
      name: stageName.toUpperCase(),
      subtitle: 'CUSTOM PILOT FLIGHT SECTOR',
      length: totalLength,
      scrollSpeed,
      ceiling,
      floor,
      enemies,
      palette: {
        sky: '#030814',
        mountainFill: '#00261A',
        mountainStroke: '#00FF88',
        radarBg: '#051810',
        accent: '#00FF88',
      },
    };
    onTestFly(customStage);
  };

  const handleClearEnemies = () => {
    setEnemies([]);
  };

  const handleResetTerrain = () => {
    const ptsC: Point[] = [];
    const ptsF: Point[] = [];
    for (let x = 0; x <= totalLength; x += 150) {
      ptsC.push({ x, y: 70 + Math.sin(x * 0.005) * 40 });
      ptsF.push({ x, y: 440 + Math.cos(x * 0.004) * 60 });
    }
    setCeiling(ptsC);
    setFloor(ptsF);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-slate-950 text-white font-mono select-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              MELBOURNE HOUSE LANDSCAPE EDITOR
            </h2>
            <span className="text-[10px] text-slate-400">1982 Philip Mitchell Homage Cavern Sculptor</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestFlight}
            className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Test Fly Cavern
          </button>
        </div>
      </div>

      {/* Editor Main Canvas Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          onClick={handleCanvasClick}
          className="w-full h-full max-h-[520px] object-contain border border-slate-800 rounded bg-slate-950 cursor-crosshair shadow-inner"
        />

        <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700 rounded px-2.5 py-1 text-[10px] text-slate-300 pointer-events-none">
          Click na canvas za prilagoditev točke ali postavitev tarče
        </div>
      </div>

      {/* Viewport Scroller & Tools */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 flex flex-col gap-3">
        {/* Horizontal Navigation Slider */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 text-[10px] uppercase w-20">Sector Pan:</span>
          <input
            type="range"
            min={0}
            max={totalLength - 900}
            step={50}
            value={viewX}
            onChange={(e) => setViewX(Number(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-cyan-400 text-xs tabular-nums w-16 text-right">{viewX}m</span>
        </div>

        {/* Toolbar: Selected tool */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[10px] uppercase mr-1">Orodje:</span>
            <button
              onClick={() => setSelectedTool('floor')}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'floor'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Floor Terrain
            </button>
            <button
              onClick={() => setSelectedTool('ceiling')}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'ceiling'
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Ceiling Terrain
            </button>
            <button
              onClick={() => setSelectedTool('missile')}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'missile'
                  ? 'bg-rose-500 text-white font-bold border-rose-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              + Missile
            </button>
            <button
              onClick={() => setSelectedTool('radar')}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'radar'
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              + Radar
            </button>
            <button
              onClick={() => setSelectedTool('fuel')}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'fuel'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              + Fuel
            </button>
            <button
              onClick={() => setSelectedTool('interceptor')}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'interceptor'
                  ? 'bg-pink-500 text-white font-bold border-pink-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              + Interceptor
            </button>
            <button
              onClick={() => setSelectedTool('turret')}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'turret'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              + Turret
            </button>
            <button
              onClick={() => setSelectedTool('reactor')}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTool === 'reactor'
                  ? 'bg-purple-500 text-white font-bold border-purple-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              + Reactor
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearEnemies}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Počisti sovražnike
            </button>
            <button
              onClick={handleResetTerrain}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Ponastavi jamo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
