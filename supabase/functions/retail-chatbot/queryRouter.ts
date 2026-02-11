/**
 * NEURALTWIN Query Router
 *
 * 사용자 질문을 분석하여 웹 검색이 필요한지 판단합니다.
 *
 * 판단 기준:
 * - 고유명사(브랜드/기업/제품)가 포함되었는데
 *   retailKnowledge 키워드에 없으면 → 웹 검색 필요
 * - 최신 정보/뉴스가 필요한 질문 → 웹 검색 필요
 * - retailKnowledge 키워드로 충분히 커버 가능 → 기존 방식
 */

import { RETAIL_KNOWLEDGE } from './retailKnowledge.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export type AugmentationType = 'none' | 'web_search';

export interface QueryRouteResult {
  augmentation: AugmentationType;
  detectedEntities: string[];  // 감지된 고유명사
  searchReason?: string;       // 검색이 필요한 이유 (로깅용)
}

// ═══════════════════════════════════════════
//  알려진 키워드 집합 구축 (retailKnowledge 기반)
// ═══════════════════════════════════════════

const KNOWN_KEYWORDS: Set<string> = new Set();

// retailKnowledge의 모든 키워드를 소문자로 수집
for (const topic of RETAIL_KNOWLEDGE) {
  for (const kw of topic.keywords) {
    KNOWN_KEYWORDS.add(kw.toLowerCase());
  }
  for (const kw of topic.keywordsKo) {
    KNOWN_KEYWORDS.add(kw.toLowerCase());
  }
}

// 시스템이 이미 알고 있는 글로벌 브랜드 (검색 불필요)
const WELL_KNOWN_BRANDS: Set<string> = new Set([
  // 패션
  'zara', 'h&m', 'uniqlo', '유니클로', 'nike', '나이키', 'adidas', '아디다스',
  'gucci', '구찌', 'louis vuitton', '루이비통', 'chanel', '샤넬', 'prada', '프라다',
  'hermes', '에르메스', 'burberry', '버버리', 'gap', 'cos', 'muji', '무인양품',
  'mango', 'aesop', '이솝', 'lululemon', '룰루레몬', 'patagonia', '파타고니아',
  'north face', '노스페이스', 'new balance', '뉴발란스',
  // 리테일
  'walmart', '월마트', 'costco', '코스트코', 'amazon', '아마존', 'ikea', '이케아',
  'target', '타겟', 'starbucks', '스타벅스', 'apple', '애플', 'samsung', '삼성',
  'daiso', '다이소', 'olive young', '올리브영', 'coupang', '쿠팡',
  // F&B
  'mcdonald', '맥도날드', 'subway', '서브웨이',
  // 한국 유통
  '신세계', '롯데', '현대백화점', 'gs25', 'cu', 'emart', '이마트',
  // 우리 솔루션
  'neuraltwin', '뉴럴트윈', 'neuralsense', '뉴럴센스',
]);

// 일반 리테일 용어 (고유명사 아님 → 검색 불필요)
const COMMON_RETAIL_TERMS: Set<string> = new Set([
  '매장', '팝업', '오픈', '체크리스트', '기획', '전략', '분석', '추천', '운영',
  '브랜드', '제품', '상품', '고객', '매출', '프로모션', '할인', '디스플레이',
  '인테리어', '리뉴얼', '확장', '축소', '폐점', '이전', '입점', '수입',
  'popup', 'store', 'shop', 'brand', 'product', 'strategy', 'plan',
  '서울', '강남', '성수', '홍대', '명동', '가로수길', '신사', '압구정', '이태원',
]);

