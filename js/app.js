"use strict";

// ============================================================
// app.js - Frontend Forum CIR2
// Gère : liste des sujets, détail, CRUD, authentification OAuth2
// ============================================================

const API_BASE = "php/request.php";

let currentTopicId = null;
let authToken = null;
let currentLogin = null;

// ============================================================
// LECTURE - Liste des sujets
// ============================================================

async function requestTopics() {
  try {
    const response = await fetch(API_BASE + "/topics/");
    if (!response.ok) {
      throw new Error("Erreur HTTP " + response.status);
    }
    const topics = await response.json();
    displayTopics(topics);
  } catch (error) {
    showError("Impossible de charger les sujets : " + error.message);
  }
}

function displayTopics(topics) {
  const container = document.getElementById("topicsList");
  container.innerHTML = "";
  if (topics.length === 0) {
    container.innerHTML =
      '<p class="text-muted">Aucun sujet pour le moment.</p>';
    return;
  }
  topics.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "card topic-card mb-2";
    card.dataset.id = topic.id;
    card.innerHTML = `
            <div class="card-body py-2">
                <h6 class="mb-1">${escapeHtml(topic.title)}</h6>
                <small class="text-muted">par ${escapeHtml(topic.userLogin)}</small>
            </div>
        `;
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".topic-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      loadTopicDetail(topic.id);
    });
    container.appendChild(card);
  });
}

// ============================================================
// LECTURE - Détail d'un sujet
// ============================================================

async function loadTopicDetail(id) {
  currentTopicId = id;
  try {
    const response = await fetch(API_BASE + "/topics/" + id);
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    const topic = await response.json();
    displayTopicDetail(topic);
    await requestReplies(id);
    updateAuthUI();
  } catch (error) {
    showError("Impossible de charger le sujet : " + error.message);
  }
}

function displayTopicDetail(topic) {
  const container = document.getElementById("topicDetail");
  container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5>${escapeHtml(topic.title)}</h5>
                <p>${escapeHtml(topic.content)}</p>
                <small class="text-muted">par ${escapeHtml(topic.userLogin)} le ${escapeHtml(topic.created_at)}</small>
                <div id="topicActions" class="mt-2 d-none">
                    <button class="btn btn-sm btn-warning" onclick="editTopic(${topic.id})">Modifier</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTopic(${topic.id})">Supprimer</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// LECTURE - Réponses
// ============================================================

async function requestReplies(topicId) {
  try {
    const response = await fetch(API_BASE + "/replies/?id=" + topicId);
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    const replies = await response.json();
    displayReplies(replies);
  } catch (error) {
    showError("Impossible de charger les réponses : " + error.message);
  }
}

function displayReplies(replies) {
  const container = document.getElementById("repliesList");
  container.innerHTML = "";
  replies.forEach((reply) => {
    const div = document.createElement("div");
    div.className = "card reply-card mb-2";
    div.innerHTML = `
            <div class="card-body py-2">
                <p class="mb-1">${escapeHtml(reply.content)}</p>
                <small class="text-muted">par ${escapeHtml(reply.userLogin)} - ${escapeHtml(reply.created_at)}</small>
                <div class="reply-actions mt-1 d-none">
                    <button class="btn btn-sm btn-warning" onclick="editReply(${reply.id})">Modifier</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReply(${reply.id})">Supprimer</button>
                </div>
            </div>
        `;
    container.appendChild(div);
  });
  updateAuthUI();
}

// ============================================================
// CRUD - Sujets
// ============================================================

document.getElementById("btnShowAddTopic").addEventListener("click", () => {
  document.getElementById("formAddTopic").classList.remove("d-none");
});

document.getElementById("btnCancelTopic").addEventListener("click", () => {
  document.getElementById("formAddTopic").classList.add("d-none");
  document.getElementById("topicTitle").value = "";
  document.getElementById("topicContent").value = "";
});

document.getElementById("btnAddTopic").addEventListener("click", async (e) => {
  const btn = e.target;
  const title = document.getElementById("topicTitle").value.trim();
  const content = document.getElementById("topicContent").value.trim();
  if (!title || !content) {
    showError("Titre et contenu obligatoires");
    return;
  }
  btn.disabled = true;
  try {
    const response = await fetch(API_BASE + "/topics/", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ title, content }),
    });
    if (response.status === 401) {
      showError("Connexion requise");
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    document.getElementById("topicTitle").value = "";
    document.getElementById("topicContent").value = "";
    document.getElementById("formAddTopic").classList.add("d-none");
    await requestTopics();
  } catch (error) {
    showError("Erreur ajout sujet : " + error.message);
  } finally {
    btn.disabled = false;
  }
});

