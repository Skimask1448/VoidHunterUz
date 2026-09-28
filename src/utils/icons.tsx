/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type SheetType = 'weapons' | 'passives' | 'synergies' | 'rockets' | 'ships' | 'bosses' | 'pickups';

export interface IconCoordinate {
  sheet: SheetType;
  col: number; // 0, 1, 2
  row: number; // 0, 1, 2
}

export const SHEET_URLS: Record<SheetType, string> = {
  weapons: '/icons/weapons_grid.png',
  passives: '/icons/passives_grid.png',
  synergies: '/icons/synergies_grid.png',
  rockets: '/icons/rockets_grid.png',
  ships: '/icons/ships_grid.png',
  bosses: '/icons/bosses_grid.png',
  pickups: '/icons/pickups_grid.png',
};

/**
 * Maps any upgrade / perk / passive / synergy ID to its coordinate in the 7 grids
 */
export function getPerkIcon(rawId: string): IconCoordinate {
  const id = rawId.toLowerCase().replace(/_[0-9]+$/, '');

  // 1. ULTIMATE SYNERGIES GRID (synergies_grid.png)
  if (id.startsWith('syn_') || id.includes('synergy')) {
    if (id.includes('garlic') || id.includes('gravity_storm') || id.includes('singularity')) {
      return { sheet: 'synergies', col: 0, row: 0 }; // Crimson black hole singularity
    }
    if (id.includes('bible') || id.includes('vespers') || id.includes('orbit')) {
      return { sheet: 'synergies', col: 1, row: 0 }; // Orbiting dark purple rune satellites
    }
    if (id.includes('water') || id.includes('borra')) {
      return { sheet: 'synergies', col: 2, row: 0 }; // Glowing cyan & deep blue cosmic nebula
    }
    if (id.includes('lightning') || id.includes('thunder') || id.includes('loop')) {
      return { sheet: 'synergies', col: 0, row: 1 }; // Infinite electric plasma loop
    }
    if (id.includes('cross') || id.includes('heaven') || id.includes('sword')) {
      return { sheet: 'synergies', col: 1, row: 1 }; // Radiant celestial golden photon sword
    }
    if (id.includes('scythe') || id.includes('spiral')) {
      return { sheet: 'synergies', col: 2, row: 1 }; // Blood-red entropy scythe vortex
    }
    if (id.includes('dagger') || id.includes('edge')) {
      return { sheet: 'synergies', col: 0, row: 2 }; // Stream of thousand holographic laser needles
    }
    if (id.includes('mana') || id.includes('mannajja')) {
      return { sheet: 'synergies', col: 1, row: 2 }; // Golden divine pulsar pillar beam
    }
    if (id.includes('lancet') || id.includes('corridor')) {
      return { sheet: 'synergies', col: 2, row: 2 }; // Chrono-dial matrix with icy cyan crystals
    }
    if (id.includes('laurel') || id.includes('shroud')) {
      return { sheet: 'synergies', col: 1, row: 0 }; // Violet shield barrier halo
    }
    if (id.includes('clusterstorm')) {
      return { sheet: 'rockets', col: 0, row: 2 }; // Cluster Warhead Missile
    }
    if (id.includes('ionlance')) {
      return { sheet: 'rockets', col: 2, row: 1 }; // Railgun Hyper-Dart
    }
  }

  // 2. ROCKET MUTATIONS GRID (rockets_grid.png)
  if (id.startsWith('rocket_') || id.includes('rail_rockets') || id.includes('cryo_rockets') || id.includes('gravity_rockets') || id.includes('split_rockets')) {
    if (id.includes('rail')) {
      return { sheet: 'rockets', col: 2, row: 1 }; // Railgun Hyper-Dart
    }
    if (id.includes('split') || id.includes('cluster')) {
      return { sheet: 'rockets', col: 0, row: 2 }; // Cluster Warhead Missile
    }
    if (id.includes('cryo')) {
      return { sheet: 'rockets', col: 1, row: 2 }; // Cryo Glacier Torpedo
    }
    if (id.includes('gravity') || id.includes('singularity')) {
      return { sheet: 'rockets', col: 2, row: 2 }; // Singularity Grav-Rocket
    }
    if (id.includes('homing')) {
      return { sheet: 'passives', col: 2, row: 1 }; // Sniper crosshair
    }
    if (id.includes('chain')) {
      return { sheet: 'weapons', col: 0, row: 1 }; // Lightning coil
    }
    if (id.includes('ricochet')) {
      return { sheet: 'weapons', col: 1, row: 1 }; // Ricochet cross
    }
    if (id.includes('plasma_trail')) {
      return { sheet: 'passives', col: 1, row: 0 }; // Plasma thruster trail
    }
    if (id.includes('laser')) {
      return { sheet: 'weapons', col: 0, row: 2 }; // Orbital laser
    }
  }

  // 3. WEAPONS GRID (weapons_grid.png)
  if (id.includes('garlic') || id.includes('grav') || id.includes('singularity')) {
    return { sheet: 'weapons', col: 0, row: 0 };
  }
  if (id.includes('bible') || id.includes('orbit')) {
    return { sheet: 'weapons', col: 1, row: 0 };
  }
  if (id.includes('water') || id.includes('borra') || id.includes('poison') || id.includes('cryotoxin') || id.includes('plasma_pool')) {
    return { sheet: 'weapons', col: 2, row: 0 };
  }
  if (id.includes('lightning') || id.includes('thunder') || id.includes('chain') || id.includes('shock') || id.includes('overload') || id.includes('stormcore')) {
    return { sheet: 'weapons', col: 0, row: 1 };
  }
  if (id.includes('cross') || id.includes('sword') || id.includes('blade') || id.includes('ricochet')) {
    return { sheet: 'weapons', col: 1, row: 1 };
  }
  if (id.includes('scythe') || id.includes('spiral') || id.includes('lance') || id.includes('pierce')) {
    return { sheet: 'weapons', col: 2, row: 1 };
  }
  if (id.includes('dagger') || id.includes('edge') || id.includes('laser') || id.includes('multishot') || id.includes('extrashot')) {
    return { sheet: 'weapons', col: 0, row: 2 };
  }
  if (id.includes('mana') || id.includes('mannajja') || id.includes('pillar') || id.includes('phoenix') || id.includes('nova')) {
    return { sheet: 'weapons', col: 1, row: 2 };
  }
  if (id.includes('lancet') || id.includes('corridor') || id.includes('freeze') || id.includes('cryo')) {
    return { sheet: 'weapons', col: 2, row: 2 };
  }

  // 4. PASSIVES & UPGRADES GRID (passives_grid.png)
  if (id.includes('armor') || id.includes('heart') || id.includes('hp') || id.includes('hull') || id.includes('aegis')) {
    return { sheet: 'passives', col: 0, row: 0 };
  }
  if (id.includes('wing') || id.includes('speed') || id.includes('booster') || id.includes('rapid') || id.includes('plasma_trail')) {
    return { sheet: 'passives', col: 1, row: 0 };
  }
  if (id.includes('spinach') || id.includes('reactor') || id.includes('dmg') || id.includes('damage') || id.includes('berserk') || id.includes('execution')) {
    return { sheet: 'passives', col: 2, row: 0 };
  }
  if (id.includes('regen') || id.includes('nanite') || id.includes('repair') || id.includes('lifesteal') || id.includes('prospector') || id.includes('adrenaline')) {
    return { sheet: 'passives', col: 0, row: 1 };
  }
  if (id.includes('magnet') || id.includes('pickup') || id.includes('xp') || id.includes('credit') || id.includes('economy')) {
    return { sheet: 'passives', col: 1, row: 1 };
  }
  if (id.includes('clover') || id.includes('crit') || id.includes('lens') || id.includes('homing') || id.includes('sniper') || id.includes('dodge')) {
    return { sheet: 'passives', col: 2, row: 1 };
  }
  if (id.includes('laurel') || id.includes('shroud') || id.includes('shield') || id.includes('barrier')) {
    return { sheet: 'passives', col: 0, row: 2 };
  }
  if (id.includes('cooldown') || id.includes('frostnova') || id.includes('haste') || id.includes('cd')) {
    return { sheet: 'passives', col: 1, row: 2 };
  }
  if (id.includes('cluster') || id.includes('duplicator') || id.includes('heavy') || id.includes('split') || id.includes('missile') || id.includes('rocket') || id.includes('explosive') || id.includes('drone')) {
    return { sheet: 'passives', col: 2, row: 2 };
  }

  return { sheet: 'passives', col: 2, row: 2 };
}

