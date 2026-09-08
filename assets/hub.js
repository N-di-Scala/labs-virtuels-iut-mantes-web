(function () {
  const map = window.YOUTUBE_IDS || {};
  document.querySelectorAll(".fig").forEach((fig) => {
    const key = fig.getAttribute("data-key");
    const rec = map[key];
    const slot = fig.querySelector(".yt");
    if (!slot || !rec || !rec.id) return;
    slot.hidden = false;
    slot.innerHTML =
      '<a href="https://www.youtube.com/watch?v=' +
      encodeURIComponent(rec.id) +
      '" target="_blank" rel="noopener">Voir la vidéo</a>';
  });

  document.querySelectorAll("[data-toggle-gallery]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-toggle-gallery");
      const gallery = document.getElementById("g-" + id);
      if (!gallery) return;
      const willOpen = gallery.hidden;
      document.querySelectorAll(".lab-card .gallery").forEach((g) => {
        g.hidden = true;
      });
      document.querySelectorAll("[data-toggle-gallery]").forEach((b) => {
        b.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        gallery.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        gallery.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });
})();
