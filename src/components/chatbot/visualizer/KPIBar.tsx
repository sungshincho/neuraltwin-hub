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
      className="flex flex-wrap gap-1.5 px-2 pt-2 pb-3 sm:flex-nowrap sm:gap-3 sm:px-4 sm:pt-3 sm:pb-4"
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
            className={`w-[calc(50%-3px)] sm:w-auto sm:flex-1 min-w-0 px-2 py-1.5 rounded-lg border ${bgColor} ${borderColor}
                        backdrop-blur-md sm:px-4 sm:py-2.5`}
          >
            {/* 라벨 */}
            <div
              className="text-[9px] sm:text-[11px] text-[#94a3b8] mb-0.5 truncate"
              style={{ fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif" }}
            >
              {kpi.label}
            </div>

            {/* 값 */}
            <div
              className={`text-xs font-bold sm:text-lg leading-tight ${valueColor}`}
              style={{ fontFamily: "'Fira Code', 'Noto Sans KR', monospace" }}
            >
              {kpi.value}
            </div>

            {/* 서브텍스트 */}
            <div
              className="text-[8px] sm:text-[10px] text-[#64748b] truncate mt-0.5"
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
