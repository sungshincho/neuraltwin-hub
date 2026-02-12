/**
 * Question Depth Analyzer — Phase 0
 *
 * 사용자 질문의 수준(beginner / advanced)을 감지하여
 * 시스템 프롬프트와 응답 구조를 분기하는 모듈.
 *
 * 6가지 고급 신호 패턴 감지:
 *  1. 비교 분석 요구 ("A vs B", "차이점", "비교")
 *  2. 조건부/시나리오 질문 ("~한 경우", "~라면", "~때")
 *  3. 수치/벤치마크 요구 ("몇 %", "ROI", "수치", "데이터")
 *  4. 다단계/복합 질문 ("그리고", "또한", "추가로", 쉼표 3개+)
 *  5. 전문 프레임워크 언급 (RFM, CLV, ABC, GMROI 등)
 *  6. 원인 분석/심화 요구 ("왜", "근본 원인", "구조적", "메커니즘")
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export type QuestionDepth = 'beginner' | 'advanced';

export interface DepthAnalysisResult {
  depth: QuestionDepth;
  confidence: number;       // 0~1
  signals: string[];        // 감지된 고급 신호 목록
  signalCount: number;      // 감지된 신호 수
}

// ═══════════════════════════════════════════
//  고급 신호 패턴
// ═══════════════════════════════════════════

interface SignalPattern {
  id: string;
  label: string;
  weight: number;
  patterns: RegExp[];
}

const ADVANCED_SIGNALS: SignalPattern[] = [
  {
    id: 'comparison',
    label: '비교 분석 요구',
    weight: 1.5,
    patterns: [
      /vs\.?|versus/i,
      /비교|차이점|다른\s*점|어떤\s*게\s*나|어떤\s*것이\s*나/,
      /대비|상대적|상대적으로/,
      /A안.*B안|1안.*2안|방법\s*1.*방법\s*2/,
      /와\/과\s*비교|이랑\s*비교/,
      /Grid.*Loop|Loop.*Grid|EDLP.*High.?Low/i,
      /장단점|프로스.*콘스|pros.*cons/i,
    ]
  },
  {
    id: 'conditional',
    label: '조건부/시나리오 질문',
    weight: 1.2,
    patterns: [
      /경우에?는?|상황에?서?는?|시나리오/,
      /~?라면|~?다면|~?면\s*어떻게/,
      /만약에?|가정하[면자]|전제/,
      /소규모.*매장|대형.*매장|매장\s*크기/,
      /예산이?\s*(적|부족|한정|제한)/,
      /if\s+we|what\s+if|in\s+case/i,
    ]
  },
  {
    id: 'quantitative',
    label: '수치/벤치마크 요구',
    weight: 1.3,
    patterns: [
      /몇\s*%|몇\s*퍼센트|퍼센티지|백분율/,
      /ROI|ROAS|GMROI|IRR|NPV/i,
      /수치|데이터|통계|벤치마크|지표/,
      /몇\s*개월|몇\s*주|기간|소요/,
      /투자\s*대비|비용\s*대비|효과\s*측정/,
      /KPI\s*목표|목표\s*수치|기준\s*수치/,
      /평균.*얼마|업계.*평균/,
    ]
  },
  {
    id: 'multi_part',
    label: '다단계/복합 질문',
    weight: 1.0,
    patterns: [
      /그리고\s*또|추가로|더불어|아울러/,
      /첫째.*둘째|1\).*2\)|①.*②/,
      /단계별|순서대로|로드맵|플랜/,
    ]
  },
  {
    id: 'framework',
    label: '전문 프레임워크 언급',
    weight: 2.0,
    patterns: [
      /RFM|CLV|CAC|SPLH|UPT|AUR|ATV/i,
      /ABC\s*분석|파레토|80.?20/,
      /GMROI|Sell.?Through|재고\s*회전/i,
      /Market\s*Basket|연관\s*분석|Lift/i,
      /Price\s*Elasticity|탄력성|카니발/i,
      /옴니채널|유니파이드\s*커머스/,
      /플라노그램|Planogram/i,
      /Decompression|감압\s*구[간역]/i,
      /Golden\s*Triangle|황금\s*삼각/i,
      /Attribution|어트리뷰션/i,
    ]
  },
  {
    id: 'causal',
    label: '원인 분석/심화 요구',
    weight: 1.4,
    patterns: [
      /왜\s*그런|이유가?\s*뭐|원인|근본/,
      /구조적|메커니즘|원리|작동\s*방식/,
      /심층|심화|깊이|디테일|상세/,
      /근거|논리|배경|맥락/,
      /어떤\s*원리|무슨\s*원리/,
    ]
  },
];

// ═══════════════════════════════════════════
//  쉼표/접속사 기반 복합 질문 추가 감지
// ═══════════════════════════════════════════

function detectMultiPartByStructure(message: string): boolean {
  // 쉼표 3개 이상 또는 물음표 2개 이상 → 복합 질문
  const commaCount = (message.match(/,|，/g) || []).length;
  const questionMarkCount = (message.match(/\?|？/g) || []).length;

  if (commaCount >= 3) return true;
  if (questionMarkCount >= 2) return true;

  // "~하고 ~하고" 연쇄
  const andChainCount = (message.match(/하고\s|하며\s|하면서\s/g) || []).length;
  if (andChainCount >= 2) return true;

  return false;
}

// ═══════════════════════════════════════════
//  대화 히스토리 기반 보정
// ═══════════════════════════════════════════

function getHistoryBoost(conversationHistory: string[]): number {
  if (!conversationHistory || conversationHistory.length === 0) return 0;

  // 최근 2턴에서 고급 패턴이 있었으면 → 현재도 고급일 가능성 높음
  const recentHistory = conversationHistory.slice(-2).join(' ');
  let historySignals = 0;

  for (const signal of ADVANCED_SIGNALS) {
    for (const pattern of signal.patterns) {
      if (pattern.test(recentHistory)) {
        historySignals++;
        break;
      }
    }
  }

  // 히스토리에 고급 신호가 2개 이상 → 0.3 부스트
  return historySignals >= 2 ? 0.3 : historySignals >= 1 ? 0.15 : 0;
}

// ═══════════════════════════════════════════
//  메시지 길이 기반 보정
// ═══════════════════════════════════════════

function getLengthBoost(message: string): number {
  const charCount = message.length;
  // 100자 이상 → 고급 질문일 가능성 증가
  if (charCount >= 200) return 0.3;
  if (charCount >= 100) return 0.15;
  return 0;
}

// ═══════════════════════════════════════════
//  메인 분석 함수
// ═══════════════════════════════════════════

export function analyzeQuestionDepth(
  message: string,
  conversationHistory?: string[]
): DepthAnalysisResult {
  const detectedSignals: string[] = [];
  let totalScore = 0;

  // 1. 패턴 매칭
  for (const signal of ADVANCED_SIGNALS) {
    for (const pattern of signal.patterns) {
      if (pattern.test(message)) {
        detectedSignals.push(signal.label);
        totalScore += signal.weight;
        break; // 같은 신호 카테고리에서 중복 매칭 방지
      }
    }
  }

  // 2. 구조 기반 복합 질문 감지
  if (detectMultiPartByStructure(message)) {
    if (!detectedSignals.includes('다단계/복합 질문')) {
      detectedSignals.push('다단계/복합 질문 (구조)');
      totalScore += 1.0;
    }
  }

  // 3. 히스토리 보정
  const historyBoost = getHistoryBoost(conversationHistory || []);
  totalScore += historyBoost;

  // 4. 메시지 길이 보정
  const lengthBoost = getLengthBoost(message);
  totalScore += lengthBoost;

  // 5. 판정: 점수 2.0 이상 또는 신호 2개 이상 → advanced
  const maxPossibleScore = ADVANCED_SIGNALS.reduce((sum, s) => sum + s.weight, 0) + 1.0 + 0.3 + 0.3;
  const confidence = Math.min(totalScore / maxPossibleScore, 1.0);

  const isAdvanced = totalScore >= 2.0 || detectedSignals.length >= 2;

  return {
    depth: isAdvanced ? 'advanced' : 'beginner',
    confidence,
    signals: detectedSignals,
    signalCount: detectedSignals.length,
  };
}
