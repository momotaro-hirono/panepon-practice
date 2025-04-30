export type PanelType = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export interface Panel {
  type: PanelType;
  x: number;
  y: number;
}

export type PanelOrNull = Panel | null;
export type Grid = PanelOrNull[][];

export interface GameState {
  grid: Grid;
  score: number;
  chain: number;
  maxChain: number;
  gameOver: boolean;
  selectedPanel: { x: number; y: number } | null;
  riseSpeed: number;
  lastRiseTime: number;
  level: number;
}

export interface GameConfig {
  columns: number;
  rows: number;
  panelTypes: PanelType[];
  initialRiseSpeed: number;
  riseSpeedIncrement: number;
  chainDelay: number;
  initialFilledRows: number;
  levelUpScore: number;
  speedUpFactor: number;
}

export const PANEL_IMAGES: Record<PanelType, string> = {
  red: '/images/panels/red.png',
  blue: '/images/panels/blue.png',
  green: '/images/panels/green.png',
  yellow: '/images/panels/yellow.png',
  purple: '/images/panels/purple.png'
}; 