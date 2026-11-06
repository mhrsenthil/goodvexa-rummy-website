(function (root) {
  "use strict";

  const storageKey = "goodvexa_lang";
  const supportedLanguages = ["ta", "en", "hi", "te", "ml", "kn", "mr", "bn", "gu", "pa"];

  function isSupported(language) {
    return supportedLanguages.includes(language);
  }

  function getLanguage() {
    const saved = root.localStorage.getItem(storageKey);
    return isSupported(saved) ? saved : null;
  }

  function setLanguage(language) {
    if (!isSupported(language)) return false;
    root.localStorage.setItem(storageKey, language);
    root.document.documentElement.lang = language;
    root.document.querySelectorAll("[data-language-selector]").forEach(selector => {
      selector.value = language;
      selector.dataset.ready = "true";
    });
    return true;
  }

  function initialize() {
    const language = getLanguage() || "ta";
    root.document.documentElement.lang = language;
    root.document.querySelectorAll("[data-language-selector]").forEach(selector => {
      selector.value = language;
      selector.dataset.ready = "true";
      selector.addEventListener("change", event => setLanguage(event.target.value));
    });
  }

  root.GoodvexaLanguage = { storageKey, supportedLanguages, getLanguage, setLanguage, initialize };
  root.document.addEventListener("DOMContentLoaded", initialize);
})(window);
