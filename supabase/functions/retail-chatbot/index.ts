/**
 * NEURALTWIN Website Chatbot Edge Function
 *
 * 웹사이트 방문자를 위한 리테일 전문 AI 챗봇
 * - 비회원(session_id) + 회원(user_id via JWT) 모두 지원 (v2.1)
 * - Gemini 2.5 Pro via Lovable Gateway
 * - SSE 스트리밍 응답
 * - 토픽 라우터 기반 도메인 지식 주입
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildEnrichedPrompt, formatClassification } from './topicRouter.ts';
import { extractPainPoints, type PainPointResult } from './painPointExtractor.ts';
import { evaluateSalesBridge, checkExplicitInterest, type SalesBridgeResult } from './salesBridge.ts';
import { generateSuggestions, type SuggestionResult } from './suggestionGenerator.ts';
import { routeQuery } from './queryRouter.ts';
import { searchWeb, buildSearchQuery, dualSearch } from './webSearch.ts';

// ═══════════════════════════════════════════
//  VizDirective 타입 및 파싱 유틸리티
// ═══════════════════════════════════════════

interface VizAnnotation {
  zone: string;
  text: string;
  color: string;
}

interface VizKPI {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  highlight?: boolean;
}

// PHASE H: 파라메트릭 스토어 설정
interface StoreParams {
  storeWidth?: number;
  storeDepth?: number;
  storeHeight?: number;
  fittingRoomCount?: number;
}

interface ZoneScale {
  [zoneId: string]: {
    scaleX?: number;
    scaleZ?: number;
  };
}

// 동적 존 정의 (AI가 대화 맥락에 맞게 생성)
interface DynamicZone {
  id: string;
  label: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

interface VizDirective {
  vizState: 'overview' | 'entry' | 'exploration' | 'purchase' | 'topdown';
  highlights: string[];
  zones?: DynamicZone[];    // AI 동적 생성 존
  annotations?: VizAnnotation[];
  flowPath?: boolean;
  kpis?: VizKPI[];
  stage?: 'entry' | 'exploration' | 'purchase';
  storeParams?: StoreParams;  // PHASE H
  zoneScale?: ZoneScale;      // PHASE H
}

const VALID_VIZ_STATES = ['overview', 'entry', 'exploration', 'purchase', 'topdown'];
const VALID_STAGES = ['entry', 'exploration', 'purchase'];

/**
 * 잘린 JSON 문자열 복구 시도
 * max_tokens truncation으로 JSON이 불완전할 때 기본 구조만 살려냄
 */
function repairTruncatedJson(partial: string): string | null {
  // 최소한 vizState와 highlights가 있어야 복구 가능
  if (!partial.includes('"vizState"') || !partial.includes('"highlights"')) {
    return null;
  }

  let json = partial;

  // 열린 문자열 닫기: 마지막 열린 따옴표 찾기
  const lastQuote = json.lastIndexOf('"');
  const beforeLastQuote = json.substring(0, lastQuote);
  const quoteCount = (beforeLastQuote.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // 홀수개 따옴표 = 열린 문자열이 있음 → 닫기
    json = json.substring(0, lastQuote + 1);
  }

  // 열린 배열/객체 닫기
  const openBrackets: string[] = [];
  let inString = false;
  let prevChar = '';
  for (const char of json) {
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') openBrackets.push('}');
      else if (char === '[') openBrackets.push(']');
      else if (char === '}' || char === ']') openBrackets.pop();
    }
    prevChar = char;
  }

  // 마지막 불완전 value 제거 (trailing comma + 잘린 key/value)
  json = json.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
  json = json.replace(/,\s*\{[^}]*$/, '');
  json = json.replace(/,\s*$/, '');

  // 열린 괄호 닫기
  while (openBrackets.length > 0) {
    json += openBrackets.pop();
  }

  try {
    JSON.parse(json);
    return json;
  } catch {
    return null;
  }
}

/**
 * AI 응답에서 ```viz 블록을 추출하고 VizDirective로 파싱
 * PHASE G: kpis, stage 필드 지원 추가
 */
