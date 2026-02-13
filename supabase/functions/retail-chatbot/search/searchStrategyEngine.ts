/**
 * Search Strategy Engine — Phase 2 (Layer 2)
 *
 * queryRouter 기반 확장: 벡터 검색 결과 수를 반영하여
 * 웹 검색 필요 여부 및 최적 검색 쿼리를 결정
 *
 * 판단 로직:
 * - vectorResultCount >= 5 → 웹 검색 생략 (벡터 지식 매우 충분)
 * - vectorResultCount >= 3 + 고급 질문 → 다양성 보충 검색
 * - vectorResultCount < 2 + 고급 질문 → 웹 검색 강화
 * - queryRouter 엔티티 감지 → 무조건 웹 검색
 * - 최신 정보 요청 패턴 → 무조건 웹 검색
 * - 다양성 키워드 감지 → 벡터 충분해도 웹 검색
 */

import { routeQuery, type QueryRouteResult, type AugmentationType } from '../queryRouter.ts';
import type { QuestionDepth } from '../questionDepthAnalyzer.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface SearchStrategyInput {
  message: string;
  topicId: string;
  questionDepth: QuestionDepth;
  turnCount: number;
  vectorResultCount: number;
  conversationHistory?: string[];
}

export interface SearchQuery {
  query: string;
  type: 'web' | 'sns';
  priority: number;       // 1 = 최우선, 3 = 낮음
}

export interface SearchStrategy {
  shouldSearch: boolean;
  queries: SearchQuery[];
  reason: string;
  queryRouteResult: QueryRouteResult;  // 원본 queryRouter 결과 보존
}

// ═══════════════════════════════════════════
//  벡터 결과 기반 검색 필요도 판단
// ═══════════════════════════════════════════

const VECTOR_SUFFICIENT_THRESHOLD = 5;  // 이 이상이면 검색 생략 (기존 3→5 상향)
const VECTOR_DIVERSE_THRESHOLD = 3;     // 이 이상이면 다양성 보충 검색 (고급 질문 시)
const VECTOR_WEAK_THRESHOLD = 1;        // 이 이하면 검색 강화

// 고급 질문자가 벡터 결과가 부족할 때 추가 검색을 위한 패턴
const ADVANCED_SEARCH_BOOST_PATTERNS = [
  /(벤치마크|benchmark|기준\s*수치|업계\s*평균)/i,
  /(사례|케이스\s*스터디|case\s*study)/i,
  /(글로벌|해외|미국|유럽|일본)\s*(사례|트렌드|현황)/,
  /(리서치|조사|검색)\s*해/,
  /(데이터|통계|수치|근거)/,
];

// 다양성 보충 검색 트리거 — 벡터 충분해도 외부 관점 보충
const DIVERSITY_SEARCH_PATTERNS = [
  /(다른\s*브랜드|다른\s*사례|다양한|비교|대안)/,
  /(어떤\s*브랜드|어디|누가|어느\s*매장)/,
  /(최신|최근|트렌드|2024|2025|2026)/,
  /(국내|한국|로컬)\s*(사례|브랜드|매장)/,
  /(중소|소규모|스타트업|신규)\s*(브랜드|매장|업체)/,
];

// ═══════════════════════════════════════════
//  메인 전략 빌더
// ═══════════════════════════════════════════

export function buildSearchStrategy(input: SearchStrategyInput): SearchStrategy {
  const {
    message,
    topicId,
    questionDepth,
    turnCount,
    vectorResultCount,
    conversationHistory,
  } = input;

  // 1. 기존 queryRouter 호출 (엔티티 감지 + 트리거 패턴)
  const queryRoute = routeQuery(message, conversationHistory);

  // 2. queryRouter가 검색 필요하다고 판단한 경우 → 무조건 검색
  if (queryRoute.augmentation === 'web_search') {
    const queries = buildQueriesFromRoute(message, queryRoute);
    return {
      shouldSearch: true,
      queries,
      reason: queryRoute.searchReason || 'entity_or_trigger_detected',
      queryRouteResult: queryRoute,
    };
  }

  // 3. 다양성 보충 검색 — 벡터 결과가 있어도 다양한 관점이 필요한 경우
  const needsDiversity = DIVERSITY_SEARCH_PATTERNS.some(p => p.test(message));
  if (needsDiversity && vectorResultCount >= 1) {
    const queries = buildAdvancedSupplementQueries(message, topicId);
    return {
      shouldSearch: true,
      queries,
      reason: `diversity_supplement (${vectorResultCount} vector + web diversity)`,
      queryRouteResult: queryRoute,
    };
  }

  // 4. 벡터 결과가 매우 충분하면 검색 생략
  if (vectorResultCount >= VECTOR_SUFFICIENT_THRESHOLD) {
    return {
      shouldSearch: false,
      queries: [],
      reason: `vector_sufficient (${vectorResultCount} results)`,
      queryRouteResult: queryRoute,
    };
  }

  // 5. 고급 질문 + 벡터 중간 수준 → 다양성 보충 검색
  if (questionDepth === 'advanced' && vectorResultCount >= VECTOR_DIVERSE_THRESHOLD) {
    const queries = buildAdvancedSupplementQueries(message, topicId);
    return {
      shouldSearch: true,
      queries,
      reason: `advanced_with_vector_diversity (${vectorResultCount} results, supplementing)`,
      queryRouteResult: queryRoute,
    };
  }

  // 6. 고급 질문 + 벡터 결과 부족 → 검색 강화
  if (questionDepth === 'advanced' && vectorResultCount <= VECTOR_WEAK_THRESHOLD) {
    const needsBoost = ADVANCED_SEARCH_BOOST_PATTERNS.some(p => p.test(message));
    if (needsBoost) {
      const queries = buildAdvancedSupplementQueries(message, topicId);
      return {
        shouldSearch: true,
        queries,
        reason: `advanced_question_with_weak_vector (${vectorResultCount} results)`,
        queryRouteResult: queryRoute,
      };
    }
  }

  // 7. 기본: 검색 불필요
  return {
    shouldSearch: false,
    queries: [],
    reason: vectorResultCount > 0
      ? `vector_partially_sufficient (${vectorResultCount} results)`
      : 'no_search_triggers',
    queryRouteResult: queryRoute,
  };
}

