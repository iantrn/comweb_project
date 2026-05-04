"use strict";

// ============================================================
// chat.js - Chat WebSocket pour Forum CIR2
// IMPORTANT : remplacer WS_URL par l'IP du responsable Intégration
// ============================================================

const WS_URL = "ws://localhost:12345";

let socket = null;

// ============================================================
// CONNEXION WebSocket
// ============================================================

function connectChat() {
  try {
    socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      addChatMessage("", "Connecté au chat", true);
    });

    socket.addEventListener("message", (event) => {
      const time = new Date().toLocaleTimeString();
      addChatMessage(time, event.data, false);
    });

    socket.addEventListener("close", () => {
      addChatMessage("", "Déconnecté du chat", true);
    });

    socket.addEventListener("error", () => {
      addChatMessage("", "Erreur WebSocket - vérifiez l'IP du serveur", true);
    });
  } catch (error) {
    console.error("Erreur connexion WebSocket :", error);
    addChatMessage("", "Connexion impossible", true);
  }
}

// ============================================================
// ENVOI d'un message
// ============================================================

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    addChatMessage("", "Pas connecté au chat", true);
    return;
  }

  // On préfixe avec le login si l'utilisateur est connecté
  const prefix =
    typeof currentLogin !== "undefined" && currentLogin
      ? currentLogin + " : "
      : "Anonyme : ";

  socket.send(prefix + message);
  input.value = "";
}

// ============================================================
// AFFICHAGE des messages
// ============================================================

function addChatMessage(time, text, isSystem) {
  const box = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "chat-message";

  if (isSystem) {
    div.innerHTML = `<em class="text-muted">${escapeHtmlChat(text)}</em>`;
  } else {
    div.innerHTML = `<span class="chat-time">[${escapeHtmlChat(time)}]</span> ${escapeHtmlChat(text)}`;
  }

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// Version locale d'escapeHtml au cas où app.js ne soit pas chargé
function escapeHtmlChat(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// GESTION DES ÉVÉNEMENTS
// ============================================================

document
  .getElementById("btnSendChat")
  .addEventListener("click", sendChatMessage);

document.getElementById("chatInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

// ============================================================
// INITIALISATION - connexion automatique au chargement
// ============================================================

document.addEventListener("DOMContentLoaded", connectChat);
