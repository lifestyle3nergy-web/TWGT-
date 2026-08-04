// src/ai/devin.ts — simple Devin API wrapper
import fetch from 'node-fetch';

const DEVIN_URL = process.env.DEVIN_API_URL;
const DEVIN_KEY = process.env.DEVIN_API_KEY;

export async function callDevin(prompt: string, context?: Record<string, any>) {
  if (!DEVIN_URL || !DEVIN_KEY) {
    throw new Error('DEVIN_API_URL or DEVIN_API_KEY not configured');
  }

  const res = await fetch(DEVIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEVIN_KEY}`,
    },
    body: JSON.stringify({ prompt, context }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Devin API error: ${res.status} ${text}`);
  }

  const payload = await res.json();
  // adjust according to Devin's real response shape
  return payload;
}
