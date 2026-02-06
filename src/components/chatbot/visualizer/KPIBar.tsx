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
            className={`flex-shrink-0 px-3 py-2 rounded-lg border ${bgColor} ${borderColor}
                        backdrop-blur-sm min-w-[100px]`}
          >
            {/* 라벨 */}
            <div className="text-[9px] font-mono text-[#64748b] mb-0.5 truncate">
              {kpi.label}
            </div>

            {/* 값 */}
            <div className={`text-base font-bold font-mono ${valueColor}`}>
              {kpi.value}
            </div>

            {/* 서브텍스트 */}
            <div className="text-[8px] font-mono text-[#475569] truncate">
              {kpi.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
