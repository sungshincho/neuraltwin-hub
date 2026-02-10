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
      className="flex flex-wrap sm:flex-nowrap min-w-0"
      style={{
        background: 'linear-gradient(to bottom, rgba(3,7,18,0.92) 60%, transparent 100%)',
        gap: 'clamp(4px, 0.8vw, 12px)',
        padding: 'clamp(6px, 1.2vw, 12px) clamp(6px, 1.5vw, 16px) clamp(10px, 1.5vw, 16px)',
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
            className={`w-[calc(50%-3px)] sm:w-auto sm:flex-1 min-w-0 rounded-lg border ${bgColor} ${borderColor}
                        backdrop-blur-md`}
            style={{ padding: 'clamp(4px, 0.8vw, 10px) clamp(6px, 1vw, 16px)' }}
          >
            {/* 라벨 */}
            <div
              className="text-[#94a3b8] mb-0.5 truncate"
              style={{
                fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif",
                fontSize: 'clamp(8px, 1.5vw, 11px)',
              }}
            >
              {kpi.label}
            </div>

            {/* 값 */}
            <div
              className={`font-bold leading-tight ${valueColor}`}
              style={{
                fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
                fontSize: 'clamp(12px, 2.5vw, 18px)',
              }}
            >
              {kpi.value}
            </div>

            {/* 서브텍스트 */}
            <div
              className="text-[#64748b] truncate mt-0.5"
              style={{
                fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif",
                fontSize: 'clamp(7px, 1.3vw, 10px)',
              }}
            >
              {kpi.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