function extractVizDirectiveFromResponse(response: string): VizDirective | null {
  // ```viz ... ``` 블록 찾기
  let match = response.match(/```viz\s*\n?([\s\S]*?)\n?```/);

  // 잘린 viz 블록 복구 시도 (max_tokens로 인한 truncation)
  if (!match) {
    const truncatedMatch = response.match(/```viz\s*\n?([\s\S]+)$/);
    if (truncatedMatch) {
      console.log('[VizDirective] Detected truncated viz block, attempting recovery...');
      const partial = truncatedMatch[1].trim();
      const repaired = repairTruncatedJson(partial);
      if (repaired) {
        match = [truncatedMatch[0], repaired] as RegExpMatchArray;
        console.log('[VizDirective] Successfully recovered truncated viz block');
      } else {
        console.warn('[VizDirective] Could not recover truncated viz block');
      }
    }
  }

  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());

    // vizState 유효성 검증
    if (!parsed.vizState || !VALID_VIZ_STATES.includes(parsed.vizState)) {
      console.warn('[VizDirective] Invalid vizState:', parsed.vizState);
      return null;
    }

    // 동적 존 유효성 검증
    // 영문 zone ID → 한국어 라벨 자동 매핑 (AI가 한국어 라벨을 생략했을 때 보정)
    // Phase 1: 전체 ID 매칭 (우선순위 높음)
    const ZONE_LABEL_FALLBACK: Record<string, string> = {
      entrance: '입구', entry: '입구', display: '진열대', showcase: '쇼케이스',
      counter: '카운터', checkout: '계산대', main: '메인 구역', main_floor: '메인 매장',
      fitting_room: '피팅룸', fitting_studio: '피팅 스튜디오', power_wall: '파워 월',
      accessory: '액세서리', tasting: '시식 코너', seating: '좌석 구역',
      kitchen: '주방', takeout: '테이크아웃', experience: '체험존',
      limited: '한정판 구역', tester_bar: '테스터 바', skincare: '스킨케어',
      makeup: '메이크업', consultation: '컨설팅', demo: '체험 존', service: 'AS/상담',
      produce: '신선식품', deli: '델리', grocery: '식료품', beverage: '음료',
      photo_zone: '포토존', packaging: '포장 구역', waiting: '대기 구역',
      menu_board: '메뉴판', bar: '바 카운터', lounge: '라운지', bar_lounge: '바/라운지',
      popup: '팝업 존', event: '이벤트 존', vip: 'VIP 구역', vip_lounge: 'VIP 라운지',
      gallery: '갤러리', studio: '스튜디오', cafe: '카페', green_cafe: '그린 카페',
      putting_green: '퍼팅 그린', putting_green_cafe: '퍼팅 그린/카페',
      vic_lounge: 'VIC 라운지', members_lounge: '멤버스 라운지',
      brand_gallery: '브랜드 갤러리', decompression: '감압 구간',
      simulation: '시뮬레이션', indoor_range: '인도어 레인지',
      custom_fitting: '커스텀 피팅', pro_shop: '프로샵',
      workshop: '워크숍', seminar: '세미나', kids: '키즈 존',
      outdoor: '아웃도어', terrace: '테라스', rooftop: '루프탑',
      storage: '창고', office: '오피스', staff: '스태프 구역',
      community: '커뮤니티', co_working: '코워킹', meeting: '미팅룸',
      reception: '리셉션', concierge: '컨시어지',
    };

    // Phase 2: 단어 단위 한국어 변환 사전
    const WORD_KO: Record<string, string> = {
      entrance: '입구', entry: '입구', exit: '출구', main: '메인', floor: '매장',
      fitting: '피팅', room: '룸', studio: '스튜디오', counter: '카운터',
      checkout: '계산대', display: '진열', showcase: '쇼케이스', power: '파워',
      wall: '월', accessory: '액세서리', tasting: '시식', seating: '좌석',
      kitchen: '주방', takeout: '테이크아웃', experience: '체험', zone: '존',
      area: '구역', limited: '한정', edition: '에디션', tester: '테스터',
      bar: '바', skincare: '스킨케어', makeup: '메이크업', beauty: '뷰티',
      consultation: '상담', consulting: '컨설팅', demo: '데모', service: '서비스',
      produce: '신선', fresh: '신선', deli: '델리', grocery: '식료품',
      beverage: '음료', drink: '음료', coffee: '커피', tea: '티',
      photo: '포토', packaging: '포장', waiting: '대기', lounge: '라운지',
      menu: '메뉴', board: '보드', popup: '팝업', pop: '팝', up: '업',
      event: '이벤트', vip: 'VIP', vic: 'VIC', premium: '프리미엄',
      gallery: '갤러리', art: '아트', brand: '브랜드', cafe: '카페',
      green: '그린', putting: '퍼팅', golf: '골프', range: '레인지',
      indoor: '인도어', outdoor: '아웃도어', simulation: '시뮬레이션',
      custom: '커스텀', pro: '프로', shop: '샵', store: '스토어',
      workshop: '워크숍', seminar: '세미나', kids: '키즈', children: '키즈',
      terrace: '테라스', rooftop: '루프탑', garden: '가든',
      members: '멤버스', member: '멤버', club: '클럽',
      community: '커뮤니티', reception: '리셉션', concierge: '컨시어지',
      storage: '창고', office: '오피스', staff: '스태프',
      new: '신상', arrival: '신상품', seasonal: '시즌', collection: '컬렉션',
      private: '프라이빗', exclusive: '익스클루시브',
      wellness: '웰니스', spa: '스파', fitness: '피트니스',
      dining: '다이닝', restaurant: '레스토랑', bakery: '베이커리',
      wine: '와인', cocktail: '칵테일', dessert: '디저트',
    };

    // 영문 ID/라벨 → 한국어 변환 (Phase 1: 전체 매칭 → Phase 2: 단어 분리 변환)
    function enrichLabel(id: string, label: string): string {
      const lc = label.toLowerCase().trim();
      const idLc = id.toLowerCase().trim();

      // 한국어가 이미 포함되어 있으면 그대로 반환
      if (/[가-힣]/.test(lc)) {
        return label;
      }

      // Phase 1: 전체 ID 또는 전체 라벨로 정확히 매칭
      const fullMatch =
        ZONE_LABEL_FALLBACK[idLc] ||
        ZONE_LABEL_FALLBACK[lc.replace(/\s+/g, '_')] ||
        ZONE_LABEL_FALLBACK[lc.replace(/[-\s]+/g, '_')];
      if (fullMatch) return fullMatch;

      // Phase 2: 단어 분리 후 개별 번역 조합
      const words = idLc.split(/[_\-\s]+/).filter(Boolean);
      if (words.length > 0) {
        const translated = words.map(w => WORD_KO[w] || w);
        // 모든 단어가 번역되었는지 확인
        const allTranslated = words.every(w => WORD_KO[w]);
        if (allTranslated || translated.some(t => /[가-힣]/.test(t))) {
          return translated.join(' ');
        }
      }

      // Phase 3: 라벨 자체를 단어 분리 시도
      const labelWords = lc.split(/[_\-\s]+/).filter(Boolean);
      if (labelWords.length > 0) {
        const translated = labelWords.map(w => WORD_KO[w] || w);
        if (translated.some(t => /[가-힣]/.test(t))) {
          return translated.join(' ');
        }
      }

      // 모든 변환 실패: 원본 라벨 반환
      return label;
    }

    let validatedZones: DynamicZone[] | undefined;
    if (parsed.zones && Array.isArray(parsed.zones)) {
      validatedZones = parsed.zones
        .filter((z: DynamicZone) => z.id && z.label && typeof z.x === 'number' && typeof z.z === 'number')
        .slice(0, 10) // 최대 10개 존
        .map((z: DynamicZone) => ({
          id: String(z.id),
          label: enrichLabel(String(z.id), String(z.label)).slice(0, 30),
          x: Math.min(10, Math.max(-10, z.x)),
          z: Math.min(10, Math.max(-10, z.z)),
          w: Math.min(15, Math.max(2, z.w || 4)),
          d: Math.min(15, Math.max(2, z.d || 4)),
          color: typeof z.color === 'string' && z.color.startsWith('#') ? z.color : '#64748b'
        }));

      // 겹침 방지: 존들이 서로 너무 많이 겹치면 자동으로 밀어냄
      if (validatedZones.length > 1) {
        for (let i = 0; i < validatedZones.length; i++) {
          for (let j = i + 1; j < validatedZones.length; j++) {
            const a = validatedZones[i];
            const b = validatedZones[j];
            // 존 AABB 겹침 검사
            const overlapX = (a.w / 2 + b.w / 2) - Math.abs(a.x - b.x);
            const overlapZ = (a.d / 2 + b.d / 2) - Math.abs(a.z - b.z);
            if (overlapX > 0.5 && overlapZ > 0.5) {
              // 겹침 → 밀어냄 (b를 a에서 멀리)
              const dx = b.x - a.x || 0.1;
              const dz = b.z - a.z || 0.1;
              const dist = Math.sqrt(dx * dx + dz * dz) || 1;
              const pushX = (dx / dist) * (overlapX * 0.6);
              const pushZ = (dz / dist) * (overlapZ * 0.6);
              b.x = Math.min(10, Math.max(-10, b.x + pushX));
              b.z = Math.min(10, Math.max(-10, b.z + pushZ));
            }
          }
        }
      }

      if (validatedZones.length === 0) validatedZones = undefined;
    }

    // 동적 존이 있으면 해당 ID 집합으로 highlights/annotations 검증
    const validZoneIds = validatedZones
      ? new Set(validatedZones.map(z => z.id))
      : null;

    // highlights 유효성 검증
    if (!Array.isArray(parsed.highlights)) {
      parsed.highlights = [];
    }
    parsed.highlights = parsed.highlights.filter((z: string) =>
      typeof z === 'string' && (!validZoneIds || validZoneIds.has(z))
    );

    // annotations 유효성 검증
    if (parsed.annotations && Array.isArray(parsed.annotations)) {
      parsed.annotations = parsed.annotations
        .filter((a: VizAnnotation) => a.zone && a.text && (!validZoneIds || validZoneIds.has(a.zone)))
        .slice(0, 3); // 최대 3개
    }

    // flowPath 기본값
    if (typeof parsed.flowPath !== 'boolean') {
      parsed.flowPath = false;
    }

    // PHASE G: kpis 유효성 검증 (AI가 응답에서 언급한 수치)
    let validatedKpis: VizKPI[] | undefined;
    if (parsed.kpis && Array.isArray(parsed.kpis)) {
      validatedKpis = parsed.kpis
        .filter((k: VizKPI) => k.label && k.value)
        .slice(0, 4)  // 최대 4개
        .map((k: VizKPI) => ({
          label: String(k.label).slice(0, 15),
          value: String(k.value),
          sub: k.sub ? String(k.sub).slice(0, 20) : '',
          alert: !!k.alert,
          highlight: !!k.highlight
        }));
    }

    // PHASE G: stage 유효성 검증
    let validatedStage: 'entry' | 'exploration' | 'purchase' | undefined;
    if (parsed.stage && VALID_STAGES.includes(parsed.stage)) {
      validatedStage = parsed.stage;
    }

    // PHASE H: storeParams 유효성 검증
    let validatedStoreParams: StoreParams | undefined;
    if (parsed.storeParams && typeof parsed.storeParams === 'object') {
      const sp = parsed.storeParams;
      validatedStoreParams = {};

      // 매장 크기 검증 (10m ~ 50m)
      if (typeof sp.storeWidth === 'number') {
        validatedStoreParams.storeWidth = Math.min(50, Math.max(10, sp.storeWidth));
      }
      if (typeof sp.storeDepth === 'number') {
        validatedStoreParams.storeDepth = Math.min(50, Math.max(10, sp.storeDepth));
      }
      if (typeof sp.storeHeight === 'number') {
        validatedStoreParams.storeHeight = Math.min(8, Math.max(3, sp.storeHeight));
      }
      if (typeof sp.fittingRoomCount === 'number') {
        validatedStoreParams.fittingRoomCount = Math.min(10, Math.max(1, Math.floor(sp.fittingRoomCount)));
      }

      // 모든 값이 undefined면 전체를 undefined로
      if (Object.values(validatedStoreParams).every(v => v === undefined)) {
        validatedStoreParams = undefined;
      }
    }

    // PHASE H: zoneScale 유효성 검증
    let validatedZoneScale: ZoneScale | undefined;
    if (parsed.zoneScale && typeof parsed.zoneScale === 'object') {
      validatedZoneScale = {};

      for (const [zoneId, scale] of Object.entries(parsed.zoneScale)) {
        // 동적 존 ID 또는 기존 존 ID 모두 허용
        const isValidZone = validZoneIds ? validZoneIds.has(zoneId) : true;
        if (isValidZone && typeof scale === 'object' && scale !== null) {
          const typedScale = scale as { scaleX?: number; scaleZ?: number };
          const validScale: { scaleX?: number; scaleZ?: number } = {};

          // 배율 범위: 0.5 ~ 2.0
          if (typeof typedScale.scaleX === 'number') {
            validScale.scaleX = Math.min(2, Math.max(0.5, typedScale.scaleX));
          }
          if (typeof typedScale.scaleZ === 'number') {
            validScale.scaleZ = Math.min(2, Math.max(0.5, typedScale.scaleZ));
          }

          if (validScale.scaleX !== undefined || validScale.scaleZ !== undefined) {
            validatedZoneScale[zoneId] = validScale;
          }
        }
      }

      // 빈 객체면 undefined로
      if (Object.keys(validatedZoneScale).length === 0) {
        validatedZoneScale = undefined;
      }
    }

    const result: VizDirective = {
      vizState: parsed.vizState,
      highlights: parsed.highlights,
      annotations: parsed.annotations?.length ? parsed.annotations : undefined,
      flowPath: parsed.flowPath,
      kpis: validatedKpis?.length ? validatedKpis : undefined,
      stage: validatedStage,
      storeParams: validatedStoreParams,
      zoneScale: validatedZoneScale
    };

    // 동적 존이 있으면 포함
    if (validatedZones) {
      result.zones = validatedZones;
      console.log(`[VizDirective] Dynamic zones: ${validatedZones.length}개 (${validatedZones.map(z => z.id).join(', ')})`);
    }

    return result;
  } catch (err) {
    console.warn('[VizDirective] JSON parse error:', err);
    return null;
  }
}

/**
 * 응답 텍스트에서 ```viz 블록 제거 (클라이언트에 표시할 텍스트)
 */
function cleanResponseText(response: string): string {
  return response
    .replace(/```viz[\s\S]*?```/g, '')       // 완전한 viz 블록 제거
    .replace(/```viz[\s\S]*$/g, '')           // 잘린 viz 블록도 제거
    .replace(/\n{3,}/g, '\n\n')              // 연속 빈 줄 정리
    .trim();
}

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

// 파일 첨부 데이터
interface FileAttachmentData {
  name: string;
  type: string;
  size: number;
  url: string;
  textContent?: string;
}

interface WebChatRequest {
  message?: string;
  sessionId?: string;         // 비회원용 세션 ID
  conversationId?: string;    // 기존 대화 이어가기
  history?: ChatMessage[];    // 클라이언트 측 히스토리 (선택적)
  attachments?: FileAttachmentData[];  // 첨부 파일 데이터
  stream?: boolean;           // 클라이언트 SSE 스트리밍 요청 (default: true, 모바일은 false)
  // TASK 9: Action 분기
  action?: 'chat' | 'capture_lead' | 'handover_session' | 'log_reaction';
  lead?: LeadFormData;
  // log_reaction 전용
  reaction?: {
    messageId?: string;         // 프론트엔드 메시지 ID
    type: 'copy' | 'positive' | 'negative';
    messageContent?: string;    // 리액션 대상 메시지 내용 (처음 200자)
  };
}

// TASK 9: 리드 폼 데이터
interface LeadFormData {
  email: string;
  company?: string;
  role?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationRecord {
  id: string;
  session_id: string | null;
  user_id: string | null;
  channel: 'website' | 'os_app';
  message_count: number;
}

// ═══════════════════════════════════════════
//  CORS 헤더
// ═══════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://neuraltwin.com',
  'https://www.neuraltwin.com',
  'https://neuraltwin.website',
  'https://www.neuraltwin.website',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';

  // Lovable 프리뷰/배포 URL 패턴 허용
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
                    origin.endsWith('.lovable.app') ||
                    origin.endsWith('.lovableproject.com');

  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-id',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ═══════════════════════════════════════════
//  JWT 검증 & 사용자 추출 (v2.1)
// ═══════════════════════════════════════════

interface AuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
}

async function extractUserFromJWT(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false, userId: null, email: null };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.warn('[Auth] JWT validation failed:', error?.message);
      return { isAuthenticated: false, userId: null, email: null };
    }

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email || null
    };
  } catch (err) {
    console.error('[Auth] Error extracting user from JWT:', err);
    return { isAuthenticated: false, userId: null, email: null };
  }
}

// ═══════════════════════════════════════════
//  Rate Limiting (간단 버전)
// ═══════════════════════════════════════════

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit: number = 10): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1분

  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// ═══════════════════════════════════════════
//  대화 로깅 (DB)
// ═══════════════════════════════════════════

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = any;

async function getOrCreateConversation(
  supabase: SupabaseClientAny,
  sessionId: string | null,
  userId: string | null,
  conversationId?: string
): Promise<ConversationRecord | null> {
  // 기존 대화 이어가기
  if (conversationId) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!error && data) {
      return data as ConversationRecord;
    }
  }

  // 새 대화 생성
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      channel: 'website',
      session_id: sessionId,
      user_id: userId,
      message_count: 0,
      channel_metadata: {
        source: 'web_chatbot',
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Failed to create conversation:', error);
    return null;
  }

  return data as ConversationRecord;
}

async function logMessage(
  supabase: SupabaseClientAny,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role,
      content,
      channel_data: metadata || {}
    });

    // 메시지 카운트 증가 (에러 무시)
    try {
      await supabase.rpc('increment_message_count', {
        p_conversation_id: conversationId
      });
    } catch {
      // RPC가 없을 수 있음 - 무시
    }
  } catch (err) {
    console.error('[DB] Failed to log message:', err);
    // 실패해도 계속 진행 (fail-open)
  }
}

// ═══════════════════════════════════════════
//  Lovable Gateway API 호출
// ═══════════════════════════════════════════

const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function callLovableGateway(
  systemPrompt: string,
  messages: ChatMessage[],
  stream: boolean = true
): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch(LOVABLE_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 8192,
      stream,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lovable Gateway error: ${response.status} - ${errorText}`);
  }

  return response;
}

// ═══════════════════════════════════════════
//  SSE 스트리밍 응답 (A-1: 완전한 SSE 파이프라인)
// ═══════════════════════════════════════════

/**
 * 업스트림 AI SSE → 클라이언트 SSE 프록시
 * - text 이벤트: 일반 텍스트 청크
 * - viz 이벤트: 완성된 VizDirective JSON
 * - meta 이벤트: suggestions, salesBridge, painPoints
 * - done 이벤트: 스트리밍 완료 + conversationId
 * - error 이벤트: 에러 발생
 *
 * viz 블록 감지: ```viz 시작 → 버퍼링 → ``` 끝 → 파싱 후 viz 이벤트 전송
 */
function createSSEStreamV2(
  upstreamResponse: Response,
  opts: {
    conversationId: string;
    classification: { primaryTopic: string; confidence: number };
    vizDirectiveFallback: VizDirective | null;
    suggestions: string[];
    salesBridge: SalesBridgeResult;
    painPoints: PainPointResult;
    showLeadForm: boolean;
    isAuthenticated: boolean;
    sessionId: string;
    onComplete: (fullContent: string, vizDirective: VizDirective | null) => void;
  }
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let fullContent = '';
  let vizBuffer = '';
  let isInsideVizBlock = false;
  let sseBuffer = '';  // 업스트림 SSE 라인 버퍼

  function sendEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
  }

  return new ReadableStream({
    async start(controller) {
      // 1) meta 이벤트 먼저 전송 (AI 응답과 무관한 미리 계산된 데이터)
      sendEvent(controller, 'meta', {
        suggestions: opts.suggestions,
        showLeadForm: opts.showLeadForm,
        salesBridge: {
          leadScore: opts.salesBridge.leadScore,
          stage: opts.salesBridge.stage,
        },
        painPoints: {
          detected: opts.painPoints.painPoints.length > 0,
          primary: opts.painPoints.primaryPain,
          summary: opts.painPoints.summary,
        },
        classification: {
          topic: opts.classification.primaryTopic,
          confidence: opts.classification.confidence,
        },
      });

      const reader = upstreamResponse.body?.getReader();
      if (!reader) {
        sendEvent(controller, 'error', { error: 'No response body' });
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // 업스트림 종료 — 미완성 viz 블록 처리
            if (isInsideVizBlock && vizBuffer.length > 0) {
              console.log('[SSE] Attempting to recover truncated viz block at stream end');
              const repaired = repairTruncatedJson(vizBuffer);
              if (repaired) {
                try {
                  const parsed = JSON.parse(repaired);
                  const vizDir = extractVizDirectiveFromResponse('```viz\n' + repaired + '\n```');
                  if (vizDir) {
                    sendEvent(controller, 'viz', vizDir);
                  }
                } catch { /* ignore */ }
              }
              isInsideVizBlock = false;
              vizBuffer = '';
            }

            // done 이벤트 전송
            sendEvent(controller, 'done', {
              conversationId: opts.conversationId,
              sessionId: opts.sessionId,
              isAuthenticated: opts.isAuthenticated,
            });

            const finalViz = extractVizDirectiveFromResponse(fullContent);
            opts.onComplete(fullContent, finalViz);
            controller.close();
            break;
          }

          // 업스트림 SSE 청크 파싱
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          // 마지막 줄은 불완전할 수 있으므로 버퍼에 보관
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (!content) continue;

              fullContent += content;

              // viz 블록 감지 및 분리
              let remaining = content;

              while (remaining.length > 0) {
                if (isInsideVizBlock) {
                  // viz 블록 종료 감지: ```
                  const endIdx = remaining.indexOf('```');
                  if (endIdx !== -1) {
                    vizBuffer += remaining.substring(0, endIdx);
                    remaining = remaining.substring(endIdx + 3);
                    isInsideVizBlock = false;

                    // viz 블록 파싱 및 전송
                    const vizDir = extractVizDirectiveFromResponse('```viz\n' + vizBuffer + '\n```');
                    if (vizDir) {
                      // AI 생성 viz + fallback kpis/stage 병합
                      const mergedViz: VizDirective = {
                        ...vizDir,
                        kpis: vizDir.kpis || opts.vizDirectiveFallback?.kpis,
                        stage: vizDir.stage || opts.vizDirectiveFallback?.stage,
                      };
                      sendEvent(controller, 'viz', mergedViz);
                      console.log(`[SSE] Sent viz event: state=${mergedViz.vizState}, zones=${mergedViz.zones?.length || 0}`);
                    } else {
                      console.warn('[SSE] Failed to parse viz block');
                    }
                    vizBuffer = '';
                  } else {
                    vizBuffer += remaining;
                    remaining = '';
                  }
                } else {
                  // viz 블록 시작 감지: ```viz
                  const startIdx = remaining.indexOf('```viz');
                  if (startIdx !== -1) {
                    // viz 시작 전의 텍스트 전송
                    const textBefore = remaining.substring(0, startIdx);
                    if (textBefore) {
                      sendEvent(controller, 'text', { content: textBefore });
                    }
                    // viz 블록 버퍼링 시작 (```viz\n 이후부터)
                    const afterMarker = remaining.substring(startIdx + 6);
                    // 줄바꿈으로 시작하면 제거
                    remaining = afterMarker.startsWith('\n') ? afterMarker.substring(1) : afterMarker;
                    isInsideVizBlock = true;
                    vizBuffer = '';
                  } else {
                    // 일반 텍스트: 단, 부분적 ``` 매치 방지
                    // 끝이 ` 또는 `` 로 끝나면 다음 청크까지 대기
                    const backtickTail = remaining.match(/`{1,5}$/);
                    if (backtickTail) {
                      const safe = remaining.substring(0, remaining.length - backtickTail[0].length);
                      if (safe) {
                        sendEvent(controller, 'text', { content: safe });
                      }
                      // 백틱 부분은 sseBuffer 에 넣지 않고 fullContent 에 이미 포함됨
                      // 다음 청크에서 ```viz 판단됨
                      remaining = '';
                    } else {
                      sendEvent(controller, 'text', { content: remaining });
                      remaining = '';
                    }
                  }
                }
              }
            } catch {
              // JSON 파싱 실패는 무시
            }
          }
        }
      } catch (err) {
        console.error('[SSE] Stream error:', err);
        sendEvent(controller, 'error', { error: 'Stream processing error' });
        controller.close();
      } finally {
        reader.releaseLock();
      }
    }
  });
}

