// src/routes.ts — basic express routes and handover endpoint
import express from 'express';
import bodyParser from 'body-parser';
import { callDevin } from './ai/devin';
import { auth } from './auth';

const router = express.Router();

router.use(bodyParser.json());

router.get('/health', (_req, res) => res.json({ ok: true }));

router.post('/handover', (req, res) => {
  const { fromAgent, toAgent, sessionId, context } = req.body;
  const timestamp = new Date().toISOString();
  const payload = {
    sessionId,
    handover: { from: fromAgent, to: toAgent, timestamp, context: context || {}, message: `TWGT v2.0 has transferred control from ${fromAgent} → ${toAgent}.` },
  };
  // TODO: persist event to DB / telemetry
  return res.json(payload);
});

// Example /devin endpoint (requires auth in production)
router.post('/devin', auth.requireAuth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const result = await callDevin(prompt, { repo: process.env.GITHUB_REPOSITORY });
    return res.json({ result });
  } catch (err: any) {
    console.error('Devin error', err?.message || err);
    return res.status(500).json({ error: 'Devin call failed', detail: err?.message });
  }
});

export default router;
