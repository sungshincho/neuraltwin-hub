/**
 * Layout Hint Extractor
 *
 * 웹 검색 결과에서 매장 레이아웃/공간 관련 정보를 추출하여
 * AI가 VizDirective 존 배치 시 참조할 구조화된 힌트를 생성.
 *
 * AI 동적 생성의 핵심 브릿지:
 *   검색 결과(텍스트) → LayoutHint(구조화) → AI 프롬프트 주입 → 동적 viz 생성
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface LayoutHint {
  checkoutPosition?: 'front' | 'back' | 'side';
  flowPattern?: 'free' | 'grid' | 'loop' | 'linear';
  keyZones?: string[];
  spatialNotes?: string[];
}

// ═══════════════════════════════════════════
//  패턴 정의
// ═══════════════════════════════════════════

// 계산대 위치 패턴
const CHECKOUT_BACK_PATTERNS = [
  /계산대.{0,15}(안쪽|뒤쪽|맞은편|반대|끝|후방)/,
  /(?:안쪽|뒤쪽|맞은편|후방).{0,15}계산/,
  /(?:checkout|counter|register).{0,15}(back|rear|far|opposite|end)/i,
  /입구.{0,15}(?:반대편|맞은편).{0,15}(?:계산|카운터|결제)/,
  /(?:계산|결제|카운터).{0,15}입구.{0,8}(?:반대|맞은)/,
  /매장.{0,8}(?:가장|제일).{0,8}(?:안쪽|깊숙|뒤).{0,15}(?:계산|결제|카운터)/,
];

const CHECKOUT_FRONT_PATTERNS = [
  /계산대.{0,15}(입구|앞쪽|옆|근처|전면)/,
  /입구.{0,15}(옆|근처|바로).{0,10}(?:계산|카운터)/,
  /(?:checkout|counter).{0,15}(front|near|entrance)/i,
];

// 동선 패턴
const FLOW_LOOP_PATTERNS = [
  /루프|순환|loop|racetrack|회유|U자/,
  /벽면.{0,10}따라.{0,10}(돌|이동|순회|진행)/,
  /(?:외곽|둘레).{0,10}(?:동선|이동|순회)/,
];

const FLOW_GRID_PATTERNS = [
  /격자|grid|그리드/,
  /진열대.{0,8}열/,
  /통로.{0,8}직선/,
  /(?:일자|일렬|직선).{0,8}(?:배치|진열|통로)/,
];

// 존 명칭 패턴
const ZONE_NAME_PATTERNS = [
  /테스터\s*(?:바|존|구역|코너)/,
  /스킨케어\s*(?:존|구역|코너|섹션)/,
  /메이크업\s*(?:존|구역|코너|섹션)/,
  /프로모션\s*(?:존|구역|코너|섹션)/,
  /체험\s*(?:존|구역|코너)/,
  /포토\s*(?:존|구역|스팟)/,
  /신상품?\s*(?:코너|존|구역)/,
  /시식\s*(?:코너|존|구역)/,
  /피팅\s*(?:룸|존|구역)/,
  /컨설팅\s*(?:존|구역|코너)/,
  /(?:VIP|프리미엄)\s*(?:존|구역|라운지)/i,
  /헬스\s*(?:앤|&)\s*뷰티/,
  /향수\s*(?:존|구역|코너)/,
  /네일\s*(?:존|구역|코너)/,
  /남성\s*(?:존|구역|코너|그루밍)/,
];

// 공간 배치 관련 문장 추출 패턴
const SPATIAL_SENTENCE_PATTERN =
  /(입구|계산대|카운터|진열|매대|존|구역|코너|벽면|중앙|안쪽|뒤쪽|앞쪽|테스터|스킨케어|메이크업).{5,80}(배치|위치|설치|구성|배열|자리|놓|두|있)/;

// ═══════════════════════════════════════════
//  추출 함수
// ═══════════════════════════════════════════

/**
 * 검색 결과 텍스트에서 매장 레이아웃 힌트를 추출
 */
export function extractLayoutHints(searchContext: string): LayoutHint | null {
  if (!searchContext || searchContext.length < 50) return null;

  const hint: LayoutHint = {};
  let hasHint = false;

  // 1. 계산대 위치 추론
  if (CHECKOUT_BACK_PATTERNS.some(p => p.test(searchContext))) {
    hint.checkoutPosition = 'back';
    hasHint = true;
  } else if (CHECKOUT_FRONT_PATTERNS.some(p => p.test(searchContext))) {
    hint.checkoutPosition = 'front';
    hasHint = true;
  }

  // 2. 동선 패턴 추론
  if (FLOW_LOOP_PATTERNS.some(p => p.test(searchContext))) {
    hint.flowPattern = 'loop';
    hasHint = true;
  } else if (FLOW_GRID_PATTERNS.some(p => p.test(searchContext))) {
    hint.flowPattern = 'grid';
    hasHint = true;
  }

  // 3. 언급된 존 이름 수집
  const keyZones: string[] = [];
  for (const p of ZONE_NAME_PATTERNS) {
    const m = searchContext.match(p);
    if (m) keyZones.push(m[0].trim());
  }
  if (keyZones.length > 0) {
    hint.keyZones = [...new Set(keyZones)];
    hasHint = true;
  }

  // 4. 공간 관련 서술 문장 추출 (최대 3개)
  const sentences = searchContext.split(/[.。\n]/).filter(s => s.length > 10 && s.length < 200);
  const spatialNotes = sentences
    .filter(s => SPATIAL_SENTENCE_PATTERN.test(s))
    .slice(0, 3)
    .map(s => s.trim());
  if (spatialNotes.length > 0) {
    hint.spatialNotes = spatialNotes;
    hasHint = true;
  }

  return hasHint ? hint : null;
}

// ═══════════════════════════════════════════
//  포맷팅 함수
// ═══════════════════════════════════════════

/**
 * LayoutHint → AI 프롬프트용 텍스트 블록 생성
 * 이 블록은 시스템 프롬프트에 삽입되어 AI가 VizDirective 존 배치 시 참조
 */
export function formatLayoutHintForPrompt(hint: LayoutHint): string {
  const lines: string[] = ['', '[매장 레이아웃 힌트 — 웹 검색 기반]'];
  lines.push('아래는 웹 검색 결과에서 추출한 실제 매장 레이아웃 정보입니다.');
  lines.push('VizDirective 존 배치 시 이 정보를 반드시 반영하세요.');
  lines.push('');

  if (hint.checkoutPosition) {
    const posMap: Record<string, string> = {
      back: '매장 안쪽/뒤쪽 (z: -5 ~ -8)',
      front: '입구 근처 (z: 5 ~ 7)',
      side: '측면 (x: ±6~7)',
    };
    lines.push(`- 계산대 위치: ${posMap[hint.checkoutPosition]}`);
  }

  if (hint.flowPattern) {
    const flowMap: Record<string, string> = {
      loop: '루프형/순환 동선 (벽면 따라 순회)',
      grid: '격자형 직선 동선 (통로 기반)',
      free: '자유 동선 (비선형)',
      linear: '직선 동선 (입구→안쪽)',
    };
    lines.push(`- 동선 패턴: ${flowMap[hint.flowPattern]}`);
  }

  if (hint.keyZones && hint.keyZones.length > 0) {
    lines.push(`- 주요 존: ${hint.keyZones.join(', ')}`);
  }

  if (hint.spatialNotes && hint.spatialNotes.length > 0) {
    lines.push('- 공간 배치 참고:');
    for (const note of hint.spatialNotes) {
      lines.push(`  · ${note}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
