/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Skin {
  id: string;
  name: string;
  col: string;
  price: number;
  owned: boolean;
  password?: string;
  gradient?: string[];
}

export interface RocketSkin {
  id: string;
  name: string;
  col: string;
  price: number;
  owned: boolean;
  desc: string;
}

export interface Player {
  x: number;
  y: number;
  col: string;
  hp: number;
  maxHp: number;
  moveSpeed: number;
  bulletSpeed: number;
  bulletSize: number;
  shootRate: number;
  shootCd: number;
  damage: number;
  pierce: number;
  extraShots: number;
  ricochet: number;
  chain: number;
  critChance: number;
  critDmg: number;
  pickupRange: number;
  armor: number;
  dodge: number;
  lifesteal: number;
  freeze: number;
  poison: number;
  poisonDmg: number;
  aura: number;
  auraStacks?: number;
  auraDmg?: number;
  drone: number;
  droneCd: number;
  orbital: number;
  orbAngle: number;
  maxShield: number;
  shield: number;
  shieldCd: number;
  regenLv: number;
  regenTimer: number;
  xpGain: number;
  creditGain: number;
  adrenalineTimer: number;
  magnetRange?: number;
  explosionRadius?: number;
  explosionDmg?: number;
  bloodNovaCd?: number;
  phoenixTimer?: number;
  facing: number;
  laserStacks?: number;
  laserCd?: number;
  tags: Set<string>;
  trail: { x: number; y: number }[];
}

export type EnemyType =
  | 'grunt'
  | 'brute'
  | 'splitter'
  | 'dasher'
  | 'shooter'
  | 'charger'
  | 'spinner'
  | 'titan'
  | 'hydra'
  | 'ghost'
  | 'vortex'
  | 'necro';

export interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  r: number;
  spd: number;
  dmg: number;
  score: number;
  col: string;
  xpTier: number;
  creditChance: number;
  frozen: number;
  poison: number;
  poisonTimer: number;
  angle: number;
  
  // Custom Enemy AI types
  hasSplit?: boolean;
  splitDone?: boolean;
  hopTimer?: number;
  dashTimer?: number;
  dashAngle?: number;
  baseDashSpd?: number;
  shootCd?: number;
  chargeTimer?: number;
  chargePhase?: 'wait' | 'wind' | 'charge';
  chargeVx?: number;
  chargeVy?: number;
  spinAngle?: number;
  miniboss?: boolean;
  boss?: boolean;
  frenzy?: boolean;
  frenzyHeadsDone?: boolean;
  alpha?: number;
  phaseTimer?: number;
  summonCd?: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pierce: number;
  dmg: number;
  col: string;
  ricochet: number;
  chain: number;
  homing: boolean;
  explosive: boolean;
  clusterstorm: boolean;
  ionlance: boolean;
  critHit: boolean;
  _dead?: boolean;
  _hit?: Set<Enemy>;
  _cluster?: boolean;
  _chain?: boolean;
  
  // Properties for rendering detailed rocket and smoke trails
  skinId: string; // Active rocket skin
  trail: { x: number; y: number; life: number }[];
  smokeTimer?: number;
  angle?: number;
}

export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  r: number;
  dead?: boolean;
  poison?: boolean;
}

export interface Gem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  val: number;
  type: 'xp' | 'credit';
  r: number;
  col: string;
  dead: boolean;
  spin?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
  r: number;
  angle?: number;
  fade?: boolean;
}

export interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  col: string;
  life: number;
}

export interface ScreenFlash {
  col: string;
  life: number;
}

export interface LaserBeam {
  x: number;
  y: number;
  ang: number;
  life: number;
}

export interface Upgrade {
  id: string;
  name: string;
  rar: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  desc: string;
  descEng?: string;
  synergy?: boolean;
  onceTag?: string;
  requires?: ((p: Player) => boolean)[];
  w: (p: Player) => number;
  apply: (p: Player) => void;
}

export interface RunHistoryItem {
  date: string;
  score: number;
  wave: number;
  level: number;
  credits: number;
  skin: string;
  rocketSkin?: string;
  upgrades: string[];
}

export interface MetaState {
  bankCredits: number;
  selectedSkin: string;
  selectedRocketSkin: string;
  bestWave: number;
  bestScore: number;
  runHistory: RunHistoryItem[];
  unlockedSynergies: string[];
}

export interface GameState {
  state: 'menu' | 'playing' | 'upgrade' | 'pause' | 'stats' | 'leaderboard' | 'hangar' | 'history' | 'codex';
  frame: number;
  score: number;
  wave: number;
  waveFrame: number;
  level: number;
  xp: number;
  xpNext: number;
  runCredits: number;
  rerolls: number;
  lastUpgIds: string[];
  stars: { x: number; y: number; r: number; s: number; a: number }[];
  bullets: Bullet[];
  eBullets: EnemyBullet[];
  enemies: Enemy[];
  gems: Gem[];
  particles: Particle[];
  lightningBolts: LightningBolt[];
  laserBeams?: LaserBeam[];
  screenFlash?: ScreenFlash | null;
  screenShake: number;
  totalDamage: number;
  runStartTime: number;
  player: Player | null;
  spawnCd: number;
  _enrageNotified?: boolean;
  deflectorCd?: number;
  deflectorAngle?: number;
  singularities?: { x: number; y: number; life: number; r: number }[];
}
