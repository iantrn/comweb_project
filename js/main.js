'use strict';

const API_BASE = 'php/request.php';

let currentToken = null;
let currentUser  = null;
let currentTopicId = null;


function showError(msg) {
    const banner = document.getElementById('error-banner');
    const span   = document.getElementById('error-message');
    span.textContent = msg;
    banner.style.display = 'flex';
    setTimeout(() => { banner.style.display = 'none'; }, 5000);
}

function hideError() {
    document.getElementById('error-banner').style.display = 'none';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
         + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

async function apiRequest(route, method = 'GET', body = null, authBearer = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (authBearer && currentToken) {
        headers['Authorization'] = 'Bearer ' + currentToken;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
        const res = await fetch(API_BASE + '/' + route, opts);
        if (res.status === 503) {
            showError('Serveur indisponible (503). Réessayez plus tard.');
            return null;
        }
        const data = await res.json();
        if (!res.ok) {
            showError(data.error || 'Erreur HTTP ' + res.status);
            return null;
        }
        return data;
    } catch (e) {
        showError('Impossible de contacter le serveur.');
        return null;
    }
}


async function requestTopics() {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('topics-list').innerHTML = '';
    const topics = await apiRequest('topics/');
    document.getElementById('loading-spinner').style.display = 'none';
    if (topics) displayTopics(topics);
}

function displayTopics(topics) {
    const list = document.getElementById('topics-list');
    list.innerHTML = '';
    if (topics.length === 0) {
        list.innerHTML = '<p class="text-muted small">Aucun sujet pour l\'instant.</p>';
        return;
    }
    topics.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.dataset.id = topic.id;
        card.innerHTML = `
            <h6>${escapeHtml(topic.title)}</h6>
            <div class="meta">
                <span><i class="bi bi-person-fill"></i> ${escapeHtml(topic.userLogin)}</span>
                <span><i class="bi bi-clock"></i> ${formatDate(topic.created_at)}</span>
            </div>`;
        card.addEventListener('click', () => showTopicDetail(topic.id));
        list.appendChild(card);
    });
}

async function showTopicDetail(id) {
    currentTopicId = id;

    document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('active'));
    const active = document.querySelector(`.topic-card[data-id="${id}"]`);
    if (active) active.classList.add('active');

    const topic = await apiRequest('topics/' + id);
    if (!topic) return;

    document.getElementById('detail-title').textContent   = topic.title;
    document.getElementById('detail-author').textContent  = topic.userLogin;
    document.getElementById('detail-date').textContent    = formatDate(topic.created_at);
    document.getElementById('detail-content').textContent = topic.content;

    renderTopicActions(topic);

    document.getElementById('topic-detail').style.display = 'block';

    await loadReplies(id);
}

function renderTopicActions(topic) {
    const old = document.getElementById('topic-actions');
    if (old) old.remove();

    if (!currentUser || currentUser !== topic.userLogin) return;

    const div = document.createElement('div');
    div.id = 'topic-actions';
    div.className = 'd-flex gap-2 mb-2';
    div.innerHTML = `
        <button class="btn btn-sm btn-outline-warning" id="btn-edit-topic">
            <i class="bi bi-pencil"></i> Modifier
        </button>
        <button class="btn btn-sm btn-outline-danger" id="btn-delete-topic">
            <i class="bi bi-trash"></i> Supprimer
        </button>`;
    document.getElementById('detail-title').after(div);

    document.getElementById('btn-edit-topic').addEventListener('click', () => openEditTopic(topic));
    document.getElementById('btn-delete-topic').addEventListener('click', () => deleteTopic(topic.id));
}

