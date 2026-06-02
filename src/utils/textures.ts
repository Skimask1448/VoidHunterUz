/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, Bullet, Player } from '../types';

// Helper to draw clean grid/rivet patterns on hulls
function drawSciFiPanel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  lineColor: string
) {
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.35;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  
  // Rivets in corners
  ctx.fillStyle = lineColor;
  ctx.globalAlpha = 0.6;
  const offX = w / 2 - 2;
  const offY = h / 2 - 2;
  ctx.fillRect(cx - offX - 1, cy - offY - 1, 1.5, 1.5);
  ctx.fillRect(cx + offX, cy - offY - 1, 1.5, 1.5);
  ctx.fillRect(cx - offX - 1, cy + offY, 1.5, 1.5);
  ctx.fillRect(cx + offX, cy + offY, 1.5, 1.5);
  ctx.restore();
}

// Draw rotating sci-fi rings for bosses & shooters
function drawGlowingOrbits(
  ctx: CanvasRenderingContext2D,
  r: number,
  angle: number,
  color: string,
  count = 3
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.4;
  
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.6 + i * 0.2), angle * (1 + i * 0.25), angle * (1 + i * 0.25) + Math.PI * 1.25);
    ctx.lineWidth = 1.8 - i * 0.4;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Procedural Space Rocket Textures
 */
