'use client';

import { useRef, useEffect, useCallback, useState, memo } from 'react';
import type { ConstellationNode, ConstellationEdge } from '@/types/constellation';
import { useDashboardStore } from '@/store/dashboard';

// ============================================
//  COLORS & CONSTANTS
// ============================================

const STATUS_COLORS: Record<string, { core: string; glow: string; membrane: string; nucleus: string }> = {
  active:  { core: '#00e5ff', glow: '#0091ea', membrane: '#004d66', nucleus: '#b2fff9' },
  idle:    { core: '#546e7a', glow: '#37474f', membrane: '#263238', nucleus: '#78909c' },
  error:   { core: '#ff1744', glow: '#d50000', membrane: '#4a0000', nucleus: '#ff8a80' },
  offline: { core: '#263238', glow: '#1a2327', membrane: '#121a1e', nucleus: '#37474f' },
  // NAAB advisory board uses amber tones
  naab:    { core: '#f59e0b', glow: '#b45309', membrane: '#451a03', nucleus: '#fde68a' },
};

const ROLE_RADII: Record<string, number> = {
  orchestrator: 45,
  developer: 30,
  qa: 26,
  researcher: 28,
  designer: 26,
  other: 24,
};

const MEMBRANE_POINTS: Record<string, number> = {
  orchestrator: 20,
  developer: 14,
  qa: 12,
  researcher: 14,
  designer: 14,
  other: 12,
};

// ============================================
//  SIMULATION TYPES
// ============================================

interface Organelle {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  opacity: number;
}

interface Cilium {
  baseAngle: number;
  length: number;
  waveSpeed: number;
  waveAmp: number;
  phase: number;
}

interface CellNode {
  node: ConstellationNode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  phase: number;
  breathRate: number;
  membranePoints: number;
  organelles: Organelle[];
  cilia: Cilium[];
}

interface NeuralPulse {
  t: number;
  speed: number;
  size: number;
  opacity: number;
}

interface Synapse {
  edge: ConstellationEdge;
  fromIdx: number;
  toIdx: number;
  pulses: NeuralPulse[];
  wavePhase: number;
}

interface BgParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

// ============================================
//  LAYOUT & PHYSICS
// ============================================

/** Check if a node belongs to the NAAB advisory board */
function isNaab(node: ConstellationNode): boolean {
  return node.id.startsWith('naab-') || node.meta?.group === 'naab';
}

function layoutNodes(
  nodes: ConstellationNode[],
  width: number,
  height: number,
): { x: number; y: number }[] {
  const cx = width / 2;
  const cy = height / 2;
  const count = nodes.length;

  if (count === 0) return [];
  if (count === 1) return [{ x: cx, y: cy }];

  const positions: { x: number; y: number }[] = new Array(count);
  const orchIdx = nodes.findIndex((n) => n.role === 'orchestrator');

  // Separate NAAB from core agents
  const naabIndices: number[] = [];
  const coreIndices: number[] = [];
  for (let i = 0; i < count; i++) {
    if (i === orchIdx) continue;
    if (isNaab(nodes[i])) naabIndices.push(i);
    else coreIndices.push(i);
  }

  // Place orchestrator at center
  if (orchIdx >= 0) {
    positions[orchIdx] = { x: cx, y: cy };
  }

  // Core agents orbit on the left half (away from NAAB on the right)
  const coreOrbitR = Math.min(width, height) * 0.28;
  const coreCount = coreIndices.length;
  for (let j = 0; j < coreCount; j++) {
    // Left arc: centered at π (left), spanning ~99° to ~261°
    const startAngle = Math.PI * 0.55;
    const endAngle = Math.PI * 1.45;
    const angle = coreCount === 1
      ? Math.PI // directly left
      : startAngle + (j / (coreCount - 1)) * (endAngle - startAngle);
    const rx = coreOrbitR * 1.15;
    const ry = coreOrbitR * 0.85;
    positions[coreIndices[j]] = {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    };
  }

  // NAAB cluster: own circle well to the right of Kern
  if (naabIndices.length > 0) {
    const naabCenterX = cx + Math.min(width, height) * 0.45;
    const naabCenterY = cy - Math.min(width, height) * 0.05;
    const naabClusterR = Math.min(width, height) * 0.10;

    for (let j = 0; j < naabIndices.length; j++) {
      const angle = (j / naabIndices.length) * Math.PI * 2 - Math.PI / 2;
      positions[naabIndices[j]] = {
        x: naabCenterX + Math.cos(angle) * naabClusterR,
        y: naabCenterY + Math.sin(angle) * naabClusterR,
      };
    }
  }

  return positions;
}