async function editTopic(id) {
  const newTitle = prompt("Nouveau titre :");
  if (!newTitle) return;
  const newContent = prompt("Nouveau contenu :");
  if (!newContent) return;
  try {
    const response = await fetch(API_BASE + "/topics/" + id, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    if (response.status === 401) {
      showError("Connexion requise");
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    await requestTopics();
    await loadTopicDetail(id);
  } catch (error) {
    showError("Erreur modification : " + error.message);
  }
}

async function deleteTopic(id) {
  if (!confirm("Supprimer ce sujet ?")) return;
  try {
    const response = await fetch(API_BASE + "/topics/" + id, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (response.status === 401) {
      showError("Connexion requise");
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    currentTopicId = null;
    document.getElementById("topicDetail").innerHTML = "Sélectionnez un sujet…";
    document.getElementById("repliesList").innerHTML = "";
    document.getElementById("formAddReply").classList.add("d-none");
    await requestTopics();
  } catch (error) {
    showError("Erreur suppression : " + error.message);
  }
}

// ============================================================
// CRUD - Réponses
// ============================================================

document.getElementById("btnAddReply").addEventListener("click", async (e) => {
  if (!currentTopicId) return;
  const btn = e.target;
  const content = document.getElementById("replyContent").value.trim();
  if (!content) {
    showError("Réponse vide");
    return;
  }
  btn.disabled = true;
  try {
    const response = await fetch(API_BASE + "/replies/", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ topicId: currentTopicId, content }),
    });
    if (response.status === 401) {
      showError("Connexion requise");
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    document.getElementById("replyContent").value = "";
    await requestReplies(currentTopicId);
  } catch (error) {
    showError("Erreur ajout réponse : " + error.message);
  } finally {
    btn.disabled = false;
  }
});

async function editReply(id) {
  const newContent = prompt("Nouveau contenu :");
  if (!newContent) return;
  try {
    const response = await fetch(API_BASE + "/replies/" + id, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({ content: newContent }),
    });
    if (response.status === 401) {
      showError("Connexion requise");
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    await requestReplies(currentTopicId);
  } catch (error) {
    showError("Erreur modification : " + error.message);
  }
}

async function deleteReply(id) {
  if (!confirm("Supprimer cette réponse ?")) return;
  try {
    const response = await fetch(API_BASE + "/replies/" + id, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (response.status === 401) {
      showError("Connexion requise");
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    await requestReplies(currentTopicId);
  } catch (error) {
    showError("Erreur suppression : " + error.message);
  }
}

// ============================================================
// AUTHENTIFICATION OAuth2
// ============================================================

document.getElementById("btnShowLogin").addEventListener("click", () => {
  const modal = new bootstrap.Modal(document.getElementById("loginModal"));
  modal.show();
});

document.getElementById("btnDoLogin").addEventListener("click", async (e) => {
  const btn = e.target;
  const login = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  if (!login || !pass) {
    document.getElementById("loginError").textContent = "Champs requis";
    return;
  }
  btn.disabled = true;
  try {
    // OAuth2 Basic : login:password en base64 dans le header Authorization
    const credentials = btoa(login + ":" + pass);
    const response = await fetch(API_BASE + "/login/", {
      method: "POST",
      headers: {
        Authorization: "Basic " + credentials,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 401) {
      document.getElementById("loginError").textContent =
        "Identifiants invalides";
      return;
    }
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    const data = await response.json();
    authToken = data.token;
    currentLogin = login;
    document.getElementById("loginError").textContent = "";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    updateAuthUI();
  } catch (error) {
    document.getElementById("loginError").textContent = error.message;
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("btnLogout").addEventListener("click", () => {
  authToken = null;
  currentLogin = null;
  updateAuthUI();
});

// Connexion via touche Entrée dans le modal
document.getElementById("loginPass").addEventListener("keypress", (e) => {
  if (e.key === "Enter") document.getElementById("btnDoLogin").click();
});

// ============================================================
// MISE À JOUR DE L'INTERFACE selon état de connexion
// ============================================================

function updateAuthUI() {
  const loggedIn = authToken !== null;

  document.getElementById("btnShowLogin").classList.toggle("d-none", loggedIn);
  document.getElementById("userInfo").classList.toggle("d-none", !loggedIn);
  document.getElementById("currentUser").textContent = currentLogin || "";

  document
    .getElementById("btnShowAddTopic")
    .classList.toggle("d-none", !loggedIn);
  document
    .getElementById("formAddReply")
    .classList.toggle("d-none", !loggedIn || !currentTopicId);

  // Afficher/cacher les boutons modifier/supprimer
  document.querySelectorAll("#topicActions, .reply-actions").forEach((el) => {
    el.classList.toggle("d-none", !loggedIn);
  });

  // Si déconnexion, fermer le formulaire ajout sujet
  if (!loggedIn) {
    document.getElementById("formAddTopic").classList.add("d-none");
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = "Bearer " + authToken;
  }
  return headers;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const zone = document.getElementById("errorZone");
  const toast = document.createElement("div");
  toast.className = "alert alert-danger alert-dismissible";
  toast.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  zone.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  requestTopics();
  updateAuthUI();
});
