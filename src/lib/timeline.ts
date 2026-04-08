// ============================================================
// TIMELINE ENGINE
// This is the single integration point. To replace mock data
// with real ROS messages, replace the `TIMELINE` array entries
// and the `dispatchEvent` calls with ROS bridge subscriptions.
// ============================================================

export type Mode = 'perception' | 'thinking';

export interface TimelineBubble {
  time: string;        // "00:03"
  role: 'brain' | 'world';
  chip?: 'active' | 'replying' | 'computing' | 'recalling' | 'background';
  lines: string[];
  isWaiting?: boolean; // show dashed waiting bubble first
  waitingText?: string;
}

export interface ThinkingStage {
  id: string;
  titleCn: string;
  titleEn: string;
  stepNum: number;
  totalSteps: number;
  bubbles: TimelineBubble[];
}

export interface TimelineEvent {
  t: number;           // seconds
  mode: Mode;
  stageId: string;
  stageTitleCn?: string;
  stageTitleEn?: string;
  stepNum?: number;
  events?: string[];   // e.g. ['landmark_locked:ball_A']
}

export const THINKING_STAGES: Record<string, ThinkingStage> = {
  boot: {
    id: 'boot',
    titleCn: '系统启动',
    titleEn: 'System Boot',
    stepNum: 0,
    totalSteps: 3,
    bubbles: [
      { time: '00:00', role: 'brain', chip: 'active', lines: ['system online'] },
      { time: '00:01', role: 'world', chip: 'replying', lines: ['loading SSM…', 'world model ready ✓'] },
    ],
  },
  stage1: {
    id: 'stage1',
    titleCn: '初始化与搜寻',
    titleEn: 'Initialize & Search',
    stepNum: 1,
    totalSteps: 3,
    bubbles: [
      { time: '00:03', role: 'brain', chip: 'active', lines: ['发送查询  find(label="ball")'] },
      { time: '00:04', role: 'world', chip: 'replying', lines: ['扫描当前 FOV  →  result: NOT_FOUND'] },
      { time: '00:05', role: 'brain', chip: 'active', lines: ['决定旋转探索  issue: spin_360()'] },
      {
        time: '00:06', role: 'world', chip: 'background', lines: [
          '开始累积 SSM 地图…',
          'landmark ball_A (3.0, 0.0) ✓',
          'landmark ball_B (0.0, -2.0) ✓',
        ]
      },
    ],
  },
  stage2: {
    id: 'stage2',
    titleCn: '明确"最远的球"',
    titleEn: 'Select Farthest Target',
    stepNum: 2,
    totalSteps: 3,
    bubbles: [
      {
        time: '00:19', role: 'brain', chip: 'active', lines: [
          '"已检测到 2 个 ball。要去最远的那个。"',
          'get_target(label="ball",',
          '           constraint="max_distance",',
          '           reference="current_pose")',
        ]
      },
      {
        time: '00:20', role: 'world', chip: 'computing',
        isWaiting: true, waitingText: 'computing distances…',
        lines: [
          'computing distances from (0,0)…',
          'ball_A=3.0m  ball_B=2.0m  →  max=ball_A',
          'return: target_id=ball_02, coords=(3.0, 0.0)',
        ]
      },
      { time: '00:21', role: 'brain', chip: 'active', lines: ['issue: navigate_to((3.0, 0.0))'] },
    ],
  },
  stage3: {
    id: 'stage3',
    titleCn: '明确"身后的球"',
    titleEn: 'Recall & Turn',
    stepNum: 3,
    totalSteps: 3,
    bubbles: [
      { time: '00:32', role: 'brain', chip: 'active', lines: ['"我已到达第一个球。现在去出发点身后的那个。"'] },
      {
        time: '00:33', role: 'brain', chip: 'active', lines: [
          'get_target(label="ball",',
          '           constraint="relative_behind",',
          '           reference="pose_at_time_0")',
        ]
      },
      {
        time: '00:34', role: 'world', chip: 'recalling',
        isWaiting: true, waitingText: 'recalling pose_at_time_0…',
        lines: [
          'recalling pose_at_time_0…',
          'pose_0 = (0, 0)',
          'ball_01 在 pose_0 后方',
          'return: coords=(0.0, -2.0)',
        ]
      },
      { time: '00:35', role: 'brain', chip: 'active', lines: ['issue: turn & navigate_to((0.0, -2.0))'] },
    ],
  },
  done: {
    id: 'done',
    titleCn: '任务完成',
    titleEn: 'Mission Complete',
    stepNum: 3,
    totalSteps: 3,
    bubbles: [
      { time: '00:55', role: 'brain', chip: 'active', lines: ['task complete'] },
      { time: '00:56', role: 'world', chip: 'replying', lines: ['2 targets reached, 0 collisions'] },
    ],
  },
};

