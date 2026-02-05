/**
 * NEURALTWIN Store Visualizer - Stage Progress Component
 *
 * 고객 여정 단계 프로그레스 표시
 * 🚪 1 진입 ─ 👀 2 탐색 ─ 💳 3 결제
 */

import type { CustomerStage } from './vizDirectiveTypes';

interface StageProgressProps {
  currentStage?: CustomerStage;
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

export default function StageProgress({ currentStage }: StageProgressProps) {
  if (!currentStage) {
    return null;
  }

  const currentIndex = STAGE_ORDER[currentStage];

  return (
    <div className="flex items-center justify-center gap-0 px-4 py-3 bg-[#030712cc]">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        // 스타일 결정
        let bgColor = 'bg-[#060b15]';
        let borderColor = 'border-[#1e293b]';
        let textColor = 'text-[#475569]';

        if (isCurrent) {
          bgColor = 'bg-[#0ea5e915]';
          borderColor = 'border-[#0ea5e944]';
          textColor = 'text-[#0ea5e9]';
        } else if (isCompleted) {
          bgColor = 'bg-[#22c55e08]';
          borderColor = 'border-[#22c55e33]';
          textColor = 'text-[#22c55e]';
        }

        // 연결선 색상
        const lineColor = isCompleted ? 'bg-[#22c55e44]' : 'bg-[#1e293b]';

        return (
          <div key={stage.id} className="flex items-center">
            {/* 단계 카드 */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                          ${bgColor} ${borderColor} transition-all duration-300`}
            >
              <span className="text-sm">{stage.icon}</span>
              <span className={`text-[10px] font-mono font-medium ${textColor}`}>
                {stage.number} {stage.label}
              </span>
            </div>

            {/* 연결선 (마지막 단계 제외) */}
            {index < STAGES.length - 1 && (
              <div className={`w-6 h-[2px] ${lineColor} mx-1 transition-colors duration-300`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
