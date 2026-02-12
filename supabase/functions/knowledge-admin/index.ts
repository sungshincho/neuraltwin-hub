/**
 * Knowledge Admin Edge Function
 *
 * 벡터 지식 DB 관리용 API
 * - migrate_static: retailKnowledge.ts → 벡터 DB 마이그레이션
 * - seed_curated: seedCuratedKnowledge.ts 큐레이션 데이터 적재
 * - stats: 지식 DB 통계 조회
 *
 * 인증: SUPABASE_SERVICE_ROLE_KEY 필수 (관리자 전용)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { migrateStaticKnowledge } from '../retail-chatbot/knowledge/migrateFromStatic.ts';
import { seedAllCuratedKnowledge } from '../retail-chatbot/knowledge/seedCuratedKnowledge.ts';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * 지식 DB 통계 조회
 */
async function getStats(supabase: SupabaseClient) {
  const { data: chunks, error } = await supabase
    .from('retail_knowledge_chunks')
    .select('topic_id, chunk_type, source');

  if (error) throw error;

  const stats = {
    totalChunks: chunks.length,
    byTopic: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    withEmbedding: 0,
  };

  for (const chunk of chunks) {
    stats.byTopic[chunk.topic_id] = (stats.byTopic[chunk.topic_id] || 0) + 1;
    stats.byType[chunk.chunk_type] = (stats.byType[chunk.chunk_type] || 0) + 1;
    stats.bySource[chunk.source] = (stats.bySource[chunk.source] || 0) + 1;
  }

  // 임베딩 유무 통계
  const { count } = await supabase
    .from('retail_knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  stats.withEmbedding = count || 0;

  return stats;
}

serve(async (request: Request) => {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Supabase 클라이언트 (서비스 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result: unknown;

    switch (action) {
      case 'migrate_static': {
        console.log('[KnowledgeAdmin] Starting static knowledge migration...');
        result = await migrateStaticKnowledge(supabase);
        break;
      }

      case 'seed_curated': {
        console.log('[KnowledgeAdmin] Starting curated knowledge seeding...');
        await seedAllCuratedKnowledge(supabase);
        result = { success: true, message: 'Curated knowledge seeded' };
        break;
      }

      case 'stats': {
        console.log('[KnowledgeAdmin] Fetching stats...');
        result = await getStats(supabase);
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown action',
            validActions: ['migrate_static', 'seed_curated', 'stats'],
          }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, action, result }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[KnowledgeAdmin] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
