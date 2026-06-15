const axios  = require('axios');
const logger = require('../config/logger');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ─── Gemini chat helper ────────────────────────────────────────
async function chat(systemPrompt, userPrompt, jsonMode = false) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `${systemPrompt}\n\n${userPrompt}${jsonMode ? '\n\nRespond ONLY with valid raw JSON. Do not wrap it in markdown code fences.' : ''}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  try {
    const { data } = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.error(`Gemini returned no text: ${JSON.stringify(data)}`);
      throw new Error('Gemini returned an empty response');
    }
    return text;
  } catch (err) {
    const apiError = err.response?.data?.error;
    if (apiError) {
      logger.error(`Gemini API error [${apiError.code}]: ${apiError.message}`);
      throw new Error(`Gemini API error: ${apiError.message}`);
    }
    logger.error(`Gemini request failed: ${err.message}`);
    throw err;
  }
}

// Strip markdown code fences (```json ... ```) if Gemini adds them anyway
function stripCodeFences(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

// ─── Feature methods ──────────────────────────────────────────

/**
 * Natural-language → SQL WHERE clause for segmentation
 */
async function nlToSqlSegment(naturalLanguage) {
  const system = `You are a MySQL expert. Convert the user's natural language description 
into a valid SQL WHERE clause for a "customers" table with these columns:
  customer_id, name, email, phone, city, total_spent, order_count, last_order_at, created_at

Rules:
- Return ONLY a JSON object: { "sql": "<WHERE clause>", "explanation": "<brief explanation>" }
- Do NOT include the word WHERE.
- Use DATE_SUB(NOW(), INTERVAL N DAY) for date-relative conditions.
- total_spent is DECIMAL, order_count is INT.
- If you cannot convert, set sql to "1=0" and explain why.`;

  const raw = await chat(system, naturalLanguage, true);
  try {
    return JSON.parse(stripCodeFences(raw));
  } catch {
    return { sql: '1=1', explanation: 'Could not parse AI response; returning all customers.' };
  }
}

/**
 * Generate campaign message copy
 */
async function generateCampaignMessage({ channel, segmentDescription, goal }) {
  const system = `You are an expert retail marketing copywriter. 
Write a compelling ${channel} message for a retail brand.
Audience: ${segmentDescription}
Goal: ${goal}

Return JSON: { "message": "<message text>", "tip": "<one personalization tip>" }`;

  const raw = await chat(system, `Write a ${channel} campaign message.`, true);
  try {
    return JSON.parse(stripCodeFences(raw));
  } catch {
    return { message: stripCodeFences(raw), tip: '' };
  }
}

/**
 * Full AI assistant chat (segment + message + channel recommendation)
 */
async function assistantChat(userMessage, history = []) {
  const system = `You are an AI assistant for a retail CRM platform. 
Help marketers grow sales, increase retention, and re-engage customers.
When answering, always provide:
1. Recommended audience segment
2. Suggested message
3. Best channel (WhatsApp/SMS/Email/RCS) and why
4. Expected outcome
Be concise, practical, and data-driven. Format your response clearly with sections.`;

  const historyText = history
    .slice(-6)
    .map(h => `${h.role}: ${h.content}`)
    .join('\n');

  const fullPrompt = historyText ? `${historyText}\nuser: ${userMessage}` : userMessage;
  return chat(system, fullPrompt, false);
}

/**
 * Suggest smart segments from customer data summary
 */
async function suggestSegments(stats) {
  const system = `You are a retail CRM strategist. Based on the customer statistics below,
suggest 3 high-impact audience segments with actionable campaigns.
Return JSON array: [{ "name": "", "description": "", "sql_condition": "", "campaign_idea": "" }]`;

  const raw = await chat(system, JSON.stringify(stats), true);
  try {
    const parsed = JSON.parse(stripCodeFences(raw));
    return Array.isArray(parsed) ? parsed : parsed.segments || [];
  } catch {
    return [];
  }
}

module.exports = { nlToSqlSegment, generateCampaignMessage, assistantChat, suggestSegments };