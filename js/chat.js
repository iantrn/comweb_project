"use strict";

const WS_URL = "ws://localhost:12345";

let socket = null;


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


function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    addChatMessage("", "Pas connecté au chat", true);
    return;
  }

  const prefix =
    typeof currentLogin !== "undefined" && currentLogin
      ? currentLogin + " : "
      : "Anonyme : ";

  socket.send(prefix + message);
  input.value = "";
}

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

function escapeHtmlChat(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


document
  .getElementById("btnSendChat")
  .addEventListener("click", sendChatMessage);

document.getElementById("chatInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatMessage();
});


document.addEventListener("DOMContentLoaded", connectChat);