function applyForces(cells: CellNode[], dt: number) {
  const k = 0.003;
  const damping = 0.92;
  const jitter = 0.12;

  for (const c of cells) {
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    c.vx += dx * k;
    c.vy += dy * k;
    c.vx += (Math.random() - 0.5) * jitter;
    c.vy += (Math.random() - 0.5) * jitter;
    c.vx *= damping;
    c.vy *= damping;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
  }
}

// ============================================
//  HELPERS
// ============================================

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeOrganelles(radius: number, count: number): Organelle[] {
  const out: Organelle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      angle: Math.random() * Math.PI * 2,
      dist: radius * (0.15 + Math.random() * 0.55),
      speed: 0.2 + Math.random() * 0.4,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.35,
    });
  }
  return out;
}

function makeCilia(count: number): Cilium[] {
  const out: Cilium[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      baseAngle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
      length: 8 + Math.random() * 12,
      waveSpeed: 1.5 + Math.random() * 2,
      waveAmp: 3 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return out;
}

function makeBgParticles(w: number, h: number, count: number): BgParticle[] {
  const out: BgParticle[] = [];
  for (let i = 0; i < count; i++) {
    const maxLife = 8 + Math.random() * 12;
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.02 + Math.random() * 0.06,
      life: Math.random() * maxLife,
      maxLife,
    });
  }
  return out;
}

// ============================================
//  DRAW FUNCTIONS
// ============================================

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
  bgGrad.addColorStop(0, '#0a0e1a');
  bgGrad.addColorStop(0.5, '#060a14');
  bgGrad.addColorStop(1, '#030508');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
}

