
function showMessage(message) {
  const box = document.getElementById("message");

  box.textContent = message;
  box.style.display = "block";

  clearTimeout(window.messageTimer);

  window.messageTimer = setTimeout(function () {
    box.style.display = "none";
  }, 3000);
}
