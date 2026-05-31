// api/chat.js — Relais IA pour OSIA Tableur (autonome, indépendant d'OSIA)
// Met UNE clé dans Vercel : MISTRAL_API_KEY (recommandé) ou ANTHROPIC_API_KEY.
// Le relais détecte laquelle est présente et l'utilise. Aucune modif côté OSIA.

const MISTRAL_MODEL   = "mistral-small-latest";   // économique
const ANTHROPIC_MODEL = "claude-3-5-haiku-latest"; // si tu utilises Anthropic

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // --- Anti-abus : 15 requêtes / minute / IP (via Upstash KV si configuré) ---
  try {
    const ip = (req.headers["x-forwarded-for"] || "anon").toString().split(",")[0].trim();
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOK = process.env.KV_REST_API_TOKEN;
    if (KV_URL && KV_TOK) {
      const key = `rl_tableur_${ip}`;
      const r = await fetch(`${KV_URL}/incr/${key}`, { headers: { Authorization: `Bearer ${KV_TOK}` } });
      const j = await r.json();
      if (j.result === 1) {
        await fetch(`${KV_URL}/expire/${key}/60`, { headers: { Authorization: `Bearer ${KV_TOK}` } });
      }
      if (j.result > 15) {
        return res.status(429).json({ error: "Trop de questions d'un coup, réessaie dans une minute." });
      }
    }
  } catch (_) { /* KV indisponible : on laisse passer */ }

  // Body : déjà parsé (objet) ou chaîne
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const incoming = Array.isArray(body.messages) ? body.messages : [];

  const MISTRAL = process.env.MISTRAL_API_KEY;
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;

  try {
    // --- Option 1 : Mistral (format OpenAI, le system reste dans messages) ---
    if (MISTRAL) {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${MISTRAL}` },
        body: JSON.stringify({ model: MISTRAL_MODEL, messages: incoming, temperature: 0.3, max_tokens: 800 }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d.error?.message || "Erreur Mistral" });
      return res.status(200).json({ content: d.choices?.[0]?.message?.content || "" });
    }

    // --- Option 2 : Anthropic (system = paramètre séparé) ---
    if (ANTHROPIC) {
      const system = incoming.filter(m => m.role === "system").map(m => m.content).join("\n");
      const messages = incoming.filter(m => m.role !== "system");
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 800, system, messages }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d.error?.message || "Erreur Anthropic" });
      const content = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      return res.status(200).json({ content });
    }

    return res.status(500).json({ error: "Aucune clé IA configurée (MISTRAL_API_KEY ou ANTHROPIC_API_KEY)." });
  } catch (e) {
    return res.status(500).json({ error: "Relais IA indisponible." });
  }
}
