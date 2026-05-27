/**
 * Vercel Edge Function — Agent55-OS Onboarding AI Proxy
 * Route: /api/onboarding-chat
 *
 * Accepts POST { messages: Array, tenantId: string }
 * Forwards to Gemini 1.5 Flash with native systemInstruction parameter.
 * Returns { reply: string } or { error: string }.
 */

export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are an AI onboarding assistant for Agent55-OS, a medical website platform. Your job is to collect everything needed to build a professional clinic website for a physician-client.

RULES:
- Ask exactly ONE question per turn. Never list multiple questions.
- Be warm, professional, and medically literate in tone.
- Adapt your questions based on previous answers — do not ask for information already provided.
- You must collect these required fields: physician_name, specialty, credentials, clinic_name, clinic_address, clinic_phone, clinic_hours, services_offered.
- Collect these optional fields naturally when appropriate: portrait_photo_url, brand_primary_color, brand_secondary_color, social_media_links, whatsapp_routing_number.
- After collecting clinic data, discuss website features conversationally. Available modules: hero_consultant_profile, ent_clinical_accordion, whatsapp_direct_routing, patient_intake_triage_v1, floating_ai_concierge_v1, testimonials_carousel, appointment_calendar, insurance_info, blog_posts, map_directions, multilingual_toggle. Let the physician describe any custom features not in this list.
- When you have collected all required fields and discussed features, output EXACTLY this structure as your final message — no text before or after the block:

[EXPORT_READY]{
  "physician_profile": { "name": "", "specialty": "", "credentials": "" },
  "clinic": { "name": "", "address": "", "phone": "", "hours": "" },
  "branding": { "portrait_url": null, "primary_color": null, "secondary_color": null, "social_media_links": null },
  "contact": { "whatsapp_routing": null },
  "services": [],
  "modules": { "selected": [], "custom": [] }
}[/EXPORT_READY]`;

const GEMINI_MODEL = 'gemini-1.5-flash';

export default async function handler(req) {
  // CORS preflight
  // TODO SPRINT-002: restrict CORS to agent55 domain
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Server configuration error: GEMINI_API_KEY not set.' }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const { messages = [], tenantId } = body;

  if (!Array.isArray(messages)) {
    return jsonResponse({ error: '`messages` must be an array.' }, 400);
  }

  // Convert message array to Gemini format (no system prompt — sent via system_instruction)
  const contents = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(msg.content || '') }],
  }));

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[onboarding-chat] Gemini error:', geminiRes.status, errText);
      return jsonResponse(
        { error: `Gemini API error: ${geminiRes.status} — ${errText.slice(0, 200)}` },
        502
      );
    }

    const geminiData = await geminiRes.json();
    const candidates = geminiData?.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return jsonResponse({ error: 'Gemini returned no candidates.' }, 502);
    }

    const replyText = candidates[0]?.content?.parts?.[0]?.text || '';

    if (!replyText) {
      return jsonResponse({ error: 'Gemini returned empty response.' }, 502);
    }

    return jsonResponse({ reply: replyText });
  } catch (err) {
    console.error('[onboarding-chat] Fetch error:', err);
    return jsonResponse({ error: `Internal proxy error: ${err.message}` }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
