/* ============================================================
   OSIA Chatbot - scripté, FAQ préprogrammées
   Inclut dans toutes les pages via <script src="assets/chatbot.js">
   ============================================================ */

const OSIA_FAQ = [
  {
    keywords: ["bonjour", "salut", "hello", "hey", "coucou"],
    answer: "Salut ! Je suis OSIA-Bot. Je connais tout sur OSIA. Tu veux savoir quoi ?"
  },
  {
    keywords: ["osia", "qui", "quoi", "c'est quoi", "presentation"],
    answer: "OSIA est une agence web automatisée. On livre des sites pros + des workflows + des prompts, le tout généré par IA et livré sous 24-48h. Tu choisis le pack, tu paies, tu reçois ton ZIP clé en main."
  },
  {
    keywords: ["prix", "cout", "tarif", "combien", "coute", "297", "essentiel"],
    answer: "Site web Essentiel = 297 € (PDF + ZIP livré). Workflow custom = 30 €/unité. Prompt custom = 30 €/unité. Et tu as 3 workflows + 3 prompts GRATUITS sur la page Freebies."
  },
  {
    keywords: ["workflow", "automation", "n8n"],
    answer: "Un workflow = une automatisation prête à l'emploi (mail auto, leads vers Sheets, post auto, etc). Format JSON, importable dans n8n. 30 €/unité ou 3 gratuits."
  },
  {
    keywords: ["prompt", "ia", "ai", "claude", "gpt"],
    answer: "Un prompt OSIA = un prompt testé et optimisé pour Claude / GPT, prêt à coller. Catégories : copywriting, SEO, audit, automatisation. 30 €/unité ou 3 gratuits."
  },
  {
    keywords: ["delai", "livraison", "quand", "combien de temps"],
    answer: "24-48h pour un site Essentiel. Workflows et prompts = sous 24h. Tout livré par email avec ZIP + facture PDF."
  },
  {
    keywords: ["paiement", "stripe", "virement", "payer", "carte"],
    answer: "Stripe (carte bancaire) ou virement bancaire (IBAN sur la facture). Échéance 30 jours pour les pros."
  },
  {
    keywords: ["tva", "facture", "auto", "entrepreneur", "micro"],
    answer: "Régime micro-entreprise : TVA non applicable (art. 293 B du CGI). La facture est conforme, avec mentions légales obligatoires."
  },
  {
    keywords: ["zip", "fichier", "format", "livré"],
    answer: "Tu reçois un ZIP avec : le site HTML complet, un README, un fichier INSTRUCTIONS (comment héberger), et les assets. Tu héberges où tu veux (Vercel, OVH, Hostinger, etc.)."
  },
  {
    keywords: ["heberger", "host", "vercel", "domaine"],
    answer: "Hébergement non inclus. Recommandé : Vercel (gratuit), OVH ou Hostinger. Le ZIP contient un guide pas-à-pas."
  },
  {
    keywords: ["formulaire", "lead", "contact", "demander", "commander"],
    answer: "Va sur la page Contact, remplis le formulaire. Je te recontacte par email dans la journée pour valider ton brief."
  },
  {
    keywords: ["gratuit", "freebie", "free", "3", "essai"],
    answer: "3 workflows + 3 prompts gratuits sur la page Freebies. Tu donnes ton email, tu télécharges. Aucun spam."
  },
  {
    keywords: ["modele", "exemple", "demo", "sites"],
    answer: "Va sur la page Sites pour voir les modèles : vitrine pro, restaurant, coach, ecommerce simple. Chaque modèle est adaptable à ton brief."
  },
  {
    keywords: ["garanti", "remboursement", "satisfait"],
    answer: "Si le livrable ne correspond pas au brief : 1 révision gratuite. Si après révision tu n'es pas satisfait : remboursement intégral."
  },
  {
    keywords: ["merci", "ok", "super", "cool", "parfait"],
    answer: "Avec plaisir 🚀 Autre question ?"
  }
];

const FALLBACK_ANSWER = "Je n'ai pas la réponse précise. Le mieux : remplis le formulaire de la page Contact, je te réponds perso dans la journée.";

const SUGGESTS = [
  "C'est quoi OSIA ?",
  "Combien ça coûte ?",
  "Délai de livraison ?",
  "C'est quoi les freebies ?"
];

function osiaChatbotInit() {
  const html = `
    <button class="chatbot-toggle" id="chatToggle" aria-label="Ouvrir le chat">+</button>
    <div class="chatbot-window" id="chatWindow">
      <div class="chat-head">
        <div class="title">OSIA · BOT</div>
        <div class="status">EN LIGNE</div>
      </div>
      <div class="chat-body" id="chatBody"></div>
      <div class="chat-suggests" id="chatSuggests"></div>
      <div class="chat-input-wrap">
        <input type="text" class="chat-input" id="chatInput" placeholder="Pose ta question..." />
        <button class="chat-send" id="chatSend">→</button>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const toggle = document.getElementById('chatToggle');
  const win = document.getElementById('chatWindow');
  const body = document.getElementById('chatBody');
  const suggests = document.getElementById('chatSuggests');
  const input = document.getElementById('chatInput');
  const send = document.getElementById('chatSend');

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + type;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function renderSuggests() {
    suggests.innerHTML = '';
    SUGGESTS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'chat-suggest';
      btn.textContent = s;
      btn.onclick = () => {
        input.value = s;
        handleSend();
      };
      suggests.appendChild(btn);
    });
  }

  function findAnswer(question) {
    const q = question.toLowerCase();
    let best = null;
    let bestScore = 0;

    for (const entry of OSIA_FAQ) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (q.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best ? best.answer : FALLBACK_ANSWER;
  }

  function handleSend() {
    const q = input.value.trim();
    if (!q) return;
    addMessage(q, 'user');
    input.value = '';
    setTimeout(() => {
      addMessage(findAnswer(q), 'bot');
    }, 350);
  }

  toggle.onclick = () => {
    win.classList.toggle('open');
    toggle.classList.toggle('open');
    if (win.classList.contains('open') && body.children.length === 0) {
      setTimeout(() => {
        addMessage("Salut ! Je suis OSIA-Bot. Pose-moi n'importe quelle question sur OSIA — tarifs, délais, ce que tu reçois, etc.", 'bot');
      }, 200);
    }
  };

  send.onclick = handleSend;
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSend();
  });

  renderSuggests();
}

document.addEventListener('DOMContentLoaded', osiaChatbotInit);