export function drawProceduralRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  skinId: string,
  frame: number,
  critHit = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2); // default vertical pointing up

  // Rocket Size scale helper
  const scale = r / 4;

  let bodyCol = '#2ed8ff';
  let finCol = '#1e3a8a';
  let noseCol = '#e0f2fe';
  let fireCol = '#38bdf8';
  let specCol = '#ffffff';

  switch (skinId) {
    case 'crimson':
      bodyCol = '#1a0505';
      finCol = '#ff2a4b';
      noseCol = '#f43f5e';
      fireCol = '#fb7185';
      specCol = '#ffe4e6';
      break;
    case 'green':
      bodyCol = '#022c22';
      finCol = '#10b981';
      noseCol = '#34d399';
      fireCol = '#4ade80';
      specCol = '#f0fdf4';
      break;
    case 'gold':
      bodyCol = '#f59e0b';
      finCol = '#78350f';
      noseCol = '#fbbf24';
      fireCol = '#fef3c7';
      specCol = '#ffffff';
      break;
    case 'purple':
      bodyCol = '#4c1d95';
      finCol = '#a78bfa';
      noseCol = '#8b5cf6';
      fireCol = '#c084fc';
      specCol = '#f3e8ff';
      break;
    case 'paradise':
      bodyCol = '#f8fafc';
      finCol = '#0ea5e9';
      noseCol = '#38bdf8';
      fireCol = '#7dd3fc';
      specCol = '#ffffff';
      break;
    case 'korean':
      bodyCol = '#ff3b5c';
      finCol = '#0066ff';
      noseCol = '#ffffff';
      fireCol = '#ea580c';
      specCol = '#ffecd2';
      break;
    case 'classic':
    default:
      bodyCol = '#1e293b';
      finCol = '#0284c7';
      noseCol = '#38bdf8';
      fireCol = '#a5f3fc';
      specCol = '#ffffff';
      break;
  }

  // Draw rocket fire plume (flickering flame)
  const flameLength = (16 + Math.sin(frame * 0.4) * 6) * scale;
  const flameWidth = 5 * scale;
  ctx.save();
  ctx.shadowColor = fireCol;
  ctx.shadowBlur = critHit ? 22 : 12;
  const grad = ctx.createLinearGradient(0, 4 * scale, 0, (4 + flameLength) * scale);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, fireCol);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-flameWidth, 4 * scale);
  ctx.quadraticCurveTo(0, (4 + flameLength) * scale, flameWidth, 4 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Highlight/Critical aura
  if (critHit) {
    ctx.save();
    ctx.strokeStyle = '#f0abfc';
    ctx.lineWidth = 2 * scale;
    ctx.shadowColor = '#f0abfc';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, -2 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Fins (Tail Stabilizers)
  ctx.fillStyle = finCol;
  ctx.beginPath();
  ctx.moveTo(-2 * scale, 2 * scale);
  ctx.lineTo(-7 * scale, 6 * scale);
  ctx.lineTo(-6 * scale, -2 * scale);
  ctx.lineTo(-2 * scale, -4 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(2 * scale, 2 * scale);
  ctx.lineTo(7 * scale, 6 * scale);
  ctx.lineTo(6 * scale, -2 * scale);
  ctx.lineTo(2 * scale, -4 * scale);
  ctx.closePath();
  ctx.fill();

  // Central rocket fuselage body
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.moveTo(-2.5 * scale, 4 * scale);
  ctx.lineTo(-2.5 * scale, -10 * scale);
  ctx.quadraticCurveTo(0, -12 * scale, 2.5 * scale, -10 * scale);
  ctx.lineTo(2.5 * scale, 4 * scale);
  ctx.closePath();
  ctx.fill();

  // Nose Cone (Warhead tip)
  ctx.fillStyle = noseCol;
  ctx.beginPath();
  ctx.moveTo(-2.5 * scale, -10 * scale);
  ctx.quadraticCurveTo(0, -18 * scale, 0, -23 * scale);
  ctx.quadraticCurveTo(0, -18 * scale, 2.5 * scale, -10 * scale);
  ctx.closePath();
  ctx.fill();

  // Hull highlights & metallic shine
  ctx.fillStyle = specCol;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(-1 * scale, -9 * scale);
  ctx.lineTo(-1 * scale, 3 * scale);
  ctx.lineTo(-1.8 * scale, 3 * scale);
  ctx.lineTo(-1.8 * scale, -9 * scale);
  ctx.closePath();
  ctx.fill();

  // Panel lines / belt
  ctx.strokeStyle = finCol;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(-2.5 * scale, -3 * scale);
  ctx.lineTo(2.5 * scale, -3 * scale);
  ctx.stroke();

  // Small windows/sensors on rocket body
  ctx.fillStyle = fireCol;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(0, -6 * scale, 0.8 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Procedural Space Enemies Textures
 */
export function drawProceduralEnemy(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  frame: number
) {
  const frozen = e.frozen > 0;
  const col = frozen ? '#86efac' : e.col;
  const isFrenzy = e.frenzy;
  
  // Custom pulsing glows
  const glowMult = 0.75 + Math.sin(frame * 0.15 + e.x * 0.01) * 0.25;

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);

  // Apply icy shading to frozen enemies
  if (frozen) {
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12 * glowMult;
  } else {
    ctx.shadowColor = col;
    ctx.shadowBlur = (e.boss ? 24 : e.miniboss ? 16 : 8) * glowMult;
  }

  switch (e.type) {
    case 'grunt': {
      // Procedural Cybernetic Spider Drone
      ctx.fillStyle = col;
      
      // Articulated metallic legs
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const legAng = (i * Math.PI) / 2 + Math.sin(frame * 0.18 + i) * 0.25;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(legAng) * e.r * 1.35, Math.sin(legAng) * e.r * 1.35);
        ctx.lineTo(Math.cos(legAng + 0.3) * e.r * 1.6, Math.sin(legAng + 0.3) * e.r * 1.6);
        ctx.stroke();
      }

      // Main core chassis
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cybernetic main visors (lenses)
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(-e.r * 0.3, -e.r * 0.2, e.r * 0.25, 0, Math.PI * 2);
      ctx.arc(e.r * 0.3, -e.r * 0.2, e.r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Small fangs/claws
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.2, e.r * 0.6);
      ctx.lineTo(-e.r * 0.3, e.r * 0.95);
      ctx.lineTo(0, e.r * 0.7);
      ctx.lineTo(e.r * 0.3, e.r * 0.95);
      ctx.lineTo(e.r * 0.2, e.r * 0.6);
      ctx.fill();
      break;
    }

    case 'brute': {
      // Heavy Armored dreadnought
      // Layered heavy circular armor plating
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Outer armored shield shields
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, e.r, Math.PI + 0.2, -0.2);
      ctx.stroke();

      // Diagonal sci-fi hazard warning lines
      ctx.save();
      ctx.rotate(0.4);
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.65, -e.r * 0.15);
      ctx.lineTo(e.r * 0.65, -e.r * 0.15);
      ctx.moveTo(-e.r * 0.65, e.r * 0.25);
      ctx.lineTo(e.r * 0.65, e.r * 0.25);
      ctx.stroke();
      ctx.restore();

      // Segmented plate locks
      ctx.fillStyle = '#475569';
      ctx.fillRect(-5, -e.r * 1.12, 10, 4);
      ctx.fillRect(-5, e.r * 1.05, 10, 4);

      // Glowing engine core
      const flg = 0.8 + Math.sin(frame * 0.3) * 0.2;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.45 * flg, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(-e.r * 0.1, -e.r * 0.1, e.r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'splitter': {
      // Bio-Organic trans-dimensional cell pods
      // Pulsing cellular membrane
      const cellWave = 1 + Math.sin(frame * 0.12) * 0.08;
      ctx.save();
      ctx.scale(cellWave, cellWave);

      const memGrad = ctx.createRadialGradient(0, 0, e.r * 0.2, 0, 0, e.r * 1.2);
      memGrad.addColorStop(0, 'rgba(15,23,42,0.9)');
      memGrad.addColorStop(0.5, 'rgba(8,145,178,0.3)');
      memGrad.addColorStop(1, col);

      ctx.fillStyle = memGrad;
      ctx.beginPath();
      
      // Morphing morph blob
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const wave = Math.sin(frame * 0.08 + i) * 2.5;
        const x = Math.cos(a) * (e.r + wave);
        const y = Math.sin(a) * (e.r + wave);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Double nucleuses (Cell cores)
      const nucleusDist = e.r * 0.35 + Math.sin(frame * 0.05) * 2;
      ctx.fillStyle = frozen ? '#67e8f9' : '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-nucleusDist, 0, e.r * 0.32, 0, Math.PI * 2);
      ctx.arc(nucleusDist, 0, e.r * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();
      break;
    }

    case 'dasher': {
      // Aerodynamic Razor Hunter starfighter
      ctx.fillStyle = '#0f172a';
      
      // Twin thrust streams
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.8;
      const thrusterFlg = (1 + Math.sin(frame * 0.4)) * 3;
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.4, e.r * 0.3);
      ctx.lineTo(0, e.r * 1.25 + thrusterFlg);
      ctx.lineTo(e.r * 0.4, e.r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Body hull shape (Triangle-rhombus starfighter)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.6);  // Pointer nose
      ctx.lineTo(e.r * 1.1, e.r * 0.45); // Left sweep wing
      ctx.lineTo(e.r * 0.5, e.r * 0.25);
      ctx.lineTo(0, e.r * 0.65); // Rear
      ctx.lineTo(-e.r * 0.5, e.r * 0.25);
      ctx.lineTo(-e.r * 1.1, e.r * 0.45); // Right sweep wing
      ctx.closePath();
      ctx.fill();

      // Metallic wing decals
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.5, e.r * 0.1);
      ctx.lineTo(0, -e.r * 1.1);
      ctx.lineTo(e.r * 0.5, e.r * 0.1);
      ctx.stroke();

      // Cockpit visor
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, -e.r * 0.45, e.r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'shooter': {
      // Rotating laser platform
      ctx.save();
      // Orbiting external battery nodes
      drawGlowingOrbits(ctx, e.r, e.angle * 1.4, col, 2);

      // Central core reactor
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Shooter vents (cross layout)
      ctx.fillStyle = col;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2 + e.angle * 0.5);
        ctx.fillRect(-e.r * 0.16, -e.r * 1.1, e.r * 0.32, e.r * 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-e.r * 0.08, -e.r * 1.08, e.r * 0.16, 4);
        ctx.restore();
      }

      // Energy sphere center
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.36 + Math.sin(frame * 0.2) * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      break;
    }

    case 'charger': {
      // Cylinder Cybernetic rhino mini-boss
      ctx.fillStyle = '#334155';
      const windPulse = e.chargePhase === 'wind' ? (1 + Math.sin(frame * 0.4) * 0.2) : 1;
      
      // Exhaust pipes
      ctx.fillStyle = col;
      ctx.fillRect(-e.r * 0.7, e.r * 0.1, 8, e.r * 0.6);
      ctx.fillRect(e.r * 0.55, e.r * 0.1, 8, e.r * 0.6);

      // Horn (Ram shield)
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10 * windPulse;
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.8 * windPulse);
      ctx.lineTo(e.r * 0.55, -e.r * 0.9);
      ctx.lineTo(-e.r * 0.55, -e.r * 0.9);
      ctx.closePath();
      ctx.fill();

      // Core heavy plate
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();

      // Heavy metal plates drawing
      drawSciFiPanel(ctx, 0, 0, e.r * 1.3, e.r * 1.1, col);

      // Industrial warning decaling
      ctx.fillStyle = col;
      ctx.fillRect(-e.r * 0.35, -e.r * 0.2, 5, e.r * 0.4);
      ctx.fillRect(e.r * 0.25, -e.r * 0.2, 5, e.r * 0.4);

      // Red reactor eye slot
      ctx.fillStyle = '#ff2a4b';
      ctx.fillRect(-e.r * 0.4, -e.r * 0.65, e.r * 0.8, 5);
      break;
    }

    case 'spinner': {
      // Rotating buzz-saw disk mini-boss
      ctx.save();
      const spinS = frame * (isFrenzy ? 0.32 : 0.18);
      ctx.rotate(spinS);

      // Metallic jagged outer saw blades block
      ctx.fillStyle = col;
      const bladeCount = 10;
      for (let i = 0; i < bladeCount; i++) {
        const a = (i * Math.PI * 2) / bladeCount;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(e.r * 0.8, -e.r * 0.15);
        ctx.lineTo(e.r * 1.42, 0);
        ctx.lineTo(e.r * 0.9, e.r * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Main circular disc
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Generator details inside
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // Spinning inner safety nuclear cores
      ctx.rotate(-spinS * 2);
      ctx.fillStyle = col;
      for (let i = 0; i < 4; i++) {
        const sa = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * e.r * 0.46, Math.sin(sa) * e.r * 0.46, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      break;
    }

    case 'titan': {
      // Colossal flagship fortress Boss
      // Wing support struts
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-e.r * 1.3, -e.r * 0.3, e.r * 2.6, e.r * 0.6);

      // Heavy modular hull segment
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();

      // Double weapon thruster engines at back
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.8;
      const pulseT = 1.25 + Math.sin(frame * 0.3) * 0.25;
      ctx.fillRect(-e.r * 0.6, e.r * 0.82, e.r * 0.3, e.r * 0.4 * pulseT);
      ctx.fillRect(e.r * 0.3, e.r * 0.82, e.r * 0.3, e.r * 0.4 * pulseT);
      ctx.globalAlpha = 1.0;

      // Heavy metal plates
      drawSciFiPanel(ctx, 0, 0, e.r * 1.4, e.r * 1.3, col);

      // Left modular battery claw armored shield
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-e.r * 1.2, -e.r * 0.9);
      ctx.quadraticCurveTo(-e.r * 1.45, 0, -e.r * 1.1, e.r * 0.9);
      ctx.lineTo(-e.r * 0.8, e.r * 0.7);
      ctx.lineTo(-e.r * 0.95, 0);
      ctx.lineTo(-e.r * 0.8, -e.r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.stroke();

      // Right modular battery claw armored shield
      ctx.beginPath();
      ctx.moveTo(e.r * 1.2, -e.r * 0.9);
      ctx.quadraticCurveTo(e.r * 1.45, 0, e.r * 1.1, e.r * 0.9);
      ctx.lineTo(e.r * 0.8, e.r * 0.7);
      ctx.lineTo(e.r * 0.95, 0);
      ctx.lineTo(e.r * 0.8, -e.r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Front heavy ram spearhead
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.5);
      ctx.lineTo(e.r * 0.45, -e.r * 0.8);
      ctx.lineTo(-e.r * 0.45, -e.r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Main heavy commander glowing deck bridges
      ctx.fillStyle = col;
      ctx.fillRect(-e.r * 0.35, -e.r * 0.4, e.r * 0.7, e.r * 0.15);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(-e.r * 0.25, -e.r * 0.38, e.r * 0.5, 4);
      break;
    }

    case 'hydra': {
      // Organo-biological Multiheaded flagship Boss
      // Flesh-like soft body (drawn using overlay blobs)
      ctx.save();
      const organicWave = 1 + Math.sin(frame * 0.08) * 0.04;
      ctx.scale(organicWave, organicWave);

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Bio pulsing chambers
      const chambers = 6;
      for (let i = 0; i < chambers; i++) {
        const a = (i * Math.PI * 2) / chambers + frame * 0.015;
        const glowRad = e.r * 0.35 + Math.sin(frame * 0.12 + i) * 3;
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.35 + Math.sin(frame * 0.05 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * e.r * 0.55, Math.sin(a) * e.r * 0.55, glowRad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Primary skin structure
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.9, 0, Math.PI * 2);
      ctx.stroke();

      // Draw multi-appendages / tentacles representing snake necks
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        const neckAng = (i * Math.PI * 2) / 3 - Math.PI / 2 + Math.sin(frame * 0.04 + i * 2) * 0.35;
        const x1 = Math.cos(neckAng) * e.r * 0.7;
        const y1 = Math.sin(neckAng) * e.r * 0.7;
        const neckLength = e.r * 0.8 + Math.cos(frame * 0.08 + i) * 8;
        const x2 = Math.cos(neckAng) * (e.r * 0.7 + neckLength);
        const y2 = Math.sin(neckAng) * (e.r * 0.7 + neckLength);

        // Neck tube
        ctx.strokeStyle = '#065f46';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 * 1.3, y1 * 1.3, x2 * 0.8, y2 * 0.8, x2, y2);
        ctx.stroke();

        // Glowing snake head module
        ctx.save();
        ctx.translate(x2, y2);
        ctx.rotate(neckAng);
        
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Beady hot glowing eyes
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(3, -3, 2, 0, Math.PI * 2);
        ctx.arc(3, 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      break;
    }

    case 'ghost': {
      // Ghost phantom Boss
      // Translucent fading sails & spectral waves
      ctx.save();
      
      const ghostAlpha = (e.alpha || 1) * (0.65 + Math.sin(frame * 0.2) * 0.15);
      ctx.globalAlpha = ghostAlpha;

      const auraG = ctx.createRadialGradient(0, 0, e.r * 0.1, 0, 0, e.r * 1.4);
      auraG.addColorStop(0, 'rgba(139,92,246,0.8)');
      auraG.addColorStop(0.5, 'rgba(6,182,212,0.3)');
      auraG.addColorStop(1, 'transparent');
      ctx.fillStyle = auraG;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Main core phantom frame
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.2);
      
      // Left wispy wing
      ctx.bezierCurveTo(-e.r * 1.1, -e.r * 0.9, -e.r * 1.5, e.r * 0.1, -e.r * 0.5, e.r * 0.95);
      ctx.quadraticCurveTo(0, e.r * 0.55, e.r * 0.5, e.r * 0.95);
      // Right wispy wing
      ctx.bezierCurveTo(e.r * 1.1, e.r * 0.1, e.r * 1.5, -e.r * 0.9, 0, -e.r * 1.2);
      ctx.closePath();
      ctx.fill();

      // Chrome holographic lines
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.5, -e.r * 0.5);
      ctx.lineTo(0, e.r * 0.32);
      ctx.lineTo(e.r * 0.5, -e.r * 0.5);
      ctx.stroke();

      // Glowing spectral scan mask visor
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 15;
      ctx.fillRect(-e.r * 0.3, -e.r * 0.85, e.r * 0.6, 6);

      ctx.restore();
      break;
    }

    case 'vortex': {
      // Swirling spatial gravitational vortex cosmic singularity Boss
      ctx.save();
      const spin = frame * 0.08;
      ctx.rotate(spin);

      // Rotating celestial starlight dust layers
      const spaceGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, e.r * 1.55);
      spaceGrad.addColorStop(0, '#ffffff');
      spaceGrad.addColorStop(0.2, '#c084fc');
      spaceGrad.addColorStop(0.55, 'rgba(112, 26, 117, 0.45)');
      spaceGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = spaceGrad;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // Swirling black hole gravitational spiral arms
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 15;
      
      const spiralArms = 4;
      for (let arm = 0; arm < spiralArms; arm++) {
        ctx.save();
        ctx.rotate((arm * Math.PI * 2) / spiralArms);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let j = 0; j < 30; j++) {
          const theta = j * 0.11;
          const rad = e.r * 0.04 * j;
          const sx = Math.cos(theta) * rad;
          const sy = Math.sin(theta) * rad;
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Gravitational lensing outer safety ring
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 1.25, 0, Math.PI * 2);
      ctx.stroke();

      // Deep dark cosmic void center (The singularity)
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.48, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      break;
    }

    case 'necro': {
      // Obsidian Cyber-runic necro relic Boss
      ctx.save();
      // Floating runic glyph indicators around Boss
      const glyphCount = 5;
      for (let i = 0; i < glyphCount; i++) {
        const glyphAngle = (i * Math.PI * 2) / glyphCount + frame * 0.02;
        const gx = Math.cos(glyphAngle) * e.r * 1.34;
        const gy = Math.sin(glyphAngle) * e.r * 1.34;
        ctx.fillStyle = col;
        ctx.fillRect(gx - 4, gy - 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx - 2, gy - 2, 4, 4);
      }

      // Obsidian crystal main chassis (Pentagram Relic Star)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const starA = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const innerA = ((i * 2 + 1) * Math.PI) / 5 - Math.PI / 2;
        // Outer spikes
        ctx.lineTo(Math.cos(starA) * e.r * 1.24, Math.sin(starA) * e.r * 1.24);
        // Inner valleys
        ctx.lineTo(Math.cos(innerA) * e.r * 0.65, Math.sin(innerA) * e.r * 0.65);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Royal laser core markings
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Micro laser vents
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

/**
 * Procedural Space Player Ship Textures
 */
export function drawProceduralPlayer(
  ctx: CanvasRenderingContext2D,
  p: Player,
  frame: number
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.facing);

  ctx.shadowColor = p.col;
  ctx.shadowBlur = 15;

  const width = 12;
  const height = 18;

  // Active glowing engine thrusters
  const thrusterSize = (14 + Math.sin(frame * 0.45) * 5);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 20;

  // Left thruster plume
  const engineGradL = ctx.createLinearGradient(-4, height - 4, -4, height + thrusterSize);
  engineGradL.addColorStop(0, '#ffffff');
  engineGradL.addColorStop(0.3, p.col);
  engineGradL.addColorStop(1, 'transparent');
  ctx.fillStyle = engineGradL;
  ctx.beginPath();
  ctx.moveTo(-6, height - 4);
  ctx.lineTo(-2, height - 4);
  ctx.lineTo(-4, height + thrusterSize);
  ctx.closePath();
  ctx.fill();

  // Right thruster plume
  const engineGradR = ctx.createLinearGradient(4, height - 4, 4, height + thrusterSize);
  engineGradR.addColorStop(0, '#ffffff');
  engineGradR.addColorStop(0.3, p.col);
  engineGradR.addColorStop(1, 'transparent');
  ctx.fillStyle = engineGradR;
  ctx.beginPath();
  ctx.moveTo(2, height - 4);
  ctx.lineTo(6, height - 4);
  ctx.lineTo(4, height + thrusterSize);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Ship Outer Wings Frame (swept-wing starfighter)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, -height);
  ctx.lineTo(-width * 1.5, height * 0.7);
  ctx.lineTo(-width * 0.6, height * 0.4);
  ctx.lineTo(0, height * 0.7);
  ctx.lineTo(width * 0.6, height * 0.4);
  ctx.lineTo(width * 1.5, height * 0.7);
  ctx.closePath();
  ctx.fill();

  // Detailed Outer Wing panels (Primary hull color)
  ctx.fillStyle = p.col;
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.85);
  ctx.lineTo(-width * 1.35, height * 0.6);
  ctx.lineTo(-width * 0.5, height * 0.35);
  ctx.lineTo(0, height * 0.5);
  ctx.lineTo(width * 0.5, height * 0.35);
  ctx.lineTo(width * 1.35, height * 0.6);
  ctx.closePath();
  ctx.fill();

  // Internal metal deck reinforcements
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.5);
  ctx.lineTo(-width * 0.6, height * 0.3);
  ctx.lineTo(0, height * 0.15);
  ctx.lineTo(width * 0.6, height * 0.3);
  ctx.closePath();
  ctx.fill();

  // Kinetic panel grid decoration
  ctx.strokeStyle = '#f8fafc';
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.5);
  ctx.lineTo(0, height * 0.55);
  ctx.stroke();

  // Pilot cockpit canopy glass dome
  ctx.globalAlpha = 1.0;
  const glassGrad = ctx.createLinearGradient(0, -height * 0.4, 0, height * 0.1);
  glassGrad.addColorStop(0, '#ffffff');
  glassGrad.addColorStop(0.4, '#38bdf8');
  glassGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.ellipse(0, -height * 0.15, width * 0.32, height * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Navigation light flares on wings (left green, right red standard style)
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(-width * 1.35, height * 0.6, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(width * 1.35, height * 0.6, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
