import { formatTime, type Mode } from '@/lib/timeline';

interface TopBarProps {
  mode: Mode;
  currentTime: number;
  primaryLang: 'cn' | 'en';
}

const commandCn = '先走到离你最远的球那里，再走到出发前身后的球那里。';
const commandEn = 'First walk to the farthest ball, then walk to the ball that was behind you at the start.';

export function TopBar({ mode, currentTime, primaryLang }: TopBarProps) {
  const modeLabel = mode === 'perception' ? 'PERCEPTION 感知态' : 'THINKING 思考态';

  return (
    <div className="h-12 flex items-center px-6 gap-6 border-b border-border bg-card shrink-0 z-20">
      {/* Wordmark */}
      <span className="font-display font-semibold text-sm tracking-widest text-foreground whitespace-nowrap">
        EMBODIED · AI DEMO
      </span>

      {/* Command */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight truncate">
          {primaryLang === 'cn' ? commandCn : commandEn}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight truncate">
          {primaryLang === 'cn' ? commandEn : commandCn}
        </p>
      </div>

      {/* Mode Badge */}
      <div className="px-3 py-1 rounded-full bg-foreground text-primary-foreground text-xs font-mono-code font-medium pulse-badge whitespace-nowrap">
        {modeLabel}
      </div>

      {/* Timer */}
      <span className="font-mono-code text-sm text-muted-foreground tabular-nums">
        {formatTime(currentTime)}
      </span>
    </div>
  );
}