async function loadReplies(topicId) {
    const replies = await apiRequest('replies/?id=' + topicId);
    const list = document.getElementById('replies-list');
    list.innerHTML = '';
    if (!replies || replies.length === 0) {
        list.innerHTML = '<p class="text-muted small">Aucune réponse.</p>';
        return;
    }
    replies.forEach(r => {
        const div = document.createElement('div');
        div.className = 'reply-card';
        div.dataset.id = r.id;

        const isOwner = currentUser && currentUser === r.userLogin;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${escapeHtml(r.userLogin)}</strong>
                    <span class="text-muted small ms-2">${formatDate(r.created_at)}</span>
                </div>
                ${isOwner ? `
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-link p-0 btn-edit-reply" data-id="${r.id}" data-content="${escapeAttr(r.content)}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-link p-0 text-danger btn-delete-reply" data-id="${r.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>` : ''}
            </div>
            <p class="mb-0 mt-1">${escapeHtml(r.content)}</p>`;
        list.appendChild(div);
    });

    list.querySelectorAll('.btn-edit-reply').forEach(btn => {
        btn.addEventListener('click', () => openEditReply(btn.dataset.id, btn.dataset.content));
    });
    list.querySelectorAll('.btn-delete-reply').forEach(btn => {
        btn.addEventListener('click', () => deleteReply(btn.dataset.id));
    });
}


async function submitNewTopic() {
    const title   = document.getElementById('new-topic-title').value.trim();
    const content = document.getElementById('new-topic-content').value.trim();
    if (!title || !content) { showError('Titre et contenu requis.'); return; }

    const res = await apiRequest('topics/', 'POST', { title, content }, true);
    if (!res) return;

    document.getElementById('new-topic-title').value   = '';
    document.getElementById('new-topic-content').value = '';
    document.getElementById('form-new-topic').style.display = 'none';
    await requestTopics();
    if (res.id) showTopicDetail(res.id);
}

async function openEditTopic(topic) {
    document.getElementById('new-topic-title').value   = topic.title;
    document.getElementById('new-topic-content').value = topic.content;
    document.getElementById('form-new-topic').style.display = 'block';

    const btn = document.getElementById('btn-submit-topic');
    btn.textContent = 'Enregistrer';
    btn.onclick = async () => {
        const title   = document.getElementById('new-topic-title').value.trim();
        const content = document.getElementById('new-topic-content').value.trim();
        if (!title || !content) { showError('Titre et contenu requis.'); return; }

        const res = await apiRequest('topics/' + topic.id, 'PUT', { title, content }, true);
        if (!res) return;

        document.getElementById('form-new-topic').style.display = 'none';
        resetTopicForm();
        await requestTopics();
        await showTopicDetail(topic.id);
    };
}

function resetTopicForm() {
    const btn = document.getElementById('btn-submit-topic');
    btn.textContent = 'Publier';
    btn.onclick = submitNewTopic;
    document.getElementById('new-topic-title').value   = '';
    document.getElementById('new-topic-content').value = '';
}

async function deleteTopic(id) {
    if (!confirm('Supprimer ce sujet et toutes ses réponses ?')) return;
    const res = await apiRequest('topics/' + id, 'DELETE', null, true);
    if (!res) return;
    document.getElementById('topic-detail').style.display = 'none';
    await requestTopics();
}


async function submitReply() {
    const content = document.getElementById('reply-content').value.trim();
    if (!content) { showError('La réponse ne peut pas être vide.'); return; }

    const res = await apiRequest('replies/', 'POST', { topicId: currentTopicId, content }, true);
    if (!res) return;

    document.getElementById('reply-content').value = '';
    await loadReplies(currentTopicId);
}

async function openEditReply(id, content) {
    document.getElementById('reply-content').value = content;
    const btn = document.getElementById('btn-submit-reply');
    btn.textContent = 'Enregistrer';
    btn.onclick = async () => {
        const newContent = document.getElementById('reply-content').value.trim();
        if (!newContent) { showError('La réponse ne peut pas être vide.'); return; }
        const res = await apiRequest('replies/' + id, 'PUT', { content: newContent }, true);
        if (!res) return;
        document.getElementById('reply-content').value = '';
        resetReplyForm();
        await loadReplies(currentTopicId);
    };
}

function resetReplyForm() {
    const btn = document.getElementById('btn-submit-reply');
    btn.textContent = 'Répondre';
    btn.onclick = submitReply;
}

async function deleteReply(id) {
    if (!confirm('Supprimer cette réponse ?')) return;
    const res = await apiRequest('replies/' + id, 'DELETE', null, true);
    if (!res) return;
    await loadReplies(currentTopicId);
}


async function login(loginVal, passwordVal) {
    const credentials = btoa(loginVal + ':' + passwordVal);
    let res;
    try {
        const response = await fetch(API_BASE + '/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + credentials
            }
        });
        res = await response.json();
        if (!response.ok) {
            showError(res.error || 'Identifiants invalides');
            return false;
        }
    } catch (e) {
        showError('Impossible de contacter le serveur.');
        return false;
    }

    currentToken = res.token;
    currentUser  = res.login;
    updateUIAfterLogin();
    return true;
}

function logout() {
    currentToken = null;
    currentUser  = null;
    updateUIAfterLogout();
}

function updateUIAfterLogin() {
    document.getElementById('nav-logged-out').classList.add('d-none');
    document.getElementById('nav-user-info').classList.remove('d-none');
    document.getElementById('nav-username').textContent = currentUser;
    document.getElementById('btn-new-topic').classList.remove('d-none');

    const formReply = document.getElementById('form-reply');
    if (formReply) formReply.style.display = 'block';
    const hint = document.getElementById('reply-login-hint');
    if (hint) hint.style.display = 'none';

    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (modal) modal.hide();

    requestTopics();
    if (currentTopicId) showTopicDetail(currentTopicId);
}

function updateUIAfterLogout() {
    document.getElementById('nav-logged-out').classList.remove('d-none');
    document.getElementById('nav-user-info').classList.add('d-none');
    document.getElementById('nav-username').textContent = '';
    document.getElementById('btn-new-topic').classList.add('d-none');
    document.getElementById('form-new-topic').style.display = 'none';

    const formReply = document.getElementById('form-reply');
    if (formReply) formReply.style.display = 'none';
    const hint = document.getElementById('reply-login-hint');
    if (hint) hint.style.display = 'block';

    requestTopics();
    if (currentTopicId) showTopicDetail(currentTopicId);
}


function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('topic-detail').style.display    = 'none';
    document.getElementById('form-new-topic').style.display  = 'none';
    document.getElementById('error-banner').style.display    = 'none';

    const formReply = document.getElementById('form-reply');
    if (formReply) formReply.style.display = 'none';

    requestTopics();

    document.getElementById('btn-new-topic').addEventListener('click', () => {
        const form = document.getElementById('form-new-topic');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        resetTopicForm();
    });

    document.getElementById('btn-submit-topic').addEventListener('click', submitNewTopic);

    document.getElementById('btn-cancel-topic').addEventListener('click', () => {
        document.getElementById('form-new-topic').style.display = 'none';
        resetTopicForm();
    });

    document.getElementById('btn-submit-reply').addEventListener('click', submitReply);

    document.getElementById('reply-content').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitReply();
        }
    });

    document.getElementById('btn-login-submit').addEventListener('click', async () => {
        const loginVal    = document.getElementById('login-username').value.trim();
        const passwordVal = document.getElementById('login-password').value;
        if (!loginVal || !passwordVal) {
            document.getElementById('login-error').textContent = 'Login et mot de passe requis.';
            document.getElementById('login-error').classList.remove('d-none');
            return;
        }
        document.getElementById('login-error').classList.add('d-none');
        await login(loginVal, passwordVal);
    });

    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('btn-login-submit').click();
    });

    document.getElementById('btn-logout').addEventListener('click', logout);
});
