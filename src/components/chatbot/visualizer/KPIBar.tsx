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
    <div className="flex gap-2 p-3 overflow-x-auto">
      {kpis.map((kpi, index) => {
        // 스타일 결정
        let bgColor = 'bg-[#0a1628]';
        let borderColor = 'border-[#15243d]';
        let valueColor = 'text-white';

        if (kpi.alert) {
          bgColor = 'bg-[#ef444411]';
          borderColor = 'border-[#ef444433]';
          valueColor = 'text-[#ef4444]';
        } else if (kpi.highlight) {
          bgColor = 'bg-[#8b5cf611]';
          borderColor = 'border-[#8b5cf633]';
          valueColor = 'text-[#8b5cf6]';
        }

        return (
          <div
            key={`${kpi.label}-${index}`}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg border ${bgColor} ${borderColor}
                        backdrop-blur-sm min-w-[110px]`}
          >
            {/* 라벨 */}
            <div
              className="text-[11px] text-[#94a3b8] mb-0.5 truncate"
              style={{ fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif" }}
            >
              {kpi.label}
            </div>

            {/* 값 — 숫자+한글 혼합 대응 (예: "< 7개") */}
            <div
              className={`text-xl font-bold ${valueColor}`}
              style={{ fontFamily: "'Fira Code', 'Noto Sans KR', monospace" }}
            >
              {kpi.value}
            </div>

            {/* 서브텍스트 */}
            <div
              className="text-[10px] text-[#64748b] truncate"
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
