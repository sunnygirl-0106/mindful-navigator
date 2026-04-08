import { useEffect, useRef } from 'react';
import { getHudData } from '@/lib/timeline';

interface PerceptionPanelProps {
  currentTime: number;
  stageId: string;
}

// Particle field canvas for Slot A
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const particles: { x: number; y: number; z: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 300; i++) {
      particles.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
      });
    }

    const draw = () => {
      const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (Math.abs(p.x) > 1) p.vx *= -1;
        if (Math.abs(p.y) > 1) p.vy *= -1;

        const sx = (p.x + 1) / 2 * w;
        const sy = (p.y + 1) / 2 * h;
        const size = (0.5 + p.z * 1.5) * window.devicePixelRatio;
        const alpha = 0.15 + p.z * 0.5;

        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 17, 22, ${alpha})`;
        ctx.fill();
      }

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

function DepthGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let offset = 0;

    const draw = () => {
      const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      offset += 0.5;

      const grad = ctx.createLinearGradient(offset % w, 0, (offset + w) % (w * 2), h);
      grad.addColorStop(0, '#FF4500');
      grad.addColorStop(0.25, '#FFD700');
      grad.addColorStop(0.5, '#00FF88');
      grad.addColorStop(0.75, '#0088FF');
      grad.addColorStop(1, '#000066');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Scanline */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent scanline" />
      </div>
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
