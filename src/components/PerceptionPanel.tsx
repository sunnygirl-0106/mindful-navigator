import { useEffect, useRef } from 'react';
import { getHudData } from '@/lib/timeline';

interface PerceptionPanelProps {
  currentTime: number;
  stageId: string;
}

// 3D point-cloud canvas for Slot A — simulates a scanned indoor environment
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Build a static point cloud resembling a room with objects
    const points: { x: number; y: number; z: number; r: number; g: number; b: number }[] = [];

    const addPt = (x: number, y: number, z: number, r: number, g: number, b: number) => {
      // add slight noise for realism
      points.push({
        x: x + (Math.random() - 0.5) * 0.06,
        y: y + (Math.random() - 0.5) * 0.06,
        z: z + (Math.random() - 0.5) * 0.06,
        r, g, b,
      });
    };

    // Floor grid (y = -1)
    for (let i = 0; i < 800; i++) {
      const fx = (Math.random() - 0.5) * 6;
      const fz = (Math.random() - 0.5) * 6;
      addPt(fx, -1, fz, 90, 100, 110);
    }

    // Back wall (z = -3)
    for (let i = 0; i < 400; i++) {
      const wx = (Math.random() - 0.5) * 6;
      const wy = Math.random() * 2.5 - 1;
      addPt(wx, wy, -3, 130, 135, 145);
    }

    // Left wall (x = -3)
    for (let i = 0; i < 300; i++) {
      const wz = (Math.random() - 0.5) * 6;
      const wy = Math.random() * 2.5 - 1;
      addPt(-3, wy, wz, 120, 125, 140);
    }

    // Right wall (x = 3)
    for (let i = 0; i < 300; i++) {
      const wz = (Math.random() - 0.5) * 6;
      const wy = Math.random() * 2.5 - 1;
      addPt(3, wy, wz, 120, 125, 140);
    }

    // Box / table (centered object)
    for (let i = 0; i < 350; i++) {
      const bx = (Math.random() - 0.5) * 1.2 + 0.8;
      const by = Math.random() * 0.8 - 1;
      const bz = (Math.random() - 0.5) * 1.2 - 0.5;
      addPt(bx, by, bz, 60, 180, 160);
    }
    // Table top
    for (let i = 0; i < 150; i++) {
      const bx = (Math.random() - 0.5) * 1.4 + 0.8;
      const bz = (Math.random() - 0.5) * 1.4 - 0.5;
      addPt(bx, -0.2, bz, 50, 200, 170);
    }

    // Sphere-ish object (ball_A)
    for (let i = 0; i < 250; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 0.35;
      addPt(
        Math.sin(phi) * Math.cos(theta) * rad - 1.2,
        Math.sin(phi) * Math.sin(theta) * rad - 0.65,
        Math.cos(phi) * rad - 1.0,
        240, 80, 60,
      );
    }

    // Small cylinder (ball_B)
    for (let i = 0; i < 180; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.25;
      const cy = Math.random() * 0.6 - 1;
      addPt(
        Math.cos(angle) * rad + 1.8,
        cy,
        Math.sin(angle) * rad + 1.2,
        80, 120, 240,
      );
    }

    let angleY = 0;

    // Perspective project
    const project = (x: number, y: number, z: number, w: number, h: number, ay: number) => {
      const cosA = Math.cos(ay), sinA = Math.sin(ay);
      const rx = x * cosA - z * sinA;
      const rz = x * sinA + z * cosA;
      const depth = rz + 6; // push everything in front of camera
      if (depth < 0.3) return null;
      const fov = 1.8;
      const sx = (rx * fov / depth + 0.5) * w;
      const sy = (y * fov / depth + 0.4) * h;
      return { sx, sy, depth };
    };

    const draw = () => {
      const dpr = window.devicePixelRatio;
      const w = canvas.width = canvas.offsetWidth * dpr;
      const h = canvas.height = canvas.offsetHeight * dpr;

      // Dark background
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(0, 0, w, h);

      // Subtle grid on the "floor"
      ctx.strokeStyle = 'rgba(60,70,90,0.15)';
      ctx.lineWidth = dpr;
      angleY += 0.003;

      // Sort points back-to-front for proper overlap
      const projected = points.map(p => {
        const proj = project(p.x, p.y, p.z, w, h, angleY);
        return proj ? { ...proj, r: p.r, g: p.g, b: p.b } : null;
      }).filter(Boolean) as { sx: number; sy: number; depth: number; r: number; g: number; b: number }[];

      projected.sort((a, b) => b.depth - a.depth);

      for (const p of projected) {
        const size = Math.max(1, (3.5 / p.depth) * dpr);
        const alpha = Math.min(1, Math.max(0.2, 1.2 - p.depth * 0.1));
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.fill();
      }

      // Overlay: axis indicator (bottom-left)
      const axLen = 30 * dpr;
      const axOx = 50 * dpr, axOy = h - 40 * dpr;
      const cosA = Math.cos(angleY), sinA = Math.sin(angleY);
      ctx.lineWidth = 1.5 * dpr;
      // X axis (red)
      ctx.beginPath(); ctx.moveTo(axOx, axOy);
      ctx.lineTo(axOx + cosA * axLen, axOy); ctx.strokeStyle = 'rgba(240,80,60,0.8)'; ctx.stroke();
      // Z axis (blue)
      ctx.beginPath(); ctx.moveTo(axOx, axOy);
      ctx.lineTo(axOx + sinA * axLen, axOy - Math.abs(cosA) * axLen * 0.5); ctx.strokeStyle = 'rgba(80,120,240,0.8)'; ctx.stroke();
      // Y axis (green)
      ctx.beginPath(); ctx.moveTo(axOx, axOy);
      ctx.lineTo(axOx, axOy - axLen); ctx.strokeStyle = 'rgba(60,200,140,0.8)'; ctx.stroke();

      // Point count label
      ctx.font = `${10 * dpr}px monospace`;
      ctx.fillStyle = 'rgba(140,160,180,0.6)';
      ctx.fillText(`${points.length.toLocaleString()} pts`, w - 70 * dpr, h - 16 * dpr);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function SlotLabel({ label, tag }: { label: string; tag: string }) {
  return (
    <>
      <div className="absolute top-3 left-3 z-10 glass-label rounded-md px-2 py-1">
        <span className="font-mono-code text-[11px] font-medium text-foreground uppercase">{label}</span>
      </div>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 glass-label rounded-md px-2 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success-green))] stream-alive" />
        <span className="font-mono-code text-[10px] text-muted-foreground">{tag}</span>
      </div>
    </>
  );
}

