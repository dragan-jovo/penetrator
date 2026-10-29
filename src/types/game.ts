export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY' | 'EDITOR';

export type PaletteMode = 'zx_spectrum' | 'c64' | 'green_phosphor' | 'amber_phosphor';

export interface Point {
  x: number;
  y: number;
}

export interface PlayerShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  shield: number; // 0 - 100
  fuel: number;   // 0 - 100
  invulnerableTime: number; // seconds
}

export interface Laser {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export type EnemyType =
  | 'missile'
  | 'radar'
  | 'fuel'
  | 'interceptor'
  | 'reactor'
  | 'turret'
  | 'crystal'
  | 'relic';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  points: number;
  // Specific state
  active: boolean;
  launched?: boolean;
  launchTimer?: number;
  vy?: number;
  vx?: number;
  angle?: number;
  targetY?: number;
  sineOffset?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface StageData {
  id: number;
  name: string;
  subtitle: string;
  length: number; // total units in world x
  scrollSpeed: number;
  // Terrain segments defined by array of control points
  ceiling: Point[];
  floor: Point[];
  enemies: {
    type: EnemyType;
    x: number;
    y?: number; // if omitted, placed on floor
    attachTo?: 'floor' | 'ceiling';
  }[];
  palette: {
    sky: string;
    mountainFill: string;
    mountainStroke: string;
    radarBg: string;
    accent: string;
  };
}

export interface HighScoreRecord {
  name: string;
  score: number;
  stage: number;
  date: string;
}

export interface GameSettings {
  palette: PaletteMode;
  crtFilter: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  touchControls: boolean;
}
