import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentTimelineEvent, type Mode, type TimelineEvent, TIMELINE } from '@/lib/timeline';

const TOTAL_DURATION = 65;

export function useTimeline() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [primaryLang, setPrimaryLang] = useState<'cn' | 'en'>('cn');
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const currentEvent = getCurrentTimelineEvent(currentTime);

  const reset = useCallback(() => setCurrentTime(0), []);

  const jumpNext = useCallback(() => {
    const idx = TIMELINE.findIndex(ev => ev.t > currentTime);
    if (idx >= 0) setCurrentTime(TIMELINE[idx].t);
    else setCurrentTime(0);
  }, [currentTime]);

  useEffect(() => {
    if (isPaused) return;

    const tick = (now: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTime(prev => {
        const next = prev + dt;
        if (next >= TOTAL_DURATION) return 0;
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPaused(p => !p);
          break;
        case 'r':
        case 'R':
          reset();
          break;
        case 'ArrowRight':
          jumpNext();
          break;
        case 'l':
        case 'L':
          setPrimaryLang(l => l === 'cn' ? 'en' : 'cn');
          break;
        case 'm':
        case 'M':
          setIsLive(l => !l);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset, jumpNext]);

  return {
    currentTime,
    currentEvent,
    isPaused,
    isLive,
    primaryLang,
    mode: currentEvent.mode as Mode,
    stageId: currentEvent.stageId,
    stepNum: currentEvent.stepNum ?? 0,
  };
}