function updateAndDrawBgParticles(
  ctx: CanvasRenderingContext2D,
  particles: BgParticle[],
  w: number,
  h: number,
  dt: number,
) {
  for (const p of particles) {
    // Brownian nudge
    p.vx += (Math.random() - 0.5) * 0.02;
    p.vy += (Math.random() - 0.5) * 0.02;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life += dt * 0.001;

    // Wrap around
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    // Lifecycle fade
    if (p.life > p.maxLife) {
      p.life = 0;
      p.x = Math.random() * w;
      p.y = Math.random() * h;
    }
    const lifeFrac = p.life / p.maxLife;
    const fade = lifeFrac < 0.1 ? lifeFrac / 0.1 : lifeFrac > 0.9 ? (1 - lifeFrac) / 0.1 : 1;

    ctx.fillStyle = `rgba(0, 200, 220, ${p.opacity * fade})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSynapse(
  ctx: CanvasRenderingContext2D,
  from: CellNode,
  to: CellNode,
  synapse: Synapse,
  t: number,
) {
  const strength = synapse.edge.strength ?? 0.3;
  const isActive = from.node.status === 'active' || to.node.status === 'active';
  const fromColors = STATUS_COLORS[from.node.status] || STATUS_COLORS.offline;

  // Undulating control point
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const waveOff = Math.sin(t * 0.8 + synapse.wavePhase) * 15;
  const perpX = -dy * 0.06 + waveOff * (-dy / (Math.sqrt(dx * dx + dy * dy) || 1));
  const perpY = dx * 0.06 + waveOff * (dx / (Math.sqrt(dx * dx + dy * dy) || 1));
  const cpx = mx + perpX;
  const cpy = my + perpY;

  // Filament stroke
  const baseAlpha = isActive ? 0.12 + strength * 0.18 : 0.04;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
  ctx.strokeStyle = hexToRgba(fromColors.core, baseAlpha);
  ctx.lineWidth = 1 + strength * 1.5;
  ctx.stroke();

  // Glow on active
  if (isActive && strength > 0.2) {
    ctx.strokeStyle = hexToRgba(fromColors.glow, baseAlpha * 0.4);
    ctx.lineWidth = 4 + strength * 3;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
    ctx.stroke();
  }

  // Neural pulses
  for (const pulse of synapse.pulses) {
    const pt = pulse.t;
    const px = (1 - pt) * (1 - pt) * from.x + 2 * (1 - pt) * pt * cpx + pt * pt * to.x;
    const py = (1 - pt) * (1 - pt) * from.y + 2 * (1 - pt) * pt * cpy + pt * pt * to.y;

    // Glow
    const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, pulse.size * 4);
    glowGrad.addColorStop(0, `rgba(0, 229, 255, ${pulse.opacity * 0.5})`);
    glowGrad.addColorStop(0.5, `rgba(0, 145, 234, ${pulse.opacity * 0.15})`);
    glowGrad.addColorStop(1, 'rgba(0, 145, 234, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, pulse.size * 4, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `rgba(178, 255, 249, ${pulse.opacity})`;
    ctx.beginPath();
    ctx.arc(px, py, pulse.size, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    const trailSteps = 5;
    for (let s = 1; s <= trailSteps; s++) {
      const tt = Math.max(0, pt - s * 0.025);
      const tx = (1 - tt) * (1 - tt) * from.x + 2 * (1 - tt) * tt * cpx + tt * tt * to.x;
      const ty = (1 - tt) * (1 - tt) * from.y + 2 * (1 - tt) * tt * cpy + tt * tt * to.y;
      const trailAlpha = pulse.opacity * (1 - s / (trailSteps + 1)) * 0.3;
      ctx.fillStyle = `rgba(0, 229, 255, ${trailAlpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, pulse.size * (1 - s * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function updateSynapsePulses(synapse: Synapse, dt: number) {
  const rate = synapse.edge.ratePerMin ?? 0;

  // Spawn
  if (rate > 0 && Math.random() < (rate / 60) * (dt / 1000) * 3) {
    synapse.pulses.push({
      t: 0,
      speed: 0.12 + Math.random() * 0.12,
      size: 2 + Math.random() * 2,
      opacity: 0.5 + Math.random() * 0.5,
    });
  }

  // Update
  for (let i = synapse.pulses.length - 1; i >= 0; i--) {
    const p = synapse.pulses[i];
    p.t += p.speed * dt * 0.001;
    p.opacity *= 0.997;
    if (p.t > 1 || p.opacity < 0.03) {
      synapse.pulses.splice(i, 1);
    }
  }

  if (synapse.pulses.length > 8) {
    synapse.pulses.splice(0, synapse.pulses.length - 8);
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: CellNode,
  t: number,
  isHovered: boolean,
  isSelected: boolean,
) {
  const { node, x, y, radius, phase, breathRate, membranePoints, organelles, cilia } = cell;
  const isNaabNode = isNaab(node);
  const colors = isNaabNode ? STATUS_COLORS.naab : (STATUS_COLORS[node.status] || STATUS_COLORS.offline);
  const isOrchestrator = node.role === 'orchestrator';

  // Breathing
  const breath = Math.sin(t * breathRate + phase) * 0.06;
  const hoverScale = isHovered ? 1.12 : 1;
  const baseR = radius * (1 + breath) * hoverScale;

  ctx.save();
  ctx.translate(x, y);

  // --- Outer ambient glow ---
  const glowR = baseR * (node.status === 'active' ? 3.0 : 2.0);
  const glowIntensity = node.status === 'active' ? 0.12 : node.status === 'error' ? 0.1 : 0.04;
  const outerGlow = ctx.createRadialGradient(0, 0, baseR * 0.3, 0, 0, glowR);
  outerGlow.addColorStop(0, hexToRgba(colors.glow, glowIntensity * (isHovered ? 2 : 1)));
  outerGlow.addColorStop(0.5, hexToRgba(colors.glow, glowIntensity * 0.25));
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fill();

  // --- Cilia (drawn before membrane so they appear behind) ---
  for (const c of cilia) {
    const wave = Math.sin(t * c.waveSpeed + c.phase) * c.waveAmp;
    const memR = baseR + 2;
    const startX = Math.cos(c.baseAngle) * memR;
    const startY = Math.sin(c.baseAngle) * memR;
    const endX = Math.cos(c.baseAngle + wave * 0.02) * (memR + c.length);
    const endY = Math.sin(c.baseAngle + wave * 0.02) * (memR + c.length);
    const cpxC = (startX + endX) / 2 + Math.sin(t * c.waveSpeed * 1.3 + c.phase) * c.waveAmp * 0.5;
    const cpyC = (startY + endY) / 2 + Math.cos(t * c.waveSpeed * 1.3 + c.phase) * c.waveAmp * 0.5;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpxC, cpyC, endX, endY);
    ctx.strokeStyle = hexToRgba(colors.core, 0.15);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // --- Membrane (wobbly polygon) ---
  ctx.beginPath();
  const angleStep = (Math.PI * 2) / membranePoints;
  for (let i = 0; i <= membranePoints; i++) {
    const angle = i * angleStep;
    const wobble = Math.sin(t * breathRate * 1.5 + i * 1.8 + phase) * 2.5
                 + Math.sin(t * 0.7 + i * 3.1 + phase * 2) * 1.5;
    const r = baseR + wobble;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Fill with radial gradient
  const cellGrad = ctx.createRadialGradient(0, -baseR * 0.2, 0, 0, 0, baseR * 1.1);
  cellGrad.addColorStop(0, hexToRgba(colors.core, 0.35));
  cellGrad.addColorStop(0.4, hexToRgba(colors.membrane, 0.5));
  cellGrad.addColorStop(1, hexToRgba(colors.membrane, 0.2));
  ctx.fillStyle = cellGrad;
  ctx.fill();

  // Membrane stroke
  ctx.strokeStyle = hexToRgba(colors.core, isHovered ? 0.7 : 0.3);
  ctx.lineWidth = isHovered ? 2 : 1.2;
  ctx.stroke();

  // Orchestrator double membrane
  if (isOrchestrator) {
    ctx.beginPath();
    for (let i = 0; i <= membranePoints; i++) {
      const angle = i * angleStep;
      const wobble = Math.sin(t * breathRate * 1.3 + i * 1.8 + phase + 1) * 2
                   + Math.sin(t * 0.5 + i * 2.7 + phase * 2 + 1) * 1.5;
      const r = baseR * 1.12 + wobble;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = hexToRgba(colors.core, 0.15);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // --- Nucleus ---
  const nucleusR = baseR * 0.3;
  const nucleusGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, nucleusR);
  nucleusGlow.addColorStop(0, hexToRgba(colors.nucleus, 0.9));
  nucleusGlow.addColorStop(0.6, hexToRgba(colors.core, 0.4));
  nucleusGlow.addColorStop(1, hexToRgba(colors.core, 0.05));
  ctx.fillStyle = nucleusGlow;
  ctx.beginPath();
  ctx.arc(0, 0, nucleusR, 0, Math.PI * 2);
  ctx.fill();

  // --- Organelles ---
  for (const o of organelles) {
    o.angle += o.speed * 0.015;
    const ox = Math.cos(o.angle) * o.dist;
    const oy = Math.sin(o.angle) * o.dist;
    const oAlpha = o.opacity * (0.5 + Math.sin(t * 1.2 + o.angle) * 0.5);
    ctx.fillStyle = hexToRgba(colors.nucleus, oAlpha);
    ctx.beginPath();
    ctx.arc(ox, oy, o.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Error pulsing ring ---
  if (node.status === 'error') {
    const errorPulse = Math.sin(t * 4) * 0.3 + 0.5;
    ctx.strokeStyle = `rgba(255, 23, 68, ${errorPulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 1.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Active shimmer ring ---
  if (node.status === 'active') {
    const shimmer = Math.sin(t * 2 + phase) * 0.12 + 0.18;
    ctx.strokeStyle = `rgba(0, 229, 255, ${shimmer})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 1.35, t * 0.3, t * 0.3 + Math.PI * 1.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- Selected highlight ---
  if (isSelected) {
    const selectPulse = Math.sin(t * 3) * 0.15 + 0.55;
    ctx.strokeStyle = `rgba(0, 229, 255, ${selectPulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 1.5, -t * 0.5, -t * 0.5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- Name label ---
  ctx.fillStyle = isHovered ? '#e0f7fa' : '#78909c';
  ctx.font = `${isHovered ? '600' : '500'} ${isHovered ? 12 : 11}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(node.name, 0, baseR + 10);

  // Model label
  if (node.modelPrimary) {
    ctx.fillStyle = '#37474f';
    ctx.font = '400 8px "JetBrains Mono", monospace';
    ctx.fillText(node.modelPrimary, 0, baseR + 25);
  }

  ctx.restore();
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  cell: CellNode,
  mouseX: number,
  mouseY: number,
) {
  const { node } = cell;
  const colors = STATUS_COLORS[node.status] || STATUS_COLORS.offline;

  const lines = [
    node.name,
    `Status: ${node.status}`,
    node.modelPrimary ? `Model: ${node.modelPrimary}` : null,
    node.tokensUsed24h != null ? `Tokens/24h: ${(node.tokensUsed24h / 1000).toFixed(1)}k` : null,
    node.costUSD24h != null ? `Cost/24h: $${node.costUSD24h.toFixed(3)}` : null,
    node.errorCount24h ? `Errors: ${node.errorCount24h}` : null,
  ].filter(Boolean) as string[];

  const padding = 10;
  const lineHeight = 16;
  const titleHeight = 20;
  const boxW = 180;
  const boxH = titleHeight + (lines.length - 1) * lineHeight + padding * 2;

  // Position near mouse but within bounds
  let tx = mouseX + 16;
  let ty = mouseY - boxH / 2;
  // No bounds check needed — canvas clips naturally

  // Connecting line from cell to tooltip
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cell.x, cell.y);
  ctx.lineTo(tx, ty + boxH / 2);
  ctx.strokeStyle = hexToRgba(colors.core, 0.2);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Background
  ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
  ctx.beginPath();
  roundRect(ctx, tx, ty, boxW, boxH, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = hexToRgba(colors.core, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, tx, ty, boxW, boxH, 6);
  ctx.stroke();

  // Title
  ctx.fillStyle = hexToRgba(colors.core, 1);
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(lines[0], tx + padding, ty + padding);

  // Details
  ctx.font = '400 10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#90a4ae';
  for (let i = 1; i < lines.length; i++) {
    ctx.fillText(lines[i], tx + padding, ty + padding + titleHeight + (i - 1) * lineHeight);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================
//  COMPONENT
// ============================================

interface OrganismCanvasProps {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  isLive: boolean;
  onNodeClick: (node: ConstellationNode) => void;
}

export const OrganismCanvas = memo(function OrganismCanvas({
  nodes,
  edges,
  isLive,
  onNodeClick,
}: OrganismCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<CellNode[]>([]);
  const synapsesRef = useRef<Synapse[]>([]);
  const bgParticlesRef = useRef<BgParticle[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const hoveredRef = useRef<number>(-1);
  const mouseRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  const selectedAgentId = useDashboardStore((s) => s.selectedAgentId);
  const selectedAgentIdRef = useRef(selectedAgentId);
  selectedAgentIdRef.current = selectedAgentId;

  // Rebuild simulation when data changes
  useEffect(() => {
    const w = sizeRef.current.w || 800;
    const h = sizeRef.current.h || 600;
    const positions = layoutNodes(nodes, w, h);

    const newCells: CellNode[] = nodes.map((node, i) => {
      const existing = cellsRef.current.find((c) => c.node.id === node.id);
      const pos = positions[i] || { x: w / 2, y: h / 2 };
      const radius = ROLE_RADII[node.role] || 24;
      const mPoints = MEMBRANE_POINTS[node.role] || 12;

      const organelleCount = node.status === 'active' ? 10 : node.status === 'idle' ? 6 : 3;
      const ciliaCount = node.role === 'orchestrator' ? 8 : node.status === 'active' ? 6 : 4;

      return {
        node,
        x: existing?.x ?? pos.x,
        y: existing?.y ?? pos.y,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        targetX: pos.x,
        targetY: pos.y,
        radius,
        phase: existing?.phase ?? Math.random() * Math.PI * 2,
        breathRate: 0.6 + Math.random() * 0.6,
        membranePoints: mPoints,
        organelles: existing?.organelles ?? makeOrganelles(radius, organelleCount),
        cilia: existing?.cilia ?? makeCilia(ciliaCount),
      };
    });

    // Build synapses
    const nodeIndexMap = new Map<string, number>();
    newCells.forEach((c, i) => nodeIndexMap.set(c.node.id, i));

    const newSynapses: Synapse[] = edges
      .map((edge) => {
        const fromIdx = nodeIndexMap.get(edge.from);
        const toIdx = nodeIndexMap.get(edge.to);
        if (fromIdx === undefined || toIdx === undefined) return null;
        const existing = synapsesRef.current.find((s) => s.edge.id === edge.id);
        return {
          edge,
          fromIdx,
          toIdx,
          pulses: existing?.pulses ?? [],
          wavePhase: existing?.wavePhase ?? Math.random() * Math.PI * 2,
        };
      })
      .filter(Boolean) as Synapse[];

    cellsRef.current = newCells;
    synapsesRef.current = newSynapses;

    // Init background particles if needed
    if (bgParticlesRef.current.length === 0) {
      bgParticlesRef.current = makeBgParticles(w, h, 50);
    }
  }, [nodes, edges]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w: width, h: height };
      setCanvasSize({ w: width, h: height });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      // Recalculate target positions
      const positions = layoutNodes(
        cellsRef.current.map((c) => c.node),
        width,
        height,
      );
      cellsRef.current.forEach((c, i) => {
        if (positions[i]) {
          c.targetX = positions[i].x;
          c.targetY = positions[i].y;
        }
      });
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    let running = true;
    let lastTime = performance.now();

    function animate(now: number) {
      if (!running) return;
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      timeRef.current += dt * 0.001;
      const t = timeRef.current;

      const canvas = canvasRef.current;
      if (!canvas) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = sizeRef.current.w;
      const h = sizeRef.current.h;
      if (w === 0 || h === 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Layer 1: Background
      drawBackground(ctx, w, h);

      // Layer 2: Background particles
      updateAndDrawBgParticles(ctx, bgParticlesRef.current, w, h, dt);

      const cells = cellsRef.current;
      const synapses = synapsesRef.current;

      // Physics
      applyForces(cells, dt * 0.06);

      // Compute NAAB cluster center + radius for use in drawing
      const naabCells = cells.filter((c) => isNaab(c.node));
      let ncx = 0, ncy = 0, clusterR = 60;
      if (naabCells.length > 0) {
        for (const nc of naabCells) { ncx += nc.x; ncy += nc.y; }
        ncx /= naabCells.length;
        ncy /= naabCells.length;
        let maxDist = 0;
        for (const nc of naabCells) {
          const d = Math.sqrt((nc.x - ncx) ** 2 + (nc.y - ncy) ** 2) + nc.radius * 1.8;
          if (d > maxDist) maxDist = d;
        }
        clusterR = Math.max(maxDist, 60);
      }

      // Layer 3: Synapses (edges)
      // For edges crossing from non-NAAB to NAAB, draw to cluster boundary instead
      let kernToNaabSynapse: Synapse | null = null;
      for (const s of synapses) {
        const from = cells[s.fromIdx];
        const to = cells[s.toIdx];
        if (!from || !to) continue;

        const fromIsNaab = isNaab(from.node);
        const toIsNaab = isNaab(to.node);

        // Skip the single Kern→NAAB gateway edge (we draw it custom)
        if (!fromIsNaab && toIsNaab) {
          kernToNaabSynapse = s;
          updateSynapsePulses(s, dt);
          continue;
        }

        drawSynapse(ctx, from, to, s, t);
        updateSynapsePulses(s, dt);
      }

      // Layer 3.5: NAAB cluster boundary ring + Kern→cluster link
      if (naabCells.length > 0) {
        ctx.save();

        // Amber ring
        const wobble = Math.sin(t * 0.4) * 2;
        ctx.beginPath();
        ctx.arc(ncx, ncy, clusterR + wobble, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.12 + Math.sin(t * 0.6) * 0.04})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Subtle amber glow fill
        const naabGlow = ctx.createRadialGradient(ncx, ncy, 0, ncx, ncy, clusterR + 20);
        naabGlow.addColorStop(0, 'rgba(245, 158, 11, 0.02)');
        naabGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.01)');
        naabGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = naabGlow;
        ctx.beginPath();
        ctx.arc(ncx, ncy, clusterR + 20, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.font = '500 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('NAAB Advisory Board', ncx, ncy - clusterR - 8);

        // Draw Kern→cluster boundary link
        if (kernToNaabSynapse) {
          const kernCell = cells[kernToNaabSynapse.fromIdx];
          if (kernCell) {
            // Find intersection point on cluster boundary facing Kern
            const dx = kernCell.x - ncx;
            const dy = kernCell.y - ncy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const bx = ncx + (dx / dist) * (clusterR + wobble);
            const by = ncy + (dy / dist) * (clusterR + wobble);

            // Filament from Kern to cluster boundary
            const mx = (kernCell.x + bx) / 2;
            const my = (kernCell.y + by) / 2;
            const waveOff = Math.sin(t * 0.6) * 8;
            const perpX = -(by - kernCell.y) * 0.04 + waveOff * (-(by - kernCell.y) / dist);
            const perpY = (bx - kernCell.x) * 0.04 + waveOff * ((bx - kernCell.x) / dist);
            const cpx = mx + perpX;
            const cpy = my + perpY;

            ctx.beginPath();
            ctx.moveTo(kernCell.x, kernCell.y);
            ctx.quadraticCurveTo(cpx, cpy, bx, by);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Glow
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.06)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(kernCell.x, kernCell.y);
            ctx.quadraticCurveTo(cpx, cpy, bx, by);
            ctx.stroke();

            // Draw pulses along this link
            for (const pulse of kernToNaabSynapse.pulses) {
              const pt = pulse.t;
              const px = (1 - pt) * (1 - pt) * kernCell.x + 2 * (1 - pt) * pt * cpx + pt * pt * bx;
              const py = (1 - pt) * (1 - pt) * kernCell.y + 2 * (1 - pt) * pt * cpy + pt * pt * by;

              const pGlow = ctx.createRadialGradient(px, py, 0, px, py, pulse.size * 4);
              pGlow.addColorStop(0, `rgba(245, 158, 11, ${pulse.opacity * 0.5})`);
              pGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
              ctx.fillStyle = pGlow;
              ctx.beginPath();
              ctx.arc(px, py, pulse.size * 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = `rgba(253, 230, 138, ${pulse.opacity})`;
              ctx.beginPath();
              ctx.arc(px, py, pulse.size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        ctx.restore();
      }

      // Layer 4: Cells (nodes)
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const isHovered = hoveredRef.current === i;
        const isSelected = cell.node.id === selectedAgentIdRef.current;
        drawCell(ctx, cell, t, isHovered, isSelected);
      }

      // Layer 5: Tooltip (on top of everything)
      if (hoveredRef.current >= 0 && hoveredRef.current < cells.length) {
        drawTooltip(ctx, cells[hoveredRef.current], mouseRef.current.x, mouseRef.current.y);
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameRef.current);
      } else {
        running = true;
        lastTime = performance.now();
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- selectedAgentId read via ref

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my };

      let hitIdx = -1;
      for (let i = cellsRef.current.length - 1; i >= 0; i--) {
        const c = cellsRef.current[i];
        const dx = mx - c.x;
        const dy = my - c.y;
        const hitR = c.radius * 1.5;
        if (dx * dx + dy * dy < hitR * hitR) {
          hitIdx = i;
          break;
        }
      }

      hoveredRef.current = hitIdx;
      canvas.style.cursor = hitIdx >= 0 ? 'pointer' : 'default';
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = cellsRef.current.length - 1; i >= 0; i--) {
        const c = cellsRef.current[i];
        const dx = mx - c.x;
        const dy = my - c.y;
        const hitR = c.radius * 1.5;
        if (dx * dx + dy * dy < hitR * hitR) {
          onNodeClick(c.node);
          break;
        }
      }
    },
    [onNodeClick],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.w * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
        height={canvasSize.h * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
        style={{ width: canvasSize.w, height: canvasSize.h }}
        className="block"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => {
          hoveredRef.current = -1;
        }}
      />
    </div>
  );
});
