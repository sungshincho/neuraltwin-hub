/**
 * NEURALTWIN VizDirective Generator
 *
 * topicRouter의 분류 결과를 기반으로 VizDirective 생성
 * Deno 호환 모듈
 */

// ═══════════════════════════════════════════
//  타입 정의 (프론트엔드와 동일 구조)
// ═══════════════════════════════════════════

export type VizState = 'overview' | 'entry' | 'exploration' | 'purchase' | 'topdown';
export type CustomerStage = 'entry' | 'exploration' | 'purchase';

export interface VizAnnotation {
  zone: string;
  text: string;
  color: string;
}

export interface VizKPI {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  highlight?: boolean;
}

export interface VizDirective {
  vizState: VizState;
  highlights: string[];
  annotations?: VizAnnotation[];
  flowPath?: boolean;
  kpis?: VizKPI[];
  stage?: CustomerStage;
}

// ═══════════════════════════════════════════
//  토픽→VizDirective 매핑
// ═══════════════════════════════════════════

interface TopicClassification {
  primaryTopic: string;
  confidence: number;
}

/**
 * 토픽 분류 결과와 턴 수를 기반으로 VizDirective 생성
 */
export function generateVizDirective(
  classification: TopicClassification,
  turnCount: number
): VizDirective | null {
  const { primaryTopic, confidence } = classification;

  // 신뢰도가 낮으면 비주얼라이저 미표시
  if (confidence < 0.4) {
    return null;
  }

  // 첫 인사에는 비주얼라이저 미표시
  if (turnCount === 0 && primaryTopic === 'general_retail') {
    return null;
  }

  // 토픽별 매핑
  switch (primaryTopic) {
    // ─────────────────────────────────────────
    // 전환율 최적화 (대화 진행에 따라 단계 변화)
    // ─────────────────────────────────────────
    case 'sales_conversion':
    case 'conversion_optimization':
      return getConversionVizDirective(turnCount);

    // ─────────────────────────────────────────
    // 매장 레이아웃
    // ─────────────────────────────────────────
    case 'layout_flow':
    case 'store_layout':
      return {
        vizState: 'topdown',
        highlights: ['decompression', 'powerWall', 'clothingMain', 'fittingRoom', 'checkout', 'accessory'],
        flowPath: false,
        kpis: [
          { label: '매장 면적', value: '400㎡', sub: '표준' },
          { label: '존 구성', value: '6개', sub: '권장' },
          { label: '동선 효율', value: '78%', sub: '목표 85%' }
        ]
      };

    // ─────────────────────────────────────────
    // 고객 동선
    // ─────────────────────────────────────────
    case 'customer_flow':
      return {
        vizState: 'overview',
        highlights: ['decompression', 'clothingMain'],
        flowPath: true,
        kpis: [
          { label: '평균 체류', value: '12분', sub: '목표 15분' },
          { label: '동선 커버리지', value: '68%', sub: '목표 80%' },
          { label: '우회전율', value: '87%', sub: '정상' }
        ],
        stage: 'entry'
      };

    // ─────────────────────────────────────────
    // VMD (비주얼 머천다이징)
    // ─────────────────────────────────────────
    case 'vmd':
    case 'visual_merchandising':
      return {
        vizState: 'entry',
        highlights: ['powerWall', 'decompression'],
        flowPath: false,
        annotations: [
          { zone: 'powerWall', text: '시즌 주력\n시각적 임팩트', color: '#22c55e' },
          { zone: 'decompression', text: '비워두기\n첫인상 구간', color: '#ff6b00' }
        ],
        kpis: [
          { label: '시선 포착률', value: '3초+', sub: 'VP 기준' },
          { label: 'Golden Zone', value: '120-170cm', sub: '눈높이' }
        ]
      };

    // ─────────────────────────────────────────
    // 피팅룸
    // ─────────────────────────────────────────
    case 'fitting_room':
      return {
        vizState: 'exploration',
        highlights: ['fittingRoom'],
        flowPath: false,
        annotations: [
          { zone: 'fittingRoom', text: '전환율 67%\n핵심 전환 포인트', color: '#8b5cf6' }
        ],
        kpis: [
          { label: '피팅룸 전환율', value: '67%', sub: '핵심', highlight: true },
          { label: '평균 이용시간', value: '4.5분', sub: '적정' },
          { label: '대기 고객', value: '<3명', sub: '목표' }
        ],
        stage: 'exploration'
      };

    // ─────────────────────────────────────────
    // 인력 최적화
    // ─────────────────────────────────────────
    case 'staffing':
    case 'staffing_optimization':
      return {
        vizState: 'overview',
        highlights: ['checkout', 'fittingRoom', 'clothingMain'],
        flowPath: false,
        annotations: [
          { zone: 'checkout', text: '필수 1명\n피크시 2명', color: '#ef4444' },
          { zone: 'fittingRoom', text: '상시 1명', color: '#8b5cf6' },
          { zone: 'clothingMain', text: '유동 배치', color: '#0ea5e9' }
        ],
        kpis: [
          { label: 'SPLH', value: '$125', sub: '목표 $150' },
          { label: '인건비율', value: '12%', sub: '목표 10%' },
          { label: '커버리지', value: '85%', sub: '적정' }
        ]
      };

    // ─────────────────────────────────────────
    // 가격 전략
    // ─────────────────────────────────────────
    case 'pricing':
    case 'pricing_strategy':
      return {
        vizState: 'purchase',
        highlights: ['checkout', 'clothingMain'],
        flowPath: false,
        kpis: [
          { label: '평균 객단가', value: '₩85,000', sub: '목표 ₩100K' },
          { label: '마크다운율', value: '25%', sub: '적정' },
          { label: 'UPT', value: '2.3', sub: '목표 2.8' }
        ],
        stage: 'purchase'
      };

    // ─────────────────────────────────────────
    // 재고 관리
    // ─────────────────────────────────────────
    case 'inventory':
    case 'inventory_management':
      return {
        vizState: 'exploration',
        highlights: ['clothingMain', 'accessory', 'powerWall'],
        flowPath: false,
        kpis: [
          { label: '재고회전율', value: '8회/년', sub: '패션 평균' },
          { label: '품절률', value: '5%', sub: '목표 3%', alert: true },
          { label: 'Sell-Through', value: '72%', sub: '적정' }
        ]
      };

    // ─────────────────────────────────────────
    // 고객 경험 (CX)
    // ─────────────────────────────────────────
    case 'customer_experience':
    case 'cx':
      return getCustomerExperienceVizDirective(turnCount);

    // ─────────────────────────────────────────
    // 시즌 전략
    // ─────────────────────────────────────────
    case 'seasonal':
    case 'seasonal_strategy':
      return {
        vizState: 'entry',
        highlights: ['powerWall', 'decompression'],
        flowPath: false,
        annotations: [
          { zone: 'powerWall', text: '시즌 신상\n즉각 노출', color: '#22c55e' }
        ],
        kpis: [
          { label: '시즌 매출', value: 'Q4 40%', sub: '연매출 중' },
          { label: '마크다운 시점', value: '50%+', sub: '시즌 경과' }
        ]
      };

    // ─────────────────────────────────────────
    // 경쟁 분석
    // ─────────────────────────────────────────
    case 'competitor':
    case 'competitor_analysis':
      return {
        vizState: 'topdown',
        highlights: [],
        flowPath: false,
        kpis: [
          { label: '업계 평균', value: '18%', sub: '전환율' },
          { label: '시장점유율', value: '-', sub: '분석 필요' }
        ]
      };

    // ─────────────────────────────────────────
    // 데이터/KPI
    // ─────────────────────────────────────────
    case 'data_kpi':
      return {
        vizState: 'overview',
        highlights: ['checkout', 'decompression', 'fittingRoom'],
        flowPath: true,
        kpis: [
          { label: '전환율', value: '18%', sub: '패션 평균' },
          { label: '객단가', value: '₩85,000', sub: '목표 ₩100K' },
          { label: '체류시간', value: '12분', sub: '목표 15분' }
        ]
      };

    // ─────────────────────────────────────────
    // 디지털 트윈
    // ─────────────────────────────────────────
    case 'digital_twin':
      return {
        vizState: 'topdown',
        highlights: ['clothingMain', 'powerWall', 'fittingRoom'],
        flowPath: true,
        annotations: [
          { zone: 'clothingMain', text: '시뮬레이션\n영역', color: '#0ea5e9' }
        ],
        kpis: [
          { label: '시뮬레이션', value: '가능', sub: '레이아웃' },
          { label: '예상 효과', value: '8-12%', sub: '매출 증가' }
        ]
      };

    // ─────────────────────────────────────────
    // 리테일 테크
    // ─────────────────────────────────────────
    case 'retail_tech':
      return {
        vizState: 'overview',
        highlights: ['checkout', 'clothingMain'],
        flowPath: true,
        kpis: [
          { label: 'RFID 정확도', value: '95%+', sub: '재고' },
          { label: '디지털 사이니지', value: '29%↑', sub: '매출 효과' }
        ]
      };

    // ─────────────────────────────────────────
    // NEURALTWIN 솔루션
    // ─────────────────────────────────────────
    case 'neuraltwin_solution':
      return {
        vizState: 'overview',
        highlights: ['decompression', 'powerWall', 'fittingRoom', 'checkout'],
        flowPath: true,
        annotations: [
          { zone: 'clothingMain', text: 'NEURALTWIN\n실시간 분석', color: '#0ea5e9' }
        ],
        kpis: [
          { label: '매출 증가', value: '8-12%', sub: '기대 효과', highlight: true },
          { label: '인건비 절감', value: '5-10%', sub: '최적화' },
          { label: '리스크 절감', value: '70-80%', sub: '시뮬레이션' }
        ]
      };

    // ─────────────────────────────────────────
    // 일반 리테일 (기본)
    // ─────────────────────────────────────────
    case 'general_retail':
    default:
      if (turnCount < 1) {
        return null;
      }
      return {
        vizState: 'overview',
        highlights: [],
        flowPath: false,
        kpis: [
          { label: '전환율', value: '15-25%', sub: '패션 평균' },
          { label: '객단가', value: '₩85,000', sub: '업계 평균' }
        ]
      };
  }
}

