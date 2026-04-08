import { useState, useEffect, useRef } from 'react';
import { THINKING_STAGES, type TimelineBubble, type ThinkingStage } from '@/lib/timeline';

interface ThinkingPanelProps {
  stageId: string;
  currentTime: number;
}

function BubbleChip({ chip, role }: { chip: string; role: 'brain' | 'world' }) {
  const colorClass = role === 'brain'
    ? 'bg-[hsl(var(--brain-blue)/0.12)] text-[hsl(var(--brain-blue))]'
    : 'bg-[hsl(var(--world-violet)/0.12)] text-[hsl(var(--world-violet))]';

  return (
    <span className={`inline-block font-mono-code text-[10px] px-1.5 py-0.5 rounded ${colorClass}`}>
      {chip}
    </span>
  );
}

function ChatBubble({ bubble, index, isVisible }: { bubble: TimelineBubble; index: number; isVisible: boolean }) {
  const [showWaiting, setShowWaiting] = useState(bubble.isWaiting ?? false);

  useEffect(() => {
    if (!bubble.isWaiting || !isVisible) return;
    setShowWaiting(true);
    const timer = setTimeout(() => setShowWaiting(false), 800 + Math.random() * 400);
    return () => clearTimeout(timer);
  }, [bubble.isWaiting, isVisible]);

  const isBrain = bubble.role === 'brain';
  const roleIcon = isBrain ? '🧠' : '🌐';
  const roleLabel = isBrain ? 'BRAIN · 决策模型' : 'WORLD · 世界模型';
  const bubbleClass = isBrain ? 'bubble-brain' : 'bubble-world';
  const alignClass = isBrain ? 'mr-auto ml-[68px]' : 'ml-auto mr-[68px]';
  const opacity = bubble.chip === 'background' ? 'opacity-[0.78]' : '';

  if (!isVisible) return null;

  return (
    <div className="relative">
      {/* Timestamp on axis */}
      <div className="flex justify-center mb-1">
        <span className="font-mono-code text-[10px] text-muted-foreground bg-card border border-border rounded-full px-2 py-0.5 z-10 relative">
          {bubble.time}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`${alignClass} max-w-[42%] ${bubbleClass} rounded-lg p-3 ${opacity} transition-all duration-200`}
        style={{
          animation: `fade-in-up 180ms ease-out ${index * 50}ms both`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm">{roleIcon}</span>
          <span className="font-mono-code text-[10px] text-muted-foreground uppercase">{roleLabel}</span>
          {bubble.chip && <BubbleChip chip={bubble.chip} role={bubble.role} />}
        </div>

        {/* Content */}
        {showWaiting ? (
          <div className="font-mono-code text-xs text-muted-foreground border border-dashed border-current/30 rounded p-2">
            <span className="blink-caret">▌</span> {bubble.waitingText}
          </div>
        ) : (
          <div className="font-mono-code text-xs leading-relaxed text-foreground whitespace-pre-wrap">
            {bubble.lines.join('\n')}
          </div>
        )}
      </div>

      {/* Arrow connector */}
      <div className="flex justify-center my-1">
        <span className="text-border text-xs">↓</span>
      </div>
    </div>
  );
}

function MissionComplete() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center" style={{ animation: 'fade-in-up 400ms ease-out' }}>
        <div className="text-5xl font-display font-semibold text-foreground mb-2">MISSION COMPLETE</div>
        <div className="text-3xl font-display text-muted-foreground">任务完成</div>
        <div className="mt-4 w-16 h-0.5 bg-[hsl(var(--success-green))] mx-auto rounded-full" />
      </div>
    </div>
  );
}

export function ThinkingPanel({ stageId, currentTime }: ThinkingPanelProps) {
  const stage = THINKING_STAGES[stageId];
  const [visibleCount, setVisibleCount] = useState(0);
  const prevStageRef = useRef(stageId);

  // Progressively reveal bubbles
  useEffect(() => {
    if (prevStageRef.current !== stageId) {
      setVisibleCount(0);
      prevStageRef.current = stageId;
    }

    if (!stage) return;
    const total = stage.bubbles.length;
    if (visibleCount >= total) return;

    const timer = setTimeout(() => {
      setVisibleCount(c => c + 1);
    }, visibleCount === 0 ? 400 : 800 + Math.random() * 600);

    return () => clearTimeout(timer);
  }, [stageId, stage, visibleCount]);

  if (stageId === 'loop_reset') {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono-code text-sm text-muted-foreground" style={{ animation: 'fade-in-up 300ms ease-out' }}>
          restarting demo…
        </span>
      </div>
    );
  }

  if (!stage) {
    return <div className="h-full flex items-center justify-center text-muted-foreground font-mono-code text-sm">—</div>;
  }

  const showMissionComplete = stageId === 'done' && visibleCount >= stage.bubbles.length;

  return (
    <div className="flex h-full">
      {/* Left rail - BRAIN */}
      <div className="w-[60px] rail-brain flex flex-col items-center justify-between py-6 shrink-0">
        <div className="text-center">
          <div className="text-lg mb-1">🧠</div>
          <div className="font-mono-code text-[9px] text-[hsl(var(--brain-blue))] font-medium uppercase leading-tight">
            BRAIN<br />决策模型
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[hsl(var(--brain-blue))] breathe-dot" />
      </div>

      {/* Center timeline */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Stage title */}
        <div className="text-center py-4 shrink-0" style={{ animation: 'fade-in-up 300ms ease-out' }}>
          <span className="font-mono-code text-xs text-muted-foreground">
            步骤 {stage.stepNum} / {stage.totalSteps}
          </span>
          <h2 className="font-display text-sm font-medium text-foreground mt-0.5">
            {stage.titleCn} · {stage.titleEn}
          </h2>
        </div>

        {/* Dashed axis */}
        <div className="absolute left-1/2 top-14 bottom-0 w-px border-l border-dashed border-border -translate-x-px pointer-events-none" />

        {/* Bubbles */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 relative">
          {stage.bubbles.map((bubble, i) => (
            <ChatBubble key={`${stageId}-${i}`} bubble={bubble} index={i} isVisible={i < visibleCount} />
          ))}
        </div>

        {/* Mission complete overlay */}
        {showMissionComplete && <MissionComplete />}
      </div>

      {/* Right rail - WORLD */}
      <div className="w-[60px] rail-world flex flex-col items-center justify-between py-6 shrink-0">
        <div className="text-center">
          <div className="text-lg mb-1">🌐</div>
          <div className="font-mono-code text-[9px] text-[hsl(var(--world-violet))] font-medium uppercase leading-tight">
            WORLD<br />世界模型
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[hsl(var(--world-violet))] breathe-dot" />
      </div>
    </div>
  );
}
