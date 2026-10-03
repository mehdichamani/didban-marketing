/**
 * Cloudflare Worker for Didban Marketing & Lead Capture
 * 
 * Routes:
 * - GET  /              -> index.html
 * - GET  /admin         -> admin.html
 * - GET  /security      -> security.html
 * - POST /api/demo      -> Save new demo request to KV (DEMO_KV)
 * - GET  /api/demo      -> List demo requests (Protected by ADMIN_PASSWORD or X-Admin-Password)
 * - DELETE /api/demo?id=... -> Delete demo request
 */

import indexHtml from './index.html';
import adminHtml from './admin.html';
import securityHtml from './security.html';
import logoSvg from './logo.svg';
import faviconSvg from './favicon.svg';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS Headers for API requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Static Assets
    if (pathname === '/favicon.svg' || pathname === '/favicon.ico') {
      return new Response(faviconSvg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    if (pathname === '/logo.svg') {
      return new Response(logoSvg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // Static Pages Routing
    if (pathname === '/' || pathname === '/index.html') {
      return new Response(indexHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (pathname === '/admin' || pathname === '/admin.html') {
      return new Response(adminHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (pathname === '/security' || pathname === '/security.html') {
      return new Response(securityHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // API: /api/demo
    if (pathname === '/api/demo') {
      return handleApiDemo(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleApiDemo(request, env, corsHeaders) {
  const method = request.method;
  const kv = env.DEMO_KV;

  if (!kv) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'پایگاه داده KV (DEMO_KV) در ورکر تعریف نشده است. لطفاً KV Namespace را به wrangler.json اضافه فرمایید.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // --- POST: Submit new demo request ---
  if (method === 'POST') {
    try {
      const body = await request.json();
      const { name, company, phone, email, scale, description } = body;

      if (!name || !phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'نام و شماره تماس الزامی است.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const id = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      const createdAt = new Date().toISOString();

      const item = {
        id,
        name: String(name).slice(0, 100),
        company: String(company || '').slice(0, 100),
        phone: String(phone).slice(0, 30),
        email: String(email || '').slice(0, 100),
        scale: String(scale || 'نامشخص'),
        description: String(description || '').slice(0, 1000),
        createdAt
      };

      // Store in KV with prefix "demo:"
      await kv.put(`demo:${id}`, JSON.stringify(item));

      return new Response(
        JSON.stringify({ success: true, message: 'درخواست شما با موفقیت ثبت شد.', id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: 'خطای سرور در پردازش داده‌ها: ' + e.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Admin authentication check for GET & DELETE
  const adminPassword = env.ADMIN_PASSWORD || 'didban@admin123';
  const reqPass = request.headers.get('X-Admin-Password');

  if (!reqPass || reqPass !== adminPassword) {
    return new Response(
      JSON.stringify({ success: false, error: 'رمز عبور مدیریت اشتباه است.' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // --- GET: List demo requests ---
  if (method === 'GET') {
    try {
      const list = await kv.list({ prefix: 'demo:' });
      const requests = [];

      for (const key of list.keys) {
        const val = await kv.get(key.name);
        if (val) {
          try {
            requests.push(JSON.parse(val));
          } catch (_) {}
        }
      }

      // Sort descending (newest first)
      requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return new Response(
        JSON.stringify({ success: true, requests }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: 'خطا در بارگذاری درخواست‌ها: ' + e.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // --- DELETE: Remove demo request ---
  if (method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'شناسه درخواست الزامی است.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await kv.delete(`demo:${id}`);

      return new Response(
        JSON.stringify({ success: true, message: 'درخواست با موفقیت حذف شد.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: 'خطا در حذف: ' + e.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}