/**
 * Maps player ship skin ID to its coordinate in ships_grid.png
 */
export function getShipIcon(skinId: string): IconCoordinate {
  const id = skinId.toLowerCase();
  if (id === 'classic') return { sheet: 'ships', col: 0, row: 0 }; // Azure Core
  if (id === 'crimson') return { sheet: 'ships', col: 1, row: 0 }; // Crimson Fury
  if (id === 'green') return { sheet: 'ships', col: 2, row: 0 };   // Venom Stinger
  if (id === 'gold') return { sheet: 'ships', col: 0, row: 1 };    // Gold Emperor
  if (id === 'purple') return { sheet: 'ships', col: 1, row: 1 };  // Void Phantom
  if (id === 'earth_defender') return { sheet: 'ships', col: 2, row: 1 }; // Earth Defender
  if (id === 'asteroid_miner') return { sheet: 'ships', col: 0, row: 2 }; // Asteroid Miner
  if (id === 'paradise') return { sheet: 'ships', col: 1, row: 2 };       // Paradise Cruiser
  if (id === 'korean') return { sheet: 'ships', col: 2, row: 2 };         // Korean Phoenix
  return { sheet: 'ships', col: 0, row: 0 };
}

/**
 * Maps rocket skin ID to its coordinate in rockets_grid.png
 */
