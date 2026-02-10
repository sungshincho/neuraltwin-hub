/**
 * Lovable Gateway 임베딩 지원 여부 테스트
 * 한 번 호출 후 삭제할 임시 Edge Function
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async () => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/embeddings';

  const models = [
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002',
  ];

  const results: Record<string, unknown> = {};

  for (const model of models) {
    try {
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: '리테일 매장 전환율 테스트',
        }),
      });

      const body = await res.text();

      results[model] = {
        status: res.status,
        ok: res.ok,
        body: res.ok ? JSON.parse(body) : body.slice(0, 300),
      };
    } catch (err) {
      results[model] = {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
