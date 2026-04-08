interface BottomBarProps {
  stepNum: number;
  totalSteps: number;
  stageTitleCn: string;
  stageTitleEn: string;
  isLive: boolean;
}

export function BottomBar({ stepNum, totalSteps, stageTitleCn, stageTitleEn, isLive }: BottomBarProps) {
  return (
    <div className="h-12 flex items-center px-6 gap-4 border-t border-border bg-card shrink-0 z-20">
      {/* Step dots */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i + 1 <= stepNum ? 'bg-foreground' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step label */}
      <span className="font-mono-code text-xs text-muted-foreground">
        STEP {stepNum} / {totalSteps} · {stageTitleCn} / {stageTitleEn}
      </span>

      <div className="flex-1" />

      {/* Status */}
      <span className="font-mono-code text-[11px] text-muted-foreground">
        ROS bridge: {isLive ? 'LIVE' : 'MOCK'} · 60 FPS
      </span>
    </div>
  );
}