export function getRocketSkinIcon(skinId: string): IconCoordinate {
  const id = skinId.toLowerCase();
  if (id === 'classic') return { sheet: 'rockets', col: 0, row: 0 };
  if (id === 'crimson') return { sheet: 'rockets', col: 1, row: 0 };
  if (id === 'green') return { sheet: 'rockets', col: 2, row: 0 };
  if (id === 'nebula_pulse') return { sheet: 'rockets', col: 0, row: 1 };
  if (id === 'gold') return { sheet: 'rockets', col: 1, row: 1 };
  if (id.includes('rail')) return { sheet: 'rockets', col: 2, row: 1 };
  if (id.includes('cluster') || id.includes('split')) return { sheet: 'rockets', col: 0, row: 2 };
  if (id.includes('cryo')) return { sheet: 'rockets', col: 1, row: 2 };
  if (id.includes('singularity') || id.includes('grav')) return { sheet: 'rockets', col: 2, row: 2 };
  return { sheet: 'rockets', col: 0, row: 0 };
}

/**
 * Maps sector or boss ID to its coordinate in bosses_grid.png
 */
export function getBossIcon(sectorId: string): IconCoordinate {
  const id = sectorId.toLowerCase();
  if (id.includes('earth')) return { sheet: 'bosses', col: 0, row: 0 }; // Earth Sector Flagship
  if (id.includes('omega')) return { sheet: 'bosses', col: 1, row: 0 }; // Omega Nebula Flagship
  if (id.includes('ceres')) return { sheet: 'bosses', col: 2, row: 0 }; // Ceres Asteroid Juggernaut
  if (id.includes('singularity') || id.includes('horizon')) return { sheet: 'bosses', col: 0, row: 1 }; // Event Horizon Flagship
  if (id.includes('drone') || id.includes('carrier')) return { sheet: 'bosses', col: 1, row: 1 };
  if (id.includes('interceptor') || id.includes('stealth')) return { sheet: 'bosses', col: 2, row: 1 };
  if (id.includes('destroyer') || id.includes('gunship')) return { sheet: 'bosses', col: 0, row: 2 };
  if (id.includes('sentinel')) return { sheet: 'bosses', col: 1, row: 2 };
  return { sheet: 'bosses', col: 2, row: 2 }; // Colossal Star-Eater Core
}