// ═══════════════════════════════════════════
//  TASK 9: Lead Capture 핸들러
// ═══════════════════════════════════════════

async function handleCaptureLead(
  supabase: SupabaseClientAny,
  body: WebChatRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sessionId, conversationId, lead } = body;

  if (!lead?.email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. conversationId로 Pain Point 정보 조회
    let painPoints: string[] = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('channel_data')
        .eq('conversation_id', conversationId)
        .not('channel_data->painPointSummary', 'is', null);

      if (messages && messages.length > 0) {
        painPoints = messages
          .map((m: { channel_data?: { painPointSummary?: string } }) => m.channel_data?.painPointSummary)
          .filter((p: string | undefined): p is string => !!p);
      }
    }

    // 2. chat_leads 테이블에 저장
    const { data, error } = await supabase
      .from('chat_leads')
      .insert({
        conversation_id: conversationId || null,
        email: lead.email,
        company: lead.company || null,
        role: lead.role || null,
        pain_points: painPoints,
        source_page: '/chat'
      })
      .select()
      .single();

    if (error) {
      console.error('[Lead] Insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to capture lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. chat_events에 이벤트 기록
    if (conversationId) {
      await supabase.from('chat_events').insert({
        conversation_id: conversationId,
        channel: 'website',
        event_type: 'lead_captured',
        event_data: { lead_id: data.id, email: lead.email, company: lead.company }
      });
    }

    console.log(`[Lead] Captured: ${lead.email} (${lead.company || 'no company'})`);

    return new Response(
      JSON.stringify({ success: true, leadId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Lead] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ═══════════════════════════════════════════
//  TASK 9: Session Handover 핸들러
// ═══════════════════════════════════════════

async function handleSessionHandover(
  supabase: SupabaseClientAny,
  body: WebChatRequest,
  auth: AuthResult,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sessionId } = body;

  if (!auth.isAuthenticated || !auth.userId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required for session handover' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Session ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // DB 함수 호출 (handover_chat_session)
    const { data, error } = await supabase
      .rpc('handover_chat_session', {
        p_session_id: sessionId,
        p_user_id: auth.userId
      });

    if (error) {
      console.error('[Handover] RPC error:', error);
      return new Response(
        JSON.stringify({ error: 'Session handover failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Handover] Session ${sessionId} → User ${auth.userId} (${data} conversations updated)`);

    return new Response(
      JSON.stringify({ success: true, updatedCount: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Handover] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ═══════════════════════════════════════════
//  리액션 로그 기록 핸들러
// ═══════════════════════════════════════════

async function handleLogReaction(
  supabase: ReturnType<typeof createClient>,
  body: WebChatRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { reaction, sessionId, conversationId } = body;

    if (!reaction || !reaction.type) {
      return new Response(
        JSON.stringify({ error: 'reaction.type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // chat_events 테이블에 리액션 이벤트 로깅
    const eventData: Record<string, unknown> = {
      reactionType: reaction.type,     // 'copy' | 'positive' | 'negative'
      messageId: reaction.messageId,
      sessionId,
      conversationId,
      timestamp: new Date().toISOString(),
    };

    // 메시지 내용 일부 저장 (디버깅/분석용, 200자 제한)
    if (reaction.messageContent) {
      eventData.messagePreview = reaction.messageContent.slice(0, 200);
    }

    const { error: eventError } = await supabase
      .from('chat_events')
      .insert({
        conversation_id: conversationId || null,
        channel: 'website',
        event_type: `reaction_${reaction.type}`,
        event_data: eventData,
      });

    if (eventError) {
      console.error('[Reaction] Event log error:', eventError);
    }

    // positive/negative 피드백인 경우 — conversationId가 있으면 최근 assistant 메시지에 user_feedback 업데이트
    if ((reaction.type === 'positive' || reaction.type === 'negative') && conversationId) {
      const { data: recentMsg } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentMsg) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ user_feedback: reaction.type })
          .eq('id', recentMsg.id);

        if (updateError) {
          console.error('[Reaction] Message feedback update error:', updateError);
        }
      }
    }

    console.log(`[Reaction] ${reaction.type} logged, conv=${conversationId || 'none'}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Reaction] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ═══════════════════════════════════════════
//  메인 핸들러
// ═══════════════════════════════════════════

serve(async (request: Request) => {
  const corsHeaders = getCorsHeaders(request);

  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // POST만 허용
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. 요청 파싱
    const body: WebChatRequest = await request.json();
    const { message, sessionId, conversationId, history, action, attachments } = body;

    // 2. 인증 확인 (v2.1)
    const auth = await extractUserFromJWT(request);

    // 3. Supabase 클라이언트 생성 (action 분기에서도 필요)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ═══════════════════════════════════════════
    // TASK 9: Action 분기 처리
    // ═══════════════════════════════════════════

    if (action === 'capture_lead') {
      return handleCaptureLead(supabase, body, corsHeaders);
    }

    if (action === 'handover_session') {
      return handleSessionHandover(supabase, body, auth, corsHeaders);
    }

    if (action === 'log_reaction') {
      return handleLogReaction(supabase, body, corsHeaders);
    }

    // ═══════════════════════════════════════════
    // 기본 Chat 로직 (action이 없거나 'chat'인 경우)
    // ═══════════════════════════════════════════

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 세션/사용자 식별자 결정
    const effectiveSessionId = auth.isAuthenticated ? null : (sessionId || crypto.randomUUID());
    const effectiveUserId = auth.isAuthenticated ? auth.userId : null;

    // 식별자가 없으면 에러
    if (!effectiveSessionId && !effectiveUserId) {
      return new Response(
        JSON.stringify({ error: 'Session ID or authentication required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Rate Limiting
    const rateLimitKey = effectiveUserId || effectiveSessionId || 'unknown';
    const rateLimit = auth.isAuthenticated ? 30 : 10; // 회원은 더 높은 한도

    if (!checkRateLimit(rateLimitKey, rateLimit)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 대화 생성/조회
    const conversation = await getOrCreateConversation(
      supabase,
      effectiveSessionId,
      effectiveUserId,
      conversationId
    );

    // 6. 토픽 분류 & 시스템 프롬프트 빌드 (+ VizDirective)
    const historyTexts = history?.map(h => h.content) || [];
    const turnCount = conversation?.message_count || historyTexts.length;
    let { systemPrompt, classification, vizDirective } = buildEnrichedPrompt(message, historyTexts, turnCount);

    console.log(`[Topic] ${formatClassification(classification)}`);
    if (vizDirective) {
      console.log(`[VizDirective] state=${vizDirective.vizState}, highlights=[${vizDirective.highlights.join(',')}]`);
    }

    // 7. 웹 검색 (queryRouter가 필요하다고 판단한 경우)
    const queryRoute = routeQuery(message, historyTexts);
    let searchContext = '';

    if (queryRoute.augmentation === 'web_search') {
      console.log(`[QueryRouter] Web search triggered: ${queryRoute.searchReason}`);

      // 미지 엔티티가 있으면 → 듀얼 검색 (웹 + 소셜미디어 병렬)
      // 트리거 패턴만 매칭이면 → 기존 단일 검색
      if (queryRoute.detectedEntities.length > 0) {
        const { combinedContext } = await dualSearch(message, queryRoute.detectedEntities);
        if (combinedContext) {
          searchContext = '\n\n' + combinedContext;
          systemPrompt += searchContext;
          console.log(`[DualSearch] Injected combined web+sns context`);
        }
      } else {
        const searchQuery = buildSearchQuery(message, queryRoute.detectedEntities);
        const searchResult = await searchWeb(searchQuery);
        if (searchResult.context) {
          searchContext = '\n\n' + searchResult.context;
          systemPrompt += searchContext;
          console.log(`[WebSearch] Injected ${searchResult.results.length} results into context`);
        }
      }
    } else {
      console.log(`[QueryRouter] No search needed`);
    }

    // 8. 첨부 파일 컨텍스트 구성
    let fileContext = '';
    if (attachments && attachments.length > 0) {
      const parts: string[] = [];
      for (const file of attachments) {
        if (file.textContent) {
          parts.push(`[파일: ${file.name}]\n${file.textContent}`);
        } else {
          parts.push(`[첨부 파일: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)]`);
        }
      }
      fileContext = '\n\n' + parts.join('\n\n');
      console.log(`[Attachments] ${attachments.length}개 파일, 텍스트 ${parts.filter((_, i) => attachments[i].textContent).length}개`);
    }

    // 9. 메시지 히스토리 구성
    const chatMessages: ChatMessage[] = history || [];
    chatMessages.push({ role: 'user', content: message + fileContext });

    // 10. 사용자 메시지 로깅 (첨부 파일 메타데이터 + 검색 정보 포함)
    if (conversation) {
      await logMessage(supabase, conversation.id, 'user', message, {
        topic: classification.primaryTopic,
        confidence: classification.confidence,
        keywords: classification.detectedKeywords,
        webSearchUsed: queryRoute.augmentation === 'web_search',
        searchReason: queryRoute.searchReason,
        detectedEntities: queryRoute.detectedEntities,
        attachments: attachments?.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url,
        })),
      });
    }

    // 11. Pre-compute: Pain Point, Sales Bridge, Suggestions (AI 응답 전에 계산)
    const painPointResult: PainPointResult = extractPainPoints(message, historyTexts);

    const salesBridgeResult: SalesBridgeResult = evaluateSalesBridge({
      turnCount: conversation?.message_count || historyTexts.length,
      painPointDetected: painPointResult.painPoints.length > 0,
      primaryPainCategory: painPointResult.primaryPain,
      topicCategory: classification.primaryTopic,
      hasExplicitInterest: checkExplicitInterest(message),
      repeatTopics: false
    });

    const suggestionResult: SuggestionResult = generateSuggestions({
      topicCategory: classification.primaryTopic,
      painPointCategory: painPointResult.primaryPain,
      conversationStage: salesBridgeResult.stage,
      detectedKeywords: classification.detectedKeywords,
      turnCount: conversation?.message_count || 0
    });

    console.log(`[SalesBridge] score=${salesBridgeResult.leadScore}, stage=${salesBridgeResult.stage}, showForm=${salesBridgeResult.showLeadForm}`);
    if (painPointResult.primaryPain) {
      console.log(`[PainPoint] ${painPointResult.summary}`);
    }

    // 12. Lovable Gateway 호출 — 클라이언트가 stream=false 요청 시 JSON 직행, 아니면 SSE 시도
    const clientWantsStream = body.stream !== false;
    let useStreaming = clientWantsStream;
    let upstreamResponse: Response;

    if (clientWantsStream) {
      try {
        upstreamResponse = await callLovableGateway(systemPrompt, chatMessages, true);
        // Content-Type 확인 — SSE가 아니면 non-streaming fallback
        const ct = upstreamResponse.headers.get('Content-Type') || '';
        if (!ct.includes('text/event-stream') && !ct.includes('text/plain')) {
          useStreaming = false;
          console.log('[AI] Gateway returned non-streaming response, using fallback');
        }
      } catch (streamErr) {
        console.warn('[AI] Streaming call failed, falling back to non-streaming:', streamErr);
        useStreaming = false;
        upstreamResponse = await callLovableGateway(systemPrompt, chatMessages, false);
      }
    } else {
      console.log('[AI] Client requested non-streaming (mobile)');
      upstreamResponse = await callLovableGateway(systemPrompt, chatMessages, false);
    }

    // ═══════════════════════════════════════════
    // PATH A: SSE Streaming 응답
    // ═══════════════════════════════════════════
    if (useStreaming && upstreamResponse.body) {
      console.log('[AI] SSE streaming mode');

      const sseStream = createSSEStreamV2(upstreamResponse, {
        conversationId: conversation?.id || '',
        classification: { primaryTopic: classification.primaryTopic, confidence: classification.confidence },
        vizDirectiveFallback: vizDirective,
        suggestions: suggestionResult.suggestions,
        salesBridge: salesBridgeResult,
        painPoints: painPointResult,
        showLeadForm: salesBridgeResult.showLeadForm,
        isAuthenticated: auth.isAuthenticated,
        sessionId: effectiveSessionId || '',
        onComplete: async (fullContent: string, vizDir: VizDirective | null) => {
          // 비동기 로깅 (스트리밍 완료 후)
          const cleanedContent = cleanResponseText(fullContent);
          if (conversation) {
            await logMessage(supabase, conversation.id, 'assistant', cleanedContent, {
              topic: classification.primaryTopic,
              painPointSummary: painPointResult.summary,
              containsPainPoint: painPointResult.painPoints.length > 0,
              confidence: classification.confidence,
              solutionMentioned: cleanedContent.toLowerCase().includes('neuraltwin'),
              streamed: true,
            });
          }
        },
      });

      return new Response(sseStream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Conversation-Id': conversation?.id || '',
          'X-Session-Id': effectiveSessionId || '',
          'X-Is-Authenticated': String(auth.isAuthenticated),
        }
      });
    }

    // ═══════════════════════════════════════════
    // PATH B: Non-streaming JSON fallback
    // ═══════════════════════════════════════════
    console.log('[AI] Non-streaming fallback mode');

    const data = await upstreamResponse.json();
    const rawAssistantContent = data.choices?.[0]?.message?.content || '';

    if (!rawAssistantContent) {
      console.error('[AI] No content in response:', JSON.stringify(data));
      throw new Error('AI가 응답을 생성하지 못했습니다.');
    }

    const aiGeneratedVizDirective = extractVizDirectiveFromResponse(rawAssistantContent);
    const assistantContent = cleanResponseText(rawAssistantContent);

    let finalVizDirective: VizDirective | null = null;
    if (aiGeneratedVizDirective) {
      finalVizDirective = {
        ...aiGeneratedVizDirective,
        kpis: aiGeneratedVizDirective.kpis || vizDirective?.kpis,
        stage: aiGeneratedVizDirective.stage || vizDirective?.stage
      };
    } else if (vizDirective) {
      finalVizDirective = vizDirective;
    }

    if (conversation) {
      await logMessage(supabase, conversation.id, 'assistant', assistantContent, {
        topic: classification.primaryTopic,
        painPointSummary: painPointResult.summary,
        containsPainPoint: painPointResult.painPoints.length > 0,
        confidence: classification.confidence,
        solutionMentioned: assistantContent.toLowerCase().includes('neuraltwin'),
        streamed: false,
      });
    }

    return new Response(
      JSON.stringify({
        content: assistantContent,
        conversationId: conversation?.id || '',
        sessionId: effectiveSessionId || '',
        classification: {
          topic: classification.primaryTopic,
          confidence: classification.confidence
        },
        suggestions: suggestionResult.suggestions,
        showLeadForm: salesBridgeResult.showLeadForm,
        salesBridge: {
          leadScore: salesBridgeResult.leadScore,
          stage: salesBridgeResult.stage
        },
        painPoints: {
          detected: painPointResult.painPoints.length > 0,
          primary: painPointResult.primaryPain,
          summary: painPointResult.summary
        },
        vizDirective: finalVizDirective
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Conversation-Id': conversation?.id || '',
          'X-Session-Id': effectiveSessionId || '',
          'X-Is-Authenticated': String(auth.isAuthenticated),
        }
      }
    );

  } catch (err) {
    console.error('[Handler] Error:', err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