// ═══════════════════════════════════════════
//  헬퍼 함수: 전환율 토픽 (대화 진행별 단계)
// ═══════════════════════════════════════════

function getConversionVizDirective(turnCount: number): VizDirective {
  // 첫 1-2턴: 전체 개요
  if (turnCount <= 1) {
    return {
      vizState: 'overview',
      highlights: [],
      flowPath: false,
      kpis: [
        { label: '평균 전환율', value: '18%', sub: '패션 리테일' },
        { label: '목표 전환율', value: '25%', sub: '우수 매장' },
        { label: '객단가', value: '₩85,000', sub: '업계 평균' }
      ]
    };
  }

  // 2-3턴: 진입 단계 상세
  if (turnCount <= 3) {
    return {
      vizState: 'entry',
      highlights: ['decompression', 'powerWall'],
      flowPath: true,
      annotations: [
        { zone: 'decompression', text: '비워두기!\n상품 배치 ✕', color: '#ff6b00' },
        { zone: 'powerWall', text: '주력상품\n+고마진 배치', color: '#22c55e' }
      ],
      kpis: [
        { label: '입구 이탈률', value: '32%', sub: '목표 <25%', alert: true },
        { label: '감압구간', value: '1.2m', sub: '최소 1.5m 필요', alert: true },
        { label: '우회전율', value: '87%', sub: '정상 범위' }
      ],
      stage: 'entry'
    };
  }

  // 4-5턴: 탐색 단계
  if (turnCount <= 5) {
    return {
      vizState: 'exploration',
      highlights: ['fittingRoom', 'clothingMain', 'accessory'],
      flowPath: true,
      annotations: [
        { zone: 'fittingRoom', text: '전환율 67%\n핵심 전환 포인트', color: '#8b5cf6' },
        { zone: 'clothingMain', text: '직원 접객\n전환율 +20-30%', color: '#0ea5e9' }
      ],
      kpis: [
        { label: '피팅룸 전환', value: '67%', sub: '핵심', highlight: true },
        { label: '체류시간', value: '8분', sub: '목표 12분' },
        { label: '접객률', value: '45%', sub: '목표 70%' }
      ],
      stage: 'exploration'
    };
  }

  // 6턴+: 구매 단계
  return {
    vizState: 'purchase',
    highlights: ['checkout'],
    flowPath: false,
    annotations: [
      { zone: 'checkout', text: '대기 3분 이내!\n모바일 POS 활용', color: '#ef4444' }
    ],
    kpis: [
      { label: '계산대 대기', value: '2.5분', sub: '목표 <3분' },
      { label: 'UPT', value: '2.1', sub: '목표 2.5' },
      { label: '추가구매율', value: '15%', sub: '목표 25%' }
    ],
    stage: 'purchase'
  };
}