/**
 * Maps pickup item or gem type to its coordinate in pickups_grid.png
 */
export function getPickupIcon(type: string): IconCoordinate {
  const id = type.toLowerCase();
  if (id.includes('blue') || id === 'gem_1' || id === 'gem') return { sheet: 'pickups', col: 0, row: 0 };
  if (id.includes('green') || id === 'gem_2') return { sheet: 'pickups', col: 1, row: 0 };
  if (id.includes('purple') || id === 'gem_3') return { sheet: 'pickups', col: 2, row: 0 };
  if (id.includes('credit') || id.includes('gold')) return { sheet: 'pickups', col: 0, row: 1 };
  if (id.includes('chest') || id.includes('crate')) return { sheet: 'pickups', col: 1, row: 1 };
  if (id.includes('nuke') || id.includes('bomb')) return { sheet: 'pickups', col: 2, row: 1 };
  if (id.includes('heal') || id.includes('repair') || id.includes('hp')) return { sheet: 'pickups', col: 0, row: 2 };
  if (id.includes('magnet')) return { sheet: 'pickups', col: 1, row: 2 };
  if (id.includes('freeze') || id.includes('time')) return { sheet: 'pickups', col: 2, row: 2 };
  return { sheet: 'pickups', col: 0, row: 0 };
}

// -------------------------------------------------------------
// React Components with Hardware Accelerated CSS Sprites
// -------------------------------------------------------------

export interface GridSpriteProps {
  coord: IconCoordinate;
  size?: number;
  className?: string;
  title?: string;
}

export const GridSprite: React.FC<GridSpriteProps> = ({ coord, size = 48, className = '', title }) => {
  const sheetUrl = SHEET_URLS[coord.sheet];

  return (
    <div
      title={title}
      className={`inline-block overflow-hidden relative flex-shrink-0 bg-zinc-950 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${sheetUrl})`,
        backgroundSize: '300% 300%',
        backgroundPosition: `${coord.col * 50}% ${coord.row * 50}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
};

export interface PerkIconProps {
  id: string;
  size?: number;
  className?: string;
  title?: string;
}

export const PerkIcon: React.FC<PerkIconProps> = ({ id, size = 48, className = '', title }) => {
  const icon = getPerkIcon(id);
  return <GridSprite coord={icon} size={size} className={className} title={title} />;
};

export interface ShipIconProps {
  skinId: string;
  size?: number;
  className?: string;
  title?: string;
}

export const ShipIcon: React.FC<ShipIconProps> = ({ skinId, size = 48, className = '', title }) => {
  const icon = getShipIcon(skinId);
  return <GridSprite coord={icon} size={size} className={className} title={title} />;
};

export interface RocketIconProps {
  skinId: string;
  size?: number;
  className?: string;
  title?: string;
}

export const RocketIcon: React.FC<RocketIconProps> = ({ skinId, size = 48, className = '', title }) => {
  const icon = getRocketSkinIcon(skinId);
  return <GridSprite coord={icon} size={size} className={className} title={title} />;
};

export interface BossIconProps {
  sectorId: string;
  size?: number;
  className?: string;
  title?: string;
}

export const BossIcon: React.FC<BossIconProps> = ({ sectorId, size = 48, className = '', title }) => {
  const icon = getBossIcon(sectorId);
  return <GridSprite coord={icon} size={size} className={className} title={title} />;
};

export interface PickupIconProps {
  type: string;
  size?: number;
  className?: string;
  title?: string;
}

export const PickupIcon: React.FC<PickupIconProps> = ({ type, size = 48, className = '', title }) => {
  const icon = getPickupIcon(type);
  return <GridSprite coord={icon} size={size} className={className} title={title} />;
};
