"use strict";

let authToken = null;
let currentUser = null;

document
  .getElementById("btn-login-submit")
  .addEventListener("click", async () => {
    const login = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");

    if (!login || !password) {
      errorDiv.textContent = "Veuillez remplir tous les champs.";
      errorDiv.classList.remove("d-none");
      return;
    }

    const credentials = btoa(login + ":" + password);

    try {
      const response = await fetch("/login/", {
        method: "POST",
        headers: {
          Authorization: "Basic " + credentials,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        errorDiv.textContent = "Identifiants incorrects.";
        errorDiv.classList.remove("d-none");
        return;
      }

      if (!response.ok) {
        errorDiv.textContent = "Erreur serveur, réessayez.";
        errorDiv.classList.remove("d-none");
        return;
      }

      const data = await response.json();

      authToken = data.token;
      currentUser = login;

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("loginModal"),
      );
      modal.hide();

      errorDiv.classList.add("d-none");
      document.getElementById("login-username").value = "";
      document.getElementById("login-password").value = "";

      document.getElementById("nav-logged-out").classList.add("d-none");
      document.getElementById("nav-user-info").classList.remove("d-none");
      document.getElementById("nav-username").textContent = currentUser;

      document.getElementById("btn-new-topic").classList.remove("d-none");
      document.getElementById("chat-input").disabled = false;
      document.getElementById("btn-chat-send").disabled = false;
      document.getElementById("chat-placeholder").style.display = "none";
    } catch (err) {
      errorDiv.textContent = "Impossible de contacter le serveur.";
      errorDiv.classList.remove("d-none");
    }
  });

document.getElementById("btn-logout").addEventListener("click", () => {
  authToken = null;
  currentUser = null;

  document.getElementById("nav-user-info").classList.add("d-none");
  document.getElementById("nav-logged-out").classList.remove("d-none");
  document.getElementById("btn-new-topic").classList.add("d-none");
  document.getElementById("chat-input").disabled = true;
  document.getElementById("btn-chat-send").disabled = true;
  document.getElementById("chat-placeholder").style.display = "block";
});

document.getElementById("btn-new-topic").addEventListener("click", () => {
  const form = document.getElementById("form-new-topic");
  form.style.display = form.style.display === "none" ? "block" : "none";
});

document.getElementById("btn-cancel-topic").addEventListener("click", () => {
  document.getElementById("form-new-topic").style.display = "none";
});

document
  .getElementById("btn-chat-send")
  .addEventListener("click", sendChatMessage);
document.getElementById("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

function sendChatMessage() {
  console.log("WebSocket à implémenter en S4");
}
