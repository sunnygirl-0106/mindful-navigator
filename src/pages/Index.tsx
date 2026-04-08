import { useTimeline } from '@/hooks/useTimeline';
import { TopBar } from '@/components/TopBar';
import { BottomBar } from '@/components/BottomBar';
import { PerceptionPanel } from '@/components/PerceptionPanel';
import { ThinkingPanel } from '@/components/ThinkingPanel';
import { THINKING_STAGES } from '@/lib/timeline';

const STEP_LABELS: Record<number, { cn: string; en: string }> = {
  0: { cn: '系统启动', en: 'Boot' },
  1: { cn: '初始化与搜寻', en: 'Initialize & Search' },
  2: { cn: '选择目标', en: 'Select Target' },
  3: { cn: '回忆与转向', en: 'Recall & Turn' },
};

const Index = () => {
  const { currentTime, mode, stageId, stepNum, isPaused, isLive, primaryLang } = useTimeline();

  const stepLabel = STEP_LABELS[stepNum] ?? STEP_LABELS[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden relative">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Min-width guard */}
      <div className="hidden max-[1279px]:flex fixed inset-0 z-50 bg-background items-center justify-center p-8">
        <p className="font-display text-sm text-muted-foreground text-center">
          Please open on a screen ≥ 1280px wide for the best experience.
        </p>
      </div>

      <TopBar mode={mode} currentTime={currentTime} primaryLang={primaryLang} />

      {/* Panels with cross-fade */}
      <div className="flex-1 relative min-h-0">
        <div
          className="absolute inset-0 transition-opacity"
          style={{ opacity: mode === 'perception' ? 1 : 0, pointerEvents: mode === 'perception' ? 'auto' : 'none', transitionDuration: '400ms' }}
        >
          <PerceptionPanel currentTime={currentTime} stageId={stageId} />
        </div>
        <div
          className="absolute inset-0 transition-opacity"
          style={{ opacity: mode === 'thinking' ? 1 : 0, pointerEvents: mode === 'thinking' ? 'auto' : 'none', transitionDuration: '400ms' }}
        >
          <ThinkingPanel stageId={stageId} currentTime={currentTime} />
        </div>
      </div>

      <BottomBar
        stepNum={stepNum}
        totalSteps={3}
        stageTitleCn={stepLabel.cn}
        stageTitleEn={stepLabel.en}
        isLive={isLive}
      />
    </div>
  );
};

export default Index;
