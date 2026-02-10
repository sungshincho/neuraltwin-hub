/**
 * NEURALTWIN Store Visualizer - KPI Bar Component
 *
 * 비주얼라이저 상단에 표시되는 KPI 카드 바
 */

import type { VizKPI } from './vizDirectiveTypes';

interface KPIBarProps {
  kpis: VizKPI[];
}

export default function KPIBar({ kpis }: KPIBarProps) {
  if (!kpis || kpis.length === 0) {
    return null;
  }

  return (
    <div
      className="flex gap-2 px-3 pt-3 pb-4 sm:gap-3 sm:px-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(3,7,18,0.92) 60%, transparent 100%)',
      }}
    >
      {kpis.map((kpi, index) => {
        // 스타일 결정
        let bgColor = 'bg-[#0a1628cc]';
        let borderColor = 'border-[#15243d]';
        let valueColor = 'text-white';

        if (kpi.alert) {
          bgColor = 'bg-[#ef444418]';
          borderColor = 'border-[#ef444433]';
          valueColor = 'text-[#ef4444]';
        } else if (kpi.highlight) {
          bgColor = 'bg-[#8b5cf618]';
          borderColor = 'border-[#8b5cf633]';
          valueColor = 'text-[#8b5cf6]';
        }

        return (
          <div
            key={`${kpi.label}-${index}`}
            className={`flex-1 min-w-0 px-2.5 py-2 rounded-lg border ${bgColor} ${borderColor}
                        backdrop-blur-md sm:px-4 sm:py-2.5`}
          >
            {/* 라벨 */}
            <div
              className="text-[10px] sm:text-[11px] text-[#94a3b8] mb-0.5 truncate"
              style={{ fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif" }}
            >
              {kpi.label}
            </div>

            {/* 값 */}
            <div
              className={`text-sm font-bold sm:text-lg leading-tight ${valueColor}`}
              style={{ fontFamily: "'Fira Code', 'Noto Sans KR', monospace" }}
            >
              {kpi.value}
            </div>

            {/* 서브텍스트 */}
            <div
              className="text-[9px] sm:text-[10px] text-[#64748b] truncate mt-0.5"
              style={{ fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif" }}
            >
              {kpi.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
