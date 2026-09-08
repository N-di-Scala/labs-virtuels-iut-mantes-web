(function () {
  const KEY = "iut_mantes_theme";

  function read() {
    try {
      const t = localStorage.getItem(KEY);
      if (t === "light" || t === "dark") return t;
    } catch (_) {}
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  function apply(t) {
    const theme = t === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch (_) {}
    const dark = theme === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(!dark));
      btn.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
      const label = btn.querySelector("[data-theme-label]");
      if (label) label.textContent = dark ? "Mode clair" : "Mode sombre";
    });
  }

  window.IUTTheme = {
    get: read,
    apply,
    toggle: function () {
      apply(read() === "dark" ? "light" : "dark");
    },
  };

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-theme-toggle]")) window.IUTTheme.toggle();
  });

  apply(read());
})();
