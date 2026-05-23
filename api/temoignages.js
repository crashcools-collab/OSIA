// ============================================================
// OSIA · Vercel Function · Témoignages
// GET  /api/temoignages       → liste tous les avis
// POST /api/temoignages       → ajoute un nouvel avis
// Stockage : Upstash Redis — clé "osia:temoignages"
// ============================================================

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KEY = 'osia:temoignages';
const MAX_NAME = 80;
const MAX_MESSAGE = 2000;
const MAX_PRODUCT = 60;
const MIN_NAME = 2;
const MIN_MESSAGE = 10;
const MAX_FETCH = 200;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const items = await redis.lrange(KEY, 0, MAX_FETCH - 1);
      const reviews = (items || []).map((it) => {
        if (typeof it === 'string') {
          try { return JSON.parse(it); } catch { return null; }
        }
        return it;
      }).filter(Boolean);

      return res.status(200).json({
        ok: true,
        count: reviews.length,
        reviews,
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const product = typeof body.product === 'string' ? body.product.trim() : 'global';
      const ratingRaw = parseInt(body.rating, 10);

      if (name.length < MIN_NAME) {
        return res.status(400).json({ ok: false, error: `Nom trop court (min ${MIN_NAME} caractères)` });
      }
      if (message.length < MIN_MESSAGE) {
        return res.status(400).json({ ok: false, error: `Message trop court (min ${MIN_MESSAGE} caractères)` });
      }
      if (name.length > MAX_NAME) {
        return res.status(400).json({ ok: false, error: `Nom trop long (max ${MAX_NAME} caractères)` });
      }
      if (message.length > MAX_MESSAGE) {
        return res.status(400).json({ ok: false, error: `Message trop long (max ${MAX_MESSAGE} caractères)` });
      }

      const rating = Number.isFinite(ratingRaw) ? Math.max(1, Math.min(5, ratingRaw)) : 5;

      const sanitize = (s) => s.replace(/[<>]/g, '');

      const review = {
        id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
        name: sanitize(name).slice(0, MAX_NAME),
        rating,
        product: sanitize(product).slice(0, MAX_PRODUCT),
        message: sanitize(message).slice(0, MAX_MESSAGE),
        timestamp: new Date().toISOString(),
      };

      await redis.lpush(KEY, JSON.stringify(review));

      return res.status(200).json({ ok: true, review });
    }

    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  } catch (e) {
    console.error('[temoignages] error:', e);
    return res.status(500).json({
      ok: false,
      error: e.message || 'Erreur serveur',
    });
  }
}
