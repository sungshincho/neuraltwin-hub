/**
 * NEURALTWIN Store Visualizer - Stage Progress Component
 *
 * 고객 여정 단계 프로그레스 표시
 * 🚪 1 진입 ─ 👀 2 탐색 ─ 💳 3 결제
 */

import type { CustomerStage } from './vizDirectiveTypes';

interface StageProgressProps {
  currentStage?: CustomerStage;
  stage?: CustomerStage;
}

interface StageConfig {
  id: CustomerStage;
  icon: string;
  number: number;
  label: string;
}

const STAGES: StageConfig[] = [
  { id: 'entry', icon: '🚪', number: 1, label: '진입' },
  { id: 'exploration', icon: '👀', number: 2, label: '탐색' },
  { id: 'purchase', icon: '💳', number: 3, label: '결제' }
];

const STAGE_ORDER: Record<CustomerStage, number> = {
  entry: 0,
  exploration: 1,
  purchase: 2
};

export default function StageProgress({ currentStage, stage }: StageProgressProps) {
  const activeStage = currentStage || stage;
  if (!activeStage) {
    return null;
  }

  const currentIndex = STAGE_ORDER[activeStage];

  return (
    <div
      className="flex items-center justify-center gap-0 px-4 py-3"
      style={{
        background: 'linear-gradient(to top, rgba(3,7,18,0.92) 60%, transparent 100%)',
      }}
    >
      {STAGES.map((stageItem, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        // 스타일 결정
        let bgColor = 'bg-[#060b15cc]';
        let borderColor = 'border-[#1e293b]';
        let textColor = 'text-[#475569]';

        if (isCurrent) {
          bgColor = 'bg-[#0ea5e918]';
          borderColor = 'border-[#0ea5e944]';
          textColor = 'text-[#0ea5e9]';
        } else if (isCompleted) {
          bgColor = 'bg-[#22c55e10]';
          borderColor = 'border-[#22c55e33]';
          textColor = 'text-[#22c55e]';
        }

        // 연결선 색상
        const lineColor = isCompleted ? 'bg-[#22c55e44]' : 'bg-[#1e293b]';

        return (
          <div key={stageItem.id} className="flex items-center">
            {/* 단계 카드 */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2 rounded-full border
                          backdrop-blur-md ${bgColor} ${borderColor} transition-all duration-300`}
            >
              <span className="text-sm sm:text-base">{stageItem.icon}</span>
              <span
                className={`text-[11px] sm:text-[12px] font-medium ${textColor}`}
                style={{ fontFamily: "'Fira Code', 'Noto Sans KR', monospace" }}
              >
                {stageItem.number} {stageItem.label}
              </span>
            </div>

            {/* 연결선 (마지막 단계 제외) */}
            {index < STAGES.length - 1 && (
              <div className={`w-4 sm:w-6 h-[2px] ${lineColor} mx-0.5 sm:mx-1 transition-colors duration-300`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
