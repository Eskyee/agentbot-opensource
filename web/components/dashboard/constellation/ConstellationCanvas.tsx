'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { ConstellationNode, ConstellationEdge } from '@/types/constellation';

// ============================================
//  CONSTANTS
// ============================================

const STATUS_COLORS: Record<string, { core: string; glow: string; particle: string }> = {
  active: { core: '#3b82f6', glow: '#2563eb', particle: '#60a5fa' },
  idle: { core: '#64748b', glow: '#475569', particle: '#94a3b8' },
  error: { core: '#ef4444', glow: '#dc2626', particle: '#f87171' },
  offline: { core: '#334155', glow: '#1e293b', particle: '#475569' },
};

const ROLE_SHAPES: Record<string, { points: number; innerRatio: number }> = {
  orchestrator: { points: 8, innerRatio: 0.85 },
  developer: { points: 6, innerRatio: 0.7 },
  qa: { points: 4, innerRatio: 0.75 },
  researcher: { points: 5, innerRatio: 0.6 },
  designer: { points: 7, innerRatio: 0.8 },
  other: { points: 5, innerRatio: 0.7 },
};

const ROLE_SIZES: Record<string, number> = {
  orchestrator: 38,
  developer: 26,
  qa: 24,
  researcher: 24,
  designer: 24,
  other: 22,
};

// ============================================
//  INTERNAL TYPES
// ============================================

interface SimNode {
  node: ConstellationNode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  phase: number; // individual animation phase offset
  breathRate: number;
  particles: Particle[];
}

interface SimEdge {
  edge: ConstellationEdge;
  fromIdx: number;
  toIdx: number;
  pulses: Pulse[];
}

interface Particle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  opacity: number;
  hue: number;
}

interface Pulse {
  t: number; // 0-1 progress along edge
  speed: number;
  size: number;
  opacity: number;
  trail: number; // trail length
}

// ============================================
//  PIXEL FACE GENERATOR
// ============================================

// Generate a deterministic pixel face from a node id
function generatePixelFace(id: string): boolean[][] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }

  // 5x5 face grid — symmetric horizontally
  const grid: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 3; x++) {
      // Use hash bits for each cell
      const bit = (hash >> (y * 3 + x)) & 1;
      row.push(bit === 1);
    }
    // Mirror: col 3 = col 1, col 4 = col 0
    row.push(row[1]);
    row.push(row[0]);
    grid.push(row);
  }

  // Always fill the center pixel and eyes area for recognizability
  grid[1][1] = true;
  grid[1][3] = true;
  grid[2][2] = true;

  return grid;
}

// ============================================
//  FORCE SIMULATION
// ============================================

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

  // Place orchestrator in center, others in orbit
  const positions: { x: number; y: number }[] = [];
  const orchIdx = nodes.findIndex((n) => n.role === 'orchestrator');
  const orbitRadius = Math.min(width, height) * 0.28;

  for (let i = 0; i < count; i++) {
    if (i === orchIdx) {
      positions.push({ x: cx, y: cy });
    } else {
      // Distribute non-orchestrator nodes in an ellipse
      const nonOrchIdx = i > orchIdx ? i - 1 : i;
      const nonOrchCount = count - (orchIdx >= 0 ? 1 : 0);
      const angle = (nonOrchIdx / nonOrchCount) * Math.PI * 2 - Math.PI / 2;
      const rx = orbitRadius * 1.2;
      const ry = orbitRadius * 0.85;
      positions.push({
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
      });
    }
  }

  return positions;
}

function applyForces(simNodes: SimNode[], dt: number) {
  const k = 0.003; // spring constant towards target
  const damping = 0.92;
  const jitter = 0.15;

  for (const sn of simNodes) {
    // Spring towards target
    const dx = sn.targetX - sn.x;
    const dy = sn.targetY - sn.y;
    sn.vx += dx * k;
    sn.vy += dy * k;

    // Gentle organic jitter
    sn.vx += (Math.random() - 0.5) * jitter;
    sn.vy += (Math.random() - 0.5) * jitter;

    // Damping
    sn.vx *= damping;
    sn.vy *= damping;

    sn.x += sn.vx * dt;
    sn.y += sn.vy * dt;
  }
}

// ============================================
//  CANVAS COMPONENT
// ============================================

interface ConstellationCanvasProps {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  isLive: boolean;
  onNodeHover: (node: ConstellationNode | null, x: number, y: number) => void;
  onNodeClick: (node: ConstellationNode) => void;
}

