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

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

interface WebChatRequest {
  message: string;
  sessionId?: string;         // 비회원용 세션 ID
  conversationId?: string;    // 기존 대화 이어가기
  history?: ChatMessage[];    // 클라이언트 측 히스토리 (선택적)
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

async function getOrCreateConversation(
  supabase: ReturnType<typeof createClient>,
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
  supabase: ReturnType<typeof createClient>,
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

    // 메시지 카운트 증가
    await supabase.rpc('increment_message_count', {
      p_conversation_id: conversationId
    });
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
      max_tokens: 4096,
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
//  SSE 스트리밍 응답
// ═══════════════════════════════════════════

function createSSEStream(
  upstreamResponse: Response,
  conversationId: string,
  classification: { primaryTopic: string; confidence: number },
  onComplete: (fullContent: string) => void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let fullContent = '';

  return new ReadableStream({
    async start(controller) {
      const reader = upstreamResponse.body?.getReader();

      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // 완료 이벤트 전송
            const doneEvent = `event: done\ndata: ${JSON.stringify({
              conversationId,
              classification,
              totalLength: fullContent.length
            })}\n\n`;
            controller.enqueue(encoder.encode(doneEvent));

            onComplete(fullContent);
            controller.close();
            break;
          }

          // 업스트림 SSE 파싱
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;

                if (content) {
                  fullContent += content;

                  // 청크 이벤트 전송
                  const chunkEvent = `event: chunk\ndata: ${JSON.stringify({ content })}\n\n`;
                  controller.enqueue(encoder.encode(chunkEvent));
                }
              } catch {
                // JSON 파싱 실패는 무시
              }
            }
          }
        }
      } catch (err) {
        console.error('[SSE] Stream error:', err);

        const errorEvent = `event: error\ndata: ${JSON.stringify({ error: 'Stream error' })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    }
  });
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
    const { message, sessionId, conversationId, history } = body;

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 인증 확인 (v2.1)
    const auth = await extractUserFromJWT(request);

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

    // 4. Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. 대화 생성/조회
    const conversation = await getOrCreateConversation(
      supabase,
      effectiveSessionId,
      effectiveUserId,
      conversationId
    );

    // 6. 토픽 분류 & 시스템 프롬프트 빌드
    const historyTexts = history?.map(h => h.content) || [];
    const { systemPrompt, classification } = buildEnrichedPrompt(message, historyTexts);

    console.log(`[Topic] ${formatClassification(classification)}`);

    // 7. 메시지 히스토리 구성
    const chatMessages: ChatMessage[] = history || [];
    chatMessages.push({ role: 'user', content: message });

    // 8. 사용자 메시지 로깅
    if (conversation) {
      await logMessage(supabase, conversation.id, 'user', message, {
        topic: classification.primaryTopic,
        confidence: classification.confidence,
        keywords: classification.detectedKeywords
      });
    }

    // 9. Lovable Gateway 호출 (비스트리밍 모드)
    const upstreamResponse = await callLovableGateway(systemPrompt, chatMessages, false);

    // 10. JSON 응답 파싱
    const data = await upstreamResponse.json();
    const assistantContent = data.choices?.[0]?.message?.content || '';

    if (!assistantContent) {
      console.error('[AI] No content in response:', JSON.stringify(data));
      throw new Error('AI가 응답을 생성하지 못했습니다.');
    }

    // 11. TASK 7: Pain Point 추출
    const painPointResult: PainPointResult = extractPainPoints(message, historyTexts);

    // 12. TASK 7: Sales Bridge 평가
    const salesBridgeResult: SalesBridgeResult = evaluateSalesBridge({
      turnCount: conversation?.message_count || historyTexts.length,
      painPointDetected: painPointResult.painPoints.length > 0,
      primaryPainCategory: painPointResult.primaryPain,
      topicCategory: classification.primaryTopic,
      hasExplicitInterest: checkExplicitInterest(message),
      repeatTopics: false
    });

    // 13. TASK 7: 후속 질문 생성
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

    // 14. 어시스턴트 응답 로깅 (Pain Point 데이터 포함)
    if (conversation) {
      await logMessage(supabase, conversation.id, 'assistant', assistantContent, {
        topic: classification.primaryTopic,
        painPointSummary: painPointResult.summary,
        containsPainPoint: painPointResult.painPoints.length > 0,
        confidence: classification.confidence,
        solutionMentioned: assistantContent.toLowerCase().includes('neuraltwin')
      });
    }

    // 15. JSON 응답 반환 (TASK 7 필드 추가)
    return new Response(
      JSON.stringify({
        content: assistantContent,
        conversationId: conversation?.id || '',
        sessionId: effectiveSessionId || '',
        classification: {
          topic: classification.primaryTopic,
          confidence: classification.confidence
        },
        // TASK 7: 세일즈 브릿지 + Pain Point 필드
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
        }
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
