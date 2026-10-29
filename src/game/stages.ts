import { StageData, Point } from '../types/game';

/**
 * Creates smooth or jagged terrain contour lines
 */
function generateCavernPoints(
  totalLength: number,
  type: 'open_mountains' | 'medium_cavern' | 'deep_labyrinth' | 'fortress' | 'reactor_bunker',
  step = 110
): { ceiling: Point[]; floor: Point[] } {
  const ceiling: Point[] = [];
  const floor: Point[] = [];

  const numPoints = Math.ceil(totalLength / step) + 4;

  for (let i = 0; i < numPoints; i++) {
    const x = i * step;
    let ceilY = 0;
    let floorY = 540;

    switch (type) {
      case 'open_mountains':
        // Sky is open (ceiling high up)
        ceilY = 30 + Math.sin(i * 0.4) * 15;
        // Floor is undulating mountains
        floorY = 460 + Math.sin(i * 0.35) * 80 + Math.cos(i * 0.7) * 35;
        break;

      case 'medium_cavern':
        // Overhanging cave roof
        ceilY = 80 + Math.sin(i * 0.5) * 45 + Math.cos(i * 0.25) * 30;
        // Floor has canyons and hillocks
        floorY = 440 + Math.sin(i * 0.4) * 75 - Math.sin(i * 0.8) * 35;
        break;

      case 'deep_labyrinth':
        // Stalactites and stalagmites closing in
        ceilY = 120 + Math.sin(i * 0.6) * 65 + (i % 3 === 0 ? 40 : 0);
        floorY = 420 - Math.cos(i * 0.5) * 65 - (i % 4 === 0 ? 45 : 0);
        break;

      case 'fortress':
        // Angular, narrow trenches
        ceilY = 140 + (i % 2 === 0 ? 50 : 10) + Math.sin(i * 0.3) * 30;
        floorY = 400 - (i % 3 === 0 ? 60 : 0) + Math.cos(i * 0.4) * 40;
        break;

      case 'reactor_bunker':
        // Long winding tunnel leading into a bunker chamber
        if (x > totalLength - 1200) {
          // Open bunker hall for reactor
          ceilY = 80;
          floorY = 480;
        } else {
          // Tight claustrophobic access shaft
          ceilY = 150 + Math.sin(i * 0.8) * 45;
          floorY = 390 - Math.cos(i * 0.8) * 45;
        }
        break;
    }

    // Break up the long smooth slopes with irregular cave teeth and ledges.
    const roofTeeth = Math.pow(Math.max(0, Math.sin(i * 0.71 + 0.8)), 4) * 24;
    const floorTeeth = Math.pow(Math.max(0, Math.cos(i * 0.59 + 0.3)), 4) * 20;
    const wallRipple = Math.sin(i * 1.37) * 9 + Math.cos(i * 0.93) * 7;
    ceilY += roofTeeth + wallRipple;
    floorY += wallRipple - floorTeeth;

    // Keep the passage challenging but wide enough for the ship to navigate.
    ceilY = Math.max(20, Math.min(340, ceilY));
    floorY = Math.min(520, Math.max(ceilY + 165, floorY));
    if (floorY - ceilY < 165) {
      floorY = ceilY + 165;
    }

    ceiling.push({ x, y: ceilY });
    floor.push({ x, y: floorY });
  }

  return { ceiling, floor };
}