export default function ConstellationCanvas({
  nodes,
  edges,
  isLive,
  onNodeHover,
  onNodeClick,
}: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const hoveredRef = useRef<number>(-1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const pixelFacesRef = useRef<Map<string, boolean[][]>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // Rebuild simulation state when nodes/edges change
  useEffect(() => {
    const w = sizeRef.current.w || 800;
    const h = sizeRef.current.h || 600;
    const positions = layoutNodes(nodes, w, h);

    // Build face cache
    const faceCache = pixelFacesRef.current;
    for (const n of nodes) {
      if (!faceCache.has(n.id)) {
        faceCache.set(n.id, generatePixelFace(n.id));
      }
    }

    const newSimNodes: SimNode[] = nodes.map((node, i) => {
      const existing = simNodesRef.current.find((sn) => sn.node.id === node.id);
      const pos = positions[i] || { x: w / 2, y: h / 2 };
      const radius = ROLE_SIZES[node.role] || 22;

      // Generate particles for active nodes
      const particleCount = node.status === 'active' ? 12 : node.status === 'idle' ? 5 : 2;
      const particles: Particle[] = [];
      for (let p = 0; p < particleCount; p++) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          distance: radius * (1.2 + Math.random() * 0.8),
          speed: 0.3 + Math.random() * 0.5,
          size: 1 + Math.random() * 2,
          opacity: 0.2 + Math.random() * 0.5,
          hue: Math.random() * 30 - 15,
        });
      }

      return {
        node,
        x: existing?.x ?? pos.x,
        y: existing?.y ?? pos.y,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        targetX: pos.x,
        targetY: pos.y,
        radius,
        phase: Math.random() * Math.PI * 2,
        breathRate: 0.8 + Math.random() * 0.4,
        particles,
      };
    });

    // Build edge sim with pulse generation
    const nodeIndexMap = new Map<string, number>();
    newSimNodes.forEach((sn, i) => nodeIndexMap.set(sn.node.id, i));

    const newSimEdges: SimEdge[] = edges
      .map((edge) => {
        const fromIdx = nodeIndexMap.get(edge.from);
        const toIdx = nodeIndexMap.get(edge.to);
        if (fromIdx === undefined || toIdx === undefined) return null;

        // Carry over existing pulses
        const existing = simEdgesRef.current.find((se) => se.edge.id === edge.id);

        return {
          edge,
          fromIdx,
          toIdx,
          pulses: existing?.pulses ?? [],
        };
      })
      .filter(Boolean) as SimEdge[];

    simNodesRef.current = newSimNodes;
    simEdgesRef.current = newSimEdges;
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
        simNodesRef.current.map((sn) => sn.node),
        width,
        height,
      );
      simNodesRef.current.forEach((sn, i) => {
        if (positions[i]) {
          sn.targetX = positions[i].x;
          sn.targetY = positions[i].y;
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
      const dt = Math.min(now - lastTime, 50); // cap delta to avoid jumps
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

      // Background gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bgGrad.addColorStop(0, 'rgba(15, 17, 30, 1)');
      bgGrad.addColorStop(0.5, 'rgba(12, 14, 24, 1)');
      bgGrad.addColorStop(1, 'rgba(8, 10, 18, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle star field
      drawStarField(ctx, w, h, t);

      const simNodes = simNodesRef.current;
      const simEdges = simEdgesRef.current;

      // Apply physics
      applyForces(simNodes, dt * 0.06);

      // Draw edges + pulses
      for (const se of simEdges) {
        const from = simNodes[se.fromIdx];
        const to = simNodes[se.toIdx];
        if (!from || !to) continue;
        drawEdge(ctx, from, to, se, t);
        updatePulses(se, dt, from, to);
      }

      // Draw nodes
      for (let i = 0; i < simNodes.length; i++) {
        const sn = simNodes[i];
        const isHovered = hoveredRef.current === i;
        drawNode(ctx, sn, t, isHovered, pixelFacesRef.current.get(sn.node.id));
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    // Pause when tab hidden
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
  }, []);

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let hitIdx = -1;
      for (let i = simNodesRef.current.length - 1; i >= 0; i--) {
        const sn = simNodesRef.current[i];
        const dx = mx - sn.x;
        const dy = my - sn.y;
        const hitRadius = sn.radius * 1.5;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          hitIdx = i;
          break;
        }
      }

      hoveredRef.current = hitIdx;
      if (hitIdx >= 0) {
        const sn = simNodesRef.current[hitIdx];
        onNodeHover(sn.node, e.clientX, e.clientY);
        canvas.style.cursor = 'pointer';
      } else {
        onNodeHover(null, 0, 0);
        canvas.style.cursor = 'default';
      }
    },
    [onNodeHover],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = simNodesRef.current.length - 1; i >= 0; i--) {
        const sn = simNodesRef.current[i];
        const dx = mx - sn.x;
        const dy = my - sn.y;
        const hitRadius = sn.radius * 1.5;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          onNodeClick(sn.node);
          break;
        }
      }
    },
    [onNodeClick],
  );

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
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
          onNodeHover(null, 0, 0);
        }}
      />
    </div>
  );
}

