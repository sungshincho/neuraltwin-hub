/**
 * NEURALTWIN Web Search Module
 * Serper API를 통한 실시간 웹 검색
 *
 * 브랜드, 기업, 제품 등 외부 정보가 필요할 때 호출
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperKnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  descriptionSource?: string;
  attributes?: Record<string, string>;
}

interface SerperResponse {
  organic?: SerperResult[];
  knowledgeGraph?: SerperKnowledgeGraph;
}

export interface WebSearchResult {
  query: string;
  knowledgeSummary?: string;
  results: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
  context: string; // AI에 주입할 최종 컨텍스트
}

// ═══════════════════════════════════════════
//  Serper API 호출
// ═══════════════════════════════════════════

const SERPER_API_URL = 'https://google.serper.dev/search';

export async function searchWeb(query: string, numResults: number = 5): Promise<WebSearchResult> {
  const apiKey = Deno.env.get('SERPER_API_KEY');

  if (!apiKey) {
    console.warn('[WebSearch] SERPER_API_KEY not configured');
    return { query, results: [], context: '' };
  }

  try {
    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        gl: 'kr',     // 한국 결과 우선
        hl: 'ko',     // 한국어
        num: numResults,
      }),
    });

    if (!response.ok) {
      console.error(`[WebSearch] Serper API error: ${response.status}`);
      return { query, results: [], context: '' };
    }

    const data: SerperResponse = await response.json();

    // Knowledge Graph 요약
    let knowledgeSummary: string | undefined;
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      const parts: string[] = [];
      if (kg.title) parts.push(kg.title);
      if (kg.type) parts.push(`(${kg.type})`);
      if (kg.description) parts.push(kg.description);
      if (kg.attributes) {
        for (const [key, value] of Object.entries(kg.attributes)) {
          parts.push(`${key}: ${value}`);
        }
      }
      knowledgeSummary = parts.join(' | ');
    }

    // 검색 결과 정리
    const results = (data.organic || []).slice(0, numResults).map(r => ({
      title: r.title,
      snippet: r.snippet,
      url: r.link,
    }));

    // AI 컨텍스트 구성
    const contextParts: string[] = ['[웹 검색 결과]'];

    if (knowledgeSummary) {
      contextParts.push(`요약: ${knowledgeSummary}`);
    }

    for (const r of results) {
      contextParts.push(`- ${r.title}: ${r.snippet}`);
    }

    contextParts.push('위 검색 결과를 참고하여 정확한 정보 기반으로 답변하세요. 검색 결과와 다른 내용을 지어내지 마세요.');

    const context = contextParts.join('\n');

    console.log(`[WebSearch] query="${query}", results=${results.length}, kg=${!!knowledgeSummary}`);

    return {
      query,
      knowledgeSummary,
      results,
      context,
    };
  } catch (err) {
    console.error('[WebSearch] Error:', err);
    return { query, results: [], context: '' };
  }
}

// ═══════════════════════════════════════════
//  검색 쿼리 생성 (브랜드/기업 + 리테일 컨텍스트)
// ═══════════════════════════════════════════

export function buildSearchQuery(
  message: string,
  detectedEntities: string[]
): string {
  // 감지된 고유명사가 있으면 해당 엔티티 중심 쿼리
  if (detectedEntities.length > 0) {
    const entity = detectedEntities[0];
    // 리테일 맥락 추가
    if (message.includes('팝업') || message.includes('popup')) {
      return `${entity} 브랜드 공식 사이트 제품 카테고리`;
    }
    if (message.includes('수입') || message.includes('import')) {
      return `${entity} brand official products`;
    }
    return `${entity} 브랜드 소개 제품`;
  }

  // 엔티티 없으면 원본 메시지 축약
  return message.slice(0, 100);
}