export const STAGES: StageData[] = [
  {
    id: 1,
    name: 'STAGE 1',
    subtitle: 'RUGGED RIDGE & HIDDEN CAVE CACHE',
    length: 6500,
    scrollSpeed: 190,
    ...generateCavernPoints(6500, 'open_mountains'),
    enemies: [
      { type: 'radar', x: 600, attachTo: 'floor' },
      { type: 'missile', x: 900, attachTo: 'floor' },
      { type: 'fuel', x: 1300, attachTo: 'floor' },
      { type: 'missile', x: 1700, attachTo: 'floor' },
      { type: 'radar', x: 2100, attachTo: 'floor' },
      { type: 'interceptor', x: 2500, y: 180 },
      { type: 'crystal', x: 2350, y: 270 },
      { type: 'fuel', x: 2800, attachTo: 'floor' },
      { type: 'missile', x: 3100, attachTo: 'floor' },
      { type: 'missile', x: 3450, attachTo: 'floor' },
      { type: 'radar', x: 3800, attachTo: 'floor' },
      { type: 'relic', x: 4050, attachTo: 'ceiling' },
      { type: 'interceptor', x: 4200, y: 220 },
      { type: 'interceptor', x: 4350, y: 260 },
      { type: 'fuel', x: 4700, attachTo: 'floor' },
      { type: 'missile', x: 5050, attachTo: 'floor' },
      { type: 'radar', x: 5400, attachTo: 'floor' },
      { type: 'missile', x: 5800, attachTo: 'floor' },
      { type: 'crystal', x: 6100, y: 300 },
    ],
    palette: {
      sky: '#040714',
      mountainFill: '#002B18',
      mountainStroke: '#00FF66',
      radarBg: '#05180F',
      accent: '#00FF66',
    },
  },
  {
    id: 2,
    name: 'STAGE 2',
    subtitle: 'RED CANYON CAVES & TRACKING MISSILES',
    length: 7000,
    scrollSpeed: 210,
    ...generateCavernPoints(7000, 'medium_cavern'),
    enemies: [
      { type: 'missile', x: 650, attachTo: 'floor' },
      { type: 'radar', x: 1000, attachTo: 'floor' },
      { type: 'fuel', x: 1350, attachTo: 'floor' },
      { type: 'crystal', x: 1500, attachTo: 'ceiling' },
      { type: 'interceptor', x: 1650, y: 200 },
      { type: 'missile', x: 1950, attachTo: 'floor' },
      { type: 'turret', x: 2300, attachTo: 'ceiling' },
      { type: 'relic', x: 2500, y: 290 },
      { type: 'radar', x: 2650, attachTo: 'floor' },
      { type: 'fuel', x: 3000, attachTo: 'floor' },
      { type: 'missile', x: 3350, attachTo: 'floor' },
      { type: 'interceptor', x: 3600, y: 240 },
      { type: 'turret', x: 3950, attachTo: 'ceiling' },
      { type: 'missile', x: 4300, attachTo: 'floor' },
      { type: 'crystal', x: 4500, attachTo: 'ceiling' },
      { type: 'fuel', x: 4700, attachTo: 'floor' },
      { type: 'radar', x: 5100, attachTo: 'floor' },
      { type: 'missile', x: 5500, attachTo: 'floor' },
      { type: 'interceptor', x: 5900, y: 210 },
      { type: 'relic', x: 6100, attachTo: 'floor' },
      { type: 'missile', x: 6300, attachTo: 'floor' },
    ],
    palette: {
      sky: '#110404',
      mountainFill: '#2E0A0A',
      mountainStroke: '#FF3333',
      radarBg: '#1A0606',
      accent: '#FF4444',
    },
  },
  {
    id: 3,
    name: 'STAGE 3',
    subtitle: 'DEEP UNDERGROUND LABYRINTH',
    length: 7600,
    scrollSpeed: 230,
    ...generateCavernPoints(7600, 'deep_labyrinth'),
    enemies: [
      { type: 'radar', x: 600, attachTo: 'floor' },
      { type: 'turret', x: 950, attachTo: 'ceiling' },
      { type: 'missile', x: 1250, attachTo: 'floor' },
      { type: 'fuel', x: 1600, attachTo: 'floor' },
      { type: 'relic', x: 1800, attachTo: 'ceiling' },
      { type: 'interceptor', x: 1950, y: 250 },
      { type: 'interceptor', x: 2100, y: 290 },
      { type: 'missile', x: 2450, attachTo: 'floor' },
      { type: 'turret', x: 2800, attachTo: 'ceiling' },
      { type: 'crystal', x: 3000, y: 300 },
      { type: 'radar', x: 3150, attachTo: 'floor' },
      { type: 'fuel', x: 3550, attachTo: 'floor' },
      { type: 'missile', x: 3950, attachTo: 'floor' },
      { type: 'interceptor', x: 4300, y: 270 },
      { type: 'turret', x: 4650, attachTo: 'ceiling' },
      { type: 'fuel', x: 5050, attachTo: 'floor' },
      { type: 'relic', x: 5250, attachTo: 'ceiling' },
      { type: 'missile', x: 5450, attachTo: 'floor' },
      { type: 'radar', x: 5850, attachTo: 'floor' },
      { type: 'interceptor', x: 6200, y: 260 },
      { type: 'missile', x: 6600, attachTo: 'floor' },
      { type: 'crystal', x: 6800, attachTo: 'floor' },
      { type: 'turret', x: 7000, attachTo: 'ceiling' },
    ],
    palette: {
      sky: '#020B14',
      mountainFill: '#041B33',
      mountainStroke: '#00D9FF',
      radarBg: '#021020',
      accent: '#00D9FF',
    },
  },
  {
    id: 4,
    name: 'STAGE 4',
    subtitle: 'FORTRESS DEFENSE PERIMETER',
    length: 8000,
    scrollSpeed: 245,
    ...generateCavernPoints(8000, 'fortress'),
    enemies: [
      { type: 'missile', x: 700, attachTo: 'floor' },
      { type: 'turret', x: 1000, attachTo: 'ceiling' },
      { type: 'radar', x: 1350, attachTo: 'floor' },
      { type: 'fuel', x: 1700, attachTo: 'floor' },
      { type: 'crystal', x: 1850, y: 300 },
      { type: 'interceptor', x: 2050, y: 280 },
      { type: 'interceptor', x: 2200, y: 220 },
      { type: 'missile', x: 2550, attachTo: 'floor' },
      { type: 'turret', x: 2900, attachTo: 'ceiling' },
      { type: 'relic', x: 3100, attachTo: 'floor' },
      { type: 'missile', x: 3250, attachTo: 'floor' },
      { type: 'fuel', x: 3600, attachTo: 'floor' },
      { type: 'radar', x: 4000, attachTo: 'floor' },
      { type: 'turret', x: 4350, attachTo: 'ceiling' },
      { type: 'missile', x: 4700, attachTo: 'floor' },
      { type: 'crystal', x: 4900, attachTo: 'ceiling' },
      { type: 'interceptor', x: 5100, y: 260 },
      { type: 'fuel', x: 5500, attachTo: 'floor' },
      { type: 'missile', x: 5900, attachTo: 'floor' },
      { type: 'turret', x: 6300, attachTo: 'ceiling' },
      { type: 'radar', x: 6700, attachTo: 'floor' },
      { type: 'missile', x: 7100, attachTo: 'floor' },
      { type: 'relic', x: 7300, y: 300 },
      { type: 'interceptor', x: 7500, y: 270 },
    ],
    palette: {
      sky: '#0E0902',
      mountainFill: '#2E1E05',
      mountainStroke: '#FFB703',
      radarBg: '#190E02',
      accent: '#FFB703',
    },
  },
  {
    id: 5,
    name: 'STAGE 5',
    subtitle: 'THE NEUTRON REACTOR CORE',
    length: 8400,
    scrollSpeed: 250,
    ...generateCavernPoints(8400, 'reactor_bunker'),
    enemies: [
      { type: 'missile', x: 700, attachTo: 'floor' },
      { type: 'radar', x: 1100, attachTo: 'floor' },
      { type: 'turret', x: 1450, attachTo: 'ceiling' },
      { type: 'fuel', x: 1800, attachTo: 'floor' },
      { type: 'crystal', x: 2000, attachTo: 'ceiling' },
      { type: 'interceptor', x: 2200, y: 270 },
      { type: 'missile', x: 2600, attachTo: 'floor' },
      { type: 'turret', x: 3000, attachTo: 'ceiling' },
      { type: 'radar', x: 3400, attachTo: 'floor' },
      { type: 'relic', x: 3650, y: 300 },
      { type: 'fuel', x: 3850, attachTo: 'floor' },
      { type: 'interceptor', x: 4250, y: 250 },
      { type: 'missile', x: 4650, attachTo: 'floor' },
      { type: 'turret', x: 5050, attachTo: 'ceiling' },
      { type: 'fuel', x: 5500, attachTo: 'floor' },
      { type: 'crystal', x: 5700, attachTo: 'ceiling' },
      { type: 'missile', x: 5950, attachTo: 'floor' },
      { type: 'radar', x: 6400, attachTo: 'floor' },
      { type: 'turret', x: 6850, attachTo: 'ceiling' },
      { type: 'missile', x: 7250, attachTo: 'floor' },
      { type: 'relic', x: 7500, attachTo: 'floor' },
      // The Ultimate Target: THE REACTOR CORE!
      { type: 'reactor', x: 7850, attachTo: 'floor' },
    ],
    palette: {
      sky: '#140019',
      mountainFill: '#290033',
      mountainStroke: '#FF00E1',
      radarBg: '#190022',
      accent: '#FF00E1',
    },
  },
];

export function getInterpolatedY(points: Point[], worldX: number): number {
  if (points.length === 0) return 300;
  if (worldX <= points[0].x) return points[0].y;
  if (worldX >= points[points.length - 1].x) return points[points.length - 1].y;

  // Binary search or linear search since points are sorted by x
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (worldX >= p1.x && worldX <= p2.x) {
      const ratio = (worldX - p1.x) / (p2.x - p1.x);
      return p1.y + ratio * (p2.y - p1.y);
    }
  }

  return points[points.length - 1].y;
}