// 검색 트리거 패턴 (최신 정보 필요)
const SEARCH_TRIGGER_PATTERNS = [
  /최근\s*(뉴스|동향|소식|이슈)/,
  /최신\s*(트렌드|소식|정보|데이터)/,
  /올해\s*(실적|매출|현황)/,
  /\d{4}년?\s*(실적|매출|현황|동향)/,
  /(경쟁사|경쟁 브랜드|경쟁업체)\s*(분석|비교|현황)/,
  /(시장|마켓)\s*(조사|분석|규모|현황)/,
  /(유통|입점|매장)\s*(현황|분석|전략|구조)/,
  /(브랜드|기업)\s*(분석|리서치|조사|소개)/,
  // SNS/소셜미디어 검색 트리거
  /(인스타|인스타그램|instagram)\s*(계정|팔로워|반응|인기|피드)?/i,
  /(페이스북|facebook|페북)\s*(페이지|광고|마케팅)?/i,
  /(유튜브|youtube|틱톡|tiktok)\s*(채널|영상|콘텐츠)?/i,
  /(sns|소셜|소셜미디어)\s*(마케팅|전략|분석|반응|트렌드)?/i,
  /(블로그|네이버|카카오)\s*(후기|리뷰|반응)/i,
  /리서치|조사\s*해\s*(봐|줘|보|주)/,
  /검색\s*해\s*(봐|줘|보|주)/,
];

// ═══════════════════════════════════════════
//  고유명사(엔티티) 감지
// ═══════════════════════════════════════════

/**
 * 메시지에서 고유명사(브랜드/기업/제품)를 추출합니다.
 *
 * 방법:
 * 1. 영문 단어 중 retailKnowledge 키워드에 없는 것 추출
 * 2. 한글에서 일반 용어가 아닌 고유명사 패턴 감지
 * 3. 따옴표/괄호 안의 이름 추출
 */