// Depth-map canvas for Slot B — simulates a room-like depth image with objects
function DepthGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;

    // Depth-to-color mapping (Turbo-like colormap: near=red/yellow, mid=green/cyan, far=blue/purple)
    const depthColor = (d: number): [number, number, number] => {
      // d in [0,1], 0=near(warm), 1=far(cool)
      const t = Math.max(0, Math.min(1, d));
      if (t < 0.25) {
        const s = t / 0.25;
        return [255, Math.round(60 + 160 * s), Math.round(30 * s)];
      } else if (t < 0.5) {
        const s = (t - 0.25) / 0.25;
        return [Math.round(255 - 140 * s), Math.round(220 + 35 * s), Math.round(30 + 100 * s)];
      } else if (t < 0.75) {
        const s = (t - 0.5) / 0.25;
        return [Math.round(115 - 80 * s), Math.round(255 - 80 * s), Math.round(130 + 100 * s)];
      } else {
        const s = (t - 0.75) / 0.25;
        return [Math.round(35 + 40 * s), Math.round(175 - 100 * s), Math.round(230 + 25 * s)];
      }
    };

    // Pre-compute a "scene" depth map at lower res, then upscale
    const COLS = 160, ROWS = 120;
    const baseDepth = new Float32Array(COLS * ROWS);

    // Generate base room depth field
    const generateDepth = (t: number) => {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const nx = col / COLS;         // 0..1
          const ny = row / ROWS;         // 0..1

          // Floor plane: depth increases toward top of image (further away)
          let depth = 0.3 + (1 - ny) * 0.55;

          // Back wall — appears in upper portion
          if (ny < 0.45) {
            depth = 0.75 + (0.45 - ny) * 0.3;
          }

          // Left wall
          if (nx < 0.12) {
            depth = 0.4 + nx * 2;
          }

          // Right wall
          if (nx > 0.88) {
            depth = 0.4 + (1 - nx) * 2;
          }

          // Table / box (center-right of image)
          const tbx = nx - 0.62, tby = ny - 0.65;
          if (Math.abs(tbx) < 0.13 && Math.abs(tby) < 0.12) {
            depth = 0.28 + Math.abs(tby) * 0.15;
          }

          // Sphere object (left side) with gentle oscillation
          const sOff = Math.sin(t * 0.8) * 0.02;
          const sx = nx - 0.28 + sOff, sy = ny - 0.6;
          const sDist = Math.sqrt(sx * sx + sy * sy);
          if (sDist < 0.09) {
            depth = 0.18 + sDist * 0.8;
          }

          // Small pillar (right)
          const px = nx - 0.8, py = ny - 0.55;
          if (Math.abs(px) < 0.04 && py > -0.15 && py < 0.15) {
            depth = 0.32;
          }

          // Sensor noise
          depth += (Math.random() - 0.5) * 0.025;

          baseDepth[row * COLS + col] = depth;
        }
      }
    };

    const draw = () => {
      const dpr = window.devicePixelRatio;
      const w = canvas.width = canvas.offsetWidth * dpr;
      const h = canvas.height = canvas.offsetHeight * dpr;
      frame++;
      const t = frame * 0.02;

      generateDepth(t);

      // Draw pixel-scaled depth map
      const imgData = ctx.createImageData(COLS, ROWS);
      for (let i = 0; i < COLS * ROWS; i++) {
        const [r, g, b] = depthColor(baseDepth[i]);
        imgData.data[i * 4] = r;
        imgData.data[i * 4 + 1] = g;
        imgData.data[i * 4 + 2] = b;
        imgData.data[i * 4 + 3] = 255;
      }

      // Draw to offscreen canvas then scale up
      const offscreen = new OffscreenCanvas(COLS, ROWS);
      const offCtx = offscreen.getContext('2d')!;
      offCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(offscreen, 0, 0, w, h);

      // Scanline overlay
      const scanY = ((frame * 2) % (h + 40 * dpr)) - 20 * dpr;
      const scanGrad = ctx.createLinearGradient(0, scanY - 15 * dpr, 0, scanY + 15 * dpr);
      scanGrad.addColorStop(0, 'rgba(255,255,255,0)');
      scanGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      scanGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 15 * dpr, w, 30 * dpr);

      // Depth scale bar (right edge)
      const barW = 8 * dpr, barH = h * 0.5, barX = w - 20 * dpr, barY = h * 0.25;
      for (let i = 0; i < barH; i++) {
        const [r, g, b] = depthColor(i / barH);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(barX, barY + i, barW, 1);
      }
      ctx.font = `${9 * dpr}px monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('near', barX - 4 * dpr, barY - 4 * dpr);
      ctx.fillText('far', barX + 1 * dpr, barY + barH + 12 * dpr);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0c1018]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

function RGBPlaceholder() {
  return (
    <div className="relative w-full h-full bg-[hsl(220,6%,80%)] flex items-center justify-center">
      {/* Crosshair */}
      <div className="absolute w-6 h-px bg-foreground/30" />
      <div className="absolute h-6 w-px bg-foreground/30" />
      <div className="absolute w-3 h-3 border border-foreground/20 rounded-full" />
    </div>
  );
}

function HudBar({ currentTime, stageId }: { currentTime: number; stageId: string }) {
  const hud = getHudData(currentTime, stageId);

  return (
    <div className="h-10 flex items-center gap-6 px-4 bg-card border-t border-border font-mono-code text-[11px] text-muted-foreground overflow-x-auto">
      <span>pose <span className="text-foreground">{hud.pose}</span></span>
      <span>heading <span className="text-foreground">{hud.heading}</span></span>
      <span>landmarks <span className="text-foreground">{hud.landmarks}</span></span>
      <span>action <span className="text-foreground">{hud.action}</span></span>
      {hud.target && <span>target <span className="text-foreground">{hud.target}</span></span>}
      {hud.eta && <span>ETA <span className="text-foreground">{hud.eta}</span></span>}
      <div className="flex-1" />
      <span>{hud.slamActive ? 'SLAM Active' : 'SLAM Idle'} · {hud.fps} FPS</span>
    </div>
  );
}

export function PerceptionPanel({ currentTime, stageId }: PerceptionPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        {/* Slot A - Hero */}
        <div className="relative flex-[64] rounded-md border border-border overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-card)' }}>
          <SlotLabel label="Slot A · 世界模型 3D 实时重建 / 3D Reconstruction" tag="src=mock · live: Three.js + 10.100.129.68:8006" />
          <ParticleCanvas />
        </div>

        {/* Right stack */}
        <div className="flex-[36] flex flex-col gap-3 min-h-0">
          {/* Slot B */}
          <div className="relative flex-1 rounded-md border border-border overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <SlotLabel label="Slot B · 世界模型深度图 / Depth Stream" tag="src=mock · live: MJPEG 640×480" />
            <DepthGradient />
          </div>

          {/* Slot C */}
          <div className="relative flex-1 rounded-md border border-border overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-card)' }}>
            <SlotLabel label="Slot C · 机器人第一视角 / RGB Stream" tag="src=mock · live: MJPEG 640×480" />
            <RGBPlaceholder />
          </div>
        </div>
      </div>

      <HudBar currentTime={currentTime} stageId={stageId} />
    </div>
  );
}