// ============================================
//  DRAW FUNCTIONS
// ============================================

function drawStarField(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Deterministic star positions via hash
  const starCount = 60;
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 7919) % 10000) / 10000;
    const sy = ((i * 6271) % 10000) / 10000;
    const twinkle = Math.sin(t * (0.5 + (i % 5) * 0.2) + i) * 0.3 + 0.4;
    const size = 0.5 + (i % 3) * 0.3;
    ctx.globalAlpha = twinkle * 0.35;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  from: SimNode,
  to: SimNode,
  simEdge: SimEdge,
  t: number,
) {
  const strength = simEdge.edge.strength ?? 0.3;
  const isActive = from.node.status === 'active' || to.node.status === 'active';

  // Edge line
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);

  // Slight curve for visual interest
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const perpX = -dy * 0.05;
  const perpY = dx * 0.05;
  ctx.quadraticCurveTo(mx + perpX, my + perpY, to.x, to.y);

  const baseAlpha = isActive ? 0.15 + strength * 0.2 : 0.06;
  ctx.strokeStyle = isActive ? `rgba(59, 130, 246, ${baseAlpha})` : `rgba(100, 116, 139, ${baseAlpha})`;
  ctx.lineWidth = 1 + strength;
  ctx.stroke();

  // Glow on active edges
  if (isActive && strength > 0.3) {
    ctx.strokeStyle = `rgba(59, 130, 246, ${baseAlpha * 0.3})`;
    ctx.lineWidth = 4 + strength * 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(mx + perpX, my + perpY, to.x, to.y);
    ctx.stroke();
  }

  // Draw pulses
  for (const pulse of simEdge.pulses) {
    const pt = pulse.t;
    // Quadratic bezier position
    const px = (1 - pt) * (1 - pt) * from.x + 2 * (1 - pt) * pt * (mx + perpX) + pt * pt * to.x;
    const py = (1 - pt) * (1 - pt) * from.y + 2 * (1 - pt) * pt * (my + perpY) + pt * pt * to.y;

    // Pulse glow
    const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, pulse.size * 3);
    glowGrad.addColorStop(0, `rgba(96, 165, 250, ${pulse.opacity * 0.6})`);
    glowGrad.addColorStop(0.5, `rgba(59, 130, 246, ${pulse.opacity * 0.2})`);
    glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, pulse.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Pulse core
    ctx.fillStyle = `rgba(147, 197, 253, ${pulse.opacity})`;
    ctx.beginPath();
    ctx.arc(px, py, pulse.size, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    if (pulse.trail > 0) {
      const trailSteps = 4;
      for (let s = 1; s <= trailSteps; s++) {
        const tt = Math.max(0, pt - s * 0.03 * pulse.trail);
        const tx = (1 - tt) * (1 - tt) * from.x + 2 * (1 - tt) * tt * (mx + perpX) + tt * tt * to.x;
        const ty = (1 - tt) * (1 - tt) * from.y + 2 * (1 - tt) * tt * (my + perpY) + tt * tt * to.y;
        const trailAlpha = pulse.opacity * (1 - s / (trailSteps + 1)) * 0.4;
        ctx.fillStyle = `rgba(96, 165, 250, ${trailAlpha})`;
        ctx.beginPath();
        ctx.arc(tx, ty, pulse.size * (1 - s * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function updatePulses(simEdge: SimEdge, dt: number, from: SimNode, to: SimNode) {
  const rate = simEdge.edge.ratePerMin ?? 0;

  // Spawn new pulses based on rate
  if (rate > 0 && Math.random() < (rate / 60) * (dt / 1000) * 3) {
    simEdge.pulses.push({
      t: 0,
      speed: 0.15 + Math.random() * 0.15,
      size: 2 + Math.random() * 2,
      opacity: 0.6 + Math.random() * 0.4,
      trail: 1 + Math.random() * 2,
    });
  }

  // Update existing pulses
  for (let i = simEdge.pulses.length - 1; i >= 0; i--) {
    const pulse = simEdge.pulses[i];
    pulse.t += pulse.speed * dt * 0.001;
    pulse.opacity *= 0.998;

    // Remove completed pulses
    if (pulse.t > 1 || pulse.opacity < 0.05) {
      simEdge.pulses.splice(i, 1);
    }
  }

  // Cap max pulses per edge
  if (simEdge.pulses.length > 8) {
    simEdge.pulses.splice(0, simEdge.pulses.length - 8);
  }
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  sn: SimNode,
  t: number,
  isHovered: boolean,
  pixelFace?: boolean[][],
) {
  const { node, x, y, radius, phase, breathRate, particles } = sn;
  const colors = STATUS_COLORS[node.status] || STATUS_COLORS.offline;
  const shape = ROLE_SHAPES[node.role] || ROLE_SHAPES.other;

  // Breathing animation
  const breath = Math.sin(t * breathRate + phase) * 0.06;
  const animRadius = radius * (1 + breath);
  const hoverScale = isHovered ? 1.15 : 1;
  const finalRadius = animRadius * hoverScale;

  ctx.save();
  ctx.translate(x, y);

  // --- Outer glow ---
  const glowSize = finalRadius * (node.status === 'active' ? 2.5 : 1.8);
  const glowIntensity = node.status === 'active' ? 0.15 : node.status === 'error' ? 0.12 : 0.05;
  const outerGlow = ctx.createRadialGradient(0, 0, finalRadius * 0.5, 0, 0, glowSize);
  outerGlow.addColorStop(0, hexToRgba(colors.glow, glowIntensity * (isHovered ? 2 : 1)));
  outerGlow.addColorStop(0.6, hexToRgba(colors.glow, glowIntensity * 0.3));
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
  ctx.fill();

  // --- Particles orbiting the node ---
  for (const p of particles) {
    p.angle += p.speed * 0.02;
    const px = Math.cos(p.angle) * p.distance * (1 + breath * 0.5);
    const py = Math.sin(p.angle) * p.distance * (1 + breath * 0.5);
    const pAlpha = p.opacity * (0.6 + Math.sin(t * 2 + p.angle) * 0.4);
    ctx.fillStyle = hexToRgba(colors.particle, pAlpha);
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Inner shape (polygon) ---
  ctx.beginPath();
  const points = shape.points;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? finalRadius : finalRadius * shape.innerRatio;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Fill with gradient
  const nodeGrad = ctx.createRadialGradient(0, -finalRadius * 0.3, 0, 0, 0, finalRadius);
  nodeGrad.addColorStop(0, hexToRgba(colors.core, 0.9));
  nodeGrad.addColorStop(0.7, hexToRgba(colors.glow, 0.6));
  nodeGrad.addColorStop(1, hexToRgba(colors.glow, 0.3));
  ctx.fillStyle = nodeGrad;
  ctx.fill();

  // Border
  ctx.strokeStyle = hexToRgba(colors.core, isHovered ? 0.9 : 0.5);
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.stroke();

  // --- Pixel face ---
  if (pixelFace) {
    const cellSize = finalRadius * 0.2;
    const faceW = 5 * cellSize;
    const faceH = 5 * cellSize;
    const startX = -faceW / 2;
    const startY = -faceH / 2;

    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (pixelFace[gy][gx]) {
          const pixAlpha = 0.7 + Math.sin(t * 1.5 + gx * 0.5 + gy * 0.7) * 0.2;
          ctx.fillStyle = `rgba(255, 255, 255, ${pixAlpha})`;
          ctx.fillRect(
            startX + gx * cellSize + 0.5,
            startY + gy * cellSize + 0.5,
            cellSize - 1,
            cellSize - 1,
          );
        }
      }
    }
  }

  // --- Error indicator (pulsing ring) ---
  if (node.status === 'error') {
    const errorPulse = Math.sin(t * 4) * 0.3 + 0.5;
    ctx.strokeStyle = `rgba(239, 68, 68, ${errorPulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, finalRadius * 1.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Active indicator (outer ring shimmer) ---
  if (node.status === 'active') {
    const shimmer = Math.sin(t * 2 + phase) * 0.15 + 0.2;
    ctx.strokeStyle = `rgba(59, 130, 246, ${shimmer})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, finalRadius * 1.4, t * 0.3, t * 0.3 + Math.PI * 1.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- Name label ---
  ctx.fillStyle = isHovered ? '#e2e8f0' : '#94a3b8';
  ctx.font = `${isHovered ? '600' : '500'} ${isHovered ? 11 : 10}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(node.name, 0, finalRadius + 8);

  // Model label (subtle)
  if (node.modelPrimary) {
    ctx.fillStyle = '#475569';
    ctx.font = '400 8px "JetBrains Mono", monospace';
    ctx.fillText(node.modelPrimary, 0, finalRadius + 22);
  }

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
