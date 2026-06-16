/* ============================================================
   OSIA Chatbot 2026 — base de connaissance a jour + matching accent-insensible
   Inclus sur toutes les pages via <script src="assets/chatbot.js">
   ------------------------------------------------------------
   Bot 100% local (aucune cle API exposee). Pour le brancher plus
   tard sur le vrai Claude (gateway OSIA2), renseigne OSIA_API
   ci-dessous : il essaiera le backend puis retombera sur la KB.
   ============================================================ */

/* Moteur multilingue (FR/EN/ES) — charge i18n.js sur toutes les pages */
(function(){ if(!document.querySelector('script[src*="i18n.js"]')){ var s=document.createElement('script'); s.src='assets/i18n.js'; (document.head||document.documentElement).appendChild(s); } })();

const OSIA_API = ""; // ex: "https://api.osia-pro.com/api/chat" — vide = 100% local

/* ---- Base de connaissance (grille 2026, sans les forges supprimees du menu) ---- */
const OSIA_KB = [
  {
    kw: ["bonjour", "salut", "hello", "coucou", "bonsoir", "hey ", "yo "],
    a: "Salut 👋 Je suis OSIA-Bot. Je connais nos sites web, nos agents IA, les tarifs et les délais. Qu'est-ce que tu veux savoir ?"
  },
  {
    kw: ["c est quoi osia", "cest quoi osia", "quoi osia", "qui etes", "vous faites quoi", "presentation", "comment ca marche", "comment marche"],
    a: "OSIA est une agence **100% IA**. À partir d'un simple brief, on conçoit et on livre : des **sites web**, des **agents IA** sur-mesure, et même un **OS + cerveau** complet pour piloter ton activité. Tu commandes, l'IA produit, tu reçois ton livrable clé en main."
  },
  {
    kw: ["tarif", "prix", "cout", "combien", "coute", "budget", "cher"],
    a: "Pour le moment, nos tarifs sont **sur devis** (on n'est pas encore en vente publique). Dis-moi ton besoin via la page **Contact** ou les boutons **« Créer mon site / mon agent »**, et on te chiffre ça rapidement — devis gratuit."
  },
  {
    kw: ["site", "vitrine", "page web", "landing", "html"],
    a: "Un **site web OSIA** est généré sur-mesure depuis ton brief, livré sous **3 à 7 jours** :\n• **Basique** — vitrine, coach, artisan (4-5 sections + formulaire)\n• **Intermédiaire** — restaurant, portfolio, landing page\n• **Complexe** — e-commerce, association (panier, dons, membres)\nTarif **sur devis**. Configure-le en direct avec le bouton **« Créer mon site »**."
  },
  {
    kw: ["agent", "chatbot", "assistant", "bot ", "ia qui"],
    a: "On crée des **agents IA** sur-mesure :\n• **Simple** — fait 1 tâche précise (résumer, traduire, classer)\n• **Supérieur** — chatbot multi-outils avec mémoire, recherche web, lecture de fichiers\nIl existe aussi un **Cerveau IA** (orchestre plusieurs agents) et un **Agent Vocal**. Tarif **sur devis** — configure le tien avec **« Créer mon agent »**."
  },
  {
    kw: ["pack", "complet", "cerveau", "os ", "ecosysteme", "entreprise"],
    a: "Le **Pack Complet** = tout l'écosystème : un **OS** dédié à ton métier + un **cerveau** orchestrateur + l'accès à **30+ agents**, setup et formation inclus. Livré sous **4 semaines**, après un **audit gratuit d'1h en visio**. Tarif **sur devis**."
  },
  {
    kw: ["delai", "livraison", "quand", "combien de temps", "rapide", "vite", "jours"],
    a: "Délais : **site web 3-7 jours**, **agent IA quelques jours**, **Pack Complet ~4 semaines**. Tout est livré par email avec le **ZIP + la facture PDF**."
  },
  {
    kw: ["paiement", "payer", "paie", "paye", "regl", "moyen de paiement", "stripe", "virement", "carte", " cb", "iban", "facture", "tva"],
    a: "Paiement par **Stripe (CB)** ou **virement (IBAN sur la facture)**. Régime micro-entreprise : **TVA non applicable** (art. 293 B du CGI), tarifs HT. Échéance 30 jours possible pour les pros."
  },
  {
    kw: ["zip", "fichier", "format", "livrable", "heberg", "vercel", "ovh", "hostinger", "domaine"],
    a: "Tu reçois un **ZIP autonome** : le site/agent complet, un README et un guide d'installation. **Hébergement non inclus** — recommandé : Vercel (gratuit), OVH ou Hostinger. Le guide t'explique pas à pas."
  },
  {
    kw: ["gratuit", "free", "audit", "tableur", "essai", "tester"],
    a: "Deux **outils gratuits** sur le site : l'**Audit de site** (note ton site sur 100) et le **Tableur IA** (un prof IA intégré). Aucune carte demandée — accès depuis le menu **Outils**."
  },
  {
    kw: ["marketplace", "catalogue", "modele", "exemple", "template"],
    a: "La **Marketplace** rassemble nos modèles et briques prêts à l'emploi (sites, agents, workflows). De quoi démarrer vite — accès via le menu **Marketplace**."
  },
  {
    kw: ["commander", "commande", "contact", "demander", "devis", "parler", "joindre", "brief"],
    a: "Pour lancer un projet : clique **« Créez votre site »** ou **« Créez votre agent »** pour un brief direct, ou passe par la page **Contact** — on te répond dans la journée."
  },
  {
    kw: ["garantie", "revision", "satisfait", "rembours", "modif"],
    a: "Une **révision est incluse** si le livrable ne correspond pas à ton brief. Les conditions détaillées sont dans les **CGV**."
  },
  {
    kw: ["merci", "super", "cool", "parfait", "genial", "top"],
    a: "Avec plaisir 🚀 Une autre question ?"
  }
];

