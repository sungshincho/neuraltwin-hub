import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema with length limits
const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  company: z.string().trim().min(1, 'Company is required').max(200, 'Company must be less than 200 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  phone: z.string().trim().max(20, 'Phone must be less than 20 characters').optional(),
  stores: z.number().int().min(1, 'Stores must be at least 1').max(10000, 'Stores must be less than 10000').optional(),
  features: z.array(z.string()).optional(),
  timeline: z.string().max(50, 'Timeline must be less than 50 characters').optional(),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

interface ContactFormData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  stores?: number;
  features?: string[];
  timeline?: string;
  message: string;
}

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return { allowed: true };
  }
  
  if (limit.count >= 5) {
    const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  limit.count++;
  return { allowed: true };
}

function maskEmail(email: string): string {
  const match = email.match(/(.{2}).*(@.*)/);
  return match ? `${match[1]}***${match[2]}` : '***';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIp);
    
    if (!rateLimitCheck.allowed) {
      console.log('Rate limit exceeded for IP:', clientIp);
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests',
          details: `Please try again in ${rateLimitCheck.retryAfter} seconds`
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '3600'
          } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawData = await req.json();

    // Validate with zod schema
    const validationResult = contactFormSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.issues.length, 'issues');
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const formData = validationResult.data;

    console.log('Contact form submission validated:', {
      email: maskEmail(formData.email),
      timestamp: new Date().toISOString()
    });

    // Insert into database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: formData.name.trim(),
        company: formData.company.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim(),
        stores: formData.stores,
        features: formData.features || [],
        timeline: formData.timeline,
        message: formData.message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error occurred');
      throw error;
    }

    console.log('Contact submission saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing contact form');
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'An error occurred while processing your request'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
