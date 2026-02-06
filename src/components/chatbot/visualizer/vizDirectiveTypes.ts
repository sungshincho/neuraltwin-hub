/**
 * NEURALTWIN Store Visualizer - VizDirective Types
 *
 * AI 응답이 비주얼라이저에 전달하는 지시 데이터 타입
 */

// ═══════════════════════════════════════════
//  카메라 상태 타입
// ═══════════════════════════════════════════

export type VizState = 'overview' | 'entry' | 'exploration' | 'purchase' | 'topdown';

// ═══════════════════════════════════════════
//  어노테이션 타입
// ═══════════════════════════════════════════

export interface VizAnnotation {
  zone: string;           // STORE.zones의 키 (예: "decompression", "powerWall")
  text: string;           // 어노테이션 텍스트 (줄바꿈 허용: "비워두기!\n상품 배치 ✕")
  color: string;          // CSS hex 색상 (예: "#ff6b00")
}

// ═══════════════════════════════════════════
//  KPI 타입
// ═══════════════════════════════════════════

export interface VizKPI {
  label: string;          // "평균 전환율"
  value: string;          // "18%"
  sub: string;            // "패션 리테일"
  alert?: boolean;        // 경고 스타일 (빨간색 강조)
  highlight?: boolean;    // 포인트 스타일 (보라색 강조)
}

// ═══════════════════════════════════════════
//  고객 여정 단계
// ═══════════════════════════════════════════

export type CustomerStage = 'entry' | 'exploration' | 'purchase';

// ═══════════════════════════════════════════
//  파라메트릭 스토어 설정 (PHASE H)
// ═══════════════════════════════════════════

/**
 * 매장 크기 파라미터
 * AI가 사용자 언급 (예: "200평 매장")에 따라 동적 생성
 */
export interface StoreParams {
  /** 매장 가로 크기 (m) - 기본값 20 */
  storeWidth?: number;

  /** 매장 세로 크기 (m) - 기본값 20 */
  storeDepth?: number;

  /** 매장 높이 (m) - 기본값 4 */
  storeHeight?: number;

  /** 피팅룸 개수 - 기본값 4 */
  fittingRoomCount?: number;
}

/**
 * 존별 크기 조정 배율
 * 특정 존이 크거나 작다고 언급 시 적용
 */
export interface ZoneScale {
  [zoneId: string]: {
    /** 가로 배율 (0.5 ~ 2.0) */
    scaleX?: number;
    /** 세로 배율 (0.5 ~ 2.0) */
    scaleZ?: number;
  };
}

// ═══════════════════════════════════════════
//  메인 VizDirective 타입
// ═══════════════════════════════════════════

export interface VizDirective {
  /** 카메라 프리셋 (overview, entry, exploration, purchase, topdown) */
  vizState: VizState;

  /** 하이라이트할 존 ID 배열 */
  highlights: string[];

  /** 존 위 어노테이션 (선택) */
  annotations?: VizAnnotation[];

  /** 고객 동선 표시 여부 */
  flowPath?: boolean;

  /** KPI 바 데이터 (선택) */
  kpis?: VizKPI[];

  /** 단계 프로그레스 (선택) */
  stage?: CustomerStage;

  /** 파라메트릭 매장 설정 (PHASE H) */
  storeParams?: StoreParams;

  /** 존별 크기 조정 (PHASE H) */
  zoneScale?: ZoneScale;
}

// ═══════════════════════════════════════════
//  기본값 / 팩토리 함수
// ═══════════════════════════════════════════

/**
 * 기본 VizDirective 생성
 */
export function createDefaultVizDirective(): VizDirective {
  return {
    vizState: 'overview',
    highlights: [],
    flowPath: false
  };
}

/**
 * VizDirective 병합 (부분 업데이트용)
 */
export function mergeVizDirective(
  current: VizDirective,
  updates: Partial<VizDirective>
): VizDirective {
  return {
    ...current,
    ...updates,
    // 배열은 완전 교체 (병합하지 않음)
    highlights: updates.highlights ?? current.highlights,
    annotations: updates.annotations ?? current.annotations,
    kpis: updates.kpis ?? current.kpis
  };
}

// ═══════════════════════════════════════════
//  검증 함수
// ═══════════════════════════════════════════

const VALID_VIZ_STATES: VizState[] = ['overview', 'entry', 'exploration', 'purchase', 'topdown'];
const VALID_STAGES: CustomerStage[] = ['entry', 'exploration', 'purchase'];

/**
 * VizDirective 유효성 검증
 */
export function isValidVizDirective(obj: unknown): obj is VizDirective {
  if (!obj || typeof obj !== 'object') return false;

  const directive = obj as Record<string, unknown>;

  // vizState 필수
  if (!directive.vizState || !VALID_VIZ_STATES.includes(directive.vizState as VizState)) {
    return false;
  }

  // highlights 필수 (빈 배열 허용)
  if (!Array.isArray(directive.highlights)) {
    return false;
  }

  // stage 검증 (있으면)
  if (directive.stage && !VALID_STAGES.includes(directive.stage as CustomerStage)) {
    return false;
  }

  return true;
}

/**
 * AI 응답에서 VizDirective JSON 파싱 시도
 * ```viz ... ``` 블록 또는 일반 JSON 파싱
 */
export function parseVizDirectiveFromResponse(response: string): VizDirective | null {
  // 1. ```viz 블록 찾기
  const vizBlockMatch = response.match(/```viz\s*\n?([\s\S]*?)\n?```/);
  if (vizBlockMatch) {
    try {
      const parsed = JSON.parse(vizBlockMatch[1].trim());
      if (isValidVizDirective(parsed)) {
        return parsed;
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  // 2. 일반 JSON 블록 찾기 (vizState 포함된)
  const jsonMatch = response.match(/\{[\s\S]*?"vizState"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (isValidVizDirective(parsed)) {
        return parsed;
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  return null;
}
