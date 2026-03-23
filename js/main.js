'use strict';

let authToken = null;
let currentUser = null;

const MOCK_TOPICS = [
  { id: 1, title: 'Bienvenue sur CIRForum !',      content: 'Premier message de test.',            userLogin: 'admin', created_at: '2025-01-01' },
  { id: 2, title: 'Questions sur le projet PHP',    content: "J'ai un souci avec PDO, quelqu'un ?", userLogin: 'alice', created_at: '2025-01-02' },
  { id: 3, title: 'Ressources Bootstrap utiles',    content: 'Voici quelques liens utiles...',       userLogin: 'bob',   created_at: '2025-01-03' },
];

const MOCK_REPLIES = {
  1: [
    { id: 1, userLogin: 'alice', content: 'Merci !',           created_at: '2025-01-01' },
    { id: 2, userLogin: 'bob',   content: 'Bon projet à tous', created_at: '2025-01-01' },
  ],
  2: [
    { id: 3, userLogin: 'admin', content: 'Utilise PDO::prepare()', created_at: '2025-01-02' },
  ],
  3: [],
};

function showTopicDetail(topicId) {
  const topic = MOCK_TOPICS.find(t => t.id === topicId);
  if (!topic) return;

  document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('active'));
  const cards = document.querySelectorAll('.topic-card');
  cards[topicId - 1]?.classList.add('active');

  document.getElementById('detail-title').textContent   = topic.title;
  document.getElementById('detail-author').textContent  = topic.userLogin;
  document.getElementById('detail-date').textContent    = topic.created_at;
  document.getElementById('detail-content').textContent = topic.content;

  const repliesList = document.getElementById('replies-list');
  repliesList.innerHTML = '';
  const replies = MOCK_REPLIES[topicId] || [];

  if (replies.length === 0) {
    repliesList.innerHTML = '<p class="text-muted small">Aucune réponse pour l\'instant.</p>';
  } else {
    replies.forEach(r => {
      const div = document.createElement('div');
      div.className = 'reply-item';
      div.innerHTML = `
        <div class="reply-author"><i class="bi bi-person-fill me-1"></i>${r.userLogin}</div>
        <div>${r.content}</div>
        <div class="text-muted" style="font-size:.75rem; margin-top:3px;">${r.created_at}</div>
      `;
      repliesList.appendChild(div);
    });
  }

  document.getElementById('form-reply').style.display      = authToken ? 'block' : 'none';
  document.getElementById('reply-login-hint').style.display = authToken ? 'none'  : 'block';

  document.getElementById('topic-detail').style.display = 'block';
}

document.getElementById('btn-new-topic').addEventListener('click', () => {
  const form = document.getElementById('form-new-topic');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('btn-cancel-topic').addEventListener('click', () => {
  document.getElementById('form-new-topic').style.display = 'none';
});

document.getElementById('btn-login-submit').addEventListener('click', () => {
  console.log('Connexion à implémenter en S5');
});

document.getElementById('btn-logout').addEventListener('click', () => {
  authToken   = null;
  currentUser = null;
  document.getElementById('nav-user-info').classList.add('d-none');
  document.getElementById('nav-logged-out').classList.remove('d-none');
  document.getElementById('btn-new-topic').classList.add('d-none');
  document.getElementById('chat-input').disabled     = true;
  document.getElementById('btn-chat-send').disabled  = true;
  document.getElementById('chat-placeholder').style.display = 'block';
});


document.getElementById('btn-chat-send').addEventListener('click', sendChatMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {

  console.log('WebSocket à implémenter en S4');
}