const FALLBACK = "Bonne question — je n'ai pas la réponse exacte sous la main. Le plus simple : la page **Contact** (réponse dans la journée), ou le bouton **« Créez votre site / votre agent »** pour un brief direct.";

const SUGGESTS = [
  "C'est quoi OSIA ?",
  "Vos tarifs ?",
  "Créer mon site",
  "Créer mon agent",
  "Délais de livraison ?"
];

/* accents -> rien, minuscules, ponctuation -> espace */
function osiaNorm(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ');
}

function osiaFind(question) {
  const q = ' ' + osiaNorm(question) + ' ';
  let best = null, bestScore = 0;
  for (const e of OSIA_KB) {
    let score = 0;
    for (const k of e.kw) { if (q.includes(osiaNorm(k))) score += (k.trim().includes(' ') ? 2 : 1); }
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return best ? best.a : FALLBACK;
}

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

  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + type;
    if (type === 'bot') {
      msg.innerHTML = esc(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    } else {
      msg.textContent = text;
    }
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function renderSuggests() {
    suggests.innerHTML = '';
    SUGGESTS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'chat-suggest';
      btn.textContent = s;
      btn.onclick = () => { input.value = s; handleSend(); };
      suggests.appendChild(btn);
    });
  }

  async function answerFor(q) {
    // Si un backend Claude est configure, on l'essaie puis on retombe sur la KB.
    if (OSIA_API) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch(OSIA_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q }),
          signal: ctrl.signal
        });
        clearTimeout(t);
        if (r.ok) {
          const data = await r.json();
          if (data && data.answer) return data.answer;
        }
      } catch (e) { /* backend indispo -> KB locale */ }
    }
    return osiaFind(q);
  }

  async function handleSend() {
    const q = input.value.trim();
    if (!q) return;
    addMessage(q, 'user');
    input.value = '';
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.textContent = '…';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    const a = await answerFor(q);
    typing.remove();
    addMessage(a, 'bot');
  }

  toggle.onclick = () => {
    win.classList.toggle('open');
    toggle.classList.toggle('open');
    if (win.classList.contains('open') && body.children.length === 0) {
      setTimeout(() => {
        addMessage("Salut ! Je suis **OSIA-Bot**. Pose-moi ta question sur OSIA — sites, agents IA, tarifs, délais, paiement… je connais.", 'bot');
      }, 200);
    }
  };

  send.onclick = handleSend;
  input.addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });

  renderSuggests();
}

document.addEventListener('DOMContentLoaded', osiaChatbotInit);


/* ============================================================
   OSIA - Nav auto-hide (apparait au hover en haut de l'ecran)
   ============================================================ */

function osiaNavAutohideInit() {
  const path = window.location.pathname;
  const isHome = (
    path === '/' || path === '' ||
    path.endsWith('/index.html') || path === '/index.html'
  );
  if (isHome) return;

  const nav = document.querySelector('.osia-nav');
  if (!nav) return;
  nav.classList.add('autohide');

  const hint = document.createElement('div');
  hint.className = 'nav-hint';
  hint.title = 'Survole pour afficher le menu';
  document.body.appendChild(hint);

  let hideTimer = null;
  function showNav() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    nav.classList.add('is-visible');
    hint.classList.add('faded');
  }
  function hideNav() {
    hideTimer = setTimeout(() => {
      nav.classList.remove('is-visible');
      hint.classList.remove('faded');
    }, 250);
  }

  document.addEventListener('mousemove', (e) => {
    if (e.clientY < 80) showNav();
    else if (e.clientY > 120) hideNav();
  });

  nav.addEventListener('mouseenter', showNav);
  nav.addEventListener('mouseleave', hideNav);

  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < lastScrollY && y < 100) showNav();
    lastScrollY = y;
  });
}

document.addEventListener('DOMContentLoaded', osiaNavAutohideInit);