// ═══════════════════════════════════════════
//  헬퍼 함수: CX 토픽 (대화 진행별 단계)
// ═══════════════════════════════════════════

function getCustomerExperienceVizDirective(turnCount: number): VizDirective {
  if (turnCount <= 2) {
    return {
      vizState: 'entry',
      highlights: ['decompression', 'powerWall'],
      flowPath: true,
      kpis: [
        { label: '첫인상', value: '3초', sub: '결정 시간' },
        { label: 'NPS', value: '45', sub: '목표 60' }
      ],
      stage: 'entry'
    };
  }

  if (turnCount <= 4) {
    return {
      vizState: 'exploration',
      highlights: ['clothingMain', 'fittingRoom', 'accessory'],
      flowPath: true,
      kpis: [
        { label: '탐색 만족도', value: '3.8/5', sub: '개선 필요' },
        { label: '직원 응대', value: '4.2/5', sub: '양호' }
      ],
      stage: 'exploration'
    };
  }

  return {
    vizState: 'purchase',
    highlights: ['checkout'],
    flowPath: false,
    kpis: [
      { label: '결제 경험', value: '4.0/5', sub: '양호' },
      { label: '재방문 의향', value: '65%', sub: '목표 80%' }
    ],
    stage: 'purchase'
  };
}