function detectEntities(message: string): string[] {
  const entities: string[] = [];
  const msgLower = message.toLowerCase();

  // 1. 따옴표/괄호 안의 이름 추출 ("블랙크로우", [Black Crow] 등)
  const quotedMatches = message.match(/["'""'']([^"'""'']+)["'""'']/g);
  if (quotedMatches) {
    for (const match of quotedMatches) {
      const clean = match.replace(/["'""'']/g, '').trim();
      if (clean.length >= 2) {
        entities.push(clean);
      }
    }
  }

  // 2. 영문 단어 조합 추출 (2단어 이상, retailKnowledge에 없는 것)
  const englishWords = message.match(/[A-Za-z][A-Za-z\s&'-]{1,30}[A-Za-z]/g);
  if (englishWords) {
    for (const word of englishWords) {
      const trimmed = word.trim();
      const lower = trimmed.toLowerCase();
      // 알려진 키워드가 아니고, 일반 영단어가 아니면 고유명사 후보
      if (
        trimmed.length >= 3 &&
        !KNOWN_KEYWORDS.has(lower) &&
        !COMMON_RETAIL_TERMS.has(lower) &&
        !isCommonEnglishWord(lower)
      ) {
        entities.push(trimmed);
      }
    }
  }

  // 3. 한글 고유명사 패턴 (XX크로우, XX브랜드명 등)
  //    한글에서 일반적이지 않은 외래어 음차 패턴 감지
  const koreanCandidates = message.match(/[가-힣]{2,10}/g);
  if (koreanCandidates) {
    for (const candidate of koreanCandidates) {
      const lower = candidate.toLowerCase();
      if (
        candidate.length >= 3 &&
        !KNOWN_KEYWORDS.has(lower) &&
        !COMMON_RETAIL_TERMS.has(lower) &&
        !WELL_KNOWN_BRANDS.has(lower) &&
        looksLikeBrandName(candidate, message)
      ) {
        entities.push(candidate);
      }
    }
  }

  // 중복 제거
  return [...new Set(entities)];
}

/**
 * 일반 영어 단어인지 판단 (고유명사가 아닌 것)
 */
function isCommonEnglishWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'what',
    'how', 'why', 'when', 'where', 'which', 'who', 'can', 'will', 'about',
    'new', 'best', 'top', 'good', 'make', 'help', 'get', 'use', 'like',
    'more', 'most', 'very', 'just', 'also', 'than', 'other', 'some', 'all',
    'please', 'want', 'need', 'tell', 'know', 'think', 'give', 'create',
    'analysis', 'compare', 'recommend', 'suggest', 'plan', 'report',
    'online', 'offline', 'global', 'local', 'total', 'average', 'percent',
  ]);
  return commonWords.has(word);
}

/**
 * 한글 단어가 브랜드명처럼 보이는지 판단
 * 맥락 기반 + 형태 기반 판단
 */
function looksLikeBrandName(candidate: string, fullMessage: string): boolean {
  // ── 형태 기반: 업종 접미어가 포함된 복합어 (예: XX골프, XX패션, XX뷰티) ──
  const BRAND_SUFFIXES = /(?:골프|패션|뷰티|스포츠|리빙|푸드|키친|커피|베이커리|스토어|랩|하우스|클럽|웨어|몰|샵|마켓|갤러리|플레이스|스튜디오|카페|코스메틱|홈|라이프|팩토리)$/;
  if (BRAND_SUFFIXES.test(candidate)) {
    return true; // "매너스골프", "블랙야크스포츠" 등 → 높은 확률로 브랜드명
  }

  // ── 맥락 기반: 브랜드명 뒤에 오는 단어 패턴 ──
  const brandContextPatterns = [
    // 기존 패턴
    new RegExp(`${candidate}\\s*(수입|팝업|매장|오픈|론칭|입점|브랜드|제품|상품|컬렉션)`),
    new RegExp(`(수입|해외|글로벌|유럽|미국|일본|프랑스|이탈리아)\\s*.*${candidate}`),
    new RegExp(`${candidate}\\s*(이|가|을|를|의|에서|에)\\s`),
    // 확장 패턴: 유통/분석/현황 등 비즈니스 맥락
    new RegExp(`${candidate}\\s*(한국|국내|해외|글로벌|유통|현황|분석|전략|매출|실적|히스토리)`),
    new RegExp(`${candidate}\\s*(인스타|sns|소셜|마케팅|광고|채널|홈페이지|사이트)`),
    new RegExp(`${candidate}\\s*(리서치|조사|검색|찾아|알려|소개|설명)`),
    // "XX에 대해", "XX에대해", "XX 관련" 등
    new RegExp(`${candidate}\\s*(에\\s*대해|관련|관한|대한|정보)`),
  ];

  return brandContextPatterns.some(p => p.test(fullMessage));
}

// ═══════════════════════════════════════════
//  메인 라우터
// ═══════════════════════════════════════════

export function routeQuery(
  message: string,
  conversationHistory?: string[]
): QueryRouteResult {
  const msgLower = message.toLowerCase();

  // 1. 잘 알려진 브랜드는 검색 불필요
  for (const brand of WELL_KNOWN_BRANDS) {
    if (msgLower.includes(brand)) {
      return {
        augmentation: 'none',
        detectedEntities: [],
      };
    }
  }

  // 2. 검색 트리거 패턴 매칭 (최신 정보 필요)
  for (const pattern of SEARCH_TRIGGER_PATTERNS) {
    if (pattern.test(message)) {
      return {
        augmentation: 'web_search',
        detectedEntities: [],
        searchReason: 'latest_info_requested',
      };
    }
  }

  // 3. 고유명사 감지
  const entities = detectEntities(message);

  if (entities.length > 0) {
    // 감지된 엔티티가 WELL_KNOWN_BRANDS에 있는지 확인
    const unknownEntities = entities.filter(e =>
      !WELL_KNOWN_BRANDS.has(e.toLowerCase())
    );

    if (unknownEntities.length > 0) {
      return {
        augmentation: 'web_search',
        detectedEntities: unknownEntities,
        searchReason: `unknown_entity: ${unknownEntities.join(', ')}`,
      };
    }
  }

  // 4. 기존 retailKnowledge로 충분
  return {
    augmentation: 'none',
    detectedEntities: [],
  };
}
