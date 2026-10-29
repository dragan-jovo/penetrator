import React from 'react';

interface TouchControlsProps {
  onTouchChange: (input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    fire: boolean;
    bomb: boolean;
  }) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onTouchChange }) => {
  const [touchState, setTouchState] = React.useState({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    bomb: false,
  });

  const updateState = (partial: Partial<typeof touchState>) => {
    setTouchState((prev) => {
      const next = { ...prev, ...partial };
      onTouchChange(next);
      return next;
    });
  };

  return (
    <div className="absolute inset-x-0 bottom-14 z-20 pointer-events-none flex justify-between items-end p-4 select-none">
      {/* Virtual D-Pad (Left) */}
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1 w-32 h-32 p-1 bg-black/40 border border-white/10 rounded-full backdrop-blur-sm">
        <div />
        <button
          className={`rounded-t-lg bg-slate-800/80 active:bg-cyan-500 active:text-black border border-white/10 text-slate-300 font-bold flex items-center justify-center text-xs ${
            touchState.up ? 'bg-cyan-500 text-black' : ''
          }`}
          onTouchStart={() => updateState({ up: true })}
          onTouchEnd={() => updateState({ up: false })}
          onMouseDown={() => updateState({ up: true })}
          onMouseUp={() => updateState({ up: false })}
        >
          ▲
        </button>
        <div />

        <button
          className={`rounded-l-lg bg-slate-800/80 active:bg-cyan-500 active:text-black border border-white/10 text-slate-300 font-bold flex items-center justify-center text-xs ${
            touchState.left ? 'bg-cyan-500 text-black' : ''
          }`}
          onTouchStart={() => updateState({ left: true })}
          onTouchEnd={() => updateState({ left: false })}
          onMouseDown={() => updateState({ left: true })}
          onMouseUp={() => updateState({ left: false })}
        >
          ◀
        </button>
        <div className="bg-slate-900/60 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-cyan-400/40" />
        </div>
        <button
          className={`rounded-r-lg bg-slate-800/80 active:bg-cyan-500 active:text-black border border-white/10 text-slate-300 font-bold flex items-center justify-center text-xs ${
            touchState.right ? 'bg-cyan-500 text-black' : ''
          }`}
          onTouchStart={() => updateState({ right: true })}
          onTouchEnd={() => updateState({ right: false })}
          onMouseDown={() => updateState({ right: true })}
          onMouseUp={() => updateState({ right: false })}
        >
          ▶
        </button>

        <div />
        <button
          className={`rounded-b-lg bg-slate-800/80 active:bg-cyan-500 active:text-black border border-white/10 text-slate-300 font-bold flex items-center justify-center text-xs ${
            touchState.down ? 'bg-cyan-500 text-black' : ''
          }`}
          onTouchStart={() => updateState({ down: true })}
          onTouchEnd={() => updateState({ down: false })}
          onMouseDown={() => updateState({ down: true })}
          onMouseUp={() => updateState({ down: false })}
        >
          ▼
        </button>
        <div />
      </div>

      {/* Dual Weapon Buttons (Right): LASER & BOMB */}
      <div className="pointer-events-auto flex gap-3 items-center">
        {/* BOMB Button */}
        <button
          className={`w-16 h-16 rounded-full border-2 border-yellow-400 bg-yellow-500/30 text-yellow-300 font-bold font-mono text-[10px] uppercase flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform ${
            touchState.bomb ? 'bg-yellow-400 text-black' : ''
          }`}
          onTouchStart={() => updateState({ bomb: true })}
          onTouchEnd={() => updateState({ bomb: false })}
          onMouseDown={() => updateState({ bomb: true })}
          onMouseUp={() => updateState({ bomb: false })}
        >
          <span>💣</span>
          <span>BOMB</span>
        </button>

        {/* LASER Button */}
        <button
          className={`w-18 h-18 rounded-full border-2 border-cyan-400 bg-cyan-500/30 text-cyan-300 font-bold font-mono text-xs uppercase flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform ${
            touchState.fire ? 'bg-cyan-400 text-black' : ''
          }`}
          onTouchStart={() => updateState({ fire: true })}
          onTouchEnd={() => updateState({ fire: false })}
          onMouseDown={() => updateState({ fire: true })}
          onMouseUp={() => updateState({ fire: false })}
        >
          <span>⚡</span>
          <span>LASER</span>
        </button>
      </div>
    </div>
  );
};