// ═══════════════════════════════════════════
//  쿼리 빌더: queryRouter 결과 기반
// ═══════════════════════════════════════════

function buildQueriesFromRoute(
  message: string,
  queryRoute: QueryRouteResult
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const entities = queryRoute.detectedEntities;

  if (entities.length > 0) {
    // 한글 엔티티 우선
    const koreanEntity = entities.find(e => /[가-힣]/.test(e));
    const longEnglishEntity = entities
      .filter(e => !/[가-힣]/.test(e))
      .sort((a, b) => b.length - a.length)[0];
    const entity = koreanEntity || longEnglishEntity || entities[0];

    const msgLower = message.toLowerCase();

    // SNS 맥락 감지
    const isSnsQuery = /인스타|instagram|페이스북|facebook|유튜브|youtube|틱톡|tiktok|sns|소셜|블로그/i.test(message);

    // 웹 검색 쿼리
    if (msgLower.includes('팝업') || msgLower.includes('popup')) {
      queries.push({ query: `${entity} 브랜드 공식 사이트 제품 카테고리`, type: 'web', priority: 1 });
    } else if (/유통|현황|분석|전략/.test(msgLower)) {
      queries.push({ query: `${entity} 브랜드 유통 현황 분석`, type: 'web', priority: 1 });
    } else if (/매장|공간|인테리어|동선/.test(msgLower)) {
      queries.push({ query: `${entity} 매장 공간 인테리어 컨셉`, type: 'web', priority: 1 });
    } else {
      queries.push({ query: `${entity} 브랜드 소개 제품`, type: 'web', priority: 1 });
    }

    // SNS 검색 (엔티티가 있으면 항상 병렬)
    if (isSnsQuery) {
      if (/인스타|instagram/i.test(message)) {
        queries.push({ query: `${entity} 인스타그램 공식 계정`, type: 'sns', priority: 1 });
      } else {
        queries.push({ query: `${entity} SNS 소셜미디어 공식 계정`, type: 'sns', priority: 2 });
      }
    } else {
      // SNS 검색은 낮은 우선순위로 항상 추가
      queries.push({ query: `${entity} 인스타그램 리뷰 후기`, type: 'sns', priority: 3 });
    }
  } else {
    // 엔티티 없이 트리거 패턴만 매칭
    queries.push({ query: message.slice(0, 100), type: 'web', priority: 1 });
  }

  return queries;
}

// ═══════════════════════════════════════════
//  쿼리 빌더: 고급 질문 보충 검색
// ═══════════════════════════════════════════

// 토픽 → 검색 보충 키워드 매핑
const TOPIC_SEARCH_HINTS: Record<string, string> = {
  layout_flow: '매장 동선 레이아웃 사례 데이터',
  vmd_display: 'VMD 진열 벤치마크 ROI',
  sales_conversion: '리테일 전환율 객단가 벤치마크',
  customer_analytics: '고객 분석 RFM CLV 사례',
  data_kpi: '리테일 KPI 벤치마크 데이터',
  staff_productivity: '매장 인력 생산성 SPLH',
  digital_twin: '디지털 트윈 리테일 사례',
  retail_tech: '리테일 테크 도입 사례 ROI',
  neuraltwin_solution: 'NEURALTWIN 리테일 솔루션',
};

function buildAdvancedSupplementQueries(
  message: string,
  topicId: string
): SearchQuery[] {
  const hint = TOPIC_SEARCH_HINTS[topicId] || '리테일 사례 데이터';

  // 메시지에서 핵심 키워드 추출 (앞 50자)
  const shortMessage = message.slice(0, 50).replace(/[?？]/g, '').trim();

  return [
    { query: `${shortMessage} ${hint}`, type: 'web', priority: 2 },
  ];
}