export const TIMELINE: TimelineEvent[] = [
  { t: 0, mode: 'thinking', stageId: 'boot', stepNum: 0 },
  { t: 3, mode: 'thinking', stageId: 'stage1', stepNum: 1 },
  { t: 8, mode: 'perception', stageId: 'perception_spin', stepNum: 1, events: ['landmark_locked:ball_A', 'landmark_locked:ball_B'] },
  { t: 18, mode: 'thinking', stageId: 'stage2', stepNum: 2 },
  { t: 22, mode: 'perception', stageId: 'perception_walk1', stepNum: 2 },
  { t: 32, mode: 'thinking', stageId: 'stage3', stepNum: 3 },
  { t: 36, mode: 'perception', stageId: 'perception_walk2', stepNum: 3 },
  { t: 55, mode: 'thinking', stageId: 'done', stepNum: 3 },
  { t: 62, mode: 'thinking', stageId: 'loop_reset', stepNum: 0 },
];

export function getCurrentTimelineEvent(t: number): TimelineEvent {
  let current = TIMELINE[0];
  for (const ev of TIMELINE) {
    if (t >= ev.t) current = ev;
    else break;
  }
  return current;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// HUD data interpolation for perception mode
export function getHudData(t: number, stageId: string) {
  const base = {
    pose: '(0.0, 0.0)',
    heading: '000°',
    landmarks: '—',
    action: 'idle',
    slamActive: true,
    fps: 60,
    target: '',
    eta: '',
  };

  if (stageId === 'perception_spin') {
    const progress = Math.min((t - 8) / 10, 1);
    const heading = Math.floor(progress * 360);
    return {
      ...base,
      heading: `${String(heading).padStart(3, '0')}°`,
      action: 'spin_360()',
      landmarks: progress > 0.4 ? (progress > 0.7 ? 'ball_A · ball_B' : 'ball_A') : '—',
    };
  }

  if (stageId === 'perception_walk1') {
    const progress = Math.min((t - 22) / 10, 1);
    const x = (progress * 3.0).toFixed(1);
    return {
      ...base,
      pose: `(${x}, 0.0)`,
      heading: '090°',
      landmarks: 'ball_A · ball_B',
      action: 'navigate_to(3.0, 0.0)',
      target: 'ball_A',
      eta: `~${Math.max(0, Math.ceil((1 - progress) * 3))}s`,
    };
  }

  if (stageId === 'perception_walk2') {
    const progress = Math.min((t - 36) / 19, 1);
    const turnDone = progress > 0.3;
    const walkProgress = turnDone ? (progress - 0.3) / 0.7 : 0;
    const x = turnDone ? (3.0 - walkProgress * 3.0).toFixed(1) : '3.0';
    const y = turnDone ? (-walkProgress * 2.0).toFixed(1) : '0.0';
    return {
      ...base,
      pose: `(${x}, ${y})`,
      heading: turnDone ? '225°' : `${180 + Math.floor((progress / 0.3) * 45)}°`,
      landmarks: 'ball_A · ball_B',
      action: 'navigate_to(0.0, -2.0)',
      target: 'ball_B',
      eta: progress > 0.95 ? 'ARRIVED ✓' : `~${Math.max(0, Math.ceil((1 - progress) * 5))}s`,
    };
  }

  return base;
}
